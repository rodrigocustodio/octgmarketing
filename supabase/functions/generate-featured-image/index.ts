import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const googleApiKey = Deno.env.get("GOOGLE_AI_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user's token
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    const { title, excerpt, body, draftId } = await req.json();

    if (!title || !body) {
      return new Response(
        JSON.stringify({ error: "Title and body are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Generating featured image for draft: ${draftId}`);
    console.log(`Article title: ${title}`);

    // Step 1: Use Gemini to analyze article and create a photorealistic prompt
    const analysisPrompt = `You are a professional photo editor for an oil & gas industry news publication (OCTG Index).

Analyze this article and create a highly detailed image generation prompt for a REALISTIC, EDITORIAL-STYLE photograph to illustrate it.

The image MUST look like a real photograph that could appear in Reuters, Bloomberg, World Oil, or Offshore Technology publications.

REQUIREMENTS:
- The image must be photorealistic, NOT a digital illustration or 3D render
- Use real-world lighting (natural sunlight, industrial lighting, sunset/sunrise)
- Include realistic equipment: drilling rigs, OCTG pipes, steel mills, offshore platforms, pipe yards
- Specify the camera angle and composition (wide shot, close-up, aerial view)
- Mention the setting (offshore, desert, industrial facility, port)
- Include human elements when appropriate (workers, engineers) but not as the focus

DO NOT create prompts for:
- Conceptual or abstract images
- Illustrations, graphics, or infographics
- Stock photo clichés with fake smiles
- Logos or text overlays

Article Title: ${title}
${excerpt ? `Article Excerpt: ${excerpt}` : ""}
Article Body (first 1000 chars): ${body.substring(0, 1000)}

Return ONLY the image generation prompt, nothing else. Make it 2-4 sentences maximum, extremely specific about location, equipment, lighting, and photographic style.`;

    console.log("Calling Gemini API for prompt analysis...");
    
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${googleApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: analysisPrompt }] }],
          generationConfig: {
            maxOutputTokens: 256,
            temperature: 0.7,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Gemini API error:", errorText);
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    const imagePrompt = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!imagePrompt) {
      throw new Error("Failed to generate image prompt from Gemini");
    }

    console.log(`Generated image prompt: ${imagePrompt}`);

    // Step 2: Use Gemini 3 Pro Image (Imagen) to generate the image
    console.log("Calling Gemini Imagen API for image generation...");
    
    const imagenResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${googleApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Generate a photorealistic editorial photograph: ${imagePrompt}. Style: professional news photography, high resolution, 16:9 aspect ratio, cinematic lighting.`,
                },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
          },
        }),
      }
    );

    if (!imagenResponse.ok) {
      const errorText = await imagenResponse.text();
      console.error("Imagen API error:", errorText);
      throw new Error(`Imagen API error: ${imagenResponse.status}`);
    }

    const imagenData = await imagenResponse.json();
    console.log("Imagen response received");

    // Extract the image data from the response
    const imagePart = imagenData.candidates?.[0]?.content?.parts?.find(
      (part: { inlineData?: { mimeType: string; data: string } }) => part.inlineData
    );

    if (!imagePart?.inlineData?.data) {
      console.error("No image data in response:", JSON.stringify(imagenData, null, 2));
      throw new Error("No image data in Imagen response");
    }

    const imageBase64 = imagePart.inlineData.data;
    const mimeType = imagePart.inlineData.mimeType || "image/png";
    
    // Convert base64 to Uint8Array
    const binaryString = atob(imageBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Step 3: Upload to Supabase Storage
    const fileName = `${draftId}-${Date.now()}.${mimeType.split("/")[1] || "png"}`;
    const filePath = `generated/${fileName}`;

    console.log(`Uploading image to storage: ${filePath}`);

    const { error: uploadError } = await supabase.storage
      .from("article-images")
      .upload(filePath, bytes, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("article-images")
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;
    console.log(`Image uploaded successfully: ${publicUrl}`);

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
