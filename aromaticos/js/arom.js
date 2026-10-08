/*
 * arom.js — modelo de sistemas cíclicos conjugados:
 *   tipos de átomo do anel → orbital p, elétrons π, H, pares isolados
 *   análise por critérios (cíclico, planar, p em todos, conjugação, contagem π, Hückel)
 *   geometria 3D (anel plano, banheira do COT, sistemas fundidos)
 *   Hückel para anéis monocíclicos (energias, coeficientes, círculo de Frost)
 */
export const TYPES = {
  'C': { el: 'C', p: true, e: 1, H: 1, dbl: 1, t: 'C sp² (em C=C): 1 elétron π' },
  'C+': { el: 'C', p: true, e: 0, H: 1, dbl: 0, q: '+', t: 'carbocátion sp²: orbital p vazio (0 elétron π)' },
  'C-': { el: 'C', p: true, e: 2, H: 1, dbl: 0, q: '−', t: 'carbânion: par no orbital p (2 elétrons π)' },
  'C.': { el: 'C', p: true, e: 1, H: 1, dbl: 0, q: '•', t: 'radical: 1 elétron no orbital p' },
  'CH2': { el: 'C', p: false, e: 0, H: 2, dbl: 0, t: 'C sp³ (CH₂): sem orbital p — interrompe a conjugação' },
  'N': { el: 'N', p: true, e: 1, H: 0, dbl: 1, lp: ['in'], t: 'N tipo piridina: 1 elétron π; o par isolado fica em sp², no plano (fora do sistema π)' },
  'NH': { el: 'N', p: true, e: 2, H: 1, dbl: 0, lp: ['p'], t: 'N tipo pirrol: o par isolado ocupa o orbital p (2 elétrons π)' },
  'O': { el: 'O', p: true, e: 2, H: 0, dbl: 0, lp: ['p', 'in'], t: 'O tipo furano: um par no orbital p (2 elétrons π); o outro no plano' },
  'S': { el: 'S', p: true, e: 2, H: 0, dbl: 0, lp: ['p', 'in'], t: 'S tipo tiofeno: um par no orbital p (2 elétrons π); o outro no plano' },
};
export const TYPE_LABEL = { 'C': 'C (C=C)', 'C+': 'C⁺', 'C-': 'C⁻', 'C.': 'C•', 'CH2': 'CH₂ (sp³)', 'N': 'N (tipo piridina)', 'NH': 'NH (tipo pirrol)', 'O': 'O (tipo furano)', 'S': 'S (tipo tiofeno)' };

/* ---------- definição de moléculas ----------
 * mono(n, types, dbl[[i,j]]) → anel monocíclico
 * planar: true | false (COT banheira) ; open: cadeia aberta
 */
