// Microsoft Clarity: shows how people use the app (where they tap, where they get stuck). Everything inside the app is masked in
// recordings (index.html marks #app with data-clarity-mask), so photos, voice notes, thoughts and names are never captured.
import { CLARITY_ID, CANONICAL_ORIGIN, SENTRY_DSN, SENTRY_KEY } from './config.js';

export const shouldLoad = (host = location.hostname, proto = location.protocol, dnt = navigator.doNotTrack) =>
  proto === 'https:' && host === new URL(CANONICAL_ORIGIN).hostname && dnt !== '1';

export function loadAnalytics() {
  try {
    if (!shouldLoad() || window.clarity || window.__NO_ANALYTICS) return;
    const c = window, a = 'clarity';
    c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
    const t = document.createElement('script'); t.async = true; t.src = 'https://www.clarity.ms/tag/' + CLARITY_ID;
    document.head.appendChild(t);
  } catch { /* analytics must never break the app */ }
}

// Sentry: tells us when something breaks for someone, with no photos, thoughts or names attached.
export function loadErrorReporting() {
  try {
    if ((!SENTRY_DSN && !SENTRY_KEY) || !shouldLoad() || window.Sentry || window.__NO_ANALYTICS) return;
    const t = document.createElement('script'); t.async = true; t.crossOrigin = 'anonymous';
    const init = () => { try { window.Sentry.init({ ...(SENTRY_DSN ? { dsn: SENTRY_DSN } : {}), sendDefaultPii: false, tracesSampleRate: 0 }); } catch {} };
    if (SENTRY_DSN) { t.src = 'https://browser.sentry-cdn.com/8.38.0/bundle.min.js'; t.onload = init; }
    else { window.sentryOnLoad = init; t.src = `https://js.sentry-cdn.com/${SENTRY_KEY}.min.js`; }   // Sentry's loader script: the key picks our project
    document.head.appendChild(t);
  } catch { /* error reporting must never break the app */ }
}
