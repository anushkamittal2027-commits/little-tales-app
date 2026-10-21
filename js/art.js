// All artwork in Little Tales is original and drawn here as SVG.
// Colours come from the brand palette plus a few soft helper tones.
const C = {
  cream: '#FBF5EA', red: '#F2385A', plum: '#1E1B2E', apricot: '#FFA94D', kraft: '#B98B5E',
  sage: '#9DD35B', sky: '#6FA8FF', blush: '#FFB3D1', butter: '#FFD93D', paper: '#FFFDF8',
  pink: '#FF4FA3', lime: '#C6F135', yellow: '#FFD93D', turq: '#25C7B7', blue: '#3B5BFF', coral: '#FF6B4A',
};
export const COLORS = C;
// refined, grown-up helper tones used by the newer artwork
const K = {
  ink: '#25232F', navy: '#1F3A5F', oxblood: '#8E2F3A', forest: '#3F5E4A', olive: '#7C8450', sand: '#EADFC8',
  bone: '#F4ECDA', kraft: '#C49A68', brass: '#B98B2E', rose: '#C98C8F', dust: '#7F9BB0', mustard: '#D4A62A',
  terra: '#B8553A', sage: '#A9B79A', grey: '#8C8A94',
};

let uid = 0;
const uniq = (svg) => {
  const n = ++uid;
  return svg.replace(/__ID__/g, 'a' + n);
};
const wrap = (vb, body, extra = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" ${extra} fill="none" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

// ---------- small drawing helpers ----------
const SER = 'Playfair Display, Georgia, serif', MONO = 'DM Mono, Courier New, monospace', SANS = 'Inter, Helvetica, Arial, sans-serif';
const rnd = (seed) => { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
const f1 = (n) => Math.round(n * 10) / 10;
const lg = (n, stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1) =>
  `<linearGradient id="__ID__${n}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ''}/>`).join('')}</linearGradient>`;
const rg = (n, stops, cx = .5, cy = .5, r = .5, fx = cx, fy = cy) =>
  `<radialGradient id="__ID__${n}" cx="${cx}" cy="${cy}" r="${r}" fx="${fx}" fy="${fy}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ''}/>`).join('')}</radialGradient>`;
const u = (n) => `url(#__ID__${n})`;
// text: centred by default
const tx = (x, y, s, size, fill, extra = '', font = SANS, w = 700) =>
  `<text x="${x}" y="${y}" ${extra.includes('text-anchor') ? '' : 'text-anchor="middle" '}font-family="${font}" font-weight="${w}" font-size="${size}" fill="${fill}" stroke="none" ${extra}>${s}</text>`;
const hand = (x, y, s, size, fill, extra = '') =>
  `<text x="${x}" y="${y}" text-anchor="middle" font-family="${SER}" font-style="italic" font-weight="500" font-size="${size}" fill="${fill}" stroke="none" ${extra}>${s}</text>`;
// shared filters (ids are made unique per use)
const FSH = '<filter id="__ID__s" x="-30%" y="-30%" width="170%" height="170%"><feDropShadow dx="1" dy="2.4" stdDeviation="1.7" flood-color="#25232F" flood-opacity=".38"/></filter>';
const FGR = '<filter id="__ID__g" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 .32 0 0 0 0 .22 0 0 0 0 .1 0 0 0 .95 -.3"/><feComposite in2="SourceGraphic" operator="in"/></filter>';
const FINK = '<filter id="__ID__i" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="2" seed="7"/><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -2.6 0 0 0 2.3" result="m"/><feComposite in="SourceGraphic" in2="m" operator="in"/></filter>';
const FS = 'filter="url(#__ID__s)"', FG = 'filter="url(#__ID__g)"', FI = 'filter="url(#__ID__i)"';
// wobbly closed blob (wax, stains)
const blob = (cx, cy, r, amp, n, seed) => {
  const R = rnd(seed); const p = [];
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, rr = r + (R() - .5) * amp * 2; p.push(`${f1(cx + Math.cos(a) * rr)} ${f1(cy + Math.sin(a) * rr)}`); }
  return 'M' + p.join('L') + 'Z';
};
// torn-edge rectangle (all four sides jagged)
const torn = (x, y, w, h, amp = 2.2, step = 6, seed = 3, sides = 'tblr') => {
  const R = rnd(seed), j = () => (R() - .5) * amp * 2, p = [];
  const jg = (on) => (on ? j() : 0);
  const nx = Math.max(2, Math.round(w / step)), ny = Math.max(2, Math.round(h / step));
  for (let i = 0; i <= nx; i++) p.push([x + w * i / nx, y + jg(sides.includes('t')) * (i && i < nx ? 1 : 0)]);
  for (let i = 1; i <= ny; i++) p.push([x + w + jg(sides.includes('r')) * (i < ny ? 1 : 0), y + h * i / ny]);
  for (let i = nx - 1; i >= 0; i--) p.push([x + w * i / nx, y + h + jg(sides.includes('b')) * (i ? 1 : 0)]);
  for (let i = ny - 1; i > 0; i--) p.push([x + jg(sides.includes('l')), y + h * i / ny]);
  return 'M' + p.map(([a, b]) => `${f1(a)} ${f1(b)}`).join('L') + 'Z';
};
// stamp-like scalloped edge
const perf = (x, y, w, h, s = 6) => {
  const nx = Math.round(w / s), ny = Math.round(h / s), sx = w / nx, sy = h / ny, rx = sx / 2, ry = sy / 2;
  let d = `M${x} ${y}`;
  for (let i = 0; i < nx; i++) d += `a${rx} ${rx} 0 0 1 ${sx} 0`;
  for (let i = 0; i < ny; i++) d += `a${ry} ${ry} 0 0 1 0 ${sy}`;
  for (let i = 0; i < nx; i++) d += `a${rx} ${rx} 0 0 1 ${-sx} 0`;
  for (let i = 0; i < ny; i++) d += `a${ry} ${ry} 0 0 1 0 ${-sy}`;
  return d + 'Z';
};
const PLANE = 'M50 14 C53 14 54 18 54 24 L54 38 L82 56 L82 63 L54 53 L53 72 L62 79 L62 84 L50 80 L38 84 L38 79 L47 72 L46 53 L18 63 L18 56 L46 38 L46 24 C46 18 47 14 50 14Z';
// a point and tangent on a cubic bezier
const bez = (p, t) => {
  const m = 1 - t, [a, b, c, d] = p;
  const x = m * m * m * a[0] + 3 * m * m * t * b[0] + 3 * m * t * t * c[0] + t * t * t * d[0];
  const y = m * m * m * a[1] + 3 * m * m * t * b[1] + 3 * m * t * t * c[1] + t * t * t * d[1];
  const dx = 3 * m * m * (b[0] - a[0]) + 6 * m * t * (c[0] - b[0]) + 3 * t * t * (d[0] - c[0]);
  const dy = 3 * m * m * (b[1] - a[1]) + 6 * m * t * (c[1] - b[1]) + 3 * t * t * (d[1] - c[1]);
  const l = Math.hypot(dx, dy) || 1;
  return { x, y, tx: dx / l, ty: dy / l };
};

// ---------- Washi tape ----------
const tapeShape = '<path d="M6 3 L10 7 L6 11 L10 15 L6 19 L10 23 L6 27 L10 31 L6 35 L134 35 L130 31 L134 27 L130 23 L134 19 L130 15 L134 11 L130 7 L134 3 Z"';
const tape = (base, deco, defs = '', shape = tapeShape, gloss = true) =>
  wrap('0 0 140 38',
    `<defs><clipPath id="__ID__c">${shape}/></clipPath>${defs}</defs>` +
    `<g clip-path="url(#__ID__c)"><rect width="140" height="38" fill="${base}"/>${deco}` +
    `${gloss ? '<rect width="140" height="38" fill="#fff" opacity=".1"/>' : ''}</g>`, 'opacity=".95"');
const fibres = (seed, n, col, op = .35) => {
  const R = rnd(seed); let s = '';
  for (let i = 0; i < n; i++) { const x = R() * 140, y = R() * 38, l = 3 + R() * 7; s += `<path d="M${f1(x)} ${f1(y)}l${f1(l)} ${f1((R() - .5) * 3)}" stroke="${col}" stroke-width=".8" opacity="${op}"/>`; }
  return s;
};
const plainShape = '<path d="M0 3 H140 V35 H0Z"';
const grainRect = (op = .5) => `<rect width="140" height="38" fill="#000" ${FG} opacity="${op}"/>`;

const TAPE = [
  {
    id: 'tape-apricot', name: 'Pink stripes',
    svg: tape(C.pink, Array.from({ length: 12 }, (_, i) =>
      `<path d="M${i * 14 - 10} 40 L${i * 14 + 14} -2" stroke="#FFE3F0" stroke-width="5" opacity=".8"/>`).join('')),
  },
  {
    id: 'tape-dots', name: 'Lime dots',
    svg: tape(C.lime, Array.from({ length: 28 }, (_, i) =>
      `<circle cx="${12 + (i % 7) * 19 + (Math.floor(i / 7) % 2) * 9}" cy="${9 + Math.floor(i / 7) * 10}" r="2.8" fill="${C.plum}" opacity=".75"/>`).join('')),
  },
  {
    id: 'tape-sage', name: 'Turquoise zigzag',
    svg: tape(C.turq,
      Array.from({ length: 3 }, (_, r) => `<path d="${Array.from({ length: 16 }, (_, i) => `${i ? 'L' : 'M'}${i * 10 - 5} ${8 + r * 11 + (i % 2 ? 5 : 0)}`).join(' ')}" stroke="#fff" stroke-width="2.6" opacity=".85"/>`).join('')),
  },
  {
    id: 'tape-plum', name: 'Yellow check',
    svg: tape(C.yellow,
      Array.from({ length: 9 }, (_, i) => `<path d="M${i * 18 + 4} 0V38" stroke="${C.coral}" stroke-width="4" opacity=".55"/>`).join('') +
      Array.from({ length: 3 }, (_, i) => `<path d="M0 ${i * 14 + 6}H140" stroke="${C.coral}" stroke-width="4" opacity=".55"/>`).join('')),
  },
  {
    id: 'tape-kraft', name: 'Kraft tape',
    svg: tape('#C9A472', fibres(5, 60, '#8A6236', .4) + fibres(9, 40, '#E6CDA0', .5) + grainRect(.45), FGR, plainShape.replace('M0 3 H140 V35 H0Z', 'M0 3 L3 7 L0 11 L3 15 L0 19 L3 23 L0 27 L3 31 L0 35 H140 L137 31 L140 27 L137 23 L140 19 L137 15 L140 11 L137 7 L140 3Z')),
  },
  {
    id: 'tape-masking', name: 'Masking tape',
    svg: tape('#EADDBB', Array.from({ length: 9 }, (_, i) => `<path d="M0 ${4 + i * 4}H140" stroke="#C9B78A" stroke-width=".7" opacity=".5"/>`).join('') + grainRect(.28) +
      `<rect y="3" width="140" height="6" fill="#fff" opacity=".18"/>`, FGR),
  },
  {
    id: 'tape-vintage', name: 'Vintage stripe',
    svg: tape(K.bone, `<rect y="7" width="140" height="3.2" fill="${K.oxblood}"/><rect y="12.5" width="140" height="1.2" fill="${K.oxblood}"/>` +
      `<rect y="27.8" width="140" height="3.2" fill="${K.navy}"/><rect y="24.5" width="140" height="1.2" fill="${K.navy}"/>` +
      `<g fill="${K.ink}" opacity=".6">${Array.from({ length: 11 }, (_, i) => `<circle cx="${14 + i * 12}" cy="19" r="1.5"/>`).join('')}</g>` + grainRect(.25), FGR),
  },
  {
    id: 'tape-airmail', name: 'Airmail stripes',
    svg: tape('#FFFFFF', Array.from({ length: 11 }, (_, i) =>
      `<path d="M${i * 24 - 24} 40 l14 -42 h8 l-14 42z" fill="${i % 2 ? '#2B4C9B' : '#D9343F'}"/>`).join('')),
  },
  {
    id: 'tape-film', name: 'Film strip',
    svg: tape('#1C1B22', Array.from({ length: 14 }, (_, i) =>
      `<rect x="${3 + i * 10}" y="6.5" width="6" height="4.6" rx="1.2" fill="#F2EBDD"/><rect x="${3 + i * 10}" y="26.9" width="6" height="4.6" rx="1.2" fill="#F2EBDD"/>`).join('') +
      `<path d="M0 14.5H140M0 23.5H140" stroke="#fff" stroke-width=".6" opacity=".25"/>` +
      `<text x="8" y="22" font-family="${MONO}" font-size="6" font-weight="700" fill="#E8A33D" stroke="none" letter-spacing="1.2">&#9656;14   &#9656;14A   &#9656;15   &#9656;15A   &#9656;16</text>`, '', plainShape, false),
  },
  {
    id: 'tape-torn', name: 'Torn paper strip',
    svg: wrap('0 0 140 38', `<defs>${FSH}${FGR}</defs><g ${FS}><path d="${torn(5, 5, 130, 27, 2.3, 5, 8)}" fill="#F3EAD6"/>` +
      `<path d="${torn(5, 5, 130, 27, 2.3, 5, 8)}" fill="#000" ${FG} opacity=".35"/>` +
      `<path d="M14 15H126M14 22H112" stroke="#8C8A94" stroke-width=".9" opacity=".35"/></g>`),
  },
  {
    id: 'tape-blueprint', name: 'Blueprint grid',
    svg: tape('#2C5A93', Array.from({ length: 15 }, (_, i) => `<path d="M${i * 10} 0V38" stroke="#fff" stroke-width="${i % 5 ? .5 : 1}" opacity="${i % 5 ? .35 : .6}"/>`).join('') +
      Array.from({ length: 5 }, (_, i) => `<path d="M0 ${i * 10 - 1}H140" stroke="#fff" stroke-width="${i % 2 ? .5 : 1}" opacity=".45"/>`).join('')),
  },
  {
    id: 'tape-gold', name: 'Gold foil',
    svg: tape(u('f'), `<path d="M-10 40 L22 -2 H40 L8 40Z M70 40 L102 -2 H112 L80 40Z" fill="#fff" opacity=".28"/>` +
      `<g fill="#fff" opacity=".85"><circle cx="30" cy="12" r="1.2"/><circle cx="96" cy="27" r="1.1"/><circle cx="124" cy="11" r="1.3"/></g>` + grainRect(.2),
      lg('f', [[0, '#B88524'], [.25, '#F4DB8B'], [.5, '#C8962E'], [.75, '#F8E7A6'], [1, '#B07F26']], 0, 0, 1, 1) + FGR),
  },
  {
    id: 'tape-muted', name: 'Muted pastel',
    svg: tape('#E5D2CA', `<rect y="0" width="140" height="13" fill="#CBD2C0"/><rect y="25" width="140" height="13" fill="#D9C7AE"/>` +
      Array.from({ length: 12 }, (_, i) => `<circle cx="${8 + i * 12}" cy="19" r="2" fill="#fff" opacity=".8"/>`).join('')),
  },
  {
    id: 'tape-floral', name: 'Floral tape',
    svg: tape(K.bone, Array.from({ length: 7 }, (_, i) => {
      const x = 12 + i * 20, y = i % 2 ? 11 : 26;
      return `<g transform="translate(${x} ${y})"><ellipse cx="-7" cy="3" rx="5" ry="2" fill="${K.sage}" transform="rotate(-25 -7 3)"/><ellipse cx="7" cy="3" rx="5" ry="2" fill="${K.sage}" transform="rotate(25 7 3)"/>` +
        [0, 72, 144, 216, 288].map((a) => `<ellipse cy="-3.4" rx="2.6" ry="3.6" fill="${i % 3 ? K.rose : '#D9A66B'}" transform="rotate(${a})"/>`).join('') + `<circle r="1.7" fill="${K.mustard}"/></g>`;
    }).join('') + grainRect(.2), FGR),
  },
  {
    id: 'tape-diary', name: '"Dear diary" tape',
    svg: tape('#F6EFDD', `<path d="M0 30H140" stroke="${K.grey}" stroke-width=".8" stroke-dasharray="2 3" opacity=".6"/>` +
      [38, 106].map((x) => hand(x, 23, 'dear diary,', 10.5, K.ink)).join('') + grainRect(.2), FGR),
  },
];

