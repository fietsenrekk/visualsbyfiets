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

## ⚡ Stripe

**Connected** — all six Payment Links are live in `js/store.js` → `STRIPE_LINKS`
(Standard Edit €150, Signature Edit €250, 3D Logo €499, Brand Bundle €649, Project Files €49, Preset Pack €29).
To change a price: create a new Payment Link in the Stripe dashboard and replace the URL there.
For the digital products, attach file delivery via the Payment Link's post-purchase confirmation email.
If a link is ever emptied, its buy button falls back to a prefilled order email, so nothing breaks.

Contact email across the site: `charlesmuwangam@gmail.com`.

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
