# Architecture Research

**Project:** idsterity — bilingual Indonesian procurement scrollytelling site
**Researched:** 2026-05-13
**Overall confidence:** HIGH (verified against existing codebase + official docs)

---

## System Overview

```
┌───────────────────────────────────────────────────────────────────────────┐
│                       OFFLINE BUILD-TIME                                  │
│                                                                           │
│  inaproc-ds/outputs/          dashboard/scripts/                          │
│  *.jsonl (3.2 GB, ~123 shards) ──► prepare-data.py  ──► summary-stats.json│
│  *_priority.json               ──► word-cloud.py    ──► lembaga-totals.json│
│                                                       ──► word-cloud.json  │
│                                                       ──► constants.json   │
└───────────────────────────────────────────────────────────────────────────┘
                                    │
                              npm run build
                                    │
┌───────────────────────────────────▼───────────────────────────────────────┐
│                       VITE BUILD                                          │
│                                                                           │
│  dashboard/src/                   dashboard/public/data/                  │
│  ├── main.js                      ├── summary-stats.json  (fetch)         │
│  ├── App.svelte                   ├── lembaga-totals.json (fetch)         │
│  ├── lib/                         ├── word-cloud.json     (fetch)         │
│  │   ├── stores/lang.svelte.js    └── records-high.json   (fetch)         │
│  │   ├── i18n/id.json  ──► inlined into bundle                           │
│  │   ├── i18n/en.json  ──► inlined into bundle                           │
│  │   └── constants.json ──► inlined into bundle                          │
│  └── sections/                                                            │
│      ├── S1Hook.svelte                                                    │
│      ├── S2Deficit.svelte                                                 │
│      ├── S3GDP.svelte                                                     │
│      ├── S4Overview.svelte                                                │
│      ├── S5TopInstitutions.svelte                                         │
│      ├── S6AbsurdOnly.svelte                                              │
│      ├── S7Anchors.svelte                                                 │
│      ├── S8WordCloud.svelte                                               │
│      └── S9Explore.svelte                                                 │
└───────────────────────────────────────────────────────────────────────────┘
                                    │
                         dashboard/dist/  (static files)
                                    │
┌───────────────────────────────────▼───────────────────────────────────────┐
│                     SHARED HOSTING (yosef.id)                             │
│              No Node runtime. Static files only.                          │
│              index.html + assets/*.js + assets/*.css                      │
│              + data/*.json served as static files                         │
└───────────────────────────────────────────────────────────────────────────┘
```

**Component boundary summary:**

| Component | Responsibility | Data source |
|-----------|---------------|-------------|
| `App.svelte` | Top-level orchestration, language store, scroll coordinator | None (passes props down) |
| `S1Hook` – `S9Explore` | One section each, self-contained | Props from App |
| `lib/stores/lang.svelte.js` | `$state` locale, `$derived` t() accessor | `i18n/id.json`, `i18n/en.json` |
| `lib/constants.json` | APBN deficit, GDP figures, anchor equivalents | Hardcoded, inlined at build |
| `dashboard/public/data/` | Runtime JSON fetched on mount | Python pipeline |

---

## Data Pipeline

### Full offline-to-static flow

```
Step 1  uv run dashboard/scripts/prepare-data.py
        Reads: inaproc-ds/outputs/*.jsonl  (all records)
               inaproc-ds/outputs/*_priority.json  (flagged subset)
        Writes: dashboard/public/data/summary-stats.json
                dashboard/public/data/lembaga-totals.json  (top-30 by pagu)

Step 2  uv run dashboard/scripts/word-cloud.py
        Reads: inaproc-ds/outputs/*_priority.json  (high-flag records only)
        Writes: dashboard/public/data/word-cloud.json
                dashboard/public/data/records-high.json  (section 9 explore table)

Step 3  npm run build
        Vite bundles src/ → dashboard/dist/
        public/data/*.json copied verbatim into dist/data/

Step 4  Deploy dashboard/dist/ to shared host via FTP/rsync
```

**npm script aliases** (in `dashboard/package.json`):
```json
"prepare-data": "uv run scripts/prepare-data.py",
"prepare-wordcloud": "uv run scripts/word-cloud.py",
"prepare-all": "npm run prepare-data && npm run prepare-wordcloud",
"build": "vite build",
"deploy": "npm run prepare-all && npm run build"
```

### Where hardcoded numbers live

All macro-economic figures (APBN deficit series, GDP government-consumption component) go in a single source-of-truth file:

