// Softer touches, first-tale celebration, streaks and sharing a stamp as a picture.   node tests/delight.mjs
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
const URL = process.env.URL || 'http://localhost:8123/';
const CAM = process.env.FAKECAM ? [`--use-file-for-fake-video-capture=${process.env.FAKECAM}`] : [];
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', ...CAM] });
let fails = 0, errs = 0;
const ok = (n, c, x = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  ' + x : '')); if (!c) fails++; };
const gallery = '/home/user/LittleTales/assets/photos/skyline-dusk.jpg';
async function page(init) {
  const ctx = await b.newContext({ viewport: { width: 393, height: 760 }, deviceScaleFactor: 2, hasTouch: true, permissions: ['camera', 'microphone'], acceptDownloads: true });
  const p = await ctx.newPage();
  p.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) { errs++; console.log('  console error:', m.text().slice(0, 160)); } });
  p.on('pageerror', (e) => { errs++; console.log('  PAGE ERROR:', e.message); });
  await p.addInitScript(() => { window.__DEMO_AUTH = true; });
  if (init) await p.addInitScript(init);
  return p;
}
async function start(p) {
  await p.goto(URL); await p.waitForTimeout(900);
  await p.click('text=Start my album'); await p.click('.google'); await p.waitForTimeout(600); await p.click('.check'); await p.click('text=Start my free week'); await p.waitForTimeout(400); await p.click('.intro-top .link'); await p.waitForTimeout(400);
  await p.evaluate(() => window.__lt.store.removeSamples());
}
async function makeTale(p, label) {
  await p.click('#tabbar .tab-new'); await p.waitForTimeout(300);
  await p.click('text=From your gallery'); await p.setInputFiles('input[type=file]', gallery); await p.waitForTimeout(700);
  await p.click('.daypick .btn-primary'); await p.waitForTimeout(500);
  await p.fill('.thought-input', label); await p.click('text=Make it a stamp'); await p.waitForTimeout(300);
  await p.fill('.title-input', label.slice(0, 20)); await p.click('text=Stamp it'); await p.waitForSelector('.decorate', { timeout: 6000 }); await p.waitForTimeout(500);
  await p.click('.tray-item >> nth=0'); await p.waitForTimeout(200);
  await p.click('text=Done decorating'); await p.waitForSelector('.ready'); await p.waitForTimeout(400);
  await p.click('text=Post to my calendar'); await p.waitForTimeout(1200);
}

// ---- unit: streak maths ----
{
  const p = await page(); await p.goto(URL); await p.waitForTimeout(500);
  const r = await p.evaluate(async () => {
    const { computeStreak } = await import('./js/streak.js');
    const T = (...d) => d.map((x) => ({ date: x }));
    return [
      computeStreak(T('2026-10-17'), '2026-10-17'),
      computeStreak(T('2026-10-15', '2026-10-16', '2026-10-17'), '2026-10-17'),
      computeStreak(T('2026-10-15', '2026-10-16'), '2026-10-17'),            // today still open: streak alive
      computeStreak(T('2026-10-14', '2026-10-15'), '2026-10-17'),            // missed yesterday: broken
      computeStreak(T('2026-10-17', '2026-10-17', '2026-10-16'), '2026-10-17'),
      computeStreak([{ date: '2026-10-17', sample: true }], '2026-10-17'),
      computeStreak(T('2026-02-27', '2026-02-28', '2026-03-01'), '2026-03-01'), // across a month end
      computeStreak([], '2026-10-17'),
    ];
  });
  ok('streak: one day', r[0].count === 1 && r[0].postedToday);
  ok('streak: three in a row', r[1].count === 3);
  ok('streak: alive while today is still open', r[2].count === 2 && !r[2].postedToday);
  ok('streak: broken after a missed day', r[3].count === 0);
  ok('streak: two tales on one day count once', r[4].count === 2);
  ok('streak: sample tales never count', r[5].count === 0);
  ok('streak: across a month end', r[6].count === 3);
  ok('streak: empty', r[7].count === 0);
  await p.context().close();
}

