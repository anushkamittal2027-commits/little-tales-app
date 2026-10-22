// "Your week": a real video made on the phone from the member's tales.
// Each tale becomes a scene (stamp drops in, postmark presses on, thought types out, voice snippet plays),
// drawn on a canvas and recorded with the browser's own recorder. No server, no cost.
import { filteredImage } from './filters.js';
import { stampPathPx } from './stamp.js';
import { dotDate, parseDate } from './util.js';
import { toBuffer } from './music.js';

export const W = 720, H = 1280;
const INK = '#1E1B2E', CREAM = '#FBF5EA';
const BG = [['#FF9ACB', '#FFE27A'], ['#C6F135', '#8FE6DD'], ['#8FE6DD', '#FFB3D8'], ['#FFE27A', '#FF9ACB'], ['#B9C8FF', '#C6F135'], ['#FFB38F', '#FFE27A']];
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

const ease = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
const clamp01 = (x) => Math.min(1, Math.max(0, x));

// Which video, if any? 0 tales: none. 1 to 6: the soft one. 7 or more: the full one.
export function videoKind(count) { return count <= 0 ? 'none' : count < 7 ? 'soft' : 'full'; }
export function videoTitle(count) {
  if (count <= 0) return '';
  return count < 7 ? `Your week, in ${count} little ${count === 1 ? 'tale' : 'tales'}.` : 'Your week';
}
// Up to 21 tales (3 a day for 7 days), oldest first.
export function pickTales(tales, fromDate, toDate) {
  return tales.filter((t) => t.date >= fromDate && t.date <= toDate)
    .sort((a, b) => (a.date + a.createdAt).localeCompare(b.date + b.createdAt)).slice(-21);
}

const loadImg = (src) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });

function mimePick() {
  const opts = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
  return opts.find((m) => window.MediaRecorder && MediaRecorder.isTypeSupported(m)) || '';
}
export const canMakeVideo = () => !!(window.MediaRecorder && HTMLCanvasElement.prototype.captureStream);

function wrap(ctx, text, maxW) {
  const words = text.split(/\s+/), lines = []; let line = '';
  for (const w of words) { const test = line ? line + ' ' + w : w; if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test; }
  if (line) lines.push(line); return lines;
}

function drawBg(ctx, i, t) {
  const [a, b] = BG[i % BG.length];
  const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, a); g.addColorStop(1, b);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalAlpha = 0.5; ctx.filter = 'blur(50px)';
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(W * 0.8 + Math.sin(t * 0.6) * 30, H * 0.18, 190, 0, 7); ctx.fill();
  ctx.fillStyle = BG[(i + 2) % BG.length][0]; ctx.beginPath(); ctx.arc(W * 0.12, H * 0.82 + Math.cos(t * 0.5) * 30, 230, 0, 7); ctx.fill();
  ctx.restore();
}

const pathCache = new Map();
function stampPath(u) { const k = Math.round(u); if (!pathCache.has(k)) pathCache.set(k, new Path2D(stampPathPx(10 * k, 12.6 * k))); return pathCache.get(k); }

function drawStamp(ctx, tale, img, cx, cy, u, rot, zoomT) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.translate(-5 * u, -6.3 * u);
  const p = stampPath(u);
  ctx.save(); ctx.shadowColor = 'rgba(30,27,46,.38)'; ctx.shadowBlur = u * 3; ctx.shadowOffsetY = u * 1.2; ctx.fillStyle = '#FFFDF8'; ctx.fill(p); ctx.restore();
  ctx.save(); ctx.clip(p);
  ctx.strokeStyle = 'rgba(30,27,46,.2)'; ctx.lineWidth = u * 0.05; ctx.strokeRect(0.52 * u, 0.52 * u, 8.96 * u, 11.56 * u);
  const px = 1.05 * u, py = 1.05 * u, pw = 7.9 * u, ph = 10.05 * u;
  ctx.save(); ctx.beginPath(); ctx.rect(px, py, pw, ph); ctx.clip();
  if (img) {
    const s = Math.max(pw / img.width, ph / img.height) * (1.02 + 0.07 * zoomT);
    const dw = img.width * s, dh = img.height * s;
    ctx.drawImage(img, px + (pw - dw) / 2, py + (ph - dh) / 2, dw, dh);
  } else { ctx.fillStyle = '#e8dccb'; ctx.fillRect(px, py, pw, ph); }
  ctx.restore();
  ctx.strokeStyle = 'rgba(30,27,46,.45)'; ctx.lineWidth = u * 0.06; ctx.strokeRect(px, py, pw, ph);
  ctx.fillStyle = 'rgba(30,27,46,.72)'; ctx.font = `700 ${u * 0.5}px "DM Mono", monospace`; ctx.textBaseline = 'middle';
  ctx.textAlign = 'left'; ctx.fillText('LITTLE TALES', 1.1 * u, 11.7 * u); ctx.textAlign = 'right'; ctx.fillText(dotDate(tale.date), 8.9 * u, 11.7 * u);
  ctx.restore(); ctx.restore();
}

