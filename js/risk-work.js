/* ============================================================
   WORK — infinite horizontal carousel, physics matched 1:1 to
   risk.film/works (extracted from their production bundle):

     lspeed  = damp(lspeed, speed, 5, dt)      smoothed velocity
     scale   = max(0.35, 1 - |lspeed| * 0.7)   cards shrink w/ speed
     spread  = distFromCenter(items) * |lspeed| * 60% of card width
     current = damp(current, target, 1/lerpFactor, dt)
     snap    → nearest card when input is idle (0.1 / 0.07 mobile)
     wheel   → target -= delta * 0.0015 * itemW ; speed = -delta * .01
     speed  *= 0.9 each frame

   Click a work → full-screen detail panel in the same black/
   beige color panel with a custom play/seek/timer/mute player.
   ============================================================ */

(function () {
  const listEl = document.querySelector(".r-worklist");
  if (!listEl || typeof WORK === "undefined") return;

  const isMobile = () => matchMedia("(max-width: 767px)").matches;
  const damp = (a, b, lambda, dt) => a + (b - a) * (1 - Math.exp(-lambda * dt));

  /* ---------- build items ---------- */
  const items = WORK.map((w) => {
    const parts = w.title.split("—").map(s => s.trim());
    const client = parts.length > 1 ? parts[0] : "VISUALS BY FIETS";
    const piece = parts.length > 1 ? parts.slice(1).join(" — ") : parts[0];
    const item = document.createElement("div");
    item.className = "r-workitem";
    item.innerHTML = `
      <div class="r-worklink" data-id="${w.id}">
        <div class="r-workvideo-w">
          <img class="r-workvideo" src="assets/img/posters/${w.id}.jpg" alt="${piece}">
          <video class="r-workvideo" data-src="assets/video/work/${w.id}.mp4"
                 muted loop playsinline preload="none"></video>
        </div>
        <div class="r-workinfo">
          <h2 class="r-client">${client}</h2>
          <h2 class="r-client">${piece}</h2>
        </div>
      </div>`;
    listEl.appendChild(item);
    return {
      el: item,
      link: item.querySelector(".r-worklink"),
      video: item.querySelector("video"),
      data: w, client, piece
    };
  });

  /* ---------- state ---------- */
  const state = {
    current: 0, target: 0,
    speed: 0, lspeed: 0,
    itemW: 0, total: 0, vw: 0,
    dragging: false, dragStartX: 0, dragStartTarget: 0, moved: 0,
    lastInput: 0,
    locked: true
  };
  let detailOpen = false;

  function measure() {
    state.vw = window.innerWidth;
    state.itemW = items[0].el.getBoundingClientRect().width;
    state.total = state.itemW * items.length;
  }
  measure();
  window.addEventListener("resize", measure);

  /* ---------- input (risk mapping) ---------- */
  window.addEventListener("wheel", (e) => {
    if (state.locked) return;
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    state.target -= d * 0.0015 * state.itemW;
    state.speed = -d * 0.01;
    state.lastInput = performance.now();
  }, { passive: true });

  listEl.addEventListener("pointerdown", (e) => {
    if (state.locked) return;
    state.dragging = true;
    state.moved = 0;
    state.dragStartX = e.clientX;
    state.dragStartTarget = state.target;
    listEl.classList.add("is-dragging");
  });
  window.addEventListener("pointermove", (e) => {
    if (!state.dragging) return;
    const dx = e.clientX - state.dragStartX;
    state.moved = Math.max(state.moved, Math.abs(dx));
    const prevTarget = state.target;
    state.target = state.dragStartTarget + dx * 1.6;
    state.speed = (state.target - prevTarget) * 0.02;
    state.lastInput = performance.now();
  });
  window.addEventListener("pointerup", () => {
    if (!state.dragging) return;
    state.dragging = false;
    listEl.classList.remove("is-dragging");
    state.lastInput = performance.now() - 100; // let snap take over shortly
  });

  /* suppress click after a real drag */
  listEl.addEventListener("click", (e) => {
    if (state.moved > 6) { e.stopPropagation(); e.preventDefault(); return; }
    const link = e.target.closest(".r-worklink");
    if (link) openDetail(link.getAttribute("data-id"));
  }, true);

  /* ---------- video pool ---------- */
  function attach(it) {
    if (!it.video.getAttribute("src")) it.video.src = it.video.getAttribute("data-src");
    if (it.video.paused && !detailOpen && !state.locked) it.video.play().catch(() => {});
  }
  function detach(it) {
    if (it.video.getAttribute("src")) {
      it.video.pause();
      it.video.removeAttribute("src");
      it.video.load();
    }
  }

  /* ---------- layout: position + risk speed effects ---------- */
  const introState = { p: 0 }; // 0→1, staggered per card inside layout()
  function layout() {
    const o = Math.abs(state.lspeed);
    const scale = Math.max(0.35, 1 - o * 0.7);
    const center = state.vw / 2;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const x = R.wrap(i * state.itemW + state.current + state.itemW, state.total) - state.itemW;
      it.el.style.transform = `translateX(${x}px)`;
      // intro: cards grow 0.4→1 with a per-card stagger, folded into the same transform
      const ip = Math.max(0, Math.min(1, introState.p * 1.6 - i * 0.035));
      const ease = 1 - Math.pow(1 - ip, 3);
      const introScale = 0.4 + 0.6 * ease;
      // parallax spread: items further from center shift further, scaled by speed
      const d = (x + state.itemW / 2 - center) / state.itemW;
      it.link.style.transform = `translateX(${d * o * 60}%) scale(${scale * introScale})`;
      it.link.style.opacity = ease;
      const visible = x < state.vw && x + state.itemW > 0;
      const near = x < state.vw * 2 && x + state.itemW > -state.vw;
      if (visible) attach(it);
      else if (!near) detach(it);
      else if (!it.video.paused) it.video.pause();
    }
  }
  layout();

  /* ---------- render loop ---------- */
  let lastT = performance.now();
  function raf(now) {
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    // per-frame lerp 0.12 (0.1 mobile) at 60fps, framerate-independent
    const lerpFactor = isMobile() ? 0.1 : 0.12;
    const k = -Math.log(1 - lerpFactor) * 60;
    state.current = damp(state.current, state.target, k, dt);
    state.lspeed = damp(state.lspeed, state.speed, 5, dt);
    state.speed *= Math.pow(0.9, dt * 60);
    // snap to nearest card once input has settled (risk: snapStrength .1/.07)
    if (!state.dragging && !state.locked && now - state.lastInput > 140) {
      const snapStrength = isMobile() ? 0.07 : 0.1;
      const nearest = Math.round(state.target / state.itemW) * state.itemW;
      state.target += (nearest - state.target) * snapStrength;
    }
    layout();
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  /* ---------- intro ---------- */
  function intro() {
    state.locked = false;
    if (typeof gsap === "undefined") { introState.p = 1; return; }
    gsap.to(introState, { p: 1, duration: 1.6, ease: "none" }); // easing lives in layout()
  }

  /* ---------- detail panel ---------- */
  const detail = document.querySelector(".r-detail");
  const dVideo = detail.querySelector(".r-detail-video");
  const dClient = detail.querySelector(".r-detail-titles h1");
  const dPiece = detail.querySelector(".r-detail-titles h2");
  const dPlay = detail.querySelector("#r-play");
  const dMute = detail.querySelector("#r-mute");
  const dFill = detail.querySelector(".r-timeline-fill");
  const dTimeline = detail.querySelector(".r-timeline");
  const dMin = detail.querySelector("#r-min");
  const dSec = detail.querySelector("#r-sec");
  const dMil = detail.querySelector("#r-mil");
  const dCredits = detail.querySelector(".r-credits");
  const dCreditBtn = detail.querySelector(".r-credit-btn");
  let timerRaf = null;

  function openDetail(id) {
    const it = items.find(i => i.data.id === id);
    if (!it) return;
    dClient.textContent = it.client;
    dPiece.textContent = it.piece;
    dVideo.src = `assets/video/work/${id}.mp4`;
    dVideo.muted = false;
    dVideo.volume = 1;
    dVideo.currentTime = 0;
    detail.classList.add("is-open");
    detailOpen = true;
    state.locked = true;
    items.forEach(i => i.video.pause());
    dVideo.play().then(() => { dPlay.textContent = "pause"; }).catch(() => {
      dVideo.muted = true;
      dVideo.play().catch(() => {});
      dPlay.textContent = "pause";
      dMute.textContent = "unmute";
    });
    dMute.textContent = dVideo.muted ? "unmute" : "mute";
    tick();
  }

  function closeDetail() {
    detail.classList.remove("is-open");
    detailOpen = false;
    state.locked = false;
    dVideo.pause();
    dVideo.removeAttribute("src");
    dVideo.load();
    dCredits.classList.remove("is-open");
    cancelAnimationFrame(timerRaf);
  }

  function tick() {
    if (!detailOpen) return;
    const t = dVideo.currentTime || 0;
    dMin.textContent = String(Math.floor(t / 60)).padStart(2, "0");
    dSec.textContent = String(Math.floor(t % 60)).padStart(2, "0");
    dMil.textContent = String(Math.floor((t % 1) * 100)).padStart(2, "0");
    if (dVideo.duration) dFill.style.width = (t / dVideo.duration) * 100 + "%";
    timerRaf = requestAnimationFrame(tick);
  }

  dPlay.addEventListener("click", () => {
    if (dVideo.paused) { dVideo.play().catch(() => {}); dPlay.textContent = "pause"; }
    else { dVideo.pause(); dPlay.textContent = "play"; }
  });
  dMute.addEventListener("click", () => {
    dVideo.muted = !dVideo.muted;
    dMute.textContent = dVideo.muted ? "unmute" : "mute";
  });
  dTimeline.addEventListener("click", (e) => {
    if (!dVideo.duration) return;
    const r = dTimeline.getBoundingClientRect();
    dVideo.currentTime = ((e.clientX - r.left) / r.width) * dVideo.duration;
  });
  dCreditBtn.addEventListener("click", () => dCredits.classList.toggle("is-open"));
  detail.querySelector(".r-close").addEventListener("click", closeDetail);
  window.addEventListener("keydown", (e) => { if (e.key === "Escape" && detailOpen) closeDetail(); });

  /* ---------- boot ---------- */
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
  window.__VBF_WORK = { state, layout, openDetail, closeDetail, items };
})();
