# Walking Skeleton — idsterity

**Phase:** 1
**Generated:** 2026-05-13

## Capability Proven End-to-End

A visitor loads the dev server, sees a hero with a real budget figure fetched from a generated JSON file, toggles between Indonesian and English (scroll position preserved), and scrolls through stub step containers while the pip indicator advances exactly once per step via Scrollama 3.2.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | Svelte 5.55 + Vite 5.4 (no SvelteKit) | Existing POC; single-page static story; SvelteKit is explicit "out of scope" per REQUIREMENTS.md |
| Reactivity | Svelte 5 runes (`$state`, `$derived`, `$props`) | Already established pattern in POC; no stores |
| Data layer | Pre-baked static JSON in `dashboard/public/data/`, fetched via native `fetch()` at mount | Static-only deploy; no runtime server (CLAUDE.md "fully static after build") |
| Data prep | Python 3.11+ stdlib + `nlp-id` (word-cloud only) via PEP 723 + `uv run` | Existing pattern in `prepare-data.py`; no requirements.txt |
| i18n | Hand-rolled `src/i18n.js` exporting `t = { id: {...}, en: {...} }` + `lang` $state on `App.svelte` (prop-drilling per D-10) | Paraglide JS is out of scope (one-page reload unacceptable mid-scrollytelling); URL-based locale routing breaks shareable link constraint |
| Default language | Indonesian (`id`) on first load (D-11) | No `navigator.language` detection — Indonesian audience-first |
| Scroll driver | `scrollama` npm package, `offset: 0.5`, `[data-step]` selector (D-04, D-05) | Replaces custom IntersectionObserver; well-maintained Pudding-derived library |
| Fonts | Self-hosted via `@fontsource/libre-baskerville`, `@fontsource/source-serif-4`, `@fontsource/jetbrains-mono` imported in `main.js` (FOUND-06) | Indonesian proxy resilience — no Google CDN dependency |
| Design tokens | CSS custom properties on `:global(:root)` in `App.svelte` (or extracted to `tokens.css` later) | Already established pattern in POC; expanded with spacing scale + `--clean` token from UI-SPEC |
| Deployment target | Static `dist/` from `vite build`, deployable to Apache shared hosting (Phase 4 adds `.htaccess`) | Per project SPEC; no Node runtime |
| Dev run command | `cd dashboard && npm run dev` | Vite dev server on default port; full stack exercised locally |
| Directory layout | `dashboard/src/` (Svelte components + i18n.js + main.js), `dashboard/scripts/` (Python ETL), `dashboard/public/data/` (generated JSON), `.planning/` (planning docs at repo root) | Inherits existing POC layout; no restructure |

## Stack Touched in Phase 1

- [x] Project scaffold (Svelte 5 + Vite 5 already initialized; Phase 1 adds dependencies and replaces POC components)
- [x] Routing — single-page; section-level navigation via scroll position (no router needed)
- [x] Database — `inaproc-ds/outputs/` JSONL shards (read) + `dashboard/public/data/*.json` (written by Python scripts, read by Svelte fetch)
- [x] UI — hero stat (data-driven from `summary-stats.json`), language toggle (interactive), Scrollama-driven step pips (interactive)
- [x] Deployment — `npm run dev` exercises the full stack locally; `npm run build` produces deployable `dist/`

## Out of Scope (Deferred to Later Slices)

- S1–S6 narrative copy and charts (Phase 2)
- S7 anchor count-up animations, S8 word cloud rendering, S9 explore table (Phase 3)
- OG image, `.htaccess` SPA fallback, Lighthouse pass, deploy pipeline (Phase 4)
- localStorage persistence of `lang` preference (UI-SPEC notes it but Phase 1 does not implement — session-only)
- `navigator.language` detection (D-11 — Indonesian is hard default)
- Error handling for fetch failures (Phase 4 polish item per UI-SPEC)
- `BarChart.svelte` — POC chart is deleted in Plan 01 and not replaced (Phase 2 S5/S6 will introduce the chart)
- Deep links via URL hash (v2 deferred per STATE.md)
- Word cloud d3-cloud layout (browser-side render in Phase 3 — Phase 1 only produces word+frequency JSON)

## Subsequent Slice Plan

Each later phase adds vertical slices on top of this skeleton without altering its architectural decisions:

- **Phase 2: Core Narrative (S1–S6)** — Hook, APBN deficit chart, GDP chart, dataset overview, top-institutions stacked bar, absurd-only re-rank. Reuses i18n.js (adds keys), scrollama wiring (adds steps), tokens (no changes), constants.json (consumed by S2/S3).
- **Phase 3: Interactive Back Half (S7–S9)** — Anchor animations, word cloud (consumes Phase 1 `wordcloud-*.json`), explore table.
- **Phase 4: Polish, Share & Deploy** — OG image, `.htaccess`, Lighthouse, deploy pipeline, `import.meta.env.BASE_URL` for data fetches.
