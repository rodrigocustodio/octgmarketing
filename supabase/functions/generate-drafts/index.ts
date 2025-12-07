import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const CRON_SECRET = Deno.env.get('CRON_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Region detection keywords
const REGION_KEYWORDS: Record<string, string[]> = {
  'middle-east': ['saudi', 'arabia', 'uae', 'emirates', 'qatar', 'kuwait', 'oman', 'bahrain', 'iraq', 'iran', 'abu dhabi', 'dubai', 'doha', 'riyadh', 'jeddah', 'aramco', 'adnoc'],
  'americas': ['usa', 'united states', 'texas', 'permian', 'gulf of mexico', 'canada', 'alberta', 'mexico', 'brazil', 'argentina', 'venezuela', 'colombia', 'houston', 'oklahoma', 'north dakota', 'bakken', 'eagle ford', 'marcellus'],
  'europe': ['north sea', 'norway', 'uk', 'united kingdom', 'netherlands', 'germany', 'france', 'italy', 'spain', 'romania', 'poland', 'denmark', 'equinor', 'shell', 'bp'],
  'asia-pacific': ['china', 'india', 'australia', 'indonesia', 'malaysia', 'vietnam', 'thailand', 'japan', 'south korea', 'singapore', 'brunei', 'papua new guinea', 'woodside', 'santos'],
  'africa': ['nigeria', 'angola', 'libya', 'algeria', 'egypt', 'ghana', 'mozambique', 'tanzania', 'kenya', 'south africa', 'senegal', 'mauritania'],
  'russia-cis': ['russia', 'kazakhstan', 'azerbaijan', 'turkmenistan', 'uzbekistan', 'gazprom', 'rosneft', 'lukoil', 'siberia', 'sakhalin']
};

const SYSTEM_PROMPT = `You are a senior energy industry editor for a corporate OCTG (Oil Country Tubular Goods) news portal. Your task is to rewrite source articles into professional, authoritative corporate content.

EDITORIAL GUIDELINES:
- Write in a professional, authoritative voice appropriate for C-suite executives and industry professionals
- Focus on market implications, business impact, and strategic significance
- Use proper OCTG and oil & gas terminology (e.g., casing, tubing, line pipe, seamless vs welded, API grades)
- Maintain factual accuracy - do not add information not present in the source
- Structure content with clear sections using Markdown headers
- Lead with the most newsworthy angle
- Include relevant context for industry professionals

OUTPUT FORMAT (JSON):
{
  "title": "Compelling headline under 100 characters",
  "excerpt": "2-3 sentence summary highlighting key business impact (max 200 characters)",
  "body_markdown": "Full article in Markdown with ## headers for sections",
  "tags": ["array", "of", "relevant", "tags"]
}

CONTENT STRUCTURE:
1. Lead paragraph: Key news and immediate impact
2. Context section: Background and market context
3. Details section: Specifics, quotes, figures
4. Implications section: What this means for the industry
5. Outlook (if applicable): Future expectations

Always return valid JSON only, no additional text.`;

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 80)
    .replace(/^-|-$/g, '');
}

