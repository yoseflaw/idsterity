<script>
    import { onMount, onDestroy } from "svelte";
    import scrollama from "scrollama";
    import DeficitChart from "./DeficitChart.svelte";
    import GDPChart from "./GDPChart.svelte";
    import Podium from "./Podium.svelte";
    import ReversePodium from "./ReversePodium.svelte";
    import Modal from "./Modal.svelte";
    import WordPaketCards from "./WordPaketCards.svelte";

    let stats = $state(null);
    let lembaga = $state([]);
    let lembagaFlagged = $state([]);
    let constants = $state(null);

    let activeStepS1 = $state(0);
    let activeStepS2 = $state(0);
    let activeStepS3 = $state(0);
    let activeStepS5 = $state(0);
    let activeStepS6 = $state(0);
    let fetchError = $state(null);

    let activeStepS7 = $state(0);
    let kopiCount = $state(0);
    let seblakCount = $state(0);
    let sdCount = $state(0);
    let puskesmasCount = $state(0);
    let s7ShowTransition = $state(false);
    let s7HasEntered = $state(false);
    let s7AnchorObserver = null;
    let s7Timers = [];

    let activeStepS8 = $state(0);
    let wordsAll = $state([]);
    let wordsCentral = $state([]);
    let wordsDistrict = $state([]);
    let runtimeStopWords = $state([]);
    let wordFilter = $state("all"); // 'all' | 'central' | 'district'
    let selectedWord = $state(null);
    let selectedRecords = $state([]);
    let wordRecordsLoading = $state(false);
    let wordRecordsError = $state(null);
    let modalOpen = $state(false);
    let filterError = $state(null);
    let isNarrow = $state(false);
    let mqNarrow;
    let wordCache = new Map();

    let currentWords = $derived(
        wordFilter === "central"
            ? wordsCentral
            : wordFilter === "district"
              ? wordsDistrict
              : wordsAll,
    );

    let visibleWords = $derived(
        currentWords.filter(
            (w) =>
                !runtimeStopWords.includes(
                    (w.word || w.text || "").toLowerCase(),
                ),
        ),
    );

    // Mobile: dim sticky chart when a text step card is scrolled over it
    let s1ChartDimmed = $derived(activeStepS1 > 0);
    let s2ChartDimmed = $derived(activeStepS2 > 0);
    let s3ChartDimmed = $derived(activeStepS3 > 0);
    let s5ChartDimmed = $derived(activeStepS5 > 0);
    let s6ChartDimmed = $derived(activeStepS6 > 0);
    let s7ChartDimmed = $derived(activeStepS7 > 0);
    let s8ChartDimmed = $derived(activeStepS8 > 0);


    function chipSize(idx, total) {
        // Largest chip = 1.5rem, smallest = 0.85rem; index-based since lists are sorted desc
        if (total <= 1) return 1.2;
        const t = 1 - idx / (total - 1);
        return 0.85 + t * 0.65;
    }

    function setWordFilter(filter) {
        wordFilter = filter;
        filterError = null;
        if (selectedWord) selectWord(selectedWord);
    }

    async function selectWord(word) {
        selectedWord = word;
        selectedRecords = [];
        wordRecordsError = null;
        const cacheKey = `${word}-${wordFilter}`;
        if (wordCache.has(cacheKey)) {
            selectedRecords = wordCache.get(cacheKey);
            if (typeof window !== "undefined" && window.innerWidth < 720)
                modalOpen = true;
            return;
        }
        wordRecordsLoading = true;
        const requestedWord = word;
        const requestedFilter = wordFilter;
        try {
            const data = await safeFetch(
                import.meta.env.BASE_URL +
                    `data/word-${word}-${wordFilter}.json`,
            );
            if (
                selectedWord !== requestedWord ||
                wordFilter !== requestedFilter
            )
                return;
            wordCache.set(cacheKey, data);
            selectedRecords = data;
        } catch (err) {
            if (selectedWord !== requestedWord) return;
            wordRecordsError = "Gagal memuat data paket. Coba lagi.";
            selectedRecords = [];
        } finally {
            if (selectedWord === requestedWord) wordRecordsLoading = false;
        }
        if (typeof window !== "undefined" && window.innerWidth < 720)
            modalOpen = true;
    }

    function closeModal() {
        modalOpen = false;
    }

    let onNarrowChange;

    let scrollers = [];
    const onResize = () => scrollers.forEach((s) => s.resize());

    const safeFetch = (url) =>
        fetch(url).then((r) => {
            if (!r.ok) throw new Error(`${r.status} ${r.statusText} — ${url}`);
            return r.json();
        });

    onMount(async () => {
        try {
            const base = import.meta.env.BASE_URL;
            const [s, d, c, wAll, wCentral, wDistrict, wOverrides, df] =
                await Promise.all([
                    safeFetch(base + "data/summary-stats.json"),
                    safeFetch(base + "data/lembaga-totals.json"),
                    safeFetch(base + "data/constants.json"),
                    safeFetch(base + "data/wordcloud-all.json"),
                    safeFetch(base + "data/wordcloud-central.json"),
                    safeFetch(base + "data/wordcloud-district.json"),
                    fetch(base + "data/stop-words-overrides.json")
                        .then((r) => (r.ok ? r.json() : []))
                        .catch(() => []),
                    safeFetch(base + "data/lembaga-flagged-totals.json"),
                ]);
            stats = s;
            lembaga = d;
            constants = c;
            wordsAll = wAll;
            wordsCentral = wCentral;
            wordsDistrict = wDistrict;
            runtimeStopWords = (wOverrides || []).map((w) =>
                String(w).toLowerCase(),
            );
            lembagaFlagged = df;
        } catch (err) {
            fetchError = "Gagal memuat data. Coba muat ulang halaman.";
        }

        requestAnimationFrame(() => {
            // Use a lower offset on narrow viewports so step cards that fill the
            // entire screen (min-height: 100vh) still trigger the IntersectionObserver.
            // offset: 0.5 means 50% of the step must be visible — impossible when the
            // step fills the full viewport height on a small mobile screen.
            const isMobile = window.matchMedia("(max-width: 800px)").matches;
            const offset = isMobile ? 0.1 : 0.5;

            const makeScroller = (sectionAttr, onEnter, offsetOverride) => {
                const s = scrollama();
                s.setup({
                    step: `[data-section="${sectionAttr}"] [data-step]`,
                    offset: offsetOverride ?? offset,
                    progress: false,
                }).onStepEnter(({ index }) => onEnter(index));
                return s;
            };
            scrollers = [
                makeScroller("s1", (i) => {
                    activeStepS1 = i;
                }),
                makeScroller("s2", (i) => {
                    activeStepS2 = i;
                }),
                makeScroller("s3", (i) => {
                    activeStepS3 = i;
                }),
                makeScroller("s5", (i) => {
                    activeStepS5 = i;
                }),
                makeScroller("s6", (i) => {
                    activeStepS6 = i;
                }),
                makeScroller("s7", (i) => {
                    activeStepS7 = i;
                }),
                makeScroller("s8", (i) => {
                    activeStepS8 = i;
                    if (i === 0 && !selectedWord && visibleWords.length > 0) {
                        // Preload top word's records for inline desktop cards
                        // (do not auto-open modal — selectWord opens modal only on narrow viewports)
                        selectWord(
                            visibleWords[0].word ?? visibleWords[0].text,
                        );
                    }
                }),
            ];

            // Dedicated IntersectionObserver for the kopi/seblak figures.
            // Fires the moment the anchor-pair element peeks into the viewport so
            // count-up starts on first entry — not only when the scrollama step
            // is halfway up (which used to lag behind on mobile).
            const anchorPair = document.querySelector(
                '[data-section="s7"] .s7-anchor-pair',
            );
            if (anchorPair && !s7HasEntered) {
                const io = new IntersectionObserver(
                    (entries) => {
                        for (const e of entries) {
                            if (e.isIntersecting) {
                                s7HasEntered = true;
                                io.disconnect();
                                break;
                            }
                        }
                    },
                    { threshold: 0, rootMargin: "0px 0px 0px 0px" },
                );
                io.observe(anchorPair);
                s7AnchorObserver = io;
            }

            mqNarrow = window.matchMedia("(max-width: 480px)");
            isNarrow = mqNarrow.matches;
            onNarrowChange = (e) => {
                isNarrow = e.matches;
            };
            mqNarrow.addEventListener("change", onNarrowChange);

            window.addEventListener("resize", onResize);
        });
    });

    onDestroy(() => {
        scrollers.forEach((s) => s?.destroy());
        window.removeEventListener("resize", onResize);
        s7Timers.forEach(clearTimeout);
        s7AnchorObserver?.disconnect();
        mqNarrow?.removeEventListener("change", onNarrowChange);
    });

    $effect(() => {
        if (!stats || !constants?.anchors) return;
        if (!s7HasEntered) return;
        s7Timers.forEach(clearTimeout);
        s7Timers = [];
        const cancels = [];
        const high = stats.labelPagu.high ?? 0;
        if (activeStepS7 === 0) {
            s7ShowTransition = false;
            sdCount = 0;
            puskesmasCount = 0;
            cancels.push(
                countUp(
                    Math.floor(high / constants.anchors.kopi.price),
                    1800,
                    (v) => {
                        kopiCount = v;
                    },
                ),
            );
            cancels.push(
                countUp(
                    Math.floor(high / constants.anchors.seblak.price),
                    1800,
                    (v) => {
                        seblakCount = v;
                    },
                ),
            );
        } else if (activeStepS7 === 1) {
            s7ShowTransition = true;
            sdCount = 0;
            puskesmasCount = 0;
            s7Timers.push(
                setTimeout(() => {
                    cancels.push(
                        countUp(
                            Math.floor(high / constants.anchors.sd.price),
                            1800,
                            (v) => {
                                sdCount = v;
                            },
                        ),
                    );
                }, 300),
            );
            s7Timers.push(
                setTimeout(() => {
                    cancels.push(
                        countUp(
                            Math.floor(
                                high / constants.anchors.puskesmas.price,
                            ),
                            1800,
                            (v) => {
                                puskesmasCount = v;
                            },
                        ),
                    );
                }, 450),
            );
        }
        return () => {
            cancels.forEach((c) => c?.());
            s7Timers.forEach(clearTimeout);
            s7Timers = [];
        };
    });

    const fmtT = (v) => (v / 1e12).toFixed(1);
    const fmtNum = (v) => v.toLocaleString("id-ID");
    const fmtCount = (v) => v.toLocaleString("id-ID");

    function fmtPaguShort(v) {
        if (v >= 1e12) return `Rp ${(v / 1e12).toFixed(1).replace(".", ",")} T`;
        if (v >= 1e9) return `Rp ${(v / 1e9).toFixed(1).replace(".", ",")} M`;
        return `Rp ${(v / 1e6).toFixed(0)} jt`;
    }

    function countUp(target, duration, onUpdate, onDone) {
        const prefersReduced = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;
        if (prefersReduced) {
            onUpdate(target);
            onDone?.();
            return () => {};
        }
        let rafId;
        let cancelled = false;
        const start = performance.now();
        function frame(now) {
            if (cancelled) return;
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            onUpdate(Math.floor(eased * target));
            if (progress < 1) rafId = requestAnimationFrame(frame);
            else {
                onUpdate(target);
                onDone?.();
            }
        }
        rafId = requestAnimationFrame(frame);
        return () => {
            cancelled = true;
            cancelAnimationFrame(rafId);
        };
    }
