---
phase: 01-foundation-data-pipeline
plan: "03"
subsystem: data-pipeline
tags: [data, python, etl, word-cloud, nlp, constants]
dependency_graph:
  requires: []
  provides:
    - dashboard/public/data/constants.json
    - dashboard/public/data/lembaga-totals.json
    - dashboard/public/data/summary-stats.json
    - dashboard/public/data/wordcloud-all.json
    - dashboard/public/data/wordcloud-central.json
    - dashboard/public/data/wordcloud-district.json
    - dashboard/public/data/wordcloud-lembaga.json
    - dashboard/scripts/word-cloud.py
  affects:
    - Phase 2 (S2 APBN deficit, S3 GDP, S4 dataset overview)
    - Phase 3 (S8 word cloud component)
    - Plan 01-01 (constants.json fetch at mount)
tech_stack:
  added:
    - nlp-id (Indonesian lemmatizer, via PEP 723 uv inline dep)
  patterns:
    - PEP 723 inline script metadata
    - uv as canonical Python script runner
    - defaultdict accumulator pattern (extended)
    - Procurement domain stopword list + post-lemmatization re-filter
key_files:
  created:
    - dashboard/public/data/constants.json
    - dashboard/scripts/word-cloud.py
    - dashboard/public/data/wordcloud-all.json
    - dashboard/public/data/wordcloud-central.json
    - dashboard/public/data/wordcloud-district.json
    - dashboard/public/data/wordcloud-lembaga.json
  modified:
    - dashboard/scripts/prepare-data.py
    - dashboard/public/data/lembaga-totals.json
    - dashboard/public/data/summary-stats.json
    - dashboard/package.json
decisions:
  - "constants.json uses snake_case for quarter keys (q1_2025 etc) as they are identifiers, camelCase elsewhere — matches existing lembaga-totals convention"
  - "Q1 2026 APBN and BPS figures marked provisional=true in sources; most recent official data available as of 2026-05-13"
  - "word-cloud.py filters high-only records (not med) — aligns with DATA-04 and Phase 3 S8 framing"
  - "Stopword frozenset contains ~30 terms: procurement boilerplate + Roman numerals + common Indonesian function words"
  - "label_pagu unflagged bucket computed as: total_pagu minus sum(low+med+high); mirrors same approach for label_counts"
  - "wordcloud-lembaga.json includes all 620 institutions with any high-inappropriate record — no size cutoff applied"
metrics:
  duration: "~15 minutes"
  completed: "2026-05-13"
  tasks_completed: 3
  tasks_total: 3
  files_created: 6
  files_modified: 4
---

# Phase 1 Plan 3: Data Pipeline (constants.json + S4 aggregates + word-cloud.py) Summary

**One-liner:** APBN/GDP constants file authored from official Kemenkeu/BPS sources; prepare-data.py extended with per-institution jenisCounts/metodeCounts/paguByMonth and dataset-wide four-bucket label aggregates; nlp-id word-cloud.py produces 4 wordcloud JSON files from high-inappropriate paket names.

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Author constants.json with APBN deficit + BPS GDP figures | 2376a2b | dashboard/public/data/constants.json |
| 2 | Extend prepare-data.py with S4 aggregates + regenerate outputs | 0c0f290 | dashboard/scripts/prepare-data.py, lembaga-totals.json, summary-stats.json |
| 3 | Create word-cloud.py + 4 wordcloud JSON files + npm script | b30c6f0 | dashboard/scripts/word-cloud.py, wordcloud-*.json, package.json |

## Key Outputs

### constants.json
- APBN deficit series: Oct 2024 (Rp -309.2T), FY 2025 (Rp -507.8T), Q1 2026 (Rp -104.2T, provisional)
- BPS GDP konsumsi pemerintah: Q1 2025 (-3.24%), Q2 2025 (+10.93%), Q3 2025 (+5.08%), Q4 2025 (+4.41%), Q1 2026 (+7.21%, provisional)
- 8 source citations with kemenkeu.go.id and bps.go.id URLs

### lembaga-totals.json (extended)
- 30 top institutions with 12 keys each (9 existing + 3 new S4 keys)
- jenisCounts, metodeCounts, paguByMonth added per institution
- Backward-compatible: all existing keys (rank, name, total, count, ownerType, flaggedCount, flaggedPagu, highCount, medCount) preserved

### summary-stats.json (extended)
- labelPagu: {low: 3.7T, med: 74.3T, high: 10.7T, unflagged: 553.4T}
- labelCounts: {low: 5636, med: 134833, high: 24998, unflagged: 2844293}
- unflaggedPagu: 553402491993874 (IDR)
- Total dataset: 3,009,760 records across 663 unique institutions

### wordcloud files (4 files)
- wordcloud-all.json: top-20 words across all high-inappropriate pakets
- wordcloud-central.json: top-20 words for central government institutions
- wordcloud-district.json: top-20 words for provincial/district institutions
- wordcloud-lembaga.json: keyed object with 620 institutions, top-20 words each
- Top words: kantor, sewa, modal, dinas, bangun (procurement patterns visible)

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

### Notes

- The `label_pagu["low"]` accumulator captures records in priority files where `isInappropriate == "low"`. Verified by inspecting sample priority file: priority files contain all three levels (low/med/high). The unflagged bucket correctly captures records not in any priority file.
- nlp-id package pulls scipy/scikit-learn/numpy as transitive dependencies (resolved automatically by uv via PEP 723 inline metadata). No manual installation needed.
- A SyntaxWarning from nlp_id/tokenizer.py (invalid escape sequence) is emitted at runtime — this is an upstream issue in the nlp-id package, not in our code. Does not affect output.

## Known Stubs

None — all data artifacts are fully populated from the real dataset (3M+ records).

## Threat Flags

None found. All generated files serve publicly-available LPSE/SIRUP data. Large dataset (inaproc-ds/outputs/) remains gitignored per T-01-03-06 mitigation.

## Self-Check: PASSED

- dashboard/public/data/constants.json: FOUND
- dashboard/scripts/prepare-data.py: FOUND
- dashboard/public/data/lembaga-totals.json: FOUND
- dashboard/public/data/summary-stats.json: FOUND
- dashboard/scripts/word-cloud.py: FOUND
- dashboard/public/data/wordcloud-all.json: FOUND
- dashboard/public/data/wordcloud-central.json: FOUND
- dashboard/public/data/wordcloud-district.json: FOUND
- dashboard/public/data/wordcloud-lembaga.json: FOUND
- Commits 2376a2b, 0c0f290, b30c6f0: verified in git log
