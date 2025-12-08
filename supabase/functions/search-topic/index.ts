import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configuration
const MAX_ARTICLE_AGE_DAYS = 60;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 20;

const CUTOFF_DATE = new Date();
CUTOFF_DATE.setDate(CUTOFF_DATE.getDate() - MAX_ARTICLE_AGE_DAYS);

// Region keywords for auto-detection
const REGION_KEYWORDS: Record<string, string[]> = {
  "americas": ["usa", "united states", "america", "canada", "mexico", "brazil", "argentina", "texas", "houston", "permian", "gulf of mexico", "alberta", "colombia", "venezuela", "ecuador", "guyana"],
  "europe": ["uk", "united kingdom", "britain", "norway", "netherlands", "germany", "france", "italy", "spain", "north sea", "scotland", "aberdeen", "rotterdam", "poland", "romania"],
  "asia-pacific": ["china", "india", "japan", "korea", "indonesia", "malaysia", "singapore", "vietnam", "thailand", "australia", "philippines", "myanmar", "bangladesh", "pakistan"],
  "middle-east": ["saudi", "arabia", "uae", "emirates", "qatar", "kuwait", "oman", "bahrain", "iraq", "iran", "abu dhabi", "dubai", "adnoc", "aramco"],
  "africa": ["nigeria", "angola", "libya", "egypt", "algeria", "mozambique", "ghana", "senegal", "south africa", "kenya", "tanzania", "uganda"],
  "australia": ["australia", "perth", "western australia", "queensland", "northern territory", "bass strait", "woodside", "santos"],
};

// Region slug to UUID mapping
const REGION_MAP: Record<string, string> = {
  "americas": "4b6ccd12-86f0-4e30-b3bb-6cb1c7d82c3e",
  "europe": "bb626c97-c8e0-4a28-871d-568db3810664",
  "asia-pacific": "b00e8f7b-72ee-4bdf-a632-fff16b1ffa29",
  "middle-east": "de0d536e-f402-4861-ab5c-7220857b1379",
  "africa": "53298537-f28d-4b6f-a161-ca0ba0a419f3",
  "australia": "1e5146eb-fb22-4e4c-b201-0eced3eabcda",
  "global": "4b6ccd12-86f0-4e30-b3bb-6cb1c7d82c3e", // Default to Global/Americas
};

// Detect region from content
function detectRegion(content: string): string | null {
  const lowerContent = content.toLowerCase();
  
  for (const [region, keywords] of Object.entries(REGION_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerContent.includes(keyword)) {
        return REGION_MAP[region] || null;
      }
    }
  }
  
  return null;
}

