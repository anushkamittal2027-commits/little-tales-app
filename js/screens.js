import { h, icon, makeThumb, buzz, dotDate, dayTitle, MAX_PER_DAY, MAX_THOUGHT, todayStr, parseDate, toDateStr, addDays, monthName, longDate, shortDate, uid, fileToPhoto, drawToJpeg } from './util.js';
import { store } from './store.js';
import { state, register, go, back, toast, sheet } from './nav.js';
import { stampEl, pageEl, LIGHTS, blockColor } from './stamp.js';
import { filterCss } from './filters.js';
import { transcribe } from './speech.js';
import { auth } from './auth.js';
import { makeEditor } from './decorate.js';
import { Recorder, MAX_SECONDS, micMessage, Dictation, dictationSupported, playChime, playParty, playStamp } from './recorder.js';
import { LOGO, artSvg } from './art.js';
import { seedSamples, samplePhoto, seedTrialWeek } from './sample.js';
import { logAttemptOnline, isFounder, syncState } from './sync.js';
import { APP_VERSION } from './config.js';
import { account, trialInfo, jumpTo, resetDemo, saveAccount, patchAccount, TRIAL_DAYS } from './account.js';
import { prepareShare, shareTale } from './share.js';
import { computeStreak, MILESTONES } from './streak.js';
import { celebrateFirst, celebrateStreak } from './delight.js';

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
  title: '', light: 'none', decorations: [],
});

// ---------- the 3-a-day rule ----------
async function logAttempt(date) {
  const list = (await store.getMeta('attempts')) || [];
  list.push({ at: new Date().toISOString(), forDate: date });
  await store.setMeta('attempts', list);
  logAttemptOnline(date);
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
const STAR = '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 6l6.6 16.6L56 24l-13.6 11L47 52 32 42.6 17 52l4.6-17L8 24l17.4-1.4z" fill="#F2C94C" stroke="#E0AE2C" stroke-width="2" stroke-linejoin="round"/></svg>';
const SPARK = '<svg viewBox="0 0 34 34" aria-hidden="true"><path d="M17 2v30M2 17h30M6.5 6.5l21 21M27.5 6.5l-21 21" stroke="#E7B93E" stroke-width="2.4" stroke-linecap="round" fill="none"/></svg>';
register('welcome', () => {
  const demo = { date: todayStr(), photo: samplePhoto('e-van'), light: 'none' };
  return h('div.welcome',
    h('div.welcome-head', h('h1', 'Little Tales'), h('p', 'Turn little moments', h('br'), 'into memories.')),
    h('div.welcome-art', { 'aria-hidden': 'true' },
      h('div.wa-gingham'), h('div.wa-block'),
      h('div.wa-stamp', stampEl(demo, { size: '20px', postmark: false })),
      h('div.wa-tape'), h('div.wa-star', { html: STAR }), h('div.wa-spark', { html: SPARK }),
      h('div.wa-note', 'Small moments,', h('br'), 'big stories')),
    h('div.bottom',
      primary('Start my album', () => go('signin')),
      h('button.link.welcome-signin', { onClick: () => go('signin') }, 'I already have an album · Sign in'),
      h('p.fine.center', 'Private by default. No feed, no followers.'),
      h('p.fine.center.ver', 'Little Tales ' + APP_VERSION)));
});

// =====================================================
// CALENDAR (home)
// =====================================================
register('calendar', () => {
  const today = todayStr();
  const tinfo = trialInfo();
  if (tinfo.status === 'day7' && !account.day7Shown) queueMicrotask(() => go('weekvideo', { mode: 'trial' }, { replace: true }));
  if (!state.month) { const d = new Date(); state.month = { y: d.getFullYear(), m: d.getMonth() }; }
  const { y, m } = state.month;
  const shift = (n) => { const d = new Date(y, m + n, 1); state.month = { y: d.getFullYear(), m: d.getMonth() }; go('calendar', {}, { replace: true }); };

  const first = new Date(y, m, 1), days = new Date(y, m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < first.getDay(); i++) cells.push(h('div.cell.blank'));
  let monthTales = 0;
  for (let d = 1; d <= days; d++) {
    const ds = toDateStr(new Date(y, m, d));
    const tales = store.forDate(ds);
    monthTales += tales.length;
    const future = ds > today, isToday = ds === today;
    const cls = ['cell', isToday && 'today', future && 'future', tales.length && 'has'].filter(Boolean).join('.');
    const cell = h('button.' + cls, {
      'aria-label': `${shortDate(ds)}${tales.length ? `, ${tales.length} tales` : ''}${isToday && !tales.length ? ', add a tale' : ''}`,
      onClick: () => {
        if (tales.length) go('day', { date: ds });
        else if (isToday) startToday();
      },
    },
      tales.length
        ? [h('div.cover' + (state.justPosted && tales.some((t) => t.id === state.justPosted) ? '.new' : ''), stampEl(tales[0], { size: 'inherit', mini: true }), h('span.num', d)), dots(tales.length)]
        : isToday ? [h('span.num', d), h('span.plus', { 'aria-hidden': 'true', html: icon.plus })] : [h('span.num', d)]);
    cells.push(cell);
  }
  state.justPosted = null;

  let taps = 0, tapTimer;
  const title = h('h1', { onClick: () => {
    taps++; clearTimeout(tapTimer); tapTimer = setTimeout(() => (taps = 0), 1200);
    if (taps >= 5) { taps = 0; if (isFounder()) founderPanel(); }
  } }, `${monthName(m)} ${y}`);
  const todayCount = store.count(today);
  const root = h('div.calendar',
    h('header.cal-head',
      h('div', h('p.kicker', `${monthTales} ${monthTales === 1 ? 'TALE' : 'TALES'} THIS MONTH`), title),
      h('div.arrows',
        h('button.icon-btn', { 'aria-label': 'Previous month', onClick: () => shift(-1), html: icon.back }),
        h('button.icon-btn', { 'aria-label': 'Next month', onClick: () => shift(1), html: icon.chevR }))),
    sundayBanner(tinfo),
    h('div.cal-sheet',
      h('div.weekdays', { 'aria-hidden': 'true' }, ...['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d) => h('span', d))),
      h('div.grid', ...cells)),
    h('p.cal-legend', h('span.dot.on'), h('span', h('b', `Today: ${todayCount} of ${MAX_PER_DAY} kept.`), ' Dots show how many tales a day holds.')),
    latestStrip());
  // swipe left or right to change month
  let sx = 0, sy = 0;
  root.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  root.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 70 && Math.abs(dy) < 45 && !e.target.closest('.latest-row')) shift(dx < 0 ? 1 : -1);
  }, { passive: true });
  return root;
});

