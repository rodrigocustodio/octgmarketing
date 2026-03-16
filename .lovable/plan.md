

# Plan: Three Fixes on Article Detail Page

## FIX 1 — Compact inline share buttons

**File: `src/components/articles/ShareButtons.tsx`**

Replace the entire Card-based layout with a minimal inline row:
- Remove Card, CardHeader, CardTitle, CardContent, Button imports
- Render: `<Separator />` then a flex row with `<span className="text-xs text-muted-foreground">Share:</span>` followed by 5 icon-only circle buttons (28x28px)
- Each button: `w-7 h-7 rounded-full border border-border/50 bg-transparent hover:bg-secondary flex items-center justify-center`
- Icons at 14px (`h-3.5 w-3.5`)
- Order: LinkedIn, Twitter, Facebook, Copy Link, Email
- Remove the `sticky top-24` and card wrapper entirely

## FIX 2 — Restore sidebar alongside article body

**File: `src/pages/Article.tsx`**

Change the body section (lines 296-329) from single-column `max-w-4xl` to a two-column grid with sidebar:
- Grid: `grid-cols-1 md:grid-cols-[1fr_320px] lg:grid-cols-[1fr_380px] gap-8`
- Left column: article body + author box (as-is)
- Right column (`sticky top-24`): RelatedArticles, UpcomingEventCard, OctgMarketingPromo, NewsletterSignup compact
- On mobile: sidebar stacks below body

Remove the separate "Post-Body Widgets" section (lines 331-358) since those components now live in the sidebar.

## FIX 3 — Hero height matching

**File: `src/pages/Article.tsx`**

Update the hero grid container (line 241):
- Change to `flex` instead of `grid` for proper `items-stretch` behavior
- Add `min-h-[320px] max-h-[520px]` constraints
- Image wrapper: `w-full md:w-[45%] lg:w-1/2` with `h-full object-cover object-center rounded-lg` on the img, and the wrapper gets `overflow-hidden rounded-lg`
- Text wrapper: `w-full md:w-[55%] lg:w-1/2` flex column justify-center
- Mobile: flex-col, image gets `max-h-[260px]` and full width, no min/max-h on container

### Responsive summary
- **Desktop (lg):** flex row, 50/50, min-h 320px, max-h 520px
- **Tablet (md):** flex row, 45/55, same height constraints  
- **Mobile (<md):** flex col, image full width max-h 260px, no container height constraint

### Files changed
1. `src/components/articles/ShareButtons.tsx` — rewrite to inline icon row
2. `src/pages/Article.tsx` — restore sidebar in body section, fix hero height

