/*
 * struct.js — estruturas 2D para eliminação (valências conferidas: rótulos
 * condensados incluem seus H; vértices sem rótulo são carbonos de esqueleto).
 */
import { S, zig, ringPts, el, text, labelWidth } from './chem2d.js';

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
  return s;
}

/* ===================================================================
 * Fórmula expandida (todos os H explícitos) com análise α/β
 * spec = { n, subs: { i: { up, down, left, right } } }   valores: 'Br' | 'Cl' | 'CH3' | 'OH' ...
 * =================================================================== */
const HAL = ['Br', 'Cl', 'I', 'F', 'OTs', 'OH'];
export function expanded(spec) {
  const s = new S();
  const D = 1.3, Hd = 0.85;
  const carbons = [], hs = [], parent = {};
  let lg = null;
  const dirs = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const addH = (ci, dir, dist) => {
    const c = s.atoms[ci];
    const k = s.a(c[0] + dirs[dir][0] * dist, c[1] + dirs[dir][1] * dist, 'H', { fs: 15 });
    s.b(ci, k); hs.push(k); parent[k] = ci;
    return k;
  };
  for (let i = 0; i < spec.n; i++) {
    const k = s.a(i * D, 0, 'C');
    carbons.push(k);
    if (i > 0) s.b(carbons[i - 1], k);
  }
  for (let i = 0; i < spec.n; i++) {
    const ci = carbons[i];
    const sub = (spec.subs && spec.subs[i]) || {};
    const free = ['up', 'down'];
    if (i === 0) free.push('left');
    if (i === spec.n - 1) free.push('right');
    free.forEach((dir) => {
      const g = sub[dir];
      if (!g || g === 'H') { addH(ci, dir, Hd); return; }
      if (HAL.includes(g)) {
        const c = s.atoms[ci];
        const k = s.a(c[0] + dirs[dir][0] * 1.1, c[1] + dirs[dir][1] * 1.1, g, { cls: 'lg', lp: g === 'OH' ? null : (dir === 'up' ? [90, 0, 180] : dir === 'down' ? [270, 0, 180] : dir === 'left' ? [180, 90, 270] : [0, 90, 270]) });
        s.b(ci, k); lg = k; parent[k] = ci;
        return;
      }
      if (g === 'CH3') {
        const c = s.atoms[ci];
        const b = s.a(c[0] + dirs[dir][0] * D, c[1] + dirs[dir][1] * D, 'C');
        s.b(ci, b); carbons.push(b); parent[b] = ci;
        const back = { up: 'down', down: 'up', left: 'right', right: 'left' }[dir];
        ['up', 'down', 'left', 'right'].filter((d) => d !== back).forEach((d) => addH(b, d, Hd));
      }
    });
  }
  // grafo: carbono α (ligado ao GA) e carbonos β (vizinhos de α)
  const adj = {};
  s.bonds.forEach(([a, b]) => { (adj[a] = adj[a] || []).push(b); (adj[b] = adj[b] || []).push(a); });
  const alpha = lg !== null ? parent[lg] : null;
  const betaC = alpha !== null ? adj[alpha].filter((k) => carbons.includes(k)) : [];
  const betaH = hs.filter((h) => betaC.includes(parent[h]));
  const alphaH = hs.filter((h) => parent[h] === alpha);
  return { s, carbons, hs, parent, lg, alpha, betaC, betaH, alphaH, adj };
}

export const EXP = {
  bromoetano: () => expanded({ n: 2, subs: { 1: { up: 'Br' } } }),
  bromobutano2: () => expanded({ n: 4, subs: { 1: { up: 'Br' } } }),
  bromopentano2: () => expanded({ n: 5, subs: { 1: { up: 'Br' } } }),
  bromometilbutano: () => expanded({ n: 4, subs: { 1: { up: 'Br', down: 'CH3' } } }),
  tbutil: () => expanded({ n: 3, subs: { 1: { up: 'Br', down: 'CH3' } } }),
  neopentil: () => expanded({ n: 3, subs: { 0: { left: 'Br' }, 1: { up: 'CH3', down: 'CH3' } } }),
  bromobutano1: () => expanded({ n: 4, subs: { 0: { left: 'Br' } } }),
};

