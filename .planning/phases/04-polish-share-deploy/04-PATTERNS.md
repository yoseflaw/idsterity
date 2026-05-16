# Phase 4: Polish, Share & Deploy — Pattern Map

**Mapped:** 2026-05-15
**Files analyzed:** 4 (2 modified, 2 new)
**Analogs found:** 2 / 4 (2 new files have no codebase analog — documented in §No Analog Found)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `dashboard/vite.config.js` | config | build-time transform | existing `dashboard/vite.config.js` | self (modify) |
| `dashboard/index.html` | config | request-response (HTML shell) | existing `dashboard/index.html` | self (modify) |
| `dashboard/src/App.svelte` | component | request-response (fetch) | existing `dashboard/src/App.svelte` | self (modify — 9 call sites) |
| `dashboard/public/.htaccess` | config | request-response (Apache) | none in codebase | no analog |
| `dashboard/public/og-image.jpg` | static asset | file-I/O | none in codebase | no analog |

---

## Pattern Assignments

### `dashboard/vite.config.js` (config, build-time transform)

**Modification type:** Add single `base` key to `defineConfig` options object.

**Current file** (`dashboard/vite.config.js`, lines 1–6):
```javascript
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  plugins: [svelte()]
})
```

**Target pattern — add `base` before `plugins`:**
```javascript
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  base: '/sterity/',
  plugins: [svelte()]
})
```

**Key constraints:**
- `base` value MUST have both leading and trailing slash: `'/sterity/'` not `'/sterity'`
- `base` goes above `plugins` (conventional ordering: core config before plugins)
- No other changes to this file

---

### `dashboard/index.html` (config, HTML shell)

**Modification type:** Insert OG meta block inside `<head>`, after the existing `<title>` tag (line 6) and before the opening `<style>` tag (line 7).

**Current `<head>` block** (`dashboard/index.html`, lines 3–17):
```html
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>idsterity — Pengadaan Pemerintah Indonesia 2026</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body {
    background: #0e0d0c;
    color: #ede8dc;
    font-family: 'Source Serif 4', Georgia, serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
</style>
</head>
```

**OG meta block to insert after `</title>` (line 6), before `<style>` (line 7):**
```html
<!-- ━━━ Open Graph ━━━ -->
<meta property="og:type"         content="website" />
<meta property="og:locale"       content="id_ID" />
<meta property="og:url"          content="https://yosef.id/sterity/" />
<meta property="og:title"        content="PLACEHOLDER — fill before deploy" />
<meta property="og:description"  content="PLACEHOLDER — fill before deploy" />
<meta property="og:image"        content="https://yosef.id/sterity/og-image.jpg" />
<meta property="og:image:width"  content="1200" />
<meta property="og:image:height" content="627" />
<meta property="og:image:type"   content="image/jpeg" />
```

**Comment style analog:** `dashboard/src/App.svelte` uses `<!-- ━━━ SECTION ━━━ -->` dividers — use the same style here for consistency with existing HTML section comments.

**Key constraints:**
- `og:image` URL is hardcoded absolute HTTPS — correct per D-07; do not use `import.meta.env.BASE_URL` in HTML (not processed by Vite in `<head>` meta tags)
- `og:title` and `og:description` are intentional placeholders per D-06 — do not auto-generate copy
- No existing OG tags in the file (confirmed from read above) — this is a clean insertion

---

### `dashboard/src/App.svelte` (component, request-response fetch)

**Modification type:** Systematic string replacement across 9 `safeFetch` call sites. The `safeFetch` function itself (lines 110–114) does NOT change.

**`safeFetch` definition — do not modify** (`dashboard/src/App.svelte`, lines 110–114):
```javascript
const safeFetch = url =>
  fetch(url).then(r => {
    if (!r.ok) throw new Error(`${r.status} ${r.statusText} — ${url}`)
    return r.json()
  })
```

**Call site group 1 — `onMount` Promise.all** (lines 119–123), replace each `/data/` string:
```javascript
// BEFORE
safeFetch('/data/summary-stats.json'),
safeFetch('/data/lembaga-totals.json'),
safeFetch('/data/constants.json'),
safeFetch('/data/wordcloud-all.json'),
safeFetch('/data/wordcloud-lembaga.json'),

// AFTER
safeFetch(import.meta.env.BASE_URL + 'data/summary-stats.json'),
safeFetch(import.meta.env.BASE_URL + 'data/lembaga-totals.json'),
safeFetch(import.meta.env.BASE_URL + 'data/constants.json'),
safeFetch(import.meta.env.BASE_URL + 'data/wordcloud-all.json'),
safeFetch(import.meta.env.BASE_URL + 'data/wordcloud-lembaga.json'),
```

