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

// Region detection keywords - CRITICAL: Accurate region identification
const REGION_KEYWORDS: Record<string, string[]> = {
  'middle-east': ['saudi', 'arabia', 'uae', 'emirates', 'qatar', 'kuwait', 'oman', 'bahrain', 'iraq', 'iran', 'abu dhabi', 'dubai', 'doha', 'riyadh', 'jeddah', 'aramco', 'adnoc', 'muscat', 'manama', 'yemen', 'jordan', 'opec'],
  'americas': ['usa', 'united states', 'texas', 'permian', 'gulf of mexico', 'canada', 'alberta', 'mexico', 'brazil', 'argentina', 'venezuela', 'colombia', 'houston', 'oklahoma', 'north dakota', 'bakken', 'eagle ford', 'marcellus', 'delaware basin', 'midland', 'guyana', 'suriname', 'ecuador', 'peru', 'trinidad', 'petrobras', 'pemex', 'ecopetrol'],
  'europe': ['north sea', 'norway', 'uk', 'united kingdom', 'netherlands', 'germany', 'france', 'italy', 'spain', 'romania', 'poland', 'denmark', 'equinor', 'scottish', 'aberdeen', 'stavanger', 'totalenergies', 'eni'],
  'asia-pacific': ['china', 'india', 'indonesia', 'malaysia', 'vietnam', 'thailand', 'japan', 'south korea', 'singapore', 'brunei', 'papua new guinea', 'philippines', 'taiwan', 'myanmar', 'cnpc', 'cnooc', 'sinopec', 'petrochina', 'reliance', 'petronas', 'pertamina', 'ongc'],
  'africa': ['nigeria', 'angola', 'libya', 'algeria', 'egypt', 'ghana', 'mozambique', 'tanzania', 'kenya', 'south africa', 'senegal', 'mauritania', 'congo', 'cameroon', 'gabon', 'ivory coast', 'namibia', 'uganda', 'nnpc', 'sonatrach', 'sonangol'],
  'australia': ['australia', 'queensland', 'western australia', 'northern territory', 'bass strait', 'perth', 'darwin', 'gladstone', 'woodside', 'santos', 'beach energy', 'origin energy', 'cooper basin', 'carnarvon basin', 'browse basin', 'gorgon', 'wheatstone', 'ichthys', 'prelude'],
  'global': ['global', 'worldwide', 'international', 'multiple regions', 'cross-border']
};

// Topic detection keywords - All 10 database topics
const TOPIC_KEYWORDS: Record<string, string[]> = {
  'mills-manufacturing': ['mill', 'manufacturing', 'production', 'capacity', 'steel', 'seamless', 'welded', 'pipe plant', 'factory', 'output', 'rolling', 'forge', 'threading', 'heat treatment', 'casing', 'tubing'],
  'yards-supply-chain': ['yard', 'stockyard', 'inventory', 'supply chain', 'logistics', 'distribution', 'warehouse', 'storage', 'distributor', 'supplier', 'delivery', 'procurement'],
  'pricing-market': ['price', 'pricing', 'market', 'tariff', 'import', 'export', 'trade', 'duty', 'cost', 'demand', 'forecast', 'analysis', 'revenue', 'margin', 'profit', 'premium'],
  'projects-contracts': ['project', 'contract', 'tender', 'award', 'development', 'exploration', 'field', 'greenfield', 'brownfield', 'fid', 'final investment', 'epc'],
  'rigs-wellsite': ['rig', 'well', 'drilling', 'completion', 'workover', 'offshore', 'onshore', 'derrick', 'blowout', 'spud', 'perforation', 'jackup', 'drillship', 'semisubmersible'],
  'careers-people': ['ceo', 'appointed', 'hire', 'executive', 'leadership', 'president', 'director', 'retirement', 'succession', 'board', 'management', 'chief'],
  'companies-strategy': ['merger', 'acquisition', 'joint venture', 'partnership', 'investment', 'expansion', 'strategy', 'restructuring', 'divestment', 'ipo', 'buyout'],
  'hse-regulations': ['safety', 'environment', 'regulation', 'compliance', 'emission', 'incident', 'inspection', 'audit', 'epa', 'api', 'standard', 'certification', 'carbon'],
  'ports-terminals': ['port', 'terminal', 'harbor', 'berth', 'loading', 'unloading', 'freight', 'shipping', 'vessel', 'cargo', 'maritime'],
  'technology-digitalization': ['digital', 'technology', 'automation', 'ai', 'artificial intelligence', 'iot', 'sensor', 'software', 'data', 'analytics', 'machine learning', 'innovation']
};

