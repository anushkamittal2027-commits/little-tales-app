// Trial, video, paywall, checkout, locked screen, account and onboarding.
import { h, icon, todayStr, addDays, longDate, shortDate } from './util.js';
import { store } from './store.js';
import { state, register, go, back, toast, sheet } from './nav.js';
import { stampEl } from './stamp.js';
import { LOGO } from './art.js';
import { account, saveAccount, patchAccount, startTrial, trialInfo, subscribe, cancelSubscription, purgeAllTales, resetDemo, PLANS, TRIAL_DAYS, HOLD_DAYS } from './account.js';
import { makeVideo, pickTales, videoKind, videoTitle, canMakeVideo } from './video.js';
import { makeZip, dataUrlToBytes, textBytes, saveBlob } from './zip.js';

const primary = (label, onClick, attrs = {}) => h('button.btn-primary', { onClick, ...attrs }, label);
const secondary = (label, onClick) => h('button.btn-secondary', { onClick }, label);
const linkBtn = (label, onClick) => h('button.link', { onClick }, label);
const topBar = (right) => h('div.topbar', h('button.icon-btn', { 'aria-label': 'Back', onClick: () => back(), html: icon.back }), h('div.topbar-right', right));
const rupees = (n) => 'Rs ' + (Number.isInteger(n) ? n : n.toFixed(2));
const withGst = (n) => (account.settings.gst ? Math.round(n * 1.18 * 100) / 100 : n);

// =====================================================
// HOW YOUR FREE WEEK WORKS (with consent)
// =====================================================
register('terms', () => {
  let ticked = false;
  const btn = primary('Start my free week', async () => { if (!ticked) return; await startTrial(); go('install', {}, { replace: true }); }, { disabled: true });
  const box = h('button.check', { role: 'checkbox', 'aria-checked': 'false', onClick: () => {
    ticked = !ticked; box.setAttribute('aria-checked', String(ticked)); box.classList.toggle('on', ticked); btn.disabled = !ticked;
  } }, h('span.box', { html: icon.check }),
  h('span.check-text', 'I understand how the free week and the 30-day hold work.'));
  const step = (n, title, body) => h('div.rule', h('div.rule-n', n), h('div', h('h3', title), h('p', body)));
  return h('div.terms',
    h('div.topbar', h('button.icon-btn', { 'aria-label': 'Back', onClick: () => back('welcome'), html: icon.back })),
    h('h1', 'How your ', h('em', 'free week'), ' works'),
    h('div.rules',
      step('1–7', 'Seven days, completely free', 'Everything is unlocked. No card or payment details needed to start.'),
      step('7', 'Your week, in a video', 'On day 7 we make a short video from your tales, then show you the plans.'),
      step('8+', 'If you don’t subscribe', 'Your calendar locks. Your tales stay safe for 30 days, and we remind you with 7 days and 1 day left. Subscribe any time in those 30 days and everything comes back as it was.'),
      step('38', 'After 30 days', 'Locked tales are permanently deleted. We can’t bring them back.')),
    h('p.fine', 'Private by default. Your photos, voice notes and thoughts are never used for ads.'),
    h('div.bottom', box, btn));
});

// =====================================================
// ONBOARDING: Home Screen + gentle nudges
// =====================================================
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isStandalone = () => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone;
register('install', () => {
  const ios = isIOS();
  const notifyBtn = h('button.btn-secondary', { onClick: async () => {
    if (!('Notification' in window)) { toast('Reminders aren’t available in this browser'); return; }
    if (ios && !isStandalone()) { toast('Add Little Tales to your Home Screen first'); return; }
    let p = 'denied'; try { p = await Notification.requestPermission(); } catch {}
    await patchAccount({ notify: { granted: p === 'granted', asked: true } });
    notifyBtn.textContent = p === 'granted' ? 'Reminders are on' : 'Reminders are off'; notifyBtn.classList.toggle('done', p === 'granted');
    toast(p === 'granted' ? 'Gentle nudges are on' : 'No problem. You can turn them on later in Account');
  } }, h('span.btn-ic', { html: icon.bell }), account.notify.granted ? 'Reminders are on' : 'Turn on gentle nudges');
  const steps = ios
    ? [['Tap', 'the Share button', icon.share], ['Choose', '“Add to Home Screen”', null], ['Tap', '“Add”', null]]
    : [['Tap', 'the ⋮ menu in your browser', null], ['Choose', '“Install app” or “Add to Home screen”', null], ['Tap', '“Install”', null]];
  const installNow = window.__installPrompt ? secondary('Install Little Tales', async () => { const e = window.__installPrompt; e.prompt(); try { await e.userChoice; } catch {} window.__installPrompt = null; }) : null;
  return h('div.install',
    h('div.install-hero', stampEl({ date: todayStr(), photo: null, light: 'golden' }, { size: '8px', postmark: false })),
    h('h1', 'Keep it ', h('em', 'one tap'), ' away'),
    h('p.lead', 'Add Little Tales to your Home Screen so you can catch a moment in seconds, and get a gentle nudge around 1pm and 8pm.'),
    h('div.steps.glass-card', ...steps.map(([a, b, ic], i) => h('div.step', h('span.step-n', i + 1), h('span', h('b', a), ' ', b), ic ? h('span.step-ic', { html: ic }) : null))),
    h('div.install-actions', installNow, notifyBtn),
    h('div.bottom', primary('Continue', async () => { await patchAccount({ installHinted: true }); go('calendar', {}, { replace: true }); }), linkBtn('Skip for now', async () => { await patchAccount({ installHinted: true }); go('calendar', {}, { replace: true }); })));
});

