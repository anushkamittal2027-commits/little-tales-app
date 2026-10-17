# Going live: what is built, and exactly what happens next

Plain words. Everything here is free to set up. The first real costs only appear once you have paying members.

## What already works (tested)

The whole app runs on a phone today, saving to that phone only:
- The stamp journey: camera or gallery, voice or text, frame, stamping, decorating, posting, day and tale views, editing, deleting.
- The 3-tales-a-day rule, with every 4th attempt counted for you in the founder panel.
- The free week: consent screen, Day 1 to 7 tracking, the Day 7 "Your week" video (a real video made on the phone), the paywall, a practice checkout, the locked screen, the 30-day hold and automatic deletion.
- The Account screen: your plan, download your whole scrapbook as one file, delete your account and tales.
- Home Screen and reminder onboarding, offline support, and reminder handling in the app.
- Founder panel (tap the logo 5 times): jump to any state, switch GST prices on or off, reload sample tales.

## What is prepared but not switched on (needs your accounts)

| Piece | Where it is | What it needs |
|---|---|---|
| Online database, storage and the rules (3 a day, locked members see nothing) | `supabase/migrations/001_init.sql` | A Supabase project |
| Daily jobs: nudges, 7-day and 1-day warnings, 30-day deletion | `supabase/functions/*`, `supabase/migrations/002_schedules.sql` | The same project, plus the keys below |
| Payments (UPI AutoPay and cards) | `supabase/functions/create-subscription`, `razorpay-webhook` | A Razorpay account |
| Delete my account (server side) | `supabase/functions/delete-account` | The same project |

The database file has been checked for correct syntax. It has not been run on a live project yet, because that needs your Supabase account. I will run it and test everything the moment the project exists.

## What I need from you, in order

### 1. GitHub: not needed for building
The app is built in this session. To keep your own copy on GitHub, copy the project folder into your GitHub Desktop repo and push (see PROGRESS.md). Cloudflare Pages can later build straight from that repo.

### 2. Supabase (login, saving, reminders). Free plan. Use hellolittletales@gmail.com.
1. Go to https://supabase.com and sign up. Create a new project. Pick the region **Mumbai (ap-south-1)** so it is fast in India. Save the database password in your own password manager.
2. In the project, open **Project Settings, API**. Copy the **Project URL** and the **anon public key** and send them to me. These two are meant to be public, so it is safe to paste them in chat.
3. **Never paste the `service_role` key anywhere in chat.** When I need it, I will tell you which Supabase screen to put it in.

### 3. Google sign-in. Free.
1. Go to https://console.cloud.google.com, create a project called Little Tales.
2. **APIs and Services, OAuth consent screen**: set the app name Little Tales, support email hellolittletales@gmail.com.
3. **Credentials, Create OAuth client ID, Web application**. I will give you the exact "redirect address" to paste, which comes from your Supabase project.
4. Paste the Client ID and Client Secret into Supabase, **Authentication, Providers, Google**. Do not send them in chat.

### 4. Email codes and warnings (Resend). Free, 100 emails a day.
Sign up at https://resend.com, create an API key, and store it as a Supabase secret named `RESEND_API_KEY` (I will show you the screen). You will need your own domain before emails can come from your name; until then Resend can send test emails to yourself only.

### 5. Hosting (Cloudflare Pages). Free.
Sign up at https://dash.cloudflare.com/sign-up. After GitHub is connected, Connect your GitHub repo in Cloudflare Pages. **Build command: `npm run build:site`. Build output directory: `dist/site`.** (Details in `docs/FOUNDER_TESTING.md`.)

### 6. Reminders (phone notifications)
I will generate a pair of reminder keys. The public one goes into the app. The private one goes into Supabase as a secret (`VAPID_PRIVATE_KEY`), never in chat.

### 7. Razorpay (payments). Free to join, about 2% per payment.
1. Sign up at https://razorpay.com and stay in **Test mode**. In the dashboard, create two plans: Monthly (Rs 149) and Yearly (Rs 999).
2. Send me the two plan IDs (they start with `plan_`). Store the Key ID and Key Secret as Supabase secrets (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`). Add the webhook address I give you, with its own secret (`RAZORPAY_WEBHOOK_SECRET`).
3. **Going live** (real money) needs a registered business, a business bank account and ID checks. That is a later step. You are not blocked until then.

### 8. Your domain
Check whether your GitHub Student Pack free-domain offer fits (ending, terms, renewal price). Otherwise buy one before launch.

## What I do once each piece arrives
1. Run the database file, turn on login, switch the app from "saved on this phone" to "saved online", and test sign-in from two phones.
2. Deploy the server jobs and the schedule, then test a nudge and a lock and deletion cycle with time travel.
3. Connect Razorpay in test mode and replace the practice checkout with the real one.
4. Put the app on Cloudflare and test the real camera and microphone.
5. Legal pages, consent, backups and final checks.

## Free backups (before launch)
The free Supabase plan has no automatic backups, so I will add a nightly job that saves the database to a private GitHub repo, and a weekly copy of photos and voice notes. I will explain it in plain words when we get there.

## Costs, honestly
- Everything above is free at the start.
- Supabase free plan: 1 GB storage and 5 GB downloads a month. I shrink photos and voice notes so it should hold roughly 3,000 tales. When you near the limit, I will warn you. Pro plan is $25 a month, to be paid from subscription income.
- Razorpay: about 2% of each payment, no monthly fee.
- Domain: depends on your free-domain offer.
