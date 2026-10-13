/*
 * struct.js — estruturas e quadros de mecanismo reutilizáveis (2D).
 * Todas as estruturas respeitam a valência: rótulos condensados (CH3, CH2…)
 * já incluem seus hidrogênios; vértices sem rótulo são carbonos de esqueleto.
 */
import { S, ringPts, zig } from './chem2d.js';

const LP3 = [90, 180, 270];
const LPR = [0, 90, 270]; // átomo à direita da ligação: pares livres não ficam sobre a ligação
const LP4 = [45, 135, 225, 315];

/* ---------- R/S de um centro desenhado (para legendas calculadas) ---------- */
/* subs: [{deg, type: 1|'w'|'h', prio}] — y para cima, z para o leitor */
export function descriptor2D(subs) {
  const v = [];
  subs.forEach((s) => {
    const r = s.deg * Math.PI / 180, z = s.type === 'w' ? 0.8 : s.type === 'h' ? -0.8 : 0;
    v[s.prio - 1] = [Math.cos(r), Math.sin(r), z];
  });
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const a = sub(v[0], v[3]), b = sub(v[1], v[3]), c = sub(v[2], v[3]);
  const cr = [b[1] * c[2] - b[2] * c[1], b[2] * c[0] - b[0] * c[2], b[0] * c[1] - b[1] * c[0]];
  return a[0] * cr[0] + a[1] * cr[1] + a[2] * cr[2] < 0 ? 'R' : 'S';
}

/* ---------- íons e espécies simples ---------- */

export function anion(label, lp = LP3, opt = {}) {
  const s = new S();
  s.a(0, 0, label, Object.assign({ chg: '−', lp, cls: opt.cls || 'nu' }, opt));
  return s;
}
export function halide(X, cls = 'lg') {
  const s = new S();
  s.a(0, 0, X, { chg: '−', lp: LP4, cls });
  return s;
}
export function water(lpAng = [60, 120], opt = {}) {
  const s = new S();
  const o = s.a(0, 0, 'O', Object.assign({ lp: lpAng }, opt));
  s.br(o, 215, 'H'); s.br(o, 325, 'H');
  return s;
}

/* ---------- substratos (centro rotulado, em cruz) ---------- */

/** C central destacado com 3 grupos (cima, esquerda, baixo) e X à direita */
export function crossSubstrate(groups, X = 'Br', o = {}) {
  const s = new S();
  const c = s.a(0, 0, 'C', { halo: o.halo === false ? null : 'c', d: o.delta ? '+' : null, dd: [-0.35, -0.55], cls: 'ec' });
  const lab = (g) => (g === 'CH3' ? 'CH3' : g);
  s.br(c, 90, lab(groups[0]));
  s.br(c, 180, groups[1] === 'CH3' ? 'H3C' : groups[1]);
  s.br(c, 270, lab(groups[2]));
  s.br(c, 0, X, 1, { cls: 'lg', d: o.delta ? '−' : null, dd: [0.1, -0.62], lp: o.lp ? LPR : null }, X === 'OTs' ? 1.1 : 1.05);
  return s;
}

/* ---------- substratos em esqueleto ---------- */

