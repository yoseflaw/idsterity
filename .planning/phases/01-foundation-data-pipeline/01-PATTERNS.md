# Phase 1: Foundation & Data Pipeline — Pattern Map

**Mapped:** 2026-05-13
**Files analyzed:** 12 new/modified files
**Analogs found:** 10 / 12 (2 have no analog — i18n.js and constants.json are new patterns)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `dashboard/src/App.svelte` | component (root) | request-response + event-driven | `dashboard/src/App.svelte` (POC) | exact — rewrite from same file |
| `dashboard/src/BarChart.svelte` | component (chart) | transform | `dashboard/src/BarChart.svelte` (POC) | exact — rewrite from same file |
| `dashboard/src/main.js` | entry-point | request-response | `dashboard/src/main.js` (POC) | exact — extend same file |
| `dashboard/src/i18n.js` | utility (i18n) | transform | none | no analog |
| `dashboard/index.html` | config | — | `dashboard/index.html` (POC) | exact — modify same file |
| `dashboard/scripts/prepare-data.py` | service (ETL) | batch | `dashboard/scripts/prepare-data.py` (POC) | exact — extend same file |
| `dashboard/scripts/word-cloud.py` | service (ETL) | batch | `dashboard/scripts/prepare-data.py` | role-match |
| `dashboard/public/data/constants.json` | data file | — | none | no analog |
| `dashboard/public/data/wordcloud-all.json` | data file | — | `dashboard/public/data/lembaga-totals.json` | role-match (output schema) |
| `dashboard/public/data/wordcloud-central.json` | data file | — | `dashboard/public/data/lembaga-totals.json` | role-match (output schema) |
| `dashboard/public/data/wordcloud-district.json` | data file | — | `dashboard/public/data/lembaga-totals.json` | role-match (output schema) |
| `dashboard/public/data/wordcloud-lembaga.json` | data file | — | `dashboard/public/data/lembaga-totals.json` | role-match (output schema) |

---

## Pattern Assignments

### `dashboard/src/App.svelte` (component, request-response + event-driven)

**Analog:** `dashboard/src/App.svelte` (POC — to be deleted, but read before discarding)

**Imports pattern** (lines 1–4):
```svelte
<script>
  import { onMount } from 'svelte'
  import BarChart from './BarChart.svelte'
```

**Phase 1 imports will change to:**
```svelte
<script>
  import { onMount } from 'svelte'
  import BarChart from './BarChart.svelte'
  import { t }    from './i18n.js'
  // scrollama imported via npm — no CDN
  import scrollama from 'scrollama'
```

**Reactive state pattern** (lines 5–7):
```svelte
  let data       = $state([])
  let stats      = $state(null)
  let activeStep = $state(0)
```

**Phase 1 additions follow same pattern:**
```svelte
  let lang          = $state('id')        // D-11: default Indonesian
  let activeSection = $state(0)           // top-level section tracking
```

**Data fetch pattern** (lines 9–16) — Promise.all, no try/catch, direct assignment:
```svelte
  onMount(async () => {
    const [d, s] = await Promise.all([
      fetch('/data/lembaga-totals.json').then(r => r.json()),
      fetch('/data/summary-stats.json').then(r => r.json()),
    ])
    data  = d
    stats = s
    // scrollama init follows here (replaces IntersectionObserver block)
  })
```

**Scroll driver pattern** (lines 17–28) — existing IntersectionObserver to be replaced by scrollama. The `$effect` vs `onMount` decision is Claude's discretion (D-04 note). Existing onMount block is the reference pattern for lifecycle placement:
```svelte
    requestAnimationFrame(() => {
      const stepEls = document.querySelectorAll('[data-step]')
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            activeStep = Number(entry.target.dataset.step)
          }
        })
      }, { rootMargin: '-38% 0px -38% 0px', threshold: 0 })
      stepEls.forEach(el => observer.observe(el))
    })
```

