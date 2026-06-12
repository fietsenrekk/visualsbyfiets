/* ============================================================
   STORE CONFIG — paste your Stripe Payment Links below.
   Stripe Dashboard → Payment Links → New → copy the
   https://buy.stripe.com/... URL for each product.
   While a link is empty, the buy button falls back to an
   email/DM order flow so you never lose a sale.
   ============================================================ */
const STRIPE_LINKS = {
  "standard-edit":  "",   // €120
  "signature-edit": "",   // €175
  "logo-3d":        "",   // €249
  "brand-bundle":   "",   // €399
  "project-files":  "",   // €49
  "preset-pack":    ""    // €29
};

const ORDER_EMAIL = "bookings@visualsbyfiets.com";
const IG_URL = "https://www.instagram.com/visualsbyfiets";
const TIKTOK_URL = "https://www.tiktok.com/@visualsbyfiets";

const PRODUCT_NAMES = {
  "standard-edit":  "Standard Edit — €120",
  "signature-edit": "Signature Edit — €175",
  "logo-3d":        "3D Logo Animation — €249",
  "brand-bundle":   "Brand Bundle — €399",
  "project-files":  "Project Files (.prproj) — €49",
  "preset-pack":    "VBF Preset & Transition Pack — €29"
};

function buyProduct(id) {
  const link = STRIPE_LINKS[id];
  if (link && link.startsWith("https://buy.stripe.com")) {
    window.open(link, "_blank", "noopener");
    return;
  }
  // Fallback: order by email with a prefilled subject/body
  const name = PRODUCT_NAMES[id] || id;
  const subject = encodeURIComponent("Order: " + name);
  const body = encodeURIComponent(
    "Hey Fiets,\n\nI want to order: " + name +
    "\n\nProject details / song / brand:\n\nDeadline:\n\nMy IG/TikTok handle:\n"
  );
  window.location.href = `mailto:${ORDER_EMAIL}?subject=${subject}&body=${body}`;
}

document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-buy]");
  if (!btn) return;
  e.preventDefault();
  buyProduct(btn.getAttribute("data-buy"));
});
