# Phase 4: Polish, Share & Deploy - Research

**Researched:** 2026-05-15
**Domain:** Vite subdirectory deploy, Open Graph meta tags, Apache .htaccess SPA fallback
**Confidence:** HIGH

## Summary

Phase 4 is a pure configuration and polish phase — no new story sections, no new libraries. All three work streams (OG meta tags, Vite base path, Apache .htaccess) are solved problems with well-documented standard patterns. The codebase audit confirms exactly 9 hardcoded `/data/...` `safeFetch` call sites in `App.svelte` (lines 65, 67, 69, 93, 119, 120, 121, 122, 123) plus one template literal at line 93 that uses string interpolation — all require the same `import.meta.env.BASE_URL` prefix fix.

Vite 5 guarantees that `import.meta.env.BASE_URL` ends with a `/` when `base` is set to a path like `/sterity/`, so `import.meta.env.BASE_URL + 'data/file.json'` is safe without an extra slash. The `.htaccess` SPA fallback for Apache is a 6-line standard pattern; the key subtlety for a subdirectory deploy is setting `RewriteBase /sterity/`. The OG image spec (1200×627 JPG under 200KB, absolute URL, Indonesian language) is already decided — the planner only needs to add the placeholder meta tags in `index.html` and document the file path contract.

**Primary recommendation:** Three independent tasks in any order — (1) fix BASE_URL across safeFetch calls + vite.config.js, (2) add OG meta tags to index.html + commit placeholder og-image.jpg, (3) add .htaccess to `dashboard/public/`. Verify with `npm run build` and check `dist/` structure before FTP.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Hero number on LinkedIn card = seblak portion count (same as S7). Computed value: 715,281,636 portions (Rp 10.73T ÷ Rp 15,000/portion).
- **D-02:** Card layout: huge seblak count + hook line "Ikuti uangnya...". Minimal composition.
- **D-03:** Primary card language: Indonesian. This is the `og:image` that ships.
- **D-04:** OG image is a static design file — hand-crafted by user (Figma/Canva), exported as JPG, committed to `dashboard/public/og-image.jpg`. No build-time generation.
- **D-05:** File locations: `dashboard/public/og-image.jpg` (primary), `dashboard/public/og-image-en.jpg` (optional, not referenced).
- **D-06:** `og:title` and `og:description` are placeholder text in index.html — user fills them before deploy.
- **D-07:** Canonical URL: `https://yosef.id/sterity/`. Vite `base` = `/sterity/`. `og:url` = `https://yosef.id/sterity/`. `og:image` = `https://yosef.id/sterity/og-image.jpg`.
- **D-08:** All hardcoded `/data/...` fetch calls in `App.svelte` MUST be replaced with `import.meta.env.BASE_URL + 'data/...'`.
- **D-09:** Deploy pipeline is manual: `npm run build` → FTP contents of `dashboard/dist/` to `/sterity/` on jagoanhosting.com Apache host. No CI required.
- **D-10:** Lighthouse pass = no catastrophic failures. No specific score target.
- **D-11:** `og-image.jpg` MUST be under 200KB. All other assets already lightweight.
- **D-12:** Lighthouse check is manual: Chrome DevTools, Device: Mobile, throttling: 4G. No lighthouse-ci tooling.

### Claude's Discretion

- Exact `.htaccess` RewriteRule syntax for Apache SPA fallback.
- Whether `import.meta.env.BASE_URL` needs a trailing slash guard (it does not — Vite guarantees trailing `/` when base is a path).
- `og:type` value (standard: `website`), `og:locale` (standard: `id_ID`).

### Deferred Ideas (OUT OF SCOPE)