const SYSTEM_PROMPT = `You are a senior energy industry editor for OCTG Index, a leading corporate OCTG (Oil Country Tubular Goods) news portal. Your task is to rewrite source content into professional, authoritative ORIGINAL editorial content.

CRITICAL RULES - MUST FOLLOW:
- NEVER mention, reference, or credit ANY external source publication (e.g., "World Oil", "Rigzone", "Reuters", "Oil & Gas Journal", "Upstream", "Offshore Engineer")
- NEVER include phrases like "according to [publication]", "reported by [source]", or "Connect with [publication]"
- NEVER include calls-to-action directing readers to external publications or websites
- Write as if this is ORIGINAL OCTG Index reporting and analysis
- All content must appear as authentic OCTG Index editorial work with ZERO attribution to outside sources
- Do NOT mention where the information came from - present it as your own reporting

EDITORIAL GUIDELINES:
- Write in a professional, authoritative voice appropriate for C-suite executives and industry professionals
- Focus on market implications, business impact, and strategic significance
- Use proper OCTG and oil & gas terminology (e.g., casing, tubing, line pipe, seamless vs welded, API grades)
- Maintain factual accuracy - do not add information not present in the source
- Structure content with clear sections using Markdown headers
- Lead with the most newsworthy angle
- Include relevant context for industry professionals

ARTICLE LENGTH REQUIREMENTS:
- Target length: 800-1200 words MINIMUM
- Include detailed analysis and comprehensive market context
- Each section should be substantive with multiple paragraphs (3-5 paragraphs per section)
- Provide in-depth coverage and thorough analysis, not just a brief summary
- Expand on implications, market context, and strategic significance

OUTPUT FORMAT (JSON):
{
  "title": "Compelling headline under 100 characters",
  "excerpt": "2-3 sentence summary highlighting key business impact (max 200 characters)",
  "body_markdown": "Full article in Markdown with ## headers for sections (800-1200 words minimum)",
  "tags": ["array", "of", "relevant", "tags"],
  "suggested_topics": ["mills-manufacturing", "pricing-market"],
  "mentioned_companies": ["Company Name 1", "Company Name 2"],
  "mentioned_countries": ["Country1", "Country2"]
}

CONTENT STRUCTURE (each section should be substantive):
1. Lead paragraph: Key news and immediate impact (2-3 paragraphs)
2. Context section: Background and market context (3-4 paragraphs)
3. Details section: Specifics, quotes, figures (3-4 paragraphs)
4. Implications section: What this means for the industry (2-3 paragraphs)
5. Outlook: Future expectations and strategic considerations (2-3 paragraphs)

ENTITY EXTRACTION:
- Identify and list any OCTG manufacturers, operators, or service companies mentioned
- List countries specifically mentioned in the article
- Suggest relevant topic categories from: mills-manufacturing, yards-supply-chain, pricing-market, projects-contracts, rigs-wellsite, careers-people, companies-strategy, hse-regulations, ports-terminals, technology-digitalization

GEOGRAPHIC REGION IDENTIFICATION - CRITICAL:
- Carefully identify the PRIMARY geographic region of the news (where the main activity/event occurs)
- Use one of: middle-east, americas, europe, asia-pacific, africa, australia, global
- For news involving multiple regions, identify the PRIMARY focus
- Use country/city/company mentions to determine region accurately
- Return your region selection in the "primary_region" field

OUTPUT must include:
{
  ...
  "primary_region": "middle-east" // or americas, europe, asia-pacific, africa, australia, global
}

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

function detectTopics(content: string, topics: Array<{ id: string; slug: string }>): string[] {
  const lowerContent = content.toLowerCase();
  const topicScores: Array<{ topicId: string; score: number }> = [];
  
  for (const [topicSlug, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    let score = 0;
    
    // Count how many keywords match for this topic
    for (const keyword of keywords) {
      if (lowerContent.includes(keyword)) {
        score++;
      }
    }
    
    // Only consider topics with at least 2 keyword matches
    if (score >= 2) {
      const topic = topics.find(t => t.slug === topicSlug);
      if (topic) {
        topicScores.push({ topicId: topic.id, score });
      }
    }
  }
  
  // Sort by score (highest first) and take top 2
  topicScores.sort((a, b) => b.score - a.score);
  
  // Return maximum 2 topic IDs
  return topicScores.slice(0, 2).map(ts => ts.topicId);
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

    // Fetch topics for detection
    const { data: topics, error: topicsError } = await supabase
      .from('topics')
      .select('id, slug');
    
    if (topicsError) {
      console.error('Error fetching topics:', topicsError);
    }

    // Fetch companies for matching
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name');
    
    if (companiesError) {
      console.error('Error fetching companies:', companiesError);
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
                content: `Rewrite this as original OCTG Index editorial content (800-1200 words minimum). Do NOT reference or credit any external source:\n\nTitle: ${source.title}\n\nContent:\n${source.raw_content || 'No content available'}` 
              }
            ],
            temperature: 0.7,
            max_tokens: 4000,
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

        // Detect region from content - prioritize AI-suggested region
        const fullContent = `${source.title} ${source.raw_content || ''} ${parsed.body_markdown}`;
        let regionId: string | null = null;
        
        // First, try to use AI-suggested primary_region
        if (parsed.primary_region) {
          const aiRegion = regions?.find(r => r.slug === parsed.primary_region);
          if (aiRegion) {
            regionId = aiRegion.id;
            console.log(`Using AI-suggested region: ${parsed.primary_region}`);
          }
        }
        
        // Fallback to keyword detection if AI didn't provide valid region
        if (!regionId) {
          regionId = detectRegion(fullContent, regions || []);
          console.log(`Using keyword-detected region: ${regionId}`);
        }
        
        // Detect topics from content
        const suggestedTopicIds = detectTopics(fullContent, topics || []);
        
        // Match mentioned companies to database IDs
        const matchedCompanyIds: string[] = [];
        if (parsed.mentioned_companies && companies) {
          const lowerContent = fullContent.toLowerCase();
          for (const company of companies) {
            const companyNameLower = company.name.toLowerCase();
            // Check if company name appears in content or AI-extracted list
            if (lowerContent.includes(companyNameLower) || 
                parsed.mentioned_companies.some((m: string) => 
                  m.toLowerCase().includes(companyNameLower) || 
                  companyNameLower.includes(m.toLowerCase())
                )) {
              matchedCompanyIds.push(company.id);
            }
          }
        }

        // Combine AI suggestions with detected entities
        const allTags = [
          ...(parsed.tags || []),
          ...(parsed.mentioned_companies || []),
          ...(parsed.mentioned_countries || []),
        ];

        // Insert draft article with enhanced metadata including suggested IDs
        const { data: draft, error: insertError } = await supabase
          .from('draft_articles')
          .insert({
            source_article_id: source.id,
            title: parsed.title,
            excerpt: parsed.excerpt,
            body_markdown: parsed.body_markdown,
            tags: allTags,
            slug: slug,
            region_id: regionId,
            hero_image_url: source.image_url,
            status: 'pending_review',
            suggested_topic_ids: suggestedTopicIds,
            suggested_company_ids: matchedCompanyIds
          })
          .select('id')
          .single();

        if (insertError) {
          throw new Error(`Failed to insert draft: ${insertError.message}`);
        }

        // Log extracted metadata
        console.log(`Draft ${draft.id} metadata:`, {
          regionId,
          suggestedTopicIds,
          matchedCompanyIds,
          mentionedCompanies: parsed.mentioned_companies,
          mentionedCountries: parsed.mentioned_countries,
          primaryRegion: parsed.primary_region
        });

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
