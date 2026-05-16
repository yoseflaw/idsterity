<script>
  import { abbreviateLembaga } from "./lembagaAbbreviations.js";

  let { data = [] } = $props();
  // data: array of lembaga records with { name, total } (top-5 expected; top-3 → podium, 4-5 → Juara Harapan)
  let top3    = $derived(data.slice(0, 3));
  let runners = $derived(data.slice(3, 5));

  // Display order on the podium: [2nd, 1st, 3rd] so 1st sits in the center
  let podiumOrder = $derived(
    top3.length === 3 ? [top3[1], top3[0], top3[2]] : top3
  );

  function fmtT(rupiah) {
    if (!rupiah) return "Rp 0";
    if (rupiah >= 1e12) return `Rp ${(rupiah / 1e12).toFixed(1)} T`;
    if (rupiah >= 1e9)  return `Rp ${(rupiah / 1e9).toFixed(1)} M`;
    return `Rp ${rupiah.toLocaleString("id-ID")}`;
  }

  // Heights for the [2nd, 1st, 3rd] order so 1st is the tallest in the center
  const HEIGHTS = [95, 140, 70]; // px (mobile-safe; CSS scales up on desktop)
  const MEDALS  = ["🥈", "🥇", "🥉"];
  // Warm palette per rank position in [2nd, 1st, 3rd] render order
  const WARM_FILLS   = ["var(--viz-warm)", "var(--viz-warm-dark)", "var(--viz-warm-light)"];
  const WARM_BORDERS = ["var(--viz-warm)", "var(--viz-warm-dark)", "var(--viz-warm-light)"];
</script>

<div class="podium-wrap">
  <div class="podium" role="list">
    {#each podiumOrder as d, i (d?.name ?? i)}
      <div class="col" role="listitem">
        <div class="medal-name">
          <span class="medal" aria-hidden="true">{MEDALS[i]}</span>
          <span class="name" title={d?.name}>{abbreviateLembaga(d?.name)}</span>
        </div>
        <div class="block" style="--h: {HEIGHTS[i]}px; --podium-fill: {WARM_FILLS[i]}; border-top-color: {WARM_BORDERS[i]};">
          <span class="value">{fmtT(d?.total)}</span>
        </div>
      </div>
    {/each}
  </div>

  {#if runners.length}
    <div class="juara-harapan">
      <span class="jh-label">Juara Harapan:</span>
      {#each runners as r, i (r?.name ?? i)}
        <div class="jh-row">{abbreviateLembaga(r?.name)} — {fmtT(r?.total)}</div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .podium-wrap {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }
  .podium {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    gap: 1rem;
    width: 100%;
    max-width: 44rem;
  }
  .col {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1 1 0;
    max-width: 12rem;
    min-width: 0;
  }
  .medal-name {
    text-align: center;
    margin-bottom: 0.5rem;
    min-height: 3.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    line-height: 1.2;
  }
  .medal {
    font-size: 1.5rem;
    line-height: 1;
  }
  .name {
    font-family: var(--mono);
    font-size: 0.85rem;
    color: var(--ink-3);
    text-align: center;
    margin-top: 0.25rem;
    word-break: break-word;
  }
  .block {
    width: 100%;
    height: var(--h, 100px);
    background: var(--podium-fill, var(--viz-warm));
    border-top: 2px solid var(--viz-warm);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .value {
    font-family: var(--mono);
    font-weight: 600;
    color: var(--bg-base);
    font-size: 1rem;
    text-align: center;
    padding: 0 0.25rem;
  }
  .juara-harapan {
    text-align: center;
    font-family: var(--mono);
    font-size: 0.8rem;
    color: var(--ink-3);
    margin: 0.25rem 0 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.15rem;
  }
  .jh-label {
    color: var(--viz-warm-dark);
    margin-bottom: 0.15rem;
  }
  .jh-row {
    color: var(--ink-3);
  }
  @media (max-width: 480px) {
    .col { max-width: 6rem; }
    .value { font-size: 0.85rem; }
    .name { font-size: 0.75rem; }
    .medal { font-size: 1.25rem; }
  }
  @media (min-width: 768px) {
    .podium { gap: 1.5rem; }
    .block { height: calc(var(--h, 100px) * 1.6); }
    .medal { font-size: 2rem; }
    .name { font-size: 1rem; }
    .value { font-size: 1.15rem; }
    .juara-harapan { font-size: 0.95rem; }
  }
</style>
