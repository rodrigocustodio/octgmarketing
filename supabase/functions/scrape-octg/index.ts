import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ===== 60-DAY FRESHNESS FILTER =====
const MAX_ARTICLE_AGE_DAYS = 60;
const CUTOFF_DATE = new Date();
CUTOFF_DATE.setDate(CUTOFF_DATE.getDate() - MAX_ARTICLE_AGE_DAYS);

// Current year for URL filtering
const CURRENT_YEAR = new Date().getFullYear();
const MIN_ALLOWED_YEAR = CURRENT_YEAR - 1; // Allow current and previous year in URLs

// Region name to UUID mapping
const REGION_MAP: Record<string, string | null> = {
  "Global": null,
  "Americas": "4b6ccd12-86f0-4e30-b3bb-6cb1c7d82c3e",
  "Europe": "bb626c97-c8e0-4a28-871d-568db3810664",
  "Asia-Pacific": "b00e8f7b-72ee-4bdf-a632-fff16b1ffa29",
  "Middle East": "de0d536e-f402-4861-ab5c-7220857b1379",
  "Africa": "53298537-f28d-4b6f-a161-ca0ba0a419f3"
};

interface ScrapeSource {
  id: string;
  name: string;
  url: string;
  region: string;
  category: string;
  source_type: string;
  is_active: boolean;
  priority: number;
  scrape_config: Record<string, unknown>;
}

interface FirecrawlMapResponse {
  success: boolean;
  links?: string[];
  error?: string;
}

interface FirecrawlScrapeResponse {
  success: boolean;
  data?: {
    markdown?: string;
    metadata?: {
      title?: string;
      description?: string;
      ogImage?: string;
      publishedTime?: string;
      'article:published_time'?: string;
      datePublished?: string;
      modifiedTime?: string;
      'og:article:published_time'?: string;
    };
  };
  error?: string;
}