// ---- first tale: celebration, once only, share inside it ----
{
  const p = await page(); await start(p);
  await p.evaluate(() => { window.__shared = null; navigator.canShare = () => true; navigator.share = async (d) => { window.__shared = d; }; });
  await makeTale(p, 'My very first');
  ok('first tale shows the celebration', await p.locator('.celebrate h2').innerText().then((t) => /first/i.test(t)).catch(() => false));
  ok('confetti canvas appears', await p.locator('canvas.confetti').count() > 0);
  await p.screenshot({ path: '/tmp/s/first.png' });
  await p.click('.celebrate >> text=Share this stamp'); await p.waitForTimeout(2500);
  const sh = await p.evaluate(() => window.__shared && { n: window.__shared.files.length, type: window.__shared.files[0].type, size: window.__shared.files[0].size });
  ok('sharing from the celebration passes a PNG file', sh && sh.n === 1 && sh.type === 'image/png' && sh.size > 20000, JSON.stringify(sh));
  await p.click('.celebrate >> text=Maybe later'); await p.waitForTimeout(500);
  ok('celebration closes', await p.locator('.celebrate').count() === 0);
  await p.waitForTimeout(2800);
  ok('confetti cleans itself up', await p.locator('canvas.confetti').count() === 0);
  ok('celebration remembered', await p.evaluate(() => window.__lt.account.celebratedFirst === true));
  // second tale same day: only a quiet toast
  await makeTale(p, 'Second one');
  ok('second tale: no celebration', await p.locator('.celebrate').count() === 0);
  ok('second tale: quiet toast', await p.locator('.toast').innerText().then((t) => /Posted/.test(t)).catch(() => false));
  await p.reload(); await p.waitForTimeout(900);
  ok('flag survives a reload', await p.evaluate(() => window.__lt.account.celebratedFirst === true));
  await p.context().close();
}

