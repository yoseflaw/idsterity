---
phase: 02-core-narrative-s1-s6
plan: "05"
subsystem: ui
tags: [svelte, d3, scrollytelling, stacked-bar, animation, svelte5-runes]

# Dependency graph
requires:
  - phase: 02-core-narrative-s1-s6
    provides: "lembaga-totals.json with lowPagu/medPagu/highPagu fields per institution (Plan 02)"
  - phase: 02-core-narrative-s1-s6
    provides: "App.svelte multi-scroller with activeStepS5 state and makeScroller('s5',...) wiring (Plan 01)"
provides:
  - "InstitutionsChart.svelte: D3-powered stacked-bar chart for top-30 institutions with animated re-sort"
  - "S5+S6 shared scrolly section in App.svelte with 3 step cards and one InstitutionsChart sticky panel"
  - "Phase 2 core narrative complete: S1→S2→S3→S4→S5→S6 arc fully assembled"
affects: [phase-03, phase-04, any plan reading App.svelte or lembaga data]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "D3 $effect pattern: select(svgEl).selectAll('g.bar-group').transition().duration(600).ease(easeCubicInOut)"
    - "Svelte 5 keyed #each on original data array; D3 $effect handles positional transitions — avoids DOM node recreation"
    - "isMobile matchMedia with onDestroy teardown (same pattern as DeficitChart/GDPChart)"
    - "SVG viewBox + preserveAspectRatio='xMidYMin meet' for responsive chart scaling"

key-files:
  created:
    - dashboard/src/InstitutionsChart.svelte
  modified:
    - dashboard/src/App.svelte

key-decisions:
  - "Keyed #each on original data (not sortedData) so Svelte doesn't recreate DOM nodes during D3 re-sort"
  - "S6_STEP_INDEX = 2 (S5 steps are indices 0 and 1; S6 starts at index 2)"
  - "barInnerWidth is 480px desktop / 240px mobile (fixed pixel value, SVG viewBox scales it to 100% container width)"

patterns-established:
  - "D3 animated re-sort pattern: $effect reads step + sortedData, fires transition on g.bar-group elements"
  - "Segment opacity dimming: seg-clean/seg-low dim to 0.2, seg-med dims to 0.5, seg-high stays at 1 on S6"

requirements-completed: [SEC-05, SEC-06, MOB-01, MOB-03]

# Metrics
duration: 15min
completed: 2026-05-14
---

# Phase 02 Plan 05: InstitutionsChart D3 Animated Re-sort + S5/S6 Summary

**Top-30 institutions stacked-bar chart with D3 `transition().duration(600).ease(easeCubicInOut)` re-sort by highPagu on scroll into S6, dimming non-flagged segments to opacity 0.2 over 400ms**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-05-14T07:25:32Z
- **Completed:** 2026-05-14T07:40:00Z
- **Tasks completed:** 2 of 3 (Task 3 is checkpoint:human-verify — awaiting developer)
- **Files modified:** 2

## Accomplishments
- Created `InstitutionsChart.svelte` with 4-segment stacked bars (clean/low/med/high), D3 animated re-sort on S6, and mobile-responsive label truncation (18 chars at 480px)
- Wired S5+S6 shared scrolly section into App.svelte: 3 step cards, 3 pips, one sticky InstitutionsChart panel driven by `activeStepS5`
- Phase 2 user story S1→S6 is now fully assembled pending end-to-end human verification

## Task Commits

1. **Task 1: Create InstitutionsChart.svelte** - `23fd5f9` (feat)
2. **Task 2: Wire InstitutionsChart into App.svelte** - `4f80d40` (feat)
3. **Task 3: Human verification** - awaiting checkpoint approval

## Files Created/Modified
- `dashboard/src/InstitutionsChart.svelte` - D3 stacked-bar chart with animated re-sort, SVG skeleton, legend, shortName truncation, matchMedia mobile detection
- `dashboard/src/App.svelte` - Added InstitutionsChart import + S5+S6 section with sticky panel, 3 step cards, 3 pips, s6-transition-label

## Component Shape: InstitutionsChart.svelte

**Props:** `{ data = [], step = 0, lang = 'id' }`

**Key constants:** `S6_STEP_INDEX = 2`, `BAR_HEIGHT = 18`, `BAR_GAP = 8`, `LABEL_WIDTH_DESKTOP = 220`, `LABEL_WIDTH_MOBILE = 110`, `NAME_MAX_MOBILE = 18`, `NAME_MAX_DESKTOP = 36`

**Reactive state:** `svgEl` (SVG DOM ref for D3), `isMobile` (matchMedia 480px)

**Derived:** `sortedData` branches on `step >= S6_STEP_INDEX` — sorts by `highPagu` desc for S6, `total` desc for S5. `xScale` is `scaleLinear([0, maxValue], [0, barInnerWidth])`. `labelWidth`, `nameMax`, `barInnerWidth`, `totalSvgWidth`, `chartHeight` all derive from `isMobile`.

**D3 effect:** Fires on `sortedData`/`step` change. Selects all `g.bar-group`, applies 600ms `easeCubicInOut` transform transition to new y positions. Applies 400ms opacity transitions: `seg-clean/seg-low` → `0.2` on S6 (1 on S5); `seg-med` → `0.5` on S6; `bar-label` text → `0.3` for institutions with `highPagu === 0`.

**SVG structure:** `{#each data as d (d.name)}` (keyed on original data to prevent DOM recreation). Each `g.bar-group` has 4 rects (seg-clean, seg-low, seg-med, seg-high) and a text.bar-label. Initial position computed from `sortedData.findIndex()`.

**Legend:** 4 items (high/med/low/clean) in `.legend` flexbox below the SVG.

## D3 Transition Implementation

The re-sort follows the D-02 decision:
- **Position:** `transition().duration(600).ease(easeCubicInOut)` on `g.bar-group` `transform` attribute (translate to new y = `sortedData.findIndex() * (BAR_HEIGHT + BAR_GAP)`)
- **Opacity (non-flagged):** `transition().duration(400)` on `rect.seg-clean, rect.seg-low` → `0.2` during S6
- **Opacity (med):** `transition().duration(400)` on `rect.seg-med` → `0.5` during S6  
- **Reverse:** Scrolling back to S5 (step < S6_STEP_INDEX) restores total-pagu sort and full opacity — same transition fires in reverse

## Deviations from Plan

None — plan executed exactly as written.

The node_modules symlink was needed in the worktree (Rule 3 - Blocking): the worktree's dashboard directory had no node_modules. Created a symlink to the main repo's node_modules, which is gitignored and not committed.

## Issues Encountered
- Worktree dashboard directory had no `node_modules` symlink. Created symlink `dashboard/node_modules -> /Users/yosef/Projects/idsterity/dashboard/node_modules`. Not committed (gitignored).

## Known Stubs
None — all data fields wired directly from lembaga-totals.json via the `data` prop.

## Next Phase Readiness
- Phase 2 core narrative S1→S6 is assembled and builds cleanly
- Awaiting Task 3 human verification checkpoint before Phase 2 can be declared complete
- After approval: Phase 3 (anchor numbers) and Phase 4 (word cloud + explore) can proceed

---
*Phase: 02-core-narrative-s1-s6*
*Completed: 2026-05-14*
