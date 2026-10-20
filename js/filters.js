// Photo filters. The ids are the ones already stored with every tale ('none', 'morning', 'golden', 'dark'), so nothing in the database changes.
// Each filter is one recipe. The stamp on screen uses it as a CSS filter; the share picture and the week film apply the same recipe to pixels.
export const FILTERS = [
  { id: 'none', label: 'Original', css: '', p: null },
  { id: 'golden', label: 'Warm', css: 'sepia(.2) saturate(1.12) contrast(1.05) brightness(1.04)', p: { sepia: .2, sat: 1.12, con: 1.05, bri: 1.04 } },
  { id: 'morning', label: 'Soft', css: 'saturate(.8) contrast(.92) brightness(1.08)', p: { sat: .8, con: .92, bri: 1.08 } },
  { id: 'dark', label: 'Black & white', css: 'grayscale(1) contrast(1.15) brightness(1.03)', p: { gray: 1, con: 1.15, bri: 1.03 } },
];
export const LIGHTS = FILTERS;                         // older name
export const filterOf = (id) => FILTERS.find((f) => f.id === (id || 'golden')) || FILTERS[0];
export const filterCss = (id) => filterOf(id).css || 'none';

// Applies a filter to every pixel of a canvas (same order as the CSS list: sepia, saturate, contrast, brightness).
export function filterCanvas(canvas, id) {
  const p = filterOf(id).p; if (!p) return canvas;
  const g = canvas.getContext('2d'), im = g.getImageData(0, 0, canvas.width, canvas.height), d = im.data;
  const sepia = p.sepia || 0, sat = p.gray ? 0 : (p.sat ?? 1), con = p.con ?? 1, bri = p.bri ?? 1;
  for (let i = 0; i < d.length; i += 4) {
    let r = d[i], gr = d[i + 1], b = d[i + 2];
    if (sepia) {
      const sr = .393 * r + .769 * gr + .189 * b, sg = .349 * r + .686 * gr + .168 * b, sb = .272 * r + .534 * gr + .131 * b;
      r += (sr - r) * sepia; gr += (sg - gr) * sepia; b += (sb - b) * sepia;
    }
    if (sat !== 1) { const l = .2126 * r + .7152 * gr + .0722 * b; r = l + (r - l) * sat; gr = l + (gr - l) * sat; b = l + (b - l) * sat; }
    if (con !== 1) { r = (r - 128) * con + 128; gr = (gr - 128) * con + 128; b = (b - 128) * con + 128; }
    if (bri !== 1) { r *= bri; gr *= bri; b *= bri; }
    d[i] = r < 0 ? 0 : r > 255 ? 255 : r; d[i + 1] = gr < 0 ? 0 : gr > 255 ? 255 : gr; d[i + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
  }
  g.putImageData(im, 0, 0);
  return canvas;
}
// A filtered copy of a loaded picture (scaled down so it stays quick).
export function filteredImage(img, id, max = 1100) {
  if (!img || !filterOf(id).p) return img;
  const k = Math.min(1, max / Math.max(img.width || img.naturalWidth, img.height || img.naturalHeight));
  const c = document.createElement('canvas'); c.width = Math.round((img.width || img.naturalWidth) * k); c.height = Math.round((img.height || img.naturalHeight) * k);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return filterCanvas(c, id);
}
