/*
 * namer.js — nomenclatura IUPAC (recomendações de 2013, em português) para
 * o escopo da aplicação: cadeias acíclicas, cicloalcanos e benzeno
 * monocíclicos, substituintes alquila simples, halo, nitro, alcóxi, hidroxi,
 * oxo, amino; funções principais: ácido, éster, amida, nitrila, aldeído,
 * cetona, álcool/fenol, amina.
 *
 * Escolha da cadeia principal (P-44): (1) máximo de grupos principais;
 * (2) anel é sênior à cadeia (2013); (3) maior cadeia; (4) mais ligações
 * múltiplas; (5) mais duplas; (6) menores localizadores do grupo principal;
 * (7) das ligações múltiplas; (8) das duplas; (9) mais substituintes;
 * (10) menores localizadores dos prefixos; (11) ordem alfabética.
 * Localizadores comparados termo a termo ("primeiro ponto de diferença").
 */
import { findFG, HALO, bondOrder } from './chem.js';

export const STEM = ['', 'met', 'et', 'prop', 'but', 'pent', 'hex', 'hept', 'oct', 'non', 'dec', 'undec', 'dodec'];
const MULT = ['', '', 'di', 'tri', 'tetra', 'penta', 'hexa'];
export const PRIO = ['acido', 'ester', 'amida', 'nitrila', 'aldeido', 'cetona', 'alcool', 'amina'];
export const PRIO_NAME = { acido: 'ácido carboxílico', ester: 'éster', amida: 'amida', nitrila: 'nitrila', aldeido: 'aldeído', cetona: 'cetona', alcool: 'álcool/fenol', amina: 'amina' };
const SUFFIX = { acido: 'oico', ester: 'oato', amida: 'amida', nitrila: 'nitrila', aldeido: 'al', cetona: 'ona', alcool: 'ol', amina: 'amina' };
const CINC = new Set(['acido', 'ester', 'amida', 'nitrila', 'aldeido']); // carbono do grupo faz parte da cadeia
const cls = (t) => (t === 'fenol' ? 'alcool' : t);

const cmpArr = (a, b) => { for (let i = 0; i < Math.max(a.length, b.length); i++) { const x = a[i] ?? Infinity, y = b[i] ?? Infinity; if (x !== y) return x - y; } return 0; };
const sortN = (a) => a.slice().sort((x, y) => x - y);

/* ===================================================================
 * Nome de substituintes (ramos ligados à estrutura principal)
 * =================================================================== */