export function trialPill(info) {
  const label = { trial: `Day ${info.day} of ${TRIAL_DAYS} \u00b7 free`, day7: 'Last free day', subscribed: 'Member' }[info.status];
  if (!label) return null;
  return h('button.pill' + (info.status === 'day7' ? '.hot' : ''), { onClick: () => go(info.status === 'subscribed' ? 'account' : 'paywall', { from: 'pill' }) }, label);
}
export function sundayBanner(info) {
  if (info.status !== 'subscribed' || new Date(Date.now() + (account.dayOffset || 0) * 864e5).getDay() !== 0 || account.videos['week-' + todayStr()]) return null;
  return h('button.banner', { onClick: () => go('weekvideo', { mode: 'sunday' }) }, h('span.banner-ic', { html: icon.film }), h('span', h('b', 'Your week is ready'), h('small', 'Tap to watch this Sunday\u2019s video')), h('span.banner-go', { html: icon.chevR }));
}

function latestStrip() {
  const list = [...store.tales].sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt)).slice(0, 8);
  if (!list.length) return syncState.pulling ? h('section.latest', h('h2', 'Latest tales'), h('div.latest-row', ...[0, 1, 2, 3].map(() => h('div.sk-stamp', { 'aria-hidden': 'true' })))) : null;
  const rots = [-3, 2, -2, 3, -3, 2, -2, 3];
  return h('section.latest',
    h('h2', 'Latest tales'),
    h('div.latest-row', ...list.map((t, i) =>
      h('button.latest-card', { 'aria-label': t.title || shortDate(t.date), style: { '--rot': rots[i % rots.length] + 'deg' }, onClick: () => go('tale', { id: t.id }) },
        stampEl(t, { size: '6.8px', postmark: false })))));
}

export function startToday() {
  if (!canStart(todayStr())) return;
  state.draft = newDraft();
  go('moment');
}

// =====================================================
// CAMERA (take a photo or choose one; also used to retake a photo)
// =====================================================
// The live picture is drawn on a canvas from the camera's raw frames and is never shown as a browser video, so it can never appear mirrored.
const PLATE = { hw: 85.8, hh: 106.8 };            // the photo window of the stamp (its shape decides how the photo is cropped)
const dayLabel = (ds) => (ds === todayStr() ? 'Today · ' : '') + shortDate(ds).replace(/^(\w+) (\d+) (\w+)$/, '$1 $2 $3');

