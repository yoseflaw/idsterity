---
phase: 03-interactive-back-half-s7-s9
reviewed: 2026-05-14T12:00:00Z
depth: standard
files_reviewed: 11
files_reviewed_list:
  - dashboard/index.html
  - dashboard/package.json
  - dashboard/public/data/constants.json
  - dashboard/scripts/prepare-data.py
  - dashboard/scripts/word-cloud.py
  - dashboard/src/App.svelte
  - dashboard/src/DeficitChart.svelte
  - dashboard/src/GDPChart.svelte
  - dashboard/src/i18n.js
  - dashboard/src/InstitutionsChart.svelte
  - dashboard/src/main.js
findings:
  critical: 4
  warning: 5
  info: 3
  total: 12
status: issues_found
---

# Phase 03: Code Review Report

**Reviewed:** 2026-05-14
**Depth:** standard
**Files Reviewed:** 11
**Status:** issues_found

## Summary

Reviewed the full Phase 3 implementation: S7 anchor count-up, S8 word cloud with per-institution filtering, S9 record-table overlay, the data pipeline extension in `prepare-data.py`, the new `word-cloud.py` script, new chart components (`DeficitChart`, `GDPChart`, `InstitutionsChart`), `constants.json`, and the bilingual i18n additions.

The Svelte 5 runes usage and overall architecture are sound. Four blockers were found: the `npm run prepare-data` script invokes `prepare-data.py` before `word-cloud.py`, so `prepare-data.py` always fails on first run because it expects word cloud output files that do not yet exist; a `requestAnimationFrame` animation loop is never cancelled when `activeStepS7` changes quickly, causing multiple concurrent loops to fight over the same state; a race condition in `selectWord` can show stale fetch results; and all S2 and S3 source citation links are hardwired to a single wrong `constants.sources` entry regardless of which scroll step is active. Five warnings cover a hardcoded heading value that will diverge from live data, a variable name that shadows the i18n `t` import, incorrect `fmtPaguShort` output near zero, double-reading of priority shards, and stale fetch error state leaking into the global error banner. Three info items round out the review.

---

## Critical Issues

### CR-01: `prepare-data.py` runs before `word-cloud.py` in `npm run prepare-data`, causing guaranteed failure on first run

**File:** `dashboard/package.json:9`

**Issue:** The `prepare-data` script is:
```
"prepare-data": "uv run scripts/prepare-data.py && uv run scripts/word-cloud.py"
```
`prepare-data.py` is invoked first. But at lines 130–135 of `prepare-data.py`, the script requires `wordcloud-all.json`, `wordcloud-central.json`, and `wordcloud-district.json` to already exist — and raises `FileNotFoundError` if they do not:
```python
for _wc_path in (_wc_all, _wc_central, _wc_district):
    if not _wc_path.exists():
        raise FileNotFoundError(...)
```
These files are produced by `word-cloud.py`, which runs second. Any developer running `npm run prepare-data` on a clean checkout will get a hard failure mid-run. The `&&` ensures `word-cloud.py` never runs at all. Even if the word cloud files are pre-committed, a fresh dataset run always re-generates them via `word-cloud.py`, so the dependency on their prior existence is a design error.

**Fix:** Reverse the invocation order:
```json
"prepare-data": "uv run scripts/word-cloud.py && uv run scripts/prepare-data.py"
```
Or, restructure `prepare-data.py` so the per-word bucketing section is a separate script or runs only when word cloud files exist (warn and skip instead of raising).

---

### CR-02: Orphaned RAF loops accumulate when `activeStepS7` changes rapidly

**File:** `dashboard/src/App.svelte:168-216`

**Issue:** `countUp()` starts a `requestAnimationFrame` loop and returns nothing. The `$effect` that calls it clears `s7Timers` (the `setTimeout` handles) on each re-run, but has no mechanism to abort in-flight RAF loops. When a user scrolls from step 0 to step 1 and back quickly, two or more RAF loops concurrently animate the same state variables (`kopiCount`, `seblakCount`). Both call `onUpdate(Math.floor(eased * target))` on the same `$state` in the same frame, producing flickering counts and incorrect final values. The effect also does not return a Svelte 5 cleanup function, so stale RAF frames continue running even after the component is destroyed.

