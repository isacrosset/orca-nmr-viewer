/*
 * chem.js — núcleo químico sem dependências gráficas:
 * leitura de SMILES (subconjunto), hidrogênios implícitos, kekulização,
 * anéis, grupos funcionais, fórmula molecular, valência e comparação de
 * estruturas (isomorfismo de grafos).
 */
export const VAL = { C: 4, N: 3, O: 2, S: 2, F: 1, Cl: 1, Br: 1, I: 1, B: 3 };
export const HALO = { F: 'fluoro', Cl: 'cloro', Br: 'bromo', I: 'iodo' };

/* ===================================================================
 * SMILES (subconjunto: C N O S F Cl Br I, aromáticos c n o, [N+] [O-],
 * ramificações, ligações = #, fechamento de anéis 1–9)
 * =================================================================== */
export function parseSmiles(smi) {
  const atoms = [], bonds = [];
  let prev = null, bondOrder = 1;
  const stack = [], rings = {};
  let i = 0;
  const addBond = (a, b, o, arom) => bonds.push({ a, b, o, arom: !!arom });
  while (i < smi.length) {
    const ch = smi[i];
    if (ch === '(') { stack.push(prev); i++; continue; }
    if (ch === ')') { prev = stack.pop(); i++; continue; }
    if (ch === '=') { bondOrder = 2; i++; continue; }
    if (ch === '#') { bondOrder = 3; i++; continue; }
    if (ch === '-') { bondOrder = 1; i++; continue; }
    if (/\d/.test(ch)) {
      const n = ch;
      if (rings[n] !== undefined) { const [a, o] = rings[n]; const arom = atoms[a].arom && atoms[prev].arom && bondOrder === 1 && o === 1; addBond(a, prev, Math.max(o, bondOrder), arom); delete rings[n]; }
      else rings[n] = [prev, bondOrder];
      bondOrder = 1; i++; continue;
    }
    let el, arom = false, charge = 0, hx = null;
    if (ch === '[') {
      const j = smi.indexOf(']', i); const body = smi.slice(i + 1, j);
      const m = /^([A-Z][a-z]?|[cnos])(H\d?)?([+-])?$/.exec(body);
      el = m[1]; if (/^[cnos]$/.test(el)) { arom = true; el = el.toUpperCase(); }
      if (m[2]) hx = m[2].length > 1 ? +m[2][1] : 1; else hx = 0;
      if (m[3]) charge = m[3] === '+' ? 1 : -1;
      i = j + 1;
    } else if (smi.startsWith('Cl', i) || smi.startsWith('Br', i)) { el = smi.slice(i, i + 2); i += 2; }
    else if (/[cnos]/.test(ch)) { el = ch.toUpperCase(); arom = true; i++; }
    else { el = ch; i++; }
    const idx = atoms.length;
    atoms.push({ el, arom, charge, hx });
    if (prev !== null) addBond(prev, idx, bondOrder, arom && atoms[prev].arom && bondOrder === 1);
    prev = idx; bondOrder = 1;
  }
  const m = { atoms, bonds };
  kekulize(m);
  finish(m);
  return m;
}
/** aromático → ligações simples/duplas alternadas (emparelhamento perfeito) */
function kekulize(m) {
  const ab = m.bonds.filter((b) => b.arom);
  if (!ab.length) return;
  const aromAtoms = [...new Set(ab.flatMap((b) => [b.a, b.b]))];
  const used = new Set();
  const adj = {}; ab.forEach((b, k) => { (adj[b.a] = adj[b.a] || []).push([b.b, k]); (adj[b.b] = adj[b.b] || []).push([b.a, k]); });
  const need = aromAtoms.filter((a) => m.atoms[a].el === 'C' || (m.atoms[a].el === 'N' && m.atoms[a].hx === 0 && !m.atoms[a].charge));
  const dbl = new Set();
  const solve = (k) => {
    if (k === need.length) return true;
    const a = need[k];
    if (used.has(a)) return solve(k + 1);
    for (const [b, bi] of adj[a]) {
      if (used.has(b) || !need.includes(b)) continue;
      used.add(a); used.add(b); dbl.add(bi);
      if (solve(k + 1)) return true;
      used.delete(a); used.delete(b); dbl.delete(bi);
    }
    return false;
  };
  solve(0);
  ab.forEach((b, k) => { b.o = dbl.has(k) ? 2 : 1; });
}
function finish(m) {
  const n = m.atoms.length;
  m.nb = Array.from({ length: n }, () => []);
  m.bonds.forEach((b, k) => { m.nb[b.a].push({ j: b.b, o: b.o, k }); m.nb[b.b].push({ j: b.a, o: b.o, k }); });
  m.atoms.forEach((a, i) => {
    const used = m.nb[i].reduce((s, x) => s + x.o, 0);
    if (a.hx !== null && a.hx !== undefined) a.h = a.hx;
    else a.h = Math.max(0, (VAL[a.el] || 0) + (a.el === 'N' && a.charge > 0 ? 1 : 0) - used);
  });
  m.rings = findRings(m);
  m.ringOf = Array.from({ length: n }, () => -1);
  m.rings.forEach((r, k) => r.forEach((a) => { m.ringOf[a] = k; }));
  m.atoms.forEach((a, i) => { a.aromatic = a.arom || false; });
  m.rings.forEach((r) => { const ar = r.length === 6 && r.every((a) => m.atoms[a].el === 'C') && r.filter((a, k) => bondOrder(m, a, r[(k + 1) % r.length]) === 2).length === 3; if (ar) r.forEach((a) => { m.atoms[a].aromatic = true; }); r.aromatic = ar; });
}
export function bondOrder(m, a, b) { const x = m.nb[a].find((y) => y.j === b); return x ? x.o : 0; }
/** anéis simples (sistemas não fundidos): ciclos via DFS de árvore geradora */
function findRings(m) {
  const n = m.atoms.length, parent = new Array(n).fill(-1), depth = new Array(n).fill(-1), rings = [];
  const dfs = (u, p) => {
    for (const { j: v } of m.nb[u]) {
      if (v === p) continue;
      if (depth[v] === -1) { depth[v] = depth[u] + 1; parent[v] = u; dfs(v, u); }
      else if (depth[v] < depth[u]) { const r = [u]; let x = u; while (x !== v) { x = parent[x]; r.push(x); } rings.push(r); }
    }
  };
  for (let s = 0; s < n; s++) if (depth[s] === -1) { depth[s] = 0; dfs(s, -1); }
  return rings;
}

