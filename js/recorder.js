// Hold-to-record voice notes using the phone's microphone.
export const MAX_SECONDS = 60;

// Turn the browser's microphone errors into plain advice.
export function micMessage(e) {
  const n = e && (e.name || e.error || e.message || '');
  if (!window.isSecureContext) return 'The microphone only works on a secure (https) address.';
  if (!navigator.mediaDevices?.getUserMedia && !(window.SpeechRecognition || window.webkitSpeechRecognition)) return 'This browser can\u2019t use the microphone. Try Chrome or Safari, or type instead.';
  if (/service-not-allowed/i.test(n)) return 'Voice typing is switched off on this phone. Turn on Settings > General > Keyboard > Enable Dictation (and Siri), or use the microphone on your keyboard.';
  if (/NotAllowed|not-allowed|Permission/i.test(n)) return 'The browser is blocking the microphone for this site. Open the aA menu (or the lock icon) > Website Settings > Microphone > Allow.';
  if (/NotFound|DevicesNotFound|audio-capture/i.test(n)) return 'No microphone was found on this device.';
  if (/NotReadable|TrackStart/i.test(n)) return 'The microphone is being used by another app. Close it and try again.';
  if (/no-speech/i.test(n)) return 'Didn\u2019t hear anything. Try again a little closer.';
  if (/network/i.test(n)) return 'Voice typing needs an internet connection.';
  if (/language/i.test(n)) return 'Voice typing isn\u2019t available for this language here. You can type instead.';
  return 'Voice typing didn\u2019t start' + (n ? ' (' + String(n).slice(0, 40) + ')' : '') + '. Use the microphone on your keyboard instead.';
}

// Speak a thought and watch it turn into editable text (the browser\u2019s own speech recognition).
const IOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const dictationSupported = () => !!(window.SpeechRecognition || window.webkitSpeechRecognition);
export class Dictation {
  constructor({ onText, onState, onError, max = 140 }) { Object.assign(this, { onText, onState, onError, max }); }
  start(base = '') {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { this.onError?.(new Error('unsupported')); return false; }
    this.failed = false; this.stopping = false; this.base = base.trim() ? base.trim() + ' ' : '';
    this.final = '';
    const r = this.rec = new SR();
    r.lang = navigator.language || 'en-IN'; r.continuous = !IOS; r.interimResults = true; r.maxAlternatives = 1;
    r.onstart = () => this.onState?.('listening');
    r.onresult = (ev) => {
      let interim = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const t = ev.results[i][0].transcript;
        if (ev.results[i].isFinal) this.final += t.trim() + ' '; else interim += t;
      }
      this.onText?.((this.base + this.final + interim).replace(/\s+/g, ' ').trim().slice(0, this.max));
    };
    r.onerror = (ev) => { if (ev.error === 'aborted' && this.stopping) return; this.failed = true; this.onError?.(ev); };
    r.onnomatch = () => { this.failed = true; this.onError?.({ error: 'no-speech' }); };
    r.onend = () => { this.onState?.('idle'); this.rec = null; };
    try { r.start(); } catch (e) { this.onError?.(e); return false; }
    return true;
  }
  stop() { this.stopping = true; try { this.rec?.stop(); } catch {} }
}

function pickMime() {
  const opts = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg'];
  return opts.find((m) => window.MediaRecorder && MediaRecorder.isTypeSupported(m)) || '';
}

