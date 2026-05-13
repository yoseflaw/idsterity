# Codebase Concerns

**Analysis Date:** 2026-05-13

## Tech Debt

**Dashboard name mismatch:**
- Issue: `package.json` declares `"name": "nemesis-dashboard"` — a leftover from a prior project reference — while the repo, SPEC, and all visible copy use "idsterity"
- Files: `dashboard/package.json` (line 2)
- Impact: Minor branding confusion; no runtime effect
- Fix approach: Rename to `"idsterity-dashboard"` in `package.json`

**SPEC storyline vs. implemented dashboard are out of sync:**
- Issue: `SPEC.md` defines a 9-step English-language narrative (hook → quotes → deficit → GDP → dataset overview → institutions → absurd-only → anchor numbers → word cloud → explore table). The implemented dashboard is a 4-step Indonesian-language scrollytelling POC covering only steps 4–5 of the SPEC
- Files: `SPEC.md`, `dashboard/src/App.svelte`, `dashboard/src/BarChart.svelte`
- Impact: The deliverable is substantially incomplete. Steps 1–3 (hook, quotes, deficit/GDP context) and steps 6–9 (absurd filter, anchor numbers, word cloud, explore table) are missing entirely. The site language is Indonesian; SPEC requires English
- Fix approach: Implement SPEC steps 1–9 in sequence; switch copy to English as specified

**Hard-coded `TOP_N = 30` but chart displays only 15:**
- Issue: `prepare-data.py` generates 30 institutions (`TOP_N = 30`, line 16) but `BarChart.svelte` slices to `SHOW = 15` (line 7). The extra 15 rows are fetched and deserialized but never used
- Files: `dashboard/scripts/prepare-data.py` (line 16), `dashboard/src/BarChart.svelte` (line 7)
- Impact: Wasted network payload (30 vs. 15 records in JSON); misleading constant naming
- Fix approach: Align both constants to the same value, or make `prepare-data.py` accept `TOP_N` as a CLI argument

**Dashboard committed in Indonesian, SPEC requires English:**
- Issue: All user-facing copy in `App.svelte` and `BarChart.svelte` is in Indonesian (e.g., "Ke mana perginya uang rakyat?", step card text). Non-functional requirement #2 in `SPEC.md` explicitly states "Website is in English"
- Files: `dashboard/src/App.svelte`, `dashboard/src/BarChart.svelte`
- Impact: Product misalignment with spec; audience targeting is off for international readers
- Fix approach: Translate all copy to English before adding more sections

**`dist/` directory committed to git despite being in `.gitignore`:**
- Issue: `.gitignore` excludes `dashboard/dist/` but the directory is currently tracked (files present at `dashboard/dist/assets/`, `dashboard/dist/data/`, `dashboard/dist/index.html`)
- Files: `dashboard/dist/` (multiple files), `.gitignore` (line 5)
- Impact: Build artifacts in git history inflate repo size and create merge conflicts on rebuilds
- Fix approach: `git rm -r --cached dashboard/dist/` then commit

**`antivibe-explain/` directory committed despite `.gitignore` exclusion:**
- Issue: `.gitignore` lists `antivibe-explain/` but the directory is tracked (contains `antivibe-explain/dashboard-2026-05-12.md`)
- Files: `antivibe-explain/dashboard-2026-05-12.md`, `.gitignore` (line 14)
- Impact: Internal AI-generated analysis docs in public repo history; not harmful but untidy
- Fix approach: `git rm -r --cached antivibe-explain/` then commit

## Known Bugs

**No error handling on data fetch:**
- Symptoms: If `/data/lembaga-totals.json` or `/data/summary-stats.json` fail to load (network error, 404 after re-deploy), the UI shows the loading-pulse state indefinitely with no error message
- Files: `dashboard/src/App.svelte` (lines 9–15)
- Trigger: Delete or rename public data files, or serve from a path where `/data/` is not rooted correctly
- Workaround: None — user sees a blank/pulsing hero with no indication of failure

**`IntersectionObserver` registered inside `requestAnimationFrame` with no cleanup:**
- Symptoms: Observer is never disconnected (`observer.disconnect()` is never called). On hot-reload in dev, multiple observers accumulate on the same step elements, causing `activeStep` to fire multiple times per scroll event
- Files: `dashboard/src/App.svelte` (lines 17–27)
- Trigger: HMR / component remount in Vite dev mode
- Workaround: Avoid hot-reloading that component; full page refresh clears it

