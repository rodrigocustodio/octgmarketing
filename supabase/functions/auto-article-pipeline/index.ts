// Phase 2: 3-Agent Article Pipeline
// Researcher (Perplexity) -> Editor/Writer (Gemini 2.5 Pro) -> Publisher (writes draft_articles)
// Target: 4 articles/day, draft-only for first 30 days (per brief)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const CRON_SECRET = Deno.env.get("CRON_SECRET");

// Daily rotation — 4 slots/day. Index by (dayOfYear * 4 + slot) % length.
// Mix of high-value beats — energy markets, geopolitics, technology, transition.
const ROTATION: { topic: string; angle: string }[] = [
  { topic: "pricing-market", angle: "OCTG and steel pipe pricing trends this week" },
  { topic: "geopolitical", angle: "Energy geopolitics impact on global oil & gas supply" },
  { topic: "offshore-subsea", angle: "Latest offshore project awards and FIDs" },
  { topic: "mills-manufacturing", angle: "Steel mill capacity, output and OCTG production news" },
  { topic: "gas-lng", angle: "LNG project developments and gas market shifts" },
  { topic: "energy-transition", angle: "CCUS, hydrogen and decarbonization in oil & gas" },
  { topic: "ceo-news", angle: "Notable energy CEO appointments, statements or strategic moves" },
  { topic: "mergers-acquisitions", angle: "Recent M&A activity in oil, gas and oilfield services" },
  { topic: "rigs-wellsite", angle: "Global rig count, drilling activity and well completions" },
  { topic: "technology-digitalization", angle: "Digital transformation and AI in upstream operations" },
  { topic: "pipeline-infrastructure", angle: "Pipeline projects, midstream developments and approvals" },
  { topic: "earnings-financials", angle: "Recent oil & gas earnings highlights and analyst takeaways" },
];

const REGION_KEYWORDS: Record<string, string[]> = {
  "middle-east": ["saudi", "uae", "qatar", "kuwait", "oman", "iraq", "iran", "abu dhabi", "dubai", "doha", "aramco", "adnoc", "opec"],
  "americas": ["usa", "united states", "texas", "permian", "canada", "mexico", "brazil", "houston", "guyana", "petrobras", "pemex"],
  "europe": ["north sea", "norway", "uk", "united kingdom", "netherlands", "germany", "france", "equinor", "totalenergies", "eni"],
  "asia-pacific": ["china", "india", "indonesia", "malaysia", "vietnam", "japan", "south korea", "singapore", "cnpc", "cnooc", "petronas", "ongc"],
  "africa": ["nigeria", "angola", "libya", "algeria", "egypt", "mozambique", "senegal", "nnpc", "sonatrach"],
  "australia": ["australia", "queensland", "perth", "darwin", "woodside", "santos"],
};

function generateSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").substring(0, 80).replace(/^-|-$/g, "");
}

function detectRegion(content: string): string {
  const lc = content.toLowerCase();
  let best = "global-energy-news";
  let bestScore = 0;
  for (const [slug, kws] of Object.entries(REGION_KEYWORDS)) {
    const score = kws.reduce((a, k) => a + (lc.includes(k) ? 1 : 0), 0);
    if (score > bestScore) { best = slug; bestScore = score; }
  }
  return best;
}

function pickRotationSlot(): { topic: string; angle: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000);
  // 4 slots/day → use the hour to derive slot index 0-3 (cron at 02,08,14,20 UTC)
  const slot = Math.floor(now.getUTCHours() / 6);
  const idx = (dayOfYear * 4 + slot) % ROTATION.length;
  return ROTATION[idx];
}

