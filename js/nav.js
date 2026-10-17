// Tiny router + shared bits (toast, bottom sheet, current draft).
import { h, icon } from './util.js';

export const state = {
  draft: null,                 // the tale being made right now
  month: null,                 // {y, m} month shown on the calendar
  justPosted: null,            // id of the stamp that was just posted
};

const screens = {};
export const register = (name, fn) => { screens[name] = fn; };
let guard = null;
export const setGuard = (fn) => { guard = fn; };

export const currentName = () => stack[stack.length - 1]?.name;
let current = null;
let stack = [];          // our own record of screens, so back works even where browser history is unavailable
let silent = 0;          // popstate events we caused ourselves

function render(st, dir = 'fwd') {
  current?._cleanup?.();
  const fn = screens[st.name] || screens.calendar;
  const el = fn(st.params || {});
  el.classList.add('screen'); if (dir !== 'none') el.classList.add(dir === 'back' ? 'enter-back' : 'enter-fwd');
  document.getElementById('screen').replaceChildren(el);
  document.getElementById('app').dataset.screen = st.name;
  current = el;
  drawTabs(st.name);
  window.scrollTo(0, 0);
  const sp = document.getElementById('splash'); if (sp) { sp.classList.add('gone'); setTimeout(() => sp.remove(), 500); }
}

// ---- bottom tab bar (Home, Calendar, New, Studio, Me) ----
const TAB_SCREENS = ['home', 'calendar', 'studio', 'account', 'day'];
const TABS = [['home', 'Home', 'home'], ['calendar', 'Calendar', 'calendar'], ['new', 'New', 'plus'], ['studio', 'Studio', 'sticker'], ['account', 'Me', 'user']];
let onNew = null;
export const setNewAction = (fn) => { onNew = fn; };
function drawTabs(name) {
  const app = document.getElementById('app');
  let bar = document.getElementById('tabbar');
  const show = TAB_SCREENS.includes(name);
  app.dataset.tabs = show ? '1' : '0';
  if (!show) { bar?.remove(); return; }
  if (!bar) { bar = h('nav', { id: 'tabbar', 'aria-label': 'Main' }); app.append(bar); }
  bar.replaceChildren(...TABS.map(([key, label, ic]) => key === 'new'
    ? h('button.tab-new', { 'aria-label': 'Make a new memory', onClick: () => onNew?.(), html: icon.plus })
    : h('button.tab-item' + (name === key || (key === 'calendar' && name === 'day') ? '.on' : ''), { 'aria-label': label, 'aria-current': name === key ? 'page' : null, onClick: () => { if (name !== key) go(key, {}, { replace: true }); } }, h('span.ti', { html: icon[ic] }), h('span', label))));
}

const tryHistory = (fn) => { try { fn(); return true; } catch { return false; } };

export function go(name, params = {}, { replace = false } = {}) {
  const redirect = guard?.(name); if (redirect && redirect !== name) { name = redirect; params = {}; }
  const st = { name, params, n: replace ? stack.length || 1 : stack.length + 1 };
  if (replace && stack.length) stack[stack.length - 1] = st; else stack.push(st);
  tryHistory(() => (replace ? history.replaceState(st, '') : history.pushState(st, '')));
  render(st);
}

// Draw the current screen again (for when background work, like syncing, has new things to show).
export function refresh() {
  const st = stack[stack.length - 1]; if (!st) return;
  render(st, 'none');
}

export function back(fallback = 'calendar') {
  if (stack.length > 1) {
    stack.pop();
    if (tryHistory(() => history.go(-1))) silent++;
    render(stack[stack.length - 1], 'back');
  } else go(fallback, {}, { replace: true });
}

export function start(first) {
  window.addEventListener('popstate', (e) => {
    if (silent) { silent--; return; }
    const st = e.state && e.state.name ? e.state : { name: 'calendar', params: {}, n: 1 };
    stack.length = Math.max(1, st.n || 1);
    stack[stack.length - 1] = st;
    render(st, 'back');
  });
  let st = null;
  try { st = history.state && history.state.name ? history.state : null; } catch {}
  st = first || st || { name: 'calendar', params: {}, n: 1 };
  const rd = guard?.(st.name); if (rd && rd !== st.name) st = { name: rd, params: {}, n: 1 };
  stack = [];
  for (let i = 1; i < (st.n || 1); i++) stack.push({ name: 'calendar', params: {}, n: i });
  stack.push(st);
  tryHistory(() => history.replaceState(st, ''));
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
