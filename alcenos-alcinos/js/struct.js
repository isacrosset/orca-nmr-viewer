/*
 * struct.js — estruturas 2D (fórmulas de esqueleto e condensadas) de alcenos,
 * alcinos, produtos de adição e quadros de mecanismos. Valências conferidas:
 * vértices sem rótulo são carbonos com os H implícitos.
 */
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
const zcis = (a, b, o = {}) => { // alceno dissubstituído Z desenhado em "U"
  const s = new S(); const c1 = s.a(0, 0), c2 = s.a(1, 0); s.b(c1, c2, 2);
  s.br(c1, 240, a, 1, o.oa || {}); s.br(c2, 300, b, 1, o.ob || {}); s.ids = [c1, c2]; return s;
};
export const M = {
  // ---------- alcenos ----------
  eteno: () => L(['H2C', 'CH2'], [2]),
  propeno: () => Z(3, { dbl: [1] }),
  but1eno: () => Z(4, { dbl: [2] }),
  but2enoE: () => Z(4, { dbl: [1] }),
  but2enoZ: () => zcis('', ''),
  metilpropeno: () => { const s = new S(); const a = s.a(0, 0), b = s.a(0, -1); s.b(a, b, 2); s.br(a, 210); s.br(a, 330); return s; },
  metilbut2eno: () => { const s = new S(); const a = s.a(0, 0), b = s.a(1, 0); s.b(a, b, 2); s.br(a, 120); s.br(a, 240); s.br(b, 300); return s; },
  metilbut1eno3: () => Z(4, { dbl: [0], sub: { 2: [['']] } }), // 3-metilbut-1-eno
  dimetilbut1eno33: () => Z(4, { dbl: [0], sub: { 2: [[''], ['']] } }),
  dimetilbut2eno: () => { const s = new S(); const a = s.a(0, 0), b = s.a(1, 0); s.b(a, b, 2); s.br(a, 120); s.br(a, 240); s.br(b, 60); s.br(b, 300); return s; },
  pent1eno: () => Z(5, { dbl: [3] }),
  pent2enoE: () => Z(5, { dbl: [1] }),
  ciclohexeno: () => R6({ dbl: [0] }),
  metilciclohexeno: () => R6({ dbl: [0], sub: { 0: [['']] } }),
  dimetilciclohexeno: () => R6({ dbl: [0], sub: { 0: [['']], 1: [['']] } }),
  estireno: () => { const s = R6({ dbl: [1, 3, 5] }); const a = s.br(s.ids[0], 120); s.br(a, 180, '', 2); return s; },
  // ---------- alcinos ----------
  etino: () => L(['H', '', '', 'H'], [1, 3, 1]),
  propino: () => L(['H3C', '', '', 'H'], [1, 3, 1]),
  but1ino: () => L(['CH3CH2', '', '', 'H'], [1, 3, 1]),
  but2ino: () => L(['H3C', '', '', 'CH3'], [1, 3, 1]),
  pent2ino: () => L(['H3C', '', '', 'CH2CH3'], [1, 3, 1]),
  hex3ino: () => L(['CH3CH2', '', '', 'CH2CH3'], [1, 3, 1]),
  hex1ino: () => L(['CH3CH2CH2CH2', '', '', 'H'], [1, 3, 1]),
  acetileto: () => { const s = L(['H3C', '', 'C', ''], [1, 3, 1]); s.atoms.pop(); s.bonds.pop(); s.atoms[2][3] = { chg: '−', lp: [0] }; return s; },
  // ---------- alcanos ----------
  propano: () => Z(3),
  butano: () => Z(4),
  metilbutano2: () => Z(4, { sub: { 1: [['']] } }),
  ciclohexano: () => R6(),
  metilciclohexano: () => R6({ sub: { 0: [['']] } }),
  cisDimetilciclohexano: () => R6({ sub: { 0: [['', 'w']], 1: [['', 'w']] } }),
  // ---------- haletos ----------
  bromopropano2: () => Z(3, { sub: { 1: [['Br', 1, undefined, { cls: 'add' }]] }, up: false }),
  bromometilbutano2: () => Z(4, { sub: { 1: [['Br', 1, 300, { cls: 'add' }], ['', 1, 240]] } }), // 2-bromo-2-metilbutano
  bromometilbutano3: () => Z(4, { sub: { 1: [['']], 2: [['Br', 1, undefined, { cls: 'add' }]] } }), // 2-bromo-3-metilbutano
  clorodimetilbutano: () => Z(4, { sub: { 1: [['Cl', 1, 300, { cls: 'add' }], ['', 1, 240]], 2: [['']] } }), // 2-cloro-2,3-dimetilbutano
  clorodimetilbutano33: () => Z(4, { sub: { 1: [[''], ['']], 2: [['Cl', 1, undefined, { cls: 'add' }]] } }), // 3-cloro-2,2-dimetilbutano
  bromometilciclohexano1: () => R6({ sub: { 0: [['Br', 1, 148, { cls: 'add' }], ['', 1, 92]] } }),
  bromociclohexano: () => R6({ sub: { 0: [['Br', 1, undefined, { cls: 'add' }]] } }),
  transDibromociclohexano: () => R6({ sub: { 0: [['Br', 'h', undefined, { cls: 'add' }]], 1: [['Br', 'w', undefined, { cls: 'add' }]] } }),
  transDibromoMetil: () => R6({ sub: { 0: [['Br', 'h', 148, { cls: 'add' }], ['', 1, 92]], 1: [['Br', 'w', undefined, { cls: 'add' }]] } }),
  bromopropeno2: () => { const s = new S(); const a = s.a(0, 0), b = s.a(0, -1); s.b(a, b, 2); s.br(a, 210); s.br(a, 330, 'Br', 1, { cls: 'add' }); return s; },
  dibromopropano22: () => Z(3, { sub: { 1: [['Br', 1, 125, { cls: 'add' }], ['Br', 1, 55, { cls: 'add' }]] }, up: false }),
  dibromobutano22: () => Z(4, { sub: { 1: [['Br', 1, 125, { cls: 'add' }], ['Br', 1, 55, { cls: 'add' }]] }, up: false }),
  dibromopropenoE: () => { const s = new S(); const a = s.a(0, 0), b = s.a(1, 0); s.b(a, b, 2); s.br(a, 120, 'Br', 1, { cls: 'add' }); s.br(a, 240); s.br(b, 300, 'Br', 1, { cls: 'add' }); return s; }, // (E)-1,2-dibromopropeno
  dibromobutenoE: () => { const s = new S(); const a = s.a(0, 0), b = s.a(1, 0); s.b(a, b, 2); s.br(a, 120, 'Br', 1, { cls: 'add' }); s.br(a, 240); s.br(b, 300, 'Br', 1, { cls: 'add' }); s.br(b, 60); return s; },
  tetrabromopropano: () => Z(3, { sub: { 1: [['Br', 1, 125, { cls: 'add' }], ['Br', 1, 55, { cls: 'add' }]], 2: [['Br', 1, 270, { cls: 'add' }], ['Br', 1, 15, { cls: 'add' }]] }, up: false }),
  tetrabromobutano: () => Z(4, { sub: { 1: [['Br', 1, 125, { cls: 'add' }], ['Br', 1, 55, { cls: 'add' }]], 2: [['Br', 1, 235, { cls: 'add' }], ['Br', 1, 305, { cls: 'add' }]] }, up: false }),
  bromobut2eno: () => { const s = new S(); const a = s.a(0, 0), b = s.a(1, 0); s.b(a, b, 2); s.br(a, 120); s.br(a, 240); s.br(b, 300, 'Br', 1, { cls: 'add' }); s.br(b, 60); return s; },
  // ---------- álcoois, dióis, éteres ----------
  propanol2: () => Z(3, { sub: { 1: [['OH', 1, undefined, { cls: 'add' }]] }, up: false }),
  propanol1: () => Z(4, { lab: { 3: 'OH' }, opt: { 3: { cls: 'add' } } }),
  metilpropanol2: () => { const s = new S(); const c = s.a(0, 0); s.br(c, 210); s.br(c, 330); s.br(c, 90); s.br(c, 270, 'OH', 1, { cls: 'add' }); return s; },
  metilbutanol2: () => Z(4, { sub: { 1: [['OH', 1, 300, { cls: 'add' }], ['', 1, 240]] } }), // 2-metilbutan-2-ol
  metilbutanol3: () => Z(4, { sub: { 1: [['OH', 1, undefined, { cls: 'add' }]], 2: [['']] }, up: false }), // 3-metilbutan-2-ol
  metilbutanol1: () => Z(5, { sub: { 3: [['']] }, lab: { 0: 'HO' }, opt: { 0: { cls: 'add' } } }), // 3-metilbutan-1-ol
  ciclohexanol: () => R6({ sub: { 0: [['OH', 1, undefined, { cls: 'add' }]] } }),
  metilciclohexanol1: () => R6({ sub: { 0: [['OH', 1, 148, { cls: 'add' }], ['', 1, 92]] } }),
  transMetilciclohexanol2: () => R6({ sub: { 0: [['', 'h']], 1: [['OH', 'w', undefined, { cls: 'add' }]] } }),
  cisDiolCiclohexano: () => R6({ sub: { 0: [['OH', 'w', undefined, { cls: 'add' }]], 1: [['OH', 'w', undefined, { cls: 'add' }]] } }),
  cisDiolMetil: () => R6({ sub: { 0: [['OH', 'w', 148, { cls: 'add' }], ['', 'h', 92]], 1: [['OH', 'w', undefined, { cls: 'add' }]] } }),
  propanodiol: () => { const s = Z(3, { sub: { 1: [['OH', 1, undefined, { cls: 'add' }]] }, up: false }); s.br(s.ids[2], 30, 'OH', 1, { cls: 'add' }); return s; },
  // haloidrinas
  bromopropanol: () => { const s = Z(3, { sub: { 1: [['OH', 1, undefined, { cls: 'add' }]] }, up: false }); s.br(s.ids[2], 30, 'Br', 1, { cls: 'add' }); return s; }, // 1-bromopropan-2-ol
  transBromociclohexanol: () => R6({ sub: { 0: [['OH', 'h', undefined, { cls: 'add' }]], 1: [['Br', 'w', undefined, { cls: 'add' }]] } }),
  transBromoMetilciclohexanol: () => R6({ sub: { 0: [['OH', 'h', 148, { cls: 'add' }], ['', 1, 92]], 1: [['Br', 'w', undefined, { cls: 'add' }]] } }),
  // epóxidos
  oxidoPropeno: () => { const s = new S(); const a = s.a(0, 0), b = s.a(1, 0), o = s.a(0.5, -0.85, 'O', { cls: 'add' }); s.b(a, b).b(a, o).b(b, o); s.br(b, -40); return s; },
  oxidoCiclohexeno: () => { const s = R6(); const P0 = s.atoms[0], P1 = s.atoms[1]; const o = s.a((P0[0] + P1[0]) / 2, P0[1] - 0.85, 'O', { cls: 'add' }); s.b(0, o).b(1, o); return s; },
  oxidoMetilciclohexeno: () => { const s = R6({ sub: { 0: [['', 1, 170]] } }); const P0 = s.atoms[0], P1 = s.atoms[1]; const o = s.a((P0[0] + P1[0]) / 2, P0[1] - 0.85, 'O', { cls: 'add' }); s.b(0, o).b(1, o); return s; },
  // ---------- carbonílicos ----------
  metanal: () => L(['H2C', 'O'], [2], { opt: { 1: { cls: 'add' } } }),
  etanal: () => Z(3, { dbl: [1], lab: { 2: 'O' }, opt: { 2: { cls: 'add' } } }),
  propanal: () => Z(4, { dbl: [2], lab: { 3: 'O' }, opt: { 3: { cls: 'add' } } }),
  propanona: () => Z(3, { sub: { 1: [['O', 2, undefined, { cls: 'add' }]] } }),
  butanona: () => Z(4, { sub: { 1: [['O', 2, undefined, { cls: 'add' }]] } }),
  metilpropanal: () => Z(4, { dbl: [2], lab: { 3: 'O' }, opt: { 3: { cls: 'add' } }, sub: { 1: [['']] } }),
  hexanodial: () => Z(8, { dbl: [0, 6], lab: { 0: 'O', 7: 'O' }, opt: { 0: { cls: 'add' }, 7: { cls: 'add' } } }),
  oxoheptanal: () => Z(8, { dbl: [6], lab: { 7: 'O' }, opt: { 7: { cls: 'add' } }, sub: { 1: [['O', 2, undefined, { cls: 'add' }]] } }),
  acidoAcetico: () => Z(3, { lab: { 2: 'OH' }, opt: { 2: { cls: 'add' } }, sub: { 1: [['O', 2, undefined, { cls: 'add' }]] } }),
  acidoPropanoico: () => Z(4, { lab: { 3: 'OH' }, opt: { 3: { cls: 'add' } }, sub: { 2: [['O', 2, undefined, { cls: 'add' }]] } }),
  acidoHexanodioico: () => Z(8, { lab: { 0: 'HO', 7: 'OH' }, opt: { 0: { cls: 'add' }, 7: { cls: 'add' } }, sub: { 1: [['O', 2, undefined, { cls: 'add' }]], 6: [['O', 2, undefined, { cls: 'add' }]] } }),
  oxoheptanoico: () => Z(8, { lab: { 7: 'OH' }, opt: { 7: { cls: 'add' } }, sub: { 1: [['O', 2, undefined, { cls: 'add' }]], 6: [['O', 2, undefined, { cls: 'add' }]] } }),
  co2: () => L(['O', 'C', 'O'], [2, 2]),
  enolPropanona: () => { const s = new S(); const a = s.a(0, 0), b = s.a(0, -1); s.b(a, b, 2); s.br(a, 210); s.br(a, 330, 'OH', 1, { cls: 'add' }); return s; },
  enolPropanal: () => Z(4, { dbl: [1], lab: { 3: 'OH' }, opt: { 3: { cls: 'add' } } }),
  // ---------- outros ----------
  propilAcetileto: () => L(['H3C', '', 'C'], [1, 3], { opt: { 2: { chg: '−', lp: [0] } } }),
  but2inoProd: () => L(['H3C', '', '', 'CH3'], [1, 3, 1], { opt: { 3: { cls: 'add' } } }),
  pent2inoProd: () => L(['H3C', '', '', 'CH2CH3'], [1, 3, 1], { opt: { 3: { cls: 'add' } } }),
};
// 1-bromopropano (para comparação anti-Markovnikov)
M.bromopropano1 = () => Z(4, { lab: { 3: 'Br' }, opt: { 3: { cls: 'add' } } });
M.dibromopropano12 = () => { const s = Z(3, { sub: { 1: [['Br', 1, undefined, { cls: 'add' }]] }, up: false }); s.br(s.ids[2], 30, 'Br', 1, { cls: 'add' }); return s; };
M.metilbutanodiol = () => Z(5, { lab: { 4: 'OH' }, opt: { 4: { cls: 'add' } }, sub: { 1: [['']], 2: [['OH', 1, undefined, { cls: 'add' }]] } }); // 3-metilbutano-1,2-diol
M.dibromoMetilbutano = () => Z(5, { lab: { 4: 'Br' }, opt: { 4: { cls: 'add' } }, sub: { 1: [['']], 2: [['Br', 1, undefined, { cls: 'add' }]] } }); // 1,2-dibromo-3-metilbutano
M.bromoMetilbutanol = () => Z(5, { lab: { 4: 'Br' }, opt: { 4: { cls: 'add' } }, sub: { 1: [['']], 2: [['OH', 1, undefined, { cls: 'add' }]] } }); // 1-bromo-3-metilbutan-2-ol
M.isopropiloxirano = () => { const s = new S(); const a = s.a(0, 0), b = s.a(1, 0), o = s.a(0.5, -0.85, 'O', { cls: 'add' }); s.b(a, b).b(a, o).b(b, o); const c = s.br(b, -30); s.br(c, 30); s.br(c, -90); return s; };
M.hexano = () => Z(6);

