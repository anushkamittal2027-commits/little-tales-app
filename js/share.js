// Turns a tale into a picture that can be shared (WhatsApp, Instagram Stories...) or saved.
// It is drawn on a canvas from the tale's own data, so it looks the same on every phone and never depends on what is on screen.
import { stampPathPx, blockColor } from './stamp.js';
import { artSvg, postmarkSvg, LOGO } from './art.js';
import { dotDate, shortDate } from './util.js';
import { saveBlob } from './zip.js';

const W = 1080, H = 1920;          // a tall picture: perfect for Stories and WhatsApp status, fine for chats
const PW = 900, PH = 1125;         // the scrapbook page inside it (4:5, like the app)
const INK = '#1E1B2E';

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

async function drawStamp(ctx, tale, photo, size) {
  const em = size, sw = 10 * em, sh = 12.6 * em;
  ctx.save(); ctx.translate(-sw / 2, -sh / 2);
  const outline = new Path2D(stampPathPx(sw, sh));
  ctx.save(); ctx.shadowColor = 'rgba(30,27,46,.32)'; ctx.shadowBlur = .55 * em; ctx.shadowOffsetY = .4 * em; ctx.fillStyle = '#FFFBF3'; ctx.fill(outline); ctx.restore();
  ctx.fillStyle = '#FFFBF3'; ctx.fill(outline);
  ctx.strokeStyle = 'rgba(30,27,46,.2)'; ctx.lineWidth = .05 * em; ctx.strokeRect(.52 * em, .52 * em, sw - 1.04 * em, sh - 1.04 * em);
  // the photo window, cropped to fill like object-fit: cover
  const px = 1.05 * em, py = 1.05 * em, pw = 7.9 * em, ph = 10.05 * em;
  ctx.save(); ctx.beginPath(); ctx.roundRect ? ctx.roundRect(px, py, pw, ph, .12 * em) : ctx.rect(px, py, pw, ph); ctx.clip();
  ctx.fillStyle = '#e8dccb'; ctx.fillRect(px, py, pw, ph);
  if (photo) {
    const k = Math.max(pw / photo.naturalWidth, ph / photo.naturalHeight), dw = photo.naturalWidth * k, dh = photo.naturalHeight * k;
    ctx.drawImage(photo, px + (pw - dw) / 2, py + (ph - dh) / 2, dw, dh);
  }
  // the light ("Original" draws nothing at all)
  const light = tale.light || 'golden';
  if (light === 'morning') { ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = 'rgba(190,215,235,.22)'; ctx.fillRect(px, py, pw, ph); }
  if (light === 'golden') { ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = 'rgba(242,166,107,.5)'; ctx.fillRect(px, py, pw, ph); ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = 'rgba(242,166,107,.10)'; ctx.fillRect(px, py, pw, ph); }
  if (light === 'dark') { ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(70,60,120,.55)'; ctx.fillRect(px, py, pw, ph); }
  ctx.restore();
  ctx.strokeStyle = 'rgba(30,27,46,.45)'; ctx.lineWidth = .06 * em; ctx.strokeRect(px, py, pw, ph);
  // footer: LITTLE TALES ........ 17.10.26
  ctx.fillStyle = 'rgba(30,27,46,.75)'; ctx.font = `700 ${.52 * em}px "Courier Prime", "Courier New", monospace`; ctx.textBaseline = 'middle';
  try { ctx.letterSpacing = `${.1 * .52 * em}px`; } catch {}
  ctx.textAlign = 'left'; ctx.fillText('LITTLE TALES', px + .2 * em, py + ph + .8 * em);
  ctx.textAlign = 'right'; ctx.fillText(dotDate(tale.date), px + pw - .2 * em, py + ph + .8 * em);
  try { ctx.letterSpacing = '0px'; } catch {}
  ctx.restore();
  return { sw, sh, em };
}

// Draws the finished picture and returns it as a PNG Blob.
export async function makeShareImage(tale) {
  await Promise.all([document.fonts.load('700 54px Fraunces'), document.fonts.load('italic 400 33px Fraunces'), document.fonts.load('700 27px "Courier Prime"')].map((p) => p.catch(() => {})));
  const photo = tale.photo ? await loadImg(tale.photo).catch(() => null) : null;
  const decos = [];
  for (const d of tale.decorations || []) { try { const s = artSvg(d.kind, d.id); if (s) decos.push({ d, ...(await svgImg(s)) }); } catch { /* a missing sticker is skipped */ } }
  const pm = await svgImg(postmarkSvg(tale.date), 700).catch(() => null);
  const logo = await svgImg(LOGO, 120).catch(() => null);

  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  // soft brand background
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#FFC6E3'); g.addColorStop(.5, '#FFE9A8'); g.addColorStop(1, '#B6EFE2');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  for (const [x, y, r, col] of [[120, 260, 520, 'rgba(255,79,163,.35)'], [980, 760, 520, 'rgba(198,241,53,.35)'], [260, 1600, 560, 'rgba(37,199,183,.35)']]) {
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, col); rg.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
  }

  // the page
  const ox = (W - PW) / 2, oy = 230;
  ctx.save(); ctx.translate(ox, oy);
  ctx.save(); ctx.shadowColor = 'rgba(48,36,78,.28)'; ctx.shadowBlur = 60; ctx.shadowOffsetY = 28; ctx.fillStyle = '#FFFDF8'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(0, 0, PW, PH, 12) : ctx.rect(0, 0, PW, PH); ctx.fill(); ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.roundRect ? ctx.roundRect(0, 0, PW, PH, 12) : ctx.rect(0, 0, PW, PH); ctx.clip();
  // coloured block
  rot(ctx, PW * (.13 + .37), PH * (.07 + .33), -4.5, () => {
    const bw = PW * .74, bh = PH * .66; ctx.translate(-bw / 2, -bh / 2); ctx.globalAlpha = .92; ctx.fillStyle = blockColor(tale);
    const pts = [[0, 0], [1, .012], [.99, .97], [.92, .99], [.85, .97], [.76, .995], [.66, .97], [.55, .99], [.44, .97], [.33, .994], [.22, .97], [.11, .99], [.01, .97]];
    ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x * bw, y * bh) : ctx.moveTo(x * bw, y * bh))); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
  });
  // the stamp and its postmark
  const em = PW * .0585, sw = 10 * em, sh = 12.6 * em, scx = PW / 2, scy = PH * .084 + sh / 2;
  ctx.save(); ctx.translate(scx, scy); ctx.rotate((-2 * Math.PI) / 180); await drawStamp(ctx, tale, photo, em);
  if (pm) {
    const mw = 10.4 * em, mh = mw * pm.ratio, mcx = sw / 2 + 3.4 * em - mw / 2, mcy = sh / 2 + 1.2 * em - mh / 2;
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = .9; ctx.translate(mcx, mcy); ctx.rotate((-9 * Math.PI) / 180); ctx.drawImage(pm.img, -mw / 2, -mh / 2, mw, mh); ctx.restore();
  }
  ctx.restore();
  // title, date, words
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; let y = PH * .784;
  if (tale.title) { ctx.fillStyle = INK; ctx.font = `700 ${PW * .06}px Fraunces, Georgia, serif`; y += PW * .06; ctx.fillText(tale.title, PW / 2, y, PW * .8); y += PW * .008; }
  ctx.fillStyle = 'rgba(30,27,46,.6)'; ctx.font = `700 ${PW * .03}px "Courier Prime", "Courier New", monospace`; try { ctx.letterSpacing = `${PW * .03 * .14}px`; } catch {}
  y += PW * .035; ctx.fillText(shortDate(tale.date).toUpperCase(), PW / 2, y); try { ctx.letterSpacing = '0px'; } catch {} y += PW * .016;
  if (tale.thought) {
    ctx.fillStyle = INK; ctx.font = `italic 400 ${PW * .037}px Fraunces, Georgia, serif`;
    for (const line of wrap(ctx, tale.thought, PW * .8).slice(0, 4)) { y += PW * .037 * 1.35; ctx.fillText(line, PW / 2, y); }
  }
  // stickers, tape, paper and doodles on top
  for (const { d, img, ratio } of decos) {
    const dw = (d.s / 100) * PW, dh = dw * ratio;
    ctx.save(); if (d.kind !== 'doodles') { ctx.shadowColor = 'rgba(30,27,46,.22)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3; }
    rot(ctx, (d.x / 100) * PW, (d.y / 100) * PH, d.r || 0, () => ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh)); ctx.restore();
  }
  ctx.restore(); ctx.restore();

  // the signature under the page
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  if (logo) ctx.drawImage(logo.img, W / 2 - 52, 1470, 104, 104 * logo.ratio);
  ctx.fillStyle = INK; ctx.font = '700 66px Fraunces, Georgia, serif'; ctx.fillText('Little Tales', W / 2, 1680);
  ctx.fillStyle = 'rgba(30,27,46,.7)'; ctx.font = '400 34px "DM Sans", system-ui, sans-serif'; ctx.fillText('Turn little moments into memories', W / 2, 1738);
  ctx.fillStyle = '#E8368F'; ctx.font = '700 38px "DM Sans", system-ui, sans-serif'; ctx.fillText('littletales.me', W / 2, 1800);

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
