import { store } from './store.js';
import { start, go } from './nav.js';
import './screens.js';
import { seedSamples } from './sample.js';

let firstScreen = null;
async function boot() {
  try {
    await store.load();
    const seeded = await store.getMeta('seeded');
    if (!seeded) { await seedSamples(); await store.setMeta('seeded', true); }
    const welcomed = await store.getMeta('welcomed');
    if (!welcomed) { try { history.replaceState({ name: 'welcome', params: {}, n: 1 }, ''); } catch {} firstScreen = { name: 'welcome', params: {}, n: 1 }; }
  } catch (e) {
    console.error('Could not open storage', e);
  }
  start(firstScreen);
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}
boot();
