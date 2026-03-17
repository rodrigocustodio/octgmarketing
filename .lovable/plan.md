

# Assessment: Social Sharing OG Tags — What's Already Working vs. What Needs Fixing

## The Core Issue

Your OG infrastructure is **already correctly built**. The problem you encountered was testing on the Lovable preview URL (`preview--octgmarketing.lovable.app`) instead of the production URL (`octgindex.com`). The preview domain is behind Lovable's auth-bridge — no code change can fix that. You must test on production.

Here's what's already in place and working:

| Component | Status | Evidence |
|-----------|--------|----------|
| SEOHead canonical/og:url | ✅ Hardcoded to `https://octgindex.com` | Line 7 of SEOHead.tsx |
| serve-og edge function | ✅ Returns correct OG HTML for crawlers | Full implementation exists |
| Vercel crawler rewrite | ✅ Routes bots to serve-og | vercel.json line 43-53, matches 16+ bot user-agents |
| `/og/:path*` rewrite | ✅ Direct OG endpoint works | vercel.json line 79-81 |

## What Does NOT Apply

- **Part 1 (block preview domain)**: Lovable controls the preview domain. We cannot add robots.txt or meta tags that would override Lovable's auth-bridge behavior on their domain. This is by design.
- **Part 4 (Next.js middleware)**: This project is **Vite + React**, not Next.js. `NextResponse`, `NextRequest`, and `middleware.ts` do not exist in this stack. The vercel.json user-agent rewrite already handles crawler routing — that's the Vite/Vercel equivalent.
- **Part 5 (update rewrites)**: Already present and correct.

## What's Worth Improving (Minor)

Three small enhancements to serve-og and vercel.json:

### 1. Add `X-Robots-Tag: noindex` to `/og/` routes
Prevents the OG-serving endpoint itself from being indexed by Google.
**File: `vercel.json`** — update the existing `/og/(.*)` headers entry to include `X-Robots-Tag`.

### 2. Add `article:published_time` and `article:author` to serve-og
The edge function currently doesn't fetch or output `publish_date` or author info. Add these fields to the query and the HTML output.
**File: `supabase/functions/serve-og/index.ts`** — extend the select query to include `publish_date`, add two meta tags.

### 3. Add `twitter:site` to serve-og
Currently missing from the edge function's HTML output (the React SEOHead has it, but the pre-rendered serve-og HTML does not).
**File: `supabase/functions/serve-og/index.ts`** — add `<meta name="twitter:site" content="@OCTGMarketing" />`.

### 4. fb:app_id placeholder
Add a comment placeholder in serve-og. This is optional — Facebook works without it but shows a warning.

## Summary

| File | Change |
|------|--------|
| `vercel.json` | Add `X-Robots-Tag: noindex` header to `/og/(.*)` |
| `supabase/functions/serve-og/index.ts` | Add `publish_date` to query; add `article:published_time`, `article:author`, `twitter:site` meta tags; add `fb:app_id` placeholder comment |

After deploying, test by pasting `https://octgindex.com/article/50-steel-tariffs-the-new-reality-for-octg-importers-mmtuqao5` into Facebook's Sharing Debugger. Never use the preview URL.

