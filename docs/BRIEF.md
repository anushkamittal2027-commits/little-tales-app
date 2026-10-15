# LITTLE TALES: FULL BRIEF (copy of Part 2 from the founder's final brief)

Every future session should read this file first.

## 0. ABOUT ME (THE FOUNDER) AND HOW TO WORK WITH ME

- I am a non-technical founder. I cannot build technical things myself.
- Explain everything in plain words. Avoid jargon; when a technical word is unavoidable, explain it simply.
- This is a real product to launch with real users, real data and real payments. Not a demo.
- Free tools first. I will not buy software, but I can download free software. I already have: a private GitHub repo named `littletales`, GitHub Copilot, Node.js, Vercel (only used for the old reference page) and an approved GitHub Student Developer Pack.
- My business email for all new sign-ups is hellolittletales@gmail.com.
- I am a student and cannot put money into this. The app must run free until paying users cover any costs.
- Always tell me clearly, before doing it, when something will cost money.
- Work in stages (section 15). Stages 1 and 2 can be built without me, overnight. From Stage 3 onwards, after each stage: explain in plain words what was done, show me, and wait for my OK before moving on. I want each stage exactly right.
- At every stage, tell me clearly what is needed from my side (accounts, clicks, details). I will do it and give it to you.
- Ask me any question, even the smallest. If I say "you decide", pick the best option and tell me what you chose and why.
- You create all artwork yourself (stickers, washi tape, doodles, sample photos, stamp frame, postmark). I will review and ask for changes. All artwork must be original: no brand logos, famous characters or copyrighted art.

## 1. WHAT THE APP IS

Little Tales is a mobile-first web app that works in the phone browser. iOS and Android apps come later. It turns everyday moments into a keepsake scrapbook.

When something catches your eye on the go, you open the app, take the photo there and then, and record what you're thinking as a quick voice note or a line of text. If you didn't get the chance in the moment, you can upload a photo from your gallery later. Each photo becomes a postage-style stamp, dated and placed on its own scrapbook page (up to 3 a day). You can decorate the page with stickers, washi tape and doodles, and it is saved to a calendar that slowly becomes a scrapbook of your life.

- Name (final): Little Tales. Language: English only.
- Taglines: "Photos into memories." / "Turn little moments into memories."
- Design reference: https://little-tales-vercel.vercel.app/ is a style reference only. Wherever it differs from this brief, this brief wins.

## 2. WHO IT'S FOR

Anyone on the go who notices small moments in their day, takes lots of photos, but never looks back at them. They want to catch a moment while it's happening, with how it felt, in under a minute and with one hand, without it feeling like journaling homework. When they have free time, they enjoy decorating their pages.

## 3. TWO WAYS TO CAPTURE

1. In the moment (main way): open the app, take the photo with the in-app camera, then record a voice note or type a thought straight away. Fast and one-handed.
2. Later, when free (backup): upload a photo from the gallery, then add the thought. Ask "Which day is this from?" (today by default).

Both routes lead to the same steps from there.

## 4. CORE JOURNEY (SCREEN BY SCREEN)

1. Calendar (home): a month calendar. Each day with tales shows its first stamp as the cover, plus small dots for how many tales it has (●●○ means 2 of 3). Today is highlighted. Button: "Make today's stamp". The camera is one tap away.
2. Add a moment: "Take a photo" (in-app camera, the bigger default option) or "From your gallery".
3. Add a thought: hold to record a voice note, or type a short line (max 140 characters). Button: "Make it a stamp".
4. Frame it (optional, skippable): one classic rectangular stamp shape with perforated edges (no other shapes for now). Pick a light (Morning / Golden hour / After dark; Golden hour pre-selected) and add a title.
5. Stamping: a short animation (under 2 seconds). The photo "develops" and a red postmark presses on with the date.
6. Decorate your page (optional, skippable): drag on stickers, washi tape and doodles; move, resize, rotate or delete them. Button "Done decorating", or text link "Skip for now".
7. Tale ready: preview the finished page. Button: "Post to my calendar".
8. Success: back on the calendar with the new stamp on its date and the toast "Posted to your calendar".
9. Day and tale detail: tap a date to see that day's tales (1 to 3) side by side, then tap one to revisit its page, photo, thought and voice note. A "Decorate" link lets the user change decorations later.
10. Account section: reachable from the calendar and from the locked screen. Contains: email and sign-in details, subscription status, download my scrapbook (subscribers only), and "Delete my account and tales" (always available, including when locked).

## 5. DAILY LIMIT: UP TO 3 TALES A DAY

