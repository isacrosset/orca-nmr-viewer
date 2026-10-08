/*
 * ui.js — utilidades de interface.
 */
import { h } from './widgets2d.js';
import { MOLS, analyze, CLS } from './arom.js';
import { ringSVG } from './arom2d.js';

export const fb = (c, html) => h('div', { class: 'fb ' + c, html });
export const clear = (e) => { while (e.firstChild) e.removeChild(e.firstChild); return e; };
export const sel = (opts, cur, on, label) => { const s = h('select', { 'aria-label': label || 'escolha' }, opts.map(([v, t]) => h('option', { value: v }, t))); s.value = cur; s.addEventListener('change', () => on(s.value)); return s; };
export const molOpts = (keys) => keys.map((k) => [k, MOLS[k].name + ' · ' + MOLS[k].f]);
export const vbox = (c = '') => h('div', { class: 'viewer ' + c });
export const rnd = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const legend = (items) => h('div', { class: 'legend' }, items.map(([c, t]) => h('span', null, h('i', { style: `background:${c}` }), t)));
export const PI_LEGEND = () => legend([['#2fd4f5', 'orbital p (fase +)'], ['#ffd45c', 'orbital p (fase −)'], ['#ff4fa3', 'densidade π / par no sistema π'], ['#7fe3ff', 'par isolado no plano (fora do π)']]);
export const badge = (cls) => { const [t, c] = CLS[cls]; return h('span', { class: 'clsbadge', style: `border-color:${c};color:${c}` }, t); };
export const ringFig = (key, o = {}) => { const def = typeof key === 'string' ? MOLS[key] : key; if (def.draw && !o.notes) o = Object.assign({}, def.draw, o); return h('figure', { class: 'fig' }, ringSVG(def, Object.assign({ scale: 40, fs: 17 }, o)), o.cap === false ? null : h('figcaption', null, o.cap || [def.name, def.f].filter(Boolean).join(' · '), o.badge ? h('div', null, badge(analyze(def).cls)) : null)); };
export function choice(opts, correct, onDone) {
  const box = h('div', { class: 'ch-answers' });
  opts.forEach((t) => box.append(h('button', { class: 'btn', type: 'button', onclick: (e) => {
    const ok = t === correct;
    [...box.children].forEach((b) => { b.disabled = true; if (b.textContent === String(correct)) b.classList.add('primary'); });
    if (!ok) e.currentTarget.classList.add('ghost');
    onDone(ok, t);
  } }, String(t))));
  return box;
}
/** relatório de critérios */
export function report(def, A) {
  A = A || analyze(def);
  const row = (ok, t) => `<li class="${ok === null ? 'na' : ok ? 'ok' : 'bad'}"><b>${ok === null ? '—' : ok ? '✓' : '✗'}</b> ${t}</li>`;
  if (A.fused) return `<ul class="crit">${row(true, 'cíclico (sistema fundido)')}${row(true, 'plano')}${row(true, 'orbital p em todos os carbonos do sistema')}${row(true, `${A.e} elétrons π`)}</ul>`;
  return `<ul class="crit">${row(A.cyclic, 'cíclico')}${row(A.cyclic ? A.planar : null, A.planar ? 'planar (ou pode ser planar)' : 'não planar')}${row(A.cyclic ? A.allP : null, A.allP ? 'orbital p em todos os átomos do anel' : 'há átomo sem orbital p (sp³)')}${row(A.cyclic && A.allP ? true : null, `conjugação contínua${A.allP ? '' : ' — interrompida'}`)}<li class="na"><b>π</b> ${A.e} elétrons π ${A.allP && A.planar && A.e % 2 === 0 ? (A.e % 4 === 2 ? `= 4(${(A.e - 2) / 4})+2` : `= 4(${A.e / 4})`) : ''}</li></ul>`;
}
