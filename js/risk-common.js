/* ============================================================
   Shared scaffolding for the RISK-style pages:
   coordinate loader (ticks + giant counter), dot columns,
   and a tiny lerp helper. Loaded before risk-work / risk-about.
   ============================================================ */

const R = {
  lerp: (a, b, t) => a + (b - a) * t,
  wrap: (v, max) => ((v % max) + max) % max
};

/* build the two decorative dot columns (34 dots each side, doubled) */
function rBuildDots(container) {
  if (!container) return;
  const col = () => {
    const pair = document.createElement("div");
    pair.className = "r-dots-pair";
    for (let c = 0; c < 2; c++) {
      const el = document.createElement("div");
      el.className = "r-dots-col";
      for (let i = 0; i < 34; i++) {
        const d = document.createElement("div");
        d.className = "r-dot";
        el.appendChild(d);
      }
      pair.appendChild(el);
    }
    return pair;
  };
  container.appendChild(col());
  container.appendChild(col());
}

/* loader: ticks grow staggered, counter runs 00→100, overlay lifts.
   onDone fires when the screen is clear. */
function rRunLoader(onDone) {
  const load = document.querySelector(".r-load");
  if (!load) { onDone && onDone(); return; }
  if (typeof gsap === "undefined") {
    // CDN failed — never trap the user behind the loader
    load.remove();
    document.querySelectorAll(".r-reveal").forEach(el => { el.style.opacity = 1; });
    onDone && onDone();
    return;
  }
  const ticks = load.querySelectorAll(".r-tick");
  const nbr = load.querySelector(".r-load-nbr");
  const state = { p: 0 };

  gsap.to(ticks, {
    width: "2.4rem",
    duration: 0.9,
    ease: "power3.inOut",
    stagger: { each: 0.02, from: "start" }
  });

  gsap.to(state, {
    p: 100,
    duration: 1.5,
    ease: "power2.inOut",
    onUpdate() {
      if (nbr) nbr.textContent = String(Math.round(state.p)).padStart(2, "0");
    },
    onComplete() {
      gsap.to(load, {
        yPercent: -100,
        duration: 0.85,
        ease: "power3.inOut",
        onComplete() { load.remove(); }
      });
      // reveal page chrome
      gsap.to(".r-reveal", {
        opacity: 1,
        duration: 0.8,
        ease: "power2.out",
        stagger: 0.06,
        delay: 0.3
      });
      onDone && onDone();
    }
  });
}

/* build tick columns for the loader (32 per side) */
function rBuildLoader() {
  const grad = document.querySelector(".r-load-grad");
  if (!grad) return;
  ["left", "right"].forEach(side => {
    const col = document.createElement("div");
    col.className = "r-grad-col " + side;
    for (let i = 0; i < 32; i++) {
      const t = document.createElement("div");
      t.className = "r-tick";
      col.appendChild(t);
    }
    grad.appendChild(col);
  });
}
