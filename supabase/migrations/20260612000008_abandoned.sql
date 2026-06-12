-- Abandoned-cart support: the checkout captures the customer email on the
-- cart; the cron route mails stale active carts exactly once.

alter table public.carts
  add column abandoned_notified_at timestamptz;

create index carts_abandoned_candidates_idx
  on public.carts (updated_at)
  where status = 'active' and email is not null and abandoned_notified_at is null;
