-- Round-3 review polish: clear the function_search_path_mutable lint uniformly
-- and drop a dead function.

-- These reference only public.- and pg_catalog objects; pinning search_path
-- makes resolution deterministic regardless of caller and clears the advisor.
alter function public.set_updated_at() set search_path = public;
alter function public.touch_cart() set search_path = public;
alter function public.next_order_number() set search_path = public;
alter function public.price_incl_cents(integer, integer) set search_path = public;
alter function public.price_range(uuid[]) set search_path = public;
alter function public.product_cards(uuid[]) set search_path = public;
alter function public.custom_access_token_hook(jsonb) set search_path = public;

-- is_admin() was never wired into any RLS policy (admin authz runs through the
-- service-role client + a user_roles lookup), so it is dead code. Remove it.
drop function if exists public.is_admin();
