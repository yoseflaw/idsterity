<script>
  import { abbreviateLembaga } from "./lembagaAbbreviations.js";

  let { records = [], limit = 3 } = $props();
  let top = $derived(records.slice(0, limit));

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
