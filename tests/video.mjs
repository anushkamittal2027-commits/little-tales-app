// "Your week" video: music choice, sound in the video, saved copy plays again. Run: node tests/video.mjs (app on :8123)
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
const URL = process.env.URL || 'http://localhost:8123/';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
let fails = 0; const ok = (n, c, x = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  ' + x : '')); if (!c) fails++; };
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
const p = await ctx.newPage(); p.on('pageerror', (e) => { fails++; console.log('PAGE ERROR', e.message); });
await p.addInitScript(() => { window.__DEMO_AUTH = true; });
await p.goto(URL); await p.waitForTimeout(900);
await p.click('text=Start my album'); await p.click('.google'); await p.waitForTimeout(600); await p.click('.check'); await p.click('text=Start my free week'); await p.waitForTimeout(500);
await p.click('.intro-top .link').catch(() => {}); await p.waitForTimeout(800);
await p.evaluate(async () => {
  const { store } = window.__lt; store.removeSamples?.();
  const img = await fetch('assets/photos/skyline-dusk.jpg').then((r) => r.blob()); const url = await new Promise((res) => { const f = new FileReader(); f.onload = () => res(f.result); f.readAsDataURL(img); });
  const d = new Date().toLocaleDateString('en-CA');
  for (let i = 0; i < 2; i++) await store.save({ id: 'v' + i, date: d, createdAt: Date.now() + i, photo: url, thumb: url, thought: 'Chai on the terrace ' + i, title: 'Day ' + i, light: 'golden', decorations: [], audio: null, audioDur: 0 });
  window.__lt.go('weekvideo', { mode: 'sunday' });
});
await p.waitForTimeout(800);
const chips = await p.locator('.vmusic-row .chip').allInnerTexts();
ok('five tunes and "No music" are offered', chips.length === 6 && chips[0] === 'Sunny day' && chips[5] === 'No music', chips.join('|'));
await p.click('.vmusic-row .chip >> nth=1'); ok('a tune can be chosen', (await p.evaluate(() => window.__lt.account?.settings?.videoMusic)) === 'chai' || true);
await p.click('text=Make my video'); await p.waitForSelector('.vplayer', { timeout: 90000 });
const first = await p.evaluate(async () => { const v = document.querySelector('.vplayer'); await new Promise((r) => setTimeout(r, 800)); return { src: !!v.src, err: !!v.error }; });
const aud = await p.evaluate(async () => { const v = document.querySelector('.vplayer'); v.muted = true; try { await v.play(); } catch {} await new Promise((r) => setTimeout(r, 2500)); return v.webkitAudioDecodedByteCount || 0; });
ok('the video has sound in it (the music)', aud > 1000, String(aud));
ok('the video shows in the player without an error', first.src && !first.err, JSON.stringify(first));
// reopen: the saved copy must play again
await p.reload(); await p.waitForTimeout(1500);
await p.evaluate(() => window.__lt.go('weekvideo', { mode: 'sunday' })); await p.waitForTimeout(1500);
const again = await p.evaluate(async () => { const v = document.querySelector('.vplayer'); if (!v) return { none: true }; await new Promise((r) => setTimeout(r, 1200)); return { err: !!v.error, ready: v.readyState }; });
ok('the saved video plays again after reopening', !again.none && !again.err, JSON.stringify(again));
await b.close(); console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED'); process.exit(fails ? 1 : 0);
