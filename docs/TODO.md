# Little Tales: what is left for a fully working, seamless app

Updated at the end of phase 1 (v11). We pick this up tomorrow.

## A. Only the founder can do these (accounts and settings)
1. Razorpay: test mode plans (Rs 149 monthly, Rs 999 yearly), API keys, webhook. Then test a payment end to end.
2. Server script: `node tools/deploy-server.mjs`, then the SQL in `docs/SCHEDULE_STEP.md`. Switches on the 1pm and 8pm nudges and the 30-day cleanup.
3. Resend for login emails (Gmail has a daily sending limit), then switch Supabase SMTP to it.
4. Confirm the renewal and refund wording and the servers region line in Terms and Privacy.
5. Add your own Google email to `FOUNDER_EMAILS` if you want the founder panel on your account.
6. Go live on Razorpay (real keys) once the test payment works.

## B. Not tested on real systems yet (need your phone test)
1. Real iPhone: camera orientation, calendar fit, share sheet, add to home screen, stay signed in.
2. Real Android: same, plus tap vibration and the install prompt.
3. Real Supabase sync across two phones (tales, photos, voice notes).
4. Real Razorpay payment, cancel, and a failed payment.
5. Push reminders arriving on a phone.

## C. Ideas for later (not started)
- Instagram-style share of the Day 7 video.
- A short "what's new" note after updates.
- Streak reminder nudge in the evening if today is empty.

## D. Feedback from your testing
(add here)

## E. Records to keep (do not delete)
Google Search Console ownership of littletales.me is verified by two DNS TXT records in Cloudflare (DNS, Records). They are public, not secrets. Keep both:
- google-site-verification=xwQ-ypabYn0zwjmthT3rkRsPJpvW8WIi9IFd4nSw1ok
- google-site-verification=0OneKxtx9o4lGZCZuTKwsntHJ_CNWNCFzE9In-ZhW6s
Verified with the founder's personal Google account. Add the business email as a second owner (Search Console, Settings, Users and permissions) as a backup.
Microsoft Clarity project id: yzzxnf3q1w (installed in js/analytics.js; app content is masked).

## To review later (asked by the founder)
- Review the Terms and Privacy pages: https://littletales.me/terms and https://littletales.me/privacy (drafts in docs/legal/).
- Shorter sign-in code: Supabase allows 6 to 10 digits only (not 4 or 5). Done: moved 8 -> 6 by changing Supabase (Authentication, Providers, Email, Email OTP Length) to 6 AND `CODE_LENGTH` in js/config.js to 6 at the same time.

## Status on 23 October 2026 (end of day)
Live on littletales.me: redesign, filters, camera mirror rule, in-app Terms and Privacy, Festivals (Diwali) stickers, daily prompts, week video with 5 original tunes, Dodo test-mode payments (checkout, webhook, cancel, member celebration), Sentry error reports, link preview image, robots.txt and sitemap.

Still open (founder):
- Full phone test, reminders test on an iPhone Home Screen app, Sentry real-error test, reminder cron check (`cron.job_run_details`).
- Dodo LIVE mode: live API key (Checkout Sessions, Subscriptions, Products, Customers = Write), two live products, live webhook + signing secret, then set DODO_API_KEY, DODO_PRODUCT_MONTHLY, DODO_PRODUCT_YEARLY, DODO_WEBHOOK_SECRET and DODO_ENV=live in Supabase.
- Final prices (and whether other countries get local prices). Prices on screen live in js/account.js (PLANS) and must match Dodo.
- Legal review of Terms and Privacy (docs/legal). Photo licences for assets/photos/e-*.jpg (Unsplash).
- Custom email sender (Resend) in Supabase; Supabase plan and backups.
- Optional: OPENAI_API_KEY secret for in-app voice typing (function `transcribe` is deployed); Google client ID.

Notes for whoever deploys:
- Never replace the VAPID (reminder) keys: tools/deploy-server.mjs now leaves existing ones alone.
- The database role `service_role` needed explicit grants (see the SQL run on 22 Oct); new tables need them too.
- Razorpay code is still in the repo but unused (PAYMENT_PROVIDER = 'dodo' in js/config.js).