**Call site group 2 — `setFilter` function** (lines 65, 67, 69):
```javascript
// BEFORE
cloudWords = await safeFetch('/data/wordcloud-all.json')
cloudWords = await safeFetch('/data/wordcloud-central.json')
cloudWords = await safeFetch('/data/wordcloud-district.json')

// AFTER
cloudWords = await safeFetch(import.meta.env.BASE_URL + 'data/wordcloud-all.json')
cloudWords = await safeFetch(import.meta.env.BASE_URL + 'data/wordcloud-central.json')
cloudWords = await safeFetch(import.meta.env.BASE_URL + 'data/wordcloud-district.json')
```

**Call site group 3 — `selectWord` function, template literal** (line 93):
```javascript
// BEFORE
const data = await safeFetch(`/data/word-${word}-${filterKey}.json`)

// AFTER
const data = await safeFetch(import.meta.env.BASE_URL + `data/word-${word}-${filterKey}.json`)
```

**Replacement rule:**
- String literals: `'/data/` → `import.meta.env.BASE_URL + 'data/`
- Template literals: `` `/data/ `` → `` import.meta.env.BASE_URL + `data/ ``
- No leading slash on `data/...` — Vite guarantees BASE_URL ends with `/`
- Do NOT use `import.meta.env['BASE_URL']` (bracket notation) — Vite does not statically replace it

**Error handling pattern — do not change** (existing pattern from lines 74–76 and 97–99):
```javascript
} catch (err) {
  filterError = t[lang].fetchError
}
```
```javascript
} catch (err) {
  if (selectedWord !== requestedWord) return
  wordRecordsError = t[lang].s9Error
}
```

---

### `dashboard/public/.htaccess` (config, Apache request-response)

**New file — no codebase analog.** Pattern sourced from Apache mod_rewrite docs and RESEARCH.md §Pattern 3.

**Full file content:**
```apache
Options -MultiViews
RewriteEngine On
RewriteBase /sterity/
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [L]
```

**Location constraint:** `dashboard/public/` (not `dashboard/src/`). Vite copies `public/` contents verbatim to `dist/` at build time — `.htaccess` lands at `dist/.htaccess` and then at `/sterity/.htaccess` after FTP.

**Key constraints:**
- `RewriteBase /sterity/` is required for subdirectory deploy — without it Apache resolves relative to server root
- `[L]` flag not `[END]` — universally compatible with Apache 2.2 and 2.4 (shared hosting may run 2.2)
- `Options -MultiViews` prevents Apache file-extension guessing from interfering with SPA routing
- No trailing newline rules; file should be committed as-is

---

### `dashboard/public/og-image.jpg` (static asset, file-I/O)

**New file — user-created, not code-generated.** No pattern to extract.

**Contract (for planner checklist):**
- Dimensions: 1200 × 627 px (1.91:1 ratio, LinkedIn standard)
- Format: JPEG
- Size: under 200 KB (SHARE-02) — export at ~80% quality from Figma/Canva
- Content: seblak portion count (715,281,636) as dominant element + hook line "Ikuti uangnya..." on dark background (`#0e0d0c`), gold accent (`var(--gold)`)
- Path: `dashboard/public/og-image.jpg` — referenced by `og:image` meta tag
- Committed to git before deploy

---

## Shared Patterns

### `safeFetch` — no-change contract

**Source:** `dashboard/src/App.svelte` lines 110–114
**Apply to:** All fetch call site edits — modify the *arguments*, never the function body.

```javascript
const safeFetch = url =>
  fetch(url).then(r => {
    if (!r.ok) throw new Error(`${r.status} ${r.statusText} — ${url}`)
    return r.json()
  })
```

### `import.meta.env.BASE_URL` — replacement token

**Source:** Vite 5 built-in (verified in RESEARCH.md §Pattern 1)
**Apply to:** All 9 `safeFetch` call sites in `App.svelte`
**Rule:** `BASE_URL` is statically replaced at build time with the `base` value from `vite.config.js`. In dev (`npm run dev`), it resolves to `/`. In production build with `base: '/sterity/'`, it resolves to `/sterity/`. This means no dev/prod divergence — the same code works in both environments.

### HTML comment style

**Source:** `dashboard/src/App.svelte` (existing section dividers)
**Apply to:** New `<!-- ━━━ Open Graph ━━━ -->` comment in `index.html`
**Pattern:** `<!-- ━━━ SECTION NAME ━━━ -->` with box-drawing characters

### `defineConfig` options ordering

**Source:** `dashboard/vite.config.js` (current structure)
**Apply to:** `vite.config.js` modification
**Pattern:** Core config keys (`base`) before plugin array (`plugins`) — conventional Vite ordering.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `dashboard/public/.htaccess` | config | request-response (Apache) | No server config files exist in the codebase; this is the first Apache directive file |
| `dashboard/public/og-image.jpg` | static asset | file-I/O | No static image assets exist in the codebase; og-image is user-created offline, not generated |

---

## Metadata

**Analog search scope:** `dashboard/` (all source files)
**Files read for pattern extraction:** `dashboard/vite.config.js`, `dashboard/index.html`, `dashboard/src/App.svelte` (lines 1–130)
**Pattern extraction date:** 2026-05-15
**Deferred scope confirmed excluded:** English og-image, npm FTP deploy script, CI/CD — none require patterns
