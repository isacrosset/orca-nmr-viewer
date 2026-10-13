/*
 * ui.js — utilitários compartilhados: feedback, figuras 2D com destaques,
 * reprodutor de mecanismo sincronizado (2D + setas + 3D + perfil de energia),
 * abas e perfis de energia qualitativos.
 */
import { h, tgl } from './widgets2d.js';
import { parseSmiles } from './chem.js';
import { layout, drawSVG } from './depict.js';
import { svgEl, add, profile, svgS } from './arom2d.js';
import { COMP } from './data.js';
import { molView, has } from './m3d.js';

export const fb = (c, html) => h('div', { class: 'fb ' + c, html });
export const clear = (e) => { while (e.firstChild) e.removeChild(e.firstChild); return e; };
export const sel = (opts, cur, on, lab) => { const s = h('select', { 'aria-label': lab || 'escolha' }, opts.map(([v, t]) => h('option', { value: v }, t))); s.value = cur; s.addEventListener('change', () => on(s.value)); return s; };
export const vbox = (c = '') => h('div', { class: 'viewer ' + c });
export const legend = (items) => h('div', { class: 'legend' }, items.map(([c, t]) => h('span', null, h('i', { style: `background:${c}` }), t)));
export const ESP_LEG = () => legend([['#2fd4f5', 'mais rico em elétrons (δ−)'], ['#dfe6f2', 'intermediário'], ['#ff9f43', 'mais pobre (δ+)']]);
export const ORB_LEG = () => legend([['#2fd4f5', 'fase + do orbital'], ['#ffd45c', 'fase − do orbital'], ['#ff9f43', 'carbono eletrofílico']]);
export const svgOf = (s, o = {}) => svgS(s, Object.assign({ scale: 44, fs: 18, zoom: 1.2 }, o));
export const nm = (k) => (COMP[k] ? COMP[k].name : k);

/**
 * Estrutura esquelética com destaques: carbono (ex-)carbonílico em laranja,
 * O–H em ciano, O–R em ciano-claro, N/S como nucleófilos; nova C=C em amarelo.
 */
export function skx(x, o = {}) {
  const m = typeof x === 'string' ? parseSmiles(COMP[x] ? COMP[x].smi : x) : x;
  const P = layout(m), hl = {}, halo = {}, bondCls = {};
  const het = (i) => ['O', 'N', 'S'].includes(m.atoms[i].el);
  m.atoms.forEach((a, i) => {
    if (a.el === 'O') hl[i] = a.h > 0 || m.nb[i].some((x) => x.o === 2) ? 'oxy' : 'oxy2';
    if (a.el === 'N' || a.el === 'S') hl[i] = 'nu';
    if (a.el === 'C' && o.hlC !== false && !a.aromatic) {
      const hs = m.nb[i].filter((x) => het(x.j)); const dblHet = m.nb[i].some((x) => x.o === 2 && het(x.j));
      const cn = m.nb[i].some((x) => x.o === 1 && m.atoms[x.j].el === 'C' && m.nb[x.j].some((y) => y.o === 3 && m.atoms[y.j].el === 'N'));
      if (!m.nb[i].some((x) => x.o === 3) && (dblHet || hs.length >= 2 || (hs.length === 1 && cn))) halo[i] = 'o';
    }
  });
  if (o.cc) m.bonds.forEach((b) => { if (b.o === 2 && m.atoms[b.a].el === 'C' && m.atoms[b.b].el === 'C' && !(m.atoms[b.a].aromatic && m.atoms[b.b].aromatic)) { bondCls[`${b.a}-${b.b}`] = 'cc'; bondCls[`${b.b}-${b.a}`] = 'cc'; } });
  Object.assign(halo, o.halo || {});
  return drawSVG(m, P, { scale: o.scale || 32, fs: o.fs || 14, zoom: o.zoom || 1.15, hl: Object.assign(hl, o.hlx || {}), halo, bondCls, alt: o.alt || (COMP[x] && COMP[x].name) || 'estrutura' });
}
export const figK = (x, o = {}) => h('figure', { class: 'fig' + (o.cls ? ' ' + o.cls : '') }, skx(x, o), o.cap === false ? null : h('figcaption', { html: o.cap || nm(x) }));
export const figRow = (items, o = {}) => h('div', { class: 'rxrow' }, items.map((x) => (x instanceof Node ? x : typeof x === 'string' && !COMP[x] ? h('span', { class: 'rxarr', html: x }) : Array.isArray(x) ? figK(x[0], Object.assign({}, o, x[1] || {})) : figK(x, o))));

