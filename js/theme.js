/* ============================================================
   VBF THEME ENGINE
   Two identities, one system:
     gold   — the existing brand: black canvas, beige #e6d5bb
     violet — deep black, luxurious purple, lavender accent
   data-theme lives on <html> (set pre-paint by the inline boot
   script in each page's <head>). Switching:
     • adds html.theming so every color property cross-fades
     • hands the fluid sim its new dye palette + a soft burst
     • persists to localStorage
   ============================================================ */

(function () {
  const KEY = "vbf-theme";
  const root = document.documentElement;

  const FLUID_PALETTES = {
    gold: [
      [0.85, 0.42, 0.10],  // molten amber
      [0.94, 0.87, 0.72],  // cream
      [0.45, 0.22, 0.06],  // bronze
      [0.20, 0.38, 0.60]   // steel counterpoint
    ],
    violet: [
      [0.42, 0.20, 0.85],  // luxurious purple
      [0.72, 0.62, 1.00],  // lavender
      [0.16, 0.10, 0.45],  // deep indigo
      [0.28, 0.62, 0.72]   // muted cyan accent
    ]
  };

  function current() {
    return root.dataset.theme === "violet" ? "violet" : "gold";
  }

  function applyFluid(theme) {
    if (window.VBFluid) {
      VBFluid.setPalette(FLUID_PALETTES[theme]);
      if (!VBFluid.reduced) {
        VBFluid.calm();
        setTimeout(() => VBFluid.burst(5, 0.9), 250);
      }
    }
  }

  function setTheme(theme, animate) {
    if (animate) {
      root.classList.add("theming");
      clearTimeout(setTheme._t);
      setTheme._t = setTimeout(() => root.classList.remove("theming"), 1100);
    }
    root.dataset.theme = theme;
    localStorage.setItem(KEY, theme);
    applyFluid(theme);
    document.querySelectorAll(".theme-toggle").forEach(btn => {
      btn.setAttribute("aria-pressed", theme === "violet" ? "true" : "false");
      btn.title = theme === "violet" ? "Switch to gold theme" : "Switch to violet theme";
    });
  }

  function makeToggle() {
    const btn = document.createElement("button");
    btn.className = "theme-toggle";
    btn.setAttribute("aria-label", "Toggle color theme");
    btn.innerHTML = '<span class="theme-toggle__dot" aria-hidden="true"></span>';
    btn.addEventListener("click", () => {
      setTheme(current() === "gold" ? "violet" : "gold", true);
    });
    return btn;
  }

  function mount() {
    // risk pages: append to the centered nav; classic pages: into the nav bar
    const riskNav = document.querySelector(".r-nav");
    const classicNav = document.querySelector(".nav");
    if (riskNav) riskNav.appendChild(makeToggle());
    if (classicNav) {
      const anchor = classicNav.querySelector(".nav__burger") || null;
      classicNav.insertBefore(makeToggle(), anchor);
    }
    // sync fluid with whatever the boot script chose
    applyFluid(current());
    document.querySelectorAll(".theme-toggle").forEach(btn =>
      btn.setAttribute("aria-pressed", current() === "violet" ? "true" : "false"));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }

  window.VBTheme = { set: (t) => setTheme(t, true), current };
})();
