# Phase 3: Interactive Back Half (S7–S9) - Context

**Gathered:** 2026-05-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 3 completes the emotional arc of the narrative: S7 delivers visceral anchor count-up animations translating the "high-inappropriate" budget into relatable everyday quantities; S8 presents a filterable word cloud (sized spans, flex-wrap, bilingual) backed by pre-built JSON; S9 surfaces matching procurement records as an overlay within S8's sticky panel when the user clicks a word. No new backend or scroll library is required — all data is pre-baked by an extended `prepare-data.py`.

</domain>

<decisions>
## Implementation Decisions

### S7 — Anchor Count-Up Animations

- **D-01:** The base IDR figure for all 4 anchor calculations is `labelPagu.high` from `dashboard/public/data/summary-stats.json` — the same field S4 already displays. No pipeline change needed for the total.
- **D-02:** Unit prices for the 4 anchors (kopi jago cup, seblak portion, SD elementary school construction cost, puskesmas construction cost) are **not hardcoded** — researcher finds credible Indonesian public sources (Kemenkes, BPKP, BPS, news) and cites them. Each price goes into `constants.json` under a new `anchors` key with a `sources` entry. Researcher decides the exact IDR values.
- **D-03:** S7 uses **2 scroll steps** (not 4):
  - **Step 0 (absurd):** Kopi jago cup count-up + seblak portion count-up animate simultaneously. Playful, disbelief-inducing.
  - **Step 1 (sobering):** A bilingual transition label appears first ("Atau, lebih seriusnya..." / "Or, on a more serious note..."), then SD school count-up + puskesmas count-up animate. Emotional pivot from absurdity to gravity.
- **D-04:** The "on a serious note" label is a **literal visible element** in the sticky panel — analogous to `s6TransitionLabel` in Phase 2. It appears when Step 1 fires (a new `$state` transition, same `aria-live="polite"` pattern).

### S8 — Word Cloud Rendering & Filters

- **D-05:** Word cloud rendered as sized `<button>` elements (for click + accessibility) inside a `flex-wrap` container. `font-size` scales proportionally with `count` (min/max clamped). Pure CSS — no new library added. Consistent with existing design token system.
- **D-06:** On screens ≥ 480px the cloud is the flex-wrap button layout. On screens < 480px (MOB-02), the cloud degrades to a **scrollable tag-chip list** — same `<button>` elements but uniform size and a horizontal scroll or vertical stack. Both desktop and mobile layouts support all filters.
- **D-07:** Two filters, **mutually exclusive**:
  - **(a) Central / District Gov toggle** — switches between `wordcloud-central.json` and `wordcloud-district.json`; "All" resets to `wordcloud-all.json`.
  - **(b) Institution name picker** — searchable text input that filters a dropdown of the 620 keys in `wordcloud-lembaga.json` as the user types. Selecting an institution loads that institution's word array.
  - Activating either filter clears the other. A reset/clear button returns to "all" state.
- **D-08:** Institution search input: native JS filter on the `wordcloud-lembaga.json` keys array (no library). Dropdown of filtered matches appears below the input. 44×44px tap targets required per MOB-03.

### S9 — Record Table (Inline Overlay in S8)

- **D-09:** S9 is **not a separate scrolly section**. The record table appears as an overlay within S8's sticky panel: clicking a word hides the word cloud and shows the table in its place. Closing (× button or click/tap outside the table area) returns the cloud. This is a reactive toggle on a `selectedWord` `$state` variable.
- **D-10:** Record data is **pre-baked per-word** by `prepare-data.py`. Files follow the naming pattern:
  - `dashboard/public/data/word-{word}-all.json`
  - `dashboard/public/data/word-{word}-central.json`
  - `dashboard/public/data/word-{word}-district.json`
  - Total: 20 words × 3 filter variants = **60 files**. Each file is the top 20 records by `pagu` for that word + filter combination.
- **D-11:** Each record in the table contains: `lembaga`, `satker`, `pagu`, `paket`, `inappropriateReason` — the 5 columns from SEC-09. Both bilingual column labels and cell content (where applicable) follow the `t[lang]` pattern.
- **D-12:** When an institution filter is active in S8, S9 **falls back to the `-all` file** (`word-{word}-all.json`) with a small note in the table header: "Showing all institutions — institution filter applies to cloud only" / "Menampilkan semua lembaga — filter lembaga hanya berlaku pada kata kunci." Institution-level pre-baking (620 × 20 = 12,400 files) is deferred to v2.
- **D-13:** Table close affordances: explicit **× close button** in the table header, plus clicking/tapping anywhere outside the table overlay. Clicking the already-selected word a second time also toggles it off.

### Claude's Discretion

- Count-up animation duration and easing — Claude decides. Should feel weighty, not instant. Suggested: ~1.5–2s with ease-out. Step 0 count-ups can start simultaneously; Step 1 anchors stagger slightly after the transition label appears.
- Word cloud font-size min/max clamping — Claude decides based on the actual count range in wordcloud-all.json (range: ~855–6144). Must remain readable at all breakpoints.
- Whether S7 needs its own dedicated Svelte component or can be authored inline in `App.svelte` — Claude decides based on complexity. Anchor animations are likely simple enough to be inline.
- Table loading state while the per-word JSON is fetching — Claude decides (spinner, skeleton rows, or just blank until ready).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Scope & Requirements
- `.planning/ROADMAP.md` §Phase 3 — Goal, success criteria, required requirements (SEC-07, SEC-08, SEC-09, MOB-02, MOB-03)
- `.planning/REQUIREMENTS.md` §SEC-07 through SEC-09 — Story section requirements
- `.planning/REQUIREMENTS.md` §MOB-02 — Word cloud mobile degradation (480px)
- `.planning/REQUIREMENTS.md` §MOB-03 — 44×44px tap targets for interactive elements

