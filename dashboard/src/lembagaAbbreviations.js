// dashboard/src/lembagaAbbreviations.js
//
// Map full lembaga names to recognized Indonesian abbreviations.
// Used wherever a lembaga renders in a height-constrained UI (podium,
// reverse podium, word-paket cards). Truncation with ellipsis is the
// fallback when no abbreviation is known.

export const LEMBAGA_ABBR = {
  // Kementerian — canonical forms
  "Kementerian Pertahanan": "Kemhan",
  "Kementerian Pekerjaan Umum dan Perumahan Rakyat": "PUPR",
  "Kementerian Pekerjaan Umum": "PU",
  "Kementerian  Pekerjaan Umum": "PU", // double-space variant present in data
  "Kementerian Kesehatan": "Kemenkes",
  "Kementerian Pertanian": "Kementan",
  "Kementerian Pendidikan dan Kebudayaan": "Kemendikbud",
  "Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi": "Kemendikbudristek",
  "Kementerian Pendidikan Dasar dan Menengah": "Kemendikdasmen",
  "Kementerian Pendidikan Tinggi, Sains, dan Teknologi": "Kemendiktisaintek",
  "Kementerian Agama": "Kemenag",
  "Kementerian Keuangan": "Kemenkeu",
  "Kementerian Dalam Negeri": "Kemendagri",
  "Kementerian Luar Negeri": "Kemenlu",
  "Kementerian Hukum dan Hak Asasi Manusia": "Kemenkumham",
  "Kementerian Sosial": "Kemensos",
  "Kementerian Perhubungan": "Kemenhub",
  "Kementerian Komunikasi dan Informatika": "Kominfo",
  "Kementerian Komunikasi dan Digital": "Komdigi",
  "Kementerian Riset dan Teknologi": "Kemristek",
  "Kementerian Lingkungan Hidup dan Kehutanan": "KLHK",
  "Kementerian Energi dan Sumber Daya Mineral": "ESDM",
  "Kementerian Energi Dan Sumber Daya Mineral": "ESDM", // capital-D variant
  "Kementerian Perdagangan": "Kemendag",
  "Kementerian Perindustrian": "Kemenperin",
  "Kementerian Tenaga Kerja": "Kemnaker",
  "Kementerian Ketenagakerjaan": "Kemnaker",
  "Kementerian Pariwisata dan Ekonomi Kreatif": "Kemenparekraf",
  "Kementerian Kelautan dan Perikanan": "KKP",
  "Kementerian Kelautan Dan Perikanan": "KKP", // capital-D variant
  "Kementerian Pemuda dan Olahraga": "Kemenpora",
  "Kementerian Pemuda Dan Olah Raga": "Kemenpora", // data variant
  "Kementerian Desa, Pembangunan Daerah Tertinggal, dan Transmigrasi": "Kemendes",
  "Kementerian Agraria dan Tata Ruang/BPN": "ATR/BPN",
  "Kementerian Imigrasi dan Pemasyarakatan": "Kemenimipas",

  // Provinsi
  "Provinsi DKI Jakarta": "DKI Jakarta",
  "Provinsi Jawa Barat": "Jawa Barat",
  "Provinsi Jawa Timur": "Jawa Timur",
  "Provinsi Jawa Tengah": "Jawa Tengah",
  "Provinsi Sumatera Utara": "Sumut",
  "Provinsi Sumatera Barat": "Sumbar",
  "Provinsi Sumatera Selatan": "Sumsel",
  "Provinsi Kalimantan Timur": "Kaltim",
  "Provinsi Kalimantan Selatan": "Kalsel",
  "Provinsi Kalimantan Tengah": "Kalteng",
  "Provinsi Sulawesi Selatan": "Sulsel",
  "Provinsi Sulawesi Utara": "Sulut",
  "Provinsi Sulawesi Tenggara": "Sultra",
  "Provinsi Bali": "Bali",
  "Provinsi Banten": "Banten",
  "Provinsi Lampung": "Lampung",
  "Provinsi Papua Tengah": "Papua Tengah",
  "Provinsi Yogyakarta": "DIY",
  "Daerah Istimewa Yogyakarta": "DIY",

  // Kab/Kota (most are already short; include the longer ones)
  "Kab. Kutai Kartanegara": "Kab. Kukar",
  "Kab. Bojonegoro": "Kab. Bojonegoro",

  // Lembaga negara, badan, dan instansi
  "Kepolisian Negara Republik Indonesia": "Polri",
  "Tentara Nasional Indonesia": "TNI",
  "Mabes TNI": "TNI",
  "Mabes Polri": "Polri",
  "Dewan Perwakilan Rakyat": "DPR",
  "Badan Pusat Statistik": "BPS",
  "Badan Pemeriksa Keuangan": "BPK",
  "Badan Kepegawaian Negara": "BKN",
  "Badan Intelijen Negara": "BIN",
  "Badan Narkotika Nasional": "BNN",
  "Badan Informasi Geospasial": "BIG",
  "Badan Pangan Nasional": "Bapanas",
  "Badan Riset dan Inovasi Nasional": "BRIN",
  "Mahkamah Agung": "MA",
  "Mahkamah Konstitusi": "MK",
  "Kejaksaan Agung": "Kejagung",
  "Kejaksaan Republik Indonesia": "Kejaksaan RI",
  "Komisi Pemberantasan Korupsi": "KPK",
  "Komisi Yudisial": "KY",
  "Lembaga Ilmu Pengetahuan Indonesia": "LIPI",
  "Lembaga Administrasi Negara": "LAN",
  "Arsip Nasional Republik Indonesia": "ANRI",
  "Otoritas Jasa Keuangan": "OJK",
  "Bank Indonesia": "BI",
  "Otorita Ibu Kota Nusantara (OIKN)": "OIKN",
};

/**
 * Return a short, display-friendly form of a lembaga name.
 * Falls back to ellipsis-truncation when no mapping exists.
 */
export function abbreviateLembaga(name) {
  if (!name) return "";
  if (LEMBAGA_ABBR[name]) return LEMBAGA_ABBR[name];
  // Common patterns we can compress without losing meaning:
  // "Kab. X" stays short already; "Kota X" stays short; just truncate otherwise.
  if (name.length <= 16) return name;
  return name.slice(0, 15) + "…";
}
