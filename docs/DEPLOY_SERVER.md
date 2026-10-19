# EASY WAY (use this)
1. Unzip the latest `littletales-project-full-vN.zip`, open the inner folder (it contains `package.json`), click its address bar, type `cmd`, press Enter.
2. Run: `node tools/deploy-server.mjs`
   (It signs you in to Supabase in the browser, makes the reminder keys, saves the secrets, and puts the 7 server functions online.)
3. (Nothing to send: the website already has the matching reminder key.)
4. Do the last step in `docs/SCHEDULE_STEP.md` (two SQL pastes in Supabase).

Everything below is the manual version of the same thing.

---

# Switching on the server jobs (reminders, warnings, deletion, payments)

Plain steps for Windows. Run them in the black window, inside the project folder (where `dir` shows `package.json`). Nothing here is pasted into chat. Never share these values.

## 0. One-time sign-in to Supabase's command line
```
npx supabase login
```
A browser page opens. Click allow. (No token to copy.)

```
npx supabase link --project-ref vnorlnjsvknhsvjfczyl
```
It may ask for your **database password**: type it in the black window only.

## 1. Reminder keys (phone notifications)
```
npx web-push generate-vapid-keys
```
It prints a **Public Key** and a **Private Key**.
- Send Claude the **Public Key only**. It goes into `js/config.js` (`VAPID_PUBLIC_KEY`).
- Put both in Supabase as secrets (step 2). The private key never leaves your computer and Supabase.

## 2. Secrets (typed in the black window)
```
npx supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=...
npx supabase secrets set MAIL_FROM="Little Tales <hello@littletales.me>"
```
Later, when Resend and Razorpay are ready:
```
npx supabase secrets set RESEND_API_KEY=...
npx supabase secrets set RAZORPAY_KEY_ID=... RAZORPAY_KEY_SECRET=... RAZORPAY_WEBHOOK_SECRET=...
npx supabase secrets set RAZORPAY_PLAN_MONTHLY=plan_... RAZORPAY_PLAN_YEARLY=plan_...
```
(The Supabase URL and keys are added to functions automatically.)

## 3. Deploy the functions
```
npx supabase functions deploy delete-account
npx supabase functions deploy nudges
npx supabase functions deploy lifecycle
npx supabase functions deploy create-subscription
npx supabase functions deploy cancel-subscription
npx supabase functions deploy razorpay-webhook
npx supabase functions deploy dodo-webhook
```
`supabase/config.toml` already marks the webhook and the two scheduled jobs as not needing a member sign-in.

## 4. The schedule
1. Supabase, Project Settings, API: copy the **service_role** key (click Reveal). Do not share it.
2. SQL Editor, new query. Run (put the key between the quotes):
   ```
   select vault.create_secret('PASTE_SERVICE_ROLE_KEY_HERE', 'service_role_key');
   ```
3. Open `supabase/migrations/002_schedules.sql`, replace both `<PROJECT_REF>` with `vnorlnjsvknhsvjfczyl`, paste into a new query and run it.
4. Check: Database, Cron Jobs shows `lt-nudges` and `lt-lifecycle`.

## 5. Razorpay webhook (test mode)
Razorpay Dashboard, Settings, Webhooks, Add: URL `https://vnorlnjsvknhsvjfczyl.supabase.co/functions/v1/razorpay-webhook`, a secret you choose (the same as `RAZORPAY_WEBHOOK_SECRET`), and tick the **subscription.activated, subscription.charged, subscription.cancelled, subscription.completed, subscription.halted, subscription.pending** events.

## 6. Quick checks
- Delete account from the app (use a test account): the user disappears from Authentication, Users and from Storage.
- In the SQL editor use "Run" on `select * from cron.job;` to see the two jobs.
- Test a reminder by hand: Edge Functions, `nudges`, Test, with header `Authorization: Bearer <service key>`. It only sends in members' 1pm and 8pm hour.


## Dodo Payments (instead of, or next to, Razorpay)
1. Run the SQL in `supabase/migrations/006_dodo.sql` once (Supabase, SQL Editor).
2. In Dodo (Test mode first), Developer, Webhooks, Add endpoint: URL `https://vnorlnjsvknhsvjfczyl.supabase.co/functions/v1/dodo-webhook`, and tick subscription.active, subscription.renewed, subscription.plan_changed, subscription.on_hold, subscription.past_due, subscription.failed, subscription.cancelled, subscription.expired and payment.succeeded.
3. Save the endpoint's signing secret in Supabase (never in chat): `npx supabase secrets set DODO_WEBHOOK_SECRET=whsec_...`
4. Save the two product ids: `npx supabase secrets set DODO_PRODUCT_MONTHLY=pdt_... DODO_PRODUCT_YEARLY=pdt_...`
5. Deploy the function: `npx supabase functions deploy dodo-webhook`