- A user can make up to 3 tales a day. Each tale is its own scrapbook page with its own stamp, thought, voice note and decorations.
- Same limit for trial and paying users. It is a design choice, not a paid feature.
- Never delete or replace a tale to make room. There is no swap.
- On a 4th attempt, show: "You've kept 3 little tales today. Come back tomorrow for more." Do not open the camera.
- Users can edit a tale (retake the photo, change the text or decorations) or delete one on purpose from its page. Deleting a tale frees its slot.
- A day ends at midnight in the user's own time zone.
- The limit counts against the day the tale is tagged to (including gallery uploads), so nobody can fit unlimited tales into one day.
- If a day's first tale is deleted, the next one becomes that day's cover.
- Record every 4th-tale attempt. Visible only to me (the founder) in the back end, never to users. It is data for reviewing the limit later.

## 6. DECORATION SET (KEEP IT SMALL)

- Washi tape: 4 strips. Stickers: about 8 (sun, star, heart, chai cup, flower, airmail envelope, "with love" label, arrow). Doodles: about 4.
- One bottom tray with tabs: Tape, Stickers, Doodles. No more than about 8 options visible at once.

## 7. FREE TRIAL, WEEKLY VIDEO AND PAYWALL

- Days 1 to 7: everything free and unlocked. No payment details needed to start. Day 1 is the day the user first signs in.
- Day 7 "Your week" video: a real video (not a simple slideshow) of that user's tales (stamps, thoughts, a few voice snippets), from up to 21 tales, shown on Day 7 whatever weekday they started.
  - 0 tales: no video.
  - 1 to 6 tales: soft version titled with the real number, for example "Your week, in 2 little tales."
  - 7 or more tales: full video.
- Straight after the video: the paywall, "Keep your tales going."
  - Monthly: Rs 149. Yearly: Rs 999 (shown as about Rs 83 a month; the highlighted, recommended option).
  - One plan, everything included. No tiers, no add-ons.
  - GST: I am not GST-registered yet, so for now show flat prices (Rs 149 / Rs 999) with no GST line. Build a single founder-only setting that switches prices to "+ GST" (18% added at checkout) once I am registered. Do not hard-code either option.
- If they don't pay by the end of Day 7 (midnight, their time zone): the calendar locks. They cannot open the calendar or any tale. They see only a locked screen: "Your week is waiting. Subscribe to unlock it.", with how many tales are saved and how many days are left, plus a small link to the Account section.
- Tales are held for 30 days. Send warnings with 7 days left and 1 day left. If they subscribe within the 30 days, everything comes back exactly as it was. After 30 days, the tales are permanently and automatically deleted.
- Explain this rule clearly at signup, with a consent tick box, so no one is surprised.
- Subscribers get a "Your week" video every Sunday (none for a week with 0 tales).
- Payments: Razorpay, UPI Autopay and cards, monthly and yearly. Build and test only in Razorpay's free test mode. Going live needs my business details (section 13); tell me when we reach that point.

## 8. REMINDERS (NUDGES)

- Daily nudges: 2 a day, around 1pm and 8pm in the user's time zone, sent as free phone notifications. Example: "Anything worth keeping today?"
- Skip the 8pm nudge if the user has already kept a tale that day.
- Phone notifications on iPhone only work after the user adds the app to their Home Screen. Onboarding must guide every user to add the app to the Home Screen and allow notifications, in a friendly way.
- Email is used only for: login codes, the 7-day and 1-day deletion warnings, and "your video is ready". Not for daily nudges (the free email plan allows only about 100 emails a day).
- WhatsApp reminders come later. Not in this build.

## 9. LOGIN AND SAVING

- Login: "Continue with Google" (main option) and a one-time code sent by email (backup). Phone-number login is not in this build; it may come later.
- Everything (photos, voice notes, tales, decorations) is saved online, so the user can sign in on any phone and see their scrapbook.
- Shrink photos and voice notes before upload to keep storage and data use low. Keep files saved on the phone after first viewing, so the same photo is not downloaded again each time.

## 10. PHYSICAL SCRAPBOOK (NOT IN THIS BUILD)

Printed scrapbooks will be paid per order later, through a print partner, separate from the subscription. Do not build this now; at most a "Coming soon" note.

## 11. LOOK AND FEEL

- Mood: nostalgic, personal, playful. A stamp album at golden hour.
- Colours: Film Cream #FAF3E8 (background), Postal Red #C4472F (buttons, postmarks), Ink Plum #3E2F3C (text), Apricot Glow #F2A66B (highlights, voice waveform), Kraft #B98B5E (perforations, borders).
- Fonts: Fraunces (titles), Courier Prime (dates and postmarks), DM Sans (interface).
- One primary button per screen, and the stamp is always the hero. Big thumb-friendly controls near the bottom of the screen.
- Motion: calm crossfades. Stickers land with one soft settle. Nothing bounces or loops.

