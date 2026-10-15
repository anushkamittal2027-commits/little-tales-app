# Little Tales: Progress notes

Last updated: end of the first overnight session. Stages 1 and 2 are built. I stopped before Stage 3, as you asked.

---

## FOUNDER TO-DO (do these first)

**1. Try the app on your phone. Free, 5 minutes.**
Open this link on your phone (you must be signed in to claude.ai, and only you can open it):
https://claude.ai/artifact/E8sjX24Lg5ER3Z29wHJQS3

Walk through it once:
- Tap **Start my album**, then **Make today's stamp**.
- Choose **From your gallery**, pick a photo and choose the day.
- Type a thought, pick a light, and watch the stamping.
- Add a few stickers and tape. Drag them, use the round corner handle to resize and turn, and tap the red X to delete.
- Tap **Post to my calendar**.
- Make 3 tales today, then try a 4th. You should see the gentle "You've kept 3 little tales today" message.

What does not work in this preview link (this is a limit of the preview, not a fault in the app):
- The **in-app camera** and **voice recording** are blocked by the claude.ai preview. In the preview, "Take a photo" opens your phone's own camera instead, and you can type your thought. Both work fully once the app is on its own web address (Stage 3 and later).
- The preview keeps its tales only on that phone and browser.

**2. Fix the GitHub connection. Free, 5 minutes. This matters.**
Right now I cannot save the code to GitHub, so the only copies are inside the temporary cloud session and the preview link. Your repo link (`anushkamittal2027-commits/Anushka-Mittal--Little-Tales`) says "not found" for this session. The GitHub account I'm connected to is `ishanihanda1709-debug`, which is a different account, so the repo is probably private to the other account.

Please do this:
1. Open https://claude.ai/connect-github.
2. Connect the GitHub account that owns the repo (`anushkamittal2027-commits`). If the page offers a choice of accounts, pick that one.
3. If it asks, install the **Claude** GitHub App on that repo (or ask the account owner to).
4. Start a new Claude Code session with that repo selected, and tell me. I'll push everything that exists so far. All the work is saved as files, so nothing is lost.

If you would rather use a new repo under the `ishanihanda1709-debug` account, tell me and I'll do that instead.

**3. Review the look and give feedback. Free.**
Open the screenshots in `docs/screenshots/` (they are named in journey order, `00-welcome.png` onwards) or use the preview link. Tell me what to change: colours, wording, artwork, spacing, anything.

**4. Answer the questions below.**

**5. For Stage 3 (next, after your OK). Nothing to do yet.**
When you say go, I'll ask you to create three free accounts, one step at a time, all with hellolittletales@gmail.com:
- **Supabase** (login, database and photo storage)
- **Google Cloud** (for "Continue with Google")
- **Cloudflare** (hosting on your own domain)

None of them costs anything to start.

---

## Done

Everything below is built and tested on a phone-sized screen. There were no errors in the tests.

**Stage 1: look and feel**
- Colours, fonts (Fraunces, Courier Prime, DM Sans) and the one-button-per-screen rule from the brief.
- The classic perforated stamp, with Morning, Golden hour and After dark lights.
- The red postmark with the date, drawn as artwork.
- 8 original sample photos: chai on a windowsill, rooftops at sunset, balcony flowers, a bookshop, rain on a window, a small red boat, mangoes at a market, and a cat watching the moon.
- Decoration artwork: 4 washi tapes, 8 stickers (sun, star, heart, chai cup, flower, airmail envelope, "with love" label, arrow) and 4 doodles.
- A Home Screen icon, so the app can be added like a real app.

