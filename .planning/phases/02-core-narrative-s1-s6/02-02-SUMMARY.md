---
phase: 02-core-narrative-s1-s6
plan: "02"
subsystem: data-pipeline
tags: [etl, data-shape, cr-03, per-label-pagu, lembaga-totals]
dependency_graph:
  requires: []
  provides: [lembaga-totals-per-label-pagu, cr-03-guard]
  affects: [InstitutionsChart-plan-05, summary-stats-negative-guard]
tech_stack:
  added: []
  patterns: [defaultdict-aggregation, cr-03-negative-guard, max-zero-clamp]
key_files:
  created: []
  modified:
    - dashboard/scripts/prepare-data.py
    - dashboard/public/data/lembaga-totals.json
decisions:
  - "Added high_pagu/med_pagu/low_pagu defaultdicts; accumulate per-institution inside existing priority loop branches"
  - "CR-03: intermediate unflagged_pagu/unflagged_counts variables with WARNING print + max(..., 0) guard, exact pattern from 01-REVIEW.md"
  - "lowPagu/medPagu/highPagu inserted between medCount and jenisCounts in lembaga_totals dict comprehension for field-block contiguity"
  - "summary-stats.json not modified — unflagged values were already non-negative (553T pagu, 2.84M counts)"
metrics:
  duration_minutes: 7
  completed: "2026-05-13T23:48:00Z"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 2
---

# Phase 02 Plan 02: ETL Per-Label Pagu Aggregation + CR-03 Guard Summary

Per-institution stacked pagu tiers (lowPagu/medPagu/highPagu) added to lembaga-totals.json and CR-03 negative-unflagged guard introduced in prepare-data.py.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Patch prepare-data.py — per-institution pagu tiers + CR-03 guard | 44b4d9c | dashboard/scripts/prepare-data.py |
| 2 | Regenerate lembaga-totals.json from patched pipeline | 7996256 | dashboard/public/data/lembaga-totals.json |

## Schema Change

### lembaga-totals.json — New Fields Per Record

Three integer fields added between `medCount` and `jenisCounts`:

| Field | Type | Description |
|-------|------|-------------|
| `highPagu` | int | Sum of pagu for all `isInappropriate: high` packages at this institution |
| `medPagu` | int | Sum of pagu for all `isInappropriate: med` packages at this institution |
| `lowPagu` | int | Sum of pagu for all `isInappropriate: low` packages at this institution |

**Invariant verified:** `lowPagu + medPagu + highPagu == flaggedPagu` for all 30 records (Python assertion passed on rank-1).

### Rank-1 Sanity Numbers (Kementerian Pertahanan)

| Field | Value |
|-------|-------|
| `lowPagu` | Rp 378,178,215,000 (~Rp 378 B) |
| `medPagu` | Rp 3,287,841,216,693 (~Rp 3.29 T) |
| `highPagu` | Rp 293,994,958,800 (~Rp 294 B) |
| `flaggedPagu` | Rp 3,960,014,390,493 (~Rp 3.96 T) |
| **Sum check** | **3,960,014,390,493 == 3,960,014,390,493** |

## CR-03 Fix Applied

Replaced the two bare assignment lines that could produce negative values with:

1. Intermediate variables `unflagged_pagu` and `unflagged_counts`
2. Conditional `print(f"WARNING: ...")` for each if negative
3. `max(..., 0)` clamp before assigning to `label_pagu["unflagged"]` / `label_counts["unflagged"]`

**Pipeline run result:** No WARNING messages emitted — both values are positive (unflagged pagu: Rp 553.4 T, unflagged records: 2,844,293). Input shards are consistent.

## Pipeline Run Output

```
lembaga-totals.json → 30 records
summary-stats.json  → {'totalPagu': 642151776949395, 'totalRecords': 3009760, 'flaggedCount': 165467, 'flaggedPagu': 88749284955521, 'uniqueLembaga': 663, 'labelPagu': {'low': 3722702663263, 'med': 74297357749965, 'high': 10729224542293, 'unflagged': 553402491993874}, 'labelCounts': {'low': 5636, 'med': 134833, 'high': 24998, 'unflagged': 2844293}, 'unflaggedPagu': 553402491993874}
```

No WARNING lines — unflagged calculation is non-negative.

## Deviations from Plan

None — plan executed exactly as written. The three new defaultdicts, the priority-loop accumulation, the CR-03 intermediate + WARNING + max-zero pattern, and the dict comprehension extension all implemented per spec. Task sequence (patch script → run pipeline → verify) completed without deviation.

## Known Stubs

None. All fields carry real aggregated values from the inaproc-ds source shards.

## Self-Check: PASSED

| Item | Status |
|------|--------|
| dashboard/scripts/prepare-data.py | FOUND |
| dashboard/public/data/lembaga-totals.json | FOUND |
| 02-02-SUMMARY.md | FOUND |
| Commit 44b4d9c (task 1) | FOUND |
| Commit 7996256 (task 2) | FOUND |
