

# Plan: 50/50 Hero Layout for Article Detail Page

## What Changes

Restructure the article detail page into three distinct zones: a 50/50 hero section (image left, text right), a full-width article body, and a two-column post-body widget grid.

## New Layout

```text
┌─────────────────────────────────────────────┐
│ Header + Ticker                             │
├─────────────────────────────────────────────┤
│ container                                   │
│  Breadcrumbs                                │
├─────────────────────────────────────────────┤
│ HERO SECTION (container)                    │
│ ┌──────── 50% ────────┐┌──────── 50% ─────┐│
│ │                      ││  Badge           ││
│ │   Hero Image         ││  Title (h1)      ││
│ │   (cover, rounded)   ││  Subtitle        ││
│ │   stretches to match ││  Date · Reading  ││
│ │   text height        ││  Share Buttons   ││
│ └──────────────────────┘└──────────────────┘│
│ ─────────── divider ───────────             │
├─────────────────────────────────────────────┤
│ BODY (container, full width)                │
│   Article markdown (max-w-4xl or full)      │
│   CompanySpotlight inline                   │
│   Author Box                                │
├─────────────────────────────────────────────┤
│ POST-BODY WIDGETS (container, 2-col grid)   │
│ ┌──────── Left ────────┐┌──── Right ───────┐│
│ │  Related Articles    ││ Company Spotlight ││
│ │                      ││ Upcoming Event   ││
│ │                      ││ Newsletter CTA   ││
│ └──────────────────────┘└──────────────────┘│
├─────────────────────────────────────────────┤
│ More from Region (full width)               │
├─────────────────────────────────────────────┤
│ Newsletter CTA footer                       │
├─────────────────────────────────────────────┤
│ Footer                                      │
└─────────────────────────────────────────────┘
```

**Mobile (<768px):** Image full-width first (max-h-[280px], rounded-lg, cover), then text header stacks below, then body, then widgets single-column.

**Tablet (768-1024px):** Same 50/50 but image max-h-[320px].

**No image:** Hero becomes single-column text-only header. No placeholder.

## Technical Details

**File:** `src/pages/Article.tsx` only.

### Changes:

1. **Hero section** — Replace the current separate header + mobile image + two-column body with a single hero `<section>`:
   - `grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-stretch`
   - Left: `{hasHeroImage && <img>}` with `w-full h-full object-cover rounded-lg` (stretches to match text height)
   - Right: badge, h1, subtitle, meta, ShareButtons — all in a flex column
   - Mobile: image shows first via natural DOM order, `max-h-[280px]` with `md:max-h-[320px] lg:max-h-none`
   - No image: skip the image column entirely, text goes full width

2. **Divider** — `<Separator>` after the hero grid

3. **Body section** — Full-width single column:
   - ArticleBody with CompanySpotlight inline (same slot logic)
   - AuthorBox after body
   - No sidebar beside the body

4. **Post-body widgets** — Two-column grid on desktop (`md:grid-cols-2`), single column on mobile:
   - Left: RelatedArticles
   - Right: CompanySpotlightCard (if not already inline), UpcomingEventCard, OctgMarketingPromo, NewsletterSignup compact

5. **Remove** the `sidebarWidgets` variable — replace with the new post-body layout

6. **Loading skeleton** — Update to match new 50/50 hero layout

7. **Keep untouched:** All Schema.org, SEOHead, breadcrumbs, "More from Region", newsletter CTA footer, error state, dark mode