**Stage 2: the main journey**
1. Welcome screen (first time only): "Your camera roll forgets. Your album won't."
2. Calendar: the first stamp of each day as the cover, dots for how many tales (●●○), today highlighted, **Make today's stamp**.
3. Add a moment: **Take a photo** (in-app camera) or **From your gallery**, with "Which day is this from?" for gallery photos.
4. Add a thought: hold the mic to record (live waveform), or type up to 140 characters.
5. Frame it: pick a light, add a title, or **Skip for now**.
6. Stamping: the photo develops and the postmark presses on, in under 2 seconds.
7. Decorate: bottom tray with Tape, Stickers and Doodles. Drag, resize, turn and delete. **Done decorating** or **Skip for now**.
8. Tale ready: preview, **Post to my calendar**, then the toast "Posted to your calendar".
9. Day view (1 to 3 tales side by side) and tale view with voice player, **Decorate**, and a menu to edit the thought, edit the stamp, retake the photo or delete.
- The **3-tales-a-day rule**: the 4th attempt shows the gentle message and does not open the camera. Deleting a tale frees the slot. Every 4th attempt is counted for you.
- **Founder panel**: tap the Little Tales logo on the calendar 5 times. It shows the number of 4th-tale attempts and has buttons to reload or remove the sample tales and to delete everything.
- 12 sample tales, some decorated and 3 with a sample voice note, so the calendar looks lived-in.
- Everything is saved on the phone for now. Online saving and login come in Stage 3.

---

## Decisions I made for you (say yes, or tell me to change them)

1. **Photos are cropped to the stamp shape** (portrait, 4 by 5, centre of the photo). A wide landscape photo loses its sides. Alternative: let people slide the photo inside the stamp. (Stage 3 or later.)
2. **A tale can be photo-only.** A voice note or a line of text is optional, so nobody feels homework pressure.
3. **Voice notes are up to 60 seconds.**
4. **The calendar starts on Sunday.** I can switch it to Monday.
5. **"Make today's stamp" takes two taps to reach the camera** (button, then Take a photo), following the journey in the brief. I can make it one tap if you prefer.
6. **I added a welcome screen**, which was not in the brief. It uses your line "Your camera roll forgets. Your album won't."
7. **The sample tales are there on first open** so the screens look real. I'll remove them when real accounts arrive in Stage 3.
8. **Future days are greyed out and locked**, and gallery photos can only be tagged to today or earlier.
9. **The 4th-tale count is stored on the phone for now**, shown only in the founder panel. In Stage 4 it moves online so you can see it across all users.
10. **The app keeps working if the browser blocks storage**, for that visit only, so it never shows a blank screen.
11. **Hosting for now is the private preview link.** I did not set up GitHub Pages or Cloudflare, because both need your GitHub connection (To-do 2) first.
12. **Wording of the 4th-tale message** is exactly as in the brief: "You've kept 3 little tales today. Come back tomorrow for more."

---

## Questions for Ishani

1. Do you like the stamp, postmark and sticker artwork, or should any of it change?
2. Is "Golden hour" a good default look for the stamp photos? It adds a warm tint.
3. Should the postmark sit over the bottom corner of the stamp as it does now, or be smaller or in a different spot?
4. Calendar: Sunday or Monday first?
5. Should the camera really be one tap from the calendar (see decision 5)?
6. Should the welcome screen stay?
7. Which GitHub account owns your `littletales` repo? (See To-do 2.)

---

## Next

Once you reply (and fix GitHub), I'll:
1. Apply your feedback on Stages 1 and 2.
2. Push everything to your GitHub repo.
3. Set up free hosting with Cloudflare Pages so you have a permanent link where the camera and voice recording work.
4. Start **Stage 3: accounts and saving** (Google and email login, online storage, the Account section) and ask for your OK before moving on after each stage.

---

## For whoever works on this next (technical)

- No build step is needed to run the app: serve the folder with any static server (`python3 -m http.server`) and open `index.html`. Plain JavaScript modules, no framework.
- `js/store.js` is the only file that knows where tales are kept (browser storage today). Stage 3 swaps it for Supabase. The rest of the app calls the same functions.
- `js/art.js` holds all artwork, `js/stamp.js` draws stamps and pages, `js/decorate.js` is the decorating editor, `js/screens.js` has every screen, `js/nav.js` is the router.
- `npm install` then `npm run build:preview` makes `dist/little-tales-preview.html`, one self-contained file used for the private preview.
- Test screenshots in `docs/screenshots/` were made with a phone-sized (390 x 844) headless browser.
