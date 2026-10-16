import { h, icon, MAX_PER_DAY, MAX_THOUGHT, todayStr, parseDate, toDateStr, addDays, monthName, longDate, shortDate, uid, fileToPhoto, drawToJpeg } from './util.js';
import { store } from './store.js';
import { state, register, go, back, toast, sheet } from './nav.js';
import { stampEl, pageEl, LIGHTS, stampPathPx } from './stamp.js';
import { makeEditor } from './decorate.js';
import { Recorder, MAX_SECONDS } from './recorder.js';
import { LOGO, artSvg } from './art.js';
import { seedSamples, samplePhoto } from './sample.js';

// ---------- shared pieces ----------
const topBar = (right) => h('div.topbar',
  h('button.icon-btn', { 'aria-label': 'Back', onClick: () => back(), html: icon.back }),
  h('div.topbar-right', right));

const primary = (label, onClick, attrs = {}) => h('button.btn-primary', { onClick, ...attrs }, label);
const linkBtn = (label, onClick) => h('button.link', { onClick }, label);

function dots(n, max = MAX_PER_DAY) {
  return h('div.dots', { 'aria-label': `${n} of ${max} tales` },
    Array.from({ length: max }, (_, i) => h('span.dot' + (i < n ? '.on' : ''))));
}

const newDraft = (date = todayStr()) => ({
  id: uid(), date, createdAt: Date.now(), photo: null, thought: '', audio: null, audioDur: 0,
  title: '', light: 'golden', decorations: [],
});

// ---------- the 3-a-day rule ----------
async function logAttempt(date) {
  const list = (await store.getMeta('attempts')) || [];
  list.push({ at: new Date().toISOString(), forDate: date });
  await store.setMeta('attempts', list);
}
// Returns true if a new tale may be started for this day.
function canStart(date) {
  if (store.count(date) < MAX_PER_DAY) return true;
  logAttempt(date);
  const isToday = date === todayStr();
  const close = sheet(h('div.limit',
    h('div.limit-stamps', ...store.forDate(date).slice(0, 3).map((t, i) =>
      h('div.limit-stamp', { style: { transform: `rotate(${[-6, 3, -2][i]}deg)` } }, stampEl(t, { size: '7px', postmark: false })))),
    h('h2', `You've kept 3 little tales ${isToday ? 'today' : 'that day'}.`),
    h('p', isToday ? 'Come back tomorrow for more.' : 'Pick another day, or come back tomorrow for more.'),
    primary(isToday ? 'Okay, tomorrow' : 'Okay', () => close())));
  return false;
}

// =====================================================
// WELCOME (first time only)
// =====================================================
register('welcome', () => {
  const mk = (photo, title, rot, size = '9.5px') => ({ el: stampEl({ date: todayStr(), photo: samplePhoto(photo), light: 'golden', title }, { size, postmark: false }), rot });
  const c1 = mk('string-lights', '', -9), c2 = mk('skyline-dusk', '', 4, '12px'), c3 = mk('rain-bokeh', '', -3);
  return h('div.welcome',
    h('div.welcome-collage',
      h('div.wc.wc1', { style: { '--rot': '-9deg' } }, c1.el),
      h('div.wc.wc3', { style: { '--rot': '7deg' } }, c3.el),
      h('div.wc.wc2', { style: { '--rot': '-3deg' } }, c2.el),
      h('div.wc-tape.t1', { html: artSvg('tape', 'tape-dots') }),
      h('div.wc-tape.t2', { html: artSvg('tape', 'tape-apricot') }),
      h('div.wc-sticker.s1', { html: artSvg('stickers', 'sun') }),
      h('div.wc-sticker.s2', { html: artSvg('stickers', 'heart') }),
      h('div.wc-sticker.s3', { html: artSvg('stickers', 'withlove') })),
    h('div.welcome-copy',
      h('div.brand-line', h('span.logo', { html: LOGO }), 'Little Tales'),
      h('h1', 'Your camera roll forgets. ', h('span.hl.hl-lime', h('em', 'Your album won\u2019t.'))),
      h('p', 'Catch a little moment, say how it felt, and watch it become a stamp in your own scrapbook.')),
    h('div.bottom', primary('Start my album', async () => { await store.setMeta('welcomed', true); go('calendar', {}, { replace: true }); })));
});

