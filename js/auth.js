// Sign-in. Two providers behind one small interface, so the screens never change:
//  - "demo": for development and previews (no server). Any email works; the code is 123456.
//  - "supabase": real Google sign-in and email codes. Switched on automatically when js/config.js is filled in.
import { CONFIG, ONLINE, CODE_LENGTH, GOOGLE_CLIENT_ID } from './config.js';
import { store } from './store.js';

export const DEMO_CODE = '1234567890'.slice(0, CODE_LENGTH);
export const auth = { provider: ONLINE ? 'supabase' : 'demo', user: null, ready: false, error: null, diag: [] };
// ONE shared sign-in client for the whole app (two clients refreshing the same saved sign-in at the same moment can lock a member out).
let sbPromise = null;
function supabase() {
  if (window.__SB_MOCK) return Promise.resolve(window.__SB_MOCK);          // tests only
  return (sbPromise ||= (async () => {
    const { createClient } = await import('@supabase/supabase-js');
    return createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  })().catch((e) => { sbPromise = null; throw e; }));
}
// A short diary of sign-in events kept on the phone, so "why was I signed out?" can be answered from the Show details panel.
const LOG_KEY = 'lt-auth-log';
export function authLog(msg) {
  try { const a = JSON.parse(localStorage.getItem(LOG_KEY) || '[]'); a.push(new Date().toISOString().slice(5, 19).replace('T', ' ') + ' ' + msg); localStorage.setItem(LOG_KEY, JSON.stringify(a.slice(-20))); } catch {}
}
export const authLogText = () => { try { return JSON.parse(localStorage.getItem(LOG_KEY) || '[]').join('\n'); } catch { return ''; } };
const TOKEN_KEY = () => 'sb-' + new URL(CONFIG.SUPABASE_URL).hostname.split('.')[0] + '-auth-token';
export const client = supabase;
const toUser = (u) => (u ? { id: u.id, email: u.email, name: u.user_metadata?.full_name || u.user_metadata?.name || '' } : null);

