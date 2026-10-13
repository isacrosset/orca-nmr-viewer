/*
 * conf.js — núcleo químico: (1) "rotor" C–C com substituintes na frente e
 * atrás (geometria 3D, ângulos de Newman, energia torsional/estérica
 * qualitativa, nome da conformação); (2) anéis (ciclopropano a ciclo-hexano)
 * com coordenadas de Cremer–Pople, direções axial/equatorial e up/down;
 * (3) análise de cicloexanos substituídos (valores A).
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

/* ===================================================================
 * Grupos
 * =================================================================== */
export const GROUPS = {
  H: { t: 'H', s: 0, A: 0 },
  CH3: { t: 'CH₃', s: 1, A: 7.3 },
  Et: { t: 'CH₂CH₃', s: 1.1, A: 7.5, short: 'Et' },
  iPr: { t: 'CH(CH₃)₂', s: 1.6, A: 9.2, short: 'i-Pr' },
  tBu: { t: 'C(CH₃)₃', s: 2.8, A: 21, short: 't-Bu' },
  OH: { t: 'OH', s: 0.6, A: 3.9 },
  Cl: { t: 'Cl', s: 0.5, A: 2.2 },
  Br: { t: 'Br', s: 0.55, A: 2.0 },
};
export const gname = (g, short) => (short && GROUPS[g].short) || GROUPS[g].t;

/* ===================================================================
 * Rotor: carbono da frente (z > 0, voltado ao observador) e de trás
 * front/back: 3 grupos cada; o 1º grupo da frente fica a 90° (para cima),
 * os demais a −120° e −240°. back[0] fica em 90° + φ (φ = rotação do C de trás).
 * =================================================================== */
export const ROTORS = {
  etano: { n: 'etano', f: 'CH₃–CH₃', bond: 'C1–C2', front: ['H', 'H', 'H'], back: ['H', 'H', 'H'] },
  propano: { n: 'propano', f: 'CH₃CH₂CH₃', bond: 'C1–C2', front: ['H', 'H', 'H'], back: ['CH3', 'H', 'H'] },
  butano: { n: 'butano', f: 'CH₃CH₂CH₂CH₃', bond: 'C2–C3', front: ['CH3', 'H', 'H'], back: ['CH3', 'H', 'H'] },
  metilbutano: { n: '2-metilbutano', f: '(CH₃)₂CHCH₂CH₃', bond: 'C2–C3', front: ['CH3', 'CH3', 'H'], back: ['CH3', 'H', 'H'] },
  dimetilbutano: { n: '2,3-dimetilbutano', f: '(CH₃)₂CHCH(CH₃)₂', bond: 'C2–C3', front: ['CH3', 'CH3', 'H'], back: ['CH3', 'CH3', 'H'] },
  metilpentano: { n: '3-metilpentano', f: 'CH₃CH₂CH(CH₃)CH₂CH₃', bond: 'C2–C3', front: ['CH3', 'H', 'H'], back: ['Et', 'CH3', 'H'] },
  pentano: { n: 'pentano', f: 'CH₃(CH₂)₃CH₃', bond: 'C2–C3', front: ['CH3', 'H', 'H'], back: ['Et', 'H', 'H'] },
  hexano: { n: 'hexano', f: 'CH₃(CH₂)₄CH₃', bond: 'C3–C4', front: ['Et', 'H', 'H'], back: ['Et', 'H', 'H'] },
  dicloroetano: { n: '1,2-dicloroetano', f: 'ClCH₂CH₂Cl', bond: 'C1–C2', front: ['Cl', 'H', 'H'], back: ['Cl', 'H', 'H'] },
};
export const norm360 = (a) => ((a % 360) + 360) % 360;
export const dihAbs = (a) => { a = norm360(a); return a > 180 ? 360 - a : a; };
/** ângulos (graus, na projeção de Newman) dos grupos da frente e de trás */
export function rotorAngles(R, phi) {
  return { fa: [90, 330, 210], ba: [90 + phi, 330 + phi, 210 + phi].map(norm360) };
}
const CC = 1.54;
/** direções 3D: eixo C–C ao longo de z; frente em +z */
export function rotorGeom(R, phi) {
  const A = rotorAngles(R, phi);
  const st = 0.943, ct = 0.334;
  const dir = (deg, sz) => { const r = deg * Math.PI / 180; return [st * Math.cos(r), st * Math.sin(r), sz * ct]; };
  return {
    Cf: [0, 0, CC / 2], Cb: [0, 0, -CC / 2],
    fd: A.fa.map((a) => dir(a, 1)), bd: A.ba.map((a) => dir(a, -1)), A,
  };
}
const ecl = (a, b) => 4 + 2 * (GROUPS[a].s + GROUPS[b].s) + 3 * GROUPS[a].s * GROUPS[b].s;
const gau = (a, b) => 3.8 * GROUPS[a].s * GROUPS[b].s;
/** energia relativa qualitativa (kJ/mol) para o ângulo φ */
export function rotorE(R, phi) {
  const A = rotorAngles(R, phi);
  let E = 0;
  R.front.forEach((a, i) => R.back.forEach((b, j) => {
    const th = dihAbs(A.ba[j] - A.fa[i]);
    if (th < 60) E += ecl(a, b) * Math.cos(th * 1.5 * Math.PI / 180) ** 2;
    if (th < 120) E += gau(a, b) * Math.cos((th - 60) * 1.5 * Math.PI / 180) ** 2;
  }));
  return E;
}
export function rotorProfile(R, n = 361) {
  const pts = []; for (let i = 0; i < n; i++) { const p = i * 360 / (n - 1); pts.push([p, rotorE(R, p)]); }
  const m = Math.min(...pts.map((x) => x[1]));
  return pts.map(([p, e]) => [p, e - m]);
}
/** grupo "principal" (maior) de cada carbono */
const main = (arr) => { let k = 0; arr.forEach((g, i) => { if (GROUPS[g].s > GROUPS[arr[k]].s) k = i; }); return k; };
/** nome da conformação para o ângulo φ */
export function confName(R, phi) {
  const A = rotorAngles(R, phi);
  const stag = dihAbs(norm360(phi) % 120 - 60) < 12;
  const ecli = dihAbs(norm360(phi + 60) % 120 - 60) < 12;
  const kf = main(R.front), kb = main(R.back);
  const big = GROUPS[R.front[kf]].s > 0 && GROUPS[R.back[kb]].s > 0;
  const th = dihAbs(A.ba[kb] - A.fa[kf]);
  const nm = (x) => GROUPS[x].t;
  const ties = (arr, k) => arr.filter((g) => GROUPS[g].s === GROUPS[arr[k]].s).length > 1;
  const amb = big && (ties(R.front, kf) || ties(R.back, kb));
  if (amb) return { n: stag ? 'alternada' : ecli ? 'eclipsada' : 'intermediária (oblíqua)', kind: stag ? 'alt' : ecli ? 'ecl' : 'mid', th };
  if (!big) return { n: stag ? 'alternada' : ecli ? 'eclipsada' : 'intermediária (oblíqua)', kind: stag ? 'alt' : ecli ? 'ecl' : 'mid', th };
  if (stag) return th > 150 ? { n: 'anti (alternada)', kind: 'anti', th } : { n: 'gauche (alternada)', kind: 'gauche', th };
  if (ecli) return th < 20 ? { n: `totalmente eclipsada (${nm(R.front[kf])}/${nm(R.back[kb])})`, kind: 'toteclip', th } : { n: 'eclipsada (grupo grande/H)', kind: 'ecl', th };
  return { n: 'intermediária (oblíqua)', kind: 'mid', th };
}
/** diedro entre os grupos principais (ou H–C–C–H no etano) */
export function mainDihedral(R, phi) {
  const A = rotorAngles(R, phi);
  return dihAbs(A.ba[main(R.back)] - A.fa[main(R.front)]);
}

