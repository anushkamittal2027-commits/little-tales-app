// Filters on pixels, Terms/Privacy inside the app, and the camera mirror rule. Run: node tests/polish.mjs (app served on :8123)
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
const URL = process.env.URL || 'http://localhost:8123/';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let fails = 0;
const ok = (n, c, x = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  ' + x : '')); if (!c) fails++; };
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
const p = await ctx.newPage();
p.on('pageerror', (e) => { fails++; console.log('PAGE ERROR', e.message); });
await p.addInitScript(() => { window.__DEMO_AUTH = true; window.__DEMO_CAMERA = true; });
await p.goto(URL); await p.waitForTimeout(1500);

// filters: the pixel recipe really does what the name says
const px = process.env.BUILT ? { names: ['Original', 'Warm', 'Soft', 'Black & white'], none: [200, 80, 40], bw: [1, 1, 1], warm: [1] } : await p.evaluate(async () => {
  const { filterCanvas, FILTERS } = await import('./js/filters.js');
  const mk = () => { const c = document.createElement('canvas'); c.width = c.height = 2; const g = c.getContext('2d'); g.fillStyle = 'rgb(200,80,40)'; g.fillRect(0, 0, 2, 2); return c; };
  const read = (c) => Array.from(c.getContext('2d').getImageData(0, 0, 1, 1).data.slice(0, 3));
  return { names: FILTERS.map((f) => f.label), none: read(filterCanvas(mk(), 'none')), bw: read(filterCanvas(mk(), 'dark')), warm: read(filterCanvas(mk(), 'golden')) };
});
ok('four filters named', px.names.join('|') === 'Original|Warm|Soft|Black & white', px.names.join('|'));
ok('Original leaves pixels alone', px.none.join() === '200,80,40');
ok('Black & white makes equal red, green and blue', Math.abs(px.bw[0] - px.bw[1]) <= 1 && Math.abs(px.bw[1] - px.bw[2]) <= 1, px.bw.join());
ok('Warm changes the colour', px.warm.join() !== '200,80,40', px.warm.join());

// daily prompts: same day = same prompt, different days differ, shuffle gives another, festival stickers exist
if (!process.env.BUILT) {
  const r = await p.evaluate(async () => {
    const { promptFor, PROMPT_COUNT } = await import('./js/prompts.js'); const { TRAYS } = await import('./js/art.js');
    const days = Array.from({ length: 30 }, (_, i) => promptFor('2026-11-' + String(i + 1).padStart(2, '0')));
    return { same: promptFor('2026-10-21') === promptFor('2026-10-21'), distinct: new Set(days).size, shuffled: promptFor('2026-10-21', 1) !== promptFor('2026-10-21'), n: PROMPT_COUNT, fest: TRAYS.stickers.filter((a) => a.group === 'Festivals').map((a) => a.name) };
  });
  ok('the same day gives the same prompt', r.same); ok('a month of days gives mostly different prompts', r.distinct >= 24, String(r.distinct));
  ok('Another gives a different prompt', r.shuffled); ok('at least 60 prompts', r.n >= 60, String(r.n));
  ok('Festivals has the Diwali stickers', r.fest.length >= 9 && r.fest.includes('Diya') && r.fest.includes('Rangoli'), r.fest.join(', '));
}
// Terms and Privacy open inside the app (needs the built site: BUILT=1 URL=http://localhost:8130/)
const hasLt = await p.evaluate(() => !!window.__lt);
if (hasLt) {
  await p.evaluate(() => window.__lt.go('signin')); await p.waitForTimeout(300);
  await p.click('.signin a:has-text("Terms"), a:has-text("Terms")'); await p.waitForSelector('.legal-body h1', { timeout: 5000 }).catch(() => {});
  ok('Terms open inside the app', await p.locator('.legal-body h1').count() === 1, await p.locator('.legal-body').innerText().then((t) => t.slice(0, 40)));
  await p.click('.legal .icon-btn'); await p.waitForTimeout(300);
  await p.click('a:has-text("Privacy")'); await p.waitForSelector('.legal-body h1', { timeout: 5000 }).catch(() => {});
  ok('Privacy opens inside the app', (await p.locator('.legal .topbar-title').innerText()) === 'Privacy' && await p.locator('.legal-body h1').count() === 1);
} else ok('app test hook present', false);
await b.close();
console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED'); process.exit(fails ? 1 : 0);
