# Requirements — idsterity

**Core Value:** Every visitor who reaches the end should feel the irony viscerally and want to share it.

## v1 Requirements

### Foundation (FOUND)

- [ ] **FOUND-01**: User can load the site in under 3 seconds on a mobile connection (lightweight static build, self-hosted fonts)
- [ ] **FOUND-02**: Scroll-step triggering via Scrollama 3.2 — each scroll step fires exactly once on enter, with no double-fire on page load or HMR
- [ ] **FOUND-03**: User can toggle between Indonesian and English via a fixed top-right button — scroll position is preserved, Indonesian is default
- [ ] **FOUND-04**: Visual design follows Pudding.cool-style tokens — bold typography, step-driven reveals, minimal chrome
- [ ] **FOUND-05**: Shared links resolve correctly on Apache shared hosting (`.htaccess` SPA fallback — no 404 on direct URL)
- [ ] **FOUND-06**: Fonts are self-hosted via `@fontsource/*` — no Google CDN dependency (Indonesian proxy resilience)

### Data Pipeline (DATA)

- [ ] **DATA-01**: APBN Q1 2026 deficit figure (Rp T) and historical series (Oct 2024, Full-year 2025) researched and hardcoded in `constants.json`
- [ ] **DATA-02**: BPS GDP government consumption component (konsumsi pemerintah) for Q1 2025–Q1 2026 researched and hardcoded in `constants.json`
- [ ] **DATA-03**: `prepare-data.py` extended to produce S4 aggregates (total pagu by AI label, record counts)
- [ ] **DATA-04**: `word-cloud.py` script runs offline: tokenizes high-inappropriate `paket` names using `nlp-id` for Indonesian lemmatization, applies domain stopwords (procurement boilerplate: pengadaan, jasa, barang, pekerjaan, etc.), pre-computes d3-cloud positions, outputs per-filter JSON files (all / central / district / per-lembaga), capped at top 20 words per filter

### Sharing (SHARE)

- [ ] **SHARE-01**: LinkedIn share card renders correctly — `og:title`, `og:description`, `og:image` (absolute URL), `og:type`, `og:url` all present
- [ ] **SHARE-02**: OG image is a 1200×627 JPG under 200KB — generated at build time, shows the hook number in bold on high-contrast background

### Story Sections (SEC)

- [ ] **SEC-01 (S1 — Hook)**: User sees the opening line *"Follow the… Where is the money?"* followed by 3–5 curated quotes from Indonesian officials promising fiscal cuts, each with a source link — both languages
- [ ] **SEC-02 (S2 — APBN Deficit)**: User sees a line/bar chart of APBN deficit trend (Oct 2024, Full-year 2025, Q1 2026) with narrative framing the irony — both languages
- [ ] **SEC-03 (S3 — GDP Growth)**: User sees a chart of government consumption contribution by quarter (Q1 2025–Q1 2026) with narrative — both languages
- [ ] **SEC-04 (S4 — Dataset Overview)**: User sees total procurement spending, breakdown by AI label (low/med/high), and a safe harbour disclaimer about AI labeling — both languages
- [ ] **SEC-05 (S5 — Who Spent Most)**: User sees top institutions by pagu in a scroll-driven stacked bar chart segmented by low/med/high appropriateness label — both languages
- [ ] **SEC-06 (S6 — Absurd Only)**: User sees the same institutions re-ranked with only high-inappropriate spending — the story sharpens here — both languages
- [ ] **SEC-07 (S7 — Anchor Numbers)**: User sees the total "absurd" (high) spending expressed one anchor at a time via count-up animation on scroll: kopi jago cups, seblak portions, elementary schools, puskesmas — both languages, cited unit prices
- [ ] **SEC-08 (S8 — Word Cloud)**: User sees a pre-built word cloud of paket names from the high-inappropriate subset, with two filters: (a) Central Gov vs. District Gov, (b) institution name — top 20 words — both languages
- [ ] **SEC-09 (S9 — Explore Table)**: User can click a word in the cloud to see a filtered table of matching records (lembaga, satker, pagu, paket, inappropriateReason) — both languages

### Mobile (MOB)

- [ ] **MOB-01**: All 9 sections are readable and functional on screens 375px and wider (stacked layout below 768px)
- [ ] **MOB-02**: Word cloud degrades to a scrollable tag-chip list on screens below 480px
- [ ] **MOB-03**: All interactive elements (language toggle, word cloud words, explore table rows) have minimum 44×44px tap targets

### Deploy (DEPL)

- [ ] **DEPL-01**: `npm run build` produces a self-contained `dist/` directory with no server-side runtime required
- [ ] **DEPL-02**: All data fetches use `import.meta.env.BASE_URL` (not hardcoded `/data/`) — deploy path configurable in `vite.config.js`
- [ ] **DEPL-03**: `dist/` is excluded from git (`.gitignore`) — build output is not committed

## v2 Requirements (Deferred)

- Deep links to individual sections via URL hash
- Virtual scroll for large explore table datasets (>1000 rows)
- Copy-to-clipboard LinkedIn caption at final section
- Analytics event tracking (section reach, language toggle usage)
- Progressive image loading for OG image placeholder

## Out of Scope

- Backend or API server — fully static after build
- User accounts or authentication — none
- Real-time data updates — all data baked at build time
- SvelteKit — overkill for a single-page static story
- Paraglide JS — one-page-reload on locale switch is unacceptable mid-scrollytelling
- d3-cloud in the browser — pre-computed offline only (performance)
- Sastrawi stemmer on procurement text — will mangle abbreviations and domain vocabulary

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 1 | Pending |
| FOUND-02 | Phase 1 | Pending |
| FOUND-03 | Phase 1 | Pending |
| FOUND-04 | Phase 1 | Pending |
| FOUND-05 | Phase 4 | Pending |
| FOUND-06 | Phase 1 | Pending |
| DATA-01 | Phase 1 | Pending |
| DATA-02 | Phase 1 | Pending |
| DATA-03 | Phase 1 | Pending |
| DATA-04 | Phase 1 | Pending |
| SHARE-01 | Phase 4 | Pending |
| SHARE-02 | Phase 4 | Pending |
| SEC-01 | Phase 2 | Pending |
| SEC-02 | Phase 2 | Pending |
| SEC-03 | Phase 2 | Pending |
| SEC-04 | Phase 2 | Pending |
| SEC-05 | Phase 2 | Pending |
| SEC-06 | Phase 2 | Pending |
| SEC-07 | Phase 3 | Pending |
| SEC-08 | Phase 3 | Pending |
| SEC-09 | Phase 3 | Pending |
| MOB-01 | Phase 2 | Pending |
| MOB-02 | Phase 3 | Pending |
| MOB-03 | Phase 2 | Pending |
| DEPL-01 | Phase 4 | Pending |
| DEPL-02 | Phase 4 | Pending |
| DEPL-03 | Phase 4 | Pending |