- English OG image (`og-image-en.jpg`) may be created alongside but is not the default `og:image`.
- npm deploy script (lftp-based FTP automation) — manual FTP for now.
- GitHub Actions CI/CD — out of scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SHARE-01 | LinkedIn share card renders correctly — `og:title`, `og:description`, `og:image` (absolute URL), `og:type`, `og:url` all present | Standard OG meta tag set documented below; absolute URL pattern for `og:image` verified |
| SHARE-02 | OG image is a 1200×627 JPG under 200KB — shows hook number on high-contrast background | LinkedIn requires 1200×627 at 1.91:1 ratio; JPG at this size can achieve <200KB at 80% quality; static file committed to `dashboard/public/` |
| DEPL-01 | `npm run build` produces a self-contained `dist/` with no server-side runtime required | Vite static build is SPA-ready; `base: '/sterity/'` config documented below |
| DEPL-02 | All data fetches use `import.meta.env.BASE_URL` (not hardcoded `/data/`) | 9 call sites identified in App.svelte; `import.meta.env.BASE_URL` behavior verified from Vite docs |
| DEPL-03 | `dist/` is excluded from git (`.gitignore`) | Already excluded — verified in `.gitignore` line 8: `dashboard/dist/` |
| FOUND-05 | Shared links resolve correctly on Apache shared hosting (`.htaccess` SPA fallback) | Standard mod_rewrite pattern with `RewriteBase /sterity/` documented below |
</phase_requirements>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| OG meta tags | Static HTML (index.html) | — | `<meta>` tags live in `<head>` of the HTML shell; Vite copies index.html verbatim into dist/ |
| Base path configuration | Build tool (vite.config.js) | Browser (import.meta.env.BASE_URL) | Vite rewrites asset paths at build time; runtime fetch paths use the injected BASE_URL variable |
| SPA routing fallback | Web server (.htaccess) | — | Apache must redirect non-file requests to index.html; no application code involved |
| OG image asset | Static file (dashboard/public/) | — | Copied verbatim to dist/ by Vite; not processed |
| Performance (Lighthouse) | Static build output | — | Vite's production build handles minification/treeshaking; no additional config needed |

---

## Standard Stack

### Core (unchanged from prior phases)

| Library | Installed Version | Purpose | Note |
|---------|------------------|---------|------|
| Vite | 5.4.21 (devDep `^5`, resolved 8.0.13 on npm) | Build tool, BASE_URL injection | `base` config option is the only change needed |
| Svelte | 5.55.5 (devDep `^5`, resolved 5.55.7 on npm) | UI framework | No changes needed for this phase |
| @sveltejs/vite-plugin-svelte | 4.0.4 (devDep `^4`, resolved 7.1.2 on npm) | Svelte-Vite integration | No changes needed |

**Version note:** `npm view` shows latest published versions (Vite 8.0.13, Svelte 5.55.7) but the lockfile pins older versions that are already installed and working. Do NOT upgrade packages as part of this phase — the project uses the locked versions that passed UAT.

[VERIFIED: npm registry via `npm view`] [VERIFIED: `dashboard/package.json` lockfile]

### No New Dependencies

This phase requires zero new npm packages. Everything needed is already in the project:
- OG tags: plain HTML meta tags in index.html
- .htaccess: plain text file, no tooling
- BASE_URL: Vite built-in environment variable

---

## Architecture Patterns

### System Architecture Diagram

```
User browser
    │
    ▼
Apache /sterity/  ──── .htaccess (mod_rewrite) ────► index.html (SPA fallback)
    │                        │
    │ static files           └── serves *.json, *.js, *.css directly (no rewrite)
    ▼
index.html
    │  <meta og:*> tags (LinkedIn scraper reads these)
    │  <script src="/sterity/assets/main-[hash].js">
    ▼
Svelte app (main.js → App.svelte)
    │
    └── fetch(import.meta.env.BASE_URL + 'data/summary-stats.json')
        fetch(import.meta.env.BASE_URL + 'data/lembaga-totals.json')
        fetch(import.meta.env.BASE_URL + 'data/constants.json')
        fetch(import.meta.env.BASE_URL + 'data/wordcloud-*.json')
        fetch(import.meta.env.BASE_URL + 'data/word-*.json')
            │
            ▼
        /sterity/data/*.json  (served by Apache as static files)

LinkedIn Post Inspector
    │
    └── scrapes https://yosef.id/sterity/
        reads og:title, og:description, og:image, og:type, og:url
        fetches og:image → https://yosef.id/sterity/og-image.jpg
```

