/* ============================================================
   VISUALS BY FIETS: shared interactions
   ============================================================ */
gsap.registerPlugin(ScrollTrigger);

/* ---------- smooth scroll (mouse + trackpad only; touch keeps native) ---------- */
if (window.Lenis && !document.body.classList.contains("risk-page") &&
    !matchMedia("(prefers-reduced-motion: reduce)").matches &&
    matchMedia("(pointer: fine)").matches) {
  window.vbfLenis = new Lenis({ lerp: 0.12, anchors: true });
  window.vbfLenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => window.vbfLenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ============================================================
   PROOF NUMBERS: single source of truth for the stats strip.
   Taken from the @visualsbyfiets TikTok profile on 2026-10-06:
   views summed over the 47 edit posts (the Will Smith meme post
   excluded), likes from the profile header. Update when they grow.
   The HTML carries the same values as static text, so nothing
   ever renders as 0; this only drives the count-up animation.
   ============================================================ */
const VBF_STATS = {
  editViews:   { value: 230, suffix: "K+" },
  tiktokLikes: { value: 58,  suffix: "K+" },
  topEdit:     { value: 58,  suffix: "K"  }
};

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
    .to(word, { opacity: 1, duration: 0.45, ease: "power2.out" }, 0.4)
    .add(() => { if (window.VBFluid) VBFluid.burst(6, 1.1); }, 0.75)
    .to(veil, {
      opacity: 0, duration: 0.6, ease: "power2.inOut",
      onComplete: finish
    }, 0.85)
    .add(heroIntro, 0.8);
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
  if (burger) burger.addEventListener("click", () => {
    burger.setAttribute("aria-expanded", String(el.classList.toggle("is-open")));
  });
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

/* ---------- stat counters (driven by VBF_STATS above) ---------- */
document.querySelectorAll("[data-stat]").forEach(el => {
  const stat = VBF_STATS[el.getAttribute("data-stat")];
  if (!stat) return;
  el.textContent = stat.value + stat.suffix; // final value immediately: never zeros
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const obj = { v: 0 };
  ScrollTrigger.create({
    trigger: el, start: "top 90%", once: true,
    onEnter() {
      gsap.to(obj, {
        v: stat.value, duration: 1.6, ease: "power2.out",
        onUpdate() { el.textContent = Math.round(obj.v) + stat.suffix; }
      });
    }
  });
});

/* ---------- muted autoplay that survives Chrome's power-save ---------- */
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

function fmtViews(n) {
  return n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "K" : String(n);
}

/* ---------- the player: full clip with sound, a real dialog ---------- */
const player = (() => {
  let el, video, cap, lastTrigger = null, token = 0;
  function build() {
    el = document.createElement("div");
    el.className = "player";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.hidden = true;
    el.innerHTML = `
      <button class="player__close" type="button" aria-label="Close player" data-cursor="close">&times;</button>
      <figure class="player__stage">
        <video class="player__video" controls playsinline preload="auto"></video>
        <figcaption class="player__cap"></figcaption>
      </figure>`;
    document.body.appendChild(el);
    video = el.querySelector("video");
    cap = el.querySelector(".player__cap");
    el.addEventListener("click", (e) => {
      if (e.target === el || e.target.closest(".player__close")) close();
    });
    el.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { e.preventDefault(); close(); }
      if (e.key === "Tab") {
        const f = [el.querySelector(".player__close"), video];
        const i = f.indexOf(document.activeElement);
        e.preventDefault();
        f[(i + (e.shiftKey ? f.length - 1 : 1)) % f.length].focus();
      }
    });
  }
  function open(id, trigger) {
    const w = WORK.find(x => x.id === id);
    if (!w) return;
    if (!el) build();
    const t = ++token;
    lastTrigger = trigger || document.activeElement;
    el.setAttribute("aria-label", (w.artist ? w.artist + ", " : "") + w.title);
    cap.innerHTML = `${w.artist ? `<b>${w.artist}</b>` : ""}<span>${w.title}</span>` +
      (w.views ? `<i>${fmtViews(w.views)} views on TikTok</i>` : "");
    video.poster = `assets/img/posters/${id}.webp`;
    video.src = `assets/video/full/${id}.mp4`;
    video.muted = false;
    el.hidden = false;
    requestAnimationFrame(() => el.classList.add("is-open"));
    document.documentElement.classList.add("has-player");
    if (window.vbfLenis) window.vbfLenis.stop();
    el.querySelector(".player__close").focus({ preventScroll: true });
    video.play().catch(() => { if (t === token) { video.muted = true; video.play().catch(() => {}); } });
  }
  function close() {
    if (!el || el.hidden) return;
    token++;
    el.classList.remove("is-open");
    video.pause();
    video.removeAttribute("src");
    video.load();
    el.hidden = true;
    document.documentElement.classList.remove("has-player");
    if (window.vbfLenis) window.vbfLenis.start();
    if (lastTrigger && lastTrigger.isConnected) lastTrigger.focus({ preventScroll: true });
  }
  return { open, close };
})();
function openPlayer(id, trigger) { player.open(id, trigger); }

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
