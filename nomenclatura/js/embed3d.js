/*
 * embed3d.js — coordenadas 3D a partir do grafo + layout 2D:
 * relaxação simples (ligações, ângulos por hibridização, cis/trans das
 * duplas herdado do desenho 2D, repulsão), adição de hidrogênios e
 * torções em ligações simples (conformações) sem mudar a conectividade.
 */
const V = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul: (a, k) => [a[0] * k, a[1] * k, a[2] * k],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  len: (a) => Math.hypot(a[0], a[1], a[2]), norm: (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
};
export { V };
const BLEN = (a, b, o) => {
  const k = [a, b].sort().join('');
  if (a === 'H' || b === 'H') return { CH: 1.09, HO: 0.97, HN: 1.01 }[k] || 1.05;
  if (k === 'CC') return o === 3 ? 1.2 : o === 2 ? 1.34 : 1.53;
  if (k === 'CO') return o === 2 ? 1.22 : 1.43;
  if (k === 'CN') return o === 3 ? 1.16 : o === 2 ? 1.29 : 1.47;
  if (k === 'NO') return 1.22;
  return { CF: 1.35, CCl: 1.78, BrC: 1.94, CI: 2.14, CS: 1.82 }[k] || 1.5;
};
function hyb(m, i) {
  const nb = m.nb[i], A = m.atoms;
  if (nb.some((x) => x.o === 3) || nb.filter((x) => x.o === 2).length === 2) return 1;
  if (nb.some((x) => x.o === 2) || A[i].aromatic) return 2;
  if (A[i].el === 'N' && nb.some(({ j }) => A[j].el === 'C' && m.nb[j].some((y) => y.o === 2 && A[y.j].el === 'O'))) return 2; // N de amida
  if (A[i].el === 'N' && nb.filter(({ j }) => A[j].el === 'O').length === 2) return 2;
  return 3;
}
const ANG = { 1: 180, 2: 120, 3: 109.5 };
let seed = 7;
const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 - 0.5; };

