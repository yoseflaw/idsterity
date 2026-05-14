---
phase: 03-interactive-back-half-s7-s9
plan: "02"
subsystem: data-pipeline
tags: [python, data-pipeline, etl, json, prepare-data, sec-09]
dependency_graph:
  requires:
    - dashboard/public/data/wordcloud-all.json
    - dashboard/public/data/wordcloud-central.json
    - dashboard/public/data/wordcloud-district.json
  provides:
    - dashboard/public/data/word-{word}-all.json (37 files)
    - dashboard/public/data/word-{word}-central.json (37 files)
    - dashboard/public/data/word-{word}-district.json (37 files)
  affects:
    - Plan 03-03 (S8/S9 overlay UI fetches these files via safeFetch)
tech_stack:
  added: []
  patterns:
    - Offline ETL: per-word record bucketing appended to existing prepare-data.py
    - Empty-array fallback for no-dataset environments
key_files:
  created:
    - dashboard/public/data/word-*-{all,central,district}.json (111 files total)
  modified:
    - dashboard/scripts/prepare-data.py
decisions:
  - ALL_WORDS is the sorted union of word fields across all three wordcloud JSON files (37 words, not 20)
  - PER_WORD_TOP = 20 constant kept separate from existing TOP_N = 30
  - Each wordcloud file referenced as a named variable on its own line for clarity and grep-ability
  - lembaga-totals.json and summary-stats.json restored to committed state after dataset-absent run overwrote them
metrics:
  duration: "~10 minutes"
  completed: "2026-05-14T12:45:00Z"
  tasks_completed: 2
  files_changed: 112
---

# Phase 3 Plan 02: Per-Word Record Bucketing (SEC-09 Data Layer) Summary

**One-liner:** Extended `prepare-data.py` with a stdlib-only per-word record bucketing pass that emits 111 `word-{word}-{filter}.json` files (37 words × 3 filters) as the static data foundation for the S9 record-table overlay.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Extend prepare-data.py with per-word record bucketing | `6baf7b0` | `dashboard/scripts/prepare-data.py` (+50 lines) |
| 2 | Run pipeline to materialize word-{word}-{filter}.json files | `443eee2` | 111 new `dashboard/public/data/word-*.json` files |

## Implementation Details

### Lines Added to prepare-data.py

50 lines appended after the existing `lembaga-totals.json` / `summary-stats.json` write block (lines 125–173). Structure:

1. **Prerequisite check** (lines 127–133): Three named path variables (`_wc_all`, `_wc_central`, `_wc_district`), each checked for existence with a descriptive `FileNotFoundError` if missing.
2. **Word discovery** (lines 135–140): `ALL_WORDS` = sorted union of `word` field across all three wordcloud JSON files. Yields 37 unique words (the three files have overlapping sets).
3. **Constants & bucket** (lines 141–143): `PER_WORD_TOP = 20` (separate from `TOP_N = 30`); `records_by_word_filter` nested dict.
4. **Priority shard iteration** (lines 145–164): Iterate `*_priority.json` shards, filter for `isInappropriate == "high"`, build 5-field record dict (`lembaga`, `satker`, `pagu`, `paket`, `inappropriateReason`), append to `all`/`central`/`district` buckets.
5. **Write loop** (lines 166–171): Sort each bucket by `pagu` descending, slice to `PER_WORD_TOP`, write with `ensure_ascii=False, indent=2`.
6. **Summary print** (line 173): `word-*-*.json → 37 words × 3 filters = 111 files`.

### Files Emitted

111 files in `dashboard/public/data/`:
- 37 × `word-{word}-all.json`
- 37 × `word-{word}-central.json`
- 37 × `word-{word}-district.json`

Words discovered (sorted): bangun, biaya, cendera, daerah, daya, dinas, imigrasi, jabat, jalan, kantor, kelas, kendara, kepada, layan, luar, masyarakat, mata, meeting, modal, motor, natura, non, obat, operasional, pakai, pakan, pelihara, rumah, satker, sewa, sub, susun, suvenir, tahan, tangga, tiket, use

### Sample Record Content

`word-kantor-all.json` contains `[]` (empty array) — the dataset (`inaproc-ds/outputs/`) was not present during this run. The plan's empty-array fallback path executed correctly. When the dataset is downloaded and the pipeline re-run, this file will contain up to 20 records matching paket strings that contain "kantor" with `isInappropriate == "high"`, each with exactly these 5 fields:

```json
{
  "lembaga": "Kementerian ...",
  "satker": "...",
  "pagu": 450000000,
  "paket": "Sewa Kantor ...",
  "inappropriateReason": "..."
}
```

### Dataset Presence

**Dataset absent** — `inaproc-ds/outputs/` was not present. All 111 files emitted as `[]`. This is the expected graceful fallback behavior: S9 in Plan 03 uses `safeFetch` which handles empty arrays without error.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Restored lembaga-totals.json and summary-stats.json after pipeline overwrote them**
- **Found during:** Task 2
- **Issue:** Running `uv run prepare-data.py` with no dataset overwrote the committed `lembaga-totals.json` (1654 records → 0) and `summary-stats.json` with zero-value data. This would break S2–S6 which depend on these files having real content.
- **Fix:** Used `git checkout -- dashboard/public/data/lembaga-totals.json dashboard/public/data/summary-stats.json` to restore committed content before committing the new word files.
- **Files modified:** Not committed — restored to committed state.
- **Note:** This is expected behavior for a no-dataset run; the pipeline correctly reports 0 records, but the already-committed data must be preserved when operating on a developer machine without the full 3.2 GB archive.

**2. [Rule 1 - Observation] 37 unique words, not 20**
- The union of words across the three wordcloud files yields 37 unique words (not 20 as the plan estimated). The plan noted "actual count may differ if filter clouds overlap." 37 × 3 = 111 files, not 60.
- No fix needed — the code correctly discovers all words dynamically. The acceptance criteria "at least 60" is satisfied (111 > 60).

## Known Stubs

All 111 `word-{word}-{filter}.json` files are empty arrays (`[]`) because the dataset was absent. These are **intentional stubs** for the no-dataset environment:
- They are valid JSON and satisfy the S9 overlay's `safeFetch` contract.
- When `inaproc-ds/outputs/` is populated and `prepare-data.py` is re-run, they are replaced with real top-20 records.
- The Plan 03 UI can render "no results" state gracefully.

## Threat Flags

None — no new network endpoints or trust boundaries introduced. Files are produced deterministically from committed wordcloud JSON (prerequisite check), iterated priority shards, and written to `dashboard/public/data/` (reviewed at commit).

## Self-Check: PASSED

- [x] `dashboard/scripts/prepare-data.py` exists and contains per-word bucketing block
- [x] `git log --oneline | grep 6baf7b0` — Task 1 commit found
- [x] `git log --oneline | grep 443eee2` — Task 2 commit found
- [x] 111 `word-*-*.json` files present in `dashboard/public/data/`
- [x] All files parse as valid JSON arrays
- [x] `lembaga-totals.json` and `summary-stats.json` are unchanged (restored to committed state)
- [x] Python syntax check passes (`ast.parse`)