**Fix:** Return a cancel function from `countUp` and invoke it in the `$effect` cleanup return:
```js
function countUp(target, duration, onUpdate, onDone) {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReduced) { onUpdate(target); onDone?.(); return () => {} }
  let rafId
  let cancelled = false
  const start = performance.now()
  function frame(now) {
    if (cancelled) return
    const progress = Math.min((now - start) / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3)
    onUpdate(Math.floor(eased * target))
    if (progress < 1) rafId = requestAnimationFrame(frame)
    else { onUpdate(target); onDone?.() }
  }
  rafId = requestAnimationFrame(frame)
  return () => { cancelled = true; cancelAnimationFrame(rafId) }
}

$effect(() => {
  if (!stats || !constants?.anchors) return
  s7Timers.forEach(clearTimeout)
  s7Timers = []
  const cancels = []
  const high = stats.labelPagu.high ?? 0
  if (activeStepS7 === 0) {
    s7ShowTransition = false
    sdCount = 0; puskesmasCount = 0
    cancels.push(countUp(Math.floor(high / constants.anchors.kopi.price),   1800, v => { kopiCount = v }))
    cancels.push(countUp(Math.floor(high / constants.anchors.seblak.price), 1800, v => { seblakCount = v }))
  } else if (activeStepS7 === 1) {
    s7ShowTransition = true
    sdCount = 0; puskesmasCount = 0
    s7Timers.push(setTimeout(() => {
      cancels.push(countUp(Math.floor(high / constants.anchors.sd.price),       1800, v => { sdCount = v }))
    }, 300))
    s7Timers.push(setTimeout(() => {
      cancels.push(countUp(Math.floor(high / constants.anchors.puskesmas.price), 1800, v => { puskesmasCount = v }))
    }, 450))
  }
  return () => { cancels.forEach(c => c?.()); s7Timers.forEach(clearTimeout); s7Timers = [] }
})
```

---

### CR-03: Race condition in `selectWord` can display stale records under the wrong heading

**File:** `dashboard/src/App.svelte:77-98`

**Issue:** If a user clicks word A then immediately clicks word B before A's fetch resolves, two concurrent `safeFetch` calls are in flight. Whichever resolves last wins and writes to `wordRecords` — the final state is non-deterministic. If A resolves after B, `wordRecords` is set to A's data while `selectedWord === 'B'`, displaying A's records under B's heading. The `wordRecordsLoading` flag is also incorrectly cleared by whichever fetch finishes first, hiding the spinner while the other fetch is still in progress. Additionally, the stale resolved data can be incorrectly written to `wordCache` under the wrong word key if A resolves last after B has toggled `selectedWord` back.

**Fix:** Capture the selected word at call time and discard results that arrive after the word has changed:
```js
async function selectWord(word) {
  if (selectedWord === word) { selectedWord = null; return }
  selectedWord = word
  wordRecords = []
  wordRecordsError = null
  const filterKey = activeFilter === 'lembaga' ? 'all' : activeFilter
  const cacheKey = `${word}-${filterKey}`
  if (wordCache.has(cacheKey)) {
    wordRecords = wordCache.get(cacheKey)
    return
  }
  wordRecordsLoading = true
  const requestedWord = word   // capture before any await
  try {
    const data = await safeFetch(`/data/word-${word}-${filterKey}.json`)
    if (selectedWord !== requestedWord) return  // superseded — discard
    wordCache.set(cacheKey, data)
    wordRecords = data
  } catch (err) {
    if (selectedWord !== requestedWord) return
    wordRecordsError = t[lang].s9Error
  } finally {
    if (selectedWord === requestedWord) wordRecordsLoading = false
  }
}
```

---

### CR-04: All S2 and S3 source citation links always point to the same wrong `constants.sources` entry

**File:** `dashboard/src/App.svelte:328-353` (S2), `380-414` (S3)

**Issue:** Every `<a class="source-link">` in S2 and S3 uses the same `.find()` selector regardless of which scroll step is active:

- S2 steps 0, 1, and 2 all use `constants?.sources?.find(s => s.field === 'apbn.deficit.fy2025')`. Step 0 should link to `apbn.deficit.oct2024`, step 2 should link to `apbn.deficit.q1_2026`.
- All four S3 steps use `constants?.sources?.find(s => s.field === 'gdp.konsumsi_pemerintah.q2_2025')`. Steps 0, 2, 3 should link to their respective quarter's source (`q1_2025`, `q3_2025` or `q4_2025`, and `q1_2026`).

Users clicking the source link on any step except the FY2025 step (S2 step 1) and Q2 2025 step (S3 step 1) will be taken to the wrong primary source, undermining the factual credibility of the project.

**Fix:** Use the step-appropriate source field in each card:

S2 — step 0:
```svelte
href={constants?.sources?.find(s => s.field === 'apbn.deficit.oct2024')?.url ?? '#'}
```
S2 — step 1 (already correct):
```svelte
href={constants?.sources?.find(s => s.field === 'apbn.deficit.fy2025')?.url ?? '#'}
```
S2 — step 2:
```svelte
href={constants?.sources?.find(s => s.field === 'apbn.deficit.q1_2026')?.url ?? '#'}
```

