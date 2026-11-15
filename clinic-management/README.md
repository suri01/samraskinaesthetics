# Samra clinic management (v1)

Internal clinic operations app for **Samra Skin & Aesthetics** — staff appointments, customer records, iPad intake/consent, treatments, photos, invoices, and staff MFA.

Sibling of the public site in [`../website`](../website). Same Next.js / TypeScript / Tailwind stack and brand tokens (sage, gold, white).

> Sample / fictional data only. Not a claim of UK GDPR or clinical compliance — see the project plan for adviser review items.

## Quick start

```bash
cp .env.example .env
npm install
npm run db:push
npm run db:seed
npm run dev
```

- Staff: http://localhost:3001/staff  
- iPad: http://localhost:3001/ipad  

## Docs

Architecture, hosting, and security: project store `docs/clinic-management-plan.md`  
Setup notes: project store `docs/clinic-management-setup.md`

## Real vs mocked

| Area | v1 |
| --- | --- |
| Postgres, auth/MFA, sessions, CRUD | Real |
| Photos | Local disk (S3 adapter ready) |
| Stripe | Mocked unless `STRIPE_SECRET_KEY` set |
| WhatsApp | Mocked unless provider env set |
