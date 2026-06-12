# VISUALS BY FIETS — visualsbyfiets.com

High-end multipage portfolio + shop for VFX/editing services.
Static site — no build step, no backend. Deploy anywhere (Netlify, Vercel, Cloudflare Pages, any host).

## Run locally

```powershell
powershell -File "..\serve-visualsbyfiets.ps1"   # → http://localhost:4196
```

## Pages

| Page | Purpose |
|---|---|
| `index.html` | Landing — Three.js chrome spinning logo hero, selected work, showreel, 3D brand reel, pricing teaser, process, CTA |
| `work.html` | Full portfolio grid with filters (Edits / 3D Logos), hover-preview, click-for-sound lightbox |
| `shop.html` | Services + digital products with Stripe checkout, FAQ |
| `about.html` | Story, stats, toolkit |
| `contact.html` | Socials + brief form (opens prefilled email) |

## ⚡ Connect Stripe (do this before launch)

1. Stripe Dashboard → **Payment Links** → *New* — create one link per product
   (Standard Edit €120, Signature Edit €175, 3D Logo €249, Brand Bundle €399, Project Files €49, Preset Pack €29).
   For digital products, attach the file delivery via Stripe's post-purchase email or a service like Lemon Squeezy alternative flows.
2. Paste each `https://buy.stripe.com/...` URL into **`js/store.js`** → `STRIPE_LINKS`.
3. Until a link is filled in, the buy button falls back to a prefilled order email, so nothing breaks.

Also in `js/store.js`: set `ORDER_EMAIL` to your real email (currently `bookings@visualsbyfiets.com`).

## ✏️ Things to personalize

- **Stats** on `index.html` / `about.html` (`data-count` values: edits delivered, views, clients) — set them to your real numbers.
- **Pricing/inclusions** in `shop.html` + the homepage teaser.
- **Portfolio**: edit `js/data.js` (`WORK` array). Add a new piece by dropping
  `assets/video/work/<id>.mp4` + `assets/img/posters/<id>.jpg` and one line in the array.
  Re-encode sources with `encode.ps1` (add a line to the `$work` list).
- **Brand reel**: `BRAND_REEL` in `js/data.js` ↔ files in `assets/video/brands/`.

## Assets pipeline

- `encode.ps1` — re-encodes source edits from the SAINTSTANCE folders into compact web previews (720p, 30s cap, H.264 + faststart) and extracts poster frames. Run again any time; it skips files that already exist.
- `assets/img/logo-white.png` — transparent version of the logo (black background removed via ffmpeg alpha-from-luminance). Used by the nav, footer, preloader and the Three.js chrome hero.

## Deploy to visualsbyfiets.com

1. Push this folder to GitHub → connect to Netlify/Vercel/Cloudflare Pages (zero config — it's static).
2. Point the `visualsbyfiets.com` DNS (A/CNAME) at the host.
3. Done — HTTPS is automatic on all three hosts.
