# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This repository is a data-only archive of Indonesian government procurement records for 2026, sourced from LPSE/SIRUP (Indonesia's public procurement system). There is no application code.

The single dataset lives in `inaproc-ds/outputs/` and is partitioned into ~123 shards.

To obtain the dataset, download and extract into the project root:

```bash
curl -L "https://contenflowstorage.blob.core.windows.net/shared/gpt-5.4-analyzed-sirup.zip?sp=r&st=2026-04-16T12:00:08Z&se=2029-04-16T20:15:08Z&spr=https&sv=2025-11-05&sr=b&sig=m%2FATynnnZq5gSdP8xWWw2ew41EMJZz09fDQRwpbWolk%3D" -o sirup.zip
unzip sirup.zip && rm sirup.zip
```

## Dataset: `inaproc-ds`

### File naming convention

Each partition `N` produces up to four files:

| Pattern | Format | Contents |
|---|---|---|
| `year-2026.part-NNNNN.jsonl` | JSONL | Full records, one JSON object per line |
| `year-2026.part-NNNNN.csv` | CSV (flattened) | Same records with nested `tags.*` columns |
| `year-2026.part-NNNNN_priority.json` | JSON array | Subset flagged `isInappropriate: med` or `high` |
| `year-2026.part-NNNNN_failures.csv` | CSV | Records that failed processing; columns: `id`, `paket`, `error` |

### Key fields

| Field | Type | Description |
|---|---|---|
| `id` | int | LPSE package ID |
| `paket` | string | Procurement package name |
| `lembaga` | string | Procuring institution |
| `satker` | string | Work unit within the institution |
| `lokasi` | string | Province + regency/city |
| `ownerType` | string | `central`, `provinsi`, or `kabkota` |
| `jenisPengadaan` | string | `Barang` (goods), `Pekerjaan Konstruksi`, `Jasa Konsultansi`, `Jasa Lainnya` |
| `metode` | string | Procurement method (e.g. `Tender`, `Pengadaan Langsung`, `E-Purchasing`) |
| `pagu` | int | Budget ceiling in IDR |
| `sumberDana` | string | Funding source (`APBN`, `APBD`, etc.) |
| `isUMKM` | bool | Whether reserved for SMEs |
| `pemilihanDate` | string | Selection month (e.g. `"January 2026"`) |
| `potensiPemborosan` | float | Waste-potential score |
| `tags.isInappropriate` | string | `low`, `med`, or `high` |
| `tags.inappropriateReason` | string\|null | Reason for inappropriate flag |
| `jumlahTagAktif` | int | Number of active flags on this record |

### Querying the data

Use Python with the standard library or pandas — no special tooling required.

```python
import json, pathlib

# Iterate all JSONL shards
for path in sorted(pathlib.Path("inaproc-ds/outputs").glob("*.jsonl")):
    for line in path.open():
        record = json.loads(line)

# Load all priority items across partitions
import json, pathlib
priority = []
for path in sorted(pathlib.Path("inaproc-ds/outputs").glob("*_priority.json")):
    priority.extend(json.load(path.open()))
```

<!-- GSD:project-start source:PROJECT.md -->
## Project

**idsterity**

A bilingual (Indonesian / English) scrollytelling website that exposes the absurdity of Indonesian government procurement waste — delivered with dark irony. The joke is the contrast: Prabowo publicly promises extreme fiscal efficiency while procurement records show the opposite. We don't lecture. We let the numbers deliver the punchline.

