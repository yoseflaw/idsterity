---
phase: 03-interactive-back-half-s7-s9
plan: "03"
subsystem: frontend-ui
tags: [svelte5, scrollama, word-cloud, filter, overlay, table, mobile-responsive, a11y, bilingual]
dependency_graph:
  requires: [03-01, 03-02]
  provides: [s8-word-cloud, s9-record-table-overlay]
  affects: [dashboard/src/App.svelte, dashboard/src/i18n.js]
tech_stack:
  added: []
  patterns:
    - Svelte 5 $derived for per-dataset cloudMin/cloudMax font scaling
    - In-memory Map cache for lazy-fetch deduplication (wordCache)
    - MediaQueryList.addEventListener for reactive narrow-breakpoint detection
    - scrollama outside-click guard scoped to .s8-sticky-panel (not document)
    - D-12 institution-filter fallback: filterKey = activeFilter === 'lembaga' ? 'all' : activeFilter
key_files:
  created: []
  modified:
    - dashboard/src/i18n.js
    - dashboard/src/App.svelte
decisions:
  - "Inline conditional used for s9 title gold-word rendering instead of {@html} — preserves Svelte HTML-escaping per T-03-11 threat mitigation"
  - "fmtPaguShort uses 'jt' suffix in Indonesian and 'M' in English for sub-billion amounts"
  - "onNarrowChange declared at script scope so onDestroy can reference it for removeEventListener"
metrics:
  duration: "~25 minutes"
  completed: "2026-05-14"
  tasks_completed: 3
  tasks_total: 3
  files_changed: 2
---

# Phase 03 Plan 03: S8 Word Cloud + S9 Record Table Overlay Summary

**One-liner:** Bilingual S8 word-cloud with three filter modes + institution search, backed by lazy-fetched S9 record table overlay with in-memory cache and full close affordances.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add 22 S8+S9 bilingual i18n keys | 160d9ed | dashboard/src/i18n.js |
| 2 | Wire S8 word cloud into App.svelte | 181119d | dashboard/src/App.svelte |
| 3 | Wire S9 record-table overlay | 01917e7 | dashboard/src/App.svelte |

## What Was Built

### Task 1 — i18n.js (22 new keys)

11 S8 keys added to both `t.id` and `t.en` blocks under `// S8 — Word Cloud` divider:
- `s8Eyebrow`, `s8StickyHeading`, `s8Step0Heading`, `s8Step0Body`
- `s8FilterAll`, `s8FilterCentral`, `s8FilterDistrict`, `s8FilterInstitution`, `s8FilterReset`
- `s8NoResults`, `s8MobileFallbackNote`

11 S9 keys added under `// S9 — Record Table` divider:
- `s9ColLembaga`, `s9ColSatker`, `s9ColPagu`, `s9ColPaket`, `s9ColReason`
- `s9TableHeader` (function value: `(word) => \`Paket dengan kata "${word}"\``)
- `s9RecordCount` (function value: `(n) => \`${n} paket teratas (berdasarkan pagu)\``)
- `s9FallbackNote`, `s9Close`, `s9Loading`, `s9Error`

All strings are verbatim from UI-SPEC Copywriting Contract.

### Task 2 — App.svelte S8 Word Cloud

**New $state variables (11):**
`activeStepS8`, `cloudWords`, `lembagaIndex`, `activeFilter`, `activeLembaga`, `lembagaSearch`, `selectedWord`, `wordRecords`, `wordRecordsLoading`, `wordRecordsError`, `isNarrow`

**Plain variables:** `mqNarrow` (MediaQueryList), `wordCache` (new Map())

**$derived values (3):**
- `cloudMin` / `cloudMax` — per-dataset min/max count for font scaling (RESEARCH.md Pitfall 2)
- `filteredInstitutions` — filtered institution list, capped at 50, returns [] when search empty

**Helper functions:**
- `scaleFont(count, min, max)` — returns rem value in [0.75, 2.0]; midpoint 1.375 when cloudMax === cloudMin
- `fmtPaguShort(v, lang)` — compact pagu formatter: T / M / jt (id) or M (en) scale
- `setFilter(filter, lembagaName)` async — clears selectedWord, fetches appropriate wordcloud JSON; lembaga filter reads from lembagaIndex in-memory
- `onNarrowChange` — MediaQueryList change handler, declared at script scope for onDestroy cleanup

**onMount extensions:**
- Promise.all extended to 5 fetches: added `/data/wordcloud-all.json` and `/data/wordcloud-lembaga.json`
- `makeScroller('s8', ...)` added to scrollers array
- Narrow breakpoint wiring: `mqNarrow = window.matchMedia('(max-width: 480px)')`, `isNarrow = mqNarrow.matches`