/* ===================================================================
 * Anéis: coordenadas de Cremer–Pople (xy fixo, z = deformação)
 * =================================================================== */
const RR = { 3: 0.88, 4: 1.08, 5: 1.29, 6: 1.45 };
export function ringZ(n, o = {}) {
  const z = [];
  for (let j = 0; j < n; j++) {
    if (n === 6) {
      const q2 = o.Q * Math.sin(o.th), q3 = o.Q * Math.cos(o.th);
      z.push(Math.sqrt(1 / 3) * q2 * Math.cos(o.ph + 4 * Math.PI * j / 6) + Math.sqrt(1 / 6) * q3 * (j % 2 ? -1 : 1));
    } else if (n === 5) z.push(Math.sqrt(2 / 5) * o.Q * Math.cos(o.ph + 4 * Math.PI * j / 5));
    else if (n === 4) z.push((j % 2 ? -1 : 1) * (o.p || 0));
    else z.push(0);
  }
  return z;
}
/** átomos do anel + duas direções de substituinte (up/down) por carbono */
export function ringGeom(n, o = {}) {
  const z = ringZ(n, o), R = RR[n];
  const P = z.map((zz, j) => { const a = j * 2 * Math.PI / n; return [R * Math.cos(a), R * Math.sin(a), zz]; });
  const subs = P.map((p, j) => {
    const a = P[(j + n - 1) % n], b = P[(j + 1) % n];
    const u = V.norm(V.sub(a, p)), w = V.norm(V.sub(b, p));
    const out = V.norm(V.mul(V.add(u, w), -1));
    let nn = V.norm(V.cross(u, w)); if (nn[2] < 0) nn = V.mul(nn, -1);
    const up = V.norm(V.add(V.mul(out, 0.58), V.mul(nn, 0.815))), dn = V.norm(V.add(V.mul(out, 0.58), V.mul(nn, -0.815)));
    const upAx = Math.abs(up[2]) >= Math.abs(dn[2]);
    return { u: { dir: up, role: upAx ? 'ax' : 'eq' }, d: { dir: dn, role: upAx ? 'eq' : 'ax' } };
  });
  return { P, subs, z };
}
/* caminho de inversão do ciclo-hexano: u ∈ [0, 1] */
export const QCH = 0.63;
export function flipParams(u) {
  if (u <= 0.3) return { Q: QCH, th: (u / 0.3) * Math.PI / 2, ph: Math.PI / 6 };
  if (u <= 0.7) return { Q: QCH, th: Math.PI / 2, ph: Math.PI / 6 + ((u - 0.3) / 0.4) * Math.PI / 3 };
  return { Q: QCH, th: Math.PI / 2 + ((u - 0.7) / 0.3) * Math.PI / 2, ph: Math.PI / 2 };
}
const lerpKeys = (keys, s) => { for (let i = 1; i < keys.length; i++) if (s <= keys[i][0]) { const [a, va] = keys[i - 1], [b, vb] = keys[i]; const t = (s - a) / (b - a); return va + (vb - va) * (t * t * (3 - 2 * t)); } return keys[keys.length - 1][1]; };
export const FLIP_E = [[0, 0], [0.16, 45], [0.3, 23], [0.5, 29], [0.7, 23], [0.84, 45], [1, 0]];
export const flipE = (u) => lerpKeys(FLIP_E, u);
export function flipName(u) {
  if (u < 0.04) return 'cadeira';
  if (u > 0.96) return 'cadeira (invertida)';
  if (Math.abs(u - 0.16) < 0.05 || Math.abs(u - 0.84) < 0.05) return 'meia-cadeira (máximo de energia)';
  if (Math.abs(u - 0.3) < 0.04 || Math.abs(u - 0.7) < 0.04) return 'barco torcido';
  if (Math.abs(u - 0.5) < 0.04) return 'barco';
  return 'estrutura intermediária';
}
export const CONFS6 = { cadeira: 0, 'meia-cadeira': 0.16, 'barco torcido': 0.3, barco: 0.5 };

