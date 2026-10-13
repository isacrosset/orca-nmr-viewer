/*
 * draw.js — desenhos 2D gerados do MESMO modelo da molécula:
 * cunha/tracejado (a partir da geometria 3D em zigue-zague, com orientação
 * opcional) e projeção de Fischer (a partir da geometria eclipsada).
 * Cada desenho guarda coordenadas pseudo-3D (cunha = +z, tracejado = −z)
 * para validação automática do R/S.
 */
import { S, mol as render, el, text } from './chem2d.js';
import { V, glab, rankCenter, chir } from './stereo.js';

const PCLS = ['p1', 'p2', 'p3', 'p4'];
/** transformações de orientação aplicadas antes de projetar */
export const ORIENT = {
  base: (p) => p,
  flip: (p) => [p[0], -p[1], -p[2]], // rotação de 180° em torno do eixo x (no plano do papel)
  turn: (p) => [-p[0], p[1], -p[2]], // rotação de 180° em torno do eixo y (vira a folha)
  rot180: (p) => [-p[0], -p[1], p[2]], // rotação de 180° no plano
};

export function wedgeS(mol, o = {}) {
  const T = ORIENT[o.orient || 'base'];
  const P = mol.atoms.map((a) => T(a.p));
  const s = new S();
  const sc = 1 / 1.53;
  const xy = (p) => [p[0] * sc, -p[1] * sc];
  const p3 = {};
  const vid = {};
  const centers = new Set(mol.centers);
  const prio = o.prio !== undefined ? rankCenter(mol, o.prio).order : null;
  const pr = (j) => (prio ? prio.indexOf(j) : -1);
  // carbonos da cadeia
  mol.C.forEach((c) => { const q = xy(P[c]); vid[c] = s.a(q[0], q[1], '', centers.has(c) && o.hl ? { halo: 'c' } : {}); p3[c] = [q[0], -q[1], 0]; });
  for (let k = 0; k < mol.C.length - 1; k++) s.b(vid[mol.C[k]], vid[mol.C[k + 1]]);
  const chainNb = (k) => [k > 0 ? mol.C[k - 1] : mol.t0, k < mol.C.length - 1 ? mol.C[k + 1] : mol.tn];
  const pos2 = (j) => xy(P[j]);
  const tag = (j, lbl, x, y) => { const r = pr(j); if (r >= 0) s.t(x, y, String(r + 1), 'prio ' + PCLS[r], 12); void lbl; };
  // terminais
  [[mol.t0, 0], [mol.tn, mol.C.length - 1]].forEach(([t, k]) => {
    const c = mol.C[k], g = mol.groupAt[t];
    const C2 = xy(P[c]), G2 = xy(P[t]);
    const d = V.norm([G2[0] - C2[0], G2[1] - C2[1], 0]);
    const at = [C2[0] + d[0], C2[1] + d[1]];
    const other = chainNb(k).find((j) => j !== t);
    const O2 = xy(P[other]);
    const back = V.norm([C2[0] - O2[0], C2[1] - O2[1], 0]);
    p3[t] = [at[0], -at[1], 0];
    if (g === 'H' && !centers.has(c)) return;
    if (g === 'CH3' || g === 'Et' || g === 'Pr') {
      let i = s.a(at[0], at[1], o.labelCH3 && g === 'CH3' ? 'CH3' : ''); s.b(vid[c], i);
      let cur = at; const n = g === 'Et' ? 1 : g === 'Pr' ? 2 : 0;
      for (let q = 0; q < n; q++) { const dd = q % 2 === 0 ? back : d; cur = [cur[0] + dd[0], cur[1] + dd[1]]; const i2 = s.a(cur[0], cur[1], ''); s.b(i, i2); i = i2; }
      tag(t, '', at[0] + 0.18, at[1] - 0.25);
    } else {
      const lb = g === 'H' ? 'H' : glab(g).replace(/₂/g, '2').replace(/₃/g, '3');
      const ext = 1 + 0.2 * Math.max(0, lb.replace(/\d/g, '').length - 2);
      at[0] = C2[0] + d[0] * ext; at[1] = C2[1] + d[1] * ext;
      const i = s.a(at[0], at[1], lb, { cls: 'g' + (pr(t) + 1) });
      s.b(vid[c], i);
      tag(t, '', at[0] + 0.1, at[1] - 0.42);
    }
  });
  // substituintes f/b
  mol.info.sub.forEach((sb, k) => {
    const c = sb.c, C2 = xy(P[c]);
    const [n1, n2] = chainNb(k).map(pos2);
    const u = V.norm([n1[0] - C2[0], n1[1] - C2[1], 0]), w = V.norm([n2[0] - C2[0], n2[1] - C2[1], 0]);
    let out = V.norm(V.mul(V.add(u, w), -1)); if (V.len(V.add(u, w)) < 0.05) out = [0, -1, 0];
    const st = centers.has(c);
    const items = [sb.f, sb.b].map((j) => ({ j, z: P[j][2] - P[c][2], g: mol.groupAt[j] }));
    items.sort((x, y) => y.z - x.z);
    items.forEach((it, n) => {
      if (!st && it.g === 'H') return;
      const ang = Math.atan2(out[1], out[0]) + (n === 0 ? -0.62 : 0.62) * (st ? 1 : 0.0);
      const L = 1.0;
      const q = [C2[0] + Math.cos(ang) * L, C2[1] + Math.sin(ang) * L];
      const type = !st || o.plain ? 1 : it.z > 0.2 ? 'w' : it.z < -0.2 ? 'h' : 1;
      const lab = glab(it.g).replace(/₂/g, '2').replace(/₃/g, '3');
      const i = s.a(q[0], q[1], lab, { cls: pr(it.j) >= 0 ? 'g' + (pr(it.j) + 1) : '' });
      s.b(vid[c], i, type);
      p3[it.j] = [q[0], -q[1], type === 'w' ? 0.8 : type === 'h' ? -0.8 : 0];
      tag(it.j, lab, q[0] + 0.32, q[1] - 0.28);
    });
  });
  s._p3 = p3; s._vid = vid;
  return s;
}
export function wedgeSVG(mol, o = {}) {
  const s = wedgeS(mol, o);
  const svg = render(s, { scale: o.scale || 46, fs: o.fs || 16, zoom: o.zoom || 1.1 });
  svg._p3 = s._p3; svg._vid = s._vid; svg.setAttribute('aria-label', o.alt || 'Estrutura em cunha e tracejado');
  return svg;
}
/** R/S lido do desenho (para validação) */
export function descFromWedge(mol, s, c) {
  const r = rankCenter(mol, c).order;
  const v = r.map((j) => V.sub(s._p3[j], s._p3[c]));
  return chir(v[0], v[1], v[2], v[3]);
}