export function embed(m, P2) {
  seed = 7;
  const nH = m.atoms.length;
  const at = m.atoms.map((a) => ({ el: a.el }));
  const X = P2.map((p, i) => [p[0] * 1.5, -p[1] * 1.5, m.ringOf[i] >= 0 && !m.atoms[i].aromatic ? rnd() * 0.6 : 0]);
  const bonds = m.bonds.map((b) => [b.a, b.b, b.o]);
  // termos
  const T2 = [], T3 = [], T4 = [];
  const arB = (a, b) => m.atoms[a].aromatic && m.atoms[b].aromatic && m.ringOf[a] === m.ringOf[b];
  bonds.forEach(([a, b, o]) => T2.push([a, b, arB(a, b) ? 1.39 : BLEN(at[a].el, at[b].el, o)]));
  m.rings.forEach((r) => { if (!r.aromatic) return; for (let k = 0; k < 3; k++) T4.push([r[k], r[k + 3], 2.78]); });
  for (let i = 0; i < nH; i++) {
    const nb = m.nb[i], th = ANG[hyb(m, i)] * Math.PI / 180;
    for (let p = 0; p < nb.length; p++) for (let q = p + 1; q < nb.length; q++) {
      const a = nb[p].j, b = nb[q].j, la = BLEN(at[i].el, at[a].el, nb[p].o), lb = BLEN(at[i].el, at[b].el, nb[q].o);
      T3.push([a, b, Math.sqrt(la * la + lb * lb - 2 * la * lb * Math.cos(th))]);
    }
  }
  // cis/trans nas duplas C=C (não aromáticas) a partir do 2D
  m.bonds.forEach((bd) => {
    if (bd.o !== 2 || (m.atoms[bd.a].aromatic && m.atoms[bd.b].aromatic)) return;
    const a = bd.a, b = bd.b;
    m.nb[a].forEach(({ j: x }) => { if (x === b) return; m.nb[b].forEach(({ j: y }) => {
      if (y === a) return;
      const ab = [P2[b][0] - P2[a][0], P2[b][1] - P2[a][1]], cr = (v) => ab[0] * v[1] - ab[1] * v[0];
      const sx = cr([P2[x][0] - P2[a][0], P2[x][1] - P2[a][1]]), sy = cr([P2[y][0] - P2[a][0], P2[y][1] - P2[a][1]]);
      const L = BLEN('C', 'C', 2), lx = BLEN(at[a].el, at[x].el, 1), ly = BLEN(at[b].el, at[y].el, 1);
      const xa = [-lx * 0.5, lx * 0.866], yb = [L + ly * 0.5, (sx * sy > 0 ? 1 : -1) * ly * 0.866];
      T4.push([x, y, Math.hypot(yb[0] - xa[0], yb[1] - xa[1])]);
    }); });
  });
  const TI = []; for (let i = 0; i < nH; i++) if (hyb(m, i) === 2 && m.nb[i].length === 3) TI.push([i, ...m.nb[i].map(({ j }) => j)]);
  const close = new Set(); T2.concat(T3).forEach(([a, b]) => { close.add(a + ',' + b); close.add(b + ',' + a); });
  relax(X, T2, T3, T4, close, 900, 2.9, TI);
  // hidrogênios
  const all = X.map((p) => p.slice()), atoms = at.slice(), hb = [];
  for (let i = 0; i < nH; i++) {
    const h = m.atoms[i].h; if (!h) continue;
    const us = m.nb[i].map(({ j }) => V.norm(V.sub(X[j], X[i])));
    const dirs = hDirs(us, hyb(m, i), h, m, i, X);
    dirs.slice(0, h).forEach((d) => { const L = BLEN(at[i].el, 'H', 1); all.push(V.add(X[i], V.mul(d, L))); atoms.push({ el: 'H' }); hb.push([i, all.length - 1, 1]); });
  }
  // relaxação final com os H (ângulos completos)
  const allB = bonds.concat(hb), nbr = all.map(() => []);
  allB.forEach(([a, b, o]) => { nbr[a].push([b, o]); nbr[b].push([a, o]); });
  const U2 = allB.map(([a, b, o]) => [a, b, a < nH && b < nH && arB(a, b) ? 1.39 : BLEN(atoms[a].el, atoms[b].el, o)]), U3 = [];
  const UI = []; for (let i = 0; i < nH; i++) if (hyb(m, i) === 2 && nbr[i].length === 3) UI.push([i, ...nbr[i].map(([j]) => j)]);
  for (let i = 0; i < all.length; i++) {
    const hy = i < nH ? hyb(m, i) : 3, th = ANG[hy] * Math.PI / 180, nb = nbr[i];
    for (let p = 0; p < nb.length; p++) for (let q = p + 1; q < nb.length; q++) { const [a, oa] = nb[p], [b, ob] = nb[q]; const la = BLEN(atoms[i].el, atoms[a].el, oa), lb = BLEN(atoms[i].el, atoms[b].el, ob); U3.push([a, b, Math.sqrt(la * la + lb * lb - 2 * la * lb * Math.cos(th))]); }
  }
  const close2 = new Set(); U2.concat(U3).forEach(([a, b]) => { close2.add(a + ',' + b); close2.add(b + ',' + a); });
  relax(all, U2, U3, T4, close2, 400, 2.2, UI);
  return { atoms: atoms.map((a, i) => ({ el: a.el, p: all[i] })), bonds: allB, heavy: nH };
}
function relax(X, T2, T3, T4, close, it, rmin = 2.9, TI = []) {
  const n = X.length;
  for (let s = 0; s < it; s++) {
    const F = X.map(() => [0, 0, 0]);
    const spring = (a, b, d0, k) => { const v = V.sub(X[b], X[a]), l = V.len(v) || 1e-6, f = k * (l - d0) / l; F[a] = V.add(F[a], V.mul(v, f)); F[b] = V.sub(F[b], V.mul(v, f)); };
    T2.forEach(([a, b, d]) => spring(a, b, d, 1));
    T3.forEach(([a, b, d]) => spring(a, b, d, 0.5));
    T4.forEach(([a, b, d]) => spring(a, b, d, 0.25));
    for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) { if (close.has(a + ',' + b)) continue; const v = V.sub(X[b], X[a]), l = V.len(v); if (l < rmin) { const f = -0.12 * (rmin - l) / (l || 1e-3); F[a] = V.add(F[a], V.mul(v, f)); F[b] = V.sub(F[b], V.mul(v, f)); } }
    TI.forEach(([i, a, b, c]) => { const nrm = V.norm(V.cross(V.sub(X[b], X[a]), V.sub(X[c], X[a]))); const d = V.dot(V.sub(X[i], X[a]), nrm); const f = V.mul(nrm, -0.6 * d); F[i] = V.add(F[i], f); [a, b, c].forEach((q) => { F[q] = V.sub(F[q], V.mul(f, 1 / 3)); }); });
    const step = s < it * 0.7 ? 0.12 : 0.05;
    for (let i = 0; i < n; i++) X[i] = V.add(X[i], V.mul(F[i], step));
  }
  // centraliza
  const c = X.reduce((s, p) => V.add(s, p), [0, 0, 0]).map((x) => x / n);
  for (let i = 0; i < n; i++) X[i] = V.sub(X[i], c);
}
function perp(u) { let p = V.cross(u, [0, 0, 1]); if (V.len(p) < 0.1) p = V.cross(u, [0, 1, 0]); return V.norm(p); }
function hDirs(us, hy, h, m, i, X) {
  const k = us.length;
  if (hy === 1) return k ? [V.mul(us[0], -1)] : [[1, 0, 0], [-1, 0, 0]];
  if (hy === 2) {
    if (k === 2) return [V.norm(V.mul(V.add(us[0], us[1]), -1))];
    if (k === 1) {
      // plano definido por um vizinho do vizinho
      const j = m.nb[i][0].j, other = m.nb[j].find(({ j: q }) => q !== i);
      let nrm = other ? V.norm(V.cross(us[0], V.sub(X[other.j], X[j]))) : perp(us[0]);
      if (V.len(nrm) < 0.1) nrm = perp(us[0]);
      const w = V.norm(V.cross(nrm, us[0]));
      return [V.add(V.mul(us[0], -0.5), V.mul(w, 0.866)), V.add(V.mul(us[0], -0.5), V.mul(w, -0.866))];
    }
    return [[1, 0, 0], [-0.5, 0.866, 0], [-0.5, -0.866, 0]];
  }
  if (k === 0) return [[0, 0, 1], [0.943, 0, -0.333], [-0.471, 0.816, -0.333], [-0.471, -0.816, -0.333]];
  if (k === 1) { const u = us[0], p = perp(u), q = V.cross(u, p), kk = Math.sqrt(8) / 3; return [0, 1, 2].map((t) => { const f = t * 2 * Math.PI / 3 + 0.5; return V.add(V.mul(u, -1 / 3), V.add(V.mul(p, kk * Math.cos(f)), V.mul(q, kk * Math.sin(f)))); }); }
  if (k === 2) { const b = V.norm(V.mul(V.add(us[0], us[1]), -1)), p = V.norm(V.cross(us[0], us[1])); const c = Math.cos(54.75 * Math.PI / 180), s = Math.sin(54.75 * Math.PI / 180); return [V.add(V.mul(b, c), V.mul(p, s)), V.add(V.mul(b, c), V.mul(p, -s))]; }
  return [V.norm(V.mul(V.add(V.add(us[0], us[1]), us[2]), -1))];
}

