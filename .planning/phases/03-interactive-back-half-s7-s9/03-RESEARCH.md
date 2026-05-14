# Phase 3: Interactive Back Half (S7–S9) — Research

**Researched:** 2026-05-14
**Domain:** Svelte 5 animation state, flex-wrap word cloud, per-word JSON pipeline, interactive table overlay
**Confidence:** HIGH (all key claims verified against codebase; anchor prices ASSUMED with cited reference points)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**S7 — Anchor Count-Up Animations**
- D-01: Base IDR figure is `labelPagu.high` from `summary-stats.json` — same field S4 displays. No pipeline change for the total.
- D-02: Unit prices for 4 anchors are researcher-determined from credible Indonesian public sources. Each price goes into `constants.json` under a new `anchors` key with a `sources` entry.
- D-03: S7 uses 2 scroll steps: Step 0 = kopi jago + seblak (both animate simultaneously); Step 1 = transition label "Atau, lebih seriusnya…" / "Or, on a more serious note…" then SD school + puskesmas.
- D-04: Transition label is a literal visible element in the sticky panel (aria-live="polite"), same as `s6TransitionLabel` pattern.

**S8 — Word Cloud**
- D-05: Word cloud is sized `<button>` elements in a `flex-wrap` container. `font-size` scales proportionally with count. Pure CSS, no new library.
- D-06: On ≥480px: flex-wrap button layout. On <480px (MOB-02): horizontal scroll chip strip, uniform size, same `<button>` elements.
- D-07: Two mutually exclusive filters — (a) Central/District/All toggle loading different JSON files; (b) institution name picker (searchable input) loading from `wordcloud-lembaga.json` keys. Activating either clears the other. Reset button returns to "all".
- D-08: Institution search: native JS filter on the keys array, no library. Dropdown of filtered matches. 44×44px tap targets (MOB-03).

**S9 — Record Table (Inline Overlay in S8)**
- D-09: S9 is NOT a separate section. Record table appears as an overlay within S8's sticky panel, toggled by `selectedWord` `$state`.
- D-10: Record data pre-baked per-word by `prepare-data.py`. Pattern: `word-{word}-all.json`, `word-{word}-central.json`, `word-{word}-district.json`. Total: 60 files (20 words × 3 filter variants). Top 20 records by pagu per file.
- D-11: 5 columns: lembaga, satker, pagu, paket, inappropriateReason. Bilingual column labels follow `t[lang]` pattern.
- D-12: Institution filter active → S9 falls back to `-all` file + small note in table header.
- D-13: Close: × button, click/tap outside overlay, or clicking already-selected word again.

### Claude's Discretion

- Count-up animation duration and easing (suggested: ~1.5–2s ease-out; UI-SPEC locks: 1.8s, `cubic-bezier(0.33, 1, 0.68, 1)`).
- Word cloud font-size min/max clamping (UI-SPEC locks formula based on per-dataset range: min → 0.75rem, max → 2.0rem).
- Whether S7 needs its own Svelte component or inline in App.svelte (UI-SPEC locks: inline in App.svelte; extract `countUp()` utility if RAF loop exceeds ~30 lines).
- Table loading state (UI-SPEC locks: single-row `<td colspan="5">` loading text, no spinner).

### Deferred Ideas (OUT OF SCOPE)

- Institution-level per-word record pre-baking (620 × 20 = 12,400 files) — v2.
- Virtual scroll for word-click tables with >1000 rows — v2.
- Deep links via URL hash — v2.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SEC-07 | S7 animates total "high" spending as count-up reveals per anchor (kopi jago, seblak, SD schools, puskesmas) — both languages, cited unit prices | D-01 through D-04; anchor price research in Standard Stack section |
| SEC-08 | S8 renders pre-built word cloud (top 20 words) with Central/District/All toggle and institution-name picker — both languages; <480px degrades to tag-chip list | D-05 through D-08; wordcloud JSON files verified in codebase |
| SEC-09 | S9 shows filtered record table (lembaga, satker, pagu, paket, inappropriateReason) when user clicks a word in cloud — both languages | D-09 through D-13; prepare-data.py extension documented |
| MOB-02 | Word cloud degrades to scrollable tag-chip list on screens below 480px | D-06; UI-SPEC §Responsive Contracts verified |
| MOB-03 | All interactive elements have minimum 44×44px tap targets | UI-SPEC §Touch target exceptions; all word cloud buttons and filter toggles |
</phase_requirements>

---

## Summary

Phase 3 completes the narrative with three features built entirely on the existing Svelte 5 / static-JSON foundation established in Phases 1 and 2. No new libraries are needed. The three features share a single integration surface: `App.svelte` gets new `$state` variables, two new `makeScroller` calls, and the S7/S8/S9 HTML sections; `i18n.js` gets new copy keys; `constants.json` gets an `anchors` key; and `prepare-data.py` is extended to emit 60 per-word record JSON files.

S7 (anchor count-up) is the simplest: it follows the exact scrollama step pattern already used by S2/S3/S5/S6, with a `requestAnimationFrame` count-up loop and an `aria-live` transition label. The only novel element is the animation logic, which is about 20–30 lines of plain JS.

S8 (word cloud) introduces the most new HTML/CSS — a filter bar, a flex-wrap button cloud, a searchable dropdown — but no new library. All data is already in `dashboard/public/data/`. The most complex interaction is the mutually exclusive filter state machine (3 toggle states + institution picker state), which maps cleanly onto 2–3 `$state` variables.

