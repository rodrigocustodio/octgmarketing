import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://octgindex.com";

interface LinkMatch {
  text: string;
  url: string;
  type: "company" | "topic" | "product";
}

// Escape special regex characters
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Process markdown body and add internal links
function addInternalLinks(
  body: string,
  companies: { name: string; slug: string }[],
  topics: { name: string; slug: string }[],
  products: { name: string; slug: string; categorySlug: string }[],
  maxLinksPerEntity: number = 2
): { body: string; linksAdded: LinkMatch[] } {
  let processedBody = body;
  const linksAdded: LinkMatch[] = [];
  const linkCounts = new Map<string, number>();

  // Sort by name length descending to match longer names first
  const sortedCompanies = [...companies].sort((a, b) => b.name.length - a.name.length);
  const sortedTopics = [...topics].sort((a, b) => b.name.length - a.name.length);
  const sortedProducts = [...products].sort((a, b) => b.name.length - a.name.length);

  // Helper to check if text is already inside a markdown link
  function isInsideLink(text: string, position: number, body: string): boolean {
    // Check if we're inside an existing markdown link [text](url)
    const beforeText = body.substring(0, position);
    const afterText = body.substring(position + text.length);
    
    // Check for opening bracket before and closing pattern after
    const lastOpenBracket = beforeText.lastIndexOf("[");
    const lastCloseBracket = beforeText.lastIndexOf("]");
    
    if (lastOpenBracket > lastCloseBracket) {
      // We're inside brackets, check if it's a link
      const afterPattern = afterText.match(/^\]\([^)]+\)/);
      if (afterPattern) return true;
    }
    
    // Check if we're inside the URL part of a link
    const lastOpenParen = beforeText.lastIndexOf("](");
    const lastCloseParen = beforeText.lastIndexOf(")");
    if (lastOpenParen > lastCloseParen) return true;
    
    return false;
  }

  // Add company links
  for (const company of sortedCompanies) {
    const count = linkCounts.get(company.slug) || 0;
    if (count >= maxLinksPerEntity) continue;

    // Match company name with word boundaries, case insensitive
    const regex = new RegExp(`\\b(${escapeRegex(company.name)})\\b`, "gi");
    let match;
    let replaced = false;

    while ((match = regex.exec(processedBody)) !== null && (linkCounts.get(company.slug) || 0) < maxLinksPerEntity) {
      if (!isInsideLink(match[0], match.index, processedBody)) {
        const originalText = match[1];
        const link = `[${originalText}](${SITE_URL}/directory/company/${company.slug})`;
        
        // Replace only this occurrence
        processedBody = 
          processedBody.substring(0, match.index) + 
          link + 
          processedBody.substring(match.index + match[0].length);
        
        linksAdded.push({ text: originalText, url: `/directory/company/${company.slug}`, type: "company" });
        linkCounts.set(company.slug, (linkCounts.get(company.slug) || 0) + 1);
        replaced = true;
        
        // Reset regex to account for changed string length
        regex.lastIndex = match.index + link.length;
      }
    }
  }

  // Add topic links (be more selective - only exact matches)
  for (const topic of sortedTopics) {
    // Skip very short topic names that might match too broadly
    if (topic.name.length < 4) continue;
    
    const count = linkCounts.get(`topic-${topic.slug}`) || 0;
    if (count >= maxLinksPerEntity) continue;

    const regex = new RegExp(`\\b(${escapeRegex(topic.name)})\\b`, "gi");
    let match;

    while ((match = regex.exec(processedBody)) !== null && (linkCounts.get(`topic-${topic.slug}`) || 0) < maxLinksPerEntity) {
      if (!isInsideLink(match[0], match.index, processedBody)) {
        const originalText = match[1];
        const link = `[${originalText}](${SITE_URL}/topic/${topic.slug})`;
        
        processedBody = 
          processedBody.substring(0, match.index) + 
          link + 
          processedBody.substring(match.index + match[0].length);
        
        linksAdded.push({ text: originalText, url: `/topic/${topic.slug}`, type: "topic" });
        linkCounts.set(`topic-${topic.slug}`, (linkCounts.get(`topic-${topic.slug}`) || 0) + 1);
        
        regex.lastIndex = match.index + link.length;
      }
    }
  }

  // Add product links
  for (const product of sortedProducts) {
    if (product.name.length < 4) continue;
    
    const count = linkCounts.get(`product-${product.slug}`) || 0;
    if (count >= maxLinksPerEntity) continue;

    const regex = new RegExp(`\\b(${escapeRegex(product.name)})\\b`, "gi");
    let match;

    while ((match = regex.exec(processedBody)) !== null && (linkCounts.get(`product-${product.slug}`) || 0) < maxLinksPerEntity) {
      if (!isInsideLink(match[0], match.index, processedBody)) {
        const originalText = match[1];
        const link = `[${originalText}](${SITE_URL}/octg-directory/${product.categorySlug}/${product.slug})`;
        
        processedBody = 
          processedBody.substring(0, match.index) + 
          link + 
          processedBody.substring(match.index + match[0].length);
        
        linksAdded.push({ text: originalText, url: `/octg-directory/${product.categorySlug}/${product.slug}`, type: "product" });
        linkCounts.set(`product-${product.slug}`, (linkCounts.get(`product-${product.slug}`) || 0) + 1);
        
        regex.lastIndex = match.index + link.length;
      }
    }
  }

  return { body: processedBody, linksAdded };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { articleId, draftId, body, dryRun = false, maxLinksPerEntity = 2 } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let articleBody = body;
    let targetTable = "";
    let targetId = "";

    // Fetch article body if not provided directly
    if (!articleBody && articleId) {
      const { data: article } = await supabase
        .from("articles")
        .select("body")
        .eq("id", articleId)
        .single();
      
      if (!article?.body) {
        return new Response(
          JSON.stringify({ success: false, error: "Article not found or has no body" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
        );
      }
      articleBody = article.body;
      targetTable = "articles";
      targetId = articleId;
    } else if (!articleBody && draftId) {
      const { data: draft } = await supabase
        .from("draft_articles")
        .select("body_markdown")
        .eq("id", draftId)
        .single();
      
      if (!draft?.body_markdown) {
        return new Response(
          JSON.stringify({ success: false, error: "Draft not found or has no body" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
        );
      }
      articleBody = draft.body_markdown;
      targetTable = "draft_articles";
      targetId = draftId;
    }

    if (!articleBody) {
      return new Response(
        JSON.stringify({ success: false, error: "No body content provided" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log(`Processing internal links for ${targetTable || "provided body"}`);

    // Fetch entities for linking
    const [companiesResult, topicsResult, productsResult, categoriesResult] = await Promise.all([
      supabase.from("companies").select("name, slug").order("name"),
      supabase.from("topics").select("name, slug").order("name"),
      supabase.from("products").select("name, slug, category_id").order("name"),
      supabase.from("product_categories").select("id, slug"),
    ]);

    const companies = companiesResult.data || [];
    const topics = topicsResult.data || [];
    const rawProducts = productsResult.data || [];
    const categories = categoriesResult.data || [];

    // Map products with their category slugs
    const categoryMap = new Map(categories.map(c => [c.id, c.slug]));
    const products = rawProducts
      .filter(p => p.category_id && categoryMap.has(p.category_id))
      .map(p => ({
        name: p.name,
        slug: p.slug,
        categorySlug: categoryMap.get(p.category_id)!,
      }));

    console.log(`Loaded ${companies.length} companies, ${topics.length} topics, ${products.length} products`);

    // Process the body
    const { body: processedBody, linksAdded } = addInternalLinks(
      articleBody,
      companies,
      topics,
      products,
      maxLinksPerEntity
    );

    console.log(`Added ${linksAdded.length} internal links`);

    // If not a dry run and we have a target, update the database
    if (!dryRun && targetTable && targetId) {
      const updateField = targetTable === "articles" ? "body" : "body_markdown";
      const { error: updateError } = await supabase
        .from(targetTable)
        .update({ [updateField]: processedBody })
        .eq("id", targetId);

      if (updateError) {
        console.error("Failed to update article:", updateError);
        return new Response(
          JSON.stringify({ success: false, error: updateError.message }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

      console.log(`Updated ${targetTable} ${targetId} with internal links`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        linksAdded: linksAdded.length,
        links: linksAdded,
        dryRun,
        processedBody: dryRun ? processedBody : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Auto internal links error:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
