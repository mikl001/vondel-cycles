-- Orders, order items (price snapshots), order events (webhook idempotency),
-- shipping methods and promo codes. Orders are created exclusively by the
-- service-role checkout API; totals are computed server-side and frozen here.

-- ---------------------------------------------------------------------------
-- Shipping methods (the mock Sendcloud adapter reads from this table)
-- ---------------------------------------------------------------------------

create table public.shipping_methods (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name jsonb not null,
  description jsonb,
  price_cents integer not null check (price_cents >= 0),
  free_above_cents integer,
  supports_pickup boolean not null default false,
  sort_order integer not null default 0,
  active boolean not null default true
);

insert into public.shipping_methods
  (code, name, description, price_cents, free_above_cents, supports_pickup, sort_order)
values
  (
    'postnl-standard',
    '{"nl": "PostNL bezorging", "en": "PostNL delivery"}',
    '{"nl": "Morgen in huis, voor 22:00 besteld", "en": "Delivered tomorrow when ordered before 22:00"}',
    495, 5000, false, 1
  ),
  (
    'postnl-pickup',
    '{"nl": "PostNL-punt", "en": "PostNL pickup point"}',
    '{"nl": "Ophalen bij een PostNL-punt in de buurt", "en": "Collect at a nearby PostNL point"}',
    395, 5000, true, 2
  ),
  (
    'dhl-evening',
    '{"nl": "DHL avondbezorging", "en": "DHL evening delivery"}',
    '{"nl": "Bezorging tussen 18:00 en 22:00", "en": "Delivered between 18:00 and 22:00"}',
    695, null, false, 3
  );

-- ---------------------------------------------------------------------------
-- Promo codes (no client access at all — validated by the checkout API)
-- ---------------------------------------------------------------------------

create table public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null check (discount_type in ('percent', 'fixed')),
  -- percent: whole percents (10 = 10%); fixed: excl-BTW cents
  value integer not null check (value > 0),
  min_order_cents integer not null default 0,
  valid_from timestamptz,
  valid_until timestamptz,
  max_uses integer,
  use_count integer not null default 0,
  active boolean not null default true
);

insert into public.promo_codes (code, discount_type, value, min_order_cents) values
  ('VONDEL10', 'percent', 10, 0),
  ('WELKOM5', 'fixed', 500, 2500);

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------

create sequence public.order_number_seq;

create or replace function public.next_order_number()
returns text
language sql
volatile
as $$
  select 'VC-' || to_char(now(), 'YYYY') || '-' ||
         lpad(nextval('public.order_number_seq')::text, 5, '0');
$$;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default public.next_order_number(),
  user_id uuid references auth.users(id) on delete set null,
  cart_id uuid references public.carts(id) on delete set null,
  email text not null,
  -- guests open the confirmation page with this token
  confirmation_token uuid not null default gen_random_uuid(),
  status text not null default 'pending' check (status in (
    'pending', 'paid', 'processing', 'shipped', 'delivered',
    'cancelled', 'refunded', 'failed', 'expired'
  )),
  payment_id text,
  payment_provider text not null default 'mock',
  locale text not null default 'nl',
  customer_type text not null default 'b2c' check (customer_type in ('b2c', 'b2b')),
  company_name text,
  vat_number text,
  reverse_charge boolean not null default false,
  shipping_address jsonb not null,
  billing_address jsonb not null,
  shipping_method_code text not null,
  shipping_cost_cents integer not null default 0,
  pickup_point jsonb,
  promo_code text,
  promo_discount_cents integer not null default 0,
  subtotal_excl_cents integer not null,
  vat_breakdown jsonb not null default '{}'::jsonb,
  total_incl_cents integer not null,
  tracking_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_user_idx on public.orders (user_id, created_at desc);
create index orders_payment_idx on public.orders (payment_id);
create index orders_created_idx on public.orders (created_at desc, id desc);

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_name jsonb not null,
  product_slug jsonb,
  sku text not null,
  options jsonb not null default '{}'::jsonb,
  image_path text,
  unit_price_excl_cents integer not null,
  vat_rate integer not null,
  quantity integer not null check (quantity > 0)
);

create index order_items_order_idx on public.order_items (order_id);

-- Status/webhook history; the unique constraint makes transitions idempotent
create table public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  event_type text not null,
  payload jsonb,
  created_at timestamptz not null default now(),
  unique (order_id, event_type)
);

-- ---------------------------------------------------------------------------
-- Atomic stock decrement; refuses to oversell.
-- ---------------------------------------------------------------------------

create or replace function public.decrement_stock(p_variant_id uuid, p_quantity integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  updated integer;
begin
  update public.product_variants
  set stock_quantity = stock_quantity - p_quantity
  where id = p_variant_id and stock_quantity >= p_quantity;
  get diagnostics updated = row_count;
  return updated > 0;
end;
$$;

-- only the service role may move stock
revoke execute on function public.decrement_stock(uuid, integer) from anon, authenticated, public;

-- ---------------------------------------------------------------------------
-- RLS + grants
-- ---------------------------------------------------------------------------

alter table public.shipping_methods enable row level security;
alter table public.promo_codes enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_events enable row level security;

create policy "Active shipping methods are readable"
  on public.shipping_methods for select
  to anon, authenticated
  using (active);

-- promo_codes: deny-all for clients (no policies, no grants)

create policy "Users read their own orders"
  on public.orders for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users read their own order items"
  on public.order_items for select
  to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = order_id and o.user_id = (select auth.uid())
  ));

create policy "Users read their own order events"
  on public.order_events for select
  to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = order_id and o.user_id = (select auth.uid())
  ));

grant select on public.shipping_methods to anon, authenticated;
grant select on public.orders, public.order_items, public.order_events to authenticated;
-- service_role inherits full access via default privileges (grants migration)
