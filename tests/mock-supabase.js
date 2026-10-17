// A tiny pretend Supabase for tests: same calls as the real one, kept in this browser's localStorage so a reload
// (or a "new phone" with its own empty storage) sees the same server. It also copies the database rules we rely on.
(() => {
  const KEY = 'mockdb';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
  const db = () => Object.assign({ users: {}, profiles: {}, tales: {}, subs: {}, files: {}, attempts: [], session: null, fail: false }, load());
  const save = (d) => localStorage.setItem(KEY, JSON.stringify(d));
  const b2d = (b) => new Promise((r) => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(b); });
  const d2b = async (u) => (await fetch(u)).blob();
  const ok = (data) => ({ data, error: null });
  const err = (message, code = 'P0001') => ({ data: null, error: { message, code } });
  const me = () => db().session;
  const today = (tz) => new Date().toLocaleDateString('en-CA', { timeZone: tz });
  const q = (table) => {
    const st = { table, filters: [], op: 'select', row: null, order: null };
    const run = () => {
      const d = db(), uid = me()?.id;
      if (d.fail) return { data: null, error: { message: 'Failed to fetch' } };
      if (!uid) return err('not signed in', '42501');
      if (table === 'tales') {
        if (st.op === 'upsert') {
          const r = st.row, ex = d.tales[r.id];
          if (!ex) {
            const n = Object.values(d.tales).filter((t) => t.user_id === uid && t.tale_date === r.tale_date).length;
            if (n >= 3) return err('DAILY_LIMIT: 3 little tales already kept');
            if (r.tale_date > today(d.profiles[uid]?.tz || 'Asia/Kolkata')) return err('FUTURE_DATE');
          }
          d.tales[r.id] = { ...ex, ...r, user_id: uid, updated_at: new Date().toISOString() }; save(d); return ok(null);
        }
        if (st.op === 'delete') { for (const [k, v] of st.filters) if (k === 'id') delete d.tales[v]; save(d); return ok(null); }
        const all = Object.values(d.tales).filter((t) => t.user_id === uid).sort((a, b) => a.created_at.localeCompare(b.created_at)); return ok(st.range ? all.slice(st.range[0], Math.min(st.range[1], st.range[0] + 999) + 1) : all);
      }
      if (table === 'profiles') { if (st.op === 'update') { Object.assign(d.profiles[uid] ||= { id: uid }, st.row); save(d); return ok(null); } return ok(d.profiles[uid] || null); }
      if (table === 'subscriptions') return ok(d.subs[uid] || null);
      if (table === 'push_subscriptions') return ok(null);
      return ok(null);
    };
    const api = {
      select() { return api; }, order() { return api; }, range(a, b) { st.range = [a, b]; return api; }, eq(k, v) { st.filters.push([k, v]); return api; },
      upsert(row) { st.op = 'upsert'; st.row = row; return api; }, update(row) { st.op = 'update'; st.row = row; return api; }, delete() { st.op = 'delete'; return api; },
      maybeSingle() { return Promise.resolve(run()); },
      then(res, rej) { return Promise.resolve(run()).then(res, rej); },
    };
    return api;
  };
  window.__SB_MOCK = {
    auth: {
      async getSession() { const s = me(); return { data: { session: s ? { user: s } : null } }; },
      onAuthStateChange() {},
      async signInWithOtp() { return { error: null }; },
      async signInWithOAuth() { const d = db(); d.session = { id: 'u-google', email: 'g@example.com', user_metadata: {} }; save(d); location.reload(); return { error: null }; },
      async verifyOtp({ email, token }) {
        if (token !== '12345678') return { data: null, error: { message: 'Token has expired or is invalid' } };
        const d = db(); d.session = { id: 'u-' + email, email, user_metadata: {} }; save(d); return { data: { user: d.session }, error: null };
      },
      async signInWithIdToken({ token, nonce }) { if (token !== 'good-google-token' || !nonce) return { data: null, error: { message: 'Invalid token' } }; const d = db(); d.session = { id: 'u-gid', email: 'gid@example.com', user_metadata: { full_name: 'Gid Member' } }; save(d); window.__idTokenNonce = nonce; return { data: { user: d.session }, error: null }; },
      async signOut() { const d = db(); d.session = null; save(d); return { error: null }; },
    },
    from: q,
    async rpc(name, args) {
      const d = db(), uid = me()?.id; if (!uid) return err('not signed in', '42501');
      if (name === 'start_trial') { const p = d.profiles[uid] || { id: uid, tz: args.p_tz }; p.first_sign_in = p.first_sign_in || today(args.p_tz); p.consented_at = p.consented_at || new Date().toISOString(); d.profiles[uid] = p; save(d); return ok({}); }
      if (name === 'log_limit_attempt') { d.attempts.push({ uid, date: args.p_date }); save(d); return ok(null); }
      return err('unknown rpc');
    },
    storage: {
      from: (bucket) => ({
        async upload(path, blob) { const d = db(); if (d.fail) return { error: { message: 'Failed to fetch' } }; d.files[bucket + '/' + path] = { url: await b2d(blob), type: blob.type }; save(d); return { error: null }; },
        async download(path) { await new Promise((r) => setTimeout(r, Number(localStorage.getItem('mockdl') || 0))); const f = db().files[bucket + '/' + path]; if (!f) return err('not found', '404'); return ok(await d2b(f.url)); },
        async remove(paths) { const d = db(); paths.forEach((p) => delete d.files[bucket + '/' + p]); save(d); return ok(null); },
        async list(prefix) { return ok(Object.keys(db().files).filter((k) => k.startsWith(bucket + '/' + prefix + '/')).map((k) => ({ name: k.split('/').pop() }))); },
      }),
    },
    functions: { async invoke(name) {
      if (name === 'create-subscription') return { data: { subscription_id: 'sub_test', key_id: 'rzp_test_x' }, error: null };
      if (name === 'cancel-subscription') return { data: { ok: true }, error: null }; if (name === 'delete-account') { const d = db(); const uid = d.session?.id; for (const k of Object.keys(d.tales)) if (d.tales[k].user_id === uid) delete d.tales[k]; delete d.profiles[uid]; d.session = null; save(d); } return { data: {}, error: null }; } },
  };
})();
