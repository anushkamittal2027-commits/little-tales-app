// Turns a tale into a picture that can be shared (WhatsApp, Instagram Stories...) or saved.
// It is drawn on a canvas from the tale's own data, so it looks the same on every phone and never depends on what is on screen.
// The look follows the app: soft gingham, a paper page, a perforated stamp, handwriting.
import { filteredImage } from './filters.js';
import { blockColor } from './stamp.js';
import { artSvg, postmarkSvg } from './art.js';
import { dotDate, shortDate } from './util.js';
import { saveBlob } from './zip.js';

const W = 1080, H = 1920;          // a tall picture: perfect for Stories and WhatsApp status, fine for chats
const PW = 840, PH = 1050;         // the scrapbook page (4:5, like the app)
const INK = '#2E3134';
const SERIF = '"Playfair Display", Georgia, serif', MONO = '"DM Mono", ui-monospace, monospace', HAND = 'Caveat, "Segoe Print", cursive';

const loadImg = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('image')); i.src = src; });
const svgImg = async (svg, wh = null) => {
  let s = svg;
  const vb = s.match(/viewBox="([\d.\s-]+)"/); let ratio = 1;
  if (vb) { const [, , w, h] = vb[1].trim().split(/\s+/).map(Number); ratio = h / w; if (!/<svg[^>]*\swidth=/.test(s)) s = s.replace('<svg', `<svg width="${wh || 400}" height="${(wh || 400) * ratio}"`); }
  const img = await loadImg('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s));
  return { img, ratio };
};
function wrap(ctx, text, maxW) {
  const out = []; let line = '';
  for (const word of String(text).split(/\s+/)) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxW && line) { out.push(line); line = word; } else line = test;
  }
  if (line) out.push(line); return out;
}
const rot = (ctx, cx, cy, deg, fn) => { ctx.save(); ctx.translate(cx, cy); ctx.rotate((deg * Math.PI) / 180); fn(); ctx.restore(); };
const rr = (ctx, x, y, w, h, r) => { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); };
const spaced = (ctx, px) => { try { ctx.letterSpacing = px + 'px'; } catch {} };

// soft gingham: two overlapping bands of colour that fade out, like watercolour
function gingham(ctx, x, y, w, h, tile, rgb, a) {
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  const band = (g) => { g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(.42, `rgba(${rgb},${a})`); g.addColorStop(.52, `rgba(${rgb},${a * .35})`); g.addColorStop(.6, `rgba(${rgb},0)`); return g; };
  for (let gx = x; gx < x + w; gx += tile) { ctx.fillStyle = band(ctx.createLinearGradient(gx, 0, gx + tile, 0)); ctx.fillRect(gx, y, tile, h); }
  for (let gy = y; gy < y + h; gy += tile) { ctx.fillStyle = band(ctx.createLinearGradient(0, gy, 0, gy + tile)); ctx.fillRect(x, gy, w, tile); }
  ctx.restore();
}
// a strip of washi tape with ragged ends, drawn with its top-left at (0, 0)
function tape(ctx, w, h) {
  ctx.save(); ctx.beginPath();
  [[.02, 0], [.98, 0], [1, .25], [.97, .5], [1, .75], [.98, 1], [.02, 1], [0, .72], [.03, .5], [0, .28]].forEach(([x, y], i) => (i ? ctx.lineTo(x * w, y * h) : ctx.moveTo(x * w, y * h)));
  ctx.closePath(); ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(0, 0, w, h);
  const t = h / 2.5; ctx.fillStyle = 'rgba(150,188,224,.62)';
  for (let x = 0; x < w; x += t * 2) ctx.fillRect(x, 0, t, h);
  for (let y = 0; y < h; y += t * 2) ctx.fillRect(0, y, w, t);
  ctx.restore();
}

