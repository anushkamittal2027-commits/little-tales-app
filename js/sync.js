// Online saving. The phone keeps its own copy (so the app is instant and works offline) and this file
// mirrors it to Supabase: tales, photos, voice notes, the free-week dates and the subscription.
// Every change is first written on the phone, then queued ("outbox") and sent when there is a connection.
// Practice mode (no server): this file does nothing.
import { store } from './store.js';
import { account, saveAccount, resetAccountLocal, trialInfo } from './account.js';
import { auth, client } from './auth.js';
import { toDateStr, setDayOffset } from './util.js';
import { FOUNDER_EMAILS } from './config.js';

export const isFounder = () => auth.provider !== 'supabase' || FOUNDER_EMAILS.includes((auth.user?.email || '').toLowerCase());
const online = () => auth.provider === 'supabase' && !!auth.user;
// Only a clear "no" from our own database rules is final. Network trouble, throttling (429), timeouts (408) and server errors are tried again later.
const RULE_ERRORS = ['P0001', '42501', '23514', '22001', '22P02', '23502', '23503'];
const permanent = (e) => !!(e && RULE_ERRORS.includes(String(e.code)));

// ---- helpers ----
const dataUrlToBlob = async (u) => (await fetch(u)).blob();
const blobToDataUrl = (b) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(r.error); r.readAsDataURL(b); });
const extOf = (blob) => ((blob.type || '').includes('mp4') ? 'm4a' : (blob.type || '').includes('ogg') ? 'ogg' : (blob.type || '').includes('wav') ? 'wav' : 'webm');

// ---- the outbox: what still has to be sent ----
async function getBox() { return (await store.getMeta('outbox')) || {}; }
async function setBox(b) { await store.setMeta('outbox', b); }
async function queueQuiet(id) { const b = await getBox(); b[id] = 'put'; await setBox(b); }
async function queue(id, op) { const b = await getBox(); b[id] = op; await setBox(b); flush(); }

let epoch = 0;          // goes up when this phone is wiped, so a send that was already in flight cannot put a tale back afterwards
let running = null, again = false;
export function flush() {
  if (!online()) return Promise.resolve();
  if (running) { again = true; return running; }
  running = (async () => {
    do {
      again = false;
      const box = await getBox();
      for (const [id, op] of Object.entries(box)) {
        try {
          if (op === 'del') await pushDelete(id); else await pushTale(id);
          const now = await getBox(); if (now[id] === op) { delete now[id]; await setBox(now); }
        } catch (e) {
          if (permanent(e)) {                       // e.g. the server's rules say no: do not retry in a loop, but keep a note to try once at the next start
            console.warn('Server refused', id, e.message || e);
            const now = await getBox(); delete now[id]; await setBox(now);
            const failed = (await store.getMeta('failed')) || []; if (!failed.includes(id) && op === 'put') { failed.push(id); await store.setMeta('failed', failed); }
          } else { console.warn('Offline or busy, will retry', e.message || e); return; }
        }
      }
    } while (again);
  })().finally(() => { running = null; });
  return running;
}
window.addEventListener?.('online', () => flush());

// How many tales on this phone have not reached the server yet (used before signing out).
export async function pendingCount() {
  if (!online()) return 0;
  await flush().catch(() => {});
  const box = await getBox();
  return Object.entries(box).filter(([id, op]) => op === 'put' && store.byId(id) && !store.byId(id).sample).length;
}

