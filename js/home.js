/* ============================================================
   HOME: the scatter reel + the quote scrub.

   Desktop (>= 900px, motion allowed): the section pins and the
   vertical scroll drives a horizontal track. Tiles sit at
   staggered heights in tight columns, almost touching, each
   with a small parallax depth so the strip breathes as it moves.
   Mobile / reduced motion: the same tiles as a 2 or 3 column
   staggered masonry, no pinning.

   Tiles carry a poster (webp) and a 6s silent preview that only
   loads and plays while the tile is on screen. Click opens the
   full clip with sound in the shared player (main.js).
   ============================================================ */

(function () {
  const section = document.querySelector(".scatter");
  const track = document.getElementById("scatter-track");
  if (!section || !track || typeof WORK === "undefined") return;

  const items = WORK.filter(w => w.home);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wideQuery = matchMedia("(min-width: 900px)");
  const counter = section.querySelector(".scatter__count b");
  const bar = section.querySelector(".scatter__bar i");

  /* ---------- tiles ---------- */
  track.innerHTML = items.map((w, i) => `
    <button class="tile" type="button" data-id="${w.id}"
            style="--ar:${(w.w / w.h).toFixed(4)}"
            aria-label="Play ${w.artist ? w.artist + ", " : ""}${w.title}${w.views ? ", " + fmtViews(w.views) + " views on TikTok" : ""}">
      <img class="tile__poster" src="assets/img/posters/${w.id}.webp" alt=""
           width="${w.w}" height="${w.h}" decoding="async">
      <video class="tile__video" muted loop playsinline preload="none"
             data-src="assets/video/preview/${w.id}.mp4" aria-hidden="true"></video>
      <span class="tile__cap">
        ${w.artist ? `<span class="tile__artist">${w.artist}</span>` : ""}
        <span class="tile__title">${w.title}</span>
        ${w.views ? `<span class="tile__views">${fmtViews(w.views)} views</span>` : ""}
      </span>
    </button>`).join("");

  const tiles = [...track.querySelectorAll(".tile")];
  tiles.forEach(t => t.addEventListener("click", () => openPlayer(t.dataset.id, t)));
  if (counter) counter.textContent = "01";
  section.querySelector(".scatter__count span").textContent = String(tiles.length).padStart(2, "0");

  /* ---------- previews: load + play only while visible ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      const v = en.target.querySelector("video");
      if (en.isIntersecting) {
        if (!v.src) v.src = v.dataset.src;
        if (!reduced) {
          v.muted = true;
          v.play().catch(() => {});
        }
      } else if (!v.paused) {
        v.pause();
      }
    });
  }, { rootMargin: "0px 15% 0px 15%", threshold: 0.15 });
  tiles.forEach(t => {
    t.querySelector("video").addEventListener("playing", () => t.classList.add("is-playing"), { once: true });
    io.observe(t);
  });

  /* ---------- deterministic scatter layout (desktop) ---------- */
  function rng(seed) {
    return () => {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function layout() {
    const A = track.clientHeight;                // band height in px
    const gap = Math.round(Math.max(6, A * 0.014));
    const rand = rng(1903);
    let x = 0;
    let i = 0;
    while (i < tiles.length) {
      const ar = items[i].w / items[i].h;
      const nextAr = i + 1 < items.length ? items[i + 1].w / items[i + 1].h : 0;
      const col = [];
      if (ar > 1.25 && nextAr > 1.25 && rand() > 0.35) {
        // two landscapes stacked in one column
        const h = A * (0.30 + rand() * 0.07);
        col.push({ i, w: h * ar, h }, { i: i + 1, w: h * nextAr, h });
        i += 2;
      } else if (ar > 1.25) {
        const h = A * (0.34 + rand() * 0.12);
        col.push({ i, w: h * ar, h });
        i += 1;
      } else if (ar < 0.8) {
        const h = A * (0.62 + rand() * 0.2);
        col.push({ i, w: h * ar, h });
        i += 1;
      } else {
        const h = A * (0.44 + rand() * 0.14);
        col.push({ i, w: h * ar, h });
        i += 1;
      }
      const colW = Math.max(...col.map(c => c.w));
      const colH = col.reduce((s, c) => s + c.h, 0) + gap * (col.length - 1);
      let y = (A - colH) * rand();
      col.forEach(c => {
        const el = tiles[c.i];
        el.style.width = c.w + "px";
        el.style.height = c.h + "px";
        el.style.left = (x + (colW - c.w) / 2) + "px";
        el.style.top = y + "px";
        el.dataset.depth = ((rand() - 0.5) * 2).toFixed(2);
        y += c.h + gap;
      });
      x += colW + gap;
    }
    track.style.width = (x - gap) + "px";
  }

  function clearLayout() {
    tiles.forEach(t => {
      ["width", "height", "left", "top", "transform"].forEach(p => t.style[p] = "");
    });
    track.style.width = "";
    track.style.transform = "";
  }

  /* ---------- pinned horizontal drive ---------- */
  let st = null;
  function enable() {
    section.classList.add("is-pinned");
    layout();
    const distance = () => Math.max(0, track.scrollWidth - (window.innerWidth - track.offsetLeft) + window.innerWidth * 0.06);
    st = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: () => "+=" + distance(),
      pin: section.querySelector(".scatter__pin"),
      scrub: 0.4,
      invalidateOnRefresh: true,
      onRefresh: layout,
      onUpdate(self) {
        const p = self.progress;
        const dx = -distance() * p;
        track.style.transform = `translate3d(${dx}px,0,0)`;
        const drift = (p - 0.5) * 2;               // -1..1 across the pin
        for (const t of tiles) {
          t.style.transform = `translate3d(0,${(+t.dataset.depth * drift * 34).toFixed(1)}px,0)`;
        }
        if (bar) bar.style.transform = `scaleX(${p.toFixed(3)})`;
        if (counter) {
          const n = Math.min(tiles.length, 1 + Math.floor(p * tiles.length));
          counter.textContent = String(n).padStart(2, "0");
        }
      }
    });
  }
  function disable() {
    if (st) { st.kill(true); st = null; }
    section.classList.remove("is-pinned");
    clearLayout();
  }

  function apply() {
    if (wideQuery.matches && !reduced) { if (!st) enable(); }
    else disable();
    ScrollTrigger.refresh();
  }
  wideQuery.addEventListener("change", apply);
  apply();

  /* ---------- the quote: words light up as you read ---------- */
  document.querySelectorAll("[data-scrub-words]").forEach(el => {
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map(w => `<span class="w">${w}</span>`).join(" ");
    if (reduced) return;
    gsap.fromTo(el.querySelectorAll(".w"), { opacity: 0.45 }, {
      opacity: 1, ease: "none", stagger: 0.08,
      scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: true }
    });
  });

  /* ---------- hero recedes as the reel arrives ---------- */
  const hero = document.querySelector(".hero__content");
  if (hero && !reduced) {
    gsap.to(hero, {
      yPercent: -18, opacity: 0.15, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
    });
  }
})();