/* ===================================================================
 * Perfis de energia qualitativos (pontos [x, y, rótulo, tipo])
 * =================================================================== */
const P = (...a) => a;
export const PTS = {
  base: [P(0, 0, 'C=O + Nu⁻'), P(0.25, 52, 'ET', 'ts'), P(0.48, 16, 'alcóxido', 'int'), P(0.66, 26, 'ET', 'ts'), P(0.9, -8, 'aduto', 'end')],
  acidAdd: [P(0, 0, 'C=O + H₃O⁺'), P(0.12, 14, '', 'ts'), P(0.24, 10, 'C=OH⁺', 'int'), P(0.4, 40, 'ET', 'ts'), P(0.56, 16, 'oxônio', 'int'), P(0.7, 24, '', 'ts'), P(0.9, -2, 'aduto', 'end')],
  acetal: [P(0, 0, 'C=O'), P(0.05, 12, '', 'ts'), P(0.1, 10, 'C=OH⁺', 'int'), P(0.17, 36, '', 'ts'), P(0.24, 15, 'oxônio', 'int'), P(0.3, 20, '', 'ts'), P(0.36, -2, 'hemicetal', 'int'), P(0.42, -2, '', 'ts'), P(0.47, -2, '', 'int'), P(0.52, 10, '', 'ts'), P(0.57, 8, 'R–OH₂⁺', 'int'), P(0.64, 42, 'ET', 'ts'), P(0.7, 22, 'oxocarbênio', 'int'), P(0.77, 38, '', 'ts'), P(0.83, 10, 'cetal-H⁺', 'int'), P(0.89, 16, '', 'ts'), P(0.96, -6, 'cetal', 'end')],
  hydrolysis: [P(0, -6, 'cetal'), P(0.1, 10, '', 'ts'), P(0.18, 10, 'cetal-H⁺', 'int'), P(0.3, 40, 'ET', 'ts'), P(0.4, 22, 'oxocarbênio', 'int'), P(0.5, 34, '', 'ts'), P(0.6, -2, 'hemicetal', 'int'), P(0.7, 30, '', 'ts'), P(0.8, 10, 'C=OH⁺', 'int'), P(0.86, 14, '', 'ts'), P(0.96, -4, 'C=O', 'end')],
  imine: [P(0, 0, 'C=O + RNH₂'), P(0.07, 10, '', 'ts'), P(0.14, 8, 'C=OH⁺', 'int'), P(0.22, 30, '', 'ts'), P(0.3, 12, 'N⁺ (tetraédr.)', 'int'), P(0.38, 18, '', 'ts'), P(0.46, -4, 'carbinolamina', 'int'), P(0.56, 46, 'ET', 'ts'), P(0.64, 20, '–OH₂⁺', 'int'), P(0.72, 32, '', 'ts'), P(0.8, 14, 'imínio', 'int'), P(0.88, 20, '', 'ts'), P(0.96, 2, 'C=N', 'end')],
  enamine: [P(0, 0, 'C=O + R₂NH'), P(0.12, 30, '', 'ts'), P(0.24, -4, 'carbinolamina', 'int'), P(0.36, 44, 'ET', 'ts'), P(0.48, 18, '–OH₂⁺', 'int'), P(0.58, 30, '', 'ts'), P(0.68, 14, 'imínio', 'int'), P(0.8, 34, '', 'ts'), P(0.94, 4, 'enamina', 'end')],
  wittig: [P(0, 0, 'C=O + ilídeo'), P(0.22, 30, 'ET', 'ts'), P(0.4, 4, 'betaína*', 'int'), P(0.52, 10, '', 'ts'), P(0.62, -10, 'oxafosfetano', 'int'), P(0.76, 18, 'ET', 'ts'), P(0.94, -50, 'alceno + Ph₃P=O', 'end')],
  hwe: [P(0, 0, 'fosfonato'), P(0.12, 16, '', 'ts'), P(0.24, -6, 'carbânion', 'int'), P(0.38, 28, 'ET', 'ts'), P(0.5, 8, 'alcóxido', 'int'), P(0.6, 16, '', 'ts'), P(0.7, -2, 'oxafosfetano', 'int'), P(0.8, 20, '', 'ts'), P(0.95, -40, 'alceno E', 'end')],
  ylide: [P(0, 0, 'PPh₃ + CH₃Br'), P(0.25, 40, 'ET (SN2)', 'ts'), P(0.48, -10, 'fosfônio', 'int'), P(0.68, 20, '', 'ts'), P(0.9, 6, 'ilídeo', 'end')],
  thio: [P(0, 0, 'C=O'), P(0.15, 30, '', 'ts'), P(0.3, 4, '', 'int'), P(0.42, 8, '', 'ts'), P(0.52, -2, 'hemitioacetal', 'int'), P(0.64, 36, '', 'ts'), P(0.74, 20, 'tiocarbênio', 'int'), P(0.84, 26, '', 'ts'), P(0.92, -6, '', 'int'), P(0.95, -6, '', 'ts'), P(0.98, -14, 'tiocetal', 'end')],
};
export function energySvg(pts, cur, o = {}) {
  const svg = svgEl(o.w || 600, o.h || 230, o.label || 'Perfil de energia qualitativo');
  const { X, Y } = profile(svg, pts, { ymin: Math.min(...pts.map((p) => p[1])) - 14, ymax: Math.max(...pts.map((p) => p[1])) + 18, cls: o.cls || 'red' });
  if (cur !== null && cur !== undefined && pts[cur]) { const [x, y] = pts[cur]; add(svg, 'circle', { cx: X(x), cy: Y(y), r: 10, class: 'cur' }); }
  add(svg, 'text', { x: 6, y: 14, class: 'lab' }, 'Energia livre ↑ (qualitativa)');
  return svg;
}
const species = (pts) => pts.map((p, i) => (p[3] === 'ts' ? -1 : i)).filter((i) => i >= 0);

