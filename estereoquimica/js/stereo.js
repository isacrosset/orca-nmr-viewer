/*
 * stereo.js — motor de estereoquímica (sem dependências gráficas).
 * Uma molécula é definida UMA vez (cadeia + substituintes + R/S desejados);
 * a partir dela geramos: grafo, geometria 3D em zigue-zague, geometria de
 * Fischer (eclipsada), desenho em cunha/tracejado, prioridades CIP com
 * explicação, descritores R/S, nome, imagem especular e relações entre
 * estereoisômeros. Todas as representações são validadas entre si.
 */
export const V = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  mul: (a, k) => [a[0] * k, a[1] * k, a[2] * k],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  len: (a) => Math.hypot(a[0], a[1], a[2]),
  norm: (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
  lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t],
};
export function tetraDirs(u, phase = 0, ref = [0, 0, 1]) {
  u = V.norm(u);
  let p = V.cross(u, ref); if (V.len(p) < 1e-3) p = V.cross(u, [0, 1, 0]); p = V.norm(p);
  const q = V.cross(u, p), k = Math.sqrt(8) / 3;
  return [0, 1, 2].map((i) => { const f = phase + i * 2 * Math.PI / 3; return V.add(V.mul(u, -1 / 3), V.add(V.mul(p, k * Math.cos(f)), V.mul(q, k * Math.sin(f)))); });
}
/** R/S a partir dos vetores (centro → ligante) dos grupos de prioridade 1..4 */
export function chir(v1, v2, v3, v4) {
  const a = V.sub(v1, v4), b = V.sub(v2, v4), c = V.sub(v3, v4);
  return V.dot(a, V.cross(b, c)) < 0 ? 'R' : 'S';
}

/* ===================================================================
 * Grupos (árvores) — k: filhos; b: ordem da ligação com o pai
 * =================================================================== */
const A = (el, k, b) => ({ el, k: k || [], b: b || 1 });
const H = A('H'), CH3 = A('C', [H, H, H]), OH = A('O', [H]);
export const GROUPS = {
  H: { g: H, t: 'H' }, D: { g: A('D'), t: 'D' }, T: { g: A('T'), t: 'T' },
  F: { g: A('F'), t: 'F' }, Cl: { g: A('Cl'), t: 'Cl' }, Br: { g: A('Br'), t: 'Br' }, I: { g: A('I'), t: 'I' },
  OH: { g: OH, t: 'OH' }, OCH3: { g: A('O', [CH3]), t: 'OCH₃' }, NH2: { g: A('N', [H, H]), t: 'NH₂' }, SH: { g: A('S', [H]), t: 'SH' },
  CH3: { g: CH3, t: 'CH₃' }, Et: { g: A('C', [CH3, H, H]), t: 'CH₂CH₃', sk: 1 }, Pr: { g: A('C', [A('C', [CH3, H, H]), H, H]), t: 'CH₂CH₂CH₃', sk: 2 },
  iPr: { g: A('C', [CH3, CH3, H]), t: 'CH(CH₃)₂' },
  CH2OH: { g: A('C', [OH, H, H]), t: 'CH₂OH' }, CH2Cl: { g: A('C', [A('Cl'), H, H]), t: 'CH₂Cl' }, CH2Br: { g: A('C', [A('Br'), H, H]), t: 'CH₂Br' },
  CHO: { g: A('C', [A('O', [], 2), H]), t: 'CHO' }, COOH: { g: A('C', [A('O', [], 2), OH]), t: 'COOH' }, COOCH3: { g: A('C', [A('O', [], 2), A('O', [CH3])]), t: 'COOCH₃' },
  CN: { g: A('C', [A('N', [], 3)]), t: 'CN' }, vinil: { g: A('C', [A('C', [H, H], 2), H]), t: 'CH=CH₂' },
  CCH: { g: A('C', [A('C', [H], 3)]), t: 'C≡CH' },
};
export const glab = (g) => (GROUPS[g] ? GROUPS[g].t : g);
const ZN = { H: 1, D: 1.002, T: 1.003, C: 6, N: 7, O: 8, F: 9, S: 16, Cl: 17, Br: 35, I: 53 };
const SYM = (z) => Object.keys(ZN).find((k) => ZN[k] === z) || (z === 0 ? '·' : '?');
const BL = (a, b, o) => {
  if (a === 'C' && b === 'C') return o === 3 ? 1.2 : o === 2 ? 1.34 : 1.53;
  const k = [a, b].sort().join('-');
  if (/^(C|N|O|S)-(D|H|T)$/.test(k) || /^(D|H|T)-(C|N|O|S)$/.test(k)) return k.includes('O') ? 0.97 : k.includes('N') ? 1.01 : k.includes('S') ? 1.34 : 1.09;
  return ({ 'C-O': o === 2 ? 1.21 : 1.43, 'C-N': o === 3 ? 1.16 : 1.47, 'C-F': 1.35, 'C-Cl': 1.78, 'Br-C': 1.94, 'C-I': 2.14, 'C-S': 1.82 })[k] || 1.5;
};