**Scrollama replacement target** (D-04, D-05 — offset: 0.5, onStepEnter callback):
- Initialize scrollama scroller in `onMount` after fetch
- `.setup({ step: '[data-step]', offset: 0.5 })`
- `.onStepEnter(({ index }) => { activeStep = index })`
- Destroy scroller in `onDestroy` or cleanup return of `$effect`

**Loading state pattern** (lines 46–58) — `{#if stats}` conditional, loading-pulse class on fallback:
```svelte
      {#if stats}
        <div class="hero-stat">
          <div class="hero-number">Rp {fmtT(stats.totalPagu)} T</div>
          <div class="hero-sublabel">…</div>
        </div>
      {:else}
        <div class="hero-stat loading-pulse">
          <div class="hero-number">Rp — T</div>
          <div class="hero-sublabel">memuat data…</div>
        </div>
      {/if}
```

**Step pip indicator pattern** (lines 100–105) — `{#each}` over step indices, `class:active`:
```svelte
        <div class="step-indicator">
          {#each [0,1,2,3] as s}
            <div class="pip" class:active={activeStep === s}></div>
          {/each}
        </div>
```

**Phase 1 pip must add:** `aria-hidden="true"` on `.step-indicator` container.

**Scroll cue pattern** (line 59):
```svelte
      <a class="scroll-cue" href="#story">gulir untuk menjelajahi ↓</a>
```

**Phase 1 scroll cue uses i18n:** `{t[lang].scrollCue}`

**Language toggle** (new in Phase 1 — no analog exists):
```svelte
  <button
    class="lang-toggle"
    onclick={() => { lang = lang === 'id' ? 'en' : 'id' }}
  >
    {t[lang].toggleLabel}
  </button>
```
- `position: fixed; top: 16px; right: 16px; z-index: 100`
- Minimum 44×44px touch target (MOB-03)
- Pill shape, JetBrains Mono 11px

**CSS token block** (lines 191–204) — `:global(:root)` pattern to EXPAND with full token set from UI-SPEC:
```css
  :global(:root) {
    --bg:       #0e0d0c;
    --bg-alt:   #141210;
    --bg-card:  #1a1714;
    --text:     #ede8dc;
    --muted:    #6a6055;
    --gold:     #c9a84c;
    --red:      #c44242;
    --amber:    #c4823a;
    --central:  #5b8ed4;
    --provinsi: #5ba882;
    --kabkota:  #c4a04a;
    --border:   rgba(237,232,220,0.08);
  }
```

**Phase 1 adds spacing tokens (not present in POC):**
```css
    --space-xs:   4px;
    --space-sm:   8px;
    --space-md:   16px;
    --space-lg:   24px;
    --space-xl:   32px;
    --space-2xl:  48px;
    --space-3xl:  64px;
    --space-page: 96px;
    --clean:      #3a6b52;
```

**Phase 1 adds data encoding token missing from POC:**
```css
    --clean:      #3a6b52;
```

**Animation patterns** (lines 291–308) — copy exactly; these match the UI-SPEC contracts:
```css
  .loading-pulse { animation: pulse 1.8s ease-in-out infinite; }
  @keyframes pulse { 0%,100% { opacity:0.5 } 50% { opacity:0.9 } }

  .scroll-cue {
    display: inline-block;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem;
    letter-spacing: 0.15em;
    color: var(--muted);
    text-decoration: none;
    animation: bob 2.2s ease-in-out infinite;
    transition: color 0.2s;
  }
  .scroll-cue:hover { color: var(--gold); }
  @keyframes bob {
    0%,100% { transform: translateY(0); }
    50%      { transform: translateY(7px); }
  }
```

**Responsive pattern** (lines 495–506) — keep as-is; update `height: 100vh` → `height: 100dvh` per UI-SPEC:
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
  }
```

**pip indicator hidden on mobile** — add inside the media query:
```css
    .step-indicator { display: none; }
```

---

### `dashboard/src/BarChart.svelte` (component, transform)

**Analog:** `dashboard/src/BarChart.svelte` (POC — to be deleted)

**Props pattern** (line 4):
```svelte
  let { data = [], step = 0 } = $props()
