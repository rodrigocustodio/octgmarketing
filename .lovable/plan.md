

# Plan: Strip "Last Updated" from Article Body Rendering

## Root Cause
The "Last Updated: October 2023" line is embedded in the article's `body_markdown` content stored in the database. The previous system prompt fix prevents **future** articles from including it, but **existing** articles still have it baked into their markdown.

## Fix
**File: `src/lib/markdown.ts`** — Add a sanitization step in `markdownToHtml()` that strips any line matching the pattern `**Last Updated:** ...` or `Last Updated: ...` before converting to HTML.

Add a regex replace before the `marked.parse()` call:
```ts
// Remove "Last Updated" lines from legacy article content
markdown = markdown.replace(/\*?\*?Last Updated:?\*?\*?:?\s*.+/gi, '');
```

This is a single-line fix that globally removes the "Last Updated" text from all rendered articles — past, present, and future — without modifying database content.

No other files need changes.

