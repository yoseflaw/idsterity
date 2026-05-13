# Pitfalls Research

**Project:** idsterity — bilingual scrollytelling data journalism site
**Researched:** 2026-05-13
**Confidence:** HIGH (Svelte 5 from Context7 official docs; deploy/OG from multiple verified sources)

---

## Critical Pitfalls (will block launch)

### 1. SPA 404 on Direct URL or Refresh — Shared Hosting

**What goes wrong:** Shared hosting (Apache) has no knowledge of client-side routing. When a visitor navigates directly to any path other than `/` (e.g., typing the URL directly after a link is shared), Apache tries to find that file on disk, fails, and returns a 404. This breaks the entire landing experience.

**Why it happens:** Vite builds an SPA where all routing is handled client-side by JavaScript. Apache expects actual files at each URL. Without configuration, Apache never serves `index.html` for non-root paths.

**Consequences:** Every LinkedIn share that lands on anything other than `/` returns an error page. LinkedIn's preview bot may also fail if it attempts to crawl the OG URL.

**Prevention:**
```apache
# .htaccess — must sit at document root alongside index.html
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```
Place this file in the same directory as the Vite `dist/` output. Verify `mod_rewrite` is enabled on the hosting provider.

**Detection:** After deploying, navigate directly to `yourdomain.com/anything` in a fresh browser tab. If you get a 404 from Apache (not your app), the `.htaccess` is missing or not being read.

**Phase to address:** Deploy phase — before any public link is shared.

---

### 2. Vite `base` Path Mismatch — Data Files Return 404

**What goes wrong:** If the site is deployed to a subdirectory (e.g., `yosef.id/idsterity/`) rather than the domain root, all `fetch('/data/lembaga-totals.json')` calls hardcoded with a leading `/` will request `yosef.id/data/...` instead of `yosef.id/idsterity/data/...`. Every chart goes blank with no visible error.

**Why it happens:** Files in Vite's `public/` folder are served at root path during dev and copied as-is to `dist/`. Fetch calls using absolute paths (`/data/`) are not rewritten by Vite's `base` config — only `import`-style asset references are rewritten.

**Consequences:** Silent failure. No console error unless error handling is added. The existing codebase already has zero error handling on fetch (confirmed in CONCERNS.md).

**Prevention:**
- Decide the final deploy path before building. If root: keep `base: '/'`. If subdirectory: set `base: '/idsterity/'` in `vite.config.js`.
- Replace all `fetch('/data/...')` with `fetch(import.meta.env.BASE_URL + 'data/...')` to make paths base-aware.
- Add error handling that shows a visible failure state (not infinite loading pulse).

**Detection:** Build and serve locally from a subdirectory path. Watch the network tab in DevTools for 404s on JSON files.

**Phase to address:** Phase 1 of implementation — fix before adding more data files.

---

### 3. LinkedIn OG Image Format or Size Wrong — No Preview Card

**What goes wrong:** LinkedIn's scraper silently skips OG images that are WebP format, over 5 MB, or the wrong aspect ratio. The share will show up as a plain text link with no image card — the single biggest reason data journalism articles fail to get engagement on LinkedIn.

**Why it happens:** LinkedIn's crawler does not support WebP (as of confirmed 2025 reports). The idsterity codebase currently has zero OG tags (confirmed in CONCERNS.md).

**Consequences:** Every share on LinkedIn produces a blank link. The dark-irony emotional hook requires a visual card — without it, click-through rate collapses.

