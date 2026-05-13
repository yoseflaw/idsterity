# Phase 02: Core Narrative (S1–S6) — Discussion Log

**Date:** 2026-05-13
**Session duration:** ~1 session
**Areas discussed:** Section Architecture, S1 Quotes Hook, Narrative Copy, Chart Components

---

## Section Architecture

| Question | Options Presented | Selected |
|----------|-------------------|----------|
| How should the 6 scroll sections be structured? | Multiple scrolly sections / Single scrolly one sticky panel | **Multiple scrolly sections** |
| How should the S5→S6 transition feel? | Same sticky panel data swap / Separate scrolly sections | **Same sticky panel, data swap** |

**Notes:** User confirmed the Pudding multi-chapter pattern with distinct scrolly blocks per narrative chapter. S5+S6 share one sticky panel with D3 animated re-sort on scroll.

---

## S1 Quotes Hook

| Question | Options Presented | Selected |
|----------|-------------------|----------|
| How should government fiscal promises be displayed? | Full-screen quote slides / Accumulated thread / Single step / Other | **Narrative + news links, no named officials** |
| How many steps, how do news links appear? | 3–5 steps each a news item / 1 step all news links listed / You decide | **1 step, all news links listed** |
| What does the sticky panel show? | Opening narrative text / No sticky full-width / You decide | **Opening narrative text** |

**Notes:** User explicitly rejected named official quotes. S1 uses narrative framing with links to news articles. No explicit names of officials. Single step with opening line as sticky display text.

---

## Narrative Copy

| Question | Options Presented | Selected |
|----------|-------------------|----------|
| Who writes the bilingual copy? | Claude drafts + user refines / User provides first / Placeholder markers | **Claude drafts, user refines** |
| What tone for S2/S3 framing copy? | Dry irony / Sharp editorial / Neutral data journalism | **Dry irony — let the numbers speak** |
| Where does the S4 safe harbour disclaimer go? | Small footnote below stats / Inline callout above / You decide | **Small footnote below the stats** |

---

## Chart Components

| Question | Options Presented | Selected |
|----------|-------------------|----------|
| How should new chart types be built? | Separate dedicated components / Extend BarChart.svelte / Claude decides | **Separate dedicated components** |
| What happens to BarChart.svelte? | Replace with InstitutionsChart.svelte / Keep alongside / You decide | **Replace with InstitutionsChart.svelte** |
| Chart type for S2/S3? | Vertical bar charts / Line charts / S2 bar + S3 line / Other | **Isometric coin stack** (user specified) |
| Does S3 also get the coin stack? | Yes same visual language / Different treatment / You decide | **Yes, same visual language** |

**Notes:** User requested isometric coin stack SVG illustration for S2 and S3 — custom visual where stack height maps to data value. Both macro sections share this visual language.

---

## Claude's Discretion Items

- Scroll step count per section (S2, S3, S5) — narrative pacing
- Isometric coin SVG implementation details
- Exact bilingual copy wording in `i18n.js`
- Scrollama instance management per section
- CR-01/CR-02/CR-03/WR-05 fix approach

## Deferred Ideas

None raised during this discussion.
