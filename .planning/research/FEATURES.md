# Features Research

**Project:** idsterity — Indonesian procurement waste scrollytelling
**Domain:** Data journalism / scrollytelling web narrative
**Researched:** 2026-05-13
**Overall confidence:** HIGH (Pudding process docs, DataReportal, Smashing Magazine, NNGroup)

---

## Table Stakes (must have or users leave)

| Feature | Rationale | Consequence if Missing |
|---------|-----------|----------------------|
| Sticky graphic + scrolling text steps | The core Pudding pattern. Graphic locks; prose triggers transitions. Without it the piece is just a long article. | Story loses all pacing; emotional beats evaporate |
| Mobile-responsive layout | 74.6% of Indonesia's 212M internet users are mobile-first (DataReportal 2025). LinkedIn link taps almost always happen on phone. | Majority audience sees a broken experience; link does not spread |
| OG tags: title, description, image (1200×627) | LinkedIn scrapes these at share time. Without them the preview is a blank card — fatal for shareability. | Share rate collapses; piece never exits first sharer's network |
| Under-3-minute read time | Stated project constraint. Attention is the scarce resource. Long-form that loses readers before the punchline fails its core value. | Emotional gut-punch never lands; completion rate → drop off |
| Indonesian-language copy as default | Target audience is Indonesian general public. English default adds a friction barrier before the first sentence. | Immediate language barrier; casual readers bounce |
| Section navigation anchor (even if hidden) | Users who share mid-story or return later need a way back. Headless `id` anchors on each section satisfy this without visible chrome. | Deep-link sharing is impossible; shareability limited to front-page |

---

## Differentiators (competitive advantage for this piece)

| Feature | Value Proposition | Complexity |
|---------|-------------------|------------|
| Kopi-jago / seblak / school anchor animations | Indonesian-culture-specific comparisons. Makes an abstract IDR trillion figure visceral and shareable in itself. Unique to this piece. | Medium — animated counter sequence, pre-computed values |
| Word cloud click-to-explore (Sections 8→9) | Converts passive reading into active discovery. Readers find their own punchlines ("wait, my regency spent HOW MUCH on jasa konsultansi?"). Self-directed discovery creates stronger emotional ownership than author-presented facts. | Medium — D3 cloud layout, filter state, table render |
| Official-quote hook (Section 1) | Opens with the politicians' own words. The irony gap between promise and data is the entire joke — establishing it early is what makes everything downstream land. | Low — static quotes, styled callout cards |
| Ironic dark-humor tone throughout copy | Differentiates from dry government transparency sites (like nemesis.assai.id). Tone is the product. | Low — copy writing discipline |
| Bilingual toggle (ID/EN) at one URL | Enables a bilingual professional audience to share a single link to both language groups. Rare for Indonesian data journalism. | Medium — reactive i18n store in Svelte 5 |
| AI-labeling safe-harbour disclaimer visible in Section 4 | Builds credibility before the damning numbers appear. Transparency about methodology is increasingly expected by LinkedIn's professional audience. | Low — static copy block |

---

## Anti-Features (deliberately NOT build)

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Scroll-jacking (override native scroll speed) | NNGroup classifies it as a UX violation. On mobile it is actively disorienting. IntersectionObserver-based steps trigger on natural scroll — never override scroll velocity. | Use Scrollama / IntersectionObserver step triggers only |
| Stepper / click-to-next pagination | Moving away from click-to-reveal is the whole point of scrollytelling. Click fatigue kills completion rate on mobile. | Keep native scroll as the only input |
| Live/dynamic data fetching at runtime | Project constraint: static build. Runtime fetches add latency, can fail, and break on shared hosting without CORS headers. | Pre-aggregate all JSON at build time with offline Python pipeline |
| Full NLP word cloud at runtime | Client-side NLP is heavy, slow, and non-deterministic. Cap is already decided (top 15–20). | Run offline Python NLP, bake frequency JSON into static build |
| Chapter/section menu overlay | Adds visual chrome that fights the "minimal chrome" Pudding aesthetic. Users do not need a TOC for a 3-minute story. | Hidden `id` anchors only; no visible nav |
| Share counter display | Adds server-side state, kills static constraint, and can backfire (if counts are low it signals unpopularity). | Let OG metadata do the work; no engagement counters |
| Autoplay video or audio | Hostile on mobile data plans. Indonesian mobile broadband median is 29 Mbps but the audience skews budget devices with limited data. | Use CSS/D3 animations; no media assets beyond static images |
| Dark mode toggle | Adds UX complexity for minimal gain in a piece designed to be read once, shared once. | Single high-contrast light theme matching Pudding aesthetic |

