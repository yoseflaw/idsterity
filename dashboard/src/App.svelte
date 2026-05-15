<script>
    import { onMount, onDestroy } from "svelte";
    import scrollama from "scrollama";
    import { t } from "./i18n.js";
    import DeficitChart from "./DeficitChart.svelte";
    import GDPChart from "./GDPChart.svelte";
    import InstitutionsChart from "./InstitutionsChart.svelte";

    let stats = $state(null);
    let lembaga = $state([]);
    let constants = $state(null);
    let lang = $state("id");

    let activeStepS1 = $state(0);
    let activeStepS2 = $state(0);
    let activeStepS3 = $state(0);
    let activeStepS5 = $state(0);
    let fetchError = $state(null);

    let activeStepS7 = $state(0);
    let kopiCount = $state(0);
    let seblakCount = $state(0);
    let sdCount = $state(0);
    let puskesmasCount = $state(0);
    let s7ShowTransition = $state(false);
    let s7Timers = [];

    let activeStepS8 = $state(0);
    let cloudWords = $state([]);
    let lembagaIndex = $state({});
    let activeFilter = $state("all");
    let activeLembaga = $state(null);
    let lembagaSearch = $state("");
    let selectedWord = $state(null);
    let wordRecords = $state([]);
    let wordRecordsLoading = $state(false);
    let wordRecordsError = $state(null);
    let filterError = $state(null);
    let isNarrow = $state(false);
    let mqNarrow;
    let wordCache = new Map();

    let cloudMin = $derived(
        cloudWords.length ? Math.min(...cloudWords.map((w) => w.count)) : 0,
    );
    let cloudMax = $derived(
        cloudWords.length ? Math.max(...cloudWords.map((w) => w.count)) : 0,
    );

    let filteredInstitutions = $derived(
        lembagaSearch.length === 0
            ? []
            : Object.keys(lembagaIndex)
                  .filter((name) =>
                      name.toLowerCase().includes(lembagaSearch.toLowerCase()),
                  )
                  .slice(0, 50),
    );

    // Mobile: dim sticky chart when a text step card is scrolled over it
    let s1ChartDimmed = $derived(activeStepS1 > 0);
    let s2ChartDimmed = $derived(activeStepS2 > 0);
    let s3ChartDimmed = $derived(activeStepS3 > 0);
    let s5ChartDimmed = $derived(activeStepS5 > 0);
    let s7ChartDimmed = $derived(activeStepS7 > 0);
    let s8ChartDimmed = $derived(activeStepS8 > 0);

    function scaleFont(count, min, max) {
        if (max === min) return 1.375;
        const size = 0.75 + ((count - min) / (max - min)) * 1.25;
        return Math.min(2.0, Math.max(0.75, size));
    }

    async function setFilter(filter, lembagaName = null) {
        selectedWord = null;
        activeFilter = filter;
        activeLembaga = lembagaName;
        filterError = null;
        try {
            if (filter === "all") {
                cloudWords = await safeFetch(
                    import.meta.env.BASE_URL + "data/wordcloud-all.json",
                );
            } else if (filter === "central") {
                cloudWords = await safeFetch(
                    import.meta.env.BASE_URL + "data/wordcloud-central.json",
                );
            } else if (filter === "district") {
                cloudWords = await safeFetch(
                    import.meta.env.BASE_URL + "data/wordcloud-district.json",
                );
            } else if (filter === "lembaga") {
                cloudWords = lembagaIndex[lembagaName] ?? [];
                lembagaSearch = "";
            }
        } catch (err) {
            filterError = t[lang].fetchError;
        }
    }

    async function selectWord(word) {
        if (selectedWord === word) {
            selectedWord = null;
            return;
        }
        selectedWord = word;
        wordRecords = [];
        wordRecordsError = null;
        const filterKey = activeFilter === "lembaga" ? "all" : activeFilter;
        const cacheKey = `${word}-${filterKey}`;
        if (wordCache.has(cacheKey)) {
            wordRecords = wordCache.get(cacheKey);
            return;
        }
        wordRecordsLoading = true;
        const requestedWord = word; // capture before any await
        try {
            const data = await safeFetch(
                import.meta.env.BASE_URL +
                    `data/word-${word}-${filterKey}.json`,
            );
            if (selectedWord !== requestedWord) return; // superseded — discard
            wordCache.set(cacheKey, data);
            wordRecords = data;
        } catch (err) {
            if (selectedWord !== requestedWord) return;
            wordRecordsError = t[lang].s9Error;
        } finally {
            if (selectedWord === requestedWord) wordRecordsLoading = false;
        }
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
            const [s, d, c, w, l] = await Promise.all([
                safeFetch(import.meta.env.BASE_URL + "data/summary-stats.json"),
                safeFetch(
                    import.meta.env.BASE_URL + "data/lembaga-totals.json",
                ),
                safeFetch(import.meta.env.BASE_URL + "data/constants.json"),
                safeFetch(import.meta.env.BASE_URL + "data/wordcloud-all.json"),
                safeFetch(
                    import.meta.env.BASE_URL + "data/wordcloud-lembaga.json",
                ),
            ]);
            stats = s;
            lembaga = d;
            constants = c;
            cloudWords = w;
            lembagaIndex = l;
        } catch (err) {
            fetchError = lang === "id" ? t.id.fetchError : t.en.fetchError;
        }

        requestAnimationFrame(() => {
            // Use a lower offset on narrow viewports so step cards that fill the
            // entire screen (min-height: 100vh) still trigger the IntersectionObserver.
            // offset: 0.5 means 50% of the step must be visible — impossible when the
            // step fills the full viewport height on a small mobile screen.
            const isMobile = window.matchMedia("(max-width: 800px)").matches;
            const offset = isMobile ? 0.1 : 0.5;

            const makeScroller = (sectionAttr, onEnter) => {
                const s = scrollama();
                s.setup({
                    step: `[data-section="${sectionAttr}"] [data-step]`,
                    offset,
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
                makeScroller("s7", (i) => {
                    activeStepS7 = i;
                }),
                makeScroller("s8", (i) => {
                    activeStepS8 = i;
                    if (i === 0 && !selectedWord && cloudWords.length > 0) {
                        selectWord(cloudWords[0].word);
                    }
                }),
            ];

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
        mqNarrow?.removeEventListener("change", onNarrowChange);
    });

    $effect(() => {
        if (!stats || !constants?.anchors) return;
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
    const fmtCount = (v, l) => v.toLocaleString(l === "id" ? "id-ID" : "en-US");

    function fmtPaguShort(v, l) {
        const sep = l === "id" ? "," : ".";
        if (v >= 1e12) return `Rp ${(v / 1e12).toFixed(1).replace(".", sep)} T`;
        if (v >= 1e9) return `Rp ${(v / 1e9).toFixed(1).replace(".", sep)} M`;
        if (l === "id") return `Rp ${(v / 1e6).toFixed(0)} jt`;
        return `Rp ${(v / 1e6).toFixed(0)} M`;
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

    function toggleLang() {
        const y = window.scrollY;
        lang = lang === "id" ? "en" : "id";
        requestAnimationFrame(() => window.scrollTo(0, y));
    }
</script>

<div class="site">
    <button class="lang-toggle" onclick={toggleLang}
        >{t[lang].toggleLabel}</button
    >

    <!-- ━━━ HERO ━━━ -->
    <section class="hero">
        <div class="grain"></div>
        <div class="hero-inner">
            <div class="eyebrow">{t[lang].eyebrow}</div>
            <h1>
                {t[lang].heroLine1}<br />
                <em>{t[lang].heroLine2}</em>
            </h1>
            <a class="scroll-cue" href="#s1">{t[lang].scrollCue}</a>
        </div>
    </section>

    <!-- ━━━ S1 HOOK ━━━ -->
    <section class="scrolly" data-section="s1" id="s1">
        <div class="sticky-col" class:chart--dimmed={s1ChartDimmed}>
            <div class="eyebrow">{t[lang].s1Eyebrow}</div>
            <h2 class="s1-display">
                {t[lang].s1DisplayLine1}<br /><em>{t[lang].s1DisplayLine2}</em>
            </h2>
        </div>

        <div class="steps-col">
            <div class="step" data-step="0">
                <div class="step-card">
                    <h3>{t[lang].s1StepHeading}</h3>
                    <p>{t[lang].s1StepBody}</p>
                    <ul class="news-links">
                        <li>
                            <a
                                href="https://www.bbc.com/indonesia/articles/cly057k79vlo"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="news-link"
                            >
                                {t[lang].s1Link1Label}
                            </a>
                        </li>
                        <li>
                            <a
                                href="https://www.cnnindonesia.com/nasional/20250217135126-20-1199215/mahasiswa-bali-geruduk-dprd-tolak-pemotongan-anggaran-pendidikan"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="news-link"
                            >
                                {t[lang].s1Link2Label}
                            </a>
                        </li>
                        <li>
                            <a
                                href="https://www.hukumonline.com/berita/a/efisiensi-anggaran-ganggu-pelayanan-publik--pendidikan-hingga-infrastruktur-dasar-lt67b2ff43ea76d/"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="news-link"
                            >
                                {t[lang].s1Link3Label}
                            </a>
                        </li>
                        <li>
                            <a
                                href="https://www.kompas.com/properti/read/2026/05/10/161817121/saat-nyawa-rakyat-tergilas-efisiensi-anggaran-negara"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="news-link"
                            >
                                {t[lang].s1Link4Label}
                            </a>
                        </li>
                        <li>
                            <a
                                href="https://www.tempo.co/politik/penghematan-anggaran-kementerian-dan-lembaga-untuk-program-prioritas-prabowo-1198055"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="news-link"
                            >
                                {t[lang].s1Link5Label}
                            </a>
                        </li>
                    </ul>
                    <p class="s1-disclaimer">{t[lang].s1Disclaimer}</p>
                </div>
            </div>
        </div>
    </section>

    <!-- ━━━ S2 APBN DEFICIT ━━━ -->
    <section class="scrolly" data-section="s2" id="s2">
        <div class="sticky-col" class:chart--dimmed={s2ChartDimmed}>
            <div class="eyebrow">{t[lang].s2Eyebrow}</div>
            <DeficitChart
                data={constants?.apbn?.deficit}
                step={activeStepS2}
                {lang}
            />
            <div class="step-indicator" aria-hidden="true">
                {#each [0, 1, 2] as s}
                    <div class="pip" class:active={activeStepS2 === s}></div>
                {/each}
            </div>
        </div>

        <div class="steps-col">
            <div class="step" data-step="0">
                <div class="step-card">
                    <span class="step-num">{t[lang].stepCounter(1, 3)}</span>
                    <h3>{t[lang].s2Step1Heading}</h3>
                    <p>{t[lang].s2Step1Body}</p>
                    <a
                        class="source-link"
                        href={constants?.sources?.find(
                            (s) => s.field === "apbn.deficit.oct2024",
                        )?.url ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer">{t[lang].s2SourceLabel}</a
                    >
                </div>
            </div>

            <div class="step" data-step="1">
                <div class="step-card">
                    <span class="step-num">{t[lang].stepCounter(2, 3)}</span>
                    <h3>{t[lang].s2Step2Heading}</h3>
                    <p>{t[lang].s2Step2Body}</p>
                    <a
                        class="source-link"
                        href={constants?.sources?.find(
                            (s) => s.field === "apbn.deficit.fy2025",
                        )?.url ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer">{t[lang].s2SourceLabel}</a
                    >
                </div>
            </div>

            <div class="step" data-step="2">
                <div class="step-card">
                    <span class="step-num">{t[lang].stepCounter(3, 3)}</span>
                    <h3>{t[lang].s2Step3Heading}</h3>
                    <p>{t[lang].s2Step3Body}</p>
                    <a
                        class="source-link"
                        href={constants?.sources?.find(
                            (s) => s.field === "apbn.deficit.q1_2026",
                        )?.url ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer">{t[lang].s2SourceLabel}</a
                    >
                </div>
            </div>
        </div>
    </section>

    <!-- ━━━ S3 GDP CONSUMPTION ━━━ -->
    <section class="scrolly" data-section="s3" id="s3">
        <div class="sticky-col" class:chart--dimmed={s3ChartDimmed}>
            <div class="eyebrow">{t[lang].s3Eyebrow}</div>
            <GDPChart
                data={constants?.gdp?.konsumsi_pemerintah}
                step={activeStepS3}
                {lang}
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
                    <span class="step-num">{t[lang].stepCounter(1, 4)}</span>
                    <h3>{t[lang].s3Step1Heading}</h3>
                    <p>{t[lang].s3Step1Body}</p>
                    <a
                        class="source-link"
                        href={constants?.sources?.find(
                            (s) =>
                                s.field === "gdp.konsumsi_pemerintah.q1_2025",
                        )?.url ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer">{t[lang].s3SourceLabel}</a
                    >
                </div>
            </div>

            <div class="step" data-step="1">
                <div class="step-card">
                    <span class="step-num">{t[lang].stepCounter(2, 4)}</span>
                    <h3>{t[lang].s3Step2Heading}</h3>
                    <p>{t[lang].s3Step2Body}</p>
                    <a
                        class="source-link"
                        href={constants?.sources?.find(
                            (s) =>
                                s.field === "gdp.konsumsi_pemerintah.q2_2025",
                        )?.url ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer">{t[lang].s3SourceLabel}</a
                    >
                </div>
            </div>

            <div class="step" data-step="2">
                <div class="step-card">
                    <span class="step-num">{t[lang].stepCounter(3, 4)}</span>
                    <h3>{t[lang].s3Step3Heading}</h3>
                    <p>{t[lang].s3Step3Body}</p>
                    <a
                        class="source-link"
                        href={constants?.sources?.find(
                            (s) =>
                                s.field === "gdp.konsumsi_pemerintah.q3_2025",
                        )?.url ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer">{t[lang].s3SourceLabel}</a
                    >
                </div>
            </div>

            <div class="step" data-step="3">
                <div class="step-card">
                    <span class="step-num">{t[lang].stepCounter(4, 4)}</span>
                    <h3>{t[lang].s3Step4Heading}</h3>
                    <p>{t[lang].s3Step4Body}</p>
                    <a
                        class="source-link"
                        href={constants?.sources?.find(
                            (s) =>
                                s.field === "gdp.konsumsi_pemerintah.q1_2026",
                        )?.url ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer">{t[lang].s3SourceLabel}</a
                    >
                </div>
            </div>
        </div>
    </section>

    <!-- ━━━ S4 DATASET OVERVIEW ━━━ -->
    <section class="s4" data-section="s4" id="s4">
        <div class="s4-inner">
            <div class="eyebrow">{t[lang].s4Eyebrow}</div>
            <h2 class="s4-heading">{t[lang].s4Heading}</h2>

            <div class="s4-stats-grid">
                <div class="s4-stat-cell">
                    {#if stats}
                        <div class="s4-stat-number">
                            Rp {fmtT(stats.totalPagu)} T
                        </div>
                        <div class="s4-stat-label">
                            {t[lang].s4TotalPaguLabel}
                        </div>
                    {:else}
                        <div class="s4-stat-number loading-pulse">--</div>
                        <div class="s4-stat-label">{t[lang].loading}</div>
                    {/if}
                </div>
                <div class="s4-stat-cell">
                    {#if stats}
                        <div class="s4-stat-number">
                            {fmtNum(stats.totalRecords)}
                        </div>
                        <div class="s4-stat-label">
                            {t[lang].s4RecordCountLabel}
                        </div>
                    {:else}
                        <div class="s4-stat-number loading-pulse">--</div>
                        <div class="s4-stat-label">{t[lang].loading}</div>
                    {/if}
                </div>
            </div>

            <h3 class="s4-breakdown-heading">
                {t[lang].s4LabelBreakdownHeading}
            </h3>

            <ul class="s4-breakdown">
                <li class="s4-row">
                    <span class="s4-dot" style="background: var(--absurd)"></span>
                    <span class="s4-row-label">{t[lang].s4LabelAbsurd}</span>
                    <span class="s4-row-count">
                        {#if stats}
                            {fmtCount(stats.labelCounts.absurd ?? 0, lang)}
                        {:else}
                            <span class="loading-pulse">--</span>
                        {/if}
                    </span>
                    <span class="s4-row-pagu">
                        {#if stats}
                            {fmtPaguShort(stats.labelPagu.absurd ?? 0, lang)}
                        {:else}
                            <span class="loading-pulse">--</span>
                        {/if}
                    </span>
                </li>
                <li class="s4-row">
                    <span class="s4-dot" style="background: var(--red)"></span>
                    <span class="s4-row-label">{t[lang].s4LabelHigh}</span>
                    <span class="s4-row-count"
                        >{stats ? fmtNum(stats.labelCounts.high) : "--"}
                        {lang === "id" ? "paket" : "packages"}</span
                    >
                    <span class="s4-row-pagu"
                        >Rp {stats ? fmtT(stats.labelPagu.high) : "--"} T</span
                    >
                </li>
                <li class="s4-row">
                    <span class="s4-dot" style="background: var(--amber)"
                    ></span>
                    <span class="s4-row-label">{t[lang].s4LabelMed}</span>
                    <span class="s4-row-count"
                        >{stats ? fmtNum(stats.labelCounts.med) : "--"}
                        {lang === "id" ? "paket" : "packages"}</span
                    >
                    <span class="s4-row-pagu"
                        >Rp {stats ? fmtT(stats.labelPagu.med) : "--"} T</span
                    >
                </li>
                <li class="s4-row">
                    <span
                        class="s4-dot"
                        style="background: rgba(237,232,220,0.3)"
                    ></span>
                    <span class="s4-row-label">{t[lang].s4LabelLow}</span>
                    <span class="s4-row-count"
                        >{stats ? fmtNum(stats.labelCounts.low) : "--"}
                        {lang === "id" ? "paket" : "packages"}</span
                    >
                    <span class="s4-row-pagu"
                        >Rp {stats ? fmtT(stats.labelPagu.low) : "--"} T</span
                    >
                </li>
            </ul>

            <p class="s4-disclaimer">{t[lang].s4Disclaimer}</p>
        </div>
    </section>

    <!-- ━━━ S5+S6 INSTITUTIONS ━━━ -->
    <section class="scrolly" data-section="s5" id="s5">
        <div class="sticky-col" class:chart--dimmed={s5ChartDimmed}>
            <div class="eyebrow">{t[lang].s5Eyebrow}</div>
            <h2 class="s5-sticky-heading">{t[lang].s5StickyHeading}</h2>
            <InstitutionsChart data={lembaga} step={activeStepS5} {lang} />
            <div class="step-indicator" aria-hidden="true">
                {#each [0, 1, 2] as s}
                    <div class="pip" class:active={activeStepS5 === s}></div>
                {/each}
            </div>
        </div>

        <div class="steps-col">
            <div class="step" data-step="0">
                <div class="step-card">
                    <span class="step-num">{t[lang].stepCounter(1, 3)}</span>
                    <h3>{t[lang].s5Step1Heading}</h3>
                    <p>{t[lang].s5Step1Body}</p>
                </div>
            </div>

            <div class="step" data-step="1">
                <div class="step-card">
                    <span class="step-num">{t[lang].stepCounter(2, 3)}</span>
                    <h3>{t[lang].s5Step2Heading}</h3>
                    <p>{t[lang].s5Step2Body}</p>
                </div>
            </div>

            <div class="step" data-step="2">
                <div class="step-card">
                    <span class="step-num">{t[lang].stepCounter(3, 3)}</span>
                    <h3>{t[lang].s6Step1Heading}</h3>
                    <p>{t[lang].s6Step1Body}</p>
                    <span class="s6-transition-label" aria-live="polite">
                        {activeStepS5 >= 2 ? t[lang].s6TransitionLabel : ""}
                    </span>
                </div>
            </div>
        </div>
    </section>

    <!-- ━━━ S7 ANCHOR COUNT-UP ━━━ -->
    <section class="scrolly" data-section="s7" id="s7">
        <div class="sticky-col" class:chart--dimmed={s7ChartDimmed}>
            <div class="eyebrow">{t[lang].s7Eyebrow}</div>
            <h2 class="s7-sticky-heading">
                {#if stats}
                    {lang === "id"
                        ? `Rp ${fmtT(stats.labelPagu.high)} T untuk pengadaan bermasalah`
                        : `Rp ${fmtT(stats.labelPagu.high)} T for inappropriate procurement`}
                {:else}
                    {t[lang].s7StickyHeading}
                {/if}
            </h2>

            <span class="s7-transition-label" aria-live="polite"
                >{s7ShowTransition ? t[lang].s7TransitionLabel : ""}</span
            >

            <div class="s7-anchor-pair">
                {#if activeStepS7 === 0}
                    <div class="s7-anchor">
                        {#if stats && constants}
                            <span class="s7-anchor-figure is-gold"
                                >{fmtCount(kopiCount, lang)}</span
                            >
                        {:else}
                            <span class="s7-anchor-figure is-gold loading-pulse"
                                >—</span
                            >
                        {/if}
                        <span class="s7-anchor-label"
                            >{t[lang].s7KopiLabel}</span
                        >
                        <span class="s7-anchor-citation"
                            >{t[lang].s7SourcePrefix}Rp {fmtNum(
                                constants?.anchors?.kopi?.price ?? 0,
                            )} — {constants?.anchors?.kopi?.sourceLabel ??
                                ""}</span
                        >
                    </div>
                    <div class="s7-anchor">
                        {#if stats && constants}
                            <span class="s7-anchor-figure is-gold"
                                >{fmtCount(seblakCount, lang)}</span
                            >
                        {:else}
                            <span class="s7-anchor-figure is-gold loading-pulse"
                                >—</span
                            >
                        {/if}
                        <span class="s7-anchor-label"
                            >{t[lang].s7SeblakLabel}</span
                        >
                        <span class="s7-anchor-citation"
                            >{t[lang].s7SourcePrefix}Rp {fmtNum(
                                constants?.anchors?.seblak?.price ?? 0,
                            )} — {constants?.anchors?.seblak?.sourceLabel ??
                                ""}</span
                        >
                    </div>
                {:else}
                    <div class="s7-anchor">
                        {#if stats && constants}
                            <span class="s7-anchor-figure is-red"
                                >{fmtCount(sdCount, lang)}</span
                            >
                        {:else}
                            <span class="s7-anchor-figure is-red loading-pulse"
                                >—</span
                            >
                        {/if}
                        <span class="s7-anchor-label">{t[lang].s7SDLabel}</span>
                        <span class="s7-anchor-citation"
                            >{t[lang].s7SourcePrefix}Rp {fmtNum(
                                constants?.anchors?.sd?.price ?? 0,
                            )} — {constants?.anchors?.sd?.sourceLabel ??
                                ""}</span
                        >
                    </div>
                    <div class="s7-anchor">
                        {#if stats && constants}
                            <span class="s7-anchor-figure is-red"
                                >{fmtCount(puskesmasCount, lang)}</span
                            >
                        {:else}
                            <span class="s7-anchor-figure is-red loading-pulse"
                                >—</span
                            >
                        {/if}
                        <span class="s7-anchor-label"
                            >{t[lang].s7PuskesmasLabel}</span
                        >
                        <span class="s7-anchor-citation"
                            >{t[lang].s7SourcePrefix}Rp {fmtNum(
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
                    <span class="step-num">{t[lang].stepCounter(1, 2)}</span>
                    <h3>{t[lang].s7Step0Heading}</h3>
                    <p>{t[lang].s7Step0Body}</p>
                    <a
                        class="source-link"
                        href={constants?.anchors?.kopi?.source ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        >{constants?.anchors?.kopi?.sourceLabel ??
                            t[lang].s7KopiLabel}</a
                    >
                    <a
                        class="source-link"
                        href={constants?.anchors?.seblak?.source ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        >{constants?.anchors?.seblak?.sourceLabel ??
                            t[lang].s7SeblakLabel}</a
                    >
                </div>
            </div>

            <div class="step" data-step="1">
                <div class="step-card">
                    <span class="step-num">{t[lang].stepCounter(2, 2)}</span>
                    <h3>{t[lang].s7Step1Heading}</h3>
                    <p>{t[lang].s7Step1Body}</p>
                    <a
                        class="source-link"
                        href={constants?.anchors?.sd?.source ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        >{constants?.anchors?.sd?.sourceLabel ??
                            t[lang].s7SDLabel}</a
                    >
                    <a
                        class="source-link"
                        href={constants?.anchors?.puskesmas?.source ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        >{constants?.anchors?.puskesmas?.sourceLabel ??
                            t[lang].s7PuskesmasLabel}</a
                    >
                </div>
            </div>
        </div>
    </section>

    <!-- ━━━ S8 WORD CLOUD ━━━ -->
    <section class="scrolly" data-section="s8" id="s8">
        <div class="sticky-col" class:chart--dimmed={s8ChartDimmed}>
            <div
                class="s8-sticky-panel"
                onclick={(e) => {
                    if (
                        selectedWord &&
                        !e.target.closest(".s9-overlay") &&
                        !e.target.closest(".s8-cloud-word") &&
                        !e.target.closest(".s8-filter-bar")
                    ) {
                        selectedWord = null;
                    }
                }}
            >
                <div class="eyebrow">{t[lang].s8Eyebrow}</div>
                <h2 class="s8-sticky-heading">{t[lang].s8StickyHeading}</h2>

                <div class="s8-filter-bar">
                    <button
                        type="button"
                        class="s8-filter-pill"
                        class:is-active={activeFilter === "all"}
                        onclick={() => setFilter("all")}
                        >{t[lang].s8FilterAll}</button
                    >
                    <button
                        type="button"
                        class="s8-filter-pill"
                        class:is-active={activeFilter === "central"}
                        onclick={() => setFilter("central")}
                        >{t[lang].s8FilterCentral}</button
                    >
                    <button
                        type="button"
                        class="s8-filter-pill"
                        class:is-active={activeFilter === "district"}
                        onclick={() => setFilter("district")}
                        >{t[lang].s8FilterDistrict}</button
                    >

                    <div class="s8-search-wrap">
                        <input
                            type="text"
                            class="s8-search-input"
                            bind:value={lembagaSearch}
                            placeholder={t[lang].s8FilterInstitution}
                        />
                        {#if filteredInstitutions.length > 0}
                            <div class="s8-search-dropdown">
                                {#each filteredInstitutions as name}
                                    <button
                                        type="button"
                                        class="s8-search-item"
                                        onclick={() =>
                                            setFilter("lembaga", name)}
                                        >{name}</button
                                    >
                                {/each}
                            </div>
                        {/if}
                    </div>

                    {#if activeFilter !== "all" || activeLembaga}
                        <button
                            type="button"
                            class="s8-filter-reset"
                            onclick={() => setFilter("all")}
                            >{t[lang].s8FilterReset}</button
                        >
                    {/if}
                    {#if filterError}
                        <div class="s8-filter-error">{filterError}</div>
                    {/if}
                </div>

                {#if isNarrow}
                    <div class="s8-mobile-fallback-note">
                        {t[lang].s8MobileFallbackNote}
                    </div>
                {/if}

                {#if selectedWord}
                    <div class="s9-overlay">
                        <div class="s9-table-header">
                            <div class="s9-title-row">
                                <h3 class="s9-title">
                                    {#if lang === "id"}Paket dengan kata <span
                                            class="s9-title-word"
                                            >"{selectedWord}"</span
                                        >{:else}Packages containing <span
                                            class="s9-title-word"
                                            >"{selectedWord}"</span
                                        >{/if}
                                </h3>
                                <button
                                    type="button"
                                    class="s9-close"
                                    aria-label={t[lang].s9Close}
                                    onclick={() => (selectedWord = null)}
                                    >&#x2715;</button
                                >
                            </div>
                            <div class="s9-count">
                                {t[lang].s9RecordCount(wordRecords.length)}
                            </div>
                            {#if activeFilter === "lembaga"}
                                <div class="s9-fallback-note">
                                    {t[lang].s9FallbackNote}
                                </div>
                            {/if}
                        </div>

                        <div class="s9-table-body">
                            <table>
                                <thead>
                                    <tr>
                                        <th>{t[lang].s9ColLembaga}</th>
                                        <th>{t[lang].s9ColSatker}</th>
                                        <th class="s9-th-pagu"
                                            >{t[lang].s9ColPagu}</th
                                        >
                                        <th>{t[lang].s9ColPaket}</th>
                                        <th>{t[lang].s9ColReason}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {#if wordRecordsLoading}
                                        <tr
                                            ><td
                                                colspan="5"
                                                class="s9-loading loading-pulse"
                                                >{t[lang].s9Loading}</td
                                            ></tr
                                        >
                                    {:else if wordRecordsError}
                                        <tr
                                            ><td colspan="5" class="s9-error"
                                                >{wordRecordsError}</td
                                            ></tr
                                        >
                                    {:else if wordRecords.length === 0}
                                        <tr
                                            ><td colspan="5" class="s9-empty"
                                                >{t[lang].s8NoResults}</td
                                            ></tr
                                        >
                                    {:else}
                                        {#each wordRecords as r}
                                            <tr>
                                                <td>{r.lembaga}</td>
                                                <td>{r.satker}</td>
                                                <td class="s9-td-pagu"
                                                    >{fmtPaguShort(
                                                        r.pagu,
                                                        lang,
                                                    )}</td
                                                >
                                                <td>{r.paket}</td>
                                                <td>{r.inappropriateReason}</td>
                                            </tr>
                                        {/each}
                                    {/if}
                                </tbody>
                            </table>
                        </div>
                    </div>
                {:else if cloudWords.length === 0}
                    <div class="s8-empty">{t[lang].s8NoResults}</div>
                {:else}
                    <div class="s8-cloud" class:is-narrow={isNarrow}>
                        {#each cloudWords as w (w.word)}
                            <button
                                type="button"
                                class="s8-cloud-word"
                                class:is-selected={selectedWord === w.word}
                                aria-pressed={selectedWord === w.word}
                                style={isNarrow
                                    ? ""
                                    : `font-size: ${scaleFont(w.count, cloudMin, cloudMax)}rem`}
                                onclick={() => selectWord(w.word)}
                                >{w.word}</button
                            >
                        {/each}
                    </div>
                {/if}
            </div>
        </div>

        <div class="steps-col">
            <div class="step" data-step="0">
                <div class="step-card">
                    <span class="step-num">{t[lang].stepCounter(1, 1)}</span>
                    <h3>{t[lang].s8Step0Heading}</h3>
                    <p>{t[lang].s8Step0Body}</p>
                </div>
            </div>
        </div>
    </section>

    {#if fetchError}<div class="fetch-error">{fetchError}</div>{/if}
</div>

<style>
    /* ── Variables ── */
    :global(:root) {
        /* Surfaces */
        --bg: #0e0d0c;
        --bg-alt: #141210;
        --bg-card: #1a1714;

        /* Text */
        --text: #ede8dc;
        --muted: #6a6055;

        /* Accent */
        --gold: #c9a84c;

        /* Data signals */
        --red: #c44242;
        --absurd: #7a0000;
        --amber: #c4823a;
        --central: #5b8ed4;
        --provinsi: #5ba882;
        --kabkota: #c4a04a;
        --clean: #3a6b52;

        /* Structure */
        --border: rgba(237, 232, 220, 0.08);

        /* Spacing */
        --space-xs: 4px;
        --space-sm: 8px;
        --space-md: 16px;
        --space-lg: 24px;
        --space-xl: 32px;
        --space-2xl: 48px;
        --space-3xl: 64px;
        --space-page: 96px;
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
        border-bottom: 1px solid var(--border);
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
        font-family: "JetBrains Mono", "Courier New", monospace;
        font-size: 0.7rem;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: var(--gold);
        margin-bottom: 2.5rem;
        opacity: 0.85;
    }

    .hero h1 {
        font-family: "Libre Baskerville", Georgia, "Times New Roman", serif;
        font-size: clamp(2.8rem, 6vw, 5.5rem);
        font-weight: 700;
        line-height: 1.08;
        letter-spacing: -0.02em;
        color: var(--text);
        margin-bottom: 3rem;
    }

    .hero h1 em {
        font-style: italic;
        color: var(--gold);
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
        font-family: "JetBrains Mono", "Courier New", monospace;
        font-size: 0.7rem;
        letter-spacing: 0.15em;
        color: var(--muted);
        text-decoration: none;
        animation: bob 2.2s ease-in-out infinite;
        transition: color 0.2s;
    }
    .scroll-cue:hover {
        color: var(--gold);
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

    /* ── Language Toggle ── */
    .lang-toggle {
        position: fixed;
        top: 16px;
        right: 16px;
        z-index: 100;
        min-width: 44px;
        min-height: 44px;
        padding: 0 14px;
        border: 1px solid var(--border);
        background: var(--bg-card);
        border-radius: 9999px;
        color: var(--gold);
        font-family: "JetBrains Mono", monospace;
        font-size: 11px;
        letter-spacing: 0.1em;
        font-weight: 700;
        cursor: pointer;
        transition:
            opacity 0.15s ease,
            color 0.2s ease;
    }
    .lang-toggle:hover {
        opacity: 0.85;
    }

    /* ── Scrollytelling ── */
    .scrolly {
        display: flex;
        align-items: flex-start;
        border-bottom: 1px solid var(--border);
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
        transition: filter 0.3s ease;
        align-items: flex-start;
        justify-content: center;
        padding: 2rem 2.5rem;
        border-right: 1px solid var(--border);
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
        background: var(--border);
        transition:
            background 0.4s ease,
            width 0.4s ease;
    }

    .pip.active {
        background: var(--gold);
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
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 4px;
        padding: 2rem 1.75rem;
        max-width: 380px;
    }

    .step-card h3 {
        font-family: "Libre Baskerville", Georgia, serif;
        font-size: 1.45rem;
        font-weight: 700;
        line-height: 1.2;
        color: var(--text);
        margin: 0 0 var(--space-md) 0;
    }

    .step-num {
        font-family: "JetBrains Mono", "Courier New", monospace;
        font-size: 0.65rem;
        letter-spacing: 0.15em;
        color: var(--gold);
        display: block;
        margin-bottom: 0.9rem;
        opacity: 0.8;
    }

    .step-card p {
        font-size: 0.95rem;
        line-height: 1.72;
        color: var(--muted);
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
        font-family: "Libre Baskerville", Georgia, serif;
        font-size: clamp(2.2rem, 6vw, 5.5rem);
        font-weight: 700;
        line-height: 1.08;
        letter-spacing: -0.02em;
        color: var(--text);
        margin: 0;
        text-align: left;
    }

    .s1-display em {
        font-style: italic;
        color: var(--gold);
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
        color: var(--text);
        text-decoration: underline;
        text-decoration-color: var(--border);
        text-underline-offset: 3px;
        transition: text-decoration-color 0.15s ease;
    }

    .news-link:hover {
        text-decoration-color: var(--gold);
    }

    .s1-disclaimer {
        font-family: "JetBrains Mono", monospace;
        font-size: 0.7rem;
        color: var(--muted);
        margin-top: var(--space-lg);
    }

    /* -- S2 Deficit -- */
    /* -- S3 GDP -- */

    /* -- S4 Dataset -- */
    .s4 {
        background: var(--bg-alt);
        padding: var(--space-page) var(--space-xl);
        border-bottom: 1px solid var(--border);
    }

    /* -- S5+S6 Institutions -- */
    .s6-transition-label {
        display: inline-block;
        margin-top: var(--space-sm);
        font-family: "JetBrains Mono", monospace;
        font-size: 0.65rem;
        color: var(--muted);
        font-style: italic;
    }
    .s4-inner {
        max-width: 800px;
        margin: 0 auto;
    }
    .s4-heading {
        font-family: "Libre Baskerville", Georgia, serif;
        font-size: clamp(1.8rem, 4vw, 2.6rem);
        font-weight: 700;
        line-height: 1.2;
        color: var(--text);
        margin: 0 0 var(--space-2xl) 0;
        letter-spacing: -0.01em;
    }
    .s4-stats-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-xl);
        margin-bottom: var(--space-3xl);
    }
    .s4-stat-cell {
        padding: var(--space-lg);
        border: 1px solid var(--border);
        border-radius: 3px;
        background: rgba(255, 255, 255, 0.02);
    }
    .s4-stat-number {
        font-family: "Libre Baskerville", Georgia, serif;
        font-size: clamp(2.2rem, 5vw, 3.8rem);
        font-weight: 700;
        color: var(--gold);
        line-height: 1;
        margin-bottom: var(--space-sm);
        letter-spacing: -0.02em;
    }
    .s4-stat-label {
        font-size: 0.88rem;
        color: var(--muted);
        font-style: italic;
        line-height: 1.5;
    }
    .s4-breakdown-heading {
        font-family: "Libre Baskerville", Georgia, serif;
        font-size: 1.45rem;
        font-weight: 700;
        color: var(--text);
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
        border-bottom: 1px solid var(--border);
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
        color: var(--text);
        font-size: 1rem;
    }
    .s4-row-count,
    .s4-row-pagu {
        font-family: "JetBrains Mono", monospace;
        font-size: 0.8rem;
        color: var(--muted);
    }
    .s4-disclaimer {
        font-family: "JetBrains Mono", monospace;
        font-size: 0.7rem;
        color: var(--muted);
        font-style: italic;
        max-width: 520px;
        margin: var(--space-md) 0 0 0;
        padding-top: var(--space-md);
        border-top: 1px solid var(--border);
        line-height: 1.6;
    }

    .source-link {
        display: inline-block;
        margin-top: var(--space-md);
        font-family: "JetBrains Mono", monospace;
        font-size: 0.7rem;
        color: var(--muted);
        text-decoration: underline;
        text-decoration-color: var(--border);
        text-underline-offset: 3px;
        min-height: 44px;
        padding: 8px 0;
        transition: color 0.15s ease;
    }

    .source-link:hover {
        color: var(--text);
    }

    .fetch-error {
        font-family: "JetBrains Mono", monospace;
        font-size: 11px;
        color: var(--amber);
        padding: var(--space-md);
        text-align: center;
    }

    /* -- S7 Anchor Count-Up -- */
    .s7-sticky-heading {
        font-family: "Libre Baskerville", Georgia, serif;
        font-size: clamp(1.4rem, 3vw, 2rem);
        font-weight: 700;
        color: var(--text);
        margin: 0 0 var(--space-lg) 0;
        line-height: 1.2;
    }

    .s7-transition-label {
        display: block;
        min-height: 1.2em;
        font-family: "JetBrains Mono", monospace;
        font-size: 0.7rem;
        font-style: italic;
        color: var(--muted);
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
        font-family: "Libre Baskerville", Georgia, serif;
        font-size: clamp(2.2rem, 5vw, 3.8rem);
        font-weight: 700;
        line-height: 1.08;
        letter-spacing: -0.02em;
    }

    .s7-anchor-figure.is-gold {
        color: var(--gold);
    }
    .s7-anchor-figure.is-red {
        color: var(--red);
    }

    .s7-anchor-label {
        font-family: "Source Serif 4", Georgia, serif;
        font-size: 0.9rem;
        color: var(--muted);
        line-height: 1.4;
    }

    .s7-anchor-citation {
        font-family: "JetBrains Mono", monospace;
        font-size: 0.7rem;
        color: var(--muted);
        line-height: 1.5;
    }

    /* -- S8 Word Cloud -- */
    .s8-sticky-panel {
        position: relative;
        height: 100%;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        padding: var(--space-lg);
    }

    .s8-sticky-heading {
        font-family: "Libre Baskerville", Georgia, serif;
        font-size: clamp(1.4rem, 3vw, 2rem);
        font-weight: 700;
        color: var(--text);
        margin: 0 0 var(--space-md) 0;
        line-height: 1.2;
    }

    .s8-filter-bar {
        display: flex;
        gap: var(--space-sm);
        flex-wrap: wrap;
        align-items: center;
        padding: var(--space-md);
        border-bottom: 1px solid var(--border);
        background: var(--bg-alt);
        border-radius: 4px;
        margin-bottom: var(--space-md);
        position: relative;
    }

    .s8-filter-pill {
        border: 1px solid var(--border);
        color: var(--muted);
        background: transparent;
        border-radius: 20px;
        min-height: 44px;
        padding: var(--space-sm) var(--space-md);
        font-family: "JetBrains Mono", monospace;
        font-size: 0.7rem;
        cursor: pointer;
        transition:
            color 0.12s ease,
            border-color 0.12s ease;
    }

    .s8-filter-pill.is-active {
        border-color: var(--gold);
        color: var(--gold);
    }

    .s8-filter-pill:hover {
        color: var(--text);
    }

    .s8-search-wrap {
        position: relative;
        flex: 1;
        min-width: 180px;
    }

    .s8-search-input {
        width: 100%;
        border: 1px solid var(--border);
        background: var(--bg-card);
        color: var(--text);
        border-radius: 4px;
        padding: var(--space-sm) var(--space-md);
        min-height: 44px;
        font-family: "Source Serif 4", Georgia, serif;
        font-size: 0.9rem;
        box-sizing: border-box;
    }

    .s8-search-input::placeholder {
        color: var(--muted);
    }

    .s8-search-dropdown {
        position: absolute;
        top: calc(100% + 4px);
        left: 0;
        right: 0;
        max-height: 200px;
        overflow-y: auto;
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 4px;
        z-index: 5;
        display: flex;
        flex-direction: column;
    }

    .s8-search-item {
        min-height: 44px;
        padding: var(--space-sm) var(--space-md);
        cursor: pointer;
        color: var(--text);
        font-family: "Source Serif 4", Georgia, serif;
        font-size: 0.9rem;
        background: none;
        border: none;
        text-align: left;
        width: 100%;
        display: block;
    }

    .s8-search-item:hover {
        background: rgba(237, 232, 220, 0.05);
    }

    .s8-filter-reset {
        color: var(--muted);
        font-family: "JetBrains Mono", monospace;
        font-size: 0.7rem;
        background: none;
        border: none;
        cursor: pointer;
        min-height: 44px;
        padding: var(--space-sm) var(--space-md);
    }

    .s8-filter-reset:hover {
        color: var(--text);
    }

    .s8-filter-error {
        width: 100%;
        font-family: "JetBrains Mono", monospace;
        font-size: 0.7rem;
        color: var(--amber);
        padding: var(--space-sm) 0;
    }

    .s8-mobile-fallback-note {
        font-family: "JetBrains Mono", monospace;
        font-size: 0.7rem;
        color: var(--muted);
        margin-bottom: var(--space-sm);
    }

    .s8-cloud {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-sm);
        padding: var(--space-lg);
        align-content: flex-start;
        overflow-y: auto;
        flex: 1;
    }

    .s8-cloud.is-narrow {
        flex-wrap: nowrap;
        overflow-x: auto;
        overflow-y: hidden;
        padding: var(--space-md);
        -webkit-overflow-scrolling: touch;
        scroll-snap-type: x proximity;
    }

    .s8-cloud-word {
        background: none;
        border: none;
        cursor: pointer;
        padding: var(--space-sm) var(--space-md);
        min-height: 44px;
        font-family: "Source Serif 4", Georgia, serif;
        letter-spacing: 0.02em;
        color: var(--text);
        opacity: 0.85;
        transition:
            color 0.12s ease,
            opacity 0.12s ease;
        flex-shrink: 0;
    }

    .s8-cloud-word:hover {
        opacity: 1;
        text-decoration: underline;
        text-decoration-color: var(--border);
    }

    .s8-cloud-word.is-selected {
        color: var(--gold);
        font-weight: 700;
        opacity: 1;
        text-decoration: none;
    }

    .s8-cloud.is-narrow .s8-cloud-word {
        font-size: 0.9rem !important;
        padding: var(--space-xs) var(--space-sm);
        border: 1px solid rgba(237, 232, 220, 0.2);
        border-radius: 20px;
        scroll-snap-align: start;
    }

    .s8-cloud.is-narrow .s8-cloud-word.is-selected {
        border-color: var(--gold);
    }

    .s8-empty {
        padding: var(--space-lg);
        color: var(--muted);
        font-family: "JetBrains Mono", monospace;
        font-size: 0.7rem;
        font-style: italic;
    }

    /* -- S9 Record Table Overlay -- */
    .s9-overlay {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
        background: var(--bg-card);
        border-radius: 4px;
        overflow: hidden;
    }

    .s9-table-header {
        border-bottom: 1px solid var(--border);
        padding: var(--space-lg);
        background: var(--bg-card);
        flex-shrink: 0;
    }

    .s9-title-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: var(--space-md);
        margin-bottom: var(--space-sm);
    }

    .s9-title {
        font-family: "Libre Baskerville", Georgia, serif;
        font-size: 1.4rem;
        font-weight: 700;
        color: var(--text);
        margin: 0;
        line-height: 1.3;
    }

    .s9-title-word {
        color: var(--gold);
    }

    .s9-count {
        font-family: "JetBrains Mono", monospace;
        font-size: 0.7rem;
        color: var(--muted);
    }

    .s9-fallback-note {
        font-family: "JetBrains Mono", monospace;
        font-size: 0.7rem;
        font-style: italic;
        color: var(--muted);
        margin-top: var(--space-sm);
    }

    .s9-close {
        min-width: 44px;
        min-height: 44px;
        background: none;
        border: none;
        cursor: pointer;
        color: var(--muted);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
        transition: color 0.12s ease;
        flex-shrink: 0;
    }

    .s9-close:hover {
        color: var(--text);
    }

    .s9-table-body {
        overflow: auto;
        flex: 1;
        min-height: 0;
    }

    .s9-table-body table {
        width: 100%;
        border-collapse: collapse;
    }

    .s9-table-body thead {
        position: sticky;
        top: 0;
        background: var(--bg-card);
        z-index: 1;
    }

    .s9-table-body th {
        font-family: "JetBrains Mono", monospace;
        font-size: 0.7rem;
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: 0.1em;
        padding: var(--space-sm) var(--space-md);
        text-align: left;
        border-bottom: 1px solid var(--border);
    }

    .s9-table-body th.s9-th-pagu {
        text-align: right;
    }

    .s9-table-body td {
        font-family: "Source Serif 4", Georgia, serif;
        font-size: 0.9rem;
        color: var(--text);
        padding: var(--space-sm) var(--space-md);
        vertical-align: top;
        border-bottom: 1px solid var(--border);
        line-height: 1.5;
    }

    .s9-table-body td.s9-td-pagu {
        font-family: "JetBrains Mono", monospace;
        font-size: 0.7rem;
        text-align: right;
        white-space: nowrap;
    }

    .s9-table-body tr:hover td {
        background: rgba(237, 232, 220, 0.03);
    }

    .s9-loading,
    .s9-empty {
        color: var(--muted);
        text-align: center;
        padding: var(--space-lg);
        font-family: "JetBrains Mono", monospace;
        font-size: 0.7rem;
        font-style: italic;
    }

    .s9-error {
        color: var(--amber);
        text-align: center;
        padding: var(--space-md);
        font-family: "JetBrains Mono", monospace;
        font-size: 0.7rem;
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
            border-bottom: 1px solid var(--border);
            /* Ensure no overflow on the sticky container or its content clips
         correctly; overflow:hidden is safe on the sticky element itself. */
            overflow: hidden;
            z-index: 10;
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

        /* Dim and blur the sticky chart when a text step card overlaps it */
        .chart--dimmed {
            filter: blur(3px) brightness(0.35);
        }

        /* S4 mobile — collapse stats grid to single column */
        .s4-stats-grid {
            grid-template-columns: 1fr;
        }
        .s4 {
            padding: var(--space-2xl) var(--space-lg);
        }

        /* S9 mobile — table scrolls horizontally */
        .s9-table-body {
            overflow-x: auto;
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
</style>
