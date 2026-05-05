import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const POLYGON_KEY = Deno.env.get("MASSIVE_API_KEY");
const EIA_KEY = Deno.env.get("EIA_API_KEY");
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const CRON_SECRET = Deno.env.get("CRON_SECRET");

// US-traded equities (kept from fetch-steel-prices)
const US_STOCKS = [
  { symbol: "X", name: "U.S. Steel", region: "Americas", basePrice: 42.5 },
  { symbol: "CMC", name: "Commercial Metals", region: "Americas", basePrice: 52 },
  { symbol: "NUE", name: "Nucor", region: "Americas", basePrice: 165 },
  { symbol: "NOV", name: "NOV Inc.", region: "Americas", basePrice: 18.5 },
  { symbol: "BKR", name: "Baker Hughes", region: "Americas", basePrice: 35 },
  { symbol: "HAL", name: "Halliburton", region: "Americas", basePrice: 32 },
  { symbol: "SLB", name: "Schlumberger", region: "Americas", basePrice: 48 },
  { symbol: "TS", name: "Tenaris", region: "Europe", basePrice: 32 },
  { symbol: "MT", name: "ArcelorMittal", region: "Europe", basePrice: 26 },
  { symbol: "PKX", name: "POSCO", region: "Asia-Pacific", basePrice: 68 },
  { symbol: "FTI", name: "TechnipFMC", region: "Middle East", basePrice: 28 },
];

// CME futures via Polygon (front-month continuous)
const FUTURES = [
  { symbol: "HRC", polygon: "C:HRCN0", name: "Hot Rolled Coil (CME)", region: "Global", basePrice: 720 },
  { symbol: "IRON", polygon: "C:TIOH0", name: "Iron Ore 62% (SGX)", region: "Global", basePrice: 105 },
];

// EIA series
const EIA_SERIES = [
  { symbol: "WTI", series: "PET.RWTC.D", name: "WTI Crude (Spot)", basePrice: 78 },
  { symbol: "BRENT", series: "PET.RBRTE.D", name: "Brent Crude (Spot)", basePrice: 82 },
];

// Simulated fallbacks for items not yet wired to real feeds
const SIM_COMMODITIES = [
  { symbol: "CRC", name: "Cold Rolled Coil", region: "Global", basePrice: 850 },
  { symbol: "SCRAP", name: "Steel Scrap", region: "Global", basePrice: 380 },
  { symbol: "BILLET", name: "Steel Billet", region: "Global", basePrice: 520 },
];

function simulate(base: number) {
  const pct = (Math.random() - 0.5) * 4;
  const change = base * (pct / 100);
  return { price: +(base + change).toFixed(2), change: +change.toFixed(2), changePercent: +pct.toFixed(2) };
}

async function withRetry<T>(label: string, fn: () => Promise<T>, max = 2): Promise<T | null> {
  for (let i = 0; i <= max; i++) {
    try {
      return await fn();
    } catch (e) {
      console.error(`[${label}] attempt ${i + 1} failed:`, (e as Error).message);
      if (i === max) return null;
      await new Promise((r) => setTimeout(r, 500 * (i + 1)));
    }
  }
  return null;
}

async function fetchPolygon(ticker: string) {
  if (!POLYGON_KEY) return null;
  const r = await fetch(`https://api.polygon.io/v2/aggs/ticker/${ticker}/prev?apiKey=${POLYGON_KEY}`);
  if (!r.ok) throw new Error(`polygon ${ticker} ${r.status}`);
  const d = await r.json();
  const res = d.results?.[0];
  if (!res) return null;
  const change = res.c - res.o;
  return {
    price: +res.c.toFixed(2),
    change: +change.toFixed(2),
    changePercent: +((change / res.o) * 100).toFixed(2),
  };
}

async function fetchEIA(seriesId: string) {
  if (!EIA_KEY) return null;
  const url = `https://api.eia.gov/v2/seriesid/${seriesId}?api_key=${EIA_KEY}&length=2&sort[0][column]=period&sort[0][direction]=desc`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`eia ${seriesId} ${r.status}`);
  const d = await r.json();
  const rows = d.response?.data ?? [];
  if (rows.length < 1) return null;
  const latest = Number(rows[0].value);
  const prev = rows[1] ? Number(rows[1].value) : latest;
  const change = latest - prev;
  return {
    price: +latest.toFixed(2),
    change: +change.toFixed(2),
    changePercent: prev ? +((change / prev) * 100).toFixed(2) : 0,
  };
}

function computeCostPressure(rows: Record<string, { price: number }>): "Tightening" | "Neutral" | "Softening" {
  const hrc = rows.HRC?.price ?? 0;
  const wti = rows.WTI?.price ?? 0;
  if (hrc > 900 && wti > 85) return "Tightening";
  if (hrc < 700 && wti < 60) return "Softening";
  return "Neutral";
}

