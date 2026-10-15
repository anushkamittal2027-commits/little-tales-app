// All artwork in Little Tales is original and drawn here as SVG.
// Colours come from the brand palette plus a few soft helper tones.
const C = {
  cream: '#FAF3E8', red: '#C4472F', plum: '#3E2F3C', apricot: '#F2A66B', kraft: '#B98B5E',
  sage: '#9DB48A', sky: '#8DB1C9', blush: '#EFB5A5', butter: '#F6D58E', paper: '#FFFBF3',
};
export const COLORS = C;

let uid = 0;
const uniq = (svg) => {
  const n = ++uid;
  return svg.replace(/__ID__/g, 'a' + n);
};
const wrap = (vb, body, extra = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" ${extra} fill="none" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

// ---------- Washi tape (4 strips) ----------
const tapeShape = '<path d="M6 3 L10 7 L6 11 L10 15 L6 19 L10 23 L6 27 L10 31 L6 35 L134 35 L130 31 L134 27 L130 23 L134 19 L130 15 L134 11 L130 7 L134 3 Z"';
const tape = (base, deco, defs = '') =>
  wrap('0 0 140 38',
    `<defs><clipPath id="__ID__c">${tapeShape.replace('<path', '<path')}/></clipPath>${defs}</defs>` +
    `<g clip-path="url(#__ID__c)"><rect width="140" height="38" fill="${base}"/>${deco}` +
    `<rect width="140" height="38" fill="#fff" opacity=".12"/></g>`, 'opacity=".92"');

const TAPE = [
  {
    id: 'tape-apricot', name: 'Apricot stripes',
    svg: tape(C.apricot, Array.from({ length: 12 }, (_, i) =>
      `<path d="M${i * 14 - 10} 40 L${i * 14 + 14} -2" stroke="#FFF3E0" stroke-width="5" opacity=".75"/>`).join('')),
  },
  {
    id: 'tape-dots', name: 'Postal dots',
    svg: tape('#F5D9CE', Array.from({ length: 28 }, (_, i) =>
      `<circle cx="${12 + (i % 7) * 19 + (Math.floor(i / 7) % 2) * 9}" cy="${9 + Math.floor(i / 7) * 10}" r="2.6" fill="${C.red}" opacity=".85"/>`).join('')),
  },
  {
    id: 'tape-sage', name: 'Sage check',
    svg: tape('#C9D8B6',
      Array.from({ length: 9 }, (_, i) => `<path d="M${i * 18 + 4} 0V38" stroke="#fff" stroke-width="4" opacity=".6"/>`).join('') +
      Array.from({ length: 3 }, (_, i) => `<path d="M0 ${i * 14 + 6}H140" stroke="#fff" stroke-width="4" opacity=".6"/>`).join('')),
  },
  {
    id: 'tape-plum', name: 'Plum hearts',
    svg: tape('#DCCBD3', Array.from({ length: 14 }, (_, i) => {
      const x = 14 + (i % 7) * 19 + (Math.floor(i / 7) * 9), y = 11 + Math.floor(i / 7) * 16;
      return `<path d="M${x} ${y + 3} C${x - 6} ${y - 2} ${x - 2} ${y - 7} ${x} ${y - 3} C${x + 2} ${y - 7} ${x + 6} ${y - 2} ${x} ${y + 3}Z" fill="${C.plum}" opacity=".6"/>`;
    }).join('')),
  },
];

// ---------- Stickers (8, hand-drawn feel) ----------
const S = (body) => wrap('0 0 100 100', body);
const o = `stroke="${C.plum}" stroke-width="3.2"`;
const STICKERS = [
  {
    id: 'sun', name: 'Sun',
    svg: S(`<g ${o}>` +
      Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2, r1 = 33, r2 = 44 + (i % 2) * 3;
        return `<path d="M${50 + Math.cos(a) * r1} ${50 + Math.sin(a) * r1}L${50 + Math.cos(a) * r2} ${50 + Math.sin(a) * r2}"/>`;
      }).join('') +
      `<path d="M50 24 C66 23 77 35 76 51 C75 67 63 77 49 76 C34 75 24 64 24 49 C24 35 35 25 50 24Z" fill="${C.apricot}"/>` +
      `<circle cx="41" cy="46" r="2.2" fill="${C.plum}"/><circle cx="58" cy="46" r="2.2" fill="${C.plum}"/>` +
      `<path d="M41 57 C46 62 54 62 59 57"/><circle cx="36" cy="55" r="3.5" fill="${C.blush}" stroke="none"/><circle cx="64" cy="55" r="3.5" fill="${C.blush}" stroke="none"/></g>`),
  },
  {
    id: 'star', name: 'Star',
    svg: S(`<path d="M50 11 L60 36 L88 38 L66 56 L74 84 L50 68 L26 84 L34 56 L12 38 L40 36Z" fill="${C.butter}" ${o}/>` +
      `<path d="M50 25 L55 39" stroke="#fff" stroke-width="3" opacity=".7"/>`),
  },
  {
    id: 'heart', name: 'Heart',
    svg: S(`<path d="M50 84 C20 62 14 45 22 32 C30 20 46 24 50 36 C54 24 70 20 78 32 C86 45 80 62 50 84Z" fill="${C.red}" ${o}/>` +
      `<path d="M28 38 C30 33 35 31 39 33" stroke="#fff" stroke-width="3.2" opacity=".6"/>`),
  },
  {
    id: 'chai', name: 'Chai cup',
    svg: S(`<g ${o}><path d="M30 20 C26 27 36 31 31 38" /><path d="M46 17 C42 25 52 29 47 37"/><path d="M62 20 C58 27 68 31 63 38"/>` +
      `<path d="M22 46 H72 V62 C72 74 63 80 47 80 C31 80 22 74 22 62Z" fill="${C.cream}"/>` +
      `<path d="M24 50 H70 V56 C70 60 66 62 47 62 C28 62 24 60 24 56Z" fill="${C.kraft}" stroke="none" opacity=".85"/>` +
      `<path d="M72 50 C84 49 86 66 70 67" fill="none"/>` +
      `<path d="M14 85 C30 90 66 90 84 85" /></g>` +
      `<path d="M30 70 C34 74 40 75 44 75" stroke="${C.red}" stroke-width="3" opacity=".7"/>`),
  },
  {
    id: 'flower', name: 'Flower',
    svg: S(`<g ${o}><path d="M50 56 C50 70 48 80 46 92" fill="none"/><path d="M47 80 C36 76 30 68 31 62 C41 62 47 70 47 80Z" fill="${C.sage}"/>` +
      [0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        return `<circle cx="${50 + Math.cos(a) * 15}" cy="${34 + Math.sin(a) * 15}" r="12" fill="${C.blush}"/>`;
      }).join('') +
      `<circle cx="50" cy="34" r="8.5" fill="${C.apricot}"/></g>`),
  },
  {
    id: 'airmail', name: 'Airmail envelope',
    svg: S(`<g ${o}><rect x="12" y="26" width="76" height="50" rx="3" fill="${C.cream}"/>` +
      `<path d="M13 28 L50 55 L87 28" fill="none"/><path d="M13 75 L38 50 M87 75 L62 50" fill="none"/></g>` +
      `<path d="M12 31 V26 H88 V31" stroke="none"/>` +
      `<g stroke-width="5">${Array.from({ length: 9 }, (_, i) =>
        `<path d="M${14 + i * 9} 26 L${10 + i * 9} 30" stroke="${i % 2 ? C.sky : C.red}"/>`).join('')}</g>` +
      `<rect x="68" y="30" width="14" height="14" rx="1.5" fill="${C.apricot}" stroke="${C.plum}" stroke-width="2.4" transform="rotate(5 75 37)"/>`),
  },
  {
    id: 'withlove', name: '"With love" label',
    svg: wrap('0 0 120 70',
      `<path d="M10 14 L100 12 L112 35 L100 58 L10 56 Q4 35 10 14Z" fill="${C.cream}" stroke="${C.red}" stroke-width="3.2"/>` +
      `<circle cx="100" cy="35" r="3.5" fill="${C.cream}" stroke="${C.red}" stroke-width="2.4"/>` +
      `<path d="M16 21 L92 19 M16 50 L92 49" stroke="${C.red}" stroke-width="1.6" stroke-dasharray="3 4" opacity=".7"/>` +
      `<text x="52" y="40" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-style="italic" font-size="19" fill="${C.red}" stroke="none">with love</text>`),
  },
  {
    id: 'arrow', name: 'Arrow',
    svg: S(`<path d="M14 68 C30 30 58 28 82 40" stroke="${C.apricot}" stroke-width="9" opacity=".55"/>` +
      `<path d="M14 68 C30 30 58 28 82 40" ${o} fill="none"/>` +
      `<path d="M66 24 L84 41 L62 52" ${o} fill="none"/>`),
  },
];

