import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const BUNNY_STORAGE_ZONE = "tukia-assets";
const BUNNY_CDN_URL = "https://tukia-cdn.b-cdn.net";
const BUNNY_STORAGE_API_KEY = Deno.env.get("BUNNY_STORAGE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MigrationResult {
  id: string;
  table: string;
  originalUrl: string;
  newUrl?: string;
  error?: string;
}

async function uploadToBunny(imageUrl: string, filePath: string): Promise<string> {
  console.log(`[migrate-to-bunny] Downloading image from: ${imageUrl}`);

  const imageResponse = await fetch(imageUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; OCTGIndex/1.0)",
    },
  });

  if (!imageResponse.ok) {
    throw new Error(`Failed to download image: ${imageResponse.status}`);
  }

  const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
  const imageBuffer = await imageResponse.arrayBuffer();

  console.log(`[migrate-to-bunny] Downloaded ${imageBuffer.byteLength} bytes, uploading to: ${filePath}`);

  const uploadResponse = await fetch(
    `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/${filePath}`,
    {
      method: "PUT",
      headers: {
        "AccessKey": BUNNY_STORAGE_API_KEY!,
        "Content-Type": contentType,
      },
      body: imageBuffer,
    }
  );

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    throw new Error(`Bunny.net upload failed: ${uploadResponse.status} - ${errorText}`);
  }

  return `${BUNNY_CDN_URL}/${filePath}`;
}

function getFileExtension(url: string, contentType?: string): string {
  // Try to get extension from URL
  const urlMatch = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  if (urlMatch) {
    const ext = urlMatch[1].toLowerCase();
    if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) {
      return ext === "jpeg" ? "jpg" : ext;
    }
  }
  
  // Default to jpg
  return "jpg";
}

function isBunnyCdnUrl(url: string): boolean {
  return url.includes("tukia-cdn.b-cdn.net") || url.includes("bunnycdn.com");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!BUNNY_STORAGE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "BUNNY_STORAGE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Authentication check - require admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('[migrate-to-bunny] Unauthorized - no auth header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.log('[migrate-to-bunny] Unauthorized - invalid token');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check admin role
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);
    
    const userRoles = roles?.map(r => r.role) || [];
    if (!userRoles.includes('admin')) {
      console.log('[migrate-to-bunny] Forbidden - admin role required');
      return new Response(
        JSON.stringify({ error: 'Forbidden - admin role required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const table = body.table || "both";
    const limit = body.limit || 50;
    const dryRun = body.dryRun || false;

    console.log(`[migrate-to-bunny] Starting migration by admin ${user.id}: table=${table}, limit=${limit}, dryRun=${dryRun}`);

    const migrated: MigrationResult[] = [];
    const failed: MigrationResult[] = [];
    const skipped: MigrationResult[] = [];

    // Process articles
    if (table === "articles" || table === "both") {
      const { data: articles, error: articlesError } = await supabase
        .from("articles")
        .select("id, hero_image_url, slug")
        .not("hero_image_url", "is", null)
        .limit(limit);

      if (articlesError) {
        console.error("[migrate-to-bunny] Error fetching articles:", articlesError);
      } else if (articles) {
        console.log(`[migrate-to-bunny] Found ${articles.length} articles with images`);

        for (const article of articles) {
          if (!article.hero_image_url || isBunnyCdnUrl(article.hero_image_url)) {
            skipped.push({
              id: article.id,
              table: "articles",
              originalUrl: article.hero_image_url || "",
            });
            continue;
          }

          const ext = getFileExtension(article.hero_image_url);
          const filePath = `octgindex/articles/${article.id}/hero.${ext}`;

          if (dryRun) {
            migrated.push({
              id: article.id,
              table: "articles",
              originalUrl: article.hero_image_url,
              newUrl: `${BUNNY_CDN_URL}/${filePath}`,
            });
            continue;
          }

          try {
            const newUrl = await uploadToBunny(article.hero_image_url, filePath);

            const { error: updateError } = await supabase
              .from("articles")
              .update({ hero_image_url: newUrl })
              .eq("id", article.id);

            if (updateError) {
              throw new Error(`Database update failed: ${updateError.message}`);
            }

            migrated.push({
              id: article.id,
              table: "articles",
              originalUrl: article.hero_image_url,
              newUrl,
            });
            console.log(`[migrate-to-bunny] Migrated article ${article.id}`);
          } catch (error) {
            failed.push({
              id: article.id,
              table: "articles",
              originalUrl: article.hero_image_url,
              error: error instanceof Error ? error.message : "Unknown error",
            });
            console.error(`[migrate-to-bunny] Failed to migrate article ${article.id}:`, error);
          }
        }
      }
    }

    // Process draft_articles
    if (table === "draft_articles" || table === "both") {
      const { data: drafts, error: draftsError } = await supabase
        .from("draft_articles")
        .select("id, hero_image_url, slug")
        .not("hero_image_url", "is", null)
        .limit(limit);

      if (draftsError) {
        console.error("[migrate-to-bunny] Error fetching drafts:", draftsError);
      } else if (drafts) {
        console.log(`[migrate-to-bunny] Found ${drafts.length} drafts with images`);

        for (const draft of drafts) {
          if (!draft.hero_image_url || isBunnyCdnUrl(draft.hero_image_url)) {
            skipped.push({
              id: draft.id,
              table: "draft_articles",
              originalUrl: draft.hero_image_url || "",
            });
            continue;
          }

          const ext = getFileExtension(draft.hero_image_url);
          const filePath = `octgindex/drafts/${draft.id}/hero.${ext}`;

          if (dryRun) {
            migrated.push({
              id: draft.id,
              table: "draft_articles",
              originalUrl: draft.hero_image_url,
              newUrl: `${BUNNY_CDN_URL}/${filePath}`,
            });
            continue;
          }

          try {
            const newUrl = await uploadToBunny(draft.hero_image_url, filePath);

            const { error: updateError } = await supabase
              .from("draft_articles")
              .update({ hero_image_url: newUrl })
              .eq("id", draft.id);

            if (updateError) {
              throw new Error(`Database update failed: ${updateError.message}`);
            }

            migrated.push({
              id: draft.id,
              table: "draft_articles",
              originalUrl: draft.hero_image_url,
              newUrl,
            });
            console.log(`[migrate-to-bunny] Migrated draft ${draft.id}`);
          } catch (error) {
            failed.push({
              id: draft.id,
              table: "draft_articles",
              originalUrl: draft.hero_image_url,
              error: error instanceof Error ? error.message : "Unknown error",
            });
            console.error(`[migrate-to-bunny] Failed to migrate draft ${draft.id}:`, error);
          }
        }
      }
    }

    const summary = {
      total: migrated.length + failed.length + skipped.length,
      migrated: migrated.length,
      failed: failed.length,
      skipped: skipped.length,
      dryRun,
    };

    console.log(`[migrate-to-bunny] Migration complete:`, summary);

    return new Response(
      JSON.stringify({
        success: true,
        migrated,
        failed,
        skipped,
        summary,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[migrate-to-bunny] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Migration failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