S9 (record table overlay) is a reactive overlay within S8's sticky panel, toggled by `selectedWord` state. The data layer is 60 small JSON files produced by an extension of `prepare-data.py`. The table itself is a standard HTML `<table>` with defined column widths and CSS overflow handling.

**Primary recommendation:** Plan the three features as three sequential wave items in a single phase, with a shared Wave 0 task that extends `prepare-data.py` and `constants.json` (prerequisite data before any UI work can be tested end-to-end).

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| S7 count-up animation | Browser / Client | — | Pure JS `requestAnimationFrame` loop; no server needed; data from pre-baked `constants.json` |
| S7 anchor unit prices | Static / Data | — | Hardcoded in `constants.json` with source URLs; researcher-determined values |
| S8 word cloud render | Browser / Client | — | `flex-wrap` CSS + `<button>` elements; data from pre-baked word cloud JSON files |
| S8 filter state machine | Browser / Client | — | 2–3 `$state` variables in `App.svelte`; JSON files switched client-side |
| S8 institution search | Browser / Client | — | Native JS `.filter()` on keys array loaded from `wordcloud-lembaga.json`; no server |
| S9 record table | Browser / Client | — | Overlay HTML/CSS; data from per-word JSON files fetched lazily via `safeFetch` |
| Per-word record files | Static / Data Pipeline | — | `prepare-data.py` extension; 60 files emitted at build time; fetched on demand |
| i18n copy (S7/S8/S9) | Browser / Client | — | New keys added to `i18n.js` following existing `t[lang]` pattern |

---

## Standard Stack

### Core (verified in codebase — no new additions)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Svelte 5 | 5.55.5 | Reactive UI, `$state`/`$derived`/`$props` runes | Already installed, all Phase 2 components use this |
| Vite 5 | 5.4.21 | Dev server + build | Already installed |
| Scrollama | 3.2.x | Scroll-step triggering | Already wired via `makeScroller` pattern in App.svelte |

[VERIFIED: codebase — `dashboard/package-lock.json` and existing component code]

**No new npm packages are required for Phase 3.** All UI is built with:
- CSS `flex-wrap` for the word cloud layout
- Native JS `Array.filter()` for institution search
- `requestAnimationFrame` for count-up animation
- `safeFetch` (already in `App.svelte`) for lazy per-word record loading

### Supporting (build-time Python — no change to runtime)

| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| Python | 3.11+ | `prepare-data.py` extension | Produces 60 per-word JSON files at data prep time |
| uv | current | Script runner with inline deps | `uv run dashboard/scripts/prepare-data.py` |

[VERIFIED: codebase — `prepare-data.py` inline script metadata]

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS flex-wrap + inline font-size | d3-cloud (browser) | d3-cloud in browser is explicitly out-of-scope per REQUIREMENTS.md; word positions already pre-computed offline if needed, but flex-wrap is simpler and more accessible |
| Native JS filter for institution search | Fuse.js fuzzy search | Overkill for 620 institution name strings; exact substring match is sufficient |
| requestAnimationFrame count-up | CSS @keyframes counter | RAF gives full control over easing, locale formatting, and reset-on-backwards-scroll |
| 60 pre-baked per-word JSON files | Dynamic API route filtering records | No server runtime — must be static files |

**Version verification:**
```bash
# Already confirmed via codebase read — no new packages to verify
node -e "const p=require('./dashboard/package-lock.json'); console.log(p.packages['node_modules/svelte'].version)"
# → 5.55.5
```

[VERIFIED: codebase]

---

## Architecture Patterns

### System Architecture Diagram

```
Browser load
    │
    ├─→ safeFetch('/data/summary-stats.json')  ─→  stats.$state  ─→  S7 labelPagu.high
    ├─→ safeFetch('/data/constants.json')       ─→  constants.$state ─→ S7 anchor prices
    ├─→ safeFetch('/data/wordcloud-all.json')   ─→  cloudWords.$state ─→ S8 initial cloud
    └─→ safeFetch('/data/wordcloud-lembaga.json') ─→ lembagaIndex.$state ─→ S8 search dropdown

Scroll to S7 section
    └─→ scrollama step 0 enters → activeStepS7=0
            └─→ countUp() fires × 2 (kopi, seblak) simultaneously → animated figure
    └─→ scrollama step 1 enters → activeStepS7=1
            └─→ s7TransitionLabel visible (aria-live)
            └─→ setTimeout 300ms → countUp() fires (SD schools)
            └─→ setTimeout 450ms → countUp() fires (puskesmas)

Scroll to S8 section
    └─→ scrollama step 0 enters → activeStepS8=0 (cloud visible)
    │
    ├─→ User clicks filter toggle (Central/District/All)
    │       └─→ activeFilter.$state → load wordcloud-{filter}.json → re-render cloud
    │
    ├─→ User types in institution search
    │       └─→ native JS filter on lembagaIndex keys → dropdown renders
    │       └─→ user selects institution → activeFilter='lembaga', activeLembaga=name
    │                                   → cloud words from lembagaIndex[name]
    │
    └─→ User clicks cloud word button
            └─→ selectedWord.$state = word
            └─→ S8 cloud hidden ({#if !selectedWord})
            └─→ S9 overlay shown ({#if selectedWord})
            └─→ safeFetch('/data/word-{word}-{filter || "all"}.json')
                    → wordRecords.$state → table renders
            └─→ Close (× button | outside click | same word)
                    → selectedWord = null → cloud returns
```

### Recommended Project Structure

