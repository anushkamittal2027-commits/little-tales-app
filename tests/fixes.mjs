// Phone-testing fixes: dates, calendar fit, camera, light, layout, voice fallback, sign-in speed.   node tests/fixes.mjs
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import fs from 'fs';
const URL = process.env.URL || 'http://localhost:8123/';
const CAM = process.env.FAKECAM ? [`--use-file-for-fake-video-capture=${process.env.FAKECAM}`] : [];
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', ...CAM] });
let fails = 0, errs = 0;
const ok = (n, c, x = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  ' + x : '')); if (!c) fails++; };
const gallery = '/home/user/LittleTales/assets/photos/skyline-dusk.jpg';
async function page(opts = {}, init = () => {}) {
  const ctx = await b.newContext({ viewport: { width: 393, height: 670 }, deviceScaleFactor: 2, hasTouch: true, permissions: ['camera', 'microphone'], ...opts });
  const p = await ctx.newPage();
  p.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) { errs++; console.log('  console error:', m.text().slice(0, 140)); } });
  p.on('pageerror', (e) => { errs++; console.log('  PAGE ERROR:', e.message); });
  await p.addInitScript(() => { window.__DEMO_AUTH = true; }); if (init) await p.addInitScript(init);
  return p;
}
async function start(p) {
  await p.goto(URL); await p.waitForTimeout(900);
  await p.click('text=Start my album'); await p.click('.google'); await p.waitForTimeout(600); await p.click('.check'); await p.click('text=Start my free week'); await p.waitForTimeout(400); await p.click('.intro-top .link'); await p.waitForTimeout(400);
  await p.evaluate(() => window.__lt.store.removeSamples());
}
async function galleryTale(p, label = 'hello', { light = null, post = false, deco = false } = {}) {
  await p.click('#tabbar .tab-new'); await p.waitForTimeout(300);
  await p.click('text=From your gallery'); await p.setInputFiles('input[type=file]', gallery); await p.waitForTimeout(700);
  await p.click('.daypick .btn-primary'); await p.waitForTimeout(500);
  await p.fill('.thought-input', label); await p.click('text=Make it a stamp'); await p.waitForTimeout(300);
  if (light) await p.click(`.chip:has-text("${light}")`);
  await p.fill('.title-input', label.slice(0, 20)); await p.click('text=Stamp it'); await p.waitForSelector('.decorate', { timeout: 6000 }); await p.waitForTimeout(500);
  if (deco) { await p.click('.tray-item >> nth=0'); await p.waitForTimeout(200); }
  await p.click('text=Done decorating'); await p.waitForSelector('.ready'); await p.waitForTimeout(400);
  if (post) { await p.click('text=Post to my calendar'); await p.waitForTimeout(900); }
}

// ===== 8. DATES: a stamp made on the 17th (just after midnight in India, which is still the 16th in UTC) is kept on the 17th =====
for (const [tz, iso, want] of [['Asia/Kolkata', '2026-10-17T00:40:00+05:30', '2026-10-17'], ['America/Los_Angeles', '2026-10-17T20:30:00-07:00', '2026-10-17'], ['Pacific/Auckland', '2026-10-17T00:10:00+13:00', '2026-10-17']]) {
  const p = await page({ timezoneId: tz });
  await p.clock.install({ time: new Date(iso) }); await start(p);
  await galleryTale(p, 'Midnight tale', { post: true });
  const r = await p.evaluate(() => { const t = window.__lt.store.tales.find((x) => !x.sample); return { date: t?.date, today: window.__lt.trialInfo && document.querySelector('.cell.today')?.getAttribute('aria-label') }; });
  ok(`${tz}: new tale is dated ${want}`, r.date === want, JSON.stringify(r));
  await p.reload(); await p.waitForTimeout(900);
  const again = await p.evaluate(() => window.__lt.store.tales.find((x) => !x.sample)?.date);
  ok(`${tz}: date unchanged after reload`, again === want);
  await p.evaluate(() => window.__lt.go('calendar', {}, { replace: true })); await p.waitForTimeout(500);
  const cell = await p.evaluate((d) => { const n = Number(d.slice(8)); const cells = [...document.querySelectorAll('.grid .cell:not(.blank)')]; const c = cells[n - 1]; const r = c.getBoundingClientRect(); return { has: c.classList.contains('has'), today: c.classList.contains('today'), inView: r.left >= 0 && r.right <= innerWidth + 0.5 }; }, want);
  ok(`${tz}: the stamp sits in today's calendar cell, fully on screen`, cell.has && cell.today && cell.inView, JSON.stringify(cell));
  await p.context().close();
}

