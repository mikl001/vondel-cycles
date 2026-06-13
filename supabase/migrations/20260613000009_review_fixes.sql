-- Round-2 review fixes: a transactional/oversell-safe payment finalizer, a
-- single-query review summary, deterministic search_path on catalog functions,
-- and a sargable incl-price index.

-- ---------------------------------------------------------------------------
-- finalize_order: atomically applies a payment outcome to a pending order.
-- The whole function body is one transaction, so partial application is
-- impossible (fixes the "stranded in pending after a mid-sequence crash"
-- defect). Stock is verified-and-decremented under row locks, so two paid
-- checkouts for the last unit can no longer both succeed (fixes the silent
-- oversell): the loser comes back as outcome='oversold' for the caller to
-- refund. Promo use_count is bumped with a conditional update (no race).
-- Idempotent via the unique (order_id, event_type) constraint.
-- ---------------------------------------------------------------------------

create or replace function public.finalize_order(
  p_order_id uuid,
  p_paid boolean,
  p_failed_status text default 'cancelled'
)
returns table (
  applied boolean,
  outcome text,
  order_number text,
  email text,
  locale text,
  confirmation_token uuid,
  order_lines jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
  v_event_type text;
  v_all_ok boolean;
begin
  v_event_type := case when p_paid then 'payment_paid'
                       else 'payment_' || p_failed_status end;

  -- claim the transition; a duplicate delivery rolls back to a no-op
  begin
    insert into public.order_events (order_id, event_type)
    values (p_order_id, v_event_type);
  exception when unique_violation then
    return query select false, 'noop'::text, null::text, null::text, null::text, null::uuid, null::jsonb;
    return;
  end;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found or v_order.status <> 'pending' then
    return query select false, 'noop'::text, null::text, null::text, null::text, null::uuid, null::jsonb;
    return;
  end if;

  if not p_paid then
    update public.orders set status = p_failed_status where id = p_order_id;
    return query select true, 'failed'::text, v_order.order_number, v_order.email,
                        v_order.locale, v_order.confirmation_token, null::jsonb;
    return;
  end if;

  -- paid: lock the variant rows so a concurrent finalize serializes behind us.
  -- ORDER BY id gives every order a consistent lock-acquisition order, so two
  -- orders sharing >1 variant cannot deadlock against each other.
  perform v.id from public.product_variants v
  where v.id in (
    select variant_id from public.order_items
    where order_id = p_order_id and variant_id is not null
  )
  order by v.id
  for update;

  select coalesce(bool_and(v.stock_quantity >= oi.quantity), true)
  into v_all_ok
  from public.order_items oi
  join public.product_variants v on v.id = oi.variant_id
  where oi.order_id = p_order_id;

  if not v_all_ok then
    -- genuine oversell: do not mark paid; the caller refunds
    update public.orders set status = 'cancelled' where id = p_order_id;
    insert into public.order_events (order_id, event_type)
    values (p_order_id, 'oversold') on conflict do nothing;
    return query select true, 'oversold'::text, v_order.order_number, v_order.email,
                        v_order.locale, v_order.confirmation_token, null::jsonb;
    return;
  end if;

  update public.product_variants v
  set stock_quantity = v.stock_quantity - oi.quantity
  from public.order_items oi
  where oi.order_id = p_order_id and oi.variant_id = v.id;

  update public.orders set status = 'paid' where id = p_order_id;

  if v_order.cart_id is not null then
    update public.carts set status = 'converted' where id = v_order.cart_id;
  end if;

  if v_order.promo_code is not null then
    update public.promo_codes
    set use_count = use_count + 1
    where code = v_order.promo_code
      and (max_uses is null or use_count < max_uses);
  end if;

  return query
  select true, 'paid'::text, v_order.order_number, v_order.email, v_order.locale,
    v_order.confirmation_token,
    (
      select jsonb_agg(
        jsonb_build_object('product_name', oi.product_name, 'quantity', oi.quantity)
        order by oi.sku
      )
      from public.order_items oi where oi.order_id = p_order_id
    );
end;
$$;

revoke execute on function public.finalize_order(uuid, boolean, text)
  from anon, authenticated, public;

-- ---------------------------------------------------------------------------
-- product_review_summary: count + average in one query (replaces the extra
-- full-table scan the application did to average ratings on every render).
-- ---------------------------------------------------------------------------

create or replace function public.product_review_summary(p_product_id uuid)
returns table (review_count bigint, average numeric)
language sql
stable
set search_path = public
as $$
  select count(*), coalesce(avg(rating), 0)
  from public.reviews
  where product_id = p_product_id and status = 'approved';
$$;

-- ---------------------------------------------------------------------------
-- Deterministic resolution of extensions.word_similarity regardless of the
-- caller's session search_path (was the standard function_search_path_mutable
-- lint and would break for any non-PostgREST caller).
-- ---------------------------------------------------------------------------

alter function public.filter_products(uuid[], jsonb, integer, integer, boolean, text, text, integer, integer)
  set search_path = public, extensions;
alter function public.facet_counts(uuid[], jsonb, integer, integer, boolean, text)
  set search_path = public, extensions;
alter function public.search_suggestions(text, text, integer)
  set search_path = public, extensions;

-- ---------------------------------------------------------------------------
-- Make the incl-BTW price filter sargable (the filters wrap the column in
-- price_incl_cents(), so the plain base_price_cents btree was never used).
-- ---------------------------------------------------------------------------

create index if not exists products_price_incl_idx
  on public.products ((public.price_incl_cents(base_price_cents, vat_rate)));