// ---- streak on Home + milestone ----
{
  const p = await page(); await start(p);
  const day = (n) => p.evaluate((n) => { const d = new Date(Date.now() + window.__lt.auth ? 0 : 0); const x = new Date(); x.setDate(x.getDate() - n); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; }, n);
  const seed = async (n) => { const date = await day(n); await p.evaluate(async ([date, n]) => window.__lt.store.save({ id: 'k' + n, date, createdAt: Date.now() - n, photo: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=', title: 'T', thought: '', light: 'golden', decorations: [], audio: null, audioDur: 0 }, { local: true }), [date, n]); };
  await seed(1); await seed(2); // streak of 2, today open
  await p.evaluate(() => { window.__lt.account.celebratedFirst = true; window.__lt.go('home', {}, { replace: true }); }); await p.waitForTimeout(600);
  const chip = await p.locator('.streak').innerText().catch(() => '');
  ok('home shows "2 days in a row" with a nudge', /2 days in a row/.test(chip) && /keep it going/.test(chip), chip.replace(/\n/g, ' | '));
  ok('flame is dim until today is posted', await p.locator('.streak-flame.lit').count() === 0);
  await p.screenshot({ path: '/tmp/s/streak-open.png' });
  await makeTale(p, 'Third day');          // posts today -> 3 days -> milestone
  ok('3 days in a row triggers a milestone card', await p.locator('.celebrate h2').innerText().then((t) => /3 days in a row/.test(t)).catch(() => false));
  await p.screenshot({ path: '/tmp/s/milestone.png' });
  await p.click('.celebrate >> text=Maybe later'); await p.waitForTimeout(400);
  await p.evaluate(() => window.__lt.go('home', {}, { replace: true })); await p.waitForTimeout(500);
  ok('flame is lit when today is posted', await p.locator('.streak-flame.lit').count() === 1);
  ok('milestone remembered so it shows once', await p.evaluate(() => window.__lt.account.milestones.includes(3)));
  await p.screenshot({ path: '/tmp/s/streak-lit.png' });
  await p.context().close();
}

// ---- share from the tale screen: native share, then the save fallback ----
{
  const p = await page(); await start(p);
  await p.evaluate(() => { window.__lt.account.celebratedFirst = true; });
  await makeTale(p, 'Share me please');
  await p.evaluate(() => { const t = window.__lt.store.tales[0]; window.__lt.go('tale', { id: t.id }); }); await p.waitForTimeout(900);
  // the picture itself
  const pic = await p.evaluate(async () => {
    const { makeShareImage } = await import('./js/share.js'); const t = window.__lt.store.tales[0];
    const blob = await makeShareImage(t); const url = URL.createObjectURL(blob);
    const img = await new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = url; });
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0);
    const px = (a, b2) => Array.from(x.getImageData(a, b2, 1, 1).data);
    // is the photo region of the stamp coloured (not blank cream)? sample the middle of the stamp
    const mid = px(540, 520), top = px(40, 40), bottom = px(40, 1880);
    let nonBg = 0; const d = x.getImageData(0, 0, c.width, c.height).data; for (let i = 0; i < d.length; i += 4 * 997) if (d[i + 3] > 0) nonBg++;
    return { w: img.width, h: img.height, type: blob.type, size: blob.size, mid, top, bottom, nonBg };
  });
  ok('picture is 1080x1920 PNG', pic.w === 1080 && pic.h === 1920 && pic.type === 'image/png', JSON.stringify({ w: pic.w, h: pic.h, size: pic.size }));
  ok('picture has a real background and content', pic.size > 60000 && pic.top[3] === 255 && pic.nonBg > 100, JSON.stringify(pic));
  // save the picture so we can look at it
  const dataUrl = await p.evaluate(async () => { const { makeShareImage } = await import('./js/share.js'); const b2 = await makeShareImage(window.__lt.store.tales[0]); return await new Promise((r) => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(b2); }); });
  (await import('fs')).writeFileSync('/tmp/s/share.png', Buffer.from(dataUrl.split(',')[1], 'base64'));
  // native share path
  await p.evaluate(() => { window.__shared = null; navigator.canShare = () => true; navigator.share = async (d) => { window.__shared = d; }; });
  await p.click('.tale >> text=Share as a picture'); await p.waitForTimeout(1500);
  ok('tale screen: native share gets a PNG file', await p.evaluate(() => window.__shared?.files?.[0]?.type === 'image/png'));
  ok('button usable again afterwards', await p.locator('.tale .btn-primary').isEnabled());
  // cancelled share is quiet
  await p.evaluate(() => { navigator.share = async () => { const e = new Error('x'); e.name = 'AbortError'; throw e; }; });
  await p.click('.tale >> text=Share as a picture'); await p.waitForTimeout(800);
  ok('cancelled share shows no error', !(await p.locator('.toast').innerText().catch(() => '')).includes('couldn'));
  // no share support: downloads the picture
  await p.evaluate(() => { navigator.canShare = undefined; navigator.share = undefined; });
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 6000 }).catch(() => null), p.click('.tale >> text=Share as a picture')]);
  ok('phones without sharing: the picture is saved', !!dl && /little-tale\.png$/.test(dl.suggestedFilename()), dl && dl.suggestedFilename());
  await p.screenshot({ path: '/tmp/s/tale-share.png' });
  await p.context().close();
}