export const SK = {
  methyl(X = 'Br') { const s = new S(); const c = s.a(0, 0, 'H3C', { halo: 'c' }); const x = s.a(1.25, 0, X, { cls: 'lg' }); s.b(c, x); return s; },
  ethyl(X = 'Br') { const s = new S(); const p = zig(2); const a = s.a(...p[0]); const b = s.a(...p[1], '', { halo: 'c' }); s.b(a, b); s.br(b, -30, X, 1, { cls: 'lg' }); return s; },
  propyl(X = 'Br') { const s = new S(); const p = zig(3); const ids = p.map((q) => s.a(...q)); s.b(ids[0], ids[1]).b(ids[1], ids[2]); s.atoms[2][3] = { halo: 'c' }; s.br(ids[2], 30, X, 1, { cls: 'lg' }); return s; },
  isopropyl(X = 'Br') { const s = new S(); const c = s.a(0, 0, '', { halo: 'c' }); s.br(c, 210); s.br(c, 330); s.br(c, 90, X, 1, { cls: 'lg' }); return s; },
  tbutyl(X = 'Br') { const s = new S(); const c = s.a(0, 0, '', { halo: 'c' }); s.br(c, 210); s.br(c, 330); s.br(c, 270); s.br(c, 90, X, 1, { cls: 'lg' }); return s; },
  neopentyl(X = 'Br') { const s = new S(); const q = s.a(0, 0); s.br(q, 90); s.br(q, 210); s.br(q, 270); const c = s.br(q, 330, '', 1, { halo: 'c' }); s.br(c, 30, X, 1, { cls: 'lg' }); return s; },
  isobutyl(X = 'Br') { const s = new S(); const q = s.a(0, 0); s.br(q, 150); s.br(q, 270); const c = s.br(q, 30, '', 1, { halo: 'c' }); s.br(c, -30, X, 1, { cls: 'lg' }); return s; },
  /* 2-bromobutano com estereoquímica: wedge = 'w' ou 'h' para o Br */
  bromobutane2(X = 'Br', bt = 'w') {
    const s = new S(); const p = zig(4, 0, 0, true);
    const ids = p.map((q) => s.a(...q)); s.b(ids[0], ids[1]).b(ids[1], ids[2]).b(ids[2], ids[3]);
    s.atoms[1][3] = { halo: 'c' };
    s.br(ids[1], 90, X, bt, { cls: 'lg' });
    return s;
  },
  secbutylNu(Nu = 'OH', bt = 'h', cls = 'nu') {
    const s = new S(); const p = zig(4, 0, 0, true);
    const ids = p.map((q) => s.a(...q)); s.b(ids[0], ids[1]).b(ids[1], ids[2]).b(ids[2], ids[3]);
    s.br(ids[1], 90, Nu, bt, { cls });
    return s;
  },
  benzyl(X = 'Br') {
    const s = new S(); const R = ringPts(6, 0, 0, 0);
    const r = R.map((q) => s.a(q[0], q[1]));
    [[0, 1, 2, 1], [1, 2, 1], [2, 3, 2, 1], [3, 4, 1], [4, 5, 2, 1], [5, 0, 1]].forEach((b) => s.b(r[b[0]], r[b[1]], b[2], { side: b[3] }));
    const c = s.br(r[0], 30, '', 1, { halo: 'c' });
    s.br(c, -30, X, 1, { cls: 'lg' });
    return s;
  },
  allyl(X = 'Br') {
    const s = new S(); const p = zig(3, 0, 0, false);
    const ids = p.map((q) => s.a(...q));
    s.b(ids[0], ids[1], 2).b(ids[1], ids[2]);
    s.atoms[2][3] = { halo: 'c' };
    s.br(ids[2], 30, X, 1, { cls: 'lg' });
    return s;
  },
  cyclohexyl(X = 'Br') {
    const s = new S(); const R = ringPts(6, 0, 0, -90);
    const r = R.map((q) => s.a(q[0], q[1]));
    for (let i = 0; i < 6; i++) s.b(r[i], r[(i + 1) % 6]);
    s.atoms[0][3] = { halo: 'c' };
    s.br(r[0], 90, X, 1, { cls: 'lg' });
    return s;
  },
  vinyl(X = 'Br') { const s = new S(); const a = s.a(0, 0.25); const b = s.a(0.866, -0.25, '', { halo: 'c' }); s.b(a, b, 2); s.br(b, -30, X, 1, { cls: 'lg' }); return s; },
  phenyl(X = 'Br') {
    const s = new S(); const R = ringPts(6, 0, 0, 0);
    const r = R.map((q) => s.a(q[0], q[1]));
    [[0, 1, 2, 1], [1, 2, 1], [2, 3, 2, 1], [3, 4, 1], [4, 5, 2, 1], [5, 0, 1]].forEach((b) => s.b(r[b[0]], r[b[1]], b[2], { side: b[3] }));
    s.atoms[0][3] = { halo: 'c' };
    s.br(r[0], 0, X, 1, { cls: 'lg' });
    return s;
  },
  /* álcool genérico em esqueleto: tipo 'tbutyl' etc. com OH */
  alcohol(kind = 'tbutyl') { return SK[kind]('OH'); },
};
/* substitui o rótulo do grupo abandonador por um produto */
export function product(kind, Nu) {
  const s = SK[kind](Nu);
  s.atoms.forEach((a) => { if (a[3] && a[3].cls === 'lg') a[3] = { cls: 'nu' }; if (a[3] && a[3].halo) a[3] = {}; });
  return s;
}

