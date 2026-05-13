# Technology Stack Research

**Project:** idsterity — Indonesian Procurement Scrollytelling Site
**Researched:** 2026-05-13
**Mode:** Ecosystem / Comparison

---

## Recommended Stack

| Component | Recommended | Version | Rationale | Confidence |
|-----------|-------------|---------|-----------|------------|
| Core framework | Svelte 5 | 5.55.5 (existing) | Already in use; runes are the right model for step-driven reactive state | HIGH |
| Build tool | Vite 5 | 5.4.21 (existing) | Zero-config for static output; Rollup tree-shaking removes unused messages | HIGH |
| i18n | Paraglide JS 2.0 | `@inlang/paraglide-js` latest | Compiler-based, tree-shakable, works with vanilla Vite + Svelte 5, no SvelteKit required | HIGH |
| Scrollytelling | Scrollama | 3.2.0 | Industry standard at The Pudding; thin IntersectionObserver wrapper; no framework lock-in | HIGH |
| D3 integration pattern | `{@attach}` + `{#each}` hybrid | — | Svelte 5.29+ official recommendation for syncing external libs | HIGH |
| Word cloud data | Pre-computed JSON via Python | — | Avoid runtime layout algorithm; serve positions as static JSON | HIGH |
| Word cloud renderer | Hand-rolled SVG `{#each}` | — | d3-cloud wrapper packages are under-maintained; pre-computed positions make the wrapper unnecessary | MEDIUM |
| Font loading | `vite-plugin-webfont-dl` | latest | Downloads Google Fonts at build time, serves self-hosted, eliminates render-blocking CDN call | HIGH |
| Python NLP | PySastrawi + custom stopwords | latest | Best Indonesian stemmer/stopword library for procurement text; stdlib-compatible | MEDIUM |

---

## i18n Decision

### The Problem This Project Has

idsterity uses a single URL with a client-side language toggle (ID/EN). There is no routing, no URL prefixes, and no server. The user clicks a button; the UI switches language without a page reload. This is the edge case that separates i18n libraries.

### Candidates

**svelte-i18n (v4.0.1)**
- Built around Svelte 4 `$store` reactive model (`$t`, `$locale` etc.)
- Works in Svelte 5 because Svelte 5 still supports stores, but it is not runes-native
- Last published **2 years ago**. The maintainer has stated it needs reworking to move away from singletons. No Svelte 5-specific release
- Store subscription still works, but there is cognitive friction mixing stores with runes
- Suitable for Svelte 4 projects being maintained; wrong choice for a greenfield Svelte 5 project
- Verdict: **avoid for new Svelte 5 projects**

**paraglide-js 2.0 (`@inlang/paraglide-js`)**
- Compiler-based: messages are emitted as individual named functions, not a runtime lookup table
- Vite plugin (`paraglideVitePlugin`) compiles translations at build time; Rollup tree-shaking removes any message function not called in code
- Up to 70% smaller i18n bundle vs runtime libraries (per official benchmarks)
- Works in any Vite project — no SvelteKit required. The old `@inlang/paraglide-sveltekit` adapter is deprecated; 2.0 needs only the Vite plugin
- Locale switching for a no-URL SPA: use `strategy: ["localStorage", "preferredLanguage", "baseLocale"]`. `setLocale("en")` writes to localStorage and reloads the page (one reload, intentional design). For a language toggle on a static page this is acceptable — users switch language once, not constantly
- Full TypeScript autocomplete on message keys (works even in plain JS via JSDoc types)
- Actively maintained; listed on `svelte.dev/docs/cli/paraglide` as the official Svelte CLI integration
- Verdict: **recommended**

**typesafe-i18n**
- Not updated in 2 years but noted as stable and Svelte-5-compatible (stores still work)
- Requires code generation (`npx typesafe-i18n`) for type safety
- More complex setup than paraglide for a two-locale static site
- Verdict: viable fallback, but adds tooling overhead for minimal gain over paraglide

**Rolling your own store**
- Two locales, mostly static copy: a `$state` object keyed by locale is genuinely viable
- Pattern: `let lang = $state('id'); const t = $derived(copy[lang]);`
- Zero dependencies, zero bundle overhead, instant switching (no page reload)
- Loses type safety on translation keys, no pluralization helpers, brittle as copy grows
- For 9 story sections with ~50 strings each this becomes a maintenance burden
- Verdict: acceptable for a prototype, not recommended for final implementation

### Recommendation: Paraglide JS 2.0

Use `@inlang/paraglide-js` with `strategy: ["localStorage", "preferredLanguage", "baseLocale"]`. The one-reload-on-switch tradeoff is acceptable for a journalism piece where users toggle language at most once. Bundle size savings matter on shared hosting with no CDN. The Vite plugin integrates cleanly into the existing `vite.config.js`.

