// Saves tales on this phone (browser storage) for now.
// Stage 3 replaces this with online saving + login; the rest of the app keeps calling the same functions.
const DB_NAME = 'littletales';
let dbp;

function open() {
  if (!dbp) {
    dbp = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore('tales', { keyPath: 'id' });
        req.result.createObjectStore('meta');
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbp;
}
// If the browser blocks storage (some private windows do), keep everything in memory for this visit.
const mem = { tales: new Map(), meta: new Map() };
let memoryOnly = false;
export const storageIsTemporary = () => memoryOnly;

async function tx(store, mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const r = fn(t.objectStore(store));
    t.oncomplete = () => resolve(r && r.result);
    t.onerror = () => reject(t.error);
  });
}
async function safe(real, fallback) {
  if (!memoryOnly) {
    try { return await real(); } catch (e) { console.warn('Storage unavailable, using memory for this visit', e); memoryOnly = true; }
  }
  return fallback();
}

export const store = {
  tales: [],
  async load() { this.tales = (await safe(() => tx('tales', 'readonly', (s) => s.getAll()), () => [...mem.tales.values()])) || []; return this.tales; },
  hooks: {},                      // online saving plugs in here (js/sync.js)
  async save(tale, { local = false } = {}) {
    await safe(() => tx('tales', 'readwrite', (s) => s.put(tale)), () => mem.tales.set(tale.id, tale));
    const i = this.tales.findIndex((t) => t.id === tale.id);
    if (i >= 0) this.tales[i] = tale; else this.tales.push(tale);
    if (!local) this.hooks.save?.(tale);
  },
  async remove(id, { local = false } = {}) {
    const gone = this.byId(id);
    await safe(() => tx('tales', 'readwrite', (s) => s.delete(id)), () => mem.tales.delete(id));
    this.tales = this.tales.filter((t) => t.id !== id);
    if (!local) this.hooks.remove?.(gone);
  },
  // Wipes everything on this phone (tales and settings). Used when someone signs out.
  async clearAll() {
    await safe(async () => { await tx('tales', 'readwrite', (s) => s.clear()); await tx('meta', 'readwrite', (s) => s.clear()); }, () => { mem.tales.clear(); mem.meta.clear(); });
    this.tales = [];
  },
  async clear() { await safe(() => tx('tales', 'readwrite', (s) => s.clear()), () => mem.tales.clear()); this.tales = []; },
  async removeSamples() {
    for (const t of this.tales.filter((x) => x.sample)) await this.remove(t.id);
  },
  async getMeta(k) { return safe(() => tx('meta', 'readonly', (s) => s.get(k)), () => mem.meta.get(k)); },
  async setMeta(k, v) { return safe(() => tx('meta', 'readwrite', (s) => s.put(v, k)), () => mem.meta.set(k, v)); },

  // Tales for one day, oldest first (the first one is the day's cover).
  forDate(date) {
    return this.tales.filter((t) => t.date === date).sort((a, b) => a.createdAt - b.createdAt);
  },
  count(date) { return this.forDate(date).length; },
  byId(id) { return this.tales.find((t) => t.id === id); },
};