/* nomes por chave (para listas de opções) */
export const NAMES = {
  eteno: 'eteno', propeno: 'propeno', but1eno: 'but-1-eno', but2enoE: '(E)-but-2-eno', but2enoZ: '(Z)-but-2-eno', metilpropeno: '2-metilpropeno',
  metilbut2eno: '2-metilbut-2-eno', metilbut1eno3: '3-metilbut-1-eno', dimetilbut1eno33: '3,3-dimetilbut-1-eno', dimetilbut2eno: '2,3-dimetilbut-2-eno',
  ciclohexeno: 'ciclo-hexeno', metilciclohexeno: '1-metilciclo-hexeno', etino: 'etino', propino: 'propino', but1ino: 'but-1-ino', but2ino: 'but-2-ino',
  propano: 'propano', butano: 'butano', ciclohexano: 'ciclo-hexano', metilciclohexano: 'metilciclo-hexano',
};

/* ===================================================================
 * Mecanismos (quadros 2D)
 * =================================================================== */
const add = { cls: 'add' }, el = { cls: 'el' }, pi = { cls: 'pi' };

/** adição genérica C=C + A–B */
export function genericAddition() {
  const r = new S();
  const c1 = r.a(0, 0, 'C', pi), c2 = r.a(1.3, 0, 'C', pi);
  r.b(c1, c2, 2);
  [[c1, 150], [c1, 210], [c2, 30], [c2, 330]].forEach(([c, d]) => r.br(c, d, 'R', 1, null, 0.9));
  const A = r.a(0.65, -1.45, 'A', el), B = r.a(0.65, -2.6, 'B', add);
  r.b(A, B);
  const a1 = cloneS(r);
  a1.arrow({ b: [c1, c2] }, { a: A, ang: 270 }, -0.45, 'c');
  a1.arrow({ b: [A, B] }, { a: B, ang: 0 }, -0.6, '');
  const p = new S();
  const d1 = p.a(0, 0, 'C', {}), d2 = p.a(1.3, 0, 'C', {});
  p.b(d1, d2);
  p.br(d1, 90, 'A', 1, el); p.br(d1, 180, 'R', 1, null, 0.9); p.br(d1, 270, 'R', 1, null, 0.9);
  p.br(d2, 270, 'B', 1, add); p.br(d2, 0, 'R', 1, null, 0.9); p.br(d2, 90, 'R', 1, null, 0.9);
  return [r, a1, p];
}