/* ===================================================================
 * Alcenos e substratos em esqueleto
 * =================================================================== */
function chain(n, up = false) {
  const s = new S();
  const ids = zig(n, 0, 0, up).map((p) => s.a(p[0], p[1]));
  for (let i = 0; i < n - 1; i++) s.b(ids[i], ids[i + 1]);
  return { s, ids };
}
export const SKA = {
  // haletos
  bromobutano2(X = 'Br', bt = 1) { const { s, ids } = chain(4, true); s.br(ids[1], 90, X, bt, { cls: 'lg' }); s.atoms[1][3] = { halo: 'c' }; return s; },
  bromobutano1(X = 'Br') { const { s, ids } = chain(4); s.br(ids[3], 30, X, 1, { cls: 'lg' }); s.atoms[3][3] = { halo: 'c' }; return s; },
  bromopentano2(X = 'Br') { const { s, ids } = chain(5, true); s.br(ids[1], 90, X, 1, { cls: 'lg' }); s.atoms[1][3] = { halo: 'c' }; return s; },
  bromometilbutano(X = 'Br') { const { s, ids } = chain(4, true); s.br(ids[1], 90, X, 1, { cls: 'lg' }); s.br(ids[1], 270); s.atoms[1][3] = { halo: 'c' }; return s; },
  tbutil(X = 'Br') { const s = new S(); const c = s.a(0, 0, '', { halo: 'c' }); s.br(c, 210); s.br(c, 330); s.br(c, 270); s.br(c, 90, X, 1, { cls: 'lg' }); return s; },
  ethyl(X = 'Br') { const s = new S(); const a = s.a(0, 0.25), b = s.a(0.866, -0.25, '', { halo: 'c' }); s.b(a, b); s.br(b, -30, X, 1, { cls: 'lg' }); return s; },
  methyl(X = 'Br') { const s = new S(); const c = s.a(0, 0, 'H3C', { halo: 'c' }); const x = s.a(1.25, 0, X, { cls: 'lg' }); s.b(c, x); return s; },
  isopropyl(X = 'Br') { const s = new S(); const c = s.a(0, 0, '', { halo: 'c' }); s.br(c, 210); s.br(c, 330); s.br(c, 90, X, 1, { cls: 'lg' }); return s; },
  benzyl(X = 'Br') {
    const s = new S(); const r = ringPts(6, 0, 0, 0).map((q) => s.a(q[0], q[1]));
    [[0, 1, 2, 1], [1, 2, 1], [2, 3, 2, 1], [3, 4, 1], [4, 5, 2, 1], [5, 0, 1]].forEach((b) => s.b(r[b[0]], r[b[1]], b[2], { side: b[3] }));
    const c = s.br(r[0], 30, '', 1, { halo: 'c' }); s.br(c, -30, X, 1, { cls: 'lg' }); return s;
  },
  allyl(X = 'Br') { const { s, ids } = chain(3); s.bonds[0][2] = 2; s.atoms[2][3] = { halo: 'c' }; s.br(ids[2], 30, X, 1, { cls: 'lg' }); return s; },
  metilciclohexil(X = 'Br') {
    const s = new S(); const r = ringPts(6, 0, 0, -90).map((q) => s.a(q[0], q[1]));
    for (let i = 0; i < 6; i++) s.b(r[i], r[(i + 1) % 6]);
    s.atoms[0][3] = { halo: 'c' };
    s.br(r[0], 60, X, 1, { cls: 'lg' }); s.br(r[0], 120); return s;
  },
  // alcenos
  but1eno() { const { s } = chain(4); s.bonds[2][2] = 2; return s; },
  but2enoE() { const { s } = chain(4); s.bonds[1][2] = 2; return s; },
  but2enoZ() { const s = new S(); const a = s.a(0, 0), b = s.a(1, 0); s.b(a, b, 2); s.br(a, 240); s.br(b, 300); return s; },
  pent1eno() { const { s } = chain(5); s.bonds[3][2] = 2; return s; },
  pent2enoE() { const { s } = chain(5); s.bonds[3][2] = 1; s.bonds[0][2] = 1; s.bonds[1][2] = 2; return s; },
  pent2enoZ() { const s = new S(); const a = s.a(0, 0), b = s.a(1, 0); s.b(a, b, 2); s.br(a, 240); const c = s.br(b, 300); s.br(c, 0); return s; },
  metilbut2eno() { const s = new S(); const a = s.a(0, 0), b = s.a(1, 0); s.b(a, b, 2); s.br(a, 120); s.br(a, 240); s.br(b, 300); return s; },
  metilpropeno() { const s = new S(); const a = s.a(0, 0), b = s.a(0, -1); s.b(a, b, 2); s.br(a, 210); s.br(a, 330); return s; },
  dimetilbut2eno() { const s = new S(); const a = s.a(0, 0), b = s.a(1, 0); s.b(a, b, 2); s.br(a, 120); s.br(a, 240); s.br(b, 60); s.br(b, 300); return s; },
  eteno() { const s = new S(); const a = s.a(0, 0, 'H2C'), b = s.a(1.3, 0, 'CH2'); s.b(a, b, 2); return s; },
  propeno() { const { s } = chain(3); s.bonds[1][2] = 2; return s; },
  metilciclohexeno() { const s = new S(); const r = ringPts(6, 0, 0, -90).map((q) => s.a(q[0], q[1])); for (let i = 0; i < 6; i++) s.b(r[i], r[(i + 1) % 6], i === 0 ? 2 : 1, i === 0 ? { side: 1 } : {}); s.br(r[0], 90); return s; },
  metilenociclohexano() { const s = new S(); const r = ringPts(6, 0, 0, -90).map((q) => s.a(q[0], q[1])); for (let i = 0; i < 6; i++) s.b(r[i], r[(i + 1) % 6]); s.br(r[0], 90, '', 2); return s; },
  metilciclopenteno() { const s = new S(); const r = ringPts(5, 0, 0, -90).map((q) => s.a(q[0], q[1])); for (let i = 0; i < 5; i++) s.b(r[i], r[(i + 1) % 5], i === 0 ? 2 : 1, i === 0 ? { side: 1 } : {}); s.br(r[0], 90); return s; },
};
// 2-metilbut-1-eno: CH2=C(CH3)CH2CH3
SKA.metilbut1eno = () => { const s = new S(); const a = s.a(0, 0), b = s.a(0, -1); s.b(a, b, 2); s.br(a, 210); const c = s.br(a, 330); s.br(c, 30); return s; };