/* ===================================================================
 * Fórmula molecular, valência
 * =================================================================== */
export function formula(m) {
  const c = {}; m.atoms.forEach((a) => { c[a.el] = (c[a.el] || 0) + 1; c.H = (c.H || 0) + a.h; });
  const sub = (x) => (x > 1 ? String(x).replace(/\d/g, (d) => '₀₁₂₃₄₅₆₇₈₉'[d]) : '');
  const order = ['C', 'H'].concat(Object.keys(c).filter((k) => k !== 'C' && k !== 'H').sort());
  const net = m.atoms.reduce((s, a) => s + (a.charge || 0), 0);
  return order.filter((k) => c[k]).map((k) => k + sub(c[k])).join('') + (net ? (net > 0 ? '⁺' : '⁻') : '');
}
export function heavyCount(m, el) { return m.atoms.filter((a) => a.el === el).length; }

/* ===================================================================
 * Grupos funcionais
 * type: acido, ester, amida, nitrila, aldeido, cetona, alcool, fenol,
 *       amina, eter, nitro, haleto, alceno, alcino, aromatico
 * site: carbono que "carrega" a função (para numeração)
 * =================================================================== */
export const FG_INFO = {
  acido: { n: 'ácido carboxílico', g: '–COOH', c: 'fg-acid' }, ester: { n: 'éster', g: '–COO–', c: 'fg-ester' }, amida: { n: 'amida', g: '–CONH₂', c: 'fg-amide' },
  nitrila: { n: 'nitrila', g: '–C≡N', c: 'fg-nitrile' }, aldeido: { n: 'aldeído', g: '–CHO', c: 'fg-ald' }, cetona: { n: 'cetona', g: '>C=O', c: 'fg-ket' },
  alcool: { n: 'álcool', g: '–OH (C sp³)', c: 'fg-oh' }, fenol: { n: 'fenol', g: 'Ar–OH', c: 'fg-phenol' }, amina: { n: 'amina', g: '–NH₂, –NHR, –NR₂', c: 'fg-amine' },
  eter: { n: 'éter', g: '–O–', c: 'fg-ether' }, nitro: { n: 'nitrocomposto', g: '–NO₂', c: 'fg-nitro' }, haleto: { n: 'haleto orgânico', g: '–X', c: 'fg-hal' },
  alceno: { n: 'alceno', g: 'C=C', c: 'fg-ene' }, alcino: { n: 'alcino', g: 'C≡C', c: 'fg-yne' }, aromatico: { n: 'aromático', g: 'anel benzênico', c: 'fg-arom' },
};
export function findFG(m) {
  const fg = [], A = m.atoms, isC = (i) => A[i].el === 'C';
  const dO = (c) => m.nb[c].find((x) => A[x.j].el === 'O' && x.o === 2);
  const taken = new Set();
  A.forEach((a, c) => {
    if (a.el !== 'C') return;
    const o2 = dO(c);
    if (o2) {
      const sO = m.nb[c].filter((x) => A[x.j].el === 'O' && x.o === 1).map((x) => x.j);
      const nN = m.nb[c].filter((x) => A[x.j].el === 'N' && x.o === 1).map((x) => x.j);
      const cC = m.nb[c].filter((x) => isC(x.j)).length;
      if (sO.length && A[sO[0]].h > 0) { fg.push({ type: 'acido', atoms: [c, o2.j, sO[0]], site: c }); [o2.j, sO[0]].forEach((x) => taken.add(x)); }
      else if (sO.length) { const alk = m.nb[sO[0]].find((x) => x.j !== c).j; fg.push({ type: 'ester', atoms: [c, o2.j, sO[0]], site: c, oAlk: sO[0], alkC: alk }); [o2.j, sO[0]].forEach((x) => taken.add(x)); }
      else if (nN.length) { fg.push({ type: 'amida', atoms: [c, o2.j, nN[0]], site: c, n: nN[0] }); taken.add(o2.j); taken.add(nN[0]); }
      else if (a.h >= 1) { fg.push({ type: 'aldeido', atoms: [c, o2.j], site: c }); taken.add(o2.j); }
      else if (cC === 2) { fg.push({ type: 'cetona', atoms: [c, o2.j], site: c }); taken.add(o2.j); }
    }
    const tn = m.nb[c].find((x) => A[x.j].el === 'N' && x.o === 3);
    if (tn) { fg.push({ type: 'nitrila', atoms: [c, tn.j], site: c }); taken.add(tn.j); }
  });
  A.forEach((a, i) => {
    if (taken.has(i)) return;
    if (a.el === 'O' && !a.charge) {
      const cs = m.nb[i].filter((x) => isC(x.j)).map((x) => x.j);
      if (cs.length === 1 && a.h === 1 && m.nb[i][0].o === 1) fg.push({ type: A[cs[0]].aromatic ? 'fenol' : 'alcool', atoms: [i], site: cs[0] });
      else if (cs.length === 2) fg.push({ type: 'eter', atoms: [i], site: cs[0], cs });
    }
    if (a.el === 'N') {
      const os = m.nb[i].filter((x) => A[x.j].el === 'O');
      if (os.length === 2) { fg.push({ type: 'nitro', atoms: [i, ...os.map((x) => x.j)], site: m.nb[i].find((x) => isC(x.j)).j }); return; }
      if (m.nb[i].every((x) => x.o === 1) && !a.charge) { const cs = m.nb[i].filter((x) => isC(x.j)).map((x) => x.j); fg.push({ type: 'amina', atoms: [i], site: cs[0], cs }); }
    }
    if (HALO[a.el]) fg.push({ type: 'haleto', atoms: [i], site: m.nb[i][0].j });
  });
  m.bonds.forEach((b) => {
    if (!isC(b.a) || !isC(b.b) || A[b.a].aromatic && A[b.b].aromatic) return;
    if (b.o === 2) fg.push({ type: 'alceno', atoms: [b.a, b.b], site: b.a });
    if (b.o === 3) fg.push({ type: 'alcino', atoms: [b.a, b.b], site: b.a });
  });
  m.rings.forEach((r) => { if (r.aromatic) fg.push({ type: 'aromatico', atoms: r.slice(), site: r[0] }); });
  return fg;
}
/** funções "de verdade" (sem C=C, C≡C, anel) */
export const FUNCTIONS = ['acido', 'ester', 'amida', 'nitrila', 'aldeido', 'cetona', 'alcool', 'fenol', 'amina', 'eter', 'nitro', 'haleto'];

