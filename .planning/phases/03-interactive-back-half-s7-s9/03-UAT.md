---
status: complete
phase: 03-interactive-back-half-s7-s9
source: 03-01-SUMMARY.md, 03-02-SUMMARY.md, 03-03-SUMMARY.md
started: 2026-05-14T13:43:00Z
updated: 2026-05-14T13:49:00Z
---

## Current Test

[testing complete]

## Tests

<!-- SECTION A: User-flow walk-through -->

### 1. Dev server starts — S7 section reachable
expected: Run `npm run dev` inside `dashboard/`. Scroll past S1–S6. An S7 section is visible with sticky heading showing "Rp 10.7 T" (id) or "Rp 10.7 trillion" (en) and anchor rows below.
result: pass

### 2. S7 Step 0 — Kopi + Seblak count-ups fire
expected: Scroll until the first S7 step card enters view. Two anchor rows animate from 0 upward: kopi jago cups (~1.34 billion) and seblak portions (~715 million). Both reach their final values and stop. A source citation link is visible under each anchor.
result: pass

### 3. S7 Step 1 — Transition label + SD + Puskesmas animate
expected: Scroll to the second S7 step card. A transition line ("Atau, lebih seriusnya…" / "Or, more seriously…") appears. Two new anchor rows count up: elementary schools (~2,384) and puskesmas (~1,341). Gold anchors from Step 0 turn red. Source links visible.
result: pass

### 4. S8 — Word cloud renders
expected: Scroll into S8. A section titled "Apa yang mereka cari?" (id) / equivalent English appears. A cloud of word buttons is visible (20+ words in varying font sizes). A filter bar shows "Semua / All", "Pemerintah Pusat / Central Gov", "Pemerintah Daerah / District Gov" pill buttons, and an institution search input.
result: pass

### 5. S8 — Central Gov filter switches cloud
expected: Click the "Pemerintah Pusat / Central Gov" pill. The word cloud updates (words and/or sizes change to reflect central-gov-only data). The "Central Gov" pill has a gold border indicating active state. Clicking "Semua / All" returns to the default cloud.
result: pass

### 6. S9 — Click a word opens record table overlay
expected: Click any word in the cloud. An overlay panel slides open inside the sticky panel, showing a table headed with that word highlighted in gold. The table has columns: Lembaga, Satker, Pagu, Nama Paket, Alasan AI. Either rows appear or a "no results" empty-state row is shown (empty arrays in dev build is expected).
result: pass

### 7. S9 — Close overlay
expected: Click the × button in the S9 overlay header. The overlay dismisses and the word cloud is visible again. Clicking outside the overlay (but inside the sticky panel) also closes it. The previously-selected word button is no longer highlighted.
result: pass

<!-- SECTION B: Technical checks -->

### 8. S7 backward-scroll re-arms count-ups
expected: Scroll back above S7 (so S7 is no longer in view), then scroll forward into S7 again. The Kopi + Seblak count-ups restart from 0 and re-animate. They do not jump straight to their final values.
result: pass

### 9. Language toggle — S7 and S8 copy switches
expected: With S7 visible, toggle the language button (top-right). The sticky heading, anchor labels, and step body copy switch between Indonesian and English. Toggle again to confirm both directions work. In S8 the filter pill labels and cloud words (if any contain translated terms) switch accordingly.
result: pass

### 10. Mobile layout at 375px
expected: In browser DevTools, set viewport to 375px wide. In S7 the sticky col should be sticky at 50dvh height (not position:relative). In S8 at widths below 480px the word cloud should switch to a horizontal chip-strip layout (scrollable row of pill-shaped tags) instead of the flex-wrap cloud.
result: pass

<!-- SECTION C: Coverage check -->

### 11. Emotional arc — full story delivers the gut-punch
expected: Scroll through S7 → S8 → S9 end-to-end in one pass. By the time the S9 table is visible, the combination of animated spending anchors + procurement word cloud + record table should deliver a clear "this is absurd" feeling. No obvious blank sections, missing data labels, or layout breaks along the way.
result: pass

## Summary

total: 11
passed: 11
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[none]