/* ===================================================================
 * Quadros do mecanismo E2 (2-bromobutano + etóxido)
 * =================================================================== */
export function e2Frames(base = 'EtO') {
  const r = new S();
  const ca = r.a(0, 0, 'C', { halo: 'c', cls: 'hb', note: 'α', nd: [0, 0.62] });
  const cb = r.a(1.45, 0, 'C', { cls: 'hb', note: 'β', nd: [0.45, 0.38] });
  r.b(ca, cb);
  const br = r.br(ca, 90, 'Br', 1, { cls: 'lg', lp: [90, 0, 180] }, 1.15);
  r.br(ca, 210, 'H3C'); r.br(ca, 330, 'H', 1, null, 0.9);
  r.br(cb, 90, 'H', 1, null, 0.9); r.br(cb, 30, 'CH3');
  const hb = r.br(cb, 270, 'H', 1, { cls: 'hb', halo: 'c' }, 1.0);
  const o = r.a(0.15, 2.35, base, { chg: '−', lp: [90, 0, 270], cls: 'base' });
  const a = cloneS(r);
  a.arrow({ lp: [o, 0] }, { a: hb, ang: 180 }, 0.35, 'o');
  a.arrow({ b: [cb, hb] }, { b: [ca, cb] }, -0.45, 'c');
  a.arrow({ b: [ca, br] }, { a: br, ang: 0 }, 0.6, '');
  // estado de transição
  const ts = new S();
  const ca2 = ts.a(0, 0, 'C', { cls: 'ts' }), cb2 = ts.a(1.45, 0, 'C', { cls: 'ts' });
  ts.b(ca2, cb2, '1p', { side: -1 });
  const br2 = ts.a(0, -1.35, 'Br', { cls: 'lg', d: '−', dd: [0.55, 0] }); ts.b(ca2, br2, 'p');
  ts.br(ca2, 210, 'H3C'); ts.br(ca2, 330, 'H', 1, null, 0.9);
  ts.br(cb2, 90, 'H', 1, null, 0.9); ts.br(cb2, 30, 'CH3');
  const hb2 = ts.a(1.45, 1.25, 'H', { cls: 'hb' }); ts.b(cb2, hb2, 'p');
  const o2 = ts.a(1.45, 2.5, base, { cls: 'base', d: '−', dd: [0.7, 0] }); ts.b(hb2, o2, 'p');
  ts.t(-1.6, 0.6, '[', 'note', 110).t(3.0, 0.6, ']', 'note', 110).t(3.45, -1.3, '‡', 'chg', 24);
  // produtos
  const p = new S();
  const q = SKA.but2enoE(); q.atoms.forEach((x) => p.a(x[0], x[1], x[2], { cls: 'prod' })); q.bonds.forEach((b) => p.b(b[0], b[1], b[2]));
  p.plus(3.4, 0);
  p.a(4.6, 0, base + 'H', { cls: 'base' });
  p.plus(5.8, 0);
  p.a(6.8, 0, 'Br', { chg: '−', lp: LP4, cls: 'lg' });
  return { r, a, ts, p };
}

