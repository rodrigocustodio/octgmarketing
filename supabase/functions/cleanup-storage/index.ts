import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authentication check - require admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('[cleanup-storage] Unauthorized - no auth header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.log('[cleanup-storage] Unauthorized - invalid token');
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
      console.log('[cleanup-storage] Forbidden - admin role required');
      return new Response(
        JSON.stringify({ error: 'Forbidden - admin role required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { dryRun = true } = await req.json();
    
    console.log(`[cleanup-storage] Starting cleanup by admin ${user.id}, dryRun=${dryRun}`);

    // List all files in uploads folder
    const { data: uploadFiles, error: listError } = await supabase.storage
      .from('article-images')
      .list('uploads', { limit: 1000 });

    if (listError) {
      console.error('[cleanup-storage] Error listing uploads:', listError);
      throw listError;
    }

    const uploadPaths = uploadFiles?.map(f => `uploads/${f.name}`) || [];
    console.log(`[cleanup-storage] Found ${uploadPaths.length} files in uploads/`);

    // Also check for branding folder
    const { data: brandingFiles } = await supabase.storage
      .from('article-images')
      .list('branding', { limit: 100 });
    
    const brandingPaths = brandingFiles?.map(f => `branding/${f.name}`) || [];
    console.log(`[cleanup-storage] Found ${brandingPaths.length} files in branding/`);

    // Check root level files too
    const { data: rootFiles } = await supabase.storage
      .from('article-images')
      .list('', { limit: 100 });
    
    const rootPaths = rootFiles?.filter(f => f.name && !f.id).map(f => f.name) || [];
    console.log(`[cleanup-storage] Found ${rootPaths.length} files in root`);

    const allPaths = [...uploadPaths, ...brandingPaths, ...rootPaths];

    if (dryRun) {
      console.log(`[cleanup-storage] Dry run complete, would delete ${allPaths.length} files`);
      return new Response(JSON.stringify({
        dryRun: true,
        filesToDelete: allPaths.length,
        files: allPaths
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (allPaths.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        deletedCount: 0,
        message: 'No files to delete'
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Delete files in batches of 100
    let deletedCount = 0;
    for (let i = 0; i < allPaths.length; i += 100) {
      const batch = allPaths.slice(i, i + 100);
      console.log(`[cleanup-storage] Deleting batch ${i/100 + 1}: ${batch.length} files`);
      
      const { error: deleteError } = await supabase.storage
        .from('article-images')
        .remove(batch);

      if (deleteError) {
        console.error('[cleanup-storage] Error deleting batch:', deleteError);
        throw deleteError;
      }
      deletedCount += batch.length;
    }

    console.log(`[cleanup-storage] Successfully deleted ${deletedCount} files`);

    return new Response(JSON.stringify({
      success: true,
      deletedCount,
      message: `Successfully deleted ${deletedCount} files from article-images bucket`
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: unknown) {
    console.error('[cleanup-storage] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
