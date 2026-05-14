# Phase 3: Interactive Back Half (S7–S9) — Pattern Map

**Mapped:** 2026-05-14
**Files analyzed:** 5 (3 modified, 1 extended, 1 new data layer)
**Analogs found:** 5 / 5

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `dashboard/src/App.svelte` | component (page shell) | event-driven + request-response | itself (existing, extended) | exact |
| `dashboard/src/i18n.js` | config (copy) | transform | itself (existing, extended) | exact |
| `dashboard/public/data/constants.json` | config (static data) | transform | itself (existing, extended) | exact |
| `dashboard/scripts/prepare-data.py` | utility (pipeline) | batch + file-I/O | itself (existing, extended) | exact |
| `dashboard/public/data/word-{word}-{filter}.json` × 60 | model (static data) | file-I/O | `dashboard/public/data/lembaga-totals.json` | role-match |

---

## Pattern Assignments

### `dashboard/src/App.svelte` — S7 Count-Up Section (event-driven, 2 scroll steps)

**Analog:** `dashboard/src/App.svelte` existing S5/S6 section (lines 334–377)

**$state variable pattern** (lines 14–18 — follow for S7/S8/S9 variables):
```javascript
let activeStepS1 = $state(0)
let activeStepS2 = $state(0)
let activeStepS3 = $state(0)
let activeStepS5 = $state(0)
let fetchError   = $state(null)
```
Add analogously:
```javascript
let activeStepS7      = $state(0)
let activeStepS8      = $state(0)
let kopiCount         = $state(0)
let seblakCount       = $state(0)
let sdCount           = $state(0)
let puskesmasCount    = $state(0)
let s7ShowTransition  = $state(false)
let cloudWords        = $state([])
let lembagaIndex      = $state({})
let activeFilter      = $state('all')
let activeLembaga     = $state(null)
let lembagaSearch     = $state('')
let selectedWord      = $state(null)
let wordRecords       = $state([])
let wordRecordsLoading = $state(false)
```

**makeScroller pattern** (lines 51–62 — exact pattern to follow):
```javascript
const makeScroller = (sectionAttr, onEnter) => {
  const s = scrollama()
  s.setup({ step: `[data-section="${sectionAttr}"] [data-step]`, offset, progress: false })
   .onStepEnter(({ index }) => onEnter(index))
  return s
}
scrollers = [
  makeScroller('s1', i => { activeStepS1 = i }),
  makeScroller('s2', i => { activeStepS2 = i }),
  makeScroller('s3', i => { activeStepS3 = i }),
  makeScroller('s5', i => { activeStepS5 = i }),
  // Add:
  makeScroller('s7', i => { activeStepS7 = i }),
  makeScroller('s8', i => { activeStepS8 = i }),
]
```

**safeFetch pattern** (lines 23–27 — reuse verbatim for per-word record files):
```javascript
const safeFetch = url =>
  fetch(url).then(r => {
    if (!r.ok) throw new Error(`${r.status} ${r.statusText} — ${url}`)
    return r.json()
  })
```

**Promise.all mount fetch pattern** (lines 31–41 — extend, do not replace):
```javascript
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
    fetchError = lang === 'id' ? t.id.fetchError : t.en.fetchError
  }
  // ... rest of onMount ...
})
```
Extend Promise.all to add `wordcloud-all.json` and `wordcloud-lembaga.json` fetches alongside the existing three. Per-word record files are fetched lazily (not here — only on word click).

**aria-live transition label pattern** (lines 368–371 — exact pattern for S7 transition label):
```svelte
<span class="s6-transition-label" aria-live="polite">
  {activeStepS5 >= 2 ? t[lang].s6TransitionLabel : ''}
</span>
```
S7 equivalent:
```svelte
<span class="s7-transition-label" aria-live="polite">
  {s7ShowTransition ? t[lang].s7TransitionLabel : ''}
</span>
```

**Section HTML structure pattern** (lines 334–377 — exact scrolly section scaffold):
```svelte
<!-- ━━━ S5+S6 INSTITUTIONS ━━━ -->
<section class="scrolly" data-section="s5" id="s5">

  <div class="sticky-col">
    <div class="eyebrow">{t[lang].s5Eyebrow}</div>
    <InstitutionsChart data={lembaga} step={activeStepS5} lang={lang} />
    <div class="step-indicator" aria-hidden="true">
      {#each [0,1,2] as s}
        <div class="pip" class:active={activeStepS5 === s}></div>
      {/each}
    </div>
  </div>

  <div class="steps-col">
    <div class="step" data-step="0">
      <div class="step-card">
        <span class="step-num">{t[lang].stepCounter(1, 3)}</span>
        <h3>{t[lang].s5Step1Heading}</h3>
        <p>{t[lang].s5Step1Body}</p>
      </div>
    </div>
    <!-- additional [data-step="N"] divs -->
  </div>

</section>
```
S7 follows this scaffold with `data-section="s7"`, two `data-step` divs, and count-up display numbers in `.sticky-col` instead of a chart component.

