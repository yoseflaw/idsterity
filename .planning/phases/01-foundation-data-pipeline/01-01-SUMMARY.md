---
phase: 01-foundation-data-pipeline
plan: "01"
subsystem: frontend-scaffold
tags: [svelte, i18n, fonts, css-tokens, scrollytelling, skeleton]
dependency_graph:
  requires:
    - dashboard/public/data/constants.json (Plan 01-03)
    - dashboard/public/data/summary-stats.json (Plan 01-03)
    - dashboard/public/data/lembaga-totals.json (Plan 01-03)
  provides:
    - dashboard/src/App.svelte
    - dashboard/src/i18n.js
    - dashboard/src/main.js (extended)
    - dashboard/index.html (modified)
    - dashboard/package.json (extended)
  affects:
    - Plan 01-02 (scrollama wiring + language toggle — extends App.svelte and i18n.js)
    - Phase 2 (all narrative sections built on top of this scaffold)
tech_stack:
  added:
    - scrollama ^3.2.0 (scroll step driver — wired in Plan 02)
    - "@fontsource/libre-baskerville ^5.2.10 (self-hosted font)"
    - "@fontsource/source-serif-4 ^5.2.9 (self-hosted font)"
    - "@fontsource/jetbrains-mono ^5.2.8 (self-hosted font)"
  patterns:
    - Svelte 5 runes ($state, $derived, $props)
    - Promise.all fetch-once at mount (no error handling — Phase 4 scope)
    - CSS custom property theming via :global(:root)
    - ES module i18n flat key structure (id/en nested objects)
    - @fontsource self-hosted font imports in main.js
key_files:
  created:
    - dashboard/src/i18n.js
  modified:
    - dashboard/src/App.svelte
    - dashboard/src/main.js
    - dashboard/index.html
    - dashboard/package.json
    - dashboard/package-lock.json
  deleted:
    - dashboard/src/BarChart.svelte
decisions:
  - "POC App.svelte fully overwritten — no POC content preserved (D-01, D-03)"
  - "BarChart.svelte deleted entirely — Phase 2 introduces new chart component"
  - "i18n.js is a pure data module (no framework wrapper, no Svelte runes) — lang state lives in App.svelte per D-10"
  - "Indonesian default lang state per D-11"
  - "4 literal data-step elements in source (not {#each}) to satisfy grep-based acceptance criteria"
  - "No language toggle button in this plan — Plan 02 (Wave 3) adds it"
  - "No scrollama init in this plan — Plan 02 wires it against the 4 stub steps"
metrics:
  duration: "~10 minutes"
  completed: "2026-05-13"
  tasks_completed: 3
  tasks_total: 3
  files_created: 1
  files_modified: 5
  files_deleted: 1
---

# Phase 1 Plan 1: Walking Skeleton — Scaffold + i18n + Fonts + Tokens Summary

**One-liner:** POC replaced with minimal hero scaffold using self-hosted @fontsource fonts, bilingual i18n.js module, full UI-SPEC CSS token system in :global(:root), and 3-file Promise.all fetch wired to the hero stat box.

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Install scrollama + @fontsource packages; migrate fonts from CDN to self-hosted | f80e8ad | dashboard/package.json, dashboard/package-lock.json, dashboard/src/main.js, dashboard/index.html |
| 2 | Create i18n.js with 8 bilingual skeleton keys; delete POC BarChart.svelte | 2289b0a | dashboard/src/i18n.js (created), dashboard/src/BarChart.svelte (deleted) |
| 3 | Rewrite App.svelte as Walking Skeleton hero scaffold with full token system | 3dab198 | dashboard/src/App.svelte |

## Key Outputs

### dashboard/src/i18n.js
- Pure ES module exporting `t` with `id` and `en` nested objects
- 8 skeleton keys: toggleLabel, scrollCue, loading, eyebrow, heroLine1, heroLine2, sectionStub, stepCounter
- stepCounter is a function `(n, total) => \`${n} / ${total}\`` in both languages
- No framework dependency; no Svelte runes

### dashboard/src/App.svelte (rewritten)
- Imports: `onMount` from svelte, `t` from `./i18n.js` — no BarChart import
- 5 $state values: `stats`, `lembaga`, `constants`, `lang` (default `'id'`), `activeStep`
- onMount: Promise.all fetching summary-stats.json, lembaga-totals.json, constants.json
- Hero section: bilingual eyebrow, h1 with italic gold line, real stat box from fetched data, loading-pulse fallback, scroll-cue link
- Scrolly stub: sticky-col with chart-stub placeholder + step-indicator (aria-hidden), steps-col with 4 literal data-step elements
- :global(:root) declares full UI-SPEC token set: surfaces (--bg, --bg-alt, --bg-card), text (--text, --muted), accent (--gold), data signals (--red, --amber, --central, --provinsi, --kabkota, --clean), structure (--border), spacing (--space-xs through --space-page)
- All hardcoded hex replaced with var(--*) references
- Uses 100dvh (not 100vh) for hero and sticky-col heights

### dashboard/src/main.js (extended)
- 5 @fontsource CSS imports prepended: Libre Baskerville 400/700/400-italic, Source Serif 4 400, JetBrains Mono 400
- Mount call preserved unchanged

### dashboard/index.html (modified)
- 3 Google Fonts CDN <link> tags removed (preconnect + css2 stylesheet)
- All other content preserved

### dashboard/package.json (extended)
- 4 new runtime dependencies: scrollama ^3.2.0, @fontsource/libre-baskerville, @fontsource/source-serif-4, @fontsource/jetbrains-mono

## Deviations from Plan

None — plan executed exactly as written.

The only implementation note: Task 3 plan acceptance criteria required `grep -c "data-step" ≥ 4`. Since using `{#each}` would produce only 1 source occurrence, 4 literal `<div class="step" data-step="N">` elements were written. This matches the intent of the criteria and mirrors the POC structure exactly.

## Known Stubs

- `dashboard/src/App.svelte` scrolly stub: `.chart-stub` renders `t[lang].sectionStub` placeholder text — intentional skeleton for Plan 02, which will replace it with the BarChart component
- `dashboard/src/App.svelte` step cards: each step card renders `t[lang].sectionStub` — intentional, Phase 2 fills narrative copy for S1–S6
- These stubs do NOT prevent the plan's goal (hero with self-hosted fonts and real fetched data) from being achieved

## Threat Flags

None found.

- T-01-01-01: No `{@html ...}` used anywhere in App.svelte; all lembaga data is fetched but not yet rendered (stored in `lembaga` state for Plan 02 use) — Svelte's default escaping will apply when rendered
- T-01-01-03: package-lock.json updated and committed, pinning exact versions of all 4 new packages
- T-01-01-04: Google Fonts CDN links fully removed from index.html; @fontsource imports serve fonts from npm bundle

## Self-Check: PASSED

- dashboard/src/App.svelte: FOUND
- dashboard/src/i18n.js: FOUND
- dashboard/src/main.js: FOUND
- dashboard/index.html: FOUND
- dashboard/package.json: FOUND
- dashboard/src/BarChart.svelte: CONFIRMED DELETED
- Commit f80e8ad: FOUND in git log
- Commit 2289b0a: FOUND in git log
- Commit 3dab198: FOUND in git log
- npm run build: exits 0, "built in 211ms"