/* ===================================================================
 * Construção: cadeia em zigue-zague (plano xy) ou em Fischer
 * spec = { chain: [T0, {f, b}, ..., Tn], cfg: ['R', null, ...] }
 * =================================================================== */
const STEP = [1.253, 0.885];
function rotX(v, a) { const c = Math.cos(a), s = Math.sin(a); return [v[0], v[1] * c - v[2] * s, v[1] * s + v[2] * c]; }
const UPF = [0, 0.816, -0.577], DNF = [0, -0.816, -0.577], LF = [-0.816, 0, 0.577], RF = [0.816, 0, 0.577];
export function build(spec, mode = 'zig', lr) {
  const chain = spec.chain, m = chain.length - 2;
  const atoms = [], bonds = [], groupAt = {}, info = { centers: [], sub: [] };
  const add = (el, p) => { atoms.push({ el, p }); return atoms.length - 1; };
  const addG = (gname, parent, dir, phase = 0) => {
    const G = GROUPS[gname].g;
    const rec = (node, pi, d, ph) => {
      const p = V.add(atoms[pi].p, V.mul(V.norm(d), BL(atoms[pi].el, node.el, node.b)));
      const i = add(node.el, p); bonds.push([pi, i, node.b]);
      if (node.k.length) {
        const u = V.mul(V.norm(d), -1);
        const lin = node.b === 3 || node.k.some((k) => k.b === 3), tri = node.b === 2 || node.k.some((k) => k.b === 2);
        let dirs;
        if (lin) dirs = [V.mul(u, -1)];
        else if (tri) { let pp = V.cross(u, [0, 0, 1]); if (V.len(pp) < 0.1) pp = V.cross(u, [0, 1, 0]); pp = V.norm(V.cross(pp, u)); dirs = [V.add(V.mul(u, -0.5), V.mul(pp, 0.866)), V.add(V.mul(u, -0.5), V.mul(pp, -0.866))]; }
        else dirs = tetraDirs(u, ph);
        node.k.forEach((k, n) => rec(k, i, dirs[n], ph + Math.PI / 3));
      }
      return i;
    };
    const i = rec(G, parent, dir, phase);
    groupAt[i] = gname;
    return i;
  };
  // posições dos carbonos da cadeia
  let P = [], frames = [];
  if (mode === 'zig') {
    for (let k = 0; k < m + 2; k++) P.push([(k - 1) * STEP[0], (k % 2) * STEP[1], 0]);
  } else {
    let cur = [0, 0, 0];
    for (let k = 0; k < m; k++) { const a = k * 70.53 * Math.PI / 180; frames.push(a); P[k + 1] = cur; cur = V.add(cur, V.mul(rotX(DNF, a), 1.54)); }
    P[0] = V.add(P[1], V.mul(rotX(UPF, 0), 1.54)); P[m + 1] = V.add(P[m], V.mul(rotX(DNF, frames[m - 1]), 1.54));
  }
  const C = [];
  for (let k = 1; k <= m; k++) C.push(add('C', P[k]));
  for (let k = 0; k < m - 1; k++) bonds.push([C[k], C[k + 1], 1]);
  for (let k = 1; k <= m; k++) {
    const s = chain[k];
    let df, db;
    if (mode === 'zig') {
      const u = V.norm(V.sub(P[k - 1], P[k])), w = V.norm(V.sub(P[k + 1], P[k]));
      const out = V.norm(V.mul(V.add(u, w), -1));
      df = V.add(V.mul(out, 0.577), [0, 0, 0.816]); db = V.add(V.mul(out, 0.577), [0, 0, -0.816]);
    } else {
      const a = frames[k - 1], L = rotX(LF, a), Rr = rotX(RF, a);
      const sw = lr && lr[k - 1] === 'bf';
      df = sw ? Rr : L; db = sw ? L : Rr;
    }
    const fi = addG(s.f, C[k - 1], df, 0.3), bi = addG(s.b, C[k - 1], db, 0.3);
    info.sub.push({ c: C[k - 1], f: fi, b: bi, loc: (spec.loc || [])[k - 1] });
  }
  const t0 = addG(chain[0], C[0], V.sub(P[0], P[1]), 0.2);
  const tn = addG(chain[m + 1], C[m - 1], V.sub(P[m + 1], P[m]), 0.2);
  // centraliza
  const ctr = atoms.reduce((s, a) => V.add(s, a.p), [0, 0, 0]).map((x) => x / atoms.length);
  atoms.forEach((a) => { a.p = V.sub(a.p, ctr); });
  const mol = { atoms, bonds, groupAt, C, t0, tn, info, spec, mode };
  mol.nb = atoms.map(() => []);
  bonds.forEach(([i, j, o]) => { mol.nb[i].push([j, o]); mol.nb[j].push([i, o]); });
  return mol;
}