```
dashboard/src/lib/constants.json
```

This file is imported (not fetched) so Vite inlines it. It is the single place to update when a number changes. Components destructure only what they need.

```json
{
  "apbn": {
    "deficit_oct_2024_rp_t": 309.1,
    "deficit_fy_2025_rp_t":  695.1,
    "deficit_q1_2026_rp_t":  null,
    "deficit_q1_2026_pct_gdp": 0.93
  },
  "gdp": {
    "series": [
      { "quarter": "Q1 2025", "growth_pct": null, "gov_contrib_pp": null },
      { "quarter": "Q1 2026", "growth_pct": null, "gov_contrib_pp": null }
    ]
  },
  "anchors": {
    "kopi_jago_idr":     5000,
    "seblak_idr":        15000,
    "sd_build_idr":      2000000000,
    "puskesmas_build_idr": 3000000000
  }
}
```

`null` fields are stubs; the researcher fills them from RQ-001/RQ-002 before section build.

---

## NLP Word Cloud Pipeline

### Problem characteristics

- Source: `paket` field from `*_priority.json` (high + med inappropriate records only)
- Volume: medium — priority JSON files are a small subset of the 3.2 GB total
- Language: Bahasa Indonesia with many procurement-specific tokens (e.g. "pengadaan", "jasa", "belanja", "ATK")
- Goal: top-N word frequencies split by `ownerType` and optionally by `lembaga`
- Output: a single JSON file baked into the static build

### Recommended approach: stdlib + regex + inline stopwords

**Do not use NLTK, spaCy, or nlp-id for this task.** Rationale:

1. Procurement package names (`paket`) are short noun phrases, not flowing prose. Sentence-level parsing adds no value.
2. Indonesian morphology (affixes like `me-`, `di-`, `ber-`, `peng-`, `-an`, `-kan`) matters, but stemming for a word cloud typically makes results worse, not better — "pengadaan" and "pengembangan" are semantically distinct and should remain as tokens.
3. A regex word splitter + custom stoplist covers 95 % of the noise with zero dependencies.
4. The script already uses stdlib only; adding NLTK requires a model download step that breaks the offline-first requirement.

**The one exception:** if stemming is wanted later, add `PySastrawi` (Indonesian stemmer, pure Python). It is the only production-quality Indonesian stemmer and has no C extensions.

### Script: `dashboard/scripts/word-cloud.py`