// =====================================================
// CALENDAR (home)
// =====================================================
register('calendar', () => {
  const today = todayStr();
  if (!state.month) { const d = new Date(); state.month = { y: d.getFullYear(), m: d.getMonth() }; }
  const { y, m } = state.month;
  const shift = (n) => { const d = new Date(y, m + n, 1); state.month = { y: d.getFullYear(), m: d.getMonth() }; go('calendar', {}, { replace: true }); };

  let taps = 0, tapTimer;
  const logo = h('button.brand', { 'aria-label': 'Little Tales', onClick: () => {
    taps++; clearTimeout(tapTimer); tapTimer = setTimeout(() => (taps = 0), 1200);
    if (taps >= 5) { taps = 0; founderPanel(); }
  } }, h('span.logo', { html: LOGO }), 'Little Tales');

  const first = new Date(y, m, 1), days = new Date(y, m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < first.getDay(); i++) cells.push(h('div.cell.blank'));
  for (let d = 1; d <= days; d++) {
    const ds = toDateStr(new Date(y, m, d));
    const tales = store.forDate(ds);
    const future = ds > today, isToday = ds === today;
    const cls = ['cell', isToday && 'today', future && 'future', tales.length && 'has'].filter(Boolean).join('.');
    const cell = h('button.' + cls, {
      'aria-label': `${shortDate(ds)}${tales.length ? `, ${tales.length} tales` : ''}`,
      onClick: () => {
        if (tales.length) go('day', { date: ds });
        else if (isToday) startToday();
      },
    },
      tales.length
        ? [h('div.cover' + (state.justPosted && tales.some((t) => t.id === state.justPosted) ? '.new' : ''), stampEl(tales[0], { size: '8.2cqw', mini: true })), h('span.num', d), dots(tales.length)]
        : [h('span.num', d), isToday ? dots(0) : null]);
    cells.push(cell);
  }
  state.justPosted = null;

  const todayCount = store.count(today);
  return h('div.calendar',
    h('div.cal-head', logo),
    h('div.cal-sheet',
      h('div.month-nav',
        h('h1', h('span.big', (state.month.y === new Date().getFullYear() && state.month.m === new Date().getMonth()) ? new Date().getDate() : 1), h('span.stack', h('span.yr', y), h('em', monthName(m)))),
        h('div.arrows',
          h('button.icon-btn', { 'aria-label': 'Previous month', onClick: () => shift(-1), html: icon.back }),
          h('button.icon-btn', { 'aria-label': 'Next month', onClick: () => shift(1), html: icon.chevR }))),
      h('div.weekdays', ...['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => h('span', d))),
      h('div.grid', ...cells)),
    latestStrip(),
    h('div.bottom',
      primary("Make today's stamp", startToday),
      h('p.hint', todayCount ? `${todayCount} of ${MAX_PER_DAY} kept today` : 'Today counts.')));
});

function latestStrip() {
  const list = [...store.tales].sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt)).slice(0, 7);
  if (!list.length) return null;
  const rots = [-4, 3, -2, 5, -5, 2, -3];
  return h('div.latest',
    h('div.latest-title', 'Latest ', h('em', 'tales')),
    h('div.latest-row', ...list.map((t, i) =>
      h('button.latest-card', { 'aria-label': t.title || shortDate(t.date), style: { '--rot': rots[i % rots.length] + 'deg' }, onClick: () => go('tale', { id: t.id }) },
        stampEl(t, { size: '6.2px', mini: false, postmark: false })))));
}

