# idsterity v2 Phase 1 — Research & Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update both Python data scripts to handle the "absurd" 4th classification tier, improve the word cloud NLP pipeline (nouns only, exclude "kantor"), fix the empty-records bug in word-*.json generation, and update APBN/GDP figures from official sources.

**Architecture:** Two Python scripts are run sequentially: `word-cloud.py` first (produces wordcloud JSON files), then `prepare-data.py` (reads those files + raw JSONL to produce all other static JSON). All ~90 JSON files in `dashboard/public/data/` are outputs — re-generated each run and committed.

**Tech Stack:** Python 3.11+, `uv run`, `nlp_id` (lemmatizer + POS tagger), stdlib `json`/`pathlib`/`collections`. Dataset in `inaproc-ds/outputs/`.

**Dependency note:** Phase 2 UI plan depends on the new `absurdCount`/`absurdPagu` fields this plan adds to `lembaga-totals.json` and the new `labelCounts.absurd`/`labelPagu.absurd` fields in `summary-stats.json`.

---

### Task 1: Add "absurd" tier to `prepare-data.py`

**Files:**
- Modify: `dashboard/scripts/prepare-data.py`

The dataset has 4 labels: `low`, `med`, `high`, `absurd`. The current script treats `absurd` as `low` (falls into the `else` branch). This task adds proper tracking for absurd records.

- [ ] **Step 1: Add absurd defaultdicts alongside the existing ones (after line 44)**

Replace the block starting at line 38 (`flagged_count = collections.defaultdict(int)`) through line 47 (`label_counts = {"low": 0, "med": 0, "high": 0}`) with:

```python
flagged_count = collections.defaultdict(int)
flagged_pagu  = collections.defaultdict(int)
high_count    = collections.defaultdict(int)
med_count     = collections.defaultdict(int)
absurd_count  = collections.defaultdict(int)
high_pagu     = collections.defaultdict(int)
med_pagu      = collections.defaultdict(int)
low_pagu      = collections.defaultdict(int)
absurd_pagu   = collections.defaultdict(int)
total_flagged_count, total_flagged_pagu = 0, 0
label_pagu   = {"low": 0, "med": 0, "high": 0, "absurd": 0}
label_counts = {"low": 0, "med": 0, "high": 0, "absurd": 0}
```

- [ ] **Step 2: Add `absurd` case to the classification if/elif/else block**

Replace the `if level == "high":` block (lines 60–73) with:

```python
        if level == "absurd":
            absurd_count[name]      += 1
            absurd_pagu[name]       += pagu
            label_pagu["absurd"]    += pagu
            label_counts["absurd"]  += 1
        elif level == "high":
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
```

- [ ] **Step 3: Add `absurdCount` and `absurdPagu` to the `lembaga_totals` output dict**

In the `lembaga_totals` list comprehension (the block starting `lembaga_totals = [`), add two new fields after `"medCount"` and `"medPagu"`:

```python
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
        "absurdCount":  absurd_count.get(name, 0),
        "highPagu":     high_pagu.get(name, 0),
        "medPagu":      med_pagu.get(name, 0),
        "absurdPagu":   absurd_pagu.get(name, 0),
        "lowPagu":      low_pagu.get(name, 0),
        "jenisCounts":  dict(jenis_counts[name]),
        "metodeCounts": dict(metode_counts[name]),
        "paguByMonth":  dict(pagu_by_month[name]),
    }
    for i, (name, total) in enumerate(ranked)
]
```

- [ ] **Step 4: Expand the per-word record bucketing filter to include absurd**

Find the line `if r.get("tags", {}).get("isInappropriate") != "high":` in the per-word bucketing section (around line 151) and change it to:

```python
        if r.get("tags", {}).get("isInappropriate") not in {"high", "absurd"}:
```

- [ ] **Step 5: Verify the script is syntactically correct**

```bash
cd /Users/yosef/Projects/idsterity/dashboard
python3 -c "import ast; ast.parse(open('scripts/prepare-data.py').read()); print('syntax OK')"
```

Expected: `syntax OK`

- [ ] **Step 6: Commit**

```bash
git add dashboard/scripts/prepare-data.py
git commit -m "feat(data): add absurd as 4th classification tier in prepare-data.py"
```