// =====================================================
// "YOUR WEEK" VIDEO
// =====================================================
function rangeFor(mode) {
  const to = todayStr();
  const from = mode === 'trial' ? (account.firstSignIn || addDays(to, -6)) : addDays(to, -6);
  return { from, to, key: mode === 'trial' ? 'trial' : 'week-' + to };
}
register('weekvideo', (p) => {
  const mode = p.mode || 'trial';
  const { from, to, key } = rangeFor(mode);
  const tales = pickTales(store.tales, from, to);
  const kind = videoKind(tales.length), sub = !!account.subscription;
  const finish = async () => {
    if (mode === 'trial') await patchAccount({ day7Shown: true });
    if (mode === 'trial' && !account.subscription) go('paywall', { from: 'day7' }, { replace: true });
    else go('calendar', {}, { replace: true });
  };
  const wrapEl = h('div.weekvideo');
  const stage = h('div.vstage');
  wrapEl.append(h('div.topbar', h('button.icon-btn', { 'aria-label': 'Back', onClick: () => (mode === 'trial' ? finish() : back()), html: icon.back })), stage);

  const showPlayer = (blob) => {
    const url = URL.createObjectURL(blob);
    const vid = h('video.vplayer', { src: url, controls: true, playsinline: true, autoplay: true });
    stage.replaceChildren(h('div.vframe', vid),
      h('div.vactions', mode === 'trial' ? primary('Keep going', finish) : primary('Done', () => back()),
        h('button.link', { onClick: () => saveBlob(blob, `little-tales-${key}.${blob.type.includes('mp4') ? 'mp4' : 'webm'}`) }, 'Save video')));
    wrapEl._url = url;
  };
  const start = async () => {
    const canvas = h('canvas.vcanvas');
    const bar = h('div.vbar', h('i'));
    stage.replaceChildren(h('div.vframe.making', canvas), h('div.vmaking', h('b', 'Making your video…'), h('span', 'It plays as it’s made. Back in a moment.')), bar);
    try {
      const out = await makeVideo(tales, { canvas, soft: kind === 'soft', subscribed: sub, rangeText: `${shortDate(from)} – ${shortDate(to)}`.toUpperCase(), onProgress: (f) => { bar.firstChild.style.width = Math.round(f * 100) + '%'; } });
      await store.setMeta('video:' + key, out.blob);
      await patchAccount({ videos: { ...account.videos, [key]: true } });
      showPlayer(out.blob);
    } catch (e) {
      console.warn(e);
      stage.replaceChildren(h('div.vempty', h('h2', 'We couldn’t make the video here'), h('p', 'Your tales are safe. Try again on your own phone’s browser.'), mode === 'trial' ? primary('Keep going', finish) : primary('Back', () => back())));
    }
  };

  if (kind === 'none') {
    stage.append(h('div.vempty', h('div.vempty-ic', { html: icon.film }), h('h2', 'No video this week'), h('p', 'A video needs at least one tale. Make a little tale each day and your week will be waiting here.'), mode === 'trial' ? primary('Continue', finish) : primary('Back', () => back())));
  } else if (!canMakeVideo()) {
    stage.append(h('div.vempty', h('h2', 'Video isn’t supported here'), h('p', 'Open Little Tales in Chrome or Safari to make your week video.'), mode === 'trial' ? primary('Continue', finish) : primary('Back', () => back())));
  } else {
    stage.append(h('div.vintro',
      h('div.vstamps', ...tales.slice(-3).map((t, i) => h('div.vs' + i, stampEl(t, { size: '7.4px', postmark: false })))),
      h('div.kicker', mode === 'trial' ? 'Day 7' : 'This Sunday'),
      h('h1', kind === 'soft' ? h('span', videoTitle(tales.length)) : h('span', 'Your ', h('em', 'week'))),
      h('p', `${tales.length} ${tales.length === 1 ? 'tale' : 'tales'} from ${shortDate(from)} to ${shortDate(to)}.`),
      primary('Make my video', start)));
    // if we already made it, show it straight away
    store.getMeta('video:' + key).then((b) => { if (b && b.size) { stage.replaceChildren(); showPlayer(b); } });
  }
  wrapEl._cleanup = () => { if (wrapEl._url) URL.revokeObjectURL(wrapEl._url); };
  return wrapEl;
});

