# Samra Skin & Aesthetics — website

Next.js (App Router) + TypeScript + Tailwind MVP for the clinic marketing site.

## Scripts

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm start        # serve production build
```

## Pages

| Route | Purpose |
|---|---|
| `/` | Brand-first home + treatment highlights + light social proof |
| `/treatments` | Category index with placeholder blurbs |
| `/about` | Clinic / practitioner story + credential placeholders |
| `/contact` | Contact form, phone/email/map placeholders, booking CTA |

Sitewide **Book** CTA lives in the header (and on key pages).

## Deploy notes

- Host on **Vercel**; set project root to `website` if the Git remote is the monorepo parent.
- Domain / Namecheap DNS comes after the first Vercel deploy — not configured in this repo yet.
