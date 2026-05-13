# IDSTERITY

# Goal

Deliver a key message: "We're spending like there's no tomorrow" through a visual storytelling website.
Reader call to action after this: "Be mindful of your budget" — delivered with irony. The government
lectures citizens to save while burning public funds on absurd procurement. Tone: dark humor, laugh-cry.

# Background

Inspired by https://nemesis.assai.id/ (reference website) who's kindly volunteer their token budget to identify absurd spending in the Indonesian government

# Problem Statement

The reference website is a descriptive analysis, which demand initial intention from users when they go to the website. The strong message then under-deliver. This project aims to provide a narrative format of the same data and help pinpoint the message and, hopefully, the urgency.

# Deliverable

A website that can be build to static js to be uploaded on a general hosting server.

# Tech Stack

Vite + Svelte + d3.js

# Non-functional Req

1. Lightweight: snappy experience, simple UI
2. Website is in English
3. The main story should take < 3 minutes to read

# Tone

Ironic / dark humor — "laugh-cry." The joke is the contrast: Prabowo publicly promises extreme efficiency
and cutting spending, while procurement records show the opposite. Don't lecture. Let the numbers do
the irony. Every section should feel like a slow reveal of the punchline.

# Audience

Indonesian general public. Prioritize emotional resonance and shareability over analytical depth.
Anchors (kopi jago, seblak, schools, hospitals) are first-class — they make the number real.

# Storyline

1. **Hook** — Opening line: *"Follow the… Where is the money?"*
   Then: curated news quotes and headlines of Indonesian government officials (especially Prabowo)
   promising to cut spending and be fiscally responsible. Show 3-5 quotes with publication links.
   The quotes answer the setup — they promised to save it. Now let's see what happened.

2. **APBN 2026 Q1 Deficit** — Show the Q1 2026 deficit (0.93% of GDP as of March 2026) compared to
   recent years. Key source: https://tirto.id/defisit-apbn-tembus-093-terhadap-pdb-di-maret-2026-hvn8
   Reference comparison points:
   - Oct 2024: Rp309.1 T (1.40% PDB)
   - Full-year 2025: Rp695.1 T (2.92% PDB)
   - Source index: https://tirto.id/q/defisit-apbn-e8s
   **Research needed:** pull exact Q1 2026 absolute figure (Rp T) from the article above.

3. **BPS GDP Growth** — Show Q1 2026 GDP growth and specifically how much government spending
   contributed vs. previous quarters. The angle: GDP held up partly *because* of government spending —
   which makes the waste more ironic, not less.
   Source: https://www.bps.go.id/id/statistics-table/2/MTA0IzI=/pertumbuhan-ekonomi--triwulan-i-2026.html
   **Research needed:** extract government consumption component (konsumsi pemerintah) for Q1 2025,
   Q2 2025, Q3 2025, Q4 2025, Q1 2026 to show trend. Find prior-year equivalents for comparison.

4. **inaproc Dataset Overview** — Introduce the procurement data. Answer:
   - What is the data period? (2026 SIRUP/LPSE records)
   - Total spending in dataset vs. APBN 2026
   - Breakdown by AI label: low / med / high inappropriateness
   - Note: add safe harbour disclaimer about AI labeling
   - Data source: inaproc-ds/outputs/ (pre-loaded, ~123 shards)

5. **Who Spent the Most?** — Rank institutions (lembaga) by total pagu. Show breakdown by
   isInappropriate label (low/med/high) per institution as stacked bars.

6. **Absurd Only** — Filter to `tags.isInappropriate = "high"`. Re-rank institutions.
   This is where the story sharpens.

7. **Anchor the Number** — Give the total for "absurd" (high) spending. Then anchor it:
   - How many kopi jago can you buy?
   - How many portions of seblak?
   - How many elementary schools can you build?
   - How many puskesmas (community health centers)?
   Make this interactive or animated — one anchor at a time.

8. **What Are They Buying?** — Word cloud of item names (paket) from the absurd subset.
   Data prep: Python NLP script runs offline once, outputs a word-frequency JSON baked into
   the static build. No runtime processing.

9. **Explore** — Clicking a word in the cloud filters a simple table: who spent how much, for what
   (lembaga, satker, pagu, paket, inappropriateReason). Lets the user discover their own punchlines.