// The postage stamp, centred on (0, 0): perforated edge, cream paper, framed photo, footer. wpx is its width.
function drawStamp(ctx, tale, photo, pm, wpx) {
  const u = wpx / 100, w = 100 * u, h = 130 * u;
  const off = document.createElement('canvas'); off.width = Math.ceil(w); off.height = Math.ceil(h);
  const o = off.getContext('2d');
  o.fillStyle = '#FFFCF5'; o.fillRect(0, 0, w, h);
  o.globalCompositeOperation = 'destination-out';
  for (let x = 0; x <= 100.01; x += 5) for (const y of [0, 130]) { o.beginPath(); o.arc(x * u, y * u, 1.65 * u, 0, Math.PI * 2); o.fill(); }
  for (let y = 5; y < 129.9; y += 5) for (const x of [0, 100]) { o.beginPath(); o.arc(x * u, y * u, 1.65 * u, 0, Math.PI * 2); o.fill(); }
  ctx.save(); ctx.translate(-w / 2, -h / 2);
  ctx.save(); ctx.shadowColor = 'rgba(74,58,36,.28)'; ctx.shadowBlur = 2.2 * u * 2; ctx.shadowOffsetY = 1.6 * u; ctx.drawImage(off, 0, 0); ctx.restore();
  const px = 6.5 * u, py = 6.5 * u, pw = 87 * u, ph = 108 * u;
  ctx.fillStyle = '#E9EEF0'; ctx.fillRect(px, py, pw, ph);
  ctx.save(); ctx.beginPath(); ctx.rect(px, py, pw, ph); ctx.clip();
  if (photo) { const k = Math.max(pw / photo.naturalWidth, ph / photo.naturalHeight), dw = photo.naturalWidth * k, dh = photo.naturalHeight * k; const fp = filteredImage(photo, tale.light || 'golden', Math.ceil(Math.max(dw, dh))); ctx.drawImage(fp, px + (pw - dw) / 2, py + (ph - dh) / 2, dw, dh); }
  ctx.restore();
  ctx.strokeStyle = '#E4D8C2'; ctx.lineWidth = .6 * u; ctx.strokeRect(px + .3 * u, py + .3 * u, pw - .6 * u, ph - .6 * u);
  ctx.fillStyle = '#4A4740'; ctx.font = `400 ${4.3 * u}px ${MONO}`; ctx.textBaseline = 'middle'; spaced(ctx, .12 * 4.3 * u);
  ctx.textAlign = 'left'; ctx.fillText('LITTLE TALES', px, 121 * u); ctx.textAlign = 'right'; ctx.fillText(dotDate(tale.date), px + pw, 121 * u); spaced(ctx, 0);
  if (pm) {
    const mw = 60 * u, mh = mw * pm.ratio;
    ctx.save(); ctx.globalAlpha = .78; ctx.translate(58 * u + mw / 2, -7 * u + mh / 2); ctx.rotate((-9 * Math.PI) / 180); ctx.drawImage(pm.img, -mw / 2, -mh / 2, mw, mh); ctx.restore();
  }
  ctx.restore();
}