**Step card with source link pattern** (lines 179–213 — use for S7 anchor source citations):
```svelte
<div class="step" data-step="0">
  <div class="step-card">
    <span class="step-num">{t[lang].stepCounter(1, 3)}</span>
    <h3>{t[lang].s2Step1Heading}</h3>
    <p>{t[lang].s2Step1Body}</p>
    <a class="source-link"
       href={constants?.sources?.find(s => s.field === 'apbn.deficit.fy2025')?.url ?? '#'}
       target="_blank" rel="noopener noreferrer">{t[lang].s2SourceLabel}</a>
  </div>
</div>
```

**Number formatting pattern** (lines 72–73 — reuse for count-up display):
```javascript
const fmtT   = v => (v / 1e12).toFixed(1)
const fmtNum = v => v.toLocaleString('id-ID')
```
Add for count-up:
```javascript
const fmtCount = (v, lang) => v.toLocaleString(lang === 'id' ? 'id-ID' : 'en-US')
```

**Mobile S1 sticky override pattern** (lines 776–779 — DO NOT copy to S8):
```css
/* S1 has no chart — let it scroll naturally, no sticky needed */
[data-section="s1"] .sticky-col {
  position: relative;
  height: auto;
}
```
S8 is interactive, not text-only — it MUST NOT get this override. Keep S8 at `position: sticky; height: 50dvh` on mobile (the default `.sticky-col` mobile rule at lines 754–768 applies correctly).

**CSS token reference pattern** (lines 384–418 — all new CSS must use these tokens):
```css
:global(:root) {
  --bg:          #0e0d0c;
  --bg-alt:      #141210;
  --bg-card:     #1a1714;
  --text:        #ede8dc;
  --muted:       #6a6055;
  --gold:        #c9a84c;
  --red:         #c44242;
  --amber:       #c4823a;
  --border:      rgba(237,232,220,0.08);
  --space-xs: 4px; --space-sm: 8px; --space-md: 16px;
  --space-lg: 24px; --space-xl: 32px; --space-2xl: 48px;
  --space-3xl: 64px; --space-page: 96px;
}
```

**44×44px tap target pattern** (lines 526–545 — MOB-03 pattern, copy for all S8 interactive elements):
```css
.lang-toggle {
  min-width: 44px;
  min-height: 44px;
  padding: 0 14px;
  /* ... */
}
```
Apply `min-height: 44px` and appropriate padding to all word cloud `<button>` elements and filter toggles.

**source-link pattern** (lines 720–734 — use for anchor source citations in S7 step cards):
```css
.source-link {
  display: inline-block;
  margin-top: var(--space-md);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  color: var(--muted);
  text-decoration: underline;
  text-decoration-color: var(--border);
  text-underline-offset: 3px;
  min-height: 44px;
  padding: 8px 0;
  transition: color 0.15s ease;
}
.source-link:hover { color: var(--text); }
```

**toggleLang preserves scroll position** (lines 75–79 — copy exact pattern for lang toggle side effects):
```javascript
function toggleLang() {
  const y = window.scrollY
  lang = lang === 'id' ? 'en' : 'id'
  requestAnimationFrame(() => window.scrollTo(0, y))
}
```

---

### `dashboard/src/i18n.js` — New S7/S8/S9 copy keys

**Analog:** `dashboard/src/i18n.js` lines 1–162 (whole file — extend, do not replace)

**Key naming convention** (lines 14–78 — follow this exact naming structure):
```javascript
// Section keys follow pattern: s{N}{ElementType}
// e.g. s7Eyebrow, s7Step1Heading, s7Step1Body, s7TransitionLabel
// Bilingual pairs: id block first, en block mirrors exactly
s7Eyebrow:          'S7 · NILAI UANG RAKYAT',     // id
// ...
s7Eyebrow:          'S7 · WHAT THAT MONEY COULD BUY',  // en
```

**Function value pattern** (line 10 — stepCounter is a function, not a string):
```javascript
stepCounter: (n, total) => `${n} / ${total}`,
```
Follow this pattern for any computed copy strings.

