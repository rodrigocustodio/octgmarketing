// Auto CEO Refresh — 3-agent verification pipeline (Researcher → Editor → Publisher).
// Runs 2x/week. Writes proposed diffs to executive_change_proposals (no auto-mutation of executives).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PERPLEXITY_KEY = Deno.env.get("PERPLEXITY_API_KEY")!;
const LOVABLE_AI_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET");

const BATCH_SIZE_TIER1 = 8; // Tier-1 every Mon/Thu run
const BATCH_SIZE_TIER2 = 4; // Tier-2 rotated each run

interface Executive {
  id: string;
  name: string;
  title: string;
  company_name: string;
  bio: string | null;
  photo_url: string | null;
  linkedin_url: string | null;
  region: string;
  priority_tier: number;
  last_verified_at: string | null;
}

async function researcher(exec: Executive): Promise<{ findings: string; citations: string[] } | null> {
  const prompt = `Verify the current CEO/leader of ${exec.company_name} as of today.

Currently on file: ${exec.name}, ${exec.title}.

Report:
1. Is ${exec.name} still in this role? If replaced, who is the current CEO and effective date?
2. Title changes (e.g., promoted, role renamed)?
3. Recent (last 6 months) bio/career updates worth noting.
4. Official LinkedIn URL of the current CEO if findable.
5. Public photo URL (newsroom/press release preferred) of current CEO.

Return concise factual findings with dates. If unchanged, state "CONFIRMED IN ROLE" with the most recent corporate source.`;

  const resp = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${PERPLEXITY_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "sonar-reasoning-pro",
      messages: [
        { role: "system", content: "You are a corporate-leadership verification analyst. Cite primary sources (company newsroom, SEC filings, LinkedIn). Be precise about dates." },
        { role: "user", content: prompt },
      ],
      search_recency_filter: "month",
      temperature: 0.1,
    }),
  });
  if (!resp.ok) {
    console.error(`[researcher] ${exec.company_name} ${resp.status}: ${await resp.text()}`);
    return null;
  }
  const data = await resp.json();
  const content: string = data.choices?.[0]?.message?.content ?? "";
  // Strip <think> tags from sonar-reasoning-pro
  const findings = content.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  const citations: string[] = data.citations ?? [];
  return { findings, citations };
}

interface EditorOutput {
  change_type: "verified_no_change" | "update" | "replacement" | "photo_refresh" | "flag_inactive";
  confidence: number;
  proposed: {
    name?: string;
    title?: string;
    bio?: string;
    linkedin_url?: string;
    photo_url?: string;
  };
  reasoning: string;
}