```

**Phase 1 adds `lang` prop** (flows down from App.svelte per D-10):
```svelte
  let { data = [], step = 0, lang = 'id' } = $props()
```

**Derived D3 scales pattern** (lines 10–18):
```svelte
  const SHOW = 15
  const margin = { top: 32, right: 100, bottom: 52, left: 230 }
  const innerW  = 390

  let chartData = $derived(data.slice(0, SHOW))
  let innerH    = $derived(chartData.length * 38)
  let svgW      = $derived(innerW + margin.left + margin.right)
  let svgH      = $derived(innerH + margin.top + margin.bottom)

  let xMax = $derived(chartData.length ? Math.max(...chartData.map(d => d.total)) : 1)
  let x    = $derived(scaleLinear().domain([0, xMax]).range([0, innerW]).nice())
  let y    = $derived(scaleBand().domain(chartData.map(d => d.name)).range([0, innerH]).padding(0.3))
  let ticks = $derived(x.ticks(4))
```

**Color constant object** (lines 20–28) — replace hardcoded hex with CSS var references where possible; keep `C` object for SVG `fill` attributes (SVG does not support CSS vars in all contexts, so literal hex is retained inside SVG):
```svelte
  const C = {
    muted:    '#3d3830',
    central:  '#5b8ed4',
    provinsi: '#5ba882',
    kabkota:  '#c4a04a',
    clean:    '#3a6b52',
    high:     '#c44242',
    med:      '#c4823a',
  }
```

**Step-driven fill functions** (lines 37–57) — copy pattern:
```svelte
  function mainFill(d) {
    if (step <= 0) return C.muted
    if (step === 1) return C[d.ownerType] ?? C.muted
    return C.clean
  }

  function mainWidth(d) {
    if (step >= 2 && d.flaggedPagu > 0)
      return x(Math.max(0, d.total - d.flaggedPagu))
    return x(d.total)
  }

  function flagFill(d) {
    return d.highCount > 0 ? C.high : C.med
  }

  function nameFill(d) {
    if (step === 3 && d.flaggedCount === 0) return 'rgba(237,232,220,0.2)'
    return 'rgba(237,232,220,0.82)'
  }
```

**Format helpers** (lines 58–60):
```svelte
  const fmtT      = v => `${(v / 1e12).toFixed(1)}T`
  const shortName = n => n.length > 28 ? n.slice(0, 27) + '…' : n
  const stepLabel = $derived(STEP_LABELS[Math.max(0, Math.min(step, 3))] ?? STEP_LABELS[0])
```

**SVG bar rendering with inline transitions** (lines 92–109) — copy inline `style` transition pattern:
```svelte
        <rect
          x="0" y={yp} height={bh} rx="2"
          style="
            width: {mw}px;
            fill: {mainFill(d)};
            transition: width 0.65s cubic-bezier(0.4,0,0.2,1), fill 0.45s ease;
          "
        />