/* ===================================================================
 * CIP: dígrafo hierárquico (com átomos duplicados para ligações múltiplas)
 * =================================================================== */
function tree(mol, a, from, depth, path) {
  const node = { z: ZN[mol.atoms[a].el], a, kids: [] };
  if (depth <= 0) return node;
  const p2 = new Set(path); p2.add(a);
  mol.nb[a].forEach(([j, o]) => {
    if (j !== from) {
      if (p2.has(j)) node.kids.push({ z: ZN[mol.atoms[j].el], a: j, kids: [], dup: true });
      else node.kids.push(tree(mol, j, a, depth - 1, p2));
    }
    for (let d = 1; d < o; d++) node.kids.push({ z: ZN[mol.atoms[j].el], a: j, kids: [], dup: true });
  });
  return node;
}
export function cmpNode(A, B) {
  if (A.z !== B.z) return A.z - B.z;
  const ka = A.kids.slice().sort((x, y) => cmpNode(y, x)), kb = B.kids.slice().sort((x, y) => cmpNode(y, x));
  const n = Math.max(ka.length, kb.length, 3);
  for (let i = 0; i < n; i++) { const za = ka[i] ? ka[i].z : 0, zb = kb[i] ? kb[i].z : 0; if (za !== zb) return za - zb; }
  for (let i = 0; i < Math.min(ka.length, kb.length); i++) { const c = cmpNode(ka[i], kb[i]); if (c) return c; }
  return 0;
}
/** camadas de um ramo: [ [z], [z,z,z], ... ] seguindo o ramo de maior prioridade */
function layers(node, depth = 4) {
  const out = [[node.z]];
  let cur = [node];
  for (let d = 1; d < depth; d++) {
    const kids = cur[0] && cur[0].kids ? cur[0].kids.slice().sort((x, y) => cmpNode(y, x)) : [];
    if (!kids.length) break;
    out.push(kids.map((k) => k.z));
    cur = [kids[0]];
  }
  return out;
}
const fmtSet = (zs) => '(' + zs.map(SYM).join(', ') + ')';
/** onde dois ramos se diferenciam (para explicação) */
export function whyPair(A, B) {
  if (A.z !== B.z) return { level: 1, txt: `camada 1: ${SYM(A.z)} × ${SYM(B.z)} → ${A.z > B.z ? SYM(A.z) : SYM(B.z)} tem maior número atômico${(A.z % 1 || B.z % 1) ? ' (isótopos: maior número de massa)' : ''}` };
  const rec = (a, b, lvl, pathTxt) => {
    const ka = a.kids.slice().sort((x, y) => cmpNode(y, x)), kb = b.kids.slice().sort((x, y) => cmpNode(y, x));
    const za = ka.map((k) => k.z), zb = kb.map((k) => k.z);
    while (za.length < 3) za.push(0); while (zb.length < 3) zb.push(0);
    for (let i = 0; i < 3; i++) if (za[i] !== zb[i]) return { level: lvl, txt: `${pathTxt}camada ${lvl}: ${fmtSet(za)} × ${fmtSet(zb)} → o primeiro ponto de diferença decide (${SYM(za[i])} ${za[i] > zb[i] ? '>' : '<'} ${SYM(zb[i])})` };
    for (let i = 0; i < Math.min(ka.length, kb.length); i++) if (cmpNode(ka[i], kb[i])) return rec(ka[i], kb[i], lvl + 1, `${pathTxt}camada ${lvl}: ${fmtSet(za)} = ${fmtSet(zb)} (empate) · `);
    return { level: lvl, txt: 'ramos idênticos' };
  };
  return rec(A, B, 2, `camada 1: ${SYM(A.z)} = ${SYM(B.z)} (empate) · `);
}
export function rankCenter(mol, c) {
  const nbs = mol.nb[c].map(([j]) => j);
  const trees = nbs.map((j) => ({ j, t: tree(mol, j, c, 8, new Set([c])) }));
  trees.sort((x, y) => cmpNode(y.t, x.t));
  let distinct = true;
  for (let i = 0; i < trees.length - 1; i++) if (cmpNode(trees[i].t, trees[i + 1].t) === 0) distinct = false;
  return { order: trees.map((x) => x.j), trees, distinct };
}
export function descriptor(mol, c) {
  const r = rankCenter(mol, c);
  if (!r.distinct || r.order.length !== 4) return null;
  const v = r.order.map((j) => V.sub(mol.atoms[j].p, mol.atoms[c].p));
  return chir(v[0], v[1], v[2], v[3]);
}
/** rótulo legível de um ligante do centro */
export function ligLabel(mol, c, j) {
  if (mol.groupAt[j]) return glab(mol.groupAt[j]);
  const k = mol.C.indexOf(j);
  const sub = mol.info.sub[k];
  const parts = sub ? [glab(mol.groupAt[sub.f]), glab(mol.groupAt[sub.b])].filter((x) => x !== 'H') : [];
  return 'C' + ((mol.spec.loc || [])[k] || '') + (parts.length ? '(' + parts.join(',') + ')' : 'H₂');
}
export function explainCenter(mol, c) {
  const r = rankCenter(mol, c);
  const lig = r.trees.map((x, i) => ({ j: x.j, rank: i + 1, label: ligLabel(mol, c, x.j), layers: layers(x.t).map((zs, d) => (d === 0 ? SYM(zs[0]) : fmtSet(zs))) }));
  const pairs = [];
  for (let i = 0; i < r.trees.length - 1; i++) pairs.push({ a: lig[i].label, b: lig[i + 1].label, why: whyPair(r.trees[i].t, r.trees[i + 1].t).txt });
  return { lig, pairs, distinct: r.distinct };
}