/* ===================================================================
 * Valência (para o construtor)
 * =================================================================== */
export function valenceIssues(m) {
  const out = [];
  m.atoms.forEach((a, i) => {
    const used = m.nb[i].reduce((s, x) => s + x.o, 0);
    const max = (VAL[a.el] || 4) + (a.charge > 0 && a.el === 'N' ? 1 : 0) + (a.charge < 0 && a.el === 'O' ? -1 : 0);
    if (used > max) out.push({ i, msg: `${a.el} com ${used} ligações: o ${a.el === 'C' ? 'carbono faz no máximo 4' : a.el === 'O' ? 'oxigênio neutro faz 2' : a.el === 'N' ? 'nitrogênio neutro faz 3' : a.el + ' faz 1'} ligações.` });
  });
  return out;
}

/* ===================================================================
 * Isomorfismo (mesma conectividade?)
 * =================================================================== */
function inv(m) {
  // invariantes iterados (Morgan) para podar o backtracking
  let lab = m.atoms.map((a, i) => `${a.el}${a.h}${a.charge}|${m.nb[i].map((x) => x.o).sort().join('')}`);
  for (let it = 0; it < 4; it++) lab = lab.map((l, i) => l + '[' + m.nb[i].map((x) => lab[x.j] + x.o).sort().join(',') + ']');
  return lab;
}
export function sameMolecule(A, B) {
  if (A.atoms.length !== B.atoms.length || A.bonds.length !== B.bonds.length || formula(A) !== formula(B)) return false;
  const la = inv(A), lb = inv(B);
  if (la.slice().sort().join() !== lb.slice().sort().join()) return false;
  const n = A.atoms.length, map = new Array(n).fill(-1), used = new Array(n).fill(false);
  const order = [...Array(n).keys()];
  const rec = (k) => {
    if (k === n) return true;
    const a = order[k];
    for (let b = 0; b < n; b++) {
      if (used[b] || la[a] !== lb[b]) continue;
      if (!A.nb[a].every((x) => map[x.j] === -1 || bondOrder(B, b, map[x.j]) === x.o)) continue;
      map[a] = b; used[b] = true;
      if (rec(k + 1)) return true;
      map[a] = -1; used[b] = false;
    }
    return false;
  };
  return rec(0);
}
/** cria molécula a partir de átomos/ligações explícitos (construtor) */
export function fromGraph(atoms, bonds) {
  const m = { atoms: atoms.map((a) => ({ el: a.el, arom: false, charge: a.charge || 0, hx: a.hx === undefined ? null : a.hx })), bonds: bonds.map((b) => ({ a: b.a, b: b.b, o: b.o, arom: false })) };
  finish(m);
  return m;
}