// ---------- Stickers ----------
const S = (body) => wrap('0 0 100 100', body);
const o = `stroke="${C.plum}" stroke-width="3.2"`;
// richer artwork: filters are added to <defs> only when the body asks for them
const N = (body, defs = '', vb = '0 0 100 100') => {
  const f = (body.includes('__ID__s)') ? FSH : '') + (body.includes('__ID__g)') ? FGR : '') + (body.includes('__ID__i)') ? FINK : '');
  return wrap(vb, `<defs>${f}${defs}</defs>${body}`, 'class="art"');
};
const FE = 'Festivals', VT = 'Vintage & travel', RO = 'Realistic objects', ED = 'Editorial', LJ = 'Little joys', BO = 'Botanical', FD = 'Food & drink';
export const STICKER_GROUPS = [FE, VT, RO, ED, LJ, BO, FD];

const VINTAGE = [
  {
    id: 'airmail-stamp', name: 'Airmail stamp', group: VT,
    svg: N(`<g ${FS}><path d="${perf(14, 6, 72, 88, 6)}" fill="#FBF6EA"/>` +
      `<rect x="21" y="13" width="58" height="74" fill="${u('b')}"/><rect x="24" y="16" width="52" height="68" stroke="#F4ECDA" stroke-width=".9" opacity=".7"/>` +
      `<g transform="translate(22 14) scale(.56)" fill="#F4ECDA"><path d="${PLANE}"/></g>` +
      tx(50, 66, 'AIR MAIL', 7, '#F4ECDA', 'letter-spacing="1.2"', SER) + tx(50, 77, '25 c', 7.5, '#F4ECDA', '', MONO) + `</g>` +
      `<path d="M52 72 C60 64 66 78 74 70 C82 62 88 74 96 66 M52 79 C60 71 66 85 74 77 C82 69 88 81 96 73" stroke="${K.oxblood}" stroke-width="1.6" opacity=".7"/>`,
      lg('b', [[0, '#2E4F8E'], [1, '#1D3563']])),
  },
  {
    id: 'passport-stamp', name: 'Passport stamp', group: VT,
    svg: N(`<g ${FI} transform="rotate(-6 55 40)" stroke="#2D4A8C" opacity=".92"><rect x="8" y="6" width="94" height="68" rx="8" stroke-width="2.6"/><rect x="13" y="11" width="84" height="58" rx="5" stroke-width="1"/>` +
      tx(55, 24, 'ARRIVED', 9, '#2D4A8C', 'letter-spacing="3"', MONO) +
      `<path d="M16 29H94M16 55H94" stroke-width="1"/>` + tx(55, 46, '12 JUN 2025', 11, '#2D4A8C', '', MONO) +
      tx(55, 65, 'IMMIGRATION', 7, '#2D4A8C', 'letter-spacing="2"', MONO) + `<g transform="translate(76 5) scale(.22)" opacity=".0"><path d="${PLANE}"/></g></g>`, '', '0 0 110 80'),
  },
  {
    id: 'boarding-pass', name: 'Boarding pass', group: VT,
    svg: N(`<g ${FS}><path d="M2 2 H98 a4 4 0 0 0 8 0 H142 V62 H106 a4 4 0 0 0 -8 0 H2Z" fill="#FBF8F0"/><path d="M2 2H98a4 4 0 0 0 8 0H142V14H2Z" fill="${K.navy}"/></g>` +
      tx(10, 11, 'BOARDING PASS', 6.6, '#F4ECDA', 'letter-spacing="1.4" text-anchor="start"') +
      tx(26, 36, 'DEL', 14, K.ink, '', SER) + `<path d="M42 31 H60 M55 27 L60 31 L55 35" stroke="${K.ink}" stroke-width="1.4"/>` + tx(78, 36, 'LHR', 14, K.ink, '', SER) +
      tx(10, 46, 'PASSENGER', 4.6, K.grey, 'text-anchor="start" letter-spacing=".8"') + tx(10, 53, 'TRAVELLER / MS', 6, K.ink, 'text-anchor="start"', MONO) +
      tx(78, 46, 'GATE', 4.6, K.grey, 'text-anchor="start"') + tx(78, 54, '27', 8, K.oxblood, 'text-anchor="start"', MONO) +
      `<path d="M102 6V58" stroke="${K.grey}" stroke-width="1" stroke-dasharray="2 2.5"/>` +
      `<g transform="translate(112 22)" fill="${K.ink}">${Array.from({ length: 16 }, (_, i) => `<rect x="${i * 1.8 + (i % 3)}" y="0" width="${i % 3 ? 1 : 1.7}" height="30"/>`).join('')}</g>` +
      tx(124, 17, '27A', 7, '#F4ECDA', '', MONO), '', '0 0 144 64'),
  },
  {
    id: 'ticket-stub', name: 'Ticket stub', group: VT,
    svg: N(`<g ${FS}><path d="M4 4 H116 V24 a8 8 0 0 0 0 16 V60 H4 V40 a8 8 0 0 0 0 -16Z" fill="${u('t')}"/></g>` +
      `<rect x="10" y="10" width="100" height="44" stroke="#F8EBD0" stroke-width="1" stroke-dasharray="3 2.5" opacity=".75"/>` +
      tx(60, 29, 'ADMIT ONE', 10.5, '#FBF1DC', 'letter-spacing="1.4"', SER) + `<path d="M24 34H96" stroke="#FBF1DC" stroke-width=".9" opacity=".7"/>` +
      tx(60, 46, 'No. 0427  ·  ROW B', 6.6, '#FBF1DC', 'letter-spacing="1.4"', MONO),
            lg('t', [[0, '#C0583B'], [1, '#9C3F2A']]), '0 0 120 64'),
  },
  {
    id: 'luggage-tag', name: 'Luggage tag', group: VT,
    svg: N(`<path d="M50 6 C34 6 30 16 36 24" stroke="${K.oxblood}" stroke-width="2.4"/><g ${FS}><path d="M30 28 L50 18 L70 28 V90 a4 4 0 0 1 -4 4 H34 a4 4 0 0 1 -4 -4Z" fill="${u('k')}"/>` +
      `<circle cx="50" cy="31" r="4.6" fill="#fff" stroke="${K.brass}" stroke-width="2"/></g>` +
      `<path d="M30 46H70" stroke="${K.oxblood}" stroke-width="2.2"/>` +
      tx(50, 58, 'BOUND FOR', 6.2, K.ink, 'letter-spacing="1.4"', MONO) + tx(50, 72, 'Somewhere', 10.5, K.ink, '', SER, 600).replace('<text', '<text font-style="italic"') + tx(50, 84, 'lovely', 10.5, K.oxblood, '', SER, 600).replace('<text', '<text font-style="italic"'),
      lg('k', [[0, '#EBDCBD'], [1, '#D2BD93']])),
  },
  {
    id: 'label-fragile', name: 'Fragile label', group: VT,
    svg: N(`<g ${FS}><rect x="6" y="8" width="108" height="54" rx="4" fill="${K.oxblood}"/></g><g ${FI}>` +
      `<rect x="10" y="12" width="100" height="46" rx="2" stroke="#F5E8D8" stroke-width="1.4"/>` +
      `<g transform="translate(18 17)" stroke="#F5E8D8" stroke-width="2"><path d="M4 2H20L18 16Q12 22 6 16Z"/><path d="M12 22V32M5 33H19"/></g>` +
      tx(74, 34, 'FRAGILE', 12.5, '#F5E8D8', 'letter-spacing="1.2"', SER) + tx(74, 47, 'GLASS · THIS SIDE UP', 4.6, '#F5E8D8', 'letter-spacing=".8"') + `</g>`, '', '0 0 120 70'),
  },
  {
    id: 'label-handle', name: 'Handle with care', group: VT,
    svg: N(`<g ${FS}><rect x="6" y="6" width="108" height="58" rx="3" fill="#F2EAD6"/></g><g ${FI}>` +
      `<rect x="10" y="10" width="100" height="50" stroke="${K.ink}" stroke-width="2.2"/><rect x="13" y="13" width="94" height="44" stroke="${K.ink}" stroke-width=".8"/>` +
      tx(60, 31, 'HANDLE', 11, K.ink, 'letter-spacing="2.4"', SER) + tx(60, 48, 'WITH CARE', 11, K.ink, 'letter-spacing="2.4"', SER) +
      `<g stroke="${K.ink}" stroke-width="2"><path d="M20 24V44M16 28L20 24L24 28M100 24V44M96 28L100 24L104 28"/></g></g>`, '', '0 0 120 70'),
  },
  {
    id: 'label-airmail', name: 'Air Mail label', group: VT,
    svg: N(`<g ${FS}><rect x="6" y="8" width="108" height="54" fill="#FBF8F0"/></g>` +
      `<g>${Array.from({ length: 12 }, (_, i) => `<path d="M${i * 9 + 6} 8 l6 0 l-5 6 l-6 0z" fill="${i % 2 ? '#2B4C9B' : '#D9343F'}"/>`).join('')}</g>` +
      `<rect x="6" y="8" width="108" height="6" fill="none"/>` +
      `<rect x="6" y="14" width="108" height="42" fill="#FBF8F0"/>` +
      `<path d="M6 8H114V14H6Z M6 56H114V62H6Z" fill="${u('s2')}"/>` +
      tx(60, 33, 'AIR MAIL', 17, '#2B4C9B', 'letter-spacing="2.4"', SER) + tx(60, 46, 'PAR AVION', 8, '#D9343F', 'letter-spacing="3"', SER, 500).replace('<text', '<text font-style="italic"'),
      `<pattern id="__ID__s2" width="10" height="6" patternUnits="userSpaceOnUse" patternTransform="skewX(-35)"><rect width="5" height="6" fill="#D9343F"/><rect x="5" width="5" height="6" fill="#2B4C9B"/></pattern>`, '0 0 120 70'),
  },
  {
    id: 'label-no27', name: 'Label No. 27', group: VT,
    svg: N(`<g ${FS}><ellipse cx="60" cy="35" rx="54" ry="29" fill="${u('gd')}"/></g>` +
      `<ellipse cx="60" cy="35" rx="49" ry="24" stroke="#5B3F0E" stroke-width="1.1"/><ellipse cx="60" cy="35" rx="46" ry="21" stroke="#5B3F0E" stroke-width=".6"/>` +
      tx(60, 24, 'SELECT QUALITY', 4.4, '#4A340C', 'letter-spacing="1.2"') + tx(60, 46, 'No. 27', 24, '#3E2C08', '', SER, 600) + tx(60, 52, 'EST. 1924', 4.4, '#4A340C', 'letter-spacing="1.6"'),
      lg('gd', [[0, '#F0D68A'], [.5, '#D2A94A'], [1, '#B98B2E']], 0, 0, 1, 1), '0 0 120 70'),
  },
  {
    id: 'postmark-rings', name: 'Postmark rings', group: VT,
    svg: N(`<g ${FI} stroke="${K.oxblood}" opacity=".88"><circle cx="40" cy="40" r="34" stroke-width="2.4"/><circle cx="40" cy="40" r="24" stroke-width="1.2"/>` +
      `<path id="__ID__p" d="M12 40a28 28 0 0 1 56 0" stroke="none"/><text font-family="${MONO}" font-weight="700" font-size="7.4" letter-spacing="1.8" stroke="none"><textPath href="#__ID__p" startOffset="50%" text-anchor="middle">GENERAL POST</textPath></text>` +
      tx(40, 41, '14 JUN', 10.5, K.oxblood, '', MONO) + tx(40, 52, '2025', 8.5, K.oxblood, '', MONO, 400) +
      `<g fill="none" stroke-width="2.2">${[26, 36, 46, 56].map((y) => `<path d="M76 ${y}C84 ${y - 7} 90 ${y + 7} 98 ${y}S110 ${y - 6} 118 ${y}"/>`).join('')}</g></g>`, '', '0 0 124 80'),
  },
  {
    id: 'compass', name: 'Compass', group: VT,
    svg: N(`<g ${FS}><circle cx="50" cy="52" r="40" fill="${u('br')}"/><circle cx="50" cy="12" r="6.5" fill="none" stroke="${K.brass}" stroke-width="3.5"/></g>` +
      `<circle cx="50" cy="52" r="32" fill="#F6EFDD" stroke="#7A5A14" stroke-width="1.5"/><circle cx="50" cy="52" r="27" stroke="${K.ink}" stroke-width=".6" opacity=".5"/>` +
      Array.from({ length: 24 }, (_, i) => { const a = i / 24 * Math.PI * 2; return `<path d="M${f1(50 + Math.sin(a) * 27)} ${f1(52 - Math.cos(a) * 27)}L${f1(50 + Math.sin(a) * (i % 6 ? 24.5 : 22))} ${f1(52 - Math.cos(a) * (i % 6 ? 24.5 : 22))}" stroke="${K.ink}" stroke-width=".8"/>`; }).join('') +
      `<path d="M50 52 L56 52 L50 24 L44 52Z" fill="${K.oxblood}"/><path d="M50 52 L56 52 L50 80 L44 52Z" fill="${K.ink}" opacity=".8"/><path d="M50 52 L76 46 L50 58 L24 46Z" fill="${K.grey}" opacity=".0"/>` +
      `<path d="M50 52L74 52L50 49 L26 52L50 55Z" fill="${K.grey}"/>` +
      `<circle cx="50" cy="52" r="3" fill="${K.brass}" stroke="${K.ink}" stroke-width=".8"/>` + tx(50, 21, 'N', 6, K.ink, '', SER) +
      `<path d="M26 28 C34 22 44 20 52 20" stroke="#fff" stroke-width="2" opacity=".55"/>`,
      lg('br', [[0, '#E3C877'], [.5, '#B98B2E'], [1, '#7A5A14']], 0, 0, 1, 1)),
  },
  {
    id: 'map-piece', name: 'Vintage map', group: VT,
    svg: N(`<g ${FS}><path d="M8 18 L40 10 L66 18 L92 10 V82 L66 90 L40 82 L8 90Z" fill="#EFE3C4"/></g>` +
      `<path d="M8 18 L40 10 L66 18 L92 10 V82 L66 90 L40 82 L8 90Z" fill="#000" ${FG} opacity=".25"/>` +
      `<path d="M40 10V82M66 18V90" stroke="#B99E6B" stroke-width="1" opacity=".7"/>` +
      `<path d="M10 40 C20 30 28 38 34 32 C44 24 52 34 50 44 C48 54 38 56 30 62 C22 68 14 60 10 52Z" fill="#B7C79A" opacity=".85"/>` +
      `<path d="M58 60 C66 52 78 54 88 50 V74 C78 72 70 80 60 74Z" fill="#9DB7BE" opacity=".8"/>` +
      `<path d="M14 24H86M14 50H86M14 76H86" stroke="${K.dust}" stroke-width=".5" opacity=".6"/>` +
      `<path d="M20 48 C30 44 36 52 48 46 S62 40 72 44" stroke="${K.oxblood}" stroke-width="1.6" stroke-dasharray="3 3"/>` +
      `<path d="M74 38l8 8m0-8l-8 8" stroke="${K.oxblood}" stroke-width="2.4"/>` + tx(26, 30, 'Sea of Dreams', 4.6, K.navy, '', SER, 500).replace('<text', '<text font-style="italic"')),
  },
  {
    id: 'hotel-sticker', name: 'Hotel luggage sticker', group: VT,
    svg: N(`<g ${FS}><circle cx="50" cy="50" r="42" fill="${K.navy}"/></g><circle cx="50" cy="50" r="38" stroke="${K.mustard}" stroke-width="1.6"/><circle cx="50" cy="50" r="22" stroke="${K.mustard}" stroke-width="1"/>` +
      `<path id="__ID__h" d="M22 50a28 28 0 0 1 56 0" stroke="none"/><path id="__ID__j" d="M17 50a33 33 0 0 0 66 0" stroke="none"/>` +
      `<text font-family="${SER}" font-weight="600" font-size="7.6" letter-spacing="1.2" fill="${K.mustard}" stroke="none"><textPath href="#__ID__h" startOffset="50%" text-anchor="middle">GRAND HOTEL</textPath></text>` +
      `<text font-family="${SANS}" font-weight="700" font-size="5" letter-spacing=".9" fill="#F4ECDA" stroke="none"><textPath href="#__ID__j" startOffset="50%" text-anchor="middle">ROOM 27 · EST. 1924</textPath></text>` +
      `<path d="M36 56 L38 42 L44 49 L50 38 L56 49 L62 42 L64 56Z" fill="${K.mustard}"/><rect x="36" y="58" width="28" height="4" rx="1" fill="${K.mustard}"/>`),
  },
  {
    id: 'vintage-camera', name: 'Vintage camera', group: VT,
    svg: N(`<g ${FS}><rect x="8" y="30" width="84" height="54" rx="7" fill="${u('bd')}"/><rect x="8" y="22" width="84" height="14" rx="4" fill="${u('sv')}"/>` +
      `<rect x="20" y="14" width="18" height="10" rx="2" fill="${u('sv')}"/><rect x="68" y="12" width="10" height="12" rx="2" fill="${K.oxblood}"/></g>` +
      `<rect x="14" y="40" width="72" height="38" rx="4" fill="#3A3944" opacity=".0"/>` +
      `<circle cx="50" cy="58" r="22" fill="${u('sv')}"/><circle cx="50" cy="58" r="17" fill="#17161C"/><circle cx="50" cy="58" r="11" fill="${u('ln')}"/>` +
      `<circle cx="45" cy="52" r="3.4" fill="#fff" opacity=".65"/><circle cx="56" cy="64" r="1.6" fill="#fff" opacity=".4"/>` +
      `<circle cx="80" cy="40" r="3" fill="#E9E0CC"/><rect x="14" y="40" width="14" height="6" rx="1.5" fill="#E9E0CC" opacity=".8"/>`,
      lg('bd', [[0, '#3C3B47'], [1, '#1B1A22']]) + lg('sv', [[0, '#F2F2F4'], [.5, '#B4B6BE'], [1, '#8A8C96']]) + rg('ln', [[0, '#5B7FB5'], [.6, '#243B66'], [1, '#101A33']], .4, .35, .7)),
  },
  {
    id: 'film-roll', name: 'Film strip', group: VT,
    svg: N(`<g transform="rotate(-18 50 50)" ${FS}><rect x="-6" y="26" width="112" height="48" fill="#1E1D24"/>` +
      Array.from({ length: 12 }, (_, i) => `<rect x="${-2 + i * 9.4}" y="29" width="5" height="4" rx="1" fill="#F2EBDD"/><rect x="${-2 + i * 9.4}" y="67" width="5" height="4" rx="1" fill="#F2EBDD"/>`).join('') +
      [0, 1, 2].map((i) => `<rect x="${3 + i * 34}" y="37" width="30" height="26" fill="${['#8FB4C9', '#E3B97A', '#9FB690'][i]}"/><path d="M${3 + i * 34} 63 L${3 + i * 34 + 10} 52 L${3 + i * 34 + 18} 58 L${3 + i * 34 + 30} 46 V63Z" fill="#26323F" opacity=".55"/><circle cx="${3 + i * 34 + 22}" cy="44" r="3" fill="#FFF6D8" opacity=".9"/>`).join('') + `</g>`),
  },
  {
    id: 'polaroid', name: 'Instant photo frame', group: VT,
    svg: N(`<g transform="rotate(4 50 50)" ${FS}><rect x="12" y="8" width="76" height="86" fill="#FBF9F3"/><rect x="18" y="14" width="64" height="58" fill="${u('sk')}"/>` +
      `<circle cx="64" cy="34" r="6" fill="#FFF3C9" opacity=".95"/><path d="M18 72V56 C30 46 40 52 48 54 C58 44 70 48 82 56V72Z" fill="#6C7E5A"/><path d="M18 72V62 C32 56 52 62 82 60V72Z" fill="#4F6140"/>` +
      hand(50, 86, 'summer &#8217;25', 9.5, K.ink) + `<path d="M12 8H88V94H12Z" fill="#fff" opacity=".12"/></g>`,
      lg('sk', [[0, '#9CC0D8'], [1, '#F3D9B4']])),
  },
  {
    id: 'badge-tower', name: 'Iron tower badge', group: VT,
    svg: N(`<g ${FS}><circle cx="50" cy="50" r="43" fill="#F6EFDD"/></g><circle cx="50" cy="50" r="39" stroke="${K.navy}" stroke-width="1.8"/><circle cx="50" cy="50" r="35" stroke="${K.navy}" stroke-width=".7"/>` +
      `<g stroke="${K.navy}" stroke-width="1.8" transform="translate(50 46) scale(.78) translate(-50 -46)"><path d="M50 14V26M46 26H54"/><path d="M47 26L44 44H56L53 26"/><path d="M44 44C42 52 38 62 34 72M56 44C58 52 62 62 66 72"/><path d="M34 72H66"/><path d="M40 72 C43 62 57 62 60 72" /><path d="M45 36H55M43 44H57M40 54H60M44 44L56 54M56 44L44 54"/><path d="M34 72L30 76M66 72L70 76"/></g>` +
      `<path id="__ID__a" d="M18 50a32 32 0 0 0 64 0" stroke="none"/><text font-family="${SER}" font-weight="600" font-size="5.6" letter-spacing="1.6" fill="${K.navy}" stroke="none"><textPath href="#__ID__a" startOffset="50%" text-anchor="middle">PARIS · FRANCE</textPath></text>`),
  },
  {
    id: 'badge-dome', name: 'Domed palace badge', group: VT,
    svg: N(`<g ${FS}><circle cx="50" cy="50" r="43" fill="#F6EFDD"/></g><circle cx="50" cy="50" r="39" stroke="${K.terra}" stroke-width="1.8"/><circle cx="50" cy="50" r="35" stroke="${K.terra}" stroke-width=".7"/>` +
      `<g stroke="${K.terra}" stroke-width="1.8" transform="translate(50 46) scale(.78) translate(-50 -46)"><path d="M50 20V27M44 56C44 40 56 40 56 56"/><path d="M36 58C36 42 42 36 50 28C58 36 64 42 64 58"/><path d="M33 58H67V68H33Z"/><path d="M45 68V62C45 58 55 58 55 62V68"/><path d="M22 70V42M26 70V42M22 42L24 36L26 42M74 70V42M78 70V42M74 42L76 36L78 42"/><path d="M20 70H80"/></g>` +
      `<path id="__ID__a" d="M18 50a32 32 0 0 0 64 0" stroke="none"/><text font-family="${SER}" font-weight="600" font-size="5.6" letter-spacing="1.6" fill="${K.terra}" stroke="none"><textPath href="#__ID__a" startOffset="50%" text-anchor="middle">AGRA · INDIA</textPath></text>`),
  },
];