const cameraScreen = (p) => {
  const edit = p.editId ? store.byId(p.editId) : null;
  if (!edit && !state.draft) state.draft = newDraft();
  let stream, facing = 'environment', demoRaf = 0, mirrored = false, lastBg = 0, frozen = false;
  const bgCanvas = h('canvas.cam-bg', { 'aria-hidden': 'true', width: 48, height: 64 });
  const video = h('video.cam-src', { autoplay: true, playsinline: true, muted: true });
  const view = h('canvas.cam-view', { 'aria-hidden': 'true' });
  let drawing = 0;
  const msg = h('div.cam-msg', { hidden: true });
  const flash = h('div.cam-flash');
  const fallback = h('input', { type: 'file', accept: 'image/*', capture: 'environment', hidden: true, onChange: async () => { const f = fallback.files[0]; if (f) await accept(await fileToPhoto(f)); } });
  const gallery = h('input', { type: 'file', accept: 'image/*', hidden: true, onChange: async () => { const f = gallery.files[0]; if (f) await accept(await fileToPhoto(f)); gallery.value = ''; } });

  async function accept(photo) {
    if (edit) { edit.photo = photo; edit.thumb = await makeThumb(photo).catch(() => undefined); await store.save(edit); toast('Photo retaken'); back('calendar'); return; }
    if (!canStart(state.draft.date)) return;
    state.draft.photo = photo; go('thought', {}, { replace: true });
  }
  async function open() {
    stop();
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facing }, width: { ideal: 1920 } }, audio: false });
      // A front (selfie) camera works like a mirror: what you see is what you get, so the preview and the saved photo are both mirrored.
      // The back camera is never mirrored. (Laptop webcams don't say which they are; they count as front cameras.)
      const fm = stream.getVideoTracks()[0]?.getSettings?.().facingMode;
      mirrored = fm ? fm === 'user' : (/android|iphone|ipad|ipod/i.test(navigator.userAgent) ? facing === 'user' : true);
      video.srcObject = stream; msg.hidden = true; frozen = false; if (!drawing) paint();
    } catch {
      if (window.__DEMO_CAMERA) {
        try { const ds = demoStream(); stream = ds; mirrored = facing === 'user'; video.srcObject = ds; msg.hidden = true; if (!drawing) paint(); hint.textContent = 'Demo camera for this preview. Your real camera works on your own address.'; return; } catch {}
      }
      msg.hidden = false;
      msg.replaceChildren(h('p', 'We couldn’t open the camera here. You can use your phone’s own camera, or choose a photo from your gallery.'),
        h('button.btn-primary', { onClick: () => fallback.click() }, 'Open phone camera'));
    }
  }
  const stop = () => { cancelAnimationFrame(demoRaf); try { video.cancelVideoFrameCallback ? video.cancelVideoFrameCallback(drawing) : cancelAnimationFrame(drawing); } catch {} drawing = 0; stream?.getTracks().forEach((t) => t.stop()); stream = null; };
  function demoStream() {
    const c = document.createElement('canvas'); c.width = 720; c.height = 540;
    const g = c.getContext('2d'), img = new Image(); img.src = samplePhoto('misty-hills');
    const t0 = performance.now();
    const draw = () => {
      if (img.complete && img.naturalWidth) {
        const t = (performance.now() - t0) / 1000, zoom = 1.25 + 0.05 * Math.sin(t * 0.4);
        const sw = img.naturalWidth / zoom, sh = sw * (c.height / c.width);
        const sx = (img.naturalWidth - sw) * (0.5 + 0.45 * Math.sin(t * 0.35)), sy = Math.max(0, img.naturalHeight * 0.22 + 20 * Math.sin(t * 0.5));
        g.drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height);
      }
      demoRaf = requestAnimationFrame(draw);
    };
    draw();
    return c.captureStream(30);
  }
  // The part of the camera frame that shows through the stamp window. The preview and the saved photo both use exactly this crop,
  // and both come from the raw camera frame, so what you see is what you get.
  function cropBox() {
    const aspect = PLATE.hw / PLATE.hh, vw = video.videoWidth, vh = video.videoHeight;
    let sw = vw, sh = vw / aspect; if (sh > vh) { sh = vh; sw = vh * aspect; }
    return { sx: (vw - sw) / 2, sy: (vh - sh) / 2, sw, sh };
  }
  function paint() {
    if (frozen) return;
    if (video.videoWidth && video.readyState >= 2) {
      const { sx, sy, sw, sh } = cropBox();
      const w = Math.max(2, Math.round(view.clientWidth * Math.min(1.5, devicePixelRatio || 1))), hgt = Math.round(w * sh / sw);
      if (view.width !== w || view.height !== hgt) { view.width = w; view.height = hgt; }
      const g = view.getContext('2d', { alpha: false });
      if (mirrored) { g.save(); g.translate(view.width, 0); g.scale(-1, 1); g.drawImage(video, sx, sy, sw, sh, 0, 0, view.width, view.height); g.restore(); }
      else g.drawImage(video, sx, sy, sw, sh, 0, 0, view.width, view.height);
      // the soft colour wash behind the stamp only needs a few updates a second (it is tiny and blurred by being stretched)
      const now = performance.now();
      if (now - lastBg > 300) {
        lastBg = now;
        const bw = Math.min(video.videoWidth, video.videoHeight * 0.75), bh = bw / 0.75;
        bgCanvas.getContext('2d').drawImage(video, (video.videoWidth - bw) / 2, (video.videoHeight - bh) / 2, bw, bh, 0, 0, bgCanvas.width, bgCanvas.height);
      }
    }
    drawing = (video.requestVideoFrameCallback ? video.requestVideoFrameCallback(paint) : requestAnimationFrame(paint));
  }
  function snap() {
    if (frozen) return;
    if (!video.videoWidth) { gallery.click(); return; }
    if (!edit && !canStart(state.draft.date)) return;
    const { sx, sy, sw, sh } = cropBox();
    const c = document.createElement('canvas'); const k = Math.min(1, 1600 / Math.max(sw, sh));
    c.width = Math.round(sw * k); c.height = Math.round(sh * k);
    const g = c.getContext('2d');
    if (mirrored) { g.translate(c.width, 0); g.scale(-1, 1); }
    g.drawImage(video, sx, sy, sw, sh, 0, 0, c.width, c.height);
    frozen = true;                                   // the picture holds still while it is saved: no more drawing work, so the animation stays smooth
    buzz(14); flash.classList.remove('go'); void flash.offsetWidth; flash.classList.add('go');
    stage.classList.add('punch');
    // encoding happens off the main thread, so the press animation never stutters
    const done = (url) => setTimeout(() => accept(url), 200);
    if (c.toBlob) c.toBlob((blob) => { const fr = new FileReader(); fr.onload = () => done(fr.result); fr.readAsDataURL(blob); }, 'image/jpeg', 0.9);
    else done(c.toDataURL('image/jpeg', 0.9));
  }
  const hint = h('p.cam-hint', 'Fill the stamp with your moment');

  // the stamp-shaped window (a real stamp, with the live picture where the photo goes)
  const draftDate = () => (edit ? edit.date : state.draft.date);
  const frame = stampEl({ date: draftDate(), photo: null, light: 'none' }, { size: '27px', postmark: false });
  frame.querySelector('.stamp-photo').replaceChildren(view, video);
  const footDate = frame.querySelector('.stamp-foot span:last-child');
  const stage = h('div.cam-stage', frame);

  // which day is this moment from? (today is the default)
  const datePill = edit ? h('span.cam-spacer') : h('button.cam-date', { onClick: () => {
    const today = todayStr();
    const input = h('input.date-input', { type: 'date', value: state.draft.date, max: today });
    const m2 = h('p.sheet-msg');
    const close = sheet(h('div.daypick',
      h('h2', 'Which day is this from?'),
      h('p', 'Pick the day this moment belongs to. Today is fine too.'),
      input, m2,
      primary('Continue', () => {
        const d = input.value || today;
        if (d > today) { m2.textContent = 'Tales can only be kept for today or earlier.'; return; }
        if (store.count(d) >= MAX_PER_DAY) { close(); canStart(d); return; }
        state.draft.date = d; datePill.querySelector('.cdl').textContent = dayLabel(d); footDate.textContent = dotDate(d); close();
      })));
  } }, h('span.btn-ic', { html: icon.calendar }), h('span.cdl', dayLabel(state.draft.date)), h('span.btn-ic.chev', { html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>' }));

  open();
  const last = [...store.tales].filter((t) => t.thumb || t.photo).sort((a, b) => b.createdAt - a.createdAt)[0];
  const el = h('div.camera',
    bgCanvas, h('div.cam-wash'),
    h('header.cam-head',
      h('button.cam-close', { 'aria-label': 'Close camera', onClick: () => back(), html: icon.close }),
      datePill, h('span.cam-spacer')),
    stage, hint, msg,
    h('div.cam-bar',
      h('button.cam-gallery', { 'aria-label': 'Choose from gallery', onClick: () => gallery.click(), style: last ? { backgroundImage: `url(${last.thumb || last.photo})` } : {} }, last ? null : h('span', { html: icon.image })),
      h('button.shutter', { 'aria-label': 'Take photo', onClick: snap }, h('span')),
      h('button.cam-flip', { 'aria-label': 'Switch camera', onClick: () => { facing = facing === 'environment' ? 'user' : 'environment'; open(); }, html: icon.flip })),
    h('div.cam-labels', h('span', 'Gallery'), h('span.on', 'Photo'), h('span', 'Flip')),
    flash, fallback, gallery);
  el._cleanup = stop;
  return el;
};
register('camera', cameraScreen);
register('moment', cameraScreen);                  // older links still work: "add a moment" is the camera now

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
  let rec, recording = false, el;

  const ta = h('textarea.thought-input', { rows: 3, maxlength: MAX_THOUGHT, placeholder: 'Or write a line… (up to 140 characters)', 'aria-label': 'Your thought' });
  ta.value = t.thought || '';
  const count = h('span.count', `${ta.value.length}/${MAX_THOUGHT}`);
  ta.addEventListener('input', () => { t.thought = ta.value; count.textContent = `${ta.value.length}/${MAX_THOUGHT}`; });

  const status = h('p.mic-status', { role: 'status', 'aria-live': 'polite' });
  const say = (msg, bad = false) => { status.textContent = msg || ''; status.classList.toggle('bad', !!bad); };

  function renderVoice(note) {
    voiceArea.replaceChildren();
    if (t.audio && !recording) {
      voiceArea.append(voicePill(t.audio, t.audioDur, { onRemove: () => { t.audio = null; t.audioDur = 0; renderVoice(); } }));
      return;
    }
    const wave = h('div.wave', ...Array.from({ length: 24 }, () => h('i')));
    const label = h('div.mic-label', note || (recording ? 'Recording\u2026 tap to stop' : 'Tap to record a voice note'));
    const mic = h('button.mic' + (recording ? '.rec' : ''), { 'aria-label': recording ? 'Stop recording' : 'Record a voice note', html: icon.mic });
    if (recording) wave.classList.add('live');
    const stopRec = async () => {
      if (!recording) return;
      recording = false;
      const r = await rec.stop();
      if (!r || r.duration < 0.7) { say('That was very short. Tap and speak a little longer.', true); renderVoice(); return; }
      say(''); t.audio = r.blob; t.audioDur = r.duration; renderVoice();
    };
    const startRec = async () => {
      say('Starting the microphone\u2026');
      rec = new Recorder((lvl, secs) => {
        wave.querySelectorAll('i').forEach((b, i) => { b.style.height = Math.max(8, Math.min(100, lvl * 130 * (0.5 + Math.abs(Math.sin(i * 1.3 + secs * 6))))) + '%'; });
        label.textContent = fmtDur(secs) + ' \u00b7 tap to stop';
        if (secs >= MAX_SECONDS) stopRec();
      });
      try { await rec.start(); }
      catch (e) { say(micMessage(e), true); renderVoice(); return; }
      recording = true; say('Recording. Tap the mic again when you are done.'); renderVoice();
      // keep the live meter going on the freshly drawn controls
      voiceArea.querySelector('.wave')?.classList.add('live');
      rec.onLevel = (lvl, secs) => {
        const w = voiceArea.querySelectorAll('.wave i'); w.forEach((b, i) => { b.style.height = Math.max(8, Math.min(100, lvl * 130 * (0.5 + Math.abs(Math.sin(i * 1.3 + secs * 6))))) + '%'; });
        const l = voiceArea.querySelector('.mic-label'); if (l) l.textContent = fmtDur(secs) + ' \u00b7 tap to stop';
        if (secs >= MAX_SECONDS) stopRec();
      };
    };
    mic.addEventListener('click', () => (recording ? stopRec() : startRec()));
    voiceArea.append(h('div.mic-wrap', wave, mic, label));
  }
  renderVoice();

  // Speak instead of typing: every phone keyboard has its own microphone key that types into any text box, and it is far more reliable
  // than a web page listening itself. So the button puts the cursor in the box and says where that key is.
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const dictBtn = h('button.dictate', { type: 'button' }, h('span.btn-ic', { html: icon.mic }), h('span.dl', 'Speak instead of typing'));
  const tip = h('div.dict-tip', { hidden: true, role: 'status' });
  const showTip = (lead, rest = '') => { tip.hidden = false; tip.replaceChildren(h('b', lead), ' ' + rest); };
  const keyboardTip = () => { ta.focus(); showTip(ios ? 'Tap the little microphone on your keyboard' : 'Tap the microphone on your keyboard', '(bottom right) and speak. ' + (ios ? 'No microphone key? Open Settings, General, Keyboard, and switch on Enable Dictation.' : '')); };
  const setLabel = (txt, on) => { dictBtn.querySelector('.dl').textContent = txt; dictBtn.classList.toggle('on', !!on); };
  const addWords = (txt) => { const t2 = (ta.value.trim() ? ta.value.trim() + ' ' : '') + txt.trim(); ta.value = t2.slice(0, MAX_THOUGHT); t.thought = ta.value; count.textContent = `${ta.value.length}/${MAX_THOUGHT}`; };
  let dictRec = null, dictBusy = false, serverSpeech = auth.provider === 'supabase', webSpeech = null;
  dictBtn.addEventListener('click', async () => {
    if (dictBusy) return;
    if (recording) { say('Finish your voice note first, then you can speak your words.', true); return; }
    if (webSpeech) { webSpeech.stop(); return; }
    if (dictRec) {                                          // second tap: stop and write it down
      const r = await dictRec.stop(); dictRec = null; tip.hidden = true;
      if (!r || r.duration < 0.6) { setLabel('Speak instead of typing'); say('That was very short. Tap and speak a little longer.', true); return; }
      dictBusy = true; setLabel('Writing it down\u2026', true);
      try { const words = await transcribe(r.blob); if (words) { addWords(words); say('Done. You can edit the words above.'); } else say('We didn\u2019t catch any words. Try again a little closer.', true); }
      catch (e) { if (e.code === 'not_configured') { serverSpeech = false; say(''); keyboardTip(); } else say(e.message, true); }
      dictBusy = false; setLabel('Speak instead of typing'); return;
    }
    say('');
    if (serverSpeech) {                                     // works on every phone: we record, the server writes the words
      const rec2 = new Recorder(() => {});
      try { await rec2.start(); } catch (e) { say(micMessage(e), true); return; }
      dictRec = rec2; setLabel('Listening\u2026 tap to stop', true); showTip('Speak now.', 'Tap the button again when you are done.');
      return;
    }
    if (dictationSupported()) {                             // practice mode: the browser's own listening
      webSpeech = new Dictation({ max: MAX_THOUGHT,
        onText: (txt) => { ta.value = txt; t.thought = txt; count.textContent = `${txt.length}/${MAX_THOUGHT}`; },
        onState: (st) => { setLabel(st === 'listening' ? 'Listening\u2026 tap to stop' : 'Speak instead of typing', st === 'listening'); if (st !== 'listening') webSpeech = null; },
        onError: () => { webSpeech = null; setLabel('Speak instead of typing'); keyboardTip(); } });
      webSpeech.start(ta.value); return;
    }
    keyboardTip();
  });

  const heroTale = edit ? t : state.draft;
  el = h('div.thought',
    stepBar(2, !edit ? linkBtn('Retake', () => { go('camera', {}, { replace: true }); }) : null),
    h('div.thought-hero', h('div.th-stamp', stampEl(heroTale, { size: '9.2px', postmark: false })),
      h('div', h('h1', 'How did it feel?'), h('p.lead.small', 'Write a line, say it out loud, or both.'))),
    h('section.tcard', h('p.kicker', 'A short thought'), h('div.text-wrap', ta), h('div.tc-row', dictBtn, count), tip),
    status,
    h('section.tcard.vcard', h('p.kicker', 'Voice note'), voiceArea),
    h('div.bottom', primary(edit ? 'Save changes' : 'Next', async () => {
      if (recording) return;
      if (edit) { edit.thought = t.thought; edit.audio = t.audio; edit.audioDur = t.audioDur; await store.save(edit); toast('Saved'); back('calendar'); }
      else go('frame');
    })));
  el._cleanup = () => { if (recording) rec?.cancel(); try { dictRec?.cancel(); webSpeech?.stop(); } catch {} };
  return el;
});