/* ===================================================================
 * Quadros do mecanismo E1 ((CH3)3C–Br, solvente/base fraca)
 * =================================================================== */
export function e1Frames() {
  const f0 = new S();
  const c = f0.a(0, 0, 'C', { halo: 'c' });
  f0.br(c, 90, 'CH3'); f0.br(c, 180, 'H3C'); f0.br(c, 270, 'CH3');
  const br = f0.br(c, 0, 'Br', 1, { cls: 'lg', lp: LPR }, 1.2);
  const f0a = cloneS(f0); f0a.arrow({ b: [c, br] }, { a: br, ang: 90 }, -0.55, '');
  const f1 = new S();
  const cp = f1.a(0, 0, 'C', { chg: '+', halo: 'o' });
  f1.br(cp, 90, 'CH3'); f1.br(cp, 210, 'H3C');
  const cm = f1.br(cp, 330, 'C', 1, null, 1.25);
  f1.br(cm, 50, 'H', 1, null, 0.9); f1.br(cm, 345, 'H', 1, null, 0.9);
  const hb = f1.br(cm, 265, 'H', 1, { cls: 'hb', halo: 'c' }, 0.95);
  const w = f1.a(2.2, 2.75, 'O', { lp: [120, 30], cls: 'base' });
  f1.br(w, 210, 'H', 1, null, 0.9); f1.br(w, 330, 'H', 1, null, 0.9);
  f1.t(3.4, 0, '+ Br⁻', 'note', 16);
  const f1a = cloneS(f1);
  f1a.arrow({ lp: [w, 120] }, { a: hb, ang: 315 }, 0.3, 'o');
  f1a.arrow({ b: [cm, hb] }, { b: [cp, cm] }, -0.5, 'c');
  const f2 = new S();
  const q = SKA.metilpropeno(); q.atoms.forEach((x) => f2.a(x[0], x[1], x[2], { cls: 'prod' })); q.bonds.forEach((b) => f2.b(b[0], b[1], b[2]));
  f2.plus(1.6, -0.3); f2.a(2.7, -0.3, 'H3O', { chg: '+' }); f2.plus(3.8, -0.3); f2.a(4.7, -0.3, 'Br', { chg: '−', lp: LP4, cls: 'lg' });
  return [f0, f0a, f1, f1a, f2];
}

