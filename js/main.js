/* ============================================================
   VISUALS BY FIETS — shared interactions
   ============================================================ */
gsap.registerPlugin(ScrollTrigger);

/* ---------- intro veil: entering the space, no fake loading ---------- */
(function introVeil() {
  const veil = document.querySelector(".intro-veil");
  if (!veil) { document.body.classList.add("is-ready"); return; }
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const seen = sessionStorage.getItem("vbf-entered");
  const finish = () => {
    veil.remove();
    document.body.classList.add("is-ready");
    sessionStorage.setItem("vbf-entered", "1");
  };
  if (reduced || seen) {
    gsap.to(veil, { opacity: 0, duration: 0.35, onComplete: finish });
    heroIntro();
    return;
  }
  const mark = veil.querySelector(".intro-veil__mark");
  const word = veil.querySelector(".intro-veil__word");
  const tl = gsap.timeline();
  tl.to(mark, { opacity: 1, scale: 1, duration: 0.7, ease: "power3.out" }, 0.15)
    .fromTo(mark, { scale: 0.92 }, { scale: 1, duration: 0.9, ease: "power3.out" }, 0.15)
    .to(word, { opacity: 1, duration: 0.5, ease: "power2.out" }, 0.55)
    .add(() => { if (window.VBFluid) VBFluid.burst(6, 1.1); }, 0.95)
    .to(veil, {
      opacity: 0, duration: 0.8, ease: "power2.inOut",
      onComplete: finish
    }, 1.15)
    .add(heroIntro, 1.2);
})();

function heroIntro() {
  const lines = document.querySelectorAll(".hero__title .line > span");
  if (!lines.length) return;
  gsap.fromTo(lines,
    { yPercent: 110 },
    { yPercent: 0, duration: 1.1, ease: "power4.out", stagger: 0.09, delay: 0.15 });
  const meta = [".hero__kicker", ".hero__sub", ".hero__cta", ".hero__meta"]
    .filter(s => document.querySelector(s));
  if (meta.length) gsap.fromTo(meta.join(", "),
    { opacity: 0, y: 24 },
    { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.08, delay: 0.5 });
}
// Subpages have no intro veil: run the hero intro immediately
if (!document.querySelector(".intro-veil")) {
  window.addEventListener("DOMContentLoaded", heroIntro);
}

/* ---------- nav ---------- */
(function nav() {
  const el = document.querySelector(".nav");
  if (!el) return;
  const onScroll = () => el.classList.toggle("is-scrolled", window.scrollY > 30);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  const burger = el.querySelector(".nav__burger");
  if (burger) burger.addEventListener("click", () => el.classList.toggle("is-open"));
  el.querySelectorAll(".nav__links a").forEach(a => {
    a.addEventListener("click", () => el.classList.remove("is-open"));
  });
})();

/* ---------- text marquees ---------- */
document.querySelectorAll(".marquee__track").forEach(track => {
  track.innerHTML += track.innerHTML;
  gsap.to(track, { xPercent: -50, duration: 24, ease: "none", repeat: -1 });
});

/* ---------- scroll reveals ---------- */
document.querySelectorAll(".reveal").forEach(el => {
  gsap.fromTo(el,
    { opacity: 0, y: 40 },
    {
      opacity: 1, y: 0, duration: 1, ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 88%", once: true }
    });
});

/* ---------- stat counters ---------- */
document.querySelectorAll("[data-count]").forEach(el => {
  const target = parseFloat(el.getAttribute("data-count"));
  const suffix = el.getAttribute("data-suffix") || "";
  const obj = { v: 0 };
  ScrollTrigger.create({
    trigger: el, start: "top 90%", once: true,
    onEnter() {
      gsap.to(obj, {
        v: target, duration: 1.6, ease: "power2.out",
        onUpdate() { el.textContent = Math.round(obj.v) + suffix; }
      });
    }
  });
});

/* ---------- work card factory ---------- */
function workCardHTML(item) {
  return `
  <article class="work-card ${item.wide ? "is-wide" : ""} reveal" data-id="${item.id}" data-cat="${item.cat}">
    <video src="assets/video/work/${item.id}.mp4"
           poster="assets/img/posters/${item.id}.jpg"
           preload="metadata" muted loop playsinline autoplay></video>
    <span class="work-card__tag">${item.cat === "3d" ? "3D Logo" : "Edit"}</span>
    <div class="work-card__info">
      <div>
        <div class="work-card__title">${item.title}</div>
        <div class="work-card__sub">${item.sub}</div>
      </div>
      <button class="work-card__sound" aria-label="Play with sound" title="Play with sound">&#9658;</button>
    </div>
  </article>`;
}

