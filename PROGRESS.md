# Progress log

## 2026-07-16 (4) — fluid v2: smooth like the reference

User flagged blocky noise + point-cursor vs risk.film's smooth blobs + lens
circle. Rewrote the shader to the reference structure:
- highp + precision-safe hash (the sin-hash was breaking into grid artifacts),
  quintic-interpolated value noise, only 3 low-freq octaves → large smooth blobs.
- Two big color zones (warm ember→amber→cream / cool navy→steel→sky) with a
  **molten glowing rim** where they meet (risk's signature), dark shadow pockets.
- Cursor is now a big circular lens (R≈25% of viewport height): refracts the
  field radially + faint cream ring at the edge, baseline-visible and charged
  by movement. Render scale 0.5→0.6.
- Verified by pixel sampling: avg adjacent delta 5.5 (was blocky), 0.8% sharp
  pairs = rim crossings only, both zones present, rim colors found, ring
  luminance 101→168 when charged.

## 2026-07-16 (3) — fluid "puddle" background site-wide

- `js/fluid-bg.js`: dependency-free WebGL fragment shader — double domain-warped
  fbm (IQ style), palette-locked ribbons (bronze → molten amber → cream #e6d5bb
  warm side, slate → ice-blue cool side) over dominant black, vignette. Cursor
  is a spring: movement charges an energy uniform that swirls + heats the warp
  locally and decays in ~1s. Renders at 0.5× resolution, pauses when hidden,
  respects prefers-reduced-motion, self-mounts as first body child at z-index 0.
- Mounted on all six pages; homepage 3D chrome logo removed (hero3d.js deleted,
  importmap gone) — the hero type now sits directly on the fluid.
- Verified via `window.__VBF_FLUID.snapshot()` pixel sampling: warm + cool
  ribbons + black balance across 4 timestamps, hover energy lifts center
  luminance 1→24, paints on index/work/about, carousel (z90) and manifesto
  (z3) stack above the fluid (z0), console clean.

## 2026-07-16 (2) — exact carousel physics + site-wide beige/Syncopate

- Work carousel physics now 1:1 with risk.film's bundle: smoothed-velocity
  card scaling `max(0.35, 1 - |lspeed|·0.7)`, parallax spread from center
  (±60% × speed), snap-to-card (0.1 / 0.07 mobile), lerp 0.12/0.1,
  speedDecay 0.9/frame, wheel `target -= δ·0.0015·itemW`. Intro (0.4→1,
  staggered) folded into the physics loop so GSAP and layout() never fight.
- Mobile about fixed: gradient mask fades the looping text near the chrome,
  container clears the fixed nav, info links wrap, grid fits 390px, no
  horizontal overflow (all verified at 390×844).
- Whole site retokened: black `#000` + beige `#e6d5bb`, Syncopate display,
  Red Hat Display body, every display size recalibrated for Syncopate's
  width, Three.js hero rim light beige, zero acid-green refs left.
- All verified locally: physics transforms (scale 0.44 @ speed 0.8, spread
  offsets), shop Stripe buttons intact, index tokens/fonts/no-overflow,
  console clean. Versions bumped to v3.

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

### Review-pass fixes
- About loop period: was `scrollHeight/2` (934px) → seam; now copy-to-copy
  `offsetTop` distance (1414px) → verified seamless.
- Posters: dropped `loading="lazy"` (unreliable inside transformed carousels).
- `.r-worklist`: `touch-action:none` + own pointer-events so touch drag works.
- Loader + intro survive a GSAP CDN failure (no-op fallback clears the screen).
- Re-measure about track on `document.fonts.ready`.

### Verified computed-style audit (both pages)
- bg rgb(0,0,0), ink rgb(230,213,187), Syncopate, uppercase, fixed centered nav,
  cards 35vw×22vw, dots beige, overflow hidden, track will-change transform.

### Notes / limitations
- Embedded preview pane + background tabs freeze rAF (loader waits for
  visibility) — normal for real foreground users; mechanics verified via
  scripted checks, layout via screenshots/computed styles.
