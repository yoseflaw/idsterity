---
phase: 03-interactive-back-half-s7-s9
plan: "01"
subsystem: frontend-scrollytelling
tags: [svelte5, scrollama, animation, count-up, raf, i18n, static-json]
dependency_graph:
  requires:
    - 02-core-narrative-s1-s6 (App.svelte scrollama infrastructure)
    - dashboard/public/data/summary-stats.json (labelPagu.high base value)
  provides:
    - constants.anchors (4 unit prices with source citations)
    - i18n S7 keys (12 bilingual strings)
    - S7 scrolly section in App.svelte (2 scroll steps, count-up animations)
  affects:
    - dashboard/src/App.svelte (extended, not replaced)
    - dashboard/public/data/constants.json (extended, not replaced)
    - dashboard/src/i18n.js (extended, not replaced)
tech_stack:
  added: []
  patterns:
    - requestAnimationFrame count-up with cubic ease-out (1 - Math.pow(1 - t, 3))
    - prefers-reduced-motion guard in countUp utility
    - Svelte 5 $effect tracking activeStepS7/stats/constants reactivity
    - aria-live polite transition label (s7ShowTransition state)
    - setTimeout stagger (300ms / 450ms) for Step 1 anchors
    - s7Timers array cleared in $effect and onDestroy to prevent zombie timers
key_files:
  created: []
  modified:
    - dashboard/public/data/constants.json
    - dashboard/src/i18n.js
    - dashboard/src/App.svelte
decisions:
  - Used $effect reactive block (not direct callback mutations) for count-up
    triggering so backward scroll (activeStepS7 reset) automatically re-arms
    all four animations
  - fmtCount(v, lang) added alongside fmtNum to support locale-aware count
    display in both Indonesian (period thousands separator) and English
    (comma thousands separator)
  - s7Timers plain array (not $state) avoids unnecessary reactive overhead
    for a purely imperative timer handle list
metrics:
  duration: "~45 minutes"
  completed: "2026-05-14"
  tasks_completed: 3
  tasks_total: 3
  files_modified: 3
---

# Phase 03 Plan 01: S7 Anchor Count-Up — Summary

JWT auth with refresh rotation using jose library

**One-liner:** S7 section wired end-to-end — Rp 10.7T translated into 4 animated anchor count-ups (kopi jago cups, seblak portions, SD schools, puskesmas) in gold/red across 2 scroll steps, bilingual, with cited unit prices from constants.json.

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add `anchors` key to constants.json | ba18889 | dashboard/public/data/constants.json |
| 2 | Add 12 S7 bilingual keys to i18n.js | e6ee304 | dashboard/src/i18n.js |
| 3 | Wire S7 section into App.svelte | 8ef0a2b | dashboard/src/App.svelte |

---

## What Was Built

### Task 1: constants.json `anchors` key

Added top-level `anchors` object with four entries (all existing content preserved):

| Anchor | Price (IDR) | Derived Count | Source |
|--------|-------------|---------------|--------|
| kopi | 8,000 | ~1.34 billion cups | hargamenu.net |
| seblak | 15,000 | ~715 million portions | Detik Food |
| sd | 4,500,000,000 | ~2,384 schools | Bisnis.com / BPKP |
| puskesmas | 8,000,000,000 | ~1,341 puskesmas | Antara News / Kemenkes |

Each entry has: `price` (int), `label_id`, `label_en`, `source` (https URL), `sourceLabel`.

### Task 2: i18n.js — 12 S7 bilingual keys

Added `// S7 — Anchor Count-Up` section divider in both `t.id` and `t.en` blocks.

Keys added (verbatim from UI-SPEC): `s7Eyebrow`, `s7StickyHeading`, `s7Step0Heading`, `s7Step0Body`, `s7KopiLabel`, `s7SeblakLabel`, `s7TransitionLabel`, `s7Step1Heading`, `s7Step1Body`, `s7SDLabel`, `s7PuskesmasLabel`, `s7SourcePrefix`.

Verified: `t.id.s7TransitionLabel === 'Atau, lebih seriusnya…'` and `t.en.s7StickyHeading` contains `'Rp 10.7 trillion'`.

