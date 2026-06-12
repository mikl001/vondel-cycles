# Vondel Cycles — demo webshop (portfolio project)

A fictional Dutch bicycle webshop built as a portfolio piece. **Everything is
fake**: the brand, the products, the reviews and the trust badge. No real
orders or payments are possible.

> _"Sinds 1998 bouwt Vondel Cycles fietsen aan de rand van het Vondelpark."_

## Stack

- **Next.js 16** (App Router, Turbopack, SSG/ISR) + TypeScript + Tailwind CSS 4
- **Supabase** — Postgres, Auth, Storage; RLS as the IDOR defense
- **next-intl** — bilingual storefront (`/nl`, `/en`) with localized pathnames
- **Postgres FTS + pg_trgm** — typo-tolerant search with autosuggestions
- **Mollie** (test mode), planned — iDEAL checkout flow
- Mock adapters for postcode lookup / shipping, swappable for real APIs

## Status

| Phase | Scope | State |
|---|---|---|
| 0 | Scaffold, i18n (/nl + /en), CI, Supabase clients | ✅ |
| 1 | Catalog schema, RLS, deterministic seed (65 products, 116 images) | ✅ |
| 2 | Faceted filters, sorting, pagination, typo-tolerant FTS search | ✅ |
| 3 | SEO: JSON-LD (Product/Breadcrumb/Org), sitemap, hreflang, canonicals | ✅ |
| 4 | Guest cart (HttpOnly token, server-side pricing, CSRF origin check) | ✅ |
| 5 | Checkout: postcode autofill, pickup points, promo codes, B2B reverse charge, payment adapter (Mollie test / local mock), idempotent webhook | ✅ |
| 6 | Auth + account: cart merge on login, order history, PDF invoices, address book, wishlist, GDPR export/delete | ✅ |
| 7 | Admin: JWT role claim, dashboard/reports, CSV import/export, order transitions + refunds, audit log | ✅ |
| 8 | Hardening: rate limiting, CSP/security headers, abandoned-cart cron, consent banner, Playwright e2e | ✅ |
| — | Deploy: Vercel + hosted Supabase + Mollie test keys | pending credentials |

## Local development

Requires Node 24+, Docker Desktop (for local Supabase) and the Supabase CLI
(bundled as a dev dependency).

```bash
npm install
npx supabase start                         # boots local Postgres/Auth/Storage
# copy the printed anon/service keys:
cp .env.example .env.local                 # fill in the two keys

npx supabase db reset                      # apply migrations + seed.sql
npx tsx scripts/generate-seed.ts --upload  # upload product images to Storage
npx tsx --conditions=react-server scripts/make-admin.ts admin@vondelcycles.example
npm run dev
```

The back-office lives at `/admin` (login with the make-admin account).
The default `admin-demo-123` password applies to **local** instances only —
any deployed environment must use its own rotated password.
Magic-link and password-reset emails land in Mailpit: http://127.0.0.1:54324.

Useful scripts:

- `npm run lint` / `npm run typecheck` / `npm test` — what CI runs
- `npm run e2e` — Playwright suite (browse, typo search, full purchase incl.
  demo payment, registration + address book, admin smoke with audit check)
- `npm run db:types` — regenerate `src/types/database.types.ts` (needs `supabase login` once)
- `npx tsx scripts/generate-seed.ts` — regenerate `supabase/seed.sql` deterministically

## Architecture notes

- **Money** is stored as integer cents **excluding BTW**; consumer prices are
  computed (`price_incl_cents` SQL helper / `inclBtwCents` in TS). Books carry
  the reduced 9% rate, everything else 21%.
- **Bilingual content** lives in `jsonb` columns shaped `{"nl": …, "en": …}`
  with per-locale unique expression indexes on slugs.
- **Catalog queries** go through SQL functions (`filter_products`,
  `facet_counts`, `search_suggestions`) — facet counts exclude each
  attribute's own filter, the standard multi-select faceting semantics.
- **Search** combines `tsvector` ranking (Dutch + English configs) with
  `pg_trgm` similarity for typo tolerance. The `lib/search` seam allows
  swapping in Meilisearch later; on this catalog size FTS wins on simplicity.
- **RLS is the authorization layer**: account data is pinned to
  `auth.uid()`, orders are created only by the service-role checkout API,
  and the admin role rides in the JWT via a custom access token hook.
  Verified adversarially (cross-user reads return zero rows; forged
  user_id inserts are rejected).
- **Money math** lives in one tested module (`lib/cart/totals.ts`): per-line
  VAT rounding, promo discounts allocated across VAT-rate groups by largest
  remainder, shipping at 21%, intra-EU reverse charge.
- **Payments** are an adapter: a local demo-payment page stands in for
  Mollie's hosted checkout; setting `MOLLIE_API_KEY` switches to the real
  (test-mode) iDEAL flow — webhook handler and refunds included. The webhook
  never trusts its body and is idempotent via a unique order-event constraint.
- **Security hardening**: CSP + security headers, Origin-check CSRF guard on
  mutations, sliding-window rate limiting (Upstash in prod, in-memory in dev),
  HttpOnly cart/consent cookies, server-side price recalculation everywhere.
- Catalog reads degrade gracefully when the DB is unreachable so CI can build
  without a running Supabase instance.

## Deploying

1. Create a Supabase project, run `supabase link` + `supabase db push`,
   configure the custom access token hook (Dashboard → Auth → Hooks) and run
   the seed + image upload + make-admin scripts against the hosted project.
2. Vercel: set the env vars from `.env.example` (plus `MOLLIE_API_KEY` test
   key, `CRON_SECRET`, Upstash credentials) and add a cron entry for
   `/api/cron/abandoned-carts`.
3. Point `NEXT_PUBLIC_SITE_URL` at the deployment so Mollie webhooks and
   sitemap/canonical URLs resolve.
