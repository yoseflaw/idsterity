<script>
  import { onMount, onDestroy } from 'svelte'
  import scrollama from 'scrollama'
  import { t } from './i18n.js'
  import DeficitChart from './DeficitChart.svelte'
  import GDPChart from './GDPChart.svelte'
  import InstitutionsChart from './InstitutionsChart.svelte'

  let stats      = $state(null)
  let lembaga    = $state([])
  let constants  = $state(null)
  let lang       = $state('id')

  let activeStepS1 = $state(0)
  let activeStepS2 = $state(0)
  let activeStepS3 = $state(0)
  let activeStepS5 = $state(0)
  let fetchError   = $state(null)

  let activeStepS7     = $state(0)
  let kopiCount        = $state(0)
  let seblakCount      = $state(0)
  let sdCount          = $state(0)
  let puskesmasCount   = $state(0)
  let s7ShowTransition = $state(false)
  let s7Timers         = []

  let scrollers = []
  const onResize = () => scrollers.forEach(s => s.resize())

  const safeFetch = url =>
    fetch(url).then(r => {
      if (!r.ok) throw new Error(`${r.status} ${r.statusText} — ${url}`)
      return r.json()
    })

  onMount(async () => {
    try {
      const [s, d, c] = await Promise.all([
        safeFetch('/data/summary-stats.json'),
        safeFetch('/data/lembaga-totals.json'),
        safeFetch('/data/constants.json'),
      ])
      stats     = s
      lembaga   = d
      constants = c
    } catch (err) {
      fetchError = lang === 'id' ? t.id.fetchError : t.en.fetchError
    }

    requestAnimationFrame(() => {
      // Use a lower offset on narrow viewports so step cards that fill the
      // entire screen (min-height: 100vh) still trigger the IntersectionObserver.
      // offset: 0.5 means 50% of the step must be visible — impossible when the
      // step fills the full viewport height on a small mobile screen.
      const isMobile = window.matchMedia('(max-width: 800px)').matches
      const offset   = isMobile ? 0.1 : 0.5

      const makeScroller = (sectionAttr, onEnter) => {
        const s = scrollama()
        s.setup({ step: `[data-section="${sectionAttr}"] [data-step]`, offset, progress: false })
         .onStepEnter(({ index }) => onEnter(index))
        return s
      }
      scrollers = [
        makeScroller('s1', i => { activeStepS1 = i }),
        makeScroller('s2', i => { activeStepS2 = i }),
        makeScroller('s3', i => { activeStepS3 = i }),
        makeScroller('s5', i => { activeStepS5 = i }),
        makeScroller('s7', i => { activeStepS7 = i }),
      ]
      window.addEventListener('resize', onResize)
    })
  })

  onDestroy(() => {
    scrollers.forEach(s => s?.destroy())
    window.removeEventListener('resize', onResize)
    s7Timers.forEach(clearTimeout)
  })

  $effect(() => {
    if (!stats || !constants?.anchors) return
    s7Timers.forEach(clearTimeout)
    s7Timers = []
    const high = stats.labelPagu.high ?? 0
    if (activeStepS7 === 0) {
      s7ShowTransition = false
      sdCount = 0
      puskesmasCount = 0
      countUp(Math.floor(high / constants.anchors.kopi.price), 1800, v => { kopiCount = v })
      countUp(Math.floor(high / constants.anchors.seblak.price), 1800, v => { seblakCount = v })
    } else if (activeStepS7 === 1) {
      s7ShowTransition = true
      sdCount = 0
      puskesmasCount = 0
      s7Timers.push(setTimeout(() => {
        countUp(Math.floor(high / constants.anchors.sd.price), 1800, v => { sdCount = v })
      }, 300))
      s7Timers.push(setTimeout(() => {
        countUp(Math.floor(high / constants.anchors.puskesmas.price), 1800, v => { puskesmasCount = v })
      }, 450))
    }
  })

  const fmtT   = v => (v / 1e12).toFixed(1)
  const fmtNum = v => v.toLocaleString('id-ID')
  const fmtCount = (v, l) => v.toLocaleString(l === 'id' ? 'id-ID' : 'en-US')

  function countUp(target, duration, onUpdate, onDone) {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) { onUpdate(target); onDone?.(); return }
    const start = performance.now()
    function frame(now) {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      onUpdate(Math.floor(eased * target))
      if (t < 1) requestAnimationFrame(frame)
      else { onUpdate(target); onDone?.() }
    }
    requestAnimationFrame(frame)
  }

  function toggleLang() {
    const y = window.scrollY
    lang = lang === 'id' ? 'en' : 'id'
    requestAnimationFrame(() => window.scrollTo(0, y))
  }
