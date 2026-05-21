# Market Intelligence → Editorial Market Pulse

## Why this change

The current strip depends on Polygon/EIA + simulated fallbacks. Simulated values undermine credibility, and the entire premise (live HRC, scrap, billet prices on a free editorial site) competes with services readers already pay for (Argus, Platts, Pipe Logix). Per project positioning: **"Market Intelligence, NEVER transactional pricing."**

The new module shows **what readers actually come to an editorial site for** — directional synthesis tied to coverage, not numbers they can't act on.

## What readers will see

A single horizontal band in the same slot, with four tiles:

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  THIS WEEK IN OCTG · Updated Fri 8am UTC                                      │
├──────────────┬──────────────┬──────────────────┬──────────────────────────────┤
│ US RIG COUNT │ COST PRESSURE│ NEWSROOM FOCUS   │ EDITORIAL READ               │
│              │              │                  │                              │
│    584       │  TIGHTENING  │ Trade Policy     │ "Capacity additions in the   │
│  ▲ +6 wow    │   ▲          │ 12 stories ▲     │  Gulf and renewed Section    │
│  (Baker      │  Editorial   │ Drilling         │  232 chatter dominated this  │
│   Hughes)    │  Indicator   │ 8 stories ▼      │  week's coverage..."         │
│              │              │                  │  — OCTG Index Newsroom       │
└──────────────┴──────────────┴──────────────────┴──────────────────────────────┘
```

Each tile is interpretive, not transactional. Nothing on screen can be "wrong" the way `$720 HRC` can be wrong.

### Tile 1 — US Rig Count
- The single most-watched weekly number in upstream oil & gas
- Source: Baker Hughes public HTML page (free, no key, weekly Friday release, ~70 years of continuous publication)
- Scraped weekly via Firecrawl (already wired)
- Show current count + week-over-week delta + arrow
- One-line attribution: "Source: Baker Hughes, weekly"

### Tile 2 — Cost Pressure (Editorial Indicator)
- Keeps the existing Tightening / Neutral / Softening framing readers may already recognize
- **Computed from your own editorial signal**, not commodity math:
  - Lovable AI (Gemini Flash) reads the last 7 days of published articles
  - Returns a directional call + 1-sentence rationale
- Labeled "Editorial Indicator" explicitly — never a price claim
- Updates with the same weekly cron

### Tile 3 — Newsroom Focus
- Top 2 topics by article count over the last 7 days, with WoW change arrow
- 100% derived from your own `articles` table — zero external dependency, zero failure modes
- Links into the topic pages (SEO win)

### Tile 4 — Editorial Read
- 2-sentence wire-service blurb written by Lovable AI weekly, synthesizing tiles 1–3
- Bylined "OCTG Index Newsroom"
- This is the differentiator: synthesis is what readers can't get from Bloomberg or Argus

## What gets removed

- `MarketIntelligenceStrip.tsx` (full replacement)
- `useSteelPrices` hook
- `steel_prices` table dependency from the homepage
- `fetch-steel-prices` edge function
- `auto-market-intelligence` edge function
- Polygon (`MASSIVE_API_KEY`) and EIA (`EIA_API_KEY`) usage for the homepage
- All `SIM_*` simulated price arrays
- Admin `PriceTickerManager` ticker for steel prices (if it surfaces them)
- `steel_prices` table itself (clean break, per your call)

Anything else that imports `useSteelPrices` or reads `steel_prices` gets cleaned up in the same pass.

## What gets built

### New table: `market_pulse`
Single-row snapshot updated weekly:
- `rig_count_us` (int), `rig_count_us_delta` (int), `rig_count_as_of` (date)
- `cost_pressure` (enum: tightening/neutral/softening)
- `cost_pressure_rationale` (text, 1 sentence)
- `newsroom_focus` (jsonb: `[{topic, count, delta}, ...]`)
- `editorial_read` (text, 2 sentences)
- `updated_at` (timestamptz)

Public read RLS. Admin-only write.

### New edge function: `refresh-market-pulse`
Runs weekly (Fri 9am UTC, after Baker Hughes publishes):
1. Firecrawl scrape Baker Hughes rig count page → parse US total + WoW
2. Query `articles` published in last 7d → aggregate by topic, compute deltas vs prior 7d
3. Send compact summary to Lovable AI (Gemini Flash) → return cost_pressure + rationale + editorial_read
4. Upsert single row to `market_pulse`
5. Log to `automation_runs`

Scheduled via `pg_cron` + `pg_net` (existing pattern in project).

### New component: `MarketPulseStrip.tsx`
Replaces `MarketIntelligenceStrip` in the homepage slot. Same band height/spacing — no layout shift. Uses existing semantic tokens, no new colors. Skeleton state during load.

### New hook: `useMarketPulse`
Single query against `market_pulse`. 1-hour stale time (data only changes weekly anyway).

## Failure behavior

If the weekly cron fails:
- Last successful snapshot remains visible (never blank, never stale-looking — weekly cadence is expected)
- "Updated Fri Mar 14" timestamp makes cadence transparent
- Admin gets the failure in `automation_runs` like every other automation

If Firecrawl is down on Friday, AI fields still update from your own articles. If Lovable AI is down, rig count still updates. Each tile degrades independently.

## Why this is better than what's there

| Today | New |
|---|---|
| Depends on 3 paid/keyed APIs | Depends on 1 free public page + your own DB |
| Simulated fallbacks erode trust | Nothing can be "wrong" — all directional |
| Competes with Argus/Platts (loses) | Synthesis they can't get elsewhere |
| Updates every 5min (stale-looking when data lags) | Weekly cadence is the standard for rig count |
| Generic commodity tiles | Differentiates OCTG Index as a *newsroom* |

## Technical notes (for the implementation pass, not for now)

- Migration creates `market_pulse` with RLS (public read, admin write via `has_role`)
- `refresh-market-pulse` uses `verify_jwt = false` + `x-cron-secret` pattern matching existing automations
- Use `parseLocalDate()` for the rig count `as_of` display (project rule)
- Cron SQL goes through `supabase--insert`, not migration (project rule — contains project-specific URLs/keys)
- Remove `MASSIVE_API_KEY` and `EIA_API_KEY` from documentation; secrets can stay until confirmed unused elsewhere
- Drop `steel_prices` table last, after confirming no other consumers (will grep `useSteelPrices`, `steel_prices`, `fetch-steel-prices`)

## Out of scope

- Pricing Index page (`/pricing-index`) — separate decision; this plan only touches the homepage strip
- Admin price ticker UI — will audit during implementation and remove if it only served `steel_prices`
- Any new content types or editorial workflows

Approve and I'll implement in one pass.
