// "Add to Home Screen": a shortcut icon that opens Little Tales full screen, like an app (no app store needed).
import { h, icon } from './util.js';
import { sheet, toast } from './nav.js';
import { account, patchAccount } from './account.js';

export const isStandalone = () => !!(window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone);
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const canOfferInstall = () => !isStandalone();

const step = (n, body, ic) => h('div.hs-step', h('span.hs-n', n), h('span.hs-t', body), ic ? h('span.hs-ic', { html: ic }) : null);

// Which kind of phone and browser is this? Each needs different steps.
export function detectPlatform(ua = navigator.userAgent, touch = navigator.maxTouchPoints, platform = navigator.platform) {
  const ios = /iphone|ipad|ipod/i.test(ua) || (platform === 'MacIntel' && touch > 1);
  const android = /android/i.test(ua);
  const inApp = /FBAN|FBAV|Instagram|Line\/|Snapchat|Twitter|LinkedInApp|MicroMessenger|GSA\//i.test(ua) || (/WhatsApp/i.test(ua));
  let browser = 'other';
  if (/EdgA|EdgiOS|Edg\//i.test(ua)) browser = 'edge';
  else if (/SamsungBrowser/i.test(ua)) browser = 'samsung';
  else if (/FxiOS|Firefox/i.test(ua)) browser = 'firefox';
  else if (/CriOS|Chrome/i.test(ua)) browser = 'chrome';
  else if (/Safari/i.test(ua)) browser = 'safari';
  return { os: ios ? 'ios' : android ? 'android' : 'desktop', browser, inApp, ipad: /ipad/i.test(ua) || (platform === 'MacIntel' && touch > 1) };
}

function stepsFor(pl) {
  if (pl.inApp) return { note: 'This page is open inside another app (like Instagram or WhatsApp), which cannot add shortcuts.', steps: [[h('b', 'Tap the \u22ef or share button'), ' and choose \u201cOpen in Safari\u201d or \u201cOpen in browser\u201d'], ['Then tap ', h('b', 'Add to Home Screen'), ' from there']] };
  if (pl.os === 'ios') {
    if (pl.browser === 'safari') return { steps: [[h('b', 'Tap Share'), pl.ipad ? ' at the top right' : ' at the bottom of Safari', ' (the square with an arrow)'], [h('b', 'Scroll down'), ' and tap \u201cAdd to Home Screen\u201d'], [h('b', 'Tap Add'), ' (top right)']], ic: icon.share };
    if (['chrome', 'edge', 'firefox'].includes(pl.browser)) return { steps: [[h('b', 'Tap Share'), ' (square with an arrow, top right next to the address)'], [h('b', 'Tap \u201cAdd to Home Screen\u201d')], [h('b', 'Tap Add')]], ic: icon.share };
    return { steps: [[h('b', 'Open this page in Safari'), ' (iPhone only allows it there)'], [h('b', 'Tap Share'), ', then \u201cAdd to Home Screen\u201d']], ic: icon.share };
  }
  if (pl.os === 'android') {
    if (pl.browser === 'samsung') return { steps: [[h('b', 'Tap the \u2630 menu'), ' at the bottom right'], [h('b', 'Tap \u201cAdd page to\u201d'), ' then \u201cHome screen\u201d'], [h('b', 'Tap Add')]] };
    if (pl.browser === 'firefox') return { steps: [[h('b', 'Tap the \u22ee menu'), ' at the top right'], [h('b', 'Tap \u201cInstall\u201d'), ' (or \u201cAdd to Home screen\u201d)'], [h('b', 'Tap Add')]] };
    return { steps: [[h('b', 'Tap the \u22ee menu'), ' at the top right of Chrome'], [h('b', 'Tap \u201cInstall app\u201d'), ' or \u201cAdd to Home screen\u201d'], [h('b', 'Tap Install')]] };
  }
  return { steps: [[h('b', 'Click the install icon'), ' at the right end of the address bar (or the \u22ee menu, then \u201cInstall Little Tales\u201d)']] };
}

export function addToHomeScreen() {
  const pl = detectPlatform();
  const e = window.__installPrompt;
  const done = () => patchAccount({ installHinted: true });
  if (e && pl.os !== 'ios') {                            // Android and desktop Chrome/Edge: the browser's own one-tap install
    e.prompt(); e.userChoice?.then((r) => { if (r?.outcome === 'accepted') { toast('Added. Open Little Tales from your home screen'); done(); } }).catch(() => {});
    window.__installPrompt = null; return;
  }
  const { steps, note, ic } = stepsFor(pl);
  const close = sheet(h('div.hs',
    h('h2', 'Keep Little Tales ', h('em', 'one tap'), ' away'),
    h('p', 'Add it to your Home Screen and it opens full screen like an app, and you stay signed in.'),
    note ? h('p.hs-note', note) : null,
    h('div.hs-steps', ...steps.map((body, i) => step(i + 1, body, i === 0 ? ic : null))),
    pl.os === 'ios' ? h('p.hs-note', 'The first time you open it from the new icon, sign in once (the email code is easiest). After that it remembers you. Don\u2019t delete the icon, or you\u2019ll sign in again.') : null,
    h('button.btn-primary', { onClick: () => { done(); close(); } }, 'Got it')));
}

// A small, dismissible card for the Home screen.
export function installCard(onChange) {
  if (!canOfferInstall() || account.installHinted) return null;
  return h('div.install-card.glass-card',
    h('span.ic-ic', { html: icon.share }),
    h('div.ic-copy', h('b', 'Put Little Tales on your home screen'), h('small', 'One tap to open, and you stay signed in')),
    h('button.btn-secondary.ic-go', { onClick: addToHomeScreen }, 'Add'),
    h('button.ic-x', { 'aria-label': 'Not now', onClick: async () => { await patchAccount({ installHinted: true }); onChange?.(); }, html: icon.close }));
}
