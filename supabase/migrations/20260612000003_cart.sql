-- Carts: DB is the source of truth for both guests and logged-in users.
-- Guest carts are keyed by anon_token, which only ever lives in an HttpOnly
-- cookie and is exchanged through service-role API routes — there are NO
-- client-side RLS policies for guest carts by design.
-- Items carry no price; prices are always resolved server-side at read time.

create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  anon_token uuid,
  status text not null default 'active'
    check (status in ('active', 'converted', 'abandoned')),
  -- captured during checkout, enables the abandoned-cart email
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (user_id is not null or anon_token is not null)
);

-- one active cart per identity
create unique index carts_active_user_key on public.carts (user_id)
  where status = 'active' and user_id is not null;
create unique index carts_active_anon_key on public.carts (anon_token)
  where status = 'active' and anon_token is not null;
-- abandoned-cart cron scans by inactivity
create index carts_abandoned_scan_idx on public.carts (status, updated_at);

create trigger carts_set_updated_at
  before update on public.carts
  for each row execute function public.set_updated_at();

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  quantity integer not null check (quantity between 1 and 99),
  created_at timestamptz not null default now(),
  unique (cart_id, variant_id)
);

create index cart_items_cart_id_idx on public.cart_items (cart_id);

-- touch the parent cart whenever items change (keeps abandoned-cart timing honest)
create or replace function public.touch_cart()
returns trigger
language plpgsql
as $$
begin
  update public.carts set updated_at = now()
  where id = coalesce(new.cart_id, old.cart_id);
  return coalesce(new, old);
end;
$$;

create trigger cart_items_touch_cart
  after insert or update or delete on public.cart_items
  for each row execute function public.touch_cart();

-- ---------------------------------------------------------------------------
-- RLS: logged-in users see only their own active cart; guest carts are
-- reachable exclusively through the service role (API routes).
-- ---------------------------------------------------------------------------

alter table public.carts enable row level security;
alter table public.cart_items enable row level security;

create policy "Users manage their own carts"
  on public.carts for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users manage their own cart items"
  on public.cart_items for all
  to authenticated
  using (exists (
    select 1 from public.carts c
    where c.id = cart_id and c.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.carts c
    where c.id = cart_id and c.user_id = (select auth.uid())
  ));
