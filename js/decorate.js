// The decorating editor: tray of stickers / tape / paper / doodles + drag, resize, rotate, delete.
import { h, icon } from './util.js';
import { TRAYS, DEFAULT_WIDTH, STICKER_GROUPS, artSvg } from './art.js';
import { decoEl, placeDeco } from './stamp.js';

const TABS = [['tape', 'Tape'], ['stickers', 'Stickers'], ['paper', 'Paper'], ['doodles', 'Doodles']];
const COLS = { stickers: 4, tape: 2, paper: 4, doodles: 3 };
const MAX_ITEMS = 30;

// pageEl: the .page element; list: the tale's decorations array (edited in place).
export function makeEditor(pageEl, list, onChange) {
  const layer = pageEl.querySelector('.decor-layer');
  layer.classList.add('editing');
  let selected = null; // index

  const elOf = (i) => layer.children[i];

  function select(i) {
    layer.querySelectorAll('.deco.selected').forEach((e) => { e.classList.remove('selected'); e.querySelector('.deco-ui')?.remove(); });
    selected = i;
    if (i == null) return;
    // bring to front
    const [d] = list.splice(i, 1); list.push(d); selected = list.length - 1;
    const el = elOf(i); layer.append(el);
    el.classList.add('selected');
    el.append(h('div.deco-ui',
      h('button.deco-del', { 'aria-label': 'Delete', onPointerdown: (e) => e.stopPropagation(), onClick: () => remove(selected), html: icon.close }),
      h('div.deco-handle', { 'aria-label': 'Resize and turn', html: icon.resize })));
    bindHandle(el);
    onChange();
  }

  function remove(i) {
    list.splice(i, 1); elOf(i).remove(); selected = null; onChange();
  }

  function bindHandle(el) {
    const handle = el.querySelector('.deco-handle');
    handle.addEventListener('pointerdown', (e) => {
      e.stopPropagation(); e.preventDefault();
      handle.setPointerCapture(e.pointerId);
      const d = list[selected], r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const dist0 = Math.hypot(e.clientX - cx, e.clientY - cy) || 1;
      const ang0 = Math.atan2(e.clientY - cy, e.clientX - cx);
      const s0 = d.s, r0 = d.r;
      const move = (ev) => {
        const dist = Math.hypot(ev.clientX - cx, ev.clientY - cy);
        const ang = Math.atan2(ev.clientY - cy, ev.clientX - cx);
        d.s = Math.max(8, Math.min(90, s0 * dist / dist0));
        d.r = Math.round((r0 + (ang - ang0) * 180 / Math.PI) * 10) / 10;
        placeDeco(el, d);
      };
      const up = () => { handle.removeEventListener('pointermove', move); handle.removeEventListener('pointerup', up); onChange(); };
      handle.addEventListener('pointermove', move); handle.addEventListener('pointerup', up);
    });
  }

  layer.addEventListener('pointerdown', (e) => {
    const el = e.target.closest('.deco');
    if (!el) { select(null); return; }
    if (e.target.closest('.deco-ui')) return;
    e.preventDefault();
    const i = [...layer.children].indexOf(el);
    if (!el.classList.contains('selected')) select(i);
    const idx = selected, node = elOf(idx), d = list[idx];
    node.setPointerCapture(e.pointerId);
    const rect = layer.getBoundingClientRect();
    const sx = e.clientX, sy = e.clientY, x0 = d.x, y0 = d.y;
    const move = (ev) => {
      d.x = Math.max(0, Math.min(100, x0 + (ev.clientX - sx) / rect.width * 100));
      d.y = Math.max(0, Math.min(100, y0 + (ev.clientY - sy) / rect.height * 100));
      placeDeco(node, d);
    };
    const up = () => { node.removeEventListener('pointermove', move); node.removeEventListener('pointerup', up); onChange(); };
    node.addEventListener('pointermove', move); node.addEventListener('pointerup', up);
  });

  function add(kind, id) {
    if (list.length >= MAX_ITEMS) return;
    const n = list.length;
    const d = {
      kind, id,
      x: 50 + ((n * 17) % 40) - 20, y: 40 + ((n * 23) % 40) - 10,
      s: DEFAULT_WIDTH[kind], r: ((n * 37) % 30) - 15,
    };
    list.push(d);
    const el = decoEl(d); el.classList.add('landing');
    layer.append(el);
    select(list.length - 1);
    onChange();
  }

  // The bottom tray. Every tab's items are built once, the first time it is opened;
  // switching tabs or sticker groups afterwards only shows / hides what already exists.
  let tab = 'stickers', group = 'All';
  const tray = h('div.tray');
  const tabs = h('div.tray-tabs', { role: 'tablist', 'aria-label': 'Decoration types' });
  const chips = h('div.group-chips', { role: 'group', 'aria-label': 'Sticker groups' });
  const grids = {};
  const tabBtns = {}, chipBtns = {};

  function gridFor(k) {
    if (grids[k]) return grids[k];
    const g = h('div.tray-grid.cols-' + COLS[k], { role: 'tabpanel', 'aria-label': k });
    g.append(...TRAYS[k].map((a) => {
      const b = h('button.tray-item.' + k, { type: 'button', 'aria-label': 'Add ' + a.name, title: a.name, onClick: () => add(k, a.id), html: artSvg(k, a.id) });
      b.dataset.group = a.group || '';
      return b;
    }));
    grids[k] = g;
    return g;
  }
  function applyGroup() {
    const g = grids.stickers; if (!g) return;
    g.querySelectorAll('.tray-item').forEach((b) => { b.hidden = group !== 'All' && b.dataset.group !== group; });
    grid.scrollTop = 0;
    for (const n in chipBtns) { const on = n === group; chipBtns[n].classList.toggle('on', on); chipBtns[n].setAttribute('aria-pressed', on); }
  }
  function showTab(k) {
    tab = k;
    for (const t in tabBtns) { const on = t === k; tabBtns[t].classList.toggle('on', on); tabBtns[t].setAttribute('aria-selected', on); tabBtns[t].tabIndex = on ? 0 : -1; }
    chips.hidden = k !== 'stickers';
    tray.dataset.tab = k;
    const g = gridFor(k);
    if (grid.firstChild !== g) grid.replaceChildren(g);
    grid.scrollTop = 0;
    if (k === 'stickers') applyGroup();
  }
  const grid = h('div.tray-body');
  TABS.forEach(([k, label]) => {
    tabBtns[k] = h('button.tab', { type: 'button', role: 'tab', onClick: () => showTab(k) }, label);
    tabs.append(tabBtns[k]);
  });
  ['All', ...STICKER_GROUPS].forEach((n) => {
    chipBtns[n] = h('button.group-chip', { type: 'button', 'aria-label': n === 'All' ? 'Show all stickers' : 'Show ' + n + ' stickers', onClick: () => { group = n; applyGroup(); chipBtns[n].scrollIntoView?.({ inline: 'center', block: 'nearest', behavior: 'smooth' }); } }, n);
    chips.append(chipBtns[n]);
  });
  tray.append(tabs, chips, grid);
  showTab('stickers');
  return { tray, deselect: () => select(null) };
}