```python
# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""
Produces word-cloud data for the dashboard.
  public/data/word-cloud.json  — top-N words per ownerType + global
  public/data/records-high.json — full high-inappropriate records for section 9
Run: uv run scripts/word-cloud.py
"""
import json, pathlib, re, collections

DATA_DIR = pathlib.Path(__file__).parent.parent.parent / "inaproc-ds" / "outputs"
OUT_DIR  = pathlib.Path(__file__).parent.parent / "public" / "data"
TOP_N    = 20

# Inline stopwords — Indonesian function words + procurement boilerplate
# Source: stopwords-iso/stopwords-id + domain-specific additions
STOPWORDS = {
    # Indonesian function words
    "yang", "dan", "di", "ke", "dari", "untuk", "dengan", "pada", "dalam",
    "atau", "tidak", "ini", "itu", "adalah", "oleh", "juga", "sudah", "akan",
    "bisa", "ada", "bagi", "serta", "telah", "lebih", "atas", "bila", "jika",
    "maka", "karena", "sesuai", "setelah", "tahun", "unit", "nomor", "no",
    # Procurement boilerplate (appear in nearly every paket name — low signal)
    "pengadaan", "belanja", "jasa", "barang", "pekerjaan", "kegiatan",
    "konstruksi", "konsultansi", "pemeliharaan", "perencanaan", "pembangunan",
    "rehabilitasi", "peningkatan", "penyusunan", "pengembangan", "pengelolaan",
    "pelayanan", "operasional", "lainnya", "umum", "daerah", "negara",
    # Common abbreviations
    "atk", "bmd", "apbd", "apbn", "ta", "tp", "bl",
    # Number noise
    "i", "ii", "iii", "iv", "v",
}

def tokenize(text: str) -> list[str]:
    """Lowercase, strip punctuation, split on whitespace, filter short tokens."""
    text = text.lower()
    text = re.sub(r"[^a-z\s]", " ", text)  # remove non-alpha
    return [w for w in text.split() if len(w) >= 4 and w not in STOPWORDS]

# Counters: global, per ownerType, per lembaga (for Section 8 filter)
global_counter   = collections.Counter()
by_owner: dict[str, collections.Counter] = collections.defaultdict(collections.Counter)
by_lembaga: dict[str, collections.Counter] = collections.defaultdict(collections.Counter)

high_records = []  # Section 9 explore table

for path in sorted(DATA_DIR.glob("*_priority.json")):
    for r in json.load(path.open()):
        level  = r.get("tags", {}).get("isInappropriate", "")
        paket  = r.get("paket") or ""
        owner  = r.get("ownerType") or "unknown"
        lembaga = r.get("lembaga") or "Unknown"

        tokens = tokenize(paket)
        global_counter.update(tokens)
        by_owner[owner].update(tokens)
        by_lembaga[lembaga].update(tokens)

        if level == "high":
            high_records.append({
                "id":     r.get("id"),
                "paket":  paket,
                "lembaga": lembaga,
                "satker": r.get("satker"),
                "pagu":   r.get("pagu"),
                "inappropriateReason": r.get("tags", {}).get("inappropriateReason"),
                "ownerType": owner,
            })

word_cloud = {
    "global": [{"word": w, "count": c} for w, c in global_counter.most_common(TOP_N)],
    "byOwner": {
        owner: [{"word": w, "count": c} for w, c in ctr.most_common(TOP_N)]
        for owner, ctr in by_owner.items()
    },
    "byLembaga": {
        name: [{"word": w, "count": c} for w, c in ctr.most_common(TOP_N)]
        for name, ctr in by_lembaga.items()
        if sum(ctr.values()) >= 5  # omit institutions with < 5 flagged tokens
    },
}

OUT_DIR.mkdir(parents=True, exist_ok=True)
(OUT_DIR / "word-cloud.json").write_text(
    json.dumps(word_cloud, ensure_ascii=False, indent=2)
)
(OUT_DIR / "records-high.json").write_text(
    json.dumps(high_records, ensure_ascii=False)  # no indent — size matters
)

print(f"word-cloud.json → global top {TOP_N}, {len(by_owner)} ownerType splits, "
      f"{len(word_cloud['byLembaga'])} lembaga splits")
print(f"records-high.json → {len(high_records)} records")
```

### Output format

```json
{
  "global": [
    { "word": "kopi", "count": 847 },
    { "word": "meja", "count": 623 }
  ],
  "byOwner": {
    "central": [...],
    "kabkota": [...]
  },
  "byLembaga": {
    "Kementerian Pekerjaan Umum": [...]
  }
}
```

Section 8 reads `word-cloud.json` and switches between `global`, `byOwner[filter]`, and `byLembaga[institution]` on filter change — all data is pre-computed, no runtime processing.

### Performance note

The `*_priority.json` files are a small fraction of the 3.2 GB total. The script will complete in seconds. If it is ever run against all JSONL shards (for a different analysis), use the existing shard-streaming pattern from `prepare-data.py` (open each file line-by-line, never load all into memory at once).

---

## Static Data Strategy

### Rule: size determines loading strategy

| File | Approx size | Strategy | Reason |
|------|-------------|----------|--------|
| `i18n/id.json` | ~5 KB | `import` (inline) | Required synchronously on first render; adds trivially to bundle |
| `i18n/en.json` | ~5 KB | `import` (inline) | Same |
| `constants.json` | < 1 KB | `import` (inline) | Used by multiple sections; must be available before first paint |
| `summary-stats.json` | < 1 KB | `public/data/` → `fetch()` | Updated by Python script; kept out of bundle so reruns don't require rebuild |
| `lembaga-totals.json` | ~10 KB | `public/data/` → `fetch()` | Large enough to defer; not needed until section 5 |
| `word-cloud.json` | ~50–100 KB | `public/data/` → `fetch()` | Fetched only when section 8 mounts |
| `records-high.json` | ~1–5 MB | `public/data/` → `fetch()` | Large; fetched lazily only when user reaches section 9 |

### Import pattern (inline — constants + i18n)

```js
// dashboard/src/lib/constants.json  ← Vite bundles this inline
import CONSTANTS from '$lib/constants.json'

// dashboard/src/lib/i18n/id.json
import id from '$lib/i18n/id.json'
```

Vite inlines JSON imports into the JS bundle by default (confirmed HIGH confidence from Vite docs). This eliminates a network round-trip for small, always-needed data.

### Fetch pattern (deferred — runtime data)

