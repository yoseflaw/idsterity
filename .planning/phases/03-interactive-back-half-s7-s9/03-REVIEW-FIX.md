---
phase: 03-interactive-back-half-s7-s9
fixed_at: 2026-05-14T12:30:00Z
review_path: .planning/phases/03-interactive-back-half-s7-s9/03-REVIEW.md
iteration: 1
findings_in_scope: 7
fixed: 7
skipped: 0
status: all_fixed
---

# Phase 03: Code Review Fix Report

**Fixed at:** 2026-05-14
**Source review:** `.planning/phases/03-interactive-back-half-s7-s9/03-REVIEW.md`
**Iteration:** 1

**Summary:**
- Findings in scope: 7 (CR-01, CR-02, CR-03, CR-04, WR-01, WR-02, WR-04, WR-05 — WR-02 co-fixed with CR-02, WR-03 skipped per instructions)
- Fixed: 7
- Skipped: 0

---

## Fixed Issues

### CR-01: Script invocation order reversed in `npm run prepare-data`

**Files modified:** `dashboard/package.json`
**Commit:** `7c6219e`
**Applied fix:** Swapped the two script invocations so `word-cloud.py` runs first (producing the wordcloud JSON files), then `prepare-data.py` (which reads them). Changed from `uv run scripts/prepare-data.py && uv run scripts/word-cloud.py` to `uv run scripts/word-cloud.py && uv run scripts/prepare-data.py`.

---

### CR-02: Orphaned RAF loops accumulate when `activeStepS7` changes rapidly

**Files modified:** `dashboard/src/App.svelte`
**Commit:** `c7c6045`
**Applied fix:** Rewrote `countUp` to return a cancel function (`() => { cancelled = true; cancelAnimationFrame(rafId) }`). Added a `cancels` array in the `$effect`, pushed each cancel function returned by `countUp` calls into it, and added a cleanup return `() => { cancels.forEach(c => c?.()); s7Timers.forEach(clearTimeout); s7Timers = [] }` so Svelte calls it before re-running the effect.

Note: This fix also resolves **WR-02** — the local variable `t` inside `countUp` (which shadowed the module-level `import { t }`) was renamed to `progress` as part of rewriting the function.

---

### CR-03: Race condition in `selectWord` can display stale records under the wrong heading

**Files modified:** `dashboard/src/App.svelte`
**Commit:** `352a044`
**Applied fix:** Captured the selected word in `const requestedWord = word` before the `await`. Added staleness guards: `if (selectedWord !== requestedWord) return` in both the try and catch branches, and `if (selectedWord === requestedWord) wordRecordsLoading = false` in the finally branch. This ensures a fetch result that arrives after the user has switched to a different word is silently discarded rather than overwriting the current word's results.

---

### CR-04: All S2 and S3 source citation links always point to the same wrong source entry

**Files modified:** `dashboard/src/App.svelte`
**Commit:** `4102541`
**Applied fix:** Updated the `href` on each step-card's `<a class="source-link">` to use the step-appropriate `constants.sources` field:

- S2 step 0: `apbn.deficit.oct2024` (was `apbn.deficit.fy2025`)
- S2 step 1: `apbn.deficit.fy2025` (unchanged — was already correct)
- S2 step 2: `apbn.deficit.q1_2026` (was `apbn.deficit.fy2025`)
- S3 step 0: `gdp.konsumsi_pemerintah.q1_2025` (was `gdp.konsumsi_pemerintah.q2_2025`)
- S3 step 1: `gdp.konsumsi_pemerintah.q2_2025` (unchanged — was already correct)
- S3 step 2: `gdp.konsumsi_pemerintah.q3_2025` (was `gdp.konsumsi_pemerintah.q2_2025`)
- S3 step 3: `gdp.konsumsi_pemerintah.q1_2026` (was `gdp.konsumsi_pemerintah.q2_2025`)

---

### WR-01: Hardcoded headline value in `s7StickyHeading` will diverge from live data

**Files modified:** `dashboard/src/App.svelte`, `dashboard/src/i18n.js`
**Commit:** `18149c9`
**Applied fix:** Replaced `{t[lang].s7StickyHeading}` in the S7 sticky `<h2>` with a dynamic template that computes the heading from `stats.labelPagu.high` using the existing `fmtT()` formatter, falling back to the i18n key while data is loading. Added a comment to both `id` and `en` locales in `i18n.js` noting that `s7StickyHeading` is a loading fallback only and must match `constants.json:s7TotalPagu`.

---

### WR-02: `countUp` local variable `t` shadows the module-level i18n import `t`

**Files modified:** `dashboard/src/App.svelte`
**Commit:** `c7c6045` (co-fixed with CR-02)
**Applied fix:** Renamed the local numeric progress variable from `t` to `progress` while rewriting `countUp` as part of the CR-02 fix. The variable is now named `progress` throughout the frame loop, matching the reviewer's suggestion and eliminating the shadow.

---

### WR-04: `prepare-data.py` reads all priority shards twice

**Files modified:** `dashboard/scripts/prepare-data.py`
**Commit:** `5441edc`
**Applied fix:** Added a `priority_records = []` list before the first priority-shard loop. After the per-institution aggregation inner loop, `priority_records.extend(records)` accumulates all records. The second `DATA_DIR.glob("*_priority.json")` loop (per-word bucketing) was replaced with `for r in priority_records:`, eliminating the second file-system pass and ensuring both aggregation steps process an identical, consistent snapshot of the priority data.

---

### WR-05: `setFilter` error writes to global `fetchError`, triggering misleading banner

**Files modified:** `dashboard/src/App.svelte`
**Commit:** `a54feb0`
**Applied fix:** Added `let filterError = $state(null)` as a dedicated state variable. Updated `setFilter` to set `filterError = null` at the start of each call and write `filterError = t[lang].fetchError` on failure instead of `fetchError`. Added `{#if filterError}<div class="s8-filter-error">{filterError}</div>{/if}` inside the S8 filter bar after the reset button, and added a `.s8-filter-error` CSS rule (amber color, JetBrains Mono, `width: 100%`) so the error appears inline within the filter bar rather than as a site-wide banner.

---

## Skipped Issues

None — all in-scope findings were fixed.

---

_Fixed: 2026-05-14_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
