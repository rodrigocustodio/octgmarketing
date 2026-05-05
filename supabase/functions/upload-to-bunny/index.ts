import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BUNNY_STORAGE_ZONE = "tukia-assets";
const BUNNY_CDN_URL = "https://tukia-cdn.b-cdn.net";
const BUNNY_STORAGE_API_KEY = Deno.env.get("BUNNY_STORAGE_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
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

    const { imageUrl, fileName, folder = "octgindex/articles" } = await req.json();

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: "imageUrl is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Folder allowlist (prevent path traversal/abuse)
    const ALLOWED_FOLDERS = new Set([
      "octgindex/articles",
      "octgindex/articles/generated",
      "octgindex/companies",
      "octgindex/events",
      "octgindex/executives",
    ]);
    if (!ALLOWED_FOLDERS.has(folder)) {
      return new Response(
        JSON.stringify({ error: "Invalid folder" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate that imageUrl is an absolute https URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(imageUrl);
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid URL" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
      return new Response(
        JSON.stringify({ error: "Only http(s) URLs allowed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // SSRF guard: block private/loopback/link-local/metadata hosts
    const host = parsedUrl.hostname.toLowerCase();
    const blockedHostPatterns = [
      /^localhost$/, /^127\./, /^10\./, /^192\.168\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./, /^169\.254\./,
      /^0\.0\.0\.0$/, /^::1$/, /^fc00:/, /^fe80:/,
    ];
    if (blockedHostPatterns.some((re) => re.test(host))) {
      return new Response(
        JSON.stringify({ error: "Blocked host" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Skip URLs that are already on Bunny CDN
    if (imageUrl.includes("tukia-cdn.b-cdn.net") || imageUrl.includes("bunnycdn.com")) {
      console.log(`[upload-to-bunny] URL already on Bunny CDN, skipping: ${imageUrl}`);
      return new Response(
        JSON.stringify({
          success: true,
          cdnUrl: imageUrl,
          originalUrl: imageUrl,
          skipped: true,
          reason: "Already on Bunny CDN"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!BUNNY_STORAGE_API_KEY) {
      console.error("BUNNY_STORAGE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Bunny.net API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[upload-to-bunny] Downloading image from: ${imageUrl}`);

    // Download with browser-like headers
    const imageResponse = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": parsedUrl.origin,
        "Sec-Fetch-Dest": "image",
        "Sec-Fetch-Mode": "no-cors",
        "Sec-Fetch-Site": "cross-site",
      },
    });

    if (!imageResponse.ok) {
      console.error(`[upload-to-bunny] Failed to download image: ${imageResponse.status}`);
      return new Response(
        JSON.stringify({ error: `Failed to download image: ${imageResponse.status}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const contentType = imageResponse.headers.get("content-type") || "image/jpeg";

    // Reject non-image content
    if (!contentType.toLowerCase().startsWith("image/")) {
      return new Response(
        JSON.stringify({ error: "Source is not an image" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Enforce 25MB size cap via Content-Length when present
    const declaredLen = Number(imageResponse.headers.get("content-length") ?? "0");
    const MAX_BYTES = 25 * 1024 * 1024;
    if (declaredLen && declaredLen > MAX_BYTES) {
      return new Response(
        JSON.stringify({ error: "File exceeds 25MB limit" }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    if (imageBuffer.byteLength > MAX_BYTES) {
      return new Response(
        JSON.stringify({ error: "File exceeds 25MB limit" }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[upload-to-bunny] Downloaded ${imageBuffer.byteLength} bytes, type: ${contentType}`);

    // Determine file extension from content type
    let extension = "jpg";
    if (contentType.includes("png")) {
      extension = "png";
    } else if (contentType.includes("webp")) {
      extension = "webp";
    } else if (contentType.includes("gif")) {
      extension = "gif";
    }

    // Generate filename if not provided
    const finalFileName = fileName || `${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;
    const filePath = `${folder}/${finalFileName}`;

    console.log(`[upload-to-bunny] Uploading to Bunny.net: ${filePath}`);

    // Upload to Bunny.net Storage
    const uploadResponse = await fetch(
      `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/${filePath}`,
      {
        method: "PUT",
        headers: {
          "AccessKey": BUNNY_STORAGE_API_KEY,
          "Content-Type": contentType,
        },
        body: imageBuffer,
      }
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error(`[upload-to-bunny] Bunny.net upload failed: ${uploadResponse.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ error: `Bunny.net upload failed: ${uploadResponse.status}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cdnUrl = `${BUNNY_CDN_URL}/${filePath}`;
    console.log(`[upload-to-bunny] Successfully uploaded to: ${cdnUrl}`);

    return new Response(
      JSON.stringify({
        success: true,
        cdnUrl,
        originalUrl: imageUrl,
        filePath,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[upload-to-bunny] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Upload failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
