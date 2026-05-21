## Goal
Make the company website a prominent, can't-miss action on the company profile page, and visually upgrade the phone/email rows so the contact card actually feels useful.

## Current problem
On `/directory/company/:slug`, the Contact card renders website, phone, and email as three identical tiny text links. The website — the most valuable action — has no visual weight. Users miss it entirely.

## Proposed redesign (Contact card, `src/pages/CompanyDetail.tsx` lines ~479–519)

```text
┌─────────────────────────────────┐
│ Contact                         │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ 🌐  Visit Website        ↗ │ │  ← Full-width primary button
│ │     abb.com                 │ │     (bronze/accent gradient, h-14)
│ └─────────────────────────────┘ │
│                                 │
│ ┌──────────────┬──────────────┐ │
│ │ 📞 Call      │ ✉ Email      │ │  ← Secondary outline buttons,
│ │ +1 555-1234  │ info@abb.com │ │     side-by-side on desktop,
│ └──────────────┴──────────────┘ │     stacked on mobile
└─────────────────────────────────┘
```

### Details
- **Website**: full-width `Button` using the existing `hero` variant (accent background, bold display font, h-14, ExternalLink icon right-aligned). Shows label "Visit Website" with the cleaned domain underneath in smaller muted text. Opens in new tab.
- **Phone**: outline button, icon + "Call" label + number underneath. `tel:` link.
- **Email**: outline button, icon + "Email" label + address underneath (truncated). `mailto:` link.
- Phone + Email share a 2-col grid on `sm+`, stack on mobile. If only one exists, it spans full width.
- Empty state unchanged.
- Uses existing semantic tokens — no new colors.

## Scope
- Single file: `src/pages/CompanyDetail.tsx`, Contact card block only.
- No data, route, or schema changes.
- No other pages touched.