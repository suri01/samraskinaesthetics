# Samra Skin & Aesthetics

Monorepo for the Samra Skin & Aesthetics clinic website.

- **Website (Next.js):** [`website/`](./website)
- **Planned domain:** `samraskinaesthetics.com`
- **Stack:** Next.js App Router · TypeScript · Tailwind · Vercel-ready

## Run locally

```bash
cd website
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Production build check:

```bash
cd website
npm run build
npm start
```

## What’s next (not done in this scaffold)

1. **Vercel** — connect this GitHub repo and deploy the `website` directory (or set Root Directory to `website`).
2. **Namecheap DNS** — point `samraskinaesthetics.com` at Vercel when ready. Do not buy hosting elsewhere for this MVP.
3. **Real content** — replace placeholder treatments, credentials, address, phone, map, reviews, and logo/photos.
4. **Contact delivery** — wire the form to Resend or Formspree.
5. **Booking** — swap the phone CTA for Cal.com / Jane / clinic software when chosen.

## Repo layout

```
samraskinaesthetics/
  README.md
  website/          ← Next.js app
  (future folders can sit alongside website/)
```
