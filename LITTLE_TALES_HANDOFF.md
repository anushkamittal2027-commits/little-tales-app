# LITTLE TALES: COMPLETE PROJECT HANDOFF

Paste this whole document into a new Claude chat as the first message. Later, give the same document to Claude Code so it can build without confusion.

---

## 0. ABOUT ME (THE FOUNDER) AND HOW TO WORK WITH ME

- I am from a non-technical background. I cannot build technical things myself.
- Explain everything in plain words. No jargon, or explain it simply when it is unavoidable.
- I want to build this app end to end, as a **real product to launch**, not a demo. This is a serious business.
- **Free tools first.** I do not want to buy software. I can download free software. I already have: a private GitHub repo named `littletales`, GitHub Copilot, Node.js, and Vercel (used for the current reference page).
- The one thing I will buy is a **domain name**.
- **How we work:** the work is done in stages. After each stage, explain what was done in plain words, show me, and **wait for my OK before moving to the next stage**. I want everything exactly right before moving on.
- Ask me any question you have, even the smallest. If I say "you decide", pick the best option and tell me what you chose.
- You create all artwork (stickers, tape, doodles, sample photos) yourself. I will review and ask for changes.

---

## 1. WHAT THE APP IS

**Little Tales** is a web app first (mobile-first, works in the phone browser; **browser only for now**, with iOS and Android apps later). It turns everyday moments into a keepsake scrapbook.

When something catches your eye on the go, you open the app, take the photo there and then, and record what you're thinking as a quick voice note or a line of text. If you didn't get the chance in the moment, you can upload a photo from your gallery later, whenever you're free. Each photo becomes a postage-style stamp, dated, placed on its own scrapbook page (**up to 3 a day**) that you can decorate with stickers, washi tape and doodles, and saved to a calendar that slowly becomes a scrapbook of your life.

- Tagline: "Photos into memories." / "Turn little moments into memories."
- Live design reference: https://little-tales-vercel.vercel.app/ (match its look and flow; where it conflicts with this document, this document wins).
- App name is final: **Little Tales**. Language: **English only**.

## 2. WHO IT'S FOR

Anyone on the go who notices small moments in their day, takes lots of photos, but never looks back at them. They want to catch a moment while it's happening, with how it felt, in under a minute and with one hand, without it feeling like journaling homework. When they have free time, they enjoy decorating their pages.

## 3. TWO WAYS TO CAPTURE

1. **In the moment (main way):** open the app, take the photo with the in-app camera, then record a voice note or type a thought straight away. Fast and one-handed.
2. **Later, when free (backup):** upload a photo from the gallery, then add the thought. The user chooses which day the tale belongs to ("Which day is this from?", today by default).

Both routes lead to the same steps from there.

## 4. CORE JOURNEY (SCREEN BY SCREEN)

1. **Calendar (home):** a month calendar where each day with tales shows its **first stamp as the cover**, plus small dots for how many tales that day has (for example ●●○ means 2 of 3). Today is highlighted. Button: "Make today's stamp". The camera is one tap away.
2. **Add a moment:** "Take a photo" (in-app camera, the bigger default option) or "From your gallery".
3. **Add a thought:** hold to record a voice note, or type a short line (max 140 characters). Button: "Make it a stamp".
4. **Frame it (optional, skippable):** one classic rectangular stamp shape with perforated edges (no other shapes for now). Pick a light (Morning / Golden hour / After dark, with Golden hour pre-selected) and add a title.
5. **Stamping:** a short animation (under 2 seconds) where the photo "develops" and a red postmark presses on with the date.
6. **Decorate your page (optional, skippable):** drag on stickers, washi tape and doodles; move, resize, rotate or delete them. Buttons: "Done decorating" or the text link "Skip for now".
7. **Tale ready:** preview the finished page. Button: "Post to my calendar".
8. **Success:** back on the calendar with the new stamp on today's date and the toast "Posted to your calendar".
9. **Day and tale detail:** tap a date to see that day's tales (1 to 3) side by side, then tap one to revisit its page, photo, thought and voice note, with a "Decorate" link to change decorations later.

## 5. DAILY LIMIT: UP TO 3 TALES A DAY

- A user can make up to 3 tales a day. Each tale is its own scrapbook page with its own stamp, thought, voice note and decorations.
- The limit is the same for trial and paying users. It is a design choice, not a paid feature.
- Never delete or replace a tale to make room. There is no swap.
- If the user tries to make a 4th tale, show a gentle message: "You've kept 3 little tales today. Come back tomorrow for more." Do not open the camera.
- Users can still edit a tale (retake the photo, change the text or decorations) or delete one deliberately from its page.
- **Deleting a tale on purpose frees its slot** (make 3, delete 1, you can make another).
- **A day ends at midnight (11:59pm) in the user's own time zone.**
- The limit counts against the day the user tags the tale to, so nobody can fit unlimited tales into one day.
- If the first tale of a day is deleted, the next one becomes that day's cover.
- **Record each time someone tries to make a 4th tale in a day.** This is visible **only to me, the founder, in the back end** as a data point to review the limit later. It is not visible to users.