function branchAtoms(m, root, from, block) {
  const seen = new Set([from, root, ...block]), out = [root], st = [root];
  while (st.length) { const a = st.pop(); m.nb[a].forEach(({ j }) => { if (!seen.has(j)) { seen.add(j); out.push(j); st.push(j); } }); }
  return out;
}
const ALKYL = {
  C: ['metil'], CC: ['etil'], CCC: ['propil'], 'C(C)C': ['propan-2-il', 'isopropil'], CCCC: ['butil'], 'C(C)CC': ['butan-2-il', 'sec-butil'],
  'CC(C)C': ['2-metilpropil', 'isobutil'], 'C(C)(C)C': ['terc-butil', '2-metilpropan-2-il', 't-butil'], CCCCC: ['pentil'], CCCCCC: ['hexil'], 'CCC(C)C': ['3-metilbutil', 'isopentil', 'isoamil'],
};
/** forma canônica simples de um ramo alquila a partir do átomo de ligação */
function alkylShape(m, root, from) {
  const rec = (a, p) => { const kids = m.nb[a].filter(({ j }) => j !== p && m.atoms[j].el === 'C').map(({ j }) => rec(j, a)).sort((x, y) => y.length - x.length || (x < y ? -1 : 1)); return 'C' + (kids.length > 1 ? kids.slice(1).map((k) => '(' + k + ')').join('') : '') + (kids[0] || ''); };
  // reordena para o formato da tabela: ramos curtos entre parênteses, cadeia principal depois
  const rec2 = (a, p) => { const kids = m.nb[a].filter(({ j }) => j !== p && m.atoms[j].el === 'C').map(({ j }) => rec2(j, a)).sort((x, y) => x.length - y.length || (x < y ? -1 : 1)); if (!kids.length) return 'C'; const main = kids.pop(); return 'C' + kids.map((k) => '(' + k + ')').join('') + main; };
  void rec;
  return rec2(root, from);
}
export function substituentName(m, root, from, block = []) {
  const A = m.atoms, a = A[root], atoms = branchAtoms(m, root, from, block);
  const o = bondOrder(m, root, from);
  if (HALO[a.el]) return { name: HALO[a.el], atoms };
  if (a.el === 'O' && o === 2) return { name: 'oxo', atoms };
  if (a.el === 'O' && atoms.length === 1) return { name: 'hidroxi', atoms };
  if (a.el === 'N' && m.nb[root].filter(({ j }) => A[j].el === 'O').length === 2) return { name: 'nitro', atoms };
  if (a.el === 'N' && atoms.length === 1) return { name: 'amino', atoms };
  if (a.el === 'O') { const c = m.nb[root].find(({ j }) => j !== from).j; const s = substituentName(m, c, root, block); if (!s) return null; const base = s.name === 'fenil' ? 'fen' : s.name.replace(/il$/, ''); const alias = (s.alias || []).map((x) => x.replace(/il$/, '') + 'oxi'); return { name: /\d/.test(base) ? base + 'iloxi' : base + 'oxi', alias, atoms }; }
  if (a.el !== 'C') return null;
  if (m.ringOf[root] >= 0) {
    const r = m.rings[m.ringOf[root]];
    if (atoms.length !== r.length || !r.every((x) => atoms.includes(x))) return null;
    return { name: r.aromatic ? 'fenil' : ('ciclo' + STEM[r.length] + 'il').replace('ciclohex', 'ciclo-hex'), atoms, hyph: r.length === 6 && !r.aromatic };
  }
  if (!atoms.every((x) => A[x].el === 'C' && m.ringOf[x] < 0)) return null;
  const sh = alkylShape(m, root, from), t = ALKYL[sh];
  if (!t) return null;
  return { name: t[0], alias: t.slice(1), atoms };
}

/* ===================================================================
 * Nomeação
 * =================================================================== */
