// Small helpers: dates, images, DOM.
export const MAX_PER_DAY = 3;
export const MAX_THOUGHT = 140;

const pad = (n) => String(n).padStart(2, '0');
export const toDateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
// A founder-only "time travel" offset (in days) so every trial state can be tested without waiting a week.
let dayOffset = 0;
export const setDayOffset = (n) => { dayOffset = Number(n) || 0; };
export const getDayOffset = () => dayOffset;
export const nowDate = () => new Date(Date.now() + dayOffset * 86400000);
export const todayStr = () => toDateStr(nowDate());
export const daysBetween = (a, b) => Math.round((parseDate(b) - parseDate(a)) / 86400000);
export const parseDate = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const addDays = (s, n) => { const d = parseDate(s); d.setDate(d.getDate() + n); return toDateStr(d); };

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const monthName = (m) => MONTHS[m];
export const shortDate = (s) => { const d = parseDate(s); return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`; };
export const longDate = (s) => { const d = parseDate(s); return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };
const FULLDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const dayTitle = (s) => { const d = parseDate(s); return `${FULLDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`; };
export const dotDate = (s) => { const [y, m, d] = s.split('-'); return `${d}.${m}.${y.slice(2)}`; };

export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 't' + Date.now() + Math.random().toString(36).slice(2, 8));

// Tiny element builder: h('div.class#id', {attrs}, children...)
export function h(tag, attrs, ...kids) {
  // attrs is optional: if the 2nd argument is a child (element, text, list), treat it as one
  if (attrs != null && (attrs.nodeType || typeof attrs !== 'object' || Array.isArray(attrs))) { kids.unshift(attrs); attrs = null; }
  const [name, ...cls] = tag.split('.');
  const el = document.createElement(name || 'div');
  if (cls.length) el.className = cls.join(' ');
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'html') el.innerHTML = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else el.setAttribute(k, v === true ? '' : v);
    }
  }
  for (const k of kids.flat()) {
    if (k == null || k === false) continue;
    el.append(k.nodeType ? k : document.createTextNode(k));
  }
  return el;
}

// Turn a photo (File or canvas source) into a shrunk JPEG data URL.
export async function fileToPhoto(file, maxSide = 1600) {
  let bmp;
  try { bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
  catch {
    bmp = await new Promise((res, rej) => {
      const img = new Image(); const url = URL.createObjectURL(file);
      img.onload = () => { res(img); URL.revokeObjectURL(url); }; img.onerror = rej; img.src = url;
    });
  }
  return drawToJpeg(bmp, bmp.width, bmp.height, maxSide);
}
export function drawToJpeg(src, w, h, maxSide = 1600) {
  const k = Math.min(1, maxSide / Math.max(w, h));
  const c = document.createElement('canvas');
  c.width = Math.round(w * k); c.height = Math.round(h * k);
  c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.88);
}

// A small JPEG for lists (calendar, latest tales, day view), so big photos only load on the page itself.
export async function makeThumb(src, max = 480) {
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.72);
}
export const buzz = (ms = 12) => { try { navigator.vibrate?.(ms); } catch {} };

const S = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${extra}>${d}</svg>`;
export const icon = {
  home: S('<path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z"/>'),
  calendar: S('<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'),
  sticker: S('<path d="M14 20.5H6A2.5 2.5 0 0 1 3.5 18V6A2.5 2.5 0 0 1 6 3.5h12A2.5 2.5 0 0 1 20.5 6v8z"/><path d="M14 20.5V16a2 2 0 0 1 2-2h4.5"/><path d="M8.5 9.5h.01M15.5 9.5h.01M9 14c1.5 1 3.5 1 5 0"/>'),
  plus: S('<path d="M12 5v14M5 12h14"/>').replace('stroke-width="1.8"', 'stroke-width="2.2"'),
  mail: S('<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m4 7 8 6 8-6"/>'),
  user: S('<circle cx="12" cy="8.5" r="4"/><path d="M4.5 20.5c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5"/>'),
  lock: S('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
  download: S('<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14"/>'),
  bell: S('<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15zM10 20.5a2 2 0 0 0 4 0"/>'),
  share: S('<path d="M12 3v12M7.5 7.5 12 3l4.5 4.5M5 13v5.5A2.5 2.5 0 0 0 7.5 21h9a2.5 2.5 0 0 0 2.5-2.5V13"/>'),
  check: S('<path d="M5 12.5 10 17.5 19 7.5"/>').replace('stroke-width="1.8"', 'stroke-width="2.4"'),
  film: S('<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9.5v5l4.5-2.5z"/>'),
  camera: S('<path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.8l1.4-2h4.6l1.4 2h1.8A2.5 2.5 0 0 1 20 8.5v9A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5z"/><circle cx="12" cy="13" r="3.5"/>'),
  image: S('<rect x="4" y="5" width="16" height="14" rx="2.5"/><circle cx="9.5" cy="10" r="1.6"/><path d="M4 17l5-4.5 4 3.5 2.5-2L20 17"/>'),
  mic: S('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>'),
  back: S('<path d="M15 5l-7 7 7 7"/>').replace('stroke-width="1.8"', 'stroke-width="2"'),
  chevR: S('<path d="M9 5l7 7-7 7"/>').replace('stroke-width="1.8"', 'stroke-width="2"'),
  play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4.2" height="14" rx="1.2"/><rect x="13.8" y="5" width="4.2" height="14" rx="1.2"/></svg>',
  trash: S('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'),
  close: S('<path d="M6 6l12 12M18 6 6 18"/>').replace('stroke-width="1.8"', 'stroke-width="2.2"'),
  more: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>',
  flip: S('<path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.5M20 4v4.5h-4.5M20 12a8 8 0 0 1-13.7 5.6L4 15.5M4 20v-4.5h4.5"/>'),
  resize: S('<path d="M9 5H5v4M5 5l5 5M15 19h4v-4M19 19l-5-5"/>').replace('stroke-width="1.8"', 'stroke-width="2.2"'),
  flame: '<svg viewBox="0 0 14 16" aria-hidden="true"><path d="M7 1c1 3 5 4.5 5 9a5 5 0 0 1-10 0c0-2 1-3.3 2-4 0 1.5.8 2.5 1.8 2.5C6.5 6 5.5 3.5 7 1z" fill="currentColor"/></svg>',
  moon: '<svg viewBox="0 0 80 80" aria-hidden="true"><path d="M40 10a30 30 0 1 0 22 50A26 26 0 1 1 40 10z" fill="#F6E3A1" stroke="#E0B94C" stroke-width="4"/></svg>',
  sun: '<svg viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="#E7B93E" stroke-width="2.6" stroke-linecap="round"><circle cx="24" cy="24" r="9" fill="#F6E3A1"/><path d="M24 4v6M24 38v6M4 24h6M38 24h6M10 10l4 4M34 34l4 4M38 10l-4 4M14 34l-4 4"/></svg>',
  settings: S('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 0 1-4 0v-.1a1.6 1.6 0 0 0-2.7-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3.3 14H3a2 2 0 0 1 0-4h.1a1.6 1.6 0 0 0 1.1-2.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 2.7-1.1V3a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7h.1a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>'),
};
