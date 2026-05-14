# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""
Produces two data files for the dashboard:
  public/data/lembaga-totals.json  — top-30 institutions with flag counts
  public/data/summary-stats.json   — overall dataset statistics
Run: uv run scripts/prepare-data.py
"""
import json, pathlib, collections

DATA_DIR = pathlib.Path(__file__).parent.parent.parent / "inaproc-ds" / "outputs"
OUT_DIR  = pathlib.Path(__file__).parent.parent / "public" / "data"
TOP_N    = 30

totals, counts, owner_types = collections.defaultdict(int), collections.defaultdict(int), {}
total_pagu, total_records = 0, 0
jenis_counts  = collections.defaultdict(lambda: collections.defaultdict(int))
metode_counts = collections.defaultdict(lambda: collections.defaultdict(int))
pagu_by_month = collections.defaultdict(lambda: collections.defaultdict(int))

for path in sorted(DATA_DIR.glob("*.jsonl")):
    for line in path.open():
        r = json.loads(line)
        name = r.get("lembaga") or "Unknown"
        pagu = r.get("pagu") or 0
        totals[name]  += pagu
        counts[name]  += 1
        total_pagu    += pagu
        total_records += 1
        if name not in owner_types:
            owner_types[name] = r.get("ownerType") or "unknown"
        jenis_counts[name][r.get("jenisPengadaan") or "Unknown"] += 1
        metode_counts[name][r.get("metode") or "Unknown"]        += 1
        pagu_by_month[name][r.get("pemilihanDate") or "Unknown"] += pagu

flagged_count = collections.defaultdict(int)
flagged_pagu  = collections.defaultdict(int)
high_count    = collections.defaultdict(int)
med_count     = collections.defaultdict(int)
high_pagu     = collections.defaultdict(int)
med_pagu      = collections.defaultdict(int)
low_pagu      = collections.defaultdict(int)
total_flagged_count, total_flagged_pagu = 0, 0
label_pagu   = {"low": 0, "med": 0, "high": 0}
label_counts = {"low": 0, "med": 0, "high": 0}

for path in sorted(DATA_DIR.glob("*_priority.json")):
    for r in json.load(path.open()):
        name  = r.get("lembaga") or "Unknown"
        pagu  = r.get("pagu") or 0
        level = r.get("tags", {}).get("isInappropriate", "")
        flagged_count[name] += 1
        flagged_pagu[name]  += pagu
        total_flagged_count += 1
        total_flagged_pagu  += pagu
        if level == "high":
            high_count[name]     += 1
            high_pagu[name]      += pagu
            label_pagu["high"]   += pagu
            label_counts["high"] += 1
        elif level == "med":
            med_count[name]     += 1
            med_pagu[name]      += pagu
            label_pagu["med"]   += pagu
            label_counts["med"] += 1
        else:
            low_pagu[name]      += pagu
            label_pagu["low"]   += pagu
            label_counts["low"] += 1

unflagged_pagu   = total_pagu   - sum(label_pagu.values())
unflagged_counts = total_records - sum(label_counts.values())

if unflagged_pagu < 0:
    print(f"WARNING: unflagged_pagu is negative ({unflagged_pagu}); check shard consistency")
if unflagged_counts < 0:
    print(f"WARNING: unflagged_counts is negative ({unflagged_counts}); check shard consistency")

label_pagu["unflagged"]   = max(unflagged_pagu, 0)
label_counts["unflagged"] = max(unflagged_counts, 0)

ranked = sorted(totals.items(), key=lambda x: x[1], reverse=True)[:TOP_N]

lembaga_totals = [
    {
        "rank":         i + 1,
        "name":         name,
        "total":        total,
        "count":        counts[name],
        "ownerType":    owner_types.get(name, "unknown"),
        "flaggedCount": flagged_count.get(name, 0),
        "flaggedPagu":  flagged_pagu.get(name, 0),
        "highCount":    high_count.get(name, 0),
        "medCount":     med_count.get(name, 0),
        "highPagu":     high_pagu.get(name, 0),
        "medPagu":      med_pagu.get(name, 0),
        "lowPagu":      low_pagu.get(name, 0),
        "jenisCounts":  dict(jenis_counts[name]),
        "metodeCounts": dict(metode_counts[name]),
        "paguByMonth":  dict(pagu_by_month[name]),
    }
    for i, (name, total) in enumerate(ranked)
]

summary = {
    "totalPagu":     total_pagu,
    "totalRecords":  total_records,
    "flaggedCount":  total_flagged_count,
    "flaggedPagu":   total_flagged_pagu,
    "uniqueLembaga": len(totals),
    "labelPagu":     label_pagu,
    "labelCounts":   label_counts,
    "unflaggedPagu": label_pagu["unflagged"],
}

OUT_DIR.mkdir(parents=True, exist_ok=True)
(OUT_DIR / "lembaga-totals.json").write_text(json.dumps(lembaga_totals, ensure_ascii=False, indent=2))
(OUT_DIR / "summary-stats.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2))

print(f"lembaga-totals.json → {len(lembaga_totals)} records")
print(f"summary-stats.json  → {summary}")

# ── Per-word record bucketing (SEC-09 data layer) ────────────────────────────
# Read the three wordcloud files to discover the union of indexed words.
_wc_all      = OUT_DIR / "wordcloud-all.json"
_wc_central  = OUT_DIR / "wordcloud-central.json"
_wc_district = OUT_DIR / "wordcloud-district.json"
for _wc_path in (_wc_all, _wc_central, _wc_district):
    if not _wc_path.exists():
        raise FileNotFoundError(
            f"Required wordcloud file not found: {_wc_path}. "
            "Run word-cloud.py first or ensure the wordcloud JSON files are committed."
        )

ALL_WORDS = sorted({
    entry["word"]
    for _wc_path in (_wc_all, _wc_central, _wc_district)
    for entry in json.loads(_wc_path.read_text())
})

PER_WORD_TOP = 20

records_by_word_filter = {w: {"all": [], "central": [], "district": []} for w in ALL_WORDS}

for path in sorted(DATA_DIR.glob("*_priority.json")):
    for r in json.load(path.open()):
        if r.get("tags", {}).get("isInappropriate") != "high":
            continue
        paket_lower = (r.get("paket") or "").lower()
        owner       = r.get("ownerType") or "unknown"
        rec = {
            "lembaga":             r.get("lembaga") or "Unknown",
            "satker":              r.get("satker") or "",
            "pagu":                r.get("pagu") or 0,
            "paket":               r.get("paket") or "",
            "inappropriateReason": r.get("tags", {}).get("inappropriateReason") or "",
        }
        for w in ALL_WORDS:
            if w in paket_lower:
                records_by_word_filter[w]["all"].append(rec)
                if owner == "central":
                    records_by_word_filter[w]["central"].append(rec)
                elif owner in ("provinsi", "kabkota"):
                    records_by_word_filter[w]["district"].append(rec)

for w in ALL_WORDS:
    for filt in ("all", "central", "district"):
        top = sorted(records_by_word_filter[w][filt], key=lambda x: x["pagu"], reverse=True)[:PER_WORD_TOP]
        (OUT_DIR / f"word-{w}-{filt}.json").write_text(json.dumps(top, ensure_ascii=False, indent=2))

print(f"word-*-*.json → {len(ALL_WORDS)} words × 3 filters = {len(ALL_WORDS) * 3} files")
