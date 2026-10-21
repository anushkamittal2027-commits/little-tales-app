// Trial, video, paywall, checkout, locked screen, account and onboarding.
import { h, icon, todayStr, addDays, longDate, shortDate } from './util.js';
import { store } from './store.js';
import { state, register, go, back, toast, sheet, currentName } from './nav.js';
import { stampEl } from './stamp.js';
import { samplePhoto } from './sample.js';
import { LOGO } from './art.js';
import { account, saveAccount, patchAccount, startTrial, trialInfo, subscribe, cancelSubscription, purgeAllTales, resetDemo, PLANS, TRIAL_DAYS, HOLD_DAYS } from './account.js';
import { subscribePush } from './push.js';
import { deleteAccountOnline, pendingCount } from './sync.js';
import { payOnline, cancelOnline } from './pay.js';
import { addToHomeScreen, canOfferInstall } from './install.js';
import { CODE_LENGTH } from './config.js';
import { auth, signInWithGoogle, sendEmailCode, verifyEmailCode, signOut, DEMO_CODE, authLogText, googleButtonAvailable, signInWithGoogleToken } from './auth.js';
import { renderGoogleButton } from './google.js';
import { makeVideo, pickTales, videoKind, videoTitle, canMakeVideo } from './video.js';
import { makeZip, dataUrlToBytes, textBytes, saveBlob } from './zip.js';

const primary = (label, onClick, attrs = {}) => h('button.btn-primary', { onClick, ...attrs }, label);
const secondary = (label, onClick) => h('button.btn-secondary', { onClick }, label);
const linkBtn = (label, onClick) => h('button.link', { onClick }, label);
const topBar = (right) => h('div.topbar', h('button.icon-btn', { 'aria-label': 'Back', onClick: () => back(), html: icon.back }), h('div.topbar-right', right));
const rupees = (n) => 'Rs ' + (Number.isInteger(n) ? n : n.toFixed(2));
const withGst = (n) => (account.settings.gst ? Math.round(n * 1.18 * 100) / 100 : n);

