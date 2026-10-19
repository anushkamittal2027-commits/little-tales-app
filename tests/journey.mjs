// The core journey: camera -> voice -> stamp -> decorate -> post, plus the 3-a-day rule, editing and deleting.
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import fs from 'fs';
const OUT = process.env.SHOTS || '/tmp/journey-shots'; fs.mkdirSync(OUT, { recursive: true });
const URL = process.env.URL || 'http://localhost:8123/';
const CAM = process.env.FAKECAM ? [`--use-file-for-fake-video-capture=${process.env.FAKECAM}`] : [];
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', ...CAM] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, permissions: ['camera', 'microphone'], hasTouch: true });
const p = await ctx.newPage();
let fails = 0, errs = 0;
p.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) { errs++; console.log('  console error:', m.text().slice(0, 140)); } });
p.on('pageerror', (e) => { errs++; console.log('  PAGE ERROR:', e.message); });
const ok = (n, c, x = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  ' + x : '')); if (!c) fails++; };
const today = new Date(); const pad = (n) => String(n).padStart(2, '0'); const TODAY = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
const nToday = () => p.evaluate((d) => window.__lt.store.tales.filter((t) => t.date === d).length, TODAY);
const gallery = process.env.GALLERY || '/home/user/LittleTales/assets/photos/skyline-dusk.jpg';

await p.addInitScript(() => { window.__DEMO_AUTH = true; }); await p.goto(URL); await p.waitForTimeout(1000);
await p.click('text=Start my album'); await p.click('.google'); await p.waitForTimeout(800); await p.click('.check'); await p.click('text=Start my free week'); await p.waitForTimeout(400); await p.click('.intro-top .link'); await p.waitForTimeout(500);
await p.evaluate(() => window.__lt.store.removeSamples()); await p.evaluate(() => window.__lt.go('calendar', {}, { replace: true })); await p.waitForTimeout(500);
ok('starts with no tales today', (await nToday()) === 0);

async function makeTale(label, { camera = true, voice = false, skipDeco = true } = {}) {
  await p.click('#tabbar .tab-new'); await p.waitForTimeout(300);
  if (await p.locator('.limit').count()) return false;
  if (camera) { await p.waitForTimeout(1300); await p.click('.shutter'); await p.waitForTimeout(900); }
  else { await p.setInputFiles('input[type=file]:not([capture])', gallery); await p.waitForTimeout(1000); }
  if (voice) { await p.click('.mic'); await p.waitForTimeout(1500); await p.click('.mic'); await p.waitForTimeout(800); }
  await p.fill('.thought-input', label); await p.click('.thought .bottom .btn-primary'); await p.waitForTimeout(300);
  await p.fill('.title-input', label.slice(0, 20)); await p.click('text=Stamp it');
  await p.waitForSelector('.decorate', { timeout: 6000 });
  if (!skipDeco) { await p.click('.tray-item >> nth=0'); await p.waitForTimeout(300); }
  if (skipDeco) await p.click('text=Skip for now'); else await p.click('text=Done decorating');
  await p.waitForTimeout(400); await p.click('text=Post to my calendar'); await p.waitForTimeout(1200); await p.locator('.celebrate .link').click({ timeout: 800 }).catch(() => {}); await p.waitForTimeout(2200); return true;
}

ok('tale 1 via camera + voice + sticker', await makeTale('Camera tale one', { camera: true, voice: true, skipDeco: false }));
const t1 = await p.evaluate((d) => window.__lt.store.tales.filter((t) => t.date === d)[0], TODAY);
ok('tale 1 saved with photo, voice and a decoration', !!t1?.photo && !!t1?.audio && t1.decorations.length === 1, `audio=${!!t1?.audio} decos=${t1?.decorations?.length}`);
await p.screenshot({ path: OUT + '/after-first-tale.png' });
ok('tale 2 via gallery', await makeTale('Gallery tale two', { camera: false }));
ok('tale 3 via camera, no decoration', await makeTale('Camera tale three'));
ok('three tales today', (await nToday()) === 3);
await p.click('#tabbar .tab-new'); await p.waitForTimeout(500);
ok('4th attempt shows the gentle message', (await p.locator('.limit').innerText()).includes('3 little tales'));
await p.screenshot({ path: OUT + '/fourth-attempt.png' });
ok('camera did not open', await p.locator('.camera').count() === 0);
const attempts = await p.evaluate(() => window.__lt.store.getMeta('attempts'));
ok('the 4th attempt was recorded for the founder', (attempts || []).length === 1);
await p.click('.limit .btn-primary'); await p.waitForTimeout(400);

// day view, edit, delete frees slot
await p.click('.cell.today'); await p.waitForTimeout(500);
ok('day view shows 3 tales', (await p.locator('.day-card').count()) === 3);
await p.click('.day-card >> nth=1'); await p.waitForTimeout(500);
await p.click('[aria-label^="More"]'); await p.click('text=Edit thought'); await p.waitForTimeout(400);
await p.fill('.thought-input', 'Edited words'); await p.click('text=Save changes'); await p.waitForTimeout(500);
ok('edit thought saved', (await p.locator('.page-thought').innerText()).includes('Edited words'));
await p.click('[aria-label^="More"]'); await p.click('text=Delete this tale'); await p.waitForTimeout(300); await p.click('.sheet .btn-danger'); await p.waitForTimeout(800);
ok('delete removed a tale', (await nToday()) === 2);
ok('lands on the day after deleting', (await p.locator('.day').count()) === 1);
ok('a slot is free again after deleting', (await p.locator('text=Add another tale').count()) === 1);

// gallery photo from another day
await p.click('text=Add another tale'); await p.waitForTimeout(500);
const y = new Date(today.getTime() - 3 * 864e5); const YD = `${y.getFullYear()}-${pad(y.getMonth() + 1)}-${pad(y.getDate())}`;
await p.click('.cam-date'); await p.fill('.daypick input[type=date]', YD); await p.click('.daypick .btn-primary'); await p.waitForTimeout(400);
await p.setInputFiles('input[type=file]:not([capture])', gallery); await p.waitForTimeout(1000);
await p.fill('.thought-input', 'From three days ago'); await p.click('.thought .bottom .btn-primary'); await p.click('text=Stamp it'); await p.waitForSelector('.decorate'); await p.click('text=Skip for now'); await p.click('text=Post to my calendar'); await p.waitForTimeout(1200); await p.locator('.celebrate .link').click({ timeout: 800 }).catch(() => {}); await p.waitForTimeout(2200);
ok('backdated tale counts against its own day', await p.evaluate((d) => window.__lt.store.tales.filter((t) => t.date === d).length === 1, YD));
ok('today still has 2', (await nToday()) === 2);
await p.screenshot({ path: OUT + '/calendar-final.png' });

console.log(`\n${fails === 0 && errs === 0 ? 'ALL GOOD' : 'PROBLEMS'}: ${fails} failed checks, ${errs} console errors`);
await b.close(); process.exit(fails ? 1 : 0);