/* ---------- reação genérica dos Fundamentos ---------- */

export function genericFrames() {
  const f0 = new S();
  const nu = f0.a(0, 0, 'Nu', { chg: '−', lp: [0, 90, 270], cls: 'nu' });
  const c = f0.a(2.4, 0, 'C', { halo: 'c', d: '+', dd: [0.15, -0.62], cls: 'ec' });
  f0.br(c, 105, 'R'); f0.br(c, 230, 'R', 'w'); f0.br(c, 255, 'R', 'h');
  const x = f0.br(c, 0, 'X', 1, { cls: 'lg', d: '−', dd: [0.1, -0.62], lp: LPR }, 1.15);
  const f1 = cloneS(f0);
  f1.arrow({ lp: [nu, 0] }, { a: c, ang: 180 }, -0.25);
  const f2 = cloneS(f1);
  f2.arrow({ b: [c, x] }, { a: x, ang: 90 }, -0.55, 'o');
  const f3 = new S();
  const n2 = f3.a(0, 0, 'Nu', { lp: [90, 270, 180], cls: 'nu' });
  const c2 = f3.a(1.2, 0, 'C', { cls: 'ec' });
  f3.b(n2, c2); f3.br(c2, 75, 'R'); f3.br(c2, 310, 'R', 'w'); f3.br(c2, 285, 'R', 'h');
  f3.plus(2.9, 0);
  f3.a(4.0, 0, 'X', { chg: '−', lp: LP4, cls: 'lg' });
  return [f0, f1, f2, f3];
}

export function cloneS(src) {
  const s = new S();
  s.atoms = src.atoms.map((a) => [a[0], a[1], a[2], Object.assign({}, a[3])]);
  s.bonds = src.bonds.map((b) => b.slice());
  s.arrows = src.arrows.map((a) => Object.assign({}, a));
  s.texts = src.texts.map((t) => t.slice());
  s.rxn = src.rxn.map((r) => r.slice());
  return s;
}

/* ---------- SN2: OH⁻ + CH3Br ---------- */

export function sn2Frames(nuLabel = 'HO', groups = ['H', 'H', 'H']) {
  // reagentes
  const r = new S();
  const o = r.a(0, 0, nuLabel, { chg: '−', lp: [0, 90, 270], cls: 'nu' });
  const c = r.a(2.5, 0, 'C', { halo: 'c', d: '+', dd: [0.2, -0.6], cls: 'ec' });
  r.br(c, 100, groups[0]); r.br(c, 222, groups[1], 'w'); r.br(c, 256, groups[2], 'h');
  const br = r.br(c, 0, 'Br', 1, { cls: 'lg', d: '−', dd: [0.15, -0.62], lp: LPR }, 1.2);
  const a1 = cloneS(r);
  a1.arrow({ lp: [o, 0] }, { a: c, ang: 180 }, -0.2);
  a1.arrow({ b: [c, br] }, { a: br, ang: 90 }, -0.55, 'o');
  // estado de transição
  const ts = new S();
  const o2 = ts.a(0, 0, nuLabel, { cls: 'nu', d: '−', dd: [0, -0.62] });
  const c2 = ts.a(1.7, 0, 'C', { cls: 'ec' });
  ts.b(o2, c2, 'p');
  ts.br(c2, 90, groups[0]); ts.br(c2, 235, groups[1], 'w'); ts.br(c2, 305, groups[2], 'h');
  const b2 = ts.a(3.4, 0, 'Br', { cls: 'lg', d: '−', dd: [0, -0.62] });
  ts.b(c2, b2, 'p');
  ts.t(-1.05, 0.05, '[', 'note', 70).t(4.45, 0.05, ']', 'note', 70).t(4.9, -1.05, '‡', 'chg', 22);
  // produtos
  const p = new S();
  const o3 = p.a(0, 0, nuLabel === 'HO' ? 'HO' : nuLabel, { lp: [90, 270], cls: 'nu' });
  const c3 = p.a(1.25, 0, 'C', { cls: 'ec' });
  p.b(o3, c3);
  p.br(c3, 80, groups[0]); p.br(c3, 318, groups[1], 'w'); p.br(c3, 284, groups[2], 'h');
  p.plus(3.1, 0);
  p.a(4.3, 0, 'Br', { chg: '−', lp: LP4, cls: 'lg' });
  return { r, a1, ts, p };
}

