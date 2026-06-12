-- Explicit table privileges. Recent Supabase versions no longer auto-grant
-- on new tables in public, which is the right default: grants below are the
-- minimum each role needs, with RLS narrowing rows on top.

grant usage on schema public to anon, authenticated, service_role;

-- Catalog: storefront reads only (RLS hides drafts/pending reviews)
grant select on
  public.categories,
  public.products,
  public.product_variants,
  public.product_images,
  public.attributes,
  public.attribute_values,
  public.product_attribute_values,
  public.tags,
  public.product_tags,
  public.related_products,
  public.reviews
to anon, authenticated;

-- Carts: logged-in users manage their own rows directly (RLS-pinned);
-- guest carts never get client grants — service-role API routes only.
grant select, insert, update, delete on
  public.carts,
  public.cart_items
to authenticated;

-- RPC entry points for catalog browsing/search
grant execute on all functions in schema public to anon, authenticated;

-- API routes / scripts using the secret key
grant all on all tables in schema public to service_role;
grant usage on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

-- Tables and functions added by future migrations: service_role keeps full
-- access automatically; client roles get explicit grants per migration.
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant usage on sequences to service_role;
alter default privileges in schema public
  grant execute on functions to anon, authenticated, service_role;
