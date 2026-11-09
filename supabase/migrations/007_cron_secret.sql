-- The scheduled jobs get their own password, made and kept inside the database (Vault).
-- The server functions ask the database whether a password is right, so no key ever has to be copied by hand.
-- Run once in the Supabase SQL editor.
select vault.create_secret(gen_random_uuid()::text || gen_random_uuid()::text, 'lt_cron_secret')
where not exists (select 1 from vault.secrets where name = 'lt_cron_secret');

create or replace function public.lt_is_cron_secret(s text) returns boolean
language sql security definer set search_path = '' as $$
  select exists (select 1 from vault.decrypted_secrets where name = 'lt_cron_secret' and decrypted_secret = s);
$$;
revoke all on function public.lt_is_cron_secret(text) from public, anon, authenticated;
grant execute on function public.lt_is_cron_secret(text) to service_role;

select cron.alter_job((select jobid from cron.job where jobname = 'lt-nudges'), command := $cmd$
  select net.http_post(
    url := 'https://vnorlnjsvknhsvjfczyl.supabase.co/functions/v1/nudges',
    headers := jsonb_build_object('Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'lt_cron_secret')),
    body := '{}'::jsonb);
$cmd$);
select cron.alter_job((select jobid from cron.job where jobname = 'lt-lifecycle'), command := $cmd$
  select net.http_post(
    url := 'https://vnorlnjsvknhsvjfczyl.supabase.co/functions/v1/lifecycle',
    headers := jsonb_build_object('Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'lt_cron_secret')),
    body := '{}'::jsonb);
$cmd$);