---

## Scrollytelling UX Patterns

### The Canonical Pudding Pattern (use this)

**Sticky graphic + scrolling prose steps:**

```
[sticky panel: chart/visualization, 50–60% of viewport]
[scrolling steps: short text blocks, 40–50% of viewport width]
```

- The graphic becomes `position: sticky; top: 0` and occupies its lane for a named section.
- Step elements are the scrolling copy blocks. Each step crossing the viewport midpoint triggers a chart state transition.
- On mobile: stack vertically — text on top, chart below (or interleaved). Keep scrolly only if transitions encode time/space relationships essential to the story (true for Section 5/6 bar chart transitions).

**IntersectionObserver is the right primitive.** Scrollama.js (Pudding's own library) wraps IntersectionObserver cleanly and is what the existing POC already uses. Stick with it. Do not use scroll event listeners — they cause jank on iOS Safari.

### Step Reveal Mechanics

- Steps should be short (1–3 sentences max). Cognitive load from reading + watching a chart update simultaneously is high.
- Each step should change *one thing* in the visualization, not rerender everything. Morph, fade, highlight — not full swap.
- Step trigger threshold: 50% of step element visible (Scrollama default). Do not use 100% — it fires too late on small mobile viewports.
- Exit direction matters: entering from below should trigger forward transition; entering from above should trigger reverse (backward scroll). Scrollama provides `direction` in the step callback.

### Transitions

- Duration: 400–600ms for data transitions. Shorter feels abrupt; longer feels sluggish for a 3-minute story.
- D3 transitions on SVG elements are the right tool (already in stack). Use `d3.transition().duration(500).ease(d3.easeCubicOut)`.
- Avoid transitions that require the user to wait before scrolling again. Transitions must be interruptible.
- For the anchor animation (Section 7): use a counting animation (counter ticks up from 0 to final value) — this is a proven journalism technique for making a number feel earned.

### Progress Indicators

Recommendation: **include a subtle section-dot indicator** (5–7 dots representing story beats, not scroll percentage). Rationale:
- A 3-minute story has enough length that "where am I?" becomes relevant after Section 4.
- Dot indicators convey story structure, not just position — they signal "you're 60% through the narrative arc," which is motivationally different from a scroll progress bar.
- Scroll progress bars work against the sticky pattern (the bar barely moves while a sticky section is active).
- Keep dots small and unobtrusive — top-right on desktop, hidden on mobile to preserve screen real estate.

---

## Anchor Pattern Best Practices

### Why Anchors Work

Abstract numbers fail because human cognition has no intuitive scale for IDR trillions. Anchor comparisons exploit the psychological "availability heuristic" — if you can picture the equivalent, you feel the magnitude. The goal is a momentary "oh my god" before the next scroll.

### Proven Anchor Techniques (apply to Section 7)

**1. Everyday consumer items at Indonesian price points**

Map the total high-inappropriate pagu to:
- Cups of Kopi Jago (~IDR 3,000–5,000) — known to every class of Indonesian
- Portions of seblak (~IDR 10,000–15,000) — street food, affectively working class
- Elementary schools built (~IDR 1–2B per school, use BPS/Kemdikbud average) — civic, tangible
- Puskesmas (community health clinics) built (~IDR 3–5B per unit) — direct public benefit comparison

This is already in the project spec. These are the right anchors. Do not add anchors that require readers to know foreign reference points (no "equivalent to X Boeing 737s").

**2. Animated counter reveal** — do not just display the anchor number. Count up from zero over ~1.5 seconds as the step enters. The motion makes the number feel like it's being "spent" in real time.

**3. One anchor at a time** — Section 7 shows one anchor per scroll step, not all four simultaneously. Seeing "1.2 million cups of kopi jago" then scrolling to "86,000 elementary schools" creates a compounding emotional effect that a grid of four numbers cannot.

**4. Round down, not up** — Journalism convention. "Over 80,000 schools" is more credible than "86,342 schools." Precision signals data; rounding signals story. For the irony to land, the story frame must dominate.

**5. Call out the source unit** — Each anchor must show the assumed price (e.g., "at IDR 4,000 per cup"). This is the safe-harbour equivalent for anchors — it invites readers to do their own math rather than distrust yours.

### Anchor Calculation Workflow (implementation note)

Pre-compute all anchor values in the offline Python pipeline. Store in a single `anchors.json` file baked into the static build. Do not compute in the browser.

---

## Bilingual Toggle UX

### Placement

**Fixed position, top-right corner of the viewport.** This is the near-universal convention verified by Smashing Magazine and multiple localization UX guides. Rationale:
- Top-right is a learned convention; Indonesian users who recognize it do not need to hunt.
- Fixed positioning means it remains accessible through the full scroll journey — critical for a long-form piece where a reader might decide mid-story to switch.
- On mobile: move to top-right of the sticky header bar, not floating (floating elements obscure content on small viewports).

### Design

- Label: `🇮🇩 ID / EN` or simply `ID | EN` with the active language highlighted/underlined. Do not use flags alone (accessibility). Do not use "Bahasa Indonesia" — it is too long for a toggle chip.
- Toggle, not dropdown. Only two languages. A dropdown adds unnecessary interaction cost.
- Contrast: light pill with subtle border on the light background. Do not use color to encode "active" on the toggle — use font-weight or underline (more accessible).

### Behavior

- On toggle: swap all copy strings reactively via a Svelte 5 store. No page reload. No URL change (single URL policy is already decided).
- **Persist scroll position on toggle.** This is the critical UX detail. A reader mid-story switching language should remain at the same section, not jump to the top. Implement by reading `window.scrollY` before the store update and restoring it with `requestAnimationFrame` after the DOM rerenders.
- **Do not** persist the language preference to localStorage. Rationale: the URL is shared; the person receiving the link should get the default (Indonesian), not the sharer's setting. Language state is session-only.
- Transition: a 150ms crossfade on the text container body is appropriate. Faster feels glitchy; slower interrupts reading flow.

### i18n Architecture

Use a single flat JSON object keyed by string ID, with `id` and `en` sub-keys. A Svelte 5 `$derived` store returns the active locale's strings. No external i18n library needed for two languages and ~50 strings.

```
{ "section1.headline": { "id": "Ke mana perginya uang?", "en": "Where did the money go?" } }
```

---

## Shareability Optimization

### Required OG Tags

```html
<meta property="og:title" content="Ke mana perginya uang? | idsterity" />
<meta property="og:description" content="Data 2026 menunjukkan triliunan rupiah anggaran pemerintah berpotensi terbuang sia-sia. Ini ceritanya." />
<meta property="og:image" content="https://yosef.id/idsterity/og.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="627" />
<meta property="og:url" content="https://yosef.id/idsterity/" />
<meta property="og:type" content="article" />
<meta name="twitter:card" content="summary_large_image" />
```

LinkedIn uses `og:` tags directly (no Twitter-specific fallback needed, but `twitter:card` improves Slack/Twitter previews as secondary channels).

Use LinkedIn's Post Inspector (`linkedin.com/post-inspector`) to force a re-scrape after deploy. LinkedIn caches aggressively.

### OG Image Design (the most important shareability asset)

The OG image (1200×627) is what stops the scroll on a LinkedIn feed before anyone clicks. It should:

- Display a **single, high-contrast number** — the total absurd spending in IDR trillions, large, centered. e.g., "Rp 47,3 Triliun" at ~120px font.
- Add a short ironic subtitle in Indonesian: "Yang (mungkin) terbuang" or similar.
- Use the project's Pudding-inspired typography — bold serif or chunky grotesque.
- Dark background with white text OR white background with black text + one accent color (red for the number). High contrast survives thumbnail rendering.
- Do NOT include the word cloud or bar chart — they are unreadable at OG image size.
- Generate as a **static PNG at build time** (a simple Python/Pillow script or a headless browser snapshot of an HTML template). Static hosting cannot generate dynamic OG images.

### First Viewport Hook

The first viewport is the second shareability lever (after the OG image). When a reader lands:
- Show the official quote immediately — large, styled, attributed. No hero image, no loading spinner.
- The quote should be visually "sticky" in feeling even before the scroll mechanism activates — large type, centered, short.
- Below the fold hint: a subtle "scroll" indicator (animated arrow or "↓ gulir" text) signals this is not a static page.

### LinkedIn-Specific Behavior

- LinkedIn link previews pull the OG image but NOT the page background. The OG image must be self-contained and compelling.
- LinkedIn members scroll fast. The OG title must create a question or a provocative claim in <60 characters. "Ke mana perginya Rp 47 triliun?" works. "idsterity: Indonesian Procurement Data 2026" does not.
- Posts that include a personal reflection from the sharer ("I built this...") consistently outperform bare link drops on LinkedIn. Design a shareable clip or suggested caption for sharers to copy — a simple "Copy caption" button on the final section (Section 9) is low effort and high value.

---

## Mobile Minimum

### Context

- Indonesia: 212M internet users, ~356M mobile connections, median mobile download speed 29 Mbps (DataReportal 2025).
- LinkedIn link clicks happen predominantly on mobile. The piece will be read on Android phones (budget Xiaomi/Samsung) more than desktop.
- Budget Android devices have limited RAM. Heavy canvas operations and large SVGs are fragile.

### Non-Negotiable (ship without these = broken)

| Requirement | Implementation |
|-------------|---------------|
| Stacked layout on <768px | Convert sticky side-by-side to vertical stack: text step above or below the visualization panel. No horizontal scrolling. |
| Touch scroll triggers correctly | Scrollama on iOS Safari requires `passive: true` event listener option. Verify step offsets are computed after fonts load (font swap can shift layout and misalign step triggers). |
| No horizontal overflow | All SVG viewBoxes must be responsive. D3 charts must resize on `ResizeObserver`. Fixed-width SVGs cause horizontal scroll — kills the experience. |
| Tap targets ≥ 44×44px | Word cloud words, language toggle, filter buttons must meet this. D3 word clouds render small words — add transparent tap-target padding via pointer-events area, not font size. |
| OG image loads fast | Static PNG, <200KB, served with far-future cache headers. |

### Strongly Recommended (ship without these = degraded)

| Feature | Recommendation |
|---------|---------------|
| Word cloud on mobile | Simplify to a scrollable tag-chip list on <480px. D3 word cloud layout on a 360px canvas produces overlapping, unreadable text. Tag chips are tappable and filterable without the layout algorithm. |
| Section dot indicator | Hide on mobile (saves ~40px vertical). Story is short enough that progress is implied by scroll position. |
| Anchor animation | Retain but reduce duration to 800ms on mobile (users scroll faster on touch). |
| Font loading | Use `font-display: swap`. Do not load >2 font weights. A bold grotesque (1 weight) + system fallback is sufficient. |

### Skip for V1

| Feature | Reason |
|---------|--------|
| Offline / PWA support | Adds build complexity; procurement data is not the kind of content users bookmark for offline reading. |
| Reduced motion query | Good practice but not blocking for V1. Add `prefers-reduced-motion` to disable D3 transitions in V2. |
| iOS standalone mode styling | Not a PWA; not needed. |

---

## Sources

- [Pudding: Easier scrollytelling with position sticky](https://pudding.cool/process/scrollytelling-sticky/)
- [Pudding: Responsive scrollytelling best practices](https://pudding.cool/process/responsive-scrollytelling/)
- [Pudding: An Introduction to Scrollama.js](https://pudding.cool/process/introducing-scrollama/)
- [NNGroup: Scrolljacking 101](https://www.nngroup.com/articles/scrolljacking-101/)
- [Smashing Magazine: Designing a Perfect Language Selector](https://www.smashingmagazine.com/2022/05/designing-better-language-selector/)
- [DataReportal: Digital 2025 Indonesia](https://datareportal.com/reports/digital-2025-indonesia)
- [LinkedIn Help: Make your website shareable](https://www.linkedin.com/help/linkedin/answer/a521928)
- [LinkedIn Engineering: Post Inspector](https://engineering.linkedin.com/blog/2018/06/post-inspector--a-tool-to-optimize-content-sharing)
- [Reynolds Center: Making big numbers relatable](https://businessjournalism.org/2017/10/writing-millennials-making-big-numbers-relatable/)
- [The Conversation: Millions, billions, trillions — making sense of numbers](https://theconversation.com/millions-billions-trillions-how-to-make-sense-of-numbers-in-the-news-86509)
- [GIJN: The Pudding data visualization climate change](https://gijn.org/stories/the-pudding-data-visualization-climate-change/)
- [UX Design: Pros and cons of progress indicator as a scroll bar](https://uxdesign.cc/pros-and-cons-of-progress-indicator-as-a-scroll-bar-345f19967cb6)
- [og-image.org: LinkedIn OG Image Guide](https://og-image.org/docs/platforms/linkedin)