const REAL = [
  {
    id: 'paperclip', name: 'Paper clip', group: RO,
    svg: N(`<g transform="rotate(24 50 52)" ${FS}><path stroke="#4D505C" opacity=".55" d="M44 40V68A10 10 0 0 0 64 68V30A14 14 0 0 0 36 30V74A18 18 0 0 0 72 74V44" stroke-width="5.6"/><path d="M44 40V68A10 10 0 0 0 64 68V30A14 14 0 0 0 36 30V74A18 18 0 0 0 72 74V44" stroke="${u('m')}" stroke-width="4.4"/>` +
      `<path d="M44 40V68A10 10 0 0 0 64 68V30A14 14 0 0 0 36 30V74A18 18 0 0 0 72 74V44" stroke="#fff" stroke-width="1" opacity=".7" transform="translate(-1 -1)"/></g>`,
      lg('m', [[0, '#EEF0F4'], [.3, '#8D909C'], [.55, '#DCDEE6'], [1, '#5E616D']], 0, 0, 1, 1)),
  },
  {
    id: 'wax-seal', name: 'Wax seal', group: RO,
    svg: N(`<g ${FS}><path d="${blob(50, 50, 36, 3, 28, 4)}" fill="${u('w')}"/></g>` +
      `<path d="M68 82 C74 90 82 88 80 80Z" fill="#8F1F2C"/>` +
      `<circle cx="50" cy="50" r="25" fill="none" stroke="#6E1420" stroke-width="2" opacity=".6"/><circle cx="50" cy="50" r="25" fill="none" stroke="#F08A8A" stroke-width="1.2" opacity=".35" transform="translate(1 1.4)"/>` +
      `<path d="M50 34 L54 45 L66 46 L57 54 L60 66 L50 59 L40 66 L43 54 L34 46 L46 45Z" fill="#9A1B2A" stroke="#F08A8A" stroke-width=".9" stroke-opacity=".55"/>` +
      `<path d="M26 36 C32 24 44 18 56 18" stroke="#fff" stroke-width="3.4" opacity=".4"/><ellipse cx="40" cy="26" rx="5" ry="2.4" fill="#fff" opacity=".45" transform="rotate(-30 40 26)"/>`,
      rg('w', [[0, '#D8404F'], [.6, '#A21E2E'], [1, '#6E1420']], .38, .32, .8)),
  },
  {
    id: 'pushpin', name: 'Pushpin', group: RO,
    svg: N(`<ellipse cx="60" cy="86" rx="20" ry="5" fill="#25232F" opacity=".22"/><path d="M47 62 L38 92" stroke="#8A8D98" stroke-width="2.6"/>` +
      `<g ${FS}><ellipse cx="50" cy="60" rx="24" ry="8" fill="#9E1F2B"/><path d="M36 60 L39 34 C39 24 61 24 61 34 L64 60 C58 66 42 66 36 60Z" fill="${u('p')}"/><ellipse cx="50" cy="32" rx="12" ry="6" fill="#E85A66"/></g>` +
      `<path d="M41 36 L41 56" stroke="#fff" stroke-width="3" opacity=".45"/><ellipse cx="46" cy="30" rx="4" ry="1.8" fill="#fff" opacity=".6"/>`,
      lg('p', [[0, '#F0606C'], [.45, '#D13441'], [1, '#8F1824']], 0, 0, 1, 0)),
  },
  {
    id: 'safety-pin', name: 'Safety pin', group: RO,
    svg: N(`<g transform="rotate(-25 50 50)" ${FS}><g stroke="#4D505C" stroke-width="5" opacity=".45"><path d="M28 36H76M28 62H72"/></g>` +
      `<g stroke="${u('m')}" stroke-width="3.2"><path d="M30 36H78"/><path d="M30 36C10 36 10 62 30 62H74L84 52"/><circle cx="22" cy="49" r="4.4"/></g>` +
      `<rect x="74" y="28" width="20" height="16" rx="6" stroke="${u('m')}" stroke-width="3"/><path d="M32 34H76" stroke="#fff" stroke-width=".9" opacity=".8"/></g>`,
      lg('m', [[0, '#EEF0F4'], [.35, '#8D909C'], [.6, '#DCDEE6'], [1, '#5E616D']], 0, 0, 0, 1)),
  },
  {
    id: 'coffee-ring', name: 'Coffee ring', group: RO,
    svg: N(`<path d="${blob(50, 50, 33, 2.4, 30, 5)}" stroke="#7A4A22" stroke-width="5" opacity=".42"/><path d="${blob(51, 49, 31, 2, 30, 9)}" stroke="#5E3416" stroke-width="1.6" opacity=".55"/>` +
      `<path d="${blob(50, 50, 29, 2, 26, 3)}" fill="#A8743F" opacity=".12"/><path d="M20 62 C24 78 36 84 50 84" stroke="#7A4A22" stroke-width="2" opacity=".25"/>` +
      `<circle cx="84" cy="22" r="3.4" fill="#7A4A22" opacity=".4"/><circle cx="90" cy="32" r="1.6" fill="#7A4A22" opacity=".4"/><circle cx="16" cy="28" r="1.8" fill="#7A4A22" opacity=".35"/>`),
  },
  {
    id: 'torn-scrap', name: 'Torn paper scrap', group: RO,
    svg: N(`<g ${FS} transform="rotate(-5 50 50)"><path d="${torn(14, 16, 72, 66, 3, 7, 11)}" fill="#F6EEDC"/><path d="${torn(14, 16, 72, 66, 3, 7, 11)}" fill="#000" ${FG} opacity=".35"/></g>` +
      `<g transform="rotate(-5 50 50)" stroke="${K.grey}" stroke-width="1.3" opacity=".45"><path d="M24 34H72M24 44H76M24 54H64M24 64H70"/></g>`),
  },
  {
    id: 'pressed-leaf', name: 'Pressed leaf', group: RO,
    svg: N(`<g ${FS} transform="rotate(14 50 50)"><path d="M50 6 C82 26 86 66 50 90 C14 66 18 26 50 6Z" fill="${u('l')}"/>` +
      `<path d="M50 6V96M50 30L32 20M50 44L28 32M50 58L26 46M50 72L30 62M50 30L68 20M50 44L72 32M50 58L74 46M50 72L70 62" stroke="#6B5424" stroke-width="1.2" opacity=".6"/></g><path d="M50 90 V99" stroke="#6B5424" stroke-width="2.4"/>`,
      lg('l', [[0, '#C9A24A'], [.45, '#8EA14B'], [1, '#4F7442']], 0, 0, 1, 1)),
  },
  {
    id: 'pressed-flower', name: 'Pressed flower', group: RO,
    svg: N(`<g ${FS}><path d="M50 52C50 66 48 80 46 96" stroke="#6C8B54" stroke-width="2.4"/><path d="M48 78C36 76 30 68 30 60C42 60 48 66 48 78Z" fill="#8FAE6A"/><path d="M48 70C58 68 66 62 68 54C58 54 50 60 48 70Z" fill="#7FA05E"/>` +
      [0, 1, 2, 3, 4].map((i) => `<ellipse cx="50" cy="22" rx="9" ry="16" fill="${u('pt')}" transform="rotate(${i * 72} 50 38)"/>`).join('') +
      `<circle cx="50" cy="38" r="5.2" fill="#E3B24A"/></g><circle cx="48.5" cy="36.5" r="1.8" fill="#fff" opacity=".6"/>`,
      rg('pt', [[0, '#F2C6CC'], [1, '#CF8A97']], .5, .8, .8)),
  },
  {
    id: 'feather', name: 'Feather', group: RO,
    svg: N(`<g ${FS} transform="rotate(8 50 50)"><path d="M26 96 C12 56 40 14 82 6 C88 44 66 84 26 96Z" fill="${u('f')}"/>` +
      Array.from({ length: 13 }, (_, i) => { const p = bez([[26, 96], [38, 60], [60, 34], [82, 6]], (i + 1) / 14); return `<path d="M${f1(p.x)} ${f1(p.y)}l${f1(-p.ty * 17 + p.tx * -4)} ${f1(p.tx * 17 + p.ty * -4)}M${f1(p.x)} ${f1(p.y)}l${f1(p.ty * 17 + p.tx * -4)} ${f1(-p.tx * 17 + p.ty * -4)}" stroke="#6E7A93" stroke-width=".8" opacity=".55"/>`; }).join('') +
      `<path d="M20 100C44 60 62 34 82 6" stroke="#5E574B" stroke-width="1.8"/></g>`,
      lg('f', [[0, '#F2F5FA'], [.5, '#BAC5D7'], [1, '#7F8DA6']], 0, 0, 1, 1)),
  },
  {
    id: 'antique-key', name: 'Antique key', group: RO,
    svg: N(`<g ${FS} transform="rotate(40 50 50)"><circle cx="22" cy="38" r="12" stroke="${u('b')}" stroke-width="6"/><circle cx="22" cy="38" r="15" stroke="#6E4E12" stroke-width=".8" opacity=".6"/><circle cx="22" cy="38" r="9" stroke="#6E4E12" stroke-width=".8" opacity=".6"/>` +
      `<rect x="34" y="35" width="54" height="6" rx="2.4" fill="${u('b')}" stroke="#6E4E12" stroke-width=".9"/><path d="M72 41v11h6V41M82 41v15h6V41" fill="${u('b')}" stroke="#6E4E12" stroke-width=".9"/>` +
      `<circle cx="40" cy="38" r="3.2" fill="${u('b')}" stroke="#6E4E12" stroke-width=".8"/><path d="M12 30C15 25 20 24 25 25" stroke="#fff" stroke-width="1.8" opacity=".75"/></g>`,
      lg('b', [[0, '#F0D88C'], [.5, '#C79A3A'], [1, '#8A6418']], 0, 0, 0, 1)),
  },
  {
    id: 'pocket-watch', name: 'Pocket watch', group: RO,
    svg: N(`<g ${FS}><rect x="44" y="4" width="12" height="9" rx="3" fill="${u('gd')}"/><circle cx="50" cy="6" r="6" stroke="${u('gd')}" stroke-width="3"/><circle cx="50" cy="55" r="40" fill="${u('gd')}"/></g>` +
      `<circle cx="50" cy="55" r="33" fill="#FBF6E8" stroke="#8A6418" stroke-width="1.4"/>` +
      Array.from({ length: 12 }, (_, i) => { const a = i / 12 * Math.PI * 2; return `<path d="M${f1(50 + Math.sin(a) * 29)} ${f1(55 - Math.cos(a) * 29)}L${f1(50 + Math.sin(a) * 25)} ${f1(55 - Math.cos(a) * 25)}" stroke="${K.ink}" stroke-width="${i % 3 ? 1 : 2}"/>`; }).join('') +
      `<path d="M50 55V34M50 55L64 62" stroke="${K.ink}" stroke-width="2.4"/><path d="M50 55L38 49" stroke="${K.oxblood}" stroke-width="1"/><circle cx="50" cy="55" r="2.4" fill="${K.ink}"/>` +
      `<path d="M22 40C26 30 34 24 44 22" stroke="#fff" stroke-width="3" opacity=".5"/>`,
      lg('gd', [[0, '#F4DC92'], [.5, '#C79A3A'], [1, '#8A6418']], 0, 0, 1, 1)),
  },
  {
    id: 'dried-fern', name: 'Dried fern', group: RO,
    svg: (() => {
      const P = [[30, 96], [26, 62], [44, 30], [74, 8]]; let leaves = '';
      for (let i = 0; i < 15; i++) {
        const t = .08 + i * .062, p = bez(P, t), L = 22 * (1 - t * .75);
        [-1, 1].forEach((sd) => { const nx = -p.ty * sd, ny = p.tx * sd, ex = p.x + nx * L + p.tx * L * .45, ey = p.y + ny * L + p.ty * L * .45; leaves += `<path d="M${f1(p.x)} ${f1(p.y)}Q${f1(p.x + nx * L * .6)} ${f1(p.y + ny * L * .6 - 3)} ${f1(ex)} ${f1(ey)}Q${f1(p.x + nx * L * .5)} ${f1(p.y + ny * L * .5 + 3)} ${f1(p.x)} ${f1(p.y)}Z" fill="${u('fr')}" stroke="none"/>`; });
      }
      return N(`<g ${FS}>${leaves}<path d="M30 98C24 62 44 30 74 8" stroke="#5F6A3A" stroke-width="2"/></g>`, lg('fr', [[0, '#9AA45C'], [1, '#5F6A3A']], 0, 0, 1, 1));
    })(),
  },
  {
    id: 'glass-orb', name: 'Glass orb', group: RO,
    svg: N(`<ellipse cx="52" cy="90" rx="26" ry="5" fill="#25232F" opacity=".18"/><circle cx="50" cy="48" r="38" fill="${u('o')}" stroke="#fff" stroke-opacity=".7" stroke-width="1.4"/>` +
      `<circle cx="50" cy="48" r="38" fill="${u('o2')}"/><path d="M22 36C28 20 42 12 58 13" stroke="#fff" stroke-width="5" opacity=".8"/><ellipse cx="62" cy="78" rx="16" ry="5" fill="#fff" opacity=".35"/>`,
      rg('o', [[0, '#DFF1FF', .85], [.6, '#9FC6F2', .7], [1, '#B79BE8', .75]], .4, .3, .8) + rg('o2', [[.7, '#fff', 0], [1, '#fff', .55]])),
  },
  {
    id: 'glass-drop', name: 'Glass drop', group: RO,
    svg: N(`<ellipse cx="54" cy="92" rx="20" ry="4" fill="#25232F" opacity=".16"/><path d="M50 6 C70 36 84 50 84 64 A34 32 0 0 1 16 64 C16 50 30 36 50 6Z" fill="${u('d')}" stroke="#fff" stroke-opacity=".75" stroke-width="1.4"/>` +
      `<path d="M30 60 C30 50 36 44 42 38" stroke="#fff" stroke-width="5" opacity=".75"/><path d="M30 78C40 88 62 88 72 76" stroke="#fff" stroke-width="2" opacity=".5"/>`,
      lg('d', [[0, '#E4FAF3', .85], [.6, '#8FD9C8', .7], [1, '#4FAE9E', .8]], 0, 0, 1, 1)),
  },
  {
    id: 'glossy-sun', name: 'Glossy sun', group: RO,
    svg: N(`<g ${FS}>` + Array.from({ length: 12 }, (_, i) => `<path d="M50 4 L55 20 H45Z" fill="#FFB547" transform="rotate(${i * 30} 50 50)"/>`).join('') +
      `<circle cx="50" cy="50" r="28" fill="${u('s3')}"/></g><ellipse cx="42" cy="38" rx="14" ry="8" fill="#fff" opacity=".5" transform="rotate(-25 42 38)"/><circle cx="50" cy="50" r="28" stroke="#fff" stroke-opacity=".45" stroke-width="1.2"/>`,
      rg('s3', [[0, '#FFF1A8'], [.55, '#FFC83D'], [1, '#F58A1F']], .4, .35, .75)),
  },
];