function startToday() {
  if (!canStart(todayStr())) return;
  state.draft = newDraft();
  go('moment');
}

// =====================================================
// ADD A MOMENT
// =====================================================
register('moment', (p) => {
  const edit = p.editId ? store.byId(p.editId) : null;
  if (!edit && !state.draft) state.draft = newDraft();

  const fileInput = h('input', { type: 'file', accept: 'image/*', hidden: true, onChange: onFile });
  async function onFile() {
    const f = fileInput.files[0]; if (!f) return;
    const photo = await fileToPhoto(f);
    if (edit) { edit.photo = photo; await store.save(edit); toast('Photo retaken'); back('calendar'); return; }
    state.draft.photo = photo;
    chooseDay();
  }
  function chooseDay() {
    const today = todayStr();
    const input = h('input.date-input', { type: 'date', value: state.draft.date, max: today });
    const msg = h('p.sheet-msg');
    const close = sheet(h('div.daypick',
      h('h2', 'Which day is this from?'),
      h('p', 'Pick the day this moment belongs to. Today is fine too.'),
      input, msg,
      primary('Continue', () => {
        const d = input.value || today;
        if (d > today) { msg.textContent = 'Tales can only be kept for today or earlier.'; return; }
        if (store.count(d) >= MAX_PER_DAY) { close(); canStart(d); return; }
        state.draft.date = d; close(); go('thought');
      })), { onClose: () => {} });
  }

  const cam = h('button.btn-primary.big', { onClick: () => {
    if (!edit && !canStart(state.draft.date)) return;
    go('camera', edit ? { editId: edit.id } : {}, { replace: !!edit });
  } }, h('span.btn-ic', { html: icon.camera }), 'Take a photo');
  const gal = h('button.btn-secondary', { onClick: () => {
    if (!edit && !canStart(todayStr())) return;
    fileInput.click();
  } }, h('span.btn-ic', { html: icon.image }), 'From your gallery');

  return h('div.moment',
    topBar(),
    h('div.moment-hero', stampEl({ date: todayStr(), photo: null, light: 'golden' }, { size: '16px', postmark: false })),
    h('div.moment-copy', h('h1', edit ? 'Retake the photo' : 'Add a moment'), h('p', 'What caught your eye?')),
    h('div.bottom.stack', cam, gal, fileInput));
});

// ---------- in-app camera: a bright live view with a 3D stamp cut-out ----------
const PLATE = { w: 330, h: 420, hx: 50, hy: 66, hw: 230, hh: 290 };
function platePath() {
  const { w, h } = PLATE, r = 64;
  return `M${r} 0 H${w - r} A${r} ${r} 0 0 1 ${w} ${r} V${h - r} A${r} ${r} 0 0 1 ${w - r} ${h} H${r} A${r} ${r} 0 0 1 0 ${h - r} V${r} A${r} ${r} 0 0 1 ${r} 0 Z`;
}
function plateSvg() {
  const hole = stampPathPx(PLATE.hw, PLATE.hh, PLATE.hx, PLATE.hy);
  const body = platePath();
  return `<svg viewBox="0 0 ${PLATE.w} ${PLATE.h}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="pm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".28" stop-color="#dfe3ea"/><stop offset=".5" stop-color="#f7f8fb"/><stop offset=".74" stop-color="#bcc3cf"/><stop offset="1" stop-color="#eef0f5"/></linearGradient>
    <linearGradient id="pe" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#7d8696" stop-opacity=".55"/></linearGradient>
    <pattern id="br" width="4" height="4" patternUnits="userSpaceOnUse"><path d="M0 1H4" stroke="#fff" stroke-opacity=".5" stroke-width=".6"/><path d="M0 3H4" stroke="#8d95a3" stroke-opacity=".25" stroke-width=".6"/></pattern>
    <filter id="sh" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="18" stdDeviation="16" flood-color="#2a2f45" flood-opacity=".35"/><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#2a2f45" flood-opacity=".25"/></filter>
    <filter id="ib"><feGaussianBlur stdDeviation="3.2"/></filter>
    <clipPath id="pc"><path d="${body}"/></clipPath>
  </defs>
  <g filter="url(#sh)"><path d="${body} ${hole}" fill="url(#pm)" fill-rule="evenodd"/></g>
  <path d="${body} ${hole}" fill="url(#br)" fill-rule="evenodd" opacity=".55"/>
  <path d="${body}" fill="none" stroke="url(#pe)" stroke-width="3"/>
  <path d="${body}" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1" transform="translate(0 1.5)" clip-path="url(#pc)"/>
  <path d="${hole}" fill="none" stroke="#1d2233" stroke-opacity=".55" stroke-width="7" filter="url(#ib)"/>
  <path d="${hole}" fill="none" stroke="#fff" stroke-opacity=".9" stroke-width="1.6" transform="translate(0 2.2)"/>
  <path d="${hole}" fill="none" stroke="#5b6376" stroke-opacity=".7" stroke-width="1.2"/>
  <path d="M30 22 C120 6 210 6 300 22" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="3" stroke-linecap="round"/>
</svg>`;
}

