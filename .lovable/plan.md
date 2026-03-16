

# Plan: Article Pipeline and Layout Fixes

## PART 1 — Layout Fixes (Article.tsx + OctgMarketingPromo.tsx)

### 1. Remove "Last Updated" field
No "Last Updated" rendering exists in `Article.tsx` — it only exists inside the AI system prompts as `**Last Updated:** [Current Month Year]` which gets embedded in generated markdown body. Fix: remove this line from both system prompts (covered in Part 2).

### 2. Published date — already correct
`Article.tsx` line 271 already uses only `article.publish_date` from the database, formatted as "MMMM d, yyyy". No changes needed.

### 3. Duplicate sections audit
Current layout has:
- **RelatedArticles**: rendered in sidebar (line 341) AND as "More from Region" cards (line 361) — **same data, shown twice**
- **NewsletterSignup**: rendered in sidebar (line 354) AND as full-width CTA at bottom (line 393) — **duplicate**
- **ShareButtons**: rendered once (line 279) — OK

**Fix**: Remove the bottom "More from Region" section (lines 360-381) since the sidebar already shows related articles. Remove the sidebar `NewsletterSignup` (line 354) since the full-width bottom CTA is more prominent.

### 4. "Partner" label on OctgMarketingPromo
Add `<span>` with text "Partner" in 11px uppercase above the card in `OctgMarketingPromo.tsx`.

---

## PART 2 — System Prompt Replacement (Both Edge Functions)

### Files to edit:
1. `supabase/functions/generate-drafts/index.ts` — replace `SYSTEM_PROMPT` (lines 60-226)
2. `supabase/functions/generate-article-from-content/index.ts` — replace `SYSTEM_PROMPT` (lines 59-225)

### New system prompt content:
Replace with the user's provided editorial standard prompt. Key differences from current:
- Removes "Last Updated" instruction entirely
- Changes voice from SEO-template to human journalist style
- Reduces target length to 800-1000 words (standard) / 1200-1500 (analysis)
- Removes FAQ section requirement
- Adds forbidden phrases list
- Adds opening examples
- Keeps JSON output format and entity extraction rules
- Keeps heading hierarchy rules (## not #)
- Keeps the "never reference external sources" rule

The new prompt will combine the user's editorial voice instructions with the existing JSON output format, entity extraction, and region identification sections (which must be preserved for the pipeline to function).

### generate-article-from-content user prompt addition:
At line 366, append to the user message: "Write this article for OCTG Index. The reader is a senior professional in the energy industry. Do not explain what OCTG is. Do not write a conclusion section. Do not use the phrases listed as forbidden. Start with a specific tension or data point, not a general overview."

---

## Summary of file changes:

| File | Change |
|------|--------|
| `src/pages/Article.tsx` | Remove duplicate "More from Region" section (lines 360-381); remove sidebar NewsletterSignup (line 354) |
| `src/components/articles/OctgMarketingPromo.tsx` | Add "Partner" label above card |
| `supabase/functions/generate-drafts/index.ts` | Replace SYSTEM_PROMPT with new editorial standard |
| `supabase/functions/generate-article-from-content/index.ts` | Replace SYSTEM_PROMPT with new editorial standard; update user prompt |

