import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FIRECRAWL_KEY = Deno.env.get("FIRECRAWL_API_KEY");
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const CRON_SECRET = Deno.env.get("CRON_SECRET");

const RIG_COUNT_URL =
  "https://bakerhughesrigcount.gcs-web.com/na-rig-count";

type Pressure = "tightening" | "neutral" | "softening";

async function scrapeRigCount(): Promise<
  { count: number; delta: number; asOf: string } | null
> {
  if (!FIRECRAWL_KEY) return null;
  try {
    const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FIRECRAWL_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: RIG_COUNT_URL,
        formats: [{ type: "json", prompt: "Extract the most recent US (United States) total rig count from the Baker Hughes North America rig count table. Return: us_total (integer), us_change_week_over_week (integer, can be negative), report_date (YYYY-MM-DD string)." }],
        onlyMainContent: true,
      }),
    });
    if (!res.ok) {
      console.error("firecrawl error", res.status, await res.text());
      return null;
    }
    const d = await res.json();
    const j = d?.data?.json ?? d?.json;
    if (!j?.us_total) return null;
    return {
      count: Number(j.us_total),
      delta: Number(j.us_change_week_over_week ?? 0),
      asOf: String(j.report_date ?? new Date().toISOString().slice(0, 10)),
    };
  } catch (e) {
    console.error("rig count scrape failed:", (e as Error).message);
    return null;
  }
}

async function fetchNewsroomFocus(supabase: ReturnType<typeof createClient>) {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // Articles published in last 7d with their topics
  const { data: recent } = await supabase
    .from("articles")
    .select("id, publish_date, article_topics(topic_id, topics(name, slug))")
    .gte("publish_date", sevenDaysAgo.toISOString())
    .in("status", ["published", "featured"]);

  const { data: prior } = await supabase
    .from("articles")
    .select("id, publish_date, article_topics(topic_id, topics(name, slug))")
    .gte("publish_date", fourteenDaysAgo.toISOString())
    .lt("publish_date", sevenDaysAgo.toISOString())
    .in("status", ["published", "featured"]);

  const tally = (rows: any[]) => {
    const m = new Map<string, { name: string; slug: string; count: number }>();
    for (const r of rows ?? []) {
      for (const at of r.article_topics ?? []) {
        const t = at.topics;
        if (!t) continue;
        const cur = m.get(t.slug) ?? { name: t.name, slug: t.slug, count: 0 };
        cur.count++;
        m.set(t.slug, cur);
      }
    }
    return m;
  };

  const recentTally = tally(recent ?? []);
  const priorTally = tally(prior ?? []);

  const top = [...recentTally.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map((t) => ({
      name: t.name,
      slug: t.slug,
      count: t.count,
      delta: t.count - (priorTally.get(t.slug)?.count ?? 0),
    }));

  return { focus: top, totalArticles: recent?.length ?? 0 };
}

async function generateEditorial(
  rig: { count: number; delta: number } | null,
  focus: { name: string; count: number; delta: number }[],
  totalArticles: number,
): Promise<{ pressure: Pressure; rationale: string; editorial: string } | null> {
  if (!LOVABLE_API_KEY) return null;
  try {
    const focusText = focus.length
      ? focus.map((f) => `${f.name} (${f.count} stories, ${f.delta >= 0 ? "+" : ""}${f.delta} wow)`).join("; ")
      : "no dominant topic";
    const rigText = rig
      ? `US rig count ${rig.count} (${rig.delta >= 0 ? "+" : ""}${rig.delta} wow)`
      : "rig count unavailable";

    const res = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            {
              role: "system",
              content:
                "You are the OCTG Index newsroom desk. Wire-service tone. Neutral, no hype, no superlatives. Output strict JSON only.",
            },
            {
              role: "user",
              content:
                `Inputs for this week:\n- ${rigText}\n- Newsroom coverage (last 7d, ${totalArticles} stories): ${focusText}\n\nReturn JSON with three keys:\n  "pressure": one of "tightening" | "neutral" | "softening" (your editorial read on OCTG supply/cost direction)\n  "rationale": one sentence (max 18 words) explaining the pressure call\n  "editorial": exactly two sentences (max 50 words total) synthesizing rig direction + coverage themes for an OCTG audience. End with no byline.`,
            },
          ],
          response_format: { type: "json_object" },
        }),
      },
    );
    if (!res.ok) throw new Error(`gemini ${res.status}`);
    const d = await res.json();
    const content = d.choices?.[0]?.message?.content;
    if (!content) return null;
    // Strip code fences if model wrapped output
    const cleaned = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
    const parsed = JSON.parse(cleaned);
    const pressure: Pressure =
      parsed.pressure === "tightening" || parsed.pressure === "softening"
        ? parsed.pressure
        : "neutral";
    return {
      pressure,
      rationale: String(parsed.rationale ?? "").trim(),
      editorial: String(parsed.editorial ?? "").trim(),
    };
  } catch (e) {
    console.error("editorial generation failed:", (e as Error).message);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const cronHeader = req.headers.get("x-cron-secret");
  const auth = req.headers.get("Authorization") ?? "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const isCron =
    (CRON_SECRET && cronHeader === CRON_SECRET) ||
    (SERVICE_KEY && bearer === SERVICE_KEY);

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  if (!isCron) {
    if (!auth.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  const { data: runRow } = await supabase
    .from("automation_runs")
    .insert({ job_name: "refresh-market-pulse", status: "running" })
    .select("id")
    .single();
  const runId = runRow?.id;

  const rig = await scrapeRigCount();
  const { focus, totalArticles } = await fetchNewsroomFocus(supabase);
  const ai = await generateEditorial(rig, focus, totalArticles);

  const updates: Record<string, unknown> = {
    newsroom_focus: focus,
    updated_at: new Date().toISOString(),
  };
  if (rig) {
    updates.rig_count_us = rig.count;
    updates.rig_count_us_delta = rig.delta;
    updates.rig_count_as_of = rig.asOf;
  }
  if (ai) {
    updates.cost_pressure = ai.pressure;
    updates.cost_pressure_rationale = ai.rationale;
    updates.editorial_read = ai.editorial;
  }

  // Single-row table: upsert by selecting the existing id, else insert
  const { data: existing } = await supabase
    .from("market_pulse")
    .select("id")
    .limit(1)
    .maybeSingle();

  let upsertError: string | null = null;
  if (existing?.id) {
    const { error } = await supabase
      .from("market_pulse")
      .update(updates)
      .eq("id", existing.id);
    if (error) upsertError = error.message;
  } else {
    const { error } = await supabase.from("market_pulse").insert(updates);
    if (error) upsertError = error.message;
  }

  const status = upsertError
    ? "failed"
    : !rig || !ai
    ? "partial"
    : "success";

  await supabase
    .from("automation_runs")
    .update({
      status,
      items_processed: 1,
      items_succeeded: upsertError ? 0 : 1,
      payload: {
        rig_count: rig,
        newsroom_focus: focus,
        ai_ok: !!ai,
      },
      error: upsertError,
      finished_at: new Date().toISOString(),
    })
    .eq("id", runId);

  return new Response(
    JSON.stringify({
      status,
      rig_count: rig,
      cost_pressure: ai?.pressure,
      newsroom_focus: focus,
      editorial: ai?.editorial,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