function drawPostmark(ctx, tale, cx, cy, r, k, rot) {
  if (k <= 0) return;
  const d = parseDate(tale.date);
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); const s = 1 + (1 - ease(k)) * 0.45; ctx.scale(s, s); ctx.globalAlpha = ease(k) * 0.9;
  ctx.strokeStyle = '#F2385A'; ctx.fillStyle = '#F2385A'; ctx.lineWidth = r * 0.06;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.stroke(); ctx.lineWidth = r * 0.04; ctx.beginPath(); ctx.arc(0, 0, r * 0.68, 0, 7); ctx.stroke();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `700 ${r * 0.3}px "DM Mono", monospace`;
  ctx.fillText(`${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]}`, 0, -r * 0.08);
  ctx.font = `400 ${r * 0.22}px "DM Mono", monospace`; ctx.fillText(String(d.getFullYear()), 0, r * 0.22);
  ctx.lineWidth = r * 0.05; ctx.lineCap = 'round';
  for (let n = 0; n < 4; n++) { ctx.beginPath(); const y = -r * 0.5 + n * r * 0.36; ctx.moveTo(r * 1.1, y); for (let x = 0; x <= 5; x++) ctx.quadraticCurveTo(r * (1.2 + x * 0.22 + 0.11), y + (x % 2 ? r * 0.12 : -r * 0.12), r * (1.2 + x * 0.22 + 0.22), y); ctx.stroke(); }
  ctx.restore();
}

// Phones only allow sound after a tap, so the audio engine must be created and started inside the tap that begins the video (before any waiting).
export function prepareAudio() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    const actx = new AC(); actx.resume?.();
    return { actx, dest: actx.createMediaStreamDestination() };
  } catch { return null; }
}