function mountWorkGrid(selector, items) {
  const grid = document.querySelector(selector);
  if (!grid) return;
  grid.innerHTML = items.map(workCardHTML).join("");
  hookWorkCards(grid);
  // re-register reveals for injected cards
  grid.querySelectorAll(".reveal").forEach(el => {
    gsap.fromTo(el, { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.9, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 92%", once: true } });
  });
  ScrollTrigger.refresh();
}

/* Robust muted autoplay: plays whenever in view, retries on first user
   interaction and on tab-visibility changes (Chrome power-save / iframe
   autoplay policies can silently block the first play() attempt). */
const inViewVideos = new Set();
function tryPlay(v) {
  if (v.dataset.userSound !== "1") v.muted = true;
  v.play().catch(() => {});
}
function autoplayWhenVisible(video, threshold = 0.25) {
  new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) { inViewVideos.add(video); tryPlay(video); }
      else { inViewVideos.delete(video); video.pause(); }
    });
  }, { threshold }).observe(video);
}
function retryInView() { inViewVideos.forEach(tryPlay); }
["pointerdown", "touchstart", "keydown"].forEach(ev =>
  window.addEventListener(ev, retryInView, { passive: true }));
document.addEventListener("visibilitychange", () => { if (!document.hidden) retryInView(); });

function hookWorkCards(scope) {
  scope.querySelectorAll(".work-card").forEach(card => {
    const video = card.querySelector("video");
    autoplayWhenVisible(video);
    const open = (e) => { e.stopPropagation(); openLightbox(video.getAttribute("src")); };
    card.addEventListener("click", open);
    card.querySelector(".work-card__sound").addEventListener("click", open);
  });
}

/* ---------- lightbox ---------- */
let lightboxEl = null;
function openLightbox(src) {
  if (!lightboxEl) {
    lightboxEl = document.createElement("div");
    lightboxEl.className = "lightbox";
    lightboxEl.innerHTML = `
      <button class="lightbox__close" aria-label="Close">&times;</button>
      <video controls autoplay playsinline></video>`;
    document.body.appendChild(lightboxEl);
    const close = () => {
      lightboxEl.classList.remove("is-open");
      const v = lightboxEl.querySelector("video");
      v.pause(); v.removeAttribute("src"); v.load();
    };
    lightboxEl.addEventListener("click", (e) => {
      if (e.target === lightboxEl || e.target.closest(".lightbox__close")) close();
    });
    window.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  }
  const v = lightboxEl.querySelector("video");
  v.src = src; v.muted = false; v.volume = 1;
  lightboxEl.classList.add("is-open");
  v.play().catch(() => {});
}

/* ---------- brand video reel ---------- */
function mountBrandReel(selector) {
  const track = document.querySelector(selector);
  if (!track || typeof BRAND_REEL === "undefined") return;
  const item = (slug) => `
    <div class="reel__item">
      <video src="assets/video/brands/${slug}.mp4" preload="metadata" muted loop playsinline autoplay></video>
    </div>`;
  track.innerHTML = BRAND_REEL.map(item).join("") + BRAND_REEL.map(item).join("");
  gsap.to(track, { xPercent: -50, duration: 48, ease: "none", repeat: -1 });
  track.querySelectorAll("video").forEach(v => autoplayWhenVisible(v, 0.1));
}

/* ---------- showreel sound toggle ---------- */
(function showreel() {
  const wrap = document.querySelector(".showreel__phone");
  if (!wrap) return;
  const video = wrap.querySelector("video");
  const btn = wrap.querySelector(".showreel__sound");
  autoplayWhenVisible(video, 0.35);
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    video.muted = !video.muted;
    video.dataset.userSound = video.muted ? "0" : "1";
    btn.innerHTML = video.muted ? "&#128263;" : "&#128266;";
    video.play().catch(() => {});
  });
})();

/* ---------- FAQ accordion ---------- */
document.querySelectorAll(".faq__item").forEach(item => {
  const q = item.querySelector(".faq__q");
  const a = item.querySelector(".faq__a");
  q.addEventListener("click", () => {
    const open = item.classList.toggle("is-open");
    a.style.maxHeight = open ? a.scrollHeight + "px" : "0px";
  });
});

/* ---------- footer year ---------- */
document.querySelectorAll("[data-year]").forEach(el => {
  el.textContent = new Date().getFullYear();
});
