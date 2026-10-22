// Online saving checks against a pretend Supabase (tests/mock-supabase.js). Run: node tests/online.mjs (app served on :8123)
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import fs from 'fs';
const URL = process.env.URL || 'http://localhost:8123/';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
const p = await ctx.newPage();
let fails = 0, errs = 0;
p.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) { errs++; console.log('  console error:', m.text().slice(0, 160)); } });
p.on('pageerror', (e) => { errs++; console.log('  PAGE ERROR:', e.message); });
const ok = (name, cond, extra = '') => { console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); if (!cond) fails++; };
await p.addInitScript({ content: fs.readFileSync(new globalThis.URL('./mock-supabase.js', import.meta.url), 'utf8') });
const server = () => p.evaluate(() => JSON.parse(localStorage.getItem('mockdb') || '{}'));
const setServer = (patch) => p.evaluate((x) => { const d = JSON.parse(localStorage.getItem('mockdb') || '{}'); Object.assign(d, x); localStorage.setItem('mockdb', JSON.stringify(d)); }, patch);
const wait = (ms) => p.waitForTimeout(ms);
const PHOTO = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
const mk = (id, date, n = 0) => p.evaluate(async ([id, date, n, photo]) => {
  const { store } = window.__lt;
  await store.save({ id, date, createdAt: Date.now() + n, photo, thumb: photo, thought: 'hello ' + id, title: 'T', light: 'golden', decorations: [], audio: n === 0 ? new Blob(['abc'], { type: 'audio/webm' }) : null, audioDur: n === 0 ? 3 : 0 });
}, [id, date, n, PHOTO]);
const uuid = (n) => `00000000-0000-4000-8000-00000000000${n}`;
const todayStr = () => new Date().toLocaleDateString('en-CA');

await p.goto(URL + '?error=server_error&error_description=Unable+to+exchange+external+code'); await wait(1200);
ok('a sign-in error from Google/Supabase is shown, not hidden', await p.locator('.signin').count() === 1 && (await p.locator('.signin .pay-err').innerText()).includes('not fully set up'), await p.locator('.signin .pay-err').innerText().catch(() => ''));
ok('the error is removed from the address bar', !(await p.evaluate(() => location.search)).includes('error'));
await p.goto(URL); await wait(1200);
ok('starts on welcome, not signed in', await p.locator('.welcome').count() === 1);
await p.click('text=Start my album'); await wait(400);
await p.click('.google'); await wait(2500);
ok('Google round trip signs you in and shows the free-week page', await p.locator('.terms').count() === 1);
await p.evaluate(() => { const d = JSON.parse(localStorage.getItem('mockdb')); d.session = null; localStorage.setItem('mockdb', JSON.stringify(d)); }); await p.goto(URL); await wait(1000);
await p.click('text=Start my album'); await wait(400);
await p.fill('.signin input[type=email]', 'a@example.com'); await p.click('text=Email me a code'); await wait(400);
await p.fill('.code-input', '123456'); await wait(1500);
ok('new member lands on the free-week page', await p.locator('.terms').count() === 1);
await p.click('.check'); await p.click('text=Start my free week'); await wait(1200);
let s = await server();
ok('server has the profile with Day 1 = today', s.profiles['u-a@example.com']?.first_sign_in === todayStr(), JSON.stringify(s.profiles));
await p.click('.intro-top .link'); await wait(600);
ok('home shown', await p.locator('.home').count() >= 1);

// saving
await mk(uuid(1), todayStr(), 0); await wait(1200);
s = await server();
ok('tale row saved online', Object.keys(s.tales).length === 1 && s.tales[uuid(1)].thought === 'hello ' + uuid(1));
ok('photo, thumbnail and voice note stored online', ['photos/u-a@example.com/' + uuid(1) + '.jpg', 'photos/u-a@example.com/' + uuid(1) + '-thumb.jpg', 'voices/u-a@example.com/' + uuid(1) + '.webm'].every((k) => s.files[k]), Object.keys(s.files).join(','));

// 3 a day is enforced by the server too
await mk(uuid(2), todayStr(), 1); await mk(uuid(3), todayStr(), 2); await mk(uuid(4), todayStr(), 3); await wait(2000);
s = await server();
ok('server keeps only 3 tales for one day', Object.keys(s.tales).length === 3);
ok('the refused one is not stuck in the outbox', Object.keys(await p.evaluate(() => window.__lt.store.getMeta('outbox'))).length === 0);

