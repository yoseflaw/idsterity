# idsterity v2 Phase 2 — Core UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the "absurd" tier to all charts and the color system, redesign S5 to top 5 with medals and a 3-step scroll flow, add S8 auto-select, clean up the hero, and sync English i18n to the updated Indonesian copy.

**Architecture:** All changes are in `dashboard/src/`. `App.svelte` owns global CSS variables, hero markup, S4 breakdown list, and the S8 scroll-in trigger. `InstitutionsChart.svelte` owns the S5 bar chart. `i18n.js` owns all copy. No new files created.

**Tech Stack:** Svelte 5 (runes), D3 v7, scrollama, Vite. Run `npm run dev` from `dashboard/` to preview; `npm run build` to verify the build compiles.

**Prerequisite:** Phase 1 must be complete. `lembaga-totals.json` must have `absurdCount` and `absurdPagu` fields. `summary-stats.json` must have `labelCounts.absurd` and `labelPagu.absurd`.

---

### Task 1: Add `--absurd` CSS variable and update legend entries

**Files:**
- Modify: `dashboard/src/App.svelte`

- [ ] **Step 1: Add the CSS variable**

In `App.svelte`, find the `:global(:root)` CSS block that declares `--red`, `--amber`, etc. Add the new variable:

```css
--absurd: #7a0000;
```

Place it immediately after `--red`.

- [ ] **Step 2: Add absurd row to the S4 static breakdown list**

In the S4 section, find the `<ul class="s4-breakdown">` block. It currently has rows for high, med, and low (using `var(--red)`, `var(--amber)`, and a muted color). Add a new `<li class="s4-row">` for absurd, placed BEFORE the high row (absurd is the most severe):

```svelte
<li class="s4-row">
    <span class="s4-dot" style="background: var(--absurd)"></span>
    <span class="s4-row-label">{t[lang].s4LabelAbsurd}</span>
    <span class="s4-row-count">
        {#if stats}
            {fmtCount(stats.labelCounts.absurd ?? 0, lang)}
        {:else}
            <span class="loading-pulse">--</span>
        {/if}
    </span>
    <span class="s4-row-pagu">
        {#if stats}
            {fmtPaguShort(stats.labelPagu.absurd ?? 0, lang)}
        {:else}
            <span class="loading-pulse">--</span>
        {/if}
    </span>
</li>
```

- [ ] **Step 3: Commit**

```bash
git add dashboard/src/App.svelte
git commit -m "feat(ui): add --absurd CSS variable and absurd row to S4 breakdown"
```

---

### Task 2: Update `i18n.js` — add absurd labels and update S5 copy

**Files:**
- Modify: `dashboard/src/i18n.js`

- [ ] **Step 1: Add `s4LabelAbsurd` to both id and en**

In the `id` object, after `s4LabelHigh`, add:
```js
s4LabelAbsurd: "Absurd",
```

In the `en` object, same location:
```js
s4LabelAbsurd: "Absurd",
```

- [ ] **Step 2: Add absurd legend entries to S5**

In the `id` object, after `s5LegendHigh`, add:
```js
s5LegendAbsurd: "Absurd",
```

In the `en` object:
```js
s5LegendAbsurd: "Absurd",
```

- [ ] **Step 3: Update S5 copy to reflect the new 3-step flow**

The new S5 has 3 steps (no color → colorize → reorder). Replace the existing `s5Step1Heading`, `s5Step1Body`, `s5Step2Heading`, `s5Step2Body` with:

In `id`:
```js
s5StickyHeading: "5 lembaga dengan anggaran terbesar",
s5Step1Heading: "Siapa yang belanja paling besar?",
s5Step1Body: "Lima lembaga pemerintah dengan anggaran pengadaan terbesar tahun 2026.",
s5Step2Heading: "Komposisi label AI",
s5Step2Body: "Warna menunjukkan hasil penilaian AI. Semakin merah, semakin banyak pertanyaan.",
s5Step3Heading: "Siapa yang paling bermasalah?",
s5Step3Body: "Diurutkan ulang berdasarkan pagu bermasalah — bukan total anggaran. Medali berpindah.",
```

In `en`:
```js
s5StickyHeading: "5 institutions by largest budget",
s5Step1Heading: "Who spent the most?",
s5Step1Body: "The five government institutions with the largest procurement budgets in 2026.",
s5Step2Heading: "AI label composition",
s5Step2Body: "Colors show AI assessment. More red means more questions.",
s5Step3Heading: "Who is the most problematic?",
s5Step3Body: "Re-ranked by inappropriate budget — not total spend. Watch the medals move.",
```