const stepBar = (n, right) => h('div.topbar.stepbar', h('button.icon-btn', { 'aria-label': 'Back', onClick: () => back(), html: icon.back }),
  h('div.steps', { 'aria-label': `Step ${n} of 4` }, ...[1, 2, 3, 4].map((k) => h('i' + (k < n ? '.done' : k === n ? '.on' : '')))), h('div.topbar-right', right));
const redirectHome = () => { queueMicrotask(() => go('home', {}, { replace: true })); return h('div'); };

// =====================================================
// FRAME IT (also used to edit the stamp)
// =====================================================
register('frame', (p) => {
  const edit = p.editId ? store.byId(p.editId) : null;
  const t = edit ? { ...edit } : state.draft;
  if (!t || (!edit && !t.photo)) return redirectHome();

  const heroBox = h('div.frame-hero');
  const draw = () => heroBox.replaceChildren(h('div.fh-panel', { 'aria-hidden': 'true' }), h('div.fh-stamp', stampEl(t, { size: '21.6px', postmark: false })));
  draw();
  const chips = h('div.chips', { role: 'radiogroup', 'aria-label': 'Filters' });
  const swatch = (l) => { const sw = h('span.sw'); const src = t.thumb || t.photo; if (src) { sw.style.backgroundImage = `url("${src}")`; sw.style.filter = filterCss(l.id); } return sw; };
  const drawChips = () => chips.replaceChildren(...LIGHTS.map((l) =>
    h('button.chip.lt-' + l.id + ((t.light || 'golden') === l.id ? '.on' : ''), { role: 'radio', 'aria-checked': String((t.light || 'golden') === l.id), onClick: () => { t.light = l.id; draw(); drawChips(); } },
      swatch(l), l.label)));
  drawChips();
  const title = h('input.title-input', { type: 'text', id: 'title', maxlength: 32, placeholder: 'Give it a little title', 'aria-label': 'Title' });
  title.value = t.title || '';
  const tcount = h('span.count', `${title.value.length}/32`);
  title.addEventListener('input', () => { t.title = title.value; tcount.textContent = `${title.value.length}/32`; });

  const next = async () => {
    if (edit) { edit.light = t.light; edit.title = t.title; await store.save(edit); toast('Saved'); back('calendar'); }
    else go('stamping');
  };
  return h('div.frame',
    h('div.topbar', h('button.icon-btn', { 'aria-label': 'Back', onClick: () => back(), html: icon.back }), h('div.topbar-title', 'Frame your stamp'), h('span.topbar-spacer')),
    heroBox,
    h('div.frame-controls',
      h('p.label', 'Filters'), chips,
      h('p.fine', 'Your photo stays exactly as taken unless you pick a filter.'),
      h('label.label', { for: 'title' }, 'Title'), h('div.title-wrap', title, tcount)),
    h('div.bottom', primary(edit ? 'Save' : 'Stamp it', next), edit ? null : linkBtn('Skip for now', next)));
});

