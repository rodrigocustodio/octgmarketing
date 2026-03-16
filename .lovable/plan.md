

## Plan: NYT/Bloomberg Editorial Layout for Article Detail Page

### What Changes

Rewrite the article detail page (`src/pages/Article.tsx`) to replace the full-width hero image banner with a clean editorial header + two-column body layout.

### New Layout Structure

```text
┌─────────────────────────────────────────────┐
│ Header (nav)                                │
├─────────────────────────────────────────────┤
│ container                                   │
│  Breadcrumbs                                │
│  [Region Badge]                             │
│  Article Title (h1)                         │
│  Subtitle                                   │
│  Author · Date · Reading Time               │
│  ─────────── divider ───────────            │
├─────────────────────────────────────────────┤
│ container                                   │
│ ┌──── 65% (lg) ────┐ ┌──── 35% (lg) ────┐  │
│ │                   │ │  Hero Image      │  │
│ │  Article Body     │ │  (rounded, 4:3)  │  │
│ │  (markdown)       │ │  Caption (12px)  │  │
│ │                   │ │                  │  │
│ │  CompanySpotlight │ │  Related Articles│  │
│ │  (inline mid-body)│ │  Upcoming Event  │  │
│ │                   │ │  OCTG Promo      │  │
│ │  Author Box       │ │  Newsletter CTA  │  │
│ │                   │ │  Share Buttons   │  │
│ └───────────────────┘ └──────────────────┘  │
├─────────────────────────────────────────────┤
│ More from Region (full width)               │
├─────────────────────────────────────────────┤
│ Newsletter CTA (full width, bg image)       │
├─────────────────────────────────────────────┤
│ Footer                                      │
└─────────────────────────────────────────────┘
```

**Mobile (<768px):** Image full-width above article body, max-h-[240px], rounded-lg. Sidebar stacks below article.

**No image:** Single-column layout, sidebar below content. No placeholder shown.

### Technical Details

**File:** `src/pages/Article.tsx` only.

1. **Remove** the entire hero `<section>` (lines 213-289) -- the full-width image with gradient overlays.

2. **Replace** with a plain `<section className="container pt-8 sm:pt-12">` containing:
   - Breadcrumbs, badge, h1 title, subtitle, meta row (date + reading time) -- all using `text-foreground` (no white text tricks needed without image behind).
   - `<Separator className="mt-6" />` divider.

3. **Restructure** the main content section grid:
   - Desktop (lg): `grid-cols-[1fr_380px]` (roughly 65/35)
   - Tablet (md): `grid-cols-[1fr_320px]` (roughly 60/40)
   - Mobile: single column

4. **Right column (sidebar)** starts with:
   - Conditional hero image: `{article.hero_image_url && <img ... className="w-full rounded-lg object-cover aspect-[4/3]" />}` + optional caption `<p className="text-xs text-muted-foreground mt-1.5">`.
   - Then existing sidebar widgets (RelatedArticles, UpcomingEventCard, OctgMarketingPromo, NewsletterSignup, ShareButtons).

5. **Mobile image:** Show image above article body (outside the grid) with `md:hidden`, `max-h-[240px]`, `rounded-lg`, `object-cover`, `w-full`. Hide the sidebar image on mobile with `hidden md:block`.

6. **No image fallback:** All image rendering wrapped in `{article.hero_image_url && ...}`. When null, sidebar just shows widgets; no empty space.

7. **Remove** the `heroImage` import (the fallback `hero-octg.jpg` asset) since we no longer use a fallback image.

8. **Keep untouched:** All Schema.org, SEOHead, share buttons, author box, company spotlight inline card, "More from Region" section, newsletter CTA footer section, loading/error states (update loading skeleton to match new layout).

