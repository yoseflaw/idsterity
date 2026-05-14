<script>
  import { onMount, onDestroy } from 'svelte'
  import { scaleLinear, select, easeCubicInOut } from 'd3'

  let { data = [], step = 0, lang = 'id' } = $props()

  // S5 has 2 steps (indices 0 and 1); S6 starts at index 2
  const S6_STEP_INDEX = 2

  const BAR_HEIGHT          = 18
  const BAR_GAP             = 8
  const LABEL_WIDTH_DESKTOP = 220
  const LABEL_WIDTH_MOBILE  = 110
  const MARGIN              = { top: 10, right: 24, bottom: 60, left: 12 }
  const NAME_MAX_DESKTOP    = 36
  const NAME_MAX_MOBILE     = 18

  let svgEl    = $state(null)
  let isMobile = $state(false)
  let mq

  onMount(() => {
    mq = window.matchMedia('(max-width: 480px)')
    isMobile = mq.matches
    const onChange = e => { isMobile = e.matches }
    mq.addEventListener('change', onChange)
    onDestroy(() => mq.removeEventListener('change', onChange))
  })

  let labelWidth   = $derived(isMobile ? LABEL_WIDTH_MOBILE  : LABEL_WIDTH_DESKTOP)
  let nameMax      = $derived(isMobile ? NAME_MAX_MOBILE      : NAME_MAX_DESKTOP)
  let chartHeight  = $derived(MARGIN.top + data.length * (BAR_HEIGHT + BAR_GAP) - BAR_GAP + MARGIN.bottom)
  let maxValue     = $derived(Math.max(...data.map(d => d.total), 1))
  let barInnerWidth  = $derived(isMobile ? 240 : 480)
  let totalSvgWidth  = $derived(labelWidth + MARGIN.left + barInnerWidth + MARGIN.right)

  let sortedData = $derived(
    step >= S6_STEP_INDEX
      ? [...data].sort((a, b) => b.highPagu - a.highPagu)
      : [...data].sort((a, b) => b.total - a.total)
  )

  let xScale = $derived(
    scaleLinear().domain([0, maxValue]).range([0, barInnerWidth])
  )

  const shortName = (name, max) =>
    name.length > max ? name.slice(0, max - 1) + '...' : name

  $effect(() => {
    if (!svgEl || sortedData.length === 0) return
    const svg    = select(svgEl)
    const groups = svg.selectAll('g.bar-group').data(sortedData, d => d.name)

    groups
      .transition()
      .duration(600)
      .ease(easeCubicInOut)
      .attr('transform', d => {
        const idx = sortedData.findIndex(x => x.name === d.name)
        return 'translate(' + (labelWidth + MARGIN.left) + ', ' + (MARGIN.top + idx * (BAR_HEIGHT + BAR_GAP)) + ')'
      })

    const dimOpacity = step >= S6_STEP_INDEX ? 0.2 : 1
    svg.selectAll('rect.seg-clean, rect.seg-low')
      .transition()
      .duration(400)
      .attr('opacity', dimOpacity)

    svg.selectAll('rect.seg-med')
      .transition()
      .duration(400)
      .attr('opacity', step >= S6_STEP_INDEX ? 0.5 : 1)

    svg.selectAll('text.bar-label')
      .transition()
      .duration(400)
      .attr('opacity', d => step >= S6_STEP_INDEX && d.highPagu === 0 ? 0.3 : 1)
  })
</script>

{#if data.length === 0}
  <!-- skeleton -->
  <svg width="100%" height="200">
    <rect width="100%" height="200" fill="var(--bg-alt)" rx="2"/>
    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
          font-family="JetBrains Mono, monospace" font-size="11"
          fill="var(--muted)">{lang === 'id' ? 'memuat...' : 'loading...'}</text>
  </svg>
{:else}
  <svg bind:this={svgEl}
       width="100%"
       height={chartHeight}
       viewBox="0 0 {totalSvgWidth} {chartHeight}"
       preserveAspectRatio="xMidYMin meet">

    <!-- bars -->
    {#each data as d (d.name)}
      {@const cleanPagu = d.total - d.flaggedPagu}
      {@const idx = sortedData.findIndex(x => x.name === d.name)}
      <g class="bar-group"
         transform="translate({labelWidth + MARGIN.left}, {MARGIN.top + idx * (BAR_HEIGHT + BAR_GAP)})">

        <!-- clean segment -->
        <rect class="seg-clean"
              x={0}
              y={0}
              width={xScale(cleanPagu)}
              height={BAR_HEIGHT}
              fill="var(--clean)"/>

        <!-- low segment -->
        <rect class="seg-low"
              x={xScale(cleanPagu)}
              y={0}
              width={xScale(d.lowPagu)}
              height={BAR_HEIGHT}
              fill="rgba(237,232,220,0.2)"/>

        <!-- med segment -->
        <rect class="seg-med"
              x={xScale(cleanPagu + d.lowPagu)}
              y={0}
              width={xScale(d.medPagu)}
              height={BAR_HEIGHT}
              fill="var(--amber)"/>

        <!-- high segment -->
        <rect class="seg-high"
              x={xScale(cleanPagu + d.lowPagu + d.medPagu)}
              y={0}
              width={xScale(d.highPagu)}
              height={BAR_HEIGHT}
              fill="var(--red)"/>

        <!-- institution name label -->
        <text class="bar-label"
              x={-12}
              y={BAR_HEIGHT / 2}
              text-anchor="end"
              dominant-baseline="middle"
              font-family="Source Serif 4, serif"
              font-size="12"
              fill="rgba(237,232,220,0.82)">{shortName(d.name, nameMax)}</text>
      </g>
    {/each}

  </svg>
{/if}

<!-- legend -->
<div class="legend">
  <span class="legend-item">
    <span class="swatch" style="background: var(--red)"></span>
    {lang === 'id' ? 'Bermasalah' : 'Inappropriate'}
  </span>
  <span class="legend-item">
    <span class="swatch" style="background: var(--amber)"></span>
    {lang === 'id' ? 'Perlu dicermati' : 'Needs scrutiny'}
  </span>
  <span class="legend-item">
    <span class="swatch" style="background: rgba(237,232,220,0.2)"></span>
    {lang === 'id' ? 'Wajar' : 'Appropriate'}
  </span>
  <span class="legend-item">
    <span class="swatch" style="background: var(--clean)"></span>
    {lang === 'id' ? 'Tidak ditandai' : 'Unflagged'}
  </span>
</div>

<style>
  svg {
    width: 100%;
    height: auto;
    display: block;
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-md);
    margin-top: var(--space-md);
    justify-content: center;
  }

  .legend-item {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    font-family: 'Source Serif 4', serif;
    font-size: 10px;
    color: rgba(237,232,220,0.45);
  }

  .swatch {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 2px;
    flex-shrink: 0;
  }
</style>
