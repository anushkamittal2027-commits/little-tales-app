// Microphone and voice-to-text checks (the browser's speech recognition is pretended).  node tests/voice.mjs
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
const URL = process.env.URL || 'http://localhost:8123/';
const gallery = '/home/user/LittleTales/assets/photos/skyline-dusk.jpg';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, permissions: ['microphone'], hasTouch: true });
const p = await ctx.newPage();
let fails = 0, errs = 0;
p.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) { errs++; console.log('  console error:', m.text().slice(0, 140)); } });
p.on('pageerror', (e) => { errs++; console.log('  PAGE ERROR:', e.message); });
const ok = (n, c, x = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  ' + x : '')); if (!c) fails++; };
await p.addInitScript(() => {
  window.__DEMO_AUTH = true;
  window.SpeechRecognition = class { start() { window.__sr = this; setTimeout(() => this.onstart?.(), 20); } stop() { setTimeout(() => this.onend?.(), 20); } };
});
await p.goto(URL); await p.waitForTimeout(900);
await p.click('text=Start my album'); await p.click('.google'); await p.waitForTimeout(700); await p.click('.check'); await p.click('text=Start my free week'); await p.waitForTimeout(400); await p.click('.intro-top .link'); await p.waitForTimeout(500);
await p.evaluate(() => window.__lt.store.removeSamples());
await p.click('.hh-cta'); await p.waitForTimeout(300);
await p.screenshot({ path: '/tmp/s/v1.png' }); await p.setInputFiles('input[type=file]:not([capture])', gallery); await p.waitForTimeout(1000);
ok('thought screen shown', await p.locator('.thought').count() === 1);

// dictation: words appear in the box, stay editable
await p.click('.dictate'); await p.waitForTimeout(200);
ok('dictation shows listening state', (await p.locator('.dictate').innerText()).includes('Listening'));
await p.evaluate(() => { const r = window.__sr; r.onresult({ resultIndex: 0, results: [Object.assign([{ transcript: 'The chai was perfect today' }], { isFinal: true })] }); });
ok('spoken words land in the text box', (await p.inputValue('.thought-input')) === 'The chai was perfect today', await p.inputValue('.thought-input'));
await p.click('.dictate'); await p.waitForTimeout(200);
await p.fill('.thought-input', (await p.inputValue('.thought-input')) + ' and warm');
ok('the text stays editable', (await p.inputValue('.thought-input')).endsWith('and warm'));
await p.click('.dictate'); await p.waitForTimeout(100);
await p.evaluate(() => window.__sr.onerror({ error: 'not-allowed' })); await p.waitForTimeout(100);
ok('blocked microphone gives a clear message', (await p.locator('.mic-status').innerText()).toLowerCase().includes('block'), await p.locator('.mic-status').innerText());

// voice note: tap to start, tap to stop
await p.click('.mic'); await p.waitForTimeout(1500);
ok('recording is shown', (await p.locator('.mic-label').innerText()).includes('tap to stop'));
await p.click('.mic'); await p.waitForTimeout(900);
ok('voice note kept', await p.locator('.voice-pill').count() === 1);
await p.click('.voice-pill .x, .voice-pill [aria-label*="emove"]').catch(() => {}); await p.waitForTimeout(300);

// microphone refused by the browser
await p.evaluate(() => { navigator.mediaDevices.getUserMedia = () => Promise.reject(Object.assign(new Error('denied'), { name: 'NotAllowedError' })); });
if (await p.locator('.mic').count()) { await p.click('.mic'); await p.waitForTimeout(500); }
ok('refused microphone explains how to fix it', (await p.locator('.mic-status').innerText()).toLowerCase().includes('block'), await p.locator('.mic-status').innerText());

console.log(fails || errs ? `\nFAILED: ${fails} failed checks, ${errs} console errors` : '\nALL GOOD: 0 failed checks, 0 console errors');
await b.close(); process.exit(fails || errs ? 1 : 0);
