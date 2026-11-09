// Seasonal looks: the background drawings change with the time of year, by themselves.
// festive (the 18 days up to Diwali), winter (after Diwali to February), spring (March to May),
// monsoon (June to September), autumn (October until the festive weeks). For a preview, set localStorage 'lt-season'.

// Diwali (Lakshmi Puja) dates. Add a line each year.
const DIWALI = { 2026: '2026-11-08', 2027: '2027-10-29', 2028: '2028-10-17', 2029: '2029-11-05', 2030: '2030-10-26', 2031: '2031-11-14', 2032: '2032-11-02' };
const SEASONS = ['festive', 'winter', 'spring', 'monsoon', 'autumn'];

export function seasonFor(d = new Date()) {
  const y = d.getFullYear(), m = d.getMonth() + 1;
  const iso = `${y}-${String(m).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const dw = DIWALI[y];
  if (dw) {
    const day = 864e5, diw = new Date(dw + 'T12:00:00');
    const from = new Date(diw - 18 * day).toISOString().slice(0, 10), to = dw;   // ends on Diwali day
    if (iso >= from && iso <= to) return 'festive';
    if (iso > to && m <= 12 && m >= 10) return 'winter';
  }
  if (m === 12 || m <= 2) return 'winter';
  if (m <= 5) return 'spring';
  if (m <= 9) return 'monsoon';
  return m === 11 ? 'winter' : 'autumn';
}
export function season() {
  try { const s = localStorage.getItem('lt-season'); if (SEASONS.includes(s)) return s; } catch {}
  return seasonFor();
}

const A = (cls, style, body, vb) => `<svg class="ss ${cls}" viewBox="${vb}" style="${style}" aria-hidden="true">${body}</svg>`;
const flake = (c = '#A9C6E2') => `<g stroke="${c}" stroke-width="2.2" stroke-linecap="round" fill="none"><path d="M20 4v32M6 12l28 16M6 28l28-16"/><path d="M20 4l-3 4m3-4l3 4M20 36l-3-4m3 4l3-4M6 12l4 1m-4-1l1 4M34 28l-4-1m4 1l-1-4M6 28l1-4m-1 4l4-1M34 12l-1 4m1-4l-4 1"/></g>`;
const blossom = (c = '#F3B4C2', d = '#E07A93') => `<g fill="${c}" stroke="${d}" stroke-width=".8"><circle cx="20" cy="11" r="7"/><circle cx="29" cy="18" r="7"/><circle cx="25" cy="29" r="7"/><circle cx="15" cy="29" r="7"/><circle cx="11" cy="18" r="7"/></g><circle cx="20" cy="21" r="3.6" fill="#F6E3A1"/>`;
const leaf = (c = '#E39A4E') => `<path d="M6 34C6 16 18 6 36 6c0 18-10 30-30 28z" fill="${c}"/><path d="M6 34L28 12" stroke="#B5682A" stroke-width="1.6" fill="none"/>`;
const marigold = (x, y, r, c) => `<g transform="translate(${x} ${y})"><circle r="${r}" fill="${c}"/><circle r="${r * .62}" fill="${c === '#F29A2E' ? '#F6B444' : '#F6C445'}"/><circle r="${r * .28}" fill="#C9661C"/></g>`;

// Falling bits drift down behind the screen (snow, petals, rain, leaves). Few, slow and soft, so they never get in the way.
function fall(kind, n) {
  const shapes = {
    winter: () => `<svg viewBox="0 0 40 40">${flake('#B7CFE6')}</svg>`,
    spring: () => `<svg viewBox="0 0 40 40">${blossom('#F7C6D1', '#EBA0B3')}</svg>`,
    monsoon: () => '<i class="drop"></i>',
    autumn: (i) => `<svg viewBox="0 0 40 40">${leaf(['#E39A4E', '#D9744A', '#E8B04C'][i % 3])}</svg>`,
    festive: () => '<svg viewBox="0 0 40 40"><path d="M20 0C21 12 28 19 40 20 28 21 21 28 20 40 19 28 12 21 0 20 12 19 19 12 20 0z" fill="#F2C94C"/></svg>',
  };
  let out = '';
  for (let i = 0; i < n; i++) {
    const left = (i * 97 + 13) % 100, delay = -((i * 3.7) % 14), dur = kind === 'monsoon' ? 1.6 + (i % 4) * .35 : 11 + (i % 5) * 2.2, size = kind === 'monsoon' ? 1 : .7 + (i % 3) * .25;
    out += `<span class="sf sf-${kind}" style="left:${left}%;animation-delay:${delay}s;animation-duration:${dur}s;--s:${size}">${shapes[kind](i)}</span>`;
  }
  return out;
}

const DECOR = {
  winter: [
    A('', 'left:8px;top:14px;width:30px', flake(), '0 0 40 40'),
    A('', 'left:52px;top:46px;width:16px', flake('#C9DAEC'), '0 0 40 40'),
    A('', 'right:20px;top:12px;width:42px', '<circle cx="24" cy="24" r="14" fill="#FBF6E6" stroke="#E7D7A6" stroke-width="2"/><circle cx="19" cy="20" r="2.4" fill="#EADFC0"/><circle cx="28" cy="28" r="3.2" fill="#EADFC0"/>', '0 0 48 48'),
    // a pine sprig with red berries, low on the left
    A('ss-low', 'left:-6px;bottom:150px;width:74px;transform:rotate(-12deg)', '<path d="M8 70L66 10" stroke="#6E5A44" stroke-width="2.6" stroke-linecap="round"/><g stroke="#4E7A57" stroke-width="2.2" stroke-linecap="round">' + Array.from({ length: 9 }, (_, i) => { const x = 12 + i * 6, y = 66 - i * 6.2; return `<path d="M${x} ${y}l-9-3M${x} ${y}l3-9"/>`; }).join('') + '</g><circle cx="40" cy="44" r="4" fill="#D2483F"/><circle cx="46" cy="40" r="3.4" fill="#E0574C"/><circle cx="43" cy="49" r="3" fill="#C23C35"/>', '0 0 76 76'),
    // a warm mug of chai, steaming, low on the right
    A('ss-low', 'right:-2px;bottom:430px;width:34px', '<path d="M18 4c-4 5 4 7 0 12M26 2c-4 5 4 7 0 12" stroke="#C9B994" stroke-width="2" fill="none" stroke-linecap="round" class="steam"/><rect x="8" y="20" width="28" height="24" rx="6" fill="#E9A28F"/><path d="M36 26h4a6 6 0 0 1 0 12h-4" stroke="#E9A28F" stroke-width="4" fill="none"/><path d="M8 28h28" stroke="#F6E3A1" stroke-width="3"/>', '0 0 48 48'),
  ],
  spring: [
    // a blossom branch reaching in from the top right
    A('', 'right:-6px;top:4px;width:120px', '<path d="M118 6C90 14 64 26 30 52M72 30c4-10 2-18-4-24M50 40c-8-2-14 2-18 10" stroke="#8A6A52" stroke-width="2.6" fill="none" stroke-linecap="round"/><g transform="translate(18 40) scale(.62)">' + blossom() + '</g><g transform="translate(56 18) scale(.5)">' + blossom() + '</g><g transform="translate(84 4) scale(.44)">' + blossom('#FAD2DA') + '</g><g transform="translate(40 48) scale(.36)">' + blossom('#FAD2DA') + '</g>', '0 0 120 70'),
    // a butterfly
    A('ss-flutter', 'left:118px;top:4px;width:26px', '<g stroke="#7A6A9E" stroke-width="1.2"><path d="M20 20C10 4 2 8 4 16s10 6 16 4z" fill="#C8B6E8"/><path d="M20 20C30 4 38 8 36 16s-10 6-16 4z" fill="#C8B6E8"/><path d="M20 20c-8 4-12 12-6 14s6-6 6-14zM20 20c8 4 12 12 6 14s-6-6-6-14z" fill="#E6D8F5"/></g><path d="M20 12v18" stroke="#5A4A7A" stroke-width="2" stroke-linecap="round"/>', '0 0 40 40'),
  ],
  monsoon: [
    A('', 'right:14px;top:16px;width:70px', '<path d="M16 36h34a12 12 0 0 0 0-24 16 16 0 0 0-30-4A13 13 0 0 0 16 36z" fill="#C9D5E2" stroke="#93A9C2" stroke-width="1.6"/><g stroke="#7FA6CF" stroke-width="2.4" stroke-linecap="round"><path d="M22 42l-3 7M34 42l-3 7M46 42l-3 7"/></g>', '0 0 70 52'),
    // a coral umbrella, low on the left
    A('ss-low ss-sway', 'left:4px;bottom:170px;width:62px', '<path d="M6 30a26 22 0 0 1 52 0c-4-4-9-4-13 0-4-4-9-4-13 0-4-4-9-4-13 0-4-4-9-4-13 0z" fill="#E9806E" stroke="#C85F4E" stroke-width="1.5"/><path d="M32 8v2M32 30v22a5 5 0 0 1-10 0" stroke="#5B4636" stroke-width="2.6" fill="none" stroke-linecap="round"/>', '0 0 64 60'),
    // a paper boat, low on the right
    A('ss-low ss-bob', 'right:-4px;bottom:430px;width:44px', '<path d="M4 26h48l-8 12H12z" fill="#F4EEE2" stroke="#BDAE92" stroke-width="1.4"/><path d="M14 26l12-18 6 18" fill="#FBF8F2" stroke="#BDAE92" stroke-width="1.4"/><path d="M0 42c6-3 10 3 16 0s10 3 16 0 10 3 16 0 6 2 8 0" stroke="#8FB3D6" stroke-width="2" fill="none" stroke-linecap="round"/>', '0 0 56 46'),
  ],
  autumn: [
    A('', 'left:10px;top:18px;width:26px;transform:rotate(-20deg)', leaf(), '0 0 40 40'),
    A('', 'left:46px;top:44px;width:18px;transform:rotate(30deg)', leaf('#D9744A'), '0 0 40 40'),
    A('ss-low', 'right:2px;bottom:430px;width:24px;transform:rotate(15deg)', leaf('#E8B04C'), '0 0 40 40'),
  ],
  festive: [
    // a marigold garland (toran) across the top
    A('ss-toran', 'left:0;top:0;width:100%;height:58px', '<path d="M0 8C80 30 160 30 240 8S400-14 480 8" stroke="#6E8F4E" stroke-width="1.6" fill="none"/>' + Array.from({ length: 13 }, (_, i) => { const x = 10 + i * 36, y = 8 + Math.sin((i / 12) * Math.PI * 2) * -10 + 14 * Math.sin((i / 12) * Math.PI); return marigold(x, Math.max(8, y), 7, i % 2 ? '#F6C445' : '#F29A2E') + (i % 3 === 1 ? `<path d="M${x} ${y + 6}v14" stroke="#6E8F4E" stroke-width="1.4"/>${marigold(x, y + 24, 5, '#F29A2E')}` : ''); }).join(''), '0 0 480 58'),
    // two little diyas, low on each side
    A('ss-low', 'left:10px;bottom:164px;width:52px', '<ellipse class="flame" cx="26" cy="14" rx="5" ry="10" fill="#F6B73C"/><ellipse cx="26" cy="17" rx="2.4" ry="5" fill="#FFF1C1"/><path d="M4 28c4 12 40 12 44 0z" fill="#C8662E"/><path d="M4 28h44" stroke="#9E4A20" stroke-width="2.4" stroke-linecap="round"/><path d="M12 33h28" stroke="#F2C94C" stroke-width="1.6" stroke-dasharray="2 3"/>', '0 0 52 44'),
    A('ss-low', 'right:-2px;bottom:430px;width:36px', '<ellipse class="flame f2" cx="26" cy="14" rx="5" ry="10" fill="#F6B73C"/><ellipse cx="26" cy="17" rx="2.4" ry="5" fill="#FFF1C1"/><path d="M4 28c4 12 40 12 44 0z" fill="#C8662E"/><path d="M4 28h44" stroke="#9E4A20" stroke-width="2.4" stroke-linecap="round"/>', '0 0 52 44'),
  ],
};

export function seasonHTML(s = season()) {
  return `<div class="season season-${s}" aria-hidden="true">${(DECOR[s] || []).join('')}${fall(s, s === 'monsoon' ? 16 : 10)}</div>`;
}