</script>

<div class="site">
    <!-- ━━━ HERO ━━━ -->
    <section class="hero">
        <div class="grain"></div>
        <div class="hero-inner">
            <div class="eyebrow">idsterity · Pengadaan yang Mengada-ada</div>
            <h1 class="hero-headline">
                <span class="title-main">Berhemat itu berat,</span><br />
                <span class="title-accent">biar kamu saja.</span>
            </h1>
            <a class="scroll-cue" href="#s1">gulir untuk membedah ↓</a>
        </div>
    </section>

    <!-- ━━━ S1 HOOK ━━━ -->
    <section class="scrolly" data-section="s1" id="s1">
        <div class="sticky-col" class:chart--dimmed={s1ChartDimmed}>
            <div class="eyebrow">Bagian 1: Pada awalnya adalah instruksi</div>
            <h2 class="s1-display">
                Pemerintah berjanji efisiensi,<br /><em
                    >seperti apa kenyataannya?</em
                >
            </h2>
        </div>

        <div class="steps-col">
            <div class="step" data-step="0">
                <div class="step-card">
                    <h3>
                        Mengucap hemat memang mudah, mari kita tengok rekam
                        jejaknya.
                    </h3>
                    <p>
                        Sejak awal 2024, pemerintah telah mengumbar janji
                        pemotongan berbagai biaya yang tidak perlu. Melalui
                        Inpres Nomor 1 Tahun 2025 tentang Efisiensi Belanja,
                        rakyat Indonesia diberi harapan. Sayangnya, kumpulan
                        berita berikut memberi kesan berbeda:
                    </p>
                    <ul class="news-links">
                        <li>
                            <a
                                href="https://www.bbc.com/indonesia/articles/cly057k79vlo"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="news-link"
                            >
                                Yang terekam dari 95 hari kunjungan Prabowo ke
                                luar negeri
                            </a>
                        </li>
                        <li>
                            <a
                                href="https://www.cnnindonesia.com/nasional/20250217135126-20-1199215/mahasiswa-bali-geruduk-dprd-tolak-pemotongan-anggaran-pendidikan"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="news-link"
                            >
                                Mahasiswa Bali Geruduk DPRD, Tolak Pemotongan
                                Anggaran Pendidikan
                            </a>
                        </li>
                        <li>
                            <a
                                href="https://www.hukumonline.com/berita/a/efisiensi-anggaran-ganggu-pelayanan-publik--pendidikan-hingga-infrastruktur-dasar-lt67b2ff43ea76d/"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="news-link"
                            >
                                Efisiensi Anggaran Ganggu Pelayanan Publik,
                                Pendidikan Hingga Infrastruktur Dasar
                            </a>
                        </li>
                        <li>
                            <a
                                href="https://www.kompas.com/properti/read/2026/05/10/161817121/saat-nyawa-rakyat-tergilas-efisiensi-anggaran-negara"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="news-link"
                            >
                                Saat Nyawa Rakyat Tergilas Efisiensi Anggaran
                                Negara
                            </a>
                        </li>
                        <li>
                            <a
                                href="https://www.tempo.co/politik/penghematan-anggaran-kementerian-dan-lembaga-untuk-program-prioritas-prabowo-1198055"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="news-link"
                            >
                                Penghematan Anggaran Kementerian dan Lembaga
                                untuk Program Prioritas Prabowo
                            </a>
                        </li>
                    </ul>
                    <p class="s1-disclaimer">
                        Tautan menuju kanal berita terkait.
                    </p>
                </div>
            </div>
        </div>
    </section>

    <!-- ━━━ S2 APBN DEFICIT ━━━ -->
    <section class="scrolly" data-section="s2" id="s2">
        <div class="sticky-col" class:chart--dimmed={s2ChartDimmed}>
            <div class="eyebrow">Bagian 2: APBN KITA, bukan APBN SAYA</div>
            <DeficitChart data={constants?.apbn?.deficit} step={activeStepS2} />
            <div class="step-indicator" aria-hidden="true">
                {#each [0, 1, 2, 3] as s}
                    <div class="pip" class:active={activeStepS2 === s}></div>
                {/each}
            </div>
        </div>

        <div class="steps-col">
            <div class="step" data-step="0">
                <div class="step-card">
                    <span class="step-num">1 / 4</span>
                    <h3>2024: Rp 507,8 T</h3>
                    <p>
                        Pada tahun 2024, defisit APBN mencapai Rp 507,8 triliun
                        (2,29% dari PDB), bagaimana jadinya setelah
                        gembar-gembor efisiensi?
                    </p>
                    <a
                        class="source-link"
                        href={constants?.sources?.find(
                            (s) => s.field === "apbn.deficit.fy2024",
                        )?.url ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        >Sumber: Kementerian Keuangan RI</a
                    >
                </div>
            </div>

            <div class="step" data-step="1">
                <div class="step-card">
                    <span class="step-num">2 / 4</span>
                    <h3>2025: Rp 695,1 T</h3>
                    <p>
                        Realisasi APBN 2025: defisit justru melebar ke Rp 695,1
                        triliun (2,92% dari PDB). Angan-angan penghematan mulai
                        tertiup angin.
                    </p>
                    <a
                        class="source-link"
                        href={constants?.sources?.find(
                            (s) => s.field === "apbn.deficit.fy2025",
                        )?.url ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        >Sumber: Kementerian Keuangan RI</a
                    >
                </div>
            </div>

            <div class="step" data-step="2">
                <div class="step-card">
                    <span class="step-num">3 / 4</span>
                    <h3>Q1 2026: Rp 240 T</h3>
                    <p>
                        Baru tiga bulan 2026, defisit sudah mencapai Rp 240
                        triliun. Belanja apa aja sih?
                    </p>
                    <a
                        class="source-link"
                        href={constants?.sources?.find(
                            (s) => s.field === "apbn.deficit.q1_2026",
                        )?.url ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        >Sumber: Kementerian Keuangan RI</a
                    >
                </div>
            </div>

            <div class="step" data-step="3">
                <div class="step-card">
                    <span class="step-num">4 / 4</span>
                    <h3>Proyeksi defisit tahunan</h3>
                    <p>
                        Kalau lanjut begini terus, defisit tahunan bisa mencapai
                        Rp960T!
                    </p>
                    <a
                        class="source-link"
                        href={constants?.sources?.find(
                            (s) => s.field === "apbn.deficit.proj2026",
                        )?.url ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        >Proyeksi dari ekstrapolasi Q1 2026 × 4.</a
                    >
                </div>
            </div>
        </div>
    </section>

    <!-- ━━━ S3 GDP CONSUMPTION ━━━ -->
    <section class="scrolly" data-section="s3" id="s3">
        <div class="sticky-col" class:chart--dimmed={s3ChartDimmed}>
            <div class="eyebrow">Bagian 3: Defisit karena apa?</div>
            <GDPChart
                data={constants?.gdp?.konsumsi_pemerintah}
                step={activeStepS3}
            />
            <div class="step-indicator" aria-hidden="true">
                {#each [0, 1, 2, 3] as s}
                    <div class="pip" class:active={activeStepS3 === s}></div>
                {/each}
            </div>
        </div>

        <div class="steps-col">
            <div class="step" data-step="0">
                <div class="step-card">
                    <span class="step-num">1 / 4</span>
                    <h3>Q1 2025: −1,38%</h3>
                    <p>
                        Awal 2025, konsumsi pemerintah memang menyusut 1,38%
                        YoY. Ini namanya fase bulan madu.
                    </p>
                    <a
                        class="source-link"
                        href={constants?.sources?.find(
                            (s) =>
                                s.field === "gdp.konsumsi_pemerintah.q1_2025",
                        )?.url ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer">Sumber: BPS</a
                    >
                </div>
            </div>

            <div class="step" data-step="1">
                <div class="step-card">
                    <span class="step-num">2 / 4</span>
                    <h3>Q2 2025: +21,05%</h3>
                    <p>
                        Satu kuartal kemudian, konsumsi pemerintah melonjak
                        drastis 21,05% YoY.
                    </p>
                    <a
                        class="source-link"
                        href={constants?.sources?.find(
                            (s) =>
                                s.field === "gdp.konsumsi_pemerintah.q2_2025",
                        )?.url ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer">Sumber: BPS</a
                    >
                </div>
            </div>

            <div class="step" data-step="2">
                <div class="step-card">
                    <span class="step-num">3 / 4</span>
                    <h3>Q3–Q4 2025</h3>
                    <p>
                        Lanjut lagi Q3 2025: +5,08%. Q4 2025: +4,41%. Secara
                        konsistensi memang patut diapresiasi.
                    </p>
                    <a
                        class="source-link"
                        href={constants?.sources?.find(
                            (s) =>
                                s.field === "gdp.konsumsi_pemerintah.q3_2025",
                        )?.url ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer">Sumber: BPS</a
                    >
                </div>
            </div>

            <div class="step" data-step="3">
                <div class="step-card">
                    <span class="step-num">4 / 4</span>
                    <h3>Q1 2026: +21,81%</h3>
                    <p>
                        Awal 2026, konsumsi pemerintah tumbuh 21,81% YoY.
                        Pemerintah berjanji efisiensi, perlu cek kamus
                        sepertinya definisi kata ini sudah diganti.
                    </p>
                    <a
                        class="source-link"
                        href={constants?.sources?.find(
                            (s) =>
                                s.field === "gdp.konsumsi_pemerintah.q1_2026",
                        )?.url ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer">Sumber: BPS</a
                    >
                </div>
            </div>
        </div>
    </section>

    <!-- ━━━ S4 DATASET OVERVIEW ━━━ -->
    <section class="s4" data-section="s4" id="s4">
        <div class="s4-inner">
            <div class="eyebrow">Bagian 4: Data Pengadaan</div>
            <h2 class="s4-heading">Apa yang ada di dataset ini?</h2>

            <div class="s4-stats-grid">
                <div class="s4-stat-cell">
                    {#if stats}
                        <div class="s4-stat-number">
                            Rp 642T
                        </div>
                        <div class="s4-stat-label">Total pagu pengadaan</div>
                    {:else}
                        <div class="s4-stat-number loading-pulse">--</div>
                        <div class="s4-stat-label">memuat...</div>
                    {/if}
                </div>
                <div class="s4-stat-cell">
                    {#if stats}
                        <div class="s4-stat-number">
                            3.000.000
                        </div>
                        <div class="s4-stat-label">Paket pengadaan</div>
                    {:else}
                        <div class="s4-stat-number loading-pulse">--</div>
                        <div class="s4-stat-label">memuat...</div>
                    {/if}
                </div>
            </div>

            <h3 class="s4-breakdown-heading">Menurut keyakinan AI</h3>

            <ul class="s4-breakdown">
                <li class="s4-row">
                    <span class="s4-dot" style="background: var(--absurd)"
                    ></span>
                    <span class="s4-row-label">Absurd</span>
                    <span class="s4-row-count"
                        >{stats ? fmtNum(stats.labelCounts.absurd ?? 0) : "--"}
                        paket</span
                    >
                    <span class="s4-row-pagu">
                        {#if stats}
                            {fmtPaguShort(stats.labelPagu.absurd ?? 0)}
                        {:else}
                            <span class="loading-pulse">--</span>
                        {/if}
                    </span>
                </li>
                <li class="s4-row">
                    <span class="s4-dot" style="background: var(--red)"></span>
                    <span class="s4-row-label">Bermasalah</span>
                    <span class="s4-row-count"
                        >{stats ? fmtNum(stats.labelCounts.high) : "--"}
                        paket</span
                    >
                    <span class="s4-row-pagu"
                        >Rp {stats ? fmtT(stats.labelPagu.high) : "--"} T</span
                    >
                </li>
                <li class="s4-row">
                    <span class="s4-dot" style="background: var(--amber)"
                    ></span>
                    <span class="s4-row-label">Perlu dicermati</span>
                    <span class="s4-row-count"
                        >{stats ? fmtNum(stats.labelCounts.med) : "--"}
                        paket</span
                    >
                    <span class="s4-row-pagu"
                        >Rp {stats ? fmtT(stats.labelPagu.med) : "--"} T</span
                    >
                </li>
                <li class="s4-row">
                    <span
                        class="s4-dot"
                        style="background: var(--viz-neutral)"
                    ></span>
                    <span class="s4-row-label">Wajar</span>
                    <span class="s4-row-count"
                        >{stats ? fmtNum(stats.labelCounts.low) : "--"}
                        paket</span
                    >
                    <span class="s4-row-pagu"
                        >Rp {stats ? fmtT(stats.labelPagu.low) : "--"} T</span
                    >
                </li>
            </ul>

            <p class="s4-disclaimer">
                Label dihasilkan oleh <a href="https://nemesis.assai.id/" target="_blank" rel="noopener">model AI</a> yang sangat amat mungkin salah.
                Bukan referensi hukum.
            </p>
        </div>
    </section>

    <!-- ━━━ S5+S6 INSTITUTIONS ━━━ -->
    <section class="scrolly" data-section="s5" id="s5">
        <div class="sticky-col">
            <div class="eyebrow">Bagian 5: Sang Juara</div>
            <h2 class="s5-sticky-heading">
                5 lembaga dengan anggaran terbesar
            </h2>
            <Podium data={lembaga.slice(0, 5)} />
        </div>

        <div class="steps-col">
            <div class="step" data-step="0">
                <div class="step-card">
                    <h3>Siapa yang belanja paling besar?</h3>
                    <p>
                        Lima lembaga pemerintah dengan anggaran pengadaan
                        terbesar tahun 2026.
                    </p>
                </div>
            </div>
        </div>
    </section>

    <!-- ━━━ S6 REVERSE PODIUM (flagged-pagu rerank) ━━━ -->
    <section class="scrolly" data-section="s6" id="s6">
        <div class="sticky-col" class:chart--dimmed={s6ChartDimmed}>
            <div class="eyebrow">Bagian 6: Sang Juara Bermasalah</div>
            <h2 class="s6-sticky-heading">
                Tapi siapa yang paling banyak ditandai bermasalah?
            </h2>
            <ReversePodium
                data={lembagaFlagged.slice(0, 5)}
            />
        </div>

        <div class="steps-col">
            <div class="step" data-step="0">
                <div class="step-card">
                    <h3>Urutkan ulang berdasarkan pagu bermasalah</h3>
                    <p>
                        Sekarang kita beralih dari "siapa belanja paling besar"
                        ke "siapa yang paling banyak ditandai bermasalah". Top 5
                        berubah.
                    </p>
                </div>
            </div>
        </div>
    </section>

    <!-- ━━━ S7 ANCHOR COUNT-UP ━━━ -->
    <section class="scrolly" data-section="s7" id="s7">
        <div class="sticky-col" class:chart--dimmed={s7ChartDimmed}>
            <div class="eyebrow">Bagian 6: Pesta Seblak</div>
            <h2 class="s7-sticky-heading">
                {#if stats}
                    Rp {fmtT(stats.labelPagu.high)} T untuk pengadaan bermasalah
                {:else}
                    Rp 10,7 triliun untuk pengadaan bermasalah
                {/if}
            </h2>

            <span class="s7-transition-label" aria-live="polite"
                >{s7ShowTransition ? "Atau, lebih seriusnya..." : ""}</span
            >

            <div class="s7-anchor-pair">
                {#if activeStepS7 === 0}
                    <div class="s7-anchor">
                        {#if stats && constants}
                            <span class="s7-anchor-figure is-gold"
                                >{fmtCount(kopiCount)}</span
                            >
                        {:else}
                            <span class="s7-anchor-figure is-gold loading-pulse"
                                >—</span
                            >
                        {/if}
                        <span class="s7-anchor-label">gelas kopi jago</span>
                        <span class="s7-anchor-citation"
                            >Harga satuan: Rp {fmtNum(
                                constants?.anchors?.kopi?.price ?? 0,
                            )} — {constants?.anchors?.kopi?.sourceLabel ??
                                ""}</span
                        >
                    </div>
                    <div class="s7-anchor">
                        {#if stats && constants}
                            <span class="s7-anchor-figure is-gold"
                                >{fmtCount(seblakCount)}</span
                            >
                        {:else}
                            <span class="s7-anchor-figure is-gold loading-pulse"
                                >—</span
                            >
                        {/if}
                        <span class="s7-anchor-label">mangkok seblak</span>
                        <span class="s7-anchor-citation"
                            >Harga satuan: Rp {fmtNum(
                                constants?.anchors?.seblak?.price ?? 0,
                            )} — {constants?.anchors?.seblak?.sourceLabel ??
                                ""}</span
                        >
                    </div>
                {:else}
                    <div class="s7-anchor">
                        {#if stats && constants}
                            <span class="s7-anchor-figure is-red"
                                >{fmtCount(sdCount)}</span
                            >
                        {:else}
                            <span class="s7-anchor-figure is-red loading-pulse"
                                >—</span
                            >
                        {/if}
                        <span class="s7-anchor-label">sekolah dasar baru</span>
                        <span class="s7-anchor-citation"
                            >Harga satuan: Rp {fmtNum(
                                constants?.anchors?.sd?.price ?? 0,
                            )} — {constants?.anchors?.sd?.sourceLabel ??
                                ""}</span
                        >
                    </div>
                    <div class="s7-anchor">
                        {#if stats && constants}
                            <span class="s7-anchor-figure is-red"
                                >{fmtCount(puskesmasCount)}</span
                            >
                        {:else}
                            <span class="s7-anchor-figure is-red loading-pulse"
                                >—</span
                            >
                        {/if}
                        <span class="s7-anchor-label">puskesmas baru</span>
                        <span class="s7-anchor-citation"
                            >Harga satuan: Rp {fmtNum(
                                constants?.anchors?.puskesmas?.price ?? 0,
                            )} — {constants?.anchors?.puskesmas?.sourceLabel ??
                                ""}</span
                        >
                    </div>
                {/if}
            </div>

            <div class="step-indicator" aria-hidden="true">
                {#each [0, 1] as s}
                    <div class="pip" class:active={activeStepS7 === s}></div>
                {/each}
            </div>
        </div>

        <div class="steps-col">
            <div class="step" data-step="0">
                <div class="step-card">
                    <span class="step-num">1 / 2</span>
                    <h3>Mari berandai...</h3>
                    <p>
                        Rp 10,7 triliun total anggaran yang dinilai AI
                        bermasalah. Pasti susah bayanginnya, bisa untuk beli...
                    </p>
                    <a
                        class="source-link"
                        href={constants?.anchors?.kopi?.source ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        >{constants?.anchors?.kopi?.sourceLabel ??
                            "gelas kopi jago"}</a
                    >
                    <a
                        class="source-link"
                        href={constants?.anchors?.seblak?.source ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        >{constants?.anchors?.seblak?.sourceLabel ??
                            "mangkok seblak"}</a
                    >
                </div>
            </div>

            <div class="step" data-step="1">
                <div class="step-card">
                    <span class="step-num">2 / 2</span>
                    <h3>Atau, bangun ini...</h3>
                    <p>
                        Dana yang sama bisa membangun ribuan sekolah dasar baru,
                        atau lebih dari seribu puskesmas.
                    </p>
                    <a
                        class="source-link"
                        href={constants?.anchors?.sd?.source ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        >{constants?.anchors?.sd?.sourceLabel ??
                            "sekolah dasar baru"}</a
                    >
                    <a
                        class="source-link"
                        href={constants?.anchors?.puskesmas?.source ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        >{constants?.anchors?.puskesmas?.sourceLabel ??
                            "puskesmas baru"}</a
                    >
                </div>
            </div>
        </div>
    </section>

    <!-- ━━━ S8 WORD CLOUD ━━━ -->
    <section class="word-cloud-section" data-section="s8" id="s8">
        <div class="eyebrow">Bagian 7: Beli apa sih?</div>
        <h2 class="s8-sticky-heading">
            Pengadaan apa yang paling sering bermasalah?
        </h2>

        <div class="filter-row" role="tablist" aria-label="Filter pemerintah">
            {#each [["all", "Semua"], ["central", "Pemerintah Pusat"], ["district", "Pemerintah Daerah"]] as [val, label]}
                <button
                    type="button"
                    class="filter-pill"
                    class:active={wordFilter === val}
                    onclick={() => setWordFilter(val)}
                    role="tab"
                    aria-selected={wordFilter === val}>{label}</button
                >
            {/each}
        </div>

        {#if filterError}
            <div class="s8-filter-error">{filterError}</div>
        {/if}

        <!-- Hidden step anchor so scrollama can still drive activeStepS8 -->
        <div class="s8-step-anchor" data-step="0" aria-hidden="true"></div>

        {#if visibleWords.length === 0}
            <div class="s8-empty">Tidak ada kata ditemukan.</div>
        {:else}
            <div class="chip-grid">
                {#each visibleWords as w, idx (w.word ?? w.text ?? idx)}
                    {@const wordKey = w.word ?? w.text ?? ""}
                    <button
                        type="button"
                        class="chip"
                        class:selected={selectedWord === wordKey}
                        style="font-size: {chipSize(
                            idx,
                            visibleWords.length,
                        )}rem;"
                        onclick={() => selectWord(wordKey)}
                        aria-pressed={selectedWord === wordKey}
                        >{wordKey}</button
                    >
                {/each}
            </div>
        {/if}

        {#if selectedWord && !modalOpen}
            <div class="desktop-cards">
                <h3>
                    Paket dengan kata <em>"{selectedWord}"</em>
                </h3>
                {#if wordRecordsLoading}
                    <p class="desktop-cards-status loading-pulse">
                        memuat paket…
                    </p>
                {:else if wordRecordsError}
                    <p class="desktop-cards-status error">{wordRecordsError}</p>
                {:else}
                    <WordPaketCards records={selectedRecords} limit={3} />
                {/if}
            </div>
        {/if}
    </section>

    <Modal
        open={modalOpen}
        title={`Paket dengan kata "${selectedWord ?? ""}"`}
        onClose={closeModal}
    >
        {#if wordRecordsLoading}
            <p class="desktop-cards-status loading-pulse">memuat paket…</p>
        {:else if wordRecordsError}
            <p class="desktop-cards-status error">{wordRecordsError}</p>
        {:else}
            <WordPaketCards records={selectedRecords} limit={3} />
        {/if}
    </Modal>

    {#if fetchError}<div class="fetch-error">{fetchError}</div>{/if}
</div>

<style>
    /* ── Variables ── */
    :global(:root) {
        /* ── Legacy alias shims ──────────────────────────────────────
           Map the old dark-theme variables to new light-mode tokens so
           any component not yet migrated keeps rendering correctly.
           Task 5 will remove these shims once chart components are done.
           ─────────────────────────────────────────────────────────── */

        /* Surfaces */
        --bg:       var(--bg-base);
        --bg-alt:   var(--bg-sunken);
        --bg-card:  var(--bg-card);   /* token already defined in idsterity-tokens.css */

        /* Text */
        --text:     var(--ink-1);
        --muted:    var(--ink-3);

        /* Accent */
        --gold:     var(--accent-soft);

        /* Data signals — keep as concrete values; chart components own these */
        --red:      var(--viz-red);
        --absurd:   var(--viz-red-dark);
        --amber:    var(--viz-warm-light);
        --central:  #5b8ed4;
        --provinsi: #5ba882;
        --kabkota:  #c4a04a;
        --clean:    #3a6b52;

        /* Structure */
        --border:   var(--rule-soft);

        /* Spacing — keep legacy names in sync with token scale */
        --space-xs:   var(--space-1);
        --space-sm:   var(--space-2);
        --space-md:   var(--space-4);
        --space-lg:   var(--space-5);
        --space-xl:   var(--space-6);
        --space-2xl:  var(--space-7);
        --space-3xl:  var(--space-8);
        --space-page: var(--space-9);
    }

    /* ── Layout ── */
    .site {
        max-width: 1440px;
        margin: 0 auto;
    }

    /* ── Hero ── */
    .hero {
        min-height: 100dvh;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        overflow: hidden;
        border-bottom: 1px solid var(--rule);
    }

    .grain {
        position: absolute;
        inset: 0;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
        background-size: 300px 300px;
        pointer-events: none;
        z-index: 0;
    }

    .hero-inner {
        position: relative;
        z-index: 1;
        text-align: center;
        padding: 4rem 2rem;
        max-width: 680px;
    }

    .eyebrow {
        font-family: var(--sans);
        font-size: var(--size-meta);
        font-weight: 500;
        letter-spacing: var(--tracking-meta);
        text-transform: uppercase;
        color: var(--accent-soft);
        margin-bottom: 2.5rem;
    }

    .hero-headline {
        font-family: var(--serif);
        font-size: clamp(1.7rem, 6vw, 5.5rem);
        font-weight: 700;
        line-height: var(--lh-tight);
        letter-spacing: var(--tracking-display);
        margin-bottom: 3rem;
        text-wrap: balance;
        max-width: min(96vw, 1200px);
        margin-left: auto;
        margin-right: auto;
    }

    .title-main {
        color: var(--ink-1);
        font-style: italic;
    }

    .title-accent {
        color: var(--accent);
        font-style: italic;
    }

    .loading-pulse {
        animation: pulse 1.8s ease-in-out infinite;
    }
    @keyframes pulse {
        0%,
        100% {
            opacity: 0.5;
        }
        50% {
            opacity: 0.9;
        }
    }

    .scroll-cue {
        display: inline-block;
        font-family: var(--mono);
        font-size: var(--size-meta);
        letter-spacing: var(--tracking-meta);
        color: var(--ink-3);
        text-decoration: none;
        animation: bob 2.2s ease-in-out infinite;
        transition: color 0.2s;
    }
    .scroll-cue:hover {
        color: var(--accent-soft);
    }
    @keyframes bob {
        0%,
        100% {
            transform: translateY(0);
        }
        50% {
            transform: translateY(7px);
        }
    }

    /* ── Scrollytelling ── */
    .scrolly {
        display: flex;
        align-items: flex-start;
        border-bottom: 1px solid var(--rule);
        position: relative;
    }

    .sticky-col {
        position: sticky;
        top: 0;
        height: 100dvh;
        width: 60%;
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: center;
        padding: 2rem 2.5rem;
        border-right: 1px solid var(--rule);
        z-index: 2;
        background: var(--bg-base);
    }

    .step-indicator {
        display: flex;
        gap: 6px;
        margin-top: 1.5rem;
    }

    .pip {
        width: 20px;
        height: 3px;
        border-radius: 2px;
        background: var(--rule);
        transition:
            background 0.4s ease,
            width 0.4s ease;
    }

    .pip.active {
        background: var(--accent-soft);
        width: 32px;
    }

    .steps-col {
        width: 40%;
        flex-shrink: 0;
        padding: 0 2.5rem;
    }

    .step {
        min-height: 100vh;
        display: flex;
        align-items: center;
        padding: 3rem 0;
    }

    .step-card {
        background: var(--bg-sunken);
        border: 1px solid var(--rule);
        border-radius: var(--radius-card);
        padding: var(--space-6) var(--space-5);
        max-width: 380px;
    }

    .step-card h3 {
        font-family: var(--serif);
        font-size: var(--size-h3);
        font-weight: 700;
        line-height: var(--lh-heading);
        color: var(--ink-1);
        margin: 0 0 var(--space-md) 0;
    }

    .step-num {
        font-family: var(--mono);
        font-size: var(--size-meta);
        letter-spacing: var(--tracking-meta);
        color: var(--accent-soft);
        display: block;
        margin-bottom: 0.9rem;
    }

    .step-card p {
        font-family: var(--serif);
        font-size: var(--size-body);
        line-height: var(--lh-body);
        color: var(--ink-2);
    }

    /* inline marks — keep for Phase 2 */
    :global(mark) {
        background: transparent;
        padding: 0 1px;
    }
    :global(.c-central) {
        color: var(--central);
        border-bottom: 1px solid var(--central);
    }
    :global(.c-provinsi) {
        color: var(--provinsi);
        border-bottom: 1px solid var(--provinsi);
    }
    :global(.c-kabkota) {
        color: var(--kabkota);
        border-bottom: 1px solid var(--kabkota);
    }
    :global(.c-flagged) {
        color: var(--amber);
        border-bottom: 1px solid var(--amber);
    }

    /* ── S1 Hook ── */
    .s1-display {
        font-family: var(--serif);
        font-size: clamp(1.2rem, 6vw, 5.5rem);
        font-weight: 700;
        line-height: var(--lh-tight);
        letter-spacing: var(--tracking-display);
        color: var(--ink-1);
        margin: 0;
        text-align: left;
        text-wrap: balance;
        max-width: 100%;
    }

    .s1-display em {
        font-style: italic;
        color: var(--accent);
    }

    .news-links {
        list-style: none;
        padding: 0;
        margin: var(--space-lg) 0 0 0;
    }

    .news-links li {
        padding: var(--space-sm) 0;
    }

    .news-link {
        display: inline-block;
        min-height: 44px;
        padding: var(--space-sm) 0;
        color: var(--ink-2);
        text-decoration: underline;
        text-decoration-color: var(--rule);
        text-underline-offset: 3px;
        transition: text-decoration-color 0.15s ease;
    }

    .news-link:hover {
        text-decoration-color: var(--accent-soft);
    }

    .s1-disclaimer {
        font-family: var(--mono);
        font-size: var(--size-mono);
        font-style: italic;
        color: var(--ink-muted);
        margin-top: var(--space-lg);
    }

    /* -- S2 Deficit -- */
    /* -- S3 GDP -- */

    /* -- S4 Dataset -- */
    .s4 {
        background: var(--bg-sunken);
        padding: var(--space-page) var(--space-xl);
        border-bottom: 1px solid var(--rule);
    }

    /* -- S5+S6 Institutions -- */
    .s6-transition-label {
        display: inline-block;
        margin-top: var(--space-sm);
        font-family: var(--mono);
        font-size: var(--size-mono);
        color: var(--ink-3);
        font-style: italic;
    }
    .s4-inner {
        max-width: 800px;
        margin: 0 auto;
    }
    .s4-heading {
        font-family: var(--serif);
        font-size: clamp(1.8rem, 4vw, 2.6rem);
        font-weight: 700;
        line-height: var(--lh-snug);
        color: var(--ink-1);
        margin: 0 0 var(--space-2xl) 0;
        letter-spacing: -0.01em;
        text-wrap: balance;
        max-width: 22ch;
    }
    .s4-stats-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-xl);
        margin-bottom: var(--space-3xl);
    }
    .s4-stat-cell {
        padding: var(--space-lg);
        border: 1px solid var(--rule);
        border-radius: var(--radius-sm);
        background: var(--bg-card);
    }
    .s4-stat-number {
        font-family: var(--serif);
        font-size: var(--size-stat);
        font-weight: 700;
        color: var(--viz-warm-dark);
        line-height: var(--lh-tight);
        margin-bottom: var(--space-sm);
        letter-spacing: var(--tracking-display);
        font-feature-settings: 'onum';
    }
    .s4-stat-label {
        font-family: var(--serif);
        font-size: var(--size-small);
        color: var(--ink-3);
        font-style: italic;
        line-height: var(--lh-body);
    }
    .s4-breakdown-heading {
        font-family: var(--serif);
        font-size: var(--size-h3);
        font-weight: 700;
        color: var(--ink-1);
        margin: 0 0 var(--space-md) 0;
    }
    .s4-breakdown {
        list-style: none;
        padding: 0;
        margin: 0 0 var(--space-lg) 0;
    }
    .s4-row {
        display: flex;
        align-items: center;
        gap: var(--space-md);
        padding: var(--space-sm) 0;
        border-bottom: 1px solid var(--rule-soft);
    }
    .s4-row:last-child {
        border-bottom: none;
    }
    .s4-dot {
        display: inline-block;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        flex-shrink: 0;
    }
    .s4-row-label {
        flex: 1;
        font-family: var(--serif);
        color: var(--ink-1);
        font-size: var(--size-body);
    }
    .s4-row-count,
    .s4-row-pagu {
        font-family: var(--mono);
        font-size: var(--size-mono);
        color: var(--ink-3);
    }
    .s4-disclaimer {
        font-family: var(--mono);
        font-size: var(--size-mono);
        color: var(--ink-muted);
        font-style: italic;
        max-width: 520px;
        margin: var(--space-md) 0 0 0;
        padding-top: var(--space-md);
        border-top: 1px solid var(--rule-soft);
        line-height: var(--lh-body);
    }

    .source-link {
        display: inline-block;
        margin-top: var(--space-md);
        font-family: var(--mono);
        font-size: var(--size-mono);
        font-style: italic;
        color: var(--ink-3);
        text-decoration: underline;
        text-decoration-color: var(--rule-soft);
        text-underline-offset: 3px;
        min-height: 44px;
        padding: 8px 0;
        transition: color 0.15s ease;
    }

    .source-link:hover {
        color: var(--ink-1);
    }

    .fetch-error {
        font-family: var(--mono);
        font-size: var(--size-mono);
        color: var(--accent-soft);
        padding: var(--space-md);
        text-align: center;
    }

    /* -- S5 Institutions / S6 Reverse Podium sticky heading -- */
    .s5-sticky-heading,
    .s6-sticky-heading {
        font-family: var(--serif);
        font-size: clamp(1.4rem, 3vw, 2rem);
        font-weight: 700;
        color: var(--ink-1);
        margin: 0 0 var(--space-md) 0;
        line-height: var(--lh-snug);
        text-wrap: balance;
        max-width: 22ch;
    }

    /* -- S7 Anchor Count-Up -- */
    .s7-sticky-heading {
        font-family: var(--serif);
        font-size: clamp(1.4rem, 3vw, 2rem);
        font-weight: 700;
        color: var(--ink-1);
        margin: 0 0 var(--space-lg) 0;
        line-height: var(--lh-snug);
        text-wrap: balance;
        max-width: 22ch;
    }

    .s7-transition-label {
        display: block;
        min-height: 1.2em;
        font-family: var(--mono);
        font-size: var(--size-meta);
        font-style: italic;
        color: var(--ink-3);
        margin-bottom: var(--space-md);
    }

    .s7-anchor-pair {
        display: flex;
        flex-direction: column;
        gap: var(--space-xl);
        margin-top: var(--space-xl);
    }

    .s7-anchor {
        display: flex;
        flex-direction: column;
        gap: var(--space-xs);
    }

    .s7-anchor-figure {
        font-family: var(--serif);
        font-size: var(--size-stat);
        font-weight: 700;
        line-height: var(--lh-tight);
        letter-spacing: var(--tracking-display);
        font-feature-settings: 'onum';
    }

    .s7-anchor-figure.is-gold {
        color: var(--viz-warm-dark);
    }
    .s7-anchor-figure.is-red {
        color: var(--viz-red);
    }

    .s7-anchor-label {
        font-family: var(--serif);
        font-size: var(--size-body);
        color: var(--ink-2);
        line-height: var(--lh-body);
    }

    .s7-anchor-citation {
        font-family: var(--mono);
        font-size: var(--size-mono);
        color: var(--ink-3);
        font-style: italic;
        line-height: var(--lh-body);
    }

    /* -- S8 Word Cloud (chip-grid layout) -- */
    .word-cloud-section {
        max-width: 1100px;
        margin: 0 auto;
        padding: var(--space-3xl) var(--space-lg);
        border-bottom: 1px solid var(--rule);
    }

    .word-cloud-section .eyebrow {
        margin-bottom: var(--space-md);
    }

    .s8-sticky-heading {
        font-family: var(--serif);
        font-size: clamp(1.4rem, 4vw, 2.2rem);
        font-weight: 700;
        color: var(--ink-1);
        text-wrap: balance;
        max-width: 22ch;
        margin: 0 0 1.25rem;
        line-height: var(--lh-snug);
    }

    .filter-row {
        display: flex;
        gap: 0.5rem;
        overflow-x: auto;
        padding-bottom: 0.5rem;
        -webkit-mask-image: linear-gradient(to right, black 88%, transparent);
        mask-image: linear-gradient(to right, black 88%, transparent);
    }

    .filter-pill {
        flex: 0 0 auto;
        padding: 0.45rem 1rem;
        border: 1px solid var(--rule);
        background: transparent;
        color: var(--ink-3);
        border-radius: var(--radius-pill);
        font-family: var(--sans);
        font-size: var(--size-ui);
        cursor: pointer;
        white-space: nowrap;
        transition:
            color 0.12s ease,
            border-color 0.12s ease;
    }

    .filter-pill:hover {
        color: var(--ink-1);
    }

    .filter-pill.active {
        color: var(--accent-soft);
        border-color: var(--accent-soft);
    }

    .s8-filter-error {
        font-family: var(--mono);
        font-size: var(--size-mono);
        color: var(--accent-soft);
        padding: var(--space-sm) 0;
    }

    .s8-step-anchor {
        height: 1px;
        width: 100%;
    }

    .chip-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: 0.5rem;
        margin-top: 1.5rem;
    }

    .chip {
        padding: 0.5rem 0.75rem;
        border: 1px solid var(--rule);
        background: transparent;
        color: var(--ink-2);
        border-radius: var(--radius-pill);
        font-family: var(--sans);
        font-size: var(--size-ui);
        cursor: pointer;
        text-align: center;
        line-height: var(--lh-snug);
        word-break: break-word;
        transition:
            color 0.12s ease,
            background 0.12s ease,
            border-color 0.12s ease;
    }

    .chip:hover {
        border-color: var(--accent-soft);
    }

    .chip.selected {
        color: var(--bg-base);
        background: var(--accent-soft);
        border-color: var(--accent-soft);
    }

    .desktop-cards {
        margin-top: 2rem;
    }

    .desktop-cards h3 {
        font-family: var(--serif);
        font-size: var(--size-h3);
        margin: 0 0 0.75rem;
        color: var(--ink-1);
    }

    .desktop-cards h3 em {
        color: var(--accent);
        font-style: italic;
    }

    .desktop-cards-status {
        font-family: var(--mono);
        font-size: var(--size-mono);
        color: var(--ink-3);
        padding: 1rem 0;
    }

    .desktop-cards-status.error {
        color: var(--accent-soft);
    }

    .s8-empty {
        padding: var(--space-lg) 0;
        color: var(--ink-3);
        font-family: var(--mono);
        font-size: var(--size-mono);
        font-style: italic;
    }

    @media (max-width: 640px) {
        .hero-headline {
            max-width: 100%;
        }
    }

    /* ── Responsive ── */
    @media (max-width: 800px) {
        /* Stack chart above steps. The chart column stays sticky so it remains
       pinned at the top of the viewport while step cards scroll beneath it.
       Using position:relative here would break sticky and cause the chart to
       scroll off-screen — the most common mobile scrollytelling failure mode. */
        .scrolly {
            flex-direction: column;
            align-items: stretch;
        }
        .sticky-col {
            position: sticky;
            top: 0;
            width: 100%;
            height: 50dvh;
            min-height: unset;
            border-right: none;
            border-bottom: 1px solid var(--rule);
            /* Ensure no overflow on the sticky container or its content clips
         correctly; overflow:hidden is safe on the sticky element itself. */
            overflow: hidden;
            z-index: 10;
            background: var(--bg-base);
            padding: 1rem 1.5rem;
            justify-content: flex-start;
        }
        .steps-col {
            width: 100%;
            padding: 0 1.5rem;
        }
        .step-indicator {
            display: none;
        }

        /* S1 has no chart — let it scroll naturally, no sticky needed */
        [data-section="s1"] .sticky-col {
            position: relative;
            height: auto;
        }

        /* S4 mobile — collapse stats grid to single column */
        .s4-stats-grid {
            grid-template-columns: 1fr;
        }
        .s4 {
            padding: var(--space-2xl) var(--space-lg);
        }

        /* S7 mobile — show both anchor cards side by side so seblak is not
           clipped by the sticky-col overflow:hidden at 50dvh. Reduce figure
           font size so both fit comfortably. */
        [data-section="s7"] .s7-anchor-pair {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: var(--space-md);
            margin-top: var(--space-md);
        }
        [data-section="s7"] .s7-anchor-figure {
            font-size: clamp(1.4rem, 5vw, 2.4rem);
        }
    }

    @media (max-width: 720px) {
        .desktop-cards {
            display: none;
        }
        .chip-grid {
            grid-template-columns: repeat(2, 1fr);
        }
        .word-cloud-section {
            padding: var(--space-2xl) var(--space-md);
        }
    }

    @media (min-width: 1024px) {
        .chip-grid {
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        }
    }
</style>
