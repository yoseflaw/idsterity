# External Integrations

**Analysis Date:** 2026-05-13

## APIs & External Services

**None — this is a fully static site.** All data is pre-processed offline and baked into static JSON
files. There are no runtime API calls to external services.

## Data Storage

**Primary Dataset (local, not committed):**
- Type: JSONL + JSON + CSV flat files partitioned into ~123 shards
- Location: `inaproc-ds/outputs/` (3.2 GB, gitignored)
- Source: Indonesia's SIRUP/LPSE public procurement system (2026)
- Download: Azure Blob Storage (public read URL in CLAUDE.md)
- Processed by: `dashboard/scripts/prepare-data.py` (offline, one-time)

**Served Data (committed, static):**
- `dashboard/public/data/lembaga-totals.json` — top 30 institutions (30 records)
- `dashboard/public/data/summary-stats.json` — 5-field aggregate summary
- These are the only files the running app reads at runtime (via `fetch()`)

**Databases:** None — no database, no ORM, no connection strings.

**File Storage:** Local filesystem only (during data prep). Output is committed static JSON.

**Caching:** None — browser HTTP caching applies to static assets naturally.

## Authentication & Identity

**Auth Provider:** None — fully public, unauthenticated site. No login, no sessions.

## Monitoring & Observability

**Error Tracking:** None detected.

**Analytics:** None detected (no GA, Plausible, Fathom, or similar scripts in `index.html`).

**Logs:** Python data script prints summary to stdout only (`print(f"lembaga-totals.json → {len}...")`).

## CDN & External Assets

**Google Fonts CDN** — the only external dependency at runtime:
- Endpoint: `https://fonts.googleapis.com` (preconnect declared)
- Endpoint: `https://fonts.gstatic.com` (preconnect declared, crossorigin)
- Loaded in: `dashboard/index.html` lines 7–9
- Families: `Libre Baskerville`, `Source Serif 4`, `JetBrains Mono`
- Impact: page render depends on Google Fonts availability; blocking if offline

## CI/CD & Deployment

**Hosting:** General static hosting (per SPEC.md). No platform-specific config committed.

**CI Pipeline:** None detected — no `.github/workflows/`, no Netlify/Vercel config files.

**Build process (manual):**
```bash
# 1. Data prep (requires full dataset in inaproc-ds/outputs/)
cd dashboard && python3 scripts/prepare-data.py

# 2. Production build
npm run build
# Output: dashboard/dist/ (index.html + assets/ + data/)
```

## Webhooks & Callbacks

**Incoming:** None.

**Outgoing:** None.

## External References in Source

The following external URLs are referenced as hyperlinks in content (not as API calls):

| URL | Location | Purpose |
|-----|----------|---------|
| `https://pudding.cool/2023/07/songwriters/` | `App.svelte` line 182 | Attribution/inspiration link |
| `https://tirto.id/defisit-apbn-tembus-093-terhadap-pdb-di-maret-2026-hvn8` | `.planning/research/questions.md` | Research source (not yet in app) |
| `https://www.bps.go.id/...` | `.planning/research/questions.md` | Research source (not yet in app) |
| `https://nemesis.assai.id/` | `SPEC.md` | Reference/inspiration site |

## Environment Configuration

**Required env vars:** None — zero environment variables needed for either development or production.

**Secrets location:** None — no secrets, API keys, or credentials in use.

---

*Integration audit: 2026-05-13*
