import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check for admin/editor role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .in("role", ["admin", "editor"])
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Insufficient permissions" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Starting junk company cleanup...");

    // First, fetch ALL companies and filter in JS
    // (PostgREST LIKE escaping for underscore is tricky)
    const { data: allCompanies, error: selectError } = await supabase
      .from("companies")
      .select("id, name");

    if (selectError) {
      console.error("Error fetching companies:", selectError);
      throw selectError;
    }

    // Filter junk entries: starts with underscore OR contains "/_"
    const junkCompanies = (allCompanies || []).filter(c => 
      c.name.startsWith("_") || c.name.includes("/_")
    );

    console.log(`Found ${junkCompanies?.length || 0} junk entries to delete`);

    if (!junkCompanies || junkCompanies.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          deletedCount: 0,
          message: "No junk entries found",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log sample of what we're deleting
    const sampleNames = junkCompanies.slice(0, 10).map(c => c.name);
    console.log("Sample junk entries:", sampleNames);

    // Delete the junk entries
    const junkIds = junkCompanies.map(c => c.id);
    const { error: deleteError } = await supabase
      .from("companies")
      .delete()
      .in("id", junkIds);

    if (deleteError) {
      console.error("Error deleting junk companies:", deleteError);
      throw deleteError;
    }

    console.log(`Successfully deleted ${junkCompanies.length} junk entries`);

    return new Response(
      JSON.stringify({
        success: true,
        deletedCount: junkCompanies.length,
        sampleDeleted: sampleNames,
        message: `Deleted ${junkCompanies.length} junk company entries`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Cleanup error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
