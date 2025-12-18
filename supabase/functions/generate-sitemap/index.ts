import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BASE_URL = "https://octgindex.com";

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: number;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatDate(date: string | null): string {
  if (!date) return new Date().toISOString().split("T")[0];
  return new Date(date).toISOString().split("T")[0];
}

function generateUrlEntry(url: SitemapUrl): string {
  return `  <url>
    <loc>${escapeXml(url.loc)}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ""}
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority.toFixed(1)}</priority>
  </url>`;
}

function generateSitemapXml(urls: SitemapUrl[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(generateUrlEntry).join("\n")}
</urlset>`;
}

function generateSitemapIndex(sitemaps: { loc: string; lastmod: string }[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map(s => `  <sitemap>
    <loc>${escapeXml(s.loc)}</loc>
    <lastmod>${s.lastmod}</lastmod>
  </sitemap>`).join("\n")}
</sitemapindex>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type") || "index";

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const today = formatDate(null);
    let xmlContent = "";

    console.log(`Generating sitemap type: ${type}`);

    // ============================================
    // SITEMAP INDEX - Master sitemap pointing to all others
    // ============================================
    if (type === "index") {
      const sitemaps = [
        { loc: `${BASE_URL}/sitemap-news.xml`, lastmod: today },
        { loc: `${BASE_URL}/sitemap-google-news.xml`, lastmod: today },
        { loc: `${BASE_URL}/sitemap-events.xml`, lastmod: today },
        { loc: `${BASE_URL}/sitemap-directory.xml`, lastmod: today },
        { loc: `${BASE_URL}/sitemap-pages.xml`, lastmod: today },
      ];
      xmlContent = generateSitemapIndex(sitemaps);
      console.log("Generated sitemap index with 5 sitemaps");
    }

    // ============================================
    // NEWS SITEMAP - Articles (PRIMARY SEO DRIVER)
    // ============================================
    else if (type === "news") {
      const urls: SitemapUrl[] = [];

      // Main news page
      urls.push({
        loc: `${BASE_URL}/news`,
        lastmod: today,
        changefreq: "daily",
        priority: 0.9,
      });

      // All published articles
      const { data: articles } = await supabase
        .from("articles")
        .select("slug, publish_date, updated_at, status")
        .in("status", ["published", "featured"])
        .order("publish_date", { ascending: false });

      if (articles) {
        console.log(`Found ${articles.length} articles for news sitemap`);
        for (const article of articles) {
          urls.push({
            loc: `${BASE_URL}/article/${article.slug}`,
            lastmod: formatDate(article.updated_at || article.publish_date),
            changefreq: "weekly",
            priority: article.status === "featured" ? 0.9 : 0.8,
          });
        }
      }

      // Region pages (news by region)
      const { data: regions } = await supabase.from("regions").select("slug, updated_at");
      if (regions) {
        for (const region of regions) {
          urls.push({
            loc: `${BASE_URL}/region/${region.slug}`,
            lastmod: formatDate(region.updated_at),
            changefreq: "daily",
            priority: 0.8,
          });
        }
      }

      // Topic pages (news by topic)
      const { data: topics } = await supabase.from("topics").select("slug, updated_at");
      if (topics) {
        for (const topic of topics) {
          urls.push({
            loc: `${BASE_URL}/topic/${topic.slug}`,
            lastmod: formatDate(topic.updated_at),
            changefreq: "daily",
            priority: 0.7,
          });
        }
      }

      xmlContent = generateSitemapXml(urls);
      console.log(`Generated news sitemap with ${urls.length} URLs`);
    }

    // ============================================
    // EVENTS SITEMAP - Energy Events (SECONDARY PILLAR)
    // ============================================
    else if (type === "events") {
      const urls: SitemapUrl[] = [];

      // Main events page
      urls.push({
        loc: `${BASE_URL}/events`,
        lastmod: today,
        changefreq: "weekly",
        priority: 0.8,
      });

      // Individual events
      const { data: events } = await supabase
        .from("events")
        .select("slug, start_date, updated_at")
        .order("start_date", { ascending: true });

      if (events) {
        console.log(`Found ${events.length} events for events sitemap`);
        const now = new Date();
        for (const event of events) {
          const eventDate = new Date(event.start_date);
          const isUpcoming = eventDate >= now;
          
          urls.push({
            loc: `${BASE_URL}/events/${event.slug}`,
            lastmod: formatDate(event.updated_at),
            changefreq: isUpcoming ? "weekly" : "monthly",
            priority: isUpcoming ? 0.8 : 0.5,
          });
        }
      }

      xmlContent = generateSitemapXml(urls);
      console.log(`Generated events sitemap with ${urls.length} URLs`);
    }

    // ============================================
    // DIRECTORY SITEMAP - Companies, CEOs, Products (SUPPORTING LAYER)
    // ============================================
    else if (type === "directory") {
      const urls: SitemapUrl[] = [];

      // Main directory pages
      urls.push({
        loc: `${BASE_URL}/directory`,
        lastmod: today,
        changefreq: "weekly",
        priority: 0.7,
      });
      urls.push({
        loc: `${BASE_URL}/ceo-directory`,
        lastmod: today,
        changefreq: "weekly",
        priority: 0.7,
      });
      urls.push({
        loc: `${BASE_URL}/octg-directory`,
        lastmod: today,
        changefreq: "monthly",
        priority: 0.7,
      });

      // Companies
      const { data: companies } = await supabase
        .from("companies")
        .select("slug, updated_at")
        .order("name");

      if (companies) {
        console.log(`Found ${companies.length} companies for directory sitemap`);
        for (const company of companies) {
          urls.push({
            loc: `${BASE_URL}/directory/company/${company.slug}`,
            lastmod: formatDate(company.updated_at),
            changefreq: "monthly",
            priority: 0.6,
          });
        }
      }

      // Executives/CEOs
      const { data: executives } = await supabase
        .from("executives")
        .select("slug, updated_at")
        .order("name");

      if (executives) {
        console.log(`Found ${executives.length} executives for directory sitemap`);
        for (const exec of executives) {
          urls.push({
            loc: `${BASE_URL}/ceo/${exec.slug}`,
            lastmod: formatDate(exec.updated_at),
            changefreq: "monthly",
            priority: 0.6,
          });
        }
      }

      // Product categories
      const { data: categories } = await supabase
        .from("product_categories")
        .select("id, slug, updated_at")
        .order("sort_order");

      const categoryMap = new Map<string, string>();
      if (categories) {
        for (const cat of categories) {
          categoryMap.set(cat.id, cat.slug);
          urls.push({
            loc: `${BASE_URL}/octg-directory/${cat.slug}`,
            lastmod: formatDate(cat.updated_at),
            changefreq: "monthly",
            priority: 0.6,
          });
        }
      }

      // Individual products
      const { data: products } = await supabase
        .from("products")
        .select("slug, updated_at, category_id")
        .order("sort_order");

      if (products) {
        console.log(`Found ${products.length} products for directory sitemap`);
        for (const product of products) {
          const categorySlug = product.category_id ? categoryMap.get(product.category_id) : null;
          if (categorySlug) {
            urls.push({
              loc: `${BASE_URL}/octg-directory/${categorySlug}/${product.slug}`,
              lastmod: formatDate(product.updated_at),
              changefreq: "monthly",
              priority: 0.5,
            });
          }
        }
      }

      // Directory region pages
      const { data: regions } = await supabase.from("regions").select("slug");
      if (regions) {
        for (const region of regions) {
          urls.push({
            loc: `${BASE_URL}/directory/region/${region.slug}`,
            lastmod: today,
            changefreq: "monthly",
            priority: 0.5,
          });
        }
      }

      // Directory category pages (company roles)
      const companyRoles = ["mill", "yard", "inspection", "drilling", "logistics", "software", "trading"];
      for (const role of companyRoles) {
        urls.push({
          loc: `${BASE_URL}/directory/category/${role}`,
          lastmod: today,
          changefreq: "monthly",
          priority: 0.5,
        });
      }

      xmlContent = generateSitemapXml(urls);
      console.log(`Generated directory sitemap with ${urls.length} URLs`);
    }

    // ============================================
    // PAGES SITEMAP - Static/Core Pages
    // ============================================
    else if (type === "pages") {
      const urls: SitemapUrl[] = [
        // Homepage - highest priority
        { loc: BASE_URL, lastmod: today, changefreq: "daily", priority: 1.0 },
        
        // Core navigation pages
        { loc: `${BASE_URL}/pricing-index`, lastmod: today, changefreq: "daily", priority: 0.8 },
        { loc: `${BASE_URL}/topics`, lastmod: today, changefreq: "weekly", priority: 0.7 },
        { loc: `${BASE_URL}/search`, lastmod: today, changefreq: "monthly", priority: 0.5 },
        
        // About & Contact (E-E-A-T)
        { loc: `${BASE_URL}/about`, lastmod: today, changefreq: "monthly", priority: 0.6 },
        { loc: `${BASE_URL}/contact`, lastmod: today, changefreq: "monthly", priority: 0.6 },
        { loc: `${BASE_URL}/editorial-policy`, lastmod: today, changefreq: "yearly", priority: 0.4 },
        
        // Legal pages
        { loc: `${BASE_URL}/privacy`, lastmod: today, changefreq: "yearly", priority: 0.3 },
        { loc: `${BASE_URL}/terms`, lastmod: today, changefreq: "yearly", priority: 0.3 },
        { loc: `${BASE_URL}/newsletter-terms`, lastmod: today, changefreq: "yearly", priority: 0.3 },
      ];

      xmlContent = generateSitemapXml(urls);
      console.log(`Generated pages sitemap with ${urls.length} URLs`);
    }

    // ============================================
    // GOOGLE NEWS SITEMAP - Articles from last 48 hours (for Google News)
    // ============================================
    else if (type === "google-news") {
      // Google News requires special namespace and only articles from last 48 hours
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const cutoffDate = twoDaysAgo.toISOString();

      const { data: recentArticles } = await supabase
        .from("articles")
        .select("slug, title, publish_date")
        .in("status", ["published", "featured"])
        .gte("publish_date", cutoffDate)
        .order("publish_date", { ascending: false });

      console.log(`Found ${recentArticles?.length || 0} articles from last 48 hours for Google News sitemap`);

      // Generate Google News specific XML
      const newsEntries = (recentArticles || []).map(article => {
        const pubDate = article.publish_date 
          ? new Date(article.publish_date).toISOString()
          : new Date().toISOString();
        
        return `  <url>
    <loc>${escapeXml(`${BASE_URL}/article/${article.slug}`)}</loc>
    <news:news>
      <news:publication>
        <news:name>OCTG Index</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${escapeXml(article.title)}</news:title>
    </news:news>
  </url>`;
      }).join("\n");

      xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${newsEntries}
</urlset>`;
      console.log(`Generated Google News sitemap with ${recentArticles?.length || 0} URLs`);
    }

    // Default fallback - return sitemap index
    else {
      const sitemaps = [
        { loc: `${BASE_URL}/sitemap-news.xml`, lastmod: today },
        { loc: `${BASE_URL}/sitemap-google-news.xml`, lastmod: today },
        { loc: `${BASE_URL}/sitemap-events.xml`, lastmod: today },
        { loc: `${BASE_URL}/sitemap-directory.xml`, lastmod: today },
        { loc: `${BASE_URL}/sitemap-pages.xml`, lastmod: today },
      ];
      xmlContent = generateSitemapIndex(sitemaps);
    }

    return new Response(xmlContent, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    console.error("Sitemap generation error:", error);
    
    // Fallback minimal sitemap
    const fallback = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
    
    return new Response(fallback, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml; charset=utf-8",
      },
    });
  }
});