S3 — step 0:
```svelte
href={constants?.sources?.find(s => s.field === 'gdp.konsumsi_pemerintah.q1_2025')?.url ?? '#'}
```
S3 — step 1 (already correct):
```svelte
href={constants?.sources?.find(s => s.field === 'gdp.konsumsi_pemerintah.q2_2025')?.url ?? '#'}
```
S3 — step 2:
```svelte
href={constants?.sources?.find(s => s.field === 'gdp.konsumsi_pemerintah.q3_2025')?.url ?? '#'}
```
S3 — step 3:
```svelte
href={constants?.sources?.find(s => s.field === 'gdp.konsumsi_pemerintah.q1_2026')?.url ?? '#'}
```

---

## Warnings

### WR-01: Hardcoded headline value in `s7StickyHeading` will diverge from live data

**File:** `dashboard/src/i18n.js:81,201`

**Issue:** `s7StickyHeading` is hardcoded as `'Rp 10,7 triliun untuk pengadaan bermasalah'` (ID) and `'Rp 10.7 trillion for inappropriate procurement'` (EN). The actual figure is derived from `stats.labelPagu.high`, which the `$effect` already reads correctly for the animated count-ups. If the pipeline is rerun after data corrections or additional shards, the sticky heading will display the old number while the animated counters show the new figure — a visible contradiction within the same screen section.

**Fix:** Compute the heading at render time:
```svelte
<h2 class="s7-sticky-heading">
  {#if stats}
    {lang === 'id'
      ? `Rp ${fmtT(stats.labelPagu.high)} T untuk pengadaan bermasalah`
      : `Rp ${fmtT(stats.labelPagu.high)} T for inappropriate procurement`}
  {:else}
    {t[lang].s7StickyHeading}
  {/if}
</h2>
```
Remove `s7StickyHeading` from both locales in `i18n.js` once the template is updated.

---

### WR-02: `countUp` local variable `t` shadows the module-level i18n import `t`

**File:** `dashboard/src/App.svelte:209`

**Issue:** `countUp` declares `const t = Math.min((now - start) / duration, 1)`. The module-level import is `import { t } from './i18n.js'`. Inside `countUp`, the name `t` refers to the local numeric variable, not the i18n object. This compiles and runs without error today because `countUp` doesn't call `t[lang]` internally. However, any future edit that references `t[lang]` inside `countUp` will silently use the numeric progress value instead of the translation object, producing a runtime error that is hard to trace.

**Fix:** Rename the local variable to `progress` (which is also more descriptive):
```js
const progress = Math.min((now - start) / duration, 1)
const eased = 1 - Math.pow(1 - progress, 3)
onUpdate(Math.floor(eased * target))
if (progress < 1) requestAnimationFrame(frame)
```

---

### WR-03: `fmtPaguShort` produces `'Rp 0 M'` / `'Rp 0 jt'` for values below Rp 1 million

**File:** `dashboard/src/App.svelte:196-202`

**Issue:** When `v < 1e6` the function still evaluates `(v / 1e6).toFixed(0)` which rounds to `"0"`, rendering as `Rp 0 M` or `Rp 0 jt`. While high-inappropriate records are unlikely to carry such small budgets, the dataset includes `pagu: 0` records (guarded by `r.get("pagu") or 0` in the Python script), and `fmtPaguShort(0, 'en')` reaches neither the `1e12` nor the `1e9` branch and produces `'Rp 0 M'` rather than `'Rp 0'`. Any S9 row with a zero or sub-million pagu will display a misleading unit label.

**Fix:**
```js
function fmtPaguShort(v, l) {
  if (!v || v <= 0) return 'Rp 0'
  const sep = l === 'id' ? ',' : '.'
  if (v >= 1e12) return `Rp ${(v / 1e12).toFixed(1).replace('.', sep)} T`
  if (v >= 1e9)  return `Rp ${(v / 1e9).toFixed(1).replace('.', sep)} M`
  if (v >= 1e6)  return l === 'id' ? `Rp ${(v / 1e6).toFixed(0)} jt` : `Rp ${(v / 1e6).toFixed(0)}M`
  return `Rp ${v.toLocaleString(l === 'id' ? 'id-ID' : 'en-US')}`
}
```

---

### WR-04: `prepare-data.py` reads all priority shards twice, doubling I/O and risking data inconsistency

**File:** `dashboard/scripts/prepare-data.py:49-71,147-166`

**Issue:** `DATA_DIR.glob("*_priority.json")` is called at line 49 (per-institution flag aggregation) and again at line 147 (per-word record bucketing). With ~123 priority shards potentially containing hundreds of thousands of records, this doubles read time. More critically, if a shard file is modified between the two glob calls, the two passes process inconsistent data: institution counts in `summary-stats.json` will not match the records written to `word-*.json` files. This is not a theoretical risk — any interrupted run that reruns `prepare-data.py` mid-pipeline is susceptible.

