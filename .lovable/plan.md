

# OCTG Index Platform -- Comprehensive Report

---

## 1. Platform Overview

**OCTG Index** is a corporate-grade energy industry news and market intelligence platform focused on Oil Country Tubular Goods (OCTG), steel pipe, and the broader oil and gas sector. It is positioned as a **news-first** editorial authority with supporting directories, events, and market data.

**Live URL:** https://octgmarketing.lovable.app  
**Tech Stack:** React + Vite + TypeScript + Tailwind CSS + shadcn/ui + Lovable Cloud (Supabase)

---

## 2. Public-Facing Features

### 2.1 Homepage (`/`)
- Hero section with featured article
- Breaking News row
- Industry Focus masonry grid
- Topic-based article rows
- Analysis/Reports section
- Quick Reads grid
- Upcoming Events section
- Featured Event spotlight
- Market Intelligence strip (steel price ticker)
- Newsletter signup
- **Status: WORKING**

### 2.2 News System
- **News listing** (`/news`) -- paginated, grouped by month, up to 50 articles
- **Article detail** (`/article/:slug`) -- full markdown rendering, reading time estimate, breadcrumbs, social share buttons, related articles sidebar, author byline box, company spotlight card, upcoming event card, newsletter CTA
- **Region pages** (`/region/:slug`) -- 6 regions: Americas, Europe, Africa, Middle East, Asia-Pacific, Australia
- **Topic pages** (`/topic/:slug`) -- 30+ content categories
- **Schema.org structured data** on articles for SEO
- **Status: WORKING** -- core content engine

### 2.3 Directories
| Directory | Route | Description |
|-----------|-------|-------------|
| Company Directory | `/directory` | 200+ OCTG companies by region and industry role |
| Company Detail | `/directory/company/:slug` | Individual company profiles with Schema.org |
| CEO Directory | `/ceo-directory` | Executive profiles with photos and bios |
| CEO Detail | `/ceo/:slug` | Individual CEO profile pages |
| Product Directory | `/octg-directory` | 9 categories, 68 products |
| Product Detail | `/octg-directory/:cat/:product` | Technical specs, applications, linked companies |
- **Status: WORKING**

### 2.4 Events Calendar
- **Events listing** (`/events`) -- 66+ events, monthly single-column layout
- **Event detail** (`/events/:slug`) -- description, venue, video (YouTube/Bunny), photo gallery, related articles
- **Status: WORKING**

### 2.5 Pricing Index (`/pricing-index`)
- Steel and raw material benchmarks (HRC, CRC, Billet, Scrap, Iron Ore)
- Energy and steel equities with state-owned entity badges
- OCTG Cost Pressure Index (Tightening/Neutral/Softening)
- "How to Read This Page" trust section
- Mandatory disclaimer about non-transactional data
- **Status: WORKING** -- depends on `fetch-steel-prices` edge function for data freshness

### 2.6 Other Public Pages
- Search (`/search`) with Cmd+K shortcut
- About, Contact (with form submission via edge function + email), Privacy Policy, Terms, Editorial Policy, Newsletter Terms
- **Status: WORKING**

### 2.7 SEO Infrastructure
- `SEOHead` component with Open Graph tags on every page
- Dynamic sitemap generation (`generate-sitemap` edge function)
- Google News sitemap for articles < 48 hours old
- IndexNow API integration for instant Bing indexing on publish
- Auto internal linking edge function
- `robots.txt` present
- **Status: WORKING**

---

## 3. Admin Panel (`/admin/*`)

Protected by role-based authentication. Requires `admin` or `editor` role in the `user_roles` table.

### 3.1 Dashboard (`/admin`)
- Stats cards: new sources, pending drafts, approved drafts, failed sources
- Price Ticker Manager for managing steel/commodity price entries
- **Status: WORKING**

### 3.2 Editorial Room (`/admin/editorial-room`)
- Editorial statistics and analytics
- Coverage heatmap (region x topic gaps)
- Company mentions tracking
- Topic suggestions with AI generation
- Product coverage matrix
- Article recategorization tool (AI-powered)
- **Status: WORKING**

