<script>
  import { abbreviateLembaga } from "./lembagaAbbreviations.js";

  let { records = [], limit = 3 } = $props();

  function isAbsurd(r) {
    return labelOf(r) === "Absurd";
  }
  function isHigh(r) {
    return labelOf(r) === "High";
  }

  function selectTop3(rows) {
    // 1. Dedupe by paket name — keep highest-pagu per name.
    const byName = new Map();
    for (const r of rows) {
      const cur = byName.get(r.paket);
      if (!cur || (r.pagu ?? 0) > (cur.pagu ?? 0)) byName.set(r.paket, r);
    }
    const distinct = [...byName.values()];

    // 2. Reserve a slot for highest-pagu absurd if any exist.
    const absurdList = distinct
      .filter(isAbsurd)
      .sort((a, b) => (b.pagu ?? 0) - (a.pagu ?? 0));
    const highList = distinct
      .filter(r => isHigh(r) && !(absurdList[0] && r.paket === absurdList[0].paket))
      .sort((a, b) => (b.pagu ?? 0) - (a.pagu ?? 0));

    const picks = absurdList[0]
      ? [absurdList[0], ...highList.slice(0, 2)]
      : highList.slice(0, 3);

    // 3. Sort the final picks by pagu desc for display order.
    return picks.sort((a, b) => (b.pagu ?? 0) - (a.pagu ?? 0));
  }

  let top = $derived(selectTop3(records));

  function fmtT(rupiah) {
    if (!rupiah) return "Rp 0";
    if (rupiah >= 1e12) return `Rp ${(rupiah / 1e12).toFixed(1)} T`;
    if (rupiah >= 1e9) return `Rp ${(rupiah / 1e9).toFixed(1)} M`;
    if (rupiah >= 1e6) return `Rp ${(rupiah / 1e6).toFixed(1)} jt`;
    return `Rp ${rupiah.toLocaleString("id-ID")}`;
  }

  function labelOf(rec) {
    const explicit = (rec.label || "").toString().toLowerCase();
    if (explicit === "absurd") return "Absurd";
    if (explicit === "high") return "High";
    const isi = (rec.isInappropriate || rec.tags?.isInappropriate || "").toString().toLowerCase();
    if (isi === "absurd") return "Absurd";
    if (isi === "high") return "High";
    const reason = (rec.inappropriateReason || "").toLowerCase();
    if (reason.includes("absurd")) return "Absurd";
    return "High";
  }
</script>

{#if top.length === 0}
  <p class="empty">Tidak ada paket ditemukan.</p>
{:else}
  <ul class="cards" role="list">
    {#each top as rec, i (i)}
      {@const lbl = labelOf(rec)}
      <li class="card">
        <div class="card-lembaga">{abbreviateLembaga(rec.lembaga)}</div>
        <div class="card-paket">{rec.paket || rec.name || "(tanpa nama)"}</div>
        <div class="card-foot">
          <span class="card-pagu">{fmtT(rec.pagu)}</span>
          <span class="card-label {lbl.toLowerCase()}">{lbl}</span>
        </div>
      </li>
    {/each}
  </ul>
{/if}

<style>
  .empty {
    color: var(--ink-3);
    font-family: var(--mono);
    font-size: var(--size-mono);
    text-align: center;
    padding: 1rem 0;
  }
  .cards {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .card {
    background: var(--bg-sunken);
    border: 1px solid var(--rule);
    border-radius: var(--radius-card);
    padding: var(--space-5);
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
  }
  .card-lembaga {
    font-family: var(--mono);
    font-size: var(--size-mono);
    color: var(--accent-soft);
    letter-spacing: 0.02em;
  }
  .card-paket {
    font-family: var(--serif);
    font-size: var(--size-body);
    color: var(--ink-1);
    line-height: var(--lh-body);
  }
  .card-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-top: 0.25rem;
  }
  .card-pagu {
    font-family: var(--mono);
    font-size: var(--size-ui);
    font-weight: 500;
    color: var(--ink-1);
  }
  .card-label {
    font-family: var(--sans);
    font-size: 11px;
    font-weight: 600;
    padding: 2px 10px;
    border-radius: var(--radius-pill);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    flex: 0 0 auto;
    color: var(--viz-red);
    border: 1px solid var(--viz-red);
    background: var(--viz-red-bg);
  }
  .card-label.absurd {
    color: var(--viz-red-dark);
    border-color: var(--viz-red-dark);
    background: var(--viz-red-bg);
  }
  @media (min-width: 720px) {
    .card-paket { font-size: var(--size-body); }
    .card-pagu { font-size: var(--size-ui); }
  }
</style>
