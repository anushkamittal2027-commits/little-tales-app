import { store } from './store.js';
import { start, setGuard, go, refresh, currentName, setNewAction, toast } from './nav.js';
import { startToday } from './screens.js';
import './screens2.js';
import './screens3.js';
import { seedSamples } from './sample.js';
import { ensureStampClip } from './stamp.js';
import { account, loadAccount, trialInfo, jumpTo, patchAccount, PLANS, hooks as accountHooks } from './account.js';
import * as sync from './sync.js';
import { unlockAudio } from './recorder.js';
import { CANONICAL_ORIGIN } from './config.js';
import { setDayOffset, buzz, h } from './util.js';
import { auth, initAuth } from './auth.js';
import { loadAnalytics, loadErrorReporting } from './analytics.js';
import { BACKDROP_HTML } from './backdrop.js';
import { finishDodoReturn } from './pay.js';
import { celebrateMember } from './delight.js';

// Android/Chrome offers "install" through this event; we show our own button on the install screen.
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); window.__installPrompt = e; });

const OPEN = {
  new: ['welcome', 'signin', 'code', 'terms', 'intro', 'legal'],
  locked: ['locked', 'paywall', 'checkout', 'success', 'account', 'legal'],
  deleted: ['locked', 'account', 'welcome', 'terms', 'paywall', 'checkout', 'success', 'legal'],
};

let signedInSynced = false;
const TOUCH_SAFE = ['home', 'calendar', 'studio', 'account', 'day'];
// Tales and plan arrive from the server in the background; redraw only when someone is just looking around.
async function syncInBackground() {
  try { await sync.onSignedIn(); } catch (e) { console.warn('Sync failed', e); sync.syncState.pulling = false; }
}

// One address, one saved sign-in: the old free address sends people to the real one.
// (preview links such as redesign.little-tales-app.pages.dev are left alone so a new design can be tried before it goes live)
if (['littletales.pages.dev', 'little-tales-app.pages.dev'].includes(location.hostname) && !window.__DEMO_AUTH) location.replace(CANONICAL_ORIGIN + location.pathname + location.search + location.hash);

// The first touch anywhere unlocks sound for the rest of the visit (phones refuse sound until someone has touched the page).
for (const ev of ['touchend', 'pointerup', 'click']) window.addEventListener(ev, () => unlockAudio(), { once: true, passive: true });

// A tiny vibration on taps (phones that can't vibrate simply ignore it). Follows the "Sound and vibration" setting.
window.addEventListener('pointerdown', (e) => {
  try {
    if (account.settings.sound === false || e.pointerType === 'mouse') return;
    const el = e.target.closest?.('button, a, .cell, .tile, [role=button]');
    if (el && !el.disabled && !el.closest('.camera')) buzz(6);
  } catch {}
}, { passive: true });

// The first time someone is a member: back to Home, confetti and a thank-you.
async function welcomeMemberIfNew() {
  if (!account.subscription || account.memberWelcomed) return;
  await patchAccount({ memberWelcomed: true });
  if (!['home'].includes(currentName())) go('home', {}, { replace: true });
  setTimeout(() => celebrateMember(PLANS[account.subscription.plan]?.name), 500);
}

