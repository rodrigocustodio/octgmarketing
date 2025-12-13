import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      console.log('Invalid token or user not found');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: roles } = await supabaseAuth
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const userRoles = roles?.map(r => r.role) || [];
    if (!userRoles.includes('admin') && !userRoles.includes('editor')) {
      console.log('User lacks admin/editor role:', user.id);
      return new Response(
        JSON.stringify({ error: 'Forbidden - admin or editor role required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id, 'with roles:', userRoles);

    const { companyName, website } = await req.json();

    if (!companyName) {
      return new Response(
        JSON.stringify({ error: "Company name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Generating description for: ${companyName}`);

    let searchResults = "";

    // Step 1: Search for company information using Firecrawl
    if (firecrawlApiKey) {
      try {
        const searchQuery = `${companyName} OCTG tubular steel pipe company profile products services`;
        console.log(`Searching web for: ${searchQuery}`);

        const searchResponse = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${firecrawlApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: searchQuery,
            limit: 5,
            scrapeOptions: {
              formats: ["markdown"],
            },
          }),
        });

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          console.log(`Found ${searchData.data?.length || 0} search results`);

          if (searchData.data && searchData.data.length > 0) {
            searchResults = searchData.data
              .slice(0, 3)
              .map((result: any) => {
                const content = result.markdown || result.description || "";
                return `Source: ${result.title}\n${content.slice(0, 1500)}`;
              })
              .join("\n\n---\n\n");
          }
        } else {
          console.log("Firecrawl search failed, continuing with OpenAI only");
        }
      } catch (searchError) {
        console.error("Search error:", searchError);
      }
    }

    // Step 2: If we have a website, try to scrape it
    if (firecrawlApiKey && website) {
      try {
        console.log(`Scraping company website: ${website}`);
        const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${firecrawlApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: website,
            formats: ["markdown"],
            onlyMainContent: true,
          }),
        });

        if (scrapeResponse.ok) {
          const scrapeData = await scrapeResponse.json();
          if (scrapeData.data?.markdown) {
            searchResults += `\n\n---\n\nOfficial Website Content:\n${scrapeData.data.markdown.slice(0, 2000)}`;
            console.log("Successfully scraped company website");
          }
        }
      } catch (scrapeError) {
        console.error("Website scrape error:", scrapeError);
      }
    }

    // Step 3: Generate description using OpenAI
    const systemPrompt = `You are a corporate research analyst specializing in the OCTG (Oil Country Tubular Goods) and energy industry. Generate a professional company description based on the provided research.

REQUIREMENTS:
- Write exactly 750-850 characters (one paragraph)
- No markdown formatting, no line breaks, no bullet points
- Single flowing paragraph only
- Structure: What they do → Where they operate → Key products/services → Industry significance
- Professional corporate tone
- Focus on OCTG/energy industry relevance
- Factual and verifiable information only
- If limited information is available, focus on the known facts without speculation

OUTPUT: Return ONLY the description text, nothing else. No quotes, no labels, just the description paragraph.`;

    const userPrompt = searchResults
      ? `Generate a professional company description for "${companyName}" based on this research:\n\n${searchResults}`
      : `Generate a professional company description for "${companyName}". This is an OCTG/energy industry company. Use your knowledge to create an accurate, factual description.`;

    console.log("Calling OpenAI to generate description...");

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error("OpenAI error:", errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || "Unknown error"}`);
    }

    const openaiData = await openaiResponse.json();
    const description = openaiData.choices[0]?.message?.content?.trim();

    if (!description) {
      throw new Error("No description generated");
    }

    console.log(`Generated description: ${description.length} characters`);

    return new Response(
      JSON.stringify({ description }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating company description:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate description";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
