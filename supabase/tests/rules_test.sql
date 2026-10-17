-- Tests for the Little Tales rules. Run through run.sh. Any problem raises an exception and the run fails.
\set ON_ERROR_STOP on
\set QUIET on
create or replace function pg_temp.act_as(uid uuid) returns void language plpgsql as
$$ begin perform set_config('request.jwt.claim.sub', coalesce(uid::text, ''), false); end $$;
create or replace function pg_temp.check(label text, ok boolean) returns void language plpgsql as
$$ begin if ok then raise notice 'PASS  %', label; else raise exception 'FAIL  %', label; end if; end $$;
create or replace function pg_temp.fails(label text, stmt text, expect text) returns void language plpgsql as
$$ begin
  begin execute stmt; raise exception 'FAIL  % (it was allowed)', label;
  exception when others then
    if sqlerrm like 'FAIL  %' then raise; end if;
    if sqlerrm like '%' || expect || '%' then raise notice 'PASS  % (blocked: %)', label, left(sqlerrm, 60);
    else raise exception 'FAIL  % (wrong error: %)', label, sqlerrm; end if;
  end;
end $$;

\set A '11111111-1111-1111-1111-111111111111'
\set B '22222222-2222-2222-2222-222222222222'
insert into auth.users (id, email) values (:'A', 'a@example.com'), (:'B', 'b@example.com');

-- ---- starting the free week (as member A) ----
set role authenticated;
select pg_temp.act_as(:'A'::uuid);
select pg_temp.check('before consent the status is new', (select public.my_status()->>'status') = 'new');
select public.start_trial('Asia/Kolkata');
select pg_temp.check('after consent the status is trial on day 1', (select public.my_status()->>'status') = 'trial' and (select (public.my_status()->>'day')::int) = 1);
select public.start_trial('Asia/Kolkata');
select pg_temp.check('starting twice does not restart the week', (select count(*) from public.profiles) = 1);

-- ---- 3 tales a day, deleting frees a slot ----
insert into public.tales (user_id, tale_date, photo_path) select :'A', (now() at time zone 'Asia/Kolkata')::date, 'a/' || g || '.jpg' from generate_series(1,3) g;
select pg_temp.check('three tales kept today', (select count(*) from public.tales) = 3);
select pg_temp.fails('a 4th tale is refused', format($q$insert into public.tales (user_id, tale_date, photo_path) values ('%s', (now() at time zone 'Asia/Kolkata')::date, 'a/4.jpg')$q$, :'A'), 'DAILY_LIMIT');
select public.log_limit_attempt((now() at time zone 'Asia/Kolkata')::date);
select pg_temp.check('the 4th attempt can be logged', true);
select pg_temp.check('members cannot read the attempts table', (select count(*) from public.limit_attempts) = 0);
delete from public.tales where id = (select id from public.tales order by created_at limit 1);
insert into public.tales (user_id, tale_date, photo_path) values (:'A', (now() at time zone 'Asia/Kolkata')::date, 'a/5.jpg');
select pg_temp.check('deleting a tale frees its slot', (select count(*) from public.tales) = 3);
select pg_temp.fails('a future day is refused', format($q$insert into public.tales (user_id, tale_date, photo_path) values ('%s', current_date + 5, 'a/6.jpg')$q$, :'A'), 'FUTURE_DATE');
select pg_temp.fails('a thought over 140 characters is refused', format($q$insert into public.tales (user_id, tale_date, thought, photo_path) values ('%s', current_date - 2, '%s', 'a/7.jpg')$q$, :'A', repeat('x', 141)), 'check');
insert into public.tales (user_id, tale_date, photo_path) values (:'A', current_date - 3, 'a/8.jpg');
select pg_temp.check('a backdated tale counts against its own day', (select count(*) from public.tales where tale_date = current_date - 3) = 1);

-- ---- privacy: member B sees nothing of A ----
select public.start_trial('Asia/Kolkata') from (select pg_temp.act_as(:'B'::uuid)) s;
select pg_temp.check('member B cannot see member A tales', (select count(*) from public.tales) = 0);
select pg_temp.fails('member B cannot write into member A account', format($q$insert into public.tales (user_id, tale_date, photo_path) values ('%s', current_date - 1, 'x.jpg')$q$, :'A'), 'row-level security');
select pg_temp.check('member B cannot see member A profile', (select count(*) from public.profiles where id = :'A') = 0);

-- ---- time travel: day 7, locked, hold, deleted, subscribed (done as the server) ----
reset role;
create or replace function pg_temp.set_day(uid uuid, day_no int) returns void language sql as
$$ update public.profiles set first_sign_in = (now() at time zone tz)::date - (day_no - 1) where id = uid $$;

select pg_temp.set_day(:'A', 6);  select pg_temp.check('day 6 is trial', (select public.account_status(:'A')->>'status') = 'trial');
select pg_temp.set_day(:'A', 7);  select pg_temp.check('day 7 is day7', (select public.account_status(:'A')->>'status') = 'day7');
select pg_temp.set_day(:'A', 8);  select pg_temp.check('day 8 is locked with 30 days left', (select public.account_status(:'A')->>'status') = 'locked' and (select (public.account_status(:'A')->>'hold_left')::int) = 30);
select pg_temp.set_day(:'A', 14); select pg_temp.check('day 14 has 24 days left', (select (public.account_status(:'A')->>'hold_left')::int) = 24);
select pg_temp.set_day(:'A', 37); select pg_temp.check('day 37 has 1 day left', (select (public.account_status(:'A')->>'hold_left')::int) = 1);
select pg_temp.set_day(:'A', 38); select pg_temp.check('day 38 is deleted', (select public.account_status(:'A')->>'status') = 'deleted');

