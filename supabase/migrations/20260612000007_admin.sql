-- Admin back-office: roles with a JWT claim hook, audit log and report views.
-- Granting admin requires a token refresh (re-login) before the claim shows
-- up in the JWT — the back-office therefore also checks user_roles directly.

create table public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin')),
  created_at timestamptz not null default now()
);

alter table public.user_roles enable row level security;
-- no client policies/grants: managed exclusively via service role.
-- The auth hook below runs as supabase_auth_admin, which is subject to RLS
-- like any role — without this policy the role lookup silently returns null.
create policy "Auth admin can read user roles"
  on public.user_roles for select
  to supabase_auth_admin
  using (true);

-- ---------------------------------------------------------------------------
-- Custom access token hook: injects app_role into every issued JWT.
-- Runs as supabase_auth_admin (configured in config.toml / dashboard).
-- ---------------------------------------------------------------------------

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  claims jsonb;
  user_role text;
begin
  select role into user_role
  from public.user_roles
  where user_id = (event->>'user_id')::uuid;

  claims := event->'claims';
  if user_role is not null then
    claims := jsonb_set(claims, '{app_role}', to_jsonb(user_role));
  end if;
  return jsonb_set(event, '{claims}', claims);
end;
$$;

grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from anon, authenticated, public;
grant select on public.user_roles to supabase_auth_admin;

-- JWT-claim check, usable in RLS policies
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt()->>'app_role', '') = 'admin';
$$;

-- ---------------------------------------------------------------------------
-- Audit log: one row per admin mutation (actor, action, entity, diff)
-- ---------------------------------------------------------------------------

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  actor_email text,
  action text not null,
  entity_type text not null,
  entity_id text,
  diff jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_created_idx on public.audit_log (created_at desc);

alter table public.audit_log enable row level security;
-- service-role only

-- ---------------------------------------------------------------------------
-- Report views (service-role only; security_invoker keeps RLS semantics)
-- ---------------------------------------------------------------------------

create view public.admin_sales_per_day
with (security_invoker = true) as
select
  created_at::date as day,
  count(*) as orders,
  sum(total_incl_cents) as revenue_cents,
  round(avg(total_incl_cents)) as avg_order_cents
from public.orders
where status in ('paid', 'processing', 'shipped', 'delivered')
group by 1
order by 1 desc;

create view public.admin_low_stock
with (security_invoker = true) as
select
  v.id as variant_id,
  v.sku,
  p.name as product_name,
  v.stock_quantity,
  v.low_stock_threshold
from public.product_variants v
join public.products p on p.id = v.product_id
where p.status = 'active' and v.stock_quantity <= v.low_stock_threshold
order by v.stock_quantity;