---

### Task 2: Investigate the word-records-empty bug

**Files:**
- Read: `dashboard/public/data/word-*.json` (sample check)
- Read: `dashboard/scripts/prepare-data.py`

Before fixing, confirm the actual failure mode. The user reports clicking a word returns "0 paket teratas".

- [ ] **Step 1: Check whether word JSON files are committed and non-empty**

```bash
ls dashboard/public/data/word-*.json | wc -l
```

Expected: ~85+ files. If 0, the files are not committed (skip to Step 3).

- [ ] **Step 2: Inspect a sample word file**

```bash
python3 -c "
import json, pathlib, glob
files = sorted(glob.glob('dashboard/public/data/word-*.json'))
print(f'Total word files: {len(files)}')
for f in files[:3]:
    data = json.loads(open(f).read())
    print(f'{f}: {len(data)} records')
"
```

Expected: each file has 0–20 records. If all have 0 records, the matching logic is broken.

- [ ] **Step 3: Check whether files are gitignored**

```bash
git check-ignore -v dashboard/public/data/word-laptop-all.json 2>/dev/null || echo "not ignored"
```

Expected: `not ignored`. If ignored, they need to be committed or served another way.

- [ ] **Step 4: Identify which words produce empty files**

```bash
python3 -c "
import json, glob
empties = [f for f in glob.glob('dashboard/public/data/word-*-all.json')
           if len(json.loads(open(f).read())) == 0]
print('Empty files:', len(empties))
print('Examples:', empties[:5])
"
```

Note which words have empty files. If most/all are empty, the root cause is the lemmatization mismatch (Task 3).

---

### Task 3: Fix the word-records-empty bug

**Files:**
- Modify: `dashboard/scripts/prepare-data.py`

Root cause: `word-cloud.py` produces lemmatized words (e.g., "komputer" from "komputerisasi"), but `prepare-data.py` matches by substring (`if w in paket_lower`). Since a lemmatized root is typically a prefix substring of its inflected form, this usually works — but fails when the lemmatizer produces a form that is NOT a substring of any original paket (e.g., irregular lemmatization).

Fix: in addition to substring matching, also tokenize the paket using the same `tokenize()` logic from `word-cloud.py` and check set membership.

- [ ] **Step 1: Copy the tokenize logic into prepare-data.py**

At the top of `prepare-data.py`, add the import and the tokenizer (after the existing `import json, pathlib, collections` line):

```python
import json, pathlib, collections, re
from nlp_id.lemmatizer import Lemmatizer

_lemmatizer = Lemmatizer()

STOPWORDS = frozenset({
    "pengadaan", "jasa", "barang", "pekerjaan", "konstruksi",
    "kegiatan", "tahun", "paket", "dll", "dan", "yang", "untuk",
    "di", "ke", "dari", "dalam", "dengan", "atau", "adalah", "pada",
    "anggaran", "provinsi", "kabupaten", "kota", "kementerian",
    "belanja", "bahan", "alat", "the", "of", "and", "in", "to",
    "a", "an", "it", "is", "be", "as", "at", "so", "we", "he",
    "but", "are", "by", "not", "this", "had", "his", "how",
    "i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x",
    "no", "nomor", "serta", "juga", "atas", "per", "bagi", "agar",
    "lain", "oleh", "akan", "dapat", "hal", "melaksanakan",
    "pelaksanaan", "pelayanan", "pengelolaan", "penyediaan", "kantor",
})

def _tokenize(paket: str) -> set[str]:
    tokens = re.findall(r"[a-z]+", paket.lower())
    tokens = [t for t in tokens if len(t) >= 3 and t not in STOPWORDS]
    tokens = [_lemmatizer.lemmatize(t) for t in tokens]
    return {t for t in tokens if len(t) >= 3 and t not in STOPWORDS}
```

Note: `prepare-data.py` needs `nlp_id` added to its inline dependency declaration:

```python
# /// script
# requires-python = ">=3.11"
# dependencies = ["nlp-id"]
# ///
```

- [ ] **Step 2: Change the matching logic in the per-word bucketing section**

Replace the per-word matching logic (the inner loop that checks `if w in paket_lower`) with token-set matching:

