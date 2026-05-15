# idsterity v2 Phase 3 — Mobile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix three mobile-specific issues: text overlay on charts (add blur+darken), seblak not showing in S7, and the word cloud broken on mobile.

**Architecture:** All changes are CSS and small Svelte reactive class bindings in `App.svelte`. No new files. Mobile breakpoints in this project are `@media (max-width: 800px)` (isMobile in JS) and `@media (max-width: 480px)` (isNarrow in JS). Desktop behavior is not changed.

**Tech Stack:** Svelte 5 runes, CSS custom properties, `backdrop-filter`.

**Prerequisite:** Phase 2 auto-select (Task 5) must be complete so the word cloud auto-fires on mobile too.

---

### Task 1: Blur + darken chart when text step is active on mobile

**Files:**
- Modify: `dashboard/src/App.svelte`

On mobile (≤800px), the chart is sticky and the text step cards scroll over it. This task dims and blurs the chart behind active text steps.

- [ ] **Step 1: Identify the sticky chart container element for each scrollytelling section**

Search for the sticky chart wrapper in each section (S1, S2, S3, S5, S7, S8). Each section has a pattern like:

```svelte
<div class="sticky-chart">
    <!-- chart content -->
</div>
```

Note the class names used for sticky chart containers across sections.

- [ ] **Step 2: Add a reactive `chartDimmed` derived value**

In the `<script>` block of `App.svelte`, add a derived value that is `true` when any text step is active and covering the chart. Since each section uses its own `activeStepS*` variable, add per-section derived values:

```js
// Chart is dimmed when a scroll step is active (step > 0 means user has scrolled past the first step)
let s1ChartDimmed = $derived(activeStepS1 > 0)
let s2ChartDimmed = $derived(activeStepS2 > 0)
let s3ChartDimmed = $derived(activeStepS3 > 0)
let s5ChartDimmed = $derived(activeStepS5 > 0)
let s7ChartDimmed = $derived(activeStepS7 > 0)
let s8ChartDimmed = $derived(activeStepS8 > 0)
```

- [ ] **Step 3: Add `class:chart--dimmed` bindings to each sticky chart container**

For each sticky chart element, add the class binding. Example for S5:

```svelte
<div class="sticky-chart" class:chart--dimmed={s5ChartDimmed}>
    <InstitutionsChart data={lembaga} step={activeStepS5} {lang} />
</div>
```

Apply the same pattern to all sticky chart containers (S1, S2, S3, S7, S8). The exact element names may vary — match the actual class names in the file.

- [ ] **Step 4: Add the CSS rule for `chart--dimmed` inside a mobile media query**

Find the existing `@media (max-width: 800px)` block and add:

```css
@media (max-width: 800px) {
    .chart--dimmed {
        filter: blur(3px) brightness(0.35);
        transition: filter 0.3s ease;
    }
}
```

Also add a transition on the non-dimmed state so it smoothly un-blurs:

```css
.sticky-chart {
    transition: filter 0.3s ease;
}
```

Place the non-media-query rule with the existing `.sticky-chart` styles if present, or in the general styles section.

- [ ] **Step 5: Verify on mobile viewport**

Run `npm run dev`. Use browser DevTools to simulate a mobile viewport (≤800px wide). Scroll through a section. Verify:
- Chart blurs + darkens as the text step scrolls over it
- Chart returns to full opacity when scrolled back to the top of the section
- Desktop viewport: no blur at any point

- [ ] **Step 6: Commit**

```bash
git add dashboard/src/App.svelte
git commit -m "fix(mobile): blur and darken sticky chart when text step overlaps it"
```

---

### Task 2: Fix seblak not showing on mobile

**Files:**
- Modify: `dashboard/src/App.svelte`

The seblak comparison card in S7 is not rendering on mobile. The card is inside `<div class="s7-anchor-pair">` which contains multiple `<div class="s7-anchor">` elements (kopi, seblak, SD, puskesmas).

- [ ] **Step 1: Inspect the S7 anchor layout CSS at mobile viewport**

Find all CSS rules affecting `.s7-anchor-pair`, `.s7-anchor`, and their children in the `@media (max-width: 800px)` block:

```bash
grep -n "s7-anchor\|anchor-pair" dashboard/src/App.svelte | head -40
```

Note whether `display: none`, `overflow: hidden`, `max-height`, or `grid-column` is being applied at mobile widths.

- [ ] **Step 2: Identify which CSS rule hides seblak**