// =====================================================
// STAMPING (the < 2 second animation)
// =====================================================
register('stamping', () => {
  const t = state.draft;
  if (!t || !t.photo) return redirectHome();
  const stamp = stampEl(t, { size: '23px', developing: true });
  if (account.settings.sound !== false) setTimeout(playStamp, 700);
  const el = h('div.stamping', h('div.stamping-stage', stamp), h('p.stamping-text', 'Stamping\u2026'));
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
      h('div.topbar-title', 'Decorate'), skipSlot),
    h('div.page-frame', page),
    hint,
    h('section.dock', { 'aria-label': 'Decorations' }, ed.tray, primary('Done decorating', done)));
});

// =====================================================
// TALE READY (preview + post)
// =====================================================
// After a post: a first-tale celebration, a streak milestone, or just a quiet toast. Never allowed to break posting.
async function celebrate(saved) {
  const loud = account.settings.sound !== false;
  try {
    const real = store.tales.filter((t) => !t.sample);
    if (!account.celebratedFirst && real.length === 1) {
      await patchAccount({ celebratedFirst: true });
      if (loud) playParty();
      setTimeout(() => celebrateFirst(saved), 350); return;
    }
    if (!account.celebratedFirst) await patchAccount({ celebratedFirst: true });
    const { count } = computeStreak(real, todayStr());
    if (MILESTONES.includes(count) && !(account.milestones || []).includes(count)) {
      await patchAccount({ milestones: [...(account.milestones || []), count] });
      if (loud) playParty();
      setTimeout(() => celebrateStreak(count, saved), 350); return;
    }
  } catch (e) { console.warn('Celebration skipped', e); }
  if (loud) playChime();
  toast('Posted to your calendar');
}

