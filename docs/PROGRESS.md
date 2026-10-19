# Little Tales: progress notes

Written in plain words for the founder. Updated at the end of each working session.

---

## FOUNDER TO-DO (in order of importance)

**1. Put the code in YOUR GitHub (this is the one blocker).**
The AI session that built this was signed in to someone else's Claude account, so it could never reach your GitHub, and nothing was pushed to any other account. The code was handed to you as a zip file with its full history.
1. Unzip `little-tales.zip`.
2. Install GitHub Desktop (free): https://desktop.github.com and sign in as **anushkamittal2027-commits**.
3. In GitHub Desktop: **File, Add local repository**, pick the unzipped folder. Then **Repository, Repository settings, Remote**, check it says `https://github.com/anushkamittal2027-commits/Anushka-Mittal--Little-Tales.git`, and click **Publish / Push origin**. (Your GitHub repo must be empty: no README.)
4. For the next stage, start a new Claude Code session from **your own** Claude account and select that repo. Give it `LITTLE_TALES_HANDOFF.md` and `docs/PROGRESS.md` so it picks up exactly where this left off.

**2. Create the free accounts for going online.** Full steps are in `docs/BACKEND_PLAN.md`. All use hellolittletales@gmail.com.
- Supabase (login, saving online, reminders): https://supabase.com. Pick the **Mumbai** region. Send me the **Project URL** and **anon public key** (both safe to share).
- Google sign-in (Google Cloud): https://console.cloud.google.com
- Cloudflare (hosting): https://dash.cloudflare.com/sign-up
- Resend (emails): https://resend.com
- Razorpay (payments, test mode only for now): https://razorpay.com
Never paste passwords or secret keys in chat. I will tell you which screen to put each one in.

**3. Try the app on your phone.** https://claude.ai/artifact/E8sjX24Lg5ER3Z29wHJQS3 (private, only you). Things to try:
- Start: Start my album, the "free week" page, tick the box.
- Tap the **Little Tales logo 5 times** to open the founder panel. Use it to jump to **Day 7 video**, **Locked**, **7 days left**, **After 30 days**, **Subscribed**, and to switch **GST** prices on or off.
- On Day 7, tap **Make my video** and watch your week turn into a real video.
- In the preview, the real camera and microphone are blocked by claude.ai. The camera screen shows a demo scene. Both work fully on your own address.

**4. Decide.** Questions at the bottom of this file.

---

## What is built and tested

Two test suites run the whole app in a phone-sized browser. **59 checks pass, 0 errors** (`tests/e2e.mjs` and `tests/journey.mjs`).

### The stamp journey
- Welcome, then the calendar (pure white, big date, stamps with a cut-out edge, dots for how many tales that day).
- Add a moment: **in-app camera** (bright live view, 3D silver plate with a stamp-shaped window) or **gallery** (with "Which day is this from?").
- Voice note (hold the mic, live waveform) or up to 140 characters of text.
- Frame it (Morning, Golden hour, After dark, title), the **stamping animation**, decorating (4 tapes, 8 stickers, 4 doodles; drag, resize, turn, delete), preview, post.
- Day view (1 to 3 tales), tale view with voice player, edit thought, edit stamp, retake photo, delete.
- **3 tales a day**: the 4th attempt shows the gentle message and is counted for you. Deleting frees the slot. A backdated gallery tale counts against the day you chose.

### The business rules (all working on the phone today)
- **Free week with consent**: a "How your free week works" page with a tick box. Day 1 is the day you start.
- **Day 7**: opens the **"Your week" video** (a real video made on the phone with the stamp scenes, typed-out thoughts, voice snippets and a postmark). 0 tales: no video. 1 to 6: the soft version titled with the real number. 7 or more: the full one.
- **Paywall** ("Keep your tales going."): yearly Rs 999 (about Rs 83 a month, highlighted) and monthly Rs 149. A founder-only switch shows "+ GST" when you register.
- **Practice checkout** (UPI AutoPay or card form, nothing stored or charged).
- **Locked screen** after day 7: "Your week is waiting. Subscribe to unlock it.", how many tales are saved and days left, warnings at 7 days and 1 day left. Every other screen is blocked while locked, except Account and the plans.
- **30-day hold, then automatic permanent deletion.** Subscribing in the 30 days brings everything back.
- **Account**: your plan, cancel, **download your whole scrapbook** (one file with photos, voice notes and words; subscribers only), **delete my account and tales** (always).
- **Sunday video banner** for members.
- **Home Screen and reminders onboarding** (Android install button, iPhone steps, notification permission).