**`ownerType` assigned from first-seen record only:**
- Symptoms: `prepare-data.py` sets `owner_types[name]` only on the first encounter for each institution (line 29: `if name not in owner_types`). If the first shard's record for an institution has a missing/incorrect `ownerType`, that incorrect value is locked in for the entire dataset
- Files: `dashboard/scripts/prepare-data.py` (lines 29–30)
- Trigger: Institutions that span multiple `ownerType` categories (e.g., a ministry with both `central` and `provinsi` sub-units sharing a `lembaga` name) will be mislabeled
- Workaround: None currently; would require a majority-vote or canonical-type lookup

## Security Considerations

**No Content Security Policy (CSP):**
- Risk: The dashboard fetches from Google Fonts CDN (`fonts.googleapis.com`, `fonts.gstatic.com`) with no CSP header. If hosted on a platform that doesn't add headers automatically, XSS via injected scripts has no browser-level mitigation
- Files: `dashboard/index.html` (lines 8–9)
- Current mitigation: None
- Recommendations: Add a `<meta http-equiv="Content-Security-Policy">` tag or configure hosting platform (Vercel/Netlify) to emit CSP headers restricting `script-src` to `'self'`

**Google Fonts loaded over external CDN:**
- Risk: Loading fonts from `fonts.googleapis.com` leaks user IP addresses to Google on every page load. For a site targeting Indonesian civil society audiences this is a minor privacy concern
- Files: `dashboard/index.html` (lines 7–9)
- Current mitigation: None
- Recommendations: Self-host fonts via `fontsource` npm packages or download and serve from `public/fonts/`

**Dataset download URL in CLAUDE.md contains a long-lived SAS token (expiry 2029):**
- Risk: The Azure Blob SAS URL in `CLAUDE.md` is committed to the repo. Anyone with repo read access can download the full 3.2 GB dataset until April 2029
- Files: `CLAUDE.md` (lines 13–16)
- Current mitigation: Repo is currently private (not verified); SAS token is read-only
- Recommendations: Rotate the SAS token when the dataset access policy changes; consider removing from CLAUDE.md and documenting the URL separately outside the repo

## Performance Bottlenecks

**`prepare-data.py` does two full sequential scans of 3.2 GB:**
- Problem: The script first iterates all 123 `*.jsonl` files for totals/counts, then iterates all `*_priority.json` files for flag counts — two complete I/O passes
- Files: `dashboard/scripts/prepare-data.py` (lines 20–47)
- Cause: Separate loops for JSONL and priority JSON. Priority data could be computed in the same JSONL pass since `tags.isInappropriate` is present in every JSONL record
- Improvement path: Merge into a single pass over JSONL; eliminates the need to re-read `_priority.json` files entirely

**SVG rendered without virtualization:**
- Problem: `BarChart.svelte` renders all 15 bars (up to 30 if `SHOW` is increased) as inline SVG elements. At current scale this is fine, but the step transition animates all bars simultaneously via CSS transitions on every `step` change
- Files: `dashboard/src/BarChart.svelte` (lines 83–130)
- Cause: No rendering budget management; all bars re-evaluate `mainFill`, `mainWidth`, `flagFill`, `nameFill` on every step change
- Improvement path: Acceptable at 15–30 bars; would need batching only if scaling to 100+

## Fragile Areas

**Pre-aggregated JSON is the only data source — no regeneration guard:**
- Files: `dashboard/public/data/lembaga-totals.json`, `dashboard/public/data/summary-stats.json`
- Why fragile: These files are committed to git (intentionally, per `.gitignore` comment) to allow the dashboard to run without the full 3.2 GB dataset. If the dataset is updated and `prepare-data.py` is re-run, the committed JSON must be manually updated and re-committed. There is no CI step or Makefile target that enforces consistency
- Safe modification: Always run `uv run dashboard/scripts/prepare-data.py` after any dataset update, then commit both JSON files together
- Test coverage: Zero — no tests verify the data files match the raw dataset

