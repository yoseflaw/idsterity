<script>
  import { onMount, onDestroy } from 'svelte'
  import * as d3 from 'd3'

  let { data = null, step = 0 } = $props()

  const CHART_HEIGHT_DESKTOP = 260
  const CHART_HEIGHT_MOBILE  = 200
  const PAD_LEFT_DESKTOP     = 56
  const PAD_LEFT_MOBILE      = 40
  const PAD_RIGHT            = 24
  const PAD_TOP              = 40
  const PAD_BOTTOM           = 44

  const RED   = '#b03b3b'
  const GREEN = '#3ea862'

  let isMobile = $state(false)
  let mq

  onMount(() => {
    mq = window.matchMedia('(max-width: 480px)')
    isMobile = mq.matches
    const onChange = e => { isMobile = e.matches }
    mq.addEventListener('change', onChange)
    onDestroy(() => mq.removeEventListener('change', onChange))
  })

  let chartHeight = $derived(isMobile ? CHART_HEIGHT_MOBILE : CHART_HEIGHT_DESKTOP)
  let padLeft     = $derived(isMobile ? PAD_LEFT_MOBILE     : PAD_LEFT_DESKTOP)

  // svgWidth is fixed in viewBox space; preserveAspectRatio handles display scaling.
  let svgWidth  = $derived(isMobile ? 480 : 720)
  let svgHeight = $derived(chartHeight + PAD_TOP + PAD_BOTTOM)
  let innerW    = $derived(svgWidth - padLeft - PAD_RIGHT)
  let innerH    = $derived(chartHeight)

  // Step 2 highlights Q3 and Q4 together
  let activeKeys = $derived(
    step === 0 ? ['q1_2025'] :
    step === 1 ? ['q2_2025'] :
    step === 2 ? ['q3_2025', 'q4_2025'] :
                 ['q1_2026']
  )

  const QUARTERS = [
    { key: 'q1_2025', period: 'Q1 2025' },
    { key: 'q2_2025', period: 'Q2 2025' },
    { key: 'q3_2025', period: 'Q3 2025' },
    { key: 'q4_2025', period: 'Q4 2025' },
    { key: 'q1_2026', period: 'Q1 2026' },
  ]

  let values = $derived(QUARTERS.map(q => data?.[q.key] ?? 0))

  let yDomain = $derived.by(() => {
    const vs = values.length ? values : [0]
    const lo = Math.min(0, ...vs)
    const hi = Math.max(0, ...vs)
    const pad = Math.max(2, (hi - lo) * 0.15)
    return [lo - pad, hi + pad]
  })

  let xScale = $derived(
    d3.scalePoint()
      .domain(QUARTERS.map(q => q.key))
      .range([padLeft, padLeft + innerW])
      .padding(0.5)
  )

  let yScale = $derived(
    d3.scaleLinear()
      .domain(yDomain)
      .range([PAD_TOP + innerH, PAD_TOP])
  )

  let points = $derived(
    QUARTERS.map((q, i) => {
      const v = values[i]
      const isNegative = v < 0
      const color = isNegative ? GREEN : RED
      const valueLabel = `${v > 0 ? '+' : ''}${v.toFixed(2)}%`
      return {
        key: q.key,
        period: q.period,
        value: v,
        isNegative,
        color,
        valueLabel,
        x: xScale(q.key),
        y: yScale(v),
      }
    })
  )

  // Build per-segment paths so each line segment can be colored by the
  // destination point's sign. Default red; green when destination is negative.
  let segments = $derived.by(() => {
    const segs = []
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i]
      const b = points[i + 1]
      segs.push({
        d: `M ${a.x},${a.y} L ${b.x},${b.y}`,
        stroke: b.isNegative ? GREEN : RED,
      })
    }
    return segs
  })

  let zeroY = $derived(yScale(0))
</script>

{#if !data}
  <svg width="100%" height="200">
    <rect width="100%" height="200" fill="var(--bg-alt)" rx="2"/>
    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
          font-family="JetBrains Mono, monospace" font-size="11"
          fill="var(--muted)">memuat...</text>
  </svg>
{:else}
  <svg width="100%" height={svgHeight} viewBox="0 0 {svgWidth} {svgHeight}"
       preserveAspectRatio="xMidYMax meet">

    <!-- zero baseline (dashed) -->
    <line
      x1={padLeft - 4} x2={padLeft + innerW + 4}
      y1={zeroY} y2={zeroY}
      stroke="rgba(255,255,255,0.18)"
      stroke-width="1"
      stroke-dasharray="4 4"
    />
    <text
      x={padLeft - 8}
      y={zeroY}
      text-anchor="end"
      dominant-baseline="middle"
      class="axis-label"
    >0%</text>

    <!-- line segments (per-segment color) -->
    {#each segments as seg, i}
      <path
        d={seg.d}
        fill="none"
        stroke={seg.stroke}
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        opacity="0.9"
      />
    {/each}

    <!-- markers + labels -->
    {#each points as p (p.key)}
      <g
        class="marker"
        opacity={activeKeys.includes(p.key) ? 1 : 0.85}
        style="transition: opacity 0.3s ease"
      >
        <circle
          cx={p.x}
          cy={p.y}
          r={activeKeys.includes(p.key) ? 7 : 5}
          fill={p.color}
          stroke="var(--bg, #1a1a1a)"
          stroke-width="2"
          style="transition: r 0.3s ease"
        />

        <text
          x={p.x}
          y={p.isNegative ? p.y + 22 : p.y - 14}
          text-anchor="middle"
          class="data-label"
          fill={p.color}
        >{p.valueLabel}</text>

        <text
          x={p.x}
          y={PAD_TOP + innerH + 24}
          text-anchor="middle"
          class="period-label"
        >{p.period}</text>
      </g>
    {/each}

  </svg>
{/if}

<style>
  svg { width: 100%; height: auto; display: block; }

  .data-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px;
    opacity: 1;
    font-weight: 600;
  }
  .period-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    fill: rgba(237, 232, 220, 0.55);
  }
  .axis-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    fill: rgba(237, 232, 220, 0.45);
  }
  @media (min-width: 720px) {
    .data-label { font-size: 16px; }
    .period-label { font-size: 12px; }
    .axis-label { font-size: 12px; }
  }
</style>
