/*
 * struct.js — estrutura de Lewis como dado único:
 *   LS = { atoms: [{el, x, y, lp, rad}], bonds: [{a, b, o}], name }
 * A partir dela: cargas formais, contagem de elétrons, domínios (VSEPR),
 * geometria eletrônica/molecular, hibridização, ligações σ/π, desenho de
 * Lewis em SVG e coordenadas 3D (VSEPR) com pares isolados e orbitais p.
 */
import { parseSmiles } from './chem.js';
import { layout } from './depict.js';
import { S, mol } from './chem2d.js';

export const VAL = { H: 1, B: 3, C: 4, N: 5, O: 6, F: 7, Cl: 7, Br: 7, I: 7, S: 6, P: 5 };
const D2R = Math.PI / 180;
const V = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul: (a, k) => [a[0] * k, a[1] * k, a[2] * k],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  len: (a) => Math.hypot(a[0], a[1], a[2]), norm: (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
};
export { V };

/* ===================================================================
 * Construção a partir de SMILES (H explícitos, pares isolados calculados)
 * =================================================================== */
export function fromSmiles(smi, name) {
  const m = parseSmiles(smi);
  const P = layout(m);
  const atoms = m.atoms.map((a, i) => ({ el: a.el, x: P[i][0], y: P[i][1], charge: a.charge || 0 }));
  const bonds = m.bonds.map((b) => ({ a: b.a, b: b.b, o: b.o, arom: m.atoms[b.a].aromatic && m.atoms[b.b].aromatic }));
  // H explícitos em direções livres
  m.atoms.forEach((a, i) => {
    const used = m.nb[i].map(({ j }) => Math.atan2(P[j][1] - P[i][1], P[j][0] - P[i][0]));
    const free = freeAngles(used, a.h);
    for (let k = 0; k < a.h; k++) { const t = free[k]; atoms.push({ el: 'H', x: P[i][0] + Math.cos(t) * 0.85, y: P[i][1] + Math.sin(t) * 0.85, charge: 0 }); bonds.push({ a: i, b: atoms.length - 1, o: 1 }); }
  });
  const LS = { atoms, bonds, name: name || smi };
  // pares isolados a partir da carga: elétrons restantes = V − carga − ligações
  atoms.forEach((a, i) => { const rem = (VAL[a.el] || 4) - a.charge - bondSum(LS, i); a.lp = Math.max(0, Math.floor(rem / 2)); a.rad = Math.max(0, rem % 2); });
  atoms.forEach((a) => delete a.charge);
  return LS;
}
function freeAngles(used, n) {
  if (!n) return [];
  if (!used.length) return n === 4 ? [0, 90, 180, 270].map((d) => d * D2R) : n === 3 ? [90, 210, 330].map((d) => d * D2R) : n === 2 ? [0, 180].map((d) => d * D2R) : [0];
  if (used.length === 1 && n === 3) { const u = used[0]; return [u + Math.PI, u + Math.PI / 2, u - Math.PI / 2]; }
  if (used.length === 1 && n === 2) { const u = used[0]; return [u + 2 * Math.PI / 3, u - 2 * Math.PI / 3]; }
  if (used.length === 1 && n === 1) return [used[0] + Math.PI];
  // maiores vãos angulares
  const out = [], us = used.slice();
  for (let k = 0; k < n; k++) {
    const s = us.slice().sort((a, b) => a - b); let best = -1, at = 0;
    s.forEach((a, q) => { const b = q === s.length - 1 ? s[0] + 2 * Math.PI : s[q + 1]; if (b - a > best) { best = b - a; at = a + (b - a) / 2; } });
    // dois H no mesmo vão grande: divide
    out.push(at); us.push(at);
  }
  return out;
}

/* ===================================================================
 * Contagens
 * =================================================================== */
