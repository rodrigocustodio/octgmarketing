import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// OCTG news sources to scrape
const OCTG_SOURCES = [
  {
    name: "World Oil",
    searchQuery: "OCTG pipe tubular oil gas",
    url: "https://www.worldoil.com",
  },
  {
    name: "Oil & Gas Journal",
    searchQuery: "OCTG casing tubing drilling",
    url: "https://www.ogj.com",
  },
  {
    name: "Rigzone",
    searchQuery: "OCTG tubular pipe steel",
    url: "https://www.rigzone.com",
  },
];

interface FirecrawlSearchResult {
  url: string;
  title: string;
  description?: string;
  markdown?: string;
}

interface FirecrawlSearchResponse {
  success: boolean;
  data?: FirecrawlSearchResult[];
  error?: string;
}

async function searchWithFirecrawl(
  query: string,
  apiKey: string
): Promise<FirecrawlSearchResponse> {
  console.log(`Searching Firecrawl for: ${query}`);
  
  try {
    const response = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: query,
        limit: 5,
        lang: "en",
        scrapeOptions: {
          formats: ["markdown"],
          onlyMainContent: true,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Firecrawl API error: ${response.status} - ${errorText}`);
      return { success: false, error: `API error: ${response.status}` };
    }

    const data = await response.json();
    console.log(`Firecrawl returned ${data.data?.length || 0} results`);
    return { success: true, data: data.data || [] };
  } catch (error: unknown) {
    console.error("Firecrawl search error:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function scrapeUrl(
  url: string,
  apiKey: string
): Promise<{ success: boolean; markdown?: string; title?: string; error?: string }> {
  console.log(`Scraping URL: ${url}`);
  
  try {
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: url,
        formats: ["markdown"],
        onlyMainContent: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Firecrawl scrape error: ${response.status} - ${errorText}`);
      return { success: false, error: `Scrape error: ${response.status}` };
    }

    const data = await response.json();
    return {
      success: true,
      markdown: data.data?.markdown,
      title: data.data?.metadata?.title,
    };
  } catch (error: unknown) {
    console.error("Firecrawl scrape error:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify cron secret for scheduled calls
    const authHeader = req.headers.get("authorization");
    const cronSecret = Deno.env.get("CRON_SECRET");
    
    // Allow calls with valid cron secret or from authenticated admin/editor
    const isCronCall = authHeader === `Bearer ${cronSecret}`;
    
    if (!isCronCall) {
      // For non-cron calls, verify the user is authenticated
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader || "" } },
      });
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error("Auth error:", authError);
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlApiKey) {
      console.error("FIRECRAWL_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Firecrawl API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase with service role for database operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting OCTG news scrape...");
    
    const results = {
      searched: 0,
      scraped: 0,
      inserted: 0,
      duplicates: 0,
      errors: [] as string[],
    };

    // Search for OCTG news from each source
    for (const source of OCTG_SOURCES) {
      console.log(`Processing source: ${source.name}`);
      
      const searchResult = await searchWithFirecrawl(
        `${source.searchQuery} site:${source.url}`,
        firecrawlApiKey
      );
      
      if (!searchResult.success || !searchResult.data) {
        results.errors.push(`Search failed for ${source.name}: ${searchResult.error}`);
        continue;
      }
      
      results.searched += searchResult.data.length;

      for (const result of searchResult.data) {
        // Check if URL already exists
        const { data: existing } = await supabaseAdmin
          .from("source_articles")
          .select("id")
          .eq("source_url", result.url)
          .maybeSingle();

        if (existing) {
          console.log(`Duplicate found: ${result.url}`);
          results.duplicates++;
          continue;
        }

        // Get full content if not already in search results
        let content = result.markdown;
        let title = result.title;
        
        if (!content) {
          const scrapeResult = await scrapeUrl(result.url, firecrawlApiKey);
          if (scrapeResult.success) {
            content = scrapeResult.markdown;
            title = scrapeResult.title || title;
            results.scraped++;
          } else {
            results.errors.push(`Scrape failed for ${result.url}: ${scrapeResult.error}`);
            continue;
          }
        }

        // Insert into source_articles
        const { error: insertError } = await supabaseAdmin
          .from("source_articles")
          .insert({
            source_url: result.url,
            source_name: source.name,
            title: title || "Untitled Article",
            raw_content: content,
            image_url: null,
            language: "en",
            status: "new",
            meta: {
              description: result.description,
              scraped_via: "firecrawl_search",
            },
          });

        if (insertError) {
          console.error(`Insert error for ${result.url}:`, insertError);
          results.errors.push(`Insert failed for ${result.url}: ${insertError.message}`);
        } else {
          console.log(`Inserted: ${title}`);
          results.inserted++;
        }
      }
    }

    console.log("Scrape complete:", results);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Scraped ${results.inserted} new articles`,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Scraper error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