/** HBr + propeno (Markovnikov) */
export function hbrFrames() {
  const r = new S();
  const c1 = r.a(0, 0, 'H2C', pi), c2 = r.a(1.35, 0, 'CH', pi), c3 = r.a(2.7, 0, 'CH3');
  r.b(c1, c2, 2).b(c2, c3);
  const H = r.a(0.1, -1.45, 'H', el), Br = r.a(0.1, -2.65, 'Br', { lp: [90, 0, 180] });
  r.b(H, Br);
  const a = cloneS(r);
  a.arrow({ b: [c1, c2] }, { a: H, ang: 300 }, -0.45, 'c');
  a.arrow({ b: [H, Br] }, { a: Br, ang: 0 }, -0.6, '');
  const i = new S();
  const d1 = i.a(0, 0, 'H3C'), d2 = i.a(1.35, 0, 'CH', { chg: '+', halo: 'o' }), d3 = i.a(2.7, 0, 'CH3');
  i.b(d1, d2).b(d2, d3);
  const bm = i.a(1.35, 1.6, 'Br', { chg: '−', lp: LP4, cls: 'add' });
  const ia = cloneS(i);
  ia.arrow({ lp: [bm, 90] }, { a: d2, ang: 270 }, 0.25, '');
  const p = new S();
  const e1 = p.a(0, 0, 'H3C'), e2 = p.a(1.35, 0, 'CH'), e3 = p.a(2.7, 0, 'CH3');
  p.b(e1, e2).b(e2, e3); p.br(e2, 270, 'Br', 1, add);
  return { r, a, i, ia, p };
}
/** os dois carbocátions possíveis na protonação do propeno */
export function propCations() {
  const sec = new S();
  const a = sec.a(0, 0, 'H3C'), b = sec.a(1.35, 0, 'CH', { chg: '+', halo: 'g' }), c = sec.a(2.7, 0, 'CH3'); sec.b(a, b).b(b, c);
  const pri = new S();
  const x = pri.a(0, 0, 'H2C', { chg: '+', halo: 'm' }), y = pri.a(1.4, 0, 'CH2'), z = pri.a(2.75, 0, 'CH3'); pri.b(x, y).b(y, z);
  return { sec, pri };
}

