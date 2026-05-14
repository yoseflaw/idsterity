# Phase 4: Polish, Share & Deploy - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-15
**Phase:** 04-polish-share-deploy
**Areas discussed:** OG image content, OG image generation, Deploy URL & base path, Lighthouse scope

---

## OG Image Content

| Option | Description | Selected |
|--------|-------------|----------|
| Total 'high' pagu | The absurd-flagged total — e.g. 'Rp 4.9 Triliun'. Most pointed stat. | |
| Total procurement spending | Full dataset figure — bigger but less focused. | |
| A ratio/comparison | e.g. '23% flagged absurd'. Needs more words to land. | |
| **Seblak portion count** | The S7 absurdist anchor — how many seblak portions the flagged budget could buy. | ✓ |

**User's choice:** "number of seblak" (free text — the seblak anchor from S7)
**Notes:** User immediately knew which number — the cultural resonance of street food scale is the whole point of S7. The number is computable from `summary-stats.json labelPagu.high ÷ constants.json anchors.seblakPrice`.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Seblak count + site name only | Minimal. Number does all the work. | |
| **Seblak count + hook line** | Number + "Ikuti uangnya..." Adds narrative context. | ✓ |
| Seblak count + short desc | Explains what the site is. More informative, less punchy. | |

**User's choice:** Seblak count + hook line
**Notes:** Matches S1 opening narrative arc.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Indonesian only | Primary audience. Full cultural punch. | |
| English only | Broader reach, loses seblak resonance. | |
| Bilingual (stacked) | Both languages — risks clutter. | |
| **Two versions** | User asked "can we prepare two?" | ✓ |

**User's choice:** Prepare two versions (Indonesian + English), but Indonesian is the og:image default.
**Notes:** Since it's a single-URL site, only one og:image slot. Indonesian is primary. English version committed as og-image-en.jpg for optional future use.

---

## OG Image Generation

| Option | Description | Selected |
|--------|-------------|----------|
| **Static design file** | Hand-crafted in Figma/Canva, committed to public/. Zero build complexity. | ✓ |
| Build-time Node script | node-canvas/sharp renders text programmatically. Auto-computes seblak count. | |
| Playwright screenshot | Headless browser screenshots an og-template.html. Most faithful but heavy. | |

**User's choice:** Static design file
**Notes:** Fastest path. User designs manually using site's dark aesthetic.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Match site hook line | og:title: 'idsterity — Ikuti uangnya...' | |
| Factual description | Informative but lower shareability. | |
| **I'll write these myself** | Planner adds placeholders in index.html for user to fill. | ✓ |

**User's choice:** User will write og:title and og:description manually before deploy.
**Notes:** Planner adds placeholder text, user customizes before FTP.

---

## Deploy URL & Base Path

| Option | Description | Selected |
|--------|-------------|----------|
| Root — yosef.id/ | base stays '/'. Simplest. | |
| **Subdirectory — yosef.id/sterity/** | base = '/sterity/'. All /data/ fetches need BASE_URL. | ✓ |
| Different hostname | Other domain/subdomain. | |

**User's choice:** Subdirectory at `/sterity/` (via "Different name" → typed `/sterity/`)
**Notes:** Full URL: `https://yosef.id/sterity/`. Vite base = `/sterity/`. This requires updating all 10+ safeFetch call sites in App.svelte.

---

| Option | Description | Selected |
|--------|-------------|----------|
| **npm run build → FTP manually** | User builds locally, FTPs dist/ to /sterity/. No CI needed. | ✓ |
| npm run deploy script | lftp-based automation. Requires credentials in .env. | |
| GitHub Actions CI/CD | Automated on git push. Requires secrets + workflow file. | |

**User's choice:** Manual build + FTP
**Notes:** Same workflow used in prior deploy attempts to jagoanhosting.com.

---

## Lighthouse Scope

| Option | Description | Selected |
|--------|-------------|----------|
| ≥ 70 on mobile | Concrete score target matching ROADMAP SC #5. | |
| ≥ 80 on mobile | Higher bar, may require optimizations. | |
| **Just no catastrophic failures** | No score target. Loads reasonably, no blocking resources. | ✓ |

**User's choice:** No catastrophic failures
**Notes:** Project is a one-shot ship. Pragmatic pass criterion.

---

| Option | Description | Selected |
|--------|-------------|----------|
| **OG image size only** | og-image.jpg under 200KB. Everything else already lightweight. | ✓ |
| JSON payload size | wordcloud-lembaga.json (620 institutions) could be lazy-loaded. | |
| Font loading | @fontsource self-hosted, could add font-display/preload hints. | |

**User's choice:** OG image size only as known concern.

---

| Option | Description | Selected |
|--------|-------------|----------|
| **Manual DevTools only** | Chrome DevTools once before deploy. No CI overhead. | ✓ |
| lighthouse-ci in package.json | Dev dep, npm run lighthouse script. | |

**User's choice:** Manual DevTools.

---

## Claude's Discretion

- Exact `.htaccess` RewriteRule syntax for Apache SPA fallback
- `og:type` (standard: `website`) and `og:locale` (standard: `id_ID`)
- Whether `import.meta.env.BASE_URL` needs trailing slash guard (it does not — Vite guarantees trailing slash)

## Deferred Ideas

- English OG image (og-image-en.jpg) — created alongside but not the og:image default
- npm deploy script (lftp FTP automation) — user prefers manual for now
- GitHub Actions CI/CD — out of scope
