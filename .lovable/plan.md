

# Diagnostic Answers: Open Graph Meta Tags on Article Pages

## 1. How are OG meta tags rendered?

**Client-side only (CSR).** The `SEOHead` component uses `react-helmet-async` which injects `<meta>` tags into the DOM **after JavaScript executes**. The static `index.html` contains only generic fallback meta tags (title: "OCTG Index - Oil & Gas Industry News..."). Article-specific OG tags (og:title, og:image, og:description) are **never present in the raw HTML** before JS runs.

## 2. Exact code handling og:image for articles

In `src/pages/Article.tsx` (line 198):
```tsx
<SEOHead
  image={article.hero_image_url || undefined}
  ...
/>
```

In `src/components/SEOHead.tsx` (line 35):
```tsx
const ogImage = image.startsWith("http") ? image : DEFAULT_OG_IMAGE;
```
Where `DEFAULT_OG_IMAGE = "https://octgindex.com/og-default.png"`.

The image URL comes from `article.hero_image_url` in the database.

## 3. og:image URL format for Bunny CDN images

Absolute URL. The `generate-featured-image` edge function stores the full CDN URL:
```
https://tukia-cdn.b-cdn.net/octgindex/articles/generated/{draftId}-{timestamp}.png
```
This is an absolute `https://` URL, so `SEOHead` passes it through unchanged.

## 4. robots.txt content

Already shown in the provided context. It allows all bots, lists 5 sitemaps. No blocking rules.

## 5. Any middleware/RLS blocking crawlers?

**No server-side blocking.** This is a static SPA deployed on Vercel. There are no CSP headers, no bot-blocking middleware, no Vercel edge middleware. The `vercel.json` has no security headers that would block crawlers. RLS policies are irrelevant here since crawlers hit the static HTML, not the Supabase API.

However, the `serve-og` edge function exists specifically to serve pre-rendered OG HTML to crawlers at `/og/article/{slug}`, but **nothing in `vercel.json` routes article page URLs through it** — only `/og/:path*` is rewritten. So crawlers hitting `/article/{slug}` get the SPA shell with no OG tags.

## 6. Database field and URL format from generate-featured-image

**Field:** `hero_image_url` (on both `draft_articles` and `articles` tables)
**Format:** Absolute URL — `https://tukia-cdn.b-cdn.net/octgindex/articles/generated/{draftId}-{timestamp}.png`
(See line 125 of `generate-featured-image/index.ts`: `const publicUrl = \`${BUNNY_CDN_URL}/${filePath}\``)

## 7. SSR, SSG, or CSR?

**Pure CSR (Client-Side Rendering).** This is a Vite + React SPA. There is no SSR or SSG. The server delivers the same `index.html` shell for every route, and React renders everything in the browser after JS loads.

## 8. Default fallback og:image

Yes: `https://octgindex.com/og-default.png` (defined in `SEOHead.tsx` line 4). Used when `hero_image_url` is null/undefined or not an absolute URL.

## 9. CSP or security headers blocking crawlers

**None.** The `vercel.json` only sets `Cache-Control` headers on static assets (JS, CSS, images, fonts). No CSP, no X-Frame-Options, no bot-detection headers.

## 10. Root cause: Why Facebook shows only "octgindex.com" with no image or title

**The app is 100% client-side rendered.** Facebook's crawler (`facebookexternalhit`) does **not execute JavaScript**. When it fetches `/article/{slug}`, it receives the static `index.html` shell which contains only the generic fallback title ("OCTG Index - Oil & Gas Industry News...") and no article-specific OG tags. The `react-helmet-async` tags are injected by JS which the crawler never runs.

You already have a `serve-og` edge function that generates proper OG HTML for crawlers, but it's only mapped to `/og/article/{slug}` in `vercel.json`. The actual article URLs (`/article/{slug}`) are **not routed through it**.

**The fix** is to route crawler requests on `/article/{slug}` through the `serve-og` function. Two approaches:
1. **Vercel Edge Middleware** — detect crawler user agents on `/article/*` and rewrite to the `serve-og` function
2. **Vercel rewrite with `has` condition** — use user-agent matching in `vercel.json` (limited, since Vercel `has` doesn't support regex on user-agent for rewrites)
3. **Pre-rendering service** — use a service like prerender.io or add a Vercel edge function that serves the `serve-og` output for known crawlers

The most robust solution is a **Vercel Edge Middleware** (`middleware.ts` at project root) that checks the user agent and rewrites crawler requests to your existing `serve-og` edge function.

