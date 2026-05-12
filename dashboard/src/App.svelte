<script>
  import { onMount } from 'svelte'
  import BarChart from './BarChart.svelte'

  let data       = $state([])
  let stats      = $state(null)
  let activeStep = $state(0)

  onMount(async () => {
    const [d, s] = await Promise.all([
      fetch('/data/lembaga-totals.json').then(r => r.json()),
      fetch('/data/summary-stats.json').then(r => r.json()),
    ])
    data  = d
    stats = s

    requestAnimationFrame(() => {
      const stepEls = document.querySelectorAll('[data-step]')
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            activeStep = Number(entry.target.dataset.step)
          }
        })
      }, { rootMargin: '-38% 0px -38% 0px', threshold: 0 })
      stepEls.forEach(el => observer.observe(el))
    })
  })

  const fmtT   = v => (v / 1e12).toFixed(1)
  const fmtPct = (a, b) => ((a / b) * 100).toFixed(1)
  const fmtNum = v => v.toLocaleString('id-ID')
</script>

<div class="site">

  <!-- ━━━ HERO ━━━ -->
  <section class="hero">
    <div class="grain"></div>
    <div class="hero-inner">
      <div class="eyebrow">idsterity &nbsp;·&nbsp; Analisis Pengadaan Indonesia 2026</div>
      <h1>
        Ke mana perginya<br>
        <em>uang rakyat?</em>
      </h1>
      {#if stats}
        <div class="hero-stat">
          <div class="hero-number">Rp {fmtT(stats.totalPagu)} T</div>
          <div class="hero-sublabel">
            dialokasikan dalam {fmtNum(stats.totalRecords)} paket<br>pengadaan pemerintah Indonesia
          </div>
        </div>
      {:else}
        <div class="hero-stat loading-pulse">
          <div class="hero-number">Rp — T</div>
          <div class="hero-sublabel">memuat data…</div>
        </div>
      {/if}
      <a class="scroll-cue" href="#story">gulir untuk menjelajahi ↓</a>
    </div>
  </section>

  <!-- ━━━ INTRO PROSE ━━━ -->
  <section class="prose-section" id="story">
    <div class="prose-inner">
      <p class="lead">
        Setiap tahun, pemerintah Indonesia mengalokasikan ratusan triliun rupiah melalui
        sistem SIRUP/LPSE untuk pengadaan barang dan jasa publik. Sebagian besar berjalan
        sesuai prosedur. Namun sebagian lainnya — ditandai oleh model AI kami —
        menunjukkan tanda-tanda potensi pemborosan atau ketidakwajaran.
      </p>

      {#if stats}
        <div class="callout-box">
          <div class="callout-figure">{fmtPct(stats.flaggedCount, stats.totalRecords)}%</div>
          <div class="callout-text">
            dari total pengadaan — atau <strong>{fmtNum(stats.flaggedCount)} paket</strong>
            senilai <strong>Rp {fmtT(stats.flaggedPagu)} triliun</strong> —
            ditandai berpotensi bermasalah.
          </div>
        </div>
      {/if}

      <p>
        Berikut adalah cerita tentang 15 institusi pemerintah dengan anggaran terbesar
        dan berapa dari anggaran mereka yang menarik perhatian sistem.
      </p>
    </div>
  </section>

  <!-- ━━━ SCROLLYTELLING ━━━ -->
  {#if data.length}
    <section class="scrolly">

      <!-- Sticky chart panel -->
      <div class="sticky-col">
        <div class="chart-wrap">
          <BarChart {data} step={activeStep} />
        </div>
        <div class="step-indicator">
          {#each [0,1,2,3] as s}
            <div class="pip" class:active={activeStep === s}></div>
          {/each}
        </div>
      </div>

      <!-- Scrolling text steps -->
      <div class="steps-col">

        <div class="step" data-step="0">
          <div class="step-card">
            <span class="step-num">01 / 04</span>
            <h3>15 Institusi Terbesar</h3>
            <p>
              Inilah 15 kementerian dan lembaga pemerintah dengan total nilai anggaran
              pengadaan terbesar di tahun 2026. Kementerian Pekerjaan Umum berdiri jauh
              di atas yang lain, mencerminkan dominasi belanja infrastruktur nasional.
            </p>
          </div>
        </div>

        <div class="step" data-step="1">
          <div class="step-card">
            <span class="step-num">02 / 04</span>
            <h3>Dari Mana Mereka?</h3>
            <p>
              Anggaran terbesar didominasi oleh
              <mark class="c-central">pemerintah pusat</mark>.
              Namun
              <mark class="c-kabkota">pemerintah kabupaten/kota</mark>
              juga muncul — ini yang perlu diperhatikan, karena pengawasan di daerah
              umumnya lebih lemah.
            </p>
          </div>
        </div>

        <div class="step" data-step="2">
          <div class="step-card">
            <span class="step-num">03 / 04</span>
            <h3>Yang Bermasalah</h3>
            <p>
              Bagian <mark class="c-flagged">berwarna merah-oranye</mark> pada setiap
              batang menunjukkan nilai pengadaan yang ditandai berpotensi tidak wajar.
              Beberapa institusi memiliki proporsi yang mengkhawatirkan dibanding total
              anggarannya.
            </p>
          </div>
        </div>

        <div class="step" data-step="3">
          <div class="step-card">
            <span class="step-num">04 / 04</span>
            <h3>Intensitas Masalah</h3>
            <p>
              Institusi tanpa paket bermasalah memudar ke latar belakang. Yang tersisa
              adalah mereka yang paling banyak menarik perhatian — bukan selalu yang
              terbesar, melainkan yang paling perlu diawasi.
            </p>
          </div>
        </div>

      </div>
    </section>
  {/if}

  <!-- ━━━ CLOSING ━━━ -->
  <section class="prose-section closing">
    <div class="prose-inner">
      <h2>Transparansi adalah kuncinya</h2>
      <p>
        Data ini bersumber dari LPSE/SIRUP, sistem pengadaan publik Indonesia yang dapat
        diakses oleh siapapun. Analisis dilakukan menggunakan model AI untuk mendeteksi
        potensi ketidakwajaran berdasarkan nama paket, nilai, dan konteks institusi.
      </p>
      <p>
        Tidak semua yang ditandai pasti bermasalah — namun semuanya layak mendapat
        perhatian lebih dari publik, lembaga pengawas, dan pers.
      </p>
      <div class="source-line">
        Sumber data: SIRUP 2026 &nbsp;·&nbsp; Analisis: idsterity &nbsp;·&nbsp;
        github.com/yoseflaw/idsterity &nbsp;·&nbsp;
        Terinspirasi oleh <a href="https://pudding.cool/2023/07/songwriters/" target="_blank" rel="noopener">The Pudding</a>
      </div>
    </div>
  </section>

</div>

<style>
  /* ── Variables ── */
  :global(:root) {
    --bg:       #0e0d0c;
    --bg-alt:   #141210;
    --bg-card:  #1a1714;
    --text:     #ede8dc;
    --muted:    #6a6055;
    --gold:     #c9a84c;
    --red:      #c44242;
    --amber:    #c4823a;
    --central:  #5b8ed4;
    --provinsi: #5ba882;
    --kabkota:  #c4a04a;
    --border:   rgba(237,232,220,0.08);
  }

  /* ── Layout ── */
  .site {
    max-width: 1440px;
    margin: 0 auto;
  }

  /* ── Hero ── */
  .hero {
    min-height: 100vh;
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
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 2.5rem;
    opacity: 0.85;
  }

  .hero h1 {
    font-family: 'Libre Baskerville', Georgia, serif;
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
    font-family: 'Libre Baskerville', Georgia, serif;
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
    font-family: 'JetBrains Mono', monospace;
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

  /* ── Prose sections ── */
  .prose-section {
    padding: 6rem 2rem;
    border-bottom: 1px solid var(--border);
  }

  .prose-inner {
    max-width: 640px;
    margin: 0 auto;
  }

  .lead {
    font-size: 1.2rem;
    line-height: 1.78;
    color: var(--text);
    margin-bottom: 2.5rem;
    font-weight: 300;
  }

  .prose-inner p {
    font-size: 1rem;
    line-height: 1.78;
    color: rgba(237,232,220,0.7);
    margin-bottom: 1.5rem;
  }

  .callout-box {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    border-left: 3px solid var(--red);
    padding: 1.25rem 1.5rem;
    background: rgba(196,66,66,0.06);
    border-radius: 0 3px 3px 0;
    margin-bottom: 2.5rem;
  }

  .callout-figure {
    font-family: 'Libre Baskerville', serif;
    font-size: 2.8rem;
    font-weight: 700;
    color: var(--red);
    line-height: 1;
    flex-shrink: 0;
  }

  .callout-text {
    font-size: 1rem;
    line-height: 1.6;
    color: var(--text);
  }

  .callout-text strong { color: var(--red); }

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
    height: 100vh;
    width: 60%;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem 2.5rem;
    border-right: 1px solid var(--border);
  }

  .chart-wrap { width: 100%; }

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
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.65rem;
    letter-spacing: 0.15em;
    color: var(--gold);
    display: block;
    margin-bottom: 0.9rem;
    opacity: 0.8;
  }

  .step-card h3 {
    font-family: 'Libre Baskerville', Georgia, serif;
    font-size: 1.45rem;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 0.85rem;
    line-height: 1.2;
  }

  .step-card p {
    font-size: 0.95rem;
    line-height: 1.72;
    color: rgba(237,232,220,0.65);
  }

  /* inline marks */
  :global(mark)        { background: transparent; padding: 0 1px; }
  :global(.c-central)  { color: var(--central);  border-bottom: 1px solid var(--central); }
  :global(.c-provinsi) { color: var(--provinsi); border-bottom: 1px solid var(--provinsi); }
  :global(.c-kabkota)  { color: var(--kabkota);  border-bottom: 1px solid var(--kabkota); }
  :global(.c-flagged)  { color: var(--amber);    border-bottom: 1px solid var(--amber); }

  /* ── Closing ── */
  .closing {
    border-bottom: none;
    padding-bottom: 8rem;
  }

  .closing h2 {
    font-family: 'Libre Baskerville', Georgia, serif;
    font-size: 2rem;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 1.5rem;
    letter-spacing: -0.02em;
  }

  .source-line {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.68rem;
    color: var(--muted);
    letter-spacing: 0.05em;
    margin-top: 2.5rem;
    padding-top: 2rem;
    border-top: 1px solid var(--border);
    line-height: 1.8;
  }

  .source-line a {
    color: var(--gold);
    text-decoration: none;
    opacity: 0.85;
    transition: opacity 0.2s;
  }
  .source-line a:hover { opacity: 1; }

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
  }
</style>