**Section comment dividers** (lines 14, 28, 39, 52, 63, 73 — maintain consistency):
```javascript
// S1
// S2 — APBN Deficit
// S3 — GDP
// S4 — Dataset Overview
// S5 — Top Institutions
// S6 — Re-rank
// Add:
// S7 — Anchor Count-Up
// S8 — Word Cloud
// S9 — Record Table
```

**Bilingual parallel structure** (lines 1–162 — id block and en block must have identical keys):
```javascript
export const t = {
  id: {
    // all keys
    s6TransitionLabel: 'Mengurutkan ulang…',
    fetchError: 'Gagal memuat data. Coba muat ulang halaman.',
  },
  en: {
    // same keys, English values
    s6TransitionLabel: 'Re-ranking…',
    fetchError: 'Failed to load data. Try refreshing the page.',
  },
}
```

---

### `dashboard/public/data/constants.json` — `anchors` key addition

**Analog:** `dashboard/public/data/constants.json` lines 1–72 (whole file — extend with new top-level key)

**Existing top-level key structure** (lines 1–20 — new `anchors` key goes at same level as `apbn` and `gdp`):
```json
{
  "apbn": { ... },
  "gdp": { ... },
  "sources": [ ... ],
  "anchors": { ... }   // NEW — add here
}
```

**sources array pattern** (lines 21–71 — anchor source citations follow the same object shape):
```json
{
  "field": "apbn.deficit.oct2024",
  "url": "https://www.kemenkeu.go.id/...",
  "label": "APBN KiTa Oktober 2024 — Kementerian Keuangan RI",
  "accessed": "2026-05-13"
}
```
Anchor sources should be added to the existing `sources` array with `"field": "anchors.kopi"` etc., OR embedded directly in the `anchors` object as a `source` / `sourceLabel` per the RESEARCH.md recommendation. The embedded approach avoids mutating the `sources` array format.

**`anchors` key structure** (from RESEARCH.md — use verbatim):
```json
"anchors": {
  "kopi": {
    "price": 8000,
    "label_id": "cangkir kopi jago",
    "label_en": "cups of kopi jago",
    "source": "https://hargamenu.net/...",
    "sourceLabel": "Harga Menu Kopi Jago 2025 — hargamenu.net"
  },
  "seblak": {
    "price": 15000,
    "label_id": "porsi seblak",
    "label_en": "portions of seblak",
    "source": "https://food.detik.com/...",
    "sourceLabel": "Harga Seblak — Detik Food"
  },
  "sd": {
    "price": 4500000000,
    "label_id": "sekolah dasar baru",
    "label_en": "new elementary schools",
    "source": "https://ekonomi.bisnis.com/...",
    "sourceLabel": "Estimasi biaya pembangunan SD — Bisnis.com"
  },
  "puskesmas": {
    "price": 8000000000,
    "label_id": "puskesmas baru",
    "label_en": "new primary health clinics",
    "source": "https://mataram.antaranews.com/...",
    "sourceLabel": "Kemenkes alokasi Rp13M untuk puskesmas — Antara News"
  }
}
```

---

### `dashboard/scripts/prepare-data.py` — 60 per-word record files extension

**Analog:** `dashboard/scripts/prepare-data.py` lines 1–124 (whole file — extend after line 123)

**Script header pattern** (lines 1–11 — maintain inline script metadata and docstring):
```python
# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""
Produces two data files for the dashboard:
  ...
"""
import json, pathlib, collections
```
Add `import re` to the existing `import` line if word-boundary matching is used: `import json, pathlib, collections, re`

**DATA_DIR / OUT_DIR pattern** (lines 13–14 — reuse same constants):
```python
DATA_DIR = pathlib.Path(__file__).parent.parent.parent / "inaproc-ds" / "outputs"
OUT_DIR  = pathlib.Path(__file__).parent.parent / "public" / "data"
```

**Priority shard reading pattern** (lines 49–71 — exact loop to replicate for per-word bucketing):
```python
for path in sorted(DATA_DIR.glob("*_priority.json")):
    for r in json.load(path.open()):
        name  = r.get("lembaga") or "Unknown"
        pagu  = r.get("pagu") or 0
        level = r.get("tags", {}).get("isInappropriate", "")
        # ... bucket by level
```
The per-word extension iterates the same `*_priority.json` glob. Filter to `level == "high"` only (per D-10: "top 20 records by pagu").