- [ ] **Step 4: Sync English copy to Indonesian changes**

Read the full `i18n.js`. For every key where the `id` value has been updated to a new meaning that the `en` value doesn't reflect, update the `en` value to match. Pay attention to:
- Eyebrow labels (e.g., `s7Eyebrow`, `s8Eyebrow`) where ID uses "Bagian N" numbering — EN should use a consistent format
- Any body text where the Indonesian has been rewritten to be more colloquial
- Section headings that reference specific numbers (if APBN numbers were corrected, update the en headings in s2/s3 accordingly)

Specifically update these known mismatches found in the file:
- `s7Eyebrow`: id = `"Bagian 6: Pesta Seblak"` → en should match the new tone. Suggested: `"S7 · PARTY SEBLAK"` (or whatever the id meaning is)
- `s8Eyebrow`: id = `"Bagian 7: Beli apa sih?"` → en should match. Suggested: `"S8 · WHAT WERE THEY BUYING?"`

For any other key where id ≠ en in meaning (not just format), update en to match.

- [ ] **Step 5: Commit**

```bash
git add dashboard/src/i18n.js
git commit -m "feat(i18n): add absurd labels, update S5 copy, sync English to Indonesian"
```

---

### Task 3: Remove duplicate stat line from hero

**Files:**
- Modify: `dashboard/src/App.svelte`

- [ ] **Step 1: Find and remove the hero stat block**

In the hero section (`<section class="hero">`), find the element that renders "Rp 642.2 T dalam 3.009.760 paket pengadaan." — it's the `<div class="hero-stat">` block that shows `stats.totalPagu` and `t[lang].heroPaketLabel`.

Remove the entire `{#if stats}` / `{:else}` block that renders this stat (both the loaded and loading-pulse variants). Keep only `<h1>` and `<p class="scroll-cue">`.

- [ ] **Step 2: Remove orphaned i18n keys from i18n.js** (if `heroPaketLabel` and `heroPaketSuffix` are only used in the hero stat block)

Search for any other uses of `heroPaketLabel` and `heroPaketSuffix` in `App.svelte`:
```bash
grep -n "heroPaketLabel\|heroPaketSuffix" dashboard/src/App.svelte
```

If only in the removed block, also remove those keys from both `id` and `en` in `i18n.js`.

- [ ] **Step 3: Verify the hero renders correctly**

Start the dev server: `npm run dev` (from `dashboard/`). Open http://localhost:5173. Confirm the hero shows only the two headline lines and the scroll cue — no stat line.

- [ ] **Step 4: Commit**

```bash
git add dashboard/src/App.svelte dashboard/src/i18n.js
git commit -m "fix(ui): remove duplicate stat line from hero section"
```

---

### Task 4: Redesign `InstitutionsChart.svelte` — top 5, medals, absurd segment, 3-step flow

**Files:**
- Modify: `dashboard/src/InstitutionsChart.svelte`

This is the largest task. Read the full current file before editing.

- [ ] **Step 1: Update constants — always show top 5, remove MOBILE_SHOW**

Replace:
```js
const MOBILE_SHOW = 15
```
With:
```js
const TOP_SHOW = 5
```

- [ ] **Step 2: Update `sortedData` derived — step 2 sorts by `highPagu + absurdPagu`**

Replace the current `sortedData` derived:
```js
let sortedData = $derived(
    step >= S6_STEP_INDEX
      ? [...data].sort((a, b) => b.highPagu - a.highPagu)
      : [...data].sort((a, b) => b.total - a.total)
)
```

With:
```js
let sortedData = $derived(
    step >= S6_STEP_INDEX
      ? [...data].sort((a, b) => (b.highPagu + (b.absurdPagu ?? 0)) - (a.highPagu + (a.absurdPagu ?? 0)))
      : [...data].sort((a, b) => b.total - a.total)
)
```

- [ ] **Step 3: Update `displayData` — always slice to top 5 on both mobile and desktop**

Replace:
```js
let displayData = $derived(isMobile ? sortedData.slice(0, MOBILE_SHOW) : sortedData)
```

With:
```js
let displayData = $derived(sortedData.slice(0, TOP_SHOW))
```

- [ ] **Step 4: Add absurd segment to the SVG bar groups**

In the `{#each displayData as d (d.name)}` block, after the `<!-- high segment -->` rect, add:

```svelte
<!-- absurd segment -->
<rect class="seg-absurd"
      x={xScale(cleanPagu + d.lowPagu + d.medPagu + d.highPagu)}
      y={0}
      width={xScale(d.absurdPagu ?? 0)}
      height={barHeight}
      fill="var(--absurd)"
      opacity="0"/>
```