```python
for r in priority_records:
    if r.get("tags", {}).get("isInappropriate") not in {"high", "absurd"}:
        continue
    paket_tokens = _tokenize(r.get("paket") or "")
    owner        = r.get("ownerType") or "unknown"
    rec = {
        "lembaga":             r.get("lembaga") or "Unknown",
        "satker":              r.get("satker") or "",
        "pagu":                r.get("pagu") or 0,
        "paket":               r.get("paket") or "",
        "inappropriateReason": r.get("tags", {}).get("inappropriateReason") or "",
    }
    for w in ALL_WORDS:
        if w in paket_tokens:
            records_by_word_filter[w]["all"].append(rec)
            if owner == "central":
                records_by_word_filter[w]["central"].append(rec)
            elif owner in ("provinsi", "kabkota"):
                records_by_word_filter[w]["district"].append(rec)
```

- [ ] **Step 3: Verify syntax**

```bash
cd /Users/yosef/Projects/idsterity/dashboard
python3 -c "import ast; ast.parse(open('scripts/prepare-data.py').read()); print('syntax OK')"
```

Expected: `syntax OK`

- [ ] **Step 4: Commit**

```bash
git add dashboard/scripts/prepare-data.py
git commit -m "fix(data): use token-set matching for word-record bucketing to fix empty results"
```

---

### Task 4: Update `word-cloud.py` — absurd filter, "kantor" stopword, noun-only POS filter

**Files:**
- Modify: `dashboard/scripts/word-cloud.py`

- [ ] **Step 1: Add "kantor" to STOPWORDS**

In the `STOPWORDS` frozenset (around line 20), add `"kantor"` to the set. The set should now include `"kantor"` as one of the entries.

- [ ] **Step 2: Expand the isInappropriate filter to include absurd**

Find line 53: `if r.get("tags", {}).get("isInappropriate") != "high":` and change to:

```python
        if r.get("tags", {}).get("isInappropriate") not in {"high", "absurd"}:
```

- [ ] **Step 3: Add POS tagger import and noun filter to tokenize()**

Add the POS tagger import after the existing `from nlp_id.lemmatizer import Lemmatizer`:

```python
from nlp_id.postag import POS_Tagger
```

And update the `dependencies` declaration:
```python
# dependencies = ["nlp-id"]
```
(nlp-id already includes POS tagger — no additional package needed)

Initialize the tagger after `_lemmatizer = Lemmatizer()`:
```python
_tagger = POS_Tagger()

NOUN_TAGS = {"NN", "NNP", "NND"}
```

Update the `tokenize()` function to filter by POS after lemmatization:

```python
def tokenize(paket: str) -> list[str]:
    tokens = re.findall(r"[a-z]+", paket.lower())
    tokens = [t for t in tokens if len(t) >= 3]
    tokens = [t for t in tokens if t not in STOPWORDS]
    tokens = [_lemmatizer.lemmatize(t) for t in tokens]
    tokens = [t for t in tokens if t not in STOPWORDS and len(t) >= 3]
    if not tokens:
        return []
    tagged = _tagger.get_pos_tag(" ".join(tokens))
    return [word for word, tag in tagged if tag in NOUN_TAGS]
```

- [ ] **Step 4: Verify POS tagger API is correct**

```bash
cd /Users/yosef/Projects/idsterity/dashboard
uv run python3 -c "
from nlp_id.postag import POS_Tagger
t = POS_Tagger()
result = t.get_pos_tag('laptop komputer meja kursi')
print(result)
"
```

Expected: a list of `[word, tag]` pairs like `[['laptop', 'NN'], ['komputer', 'NN'], ...]`. If the API is different (returns tuples, or different method name), adjust accordingly and update the `tokenize()` function.

- [ ] **Step 5: Verify syntax**

```bash
python3 -c "import ast; ast.parse(open('scripts/word-cloud.py').read()); print('syntax OK')"
```

Expected: `syntax OK`

- [ ] **Step 6: Commit**

```bash
git add dashboard/scripts/word-cloud.py
git commit -m "feat(data): word-cloud — nouns only, exclude kantor, include absurd tier"
```

---

### Task 5: Re-research APBN and GDP numbers, update constants.json