async function pushTale(id) {
  const ep = epoch;
  const t = store.byId(id); if (!t || t.sample) return;
  const c = await client(), uid = auth.user.id, remote = t.remote || {};
  const up = async (bucket, path, blob) => { const { error } = await c.storage.from(bucket).upload(path, blob, { upsert: true, contentType: blob.type || undefined }); if (error) throw error; };
  const next = { ...remote };
  if (t.photo && remote.photo !== t.photo.length) { await up('photos', `${uid}/${id}.jpg`, await dataUrlToBlob(t.photo)); next.photo = t.photo.length; }
  if (t.thumb && remote.thumb !== t.thumb.length) { await up('photos', `${uid}/${id}-thumb.jpg`, await dataUrlToBlob(t.thumb)); next.thumb = t.thumb.length; }
  let audioPath = remote.audioPath || null;
  if (t.audio && remote.audio !== t.audio.size) { audioPath = `${uid}/${id}.${extOf(t.audio)}`; await up('voices', audioPath, t.audio); next.audio = t.audio.size; next.audioPath = audioPath; }
  if (!t.audio && audioPath) { await c.storage.from('voices').remove([audioPath]); audioPath = null; next.audio = 0; next.audioPath = null; }
  const row = {
    id, user_id: uid, tale_date: t.date, title: t.title || '', thought: t.thought || '', light: t.light || 'golden',
    decorations: t.decorations || [], photo_path: `${uid}/${id}.jpg`, thumb_path: t.thumb ? `${uid}/${id}-thumb.jpg` : null,
    audio_path: audioPath, audio_seconds: t.audio ? t.audioDur || 0 : null, created_at: new Date(t.createdAt).toISOString(),
  };
  let { error } = await c.from('tales').upsert(row);
  // the database allowing the "original" light is migration 004; until it has been run, keep the tale safe online with the nearest look
  if (error && error.code === '23514' && row.light === 'none') ({ error } = await c.from('tales').upsert({ ...row, light: 'golden' }));
  if (error) throw error;
  if (ep !== epoch) return;                  // this phone was wiped while we were sending: do not put the tale back
  t.remote = next;
  await store.save(t, { local: true });
}

async function pushDelete(id) {
  const c = await client(), uid = auth.user.id;
  const { error } = await c.from('tales').delete().eq('id', id);
  if (error) throw error;
  const { data } = await c.storage.from('voices').list(uid);
  await c.storage.from('photos').remove([`${uid}/${id}.jpg`, `${uid}/${id}-thumb.jpg`]);
  const voices = (data || []).filter((f) => f.name.startsWith(id + '.')).map((f) => `${uid}/${f.name}`);
  if (voices.length) await c.storage.from('voices').remove(voices);
}

// ---- pulling what is online onto this phone ----
export async function pullTales() {
  if (!online()) return;
  const c = await client(), uid = auth.user.id;
  const rows = []; let error = null;
  for (let from = 0; ; from += 1000) {                               // the server hands over at most 1000 rows at a time
    const r = await c.from('tales').select('*').order('created_at').range(from, from + 999);
    if (r.error) { error = r.error; break; }
    rows.push(...(r.data || [])); if ((r.data || []).length < 1000) break;
  }
  if (error) { console.warn('Could not load tales', error.message); return; }
  const box = await getBox();
  const have = new Map(store.tales.map((t) => [t.id, t]));
  const dl = async (bucket, path) => { const { data, error: e } = await c.storage.from(bucket).download(path); if (e) throw e; return data; };
  for (const r of rows) {
    if (box[r.id]) continue;                                                   // we have newer changes waiting to be sent
    const local = have.get(r.id);
    const stamp = new Date(r.updated_at || r.created_at).getTime();
    if (local && local.remoteUpdated === stamp) continue;                       // already up to date
    try {
      const t = local || { id: r.id, createdAt: new Date(r.created_at).getTime() };
      Object.assign(t, { date: r.tale_date, title: r.title, thought: r.thought, light: r.light || 'golden', decorations: r.decorations || [], audioDur: Number(r.audio_seconds) || 0, remoteUpdated: stamp });
      const photoBlob = await dl('photos', r.photo_path);
      t.photo = await blobToDataUrl(photoBlob);
      t.thumb = r.thumb_path ? await blobToDataUrl(await dl('photos', r.thumb_path)) : undefined;
      t.audio = r.audio_path ? await dl('voices', r.audio_path) : null;
      t.remote = { photo: t.photo.length, thumb: t.thumb ? t.thumb.length : undefined, audio: t.audio ? t.audio.size : 0, audioPath: r.audio_path || null };
      await store.save(t, { local: true });
    } catch (e) { console.warn('Could not fetch a tale', r.id, e.message || e); }
  }
  // tales deleted on another phone disappear here too (not while locked: then the server hides them from us, they are not deleted)
  if (['locked', 'deleted'].includes(trialInfo().status)) return;
  const ids = new Set(rows.map((r) => r.id));
  for (const t of [...store.tales]) if (!t.sample && !ids.has(t.id) && !box[t.id] && t.remote) await store.remove(t.id, { local: true });
}