// ---------- Doodles (4) ----------
const D = (body) => wrap('0 0 120 70', body);
const DOODLES = [
  {
    id: 'squiggle', name: 'Squiggle',
    svg: D(`<path d="M8 38 C16 16 24 16 30 36 C36 56 44 56 50 34 C56 14 64 14 70 36 C76 56 84 56 90 34 C96 18 104 20 112 32" stroke="${C.red}" stroke-width="4.2"/>`),
  },
  {
    id: 'loop', name: 'Loop-de-loop',
    svg: D(`<path d="M6 50 C22 50 30 36 40 24 C52 10 66 22 56 36 C46 50 30 40 40 28 C50 16 70 30 84 44 C94 52 104 50 114 44" stroke="${C.plum}" stroke-width="3.6"/>`),
  },
  {
    id: 'sparkles', name: 'Sparkles',
    svg: D(`<g fill="${C.apricot}" stroke="${C.plum}" stroke-width="2.6">` +
      `<path d="M30 8 C32 24 36 28 52 30 C36 32 32 36 30 52 C28 36 24 32 8 30 C24 28 28 24 30 8Z"/>` +
      `<path d="M86 26 C87 36 90 39 100 40 C90 41 87 44 86 54 C85 44 82 41 72 40 C82 39 85 36 86 26Z"/></g>` +
      `<circle cx="108" cy="12" r="3.4" fill="${C.red}"/><circle cx="60" cy="58" r="2.6" fill="${C.red}"/><circle cx="14" cy="60" r="2.4" fill="${C.plum}"/>`),
  },
  {
    id: 'swirl', name: 'Swirl',
    svg: D(`<path d="M60 38 C60 30 70 30 70 38 C70 48 54 48 54 36 C54 22 76 20 80 36 C84 54 56 62 44 48 C32 34 44 12 66 12 C90 12 108 34 110 52" stroke="${C.sage}" stroke-width="4.2"/>`),
  },
];

