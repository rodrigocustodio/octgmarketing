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

// Official 30-category topic detection keywords
const TOPIC_KEYWORDS: Record<string, string[]> = {
  'breaking-news': ['breaking', 'urgent', 'just in', 'developing', 'alert', 'flash'],
  'ceo-news': ['ceo', 'chief executive', 'executive appointment', 'ceo interview', 'ceo statement', 'leadership change'],
  'mills-manufacturing': ['mill', 'manufacturing', 'production', 'capacity', 'steel', 'seamless', 'welded', 'pipe plant', 'factory', 'output', 'rolling', 'forge', 'threading', 'heat treatment', 'casing', 'tubing'],
  'yards-supply-chain': ['yard', 'stockyard', 'inventory', 'supply chain', 'logistics', 'distribution', 'warehouse', 'storage', 'distributor', 'supplier', 'delivery', 'procurement'],
  'pricing-market': ['price', 'pricing', 'market', 'tariff', 'import', 'export', 'trade', 'duty', 'cost', 'demand', 'forecast', 'revenue', 'margin', 'profit', 'premium'],
  'projects-contracts': ['project', 'contract', 'tender', 'award', 'development', 'field', 'greenfield', 'brownfield', 'fid', 'final investment', 'epc'],
  'rigs-wellsite': ['rig', 'well', 'drilling', 'completion', 'workover', 'derrick', 'blowout', 'spud', 'perforation', 'jackup', 'drillship', 'semisubmersible', 'rig count'],
  'careers-people': ['appointed', 'hire', 'hiring', 'workforce', 'career', 'job', 'employment', 'talent', 'professional development'],
  'companies-strategy': ['company', 'corporate', 'strategy', 'expansion', 'restructuring', 'business', 'growth'],
  'hse-regulations': ['safety', 'environment', 'regulation', 'compliance', 'emission', 'incident', 'audit', 'epa', 'api', 'standard', 'certification'],
  'ports-terminals': ['port', 'terminal', 'harbor', 'berth', 'loading', 'unloading', 'freight', 'shipping', 'vessel', 'cargo', 'maritime'],
  'technology-digitalization': ['digital', 'technology', 'automation', 'ai', 'artificial intelligence', 'iot', 'sensor', 'software', 'data', 'analytics', 'machine learning', 'innovation'],
  'offshore-subsea': ['offshore', 'subsea', 'deepwater', 'platform', 'fpso', 'floating', 'semi-submersible', 'jack-up', 'ultra-deepwater'],
  'onshore-operations': ['onshore', 'shale', 'unconventional', 'land-based', 'fracking', 'hydraulic fracturing', 'tight oil', 'tight gas'],
  'mergers-acquisitions': ['merger', 'acquisition', 'acquire', 'takeover', 'buyout', 'divestment', 'divest', 'sell', 'purchase', 'm&a'],
  'earnings-financials': ['earnings', 'revenue', 'profit', 'loss', 'quarterly', 'annual report', 'financial results', 'ebitda', 'dividend', 'stock', 'share'],
  'energy-transition': ['renewable', 'decarbonization', 'hydrogen', 'carbon capture', 'ccs', 'green energy', 'sustainability', 'net zero', 'clean energy'],
  'pipeline-infrastructure': ['pipeline', 'midstream', 'lng terminal', 'gas transmission', 'trunk line', 'gathering', 'transport'],
  'inspection-quality': ['inspection', 'qa', 'qc', 'quality assurance', 'quality control', 'ndt', 'non-destructive', 'testing', 'certification', 'api certified'],
  'gas-lng': ['gas', 'lng', 'natural gas', 'liquefied', 'regasification', 'liquefaction', 'gas field', 'gas production'],
  'oil': ['oil', 'crude', 'petroleum', 'oil field', 'oil production', 'barrel', 'bpd', 'oil reserves'],
  'energy-events': ['conference', 'exhibition', 'trade show', 'summit', 'forum', 'event', 'adipec', 'ote', 'offshore technology'],
  'geopolitical': ['geopolitical', 'sanctions', 'opec', 'policy', 'government', 'legislation', 'political'],
  'logistics': ['transport', 'shipping', 'freight', 'delivery', 'logistics', 'fleet'],
  'scm-solutions': ['scm', 'supply chain management', 'erp', 'tracking', 'visibility', 'procurement software'],
  'product-news': ['product launch', 'new product', 'innovation', 'equipment', 'tool'],
  'regional-coverage': ['regional', 'local', 'domestic', 'country focus'],
  'ai-energy': ['ai', 'machine learning', 'artificial intelligence', 'predictive', 'automation', 'digital twin'],
  'educational': ['guide', 'how to', 'explained', 'what is', 'introduction', 'basics'],
  'safety': ['safety', 'accident', 'hazard', 'ppe', 'safety record', 'injury', 'fatality']
};