export class Recorder {
  constructor(onLevel) { this.onLevel = onLevel; this.chunks = []; }
  async start() {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mime = pickMime();
    this.rec = new MediaRecorder(this.stream, mime ? { mimeType: mime } : undefined);
    this.chunks = [];
    this.rec.ondataavailable = (e) => e.data.size && this.chunks.push(e.data);
    this.t0 = performance.now();
    this.rec.start();
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      const src = this.ctx.createMediaStreamSource(this.stream);
      this.an = this.ctx.createAnalyser(); this.an.fftSize = 256;
      src.connect(this.an);
      const buf = new Uint8Array(this.an.fftSize);
      const tick = () => {
        if (!this.an) return;
        this.an.getByteTimeDomainData(buf);
        let sum = 0; for (const v of buf) sum += Math.abs(v - 128);
        this.onLevel?.(Math.min(1, (sum / buf.length) / 40), (performance.now() - this.t0) / 1000);
        this.raf = requestAnimationFrame(tick);
      };
      tick();
    } catch { /* level meter is optional */ }
  }
  stop() {
    return new Promise((resolve) => {
      const dur = (performance.now() - this.t0) / 1000;
      cancelAnimationFrame(this.raf); this.an = null;
      this.rec.onstop = () => {
        this.stream.getTracks().forEach((t) => t.stop());
        this.ctx?.close?.();
        resolve({ blob: new Blob(this.chunks, { type: this.rec.mimeType || 'audio/webm' }), duration: dur });
      };
      try { this.rec.stop(); } catch { resolve(null); }
    });
  }
  cancel() {
    cancelAnimationFrame(this.raf); this.an = null;
    try { this.rec.onstop = null; this.rec.stop(); } catch {}
    this.stream?.getTracks().forEach((t) => t.stop());
    this.ctx?.close?.();
  }
}

// Small soft chime used for the sample tales' voice notes.
export function makeChimeWav() {
  const sr = 16000, dur = 3, n = sr * dur, notes = [523.25, 659.25, 783.99, 659.25, 587.33, 523.25];
  const pcm = new Int16Array(n);
  notes.forEach((f, i) => {
    const t0 = Math.floor((i * 0.45) * sr);
    for (let j = 0; j < sr * 1.1 && t0 + j < n; j++) {
      const t = j / sr, env = Math.exp(-3 * t) * Math.min(1, t * 80);
      pcm[t0 + j] += Math.sin(2 * Math.PI * f * t) * env * 6500;
    }
  });
  const buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf);
  const w = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true);
  v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2, true);
  pcm.forEach((s, i) => v.setInt16(44 + i * 2, s, true));
  return new Blob([buf], { type: 'audio/wav' });
}

// ---- sounds ----
// Phones only allow sound after a touch. unlockAudio() runs on the very first touch anywhere in the app, so later sounds are allowed.
// Sounds are played through a normal audio element: on iPhones that is heard even when the ringer switch is on silent
// (the Web Audio route is muted by that switch, and Chrome on iPhone has no way around it). Web Audio stays as a backup.
let actx, chimeBuf, sfx, sfxState = 'new';
const urls = {};
export const audioState = () => (actx ? actx.state : 'none');

// Draws a sound from a list of notes: { f0, f1 (glide to), at, dur, gain }.
function renderWav(notes, secs, sr = 22050) {
  const n = Math.floor(sr * secs), pcm = new Float32Array(n);
  for (const { f0, f1 = f0, at, dur, gain } of notes) {
    const s0 = Math.floor(at * sr); let ph = 0;
    for (let j = 0; j < dur * sr && s0 + j < n; j++) {
      const t = j / sr, f = f0 * Math.pow(f1 / f0, t / dur); ph += (2 * Math.PI * f) / sr;
      const env = Math.min(1, t * 400) * Math.exp(-4.2 * t / dur);
      pcm[s0 + j] += (Math.sin(ph) + 0.25 * Math.sin(2 * ph)) * env * gain;
    }
  }
  const out = new Int16Array(n); for (let i = 0; i < n; i++) out[i] = Math.max(-1, Math.min(1, pcm[i])) * 30000;
  const buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf);
  const w = (o, str) => [...str].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true);
  v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2, true);
  out.forEach((x, i) => v.setInt16(44 + i * 2, x, true));
  return new Blob([buf], { type: 'audio/wav' });
}
const SOUNDS = {
  chime: () => renderWav([523.25, 659.25, 783.99, 1046.5].map((f, i) => ({ f0: f, at: i * 0.14, dur: 1.4, gain: 0.34 })), 2.2),
  stamp: () => renderWav([{ f0: 170, f1: 55, at: 0, dur: 0.18, gain: 0.9 }, { f0: 1046, at: 0.12, dur: 0.9, gain: 0.36 }, { f0: 1568, at: 0.2, dur: 1.0, gain: 0.2 }], 1.4),
  party: () => renderWav([523.25, 659.25, 783.99, 1046.5, 1318.5, 1568, 2093].map((f, i) => ({ f0: f, at: i * 0.11, dur: 1.2, gain: 0.3 })).concat([{ f0: 523.25, at: 0.8, dur: 1.6, gain: 0.22 }, { f0: 783.99, at: 0.8, dur: 1.6, gain: 0.22 }, { f0: 1046.5, at: 0.8, dur: 1.6, gain: 0.22 }]), 2.8),
};
const soundUrl = (k) => (urls[k] ||= URL.createObjectURL(SOUNDS[k]()));