const ALL = { tape: TAPE, stickers: STICKERS, doodles: DOODLES };
export const TRAYS = ALL;
// default width of an item, as a percentage of the page width
export const DEFAULT_WIDTH = { tape: 36, stickers: 21, doodles: 30 };

export function findArt(kind, id) {
  return ALL[kind].find((a) => a.id === id);
}
export function artSvg(kind, id) {
  const a = findArt(kind, id);
  return a ? uniq(a.svg) : '';
}
export function trayIcon(kind, id) {
  return artSvg(kind, id);
}

// ---------- Postmark ----------
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
export function postmarkSvg(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const day = String(d).padStart(2, '0');
  return uniq(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 190 100" fill="none" stroke="${C.red}" stroke-width="2.2" stroke-linecap="round">` +
    `<defs><path id="__ID__t" d="M14 50 A36 36 0 0 1 86 50"/><path id="__ID__b" d="M10 50 A40 40 0 0 0 90 50"/></defs>` +
    `<circle cx="50" cy="50" r="46"/><circle cx="50" cy="50" r="31" stroke-width="1.6"/>` +
    `<text font-family="Courier Prime, monospace" font-size="9.5" font-weight="700" letter-spacing="1.6" fill="${C.red}" stroke="none">` +
    `<textPath href="#__ID__t" startOffset="50%" text-anchor="middle">LITTLE TALES</textPath></text>` +
    `<text font-family="Courier Prime, monospace" font-size="8.5" font-weight="700" letter-spacing="2" fill="${C.red}" stroke="none" dy="9">` +
    `<textPath href="#__ID__b" startOffset="50%" text-anchor="middle">POSTED</textPath></text>` +
    `<text x="50" y="47" text-anchor="middle" font-family="Courier Prime, monospace" font-weight="700" font-size="15" fill="${C.red}" stroke="none">${day} ${MONTHS[m - 1]}</text>` +
    `<text x="50" y="61" text-anchor="middle" font-family="Courier Prime, monospace" font-size="10.5" fill="${C.red}" stroke="none">${y}</text>` +
    `<path d="M100 28 C112 20 120 36 132 28 C144 20 152 36 164 28 C172 24 178 26 184 28"/>` +
    `<path d="M100 44 C112 36 120 52 132 44 C144 36 152 52 164 44 C172 40 178 42 184 44"/>` +
    `<path d="M100 60 C112 52 120 68 132 60 C144 52 152 68 164 60 C172 56 178 58 184 60"/>` +
    `<path d="M100 76 C112 68 120 84 132 76 C144 68 152 84 164 76 C172 72 178 74 184 76"/>` +
    `</svg>`);
}

export const LOGO = `<svg viewBox="0 0 40 46" xmlns="http://www.w3.org/2000/svg" fill="none"><rect x="3" y="3" width="34" height="40" rx="2" fill="${C.red}" stroke="${C.cream}" stroke-width="3" stroke-dasharray="1 4.6" stroke-linecap="round"/><rect x="9" y="9" width="22" height="25" fill="${C.cream}"/><path d="M9 29 L17 21 L23 27 L27 23 L31 28 V34 H9Z" fill="${C.apricot}"/><circle cx="25" cy="15" r="3" fill="${C.red}"/></svg>`;