/** bromação do ciclo-hexeno: bromônio → ataque anti */
export function brominationFrames() {
  const base = () => { const s = R6({ dbl: [0] }); s.atoms[0][3] = pi; s.atoms[1][3] = pi; return s; };
  const r = base();
  const P0 = r.atoms[0], P1 = r.atoms[1];
  const mx = (P0[0] + P1[0]) / 2, top = P0[1];
  const B1 = r.a(mx, top - 1.25, 'Br', { lp: [0, 180], cls: 'el' }), B2 = r.a(mx, top - 2.45, 'Br', { lp: [0, 90, 180] });
  r.b(B1, B2);
  const a = cloneS(r);
  a.arrow({ b: [0, 1] }, { a: B1, ang: 300 }, -0.5, 'c');
  a.arrow({ lp: [B1, 180] }, { a: 0, ang: 100 }, 0.5, 'o');
  a.arrow({ b: [B1, B2] }, { a: B2, ang: 0 }, -0.6, '');
  // bromônio
  const i = R6(); const Q0 = i.atoms[0], Q1 = i.atoms[1];
  const Bp = i.a((Q0[0] + Q1[0]) / 2, Q0[1] - 0.95, 'Br', { chg: '+', lp: [90], cls: 'el', halo: 'o' });
  i.b(0, Bp).b(1, Bp);
  const Bm = i.a(Q1[0] + 1.5, Q1[1] + 1.1, 'Br', { chg: '−', lp: LP4, cls: 'add' });
  const ia = cloneS(i); ia.texts = [];
  ia.arrow({ lp: [Bm, 135] }, { a: 1, ang: 330 }, 0.3, 'o');
  ia.arrow({ b: [1, Bp] }, { a: Bp, ang: 0 }, -0.6, '');
  i.texts = [];
  const p = M.transDibromociclohexano();
  return { r, a, i, ia, p };
}

