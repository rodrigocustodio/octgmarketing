

# Plan: Filter Related Event Dropdown to Upcoming Events Only

Both `ArticleEdit.tsx` and `CreateArticle.tsx` fetch events with no date filter — they show all events (past and future). Add a `.gte("start_date", today)` filter to both queries.

## Changes

### 1. `src/pages/admin/CreateArticle.tsx` (~line 138-141)
Add date filter to the events query:
```ts
const today = new Date().toISOString().split("T")[0];
const { data, error } = await supabase
  .from("events")
  .select("id, name, start_date")
  .gte("start_date", today)
  .order("start_date", { ascending: true }); // ascending so nearest events show first
```

### 2. `src/pages/admin/ArticleEdit.tsx` (~line 178-182)
Same filter applied. Additionally, to avoid breaking an article that already has a past event selected, the query should also include the currently selected event_id via an `.or()` filter so it still appears in the dropdown:
```ts
const today = new Date().toISOString().split("T")[0];
let query = supabase
  .from("events")
  .select("id, name, start_date")
  .gte("start_date", today)
  .order("start_date", { ascending: true });
// If article already has a past event linked, include it too
```

Since the article's current `event_id` may reference a past event, we need to handle this: fetch upcoming events, then if `formData.event_id` exists and isn't in the results, do a separate single-row fetch to include it. Or simpler: use `.or(`start_date.gte.${today},id.eq.${formData.event_id}`)` filter.

This ensures the dropdown only shows upcoming events while preserving any already-linked past event.

