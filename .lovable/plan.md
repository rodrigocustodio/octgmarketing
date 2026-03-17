

# SEO Fixes Plan

## 1. Auth page noindex
**Already done.** Line 153 of Auth.tsx already has `noindex={true}`. No change needed.

## 2. Fix /null broken link
**Root cause:** `CompanyDetail.tsx` lines 304 and 372 link to `` `/directory/category/${company.industry_role}` `` without null-checking `industry_role`. When it's null, this generates `/directory/category/null`.

**Fix:** Wrap both links (lines 304 and 372) in `{company.industry_role && (...)}` conditionals, matching the pattern already used at line 547.

## 3. Fix /articles 404
**Root cause:** `QuickReadsGrid.tsx` line 43 links to `/articles` which doesn't exist. The correct route is `/news`.

**Fix:** Change `to="/articles"` to `to="/news"` on line 43.

## 4. Fix /directory/region/ 404
No broken links found — all `/directory/region/` links use `${region.slug}` with proper null guards. This may have been a crawler artifact from a stale link. No code change needed.

## 5. Fix duplicate homepage title
**Current state:** `index.html` line 40 and `Index.tsx` SEOHead both use the same title. The `data-rh="true"` attribute means Helmet replaces the static one at runtime, so there's no duplication. However, if the crawler sees the static HTML before JS executes, they match — which is correct behavior, not a bug.

**Fix:** Differentiate the `index.html` fallback title to be more generic (e.g., "OCTG Index") so it's clearly a fallback, and keep the full keyword-rich title only in `Index.tsx` SEOHead.

## 6. Add canonical to /topic/analysis
**Already done.** `Topic.tsx` line 43 builds `canonicalUrl` and passes it to SEOHead at line 97. No change needed.

## 7. Fix heading hierarchy
Pages with h1 → h3 skips (CardTitle renders as h3):

- **EventDetail.tsx:** h1 (event name) → CardTitle (h3) for "About the Event", "About This Event", "Event Details". Need to change CardTitle sections to use h2 instead.
- **CEODetail.tsx:** h1 (executive name) → h3 (FAQ questions). Change FAQ h3 tags to h2 or add a h2 "Frequently Asked Questions" wrapper and keep h3 for individual questions (which is actually correct: h1 → CardTitle h3 "Company Info" is the skip).
  - Actually: h1 → CardTitle h3 "Company Info" — this skips h2. The FAQ section uses CardTitle h3 "Frequently Asked Questions" then individual h3 questions — also valid if there's an h2 before.
  - **Fix:** Override CardTitle to render as h2 where it appears right after h1.
- **OctgDirectory.tsx:** h1 → h2 "Browse by Category" → h3 (category names) — this is correct.
- **OctgCategory.tsx:** h1 → h2 "Related Categories" → h3 (product names) — correct.
- **Contact.tsx:** No h1 at all, starts with h2 "Why OCTG Index Exists".

## 8. Add H1 to /contact
**Fix:** Change the first h2 "Why OCTG Index Exists" to an h1 (or add a new h1 like "Contact Us" at the top of the hero section).

## Summary of Changes

| # | File | Change |
|---|------|--------|
| 1 | Auth.tsx | No change needed (already has noindex) |
| 2 | CompanyDetail.tsx | Wrap industry_role links in null guards (lines 304, 372) |
| 3 | QuickReadsGrid.tsx | Change `/articles` → `/news` (line 43) |
| 4 | — | No broken links found |
| 5 | index.html | Shorten fallback title to "OCTG Index" |
| 6 | Topic.tsx | No change needed (canonical already set) |
| 7a | EventDetail.tsx | Change CardTitle h3 → h2 for main section headings |
| 7b | CEODetail.tsx | Change CardTitle h3 → h2 for "Company Info" and "Frequently Asked Questions" |
| 8 | Contact.tsx | Add h1 "Contact Us" or change first h2 to h1 |

**Total: 5 files modified.**