// Draws the finished picture and returns it as a PNG Blob.
export async function makeShareImage(tale) {
  await Promise.all([document.fonts.load('600 60px "Playfair Display"'), document.fonts.load('italic 400 40px "Playfair Display"'), document.fonts.load('400 30px "DM Mono"'), document.fonts.load('600 60px Caveat')].map((p) => p.catch(() => {})));
  const photo = tale.photo ? await loadImg(tale.photo).catch(() => null) : null;
  const decos = [];
  for (const d of tale.decorations || []) { try { const sv = artSvg(d.kind, d.id); if (sv) decos.push({ d, ...(await svgImg(sv)) }); } catch { /* a missing sticker is skipped */ } }
  const pm = await svgImg(postmarkSvg(tale.date), 600).catch(() => null);

  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#F7FAFD'; ctx.fillRect(0, 0, W, H);
  gingham(ctx, 0, 0, W, H, 156, '150,195,235', .45);
  ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.font = `600 84px ${HAND}`; ctx.fillText('a little tale', W / 2, 200);

  const u = PW / 100;                                   // one hundredth of the page width
  rot(ctx, W / 2, 330 + PH / 2, -2, () => {
    ctx.translate(-PW / 2, -PH / 2);
    ctx.save(); ctx.shadowColor = 'rgba(70,55,30,.38)'; ctx.shadowBlur = 80; ctx.shadowOffsetY = 40; ctx.fillStyle = '#FFFDF9'; rr(ctx, 0, 0, PW, PH, 16); ctx.fill(); ctx.restore();
    ctx.save(); rr(ctx, 0, 0, PW, PH, 16); ctx.clip();
    ctx.fillStyle = 'rgba(120,100,70,.09)';
    for (let y = 2 * u; y < PH; y += 4 * u) for (let x = 2 * u; x < PW; x += 4 * u) { ctx.beginPath(); ctx.arc(x, y, .35 * u, 0, Math.PI * 2); ctx.fill(); }
    rot(ctx, 111 * u, 11 * u, 12, () => { ctx.fillStyle = '#FFFDF9'; ctx.fillRect(-17 * u, -17 * u, 34 * u, 34 * u); gingham(ctx, -17 * u, -17 * u, 34 * u, 34 * u, 10 * u, '160,195,226', .5); });
    rot(ctx, 46 * u, 45 * u, 4, () => { ctx.fillStyle = blockColor(tale); rr(ctx, -33 * u, -36 * u, 66 * u, 72 * u, u); ctx.fill(); });
    rot(ctx, 47 * u, 42.8 * u, -3, () => drawStamp(ctx, tale, photo, pm, 52 * u));
    rot(ctx, 48 * u, 8.25 * u, -7, () => { ctx.translate(-13 * u, -3.25 * u); tape(ctx, 26 * u, 6.5 * u); });
    // title, date and words
    ctx.textAlign = 'left'; ctx.textBaseline = 'top'; let y = 88 * u;
    if (tale.title) { ctx.fillStyle = INK; ctx.font = `600 ${7.6 * u}px ${SERIF}`; ctx.fillText(tale.title, 10 * u, y, 80 * u); y += 7.6 * u * 1.1; }
    y += 1.6 * u; ctx.fillStyle = '#6B6760'; ctx.font = `400 ${2.8 * u}px ${MONO}`; spaced(ctx, .2 * 2.8 * u); ctx.fillText(shortDate(tale.date).toUpperCase(), 10 * u, y); spaced(ctx, 0);
    y += 2.8 * u * 1.3 + 2.2 * u;
    if (tale.thought) {
      const fs = (tale.thought.length > 80 ? 3.7 : 4.4) * u; ctx.fillStyle = '#4F4B45'; ctx.font = `italic 400 ${fs}px ${SERIF}`;
      for (const line of wrap(ctx, tale.thought, 80 * u).slice(0, 5)) { ctx.fillText(line, 10 * u, y); y += fs * 1.35; }
    }
    // stickers, tape, paper and doodles on top
    for (const { d, img, ratio } of decos) {
      const dw = (d.s / 100) * PW, dh = dw * ratio;
      ctx.save(); if (d.kind !== 'doodles') { ctx.shadowColor = 'rgba(60,40,20,.28)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3; }
      rot(ctx, (d.x / 100) * PW, (d.y / 100) * PH, d.r || 0, () => ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh)); ctx.restore();
    }
    ctx.restore();
  });

  // the signature under the page
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = INK; ctx.font = `600 70px ${SERIF}`; ctx.fillText('Little Tales', W / 2, 1670);
  ctx.fillStyle = '#4F4B45'; ctx.font = `400 32px ${MONO}`; spaced(ctx, 6.4); ctx.fillText('LITTLETALES.ME', W / 2, 1735); spaced(ctx, 0);

  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('Could not make the picture'))), 'image/png'));
}

// Prepare ahead (while the screen is open) so the share sheet can open the instant the button is tapped.
const cache = new Map();
export function prepareShare(tale) {
  const key = [tale.id, tale.date, (tale.photo || '').length, tale.light || '', tale.title || '', tale.thought || '', JSON.stringify(tale.decorations || [])].join('|');
  if (!cache.has(key)) {
    const p = makeShareImage(tale).then((b) => ({ blob: b, file: new File([b], 'little-tale.png', { type: 'image/png' }) }));
    p.catch(() => cache.delete(key));                // a failed picture is never kept: the next tap tries again
    cache.set(key, p);
    while (cache.size > 3) cache.delete(cache.keys().next().value);
  }
  return cache.get(key);
}
export function clearShareCache() { cache.clear(); }

// Returns 'shared', 'saved' or 'cancelled'.
export async function shareTale(tale) {
  const pic = await prepareShare(tale);                      // normally already finished
  const data = { files: [pic.file], title: 'My little tale', text: 'Made with Little Tales. littletales.me' };
  if (navigator.canShare && navigator.canShare(data)) {
    try { await navigator.share(data); return 'shared'; }
    catch (e) { if (e && e.name === 'AbortError') return 'cancelled'; /* otherwise fall through and save it */ }
  }
  await saveBlob(pic.blob, 'little-tale.png');
  return 'saved';
}