export function nameMolecule(m) {
  const fgs = findFG(m);
  const princType = PRIO.find((p) => fgs.some((f) => cls(f.type) === p)) || null;
  const princ = fgs.filter((f) => cls(f.type) === princType);
  if (princType === 'ester') return nameEster(m, fgs, princ);
  const valid = rankParents(m, fgs, princType, princ);
  if (!valid.length) return { name: '?', ok: false };
  return assemble(m, valid[0], fgs, princType);
}
/** todos os candidatos válidos a estrutura principal, do melhor para o pior */
export function rankParents(m, fgs, princType, princ) {
  if (!fgs) { fgs = findFG(m); princType = PRIO.find((p) => fgs.some((f) => cls(f.type) === p)) || null; princ = fgs.filter((f) => cls(f.type) === princType); }
  const A = m.atoms;
  const princAtoms = new Set(princ.flatMap((f) => (CINC.has(princType) ? f.atoms.filter((x) => x !== f.site) : f.atoms)));
  const block = new Set(); // não entram na cadeia: carbonos de grupos C-incluídos não principais
  fgs.forEach((f) => { if (['acido', 'amida', 'nitrila', 'ester'].includes(cls(f.type)) && cls(f.type) !== princType) block.add(f.site); });

  /* ---------- candidatos: cadeias ---------- */
  const isChainC = (i) => A[i].el === 'C' && m.ringOf[i] < 0 && !block.has(i);
  const cands = [];
  const chainCs = A.map((_, i) => i).filter(isChainC);
  const paths = [];
  chainCs.forEach((s) => {
    const st = [[s]];
    while (st.length) { const p = st.pop(); paths.push(p); const last = p[p.length - 1]; m.nb[last].forEach(({ j }) => { if (isChainC(j) && !p.includes(j)) st.push(p.concat([j])); }); }
  });
  paths.forEach((p) => { if (p.length === 1 || p[0] < p[p.length - 1]) { cands.push({ type: 'chain', atoms: p }); if (p.length > 1) cands.push({ type: 'chain', atoms: p.slice().reverse() }); } });
  /* ---------- candidatos: anéis ---------- */
  m.rings.forEach((r) => {
    if (!r.every((x) => A[x].el === 'C')) return;
    const n = r.length;
    for (let s = 0; s < n; s++) for (const d of [1, -1]) cands.push({ type: 'ring', ring: r, atoms: Array.from({ length: n }, (_, k) => r[((s + d * k) % n + n) % n]) });
  });
  /* ---------- avalia cada candidato ---------- */
  const evals = cands.map((c) => evaluate(m, c, fgs, princType, princ, princAtoms));
  const valid = evals.filter((e) => e.ok);
  valid.sort(compareEval);
  return valid;
}
/** primeiro critério em que a é melhor que b (para feedback) */
export const CRIT = [
  ['nPrinc', 'contém o maior número de grupos da função principal'],
  ['ring', 'anel tem prioridade sobre cadeia (IUPAC 2013)'],
  ['len', 'é mais longa'],
  ['nml', 'contém mais ligações múltiplas'],
  ['ndl', 'contém mais ligações duplas'],
  ['pl', 'dá menores localizadores ao grupo principal'],
  ['ml', 'dá menores localizadores às ligações múltiplas'],
  ['dl', 'dá menores localizadores às ligações duplas'],
  ['nsub', 'tem mais substituintes'],
  ['sl', 'dá menores localizadores aos substituintes'],
  ['al', 'dá o menor localizador ao substituinte citado primeiro em ordem alfabética'],
];
export function whyBetter(a, b) {
  const tests = [
    () => b.nPrinc - a.nPrinc, () => ((a.cand.type === 'ring') !== (b.cand.type === 'ring') ? (a.cand.type === 'ring' ? -1 : 1) : 0), () => b.P.length - a.P.length,
    () => b.ml.length - a.ml.length, () => b.dl.length - a.dl.length, () => cmpArr(a.pl, b.pl), () => cmpArr(a.ml, b.ml), () => cmpArr(a.dl, b.dl),
    () => (b.subs.length + b.nsubs.length) - (a.subs.length + a.nsubs.length), () => cmpArr(a.sl, b.sl), () => cmpArr(a.al, b.al),
  ];
  for (let k = 0; k < tests.length; k++) { const d = tests[k](); if (d) return { k, key: CRIT[k][0], txt: CRIT[k][1], better: d < 0 }; }
  return null;
}
export { cmpArr };