/* ---------- SN1: (CH3)3C–Br + H2O ---------- */

export function sn1Frames() {
  const f0 = new S();
  const c = f0.a(0, 0, 'C', { halo: 'c', d: '+', dd: [-0.38, -0.55], cls: 'ec' });
  f0.br(c, 90, 'CH3'); f0.br(c, 180, 'H3C'); f0.br(c, 270, 'CH3');
  const br = f0.br(c, 0, 'Br', 1, { cls: 'lg', d: '−', dd: [0.1, -0.62], lp: LPR }, 1.2);
  const f0a = cloneS(f0); f0a.arrow({ b: [c, br] }, { a: br, ang: 90 }, -0.55, 'o');

  const f1 = new S();
  const cp = f1.a(0, 0, 'C', { chg: '+', halo: 'o', cls: 'ec' });
  f1.br(cp, 90, 'CH3'); f1.br(cp, 210, 'H3C'); f1.br(cp, 330, 'CH3');
  f1.plus(2.0, 0);
  f1.a(3.0, 0, 'Br', { chg: '−', lp: LP4, cls: 'lg' });

  const f2 = new S();
  const w = f2.a(-2.5, 0, 'O', { lp: [55, -55], cls: 'nu' });
  f2.br(w, 135, 'H'); f2.br(w, 225, 'H');
  const cp2 = f2.a(0, 0, 'C', { chg: '+', halo: 'o', cls: 'ec' });
  f2.br(cp2, 90, 'CH3'); f2.br(cp2, 270, 'CH3'); f2.br(cp2, 0, 'CH3', 1, null, 1.15);
  f2.arrow({ lp: [w, -55] }, { a: cp2, ang: 200 }, 0.25);
  f2.t(3.4, 0, '+ Br⁻', 'note', 16);

  const f3 = new S();
  const c3 = f3.a(0, 0, 'C', { cls: 'ec' });
  f3.br(c3, 90, 'CH3'); f3.br(c3, 270, 'CH3'); f3.br(c3, 0, 'CH3', 1, null, 1.15);
  const ox = f3.a(-1.25, 0, 'O', { chg: '+', lp: [90], cls: 'nu' });
  f3.b(c3, ox);
  const h1 = f3.br(ox, 135, 'H'); f3.br(ox, 225, 'H');
  const w2 = f3.a(-3.6, -1.6, 'O', { lp: [-20, 290] });
  f3.br(w2, 150, 'H'); f3.br(w2, 210, 'H');
  f3.arrow({ lp: [w2, -20] }, { a: h1, ang: 170 }, -0.25, 'c');
  f3.arrow({ b: [ox, h1] }, { a: ox, ang: 45 }, -0.9, 'o');
  f3.t(3.4, 0, '+ Br⁻', 'note', 16);

  const f4 = new S();
  const c4 = f4.a(0, 0, 'C', { cls: 'ec' });
  f4.br(c4, 90, 'CH3'); f4.br(c4, 270, 'CH3'); f4.br(c4, 180, 'H3C');
  f4.br(c4, 0, 'OH', 1, { cls: 'nu', lp: [90, 270] }, 1.2);
  f4.plus(2.4, 0);
  f4.a(3.5, 0, 'H3O', { chg: '+' });
  f4.plus(4.6, 0);
  f4.a(5.5, 0, 'Br', { chg: '−', lp: LP4, cls: 'lg' });
  return [f0, f0a, f1, f2, f3, f4];
}

/* ---------- carbocátions ---------- */

export function cation(groups, o = {}) {
  const s = new S();
  const c = s.a(0, 0, 'C', { chg: '+', halo: o.halo || 'o' });
  const ang = [90, 210, 330];
  groups.forEach((g, i) => s.br(c, ang[i], i === 1 && g === 'CH3' ? 'H3C' : g));
  return s;
}

export function allylResonance() {
  const s = new S();
  const a = s.a(0, 0.25, 'H2C'), b = s.a(1.0, -0.3, 'CH'), c = s.a(2.0, 0.25, 'CH2', { chg: '+' });
  s.b(a, b, 2).b(b, c);
  s.arrow({ b: [a, b] }, { b: [b, c] }, -0.6, 'c');
  s.t(3.25, 0, '⟷', 'note', 26);
  const d = s.a(4.4, 0.25, 'H2C', { chg: '+' }), e = s.a(5.4, -0.3, 'CH'), f = s.a(6.4, 0.25, 'CH2');
  s.b(d, e).b(e, f, 2);
  return s;
}