**Fix:** Accumulate the priority records in a list during the first pass and reuse them:
```python
priority_records = []
for path in sorted(DATA_DIR.glob("*_priority.json")):
    records = json.load(path.open())
    for r in records:
        # ... existing per-institution aggregation (lines 51-71) ...
        pass
    priority_records.extend(records)

# Replace the second glob loop (lines 147-166) with:
for r in priority_records:
    if r.get("tags", {}).get("isInappropriate") != "high":
        continue
    # ... existing per-word bucketing logic ...
```

---

### WR-05: `setFilter` error writes to global `fetchError`, producing a misleading banner and no auto-clear

**File:** `dashboard/src/App.svelte:72-74`

**Issue:** When a word cloud filter fetch fails, `setFilter` writes `t[lang].fetchError` to `fetchError` — the same state variable used for the initial `onMount` data load failure. This triggers the bottom-of-page error banner (`<div class="fetch-error">`) as if the entire site data load failed, which is misleading to users who successfully loaded the page. There is no mechanism to clear `fetchError` on a subsequent successful filter switch, so the banner persists indefinitely after one filter error.

**Fix:** Use a dedicated state variable for filter errors and display it in the S8 filter bar:
```js
let filterError = $state(null)

async function setFilter(filter, lembagaName = null) {
  selectedWord = null
  activeFilter = filter
  activeLembaga = lembagaName
  filterError = null   // clear previous error on new attempt
  try {
    // ... fetch logic unchanged ...
  } catch (err) {
    filterError = t[lang].fetchError
  }
}
```
```svelte
<!-- In s8-filter-bar, after the reset button: -->
{#if filterError}
  <div class="s8-filter-error">{filterError}</div>
{/if}
```

---

## Info

### IN-01: `$effect` for S7 animations fires on page load before S7 is in view

**File:** `dashboard/src/App.svelte:168-190`

**Issue:** The `$effect` depends on `stats`, `constants`, and `activeStepS7`. When `onMount` resolves and `stats` is set, the effect immediately fires with `activeStepS7 === 0` and starts the kopi/seblak count-up animations — before the user has scrolled to S7 (which is well below the fold). The animations complete invisibly. By the time the user reaches S7, the counters are already at their final values and the animation payoff is lost.

**Fix:** Gate the effect on a visibility flag that is set by the S7 scrollama callback:
```js
let s7InView = $state(false)
// Inside makeScroller('s7', ...) callback, also set: s7InView = true

$effect(() => {
  if (!stats || !constants?.anchors || !s7InView) return
  // ... rest of animation logic unchanged ...
})
```

---

### IN-02: Dead i18n keys defined but never referenced in the template

**File:** `dashboard/src/i18n.js` (both locales)

**Issue:** The following keys are defined in both `id` and `en` locales but are not referenced anywhere in `App.svelte` or any component: `s9TableHeader`, `sectionStub`, `s5LegendLow`, `s5LegendMed`, `s5LegendHigh`. The S9 title uses an inline bilingual `{#if lang === 'id'}` block rather than `t[lang].s9TableHeader(selectedWord)`. The legend strings in `InstitutionsChart.svelte` are also inlined. These dead keys will silently drift out of sync with the UI.

**Fix:** Either remove the unused keys from both locales, or adopt the keyed approach in the template. For S9 specifically, replacing the inline block with `t[lang].s9TableHeader(selectedWord)` at line 652 of `App.svelte` reduces duplication and keeps bilingual text in one place.

---

### IN-03: `InstitutionsChart` uses `$effect` with a D3 imperative transition that bypasses Svelte's reactive diffing

**File:** `dashboard/src/InstitutionsChart.svelte:56-95`

**Issue:** The chart uses `$effect` to run D3 `.transition().attr('transform', ...)` on elements already rendered by Svelte's `{#each}` loop. This creates a split-ownership pattern: Svelte controls initial position via the `transform` attribute on the `<g>` elements, while D3 imperatively overrides `transform` during transitions. When Svelte re-renders the `{#each}` block (e.g., on a `data` or `lang` prop change), it will reset the `transform` attribute to the initial `idx`-based value, potentially fighting the in-progress D3 transition and snapping bars back to their pre-transition position. The pattern is noted in CLAUDE.md as an anti-pattern for inline styles on SVG elements; the same concern applies to imperative attribute mutations.

**Fix:** This is a known trade-off in the codebase (Svelte 5 lacks a native animatable SVG attribute mechanism). The lowest-risk mitigation is to debounce or cancel any running D3 transition before Svelte re-renders. Alternatively, store the current Y positions in `$state` and drive the `transform` attribute declaratively (using CSS transitions rather than D3 transitions), eliminating the imperative override entirely.

---

_Reviewed: 2026-05-14_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