const label = (w, h, bg, bd, body, defs = '') => N(`<g ${FS}><rect x="4" y="4" width="${w - 8}" height="${h - 8}" rx="2" fill="${bg}"/></g>` +
  (bd ? `<rect x="8" y="8" width="${w - 16}" height="${h - 16}" stroke="${bd}" stroke-width="1"/>` : '') + body, defs, `0 0 ${w} ${h}`);
const EDIT = [
  { id: 'memory-no1', name: 'Memory No. 01', group: ED,
    svg: label(120, 56, '#F4ECDA', K.ink, tx(60, 22, 'MEMORY', 11, K.ink, 'letter-spacing="4"', SER) + `<path d="M24 28H96" stroke="${K.ink}" stroke-width=".8"/>` + tx(60, 43, 'No. 01', 14, K.oxblood, '', SER, 600).replace('<text', '<text font-style="italic"')) },
  { id: 'souvenir', name: 'Souvenir', group: ED,
    svg: N(`<g ${FS}><rect x="6" y="8" width="108" height="30" rx="15" fill="${K.ink}"/></g>` + tx(60, 28, 'SOUVENIR', 12, '#F4ECDA', 'letter-spacing="4.5"'), '', '0 0 120 46') },
  { id: 'today', name: 'Today', group: ED,
    svg: label(100, 56, '#FFFFFF', null, `<rect x="4" y="4" width="92" height="9" fill="${C.red}"/>` + tx(50, 38, 'TODAY', 20, K.ink, 'letter-spacing="2"', SANS, 800) + tx(50, 49, '&#9733;  &#9733;  &#9733;', 5, C.red, 'letter-spacing="2"')) },
  { id: 'on-repeat', name: 'On repeat', group: ED,
    svg: N(`<g ${FS}><rect x="6" y="6" width="108" height="34" rx="17" fill="#fff" stroke="${K.ink}" stroke-width="1.6"/></g><circle cx="24" cy="23" r="10" fill="${K.ink}"/><path d="M21 18L29 23L21 28Z" fill="#fff"/>` + tx(75, 27, 'ON REPEAT', 10, K.ink, 'letter-spacing="1.5"'), '', '0 0 120 46') },
  { id: 'golden-hour', name: 'Golden hour', group: ED,
    svg: N(`<g ${FS}><rect x="4" y="4" width="112" height="52" rx="3" fill="${u('gh')}"/></g><path d="M40 34a20 20 0 0 1 40 0Z" fill="#FFF3C4" opacity=".9"/>` + Array.from({ length: 7 }, (_, i) => `<path d="M60 34L${f1(60 + Math.cos(Math.PI + i * Math.PI / 6) * 30)} ${f1(34 + Math.sin(Math.PI + i * Math.PI / 6) * 30)}" stroke="#FFF3C4" stroke-width=".8" opacity=".6"/>`).join('') +
      `<path d="M12 34H108" stroke="#fff" stroke-width="1" opacity=".7"/>` + tx(60, 48, 'GOLDEN HOUR', 8.5, '#5A3A0C', 'letter-spacing="3"'), lg('gh', [[0, '#F2B65A'], [1, '#D9783C']]), '0 0 120 60') },
  { id: 'word-remember', name: '"remember this"', group: ED,
    svg: N(hand(60, 28, 'remember this', 19, K.ink, 'transform="rotate(-4 60 28)"') + `<path d="M12 38C40 34 80 36 108 31" stroke="${C.red}" stroke-width="1.8"/>`, '', '0 0 120 46') },
  { id: 'word-wanderlust', name: '"wanderlust"', group: ED,
    svg: N(hand(60, 30, 'wanderlust', 24, K.navy, 'transform="rotate(-3 60 30)"') + `<path d="M20 38C50 43 80 41 100 36" stroke="${K.navy}" stroke-width="1.2" opacity=".7"/>`, '', '0 0 120 48') },
  { id: 'frame-label', name: 'Field notes label', group: ED,
    svg: label(110, 64, '#F7F1E1', K.forest, `<rect x="12" y="12" width="86" height="40" stroke="${K.forest}" stroke-width=".6"/>` + tx(55, 28, 'FIELD NOTES', 7.6, K.forest, 'letter-spacing="1.6"', SER) + `<path d="M30 34H80" stroke="${K.forest}" stroke-width=".7"/>` + tx(55, 46, 'VOL. 3 · SUMMER', 5.4, K.forest, 'letter-spacing="1.6"', MONO)) },
  { id: 'barcode', name: 'Barcode', group: ED,
    svg: label(110, 56, '#FFFFFF', null, (() => { const R = rnd(21); let x = 12, s = ''; while (x < 96) { const w = 1 + Math.floor(R() * 3); s += `<rect x="${x}" y="10" width="${w}" height="28" fill="${K.ink}"/>`; x += w + 1 + Math.floor(R() * 2); } return s; })() + tx(55, 47, '0 427 1906 2025', 5.5, K.ink, 'letter-spacing="1.5"', MONO)) },
  { id: 'date-stamp', name: 'Date stamp', group: ED,
    svg: N(`<g ${FI} stroke="${K.oxblood}"><rect x="6" y="10" width="108" height="34" rx="3" stroke-width="2.4"/>` + tx(60, 35, '14 · 06 · 25', 12.5, K.oxblood, '', MONO) + tx(60, 21, 'RECEIVED', 6.4, K.oxblood, 'letter-spacing="2.4"', MONO) + `</g>`, '', '0 0 120 54') },
  { id: 'price-tag', name: 'Price tag', group: ED,
    svg: N(`<path d="M70 10C54 4 36 8 30 22" stroke="${K.ink}" stroke-width="1.4"/><g ${FS}><path d="M12 36 L30 20 H88 a4 4 0 0 1 4 4 V76 a4 4 0 0 1 -4 4 H30 L12 64Z" fill="${u('pk')}"/></g><circle cx="26" cy="42" r="4.4" fill="#fff" stroke="${K.ink}" stroke-width="1"/>` +
      tx(64, 48, 'PRICELESS', 9, K.ink, 'letter-spacing="1"', SER) + `<path d="M38 56H82" stroke="${K.ink}" stroke-width=".8"/>` + tx(64, 68, 'one of a kind', 6.4, K.ink, '', SER, 500).replace('<text', '<text font-style="italic"'), lg('pk', [[0, '#E9D4AA'], [1, '#D2B781']]), '0 0 100 90') },
  { id: 'index-card', name: 'Index card', group: ED,
    svg: label(120, 76, '#FBF8EF', null, `<path d="M8 22H112" stroke="${K.oxblood}" stroke-width="1.2" opacity=".7"/>` + [32, 42, 52, 62].map((y) => `<path d="M8 ${y}H112" stroke="${K.dust}" stroke-width=".8" opacity=".6"/>`).join('') + hand(24, 18, 'notes', 10, K.ink, 'text-anchor="start"').replace('text-anchor="middle"', '') + `<path d="M18 38C30 34 42 40 54 36S80 36 96 38" stroke="${K.ink}" stroke-width="1.2" opacity=".6"/><path d="M18 48C34 44 50 50 66 46" stroke="${K.ink}" stroke-width="1.2" opacity=".6"/>`) },
  { id: 'notebook-scrap', name: 'Notebook scrap', group: ED,
    svg: N(`<g ${FS} transform="rotate(-3 50 50)"><path d="M12 12H88V84H12Z" fill="#FBFAF4"/></g><g transform="rotate(-3 50 50)">` + Array.from({ length: 6 }, (_, i) => `<circle cx="12" cy="${22 + i * 11}" r="2.6" fill="#E6DFCC"/>`).join('') +
      Array.from({ length: 6 }, (_, i) => `<path d="M12 ${28 + i * 11}H88" stroke="${K.dust}" stroke-width=".8" opacity=".6"/>`).join('') + `<path d="M26 12V84" stroke="${C.red}" stroke-width="1" opacity=".55"/>` + hand(54, 40, 'to do:', 9, K.ink) + `</g>`) },
  { id: 'grid-scrap', name: 'Grid paper scrap', group: ED,
    svg: N(`<g ${FS}><path d="${torn(12, 12, 76, 76, 2.4, 7, 14, 'tr')}" fill="#FAFAF2"/></g><g stroke="${K.dust}" stroke-width=".6" opacity=".6">` + Array.from({ length: 10 }, (_, i) => `<path d="M${18 + i * 7} 12V88M12 ${18 + i * 7}H88"/>`).join('') + `</g><path d="M28 70L44 40L58 60L72 30" stroke="${K.oxblood}" stroke-width="1.6"/><circle cx="72" cy="30" r="2.4" fill="${K.oxblood}"/>`) },
];

