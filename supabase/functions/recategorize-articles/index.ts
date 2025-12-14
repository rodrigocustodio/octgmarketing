import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Official 30-category list matching database slugs
const OFFICIAL_CATEGORIES = [
  { slug: 'breaking-news', name: 'Breaking News', description: 'Urgent, time-sensitive industry developments' },
  { slug: 'ceo-news', name: 'CEO News', description: 'Executive appointments, CEO interviews, leadership changes' },
  { slug: 'mills-manufacturing', name: 'Mills & Manufacturing', description: 'Steel mills, pipe manufacturing, production capacity' },
  { slug: 'yards-supply-chain', name: 'Yards & Supply Chain', description: 'Stockyards, inventory, logistics, distribution' },
  { slug: 'pricing-market', name: 'Pricing & Market', description: 'Price trends, tariffs, import/export, trade policy' },
  { slug: 'projects-contracts', name: 'Projects & Contracts', description: 'Field developments, contract awards, tenders, EPC' },
  { slug: 'rigs-wellsite', name: 'Rigs & Wellsite', description: 'Drilling rigs, well completions, rig counts' },
  { slug: 'careers-people', name: 'Careers & People', description: 'Industry careers, workforce, hiring' },
  { slug: 'companies-strategy', name: 'Companies & Strategy', description: 'Corporate strategy, company news, expansion' },
  { slug: 'hse-regulations', name: 'HSE & Regulations', description: 'Health safety environment, regulatory compliance' },
  { slug: 'ports-terminals', name: 'Ports & Terminals', description: 'Port operations, marine terminals, shipping' },
  { slug: 'technology-digitalization', name: 'Technology & Digitalization', description: 'Digital transformation, AI, automation' },
  { slug: 'gas-lng', name: 'Gas & LNG', description: 'Natural gas production, LNG, gas processing' },
  { slug: 'oil', name: 'Oil', description: 'Crude oil production, oil fields, reserves' },
  { slug: 'energy-events', name: 'Energy Events', description: 'Conferences, trade shows, industry events' },
  { slug: 'offshore-subsea', name: 'Offshore & Subsea', description: 'Offshore drilling, subsea infrastructure, deepwater' },
  { slug: 'onshore-operations', name: 'Onshore Operations', description: 'Land-based drilling, shale, unconventional' },
  { slug: 'mergers-acquisitions', name: 'Mergers & Acquisitions', description: 'M&A activity, acquisitions, divestitures' },
  { slug: 'earnings-financials', name: 'Earnings & Financials', description: 'Quarterly earnings, financial results' },
  { slug: 'energy-transition', name: 'Energy Transition', description: 'Renewable integration, decarbonization, hydrogen' },
  { slug: 'pipeline-infrastructure', name: 'Pipeline Infrastructure', description: 'Pipeline projects, midstream, LNG terminals' },
  { slug: 'inspection-quality', name: 'Inspection & Quality', description: 'QA/QC, non-destructive testing, certification' },
  { slug: 'geopolitical', name: 'Geopolitical', description: 'Sanctions, OPEC, policy, government' },
  { slug: 'logistics', name: 'Logistics', description: 'Transport, shipping, freight, delivery' },
  { slug: 'scm-solutions', name: 'SCM Solutions', description: 'Supply chain management, ERP, tracking' },
  { slug: 'product-news', name: 'Product News', description: 'Product launches, innovations, equipment' },
  { slug: 'regional-coverage', name: 'Regional Coverage', description: 'Regional, local, country-specific news' },
  { slug: 'ai-energy', name: 'AI & Energy', description: 'AI, machine learning, predictive analytics' },
  { slug: 'educational', name: 'Educational', description: 'Guides, how-to, explainers, basics' },
  { slug: 'safety', name: 'Safety', description: 'Accidents, hazards, safety records' },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const userRoles = roles?.map(r => r.role) || [];
    if (!userRoles.includes('admin') && !userRoles.includes('editor')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - admin or editor role required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!PERPLEXITY_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Perplexity API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { article_id, batch_size = 10, offset = 0 } = body;

    // Fetch topics from database to get IDs
    const { data: dbTopics, error: topicsError } = await supabase
      .from('topics')
      .select('id, slug, name');

    if (topicsError) {
      throw new Error(`Failed to fetch topics: ${topicsError.message}`);
    }

    const topicMap = new Map(dbTopics?.map(t => [t.slug, t.id]) || []);

    // Build category list for AI prompt
    const categoryList = OFFICIAL_CATEGORIES.map(c => 
      `- ${c.slug}: ${c.name} (${c.description})`
    ).join('\n');

    // Fetch articles to recategorize
    let articlesQuery = supabase
      .from('articles')
      .select('id, title, body, subtitle')
      .in('status', ['published', 'featured'])
      .order('publish_date', { ascending: false });

    if (article_id) {
      // Single article mode
      articlesQuery = articlesQuery.eq('id', article_id);
    } else {
      // Batch mode with offset for pagination
      articlesQuery = articlesQuery.range(offset, offset + batch_size - 1);
    }

    const { data: articles, error: articlesError } = await articlesQuery;

    if (articlesError) {
      throw new Error(`Failed to fetch articles: ${articlesError.message}`);
    }

    if (!articles || articles.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No articles to recategorize', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${articles.length} articles for recategorization`);

    const results: Array<{
      articleId: string;
      title: string;
      oldCategories: string[];
      newCategory: string;
      confidence: number;
      status: 'success' | 'error';
      error?: string;
    }> = [];

    for (const article of articles) {
      try {
        // Get current categories
        const { data: currentTopics } = await supabase
          .from('article_topics')
          .select('topic_id, topics(slug)')
          .eq('article_id', article.id);

        const oldCategories = currentTopics?.map(t => (t.topics as any)?.slug).filter(Boolean) || [];

        // Truncate body to first 2000 chars for API efficiency
        const contentSample = (article.body || '').substring(0, 2000);

        // Call Perplexity to analyze and categorize
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'sonar',
            messages: [
              {
                role: 'system',
                content: `You are a content categorization expert for OCTG Index, an energy industry news platform. 
                
Your task is to analyze article content and assign the SINGLE BEST matching category from the official list below.

OFFICIAL CATEGORY LIST:
${categoryList}

RULES:
1. Return ONLY valid JSON with this exact structure: {"category_slug": "slug-here", "confidence": 0.0-1.0, "reason": "brief explanation"}
2. Choose the SINGLE BEST category - not multiple
3. Confidence should reflect how well the article matches the category
4. Consider the article title, subtitle, and body content
5. For articles about specific topics (earnings, M&A, executives), use the specific category over general ones`
              },
              {
                role: 'user',
                content: `Categorize this article:

Title: ${article.title}
Subtitle: ${article.subtitle || 'None'}
Body excerpt: ${contentSample}`
              }
            ],
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';

        // Parse JSON response
        let parsed;
        try {
          const jsonMatch = content.match(/\{[\s\S]*?\}/);
          if (jsonMatch) {
            parsed = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('No JSON found in response');
          }
        } catch (e) {
          console.error(`Failed to parse response for article ${article.id}:`, content);
          throw new Error('Failed to parse AI response');
        }

        const newCategorySlug = parsed.category_slug;
        const confidence = parsed.confidence || 0.5;
        const newTopicId = topicMap.get(newCategorySlug);

        if (!newTopicId) {
          console.warn(`Category ${newCategorySlug} not found in database, skipping article ${article.id}`);
          results.push({
            articleId: article.id,
            title: article.title,
            oldCategories,
            newCategory: newCategorySlug,
            confidence,
            status: 'error',
            error: `Category ${newCategorySlug} not found in database`
          });
          continue;
        }

        // Update article_topics: delete old, insert new
        await supabase
          .from('article_topics')
          .delete()
          .eq('article_id', article.id);

        await supabase
          .from('article_topics')
          .insert({ article_id: article.id, topic_id: newTopicId });

        console.log(`Recategorized article ${article.id}: ${oldCategories.join(',')} → ${newCategorySlug} (${confidence})`);

        results.push({
          articleId: article.id,
          title: article.title,
          oldCategories,
          newCategory: newCategorySlug,
          confidence,
          status: 'success'
        });

        // Rate limiting: wait 500ms between API calls
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`Error processing article ${article.id}:`, error);
        results.push({
          articleId: article.id,
          title: article.title,
          oldCategories: [],
          newCategory: '',
          confidence: 0,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    return new Response(
      JSON.stringify({
        success: true,
        processed: articles.length,
        successful: successCount,
        errors: errorCount,
        results: results.map(r => ({
          article_id: r.articleId,
          title: r.title,
          old_category: r.oldCategories[0] || null,
          new_category: r.newCategory,
          confidence: r.confidence,
          success: r.status === 'success',
          error: r.error
        }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in recategorize-articles:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