export function unlockAudio() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) {
      actx ||= new AC();
      if (actx.state === 'suspended') actx.resume().catch(() => {});
      const b = actx.createBuffer(1, 1, 22050), src = actx.createBufferSource(); src.buffer = b; src.connect(actx.destination); src.start(0);   // a silent blip finishes the unlock
    }
  } catch {}
  try {                                                         // the audio element is unlocked by playing it (silently) during the touch
    if (sfxState === 'new' || sfxState === 'failed') {
      sfxState = 'busy'; sfx ||= new Audio(); sfx.setAttribute('playsinline', ''); sfx.src = soundUrl('chime'); sfx.muted = true;
      const pr = sfx.play();
      if (pr && pr.then) pr.then(() => { sfx.pause(); sfx.currentTime = 0; sfx.muted = false; sfxState = 'ready'; }).catch(() => { sfx.muted = false; sfxState = 'failed'; });
      else { sfx.pause(); sfx.muted = false; sfxState = 'ready'; }
    }
  } catch { sfxState = 'failed'; }
}
// While a sound plays, ask the phone to treat it as media (so the silent switch does not mute it), then give the microphone its normal mode back.
let modeTimer;
function loud(ms) {
  try { if (navigator.audioSession) { navigator.audioSession.type = 'playback'; clearTimeout(modeTimer); modeTimer = setTimeout(() => { try { navigator.audioSession.type = 'auto'; } catch {} }, ms); } } catch {}
}
async function playSfx(key, ms) {
  try {
    loud(ms); sfx ||= new Audio(); sfx.muted = false; sfx.src = soundUrl(key); sfx.currentTime = 0;
    await sfx.play(); return true;
  } catch { return false; }
}
async function ready() {
  unlockAudio();
  if (actx.state === 'suspended') await actx.resume().catch(() => {});
  if (!chimeBuf) chimeBuf = await actx.decodeAudioData(await makeChimeWav().arrayBuffer());
}
// A soft chime when a tale is posted.
export async function playChime(volume = 0.55) {
  if (await playSfx('chime', 3000)) return;
  try {
    await ready(); loud(3600);
    const src = actx.createBufferSource(), gain = actx.createGain();
    gain.gain.value = volume; src.buffer = chimeBuf; src.connect(gain).connect(actx.destination); src.start();
  } catch { /* sound is a nicety, never an error */ }
}
// A little happy tune for the first tale and streak milestones.
export async function playParty() {
  if (await playSfx('party', 3400)) return;
  await playChime(0.7);
}
// A short "thunk and ding" when the stamp lands.
export async function playStamp(volume = 0.6) {
  if (await playSfx('stamp', 2000)) return;
  try {
    unlockAudio(); loud(2400); if (actx.state === 'suspended') await actx.resume().catch(() => {});
    const t0 = actx.currentTime, out = actx.createGain(); out.gain.value = volume; out.connect(actx.destination);
    const tone = (f0, f1, start, dur, gainPeak, type = 'sine') => {
      const o = actx.createOscillator(), g = actx.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t0 + start); o.frequency.exponentialRampToValueAtTime(f1, t0 + start + dur);
      g.gain.setValueAtTime(0.0001, t0 + start); g.gain.exponentialRampToValueAtTime(gainPeak, t0 + start + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t0 + start + dur);
      o.connect(g).connect(out); o.start(t0 + start); o.stop(t0 + start + dur + 0.05);
    };
    tone(170, 55, 0, 0.16, 0.9);              // the thunk
    tone(1046, 1046, 0.12, 0.9, 0.35);        // a bright ding
    tone(1568, 1568, 0.2, 1.0, 0.18);         // and its sparkle
  } catch {}
}
