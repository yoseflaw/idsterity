<script>
  let { open = false, onClose, title = "", children } = $props();

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onClose?.();
  }
  function handleKey(e) {
    if (e.key === "Escape" && open) onClose?.();
  }
</script>

<svelte:window onkeydown={handleKey} />

{#if open}
  <div
    class="modal-backdrop"
    onclick={handleBackdropClick}
    onkeydown={(e) => { if (e.key === "Enter") handleBackdropClick(e); }}
    role="presentation"
  >
    <div class="modal-panel" role="dialog" aria-modal="true" aria-label={title}>
      <header class="modal-header">
        <h3>{title}</h3>
        <button class="modal-close" onclick={onClose} aria-label="Tutup">×</button>
      </header>
      <div class="modal-body">
        {@render children?.()}
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.88);
    z-index: 1000;
    display: flex;
  }
  .modal-panel {
    width: 100%;
    height: 100%;
    background: var(--bg, #111);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border-bottom: 1px solid var(--border, #2a2a2a);
    gap: 1rem;
  }
  .modal-header h3 {
    margin: 0;
    font-family: "Libre Baskerville", Georgia, serif;
    font-size: 1.15rem;
    color: var(--text, #eee);
    line-height: 1.25;
  }
  .modal-close {
    background: none;
    border: 1px solid var(--border, #2a2a2a);
    color: var(--text, #eee);
    font-size: 1.5rem;
    line-height: 1;
    cursor: pointer;
    padding: 0.25rem 0.6rem;
    border-radius: 6px;
    flex: 0 0 auto;
  }
  .modal-close:hover { background: var(--bg-alt, #1a1a1a); }
  .modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
  }
  @media (min-width: 720px) {
    .modal-backdrop { padding: 4rem; }
    .modal-panel { max-width: 720px; max-height: 80vh; margin: auto; border-radius: 12px; border: 1px solid var(--border, #2a2a2a); }
  }
</style>