async function boot() {
  ensureStampClip();
  { const bd = document.getElementById('backdrop'); if (bd) bd.innerHTML = BACKDROP_HTML; }
  try {
    await store.load();
    await loadAccount();
    sync.install();
    accountHooks.startTrial = sync.startTrialOnline;
    auth.beforeSignOut = async () => { await sync.flush(); await sync.wipeLocal(); };
    auth.afterSignIn = sync.onSignedIn;
    sync.hooks.talesArrived = () => { if (TOUCH_SAFE.includes(currentName())) refresh(); };
    await initAuth();
    try { if (auth.user) navigator.storage?.persist?.(); } catch {}   // ask the phone not to clear our saved sign-in and tales when space is low
    // First time on this phone: ask the server who this member is (their free-week dates) before choosing the first screen.
    if (auth.user && trialInfo().status === 'new') { await Promise.race([sync.onSignedIn().catch(() => {}), new Promise((r) => setTimeout(r, 5000))]); signedInSynced = true; }
    const seeded = await store.getMeta('seeded');
    if (window.__SEED !== false && !seeded && auth.provider === 'demo') { await seedSamples(); await store.setMeta('seeded', true); }
    // After 30 days locked, tales are permanently deleted.
    if (trialInfo().status === 'deleted' && store.tales.length) await store.clear();
  } catch (e) {
    console.error('Could not open storage', e);
  }
  setGuard((name) => {
    if (!auth.user) return ['welcome', 'signin', 'code', 'legal'].includes(name) ? null : 'welcome';       // signed out: only the front door
    const s = trialInfo().status;
    const allowed = OPEN[s];
    if (!allowed) return null;
    return allowed.includes(name) ? null : (s === 'new' ? 'welcome' : 'locked');
  });
  if (location.hostname === 'localhost' || window.__DEMO_CAMERA) window.__lt = { account, store, jumpTo, trialInfo, go, setDayOffset, auth, sync };
  setNewAction(startToday);
  auth.onChange = async (event, user) => {
    if (event === 'SIGNED_OUT' && !user && !auth.manualSignOut && !['welcome', 'signin', 'code'].includes(currentName())) { go('signin', { error: 'For your safety you were signed out. Please sign in again.' }, { replace: true }); return; }
    // Google finished signing in (the page may have come back from Google a moment ago)
    if (event === 'SIGNED_IN' && user && !auth.manual && ['welcome', 'signin', 'code'].includes(currentName())) {
      await Promise.race([sync.onSignedIn().catch(() => {}), new Promise((r) => setTimeout(r, 5000))]);
      go(trialInfo().status === 'new' ? 'terms' : 'home', {}, { replace: true });
    }
  };
  const first = !auth.user ? (auth.error ? { name: 'signin', params: { error: auth.error }, n: 1 } : { name: 'welcome', params: {}, n: 1 })
    : trialInfo().status === 'new' ? { name: 'terms', params: {}, n: 1 } : { name: 'home', params: {}, n: 1 };
  if (auth.user && auth.provider === 'supabase' && !signedInSynced && !store.tales.length) { sync.syncState.pulling = true; setTimeout(() => { sync.syncState.pulling = false; }, 30000); }
  start(first);
  setTimeout(() => { loadAnalytics(); loadErrorReporting(); }, 1500);               // after the first screen is up, so it never slows opening
  if (auth.user && auth.provider === 'supabase' && !signedInSynced) syncInBackground();
  if (auth.user && auth.provider === 'supabase' && /[?&]paid=1/.test(location.search)) {      // back from the payment page
    const wait = h('div.cel-backdrop.confirming', h('div.celebrate', h('div.spin'), h('h2', 'Confirming your payment\u2026'), h('p.cel-body', 'This takes a few seconds. Please keep this page open.')));
    finishDodoReturn((on) => { if (on) document.getElementById('app')?.append(wait); else wait.remove(); }).then((ok) => { if (ok === true) welcomeMemberIfNew(); else if (ok === false) toast('Your payment is being confirmed. We will unlock everything as soon as it arrives.'); });
  }
  welcomeMemberIfNew();                       // a subscription that arrived while the app was closed is celebrated the next time it opens
  document.addEventListener('visibilitychange', async () => { if (document.visibilityState === 'visible' && auth.user && auth.provider === 'supabase' && !account.memberWelcomed) { try { await sync.pullAccount(); } catch {} welcomeMemberIfNew(); } });
  if (new URLSearchParams(location.search).get('new') === '1' && trialInfo().status !== 'new' && !['locked', 'deleted'].includes(trialInfo().status)) { history.replaceState(null, '', location.pathname); const { startToday } = await import('./screens.js'); startToday?.(); }
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}
boot();
