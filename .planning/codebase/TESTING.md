# Testing Patterns

**Analysis Date:** 2026-05-13

## Test Framework

**Runner:**
- None. No test runner is installed or configured.
- No `jest.config.*`, `vitest.config.*`, or `playwright.config.*` detected.
- `dashboard/package.json` has no `test` script and no test-related devDependencies.

**Assertion Library:**
- None.

**Run Commands:**
```bash
# No test commands exist
# The closest operational commands are:
npm run dev           # Start Vite dev server
npm run build         # Production build
python3 scripts/prepare-data.py  # Data preparation script
```

## Test File Organization

**Location:**
- No test files exist in the repository.
- `find . -name "*.test.*" -o -name "*.spec.*"` returns no results (excluding node_modules).

**Naming:**
- Not applicable; no convention established.

**Structure:**
- Not applicable.

## Test Structure

**Suite Organization:**
- Not applicable; no tests exist.

**Patterns:**
- No setup, teardown, or assertion patterns to document.

## Mocking

**Framework:**
- None.

**What to Mock (if tests are added):**
- `fetch()` calls in `dashboard/src/App.svelte` (`onMount` block loads `/data/lembaga-totals.json` and `/data/summary-stats.json`)
- `IntersectionObserver` (used in `App.svelte` for scrollytelling step detection)
- D3 scale functions if unit-testing chart helpers in `dashboard/src/BarChart.svelte`

**What NOT to Mock:**
- The Python data pipeline in `dashboard/scripts/prepare-data.py` — test against actual JSONL fixtures instead

## Fixtures and Factories

**Test Data:**
- No fixtures directory exists.
- Real dataset shards live in `inaproc-ds/outputs/` (not committed; downloaded separately).
- Pre-processed JSON outputs committed to `dashboard/public/data/`:
  - `dashboard/public/data/lembaga-totals.json`
  - `dashboard/public/data/summary-stats.json`
- These committed JSON files are the closest thing to fixtures in the project.

**Location:**
- If fixtures are added, `dashboard/src/__tests__/fixtures/` would follow Vite/Vitest conventions.

## Coverage

**Requirements:** None enforced.

**View Coverage:**
```bash
# No coverage tooling configured
```

## Test Types

**Unit Tests:**
- Not present. Candidates for unit testing:
  - Helper functions in `dashboard/src/BarChart.svelte`: `mainFill`, `mainWidth`, `flagFill`, `nameFill`, `fmtT`, `shortName`
  - Formatter functions in `dashboard/src/App.svelte`: `fmtT`, `fmtPct`, `fmtNum`

**Integration Tests:**
- Not present. Candidate: the Python pipeline in `dashboard/scripts/prepare-data.py` — verify JSON shape and field presence given small JSONL fixture input.

**E2E Tests:**
- Not present. No Playwright, Cypress, or similar framework installed.

## Recommendations (if tests are added)

**For the JavaScript dashboard:**
- Add Vitest (already compatible with the Vite setup): `npm install -D vitest @testing-library/svelte`
- Add a `test` script to `dashboard/package.json`: `"test": "vitest run"`
- Place test files as `dashboard/src/BarChart.test.js` (co-located)

**For the Python pipeline:**
- Use `pytest` with a small JSONL fixture to verify `prepare-data.py` output shape
- No dependency changes needed; the script uses only the standard library

---

*Testing analysis: 2026-05-13*
