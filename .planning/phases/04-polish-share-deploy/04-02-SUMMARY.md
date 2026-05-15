---
phase: 04-polish-share-deploy
plan: "02"
subsystem: build-config
tags: [vite, deploy, base-path, static-site]
dependency_graph:
  requires: []
  provides: [subdirectory-deploy-build]
  affects: [dashboard/dist/]
tech_stack:
  added: []
  patterns: [import.meta.env.BASE_URL for static asset paths]
key_files:
  created: []
  modified:
    - dashboard/vite.config.js
    - dashboard/src/App.svelte
decisions:
  - "Used import.meta.env.BASE_URL (dot notation) — Vite does not replace bracket notation"
  - "No leading slash on 'data/...' — Vite guarantees BASE_URL ends with '/'"
metrics:
  duration: "~5 minutes"
  completed: "2026-05-15"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 2
---

# Phase 04 Plan 02: Vite Base Path and Fetch URL Configuration Summary

**One-liner:** Added `base: '/sterity/'` to vite.config.js and migrated all 9 `safeFetch` call sites in App.svelte to use `import.meta.env.BASE_URL` so the built dist/ deploys correctly to https://yosef.id/sterity/.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add base path to vite.config.js and fix 9 safeFetch call sites | 90a7a7e | dashboard/vite.config.js, dashboard/src/App.svelte |
| 2 | Run npm run build and verify dist/ structure | (no files to commit — dist/ gitignored) | dashboard/dist/ |

## What Was Built

- **vite.config.js:** Added `base: '/sterity/'` before `plugins`. Both leading and trailing slashes present. This causes Vite to prefix all asset references in `dist/index.html` with `/sterity/`.
- **App.svelte:** Replaced all 9 hardcoded `/data/...` fetch paths with `import.meta.env.BASE_URL + 'data/...'`. Groups: setFilter (3 sites), selectWord template literal (1 site), onMount Promise.all (5 sites).
- **Build verified:** `npm run build` exits 0. `dist/index.html` references `/sterity/assets/` (2 matches). No bare `/assets/` references. `dist/data/` contains all data JSON files. `dashboard/dist/` confirmed in .gitignore line 7.

## Verification Results

| Check | Result |
|-------|--------|
| `grep -c "base: '/sterity/'" dashboard/vite.config.js` | 1 |
| `grep -c "import.meta.env.BASE_URL" dashboard/src/App.svelte` | 9 |
| `grep "safeFetch('/data/" dashboard/src/App.svelte` | empty (none) |
| `grep 'safeFetch(\`/data/' dashboard/src/App.svelte` | empty (none) |
| `npm run build` exit code | 0 |
| `grep -c '/sterity/assets/' dashboard/dist/index.html` | 2 |
| `grep 'src="/assets/' dashboard/dist/index.html` | empty (none) |
| `ls dashboard/dist/data/` | all data JSON files present |
| `git check-ignore -v dashboard/dist/` | .gitignore:7 match confirmed |

## Requirements Satisfied

- **DEPL-01:** Build produces correct subdirectory paths — `base: '/sterity/'` in vite.config.js
- **DEPL-02:** All 9 safeFetch call sites use `import.meta.env.BASE_URL`
- **DEPL-03:** `dashboard/dist/` excluded from git at .gitignore line 7 (pre-existing, confirmed)

## Deviations from Plan

None — plan executed exactly as written.

## Threat Flags

None — no new network endpoints, auth paths, or schema changes introduced. Existing threat register entries T-04-04, T-04-05, T-04-06 confirmed mitigated as designed.

## Self-Check: PASSED

- dashboard/vite.config.js: modified, contains `base: '/sterity/'`
- dashboard/src/App.svelte: modified, contains 9 `import.meta.env.BASE_URL` occurrences
- Commit 90a7a7e: exists (feat(04-02): configure Vite base path and fix 9 safeFetch call sites)
- dashboard/dist/index.html: built and verified