export function mono(types, dbl, extra = {}) {
  const n = types.length;
  return Object.assign({ n, types: types.slice(), dbl: dbl.map((d) => d.slice()), kind: 'mono' }, extra);
}
export const MOLS = {
  benzeno: mono(['C', 'C', 'C', 'C', 'C', 'C'], [[0, 1], [2, 3], [4, 5]], { name: 'benzeno', f: 'C₆H₆' }),
  ciclobutadieno: mono(['C', 'C', 'C', 'C'], [[0, 1], [2, 3]], { name: 'ciclobutadieno', f: 'C₄H₄' }),
  cot: mono(['C', 'C', 'C', 'C', 'C', 'C', 'C', 'C'], [[1, 2], [3, 4], [5, 6], [7, 0]], { name: 'ciclo-octatetraeno (COT)', f: 'C₈H₈' }),
  cot2: mono(['C-', 'C', 'C', 'C-', 'C', 'C', 'C', 'C'], [[1, 2], [4, 5], [6, 7]], { name: 'diânion do COT', f: 'C₈H₈²⁻' }),
  ciclopropenilio: mono(['C+', 'C', 'C'], [[1, 2]], { name: 'cátion ciclopropenílio', f: 'C₃H₃⁺' }),
  ciclopropenila: mono(['C-', 'C', 'C'], [[1, 2]], { name: 'ânion ciclopropenila', f: 'C₃H₃⁻' }),
  cp: mono(['C-', 'C', 'C', 'C', 'C'], [[1, 2], [3, 4]], { name: 'ânion ciclopentadienila', f: 'C₅H₅⁻' }),
  cpH: mono(['CH2', 'C', 'C', 'C', 'C'], [[1, 2], [3, 4]], { name: 'ciclopentadieno', f: 'C₅H₆' }),
  cpPlus: mono(['C+', 'C', 'C', 'C', 'C'], [[1, 2], [3, 4]], { name: 'cátion ciclopentadienila', f: 'C₅H₅⁺' }),
  cpRad: mono(['C.', 'C', 'C', 'C', 'C'], [[1, 2], [3, 4]], { name: 'radical ciclopentadienila', f: 'C₅H₅•' }),
  tropilio: mono(['C+', 'C', 'C', 'C', 'C', 'C', 'C'], [[1, 2], [3, 4], [5, 6]], { name: 'cátion tropílio (cicloeptatrienílio)', f: 'C₇H₇⁺' }),
  cicloheptatrieno: mono(['CH2', 'C', 'C', 'C', 'C', 'C', 'C'], [[1, 2], [3, 4], [5, 6]], { name: 'cicloeptatrieno', f: 'C₇H₈' }),
  heptatrienila: mono(['C-', 'C', 'C', 'C', 'C', 'C', 'C'], [[1, 2], [3, 4], [5, 6]], { name: 'ânion cicloeptatrienila', f: 'C₇H₇⁻' }),
  cicloexadieno: mono(['CH2', 'C', 'C', 'C', 'C', 'CH2'], [[1, 2], [3, 4]], { name: 'ciclo-hexa-1,3-dieno', f: 'C₆H₈' }),
  piridina: mono(['N', 'C', 'C', 'C', 'C', 'C'], [[0, 1], [2, 3], [4, 5]], { name: 'piridina', f: 'C₅H₅N' }),
  pirrol: mono(['NH', 'C', 'C', 'C', 'C'], [[1, 2], [3, 4]], { name: 'pirrol', f: 'C₄H₅N' }),
  furano: mono(['O', 'C', 'C', 'C', 'C'], [[1, 2], [3, 4]], { name: 'furano', f: 'C₄H₄O' }),
  tiofeno: mono(['S', 'C', 'C', 'C', 'C'], [[1, 2], [3, 4]], { name: 'tiofeno', f: 'C₄H₄S' }),
  pirimidina: mono(['N', 'C', 'N', 'C', 'C', 'C'], [[0, 1], [2, 3], [4, 5]], { name: 'pirimidina', f: 'C₄H₄N₂' }),
  imidazol: mono(['NH', 'C', 'N', 'C', 'C'], [[1, 2], [3, 4]], { name: 'imidazol', f: 'C₃H₄N₂' }),
  naftaleno: { kind: 'fused', centers: [[-1, 0], [1, 0]], name: 'naftaleno', f: 'C₁₀H₈' },
  antraceno: { kind: 'fused', centers: [[-2, 0], [0, 0], [2, 0]], name: 'antraceno', f: 'C₁₄H₁₀' },
  fenantreno: { kind: 'fused', centers: [[-1, 0], [1, 0], [2, 1.7320508]], name: 'fenantreno', f: 'C₁₄H₁₀' },
};
MOLS.cot.planar = false;
MOLS.cot2.draw = { mode: 'hybrid', centerCharge: '2−', lp: false };
export const LAB = ['benzeno', 'ciclobutadieno', 'cot', 'ciclopropenilio', 'cp', 'cpH', 'tropilio', 'piridina', 'pirrol', 'furano', 'tiofeno', 'naftaleno', 'antraceno', 'fenantreno', 'cot2', 'cpPlus'];

/* ===================================================================
 * Análise por critérios
 * =================================================================== */
