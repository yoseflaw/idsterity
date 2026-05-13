# Phase 2: Core Narrative (S1–S6) - Pattern Map

**Mapped:** 2026-05-13
**Files analyzed:** 8 (6 new/modified, 1 deleted, 1 minor fix)
**Analogs found:** 7 / 8 (BarChart.svelte deleted — no read possible; patterns reconstructed from source context)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `dashboard/src/App.svelte` | component (root) | request-response + event-driven | `dashboard/src/App.svelte` (self — major expansion) | self |
| `dashboard/src/i18n.js` | utility (config) | transform | `dashboard/src/i18n.js` (self — key additions) | self |
| `dashboard/src/DeficitChart.svelte` | component (chart) | transform | `dashboard/src/App.svelte` scrolly + sticky pattern | role-match |
| `dashboard/src/GDPChart.svelte` | component (chart) | transform | `dashboard/src/App.svelte` scrolly + sticky pattern | role-match |
| `dashboard/src/InstitutionsChart.svelte` | component (chart) | event-driven + transform | `dashboard/src/App.svelte` BarChart stub + Phase 1 POC | role-match |
| `dashboard/src/BarChart.svelte` | component (chart) | — | deleted — no analog needed | n/a |
| `dashboard/scripts/prepare-data.py` | utility (data pipeline) | batch | `dashboard/scripts/prepare-data.py` (self — bug fix) | self |
| `dashboard/src/main.js` | config (entry point) | — | `dashboard/src/main.js` (self — import addition) | self |

---

## Pattern Assignments

### `dashboard/src/App.svelte` (root component, multi-scroller expansion)

**Analog:** Self — major expansion of the existing walking skeleton.

**Imports pattern** (lines 1–4):
```js
import { onMount, onDestroy } from 'svelte'
import scrollama from 'scrollama'
import { t } from './i18n.js'
```
Phase 2 adds chart component imports after the existing three:
```js
import DeficitChart    from './DeficitChart.svelte'
import GDPChart        from './GDPChart.svelte'
import InstitutionsChart from './InstitutionsChart.svelte'
```

**State pattern** (lines 6–10) — extend with per-section step state:
```js
let stats      = $state(null)
let lembaga    = $state([])
let constants  = $state(null)
let lang       = $state('id')
let activeStep = $state(0)
```
Phase 2 replaces single `activeStep` with section-local state:
```js
let activeStepS1 = $state(0)
let activeStepS2 = $state(0)
let activeStepS3 = $state(0)
let activeStepS5 = $state(0)
let fetchError   = $state(null)
```

**CR-01 / CR-02 fix pattern — safeFetch + try/catch** (replaces lines 15–32):
```js
const safeFetch = url =>
  fetch(url).then(r => {
    if (!r.ok) throw new Error(`${r.status} ${r.statusText} — ${url}`)
    return r.json()
  })

onMount(async () => {
  try {
    const [s, d, c] = await Promise.all([
      safeFetch('/data/summary-stats.json'),
      safeFetch('/data/lembaga-totals.json'),
      safeFetch('/data/constants.json'),
    ])
    stats     = s
    lembaga   = d
    constants = c
  } catch (err) {
    fetchError = lang === 'id'
      ? 'Gagal memuat data. Coba muat ulang halaman.'
      : 'Failed to load data. Try refreshing the page.'
  }

  requestAnimationFrame(() => {
    // per-section scroller setup — see Scrollama Multi-Section pattern below
  })
})
```

**Multi-scroller setup pattern** (replaces lines 25–31):

Each section gets its own scrollama instance scoped to `[data-section="N"] [data-step]`. Store all instances in an array for unified teardown:
```js
let scrollers = []
const onResize = () => scrollers.forEach(s => s.resize())

// inside requestAnimationFrame callback:
const makeScroller = (sectionAttr, onEnter) => {
  const s = scrollama()
  s.setup({ step: `[data-section="${sectionAttr}"] [data-step]`, offset: 0.5 })
   .onStepEnter(({ index }) => onEnter(index))
  return s
}
scrollers = [
  makeScroller('s1', i => { activeStepS1 = i }),
  makeScroller('s2', i => { activeStepS2 = i }),
  makeScroller('s3', i => { activeStepS3 = i }),
  makeScroller('s5', i => { activeStepS5 = i }),
]
window.addEventListener('resize', onResize)
```