### Recommended Project Structure (additions only)

```
dashboard/
├── public/
│   ├── og-image.jpg          # NEW — 1200×627 JPG, <200KB, Indonesian card
│   ├── og-image-en.jpg       # OPTIONAL — English card, not referenced in og:image
│   └── .htaccess             # NEW — Apache SPA fallback
├── vite.config.js            # MODIFY — add base: '/sterity/'
└── index.html                # MODIFY — add OG meta tags
```

---

### Pattern 1: Vite Base Path for Subdirectory Deploy

**What:** Setting `base` in `vite.config.js` rewrites all asset URLs in the built HTML to use the subdirectory prefix. `import.meta.env.BASE_URL` in JS is statically replaced with the base value at build time.

**When to use:** Any time the app is not served from the domain root.

**Key behavior verified:**
- `base: '/sterity/'` (with both leading and trailing slash) is the required form [VERIFIED: Vite docs via Context7]
- Vite guarantees `import.meta.env.BASE_URL` ends with `/` — so `BASE_URL + 'data/file.json'` is correct, not `BASE_URL + '/data/file.json'` [VERIFIED: Vite docs via Context7]
- `import.meta.env['BASE_URL']` (bracket notation) does NOT work — must appear as `import.meta.env.BASE_URL` exactly [VERIFIED: Vite docs via Context7]

```javascript
// dashboard/vite.config.js — AFTER
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  base: '/sterity/',
  plugins: [svelte()]
})
```

```javascript
// dashboard/src/App.svelte — safeFetch call site pattern AFTER
// BEFORE: safeFetch('/data/summary-stats.json')
// AFTER:
safeFetch(import.meta.env.BASE_URL + 'data/summary-stats.json')
```

**Template literal call site (line 93) — special handling:**
```javascript
// BEFORE: safeFetch(`/data/word-${word}-${filterKey}.json`)
// AFTER:
safeFetch(import.meta.env.BASE_URL + `data/word-${word}-${filterKey}.json`)
```

