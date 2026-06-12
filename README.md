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
| 0 | Scaffold, i18n, CI, Supabase clients | ✅ |
| 1 | Catalog schema, RLS, seed (65 products, 116 images), storefront pages | ✅ |
| 2 | Faceted filters, sorting, pagination, FTS search + suggestions | ✅ |
| 3–8 | SEO structured data, cart, Mollie checkout, account, admin, hardening | planned |

## Local development

Requires Node 24+, Docker Desktop (for local Supabase) and the Supabase CLI
(bundled as a dev dependency).

```bash
npm install
npx supabase start                         # boots local Postgres/Auth/Storage
# copy the printed anon/service keys:
cp .env.example .env.local                 # fill in the two keys

npx tsx scripts/generate-seed.ts --upload  # regenerate seed.sql + upload images
npx supabase db reset                      # apply migrations + seed.sql
npm run dev
```

Useful scripts:

- `npm run lint` / `npm run typecheck` / `npm test` — what CI runs
- `npm run db:types` — regenerate `src/types/database.types.ts` from the local DB
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
- **RLS** allows anon read of active products only; there are no client write
  policies — all writes go through service-role API routes (from Phase 4 on).
- Catalog reads degrade gracefully when the DB is unreachable so CI can build
  without a running Supabase instance.