**onDestroy pattern** (lines 34–37 — extend to all scrollers):
```js
onDestroy(() => {
  scrollers.forEach(s => s?.destroy())
  window.removeEventListener('resize', onResize)
})
```

**Sticky column + pip indicator pattern** (lines 82–89) — copy for each scrolly section:
```svelte
<div class="sticky-col">
  <!-- chart or display text slot -->
  <div class="step-indicator" aria-hidden="true">
    {#each [0,1,2] as s}
      <div class="pip" class:active={activeStepS2 === s}></div>
    {/each}
  </div>
</div>
```
S1 has no pip indicator (single step — omit the `step-indicator` div entirely).

**Step card pattern** (lines 93–119) — copy for each step:
```svelte
<div class="step" data-step="0">
  <div class="step-card">
    <span class="step-num">{t[lang].stepCounter(1, 3)}</span>
    <h3>{t[lang].s2Step1Heading}</h3>
    <p>{t[lang].s2Step1Body}</p>
  </div>
</div>
```
Note: Phase 1 stub used `<p>` with no `<h3>`. Phase 2 adds the `<h3>` inside `.step-card` per the UI-SPEC layout contract.

**Loading/error state pattern** (lines 62–74) — copy for S4 stats block:
```svelte
{#if stats}
  <div class="hero-stat">
    <div class="hero-number">Rp {fmtT(stats.totalPagu)} T</div>
  </div>
{:else}
  <div class="hero-stat loading-pulse">
    <div class="hero-number">Rp — T</div>
    <div class="hero-sublabel">{t[lang].loading}</div>
  </div>
{/if}
```
For S4: replace `hero-stat` / `hero-number` class names with section-specific equivalents; keep the `loading-pulse` class and `{:else}` pattern. For chart components: pass `null`-check to component and let it render SVG skeleton internally.

**CSS token system** (lines 129–162) — no additions. All Phase 2 styles use existing tokens. New CSS sections added inside the `<style>` block follow the comment-divider convention:
```css
/* ── S1 Hook ── */
/* ── S2 Deficit ── */
/* ── S3 GDP ── */
/* ── S4 Dataset ── */
/* ── S5+S6 Institutions ── */
```

**Scrolly section wrapper CSS** (lines 291–399) — `.scrolly`, `.sticky-col`, `.steps-col`, `.step`, `.step-card` classes are reused unchanged across all sections. The `data-section` attribute is added to the `<section>` element for scroller scoping — not a new CSS class. Each new `<section class="scrolly">` gets `data-section="sN"`:
```svelte
<section class="scrolly" data-section="s2" id="s2">
```

---

### `dashboard/src/i18n.js` (utility, bilingual key store)

**Analog:** Self — flat `t[lang].key` pattern extended with S1–S6 keys.

**Existing key pattern** (lines 1–26) — all keys are direct string values or simple functions on a flat object. No nesting:
```js
export const t = {
  id: {
    toggleLabel:     'English',
    scrollCue:       'gulir untuk menjelajahi ↓',
    stepCounter:     (n, total) => `${n} / ${total}`,
    // ... flat string keys
  },
  en: {
    toggleLabel:     'Indonesia',
    // ... flat string keys
  },
}
```

**Extension pattern** — append new keys to both `id` and `en` objects in the same order. Group by section with an inline comment:
```js
export const t = {
  id: {
    // ... existing keys unchanged ...

    // S1
    s1Eyebrow:          'S1 · HOOK',
    s1DisplayLine1:     'Ikuti jejaknya…',
    s1DisplayLine2:     'Ke mana perginya uang rakyat?',
    s1StepHeading:      'Pemerintah berjanji efisiensi.',
    s1StepBody:         'Sejak awal 2024…',
    s1NewsLinkLabel:    'Baca artikel →',
    s1Disclaimer:       'Tautan menuju sumber berita resmi.',
    s1Link1Label:       '…',   // anchor text for news link 1
    s1Link2Label:       '…',   // anchor text for news link 2

    // S2 — APBN Deficit (keys per UI-SPEC table)
    s2Eyebrow:          'S2 · APBN 2024–2026',
    // ... (full list in UI-SPEC §Copywriting Contract)

    // S3 — GDP
    // S4 — Dataset Overview
    // S5 — Top Institutions
    // S6 — Re-rank
    fetchError: 'Gagal memuat data. Coba muat ulang halaman.',
  },
  en: {
    // ... mirror in English ...
    fetchError: 'Failed to load data. Try refreshing the page.',
  },
}
```