## 6. DECORATION SET (KEEP IT SMALL)

- Washi tape: 4 strips. Stickers: about 8 original hand-drawn ones (sun, star, heart, chai cup, flower, airmail envelope, "with love" label, arrow). Doodles: about 4.
- One bottom tray with tabs: Tape, Stickers, Doodles. No more than about 8 options visible at once.
- All original artwork. No brand logos, famous characters or copyrighted art.

## 7. FREE TRIAL, WEEKLY VIDEO AND PAYWALL

- **Days 1 to 7:** everything is free and unlocked. No card or payment details needed to start. **Day 1 is the day the user first signs in.**
- **Nudges (real, not simulated):** at least **2 gentle nudges a day**, spread through the day (for example around 1pm and 8pm), such as "Anything worth keeping today?". Encourage users to add the app to their Home Screen. WhatsApp can come later.
- **Day 7:** a curated **real "Your week" video** of that user's tales (stamps, thoughts, a few voice snippets) from up to 21 tales, shown on Day 7 whatever weekday they started.
  - **At least 1 tale is needed to get a video; with no tales there is no video.**
  - **Full video** if the user has made **7 or more** tales.
  - **Soft version, "Your week, in 3 little tales."**, if they made **1 to 6** tales.
  - We nudge users to add a tale every day.
- **Straight after the video:** the paywall, "Keep your tales going."
  - Monthly: Rs 149 + GST
  - Yearly: Rs 999 + GST (shown as about Rs 83 a month, the highlighted, recommended option)
  - One plan, everything included. No tiers, no add-ons.
  - Prices are shown exclusive of GST, with 18% GST added at checkout.
- **If they don't pay by the end of Day 7:** the calendar locks. They cannot open the calendar or any tale. They see only a locked screen: "Your week is waiting. Subscribe to unlock it." with how many tales are saved and how many days are left.
- Their tales are held for **30 days**. Send reminders with **7 days left** and **1 day left**. If they subscribe within the 30 days, everything comes back exactly as it was. After 30 days, the tales are **permanently deleted** (automatically).
- Explain this rule clearly at signup, so no one is surprised.
- **Payments:** Razorpay with UPI Autopay and cards for monthly and yearly. Build and test in Razorpay's free practice (test) mode first, then go live once the business details are ready.
- **Subscribers get a "Your week" video every Sunday.**

## 8. PHYSICAL SCRAPBOOK (NOT IN THIS BUILD)

Printed scrapbooks will be paid per order later, through a print partner. Not part of the subscription. Do not build this now; at most show a "Coming soon" note.

## 9. LOOK AND FEEL

- Mood: nostalgic, personal, playful. A stamp album at golden hour.
- Colours: Film Cream `#FAF3E8` (background), Postal Red `#C4472F` (buttons, postmarks), Ink Plum `#3E2F3C` (text), Apricot Glow `#F2A66B` (highlights, voice waveform), Kraft `#B98B5E` (perforations, borders)
- Fonts: Fraunces (titles), Courier Prime (dates and postmarks), DM Sans (UI)
- One primary button per screen, and the stamp is always the hero. Big thumb-friendly controls near the bottom. Motion is calm crossfades; stickers can land with one soft settle, but nothing bounces or loops.

## 10. VOICE (TONE OF THE WORDS)

Warm, unhurried, lightly postal. Key lines: "Today counts.", "Posted to your calendar", "Your camera roll forgets. Your album won't.", "Keep your tales going.", "Your week is waiting."

## 11. PRIVACY

- Private by default: no public profiles, feed or sharing in this build.
- Voice notes and thoughts are never used for ads.
- Users can download or delete their scrapbook while subscribed.
- Photos, voices and phone numbers are personal data. A privacy policy and terms of use are needed before launch, and users should give clear consent at signup.

## 12. DECISIONS ALREADY MADE

