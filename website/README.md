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
| `/treatments` | Real clinic menu (microneedling, peels, hydration, consultations) |
| `/about` | Clinic / practitioner story + credential placeholders |
| `/contact` | Enquiry form, Maidenhead address, Google Map, email CTA |

Sitewide **Book** CTA lives in the header (and on key pages).

## Contact form

The form posts to `POST /api/contact` and sends email via [Resend](https://resend.com).

1. Copy `.env.example` → `.env.local` (local) or set the same vars in Vercel.
2. Set `RESEND_API_KEY`.
3. Set `CONTACT_TO_EMAIL` (clinic inbox) and `CONTACT_FROM_EMAIL` (verified Resend sender / domain).

Without `RESEND_API_KEY`, the UI still works but submit returns a clear “not configured” error (and suggests emailing directly).

## Deploy notes

- Host on **Vercel**; set project root to `website` if the Git remote is the monorepo parent.
- Domain / Namecheap DNS comes after the first Vercel deploy — not configured in this repo yet.
- Add the Resend env vars on the Vercel project before relying on the contact form in production.