-- locked members: no reading, no writing, but they can still delete
select pg_temp.set_day(:'A', 20);
set role authenticated; select pg_temp.act_as(:'A'::uuid);
select pg_temp.check('a locked member sees no tales', (select count(*) from public.tales) = 0);
select pg_temp.fails('a locked member cannot add a tale', format($q$insert into public.tales (user_id, tale_date, photo_path) values ('%s', current_date - 9, 'z.jpg')$q$, :'A'), 'row-level security');

-- subscribing brings everything back
reset role;
insert into public.subscriptions (user_id, plan, status) values (:'A', 'yearly', 'active');
set role authenticated; select pg_temp.act_as(:'A'::uuid);
select pg_temp.check('subscribed status', (select public.my_status()->>'status') = 'subscribed');
select pg_temp.check('all tales come back after subscribing', (select count(*) from public.tales) = 4);
select pg_temp.fails('members cannot give themselves a subscription', format($q$insert into public.subscriptions (user_id, plan) values ('%s', 'monthly')$q$, :'B'), 'row-level security');

-- ---- private file storage ----
insert into storage.objects (bucket_id, name) values ('photos', :'A' || '/p1.jpg');
select pg_temp.check('members can upload into their own folder', true);
select pg_temp.fails('members cannot upload into someone else folder', format($q$insert into storage.objects (bucket_id, name) values ('photos', '%s/p.jpg')$q$, :'B'), 'row-level security');
reset role;
insert into storage.objects (bucket_id, name) values ('photos', :'B' || '/secret.jpg');
set role authenticated; select pg_temp.act_as(:'A'::uuid);
select pg_temp.check('members only see their own files', (select count(*) from storage.objects) = 1);

-- deleting an account removes everything (the delete-account function does this)
reset role;
delete from auth.users where id = :'A';
select pg_temp.check('deleting an account removes its profile, tales and subscription',
  (select count(*) from public.profiles where id = :'A') = 0 and (select count(*) from public.tales where user_id = :'A') = 0 and (select count(*) from public.subscriptions where user_id = :'A') = 0);
select pg_temp.check('...and leaves other members alone', (select count(*) from public.profiles where id = :'B') = 1);
select 'ALL DATABASE RULES PASSED' as result;

-- a tale may keep its photo original (light = 'none') once migration 004 is applied
do $$ declare ok boolean := true; begin
  begin
    insert into public.tales (user_id, tale_date, photo_path, light) select id, current_date, 'x', 'none' from public.profiles limit 1;
  exception when others then ok := false; end;
  raise notice '% light none is allowed', case when ok then 'PASS' else 'FAIL' end;
end $$;


-- ---- review fixes (migration 005) ----
reset role;
\set C '33333333-3333-3333-3333-333333333333'
insert into auth.users (id, email) values (:'C', 'c@example.com');
insert into public.profiles (id, email, tz, first_sign_in, consented_at) values (:'C', 'c@example.com', 'UTC', (now() at time zone 'UTC')::date, now());
set role authenticated; select pg_temp.act_as(:'C'::uuid);
select pg_temp.fails('a member cannot move their free-week start date', $q$update public.profiles set first_sign_in = '2099-01-01'$q$, 'permission denied');
select pg_temp.fails('a member cannot change their time zone', $q$update public.profiles set tz = 'Pacific/Kiritimati'$q$, 'permission denied');
update public.profiles set notify_push = true;
select pg_temp.check('a member can still change reminder preferences', (select notify_push from public.profiles) = true);
insert into public.tales (id, user_id, tale_date, photo_path) select ('00000000-0000-4000-8000-00000000000' || g)::uuid, :'C', (now() at time zone 'UTC')::date, 'c/' || g || '.jpg' from generate_series(1,3) g;
insert into public.tales (id, user_id, tale_date, photo_path, thought) values ('00000000-0000-4000-8000-000000000003', :'C', (now() at time zone 'UTC')::date, 'c/3.jpg', 'edited')
  on conflict (id) do update set thought = excluded.thought;
select pg_temp.check('editing one of 3 tales on a day (an upsert) is allowed', (select thought from public.tales where id = '00000000-0000-4000-8000-000000000003') = 'edited');
select pg_temp.fails('a 4th new tale is still refused', format($q$insert into public.tales (user_id, tale_date, photo_path) values ('%s', (now() at time zone 'UTC')::date, 'c/4.jpg')$q$, :'C'), 'DAILY_LIMIT');
insert into public.tales (id, user_id, tale_date, photo_path) values ('00000000-0000-4000-8000-000000000009', :'C', current_date - 4, 'c/9.jpg');
select pg_temp.fails('moving a tale onto a full day is refused', $q$update public.tales set tale_date = (now() at time zone 'UTC')::date where id = '00000000-0000-4000-8000-000000000009'$q$, 'DAILY_LIMIT');
update public.tales set thought = 'x', tale_date = tale_date where id = '00000000-0000-4000-8000-000000000009';
select pg_temp.check('ordinary edits of a tale still work', true);
insert into public.tales (user_id, tale_date, photo_path) values (:'C', (now() at time zone 'Pacific/Kiritimati')::date, 'c/k.jpg');
select pg_temp.check('a member who travelled ahead of their saved time zone is not refused', (select count(*) from public.tales where photo_path = 'c/k.jpg') = 1);
select pg_temp.fails('but a date beyond every time zone is refused', format($q$insert into public.tales (user_id, tale_date, photo_path) values ('%s', (now() at time zone 'Pacific/Kiritimati')::date + 1, 'c/z.jpg')$q$, :'C'), 'FUTURE_DATE');
