-- Scheduled jobs. Run AFTER the edge functions are deployed and the two secrets below exist.
-- Replace <PROJECT_REF> with your Supabase project reference, and store the function key in Vault:
--   select vault.create_secret('<SERVICE_ROLE_KEY>', 'service_role_key');
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Every hour: the "nudges" function sends the 1pm and 8pm reminders to members whose LOCAL time matches.
select cron.schedule('lt-nudges', '5 * * * *', $$
  select net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/nudges',
    headers := jsonb_build_object('Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')),
    body := '{}'::jsonb);
$$);

-- Once a day: 7-day and 1-day deletion warnings, and the permanent deletion after 30 days locked.
select cron.schedule('lt-lifecycle', '30 2 * * *', $$
  select net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/lifecycle',
    headers := jsonb_build_object('Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')),
    body := '{}'::jsonb);
$$);
