import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MIN_BIO_LENGTH = 750;
const MAX_BIO_LENGTH = 850;

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

    const { executiveName, title, companyName, linkedinUrl } = await req.json();

    if (!executiveName || !companyName) {
      return new Response(
        JSON.stringify({ error: "Executive name and company name are required" }),
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

    console.log(`Generating biography for: ${executiveName} at ${companyName}`);

    let searchResults = "";

    // Step 1: Search for executive information using Firecrawl
    if (firecrawlApiKey) {
      try {
        const searchQuery = `"${executiveName}" ${companyName} CEO executive biography career background`;
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
              .slice(0, 4)
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

    // Step 2: If we have a LinkedIn URL, try to get more context
    if (firecrawlApiKey && linkedinUrl) {
      try {
        console.log(`Attempting to get LinkedIn context for: ${linkedinUrl}`);
        // Note: LinkedIn may block direct scraping, but we can try
        const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${firecrawlApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: linkedinUrl,
            formats: ["markdown"],
            onlyMainContent: true,
          }),
        });

        if (scrapeResponse.ok) {
          const scrapeData = await scrapeResponse.json();
          if (scrapeData.data?.markdown) {
            searchResults += `\n\n---\n\nLinkedIn Profile:\n${scrapeData.data.markdown.slice(0, 1500)}`;
            console.log("Successfully retrieved LinkedIn information");
          }
        }
      } catch (scrapeError) {
        console.error("LinkedIn scrape error (expected):", scrapeError);
      }
    }

    // Step 3: Generate biography using OpenAI
    const systemPrompt = `You are a corporate biographer specializing in executive profiles for the OCTG (Oil Country Tubular Goods) and energy industry. Generate a professional executive biography based on the provided research.

STRICT REQUIREMENTS:
- Write EXACTLY ${MIN_BIO_LENGTH}-${MAX_BIO_LENGTH} characters (count carefully!)
- No markdown formatting, no headers, no line breaks, no bullet points
- Single continuous flowing paragraph ONLY
- Structure: Name → Current role/title → Company context → Career path highlights → Key achievements → Education (if notable)
- Professional corporate biographical tone
- Factual and verifiable information only
- If limited information is available, focus on role and company context without speculation
- DO NOT include phrases like "could not find" or "limited information"

OUTPUT: Return ONLY the biography text, nothing else. No quotes, no labels, just the biography paragraph between ${MIN_BIO_LENGTH}-${MAX_BIO_LENGTH} characters.`;

    const userPrompt = searchResults
      ? `Generate a professional executive biography for ${executiveName}, ${title || "CEO"} of ${companyName}, based on this research:\n\n${searchResults}`
      : `Generate a professional executive biography for ${executiveName}, ${title || "CEO"} of ${companyName}. This is an executive in the OCTG/energy industry. Use your knowledge to create an accurate, factual biography.`;

    console.log("Calling OpenAI to generate biography...");

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
    let biography = openaiData.choices[0]?.message?.content?.trim();

    if (!biography) {
      throw new Error("No biography generated");
    }

    // Validate length and adjust if needed
    const bioLength = biography.length;
    console.log(`Generated biography: ${bioLength} characters`);

    const isValid = bioLength >= MIN_BIO_LENGTH && bioLength <= MAX_BIO_LENGTH;

    return new Response(
      JSON.stringify({ 
        biography,
        length: bioLength,
        isValid,
        message: isValid 
          ? "Biography generated successfully" 
          : `Biography is ${bioLength < MIN_BIO_LENGTH ? "too short" : "too long"} (${bioLength} chars, target: ${MIN_BIO_LENGTH}-${MAX_BIO_LENGTH})`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating executive biography:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate biography";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
