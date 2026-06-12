-- Catalog schema: categories, products, variants, images, facet attributes,
-- tags, related products, reviews. Bilingual text lives in jsonb columns
-- shaped as {"nl": "...", "en": "..."}. Money is integer cents excl. BTW.

create extension if not exists pg_trgm with schema extensions;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Categories (two levels via parent_id)
-- ---------------------------------------------------------------------------

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories(id) on delete cascade,
  slug jsonb not null,
  name jsonb not null,
  description jsonb,
  sort_order integer not null default 0,
  image_path text,
  created_at timestamptz not null default now()
);

create unique index categories_slug_nl_key on public.categories ((slug->>'nl'));
create unique index categories_slug_en_key on public.categories ((slug->>'en'));
create index categories_parent_id_idx on public.categories (parent_id);

-- ---------------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------------

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id),
  slug jsonb not null,
  name jsonb not null,
  description jsonb,
  -- [{"label": {"nl","en"}, "value": {"nl","en"}}]
  specs jsonb not null default '[]'::jsonb,
  brand text not null default 'Vondel Cycles',
  vat_rate integer not null default 21 check (vat_rate in (9, 21)),
  base_price_cents integer not null check (base_price_cents >= 0),
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  -- Flattened names for trigram-based typo tolerance and suggestions
  search_text text generated always as (
    coalesce(name->>'nl', '') || ' ' || coalesce(name->>'en', '') || ' ' || coalesce(brand, '')
  ) stored,
  search_vector tsvector generated always as (
    setweight(to_tsvector('dutch', coalesce(name->>'nl', '')), 'A') ||
    setweight(to_tsvector('english', coalesce(name->>'en', '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(brand, '')), 'B') ||
    setweight(to_tsvector('dutch', coalesce(description->>'nl', '')), 'C') ||
    setweight(to_tsvector('english', coalesce(description->>'en', '')), 'C')
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

create unique index products_slug_nl_key on public.products ((slug->>'nl'));
create unique index products_slug_en_key on public.products ((slug->>'en'));
create index products_category_status_idx on public.products (category_id, status);
create index products_price_idx on public.products (base_price_cents);
create index products_created_at_idx on public.products (created_at desc, id desc);
create index products_search_vector_idx on public.products using gin (search_vector);
create index products_search_text_trgm_idx on public.products
  using gin (search_text extensions.gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- Variants (SKU level: size/color options, stock, optional price override)
-- ---------------------------------------------------------------------------

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text not null unique,
  -- {"frame_size": {"value": "m", "label": {"nl": "M (52cm)", "en": "M (52cm)"}}, ...}
  options jsonb not null default '{}'::jsonb,
  price_cents integer check (price_cents >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  low_stock_threshold integer not null default 5,
  weight_grams integer,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index product_variants_product_id_idx on public.product_variants (product_id);

-- ---------------------------------------------------------------------------
-- Images
-- ---------------------------------------------------------------------------

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  storage_path text not null,
  alt jsonb,
  sort_order integer not null default 0
);

create index product_images_product_id_idx on public.product_images (product_id, sort_order);

-- ---------------------------------------------------------------------------
-- Facet attributes (normalized for indexable filtering)
-- ---------------------------------------------------------------------------

create table public.attributes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name jsonb not null,
  sort_order integer not null default 0
);

create table public.attribute_values (
  id uuid primary key default gen_random_uuid(),
  attribute_id uuid not null references public.attributes(id) on delete cascade,
  slug text not null,
  label jsonb not null,
  sort_order integer not null default 0,
  unique (attribute_id, slug)
);

create table public.product_attribute_values (
  product_id uuid not null references public.products(id) on delete cascade,
  attribute_value_id uuid not null references public.attribute_values(id) on delete cascade,
  primary key (product_id, attribute_value_id)
);

create index pav_value_product_idx on public.product_attribute_values (attribute_value_id, product_id);

-- ---------------------------------------------------------------------------
-- Tags
-- ---------------------------------------------------------------------------

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name jsonb not null
);

create table public.product_tags (
  product_id uuid not null references public.products(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (product_id, tag_id)
);

-- ---------------------------------------------------------------------------
-- Related products (cross-sell / upsell)
-- ---------------------------------------------------------------------------

create table public.related_products (
  product_id uuid not null references public.products(id) on delete cascade,
  related_id uuid not null references public.products(id) on delete cascade,
  relation_type text not null default 'related'
    check (relation_type in ('related', 'cross_sell', 'upsell')),
  primary key (product_id, related_id),
  check (product_id <> related_id)
);

-- ---------------------------------------------------------------------------
-- Reviews (seeded demo reviews are flagged is_demo and badged in the UI)
-- ---------------------------------------------------------------------------

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  author_name text not null,
  rating integer not null check (rating between 1 and 5),
  title text,
  body text,
  is_demo boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index reviews_product_status_idx on public.reviews (product_id, status);

-- ---------------------------------------------------------------------------
-- RLS: public storefront read access; no client writes (admin operations go
-- through the service role until role-based policies land with the back-office)
-- ---------------------------------------------------------------------------

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.attributes enable row level security;
alter table public.attribute_values enable row level security;
alter table public.product_attribute_values enable row level security;
alter table public.tags enable row level security;
alter table public.product_tags enable row level security;
alter table public.related_products enable row level security;
alter table public.reviews enable row level security;

create policy "Public categories are readable"
  on public.categories for select
  to anon, authenticated
  using (true);

create policy "Active products are readable"
  on public.products for select
  to anon, authenticated
  using (status = 'active');

create policy "Variants of active products are readable"
  on public.product_variants for select
  to anon, authenticated
  using (exists (
    select 1 from public.products p
    where p.id = product_id and p.status = 'active'
  ));

create policy "Images of active products are readable"
  on public.product_images for select
  to anon, authenticated
  using (exists (
    select 1 from public.products p
    where p.id = product_id and p.status = 'active'
  ));

create policy "Attributes are readable"
  on public.attributes for select
  to anon, authenticated
  using (true);

create policy "Attribute values are readable"
  on public.attribute_values for select
  to anon, authenticated
  using (true);

create policy "Product attribute links of active products are readable"
  on public.product_attribute_values for select
  to anon, authenticated
  using (exists (
    select 1 from public.products p
    where p.id = product_id and p.status = 'active'
  ));

create policy "Tags are readable"
  on public.tags for select
  to anon, authenticated
  using (true);

create policy "Product tags of active products are readable"
  on public.product_tags for select
  to anon, authenticated
  using (exists (
    select 1 from public.products p
    where p.id = product_id and p.status = 'active'
  ));

create policy "Related products of active products are readable"
  on public.related_products for select
  to anon, authenticated
  using (exists (
    select 1 from public.products p
    where p.id = product_id and p.status = 'active'
  ));

create policy "Approved reviews are readable"
  on public.reviews for select
  to anon, authenticated
  using (status = 'approved');

-- ---------------------------------------------------------------------------
-- Storage bucket for product images (public read)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;