/* ===================================================================
 * Molécula completa a partir da especificação (ajusta f/b ao R/S pedido)
 * =================================================================== */
export function makeMol(spec0) {
  const spec = JSON.parse(JSON.stringify(spec0));
  let mol = build(spec);
  const m = spec.chain.length - 2;
  if (spec.cfg) {
    let changed = false;
    for (let k = 0; k < m; k++) {
      const want = spec.cfg[k]; if (!want) continue;
      const d = descriptor(mol, mol.C[k]);
      if (d && d !== want) { const s = spec.chain[k + 1]; [s.f, s.b] = [s.b, s.f]; changed = true; }
    }
    if (changed) mol = build(spec);
  }
  mol.desc = mol.C.map((c) => descriptor(mol, c));
  mol.centers = mol.C.filter((c, k) => mol.desc[k]);
  // Fischer: escolhe esquerda/direita de cada centro para reproduzir o mesmo R/S
  const lr = [];
  for (let k = 0; k < m; k++) {
    let fm = build(spec, 'fischer', lr.concat(['fb']));
    const d = mol.desc[k];
    const dd = d ? descriptor(fm, fm.C[k]) : d;
    lr.push(d && dd !== d ? 'bf' : 'fb');
  }
  mol.fischer = build(spec, 'fischer', lr); mol.fischer.lr = lr;
  mol.spec = spec;
  return mol;
}
export function mirrorMol(mol) {
  const c = JSON.parse(JSON.stringify(mol.spec));
  c.cfg = mol.desc.map((d) => (d ? (d === 'R' ? 'S' : 'R') : null));
  return makeMol(c);
}
/** reflexão literal das coordenadas (x → −x): a imagem no espelho */
export function reflectMol(mol) {
  const r = Object.assign({}, mol, { atoms: mol.atoms.map((a) => ({ el: a.el, p: [-a.p[0], a.p[1], a.p[2]] })) });
  r.desc = mol.C.map((c) => descriptor(r, c));
  return r;
}
export function withCfg(spec, cfg) { const c = JSON.parse(JSON.stringify(spec)); c.cfg = cfg; return makeMol(c); }

