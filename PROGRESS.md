# Progress log

## 2026-07-20 — footer signature: telemetry scan on the logo

User asked for the Unicorn Studio scene effect on the main logo, in the
site colorway. A raw Unicorn embed can't work: its colors are baked into
the hosted project (`61w8ZtzLS8iS8YyHdBkN`) and can't be recolored from
outside, so it was rebuilt natively in `js/logo-fx.js`.

Effect layers (matching the reference frames):
- **Ordered-dither pixel matrix** — analytic Bayer 8x8 on a device-pixel
  cell grid; cells tighten from 4px → 2px under the cursor (17 tonal
  steps measured, so it dithers rather than posterizes).
- **Moving scanlines** — 3px line striping + two bright lines sweeping
  vertically at different rates.
- **Glitch blocks** — uv quantized into ~20% randomly-offset blocks,
  re-rolled 3x/sec; the cursor drags blocks along its vector.
- **Chromatic split** — R/B alpha offset, widening inside the trace.
- **Background blocks** — faint dithered blocks drifting behind the mark
  (rendered where logo alpha ≈ 0 instead of discarding).
- **Cursor tracing** — 8-point decaying trail passed as `vec3[8]`;
  sharpens dither, brightens, drags blocks, boosts readouts.
- **Numeric telemetry** — 10 DOM readouts (mono, ~11 Hz, mixed
  `0.0000` / 4-digit ints, every 4th boxed in the accent color).

Theme-aware (gold ↔ violet palettes tween on `data-theme`), paused when
offscreen/hidden, single calm frame + no moving parts under
reduced-motion, `<img>` fallback with no WebGL.

Placed as `.footer__signature` on index/shop/contact/thanks (the risk
pages keep their own fixed-scene chrome); the now-redundant small footer
logo img was removed. Verified: maxAlpha 255 / 23.4% coverage (the mark),
trace raises coverage to 24.2%, 10 readouts ticking, renders in both
themes, zero console errors.

## 2026-07-18 (2) — footer signature (liquid-metal logo)

User supplied a Webflow embed for a Unicorn Studio scene
(`data-us-project="61w8ZtzLS8iS8YyHdBkN"`) and asked for that effect on
the main logo "in the same colorway as the site". A hosted Unicorn scene
carries colors baked into the remote project and can't be recolored or
theme-linked from our side — so the effect was rebuilt natively instead:

- `js/logo-fx.js` — self-contained WebGL component on `[data-logo-fx]`.
  The transparent mark (`logo-white.png`) is sampled as an alpha mask;
  fbm flow warps the sample coords (liquid motion), a soft RGB split adds
  liquid-glass refraction, and the fill is a 3-stop gradient in the site
  palette (bronze → beige #e6d5bb → cream; violet theme: indigo →
  lavender #b9a6ff → lilac). Cursor proximity swells the warp and adds a
  highlight bloom.
- Theme-aware: a MutationObserver on `data-theme` retargets the color
  stops, which lerp over ~0.9s to match the theme engine's cross-fade.
- Robust: the logo's tight bounding box is measured on load (no dead
  margin, sets the container aspect-ratio), rAF pauses off-screen and on
  hidden tabs, DPR capped at 2, static single frame under reduced motion,
  `<img>` fallback when WebGL or the texture fails.
- Footer: new `.footer__signature` crown above `.footer__top` on index /
  shop / contact / thanks; the now-redundant small footer logo `<img>`
  was removed. CSS bumped to v5.
- Verified: renders (screenshot — mark reads as flowing liquid metal in
  the cream colorway), aspect 1.6233 measured from the artwork, WebGL
  context live, theme switch keeps the canvas alive, no console errors.
  Post-screenshot tweak: chromatic split reduced 0.004→0.0022 and glint
  0.6→0.32 so the sheen stays inside the brand palette.

## 2026-07-18 — repricing + monthly partnerships

- One-off reprice everywhere (cards, buy buttons, hero copy, footers,
  contact select, meta/og, about credits line, README): Standard €150,
  Signature €250, 3D Logo €499, Bundle €649 ("save €149" = 250+499+49−649),
  extra revision €50. Digital unchanged (€29/€49).
