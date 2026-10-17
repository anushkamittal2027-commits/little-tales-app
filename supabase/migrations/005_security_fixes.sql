-- Fixes found in review.
-- 1) Members could change their own free-week start date (and time zone), giving themselves a free trial for ever.
--    Now they can only change their reminder preferences. Dates are only written by the server (start_trial).
revoke update on public.profiles from authenticated;
grant update (notify_push, notify_email, display_name) on public.profiles to authenticated;

-- 2) The 3-a-day rule ran on edits too: editing one of 3 tales on a day (an "upsert") counted the tale itself and was refused.
--    It now ignores the tale's own row, and also guards moving a tale to a day that is already full.
--    "Future date" is judged against the furthest-ahead time zone on Earth, so a member who travels is never refused by mistake.
create or replace function public.enforce_daily_limit() returns trigger
language plpgsql security definer set search_path = public
as $$
declare n int;
begin
  if tg_op = 'UPDATE' and new.tale_date = old.tale_date then return new; end if;
  select count(*) into n from public.tales where user_id = new.user_id and tale_date = new.tale_date and id <> new.id;
  if n >= 3 then raise exception 'DAILY_LIMIT: 3 little tales already kept for %', new.tale_date using errcode = 'P0001'; end if;
  if new.tale_date > (now() at time zone 'Pacific/Kiritimati')::date then
    raise exception 'FUTURE_DATE: tales can only be kept for today or earlier' using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists tales_daily_limit on public.tales;
create trigger tales_daily_limit before insert or update of tale_date on public.tales for each row execute function public.enforce_daily_limit();