No new directories. All additions to existing files:

```
dashboard/
├── src/
│   ├── App.svelte          # +S7/S8/S9 HTML sections, +new $state vars, +makeScroller calls
│   └── i18n.js             # +S7/S8/S9 copy keys
├── public/data/
│   ├── constants.json      # +anchors key with unit prices + source URLs
│   ├── wordcloud-all.json       # already exists
│   ├── wordcloud-central.json   # already exists
│   ├── wordcloud-district.json  # already exists
│   ├── wordcloud-lembaga.json   # already exists (620 institutions)
│   └── word-{word}-{filter}.json  # NEW: 60 files (20 words × 3 filters)
└── scripts/
    └── prepare-data.py     # extended to output 60 per-word record files
```

### Pattern 1: makeScroller Integration (Verified from existing code)

```javascript
// Source: App.svelte onMount — existing pattern, Phase 3 adds two more calls
scrollers = [
  makeScroller('s1', i => { activeStepS1 = i }),
  makeScroller('s2', i => { activeStepS2 = i }),
  // ... existing ...
  makeScroller('s7', i => { activeStepS7 = i }),  // NEW — 2 steps
  makeScroller('s8', i => { activeStepS8 = i }),  // NEW — 1 step (reveal trigger)
]
```

[VERIFIED: codebase — App.svelte lines 57–62]

### Pattern 2: Count-Up Animation (requestAnimationFrame, no library)

```javascript
// Source: App.svelte — inline utility function (authoring pattern)
// Per UI-SPEC: duration 1.8s, easing cubic-bezier(0.33, 1, 0.68, 1)
function countUp(target, duration, onUpdate, onDone) {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReduced) { onUpdate(target); onDone?.(); return }
  const start = performance.now()
  function frame(now) {
    const t = Math.min((now - start) / duration, 1)
    // ease-out cubic: cubic-bezier(0.33, 1, 0.68, 1) approximation
    const eased = 1 - Math.pow(1 - t, 3)
    onUpdate(Math.floor(eased * target))
    if (t < 1) requestAnimationFrame(frame)
    else { onUpdate(target); onDone?.() }
  }
  requestAnimationFrame(frame)
}
```

[ASSUMED — pattern based on standard RAF loop; easing formula from cubic-bezier math]

### Pattern 3: S7 Step-Driven State in Svelte 5

```javascript
// Source: App.svelte — new $state variables following Phase 2 conventions
let activeStepS7 = $state(0)
let kopiCount    = $state(0)
let seblakCount  = $state(0)
let sdCount      = $state(0)
let puskesmasCount = $state(0)
let s7ShowTransition = $state(false)

// In $effect or onStepEnter callback:
$effect(() => {
  if (activeStepS7 === 0 && constants) {
    s7ShowTransition = false
    const high = stats?.labelPagu?.high ?? 0
    countUp(Math.floor(high / constants.anchors.kopi.price), 1800, v => kopiCount = v)
    countUp(Math.floor(high / constants.anchors.seblak.price), 1800, v => seblakCount = v)
  }
  if (activeStepS7 === 1 && constants) {
    s7ShowTransition = true
    const high = stats?.labelPagu?.high ?? 0
    setTimeout(() => countUp(Math.floor(high / constants.anchors.sd.price), 1800, v => sdCount = v), 300)
    setTimeout(() => countUp(Math.floor(high / constants.anchors.puskesmas.price), 1800, v => puskesmasCount = v), 450)
  }
})
```

[ASSUMED — pattern synthesized from Phase 2 conventions and UI-SPEC timing specs]

**Note:** Svelte 5 `$effect()` tracks reactive dependencies. `activeStepS7`, `constants`, and `stats` are all `$state` — the effect re-runs when they change. Scrolling backwards resets `activeStepS7` to 0 (scrollama fires on re-entry), which resets counts via the effect.

### Pattern 4: Word Cloud Filter State Machine

```javascript
// Source: App.svelte — new $state variables
let cloudWords       = $state([])          // current words array (from any source)
let lembagaIndex     = $state({})          // wordcloud-lembaga.json (loaded on mount)
let activeFilter     = $state('all')       // 'all' | 'central' | 'district' | 'lembaga'
let activeLembaga    = $state(null)        // institution name when activeFilter='lembaga'
let lembagaSearch    = $state('')          // search input value
let selectedWord     = $state(null)        // null | word string (drives S9 toggle)
let wordRecords      = $state([])          // current S9 table rows
let wordRecordsLoading = $state(false)
let wordCache        = new Map()           // keyed by 'word-filter'

// Filter change handler
async function setFilter(filter, lembagaName = null) {
  selectedWord = null  // close S9 if open
  activeFilter = filter
  activeLembaga = lembagaName
  if (filter === 'all')      cloudWords = await safeFetch('/data/wordcloud-all.json')
  if (filter === 'central')  cloudWords = await safeFetch('/data/wordcloud-central.json')
  if (filter === 'district') cloudWords = await safeFetch('/data/wordcloud-district.json')
  if (filter === 'lembaga')  cloudWords = lembagaIndex[lembagaName] ?? []
}
```

[ASSUMED — pattern synthesized from CONTEXT.md D-07/D-08 and Phase 2 fetch conventions]

### Pattern 5: S9 Lazy Fetch with Cache

