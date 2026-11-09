// Night mode: a warm "desk lamp at night" look. Off unless the member turns it on in Me
// ('day' = always the day look, 'night' = always night, 'auto' = follow the phone's dark mode). Kept on this phone.
const KEY = 'lt-theme';
const dark = window.matchMedia?.('(prefers-color-scheme: dark)');
export function themeChoice() { try { const v = localStorage.getItem(KEY); return ['day', 'night', 'auto'].includes(v) ? v : 'day'; } catch { return 'day'; } }
export function applyTheme() {
  const c = themeChoice(), night = c === 'night' || (c === 'auto' && !!dark?.matches);
  document.documentElement.dataset.theme = night ? 'night' : 'day';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', night ? '#1C2333' : '#FBF8F2');
}
export function setTheme(c) { try { localStorage.setItem(KEY, c); } catch {} applyTheme(); }
dark?.addEventListener?.('change', () => { if (themeChoice() === 'auto') applyTheme(); });
applyTheme();
