<script>
  import BarChart from './BarChart.svelte'

  let data = $state([])

  fetch('/data/lembaga-totals.json')
    .then(r => r.json())
    .then(d => { data = d })
</script>

<main>
  <h1>Anggaran Pengadaan Pemerintah 2026</h1>
  <p>30 kementerian/lembaga dengan total nilai SIRUP terbesar, diurutkan dari terbesar ke terkecil.</p>

  {#if data.length === 0}
    <p class="loading">Memuat data…</p>
  {:else}
    <BarChart {data} />
  {/if}
</main>

<style>
  main {
    max-width: 1300px;
    margin: 0 auto;
    padding: 2.5rem 2rem;
    font-family: system-ui, -apple-system, sans-serif;
  }

  h1 {
    font-size: 1.6rem;
    font-weight: 700;
    color: #111827;
    margin-bottom: 0.4rem;
  }

  p {
    font-size: 0.95rem;
    color: #6b7280;
    margin-bottom: 2rem;
  }

  .loading {
    text-align: center;
    padding: 4rem;
  }
</style>
