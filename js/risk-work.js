/* ============================================================
   WORK — infinite horizontal carousel (risk.film mechanic)
   Vertical wheel / drag / touch all feed a lerped target;
   items wrap infinitely, skew with velocity, intro-scale in.
   Click a work → full-screen detail panel in the same black/
   beige color panel with a custom play/seek/timer/mute player.
   ============================================================ */

(function () {
  const listEl = document.querySelector(".r-worklist");
  if (!listEl || typeof WORK === "undefined") return;

  const isMobile = () => matchMedia("(max-width: 767px)").matches;

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
          <img class="r-workvideo" src="assets/img/posters/${w.id}.jpg" alt="${piece}" loading="lazy">
          <video class="r-workvideo" data-src="assets/video/work/${w.id}.mp4"
                 muted loop playsinline preload="none"></video>
        </div>
        <div class="r-workinfo">
          <h2 class="r-client">${client}</h2>
          <h2 class="r-client">${piece}</h2>
        </div>
      </div>`;
    listEl.appendChild(item);
    return { el: item, video: item.querySelector("video"), data: w, client, piece };
  });

  /* ---------- carousel state ---------- */
  const state = {
    current: 0, target: 0, vel: 0,
    itemW: 0, total: 0, vw: 0,
    dragging: false, dragStartX: 0, dragStartTarget: 0, moved: 0,
    locked: true // until loader finishes
  };
  let detailOpen = false;

  function measure() {
    state.vw = window.innerWidth;
    state.itemW = items[0].el.getBoundingClientRect().width;
    state.total = state.itemW * items.length;
  }
  measure();
  window.addEventListener("resize", measure);

  /* ---------- input ---------- */
  window.addEventListener("wheel", (e) => {
    if (state.locked) return;
    state.target -= (e.deltaY + e.deltaX);
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
    state.target = state.dragStartTarget + dx * 1.6;
  });
  window.addEventListener("pointerup", () => {
    if (!state.dragging) return;
    state.dragging = false;
    listEl.classList.remove("is-dragging");
    if (isMobile()) {
      // snap to nearest card (risk mobile behaviour)
      state.target = Math.round(state.target / state.itemW) * state.itemW;
    }
  });

  /* suppress click after a real drag */
  listEl.addEventListener("click", (e) => {
    if (state.moved > 6) { e.stopPropagation(); e.preventDefault(); return; }
    const link = e.target.closest(".r-worklink");
    if (link) openDetail(link.getAttribute("data-id"));
  }, true);

  /* ---------- video pool: only near-viewport cards hold a live video ---------- */
  function attach(it) {
    if (!it.video.getAttribute("src")) {
      it.video.src = it.video.getAttribute("data-src");
    }
    if (it.video.paused && !detailOpen && !state.locked) it.video.play().catch(() => {});
  }
  function detach(it) {
    if (it.video.getAttribute("src")) {
      it.video.pause();
      it.video.removeAttribute("src");
      it.video.load(); // free the decoder + buffer, poster img shows through
    }
  }

  /* ---------- layout + render loop ---------- */
  function layout(skew) {
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const x = R.wrap(i * state.itemW + state.current + state.itemW, state.total) - state.itemW;
      it.el.style.transform = `translateX(${x}px) skewX(${skew}deg)`;
      const visible = x < state.vw && x + state.itemW > 0;
      const near = x < state.vw * 2 && x + state.itemW > -state.vw;
      if (visible) attach(it);
      else if (!near) detach(it);
      else if (!it.video.paused) it.video.pause();
    }
  }
  layout(0); // position immediately — never let all items stack at x=0

  let prev = 0;
  function raf() {
    state.current = R.lerp(state.current, state.target, 0.075);
    state.vel = state.current - prev;
    prev = state.current;
    layout(Math.max(-6, Math.min(6, state.vel * 0.06)));
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  /* ---------- intro ---------- */
  function intro() {
    state.locked = false;
    gsap.fromTo(".r-worklink",
      { scale: 0.4, opacity: 0 },
      { scale: 1, opacity: 1, duration: 1.1, ease: "power3.out", stagger: 0.05 });
    gsap.fromTo(state, { target: state.itemW * 1.5 }, {
      target: 0, duration: 1.4, ease: "power3.out",
      onUpdate: () => {} // target tweened directly
    });
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
      // sound autoplay blocked without gesture chain — start muted
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
  setTimeout(startLoader, 2500); // safety if load never fires

  /* debug/testing handle */
  window.__VBF_WORK = { state, layout, openDetail, closeDetail, items };
})();
