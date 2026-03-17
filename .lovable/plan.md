

# Bulk Event Upload — Analysis & Plan

## Duplicate Analysis (Within Your List)

The following appear **twice** in your provided data — I will merge them, keeping the richer version:

| Event | Entries | Resolution |
|-------|---------|------------|
| NAPE Summit | Entry #2 (no desc) + Entry #25 (with desc) | Already in DB — update with description |
| LNG2026 / World Gas Conference | Entry #1 + Entry #19 | Already in DB as `lng-2026` — update description |
| GOTECH | Entry #6 (no desc) + Entry #38 (with desc) | New — insert once with description |
| IADC/SPE Drilling Conference | Entry #4 (no desc) + Entry #31 (with desc) | New — insert once with description |
| Oman Petroleum (OPES) | Entry #8 (no desc) + Entry #42 (with desc) | Already in DB — update description |
| Global Energy Show Canada | Entry #10 (no desc) + Entry #44 (with desc) | Already in DB — update description |
| SPE ATCE | Entry #16 (no desc) + Entry #55 (with desc) | Already in DB — update description |
| Gastech | Entry #13 (no desc) + Entry #52 (with desc) | Already in DB — update description |

## Already in Database (21 events — will update with new descriptions/data)

These events exist and already have descriptions. I will update them with the richer descriptions, attendees/exhibitors counts, and any venue corrections you provided:

LNG2026, NAPE Summit, SPE Hydraulic Fracturing, SPE Formation Damage, Oil & Gas Automation Week, Oman Petroleum (OPES), Gastech, SPE ATCE, CERAWeek, EGYPES, ADIPEC, OTC, ONS, NOG Energy Week, OGA, Atyrau Oil&Gas, OGU, Rio Oil & Gas, Caspian Oil & Gas (Baku Energy Week), Global Energy Show Calgary, Gas LNG & Future of Energy

**Date discrepancies to flag:**
- Gastech: DB has Sep 15, you provided Sep 14 — will update to Sep 14
- Atyrau: DB has Apr 8, you provided Apr 7 — will update to Apr 7
- Rio Oil & Gas: DB has Sep 14, you provided Sep 21 — will update to Sep 21

## New Events to Insert (32 events)

| # | Event | Date | Location | Region | Featured |
|---|-------|------|----------|--------|----------|
| 1 | Pipeline Pigging & Integrity Management | Jan 21–22 | Houston | Americas | No |
| 2 | Private Capital Conference | Jan 22 | Houston | Americas | No |
| 3 | Nigeria International Energy Summit | Feb 2–5 | Abuja, Nigeria | Africa | Yes |
| 4 | Power Elec Nigeria | Feb 3–5 | Lagos, Nigeria | Africa | No |
| 5 | International Energy Week | Feb 10–12 | London, UK | Europe | Yes |
| 6 | 7th American LNG Forum | Feb 23–24 | Houston | Americas | No |
| 7 | Rice Energy HPC Conference | Feb 24–26 | Houston | Americas | No |
| 8 | Ohio Oil & Gas Association Annual Meeting | Mar 4–6 | Columbus, OH | Americas | No |
| 9 | Energy Exchange Australia | Mar 10–12 | Perth, Australia | Australia | Yes |
| 10 | AMPP Annual Conference + Expo | Mar 15–19 | Houston | Americas | No |
| 11 | IADC/SPE International Drilling Conference | Mar 17–19 | Galveston, TX | Americas | No |
| 12 | SGA Natural Gas Spring Gas Conference | Mar 23–25 | Columbia, USA | Americas | No |
| 13 | OTC Asia 2026 | Mar 31–Apr 2 | Kuala Lumpur | Asia-Pacific | Yes |
| 14 | Tube Düsseldorf | Apr 13–17 | Düsseldorf, Germany | Europe | Yes |
| 15 | AI in Oil & Gas Conference | Apr 8–9 | Houston | Americas | No |
| 16 | GOTECH 2026 | Apr 13–15 | Dubai, UAE | Middle East | Yes |
| 17 | 25th WPC Energy Congress | Apr 26–30 | Riyadh, Saudi Arabia | Middle East | Yes |
| 18 | Middle East Petroleum & Gas Conference | May 11–14 | Dubai, UAE | Middle East | No |
| 19 | Williston Basin Petroleum Conference | May 19–21 | Bismarck, ND | Americas | No |
| 20 | Wood Mackenzie Gas, LNG & Future of Energy | Jun 2–3 | London, UK | Europe | No |
| 21 | SPE Africa Technology Conference | Jun 16–18 | Abidjan, Côte d'Ivoire | Africa | No |
| 22 | SPE/AAPG/SEG URTeC | Jun 22–24 | Houston | Americas | No |
| 23 | Global Energy Forum | Jun 23–24 | New York City | Americas | No |
| 24 | Data Driven Oil & Gas USA | Jun 25–26 | Houston | Americas | No |
| 25 | Renewable Energy Asia | Jul 1–3 | Bangkok, Thailand | Asia-Pacific | No |
| 26 | Downstream USA 2026 | Jul 15–16 | Houston | Americas | No |
| 27 | SPE Offshore Europe | Sep 2–5 | Aberdeen, UK | Europe | Yes |
| 28 | Super DUG | Sep 15–17 | Houston | Americas | No |
| 29 | SPE Permian Basin Energy Conference | Sep 22–24 | Midland, TX | Americas | No |
| 30 | Americas LNG Summit & Exhibition | Oct 13–15 | Lake Charles, LA | Americas | Yes |
| 31 | Nigeria Energy 2026 | Oct 27–29 | Lagos, Nigeria | Africa | No |
| 32 | KIOGE 2026 | Sep 30–Oct 2 | Almaty, Kazakhstan | Asia-Pacific | No |
| 33 | OSEA 2026 | Nov 24–26 | Singapore | Asia-Pacific | Yes |

## Region Mapping

Your labels → Database regions:
- "North America" → **Americas** (`4b6ccd12...`)
- "Middle East" → **Middle East** (`de0d536e...`)
- "Europe" → **Europe** (`bb626c97...`)
- "Africa" → **Africa** (`53298537...`)
- "Asia" / "Asia-Pacific" → **Asia-Pacific** (`b00e8f7b...`)
- "Oceania" → **Australia** (`1e5146eb...`)
- "South America" → **Americas** (`4b6ccd12...`)

## Implementation Steps

1. **Update 21 existing events** — enrich descriptions, attendees/exhibitors counts, fix date discrepancies, update venues and featured status where user provided new data
2. **Insert 33 new events** — with proper region_id mapping, slugs, and all provided metadata
3. **Skip true duplicates** — Wood Mackenzie entry overlaps with existing `gas-lng-future-energy-2026` (will update that instead)

All inserts/updates will be done via the database insert tool in batches.

