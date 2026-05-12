<script>
  import { scaleLinear, scaleBand } from 'd3'

  let { data = [] } = $props()

  // layout
  const margin = { top: 20, right: 180, bottom: 60, left: 320 }
  const innerWidth = 700

  let innerHeight = $derived(data.length * 34)
  let svgWidth    = $derived(innerWidth + margin.left + margin.right)
  let svgHeight   = $derived(innerHeight + margin.top + margin.bottom)

  // scales
  let xMax  = $derived(data.length ? Math.max(...data.map(d => d.total)) : 0)
  let x     = $derived(scaleLinear().domain([0, xMax]).range([0, innerWidth]).nice())
  let y     = $derived(scaleBand().domain(data.map(d => d.name)).range([0, innerHeight]).padding(0.3))
  let ticks = $derived(x.ticks(5))

  // color by government level
  const COLORS = {
    central:  '#1d4ed8',
    provinsi: '#047857',
    kabkota:  '#b45309',
    unknown:  '#6b7280',
  }

  const LEGEND = [
    { key: 'central',  label: 'Pemerintah Pusat' },
    { key: 'provinsi', label: 'Provinsi' },
    { key: 'kabkota',  label: 'Kab/Kota' },
  ]

  const fmtIDR  = v => `Rp ${(v / 1e12).toFixed(1)}T`
  const barColor = t => COLORS[t] ?? COLORS.unknown
</script>

<div class="scroll-x">
  <svg width={svgWidth} height={svgHeight}>
    <g transform={`translate(${margin.left}, ${margin.top})`}>

      <!-- vertical grid lines -->
      {#each ticks as tick}
        <line x1={x(tick)} x2={x(tick)} y1={0} y2={innerHeight}
              stroke="#f3f4f6" stroke-width="1" />
      {/each}

      <!-- bars, org name labels, value labels -->
      {#each data as d}
        <rect
          x={0} y={y(d.name)}
          width={x(d.total)} height={y.bandwidth()}
          fill={barColor(d.ownerType)} rx="3"
        />
        <text
          x={-10} y={y(d.name) + y.bandwidth() / 2}
          text-anchor="end" dominant-baseline="middle"
          font-size="13" fill="#374151"
        >{d.name}</text>
        <text
          x={x(d.total) + 8} y={y(d.name) + y.bandwidth() / 2}
          dominant-baseline="middle"
          font-size="12" fill="#6b7280"
        >{fmtIDR(d.total)}</text>
      {/each}

      <!-- x-axis baseline + tick labels -->
      <line x1={0} x2={innerWidth} y1={innerHeight} y2={innerHeight} stroke="#e5e7eb" />
      {#each ticks as tick}
        <text x={x(tick)} y={innerHeight + 18}
              text-anchor="middle" font-size="11" fill="#9ca3af">
          {fmtIDR(tick)}
        </text>
      {/each}

      <!-- legend -->
      <g transform={`translate(0, ${innerHeight + 38})`}>
        {#each LEGEND as { key, label }, i}
          <rect x={i * 165} y={0} width={12} height={12} fill={COLORS[key]} rx="2" />
          <text x={i * 165 + 18} y={6}
                dominant-baseline="middle" font-size="12" fill="#6b7280">
            {label}
          </text>
        {/each}
      </g>

    </g>
  </svg>
</div>

<style>
  .scroll-x { overflow-x: auto; }
</style>