// ---- the account (free week dates, consent, subscription) is decided on the server ----
export async function pullAccount() {
  if (!online()) return;
  const c = await client(), uid = auth.user.id;
  // the two small lookups go out together (not one after the other)
  const [{ data: p, error }, { data: sub }] = await Promise.all([
    c.from('profiles').select('*').eq('id', uid).maybeSingle(),
    c.from('subscriptions').select('*').eq('user_id', uid).maybeSingle(),
  ]);
  if (error) { console.warn('Could not load account', error.message); return; }
  if (p && p.consented_at && p.first_sign_in) { account.consented = true; account.firstSignIn = p.first_sign_in; }
  else { account.consented = false; account.firstSignIn = null; }
  if (!isFounder()) { account.dayOffset = 0; setDayOffset(0); }           // time travel is a founder tool: everyone else always lives in real time
  account.subscription = sub && sub.status === 'active' ? { plan: sub.plan, since: toDateStr(new Date(sub.started_at)) } : null;
  await saveAccount();
}

const timeZone = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata'; } catch { return 'Asia/Kolkata'; } };

export async function startTrialOnline() {
  if (!online()) return;
  const c = await client();
  const { error } = await c.rpc('start_trial', { p_tz: timeZone() });
  if (error) throw error;
  await pullAccount();
}

export async function logAttemptOnline(date) {
  if (!online()) return;
  try { const c = await client(); await c.rpc('log_limit_attempt', { p_date: date }); } catch (e) { console.warn('Attempt not logged', e.message || e); }
}

export async function savePushOnline(sub) {
  if (!online() || !sub) return;
  try {
    const j = sub.toJSON ? sub.toJSON() : sub; const c = await client();
    await c.from('push_subscriptions').upsert({ user_id: auth.user.id, endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth }, { onConflict: 'endpoint' });
    await c.from('profiles').update({ notify_push: true }).eq('id', auth.user.id);   // the server only nudges members who turned reminders on
  } catch (e) { console.warn('Reminders not saved', e.message || e); }
}

export async function deleteAccountOnline() {
  if (!online()) return;
  const c = await client();
  const { error } = await c.functions.invoke('delete-account');
  if (error) throw error;
  await c.auth.signOut().catch(() => {});
}

// ---- when someone signs in (or the app opens while signed in) ----
// Only the account (a few bytes) is waited for, so signing in is quick. Tales, photos and voice notes follow in the background.
export const hooks = { talesArrived: null };
export const syncState = { pulling: false };      // true while tales are still arriving from the server (screens show placeholders)
export async function onSignedIn() {
  if (!online()) { syncState.pulling = false; return; }
  const owner = await store.getMeta('owner');
  if (owner && owner !== auth.user.id) await wipeLocal();       // a different member used this phone before: never mix people
  await store.setMeta('owner', auth.user.id);
  await pullAccount();
  for (const id of (await store.getMeta('failed')) || []) if (store.byId(id)) await queueQuiet(id);
  await store.setMeta('failed', []);
  (async () => { try { await flush(); await pullTales(); } catch (e) { console.warn('Background sync', e); } syncState.pulling = false; hooks.talesArrived?.(); })();
}

// Remove everything this phone holds about the member (sign out on a shared phone).
export async function wipeLocal() {
  epoch++;
  await store.clearAll();
  await resetAccountLocal();
}

// Connect the store and account to this file. Called once at start.
export function install() {
  store.hooks.save = (t) => { if (online() && !t.sample) queue(t.id, 'put'); };
  store.hooks.remove = (t) => { if (online() && t && !t.sample) queue(t.id, 'del'); };
}