/* ===================================================================
 * Fórmula, nome, simetria, relações
 * =================================================================== */
export function formula(mol) {
  const n = {}; mol.atoms.forEach((a) => { const e = a.el === 'D' || a.el === 'T' ? a.el : a.el; n[e] = (n[e] || 0) + 1; });
  const order = ['C', 'H', 'D', 'T'].concat(Object.keys(n).filter((k) => !['C', 'H', 'D', 'T'].includes(k)).sort());
  const sub = (x) => String(x).replace(/\d/g, (d) => '₀₁₂₃₄₅₆₇₈₉'[d]);
  return order.filter((e) => n[e]).map((e) => e + (n[e] > 1 ? sub(n[e]) : '')).join('');
}
export function cfgString(mol) {
  const locs = mol.spec.loc || [];
  const parts = []; mol.desc.forEach((d, k) => { if (d) parts.push((mol.centers.length > 1 ? (locs[k] || '') : '') + d); });
  return parts.length ? '(' + parts.join(',') + ')' : '';
}
export function nameOf(mol) {
  const c = cfgString(mol);
  if (!mol.spec.name) return '';
  if (meso(mol)) return mol.spec.name.replace('{cfg}', c ? c + '-' : '').replace('{meso}', ' (meso)');
  return mol.spec.name.replace('{cfg}', c ? c + '-' : '').replace('{meso}', '');
}
/** a constituição é simétrica pela inversão da cadeia? */
export function symChain(spec) {
  const ch = spec.chain, n = ch.length;
  for (let i = 0; i < n; i++) {
    const a = ch[i], b = ch[n - 1 - i];
    if (typeof a === 'string' || typeof b === 'string') { if (a !== b) return false; }
    else { const sa = [a.f, a.b].sort().join(), sb = [b.f, b.b].sort().join(); if (sa !== sb) return false; }
  }
  return true;
}
const inv = (d) => (d === 'R' ? 'S' : d === 'S' ? 'R' : d);
export function sameStereo(A, B) {
  if (A.spec.family !== B.spec.family) return false;
  const a = A.desc, b = B.desc;
  if (a.join() === b.join()) return true;
  return symChain(A.spec) && a.join() === b.slice().reverse().join();
}
export function meso(mol) { return mol.centers.length > 0 && sameStereo(mol, mirrorMol(mol)); }
export function chiral(mol) { return mol.centers.length > 0 && !meso(mol); }
export function relation(A, B) {
  if (formula(A) !== formula(B)) return { r: 'diferentes', t: 'fórmulas moleculares diferentes: não são isômeros' };
  if (A.spec.family !== B.spec.family) return { r: 'constitucionais', t: 'mesma fórmula, conectividade diferente: isômeros constitucionais' };
  if (sameStereo(A, B)) return { r: 'idênticas', t: meso(A) ? 'mesma molécula (forma meso: as duas representações se sobrepõem)' : 'mesma molécula (mesmos descritores)' };
  const mB = mirrorMol(B);
  if (sameStereo(A, mB)) return { r: 'enantiômeros', t: 'todos os centros invertidos: imagens especulares não sobreponíveis' };
  return { r: 'diastereoisômeros', t: 'apenas parte dos centros invertida: estereoisômeros que não são imagens especulares' };
}
/** todos os estereoisômeros distintos de uma família */
export function allStereo(spec) {
  const base = makeMol(spec);
  const idx = base.C.map((c, k) => (base.desc[k] ? k : -1)).filter((k) => k >= 0);
  const out = [];
  for (let mask = 0; mask < (1 << idx.length); mask++) {
    const cfg = base.desc.map(() => null);
    idx.forEach((k, n) => { cfg[k] = (mask >> n) & 1 ? 'S' : 'R'; });
    const mm = withCfg(spec, cfg);
    if (!out.some((o) => sameStereo(o, mm))) out.push(mm);
  }
  return { list: out, n: idx.length, max: 1 << idx.length };
}

