// Gentle nudges: subscribes this phone to reminders. The server (supabase/functions/nudges) sends them.
import { CONFIG } from './config.js';
import { store } from './store.js';
import { savePushOnline } from './sync.js';

const toBytes = (b64) => { const p = '='.repeat((4 - (b64.length % 4)) % 4); const s = atob((b64 + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from([...s].map((c) => c.charCodeAt(0))); };

export async function subscribePush() {
  if (!CONFIG.VAPID_PUBLIC_KEY || !('serviceWorker' in navigator) || !('PushManager' in window)) return null;
  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toBytes(CONFIG.VAPID_PUBLIC_KEY) });
    await store.setMeta('pushSub', sub.toJSON());
    await savePushOnline(sub);
    return sub;
  } catch (e) { console.warn('Push subscribe failed', e); return null; }
}