export const nbs = (LS, i) => LS.bonds.filter((b) => b.a === i || b.b === i).map((b) => ({ j: b.a === i ? b.b : b.a, o: b.o, b }));
export const bondSum = (LS, i) => nbs(LS, i).reduce((s, x) => s + x.o, 0);
export const fc = (LS, i) => { const a = LS.atoms[i]; return (VAL[a.el] || 4) - 2 * (a.lp || 0) - (a.rad || 0) - bondSum(LS, i); };
export const charge = (LS) => LS.atoms.reduce((s, _, i) => s + fc(LS, i), 0);
export const valenceElectrons = (LS) => LS.atoms.reduce((s, a) => s + (VAL[a.el] || 4), 0) - charge(LS);
export const drawnElectrons = (LS) => LS.bonds.reduce((s, b) => s + 2 * b.o, 0) + LS.atoms.reduce((s, a) => s + 2 * (a.lp || 0) + (a.rad || 0), 0);
export const shellElectrons = (LS, i) => 2 * bondSum(LS, i) + 2 * (LS.atoms[i].lp || 0) + (LS.atoms[i].rad || 0);
export const domains = (LS, i) => nbs(LS, i).length + (LS.atoms[i].lp || 0) + (LS.atoms[i].rad || 0);
export function sigmaPi(LS) { let s = 0, p = 0; LS.bonds.forEach((b) => { s += 1; p += b.o - 1; }); return { s, p }; }
export function hybOf(LS, i) {
  const a = LS.atoms[i]; if (a.el === 'H') return null;
  const d = domains(LS, i);
  return { 2: 'sp', 3: 'sp²', 4: 'sp³' }[d] || null;
}
/** átomo com par isolado vizinho a uma ligação π (ex.: N de amida, O⁻ do acetato) */
export function conjugatedLP(LS, i) {
  if (!(LS.atoms[i].lp > 0) || nbs(LS, i).some((x) => x.o > 1)) return false;
  return nbs(LS, i).some(({ j }) => nbs(LS, j).some((y) => y.o > 1 && y.j !== i));
}
export const EGEO = { 1: '—', 2: 'linear', 3: 'trigonal planar', 4: 'tetraédrica', 5: 'bipirâmide trigonal', 6: 'octaédrica' };
export function molGeo(X, E) {
  const D = X + E;
  if (X <= 1) return X === 1 ? 'átomo terminal (1 ligação)' : '—';
  const T = { '2,0': 'linear', '3,0': 'trigonal planar', '2,1': 'angular', '4,0': 'tetraédrica', '3,1': 'piramidal trigonal', '2,2': 'angular', '5,0': 'bipirâmide trigonal', '4,1': 'gangorra', '3,2': 'forma de T', '2,3': 'linear', '6,0': 'octaédrica', '5,1': 'pirâmide de base quadrada', '4,2': 'quadrado planar' };
  return T[X + ',' + E] || EGEO[D];
}
export function idealAngle(X, E) {
  const T = { '2,0': '180°', '3,0': '120°', '2,1': '< 120° (≈ 117°)', '4,0': '109,5°', '3,1': '≈ 107°', '2,2': '≈ 104,5°', '5,0': '90° e 120°', '6,0': '90°', '4,1': '< 90° e < 120°', '3,2': '< 90°', '2,3': '180°', '4,2': '90°', '5,1': '< 90°' };
  return T[X + ',' + E] || '—';
}
export function centerInfo(LS, i) {
  const X = nbs(LS, i).length, E = (LS.atoms[i].lp || 0), D = X + E + (LS.atoms[i].rad || 0);
  return { X, E, D, axe: 'AX' + sub(X) + (E ? 'E' + sub(E) : ''), egeo: EGEO[D] || '—', mgeo: molGeo(X, E), ang: idealAngle(X, E), hyb: hybOf(LS, i), fc: fc(LS, i), conj: conjugatedLP(LS, i) };
}
const sub = (n) => (n > 1 ? String(n).replace(/\d/g, (d) => '₀₁₂₃₄₅₆₇₈₉'[d]) : '');

