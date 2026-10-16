import { store } from './store.js';
import { start, setGuard } from './nav.js';
import './screens.js';
import './screens2.js';
import { seedSamples } from './sample.js';
import { ensureStampClip } from './stamp.js';
import { account, loadAccount, trialInfo, jumpTo } from './account.js';
import { go } from './nav.js';
import { setDayOffset } from './util.js';

// Android/Chrome offers "install" through this event; we show our own button on the install screen.
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); window.__installPrompt = e; });

const OPEN = {
  new: ['welcome', 'terms'],
  locked: ['locked', 'paywall', 'checkout', 'success', 'account', 'install'],
  deleted: ['locked', 'account', 'welcome', 'terms'],
};

async function boot() {
  ensureStampClip();
  try {
    await store.load();
    await loadAccount();
    const seeded = await store.getMeta('seeded');
    if (window.__SEED !== false && !seeded) { await seedSamples(); await store.setMeta('seeded', true); }
    // After 30 days locked, tales are permanently deleted.
    if (trialInfo().status === 'deleted' && store.tales.length) await store.clear();
  } catch (e) {
    console.error('Could not open storage', e);
  }
  setGuard((name) => {
    const s = trialInfo().status;
    const allowed = OPEN[s];
    if (!allowed) return null;
    return allowed.includes(name) ? null : (s === 'new' ? 'welcome' : 'locked');
  });
  if (location.hostname === 'localhost' || window.__DEMO_CAMERA) window.__lt = { account, store, jumpTo, trialInfo, go, setDayOffset };
  start(trialInfo().status === 'new' ? { name: 'welcome', params: {}, n: 1 } : null);
  if (new URLSearchParams(location.search).get('new') === '1' && trialInfo().status !== 'new' && !['locked', 'deleted'].includes(trialInfo().status)) { history.replaceState(null, '', location.pathname); const { startToday } = await import('./screens.js'); startToday?.(); }
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}
boot();