export function analyze(def) {
  if (def.kind === 'fused') {
    const G = geometry(def);
    const e = G.atoms.filter((a) => a.el === 'C' && a.ring).length;
    return { cyclic: true, planar: true, allP: true, conj: true, e, valid: true, cls: 'arom', n: (e - 2) / 4, msgs: [`Sistema policíclico plano, todos os ${e} carbonos sp² com orbital p: ${e} elétrons π = 4(${(e - 2) / 4}) + 2.`, 'Em sistemas fundidos, a análise é qualitativa: a regra de Hückel foi formulada para anéis monocíclicos.'], fused: true };
  }
  const n = def.n, T = def.types.map((t) => TYPES[t]);
  const msgs = [], warn = [];
  // validade: átomos que exigem uma dupla
  const dcount = Array(n).fill(0);
  def.dbl.forEach(([a, b]) => { dcount[a]++; dcount[b]++; });
  let valid = true;
  T.forEach((t, i) => { if (dcount[i] !== t.dbl) { valid = false; warn.push(`Átomo ${i + 1} (${TYPE_LABEL[def.types[i]]}) ${t.dbl ? 'precisa participar de exatamente uma ligação dupla' : 'não pode participar de ligação dupla'}.`); } });
  def.dbl.forEach(([a, b]) => { if (Math.abs(a - b) !== 1 && Math.abs(a - b) !== n - 1) { valid = false; warn.push('Ligações duplas só entre átomos vizinhos no anel.'); } });
  const allP = T.every((t) => t.p);
  const breaks = T.map((t, i) => (t.p ? null : i + 1)).filter(Boolean);
  const e = T.reduce((s, t) => s + (t.p ? t.e : 0), 0);
  const odd = e % 2 === 1;
  const cyclic = !def.open;
  let planar = def.planar !== false;
  const forcedTub = n >= 8 && e % 4 === 0 && allP && cyclic;
  if (forcedTub) planar = false;
  const conj = cyclic && allP;
  let cls;
  if (!valid) cls = 'invalid';
  else if (!cyclic) { cls = 'non'; msgs.push('Não é cíclico: a regra de Hückel não se aplica a cadeias abertas.'); }
  else if (!allP) { cls = 'non'; msgs.push(`Conjugação interrompida: átomo(s) ${breaks.join(', ')} sp³ sem orbital p.`); }
  else if (!planar) { cls = 'non'; msgs.push(forcedTub ? `Com ${e} elétrons π (4n), um anel de ${n} membros escapa da antiaromaticidade dobrando-se (forma de banheira): os orbitais p deixam de ser paralelos → não aromático.` : 'Não planar: os orbitais p não ficam paralelos e a sobreposição contínua se perde.'); }
  else if (odd) { cls = 'radical'; msgs.push(`${e} elétrons π (número ímpar): espécie radicalar — a classificação simples por 4n+2/4n não se aplica diretamente.`); }
  else if (e % 4 === 2) { cls = 'arom'; msgs.push(`${e} elétrons π = 4(${(e - 2) / 4}) + 2 → satisfaz Hückel.`); }
  else { cls = 'anti'; msgs.push(`${e} elétrons π = 4(${e / 4}) → 4n: antiaromático se mantiver o anel plano e conjugado${n === 4 ? ' (o ciclobutadieno é altamente instável e distorce-se para um retângulo)' : ''}.`); }
  return { cyclic, planar, allP, conj, e, valid, cls, warn, msgs, breaks, forcedTub, n: e % 4 === 2 ? (e - 2) / 4 : e / 4 };
}
export const CLS = { arom: ['aromático', 'var(--green)'], anti: ['antiaromático', 'var(--red)'], non: ['não aromático', 'var(--dim)'], radical: ['radical (fora do escopo)', 'var(--yellow)'], invalid: ['estrutura inválida', 'var(--red)'] };

/* ===================================================================
 * Geometria (Å). Átomos: {el, p:[x,y,z], ring, type, pdir, lps:[{dir, inPi}], q}
 * =================================================================== */