register('camera', (p) => {
  const edit = p.editId ? store.byId(p.editId) : null;
  let stream, facing = 'environment';
  const mkVideo = (cls) => h('video.' + cls, { autoplay: true, playsinline: true, muted: true });
  const bgVideo = mkVideo('cam-bg'), video = mkVideo('cam-video');
  const msg = h('div.cam-msg', { hidden: true });
  const flash = h('div.cam-flash');
  const fallback = h('input', { type: 'file', accept: 'image/*', capture: 'environment', hidden: true, onChange: async () => {
    const f = fallback.files[0]; if (f) await accept(await fileToPhoto(f));
  } });

  async function accept(photo) {
    if (edit) { edit.photo = photo; await store.save(edit); toast('Photo retaken'); back('calendar'); return; }
    state.draft.photo = photo; go('thought', {}, { replace: true });
  }
  async function open() {
    stop();
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facing }, width: { ideal: 1920 } }, audio: false });
      video.srcObject = stream; bgVideo.srcObject = stream; msg.hidden = true;
    } catch {
      msg.hidden = false;
      msg.replaceChildren(h('p', 'We couldn\u2019t open the camera here. You can use your phone\u2019s own camera instead.'),
        h('button.btn-primary', { onClick: () => fallback.click() }, 'Open phone camera'));
    }
  }
  const stop = () => { stream?.getTracks().forEach((t) => t.stop()); stream = null; };
  function snap() {
    if (!video.videoWidth) return;
    // crop the live view to exactly what shows through the stamp window
    const aspect = PLATE.hw / PLATE.hh, vw = video.videoWidth, vh = video.videoHeight;
    let sw = vw, sh = vw / aspect; if (sh > vh) { sh = vh; sw = vh * aspect; }
    const sx = (vw - sw) / 2, sy = (vh - sh) / 2;
    const c = document.createElement('canvas'); const k = Math.min(1, 1280 / Math.max(sw, sh));
    c.width = Math.round(sw * k); c.height = Math.round(sh * k);
    c.getContext('2d').drawImage(video, sx, sy, sw, sh, 0, 0, c.width, c.height);
    flash.classList.remove('go'); void flash.offsetWidth; flash.classList.add('go');
    plate.classList.add('punch');
    setTimeout(() => accept(c.toDataURL('image/jpeg', 0.84)), 260);
  }
  open();
  const pct = (v, t) => (v / t * 100) + '%';
  const plate = h('div.plate',
    h('div.plate-view', { style: { left: pct(PLATE.hx, PLATE.w), top: pct(PLATE.hy, PLATE.h), width: pct(PLATE.hw, PLATE.w), height: pct(PLATE.hh, PLATE.h) } }, video),
    h('div.plate-art', { html: plateSvg() }));
  const el = h('div.camera',
    bgVideo, h('div.cam-wash'),
    h('button.cam-close', { 'aria-label': 'Close camera', onClick: () => back(), html: icon.close }),
    h('div.cam-title', 'Frame your ', h('em', 'stamp')),
    h('div.plate-wrap', plate),
    h('p.cam-hint', 'Line up your moment inside the stamp'),
    msg,
    h('div.cam-bar',
      h('span.cam-spacer'),
      h('button.shutter', { 'aria-label': 'Take photo', onClick: snap }, h('span')),
      h('button.cam-flip', { 'aria-label': 'Switch camera', onClick: () => { facing = facing === 'environment' ? 'user' : 'environment'; open(); }, html: icon.flip })),
    flash, fallback);
  el._cleanup = stop;
  return el;
});

