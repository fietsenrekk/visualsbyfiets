/* ============================================================
   VBF CURSOR — one refined cursor for every page.
   A small dot + a trailing ring. The ring grows and labels
   itself by context:
     links/buttons → grows          [data-cursor] wins if set
     work cards / videos → "play"
     carousel field → "drag"
     close controls → "close"
   Hidden on touch devices and for reduced-motion users the
   trailing is instant. Nav links get a subtle magnetic pull.
   ============================================================ */

(function () {
  if (matchMedia("(hover: none)").matches) return;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* remove any legacy cursor markup */
  document.querySelectorAll(".cursor").forEach(el => el.remove());

  const dot = document.createElement("div");
  dot.className = "vbf-cursor-dot";
  const ring = document.createElement("div");
  ring.className = "vbf-cursor-ring";
  ring.innerHTML = '<span class="vbf-cursor-label" aria-hidden="true"></span>';
  document.body.append(dot, ring);
  const label = ring.querySelector(".vbf-cursor-label");

  const pos = { x: -100, y: -100 };
  const ringPos = { x: -100, y: -100 };
  let visible = false;

  window.addEventListener("pointermove", (e) => {
    pos.x = e.clientX; pos.y = e.clientY;
    if (!visible) { visible = true; document.body.classList.add("vbf-cursor-on"); }
  }, { passive: true });
  document.addEventListener("pointerleave", () => {
    visible = false;
    document.body.classList.remove("vbf-cursor-on");
  });

  function frame() {
    const k = reduced ? 1 : 0.16;
    ringPos.x += (pos.x - ringPos.x) * k;
    ringPos.y += (pos.y - ringPos.y) * k;
    dot.style.transform = `translate(${pos.x}px, ${pos.y}px) translate(-50%,-50%)`;
    ring.style.transform = `translate(${ringPos.x}px, ${ringPos.y}px) translate(-50%,-50%)`;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* context resolution */
  function contextFor(el) {
    const tagged = el.closest("[data-cursor]");
    if (tagged) return tagged.getAttribute("data-cursor");
    if (el.closest(".r-close, .lightbox__close")) return "close";
    if (el.closest(".r-worklink, .work-card")) return "play";
    if (el.closest(".r-worklist")) return "drag";
    if (el.closest("a, button, [role='button'], input, select, textarea, .faq__q")) return "hover";
    return "";
  }
  document.addEventListener("pointerover", (e) => {
    const ctx = contextFor(e.target);
    ring.dataset.state = ctx;
    label.textContent = (ctx === "play" || ctx === "drag" || ctx === "close") ? ctx : "";
  });
  document.addEventListener("pointerdown", () => ring.classList.add("is-down"));
  document.addEventListener("pointerup", () => ring.classList.remove("is-down"));

  /* magnetic nav links — a quiet pull, never a jump */
  const magnets = document.querySelectorAll(".r-nav a, .nav__links a, .theme-toggle");
  magnets.forEach(el => {
    el.addEventListener("pointermove", (e) => {
      if (reduced) return;
      const r = el.getBoundingClientRect();
      const mx = e.clientX - (r.left + r.width / 2);
      const my = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${mx * 0.18}px, ${my * 0.18}px)`;
    });
    el.addEventListener("pointerleave", () => {
      el.style.transition = "transform .45s cubic-bezier(0.22, 1, 0.36, 1)";
      el.style.transform = "";
      setTimeout(() => { el.style.transition = ""; }, 460);
    });
  });
})();
