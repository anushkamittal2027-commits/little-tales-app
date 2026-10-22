// Little Tales service worker: works offline, opens fast, and shows the gentle nudges.
const CACHE = 'little-tales-v15';
const SHELL = ['./', 'index.html', 'manifest.webmanifest',
  'css/fonts.css', 'css/base.css', 'css/stamp.css', 'css/screens.css', 'css/decor.css',
  'js/app.js', 'js/nav.js', 'js/util.js', 'js/store.js', 'js/account.js', 'js/art.js', 'js/stamp.js', 'js/screens.js', 'js/screens2.js',
  'js/decorate.js', 'js/recorder.js', 'js/sample.js', 'js/video.js', 'js/zip.js', 'js/config.js', 'js/push.js', 'js/auth.js', 'js/sync.js', 'js/pay.js', 'js/screens3.js', 'js/install.js', 'js/backdrop.js', 'js/filters.js', 'js/speech.js', 'js/prompts.js', 'js/music.js',
  'assets/fonts/PlayfairDisplay-normal.woff2', 'assets/fonts/PlayfairDisplay-italic.woff2', 'assets/fonts/Inter-normal.woff2',
  'assets/fonts/DMMono-400.woff2', 'assets/fonts/DMMono-500.woff2', 'assets/fonts/Caveat-normal.woff2', 'assets/icons/icon-192.png', 'assets/icons/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL).catch(() => {})).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => e.waitUntil(
  caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())));

// Online: always the freshest files. Offline: whatever we kept.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req).then((r) => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then((x) => x.put(req, c)); } return r; })
      .catch(() => caches.match(req).then((hit) => hit || (req.mode === 'navigate' ? caches.match('index.html') : Response.error()))));
});

// Gentle nudges from the server (Web Push)
self.addEventListener('push', (e) => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Little Tales', {
    body: d.body || 'Anything worth keeping today?', icon: 'assets/icons/icon-192.png', badge: 'assets/icons/icon-192.png',
    tag: 'lt-nudge', data: { url: d.url || './?new=1' },
  }));
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    for (const c of list) if ('focus' in c) { c.navigate?.(url); return c.focus(); }
    return self.clients.openWindow(url);
  }));
});