register('ready', () => {
  const t = state.draft;
  if (!t || !t.photo) return redirectHome();
  return h('div.ready',
    h('div.ready-head', h('button.icon-btn.rh-back', { 'aria-label': 'Back', onClick: () => back(), html: icon.back }), h('p.kicker', 'Almost there'), h('h1', 'Your page is ready')),
    h('div.page-frame', pageEl(t)),
    h('p.private-note', h('span.btn-ic', { html: icon.lock }), 'Only you can see this page.'),
    h('div.bottom',
      primary('Post to my calendar', async (ev) => {
        const btn = ev.currentTarget; if (btn.disabled) return;
        if (store.count(t.date) >= MAX_PER_DAY) { canStart(t.date); return; }
        const saved = { ...t, createdAt: Date.now() };
        btn.disabled = true;
        try { saved.thumb = await makeThumb(saved.photo).catch(() => undefined); await store.save(saved); buzz([18, 50, 18]); }
        catch (e) { btn.disabled = false; console.error(e); toast('We couldn’t save this tale. Your phone may be out of space.'); return; }
        state.justPosted = saved.id;
        const d = parseDate(saved.date); state.month = { y: d.getFullYear(), m: d.getMonth() };
        state.draft = null;
        go('calendar', {}, { replace: true });
        celebrate(saved);
      }),
      linkBtn('Back to decorating', () => back())));
});