function evaluate(m, cand, fgs, princType, princ, princAtoms) {
  const A = m.atoms, P = cand.atoms, set = new Set(P), loc = (i) => P.indexOf(i) + 1;
  const e = { cand, ok: true, P, set };
  // grupos principais na estrutura
  const pl = [];
  princ.forEach((f) => {
    let site = f.site;
    if (princType === 'amina') { const s = f.cs.find((x) => set.has(x)); if (s === undefined) return; site = s; }
    if (cand.type === 'chain') {
      if (!set.has(site)) return;
      if (princType === 'cetona' && (site === P[0] || site === P[P.length - 1]) && P.length > 1 && m.nb[site].some(({ j }) => A[j].el === 'C' && !set.has(j) && m.ringOf[j] < 0)) return;
      if (CINC.has(princType) && site !== P[0] && site !== P[P.length - 1]) return;
      pl.push(loc(site));
    } else {
      if (CINC.has(princType)) { const att = m.nb[site].find(({ j }) => set.has(j)); if (!att) return; pl.push(loc(att.j)); }
      else if (set.has(site)) pl.push(loc(site));
    }
  });
  e.nPrinc = pl.length; e.pl = sortN(pl);
  const sufAtoms = new Set();
  princ.forEach((f) => { const on = princType === 'amina' ? f.cs.some((x) => set.has(x)) : cand.type === 'ring' && CINC.has(princType) ? m.nb[f.site].some(({ j }) => set.has(j)) : set.has(f.site); if (on) f.atoms.forEach((x) => { if (!set.has(x)) sufAtoms.add(x); }); });
  if (princType && !pl.length && cand.type === 'chain' && princ.length && P.length >= 1) { /* cadeia sem grupo principal ainda é candidata */ }
  // ligações múltiplas na cadeia
  const ml = [], dl = [], tl = [];
  for (let k = 0; k < P.length - (cand.type === 'chain' ? 1 : 0); k++) {
    const a = P[k], b = P[(k + 1) % P.length], o = bondOrder(m, a, b);
    if (cand.type === 'ring' && cand.ring.aromatic) continue;
    if (o >= 2) { const l = k + 1; ml.push(l); (o === 2 ? dl : tl).push(l); }
  }
  e.ml = sortN(ml); e.dl = sortN(dl); e.tl = sortN(tl);
  // substituintes
  const subs = [], nsubs = [];
  P.forEach((p) => {
    m.nb[p].forEach(({ j }) => {
      if (set.has(j)) return;
      if (princType === 'amina' && princ.some((f) => f.atoms[0] === j)) {
        // substituintes no N
        m.nb[j].forEach(({ j: q }) => { if (q === p) return; const s = substituentName(m, q, j); if (!s) { e.ok = false; return; } nsubs.push(Object.assign({ loc: 'N', root: q }, s)); });
        return;
      }
      if (sufAtoms.has(j)) return;
      const s = substituentName(m, j, p, [...set]);
      if (!s) { e.ok = false; return; }
      subs.push(Object.assign({ loc: loc(p), root: j, on: p }, s));
    });
  });
  if (princType === 'amida' && cand.type === 'chain') princ.forEach((f) => { if (!set.has(f.site)) return; m.nb[f.n].forEach(({ j: q }) => { if (q === f.site) return; const s = substituentName(m, q, f.n); if (!s) { e.ok = false; return; } nsubs.push(Object.assign({ loc: 'N', root: q }, s)); }); });
  e.subs = subs; e.nsubs = nsubs;
  e.sl = sortN(subs.map((s) => s.loc));
  const alpha = subs.slice().sort((x, y) => alphaKey(x.name).localeCompare(alphaKey(y.name), 'pt') || x.loc - y.loc);
  e.al = alpha.map((s) => s.loc);
  return e;
}
const alphaKey = (n) => n.replace(/^\(|\)$/g, '').replace(/^(\d+,?)*-/, '').replace(/^(sec-|terc-|t-)/, '');
function compareEval(a, b) {
  return (b.nPrinc - a.nPrinc)
    || ((a.cand.type === 'ring') !== (b.cand.type === 'ring') ? (a.cand.type === 'ring' ? -1 : 1) : 0)
    || (b.P.length - a.P.length)
    || (b.ml.length - a.ml.length) || (b.dl.length - a.dl.length)
    || cmpArr(a.pl, b.pl) || cmpArr(a.ml, b.ml) || cmpArr(a.dl, b.dl)
    || ((b.subs.length + b.nsubs.length) - (a.subs.length + a.nsubs.length))
    || cmpArr(a.sl, b.sl) || cmpArr(a.al, b.al);
}

/* ===================================================================
 * Montagem do nome
 * =================================================================== */
function prefixString(subs, omitLoc) {
  const g = {};
  subs.forEach((s) => { const key = s.name; (g[key] = g[key] || { name: s.name, locs: [], alias: s.alias, hyph: s.hyph }).locs.push(s.loc); });
  const groups = Object.values(g).sort((x, y) => alphaKey(x.name).localeCompare(alphaKey(y.name), 'pt'));
  return groups.map((x) => {
    const locs = x.locs.slice().sort((p, q) => (p === 'N' ? -1 : q === 'N' ? 1 : p - q));
    const complex = /\d/.test(x.name);
    const mult = MULT[x.locs.length];
    const nm = (complex ? (x.locs.length > 1 ? ['', '', 'bis', 'tris'][x.locs.length] : '') + '(' + x.name + ')' : mult + (mult && /^h/.test(x.name) ? '-' : '') + x.name);
    return (omitLoc && !locs.includes('N') ? '' : locs.join(',') + '-') + nm;
  });
}
function joinParts(prefixes, parent) {
  let s = '';
  prefixes.forEach((p, k) => { s += (k ? '-' : '') + p; });
  if (!s) return parent;
  return s + (/^[h0-9]/.test(parent) || /\)$/.test(s) && /^[a-z]/.test(parent) && false ? '-' : '') + parent;
}
const vowelStart = (x) => /^[aeiou]/.test(x);

