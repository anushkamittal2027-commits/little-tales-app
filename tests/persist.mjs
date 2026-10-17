// Does the saved sign-in survive reloads, an expired token and a weak connection? Uses the REAL sign-in library against a pretend server.
// Needs the built website served: cd dist/site && python3 -m http.server 8130      node tests/persist.mjs
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await b.newContext({ viewport: { width: 393, height: 780 } });
const p = await ctx.newPage();
const log = []; let refreshes = 0; let failRefresh = false;
const now = () => Math.floor(Date.now() / 1000);
const session = (exp = 3600) => ({ access_token: 'a.b.c', token_type: 'bearer', expires_in: exp, expires_at: now() + exp, refresh_token: 'r' + Math.random().toString(36).slice(2), user: { id: 'u-real', aud: 'authenticated', email: 'real@example.com', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() } });
const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
await ctx.route('https://vnorlnjsvknhsvjfczyl.supabase.co/**', async (route) => {
  const req = route.request(), url = req.url(); log.push(req.method() + ' ' + url.replace('https://vnorlnjsvknhsvjfczyl.supabase.co', '').slice(0, 70));
  if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
  const json = (o, s = 200) => route.fulfill({ status: s, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify(o) });
  if (url.includes('/auth/v1/otp')) return json({});
  if (url.includes('/auth/v1/verify')) return json(session());
  if (url.includes('grant_type=refresh_token')) { refreshes++; return failRefresh ? json({ error: 'x' }, 503) : json(session()); }
  if (url.includes('/auth/v1/user')) return json(session().user);
  if (url.includes('/rest/v1/profiles')) return json(req.headers()['accept']?.includes('vnd.pgrst.object') ? { id: 'u-real', first_sign_in: new Date().toISOString().slice(0, 10), consented_at: new Date().toISOString(), tz: 'UTC' } : [{ id: 'u-real', first_sign_in: new Date().toISOString().slice(0, 10), consented_at: new Date().toISOString(), tz: 'UTC' }]);
  if (url.includes('/rest/v1/')) return json(req.headers()['accept']?.includes('vnd.pgrst.object') ? null : []);
  return json({});
});
p.on('console', (m) => console.log('  console:', m.text().slice(0, 160))); p.on('pageerror', (e) => console.log('PAGE ERROR', e.message));
await p.goto('http://localhost:8130/'); await p.waitForTimeout(1500);
await p.click('text=Start my album'); await p.waitForTimeout(600); await p.fill('.signin input[type=email]', 'real@example.com'); await p.click('text=Email me a code'); await p.waitForTimeout(500);
await p.waitForTimeout(800); console.log('screen:', await p.evaluate(() => document.getElementById('app').dataset.screen), log.slice(-4), await p.locator('.pay-err').first().innerText().catch(() => 'no err')); await p.fill('.code-input', '12345678'); await p.waitForTimeout(2500);
console.log('after code:', await p.evaluate(() => document.getElementById('app').dataset.screen));
const keys = await p.evaluate(() => Object.keys(localStorage)); console.log('storage keys:', keys);
await p.reload(); await p.waitForTimeout(2500);
console.log('after reload 1:', await p.evaluate(() => document.getElementById('app').dataset.screen));
// expire the access token and reload: should silently refresh
await p.evaluate(() => { const k = Object.keys(localStorage).find((x) => x.includes('auth-token')); const s = JSON.parse(localStorage.getItem(k)); s.expires_at = Math.floor(Date.now() / 1000) - 100; localStorage.setItem(k, JSON.stringify(s)); });
await p.reload(); await p.waitForTimeout(3000);
console.log('after reload with EXPIRED access token:', await p.evaluate(() => document.getElementById('app').dataset.screen), 'refresh calls:', refreshes);
// expire AND the refresh server is unreachable/busy (503): the member must not be signed out
failRefresh = true;
await p.evaluate(() => { const k = Object.keys(localStorage).find((x) => x.includes('auth-token')); const s = JSON.parse(localStorage.getItem(k)); s.expires_at = Math.floor(Date.now() / 1000) - 100; localStorage.setItem(k, JSON.stringify(s)); });
await p.reload(); await p.waitForTimeout(4000);
const last = await p.evaluate(() => document.getElementById('app').dataset.screen); const kept = await p.evaluate(() => !!localStorage.getItem(Object.keys(localStorage).find((x) => x.includes('auth-token')) || 'x'));
console.log('after reload, expired token AND refresh failing (503):', last, 'sign-in kept:', kept);
// the phone clears its small saved-sign-in note but our own backup copy survives: the member is still signed in
failRefresh = false;
await p.evaluate(() => { for (const k of Object.keys(localStorage)) if (k.includes('auth-token')) localStorage.removeItem(k); });
await p.reload(); await p.waitForTimeout(3000);
const restored = await p.evaluate(() => document.getElementById('app').dataset.screen); const back = await p.evaluate(() => Object.keys(localStorage).some((x) => x.includes('auth-token')));
console.log('after the saved note was wiped (backup copy used):', restored, 'note restored:', back);
if (restored !== 'home' || !back) { console.log('FAIL: backup copy should keep the member signed in'); process.exitCode = 1; } else console.log('PASS: backup copy restores the sign-in');
// a real sign-out must NOT be undone by the backup
await p.click('#tabbar .tab-item >> nth=3'); await p.waitForTimeout(500); await p.click('text=Sign out'); await p.waitForTimeout(500); await p.locator('.sheet >> text=Sign out anyway').click({ timeout: 1500 }).catch(() => {});
await p.waitForTimeout(800); await p.reload(); await p.waitForTimeout(2500);
const afterOut = await p.evaluate(() => document.getElementById('app').dataset.screen);
console.log('after sign-out and reload:', afterOut);
if (afterOut === 'home') { console.log('FAIL: signed-out member came back in'); process.exitCode = 1; } else console.log('PASS: sign-out stays signed out');
const good = [['after code', 'home'], ['after reload 1', 'home']];
if (last !== 'home' || !kept) { console.log('FAIL: a weak connection must not sign the member out'); process.exitCode = 1; } else console.log('PASS: weak connection keeps the member in');
await b.close();
