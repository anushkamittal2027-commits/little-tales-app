// A tiny in-memory stand-in for Supabase, enough for the server functions to run against.
// deno-lint-ignore-file no-explicit-any
type Row = Record<string, any>;
export const db: any = { tables: {} as Record<string, Row[]>, status: {} as Record<string, any>, files: {} as Record<string, string[]>, deleted: [] as string[], user: null as any };
export const resetDb = () => { db.tables = { profiles: [], tales: [], push_subscriptions: [], notification_log: [], subscriptions: [], week_videos: [] }; db.status = {}; db.files = {}; db.deleted = []; db.user = null; };
resetDb();
function builder(table: string) {
  let rows: Row[] = db.tables[table] ?? (db.tables[table] = []);
  const filters: ((r: Row) => boolean)[] = []; let op = 'select', payload: any = null, head = false;
  const run = () => {
    const hit = rows.filter((r) => filters.every((f) => f(r)));
    if (op === 'insert') {
      if (table === 'notification_log' && rows.some((r) => r.user_id === payload.user_id && r.kind === payload.kind && r.day === payload.day)) return { data: null, error: { message: 'duplicate key', code: '23505' }, count: 0 };
      rows.push({ ...payload }); return { data: null, error: null, count: 1 };
    }
    if (op === 'upsert') { const i = rows.findIndex((r) => r.user_id === payload.user_id); if (i >= 0) rows[i] = { ...rows[i], ...payload }; else rows.push({ ...payload }); return { data: null, error: null }; }
    if (op === 'delete') { db.tables[table] = rows.filter((r) => !filters.every((f) => f(r))); return { data: null, error: null }; }
    return { data: head ? null : hit, error: null, count: hit.length };
  };
  const api: any = {
    select(_c?: string, o?: any) { if (o?.head) head = true; return api; }, eq(k: string, v: any) { filters.push((r) => r[k] === v); return api; },
    insert(p: Row) { op = 'insert'; payload = p; return api; }, upsert(p: Row) { op = 'upsert'; payload = p; return api; }, delete() { op = 'delete'; return api; },
    maybeSingle() { const r = run(); return Promise.resolve({ data: (r.data as Row[] | null)?.[0] ?? null, error: null }); },
    then(res: any, rej: any) { return Promise.resolve(run()).then(res, rej); },
  };
  return api;
}
export function createClient(_url: string, _key: string, opts?: any) {
  const authHeader = opts?.global?.headers?.Authorization ?? '';
  return {
    from: builder,
    rpc: (name: string, args: any) => Promise.resolve({ data: name === 'account_status' ? (db.status[args.uid] ?? { status: 'new' }) : null, error: null }),
    auth: {
      getUser: () => Promise.resolve({ data: { user: authHeader.includes('good-token') ? db.user : null } }),
      admin: { deleteUser: (id: string) => { db.deleted.push(id); return Promise.resolve({ error: null }); } },
    },
    storage: { from: (bucket: string) => ({
      list: (uid: string, o?: any) => Promise.resolve({ data: (db.files[bucket + '/' + uid] ?? []).slice(0, o?.limit ?? 100).map((name: string) => ({ name })) }),
      remove: (paths: string[]) => { for (const p of paths) { const [uid] = p.split('/'); const k = bucket + '/' + uid; db.files[k] = (db.files[k] ?? []).filter((n: string) => `${uid}/${n}` !== p); } return Promise.resolve({ data: null }); },
    }) },
  };
}