**Vite config addition:**
```js
import { paraglideVitePlugin } from "@inlang/paraglide-js";

export default defineConfig({
  plugins: [
    svelte(),
    paraglideVitePlugin({
      project: "./project.inlang",
      outdir: "./src/paraglide",
      strategy: ["localStorage", "preferredLanguage", "baseLocale"],
    }),
  ],
});
```

**Locale toggle in Svelte:**
```js
import { setLocale, getLocale } from "./paraglide/runtime.js";
// button onclick:
setLocale(getLocale() === "id" ? "en" : "id");
// setLocale triggers a page reload — locale persists via localStorage
```

**If the one-reload behavior is unacceptable**, fall back to the roll-your-own pattern using `$state` + a `copy` object. It is simpler to implement and has zero dependencies, just no type safety.

---

## D3 + Svelte 5 Integration

### The Core Tension

D3 wants to own the DOM. Svelte also owns the DOM. Letting both fight over the same nodes causes double-renders, stale bindings, and Svelte reconciler corruption.

### The Two Valid Patterns

**Pattern A — Svelte owns the DOM, D3 does math only (recommended for this project)**

D3 is used for scales, color interpolation, and data transformations. Svelte `{#each}` loops render the actual SVG elements. This is what the existing `BarChart.svelte` already does.

```svelte
<script>
  import { scaleLinear, scaleBand } from "d3";
  let { data, step } = $props();
  const xScale = $derived(scaleLinear().domain([0, maxVal]).range([0, width]));
</script>
<svg>
  {#each data as d}
    <rect x={0} y={yScale(d.name)} width={xScale(d.value)} height={yScale.bandwidth()} />
  {/each}
</svg>
```

Svelte handles all DOM mutations. D3 is a pure computation library. No DOM conflicts. Transitions via Svelte's `transition:` directive or CSS.

**Pattern B — D3 owns the DOM, `{@attach}` provides the mount point (for complex D3 charts)**

When a visualization requires D3's force simulation, zoom behaviors, or brush selection (which mutate the DOM themselves), surrender the container to D3 via `{@attach}`.

```svelte
<div
  {@attach (node) => {
    const svg = d3.select(node).append("svg");
    // D3 owns everything inside node
    $effect(() => {
      // reactive updates when step changes
      svg.selectAll("rect").data(data).join("rect")...
    });
    return () => svg.remove(); // cleanup
  }}
></div>
```

This is the Svelte 5.29+ recommended approach for external library DOM integration (per `svelte.dev/docs/svelte/best-practices`).

### Which Pattern for Each Section

| Section | Pattern | Reason |
|---------|---------|--------|
| Sections 4–5: Stacked bars | A (Svelte owns DOM) | Simple SVG; scales only from D3 |
| Section 6: Re-ranked bars | A | Same as above |
| Section 7: Anchor animation counters | A | Counter state = `$state`, no D3 needed |
| Section 8: Word cloud | A | Positions pre-computed; render as `{#each}` `<text>` elements |
| Section 9: Explore table | A | Plain HTML table, no D3 |

This project uses Pattern A everywhere. D3 is a math library only. No Pattern B needed.

### Reactive Updates with Runes

```svelte
<script>
  let { step } = $props();
  // Derived values recompute automatically when step changes
  const fill = $derived(step >= 2 ? "#e74c3c" : "#888");
  const barWidth = $derived(step === 0 ? total : flaggedPagu);
</script>
```

Use `$derived` for all values that depend on `step`. Do not use `$effect` to update chart state — that is the old Svelte 4 pattern. The existing POC already uses `$derived` correctly.

### Gotchas

- **`$state.raw()` for large datasets**: Deep reactivity on a 10K-item array is expensive. Use `$state.raw(data)` for fetched JSON arrays that are set once and never mutated field-by-field
- **Avoid `bind:this` + D3 `select(el)`** inside the same component that also renders `{#each}` over the same data — this causes the double-ownership conflict
- **Inline style transitions on SVG**: The existing POC anti-pattern (inline `style="transition: ..."` on `<rect>`) should be replaced with CSS classes toggled by step, or Svelte's `tweened` store for animated numbers

---

## Scrollytelling Library

### Candidates

**Vanilla IntersectionObserver (what the POC uses)**
- Zero dependencies
- Requires manual setup: create observer, attach to each `[data-step]` element, handle enter/exit, handle resize
- The POC implementation in `App.svelte` is ~30 lines and works
- Missing: offset configuration (trigger when element is 50% visible vs 100%), progress tracking (0–1 value for within-step animations), resize debouncing
- Verdict: adequate for simple step triggers; fragile at scale with 9 sections