Note: initial `opacity="0"` — the D3 effect will transition it in on step 1.

- [ ] **Step 5: Add medal rendering inside each bar-group**

After the `<text class="bar-label">` element in the bar group, add medal text:

```svelte
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
```

- [ ] **Step 6: Update the D3 `$effect` to handle 3 steps**

The current `$effect` controls dimming at `S6_STEP_INDEX`. Update it to also control the color band opacity for step 0 vs step 1+.

Find the `$effect` block and update the opacity logic:

```js
// Step 0: no color (colored segments hidden)
// Step 1: color shown
// Step 2: color shown, clean/low dimmed
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
```

- [ ] **Step 7: Update the scrollama step count in App.svelte**

In `App.svelte`, the S5 section now has 3 scroll steps (0, 1, 2) instead of 2 (0, 1 for S5 + 2 for S6 combined). Find the `[data-section="s5"]` markup and verify there are exactly 3 `[data-step]` elements — add a third step card if missing:

```svelte
<div class="step" data-step="2">
    <div class="step-card">
        <span class="step-num">{t[lang].stepCounter(3, 3)}</span>
        <h3>{t[lang].s5Step3Heading}</h3>
        <p>{t[lang].s5Step3Body}</p>
    </div>
</div>
```

Also update the `InstitutionsChart` sticky heading in App.svelte to use the new `s5StickyHeading` key.

- [ ] **Step 8: Confirm no separate s6 scroller exists**

App.svelte only sets up scrollers for `s1/s2/s3/s5/s7/s8` — there is no `makeScroller("s6", ...)`. The S6 reorder is already driven by `activeStepS5 === 2` (the `S6_STEP_INDEX = 2` constant in InstitutionsChart). No change needed here — just verify that the S5 section in markup has exactly 3 `[data-step]` elements so scrollama fires step indices 0, 1, and 2.

- [ ] **Step 9: Visual check**

Run `npm run dev`. Scroll to S5 and verify:
- Step 0: 5 monochrome bars with 🥇🥈🥉 medals on top 3
- Step 1: color bands animate in
- Step 2: bars re-sort (new institutions may appear), medals re-assign

- [ ] **Step 10: Commit**

```bash
git add dashboard/src/InstitutionsChart.svelte dashboard/src/App.svelte
git commit -m "feat(ui): redesign S5 — top 5, medals, 3-step flow, absurd segment"
```

---

### Task 5: Add S8 auto-select of top word on scroll-in

**Files:**
- Modify: `dashboard/src/App.svelte`

- [ ] **Step 1: Find the S8 scrollama callback**

In `App.svelte`, find:
```js
makeScroller("s8", (i) => {
    activeStepS8 = i;
}),
```

- [ ] **Step 2: Add auto-select on first entry**

Update the callback to auto-select the top word when S8 first enters view (step 0, and only if no word is already selected):

```js
makeScroller("s8", (i) => {
    activeStepS8 = i;
    if (i === 0 && !selectedWord && cloudWords.length > 0) {
        selectWord(cloudWords[0].word);
    }
}),
```

This calls the existing `selectWord()` function which handles fetch, cache, and state update.

- [ ] **Step 3: Verify behavior**

Run `npm run dev`. Scroll to S8. Confirm:
- The top word is highlighted/selected on arrival
- S9 table populates immediately with records
- Clicking another word overrides the selection

- [ ] **Step 4: Commit**

```bash
git add dashboard/src/App.svelte
git commit -m "feat(ui): auto-select top word on S8 scroll-in so S9 is never empty"
```

---

### Task 6: Build and verify

**Files:** None modified — verification only.

- [ ] **Step 1: Run the production build**

```bash
cd /Users/yosef/Projects/idsterity/dashboard
npm run build
```

Expected: exits 0, output in `dashboard/dist/`.

- [ ] **Step 2: Verify all word JSON files are in the build output**

```bash
ls dashboard/dist/data/word-*.json | wc -l
```

Expected: same count as `dashboard/public/data/word-*.json`.

- [ ] **Step 3: Smoke test with preview server**

```bash
npm run preview
```

Open http://localhost:4173/sterity/ (or whatever the preview URL is). Check:
- Hero: two lines only, no stat line
- S4: absurd row visible with count and pagu
- S5: 5 bars, medals, 3 scroll steps work correctly
- S8: top word pre-selected on scroll-in
- S9: records appear immediately without clicking

- [ ] **Step 4: Commit if any last-minute fixes were needed**

```bash
git add -p
git commit -m "fix(ui): phase 2 build verification fixes"
```
