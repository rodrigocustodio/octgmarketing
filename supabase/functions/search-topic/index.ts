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

// Extract publication date from metadata AND content
function extractPublishDate(
  metadata: Record<string, unknown> | undefined,
  content?: string,
  url?: string
): Date | null {
  // 1. Check metadata fields first (most reliable)
  if (metadata) {
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
          console.log(`📅 Date from metadata field "${field}": ${parsed.toISOString()}`);
          return parsed;
        }
      }
    }
  }
  
  // 2. Check URL for date patterns
  if (url) {
    // Pattern: /2023/10/02/ or /2023-10-02/ in URL path
    const urlDateMatch = url.match(/\/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
    if (urlDateMatch) {
      const parsed = new Date(
        parseInt(urlDateMatch[1]),
        parseInt(urlDateMatch[2]) - 1,
        parseInt(urlDateMatch[3])
      );
      if (!isNaN(parsed.getTime())) {
        console.log(`📅 Date from URL pattern: ${parsed.toISOString()}`);
        return parsed;
      }
    }
  }
  
  // 3. Check content for visible date patterns
  if (content) {
    // Pattern: YYYY.MM.DD (Japanese/corporate style) - e.g., "2023.10.2" or "2023.10.02"
    const jpDateMatch = content.match(/(\d{4})\.(\d{1,2})\.(\d{1,2})/);
    if (jpDateMatch) {
      const parsed = new Date(
        parseInt(jpDateMatch[1]),
        parseInt(jpDateMatch[2]) - 1,
        parseInt(jpDateMatch[3])
      );
      if (!isNaN(parsed.getTime())) {
        console.log(`📅 Date from YYYY.MM.DD pattern: ${parsed.toISOString()}`);
        return parsed;
      }
    }
    
    // Pattern: "Published: Month DD, YYYY" or "Published in Month YYYY"
    const publishedMatch = content.match(/[Pp]ublished(?:\s+(?:on|in))?\s*:?\s*(\w+\s+\d{1,2},?\s+\d{4}|\w+\s+\d{4})/);
    if (publishedMatch) {
      const parsed = new Date(publishedMatch[1]);
      if (!isNaN(parsed.getTime())) {
        console.log(`📅 Date from "Published" pattern: ${parsed.toISOString()}`);
        return parsed;
      }
    }
    
    // Pattern: "Month DD, YYYY" near the start of content (first 500 chars)
    const contentStart = content.substring(0, 500);
    const datePatternMatch = contentStart.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/i);
    if (datePatternMatch) {
      const parsed = new Date(datePatternMatch[0]);
      if (!isNaN(parsed.getTime())) {
        console.log(`📅 Date from "Month DD, YYYY" pattern: ${parsed.toISOString()}`);
        return parsed;
      }
    }
    
    // Pattern: DD Month YYYY (European style) - e.g., "2 October 2023"
    const euDateMatch = contentStart.match(/(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i);
    if (euDateMatch) {
      const parsed = new Date(`${euDateMatch[2]} ${euDateMatch[1]}, ${euDateMatch[3]}`);
      if (!isNaN(parsed.getTime())) {
        console.log(`📅 Date from "DD Month YYYY" pattern: ${parsed.toISOString()}`);
        return parsed;
      }
    }
    
    // Pattern: YYYY-MM-DD (ISO format)
    const isoMatch = content.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      const parsed = new Date(isoMatch[0]);
      if (!isNaN(parsed.getTime())) {
        console.log(`📅 Date from ISO pattern: ${parsed.toISOString()}`);
        return parsed;
      }
    }
    
    // Pattern: DD/MM/YYYY or MM/DD/YYYY (assume MM/DD/YYYY for US sites)
    const slashDateMatch = contentStart.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (slashDateMatch) {
      // Assume MM/DD/YYYY format
      const parsed = new Date(
        parseInt(slashDateMatch[3]),
        parseInt(slashDateMatch[1]) - 1,
        parseInt(slashDateMatch[2])
      );
      if (!isNaN(parsed.getTime())) {
        console.log(`📅 Date from MM/DD/YYYY pattern: ${parsed.toISOString()}`);
        return parsed;
      }
    }
  }
  
  console.log(`⚠️ No date found for article`);
  return null;
}

interface FreshnessResult {
  fresh: boolean;
  uncertain: boolean;
  reason: string;
}

// Check if article is within freshness window
function isArticleFresh(publishDate: Date | null): FreshnessResult {
  if (!publishDate) {
    // CRITICAL FIX: Unknown dates are now rejected by default
    return { 
      fresh: false, 
      uncertain: true, 
      reason: 'No publication date found - rejecting to prevent old content' 
    };
  }
  
  const isFresh = publishDate >= CUTOFF_DATE;
  return { 
    fresh: isFresh, 
    uncertain: false, 
    reason: isFresh 
      ? `Fresh: ${publishDate.toISOString()}` 
      : `Old: ${publishDate.toISOString()} (before ${CUTOFF_DATE.toISOString()})` 
  };
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
      filteredByUnknownDate: 0,
      filteredByContent: 0,
    };

    for (const result of searchResult.data) {
      console.log(`\n--- Processing: ${result.title} ---`);
      console.log(`URL: ${result.url}`);
      
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

      // Check date freshness with enhanced extraction (now includes content parsing)
      const publishDate = extractPublishDate(result.metadata, result.markdown, result.url);
      const freshness = isArticleFresh(publishDate);
      
      if (!freshness.fresh) {
        if (freshness.uncertain) {
          console.log(`⏭️ Skipping article with unknown date: ${result.url} - ${freshness.reason}`);
          results.filteredByUnknownDate++;
        } else {
          console.log(`⏭️ Skipping old article: ${result.url} - ${freshness.reason}`);
          results.filteredByDate++;
        }
        continue;
      }
      
      console.log(`✅ Date check passed: ${freshness.reason}`);

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
            detected_publish_date: publishDate?.toISOString(),
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
    console.log(`📊 Results: ${results.articlesInserted} inserted, ${results.duplicatesSkipped} duplicates, ${results.filteredByDate} old, ${results.filteredByUnknownDate} unknown date`);

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