// The friendly originals live on as "Little joys"
const JOYS = [
  { id: 'sun', name: 'Sun', group: LJ,
    svg: S(`<g ${o}>` +
      Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2, r1 = 33, r2 = 44 + (i % 2) * 3;
        return `<path d="M${50 + Math.cos(a) * r1} ${50 + Math.sin(a) * r1}L${50 + Math.cos(a) * r2} ${50 + Math.sin(a) * r2}" stroke="${C.coral}" stroke-width="5"/>`;
      }).join('') +
      `<path d="M50 24 C66 23 77 35 76 51 C75 67 63 77 49 76 C34 75 24 64 24 49 C24 35 35 25 50 24Z" fill="${C.yellow}"/>` +
      `<circle cx="41" cy="46" r="2.4" fill="${C.plum}"/><circle cx="58" cy="46" r="2.4" fill="${C.plum}"/>` +
      `<path d="M41 57 C46 62 54 62 59 57"/><circle cx="35" cy="55" r="4" fill="${C.pink}" stroke="none" opacity=".8"/><circle cx="65" cy="55" r="4" fill="${C.pink}" stroke="none" opacity=".8"/></g>`) },
  { id: 'star', name: 'Star', group: LJ,
    svg: S(`<path d="M50 11 L60 36 L88 38 L66 56 L74 84 L50 68 L26 84 L34 56 L12 38 L40 36Z" fill="${C.lime}" ${o}/>` +
      `<path d="M50 25 L55 39" stroke="#fff" stroke-width="3.4" opacity=".8"/>`) },
  { id: 'heart', name: 'Heart', group: LJ,
    svg: S(`<path d="M50 84 C20 62 14 45 22 32 C30 20 46 24 50 36 C54 24 70 20 78 32 C86 45 80 62 50 84Z" fill="${C.pink}" ${o}/>` +
      `<path d="M28 38 C30 33 35 31 39 33" stroke="#fff" stroke-width="3.4" opacity=".75"/>`) },
  { id: 'chai', name: 'Chai cup', group: LJ,
    svg: S(`<g ${o}><path d="M30 20 C26 27 36 31 31 38" stroke="${C.coral}" stroke-width="4"/><path d="M46 17 C42 25 52 29 47 37" stroke="${C.coral}" stroke-width="4"/><path d="M62 20 C58 27 68 31 63 38" stroke="${C.coral}" stroke-width="4"/>` +
      `<path d="M22 46 H72 V62 C72 74 63 80 47 80 C31 80 22 74 22 62Z" fill="${C.turq}"/>` +
      `<path d="M24 50 H70 V56 C70 60 66 62 47 62 C28 62 24 60 24 56Z" fill="${C.apricot}" stroke="none"/>` +
      `<path d="M72 50 C84 49 86 66 70 67" fill="none"/>` +
      `<path d="M14 85 C30 90 66 90 84 85" /></g>` +
      `<path d="M30 70 C34 74 40 75 44 75" stroke="#fff" stroke-width="3.2" opacity=".75"/>`) },
  { id: 'flower', name: 'Flower', group: LJ,
    svg: S(`<g ${o}><path d="M50 56 C50 70 48 80 46 92" fill="none"/><path d="M47 80 C36 76 30 68 31 62 C41 62 47 70 47 80Z" fill="${C.lime}"/>` +
      [0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        return `<circle cx="${50 + Math.cos(a) * 15}" cy="${34 + Math.sin(a) * 15}" r="12" fill="${C.pink}"/>`;
      }).join('') +
      `<circle cx="50" cy="34" r="8.5" fill="${C.yellow}"/></g>`) },
  { id: 'airmail', name: 'Airmail envelope', group: LJ,
    svg: S(`<g ${o}><rect x="12" y="26" width="76" height="50" rx="3" fill="#fff"/>` +
      `<path d="M13 28 L50 55 L87 28" fill="none"/><path d="M13 75 L38 50 M87 75 L62 50" fill="none"/></g>` +
      `<g stroke-width="5">${Array.from({ length: 9 }, (_, i) =>
        `<path d="M${14 + i * 9} 26 L${10 + i * 9} 30" stroke="${i % 2 ? C.blue : C.pink}"/>`).join('')}</g>` +
      `<rect x="68" y="30" width="14" height="14" rx="1.5" fill="${C.yellow}" stroke="${C.plum}" stroke-width="2.4" transform="rotate(5 75 37)"/>`) },
  { id: 'withlove', name: '"With love" label', group: LJ,
    svg: wrap('0 0 120 70',
      `<path d="M10 14 L100 12 L112 35 L100 58 L10 56 Q4 35 10 14Z" fill="${C.pink}" stroke="${C.plum}" stroke-width="3"/>` +
      `<circle cx="100" cy="35" r="3.5" fill="${C.cream}" stroke="${C.plum}" stroke-width="2.4"/>` +
      `<path d="M16 21 L92 19 M16 50 L92 49" stroke="#fff" stroke-width="1.6" stroke-dasharray="3 4" opacity=".8"/>` +
      `<text x="52" y="40" text-anchor="middle" font-family="Playfair Display, Georgia, serif" font-style="italic" font-weight="600" font-size="19" fill="#fff" stroke="none">with love</text>`) },
  { id: 'arrow', name: 'Arrow', group: LJ,
    svg: S(`<path d="M14 68 C30 30 58 28 82 40" stroke="${C.lime}" stroke-width="11" opacity=".95"/>` +
      `<path d="M14 68 C30 30 58 28 82 40" ${o} fill="none"/>` +
      `<path d="M66 24 L84 41 L62 52" ${o} fill="none"/>`) },
];