/** hidratação ácida do 2-metilpropeno */
export function hydrationFrames() {
  const mkAlk = () => { const s = new S(); const c1 = s.a(0, 0, 'C', pi), c2 = s.a(1.35, 0, 'CH2', pi); s.b(c1, c2, 2); s.br(c1, 150, 'H3C'); s.br(c1, 210, 'H3C'); return s; };
  const r = mkAlk();
  const H = r.a(1.45, -1.45, 'H', el), O = r.a(1.45, -2.65, 'O', { chg: '+', lp: [90] });
  r.b(H, O); r.br(O, 20, 'H', 1, null, 0.85); r.br(O, 160, 'H', 1, null, 0.85);
  const a = cloneS(r);
  a.arrow({ b: [0, 1] }, { a: H, ang: 240 }, 0.45, 'c');
  a.arrow({ b: [H, O] }, { a: O, ang: 0 }, -0.6, '');
  const cat = () => { const s = new S(); const c = s.a(0, 0, 'C', { chg: '+', halo: 'o' }); s.br(c, 90, 'CH3'); s.br(c, 210, 'H3C'); s.br(c, 330, 'CH3'); return s; };
  const i1 = cat();
  const W = i1.a(0, 1.85, 'O', { lp: [90, 0] }); i1.br(W, 210, 'H', 1, null, 0.85); i1.br(W, 330, 'H', 1, null, 0.85);
  const i1a = cloneS(i1); i1a.arrow({ lp: [W, 90] }, { a: 0, ang: 270 }, 0.3, 'o');
  const i2 = new S();
  const c = i2.a(0, 0, 'C'); i2.br(c, 90, 'CH3'); i2.br(c, 210, 'H3C'); i2.br(c, 330, 'CH3');
  const Ox = i2.br(c, 270, 'O', 1, { chg: '+', lp: [0], cls: 'add' }, 1.15);
  const Hx = i2.br(Ox, 200, 'H', 1, null, 0.85); i2.br(Ox, 340, 'H', 1, null, 0.85);
  const W2 = i2.a(-1.9, 2.4, 'O', { lp: [90, 0] }); i2.br(W2, 210, 'H', 1, null, 0.85); i2.br(W2, 330, 'H', 1, null, 0.85);
  const i2a = cloneS(i2);
  i2a.arrow({ lp: [W2, 90] }, { a: Hx, ang: 200 }, -0.3, 'o');
  i2a.arrow({ b: [Ox, Hx] }, { a: Ox, ang: 230 }, 0.6, 'c');
  const p = M.metilpropanol2();
  return [r, a, i1, i1a, i2, i2a, p];
}

/** oximercuração-desmercuração do propeno */
export function oxymercFrames() {
  const r = new S();
  const c1 = r.a(0, 0, 'H2C', pi), c2 = r.a(1.35, 0, 'CH', pi), c3 = r.a(2.7, 0, 'CH3');
  r.b(c1, c2, 2).b(c2, c3);
  const Hg = r.a(0.65, -1.5, 'HgOAc', { chg: '+', cls: 'el' });
  const a = cloneS(r); a.arrow({ b: [c1, c2] }, { a: Hg, ang: 270 }, -0.4, 'c');
  const i = new S();
  const d1 = i.a(0, 0, 'H2C'), d2 = i.a(1.35, 0, 'CH', { d: '+', dd: [0.3, 0.55] }), d3 = i.a(2.7, 0, 'CH3');
  i.b(d1, d2).b(d2, d3);
  const Hg2 = i.a(0.65, -1.25, 'HgOAc', { chg: '+', cls: 'el' });
  i.b(d1, Hg2).b(d2, Hg2, 'p');
  const W = i.a(1.35, 1.8, 'O', { lp: [90, 0] }); i.br(W, 210, 'H', 1, null, 0.85); i.br(W, 330, 'H', 1, null, 0.85);
  const ia = cloneS(i);
  ia.arrow({ lp: [W, 90] }, { a: d2, ang: 270 }, 0.25, 'o');
  ia.arrow({ b: [d2, Hg2] }, { a: Hg2, ang: 0 }, -0.5, '');
  const p1 = new S();
  const e1 = p1.a(0, 0, 'H2C'), e2 = p1.a(1.35, 0, 'CH'), e3 = p1.a(2.7, 0, 'CH3'); p1.b(e1, e2).b(e2, e3);
  p1.br(e1, 90, 'HgOAc', 1, { cls: 'el' }); p1.br(e2, 270, 'OH', 1, add);
  p1.r(3.6, 5.4, 0, 'NaBH₄', '(desmercuração)');
  const q = M.propanol2(); merge(p1, q, 6.2, 0);
  return [r, a, i, ia, p1];
}

/** hidroboração-oxidação do propeno */
export function hydroborationFrames() {
  const r = new S();
  const c1 = r.a(0, 0, 'H2C', pi), c2 = r.a(1.35, 0, 'CH', pi), c3 = r.a(2.7, 0, 'CH3');
  r.b(c1, c2, 2).b(c2, c3);
  const B = r.a(0, -1.45, 'B', el), Hb = r.a(1.35, -1.45, 'H', el);
  r.b(B, Hb); r.br(B, 150, 'H', 1, null, 0.85); r.br(B, 210, 'H', 1, null, 0.85);
  const a = cloneS(r);
  a.arrow({ b: [c1, c2] }, { a: B, ang: 300 }, -0.35, 'c');
  a.arrow({ b: [B, Hb] }, { a: c2, ang: 90 }, -0.55, '');
  const ts = new S();
  const t1 = ts.a(0, 0, 'H2C', { cls: 'ts' }), t2 = ts.a(1.35, 0, 'CH', { cls: 'ts', d: '+', dd: [0.42, 0.4] }), t3 = ts.a(2.7, 0, 'CH3');
  ts.b(t1, t2, '1p').b(t2, t3);
  const tB = ts.a(0, -1.4, 'BH2', { cls: 'el', d: '−', dd: [-0.55, -0.4] }), tH = ts.a(1.35, -1.4, 'H', el);
  ts.b(t1, tB, 'p').b(tB, tH, 'p').b(tH, t2, 'p');
  ts.t(-1.3, -0.7, '[', 'note', 90).t(3.6, -0.7, ']', 'note', 90).t(4.0, -2.0, '‡', 'chg', 24);
  const p1 = new S();
  const e1 = p1.a(0, 0, 'H2C'), e2 = p1.a(1.35, 0, 'CH2'), e3 = p1.a(2.7, 0, 'CH3'); p1.b(e1, e2).b(e2, e3);
  p1.br(e1, 90, 'BH2', 1, el);
  p1.r(3.6, 5.6, 0, 'H₂O₂, OH⁻', 'B → OH (retenção)');
  merge(p1, M.propanol1(), 6.3, 0);
  return [r, a, ts, p1];
}

