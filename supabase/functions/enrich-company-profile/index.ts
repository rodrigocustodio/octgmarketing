import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Region mapping based on country/headquarters
const REGION_MAPPING: Record<string, string> = {
  // Americas
  "usa": "americas", "united states": "americas", "us": "americas", "canada": "americas",
  "mexico": "americas", "brazil": "americas", "argentina": "americas", "colombia": "americas",
  "venezuela": "americas", "chile": "americas", "peru": "americas", "ecuador": "americas",
  "trinidad": "americas", "guyana": "americas", "suriname": "americas",
  // Europe
  "uk": "europe", "united kingdom": "europe", "england": "europe", "scotland": "europe",
  "germany": "europe", "france": "europe", "italy": "europe", "spain": "europe",
  "netherlands": "europe", "norway": "europe", "sweden": "europe", "denmark": "europe",
  "finland": "europe", "poland": "europe", "romania": "europe", "russia": "europe",
  "ukraine": "europe", "austria": "europe", "switzerland": "europe", "belgium": "europe",
  "czech": "europe", "hungary": "europe", "greece": "europe", "portugal": "europe",
  // Asia-Pacific
  "china": "asia-pacific", "japan": "asia-pacific", "south korea": "asia-pacific", "korea": "asia-pacific",
  "india": "asia-pacific", "singapore": "asia-pacific", "indonesia": "asia-pacific", "malaysia": "asia-pacific",
  "thailand": "asia-pacific", "vietnam": "asia-pacific", "philippines": "asia-pacific", "taiwan": "asia-pacific",
  "pakistan": "asia-pacific", "bangladesh": "asia-pacific", "myanmar": "asia-pacific",
  // Middle East
  "uae": "middle-east", "united arab emirates": "middle-east", "saudi arabia": "middle-east", "saudi": "middle-east",
  "qatar": "middle-east", "kuwait": "middle-east", "oman": "middle-east", "bahrain": "middle-east",
  "iraq": "middle-east", "iran": "middle-east", "israel": "middle-east", "jordan": "middle-east",
  "lebanon": "middle-east", "syria": "middle-east", "yemen": "middle-east", "turkey": "middle-east",
  // Africa
  "nigeria": "africa", "egypt": "africa", "algeria": "africa", "angola": "africa",
  "south africa": "africa", "libya": "africa", "ghana": "africa", "kenya": "africa",
  "morocco": "africa", "tunisia": "africa", "tanzania": "africa", "mozambique": "africa",
  "cameroon": "africa", "senegal": "africa", "congo": "africa", "gabon": "africa",
  "equatorial guinea": "africa", "chad": "africa", "sudan": "africa", "uganda": "africa",
  // Australia
  "australia": "australia", "new zealand": "australia", "papua new guinea": "australia",
};

// Industry role detection keywords
const INDUSTRY_ROLE_KEYWORDS: Record<string, string[]> = {
  "mill": ["manufacturer", "steel mill", "pipe production", "seamless", "welded pipe", "tubular manufacturer", "produces pipes", "manufacturing", "steel producer", "pipe maker"],
  "yard": ["pipe yard", "stockist", "storage", "inventory", "distribution center", "pipe storage", "warehousing"],
  "inspection": ["testing", "inspection", "certification", "quality assurance", "NDT", "non-destructive", "testing services", "quality control", "API certified"],
  "drilling": ["drilling", "rig", "offshore", "well services", "completions", "oilfield services", "drilling contractor", "exploration", "production operator", "E&P", "upstream"],
  "logistics": ["freight", "shipping", "transport", "logistics", "supply chain", "cargo", "maritime"],
  "software": ["software", "digital", "automation", "analytics", "technology", "IT solutions", "data management"],
  "trading": ["trader", "distributor", "supplier", "wholesale", "trading company", "supply", "procurement", "exporter", "importer"],
};

function detectRegion(text: string): string | null {
  const lowerText = text.toLowerCase();
  for (const [key, region] of Object.entries(REGION_MAPPING)) {
    if (lowerText.includes(key)) {
      return region;
    }
  }
  return null;
}

function detectIndustryRole(text: string): string | null {
  const lowerText = text.toLowerCase();
  let bestMatch: { role: string; count: number } | null = null;
  
  for (const [role, keywords] of Object.entries(INDUSTRY_ROLE_KEYWORDS)) {
    const matchCount = keywords.filter(kw => lowerText.includes(kw)).length;
    if (matchCount > 0 && (!bestMatch || matchCount > bestMatch.count)) {
      bestMatch = { role, count: matchCount };
    }
  }
  
  return bestMatch?.role || null;
}

