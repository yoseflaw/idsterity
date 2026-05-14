---
phase: 03
slug: interactive-back-half-s7-s9
overall_score: 17
max_score: 24
audited: 2026-05-14
auditor: gsd-ui-auditor (claude-sonnet-4-6)
---

# Phase 03 — UI Review

> Retroactive 6-pillar visual audit against 03-UI-SPEC.md design contract.

---

## Score Summary

| Pillar | Score | Verdict |
|--------|-------|---------|
| 1. Copywriting | 3/4 | WARNING |
| 2. Visuals | 3/4 | WARNING |
| 3. Color | 3/4 | WARNING |
| 4. Typography | 2/4 | NEEDS WORK |
| 5. Spacing | 3/4 | WARNING |
| 6. Experience Design | 3/4 | WARNING |
| **Overall** | **17/24** | **WARNING** |

---

## Priority Fixes

### P1 — `s9Close` aria-label missing "tabel"/"table" context
**File:** `dashboard/src/i18n.js` lines 117, 239
**Issue:** `s9Close` is `'Tutup'` / `'Close'`. Spec mandates `"Tutup tabel"` / `"Close table"`. Screen reader users lose the table context.
**Fix:** Change to `'Tutup tabel'` / `'Close table'`.

### P2 — Typography scale: 7 off-spec font sizes
**File:** `dashboard/src/App.svelte` (multiple lines — see Pillar 4 detail)
**Issue:** Spec declares a strict 4-token scale (`--text-micro`, `--text-body`, `--text-heading`, `--text-display`). Seven additional sizes appear: `0.65rem`, `0.88rem`, `0.8rem`, `0.95rem`, `1.0rem`, `11px`, `1.2rem`. `.step-card p` at `0.95rem` (line 998) is a direct Phase 3 deviation — spec says `var(--text-body)` (0.9rem).
**Fix:** Consolidate off-spec sizes to nearest token: `0.65rem → var(--text-micro)`, `0.95rem → var(--text-body)`, `0.88rem → var(--text-body)`, `11px → var(--text-micro)`, `1.2rem → var(--text-body)` or `var(--text-heading)`.

### P3 — S9 record-count shows "0 paket" during loading
**File:** `dashboard/src/App.svelte` line 678
**Issue:** `t[lang].s9RecordCount(wordRecords.length)` renders unconditionally. When `wordRecordsLoading === true`, `wordRecords = []`, so badge shows "0 paket teratas" while table body shows "memuat paket…". False negative impression during fetch.
**Fix:** `{#if !wordRecordsLoading}{t[lang].s9RecordCount(wordRecords.length)}{/if}`

---

## Minor Recommendations

4. Add `border: 1px solid var(--border)` to `.s8-cloud` container — spec-mandated, currently absent. Adds visual boundary between filter bar and word cloud.
5. Remove `border-radius: 4px` from `.s8-filter-bar` (line 1198) — not in spec; creates card affordance inconsistent with the specified flat-bar design.
6. `.step-card padding: 2rem 1.75rem` → `var(--space-lg)` (24px) — closes spec gap; step cards are currently 8px larger than specified.
7. `.step-indicator gap: 6px` → `var(--space-xs)` — raw value, one-liner token compliance.
8. S9 table column minimum widths not set — spec mandates Lembaga 120px, Satker 100px, Pagu 80px, Paket 160px, Alasan AI 140px. Prevents column collapse on narrow overlay.

---

## Pillar Detail

### Pillar 1: Copywriting (3/4)

**Passing:**
- All 12 S7 i18n keys match spec verbatim (`s7Eyebrow`, `s7StickyHeading`, all anchor labels, `s7TransitionLabel`, `s7SourcePrefix`)
- All 11 S8 keys match spec verbatim including `s8MobileFallbackNote` ("Geser untuk melihat semua kata" / "Swipe to see all words")
- All 11 S9 keys match spec verbatim; `s9TableHeader` and `s9RecordCount` correctly implemented as functions
- No generic labels ("Submit", "OK", "Cancel") found in S7/S8/S9
- Loading states: S7 anchor em dash + `loading-pulse`, S8 `s8NoResults`, S9 "memuat paket…" / "loading records…"
- Error state: `s9Error` copy renders in `var(--amber)` at correct token size

