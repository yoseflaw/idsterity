# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""
Reads all JSONL shards and produces public/data/lembaga-totals.json —
top-N institutions ranked by total procurement budget (pagu).
Run: uv run scripts/prepare-data.py
"""
import json
import pathlib
import collections

DATA_DIR = pathlib.Path(__file__).parent.parent.parent / "inaproc-ds" / "outputs"
OUT_FILE = pathlib.Path(__file__).parent.parent / "public" / "data" / "lembaga-totals.json"
TOP_N = 30

totals = collections.defaultdict(int)
counts = collections.defaultdict(int)
owner_types = {}

for path in sorted(DATA_DIR.glob("*.jsonl")):
    for line in path.open():
        r = json.loads(line)
        name = r.get("lembaga") or "Unknown"
        totals[name] += r.get("pagu") or 0
        counts[name] += 1
        if name not in owner_types:
            owner_types[name] = r.get("ownerType") or "unknown"

ranked = sorted(totals.items(), key=lambda x: x[1], reverse=True)[:TOP_N]

result = [
    {
        "rank": i + 1,
        "name": name,
        "total": total,
        "count": counts[name],
        "ownerType": owner_types.get(name, "unknown"),
    }
    for i, (name, total) in enumerate(ranked)
]

OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
OUT_FILE.write_text(json.dumps(result, ensure_ascii=False, indent=2))
print(f"Written {len(result)} records → {OUT_FILE}")