### UI Design Contract
- `.planning/phases/01-foundation-data-pipeline/01-UI-SPEC.md` — **Read in full.** Locks design token names and values, typography scale, color palette, spacing scale, interaction contracts, responsive breakpoints.

### Prior Phase Context
- `.planning/phases/02-core-narrative-s1-s6/02-CONTEXT.md` — Phase 2 decisions (D-01 through D-10): section architecture, scroll patterns, chart components, mobile sticky behavior.
- `.planning/phases/01-foundation-data-pipeline/01-CONTEXT.md` — Phase 1 decisions (D-01 through D-11): bilingual architecture, scroll library choice, word cloud data pipeline.

### Existing Source Files (read before writing new or modified versions)
- `dashboard/src/App.svelte` — Full page layout, scrollama setup (`makeScroller` pattern), `$state` variables, fetch logic, CSS tokens. S7/S8/S9 sections are added here.
- `dashboard/src/i18n.js` — All bilingual copy. New S7/S8/S9 keys added here.
- `dashboard/scripts/prepare-data.py` — Extended to output the 60 per-word record files and to add anchor unit price entries (or prices go directly into `constants.json` if researcher adds them there).
- `dashboard/public/data/constants.json` — Add `anchors` key with unit prices and source URLs.
- `dashboard/public/data/summary-stats.json` — `labelPagu.high` is the base value for S7 anchor calculations.
- `dashboard/public/data/wordcloud-all.json` — 20 words used for S8 default view.
- `dashboard/public/data/wordcloud-central.json` — 20 words for Central Gov filter.
- `dashboard/public/data/wordcloud-district.json` — 20 words for District Gov filter.
- `dashboard/public/data/wordcloud-lembaga.json` — 620 institutions, each with their own top-word array. Used for institution picker.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `makeScroller(sectionAttr, onEnter)` in `App.svelte` — Add `makeScroller('s7', i => { activeStepS7 = i })` and `makeScroller('s8', i => { activeStepS8 = i })` following the exact same pattern. S8 may not need scrollama steps if its interaction is click-driven rather than scroll-driven.
- `safeFetch(url)` in `App.svelte` — Reuse for fetching per-word record files on demand (`/data/word-${word}-${filter}.json`).
- `t[lang]` i18n pattern — All new S7/S8/S9 copy follows the same `id`/`en` key structure in `i18n.js`.
- CSS tokens (`--gold`, `--muted`, `--bg-card`, `--border`, etc.) — All new components use these. No new colors introduced without a token.

### Established Patterns
- `data-step="N"` + `[data-section="sN"]` on HTML → scrollama fires `onStepEnter({ index })` → updates `$state`. S7 follows this with 2 steps (`data-step="0"`, `data-step="1"`).
- Sticky panel: `position: sticky; top: 0; height: 100dvh` (desktop). Mobile: `50dvh` for chart/interactive sections.
- Text-only sections (S1 pattern): `position: relative; height: auto` on mobile — no sticky. S8 may need a hybrid since it's interactive but also has text steps.
- Mobile IO offset `0.1` (defined in `onMount`, `matchMedia('(max-width: 800px)')`).
- `aria-live="polite"` for transition labels — used in S6, replicate for S7's "on a serious note" label.
- Bilingual toggle preserves scroll position via `requestAnimationFrame(() => window.scrollTo(0, y))`.

### Integration Points
- `onMount`: add new scrollers to the `scrollers = [...]` array; add new `safeFetch` calls for word-level data (lazy — only on click, not on mount).
- `onDestroy`: scrollers array already handles `.destroy()` for all entries — new scrollers auto-included.
- `constants.json`: extended with `anchors` key — fetched in existing `Promise.all([...])` on mount alongside stats, lembaga, constants.
- `prepare-data.py`: new output loop iterates the 20 words from wordcloud-all, cross-references the full JSONL/priority shards, outputs 60 per-word JSON files.

</code_context>

<specifics>
## Specific Ideas

- **S7 two-beat structure:** Step 0 = "kopi + seblak" (light, absurd, culturally familiar street food). Step 1 = transition label "Atau, lebih seriusnya..." / "Or, on a more serious note..." then "SD schools + puskesmas" (heavy, civic loss). The narrative rhythm is: make them laugh, then make them feel it.
- **S8 word cloud:** Uses the same dark card aesthetic as the rest of the site. Words as styled `<button>` elements — gold/muted color palette, hover state highlights the word, active (selected) state shows it in `--gold`. Flex-wrap, row gap via `--space-sm`.
- **S9 overlay:** The overlay replaces the cloud in the sticky panel. Table header shows: word + active filter label + record count + × close. Table rows are compact — monospace font for pagu amounts (JetBrains Mono, consistent with axis labels elsewhere).

</specifics>

<deferred>
## Deferred Ideas

- Institution-level per-word record pre-baking (620 institutions × 20 words = 12,400 files) — deferred to v2 or Phase 4 if storage allows.
- Virtual scroll for word-click tables with > 1000 rows — already in REQUIREMENTS.md v2 deferred list.
- Deep links to individual sections via URL hash — already in REQUIREMENTS.md v2 deferred list.

</deferred>

---

*Phase: 03-interactive-back-half-s7-s9*
*Context gathered: 2026-05-14*
