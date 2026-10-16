# Little Tales: progress notes

Written in plain words for the founder. Updated at the end of each working session.

---

## FOUNDER TO-DO (in order of importance)

**1. Fix the GitHub connection. This is the one blocker. Free, 5 minutes.**
I still cannot save the code to GitHub. Your repo `anushkamittal2027-commits/Anushka-Mittal--Little-Tales` says "not found" for me, because this session is connected to a different account (`ishanihanda1709-debug`).
1. Open https://claude.ai/connect-github.
2. Connect the GitHub account that owns the repo (`anushkamittal2027-commits`).
3. Install the **Claude** GitHub App on that repo when GitHub asks.
4. Start a new Claude Code session with that repo selected, and tell me. I will push everything.
(If easier: tell me and I will use a new repo under the account that is already connected.)

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

### Polish
- Glass look across all screens, smooth screen transitions, calm animations (and they switch off for people who ask their phone for reduced motion).
- Offline support, a splash screen, a Home Screen shortcut ("Make today's stamp"), small thumbnails for fast lists, swipe left or right to change month, a little vibration on the shutter and on posting.
- Pinch-to-zoom is allowed, keyboard focus is visible, buttons are labelled for screen readers.
- If the browser blocks storage, the app still works for that visit instead of showing a blank screen.

### Prepared for going online (not switched on yet)
- `supabase/migrations/001_init.sql`: database tables, the free-week rules decided on the server, **3-a-day enforced by the database**, **locked members cannot read their tales**, private photo and voice storage. Syntax checked.
- `supabase/functions/*`: nudges at about 1pm and 8pm in each member's own time zone (skipping 8pm if they kept a tale), 7-day and 1-day warning emails, permanent deletion after 30 days, Razorpay subscription and webhook, delete-account. Syntax checked, **not yet run against a live project**.
- `docs/legal/`: plain-words drafts of the Privacy Policy and Terms. **Drafts for a lawyer to review, not legal advice.**
- `docs/BACKEND_PLAN.md`: exactly what I need from you and what I do with each piece.

---

## What is NOT done yet, honestly

| Item | Why | Needs |
|---|---|---|
| Login (Google and email code) and saving online across phones | Needs a server | Supabase and Google accounts |
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

## Questions for Ishani

1. Which GitHub account owns the repo? (To-do 1.)
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
