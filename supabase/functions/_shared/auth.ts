// Shared auth helper for edge functions: requires admin/editor JWT.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface AuthResult {
  ok: boolean;
  response?: Response;
  userId?: string;
}

export async function requireAdminOrEditor(
  req: Request,
  corsHeaders: Record<string, string>,
  options?: { allowCron?: boolean },
): Promise<AuthResult> {
  if (options?.allowCron) {
    const cronSecret = Deno.env.get("CRON_SECRET");
    const cronHdr = req.headers.get("x-cron-secret");
    if (cronSecret && cronHdr === cronSecret) {
      return { ok: true };
    }
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }),
    };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const token = authHeader.replace("Bearer ", "");

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await authClient.auth.getUser(token);
  if (userErr || !userData.user) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }),
    };
  }

  const adminClient = createClient(supabaseUrl, serviceKey);
  const { data: roles } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id);
  const list = (roles ?? []).map((r: any) => r.role);
  if (!list.includes("admin") && !list.includes("editor")) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }),
    };
  }

  return { ok: true, userId: userData.user.id };
}