**Scrollytelling `activeStep` relies on `IntersectionObserver` margin tuning:**
- Files: `dashboard/src/App.svelte` (line 25: `rootMargin: '-38% 0px -38% 0px'`)
- Why fragile: The 38% rootMargin is a magic number tuned for the current viewport layout. Changes to step card heights, font sizes, or the 60/40 sticky/scroll column split will silently break step activation timing without throwing errors
- Safe modification: Test scroll behavior manually at multiple viewport sizes after any layout change to the `.scrolly` section

**`shortName` truncation is character-count only:**
- Files: `dashboard/src/BarChart.svelte` (line 59: `n.length > 28 ? n.slice(0, 27) + '…' : n`)
- Why fragile: Truncation at 28 characters is calibrated for the current `margin.left = 230` and `font-size="11.5"`. If either changes, labels will either overflow or truncate too aggressively
- Safe modification: Update the character limit in tandem with any margin or font-size change

## Scaling Limits

**Dataset is a static one-year snapshot (2026):**
- Current capacity: 3,009,760 records across 123 shards, 3.2 GB
- Limit: `prepare-data.py` loads all shards into memory sequentially; Python process peak memory scales linearly with shard count. At 123 shards this runs in seconds; at 10x shards it would require streaming
- Scaling path: Use `pandas` with chunked reading or DuckDB for multi-year aggregation

## Dependencies at Risk

**`svelte@^5` — Svelte 5 was recently GA; ecosystem is still maturing:**
- Risk: Several Svelte ecosystem packages (SvelteKit adapters, community UI libraries) lag behind Svelte 5 rune compatibility. The project uses only `@sveltejs/vite-plugin-svelte@^4` which is compatible, but adding community components may require vetting
- Impact: Low for current single-component scope; increases if the project adds routing or complex UI
- Migration plan: No migration needed; stay on Svelte 5 but audit any new community dependency before adding

**No `package-lock.json` integrity checks in build process:**
- Risk: `package-lock.json` uses lockfileVersion 3 and is present, but there is no CI pipeline running `npm ci`. Local `npm install` could drift if developers run it with different npm versions
- Impact: Low currently; increases if multiple contributors work on `dashboard/`
- Migration plan: Add a GitHub Actions workflow running `npm ci && npm run build` on push

## Missing Critical Features

**No error/empty state UI:**
- Problem: If data fetch fails, the hero section shows a loading pulse forever. There is no "failed to load" message, retry button, or fallback
- Blocks: Production deployment to any hosting where data files could be misconfigured

**No OG/social meta tags:**
- Problem: `index.html` has no `<meta property="og:*">` or `<meta name="twitter:*">` tags
- Blocks: Shareability on social media — the primary distribution channel for the target audience (Indonesian general public). Links shared on WhatsApp, Twitter/X, and Facebook will render with no preview card

**No analytics or view tracking:**
- Problem: No way to measure reach or which sections users engage with
- Blocks: Understanding whether the narrative is working for the intended audience

## Test Coverage Gaps

**Zero test coverage across the entire codebase:**
- What's not tested: All dashboard components (`App.svelte`, `BarChart.svelte`), data preparation script (`prepare-data.py`), and data integrity of committed JSON files
- Files: `dashboard/src/App.svelte`, `dashboard/src/BarChart.svelte`, `dashboard/scripts/prepare-data.py`, `dashboard/public/data/lembaga-totals.json`, `dashboard/public/data/summary-stats.json`
- Risk: Silent regressions in chart rendering logic, data aggregation errors (e.g., double-counting flagged pagu), or stale committed JSON going undetected
- Priority: Medium — the project is a POC/narrative site, but the data preparation script is the most risk-prone path and should have at least smoke tests validating output schema and total-record counts

**Processing failures unquantified and unmonitored:**
- What's not tested: 65,116 records across the `*_failures.csv` files failed AI labeling with `RateLimitError: 429`. These records have no `tags.isInappropriate` value and are silently excluded from all dashboard statistics
- Files: `inaproc-ds/outputs/*_failures.csv` (123 files, 65,116 failure rows)
- Risk: The "5.5% flagged" headline figure shown in the dashboard undercounts if a disproportionate number of high-spend or high-flag records are in the failure set. There is no analysis of whether failures are randomly distributed across institutions or clustered
- Priority: High — this directly affects the accuracy of the public-facing narrative

---

*Concerns audit: 2026-05-13*