// =====================================================
// PAYWALL + PRACTICE CHECKOUT
// =====================================================
register('paywall', (p) => {
  let plan = 'yearly';
  const info = trialInfo();
  const locked = info.status === 'locked';
  const day7 = p.from === 'day7' || info.status === 'day7';
  const cards = h('div.plans');
  const note = h('p.fine.gst');
  const draw = () => {
    cards.replaceChildren(...[PLANS.yearly, PLANS.monthly].map((pl) => h('button.plan' + (plan === pl.id ? '.on' : '') + (pl.best ? '.best' : ''), { 'aria-pressed': String(plan === pl.id), onClick: () => { plan = pl.id; draw(); } },
      pl.best ? h('span.badge', 'Best value') : null,
      h('span.plan-name', pl.name),
      h('span.plan-price', rupees(pl.price), h('small', ' / ' + pl.per)),
      h('span.plan-note', pl.note))));
    note.textContent = account.settings.gst ? 'Prices shown without GST. 18% GST is added at checkout.' : '';
  };
  draw();
  return h('div.paywall',
    h('div.topbar', locked ? h('button.icon-btn', { 'aria-label': 'Back', onClick: () => back('locked'), html: icon.back }) : (day7 ? h('span') : h('button.icon-btn', { 'aria-label': 'Back', onClick: () => back(), html: icon.back }))),
    h('div.pw-head',
      h('div.kicker', day7 ? 'Your free week ends tonight' : locked ? 'Your tales are waiting' : 'Little Tales'),
      h('h1', 'Keep your tales ', h('em', 'going.')),
      h('p', 'One plan. Everything included.')),
    h('ul.perks.glass-card',
      ...['Up to 3 little tales every day', 'Voice notes, stamps, stickers and tape', 'A “Your week” video every Sunday', 'Download your whole scrapbook any time'].map((t) => h('li', h('span.perk-ic', { html: icon.check }), t))),
    cards, note,
    h('div.bottom',
      primary('Continue', () => go('checkout', { plan })),
      day7 ? linkBtn('Maybe later', () => go('calendar', {}, { replace: true })) : null,
      h('p.fine', 'Cancel any time. Practice mode: no real payment is taken yet.')));
});