/* ===================================================================
 * Superposição (Kabsch/Horn com quaternions) e validação
 * =================================================================== */
export function align(P, Q) {
  const n = P.length, cp = P.reduce((s, p) => V.add(s, p), [0, 0, 0]).map((x) => x / n), cq = Q.reduce((s, p) => V.add(s, p), [0, 0, 0]).map((x) => x / n);
  const p = P.map((x) => V.sub(x, cp)), q = Q.map((x) => V.sub(x, cq));
  const S = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let i = 0; i < n; i++) for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) S[a][b] += q[i][a] * p[i][b];
  const [[xx, xy, xz], [yx, yy, yz], [zx, zy, zz]] = S;
  const N = [[xx + yy + zz, yz - zy, zx - xz, xy - yx], [yz - zy, xx - yy - zz, xy + yx, zx + xz], [zx - xz, xy + yx, -xx + yy - zz, yz + zy], [xy - yx, zx + xz, yz + zy, -xx - yy + zz]];
  // Jacobi
  const a = N.map((r) => r.slice()), v = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];
  for (let sweep = 0; sweep < 50; sweep++) {
    let off = 0; for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) off += a[i][j] ** 2;
    if (off < 1e-14) break;
    for (let pI = 0; pI < 4; pI++) for (let qI = pI + 1; qI < 4; qI++) {
      if (Math.abs(a[pI][qI]) < 1e-15) continue;
      const th = (a[qI][qI] - a[pI][pI]) / (2 * a[pI][qI]); const t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1)); const c = 1 / Math.sqrt(t * t + 1), s = t * c;
      for (let k = 0; k < 4; k++) { const akp = a[k][pI], akq = a[k][qI]; a[k][pI] = c * akp - s * akq; a[k][qI] = s * akp + c * akq; }
      for (let k = 0; k < 4; k++) { const apk = a[pI][k], aqk = a[qI][k]; a[pI][k] = c * apk - s * aqk; a[qI][k] = s * apk + c * aqk; }
      for (let k = 0; k < 4; k++) { const vkp = v[k][pI], vkq = v[k][qI]; v[k][pI] = c * vkp - s * vkq; v[k][qI] = s * vkp + c * vkq; }
    }
  }
  let best = 0; for (let i = 1; i < 4; i++) if (a[i][i] > a[best][best]) best = i;
  const [w, x, y, z] = [v[0][best], v[1][best], v[2][best], v[3][best]];
  const R = [[w * w + x * x - y * y - z * z, 2 * (x * y - w * z), 2 * (x * z + w * y)], [2 * (x * y + w * z), w * w - x * x + y * y - z * z, 2 * (y * z - w * x)], [2 * (x * z - w * y), 2 * (y * z + w * x), w * w - x * x - y * y + z * z]];
  const rot = (u) => [R[0][0] * u[0] + R[0][1] * u[1] + R[0][2] * u[2], R[1][0] * u[0] + R[1][1] * u[1] + R[1][2] * u[2], R[2][0] * u[0] + R[2][1] * u[1] + R[2][2] * u[2]];
  const moved = q.map((u) => V.add(rot(u), cp));
  const dev = moved.map((m2, i) => V.len(V.sub(m2, P[i])));
  const rmsd = Math.sqrt(dev.reduce((s, d) => s + d * d, 0) / n);
  return { R, rot, cq, cp, moved, dev, rmsd };
}
/** validação cruzada: 3D zigue-zague × Fischer × desenho 2D */
export function validate(mol, wedge) {
  const errs = [];
  mol.C.forEach((c, k) => {
    const d = mol.desc[k]; if (!d) return;
    const df = descriptor(mol.fischer, mol.fischer.C[k]);
    if (df !== d) errs.push(`Fischer incompatível no centro ${k + 1}: ${df} × ${d}`);
    if (wedge && wedge.p3) {
      const r = rankCenter(mol, c); const v = r.order.map((j) => V.sub(wedge.p3[j], wedge.p3[c]));
      const dw = chir(v[0], v[1], v[2], v[3]); if (dw !== d) errs.push(`cunha/tracejado incompatível no centro ${k + 1}: ${dw} × ${d}`);
    }
    const r = rankCenter(mol, c); if (!r.distinct) errs.push('centro com grupos repetidos');
  });
  const mm = reflectMol(mol);
  mol.desc.forEach((d, k) => { if (d && mm.desc[k] === d) errs.push('imagem especular incorreta'); });
  return errs;
}

