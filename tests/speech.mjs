// "Speak instead of typing" through the server (pretend). Run: node tests/speech.mjs (app on :8123)
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import fs from 'fs';
const URL = process.env.URL || 'http://localhost:8123/';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });
let fails = 0;
const ok = (n, c, x = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  ' + x : '')); if (!c) fails++; };
const gallery = '/home/user/little-tales-app/assets/photos/skyline-dusk.jpg';
for (const mode of ['ok', 'not_configured']) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, permissions: ['microphone', 'camera'] });
  const p = await ctx.newPage(); let errs = 0; p.on('pageerror', (e) => { errs++; console.log('PAGE ERROR', e.message); });
  await p.addInitScript({ content: fs.readFileSync(new globalThis.URL('./mock-supabase.js', import.meta.url), 'utf8') });
  await p.addInitScript((m) => { window.__TRANSCRIBE = m; }, mode);
  await p.goto(URL); await p.waitForTimeout(1000);
  await p.click('text=Start my album'); await p.fill('.signin input[type=email]', 'a@example.com'); await p.click('text=Email me a code'); await p.waitForTimeout(400);
  await p.fill('.code-input', '123456'); await p.waitForTimeout(1500);
  await p.click('.check'); await p.click('text=Start my free week'); await p.waitForTimeout(1200); await p.click('.intro-top .link'); await p.waitForTimeout(600);
  await p.click('#tabbar .tab-new'); await p.setInputFiles('input[type=file]:not([capture])', gallery); await p.waitForTimeout(1200);
  await p.click('.dictate'); await p.waitForTimeout(1200);
  if (mode === 'ok') {
    ok('first tap starts listening', (await p.locator('.dictate .dl').innerText()).includes('Listening'));
    await p.click('.dictate'); await p.waitForTimeout(1500);
    ok('second tap writes the spoken words into the box', (await p.inputValue('.thought-input')) === 'The chai was perfect today', await p.inputValue('.thought-input'));
    ok('button is back to normal', (await p.locator('.dictate .dl').innerText()) === 'Speak instead of typing');
  } else {
    ok('server not ready: listening still starts', (await p.locator('.dictate .dl').innerText()).includes('Listening'));
    await p.click('.dictate'); await p.waitForTimeout(1500);
    ok('server not ready: falls back to the keyboard microphone tip', (await p.locator('.dict-tip').innerText()).toLowerCase().includes('microphone'));
  }
  ok('no page errors', errs === 0);
  await ctx.close();
}
await b.close(); console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED'); process.exit(fails ? 1 : 0);