register('checkout', (p) => {
  const plan = PLANS[p.plan] || PLANS.yearly;
  const total = withGst(plan.price), gst = Math.round((total - plan.price) * 100) / 100;
  let method = 'upi';
  const fields = h('div.pay-fields');
  const err = h('p.pay-err');
  const payBtn = primary(`Pay ${rupees(total)}`, async () => {
    const f = fields.querySelectorAll('input');
    if (method === 'upi') { if (!/^[\w.\-]{2,}@[a-z]{2,}$/i.test(f[0].value.trim())) { err.textContent = 'Enter a UPI ID like name@bank'; return; } }
    else {
      const num = f[0].value.replace(/\s/g, ''); if (!/^\d{12,19}$/.test(num)) { err.textContent = 'Check the card number'; return; }
      if (!/^(0[1-9]|1[0-2])\s?\/\s?\d{2}$/.test(f[1].value.trim())) { err.textContent = 'Use the expiry as MM/YY'; return; }
      if (!/^\d{3,4}$/.test(f[2].value.trim())) { err.textContent = 'Check the 3 digit code'; return; }
    }
    err.textContent = ''; payBtn.disabled = true; payBtn.textContent = 'Processing…';
    await new Promise((r) => setTimeout(r, 1400));
    await subscribe(plan.id); // nothing typed above is stored or sent anywhere
    go('success', { plan: plan.id }, { replace: true });
  });
  const draw = () => {
    fields.replaceChildren(...(method === 'upi'
      ? [h('label', 'UPI ID', h('input', { type: 'text', inputmode: 'email', autocomplete: 'off', placeholder: 'name@bank', 'aria-label': 'UPI ID' })), h('p.fine', 'You’ll approve the monthly or yearly auto-pay in your UPI app.')]
      : [h('label', 'Card number', h('input', { type: 'text', inputmode: 'numeric', autocomplete: 'off', placeholder: '1234 5678 9012 3456', 'aria-label': 'Card number' })),
        h('div.two', h('label', 'Expiry', h('input', { type: 'text', inputmode: 'numeric', autocomplete: 'off', placeholder: 'MM/YY', 'aria-label': 'Expiry' })), h('label', 'Code', h('input', { type: 'password', inputmode: 'numeric', autocomplete: 'off', placeholder: '123', 'aria-label': 'Security code' })))]));
  };
  const tabs = h('div.paytabs');
  const drawTabs = () => tabs.replaceChildren(...[['upi', 'UPI AutoPay'], ['card', 'Card']].map(([k, l]) => h('button.paytab' + (method === k ? '.on' : ''), { onClick: () => { method = k; err.textContent = ''; drawTabs(); draw(); } }, l)));
  drawTabs(); draw();
  return h('div.checkout',
    topBar(),
    h('h1', 'Almost ', h('em', 'there')),
    h('div.summary.glass-card',
      h('div.srow', h('span', `Little Tales ${plan.name}`), h('b', rupees(plan.price))),
      account.settings.gst ? h('div.srow.sub', h('span', 'GST (18%)'), h('span', rupees(gst))) : null,
      h('div.srow.total', h('span', 'Total today'), h('b', rupees(total)))),
    h('div.practice', h('b', 'Practice mode.'), ' Nothing is charged, and nothing you type here is saved.'),
    tabs, fields, err,
    h('div.bottom', payBtn));
});

register('success', (p) => {
  const plan = PLANS[p.plan] || PLANS.yearly;
  return h('div.success',
    h('div.burst', ...Array.from({ length: 14 }, (_, i) => h('i', { style: { '--a': (i * 360 / 14) + 'deg', '--c': ['#FF4FA3', '#C6F135', '#FFD93D', '#25C7B7', '#3B5BFF', '#FF6B4A'][i % 6] } }))),
    h('div.ok', { html: icon.check }),
    h('h1', 'You’re ', h('em', 'in.')),
    h('p', `Welcome to Little Tales ${plan.name}. Your tales are unlocked and your Sunday video is on its way.`),
    h('div.bottom', primary('Back to my calendar', () => { go('calendar', {}, { replace: true }); toast('Subscribed. Thank you!'); })));
});

// =====================================================
// LOCKED
// =====================================================
register('locked', () => {
  const info = trialInfo();
  const n = store.tales.length;
  const left = info.holdLeft ?? 0;
  const deleted = info.status === 'deleted';
  const urgent = left <= 1 ? 'Last day. Subscribe today to keep every tale.' : left <= 7 ? `Only ${left} days left to keep your tales.` : null;
  return h('div.locked',
    h('div.topbar', h('span'), h('div.topbar-right', h('button.icon-btn', { 'aria-label': 'Account', onClick: () => go('account'), html: icon.user }))),
    h('div.lock-stage',
      h('div.lock-stamps', ...store.tales.slice(0, 3).map((t, i) => h('div.ls' + i, stampEl(t, { size: '8.4px', postmark: false })))),
      h('div.lock-badge', { html: icon.lock })),
    deleted
      ? [h('h1', 'Your tales were ', h('em', 'deleted')), h('p.lead', `After ${HOLD_DAYS} days without a subscription, locked tales are permanently removed. You can start again with a fresh album any time.`)]
      : [h('h1', 'Your week is ', h('em', 'waiting.')), h('p.lead', 'Subscribe to unlock it.'),
        h('div.lock-stats.glass-card',
          h('div', h('b', n), h('span', n === 1 ? 'tale saved' : 'tales saved')),
          h('div', h('b', left), h('span', left === 1 ? 'day left' : 'days left'))),
        urgent ? h('p.urgent', urgent) : null,
        h('div.meter', h('i', { style: { width: Math.max(4, (left / HOLD_DAYS) * 100) + '%' } }))],
    h('div.bottom', deleted
      ? primary('Start a new album', async () => { await resetDemo(); go('welcome', {}, { replace: true }); })
      : primary('Subscribe to unlock', () => go('paywall', { from: 'locked' })),
    deleted ? null : linkBtn('Account', () => go('account'))));
});