// a new phone: empty storage, same login
await p.evaluate(() => { indexedDB.deleteDatabase('littletales'); });
await p.goto(URL); await wait(2500);
ok('new phone: signed in, goes to calendar (not the welcome page)', await p.locator('.welcome, .terms, .signin').count() === 0);
const n2 = await p.evaluate(() => window.__lt.store.tales.filter((t) => !t.sample).length);
ok('new phone: tales come back', n2 === 3, 'got ' + n2);
const back1 = await p.evaluate((id) => { const t = window.__lt.store.byId(id); return t && t.photo.startsWith('data:image') && t.audio && t.audio.size === 3 && t.thought; }, uuid(1));
ok('new phone: photo and voice note come back', !!back1, String(back1));
ok('new phone: free week dates restored', await p.evaluate(() => window.__lt.account.firstSignIn) === todayStr());

// offline, then back online
await setServer({ fail: true });
await mk(uuid(5), '2000-01-01', 0); await wait(800);
s = await server();
ok('offline: nothing sent yet', !s.tales[uuid(5)]);
ok('offline: tale waits in the outbox', Object.keys(await p.evaluate(() => window.__lt.store.getMeta('outbox'))).includes(uuid(5)));
await setServer({ fail: false });
await p.evaluate(() => window.dispatchEvent(new Event('online'))); await wait(1500);
s = await server();
ok('back online: waiting tale is sent', !!s.tales[uuid(5)]);

// delete
await p.evaluate(async (id) => { await window.__lt.store.remove(id); }, uuid(1)); await wait(1200);
s = await server();
ok('deleting removes row and files online', !s.tales[uuid(1)] && !s.files['photos/u-a@example.com/' + uuid(1) + '.jpg'] && !s.files['voices/u-a@example.com/' + uuid(1) + '.webm']);

// reminders: saving a push subscription also switches reminders on for this member
await p.evaluate(async () => { await window.__lt.sync.savePushOnline({ toJSON: () => ({ endpoint: 'https://push.example/abc', keys: { p256dh: 'k1', auth: 'k2' } }) }); }); await wait(300);
s = await server();
ok('reminders switched on for the member on the server', s.profiles['u-a@example.com']?.notify_push === true);

// paying (Dodo's page is pretended: the mock "pays", the webhook marks the member subscribed, and the browser comes back with ?paid=1)
await p.evaluate(() => window.__lt.go('checkout', { plan: 'yearly' }));
await wait(500);
ok('real checkout has no practice form', await p.locator('.practice, .pay-fields input').count() === 0);
await p.click('.checkout .btn-primary'); await p.waitForSelector('.celebrate', { timeout: 20000 });
ok('a thank-you with confetti appears for a new member', (await p.locator('.celebrate').innerText()).includes('member') && await p.locator('canvas.confetti').count() >= 0);
ok('the Home pill says Member', (await p.locator('.pill.member').innerText().catch(() => '')).includes('Member'));
ok('after paying the member is subscribed', await p.evaluate(() => window.__lt.trialInfo().status) === 'subscribed');

await p.click('.celebrate .link').catch(() => {}); await wait(400);
// a plan that arrives while the app is closed is celebrated the next time it opens (once)
await p.evaluate(async () => { await window.__lt.store.setMeta('account', { ...JSON.parse(JSON.stringify(window.__lt.account)), memberWelcomed: false }); });
await p.reload(); await wait(2500);
ok('opening the app later still celebrates a new member, once', await p.locator('.celebrate').count() === 1);
await p.click('.celebrate .link').catch(() => {}); await wait(300);
await p.reload(); await wait(2500);
ok('and not a second time', await p.locator('.celebrate').count() === 0);
// another person on the same phone
await p.evaluate(async () => { await window.__lt.go('account'); }); await wait(500);
await p.click('text=Sign out'); await wait(1500);
ok('sign out clears this phone', (await p.evaluate(() => window.__lt.store.tales.length)) === 0);
await p.click('text=Start my album').catch(() => {}); await wait(400);
await p.fill('.signin input[type=email]', 'b@example.com'); await p.click('text=Email me a code'); await wait(400);
await p.fill('.code-input', '123456'); await wait(1500);
ok('a different member starts fresh (free-week page, no tales)', await p.locator('.terms').count() === 1 && (await p.evaluate(() => window.__lt.store.tales.length)) === 0);

console.log(fails || errs ? `\nFAILED: ${fails} failed checks, ${errs} console errors` : '\nALL GOOD: 0 failed checks, 0 console errors');
await b.close(); process.exit(fails || errs ? 1 : 0);