/* ===================================================================
 * Cicloexanos substituídos
 * subs: { '1u': 'CH3', '3d': 'tBu', ... } (carbonos 1–6; u = up, d = down)
 * cadeira A: C1 com axial para cima (C ímpares: axial up; pares: axial down)
 * =================================================================== */
export function roleOf(c, face, flipped) {
  const axUp = (c % 2 === 1) !== !!flipped;
  return (face === 'u') === axUp ? 'ax' : 'eq';
}
export function analyzeChair(subs, flipped) {
  const list = Object.entries(subs).filter(([, g]) => g && g !== 'H').map(([k, g]) => ({ c: +k.slice(0, -1), f: k.slice(-1), g, role: roleOf(+k.slice(0, -1), k.slice(-1), flipped) }));
  let E = 0; const notes = [];
  list.forEach((x) => { if (x.role === 'ax') { E += GROUPS[x.g].A; notes.push(`${gname(x.g, 1)} axial em C${x.c}: +${GROUPS[x.g].A.toString().replace('.', ',')} kJ/mol (interações 1,3-diaxiais com H)`); } });
  for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
    const a = list[i], b = list[j];
    const d = Math.min(Math.abs(a.c - b.c), 6 - Math.abs(a.c - b.c));
    if (d === 2 && a.role === 'ax' && b.role === 'ax' && a.f === b.f) { const x = 15 * Math.max(1, (GROUPS[a.g].s + GROUPS[b.g].s) / 2); E += x; notes.push(`${gname(a.g, 1)} e ${gname(b.g, 1)} ambos axiais (1,3-diaxiais, mesma face): forte repulsão, ≈ +${Math.round(x)} kJ/mol`); }
    if (d === 1 && !(a.role === 'ax' && b.role === 'ax')) { const x = 3.8 * GROUPS[a.g].s * GROUPS[b.g].s; if (x > 0.5) { E += x; notes.push(`${gname(a.g, 1)}/${gname(b.g, 1)} vizinhos em gauche: ≈ +${x.toFixed(1).replace('.', ',')} kJ/mol`); } }
  }
  return { list, E, notes, nAx: list.filter((x) => x.role === 'ax').length };
}
export function relation(subs) {
  const ks = Object.entries(subs).filter(([, g]) => g && g !== 'H');
  if (ks.length !== 2) return null;
  const [a, b] = ks.map(([k]) => ({ c: +k.slice(0, -1), f: k.slice(-1) }));
  return a.f === b.f ? 'cis' : 'trans';
}