```javascript
// Source: App.svelte — new handler
async function selectWord(word) {
  if (selectedWord === word) { selectedWord = null; return }
  selectedWord = word
  wordRecords = []
  // Institution filter falls back to 'all' per D-12
  const filterKey = activeFilter === 'lembaga' ? 'all' : activeFilter
  const cacheKey = `${word}-${filterKey}`
  if (wordCache.has(cacheKey)) {
    wordRecords = wordCache.get(cacheKey)
    return
  }
  wordRecordsLoading = true
  try {
    const data = await safeFetch(`/data/word-${word}-${filterKey}.json`)
    wordCache.set(cacheKey, data)
    wordRecords = data
  } catch (e) {
    wordRecords = null  // triggers error state
  } finally {
    wordRecordsLoading = false
  }
}
```

[ASSUMED — synthesized from CONTEXT.md D-09/D-10/D-12 and existing safeFetch pattern]

### Pattern 6: prepare-data.py Extension for 60 Per-Word Files

The extension reads all `*_priority.json` shards (already loaded in the high/med/flagged loop) and builds per-word record lists:

```python
# New section in prepare-data.py after existing loops
from collections import defaultdict

WORDS_ALL      = [w["word"] for w in json.loads((OUT_DIR / "wordcloud-all.json").read_text())]
WORDS_CENTRAL  = [w["word"] for w in json.loads((OUT_DIR / "wordcloud-central.json").read_text())]
WORDS_DISTRICT = [w["word"] for w in json.loads((OUT_DIR / "wordcloud-district.json").read_text())]
ALL_WORDS      = list(set(WORDS_ALL + WORDS_CENTRAL + WORDS_DISTRICT))  # deduplicated
TOP_RECORDS    = 20

# Bucket structure: records[word][filter] = list of record dicts
records = {w: {"all": [], "central": [], "district": []} for w in ALL_WORDS}

for path in sorted(DATA_DIR.glob("*_priority.json")):
    for r in json.load(path.open()):
        if r.get("tags", {}).get("isInappropriate") != "high":
            continue
        paket = (r.get("paket") or "").lower()
        owner = r.get("ownerType") or "unknown"
        for word in ALL_WORDS:
            if word in paket:
                rec = {
                    "lembaga":           r.get("lembaga") or "Unknown",
                    "satker":            r.get("satker") or "",
                    "pagu":              r.get("pagu") or 0,
                    "paket":             r.get("paket") or "",
                    "inappropriateReason": r.get("tags", {}).get("inappropriateReason") or "",
                }
                records[word]["all"].append(rec)
                if owner == "central":
                    records[word]["central"].append(rec)
                elif owner in ("provinsi", "kabkota"):
                    records[word]["district"].append(rec)

for word in ALL_WORDS:
    for filt in ("all", "central", "district"):
        top = sorted(records[word][filt], key=lambda x: x["pagu"], reverse=True)[:TOP_RECORDS]
        fname = f"word-{word}-{filt}.json"
        (OUT_DIR / fname).write_text(json.dumps(top, ensure_ascii=False, indent=2))
```

[ASSUMED — implementation sketch; matches CONTEXT.md D-10 naming pattern and data contract]

**Important notes on the extension:**
1. The wordcloud JSON files must already exist before this section runs (they are produced by `word-cloud.py`, not `prepare-data.py`). The extension reads them to discover which 20 words to index.
2. The loop iterates only `*_priority.json` shards (high-inappropriate records) — no need to re-read JSONL.
3. `wordcloud-lembaga.json` institution data provides the per-institution word arrays; per-institution record baking is deferred to v2 per D-12.

### Anti-Patterns to Avoid

- **Re-fetching all 60 files on mount:** Only fetch per-word files lazily on user click. Use the `wordCache` Map to prevent re-fetching. [VERIFIED: D-09 "lazy" requirement]
- **Animating all S7 count-ups simultaneously on initial page load:** Scrollama `onStepEnter` fires on entry (scroll-driven). Count-ups only start when the step enters the viewport.
- **Hardcoding font-size clamping to wordcloud-all.json's range (855–6144) for central filter (173–620):** Font scaling must use the min/max of the *currently active* cloud words array, not a fixed global range. [VERIFIED: count ranges confirmed in data]
- **Using `position: relative` on `.sticky-col` inside S8:** Per Phase 2 code review learning, chart/interactive sections must keep `position: sticky` on mobile — only text-only sections (like S1) override to `relative`. S8 is interactive, so it retains sticky.
- **Putting `selectedWord` close handler on `document` click:** Attach it to the sticky panel element, not document. `event.target.closest('.s9-overlay')` check prevents closing when clicking inside the overlay.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Scroll step triggering | Custom IntersectionObserver per section | `makeScroller()` (existing) | Already handles offset, mobile/desktop, `onDestroy` teardown |
| Data fetching with error handling | Custom fetch wrapper | `safeFetch()` (existing) | Already handles HTTP error codes and throws consistently |
| Bilingual copy | Ad-hoc `lang === 'id' ? '...' : '...'` ternaries inline | `t[lang].keyName` from `i18n.js` | Consistent pattern, easy refactor |
| Locale-aware number formatting | Manual thousands separator | `Intl.NumberFormat` / `toLocaleString('id-ID')` | Already used in App.svelte (`fmtNum`) |
| Word cloud position layout | d3-cloud in browser | CSS `flex-wrap` with inline `font-size` | d3-cloud is explicitly out-of-scope; pre-baked positions not needed for this layout |
| Institution fuzzy search | Fuse.js | Native `Array.filter()` with `toLowerCase().includes()` | 620 strings, substring match is sufficient and requires no new package |

