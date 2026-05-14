# Phase 4: Polish, Share & Deploy - Context

**Gathered:** 2026-05-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 4 makes the finished story deployable and LinkedIn-ready. No new story sections. Scope: configure Vite base path for subdirectory deploy, replace all hardcoded `/data/` fetch paths with `import.meta.env.BASE_URL`, add OG meta tags, produce a 1200×627 JPG share card (static file, hand-crafted and committed), add `.htaccess` SPA fallback for Apache, run a manual Lighthouse check before ship. Deploy is manual: `npm run build` → FTP `dist/` to `/sterity/` on yosef.id.

</domain>

<decisions>
## Implementation Decisions

### OG Share Card — Content & Design

- **D-01:** The hero number on the LinkedIn card is the **seblak portion count** — the same absurdist anchor from S7. This is the most culturally punchy number for Indonesian LinkedIn viewers: street food scale makes the waste visceral.
- **D-02:** Card layout: huge seblak count + hook line ("Ikuti uangnya..."). Minimal composition — the number does the work, the hook line provides narrative frame.
- **D-03:** Primary card language: **Indonesian**. This is the `og:image` that ships. An English version may be prepared alongside but is not the deployed default.

### OG Share Card — Generation

- **D-04:** The OG image is a **static design file** — hand-crafted by the user (Figma, Canva, or any tool), exported as a JPG, committed to `dashboard/public/og-image.jpg`. No build-time generation script required.
- **D-05:** File locations:
  - `dashboard/public/og-image.jpg` — Indonesian card (primary, referenced in og:image)
  - `dashboard/public/og-image-en.jpg` — English card (optional, not referenced by og:image)
- **D-06:** `og:title` and `og:description` will be written by the user directly in `index.html` — the planner adds **placeholder text** in the meta tags for the user to fill before deploy. Do not auto-generate OG text copy.

### Deploy URL & Base Path

- **D-07:** The site lives at `https://yosef.id/sterity/`. This is the canonical URL.
  - Vite `base` = `/sterity/`
  - `og:url` = `https://yosef.id/sterity/`
  - `og:image` = `https://yosef.id/sterity/og-image.jpg`
- **D-08:** All hardcoded `/data/...` fetch calls in `App.svelte` (currently 10+) MUST be replaced with `import.meta.env.BASE_URL + 'data/...'` to satisfy DEPL-02. This is a systematic find-and-replace across `safeFetch` call sites.
- **D-09:** Deploy pipeline is **manual**: `npm run build` in `dashboard/`, then FTP the contents of `dashboard/dist/` to the `/sterity/` directory on the Apache host (jagoanhosting.com). No npm deploy script or CI required.

### Lighthouse & Performance

- **D-10:** "Acceptable" Lighthouse pass = **no catastrophic failures** — no specific score target. The goal is that the site loads in reasonable time with no render-blocking resources or massive unoptimized assets.
- **D-11:** Only known asset size constraint: `og-image.jpg` MUST be under 200KB (SHARE-02). All other assets are already lightweight (Vite bundles JS/CSS efficiently, no large images in the app).
- **D-12:** Lighthouse check is manual: run in Chrome DevTools (Device: Mobile, throttling: 4G) once before deploy. No `lighthouse-ci` tooling needed.

### Claude's Discretion

- Exact `.htaccess` RewriteRule syntax for Apache SPA fallback — standard pattern, Claude decides.
- Whether `import.meta.env.BASE_URL` needs a trailing slash guard (it does — Vite guarantees it ends with `/`, so `BASE_URL + 'data/file.json'` is safe without an extra `/`).
- `og:type` value (standard: `website`), `og:locale` (standard: `id_ID`).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Scope & Requirements
- `.planning/ROADMAP.md` §Phase 4 — Goal, success criteria, required requirements (SHARE-01, SHARE-02, DEPL-01, DEPL-02, DEPL-03, FOUND-05)
- `.planning/REQUIREMENTS.md` §SHARE-01, §SHARE-02 — OG tag requirements and image spec
- `.planning/REQUIREMENTS.md` §DEPL-01, §DEPL-02, §DEPL-03 — Build and deploy requirements
- `.planning/REQUIREMENTS.md` §FOUND-05 — .htaccess SPA fallback requirement

### Existing Source Files (read before modifying)
- `dashboard/vite.config.js` — Currently has no `base` config; add `base: '/sterity/'`
- `dashboard/index.html` — Add OG meta tags here; currently has title only
- `dashboard/src/App.svelte` — All `safeFetch('/data/...')` calls need BASE_URL prefix (10+ occurrences)

### Prior Phase Context
- `.planning/phases/03-interactive-back-half-s7-s9/03-CONTEXT.md` — D-01/D-02: S7 anchor data structure; seblak count derives from `labelPagu.high` in `summary-stats.json` ÷ unit price in `constants.json`. Needed to know the seblak figure for the OG card.
- `.planning/phases/01-foundation-data-pipeline/01-CONTEXT.md` — D-07: `safeFetch` pattern; D-09: font self-hosting via @fontsource

### Data Files
- `dashboard/public/data/summary-stats.json` — `labelPagu.high` is the base for seblak count (needed if user wants the exact number for the card design)
- `dashboard/public/data/constants.json` — `anchors.seblakPrice` (unit price for seblak, added in Phase 3)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `safeFetch(url)` in `App.svelte` — All usages of this helper currently pass hardcoded `/data/...` strings. Fix is uniform: replace string argument with `import.meta.env.BASE_URL + 'data/...'` at each call site. `safeFetch` itself does not need to change.
- `vite.config.js` — Minimal config (Svelte plugin only). Add `base: '/sterity/'` to `defineConfig` options.

### Established Patterns
- All data fetches go through `safeFetch` — no bare `fetch()` calls exist for data files. This means the BASE_URL fix is contained to `safeFetch` call sites only.
- `index.html` has inline `<style>` and `<script type="module" src="/src/main.js">` — the `/src/main.js` reference is resolved by Vite dev server, not a fetch; it does NOT need BASE_URL treatment.

### Integration Points
- `dashboard/public/og-image.jpg` — Committed static file; referenced in `index.html` `og:image` as an absolute URL (hardcoded to `https://yosef.id/sterity/og-image.jpg`).
- `.htaccess` — Added to `dashboard/public/` so Vite copies it to `dist/` at build time. Apache reads it from the `/sterity/` directory on the host.

</code_context>

<specifics>
## Specific Ideas

- The OG share card features the seblak portion count as the dominant visual element — same number as S7 Step 0. User will design this manually (Figma/Canva) using the site's dark aesthetic (background `#0e0d0c`, gold `--gold` accent). The seblak number should be computable from `summary-stats.json` `labelPagu.high` ÷ `constants.json` `anchors.seblakPrice` if the user needs the exact figure for the design.
- `og:title` and `og:description` are placeholder text in the PLAN — user fills them in `index.html` before deploy.
- Vite `base: '/sterity/'` — note the trailing slash, required by Vite for subdirectory deploys.

</specifics>

<deferred>
## Deferred Ideas

- English OG image (`og-image-en.jpg`) may be created alongside the Indonesian version but is not referenced as the default `og:image`. Could be used if the user later adds an English-language canonical URL.
- npm deploy script (lftp-based FTP automation) — user prefers manual FTP for now; can be added in a future maintenance phase.
- GitHub Actions CI/CD — out of scope; manual build + FTP is the deploy workflow.

</deferred>

---

*Phase: 04-polish-share-deploy*
*Context gathered: 2026-05-15*
