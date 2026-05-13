# Technology Stack

**Analysis Date:** 2026-05-13

## Languages

**Primary:**
- JavaScript (ES Modules) - Dashboard frontend (`dashboard/src/`)
- Python 3.11+ - Data pipeline / ETL script (`dashboard/scripts/prepare-data.py`)

**Secondary:**
- HTML5 - Entry point (`dashboard/index.html`)
- CSS (Svelte scoped + global in `index.html`) - All styling, no preprocessor

## Runtime

**Environment:**
- Node.js (current LTS — no `.nvmrc` present; any Node 18+ works with Vite 5)
- Python 3.11+ (declared via PEP 723 inline script metadata in `prepare-data.py`)

**Package Manager:**
- npm — lockfile `dashboard/package-lock.json` (lockfileVersion: 3) is committed
- Python: no pip/requirements.txt; `uv run` used to execute the data script with inline deps

## Frameworks

**Core:**
- Svelte 5.55.5 — Reactive UI framework using runes (`$state`, `$derived`, `$props`)
  - Uses new Svelte 5 `mount()` API (not `new App()`)
  - File: `dashboard/src/main.js`

**Build/Dev:**
- Vite 5.4.21 — Dev server and production bundler
  - Config: `dashboard/vite.config.js` (minimal — only the Svelte plugin)
  - esbuild 0.21.5 (Vite's internal bundler)
  - Rollup 4.60.3 (Vite's production bundler)

**Svelte Plugin:**
- @sveltejs/vite-plugin-svelte 4.0.4 — Integrates Svelte compilation into Vite

## Key Dependencies

**Critical:**
- `d3` ^7 (resolved 7.9.0) — All chart rendering in `dashboard/src/BarChart.svelte`
  - Specifically uses: `scaleLinear`, `scaleBand` from `d3`
  - SVG rendered directly (no canvas); transitions done with CSS `transition` on SVG attributes

**Data:**
- No runtime data-fetching library — uses native browser `fetch()` to load pre-baked JSON from `/data/`
- Two static JSON files served from `dashboard/public/data/`:
  - `lembaga-totals.json` — top 30 institutions with budget/flag breakdown
  - `summary-stats.json` — aggregate totals (totalPagu, totalRecords, flaggedCount, flaggedPagu, uniqueLembaga)

## Configuration

**Environment:**
- No `.env` files or environment variables required
- All data is static and baked into the build at data-prep time

**Build:**
- `dashboard/vite.config.js` — Vite config (Svelte plugin only, no custom aliases, no base path)
- No tsconfig (plain JS project, no TypeScript)
- No ESLint or Prettier configs detected

**Scripts (package.json):**
```bash
npm run dev           # Vite dev server
npm run build         # Production build → dashboard/dist/
npm run preview       # Preview production build
npm run prepare-data  # python3 scripts/prepare-data.py (requires inaproc-ds/outputs/)
```

## Data Pipeline (Python)

**Script:** `dashboard/scripts/prepare-data.py`
- Reads all `*.jsonl` shards from `inaproc-ds/outputs/` (3M+ records, ~3.2 GB)
- Reads all `*_priority.json` shards (flagged records)
- Aggregates per-institution totals, flag counts, pagu amounts
- Outputs two JSON files to `dashboard/public/data/`
- No external Python dependencies (uses stdlib only: `json`, `pathlib`, `collections`)
- Recommended runner: `uv run scripts/prepare-data.py`

## Platform Requirements

**Development:**
- Node.js 18+ (Vite 5 requirement)
- Python 3.11+ (for data prep; uv recommended)
- Full dataset optional — pre-generated JSON files are committed to `dashboard/public/data/`

**Production:**
- Static site output — `dashboard/dist/` contains index.html + bundled JS/CSS + data JSON
- No server required; deployable to any static hosting (Netlify, Vercel, GitHub Pages, Azure Blob, etc.)
- Target: static JS build uploadable to a general hosting server (per SPEC.md)

## Fonts

All fonts loaded from Google Fonts CDN (declared in `dashboard/index.html`):
- `Libre Baskerville` (400, 700, italic) — Headlines and display numbers
- `Source Serif 4` (300, 400, 600, optical sizing 8–60pt) — Body text, chart labels
- `JetBrains Mono` (400, 600) — Eyebrow text, axis labels, monospace data

---

*Stack analysis: 2026-05-13*
