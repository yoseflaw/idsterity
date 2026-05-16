# /// script
# requires-python = ">=3.11"
# dependencies = ["nlp-id"]
# ///
"""
Produces word-frequency JSON files for the word cloud component:
  public/data/wordcloud-all.json       — top-20 words across all high-inappropriate paket names
  public/data/wordcloud-central.json   — top-20 words for central government (ownerType=central)
  public/data/wordcloud-district.json  — top-20 words for regional government (ownerType=provinsi|kabkota)
  public/data/wordcloud-lembaga.json   — keyed object of top-20 words per institution
Run: uv run scripts/word-cloud.py
"""
import json, pathlib, collections, re
from nlp_id.lemmatizer import Lemmatizer
from nlp_id.postag import PosTag

DATA_DIR = pathlib.Path(__file__).parent.parent.parent / "inaproc-ds" / "outputs"
OUT_DIR  = pathlib.Path(__file__).parent.parent / "public" / "data"
TOP_N    = 20

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
    "pelaksanaan", "pelayanan", "pengelolaan", "penyediaan",
    "kantor",
    # v1.1 FEEDBACK item 12 — generic procurement vocabulary that
    # doesn't describe WHAT a paket is for. Lemma forms (tokenizer
    # lemmatizes before stop-word filter); surface variants like
    # "layanan"/"pelayanan", "pimpinan"/"pimpin" are covered by the
    # lemmatizer normalising to roots.
    "sewa", "operasional", "biaya", "dinas", "luar", "eselon",
    "satker", "pimpin", "layanan", "dukungan",
})

_lemmatizer = Lemmatizer()
_tagger = PosTag()

NOUN_TAGS = {"NN", "NNP", "NND"}


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


counts_all      = collections.defaultdict(int)
counts_central  = collections.defaultdict(int)
counts_district = collections.defaultdict(int)
counts_by_lembaga = collections.defaultdict(lambda: collections.defaultdict(int))

for path in sorted(DATA_DIR.glob("*_priority.json")):
    for r in json.load(path.open()):
        if r.get("tags", {}).get("isInappropriate") not in {"high", "absurd"}:
            continue
        lembaga   = r.get("lembaga") or "Unknown"
        owner     = r.get("ownerType") or ""
        words     = tokenize(r.get("paket") or "")
        for w in words:
            counts_all[w] += 1
            if owner == "central":
                counts_central[w] += 1
            elif owner in {"provinsi", "kabkota"}:
                counts_district[w] += 1
            counts_by_lembaga[lembaga][w] += 1

if not counts_all:
    raise SystemExit("No priority records found — fetch dataset first per CLAUDE.md")


def top_n(counter: dict) -> list[dict]:
    return [
        {"word": w, "count": c}
        for w, c in sorted(counter.items(), key=lambda x: x[1], reverse=True)[:TOP_N]
    ]


wordcloud_all      = top_n(counts_all)
wordcloud_central  = top_n(counts_central)
wordcloud_district = top_n(counts_district)
wordcloud_lembaga  = {
    lembaga: top_n(word_counts)
    for lembaga, word_counts in counts_by_lembaga.items()
}

OUT_DIR.mkdir(parents=True, exist_ok=True)
(OUT_DIR / "wordcloud-all.json").write_text(json.dumps(wordcloud_all, ensure_ascii=False, indent=2))
print(f"wordcloud-all.json      → {len(wordcloud_all)} words")
(OUT_DIR / "wordcloud-central.json").write_text(json.dumps(wordcloud_central, ensure_ascii=False, indent=2))
print(f"wordcloud-central.json  → {len(wordcloud_central)} words")
(OUT_DIR / "wordcloud-district.json").write_text(json.dumps(wordcloud_district, ensure_ascii=False, indent=2))
print(f"wordcloud-district.json → {len(wordcloud_district)} words")
(OUT_DIR / "wordcloud-lembaga.json").write_text(json.dumps(wordcloud_lembaga, ensure_ascii=False, indent=2))
print(f"wordcloud-lembaga.json  → {len(wordcloud_lembaga)} institutions")
