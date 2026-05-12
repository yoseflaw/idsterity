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

flagged_count = collections.defaultdict(int)
flagged_pagu  = collections.defaultdict(int)
high_count    = collections.defaultdict(int)
med_count     = collections.defaultdict(int)
total_flagged_count, total_flagged_pagu = 0, 0

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
            high_count[name] += 1
        else:
            med_count[name]  += 1

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
    }
    for i, (name, total) in enumerate(ranked)
]

summary = {
    "totalPagu":     total_pagu,
    "totalRecords":  total_records,
    "flaggedCount":  total_flagged_count,
    "flaggedPagu":   total_flagged_pagu,
    "uniqueLembaga": len(totals),
}

OUT_DIR.mkdir(parents=True, exist_ok=True)
(OUT_DIR / "lembaga-totals.json").write_text(json.dumps(lembaga_totals, ensure_ascii=False, indent=2))
(OUT_DIR / "summary-stats.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2))

print(f"lembaga-totals.json → {len(lembaga_totals)} records")
print(f"summary-stats.json  → {summary}")
