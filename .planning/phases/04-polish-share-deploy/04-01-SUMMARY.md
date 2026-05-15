---
plan: 04-01
status: complete
completed: 2026-05-15
commits:
  - 2cf93a7
  - 9fa5794
  - 673fb49
requirements_satisfied:
  - SHARE-01
  - SHARE-02
---

## Summary

Added 9 OG meta tags to `dashboard/index.html` pointing to `https://yosef.id/sterity/` and committed the LinkedIn share card image at `dashboard/public/og-image.jpg`.

## Tasks Completed

1. **OG meta tags inserted** — 9 tags added to index.html `<head>`: og:type, og:locale, og:url, og:title, og:description, og:image, og:image:width, og:image:height, og:image:type. All point to absolute URLs at `https://yosef.id/sterity/`.
2. **og-image.jpg created** — 1200×627px JPEG, 108KB (under 200KB limit), generated with Nano Banana 2, committed at `dashboard/public/og-image.jpg`.
3. **Copy finalized** — og:title and og:description replaced with real Indonesian hook copy (no PLACEHOLDERs).

## Acceptance Criteria

- [x] `grep -c 'property="og:'` returns 9
- [x] og:image points to `https://yosef.id/sterity/og-image.jpg`
- [x] og:url is `https://yosef.id/sterity/`
- [x] og-image.jpg is 1200×627px JPEG, 108KB < 200KB
- [x] No PLACEHOLDER text in index.html
- [x] `<title>` tag unchanged
