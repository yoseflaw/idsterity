---
phase: 02-core-narrative-s1-s6
plan: "05"
subsystem: ui
tags: [svelte, d3, scrollytelling, stacked-bar, animation, svelte5-runes, bug-fix]

# Dependency graph
requires:
  - phase: 02-core-narrative-s1-s6
    provides: "lembaga-totals.json with lowPagu/medPagu/highPagu fields per institution (Plan 02)"
  - phase: 02-core-narrative-s1-s6
    provides: "App.svelte multi-scroller with activeStepS5 state and makeScroller('s5',...) wiring (Plan 01)"
provides:
  - "InstitutionsChart.svelte: D3-powered stacked-bar chart for top-30 institutions (15 on mobile) with animated re-sort"
  - "S5+S6 shared scrolly section in App.svelte with 3 step cards and one InstitutionsChart sticky panel"
  - "Phase 2 core narrative complete: S1→S2→S3→S4→S5→S6 arc fully assembled and verified"
affects: [phase-03, phase-04, any plan reading App.svelte or lembaga data]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "D3 no-data-join pattern: select(svgEl).selectAll('g.bar-group') without .data() — read data-name attribute for position lookup"
    - "Svelte 5 keyed #each on displayData; D3 $effect handles positional transitions — avoids DOM node recreation"
    - "isMobile matchMedia with onDestroy teardown (same pattern as DeficitChart/GDPChart)"
    - "SVG viewBox + preserveAspectRatio='xMidYMin meet' for responsive chart scaling"
    - "Inline reactive expression in Svelte 5 template (not @const) for step-driven attribute reactivity"

key-files:
  created:
    - dashboard/src/InstitutionsChart.svelte
  modified:
    - dashboard/src/App.svelte
    - dashboard/src/GDPChart.svelte

key-decisions:
  - "D3 re-sort uses data-name attribute on g.bar-group instead of .data() join — Svelte owns DOM, D3 cannot bind data to Svelte-rendered elements"
  - "displayData is sortedData.slice(0, 15) on mobile — reduces 30→15 bars to prevent vertical overflow"
  - "Svelte 5: {#each} template attributes must reference $derived directly, not {#const} — @const is not re-evaluated when dependencies change if the #each block itself does not re-run"
  - "S6_STEP_INDEX = 2 (S5 steps are indices 0 and 1; S6 starts at index 2)"
  - "barInnerWidth is 480px desktop / 200px mobile; labelWidth 130px on mobile for 18-char truncated names"

patterns-established:
  - "D3 animated re-sort without data join: $effect reads displayData/step, transitions g.bar-group via data-name → rankMap lookup"
  - "Segment opacity dimming: seg-clean/seg-low dim to 0.2, seg-med dims to 0.5, seg-high stays at 1 on S6"
  - "Mobile data slice pattern: $derived(isMobile ? sortedData.slice(0, MOBILE_SHOW) : sortedData)"

requirements-completed: [SEC-05, SEC-06, MOB-01, MOB-03]

# Metrics
duration: 25min
completed: 2026-05-14
---

# Phase 02 Plan 05: InstitutionsChart D3 Animated Re-sort + S5/S6 Summary

**Top-30 institutions stacked-bar chart with D3 `transition().duration(600).ease(easeCubicInOut)` re-sort by highPagu on scroll into S6, dimming non-flagged segments to opacity 0.2 over 400ms. Three bugs found during human verification were fixed post-checkpoint.**

## Performance

- **Duration:** ~25 min (including post-verification bug fixes)
- **Started:** 2026-05-14T07:25:32Z
- **Completed:** 2026-05-14
- **Tasks completed:** 3 of 3
- **Files modified:** 3

## Accomplishments
- Created `InstitutionsChart.svelte` with 4-segment stacked bars (clean/low/med/high), D3 animated re-sort on S6, and mobile-responsive label truncation (18 chars at 480px)
- Wired S5+S6 shared scrolly section into App.svelte: 3 step cards, 3 pips, one sticky InstitutionsChart panel driven by `activeStepS5`
- Fixed 3 bugs found during human verification: S3 highlight reactivity, S5→S6 D3 animation trigger, mobile bar overflow
- Phase 2 user story S1→S6 is fully assembled, verified, and builds cleanly

## Task Commits

1. **Task 1: Create InstitutionsChart.svelte** — `23fd5f9` (feat)
2. **Task 2: Wire InstitutionsChart into App.svelte** — `4f80d40` (feat)
3. **Task 3: Bug fixes (post human-verify)** — `66e9af3` (fix)

## Files Created/Modified
- `dashboard/src/InstitutionsChart.svelte` — D3 stacked-bar chart with animated re-sort, SVG skeleton, legend, shortName truncation, matchMedia mobile detection; updated for mobile data slice, data-name/data-high-pagu attributes
- `dashboard/src/App.svelte` — Added InstitutionsChart import + S5+S6 section with sticky panel, 3 step cards, 3 pips, s6-transition-label
- `dashboard/src/GDPChart.svelte` — Fixed `{@const isActive}` reactivity by inlining `activeKeys.includes(p.key)` directly in template attributes

## Component Shape: InstitutionsChart.svelte

