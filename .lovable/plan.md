

# Plan: Fix OG Meta Tags for Social Crawlers

## Current State

Everything is already in place:

1. **`vercel.json` (lines 43-53)** already has a rewrite that matches crawler user-agents on `/article/:slug*` and routes them to the `serve-og` edge function. This does exactly what the proposed middleware would do.

2. **`serve-og` edge function** already correctly:
   - Extracts slug from `/article/{slug}` path
   - Queries articles table for title, subtitle, hero_image_url, region
   - Returns complete HTML with og:title, og:description, og:image, og:url, twitter:card, etc.
   - Falls back to `https://octgindex.com/og-default.png` when no hero image
   - Sets `Content-Type: text/html`
   - For crawlers: no redirect script (just meta tags)
   - For non-crawlers: includes JS redirect to canonical URL

## Why NOT to create middleware.ts

This is a **Vite project, not Next.js**. `NextResponse` and `NextRequest` from `next/server` are not available. Vercel Edge Middleware for non-Next.js projects uses a different Web API (`Request`/`Response`), but the `vercel.json` rewrite with `has` user-agent matching already accomplishes the same thing more simply and is already deployed.

## What needs to change

**Only one thing**: expand the user-agent regex in `vercel.json` line 49 to include the additional crawlers you listed that are currently missing: `bingbot`, `applebot`, `rogerbot`, `showyoubot`, `outbrain`, `vkshare`, `ia_archiver`, `seznambot`, `quora link preview`.

### File: `vercel.json` (line 49)

Update the regex from:
```
(?i).*(facebookexternalhit|facebot|linkedinbot|twitterbot|whatsapp|telegrambot|slackbot|discordbot|pinterest|redditbot|googlebot|baiduspider|yandex|embedly).*
```
To:
```
(?i).*(facebookexternalhit|facebot|linkedinbot|twitterbot|whatsapp|telegrambot|slackbot|discordbot|pinterest|redditbot|googlebot|baiduspider|yandex|embedly|bingbot|applebot|rogerbot|showyoubot|outbrain|vkshare|ia_archiver|seznambot).*
```

No other changes needed. The serve-og function is already correct and complete.