const SYSTEM_PROMPT = `You are a senior energy industry editor for OCTG Index, a leading corporate OCTG (Oil Country Tubular Goods) news portal. Your task is to rewrite source content into professional, authoritative ORIGINAL editorial content optimized for SEO and AI search engines.

CRITICAL RULES - MUST FOLLOW:
- NEVER mention, reference, or credit ANY external source publication (e.g., "World Oil", "Rigzone", "Reuters", "Oil & Gas Journal", "Upstream", "Offshore Engineer")
- NEVER include phrases like "according to [publication]", "reported by [source]", or "Connect with [publication]"
- NEVER include calls-to-action directing readers to external publications or websites
- Write as if this is ORIGINAL OCTG Index reporting and analysis
- All content must appear as authentic OCTG Index editorial work with ZERO attribution to outside sources
- Do NOT mention where the information came from - present it as your own reporting

ARTICLE LENGTH REQUIREMENTS (CRITICAL):
- Target length: 1,800-2,200 words MINIMUM
- Include detailed analysis, comprehensive market context, and in-depth coverage
- Each major section (H2) should have 3-5 substantial paragraphs
- Each subsection (H3) should have 2-3 paragraphs
- Provide thorough analysis, not just a brief summary
- Expand on implications, market context, and strategic significance

SEO KEYWORD STRATEGY:
- Use the primary keyword (main topic) 3-5 times naturally throughout
- Include 5-8 secondary keyword variations (long-tail, question-based)
- Integrate 15-20 semantic/LSI keywords naturally
- Front-load important keywords in first paragraph and headings

AI SEARCH OPTIMIZATION (AEO/LLMO/GEO):
- Start each section with a direct answer to the implied question (first 2-3 sentences)
- Use Q&A format in FAQ section with questions as H3 headings
- Write in conversational, natural tone suitable for voice search
- Include factual statistics with dates where available
- Use bullet points and numbered lists for scannability

OUTPUT FORMAT (JSON):
{
  "title": "SEO-optimized headline, 50-60 characters (front-load primary keyword)",
  "excerpt": "Meta description: 150-160 characters, include primary keyword in first 70 chars, end with hook",
  "body_markdown": "Full article in Markdown (1,800-2,200 words) - see structure below",
  "tags": ["array", "of", "relevant", "tags"],
  "suggested_topics": ["mills-manufacturing", "pricing-market"],
  "mentioned_companies": ["Company Name 1", "Company Name 2"],
  "mentioned_countries": ["Country1", "Country2"],
  "primary_region": "americas"
}

TITLE REQUIREMENTS:
- 50-60 characters (strict limit)
- Include primary keyword at or near the start
- Use action verbs where possible
- Remove filler words (the, and, for, in, with, etc.)
- Make it punchy, scannable, and compelling

EXCERPT/META DESCRIPTION REQUIREMENTS:
- 150-160 characters exactly
- Include primary keyword within first 70 characters
- Summarize key news value
- End with benefit statement or hook

HEADING HIERARCHY RULES (CRITICAL - MUST FOLLOW):
- NEVER use # (H1) in body_markdown - the article title is rendered separately as H1 in the UI
- ALL body content headings MUST start with ## (H2) as the highest level
- The FIRST heading in body_markdown MUST be ## (two hashtags)
- Use ### (H3) for subsections under H2
- Proper hierarchy: ## Section → ### Subsection → #### Sub-subsection
- VIOLATION: Starting body with # is FORBIDDEN

MANDATORY CONTENT STRUCTURE (follow this hierarchy exactly):

[Opening paragraph: 2-3 sentences with primary keyword in first sentence. NO markdown formatting. NO heading before this paragraph. Direct value proposition. This should directly answer the main question for featured snippets.]

## [H2: Primary Topic - MUST use ## not # - Answer Main Query]

[Direct answer in first 2-3 sentences, then expand with 3-4 supporting paragraphs. Include statistics and data points.]

### [H3: Subtopic Detail 1]

[2-3 paragraphs with detailed explanation, conversational tone]

- Bullet point 1 with key insight
- Bullet point 2 with supporting data  
- Bullet point 3 with industry context

### [H3: Subtopic Detail 2]

[2-3 paragraphs with examples, case studies, or data]

## [H2: Market Context & Analysis]

[3-4 paragraphs of comprehensive market background and strategic context]

### [H3: Industry Background]

[Detailed industry context and historical perspective]

### [H3: Competitive Landscape]

[Analysis of market players and dynamics]

## [H2: Strategic Implications]

[What this means for industry stakeholders]

### [H3: Short-term Impact]

[Immediate effects and near-term considerations]

### [H3: Long-term Outlook]

[Future implications and strategic positioning]

## Frequently Asked Questions

### What is [primary keyword/topic]?

[Concise 2-3 sentence answer followed by brief elaboration]

### How does [topic] affect [industry/market]?

[Direct answer with industry-specific context]

### Why is [topic] important for [stakeholders]?

[Benefit-focused answer]

### What are the key challenges facing [topic area]?

[Practical answer with industry insights]

## [Creative Closing Header - NEVER use "Conclusion", "Summary", or "Final Thoughts"]

[100-150 word conclusion with action-oriented closing and clear forward-looking statement]

**Last Updated:** [Current Month Year]

FORBIDDEN CLOSING HEADERS - NEVER USE:
- "Conclusion" (sounds generic and AI-generated)
- "Summary" (sounds like AI recap)
- "Final Thoughts" (sounds like AI)
- "In Conclusion" / "To Conclude" / "Wrapping Up"

REQUIRED CREATIVE CLOSING HEADERS:
- "The Path Forward"
- "What This Means for [Industry/Market/Region]"
- "Industry Outlook" / "Market Outlook" / "Regional Outlook"
- "Strategic Implications"
- "Looking Ahead" / "Road Ahead"
- "The Bigger Picture"
- "[Topic] Momentum Continues"
- "Shaping the Future"
- "Beyond the Headlines"
- "Setting the Stage"

ENTITY EXTRACTION:
- Identify and list any OCTG manufacturers, operators, or service companies mentioned
- List countries specifically mentioned in the article
- Suggest relevant topic categories from this OFFICIAL 30-CATEGORY LIST:
  breaking-news, ceo-news, mills-manufacturing, yards-supply-chain, pricing-market, projects-contracts,
  rigs-wellsite, careers-people, companies-strategy, hse-regulations, ports-terminals, technology-digitalization,
  offshore-subsea, onshore-operations, mergers-acquisitions, earnings-financials, energy-transition,
  pipeline-infrastructure, inspection-quality, gas-lng, oil, energy-events, geopolitical, logistics,
  scm-solutions, product-news, regional-coverage, ai-energy, educational, safety

GEOGRAPHIC REGION IDENTIFICATION - CRITICAL:
- Carefully identify the PRIMARY geographic region of the news
- Use one of: middle-east, americas, europe, asia-pacific, africa, australia, global
- For news involving multiple regions, identify the PRIMARY focus
- Use country/city/company mentions to determine region accurately

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

        // Call OpenAI API with increased token limit for longer articles
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
                content: `Rewrite this as original OCTG Index editorial content (1,800-2,200 words minimum with proper H2/H3 hierarchy and FAQ section). Do NOT reference or credit any external source:\n\nTitle: ${source.title}\n\nContent:\n${source.raw_content || 'No content available'}` 
              }
            ],
            temperature: 0.7,
            max_tokens: 8000,
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

        // Log word count for verification
        const wordCount = parsed.body_markdown?.split(/\s+/).length || 0;
        console.log(`Generated article word count: ${wordCount}`);

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
          primaryRegion: parsed.primary_region,
          wordCount
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