**Files:**
- Modify: `dashboard/public/data/constants.json`

The user confirmed the current numbers are wrong. Re-fetch from the official sources listed in `constants.json`.

- [ ] **Step 1: Fetch the APBN October 2024 PDF and extract the deficit figure**

Open the URL in `constants.json` under `sources[field="apbn.deficit.oct2024"]`. Look for the cumulative deficit (realisasi defisit) through October 2024 in the APBN KiTa report. The number should be a negative IDR figure (deficit). Update `constants.json`:

```json
"apbn": {
  "deficit": {
    "oct2024": <correct_value_in_IDR>,
    "fy2025": <correct_value_in_IDR>,
    "q1_2026": <correct_value_in_IDR>
  }
}
```

Values are in IDR (not trillions). Example: `-309200000000000` = −Rp 309.2T.

- [ ] **Step 2: Fetch the APBN full-year 2025 realization and Q1 2026 figures**

Fetch sources for `apbn.deficit.fy2025` and `apbn.deficit.q1_2026`. Extract the respective deficit realizations. Update the same `constants.json` block.

- [ ] **Step 3: Fetch the GDP government consumption figures from BPS**

Fetch the 5 BPS sources (Q1 2025 through Q1 2026). Extract the `Konsumsi Pemerintah` YoY contribution figure (%) from each release. Update `constants.json`:

```json
"gdp": {
  "konsumsi_pemerintah": {
    "q1_2025": <correct_%>,
    "q2_2025": <correct_%>,
    "q3_2025": <correct_%>,
    "q4_2025": <correct_%>,
    "q1_2026": <correct_%>
  }
}
```

- [ ] **Step 4: Verify the JSON is valid**

```bash
python3 -c "import json; json.load(open('dashboard/public/data/constants.json')); print('valid JSON')"
```

Expected: `valid JSON`

- [ ] **Step 5: Commit**

```bash
git add dashboard/public/data/constants.json
git commit -m "fix(data): update APBN deficit and GDP gov consumption figures from official sources"
```

---

### Task 6: Rerun both scripts and commit regenerated data

**Files:**
- Re-generated: all files in `dashboard/public/data/`

Scripts must run in order: word-cloud.py first, then prepare-data.py (which reads the wordcloud files).

- [ ] **Step 1: Run word-cloud.py**

```bash
cd /Users/yosef/Projects/idsterity/dashboard
uv run scripts/word-cloud.py
```

Expected output (4 lines):
```
wordcloud-all.json      → 20 words
wordcloud-central.json  → 20 words
wordcloud-district.json → 20 words
wordcloud-lembaga.json  → NNN institutions
```

If it exits with an error, fix the error before continuing.

- [ ] **Step 2: Run prepare-data.py**

```bash
uv run scripts/prepare-data.py
```

Expected output:
```
lembaga-totals.json → 30 records
summary-stats.json  → {...}
word-*-*.json → NN words × 3 filters = NNN files
```

- [ ] **Step 3: Verify absurd fields exist in output**

```bash
python3 -c "
import json
stats = json.load(open('dashboard/public/data/summary-stats.json'))
print('labelCounts:', stats['labelCounts'])
print('labelPagu keys:', list(stats['labelPagu'].keys()))
lembaga = json.load(open('dashboard/public/data/lembaga-totals.json'))
print('First institution absurdCount:', lembaga[0].get('absurdCount'))
print('First institution absurdPagu:', lembaga[0].get('absurdPagu'))
"
```

Expected: `labelCounts` includes `absurd` key. `absurdCount` and `absurdPagu` present on first institution.

- [ ] **Step 4: Verify word JSON files are non-empty**

```bash
python3 -c "
import json, glob
files = glob.glob('dashboard/public/data/word-*-all.json')
empties = [f for f in files if len(json.loads(open(f).read())) == 0]
print(f'Total: {len(files)}, Empty: {len(empties)}')
if empties: print('Empty examples:', empties[:3])
"
```

Expected: Empty count should be 0 or very few (some rare words legitimately have no records).

- [ ] **Step 5: Commit regenerated data files**

```bash
git add dashboard/public/data/
git commit -m "data(regen): rerun scripts with absurd tier, noun filter, corrected APBN numbers"
```
