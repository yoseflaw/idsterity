---
status: partial
phase: 01-foundation-data-pipeline
source: [01-VERIFICATION.md]
started: 2026-05-13T11:41:55Z
updated: 2026-05-13T11:41:55Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Hero data + fonts
expected: Hero renders `Rp 642.2 T`, zero requests to fonts.googleapis.com / fonts.gstatic.com in Network tab, no console errors
result: [pending]

### 2. Scrollama fire-once
expected: Scrolling through all 4 steps causes pip to advance exactly once per step (0→1→2→3), no flicker or double-fire
result: [pending]

### 3. HMR no double-fire
expected: After editing i18n.js with dev server running, scrolling past a step still fires pip exactly once (not twice due to duplicate scrollama instances)
result: [pending]

### 4. Toggle scroll preservation
expected: Clicking language toggle mid-scroll does not jump to top; all copy switches language; toggle label inverts
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