// ---------- voice note pill (play / pause) ----------
export function voicePill(src, dur, { onRemove, seed = 1 } = {}) {
  const url = src instanceof Blob ? URL.createObjectURL(src) : src;
  const audio = new Audio(url);
  const bars = Array.from({ length: 30 }, (_, i) => {
    const v = 0.25 + 0.75 * Math.abs(Math.sin((i + 1) * 1.7 * seed) * Math.cos(i * 0.6 + seed));
    return h('i', { style: { height: Math.round(v * 100) + '%' } });
  });
  const btn = h('button.vp-play', { 'aria-label': 'Play voice note', html: icon.play });
  const time = h('span.vp-time', fmtDur(dur));
  const set = (playing) => { btn.innerHTML = playing ? icon.pause : icon.play; };
  btn.onclick = () => { if (audio.paused) { audio.play().catch(() => {}); } else audio.pause(); };
  audio.onplay = () => set(true);
  audio.onpause = () => set(false);
  audio.onended = () => { set(false); bars.forEach((b) => b.classList.remove('on')); time.textContent = fmtDur(dur); };
  audio.ontimeupdate = () => {
    const d = isFinite(audio.duration) && audio.duration ? audio.duration : dur;
    const k = Math.floor((audio.currentTime / d) * bars.length);
    bars.forEach((b, i) => b.classList.toggle('on', i < k));
    time.textContent = fmtDur(audio.currentTime);
  };
  const el = h('div.voice-pill', btn, h('div.vp-bars', bars), time,
    onRemove ? h('button.vp-x', { 'aria-label': 'Remove voice note', onClick: () => { audio.pause(); onRemove(); }, html: icon.close }) : null);
  el._stop = () => audio.pause();
  return el;
}
const fmtDur = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// =====================================================
// ADD A THOUGHT (also used to edit a thought)
// =====================================================
register('thought', (p) => {
  const edit = p.editId ? store.byId(p.editId) : null;
  const t = edit ? { ...edit } : state.draft;
  if (!t || (!edit && !t.photo)) return redirectHome();

  const voiceArea = h('div.voice-area');
  let rec, holding = false, recording = false, el;

  const ta = h('textarea.thought-input', { rows: 3, maxlength: MAX_THOUGHT, placeholder: 'Or write a line… (up to 140 characters)', 'aria-label': 'Your thought' });
  ta.value = t.thought || '';
  const count = h('span.count', `${ta.value.length}/${MAX_THOUGHT}`);
  ta.addEventListener('input', () => { t.thought = ta.value; count.textContent = `${ta.value.length}/${MAX_THOUGHT}`; });

  function renderVoice(note) {
    voiceArea.replaceChildren();
    if (t.audio && !recording) {
      voiceArea.append(voicePill(t.audio, t.audioDur, { onRemove: () => { t.audio = null; t.audioDur = 0; renderVoice(); } }));
      return;
    }
    const wave = h('div.wave', ...Array.from({ length: 24 }, () => h('i')));
    const label = h('div.mic-label', note || (recording ? '0:00' : 'Hold to record'));
    const mic = h('button.mic' + (recording ? '.rec' : ''), { 'aria-label': 'Hold to record a voice note', html: icon.mic });
    mic.addEventListener('contextmenu', (e) => e.preventDefault());
    mic.addEventListener('pointerdown', async (e) => {
      e.preventDefault(); mic.setPointerCapture(e.pointerId);
      holding = true;
      rec = new Recorder((lvl, secs) => {
        wave.querySelectorAll('i').forEach((b, i) => { b.style.height = Math.max(8, Math.min(100, lvl * 130 * (0.5 + Math.abs(Math.sin(i * 1.3 + secs * 6))))) + '%'; });
        label.textContent = fmtDur(secs);
        if (secs >= MAX_SECONDS) finish();
      });
      try { await rec.start(); }
      catch { holding = false; renderVoice('Microphone is off. You can type instead.'); return; }
      if (!holding) { rec.cancel(); renderVoice('Microphone is ready. Hold to record.'); return; }
      recording = true; mic.classList.add('rec'); wave.classList.add('live');
    });
    const finish = async () => {
      holding = false;
      if (!recording) return;
      recording = false;
      const r = await rec.stop();
      if (!r || r.duration < 0.7) { renderVoice('Hold a little longer'); return; }
      t.audio = r.blob; t.audioDur = r.duration; renderVoice();
    };
    mic.addEventListener('pointerup', finish);
    mic.addEventListener('pointercancel', finish);
    voiceArea.append(h('div.mic-wrap', wave, mic, label));
  }
  renderVoice();

  const heroTale = edit ? t : state.draft;
  el = h('div.thought',
    topBar(!edit ? linkBtn('Retake photo', () => { go('moment', {}, { replace: true }); }) : null),
    h('div.thought-hero', stampEl(heroTale, { size: '10px', postmark: false })),
    h('h1', 'What were you thinking?'),
    voiceArea,
    h('div.text-wrap', ta, count),
    h('div.bottom', primary(edit ? 'Save changes' : 'Make it a stamp', async () => {
      if (recording) return;
      if (edit) { edit.thought = t.thought; edit.audio = t.audio; edit.audioDur = t.audioDur; await store.save(edit); toast('Saved'); back('calendar'); }
      else go('frame');
    })));
  el._cleanup = () => { holding = false; if (recording) rec?.cancel(); };
  return el;
});