### 3.3 Pipeline (`/admin/pipeline`)
- **Scraper trigger** -- calls `scrape-octg` edge function (Firecrawl API) to collect news from 100+ sources
- **AI Draft Generator** -- calls `generate-drafts` edge function (OpenAI) to rewrite raw sources into original articles
- **Topic Search** -- calls `search-topic` with preset queries
- **Fix Article Endings** -- batch repair tool
- Source and draft article counts by status
- **Status: WORKING** -- requires FIRECRAWL_API_KEY and OPENAI_API_KEY secrets (both configured)

### 3.4 Source Queue (`/admin/sources`)
- Lists raw scraped articles with status (new/processed/failed)
- Preview raw content in dialog
- **Status: WORKING**

### 3.5 Source Config (`/admin/sources-config`)
- Manage scrape sources (URLs, regions, categories, active status)
- **Status: WORKING**

### 3.6 Draft Review (`/admin/drafts`, `/admin/drafts/:id`)
- Review AI-generated drafts
- Edit markdown, assign region/topics/companies
- Approve (publishes to articles table) or reject
- AI-suggested metadata pre-populated
- **Status: WORKING**

### 3.7 Create Article (`/admin/create`)
- Manual article creation with AI generation option
- Paste content and generate via `generate-article-from-content` edge function
- Image upload (Bunny CDN via `upload-image`)
- Company tag selector, topic/region assignment
- SEO optimization via `optimize-article-seo` edge function
- Author auto-assignment by region
- Editorial Queue tab for gap-based suggestions
- **Status: WORKING**

### 3.8 Edit Articles (`/admin/articles`, `/admin/articles/:id`)
- List and edit published articles
- Full markdown editor with preview
- SEO metadata editing
- **Status: WORKING**

### 3.9 CEO Directory (`/admin/executives`, `/admin/executives/:id`)
- CRUD for executive profiles
- AI bio generation via `generate-executive-bio`
- Photo management
- **Status: WORKING**

### 3.10 Companies (`/admin/companies`, `/admin/companies/:id`)
- CRUD for 200+ companies
- AI description generation, website finder, enrichment tools
- **Status: WORKING**

### 3.11 Company Audit (`/admin/company-audit`)
- Quality audit tool using `audit-company-quality` edge function
- **Status: WORKING**

### 3.12 Products (`/admin/products`, `/admin/products/:id`)
- CRUD for products with technical specs, gallery images
- **Status: WORKING**

### 3.13 Events (`/admin/events`, `/admin/events/:id`)
- CRUD for events with AI description generation
- Gallery and video management
- **Status: WORKING**

### 3.14 Settings (`/admin/settings`)
- Static information page showing API configuration status and automation endpoints
- **Status: DISPLAY ONLY** -- no actual configuration capability from this page

---

## 4. Authentication and Security

- Email/password authentication via Lovable Cloud auth
- Role-based access: `admin`, `editor`, `user` roles stored in `user_roles` table
- `has_role()` security definer function prevents RLS recursion
- `ProtectedRoute` component wraps all admin routes
- RLS policies on all 20+ tables
- **Status: WORKING and SECURE**

---

## 5. Edge Functions (28 deployed)