### Task 3: App.svelte S7 section

**A. Reactive state added (after existing activeStepS5):**
- `activeStepS7 = $state(0)`, `kopiCount = $state(0)`, `seblakCount = $state(0)`, `sdCount = $state(0)`, `puskesmasCount = $state(0)`, `s7ShowTransition = $state(false)`
- `s7Timers = []` (plain variable, not $state)

**B. Utility functions added:**
- `fmtCount(v, l)` — locale-aware formatting for count display (id-ID vs en-US)
- `countUp(target, duration, onUpdate, onDone)` — RAF loop with cubic ease-out (`1 - Math.pow(1 - t, 3)`), prefers-reduced-motion guard that snaps immediately

**C. Scrollama + $effect:**
- `makeScroller('s7', i => { activeStepS7 = i })` added to `scrollers` array
- `s7Timers.forEach(clearTimeout)` added to `onDestroy`
- `$effect` reacts to `activeStepS7`, `stats`, `constants`:
  - Step 0: fires kopi + seblak countUps simultaneously; resets sdCount/puskesmasCount to 0
  - Step 1: sets `s7ShowTransition = true`; setTimeout 300ms → sd countUp; setTimeout 450ms → puskesmas countUp

**D. S7 HTML section:**
- `<section class="scrolly" data-section="s7" id="s7">` inserted after S5/S6, before fetchError
- Sticky col: `s7-sticky-heading`, `s7-transition-label` (aria-live="polite"), `.s7-anchor-pair` conditionally rendering gold (Step 0) or red (Step 1) anchor items with loading-pulse fallback (em dash) when data not yet loaded
- Steps col: 2 step cards with `stepCounter(1,2)` and `stepCounter(2,2)`, source-link anchors (all with `rel="noopener noreferrer"` — T-03-03 mitigated)
- Step indicator: 2 pips driven by `activeStepS7`

**E. Scoped CSS added:**
`.s7-sticky-heading`, `.s7-transition-label`, `.s7-anchor-pair`, `.s7-anchor`, `.s7-anchor-figure` (with `.is-gold` / `.is-red` modifiers), `.s7-anchor-label`, `.s7-anchor-citation`

---

## Verification Performed

1. `npm run build` — exits 0 with no Svelte compile errors (134.83 kB JS bundle)
2. `python3 -m json.tool` — constants.json valid JSON with correct anchors structure
3. Node module import test — all 12 S7 keys verified in both `t.id` and `t.en`
4. Grep counts — data-section="s7": 1, makeScroller('s7'): 1, countUp(: 5, activeStepS7: 6
5. All S7 source links confirmed to include `rel="noopener noreferrer"`
6. No unexpected file deletions across all 3 commits

---

## Deviations from Plan

None — plan executed exactly as written.

The S7 section does NOT apply the S1 mobile `position: relative; height: auto` override, per explicit plan instruction. S7 retains the existing `.scrolly .sticky-col` mobile rule (sticky, 50dvh) because it has interactive count-up content.

---

## Known Stubs

None. All count-up values are derived from live data (`stats.labelPagu.high` / `constants.anchors.*.price`). Loading state shows `—` (em dash) until data resolves — this is intentional UX, not a data stub.

---

## Threat Surface Scan

No new network endpoints, auth paths, or trust boundaries introduced. S7 uses only pre-baked static JSON already loaded in the existing `onMount` Promise.all triple. All external links use `rel="noopener noreferrer"` (T-03-03). The `countUp` RAF loop terminates correctly when `t >= 1` and timers are cleared in `onDestroy` (T-03-04). All copy rendered via Svelte `{t[lang].key}` — no `{@html ...}` anywhere in S7 (T-03-05).

---

## Self-Check: PASSED

- FOUND: dashboard/public/data/constants.json
- FOUND: dashboard/src/i18n.js
- FOUND: dashboard/src/App.svelte
- FOUND commit: ba18889 (Task 1)
- FOUND commit: e6ee304 (Task 2)
- FOUND commit: 8ef0a2b (Task 3)