function detectRegion(content: string, regions: Array<{ id: string; slug: string }>): string | null {
  const lowerContent = content.toLowerCase();
  
  for (const [regionSlug, keywords] of Object.entries(REGION_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerContent.includes(keyword)) {
        const region = regions.find(r => r.slug === regionSlug);
        if (region) {
          return region.id;
        }
      }
    }
  }
  
  return null;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    const cronSecret = req.headers.get('x-cron-secret');
    
    let isAuthorized = false;
    
    // Check cron secret first
    if (cronSecret && cronSecret === CRON_SECRET) {
      isAuthorized = true;
      console.log('Authorized via CRON_SECRET');
    }
    
    // If not cron, check for authenticated admin/editor
    if (!isAuthorized && authHeader) {
      const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
      
      if (!authError && user) {
        const { data: roles } = await supabaseAuth
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);
        
        const userRoles = roles?.map(r => r.role) || [];
        if (userRoles.includes('admin') || userRoles.includes('editor')) {
          isAuthorized = true;
          console.log('Authorized via user role:', userRoles);
        }
      }
    }
    
    if (!isAuthorized) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Create Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch regions for detection
    const { data: regions, error: regionsError } = await supabase
      .from('regions')
      .select('id, slug');
    
    if (regionsError) {
      console.error('Error fetching regions:', regionsError);
    }

    // Fetch source articles with status='new' (limit 10 per run)
    const { data: sourceArticles, error: fetchError } = await supabase
      .from('source_articles')
      .select('*')
      .eq('status', 'new')
      .order('scraped_at', { ascending: true })
      .limit(10);

    if (fetchError) {
      throw new Error(`Failed to fetch source articles: ${fetchError.message}`);
    }

    if (!sourceArticles || sourceArticles.length === 0) {
      console.log('No new source articles to process');
      return new Response(
        JSON.stringify({ message: 'No new articles to process', processed: 0, failed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${sourceArticles.length} source articles`);

    let processed = 0;
    let failed = 0;
    const results: Array<{ sourceId: string; status: string; draftId?: string; error?: string }> = [];

    for (const source of sourceArticles) {
      try {
        console.log(`Processing source article: ${source.id} - ${source.title}`);

        // Call OpenAI API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { 
                role: 'user', 
                content: `Rewrite this article for our OCTG corporate news portal:\n\nTitle: ${source.title}\n\nContent:\n${source.raw_content || 'No content available'}\n\nSource: ${source.source_name}\nOriginal URL: ${source.source_url}` 
              }
            ],
            temperature: 0.7,
            max_tokens: 2000,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content;

        if (!content) {
          throw new Error('No content returned from OpenAI');
        }

        // Parse JSON response
        let parsed;
        try {
          // Try to extract JSON from the response (in case there's extra text)
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsed = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('No JSON found in response');
          }
        } catch (parseError) {
          console.error('Failed to parse OpenAI response:', content);
          throw new Error(`Failed to parse OpenAI response: ${parseError}`);
        }

        // Generate slug
        const baseSlug = generateSlug(parsed.title);
        const timestamp = Date.now().toString(36);
        const slug = `${baseSlug}-${timestamp}`;

        // Detect region from content
        const fullContent = `${source.title} ${source.raw_content || ''} ${parsed.body_markdown}`;
        const regionId = detectRegion(fullContent, regions || []);

        // Insert draft article
        const { data: draft, error: insertError } = await supabase
          .from('draft_articles')
          .insert({
            source_article_id: source.id,
            title: parsed.title,
            excerpt: parsed.excerpt,
            body_markdown: parsed.body_markdown,
            tags: parsed.tags || [],
            slug: slug,
            region_id: regionId,
            hero_image_url: source.image_url,
            status: 'pending_review'
          })
          .select('id')
          .single();

        if (insertError) {
          throw new Error(`Failed to insert draft: ${insertError.message}`);
        }

        // Update source article status
        const { error: updateError } = await supabase
          .from('source_articles')
          .update({ status: 'processed' })
          .eq('id', source.id);

        if (updateError) {
          console.error('Failed to update source status:', updateError);
        }

        processed++;
        results.push({ sourceId: source.id, status: 'success', draftId: draft.id });
        console.log(`Successfully created draft: ${draft.id} for source: ${source.id}`);

      } catch (articleError) {
        failed++;
        const errorMessage = articleError instanceof Error ? articleError.message : 'Unknown error';
        console.error(`Failed to process source ${source.id}:`, errorMessage);
        results.push({ sourceId: source.id, status: 'failed', error: errorMessage });
        
        // Mark source as failed to prevent retrying indefinitely
        await supabase
          .from('source_articles')
          .update({ status: 'failed' })
          .eq('id', source.id);
      }
    }

    console.log(`Processing complete. Processed: ${processed}, Failed: ${failed}`);

    return new Response(
      JSON.stringify({
        message: 'Draft generation complete',
        processed,
        failed,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Generate drafts error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