**Scrollama 3.2.0**
- Used by The Pudding (the visual reference for this project) — directly applicable
- Thin IntersectionObserver wrapper (~6KB minified)
- Framework-agnostic: call `scrollama()` in `onMount`, pass step selector
- Provides `onStepEnter`, `onStepExit`, `onStepProgress` (with 0–1 progress value)
- Handles resize automatically via its internal `resize()` method
- ESM build available, Vite-compatible, no side effects
- Svelte integration: use `onMount` + `onDestroy` to init and tear down
- Verdict: **recommended**

**svelte-scrollyteller (ABC News)**
- Opinionated wrapper: manages sticky graphics, step text blocks, all in one component
- Designed for news CMS workflows, not custom narrative designs
- Too much assumed structure for a bespoke Pudding-style layout
- Verdict: avoid

**Scrolleo (modernized scrollama fork)**
- Pure ESM, TypeScript, same API as scrollama
- Smaller community, less battle-tested in production journalism
- No meaningful advantage over scrollama for this project
- Verdict: use scrollama instead

### Recommendation: Scrollama

```js
// In the section Svelte component (onMount)
import scrollama from "scrollama";
import { onMount, onDestroy } from "svelte";

let activeStep = $state(0);
let scroller;

onMount(() => {
  scroller = scrollama();
  scroller
    .setup({ step: ".step", offset: 0.5 })
    .onStepEnter(({ index }) => { activeStep = index; })
    .onStepExit(({ index, direction }) => {
      if (direction === "up") activeStep = index - 1;
    });
  return () => scroller.destroy();
});
```

The `offset: 0.5` trigger (step enters viewport at 50%) matches Pudding's rhythm. `onStepProgress` is available if within-step animations are needed (Section 7 anchor reveals are a candidate).

---

## Word Cloud

### The Problem with Runtime d3-cloud

The Jason Davies `d3-cloud` library runs a spiral-packing layout algorithm in the browser at render time. This algorithm:
- Is non-deterministic (uses `Math.random()` for word placement)
- Takes 200–800ms for 50+ words on a mid-range device
- Blocks the main thread (it is synchronous and cannot be interrupted)
- Produces different layouts on each page load (jarring if user scrolls back)

For a static journalism page, this is the wrong approach.

### Recommended Approach: Offline Layout, Serve Positions as JSON

Run `d3-cloud` once in the Python pipeline (via Node.js subprocess or a separate JS script called from `prepare-data.py`). Output the computed word positions as a JSON array. Serve that JSON as a static asset. The Svelte component renders `{#each}` over the pre-computed positions — pure SVG, no runtime layout.

**Output format from offline script:**
```json
[
  { "text": "pengadaan", "size": 48, "x": 0, "y": -12, "rotate": 0 },
  { "text": "jasa", "size": 36, "x": 87, "y": 23, "rotate": 0 },
  ...
]
```

**Svelte renderer (no d3-cloud dependency at runtime):**
```svelte
<svg viewBox="-300 -200 600 400">
  {#each words as w}
    <text
      transform="translate({w.x},{w.y}) rotate({w.rotate})"
      font-size={w.size}
      text-anchor="middle"
    >{w.text}</text>
  {/each}
</svg>
```

**For the filter variants** (ownerType + institution name): pre-compute separate JSON files for each filter combination. With ownerType having 3 values and ~10 top institutions, this is ~30–40 small JSON files (~5–15KB each), all served from `public/data/wordcloud/`.

### Alternative: Pure SVG without d3-cloud

For a cap of 15–20 words, a simple frequency-sorted row layout (no spiral) is readable and visually distinct enough. Each word gets a font-size proportional to frequency and is placed in a flex-like SVG grid. This eliminates `d3-cloud` entirely (no Node.js offline step). Downside: less visually dramatic than a cloud shape.

**Recommendation:** Use the pre-computed JSON approach with d3-cloud run offline. This gives the Pudding visual impact without runtime cost. The offline script can use `seedrandom` (via npm in the script environment) to get a deterministic layout for reproducibility.

### Python Pipeline Integration

The word frequency extraction step:
1. Load all `*_priority.json` shards filtered to `tags.isInappropriate = "high"`
2. Tokenize `paket` field: lowercase, strip punctuation, remove Indonesian stopwords (PySastrawi stopword list + domain-specific procurement terms like `pengadaan`, `jasa`, `barang`, `kegiatan`)
3. Count frequency per token; cap at top 20 per filter group
4. Write word frequency JSON to `public/data/wordcloud/`
5. A separate Node script (called as part of `npm run prepare-data` via `&&`) runs d3-cloud on each frequency file and writes position JSON

**PySastrawi availability:** Available on PyPI. Can be declared as an inline dependency in `prepare-data.py` via PEP 723 and run with `uv run`. No separate requirements file needed.

---

## Build Tooling

### Current Config (already working)

```js
// vite.config.js — current
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  plugins: [svelte()],
});
```

### Additions Needed

