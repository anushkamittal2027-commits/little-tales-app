// End-to-end checks, run with: node tests/e2e.mjs   (needs the app served on http://localhost:8123 and Playwright)
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import fs from 'fs';
const OUT = process.env.SHOTS || '/tmp/e2e-shots'; fs.mkdirSync(OUT, { recursive: true });
const URL = process.env.URL || 'http://localhost:8123/';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, permissions: ['camera', 'microphone', 'notifications'], hasTouch: true, acceptDownloads: true });
const p = await ctx.newPage();
let fails = 0, errs = 0;
p.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) { errs++; console.log('  console error:', m.text().slice(0, 140)); } });
p.on('pageerror', (e) => { errs++; console.log('  PAGE ERROR:', e.message); });
const ok = (name, cond, extra = '') => { console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); if (!cond) fails++; };
const shot = async (n, w = 450) => { await p.waitForTimeout(w); await p.screenshot({ path: `${OUT}/${n}.png` }); };
const lt = (fn, ...a) => p.evaluate(([f, args]) => window.__lt[f](...args), [fn, a]);
const status = () => p.evaluate(() => window.__lt.trialInfo().status);

await p.goto(URL); await p.waitForTimeout(1200);
// ---- first run
ok('starts on welcome', await p.locator('.welcome').count() === 1);
await p.click('text=Start my album'); await p.waitForTimeout(500);
ok('terms screen shown', await p.locator('.terms').count() === 1);
await shot('01-terms');
ok('start button disabled until ticked', await p.locator('.terms .btn-primary').isDisabled());
await p.click('.check'); await p.waitForTimeout(250);
ok('start button enabled after tick', !(await p.locator('.terms .btn-primary').isDisabled()));
await p.click('text=Start my free week'); await p.waitForTimeout(500);
ok('install screen shown', await p.locator('.install').count() === 1);
await shot('02-install');
await p.click('text=Turn on gentle nudges'); await p.waitForTimeout(500);
await p.click('text=Continue'); await p.waitForTimeout(600);
ok('calendar after onboarding', await p.locator('.calendar').count() === 1);
ok('status is trial', (await status()) === 'trial');
ok('trial pill says Day 1 of 7', (await p.locator('.pill').innerText()).includes('Day 1 of 7'));
await shot('03-calendar-day1');
await p.reload(); await p.waitForTimeout(1200);
ok('reload keeps you in (no welcome again)', await p.locator('.calendar').count() === 1);

// ---- day 7 video + paywall + checkout
await lt('jumpTo', 'day7');
await p.evaluate(async () => { const { seedTrialWeek } = await import('/js/sample.js'); await seedTrialWeek(window.__lt.account.firstSignIn, 8); window.__lt.go('calendar'); });
await p.waitForTimeout(900);
ok('day 7 opens the video screen', await p.locator('.weekvideo').count() === 1);
await shot('04-video-intro');
await p.click('text=Make my video'); await p.waitForTimeout(3500); await shot('05-video-making', 100);
await p.waitForSelector('video.vplayer', { timeout: 60000 });
const vinfo = await p.evaluate(async () => { const v = document.querySelector('video.vplayer'); await new Promise((r) => { if (v.readyState >= 1) r(); else v.onloadedmetadata = r; setTimeout(r, 4000); }); return { dur: v.duration, w: v.videoWidth, h: v.videoHeight }; });
ok('a real video was made', !!vinfo.w || vinfo.dur > 0, JSON.stringify(vinfo));
await shot('06-video-player');
await p.click('text=Keep going'); await p.waitForTimeout(700);
ok('paywall after the video', await p.locator('.paywall').count() === 1);
await shot('07-paywall');
await p.click('text=Maybe later'); await p.waitForTimeout(600);
ok('Maybe later returns to calendar on day 7', await p.locator('.calendar').count() === 1);
await lt('go', 'paywall', { from: 'pill' }); await p.waitForTimeout(500);
await p.click('.plan >> nth=1'); await p.click('text=Continue'); await p.waitForTimeout(600);
ok('checkout shown', await p.locator('.checkout').count() === 1);
await p.click('.paytab >> nth=0'); await p.click('.pay-fields input'); await p.fill('.pay-fields input', 'bad');
await p.click('.checkout .btn-primary'); await p.waitForTimeout(250);
ok('bad UPI id is rejected', (await p.locator('.pay-err').innerText()).length > 0);
await shot('08-checkout');
await p.fill('.pay-fields input', 'founder@okbank');
await p.click('.checkout .btn-primary'); await p.waitForSelector('.success', { timeout: 8000 });
await shot('09-success');
ok('subscribed after practice payment', (await status()) === 'subscribed');
await p.click('text=Back to my calendar'); await p.waitForTimeout(600);
ok('member pill on calendar', (await p.locator('.pill').innerText()).includes('Member'));