// Extract publication date from metadata, URL, or content
function extractPublishDate(metadata: Record<string, unknown> | undefined, url: string, content: string): Date | null {
  // Priority 1: Check metadata for published time
  if (metadata) {
    const metadataDateFields = [
      'publishedTime',
      'article:published_time',
      'og:article:published_time',
      'datePublished',
      'date',
      'pubDate',
      'published',
      'created',
    ];
    
    for (const field of metadataDateFields) {
      const value = metadata[field];
      if (value && typeof value === 'string') {
        const parsed = new Date(value);
        if (!isNaN(parsed.getTime())) {
          console.log(`  📅 Date from metadata.${field}: ${parsed.toISOString()}`);
          return parsed;
        }
      }
    }
  }
  
  // Priority 2: Extract date from URL pattern (e.g., /2024/12/05/ or /2024-12-05/)
  const urlDatePatterns = [
    /\/(\d{4})\/(\d{1,2})\/(\d{1,2})\//,  // /2024/12/05/
    /\/(\d{4})-(\d{1,2})-(\d{1,2})\//,     // /2024-12-05/
    /\/(\d{4})\/(\d{1,2})\//,              // /2024/12/
    /[/-](\d{4})(\d{2})(\d{2})[/-]/,       // /20241205/ or -20241205-
  ];
  
  for (const pattern of urlDatePatterns) {
    const match = url.match(pattern);
    if (match) {
      const year = parseInt(match[1]);
      const month = parseInt(match[2]) - 1;
      const day = match[3] ? parseInt(match[3]) : 1;
      const parsed = new Date(year, month, day);
      if (!isNaN(parsed.getTime()) && year >= 2000 && year <= CURRENT_YEAR) {
        console.log(`  📅 Date from URL pattern: ${parsed.toISOString()}`);
        return parsed;
      }
    }
  }
  
  // Priority 3: Look for date patterns in first 1000 chars of content
  const contentStart = content.substring(0, 1000);
  
  // Common date patterns in articles
  const contentDatePatterns = [
    // "December 5, 2024" or "Dec 5, 2024"
    /(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[.\s]+(\d{1,2})(?:st|nd|rd|th)?[,\s]+(\d{4})/i,
    // "5 December 2024" or "5 Dec 2024"
    /(\d{1,2})(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[.\s]+(\d{4})/i,
    // "Published: 2024-12-05" or "Date: 12/05/2024"
    /(?:Published|Posted|Date|Updated)[:.\s]+(\d{4})[/-](\d{1,2})[/-](\d{1,2})/i,
    /(?:Published|Posted|Date|Updated)[:.\s]+(\d{1,2})[/-](\d{1,2})[/-](\d{4})/i,
  ];
  
  for (const pattern of contentDatePatterns) {
    const match = contentStart.match(pattern);
    if (match) {
      try {
        // Try parsing the full match
        const fullMatch = match[0];
        // Clean up the match for parsing
        const cleanedMatch = fullMatch.replace(/(?:Published|Posted|Date|Updated)[:.\s]+/i, '').trim();
        const parsed = new Date(cleanedMatch);
        if (!isNaN(parsed.getTime()) && parsed.getFullYear() >= 2000 && parsed.getFullYear() <= CURRENT_YEAR) {
          console.log(`  📅 Date from content: ${parsed.toISOString()}`);
          return parsed;
        }
      } catch {
        continue;
      }
    }
  }
  
  console.log(`  ⚠️ Could not extract publication date`);
  return null;
}

// Check if article is within the freshness window
function isArticleFresh(publishDate: Date | null): boolean {
  if (!publishDate) {
    // If we can't determine the date, we'll be conservative and reject it
    return false;
  }
  return publishDate >= CUTOFF_DATE;
}

// Check if URL contains an obviously old year pattern
function isUrlDateFresh(url: string): boolean {
  // Look for year patterns in URL
  const yearMatch = url.match(/\/(\d{4})\//);
  if (yearMatch) {
    const year = parseInt(yearMatch[1]);
    // Reject if year is older than last year
    if (year < MIN_ALLOWED_YEAR) {
      console.log(`  🚫 URL contains old year: ${year}`);
      return false;
    }
  }
  return true;
}

// Map a website to discover article URLs
async function mapWebsite(url: string, apiKey: string, limit: number = 10): Promise<string[]> {
  console.log(`Mapping website: ${url}`);
  
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/map', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        limit,
        includeSubdomains: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Map API error for ${url}: ${response.status} - ${errorText}`);
      return [];
    }

    const result: FirecrawlMapResponse = await response.json();
    
    if (!result.success || !result.links) {
      console.log(`No links found for ${url}`);
      return [];
    }

    // Filter to likely article URLs (exclude homepage, contact, about pages)
    const articleUrls = result.links.filter((link: string) => {
      const lower = link.toLowerCase();
      // Exclude common non-article pages
      if (lower === url || lower === url + '/') return false;
      if (lower.includes('/contact') || lower.includes('/about') || lower.includes('/login')) return false;
      if (lower.includes('/privacy') || lower.includes('/terms') || lower.includes('/cookie')) return false;
      if (lower.includes('/search') || lower.includes('/subscribe') || lower.includes('/register')) return false;
      
      // PRE-FILTER: Check if URL contains an obviously old year
      if (!isUrlDateFresh(link)) {
        return false;
      }
      
      // Prefer URLs that look like articles
      return lower.includes('/news') || lower.includes('/article') || lower.includes('/press') || 
             lower.includes('/release') || lower.includes('/media') || lower.includes('/blog') ||
             lower.includes('/story') || lower.includes('/update') || 
             // Also include date patterns in URLs (but already filtered for freshness)
             /\/\d{4}\//.test(link) || /\/\d{4}-\d{2}/.test(link);
    });

    console.log(`Found ${articleUrls.length} potential article URLs from ${url} (after date pre-filter)`);
    return articleUrls.slice(0, 5); // Return max 5 articles
  } catch (error) {
    console.error(`Error mapping ${url}:`, error);
    return [];
  }
}

// Scrape a single URL for content
async function scrapeUrl(url: string, apiKey: string): Promise<{
  success: boolean;
  title?: string;
  content?: string;
  imageUrl?: string;
  metadata?: Record<string, unknown>;
  error?: string;
}> {
  console.log(`Scraping URL: ${url}`);
  
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        onlyMainContent: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Scrape API error for ${url}: ${response.status} - ${errorText}`);
      return { success: false, error: errorText };
    }

    const result: FirecrawlScrapeResponse = await response.json();
    
    if (!result.success || !result.data) {
      return { success: false, error: 'No data returned' };
    }

    return {
      success: true,
      title: result.data.metadata?.title || 'Untitled',
      content: result.data.markdown || '',
      imageUrl: result.data.metadata?.ogImage,
      metadata: result.data.metadata as Record<string, unknown>,
    };
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    return { success: false, error: String(error) };
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== OCTG Scraper Starting ===');
    console.log(`📅 Cutoff date for articles: ${CUTOFF_DATE.toISOString()} (${MAX_ARTICLE_AGE_DAYS} days ago)`);

    // Auth check
    const cronSecret = Deno.env.get('CRON_SECRET');
    const authHeader = req.headers.get('Authorization');
    const isCronCall = authHeader === `Bearer ${cronSecret}`;

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

    // Auth client for verifying user
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    });

    if (!isCronCall) {
      const token = authHeader?.replace('Bearer ', '');
      if (token) {
        const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
        if (authError || !user) {
          console.error('Auth error:', authError);
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        console.log(`Authenticated user: ${user.email}`);
      } else {
        return new Response(JSON.stringify({ error: 'No authorization provided' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      console.log('Cron job authenticated');
    }

    // Admin client for database operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Fetch all active sources from database
    const { data: sources, error: sourcesError } = await supabaseAdmin
      .from('scrape_sources')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: true });

    if (sourcesError) {
      console.error('Error fetching sources:', sourcesError);
      return new Response(JSON.stringify({ error: 'Failed to fetch sources' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${sources?.length || 0} active sources to scrape`);

    const results = {
      sourcesProcessed: 0,
      articlesFound: 0,
      articlesInserted: 0,
      duplicatesSkipped: 0,
      articlesFilteredByDate: 0, // NEW: Track date-filtered articles
      articlesWithUnknownDate: 0, // NEW: Track articles with unparseable dates
      errors: [] as string[],
    };

    // Process each source
    for (const source of (sources as ScrapeSource[]) || []) {
      console.log(`\n--- Processing source: ${source.name} (${source.url}) ---`);
      results.sourcesProcessed++;

      try {
        // Map the website to find article URLs
        const articleUrls = await mapWebsite(source.url, firecrawlApiKey, 10);
        
        if (articleUrls.length === 0) {
          console.log(`No articles found for ${source.name}`);
          continue;
        }

        let articlesFoundForSource = 0;

        // Scrape each article URL
        for (const articleUrl of articleUrls.slice(0, 5)) {
          // Check for duplicates
          const { data: existing } = await supabaseAdmin
            .from('source_articles')
            .select('id')
            .eq('source_url', articleUrl)
            .maybeSingle();

          if (existing) {
            console.log(`Duplicate skipped: ${articleUrl}`);
            results.duplicatesSkipped++;
            continue;
          }

          // Scrape the article
          const scrapeResult = await scrapeUrl(articleUrl, firecrawlApiKey);

          if (!scrapeResult.success) {
            console.log(`Failed to scrape: ${articleUrl}`);
            results.errors.push(`Failed to scrape ${articleUrl}: ${scrapeResult.error}`);
            continue;
          }

          results.articlesFound++;

          // ===== DATE FRESHNESS CHECK =====
          const publishDate = extractPublishDate(
            scrapeResult.metadata,
            articleUrl,
            scrapeResult.content || ''
          );
          
          if (!publishDate) {
            console.log(`  ⚠️ SKIPPED (unknown date): "${scrapeResult.title}"`);
            results.articlesWithUnknownDate++;
            continue;
          }
          
          if (!isArticleFresh(publishDate)) {
            const daysSincePublish = Math.floor((Date.now() - publishDate.getTime()) / (1000 * 60 * 60 * 24));
            console.log(`  🚫 SKIPPED (too old): "${scrapeResult.title}" - published ${publishDate.toISOString().split('T')[0]} (${daysSincePublish} days ago)`);
            results.articlesFilteredByDate++;
            continue;
          }
          
          console.log(`  ✅ FRESH: "${scrapeResult.title}" - published ${publishDate.toISOString().split('T')[0]}`);
          // ===== END DATE CHECK =====

          // Insert into source_articles
          const regionId = REGION_MAP[source.region] || null;
          
          const { error: insertError } = await supabaseAdmin
            .from('source_articles')
            .insert({
              source_url: articleUrl,
              source_name: source.name,
              title: scrapeResult.title || 'Untitled',
              raw_content: scrapeResult.content,
              image_url: scrapeResult.imageUrl,
              region_id: regionId,
              status: 'new',
              meta: {
                category: source.category,
                source_type: source.source_type,
                scraped_from: source.url,
                original_publish_date: publishDate.toISOString(), // Store the extracted date
              },
            });

          if (insertError) {
            console.error(`Insert error for ${articleUrl}:`, insertError);
            results.errors.push(`Insert failed for ${articleUrl}: ${insertError.message}`);
          } else {
            console.log(`Inserted: ${scrapeResult.title}`);
            results.articlesInserted++;
            articlesFoundForSource++;
          }
        }

        // Update source last_scraped_at
        await supabaseAdmin
          .from('scrape_sources')
          .update({
            last_scraped_at: new Date().toISOString(),
            articles_found: articlesFoundForSource,
          })
          .eq('id', source.id);

      } catch (sourceError) {
        console.error(`Error processing source ${source.name}:`, sourceError);
        results.errors.push(`Source ${source.name}: ${String(sourceError)}`);
      }
    }

    console.log('\n=== Scraping Complete ===');
    console.log(`Sources processed: ${results.sourcesProcessed}`);
    console.log(`Articles found: ${results.articlesFound}`);
    console.log(`Articles inserted: ${results.articlesInserted}`);
    console.log(`Duplicates skipped: ${results.duplicatesSkipped}`);
    console.log(`🚫 Filtered by date (>60 days): ${results.articlesFilteredByDate}`);
    console.log(`⚠️ Unknown date (skipped): ${results.articlesWithUnknownDate}`);
    console.log(`Errors: ${results.errors.length}`);

    return new Response(JSON.stringify({
      success: true,
      ...results,
      cutoffDate: CUTOFF_DATE.toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Scraper error:', error);
    return new Response(JSON.stringify({ 
      error: String(error),
      success: false,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