Open browser DevTools at mobile viewport, navigate to S7, right-click the seblak anchor element, inspect. Look for a rule with `display: none` or a computed style that makes it invisible/zero-height.

Common causes:
- `nth-child` selector hiding the second anchor
- Grid/flex layout collapsing a column
- `overflow: hidden` on parent with insufficient `max-height`

- [ ] **Step 3: Fix the rule**

Once identified, correct the specific CSS rule. For example, if `.s7-anchor-pair` uses a 2-column grid that wraps incorrectly on mobile:

```css
@media (max-width: 800px) {
    .s7-anchor-pair {
        display: grid;
        grid-template-columns: 1fr 1fr; /* or 1fr if it needs to be single column */
        gap: 12px;
    }
}
```

Make the minimal change needed to show seblak consistently with kopi and the other anchors.

- [ ] **Step 4: Verify all four anchor items visible on mobile**

Run `npm run dev`. At ≤800px viewport, scroll to S7 step 0. Confirm kopi, seblak, SD, and puskesmas all render. Check both step 0 (kopi+seblak) and step 1 (SD+puskesmas).

- [ ] **Step 5: Commit**

```bash
git add dashboard/src/App.svelte
git commit -m "fix(mobile): restore seblak visibility in S7 anchor comparison"
```

---

### Task 3: Fix word cloud mobile layout

**Files:**
- Modify: `dashboard/src/App.svelte`

On mobile, the word cloud renders as a single-column word list fallback (when `isNarrow` is true, i.e., ≤480px). This fallback is currently broken — layout is incorrect and the list is not scrollable.

- [ ] **Step 1: Find the mobile word cloud fallback markup**

Search for the `isNarrow` condition in the S8 section:

```bash
grep -n "isNarrow\|mobile.*cloud\|cloud.*mobile\|narrow" dashboard/src/App.svelte | head -20
```

Find the `{#if isNarrow}` block that renders the mobile word list fallback.

- [ ] **Step 2: Fix the mobile fallback container**

The mobile fallback should be a horizontally scrollable row of word chips (or a vertically scrollable list that fits within the viewport). Apply these CSS fixes to the fallback container:

```css
@media (max-width: 480px) {
    .cloud-mobile-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        max-height: 200px;
        overflow-y: auto;
        padding: 8px;
        -webkit-overflow-scrolling: touch;
    }

    .cloud-mobile-item {
        cursor: pointer;
        padding: 6px 12px;
        border-radius: 20px;
        border: 1px solid rgba(237,232,220,0.2);
        font-size: 14px;
        color: rgba(237,232,220,0.85);
        white-space: nowrap;
    }

    .cloud-mobile-item.selected {
        border-color: var(--gold);
        color: var(--gold);
    }
}
```

Adjust the class names to match whatever the markup uses. If the class names differ, update CSS to target the actual classes.

- [ ] **Step 3: Ensure auto-select works on mobile**

The Phase 2 auto-select (`selectWord(cloudWords[0].word)` on S8 scroll-in) applies to both mobile and desktop. Verify the mobile word list visually reflects the selected word (the first item should have the `selected` state class).

In the mobile fallback markup, the selected word item should have:
```svelte
class:selected={selectedWord === word}
```

If this binding is missing, add it.

- [ ] **Step 4: Verify on mobile viewport**

Run `npm run dev`. At ≤480px viewport, scroll to S8. Verify:
- Word list renders correctly (visible, scrollable if needed)
- Top word is pre-selected (highlighted in gold)
- S9 table shows records immediately
- Tapping another word updates the selection and S9

- [ ] **Step 5: Commit**

```bash
git add dashboard/src/App.svelte
git commit -m "fix(mobile): restore word cloud layout and scrollability on narrow viewports"
```

---

### Task 4: Build, test, and commit

**Files:** None modified — verification only.

- [ ] **Step 1: Production build**

```bash
cd /Users/yosef/Projects/idsterity/dashboard
npm run build
```

Expected: exits 0.

- [ ] **Step 2: Preview at mobile viewport**

```bash
npm run preview
```

Open at ≤800px viewport. Walk through all sections and verify:
- Each section's sticky chart blurs when text steps scroll over it
- S7: all four anchor comparisons (kopi, seblak, SD, puskesmas) visible
- S8: word cloud renders correctly, top word selected, S9 populates
- Desktop at same URL: no blur effect anywhere

- [ ] **Step 3: Commit any final fixes**

```bash
git add dashboard/src/App.svelte
git commit -m "fix(mobile): phase 3 final verification fixes"
```