// AGENT 1: Researcher — Perplexity sonar-reasoning-pro with web citations
async function research(angle: string): Promise<{ summary: string; citations: string[] }> {
  if (!PERPLEXITY_API_KEY) throw new Error("PERPLEXITY_API_KEY missing");
  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${PERPLEXITY_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "sonar-reasoning-pro",
      messages: [
        { role: "system", content: "You are a senior energy industry researcher and geopolitical analyst. Compile factual briefings with specific data points (prices, percentages, volumes, dates, named companies). No speculation. No filler." },
        { role: "user", content: `Compile a research briefing for an industry article on: "${angle}". Use only news from the past 14 days. Provide: (1) 3–5 specific recent developments with dates and named companies/governments, (2) 3+ hard data points (prices, production figures, percentages), (3) the geopolitical or commercial implication of each, (4) 2 expert or executive quotes if publicly available. Return plain text only — no markdown headings.` },
      ],
      search_recency_filter: "week",
      temperature: 0.2,
      max_tokens: 1800,
    }),
  });
  if (!res.ok) throw new Error(`Perplexity ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return {
    summary: data.choices?.[0]?.message?.content ?? "",
    citations: data.citations ?? [],
  };
}

// AGENT 2: Editor/Writer — Gemini 2.5 Pro via Lovable AI Gateway
async function writeArticle(topicSlug: string, angle: string, briefing: string, citations: string[]): Promise<any> {
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");
  const sysPrompt = `You are a senior energy industry journalist (15+ years at Hart Energy, Upstream, World Oil) writing original analysis for OCTG Index — a market-intelligence publication for procurement directors, engineers and C-suite at energy companies.

CRITICAL RULES:
- NEVER name or credit any external publication or imply you got info from elsewhere. Present as original OCTG Index reporting.
- Write like a human journalist: confident declarative sentences, varied length, tension and contrast. Use "but" for tension.
- Open with a specific scene/fact/figure — never a generic overview.
- NO "Introduction" / "Conclusion" / "Summary" / "Final Thoughts" headings. NO "Last Updated" line.
- Body must start with H2 (##). Never use H1 (#) — title is rendered separately.
- 800–1100 words. Short paragraphs (2-3 sentences max). Use numerals for figures over 10.
- Include ≥3 specific data points (prices, %, volumes, dates) and named companies.
- Provocative H2 headings, not generic labels.
- End with one sharp forward-looking sentence — not a recap.

OUTPUT JSON ONLY:
{
  "title": "SEO headline 50-65 chars",
  "excerpt": "Meta description 150-160 chars",
  "body_markdown": "Full article body in markdown, starting with intro paragraph then ## H2 sections",
  "tags": ["tag1","tag2","tag3"],
  "mentioned_companies": ["Co 1","Co 2"]
}`;
  const userPrompt = `Topic category: ${topicSlug}\nAngle: ${angle}\n\nResearch briefing (verified, recent):\n${briefing}\n\nWrite the article now. Return JSON only.`;
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-pro",
      messages: [
        { role: "system", content: sysPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) throw new Error(`Lovable AI ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? "{}";
  return JSON.parse(content);
}

// AGENT 3: Publisher — QA + persistence
function qaCheck(article: any): { ok: boolean; reason?: string } {
  if (!article?.title || !article?.body_markdown) return { ok: false, reason: "missing title/body" };
  if (article.body_markdown.startsWith("# ")) return { ok: false, reason: "uses H1" };
  if (/##\s*(Introduction|Conclusion|Summary|Final Thoughts)/i.test(article.body_markdown)) return { ok: false, reason: "forbidden heading" };
  if (/Last Updated/i.test(article.body_markdown)) return { ok: false, reason: "Last Updated line" };
  const wc = article.body_markdown.split(/\s+/).length;
  if (wc < 500) return { ok: false, reason: `too short (${wc}w)` };
  return { ok: true };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Auth: cron secret OR admin/editor JWT
  const cronSecret = req.headers.get("x-cron-secret");
  const authHeader = req.headers.get("Authorization");
  let authorized = cronSecret === CRON_SECRET && !!CRON_SECRET;
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  if (!authorized && authHeader) {
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (user) {
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      authorized = (roles ?? []).some((r: any) => r.role === "admin" || r.role === "editor");
    }
  }
  if (!authorized) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const { data: run } = await supabase.from("automation_runs").insert({ job_name: "auto-article-pipeline", status: "running" }).select().single();
  const runId = run?.id;

  try {
    // 1. Pick topic via rotation (or override from body)
    let slot = pickRotationSlot();
    try {
      const body = await req.json().catch(() => ({}));
      if (body?.topic && body?.angle) slot = body;
    } catch (_) { /* no body */ }

    console.log(`[pipeline] topic=${slot.topic} angle="${slot.angle}"`);

    // 2. Researcher
    const briefing = await research(slot.angle);
    console.log(`[pipeline] research done: ${briefing.summary.length} chars, ${briefing.citations.length} citations`);

    // 3. Editor/Writer
    const article = await writeArticle(slot.topic, slot.angle, briefing.summary, briefing.citations);
    console.log(`[pipeline] article written: ${article?.title}`);

    // 4. Publisher — QA
    const qa = qaCheck(article);
    if (!qa.ok) throw new Error(`QA failed: ${qa.reason}`);

    // Resolve region & topic IDs
    const regionSlug = detectRegion(`${article.title} ${article.body_markdown}`);
    const { data: regionRow } = await supabase.from("regions").select("id").eq("slug", regionSlug).maybeSingle();
    const { data: topicRow } = await supabase.from("topics").select("id").eq("slug", slot.topic).maybeSingle();

    // Match companies
    const { data: allCompanies } = await supabase.from("companies").select("id, name");
    const matched: string[] = [];
    const bodyLc = `${article.title} ${article.body_markdown}`.toLowerCase();
    for (const c of allCompanies ?? []) {
      if (c.name && bodyLc.includes(c.name.toLowerCase())) matched.push(c.id);
    }

    // Build slug (unique-enough with date suffix)
    const baseSlug = generateSlug(article.title);
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    // Insert into draft_articles (per brief: drafts-only for first 30 days)
    const { data: draft, error: insErr } = await supabase.from("draft_articles").insert({
      title: article.title,
      slug,
      excerpt: article.excerpt ?? null,
      body_markdown: article.body_markdown,
      region_id: regionRow?.id ?? null,
      suggested_topic_ids: topicRow?.id ? [topicRow.id] : [],
      suggested_company_ids: matched,
      tags: article.tags ?? [],
      status: "pending_review",
      editor_notes: `Auto-pipeline run ${runId}. Citations: ${briefing.citations.slice(0, 6).join(", ")}`,
    }).select().single();
    if (insErr) throw insErr;

    await supabase.from("automation_runs").update({
      status: "success",
      items_processed: 1,
      items_succeeded: 1,
      finished_at: new Date().toISOString(),
      payload: { topic: slot.topic, angle: slot.angle, draft_id: draft.id, citations: briefing.citations },
    }).eq("id", runId);

    return new Response(JSON.stringify({ ok: true, draft_id: draft.id, title: article.title }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("[pipeline] error:", e);
    await supabase.from("automation_runs").update({
      status: "failed",
      finished_at: new Date().toISOString(),
      error: e?.message ?? String(e),
    }).eq("id", runId);
    return new Response(JSON.stringify({ error: e?.message ?? String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