**Props:** `{ data = [], step = 0, lang = 'id' }`

**Key constants:** `S6_STEP_INDEX = 2`, `BAR_HEIGHT_DESKTOP = 18`, `BAR_HEIGHT_MOBILE = 14`, `BAR_GAP = 8`, `LABEL_WIDTH_DESKTOP = 220`, `LABEL_WIDTH_MOBILE = 130`, `NAME_MAX_MOBILE = 18`, `NAME_MAX_DESKTOP = 36`, `MOBILE_SHOW = 15`

**Reactive state:** `svgEl` (SVG DOM ref for D3), `isMobile` (matchMedia 480px)

**Derived:** `barHeight`, `labelWidth`, `nameMax`, `barInnerWidth`, `totalSvgWidth` from `isMobile`. `sortedData` branches on `step >= S6_STEP_INDEX`. `displayData` is `sortedData.slice(0, 15)` on mobile. `chartHeight` from `displayData.length`.

**D3 effect:** Fires on `displayData`/`step` change. Builds `rankMap` from `displayData`. Selects all `g.bar-group`, reads `data-name` attribute, applies 600ms `easeCubicInOut` transform transition. Applies 400ms opacity transitions: `seg-clean/seg-low` → `0.2` on S6; `seg-med` → `0.5`; `text.bar-label` reads `data-high-pagu` → `0.3` for zero-highPagu institutions.

**SVG structure:** `{#each displayData as d (d.name)}` (keyed). Each `g.bar-group` has `data-name` attribute, 4 rects (seg-clean, seg-low, seg-med, seg-high), and a `text.bar-label` with `data-high-pagu` attribute.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed GDPChart S3 coin-stack highlight not responding to scroll steps**
- **Found during:** Human verification (Task 3)
- **Issue:** `{@const isActive = activeKeys.includes(p.key)}` inside `{#each}` is not reactive in Svelte 5. When `step` changes, `activeKeys` ($derived) updates, but if the `{#each}` block does not re-run (because `points` does not change), `@const` is never re-evaluated, so `opacity` and `transform: scaleY()` stay stale.
- **Fix:** Removed `{@const isActive}` and inlined `activeKeys.includes(p.key)` directly in the `opacity` and `style` attributes. Svelte 5 tracks `activeKeys` as a dependency of the template expression and re-renders when it changes.
- **Files modified:** `dashboard/src/GDPChart.svelte`
- **Commit:** `66e9af3`

**2. [Rule 1 - Bug] Fixed InstitutionsChart S5→S6 D3 re-sort animation not firing**
- **Found during:** Human verification (Task 3)
- **Issue:** `svg.selectAll('g.bar-group').data(sortedData, d => d.name)` creates a D3 data join on Svelte-rendered DOM elements. Since Svelte (not D3) created these elements, they have no prior D3-bound data, so `.data()` returns an empty UPDATE selection — all elements land in ENTER, and the transition on the UPDATE selection does nothing.
- **Fix:** Removed `.data()` join entirely. Instead, built a `rankMap` (`Map<name, index>`) from `displayData`, then selected `g.bar-group` elements without a join, reading their `data-name` attribute to look up new rank. Added `data-name={d.name}` to each `g.bar-group` in the template. Similarly, replaced the datum-based label opacity with `data-high-pagu` attribute reads.
- **Files modified:** `dashboard/src/InstitutionsChart.svelte`
- **Commit:** `66e9af3`

**3. [Rule 1 - Bug] Fixed mobile InstitutionsChart — 30 bars overflow, labels invisible**
- **Found during:** Human verification (Task 3)
- **Issue:** On 375px viewport, 30 bars at 18px height with only 110px for labels caused vertical overflow and labels were truncated beyond recognition.
- **Fix:** Added `displayData = $derived(isMobile ? sortedData.slice(0, MOBILE_SHOW) : sortedData)` (MOBILE_SHOW = 15). Updated template to iterate `displayData` instead of `data`. Changed `BAR_HEIGHT_MOBILE = 14`, `LABEL_WIDTH_MOBILE = 130`, `barInnerWidth` mobile value `200`. Added `overflow: hidden` on SVG in both inline style and CSS rule. `chartHeight` now derived from `displayData.length`.
- **Files modified:** `dashboard/src/InstitutionsChart.svelte`
- **Commit:** `66e9af3`

## Issues Encountered
- Worktree dashboard directory had no `node_modules` symlink. Symlink `dashboard/node_modules -> /Users/yosef/Projects/idsterity/dashboard/node_modules` was created in a prior session. Not committed (gitignored).

## Known Stubs
None — all data fields wired directly from lembaga-totals.json via the `data` prop.

## Threat Flags
None — no new network endpoints, auth paths, or trust boundaries introduced.

## Build Status
`npm run build` exits 0. 701 modules transformed, no warnings or errors.

## Self-Check: PASSED
- `dashboard/src/InstitutionsChart.svelte` — exists
- `dashboard/src/GDPChart.svelte` — exists
- Commits `23fd5f9`, `4f80d40`, `66e9af3` — all present on `worktree-agent-ac20cb6532167399f`

---
*Phase: 02-core-narrative-s1-s6*
*Completed: 2026-05-14*
