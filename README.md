# idsterity

A visual scrollytelling site that exposes the absurdity of Indonesian government procurement waste (automatic labeling by AI) — delivered with dark irony. The joke is the contrast: public promises of extreme fiscal efficiency versus what the procurement records actually show.

🔗 **Live:** [yosef.id/sterity](https://yosef.id/sterity/)

> Visual direction inspired by [The Pudding](https://pudding.cool/) — narrative-first, scroll-driven data stories with sticky visualizations that evolve as you read.
>
> Data context and link-outs powered by [nemesis.assai.id](https://nemesis.assai.id/) ([assai-id/nemesis](https://github.com/assai-id/nemesis)).

---

## What it covers

The site walks the visitor through 8 sections — from macro framing (deficit, GDP) down to specific procurement packages — and ends on a share prompt.

1. Hook — the headline number
2. Defisit APBN (deficit chart)
3. PDB Indonesia (GDP chart)
4. Janji efisiensi vs. realita
5. Sang "Juara" — 5 lembaga dengan anggaran terbesar
6. Sang Juara Bermasalah — peringkat ulang berdasarkan pagu bermasalah
7. Pesta Seblak — Rp 14.3T bermasalah, divisualkan sebagai gelas kopi / mangkok seblak / SD / Puskesmas
8. Beli apa sih? — word cloud + paket cards
9. Bagikan — share + link out to Nemesis & GitHub

---

## Stack

- **Vite 5** + **Svelte 5** (runes: `$state`, `$derived`, `$props`)
- **D3 7** for chart math
- **Scrollama** for scroll-step triggers
- **Python 3.11** (stdlib only) for offline data aggregation
- No backend, no runtime API — fully static after `vite build`

---

## Dataset

The raw dataset (`inaproc-ds/outputs/`) is **not committed** (3.2 GB). Download from this repo and extract it into the project root: [Nemesis](https://github.com/assai-id/nemesis).

The raw data is ~123 partitioned shards of Indonesian LPSE/SIRUP procurement packages for 2026. Pre-aggregated JSON used by the dashboard is committed under `dashboard/public/data/` and is sufficient to run the site without the full dataset.

| Key field | Description |
|---|---|
| `lembaga` | Procuring institution |
| `pagu` | Budget ceiling (IDR) |
| `ownerType` | `central`, `provinsi`, or `kabkota` |
| `jenisPengadaan` | Procurement type (goods, construction, services) |
| `potensiPemborosan` | Waste-potential score |
| `tags.isInappropriate` | Anomaly flag: `low`, `med`, `high`, `absurd` |

See `CLAUDE.md` for the full schema.

---

## Run locally

```bash
cd dashboard
npm install
npm run dev
```

Open `http://localhost:5173/sterity/` (the app is base-pathed to `/sterity/` for subdirectory deployment).

### Build for production

```bash
cd dashboard
npm run build
```

Output lands in `dashboard/dist/` — static HTML + JS + CSS + JSON, deployable to any static host. The included `.htaccess` handles SPA fallback for Apache subdirectory hosts.

### Regenerate the aggregated data

Requires the full raw dataset in `inaproc-ds/outputs/` and [uv](https://docs.astral.sh/uv/):

```bash
uv run dashboard/scripts/prepare-data.py
```

Re-writes the JSON files under `dashboard/public/data/`.

---

## Project structure

```
idsterity/
├── dashboard/                       # Vite + Svelte app (the site)
│   ├── public/data/                 # Pre-aggregated JSON (committed)
│   ├── scripts/prepare-data.py      # Raw shards → aggregated JSON
│   ├── src/
│   │   ├── App.svelte               # Page layout, scroll-step state
│   │   ├── DeficitChart.svelte      # Section 2 chart
│   │   ├── GDPChart.svelte          # Section 3 chart
│   │   ├── Podium.svelte            # Section 5 podium (top-5)
│   │   ├── ReversePodium.svelte     # Section 6 podium (flagged-pagu)
│   │   ├── WordPaketCards.svelte    # Section 8 word→paket cards
│   │   └── Modal.svelte             # Mobile word-cards modal
│   └── vite.config.js               # base: '/sterity/'
└── inaproc-ds/outputs/              # Raw dataset (not committed, 3.2 GB)
```

---

## License

Data sourced from [LPSE/SIRUP](https://sirup.lkpp.go.id/) — Indonesia's public procurement system.
