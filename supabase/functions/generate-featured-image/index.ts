import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
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

    const { title, excerpt, body, draftId } = await req.json();

    if (!title || !body) {
      return new Response(
        JSON.stringify({ error: "Title and body are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Generating featured image for draft: ${draftId}`);
    console.log(`Article title: ${title}`);

    // Create a detailed image prompt based on the article content
    const imagePrompt = `Professional editorial photograph for an oil and gas industry news article titled "${title}". 
${excerpt ? `Context: ${excerpt}` : ""}

Requirements:
- Photorealistic industrial photography style
- Professional news/editorial quality like Reuters or Bloomberg
- Relevant to OCTG (Oil Country Tubular Goods) industry
- Show realistic equipment like drilling rigs, steel pipes, offshore platforms, refineries, or industrial facilities
- Natural lighting with cinematic composition
- Wide 16:9 aspect ratio
- No text, logos, or watermarks
- No cartoons or illustrations`;

    console.log(`Image prompt: ${imagePrompt}`);

    // Use OpenAI gpt-image-1 for image generation
    console.log("Calling OpenAI Image API...");
    
    const openaiResponse = await fetch(
      "https://api.openai.com/v1/images/generations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-image-1",
          prompt: imagePrompt,
          n: 1,
          size: "1536x1024",
          quality: "high",
        }),
      }
    );

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error("OpenAI API error:", errorText);
      console.error("OpenAI API status:", openaiResponse.status);
      throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`);
    }

    const openaiData = await openaiResponse.json();
    console.log("OpenAI response received");

    // Extract the image data - gpt-image-1 returns base64
    const imageData = openaiData.data?.[0];
    if (!imageData?.b64_json) {
      console.error("No image data in response:", JSON.stringify(openaiData, null, 2));
      throw new Error("No image data in OpenAI response");
    }

    const imageBase64 = imageData.b64_json;
    const mimeType = "image/png";
    
    // Convert base64 to Uint8Array
    const binaryString = atob(imageBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Upload to Bunny.net CDN
    const fileName = `${draftId}-${Date.now()}.png`;
    const filePath = `octgindex/articles/generated/${fileName}`;

    console.log(`Uploading image to Bunny.net: ${filePath}`);

    if (!BUNNY_STORAGE_API_KEY) {
      throw new Error("BUNNY_STORAGE_API_KEY not configured");
    }

    const uploadResponse = await fetch(
      `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/${filePath}`,
      {
        method: "PUT",
        headers: {
          "AccessKey": BUNNY_STORAGE_API_KEY,
          "Content-Type": mimeType,
        },
        body: bytes,
      }
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error("Bunny.net upload error:", uploadResponse.status, errorText);
      throw new Error(`Failed to upload image to Bunny.net: ${uploadResponse.status}`);
    }

    const publicUrl = `${BUNNY_CDN_URL}/${filePath}`;
    console.log(`Image uploaded successfully to Bunny.net: ${publicUrl}`);

    return new Response(
      JSON.stringify({
        success: true,
        imageUrl: publicUrl,
        prompt: imagePrompt,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-featured-image:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate image";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