**JSON output write pattern** (lines 118–120 — follow for 60 new files):
```python
OUT_DIR.mkdir(parents=True, exist_ok=True)
(OUT_DIR / "lembaga-totals.json").write_text(json.dumps(lembaga_totals, ensure_ascii=False, indent=2))
(OUT_DIR / "summary-stats.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2))
```
Per-word files follow:
```python
(OUT_DIR / f"word-{word}-{filt}.json").write_text(json.dumps(top, ensure_ascii=False, indent=2))
```

**print confirmation pattern** (lines 122–123 — maintain for new output files):
```python
print(f"lembaga-totals.json → {len(lembaga_totals)} records")
print(f"summary-stats.json  → {summary}")
```
Add:
```python
print(f"word-*-*.json → {len(ALL_WORDS)} words × 3 filters = {len(ALL_WORDS)*3} files")
```

**Record shape for per-word files** (from CONTEXT.md D-11 — 5 fields only):
```python
rec = {
    "lembaga":             r.get("lembaga") or "Unknown",
    "satker":              r.get("satker") or "",
    "pagu":                r.get("pagu") or 0,
    "paket":               r.get("paket") or "",
    "inappropriateReason": r.get("tags", {}).get("inappropriateReason") or "",
}
```
Note `r.get("lembaga") or "Unknown"` matches the existing null-guard pattern at line 26.

---

### `dashboard/public/data/word-{word}-{filter}.json` × 60 (new data files)

**Analog:** `dashboard/public/data/lembaga-totals.json` (same role: pre-baked static JSON for client fetch)

**Array-of-objects shape** (lembaga-totals.json lines 1–5 — follow same top-level array pattern):
```json
[
  {
    "rank": 1,
    "name": "...",
    "total": 0,
    ...
  }
]
```
Per-word files are a plain array (no wrapper object):
```json
[
  {
    "lembaga": "...",
    "satker": "...",
    "pagu": 0,
    "paket": "...",
    "inappropriateReason": "..."
  }
]
```
Top 20 records by `pagu` descending. Empty array `[]` is a valid result (no crash, S9 shows empty state).

**Naming convention** (from CONTEXT.md D-10):
- `word-{word}-all.json`
- `word-{word}-central.json`
- `word-{word}-district.json`

Words come from `wordcloud-all.json` which has 20 words (verified: `kantor`, `sewa`, `modal`, `dinas`, `bangun`, `rumah`, `natura`, ...). The union of all three filter clouds determines the full word set to index.

---

## Shared Patterns

### Count-Up Animation (RAF loop)
**Apply to:** S7 sticky panel count displays
**Source:** RESEARCH.md Pattern 2 (no existing codebase analog — novel for Phase 3)
```javascript
// Inline in App.svelte — ~25 lines, does not warrant a separate component
function countUp(target, duration, onUpdate, onDone) {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReduced) { onUpdate(target); onDone?.(); return }
  const start = performance.now()
  function frame(now) {
    const t = Math.min((now - start) / duration, 1)
    const eased = 1 - Math.pow(1 - t, 3)   // cubic ease-out
    onUpdate(Math.floor(eased * target))
    if (t < 1) requestAnimationFrame(frame)
    else { onUpdate(target); onDone?.() }
  }
  requestAnimationFrame(frame)
}
// Duration: 1800ms per UI-SPEC. Call with: countUp(count, 1800, v => kopiCount = v)
```

### Bilingual i18n Access
**Apply to:** All new S7/S8/S9 copy in App.svelte HTML
**Source:** `dashboard/src/App.svelte` throughout (e.g., line 116 `{t[lang].s1Eyebrow}`)
```svelte
{t[lang].s7Eyebrow}
{t[lang].s7TransitionLabel}
{t[lang].s8FilterAll}
```
Never use inline ternaries (`lang === 'id' ? '...' : '...'`) — always `t[lang].keyName`.

### stats field access guard pattern
**Apply to:** S7 anchor count calculations
**Source:** `dashboard/src/App.svelte` lines 95, 97, 288, 313 — `{#if stats}` block + `stats?.labelPagu?.high`
```svelte
{#if stats}
  <div class="hero-number">Rp {fmtT(stats.totalPagu)} T</div>
{:else}
  <div class="hero-number loading-pulse">Rp — T</div>
{/if}
```
S7 anchor counts should be guarded: `{#if stats && constants}` before rendering count-up figures.

### constants field access guard pattern
**Apply to:** S7 anchor price reads, S2/S3 source link lookups
**Source:** `dashboard/src/App.svelte` lines 169, 185, 186
```svelte
<DeficitChart data={constants?.apbn?.deficit} step={activeStepS2} lang={lang} />
href={constants?.sources?.find(s => s.field === 'apbn.deficit.fy2025')?.url ?? '#'}
```
Use optional chaining: `constants?.anchors?.kopi?.price`.