Inspired by [nemesis.assai.id](https://nemesis.assai.id/) — which is descriptive and requires user intent. This project provides the narrative format: one scroll, one story, one clear emotional gut-punch.

**Core Value:** Every visitor who reaches the end should feel the irony viscerally and want to share it.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- JavaScript (ES Modules) - Dashboard frontend (`dashboard/src/`)
- Python 3.11+ - Data pipeline / ETL script (`dashboard/scripts/prepare-data.py`)
- HTML5 - Entry point (`dashboard/index.html`)
- CSS (Svelte scoped + global in `index.html`) - All styling, no preprocessor
## Runtime
- Node.js (current LTS — no `.nvmrc` present; any Node 18+ works with Vite 5)
- Python 3.11+ (declared via PEP 723 inline script metadata in `prepare-data.py`)
- npm — lockfile `dashboard/package-lock.json` (lockfileVersion: 3) is committed
- Python: no pip/requirements.txt; `uv run` used to execute the data script with inline deps
## Frameworks
- Svelte 5.55.5 — Reactive UI framework using runes (`$state`, `$derived`, `$props`)
- Vite 5.4.21 — Dev server and production bundler
- @sveltejs/vite-plugin-svelte 4.0.4 — Integrates Svelte compilation into Vite
## Key Dependencies
- `d3` ^7 (resolved 7.9.0) — All chart rendering in `dashboard/src/BarChart.svelte`
- No runtime data-fetching library — uses native browser `fetch()` to load pre-baked JSON from `/data/`
- Two static JSON files served from `dashboard/public/data/`:
## Configuration
- No `.env` files or environment variables required
- All data is static and baked into the build at data-prep time
- `dashboard/vite.config.js` — Vite config (Svelte plugin only, no custom aliases, no base path)
- No tsconfig (plain JS project, no TypeScript)
- No ESLint or Prettier configs detected
## Data Pipeline (Python)
- Reads all `*.jsonl` shards from `inaproc-ds/outputs/` (3M+ records, ~3.2 GB)
- Reads all `*_priority.json` shards (flagged records)
- Aggregates per-institution totals, flag counts, pagu amounts
- Outputs two JSON files to `dashboard/public/data/`
- No external Python dependencies (uses stdlib only: `json`, `pathlib`, `collections`)
- Recommended runner: `uv run scripts/prepare-data.py`
## Platform Requirements
- Node.js 18+ (Vite 5 requirement)
- Python 3.11+ (for data prep; uv recommended)
- Full dataset optional — pre-generated JSON files are committed to `dashboard/public/data/`
- Static site output — `dashboard/dist/` contains index.html + bundled JS/CSS + data JSON
- No server required; deployable to any static hosting (Netlify, Vercel, GitHub Pages, Azure Blob, etc.)
- Target: static JS build uploadable to a general hosting server (per SPEC.md)
## Fonts
- `Libre Baskerville` (400, 700, italic) — Headlines and display numbers
- `Source Serif 4` (300, 400, 600, optical sizing 8–60pt) — Body text, chart labels
- `JetBrains Mono` (400, 600) — Eyebrow text, axis labels, monospace data
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- Svelte components use PascalCase: `App.svelte`, `BarChart.svelte`
- JS entry point uses camelCase: `main.js`
- Python scripts use kebab-case: `prepare-data.py`
- Build config uses camelCase: `vite.config.js`
- Svelte helper functions use camelCase: `mainFill`, `mainWidth`, `flagFill`, `nameFill`, `fmtT`, `shortName`
- Python functions are not used; logic is written as top-level procedural script
- JavaScript: camelCase throughout — `activeStep`, `chartData`, `innerH`, `svgW`
- Python: snake_case throughout — `total_pagu`, `total_records`, `flagged_count`, `high_count`
- Constants: SCREAMING_SNAKE_CASE in both languages — `SHOW = 15`, `TOP_N = 30`, `DATA_DIR`, `OUT_DIR`
- Short single-letter aliases used for frequently-repeated values: `r`, `d`, `s`
- No TypeScript; project uses plain JavaScript (ES modules) and Python 3.11+
- No explicit type annotations
## Code Style
- No formatter config file present (no `.prettierrc`, `.eslintrc`, `biome.json`)
- In practice, Svelte files use 2-space indentation
- Python file uses 4-space indentation (PEP 8 standard)
- Inline alignment used selectively: `data  = d` / `stats = s` aligned with spaces for visual grouping
- No linting config detected; no ESLint, Biome, or Ruff configured
- Code quality is maintained by convention, not tooling
## Import Organization
- Standard library only; imports on a single comma-separated line: `import json, pathlib, collections`
- No third-party dependencies (explicitly declared: `dependencies = []`)
- None configured; relative paths used for all local imports
## Error Handling
- Minimal defensive coding: `r.get("lembaga") or "Unknown"` guards against `None`/missing keys in Python
- Svelte data fetching uses no try/catch; fetch errors are silently unhandled
- Python script has no explicit error handling; failures surface as unhandled exceptions
## Logging
- `prepare-data.py` uses `print()` to confirm output at script completion
- No logging module used; no log levels
- No console.log/warn/error in JavaScript source files
## Comments
- Module docstrings used in Python to describe script purpose and output files: `dashboard/scripts/prepare-data.py` lines 5–9
- HTML section dividers use inline comments: `<!-- ━━━ HERO ━━━ -->` in `dashboard/src/App.svelte`
- CSS section dividers use: `/* ── Variables ── */`, `/* ── Layout ── */`
- Inline SVG element comments for clarity: `<!-- grid lines -->`, `<!-- bars -->`, `<!-- legend -->`
- No JSDoc/TSDoc used anywhere
- Not used; codebase is plain JS with no type annotations
## Function Design
## Module Design
- `App.svelte` is the single root component; not explicitly exported — mounted directly via `mount()` in `main.js`
- `BarChart.svelte` uses `$props()` rune to receive `data` and `step` props; no named exports
- Not used; flat `src/` directory with direct relative imports
## Svelte-Specific Conventions
- `$state()` for mutable reactive values: `let data = $state([])`
- `$derived()` for computed values: `let chartData = $derived(data.slice(0, SHOW))`
- `$props()` for component props: `let { data = [], step = 0 } = $props()`
- `{#if}` / `{:else}` blocks for conditional rendering
- `{#each}` with a key expression for list rendering: `{#each chartData as d (d.name)}`
- `{@const}` inside `{#each}` for block-scoped computed values
- Component styles are scoped in `<style>` blocks
- `:global()` used sparingly for cross-component styles
- CSS custom properties defined on `:global(:root)` in `App.svelte` for theming
- All colors referenced through `var(--name)` tokens; no hardcoded hex in CSS
## Python-Specific Conventions
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## System Overview
```text
```
## Component Responsibilities
| Component | Responsibility | File |
|-----------|----------------|------|
| App.svelte | Page layout, data fetching, scroll-step state | `dashboard/src/App.svelte` |
| BarChart.svelte | D3-powered SVG bar chart, step-driven color/dimension transitions | `dashboard/src/BarChart.svelte` |
| main.js | Svelte app mount point | `dashboard/src/main.js` |
| prepare-data.py | Offline aggregation: reads raw JSONL/priority shards, produces static JSON | `dashboard/scripts/prepare-data.py` |
| index.html | HTML shell, Google Fonts links, app div target | `dashboard/index.html` |
| lembaga-totals.json | Pre-aggregated top-30 institution data (committed) | `dashboard/public/data/lembaga-totals.json` |
| summary-stats.json | Dataset-wide totals and flagged counts (committed) | `dashboard/public/data/summary-stats.json` |
## Pattern Overview
- No backend or API server — fully static after build
- Data is pre-aggregated offline by a Python script; runtime makes only two `fetch()` calls
- Scroll position drives chart state via `IntersectionObserver` on step elements (Pudding-style scrollytelling)
- Svelte 5 runes (`$state`, `$derived`, `$props`) used throughout for reactivity
- D3 handles scales and math; SVG rendering is done declaratively in Svelte templates
## Layers
- Purpose: Render the narrative website and interactive chart
- Location: `dashboard/src/`
- Contains: `App.svelte` (full page), `BarChart.svelte` (D3 chart component)
- Depends on: pre-baked JSON at `/data/*.json`, D3 library
- Used by: served from `dashboard/dist/` after `vite build`
- Purpose: Serve aggregated JSON to the browser at runtime
- Location: `dashboard/public/data/`
- Contains: `lembaga-totals.json`, `summary-stats.json`
- Depends on: Python script output
- Used by: `App.svelte` via `fetch()`
- Purpose: Aggregate raw dataset into static JSON; run once offline
- Location: `dashboard/scripts/prepare-data.py`
- Contains: Single Python script using stdlib only (json, pathlib, collections)
- Depends on: `inaproc-ds/outputs/` JSONL and priority JSON shards
- Used by: developer manually or via `npm run prepare-data`
- Purpose: Source of truth — Indonesian 2026 government procurement records
- Location: `inaproc-ds/outputs/`
- Contains: ~123 shards in JSONL, CSV, _priority.json, _failures.csv formats
- Not committed to git (3.2 GB); downloaded separately
## Data Flow
### Primary Runtime Path
### Offline Data Preparation Path
- `activeStep` (integer 0–3) is the single piece of scroll-driven state in `App.svelte`
- `data` and `stats` hold fetched JSON; set once on mount, never mutated
- `BarChart` derives all visual attributes from `step` prop + `data` prop using Svelte 5 `$derived`
## Key Abstractions
- Purpose: Each numbered step (0–3) maps to a distinct chart visual state
- Examples: Step 0 = total budget (muted), Step 1 = by government tier (colored), Step 2 = flagged portion visible, Step 3 = dim non-flagged institutions
- Pattern: `[data-step="N"]` HTML attributes observed by `IntersectionObserver` in `App.svelte`
- Purpose: Data contract between Python prep script and Svelte chart
- Fields: `rank`, `name`, `total`, `count`, `ownerType`, `flaggedCount`, `flaggedPagu`, `highCount`, `medCount`
- File: `dashboard/public/data/lembaga-totals.json`
## Entry Points
- Location: `dashboard/index.html` → `dashboard/src/main.js`
- Triggers: Browser load
- Responsibilities: Mount Svelte app into `#app` div
- Location: `dashboard/scripts/prepare-data.py`
- Triggers: `npm run prepare-data` or `uv run dashboard/scripts/prepare-data.py`
- Responsibilities: Read all raw shards, write two JSON files to `dashboard/public/data/`
- Location: `dashboard/vite.config.js` (Vite + `@sveltejs/vite-plugin-svelte`)
- Triggers: `npm run build`
- Responsibilities: Bundle `src/` into `dashboard/dist/`
## Architectural Constraints
- **No runtime server:** The entire app is static HTML + JS + pre-baked JSON. There is no Node or Python server at runtime.
- **Dataset not in repo:** `inaproc-ds/outputs/` is gitignored (3.2 GB). The public JSON data files are committed as the substitute.
- **Single-component chart:** All D3 logic lives in one file (`BarChart.svelte`). No chart abstraction layer.
- **Global state:** None. State is local to `App.svelte` (`data`, `stats`, `activeStep`).
- **Circular imports:** None detected.
- **Threading:** Single-threaded browser JS. `IntersectionObserver` is async but non-blocking.
## Anti-Patterns
### Inline styles on SVG elements
## Error Handling
- `fetch()` calls in `App.svelte` have no `.catch()`. Network failures silently leave `data` and `stats` as initial empty values, showing loading state permanently.
- Python script has no error handling; a malformed JSONL line will raise and abort.
## Cross-Cutting Concerns
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