### Stay signed in, and steps for every phone (round 4)
- **Staying signed in:** the app now opens straight from the phone's saved sign-in with no waiting for the network. The Supabase library renews it in the background and keeps it on a weak signal (this used to be able to leave a blank screen). If the login is ever revoked the member is sent to sign in with a plain message. `tests/persist.mjs` runs the real library against a pretend server: reload, expired token, and a failing refresh all keep the member in.
- **One address:** visitors arriving on the old free `littletales.pages.dev` address are moved to `https://littletales.me`, because the saved sign-in belongs to one address.
- **Add to Home Screen steps now match the phone:** iPhone Safari, iPhone Chrome/Edge/Firefox, iPad, Android Chrome (one-tap install button when the browser offers it), Samsung Internet, Android Firefox, desktop, and in-app browsers (Instagram, WhatsApp and so on, which cannot add shortcuts: it tells people to open in the browser).

### Home screen shortcut and bigger day view (round 3)
- A real website cannot make the live "widget" tiles (that needs an App Store or Play Store app). It now makes a proper **home screen shortcut**: new brand icon (regular, maskable and Apple touch icon), full-screen standalone mode, a dismissible "Add to Home Screen" card on Home and a row in Account with the exact steps for iPhone and Android.
- iPhone note: the icon opens in its own storage, so the member signs in **once** inside it; after that the session is kept (and the phone is asked to protect it from clearing).
- Day view: all of the day's stamps are shown together (no swiping): one tale about 285 px wide, two or three about 200 px, overlapping slightly like a pile of stamps.

### Phone-testing fixes (round 2)
- **Calendar cut off on iPhone:** the grid columns could grow wider than the phone (Safari), pushing Saturday off-screen. Columns are now fixed to the phone width, and the experimental render-skipping rule that triggered it was removed. Tested at 320 to 430 px wide.
- **"Stamp on the wrong date":** the date logic was audited and tested in India, US Pacific and New Zealand around midnight: stamps are always kept on the local day. What happened on the phone is that Saturday (today) was the hidden column; the visible stamp was yesterday's.
- **Front camera preview:** the stamp window now shows a canvas of the raw camera frame, the same frame and crop that is saved, so the preview and the photo can never differ in orientation. Tested by comparing the two.
- **Voice typing:** clear reasons per failure (phone dictation switched off, browser blocking microphone, no speech support) and a built-in fallback that puts the cursor in the box and points to the keyboard's own microphone key. Real iPhone behaviour still needs your confirmation.
- **Pick a light:** a new "Original" choice (no effect) sits first, and tapping the chosen light again clears it. Needs `004_light_none.sql` in Supabase.
- **Decorate and Ready screens:** the stamp is the hero (about 55 to 75% of the height); the tools are a compact dock with one swipeable row.
- **Posting:** soft chime (follows the silent switch) and a little buzz, with an on/off switch in Account.
- **Sign-in speed:** the code screen opens instantly while the email is sent; after the code, only the tiny account lookup is awaited (two requests in parallel) and photos download in the background. Real email delivery time still depends on Gmail (a few seconds) until Resend is set up.
- Tests: `tests/fixes.mjs`.

### Feedback round 1 (done)
- **Mobile web app only**: the "install" screen and the "Add to Home Screen" row are gone. It runs in the browser. Notifications are an optional switch in Account.
- **Home screen** (new): greeting, make today's stamp, your memories, tiles for Calendar, Scrapbook studio, Your week, Settings. A bottom tab bar (Home, Calendar, New, Studio, Me). First-time members see a 3-card welcome tour; returning members land on Home.
- **Subscription**: "Download my scrapbook" now opens a clear "See plans" step instead of a dead end.
- **Speed**: the app opens from the phone's own copy and syncs in the background (it used to wait for the server before showing anything); lighter glass effects and shorter screen transitions.
- **Microphone**: tap to start and tap to stop (the old hold-to-record gesture broke when the browser asked for permission). New **"Speak instead of typing"** button turns speech into editable text (Chrome and Safari). Clear messages when the microphone is blocked, missing or in use.
- **Sign-in errors** from Google or Supabase are now shown on the sign-in screen instead of silently sending you back. A Google return also signs you in even if the page loaded before the session was ready.
- Tests: `tests/e2e.mjs`, `tests/journey.mjs`, `tests/online.mjs`, `tests/voice.mjs`.

