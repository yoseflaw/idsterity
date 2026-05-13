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