// =====================================================
// SIGN IN
// =====================================================
const GOOGLE_G = '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"/><path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>';
const DAISY = '<svg viewBox="0 0 120 140"><path d="M60 140C58 110 62 80 55 52" stroke="#7E9A5E" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M57 98c-14-4-22-14-24-24 12 2 22 10 24 24zM58 82c12-6 22-6 30-2-8 8-20 8-30 2z" fill="#9DB57F"/><g transform="translate(55 42)"><g fill="#fff" stroke="#EDE4D3"><ellipse cx="0" cy="-17" rx="5.5" ry="10"/><ellipse cx="0" cy="17" rx="5.5" ry="10"/><ellipse cx="-17" cy="0" rx="10" ry="5.5"/><ellipse cx="17" cy="0" rx="10" ry="5.5"/><ellipse cx="12" cy="-12" rx="5.5" ry="10" transform="rotate(45 12 -12)"/><ellipse cx="-12" cy="12" rx="5.5" ry="10" transform="rotate(45 -12 12)"/><ellipse cx="-12" cy="-12" rx="5.5" ry="10" transform="rotate(-45 -12 -12)"/><ellipse cx="12" cy="12" rx="5.5" ry="10" transform="rotate(-45 12 12)"/></g><circle r="8" fill="#F2C94C"/></g></svg>';
const ENVELOPE = '<svg viewBox="0 0 150 104"><rect x="2" y="2" width="146" height="100" rx="4" fill="#BBD3EA" stroke="#A3BFDA" stroke-width="1.5"/><path d="M2 4l73 46 73-46" fill="none" stroke="#A3BFDA" stroke-width="1.5"/><circle cx="75" cy="52" r="15" fill="#D6A445"/><circle cx="75" cy="52" r="10" fill="none" stroke="#8E6420" stroke-width="1.8"/><path d="M71 51q2-2 4 0M77 51q2-2 4 0M72 56q3 2.5 6 0" stroke="#8E6420" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>';
const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());
// After signing in: new members read the free-week page; returning members go to their calendar.
const afterSignIn = () => go(trialInfo().status === 'new' ? 'terms' : 'home', {}, { replace: true });
register('signin', (p) => {
  const email = h('input', { type: 'email', inputmode: 'email', autocomplete: 'email', placeholder: 'you@example.com', 'aria-label': 'Email address' });
  const err = h('p.pay-err', p?.error || auth.error || '');
  let sending = false;
  const go2 = async () => {
    if (sending) return;
    const v = email.value.trim();
    if (!validEmail(v)) { err.textContent = 'Enter an email like you@example.com'; return; }
    err.textContent = ''; sending = true; mail.disabled = true; mail.textContent = 'Sending\u2026';
    // Go to the code screen right away; the email is sent while the person is already looking at where to type the code.
    const pending = sendEmailCode(v);
    pending.catch(() => {});
    go('code', { email: v, pending });
    sending = false; mail.disabled = false; mail.textContent = 'Email me a code';
  };
  email.addEventListener('keydown', (e) => { if (e.key === 'Enter') go2(); });
  const mail = h('button.btn-secondary.mail-btn', { onClick: go2 }, h('span.btn-ic', { html: icon.mail }), 'Email me a code');
  const google = h('button.google', { onClick: async () => {
    try { const u = await signInWithGoogle(); if (u) afterSignIn(); }
    catch (e) { err.textContent = e.message || 'Google sign-in didn\u2019t work. Try the email code.'; }
  } }, h('span.g-ic', { html: GOOGLE_G }), 'Continue with Google');
  // Google's own button (shows "Little Tales"); the older redirect button stays as the backup if Google's button cannot load.
  const slot = h('div.gsi-slot', { style: { display: 'none' } });
  const trouble = h('button.link.gsi-trouble', { style: { display: 'none' }, onClick: () => { slot.style.display = 'none'; trouble.style.display = 'none'; google.style.display = ''; } }, 'Google button not working? Try another way');
  if (googleButtonAvailable()) {
    google.style.display = 'none';
    renderGoogleButton(slot, async (token, nonce) => {
      err.textContent = '';
      try { await signInWithGoogleToken(token, nonce); afterSignIn(); }
      catch (e) { err.textContent = 'Google sign-in didn\u2019t work. ' + (e.message || '') + ' Try the email code.'; }
    }).then(() => { slot.style.display = ''; trouble.style.display = ''; })
      .catch(() => { google.style.display = ''; });
  }
  return h('div.signin',
    h('div.topbar', h('button.icon-btn', { 'aria-label': 'Back', onClick: () => back('welcome'), html: icon.back })),
    h('span.si-flower', { 'aria-hidden': 'true', html: DAISY }),
    h('div.signin-hero', h('h1', 'Keep your album safe'), h('p.lead', 'Sign in so your tales follow you to any phone. No password needed.')),
    isStandalone() && /iphone|ipad|ipod/i.test(navigator.userAgent) ? h('p.demo-note', h('b', 'Tip.'), ' On iPhone the email code keeps you inside this app and is the most reliable here. You only need to sign in once.') : null,
    h('div.signin-card', slot, trouble, google,
      h('div.or', h('span', 'or')),
      h('label', 'Email', email), err, mail),
    h('div.si-note', { 'aria-hidden': 'true' }, 'Good people,', h('br'), 'good days'),
    auth.provider === 'demo' ? h('p.demo-note', h('b', 'Demo mode.'), ` Real sign-in switches on when the server is connected. Any email works, and the code is ${DEMO_CODE}.`) : null,
    auth.provider === 'supabase' ? h('details.diag', h('summary', 'Trouble signing in? Show details'), h('pre', ['Version: 3 (home screen)', ...auth.diag, authLogText() ? '--- recent sign-in events ---\n' + authLogText() : ''].join('\n'))) : null,
    h('p.fine.center', 'By continuing you agree to our ', h('a', { href: 'terms.html', onClick: (e) => { e.preventDefault(); go('legal', { doc: 'terms' }); } }, 'Terms'), ' and ', h('a', { href: 'privacy.html', onClick: (e) => { e.preventDefault(); go('legal', { doc: 'privacy' }); } }, 'Privacy'), '.', h('br'), 'For ages 18 and up.'));
});
register('code', (p) => {
  const email = p.email || '';
  const note = h('p.sending-note', p.pending ? 'Sending your code\u2026' : '');
  p.pending?.then(() => { note.textContent = 'Code sent. It usually arrives within a few seconds (check Spam too).'; })
    
    .catch((e) => { if (currentName() !== 'code') return; go('signin', { error: (e && e.message) || 'We couldn\u2019t send the code. Please try again.' }, { replace: true }); });
  const input = h('input.code-input', { type: 'text', inputmode: 'numeric', autocomplete: 'one-time-code', maxlength: CODE_LENGTH, 'aria-label': `${CODE_LENGTH} digit code from your email` });
  const boxes = Array.from({ length: CODE_LENGTH }, () => h('div.code-box'));
  const paint = () => { const v = input.value.replace(/\D/g, ''), at = document.activeElement === input; boxes.forEach((b, i) => { b.textContent = v[i] || ''; b.classList.toggle('filled', !!v[i]); b.classList.toggle('on', at && i === Math.min(v.length, CODE_LENGTH - 1)); }); };
  input.addEventListener('input', paint); input.addEventListener('focus', paint); input.addEventListener('blur', paint);
  const codeWrap = h('div.code-wrap', { role: 'group', 'aria-label': `${CODE_LENGTH}-digit code` }, h('div.code-boxes', ...boxes), input);
  const err = h('p.pay-err');
  const btn = primary('Continue', async () => {
    const c = input.value.replace(/\D/g, '');
    if (c.length !== CODE_LENGTH) { err.textContent = `Enter the ${CODE_LENGTH} digit code from your email`; return; }
    btn.disabled = true; btn.textContent = 'Checking\u2026'; err.textContent = '';
    try { await verifyEmailCode(email, c); afterSignIn(); }
    catch (e) { err.textContent = e.message || 'That code didn\u2019t work.'; btn.disabled = false; btn.textContent = 'Continue'; input.select(); }
  });
  input.addEventListener('input', () => { input.value = input.value.replace(/\D/g, '').slice(0, CODE_LENGTH); if (input.value.length === CODE_LENGTH && !btn.disabled) btn.click(); });
  let left = 30; const resend = h('button.link', { disabled: true }, 'Resend in 30s');
  const tick = setInterval(() => { left--; if (left <= 0) { clearInterval(tick); resend.disabled = false; resend.textContent = 'Send a new code'; } else resend.textContent = `Resend in ${left}s`; }, 1000);
  let resending = false;
  resend.addEventListener('click', async () => { if (resending) return; resending = true; setTimeout(() => { resending = false; }, 30000); try { await sendEmailCode(email); toast('A new code is on its way'); } catch { toast('Couldn\u2019t send a code'); } });
  const el = h('div.signin.code',
    h('div.topbar', h('button.icon-btn', { 'aria-label': 'Back', onClick: () => back('signin'), html: icon.back })),
    h('div.signin-hero', h('div.mail-ic', { html: ENVELOPE }), h('h1', 'Check your inbox'), h('p.lead', `We sent an ${CODE_LENGTH}-digit code to`, h('br'), h('b', email))),
    codeWrap,
    h('p.fine.center', 'It fills in by itself when you paste. We\u2019ll sign you in as soon as it\u2019s complete.'),
    err,
    note,
    auth.provider === 'demo' ? h('p.demo-note', h('b', 'Demo mode.'), ` The code is ${DEMO_CODE}.`) : null,
    h('div.bottom', btn, resend));
  el._cleanup = () => clearInterval(tick);
  setTimeout(() => input.focus(), 350);
  return el;
});

