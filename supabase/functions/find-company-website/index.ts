import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

async function searchWithPerplexity(companyName: string, apiKey: string): Promise<string | null> {
  try {
    console.log(`Perplexity search for: ${companyName}`);
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          { 
            role: 'system', 
            content: `You are a company research assistant. Find the official corporate website for companies.
            
RULES:
- Return ONLY the official company website domain (e.g., "shell.com", "tenaris.com")
- DO NOT return LinkedIn, Wikipedia, news sites, or social media pages
- DO NOT return URLs with paths - just the root domain
- If the company has multiple regional sites, return the main global/corporate site
- If you cannot find the official website with certainty, respond with "NOT_FOUND"
- Return just the domain, nothing else. No https://, no www., just the domain.` 
          },
          { 
            role: 'user', 
            content: `What is the official corporate website for "${companyName}"? This company operates in the OCTG (Oil Country Tubular Goods), oil & gas, or energy industry. Return only the domain name.` 
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`Perplexity search failed: ${response.status} - ${errorText}`);
      return null;
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content?.trim() || '';
    
    console.log(`Perplexity response: ${aiResponse}`);

    if (!aiResponse || aiResponse === 'NOT_FOUND' || aiResponse.toLowerCase().includes('not found')) {
      return null;
    }

    // Clean up the domain
    let domain = aiResponse
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .replace(/\/.*$/, '')
      .trim()
      .toLowerCase();

    // Basic validation
    if (!domain.includes('.') || domain.length < 4) {
      console.log(`Invalid domain format: ${domain}`);
      return null;
    }

    if (!isValidCorporateDomain(domain)) {
      console.log(`Blocked domain detected: ${domain}`);
      return null;
    }

    return domain;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`Perplexity error: ${message}`);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth: admin/editor required
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const authClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: u, error: ue } = await authClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (ue || !u.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const adm = createClient(supabaseUrl, serviceKey);
    const { data: rr } = await adm.from("user_roles").select("role").eq("user_id", u.user.id);
    const roles = (rr ?? []).map((r: any) => r.role);
    if (!roles.includes("admin") && !roles.includes("editor")) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { companyName } = await req.json();

    if (!companyName || typeof companyName !== 'string' || companyName.length > 200) {
      return new Response(
        JSON.stringify({ success: false, error: 'Valid company name (max 200 chars) is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`\n=== Finding website for: ${companyName} ===`);

    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');

    if (!perplexityApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Perplexity API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use Perplexity to find the website (it has real-time web search)
    const domain = await searchWithPerplexity(companyName, perplexityApiKey);
    
    if (!domain) {
      console.log(`No website found for: ${companyName}`);
      return new Response(
        JSON.stringify({ success: false, website: null, error: 'No valid website found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate the domain exists
    const isValid = await validateDomainExists(domain);
    
    if (isValid) {
      const fullUrl = `https://${domain}`;
      console.log(`SUCCESS: ${fullUrl}`);
      return new Response(
        JSON.stringify({ success: true, website: fullUrl, source: 'perplexity_validated' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Try with www prefix as fallback
    const isValidWww = await validateDomainExists(`www.${domain}`);
    if (isValidWww) {
      const fullUrl = `https://www.${domain}`;
      console.log(`SUCCESS (www): ${fullUrl}`);
      return new Response(
        JSON.stringify({ success: true, website: fullUrl, source: 'perplexity_validated' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return unverified if validation failed but we got a domain
    console.log(`Returning unverified domain: ${domain}`);
    return new Response(
      JSON.stringify({ success: true, website: `https://${domain}`, source: 'perplexity_unverified', verified: false }),
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