/** haloidrina: propeno + Br2/H2O */
export function halohydrinFrames() {
  const i = new S();
  const d1 = i.a(0, 0, 'H2C'), d2 = i.a(1.35, 0, 'CH', { d: '+', dd: [0.35, 0.55] }), d3 = i.a(2.7, 0, 'CH3');
  i.b(d1, d2).b(d2, d3);
  const Bp = i.a(0.65, -1.15, 'Br', { chg: '+', lp: [90], cls: 'el' });
  i.b(d1, Bp).b(d2, Bp);
  const W = i.a(1.35, 1.8, 'O', { lp: [90, 0] }); i.br(W, 210, 'H', 1, null, 0.85); i.br(W, 330, 'H', 1, null, 0.85);
  const ia = cloneS(i);
  ia.arrow({ lp: [W, 90] }, { a: d2, ang: 270 }, 0.25, 'o');
  ia.arrow({ b: [d2, Bp] }, { a: Bp, ang: 0 }, -0.5, '');
  const p = M.bromopropanol();
  return [i, ia, p];
}

/** epoxidação (concertada) com perácido */
export function epoxFrames() {
  const r = new S();
  const c1 = r.a(0, 0, 'C', pi), c2 = r.a(1.3, 0, 'C', pi); r.b(c1, c2, 2);
  [[c1, 150], [c1, 210], [c2, 30], [c2, 330]].forEach(([c, d]) => r.br(c, d, 'R', 1, null, 0.85));
  const Oa = r.a(0.65, -1.4, 'O', { cls: 'el', lp: [150] }), Ob = r.a(1.75, -2.1, 'O'), Cc = r.a(1.75, -3.35, 'C'), Oc = r.a(0.6, -3.9, 'O', { lp: [180] });
  const Ha = r.a(-0.1, -2.6, 'H');
  r.b(Oa, Ob).b(Ob, Cc).b(Cc, Oc, 2).b(Oa, Ha); r.br(Cc, 30, 'R′', 1, null, 0.9);
  r.t(-0.55, -3.3, '···', 'note', 16);
  const ts = new S();
  const t1 = ts.a(0, 0, 'C', { cls: 'ts' }), t2 = ts.a(1.3, 0, 'C', { cls: 'ts' }); ts.b(t1, t2, '1p');
  [[t1, 150], [t1, 210], [t2, 30], [t2, 330]].forEach(([c, d]) => ts.br(c, d, 'R', 1, null, 0.85));
  const tO = ts.a(0.65, -1.25, 'O', { cls: 'ts' }); ts.b(t1, tO, 'p').b(t2, tO, 'p');
  const tOb = ts.a(1.75, -2.1, 'O'); ts.b(tO, tOb, 'p');
  const tC = ts.a(1.75, -3.35, 'C'), tOc = ts.a(0.6, -3.9, 'O'), tH = ts.a(-0.1, -2.6, 'H');
  ts.b(tOb, tC).b(tC, tOc, '1p').b(tO, tH, 'p').b(tH, tOc, 'p'); ts.br(tC, 30, 'R′', 1, null, 0.9);
  ts.t(3.2, -1.2, '‡', 'chg', 24);
  const p = new S();
  const e1 = p.a(0, 0, 'C'), e2 = p.a(1.3, 0, 'C'), eo = p.a(0.65, -1.05, 'O', add); p.b(e1, e2).b(e1, eo).b(e2, eo);
  [[e1, 150], [e1, 210], [e2, 30], [e2, 330]].forEach(([c, d]) => p.br(c, d, 'R', 1, null, 0.85));
  p.plus(3.0, 0); merge(p, Z(3, { lab: { 0: 'R′', 2: 'OH' }, sub: { 1: [['O', 2]] } }), 3.8, 0);
  return [r, ts, p];
}

/** di-hidroxilação syn com OsO4 */
export function osmiumFrames() {
  const r = R6({ dbl: [0] });
  const P0 = r.atoms[0], P1 = r.atoms[1];
  const Os = r.a((P0[0] + P1[0]) / 2, P0[1] - 2.2, 'Os', { cls: 'el' });
  const O1 = r.a(P0[0] - 0.2, P0[1] - 1.3, 'O'), O2 = r.a(P1[0] + 0.2, P1[1] - 1.3, 'O');
  r.b(Os, O1, 2).b(Os, O2, 2); r.br(Os, 150, 'O', 2, null, 0.95); r.br(Os, 30, 'O', 2, null, 0.95);
  const a = cloneS(r);
  a.arrow({ b: [0, 1] }, { a: O2, ang: 250 }, -0.4, 'c');
  a.arrow({ b: [Os, O1] }, { a: O1, ang: 180 }, 0.5, '');
  const i = R6();
  const Q0 = i.atoms[0], Q1 = i.atoms[1];
  const iO1 = i.a(Q0[0] - 0.1, Q0[1] - 1.05, 'O'), iO2 = i.a(Q1[0] + 0.1, Q1[1] - 1.05, 'O');
  const iOs = i.a((Q0[0] + Q1[0]) / 2, Q0[1] - 1.9, 'Os', { cls: 'el' });
  i.b(0, iO1, 'w').b(1, iO2, 'w').b(iO1, iOs).b(iO2, iOs); i.br(iOs, 150, 'O', 2, null, 0.95); i.br(iOs, 30, 'O', 2, null, 0.95);
  i.t(3.0, -1.0, 'éster ósmico cíclico', 'note', 13);
  const p = M.cisDiolCiclohexano();
  return [r, a, i, p];
}

