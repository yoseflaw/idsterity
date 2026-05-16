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
    color: var(--muted, #aaa);
    font-family: "JetBrains Mono", "Courier New", monospace;
    font-size: 0.85rem;
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
    background: var(--bg-card, #1a1a1a);
    border: 1px solid var(--border, #2a2a2a);
    border-radius: 8px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
  }
  .card-lembaga {
    font-family: "JetBrains Mono", "Courier New", monospace;
    font-size: 0.78rem;
    color: var(--gold, #e6b85c);
    letter-spacing: 0.02em;
  }
  .card-paket {
    font-family: "Libre Baskerville", Georgia, serif;
    font-size: 1rem;
    color: var(--text, #eee);
    line-height: 1.4;
  }
  .card-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-top: 0.25rem;
  }
  .card-pagu {
    font-family: "JetBrains Mono", "Courier New", monospace;
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text, #eee);
  }
  .card-label {
    font-family: "JetBrains Mono", "Courier New", monospace;
    font-size: 0.7rem;
    padding: 0.25rem 0.65rem;
    border-radius: 999px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    flex: 0 0 auto;
  }
  .card-label.high {
    background: rgba(161, 59, 59, 0.18);
    color: #d96c6c;
    border: 1px solid #a13b3b;
  }
  .card-label.absurd {
    background: rgba(139, 28, 28, 0.32);
    color: #ff8b8b;
    border: 1px solid #8b1c1c;
  }
  @media (min-width: 720px) {
    .card-paket { font-size: 1.05rem; }
    .card-pagu { font-size: 1.05rem; }
  }
</style>
