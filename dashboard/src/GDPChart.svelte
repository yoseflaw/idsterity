<script>
  import { onMount, onDestroy } from 'svelte'

  let { data = null, step = 0 } = $props()

  const STACK_WIDTH_DESKTOP = 64
  const STACK_WIDTH_MOBILE  = 44
  const MAX_HEIGHT_DESKTOP  = 200
  const MAX_HEIGHT_MOBILE   = 140
  const COIN_LAYER_HEIGHT   = 8
  const PCT_PER_PX          = 10

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

  // Step 2 highlights Q3 and Q4 together
  let activeKeys = $derived(
    step === 0 ? ['q1_2025'] :
    step === 1 ? ['q2_2025'] :
    step === 2 ? ['q3_2025', 'q4_2025'] :
                 ['q1_2026']
  )

  let points = $derived(
    [
      { key: 'q1_2025', period: 'TW I 2025'   },
      { key: 'q2_2025', period: 'TW II 2025'  },
      { key: 'q3_2025', period: 'TW III 2025' },
      { key: 'q4_2025', period: 'TW IV 2025'  },
      { key: 'q1_2026', period: 'TW I 2026'   },
    ].map((p, i) => {
      const valueRaw  = data?.[p.key] ?? 0
      const valueAbs  = Math.abs(valueRaw)
      const height    = Math.min(valueAbs * PCT_PER_PX, maxHeight)
      const isNegative = valueRaw < 0
      const xCenter   = padding + (i + 0.5) * (stackWidth + gap)
      const layers    = Math.ceil(height / COIN_LAYER_HEIGHT)
      const valueLabel = `${valueRaw > 0 ? '+' : ''}${valueRaw.toFixed(2)}%`
      return { ...p, valueRaw, valueAbs, height, isNegative, xCenter, layers, valueLabel }
    })
  )

  let baseline  = $derived(maxHeight + 40)
  let svgWidth  = $derived(padding * 2 + 5 * (stackWidth + gap))
  let svgHeight = $derived(baseline + 60)
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
    {#each points as p (p.key)}
      <g class="coin-stack"
         opacity={activeKeys.includes(p.key) ? 1 : 0.4}
         style="transform-origin: {p.xCenter}px {baseline}px;
                transform: scaleY({activeKeys.includes(p.key) ? 1.02 : 1});
                transition: opacity 0.3s ease, transform 0.3s ease">

        {#if p.isNegative}
          <!-- negative pit: coins rendered below the baseline -->

          <!-- edge face layers going down -->
          {#each Array(p.layers) as _, layer}
            <rect
              x={p.xCenter - stackWidth / 2}
              y={baseline + layer * COIN_LAYER_HEIGHT}
              width={stackWidth}
              height={COIN_LAYER_HEIGHT}
              fill="rgba(196,66,66,0.6)"
            />
          {/each}

          <!-- bottom face ellipse -->
          <ellipse
            cx={p.xCenter}
            cy={baseline + p.height}
            rx={stackWidth / 2}
            ry={stackWidth / 6}
            fill="rgba(196,66,66,0.6)"
          />

          <!-- value label below the pit -->
          <text
            x={p.xCenter}
            y={baseline + p.height + 12}
            text-anchor="middle"
            font-family="JetBrains Mono, monospace"
            font-size="11"
            fill="var(--red)"
          >{p.valueLabel}</text>

          <!-- period label further down to avoid collision -->
          <text
            x={p.xCenter}
            y={baseline + p.height + 28}
            text-anchor="middle"
            font-family="JetBrains Mono, monospace"
            font-size="10"
            fill="rgba(237,232,220,0.35)"
          >{p.period}</text>

        {:else}
          <!-- positive stack: coins rendered above the baseline -->

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
          >{p.valueLabel}</text>

          <!-- period label below -->
          <text
            x={p.xCenter}
            y={baseline + 20}
            text-anchor="middle"
            font-family="JetBrains Mono, monospace"
            font-size="10"
            fill="rgba(237,232,220,0.35)"
          >{p.period}</text>

        {/if}

      </g>
    {/each}

  </svg>
{/if}

<style>
  svg { width: 100%; height: auto; display: block; }
</style>