const redirectHome = () => { queueMicrotask(() => go('calendar', {}, { replace: true })); return h('div'); };

// =====================================================
// FRAME IT (also used to edit the stamp)
// =====================================================
register('frame', (p) => {
  const edit = p.editId ? store.byId(p.editId) : null;
  const t = edit ? { ...edit } : state.draft;
  if (!t || (!edit && !t.photo)) return redirectHome();

  const heroBox = h('div.frame-hero');
  const draw = () => heroBox.replaceChildren(stampEl(t, { size: '19px', postmark: false }));
  draw();
  const chips = h('div.chips');
  const drawChips = () => chips.replaceChildren(...LIGHTS.map((l) =>
    h('button.chip.lt-' + l.id + (t.light === l.id ? '.on' : ''), { onClick: () => { t.light = l.id; draw(); drawChips(); } }, l.label)));
  drawChips();
  const title = h('input.title-input', { type: 'text', maxlength: 32, placeholder: 'Give it a little title', 'aria-label': 'Title' });
  title.value = t.title || '';
  title.addEventListener('input', () => { t.title = title.value; });

  const next = async () => {
    if (edit) { edit.light = t.light; edit.title = t.title; await store.save(edit); toast('Saved'); back('calendar'); }
    else go('stamping');
  };
  return h('div.frame',
    topBar(),
    heroBox,
    h('div.frame-controls',
      h('div.label', 'Pick a light'), chips,
      h('div.label', 'Title (optional)'), title),
    h('div.bottom.stack', primary(edit ? 'Save' : 'Stamp it', next), edit ? null : linkBtn('Skip for now', next)));
});