/* ===================================================================
 * Rearranjos seguidos de eliminação
 * =================================================================== */
function chainLab(labels, y = 0) {
  const s = new S();
  const ids = labels.map((l, i) => s.a(i * 1.25, y, l[0], l[1] || {}));
  for (let i = 0; i < ids.length - 1; i++) s.b(ids[i], ids[i + 1]);
  return { s, ids };
}
export function hydrideE1() {
  const a = chainLab([['H3C'], ['C', { chg: '+', halo: 'o' }], ['C'], ['CH3']]);
  a.s.br(a.ids[1], 270, 'H');
  const h = a.s.br(a.ids[2], 90, 'H', 1, { cls: 'hb' }); a.s.br(a.ids[2], 270, 'CH3');
  a.s.arrow({ b: [a.ids[2], h] }, { a: a.ids[1], ang: 60 }, 0.55, 'c');
  const b = chainLab([['H3C'], ['C'], ['C', { chg: '+', halo: 'o' }], ['CH3']]);
  b.s.br(b.ids[1], 270, 'H'); const hb = b.s.br(b.ids[1], 90, 'H', 1, { cls: 'hb', halo: 'c' }); b.s.br(b.ids[2], 270, 'CH3');
  const w = b.s.a(-0.6, -1.9, 'O', { lp: [0, 90], cls: 'base' }); b.s.br(w, 150, 'H', 1, null, 0.9); b.s.br(w, 210, 'H', 1, null, 0.9);
  const b2 = cloneS(b.s);
  b2.arrow({ lp: [w, 0] }, { a: hb, ang: 180 }, -0.3, 'o');
  b2.arrow({ b: [b.ids[1], hb] }, { b: [b.ids[1], b.ids[2]] }, 0.6, 'c');
  const c = new S(); const q = SKA.metilbut2eno(); q.atoms.forEach((x) => c.a(x[0], x[1], x[2], { cls: 'prod' })); q.bonds.forEach((bb) => c.b(bb[0], bb[1], bb[2]));
  return [a.s, b.s, b2, c];
}
export function methylE1() {
  const a = chainLab([['H3C'], ['C', { chg: '+', halo: 'o' }], ['C'], ['CH3']]);
  a.s.br(a.ids[1], 270, 'H');
  const m = a.s.br(a.ids[2], 90, 'CH3', 1, { cls: 'hb' }); a.s.br(a.ids[2], 270, 'CH3');
  a.s.arrow({ b: [a.ids[2], m] }, { a: a.ids[1], ang: 60 }, 0.55, 'c');
  const b = chainLab([['H3C'], ['C'], ['C', { chg: '+', halo: 'o' }], ['CH3']]);
  const hb = b.s.br(b.ids[1], 270, 'H', 1, { cls: 'hb', halo: 'c' }); b.s.br(b.ids[1], 90, 'CH3'); b.s.br(b.ids[2], 270, 'CH3');
  const w = b.s.a(0.4, 2.2, 'O', { lp: [30, 90], cls: 'base' }); b.s.br(w, 210, 'H', 1, null, 0.9); b.s.br(w, 330, 'H', 1, null, 0.9);
  const b2 = cloneS(b.s);
  b2.arrow({ lp: [w, 90] }, { a: hb, ang: 270 }, 0.3, 'o');
  b2.arrow({ b: [b.ids[1], hb] }, { b: [b.ids[1], b.ids[2]] }, -0.6, 'c');
  const c = new S(); const q = SKA.dimetilbut2eno(); q.atoms.forEach((x) => c.a(x[0], x[1], x[2], { cls: 'prod' })); q.bonds.forEach((bb) => c.b(bb[0], bb[1], bb[2]));
  return [a.s, b.s, b2, c];
}
export function ringExpansionE1() {
  // 1-ciclobutiletila → 2-metilciclopentila → 1-metilciclopenteno
  const a = new S();
  const sq = ringPts(4, 0, 0, 45).map((q) => a.a(q[0], q[1]));
  for (let i = 0; i < 4; i++) a.b(sq[i], sq[(i + 1) % 4]);
  // sq[0] (inferior direito) ligado ao C+ exocíclico
  const p0 = a.atoms[sq[0]];
  const ce = a.a(p0[0] + 1.0, p0[1] + 0.35, 'C', { chg: '+', halo: 'o' });
  a.b(sq[0], ce);
  a.br(ce, 300, 'CH3'); a.br(ce, 60, 'H', 1, null, 0.9);
  a.br(sq[0], 300, 'H', 1, null, 0.9);
  // ligação do anel que migra: sq[0]–sq[3]
  a.arrow({ b: [sq[0], sq[3]] }, { a: ce, ang: 100 }, -0.5, 'c');
  const b = new S();
  const pe = ringPts(5, 0, 0, -90).map((q, i) => b.a(q[0], q[1], i === 0 ? 'C' : i === 1 ? 'C' : '', i === 0 ? { chg: '+', halo: 'o' } : {}));
  for (let i = 0; i < 5; i++) b.b(pe[i], pe[(i + 1) % 5]);
  b.br(pe[0], 90, 'H', 1, null, 0.9);
  b.br(pe[1], 18, 'CH3');
  const hb = b.br(pe[1], 288, 'H', 1, { cls: 'hb', halo: 'c' }, 0.95);
  const w = b.a(2.4, 1.6, 'O', { lp: [150, 90], cls: 'base' }); b.br(w, 330, 'H', 1, null, 0.9); b.br(w, 30, 'H', 1, null, 0.9);
  const b2 = cloneS(b);
  b2.arrow({ lp: [w, 150] }, { a: hb, ang: 0 }, 0.3, 'o');
  b2.arrow({ b: [pe[1], hb] }, { b: [pe[0], pe[1]] }, -0.5, 'c');
  const c = new S(); const q = SKA.metilciclopenteno(); q.atoms.forEach((x) => c.a(x[0], x[1], x[2], { cls: 'prod' })); q.bonds.forEach((bb) => c.b(bb[0], bb[1], bb[2], bb[3]));
  return [a, b, b2, c];
}