```js
// Fetch on component mount, not at App level
// Each section fetches its own data when it mounts
onMount(async () => {
  const res = await fetch('/data/word-cloud.json')
  wordCloudData = await res.json()
})
```

**Do not** pre-fetch all JSON in App.svelte and pass down as props. This causes a waterfall: the whole page waits for the largest file. Each section owns its fetch.

### Vite `assetsInlineLimit` note

Vite inlines assets smaller than 4 KB by default. JSON files in `public/` bypass this entirely (they are not processed by Vite at all — copied verbatim). Only files imported via `import` are subject to bundling. This distinction is important: `public/data/*.json` will always be separate HTTP requests regardless of size.

---

## i18n Architecture

### Philosophy: no library, just a runes store

For a single-page scrollytelling site with two languages, a full i18n library (svelte-i18n, lingui) adds unnecessary complexity. A `$state`-based store with a `t()` accessor function is sufficient and has zero dependencies.

### Translation file structure

Two flat JSON files, one key namespace per section:

```
dashboard/src/lib/i18n/
├── id.json   (Indonesian — primary language)
└── en.json   (English — secondary)
```

```json
// id.json
{
  "nav.lang_toggle": "English",
  "hero.eyebrow": "idsterity · Analisis Pengadaan Indonesia 2026",
  "hero.h1_line1": "Ke mana perginya",
  "hero.h1_line2": "uang rakyat?",
  "hero.scroll_cue": "gulir untuk menjelajahi ↓",
  "s1.title": "Janji Penghematan",
  "s2.title": "Defisit yang Tumbuh",
  "s2.axis_year": "Tahun",
  "s2.axis_deficit": "Defisit (Rp T)",
  "s4.disclaimer": "Model AI kami mendeteksi potensi ketidakwajaran...",
  "s7.anchor_kopi": "cangkir kopi jago",
  "s7.anchor_seblak": "porsi seblak",
  "s9.col_lembaga": "Instansi",
  "s9.col_pagu": "Pagu (Rp)",
  "s9.col_reason": "Alasan"
}
```

```json
// en.json  — same keys, English values
{
  "nav.lang_toggle": "Indonesia",
  "hero.eyebrow": "idsterity · Indonesia 2026 Procurement Analysis",
  "hero.h1_line1": "Where did the",
  "hero.h1_line2": "people's money go?",
  ...
}
```

**Key naming convention:** `section.element_descriptor`. Section prefix (`hero`, `s1`–`s9`, `nav`) prevents collisions as sections grow.

**D3 chart labels** are passed as props from the section component to the chart component. The section component reads from `t()`, the chart receives plain strings:

```svelte
<!-- S5TopInstitutions.svelte -->
<BarChart
  {data}
  xLabel={t('s5.axis_pagu')}
  yLabel={t('s5.axis_institution')}
/>
```

### Language store — Svelte 5 runes pattern

```js
// dashboard/src/lib/stores/lang.svelte.js
import id from '$lib/i18n/id.json'
import en from '$lib/i18n/en.json'

const TRANSLATIONS = { id, en }

// Module-level $state — shared across all components that import this file
// This is the Svelte 5 runes equivalent of a writable store
let locale = $state('id')

export function setLocale(lang) {
  locale = lang
  // Persist across page reloads
  localStorage.setItem('idsterity-lang', lang)
}

export function getLocale() {
  return locale
}

// t() is a $derived accessor — recomputes when locale changes
// Export as a function so components call t('key') rather than subscribing
export function t(key) {
  return TRANSLATIONS[locale]?.[key] ?? key
}

// Initialize from localStorage on first import
if (typeof localStorage !== 'undefined') {
  const saved = localStorage.getItem('idsterity-lang')
  if (saved === 'en' || saved === 'id') locale = saved
}
```

Usage in any component:

```svelte
<script>
  import { t, setLocale, getLocale } from '$lib/stores/lang.svelte.js'
</script>

<button onclick={() => setLocale(getLocale() === 'id' ? 'en' : 'id')}>
  {t('nav.lang_toggle')}
</button>

<h1>{t('hero.h1_line1')} <em>{t('hero.h1_line2')}</em></h1>
```

**Why module-level `$state` works:** In Svelte 5, `$state` declared at module scope (outside a component) is shared across all importers in the same module instance. Changing `locale` via `setLocale()` triggers reactivity in every component that calls `t()`. This is equivalent to a Svelte 4 writable store without the `$` subscription syntax.