**Failures:**
- **WARNING** `s9Close` = `'Tutup'` / `'Close'` (i18n.js lines 117, 239). Spec mandates `"Tutup tabel"` / `"Close table"`. Context dropped from screen-reader label. (→ P1)
- **WARNING** S9 record-count badge renders unconditionally during loading, showing "0 paket teratas" simultaneously with loading state. (→ P3)

---

### Pillar 2: Visuals (3/4)

**Passing:**
- S7 two-beat color contract: Step 0 count-up figures in `var(--gold)`, Step 1 in `var(--red)` — confirmed in s7-section.png and s7-step2.png
- S7 transition label "Atau, lebih seriusnya…" renders muted, italic, micro-size with `aria-live="polite"`
- S8 filter pills: active pill has gold border + gold text; inactive pills are muted — confirmed s8-central-filter.png
- S9 overlay: title word in gold `<span class="s9-title-word">`, close × right-aligned — confirmed s9-overlay.png
- Word cloud proportional font scaling readable: largest word dominates, smaller words scale down — confirmed s8-cloud.png
- Mobile S8: sticky col at ~50dvh, chip strip with horizontal overflow, swipe hint note visible — s8-mobile.png
- Mobile S7: count-up figures at display size within 50dvh — s7-mobile-proper.png

**Failures:**
- **WARNING** `.s8-cloud` container missing `border: 1px solid var(--border)`. Spec Color section mandates it. Cloud area blends into sticky panel background without boundary. (→ Minor #4)
- **WARNING** `.s8-filter-bar` has `border-radius: 4px` (line 1198) not in spec. Creates card affordance inconsistent with specified flat-bar design — visible in s8-cloud.png. (→ Minor #5)

---

### Pillar 3: Color (3/4)

**Passing:**
- All 8 color tokens defined on `:global(:root)` at correct hex values
- Gold correctly reserved: S7 anchor figures, S8 eyebrow, selected word in cloud, filter active state
- Red correctly used only on Step 1 anchors; Amber only on error states
- 60/30/10 distribution holds across all three sections

**Failures:**
- **WARNING** Three hardcoded `rgba()` values outside token system:
  - Line 855: `rgba(255,255,255,0.02)` on `.hero-stat` — should use `var(--bg-card)`
  - Line 1077: `rgba(255,255,255,0.02)` on `.s4-stat-cell` — same
  - Line 1273: `rgba(237,232,220,0.05)` on `.s8-search-item:hover` — different alpha from `--border`; not tokenized
  - Line 1476: `rgba(237,232,220,0.03)` on `.s9-table-body tr:hover td` — spec defines as a literal; inconsistent tokenization pattern

*Note: Lines 855 and 1077 are Phase 1/2 elements. Line 1476 is specified as a literal in the UI-SPEC itself.*

---

### Pillar 4: Typography (2/4)

**Passing:**
- `var(--text-micro)` (0.7rem): eyebrow, citation lines, table headers, mono data, filter labels — correct
- `var(--text-body)` (0.9rem): step card prose (spec), search input, table body cells — correct where used
- `var(--text-display)` clamp: anchor count-up figures — correct
- Font families: Libre Baskerville, Source Serif 4, JetBrains Mono all present; no unauthorized families
- Font weight: only `font-weight: 700` used — no deviation

**Failures:**
- **NEEDS WORK** 7 additional sizes outside the 4-token contract:

| Size | Location | Token it should be |
|------|----------|--------------------|
| `0.65rem` | `.step-num` (line 988), `.s6-transition-label` (line 1070) | `var(--text-micro)` |
| `0.88rem` | `.hero-sublabel` (line 869), `.s4-stat-label` (line 1079) | `var(--text-body)` |
| `0.8rem` | `.s4-row-count` (line 1086) | `var(--text-micro)` |
| `0.95rem` | `.step-card p` (line 998) | `var(--text-body)` — direct Phase 3 deviation |
| `1.0rem` | `.s4-row-label` (line 1085) | `var(--text-body)` |
| `11px` | `.lang-toggle` (line 909), `.fetch-error` (line 1108) | `var(--text-micro)` |
| `1.2rem` | `.s9-close` (line 1421) | `var(--text-heading)` |
| `1.45rem` | `.step-card h3` (line 979) | `var(--text-heading)` (1.4rem) — 0.05rem drift |

Most are Phase 1/2 inherited. `.step-card p` at `0.95rem` is the direct Phase 3 violation.

---

### Pillar 5: Spacing (3/4)

**Passing:**
- All 7 space tokens defined at correct values: `--space-xs` 4px through `--space-3xl` 64px
- S7 anchor-pair gap: `var(--space-xl)` ✓
- Filter bar gap: `var(--space-sm)` ✓; padding: `var(--space-md)` ✓
- S8 cloud container padding: `var(--space-lg)` ✓
- S9 table header padding: `var(--space-lg)` ✓
- S9 table cell padding: `var(--space-sm) var(--space-md)` ✓
- Touch targets: 9 instances of `min-height: 44px` — filter pills, search input, search items, close button, reset button ✓

**Failures:**
- **WARNING** `.sticky-col padding: 2rem 2.5rem` (line 934). Spec: `var(--space-xl)` (32px). Horizontal padding is 40px — 8px over spec. Inherited from Phase 1.
- **WARNING** `.step-card padding: 2rem 1.75rem` (line 974). Spec: `var(--space-lg)` (24px). Both axes exceed spec by 8px. Affects all S7/S8 step cards. (→ Minor #6)
- **WARNING** `.step-indicator gap: 6px` (line 940). Not a token. Should be `var(--space-xs)` (4px) or `var(--space-sm)` (8px). (→ Minor #7)
- **WARNING** `.source-link padding: 8px 0` (line 1099). Uses raw `8px` instead of `var(--space-sm)`. Functionally identical but not token-referenced.
- **NOTE** `.step padding: 3rem 0` (line 967). `3rem` = 48px = `--space-2xl`; spec says `--space-3xl` (64px). One scale step lower.

---

### Pillar 6: Experience Design (3/4)

**Passing:**
- Loading states: S7 em dash + `loading-pulse`, S9 loading row in table body, S8 `s8NoResults` — all present
- Error states: `wordRecordsError` in amber, `filterError` in filter bar, `fetchError` at page bottom
- Empty states: S8 cloud and S9 table both handled
- Close affordances: × button (44×44px hit target), outside-click guard on `.s8-sticky-panel` (not `document`), same-word toggle
- `prefers-reduced-motion`: count-up snaps to final value immediately ✓
- S7 backward scroll: `$effect` re-fires on `activeStepS7` change; Step 0 resets counts; timer cleanup via `s7Timers` + `onDestroy`
- `aria-live="polite"` on transition label ✓; `aria-pressed` on selected word button ✓; `aria-hidden="true"` on pip indicators ✓
- Word cache (`Map`) prevents re-fetch of same word+filter ✓
- D-12 institution-filter fallback to `-all` file ✓

**Failures:**
- **WARNING** S9 record-count badge shows "0 paket teratas" during `wordRecordsLoading === true`. Visual conflict with "memuat paket…" loading row. (→ P3)
- **WARNING** `aria-label` on S9 close button = `"Tutup"` / `"Close"` — truncated, context-free. Spec mandates `"Tutup tabel"` / `"Close table"`. (→ P1)

---

## Files Audited

| File | Lines |
|------|-------|
| `dashboard/src/App.svelte` | 1,539 |
| `dashboard/src/i18n.js` | 246 |
| `dashboard/public/data/constants.json` | 102 |
| `.planning/phases/03-interactive-back-half-s7-s9/03-UI-SPEC.md` | 376 |
| `.planning/phases/03-interactive-back-half-s7-s9/03-CONTEXT.md` | 134 |
| `03-01-SUMMARY.md`, `03-02-SUMMARY.md`, `03-03-SUMMARY.md` | — |

**Screenshots reviewed:** s7-section.png, s7-step2.png, s7-mobile-proper.png, s8-cloud.png, s8-central-filter.png, s9-overlay.png, s8-mobile.png, s9-closed.png