### Responsive sticky-col behavior
**Apply to:** S7 and S8 `.sticky-col`
**Source:** `dashboard/src/App.svelte` lines 554–567 (desktop), 754–768 (mobile)
```css
/* Desktop */
.sticky-col {
  position: sticky;
  top: 0;
  height: 100dvh;
  width: 60%;
  /* ... */
}
/* Mobile (800px breakpoint) */
@media (max-width: 800px) {
  .sticky-col {
    position: sticky;
    top: 0;
    width: 100%;
    height: 50dvh;
    overflow: hidden;
    z-index: 10;
  }
}
```
S8 must NOT have the S1 override (`position: relative; height: auto`) — S8 is interactive.

### `$derived` for computed display values
**Apply to:** Word cloud font scaling, cloudMin/cloudMax, S7 derived counts
**Source:** `dashboard/src/InstitutionsChart.svelte` lines 32–47
```javascript
let barHeight  = $derived(isMobile ? BAR_HEIGHT_MOBILE : BAR_HEIGHT_DESKTOP)
let sortedData = $derived(
  step >= S6_STEP_INDEX
    ? [...data].sort((a, b) => b.highPagu - a.highPagu)
    : [...data].sort((a, b) => b.total - a.total)
)
```
S8 equivalent:
```javascript
let cloudMin = $derived(Math.min(...cloudWords.map(w => w.count)))
let cloudMax = $derived(Math.max(...cloudWords.map(w => w.count)))
```
This ensures font scaling re-computes when `cloudWords` changes (filter switch).

### Mobile media query in onMount
**Apply to:** S8 word cloud layout (480px chip-strip vs flex-wrap)
**Source:** `dashboard/src/InstitutionsChart.svelte` lines 25–30
```javascript
onMount(() => {
  mq = window.matchMedia('(max-width: 480px)')
  isMobile = mq.matches
  const onChange = e => { isMobile = e.matches }
  mq.addEventListener('change', onChange)
  onDestroy(() => mq.removeEventListener('change', onChange))
})
```
S8 cloud breakpoint is 480px (MOB-02), matching InstitutionsChart's existing 480px breakpoint.

### Loading state pattern
**Apply to:** S9 table while per-word JSON is fetching
**Source:** `dashboard/src/App.svelte` lines 102–106 (stats loading state)
```svelte
{:else}
  <div class="hero-stat loading-pulse">
    <div class="hero-number">Rp — T</div>
    <div class="hero-sublabel">{t[lang].loading}</div>
  </div>
{/if}
```
S9 loading state per UI-SPEC: single `<td colspan="5">` with loading text (not a spinner). Use `.loading-pulse` animation class (already defined at line 506):
```css
.loading-pulse { animation: pulse 1.8s ease-in-out infinite; }
@keyframes pulse { 0%,100% { opacity:0.5 } 50% { opacity:0.9 } }
```

### pip step-indicator
**Apply to:** S7 (2 steps) if step progress dots are desired
**Source:** `dashboard/src/App.svelte` lines 569–586
```svelte
<div class="step-indicator" aria-hidden="true">
  {#each [0,1] as s}
    <div class="pip" class:active={activeStepS7 === s}></div>
  {/each}
</div>
```

---

## No Analog Found

All Phase 3 files are extensions of existing files or follow composable patterns already in the codebase. No file requires a pattern from outside the codebase.

However, the following capabilities are **novel to Phase 3** (no prior codebase implementation):

| Capability | Novel Element | Source of Pattern |
|---|---|---|
| RAF count-up animation | `countUp()` function | RESEARCH.md Pattern 2 (standard RAF pattern) |
| Word cloud font scaling | `scaleFont()` formula | RESEARCH.md Code Examples + UI-SPEC §Typography |
| S9 overlay toggle | `selectedWord` toggle + outside-click | RESEARCH.md Pattern 5 + Anti-Patterns |
| Institution search dropdown | Native JS `.filter()` on keys array | CONTEXT.md D-08; no library |
| `fmtPaguShort` for table | Abbreviated pagu formatter | RESEARCH.md Code Examples |

---

## Metadata

**Analog search scope:** `dashboard/src/`, `dashboard/scripts/`, `dashboard/public/data/`
**Files scanned:** 7 (App.svelte, i18n.js, InstitutionsChart.svelte, prepare-data.py, constants.json, lembaga-totals.json, wordcloud-all.json)
**Pattern extraction date:** 2026-05-14
