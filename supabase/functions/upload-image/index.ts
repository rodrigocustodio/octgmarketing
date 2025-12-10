import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BUNNY_STORAGE_ZONE = "tukia-assets";
const BUNNY_CDN_URL = "https://tukia-cdn.b-cdn.net";
const BUNNY_STORAGE_API_KEY = Deno.env.get("BUNNY_STORAGE_API_KEY");
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check user role
    const { data: roles } = await supabaseAuth
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);
    
    const userRoles = roles?.map(r => r.role) || [];
    if (!userRoles.includes('admin') && !userRoles.includes('editor')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - admin or editor role required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!BUNNY_STORAGE_API_KEY) {
      throw new Error('BUNNY_STORAGE_API_KEY not configured');
    }

    // Parse request body
    const { imageBase64, fileName, folder = 'octgindex/articles' } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'imageBase64 is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Decode base64
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Determine content type and extension
    let contentType = 'image/jpeg';
    let extension = 'jpg';
    
    if (imageBase64.startsWith('data:image/png')) {
      contentType = 'image/png';
      extension = 'png';
    } else if (imageBase64.startsWith('data:image/webp')) {
      contentType = 'image/webp';
      extension = 'webp';
    }

    // Sanitize and generate file name - replace spaces/special chars with hyphens
    const sanitizedFileName = fileName 
      ? fileName.toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/(^-|-$)/g, '')
      : `${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;
    const filePath = `${folder}/${sanitizedFileName}`;

    console.log(`Uploading image to Bunny CDN: ${filePath}`);

    // Upload to Bunny.net Storage
    const uploadResponse = await fetch(
      `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/${filePath}`,
      {
        method: 'PUT',
        headers: {
          'AccessKey': BUNNY_STORAGE_API_KEY,
          'Content-Type': contentType,
        },
        body: imageBuffer,
      }
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Bunny upload error:', errorText);
      throw new Error(`Failed to upload to Bunny CDN: ${uploadResponse.status}`);
    }

    const cdnUrl = `${BUNNY_CDN_URL}/${filePath}`;
    console.log(`Image uploaded successfully: ${cdnUrl}`);

    return new Response(
      JSON.stringify({ 
        cdnUrl,
        filePath
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in upload-image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
