# Samra Skin & Aesthetics

Monorepo for Samra Skin & Aesthetics.

- **Website (Next.js):** [`website/`](./website)
- **Clinic management (Next.js):** [`clinic-management/`](./clinic-management)
- **Planned domain:** `samraskinaesthetics.com`
- **Stack:** Next.js App Router · TypeScript · Tailwind · Vercel-ready

## Website — run locally

```bash
cd website
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Clinic management — run locally

Requires local PostgreSQL (`samra_clinic` database).

```bash
cd clinic-management
cp .env.example .env
npm install
npm run db:push
npm run db:seed
npm run dev
```

- Staff: [http://localhost:3001/staff](http://localhost:3001/staff)
- iPad: [http://localhost:3001/ipad](http://localhost:3001/ipad)

Sample staff password is printed by the seed script (fictional data only).

## Repo layout

```
samraskinaesthetics/
  README.md
  website/               ← public marketing site
  clinic-management/     ← internal clinic ops (auth, appointments, iPad forms, invoices)
```

## Notes

- Clinic management uses sample data only — not for real patients until privacy/clinical advisers review.
- Stripe and WhatsApp are mocked unless credentials are set (see `clinic-management/.env.example`).
