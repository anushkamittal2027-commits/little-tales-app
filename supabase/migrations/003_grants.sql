-- Explicit permissions for the app (so "Automatically expose new tables" can stay OFF).
-- Row Level Security (001) still decides which rows each person can touch.
grant usage on schema public to authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.subscriptions to authenticated;
grant select, insert, update, delete on public.tales to authenticated;
grant insert on public.limit_attempts to authenticated;
grant select, insert, update, delete on public.push_subscriptions to authenticated;
grant select, insert, update, delete on public.week_videos to authenticated;
grant execute on function public.my_status() to authenticated;
grant execute on function public.start_trial(text) to authenticated;
grant execute on function public.log_limit_attempt(date) to authenticated;
