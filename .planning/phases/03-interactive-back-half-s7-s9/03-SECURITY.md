---
phase: 03
slug: interactive-back-half-s7-s9
status: verified
threats_open: 0
asvs_level: 1
created: 2026-05-14
---

# Phase 03 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| static JSON → browser (Plan 01) | Pre-baked `constants.json` committed to repo; trusted source | Anchor prices, labels, source URLs — no PII |
| user → DOM (Plan 01) | No user-supplied input in S7; scroll position is the only user signal | None |
| browser → external sources (Plan 01) | `<a href={anchor.source}>` opens citation URLs in new tab | Public Indonesian news/government URLs |
| inaproc-ds/outputs/ → prepare-data.py (Plan 02) | Public-source procurement records; not user-supplied but may contain malformed data | Paket names, institution names, AI reason strings |
| prepare-data.py → public/data/word-*.json (Plan 02) | Outputs reviewed in PR before commit; baked at build time, not runtime | Per-word record subsets (lembaga, satker, paket, pagu, inappropriateReason) |
| public/data/word-*.json → browser fetch (Plan 03) | Static files served as `application/json`; consumed by safeFetch, rendered via Svelte text interpolation | Per-word procurement records — public metadata only |
| user → DOM search input (Plan 03) | Institution search input is free text; used client-side for filter only; never sent to a server or used to construct a fetch URL | None reaching network |
| user → fetch URL construction (Plan 03) | `selectedWord` and `activeFilter` form `/data/word-${word}-${filter}.json`; both come from validated array sources | Never free text |
| browser → DOM rendering (Plan 03) | Record fields rendered as Svelte text — HTML-escaped by default | Public procurement metadata |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-03-01 | Tampering | `constants.json` `anchors.*.price` | accept | Static file committed to repo; tampering requires a PR. `Math.floor` with `?? 0` NaN fallback ensures safe rendering even if malformed. | closed |
| T-03-02 | Information Disclosure | Source citation URLs | accept | URLs are public Indonesian news/government sources; no PII. Disclosure is expected behavior. | closed |
| T-03-03 | Elevation of Privilege | `<a target="_blank">` reverse tabnabbing on source links | mitigate | All S7 source-link anchors include `rel="noopener noreferrer"` — confirmed in SUMMARY-01 Threat Surface Scan. | closed |
| T-03-04 | Denial of Service (client) | RAF count-up loop running forever | mitigate | `countUp` loop terminates when `t >= 1`; `onDestroy` clears pending Step 1 stagger timers — confirmed in SUMMARY-01. | closed |
| T-03-05 | Spoofing | XSS via unescaped i18n strings | mitigate | All S7 copy rendered via Svelte `{t[lang].key}` interpolation (HTML-escaped). No `{@html}` used anywhere in S7 — confirmed in SUMMARY-01. | closed |
| T-03-06 | Tampering | Malicious string in `paket` or `inappropriateReason` (e.g. `<script>` tag) | mitigate | Output consumed by Svelte `{cell}` interpolation (HTML-escaped by default). No `{@html}` used. Source records from official Indonesian procurement system — confirmed by SUMMARY-03. | closed |
| T-03-07 | Information Disclosure | PII in record fields | accept | Only public procurement metadata emitted: institution, work unit, budget, package name, AI reason. No personal identifiers. Accepted by design. | closed |
| T-03-08 | Denial of Service (pipeline) | Adversarial paket strings causing pathological substring matches | mitigate | Substring matching is O(len(paket)) per word per record — bounded. Pipeline runs offline; minutes not real-time. No DoS surface in the browser. | closed |
| T-03-09 | Repudiation | Misleading values committed without provenance | mitigate | Files produced deterministically from `inaproc-ds/outputs/` shards. Pipeline script committed and reviewable. Output reproducible by anyone with dataset. No threat flags in SUMMARY-02. | closed |
| T-03-10 | Tampering | Substring match producing false-positive records | mitigate | Offline data quality issue only; no runtime security exposure. Pipeline matches `word in paket.lower()` — false positives are a data precision concern, not a trust boundary violation. SUMMARY-02 raised no threat flags. | closed |
| T-03-11 | Spoofing | XSS via record field containing `<script>` or `"><img onerror=...>` | mitigate | All S9 record fields (`r.lembaga`, `r.satker`, `r.paket`, `r.inappropriateReason`) rendered via Svelte text interpolation (HTML-escaped). No `{@html}` in S9 markup — confirmed in SUMMARY-03. | closed |
| T-03-12 | Spoofing | XSS via `selectedWord` injected into title or fetch URL | mitigate | `selectedWord` set ONLY from `cloudWords` array entries (pre-baked JSON). Free text from institution search input never becomes `selectedWord` — confirmed in SUMMARY-03. | closed |
| T-03-13 | Tampering | Path traversal via crafted `selectedWord` | mitigate | Pre-baked words from `wordcloud-*.json` are lowercased Indonesian lemmas — no slashes, dots, or relative path components. Static hosting servers resolve `..` segments. Defense in depth: `encodeURIComponent(selectedWord)` MAY be applied to fetch URL. | closed |
| T-03-14 | Information Disclosure | Open redirect via `lembagaSearch` or `selectedWord` | accept | No `<a href={userInput}>` or `window.location = userInput` anywhere in S8/S9. Search input and selectedWord never become hyperlinks or navigation targets. No open-redirect surface. | closed |
| T-03-15 | Denial of Service (client) | Pathological search input triggering per-keystroke filter over all institutions | mitigate | `filteredInstitutions` caps results at 50 entries and is computed via `$derived` (caches until input changes). O(620) per keystroke — well under any DoS threshold. | closed |
| T-03-16 | Repudiation | Misleading records committed without provenance | mitigate | Per-word files produced by `prepare-data.py` from `inaproc-ds/outputs/` (Plan 02). Pipeline committed and reviewable. Output reproducible. | closed |
| T-03-17 | Elevation of Privilege | None — pure static read-only site | accept | No authentication or authorization surface. Accepted by architecture. | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-03-01 | T-03-01 | constants.json tampering requires repo write access (PR merge). NaN fallback ensures safe rendering. Static site architecture — no server-side validation surface. | Yosef Ardhito | 2026-05-14 |
| AR-03-02 | T-03-02 | Source URLs point to public Indonesian news/government pages. Disclosure is the intended behavior of citation links. | Yosef Ardhito | 2026-05-14 |
| AR-03-07 | T-03-07 | Only public procurement metadata emitted. Fields are institution names, work units, budget figures, package names, and AI-generated flag reasons — all derived from official SIRUP records with no personal identifiers. | Yosef Ardhito | 2026-05-14 |
| AR-03-14 | T-03-14 | No user input ever reaches `href` or `window.location`. Institution search filters a local array only. selectedWord is sourced from a pre-baked allowlist. | Yosef Ardhito | 2026-05-14 |
| AR-03-17 | T-03-17 | Pure static read-only site. No auth, no sessions, no server. Elevation of privilege has no attack surface. | Yosef Ardhito | 2026-05-14 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-05-14 | 17 | 17 | 0 | gsd-secure-phase (claude-sonnet-4-6) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-05-14
