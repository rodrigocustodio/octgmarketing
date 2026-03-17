

# Plan: Meta Tag Audit & Cleanup

## Current State

The `SEOHead` component already exists and is well-built. **All 28 public pages already use it.** The main issues are conflicts and inconsistencies, not missing coverage.

## Issues Found

### 1. `index.html` — Duplicate title/description/canonical (lines 40-42)
Three tags exist WITHOUT `data-rh="true"`, meaning react-helmet-async will NOT replace them, creating duplicates:
- `<title>` (line 40)
- `<meta name="description">` (line 41)  
- `<link rel="canonical">` (line 42)

**Fix:** Add `data-rh="true"` to all three so Helmet replaces them at runtime. This keeps them as crawler fallbacks while preventing duplicates.

### 2. `Article.tsx` — JSON-LD scripts outside Helmet (lines 204-211)
Two `<script type="application/ld+json">` tags use `dangerouslySetInnerHTML` directly in JSX instead of inside `<Helmet>`. This can cause duplicates on client-side navigation and won't be cleaned up when navigating away.

**Fix:** Move both JSON-LD scripts inside a `<Helmet>` block.

### 3. Admin pages — 19 of 20 admin pages have no `<title>` tag
Only `Pipeline.tsx` sets a title (via raw `<Helmet>`). The rest show the index.html fallback title.

**Fix:** Add `<Helmet><title>Page Name | OCTG Admin</title></Helmet>` to each admin page. No SEO meta needed (behind auth, noindex not necessary since ProtectedRoute blocks crawlers).

### 4. `Pipeline.tsx` — Uses raw Helmet instead of pattern
Minor inconsistency. Currently uses `<Helmet><title>...</title></Helmet>`. This is fine functionally; will standardize to match the pattern used for other admin pages.

## No issues found
- **Favicon**: Custom SVG (not Lovable placeholder). PNG variants also exist.
- **All public pages**: Already use SEOHead with proper title, description, canonical, and OG tags.
- **`index.html` body**: Clean — only `<div id="root">` and script tag. No duplicate content elements.
- **OG fallback tags** (lines 44-58): Correctly use `data-rh="true"`, no conflict.

## Changes Summary

| File | Change | 
|------|--------|
| `index.html` | Add `data-rh="true"` to title, description, canonical (lines 40-42) |
| `src/pages/Article.tsx` | Move 2 JSON-LD scripts inside `<Helmet>` |
| `src/pages/admin/Dashboard.tsx` | Add Helmet title |
| `src/pages/admin/EditorialRoom.tsx` | Add Helmet title |
| `src/pages/admin/Sources.tsx` | Add Helmet title |
| `src/pages/admin/SourcesConfig.tsx` | Add Helmet title |
| `src/pages/admin/Drafts.tsx` | Add Helmet title |
| `src/pages/admin/DraftDetail.tsx` | Add Helmet title |
| `src/pages/admin/Articles.tsx` | Add Helmet title |
| `src/pages/admin/ArticleEdit.tsx` | Add Helmet title |
| `src/pages/admin/CreateArticle.tsx` | Add Helmet title |
| `src/pages/admin/Companies.tsx` | Add Helmet title |
| `src/pages/admin/CompanyEdit.tsx` | Add Helmet title |
| `src/pages/admin/CompanyAudit.tsx` | Add Helmet title |
| `src/pages/admin/Executives.tsx` | Add Helmet title |
| `src/pages/admin/ExecutiveEdit.tsx` | Add Helmet title |
| `src/pages/admin/Products.tsx` | Add Helmet title |
| `src/pages/admin/ProductEdit.tsx` | Add Helmet title |
| `src/pages/admin/Events.tsx` | Add Helmet title |
| `src/pages/admin/EventEdit.tsx` | Add Helmet title |
| `src/pages/admin/Settings.tsx` | Add Helmet title |

Total: 22 files modified. No new components needed.