export function benzylResonance() {
  const s = new S();
  const forms = [
    { db: [[0, 1], [2, 3], [4, 5]], exo: 1, plus: 'exo' },
    { db: [[2, 3], [4, 5]], exo: 2, plus: 1 },
    { db: [[1, 2], [4, 5]], exo: 2, plus: 3 },
    { db: [[1, 2], [3, 4]], exo: 2, plus: 5 },
  ];
  forms.forEach((f, k) => {
    const ox = k * 4.2;
    const R = ringPts(6, ox, 0, 0);
    const r = R.map((q, i) => s.a(q[0], q[1], '', f.plus === i ? { chg: '+' } : {}));
    for (let i = 0; i < 6; i++) {
      const j = (i + 1) % 6;
      const dbl = f.db.some((d) => (d[0] === i && d[1] === j) || (d[0] === j && d[1] === i));
      s.b(r[i], r[j], dbl ? 2 : 1, { side: 1 });
    }
    const ex = s.br(r[0], 0, 'CH2', f.exo, f.plus === 'exo' ? { chg: '+' } : {});
    if (k === 0) s.arrow({ b: [r[0], r[1]] }, { b: [r[0], ex] }, 0.6, 'c');
    if (k === 1) s.arrow({ b: [r[2], r[3]] }, { b: [r[1], r[2]] }, 0.6, 'c');
    if (k === 2) s.arrow({ b: [r[4], r[5]] }, { b: [r[3], r[4]] }, 0.6, 'c');
    if (k < 3) s.t(ox + 2.45, 0, '⟷', 'note', 24);
  });
  return s;
}

/* ---------- rearranjos ---------- */

export function hydrideShift() {
  const a = new S();
  const c1 = a.a(0, 0, 'H3C'), c2 = a.a(1.25, 0, 'C', { chg: '+', halo: 'o' }), c3 = a.a(2.5, 0, 'C'), c4 = a.a(3.75, 0, 'CH3');
  a.b(c1, c2).b(c2, c3).b(c3, c4);
  a.br(c2, 270, 'H');
  const h = a.br(c3, 90, 'H', 1, { cls: 'nu' });
  a.br(c3, 270, 'CH3');
  a.arrow({ b: [c3, h] }, { b: [c2, c3] }, 0.55, 'c');
  const b = new S();
  const d1 = b.a(0, 0, 'H3C'), d2 = b.a(1.25, 0, 'CH2'), d3 = b.a(2.5, 0, 'C', { chg: '+', halo: 'o' }), d4 = b.a(3.75, 0, 'CH3');
  b.b(d1, d2).b(d2, d3).b(d3, d4);
  b.br(d3, 270, 'CH3');
  const c = new S();
  const e1 = c.a(0, 0, 'H3C'), e2 = c.a(1.25, 0, 'CH2'), e3 = c.a(2.5, 0, 'C'), e4 = c.a(3.75, 0, 'CH3');
  c.b(e1, e2).b(e2, e3).b(e3, e4);
  c.br(e3, 270, 'CH3'); c.br(e3, 90, 'OH', 1, { cls: 'nu' });
  return [a, b, c];
}

export function methylShift() {
  const a = new S();
  const c1 = a.a(0, 0, 'H3C'), c2 = a.a(1.25, 0, 'C', { chg: '+', halo: 'o' }), c3 = a.a(2.5, 0, 'C'), c4 = a.a(3.75, 0, 'CH3');
  a.b(c1, c2).b(c2, c3).b(c3, c4);
  a.br(c2, 270, 'H');
  const m = a.br(c3, 90, 'CH3', 1, { cls: 'nu' });
  a.br(c3, 270, 'CH3');
  a.arrow({ b: [c3, m] }, { b: [c2, c3] }, 0.55, 'c');
  const b = new S();
  const d1 = b.a(0, 0, 'H3C'), d2 = b.a(1.25, 0, 'C'), d3 = b.a(2.5, 0, 'C', { chg: '+', halo: 'o' }), d4 = b.a(3.75, 0, 'CH3');
  b.b(d1, d2).b(d2, d3).b(d3, d4);
  b.br(d2, 270, 'H'); b.br(d2, 90, 'CH3', 1, { cls: 'nu' }); b.br(d3, 270, 'CH3');
  const c = new S();
  const e1 = c.a(0, 0, 'H3C'), e2 = c.a(1.25, 0, 'C'), e3 = c.a(2.5, 0, 'C'), e4 = c.a(3.75, 0, 'CH3');
  c.b(e1, e2).b(e2, e3).b(e3, e4);
  c.br(e2, 270, 'H'); c.br(e2, 90, 'CH3'); c.br(e3, 270, 'CH3'); c.br(e3, 90, 'OH', 1, { cls: 'nu' });
  return [a, b, c];
}