// When Google or Supabase turns a sign-in down, they send the person back with the reason in the address. Read it so we can say it plainly.
function readReturnError() {
  const q = new URLSearchParams(location.search), hs = new URLSearchParams(location.hash.replace(/^#/, ''));
  const code = q.get('error_code') || hs.get('error_code') || q.get('error') || hs.get('error');
  const desc = q.get('error_description') || hs.get('error_description');
  if (!code && !desc) return null;
  return (desc || code).replace(/\+/g, ' ');
}
const friendly = (m) => /exchange external code|invalid_client|unauthorized_client/i.test(m) ? 'Google sign-in is not fully set up yet (Supabase could not confirm the Google client). ' + m
  : /redirect/i.test(m) ? 'This web address is not allowed yet in Supabase (URL Configuration). ' + m
  : /access_denied/i.test(m) ? 'Google sign-in was cancelled or this account is not allowed to test the app yet. ' + m : m;

// The sign-in the phone remembers (written by the Supabase library). Reading it takes no network, so the app can open instantly.
const storedSession = () => {
  try {
    const raw = localStorage.getItem(TOKEN_KEY());
    const s = raw && JSON.parse(raw);
    return s && s.refresh_token && s.user ? s : null;
  } catch { return null; }
};
const comingBackFromSignIn = () => /[?&]code=/.test(location.search) || /access_token|refresh_token|error_description/.test(location.hash) || /[?&]error/.test(location.search);

export async function initAuth() {
  if (auth.provider === 'supabase' && !window.__SB_MOCK) {
    const names = [...new URLSearchParams(location.search).keys(), ...new URLSearchParams(location.hash.replace(/^#/, '')).keys()];
    auth.diag.push('Address on arrival: ' + location.origin + location.pathname + (names.length ? '  (carried: ' + names.join(', ') + ')' : '  (nothing carried)'));
    const raw = readReturnError();
    if (raw) { auth.error = friendly(raw); console.warn('Sign-in returned an error:', raw); }
    // If the phone cleared its small saved-sign-in note but kept our own backup copy, put it back (the library then renews it as usual).
    try {
      if (!localStorage.getItem(TOKEN_KEY())) {
        const bk = await store.getMeta('authBackup');
        if (bk) { localStorage.setItem(TOKEN_KEY(), bk); authLog('Saved sign-in restored from backup'); auth.diag.push('Saved sign-in restored from the backup copy'); }
      }
    } catch {}
    const remembered = storedSession();
    const listen = (c) => c.auth.onAuthStateChange((event, session) => {
      auth.diag.push('Event: ' + event + (session ? ' (signed in)' : ''));
      authLog(event + (session ? ' ok' : ' no session'));
      try { store.setMeta('authBackup', session ? JSON.stringify(session) : null); } catch {}
      auth.user = toUser(session?.user);
      auth.onChange?.(event, auth.user);
    });
    if (remembered && !comingBackFromSignIn()) {
      // A saved sign-in exists: open straight into the album. The Supabase library renews it in the background (and keeps it if the signal is weak).
      auth.user = toUser(remembered.user); auth.optimistic = true;
      auth.diag.push('Saved sign-in found: yes (' + auth.user.email + ') opened instantly');
      supabase().then((c) => { listen(c); return c.auth.getSession(); })
        .then(({ data }) => { if (data?.session) auth.user = toUser(data.session.user); })
        .catch((e) => console.warn('Background sign-in check', e));
    } else if (!remembered && !comingBackFromSignIn() && !Object.keys(localStorage).some((k) => k.startsWith('sb-'))) {
      // Nothing remembered on this phone (for example a freshly installed home screen app): show the sign-in at once, load the library behind it.
      auth.diag.push('Saved sign-in found: no (nothing stored on this phone)');
      supabase().then(listen).catch((e) => console.warn('Sign-in library', e));
    } else {
      const c = await supabase();
      const got = await Promise.race([c.auth.getSession(), new Promise((r) => setTimeout(() => r({ data: null, error: { message: 'slow connection' } }), 8000))]);
      if (got.error) { if (got.error.message !== 'slow connection') auth.error = auth.error || friendly(got.error.message); console.warn('getSession', got.error); }
      auth.user = toUser(got.data?.session?.user);
      auth.diag.push('Saved sign-in found: ' + (auth.user ? 'yes (' + auth.user.email + ')' : 'no') + (got.error ? '  error: ' + got.error.message : ''));
      if (!auth.user && !raw && names.some((n) => ['access_token', 'code', 'refresh_token'].includes(n))) auth.error = 'Google sent you back, but the app could not finish signing you in. Details below.';
      if (raw || location.hash.includes('access_token') || /[?&]code=/.test(location.search)) { try { history.replaceState(null, '', location.pathname); } catch {} }
      listen(c);
    }
  } else if (auth.provider === 'supabase') {                       // (the test fake)
    const raw = readReturnError();
    if (raw) { auth.error = friendly(raw); try { history.replaceState(null, '', location.pathname); } catch {} }
    const c = await supabase();
    const { data } = await c.auth.getSession();
    auth.user = toUser(data?.session?.user);
    c.auth.onAuthStateChange((event, session) => { auth.user = toUser(session?.user); auth.onChange?.(event, auth.user); });
  } else {
    auth.user = (await store.getMeta('demoUser')) || null;
  }
  auth.ready = true;
  return auth.user;
}

export async function signInWithGoogle() {
  if (auth.provider === 'supabase') {
    const c = await supabase();
    const { error } = await c.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + location.pathname } });
    if (error) throw error;
    return null; // the browser leaves for Google and comes back signed in
  }
  auth.user = { id: 'demo-google', email: 'demo.member@gmail.com', name: 'Demo Member' };
  await store.setMeta('demoUser', auth.user);
  return auth.user;
}

export async function sendEmailCode(email) {
  if (auth.provider === 'supabase') {
    const c = await supabase();
    const { error } = await c.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
    if (error) throw new Error(/rate limit|too many|seconds/i.test(error.message) ? 'Too many codes were requested. Please wait a few minutes and try again.' : error.message);
    return true;
  }
  return true;
}

export async function verifyEmailCode(email, code) {
  if (auth.provider === 'supabase') {
    const c = await supabase();
    auth.manual = true;
    try {
      const { data, error } = await c.auth.verifyOtp({ email, token: code, type: 'email' });
      if (error) throw error;
      auth.user = toUser(data.user);
      await auth.afterSignIn?.();
      return auth.user;
    } finally { setTimeout(() => { auth.manual = false; }, 1500); }
  }
  if (code !== DEMO_CODE) throw new Error('That code isn’t right. Check it and try again.');
  auth.user = { id: 'demo-' + email.toLowerCase(), email: email.toLowerCase(), name: '' };
  await store.setMeta('demoUser', auth.user);
  return auth.user;
}

export async function signOut() {
  if (auth.provider === 'supabase') { auth.manualSignOut = true; await auth.beforeSignOut?.(); const c = await supabase(); await c.auth.signOut(); setTimeout(() => { auth.manualSignOut = false; }, 1500); }
  else await store.setMeta('demoUser', null);
  auth.user = null;
}

// Google's own sign-in button hands us a signed token; Supabase checks it and signs the member in (no supabase.co page is ever shown).
export const googleClientId = () => window.__GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID;
export const googleButtonAvailable = () => auth.provider === 'supabase' && !!googleClientId();
export async function signInWithGoogleToken(token, nonce) {
  const c = await supabase();
  auth.manual = true;
  try {
    const { data, error } = await c.auth.signInWithIdToken({ provider: 'google', token, nonce });
    if (error) throw error;
    auth.user = toUser(data.user);
    await auth.afterSignIn?.();
    return auth.user;
  } finally { setTimeout(() => { auth.manual = false; }, 1500); }
}
