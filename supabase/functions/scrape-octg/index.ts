import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    };
  };
  error?: string;
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
      // Prefer URLs that look like articles
      return lower.includes('/news') || lower.includes('/article') || lower.includes('/press') || 
             lower.includes('/release') || lower.includes('/media') || lower.includes('/blog') ||
             lower.includes('/story') || lower.includes('/update') || 
             // Also include date patterns in URLs
             /\/\d{4}\//.test(link) || /\/\d{4}-\d{2}/.test(link);
    });

    console.log(`Found ${articleUrls.length} potential article URLs from ${url}`);
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

          results.articlesFound++;
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
    console.log(`Errors: ${results.errors.length}`);

    return new Response(JSON.stringify({
      success: true,
      ...results,
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