export async function makeVideo(tales, { canvas, soft, subscribed, rangeText = '', onProgress, audio = null, music = 'none' } = {}) {
  if (!canMakeVideo()) throw new Error('Video is not supported on this browser');
  const n = tales.length; if (!n) throw new Error('No tales');
  const per = n > 12 ? 1.7 : n > 6 ? 2.2 : 2.7, INTRO = 2.4, OUTRO = 2.6;
  const total = INTRO + n * per + OUTRO;
  canvas.width = W; canvas.height = H; const ctx = canvas.getContext('2d');
  await Promise.all(['700 80px Playfair Display', 'italic 500 40px Playfair Display', '700 30px "DM Mono"', '400 30px "DM Mono"', '600 30px "Inter"'].map((f) => document.fonts.load(f).catch(() => {})));
  const imgs = (await Promise.all(tales.map((t) => loadImg(t.photo)))).map((im, i) => filteredImage(im, tales[i].light || 'golden'));

  // Audio: a short snippet of each voice note, mixed into the video.
  let actx = null, dest = null, buffers = [];
  const AC = window.AudioContext || window.webkitAudioContext;
  if (audio || AC) {
    try {
      const a = audio || prepareAudio(); actx = a.actx; dest = a.dest;
      buffers = await Promise.all(tales.map(async (t) => { try { return t.audio ? await actx.decodeAudioData(await t.audio.arrayBuffer()) : null; } catch { return null; } }));
      if (actx.state === 'suspended') await actx.resume();
    } catch { actx = null; dest = null; }
  }

  const stream = canvas.captureStream(30);
  if (dest) dest.stream.getAudioTracks().forEach((tr) => stream.addTrack(tr));
  const mime = mimePick();
  const rec = new MediaRecorder(stream, { ...(mime ? { mimeType: mime } : {}), videoBitsPerSecond: 3500000 });
  const chunks = []; rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const done = new Promise((res) => { rec.onstop = () => res(new Blob(chunks, { type: (rec.mimeType || mime || 'video/webm').split(';')[0] })); });

  const frame = (t) => {
    if (t < INTRO) {
      drawBg(ctx, 0, t);
      const k = ease(t / 0.8);
      ctx.save(); ctx.globalAlpha = k; ctx.translate(0, (1 - k) * 40);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const title = soft ? videoTitle(n) : 'Your week';
      ctx.font = `700 ${soft ? 78 : 120}px Playfair Display, Georgia, serif`;
      const lines = soft ? wrap(ctx, title, W - 140) : [title];
      const lh = soft ? 92 : 130, y0 = H / 2 - ((lines.length - 1) * lh) / 2 - 40;
      lines.forEach((l, i) => {
        const w = ctx.measureText(l).width; ctx.fillStyle = '#C6F135'; ctx.save(); ctx.translate(W / 2, y0 + i * lh); ctx.rotate(-0.02); ctx.fillRect(-w / 2 - 22, -lh * 0.42, w + 44, lh * 0.8); ctx.restore();
        ctx.fillStyle = INK; ctx.fillText(l, W / 2, y0 + i * lh);
      });
      ctx.font = '400 34px "DM Mono", monospace'; ctx.fillStyle = 'rgba(30,27,46,.75)'; ctx.fillText(rangeText, W / 2, H / 2 + 150);
      ctx.restore(); return;
    }
    if (t >= INTRO + n * per) {
      const lt = t - INTRO - n * per; drawBg(ctx, n, t);
      const k = ease(lt / 0.7); ctx.save(); ctx.globalAlpha = k; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = INK;
      ctx.font = '700 92px Playfair Display, Georgia, serif';
      const msg = subscribed ? 'See you next Sunday.' : 'Keep your tales going.'; wrap(ctx, msg, W - 120).forEach((l, i, a) => ctx.fillText(l, W / 2, H / 2 - ((a.length - 1) * 106) / 2 + i * 106));
      ctx.font = 'italic 500 38px Playfair Display, Georgia, serif'; ctx.fillText('Little Tales', W / 2, H / 2 + 150); ctx.restore(); return;
    }
    const i = Math.min(n - 1, Math.floor((t - INTRO) / per)), lt = t - INTRO - i * per, tale = tales[i];
    drawBg(ctx, i, t);
    const u = 41, enter = ease(lt / 0.7), settle = 1 - enter;
    const cx = W / 2, cy = 560 + settle * -300, rot = (i % 2 ? 0.045 : -0.045) * (0.4 + settle * 1.4);
    ctx.save(); ctx.globalAlpha = clamp01(lt / 0.25);
    if (tale.title) { ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '700 54px Playfair Display, Georgia, serif'; ctx.fillText(tale.title, W / 2, 110); }
    ctx.restore();
    drawStamp(ctx, tale, imgs[i], cx, cy, u, rot, lt / per);
    drawPostmark(ctx, tale, cx + 5 * u * 0.78, cy + 6.3 * u * 0.62, 90, (lt - 0.8) / 0.35, -0.16);
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = 'rgba(30,27,46,.7)'; ctx.font = '700 28px "DM Mono", monospace';
    ctx.globalAlpha = clamp01((lt - 0.5) / 0.3); ctx.fillText(parseDate(tale.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase(), W / 2, 905);
    ctx.restore();
    if (tale.thought) {
      ctx.save(); ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.font = 'italic 500 40px Playfair Display, Georgia, serif';
      let rem = Math.floor(tale.thought.length * clamp01((lt - 0.9) / Math.max(0.6, per - 1.5)));
      ctx.textAlign = 'left';
      wrap(ctx, tale.thought, W - 130).forEach((l, li) => { if (rem > 0) ctx.fillText(l.slice(0, rem), W / 2 - ctx.measureText(l).width / 2, 950 + li * 54); rem -= l.length + 1; });
      ctx.restore();
    }
    if (tale.audio) { // a little waveform while the voice plays
      ctx.save(); ctx.fillStyle = INK; for (let b = 0; b < 17; b++) { const hh = 8 + 24 * Math.abs(Math.sin(lt * 7 + b * 0.8)); ctx.fillRect(W / 2 - 100 + b * 12, 1188 - hh / 2, 6, hh); } ctx.restore();
    }
  };

  frame(0);
  if (actx) tales.forEach((t, i) => {
    const b = buffers[i]; if (!b) return;
    const src = actx.createBufferSource(); src.buffer = b; const g = actx.createGain();
    const st = actx.currentTime + 0.15 + INTRO + i * per + 0.5; g.gain.setValueAtTime(0, st); g.gain.linearRampToValueAtTime(1, st + 0.15); g.gain.setValueAtTime(1, st + Math.min(b.duration, per - 0.9) - 0.2); g.gain.linearRampToValueAtTime(0, st + Math.min(b.duration, per - 0.9));
    src.connect(g); g.connect(dest); src.start(st, 0, Math.min(b.duration, per - 0.9));
  });
  if (actx && dest && music && music !== 'none') {          // happy background tune, quieter than the voice notes
    try { const src = actx.createBufferSource(); src.buffer = toBuffer(actx, music, total + 1); const g = actx.createGain(); g.gain.value = .32; src.connect(g); g.connect(dest); src.start(actx.currentTime + 0.15); } catch { /* the video still works without music */ }
  }
  rec.start(250);
  const t0 = performance.now() + 150;
  await new Promise((res) => {
    const tick = () => {
      const t = Math.max(0, (performance.now() - t0) / 1000);
      frame(Math.min(t, total)); onProgress?.(Math.min(1, t / total));
      if (t >= total + 0.2) res(); else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  rec.stop(); stream.getTracks().forEach((tr) => tr.stop()); actx?.close?.();
  const blob = await done;
  return { blob, mime: blob.type, duration: total, count: n, hasAudio: !!(dest && dest.stream.getAudioTracks().length) };
}