## 12. VOICE (TONE OF THE WORDS)

Warm, unhurried, lightly postal. Key lines: "Today counts.", "Posted to your calendar", "Your camera roll forgets. Your album won't.", "Keep your tales going.", "Your week is waiting."

## 13. PRIVACY AND LEGAL

- Private by default: no public profiles, feed or sharing in this build.
- Voice notes, thoughts and photos are never used for ads.
- Subscribers can download their scrapbook. Any user can delete their account and all tales at any time from the Account section, even when locked.
- Photos, voices and email addresses are personal data. Before launch we need a privacy policy, terms of use and clear consent at signup. Draft these for me in plain words; I will get them reviewed.
- Before real payments I need: a registered business (for example a sole proprietorship), a business bank account, and later GST registration. Tell me when each becomes necessary.

## 14. TOOLS AND SET-UP (FREE FIRST)

| What | Use | Cost |
|---|---|---|
| GitHub (repo `littletales`) | Store the code | Free (I have it) |
| Cloudflare Pages | Host the app (its free plan allows business use; Vercel's free plan does not) | Free |
| Supabase (free plan) | Login, database, photo and voice storage, scheduled jobs | Free. Stay on the free plan. Move to Pro ($25/month) only once subscription income covers it; warn me when storage (1 GB) or downloads (5 GB a month) get close to the limit. |
| Google sign-in | Login | Free |
| Resend (or similar) | Emails: login codes and warnings | Free up to about 100 emails a day |
| Phone notifications (web push) | Daily nudges | Free |
| Razorpay | Payments | Free to join, about 2% per payment; test mode while building |
| Domain name | The app's public address | Check whether my GitHub Student Pack free domain offer fits (ending, terms, renewal price); otherwise I will buy one before launch. The Vercel address is not used publicly. |
| GitHub Student Developer Pack | Building and testing help (for example Copilot) | Free. Its benefits are for non-commercial or educational use, so do not run the live, paid app on student-only plans (such as Appwrite's student plan or Azure student credit). |

- The "Your week" video is made on the user's own phone when they open it, then saved. This keeps it free (making videos on a server for every user would cost money).
- Scheduled background jobs (nudges, warnings, 30-day deletion, trial ending) use Supabase's free scheduler.
- Free backups: the free Supabase plan has no automatic backups, so set up a free nightly backup of the database (for example to a private GitHub repo using GitHub Actions) and a free way to back up photos and voice notes. Explain it to me simply.
- The free Supabase plan pauses after a week with no activity. While building, show me how to restore it with one click.
- Before choosing any other tool, check it is free and tell me if it is not.

## 15. BUILD STAGES (STAGES 1 AND 2 MAY RUN WITHOUT ME; FROM STAGE 3, EACH ENDS WITH MY OK)

1. Look and feel: colours, fonts, stamp design, artwork samples, and a few key screens for me to react to.
2. Main journey: calendar, camera, voice or text, stamping, decorating, preview, posting, day and tale views.
3. Accounts and saving: Google and email login, online storage, Account section.
4. Trial rules: 3 a day, the 7-day trial, locked screen, 30-day hold and automatic deletion, founder-only data on 4th attempts.
5. Reminders: 2 nudges a day (skipping 8pm if a tale was kept), Home Screen guidance, and the 7-day and 1-day deletion emails.
6. Video: the Day 7 and Sunday "Your week" video.
7. Payments: Razorpay test mode, the paywall and the GST setting. Going live later.
8. Launch: domain, privacy policy, terms, consent screens, backups checked, final checks. (Supabase Pro only later, once income covers it.)

For testing, include a founder-only control to jump between trial days, the Day 7 video, the paywall and the locked state, so every stage can be checked without waiting a week.

## 16. NOT IN THIS BUILD

Printed scrapbooks, phone-number login, WhatsApp reminders, geotagging, music on pages, slideshow reviews beyond the weekly video, weekly highlight curation, extra stamp shapes, social or sharing features, AI captions, streaks.

Avoid: journaling-app pressure, heavy vintage textures across the screens, Instagram-style filter tools, cluttered layouts, huge sticker libraries.

## 17. NEXT PHASE (CONTEXT ONLY, DO NOT BUILD)

Physical printed scrapbook (paid per order), curated slideshow reviews of the month and year, weekly highlight (pick favourite stamps and curate your own scrapbook), geotagging of places, music to match a page's vibe, phone-number login, WhatsApp reminders, iOS and Android apps.