async function editor(exec: Executive, findings: string): Promise<EditorOutput | null> {
  const prompt = `Compare current directory record to research findings. Output a structured proposal.

CURRENT RECORD:
- Name: ${exec.name}
- Title: ${exec.title}
- Company: ${exec.company_name}
- Bio: ${exec.bio ?? "(none)"}
- LinkedIn: ${exec.linkedin_url ?? "(none)"}

RESEARCH FINDINGS:
${findings}

Rules:
- change_type "verified_no_change" → no edits needed.
- change_type "update" → same person, but title/bio/linkedin should change.
- change_type "replacement" → different person now in role. Set proposed.name/title/bio.
- change_type "photo_refresh" → only photo URL needs updating.
- change_type "flag_inactive" → company defunct/merged or role eliminated.
- confidence 0-1.
- bio: 2-3 sentences, OCTG-Index editorial voice, no fluff.

Return ONLY valid JSON, no preamble.`;

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_AI_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-pro",
      messages: [
        { role: "system", content: "You are a senior editor. Output strict JSON only." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!resp.ok) {
    console.error(`[editor] ${exec.company_name} ${resp.status}: ${await resp.text()}`);
    return null;
  }
  const data = await resp.json();
  try {
    return JSON.parse(data.choices[0].message.content);
  } catch {
    return null;
  }
}

function buildDiff(exec: Executive, proposed: EditorOutput["proposed"]): Record<string, { from: any; to: any }> {
  const diff: Record<string, { from: any; to: any }> = {};
  for (const key of ["name", "title", "bio", "linkedin_url", "photo_url"] as const) {
    const next = proposed[key];
    if (next !== undefined && next !== null && next !== (exec as any)[key]) {
      diff[key] = { from: (exec as any)[key], to: next };
    }
  }
  return diff;
}

async function processOne(supabase: any, exec: Executive, runId: string): Promise<{ ok: boolean; change_type?: string }> {
  const research = await researcher(exec);
  if (!research) return { ok: false };

  const decision = await editor(exec, research.findings);
  if (!decision) return { ok: false };

  const diff = buildDiff(exec, decision.proposed ?? {});

  // Publisher: persist proposal + bump last_verified_at on the executive
  await supabase.from("executive_change_proposals").insert({
    executive_id: exec.id,
    run_id: runId,
    change_type: decision.change_type,
    current_data: {
      name: exec.name, title: exec.title, bio: exec.bio,
      linkedin_url: exec.linkedin_url, photo_url: exec.photo_url,
    },
    proposed_data: decision.proposed ?? {},
    diff,
    confidence: decision.confidence,
    sources: research.citations,
    reasoning: decision.reasoning,
    status: decision.change_type === "verified_no_change" ? "applied" : "pending",
  });

  await supabase.from("executives").update({
    last_verified_at: new Date().toISOString(),
    verification_status: decision.change_type === "verified_no_change" ? "verified" : "needs_review",
  }).eq("id", exec.id);

  return { ok: true, change_type: decision.change_type };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // cron secret check (allows manual UI trigger via admin/editor JWT)
  const cronHdr = req.headers.get("x-cron-secret");
  const isCron = !!CRON_SECRET && cronHdr === CRON_SECRET;

  if (!isCron) {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const authClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: u, error: ue } = await authClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (ue || !u.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const adm = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: rr } = await adm.from("user_roles").select("role").eq("user_id", u.user.id);
    const roles = (rr ?? []).map((r: any) => r.role);
    if (!roles.includes("admin") && !roles.includes("editor")) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  const { data: run } = await supabase.from("automation_runs").insert({
    job_name: "auto-ceo-refresh", status: "running",
    payload: { triggered_by: isCron ? "cron" : "manual" },
  }).select("id").single();

  const runId = run?.id;
  let processed = 0, succeeded = 0;
  const summary: Record<string, number> = {};

  try {
    // Tier-1: oldest-verified first
    const { data: tier1 } = await supabase
      .from("executives").select("*").eq("is_active", true).eq("priority_tier", 1)
      .order("last_verified_at", { ascending: true, nullsFirst: true })
      .limit(BATCH_SIZE_TIER1);

    // Tier-2: rotated
    const { data: tier2 } = await supabase
      .from("executives").select("*").eq("is_active", true).eq("priority_tier", 2)
      .order("last_verified_at", { ascending: true, nullsFirst: true })
      .limit(BATCH_SIZE_TIER2);

    const batch: Executive[] = [...(tier1 ?? []), ...(tier2 ?? [])];

    for (const exec of batch) {
      processed++;
      try {
        const r = await processOne(supabase, exec, runId);
        if (r.ok) {
          succeeded++;
          summary[r.change_type!] = (summary[r.change_type!] ?? 0) + 1;
        }
      } catch (e) {
        console.error(`[ceo-refresh] ${exec.company_name}:`, e);
      }
      // Pace Perplexity calls
      await new Promise((r) => setTimeout(r, 1500));
    }

    await supabase.from("automation_runs").update({
      status: succeeded === processed ? "success" : succeeded > 0 ? "partial" : "failed",
      items_processed: processed, items_succeeded: succeeded,
      finished_at: new Date().toISOString(),
      payload: { triggered_by: isCron ? "cron" : "manual", summary },
    }).eq("id", runId);

    return new Response(JSON.stringify({ ok: true, processed, succeeded, summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    await supabase.from("automation_runs").update({
      status: "failed", error: String(e?.message ?? e), items_processed: processed, items_succeeded: succeeded,
      finished_at: new Date().toISOString(),
    }).eq("id", runId);
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