/* ===================================================================
 * Desenho de Lewis (SVG)
 * o: { hl: {i: cls}, fc: true, scale, fs, lpCls, hideH, onlyHeavyLP }
 * =================================================================== */
export function lewisS(LS, o = {}) {
  const s = new S();
  const A = LS.atoms;
  s._lp = {};
  A.forEach((a, i) => {
    const used = nbs(LS, i).map(({ j }) => Math.atan2(-(A[j].y - a.y), A[j].x - a.x) / D2R);
    if (fc(LS, i) && o.fc !== false) used.push(40); // espaço para o sinal da carga (canto superior direito)
    const n = (a.lp || 0) + (a.rad || 0);
    const ang = lpAngles(used, n);
    const f = fc(LS, i);
    const opt = { lp: ang.slice(0, a.lp || 0), rad: ang.slice(a.lp || 0) };
    s._lp[i] = opt.lp;
    if (o.fc !== false && f) opt.chg = f > 0 ? (f > 1 ? f + '+' : '+') : (f < -1 ? -f + '−' : '−');
    if (o.hl && o.hl[i]) opt.cls = o.hl[i];
    if (o.halo && o.halo[i]) opt.halo = o.halo[i];
    if (o.lpCls) opt.lpc = o.lpCls;
    if (o.note && o.note[i]) { opt.note = o.note[i]; opt.nd = [0, 0.62]; opt.ncls = 'locant'; }
    s.a(a.x, a.y, a.el, opt);
  });
  LS.bonds.forEach((b) => s.b(b.a, b.b, b.o === 1.5 ? '1p' : b.o, Object.assign({}, o.bondCls && o.bondCls[b.a + '-' + b.b] ? { cls: o.bondCls[b.a + '-' + b.b] } : {})));
  return s;
}
export const lewisSVG = (LS, o = {}) => { const sp = lewisS(LS, o); (o.arrows || []).forEach((a) => sp.arrow(a.from, a.to, a.bend ?? 0.45, a.cls || '')); const svg = mol(sp, { scale: o.scale || 48, fs: o.fs || 18, zoom: o.zoom || 1.2, maxw: o.maxw }); svg.setAttribute('aria-label', 'Estrutura de Lewis: ' + (LS.name || '')); svg._lp = sp._lp; return svg; };
/** cópia profunda */
export const clone = (LS) => ({ name: LS.name, atoms: LS.atoms.map((a) => Object.assign({}, a)), bonds: LS.bonds.map((b) => Object.assign({}, b)) });
function lpAngles(used, n) {
  if (!n) return [];
  const cand = [90, 270, 0, 180, 45, 135, 225, 315, 60, 120, 240, 300, 30, 150, 210, 330];
  const dist = (a, b) => Math.abs(((a - b + 540) % 360) - 180);
  if (used.length === 1 && n === 3) { const u = used[0]; return [u + 180, u + 90, u - 90]; }
  if (used.length === 1 && n === 2) { const u = used[0]; return [u + 120, u - 120]; }
  if (used.length === 1 && n === 1) return [used[0] + 180];
  if (used.length === 2 && n === 2) { const m = (used[0] + used[1]) / 2 + (dist(used[0], used[1]) > 180 ? 0 : 180); const b = Math.abs(((used[0] - used[1] + 540) % 360) - 180) > 150 ? 90 : 35; return [m + b, m - b]; }
  const out = [], all = used.slice();
  for (let k = 0; k < n; k++) { let best = null, bd = -1; cand.forEach((c) => { const d = Math.min(...all.map((u) => dist(c, u)), 999); if (d > bd) { bd = d; best = c; } }); out.push(best); all.push(best); }
  return out;
}

/* ===================================================================
 * Coordenadas 3D por VSEPR
 * devolve { atoms:[{el,p}], bonds:[[i,j,o]], lps:[{i,dir}], pdirs:{i:[dir]}, piBonds:[{a,b,dirs}] }
 * =================================================================== */