// Extract publication date from metadata
function extractPublishDate(metadata: Record<string, unknown> | undefined): Date | null {
  if (!metadata) return null;
  
  const dateFields = [
    'publishedTime',
    'article:published_time',
    'og:article:published_time',
    'datePublished',
    'date',
    'pubDate',
    'published',
    'created',
  ];
  
  for (const field of dateFields) {
    const value = metadata[field];
    if (value && typeof value === 'string') {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
  }
  
  return null;
}

// Check if article is within freshness window
function isArticleFresh(publishDate: Date | null): boolean {
  if (!publishDate) return true; // Accept if no date found
  return publishDate >= CUTOFF_DATE;
}

interface FirecrawlSearchResult {
  url: string;
  title: string;
  description?: string;
  markdown?: string;
  metadata?: Record<string, unknown>;
}

interface FirecrawlSearchResponse {
  success: boolean;
  data?: FirecrawlSearchResult[];
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Topic Search Agent Starting ===');
    
    // Parse request body
    const { query, limit = DEFAULT_LIMIT } = await req.json();
    
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Query is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const searchLimit = Math.min(Math.max(1, limit), MAX_LIMIT);
    console.log(`🔍 Search query: "${query}"`);
    console.log(`📊 Result limit: ${searchLimit}`);
    console.log(`📅 Freshness cutoff: ${CUTOFF_DATE.toISOString()} (${MAX_ARTICLE_AGE_DAYS} days)`);

    // Auth check
    const authHeader = req.headers.get('Authorization');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');

    if (!firecrawlApiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'FIRECRAWL_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Authenticate user
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    });

    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return new Response(JSON.stringify({ error: 'No authorization provided' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.log(`✅ Authenticated user: ${user.email}`);

    // Augment query with OCTG keywords for better relevance
    const augmentedQuery = `${query} OCTG steel pipe oil gas energy drilling`;
    console.log(`🔎 Augmented query: "${augmentedQuery}"`);

    // Call Firecrawl Search API
    console.log('📡 Calling Firecrawl Search API...');
    const searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: augmentedQuery,
        limit: searchLimit * 2, // Request more to account for filtering
        lang: 'en',
        tbs: 'qdr:m2', // Time filter: past 2 months (60 days)
        scrapeOptions: {
          formats: ['markdown'],
          onlyMainContent: true,
        },
      }),
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error(`Search API error: ${searchResponse.status} - ${errorText}`);
      return new Response(JSON.stringify({ error: `Search failed: ${errorText}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const searchResult: FirecrawlSearchResponse = await searchResponse.json();
    
    if (!searchResult.success || !searchResult.data) {
      console.error('Search returned no results');
      return new Response(JSON.stringify({ 
        success: true,
        articlesFound: 0,
        articlesInserted: 0,
        message: 'No results found for this query'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📰 Found ${searchResult.data.length} search results`);

    // Initialize admin client for database operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Get existing URLs to check for duplicates
    const urls = searchResult.data.map(r => r.url);
    const { data: existingArticles } = await supabaseAdmin
      .from('source_articles')
      .select('source_url')
      .in('source_url', urls);
    
    const existingUrls = new Set(existingArticles?.map(a => a.source_url) || []);
    console.log(`📋 Found ${existingUrls.size} existing articles (duplicates to skip)`);

    // Process and insert articles
    const results = {
      articlesFound: searchResult.data.length,
      articlesInserted: 0,
      duplicatesSkipped: 0,
      filteredByDate: 0,
      filteredByContent: 0,
    };

    for (const result of searchResult.data) {
      // Skip duplicates
      if (existingUrls.has(result.url)) {
        console.log(`⏭️ Skipping duplicate: ${result.url}`);
        results.duplicatesSkipped++;
        continue;
      }

      // Check content quality
      if (!result.markdown || result.markdown.length < 200) {
        console.log(`⏭️ Skipping low-content article: ${result.url}`);
        results.filteredByContent++;
        continue;
      }

      // Check date freshness
      const publishDate = extractPublishDate(result.metadata);
      if (!isArticleFresh(publishDate)) {
        console.log(`⏭️ Skipping old article: ${result.url} (${publishDate?.toISOString()})`);
        results.filteredByDate++;
        continue;
      }

      // Detect region from content
      const regionId = detectRegion(result.markdown || result.title || '');

      // Extract image URL
      const imageUrl = result.metadata?.ogImage as string || 
                       result.metadata?.image as string || 
                       null;

      // Insert into source_articles
      const { error: insertError } = await supabaseAdmin
        .from('source_articles')
        .insert({
          title: result.title || 'Untitled',
          source_url: result.url,
          source_name: 'Topic Search',
          raw_content: result.markdown,
          image_url: imageUrl,
          region_id: regionId,
          status: 'new',
          language: 'en',
          meta: {
            search_query: query,
            description: result.description,
            ...(result.metadata || {}),
          },
        });

      if (insertError) {
        console.error(`❌ Error inserting article: ${insertError.message}`);
      } else {
        console.log(`✅ Inserted: ${result.title}`);
        results.articlesInserted++;
      }

      // Stop if we've reached the limit
      if (results.articlesInserted >= searchLimit) {
        break;
      }
    }

    console.log('\n=== Topic Search Complete ===');
    console.log(`📊 Results: ${results.articlesInserted} inserted, ${results.duplicatesSkipped} duplicates, ${results.filteredByDate} filtered by date`);

    return new Response(JSON.stringify({
      success: true,
      query,
      ...results,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Topic search error:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
