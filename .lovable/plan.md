## Goal
Make steel/OCTG prices refresh automatically every 15 minutes server-side, with zero user interaction (works even when no browser tab is open).

## Why the current setup doesn't "just work"
The `PriceTickerManager` admin card has a 25-minute countdown that auto-invokes `fetch-steel-prices`, but only while an admin has the `/admin` tab open and focused. Close the tab → no refreshes. That's why you keep having to click.

The correct fix is a **server-side scheduled job** (pg_cron + pg_net) that hits the edge function on a fixed 15-minute cadence, completely independent of the browser.

## Plan

### 1. Database: schedule a 15-minute cron job
- Ensure `pg_cron` and `pg_net` extensions are enabled (they already are for the other auto-* jobs).
- Insert a cron job `auto-refresh-steel-prices-15min` with schedule `*/15 * * * *` that POSTs to the `auto-market-intelligence` edge function (the unified pricing pipeline that already writes to `steel_prices`), passing the `x-cron-secret` header so the function authorizes the call as a cron run.
- Drop any prior duplicate of the same job name first (idempotent).

This uses `supabase--read_query` / insert path (not a migration) because the SQL embeds the project URL and the `CRON_SECRET` value — same pattern as the existing `auto-energy-events-monthly` and `auto-ceo-refresh` schedules.

### 2. Edge function: confirm cron path is allowed
`auto-market-intelligence` already accepts `x-cron-secret` and bypasses the JWT check when it matches `CRON_SECRET`. No code change needed there. (If we discover after deploy that it doesn't match, we patch it — but the current source shows it's wired.)

### 3. Admin UI: reflect that refresh is now automatic server-side
In `src/components/admin/PriceTickerManager.tsx`:
- Change the countdown to **15:00** (matches the real cron) and update the label from "until refresh" to "next auto-refresh" so it's clear this is informational, not dependent on the tab being open.
- Keep the manual "Refresh Prices" button for on-demand pulls.
- Add a small subtitle line: "Prices refresh automatically every 15 minutes on the server."
- Remove the now-misleading auto-trigger on countdown end (the server is the source of truth); just reset the countdown when it hits zero and re-fetch local data from the DB so the table updates.

### 4. Verification
- After deploying the cron job, query `cron.job` to confirm it's registered.
- Wait one cycle (or trigger `auto-market-intelligence` once via "Run now") and check `automation_runs` for a fresh `success` row with `job_name = 'auto-market-intelligence'`.
- Confirm `steel_prices.updated_at` advances every 15 minutes.

## Technical notes
- Schedule string: `*/15 * * * *` (every 15 minutes, on :00/:15/:30/:45).
- Cron call uses `net.http_post` with headers `{"Content-Type":"application/json","x-cron-secret":"<CRON_SECRET>"}`.
- We schedule against `auto-market-intelligence` (not the legacy `fetch-steel-prices`) because that's the active multi-source pipeline already used by the rest of the Automations dashboard, so runs show up in the existing monitoring panel automatically.
- No new secrets required — `CRON_SECRET`, `MASSIVE_API_KEY`, `EIA_API_KEY`, `LOVABLE_API_KEY` are all already configured.

## Files touched
- New cron schedule (SQL via insert tool, not migration).
- `src/components/admin/PriceTickerManager.tsx` — countdown label/duration + informational copy.