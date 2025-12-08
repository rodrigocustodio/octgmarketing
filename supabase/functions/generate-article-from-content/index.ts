import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Region detection keywords
const REGION_KEYWORDS: Record<string, string[]> = {
  'middle-east': ['saudi', 'arabia', 'uae', 'emirates', 'qatar', 'kuwait', 'oman', 'bahrain', 'iraq', 'iran', 'abu dhabi', 'dubai', 'doha', 'riyadh', 'jeddah', 'aramco', 'adnoc', 'muscat', 'manama', 'yemen', 'jordan', 'opec'],
  'americas': ['usa', 'united states', 'texas', 'permian', 'gulf of mexico', 'canada', 'alberta', 'mexico', 'brazil', 'argentina', 'venezuela', 'colombia', 'houston', 'oklahoma', 'north dakota', 'bakken', 'eagle ford', 'marcellus', 'delaware basin', 'midland', 'guyana', 'suriname', 'ecuador', 'peru', 'trinidad', 'petrobras', 'pemex', 'ecopetrol'],
  'europe': ['north sea', 'norway', 'uk', 'united kingdom', 'netherlands', 'germany', 'france', 'italy', 'spain', 'romania', 'poland', 'denmark', 'equinor', 'scottish', 'aberdeen', 'stavanger', 'totalenergies', 'eni'],
  'asia-pacific': ['china', 'india', 'indonesia', 'malaysia', 'vietnam', 'thailand', 'japan', 'south korea', 'singapore', 'brunei', 'papua new guinea', 'philippines', 'taiwan', 'myanmar', 'cnpc', 'cnooc', 'sinopec', 'petrochina', 'reliance', 'petronas', 'pertamina', 'ongc'],
  'africa': ['nigeria', 'angola', 'libya', 'algeria', 'egypt', 'ghana', 'mozambique', 'tanzania', 'kenya', 'south africa', 'senegal', 'mauritania', 'congo', 'cameroon', 'gabon', 'ivory coast', 'namibia', 'uganda', 'nnpc', 'sonatrach', 'sonangol'],
  'australia': ['australia', 'queensland', 'western australia', 'northern territory', 'bass strait', 'perth', 'darwin', 'gladstone', 'woodside', 'santos', 'beach energy', 'origin energy', 'cooper basin', 'carnarvon basin', 'browse basin', 'gorgon', 'wheatstone', 'ichthys', 'prelude'],
  'global': ['global', 'worldwide', 'international', 'multiple regions', 'cross-border']
};

// Topic detection keywords
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
  "mentioned_countries": ["Country1", "Country2"],
  "primary_region": "americas"
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
    for (const keyword of keywords) {
      if (lowerContent.includes(keyword)) {
        score++;
      }
    }
    
    if (score >= 2) {
      const topic = topics.find(t => t.slug === topicSlug);
      if (topic) {
        topicScores.push({ topicId: topic.id, score });
      }
    }
  }
  
  topicScores.sort((a, b) => b.score - a.score);
  return topicScores.slice(0, 2).map(ts => ts.topicId);
}

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

    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check user role
    const { data: roles } = await supabaseAuth
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

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Parse request body
    const { content, source_name } = await req.json();

    if (!content || content.trim().length < 100) {
      return new Response(
        JSON.stringify({ error: 'Content is required and must be at least 100 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing content from: ${source_name || 'Manual input'}`);

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch regions for detection
    const { data: regions } = await supabase
      .from('regions')
      .select('id, slug');

    // Fetch topics for detection
    const { data: topics } = await supabase
      .from('topics')
      .select('id, slug');

    // Fetch companies for matching
    const { data: companies } = await supabase
      .from('companies')
      .select('id, name');

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
            content: `Rewrite this as original OCTG Index editorial content (800-1200 words minimum). Do NOT reference or credit any external source:\n\n${source_name ? `Source: ${source_name}\n\n` : ''}Content:\n${content}` 
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const responseContent = data.choices[0]?.message?.content;

    if (!responseContent) {
      throw new Error('No content returned from OpenAI');
    }

    // Parse JSON response
    let parsed;
    try {
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', responseContent);
      throw new Error('Failed to parse AI response');
    }

    // Generate slug
    const baseSlug = generateSlug(parsed.title);
    const timestamp = Date.now().toString(36);
    const slug = `${baseSlug}-${timestamp}`;

    // Detect region
    let regionId: string | null = null;
    if (parsed.primary_region) {
      const aiRegion = regions?.find(r => r.slug === parsed.primary_region);
      if (aiRegion) {
        regionId = aiRegion.id;
      }
    }
    if (!regionId) {
      regionId = detectRegion(content + ' ' + parsed.body_markdown, regions || []);
    }

    // Detect topics
    const suggestedTopicIds = detectTopics(content + ' ' + parsed.body_markdown, topics || []);

    // Match companies
    const matchedCompanyIds: string[] = [];
    if (parsed.mentioned_companies && companies) {
      const lowerContent = (content + ' ' + parsed.body_markdown).toLowerCase();
      for (const company of companies) {
        const companyNameLower = company.name.toLowerCase();
        if (lowerContent.includes(companyNameLower) || 
            parsed.mentioned_companies.some((m: string) => 
              m.toLowerCase().includes(companyNameLower) || 
              companyNameLower.includes(m.toLowerCase())
            )) {
          matchedCompanyIds.push(company.id);
        }
      }
    }

    // Combine tags
    const allTags = [
      ...(parsed.tags || []),
      ...(parsed.mentioned_companies || []),
      ...(parsed.mentioned_countries || []),
    ];

    console.log('Article generated successfully:', {
      title: parsed.title,
      regionId,
      suggestedTopicIds,
      matchedCompanyIds: matchedCompanyIds.length
    });

    return new Response(
      JSON.stringify({
        title: parsed.title,
        excerpt: parsed.excerpt,
        body_markdown: parsed.body_markdown,
        slug,
        tags: allTags,
        region_id: regionId,
        suggested_topic_ids: suggestedTopicIds,
        suggested_company_ids: matchedCompanyIds,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-article-from-content:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
