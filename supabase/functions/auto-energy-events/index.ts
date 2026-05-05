// Auto Energy Events — monthly discovery & publication of upcoming global energy events.
// 3-agent pipeline: Researcher (Perplexity) → Editor (Gemini, structured JSON) → Publisher (insert into events).
// Dedupe by slug. Skips events already in the table.
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

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

async function research(): Promise<{ findings: string; citations: string[] } | null> {
  const today = new Date().toISOString().slice(0, 10);
  const horizonEnd = new Date(Date.now() + 365 * 86400_000).toISOString().slice(0, 10);

  const prompt = `List the most important UPCOMING global energy industry conferences, exhibitions, and summits between ${today} and ${horizonEnd}.

Scope: oil & gas (upstream/midstream/downstream), OCTG, drilling, LNG, refining, energy transition, offshore, petrochemicals, gas processing.

For each event provide:
- Official name
- Start date and end date (YYYY-MM-DD)
- City, country, venue
- Official website URL
- Approximate attendees/exhibitors count if public
- 2-3 sentence neutral description

Prioritize tier-1 events (ADIPEC, OTC, Gastech, CERAWeek, ONS, EGYPS, IPTC, OPEC seminars, OGA Asia, Africa Oil Week, World Petroleum Congress, LNG2026, IADC, SPE conferences, OTC Asia, OTC Brasil, Rio Oil & Gas, Argus events, S&P Global events, etc.). Aim for 15-25 events. Cite official event websites.`;

  const resp = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${PERPLEXITY_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "sonar-reasoning-pro",
      messages: [
        { role: "system", content: "You are an energy-industry events analyst. Cite primary event websites only." },
        { role: "user", content: prompt },
      ],
      temperature: 0.1,
    }),
  });
  if (!resp.ok) {
    console.error(`[research] ${resp.status}: ${await resp.text()}`);
    return null;
  }
  const data = await resp.json();
  const content: string = data.choices?.[0]?.message?.content ?? "";
  const findings = content.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  return { findings, citations: data.citations ?? [] };
}

interface EventCandidate {
  name: string;
  start_date: string;
  end_date: string | null;
  location: string;
  venue: string | null;
  website: string | null;
  attendees_count: string | null;
  exhibitors_count: string | null;
  description: string;
  region_hint: string | null;
}

async function editor(findings: string): Promise<EventCandidate[] | null> {
  const prompt = `Convert the research below into a strict JSON object: { "events": [...] }.

Each event must include: name, start_date (YYYY-MM-DD), end_date (YYYY-MM-DD or null), location ("City, Country"), venue, website, attendees_count (string or null), exhibitors_count (string or null), description (2-3 sentences, neutral wire-service tone), region_hint (one of: "Middle East","North America","South America","Europe","Africa","Asia Pacific","Global", or null).

Skip any event without a confirmed start_date. Skip duplicates. Output ONLY valid JSON.

RESEARCH:
${findings}`;

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
    console.error(`[editor] ${resp.status}: ${await resp.text()}`);
    return null;
  }
  const data = await resp.json();
  try {
    const parsed = JSON.parse(data.choices[0].message.content);
    return Array.isArray(parsed.events) ? parsed.events : null;
  } catch {
    return null;
  }
}

async function publish(supabase: any, candidates: EventCandidate[]): Promise<{ inserted: number; skipped: number; errors: number }> {
  // Load region map
  const { data: regions } = await supabase.from("regions").select("id,name,slug");
  const regionByName = new Map((regions ?? []).map((r: any) => [r.name.toLowerCase(), r.id]));

  // Existing slugs to dedupe
  const today = new Date().toISOString().slice(0, 10);
  const { data: existing } = await supabase.from("events").select("slug,name,start_date").gte("start_date", today);
  const existingSlugs = new Set((existing ?? []).map((e: any) => e.slug));
  const existingKeys = new Set((existing ?? []).map((e: any) => `${slugify(e.name)}|${e.start_date.slice(0, 7)}`));

  let inserted = 0, skipped = 0, errors = 0;

  for (const c of candidates) {
    if (!c.name || !c.start_date) { skipped++; continue; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(c.start_date)) { skipped++; continue; }

    const baseSlug = slugify(c.name);
    const yearMonth = c.start_date.slice(0, 7);
    const key = `${baseSlug}|${yearMonth}`;
    if (existingKeys.has(key)) { skipped++; continue; }

    let slug = `${baseSlug}-${c.start_date.slice(0, 4)}`;
    let n = 1;
    while (existingSlugs.has(slug)) { slug = `${baseSlug}-${c.start_date.slice(0, 4)}-${++n}`; }
    existingSlugs.add(slug);
    existingKeys.add(key);

    const region_id = c.region_hint ? regionByName.get(c.region_hint.toLowerCase()) ?? null : null;

    const { error } = await supabase.from("events").insert({
      name: c.name,
      slug,
      description: c.description ?? null,
      location: c.location ?? "TBA",
      venue: c.venue ?? null,
      start_date: c.start_date,
      end_date: c.end_date && /^\d{4}-\d{2}-\d{2}$/.test(c.end_date) ? c.end_date : null,
      website: c.website ?? null,
      attendees_count: c.attendees_count ?? null,
      exhibitors_count: c.exhibitors_count ?? null,
      region_id,
      is_featured: false,
    });
    if (error) { console.error(`[publish] ${c.name}:`, error.message); errors++; }
    else inserted++;
  }
  return { inserted, skipped, errors };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const cronHdr = req.headers.get("x-cron-secret");
  const isCron = CRON_SECRET && cronHdr === CRON_SECRET;

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data: run } = await supabase.from("automation_runs").insert({
    job_name: "auto-energy-events", status: "running",
    payload: { triggered_by: isCron ? "cron" : "manual" },
  }).select("id").single();
  const runId = run?.id;

  try {
    const research_out = await research();
    if (!research_out) throw new Error("Researcher failed");

    const candidates = await editor(research_out.findings);
    if (!candidates || candidates.length === 0) throw new Error("Editor produced no candidates");

    const result = await publish(supabase, candidates);

    const status = result.errors === 0 && result.inserted > 0 ? "success"
      : result.inserted > 0 ? "partial"
      : "failed";

    await supabase.from("automation_runs").update({
      status,
      items_processed: candidates.length,
      items_succeeded: result.inserted,
      finished_at: new Date().toISOString(),
      payload: {
        triggered_by: isCron ? "cron" : "manual",
        inserted: result.inserted, skipped: result.skipped, errors: result.errors,
        candidate_count: candidates.length,
        sources: research_out.citations.slice(0, 20),
      },
    }).eq("id", runId);

    return new Response(JSON.stringify({ ok: true, ...result, candidates: candidates.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    await supabase.from("automation_runs").update({
      status: "failed", error: String(e?.message ?? e),
      finished_at: new Date().toISOString(),
    }).eq("id", runId);
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