| Function | Purpose | Status |
|----------|---------|--------|
| `scrape-octg` | Scrape news sources via Firecrawl | Working |
| `generate-drafts` | AI rewrite raw sources to articles | Working |
| `generate-article-from-content` | Generate from pasted content | Working |
| `optimize-article-seo` | AI SEO optimization | Working |
| `generate-featured-image` | AI image generation | Working |
| `upload-image` / `upload-to-bunny` | CDN image upload | Working |
| `generate-sitemap` | Dynamic XML sitemap | Working |
| `index-now` | IndexNow ping for Bing | Working |
| `auto-internal-links` | Auto-link companies/topics in articles | Working |
| `generate-executive-bio` | AI executive biography | Working |
| `generate-company-description` | AI company descriptions | Working |
| `enrich-company-profile` | Company data enrichment | Working |
| `find-company-website` | Auto-discover company websites | Working |
| `generate-event-description` | AI event descriptions | Working |
| `fetch-steel-prices` | Market data from Massive/Alpha Vantage | Working |
| `send-contact-email` | Contact form email via Resend/Brevo | Working |
| `newsletter-subscribe` | Newsletter subscription handler | Working |
| `search-topic` | Perplexity-powered topic research | Working |
| `generate-topic-suggestions` | AI editorial suggestions | Working |
| `research-editorial-opportunity` | Deep research for editorial gaps | Working |
| `audit-company-quality` | Company data quality scoring | Working |
| `fix-article-endings` | Batch fix truncated articles | Working |
| `recategorize-articles` | AI recategorization | Working |
| `cleanup-junk-companies` | Remove low-quality company records | Working |
| `cleanup-storage` | Storage maintenance | Working |
| `serve-og` / `generate-og-image` | Dynamic OG images | Working |
| `migrate-to-bunny` | Storage migration utility | Working |
| `scrape-adipec-exhibitors` | ADIPEC event scraper | Working |

---

## 6. Areas Needing Attention

### 6.1 High Priority
1. **Liz Westcott photo not on CDN** -- Image was copied to `public/images/team/liz-westcott.jpg` but the database `photo_url` points to `https://tukia-cdn.b-cdn.net/octgindex/executives/liz-westcott.jpg` which has not been uploaded to Bunny CDN yet. The photo will show as broken on the public CEO detail page until uploaded.

2. **Settings page is static** -- The `/admin/settings` page only displays information. API keys cannot be configured from the UI (they are managed as backend secrets). Consider removing the misleading "Not Configured" badges or showing actual secret status.

3. **Steel price data freshness** -- The Pricing Index depends on the `fetch-steel-prices` function being called periodically. If no external scheduler (cron) is set up, prices become stale. No indication of when prices were last updated is prominently shown.

### 6.2 Medium Priority
4. **No scheduled automation** -- The scraper and draft generator require external cron triggers (GitHub Actions, cron-job.org). There is no built-in scheduling. If cron is not configured, the news pipeline stops.

5. **1000-row query limit** -- Several hooks (e.g., `usePublishedArticles(50)`) set explicit limits, but others may hit the default 1000-row Supabase limit as content grows. The News page caps at 50, but admin article lists may need pagination.

6. **No admin user management UI** -- Roles must be assigned directly in the database. There is no admin interface to add/remove editors or manage user accounts.

### 6.3 Low Priority
7. **Newsletter subscribers** -- Subscribers can be inserted but cannot be updated or deleted via RLS. No admin UI to view/export subscriber list (only viewable via backend).

8. **Event gallery images** -- Gallery upload workflow exists in admin but photo URLs must be manually entered or uploaded individually.

9. **Mobile admin experience** -- The admin sidebar is a fixed 64-unit width with no responsive collapse. Admin panel is not optimized for mobile use.

---

## 7. Database Summary

**20+ tables** including: `articles`, `source_articles`, `draft_articles`, `companies`, `executives`, `events`, `products`, `product_categories`, `topics`, `regions`, `authors`, `steel_prices`, `scrape_sources`, `editorial_queue`, `editorial_suggestions`, `newsletter_subscribers`, `contact_submissions`, `profiles`, `user_roles`, and several junction tables (`article_topics`, `article_companies`, `article_assets`, `product_companies`, `product_articles`, `top_companies_watchlist`).

All tables have RLS enabled with appropriate policies.

---

## 8. Summary

OCTG Index is a **fully functional, production-grade news platform** with:
- Automated AI-powered editorial pipeline (scrape -> rewrite -> review -> publish)
- 6 regional content hubs, 30+ topic categories
- 200+ company directory, 66+ events, 68 products, CEO profiles
- Market intelligence pricing dashboard
- Comprehensive SEO infrastructure
- Secure role-based admin panel with 14 management sections

The platform's core news production and publishing workflow is complete and operational. The main gaps are operational (cron scheduling, CDN upload for new photos) rather than functional.