---

### `dashboard/src/DeficitChart.svelte` (chart component, transform)

**Analog:** `dashboard/src/App.svelte` — the component props, `$state`/`$derived` runes, and SVG rendering patterns. No existing dedicated chart component exists (BarChart.svelte was deleted).

**Props pattern** — use `$props()` rune matching existing BarChart convention:
```js
let { data = null, step = 0, lang = 'id' } = $props()
```
`data` is the `constants.apbn.deficit` object: `{ oct2024, fy2025, q1_2026 }` all negative IDR integers.

**Derived values pattern** — D3 or manual scale computation using `$derived`:
```js
import { scaleLinear } from 'd3'

const STACK_WIDTH_DESKTOP = 64
const STACK_WIDTH_MOBILE  = 44
const MAX_HEIGHT          = 200   // px cap for coin stack
const TRIL_PER_PX         = 2     // 1 T IDR = 2px height

// Points: [{ key, label, value_T, stackHeight }]
let points = $derived([
  { key: 'oct2024', label: 'Okt 2024', value: Math.abs(data?.oct2024 ?? 0) / 1e12 },
  { key: 'fy2025',  label: '2025',     value: Math.abs(data?.fy2025  ?? 0) / 1e12 },
  { key: 'q1_2026', label: 'TW I 2026',value: Math.abs(data?.q1_2026 ?? 0) / 1e12 },
].map(p => ({ ...p, height: Math.min(p.value * TRIL_PER_PX, MAX_HEIGHT) })))
```

**SVG skeleton (loading) pattern** — when `data` is null:
```svelte
{#if !data}
  <svg width="100%" height="200">
    <rect width="100%" height="200" fill="var(--bg-alt)" rx="2"/>
    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
          font-family="JetBrains Mono, monospace" font-size="11"
          fill="var(--muted)">{lang === 'id' ? 'memuat…' : 'loading…'}</text>
  </svg>
{:else}
  <!-- coin stack SVG -->
{/if}
```

**Isometric coin stack SVG structure** — one `<g>` per data point, `opacity` driven by active step:
```svelte
{#each points as p, i}
  <g class="coin-stack" opacity={step === i ? 1 : 0.4}
     style="transform: scaleY({step === i ? 1.02 : 1}); transition: transform 0.3s ease, opacity 0.3s ease">
    <!-- coin layers: repeated ellipses stacked at 8px intervals -->
    <!-- top face: fill rgba(201,168,76,0.85) -->
    <!-- edge face: fill rgba(201,168,76,0.45), height 8px -->
    <!-- value label above: font-size="11" font-family="JetBrains Mono" fill="rgba(237,232,220,0.7)" -->
    <!-- period label below: font-size="10" fill="rgba(237,232,220,0.35)" -->
  </g>
{/each}
<!-- baseline rule -->
<line x1="0" x2="100%" y1={baseline} y2={baseline} stroke="var(--border)" stroke-width="1"/>
```

**Style block** — scoped styles only; no new CSS tokens. Uses `:global()` only for cross-component resets if needed:
```svelte
<style>
  svg { width: 100%; height: auto; display: block; }
  @media (max-width: 480px) {
    /* stack-width handled via JS variable passed to SVG attrs, not CSS */
  }
</style>
```

---

### `dashboard/src/GDPChart.svelte` (chart component, transform)

**Analog:** Same as `DeficitChart.svelte` — structurally identical pattern, different data shape.

**Props pattern:**
```js
let { data = null, step = 0, lang = 'id' } = $props()
```
`data` is `constants.gdp.konsumsi_pemerintah`: `{ q1_2025: -3.24, q2_2025: 10.93, q3_2025: 5.08, q4_2025: 4.41, q1_2026: 7.21 }`.

