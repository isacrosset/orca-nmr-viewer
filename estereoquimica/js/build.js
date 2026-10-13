/* build.js — construtores 2D reutilizáveis (cadeias, anéis, fórmulas lineares). */
import { S, zig, ringPts } from './chem2d.js';

export const LP2 = [90, 270];
export const LP3 = [90, 180, 270];
export const LPR = [0, 90, 270];
export const LP4 = [45, 135, 225, 315];

export function cloneS(src) {
  const s = new S();
  s.atoms = src.atoms.map((a) => [a[0], a[1], a[2], Object.assign({}, a[3])]);
  s.bonds = src.bonds.map((b) => b.slice());
  s.arrows = src.arrows.map((a) => Object.assign({}, a));
  s.texts = src.texts.map((t) => t.slice());
  s.rxn = src.rxn.map((r) => r.slice());
  s.ids = src.ids;
  return s;
}
/** copia s2 para dentro de s, deslocado; devolve o mapa de índices */
export function merge(s, s2, dx = 0, dy = 0) {
  const off = s.atoms.length;
  s2.atoms.forEach((a) => s.a(a[0] + dx, a[1] + dy, a[2], Object.assign({}, a[3])));
  s2.bonds.forEach((b) => s.b(b[0] + off, b[1] + off, b[2], Object.assign({}, b[3])));
  s2.texts.forEach((t) => s.t(t[0] + dx, t[1] + dy, t[2], t[3], t[4]));
  s2.arrows.forEach((a) => s.arrows.push(a));
  return (i) => i + off;
}

/* ===================================================================
 * Construtores
 * Z(n, { dbl:[i], lab:{i:'O'}, sub:{i:[[rótulo, tipo, graus, opt]]}, up, opt:{i:{}} })
 *   cadeia em zigue-zague; a ligação i liga os átomos i e i+1.
 * =================================================================== */
export function Z(n, o = {}) {
  const s = new S();
  const up = o.up !== undefined ? o.up : true;
  const pts = zig(n, 0, 0, up);
  const ids = pts.map((p, i) => s.a(p[0], p[1], (o.lab && o.lab[i]) || '', Object.assign({}, (o.opt && o.opt[i]) || {})));
  for (let i = 0; i < n - 1; i++) s.b(ids[i], ids[i + 1], (o.dbl || []).includes(i) ? 2 : 1, (o.bopt && o.bopt[i]) || {});
  Object.entries(o.sub || {}).forEach(([k, list]) => {
    k = +k;
    const peak = pts[k][1] < 0;
    const def = list.length === 1 ? [peak ? 90 : 270] : peak ? [55, 125] : [235, 305];
    list.forEach((sp, j) => { const kk = s.br(ids[k], sp[2] !== undefined ? sp[2] : def[j], sp[0], sp[1] || 1, sp[3] || {}, sp[4]); if (sp[0] === '' && sp[1] === 2) s.bonds[s.bonds.length - 1][3] = {}; void kk; });
  });
  s.ids = ids;
  return s;
}
/** anel de 6 (vértice 0 no alto à esquerda da ligação superior) */
export function R6(o = {}) {
  const s = new S();
  const P = ringPts(6, 0, 0, -120);
  const ids = P.map((p) => s.a(p[0], p[1], '', {}));
  for (let k = 0; k < 6; k++) s.b(ids[k], ids[(k + 1) % 6], (o.dbl || []).includes(k) ? 2 : 1, (o.dbl || []).includes(k) ? { side: 1 } : {});
  Object.entries(o.sub || {}).forEach(([k, list]) => {
    k = +k;
    const out = 120 - 60 * k; // direção radial do vértice (graus, y para cima)
    const defs = list.length === 1 ? [out] : [out + 28, out - 28];
    list.forEach((sp, j) => s.br(ids[k], sp[2] !== undefined ? sp[2] : defs[j], sp[0], sp[1] || 1, sp[3] || {}, sp[4]));
  });
  s.ids = ids;
  return s;
}
/** cadeia linear (alcinos): rótulos e tipos de ligação */
export function L(labels, types, o = {}) {
  const s = new S();
  let x = 0;
  const ids = labels.map((lab, i) => {
    if (i) x += (types[i - 1] === 3 ? 1.2 : 1.05) + (lab.length > 2 ? 0.15 * (lab.length - 2) : 0) + (labels[i - 1].length > 2 ? 0.15 * (labels[i - 1].length - 2) : 0);
    return s.a(x, 0, lab, Object.assign({}, (o.opt && o.opt[i]) || {}));
  });
  types.forEach((t, i) => s.b(ids[i], ids[i + 1], t));
  s.ids = ids;
  return s;
}

/* ===================================================================
 * Biblioteca de moléculas (funções → S)
 * =================================================================== */
