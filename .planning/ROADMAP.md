# Roadmap: idsterity

## Overview

Four phases take the project from blank repo to a shareable scrollytelling story. Phase 1 lays the invisible infrastructure — data pipeline and frontend foundation — that every section depends on. Phase 2 builds the emotionally critical core narrative (S1 Hook through S6 Institutions), the sections most likely to make a reader stop scrolling and share. Phase 3 completes the interactive back half of the story (S7 Anchors, S8 Word Cloud, S9 Explore). Phase 4 makes the result deployable and LinkedIn-ready, then ships.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Data Pipeline** - Project scaffold, i18n store, design tokens, Scrollama, and all offline data scripts (completed 2026-05-13)
- [ ] **Phase 2: Core Narrative (S1–S6)** - Hook through Institutions — the emotionally critical sections that drive shares
- [ ] **Phase 3: Interactive Back Half (S7–S9)** - Anchor animations, word cloud, and explore table complete the story
- [ ] **Phase 4: Polish, Share & Deploy** - OG image, `.htaccess`, Lighthouse pass, and deploy pipeline

## Phase Details

### Phase 1: Foundation & Data Pipeline
**Goal**: Every dependency is in place — i18n store, design tokens, Scrollama scroll-step wiring, self-hosted fonts, and all offline data artifacts — so section work in Phase 2 has zero blockers.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-06, DATA-01, DATA-02, DATA-03, DATA-04
**Success Criteria** (what must be TRUE):
  1. Running `npm run dev` renders a skeleton Scrollama page where each scroll step fires exactly once with no double-fire on load or HMR
  2. A language toggle button (top-right, fixed) switches all copy between Indonesian and English without changing scroll position
  3. Visual design tokens (bold type scale, spacing, color palette) are applied site-wide via CSS custom properties matching Pudding.cool-style
  4. Self-hosted fonts load with no external CDN requests (verified in Network tab)
  5. `constants.json` contains APBN Q1 2026 deficit figures and BPS government consumption series; `prepare-data.py` and `word-cloud.py` both run to completion and produce their output JSON files
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — Skeleton scaffold (delete POC, @fontsource self-host, design tokens, i18n.js, hero with fetched data)
- [x] 01-02-PLAN.md — Bilingual toggle + Scrollama step driver (fire-once-per-step, scroll-preserving toggle)
- [x] 01-03-PLAN.md — Data pipeline (constants.json, S4 aggregates in prepare-data.py, word-cloud.py with 4 outputs)
**UI hint**: yes

### Phase 2: Core Narrative (S1–S6)
**Goal**: A visitor can scroll through the full opening arc — quotes hook, deficit chart, GDP chart, dataset overview, top institutions stacked bar, absurd-only re-rank — in both languages on any screen 375px and wider.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: SEC-01, SEC-02, SEC-03, SEC-04, SEC-05, SEC-06, MOB-01, MOB-02, MOB-03
**Success Criteria** (what must be TRUE):
  1. S1 shows the opening line and 3–5 official quotes (with source links) in both languages on first scroll
  2. S2 and S3 render charts with the hardcoded APBN deficit and BPS GDP consumption data, with bilingual narrative copy framing the irony
  3. S4 shows total procurement spending, a three-way AI-label breakdown (low/med/high), and a safe harbour disclaimer — both languages
  4. S5 renders a scroll-driven stacked bar chart of top institutions by pagu segmented by appropriateness label — both languages
  5. S6 re-renders institutions ranked by high-inappropriate spending only, sharpening the narrative — both languages
  6. All six sections are readable and functional on a 375px-wide screen with stacked layout; all interactive elements meet 44×44px tap targets
**Plans**: 5 plans

Plans:
- [x] 02-01-PLAN.md — Foundation fixes + i18n keys (S1–S6) + multi-scroller App.svelte refactor + S1 Hook vertical slice (CR-01, CR-02, WR-05)
- [x] 02-02-PLAN.md — Data pipeline extension (CR-03 fix + per-label pagu in lembaga-totals.json)
- [x] 02-03-PLAN.md — S2 + S3 isometric coin-stack charts (DeficitChart, GDPChart) wired into App.svelte
- [ ] 02-04-PLAN.md — S4 Dataset Overview block (full-width stats + AI-label breakdown + safe-harbour disclaimer)
- [ ] 02-05-PLAN.md — S5 + S6 InstitutionsChart with D3 animated re-sort
**UI hint**: yes

### Phase 3: Interactive Back Half (S7–S9)
**Goal**: The story concludes with visceral anchor animations, a filterable word cloud, and an explore table — completing the emotional arc from irony to discovery.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: SEC-07, SEC-08, SEC-09
**Success Criteria** (what must be TRUE):
  1. S7 animates the total "absurd" spending as count-up reveals, one anchor at a time (kopi jago cups, seblak portions, elementary schools, puskesmas) — both languages, with cited unit prices
  2. S8 renders the pre-built word cloud (top 20 words) with two working filters: Central Gov vs. District Gov, and institution-name picker — both languages; on screens below 480px the cloud degrades to a scrollable tag-chip list
  3. S9 shows a filtered record table (lembaga, satker, pagu, paket, inappropriateReason) when the user clicks any word in the cloud — both languages
**Plans**: TBD
**UI hint**: yes

### Phase 4: Polish, Share & Deploy
**Goal**: The finished site passes a Lighthouse check, has a correct LinkedIn share card, and builds to a self-contained `dist/` that deploys cleanly to Apache shared hosting.
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: SHARE-01, SHARE-02, DEPL-01, DEPL-02, DEPL-03, FOUND-05
**Success Criteria** (what must be TRUE):
  1. LinkedIn post debugger shows `og:title`, `og:description`, `og:image` (absolute URL), `og:type`, and `og:url` all populated with a 1200×627 JPG under 200KB
  2. `npm run build` produces a self-contained `dist/` with no server-side runtime required; `dist/` is absent from git
  3. Deploying `dist/` to Apache shared hosting and navigating to a direct URL (not root) returns the page, not a 404 — `.htaccess` SPA fallback is in place
  4. All data fetches use `import.meta.env.BASE_URL` (not hardcoded `/data/`) and the deploy path is configurable in `vite.config.js`
  5. The site loads in under 3 seconds on a simulated mobile connection (Lighthouse Performance score acceptable)
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Data Pipeline | 3/3 | Complete   | 2026-05-13 |
| 2. Core Narrative (S1–S6) | 0/5 | Not started | - |
| 3. Interactive Back Half (S7–S9) | 0/TBD | Not started | - |
| 4. Polish, Share & Deploy | 0/TBD | Not started | - |
