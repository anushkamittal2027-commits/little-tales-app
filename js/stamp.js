// Draws a stamp and a full scrapbook page. Shared by every screen.
import { h, dotDate, shortDate } from './util.js';
import { postmarkSvg, artSvg } from './art.js';

// ---- the cut-out stamp shape ----
// One shared clip path. The stamp box is always 10em x 12.6em, so circles stay round at any size.
const SW = 10, SH = 12.6, NX = 8, NY = 10, R = 0.45;
export function ensureStampClip() {
  if (document.getElementById('lt-stamp-defs')) return;
  const rx = R / SW, ry = R / SH, f = (n) => n.toFixed(5);
  let d = 'M0 0';
  for (let i = 0; i < NX; i++) { const cx = (i + 0.5) / NX; d += ` L${f(cx - rx)} 0 A${f(rx)} ${f(ry)} 0 0 0 ${f(cx + rx)} 0`; }
  d += ' L1 0';
  for (let j = 0; j < NY; j++) { const cy = (j + 0.5) / NY; d += ` L1 ${f(cy - ry)} A${f(rx)} ${f(ry)} 0 0 0 1 ${f(cy + ry)}`; }
  d += ' L1 1';
  for (let i = NX - 1; i >= 0; i--) { const cx = (i + 0.5) / NX; d += ` L${f(cx + rx)} 1 A${f(rx)} ${f(ry)} 0 0 0 ${f(cx - rx)} 1`; }
  d += ' L0 1';
  for (let j = NY - 1; j >= 0; j--) { const cy = (j + 0.5) / NY; d += ` L0 ${f(cy + ry)} A${f(rx)} ${f(ry)} 0 0 0 0 ${f(cy - ry)}`; }
  d += ' Z';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.id = 'lt-stamp-defs'; svg.setAttribute('width', '0'); svg.setAttribute('height', '0'); svg.setAttribute('aria-hidden', 'true');
  svg.style.cssText = 'position:absolute;width:0;height:0';
  svg.innerHTML = `<defs><clipPath id="lt-stamp" clipPathUnits="objectBoundingBox"><path d="${d}"/></clipPath></defs>`;
  document.body.prepend(svg);
}

// The same cut-out outline in plain pixels, for drawing inside an SVG (the camera plate).
export function stampPathPx(w, h, x0 = 0, y0 = 0) {
  const r = R * (w / SW), rx = r, ry = r * (SW / SW), f = (n) => n.toFixed(2);
  const P = (x, y) => `${f(x0 + x)} ${f(y0 + y)}`;
  let d = `M${P(0, 0)}`;
  for (let i = 0; i < NX; i++) { const cx = ((i + 0.5) / NX) * w; d += ` L${P(cx - rx, 0)} A${f(rx)} ${f(ry)} 0 0 0 ${P(cx + rx, 0)}`; }
  d += ` L${P(w, 0)}`;
  for (let j = 0; j < NY; j++) { const cy = ((j + 0.5) / NY) * h; d += ` L${P(w, cy - ry)} A${f(rx)} ${f(ry)} 0 0 0 ${P(w, cy + ry)}`; }
  d += ` L${P(w, h)}`;
  for (let i = NX - 1; i >= 0; i--) { const cx = ((i + 0.5) / NX) * w; d += ` L${P(cx + rx, h)} A${f(rx)} ${f(ry)} 0 0 0 ${P(cx - rx, h)}`; }
  d += ` L${P(0, h)}`;
  for (let j = NY - 1; j >= 0; j--) { const cy = ((j + 0.5) / NY) * h; d += ` L${P(0, cy + ry)} A${f(rx)} ${f(ry)} 0 0 0 ${P(0, cy - ry)}`; }
  return d + ' Z';
}

// A soft colour block behind each stamp, so every page has its own colour (the redesign palette)
const BLOCKS = ['#F3C9C3', '#BFD7EC', '#F6E3A1', '#C9D8BD', '#E9DECB'];
export const blockColor = (tale) => {
  let n = 0; for (const c of String(tale.id || tale.date)) n = (n * 31 + c.charCodeAt(0)) >>> 0;
  return BLOCKS[n % BLOCKS.length];
};

export const LIGHTS = [
  { id: 'none', label: 'Original' },
  { id: 'morning', label: 'Morning' },
  { id: 'golden', label: 'Golden hour' },
  { id: 'dark', label: 'After dark' },
];

// size: CSS font-size for the stamp (the stamp is always 10em wide; everything inside scales with it).
// A real postage stamp: perforated edge, cream paper, a framed photo window and a small footer. Sizes inside are in container units (cqw).
export function stampEl(tale, { size = '16px', mini = false, postmark = true, developing = false, full = false } = {}) {
  const light = tale.light || 'golden';
  const photo = tale.photo
    ? h('img.photo', { src: full ? tale.photo : (tale.thumb || tale.photo), loading: 'lazy', decoding: 'async', alt: tale.title || 'Photo', draggable: 'false' })
    : h('div.photo-empty', { 'aria-hidden': 'true' }, h('span', '+'));
  const box = h('div.stamp-photo', photo, h('div.light-overlay'));
  if (tale.photo) {                                 // a soft shimmer until the picture has arrived
    const done = () => box.classList.remove('loading');
    if (photo.complete && photo.naturalWidth) { /* already there */ } else { box.classList.add('loading'); photo.addEventListener('load', done, { once: true }); photo.addEventListener('error', done, { once: true }); }
  }
  return h('div.stamp-wrap' + (mini ? '.mini' : ''), { style: { fontSize: size } },
    h('div.stamp-shadow',
      h('div.stamp.light-' + light + (developing ? '.developing' : ''),
        box,
        h('div.stamp-foot', h('span', 'LITTLE TALES'), h('span', dotDate(tale.date))))),
    postmark && !mini ? h('div.postmark' + (developing ? '.pending' : ''), { html: postmarkSvg(tale.date) }) : null);
}

// A full scrapbook page: stamp, title, date, thought and decorations.
export function pageEl(tale, { developing = false, decorLayer = true } = {}) {
  const page = h('div.page');
  const stamp = stampEl(tale, { size: 'calc(52cqw / 10)', developing, full: true });
  const parts = [
    h('div.page-corner', { 'aria-hidden': 'true' }),
    h('div.page-block', { style: { background: blockColor(tale) }, 'aria-hidden': 'true' }),
    h('div.page-stamp', stamp),
    h('div.page-tape', { 'aria-hidden': 'true' }),
    h('div.page-text' + ((tale.thought || '').length > 80 ? '.long' : ''),
      tale.title ? h('div.page-title', tale.title) : null,
      h('div.page-date', shortDate(tale.date).toUpperCase()),
      tale.thought ? h('div.page-thought', tale.thought) : null),
  ];
  page.append(...parts);
  if (decorLayer) {
    const layer = h('div.decor-layer');
    (tale.decorations || []).forEach((d) => layer.append(decoEl(d)));
    page.append(layer);
  }
  return page;
}

export function decoEl(d) {
  const el = h('div.deco.k-' + d.kind, { html: artSvg(d.kind, d.id) });
  placeDeco(el, d);
  return el;
}
export function placeDeco(el, d) {
  el.style.left = d.x + '%';
  el.style.top = d.y + '%';
  el.style.width = d.s + '%';
  el.style.setProperty('--rot', d.r + 'deg');
}