const V = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul: (a, k) => [a[0] * k, a[1] * k, a[2] * k],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  norm: (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
};
export { V };
export function geometry(def, o = {}) {
  if (def.kind === 'fused') return fusedGeometry(def);
  const n = def.n, B = 1.4, R = B / (2 * Math.sin(Math.PI / n));
  const tw = o.twist ?? (def.planar === false || analyzeQuick(def) ? 0.55 : 0);
  const atoms = [], bonds = [];
  const sp3 = new Set(o.sp3 || []);
  for (let k = 0; k < n; k++) {
    const th = Math.PI / 2 + k * 2 * Math.PI / n, u = [Math.cos(th), Math.sin(th), 0];
    // deformação: banheira (alternância por par de átomos) ou torção genérica
    const z = tw ? tw * (n === 8 ? (Math.floor(((k + 1) % 8) / 2) % 2 ? 1 : -1) : Math.cos(2 * th + 0.3) ) : 0;
    const type = sp3.has(k) ? 'CH2' : def.types[k];
    atoms.push({ el: TYPES[type].el, p: [R * u[0], R * u[1], z], ring: true, type, u, idx: k });
  }
  for (let k = 0; k < n; k++) bonds.push([k, (k + 1) % n, 1]);
  def.dbl.forEach(([a, b]) => { if (sp3.has(a) || sp3.has(b)) return; const bb = bonds.find((x) => (x[0] === a && x[1] === b) || (x[0] === b && x[1] === a)); if (bb) bb[2] = 2; });
  // orbital p: normal ao plano local (vizinhos), orientado para +z
  atoms.forEach((a, k) => {
    const p0 = atoms[(k + n - 1) % n].p, p1 = atoms[(k + 1) % n].p;
    let nn = V.norm(V.cross(V.sub(p0, a.p), V.sub(p1, a.p)));
    if (nn[2] < 0) nn = V.mul(nn, -1);
    a.pdir = nn;
    a.out = V.norm(V.sub(a.p, V.mul(V.add(p0, p1), 0.5)));
  });
  // H e pares isolados
  const ringN = atoms.length;
  for (let k = 0; k < ringN; k++) {
    const a = atoms[k], T = TYPES[a.type];
    if (a.type === 'CH2') {
      [-1, 1].forEach((s) => { atoms.push({ el: 'H', p: V.add(a.p, V.add(V.mul(a.out, 0.62), V.mul(a.pdir, s * 0.89))) }); bonds.push([k, atoms.length - 1, 1]); });
    } else if (T.H) { atoms.push({ el: 'H', p: V.add(a.p, V.mul(a.out, a.el === 'N' ? 1.01 : 1.08)) }); bonds.push([k, atoms.length - 1, 1]); }
    if (o.sub && k === 0) { const hi = bonds.filter((b) => b[0] === 0).map((b) => b[1]).find((j) => atoms[j].el === 'H'); if (hi !== undefined) { const L = { Br: 1.9, Cl: 1.75, N: 1.47, S: 1.77, C: 1.51 }[o.sub] || 1.5; const d = V.norm(V.sub(atoms[hi].p, a.p)); atoms[hi].el = o.sub; atoms[hi].p = V.add(a.p, V.mul(d, L)); } }
    a.lps = (T.lp || []).map((d) => ({ dir: d === 'p' ? a.pdir : a.out, inPi: d === 'p' }));
    a.hasP = T.p && a.type !== 'CH2';
    a.e = T.p ? T.e : 0;
  }
  return { atoms, bonds, ringN, def };
}
function analyzeQuick(def) { const T = def.types.map((t) => TYPES[t]); const e = T.reduce((s, t) => s + (t.p ? t.e : 0), 0); return def.n >= 8 && e % 4 === 0 && T.every((t) => t.p); }
function fusedGeometry(def) {
  const B = 1.4, D = Math.sqrt(3) * B;
  const pts = [];
  def.centers.forEach(([cx, cy]) => {
    const c = [cx * D / 2, cy * D / 2];
    for (let k = 0; k < 6; k++) { const th = Math.PI / 6 + k * Math.PI / 3; const p = [c[0] + B * Math.cos(th), c[1] + B * Math.sin(th)]; if (!pts.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 0.2)) pts.push(p); }
  });
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  const atoms = pts.map((p) => ({ el: 'C', p: [p[0] - cx, p[1] - cy, 0], ring: true, type: 'C', pdir: [0, 0, 1], hasP: true, e: 1, lps: [] }));
  const bonds = [];
  for (let i = 0; i < atoms.length; i++) for (let j = i + 1; j < atoms.length; j++) if (Math.hypot(atoms[i].p[0] - atoms[j].p[0], atoms[i].p[1] - atoms[j].p[1]) < 1.5) bonds.push([i, j, 1]);
  // Kekulé (emparelhamento perfeito)
  const nb = atoms.map((_, i) => bonds.filter((b) => b[0] === i || b[1] === i));
  const used = new Set();
  const solve = (k) => { if (k === atoms.length) return true; if (used.has(k)) return solve(k + 1); for (const b of nb[k]) { const j = b[0] === k ? b[1] : b[0]; if (used.has(j)) continue; used.add(k); used.add(j); b[2] = 2; if (solve(k + 1)) return true; used.delete(k); used.delete(j); b[2] = 1; } return false; };
  solve(0);
  const ringN = atoms.length;
  for (let i = 0; i < ringN; i++) {
    const a = atoms[i], ns = nb[i].map((b) => (b[0] === i ? b[1] : b[0]));
    a.out = V.norm(V.mul(ns.reduce((s, j) => V.add(s, V.sub(atoms[j].p, a.p)), [0, 0, 0]), -1));
    if (ns.length === 2) { atoms.push({ el: 'H', p: V.add(a.p, V.mul(a.out, 1.08)) }); bonds.push([i, atoms.length - 1, 1]); }
  }
  const centers = def.centers.map(([x, y]) => [x * D / 2 - cx, y * D / 2 - cy]);
  return { atoms, bonds, ringN, def, centers };
}

