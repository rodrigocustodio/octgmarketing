import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    console.log('Starting OG image generation...');

    // Generate image using OpenAI gpt-image-1
    const prompt = `Professional editorial website header image for "OCTG INDEX" - an oil and gas industry news platform.

Design specifications:
- Dark navy-charcoal gradient background (deep industrial feel)
- Large bold "OCTG INDEX" text centered, in white/silver metallic finish
- Below the title: smaller tagline "Oil Country Tubular Goods Industry Intelligence" in bronze/copper color
- Background elements: Subtle abstract steel pipe cross-sections, industrial geometric patterns, faint oil derrick silhouettes
- Style: Clean, corporate, Bloomberg/Reuters financial news aesthetic
- Professional and authoritative appearance
- High contrast for social media visibility
- Format optimized for 1200x630 social media header (16:9.45 aspect ratio)
- Colors: Dark navy (#080D17), steel gray, bronze/copper (#B5722A) accents
- Modern, sleek, tech-forward industrial design`;

    console.log('Calling OpenAI image generation API...');
    
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: prompt,
        n: 1,
        size: '1536x1024', // Closest supported size to 1200x630 aspect
        quality: 'high',
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log('Image generated successfully');

    // gpt-image-1 returns base64 encoded image
    const base64Image = data.data[0].b64_json;
    
    if (!base64Image) {
      throw new Error('No image data returned from OpenAI');
    }

    // Convert base64 to Uint8Array
    const binaryString = atob(base64Image);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Upload to Supabase Storage
    const fileName = 'og-default.png';
    const filePath = `branding/${fileName}`;

    console.log('Uploading to Supabase Storage...');
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('article-images')
      .upload(filePath, bytes, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('article-images')
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;
    console.log('Image uploaded successfully:', publicUrl);

    // Also return base64 for direct download
    return new Response(
      JSON.stringify({
        success: true,
        publicUrl: publicUrl,
        base64: base64Image,
        message: 'OG image generated and uploaded successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error generating OG image:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
