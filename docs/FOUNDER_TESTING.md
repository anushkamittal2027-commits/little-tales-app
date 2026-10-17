# Things only you can do or test (Founder list)

Kept up to date by Claude. Tick them off and tell me the result. Never paste passwords, the Razorpay secret, the Google client secret or the Supabase service_role key in chat.

## Done
- [x] Supabase project created, URL and anon key shared, `001_init.sql` and `003_grants.sql` run.
- [x] Google Cloud project, consent screen, Test users added.

## Do now (1 minute): security and editing fixes in the database
Supabase SQL editor (https://supabase.com/dashboard/project/vnorlnjsvknhsvjfczyl/sql/new): paste the contents of `supabase/migrations/005_security_fixes.sql` and Run. It stops members from editing their own free-week dates, lets people edit a tale on a day that already has 3, and avoids false "future date" refusals for travellers.

## Earlier (1 minute): allow the "Original" light in the database
Supabase, SQL editor (https://supabase.com/dashboard/project/vnorlnjsvknhsvjfczyl/sql/new), paste the contents of `supabase/migrations/004_light_none.sql` and Run. Until then a tale kept with "Original" is saved online as Golden hour (it still shows Original on the phone that made it).

## Status log
- [x] Google sign-in works on localhost (fixed by re-saving the Google Client ID and a new Client secret in Supabase).
- [ ] **Later (founder said OK to do it later): new-phone test.** Open the app in a Chrome Incognito window, sign in with Google again: the tale you posted should come back. Also check Supabase Table Editor `tales`, `profiles` and Storage `photos`.
- [x] Online saving confirmed by founder: rows in `tales` and `profiles`, files in Storage `photos`.
- [x] Mic, "Speak instead of typing", new stickers and speed: founder says all perfect.
- [ ] Optional: give Claude network access to `vnorlnjsvknhsvjfczyl.supabase.co` and a `SUPABASE_ACCESS_TOKEN` (environment settings, not chat) so it can test real login itself.

## Where we are right now (hosting and domain)
- [x] App is live at https://littletales.pages.dev (Cloudflare Pages, uploaded by hand).
- [x] Domain `littletales.me` (Namecheap, GitHub Student Pack: usually free for 1 year, then renewal price; set a reminder before it expires). Added to Cloudflare. Cloudflare name servers: `amy.ns.cloudflare.com`, `sergi.ns.cloudflare.com`.
- [ ] **Founder:** sign in to Namecheap through "Sign in with GitHub", Domain List, Manage, Nameservers, Custom DNS, paste the two name servers above, tick to save, DNSSEC off. Then wait for Cloudflare to show Active.
- [ ] **Founder:** Cloudflare, Workers & Pages, littletales, Custom domains, add `littletales.me` (and `www.littletales.me`).
- [ ] **Founder:** Supabase, Authentication, URL Configuration: Site URL `https://littletales.me`, Redirect URLs add `https://littletales.me/**` and `https://littletales.pages.dev/**` (keep localhost).
- [ ] **Founder:** Google Cloud, Branding: homepage `https://littletales.me`, privacy `https://littletales.me/privacy.html`, terms `https://littletales.me/terms.html`, Authorised domain `littletales.me`; Clients, Authorised JavaScript origins `https://littletales.me`; Audience, Publish app.
- [ ] **Founder:** to update the live site after Claude changes the code: Cloudflare, Workers & Pages, littletales, Create new deployment, upload the new `little-tales-site.zip` contents.
- [ ] Later: server jobs. Steps are in `docs/DEPLOY_SERVER.md`.

## Now (about 15 minutes)
1. **Check Google is connected in Supabase.** Authentication, Sign In / Providers, Google: enabled, with the Client ID and Client secret saved.
2. **First live test on your desktop.** Unzip the latest `little-tales.zip`, open a terminal in the folder (type `cmd` in the folder's address bar), run `npm install`, `npm run build:site`, then `npx serve dist/site -l 8123`, open http://localhost:8123 in Chrome.
   - Continue with Google (use an email in your Test users). Tick the box and start the free week.
   - Make a tale (camera, photo, voice or words, decorate, post).
   - Check Supabase, Table Editor: `tales` has a row, `profiles` has your row. Storage: `photos` has your files.
   - Open the app in a private window, sign in again: your tale should come back.
   - Send me screenshots or what you saw, especially anything red or odd.
3. **Allow email codes beyond the free limit** (later, needs Resend): Supabase's built-in email sends only about 2 codes an hour.

## Soon
4. **Cloudflare Pages** (free hosting): sign up at https://dash.cloudflare.com/sign-up, Workers & Pages, Create, Pages, Connect to Git, pick your GitHub repo. Build command `npm run build:site`, output directory `dist/site`. You get an address like `littletales.pages.dev`.
   - Then add that address in Supabase, Authentication, URL Configuration (Site URL and Redirect URLs, with `/**`), and in Google Cloud, Clients, your client, Authorised JavaScript origins.
   - Then in Google Cloud, Branding: homepage = your address, privacy policy = your address + `/privacy`, then Audience, Publish app.
5. **Resend** for email codes and warnings: https://resend.com, create an API key. In Supabase, Authentication, SMTP settings, use Resend's SMTP details. (Needs your own domain to send from your name.)
6. **Reminder keys** (phone notifications): in a terminal run `npx web-push generate-vapid-keys`. Send me the **public** key only. Store the private key in Supabase, Edge Functions, Secrets, as `VAPID_PRIVATE_KEY`.
7. **Deploy the server jobs** (nudges, warnings, deletion, payments): needs the Supabase CLI. I will give exact steps when you are ready; takes about 20 minutes.
8. **Razorpay (test mode)**: https://razorpay.com, create two plans (Monthly Rs 149, Yearly Rs 999), send me the two `plan_` IDs. Keys go into Supabase secrets (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `RAZORPAY_PLAN_MONTHLY`, `RAZORPAY_PLAN_YEARLY`).

## Decisions and details I need from you
- Business or your name and address, and a grievance contact name (for the Privacy Policy and Terms).
- Confirm the app is 18 and over only.
- A lawyer to read `docs/legal/` before launch.
- Your domain (when bought).
- Real photos for sample tales, or keep the generated ones.
