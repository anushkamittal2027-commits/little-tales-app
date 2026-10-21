// Home, first-time welcome tour, and the scrapbook studio.
import { h, icon, todayStr, shortDate, MAX_PER_DAY } from './util.js';
import { store } from './store.js';
import { register, go, toast } from './nav.js';
import { stampEl } from './stamp.js';
import { LOGO, TRAYS, artSvg } from './art.js';
import { account, trialInfo, patchAccount } from './account.js';
import { auth } from './auth.js';
import { startToday, trialPill, founderPanel, sundayBanner } from './screens.js';
import { installCard } from './install.js';
import { isFounder, syncState } from './sync.js';
import { samplePhoto } from './sample.js';
import { computeStreak } from './streak.js';

const primary = (label, onClick, attrs = {}) => h('button.btn-primary', { onClick, ...attrs }, label);
const secondary = (label, onClick) => h('button.btn-secondary', { onClick }, label);
const link = (label, onClick) => h('button.link', { onClick }, label);

const greeting = () => { const hr = new Date().getHours(); return hr < 5 ? 'Still up' : hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening'; };
const firstName = () => {
  const n = (auth.user?.name || '').trim().split(/\s+/)[0];
  if (n) return n;
  const local = ((auth.user?.email || '').split('@')[0] || '').replace(/[0-9_.\-+].*$/, '');           // "anushka.m" becomes "anushka"
  return local.length >= 2 ? local[0].toUpperCase() + local.slice(1) : '';
};
const recent = (n) => [...store.tales].sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt)).slice(0, n);

// ---------- first-time tour ----------
register('intro', () => {
  const photo = (n) => samplePhoto(n);
  const slides = [
    { t: 'Catch a moment', p: 'Take a photo or pick one from your gallery. Up to three little tales a day.',
      art: () => [['w1', { photo: photo('everyday-lake'), date: '2026-10-12', light: 'none' }, '15px'], ['w2', { photo: photo('everyday-books'), date: '2026-10-14', light: 'none' }, '14px'], ['w3', { photo: photo('everyday-hiker'), date: '2026-10-16', light: 'none' }, '17px', true]] },
    { t: 'Say how it felt', p: 'Write a line, say it out loud, or both. Your voice stays with the stamp.',
      art: () => [['w3', { photo: photo('everyday-house'), date: '2026-10-16', light: 'none' }, '17px', true], ['wmic', null]] },
    { t: 'Watch it become a stamp', p: 'Your photo is cut into a little postage stamp. Decorate it with tape and stickers, then post it to your calendar.',
      art: () => [['w2', { photo: photo('everyday-hiker'), date: '2026-10-16', light: 'golden' }, '14px'], ['w3', { photo: photo('everyday-lake'), date: '2026-10-17', light: 'none' }, '17px', true], ['w1', { photo: photo('everyday-books'), date: '2026-10-15', light: 'none' }, '14px']] },
  ];
  let i = 0;
  const wrap = h('div.intro');
  const finish = async () => { await patchAccount({ introSeen: true }); go('home', {}, { replace: true }); };
  const draw = () => {
    const s = slides[i], last = i === slides.length - 1;
    const art = h('div.intro-hero', { 'aria-hidden': 'true' },
      h('div.ih-panel'),
      ...s.art().map(([cls, tale, size, pm]) => cls === 'wmic'
        ? h('div.ih-mic.wmic', h('span.ih-mic-ic', { html: icon.mic }), h('span.ih-wave', ...Array.from({ length: 22 }, (_, k) => h('i', { style: { height: (18 + Math.abs(Math.sin(k * 1.3)) * 70) + '%' } }))))
        : h('div.ih-stamp.' + cls, stampEl(tale, { size, postmark: !!pm }))),
      h('div.ih-tape'));
    wrap.replaceChildren(
      h('div.intro-top', last ? null : h('button.link', { onClick: finish }, 'Skip')),
      art,
      h('div.intro-copy', h('p.kicker', `STEP ${i + 1} OF ${slides.length}`), h('h1', s.t), h('p.lead', s.p)),
      h('div.dots-nav', { 'aria-label': `Slide ${i + 1} of ${slides.length}` }, ...slides.map((_, k) => h('i' + (k === i ? '.on' : '')))),
      h('div.bottom', primary(last ? 'Let’s begin' : 'Next', () => (last ? finish() : (i++, draw())))));
  };
  draw();
  return wrap;
});