// ---- placeholders ----
{
  const p = await page(); await start(p);
  await p.evaluate(async () => { const s = await import('./js/sync.js'); s.syncState.pulling = true; window.__lt.go('home', {}, { replace: true }); }); await p.waitForTimeout(500);
  ok('home shows placeholder stamps while tales are on their way', await p.locator('.sk-stamp').count() === 3);
  await p.screenshot({ path: '/tmp/s/skeleton.png' });
  await p.evaluate(async () => { const s = await import('./js/sync.js'); s.syncState.pulling = false; window.__lt.go('home', {}, { replace: true }); }); await p.waitForTimeout(400);
  ok('placeholders go away afterwards', await p.locator('.sk-stamp').count() === 0);
  // image shimmer clears once loaded
  await p.evaluate(async () => { const { stampEl } = await import('./js/stamp.js'); const el = stampEl({ id: 'x', date: '2026-10-17', photo: 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=', light: 'none' }); document.body.append(el); window.__el = el; });
  await p.waitForTimeout(400);
  ok('photo shimmer clears when the picture has loaded', await p.evaluate(() => !window.__el.querySelector('.stamp-photo').classList.contains('loading')));
  ok('broken picture does not shimmer forever', await p.evaluate(async () => { const { stampEl } = await import('./js/stamp.js'); const el = stampEl({ id: 'y', date: '2026-10-17', photo: 'data:image/png;base64,AAAA', light: 'none' }); document.body.append(el); await new Promise((r) => setTimeout(r, 400)); return !el.querySelector('.stamp-photo').classList.contains('loading'); }));
  await p.context().close();
}

// ---- tap vibration follows the setting ----
{
  const p = await page(() => { window.__buzzes = []; Object.defineProperty(navigator, 'vibrate', { value: (n) => { window.__buzzes.push(n); return true; }, configurable: true }); });
  await start(p);
  await p.evaluate(() => { window.__buzzes.length = 0; window.__lt.go('home', {}, { replace: true }); }); await p.waitForTimeout(400);
  await p.tap('#tabbar .tab-item >> nth=1'); await p.waitForTimeout(400);
  ok('tapping a tab gives a tiny buzz', await p.evaluate(() => window.__buzzes.includes(6)), await p.evaluate(() => JSON.stringify(window.__buzzes)));
  await p.evaluate(() => { window.__lt.account.settings.sound = false; window.__buzzes.length = 0; });
  await p.tap('#tabbar .tab-item >> nth=0'); await p.waitForTimeout(400);
  ok('no buzz when sound and vibration is off', await p.evaluate(() => window.__buzzes.length === 0));
  await p.context().close();
}

// ---- reduced motion: no confetti ----
{
  const ctx = await b.newContext({ viewport: { width: 393, height: 760 }, reducedMotion: 'reduce', permissions: ['camera'] });
  const p = await ctx.newPage(); await p.addInitScript(() => { window.__DEMO_AUTH = true; }); await start(p);
  const n = await p.evaluate(async () => { const { confetti } = await import('./js/delight.js'); confetti(); return document.querySelectorAll('canvas.confetti').length; });
  ok('reduced motion: no confetti', n === 0);
  await ctx.close();
}

// ---- sound: plays through an audio element (works with the iPhone silent switch); party tune for the first tale ----
{
  const p = await page(() => { window.__plays = []; window.__muted = []; HTMLMediaElement.prototype.play = function () { window.__plays.push({ src: this.src, muted: this.muted }); return Promise.resolve(); }; });
  await start(p);
  await p.evaluate(() => { window.__plays.length = 0; });
  await makeTale(p, 'Sound check');
  const sizes = await p.evaluate(async () => Promise.all(window.__plays.filter((x) => !x.muted).map(async (x) => (await (await fetch(x.src)).blob()).size)));
  ok('first tale plays one sound, the longer party tune', sizes.length >= 1 && sizes[sizes.length - 1] > 115000, JSON.stringify(sizes));
  await p.click('.celebrate >> text=Maybe later'); await p.waitForTimeout(300);
  await p.evaluate(() => { window.__plays.length = 0; });
  await makeTale(p, 'Second sound');
  const sizes2 = await p.evaluate(async () => Promise.all(window.__plays.filter((x) => !x.muted).map(async (x) => (await (await fetch(x.src)).blob()).size)));
  ok('later tales play the soft chime', sizes2.length >= 1 && sizes2[sizes2.length - 1] > 90000 && sizes2[sizes2.length - 1] < 105000, JSON.stringify(sizes2));
  await p.evaluate(() => { window.__lt.account.settings.sound = false; window.__plays.length = 0; });
  await p.click('#tabbar .tab-new').catch(() => {});
  await p.close();
  const q = await page(() => { window.__plays = []; HTMLMediaElement.prototype.play = function () { window.__plays.push({ muted: this.muted }); return Promise.resolve(); }; });
  await start(q);
  await q.evaluate(() => { window.__lt.account.settings.sound = false; window.__plays.length = 0; });
  await makeTale(q, 'Quiet');
  ok('sound off: nothing plays after posting', await q.evaluate(() => window.__plays.filter((x) => !x.muted).length === 0));
  await q.context().close();
}

// ---- new tales start with the photo exactly as it is (no filter) ----
{
  const p = await page(); await start(p);
  await p.evaluate(() => window.__lt.account.celebratedFirst = true);
  await makeTale(p, 'Plain photo');
  ok('a new tale has no light on it by default', await p.evaluate(() => window.__lt.store.tales.find((t) => !t.sample).light === 'none'));
  await p.context().close();
}

await b.close();
console.log(`\n${fails ? 'FAILED ' + fails : 'ALL PASSED'} (console errors: ${errs})`);
process.exit(fails || errs ? 1 : 0);