**Confidence:** MEDIUM — confirmed from community sources that module-level `$state` is the Svelte 5 idiomatic replacement for shared stores. The pattern is endorsed by Svelte 5 documentation but `lang.svelte.js` extension is required (not `.js`) to enable runes in module files.

### Language toggle placement

A fixed or sticky language toggle button lives in `App.svelte` (outside all section components). It is always visible. On mobile, it sits top-right. On desktop, top-right in the nav bar.

---

## Component Architecture

### Structure: per-section components, App.svelte as orchestrator

**Do not** keep all 9 sections in a single App.svelte. The POC App.svelte is already 507 lines with 4 sections. 9 sections would exceed 1000 lines — unmaintainable.

**Do** extract each section into `dashboard/src/sections/S{N}{Name}.svelte`. App.svelte becomes a thin orchestrator.

```
dashboard/src/
├── main.js                  — mount point (unchanged)
├── App.svelte               — orchestrator: lang toggle, scroll state, section composition
├── lib/
│   ├── constants.json       — hardcoded macro figures
│   ├── stores/
│   │   └── lang.svelte.js   — language store (module-level $state)
│   ├── i18n/
│   │   ├── id.json
│   │   └── en.json
│   └── charts/
│       ├── BarChart.svelte       — horizontal stacked bar (sections 5, 6)
│       ├── LineChart.svelte      — time-series line (sections 2, 3)
│       ├── WordCloud.svelte      — SVG/canvas word cloud (section 8)
│       └── AnchorCounter.svelte  — animated number anchor (section 7)
└── sections/
    ├── S1Hook.svelte         — Quotes from officials, no chart
    ├── S2Deficit.svelte      — APBN deficit line chart, hardcoded data
    ├── S3GDP.svelte          — GDP government consumption line chart
    ├── S4Overview.svelte     — Dataset stats, AI disclaimer
    ├── S5TopInstitutions.svelte  — Top institutions stacked bar
    ├── S6AbsurdOnly.svelte   — Re-ranked high-flag institutions
    ├── S7Anchors.svelte      — Animated anchor equivalents
    ├── S8WordCloud.svelte    — Word cloud + ownerType/lembaga filter
    └── S9Explore.svelte      — Filtered records table
```

### App.svelte as thin orchestrator

```svelte
<!-- App.svelte -->
<script>
  import { onMount } from 'svelte'
  import { t, setLocale, getLocale } from '$lib/stores/lang.svelte.js'
  import S1Hook from './sections/S1Hook.svelte'
  // ... other sections

  let activeSection = $state(0)

  onMount(() => {
    const sections = document.querySelectorAll('[data-section]')
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) activeSection = Number(e.target.dataset.section)
      })
    }, { rootMargin: '-40% 0px -40% 0px', threshold: 0 })
    sections.forEach(el => observer.observe(el))
    return () => observer.disconnect()  // Svelte 5: onMount cleanup via return
  })
</script>

<!-- Language toggle — always visible -->
<button class="lang-toggle" onclick={() => setLocale(getLocale() === 'id' ? 'en' : 'id')}>
  {t('nav.lang_toggle')}
</button>

<main>
  <section data-section="0"><S1Hook /></section>
  <section data-section="1"><S2Deficit /></section>
  <!-- ... -->
</main>
```

**Scroll state scope:** `activeSection` is only needed by App for progress indicators. Each section manages its own internal scroll steps independently via its own `IntersectionObserver` on `[data-step]` elements.

### Sections with scroll steps (dual-level observation)

Sections 5 and 6 (stacked bar charts) use the Pudding pattern: sticky chart panel + scrolling text steps. The pattern is self-contained within the section component:

```svelte
<!-- S5TopInstitutions.svelte -->
<script>
  import { onMount } from 'svelte'
  import { t } from '$lib/stores/lang.svelte.js'
  import BarChart from '$lib/charts/BarChart.svelte'

  let data = $state([])
  let step = $state(0)
  let loading = $state(true)

  onMount(async () => {
    const res = await fetch('/data/lembaga-totals.json')
    data = await res.json()
    loading = false

    const stepEls = document.querySelectorAll('[data-s5-step]')
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) step = Number(e.target.dataset.s5Step)
      })
    }, { rootMargin: '-38% 0px -38% 0px', threshold: 0 })
    stepEls.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  })
</script>

<div class="scrolly">
  <div class="sticky-col">
    <BarChart {data} {step} xLabel={t('s5.axis_pagu')} />
  </div>
  <div class="steps-col">
    <div class="step" data-s5-step="0">...</div>
    <div class="step" data-s5-step="1">...</div>
  </div>
</div>
```