/**
 * Reprodutor sincronizado: estrutura 2D com setas/cargas, legenda, modelo 3D da
 * espécie correspondente e cursor no perfil de energia.
 */
export function mechPlayer(host, frames, o = {}) {
  let i = 0, timer = null;
  const stage = h('div', { class: 'stage2d' }), cap = h('div', { class: 'pcap', 'aria-live': 'polite' }), dots = h('div', { class: 'dots' }), en = h('div', { class: 'energywrap mini' });
  const v = o.no3d ? null : vbox();
  const sp = o.pts ? species(o.pts) : [];
  let A = null;
  const go = (k) => {
    i = Math.max(0, Math.min(frames.length - 1, k)); const f = frames[i];
    clear(stage).append(svgOf(f.s, { scale: o.scale || 40, fs: 17, animate: true }));
    cap.innerHTML = `<span class="stepn">Etapa ${i + 1}/${frames.length}</span> ${f.cap}`;
    clear(dots).append(...frames.map((_, n) => h('button', { type: 'button', class: n === i ? 'on' : '', 'aria-label': 'Etapa ' + (n + 1), onclick: () => { stop(); go(n); } })));
    if (v && f.k3 && has(f.k3)) { if (!A) A = molView(v, f.k3, Object.assign({ hlC: true, hyb: true, hint: false }, o.opt3d || {})); else if (A.st.key !== f.k3) A.set(f.k3); }
    if (o.pts) clear(en).append(energySvg(o.pts, sp[f.en] ?? null));
    pv.disabled = i === 0; nx.disabled = i === frames.length - 1;
  };
  const stop = () => { if (timer) { clearInterval(timer); timer = null; play.textContent = '▶ Reproduzir'; } };
  const play = h('button', { class: 'btn sm primary', type: 'button', onclick: () => { if (timer) { stop(); return; } if (i === frames.length - 1) go(0); play.textContent = '❚❚ Pausar'; timer = setInterval(() => { if (i >= frames.length - 1) { stop(); return; } go(i + 1); }, o.slow ? 6500 : 4200); } }, '▶ Reproduzir');
  const pv = h('button', { class: 'btn sm', type: 'button', onclick: () => { stop(); go(i - 1); } }, '◀ Etapa anterior');
  const nx = h('button', { class: 'btn sm', type: 'button', onclick: () => { stop(); go(i + 1); } }, 'Próxima etapa ▶');
  const extra = o.no3d ? [] : [tgl('Esfera/bastão ↔ preenchimento', () => { if (!A) return false; A.st.style = A.st.style === 'ball' ? 'space' : 'ball'; A.rebuild(); return A.st.style === 'space'; }, false), tgl('Pares isolados', () => { if (!A) return false; A.st.lp = !A.st.lp; A.rebuild(); return A.st.lp; }, false)];
  host.append(h('div', { class: 'controls' }, play, pv, nx, ...extra), h('div', { class: v ? 'grid2 mech' : '' }, h('div', { class: 'player mech' }, stage, cap, dots), v ? h('div', null, v, h('p', { class: 'hint3 center' }, o.cap3d || 'Modelo 3D (geometria otimizada, MMFF) da espécie da etapa; quando R e R′ são genéricos, usa-se um exemplo concreto (ex.: acetona, cicloexanona).')) : null), o.pts ? en : null);
  go(0);
  host._stop = stop;
  return { go, get A() { return A; } };
}

