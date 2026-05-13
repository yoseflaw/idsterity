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
decisions:
  - "onDestroy (not $effect cleanup return) used for scrollama teardown — explicit, low-complexity, matches onMount lifecycle pairing"
  - "requestAnimationFrame wrapper around scrollama init — matches PATTERNS.md POC pattern; ensures [data-step] elements are in DOM before observer attachment"
  - "Svelte 5 bare onclick= attribute syntax (not on:click=) — per plan spec and Svelte 5 migration"
  - "No localStorage lang persistence — explicitly deferred per SKELETON.md and plan spec"
  - "heroPaketLabel/heroPaketSuffix added to i18n.js (not hardcoded in template) — proves toggle changes hero copy visibly"
metrics:
  duration: "~10 minutes"
  completed: "2026-05-13"
  tasks_completed: 2
  tasks_total: 3
  files_created: 0
  files_modified: 2
  files_deleted: 0
---

# Phase 1 Plan 2: Scrollama Wiring + Language Toggle Summary

**One-liner:** Scrollama 3.x integrated with onMount/onDestroy lifecycle for HMR-safe fire-once-per-step step driving, plus fixed top-right bilingual toggle button with scroll-position-preserving flip handler.

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Wire scrollama in onMount after fetch with offset 0.5, onStepEnter handler, rAF wrapper, and onDestroy teardown | e0ca9aa | dashboard/src/App.svelte |
| 2 | Add fixed lang-toggle button with toggleLang() scroll-preserving handler; add heroPaketLabel/heroPaketSuffix i18n keys; wire hero sublabel through i18n | 7acc9d1 | dashboard/src/App.svelte, dashboard/src/i18n.js |

## Key Outputs

### dashboard/src/App.svelte (extended)

**Scrollama wiring (Task 1):**
- Imports: `onDestroy` from `'svelte'`, `scrollama` from `'scrollama'`
- Module-scope `let scroller` (non-reactive — not $state)
- `onResize` helper: `() => scroller && scroller.resize()`
- Inside `onMount`, after Promise.all resolves: `requestAnimationFrame(() => { scroller = scrollama().setup({ step: '[data-step]', offset: 0.5, progress: false }).onStepEnter(({ index }) => { activeStep = index }) })`
- Resize listener added: `window.addEventListener('resize', onResize)`
- `onDestroy` calls `scroller?.destroy()` + `window.removeEventListener('resize', onResize)`

**Language toggle (Task 2):**
- `function toggleLang()`: captures `window.scrollY`, flips `lang = lang === 'id' ? 'en' : 'id'`, restores scroll via `requestAnimationFrame(() => window.scrollTo(0, y))`
- `<button class="lang-toggle" onclick={toggleLang}>{t[lang].toggleLabel}</button>` immediately after `<div class="site">` opening tag
- Hero sublabel: `{t[lang].heroPaketLabel} {fmtNum(stats.totalRecords)}<br>{t[lang].heroPaketSuffix}`
- `.lang-toggle` CSS: `position: fixed; top: 16px; right: 16px; z-index: 100; min-width: 44px; min-height: 44px; padding: 0 14px; border-radius: 9999px; color: var(--gold); font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700`

### dashboard/src/i18n.js (extended)

New keys added to both `t.id` and `t.en`:
- `heroPaketLabel` — id: `'dialokasikan dalam'`, en: `'allocated across'`
- `heroPaketSuffix` — id: `'paket pengadaan pemerintah Indonesia'`, en: `'Indonesian government procurement packages'`

## Checkpoint Reached

**Task 3 (checkpoint:human-verify)** is the final task — human smoke test of the Walking Skeleton end-to-end. Awaiting human verification before marking this plan complete.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

Same stubs as documented in Plan 01-01 SUMMARY (`.chart-stub`, step card `sectionStub` copy). No new stubs introduced by Plan 02.

## Threat Flags

None found.

- T-01-02-01: `toggleLabel` is a static literal in `i18n.js` — Svelte escapes the value; no XSS vector
- T-01-02-02: `scroller?.destroy()` called in `onDestroy` — observer leak prevention verified by grep check in acceptance criteria
- T-01-02-03: `package-lock.json` pins exact scrollama version (installed in Plan 01-01)
- T-01-02-04: `window.scrollY` read — standard browser API, no security concern

## Self-Check: PASSED

- dashboard/src/App.svelte: FOUND
- dashboard/src/i18n.js: FOUND
- Commit e0ca9aa: FOUND in git log
- Commit 7acc9d1: FOUND in git log
- npm run build: exits 0, "built in 215ms"
