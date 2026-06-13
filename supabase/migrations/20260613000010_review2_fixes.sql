-- Round-2 review fixes (security + cleanup).

-- next_order_number() bumps a sequence; only the service-role checkout path
-- inserts orders, so no client role should be able to call it directly (that
-- would burn the sequence and create order-number gaps). The grants migration's
-- blanket "execute on all functions" had exposed it.
revoke execute on function public.next_order_number() from anon, authenticated, public;

-- decrement_stock is dead: finalize_order now performs the locked, all-or-nothing
-- stock decrement itself. Remove the superseded function.
drop function if exists public.decrement_stock(uuid, integer);