/* ===================================================================
 * Projeção de Newman (SVG)
 * front/back: [rótulo, classe] × 3; fa/ba: ângulo do 1º ligante (graus)
 * =================================================================== */
export function newmanSVG(front, back, fa, ba, o = {}) {
  const R = 30, L = 62, fs = o.fs || 16;
  const all = front.concat(back).map((x) => x[0]);
  const maxW = Math.max(...all.map((l) => labelWidth(l, fs)));
  const S2 = 2 * (L + 10 + maxW + 10);
  const c = S2 / 2;
  const svg = el('svg', { viewBox: `0 0 ${S2} ${S2}`, class: 'chem', role: 'img', 'aria-label': o.alt || 'Projeção de Newman' });
  svg.style.maxWidth = (o.maxw || S2 * 1.25) + 'px';
  const g = el('g', null, svg);
  const put = (ang, r0, lab, cls, back) => {
    const a = ang * Math.PI / 180, ux = Math.cos(a), uy = -Math.sin(a);
    el('line', { x1: c + ux * r0, y1: c + uy * r0, x2: c + ux * L, y2: c + uy * L, class: 'bond', style: back ? 'stroke:#9fb0cc' : '' }, g);
    const w = labelWidth(lab, fs);
    const d = L + 6 + Math.abs(ux) * w / 2 + Math.abs(uy) * fs * 0.62;
    text(g, c + ux * d, c + uy * d, lab, { class: 'atom ' + (cls || ''), 'font-size': fs });
  };
  back.forEach((x, i) => put(ba - i * 120, R, x[0], x[1], true));
  el('circle', { cx: c, cy: c, r: R, fill: 'var(--bg-2)', stroke: '#dfe7f5', 'stroke-width': 2 }, g);
  front.forEach((x, i) => put(fa - i * 120, 0, x[0], x[1], false));
  el('circle', { cx: c, cy: c, r: 2.6, fill: '#dfe7f5' }, g);
  return svg;
}

