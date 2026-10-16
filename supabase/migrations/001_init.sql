-- Little Tales: database design (Stage 3 onwards).
-- Run in the Supabase SQL editor, or with the Supabase CLI. Safe to re-run on an empty project.
-- STATUS: written and syntax-checked, but not yet run against a live project (that needs your Supabase account).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Members
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  email          text,
  display_name   text,
  tz             text not null default 'Asia/Kolkata',          -- the member's own time zone: a day ends at their midnight
  first_sign_in  date,                                          -- Day 1 of the free week (their local date)
  consented_at   timestamptz,                                   -- ticked "I understand how the free week works"
  notify_push    boolean not null default false,
  notify_email   boolean not null default true,
  created_at     timestamptz not null default now()
);

create table if not exists public.subscriptions (
  user_id                  uuid primary key references public.profiles(id) on delete cascade,
  plan                     text not null check (plan in ('monthly','yearly')),
  status                   text not null default 'active' check (status in ('active','cancelled','past_due')),
  razorpay_subscription_id text unique,
  razorpay_customer_id     text,
  current_period_end       timestamptz,
  started_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Tales (up to 3 a day), attempts to make a 4th (founder-only), reminders
-- ---------------------------------------------------------------------------
create table if not exists public.tales (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  tale_date     date not null,                                  -- the day the member tagged it to
  title         text not null default '' check (char_length(title) <= 32),
  thought       text not null default '' check (char_length(thought) <= 140),
  light         text not null default 'golden' check (light in ('morning','golden','dark')),
  decorations   jsonb not null default '[]'::jsonb,
  photo_path    text not null,                                  -- storage: photos/<user>/<tale>.jpg
  thumb_path    text,                                           -- storage: photos/<user>/<tale>-thumb.jpg (small, for lists)
  audio_path    text,                                           -- storage: voices/<user>/<tale>.<ext>
  audio_seconds numeric,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists tales_user_day_idx on public.tales (user_id, tale_date, created_at);

create table if not exists public.limit_attempts (               -- every try at a 4th tale in a day. Founder reads this in the dashboard.
  id         bigserial primary key,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  tale_date  date not null,
  at         timestamptz not null default now()
);

create table if not exists public.push_subscriptions (
  id         bigserial primary key,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.week_videos (                  -- finished videos kept so they open instantly next time
  user_id    uuid not null references public.profiles(id) on delete cascade,
  video_key  text not null,                                     -- 'trial' or 'week-YYYY-MM-DD'
  path       text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, video_key)
);

create table if not exists public.notification_log (             -- so nobody gets the same nudge twice
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind    text not null,                                        -- 'nudge-13','nudge-20','hold-7','hold-1','video-ready'
  day     date not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, kind, day)
);

-- ---------------------------------------------------------------------------
-- The free week, the lock and the 30-day hold, decided on the server (never trusted from the phone)
-- ---------------------------------------------------------------------------
create or replace function public.account_status(uid uuid)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  p public.profiles;
  s public.subscriptions;
  local_today date;
  d int;
  hold_left int;
begin
  select * into p from public.profiles where id = uid;
  if p.id is null or p.first_sign_in is null or p.consented_at is null then
    return jsonb_build_object('status','new');
  end if;
  select * into s from public.subscriptions where user_id = uid and status = 'active';
  local_today := (now() at time zone p.tz)::date;
  d := (local_today - p.first_sign_in) + 1;
  if s.user_id is not null then return jsonb_build_object('status','subscribed','day',d,'plan',s.plan); end if;
  if d < 7  then return jsonb_build_object('status','trial','day',d,'left',7 - d + 1); end if;
  if d = 7  then return jsonb_build_object('status','day7','day',d,'left',1); end if;
  hold_left := 30 - ((d - 7) - 1);
  if hold_left <= 0 then return jsonb_build_object('status','deleted','day',d,'hold_left',0); end if;
  return jsonb_build_object('status','locked','day',d,'hold_left',hold_left);
end $$;

create or replace function public.is_unlocked(uid uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select (public.account_status(uid)->>'status') in ('trial','day7','subscribed') $$;

create or replace function public.my_status() returns jsonb language sql stable
as $$ select public.account_status(auth.uid()) $$;

-- Starts the free week the first time the member ticks the box. Safe to call twice.
create or replace function public.start_trial(p_tz text default 'Asia/Kolkata')
returns jsonb language plpgsql security definer set search_path = public
as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in'; end if;
  insert into public.profiles (id, email, tz, first_sign_in, consented_at)
  values (uid, (select email from auth.users where id = uid), p_tz, (now() at time zone p_tz)::date, now())
  on conflict (id) do update
    set tz = excluded.tz,
        first_sign_in = coalesce(public.profiles.first_sign_in, excluded.first_sign_in),
        consented_at  = coalesce(public.profiles.consented_at, excluded.consented_at);
  return public.account_status(uid);
end $$;

-- ---------------------------------------------------------------------------
-- 3 tales a day, enforced by the database. Deleting one frees its slot.
-- ---------------------------------------------------------------------------
create or replace function public.enforce_daily_limit() returns trigger
language plpgsql security definer set search_path = public
as $$
declare n int;
begin
  select count(*) into n from public.tales where user_id = new.user_id and tale_date = new.tale_date;
  if n >= 3 then raise exception 'DAILY_LIMIT: 3 little tales already kept for %', new.tale_date using errcode = 'P0001'; end if;
  if new.tale_date > (now() at time zone (select tz from public.profiles where id = new.user_id))::date then
    raise exception 'FUTURE_DATE: tales can only be kept for today or earlier' using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists tales_daily_limit on public.tales;
create trigger tales_daily_limit before insert on public.tales for each row execute function public.enforce_daily_limit();

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$ begin new.updated_at := now(); return new; end $$;
drop trigger if exists tales_touch on public.tales;
create trigger tales_touch before update on public.tales for each row execute function public.touch_updated_at();

-- The phone calls this when it blocks a 4th tale, so the founder can review the limit later.
create or replace function public.log_limit_attempt(p_date date) returns void
language sql security definer set search_path = public
as $$ insert into public.limit_attempts (user_id, tale_date) values (auth.uid(), p_date) $$;

-- ---------------------------------------------------------------------------
-- Row level security: every member sees only their own rows; locked members see no tales at all
-- ---------------------------------------------------------------------------
alter table public.profiles           enable row level security;
alter table public.subscriptions      enable row level security;
alter table public.tales              enable row level security;
alter table public.limit_attempts     enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.week_videos        enable row level security;
alter table public.notification_log   enable row level security;

drop policy if exists profiles_self_read   on public.profiles;
drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_read   on public.profiles for select using (id = auth.uid());
create policy profiles_self_update on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists subs_self_read on public.subscriptions;
create policy subs_self_read on public.subscriptions for select using (user_id = auth.uid());   -- only the server (Razorpay webhook) writes

drop policy if exists tales_read   on public.tales;
drop policy if exists tales_write  on public.tales;
drop policy if exists tales_update on public.tales;
drop policy if exists tales_delete on public.tales;
create policy tales_read   on public.tales for select using (user_id = auth.uid() and public.is_unlocked(auth.uid()));
create policy tales_write  on public.tales for insert with check (user_id = auth.uid() and public.is_unlocked(auth.uid()));
create policy tales_update on public.tales for update using (user_id = auth.uid() and public.is_unlocked(auth.uid())) with check (user_id = auth.uid());
create policy tales_delete on public.tales for delete using (user_id = auth.uid());

drop policy if exists attempts_insert on public.limit_attempts;       -- no select policy: members can't read it; the founder uses the dashboard
create policy attempts_insert on public.limit_attempts for insert with check (user_id = auth.uid());

drop policy if exists push_all on public.push_subscriptions;
create policy push_all on public.push_subscriptions for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists videos_all on public.week_videos;
create policy videos_all on public.week_videos for all using (user_id = auth.uid() and public.is_unlocked(auth.uid())) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Private file storage: photos and voice notes live in folders named after the member
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('photos','photos',false), ('voices','voices',false), ('videos','videos',false)
on conflict (id) do nothing;

drop policy if exists files_read   on storage.objects;
drop policy if exists files_write  on storage.objects;
drop policy if exists files_update on storage.objects;
drop policy if exists files_delete on storage.objects;
create policy files_read   on storage.objects for select using (bucket_id in ('photos','voices','videos') and (storage.foldername(name))[1] = auth.uid()::text and public.is_unlocked(auth.uid()));
create policy files_write  on storage.objects for insert with check (bucket_id in ('photos','voices','videos') and (storage.foldername(name))[1] = auth.uid()::text and public.is_unlocked(auth.uid()));
create policy files_update on storage.objects for update using (bucket_id in ('photos','voices','videos') and (storage.foldername(name))[1] = auth.uid()::text and public.is_unlocked(auth.uid()));
create policy files_delete on storage.objects for delete using (bucket_id in ('photos','voices','videos') and (storage.foldername(name))[1] = auth.uid()::text);
