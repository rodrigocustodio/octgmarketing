
# Plan — Lighten OCTGIndex Bunny CDN consumption

Scope is narrow and surgical. No redesigns. No DB schema changes.

---

## 1. CEO Directory — remove all photos
**File:** `src/pages/CEODirectory.tsx`

- Drop the `<img>` block (lines ~239–259) and the `aspect-[4/3]` photo wrapper.
- Replace each card with a denser text row showing: name, title, company, stock symbol, region badge. Keep the existing region tabs and the link to `/ceo/:slug`.
- Switch grid from `xl:grid-cols-5` (photo gallery) to `lg:grid-cols-2 xl:grid-cols-3` (text directory) for premium density.
- Remove `optimizeImageUrl` import (no longer needed on this page).
- Leave `executive.photo_url` in the data type and DB — only stop rendering it.

Result: zero `/octgindex/ceos/*` requests on `/ceo-directory`.

---

## 2. CEO Detail — remove portrait + related photos
**File:** `src/pages/CEODetail.tsx`

- Remove the photo block (lines ~252–268) and the `aspect-[3/4]` wrapper. Move the "Company Info" card into that left column slot so layout stays balanced.
- Remove `image: executive.photo_url` from the Person JSON-LD (line 143) and the `image={executive.photo_url}` prop on `<SEOHead>` (line 218) so `og:image` no longer points to a CEO photo (it will fall back to the site default).
- Remove the `optimizeImageUrl` and `User` icon imports if unused after edit.

Result: zero `/octgindex/ceos/*` requests on `/ceo/:slug` and zero photo references in head metadata.

---

## 3. Verification sweep
After edits, search the repo for `executive.photo_url`, `/octgindex/ceos/`, and `optimizeImageUrl(executive.photo_url`. Expected remaining hits: only admin pages (`src/pages/admin/Executives.tsx`, `ExecutiveEdit.tsx`) — those are behind auth and only loaded when an admin opens them. Document this in the report.

---

## 4. Homepage — conservative pass
**Files:** `src/pages/Index.tsx`, `src/components/home/*`

Audit shows the homepage already lazy-loads everything except the LCP hero. Two small tweaks only:
- `Index.tsx` hero srcSet currently emits 768/1200/1920. Drop the 1920w variant (viewport cap for the hero crop is well under 1600). Keep 768/1200.
- `Index.tsx` lines 292–315 "Secondary Articles" section currently renders 3 cards but falls back to **Unsplash** placeholders when `hero_image_url` is null. Replace those external Unsplash fallbacks with a local CSS gradient placeholder so no third-party image is ever fetched.

Leave `BreakingNewsRow`, `IndustryFocusMasonry`, `TopicRows`, `AnalysisReportsSection`, `FeaturedEventSpotlight`, `UpcomingEventsSection`, `QuickReadsGrid` unchanged — they already lazy-load and are sized appropriately.

Before vs after distinct CDN images on first paint: ~13 → ~12 (one image variant per source removed; Unsplash burst eliminated when DB has gaps).

---

## 5. News listing — pagination
**Files:** `src/pages/News.tsx`, `src/hooks/useArticles.ts`

- Lower initial render from 50 → **18** articles.
- Add a "Load More" button that bumps the visible count by 18 each click. Implement client-side: fetch up to 60, slice with a `visibleCount` state. (Avoids hook refactor / infinite query churn.)
- Card images already lazy + optimized.

Report will list: old=50, new=18 initial, file=`src/pages/News.tsx` (+ `useArticles.ts` if needed).

---

## 6. Standardize image variants
**File:** `src/lib/utils.ts` (add a tiny preset helper, optional), plus targeted callers.

Current matrix (widths × qualities) — fragmented:

| Width | Quality | Used in |
|---|---|---|
| 160 | 75 | AnalysisReportsSection (tiny) |
| 200 | 75 | BreakingNewsRow |
| 300 | 70 | CEODirectory (removed in step 1) |
| 320 | 75 | AnalysisReportsSection |
| 400 | 75/85 | ArticleCard srcSet, CEODirectory, CEODetail, UpcomingEventCard |
| 500 | 75 | CEODirectory (removed) |
| 600 | — / 80 | News, TopicRows |
| 768 | 80 | Hero srcSet |
| 800 | 80/85 | ArticleCard, AnalysisReports, EventDetail |
| 960 | 85 | Article |
| 1000 | 85 | IndustryFocusMasonry |
| 1200 | 85 | FeaturedEventSpotlight, EventDetail, ProductDetail, Index hero |
| 1920 | 85 | Index hero (removed in step 4) |

**New canonical set:**

| Slot | Width | Quality |
|---|---|---|
| Thumb (icon-row) | 200 | 75 |
| Card (grid item) | 600 | 80 |
| Feature (large card / detail body) | 1200 | 82 |
| Hero (LCP) | 768 / 1200 srcSet | 82 |

Targeted edits:
- `AnalysisReportsSection`: 160→200, 320→200, 800→1200 only for the featured hero of that section.
- `ArticleCard` srcSet: keep 400/800 (this is a true srcSet for responsiveness — acceptable; align quality to 80 on both).
- `News.tsx`: pass `{ width: 600, quality: 80 }` instead of `{ width: 600 }` (default quality is 80 already, makes intent explicit).
- `TopicRows`: already 600/80 — no change.
- `BreakingNewsRow`: 200/75 → 200/80 (align to canonical).
- `IndustryFocusMasonry`: 1000→1200, q85→82.
- `EventDetail`: 800→1200, q85→82.
- `Article.tsx`: 960→1200, q85→82.
- `ProductDetail.tsx`: 1200, q85→82.
- `Index.tsx` hero: 768/1200, q85→82, drop 1920.
- `FeaturedEventSpotlight`: 1200/85→82.
- `UpcomingEventCard`: 400/80 → 600/80.
- `CEODetail`: removed in step 2.

Net: every source image collapses from up to 5–7 cache variants → at most 3 (thumb / card / feature) plus the dedicated 768/1200 hero pair when applicable.

---

## 7. Audio confirmation
`rg -n "\.mp3|\.wav|<audio|preload=\"auto\""` across `src/`, `public/`, `index.html`, `supabase/`: only hit is `video-utils.ts` explicitly **disabling** autoplay on embedded videos. No `<audio>`, no MP3, no `/octgindex/audios/` reference. The MP3 in Bunny logs is external (shared pull zone).

---

## 8. Final report I will deliver after implementation
1. Files changed (list)
2. CEO photo removals (`/ceo-directory`, `/ceo/:slug`, schema/og)
3. Confirmation: 0 CEO image requests on both routes
4. Homepage delta (hero variant trimmed, Unsplash fallback removed)
5. News initial-load: 50 → 18 + Load More
6. Variant matrix before/after table
7. Audio confirmation
8. Estimated Bunny reduction from OCTGIndex traffic:
   - `/ceo-directory` visits: **~100 %** (CEO photos eliminated)
   - `/ceo/:slug` visits: **~100 %** (single largest image gone)
   - `/news` first paint: **~64 %** fewer image requests (18 vs 50)
   - Cache variant fragmentation: **~50 %** fewer distinct Bunny cache keys generated per source image over time → secondary egress reduction as cache hit-rate rises
   - Homepage: small, ~10–15 %
   - Total OCTGIndex CDN bandwidth estimate: **~55–70 % lower** after this patch
9. Out-of-scope leftovers: shared Bunny pull zone with other projects (IASD audio etc.) — must be split at the Bunny dashboard, not in code.

---

### Confirm before I implement
- OK to **completely remove** CEO photos from both `/ceo-directory` and `/ceo/:slug` (DB column kept, just not rendered)?
- OK with **18 articles + Load More** on `/news`?
- OK with the canonical variant set (200 / 600 / 1200, quality 80–82)?

If yes to all three, I'll execute steps 1–7 and post the report.
