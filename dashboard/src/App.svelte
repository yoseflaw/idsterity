<script>
  import { onMount, onDestroy } from 'svelte'
  import scrollama from 'scrollama'
  import { t } from './i18n.js'

  let stats      = $state(null)
  let lembaga    = $state([])
  let constants  = $state(null)
  let lang       = $state('id')
  let activeStep = $state(0)

  let scroller
  const onResize = () => scroller && scroller.resize()

  onMount(async () => {
    const [s, d, c] = await Promise.all([
      fetch('/data/summary-stats.json').then(r => r.json()),
      fetch('/data/lembaga-totals.json').then(r => r.json()),
      fetch('/data/constants.json').then(r => r.json()),
    ])
    stats     = s
    lembaga   = d
    constants = c

    requestAnimationFrame(() => {
      scroller = scrollama()
      scroller
        .setup({ step: '[data-step]', offset: 0.5, progress: false })
        .onStepEnter(({ index }) => { activeStep = index })
      window.addEventListener('resize', onResize)
    })
  })

  onDestroy(() => {
    scroller?.destroy()
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
      <a class="scroll-cue" href="#story">{t[lang].scrollCue}</a>
    </div>
  </section>

  <!-- ━━━ SCROLLY (stub for Plan 02) ━━━ -->
  <section class="scrolly" id="story">

    <div class="sticky-col">
      <div class="chart-stub">{t[lang].sectionStub}</div>
      <div class="step-indicator" aria-hidden="true">
        {#each [0,1,2,3] as s}
          <div class="pip" class:active={activeStep === s}></div>
        {/each}
      </div>
    </div>

    <div class="steps-col">

      <div class="step" data-step="0">
        <div class="step-card">
          <span class="step-num">{t[lang].stepCounter(1, 4)}</span>
          <p>{t[lang].sectionStub}</p>
        </div>
      </div>

      <div class="step" data-step="1">
        <div class="step-card">
          <span class="step-num">{t[lang].stepCounter(2, 4)}</span>
          <p>{t[lang].sectionStub}</p>
        </div>
      </div>

      <div class="step" data-step="2">
        <div class="step-card">
          <span class="step-num">{t[lang].stepCounter(3, 4)}</span>
          <p>{t[lang].sectionStub}</p>
        </div>
      </div>

      <div class="step" data-step="3">
        <div class="step-card">
          <span class="step-num">{t[lang].stepCounter(4, 4)}</span>
          <p>{t[lang].sectionStub}</p>
        </div>
      </div>

    </div>

  </section>

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
    align-items: center;
    justify-content: center;
    padding: 2rem 2.5rem;
    border-right: 1px solid var(--border);
  }

  .chart-stub {
    width: 100%;
    border: 1px dashed var(--border);
    padding: 4rem 2rem;
    text-align: center;
    color: var(--muted);
    font-family: 'JetBrains Mono', 'Courier New', monospace;
    font-size: 0.75rem;
    letter-spacing: 0.1em;
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
