// Draws a stamp and a full scrapbook page. Shared by every screen.
import { h, dotDate, shortDate } from './util.js';
import { postmarkSvg, artSvg } from './art.js';

export const LIGHTS = [
  { id: 'morning', label: 'Morning' },
  { id: 'golden', label: 'Golden hour' },
  { id: 'dark', label: 'After dark' },
];

// size: CSS font-size for the stamp (everything inside scales with it).
export function stampEl(tale, { size = '16px', mini = false, postmark = true, developing = false } = {}) {
  const light = tale.light || 'golden';
  const photo = tale.photo
    ? h('img.photo', { src: tale.photo, alt: tale.title || 'Photo', draggable: 'false' })
    : h('div.photo-empty', { 'aria-hidden': 'true' }, h('span', '+'));
  const el = h('div.stamp-wrap' + (mini ? '.mini' : ''), { style: { fontSize: size } },
    h('div.stamp-shadow',
      h('div.stamp.light-' + light + (developing ? '.developing' : ''),
        h('div.stamp-photo', photo, h('div.light-overlay')),
        h('div.stamp-foot', h('span', 'LITTLE TALES'), h('span', dotDate(tale.date))))),
    postmark && !mini ? h('div.postmark' + (developing ? '.pending' : ''), { html: postmarkSvg(tale.date) }) : null);
  return el;
}

// A full scrapbook page: stamp, title, date, thought and decorations.
export function pageEl(tale, { developing = false, decorLayer = true } = {}) {
  const page = h('div.page');
  const stamp = stampEl(tale, { size: 'calc(var(--pw) * .0585)', developing });
  const parts = [
    h('div.page-stamp', stamp),
    h('div.page-text',
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
  const el = h('div.deco', { html: artSvg(d.kind, d.id) });
  placeDeco(el, d);
  return el;
}
export function placeDeco(el, d) {
  el.style.left = d.x + '%';
  el.style.top = d.y + '%';
  el.style.width = d.s + '%';
  el.style.setProperty('--rot', d.r + 'deg');
}
