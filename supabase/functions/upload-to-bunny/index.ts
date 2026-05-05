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
    const { imageUrl, fileName, folder = "octgindex/articles" } = await req.json();

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: "imageUrl is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate that imageUrl is an absolute URL (not a relative path)
    if (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://")) {
      console.log(`[upload-to-bunny] Skipping relative/invalid URL: ${imageUrl}`);
      return new Response(
        JSON.stringify({ 
          error: "Invalid URL: must be an absolute URL starting with http:// or https://",
          skipped: true,
          originalUrl: imageUrl 
        }),
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

    // Extract domain for referer header
    let referer = "";
    try {
      const urlObj = new URL(imageUrl);
      referer = urlObj.origin;
    } catch {
      referer = "";
    }

    // Download the image from the source URL with browser-like headers
    const imageResponse = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": referer,
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
    const imageBuffer = await imageResponse.arrayBuffer();

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