/** rearranjo: 3-metilbut-1-eno + HBr (hidreto) */
export function hydrideShiftFrames() {
  const f0 = new S();
  const a = f0.a(0, 0, 'H3C'), b = f0.a(1.35, 0, 'CH', { chg: '+', halo: 'o' }), c = f0.a(2.7, 0, 'C'), d = f0.a(4.05, 0, 'CH3');
  f0.b(a, b).b(b, c).b(c, d);
  const h = f0.br(c, 90, 'H', 1, { cls: 'pi' }); f0.br(c, 270, 'CH3');
  f0.arrow({ b: [c, h] }, { a: b, ang: 60 }, 0.55, 'c');
  const f1 = new S();
  const a2 = f1.a(0, 0, 'H3C'), b2 = f1.a(1.35, 0, 'CH2'), c2 = f1.a(2.7, 0, 'C', { chg: '+', halo: 'o' }), d2 = f1.a(4.05, 0, 'CH3');
  f1.b(a2, b2).b(b2, c2).b(c2, d2); f1.br(c2, 270, 'CH3');
  const Bm = f1.a(2.7, -1.75, 'Br', { chg: '−', lp: LP4, cls: 'add' });
  f1.arrow({ lp: [Bm, 270] }, { a: c2, ang: 90 }, 0.25, '');
  return [f0, f1, M.bromometilbutano2()];
}
/** rearranjo: 3,3-dimetilbut-1-eno + HCl (metila) */
export function methylShiftFrames() {
  const f0 = new S();
  const a = f0.a(0, 0, 'H3C'), b = f0.a(1.35, 0, 'CH', { chg: '+', halo: 'o' }), c = f0.a(2.7, 0, 'C'), d = f0.a(4.05, 0, 'CH3');
  f0.b(a, b).b(b, c).b(c, d);
  const m = f0.br(c, 90, 'CH3', 1, { cls: 'pi' }); f0.br(c, 270, 'CH3');
  f0.arrow({ b: [c, m] }, { a: b, ang: 60 }, 0.55, 'c');
  const f1 = new S();
  const a2 = f1.a(0, 0, 'H3C'), b2 = f1.a(1.35, 0, 'CH'), c2 = f1.a(2.7, 0, 'C', { chg: '+', halo: 'o' }), d2 = f1.a(4.05, 0, 'CH3');
  f1.b(a2, b2).b(b2, c2).b(c2, d2); f1.br(b2, 270, 'CH3'); f1.br(c2, 270, 'CH3');
  const Cm = f1.a(2.7, -1.75, 'Cl', { chg: '−', lp: LP4, cls: 'add' });
  f1.arrow({ lp: [Cm, 270] }, { a: c2, ang: 90 }, 0.25, '');
  return [f0, f1, M.clorodimetilbutano()];
}

/** tautomeria ceto-enólica (catálise ácida) */
export function tautoFrames() {
  const r = new S();
  const c1 = r.a(0, 0, 'C'), c2 = r.a(1.35, 0, 'CH2', pi); r.b(c1, c2, 2);
  r.br(c1, 210, 'H3C'); const O = r.br(c1, 90, 'O', 1, { lp: [0, 180] }); r.br(O, 30, 'H', 1, null, 0.85);
  const H = r.a(2.75, -1.1, 'H', el), W = r.a(3.95, -1.1, 'O', { chg: '+', lp: [90] }); r.b(H, W); r.br(W, 30, 'H', 1, null, 0.85); r.br(W, 330, 'H', 1, null, 0.85);
  const a = cloneS(r);
  a.arrow({ lp: [O, 180] }, { b: [c1, O] }, 0.5, 'o');
  a.arrow({ b: [c1, c2] }, { a: H, ang: 210 }, 0.45, 'c');
  a.arrow({ b: [H, W] }, { a: W, ang: 90 }, -0.6, '');
  const i = new S();
  const d1 = i.a(0, 0, 'C'), d2 = i.a(1.35, 0, 'CH3'); i.b(d1, d2); i.br(d1, 210, 'H3C');
  const O2 = i.br(d1, 90, 'O', 2, { chg: '+', lp: [180] }); const Hx = i.br(O2, 30, 'H', 1, null, 0.85);
  const W2 = i.a(1.9, -2.2, 'O', { lp: [180, 270] }); i.br(W2, 30, 'H', 1, null, 0.85); i.br(W2, 330, 'H', 1, null, 0.85);
  const ia = cloneS(i);
  ia.arrow({ lp: [W2, 180] }, { a: Hx, ang: 0 }, 0.3, 'o');
  ia.arrow({ b: [O2, Hx] }, { a: O2, ang: 150 }, 0.6, 'c');
  return [r, a, i, ia, M.propanona()];
}

/** acetileto: formação e SN2 */
export function acetylideFrames() {
  const r = L(['H3C', '', '', 'H'], [1, 3, 1]);
  r.atoms[3][3] = { cls: 'el' };
  const N = r.a(r.atoms[3][0] + 1.5, 0, 'NH2', { chg: '−', lp: [180, 90], cls: 'base' });
  const a = cloneS(r);
  a.arrow({ lp: [N, 180] }, { a: 3, ang: 0 }, 0.5, 'o');
  a.arrow({ b: [2, 3] }, { a: 2, ang: 90 }, -0.7, 'c');
  const i = L(['H3C', '', 'C'], [1, 3]);
  i.atoms[2][3] = { chg: '−', lp: [0], halo: 'c' };
  const Cm = i.a(i.atoms[2][0] + 1.6, 0, 'CH3', { cls: 'el' }), Br = i.a(i.atoms[2][0] + 2.85, 0, 'Br', { lp: [0, 90, 270] });
  i.b(Cm, Br);
  i.t(0.9, 1.0, '+ NH₃', 'note', 14);
  const ia = cloneS(i);
  ia.arrow({ lp: [2, 0] }, { a: Cm, ang: 180 }, -0.5, 'o');
  ia.arrow({ b: [Cm, Br] }, { a: Br, ang: 90 }, -0.6, '');
  const p = M.but2inoProd(); p.t(4.6, 0, '+ Br⁻', 'note', 15);
  return [r, a, i, ia, p];
}

