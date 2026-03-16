

# Plan: Swap Hero Columns — Text Left, Image Right

**File:** `src/pages/Article.tsx` only.

Swap the DOM order of the two hero children so text comes first (left on desktop) and image comes second (right on desktop).

### Changes (lines 246-297):

1. **Line 246 comment** → update to "text left, image right"
2. **Move the text `<div>` block (lines 259-297) BEFORE the image `<div>` block (lines 249-256)** — simply reorder the two children inside the flex container
3. No class changes needed — the flex container already handles the layout; DOM order determines left/right in a flex-row

Mobile behavior stays the same since on mobile (`flex-col`) the text will appear first, then image below. If you want image first on mobile, we add `order-first md:order-last` to the image div — but since the user's screenshot reference shows image on top for mobile, we'll add `order-last md:order-none` on the text div and `order-first md:order-last` on the image div to keep image-first on mobile while image-right on desktop.

### Summary of class tweaks:
- **Image div:** add `order-first md:order-last` (image on top mobile, right on desktop)
- **Text div:** no order class needed (natural first = left on desktop, but below image on mobile due to image's `order-first`)

