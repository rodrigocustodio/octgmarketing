# OCTG Index

---

# ✅ **PROMPT FOR LOVABLE — OCTG Marketing (Professional News Portal)**

**Project:** OCTG Marketing — Global OCTG Oil & Gas Industry News Portal
**Goal:** Build a full corporate-grade news website with a CMS for publishing articles, with a professional homepage, article pages, category pages, regions, topics, and an assets map structure (mills, yards, rigs, ports).
**Tech Requirements:**

* Typescript must be error-proof
* Avoid vanilla UI themes — create a clean, modern, corporate look inspired by energy/oil & gas sector
* Secure authentication + database; avoid risky RLS patterns
* CMS for adding, editing, tagging, and publishing articles
* Dashboard for editors (simple and minimal)
* Responsive layout
* Performance optimized
* SEO friendly
* Dark corporate palette + metallic/oil & gas accents
* Reusable components

---

# **1. Website Architecture**

### **Public Pages**

1. **Home**

   * Hero section with lead story + 3 secondary stories
   * Market sections: Americas, Europe, Africa, Middle East, Asia-Pacific
   * Topic sections (grid with latest articles)
   * “Data & Indices” teaser (Price index, Rig count snapshot, Asset map preview)
   * Newsletter signup
   * Corporate footer with 4 columns

2. **Article Page**

   * Title, subtitle, author, date, region, topics
   * Structured layout: hero image, pull quotes, related articles
   * Right sidebar: recommended posts, tags, filters
   * Bottom: newsletter CTA + next articles

3. **Region Pages**

   * Americas, Europe, Africa, Middle East, Asia-Pacific
   * Grid of articles filtered by region
   * Subfilters for topics

4. **Topic Pages**

   * Mills & Manufacturing
   * Yards & Supply Chain
   * Ports & Terminals
   * Rigs & Wellsite
   * Pricing & Market
   * Technology & Digitalization
   * Projects & Contracts
   * Companies & Strategy
   * HSE & Regulations
   * Careers & People

5. **Interactive Asset Map Page**

   * Mapbox or Leaflet
   * Filters: Asset type (Mill, Yard, Rig, Port), Region, Company
   * Asset card modal with:

     * Name
     * Asset type
     * Company
     * Country
     * Coordinates
     * Short description
     * Related articles

---

# **2. CMS / Admin Dashboard**

Create a clean, simple dashboard for editors with:

### **Content Types**

### **Article**

* Title
* Slug
* Subtitle
* Hero image
* Body (rich text)
* Region (single select)
* Topics (multi-select)
* Companies mentioned (multi-select)
* Assets mentioned (multi-select)
* Publish date
* Author
* Status (Draft / Published / Featured)

### **Region**

* Name
* Description
* Icon (optional)

### **Topic**

* Name
* Description
* Icon (optional)

### **Asset**

* Name
* Asset Type (Mill, Yard, Rig, Port, Coating, Inspection)
* Operator Company
* Region
* Country
* Latitude
* Longitude
* Short description
* Status (Active, Construction, Idle, Decommissioned)

### **Company**

* Name
* Logo
* Country
* Website
* Description

### **Editor Dashboard Views**

* Articles list + filters
* Create/edit forms
* Asset library
* Company library
* Region/topic management

---

# **3. UI/UX Requirements**

### **General Design**

* Corporate, clean, modern
* Avoid vanilla / generic UI kits
* Create a unique identity reflecting energy + infrastructure
* Palette: dark slate, steel gray, deep navy, oil-bronze highlights
* Typography:

  * Headlines: strong industrial sans
  * Body: clean modern sans
* Subtle backgrounds with oil & gas textures (pipes, steel, grids)
* Very clear visual hierarchy

### **Homepage Components**

* Lead article card (large, image-based)
* Secondary articles (3–5 cards)
* Region tabs (horizontal)
* Topics grid (6 tiles)
* Newsletter box
* Footer with 4 corporate columns + bottom bar

### **Article Components**

* Responsive hero image
* Clear readable text width
* Pull quotes block
* Related posts slider
* Breadcrumbs
* Region & topic badges
* Light animations on hover (corporate subtle)

---

# **4. Functional Requirements**

### **Search**

* Global search (articles, topics, companies, assets)

### **Filtering**

* On region and topic pages
* On the interactive map

### **Security**

* Roles: Admin, Editor
* Ensure stable auth; avoid breaking DB or RLS logic

### **Performance**

* Server-side rendering (if available)
* Image optimization
* Cache strategy for data pages

---

# **5. Deliverables**

Lovable should generate:

1. **Full website** with all public pages & components
2. **Admin CMS** (Articles, Topics, Regions, Assets, Companies)
3. **Interactive Map Page** (placeholder data acceptable)
4. **Database schema** preconfigured
5. **Authentication setup**
6. **Responsive styles**
7. **Corporate visual theme** consistent across pages
8. **No TypeScript errors — bulletproof code**

---

# **6. Notes for Lovable System Agents**

* Avoid auto-generating CRUD pages that break RLS; follow safe patterns
* Keep dashboard minimal and editor-friendly
* All filtering logic must be typed, safe, and resilient
* Map can be placeholder but must support dynamic asset loading
* Homepage should look like a professional corporate news portal from day one
* Ensure SEO tags exist for articles
* Build everything modular, so future AI agents can extend it (e.g., add OCTG price index, AI news scraper, etc.)

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://octgmarketing.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/633b0532-feaf-4195-ae65-36345f9a16aa).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
