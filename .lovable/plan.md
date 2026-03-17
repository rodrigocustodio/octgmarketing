

# Fix Social Media Link Previews

## Current State
Your code is already correctly set up:
- `react-helmet-async` is installed and `HelmetProvider` wraps the app in `App.tsx`
- `SEOHead` component dynamically injects all OG/Twitter meta tags per page
- `index.html` fallback OG tags already have `data-rh="true"` attributes
- All image URLs are absolute HTTPS URLs

The problem is **not in the code** — it's that Facebook's crawler doesn't execute JavaScript, so it only sees the empty SPA shell (`<div id="root"></div>`).

## What Needs to Happen

### 1. Enable Prerendering in Publish Settings
This is a **manual step you need to do** in Lovable's publish dialog:
- Click the **Publish** button (top right on desktop)
- Look for prerendering / LovableHTML settings
- Enable prerendering
- Set canonical domain to `octgindex.com`
- Set sitemap URL to `https://octgindex.com/sitemap.xml`

This will make Lovable serve pre-rendered HTML snapshots to crawlers, which will include all the dynamic OG tags from react-helmet-async.

### 2. Clean Up the Vercel serve-og Workaround (Code Change)
Since prerendering handles crawler requests, the `serve-og` edge function rewrite in `vercel.json` for bot user-agents (lines 43-53) is no longer needed and can be removed. The `/og/:path*` rewrite (lines 79-81) and associated headers (lines 92-97) can also be removed.

### 3. Verify
After deploying with prerendering enabled, test at https://developers.facebook.com/tools/debug/ — click "Scrape Again" on any article URL. You should see the correct title, description, and image.

## Important Note
I cannot enable prerendering from code — this is a **project publish setting** you need to toggle yourself. If the prerendering option isn't visible in your publish dialog, it may need to be enabled from project settings or may require a specific plan.