/** redução com Na/NH3 (simplificada) */
export function dissolvingFrames() {
  const f0 = M.but2ino();
  const f1 = new S(); // radical-ânion trans
  const a = f1.a(0, 0, 'C', { chg: '−', lp: [] }), b = f1.a(1.3, 0, 'C', { note: '•', nd: [0.1, -0.45] }); f1.b(a, b, 2);
  f1.br(a, 240, 'H3C'); f1.br(b, 60, 'CH3');
  f1.t(0.65, 1.3, 'radical-ânion (grupos trans)', 'note', 13);
  const f2 = new S(); // radical vinílico
  const c = f2.a(0, 0, 'C'), d = f2.a(1.3, 0, 'C', { note: '•', nd: [0.1, -0.45] }); f2.b(c, d, 2);
  f2.br(c, 240, 'H3C'); f2.br(c, 120, 'H', 1, add); f2.br(d, 60, 'CH3');
  f2.t(0.65, 1.3, 'radical vinílico (após H⁺ do NH₃)', 'note', 13);
  const f3 = new S();
  const e = f3.a(0, 0, 'C'), f = f3.a(1.3, 0, 'C', { chg: '−' }); f3.b(e, f, 2);
  f3.br(e, 240, 'H3C'); f3.br(e, 120, 'H', 1, add); f3.br(f, 60, 'CH3');
  f3.t(0.65, 1.3, 'ânion vinílico trans', 'note', 13);
  const f4 = new S();
  const g = f4.a(0, 0, 'C'), k = f4.a(1.3, 0, 'C'); f4.b(g, k, 2);
  f4.br(g, 240, 'H3C'); f4.br(g, 120, 'H', 1, add); f4.br(k, 60, 'CH3'); f4.br(k, 300, 'H', 1, add);
  return [f0, f1, f2, f3, f4];
}

/** ozonólise (esquema) do 2-metilbut-2-eno */
export function ozonolysisFrames() {
  const r = M.metilbut2eno();
  r.atoms[0][3] = pi; r.atoms[1][3] = pi;
  const m = new S(); // molozonida
  const c1 = m.a(0, 0, 'C'), c2 = m.a(1.3, 0, 'C'); m.b(c1, c2);
  const o1 = m.a(-0.1, -1.2, 'O'), o2 = m.a(1.4, -1.2, 'O'), o3 = m.a(0.65, -1.95, 'O');
  m.b(c1, o1).b(c2, o2).b(o1, o3).b(o2, o3);
  m.br(c1, 200, 'H3C'); m.br(c1, 250, 'CH3'); m.br(c2, 340, 'CH3'); m.br(c2, 290, 'H', 1, null, 0.85);
  m.t(0.65, 1.5, 'molozonídeo (1,2,3-trioxolano)', 'note', 13);
  const z = new S(); // ozonídeo
  const d1 = z.a(0, 0, 'C'), d2 = z.a(1.6, 0, 'C'), oa = z.a(0.8, -0.65, 'O'), ob = z.a(0.3, 0.95, 'O'), oc = z.a(1.3, 0.95, 'O');
  z.b(d1, oa).b(d2, oa).b(d1, ob).b(ob, oc).b(oc, d2);
  z.br(d1, 150, 'H3C'); z.br(d1, 210, 'H3C', 1, null, 0.95); z.br(d2, 30, 'CH3'); z.br(d2, 330, 'H', 1, null, 0.85);
  z.t(0.8, 2.0, 'ozonídeo (1,2,4-trioxolano)', 'note', 13);
  const p = M.propanona(); p.plus(2.8, 0); merge(p, M.etanal(), 3.6, 0);
  return [r, m, z, p];
}

/* ===================================================================
 * Exemplos de nomenclatura (esqueleto + numeração)
 * =================================================================== */
export const NOMEN = [
  { k: 'n1', s: () => Z(6, { dbl: [1], sub: { 3: [['']] }, up: true }), main: [0, 1, 2, 3, 4, 5], num: [0, 1, 2, 3, 4, 5], name: '4-metil-hex-2-eno', parts: ['4-metil', 'hex', '2', 'eno'], hint: 'A cadeia principal contém a C=C e é a mais longa possível (6 C). Numere pela extremidade mais próxima da dupla: a dupla fica em C2.' },
  { k: 'n2', s: () => Z(5, { dbl: [3], sub: { 1: [[''], ['']] } }), main: [0, 1, 2, 3, 4], num: [4, 3, 2, 1, 0], name: '4,4-dimetilpent-1-eno', parts: ['4,4-dimetil', 'pent', '1', 'eno'], hint: 'Numere a partir do CH₂= terminal (dupla em C1); as metilas ficam em C4.' },
  { k: 'n3', s: () => Z(7, { dbl: [0, 3] }), main: [0, 1, 2, 3, 4, 5, 6], num: [0, 1, 2, 3, 4, 5, 6], name: 'hepta-1,4-dieno', parts: ['hepta', '1,4', 'dieno'], hint: 'Dienos: use os localizadores das duas duplas (1 e 4) e o sufixo "-dieno" (com "a" de eufonia: hepta-).' },
  { k: 'n4', s: () => R6({ dbl: [0], sub: { 3: [['']] } }), name: '4-metilciclo-hexeno', parts: ['4-metil', 'ciclo-hexeno'], hint: 'Em cicloalcenos, os carbonos da dupla são C1 e C2 (não é preciso escrever "1"); numere para que o substituinte tenha o menor localizador: 4-metil.' },
  { k: 'n5', s: () => Z(6, { dbl: [3] }), main: [0, 1, 2, 3, 4, 5], num: [5, 4, 3, 2, 1, 0], name: 'hex-2-eno', parts: ['hex', '2', 'eno'], hint: 'A dupla está entre C4–C5 contando da esquerda; pela direita ela fica em C2: menor localizador.' },
];
