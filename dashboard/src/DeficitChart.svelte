<script>
  import { onMount, onDestroy } from 'svelte'

  let { data = null, step = 0 } = $props()

  const STACK_WIDTH_DESKTOP = 64
  const STACK_WIDTH_MOBILE  = 44
  const MAX_HEIGHT_DESKTOP  = 200
  const MAX_HEIGHT_MOBILE   = 140
  const COIN_LAYER_HEIGHT   = 8
  const TRIL_PER_PX         = 2

  let isMobile = $state(false)
  let mq

  onMount(() => {
    mq = window.matchMedia('(max-width: 480px)')
    isMobile = mq.matches
    const onChange = e => { isMobile = e.matches }
    mq.addEventListener('change', onChange)
    onDestroy(() => mq.removeEventListener('change', onChange))
  })

  let stackWidth = $derived(isMobile ? STACK_WIDTH_MOBILE : STACK_WIDTH_DESKTOP)
  let maxHeight  = $derived(isMobile ? MAX_HEIGHT_MOBILE  : MAX_HEIGHT_DESKTOP)

  const padding = 24
  let gap = $derived(stackWidth)

  let points = $derived(
    [
      { key: 'oct2024', period: 'Okt 2024'  },
      { key: 'fy2025',  period: '2025'      },
      { key: 'q1_2026', period: 'TW I 2026' },
    ].map((p, i) => {
      const valueRaw  = data?.[p.key] ?? 0
      const valueTril = Math.abs(valueRaw) / 1e12
      const height    = Math.min(valueTril * TRIL_PER_PX, maxHeight)
      const xCenter   = padding + (i + 0.5) * (stackWidth + gap)
      return { ...p, valueRaw, valueTril, height, xCenter, layers: Math.ceil(height / COIN_LAYER_HEIGHT) }
    })
  )

  let baseline  = $derived(maxHeight + 40)
  let svgWidth  = $derived(padding * 2 + 3 * (stackWidth + gap))
  let svgHeight = $derived(baseline + 40)
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

    <!-- baseline rule -->
    <line x1="0" x2={svgWidth} y1={baseline} y2={baseline}
          stroke="var(--border)" stroke-width="1"/>

    <!-- coin stacks -->
    {#each points as p, i (p.key)}
      <g class="coin-stack"
         opacity={step === i ? 1 : 0.4}
         style="transform-origin: {p.xCenter}px {baseline}px;
                transform: scaleY({step === i ? 1.02 : 1});
                transition: opacity 0.3s ease, transform 0.3s ease">

        <!-- edge face layers -->
        {#each Array(p.layers) as _, layer}
          <rect
            x={p.xCenter - stackWidth / 2}
            y={baseline - (layer + 1) * COIN_LAYER_HEIGHT}
            width={stackWidth}
            height={COIN_LAYER_HEIGHT}
            fill="rgba(201,168,76,0.45)"
          />
        {/each}

        <!-- top face ellipse -->
        <ellipse
          cx={p.xCenter}
          cy={baseline - p.height}
          rx={stackWidth / 2}
          ry={stackWidth / 6}
          fill="rgba(201,168,76,0.85)"
        />

        <!-- value label above -->
        <text
          x={p.xCenter}
          y={baseline - p.height - 12}
          text-anchor="middle"
          font-family="JetBrains Mono, monospace"
          font-size="11"
          fill="rgba(237,232,220,0.7)"
        >Rp {p.valueTril.toFixed(0)} T</text>

        <!-- period label below -->
        <text
          x={p.xCenter}
          y={baseline + 20}
          text-anchor="middle"
          font-family="JetBrains Mono, monospace"
          font-size="10"
          fill="rgba(237,232,220,0.35)"
        >{p.period}</text>

      </g>
    {/each}

  </svg>
{/if}

<style>
  svg { width: 100%; height: auto; display: block; }
</style>
