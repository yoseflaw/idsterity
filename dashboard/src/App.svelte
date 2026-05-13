<script>
  import { onMount, onDestroy } from 'svelte'
  import scrollama from 'scrollama'
  import { t } from './i18n.js'

  let stats      = $state(null)
  let lembaga    = $state([])
  let constants  = $state(null)
  let lang       = $state('id')

  let activeStepS1 = $state(0)
  let activeStepS2 = $state(0)
  let activeStepS3 = $state(0)
  let activeStepS5 = $state(0)
  let fetchError   = $state(null)

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
      const makeScroller = (sectionAttr, onEnter) => {
        const s = scrollama()
        s.setup({ step: `[data-section="${sectionAttr}"] [data-step]`, offset: 0.5, progress: false })
         .onStepEnter(({ index }) => onEnter(index))
        return s
      }
      scrollers = [
        makeScroller('s1', i => { activeStepS1 = i }),
        makeScroller('s2', i => { activeStepS2 = i }),
        makeScroller('s3', i => { activeStepS3 = i }),
        makeScroller('s5', i => { activeStepS5 = i }),
      ]
      window.addEventListener('resize', onResize)
    })
  })

  onDestroy(() => {
    scrollers.forEach(s => s?.destroy())
    window.removeEventListener('resize', onResize)
  })

  const fmtT   = v => (v / 1e12).toFixed(1)
  const fmtNum = v => v.toLocaleString('id-ID')

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
    display: inline-block;
    margin-bottom: 3rem;
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

  .fetch-error {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: var(--amber);
    padding: var(--space-md);
    text-align: center;
  }

  /* ── Responsive ── */
  @media (max-width: 800px) {
    .scrolly { flex-direction: column; }
    .sticky-col {
      position: relative;
      width: 100%;
      height: auto;
      min-height: 60vh;
      border-right: none;
      border-bottom: 1px solid var(--border);
    }
    .steps-col { width: 100%; padding: 0 1.5rem; }
    .step-indicator { display: none; }
  }
</style>
