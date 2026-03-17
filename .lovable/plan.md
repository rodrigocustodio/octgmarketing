

# Plan: Improve OG Tag Fallbacks & Fix Facebook Compatibility

## Analysis

The infrastructure (vercel.json rewrites, serve-og function) is correctly built. The **403 error** is almost certainly Vercel's bot protection/WAF blocking `facebookexternalhit` before your code runs — no code change fixes that. **You must check Vercel dashboard → Settings → Security and disable any bot protection.**

That said, three code improvements will make OG sharing more robust:

## Changes

### 1. `public/robots.txt` — Add missing bot entries
Add `Facebot` and `LinkedInBot` entries (currently missing). These are separate user-agents from `facebookexternalhit` and `Twitterbot`.

### 2. `index.html` — Add `data-rh="true"` fallback OG tags
Add static OG meta tags with `data-rh="true"` so react-helmet-async replaces them at runtime, but non-JS crawlers still see defaults. Includes `og:site_name`, `og:type`, `og:url`, `og:title`, `og:description`, `og:image` (with width/height/type/alt), and `twitter:card`/`twitter:site`.

### 3. `src/components/SEOHead.tsx` — Add missing Facebook image tags
Add `og:image:url`, `og:image:secure_url`, `og:image:type`, and `og:image:alt` tags. Facebook requires explicit dimensions and secure_url to reliably render images.

### 4. No middleware.ts needed
Confirmed it doesn't exist. The vercel.json user-agent rewrite handles crawler routing.

### 5. Default OG image
The current fallback points to `https://octgindex.com/og-default.png`. The user wants it on Bunny CDN at `https://tukia-cdn.b-cdn.net/octgindex/og-default.jpg`. We'll update the constant but the image itself needs to be uploaded separately (via the existing `upload-to-bunny` function or manually).

## Critical non-code action
**Check Vercel → Settings → Security → Bot Protection.** If enabled, disable it. This is the most likely cause of the 403.