</script>

<div class="site">

  <button class="lang-toggle" onclick={toggleLang}>{t[lang].toggleLabel}</button>

  <!-- ━━━ HERO ━━━ -->
  <section class="hero">
    <div class="grain"></div>
    <div class="hero-inner">
      <div class="eyebrow">{t[lang].eyebrow}</div>
      <h1>
        {t[lang].heroLine1}<br>
        <em>{t[lang].heroLine2}</em>
      </h1>
      {#if stats}
        <div class="hero-stat">
          <div class="hero-number">Rp {fmtT(stats.totalPagu)} T</div>
          <div class="hero-sublabel">
            {t[lang].heroPaketLabel} {fmtNum(stats.totalRecords)}<br>{t[lang].heroPaketSuffix}
          </div>
        </div>
      {:else}
        <div class="hero-stat loading-pulse">
          <div class="hero-number">Rp — T</div>
          <div class="hero-sublabel">{t[lang].loading}</div>
        </div>
      {/if}
      <a class="scroll-cue" href="#s1">{t[lang].scrollCue}</a>
    </div>
  </section>

  <!-- ━━━ S1 HOOK ━━━ -->
  <section class="scrolly" data-section="s1" id="s1">

    <div class="sticky-col">
      <div class="eyebrow">{t[lang].s1Eyebrow}</div>
      <h2 class="s1-display">{t[lang].s1DisplayLine1}<br/><em>{t[lang].s1DisplayLine2}</em></h2>
    </div>

    <div class="steps-col">
      <div class="step" data-step="0">
        <div class="step-card">
          <h3>{t[lang].s1StepHeading}</h3>
          <p>{t[lang].s1StepBody}</p>
          <ul class="news-links">
            <li>
              <a href="https://www.kompas.com/money/read/2024/10/25/100000526/prabowo-targetkan-efisiensi-rp-306-triliun-di-apbn-2025"
                 target="_blank" rel="noopener noreferrer" class="news-link">
                {t[lang].s1Link1Label}
              </a>
            </li>
            <li>
              <a href="https://nasional.tempo.co/read/1993456/instruksi-presiden-pangkas-anggaran-perjalanan-dinas-dan-belanja-pemerintah"
                 target="_blank" rel="noopener noreferrer" class="news-link">
                {t[lang].s1Link2Label}
              </a>
            </li>
            <li>
              <a href="https://money.kompas.com/read/2025/08/16/120000626/menkeu-belanja-negara-harus-lebih-efisien-di-2026"
                 target="_blank" rel="noopener noreferrer" class="news-link">
                {t[lang].s1Link3Label}
              </a>
            </li>
            <li>
              <a href="https://www.cnnindonesia.com/ekonomi/20250301120000-532-1234567/pemerintah-pangkas-subsidi-demi-efisiensi-fiskal"
                 target="_blank" rel="noopener noreferrer" class="news-link">
                {t[lang].s1Link4Label}
              </a>
            </li>
            <li>
              <a href="https://kontan.co.id/news/sri-mulyani-defisit-apbn-harus-dijaga-ketat-di-2025"
                 target="_blank" rel="noopener noreferrer" class="news-link">
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

    <div class="sticky-col">
      <div class="eyebrow">{t[lang].s2Eyebrow}</div>
      <DeficitChart data={constants?.apbn?.deficit} step={activeStepS2} lang={lang} />
      <div class="step-indicator" aria-hidden="true">
        {#each [0,1,2] as s}
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
          <a class="source-link"
             href={constants?.sources?.find(s => s.field === 'apbn.deficit.fy2025')?.url ?? '#'}
             target="_blank" rel="noopener noreferrer">{t[lang].s2SourceLabel}</a>
        </div>
      </div>

      <div class="step" data-step="1">
        <div class="step-card">
          <span class="step-num">{t[lang].stepCounter(2, 3)}</span>
          <h3>{t[lang].s2Step2Heading}</h3>
          <p>{t[lang].s2Step2Body}</p>
          <a class="source-link"
             href={constants?.sources?.find(s => s.field === 'apbn.deficit.fy2025')?.url ?? '#'}
             target="_blank" rel="noopener noreferrer">{t[lang].s2SourceLabel}</a>
        </div>
      </div>

      <div class="step" data-step="2">
        <div class="step-card">
          <span class="step-num">{t[lang].stepCounter(3, 3)}</span>
          <h3>{t[lang].s2Step3Heading}</h3>
          <p>{t[lang].s2Step3Body}</p>
          <a class="source-link"
             href={constants?.sources?.find(s => s.field === 'apbn.deficit.fy2025')?.url ?? '#'}
             target="_blank" rel="noopener noreferrer">{t[lang].s2SourceLabel}</a>
        </div>
      </div>

    </div>

  </section>

  <!-- ━━━ S3 GDP CONSUMPTION ━━━ -->
  <section class="scrolly" data-section="s3" id="s3">

    <div class="sticky-col">
      <div class="eyebrow">{t[lang].s3Eyebrow}</div>
      <GDPChart data={constants?.gdp?.konsumsi_pemerintah} step={activeStepS3} lang={lang} />
      <div class="step-indicator" aria-hidden="true">
        {#each [0,1,2,3] as s}
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
          <a class="source-link"
             href={constants?.sources?.find(s => s.field === 'gdp.konsumsi_pemerintah.q2_2025')?.url ?? '#'}
             target="_blank" rel="noopener noreferrer">{t[lang].s3SourceLabel}</a>
        </div>
      </div>

      <div class="step" data-step="1">
        <div class="step-card">
          <span class="step-num">{t[lang].stepCounter(2, 4)}</span>
          <h3>{t[lang].s3Step2Heading}</h3>
          <p>{t[lang].s3Step2Body}</p>
          <a class="source-link"
             href={constants?.sources?.find(s => s.field === 'gdp.konsumsi_pemerintah.q2_2025')?.url ?? '#'}
             target="_blank" rel="noopener noreferrer">{t[lang].s3SourceLabel}</a>
        </div>
      </div>

      <div class="step" data-step="2">
        <div class="step-card">
          <span class="step-num">{t[lang].stepCounter(3, 4)}</span>
          <h3>{t[lang].s3Step3Heading}</h3>
          <p>{t[lang].s3Step3Body}</p>
          <a class="source-link"
             href={constants?.sources?.find(s => s.field === 'gdp.konsumsi_pemerintah.q2_2025')?.url ?? '#'}
             target="_blank" rel="noopener noreferrer">{t[lang].s3SourceLabel}</a>
        </div>
      </div>

      <div class="step" data-step="3">
        <div class="step-card">
          <span class="step-num">{t[lang].stepCounter(4, 4)}</span>
          <h3>{t[lang].s3Step4Heading}</h3>
          <p>{t[lang].s3Step4Body}</p>
          <a class="source-link"
             href={constants?.sources?.find(s => s.field === 'gdp.konsumsi_pemerintah.q2_2025')?.url ?? '#'}
             target="_blank" rel="noopener noreferrer">{t[lang].s3SourceLabel}</a>
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
            <div class="s4-stat-number">Rp {fmtT(stats.totalPagu)} T</div>
            <div class="s4-stat-label">{t[lang].s4TotalPaguLabel}</div>
          {:else}
            <div class="s4-stat-number loading-pulse">--</div>
            <div class="s4-stat-label">{t[lang].loading}</div>
          {/if}
        </div>
        <div class="s4-stat-cell">
          {#if stats}
            <div class="s4-stat-number">{fmtNum(stats.totalRecords)}</div>
            <div class="s4-stat-label">{t[lang].s4RecordCountLabel}</div>
          {:else}
            <div class="s4-stat-number loading-pulse">--</div>
            <div class="s4-stat-label">{t[lang].loading}</div>
          {/if}
        </div>
      </div>

      <h3 class="s4-breakdown-heading">{t[lang].s4LabelBreakdownHeading}</h3>

      <ul class="s4-breakdown">
        <li class="s4-row">
          <span class="s4-dot" style="background: var(--red)"></span>
          <span class="s4-row-label">{t[lang].s4LabelHigh}</span>
          <span class="s4-row-count">{stats ? fmtNum(stats.labelCounts.high) : '--'} {lang === 'id' ? 'paket' : 'packages'}</span>
          <span class="s4-row-pagu">Rp {stats ? fmtT(stats.labelPagu.high) : '--'} T</span>
        </li>
        <li class="s4-row">
          <span class="s4-dot" style="background: var(--amber)"></span>
          <span class="s4-row-label">{t[lang].s4LabelMed}</span>
          <span class="s4-row-count">{stats ? fmtNum(stats.labelCounts.med) : '--'} {lang === 'id' ? 'paket' : 'packages'}</span>
          <span class="s4-row-pagu">Rp {stats ? fmtT(stats.labelPagu.med) : '--'} T</span>
        </li>
        <li class="s4-row">
          <span class="s4-dot" style="background: rgba(237,232,220,0.3)"></span>
          <span class="s4-row-label">{t[lang].s4LabelLow}</span>
          <span class="s4-row-count">{stats ? fmtNum(stats.labelCounts.low) : '--'} {lang === 'id' ? 'paket' : 'packages'}</span>
          <span class="s4-row-pagu">Rp {stats ? fmtT(stats.labelPagu.low) : '--'} T</span>
        </li>
      </ul>

      <p class="s4-disclaimer">{t[lang].s4Disclaimer}</p>
    </div>
  </section>

  <!-- ━━━ S5+S6 INSTITUTIONS ━━━ -->
  <section class="scrolly" data-section="s5" id="s5">

    <div class="sticky-col">
      <div class="eyebrow">{t[lang].s5Eyebrow}</div>
      <InstitutionsChart data={lembaga} step={activeStepS5} lang={lang} />
      <div class="step-indicator" aria-hidden="true">
        {#each [0,1,2] as s}
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
            {activeStepS5 >= 2 ? t[lang].s6TransitionLabel : ''}
          </span>
        </div>
      </div>

    </div>

  </section>

  <!-- ━━━ S7 ANCHOR COUNT-UP ━━━ -->
  <section class="scrolly" data-section="s7" id="s7">

    <div class="sticky-col">
      <div class="eyebrow">{t[lang].s7Eyebrow}</div>
      <h2 class="s7-sticky-heading">{t[lang].s7StickyHeading}</h2>

      <span class="s7-transition-label" aria-live="polite">{s7ShowTransition ? t[lang].s7TransitionLabel : ''}</span>

      <div class="s7-anchor-pair">
        {#if activeStepS7 === 0}
          <div class="s7-anchor">
            {#if stats && constants}
              <span class="s7-anchor-figure is-gold">{fmtCount(kopiCount, lang)}</span>
            {:else}
              <span class="s7-anchor-figure is-gold loading-pulse">—</span>
            {/if}
            <span class="s7-anchor-label">{t[lang].s7KopiLabel}</span>
            <span class="s7-anchor-citation">{t[lang].s7SourcePrefix}Rp {fmtNum(constants?.anchors?.kopi?.price ?? 0)} — {constants?.anchors?.kopi?.sourceLabel ?? ''}</span>
          </div>
          <div class="s7-anchor">
            {#if stats && constants}
              <span class="s7-anchor-figure is-gold">{fmtCount(seblakCount, lang)}</span>
            {:else}
              <span class="s7-anchor-figure is-gold loading-pulse">—</span>
            {/if}
            <span class="s7-anchor-label">{t[lang].s7SeblakLabel}</span>
            <span class="s7-anchor-citation">{t[lang].s7SourcePrefix}Rp {fmtNum(constants?.anchors?.seblak?.price ?? 0)} — {constants?.anchors?.seblak?.sourceLabel ?? ''}</span>
          </div>
        {:else}
          <div class="s7-anchor">
            {#if stats && constants}
              <span class="s7-anchor-figure is-red">{fmtCount(sdCount, lang)}</span>
            {:else}
              <span class="s7-anchor-figure is-red loading-pulse">—</span>
            {/if}
            <span class="s7-anchor-label">{t[lang].s7SDLabel}</span>
            <span class="s7-anchor-citation">{t[lang].s7SourcePrefix}Rp {fmtNum(constants?.anchors?.sd?.price ?? 0)} — {constants?.anchors?.sd?.sourceLabel ?? ''}</span>
          </div>
          <div class="s7-anchor">
            {#if stats && constants}
              <span class="s7-anchor-figure is-red">{fmtCount(puskesmasCount, lang)}</span>
            {:else}
              <span class="s7-anchor-figure is-red loading-pulse">—</span>
            {/if}
            <span class="s7-anchor-label">{t[lang].s7PuskesmasLabel}</span>
            <span class="s7-anchor-citation">{t[lang].s7SourcePrefix}Rp {fmtNum(constants?.anchors?.puskesmas?.price ?? 0)} — {constants?.anchors?.puskesmas?.sourceLabel ?? ''}</span>
          </div>
        {/if}
      </div>

      <div class="step-indicator" aria-hidden="true">
        {#each [0,1] as s}
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
          <a class="source-link"
             href={constants?.anchors?.kopi?.source ?? '#'}
             target="_blank" rel="noopener noreferrer">{constants?.anchors?.kopi?.sourceLabel ?? t[lang].s7KopiLabel}</a>
          <a class="source-link"
             href={constants?.anchors?.seblak?.source ?? '#'}
             target="_blank" rel="noopener noreferrer">{constants?.anchors?.seblak?.sourceLabel ?? t[lang].s7SeblakLabel}</a>
        </div>
      </div>

      <div class="step" data-step="1">
        <div class="step-card">
          <span class="step-num">{t[lang].stepCounter(2, 2)}</span>
          <h3>{t[lang].s7Step1Heading}</h3>
          <p>{t[lang].s7Step1Body}</p>
          <a class="source-link"
             href={constants?.anchors?.sd?.source ?? '#'}
             target="_blank" rel="noopener noreferrer">{constants?.anchors?.sd?.sourceLabel ?? t[lang].s7SDLabel}</a>
          <a class="source-link"
             href={constants?.anchors?.puskesmas?.source ?? '#'}
             target="_blank" rel="noopener noreferrer">{constants?.anchors?.puskesmas?.sourceLabel ?? t[lang].s7PuskesmasLabel}</a>
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
    --bg:          #0e0d0c;
    --bg-alt:      #141210;
    --bg-card:     #1a1714;

    /* Text */
    --text:        #ede8dc;
    --muted:       #6a6055;

    /* Accent */
    --gold:        #c9a84c;

    /* Data signals */
    --red:         #c44242;
    --amber:       #c4823a;
    --central:     #5b8ed4;
    --provinsi:    #5ba882;
    --kabkota:     #c4a04a;
    --clean:       #3a6b52;

    /* Structure */
    --border:      rgba(237,232,220,0.08);

    /* Spacing */
    --space-xs:    4px;
    --space-sm:    8px;
    --space-md:    16px;
    --space-lg:    24px;
    --space-xl:    32px;
    --space-2xl:   48px;
    --space-3xl:   64px;
    --space-page:  96px;
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
    font-family: 'JetBrains Mono', 'Courier New', monospace;
    font-size: 0.7rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 2.5rem;
    opacity: 0.85;
  }

  .hero h1 {
    font-family: 'Libre Baskerville', Georgia, 'Times New Roman', serif;
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

  .hero-stat {
    display: block;
    width: fit-content;
    margin: 0 auto 3rem;
    padding: 1.5rem 2.5rem;
    border: 1px solid var(--border);
    border-radius: 3px;
    background: rgba(255,255,255,0.02);
  }

  .hero-number {
    font-family: 'Libre Baskerville', Georgia, 'Times New Roman', serif;
    font-size: clamp(2.2rem, 5vw, 3.8rem);
    font-weight: 700;
    color: var(--gold);
    line-height: 1;
    margin-bottom: 0.6rem;
    letter-spacing: -0.02em;
  }

  .hero-sublabel {
    font-size: 0.88rem;
    color: var(--muted);
    font-style: italic;
    line-height: 1.5;
  }

  .loading-pulse { animation: pulse 1.8s ease-in-out infinite; }
  @keyframes pulse { 0%,100% { opacity:0.5 } 50% { opacity:0.9 } }

  .scroll-cue {
    display: inline-block;
    font-family: 'JetBrains Mono', 'Courier New', monospace;
    font-size: 0.7rem;
    letter-spacing: 0.15em;
    color: var(--muted);
    text-decoration: none;
    animation: bob 2.2s ease-in-out infinite;
    transition: color 0.2s;
  }
  .scroll-cue:hover { color: var(--gold); }
  @keyframes bob {
    0%,100% { transform: translateY(0); }
    50%      { transform: translateY(7px); }
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
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.1em;
    font-weight: 700;
    cursor: pointer;
    transition: opacity 0.15s ease, color 0.2s ease;
  }
  .lang-toggle:hover { opacity: 0.85; }

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
    transition: background 0.4s ease, width 0.4s ease;
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
    font-family: 'Libre Baskerville', Georgia, serif;
    font-size: 1.45rem;
    font-weight: 700;
    line-height: 1.2;
    color: var(--text);
    margin: 0 0 var(--space-md) 0;
  }

  .step-num {
    font-family: 'JetBrains Mono', 'Courier New', monospace;
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
  :global(mark)         { background: transparent; padding: 0 1px; }
  :global(.c-central)  { color: var(--central);  border-bottom: 1px solid var(--central); }
  :global(.c-provinsi) { color: var(--provinsi); border-bottom: 1px solid var(--provinsi); }
  :global(.c-kabkota)  { color: var(--kabkota);  border-bottom: 1px solid var(--kabkota); }
  :global(.c-flagged)  { color: var(--amber);    border-bottom: 1px solid var(--amber); }

  /* ── S1 Hook ── */
  .s1-display {
    font-family: 'Libre Baskerville', Georgia, serif;
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
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem;
    color: var(--muted);
    margin-top: var(--space-lg);
  }

  /* -- S2 Deficit -- */
  /* -- S3 GDP -- */

  /* -- S4 Dataset -- */
  .s4 { background: var(--bg-alt); padding: var(--space-page) var(--space-xl); border-bottom: 1px solid var(--border); }

  /* -- S5+S6 Institutions -- */
  .s6-transition-label {
    display: inline-block;
    margin-top: var(--space-sm);
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.65rem;
    color: var(--muted);
    font-style: italic;
  }
  .s4-inner { max-width: 800px; margin: 0 auto; }
  .s4-heading { font-family: 'Libre Baskerville', Georgia, serif; font-size: clamp(1.8rem, 4vw, 2.6rem); font-weight: 700; line-height: 1.2; color: var(--text); margin: 0 0 var(--space-2xl) 0; letter-spacing: -0.01em; }
  .s4-stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-xl); margin-bottom: var(--space-3xl); }
  .s4-stat-cell { padding: var(--space-lg); border: 1px solid var(--border); border-radius: 3px; background: rgba(255,255,255,0.02); }
  .s4-stat-number { font-family: 'Libre Baskerville', Georgia, serif; font-size: clamp(2.2rem, 5vw, 3.8rem); font-weight: 700; color: var(--gold); line-height: 1; margin-bottom: var(--space-sm); letter-spacing: -0.02em; }
  .s4-stat-label { font-size: 0.88rem; color: var(--muted); font-style: italic; line-height: 1.5; }
  .s4-breakdown-heading { font-family: 'Libre Baskerville', Georgia, serif; font-size: 1.45rem; font-weight: 700; color: var(--text); margin: 0 0 var(--space-md) 0; }
  .s4-breakdown { list-style: none; padding: 0; margin: 0 0 var(--space-lg) 0; }
  .s4-row { display: flex; align-items: center; gap: var(--space-md); padding: var(--space-sm) 0; border-bottom: 1px solid var(--border); }
  .s4-row:last-child { border-bottom: none; }
  .s4-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
  .s4-row-label { flex: 1; color: var(--text); font-size: 1rem; }
  .s4-row-count, .s4-row-pagu { font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; color: var(--muted); }
  .s4-disclaimer { font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; color: var(--muted); font-style: italic; max-width: 520px; margin: var(--space-md) 0 0 0; padding-top: var(--space-md); border-top: 1px solid var(--border); line-height: 1.6; }

  .source-link {
    display: inline-block;
    margin-top: var(--space-md);
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem;
    color: var(--muted);
    text-decoration: underline;
    text-decoration-color: var(--border);
    text-underline-offset: 3px;
    min-height: 44px;
    padding: 8px 0;
    transition: color 0.15s ease;
  }

  .source-link:hover { color: var(--text); }

  .fetch-error {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: var(--amber);
    padding: var(--space-md);
    text-align: center;
  }

  /* -- S7 Anchor Count-Up -- */
  .s7-sticky-heading {
    font-family: 'Libre Baskerville', Georgia, serif;
    font-size: clamp(1.4rem, 3vw, 2rem);
    font-weight: 700;
    color: var(--text);
    margin: 0 0 var(--space-lg) 0;
    line-height: 1.2;
  }

  .s7-transition-label {
    display: block;
    min-height: 1.2em;
    font-family: 'JetBrains Mono', monospace;
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
    font-family: 'Libre Baskerville', Georgia, serif;
    font-size: clamp(2.2rem, 5vw, 3.8rem);
    font-weight: 700;
    line-height: 1.08;
    letter-spacing: -0.02em;
  }

  .s7-anchor-figure.is-gold { color: var(--gold); }
  .s7-anchor-figure.is-red  { color: var(--red); }

  .s7-anchor-label {
    font-family: 'Source Serif 4', Georgia, serif;
    font-size: 0.9rem;
    color: var(--muted);
    line-height: 1.4;
  }

  .s7-anchor-citation {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem;
    color: var(--muted);
    line-height: 1.5;
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
    .step-indicator { display: none; }

    /* S1 has no chart — let it scroll naturally, no sticky needed */
    [data-section="s1"] .sticky-col {
      position: relative;
      height: auto;
    }

    /* S4 mobile — collapse stats grid to single column */
    .s4-stats-grid { grid-template-columns: 1fr; }
    .s4 { padding: var(--space-2xl) var(--space-lg); }
  }
</style>
