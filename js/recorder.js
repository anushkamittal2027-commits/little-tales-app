// Hold-to-record voice notes using the phone's microphone.
export const MAX_SECONDS = 60;

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