**Prevention:**
- OG image: 1200×627px (not 1200×630 — LinkedIn's documented spec is 627px), JPG or PNG only, under 5 MB (target under 300 KB).
- Required tags minimum set:
  ```html
  <meta property="og:title" content="...">
  <meta property="og:description" content="...">
  <meta property="og:image" content="https://yosef.id/og-image.jpg">
  <meta property="og:url" content="https://yosef.id/">
  <meta property="og:type" content="website">
  ```
- `og:image` must be an absolute URL — relative URLs are not followed by LinkedIn's scraper.
- After first deploy, force a re-scrape at LinkedIn's Post Inspector: `https://www.linkedin.com/post-inspector/`.

**Detection:** LinkedIn caches previews for 7–14 days. Use the Post Inspector immediately after deploying OG changes; do not rely on native share flow to see updates.

**Phase to address:** Before any public sharing — implement in the same phase as static HTML structure.

---

## Common Pitfalls (degrade quality)

### 1. IntersectionObserver Accumulation on Hot Reload

**What goes wrong:** The existing POC already exhibits this bug (confirmed CONCERNS.md). On Vite HMR, Svelte components remount and `$effect` re-runs. If the observer is not disconnected in the effect's cleanup return, each HMR cycle adds another observer to the same DOM nodes. `activeStep` fires multiple times per scroll event, causing visual jumps and double-triggering animations.

**Prevention:** Always return a cleanup function from the `$effect` that registers the observer:
```javascript
$effect(() => {
  const observer = new IntersectionObserver(callback, options);
  steps.forEach(el => observer.observe(el));
  return () => observer.disconnect(); // critical
});
```

**Phase to address:** Phase 1 — fix in the POC replacement before building remaining sections.

---

### 2. `rootMargin` Magic Number Breaks on Mobile

**What goes wrong:** The existing `rootMargin: '-38% 0px -38% 0px'` was tuned for one viewport on desktop. On mobile, the sticky panel height and step card heights differ, shifting when step activation fires. A step can activate before the user has finished reading it, or — worse — refuse to activate on small screens.

**Additional complication:** Using `vh` units in CSS for sticky heights causes constant re-evaluation as mobile browser chrome (address bar) shows/hides on scroll, triggering `resize` events and layout recalculations that jank scroll behavior.

**Prevention:**
- Use `pixel` offsets in `rootMargin` for mobile, not percentage (percentage is relative to the observed element, not viewport — behavior is non-obvious).
- Replace `100vh` sticky heights with `100dvh` (dynamic viewport height) on mobile to account for browser chrome.
- Test at minimum: iPhone SE (375px), iPhone 14 (390px), desktop 1280px.

---

### 3. D3 Transitions Not Cleaned Up on Step Change

**What goes wrong:** If a D3 transition (`.transition().duration(800)`) is mid-flight when the user scrolls back up and triggers the previous step, the new `$effect` run starts a competing transition on the same elements. The chart visually stutters — bars jump to wrong positions before snapping to the new target.

**Prevention:** Always interrupt existing transitions before starting new ones:
```javascript
d3.select(svgEl).selectAll('.bar')
  .interrupt() // cancel any in-flight transition
  .transition()
  .duration(600)
  .attr('width', d => xScale(d.value));
```

---

### 4. Word Cloud Render Blocking Main Thread

**What goes wrong:** D3-cloud (the standard word cloud library) runs its word placement algorithm synchronously on the main thread. With 20 words it is instant. With 50–100 words and a layout re-run triggered by each filter change (ownerType + institution), the algorithm can block for 200–500ms, freezing scroll interaction.

**Prevention:**
- Cap at 20 words maximum (already decided in PROJECT.md — enforce it).
- Pre-compute word positions offline in the Python NLP script and bake them into the JSON output. The browser only renders, never re-runs layout. This eliminates the entire problem class.
- If dynamic layout is needed, debounce filter changes by 300ms so rapid filter clicks don't stack layout runs.

---

### 5. `prepare-data.py` Double I/O Pass Performance

**What goes wrong:** The existing script does two full sequential scans of 123 JSONL shards (confirmed CONCERNS.md). While not blocking launch, re-running data prep after any schema change takes twice as long as necessary.

**Prevention:** Merge into a single pass. `tags.isInappropriate` is present in JSONL records — no need to re-read `_priority.json` files. Saves ~50% of I/O time.

---

## Svelte 5 + D3 Specific

### The DOM Ownership Problem

Svelte 5 and D3 both want to own the DOM. The conflict pattern:

- **Bad:** Call `d3.select(element).append('rect')` in a `$effect`, then also render `<rect>` tags in the Svelte template for the same element. Svelte's reconciler will delete D3-appended nodes on next re-render. D3 re-appends them. The DOM thrashes.
- **Good:** Pick one strategy per component. Either let Svelte render all elements declaratively (use D3 only for scales/math), or give D3 full ownership of a single `<g>` or `<svg>` element and never render Svelte children inside it.

```svelte
<!-- Correct: Svelte owns the SVG structure, D3 owns only math -->
<script>
  let { data } = $props();
  let xScale = $derived(d3.scaleLinear().domain([0, d3.max(data, d => d.value)]).range([0, width]));
</script>
{#each data as d}
  <rect width={xScale(d.value)} />
{/each}

<!-- Correct: D3 owns the container entirely -->
<script>
  let container;
  $effect(() => {
    if (!container) return;
    const svg = d3.select(container);
    // D3 renders everything inside container
    return () => { svg.selectAll('*').remove(); }; // cleanup on destroy
  });
</script>
<div bind:this={container}></div>
```

### `$effect` Infinite Loop with D3 State Read/Write

**What goes wrong:** An `$effect` that reads `$state` and also mutates it (directly or indirectly through D3 event handlers that call state setters) will loop indefinitely. Svelte will intervene to prevent browser crash, but the chart will be non-functional.

Specific scenario: A D3 brush or click handler updates `$state(selectedWord)`, and the `$effect` that draws the chart reads `selectedWord`. If the effect also calls `d3.select()` in a way that re-triggers the brush, you get a loop.

**Prevention:**
- D3 event handlers inside `$effect` should call state setters only, never read reactive state.
- Chart drawing `$effect` should read state, never write it.
- Keep event handler registration and chart drawing in separate `$effect` blocks.

### `$effect` Dependency Tracking is Implicit — Easy to Miss

**What goes wrong:** Svelte 5 tracks dependencies by which reactive values are read during `$effect` execution. If a D3 function reads your data internally (e.g., via a closure), Svelte may not detect the dependency. The effect won't re-run when data changes.

**Prevention:** Explicitly read all reactive values at the top of the `$effect` body before passing them to D3:
```javascript
$effect(() => {
  const currentData = data; // explicitly read — now tracked
  const currentLang = locale; // explicitly read
  updateChart(svgEl, currentData, currentLang);
});
```

### SSR Non-Issue (but HMR Is)

The project is a Vite SPA (not SvelteKit with SSR), so there is no server-side rendering hydration conflict with D3's DOM manipulation. However, `$effect` does not run during SSR in SvelteKit if the project ever migrates — flag this if architecture changes.

The real dev-time hazard is HMR: Svelte component remount + D3 stateful imperative mutations = stale chart state. Always implement full chart teardown in the `$effect` cleanup return.

---

## Performance Pitfalls

### Scroll Jank Sources — Priority Order

| Source | Severity | Fix |
|--------|----------|-----|
| Scroll event listeners instead of IntersectionObserver | High | Already using IO — maintain this |
| D3 transitions touching `width`/`height` (layout properties) | High | Animate `transform` and `opacity` instead; layout changes cause reflow |
| `getBoundingClientRect()` inside IO callback | Medium | Read layout before mutations; separate reads from writes |
| Multiple IO instances accumulating (existing bug) | High | Return `observer.disconnect()` in `$effect` cleanup |
| `100vh` sticky height on mobile | Medium | Use `100dvh` |
| Synchronous word cloud layout on filter change | High | Pre-compute offline or debounce |
| SVG `viewBox` resize without `will-change: transform` | Low | Add `will-change: transform` to animated SVG containers |

### Bundle Size from JSON Data Files

The existing `lembaga-totals.json` and `summary-stats.json` are in `public/` and fetched at runtime — correct. They are not bundled into the JS chunk.

**What can go wrong:**
- Importing JSON with `import data from './data.json'` instead of `fetch('/data/data.json')` will inline the entire JSON into the JS bundle, Vite will emit a "chunk too large" warning, and the initial parse blocks the main thread.
- Multiple simultaneous fetch calls for large JSON files can create a network waterfall where Section 5 chart data blocks Section 6 chart initialization.

**Prevention:**
- Keep all data files in `public/data/` and fetch them, never import them.
- Lazy-fetch section data: only initiate the fetch for a section when the user scrolls within 2 sections of it (use IO with a generous rootMargin for prefetch).
- Target individual JSON file sizes under 100 KB each. Pre-aggregate in Python.

### D3 Transition on Layout Properties Causes Reflow

Animating `attr('width', ...)` on SVG `<rect>` elements triggers layout recalculation on every animation frame. At 30 bars this is acceptable; at 60 it becomes jank.

**Better:** Animate via `transform: scaleX()` on a group, then use `transform-origin` to anchor the left edge. This runs on the compositor thread with no layout cost.

---

## i18n Pitfalls

### Flash of Untranslated Content (FOUC)

**What goes wrong:** If translations are loaded asynchronously (fetched at runtime), there is a window between initial render and translation load where all text shows raw keys (e.g., `"hero.title"`) or falls back to the first language regardless of the toggle state.

**Prevention for idsterity:** Since both languages are static strings (no external translation service), bundle all translations directly in the JavaScript bundle as a plain object. There is no async fetch, so no flash. Keep both `id` and `en` translation objects in a single `translations.js` file imported at startup.

### D3 Axis Labels and Annotations Don't Update on Language Switch

**What goes wrong:** D3 renders axis labels, annotation text, and tooltip text imperatively by calling `.text(translatedString)`. If the language store changes, Svelte reactivity does not automatically re-run imperative D3 code.

**Consequence:** The user toggles from Indonesian to English. The UI copy changes. The D3 chart axis still reads "Triliun Rupiah" instead of "Trillion IDR".

**Prevention:**
```javascript
$effect(() => {
  const t = $locale === 'en' ? translations.en : translations.id;
  // D3 axis update must be explicitly triggered here
  svg.select('.x-axis-label').text(t.xAxisLabel);
  svg.select('.chart-title').text(t.chartTitle);
  // Re-run axis with new tick formatter
  xAxis.tickFormat(d => t.formatCurrency(d));
  svg.select('.x-axis').call(xAxis);
});
```
Locale must be read inside the `$effect` so Svelte tracks it as a dependency.

### `og:locale` Is Fixed at Build Time — Language Toggle Doesn't Update It

**What goes wrong:** `og:locale` in the static `index.html` is a single value (e.g., `id_ID`). When the user toggles to English, the meta tag does not change. This does not affect LinkedIn sharing (LinkedIn reads tags at crawl time, not at runtime), but it can cause confusion with tools that inspect OG tags.

**Prevention:** Set `og:locale` to `id_ID` (primary audience) and add `og:locale:alternate` for `en_US`. The share card will always be in Indonesian, which is correct — this is the primary distribution language.

```html
<meta property="og:locale" content="id_ID">
<meta property="og:locale:alternate" content="en_US">
```

### Number/Currency Formatting Inconsistency

**What goes wrong:** IDR values formatted for Indonesian readers (`Rp 1.234.567`) use `.` as thousands separator. When language switches to English, the same formatting logic still runs, producing `Rp 1.234.567` instead of `IDR 1,234,567`. This looks like a bug.

**Prevention:** Tie the number formatter to the locale:
```javascript
const fmt = new Intl.NumberFormat(locale === 'id' ? 'id-ID' : 'en-US', {
  style: 'currency', currency: 'IDR', notation: 'compact'
});
```

---

## Deploy Pitfalls

### Missing `.htaccess` (Already Covered Above — Most Critical)

See Critical Pitfall #1. Do not skip this.

### `dist/` in Git History Inflates Repo and Causes Merge Conflicts

Already confirmed in CONCERNS.md: `dashboard/dist/` is tracked despite `.gitignore`. This causes real problems: every `npm run build` produces changed tracked files, and `git status` is always dirty. On shared hosting deploys via FTP or `rsync`, stale tracked dist files cause silent overwrites.

**Fix:** `git rm -r --cached dashboard/dist/` then commit. Add a deploy script that builds fresh and uploads only the `dist/` directory.

### Google Fonts CDN Dependency — Build Works, Production Fails Silently

If the hosting provider blocks external CDN requests or the user's network does (corporate proxy, government content filter — relevant for Indonesian government employees who are the target audience), fonts fail to load. The site degrades gracefully in most cases, but if a custom font is load-bearing for the Pudding-style aesthetic (bold headline type), it looks broken.

**Prevention:**
- Self-host fonts using `fontsource` npm packages: `npm install @fontsource/[font-name]`
- Import in `main.js`: `import '@fontsource/inter/700.css'`
- Eliminates external dependency, removes Google IP tracking, and improves LCP score.

### Asset URL Hardcoding in OG Tags

**What goes wrong:** The `og:image` URL is hardcoded in `index.html`. If the domain changes or the image is renamed, LinkedIn continues serving the cached old URL for up to 14 days with no way to force-clear without using the Post Inspector.

**Prevention:** Establish the final canonical domain before publishing OG tags. Treat `og:image` as immutable after first LinkedIn share.

---

## Python NLP Pitfalls

### UTF-8 BOM in JSONL Files Breaks `json.loads()`

**What goes wrong:** If any shard was written by a tool that emits a UTF-8 BOM (Byte Order Mark), `json.loads(line)` raises `json.decoder.JSONDecodeError: Unexpected UTF-8 BOM`. The entire shard fails silently if not caught.

**Prevention:** Open files with `encoding='utf-8-sig'` — Python's UTF-8 variant that automatically strips BOM on read:
```python
with open(path, encoding='utf-8-sig') as f:
    for line in f:
        record = json.loads(line)
```

### Sastrawi Stemmer Destroys Domain-Specific Procurement Terms

**What goes wrong:** Sastrawi was designed for natural-language Indonesian, not procurement code. It will stem:
- `"pengadaan"` → `"ada"` (meaningful word lost)
- Acronyms like `"ATK"`, `"UPS"`, `"APD"` → mangled or unchanged (unpredictably)
- Proper nouns like institution abbreviations (`"BPBD"`, `"DPRD"`) → damaged

The word cloud would show meaningless stems rather than meaningful procurement categories.

**Prevention:** Do not apply Sastrawi to `paket` field text. Instead:
- Apply only case folding and tokenization
- Build a domain-specific stop-word list: `["pengadaan", "jasa", "barang", "pekerjaan", "untuk", "dengan", "dan", "dalam", "di", "ke", "dari"]` — these will dominate frequency counts without adding meaning
- Keep acronyms as-is (they are the meaningful signals: `"ATK"`, `"laptop"`, `"kursi"`, `"tanah"`)

### Generic Stop Words Miss Procurement Boilerplate

**What goes wrong:** Standard Indonesian NLP stop word lists (`nlp-id`, NLTK Indonesian stop words) do not include procurement boilerplate terms that appear in nearly every `paket` name: "pengadaan", "penyediaan", "belanja", "kegiatan". These will dominate frequency counts and produce a word cloud where the top 5 words are useless.

**Prevention:** Start with any standard stop word list, then manually audit the top 50 frequency words from a sample of 1000 records and add domain-specific terms to the stop list.

### `ownerType` Assigned from First-Seen Record — Already Confirmed Bug

See CONCERNS.md. A majority-vote or canonical lookup is needed if institutions span multiple `ownerType` values. The word cloud's ownerType filter will silently mislabel some institutions.

### `_failures.csv` Records Are Silently Excluded — Skews Word Cloud

65,116 records failed AI labeling. If the NLP script reads only `*_priority.json` (high/med flagged records), it operates on a subset that excludes these failures. If failures are disproportionately concentrated in specific institution types, the word cloud misrepresents the actual distribution.

**Prevention:** Run word frequency on full JSONL data (all records with `tags.isInappropriate == "high"`), not on `_priority.json`. Check failure distribution across institutions before publishing.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|----------------|------------|
| Replace POC scrollytelling | Observer accumulation on HMR | Return `observer.disconnect()` in `$effect` cleanup immediately |
| Add D3 bar charts (Sections 5–6) | DOM ownership conflict | Decide: Svelte-renders-all or D3-owns-container — do not mix |
| Language toggle implementation | D3 labels don't update | Read locale in every chart `$effect`; test toggle while chart is visible |
| Python NLP word frequency | Procurement boilerplate drowning signal | Audit top 50 terms manually before baking into JSON |
| Static build + deploy | Base path fetch 404 / missing .htaccess | Set `import.meta.env.BASE_URL` in fetches; deploy `.htaccess` |
| LinkedIn share readiness | Missing OG tags / wrong image format | 1200×627 JPG, absolute URL, test with Post Inspector before any public share |
| Section 7 anchor animations | D3 transition conflicts on rapid scroll | Use `selection.interrupt()` before each new transition |

---

## Sources

- [Svelte 5 $effect documentation](https://svelte.dev/docs/svelte/$effect) — HIGH confidence (Context7 official)
- [Svelte 5 $effect infinite loop patterns](https://github.com/sveltejs/svelte/blob/main/packages/svelte/messages/client-errors/errors.md) — HIGH confidence (Context7 official)
- [D3 + Svelte 5 bar chart patterns](https://datavisualizationwithsvelte.com/basics/svelte-5-d3-example) — MEDIUM confidence
- [Scrollama introduction (Pudding.cool)](https://pudding.cool/process/introducing-scrollama/) — HIGH confidence (primary reference)
- [Layout thrashing prevention](https://dev.to/gokul369/layout-thrashing-the-hidden-performance-killer-in-modern-web-apps-51me) — MEDIUM confidence
- [LinkedIn link preview OG requirements](https://share-preview.com/blog/linkedin-link-preview) — HIGH confidence (multiple sources agree)
- [OG image sizes complete guide](https://www.krumzi.com/blog/open-graph-image-sizes-for-social-media-the-complete-2025-guide) — MEDIUM confidence
- [Vite base path configuration](https://vite.dev/config/shared-options) — HIGH confidence (official Vite docs)
- [Vite static asset handling](https://vite.dev/guide/assets) — HIGH confidence (official Vite docs)
- [Apache .htaccess SPA routing](https://syncclouds.medium.com/comprehensive-guide-to-htaccess-configuration-for-spa-routing-a8f043aa3d2d) — MEDIUM confidence (multiple sources agree)
- [Sastrawi limitations on non-formal text](https://link.springer.com/article/10.1186/s40537-021-00413-1) — MEDIUM confidence (academic)
- [Python UTF-8 BOM fix for JSON](https://www.howtosolutions.net/2019/04/python-fixing-unexpected-utf-8-bom-error-when-loading-json-data/) — HIGH confidence (standard Python behavior)
- [Svelte i18n flash of untranslated content](https://phrase.com/blog/posts/a-step-by-step-guide-to-svelte-localization-with-svelte-i18n-v3/) — MEDIUM confidence
- [Mobile sticky / vh viewport pitfalls](https://codestudy.net/blog/how-to-enable-css-position-sticky-in-mobile-browsers/) — MEDIUM confidence
