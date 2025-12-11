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

MANDATORY CONTENT STRUCTURE (follow this hierarchy exactly):

# [Title - H1, not included in body_markdown]

[Opening paragraph: 2-3 sentences with primary keyword in first sentence. NO markdown formatting. Direct value proposition. This should directly answer the main question for featured snippets.]

## [H2: Primary Topic - Answer Main Query]

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
- Suggest relevant topic categories from: mills-manufacturing, yards-supply-chain, pricing-market, projects-contracts, rigs-wellsite, careers-people, companies-strategy, hse-regulations, ports-terminals, technology-digitalization

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
            content: `Rewrite this as original OCTG Index editorial content (1,800-2,200 words minimum with proper H2/H3 hierarchy and FAQ section). Do NOT reference or credit any external source:\n\n${source_name ? `Source: ${source_name}\n\n` : ''}Content:\n${content}` 
          }
        ],
        temperature: 0.7,
        max_tokens: 8000,
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

    // Log word count for verification
    const wordCount = parsed.body_markdown?.split(/\s+/).length || 0;
    console.log('Article generated successfully:', {
      title: parsed.title,
      wordCount,
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
        word_count: wordCount,
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