**1. Paraglide Vite plugin** (if paraglide i18n is adopted)
```js
import { paraglideVitePlugin } from "@inlang/paraglide-js";
// add to plugins array
```

**2. Font self-hosting** — replace Google Fonts CDN links in `index.html`

Option A — `vite-plugin-webfont-dl`: downloads Google Fonts at build time, injects self-hosted fonts, eliminates render-blocking CDN calls. One-line config change; improves Lighthouse "Eliminate render-blocking resources" warning.

```js
import webfontDownload from "vite-plugin-webfont-dl";
// add to plugins; keep existing Google Fonts links in index.html
// plugin intercepts and downloads them during build
```

Option B — `@fontsource/*` packages: install fonts as npm packages, import in CSS. More explicit, works offline, no network calls at build time either.

For a shared hosting deploy without CI, Option A is simpler (existing `index.html` links just work). For strict offline reproducibility, Option B is cleaner.

**3. Static JSON asset handling** — no config change needed

Vite copies everything in `public/` to `dist/` as-is. JSON files in `public/data/` are served at `/data/*.json` — already working. For the word cloud filter variants, add a subdirectory `public/data/wordcloud/` and they will be served at `/data/wordcloud/*.json` automatically.

**4. `assetsInlineLimit` for small SVG/JSON**
```js
build: {
  assetsInlineLimit: 0,  // prevent any JSON from being inlined as data URIs
}
```
JSON files fetched via `fetch()` at runtime are not affected by this setting (they live in `public/`, not `src/`). This setting only matters for imported assets. Leave at default unless inlining problems appear.

**5. Production target**
```js
build: {
  target: "es2020",  // safe for all modern browsers; keeps async/await native
}
```

### Scripts to Add to package.json

```json
{
  "scripts": {
    "prepare-wordcloud": "node scripts/layout-wordcloud.js",
    "prepare-data": "python3 scripts/prepare-data.py && npm run prepare-wordcloud"
  }
}
```

---

## What NOT to Use

| Technology | Why Not |
|------------|---------|
| **SvelteKit** | Overkill for a single static scrollytelling page; no routing, no SSR needed; adds build complexity; existing Vite + Svelte setup is the right level |
| **@inlang/paraglide-sveltekit** | Deprecated in Paraglide 2.0; not needed; use `@inlang/paraglide-js` directly |
| **svelte-i18n** | 2+ years without updates; store-based (not runes-native); last activity signals maintenance risk |
| **react-scrollama** | React-specific wrapper; not applicable |
| **d3-cloud at runtime** | Non-deterministic, synchronous, slow on mobile; always run offline, serve positions as JSON |
| **svelte-d3-cloud npm package** | Thin wrapper over d3-cloud that still runs layout at render time; adds a dependency with no benefit if positions are pre-computed |
| **WordCloud Python library (amueller)** | Raster PNG output only; cannot produce interactive SVG with click/filter behaviors needed for Section 9 |
| **Google Fonts CDN in production** | Render-blocking, privacy concern (GDPR/Indonesian data law), Lighthouse penalty; self-host via `vite-plugin-webfont-dl` |
| **`$effect` for chart state updates** | The Svelte 5 docs explicitly recommend `$derived` instead; `$effect` for state sync is an anti-pattern that causes infinite update loops |
| **Canvas for charts** | SVG is easier to make accessible, easier to animate per-element, and sufficient for the data volumes in this project |
| **Tailwind CSS** | Not in the existing stack; adds ~3MB dev dependency for styling that is better expressed as scoped Svelte component CSS for a bespoke visual design |

---

## Sources

- Paraglide JS Vite setup: https://github.com/opral/paraglide-js/blob/main/examples/vite/README.md
- Paraglide strategy docs: https://inlang.com/m/gerre34r/library-inlang-paraglideJs/strategy
- Paraglide static site generation: https://github.com/opral/paraglide-js/blob/main/docs/static-site-generation.md
- Svelte 5 `{@attach}` directive: https://github.com/sveltejs/svelte/blob/main/documentation/docs/03-template-syntax/09-@attach.md
- Svelte 5 best practices (`$effect` vs `$derived`): https://svelte.dev/docs/svelte/best-practices
- Scrollama API: https://github.com/russellsamora/scrollama
- d3-cloud about page (layout algorithm): https://www.jasondavies.com/wordcloud/about/
- PySastrawi: https://github.com/har07/PySastrawi
- vite-plugin-webfont-dl: https://github.com/feat-agency/vite-plugin-webfont-dl
- Reuters Graphics Svelte patterns: https://reuters-graphics.github.io/example_svelte-graph-patterns/
- Svelte + D3 visualization course: https://datavisualizationwithsvelte.com/
- Paraglide official Svelte CLI docs: https://svelte.dev/docs/cli/paraglide