async function generateCommentary(state: string, prevState: string, hrc: number, wti: number, scrap: number) {
  if (!LOVABLE_API_KEY) return null;
  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-lite",
      messages: [
        { role: "system", content: "Wire-service tone, neutral, no hype. Exactly 2 sentences." },
        {
          role: "user",
          content: `OCTG Cost Pressure shifted from ${prevState} to ${state}. HRC $${hrc}, WTI $${wti}, Scrap $${scrap}. Write a 2-sentence editorial blurb explaining the directional shift.`,
        },
      ],
    }),
  });
  if (!r.ok) throw new Error(`gemini ${r.status}`);
  const d = await r.json();
  return d.choices?.[0]?.message?.content?.trim() ?? null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Cron auth: accept x-cron-secret matching CRON_SECRET, OR Authorization Bearer matching service role key
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
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: claims } = await userClient.auth.getClaims(auth.replace("Bearer ", ""));
    if (!claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  const { data: runRow } = await supabase
    .from("automation_runs")
    .insert({ job_name: "auto-market-intelligence", status: "running" })
    .select("id")
    .single();
  const runId = runRow?.id;

  const results: any[] = [];
  const sourceLog: Record<string, "real" | "simulated" | "failed"> = {};
  const priceLookup: Record<string, { price: number }> = {};

  // 1. Equities
  for (const s of US_STOCKS) {
    const real = POLYGON_KEY ? await withRetry(`polygon:${s.symbol}`, () => fetchPolygon(s.symbol)) : null;
    const p = real ?? simulate(s.basePrice);
    sourceLog[s.symbol] = real ? "real" : "simulated";
    priceLookup[s.symbol] = { price: p.price };
    results.push({
      symbol: s.symbol, name: s.name, region: s.region, currency: "USD", category: "stock",
      price: p.price, change: p.change, change_percent: p.changePercent,
      data_role: "editorial_indicator", pricing_type: "proxy", transactional: false,
      source_class: real ? "public_market_data" : "simulated",
    });
  }

  // 2. Futures
  for (const f of FUTURES) {
    const real = await withRetry(`polygon-futures:${f.symbol}`, () => fetchPolygon(f.polygon));
    const p = real ?? simulate(f.basePrice);
    sourceLog[f.symbol] = real ? "real" : "simulated";
    priceLookup[f.symbol] = { price: p.price };
    results.push({
      symbol: f.symbol, name: f.name, region: f.region, currency: "USD", category: "commodity",
      price: p.price, change: p.change, change_percent: p.changePercent,
      data_role: "editorial_indicator", pricing_type: "proxy", transactional: false,
      source_class: real ? "public_market_data" : "simulated",
    });
  }

  // 3. EIA crude
  for (const e of EIA_SERIES) {
    const real = await withRetry(`eia:${e.symbol}`, () => fetchEIA(e.series));
    const p = real ?? simulate(e.basePrice);
    sourceLog[e.symbol] = real ? "real" : "simulated";
    priceLookup[e.symbol] = { price: p.price };
    results.push({
      symbol: e.symbol, name: e.name, region: "Global", currency: "USD", category: "commodity",
      price: p.price, change: p.change, change_percent: p.changePercent,
      data_role: "editorial_indicator", pricing_type: "proxy", transactional: false,
      source_class: real ? "public_market_data" : "simulated",
    });
  }

  // 4. Simulated remainder
  for (const c of SIM_COMMODITIES) {
    const p = simulate(c.basePrice);
    sourceLog[c.symbol] = "simulated";
    priceLookup[c.symbol] = { price: p.price };
    results.push({
      symbol: c.symbol, name: c.name, region: c.region, currency: "USD", category: "commodity",
      price: p.price, change: p.change, change_percent: p.changePercent,
      data_role: "editorial_indicator", pricing_type: "proxy", transactional: false,
      source_class: "simulated",
    });
  }

  // 5. Cost pressure index + commentary
  const newState = computeCostPressure(priceLookup);
  const { data: prevRow } = await supabase
    .from("steel_prices")
    .select("notes,price")
    .eq("symbol", "COST_PRESSURE_INDEX")
    .maybeSingle();
  const prevState = prevRow?.notes?.match(/(Tightening|Neutral|Softening)/)?.[1] ?? "Neutral";

  let commentary: string | null = null;
  try {
    commentary = await withRetry("gemini-commentary", () =>
      generateCommentary(newState, prevState, priceLookup.HRC?.price ?? 0, priceLookup.WTI?.price ?? 0, priceLookup.SCRAP?.price ?? 0)
    );
  } catch (_) { /* non-fatal */ }

  results.push({
    symbol: "COST_PRESSURE_INDEX",
    name: "OCTG Cost Pressure Index",
    region: "Global", currency: "USD", category: "index",
    price: newState === "Tightening" ? 1 : newState === "Softening" ? -1 : 0,
    change: 0, change_percent: 0,
    data_role: "editorial_indicator", pricing_type: "non_equity", transactional: false,
    source_class: "editorial",
    notes: commentary ? `[${newState}] ${commentary}` : `[${newState}]`,
  });

  // Upsert
  let upsertError: string | null = null;
  const { error: upErr } = await supabase.from("steel_prices").upsert(results, { onConflict: "symbol" });
  if (upErr) upsertError = upErr.message;

  const failedCount = Object.values(sourceLog).filter((v) => v === "failed").length;
  const status = upsertError ? "failed" : failedCount > 0 ? "partial" : "success";

  await supabase
    .from("automation_runs")
    .update({
      status,
      items_processed: results.length,
      items_succeeded: results.length - failedCount,
      payload: { sources: sourceLog, cost_pressure: newState, prev_state: prevState, commentary },
      error: upsertError,
      finished_at: new Date().toISOString(),
    })
    .eq("id", runId);

  return new Response(
    JSON.stringify({ status, updated: results.length, cost_pressure: newState, sources: sourceLog }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
