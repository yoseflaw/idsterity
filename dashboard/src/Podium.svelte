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
  const HEIGHTS = [140, 200, 100]; // px
  const MEDALS  = ["🥈", "🥇", "🥉"];
</script>

<div class="podium-wrap">
  <div class="podium" role="list">
    {#each podiumOrder as d, i (d?.name ?? i)}
      <div class="col" role="listitem">
        <div class="medal-name">
          <span class="medal" aria-hidden="true">{MEDALS[i]}</span>
          <span class="name" title={d?.name}>{abbreviateLembaga(d?.name)}</span>
        </div>
        <div class="block" style="height: {HEIGHTS[i]}px;">
          <span class="value">{fmtT(d?.total)}</span>
        </div>
      </div>
    {/each}
  </div>

  {#if runners.length}
    <p class="juara-harapan">
      <span class="jh-label">Juara Harapan:</span>
      {#each runners as r, i (r?.name ?? i)}
        <span class="jh-item">{abbreviateLembaga(r?.name)} — {fmtT(r?.total)}</span>
        {#if i < runners.length - 1}<span class="jh-sep"> · </span>{/if}
      {/each}
    </p>
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
    gap: 0.5rem;
    width: 100%;
    max-width: 28rem;
  }
  .col {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1 1 0;
    max-width: 8rem;
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
    font-family: "JetBrains Mono", "Courier New", monospace;
    font-size: 0.85rem;
    color: var(--muted, #6a6055);
    text-align: center;
    margin-top: 0.25rem;
    word-break: break-word;
  }
  .block {
    width: 100%;
    background: var(--podium-fill, var(--gold, #c9a84c));
    border-top: 2px solid var(--gold, #c9a84c);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .value {
    font-family: "JetBrains Mono", "Courier New", monospace;
    font-weight: 600;
    color: var(--bg, #0e0d0c);
    font-size: 1rem;
    text-align: center;
    padding: 0 0.25rem;
  }
  .juara-harapan {
    text-align: center;
    font-family: "JetBrains Mono", "Courier New", monospace;
    font-size: 0.8rem;
    color: var(--muted, #6a6055);
    margin: 0.25rem 0 0;
  }
  .jh-label {
    color: var(--gold, #c9a84c);
    margin-right: 0.5rem;
  }
  @media (max-width: 480px) {
    .col { max-width: 6rem; }
    .value { font-size: 0.85rem; }
    .name { font-size: 0.75rem; }
    .medal { font-size: 1.25rem; }
  }
</style>
