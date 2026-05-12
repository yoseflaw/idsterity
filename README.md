# idsterity

A scrollytelling visualization for Indonesian government procurement data (SIRUP 2026). Built to surface patterns in public spending — waste potential, institutional rankings, and flagged procurement.

> Visual direction and UX inspired by [The Pudding](https://pudding.cool/2023/07/songwriters/) — narrative-first, scroll-driven data stories with sticky visualizations that evolve as you read.
>
> Dataset sourced from [assai-id/nemesis](https://github.com/assai-id/nemesis).

---

## Dashboard

The current POC answers: **which institutions have the largest SIRUP budget allocation for 2026?**

![Bar chart ranking top 30 Indonesian government institutions by total procurement budget](dashboard/public/data/lembaga-totals.json)

**Stack**: Vite · Svelte 5 · D3.js

**Features so far**:
- Horizontal bar chart, top 30 institutions ranked by total `pagu`
- Color-coded by government level (pusat / provinsi / kab-kota)
- Pre-aggregated static JSON — no backend needed

---

## Dataset

The raw dataset (`inaproc-ds/outputs/`) is **not committed** (3.2 GB). Download and extract it into the project root:

```bash
curl -L "https://contenflowstorage.blob.core.windows.net/shared/gpt-5.4-analyzed-sirup.zip?sp=r&st=2026-04-16T12:00:08Z&se=2029-04-16T20:15:08Z&spr=https&sv=2025-11-05&sr=b&sig=m%2FATynnnZq5gSdP8xWWw2ew41EMJZz09fDQRwpbWolk%3D" -o sirup.zip
unzip sirup.zip && rm sirup.zip
```

It contains ~123 partitioned shards of Indonesian LPSE/SIRUP procurement packages for 2026, each partition producing:

| File | Format | Contents |
|---|---|---|
| `year-2026.part-NNNNN.jsonl` | JSONL | Full records |
| `year-2026.part-NNNNN.csv` | CSV | Flattened records |
| `year-2026.part-NNNNN_priority.json` | JSON array | High-risk flagged subset |
| `year-2026.part-NNNNN_failures.csv` | CSV | Processing failures |

The pre-aggregated data used by the dashboard (`dashboard/public/data/lembaga-totals.json`) **is** committed and sufficient to run the dashboard without the full dataset.

---

## Setup

### Run the dashboard (no raw data needed)

```bash
cd dashboard
npm install
npm run dev
```

Open `http://localhost:5173`.

### Regenerate dashboard data from raw shards

Requires the full dataset in `inaproc-ds/outputs/`. Needs [uv](https://docs.astral.sh/uv/).

```bash
uv run dashboard/scripts/prepare-data.py
```

This re-writes `dashboard/public/data/lembaga-totals.json`.

---

## Project Structure

```
idsterity/
├── dashboard/                  # Vite + Svelte visualization app
│   ├── public/data/            # Pre-aggregated JSON (committed)
│   ├── scripts/
│   │   └── prepare-data.py     # Aggregates raw shards → JSON
│   └── src/
│       ├── App.svelte          # Root component, data loading
│       └── BarChart.svelte     # D3 horizontal bar chart
└── inaproc-ds/
    └── outputs/                # Raw dataset (not committed, 3.2 GB)
```

---

## Key Dataset Fields

| Field | Description |
|---|---|
| `lembaga` | Procuring institution |
| `pagu` | Budget ceiling (IDR) |
| `ownerType` | `central`, `provinsi`, or `kabkota` |
| `jenisPengadaan` | Procurement type (goods, construction, services) |
| `potensiPemborosan` | Waste-potential score |
| `tags.isInappropriate` | Anomaly flag: `low`, `med`, `high` |

See `CLAUDE.md` for the full schema.

---

## License

Data sourced from [LPSE/SIRUP](https://sirup.lkpp.go.id/) — Indonesia's public procurement system. Open government data.