// =====================================================
// STAMPING (the < 2 second animation)
// =====================================================
register('stamping', () => {
  const t = state.draft;
  if (!t || !t.photo) return redirectHome();
  const stamp = stampEl(t, { size: '23px', developing: true });
  const el = h('div.stamping', h('div.stamping-stage', stamp), h('p.stamping-text', 'Stamping…'));
  let done = false;
  const next = () => { if (!done) { done = true; go('decorate', {}, { replace: true }); } };
  const timer = setTimeout(next, 1900);
  el.addEventListener('click', next);
  el._cleanup = () => clearTimeout(timer);
  return el;
});

// =====================================================
// DECORATE (new tale, or an existing one)
// =====================================================
register('decorate', (p) => {
  const existing = p.id ? store.byId(p.id) : null;
  const t = existing ? { ...existing, decorations: existing.decorations.map((d) => ({ ...d })) } : state.draft;
  if (!t || !t.photo) return redirectHome();

  const page = pageEl(t);
  const hint = h('p.deco-hint', 'Tap to add. Drag to move. Use the corner to resize and turn.');
  const skipSlot = h('div.skip-slot');
  const refresh = () => {
    hint.hidden = t.decorations.length > 0;
    skipSlot.replaceChildren(...(t.decorations.length || existing ? [] : [linkBtn('Skip for now', () => go('ready'))]));
  };
  const ed = makeEditor(page, t.decorations, refresh);
  refresh();

  const done = async () => {
    ed.deselect();
    if (existing) { existing.decorations = t.decorations; await store.save(existing); toast('Saved'); back('calendar'); }
    else go('ready');
  };
  return h('div.decorate',
    h('div.topbar', h('button.icon-btn', { 'aria-label': 'Back', onClick: () => back(), html: icon.back }),
      h('div.topbar-title', 'Decorate your page'), skipSlot),
    h('div.page-frame', page),
    hint,
    ed.tray,
    h('div.bottom.tight', primary('Done decorating', done)));
});

// =====================================================
// TALE READY (preview + post)
// =====================================================
register('ready', () => {
  const t = state.draft;
  if (!t || !t.photo) return redirectHome();
  return h('div.ready',
    h('div.topbar', h('button.icon-btn', { 'aria-label': 'Back', onClick: () => back(), html: icon.back }), h('div.topbar-title', 'Your tale is ready')),
    h('div.page-frame', pageEl(t)),
    h('div.bottom.stack',
      primary('Post to my calendar', async () => {
        if (store.count(t.date) >= MAX_PER_DAY) { canStart(t.date); return; }
        const saved = { ...t, createdAt: Date.now() };
        await store.save(saved);
        state.justPosted = saved.id;
        const d = parseDate(saved.date); state.month = { y: d.getFullYear(), m: d.getMonth() };
        state.draft = null;
        go('calendar', {}, { replace: true });
        toast('Posted to your calendar');
      }),
      linkBtn('Back to decorating', () => back())));
});

// =====================================================
// DAY (1 to 3 tales side by side)
// =====================================================
register('day', (p) => {
  const tales = store.forDate(p.date);
  if (!tales.length) return redirectHome();
  const isToday = p.date === todayStr();
  return h('div.day',
    topBar(),
    h('div.day-head', h('div.day-kicker', isToday ? 'Today' : 'A day to remember'), h('h1', longDate(p.date)), dots(tales.length)),
    h('div.day-row.n' + tales.length, ...tales.map((t) =>
      h('button.day-card', { onClick: () => go('tale', { id: t.id }) },
        stampEl(t, { size: tales.length === 1 ? '17px' : tales.length === 2 ? '11.5px' : '8.2px' }),
        t.title ? h('div.day-title', t.title) : null))),
    tales.length < MAX_PER_DAY && isToday
      ? h('div.bottom', primary('Add another tale', () => { if (!canStart(p.date)) return; state.draft = newDraft(p.date); go('moment'); }))
      : null);
});

