<script>
  import { onMount, onDestroy } from 'svelte'
  import { scaleLinear, select, easeCubicInOut } from 'd3'

  let { data = [], step = 0, lang = 'id' } = $props()

  // S5 has 2 steps (indices 0 and 1); S6 starts at index 2
  const S6_STEP_INDEX = 2

  const BAR_HEIGHT_DESKTOP   = 18
  const BAR_HEIGHT_MOBILE    = 14
  const BAR_GAP              = 8
  const LABEL_WIDTH_DESKTOP  = 220
  const LABEL_WIDTH_MOBILE   = 130
  const MARGIN               = { top: 10, right: 24, bottom: 60, left: 12 }
  const NAME_MAX_DESKTOP     = 36
  const NAME_MAX_MOBILE      = 18
  const TOP_SHOW              = 5

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

  let barHeight    = $derived(isMobile ? BAR_HEIGHT_MOBILE    : BAR_HEIGHT_DESKTOP)
  let labelWidth   = $derived(isMobile ? LABEL_WIDTH_MOBILE   : LABEL_WIDTH_DESKTOP)
  let nameMax      = $derived(isMobile ? NAME_MAX_MOBILE       : NAME_MAX_DESKTOP)
  let maxValue     = $derived(Math.max(...data.map(d => d.total), 1))
  let barInnerWidth  = $derived(isMobile ? 200 : 480)
  let totalSvgWidth  = $derived(labelWidth + MARGIN.left + barInnerWidth + MARGIN.right)

  let sortedData = $derived(
    step >= S6_STEP_INDEX
      ? [...data].sort((a, b) => (b.highPagu + (b.absurdPagu ?? 0)) - (a.highPagu + (a.absurdPagu ?? 0)))
      : [...data].sort((a, b) => b.total - a.total)
  )

  let displayData  = $derived(sortedData.slice(0, TOP_SHOW))
  let chartHeight  = $derived(MARGIN.top + displayData.length * (barHeight + BAR_GAP) - BAR_GAP + MARGIN.bottom)

  let xScale = $derived(
    scaleLinear().domain([0, maxValue]).range([0, barInnerWidth])
  )

  const shortName = (name, max) =>
    name.length > max ? name.slice(0, max - 1) + '...' : name

  $effect(() => {
    if (!svgEl || displayData.length === 0) return
    const svg = select(svgEl)

    // Build a name→rank lookup from the current display order
    const rankMap = new Map(displayData.map((d, i) => [d.name, i]))

    // Transition each bar-group to its new vertical position.
    // We cannot use a D3 data join (Svelte owns the DOM), so we read the
    // data-name attribute we stamped on each group and look up its new rank.
    svg.selectAll('g.bar-group')
      .transition()
      .duration(600)
      .ease(easeCubicInOut)
      .attr('transform', function() {
        const name = this.getAttribute('data-name')
        const idx  = rankMap.has(name) ? rankMap.get(name) : 0
        return 'translate(' + (labelWidth + MARGIN.left) + ', ' + (MARGIN.top + idx * (barHeight + BAR_GAP)) + ')'
      })

    const colorOpacity = step >= 1 ? 1 : 0
    const dimOpacity   = step >= S6_STEP_INDEX ? 0.2 : 1

    svg.selectAll('rect.seg-med, rect.seg-high, rect.seg-absurd')
      .transition()
      .duration(400)
      .attr('opacity', colorOpacity)

    svg.selectAll('rect.seg-clean, rect.seg-low')
      .transition()
      .duration(400)
      .attr('opacity', dimOpacity)

    // For bar labels, read data-high-pagu to decide dim opacity
    svg.selectAll('text.bar-label')
      .transition()
      .duration(400)
      .attr('opacity', function() {
        const highPagu = parseFloat(this.getAttribute('data-high-pagu') || '0')
        return step >= S6_STEP_INDEX && highPagu === 0 ? 0.3 : 1
      })
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
       preserveAspectRatio="xMidYMin meet"
       style="overflow-x: hidden; display: block;">

    <!-- bars -->
    {#each displayData as d, idx (d.name)}
      {@const cleanPagu = d.total - d.flaggedPagu}
      <g class="bar-group"
         data-name={d.name}
         transform="translate({labelWidth + MARGIN.left}, {MARGIN.top + idx * (barHeight + BAR_GAP)})">

        <!-- clean segment -->
        <rect class="seg-clean"
              x={0}
              y={0}
              width={xScale(cleanPagu)}
              height={barHeight}
              fill="var(--clean)"/>

        <!-- low segment -->
        <rect class="seg-low"
              x={xScale(cleanPagu)}
              y={0}
              width={xScale(d.lowPagu)}
              height={barHeight}
              fill="rgba(237,232,220,0.2)"/>

        <!-- med segment -->
        <rect class="seg-med"
              x={xScale(cleanPagu + d.lowPagu)}
              y={0}
              width={xScale(d.medPagu)}
              height={barHeight}
              fill="var(--amber)"
              opacity="0"/>

        <!-- high segment -->
        <rect class="seg-high"
              x={xScale(cleanPagu + d.lowPagu + d.medPagu)}
              y={0}
              width={xScale(d.highPagu)}
              height={barHeight}
              fill="var(--red)"
              opacity="0"/>

        <!-- absurd segment -->
        <rect class="seg-absurd"
              x={xScale(cleanPagu + d.lowPagu + d.medPagu + d.highPagu)}
              y={0}
              width={xScale(d.absurdPagu ?? 0)}
              height={barHeight}
              fill="var(--absurd)"
              opacity="0"/>

        <!-- institution name label -->
        <text class="bar-label"
              data-high-pagu={d.highPagu}
              x={-12}
              y={barHeight / 2}
              text-anchor="end"
              dominant-baseline="middle"
              font-family="Source Serif 4, serif"
              font-size="12"
              fill="rgba(237,232,220,0.82)">{shortName(d.name, nameMax)}</text>

        {#if idx < 3}
          <text
            class="bar-medal"
            x={-(labelWidth - 8)}
            y={barHeight / 2}
            dominant-baseline="middle"
            font-size={isMobile ? "12" : "15"}
            text-anchor="start">
            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
          </text>
        {/if}
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
    overflow: hidden;
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