### Online saving and real sign-in (built, waiting for your first live test)
- `js/sync.js`: every tale, photo, voice note and the free-week dates are saved on the phone first, then sent to Supabase when there is a connection (an "outbox" retries if offline). A new phone signs in and gets everything back. Deleting removes the files online too. A different person signing in on the same phone never sees the previous person's tales. Sign out clears the phone.
- Tested against a pretend Supabase (`tests/online.mjs`, 17 checks, including 3-a-day enforced by the "server", offline-then-online, new phone, sign out). **Not yet tried against your real Supabase** (this build session cannot reach it): your first real sign-in is the live test.
- `npm run build:site` makes the real website in `dist/site` (for Cloudflare Pages), including `/privacy` and `/terms` pages made from the drafts in `docs/legal/` (drafts: placeholders like [date] and [address] must be filled and a lawyer should review).
- Your Supabase project is connected (`js/config.js`); database files `001_init.sql` and `003_grants.sql` were run successfully.

### Sign-in (practice mode)
- Welcome, then **Sign in** (Google button, or email and a 8-digit code), then the free-week page. Account shows your email and **Sign out**. Until Supabase is connected it runs in practice mode: any email works and the code is 123456. `js/auth.js` switches to real Supabase login once the keys are in `js/config.js`.

### Polish
- Glass look across all screens, smooth screen transitions, calm animations (and they switch off for people who ask their phone for reduced motion).
- Offline support, a splash screen, a Home Screen shortcut ("Make today's stamp"), small thumbnails for fast lists, swipe left or right to change month, a little vibration on the shutter and on posting.
- Pinch-to-zoom is allowed, keyboard focus is visible, buttons are labelled for screen readers.
- If the browser blocks storage, the app still works for that visit instead of showing a blank screen.

### Prepared for going online (not switched on yet)
- `supabase/migrations/001_init.sql`: database tables, the free-week rules decided on the server, **3-a-day enforced by the database**, **locked members cannot read their tales**, private photo and voice storage. **Tested on a real PostgreSQL 16 with 31 checks** (`supabase/tests/run.sh`): 3-a-day, future dates, privacy between members, free week, lock, 30-day hold, subscribe and restore, private files, account deletion. It has not yet run on a live Supabase project, which needs your Supabase account.
- `supabase/functions/*`: nudges at about 1pm and 8pm in each member's own time zone (skipping 8pm if they kept a tale), 7-day and 1-day warning emails, permanent deletion after 30 days, Razorpay subscription and webhook, delete-account. Syntax checked, **not yet run against a live project**.
- `docs/legal/`: plain-words drafts of the Privacy Policy and Terms. **Drafts for a lawyer to review, not legal advice.**
- `docs/BACKEND_PLAN.md`: exactly what I need from you and what I do with each piece.

---

## What is NOT done yet, honestly

| Item | Why | Needs |
|---|---|---|
| REAL login (Google and email code) and saving online across phones | The sign-in screens are built and work in practice mode (any email, code 12345678). Real login needs a server | Supabase and Google accounts |
| Real nudges and warning emails | Needs the server jobs running | Supabase, Resend, VAPID keys |
| Real payments | Needs Razorpay and a registered business to go live | Razorpay account; business registration later |
| Hosting on your own address, where real camera and mic work | Needs the repo on GitHub and Cloudflare | GitHub fix, Cloudflare, domain |
| Real photographs for the samples | I can't download stock photos from here | Your own photos, or I use the generated ones |
| A real "AI stamp" | There is no AI step: the stamp is made by the app from the photo. An AI step would be a paid service. | Your decision |

## Decisions I made for you (change any)

1. Photos are cropped to the stamp's portrait shape (centre of the photo).
2. A tale can be photo-only; voice and words are optional.
3. Voice notes are up to 60 seconds.
4. Calendar starts on Sunday.
5. The Day 7 video is made when the member taps **Make my video**, takes about 25 seconds, and is kept so it opens instantly next time.
6. The app is for 18 and over (written into the privacy and terms drafts).
7. A member who is locked can still open Account and the plans; nothing else.
8. The founder panel and time-travel only exist on your preview and on `localhost`.

