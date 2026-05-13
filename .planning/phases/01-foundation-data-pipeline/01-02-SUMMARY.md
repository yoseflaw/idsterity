---
phase: 01-foundation-data-pipeline
plan: "02"
subsystem: frontend-scaffold
tags: [svelte, scrollama, i18n, language-toggle, scrollytelling, interactivity]
dependency_graph:
  requires:
    - dashboard/src/App.svelte (Plan 01-01 — Walking Skeleton scaffold)
    - dashboard/src/i18n.js (Plan 01-01 — bilingual key store)
    - scrollama ^3.2.0 (installed in Plan 01-01 Task 1)
  provides:
    - dashboard/src/App.svelte (extended with scrollama + lang-toggle)
    - dashboard/src/i18n.js (extended with heroPaketLabel + heroPaketSuffix keys)
  affects:
    - Phase 2 (narrative sections rely on stable activeStep state and bilingual copy)
tech_stack:
  added: []
  patterns:
    - scrollama onMount/onDestroy lifecycle (HMR-safe teardown via scroller?.destroy())
    - requestAnimationFrame wrapper for scrollama init (ensures DOM is queryable)
    - Scroll-position-preserving language toggle (window.scrollY capture + rAF scrollTo restore)
    - Svelte 5 onclick attribute syntax (not on:click — Svelte 4 deprecated form)
key_files:
  created: []
  modified:
    - dashboard/src/App.svelte
    - dashboard/src/i18n.js
  deleted: []
key-decisions:
  - "onDestroy (not $effect cleanup return) used for scrollama teardown — explicit, low-complexity, matches onMount lifecycle pairing"
  - "requestAnimationFrame wrapper around scrollama init — matches PATTERNS.md POC pattern; ensures [data-step] elements are in DOM before observer attachment"
  - "Svelte 5 bare onclick= attribute syntax (not on:click=) — per plan spec and Svelte 5 migration"
  - "No localStorage lang persistence — explicitly deferred per SKELETON.md and plan spec"
  - "heroPaketLabel/heroPaketSuffix added to i18n.js (not hardcoded in template) — proves toggle changes hero copy visibly"
  - "Checkpoint hero copy discrepancy was stale browser cache — source code matched spec exactly; no fix required"
patterns-established:
  - "Scrollama lifecycle: init in onMount after fetch resolution, wrapped in rAF; tear down in onDestroy with scroller?.destroy()"
  - "Lang toggle: capture scrollY before flip, restore via requestAnimationFrame after Svelte re-render"
  - "All visible copy routed through t[lang] i18n object — no hardcoded strings in template"
requirements-completed: [FOUND-02, FOUND-03]
metrics:
  duration: "~20 minutes"
  completed: "2026-05-13"
  tasks_completed: 3
  tasks_total: 3
  files_created: 0
  files_modified: 2
  files_deleted: 0
---

# Phase 1 Plan 2: Scrollama Wiring + Language Toggle Summary

**Scrollama 3.x integrated with onMount/onDestroy lifecycle for HMR-safe fire-once-per-step step driving, plus fixed top-right bilingual toggle button with scroll-position-preserving flip handler — Walking Skeleton fully operational.**

## Performance

- **Duration:** ~20 minutes
- **Started:** 2026-05-13T11:10:00Z
- **Completed:** 2026-05-13T11:32:31Z
- **Tasks:** 3 of 3
- **Files modified:** 2

## Accomplishments

- Scrollama wired in `onMount` after fetch resolution with `offset: 0.5`, `onStepEnter` handler updating `activeStep`, and HMR-safe teardown via `onDestroy` + `scroller?.destroy()`
- Fixed top-right bilingual language toggle button (44px touch target, pill, JetBrains Mono gold) with scroll-position-preserving flip handler
- Hero sublabel routed through new `heroPaketLabel`/`heroPaketSuffix` i18n keys proving toggle changes hero copy end-to-end
- Human verification checkpoint passed — all 8 smoke test checks approved; confirmed hero copy and scroll cue correctly served from i18n store

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire scrollama scroll-step driver with HMR-safe teardown** - `e0ca9aa` (feat)
2. **Task 2: Add fixed bilingual language toggle with scroll-position preservation** - `7acc9d1` (feat)
3. **Task 3: Human verification checkpoint** - Approved (copy discrepancy was stale browser cache; source matched spec)

**Plan metadata:** (this commit — docs: complete plan)

## Files Created/Modified

- `/Users/yosef/Projects/idsterity/dashboard/src/App.svelte` — Added scrollama init/teardown in onMount/onDestroy, toggleLang() function, lang-toggle button + CSS, hero sublabel wired through i18n
- `/Users/yosef/Projects/idsterity/dashboard/src/i18n.js` — Added heroPaketLabel and heroPaketSuffix keys for both id and en locales

## Decisions Made

- `onDestroy` (not `$effect` cleanup return) used for scrollama teardown — explicit pairing with `onMount`, lower cognitive overhead for single-component use
- `requestAnimationFrame` wrapper around scrollama init — ensures `[data-step]` elements are queryable after Svelte's first render cycle; matches PATTERNS.md POC
- No localStorage `lang` persistence — explicitly deferred per SKELETON.md ("session-only in Phase 1")
- `heroPaketLabel`/`heroPaketSuffix` added to `i18n.js` (not hardcoded) — proves toggle visibly changes hero copy; verifies FOUND-03 end-to-end

## Deviations from Plan

None — plan executed exactly as written.

### Checkpoint Investigation Note

The user reported seeing hero text "Pengadaan yang Mengada-ada" and scroll cue "telusuri" at the human-verify step. Investigation confirmed these strings do not exist anywhere in the current codebase (`i18n.js`, `App.svelte`, or `dist/`). The current source correctly has `heroLine1: 'Ke mana perginya'`, `heroLine2: 'uang rakyat?'`, and `scrollCue: 'gulir untuk menjelajahi ↓'` — all matching the spec. Conclusion: stale browser cache from a prior iteration. No code fix required.

## Known Stubs

Same stubs as documented in Plan 01-01 SUMMARY (`.chart-stub` and step card `sectionStub` copy). No new stubs introduced by Plan 02. These stubs are intentional placeholders for Phase 2 narrative content.

## Threat Flags

None found.

Threat register items verified as mitigated:
- T-01-02-01: `toggleLabel` is a static literal in `i18n.js` — Svelte escapes the value; no XSS vector
- T-01-02-02: `scroller?.destroy()` called in `onDestroy` — observer leak prevention verified
- T-01-02-03: `package-lock.json` pins exact scrollama version (installed in Plan 01-01)
- T-01-02-04: `window.scrollY` read — standard browser API, no security concern

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

Walking Skeleton fully demonstrable per SKELETON.md "Capability Proven End-to-End":
- Phase 1 all 3 plans complete (01-01 scaffold, 01-02 interactivity, 01-03 data pipeline)
- Phase 2 (Core Narrative S1–S6) can begin with zero infrastructure blockers
- All FOUND requirements satisfied: FOUND-01 (build artifact), FOUND-02 (scrollama fire-once), FOUND-03 (lang toggle), FOUND-04 (design tokens), FOUND-06 (self-hosted fonts)

---
*Phase: 01-foundation-data-pipeline*
*Completed: 2026-05-13*

## Self-Check: PASSED

- /Users/yosef/Projects/idsterity/dashboard/src/App.svelte: FOUND
- /Users/yosef/Projects/idsterity/dashboard/src/i18n.js: FOUND
- Commit e0ca9aa: FOUND in git log
- Commit 7acc9d1: FOUND in git log