// ---------- home ----------
const GINGHAM_STAR = '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 6l6.6 16.6L56 24l-13.6 11L47 52 32 42.6 17 52l4.6-17L8 24l17.4-1.4z" fill="#F2C94C" stroke="#E0AE2C" stroke-width="2" stroke-linejoin="round"/></svg>';
register('home', () => {
  const info = trialInfo();
  const today = todayStr();
  const count = store.count(today);
  const mine = recent(8);
  const left = Math.max(0, MAX_PER_DAY - count);
  const hr = new Date().getHours();
  let taps = 0, tapTimer;
  const hello = h('h1', { onClick: () => {
    taps++; clearTimeout(tapTimer); tapTimer = setTimeout(() => (taps = 0), 1200);
    if (taps >= 5) { taps = 0; if (isFounder()) founderPanel(); }
  } }, firstName() || 'friend', h('span.greet-ic', { 'aria-hidden': 'true', html: hr >= 5 && hr < 17 ? icon.sun : icon.moon }));
  const head = h('header.home-head',
    h('div', h('p.greet', greeting() + (firstName() ? ',' : '')), hello, trialPill(info)),
    h('button.avatar-btn', { 'aria-label': 'Me and settings', onClick: () => go('account') }, (firstName() || auth.user?.email || 'L')[0].toUpperCase()));

  const todayTale = store.forDate(today)[0];
  const hero = h('section.home-hero',
    h('div.hh-strip', { 'aria-hidden': 'true' }),
    h('div.hh-copy',
      h('h2', count ? 'Another tale?' : 'What caught your eye today?'),
      h('p', count ? `${count} of ${MAX_PER_DAY} kept today${left ? '' : '. See you tomorrow.'}` : `Nothing kept yet today. ${left} spots left.`)),
    h('div.hh-stamp' + (todayTale ? '.has' : ''), { 'aria-hidden': 'true' }, todayTale ? stampEl(todayTale, { size: '9px', postmark: false }) : h('span', { html: icon.camera })),
    h('span.hh-star', { 'aria-hidden': 'true', html: GINGHAM_STAR }),
    h('button.btn-primary.hh-cta', { onClick: () => startToday(), disabled: !left }, left ? [h('span.btn-ic', { html: icon.camera }), 'Make today’s stamp'] : 'Today is full'));

  const { count: streak, postedToday } = computeStreak(store.tales, today);
  const streakRow = streak >= 2
    ? h('button.streak', { onClick: () => go('calendar') },
      h('span.streak-flame' + (postedToday ? '.lit' : ''), { html: icon.flame }),
      h('span.streak-t', h('b', `${streak} days in a row`), h('small', postedToday ? 'Lovely. See you tomorrow' : 'Keep it going today')),
      h('span.streak-go', { html: icon.chevR }))
    : null;

  const skeleton = () => h('section.home-sec', h('div.sec-head', h('h2', 'Your memories')),
    h('div.mem-row', ...[0, 1, 2, 3].map(() => h('div.sk-stamp', { 'aria-hidden': 'true' }))));
  const rots = [-3, 2, -2, 3, -3, 2, -2, 3];
  const memories = !mine.length && syncState.pulling ? skeleton() : mine.length
    ? h('section.home-sec',
      h('div.sec-head', h('h2', 'Your memories'), h('button.link', { onClick: () => go('calendar') }, 'See all')),
      h('div.mem-row', ...mine.map((t, i) =>
        h('button.latest-card', { 'aria-label': t.title || shortDate(t.date), style: { '--rot': rots[i % 8] + 'deg' }, onClick: () => go('tale', { id: t.id }) },
          stampEl(t, { size: '7.6px', postmark: false })))))
    : h('section.home-sec.empty',
      h('h2', 'Your first stamp is waiting'),
      h('ol.tips', h('li', 'Tap Make today’s stamp'), h('li', 'Add a photo, then a voice note or a line'), h('li', 'Decorate it and post it to your calendar')));

  const tile = (ic, color, title, onClick) => h('button.tile', { onClick }, h('span.tile-ic', { style: { color }, html: ic }), h('b', title));
  const week = () => { if (info.status === 'subscribed') go('weekvideo', { mode: 'sunday' }); else if (info.status === 'day7') go('weekvideo', { mode: 'trial' }); else toast('Your week video is ready on day 7 of your free week.'); };
  const tiles = h('div.tiles',
    tile(icon.calendar, '#5E7A53', 'Calendar', () => go('calendar')),
    tile(icon.sticker, '#C46F63', 'Scrapbook studio', () => go('studio')),
    tile(icon.film, '#3D6A99', 'Your week', week),
    tile(icon.settings, '#6E4A12', 'Settings & account', () => go('account')));

  return h('div.home', head, sundayBanner(info), hero, streakRow, memories, tiles, installCard(() => go('home', {}, { replace: true })));
});

// ---------- scrapbook studio ----------
const KIND_LABEL = { stickers: 'Stickers', tape: 'Washi tape', paper: 'Paper', doodles: 'Doodles' };
register('studio', () => {
  const mine = recent(8);
  const prompt = (kind, id, name) => {
    if (!mine.length) { toast('Make a stamp first, then decorate it here'); return; }
    toast(`Opening your latest tale. Tap \u201c${name}\u201d in the tray.`);
    go('decorate', { id: mine[0].id });
  };
  const sections = Object.keys(TRAYS).map((k) =>
    h('section.home-sec',
      h('div.sec-head', h('h2', KIND_LABEL[k] || k)),
      h('div.studio-grid.glass-card', ...TRAYS[k].slice(0, k === 'stickers' ? 12 : 8).map((a) =>
        h('button.studio-item.' + k, { 'aria-label': a.name, onClick: () => prompt(k, a.id, a.name), html: artSvg(k, a.id) })))));
  return h('div.studio',
    h('div.cal-head', h('h1.studio-title', 'Scrapbook ', h('em', 'studio'))),
    h('p.lead.small', 'Pick a memory to decorate, or tap anything below to add it to your latest tale.'),
    mine.length
      ? h('section.home-sec', h('div.sec-head', h('h2', 'Decorate a ', h('em', 'memory'))),
        h('div.latest-row.home-row', ...mine.map((t, i) => h('button.latest-card', { 'aria-label': 'Decorate ' + (t.title || shortDate(t.date)), style: { '--rot': [-3, 2, -2, 4][i % 4] + 'deg' }, onClick: () => go('decorate', { id: t.id }) }, stampEl(t, { size: '6.2px', postmark: false })))))
      : h('section.home-sec.empty.glass-card', h('h2', 'Nothing to decorate ', h('em', 'yet')), h('p', 'Make your first stamp, then come back to dress it up.'), secondary('Make a stamp', () => startToday())),
    ...sections);
});
