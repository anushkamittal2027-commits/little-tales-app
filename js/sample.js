// Sample tales so the album looks lived-in on first open. Removable from the founder panel.
import { store } from './store.js';
import { addDays, todayStr } from './util.js';
import { makeChimeWav } from './recorder.js';

export const samplePhoto = (n) => (window.__SAMPLES && window.__SAMPLES[n]) || `assets/photos/${n}.jpg`;
const P = samplePhoto;
// [daysAgo, photo, title, thought, light, voice?, decorations]
const SAMPLES = [
  [1, 'skyline-dusk', 'Honey sky', 'The sky did that thing again where everything turns to honey for ten minutes.', 'golden', true,
    [{ kind: 'tape', id: 'tape-apricot', x: 24, y: 8, s: 34, r: -24 }, { kind: 'stickers', id: 'sun', x: 84, y: 76, s: 20, r: 10 }, { kind: 'doodles', id: 'sparkles', x: 17, y: 62, s: 22, r: -8 }]],
  [1, 'string-lights', 'Terrace lights', 'Fairy lights on the terrace and chai going cold. Nobody wanted to go in.', 'golden', false,
    [{ kind: 'stickers', id: 'star', x: 84, y: 14, s: 17, r: 12 }]],
  [2, 'rain-bokeh', 'Nowhere to be', 'Rain on the window, laptop closed, nowhere to be.', 'morning', true,
    [{ kind: 'tape', id: 'tape-sage', x: 74, y: 7, s: 34, r: 22 }, { kind: 'doodles', id: 'squiggle', x: 50, y: 93, s: 34, r: -2 }]],
  [4, 'dawn-lake', 'Early lake', 'Up before everyone. The lake was holding the whole sky.', 'morning', false,
    [{ kind: 'stickers', id: 'withlove', x: 52, y: 90, s: 30, r: -4 }, { kind: 'stickers', id: 'heart', x: 86, y: 70, s: 15, r: 14 }]],
  [4, 'bookshop-bokeh', 'One book. Four books.', 'Went in for one book. Left with four and a bookmark shaped like a mango.', 'golden', false,
    [{ kind: 'tape', id: 'tape-plum', x: 22, y: 9, s: 32, r: -18 }]],
  [4, 'golden-field', 'Golden field', 'The whole field was gold for exactly one evening.', 'golden', true,
    [{ kind: 'stickers', id: 'flower', x: 16, y: 20, s: 19, r: -12 }, { kind: 'stickers', id: 'arrow', x: 82, y: 82, s: 18, r: 0 }]],
  [6, 'sea-sunset', 'Salt and light', 'Salt on my lips and a tiny red boat going nowhere. Perfect.', 'golden', false,
    [{ kind: 'stickers', id: 'airmail', x: 82, y: 82, s: 24, r: 8 }, { kind: 'tape', id: 'tape-dots', x: 20, y: 8, s: 32, r: -20 }]],
  [9, 'misty-hills', 'Hill morning', 'Mist in the valley and not one notification. Stayed an extra hour.', 'morning', false,
    [{ kind: 'stickers', id: 'star', x: 16, y: 16, s: 16, r: -14 }, { kind: 'doodles', id: 'sparkles', x: 80, y: 12, s: 22, r: 6 }]],
  [9, 'rain-bokeh', 'Second cup', 'Second cup, same window. Some evenings deserve it.', 'dark', false, []],
  [12, 'skyline-dusk', 'Walking home', 'Walked home the long way just to keep the light a little longer.', 'golden', false,
    [{ kind: 'stickers', id: 'arrow', x: 80, y: 78, s: 20, r: 0 }]],
  [15, 'misty-hills', 'Slow weekend', 'Nothing planned. The best kind of weekend.', 'morning', false, []],
  [18, 'sea-sunset', 'Quiet water', 'Quiet water, loud thoughts. Both fine.', 'golden', false,
    [{ kind: 'doodles', id: 'swirl', x: 24, y: 90, s: 26, r: 0 }]],
];

export async function seedSamples() {
  const today = todayStr();
  const chime = makeChimeWav();
  let t = Date.now() - 1e9;
  for (const [ago, photo, title, thought, light, voice, decorations] of SAMPLES) {
    await store.save({
      id: `sample-${store.tales.length}-${ago}-${photo}`,
      sample: true,
      date: addDays(today, -ago),
      createdAt: (t += 1000),
      photo: P(photo), title, thought, light,
      audio: voice ? chime : null, audioDur: voice ? 3 : 0,
      decorations,
    });
  }
}

// Founder demo: put some tales inside the free week so the Day 7 video has something to show.
export async function seedTrialWeek(firstSignIn, total = 8) {
  const pool = SAMPLES.slice(0, 8);
  const chime = makeChimeWav();
  for (let i = 0; i < total; i++) {
    const [, photo, title, thought, light, voice, decorations] = pool[i % pool.length];
    const day = Math.min(6, Math.floor((i / total) * 7));
    await store.save({
      id: `week-${firstSignIn}-${i}`, sample: true, date: addDays(firstSignIn, day), createdAt: Date.now() + i,
      photo: samplePhoto(photo), title, thought, light, audio: voice ? chime : null, audioDur: voice ? 3 : 0, decorations,
    });
  }
}
