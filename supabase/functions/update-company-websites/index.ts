import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WebsiteUpdate {
  slug: string;
  website: string;
}

interface UpdateResult {
  updated: number;
  notFound: string[];
  errors: string[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Require admin/editor JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const authClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: u, error: ue } = await authClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (ue || !u.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: roleRows } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
    const roles = (roleRows ?? []).map((r: any) => r.role);
    if (!roles.includes("admin") && !roles.includes("editor")) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const updates: WebsiteUpdate[] = await req.json();

    if (!Array.isArray(updates)) {
      return new Response(
        JSON.stringify({ error: "Expected an array of { slug, website } objects" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${updates.length} website updates...`);

    const result: UpdateResult = {
      updated: 0,
      notFound: [],
      errors: [],
    };

    for (const update of updates) {
      if (!update.slug || !update.website) {
        result.errors.push(`Invalid entry: ${JSON.stringify(update)}`);
        continue;
      }

      // Check if company exists
      const { data: company, error: fetchError } = await supabase
        .from("companies")
        .select("id, name, website")
        .eq("slug", update.slug)
        .single();

      if (fetchError || !company) {
        result.notFound.push(update.slug);
        console.log(`Not found: ${update.slug}`);
        continue;
      }

      // Update the website
      const { error: updateError } = await supabase
        .from("companies")
        .update({ website: update.website })
        .eq("id", company.id);

      if (updateError) {
        result.errors.push(`Failed to update ${update.slug}: ${updateError.message}`);
        console.error(`Error updating ${update.slug}:`, updateError);
      } else {
        result.updated++;
        console.log(`Updated: ${company.name} -> ${update.website}`);
      }
    }

    console.log(`Update complete: ${result.updated} updated, ${result.notFound.length} not found, ${result.errors.length} errors`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error processing updates:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