**Key difference from DeficitChart** — values are YoY percentages, not absolute IDR. Negative value (Q1 2025) renders as a coin pit below the baseline:
```svelte
<!-- For negative value: coins rendered below baseline, fill rgba(196,66,66,0.6) -->
<!-- Label: "-3.24%" in color: var(--red) -->
<!-- For positive values: same coin stack pattern as DeficitChart -->
```

**Step mapping** (4 steps, 5 data points — step 2 covers Q3+Q4 together):
```js
// Step 0 → highlight q1_2025
// Step 1 → highlight q2_2025
// Step 2 → highlight q3_2025 AND q4_2025 (both active)
// Step 3 → highlight q1_2026
let activeKeys = $derived(
  step === 0 ? ['q1_2025'] :
  step === 1 ? ['q2_2025'] :
  step === 2 ? ['q3_2025', 'q4_2025'] :
               ['q1_2026']
)
```

**Scale pattern** — stack height maps to absolute percentage value (1% = ~10px, capped at 140px mobile):
```js
const PCT_PER_PX = 10  // 1% = 10px visual height
```

**Everything else** (SVG skeleton, opacity, period labels, style block) copies directly from DeficitChart pattern above.

---

### `dashboard/src/InstitutionsChart.svelte` (chart component, event-driven + D3 animated re-sort)

**Analog:** `dashboard/src/App.svelte` scrollama step pattern + D3 named import convention.

**Props pattern:**
```js
let { data = [], step = 0, lang = 'id' } = $props()
```
`data` is the `lembaga` array (lembaga-totals.json). Each record has: `rank`, `name`, `total`, `count`, `ownerType`, `flaggedCount`, `flaggedPagu`, `highCount`, `medCount`.

**D3 import pattern** (follows project convention of named imports):
```js
import { scaleBand, scaleLinear, select, transition, easeCubicInOut } from 'd3'
```

**Sort mode derived from step:**
```js
// Steps 0–1 = S5 (sort by total pagu); Step 2+ = S6 (sort by high-pagu)
let sortedData = $derived(
  step >= 2
    ? [...data].sort((a, b) => (b.highCount * /* avg high pagu */ 1) - (a.highCount * 1))
    : [...data].sort((a, b) => b.total - a.total)
)
```
Note: `highCount` alone is not the sort key — use `flaggedPagu` or a derived `highPagu` field. The data contract must be confirmed: if `lembaga-totals.json` does not carry per-label pagu breakdown, InstitutionsChart sorts by `highCount`. See **No Analog Found** note below.

**D3 animated re-sort transition** (fires on `step` change via `$effect`):
```js
import { onMount } from 'svelte'

$effect(() => {
  if (!svgEl) return
  const svg = select(svgEl)

  // recalculate yScale from sortedData
  const names  = sortedData.map(d => d.name)
  const yScale = scaleBand().domain(names).range([0, innerH]).padding(0.2)

  svg.selectAll('g.bar-group')
     .transition()
     .duration(600)
     .ease(easeCubicInOut)
     .attr('transform', d => `translate(0, ${yScale(d.name)})`)

  // opacity transition for non-flagged bars on S6
  svg.selectAll('rect.seg-clean, rect.seg-low')
     .transition()
     .duration(400)
     .attr('opacity', step >= 2 ? 0.2 : 1)
})
```

**SVG skeleton pattern** — same as DeficitChart:
```svelte
{#if !data.length}
  <svg width="100%" height="200">
    <rect width="100%" height="200" fill="var(--bg-alt)" rx="2"/>
    <text ...>{lang === 'id' ? 'memuat…' : 'loading…'}</text>
  </svg>
{:else}
  <svg bind:this={svgEl} ...>
    <!-- stacked bars -->
  </svg>
{/if}
```

