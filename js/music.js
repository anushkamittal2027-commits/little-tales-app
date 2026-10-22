// Happy background tunes for "Your week", made from scratch in code (so there is nothing to license).
// Each tune is a short chord progression, a bouncy melody on a happy scale, and a soft instrument. They are synthesised on the phone.
export const TRACKS = [
  { id: 'sunny', name: 'Sunny day', bpm: 112, root: 60, chords: [[0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12]], inst: 'pluck', seed: 11 },
  { id: 'chai', name: 'Chai time', bpm: 96, root: 55, chords: [[0, 4, 7], [7, 11, 14], [4, 7, 11], [0, 4, 9]], inst: 'marimba', seed: 23 },
  { id: 'parade', name: 'Tiny parade', bpm: 124, root: 65, chords: [[0, 4, 7], [7, 11, 14], [2, 5, 9], [-2, 2, 5]], inst: 'bell', seed: 37 },
  { id: 'golden', name: 'Golden hour', bpm: 84, root: 62, chords: [[0, 4, 7], [-3, 0, 4], [5, 9, 12], [7, 11, 14]], inst: 'pad', seed: 41 },
  { id: 'skip', name: 'Skipping home', bpm: 132, root: 57, chords: [[0, 4, 7], [5, 9, 12], [7, 11, 14], [0, 4, 7]], inst: 'pluck', seed: 53 },
];
const PENTA = [0, 2, 4, 7, 9];                      // the happy five-note scale (major pentatonic)
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const rnd = (seed) => { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; };

// One note added into the sample array.
function note(out, sr, start, dur, f, gain, inst) {
  const i0 = Math.floor(start * sr), n = Math.floor(dur * sr);
  for (let i = 0; i < n && i0 + i < out.length; i++) {
    const t = i / sr; let v;
    if (inst === 'pad') v = (Math.sin(2 * Math.PI * f * t) + .5 * Math.sin(2 * Math.PI * f * 2 * t) + .3 * Math.sin(2 * Math.PI * f * .5 * t)) * Math.min(1, t * 3) * Math.max(0, 1 - Math.max(0, t - dur * .6) / (dur * .4));
    else if (inst === 'bell') v = (Math.sin(2 * Math.PI * f * t) + .4 * Math.sin(2 * Math.PI * f * 2.76 * t) + .2 * Math.sin(2 * Math.PI * f * 5.4 * t)) * Math.exp(-3.2 * t);
    else if (inst === 'marimba') v = (Math.sin(2 * Math.PI * f * t) + .35 * Math.sin(2 * Math.PI * f * 3.9 * t) * Math.exp(-14 * t)) * Math.exp(-4.5 * t);
    else v = (Math.sin(2 * Math.PI * f * t) + .5 * Math.sin(2 * Math.PI * f * 2 * t) + .25 * Math.sin(2 * Math.PI * f * 3 * t)) * Math.exp(-5.5 * t);   // pluck
    out[i0 + i] += v * gain * Math.min(1, t * 400);
  }
}

// Returns Float32Array samples for `seconds` of the tune (loops its 4-chord pattern).
export function renderTrack(id, seconds, sr = 22050) {
  const tr = TRACKS.find((x) => x.id === id) || TRACKS[0];
  const out = new Float32Array(Math.ceil(seconds * sr)), beat = 60 / tr.bpm, r = rnd(tr.seed);
  const bars = Math.ceil(seconds / (beat * 4)) + 1;
  let pos = 2;                                      // where the melody wanders in the scale
  for (let bar = 0; bar < bars; bar++) {
    const ch = tr.chords[bar % 4], t0 = bar * beat * 4;
    ch.forEach((semi, k) => note(out, sr, t0, beat * 4, hz(tr.root - 12 + semi), .16, 'pad'));              // soft chord underneath
    ch.forEach((semi, k) => { for (let b = 0; b < 8; b++) note(out, sr, t0 + b * beat / 2, beat * .9, hz(tr.root + semi + (k === 2 ? 12 : 0) * (b % 2)), .075, tr.inst === 'pad' ? 'bell' : tr.inst); });   // sparkling arpeggio
    for (let b = 0; b < 8; b++) {                    // the melody: skips up and down the happy scale
      if (r() < .25) continue; pos = Math.max(0, Math.min(PENTA.length * 2 - 1, pos + Math.round((r() - .5) * 4)));
      const semi = PENTA[pos % 5] + 12 * Math.floor(pos / 5);
      note(out, sr, t0 + b * beat / 2, beat * 1.2, hz(tr.root + 12 + semi), .13, tr.inst === 'pad' ? 'bell' : 'bell');
    }
  }
  let peak = 0; for (let i = 0; i < out.length; i++) peak = Math.max(peak, Math.abs(out[i]));
  const k = peak ? .9 / peak : 1, fade = Math.min(out.length / 4, sr * 1.5);
  for (let i = 0; i < out.length; i++) { out[i] *= k * Math.min(1, i / (sr * .3)) * Math.min(1, (out.length - i) / fade); }
  return out;
}

export function toBuffer(actx, id, seconds) {
  const sr = 22050, data = renderTrack(id, seconds, sr), buf = actx.createBuffer(1, data.length, sr);
  buf.getChannelData(0).set(data); return buf;
}
// Plays the first few seconds so a tune can be tried before it is chosen.
let previewNode = null;
export function previewTrack(actx, id, seconds = 7) {
  try { previewNode?.stop(); } catch {}
  const src = actx.createBufferSource(); src.buffer = toBuffer(actx, id, seconds); const g = actx.createGain(); g.gain.value = .8;
  src.connect(g); g.connect(actx.destination); src.start(); previewNode = src;
}
export const stopPreview = () => { try { previewNode?.stop(); } catch {} previewNode = null; };