// =====================================================
// ACCOUNT
// =====================================================
async function downloadScrapbook() {
  toast('Packing your scrapbook…');
  const files = [];
  const meta = [];
  let i = 0;
  for (const t of store.tales.slice().sort((a, b) => a.date.localeCompare(b.date))) {
    i++; const base = `${t.date}-${String(i).padStart(2, '0')}`;
    let photo = null;
    try { photo = await dataUrlToBytes(t.photo); files.push({ name: `photos/${base}.jpg`, data: photo }); } catch {}
    if (t.audio) files.push({ name: `voice/${base}.${(t.audio.type || '').includes('mp4') ? 'm4a' : (t.audio.type || '').includes('wav') ? 'wav' : 'webm'}`, data: new Uint8Array(await t.audio.arrayBuffer()) });
    meta.push({ date: t.date, title: t.title, thought: t.thought, light: t.light, photo: photo ? `photos/${base}.jpg` : null, voice: t.audio ? true : false, decorations: t.decorations });
  }
  files.unshift({ name: 'tales.json', data: textBytes(JSON.stringify({ app: 'Little Tales', exported: new Date().toISOString(), tales: meta }, null, 2)) });
  files.unshift({ name: 'README.txt', data: textBytes('Your Little Tales scrapbook.\n\nphotos/  your photos\nvoice/   your voice notes\ntales.json  titles, thoughts, dates and decorations\n') });
  saveBlob(makeZip(files), 'little-tales-scrapbook.zip');
  toast('Your scrapbook is downloading');
}
register('account', () => {
  const info = trialInfo();
  const sub = account.subscription;
  const status = { new: 'Not started', trial: `Free week · day ${info.day} of ${TRIAL_DAYS}`, day7: 'Free week · last day', locked: 'Locked', deleted: 'Locked', subscribed: `${PLANS[sub?.plan]?.name || ''} member` }[info.status];
  const canDownload = info.status === 'subscribed';
  const row = (ic, label, sub2, right, onClick) => h('button.arow', { onClick }, h('span.arow-ic', { html: ic }), h('span.arow-t', h('b', label), sub2 ? h('small', sub2) : null), right || null);
  return h('div.account',
    topBar(),
    h('div.profile', h('div.avatar', (account.name || 'L').slice(0, 1).toUpperCase()), h('div', h('h1', 'Your account'), h('p', 'Signed in on this phone'))),
    h('div.plan-card.glass-card',
      h('div.kicker', 'Your plan'), h('h2', status),
      info.status === 'subscribed' ? h('p', `Since ${longDate(sub.since)}`) : info.status === 'trial' || info.status === 'day7' ? h('p', 'Everything is unlocked during your free week.') : null,
      info.status === 'subscribed'
        ? secondary('Cancel subscription', () => confirmSheet('Cancel your subscription?', 'You can subscribe again any time. If your calendar locks, your tales are kept for 30 days.', 'Cancel subscription', async () => { await cancelSubscription(); toast('Subscription cancelled'); go('account', {}, { replace: true }); }))
        : secondary('See plans', () => go('paywall', { from: 'account' }))),
    h('div.alist.glass-card',
      row(icon.download, 'Download my scrapbook', canDownload ? 'Photos, voice notes and words in one file' : 'Available while you’re subscribed', null, canDownload ? downloadScrapbook : () => toast('Subscribe to download your scrapbook')),
      row(icon.bell, 'Gentle nudges', account.notify.granted ? 'On, around 1pm and 8pm' : 'Off. Tap to set up', null, () => go('install')),
      row(icon.share, 'Add to Home Screen', 'Open Little Tales in one tap', null, () => go('install'))),
    h('p.fine.priv', 'Private by default. Your photos, voice notes and thoughts are never used for ads and are never shared.'),
    h('div.bottom', h('button.btn-danger-ghost', { onClick: () => confirmSheet('Delete your account and all tales?', 'Everything is removed from this phone for good. This can’t be undone.', 'Delete everything', async () => { await purgeAllTales(); await resetDemo(); state.month = null; go('welcome', {}, { replace: true }); toast('Your account was deleted'); }) }, 'Delete my account and tales')));
});

function confirmSheet(title, body, action, run) {
  const close = sheet(h('div.confirm', h('h2', title), h('p', body),
    h('button.btn-danger', { onClick: async () => { close(); await run(); } }, action),
    linkBtn('Keep things as they are', () => close())));
}
