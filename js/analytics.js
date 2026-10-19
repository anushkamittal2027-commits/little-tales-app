// Microsoft Clarity: shows how people use the app (where they tap, where they get stuck). Everything inside the app is masked in
// recordings (index.html marks #app with data-clarity-mask), so photos, voice notes, thoughts and names are never captured.
import { CLARITY_ID, CANONICAL_ORIGIN } from './config.js';

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
