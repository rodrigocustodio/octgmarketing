import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Domains to reject
const INVALID_DOMAINS = [
  "linkedin.com", "wikipedia.org", "bloomberg.com", "reuters.com",
  "facebook.com", "twitter.com", "youtube.com", "instagram.com",
  "crunchbase.com", "zoominfo.com", "dnb.com", "hoovers.com",
  "forbes.com", "fortune.com", "wsj.com", "ft.com", "bbc.com",
  "cnn.com", "nytimes.com", "theguardian.com", "marketwatch.com"
];

async function validateDomainExists(domain: string): Promise<boolean> {
  try {
    const url = domain.startsWith("http") ? domain : `https://${domain}`;
    console.log(`Validating domain: ${url}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, { 
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow'
    });
    
    clearTimeout(timeoutId);
    
    const isValid = response.ok || response.status === 301 || response.status === 302 || response.status === 308;
    console.log(`Domain ${domain} validation: status=${response.status}, valid=${isValid}`);
    return isValid;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`Domain ${domain} validation failed: ${message}`);
    return false;
  }
}

function isValidCorporateDomain(url: string): boolean {
  try {
    const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
    const hostname = urlObj.hostname.toLowerCase();
    
    for (const invalid of INVALID_DOMAINS) {
      if (hostname.includes(invalid)) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

async function searchWithFirecrawl(companyName: string, apiKey: string): Promise<string | null> {
  try {
    console.log(`Firecrawl search for: ${companyName}`);
    
    const response = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `"${companyName}" official website`,
        limit: 5,
      }),
    });

    if (!response.ok) {
      console.log(`Firecrawl search failed: ${response.status}`);
      return null;
    }

    const data = await response.json();
    console.log(`Firecrawl returned ${data.data?.length || 0} results`);
    
    if (data.data && Array.isArray(data.data)) {
      for (const result of data.data) {
        const url = result.url;
        if (url && isValidCorporateDomain(url)) {
          // Validate it actually exists
          if (await validateDomainExists(url)) {
            console.log(`Firecrawl found valid website: ${url}`);
            return url;
          }
        }
      }
    }
    
    return null;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`Firecrawl error: ${message}`);
    return null;
  }
}

async function getOpenAIDomainSuggestions(companyName: string, apiKey: string): Promise<string[]> {
  try {
    console.log(`Getting OpenAI domain suggestions for: ${companyName}`);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a domain name expert. Given a company name, suggest the most likely official website domains.
            
Rules:
- Return ONLY domain names (e.g., "vitol.com", "shell.com")
- Do NOT include http:// or https://
- Prioritize .com domains, then country TLDs
- Consider common patterns: companyname.com, company-name.com, companygroup.com
- For acronyms like "XCMG" suggest: xcmg.com
- For names like "Venture Global LNG" suggest: venturegloballng.com, venturegoballng.com
- Return 3-5 suggestions, most likely first
- Return ONLY a JSON array of strings, nothing else`
          },
          {
            role: 'user',
            content: `What are the most likely official website domains for the company "${companyName}"? Return only a JSON array.`
          }
        ],
        temperature: 0.3,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      console.log(`OpenAI request failed: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    // Parse the JSON array from the response
    const match = content.match(/\[[\s\S]*?\]/);
    if (match) {
      const suggestions = JSON.parse(match[0]) as string[];
      console.log(`OpenAI suggestions: ${suggestions.join(", ")}`);
      return suggestions.filter(s => typeof s === 'string' && s.length > 0);
    }
    
    return [];
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`OpenAI error: ${message}`);
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyName } = await req.json();

    if (!companyName) {
      return new Response(
        JSON.stringify({ success: false, error: 'Company name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`\n=== Finding website for: ${companyName} ===`);

    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Strategy 1: Try Firecrawl search first
    if (firecrawlApiKey) {
      const firecrawlResult = await searchWithFirecrawl(companyName, firecrawlApiKey);
      if (firecrawlResult) {
        console.log(`SUCCESS via Firecrawl: ${firecrawlResult}`);
        return new Response(
          JSON.stringify({ success: true, website: firecrawlResult, source: 'firecrawl' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Strategy 2: Get OpenAI suggestions and validate each
    const suggestions = await getOpenAIDomainSuggestions(companyName, openaiApiKey);
    
    for (const domain of suggestions) {
      if (!isValidCorporateDomain(domain)) {
        console.log(`Skipping invalid domain: ${domain}`);
        continue;
      }
      
      const isValid = await validateDomainExists(domain);
      if (isValid) {
        const fullUrl = domain.startsWith("http") ? domain : `https://${domain}`;
        console.log(`SUCCESS via OpenAI+validation: ${fullUrl}`);
        return new Response(
          JSON.stringify({ success: true, website: fullUrl, source: 'openai_validated' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log(`No valid website found for: ${companyName}`);
    return new Response(
      JSON.stringify({ success: false, website: null, error: 'No valid website found' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Error finding company website:', err);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