// ---------- Botanical (fine line art with a light wash) ----------
const G = K.forest;
const leafAlong = (P, n, len, fill, t0 = .12, t1 = .95, w = 5, alt = true) => {
  let s = '';
  for (let i = 0; i < n; i++) {
    const t = t0 + (t1 - t0) * i / (n - 1), p = bez(P, t), sd = alt ? (i % 2 ? 1 : -1) : 1, nx = -p.ty * sd, ny = p.tx * sd;
    const ex = p.x + nx * len + p.tx * len * .5, ey = p.y + ny * len + p.ty * len * .5, mx = (p.x + ex) / 2, my = (p.y + ey) / 2;
    s += `<path d="M${f1(p.x)} ${f1(p.y)}Q${f1(mx - ny * w * .4)} ${f1(my + nx * w * .4)} ${f1(ex)} ${f1(ey)}Q${f1(mx + ny * w * .4)} ${f1(my - nx * w * .4)} ${f1(p.x)} ${f1(p.y)}Z" fill="${fill}"/>`;
  }
  return s;
};
const BOTANICAL = [
  { id: 'leaf-line', name: 'Line-art leaf', group: BO,
    svg: N(`<path d="M50 8 C82 28 84 66 50 92 C16 66 18 28 50 8Z" fill="${K.sage}" fill-opacity=".35" stroke="${G}" stroke-width="1.8"/><path d="M50 8V100M50 34L34 24M50 48L30 38M50 62L32 52M50 34L66 24M50 48L70 38M50 62L68 52" stroke="${G}" stroke-width="1.4"/>`) },
  { id: 'monstera', name: 'Monstera leaf', group: BO,
    svg: (() => {
      const Lh = [[50, 24], [38, 7], [21, 17], [33, 33], [9, 32], [17, 50], [37, 50], [7, 66], [21, 82], [40, 73], [35, 88], [50, 95]];
      const pts = [...Lh, ...Lh.slice(1, -1).reverse().map(([x, y]) => [100 - x, y])];
      const mid = (a, b) => `${f1((a[0] + b[0]) / 2)} ${f1((a[1] + b[1]) / 2)}`;
      const d = `M${mid(pts[pts.length - 1], pts[0])}` + pts.map((p, i) => `Q${p[0]} ${p[1]} ${mid(p, pts[(i + 1) % pts.length])}`).join('') + 'Z';
      return N(`<path d="${d}" fill="${K.sage}" fill-opacity=".45" stroke="${G}" stroke-width="1.8"/><path d="M50 95V26M50 40L36 36M50 40L64 36M50 56L34 52M50 56L66 52M50 70L36 74M50 70L64 74" stroke="${G}" stroke-width="1.3"/>`);
    })() },
  { id: 'wildflower', name: 'Wildflower sprig', group: BO,
    svg: N(`<path d="M46 96C46 70 50 50 56 20" stroke="${G}" stroke-width="1.8"/><path d="M47 78C34 74 28 64 28 56C40 58 46 66 47 78Z M50 60C62 56 68 48 68 40C56 42 50 50 50 60Z" fill="${K.sage}" fill-opacity=".5" stroke="${G}" stroke-width="1.3"/>` +
      [[56, 18, 7], [40, 34, 6], [68, 34, 5.4], [50, 48, 4.4]].map(([x, y, r], i) => `<g transform="translate(${x} ${y})">${[0, 1, 2, 3, 4].map((k) => `<ellipse cy="${-r * .8}" rx="${r * .55}" ry="${r * .85}" fill="${i % 2 ? '#F3D5D6' : '#F7E5B0'}" stroke="${K.terra}" stroke-width="1.2" transform="rotate(${k * 72})"/>`).join('')}<circle r="${r * .3}" fill="${K.mustard}"/></g>`).join('')) },
  { id: 'olive-branch', name: 'Olive branch', group: BO,
    svg: (() => { const P = [[14, 88], [34, 62], [58, 36], [88, 14]]; return N(`<path d="M14 88C34 62 58 36 88 14" stroke="${G}" stroke-width="1.8"/>` + leafAlong(P, 9, 22, `${K.sage}`, .15, .98, 6) + `<g fill="${K.navy}" opacity=".8"><ellipse cx="38" cy="66" rx="3.2" ry="4.4" transform="rotate(30 38 66)"/><ellipse cx="56" cy="48" rx="3" ry="4.2" transform="rotate(30 56 48)"/></g>`).replace(/<path d="M(\d+\.?\d*) (\d+\.?\d*)Q/g, '<path stroke="' + G + '" stroke-width="1.2" d="M$1 $2Q'); })() },
  { id: 'eucalyptus', name: 'Eucalyptus', group: BO,
    svg: N(`<path d="M30 96C30 70 44 44 62 8" stroke="${G}" stroke-width="1.6"/>` + Array.from({ length: 8 }, (_, i) => { const p = bez([[30, 96], [30, 70], [44, 44], [62, 8]], .14 + i * .11), sd = i % 2 ? 1 : -1; return `<circle cx="${f1(p.x + sd * 12)}" cy="${f1(p.y)}" r="${9 - i * .5}" fill="${i % 2 ? K.sage : '#B9C7B8'}" fill-opacity=".7" stroke="${G}" stroke-width="1.2"/><path d="M${f1(p.x)} ${f1(p.y)}H${f1(p.x + sd * 6)}" stroke="${G}" stroke-width="1.2"/>`; }).join('')) },
  { id: 'lavender', name: 'Lavender', group: BO,
    svg: N([[34, 28], [50, 18], [66, 30]].map(([x, y], k) => `<path d="M${x} 96C${x} 70 ${x} 52 ${x} ${y + 8}" stroke="${G}" stroke-width="1.5"/>` + Array.from({ length: 6 }, (_, i) => `<ellipse cx="${x + (i % 2 ? 3 : -3)}" cy="${y + i * 6}" rx="2.6" ry="3.6" fill="${['#9C86C9', '#B3A0DA'][i % 2]}" stroke="#6E5AA0" stroke-width=".8"/>`).join('')).join('') + `<path d="M34 80C42 72 50 84 66 78" stroke="${K.terra}" stroke-width="1.6"/>`) },
];

// ---------- Food & drink ----------
const FOOD = [
  { id: 'coffee-cup', name: 'Coffee cup', group: FD,
    svg: N(`<g ${FS}><ellipse cx="50" cy="72" rx="42" ry="13" fill="${u('sc')}"/><path d="M18 36 C18 66 30 78 50 78 C70 78 82 66 82 36Z" fill="${u('cp')}"/><path d="M80 42 C98 40 98 64 76 66" stroke="#EDE8DE" stroke-width="5"/></g>` +
      `<ellipse cx="50" cy="36" rx="32" ry="9" fill="#F4F0E8"/><ellipse cx="50" cy="36" rx="28" ry="7" fill="#6B3E21"/><path d="M50 33 C44 28 38 34 50 41 C62 34 56 28 50 33Z" fill="#F1DDBF"/>` +
      `<path d="M26 46C26 58 32 66 40 70" stroke="#fff" stroke-width="3" opacity=".8"/>`,
      lg('cp', [[0, '#fff'], [1, '#E3DED2']], 0, 0, 1, 0) + lg('sc', [[0, '#F8F5EE'], [1, '#D8D2C4']])) },
  { id: 'croissant', name: 'Croissant', group: FD,
    svg: N(`<g ${FS}><path d="M8 66 C6 44 22 30 38 30 C46 22 54 22 62 30 C78 30 94 44 92 66 C88 74 80 72 76 62 C70 70 62 70 58 62 C54 72 46 72 42 62 C38 70 30 70 24 62 C20 72 12 74 8 66Z" fill="${u('cr')}"/></g>` +
      `<path d="M38 30C34 44 32 54 34 64M62 30C66 44 68 54 66 64M50 24V62" stroke="#A8661F" stroke-width="1.6" opacity=".7"/><path d="M20 44C24 38 30 34 36 33M80 44C76 38 70 34 64 33" stroke="#fff" stroke-width="2.2" opacity=".5"/>`,
      lg('cr', [[0, '#F1B35B'], [.6, '#D68A33'], [1, '#B96A1E']])) },
  { id: 'mango', name: 'Mango', group: FD,
    svg: N(`<g ${FS}><path d="M52 14 C78 12 92 40 84 64 C76 88 44 96 26 78 C10 60 24 24 52 14Z" fill="${u('mg')}"/></g><path d="M52 14C56 8 64 6 72 8C68 16 60 18 52 14Z" fill="#5F8F3D"/><path d="M52 14L50 8" stroke="#6B4A2A" stroke-width="2"/>` +
      `<path d="M32 40C30 52 34 64 42 72" stroke="#fff" stroke-width="3.4" opacity=".5"/>`,
      rg('mg', [[0, '#FFD65E'], [.5, '#FFA23A'], [1, '#E8553A']], .35, .3, .9)) },
  { id: 'chai-glass', name: 'Chai glass', group: FD,
    svg: N(`<path d="M44 6C40 14 50 18 45 26M58 8C54 16 64 20 59 28" stroke="${K.grey}" stroke-width="1.6" opacity=".7"/><g ${FS}><path d="M26 34 H74 L68 88 Q50 94 32 88Z" fill="${u('gl')}" stroke="#fff" stroke-opacity=".8" stroke-width="1.4"/></g>` +
      `<path d="M28 48H72L68 86Q50 92 32 86Z" fill="${u('tea')}"/><path d="M32 40V76" stroke="#fff" stroke-width="3" opacity=".6"/><ellipse cx="50" cy="48" rx="22" ry="2.6" fill="#F3C98C" opacity=".8"/>` +
      `<path d="M62 30L78 14" stroke="${K.terra}" stroke-width="2"/>`,
      lg('gl', [[0, '#EAF4F6', .8], [1, '#D6E6EA', .55]], 0, 0, 1, 0) + lg('tea', [[0, '#D98F43'], [1, '#A5601E']])) },
  { id: 'lemon-slice', name: 'Lemon slice', group: FD,
    svg: N(`<g ${FS}><circle cx="50" cy="50" r="40" fill="#F3D95A"/></g><circle cx="50" cy="50" r="40" stroke="#E0B92E" stroke-width="3"/><circle cx="50" cy="50" r="34" fill="#FFF3B0"/>` +
      Array.from({ length: 8 }, (_, i) => `<path d="M50 50L${f1(50 + Math.cos(i * Math.PI / 4 + .2) * 32)} ${f1(50 + Math.sin(i * Math.PI / 4 + .2) * 32)}" stroke="#FFF8D2" stroke-width="3"/>`).join('') + `<circle cx="50" cy="50" r="4" fill="#FFF8D2"/><path d="M24 34C30 24 40 18 50 17" stroke="#fff" stroke-width="2.6" opacity=".7"/>`) },
  { id: 'cherries', name: 'Cherries', group: FD,
    svg: N(`<path d="M34 72C36 44 46 24 62 12M70 70C68 46 64 28 62 12" stroke="#4C6B34" stroke-width="2.2"/><path d="M62 12C72 6 84 10 88 18C78 20 68 18 62 12Z" fill="#5F8F3D"/><g ${FS}><circle cx="34" cy="72" r="15" fill="${u('ch')}"/><circle cx="70" cy="72" r="15" fill="${u('ch')}"/></g><ellipse cx="29" cy="66" rx="4" ry="2.4" fill="#fff" opacity=".6"/><ellipse cx="65" cy="66" rx="4" ry="2.4" fill="#fff" opacity=".6"/>`,
      rg('ch', [[0, '#E4465C'], [.6, '#B0192F'], [1, '#6E0F20']], .35, .3, .8)) },
];


// ---------- Festivals (Diwali first) ----------
const MG = '#F29A1F', MG2 = '#D9740F', DI = '#C9622B';
const burst = (cx, cy, n, r1, r2, cols, w = 3) => Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2, rr = r2 - (i % 2) * 7; return `<path d="M${f1(cx + Math.cos(a) * r1)} ${f1(cy + Math.sin(a) * r1)}L${f1(cx + Math.cos(a) * rr)} ${f1(cy + Math.sin(a) * rr)}" stroke="${cols[i % cols.length]}" stroke-width="${w}"/>`; }).join('');
const FEST = [
  { id: 'diya', name: 'Diya', group: FE,
    svg: N(`<path d="M50 14C62 28 66 40 50 52C34 40 38 28 50 14Z" fill="#FFC53D"/><path d="M50 30C56 38 56 44 50 49C44 44 44 38 50 30Z" fill="#F26B2B"/>` +
      `<g ${FS}><path d="M12 56C14 76 30 88 50 88C70 88 86 76 88 56Z" fill="${u('dy')}"/></g><ellipse cx="50" cy="56" rx="38" ry="8" fill="#8A3C16"/><ellipse cx="50" cy="56" rx="32" ry="5" fill="#5A2410"/>` +
      `<path d="M30 70C38 78 62 78 70 70" stroke="#FFD98A" stroke-width="2.4"/><circle cx="34" cy="64" r="2.2" fill="#FFD98A"/><circle cx="50" cy="68" r="2.2" fill="#FFD98A"/><circle cx="66" cy="64" r="2.2" fill="#FFD98A"/>` +
      `<path d="M20 60C21 66 24 70 28 73" stroke="#fff" stroke-width="2.6" opacity=".45"/>`, lg('dy', [[0, '#E88B4B'], [1, '#B04A1B']])) },
  { id: 'rangoli', name: 'Rangoli', group: FE,
    svg: N(`<circle cx="50" cy="50" r="44" fill="#FFF3DC" stroke="${MG2}" stroke-width="2"/>` +
      Array.from({ length: 8 }, (_, i) => `<g transform="rotate(${i * 45} 50 50)"><path d="M50 10C58 22 58 34 50 42C42 34 42 22 50 10Z" fill="${['#E8445B', '#F29A1F', '#3E9E8E', '#7B4FB8'][i % 4]}"/><circle cx="50" cy="8" r="3" fill="${MG}"/></g>`).join('') +
      `<circle cx="50" cy="50" r="15" fill="#FFC53D" stroke="${MG2}" stroke-width="2"/><circle cx="50" cy="50" r="8" fill="#E8445B"/><circle cx="50" cy="50" r="3" fill="#FFF3DC"/>` +
      Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * Math.PI * 2 + .2; return `<circle cx="${f1(50 + Math.cos(a) * 31)}" cy="${f1(50 + Math.sin(a) * 31)}" r="1.8" fill="${MG2}"/>`; }).join('')) },
  { id: 'sparkler', name: 'Sparkler', group: FE,
    svg: N(`<path d="M30 92L58 46" stroke="#5B4636" stroke-width="3.6"/><path d="M58 46L64 36" stroke="#C9C2B8" stroke-width="2.4"/>` +
      burst(66, 30, 14, 5, 28, ['#FFC53D', '#FF7A3D', '#FFE9A8'], 2.6) + `<circle cx="66" cy="30" r="5" fill="#FFF4C2"/>` +
      `<circle cx="24" cy="22" r="2.4" fill="#FFC53D"/><circle cx="90" cy="60" r="2.4" fill="#FF7A3D"/><circle cx="84" cy="10" r="2" fill="#FFE9A8"/>`) },
  { id: 'firework', name: 'Firework', group: FE,
    svg: N(`<circle cx="50" cy="48" r="4" fill="#fff"/>` + burst(50, 48, 18, 8, 40, ['#E8445B', '#FFC53D', '#3E9E8E', '#7B4FB8'], 3.2) +
      [[14, 14], [86, 18], [20, 82], [82, 80], [50, 94]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="3" fill="${['#FFC53D', '#E8445B', '#3E9E8E', '#FF7A3D', '#7B4FB8'][i]}"/>`).join('')) },
  { id: 'kandil', name: 'Akash kandil', group: FE,
    svg: (() => { const pts = Array.from({ length: 16 }, (_, i) => { const a = -Math.PI / 2 + (i / 16) * Math.PI * 2, r = i % 2 ? 22 : 38; return `${f1(50 + Math.cos(a) * r)},${f1(46 + Math.sin(a) * r)}`; }).join(' ');
      return N(`<path d="M50 2V10" stroke="${K.ink}" stroke-width="2.4"/><g ${FS}><polygon points="${pts}" fill="${u('kd')}" stroke="#B23A4B" stroke-width="2"/></g><circle cx="50" cy="46" r="11" fill="#FFF0B0"/><circle cx="50" cy="46" r="6" fill="#FFC53D"/>` +
        `<path d="M50 84V94M44 84L40 94M56 84L60 94" stroke="${MG}" stroke-width="3"/><circle cx="50" cy="96" r="2.6" fill="${MG}"/><circle cx="40" cy="96" r="2.2" fill="${MG}"/><circle cx="60" cy="96" r="2.2" fill="${MG}"/>`, lg('kd', [[0, '#F0627A'], [1, '#C2354F']])); })() },
  { id: 'marigold-toran', name: 'Marigold garland', group: FE,
    svg: N(`<path d="M8 28C30 54 70 54 92 28" stroke="#4C7A3A" stroke-width="2.4"/>` +
      [[14, 33], [26, 43], [38, 49], [50, 51], [62, 49], [74, 43], [86, 33]].map(([x, y], i) => `<g transform="translate(${x} ${y})"><circle r="9" fill="${i % 2 ? MG : '#FFB02E'}" stroke="${MG2}" stroke-width="1.6"/><circle r="5.5" fill="${i % 2 ? '#FFC53D' : MG2}" opacity=".85"/><circle r="2" fill="#7A3A0A"/></g><path d="M${x} ${y + 9}C${x - 3} ${y + 16} ${x - 5} ${y + 20} ${x - 4} ${y + 25}C${x + 2} ${y + 22} ${x + 3} ${y + 17} ${x} ${y + 9}Z" fill="#5F8F3D"/>`).join('')) },
  { id: 'ladoo', name: 'Mithai plate', group: FE,
    svg: N(`<g ${FS}><ellipse cx="50" cy="74" rx="44" ry="14" fill="#F4ECDA" stroke="${K.brass}" stroke-width="2.4"/></g>` +
      [[34, 58], [66, 58], [50, 44]].map(([x, y], i) => `<g ${FS}><circle cx="${x}" cy="${y}" r="15" fill="${u('ld')}"/></g>` + Array.from({ length: 9 }, (_, k) => `<circle cx="${f1(x + Math.cos(k * 2.1 + i) * 8)}" cy="${f1(y + Math.sin(k * 1.7 + i) * 8)}" r="1.1" fill="#B06B12" opacity=".7"/>`).join('')).join('') +
      `<path d="M44 38C50 34 56 34 60 38" stroke="#fff" stroke-width="2.4" opacity=".5"/>`, rg('ld', [[0, '#FFC95A'], [1, '#E8921F']], .35, .3, .9)) },
  { id: 'happy-diwali', name: 'Happy Diwali', group: FE,
    svg: N(`<g ${FS}><rect x="4" y="6" width="112" height="46" rx="10" fill="#7B1F3A"/></g><rect x="9" y="11" width="102" height="36" rx="7" stroke="#FFC53D" stroke-width="1.4" stroke-dasharray="3 3"/>` +
      hand(60, 25, 'Happy', 13, '#FFE9A8', 'transform="rotate(-3 60 25)"') + tx(60, 42, 'DIWALI', 14, '#FFC53D', 'letter-spacing="3"', SER, 700) +
      `<circle cx="16" cy="29" r="3" fill="#FFC53D"/><circle cx="104" cy="29" r="3" fill="#FFC53D"/>`, '', '0 0 120 58') },
  { id: 'shubh-deepavali', name: 'Shubh Deepavali', group: FE,
    svg: N(`<g ${FS}><rect x="4" y="6" width="112" height="46" rx="4" fill="#FFF3DC"/></g><path d="M10 14H110M10 44H110" stroke="${MG2}" stroke-width="1.2"/>` +
      Array.from({ length: 9 }, (_, i) => `<path d="M${12 + i * 12} 14l4 -5l4 5Z M${12 + i * 12} 44l4 5l4 -5Z" fill="${i % 2 ? '#E8445B' : MG}"/>`).join('') +
      hand(60, 32, 'Shubh Deepavali', 13.5, '#7B1F3A', 'transform="rotate(-2 60 32)"'), '', '0 0 120 58') },
  { id: 'diya-row', name: 'Row of diyas', group: FE,
    svg: N([17, 50, 83].map((x, i) => `<path d="M${x} ${28 - (i % 2) * 2}C${x + 7} ${38 - (i % 2) * 2} ${x + 8} ${44} ${x} ${50}C${x - 8} ${44} ${x - 7} ${38 - (i % 2) * 2} ${x} ${28 - (i % 2) * 2}Z" fill="#FFC53D"/><path d="M${x} 38C${x + 3} 42 ${x + 3} 46 ${x} 49C${x - 3} 46 ${x - 3} 42 ${x} 38Z" fill="#F26B2B"/><g ${FS}><path d="M${x - 15} 54C${x - 14} 66 ${x - 6} 74 ${x} 74C${x + 6} 74 ${x + 14} 66 ${x + 15} 54Z" fill="${DI}"/></g><ellipse cx="${x}" cy="54" rx="15" ry="4" fill="#5A2410"/>`).join('') +
      `<path d="M2 80H98" stroke="${K.brass}" stroke-width="2.2" opacity=".6"/>`, '', '0 0 100 90') },
];

const STICKERS = [...FEST, ...VINTAGE, ...REAL, ...EDIT, ...JOYS, ...BOTANICAL, ...FOOD];

// ---------- Doodles ----------
const D = (body) => wrap('0 0 120 70', body);
const pen = (col, w = 3) => `stroke="${col}" stroke-width="${w}"`;
const starPath = (cx, cy, R, seed) => { const r = rnd(seed), p = []; for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i * 2) * 2 * Math.PI / 5; p.push(`${f1(cx + Math.cos(a) * R + (r() - .5) * 3)} ${f1(cy + Math.sin(a) * R + (r() - .5) * 3)}`); } return 'M' + p.join('L'); };
const DOODLES = [
  {
    id: 'squiggle', name: 'Squiggle',
    svg: D(`<path d="M8 38 C16 16 24 16 30 36 C36 56 44 56 50 34 C56 14 64 14 70 36 C76 56 84 56 90 34 C96 18 104 20 112 32" stroke="${C.blue}" stroke-width="4.6"/>`),
  },
  {
    id: 'loop', name: 'Loop-de-loop',
    svg: D(`<path d="M6 50 C22 50 30 36 40 24 C52 10 66 22 56 36 C46 50 30 40 40 28 C50 16 70 30 84 44 C94 52 104 50 114 44" stroke="${C.coral}" stroke-width="4"/>`),
  },
  {
    id: 'sparkles', name: 'Sparkles',
    svg: D(`<g fill="${C.yellow}" stroke="${C.plum}" stroke-width="2.6">` +
      `<path d="M30 8 C32 24 36 28 52 30 C36 32 32 36 30 52 C28 36 24 32 8 30 C24 28 28 24 30 8Z"/>` +
      `<path d="M86 26 C87 36 90 39 100 40 C90 41 87 44 86 54 C85 44 82 41 72 40 C82 39 85 36 86 26Z" fill="${C.pink}"/></g>` +
      `<circle cx="108" cy="12" r="3.6" fill="${C.turq}"/><circle cx="60" cy="58" r="2.8" fill="${C.coral}"/><circle cx="14" cy="60" r="2.6" fill="${C.blue}"/>`),
  },
  {
    id: 'swirl', name: 'Swirl',
    svg: D(`<path d="M60 38 C60 30 70 30 70 38 C70 48 54 48 54 36 C54 22 76 20 80 36 C84 54 56 62 44 48 C32 34 44 12 66 12 C90 12 108 34 110 52" stroke="${C.turq}" stroke-width="4.6"/>`),
  },
  { id: 'd-arrow-curve', name: 'Curved arrow', svg: D(`<g ${pen(K.ink)}><path d="M10 54C28 14 70 8 100 34"/><path d="M86 22L102 35L82 42"/></g>`) },
  { id: 'd-arrow-loop', name: 'Looping arrow', svg: D(`<g ${pen(K.oxblood)}><path d="M8 52C30 54 46 40 38 28C32 18 22 30 34 40C52 56 86 42 106 22"/><path d="M92 20L107 21L102 36"/></g>`) },
  { id: 'd-arrow-straight', name: 'Quick arrow', svg: D(`<g ${pen(K.navy)}><path d="M10 40C40 34 70 38 104 35"/><path d="M90 24L106 35L90 47"/></g>`) },
  { id: 'd-underline', name: 'Double underline', svg: D(`<g ${pen(K.ink, 3.2)}><path d="M8 28C40 22 80 26 112 20"/><path d="M16 42C46 37 76 40 100 35"/></g>`) },
  { id: 'd-underline-wave', name: 'Wavy underline', svg: D(`<path d="M6 36C14 22 22 22 28 36S42 50 50 36S64 22 72 36S86 50 94 36S106 26 114 34" ${pen(C.coral, 3.2)}/>`) },
  { id: 'd-circle', name: 'Hand-drawn circle', svg: D(`<path d="M64 8C100 5 117 30 101 53C85 68 28 68 14 44C3 22 36 7 72 10C86 12 96 18 100 25" ${pen(K.oxblood, 2.8)}/>`) },
  { id: 'd-star', name: 'Scribbled star', svg: D(`<path d="${starPath(36, 36, 28, 4)}" ${pen(K.mustard, 3)}/><path d="${starPath(92, 28, 15, 9)}" ${pen(K.navy, 2.6)}/>`) },
  { id: 'd-burst', name: 'Asterisk burst', svg: D(`<g ${pen(C.red, 3.2)}>${Array.from({ length: 9 }, (_, i) => { const a = i / 9 * Math.PI * 2, l = i % 2 ? 20 : 27; return `<path d="M${f1(60 + Math.cos(a) * 9)} ${f1(35 + Math.sin(a) * 9)}L${f1(60 + Math.cos(a) * l)} ${f1(35 + Math.sin(a) * l)}"/>`; }).join('')}</g>`) },
  { id: 'd-heart', name: 'Drawn heart', svg: D(`<path d="M60 60C28 40 24 22 36 14C46 8 56 16 60 26C64 16 76 8 86 14C98 22 92 40 60 60Z" ${pen(C.red, 3)}/><path d="M64 28C70 20 80 22 82 28" ${pen(C.red, 1.6)} opacity=".6"/>`) },
  { id: 'd-crosses', name: 'Little crosses', svg: D(`<g ${pen(K.ink, 2.8)}><path d="M14 18l12 12m0-12L14 30M54 40l14 12m0-13L54 52M92 12l12 11m0-12L92 23M30 50v10m-5-5h10M96 48v10m-5-5h10"/></g>`) },
  { id: 'd-wavy', name: 'Wavy lines', svg: D(`<g ${pen(K.dust, 3)}><path d="M6 24C16 14 24 34 34 24S52 14 62 24S80 34 90 24S106 16 114 22"/><path d="M6 46C16 36 24 56 34 46S52 36 62 46S80 56 90 46S106 38 114 44"/></g>`) },
  { id: 'd-brackets', name: 'Curly brackets', svg: D(`<g ${pen(K.ink, 2.8)}><path d="M36 8C26 8 24 12 24 20V28C24 33 20 35 14 35C20 35 24 37 24 42V50C24 58 26 62 36 62M84 8C94 8 96 12 96 20V28C96 33 100 35 106 35C100 35 96 37 96 42V50C96 58 94 62 84 62"/></g>`) },
  { id: 'd-plant', name: 'Tiny plant', svg: D(`<g ${pen(G, 2.6)}><path d="M60 40C60 30 60 24 60 16M60 32C50 30 44 22 46 14C54 16 60 22 60 32ZM60 26C70 24 76 16 74 8C66 10 60 16 60 26Z"/></g><g ${pen(K.terra, 2.6)}><path d="M44 42H76L72 62H48Z"/><path d="M42 42H78"/></g>`) },
  { id: 'd-sunrays', name: 'Sun rays', svg: D(`<g ${pen(K.mustard, 3)}><path d="M36 54a24 24 0 0 1 48 0"/>${Array.from({ length: 7 }, (_, i) => { const a = Math.PI + (i + .5) * Math.PI / 7; return `<path d="M${f1(60 + Math.cos(a) * 32)} ${f1(54 + Math.sin(a) * 32)}L${f1(60 + Math.cos(a) * 44)} ${f1(54 + Math.sin(a) * 44)}"/>`; }).join('')}<path d="M14 58H106"/></g>`) },
  { id: 'd-highlight', name: 'Marker highlight', svg: D(`<path d="M10 22C40 14 80 14 110 20M110 20C80 28 40 30 12 32M12 32C44 40 84 38 108 44M108 44C84 52 44 54 14 52" stroke="#FFD93D" stroke-width="12" opacity=".5" style="mix-blend-mode:multiply"/>`) },
  { id: 'd-corners', name: 'Frame corners', svg: D(`<g ${pen(K.ink, 2.6)}><path d="M6 24C6 12 8 8 22 7"/><path d="M114 24C115 12 112 8 98 7"/><path d="M6 46C5 58 9 62 22 63"/><path d="M114 46C115 58 111 62 98 63"/></g>`) },
  { id: 'd-check', name: 'Tick mark', svg: D(`<path d="M24 36C34 42 40 50 46 58C60 34 82 18 100 10" ${pen(C.turq, 4)}/>`) },
];

// ---------- Paper scraps & textures ----------
const PW = (body, defs = '') => N(body, defs);
const sheet = (d, fill, extra = '', grain = .35) => `<g ${FS}><path d="${d}" fill="${fill}"/></g><path d="${d}" fill="#000" ${FG} opacity="${grain}"/>${extra}`;
const PAPER = [
  { id: 'paper-kraft', name: 'Kraft paper',
    svg: PW(sheet(torn(10, 10, 80, 80, 2, 8, 2), '#C9A472', Array.from({ length: 40 }, (_, i) => { const r = rnd(i + 3); return `<path d="M${f1(14 + r() * 70)} ${f1(14 + r() * 70)}l${f1(2 + r() * 6)} ${f1(r() * 2)}" stroke="#8A6236" stroke-width=".7" opacity=".4"/>`; }).join(''), .5)) },
  { id: 'paper-lined', name: 'Lined paper',
    svg: PW(sheet(torn(10, 10, 80, 80, 1.2, 8, 5, 'b'), '#FBF9F1', Array.from({ length: 8 }, (_, i) => `<path d="M10 ${28 + i * 8.5}H90" stroke="${K.dust}" stroke-width=".8" opacity=".65"/>`).join('') + `<path d="M24 10V90" stroke="${C.red}" stroke-width=".9" opacity=".5"/>`, .2)) },
  { id: 'paper-grid', name: 'Grid paper',
    svg: PW(sheet(torn(10, 10, 80, 80, 1, 8, 6, 'r'), '#FAFAF3', Array.from({ length: 11 }, (_, i) => `<path d="M${10 + i * 8} 10V90M10 ${10 + i * 8}H90" stroke="${K.sage}" stroke-width=".7" opacity=".8"/>`).join(''), .15)) },
  { id: 'paper-graph', name: 'Graph paper',
    svg: PW(sheet(torn(10, 10, 80, 80, 1, 8, 8, 'l'), '#F4F8F6', Array.from({ length: 41 }, (_, i) => `<path d="M${10 + i * 2} 10V90M10 ${10 + i * 2}H90" stroke="#4E8CB0" stroke-width="${i % 5 ? .22 : .6}" opacity="${i % 5 ? .5 : .75}"/>`).join(''), .12)) },
  { id: 'paper-tissue', name: 'Tissue paper',
    svg: PW(`<g ${FS}><path d="${torn(10, 10, 80, 80, 2.5, 6, 12)}" fill="#F7CFD3" opacity=".82"/></g><g stroke="#fff" stroke-width="1" opacity=".5"><path d="M16 26C32 30 40 22 56 28S76 36 86 30M14 50C30 46 44 56 60 50S78 44 88 52M18 74C34 70 46 80 62 74"/></g><g stroke="#C98C94" stroke-width=".8" opacity=".35"><path d="M20 38C34 40 44 34 58 40M30 62C44 58 58 66 80 62"/></g>`) },
  { id: 'paper-torn', name: 'Torn-edge cream',
    svg: PW(sheet(torn(10, 14, 80, 72, 3.4, 5, 15, 'tb'), '#F7F0DE', `<path d="M10 52H90" stroke="#D9CBA8" stroke-width=".8" opacity=".7"/>`, .3)) },
  { id: 'paper-parcel', name: 'Parcel paper',
    svg: PW(sheet(torn(10, 10, 80, 80, 1.6, 8, 17), '#AC7C4B', `<path d="M10 52H90M50 10V90" stroke="#E9DAB6" stroke-width="1.6" stroke-dasharray="1.4 1.6"/><circle cx="50" cy="52" r="3" fill="#E9DAB6"/>` +
      `<g ${FI} stroke="#7A1E26" opacity=".8" transform="rotate(-8 70 28)"><rect x="56" y="18" width="30" height="18" stroke-width="1.2"/>${tx(71, 30, 'AIR MAIL', 5.2, '#7A1E26', '', MONO)}</g><path d="M18 70H44M18 76H38M18 82H46" stroke="#3A2A1A" stroke-width="1.2" opacity=".5"/>`, .45)) },
  { id: 'paper-news', name: 'Vintage newsprint',
    svg: PW(sheet(torn(10, 10, 80, 80, 1.8, 7, 19), '#E6DFCB', `<rect x="18" y="16" width="64" height="5" fill="#3A3730" opacity=".75"/><path d="M18 26H82" stroke="#3A3730" stroke-width=".8"/>` +
      [0, 1, 2].map((c) => `<g fill="#3A3730" opacity=".5">${Array.from({ length: 9 }, (_, i) => `<rect x="${18 + c * 22}" y="${31 + i * 6}" width="${17 - ((i * 7 + c * 5) % 5)}" height="2"/>`).join('')}</g>`).join('') + `<rect x="18" y="84" width="64" height="0" /><path d="M40 28V82M62 28V82" stroke="#3A3730" stroke-width=".4" opacity=".4"/>`, .4)) },
  { id: 'paper-dots', name: 'Dot-grid paper',
    svg: PW(sheet(torn(10, 10, 80, 80, 1.2, 8, 23, 'b'), '#FBF7EA', Array.from({ length: 100 }, (_, i) => `<circle cx="${16 + (i % 10) * 7.6}" cy="${16 + Math.floor(i / 10) * 7.6}" r=".8" fill="${K.grey}" opacity=".7"/>`).join(''), .2)) },
  { id: 'paper-vellum', name: 'Vellum',
    svg: PW(`<g ${FS}><path d="${torn(10, 10, 80, 80, 1.2, 8, 25)}" fill="#fff" fill-opacity=".55" stroke="#fff" stroke-opacity=".8" stroke-width="1"/></g><path d="M14 20C30 14 60 22 86 16M14 80C40 86 62 76 86 84" stroke="#B9B2A0" stroke-width=".8" opacity=".5"/>` ) },
];

const ALL = { tape: TAPE, stickers: STICKERS, paper: PAPER, doodles: DOODLES };
export const TRAYS = ALL;
// default width of an item, as a percentage of the page width
export const DEFAULT_WIDTH = { tape: 36, stickers: 21, paper: 40, doodles: 30 };

export function findArt(kind, id) {
  return (ALL[kind] || []).find((a) => a.id === id);
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
export function postmarkSvg() {
  // the quiet ink postmark from the redesign: a ring that says LITTLE TALES, a tiny flower, and four wavy cancellation lines
  return uniq(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" aria-hidden="true">` +
    `<defs><path id="__ID__r" d="M55 60m-33 0a33 33 0 1 1 66 0a33 33 0 1 1 -66 0"/></defs>` +
    `<circle cx="55" cy="60" r="44" fill="none" stroke="#3E4C5E" stroke-width="2.2"/>` +
    `<circle cx="55" cy="60" r="25" fill="none" stroke="#3E4C5E" stroke-width="1.4"/>` +
    `<text font-family="DM Mono, monospace" font-size="9.5" letter-spacing="2.2" fill="#3E4C5E"><textPath href="#__ID__r">LITTLE TALES \u00b7 LITTLE TALES \u00b7</textPath></text>` +
    `<path d="M55 50c4 4 4 10 0 18-4-8-4-14 0-18zM45 62c5-1 8 1 10 6-5 1-8-1-10-6zM65 62c-5-1-8 1-10 6 5 1 8-1 10-6z" fill="#3E4C5E"/>` +
    `<g fill="none" stroke="#3E4C5E" stroke-width="2.2" stroke-linecap="round">` +
    `<path d="M104 38q12-7 24 0t24 0 24 0 24 0"/><path d="M104 54q12-7 24 0t24 0 24 0 24 0"/><path d="M104 70q12-7 24 0t24 0 24 0 24 0"/><path d="M104 86q12-7 24 0t24 0 24 0 24 0"/></g>` +
    `</svg>`);
}

export const LOGO = `<svg viewBox="0 0 40 46" xmlns="http://www.w3.org/2000/svg" fill="none"><rect x="3" y="3" width="34" height="40" rx="2" fill="${C.pink}" stroke="${C.plum}" stroke-width="2"/><rect x="9" y="9" width="22" height="25" fill="${C.cream}" stroke="${C.plum}" stroke-width="1.6"/><path d="M9 29 L17 21 L23 27 L27 23 L31 28 V34 H9Z" fill="${C.lime}"/><circle cx="25" cy="15" r="3" fill="${C.coral}"/></svg>`;