- shop.html: new "01 — Monthly partnerships" section ABOVE services
  (renumbered 02/03/04): Brand Motion Retainer from €2,500/mo (Book a call),
  Creator Content Partner €1,250/mo (Apply), Motion Department from
  €6,000/mo (featured anchor, Enquire) — all CTAs → contact.html, no
  Stripe buttons. Two partnership FAQ entries added; refund answer intact.
- index.html: repriced teaser + "Monthly partnerships from €1,250/mo →"
  CTA to shop.html#partnerships; contact form gained a partnership option.
- Stats fixed: values now live in `VBF_STATS` at the top of main.js
  (TODO for real figures), rendered as static text in the HTML too —
  zeros are impossible even with JS off; count-up is an enhancement
  keyed by data-stat and skipped under reduced motion.
- Stripe caveat honored: link URLs untouched; TODO comments above every
  repriced buy button + in store.js. Four new Payment Links needed
  (150/250/499/649) — checklist delivered in chat.
- Verified: grep clean of old prices; partnerships above services on
  desktop + 390px; partnership CTAs → contact, 6 one-off buy buttons
  still Stripe-wired; stats render 150+/10M+/30+; meta/og updated;
  no console errors.

## 2026-07-16 (5) — award-level elevation pass

**Fluid:** `js/fluid.js` — the real Navier-Stokes simulation (Dobryakov MIT,
Kabalin background adaptation, provided by the user) replaces the procedural
shader. Stripped config.json/capture/checkerboard/dither-PNG; palette-locked
dye (no rainbow); window-level pointer input; scroll → rising turbulence;
section-enter splats; hover micro-splats on interactive elements; quality
governor (drops dye res + bloom if avg fps < 45 over the first 2s); pauses
hidden; reduced-motion = still. Public API `VBFluid.{splat,burst,setPalette,calm}`.

**Theme engine:** `js/theme.js` + CSS vars. gold (brand default) / violet
(deep black #050308, purple dye, lavender accent #b9a6ff). Pre-paint boot
script on every page (no flash), `html.theming` cross-fades all colors for
0.9s (never snaps), fluid re-dyed + soft burst on switch, localStorage,
toggle injected into both nav styles with aria-pressed.

**Works detail — close-button root cause:** `.r-nav` (z-97, fixed, full-width)
sat ABOVE `.r-detail` (z-95); the nav's hitbox swallowed every click on the
close button. Fixed: detail → z-98 and nav+dots fade out while open. Full
dialog overhaul: role=dialog/aria-modal, focus → close btn on open and back
to the card on close, focus trap on Tab, ESC / outside-click(letterbox) /
swipe-down close, click video = play-pause, Space toggles, ←/→ seek 5s,
rapid open/close guarded by a token that voids stale play() promises,
cards are tabbable role=button with Enter/Space.

**Cursor:** `js/cursor.js` — dot + trailing ring, context states
(hover/play/drag/close with Syncopate labels), press feedback, magnetic
nav links, hidden on touch, instant-follow under reduced motion. Old
per-page cursor removed.

**Intro:** homepage preloader (fake 0→100 counter) replaced by an intro
veil — mark + word fade, fluid burst ignites behind, veil dissolves into
the hero (~1.9s), skipped for repeat visits (sessionStorage) and
reduced-motion.

**A11y/perf:** skip-link, :focus-visible, reduced-motion kills marquee/
noise/scroll pulse, DPR capped, sim 128 / dye 1024 (512 + no bloom on
mobile or weak GPUs). Dead code removed: fluid-bg.js, hero3d refs,
.preloader and legacy .cursor CSS/JS.

**Verified:** theme click → violet with cross-fade + persistence; fluid
burst API ok; detail gauntlet all green (close/ESC/outside/rapid/focus/
aria/keyboard/swipe); arrow-seek + space verified after metadata; all six
pages 200, zero console errors; no stale references.

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