## Questions for the founder

1. Do you have your own Claude account and plan to continue the build in? (To-do 1, step 4.)
2. Is the app 18 and over only? (The privacy draft assumes yes.)
3. Business name and address for the privacy policy and terms, and a name for the grievance contact.
4. Should the Sunday video be for members only? (Currently yes, per your brief.)
5. Do you want me to look for real, free-licence photographs for the sample tales once the repo is connected, or will you supply your own?

---

## For whoever works on this next (technical)

- Plain JavaScript modules, no framework. Serve the folder with any static server and open `index.html`.
- `js/store.js` is the only file that knows where tales live (browser storage today). `js/account.js` holds the trial and subscription logic. Both switch to Supabase in Stage 3 without touching the screens.
- `js/screens.js` (journey), `js/screens2.js` (trial, video, paywall, checkout, locked, account, onboarding), `js/video.js` (canvas + MediaRecorder), `js/zip.js` (download), `js/stamp.js` (cut-out stamp path), `js/decorate.js`, `js/nav.js` (router and guard).
- `css/`: `styles.css` (base), `pop-bg.css` and `pop.css` (colour and stamp), `glass.css` (glass, camera, motion), `screens2.css` (new screens), `premium.css` (an optional calmer look, switched on with `?design=premium`).
- `npm run build:preview` builds `dist/little-tales-preview.html`, a single self-contained file used for the private preview.
- Tests: serve on port 8123 and run `node tests/e2e.mjs` and `node tests/journey.mjs` (Playwright required).

## Delight round (v11)

- Softer touches: a tiny buzz on taps (follows Me > "Sound and vibration"), shimmer placeholders on Home and Calendar while tales arrive, a shimmer on each photo until it loads, gentler screen changes and a soft press-in on buttons and tiles. All of it calms down for people who ask their phone for reduced motion.
- First-tale celebration: confetti plus a warm card with a Share button, shown once per account (`account.celebratedFirst`).
- Streaks: `js/streak.js`. A flame chip on Home from 2 days in a row; it stays alive until the end of the day after the last post. Milestones at 3, 7, 14, 30, 60 and 100 days celebrate once each (`account.milestones`).
- Share as a picture: `js/share.js` draws a 1080x1920 picture (page, stamp, postmark, stickers, signature). Opens the phone's share sheet (WhatsApp, Instagram Stories...) and saves the picture where sharing is not available. Button on the tale screen and inside the celebration.
- Tests: `node tests/delight.mjs`. Journey test now closes the first-tale card.

## Stay signed in + Google button (v12)

- One shared sign-in client (two at once could race to renew the same saved sign-in).
- A backup copy of the saved sign-in is kept in the app's own storage and restored if the phone clears the small note; sign-out removes it.
- A short diary of sign-in events is kept on the phone and shown in "Trouble signing in? Show details".
- Google's own button (shows "Little Tales", not the supabase.co address). Switches on when `GOOGLE_CLIENT_ID` in `js/config.js` is filled in; the older redirect button stays as the backup.
- Supabase dashboard (founder): turn OFF "Detect and revoke potentially compromised refresh tokens" and raise "JWT expiry" to 604800 so an app closed mid-renewal cannot lose its sign-in.
- Tests: `tests/signin.mjs`, plus new backup and sign-out cases in `tests/persist.mjs`.

## Redesign (branch `redesign`)

- New look from the "same backgrounds" design: soft gingham with small drawings around the edges (js/backdrop.js), paper cards, olive pill buttons, Playfair Display / Inter / DM Mono / Caveat (served from assets/fonts), a real perforated postage stamp (css/stamp.css) and a page built on container units.
- Styles are now four files: css/base.css (tokens, buttons, sheets, tab bar), css/stamp.css (stamp and page), css/screens.css (one section per screen), css/decor.css (the decorating tray). The older layered styles were removed.
- Flow changes that came with the design: "Make today's stamp" opens the camera straight away. The camera has a gallery button and a date chip (which day is this moment from); the old "Add a moment" and "Which day" screens are gone. Thought has step dots, the Day view shows every stamp together with previous/next day buttons, Me is a settings list with switches, Locked shows a sealed envelope.
- The share picture, the postmark and the celebration card follow the same look.
- Tests were updated for the new flow. `tests/shots.mjs` takes a picture of every screen.
