import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// IndexNow API endpoints - we'll ping Bing which shares with other engines
const INDEXNOW_ENDPOINT = "https://www.bing.com/indexnow";
const SITE_URL = "https://octgindex.com";
// IndexNow key - this should match a file at /indexnow-key.txt on your domain
const INDEXNOW_KEY = "octgindex2024seokey";

interface IndexNowPayload {
  host: string;
  key: string;
  keyLocation: string;
  urlList: string[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth: allow cron-secret OR admin/editor JWT
    const cronSecret = Deno.env.get("CRON_SECRET");
    const isCron = !!cronSecret && req.headers.get("x-cron-secret") === cronSecret;

    if (!isCron) {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const token = authHeader.replace("Bearer ", "");
      const adm = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      const { data: u, error: uErr } = await adm.auth.getUser(token);
      if (uErr || !u?.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: rr } = await adm.from("user_roles").select("role").eq("user_id", u.user.id);
      const roles = (rr ?? []).map((r: any) => r.role);
      if (!roles.includes("admin") && !roles.includes("editor")) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { urls, articleSlug, eventSlug, companySlug } = await req.json();

    // Build URL list from various inputs
    const urlList: string[] = [];

    // If specific URLs provided
    if (urls && Array.isArray(urls)) {
      urlList.push(...urls.filter((u: string) => u.startsWith(SITE_URL)));
    }

    // If article slug provided
    if (articleSlug) {
      urlList.push(`${SITE_URL}/article/${articleSlug}`);
    }

    // If event slug provided
    if (eventSlug) {
      urlList.push(`${SITE_URL}/events/${eventSlug}`);
    }

    // If company slug provided
    if (companySlug) {
      urlList.push(`${SITE_URL}/directory/company/${companySlug}`);
    }

    if (urlList.length === 0) {
      console.log("No URLs provided to index");
      return new Response(
        JSON.stringify({ success: false, message: "No URLs provided" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Deduplicate URLs
    const uniqueUrls = [...new Set(urlList)];
    console.log(`Submitting ${uniqueUrls.length} URLs to IndexNow:`, uniqueUrls);

    // Build IndexNow payload
    const payload: IndexNowPayload = {
      host: "octgindex.com",
      key: INDEXNOW_KEY,
      keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
      urlList: uniqueUrls,
    };

    // Submit to IndexNow API
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const status = response.status;
    console.log(`IndexNow response status: ${status}`);

    // IndexNow returns 200 for success, 202 for accepted
    if (status === 200 || status === 202) {
      console.log("IndexNow submission successful");
      
      // Log to database for tracking
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Optional: track submissions (we could create a table for this)
      console.log(`Successfully submitted ${uniqueUrls.length} URLs to IndexNow`);

      return new Response(
        JSON.stringify({
          success: true,
          submitted: uniqueUrls.length,
          urls: uniqueUrls,
          status: status,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      const errorText = await response.text();
      console.error(`IndexNow error: ${status} - ${errorText}`);
      
      return new Response(
        JSON.stringify({
          success: false,
          status: status,
          error: errorText,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("IndexNow submission error:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