// =====================================================
// DAY (1 to 3 tales side by side)
// =====================================================
register('day', (p) => {
  const tales = store.forDate(p.date);
  if (!tales.length) return redirectHome();
  const today = todayStr();
  const n = tales.length;
  const canAdd = n < MAX_PER_DAY && p.date <= today;
  // every tale of the day is shown together, as big as the screen allows
  const em = n === 1 ? 'calc(min(100vw, 430px) * .056)' : 'calc(min(100vw, 430px) * .043)';
  const items = tales.map((t, i) => h('div.day-item.i' + i,
    h('div.di-block', { 'aria-hidden': 'true', style: { background: blockColor(t) } }),
    h('button.day-card', { 'aria-label': t.title || shortDate(t.date), onClick: () => go('tale', { id: t.id }) }, stampEl(t, { size: em, postmark: i === 0 })),
    h('div.di-tape', { 'aria-hidden': 'true' }),
    t.title || t.audio ? h('div.di-note', t.title ? h('p.day-title', t.title) : null, t.audio ? h('p.di-voice', h('span.btn-ic', { html: icon.play }), fmtDur(t.audioDur || 0)) : null) : null));
  if (canAdd) items.push(h('button.day-add', { onClick: () => { if (!canStart(p.date)) return; state.draft = newDraft(p.date); go('camera'); } },
    h('span.da-ic', { html: icon.plus }), h('b', 'Add another tale'), h('small', `${MAX_PER_DAY - n} ${MAX_PER_DAY - n === 1 ? 'spot' : 'spots'} left`)));
  const dates = [...new Set(store.tales.map((t) => t.date))].sort();
  const at = dates.indexOf(p.date), prev = dates[at - 1], next = dates[at + 1];
  const short = (ds) => shortDate(ds).split(' ').slice(0, 2).join(' ');
  const pill = (ds, left) => ds
    ? h('button.day-pill', { onClick: () => go('day', { date: ds }, { replace: true }) }, left ? [h('span.btn-ic', { html: icon.back }), short(ds)] : [short(ds), h('span.btn-ic', { html: icon.chevR })])
    : h('span.day-pill.none');
  return h('div.day',
    h('div.topbar', h('button.icon-btn', { 'aria-label': 'Back', onClick: () => back('calendar'), html: icon.back }),
      h('div.day-head', h('h1', dayTitle(p.date)), h('p.kicker', `${n} OF ${MAX_PER_DAY} KEPT`)), h('span.topbar-spacer')),
    h('div.day-row.n' + n, ...items),
    h('div.day-nav', pill(prev, true), pill(next, false)));
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
      h('p.tale-date', shortDate(t.date).replace(' ', ' · ').toUpperCase()),
      h('button.icon-btn', { 'aria-label': 'More: edit thought, edit stamp, retake photo, delete', onClick: () => taleMenu(t), html: icon.more })),
    h('div.page-frame', pageEl(t)),
    pill ? h('div.tale-voice', pill) : null,
    h('div.bottom',
      h('button.btn-primary', { onClick: async (ev) => {
        const b = ev.currentTarget; if (b.disabled) return; b.disabled = true; b.classList.add('busy');
        try { if (await shareTale(t) === 'saved') toast('Saved as a picture'); }
        catch (e) { console.warn(e); toast('We couldn’t make the picture. Please try again.'); }
        b.disabled = false; b.classList.remove('busy');
      } }, h('span.btn-ic', { html: icon.share }), 'Share as a picture'),
      h('button.btn-secondary', { onClick: () => go('decorate', { id: t.id }) }, 'Decorate')));
  setTimeout(() => { if (el.isConnected) prepareShare(t).catch(() => {}); }, 600);   // get the picture ready so sharing opens instantly
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
export async function founderPanel() {
  const attempts = (await store.getMeta('attempts')) || [];
  const info = trialInfo();
  const jump = (label, state2) => h('button.chip-btn', { onClick: async () => {
    await jumpTo(state2);
    if (state2 === 'day7' || state2 === 'locked' || state2 === 'locked25') { const inWeek = store.tales.filter((t) => t.date >= account.firstSignIn && t.date <= todayStr()).length; if (inWeek < 3) await seedTrialWeek(account.firstSignIn, 8); }
    close(); state.month = null; toast('Jumped: ' + label); go('calendar', {}, { replace: true });
  } }, label);
  const close = sheet(h('div.founder',
    h('h2', 'Founder panel'),
    h('p.muted', 'Only you see this. Tap the logo five times to open it.'),
    h('div.stat', h('b', attempts.length), (attempts.length === 1 ? ' attempt' : ' attempts') + ' to make a 4th tale in a day'),
    attempts.length ? h('ul.attempts', ...attempts.slice(-6).reverse().map((a) => h('li', `${new Date(a.at).toLocaleString()} \u2192 day ${a.forDate}`))) : null,
    h('div.stat', h('b', info.status), ` \u00b7 today is ${todayStr()}`, info.day ? ` (day ${info.day})` : ''),
    h('div.label', 'Jump to a state'),
    h('div.chips-grid', jump('Day 1', 'day1'), jump('Day 4', 'day4'), jump('Day 7 video', 'day7'), jump('Locked (day 8)', 'locked'), jump('7 days left', 'locked25'), jump('After 30 days', 'deleted'), jump('Subscribed', 'subscribed')),
    h('div.label', 'Pricing'),
    h('button.btn-secondary', { onClick: async () => { account.settings.gst = !account.settings.gst; await saveAccount(); close(); toast(account.settings.gst ? 'Prices now shown + GST' : 'Prices shown flat, no GST'); } }, account.settings.gst ? 'GST is ON (tap to turn off)' : 'GST is OFF (tap to turn on)'),
    h('div.label', 'Sample data'),
    h('div.stack-sm',
      h('button.btn-secondary', { onClick: async () => { await store.removeSamples(); await seedSamples(); close(); toast('Sample tales reloaded'); go('calendar', {}, { replace: true }); } }, 'Reload sample tales'),
      h('button.btn-secondary', { onClick: async () => { await store.removeSamples(); close(); toast('Sample tales removed'); go('calendar', {}, { replace: true }); } }, 'Remove sample tales'),
      h('button.btn-secondary', { onClick: async () => { await store.setMeta('attempts', []); close(); toast('Attempt counter reset'); } }, 'Reset attempt counter'),
      h('button.btn-danger', { onClick: async () => { if (!confirm('Reset everything on this phone, including the trial?')) return; await store.clear(); await resetDemo(); close(); state.month = null; go('welcome', {}, { replace: true }); } }, 'Reset the whole app on this phone'))));
}
