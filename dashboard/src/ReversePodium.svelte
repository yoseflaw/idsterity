<script>
  import { abbreviateLembaga } from "./lembagaAbbreviations.js";

  let { data = [], progress = 0 } = $props();
  // data: array of lembaga objects ranked by highPagu+absurdPagu (top-5 expected)
  // progress: 0..1 morph driver (0 = upright gold like S5 podium; 1 = inverted red)
  let top3    = $derived(data.slice(0, 3));
  let runners = $derived(data.slice(3, 5));

  // Render order: [2nd, 1st, 3rd] so 1st is center
  let order = $derived(top3.length === 3 ? [top3[1], top3[0], top3[2]] : top3);

  function fmtT(rupiah) {
    if (!rupiah) return "Rp 0";
    if (rupiah >= 1e12) return `Rp ${(rupiah / 1e12).toFixed(1)} T`;
    if (rupiah >= 1e9)  return `Rp ${(rupiah / 1e9).toFixed(1)} M`;
    return `Rp ${rupiah.toLocaleString("id-ID")}`;
  }
  function fmtCount(n) {
    return (n || 0).toLocaleString("id-ID");
  }
  function flaggedPagu(d) {
    return (d?.highPagu || 0) + (d?.absurdPagu || 0);
  }
  function flaggedCount(d) {
    return (d?.highCount || 0) + (d?.absurdCount || 0);
  }

  // Mobile-friendly base block heights (small enough to fit in 50dvh sticky-col)
  const HEIGHTS = [95, 140, 70]; // [2nd, 1st, 3rd]
  const MEDALS  = ["🥈", "🥇", "🥉"];

  // Color interpolation between gold (start) and red (end) per index
  function blockColor(idx, t) {
    // golds approximate Podium's gold tones; reds get progressively deeper toward center
    const golds = ["#bfa055", "#d4a84a", "#a88f4a"]; // 2nd, 1st, 3rd
    const reds  = ["#a13b3b", "#8b1c1c", "#a85050"]; // 2nd, 1st, 3rd
    return mixHex(golds[idx], reds[idx], t);
  }
  function mixHex(a, b, t) {
    const pa = a.match(/\w\w/g).map((h) => parseInt(h, 16));
    const pb = b.match(/\w\w/g).map((h) => parseInt(h, 16));
    const m = pa.map((v, i) => Math.round(v * (1 - t) + pb[i] * t));
    return `rgb(${m.join(",")})`;
  }

  // Translate blocks downward as progress increases. At progress=1 each block
  // sits a full block-height below its baseline so 1st reaches the lowest pit.
  function translateY(idx) {
    return Math.round(HEIGHTS[idx] * (progress ?? 0));
  }
</script>

<div class="rp-wrap">
  <div class="rp" role="list">
    {#each order as d, i (d?.name ?? i)}
      <div class="col" role="listitem">
        <div class="medal-name">
          <span class="medal" aria-hidden="true">{MEDALS[i]}</span>
          <span class="name" title={d?.name}>{abbreviateLembaga(d?.name)}</span>
        </div>
        <div
          class="block"
          style="
            height: {HEIGHTS[i]}px;
            transform: translateY({translateY(i)}px);
            background: {blockColor(i, progress ?? 0)};
          "
        >
          <span class="count">{fmtCount(flaggedCount(d))}</span>
          <span class="count-label">paket bermasalah</span>
          <span class="pagu">{fmtT(flaggedPagu(d))}</span>
        </div>
      </div>
    {/each}
  </div>

  {#if runners.length}
    <p class="juara-harapan">
      <span class="jh-label">Juara Harapan:</span>
      {#each runners as r, i (r?.name ?? i)}
        <span class="jh-item">{abbreviateLembaga(r?.name)} — {fmtCount(flaggedCount(r))} paket</span>
        {#if i < runners.length - 1}<span class="jh-sep"> · </span>{/if}
      {/each}
    </p>
  {/if}
</div>

<style>
  .rp-wrap {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }
  .rp {
    display: flex;
    align-items: flex-start;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    max-width: 28rem;
    min-height: 220px; /* room for the morph downward translation */
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
  .medal { font-size: 1.5rem; line-height: 1; }
  .name {
    font-family: "JetBrains Mono", "Courier New", monospace;
    font-size: 0.85rem;
    color: var(--muted, #aaa);
    text-align: center;
    margin-top: 0.25rem;
    word-break: break-word;
  }
  .block {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    transition: background 250ms linear, transform 250ms linear;
    padding: 0.5rem 0.25rem;
    gap: 0.15rem;
    color: var(--bg, #111);
  }
  .count {
    font-family: "JetBrains Mono", "Courier New", monospace;
    font-size: 1.1rem;
    font-weight: 600;
  }
  .count-label {
    font-size: 0.7rem;
    opacity: 0.85;
  }
  .pagu {
    font-family: "JetBrains Mono", "Courier New", monospace;
    font-size: 0.85rem;
  }
  .juara-harapan {
    text-align: center;
    font-family: "JetBrains Mono", "Courier New", monospace;
    font-size: 0.8rem;
    color: var(--muted, #aaa);
    margin: 0.25rem 0 0;
  }
  .jh-label { color: var(--red, #a13b3b); margin-right: 0.5rem; }

  @media (min-width: 768px) {
    .rp { max-width: 44rem; gap: 1rem; min-height: 320px; }
    .col { max-width: 12rem; }
    .medal { font-size: 1.8rem; }
    .name { font-size: 1rem; }
    .count { font-size: 1.4rem; }
    .count-label { font-size: 0.85rem; }
    .pagu { font-size: 1rem; }
    .juara-harapan { font-size: 0.9rem; }
  }
  @media (max-width: 480px) {
    .col { max-width: 6.5rem; }
    .count { font-size: 0.95rem; }
    .count-label { font-size: 0.65rem; }
    .pagu { font-size: 0.75rem; }
  }
</style>