**Key insight:** Every "new" capability in Phase 3 reuses primitives already in App.svelte. The only genuinely new logic is the RAF count-up loop (~25 lines) and the word cloud font-size interpolation formula (~3 lines). Everything else is wiring and HTML.

---

## Anchor Unit Prices — Research Findings

### Current Data Values

From `summary-stats.json` (verified in codebase):
- `labelPagu.high` = **Rp 10,729,224,542,293** (~Rp 10.73 trillion)

This is the base figure for all four anchor calculations.

### Kopi Jago Cup Price

[CITED: hargamenu.net via WebSearch results] — Kopi Jago menu starts at **Rp 8,000** (kopi susu jago, basic black). The project calls it "kopi jago" specifically, consistent with street-coffee framing.

**Recommended value: Rp 8,000**

Derived count at Rp 8,000: **1,341,153,067 cups** (~1.34 billion cups)

[ASSUMED — exact price; website data accessed via search result summary, not direct page scrape. Published range: Rp 8,000–Rp 12,000. Rp 8,000 is the cheapest/most common anchor price for the narrative — use the low end for maximum shock value.]

### Seblak Portion Price

[CITED: food.detik.com via WebSearch results] — Street food seblak in Jakarta ranges Rp 9,000–Rp 25,000. Budget stalls from Rp 9,000–Rp 11,000. The "standard" street portion mid-range is **Rp 15,000**.

**Recommended value: Rp 15,000**

Derived count at Rp 15,000: **715,281,636 portions** (~715 million portions)

