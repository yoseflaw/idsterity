# Phase 3: Interactive Back Half (S7–S9) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-14
**Phase:** 03-interactive-back-half-s7-s9
**Areas discussed:** S7 anchor data & steps, Word cloud rendering, S9 record data source, S8/S9 page flow

---

## S7 — Anchor Data & Steps

### Q1: Base IDR figure for anchor calculations

| Option | Description | Selected |
|--------|-------------|----------|
| Use labelPagu.high from summary-stats.json | Pre-baked value, consistent with S4 display | ✓ |
| Re-run pipeline with a custom field | If S7 definition of 'high' should differ from S4 | |

**User's choice:** Use labelPagu.high (recommended)
**Notes:** No pipeline change needed for the total amount.

---

### Q2: Unit prices for 4 anchors

| Option | Description | Selected |
|--------|-------------|----------|
| Researcher finds & cites them | Researcher looks up credible IDR prices with source URLs, adds to constants.json | ✓ |
| User provides numbers now | User has specific prices already in mind | |

**User's choice:** Researcher finds & cites them (recommended)

---

### Q3: S7 scroll step structure

| Option | Description | Selected |
|--------|-------------|----------|
| One anchor per scroll step | 4 steps, one gut-punch at a time | |
| Single step, all 4 animate together | 1 trigger, staggered count-ups | |
| 2 steps: absurd pair + serious pair | Step 0 = kopi + seblak; Step 1 = "on a serious note" + schools + puskesmas | ✓ |

**User's choice:** 2 steps — kopi jago + seblak (Step 0), then "on a serious note" + SD school + puskesmas (Step 1)
**Notes:** User specified this as a free-text response. The two-beat structure is intentional: absurdity first, then civic gravity. Matches the editorial tone of the project.

---

### Q4: "On a serious note" transition label

| Option | Description | Selected |
|--------|-------------|----------|
| Literal label visible on screen | Bilingual eyebrow/transition text appears in sticky panel on Step 1 | ✓ |
| Just emotional intent | No explicit label — juxtaposition speaks for itself | |

**User's choice:** Literal label on screen (recommended)
**Notes:** Follows the s6TransitionLabel pattern already implemented in Phase 2.

---

## Word Cloud Rendering (S8)

### Q1: Rendering approach

| Option | Description | Selected |
|--------|-------------|----------|
| Sized spans, flex-wrap | Pure CSS, font-size scales with count, no new library | ✓ |
| D3-cloud 2D layout | True word cloud packing, requires d3-cloud (~8KB), harder mobile tap targets | |

**User's choice:** Sized spans, flex-wrap (recommended)

---

### Q2: Institution picker UI (620 institutions)

| Option | Description | Selected |
|--------|-------------|----------|
| Searchable text input | Native JS filter on array, dropdown of matches | ✓ |
| Scrollable dropdown (<select>) | Native select element, hard to scroll 620 items on mobile | |
| You decide | Claude picks best UX | |

**User's choice:** Searchable text input (recommended)

---

### Q3: Filter logic — mutually exclusive vs combinable

| Option | Description | Selected |
|--------|-------------|----------|
| Mutually exclusive | One filter at a time; selecting one clears the other | ✓ |
| Combinable | Both active simultaneously; requires pipeline cross-product | |

**User's choice:** Mutually exclusive (recommended)

---

### Q4: Mobile filter parity

| Option | Description | Selected |
|--------|-------------|----------|
| Filters still work on mobile (<480px) | Toggle + search input stay visible with tag-chip list | ✓ |
| Mobile shows all-words only, no filter | Simpler but loses institution filter on small screens | |

**User's choice:** Filters still work on mobile (recommended)

---

## S9 — Record Data Source

### Q1: How does S9 get records?

| Option | Description | Selected |
|--------|-------------|----------|
| Pre-bake top-N per word in pipeline | 20 separate JSON files per filter variant, fetched on click | ✓ |
| Embed records inside wordcloud JSON | Single fetch, all records in wordcloud-all.json (~200KB) | |

**User's choice:** Pre-bake top-N per word (recommended)

---

### Q2: Record cap per word

| Option | Description | Selected |
|--------|-------------|----------|
| Top 50 by pagu | Recommended — comprehensive, instant render | |
| Top 20 by pagu | Lighter, matches top-20 word cloud | ✓ |
| Top 100 by pagu | More data but heavier files | |

**User's choice:** Top 20 by pagu

---

### Q3: Filter-aware records (all/central/district)

| Option | Description | Selected |
|--------|-------------|----------|
| Filter-aware (60 files) | word-{word}-all/central/district.json, S9 respects active filter | ✓ |
| Always all-cloud records | 20 files only, mismatch when district filter active | |

**User's choice:** Filter-aware (recommended)

---

### Q4: Institution filter edge case (12,400 files too many to pre-bake)

| Option | Description | Selected |
|--------|-------------|----------|
| Fall back to 'all' records + note | Shows word-{word}-all.json with disclaimer | ✓ |
| Hide S9 when institution filter active | No table in institution view | |
| You decide | Claude picks trade-off | |

**User's choice:** Fall back to 'all' records (recommended)

---

## S8/S9 Page Flow

### Q1: Where does the record table appear?

| Option | Description | Selected |
|--------|-------------|----------|
| Separate scrolly section below S8 | S9 is its own section, page auto-scrolls to it | |
| Inline panel within S8 | Table appears inside S8, no new section | ✓ |

**User's choice:** Inline panel within S8

---

### Q2: Table placement within S8 sticky panel

| Option | Description | Selected |
|--------|-------------|----------|
| Below the cloud in sticky panel | Cloud top + table bottom, panel grows | |
| Below the steps column (not sticky) | Table in right column, cloud stays sticky | |
| Overlay — cloud hides, table shown in its place | Toggle: cloud ↔ table, cloud reappears on close | ✓ |

**User's choice:** Overlay — cloud hidden when table is open, cloud reappears when table closed
**Notes:** User specified this as free-text: "overlay when table shows then cloud is hidden. Cloud reappear when table closed." Clean toggle via `selectedWord` `$state`.

---

### Q3: Table close affordance

| Option | Description | Selected |
|--------|-------------|----------|
| Close button + click same word again | Explicit × + word re-click toggle | |
| Click anywhere outside table | Backdrop close, risk of accidental close on mobile | |
| Close button + click outside | Both close mechanisms active | ✓ |

**User's choice:** Close button or click outside table

---

## Claude's Discretion

- Count-up animation duration and easing — Claude decides (suggested ~1.5–2s ease-out)
- Word cloud font-size min/max clamping — Claude decides (count range: ~855–6144)
- Whether S7 needs its own Svelte component or can be inline in App.svelte
- Table loading state while per-word JSON fetches (spinner, skeleton, or blank)

## Deferred Ideas

- Institution-level per-word record pre-baking (620 × 20 = 12,400 files) — v2
- Virtual scroll for word-click tables with >1000 rows — already in v2 REQUIREMENTS.md
- Deep links to sections via URL hash — already in v2 REQUIREMENTS.md