/** abas simples: tabs = [[rótulo, (painel) => void]] */
export function tabs(host, list, o = {}) {
  const bar = h('div', { class: 'tabs', role: 'tablist' }), panel = h('div', { class: 'tabpanel' });
  let stopper = null;
  const open = (k) => {
    [...bar.children].forEach((b, n) => b.setAttribute('aria-selected', n === k ? 'true' : 'false'));
    if (stopper) { try { stopper(); } catch (e) { /* ok */ } stopper = null; }
    clear(panel); const p = h('div'); panel.append(p); list[k][1](p); stopper = p._stop || null;
  };
  list.forEach(([t], k) => bar.append(h('button', { class: 'tab', type: 'button', role: 'tab', onclick: () => open(k) }, t)));
  host.append(bar, panel); open(o.start || 0);
  host._stop = () => { if (stopper) stopper(); };
}
export const card = (title, body, cls = '') => h('div', { class: 'chcard ' + cls }, h('h4', { html: title }), typeof body === 'string' ? h('p', { html: body }) : body);
export const note = (kind, title, html) => h('div', { class: 'note ' + kind }, h('b', { class: 't' }, title), h('span', { html }));

/** torna clicáveis átomos de uma estrutura desenhada a partir de SMILES */
export function pickable(svg, m, filter, onPick, r = 15) {
  const C = svg._chem, NS = 'http://www.w3.org/2000/svg', g = document.createElementNS(NS, 'g'); g.setAttribute('transform', C.transform); svg.append(g);
  const els = [];
  m.atoms.forEach((a, i) => {
    if (!filter(a, i)) return;
    const p = C.atoms[svg._s._ids[i]]; const c = document.createElementNS(NS, 'circle');
    [['cx', p.x], ['cy', p.y], ['r', r], ['class', 'pk'], ['tabindex', 0], ['role', 'button'], ['aria-label', 'átomo ' + a.el]].forEach(([x, y]) => c.setAttribute(x, y));
    const f = () => onPick(i, c); c.addEventListener('click', f); c.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); f(); } });
    g.append(c); els.push(c);
  });
  return els;
}