**S8 HTML section:**
- `<section class="scrolly" data-section="s8" id="s8">`
- `.s8-sticky-panel` with outside-click handler (scoped, per RESEARCH.md Pitfall 3)
- Filter bar: 3 pill toggles (All / Central / District), institution search input with dropdown (max 50 results), reset button (shown only when filter != 'all')
- Word cloud: `{#each cloudWords}` with per-word `font-size` from `scaleFont()`, `class:is-narrow` for chip-strip mode, `aria-pressed` on selected word
- Empty state when `cloudWords.length === 0`
- Mobile fallback note when `isNarrow`
- One scrollama step card (1/1) in steps-col

**S8 CSS (~140 lines):** filter bar, pills (active=gold border), search input + dropdown, reset button, cloud container (flex-wrap / flex-nowrap is-narrow), cloud word buttons (hover/selected states), mobile chip strip override, empty state

### Task 3 — App.svelte S9 Record Table Overlay

**`selectWord(word)` full implementation:**
- Toggle-off: if `selectedWord === word`, set null and return
- Sets `selectedWord`, clears `wordRecords`/`wordRecordsError`
- D-12 fallback: `filterKey = activeFilter === 'lembaga' ? 'all' : activeFilter`
- Cache key: `${word}-${filterKey}`; hits wordCache.get on cache hit (no network request)
- Cache miss: fetch `/data/word-${word}-${filterKey}.json`, set into wordCache, update wordRecords
- Error: sets `wordRecordsError = t[lang].s9Error`
- Finally: always clears `wordRecordsLoading`

**Outside-click handler on `.s8-sticky-panel`:**
`onclick={(e) => { if (selectedWord && !e.target.closest('.s9-overlay') && !e.target.closest('.s8-cloud-word') && !e.target.closest('.s8-filter-bar')) { selectedWord = null } }}`

**S9 overlay HTML** (inside `{#if selectedWord}` branch):
- `.s9-overlay > .s9-table-header` (title-row: h3 with gold `<span class="s9-title-word">`, × close button; record count; conditional fallback note)
- `.s9-table-body > table > thead` (sticky, 5 columns: Lembaga, Satker, Pagu right-aligned, Nama Paket, Alasan AI)
- `tbody`: loading-pulse state, error state (amber), empty state (s8NoResults copy), data rows with `fmtPaguShort` for pagu column
- Word in title rendered via inline `{#if lang === 'id'}...{:else}...{/if}` to enable gold `<span>` without `{@html}` (T-03-11 XSS mitigation)

**S9 CSS (~130 lines):** overlay flex column, table header border/padding, title-row flexbox, gold title-word, close button 44×44px, sticky thead, th/td fonts/colors/spacing, pagu column right-align+mono+nowrap, hover row highlight, loading/error/empty states, 800px breakpoint adds `overflow-x: auto` for horizontal scroll

## Network Behavior

| Trigger | Fetch |
|---------|-------|
| onMount | `/data/wordcloud-all.json`, `/data/wordcloud-lembaga.json` (Promise.all, eager) |
| Filter pill: Central | `/data/wordcloud-central.json` (lazy, on click) |
| Filter pill: District | `/data/wordcloud-district.json` (lazy, on click) |
| Filter pill: All | `/data/wordcloud-all.json` (lazy; re-fetches since no cloud-level cache) |
| Institution search item click | reads `lembagaIndex[name]` in-memory, no network |
| Word click (cache miss) | `/data/word-{word}-{filterKey}.json` (lazy, cached in wordCache) |
| Word click (cache hit) | no network request |
| Institution filter active → word click | always fetches `/data/word-{word}-all.json` (D-12) |

## Security

All S9 record fields (`r.lembaga`, `r.satker`, `r.paket`, `r.inappropriateReason`) rendered via Svelte text interpolation (HTML-escaped). No `{@html}` used in S8 or S9 markup. `selectedWord` sourced exclusively from `cloudWords` array entries — never from free-text search input (RESEARCH.md Pitfall 5, T-03-12, T-03-13).

## Known Stubs

None. All `selectWord`, `setFilter`, outside-click, S9 overlay, and close affordances are fully wired. The per-word JSON files (`word-{word}-{filter}.json`) were materialized by Plan 02 — they are empty arrays `[]` in the development build (no live dataset), so S9 will show the empty-state row (`s8NoResults`) when clicked. This is correct behavior for a dataset-absent build and not a stub.

## Deviations from Plan

None — plan executed exactly as written. The inline conditional approach for S9 title gold-word rendering (instead of `t[lang].s9TableHeader(selectedWord)` with `{@html}`) was the plan's own recommended option (see Task 3 NOTE) and is documented as a decision above.

## Self-Check: PASSED

Files exist:
- dashboard/src/i18n.js — modified with 52 new lines
- dashboard/src/App.svelte — modified with 531 new lines across Tasks 2 and 3

Commits exist:
- 160d9ed: feat(03-03): add 22 S8+S9 bilingual i18n keys
- 181119d: feat(03-03): wire S8 word cloud into App.svelte
- 01917e7: feat(03-03): add S9 record-table overlay with lazy fetch and cache

Build verification: `npm run build` exits 0, no Svelte compile errors (confirmed after each task).
