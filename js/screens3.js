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
import { computeStreak } from './streak.js';
import { FLAME } from './delight.js';

const primary = (label, onClick, attrs = {}) => h('button.btn-primary', { onClick, ...attrs }, label);
const secondary = (label, onClick) => h('button.btn-secondary', { onClick }, label);
const link = (label, onClick) => h('button.link', { onClick }, label);

const greeting = () => { const hr = new Date().getHours(); return hr < 5 ? 'Still up' : hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening'; };
const firstName = () => { const n = (auth.user?.name || '').trim().split(/\s+/)[0]; return n || ''; };
const recent = (n) => [...store.tales].sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt)).slice(0, n);

// ---------- first-time tour ----------
register('intro', () => {
  const slides = [
    { art: ['stickers', 'sun'], t: ['Catch a ', 'moment'], p: 'Take a photo or pick one from your gallery. Anything small that made you pause.' },
    { art: ['stickers', 'heart'], t: ['Say how it ', 'felt'], p: 'Hold the mic for a voice note, or write a line. Up to three tales a day, so every one counts.' },
    { art: ['tape', 'tape-dots'], t: ['Watch it become a ', 'stamp'], p: 'Your photo is cut into a little postage stamp. Decorate it with tape and stickers, then post it to your calendar.' },
  ];
  let i = 0;
  const wrap = h('div.intro');
  const finish = async () => { await patchAccount({ introSeen: true }); go('home', {}, { replace: true }); };
  const draw = () => {
    const s = slides[i], last = i === slides.length - 1;
    wrap.replaceChildren(
      h('div.intro-top', last ? null : link('Skip', finish)),
      h('div.intro-hero', stampEl({ date: todayStr(), photo: null, light: 'golden' }, { size: '9px', postmark: i === 2 }),
        h('div.intro-badge', { html: artSvg(s.art[0], s.art[1]) || LOGO })),
      h('h1', s.t[0], h('em', s.t[1])),
      h('p.lead', s.p),
      h('div.dots-nav', ...slides.map((_, k) => h('i' + (k === i ? '.on' : '')))),
      h('div.bottom', primary(last ? 'Let’s begin' : 'Next', () => (last ? finish() : (i++, draw())))));
  };
  draw();
  return wrap;
});

// ---------- home ----------
register('home', () => {
  const info = trialInfo();
  const today = todayStr();
  const count = store.count(today);
  const mine = recent(10);
  const left = Math.max(0, MAX_PER_DAY - count);
  let taps = 0, tapTimer;
  const logo = h('button.brand', { 'aria-label': 'Little Tales', onClick: () => {
    taps++; clearTimeout(tapTimer); tapTimer = setTimeout(() => (taps = 0), 1200);
    if (taps >= 5) { taps = 0; if (isFounder()) founderPanel(); }
  } }, h('span.logo', { html: LOGO }), 'Little Tales');

  const hero = h('div.home-hero.glass-card',
    h('div.hh-copy',
      h('div.kicker', greeting() + (firstName() ? ', ' + firstName() : '')),
      h('h1', count ? 'Another ' : 'What caught your ', h('em', count ? 'tale?' : 'eye today?')),
      h('p', count ? `${count} of ${MAX_PER_DAY} kept today${left ? '' : '. See you tomorrow.'}` : 'Make today’s stamp. It only takes a minute.')),
    h('div.hh-stamp', stampEl(mine[0] || { date: today, photo: null, light: 'golden' }, { size: '8px', postmark: false })),
    h('div.hh-cta', primary(left ? 'Make today’s stamp' : 'Today is full', () => startToday(), left ? {} : { disabled: true })));

  const { count: streak, postedToday } = computeStreak(store.tales, today);
  const streakChip = streak >= 2
    ? h('button.streak', { onClick: () => toast(postedToday ? `${streak} days in a row. Lovely.` : `${streak} days in a row. Post today to keep it going.`) },
      h('span.streak-flame' + (postedToday ? '.lit' : ''), { html: FLAME }), h('b', `${streak} days in a row`), postedToday ? null : h('small', 'keep it going today'))
    : null;

  const skeleton = () => h('section.home-sec', h('div.sec-head', h('h2', 'Your ', h('em', 'memories'))),
    h('div.latest-row.home-row', ...[0, 1, 2].map(() => h('div.sk-stamp', { 'aria-hidden': 'true' }))));

  const memories = !mine.length && syncState.pulling ? skeleton() : mine.length
    ? h('section.home-sec',
      h('div.sec-head', h('h2', 'Your ', h('em', 'memories')), link('See all', () => go('calendar'))),
      h('div.latest-row.home-row', ...mine.map((t, i) =>
        h('button.latest-card', { 'aria-label': t.title || shortDate(t.date), style: { '--rot': [-4, 3, -2, 5, -5, 2, -3][i % 7] + 'deg' }, onClick: () => go('tale', { id: t.id }) },
          stampEl(t, { size: '8.6px', mini: false, postmark: false })))))
    : h('section.home-sec.empty.glass-card',
      h('h2', 'Your first stamp is ', h('em', 'waiting')),
      h('ol.tips', h('li', 'Tap Make today’s stamp'), h('li', 'Add a photo, then a voice note or a line'), h('li', 'Decorate it and post it to your calendar')));

  const tile = (ic, title, sub, onClick) => h('button.tile.glass-card', { onClick }, h('span.tile-ic', { html: ic }), h('b', title), h('small', sub));
  const tiles = h('div.tiles',
    tile(icon.calendar, 'Calendar', 'Every day you kept', () => go('calendar')),
    tile(icon.sticker, 'Scrapbook studio', 'Tape, stickers, paper', () => go('studio')),
    tile(icon.film, 'Your week', info.status === 'subscribed' ? 'Watch your latest video' : info.status === 'day7' ? 'Make it now' : 'Ready on day 7', () => { if (info.status === 'subscribed') go('weekvideo', { mode: 'sunday' }); else if (info.status === 'day7') go('weekvideo', { mode: 'trial' }); else toast('Your week video is ready on day 7 of your free week.'); }),
    tile(icon.user, 'Settings & account', 'Plan, nudges, download', () => go('account')));

  return h('div.home',
    h('div.cal-head', logo, h('div.cal-head-right', trialPill(info))),
    sundayBanner(info),
    streakChip,
    hero, memories, tiles, installCard(() => go('home', {}, { replace: true })));
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