/* ===================================================================
 * Sobreposição automática entre duas moléculas da mesma família:
 * mapeia átomos pesados pela estrutura (cadeia direta ou invertida),
 * alinha (rotação própria, sem reflexão) e pareia os H pelo mais próximo.
 * =================================================================== */
export function branchOf(mol, c, j) {
  const seen = new Set([c, j]), out = [j], st = [j];
  while (st.length) { const a = st.pop(); mol.nb[a].forEach(([b]) => { if (!seen.has(b)) { seen.add(b); out.push(b); st.push(b); } }); }
  return out.sort((x, y) => x - y);
}
function heavyMap(A, B, rev) {
  const m = A.C.length; if (B.C.length !== m) return null;
  const map = {};
  const pairSub = (ca, ja, cb, jb) => { const la = branchOf(A, ca, ja), lb = branchOf(B, cb, jb); if (la.length !== lb.length) return false; la.forEach((a, i) => { map[a] = lb[i]; }); return true; };
  for (let k = 0; k < m; k++) {
    const kb = rev ? m - 1 - k : k;
    map[A.C[k]] = B.C[kb];
    const sa = A.info.sub[k], sb = B.info.sub[kb], used = new Set();
    for (const ja of [sa.f, sa.b]) {
      const jb = [sb.f, sb.b].find((x) => !used.has(x) && B.groupAt[x] === A.groupAt[ja]);
      if (jb === undefined) return null; used.add(jb);
      if (!pairSub(A.C[k], ja, B.C[kb], jb)) return null;
    }
  }
  const ends = rev ? [[A.t0, B.tn], [A.tn, B.t0]] : [[A.t0, B.t0], [A.tn, B.tn]];
  for (const [ta, tb] of ends) { if (A.groupAt[ta] !== B.groupAt[tb]) return null; if (!pairSub(ta === A.t0 ? A.C[0] : A.C[m - 1], ta, tb === B.t0 ? B.C[0] : B.C[m - 1], tb)) return null; }
  return map;
}
export function fitOverlay(A, B) {
  let best = null;
  for (const rev of [false, true]) {
    const map = heavyMap(A, B, rev); if (!map) continue;
    const ia = Object.keys(map).map(Number).filter((i) => A.atoms[i].el !== 'H');
    const al = align(ia.map((i) => A.atoms[i].p), ia.map((i) => B.atoms[map[i]].p));
    const end = B.atoms.map((a) => V.add(al.rot(V.sub(a.p, al.cq)), al.cp));
    const match = {}; ia.forEach((i) => { match[map[i]] = i; });
    // H: pareamento guloso pelo mais próximo
    const hA = A.atoms.map((a, i) => i).filter((i) => A.atoms[i].el === 'H'), hB = B.atoms.map((a, i) => i).filter((i) => B.atoms[i].el === 'H');
    const cand = []; hB.forEach((b) => hA.forEach((a) => cand.push([V.len(V.sub(end[b], A.atoms[a].p)), b, a])));
    cand.sort((x, y) => x[0] - y[0]); const ub = new Set(), ua = new Set();
    cand.forEach(([d, b, a]) => { if (!ub.has(b) && !ua.has(a)) { ub.add(b); ua.add(a); match[b] = a; } });
    const dev = B.atoms.map((a, b) => (match[b] === undefined ? 9 : V.len(V.sub(end[b], A.atoms[match[b]].p))));
    const heavyDev = ia.map((i) => dev[map[i]]);
    const rmsd = Math.sqrt(heavyDev.reduce((s, d) => s + d * d, 0) / heavyDev.length);
    if (!best || rmsd < best.rmsd) best = { end, dev, rmsd, rev };
  }
  return best;
}
