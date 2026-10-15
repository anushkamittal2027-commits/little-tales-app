// Tiny router + shared bits (toast, bottom sheet, current draft).
import { h, icon } from './util.js';

export const state = {
  draft: null,                 // the tale being made right now
  month: null,                 // {y, m} month shown on the calendar
  justPosted: null,            // id of the stamp that was just posted
};

const screens = {};
export const register = (name, fn) => { screens[name] = fn; };

let current = null;
let seq = 0;

function render(st) {
  current?._cleanup?.();
  const fn = screens[st.name] || screens.calendar;
  const el = fn(st.params || {});
  el.classList.add('screen', 'fade-in');
  document.getElementById('screen').replaceChildren(el);
  current = el;
  window.scrollTo(0, 0);
}

export function go(name, params = {}, { replace = false } = {}) {
  const st = { name, params, n: replace ? (history.state?.n || 1) : ++seq };
  if (replace) history.replaceState(st, ''); else history.pushState(st, '');
  render(st);
}

export function back(fallback = 'calendar') {
  if ((history.state?.n || 1) > 1) history.back(); else go(fallback, {}, { replace: true });
}

export function start() {
  window.addEventListener('popstate', (e) => render(e.state || { name: 'calendar', params: {} }));
  const st = history.state && history.state.name ? history.state : { name: 'calendar', params: {}, n: 1 };
  seq = st.n || 1;
  history.replaceState(st, '');
  render(st);
}

// ---- toast ----
let toastTimer;
export function toast(msg) {
  document.querySelector('.toast')?.remove();
  const t = h('div.toast', { role: 'status' }, msg);
  document.getElementById('app').append(t);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('out'), 2600);
  setTimeout(() => t.remove(), 3000);
}

// ---- bottom sheet ----
export function sheet(content, { onClose } = {}) {
  const close = () => { s.classList.add('out'); setTimeout(() => s.remove(), 200); onClose?.(); };
  const s = h('div.sheet-backdrop', { onClick: (e) => { if (e.target === s) close(); } },
    h('div.sheet', { role: 'dialog' },
      h('button.sheet-x', { 'aria-label': 'Close', onClick: close, html: icon.close }),
      content));
  document.getElementById('app').append(s);
  return close;
}