**Stacked bar SVG pattern** — each institution is a `<g class="bar-group">` with `<rect>` segments in order: clean → low → med → high (left to right):
```svelte
{#each sortedData as d}
  <g class="bar-group" transform="translate(0, {yScale(d.name)})">
    <!-- clean segment -->
    <rect class="seg-clean" x={0}       width={xScale(cleanPagu(d))} height={barH} fill="var(--clean)"/>
    <!-- low segment (not in data; infer from total - flaggedPagu) -->
    <!-- med segment -->
    <rect class="seg-med"   x={xMed(d)} width={xScale(medPagu(d))}  height={barH} fill="var(--amber)"/>
    <!-- high segment -->
    <rect class="seg-high"  x={xHigh(d)} width={xScale(highPagu(d))} height={barH} fill="var(--red)"/>
    <!-- institution name label -->
    <text x="-4" y={barH/2} text-anchor="end" dominant-baseline="middle"
          font-size="12" font-family="Source Serif 4, serif"
          fill="rgba(237,232,220,0.82)">{shortName(d.name, 18)}</text>
  </g>
{/each}
```

**Name truncation helper** (follow `shortName` convention from CLAUDE.md):
```js
const shortName = (name, max = 18) =>
  name.length > max ? name.slice(0, max - 1) + '…' : name
```

**Legend pattern** (below sticky panel, above pip row):
```svelte
<div class="chart-legend">
  <span class="legend-item"><span class="swatch" style="background:var(--red)"></span>{t[lang].s5LegendHigh}</span>
  <span class="legend-item"><span class="swatch" style="background:var(--amber)"></span>{t[lang].s5LegendMed}</span>
  <span class="legend-item"><span class="swatch" style="background:var(--clean)"></span>{t[lang].s5LegendLow}</span>
</div>
```

---

### `dashboard/src/BarChart.svelte` — DELETE

File does not exist (already deleted per repo state). No action needed. Remove any remaining import references in `App.svelte` if present.

---

### `dashboard/scripts/prepare-data.py` (data pipeline, CR-03 fix)

**Analog:** Self — single targeted fix at lines 67–68.

**Current pattern** (lines 67–68 — to be replaced):
```python
label_pagu["unflagged"]   = total_pagu   - sum(label_pagu.values())
label_counts["unflagged"] = total_records - sum(label_counts.values())
```

**CR-03 fix pattern** (from 01-REVIEW.md §CR-03):
```python
unflagged_pagu   = total_pagu   - sum(label_pagu.values())
unflagged_counts = total_records - sum(label_counts.values())

if unflagged_pagu < 0:
    print(f"WARNING: unflagged_pagu is negative ({unflagged_pagu}); check shard consistency")
if unflagged_counts < 0:
    print(f"WARNING: unflagged_counts is negative ({unflagged_counts}); check shard consistency")

label_pagu["unflagged"]   = max(unflagged_pagu, 0)
label_counts["unflagged"] = max(unflagged_counts, 0)
```

---

### `dashboard/src/main.js` (entry point, WR-05 fix)

**Analog:** Self — add two missing font weight imports.

**Current pattern** (lines 1–5):
```js
import '@fontsource/libre-baskerville/400.css';
import '@fontsource/libre-baskerville/700.css';
import '@fontsource/libre-baskerville/400-italic.css';
import '@fontsource/source-serif-4/400.css';
import '@fontsource/jetbrains-mono/400.css';
```

**WR-05 fix pattern** (from 01-REVIEW.md §WR-05):
```js
import '@fontsource/libre-baskerville/400.css';
import '@fontsource/libre-baskerville/700.css';
import '@fontsource/libre-baskerville/400-italic.css';
import '@fontsource/source-serif-4/300.css';
import '@fontsource/source-serif-4/400.css';
import '@fontsource/source-serif-4/600.css';
import '@fontsource/jetbrains-mono/400.css';
```

---

## Shared Patterns

### $state / $derived rune usage
**Source:** `dashboard/src/App.svelte` lines 6–10
**Apply to:** All new `.svelte` files (DeficitChart, GDPChart, InstitutionsChart)
```js
let someState = $state(initialValue)
let derived   = $derived(someState + 1)
let { prop = defaultValue } = $props()
```
Rules: `$state` for mutable reactive values, `$derived` for computed values, `$props()` for component inputs. No TypeScript annotations.

### CSS token reference (no hardcoded hex)
**Source:** `dashboard/src/App.svelte` lines 129–162 (`:global(:root)` block) + style rules
**Apply to:** All new components — all CSS color references use `var(--name)` tokens. Inline SVG `fill`/`stroke` that cannot use CSS variables use the rgba derivations documented in UI-SPEC.md (e.g., `rgba(201,168,76,0.85)` for coin top face).

