<script>
  import { scaleLinear, scaleBand } from 'd3'

  let { data = [], step = 0 } = $props()

  const SHOW = 15
  const margin = { top: 32, right: 100, bottom: 52, left: 230 }
  const innerW  = 390

  let chartData = $derived(data.slice(0, SHOW))
  let innerH    = $derived(chartData.length * 38)
  let svgW      = $derived(innerW + margin.left + margin.right)
  let svgH      = $derived(innerH + margin.top + margin.bottom)

  let xMax = $derived(chartData.length ? Math.max(...chartData.map(d => d.total)) : 1)
  let x    = $derived(scaleLinear().domain([0, xMax]).range([0, innerW]).nice())
  let y    = $derived(scaleBand().domain(chartData.map(d => d.name)).range([0, innerH]).padding(0.3))
  let ticks = $derived(x.ticks(4))

  const C = {
    muted:    '#3d3830',
    central:  '#5b8ed4',
    provinsi: '#5ba882',
    kabkota:  '#c4a04a',
    clean:    '#3a6b52',
    high:     '#c44242',
    med:      '#c4823a',
  }

  const STEP_LABELS = [
    '15 Institusi dengan Anggaran Terbesar',
    'Dikelompokkan Berdasarkan Tingkat Pemerintahan',
    'Porsi yang Berpotensi Bermasalah',
    'Intensitas Potensi Masalah',
  ]

  function mainFill(d) {
    if (step <= 0) return C.muted
    if (step === 1) return C[d.ownerType] ?? C.muted
    return C.clean
  }

  function mainWidth(d) {
    if (step >= 2 && d.flaggedPagu > 0)
      return x(Math.max(0, d.total - d.flaggedPagu))
    return x(d.total)
  }

  function flagFill(d) {
    return d.highCount > 0 ? C.high : C.med
  }

  function nameFill(d) {
    if (step === 3 && d.flaggedCount === 0) return 'rgba(237,232,220,0.2)'
    return 'rgba(237,232,220,0.82)'
  }

  const fmtT      = v => `${(v / 1e12).toFixed(1)}T`
  const shortName = n => n.length > 28 ? n.slice(0, 27) + '…' : n
  const stepLabel = $derived(STEP_LABELS[Math.max(0, Math.min(step, 3))] ?? STEP_LABELS[0])
</script>

<div class="chart-container">
  <div class="chart-label">{stepLabel}</div>
  <svg
    viewBox="0 0 {svgW} {svgH}"
    style="width:100%;height:auto;overflow:visible;"
    role="img"
    aria-label="Grafik anggaran pengadaan pemerintah"
  >
    <g transform="translate({margin.left},{margin.top})">

      <!-- grid lines -->
      {#each ticks as t}
        <line
          x1={x(t)} x2={x(t)}
          y1={0}    y2={innerH}
          stroke="rgba(237,232,220,0.06)"
        />
      {/each}

      <!-- bars -->
      {#each chartData as d (d.name)}
        {@const yp  = y(d.name)}
        {@const bh  = y.bandwidth()}
        {@const mw  = mainWidth(d)}
        {@const fw  = x(d.flaggedPagu)}
        {@const fx  = x(Math.max(0, d.total - d.flaggedPagu))}

        <!-- clean / main portion -->
        <rect
          x="0" y={yp} height={bh} rx="2"
          style="
            width: {mw}px;
            fill: {mainFill(d)};
            transition: width 0.65s cubic-bezier(0.4,0,0.2,1), fill 0.45s ease;
          "
        />

        <!-- flagged portion -->
        <rect
          x={fx} y={yp} height={bh} rx="2"
          style="
            width: {step >= 2 ? fw : 0}px;
            fill: {flagFill(d)};
            opacity: {step >= 2 ? 1 : 0};
            transition: width 0.65s cubic-bezier(0.4,0,0.2,1), opacity 0.45s ease;
          "
        />

        <!-- institution name -->
        <text
          x={-10} y={yp + bh / 2}
          text-anchor="end" dominant-baseline="middle"
          font-size="11.5"
          style="
            fill: {nameFill(d)};
            transition: fill 0.5s ease;
            font-family: 'Source Serif 4', Georgia, serif;
          "
        >{shortName(d.name)}</text>

        <!-- value label -->
        <text
          x={x(d.total) + 8} y={yp + bh / 2}
          dominant-baseline="middle"
          font-size="10"
          style="fill: rgba(201,168,76,0.6); font-family: 'JetBrains Mono', monospace;"
        >{fmtT(d.total)}</text>
      {/each}

      <!-- x-axis baseline -->
      <line x1={0} x2={innerW} y1={innerH} y2={innerH} stroke="rgba(237,232,220,0.12)" />

      <!-- x-axis tick labels -->
      {#each ticks as t}
        <text
          x={x(t)} y={innerH + 18}
          text-anchor="middle" font-size="10"
          style="fill: rgba(237,232,220,0.3); font-family: 'JetBrains Mono', monospace;"
        >{fmtT(t)}</text>
      {/each}

      <!-- legend -->
      <g transform="translate(0, {innerH + 36})">
        {#if step <= 0}
          <rect x={0} y={0} width={10} height={10} fill={C.muted} rx="2"/>
          <text x={15} y={5} dominant-baseline="middle" font-size="10"
                style="fill:rgba(237,232,220,0.45);font-family:'Source Serif 4',serif;"
          >Total anggaran pengadaan</text>

        {:else if step === 1}
          {#each [['central','Pemerintah Pusat'],['provinsi','Provinsi'],['kabkota','Kab/Kota']] as [key, label], i}
            <rect x={i * 125} y={0} width={10} height={10} fill={C[key]} rx="2"/>
            <text x={i * 125 + 15} y={5} dominant-baseline="middle" font-size="10"
                  style="fill:rgba(237,232,220,0.45);font-family:'Source Serif 4',serif;"
            >{label}</text>
          {/each}

        {:else}
          <rect x={0}   y={0} width={10} height={10} fill={C.clean} rx="2"/>
          <text x={15}  y={5} dominant-baseline="middle" font-size="10"
                style="fill:rgba(237,232,220,0.45);font-family:'Source Serif 4',serif;"
          >Bersih</text>
          <rect x={70}  y={0} width={10} height={10} fill={C.med}   rx="2"/>
          <text x={85}  y={5} dominant-baseline="middle" font-size="10"
                style="fill:rgba(237,232,220,0.45);font-family:'Source Serif 4',serif;"
          >Potensi masalah (sedang)</text>
          <rect x={265} y={0} width={10} height={10} fill={C.high}  rx="2"/>
          <text x={280} y={5} dominant-baseline="middle" font-size="10"
                style="fill:rgba(237,232,220,0.45);font-family:'Source Serif 4',serif;"
          >Potensi masalah (tinggi)</text>
        {/if}
      </g>

    </g>
  </svg>
</div>

<style>
  .chart-container {
    width: 100%;
    padding: 1rem 0;
  }

  .chart-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.68rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(201, 168, 76, 0.7);
    margin-bottom: 1rem;
    padding-left: 0.5rem;
    transition: opacity 0.4s ease;
  }
</style>