/* ===================================================================
 * Hückel (anéis monocíclicos): E_k = α + 2β cos(2πk/n)
 * =================================================================== */
export function huckel(n) {
  const lv = [];
  for (let k = 0; k < n; k++) lv.push({ k, x: 2 * Math.cos(2 * Math.PI * k / n) }); // x em unidades de |β| (positivo = mais estável)
  lv.sort((a, b) => b.x - a.x);
  return lv;
}
/** preenchimento: devolve níveis agrupados com elétrons */
export function fillLevels(n, e) {
  const lv = huckel(n), groups = [];
  lv.forEach((l) => { const g = groups.find((x) => Math.abs(x.x - l.x) < 1e-6); if (g) g.ks.push(l.k); else groups.push({ x: l.x, ks: [l.k] }); });
  let left = e;
  groups.forEach((g) => {
    const cap = 2 * g.ks.length, take = Math.min(left, cap); left -= take;
    // Hund nos degenerados
    g.occ = g.ks.map(() => 0);
    for (let t = 0; t < take; t++) g.occ[t % g.ks.length] += 1;
    g.kind = g.x > 1e-6 ? 'ligante' : g.x < -1e-6 ? 'antiligante' : 'não ligante';
  });
  return groups;
}
/** coeficientes reais do OM k (combinações cos/sin para degenerados) */
export function coeffs(n, k, sinPart = false) {
  const c = [];
  for (let j = 0; j < n; j++) { const th = 2 * Math.PI * k * j / n; c.push(sinPart ? Math.sin(th) : Math.cos(th)); }
  const nrm = Math.hypot(...c) || 1;
  return c.map((x) => x / nrm);
}
/** OMs reais ordenados por energia: [{x, c, label}] */
export function realMOs(n) {
  const out = [];
  for (let k = 0; k <= Math.floor(n / 2); k++) {
    const x = 2 * Math.cos(2 * Math.PI * k / n);
    out.push({ x, c: coeffs(n, k), k });
    if (k !== 0 && !(n % 2 === 0 && k === n / 2)) out.push({ x, c: coeffs(n, k, true), k, s: true });
  }
  return out.sort((a, b) => b.x - a.x);
}
export const ENERGY = { cicloexeno: -120, dieno: -232, benzeno: -208, ciclohexatrieno: -360 };
