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
async function tx(store, mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const r = fn(t.objectStore(store));
    t.oncomplete = () => resolve(r && r.result);
    t.onerror = () => reject(t.error);
  });
}

export const store = {
  tales: [],
  async load() { this.tales = (await tx('tales', 'readonly', (s) => s.getAll())) || []; return this.tales; },
  async save(tale) {
    await tx('tales', 'readwrite', (s) => s.put(tale));
    const i = this.tales.findIndex((t) => t.id === tale.id);
    if (i >= 0) this.tales[i] = tale; else this.tales.push(tale);
  },
  async remove(id) {
    await tx('tales', 'readwrite', (s) => s.delete(id));
    this.tales = this.tales.filter((t) => t.id !== id);
  },
  async clear() { await tx('tales', 'readwrite', (s) => s.clear()); this.tales = []; },
  async removeSamples() {
    for (const t of this.tales.filter((x) => x.sample)) await this.remove(t.id);
  },
  async getMeta(k) { return tx('meta', 'readonly', (s) => s.get(k)); },
  async setMeta(k, v) { return tx('meta', 'readwrite', (s) => s.put(v, k)); },

  // Tales for one day, oldest first (the first one is the day's cover).
  forDate(date) {
    return this.tales.filter((t) => t.date === date).sort((a, b) => a.createdAt - b.createdAt);
  },
  count(date) { return this.forDate(date).length; },
  byId(id) { return this.tales.find((t) => t.id === id); },
};