[VERIFIED: Vite docs — https://github.com/vitejs/vite/blob/main/docs/guide/build.md via Context7]

---

### Pattern 2: OG Meta Tags for LinkedIn

**What:** Standard Open Graph protocol `<meta>` tags in `<head>` that LinkedIn's scraper reads to build link previews.

**LinkedIn requirements verified:**
- `og:image`: 1200×627px at 1.91:1 ratio; JPG or PNG; HTTPS URL without redirects [MEDIUM: multiple sources agree, confirmed via LinkedIn Help docs search result]
- File size: LinkedIn accepts up to 5MB, but the project constraint is <200KB (SHARE-02) [VERIFIED: REQUIREMENTS.md]
- Required tags for LinkedIn preview: `og:title`, `og:description`, `og:image`, `og:type`, `og:url` [CITED: https://www.linkedin.com/help/linkedin/answer/a521928]

```html
<!-- dashboard/index.html — add inside <head>, after <title> -->
<meta property="og:type"        content="website" />
<meta property="og:locale"      content="id_ID" />
<meta property="og:url"         content="https://yosef.id/sterity/" />
<meta property="og:title"       content="PLACEHOLDER — fill before deploy" />
<meta property="og:description" content="PLACEHOLDER — fill before deploy" />
<meta property="og:image"       content="https://yosef.id/sterity/og-image.jpg" />
<meta property="og:image:width"  content="1200" />
<meta property="og:image:height" content="627" />
<meta property="og:image:type"   content="image/jpeg" />
```

**Debugging tool:** LinkedIn Post Inspector at `https://www.linkedin.com/post-inspector/inspect/` [CITED: LinkedIn Help]

Note: `og:title` and `og:description` are placeholders per D-06. The planner task should explicitly remind the user to fill them before FTP.

[MEDIUM confidence on exact tag set — consistent across multiple LinkedIn documentation sources]

---

### Pattern 3: Apache .htaccess SPA Fallback (Subdirectory Deploy)

**What:** Mod_rewrite rules that serve `index.html` for any URL that does not match an existing file or directory, enabling client-side routing for direct URL access.

**Key subtlety for subdirectory deploy:** `RewriteBase` must be set to `/sterity/` (the deploy path), not `/`. Without this, Apache resolves the rewrite target relative to the server root and may produce incorrect paths. [MEDIUM: Apache mod_rewrite docs + community sources agree on RewriteBase for subdirectory context]

**Verified: `dashboard/public/` is the correct location** — Vite copies all files from `public/` verbatim to `dist/` at build time, so `.htaccess` will appear at `dist/.htaccess` and then at `/sterity/.htaccess` after FTP.

```apache
# dashboard/public/.htaccess
Options -MultiViews
RewriteEngine On
RewriteBase /sterity/

# Serve existing files and directories directly (assets, data JSON, og-image.jpg)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d

# All other requests → index.html (SPA entry point)
RewriteRule ^ index.html [L]
```

**Why `[L]` not `[END]`:** `[L]` (last) is sufficient for shared hosting; `[END]` prevents reprocessing loops but requires Apache 2.4 — shared hosting may run 2.2. `[L]` is universally compatible. [ASSUMED]

**Why `-MultiViews`:** Disabling MultiViews prevents Apache from guessing file extensions, which can interfere with SPA routing. [MEDIUM: standard Apache SPA guidance]

[CITED: https://httpd.apache.org/docs/2.4/rewrite/remapping.html] [CITED: https://httpd.apache.org/docs/2.4/rewrite/flags.html]

---

### Anti-Patterns to Avoid

- **Using `BASE_URL` with bracket notation:** `import.meta.env['BASE_URL']` is NOT statically replaced by Vite. Must use `import.meta.env.BASE_URL` exactly.
- **Omitting trailing slash from `base`:** `base: '/sterity'` (no trailing slash) may produce incorrect asset paths. Always `/sterity/`.
- **Hardcoding the absolute URL in `og:image` with wrong path:** If the site later moves, the og:image URL breaks. Accept this for now (D-07 locks the URL).
- **Putting `.htaccess` in `dashboard/src/`:** It must go in `dashboard/public/` to be copied to `dist/` by Vite.
- **Committing `dashboard/dist/`:** Already excluded in `.gitignore` — DEPL-03 is satisfied, no action needed.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Asset path rewriting for subdirectory | Custom path prefix logic | `base` in vite.config.js | Vite rewrites all HTML/CSS/JS references automatically |
| SPA routing fallback | PHP router or custom server | `.htaccess` mod_rewrite | Standard Apache mechanism; no server code needed |
| OG image generation | Puppeteer/Canvas build script | Static committed JPG (D-04) | User decision; zero build complexity |

---

## Common Pitfalls

### Pitfall 1: `dist/` assets load from domain root instead of `/sterity/`

**What goes wrong:** After FTP deploy, CSS/JS assets return 404 because URLs are `/assets/main.js` instead of `/sterity/assets/main.js`.
**Why it happens:** `vite.config.js` is missing `base: '/sterity/'` — Vite builds with implicit `base: '/'`.
**How to avoid:** Add `base: '/sterity/'` to `vite.config.js` BEFORE running `npm run build`.
**Warning signs:** Open `dist/index.html` in a text editor and check that `<script src="/sterity/assets/...">` — if it reads `/assets/...`, base is wrong.

### Pitfall 2: `fetch('/data/...')` returns 404 on deploy

**What goes wrong:** Data files load fine in dev (`npm run dev`) but fail in production deploy at `/sterity/`.
**Why it happens:** Dev server resolves `/data/` from the project root; production Apache serves from `/sterity/data/`. Hardcoded `/data/` paths miss the subdirectory prefix.
**How to avoid:** Replace every `safeFetch('/data/...')` with `safeFetch(import.meta.env.BASE_URL + 'data/...')`. There are 9 call sites (lines 65, 67, 69, 93, 119, 120, 121, 122, 123 in App.svelte).
**Warning signs:** Open browser DevTools Network tab after deploy — any `GET /data/*.json` 404 means a missed call site.

### Pitfall 3: LinkedIn shows no preview / wrong image

**What goes wrong:** Sharing `https://yosef.id/sterity/` on LinkedIn shows no card or placeholder.
**Why it happens:** Either `og:image` URL is not absolute, image is not yet committed/uploaded, or LinkedIn's cache needs refresh.
**How to avoid:** Use the LinkedIn Post Inspector to force re-scrape after deploy. Ensure `og:image` is an absolute HTTPS URL pointing to the committed `og-image.jpg`.
**Warning signs:** Post Inspector shows empty `og:image` field or reports "unable to fetch image".

### Pitfall 4: Direct URL returns 404 on Apache

**What goes wrong:** Navigating to `https://yosef.id/sterity/` directly (not via a link from root) returns Apache 404.
**Why it happens:** `.htaccess` missing or mod_rewrite not enabled on the host.
**How to avoid:** Confirm jagoanhosting.com has `AllowOverride All` (or at least `AllowOverride FileInfo`) for the `/sterity/` directory. Most shared hosts enable this by default.
**Warning signs:** 404 with Apache default error page instead of the site. Check host control panel for `.htaccess` support.

### Pitfall 5: og:image JPG exceeds 200KB

**What goes wrong:** SHARE-02 fails — file size too large.
**Why it happens:** Figma/Canva default export quality may produce 400–800KB at 1200×627.
**How to avoid:** Export at 80% JPEG quality. Verify with `ls -lh dashboard/public/og-image.jpg`. The seblak-count-on-dark-background design (minimal elements) should compress well.
**Warning signs:** File size > 200KB reported by `ls -lh` or browser DevTools.

---

## Code Examples

### Complete vite.config.js after change

```javascript
// Source: https://github.com/vitejs/vite/blob/main/docs/guide/build.md
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  base: '/sterity/',
  plugins: [svelte()]
})
```

### All 9 safeFetch call sites — before/after

```javascript
// BEFORE (lines 119-123, onMount Promise.all)
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

// BEFORE (lines 65, 67, 69, setFilter function)
cloudWords = await safeFetch('/data/wordcloud-all.json')
cloudWords = await safeFetch('/data/wordcloud-central.json')
cloudWords = await safeFetch('/data/wordcloud-district.json')

// AFTER
cloudWords = await safeFetch(import.meta.env.BASE_URL + 'data/wordcloud-all.json')
cloudWords = await safeFetch(import.meta.env.BASE_URL + 'data/wordcloud-central.json')
cloudWords = await safeFetch(import.meta.env.BASE_URL + 'data/wordcloud-district.json')

// BEFORE (line 93, selectWord function — template literal)
const data = await safeFetch(`/data/word-${word}-${filterKey}.json`)

// AFTER
const data = await safeFetch(import.meta.env.BASE_URL + `data/word-${word}-${filterKey}.json`)
```

### Complete .htaccess

```apache
# dashboard/public/.htaccess
Options -MultiViews
RewriteEngine On
RewriteBase /sterity/
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [L]
```

### Complete OG meta block for index.html

```html
<!-- Add inside <head>, after <title> tag -->
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

---

## Runtime State Inventory

> Not a rename/refactor phase — omitted.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js / npm | `npm run build` | Assumed present | — | — |
| Vite (local devDep) | Build | Installed | 5.4.21 (lockfile) | — |
| FTP client | Manual deploy to jagoanhosting.com | User-supplied | — | Any FTP client; not a build step |
| Chrome DevTools | Lighthouse check (D-12) | User-supplied | — | Skip Lighthouse (D-10: no score target) |
| LinkedIn Post Inspector | SHARE-01 verification | Web-based | — | Manual visual check |
| `dashboard/public/og-image.jpg` | SHARE-01, SHARE-02 | Not yet created | — | Phase blocks until user creates and commits |

**Missing dependencies with no fallback:**
- `dashboard/public/og-image.jpg` — must be created by user (Figma/Canva) and committed before the phase is complete. The planner should include a Wave 0 task: "User creates and commits og-image.jpg". All SHARE-01 and SHARE-02 tasks depend on this file existing.

---

## Validation Architecture

> `nyquist_validation: false` in `.planning/config.json` — this section is skipped.

---

## Security Domain

Phase 4 makes no changes to authentication, session management, access control, or cryptography. All changes are static file additions and HTML meta tag edits. The OG image is a static committed file served by Apache directly — no processing or user input involved.

No ASVS categories apply to this phase's scope.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|-----------------|--------------|--------|
| Hardcode `/data/` fetch paths (dev-only) | `import.meta.env.BASE_URL + 'data/'` | This phase | Enables subdirectory deploys |
| No `base` in vite.config.js (serves from root) | `base: '/sterity/'` | This phase | Vite rewrites all asset references |

**No deprecations or library updates needed for this phase.**

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Apache on jagoanhosting.com has `AllowOverride All` (or FileInfo) enabled for the `/sterity/` directory, so `.htaccess` mod_rewrite rules are processed | .htaccess pattern | If wrong, direct URL access returns 404; user must contact host or enable via cPanel |
| A2 | `[L]` flag in RewriteRule is sufficient (not `[END]`); shared host runs Apache 2.2 or 2.4 | .htaccess pattern | If host requires `[END]`, substitute in .htaccess; no code changes needed |
| A3 | The npm package versions in the lockfile (Vite 5.4.21, Svelte 5.55.5) are what run for `npm run build` — not the higher versions shown by `npm view` | Standard Stack | If lockfile is out of sync, `npm ci` in dashboard/ resolves correctly |

---

## Open Questions

1. **`og:title` and `og:description` copy**
   - What we know: D-06 says user fills these manually before deploy; planner adds placeholders.
   - What's unclear: No content guidance exists yet — user must write Indonesian hook copy.
   - Recommendation: The plan task should include a reminder note with suggested structure (e.g., "715 juta porsi seblak..." as title), not block execution.

2. **jagoanhosting.com mod_rewrite support**
   - What we know: It's a shared Apache host.
   - What's unclear: Whether `AllowOverride All` is enabled by default.
   - Recommendation: Include a verification step in the deploy checklist — if direct URL returns 404, the .htaccess is not being read; user checks cPanel's "Apache Handlers" or contacts support.

---

## Sources

### Primary (HIGH confidence)
- `/vitejs/vite` via Context7 — `base` config, `import.meta.env.BASE_URL` behavior, trailing slash guarantee
- `dashboard/src/App.svelte` — direct grep for all 9 safeFetch call sites (lines 65, 67, 69, 93, 119, 120, 121, 122, 123)
- `dashboard/vite.config.js` — confirmed no `base` currently set
- `dashboard/index.html` — confirmed no OG tags currently present
- `.gitignore` — confirmed `dashboard/dist/` excluded (DEPL-03 already satisfied)
- `dashboard/public/data/summary-stats.json` — `labelPagu.high: 10,729,224,542,293`
- `dashboard/public/data/constants.json` — `anchors.seblak.price: 15000` → seblak count: 715,281,636

### Secondary (MEDIUM confidence)
- [LinkedIn Help: Make your website shareable](https://www.linkedin.com/help/linkedin/answer/a521928) — required OG tag set
- [Apache mod_rewrite remapping docs](https://httpd.apache.org/docs/2.4/rewrite/remapping.html) — RewriteRule patterns
- [Apache RewriteRule flags](https://httpd.apache.org/docs/2.4/rewrite/flags.html) — `[L]` vs `[END]` behavior
- Multiple sources confirm 1200×627 JPG at 1.91:1 as LinkedIn OG image standard

### Tertiary (LOW confidence)
- None — all key claims are HIGH or MEDIUM.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — packages verified in lockfile and npm registry
- Vite base config: HIGH — verified from official docs via Context7
- OG meta tags: MEDIUM — cross-referenced across LinkedIn docs and community guides
- .htaccess pattern: MEDIUM — Apache official docs + community examples
- Pitfalls: HIGH — derived from codebase audit (9 confirmed call sites) and verified Vite behavior

**Research date:** 2026-05-15
**Valid until:** 2026-06-15 (stable tech stack — Vite/Svelte/Apache patterns are stable)