### Eyebrow label pattern
**Source:** `dashboard/src/App.svelte` lines 198–206
**Apply to:** Each scrolly section's sticky panel header
```svelte
<div class="eyebrow">{t[lang].s2Eyebrow}</div>
```
```css
.eyebrow {
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  font-size: 0.7rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--gold);
  opacity: 0.85;
}
```

### 44px touch target (MOB-03)
**Source:** `dashboard/src/App.svelte` lines 269–288 (lang-toggle)
**Apply to:** S1 news article links, S2/S3 source citation links
```css
a.news-link {
  display: inline-block;
  min-height: 44px;
  padding: 8px 0;
}
```

### Responsive mobile breakpoint
**Source:** `dashboard/src/App.svelte` lines 387–399
**Apply to:** Each new scrolly section. All sections share the same 800px breakpoint:
```css
@media (max-width: 800px) {
  .scrolly { flex-direction: column; }
  .sticky-col {
    position: relative;
    width: 100%;
    height: auto;
    min-height: 60vh;
    border-right: none;
    border-bottom: 1px solid var(--border);
  }
  .steps-col { width: 100%; padding: 0 1.5rem; }
  .step-indicator { display: none; }
}
```

### loading-pulse animation
**Source:** `dashboard/src/App.svelte` lines 249–250
**Apply to:** S4 stats block loading state, hero pattern reuse
```css
.loading-pulse { animation: pulse 1.8s ease-in-out infinite; }
@keyframes pulse { 0%,100% { opacity:0.5 } 50% { opacity:0.9 } }
```

### Print format helpers
**Source:** `dashboard/src/App.svelte` lines 39–40
**Apply to:** S4 stats block, any inline pagu formatting
```js
const fmtT   = v => (v / 1e12).toFixed(1)
const fmtNum = v => v.toLocaleString('id-ID')
```

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `DeficitChart.svelte` isometric coin SVG | component (chart) | transform | No isometric/custom SVG chart exists in the codebase. Implement from SVG primitives per UI-SPEC §Isometric Coin Stack. |
| `GDPChart.svelte` negative-value pit | component (chart) | transform | No below-baseline / inverted visual exists. Build from UI-SPEC spec: same coin shape, `rgba(196,66,66,0.6)` fill, rendered below baseline `<line>`. |
| `InstitutionsChart.svelte` D3 re-sort | component (chart) | event-driven | BarChart.svelte (the closest analog) was deleted. D3 `transition().duration(600).ease(easeCubicInOut)` pattern must be built fresh per UI-SPEC §D3 Re-sort Transition. Consult RESEARCH.md for D3 `scaleBand` + animated sort examples. |
| `InstitutionsChart.svelte` per-label pagu | component (chart) | transform | `lembaga-totals.json` carries `flaggedPagu` (total flagged), `highCount`, `medCount` but NOT per-label pagu values. S6 re-sort by high-pagu will use `highCount` as a proxy, or planner must decide whether to extend `prepare-data.py` to output `highPagu` and `medPagu` fields. |

---

## Data Shape Notes (for planner)

`lembaga-totals.json` per-record fields available for InstitutionsChart:
- `total` — total pagu (all packages)
- `flaggedPagu` — pagu of all flagged (med + high) packages
- `highCount` — count of high-flagged packages (no highPagu field)
- `medCount` — count of med-flagged packages (no medPagu field)
- `flaggedCount` — total flagged package count

**Gap:** `highPagu` and `medPagu` (pagu amounts per label tier) are not in the current output. The planner should either:
1. Extend `prepare-data.py` to output `highPagu` and `medPagu` per institution (recommended — enables accurate stacked bar segments), or
2. Use `highCount / flaggedCount * flaggedPagu` as an approximation (lossy).

`constants.json` fields available for DeficitChart and GDPChart are fully documented above.

---

## Metadata

**Analog search scope:** `dashboard/src/`, `dashboard/scripts/`, `dashboard/public/data/`
**Files scanned:** 7 (App.svelte, i18n.js, main.js, prepare-data.py, constants.json, lembaga-totals.json[partial], 01-REVIEW.md)
**Pattern extraction date:** 2026-05-13