/* ===================================================================
 * Torções (conformações): gira subárvores em ligações simples acíclicas
 * =================================================================== */
export function torsions(m, E) {
  const nb = E.atoms.map(() => []); E.bonds.forEach(([a, b]) => { nb[a].push(b); nb[b].push(a); });
  const rot = [];
  m.bonds.forEach((b) => {
    if (b.o !== 1 || m.ringOf[b.a] >= 0 || m.ringOf[b.b] >= 0) return;
    if (m.nb[b.a].length < 2 || m.nb[b.b].length < 2) return;
    const side = new Set([b.b]), st = [b.b]; while (st.length) { const x = st.pop(); nb[x].forEach((y) => { if (y !== b.a && !side.has(y)) { side.add(y); st.push(y); } }); }
    if (side.has(b.a)) return;
    rot.push({ a: b.a, b: b.b, side: [...side], ang: [120, -120, 70, -70][rot.length % 4] * Math.PI / 180 });
  });
  return rot;
}
export function applyTorsions(E0, rots, t) {
  const P = E0.atoms.map((a) => a.p.slice());
  rots.forEach((r) => {
    const o = P[r.a], ax = V.norm(V.sub(P[r.b], o)), th = r.ang * t, c = Math.cos(th), s = Math.sin(th);
    r.side.forEach((i) => { const v = V.sub(P[i], o); const rv = V.add(V.add(V.mul(v, c), V.mul(V.cross(ax, v), s)), V.mul(ax, V.dot(ax, v) * (1 - c))); P[i] = V.add(o, rv); });
  });
  return P;
}
