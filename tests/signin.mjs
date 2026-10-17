// Google's own button and the "stay signed in" safety net (pretend server).   node tests/signin.mjs   (app served on :8123)
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import fs from 'fs';
const URL = process.env.URL || 'http://localhost:8123/';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let fails = 0, errs = 0;
const ok = (n, c, x = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  ' + x : '')); if (!c) fails++; };
async function page(initExtra) {
  const ctx = await b.newContext({ viewport: { width: 393, height: 780 }, hasTouch: true });
  const p = await ctx.newPage();
  p.on('console', (m) => { if (m.type() === 'error' && !/404|net::ERR|Failed to load resource/.test(m.text())) { errs++; console.log('  console error:', m.text().slice(0, 160)); } });
  p.on('pageerror', (e) => { errs++; console.log('  PAGE ERROR:', e.message); });
  await p.addInitScript({ content: fs.readFileSync(new globalThis.URL('./mock-supabase.js', import.meta.url), 'utf8') });
  if (initExtra) await p.addInitScript(initExtra);
  return p;
}

// ---- with Google's button available ----
{
  const p = await page(() => {
    window.__GOOGLE_CLIENT_ID = 'test-client.apps.googleusercontent.com';
    window.__gsi = {};
    window.google = { accounts: { id: {
      initialize(o) { window.__gsi.init = o; },
      renderButton(el) { const bt = document.createElement('button'); bt.className = 'fake-gsi'; bt.textContent = 'Continue with Google (Google)'; bt.onclick = () => window.__gsi.init.callback({ credential: window.__gsi.token || 'good-google-token' }); el.append(bt); },
    } } };
  });
  await p.goto(URL); await p.waitForTimeout(1200);
  await p.click('text=Start my album'); await p.waitForTimeout(700);
  ok("Google's own button is shown", await p.locator('.gsi-slot .fake-gsi').isVisible());
  ok('the old redirect button is hidden while it works', !(await p.locator('button.google').isVisible()));
  const init = await p.evaluate(() => ({ id: window.__gsi.init.client_id, nonce: window.__gsi.init.nonce }));
  ok('client id and a hashed nonce are given to Google', init.id.startsWith('test-client') && /^[0-9a-f]{64}$/.test(init.nonce), init.nonce.slice(0, 12));
  await p.click('.fake-gsi'); await p.waitForTimeout(1500);
  ok('picking a Google account signs in and moves on', await p.evaluate(() => document.getElementById('app').dataset.screen) === 'terms');
  const raw = await p.evaluate(() => window.__idTokenNonce);
  const hashed = await p.evaluate(async (r) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(r)))].map((x) => x.toString(16).padStart(2, '0')).join(''), raw);
  ok('Supabase gets the raw nonce whose hash Google signed', hashed === init.nonce);
  await p.context().close();
}
// ---- a bad token shows a friendly message, email still works ----
{
  const p = await page(() => {
    window.__GOOGLE_CLIENT_ID = 'test-client.apps.googleusercontent.com'; window.__gsi = { token: 'bad' };
    window.google = { accounts: { id: { initialize(o) { window.__gsi.init = o; }, renderButton(el) { const bt = document.createElement('button'); bt.className = 'fake-gsi'; bt.textContent = 'G'; bt.onclick = () => window.__gsi.init.callback({ credential: window.__gsi.token }); el.append(bt); } } } };
  });
  await p.goto(URL); await p.waitForTimeout(1200); await p.click('text=Start my album'); await p.waitForTimeout(700);
  await p.click('.fake-gsi'); await p.waitForTimeout(1000);
  ok('a refused Google token shows a message and stays on sign-in', await p.locator('.signin .pay-err').innerText().then((t) => /didn.t work/.test(t)).catch(() => false));
  await p.context().close();
}
// ---- Google's button cannot load: the old button is shown ----
{
  const p = await page(() => { window.__GOOGLE_CLIENT_ID = 'test-client.apps.googleusercontent.com'; });
  await p.route('https://accounts.google.com/**', (r) => r.abort());
  await p.goto(URL); await p.waitForTimeout(1200); await p.click('text=Start my album'); await p.waitForTimeout(1500);
  ok('if Google cannot load, the usual Google button is shown', await p.locator('button.google').isVisible());
  await p.context().close();
}
// ---- no client id yet: nothing changes ----
{
  const p = await page();
  await p.goto(URL); await p.waitForTimeout(1200); await p.click('text=Start my album'); await p.waitForTimeout(700);
  ok('without a client id the usual button is shown', await p.locator('button.google').isVisible() && await p.locator('.gsi-slot').evaluate((e) => e.style.display === 'none'));
  ok('the details panel can show recent sign-in events', await p.locator('details.diag pre').count() === 1);
  await p.context().close();
}
await b.close();
console.log(`\n${fails ? 'FAILED ' + fails : 'ALL PASSED'} (console errors: ${errs})`);
process.exit(fails || errs ? 1 : 0);