function assemble(m, best, fgs, princType) {
  const P = best.P, n = P.length, isRing = best.cand.type === 'ring', arom = isRing && best.cand.ring.aromatic;
  const subs = best.subs, nsubs = best.nsubs;
  const allSubs = subs.concat(nsubs);
  let parentName, suffixTxt = '', acid = false, stemTxt = '', infixTxt = '';
  const nP = best.pl.length;
  // omissão de localizadores
  const totalThings = subs.length + nP + best.ml.length;
  let omit = false;
  if (!isRing && n === 1) omit = true;
  if (!isRing && n === 2 && totalThings === 1) omit = true;
  if (!isRing && n === 2 && best.ml.length === 1 && allSubs.length + nP <= 1) omit = true;
  if (!isRing && n === 2 && CINC.has(princType) && nP === 1 && best.ml.length === 0) omit = true;
  if (isRing && totalThings === 1) omit = true;
  if (isRing && !arom && best.ml.length === 1 && allSubs.length + nP === 0) omit = true;
  const L = (arr) => (omit ? '' : arr.join(','));

  if (arom) {
    const RET = { acido: 'ácido benzoico', aldeido: 'benzaldeído', nitrila: 'benzonitrila', amida: 'benzamida', alcool: 'fenol', amina: 'anilina' };
    parentName = nP ? RET[princType] : 'benzeno';
    stemTxt = parentName;
    if (nP && nP > 1) return { ok: false, name: '?' };
  } else {
    const stem = (isRing ? 'ciclo' : '') + STEM[n];
    const nd = best.dl.length, nt = best.tl.length, hasMult = nd + nt > 0;
    let unsat = '';
    if (!hasMult) unsat = 'an';
    else {
      const part = [];
      const locOmitRing = isRing && omit;
      if (nd) part.push((locOmitRing || (omit && !isRing) ? '' : '-' + best.dl.join(',') + '-') + MULT[nd] + 'en');
      if (nt) part.push((omit ? '' : '-' + best.tl.join(',') + '-') + MULT[nt] + 'in');
      unsat = ((nd > 1 || nt > 1) ? 'a' : '') + part.join('');
    }
    stemTxt = stem; infixTxt = unsat;
    let suf = '';
    if (princType) {
      const sfx = SUFFIX[princType];
      if (isRing && CINC.has(princType)) {
        const RS = { acido: 'carboxílico', aldeido: 'carbaldeído', nitrila: 'carbonitrila', amida: 'carboxamida' };
        suf = (nP > 1 ? MULT[nP] : '') + RS[princType]; acid = princType === 'acido';
        const locs = L(best.pl);
        suf = (locs ? '-' + locs + '-' : '') + suf;
        parentName = stem + unsat + 'o' + suf;
      } else {
        const locs = CINC.has(princType) ? '' : L(best.pl);
        const core = (nP > 1 ? MULT[nP] : '') + sfx;
        acid = princType === 'acido';
        if (princType === 'acido' && nP > 1) suf = 'dioico'; else suf = core;
        const body = (locs ? '-' + locs + '-' : '') + suf;
        // vogal de ligação: mantém "o" diante de consoante (di-, tri-, nitrila)
        const keepO = !vowelStart(suf);
        const base = stem + unsat + (keepO ? 'o' : '');
        parentName = base + body;
      }
      suffixTxt = suf;
    } else parentName = stem + unsat + 'o';
    if (hasMult && !princType && !omit) { /* ex.: but-1-eno */ }
  }
  parentName = parentName.replace(/^ciclohex/, 'ciclo-hex');
  const pre = prefixString(allSubs, omit);
  let name = '';
  pre.forEach((p, k) => { name += (k ? '-' : '') + p; });
  if (name) name += /^h/.test(parentName.replace(/^ácido /, '')) && !/\)$/.test(name) ? '-' : '';
  let full = name + parentName.replace(/^ácido /, '');
  if (acid || /^ácido /.test(parentName)) full = 'ácido ' + full;
  full = full.replace(/-(\d)/g, '-$1');
  const res = { ok: true, name: full, princType, parent: best, fgs, subs, nsubs, isRing, arom, omit, parts: { stem: stemTxt, infix: infixTxt, suffix: suffixTxt, prefixes: pre } };
  res.aliases = aliasesOf(res);
  return res;
}