**`data-s5-step` namespacing:** Each section uses a namespaced `data-*` attribute to avoid collisions when multiple IntersectionObservers are active simultaneously.

### D3 chart lifecycle in Svelte 5

**Pattern:** D3 handles scales and math. Svelte templates handle SVG rendering. Avoid D3's DOM manipulation methods (`d3.select().append()` etc.) — use them only for transitions when CSS transitions are insufficient.

```svelte
<!-- lib/charts/BarChart.svelte -->
<script>
  import { scaleLinear, scaleBand } from 'd3'

  let { data, step, xLabel = '', yLabel = '' } = $props()

  // $derived recomputes when data or step changes — no manual update needed
  let xScale = $derived(
    scaleLinear()
      .domain([0, Math.max(...data.map(d => d.total))])
      .range([0, chartWidth])
  )

  let yScale = $derived(
    scaleBand()
      .domain(data.map(d => d.name))
      .range([0, chartHeight])
      .padding(0.2)
  )

  // Step-driven color is a derived computation, not a D3 transition
  function fillColor(d) {
    if (step === 3 && d.highCount === 0) return 'var(--muted)'
    if (step >= 2) return 'var(--amber)'
    if (step === 1) return ownerColor(d.ownerType)
    return 'var(--text)'
  }
</script>

<svg>
  {#each data as d}
    <rect
      x={0}
      y={yScale(d.name)}
      width={xScale(d.total)}
      height={yScale.bandwidth()}
      fill={fillColor(d)}
      style="transition: fill 0.4s ease, width 0.4s ease"
    />
  {/each}
</svg>
```

**For word cloud (Section 8):** D3-cloud (`d3-cloud` package) is the standard library for computing word positions. It does not touch the DOM — it outputs `{x, y, size, rotate, text}` per word. Svelte renders the SVG. This maintains the "D3 math, Svelte DOM" separation.

```
npm install d3-cloud
```

**Cleanup:** In Svelte 5, `onMount` return value is the cleanup function (called on component destroy). All `IntersectionObserver`, D3 simulation, or timer instances must be disconnected/stopped in the cleanup return.

---

## Build Order

The following dependency order must be respected. Items at the same level can be built in parallel.

```
Level 0 — Prerequisites (before any code)
  ├── Research & fill constants.json (APBN, GDP figures from RQ-001, RQ-002)
  └── Run prepare-data.py (produces summary-stats.json, lembaga-totals.json)

Level 1 — Foundation (no section dependencies)
  ├── lang.svelte.js store + i18n/id.json + i18n/en.json
  ├── CSS design tokens (extend existing :root variables)
  └── lib/charts/BarChart.svelte (refactor from existing BarChart.svelte)

Level 2 — Sections using only hardcoded data (no fetches)
  ├── S1Hook.svelte (static quotes, no data dependency)
  ├── S2Deficit.svelte (imports constants.json)
  ├── S3GDP.svelte (imports constants.json)
  └── S4Overview.svelte (fetches summary-stats.json — simple)

Level 3 — Sections requiring lembaga-totals.json
  ├── S5TopInstitutions.svelte
  └── S6AbsurdOnly.svelte

Level 4 — Run word-cloud.py (prerequisite for levels 5+)
  └── uv run scripts/word-cloud.py → word-cloud.json, records-high.json

Level 5 — Sections requiring word-cloud.json / records-high.json
  ├── lib/charts/WordCloud.svelte (d3-cloud)
  ├── lib/charts/AnchorCounter.svelte
  ├── S7Anchors.svelte
  ├── S8WordCloud.svelte
  └── S9Explore.svelte

Level 6 — Integration
  ├── App.svelte orchestration (compose all sections)
  ├── Language toggle button
  └── End-to-end scroll testing

Level 7 — Polish
  ├── Error states (fetch failures, empty data guards)
  ├── Mobile responsive layout
  ├── OG meta tags (LinkedIn sharing)
  └── Lighthouse audit
```

**Key dependency flags:**
- S2 and S3 are blocked on RQ-001 and RQ-002 resolution (null fields in constants.json are stubs — components must handle `null` gracefully with placeholder copy)
- S8/S9 are blocked on `word-cloud.py` existing and being run
- All sections are blocked on the i18n store existing — do not inline strings directly

---

*Architecture research: 2026-05-13*