/* ---------- grupos abandonadores ---------- */

export function tosylate(withR = true) {
  const s = new S();
  let o;
  if (withR) { const r = s.a(-1.1, 0, 'R'); o = s.a(0, 0, 'O', { cls: 'lg' }); s.b(r, o); }
  else o = s.a(0, 0, 'O', { chg: '−', lp: LP3, cls: 'lg' });
  const sx = s.a(1.2, 0, 'S', { cls: 'lg' });
  s.b(o, sx);
  s.br(sx, 90, 'O', 2, { cls: 'lg' }); s.br(sx, 270, 'O', 2, { cls: 'lg' });
  const R = ringPts(6, 3.2, 0, 180);
  const r = R.map((q) => s.a(q[0], q[1]));
  [[0, 1, 2, -1], [1, 2, 1], [2, 3, 2, -1], [3, 4, 1], [4, 5, 2, -1], [5, 0, 1]].forEach((b) => s.b(r[b[0]], r[b[1]], b[2], { side: b[3] }));
  s.b(sx, r[0]);
  s.br(r[3], 0, 'CH3');
  return s;
}
export function mesylate(withR = true) {
  const s = new S();
  let o;
  if (withR) { const r = s.a(-1.1, 0, 'R'); o = s.a(0, 0, 'O', { cls: 'lg' }); s.b(r, o); }
  else o = s.a(0, 0, 'O', { chg: '−', lp: LP3, cls: 'lg' });
  const sx = s.a(1.2, 0, 'S', { cls: 'lg' });
  s.b(o, sx);
  s.br(sx, 90, 'O', 2, { cls: 'lg' }); s.br(sx, 270, 'O', 2, { cls: 'lg' });
  s.br(sx, 0, 'CH3');
  return s;
}
export function protonatedAlcohol() {
  const s = new S();
  const r = s.a(0, 0, 'R'), o = s.a(1.15, 0, 'O', { chg: '+', lp: [90], cls: 'lg' });
  s.b(r, o); s.br(o, 30, 'H'); s.br(o, 330, 'H');
  return s;
}

/* ---------- estruturas para setas curvas (fundamentos) ---------- */

export function arrowFormBond() {
  const s = new S();
  const a = s.a(0, 0, 'Nu', { chg: '−', lp: [0, 90, 270], cls: 'nu' });
  const c = s.a(2.0, 0, 'C', { chg: '+', cls: 'ec' });
  s.br(c, 90, 'R'); s.br(c, 210, 'R'); s.br(c, 330, 'R');
  s.arrow({ lp: [a, 0] }, { a: c, ang: 180 }, -0.25);
  return s;
}
export function arrowBreakBond() {
  const s = new S();
  const c = s.a(0, 0, 'C', { cls: 'ec' });
  s.br(c, 90, 'R'); s.br(c, 180, 'R'); s.br(c, 270, 'R');
  const x = s.br(c, 0, 'X', 1, { cls: 'lg', lp: LPR }, 1.2);
  s.arrow({ b: [c, x] }, { a: x, ang: 90 }, -0.55, 'o');
  return s;
}
export function polarBond(X = 'Br') {
  const s = new S();
  const c = s.a(0, 0, 'C', { d: '+', dd: [0, -0.62], halo: 'c', cls: 'ec' });
  s.br(c, 90, 'H'); s.br(c, 180, 'H'); s.br(c, 270, 'H');
  s.br(c, 0, X, 1, { d: '−', dd: [0, -0.62], cls: 'lg', lp: LPR }, 1.25);
  return s;
}

export { LP3, LP4 };