const BL = (a, b, o, arom) => {
  const k = [a, b].sort().join('');
  if (arom) return 1.39;
  const T = { CH: 1.09, HO: 0.96, HN: 1.01, HH: 0.74, BF: 1.31, CF: 1.35, CCl: 1.77, BrC: 1.94, CI: 2.14, FH: 0.92, ClH: 1.27, BH: 1.19 };
  if (k === 'CC') return o === 3 ? 1.20 : o === 2 ? 1.34 : 1.54;
  if (k === 'CO') return o === 3 ? 1.13 : o === 2 ? 1.21 : 1.43;
  if (k === 'CN') return o === 3 ? 1.16 : o === 2 ? 1.28 : 1.47;
  if (k === 'NO') return o === 2 ? 1.21 : 1.36;
  if (k === 'NN') return o === 3 ? 1.10 : o === 2 ? 1.25 : 1.45;
  if (k === 'OO') return o === 2 ? 1.21 : 1.48;
  return T[k] || 1.5;
};
function perp(u) { let p = V.cross(u, [0, 0, 1]); if (V.len(p) < 0.2) p = V.cross(u, [0, 1, 0]); return V.norm(p); }
const rot = (v, ax, th) => { const c = Math.cos(th), s = Math.sin(th); return V.add(V.add(V.mul(v, c), V.mul(V.cross(ax, v), s)), V.mul(ax, V.dot(ax, v) * (1 - c))); };
/** direções ideais para D domínios, com a primeira = u (se dado) e referência ref para orientar */
export function idealDirs(D, u, ref) {
  if (!u) {
    if (D === 1) return [[1, 0, 0]];
    if (D === 2) return [[1, 0, 0], [-1, 0, 0]];
    if (D === 3) return [[1, 0, 0], [-0.5, 0.866, 0], [-0.5, -0.866, 0]];
    if (D === 4) return [[0, 0.943, -0.333], [-0.816, -0.471, -0.333], [0.816, -0.471, -0.333], [0, 0, 1]];
    if (D === 5) return [[0, 0, 1], [0, 0, -1], [1, 0, 0], [-0.5, 0.866, 0], [-0.5, -0.866, 0]];
    return [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  }
  u = V.norm(u);
  let e1 = ref ? V.sub(ref, V.mul(u, V.dot(ref, u))) : perp(u);
  if (V.len(e1) < 1e-3) e1 = perp(u);
  e1 = V.norm(e1);
  const e2 = V.cross(u, e1);
  if (D === 1) return [u];
  if (D === 2) return [u, V.mul(u, -1)];
  if (D === 3) return [u, V.add(V.mul(u, -0.5), V.mul(e1, 0.866)), V.add(V.mul(u, -0.5), V.mul(e1, -0.866))];
  const k = Math.sqrt(8) / 3;
  return [u, ...[0, 1, 2].map((q) => { const f = q * 2 * Math.PI / 3; return V.add(V.mul(u, -1 / 3), V.add(V.mul(e1, k * Math.cos(f)), V.mul(e2, k * Math.sin(f)))); })];
}
export function to3D(LS) {
  const A = LS.atoms, n = A.length, P = new Array(n).fill(null), frame = {}, lps = [], pdirs = {};
  const nb = (i) => nbs(LS, i);
  const D = (i) => domains(LS, i);
  // anel aromático: polígono plano
  const ring = findRing(LS);
  const order = [];
  const place = (i, p) => { P[i] = p; order.push(i); };
  if (ring) {
    const R = 1.39 / (2 * Math.sin(Math.PI / ring.length));
    ring.forEach((a, k) => { const t = k * 2 * Math.PI / ring.length; place(a, [R * Math.cos(t), R * Math.sin(t), 0]); frame[a] = { normal: [0, 0, 1] }; });
  } else {
    const root = A.map((_, i) => i).filter((i) => A[i].el !== 'H').sort((x, y) => nb(y).length - nb(x).length)[0] ?? 0;
    place(root, [0, 0, 0]);
  }
  const q = order.slice();
  while (q.length) {
    const i = q.shift();
    const placedNb = nb(i).filter(({ j }) => P[j]);
    const todo = nb(i).filter(({ j }) => !P[j]).sort((x, y) => (A[y.j].el !== 'H') - (A[x.j].el !== 'H'));
    const d = Math.max(D(i), placedNb.length + todo.length + (A[i].lp || 0));
    let dirs;
    if (ring && ring.includes(i)) {
      // fora do anel: bissetriz externa
      const out = V.norm(V.mul(placedNb.reduce((s, { j }) => V.add(s, V.norm(V.sub(P[j], P[i]))), [0, 0, 0]), -1));
      dirs = placedNb.map(({ j }) => V.norm(V.sub(P[j], P[i]))).concat([out]);
    } else if (!placedNb.length) {
      dirs = idealDirs(d);
      if (d === 3) frame[i] = { normal: [0, 0, 1] };
    } else {
      const parent = placedNb[0].j, u = V.norm(V.sub(P[parent], P[i])), bo = placedNb[0].o;
      let ref = null;
      const pOthers = nb(parent).filter(({ j }) => j !== i && P[j]).map(({ j }) => V.norm(V.sub(P[j], P[parent])));
      if (d === 3) {
        // plano que contenha os substituintes do vizinho (orbitais p paralelos)
        let normal = frame[parent] && frame[parent].normal;
        if (frame[parent] && frame[parent].pfree && frame[parent].pfree.length) normal = frame[parent].pfree.shift();
        if (!normal && pOthers.length) normal = V.cross(u, pOthers[0]);
        if (!normal || V.len(normal) < 1e-3) normal = perp(u);
        normal = V.norm(normal);
        ref = V.cross(normal, u);
        // o substituinte "cis" fica do mesmo lado de um substituinte do vizinho
        if (pOthers.length && V.dot(ref, pOthers[0]) < 0) ref = V.mul(ref, -1);
        frame[i] = { normal };
      } else if (d === 4) {
        if (pOthers.length) ref = V.mul(pOthers[0], -1); // alternada
      } else if (d === 2) {
        const pf = frame[parent] && frame[parent].pfree;
        let e1 = frame[parent] && frame[parent].normal ? frame[parent].normal : perp(u);
        if (bo === 3 && frame[parent] && frame[parent].pset) e1 = frame[parent].pset[0];
        e1 = V.norm(V.sub(e1, V.mul(u, V.dot(e1, u))));
        if (V.len(e1) < 1e-3) e1 = perp(u);
        frame[i] = { pset: [e1, V.norm(V.cross(u, e1))] };
        void pf;
      }
      dirs = idealDirs(d, u, ref);
    }
    if (d === 2 && !frame[i]) { const ax = dirs[0], e1 = perp(ax); frame[i] = { pset: [e1, V.cross(ax, e1)] }; }
    if (d === 2 && frame[i].pset) frame[i].pfree = frame[i].pset.slice();
    // atribui direções: vizinhos já posicionados ocupam as primeiras
    const free = dirs.slice(placedNb.length);
    todo.forEach(({ j, o, b }, k) => {
      const dir = free[k] || perp(dirs[0]);
      place(j, V.add(P[i], V.mul(dir, BL(A[i].el, A[j].el, o, b.arom))));
      q.push(j);
    });
    for (let k = todo.length; k < free.length && lps.filter((x) => x.i === i).length < (A[i].lp || 0); k++) lps.push({ i, dir: free[k] });
    // orbitais p não hibridizados
    if (A[i].el !== 'H') {
      if (d === 3) pdirs[i] = [frame[i] ? frame[i].normal : [0, 0, 1]];
      if (d === 2) pdirs[i] = frame[i].pset;
    }
  }
  for (let i = 0; i < n; i++) if (!P[i]) P[i] = [i * 0.8, 3, 0];
  // pares isolados comprimem os ângulos (NH₃ ≈ 107°, H₂O ≈ 104,5°) quando os vizinhos são terminais
  A.forEach((a, i) => {
    const N = nb(i), E = a.lp || 0;
    if (a.el === 'H' || E < 1 || (N.length + E !== 4 && !(N.length === 2 && E === 1)) || !N.every(({ j }) => nbs(LS, j).length === 1)) return;
    const L = V.norm(lps.filter((x) => x.i === i).reduce((s, x) => V.add(s, x.dir), [0, 0, 0]));
    if (N.length === 3) {
      const h = Math.sqrt((0.5 + Math.cos(107 * D2R)) / (1 - Math.cos(107 * D2R)));
      N.forEach(({ j, o }) => { const d = V.norm(V.sub(P[j], P[i])); const w = V.norm(V.sub(d, V.mul(L, V.dot(d, L)))); const nd = V.norm(V.add(V.mul(L, -h), w)); P[j] = V.add(P[i], V.mul(nd, BL(a.el, A[j].el, o))); });
    } else if (N.length === 2) {
      const d1 = V.norm(V.sub(P[N[0].j], P[i])), d2 = V.norm(V.sub(P[N[1].j], P[i])), B = V.norm(V.add(d1, d2)), e = V.norm(V.sub(d1, d2)), t = (E === 1 ? 119 : 104.5) / 2 * D2R;
      [[N[0], 1], [N[1], -1]].forEach(([x, sg]) => { const nd = V.add(V.mul(B, Math.cos(t)), V.mul(e, sg * Math.sin(t))); P[x.j] = V.add(P[i], V.mul(nd, BL(a.el, A[x.j].el, x.o))); });
    }
  });
  // centraliza
  const c = P.reduce((s, p) => V.add(s, p), [0, 0, 0]).map((x) => x / n);
  const atoms = A.map((a, i) => ({ el: a.el, p: V.sub(P[i], c) }));
  // ligações π: direção dos orbitais p envolvidos
  const piBonds = [];
  LS.bonds.forEach((b) => {
    if (b.arom) return;
    for (let k = 1; k < b.o; k++) {
      const da = pdirs[b.a] || [], db = pdirs[b.b] || [];
      // escolhe a direção p do átomo a mais paralela a uma de b
      let best = null, bs = -1;
      da.forEach((x) => db.forEach((y) => { const s = Math.abs(V.dot(x, y)); if (s > bs && !piBonds.some((pb) => pb.a === b.a && pb.b === b.b && Math.abs(V.dot(pb.dir, x)) > 0.9)) { bs = s; best = x; } }));
      if (!best) best = da[k - 1] || db[k - 1] || [0, 0, 1];
      piBonds.push({ a: b.a, b: b.b, dir: best });
    }
  });
  return { atoms, bonds: LS.bonds.map((b) => [b.a, b.b, b.o, b.arom]), lps, pdirs, piBonds, ring, P: atoms.map((a) => a.p) };
}
function findRing(LS) {
  // anel simples de 6 átomos com ligações aromáticas
  const ar = LS.bonds.filter((b) => b.arom);
  if (!ar.length) return null;
  const start = ar[0].a, path = [start], seen = new Set([start]);
  let cur = start;
  for (let k = 0; k < 6; k++) {
    const nx = ar.filter((b) => b.a === cur || b.b === cur).map((b) => (b.a === cur ? b.b : b.a)).find((j) => !seen.has(j) || (j === start && path.length === 6));
    if (nx === undefined || nx === start) break;
    path.push(nx); seen.add(nx); cur = nx;
  }
  return path.length >= 5 ? path : null;
}
/** ângulo (graus) entre três pontos */
export const angle3 = (a, b, c) => { const u = V.norm(V.sub(a, b)), v = V.norm(V.sub(c, b)); return Math.acos(Math.max(-1, Math.min(1, V.dot(u, v)))) / D2R; };
