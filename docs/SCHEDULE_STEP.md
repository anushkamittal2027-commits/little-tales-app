# Last server step: start the daily schedule (2 minutes)

Do this after `node tools/deploy-server.mjs` has printed DONE.

1. In Supabase open **Project Settings, API Keys** (https://supabase.com/dashboard/project/vnorlnjsvknhsvjfczyl/settings/api-keys) and copy the **service_role** key (click Reveal). Never share it or paste it in chat.
2. Open the SQL editor: https://supabase.com/dashboard/project/vnorlnjsvknhsvjfczyl/sql/new
3. Paste this, replace `PASTE_SERVICE_ROLE_KEY_HERE` with the key (keep the quotes), and press Run:

```sql
select vault.create_secret('PASTE_SERVICE_ROLE_KEY_HERE', 'service_role_key');
```

4. Open a new query, paste this and press Run:

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule('lt-nudges', '5 * * * *', $$
  select net.http_post(
    url := 'https://vnorlnjsvknhsvjfczyl.supabase.co/functions/v1/nudges',
    headers := jsonb_build_object('Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')),
    body := '{}'::jsonb);
$$);

select cron.schedule('lt-lifecycle', '30 2 * * *', $$
  select net.http_post(
    url := 'https://vnorlnjsvknhsvjfczyl.supabase.co/functions/v1/lifecycle',
    headers := jsonb_build_object('Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')),
    body := '{}'::jsonb);
$$);
```

5. Check: open **Database, Cron Jobs** in Supabase. You should see `lt-nudges` and `lt-lifecycle`.
