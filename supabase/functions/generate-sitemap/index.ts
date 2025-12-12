import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/xml",
};

const SITE_URL = "https://octgindex.com";

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Generating dynamic sitemap...");

    const urls: SitemapUrl[] = [];

    // Static pages
    urls.push({
      loc: SITE_URL,
      lastmod: formatDate(null),
      changefreq: "daily",
      priority: 1.0,
    });

    urls.push({
      loc: `${SITE_URL}/directory`,
      lastmod: formatDate(null),
      changefreq: "weekly",
      priority: 0.9,
    });

    urls.push({
      loc: `${SITE_URL}/ceo-directory`,
      lastmod: formatDate(null),
      changefreq: "weekly",
      priority: 0.8,
    });

    urls.push({
      loc: `${SITE_URL}/privacy`,
      lastmod: formatDate(null),
      changefreq: "yearly",
      priority: 0.3,
    });

    urls.push({
      loc: `${SITE_URL}/terms`,
      lastmod: formatDate(null),
      changefreq: "yearly",
      priority: 0.3,
    });

    urls.push({
      loc: `${SITE_URL}/newsletter-terms`,
      lastmod: formatDate(null),
      changefreq: "yearly",
      priority: 0.3,
    });

    urls.push({
      loc: `${SITE_URL}/about`,
      lastmod: formatDate(null),
      changefreq: "monthly",
      priority: 0.7,
    });

    urls.push({
      loc: `${SITE_URL}/editorial-policy`,
      lastmod: formatDate(null),
      changefreq: "yearly",
      priority: 0.5,
    });

    urls.push({
      loc: `${SITE_URL}/contact`,
      lastmod: formatDate(null),
      changefreq: "monthly",
      priority: 0.8,
    });

    urls.push({
      loc: `${SITE_URL}/events`,
      lastmod: formatDate(null),
      changefreq: "weekly",
      priority: 0.8,
    });

    urls.push({
      loc: `${SITE_URL}/pricing-index`,
      lastmod: formatDate(null),
      changefreq: "daily",
      priority: 0.8,
    });

    urls.push({
      loc: `${SITE_URL}/octg-directory`,
      lastmod: formatDate(null),
      changefreq: "weekly",
      priority: 0.9,
    });

    urls.push({
      loc: `${SITE_URL}/topics`,
      lastmod: formatDate(null),
      changefreq: "weekly",
      priority: 0.7,
    });

    // Fetch regions
    const { data: regions, error: regionsError } = await supabase
      .from("regions")
      .select("slug, updated_at");

    if (regionsError) {
      console.error("Error fetching regions:", regionsError);
    } else if (regions) {
      console.log(`Found ${regions.length} regions`);
      for (const region of regions) {
        // Region news page
        urls.push({
          loc: `${SITE_URL}/region/${region.slug}`,
          lastmod: formatDate(region.updated_at),
          changefreq: "daily",
          priority: 0.8,
        });
        // Directory region page
        urls.push({
          loc: `${SITE_URL}/directory/region/${region.slug}`,
          lastmod: formatDate(region.updated_at),
          changefreq: "weekly",
          priority: 0.7,
        });
      }
    }

    // Fetch topics
    const { data: topics, error: topicsError } = await supabase
      .from("topics")
      .select("slug, updated_at");

    if (topicsError) {
      console.error("Error fetching topics:", topicsError);
    } else if (topics) {
      console.log(`Found ${topics.length} topics`);
      for (const topic of topics) {
        urls.push({
          loc: `${SITE_URL}/topic/${topic.slug}`,
          lastmod: formatDate(topic.updated_at),
          changefreq: "weekly",
          priority: 0.7,
        });
      }
    }

    // Directory categories (static list based on company_role enum)
    const categories = ["mill", "yard", "inspection", "drilling", "logistics", "software", "trading"];
    for (const category of categories) {
      urls.push({
        loc: `${SITE_URL}/directory/category/${category}`,
        lastmod: formatDate(null),
        changefreq: "weekly",
        priority: 0.7,
      });
    }

    // Fetch published articles
    const { data: articles, error: articlesError } = await supabase
      .from("articles")
      .select("slug, updated_at, publish_date")
      .in("status", ["published", "featured"])
      .order("publish_date", { ascending: false });

    if (articlesError) {
      console.error("Error fetching articles:", articlesError);
    } else if (articles) {
      console.log(`Found ${articles.length} published articles`);
      for (const article of articles) {
        urls.push({
          loc: `${SITE_URL}/article/${article.slug}`,
          lastmod: formatDate(article.updated_at || article.publish_date),
          changefreq: "monthly",
          priority: 0.6,
        });
      }
    }

    // Fetch companies
    const { data: companies, error: companiesError } = await supabase
      .from("companies")
      .select("slug, updated_at");

    if (companiesError) {
      console.error("Error fetching companies:", companiesError);
    } else if (companies) {
      console.log(`Found ${companies.length} companies`);
      for (const company of companies) {
        urls.push({
          loc: `${SITE_URL}/directory/company/${company.slug}`,
          lastmod: formatDate(company.updated_at),
          changefreq: "monthly",
          priority: 0.6,
        });
      }
    }

    // Fetch executives
    const { data: executives, error: executivesError } = await supabase
      .from("executives")
      .select("slug, updated_at");

    if (executivesError) {
      console.error("Error fetching executives:", executivesError);
    } else if (executives) {
      console.log(`Found ${executives.length} executives`);
      for (const executive of executives) {
        urls.push({
          loc: `${SITE_URL}/ceo/${executive.slug}`,
          lastmod: formatDate(executive.updated_at),
          changefreq: "monthly",
          priority: 0.5,
        });
      }
    }

    // Fetch events
    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select("slug, updated_at");

    if (eventsError) {
      console.error("Error fetching events:", eventsError);
    } else if (events) {
      console.log(`Found ${events.length} events`);
      for (const event of events) {
        urls.push({
          loc: `${SITE_URL}/events/${event.slug}`,
          lastmod: formatDate(event.updated_at),
          changefreq: "monthly",
          priority: 0.6,
        });
      }
    }

    // Fetch products with their categories
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("slug, updated_at, category_id");

    // Fetch all product categories for mapping
    const { data: allCategories } = await supabase
      .from("product_categories")
      .select("id, slug");
    
    const categoryMap = new Map<string, string>();
    if (allCategories) {
      for (const cat of allCategories) {
        categoryMap.set(cat.id, cat.slug);
      }
    }

    if (productsError) {
      console.error("Error fetching products:", productsError);
    } else if (products) {
      console.log(`Found ${products.length} products`);
      for (const product of products) {
        const categorySlug = product.category_id ? categoryMap.get(product.category_id) || "uncategorized" : "uncategorized";
        urls.push({
          loc: `${SITE_URL}/octg-directory/${categorySlug}/${product.slug}`,
          lastmod: formatDate(product.updated_at),
          changefreq: "monthly",
          priority: 0.5,
        });
      }
    }

    // Fetch product categories
    const { data: productCategories, error: productCategoriesError } = await supabase
      .from("product_categories")
      .select("slug, updated_at");

    if (productCategoriesError) {
      console.error("Error fetching product categories:", productCategoriesError);
    } else if (productCategories) {
      console.log(`Found ${productCategories.length} product categories`);
      for (const category of productCategories) {
        urls.push({
          loc: `${SITE_URL}/octg-directory/${category.slug}`,
          lastmod: formatDate(category.updated_at),
          changefreq: "weekly",
          priority: 0.7,
        });
      }
    }

    // Generate XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(generateUrlEntry).join("\n")}
</urlset>`;

    console.log(`Generated sitemap with ${urls.length} URLs`);

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    console.error("Error generating sitemap:", error);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://octgindex.com/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`,
      { headers: corsHeaders }
    );
  }
});
