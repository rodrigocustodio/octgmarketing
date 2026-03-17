

# Fix LovableHTML Ignored Paths

The prerendering ignored paths are misconfigured. They reference `/newsroom/*` and `/dashboard/**` which don't exist in this project.

## What to change (manual step in Site Settings)

Replace the current ignored paths with:

```
/admin/**
/auth
```

This prevents the prerenderer from caching protected admin pages and the login page, which:
- Shouldn't be indexed by search engines
- Would show auth redirect content instead of actual page content
- Waste prerendering cache slots

## No code changes needed

This is a configuration change in the LovableHTML Site Settings dialog you're currently viewing.