// =====================================================
// TALE DETAIL
// =====================================================
register('tale', (p) => {
  const t = store.byId(p.id);
  if (!t) return redirectHome();
  const pill = t.audio ? voicePill(t.audio, t.audioDur, { seed: (t.createdAt % 7) + 1 }) : null;
  const el = h('div.tale',
    h('div.topbar', h('button.icon-btn', { 'aria-label': 'Back', onClick: () => back(), html: icon.back }),
      h('div.topbar-right', h('button.icon-btn', { 'aria-label': 'More', onClick: () => taleMenu(t), html: icon.more }))),
    h('div.page-frame', pageEl(t)),
    pill ? h('div.tale-voice', pill) : null,
    h('div.bottom', h('button.btn-secondary', { onClick: () => go('decorate', { id: t.id }) }, 'Decorate')));
  el._cleanup = () => pill?._stop();
  return el;
});

function taleMenu(t) {
  const close = sheet(h('div.menu',
    h('h2', 'This tale'),
    ...[
      ['Edit thought', () => go('thought', { editId: t.id })],
      ['Edit stamp', () => go('frame', { editId: t.id })],
      ['Retake photo', () => go('moment', { editId: t.id })],
    ].map(([label, fn]) => h('button.menu-item', { onClick: () => { close(); fn(); } }, label, h('span', { html: icon.chevR }))),
    h('button.menu-item.danger', { onClick: () => { close(); confirmDelete(t); } }, 'Delete this tale', h('span', { html: icon.trash }))));
}
function confirmDelete(t) {
  const close = sheet(h('div.confirm',
    h('h2', 'Delete this tale?'),
    h('p', 'It will be gone for good. That day will have room for another tale.'),
    h('button.btn-danger', { onClick: async () => {
      await store.remove(t.id); close(); toast('Tale deleted');
      state.month = null;
      go(store.count(t.date) ? 'day' : 'calendar', { date: t.date }, { replace: true });
    } }, 'Delete'),
    linkBtn('Keep it', () => close())));
}

// =====================================================
// FOUNDER PANEL (hidden: tap the logo five times)
// =====================================================
async function founderPanel() {
  const attempts = (await store.getMeta('attempts')) || [];
  const close = sheet(h('div.founder',
    h('h2', 'Founder panel'),
    h('p.muted', 'Only you see this. Tap the logo five times to open it.'),
    h('div.stat', h('b', attempts.length), (attempts.length === 1 ? ' attempt' : ' attempts') + ' to make a 4th tale in a day'),
    attempts.length ? h('ul.attempts', ...attempts.slice(-8).reverse().map((a) => h('li', `${new Date(a.at).toLocaleString()} → day ${a.forDate}`))) : null,
    h('div.stack-sm',
      h('button.btn-secondary', { onClick: async () => { await store.removeSamples(); await seedSamples(); close(); toast('Sample tales reloaded'); go('calendar', {}, { replace: true }); } }, 'Reload sample tales'),
      h('button.btn-secondary', { onClick: async () => { await store.removeSamples(); close(); toast('Sample tales removed'); go('calendar', {}, { replace: true }); } }, 'Remove sample tales'),
      h('button.btn-secondary', { onClick: async () => { await store.setMeta('attempts', []); close(); toast('Attempt counter reset'); } }, 'Reset attempt counter'),
      h('button.btn-danger', { onClick: async () => { if (!confirm('Delete every tale on this phone?')) return; await store.clear(); close(); toast('Everything deleted'); go('calendar', {}, { replace: true }); } }, 'Delete all tales on this phone')),
    h('p.muted', 'Trial days, Day 7 video, paywall and locked-screen jumps arrive in Stages 4 to 7.')));
}