// ---- GST switch + Sunday video banner + month swipe
await lt('go', 'paywall', { from: 'pill' }); await p.waitForTimeout(400);
ok('prices flat while not GST registered', !(await p.locator('.gst').innerText()).includes('GST'));
await p.evaluate(async () => { window.__lt.account.settings.gst = true; await window.__lt.go('paywall', { from: 'pill' }); }); await p.waitForTimeout(400);
ok('GST note appears when the switch is on', (await p.locator('.gst').innerText()).includes('GST'));
await p.click('.plan >> nth=1'); await p.click('text=Continue'); await p.waitForTimeout(400);
ok('checkout shows a GST line and total with GST', (await p.locator('.checkout').innerText()).includes('GST (18%)') && (await p.locator('.srow.total').innerText()).includes('175.82'));
await p.evaluate(() => { window.__lt.account.settings.gst = false; });
await p.evaluate(async () => { const a = window.__lt.account; const now = new Date(); const toSun = (7 - now.getDay()) % 7; a.dayOffset = toSun; window.__lt.setDayOffset(toSun); window.__lt.go('calendar', {}, { replace: true }); });
await p.waitForTimeout(600);
ok('Sunday banner shows for members', (await p.locator('.banner').count()) === 1);
await shot('09b-sunday-banner');
await p.click('.banner'); await p.waitForTimeout(500);
ok('Sunday video screen opens', await p.locator('.weekvideo').count() === 1);
await p.evaluate(() => { window.__lt.account.dayOffset = 0; window.__lt.setDayOffset(0); window.__lt.go('calendar', {}, { replace: true }); }); await p.waitForTimeout(500);
const titleBefore = await p.locator('.month-nav em').innerText();
const box = await p.locator('.grid').boundingBox();
await p.mouse.move(box.x + 300, box.y + 80);
await p.evaluate(() => { const g = document.querySelector('.calendar'); const t = (x, type) => { const ev = new Event(type, { bubbles: true }); ev.touches = [{ clientX: x, clientY: 300 }]; ev.changedTouches = [{ clientX: x, clientY: 300 }]; g.dispatchEvent(ev); }; t(320, 'touchstart'); t(120, 'touchend'); });
await p.waitForTimeout(600);
ok('swiping left moves to the next month', (await p.locator('.month-nav em').innerText()) !== titleBefore);
await p.evaluate(() => { const g = document.querySelector('.calendar'); const t = (x, type) => { const ev = new Event(type, { bubbles: true }); ev.touches = [{ clientX: x, clientY: 300 }]; ev.changedTouches = [{ clientX: x, clientY: 300 }]; g.dispatchEvent(ev); }; t(120, 'touchstart'); t(320, 'touchend'); });
await p.waitForTimeout(600);
ok('swiping right comes back', (await p.locator('.month-nav em').innerText()) === titleBefore);

// ---- account + download
await p.click('.acct'); await p.waitForTimeout(500);
ok('account opens', await p.locator('.account').count() === 1);
await shot('10-account');
const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 15000 }), p.click('text=Download my scrapbook')]);
const zipPath = `${OUT}/scrapbook.zip`; await dl.saveAs(zipPath);
const zipBuf = fs.readFileSync(zipPath);
ok('scrapbook zip downloaded', zipBuf.length > 5000 && zipBuf.slice(0, 2).toString() === 'PK', zipBuf.length + ' bytes');
ok('zip holds tales.json and photos', zipBuf.includes('tales.json') && zipBuf.includes('photos/'));

// ---- locked
await p.click('text=Cancel subscription'); await p.waitForTimeout(400); await p.click('.sheet .btn-danger'); await p.waitForTimeout(600);
ok('cancel subscription works', (await status()) !== 'subscribed');
await lt('jumpTo', 'locked'); await lt('go', 'calendar'); await p.waitForTimeout(700);
ok('locked status', (await status()) === 'locked');
ok('guard shows locked screen instead of calendar', await p.locator('.locked').count() === 1);
await shot('11-locked');
await lt('go', 'moment'); await p.waitForTimeout(500);
ok('cannot open camera flow while locked', await p.locator('.locked').count() === 1);
await lt('jumpTo', 'locked25'); await lt('go', 'calendar'); await p.waitForTimeout(600);
ok('urgent message with few days left', (await p.locator('.locked').innerText()).toLowerCase().includes('days left'));
await shot('12-locked-urgent');
await p.click('.locked .btn-primary'); await p.waitForTimeout(500);
await p.click('text=Continue'); await p.waitForTimeout(500); await p.fill('.pay-fields input', 'founder@okbank'); await p.click('.checkout .btn-primary'); await p.waitForSelector('.success', { timeout: 8000 });
await p.click('text=Back to my calendar'); await p.waitForTimeout(700);
ok('tales come back after subscribing', (await p.locator('.cell.has').count()) > 0);

// ---- deleted after 30 days
await lt('jumpTo', 'deleted'); await lt('go', 'calendar'); await p.waitForTimeout(600);
ok('deleted status after 30 days', (await status()) === 'deleted');
await shot('13-deleted');

// ---- account deletion
await lt('jumpTo', 'day1'); await lt('go', 'account'); await p.waitForTimeout(500);
await p.click('text=Delete my account and tales'); await p.waitForTimeout(400); await p.click('.sheet .btn-danger'); await p.waitForTimeout(900);
ok('delete account returns to welcome', await p.locator('.welcome').count() === 1);
ok('no tales left after delete', await p.evaluate(() => window.__lt.store.tales.length === 0));

console.log(`\n${fails === 0 && errs === 0 ? 'ALL GOOD' : 'PROBLEMS'}: ${fails} failed checks, ${errs} console errors`);
await b.close(); process.exit(fails ? 1 : 0);