/* ===================================================================
 * Cadeira do ciclo-hexano em 2D (projeção da geometria 3D)
 * subs: { '0u': 'Br', '1d': 'H' ... }; t = 0 cadeira A, 1 cadeira invertida
 * =================================================================== */
export function chairData(t, subs) {
  const R = 1.46, h = 0.25, out = { ring: [], sub: {} };
  for (let k = 0; k < 6; k++) {
    const phi = k * Math.PI / 3, s0 = k % 2 === 0 ? 1 : -1;
    out.ring.push([R * Math.cos(phi), R * Math.sin(phi), h * s0 * (1 - 2 * t)]);
  }
  for (let k = 0; k < 6; k++) {
    const phi = k * Math.PI / 3, s0 = k % 2 === 0 ? 1 : -1;
    const sgn = t < 0.5 ? s0 : -s0;
    const rad = [Math.cos(phi), Math.sin(phi), 0];
    const ax = (sg) => [0, 0, sg];
    const eq = (sg) => [rad[0] * 0.943, rad[1] * 0.943, -0.333 * sg];
    ['u', 'd'].forEach((f) => {
      const up = f === 'u';
      const role = (up && sgn > 0) || (!up && sgn < 0) ? 'ax' : 'eq';
      const dir = role === 'ax' ? ax(up ? 1 : -1) : eq(up ? -1 : 1);
      out.sub[k + f] = { dir, role, label: subs[k + f] || 'H' };
    });
  }
  return out;
}
export function chair2D(subs, t = 0, o = {}) {
  const d = chairData(t, subs);
  const az = 10 * Math.PI / 180, el = 16 * Math.PI / 180;
  const proj = (p) => {
    const x = p[0] * Math.cos(az) - p[1] * Math.sin(az), y = p[0] * Math.sin(az) + p[1] * Math.cos(az);
    return [x, -(p[2] * Math.cos(el) + y * Math.sin(el))];
  };
  const s = new S();
  const ring = d.ring.map((p) => { const q = proj(p); return s.a(q[0], q[1]); });
  for (let k = 0; k < 6; k++) s.b(ring[k], ring[(k + 1) % 6]);
  const hl = o.hl || {};
  Object.entries(d.sub).forEach(([key, v]) => {
    const k = +key[0];
    if (v.label === 'H' && !hl[key] && !o.allH) return;
    const len = v.label === 'H' ? 0.75 : 1.0;
    const p = d.ring[k];
    const q = proj([p[0] + v.dir[0] * len, p[1] + v.dir[1] * len, p[2] + v.dir[2] * len]);
    const opt = hl[key] ? { cls: hl[key] } : v.label !== 'H' ? { cls: v.label === 'Br' ? 'lg' : '' } : {};
    s.a(q[0], q[1], v.label, Object.assign({ fs: 15 }, opt));
    s.b(ring[k], s.atoms.length - 1, 1, hl[key] ? { cls: 'hl' } : {});
  });
  return s;
}