// ===== 3. CALENDAR fits every phone width =====
for (const w of [320, 360, 375, 393, 430]) {
  const p = await page({ viewport: { width: w, height: 700 } });
  await start(p);
  await p.evaluate(async () => { const { store } = window.__lt; const d = new Date(); const ds = (n) => { const x = new Date(d.getFullYear(), d.getMonth(), n); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; }; for (const n of [1, 3, 7, 10, d.getDate()]) await store.save({ id: 'c' + n, date: ds(n), createdAt: n, photo: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=', title: 'T', thought: '', light: 'golden', decorations: [], audio: null, audioDur: 0 }, { local: true }); window.__lt.go('calendar', {}, { replace: true }); });
  await p.waitForTimeout(700);
  const m = await p.evaluate(() => { const cells = [...document.querySelectorAll('.grid .cell')]; const rects = cells.map((c) => c.getBoundingClientRect()); return { maxRight: Math.max(...rects.map((r) => r.right)), minLeft: Math.min(...rects.map((r) => r.left)), docW: document.documentElement.scrollWidth, vw: innerWidth, w0: rects[6]?.width }; });
  ok(`calendar fits at ${w}px wide`, m.maxRight <= m.vw + 0.5 && m.minLeft >= -0.5 && m.docW <= m.vw, JSON.stringify(m));
  if (w === 393) await p.screenshot({ path: '/tmp/s/cal-393.png' });
  await p.context().close();
}

// ===== 2. CAMERA: the preview shows exactly the pixels that get saved =====
if (process.env.FAKECAM) {
  const p = await page({}); await start(p);
  await p.click('#tabbar .tab-new'); await p.click('text=Take a photo'); await p.waitForTimeout(1800);
  const sig = (id) => p.evaluate(async (src) => {
    const img = src === 'canvas' ? document.querySelector('canvas.cam-view') : await new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = window.__lt.shot; });
    const c = document.createElement('canvas'); c.width = 8; c.height = 10; const g = c.getContext('2d'); g.drawImage(img, 0, 0, 8, 10);
    const d = g.getImageData(0, 0, 8, 10).data; const out = []; for (let i = 0; i < d.length; i += 4) out.push((d[i] + d[i + 1] + d[i + 2]) / 3); return out;
  }, id);
  const blank = await p.evaluate(() => { const c = document.querySelector('canvas.cam-view'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let s = 0; for (let i = 0; i < d.length; i += 4) s += d[i]; return { w: c.width, h: c.height, sum: s }; });
  ok('camera preview canvas is drawing the live picture', blank.w > 10 && blank.sum > 0, JSON.stringify(blank));
  const pre = await sig('canvas');
  await p.click('.shutter'); await p.waitForSelector('.thought', { timeout: 6000 });
  await p.evaluate(() => { window.__lt.shot = document.querySelector('.thought-hero img.photo').src; });
  const post = await sig('shot');
  // left half vs right half brightness pattern must agree (a mirrored preview would flip it)
  const half = (a, side) => { let s = 0; for (let r = 0; r < 10; r++) for (let c = side * 4; c < side * 4 + 4; c++) s += a[r * 8 + c]; return s; };
  const diff = pre.reduce((s, v, i) => s + Math.abs(v - post[i]), 0) / pre.length;
  ok('saved photo matches the preview (same orientation, not mirrored)', diff < 40 && Math.sign(half(pre, 0) - half(pre, 1)) === Math.sign(half(post, 0) - half(post, 1)), `avg difference ${diff.toFixed(1)}`);
  await p.context().close();
} else console.log('SKIP camera test (set FAKECAM)');

// ===== 5. LIGHT: Original / no effect, and tapping a selected light clears it =====
{
  const p = await page({}); await start(p);
  await p.click('#tabbar .tab-new'); await p.click('text=From your gallery'); await p.setInputFiles('input[type=file]', gallery); await p.waitForTimeout(700); await p.click('.daypick .btn-primary'); await p.waitForTimeout(400);
  await p.fill('.thought-input', 'x'); await p.click('text=Make it a stamp'); await p.waitForTimeout(300);
  ok('"Original" is offered first', (await p.locator('.chips .chip').first().innerText()) === 'Original');
  ok('the photo starts exactly as taken (Original), no filter added', await p.locator('.frame-hero .stamp.light-none').count() === 1);
  await p.click('.chip:has-text("After dark")'); ok('a light can be picked', await p.locator('.frame-hero .stamp.light-dark').count() === 1);
  await p.click('.chip:has-text("After dark")'); ok('tapping the picked light again removes it', await p.locator('.frame-hero .stamp.light-none').count() === 1);
  await p.click('.chip:has-text("After dark")'); await p.click('.chip:has-text("Original")'); ok('Original switches back to the raw photo', await p.locator('.frame-hero .stamp.light-none').count() === 1);
  const filt = await p.evaluate(() => getComputedStyle(document.querySelector('.frame-hero .stamp.light-none img.photo')).filter);
  const ov = await p.evaluate(() => getComputedStyle(document.querySelector('.frame-hero .stamp.light-none .light-overlay')).backgroundImage);
  ok('no filter or tint is applied in Original', (filt === 'none' || filt === '') && (ov === 'none' || ov === ''), `${filt} / ${ov}`);
  await p.click('text=Stamp it'); await p.waitForSelector('.decorate'); await p.click('text=Skip for now'); await p.waitForSelector('.ready'); await p.click('text=Post to my calendar'); await p.waitForTimeout(800);
  ok('the original look is saved with the tale', await p.evaluate(() => window.__lt.store.tales.find((t) => !t.sample)?.light) === 'none');
  await p.context().close();
}

// ===== 6 + 7. LAYOUT: the stamp is the hero on Decorate and Ready =====
for (const [w, h] of [[393, 670], [390, 844], [360, 640]]) {
  const p = await page({ viewport: { width: w, height: h } }); await start(p);
  await galleryTale(p, 'Layout', { deco: true });
  const ready = await p.evaluate(() => { const r = document.querySelector('.page').getBoundingClientRect(); return { w: r.width, h: r.height, vw: innerWidth, vh: innerHeight, sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight }; });
  ok(`Ready ${w}x${h}: the page fills the width and most of the height`, ready.w >= ready.vw * 0.78 && ready.h >= ready.vh * 0.5 && ready.sh <= ready.vh + 1, JSON.stringify(ready));
  await p.click('text=Back to decorating'); await p.waitForTimeout(500);
  const dec = await p.evaluate(() => { const pg = document.querySelector('.page').getBoundingClientRect(), tr = document.querySelector('.tray').getBoundingClientRect(); return { pageH: pg.height, trayH: tr.height, vh: innerHeight, sh: document.documentElement.scrollHeight }; });
  ok(`Decorate ${w}x${h}: the stamp is bigger than the tools`, dec.pageH > dec.trayH * 1.9 && dec.pageH >= dec.vh * 0.45 && dec.sh <= dec.vh + 1, JSON.stringify(dec));
  await p.context().close();
}

// ===== 4. VOICE: unsupported or failing browsers fall back to the keyboard microphone with a clear message =====
{
  const p = await page({}, () => { delete window.SpeechRecognition; delete window.webkitSpeechRecognition; }); await start(p);
  await p.click('#tabbar .tab-new'); await p.click('text=From your gallery'); await p.setInputFiles('input[type=file]', gallery); await p.waitForTimeout(700); await p.click('.daypick .btn-primary'); await p.waitForTimeout(400);
  await p.click('.dictate'); await p.waitForTimeout(200);
  ok('no speech support: the cursor goes in the box and the keyboard microphone is explained', (await p.locator('.mic-status').innerText()).toLowerCase().includes('microphone') && await p.evaluate(() => document.activeElement?.classList.contains('thought-input')));
  await p.context().close();
  const q = await page({}, () => { window.SpeechRecognition = window.webkitSpeechRecognition = class { start() { setTimeout(() => this.onerror?.({ error: 'service-not-allowed' }), 30); } stop() {} }; }); await start(q);
  await q.click('#tabbar .tab-new'); await q.click('text=From your gallery'); await q.setInputFiles('input[type=file]', gallery); await q.waitForTimeout(700); await q.click('.daypick .btn-primary'); await q.waitForTimeout(400);
  await q.click('.dictate'); await q.waitForTimeout(300);
  const msg = (await q.locator('.mic-status').innerText()).toLowerCase();
  ok('phone dictation switched off: says exactly where to turn it on, and offers the keyboard microphone', msg.includes('dictation') && msg.includes('keyboard'), msg);
  await q.context().close();
}

// ===== 1. SIGN-IN SPEED: the app does not wait for photos before letting you in =====
{
  const mock = fs.readFileSync(new globalThis.URL('./mock-supabase.js', import.meta.url), 'utf8');
  const ctx = await b.newContext({ viewport: { width: 393, height: 700 } }); const p = await ctx.newPage();
  p.on('pageerror', (e) => { errs++; console.log('  PAGE ERROR:', e.message); });
  await p.addInitScript({ content: mock });
  await p.goto(URL); await p.evaluate(() => { const d = { session: { id: 'u-s', email: 's@x.y', user_metadata: {} }, profiles: { 'u-s': { id: 'u-s', tz: 'UTC', first_sign_in: new Date().toISOString().slice(0, 10), consented_at: new Date().toISOString() } }, tales: {}, files: {}, subs: {}, users: {}, attempts: [] }; for (let i = 0; i < 3; i++) { d.tales['t' + i] = { id: 't' + i, user_id: 'u-s', tale_date: new Date().toISOString().slice(0, 10), title: '', thought: '', light: 'golden', decorations: [], photo_path: 'p' + i, created_at: new Date(Date.now() + i).toISOString(), updated_at: new Date().toISOString() }; d.files['photos/p' + i] = { url: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=' }; } localStorage.setItem('mockdb', JSON.stringify(d)); localStorage.setItem('mockdl', '2500'); });
  await p.evaluate(() => new Promise((r) => { const q = indexedDB.deleteDatabase('littletales'); q.onsuccess = q.onerror = q.onblocked = r; }));
  const t0 = Date.now(); await p.goto(URL); await p.waitForSelector('.home', { timeout: 8000 }); const ms = Date.now() - t0;
  ok('a returning member sees Home straight away even when photos download slowly (2.5s each)', ms < 2200, `${ms} ms`);
  const early = await p.evaluate(() => window.__lt.store.tales.length);
  await p.waitForTimeout(9000);
  const late = await p.evaluate(() => window.__lt.store.tales.length);
  ok('the tales then arrive in the background', early < 3 && late === 3, `${early} then ${late}`);
  await ctx.close();
}

// ===== bigger stamps on the Day view; camera shows no raw <video>; sounds unlock and play =====
{
  const p = await page({ viewport: { width: 393, height: 780 } }); await start(p);
  await p.evaluate(async () => { const { store } = window.__lt; const d = new Date(); const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; for (let i = 0; i < 3; i++) await store.save({ id: 'd' + i, date: ds, createdAt: i + 1, photo: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=', title: 'Tale ' + i, thought: '', light: 'none', decorations: [], audio: null, audioDur: 0 }, { local: true }); window.__lt.go('day', { date: ds }, { replace: true }); });
  await p.waitForTimeout(600);
  const w3 = await p.evaluate(() => [...document.querySelectorAll('.day-card .stamp')].map((s) => Math.round(s.getBoundingClientRect().width)));
  ok('Day view with 3 tales: each stamp is at least 170 px wide (was about 80)', w3.length === 3 && w3.every((w) => w >= 170), JSON.stringify(w3));
  ok('Day view: all 3 tales are shown together, nothing swipes', await p.evaluate(() => { const r = document.querySelector('.day-row'); const cards = [...document.querySelectorAll('.day-card')].map((c) => c.getBoundingClientRect()); return getComputedStyle(r).overflowX !== 'auto' && getComputedStyle(r).overflowX !== 'scroll' && !document.querySelector('.day-swipe, .day-dots') && cards.every((c) => c.left >= -30 && c.right <= innerWidth + 30) && document.documentElement.scrollWidth <= innerWidth; }));
  ok('Day view with 3 tales fits the phone width', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await p.screenshot({ path: '/tmp/s/day3.png' });
  const cellStamp = await p.evaluate(() => { window.__lt.go('calendar', {}, { replace: true }); return 1; }); await p.waitForTimeout(500);
  const cs = await p.evaluate(() => { const c = document.querySelector('.grid .cell.has'); const st = c.querySelector('.stamp').getBoundingClientRect(), cr = c.getBoundingClientRect(); return { stamp: Math.round(st.width), cell: Math.round(cr.width) }; });
  ok('calendar stamps fill most of their cell', cs.stamp >= cs.cell * 0.82, JSON.stringify(cs));
  await p.tap?.('body').catch(() => {});
  await p.mouse.click(200, 400); await p.waitForTimeout(200);
  const snd = await p.evaluate(async () => { const m = await import('/js/recorder.js'); await m.playStamp(); await m.playChime(); return m.audioState(); });
  ok('after a touch, sound is allowed (audio engine is running)', snd === 'running', snd);
  await p.context().close();
}
if (process.env.FAKECAM) {
  const p = await page({}); await start(p);
  await p.click('#tabbar .tab-new'); await p.click('text=Take a photo'); await p.waitForTimeout(1500);
  const vis = await p.evaluate(() => [...document.querySelectorAll('video')].map((v) => { const cs = getComputedStyle(v); return { op: cs.opacity, w: v.getBoundingClientRect().width, tr: cs.transform }; }));
  ok('no camera video element is visible on screen (only canvases show the picture)', vis.every((v) => Number(v.op) === 0 || v.w <= 2), JSON.stringify(vis));
  const bg = await p.evaluate(() => { const c = document.querySelector('canvas.cam-bg'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let s = 0; for (let i = 0; i < d.length; i += 4) s += d[i]; return s; });
  ok('the blurred backdrop is drawn from the same raw frames', bg > 0);
  await p.context().close();
}

// ===== home screen shortcut =====
{
  const p = await page({}); await start(p);
  await p.evaluate(() => window.__lt.go('home', {}, { replace: true })); await p.waitForTimeout(500);
  ok('Home offers "Add to Home Screen" (browser only, dismissible)', await p.locator('.install-card').count() === 1);
  await p.click('.install-card .ic-go'); await p.waitForTimeout(400);
  ok('the steps are explained', (await p.locator('.hs').innerText()).toLowerCase().includes('install'));
  await p.screenshot({ path: '/tmp/s/addhome.png' });
  await p.click('.hs .btn-primary'); await p.waitForTimeout(400);
  await p.evaluate(() => window.__lt.go('home', {}, { replace: true })); await p.waitForTimeout(400);
  ok('after "Got it" the card does not nag again', await p.locator('.install-card').count() === 0);
  const man = await p.evaluate(async () => { const m = await (await fetch('manifest.webmanifest')).json(); const ok = await Promise.all(m.icons.map(async (i) => (await fetch(i.src)).ok)); return { display: m.display, start: m.start_url, icons: m.icons.map((i) => i.sizes + ':' + i.purpose), allIconsLoad: ok.every(Boolean), apple: !!document.querySelector('link[rel=apple-touch-icon]') }; });
  ok('the app is installable (standalone, icons incl. maskable and Apple touch icon)', man.display === 'standalone' && man.allIconsLoad && man.icons.some((x) => x.endsWith('maskable')) && man.apple, JSON.stringify(man));
  await p.context().close();
  const q = await page({}, () => { Object.defineProperty(navigator, 'standalone', { value: true }); }); await start(q);
  await q.evaluate(() => window.__lt.go('home', {}, { replace: true })); await q.waitForTimeout(400);
  ok('opened from the home screen icon: no install prompt is shown', await q.locator('.install-card').count() === 0);
  await q.context().close();
}

// ===== fixes from the independent review =====
{
  const mock = fs.readFileSync(new globalThis.URL('./mock-supabase.js', import.meta.url), 'utf8');
  const IMG = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
  async function member(seed, { delay = 0 } = {}) {
    const ctx = await b.newContext({ viewport: { width: 393, height: 780 } }); const p = await ctx.newPage();
    p.on('pageerror', (e) => { errs++; console.log('  PAGE ERROR:', e.message); });
    await p.addInitScript({ content: mock });
    await p.goto(URL);
    await p.evaluate(([seed, IMG]) => { const day = (n) => { const d = new Date(Date.now() - n * 864e5); return d.toISOString().slice(0, 10); }; const d = { session: { id: 'u-r', email: 'r@x.y', user_metadata: {} }, profiles: { 'u-r': { id: 'u-r', tz: 'UTC', first_sign_in: day(seed.ago), consented_at: new Date().toISOString() } }, tales: {}, files: { 'photos/p': { url: IMG } }, subs: {}, users: {}, attempts: [] }; for (let i = 0; i < (seed.rows || 0); i++) d.tales['t' + i] = { id: 't' + i, user_id: 'u-r', tale_date: day(1), title: '', thought: '', light: 'golden', decorations: [], photo_path: 'p', created_at: new Date(1e12 + i * 1000).toISOString(), updated_at: new Date().toISOString() }; localStorage.setItem('mockdb', JSON.stringify(d)); }, [seed, IMG]);
    await p.evaluate(() => new Promise((r) => { const q = indexedDB.deleteDatabase('littletales'); q.onsuccess = q.onerror = q.onblocked = r; }));
    await p.goto(URL); await p.waitForTimeout(1500);
    return p;
  }
  // a member whose 30 days are over is not stuck
  { const p = await member({ ago: 45 });
    ok('after the 30-day hold: the screen offers "See plans" (not a dead end)', await p.locator('.locked .btn-primary:has-text("See plans")').count() === 1);
    await p.click('.locked .btn-primary'); await p.waitForTimeout(500);
    ok('...and the plans open', await p.locator('.paywall').count() === 1);
    await p.context().close(); }
  // signing out with tales that have not reached the server yet
  { const p = await member({ ago: 1 });
    await p.evaluate(() => { const d = JSON.parse(localStorage.getItem('mockdb')); d.fail = true; localStorage.setItem('mockdb', JSON.stringify(d)); });
    await p.evaluate(async (IMG) => { await window.__lt.store.save({ id: '00000000-0000-4000-8000-0000000000aa', date: new Date().toISOString().slice(0, 10), createdAt: Date.now(), photo: IMG, thumb: IMG, title: 'Offline', thought: '', light: 'golden', decorations: [], audio: null, audioDur: 0 }); window.__lt.go('account', {}, { replace: true }); }, IMG);
    await p.waitForTimeout(600);
    await p.click('text=Sign out'); await p.waitForTimeout(900);
    ok('sign out while a tale is unsent: asks first and says how many', (await p.locator('.confirm').innerText()).includes('saved online'));
    await p.click('text=Keep things as they are'); await p.waitForTimeout(400);
    ok('...and staying signed in keeps the tale', await p.evaluate(() => window.__lt.store.tales.some((t) => t.title === 'Offline')) && await p.evaluate(() => !!window.__lt.auth.user));
    await p.evaluate(() => { const d = JSON.parse(localStorage.getItem('mockdb')); d.fail = false; localStorage.setItem('mockdb', JSON.stringify(d)); window.dispatchEvent(new Event('online')); });
    await p.waitForTimeout(1500);
    ok('once back online the tale is sent', await p.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('mockdb')).tales).includes('00000000-0000-4000-8000-0000000000aa')));
    await p.click('text=Sign out'); await p.waitForTimeout(1500);
    ok('then signing out is immediate', await p.locator('.welcome, .signin').count() >= 1);
    await p.context().close(); }
  // time travel and the founder panel are not for members
  { const p = await member({ ago: 1 });
    await p.evaluate(async () => { window.__lt.account.dayOffset = 6; window.__lt.setDayOffset(6); await window.__lt.sync.pullAccount(); });
    ok('a member cannot stay in time-travel (always real time)', await p.evaluate(() => window.__lt.account.dayOffset) === 0);
    await p.evaluate(() => window.__lt.go('home', {}, { replace: true })); await p.waitForTimeout(400);
    for (let i = 0; i < 5; i++) await p.click('.brand');
    await p.waitForTimeout(400);
    ok('the hidden founder panel stays closed for members', await p.locator('.sheet').count() === 0);
    await p.click('.tile:has-text("Your week")'); await p.waitForTimeout(400);
    ok('"Your week" on day 1 explains it is ready on day 7 (does not open an early video)', await p.locator('.home').count() === 1 && (await p.locator('.toast').innerText()).includes('day 7'));
    await p.context().close(); }
  // more than 1000 tales all come back
  { const p = await member({ ago: 3, rows: 1010 });
    await p.waitForTimeout(25000);
    const n = await p.evaluate(() => window.__lt.store.tales.length);
    ok('1010 tales online: all of them arrive on a new phone (the server sends 1000 at a time)', n === 1010, 'got ' + n);
    await p.context().close(); }
}

// ===== home-screen steps are right for each kind of phone =====
{
  const p = await page({}); await p.goto(URL); await p.waitForTimeout(500);
  const cases = [
    ['iPhone Safari', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', 'Add to Home Screen', 'bottom of Safari'],
    ['iPhone Chrome', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0 Mobile/15E148 Safari/604.1', 'Add to Home Screen', 'next to the address'],
    ['Android Chrome', 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36', 'Install app', 'top right of Chrome'],
    ['Samsung Internet', 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0 Mobile Safari/537.36', 'Add page to', 'bottom right'],
    ['Instagram in-app', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 300.0', 'Open in Safari', 'another app'],
  ];
  for (const [name, ua, a, c] of cases) {
    const txt = await p.evaluate(async ([ua, ]) => { const m = await import('/js/install.js'); return JSON.stringify(m.detectPlatform(ua, 5, 'iPhone')); }, [ua]);
    const pl = JSON.parse(txt);
    ok(`detects ${name}`, (name.startsWith('iPhone') || name.startsWith('Instagram')) ? pl.os === 'ios' : pl.os === 'android', txt);
  }
  await p.context().close();
  for (const [name, ua, a, c] of cases) {
    const q = await page({ userAgent: ua }); await start(q);
    await q.evaluate(() => window.__lt.go('home', {}, { replace: true })); await q.waitForTimeout(300);
    await q.click('.install-card .ic-go'); await q.waitForTimeout(300);
    const txt = await q.locator('.hs').innerText();
    ok(`steps for ${name} mention "${a}" and "${c}"`, txt.includes(a) && txt.includes(c), txt.slice(0, 120).replace(/\n/g, ' | '));
    await q.context().close();
  }
}

console.log(fails || errs ? `\nFAILED: ${fails} failed checks, ${errs} console errors` : '\nALL GOOD: 0 failed checks, 0 console errors');
await b.close(); process.exit(fails || errs ? 1 : 0);
