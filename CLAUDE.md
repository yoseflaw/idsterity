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