/* ---------- ésteres: "…oato de alquila" ---------- */
function nameEster(m, fgs, princ) {
  if (princ.length !== 1) return { ok: false, name: '?' };
  const f = princ[0];
  const alk = substituentName(m, f.alkC, f.oAlk);
  if (!alk) return { ok: false, name: '?' };
  // parte ácida: trata como ácido trocando o O–alquila por O–H virtual
  const fake = JSON.parse(JSON.stringify({ atoms: m.atoms, bonds: m.bonds }));
  const keep = new Set(alk.atoms);
  const atoms = [], map = {};
  m.atoms.forEach((a, i) => { if (keep.has(i)) return; map[i] = atoms.length; atoms.push({ el: a.el, charge: a.charge, hx: i === f.oAlk ? 1 : a.h }); });
  const bonds = m.bonds.filter((b) => !keep.has(b.a) && !keep.has(b.b)).map((b) => ({ a: map[b.a], b: map[b.b], o: b.o }));
  void fake;
  const acidMol = fromGraphLite(atoms, bonds);
  const r = nameMolecule(acidMol);
  if (!r.ok) return r;
  const acyl = r.name.replace(/^ácido /, '').replace(/oico$/, 'oato').replace(/ico$/, 'ato').replace(/benzoato$/, 'benzoato').replace(/carboxílico$/, 'carboxilato');
  const alkName = /\d/.test(alk.name) ? alk.name + 'a' : alk.name + 'a';
  const name = `${acyl} de ${alkName}`;
  const res = Object.assign({}, r, { name, princType: 'ester', ester: { acylAtoms: m.atoms.map((_, i) => i).filter((i) => !keep.has(i)), alkylAtoms: alk.atoms, alkName, acyl, o: f.oAlk } });
  // remapeia a cadeia para os índices originais
  const inv = {}; Object.entries(map).forEach(([o, nI]) => { inv[nI] = +o; });
  res.parent = Object.assign({}, r.parent, { P: r.parent.P.map((x) => inv[x]) });
  res.subs = r.subs.map((s) => Object.assign({}, s, { root: inv[s.root], on: inv[s.on], atoms: s.atoms.map((x) => inv[x]) }));
  res.fgs = findFG(m);
  res.aliases = (alk.alias || []).map((a) => `${acyl} de ${a}a`).concat(r.aliases.map((x) => x.replace(/^ácido /, '').replace(/oico$/, 'oato') + ` de ${alkName}`));
  return res;
}
import { fromGraph as fromGraphLite } from './chem.js';

/* ---------- variantes aceitas ---------- */
function aliasesOf(r) {
  const out = new Set();
  const n = r.name;
  out.add(n.replace(/([a-z])-h/g, '$1h'));
  out.add(n.replace(/ciclo-hex/g, 'cicloex'));
  out.add(n.replace(/ciclo-hex/g, 'ciclohex').replace(/([a-z])-h/g, '$1h'));
  r.subs.concat(r.nsubs || []).forEach((s) => (s.alias || []).forEach((a) => { out.add(n.replace(s.name, a)); out.add(n.replace('(' + s.name + ')', a)); }));
  if (/^prop(an-2-ona|-1-eno|-1-ino)$/.test(n)) out.add({ 'propan-2-ona': 'propanona', 'prop-1-eno': 'propeno', 'prop-1-ino': 'propino' }[n]);
  if (n === 'anilina') out.add('benzenamina');
  if (r.omit && !r.isRing && r.parent.P.length === 2 && CINC.has(r.princType)) r.subs.forEach((x) => out.add(n.replace(x.name, '2-' + x.name)));
  out.delete(n);
  return [...out];
}

/* ===================================================================
 * Normalização para comparar nomes digitados
 * =================================================================== */
export const normName = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').replace(/\s*-\s*/g, '-').replace(/\s*,\s*/g, ',').trim();
export function nameMatches(r, typed) { const t = normName(typed); return [r.name, ...(r.aliases || [])].some((x) => normName(x) === t); }