/* ===================================================================
 * Fischer
 * =================================================================== */
const NS = 'http://www.w3.org/2000/svg';
export function fischerGroups(mol) {
  const F = mol.fischer, m = mol.C.length;
  return mol.info.sub.map((sb, k) => {
    const lr = F.lr[k];
    const up = k === 0 ? mol.t0 : mol.C[k - 1], dn = k === m - 1 ? mol.tn : mol.C[k + 1];
    return { c: mol.C[k], up, dn, left: lr === 'fb' ? sb.f : sb.b, right: lr === 'fb' ? sb.b : sb.f };
  });
}
/** cruz genérica: rows = [{left, right, prio?}], top, bottom (rótulos) */
export function fischerSVG(mol, o = {}) {
  const G = fischerGroups(mol), m = G.length;
  const lab = (j) => glab(mol.groupAt[j] || '');
  const W = 240, rowH = 70, top = 46, H = top * 2 + rowH * (m - 1) + 30;
  const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('class', 'chem fischer'); svg.setAttribute('role', 'img');
  svg.style.maxWidth = (o.maxw || 230) + 'px';
  const cx = W / 2;
  const prio = o.prio !== undefined ? rankCenter(mol, o.prio).order : null;
  const cls = (j) => (prio && prio.indexOf(j) >= 0 ? 'g' + (prio.indexOf(j) + 1) : '');
  const tx = (x, y, t, c) => text(svg, x, y, t, { class: 'atom ' + (c || ''), 'font-size': 19 });
  const y0 = top + 4;
  el('line', { x1: cx, y1: y0 - 30, x2: cx, y2: y0 + rowH * (m - 1) + 30, class: 'fv' + (o.wedges ? ' fh' : '') }, svg);
  tx(cx, y0 - 42, lab(mol.t0), cls(mol.t0));
  tx(cx, y0 + rowH * (m - 1) + 44, lab(mol.tn), cls(mol.tn));
  G.forEach((g, k) => {
    const y = y0 + rowH * k;
    el('line', { x1: cx - 52, y1: y, x2: cx + 52, y2: y, class: 'fhz' + (o.wedges ? ' fw' : '') }, svg);
    tx(cx - 78, y, lab(g.left), cls(g.left)); tx(cx + 78, y, lab(g.right), cls(g.right));
    if (o.labels) { const t = el('text', { x: cx + 6, y: y - 7, class: 'flab' }, svg); t.textContent = mol.desc[k] || ''; }
  });
  svg.setAttribute('aria-label', 'Projeção de Fischer: ' + G.map((g, k) => `centro ${k + 1}: esquerda ${lab(g.left)}, direita ${lab(g.right)}`).join('; '));
  return svg;
}
/** R/S de uma cruz de Fischer de um centro, com as posições dadas (índices de átomos) */
export function crossDesc(mol, c, pos) {
  const r = rankCenter(mol, c).order;
  const vec = { up: [0, 0.816, -0.577], dn: [0, -0.816, -0.577], left: [-0.816, 0, 0.577], right: [0.816, 0, 0.577] };
  const where = (j) => Object.keys(pos).find((k) => pos[k] === j);
  const v = r.map((j) => vec[where(j)]);
  return chir(v[0], v[1], v[2], v[3]);
}
/** cruz simples (1 centro) com rótulos arbitrários, para as operações */
export function crossSVG(lbl, o = {}) {
  const W = 220, Hh = 200, cx = 110, cy = 100;
  const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', `0 0 ${W} ${Hh}`); svg.setAttribute('class', 'chem fischer'); svg.style.maxWidth = (o.maxw || 200) + 'px';
  const g = el('g', { transform: `rotate(${o.rot || 0} ${cx} ${cy})` }, svg);
  el('line', { x1: cx, y1: cy - 52, x2: cx, y2: cy + 52, class: 'fv' }, g);
  el('line', { x1: cx - 52, y1: cy, x2: cx + 52, y2: cy, class: 'fhz' }, g);
  const t = (x, y, s2, c) => { const tt = text(g, x, y, s2.t, { class: 'atom ' + (s2.c || ''), 'font-size': 17 }); if (o.rot) tt.setAttribute('transform', `rotate(${-o.rot} ${x} ${y})`); void c; };
  t(cx, cy - 70, lbl.up); t(cx, cy + 72, lbl.dn); t(cx - 80, cy, lbl.left); t(cx + 80, cy, lbl.right);
  return svg;
}
export { PCLS };
