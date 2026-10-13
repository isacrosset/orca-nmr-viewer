/*
 * ui.js — utilidades de interface compartilhadas.
 */
import { h } from './widgets2d.js';
import { lewisSVG, centerInfo } from './struct.js';
import { L, MOLS } from './lib.js';
import { molImage } from './scene3d.js';

export const fb = (c, html) => h('div', { class: 'fb ' + c, html });
export const clear = (e) => { while (e.firstChild) e.removeChild(e.firstChild); return e; };
export const sel = (opts, cur, on, label) => { const s = h('select', { 'aria-label': label || 'escolha' }, opts.map(([v, t]) => h('option', { value: v }, t))); s.value = cur; s.addEventListener('change', () => on(s.value)); return s; };
export const molOpts = (keys) => keys.map((k) => [k, MOLS[k][1] + ' — ' + MOLS[k][2]]);
export const lewisFig = (key, cap, o = {}) => { const LS = typeof key === 'string' ? L(key) : key; return h('figure', { class: 'fig' }, lewisSVG(LS, Object.assign({ scale: 40, fs: 17 }, o)), cap === undefined ? h('figcaption', { html: `<b>${LS.formula || ''}</b> ${LS.name || ''}` }) : cap ? h('figcaption', { html: cap }) : null); };
export const img3d = (key, o = {}) => { const url = molImage(typeof key === 'string' ? L(key) : key, Object.assign({ w: 240, h: 180, cam: [(o.dist || 7) * 0.72, (o.dist || 7) * 0.28, (o.dist || 7) * 0.64] }, o)); return url ? h('img', { src: url, alt: o.alt || 'modelo 3D', class: 'snap', width: o.w || 240, height: o.h || 180 }) : h('div', { class: 'hint3' }, '(modelo 3D indisponível sem WebGL)'); };
export const vbox = (c = '') => h('div', { class: 'viewer ' + c });
export const pickN = (arr, n) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, n); };
export const rnd = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const legend = (items) => h('div', { class: 'legend' }, items.map(([c, t]) => h('span', null, h('i', { style: `background:${c}` }), t)));
export const PHASE_LEGEND = () => h('div', { class: 'legend phase' }, h('span', null, h('i', { style: 'background:#2fd4f5' }), 'fase +'), h('span', null, h('i', { style: 'background:#ffd45c' }), 'fase −'), h('span', { class: 'muted' }, 'As cores indicam fases opostas da função de onda, não cargas elétricas.'));
export const SP_LEGEND = () => legend([['var(--orange)', 'ligação σ'], ['var(--magenta)', 'ligação π'], ['#7fe3ff', 'par isolado']]);
export const infoRows = (LS, i) => { const c = centerInfo(LS, i); return `<span><b>${LS.atoms[i].el}</b></span><span>domínios: <b>${c.D}</b> (${c.X} ligado${c.X === 1 ? '' : 's'} + ${c.E} par${c.E === 1 ? '' : 'es'} isolado${c.E === 1 ? '' : 's'})</span><span>${c.axe}</span><span>geometria eletrônica: <b>${c.egeo}</b></span><span>geometria molecular: <b>${c.mgeo}</b></span><span>ângulo ≈ <b>${c.ang}</b></span><span>hibridização: <b>${c.hyb || '—'}</b></span><span>carga formal: <b>${c.fc > 0 ? '+' + c.fc : c.fc}</b></span>${c.conj ? '<span class="status-warn">par vizinho a ligação π: em ressonância, descrição sp² é mais adequada</span>' : ''}`; };
/** botões de resposta com feedback */
export function choice(opts, correct, onDone, o = {}) {
  const box = h('div', { class: 'ch-answers' + (o.small ? ' sm' : '') });
  opts.forEach((t) => box.append(h('button', { class: 'btn', type: 'button', onclick: (e) => {
    const ok = t === correct;
    [...box.children].forEach((b) => { b.disabled = true; if (b.textContent === String(correct)) b.classList.add('primary'); });
    if (!ok) e.currentTarget.classList.add('ghost');
    onDone(ok, t);
  } }, String(t))));
  return box;
}
