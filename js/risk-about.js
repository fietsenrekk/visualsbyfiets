/* ============================================================
   ABOUT — infinite vertical manifesto track (risk.film mechanic)
   Two copies of the manifesto spaced far apart; wheel / touch
   feeds a lerped target and the track wraps seamlessly.
   ============================================================ */

(function () {
  const track = document.querySelector(".r-about-track");
  if (!track) return;

  const state = { current: 0, target: 0, half: 0, locked: true };

  function measure() {
    // two identical halves → wrap at half the full height
    state.half = track.scrollHeight / 2;
  }
  measure();
  window.addEventListener("resize", measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

  window.addEventListener("wheel", (e) => {
    if (state.locked) return;
    state.target += e.deltaY;
  }, { passive: true });

  let touchY = null;
  window.addEventListener("touchstart", (e) => { touchY = e.touches[0].clientY; }, { passive: true });
  window.addEventListener("touchmove", (e) => {
    if (state.locked || touchY === null) return;
    const y = e.touches[0].clientY;
    state.target += (touchY - y) * 2;
    touchY = y;
  }, { passive: true });
  window.addEventListener("touchend", () => { touchY = null; });

  function raf() {
    if (!state.locked) state.target += 0.25; // slow ambient drift
    state.current = R.lerp(state.current, state.target, 0.08);
    const y = -R.wrap(state.current, state.half);
    track.style.transform = `translateY(${y}px)`;
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  function intro() {
    state.locked = false;
  }

  rBuildDots(document.querySelector(".r-dots"));
  rBuildLoader();
  let loaderStarted = false;
  const startLoader = () => {
    if (loaderStarted) return;
    loaderStarted = true;
    rRunLoader(intro);
  };
  window.addEventListener("load", startLoader);
  setTimeout(startLoader, 2500);

  /* debug/testing handle */
  window.__VBF_ABOUT = { state, track, measure };
})();
