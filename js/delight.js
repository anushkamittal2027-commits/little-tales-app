// Little moments of joy: confetti, the first-tale card and streak milestones.
import { h, icon } from './util.js';
import { toast } from './nav.js';
import { shareTale } from './share.js';
import { stampEl } from './stamp.js';

const COLORS = ['#FF4FA3', '#C6F135', '#25C7B7', '#FFD93D', '#6FA8FF', '#FF6B4A'];
const calm = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };

// A short burst of paper confetti on a canvas that removes itself.
export function confetti(ms = 2600) {
  if (calm() || !document.body) return;
  const c = document.createElement('canvas'); c.className = 'confetti'; c.setAttribute('aria-hidden', 'true');
  const dpr = Math.min(2, window.devicePixelRatio || 1), W = window.innerWidth, H = window.innerHeight;
  c.width = W * dpr; c.height = H * dpr;
  document.body.append(c);
  const ctx = c.getContext('2d'); if (!ctx) { c.remove(); return; }
  ctx.scale(dpr, dpr);
  const bits = Array.from({ length: 90 }, (_, i) => {
    const side = i % 2 ? 1 : -1;
    return { x: W / 2 + side * 20, y: H * 0.62, vx: side * (1.5 + Math.random() * 6), vy: -(7 + Math.random() * 9), w: 6 + Math.random() * 7, h: 9 + Math.random() * 9, r: Math.random() * 6, vr: (Math.random() - .5) * .35, col: COLORS[i % COLORS.length] };
  });
  const t0 = performance.now();
  const tick = (now) => {
    const k = now - t0; ctx.clearRect(0, 0, W, H);
    const fade = k > ms - 600 ? Math.max(0, (ms - k) / 600) : 1;
    ctx.globalAlpha = fade;
    for (const b of bits) {
      b.vy += .38; b.vx *= .992; b.x += b.vx; b.y += b.vy; b.r += b.vr;
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.r); ctx.fillStyle = b.col; ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h); ctx.restore();
    }
    if (k < ms) requestAnimationFrame(tick); else c.remove();
  };
  requestAnimationFrame(tick);
}

function card({ kicker, title, body, tale }) {
  confetti();
  const root = document.getElementById('app');
  const close = () => { wrap.classList.add('out'); setTimeout(() => wrap.remove(), 200); };
  const share = h('button.btn-primary', { onClick: async (ev) => {
    const b = ev.currentTarget; if (b.disabled) return; b.disabled = true;
    try { const r = await shareTale(tale); if (r === 'saved') toast('Saved as a picture'); } catch (e) { console.warn(e); toast('We couldn’t make the picture. Please try again.'); }
    b.disabled = false;
  } }, h('span.btn-ic', { html: icon.share }), 'Share this stamp');
  const wrap = h('div.cel-backdrop', { onClick: (e) => { if (e.target === wrap) close(); } },
    h('div.celebrate', { role: 'dialog', 'aria-labelledby': 'celebrate-title' },
      tale ? h('div.cel-stamp', stampEl(tale, { size: '13px' })) : null,
      h('p.cel-kicker', kicker),
      h('h2', { id: 'celebrate-title' }, title), h('p.cel-body', body),
      tale ? share : null,
      h('button.link', { onClick: close }, 'Maybe later')));
  root.append(wrap);
}

export const FLAME = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.4 2.5c.4 3-1.2 4.6-2.7 6.2C8.3 10.2 7 11.7 7 14a5 5 0 0 0 10 0c0-1.6-.7-2.9-1.6-4 .1 1.1-.4 1.9-1.2 2.3.6-3-.2-6.8-1.8-9.8z"/></svg>';

export function celebrateFirst(tale) {
  card({ kicker: 'the first of many', title: 'Your first little tale!', body: 'It’s tucked safely in your calendar. Come back tomorrow to start a streak.', tale });
}

export function celebrateStreak(n, tale) {
  card({ kicker: 'keep the flame going', title: `${n} days in a row!`, body: n >= 30 ? 'A whole habit of noticing. That’s really something.' : 'You keep coming back to what matters. Lovely.', tale });
}
