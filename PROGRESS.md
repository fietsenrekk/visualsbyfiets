# Progress log

## 2026-07-16 — risk.film-style Work + About pages

Goal: rebuild /work and /about with the exact UI + scroll mechanism of
https://www.risk.film/works and /about, keeping the same color panel when
opening a work.

### Reference study (fetched risk.film HTML/CSS/JS directly)
- Palette: black `#000` + beige `#e6d5bb`, font **Syncopate** (+ Red Hat Display nav).
- /works: fixed 100vh scene; **infinite horizontal carousel** of 35rem×22rem video
  cards; wheel/drag/touch feed a lerped `target`, items wrap around total width;
  intro scales cards from 0.4; mobile swipes snap next/prev. Decor: dot columns,
  GPS coordinates, centered tiny nav, loader with growing ticks + giant 00→100 counter.
- /work/[slug]: full-screen video in the same black/beige panel, custom player
  (play · seek timeline · running 00:00:00 timer · mute), client/title bottom-left,
  "© credits" toggle, close X.
- /about: fixed scene; **infinite vertical manifesto track** (two copies of the
  paragraph spaced ~120vh, wheel-driven, seamless wrap), contact links row with
  rules, bordered slogan grid, credits line.

### Implementation
- `css/risk-pages.css` — scoped to `body.risk-page` (other pages untouched).
- `js/risk-common.js` — loader (ticks + counter), dot columns, lerp/wrap helpers.
- `js/risk-work.js` — infinite carousel; velocity skew; drag-vs-click detection;
  detail panel with custom player; ESC/close; **video pooling** (only cards near
  the viewport hold a live <video>; others fall back to poster <img> — required
  after 18 eager videos froze the embedded renderer, and better on phones anyway).
- `js/risk-about.js` — manifesto track with ambient drift + wheel/touch input,
  re-measures on resize and font-load.
- `work.html` / `about.html` rewritten; VBF content (18 pieces from js/data.js),
  Amsterdam coordinates, "if they scroll past, it didn't happen" slogan.
- Debug handles: `window.__VBF_WORK`, `window.__VBF_ABOUT`.

### Verified (local, via scripted browser checks)
- Carousel: itemW/total math, movement, infinite wrap bounds, ≤4 live videos.
- Detail: opens with correct video, plays unmuted, timer runs, credits toggle,
  close clears src. About: 2 track copies, wrap math, links/grid present.
- Loader, dots, nav, labels render (screenshot).

### Notes / limitations
- Embedded preview pane freezes rAF when backgrounded — visual checks done via
  screenshots + live site in real Chrome.
