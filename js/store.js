/* ============================================================
   STORE CONFIG — Stripe Payment Links.
   Stripe Dashboard → Payment Links → copy the
   https://buy.stripe.com/... URL for each product.
   Buy buttons send the customer straight to Stripe checkout.
   ============================================================ */
const STRIPE_LINKS = {
  "standard-edit":  "https://buy.stripe.com/5kQbJ03Gvcon1mz4bu2VG02",   // €120
  "signature-edit": "https://buy.stripe.com/5kQ5kC1ynfAz6GT5fy2VG03",   // €175
  "logo-3d":        "https://buy.stripe.com/7sYaEWdh5ewvaX90Zi2VG04",   // €249
  "brand-bundle":   "https://buy.stripe.com/5kQ00ifpd9cb2qD7nG2VG05",   // €399
  "project-files":  "https://buy.stripe.com/cNi8wO5ODbkjc1dgYg2VG06",   // €49
  "preset-pack":    "https://buy.stripe.com/cNibJ0b8X2NN1mz8rK2VG07"    // €29
};

function buyProduct(id) {
  const link = STRIPE_LINKS[id];
  if (link && link.startsWith("https://buy.stripe.com")) {
    // same-tab redirect: immune to popup blockers, standard checkout UX
    window.location.href = link;
    // embedded contexts can block same-tab external navigation — fall back to a new tab
    setTimeout(() => { window.open(link, "_blank", "noopener"); }, 700);
  } else {
    // no link configured for this product — route to contact instead
    window.location.href = "contact.html";
  }
}

document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-buy]");
  if (!btn) return;
  e.preventDefault();
  buyProduct(btn.getAttribute("data-buy"));
});