[ASSUMED — exact price; Rp 15,000 is a conservative mid-range from multiple web sources. The project's framing ("porsi seblak") implies a standard street-stall portion.]

### SD Elementary School (New Build) Cost

[CITED: bisnis.com via WebSearch result] — Sri Mulyani's 2022 comparison cited Rp 12 billion per puskesmas and, implicitly, lower per-school. Other sources:
- DAK Fisik revitalization (partial renovation): much lower
- Full new build: Rp 3–7 billion range from regional contractor data

[CITED: Kemdikbud / BPKP construction norms via WebSearch] — a standard 6-classroom SD building at ~1,200 m² at Rp 3–4.5 million/m² = Rp 3.6–5.4 billion.

**Recommended value: Rp 4,500,000,000 (Rp 4.5 billion)**

Derived count at Rp 4.5B: **2,384 schools**

[ASSUMED — exact price; Rp 4.5B is a midpoint of the Rp 3.6–5.4B range for a standard 6-classroom SD. The `sources` entry in `constants.json` should cite the 2022 Bisnis.com article on IKN comparison which used credible government unit costs. Source URL: `https://ekonomi.bisnis.com/read/20220829/9/1571641/`]

### Puskesmas (New Build) Cost

[CITED: antaranews.com via WebSearch] — Kemenkes allocated Rp 13 billion for a new puskesmas in Dompu (2025/2026 budget).
[CITED: infopublik.id via WebSearch] — 2021 puskesmas build at Rp 6.3 billion.
[CITED: Sri Mulyani 2022 via bisnis.com] — Rp 12 billion per puskesmas assumed.

Range: Rp 6.3B–Rp 13B. The 2025 Kemenkes DAK allocation of Rp 13B represents current cost.

**Recommended value: Rp 8,000,000,000 (Rp 8 billion)** — conservative, mid-range, avoids either extreme.

Derived count at Rp 8B: **1,341 puskesmas**

[ASSUMED — exact price; Rp 8B is a defensible midpoint. The coincidence that 1,341 puskesmas equals the kopi cup calculation divided by ~1 million is purely arithmetic. Use `sources` entry citing antara/infopublik and the Kemenkes budget announcement.]

### Recommended `constants.json` `anchors` Key Structure

```json
{
  "anchors": {
    "kopi": {
      "price": 8000,
      "label_id": "cangkir kopi jago",
      "label_en": "cups of kopi jago",
      "source": "https://hargamenu.net/daftar-harga-menu-kopi-jago-nikmati-kopi-kualitas-kaf/",
      "sourceLabel": "Harga Menu Kopi Jago 2025 — hargamenu.net"
    },
    "seblak": {
      "price": 15000,
      "label_id": "porsi seblak",
      "label_en": "portions of seblak",
      "source": "https://food.detik.com/info-kuliner/d-7083649/harga-seblak-lebih-dari-rp-40-ribu-disebut-mahal-berapa-kisarannya",
      "sourceLabel": "Harga Seblak — Detik Food"
    },
    "sd": {
      "price": 4500000000,
      "label_id": "sekolah dasar baru",
      "label_en": "new elementary schools",
      "source": "https://ekonomi.bisnis.com/read/20220829/9/1571641/total-anggaran-ikn-bisa-dipakai-bangun-ribuan-puskesmas-dan-sekolah-dasar-ini-perhitungannya",
      "sourceLabel": "Estimasi biaya pembangunan SD — Bisnis.com"
    },
    "puskesmas": {
      "price": 8000000000,
      "label_id": "puskesmas baru",
      "label_en": "new primary health clinics",
      "source": "https://mataram.antaranews.com/berita/553549/kemenkes-gelontorkan-rp13-miliar-untuk-puskesmas-di-dompu",
      "sourceLabel": "Kemenkes alokasi Rp13M untuk puskesmas — Antara News"
    }
  }
}
```

[ASSUMED — exact structure; follows existing `constants.json` `sources` pattern and CONTEXT.md D-02 requirement]

---

## Common Pitfalls

### Pitfall 1: Count-Up Fires on Page Load Before Step Is Visible

**What goes wrong:** Scrollama fires once for the first visible step on page load. If S7 is partially in the viewport on load, `activeStepS7` gets set immediately and count-ups start before the user intends.
**Why it happens:** The `offset: 0.5` threshold means a step enters when 50% is visible — on some desktop resolutions, S7 may be partially visible on load.
**How to avoid:** Let the count-up depend on `activeStepS7` AND `constants !== null`. The `constants` fetch completes after page load, so the effect fires on constants arrival. Additionally, since count-ups are tied to scrollama step entry, they only fire when the step actually becomes the focal point.
**Warning signs:** Console log `activeStepS7` on load — if it fires with step 0 immediately, consider adding an `s7Mounted` boolean gate.

### Pitfall 2: Font Scaling Fixed to wordcloud-all Range

**What goes wrong:** Clamping font-size using min=855/max=6144 (wordcloud-all range) when central filter is active (range: 173–620) produces nearly uniform tiny text — all words render at 0.75rem.
**Why it happens:** The formula `min + (count - globalMin) / (globalMax - globalMin) * range` uses hardcoded global min/max.
**How to avoid:** Compute `cloudMin` and `cloudMax` from the *current* `cloudWords` array inside `$derived` or inline in `{#each}`. 

```javascript
let cloudMin = $derived(Math.min(...cloudWords.map(w => w.count)))
let cloudMax = $derived(Math.max(...cloudWords.map(w => w.count)))
// then per-word: size = 0.75 + (w.count - cloudMin) / (cloudMax - cloudMin) * 1.25
```

**Warning signs:** All word cloud buttons render at the same size when switching to central filter.

[VERIFIED: count ranges confirmed — central min=173, max=620; district min=787, max=5524; all min=855, max=6144]

### Pitfall 3: S9 Outside-Click Handler Fires on Scrollama Step Cards

**What goes wrong:** Attaching the outside-click listener to the whole sticky panel causes the S9 table to close whenever the user clicks a step card on the right column. Step cards are outside the sticky panel — so any click anywhere closes the overlay.
**Why it happens:** If the click handler is on `document` or the section element, `.s8-sticky-panel` contains only the left sticky column, but clicking the step card scrolls the page and may trigger the handler.
**How to avoid:** Per UI-SPEC — attach `onclick` to the `.s8-sticky-panel` element (the sticky column, not the whole section). Step cards are in `.steps-col`, which is outside `.sticky-col`.

### Pitfall 4: `prepare-data.py` Extension Word-Matching Too Broad

**What goes wrong:** Matching `word in paket.lower()` finds partial-word matches. The word "sub" appears inside "distribusi", "subsidi", "suburban" — producing irrelevant records.
**Why it happens:** Simple `in` substring check does not respect word boundaries.
**How to avoid:** Use `f' {word} '` boundary check or `re.search(r'\b' + word + r'\b', paket)`. Since the words come from a tokenized word cloud (Indonesian lemmas), they should match stem forms. Test with `word="sub"` and `word="jalan"` against a sample shard.
**Warning signs:** Word-click table shows records where the word does not visibly appear in the package name.

### Pitfall 5: wordcloud-lembaga.json Key Access Pattern

**What goes wrong:** `lembagaIndex[activeLembaga]` returns `undefined` if the institution name has different casing or whitespace than the key in the JSON.
**Why it happens:** Institution names from the search input are user-typed and may not exactly match keys.
**How to avoid:** The institution search dropdown selects directly from the keys array (`Object.keys(lembagaIndex)`), so the selected value is always an exact key. Only allow word cloud to load from `activeLembaga` values that came from the dropdown — never from free text.

[VERIFIED: codebase — wordcloud-lembaga.json is a dict with 620 keys confirmed; sample key "Kab. Probolinggo" has spaces and periods]

### Pitfall 6: S8 Sticky Behavior on Mobile (S1 Override Does Not Apply)

**What goes wrong:** Copying the S1 mobile override (`[data-section="s1"] .sticky-col { position: relative; height: auto; }`) to S8, causing the cloud to scroll away and leave a broken layout.
**Why it happens:** S1 is text-only — no interaction. S8 is interactive — the word cloud must stay visible while the user clicks words.
**How to avoid:** S8 sticky-col stays `position: sticky; height: 50dvh` on mobile. No override. The existing `.scrolly .sticky-col` mobile rule already handles this correctly.

[VERIFIED: App.svelte CSS lines 754–768]

---

## Code Examples

Verified patterns from existing codebase:

### Existing safeFetch (reuse verbatim)

```javascript
// Source: dashboard/src/App.svelte lines 23–27
const safeFetch = url =>
  fetch(url).then(r => {
    if (!r.ok) throw new Error(`${r.status} ${r.statusText} — ${url}`)
    return r.json()
  })
```

### Existing makeScroller (add two new calls to the scrollers array)

```javascript
// Source: dashboard/src/App.svelte lines 51–64 (existing pattern)
const makeScroller = (sectionAttr, onEnter) => {
  const s = scrollama()
  s.setup({ step: `[data-section="${sectionAttr}"] [data-step]`, offset, progress: false })
   .onStepEnter(({ index }) => onEnter(index))
  return s
}
scrollers = [
  // ... existing S1/S2/S3/S5 entries ...
  makeScroller('s7', i => { activeStepS7 = i }),  // add
  makeScroller('s8', i => { activeStepS8 = i }),  // add
]
```

### Word Cloud Font Scaling Formula (per-dataset)

```javascript
// Source: UI-SPEC §Typography — per-dataset scaling
// cloudMin and cloudMax derived from current cloudWords array
const scaleFont = (count, cloudMin, cloudMax) => {
  if (cloudMax === cloudMin) return 1.375  // midpoint fallback
  return 0.75 + ((count - cloudMin) / (cloudMax - cloudMin)) * 1.25
}
// Usage in {#each}: style="font-size: {scaleFont(w.count, cloudMin, cloudMax)}rem"
```

[VERIFIED: UI-SPEC §Typography — formula confirmed; clamping to [0.75, 2.0] is built into the linear interpolation when cloudMin/cloudMax are the actual array extremes]

### Locale-Aware Number Formatting (existing utility)

```javascript
// Source: dashboard/src/App.svelte line 73
const fmtNum = v => v.toLocaleString('id-ID')
// For English: v.toLocaleString('en-US')
// For count-up display, use lang state:
const fmtCount = (v, lang) => v.toLocaleString(lang === 'id' ? 'id-ID' : 'en-US')
```

### S9 Pagu Abbreviation (new utility needed)

```javascript
// New utility — abbreviated pagu for table column
// Format: "Rp 1,2 M" (millions) or "Rp 1,2 B" (billions)
const fmtPaguShort = (v, lang) => {
  if (v >= 1e12) return `Rp ${(v / 1e12).toFixed(1).replace('.', lang === 'id' ? ',' : '.')} T`
  if (v >= 1e9)  return `Rp ${(v / 1e9).toFixed(1).replace('.', lang === 'id' ? ',' : '.')} M`
  return `Rp ${(v / 1e6).toFixed(0)} jt`
}
```

[ASSUMED — utility design based on UI-SPEC §Typography S9 pagu column spec]

### aria-live Transition Label (existing s6 pattern, replicate for S7)

```svelte
<!-- Source: App.svelte line 369-371 — existing s6TransitionLabel pattern -->
<span class="s6-transition-label" aria-live="polite">
  {activeStepS5 >= 2 ? t[lang].s6TransitionLabel : ''}
</span>

<!-- S7 equivalent (new) -->
<span class="s7-transition-label" aria-live="polite">
  {s7ShowTransition ? t[lang].s7TransitionLabel : ''}
</span>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| d3-cloud browser word layout | Pre-baked CSS flex-wrap with per-word font-size | Project decision (REQUIREMENTS.md) | No d3-cloud runtime; positions are linear flex, not collision-free — but faster and accessible |
| Svelte 4 `$store` reactive state | Svelte 5 `$state` runes | Phase 1 | All new Phase 3 state uses `$state()`, `$derived()` |
| `100vh` sticky height | `100dvh` sticky height | Phase 2 fix | `dvh` accounts for mobile browser chrome; already applied to `.sticky-col` |

**Deprecated/outdated:**
- `BarChart.svelte`: already replaced by `InstitutionsChart.svelte` in Phase 2 (D-09). Phase 3 does not reference it.
- Any `onStepExit` scrollama usage: not used in this project. Backward scrolling is handled by re-entry only.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Kopi Jago cup price = Rp 8,000 | Anchor Unit Prices | Anchor count changes; narrative impact similar unless price is dramatically different (Rp 5,000–Rp 12,000 range all produce billions of cups) |
| A2 | Seblak portion price = Rp 15,000 | Anchor Unit Prices | Anchor count changes; still hundreds of millions at any reasonable price |
| A3 | SD school new-build cost = Rp 4,500,000,000 | Anchor Unit Prices | Count changes from ~2,384 to ~1,500–3,500 depending on actual figure; narrative impact preserved |
| A4 | Puskesmas new-build cost = Rp 8,000,000,000 | Anchor Unit Prices | Count changes from ~1,341 to ~800–1,700; narrative impact preserved |
| A5 | `constants.json` `anchors` key structure (shape, field names) | Code Examples / Architecture | Executor must match code to the actual key names; easy to adjust in implementation |
| A6 | `$effect()` used to trigger count-up on `activeStepS7` change | Code Examples | Svelte 5 `$effect` tracks reactive state — if scrollama callback doesn't trigger reactivity correctly, may need `tick()` or direct call in callback |
| A7 | Word matching in `prepare-data.py` via `word in paket.lower()` | Architecture Patterns | Partial word matches possible; executor should add word-boundary check |
| A8 | `prepare-data.py` extension reads existing wordcloud-{filter}.json files to discover which 20 words to index | Architecture Patterns | wordcloud files must exist before extension runs; if pipeline order differs, extension fails |
| A9 | Font scaling per-dataset (min/max from current cloudWords array) rather than fixed global range | Code Examples | If UI-SPEC intent is global range (855–6144), central filter words would all be tiny; per-dataset scaling is the better UX and consistent with Pitfall 2 |

**Planner note:** A1–A4 are anchor prices — the CONTEXT.md (D-02) explicitly assigns researcher to find these. The values above are recommended defaults. They should be locked in `constants.json` by Wave 0 of the plan so count-up animations have real data during development. If the user wants to adjust prices before publication, they edit only `constants.json`.

---

## Open Questions

1. **`prepare-data.py` vs. separate script for 60-file output**
   - What we know: `prepare-data.py` already reads priority shards; the 60-file loop can be added to the same script.
   - What's unclear: Run time. The full pipeline on 3.2 GB of shards takes several minutes. Adding a 20-word × 3-filter pass adds overhead.
   - Recommendation: Add to `prepare-data.py` (single script, single data pass). The per-word bucketing can be done in the same loop as the existing high/med/flagged counting — no second pass needed.

2. **Word boundary matching in prepare-data.py**
   - What we know: Lemmatized words (e.g. "bangun", "sewa") are stems, not full words. "bangun" appears in "membangun", "dibangun", "pembangunan".
   - What's unclear: Whether partial stem matches are acceptable for the S9 table (they are the same word family), or whether results become confusing.
   - Recommendation: Use simple `in` substring match (consistent with how the word cloud was built by `word-cloud.py`). The word cloud counts already use stem matching, so the table should use the same criterion.

3. **S8 section — does it need a `data-step="0"` trigger or is the reveal purely CSS?**
   - What we know: CONTEXT.md says "S8 may not need scrollama steps if its interaction is click-driven". The UI-SPEC adds one scrollama step for the "initial reveal" of the cloud.
   - What's unclear: Is the scroll step needed to apply an "active" CSS class, or is the cloud always visible?
   - Recommendation: Add one scrollama step (consistent with UI-SPEC). `activeStepS8` drives an initial fade-in via CSS class toggle. This keeps the section feeling like part of the narrative rather than appearing instantly.

---

## Environment Availability

All dependencies pre-verified in Phase 1/2. No new external dependencies for Phase 3.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vite dev server | ✓ | 18+ (LTS) | — |
| Python 3.11+ | `prepare-data.py` extension | ✓ | 3.11+ (project requirement) | — |
| uv | Python script runner | ✓ | current (already used in Phase 1) | `python3 prepare-data.py` directly |
| inaproc-ds/outputs/ shards | prepare-data.py extension | Optional | — | Pre-baked JSON already committed; extension only needed if regenerating |

**Missing dependencies with no fallback:** None.

**Dataset note:** If `inaproc-ds/outputs/` is not present on the executor's machine, the 60 per-word files cannot be generated. However, this is the same situation as Phase 1 DATA-04. The plan should include a "generate or skip" gate — if the dataset is not present, the per-word files are empty arrays `[]` (valid JSON, S9 shows empty table, no crash).

---

## Validation Architecture

`workflow.nyquist_validation` is explicitly `false` in `.planning/config.json`. Validation Architecture section is SKIPPED.

---

## Security Domain

Phase 3 is a static-only, no-authentication, no-input-to-server site. `security_enforcement` is not configured in `.planning/config.json`. No user data is collected. The only user input is:
- Institution search text (used client-side only for native JS `.filter()`, never sent anywhere)
- Word clicks (used to construct a fetch URL — see below)

**Critical pattern — fetch URL construction:**
```javascript
safeFetch(`/data/word-${selectedWord}-${filterKey}.json`)
```
`selectedWord` comes from the `cloudWords` array (pre-baked JSON), not from free user input. `filterKey` is one of three hardcoded strings (`'all'`, `'central'`, `'district'`). Path traversal is not possible. No ASVS categories apply beyond V5 (input validation), which is satisfied by restricting `selectedWord` to array values.

---

## Sources

### Primary (HIGH confidence)
- `dashboard/src/App.svelte` — Verified all existing patterns: makeScroller, safeFetch, $state variable names, CSS token names, sticky-col/steps-col structure, mobile overrides
- `dashboard/src/i18n.js` — Verified all existing copy key naming conventions
- `dashboard/public/data/summary-stats.json` — Verified `labelPagu.high = 10729224542293`
- `dashboard/public/data/wordcloud-all.json` — Verified 20 words, count range 855–6144
- `dashboard/public/data/wordcloud-central.json` — Verified 20 words, count range 173–620
- `dashboard/public/data/wordcloud-district.json` — Verified 20 words, count range 787–5524
- `dashboard/public/data/wordcloud-lembaga.json` — Verified 620 institution keys, array-of-{word,count} values
- `.planning/phases/03-interactive-back-half-s7-s9/03-CONTEXT.md` — Locked decisions D-01 through D-13
- `.planning/phases/03-interactive-back-half-s7-s9/03-UI-SPEC.md` — Visual/interaction contract for all Phase 3 elements

### Secondary (MEDIUM confidence)
- [hargamenu.net via WebSearch] — Kopi Jago menu prices: basic cup Rp 8,000
- [food.detik.com via WebSearch] — Seblak price range Rp 9,000–Rp 25,000; standard portion ~Rp 15,000
- [bisnis.com via WebSearch] — IKN comparison article citing Rp 12B per puskesmas (Sri Mulyani 2022)
- [antaranews.com via WebSearch] — Kemenkes Rp 13B for puskesmas in Dompu
- [infopublik.id via WebSearch] — Rp 6.3B for puskesmas construction (2021)

### Tertiary (LOW confidence)
- [WebSearch — school construction cost] — Rp 3–7B range for SD new build; specific Kemendikbud/BPKP unit cost PDF not directly accessed; recommended Rp 4.5B is midpoint estimate

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries, all verified in codebase
- Architecture: HIGH — all patterns traced to existing working code
- Anchor prices: MEDIUM — web search results consulted; prices are consistent across sources
- Anchor SD school price: LOW — exact official unit cost not retrieved from Kemendikbud PDF; Rp 4.5B is a reasonable midpoint from range estimates
- Pitfalls: HIGH — all pitfalls traced to verified code behavior or data values

**Research date:** 2026-05-14
**Valid until:** 2026-06-14 (anchor prices stable; code patterns don't change mid-phase)