// Validate website URL - reject known non-official domains
function validateWebsiteUrl(url: string | null, companyName: string): string | null {
  if (!url) return null;
  
  const lowerUrl = url.toLowerCase();
  
  // Reject known non-official domains
  const invalidDomains = [
    "linkedin.com", "wikipedia.org", "bloomberg.com", "reuters.com",
    "zoominfo.com", "dnb.com", "crunchbase.com", "glassdoor.com",
    "indeed.com", "facebook.com", "twitter.com", "youtube.com",
    "businesswire.com", "prnewswire.com", "globenewswire.com"
  ];
  
  for (const domain of invalidDomains) {
    if (lowerUrl.includes(domain)) {
      console.log(`Rejecting invalid domain: ${url}`);
      return null;
    }
  }
  
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase().replace("www.", "");
    
    // FIX: Extract company words BEFORE stripping special chars
    const companyWords = companyName.toLowerCase()
      .split(/[\s\-\_\.\&\,]+/)
      .filter(w => w.length > 2 && !["the", "and", "inc", "ltd", "llc", "corp", "plc", "co", "group"].includes(w));
    
    // Also create a concatenated version for single-word domains
    const concatenated = companyName.toLowerCase().replace(/[^a-z0-9]/g, "");
    
    // Extract just the domain name without TLD for comparison
    const domainParts = hostname.split(".");
    const domainName = domainParts.length > 1 ? domainParts.slice(0, -1).join("") : hostname;
    
    // Check if domain contains any company word OR the concatenated name matches
    const domainContainsCompanyWord = companyWords.some(word => 
      hostname.includes(word) || domainName.includes(word)
    );
    
    // Check if concatenated company name matches domain
    const concatenatedMatch = domainName.includes(concatenated) || 
      concatenated.includes(domainName.replace(/[^a-z0-9]/g, ""));
    
    // Valid corporate TLDs (expanded)
    const validTlds = [
      ".com", ".net", ".org", ".co", ".io", ".energy", ".global", 
      ".ae", ".sa", ".cn", ".jp", ".uk", ".de", ".fr", ".it", ".au",
      ".ca", ".br", ".mx", ".ru", ".in", ".sg", ".my", ".id", ".nl",
      ".no", ".se", ".dk", ".fi", ".at", ".ch", ".be", ".pl"
    ];
    const hasValidTld = validTlds.some(tld => hostname.endsWith(tld) || hostname.includes(tld + "."));
    
    console.log(`URL validation for ${companyName}: domain=${hostname}, words=${companyWords.join(",")}, wordMatch=${domainContainsCompanyWord}, concatMatch=${concatenatedMatch}, validTld=${hasValidTld}`);
    
    // Accept if any company word matches OR concatenated matches OR has valid corporate TLD
    if (domainContainsCompanyWord || concatenatedMatch || hasValidTld) {
      return url;
    }
    
    console.log(`Website rejected - no match: ${url}`);
    return null;
  } catch {
    console.log(`Invalid URL format: ${url}`);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyName, existingData } = await req.json();

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

    console.log(`Enriching company profile for: ${companyName}`);

    let searchResults = "";
    let websiteContent = "";
    let foundWebsites: string[] = [];

    // Step 1: Search for company information using Firecrawl
    if (firecrawlApiKey) {
      try {
        // First search: Official website focused
        const websiteQuery = `"${companyName}" official website`;
        console.log(`Searching for official website: ${websiteQuery}`);

        const websiteResponse = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${firecrawlApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: websiteQuery,
            limit: 5,
          }),
        });

        if (websiteResponse.ok) {
          const websiteData = await websiteResponse.json();
          if (websiteData.data && websiteData.data.length > 0) {
            // Collect potential website URLs
            foundWebsites = websiteData.data
              .map((r: any) => r.url)
              .filter((url: string) => validateWebsiteUrl(url, companyName));
            console.log(`Found ${foundWebsites.length} potential official websites`);
          }
        }

        // Second search: Company info for description/details
        const infoQuery = `"${companyName}" company about headquarters founded OCTG energy oil gas`;
        console.log(`Searching for company info: ${infoQuery}`);

        const searchResponse = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${firecrawlApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: infoQuery,
            limit: 5,
            scrapeOptions: {
              formats: ["markdown"],
            },
          }),
        });

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          console.log(`Found ${searchData.data?.length || 0} info results`);

          if (searchData.data && searchData.data.length > 0) {
            searchResults = searchData.data
              .slice(0, 4)
              .map((result: any) => {
                const content = result.markdown || result.description || "";
                return `Source: ${result.title}\nURL: ${result.url}\n${content.slice(0, 2000)}`;
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

    // Step 2: If we have an existing website, try to scrape it for more details
    if (firecrawlApiKey && existingData?.website) {
      try {
        console.log(`Scraping company website: ${existingData.website}`);
        const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${firecrawlApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: existingData.website,
            formats: ["markdown"],
            onlyMainContent: true,
          }),
        });

        if (scrapeResponse.ok) {
          const scrapeData = await scrapeResponse.json();
          if (scrapeData.data?.markdown) {
            websiteContent = scrapeData.data.markdown.slice(0, 3000);
            console.log("Successfully scraped company website");
          }
        }
      } catch (scrapeError) {
        console.error("Website scrape error:", scrapeError);
      }
    }

    // Step 3: Use OpenAI to extract structured data with JSON mode
    const systemPrompt = `You are a corporate research analyst specializing in the OCTG (Oil Country Tubular Goods) and energy industry. Extract comprehensive company information from the provided research.

Return a JSON object with these fields:
- website: Official company website URL (string or null)
- description: Professional company description, exactly 750-850 characters, single paragraph, no markdown (string)
- industry_role: One of: "mill", "yard", "inspection", "drilling", "logistics", "software", "trading" (string or null)
- region: One of: "americas", "europe", "asia-pacific", "middle-east", "africa", "australia" based on headquarters location (string or null)
- year_founded: Year company was founded (number or null)
- phone: Headquarters phone number with country code (string or null)
- email: General contact email (string or null)
- headquarters: City and country of headquarters (string or null)
- country: Country of headquarters (string or null)
- solutions: Array of 3-5 key company solutions/services. Each object must have:
  - title: Short name (2-4 words, e.g., "Premium OCTG Products")
  - description: One-line description (max 15 words, e.g., "API-certified casing and tubing for oil and gas drilling operations")

CRITICAL WEBSITE RULES:
- ONLY include the company's OFFICIAL corporate website
- The website domain should match or closely relate to the company name
- NEVER include LinkedIn, Wikipedia, Bloomberg, Reuters, news sites, ZoomInfo, Crunchbase, or industry directories
- NEVER include URLs that are clearly about the company but not their official site
- If you cannot find a verified official website, return null - DO NOT GUESS
- Valid examples: "https://tenaris.com", "https://vallourec.com", "https://tmk-group.com"
- Invalid examples: LinkedIn profiles, Wikipedia pages, news articles, directory listings

SOLUTIONS RULES:
- Extract 3-5 key products, services, or capabilities the company offers
- Each solution should be distinct and specific to the company
- Focus on their main business offerings in the OCTG/energy sector
- If you cannot identify specific solutions, create general ones based on their industry role

OTHER RULES:
- Only include factual, verifiable information
- If a field cannot be determined, return null
- For description: Write about what they do, where they operate, key products/services, industry significance
- For industry_role: Choose the primary business activity
- Format phone numbers with country code (e.g., +1-713-555-0100)
- Do not guess or make up information`;

    const userPrompt = `Extract company information for "${companyName}".

Existing data we have:
${JSON.stringify(existingData || {}, null, 2)}

${foundWebsites.length > 0 ? `Potential official websites found:\n${foundWebsites.join("\n")}` : ""}

Web search results:
${searchResults || "No search results available"}

${websiteContent ? `Official website content:\n${websiteContent}` : ""}

Return a complete JSON object with all available fields including solutions array.`;

    console.log("Calling OpenAI to extract structured data...");

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
        max_tokens: 1500,
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error("OpenAI error:", errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || "Unknown error"}`);
    }

    const openaiData = await openaiResponse.json();
    const content = openaiData.choices[0]?.message?.content?.trim();

    if (!content) {
      throw new Error("No response from OpenAI");
    }

    let extractedData;
    try {
      extractedData = JSON.parse(content);
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", content);
      throw new Error("Invalid JSON response from OpenAI");
    }

    // Validate and clean website URL
    if (extractedData.website) {
      extractedData.website = validateWebsiteUrl(extractedData.website, companyName);
    }
    
    // If AI didn't find website but we found valid ones, use the first
    if (!extractedData.website && foundWebsites.length > 0) {
      extractedData.website = foundWebsites[0];
    }

    // Fallback region detection from extracted data
    if (!extractedData.region && extractedData.country) {
      extractedData.region = detectRegion(extractedData.country);
    }
    if (!extractedData.region && extractedData.headquarters) {
      extractedData.region = detectRegion(extractedData.headquarters);
    }

    // Fallback industry role detection from description
    if (!extractedData.industry_role && extractedData.description) {
      extractedData.industry_role = detectIndustryRole(extractedData.description);
    }

    // Ensure solutions is an array
    if (!Array.isArray(extractedData.solutions)) {
      extractedData.solutions = [];
    }

    console.log(`Enrichment complete for ${companyName}:`, {
      hasWebsite: !!extractedData.website,
      hasDescription: !!extractedData.description,
      hasIndustryRole: !!extractedData.industry_role,
      hasRegion: !!extractedData.region,
      hasYearFounded: !!extractedData.year_founded,
      solutionsCount: extractedData.solutions?.length || 0,
    });

    return new Response(
      JSON.stringify(extractedData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error enriching company profile:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to enrich company profile";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
