import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Social media crawler user agents
const CRAWLER_USER_AGENTS = [
  "linkedinbot",
  "facebookexternalhit",
  "facebot",
  "twitterbot",
  "whatsapp",
  "telegrambot",
  "slackbot",
  "discordbot",
  "pinterest",
  "redditbot",
  "embedly",
  "quora link preview",
  "showyoubot",
  "outbrain",
  "rogerbot",
  "baiduspider",
  "yandex",
  "googlebot",
];

function isCrawler(userAgent: string | null): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return CRAWLER_USER_AGENTS.some((crawler) => ua.includes(crawler));
}

function generateOgHtml(article: {
  title: string;
  subtitle: string | null;
  hero_image_url: string | null;
  slug: string;
  region?: { name: string } | null;
}): string {
  const siteUrl = Deno.env.get("SITE_URL") || "https://octgindex.com";
  const canonicalUrl = `${siteUrl}/article/${article.slug}`;
  
  // Default fallback image if no hero image
  const defaultImage = `${siteUrl}/og-default.png`;
  const imageUrl = article.hero_image_url || defaultImage;
  
  // Clean description - remove markdown, limit length
  const description = article.subtitle 
    ? article.subtitle.slice(0, 160) 
    : "OCTG Index - Your source for OCTG industry news and analysis";
  
  const siteName = "OCTG Index";
  const regionText = article.region?.name ? ` | ${article.region.name}` : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Primary Meta Tags -->
  <title>${article.title} - ${siteName}</title>
  <meta name="title" content="${article.title} - ${siteName}">
  <meta name="description" content="${description}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:title" content="${article.title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="${siteName}">
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${canonicalUrl}">
  <meta property="twitter:title" content="${article.title}">
  <meta property="twitter:description" content="${description}">
  <meta property="twitter:image" content="${imageUrl}">
  
  <!-- LinkedIn specific -->
  <meta property="og:image:alt" content="${article.title}${regionText}">
  
  <!-- Canonical URL -->
  <link rel="canonical" href="${canonicalUrl}">
  
  <!-- Redirect for humans (JavaScript) -->
  <script>
    window.location.href = "${canonicalUrl}";
  </script>
  <noscript>
    <meta http-equiv="refresh" content="0;url=${canonicalUrl}">
  </noscript>
</head>
<body>
  <h1>${article.title}</h1>
  <p>${description}</p>
  <p>Redirecting to <a href="${canonicalUrl}">${canonicalUrl}</a>...</p>
</body>
</html>`;
}

function generateFallbackHtml(): string {
  const siteUrl = Deno.env.get("SITE_URL") || "https://octgindex.com";
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OCTG Index - Industry News & Analysis</title>
  <meta property="og:title" content="OCTG Index - Industry News & Analysis">
  <meta property="og:description" content="Your source for OCTG industry news, market analysis, and insights">
  <meta property="og:image" content="${siteUrl}/og-default.png">
  <meta property="og:url" content="${siteUrl}">
  <script>window.location.href = "${siteUrl}";</script>
</head>
<body>
  <p>Redirecting to <a href="${siteUrl}">OCTG Index</a>...</p>
</body>
</html>`;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    
    // Expected path: /serve-og/article/{slug}
    // pathParts would be: ["serve-og", "article", "{slug}"]
    // Or if called as /functions/v1/serve-og/article/{slug}
    // pathParts would be: ["functions", "v1", "serve-og", "article", "{slug}"]
    
    let slug: string | null = null;
    
    // Find "article" in path and get the next segment as slug
    const articleIndex = pathParts.findIndex(p => p === "article");
    if (articleIndex !== -1 && pathParts[articleIndex + 1]) {
      slug = pathParts[articleIndex + 1];
    }
    
    console.log(`[serve-og] Path: ${url.pathname}, Slug: ${slug}`);
    
    if (!slug) {
      console.log("[serve-og] No slug found, returning fallback");
      return new Response(generateFallbackHtml(), {
        headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch article data
    const { data: article, error } = await supabase
      .from("articles")
      .select(`
        title,
        subtitle,
        hero_image_url,
        slug,
        regions(name)
      `)
      .eq("slug", slug)
      .in("status", ["published", "featured"])
      .maybeSingle();

    // Transform region data (regions comes as array from join, take first)
    const regionsData = article?.regions as unknown as { name: string }[] | null;
    const articleWithRegion = article ? {
      title: article.title,
      subtitle: article.subtitle,
      hero_image_url: article.hero_image_url,
      slug: article.slug,
      region: regionsData && regionsData.length > 0 ? regionsData[0] : null
    } : null;

    if (error) {
      console.error("[serve-og] Database error:", error);
      return new Response(generateFallbackHtml(), {
        headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
      });
    }

    if (!article) {
      console.log(`[serve-og] Article not found: ${slug}`);
      return new Response(generateFallbackHtml(), {
        headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
      });
    }

    const userAgent = req.headers.get("user-agent");
    console.log(`[serve-og] User-Agent: ${userAgent?.slice(0, 100)}`);
    console.log(`[serve-og] Is Crawler: ${isCrawler(userAgent)}`);

    // For crawlers: return HTML with OG tags
    // For humans: also return HTML (it includes JS redirect)
    // This ensures crawlers always get the meta tags
    const html = generateOgHtml(article);
    
    return new Response(html, {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error("[serve-og] Error:", error);
    return new Response(generateFallbackHtml(), {
      headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
    });
  }
});
