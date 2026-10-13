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
      const nitC = m.nb[i].some((x) => x.o === 3 && m.atoms[x.j].el === 'N');
      if (nitC || dblHet || (!m.nb[i].some((x) => x.o === 3) && hs.length >= 2) || (hs.length === 1 && cn)) halo[i] = 'o';
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
/** perfil qualitativo: espécies (rótulo, energia) intercaladas com ETs (barreira acima da espécie mais alta + bump) */
export function chain(labels, ys, bumps = []) {
  const n = labels.length, pts = [];
  labels.forEach((l, i) => { pts.push([i / (n - 1) * 0.94 + 0.02, ys[i], l, i === n - 1 ? 'end' : i ? 'int' : '']); if (i < n - 1) pts.push([(i + 0.5) / (n - 1) * 0.94 + 0.02, Math.max(ys[i], ys[i + 1]) + (bumps[i] ?? 18), '', 'ts']); });
  return pts;
}
export const PTS = {
  nas: chain(['RCOY + Nu⁻', 'tetraédrico', 'RCONu + Y⁻'], [0, 16, -12], [36, 14]),
  neutral: chain(['RCOY + HNu', 'tetraédrico', 'RCONu⁺H', 'produto'], [0, 20, 6, -14], [30, 14, 6]),
  socl2: chain(['RCOOH + SOCl₂', 'S tetraédr.', 'O⁺–S', 'clorossulfito', 'tetraédrico', 'RCOCl', 'RCOCl + SO₂↑'], [0, 14, 6, -2, 12, -10, -26], [24, 8, 6, 22, 10, 6]),
  fischer: chain(['RCOOH', 'C=OH⁺', 'oxônio', 'tetraédrico', '–OH₂⁺', 'éster-H⁺', 'éster'], [0, 10, 16, -2, 12, 8, -1], [6, 28, 8, 6, 26, 6]),
  acidHyd: chain(['éster', 'C=OH⁺', 'tetraédr.', '–O⁺(H)CH₃', 'ácido-H⁺', 'ácido + MeOH', 'ácido'], [0, 10, -2, 12, 8, 2, 1], [6, 28, 6, 26, 6, 4]),
  sapon: chain(['éster + HO⁻', 'tetraédrico', 'RCOOH + EtO⁻', 'ácido-base', 'RCOO⁻ + EtOH'], [0, 14, 8, 8, -40], [30, 20, 2, 4]),
  amideAcid: chain(['amida + H₃O⁺', 'C=OH⁺', 'tetraédr.', '–NH₃⁺', 'RCOOH + NH₄⁺'], [0, 12, 2, 10, -18], [8, 34, 8, 24]),
  amideBase: chain(['amida + HO⁻', 'tetraédrico', 'RCOOH + H₂N⁻', 'RCOO⁻ + NH₃'], [0, 22, 30, -30], [40, 26, 4]),
  dehyd: chain(['amida + SOCl₂', 'O-sulfinil', 'imidato ativ.', 'RC≡N'], [0, 6, -2, -22], [22, 8, 20]),
  nitAcid: chain(['RC≡N + H₃O⁺', 'nitrílio', 'ác. imídico', 'tautômero', 'amida', 'ácido + NH₄⁺'], [0, 14, 4, 2, -12, -30], [8, 30, 10, 10, 40]),
  nitAcidS: chain(['RC≡N + H₃O⁺', 'nitrílio', 'amida', 'ácido + NH₄⁺'], [0, 14, -12, -30], [8, 34, 40]),
  nitBase: chain(['RC≡N + HO⁻', 'imidato', 'amida', 'RCOO⁻ + NH₃'], [0, 16, -10, -34], [36, 20, 40]),
  decarb: chain(['β-cetoácido', 'enol + CO₂', 'enol (H⁺)', 'cetona + CO₂'], [0, -6, -6, -26], [34, 2, 22]),
  lactone: chain(['hidroxiácido', 'ataque', 'tetraédrico', 'lactona'], [0, 10, 4, -2], [10, 24, 24]),
  acidAmine: chain(['RCOOH + RNH₂', 'sal (RCOO⁻ RNH₃⁺)'], [0, -30], [6]),
  dcc: chain(['RCOOH + DCC', 'O-acilisoureia', 'amida + DCU'], [0, -4, -40], [22, 20]),
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
  const lad = h('div', { class: 'miniladder', 'aria-label': 'posição na escada de reatividade' }, h('b', null, 'Escada de reatividade'), ...LADDER.map(([k, t]) => h('span', { 'data-k': k }, t)));
  const go = (k) => {
    i = Math.max(0, Math.min(frames.length - 1, k)); const f = frames[i];
    clear(stage).append(svgOf(f.s, { scale: o.scale || 40, fs: 17, animate: true }));
    cap.innerHTML = `<span class="stepn">Etapa ${i + 1}/${frames.length}</span> ${f.cap}`;
    clear(dots).append(...frames.map((_, n) => h('button', { type: 'button', class: n === i ? 'on' : '', 'aria-label': 'Etapa ' + (n + 1), onclick: () => { stop(); go(n); } })));
    if (v && f.k3 && has(f.k3)) { if (!A) A = molView(v, f.k3, Object.assign({ hlC: true, hyb: true, hint: false }, o.opt3d || {})); else if (A.st.key !== f.k3) A.set(f.k3); }
    if (o.pts) clear(en).append(energySvg(o.pts, sp[f.en] ?? null));
    const lk = LADMAP[f.k3] || null; [...lad.querySelectorAll('span')].forEach((x) => x.classList.toggle('on', x.dataset.k === lk));
    pv.disabled = i === 0; nx.disabled = i === frames.length - 1;
  };
  const stop = () => { if (timer) { clearInterval(timer); timer = null; play.textContent = '▶ Reproduzir'; } };
  const play = h('button', { class: 'btn sm primary', type: 'button', onclick: () => { if (timer) { stop(); return; } if (i === frames.length - 1) go(0); play.textContent = '❚❚ Pausar'; timer = setInterval(() => { if (i >= frames.length - 1) { stop(); return; } go(i + 1); }, o.slow ? 6500 : 4200); } }, '▶ Reproduzir');
  const pv = h('button', { class: 'btn sm', type: 'button', onclick: () => { stop(); go(i - 1); } }, '◀ Etapa anterior');
  const nx = h('button', { class: 'btn sm', type: 'button', onclick: () => { stop(); go(i + 1); } }, 'Próxima etapa ▶');
  const extra = o.no3d ? [] : [tgl('Esfera/bastão ↔ preenchimento', () => { if (!A) return false; A.st.style = A.st.style === 'ball' ? 'space' : 'ball'; A.rebuild(); return A.st.style === 'space'; }, false), tgl('Pares isolados', () => { if (!A) return false; A.st.lp = !A.st.lp; A.rebuild(); return A.st.lp; }, false)];
  host.append(h('div', { class: 'controls' }, play, pv, nx, ...extra), h('div', { class: v ? 'grid2 mech' : '' }, h('div', { class: 'player mech' }, stage, cap, dots), v ? h('div', null, v, h('p', { class: 'hint3 center' }, o.cap3d || 'Modelo 3D (geometria otimizada, MMFF94) da espécie da etapa; para R genérico usa-se um exemplo concreto (derivados do ácido acético).')) : null), o.pts || o.ladder !== false ? h('div', { class: 'enlad' }, o.pts ? en : null, o.ladder !== false ? lad : null) : null);
  go(0);
  host._stop = stop;
  return { go, get A() { return A; } };
}

const LADDER = [['cloreto', 'cloreto de acila'], ['anidrido', 'anidrido'], ['ester', 'éster / ácido'], ['amida', 'amida'], ['carboxilato', 'carboxilato']];
const LADMAP = { cloretoAcetila: 'cloreto', cloretoBenzoila: 'cloreto', anidridoAcetico: 'anidrido', acetatoEtila: 'ester', acetatoMetila: 'ester', acidoAcetico: 'ester', acidoBenzoico: 'ester', acidoProtonado: 'ester', esterProtonado: 'ester', clorossulfito: 'anidrido', acetamida: 'amida', benzamida: 'amida', nMetilacetamida: 'amida', dma: 'amida', amidaProtonada: 'amida', acetato: 'carboxilato', gbl: 'ester', hidroxibutanoico: 'ester' };
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
