# Phase 1: Foundation & Data Pipeline - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-13
**Phase:** 01-foundation-data-pipeline
**Areas discussed:** POC disposal strategy, Scroll library choice, Word cloud file structure, Bilingual copy architecture

---

## POC Disposal Strategy

### Q1: How to handle existing component files?

| Option | Description | Selected |
|--------|-------------|----------|
| Nuke and rewrite (Recommended) | Delete App.svelte and BarChart.svelte entirely, start fresh. Vite config and main.js stay untouched. | ✓ |
| Gut-and-refactor in-place | Keep files, strip POC content, build new structure on top. Preserves git history but risks inheriting POC assumptions. | |
| Archive POC branch first | Create a git tag/branch to preserve POC, then nuke and rewrite main. Same end result with a revert point. | |

**User's choice:** Nuke and rewrite
**Notes:** Clean break from POC assumptions.

---

### Q2: What happens to existing pre-aggregated data files?

| Option | Description | Selected |
|--------|-------------|----------|
| Keep them as-is (Recommended) | Valid committed data; extend with new fields as needed. | |
| Regenerate on Phase 1 execution | Re-run prepare-data.py so output matches any schema changes made during Phase 1. | ✓ |
| Delete and regenerate later | Remove from repo now, regenerate when scripts are finalized. Risk: app has no data until scripts run. | |

**User's choice:** Regenerate on Phase 1 execution
**Notes:** Ensures data files match final schema.

---

### Q3: New App.svelte structure — full placeholders or minimal scaffold?

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal scaffold (Recommended) | Hero + generic Step container pattern. Phase 2 adds S1–S9 content. | ✓ |
| Full S1–S9 placeholder structure | All 9 section slots stubbed with TODO comments. Phase 2 fills in. | |

**User's choice:** Minimal scaffold
**Notes:** Phase 1 stays focused on infrastructure, not layout.

---

## Scroll Library Choice

### Q1: scrollama npm package or custom IntersectionObserver?

| Option | Description | Selected |
|--------|-------------|----------|
| Add scrollama (npm package) (Recommended) | Standard for Pudding-style scrollytelling. Handles resize, offset, enter/exit. UI-SPEC already names it. | ✓ |
| Formalize existing IntersectionObserver | Zero new dependencies but we own edge-case handling. | |
| You decide | Claude chooses whichever fits better. | |

**User's choice:** Add scrollama
**Notes:** Consistent with UI-SPEC framing.

---

### Q2: Step activation offset?

| Option | Description | Selected |
|--------|-------------|----------|
| 50% viewport (Recommended) | Step activates at vertical midpoint. Standard Pudding behavior. | ✓ |
| 33% from top | Earlier activation, useful for very tall steps. | |
| Configurable per-step | Each step declares its own offset. More control, more complexity. | |

**User's choice:** 50% viewport
**Notes:** Applied globally.

---

## Word Cloud File Structure

### Q1: Per-lembaga file structure?

| Option | Description | Selected |
|--------|-------------|----------|
| One keyed JSON file (Recommended) | wordcloud-lembaga.json — one object keyed by institution name. One fetch, select key at runtime. | ✓ |
| One file per institution | 30+ individual files. Browser fetches only what it needs but complex to manage. | |

**User's choice:** One keyed JSON file
**Notes:** Simpler file tree, easier to deploy.

---

### Q2: Pre-computed positions or word + frequency only?

| Option | Description | Selected |
|--------|-------------|----------|
| Pre-computed positions (Recommended) | word-cloud.py runs d3-cloud offline, bakes x/y/rotation/size. Consistent across devices. | |
| Word + frequency only | Simpler Python script. Browser runs d3-cloud at render time. Responsive to screen size. | ✓ |

**User's choice:** Word + frequency only
**Notes:** Simpler pipeline; responsive layout is a benefit.

---

### Q3: File naming convention?

| Option | Description | Selected |
|--------|-------------|----------|
| wordcloud-{filter}.json (Recommended) | Flat in public/data/. Predictable, no subdirectory. | ✓ |
| wordcloud/{filter}.json | Subdirectory: public/data/wordcloud/. Cleaner at scale. | |

**User's choice:** wordcloud-{filter}.json flat naming
**Notes:** Consistent with existing lembaga-totals.json and summary-stats.json naming pattern.

---

## Bilingual Copy Architecture

### Q1: Where do bilingual strings live?

| Option | Description | Selected |
|--------|-------------|----------|
| src/i18n.js module (Recommended) | Single JS file exporting { id, en } keyed by string name. No fetch, offline-capable. Phase 2 adds keys. | ✓ |
| External JSON locale files | public/locales/id.json + en.json. Standard i18n but adds async loading complexity. | |
| Inline in each component | Each Svelte component holds its own { id, en }. Simple but scattered, hard to audit. | |

**User's choice:** src/i18n.js module
**Notes:** Central, diffable, no extra fetch calls.

---

### Q2: How is active language state managed?

| Option | Description | Selected |
|--------|-------------|----------|
| $state in App.svelte, prop-drilled (Recommended) | let lang = $state('id') in App.svelte, passed as prop. Consistent with activeStep pattern. | ✓ |
| Svelte 5 context API | setContext/getContext avoids prop drilling for deep trees. | |

**User's choice:** $state in App.svelte, prop-drilled
**Notes:** Simplest approach; consistent with POC state management.

---

### Q3: Default language on first load?

| Option | Description | Selected |
|--------|-------------|----------|
| Indonesian default (Recommended) | Primary audience is Indonesian. Matches project's local framing. | ✓ |
| Browser language detection | Check navigator.language, default to id or en accordingly. | |
| English default | Broader international reach but undercuts local authenticity. | |

**User's choice:** Indonesian default
**Notes:** The story is for Indonesian readers first.

---

## Claude's Discretion

- `constants.json` schema: key naming and nesting for APBN/GDP series data
- scrollama lifecycle integration: `$effect` vs `onMount` in Svelte 5
- `word-cloud.py` domain stopword list: Claude chooses procurement boilerplate terms to filter

## Deferred Ideas

None — discussion stayed within Phase 1 scope.
