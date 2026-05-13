# Coding Conventions

**Analysis Date:** 2026-05-13

## Naming Patterns

**Files:**
- Svelte components use PascalCase: `App.svelte`, `BarChart.svelte`
- JS entry point uses camelCase: `main.js`
- Python scripts use kebab-case: `prepare-data.py`
- Build config uses camelCase: `vite.config.js`

**Functions:**
- Svelte helper functions use camelCase: `mainFill`, `mainWidth`, `flagFill`, `nameFill`, `fmtT`, `shortName`
- Python functions are not used; logic is written as top-level procedural script

**Variables:**
- JavaScript: camelCase throughout — `activeStep`, `chartData`, `innerH`, `svgW`
- Python: snake_case throughout — `total_pagu`, `total_records`, `flagged_count`, `high_count`
- Constants: SCREAMING_SNAKE_CASE in both languages — `SHOW = 15`, `TOP_N = 30`, `DATA_DIR`, `OUT_DIR`
- Short single-letter aliases used for frequently-repeated values: `r`, `d`, `s`

**Types:**
- No TypeScript; project uses plain JavaScript (ES modules) and Python 3.11+
- No explicit type annotations

## Code Style

**Formatting:**
- No formatter config file present (no `.prettierrc`, `.eslintrc`, `biome.json`)
- In practice, Svelte files use 2-space indentation
- Python file uses 4-space indentation (PEP 8 standard)
- Inline alignment used selectively: `data  = d` / `stats = s` aligned with spaces for visual grouping

**Linting:**
- No linting config detected; no ESLint, Biome, or Ruff configured
- Code quality is maintained by convention, not tooling

## Import Organization

**JavaScript (Svelte `<script>` blocks):**
1. Framework imports first: `import { onMount } from 'svelte'`
2. Local component imports next: `import BarChart from './BarChart.svelte'`
3. D3 named imports: `import { scaleLinear, scaleBand } from 'd3'`

**Python:**
- Standard library only; imports on a single comma-separated line: `import json, pathlib, collections`
- No third-party dependencies (explicitly declared: `dependencies = []`)

**Path Aliases:**
- None configured; relative paths used for all local imports

## Error Handling

**Patterns:**
- Minimal defensive coding: `r.get("lembaga") or "Unknown"` guards against `None`/missing keys in Python
- Svelte data fetching uses no try/catch; fetch errors are silently unhandled
- Python script has no explicit error handling; failures surface as unhandled exceptions

## Logging

**Framework:** Python `print()` only

**Patterns:**
- `prepare-data.py` uses `print()` to confirm output at script completion
- No logging module used; no log levels
- No console.log/warn/error in JavaScript source files

## Comments

**When to Comment:**
- Module docstrings used in Python to describe script purpose and output files: `dashboard/scripts/prepare-data.py` lines 5–9
- HTML section dividers use inline comments: `<!-- ━━━ HERO ━━━ -->` in `dashboard/src/App.svelte`
- CSS section dividers use: `/* ── Variables ── */`, `/* ── Layout ── */`
- Inline SVG element comments for clarity: `<!-- grid lines -->`, `<!-- bars -->`, `<!-- legend -->`
- No JSDoc/TSDoc used anywhere

**JSDoc/TSDoc:**
- Not used; codebase is plain JS with no type annotations

## Function Design

**Size:** Functions are small, single-purpose helpers (3–6 lines). Examples: `mainFill`, `nameFill`, `fmtT` in `dashboard/src/BarChart.svelte`

**Parameters:** Functions take a single data record `d` or a raw value `v`

**Return Values:** Functions return primitives (strings, numbers). No functions return objects or arrays.

## Module Design

**Exports:**
- `App.svelte` is the single root component; not explicitly exported — mounted directly via `mount()` in `main.js`
- `BarChart.svelte` uses `$props()` rune to receive `data` and `step` props; no named exports

**Barrel Files:**
- Not used; flat `src/` directory with direct relative imports

## Svelte-Specific Conventions

**State management:** Svelte 5 runes are used exclusively:
- `$state()` for mutable reactive values: `let data = $state([])`
- `$derived()` for computed values: `let chartData = $derived(data.slice(0, SHOW))`
- `$props()` for component props: `let { data = [], step = 0 } = $props()`

**Svelte templates:**
- `{#if}` / `{:else}` blocks for conditional rendering
- `{#each}` with a key expression for list rendering: `{#each chartData as d (d.name)}`
- `{@const}` inside `{#each}` for block-scoped computed values

**CSS:**
- Component styles are scoped in `<style>` blocks
- `:global()` used sparingly for cross-component styles
- CSS custom properties defined on `:global(:root)` in `App.svelte` for theming
- All colors referenced through `var(--name)` tokens; no hardcoded hex in CSS

## Python-Specific Conventions

**Script metadata:** PEP 723 inline script metadata block at top of `prepare-data.py`:
```python
# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
```

**Data processing:** Procedural top-level script, not wrapped in `main()` or `if __name__ == "__main__":` guard

**Output:** JSON written with `ensure_ascii=False, indent=2` for readable, non-escaped Unicode output

---

*Convention analysis: 2026-05-13*
