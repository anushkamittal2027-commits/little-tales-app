// Sample tales so the album looks lived-in on first open. Removable from the founder panel.
import { store } from './store.js';
import { addDays, todayStr } from './util.js';
import { makeChimeWav } from './recorder.js';

export const samplePhoto = (n) => (window.__SAMPLES && window.__SAMPLES[n]) || `assets/sample/${n}.svg`;
const P = samplePhoto;
// [daysAgo, photo, title, thought, light, voice?, decorations]
const SAMPLES = [
  [1, 'chai', 'Cardamom morning', 'First chai of the day, and the whole window smelled like cardamom.', 'golden', true,
    [{ kind: 'tape', id: 'tape-apricot', x: 24, y: 8, s: 34, r: -24 }, { kind: 'stickers', id: 'chai', x: 82, y: 78, s: 22, r: 8 }, { kind: 'doodles', id: 'sparkles', x: 17, y: 62, s: 22, r: -8 }]],
  [1, 'rooftops', 'Honey sky', 'The sky did that thing again where everything turns to honey for ten minutes.', 'golden', false,
    [{ kind: 'stickers', id: 'sun', x: 84, y: 14, s: 20, r: 12 }]],
  [2, 'rain', 'Nowhere to be', 'Rain on the window, laptop closed, nowhere to be.', 'morning', true,
    [{ kind: 'tape', id: 'tape-sage', x: 74, y: 7, s: 34, r: 22 }, { kind: 'doodles', id: 'squiggle', x: 50, y: 93, s: 34, r: -2 }]],
  [4, 'flowers', 'Balcony roses', 'The balcony flowers finally opened. Mum pretended not to be proud.', 'golden', false,
    [{ kind: 'stickers', id: 'flower', x: 15, y: 20, s: 20, r: -12 }, { kind: 'stickers', id: 'heart', x: 86, y: 70, s: 16, r: 14 }]],
  [4, 'bookshop', 'One book. Four books.', 'Went in for one book. Left with four and a bookmark shaped like a mango.', 'golden', false,
    [{ kind: 'tape', id: 'tape-plum', x: 22, y: 9, s: 32, r: -18 }]],
  [4, 'mangoes', 'First mangoes', 'The first mangoes of the season. Sixty rupees of pure joy.', 'morning', true,
    [{ kind: 'stickers', id: 'star', x: 84, y: 22, s: 17, r: 10 }, { kind: 'stickers', id: 'withlove', x: 52, y: 88, s: 30, r: -4 }]],
  [6, 'sea', 'Tiny red boat', 'Salt on my lips and a tiny red boat going nowhere. Perfect.', 'golden', false,
    [{ kind: 'stickers', id: 'airmail', x: 82, y: 82, s: 24, r: 8 }, { kind: 'tape', id: 'tape-dots', x: 20, y: 8, s: 32, r: -20 }]],
  [9, 'cat', 'Moon watcher', 'He sat there for an hour watching the moon like it owed him money.', 'dark', false,
    [{ kind: 'stickers', id: 'star', x: 16, y: 16, s: 16, r: -14 }, { kind: 'doodles', id: 'sparkles', x: 80, y: 12, s: 22, r: 6 }]],
  [9, 'chai', 'Second cup', 'Second cup, same window. Some mornings deserve it.', 'golden', false, []],
  [12, 'rooftops', 'Walking home', 'Walked home the long way just to keep the light a little longer.', 'golden', false,
    [{ kind: 'stickers', id: 'arrow', x: 80, y: 78, s: 20, r: 0 }]],
  [15, 'flowers', 'Window garden', 'Someone on the third floor waters their plants at exactly 6pm. I love it.', 'morning', false, []],
  [18, 'sea', 'Quiet water', 'Quiet water, loud thoughts. Both fine.', 'morning', false,
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
