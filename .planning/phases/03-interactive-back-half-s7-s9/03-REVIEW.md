---
phase: 03-interactive-back-half-s7-s9
reviewed: 2026-05-14T00:00:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - dashboard/src/App.svelte
  - dashboard/src/i18n.js
  - dashboard/scripts/prepare-data.py
  - dashboard/public/data/constants.json
findings:
  critical: 2
  warning: 4
  info: 3
  total: 9
status: issues_found
---

# Phase 03: Code Review Report

**Reviewed:** 2026-05-14
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Reviewed the Phase 3 additions: S7 anchor count-up, per-word JSON pipeline extension in `prepare-data.py`, S8 word cloud + S9 record-table overlay, bilingual i18n additions, and `constants.json` anchor data.

The static data pipeline is structurally sound and the Svelte 5 runes usage is largely correct. There are two blockers: the `countUp` RAF animation loops are never cancelled when the `$effect` re-runs, causing multiple concurrent loops to write to the same state variable; and a race condition in `selectWord` can corrupt the display with stale data from an earlier in-flight fetch. Four additional warnings cover a stale hardcoded heading, a misleading empty-state count display, dead i18n keys, and a double-read of priority shards. No XSS or path-traversal risks were found.

---

## Critical Issues

### CR-01: Orphaned RAF loops accumulate when `activeStepS7` changes rapidly

**File:** `dashboard/src/App.svelte:168-216`

**Issue:** `countUp()` starts a `requestAnimationFrame` loop but returns no cancel handle. The `$effect` that calls it clears `s7Timers` (the `setTimeout` handles) on each re-run, but has no way to abort in-flight RAF loops. When a user scrolls from step 0 to step 1 and back quickly, two or more RAF loops animate the same state variables (`kopiCount`, `seblakCount`) simultaneously. Both loops call `onUpdate(Math.floor(eased * target))` on the same `$state` variable in the same frame tick, producing flickering counts and incorrect final values. The effect also does not return a Svelte 5 cleanup function, so even a single step transition leaves stale RAF frames running for the duration of the animation.

**Fix:** Return an `rAFId` from `countUp` and cancel it in the `$effect` cleanup:

```js
// countUp now returns a cancel function
function countUp(target, duration, onUpdate, onDone) {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReduced) { onUpdate(target); onDone?.(); return () => {} }
  let rafId
  const start = performance.now()
  let cancelled = false
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

// In $effect — collect all cancel handles and return cleanup
$effect(() => {
  if (!stats || !constants?.anchors) return
  s7Timers.forEach(clearTimeout)
  s7Timers = []
  const cancels = []
  const high = stats.labelPagu.high ?? 0
  if (activeStepS7 === 0) {
    s7ShowTransition = false
    sdCount = 0; puskesmasCount = 0
    cancels.push(countUp(Math.floor(high / constants.anchors.kopi.price), 1800, v => { kopiCount = v }))
    cancels.push(countUp(Math.floor(high / constants.anchors.seblak.price), 1800, v => { seblakCount = v }))
  } else if (activeStepS7 === 1) {
    s7ShowTransition = true
    sdCount = 0; puskesmasCount = 0
    s7Timers.push(setTimeout(() => {
      cancels.push(countUp(Math.floor(high / constants.anchors.sd.price), 1800, v => { sdCount = v }))
    }, 300))
    s7Timers.push(setTimeout(() => {
      cancels.push(countUp(Math.floor(high / constants.anchors.puskesmas.price), 1800, v => { puskesmasCount = v }))
    }, 450))
  }
  // Svelte 5 $effect cleanup — runs before next re-execution
  return () => {
    cancels.forEach(c => c?.())
    s7Timers.forEach(clearTimeout)
    s7Timers = []
  }
})
```

---

### CR-02: Race condition in `selectWord` can display stale records

**File:** `dashboard/src/App.svelte:77-98`