| Topic | Decision |
|---|---|
| Goal | A fully working app to launch. Real users, real data, real payments. Not a demo. |
| Platform | Phone-browser app only for now (mobile-first). iOS and Android later. |
| Login | **Phone number** (text-message code). A user can log in from any phone and see their tales. |
| Saving | Photos, voice notes and tales are saved online, so they work across devices. |
| Nudges | Real, at least 2 a day. Plus 7-day and 1-day deletion warnings. |
| Video | Real video, not a simple slideshow. |
| Artwork | Claude creates all of it. I review and give feedback. |
| Trial start | Day 1 = first sign-in. |
| Name / language | Little Tales / English only. |
| Domain | I will buy one. The Vercel address will not be used publicly. |
| Day boundary | Midnight in the user's own time zone. |
| Delete frees slot | Yes. |
| Backdated photos | User chooses the day. Limit counts against the chosen day. |
| 4th-attempt data | Founder-only, in the back end. |
| Video rules | 0 tales = no video, 1 to 6 = soft video, 7 or more = full video. |
| Work style | Stages; explain simply; ask me first; get it exactly right before moving on. |

## 13. PROPOSED FREE-FIRST SETUP (PLAIN-WORDS SUMMARY)

These are recommendations from the planning chat. Confirm each one before building.

- **Hosting:** Vercel's free plan does not allow commercial use, so use **Cloudflare Pages** (free, allows businesses) and connect my domain. Staying on Vercel would cost about $20 a month.
- **Login, database and file storage:** **Supabase** free plan. It handles phone login, saved tales, and photo and voice storage. The free allowance is about 1GB. Photos and voices will be shrunk automatically, which should hold roughly 3,000 tales. When we outgrow it, paying users will cover the upgrade.
- **Phone login codes (OTP):** this is the hardest thing to get completely free in India. A small free monthly allowance may exist, but after that each code costs a few paise, and SMS in India needs a one-time registration. Claude should check the exact current free allowance and costs before building it, and tell me.
- **Reminders:** SMS and WhatsApp cost money, so start with free **phone notifications** (users add the app to their Home Screen) and **email** (ask for an optional email at signup). WhatsApp later.
- **Real video:** built on the user's own phone when they open their Day 7 or Sunday video, then saved. This keeps it free. A nudge tells them it is ready. Making it on a server for every user would cost money.
- **Payments:** Razorpay is free to join and charges a small percentage per payment. It needs a registered business, a bank account and ID checks. Use its free test mode while building.
- **Automatic tasks:** the 30-day deletion, the nudges and the warnings run on a schedule in the background (a free scheduler such as Supabase scheduled jobs).

## 14. BUILD STAGES (EACH ENDS WITH MY OK)

1. **Look and feel:** colours, fonts, stamp design, a few key screens to react to.
2. **Main journey:** calendar, camera, voice or text, stamping, decorating, preview, posting, day and tale views.
3. **Accounts and saving:** phone login and online storage.
4. **Trial rules:** 3 a day, the 7-day trial, locked screen, 30-day hold and automatic deletion, founder-only data on 4th attempts.
5. **Reminders:** 2 nudges a day plus the 7-day and 1-day deletion warnings.
6. **Video:** the Day 7 and Sunday "Your week" video.
7. **Payments:** Razorpay, test mode first, then live.
8. **Launch:** domain, privacy policy, terms, consent screens and final checks.

## 15. STILL OPEN (NEEDS MY ANSWER)

1. Is there anything on the current Vercel reference page I want changed, or is it the finished design to match?
2. Am I OK with phone-number login, knowing a small cost starts once there are many users?
3. Are phone notifications plus email fine for reminders for now, with WhatsApp later?
4. Do I have a registered business and GST number ready for Razorpay? (Not needed to start building, needed before real payments.)
5. Confirm the video rule in section 7 (0 = none, 1 to 6 = soft, 7+ = full).

## 16. NOT IN THIS BUILD

Printed scrapbooks, geotagging, music on pages, slideshow reviews beyond the weekly video, weekly highlight curation, extra stamp shapes, social or sharing features, AI captions, streaks.

**Avoid:** journaling-app pressure, heavy vintage textures across the screens, Instagram-style filter tools, cluttered layouts, huge sticker libraries.

## 17. NEXT PHASE (CONTEXT ONLY, DO NOT BUILD)

Physical printed scrapbook (paid per order), curated slideshow reviews of the month and year, weekly highlight (pick favourite stamps and curate your own scrapbook), geotagging of places, music to match the vibe of a page, iOS and Android apps.

---

## 18. MESSAGE TO PASTE INTO THE NEW CLAUDE CHAT

"Hi Claude. I'm a non-technical founder building a real app called Little Tales. The full project document is above. Please read all of it. Then (1) tell me back in simple words what you understood, (2) ask me about anything unclear, starting with the open questions in section 15, and (3) help me finish the plan, including a simple list of what I need to set up myself (accounts, domain, business details) and what each costs. When we're done, produce one clean final brief that I can give to Claude Code to build. Always use plain words, keep to free tools where possible, and tell me clearly when something will cost money."
