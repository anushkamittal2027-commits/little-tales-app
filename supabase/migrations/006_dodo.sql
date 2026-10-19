-- Dodo Payments alongside Razorpay: which provider, Dodo's own ids, and the time of the last message we acted on (to ignore late, out-of-order ones).
alter table public.subscriptions add column if not exists provider text not null default 'razorpay';
alter table public.subscriptions add column if not exists dodo_subscription_id text unique;
alter table public.subscriptions add column if not exists dodo_customer_id text;
alter table public.subscriptions add column if not exists last_event_at timestamptz;
