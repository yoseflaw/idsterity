# idsterity

## What This Is

A bilingual (Indonesian / English) scrollytelling website that exposes the absurdity of Indonesian government procurement waste — delivered with dark irony. The joke is the contrast: Prabowo publicly promises extreme fiscal efficiency while procurement records show the opposite. We don't lecture. We let the numbers deliver the punchline.

Inspired by [nemesis.assai.id](https://nemesis.assai.id/) — which is descriptive and requires user intent. This project provides the narrative format: one scroll, one story, one clear emotional gut-punch.

**Core Value:** Every visitor who reaches the end should feel the irony viscerally and want to share it.

## Context

- **Audience:** Indonesian general public. Optimized for shareability via LinkedIn. Accessible to both Indonesian and English speakers.
- **Tone:** Ironic / dark humor — "laugh-cry." Never lecture. Let the data be the comedian.
- **Constraint:** Story must complete in under 3 minutes of reading.
- **Deploy target:** Static build → yosef.id (managed separately, not in git)
- **Dataset:** `inaproc-ds/outputs/` — ~123 shards of 2026 SIRUP/LPSE records, AI-labeled for appropriateness

## The Story (9 Sections)

1. **Hook** — Opening: *"Follow the… Where is the money?"* Curated quotes from Indonesian officials (especially Prabowo) promising fiscal responsibility. 3–5 quotes with publication links. The setup is them promising to save money — now watch what happened.

2. **APBN 2026 Q1 Deficit** — Q1 2026 deficit vs. recent years. Source: tirto.id. Exact figures to be researched and hardcoded.

3. **BPS GDP Growth** — Q1 2026 GDP and government consumption component trend across Q1 2025–Q1 2026. Angle: GDP held up *because* of government spending — which makes the waste more ironic. Source: BPS. Data to be researched and hardcoded.

4. **inaproc Dataset Overview** — Introduce the dataset. Total spending vs. APBN 2026. Breakdown by AI label (low/med/high). Safe harbour disclaimer on AI labeling.

5. **Who Spent the Most?** — Top institutions by total pagu. Stacked bars showing low/med/high breakdown per institution.

6. **Absurd Only** — Filter to `tags.isInappropriate = "high"`. Re-rank institutions. Story sharpens here.

7. **Anchor the Number** — Total "absurd" (high) spending expressed as: kopi jago cups, seblak portions, elementary schools, puskesmas. Animated, one anchor at a time.

8. **What Are They Buying?** — Pre-built word cloud of paket names from the high-inappropriate subset. Filters: (a) Central Gov vs. District Gov (`ownerType`), (b) specific institution (kementrian/pemda name). Word cloud capped at top 15–20 words if complexity demands.

9. **Explore** — Click a word → filtered table: lembaga, satker, pagu, paket, inappropriateReason. User discovers their own punchlines.

## Requirements

### Validated

- ✓ Vite + Svelte 5 + D3 setup — existing
- ✓ Scrollytelling scroll-step mechanism — existing (POC)
- ✓ Offline Python data pipeline — existing
- ✓ Pre-aggregated JSON data files — existing
- ✓ Replace POC with proper story-driven implementation (all 9 sections) — Phase 1–3
- ✓ Language toggle (Indonesian / English) — single URL, client-side switch — Phase 1
- ✓ All UI copy available in both ID and EN — Phase 1–3
- ✓ Section 1: Quotes section with publication links — Phase 2
- ✓ Section 2: APBN deficit data researched, hardcoded, visualized — Phase 2
- ✓ Section 3: GDP government consumption component data researched, hardcoded, visualized — Phase 2
- ✓ Section 4: Dataset overview — totals, AI label breakdown, safe harbour disclaimer — Phase 2
- ✓ Section 5: Top institutions by pagu, stacked bar chart by appropriateness label — Phase 2
- ✓ Section 6: High-inappropriate only, re-ranked institutions — Phase 2
- ✓ Section 7: Anchor animations (kopi jago, seblak, schools, puskesmas) — Phase 3
- ✓ Section 8: Pre-built word cloud with ownerType filter and institution-name filter, 37 words — Phase 3
- ✓ Section 9: Explore table driven by word cloud selection — Phase 3
- ✓ Python NLP script for word frequency (offline, output baked into static build) — Phase 3

### Active

- [ ] Static build deployable to any shared hosting (no server-side code)
- [ ] LinkedIn OG share card (og:title, og:description, og:image 1200×627 JPG <200KB)
- [ ] Lighthouse score acceptable (lightweight, snappy)
- [ ] All data fetches use `import.meta.env.BASE_URL` (not hardcoded `/data/`)

### Out of Scope

- Backend or API server — fully static after build
- User accounts or authentication — no
- Real-time data updates — data baked at build time
- Mobile app — web only
- SEO beyond OG tags for LinkedIn sharing

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Language toggle, not two URLs | Simpler to share one link; LinkedIn preview works with one canonical URL | Decided |
| Pre-build word cloud offline | Avoid runtime NLP; keeps page fast; cap at top 15–20 if needed | Decided |
| Research & hardcode APBN/GDP figures | No live API calls; sources are stable government publications | Decided |
| Replace POC entirely | POC proved the scroll mechanism; real implementation needs proper story structure | Decided |
| Static-only deploy | Matches hosting capability; no Node server on shared hosting | Decided |
| Visual style: Pudding.cool | Reference: pudding.cool/2017/03/punk/ — bold type, step-driven reveals, minimal chrome | Decided |
| NLP: nlp-id for lemmatization | Proper Indonesian lemmatization without NLTK/spaCy overhead; nlp-id is purpose-built for Bahasa Indonesia | Decided |
| Per-word JSON files: 37 words × 3 filters | Union across all three wordcloud files yields 37 unique words (not 20 estimated); plan accepted dynamic discovery | Phase 3 |
| wordCache in-memory Map | Deduplicates S9 lazy fetches — same word+filter re-clicked never hits network twice | Phase 3 |
| selectedWord from cloudWords only | Never from free-text search input — prevents XSS via URL-like word injection | Phase 3 |
| S9 gold title word: inline conditional, not {@html} | Preserves Svelte HTML-escaping; `{@html}` would bypass XSS protection | Phase 3 |
| fmtPaguShort: 'jt'/'M' suffix | Sub-billion amounts formatted as "jt" (Indonesian) or "M" (English) for table readability | Phase 3 |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-14 after Phase 3*