```

**`{@const}` inside `{#each}` pattern** (lines 84–88):
```svelte
      {#each chartData as d (d.name)}
        {@const yp  = y(d.name)}
        {@const bh  = y.bandwidth()}
        {@const mw  = mainWidth(d)}
        {@const fw  = x(d.flaggedPagu)}
        {@const fx  = x(Math.max(0, d.total - d.flaggedPagu))}
```

---

### `dashboard/src/main.js` (entry-point, extend)

**Analog:** `dashboard/src/main.js` (POC — do not modify mount call)

**Existing pattern** (lines 1–4) — full file, stays as-is:
```js
import { mount } from 'svelte'
import App from './App.svelte'

mount(App, { target: document.getElementById('app') })
```

**Phase 1 prepends `@fontsource` imports before the mount block** (UI-SPEC FOUND-06):
```js
import '@fontsource/libre-baskerville/400.css';
import '@fontsource/libre-baskerville/700.css';
import '@fontsource/libre-baskerville/400-italic.css';
import '@fontsource/source-serif-4/400.css';
import '@fontsource/jetbrains-mono/400.css';

import { mount } from 'svelte'
import App from './App.svelte'

mount(App, { target: document.getElementById('app') })
```

---

### `dashboard/src/i18n.js` (utility, transform)

**Analog:** None — first i18n file in the project.

**Pattern from CONTEXT.md D-09:** Named export `t`, nested `id` / `en` objects, flat key structure. Use ES module export (matches `main.js` ES module type in `package.json`).

**Skeleton to produce** (keys from UI-SPEC Copywriting Contract):
```js
export const t = {
  id: {
    toggleLabel:  'English',
    scrollCue:    'gulir untuk menjelajahi ↓',
    loading:      'memuat data…',
    eyebrow:      'idsterity · Analisis Pengadaan Indonesia 2026',
    heroLine1:    'Ke mana perginya',
    heroLine2:    'uang rakyat?',
    sectionStub:  '[bagian sedang disiapkan]',
    stepCounter:  (n, total) => `${n} / ${total}`,
  },
  en: {
    toggleLabel:  'Indonesia',
    scrollCue:    'scroll to explore ↓',
    loading:      'loading data…',
    eyebrow:      'idsterity · Indonesia 2026 Procurement Analysis',
    heroLine1:    'Where did the',
    heroLine2:    "people's money go?",
    sectionStub:  '[section in preparation]',
    stepCounter:  (n, total) => `${n} / ${total}`,
  },
}
```

**No framework, no external dependency.** Phase 2 adds keys directly to this file as narrative copy is written (D-09).

---

### `dashboard/index.html` (config, modify)

**Analog:** `dashboard/index.html` (POC — modify in place)

**Lines to remove** (lines 7–9 in current file):
```html
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Source+Serif+4:opsz,wght@8..60,300;8..60,400;8..60,600&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
```

**File otherwise stays identical** — global reset `<style>`, `#app` div, `main.js` script tag are all untouched.

---

### `dashboard/scripts/prepare-data.py` (service/ETL, batch — extend)

**Analog:** `dashboard/scripts/prepare-data.py` (same file — extend, do not rewrite)

**Script header pattern** (lines 1–11) — keep PEP 723 inline metadata and module docstring:
```python
# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""
Produces two data files for the dashboard:
  public/data/lembaga-totals.json  — top-30 institutions with flag counts
  public/data/summary-stats.json   — overall dataset statistics
Run: uv run scripts/prepare-data.py
"""
import json, pathlib, collections
```

**Path constant pattern** (lines 13–15):
```python
DATA_DIR = pathlib.Path(__file__).parent.parent.parent / "inaproc-ds" / "outputs"
OUT_DIR  = pathlib.Path(__file__).parent.parent / "public" / "data"
TOP_N    = 30
```

**defaultdict accumulation pattern** (lines 17–30) — extend S4 aggregates using same pattern:
```python
totals, counts, owner_types = collections.defaultdict(int), collections.defaultdict(int), {}
total_pagu, total_records = 0, 0

for path in sorted(DATA_DIR.glob("*.jsonl")):
    for line in path.open():
        r = json.loads(line)
        name = r.get("lembaga") or "Unknown"
        pagu = r.get("pagu") or 0
        totals[name]  += pagu
        counts[name]  += 1
        total_pagu    += pagu
        total_records += 1
        if name not in owner_types:
            owner_types[name] = r.get("ownerType") or "unknown"
```

**Output write pattern** (lines 77–79):
```python
OUT_DIR.mkdir(parents=True, exist_ok=True)
(OUT_DIR / "lembaga-totals.json").write_text(json.dumps(lembaga_totals, ensure_ascii=False, indent=2))
(OUT_DIR / "summary-stats.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2))
```

**Print confirmation pattern** (lines 81–82):
```python
print(f"lembaga-totals.json → {len(lembaga_totals)} records")
print(f"summary-stats.json  → {summary}")
```

**S4 aggregate fields to add in the JSONL loop** (new fields alongside existing accumulators):
- `jenis_counts` — `defaultdict(lambda: defaultdict(int))` keyed by lembaga, then `jenisPengadaan`
- `metode_counts` — same shape, keyed by `metode`
- `pagu_by_month` — `defaultdict(lambda: defaultdict(int))` keyed by lembaga, then `pemilihanDate`

These are appended to existing `lembaga_totals` list entries as new keys before writing.

---

### `dashboard/scripts/word-cloud.py` (service/ETL, batch — new file)

**Analog:** `dashboard/scripts/prepare-data.py` (role-match — same Python batch ETL pattern)

**Full script structure to copy from analog:**

**Header** (copy and adapt):
```python
# /// script
# requires-python = ">=3.11"
# dependencies = ["nlp-id"]
# ///
"""
Produces word-frequency JSON files for the word cloud component:
  public/data/wordcloud-all.json
  public/data/wordcloud-central.json
  public/data/wordcloud-district.json
  public/data/wordcloud-lembaga.json
Run: uv run scripts/word-cloud.py
"""
import json, pathlib, collections
```

**Path constants** (copy pattern):
```python
DATA_DIR = pathlib.Path(__file__).parent.parent.parent / "inaproc-ds" / "outputs"
OUT_DIR  = pathlib.Path(__file__).parent.parent / "public" / "data"
```

**JSONL iteration pattern** (copy from prepare-data.py lines 20–31):
```python
for path in sorted(DATA_DIR.glob("*.jsonl")):
    for line in path.open():
        r = json.loads(line)
        # extract r.get("paket"), r.get("ownerType"), r.get("lembaga")
```

**Output write pattern** (copy from prepare-data.py lines 77–82):
```python
(OUT_DIR / "wordcloud-all.json").write_text(json.dumps(result, ensure_ascii=False, indent=2))
print(f"wordcloud-all.json → {len(result)} words")
```

**Output schemas** (per D-06, D-07, D-08):

`wordcloud-all.json`, `wordcloud-central.json`, `wordcloud-district.json` — flat arrays:
```json
[
  { "word": "konstruksi", "count": 4821 },
  { "word": "gedung",     "count": 2103 }
]
```

`wordcloud-lembaga.json` — keyed object (D-08):
```json
{
  "Kementerian Pekerjaan Umum": [
    { "word": "jalan", "count": 952 },
    { "word": "jembatan", "count": 411 }
  ]
}
```

**Stopword list** (Claude's discretion per D-51): procurement boilerplate to filter includes at minimum: `pengadaan`, `jasa`, `barang`, `pekerjaan`, `konstruksi`, `kegiatan`, `tahun`, `paket`, `dll`, `dan`, `yang`, `untuk`, `di`, `ke`, `dari`, `dalam`, `dengan`, `atau`, `adalah`, `pada`.

---

### `dashboard/public/data/constants.json` (data file — new)

**Analog:** None — no comparable structured data file in the project.

**Pattern from CONTEXT.md:** Pre-baked static JSON served from `/data/`. Schema is Claude's discretion.

**Recommended schema** (camelCase keys, matching existing `lembaga-totals.json` convention):
```json
{
  "apbn": {
    "2026": 3613000000000000,
    "unit": "IDR"
  },
  "gdp": {
    "2025": 22144000000000000,
    "unit": "IDR"
  },
  "procurementShare": {
    "ofAPBN": 0.12,
    "ofGDP": 0.02
  }
}
```

**Fetch pattern** (follows existing pattern in App.svelte):
```js
fetch('/data/constants.json').then(r => r.json())
```

---

### `dashboard/public/data/wordcloud-*.json` (data files — generated)

**Analog:** `dashboard/public/data/lembaga-totals.json` — same directory, same serve path, same `fetch()` consumption pattern.

Files are outputs of `word-cloud.py`. Schemas documented under word-cloud.py section above (D-06, D-07, D-08). No manual authoring needed — these are generated artifacts.

---

## Shared Patterns

### CSS Custom Property Theming
**Source:** `dashboard/src/App.svelte` lines 191–204 (`:global(:root)` block)
**Apply to:** New `App.svelte` — expand this block to include all tokens from UI-SPEC checklist. No other file should define tokens.
```css
:global(:root) {
  --bg:       #0e0d0c;
  --bg-alt:   #141210;
  --bg-card:  #1a1714;
  --text:     #ede8dc;
  --muted:    #6a6055;
  --gold:     #c9a84c;
  --red:      #c44242;
  --amber:    #c4823a;
  --central:  #5b8ed4;
  --provinsi: #5ba882;
  --kabkota:  #c4a04a;
  --clean:    #3a6b52;
  --border:   rgba(237,232,220,0.08);
  --space-xs:   4px;  --space-sm:   8px;  --space-md:  16px;
  --space-lg:  24px;  --space-xl:  32px;  --space-2xl: 48px;
  --space-3xl: 64px;  --space-page: 96px;
}
```

### Svelte 5 Reactive State
**Source:** `dashboard/src/App.svelte` lines 5–7
**Apply to:** New `App.svelte` — all mutable values declared with `$state()`, all derived values with `$derived()`. No `writable` stores. No `let` without rune for reactive values.
```svelte
let data       = $state([])
let stats      = $state(null)
let activeStep = $state(0)
let lang       = $state('id')
```

### Props Declaration
**Source:** `dashboard/src/BarChart.svelte` line 4
**Apply to:** New `BarChart.svelte` and any new child components.
```svelte
let { data = [], step = 0, lang = 'id' } = $props()
```

### Fetch-Once at Mount (no error handling)
**Source:** `dashboard/src/App.svelte` lines 9–16
**Apply to:** New `App.svelte` — fetch `constants.json` alongside existing two fetches using same `Promise.all` pattern. Phase 1 does not add `.catch()` (error handling is Phase 4 scope).
```js
onMount(async () => {
  const [d, s, c] = await Promise.all([
    fetch('/data/lembaga-totals.json').then(r => r.json()),
    fetch('/data/summary-stats.json').then(r => r.json()),
    fetch('/data/constants.json').then(r => r.json()),
  ])
  data      = d
  stats     = s
  constants = c
})
```

### Section Divider Comments
**Source:** `dashboard/src/App.svelte` lines 37, 63, 91, 166
**Apply to:** New `App.svelte` — use `<!-- ━━━ SECTION NAME ━━━ -->` pattern for all major sections.
```svelte
<!-- ━━━ HERO ━━━ -->
<!-- ━━━ SCROLLY ━━━ -->
<!-- ━━━ CLOSING ━━━ -->
```

### Python ETL Script Structure
**Source:** `dashboard/scripts/prepare-data.py` lines 1–82
**Apply to:** `word-cloud.py` — PEP 723 header, single-line stdlib import, SCREAMING_SNAKE_CASE path constants, defaultdict accumulators, no error handling, `print()` confirmation at end.

### Font Declaration Order
**Source:** `dashboard/index.html` lines 7–9 (order of fonts in Google Fonts link)
**Apply to:** `main.js` `@fontsource` imports — maintain same font order: Libre Baskerville → Source Serif 4 → JetBrains Mono.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `dashboard/src/i18n.js` | utility (i18n) | transform | No internationalization exists in the codebase. Pattern defined in CONTEXT.md D-09 and UI-SPEC Copywriting Contract. |
| `dashboard/public/data/constants.json` | data file | — | No comparable APBN/GDP structured data file exists. Schema is Claude's discretion (CONTEXT.md §Claude's Discretion). |

---

## Metadata

**Analog search scope:** `dashboard/src/`, `dashboard/scripts/`, `dashboard/public/data/`, `dashboard/index.html`, `dashboard/src/main.js`
**Files scanned:** 7 source files read in full
**Pattern extraction date:** 2026-05-13