**Issue:** If a user clicks word A, then immediately clicks word B before word A's fetch resolves, two concurrent `safeFetch` calls are in flight. Word A's `finally` block runs first (`wordRecordsLoading = false`), then word A's `try` block sets `wordRecords = data_A` and caches `data_A` under key A. Word B's fetch resolves next and sets `wordRecords = data_B`. But in the window between word A's `wordRecords = data_A` and word B's assignment, the UI renders data_A under the heading for word B. Additionally, after word B resolves, word A's stale entry is now cached — so clicking word A again will show the correct cached result, but that cached result was written under a race. The `wordRecordsLoading` flag is also incorrectly set to `false` by whichever fetch finishes first, hiding the spinner while the second fetch is still in progress.

**Fix:** Track the "current" word at the time the fetch starts and discard results that arrive out of order:

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
  const requestedWord = word   // capture at call time
  try {
    const data = await safeFetch(`/data/word-${word}-${filterKey}.json`)
    if (selectedWord !== requestedWord) return  // stale — a newer click won
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

## Warnings

### WR-01: Hardcoded headline value in `s7StickyHeading` diverges from live data

**File:** `dashboard/src/i18n.js:81,201`

**Issue:** `s7StickyHeading` is hardcoded as `'Rp 10,7 triliun untuk pengadaan bermasalah'` (ID) and `'Rp 10.7 trillion for inappropriate procurement'` (EN). The actual figure is derived from `stats.labelPagu.high`, which the `$effect` in App.svelte already reads correctly for the count-up animation. If the data pipeline is rerun and `labelPagu.high` changes — say, after adding more shards or correcting records — the sticky heading will silently display the wrong number while the animated count-ups show the correct new figure. The two figures will contradict each other in the same section.

**Fix:** Compute the heading from `stats` at render time instead of encoding it in the i18n file:

```svelte
<!-- In the S7 sticky-col, replace the static heading with: -->
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

### WR-02: `fmtPaguShort` produces misleading output for values under Rp 1 billion

**File:** `dashboard/src/App.svelte:196-202`

**Issue:** If `pagu` is less than `1e9` (Rp 1 billion) but greater than or equal to `1e6`, the English branch returns `Rp 0 M` for values below Rp 500 million (e.g., `fmtPaguShort(500_000, 'en')` → `'Rp 0 M'`). The Indonesian branch returns `'Rp 0 jt'`. For values below Rp 1 million, all branches silently produce `Rp 0 M` or `Rp 0 jt` with no indication of the real magnitude. While high-inappropriate records are unlikely to have near-zero `pagu`, the function gives no output for values genuinely below `1e6` (e.g., erroneous `pagu: 1`).

**Fix:** Add a fallback for sub-million values:

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

### WR-03: `prepare-data.py` reads all priority shards twice in the same run

**File:** `dashboard/scripts/prepare-data.py:49-71,147-166`

**Issue:** The script iterates `DATA_DIR.glob("*_priority.json")` twice — once at lines 49–71 for per-institution flag counts, and again at lines 147–166 for per-word record bucketing. With ~123 shards where each priority file can be tens of thousands of records, this doubles the I/O and the time needed for the per-word pass. More importantly, if the shard list or content changes between the two `glob` calls (e.g., a file is written mid-run by another process), the two passes will process inconsistent data, producing mismatched counts between `summary-stats.json` and the per-word JSON files.

**Fix:** Collect the priority data in a single pass and reuse it:

```python
priority_records = []
for path in sorted(DATA_DIR.glob("*_priority.json")):
    records = json.load(path.open())
    priority_records.extend(records)
    # --- existing per-institution aggregation ---
    for r in records:
        name  = r.get("lembaga") or "Unknown"
        pagu  = r.get("pagu") or 0
        level = r.get("tags", {}).get("isInappropriate", "")
        # ... (same logic as current lines 51-71)

# Later: use priority_records instead of re-globbing
for r in priority_records:
    if r.get("tags", {}).get("isInappropriate") != "high":
        continue
    # ... (same logic as current lines 149-166)
```

---

### WR-04: `setFilter` error handling writes to global `fetchError` instead of a filter-local error state

**File:** `dashboard/src/App.svelte:72-74`

**Issue:** When `setFilter` fails (network error fetching a wordcloud JSON), it writes to `fetchError` — the same state variable used by the initial `onMount` fetch failure. This causes the bottom-of-page error banner (`<div class="fetch-error">`) to appear as if the entire initial data load failed, which is misleading. Worse, a prior successful `onMount` fetch leaves `fetchError` as `null`, and a later filter fetch error sets it; there is no mechanism to clear `fetchError` on a subsequent successful filter change. The error persists even after the user successfully switches to another filter.

**Fix:** Use a dedicated state variable for filter errors and display it in the filter bar:

```js
let filterError = $state(null)

async function setFilter(filter, lembagaName = null) {
  selectedWord = null
  activeFilter = filter
  activeLembaga = lembagaName
  filterError = null
  try {
    // ... fetch logic unchanged
  } catch (err) {
    filterError = t[lang].fetchError
  }
}
```

```svelte
<!-- In the S8 filter bar, add: -->
{#if filterError}
  <div class="s8-filter-error">{filterError}</div>
{/if}
```

---

## Info

### IN-01: Dead i18n keys — `s9TableHeader`, `s2StickyHeading`, `s3StickyHeading`, `s5StickyHeading`, `s5LegendLow/Med/High`, `s1NewsLinkLabel`, `sectionStub`

**File:** `dashboard/src/i18n.js` (both locales)

**Issue:** Eight keys are defined in both `id` and `en` locales but never referenced in `App.svelte`: `s9TableHeader`, `s2StickyHeading`, `s3StickyHeading`, `s5StickyHeading`, `s5LegendLow`, `s5LegendMed`, `s5LegendHigh`, `s1NewsLinkLabel`, `sectionStub`. The S9 title uses an inline template (`{#if lang === 'id'}Paket dengan kata...`) instead of `t[lang].s9TableHeader`. These dead keys add noise and create a maintenance risk — future translators may update them without effect.

**Fix:** Remove the unused keys from both locales, or replace the inline S9 title template with `t[lang].s9TableHeader(selectedWord)`.

---

### IN-02: `$effect` also re-fires when `stats` or `constants` change independently of `activeStepS7`

**File:** `dashboard/src/App.svelte:168-190`

**Issue:** The `$effect` depends on `stats`, `constants`, and `activeStepS7`. When `stats` arrives from `onMount`, the effect fires immediately with `activeStepS7 === 0` and starts the kopi/seblak count-up before the user has scrolled into S7. This is likely unintentional — the animations start on page load in the background. If S7 is far below the fold (it is), the count-ups finish invisibly, and by the time the user scrolls to S7, the numbers are static. The visual payoff of the animation is lost.

**Fix:** Guard the effect so animation only starts when S7 is actually visible. One approach: combine the readiness check with a visibility flag:

```js
let s7Visible = $state(false)
// In makeScroller for 's7': also set s7Visible = true on first enter
// Then: $effect(() => { if (!stats || !constants?.anchors || !s7Visible) return; ... })
```

---

### IN-03: Hardcoded `'Rp 10.7 T'` number in `constants.json` `s7StickyHeading` cross-referenced to actual label pagu

**File:** `dashboard/public/data/constants.json`

**Issue:** `constants.json` does not contain the `s7StickyHeading` value — that lives in `i18n.js` (covered by WR-01). However, `constants.json` does not provide a machine-readable field for the "total high-pagu" figure used in the S7 heading, even though the value is available in `summary-stats.json`. This means any downstream tooling or copy editors who look at `constants.json` for the S7 display values will find them absent. The `anchors` section is correctly structured with price, source, and label. No change needed to `constants.json` itself — the fix is in i18n.js and App.svelte per WR-01.

**Fix:** No action required on `constants.json`. Track as context for WR-01 resolution.

---

_Reviewed: 2026-05-14_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
