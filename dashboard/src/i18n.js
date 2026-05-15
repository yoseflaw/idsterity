export const t = {
  id: {
    toggleLabel: "🇺🇸",
    scrollCue: "gulir untuk membedah ↓",
    loading: "memuat...",
    eyebrow: "idsterity · Pengadaan yang Mengada-ada",
    heroLine1: "Berhemat itu berat,",
    heroLine2: "biar kamu saja.",
    sectionStub: "[dalam pengerjaan]",
    stepCounter: (n, total) => `${n} / ${total}`,
    heroPaketLabel: "dalam",
    heroPaketSuffix: "paket pengadaan.",

    // S1
    s1Eyebrow: "Bagian 1: Pada awalnya adalah instruksi",
    s1DisplayLine1: "Pemerintah berjanji efisiensi,",
    s1DisplayLine2: "seperti apa kenyataannya?",
    s1StepHeading: "Mengucap hemat itu mudah, mari kita tengok rekam jejaknya.",
    s1StepBody:
      "Sejak awal 2024, pemerintah telah mengumbar janji pemotongan berbagai biaya tidak yang tidak perlu. Melalui Inpres Nomor 1 Tahun 2025 tentang Efisiensi Belanja, rakyat Indonesia diberi harapan. Sayangnya, kumpulan berita berikut memberi kesan berbeda:",
    s1NewsLinkLabel: "Baca artikel",
    s1Disclaimer: "Tautan menuju kanal berita terkait.",
    s1Link1Label: "Yang terekam dari 95 hari kunjungan Prabowo ke luar negeri",
    s1Link2Label:
      "Mahasiswa Bali Geruduk DPRD, Tolak Pemotongan Anggaran Pendidikan",
    s1Link3Label:
      "Efisiensi Anggaran Ganggu Pelayanan Publik, Pendidikan Hingga Infrastruktur Dasar",
    s1Link4Label: "Saat Nyawa Rakyat Tergilas Efisiensi Anggaran Negara",
    s1Link5Label:
      "Penghematan Anggaran Kementerian dan Lembaga untuk Program Prioritas Prabowo",

    // S2 — APBN Deficit
    s2Eyebrow: "Bagian 2: APBN KITA, bukan APBN SAYA",
    s2StickyHeading: "Defisit anggaran negara",
    s2Step1Heading: "2024: Rp 507,8 T",
    s2Step1Body:
      "Pada tahun 2024, defisit APBN mencapai Rp 507,8 triliun (2,29% dari PDB), bagaimana jadinya setelah gembar-gembor efisiensi?",
    s2Step2Heading: "2025: Rp 695,1 T",
    s2Step2Body:
      "Realisasi APBN 2025: defisit justru melebar ke Rp 695,1 triliun (2,92% dari PDB). Angan-angan penghematan mulai tertiup angin.",
    s2Step3Heading: "Q1 2026: Rp 240 T",
    s2Step3Body:
      "Baru tiga bulan 2026, defisit sudah mencapai Rp 240 triliun. Belanja apa aja sih?",
    s2SourceLabel: "Sumber: Kementerian Keuangan RI",

    // S3 — GDP
    s3Eyebrow: "Bagian 3: Defisit karena apa?",
    s3StickyHeading: "Mungkin pemerintah kita sudah berhemat?",
    s3Step1Heading: "Q1 2025: −1,38%",
    s3Step1Body:
      "Awal 2025, konsumsi pemerintah memang menyusut 1,38% YoY. Ini namanya fase bulan madu.",
    s3Step2Heading: "Q2 2025: +21,05%",
    s3Step2Body:
      "Satu kuartal kemudian, konsumsi pemerintah melonjak drastis 21,05% YoY.",
    s3Step3Heading: "Q3–Q4 2025",
    s3Step3Body:
      "Lanjut lagi Q3 2025: +5,08%. Q4 2025: +4,41%. Secara konsistensi memang patut diapresiasi.",
    s3Step4Heading: "Q1 2026: +21,81%",
    s3Step4Body:
      "Awal 2026, konsumsi pemerintah tumbuh 21,81% YoY. Pemerintah berjanji efisiensi, perlu cek kamus sepertinya definisi kata ini sudah diganti.",
    s3SourceLabel: "Sumber: BPS",

    // S4 — Dataset Overview
    s4Eyebrow: "Bagian 4: Data Pengadaan",
    s4Heading: "Apa yang ada di dataset ini?",
    s4TotalPaguLabel: "Total pagu pengadaan",
    s4RecordCountLabel: "Paket pengadaan",
    s4LabelBreakdownHeading: "Menurut keyakinanan AI",
    s4LabelLow: "Wajar",
    s4LabelMed: "Perlu dicermati",
    s4LabelHigh: "Bermasalah",
    s4LabelAbsurd: "Absurd",
    s4Disclaimer:
      "Label dihasilkan oleh model AI yang sangat amat mungkin salah. Bukan referensi hukum.",

    // S5 — Top Institutions
    s5Eyebrow: "Bagian 5: Sang Juara",
    s5StickyHeading: "5 lembaga dengan anggaran terbesar",
    s5Step1Heading: "Siapa yang belanja paling besar?",
    s5Step1Body:
      "Lima lembaga pemerintah dengan anggaran pengadaan terbesar tahun 2026.",
    s5Step2Heading: "Komposisi label AI",
    s5Step2Body:
      "Warna menunjukkan hasil penilaian AI. Semakin merah, semakin banyak pertanyaan.",
    s5Step3Heading: "Siapa yang paling bermasalah?",
    s5Step3Body:
      "Diurutkan ulang berdasarkan pagu bermasalah — bukan total anggaran. Medali berpindah.",
    s5LegendLow: "Wajar",
    s5LegendMed: "Perlu dicermati",
    s5LegendHigh: "Bermasalah",
    s5LegendAbsurd: "Absurd",

    // S6 — Re-rank
    s6Step1Heading: "Siapa yang paling penuh tanda tanya?",
    s6Step1Body:
      "Jika kita urutkan ulang hanya berdasarkan pagu yang dinilai bermasalah, siapa yang menonjol?",
    s6TransitionLabel: "Mengurutkan ulang…",

    // S7 — Anchor Count-Up
    s7Eyebrow: "Bagian 6: Pesta Seblak",
    // s7StickyHeading is used only as a loading fallback; heading text is derived
    // dynamically from stats.labelPagu.high in App.svelte. Must match constants.json:s7TotalPagu.
    s7StickyHeading: "Rp 10,7 triliun untuk pengadaan bermasalah",
    s7Step0Heading: "Mari berandai...",
    s7Step0Body:
      "Rp 10,7 triliun total anggaran yang dinilai AI bermasalah. Pasti susah bayanginnya, bisa untuk beli...",
    s7KopiLabel: "gelas kopi jago",
    s7SeblakLabel: "mangkok seblak",
    s7TransitionLabel: "Atau, lebih seriusnya...",
    s7Step1Heading: "Atau, bangun ini...",
    s7Step1Body:
      "Dana yang sama bisa membangun ribuan sekolah dasar baru, atau lebih dari seribu puskesmas.",
    s7SDLabel: "sekolah dasar baru",
    s7PuskesmasLabel: "puskesmas baru",
    s7SourcePrefix: "Harga satuan: ",

    // S8 — Word Cloud
    s8Eyebrow: "Bagian 7: Beli apa sih?",
    s8StickyHeading:
      "Pengadaan apa yang paling sering muncul dan dianggap bermasalah?",
    s8Step0Heading: "Kata kunci pengadaan bermasalah",
    s8Step0Body:
      "Ini adalah daftar permintaan yang paling sering muncul dalam nama paket bermasalah. Klik kata untuk melihat contoh paket pengadaan.",
    s8FilterAll: "Semua",
    s8FilterCentral: "Pemerintah Pusat",
    s8FilterDistrict: "Pemerintah Daerah",
    s8FilterInstitution: "Cari lembaga…",
    s8FilterReset: "Reset",
    s8NoResults: "Tidak ada kata ditemukan.",
    s8MobileFallbackNote: "Geser untuk melihat semua kata",

    // S9 — Record Table
    s9ColLembaga: "Lembaga",
    s9ColSatker: "Satker",
    s9ColPagu: "Pagu",
    s9ColPaket: "Nama Paket",
    s9ColReason: "Alasan AI",
    s9TableHeader: (word) => `Paket dengan kata "${word}"`,
    s9RecordCount: (n) => `${n} paket teratas (berdasarkan pagu)`,
    s9FallbackNote:
      "Menampilkan semua lembaga (Filter lembaga hanya berlaku pada kata kunci)",
    s9Close: "Tutup",
    s9Loading: "memuat paket…",
    s9Error: "Gagal memuat data paket. Coba lagi.",

    // Errors
    fetchError: "Gagal memuat data. Coba muat ulang halaman.",
  },
  en: {
    toggleLabel: "🇮🇩",
    scrollCue: "scroll to explore ↓",
    loading: "loading data…",
    eyebrow: "idsterity · Indonesia 2026 Procurement Analysis",
    heroLine1: "Where did the",
    heroLine2: "people's money go?",
    sectionStub: "[section in preparation]",
    stepCounter: (n, total) => `${n} / ${total}`,
    heroPaketLabel: "allocated across",
    heroPaketSuffix: "Indonesian government procurement packages",

    // S1
    s1Eyebrow: "S1 · HOOK",
    s1DisplayLine1: "Follow the money…",
    s1DisplayLine2: "Where did the people's money go?",
    s1StepHeading: "The government promised efficiency.",
    s1StepBody:
      "Since early 2024, government officials have consistently promised spending cuts and efficiency gains. Here are a few headlines that captured those promises.",
    s1NewsLinkLabel: "Read article →",
    s1Disclaimer: "Links to original news sources.",
    s1Link1Label: "Prabowo Targets Rp 306 Trillion Efficiency in 2025 Budget",
    s1Link2Label: "Presidential Directive: Cut Official Travel Budgets",
    s1Link3Label:
      "Finance Minister: State Spending Must Be More Efficient in 2026",
    s1Link4Label: "Government Cuts Subsidies for Fiscal Efficiency",
    s1Link5Label: "Sri Mulyani: Budget Deficit Must Be Kept Tight",

    // S2 — APBN Deficit
    s2Eyebrow: "S2 · APBN 2024–2026",
    s2StickyHeading: "State budget deficit",
    s2Step1Heading: "2024: Rp 507.8 T",
    s2Step1Body:
      "In 2024, the APBN deficit reached Rp 507.8 trillion (2.29% of GDP). So how did the efficiency promises play out?",
    s2Step2Heading: "2025: Rp 695.1 T",
    s2Step2Body:
      "Full-year 2025: the deficit widened to Rp 695.1 trillion (2.92% of GDP). The promised efficiency was nowhere to be found.",
    s2Step3Heading: "Q1 2026: Rp 240 T",
    s2Step3Body:
      "Just three months into 2026, the deficit already stands at Rp 240 trillion. What are they spending on?",
    s2SourceLabel: "Source: Ministry of Finance RI",

    // S3 — GDP
    s3Eyebrow: "S3 · GOVERNMENT CONSUMPTION",
    s3StickyHeading: "Government consumption growth",
    s3Step1Heading: "Q1 2025: −1.38%",
    s3Step1Body:
      "Early 2025, government consumption contracted 1.38% YoY. Tightening on paper.",
    s3Step2Heading: "Q2 2025: +21.05%",
    s3Step2Body:
      "One quarter later, government consumption surged 21.05% YoY. The efficiency was apparently… temporary.",
    s3Step3Heading: "Q3–Q4 2025",
    s3Step3Body:
      "Q3 2025: +5.08%. Q4 2025: +4.41%. Growth continued consistently.",
    s3Step4Heading: "Q1 2026: +21.81%",
    s3Step4Body:
      "Early 2026, government consumption grew 21.81% YoY. Prabowo promised efficiency. BPS data says otherwise.",
    s3SourceLabel: "Source: BPS — Indonesia Economic Growth",

    // S4 — Dataset Overview
    s4Eyebrow: "S4 · DATASET 2026",
    s4Heading: "What's in this dataset?",
    s4TotalPaguLabel: "Total procurement budget",
    s4RecordCountLabel: "Procurement packages",
    s4LabelBreakdownHeading: "AI analysis results",
    s4LabelLow: "Appropriate",
    s4LabelMed: "Needs scrutiny",
    s4LabelHigh: "Inappropriate",
    s4LabelAbsurd: "Absurd",
    s4Disclaimer:
      "Labels generated by AI model. For reference only. Not a legal assessment.",

    // S5 — Top Institutions
    s5Eyebrow: "S5 · TOP INSTITUTIONS",
    s5StickyHeading: "5 institutions by largest budget",
    s5Step1Heading: "Who spent the most?",
    s5Step1Body:
      "The five government institutions with the largest procurement budgets in 2026.",
    s5Step2Heading: "AI label composition",
    s5Step2Body:
      "Colors show AI assessment. More red means more questions.",
    s5Step3Heading: "Who is the most problematic?",
    s5Step3Body:
      "Re-ranked by inappropriate budget — not total spend. Watch the medals move.",
    s5LegendLow: "Appropriate",
    s5LegendMed: "Needs scrutiny",
    s5LegendHigh: "Inappropriate",
    s5LegendAbsurd: "Absurd",

    // S6 — Re-rank
    s6Step1Heading: "Now, rank by the most inappropriate.",
    s6Step1Body:
      "If we re-rank using only the inappropriately flagged budget — who actually stands out the most?",
    s6TransitionLabel: "Re-ranking…",

    // S7 — Anchor Count-Up
    s7Eyebrow: "S7 · REAL NUMBERS",
    // s7StickyHeading is used only as a loading fallback; heading text is derived
    // dynamically from stats.labelPagu.high in App.svelte. Must match constants.json:s7TotalPagu.
    s7StickyHeading: "Rp 10.7 trillion for inappropriate procurement",
    s7Step0Heading: "Imagine this…",
    s7Step0Body:
      "Rp 10.7 trillion — the total budget flagged by AI as inappropriate. That's a large number. But how large?",
    s7KopiLabel: "cups of kopi jago",
    s7SeblakLabel: "portions of seblak",
    s7TransitionLabel: "Or, on a more serious note…",
    s7Step1Heading: "Or, build this instead.",
    s7Step1Body:
      "The same funds could build thousands of new elementary schools — or over a thousand primary health clinics. But they weren't used for that.",
    s7SDLabel: "new elementary schools",
    s7PuskesmasLabel: "new primary health clinics",
    s7SourcePrefix: "Unit price: ",

    // S8 — Word Cloud
    s8Eyebrow: "S8 · KEYWORDS",
    s8StickyHeading: "What were they procuring?",
    s8Step0Heading: "Words from inappropriate procurement",
    s8Step0Body:
      "These are the most frequent words from package names flagged as inappropriate by AI. Click a word to see the matching records.",
    s8FilterAll: "All",
    s8FilterCentral: "Central Gov",
    s8FilterDistrict: "District Gov",
    s8FilterInstitution: "Search institution…",
    s8FilterReset: "Reset",
    s8NoResults: "No words found.",
    s8MobileFallbackNote: "Swipe to see all words",

    // S9 — Record Table
    s9ColLembaga: "Institution",
    s9ColSatker: "Work Unit",
    s9ColPagu: "Budget",
    s9ColPaket: "Package Name",
    s9ColReason: "AI Reason",
    s9TableHeader: (word) => `Packages containing "${word}"`,
    s9RecordCount: (n) => `Top ${n} records (by budget)`,
    s9FallbackNote:
      "Showing all institutions — institution filter applies to cloud only.",
    s9Close: "Close",
    s9Loading: "loading records…",
    s9Error: "Failed to load records. Please try again.",

    // Errors
    fetchError: "Failed to load data. Try refreshing the page.",
  },
};