// =====================================================
// HOW YOUR FREE WEEK WORKS (with consent)
// =====================================================
register('terms', () => {
  let ticked = false;
  const btn = primary('Start my free week', async () => { if (!ticked) return; await startTrial(); go('intro', {}, { replace: true }); }, { disabled: true });
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
// Gentle nudges (browser notifications). Optional, asked for from Account.
// =====================================================
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isStandalone = () => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone;
async function turnOnNudges() {
  if (isIOS() && !isStandalone()) { toast('On iPhone, reminders work once Little Tales is on your Home Screen. Here is how:'); setTimeout(addToHomeScreen, 400); return false; }
  if (!('Notification' in window)) { toast('This browser can\u2019t show reminders. Try Chrome, or add Little Tales to your Home Screen.'); return false; }
  let p = 'denied'; try { p = await Notification.requestPermission(); } catch {}
  await patchAccount({ notify: { granted: p === 'granted', asked: true } });
  if (p === 'granted') subscribePush();
  toast(p === 'granted' ? 'Gentle nudges are on' : 'Reminders are blocked. You can allow them in your browser\u2019s site settings.');
  return p === 'granted';
}

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
const PERK = '<svg viewBox="0 0 24 24" fill="none" stroke="#5E7A53" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
register('paywall', (p) => {
  let plan = 'yearly';
  const info = trialInfo();
  const locked = info.status === 'locked';
  const day7 = p.from === 'day7' || info.status === 'day7';
  const cards = h('div.plans', { role: 'radiogroup', 'aria-label': 'Plan' });
  const note = h('p.fine.gst.center');
  const cta = primary('', () => go('checkout', { plan }));
  const save = Math.round((1 - PLANS.yearly.price / (PLANS.monthly.price * 12)) * 100);
  const draw = () => {
    cards.replaceChildren(...[PLANS.monthly, PLANS.yearly].map((pl) => h('button.plan' + (plan === pl.id ? '.on' : '') + (pl.best ? '.best' : ''), { role: 'radio', 'aria-checked': String(plan === pl.id), 'aria-pressed': String(plan === pl.id), onClick: () => { plan = pl.id; draw(); } },
      pl.best ? h('span.badge', 'Best value') : null,
      h('span.plan-name', pl.name),
      h('span.plan-price', '₹' + pl.price),
      h('span.plan-note', pl.id === 'monthly' ? 'per month' : `₹${Math.round(pl.price / 12)} a month · save ${save}%`))));
    cta.textContent = `Continue with ${plan}`;
    note.textContent = account.settings.gst ? 'Prices shown without GST. 18% GST is added at checkout.' : '';
  };
  draw();
  const picks = [...store.tales].sort((a, b) => b.createdAt - a.createdAt).slice(0, 3);
  const demo = ['everyday-lake', 'everyday-hiker', 'everyday-books'].map((n, i) => ({ date: addDays(todayStr(), -i), photo: samplePhoto(n), light: 'none' }));
  const three = [0, 1, 2].map((i) => picks[i] || demo[i]);
  return h('div.paywall',
    h('div.pw-band', { 'aria-hidden': 'true' }),
    h('div.topbar', locked ? h('button.icon-btn', { 'aria-label': 'Back', onClick: () => back('locked'), html: icon.back }) : (day7 ? h('span.topbar-spacer') : h('button.icon-btn', { 'aria-label': 'Back', onClick: () => back('account'), html: icon.back }))),
    h('div.pw-stamps', { 'aria-hidden': 'true' },
      h('div.pws.a', stampEl(three[1], { size: '9.6px', postmark: false })),
      h('div.pws.b', stampEl(three[2], { size: '9.6px', postmark: false })),
      h('div.pws.c', stampEl(three[0], { size: '11.6px' }))),
    h('div.pw-head',
      h('h1', 'Keep your tales forever'),
      h('p', day7 ? 'Your free week ends tonight. Your week, saved. Every week after, too.' : locked ? 'Your tales are waiting. Subscribe to unlock them.' : 'Your week, saved. Every week after, too.')),
    h('ul.perks', ...['Your calendar stays open, always', 'A little film of your week, every Sunday', 'Download everything, any time'].map((t) => h('li', h('span.perk-ic', { html: PERK }), t))),
    cards, note,
    h('div.bottom',
      cta,
      day7 ? linkBtn('Maybe later', () => go('calendar', {}, { replace: true })) : null,
      h('p.fine.center', auth.provider === 'supabase' ? 'Cancel any time from Me.' : 'Cancel any time. Practice mode: no real payment is taken yet.')));
});

register('checkout', (p) => {
  const plan = PLANS[p.plan] || PLANS.yearly;
  const total = withGst(plan.price), gst = Math.round((total - plan.price) * 100) / 100;
  let method = 'upi';
  const fields = h('div.pay-fields');
  const err = h('p.pay-err');
  const payBtn = primary(`Pay ${rupees(total)}`, async () => {
    if (real) {
      payBtn.disabled = true; payBtn.textContent = 'Opening…'; err.textContent = '';
      try { const r = await payOnline(plan.id); if (r === 'paid') go('success', { plan: plan.id }, { replace: true }); }
      catch (e) { err.textContent = e.message; }
      payBtn.disabled = false; payBtn.textContent = `Pay ${rupees(total)}`; return;
    }
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
  const real = auth.provider === 'supabase';
  const draw = () => {
    if (real) { fields.replaceChildren(h('p.fine', 'You’ll pay on a secure page by card, UPI or wallet. We never see or store your payment details.')); return; }
    fields.replaceChildren(...(method === 'upi'
      ? [h('label', 'UPI ID', h('input', { type: 'text', inputmode: 'email', autocomplete: 'off', placeholder: 'name@bank', 'aria-label': 'UPI ID' })), h('p.fine', 'You’ll approve the monthly or yearly auto-pay in your UPI app.')]
      : [h('label', 'Card number', h('input', { type: 'text', inputmode: 'numeric', autocomplete: 'off', placeholder: '1234 5678 9012 3456', 'aria-label': 'Card number' })),
        h('div.two', h('label', 'Expiry', h('input', { type: 'text', inputmode: 'numeric', autocomplete: 'off', placeholder: 'MM/YY', 'aria-label': 'Expiry' })), h('label', 'Code', h('input', { type: 'password', inputmode: 'numeric', autocomplete: 'off', placeholder: '123', 'aria-label': 'Security code' })))]));
  };
  const tabs = h('div.paytabs');
  const drawTabs = () => tabs.replaceChildren(...[['upi', 'UPI AutoPay'], ['card', 'Card']].map(([k, l]) => h('button.paytab' + (method === k ? '.on' : ''), { onClick: () => { method = k; err.textContent = ''; drawTabs(); draw(); } }, l)));
  if (real) tabs.hidden = true; else drawTabs();
  draw();
  return h('div.checkout',
    topBar(),
    h('h1', 'Almost ', h('em', 'there')),
    h('div.summary.glass-card',
      h('div.srow', h('span', `Little Tales ${plan.name}`), h('b', rupees(plan.price))),
      account.settings.gst ? h('div.srow.sub', h('span', 'GST (18%)'), h('span', rupees(gst))) : null,
      h('div.srow.total', h('span', 'Total today'), h('b', rupees(total)))),
    real ? null : h('div.practice', h('b', 'Practice mode.'), ' Nothing is charged, and nothing you type here is saved.'),
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
const ENVELOPE_BIG = '<svg viewBox="0 0 150 104" aria-hidden="true"><rect x="2" y="2" width="146" height="100" rx="5" fill="#C6DBEE" stroke="#A3BFDA" stroke-width="1.2"/><path d="M2 102 60 50M148 102 90 50" fill="none" stroke="#A3BFDA" stroke-width="1.2"/><path d="M2 4l73 50 73-50" fill="#D3E3F2" stroke="#A3BFDA" stroke-width="1.2"/></svg>';
const WAX = '<svg viewBox="0 0 100 100" aria-hidden="true"><defs><radialGradient id="lkWax" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#F6DC8C"/><stop offset=".55" stop-color="#D6A445"/><stop offset="1" stop-color="#A9782A"/></radialGradient></defs><path d="M50 4c8 0 12 5 19 6s13 7 15 14 7 12 6 20 3 13 0 20-10 10-14 16-12 8-20 8-14-3-20-6-13-7-16-14-6-12-6-20 1-14 6-20 8-12 15-16S42 4 50 4z" fill="url(#lkWax)"/><circle cx="50" cy="50" r="30" fill="none" stroke="#B9862F" stroke-width="2.5"/><g stroke="#8E6420" stroke-width="2.4" stroke-linecap="round" fill="none"><circle cx="50" cy="50" r="13"/><path d="M50 28v6M50 66v6M28 50h6M66 50h6M34.5 34.5l4 4M61.5 61.5l4 4M65.5 34.5l-4 4M38.5 61.5l-4 4"/><path d="M44 47.5q2-2 4 0M52 47.5q2-2 4 0M45 55q5 4 10 0"/></g></svg>';
register('locked', () => {
  const info = trialInfo();
  const n = store.tales.length;
  const left = info.holdLeft ?? 0;
  const deleted = info.status === 'deleted';
  const urgent = left <= 1 ? 'Last day. Subscribe today to keep every tale.' : left <= 7 ? `Only ${left} days left to keep your tales.` : null;
  const first = store.tales[0];
  return h('div.locked',
    h('div.lock-band', { 'aria-hidden': 'true' }),
    h('div.topbar', h('span.topbar-spacer'), h('div.topbar-right', h('button.icon-btn', { 'aria-label': 'Me', onClick: () => go('account'), html: icon.user }))),
    h('div.lock-stage', { 'aria-hidden': 'true' },
      first ? h('div.lock-stamp', stampEl(first, { size: '11.6px', postmark: false })) : null,
      h('div.lock-env', { html: ENVELOPE_BIG }), h('div.lock-wax', { html: WAX })),
    deleted
      ? [h('div.lock-copy', h('h1', 'Your tales were deleted'), h('p.lead', `After ${HOLD_DAYS} days without a subscription, locked tales are permanently removed. You can start again with a fresh album any time.`))]
      : [h('div.lock-copy', h('h1', 'Your tales are safe'), h('p.lead', `Your free week has ended. We’ve sealed your ${n} ${n === 1 ? 'tale' : 'tales'} and we’ll keep them for you while you decide.`)),
        h('section.lock-card', h('div.lc-top', h('span.kicker', 'Kept for you'), h('b', `${left} ${left === 1 ? 'day' : 'days'} left`)),
          h('div.meter', { role: 'progressbar', 'aria-label': 'Days left', 'aria-valuemin': 0, 'aria-valuemax': HOLD_DAYS, 'aria-valuenow': left }, h('i', { style: { width: Math.max(4, (left / HOLD_DAYS) * 100) + '%' } })),
          h('p.fine', urgent ? urgent + ' ' : '', `After ${HOLD_DAYS} days they’re deleted for good. We’ll email you 7 days and 1 day before.`))],
    h('div.bottom', deleted
      ? (auth.provider === 'supabase'
        ? primary('See plans', () => go('paywall', { from: 'locked' }))
        : primary('Start a new album', async () => { await resetDemo(); go('welcome', {}, { replace: true }); }))
      : [primary('See plans', () => go('paywall', { from: 'locked' })), secondary('Download my tales', subscribeToDownload)]));
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
  const canDownload = info.status === 'subscribed';
  const name = (auth.user?.name || '').trim().split(/\s+/)[0] || 'Signed in';
  const endsOn = info.status === 'trial' || info.status === 'day7' ? addDays(account.firstSignIn, TRIAL_DAYS - 1) : null;
  const kick = { trial: `FREE WEEK · DAY ${info.day} OF ${TRIAL_DAYS}`, day7: 'FREE WEEK · LAST DAY', locked: 'LOCKED', deleted: 'LOCKED', subscribed: 'MEMBER', new: 'NOT STARTED' }[info.status];
  const planText = info.status === 'subscribed' ? h('strong', `Little Tales ${PLANS[sub?.plan]?.name || ''}`, h('br'), `since ${longDate(sub.since)}`)
    : endsOn ? h('strong', 'Your free week ends', h('br'), longDate(endsOn).replace(/ \d{4}$/, '') + '.')
    : h('strong', info.status === 'locked' ? 'Your tales are safe for now.' : 'Pick a plan to continue.');
  const planBtn = info.status === 'subscribed'
    ? h('button.pc-btn.quiet', { onClick: () => confirmSheet('Cancel your subscription?', 'You can subscribe again any time. If your calendar locks, your tales are kept for 30 days.', 'Cancel subscription', async () => { if (auth.provider === 'supabase') { try { await cancelOnline(); } catch (e) { toast(e.message); return; } } else await cancelSubscription(); toast(auth.provider === 'supabase' ? 'Renewals stopped. You keep access until your plan ends.' : 'Subscription cancelled'); go('account', {}, { replace: true }); }) }, 'Cancel')
    : h('button.pc-btn', { onClick: () => go('paywall', { from: 'account' }) }, 'See plans');
  const sw = (on, label, onClick) => h('button.switch' + (on ? '.on' : ''), { role: 'switch', 'aria-checked': String(on), 'aria-label': label, onClick }, h('i'));
  const row = (label, sub2, right, onClick) => h('button.arow', { onClick }, h('span.arow-t', h('b', label), sub2 ? h('small', sub2) : null), right);
  const chev = () => h('span.arow-go', { html: icon.chevR });
  const soundOn = account.settings.sound !== false;
  const nudgesOn = !!account.notify.granted;
  return h('div.account',
    h('h1.page-title', 'Me'),
    h('div.profile', h('div.avatar', ((auth.user?.name || auth.user?.email || 'L')[0]).toUpperCase()), h('div', h('strong', name), h('p', auth.user?.email || ''))),
    h('div.plan-card', h('div.pc-copy', h('p.kicker', kick), planText), planBtn),
    h('h2.group-label', 'Settings'),
    h('div.alist',
      row('Gentle nudges', nudgesOn ? 'Around 1 pm and 8 pm' : 'Off. Tap to turn on', sw(nudgesOn, 'Gentle nudges', null), async () => { if (nudgesOn) { toast('To turn reminders off, use your browser’s site settings.'); return; } if (await turnOnNudges()) go('account', {}, { replace: true }); }),
      row('Sound and vibration', 'Little chimes when you post', sw(soundOn, 'Sound and vibration', null), async () => { account.settings.sound = account.settings.sound === false; await saveAccount(); go('account', {}, { replace: true }); }),
      canOfferInstall() ? row('Add to Home Screen', 'Open it like an app', chev(), addToHomeScreen) : null,
      row('Download my tales', canDownload ? 'Every photo, note and voice' : 'Available while you’re subscribed', chev(), canDownload ? downloadScrapbook : subscribeToDownload)),
    h('div.alist.links',
      h('a.arow', { href: 'terms.html', onClick: (e) => { e.preventDefault(); go('legal', { doc: 'terms' }); } }, h('span.arow-t', h('b', 'Terms')), chev()),
      h('a.arow', { href: 'privacy.html', onClick: (e) => { e.preventDefault(); go('legal', { doc: 'privacy' }); } }, h('span.arow-t', h('b', 'Privacy')), chev()),
      h('a.arow', { href: 'mailto:hellolittletales@gmail.com' }, h('span.arow-t', h('b', 'Help · hellolittletales@gmail.com')), chev())),
    h('div.acct-actions',
      h('button.btn-secondary', { onClick: async () => { const doIt = async () => { await signOut(); state.month = null; go('welcome', {}, { replace: true }); toast('Signed out'); }; const n = await pendingCount(); if (!n) return doIt(); confirmSheet(n === 1 ? 'One tale hasn\u2019t been saved online yet' : `${n} tales haven\u2019t been saved online yet`, 'They are waiting for an internet connection. If you sign out now they will be lost. Connect to the internet, wait a moment, then try again.', 'Sign out anyway', doIt); } }, 'Sign out'),
      h('button.btn-danger-ghost', { onClick: () => confirmSheet('Delete your account and all tales?', 'Everything is removed from this phone for good. This can’t be undone.', 'Delete everything', async () => { try { await deleteAccountOnline(); } catch (e) { toast('Couldn’t reach the server. Try again when you are online.'); return; } await purgeAllTales(); await resetDemo(); state.month = null; go('welcome', {}, { replace: true }); toast('Your account was deleted'); }) }, 'Delete my account')),
    h('p.fine.center', 'Private by default. Your photos, voice notes and thoughts are never used for ads and are never shared.'));
});

function subscribeToDownload() {
  const close = sheet(h('div.confirm', h('h2', 'Download is for members'),
    h('p', 'Subscribers can download their whole scrapbook any time: photos, voice notes and words in one file.'),
    primary('See plans', () => { close(); go('paywall', { from: 'account' }); }),
    linkBtn('Not now', () => close())));
}

function confirmSheet(title, body, action, run) {
  const close = sheet(h('div.confirm', h('h2', title), h('p', body),
    h('button.btn-danger', { onClick: async () => { close(); await run(); } }, action),
    linkBtn('Keep things as they are', () => close())));
}

// Terms and Privacy are read inside the app (a home-screen app has no browser bar to come back from).
register('legal', (p) => {
  const doc = p.doc === 'privacy' ? 'privacy' : 'terms';
  const body = h('div.legal-body', h('p.fine', 'Opening…'));
  fetch(doc + '.html').then((r) => { if (!r.ok) throw 0; return r.text(); }).then((txt) => {
    const main = new DOMParser().parseFromString(txt, 'text/html').querySelector('main');
    main?.querySelector('a.top')?.remove();
    if (!main) throw 0;
    body.replaceChildren(...Array.from(main.childNodes).map((n) => document.importNode(n, true)));
  }).catch(() => body.replaceChildren(h('p', 'We couldn’t load this page right now. Please check your internet and try again, or open '), h('a', { href: doc + '.html', target: '_blank', rel: 'noopener' }, 'it in your browser'), '.'));
  return h('div.legal', h('div.topbar', h('button.icon-btn', { 'aria-label': 'Back', onClick: () => back(), html: icon.back }), h('div.topbar-title', doc === 'privacy' ? 'Privacy' : 'Terms'), h('span.topbar-spacer')), body);
});
