# Full Backup Package — OCTGIndex → Laravel on Cloudways

One downloadable ZIP containing every asset, all data, all backend code, and a step-by-step migration guide for a Laravel app hosted on Cloudways.

## What goes in the ZIP

```text
octgindex-backup-2026-08-30.zip
├── README-MIGRATION.md          Master instructions (Cloudways + Laravel)
├── database/
│   ├── csv/                     One CSV per table (29 tables, ~1,750 rows)
│   ├── schema-mysql.sql         MySQL 8 schema: tables, enums→ENUM, keys, indexes
│   ├── import-mysql.sh          Loads every CSV in dependency order
│   └── DATA-NOTES.md            Column-by-column type mapping (uuid, jsonb, arrays)
├── images/
│   ├── files/                   Every image binary, downloaded and de-duplicated
│   │   ├── articles/  executives/  events/  companies/  products/  site/
│   ├── manifest.csv             original URL → local path → table.column.row_id
│   └── url-rewrite.sql          Optional SQL to repoint URLs at the new host
├── edge-functions/              All 34 functions, source as-is
│   ├── <function-name>/index.ts
│   └── LARAVEL-PORTING-GUIDE.md Deno → Laravel job/command mapping, cron schedule
├── emails/
│   ├── contact-notification.html   Extracted from send-contact-email
│   ├── newsletter-*.md             Brevo list-2 sync flow + attributes
│   └── EMAIL-SETUP.md              Resend + Brevo config for Laravel Mail
├── frontend-reference/
│   ├── routes.md                All public + admin routes with their data sources
│   └── seo.md                   Sitemap, robots, llms.txt, JSON-LD structures
└── config/
    ├── secrets-required.md      Names of every secret needed (values NOT included)
    ├── cron-schedule.md         All pg_cron jobs → Laravel scheduler equivalents
    └── storage-buckets.md       Bunny CDN zones + Supabase bucket contents
```

## How each part is produced

**Database** — CSV export per table via `COPY ... TO STDOUT WITH CSV HEADER`. A hand-written MySQL 8 schema converts Postgres types: `uuid`→`CHAR(36)`, `jsonb`→`JSON`, `text[]`→`JSON`, enums→native MySQL `ENUM`, `timestamptz`→`TIMESTAMP`. Foreign keys and unique slugs preserved. Import script orders loads so parents come before children.

**Images** — Crawl every image-bearing column (`articles.hero_image_url`, `executives.photo_url`, `events.image_url`, `events.gallery_images`, `companies.logo_url`, `products.hero_image_url`/`gallery_images`) plus inline markdown images inside `articles.body`, plus everything in `public/` and `src/assets/`, plus the `article-images` storage bucket. Download each unique URL, strip CDN query params, store under a foldered path, record the mapping in `manifest.csv`. Expected ~300 remote files.

**Edge functions** — Copied verbatim from `supabase/functions/`. The porting guide maps each one to a Laravel Artisan command or queued job, notes its trigger (cron / HTTP / admin button), its external API dependency, and its auth requirement.

**Emails** — Templates and sending logic pulled out of `send-contact-email` and `newsletter-subscribe`, rewritten as Blade-ready HTML, with the Resend and Brevo setup documented (list ID 2, SOURCE attribute rule preserved).

**Secrets** — Names and purposes only. No key values are written into the ZIP; the guide tells you where to paste each one in Cloudways env settings.

## Migration guide contents

1. Provision Laravel + MySQL 8 on Cloudways, PHP 8.3.
2. Create the schema, run the CSV import script, verify row counts.
3. Upload `images/files/` to `public/storage/` (or a new Bunny zone) and run `url-rewrite.sql`.
4. Eloquent model + relationship stubs for the core tables.
5. Port the 34 functions in priority order: contact/newsletter first, then sitemap/OG, then the AI automations.
6. Wire Laravel Scheduler to replace every pg_cron job.
7. Auth: replace Supabase auth with Laravel Breeze + the existing `user_roles` table (admin/editor gate).
8. Post-cutover checklist: DNS, sitemap resubmission, IndexNow, redirects to preserve the ranking pages.

## Notes

- Image download of ~300 files may take a few minutes; if any URL 404s it is logged in `manifest.csv` rather than failing the build.
- The ZIP will land in your documents area as a downloadable artifact.
- Nothing in the live project is modified — this is read-only export work.
