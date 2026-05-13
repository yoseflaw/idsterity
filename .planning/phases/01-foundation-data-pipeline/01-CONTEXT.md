# Phase 1: Foundation & Data Pipeline - Context

**Gathered:** 2026-05-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 1 delivers the invisible infrastructure that all story sections (S1–S9) depend on:
- Replace POC component files with a clean minimal scaffold (hero + Step container pattern)
- Promote CSS design tokens from UI-SPEC into `:root` custom properties
- Self-host fonts via `@fontsource/*` packages (replacing Google Fonts CDN)
- Wire scrollama npm package as the scroll-step driver
- Set up `src/i18n.js` bilingual module (id/en) wired to App.svelte $state
- Produce three data scripts: `constants.json` (APBN/GDP figures), extended `prepare-data.py` (S4 aggregates), and `word-cloud.py` (word+frequency JSON files)
- Regenerate `lembaga-totals.json` and `summary-stats.json`

Phase 1 does NOT add story content. S1–S9 narrative sections are built in Phases 2–3.

</domain>

<decisions>
## Implementation Decisions

### POC Disposal
- **D-01:** Delete `dashboard/src/App.svelte` and `dashboard/src/BarChart.svelte` entirely — start fresh component files. `main.js`, `vite.config.js`, and `index.html` are untouched.
- **D-02:** Regenerate `public/data/lembaga-totals.json` and `public/data/summary-stats.json` by re-running `prepare-data.py` as part of Phase 1 execution. Do not keep the existing committed files.
- **D-03:** New `App.svelte` is a minimal scaffold only — hero section + a generic `<Step>` container pattern. Phase 2 fills in S1–S9 content section by section; no placeholder stubs needed in Phase 1.

### Scroll Library
- **D-04:** Use the `scrollama` npm package for step-driven scroll events. Add as a new dependency. Do not formalize the existing custom IntersectionObserver.
- **D-05:** Step activation offset: **50% viewport**. A step becomes active when its top edge crosses the vertical midpoint of the viewport. Applied globally — no per-step override.

### Word Cloud Data Pipeline
- **D-06:** `word-cloud.py` outputs **word + frequency only** (no pre-computed x/y/rotation). The browser runs `d3-cloud` at render time in Phase 3, keeping layout responsive to screen size.
- **D-07:** Four flat JSON files written to `dashboard/public/data/`:
  - `wordcloud-all.json`
  - `wordcloud-central.json`
  - `wordcloud-district.json`
  - `wordcloud-lembaga.json`
- **D-08:** `wordcloud-lembaga.json` is a single keyed object: `{ "<lembaga_name>": [{ "word": "...", "count": N }, ...] }`. Phase 3 does one fetch and selects by key at runtime. No per-institution files.

### Bilingual Copy Architecture
- **D-09:** `dashboard/src/i18n.js` is the single source of all bilingual strings. Structure: `export const t = { id: { key: 'string', ... }, en: { key: 'string', ... } }`. Phase 2 adds keys as narrative copy is written.
- **D-10:** Active language state: `let lang = $state('id')` declared in `App.svelte`, passed as a prop to child components (prop-drilling, not context API). Consistent with how `activeStep` is handled in the POC.
- **D-11:** Default language: **Indonesian (`id`)** on first load. No `navigator.language` detection.

### Claude's Discretion
- Internal structure of `constants.json` (key naming, nesting) — Claude chooses the clearest schema for APBN/GDP series data.
- How scrollama is initialized and torn down in Svelte's lifecycle (`$effect` vs `onMount`) — Claude follows Svelte 5 best practices.
- `word-cloud.py`'s domain stopword list — Claude uses judgment on procurement boilerplate terms to filter (pengadaan, jasa, barang, pekerjaan, dll.).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Scope & Requirements
- `.planning/ROADMAP.md` §Phase 1 — Deliverables, canonical refs, and phase boundary
- `.planning/REQUIREMENTS.md` §Foundation (FOUND-01 – FOUND-06) — Foundation requirements including font self-hosting (FOUND-06)
- `.planning/REQUIREMENTS.md` §Data Pipeline (DATA-01 – DATA-04) — Data script requirements (constants.json, prepare-data.py S4 aggregates, word-cloud.py)

### UI Design Contract
- `.planning/phases/01-foundation-data-pipeline/01-UI-SPEC.md` — **Read this in full.** Locks: design token names and values, typography scale, color palette, spacing scale, interaction contracts (language toggle, scrollama skeleton, step pip indicator, scroll cue, loading pulse), responsive breakpoints, and font self-hosting migration instructions (FOUND-06).

### Existing Source Files (read before writing new versions)
- `dashboard/src/App.svelte` — POC to be deleted; read once to understand scroll mechanism before discarding
- `dashboard/src/main.js` — Mount point; do NOT modify
- `dashboard/index.html` — Google Fonts CDN links here must be removed and replaced with `@fontsource` imports in `main.js`
- `dashboard/scripts/prepare-data.py` — Extend (don't rewrite) for S4 aggregates
- `dashboard/vite.config.js` — Do NOT modify

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `main.js`: Svelte `mount()` call — stays unchanged; Phase 1 only changes what gets mounted
- `vite.config.js`: Svelte plugin only, no custom aliases — stable, no changes needed
- `prepare-data.py`: stdlib-only aggregation script — extend with S4 aggregate logic; pattern to follow for `word-cloud.py`

### Established Patterns
- CSS custom properties on `:global(:root)` — already used in POC App.svelte for theming; Phase 1 formalizes and expands this into the full token system from UI-SPEC
- `$state` / `$derived` / `$props` runes — Svelte 5 reactivity used throughout; keep this pattern
- Pre-aggregated static JSON in `dashboard/public/data/` — fetch-once pattern at mount; new word cloud and constants files follow this same pattern
- `{#each}` with key expression — keep for list rendering

### Integration Points
- New `App.svelte` connects to scrollama: initialize instance in `$effect`, point at `[data-step]` elements, update `activeStep` $state on enter events
- `i18n.js` connects to `App.svelte`: `lang` prop flows down to any component that renders copy
- `word-cloud.py` outputs feed Phase 3's word cloud component via `fetch('/data/wordcloud-{filter}.json')`
- `constants.json` feeds Phase 2's hero stat section and S2/S3 comparative figures

</code_context>

<specifics>
## Specific Ideas

- Visual reference: [pudding.cool/2017/03/punk/](https://pudding.cool/2017/03/punk/) — bold type, step-driven reveals, minimal chrome. This is the established aesthetic anchor for all phases.
- Font self-hosting: use `@fontsource/libre-baskerville`, `@fontsource/source-serif-4`, `@fontsource/jetbrains-mono` npm packages. Import in `main.js`, remove Google Fonts `<link>` tags from `index.html`.
- nlp-id: Indonesian lemmatizer used in `word-cloud.py` for proper tokenization of `paket` names. Already decided at project level.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 1-foundation-data-pipeline*
*Context gathered: 2026-05-13*
