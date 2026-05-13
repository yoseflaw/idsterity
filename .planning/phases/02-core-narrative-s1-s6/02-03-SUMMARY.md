---
phase: 02-core-narrative-s1-s6
plan: 03
subsystem: frontend-charts
tags: [svelte, svg, isometric, scrollytelling, chart, deficit, gdp]
dependency_graph:
  requires: [02-01]
  provides: [DeficitChart.svelte, GDPChart.svelte, S2-section, S3-section]
  affects: [App.svelte, scrollama-s2-scroller, scrollama-s3-scroller]
tech_stack:
  added: []
  patterns:
    - isometric coin-stack SVG (custom, no D3)
    - window.matchMedia for responsive SVG dimensions
    - $derived activeKeys array for multi-stack highlighting
    - source citation anchor with rel="noopener noreferrer" + 44px tap target
key_files:
  created:
    - dashboard/src/DeficitChart.svelte
    - dashboard/src/GDPChart.svelte
  modified:
    - dashboard/src/App.svelte
decisions:
  - "Used window.matchMedia for mobile stack-width switching — keeps SVG attributes reactive without CSS media queries inside SVG"
  - "GDPChart uses {#each Array(p.layers) as _, layer} pattern for coin layers — matches DeficitChart exactly for consistency"
  - "S2 source links all point to apbn.deficit.fy2025 URL (all three steps reference same APBN KiTa source family, consistent with plan spec)"
  - "S3 source links all point to gdp.konsumsi_pemerintah.q2_2025 URL per plan spec"
  - "Pit label collision avoidance: negative pit value label at baseline+height+12, period label pushed to baseline+height+28"
metrics:
  duration: 3m
  completed: "2026-05-13"
  tasks_completed: 3
  tasks_total: 4
  files_created: 2
  files_modified: 1
---

# Phase 02 Plan 03: DeficitChart + GDPChart — S2 & S3 Isometric Coin Stacks

**One-liner:** Isometric coin-stack SVG chart components for APBN deficit (3 stacks) and GDP government consumption (5 quarters, Q1 2025 pit below baseline in red) wired into App.svelte as dedicated S2/S3 scrollytelling sections.

## What Was Built

### DeficitChart.svelte

Isometric coin-stack chart for the APBN deficit S2 section. Three data points: Oct 2024 (Rp 309 T), FY 2025 (Rp 508 T), Q1 2026 (Rp 104 T). All negative IDR integers treated as absolute values for stack height. Stack height: 1 trillion IDR = 2px, capped at 200px desktop / 140px mobile. Coin geometry: top-face ellipse `rgba(201,168,76,0.85)`, edge-face rects `rgba(201,168,76,0.45)`, 8px per layer. Active stack at full opacity + `scaleY(1.02)`; inactive at 0.4 opacity. `window.matchMedia('(max-width: 480px)')` drives 44px vs 64px stack width reactively. Null data guard renders `memuat...` / `loading...` SVG skeleton.

### GDPChart.svelte

Isometric coin-stack chart for the GDP consumption S3 section. Five quarters Q1 2025 through Q1 2026. Q1 2025 (-3.24%) rendered as an inverted pit below the baseline: red coin layers (`rgba(196,66,66,0.6)`) descending from the baseline, value label in `var(--red)`, period label pushed down 28px to avoid collision. Positive quarters use gold rgba coin pattern matching DeficitChart. Scale: 1% = 10px, capped at 200px/140px. Step 2 highlights Q3 and Q4 simultaneously via `$derived activeKeys` array. Period labels switch between Indonesian (TW I/II/III/IV) and English (Q1/Q2/Q3/Q4) via `lang` prop.

### App.svelte Changes

- Added `import DeficitChart from './DeficitChart.svelte'` and `import GDPChart from './GDPChart.svelte'` at top of script block
- Added `<section class="scrolly" data-section="s2" id="s2">` with 3 step cards and a 3-pip indicator
- Added `<section class="scrolly" data-section="s3" id="s3">` with 4 step cards and a 4-pip indicator
- Each step card includes a `.source-link` anchor with `target="_blank" rel="noopener noreferrer"`
- Added `.source-link` CSS rule: JetBrains Mono 0.7rem, muted color, underline, `min-height: 44px` tap target (MOB-03), hover transition to `--text`

## Source URLs Used

| Section | Field | URL |
|---------|-------|-----|
| S2 (all steps) | apbn.deficit.fy2025 | https://www.kemenkeu.go.id/media/apbn-kita-desember-2025 |
| S3 (all steps) | gdp.konsumsi_pemerintah.q2_2025 | https://www.bps.go.id/pressrelease/2025/08/05/pertumbuhan-ekonomi-indonesia-triwulan-ii-2025.html |

## Commits

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Create DeficitChart.svelte | 5f4dee8 |
| 2 | Create GDPChart.svelte | 8395b4b |
| 3 | Wire S2/S3 into App.svelte | d84f01d |

## Deviations from Plan

None — plan executed exactly as written. The isometric coin-stack pattern, responsive stack widths, negative-value pit rendering, activeKeys step mapping, and source citation links all match the UI-SPEC and plan action specs.

## Checkpoint Status

**Task 4 (human verification) was reached.** Execution stopped at the `checkpoint:human-verify` gate. The three automation tasks (1, 2, 3) are committed. Human must verify the visual output on desktop and 375px viewport before this plan is marked complete.

## Known Stubs

None — all data props are wired to `constants.apbn.deficit` and `constants.gdp.konsumsi_pemerintah` from the fetched JSON. Null guard renders skeleton, not empty content.

## Threat Flags

No new threat surface introduced beyond the plan's registered mitigations:
- T-02.03-01 (Tampering): All SVG values are numeric from static JSON — no user strings interpolated
- T-02.03-02 (Information disclosure): All citation anchors include `rel="noopener noreferrer"` — verified in App.svelte S2 and S3 source links
- T-02.03-03 (DoS): Coin layer count capped via `maxHeight` — Q2 2025 at 10.93% = ~109px = ~14 layers per stack, well within budget

## Self-Check

Files created/exist check:
- dashboard/src/DeficitChart.svelte — FOUND
- dashboard/src/GDPChart.svelte — FOUND
- dashboard/src/App.svelte (modified) — FOUND

Commits exist check:
- 5f4dee8 — FOUND (feat(02-03): create DeficitChart.svelte)
- 8395b4b — FOUND (feat(02-03): create GDPChart.svelte)
- d84f01d — FOUND (feat(02-03): wire DeficitChart + GDPChart into App.svelte)

## Self-Check: PASSED
