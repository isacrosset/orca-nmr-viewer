/*
 * co3d.js — cenas 3D da química de carbonilas:
 *  - carbonila com δ+/δ−, orbitais π e π* (combinações qualitativas de p_C e p_O),
 *    mapa eletrostático qualitativo e trajetória de Bürgi–Dunitz (cone ≈ 107°);
 *  - adição nucleofílica animada (sp² → sp³), transferência de hidreto a partir
 *    de B–H/Al–H, protonação, ataque pelas duas faces (R/S);
 *  - oxidação por Cr(VI): éster de cromato → C=O (sp³ → sp²).
 */
import { THREE, Viewer, Mol, label } from './viewer3d.js';
import { molScene, isoGeom, isoMat, placeOrbital, PH_A, PH_B } from './scene3d.js';
import { surfaces, p2 } from './orbitals.js';
import { fromSmiles, V, fc } from './struct.js';

export const CYAN = 0x2fd4f5, ORANGE = 0xff9f43, YEL = 0xffd45c, MAG = 0xff4fa3;
const EN = { H: 2.2, C: 2.55, N: 3.04, O: 3.44, B: 2.04, Al: 1.61, Cl: 3.16, Br: 2.96, Cr: 1.66, Li: 0.98 };
const RAD = { H: 1.0, C: 1.45, N: 1.4, O: 1.35, B: 1.5, Al: 1.7, Cl: 1.6, Br: 1.7, Cr: 1.7 };

/* ---------- utilidades ---------- */
export function findCO(G) { const b = G.bonds.find(([a, c, o]) => o === 2 && ((G.atoms[a].el === 'C' && G.atoms[c].el === 'O') || (G.atoms[a].el === 'O' && G.atoms[c].el === 'C'))); if (!b) return null; return G.atoms[b[0]].el === 'C' ? { c: b[0], o: b[1] } : { c: b[1], o: b[0] }; }
export function charges(atoms, bonds, formal = []) {
  const q = atoms.map((_, i) => formal[i] || 0);
  bonds.forEach(([a, b, o]) => { const d = ((EN[atoms[b].el] || 2.5) - (EN[atoms[a].el] || 2.5)) * 0.2 * (o || 1); q[a] += d; q[b] -= d; });
  return q;
}
/** OM qualitativo: soma ponderada de orbitais p */
export function moSurf(parent, centers, dirs, w, o = {}) {
  const s = 0.2;
  const fs = centers.map((c, i) => ({ f: p2(dirs[i], V.mul(c, 1 / s)), w: w[i] }));
  const f = (x, y, z) => { let t = 0; for (const g of fs) t += g.w * g.f(x / s, y / s, z / s); return t; };
  let mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9]; centers.forEach((c) => { mn = mn.map((v, k) => Math.min(v, c[k])); mx = mx.map((v, k) => Math.max(v, c[k])); });
  const pad = 1.9;
  const S = surfaces(f, [mn[0] - pad, mn[1] - pad, mn[2] - pad, mx[0] + pad, mx[1] + pad, mx[2] + pad], o.n || 34, { frac: o.frac || 0.3 });
  const g = new THREE.Group();
  g.add(new THREE.Mesh(isoGeom(S.plus), isoMat(o.cA ?? PH_A, o.opacity ?? 0.62)), new THREE.Mesh(isoGeom(S.minus), isoMat(o.cB ?? PH_B, o.opacity ?? 0.62)));
  parent.add(g); return g;
}
/** superfície de densidade colorida pelo potencial qualitativo (ciano = rico; laranja = pobre) */
export function espSurf(parent, atoms, q, o = {}) {
  const P = atoms.map((a) => a.p), R = atoms.map((a) => RAD[a.el] || 1.4);
  const f = (x, y, z) => { let t = 0; for (let i = 0; i < P.length; i++) { const dx = x - P[i][0], dy = y - P[i][1], dz = z - P[i][2]; t += Math.exp(-(dx * dx + dy * dy + dz * dz) / (R[i] * R[i] * 0.55)); } return t; };
  let mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9]; P.forEach((c) => { mn = mn.map((v, k) => Math.min(v, c[k])); mx = mx.map((v, k) => Math.max(v, c[k])); });
  const S = surfaces(f, [mn[0] - 2.4, mn[1] - 2.4, mn[2] - 2.4, mx[0] + 2.4, mx[1] + 2.4, mx[2] + 2.4], o.n || 40, { iso: 0.35 });
  const geo = isoGeom(S.plus), pos = S.plus.pos, col = new Float32Array(pos.length);
  for (let k = 0; k < pos.length; k += 3) {
    let pot = 0; for (let i = 0; i < P.length; i++) { const d = Math.hypot(pos[k] - P[i][0], pos[k + 1] - P[i][1], pos[k + 2] - P[i][2]); pot += q[i] * Math.exp(-d * d / 1.3); }
    const t = Math.max(-1, Math.min(1, pot / (o.scale || 0.045)));
    const N0 = [0.87, 0.9, 0.95], tg = t < 0 ? [0.18, 0.83, 0.96] : [1.0, 0.62, 0.26], at = Math.abs(t), c = N0.map((v, k2) => v + (tg[k2] - v) * at);
    col[k] = c[0]; col[k + 1] = c[1]; col[k + 2] = c[2];
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, transparent: true, opacity: o.opacity ?? 0.8, side: THREE.DoubleSide, roughness: 0.45, depthWrite: false }));
  parent.add(m); return m;
}
export function dashed(parent, a, b, color = YEL) {
  const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a), new THREE.Vector3(...b)]);
  const l = new THREE.Line(g, new THREE.LineDashedMaterial({ color, dashSize: 0.14, gapSize: 0.1 })); l.computeLineDistances(); parent.add(l); return l;
}
export function ball(parent, pos, color, r = 0.36, txt, cls = 'o') {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 20), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.25, roughness: 0.35 }));
  m.position.set(...pos); parent.add(m);
  if (txt) { const l = label(txt, 'tag ' + cls); l.position.set(pos[0], pos[1], pos[2] + r + 0.35); parent.add(l); }
  return m;
}
const slerp = (a, b, t) => { const d = Math.max(-1, Math.min(1, V.dot(a, b))), th = Math.acos(d); if (th < 1e-4) return a; const s = Math.sin(th); return V.add(V.mul(a, Math.sin((1 - t) * th) / s), V.mul(b, Math.sin(t * th) / s)); };
const angDeg = (a, b) => Math.acos(Math.max(-1, Math.min(1, V.dot(V.norm(a), V.norm(b))))) * 180 / Math.PI;

/* ===================================================================
 * Carbonila (a partir de SMILES) com camadas didáticas
 * st: delta, pi, pistar, esp, bd (ângulo em graus | null), cone, elec, pickC
 * =================================================================== */
export function coScene(host, smi, o = {}) {
  const LS = fromSmiles(smi, o.name || smi);
  const A = molScene(host, LS, Object.assign({ dist: o.dist || 7, hint: o.hint, post: (extra, G, api, mol) => post(extra, G, api, mol) }, o));
  function post(extra, G, api, mol) {
    const st = api.st, co = findCO(G);
    api.co = co;
    if (st.esp) { const q = charges(G.atoms, G.bonds, G.atoms.map((_, i) => (i < LS.atoms.length ? fc(LS, i) : 0))); espSurf(extra, G.atoms, q); }
    if (!co) return;
    const C = G.atoms[co.c].p, O = G.atoms[co.o].p, n = (G.pdirs[co.c] || [[0, 0, 1]])[0];
    if (st.delta) { const lc = label('C δ+', 'tag o'), lo = label('O δ−', 'tag c'); const u = V.norm(V.sub(O, C)); lc.position.set(...V.add(C, V.add(V.mul(u, -0.5), V.mul(n, 0.7)))); lo.position.set(...V.add(O, V.add(V.mul(u, 0.55), V.mul(n, 0.4)))); extra.add(lc, lo); }
    if (st.elec) mol.halo(co.c, ORANGE, 1.9);
    if (st.pi) moSurf(extra, [C, O], [n, n], [0.55, 0.83], { opacity: 0.6 });
    if (st.pistar) moSurf(extra, [C, O], [n, n], [0.83, -0.55], { opacity: 0.6 });
    if (st.bd !== null && st.bd !== undefined) bdDraw(extra, C, O, n, st.bd, st.side || 1, st.cone);
  }
  return A;
}
/** trajetória do nucleófilo: ângulo θ entre C→O e C→Nu, acima do plano */
export function bdDraw(parent, C, O, n0, theta, side = 1, cone = false) {
  const u = V.norm(V.sub(O, C)), n = V.mul(n0, side), th = theta * Math.PI / 180, d = 2.6;
  const dir = V.add(V.mul(u, Math.cos(th)), V.mul(n, Math.sin(th)));
  const Nu = V.add(C, V.mul(dir, d));
  const good = Math.abs(theta - 107) <= 8;
  ball(parent, Nu, CYAN, 0.34, 'Nu:⁻', 'c');
  placeOrbital(parent, 'sp3', Nu, V.sub(C, Nu), 0.09, { colorA: 0x7fe3ff, colorB: 0x7fe3ff, opacity: 0.5 });
  dashed(parent, Nu, C, good ? 0x3ddc97 : 0xff5c6c);
  const pts = []; for (let k = 0; k <= 24; k++) pts.push(new THREE.Vector3(...V.add(C, V.mul(slerp(u, dir, k / 24), 0.85))));
  parent.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: good ? 0x3ddc97 : 0xff9f43 })));
  const mid = V.add(C, V.mul(slerp(u, dir, 0.5), 1.15));
  const l = label(`${Math.round(theta)}°`, 'tag ' + (good ? 'g' : 'o')); l.position.set(...mid); parent.add(l);
  if (cone) {
    const t0 = 107 * Math.PI / 180, ax = V.mul(u, Math.cos(t0) * d), rr = Math.sin(t0) * d;
    const e1 = V.norm(n), e2 = V.norm(V.cross(u, e1)), cp = [];
    for (let k = 0; k <= 64; k++) { const a = k / 64 * 2 * Math.PI; cp.push(new THREE.Vector3(...V.add(V.add(C, ax), V.add(V.mul(e1, rr * Math.cos(a)), V.mul(e2, rr * Math.sin(a)))))); }
    parent.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(cp), new THREE.LineDashedMaterial({ color: 0x3ddc97, dashSize: 0.12, gapSize: 0.1 })));
    parent.children[parent.children.length - 1].computeLineDistances();
  }
  return { good, Nu };
}

/* ===================================================================
 * Geometria de adição (C sp² → sp³) e oxidação (sp³ → sp²)
 * =================================================================== */
const sm = (t) => t * t * (3 - 2 * t);
function tetra3(back, ref = [0, 0, 1], phase = 0) {
  const b = V.norm(back); let r = V.cross(b, ref); if (V.len(r) < 1e-3) r = V.cross(b, [0, 1, 0]); r = V.norm(r); const s = V.cross(b, r);
  return [0, 1, 2].map((k) => { const f = phase + k * 2 * Math.PI / 3; return V.norm(V.add(V.mul(b, -1 / 3), V.mul(V.add(V.mul(r, Math.cos(f)), V.mul(s, Math.sin(f))), 0.9428))); });
}
function group(atoms, bonds, type, at, from, dir) {
  if (type === 'H') { atoms.push({ el: 'H', p: V.add(at, V.mul(dir, 1.1)) }); bonds.push([from, atoms.length - 1, 1]); return; }
  const c = atoms.length; atoms.push({ el: 'C', p: V.add(at, V.mul(dir, 1.52)) }); bonds.push([from, c, 1]);
  const ds = tetra3(V.mul(dir, -1), [0, 0, 1]);
  ds.forEach((d, k) => { if (type === 'C2H5' && k === 0) { const c2 = atoms.length; atoms.push({ el: 'C', p: V.add(atoms[c].p, V.mul(d, 1.53)) }); bonds.push([c, c2, 1]); tetra3(V.mul(d, -1)).forEach((d2) => { atoms.push({ el: 'H', p: V.add(atoms[c2].p, V.mul(d2, 1.09)) }); bonds.push([c2, atoms.length - 1, 1]); }); return; } atoms.push({ el: 'H', p: V.add(atoms[c].p, V.mul(d, 1.09)) }); bonds.push([c, atoms.length - 1, 1]); });
}
/**
 * o: { r1, r2: 'H'|'CH3'|'C2H5', nu: 'H'|'OH', src: 'B'|'Al'|null, side, mode: 'add'|'ox' }
 * t: progresso do ataque (0 = carbonila + Nu afastado; 1 = tetraédrico). prot: 0..1 (protonação do O)
 */
export function addGeom(t, o = {}, prot = 0, cr = 0) {
  const side = o.side || 1, s = sm(t);
  const BD = V.norm([Math.cos(107 * Math.PI / 180), 0, Math.sin(107 * Math.PI / 180) * side]);
  const dO = V.norm(V.add(V.mul([1, 0, 0], 1 - s), V.mul([0.943, 0, -0.333 * side], s)));
  const dR1 = V.norm(V.add(V.mul([-0.5, 0.866, 0], 1 - s), V.mul([-0.471, 0.816, -0.333 * side], s)));
  const dR2 = V.norm(V.add(V.mul([-0.5, -0.866, 0], 1 - s), V.mul([-0.471, -0.816, -0.333 * side], s)));
  const dNu = V.norm(V.add(V.mul(BD, 1 - s), V.mul([0, 0, side], s)));
  const atoms = [{ el: 'C', p: [0, 0, 0] }, { el: 'O', p: V.mul(dO, 1.21 + 0.21 * s) }], bonds = [[0, 1, t < 0.5 ? 2 : 1]];
  group(atoms, bonds, o.r1 || 'CH3', [0, 0, 0], 0, dR1);
  group(atoms, bonds, o.r2 || 'CH3', [0, 0, 0], 0, dR2);
  const Lf = o.nu === 'OH' ? 1.43 : 1.1, dist = Lf + (3.0 - Lf) * (1 - t);
  const nuI = atoms.length; atoms.push({ el: o.nu === 'OH' ? 'O' : 'H', p: V.mul(dNu, dist), nu: true });
  if (t > 0.85) bonds.push([0, nuI, 1]); else if (t > 0.3) bonds.push([0, nuI, 1, { partial: true }]);
  const info = { nuI, C: 0, O: 1 };
  if (o.nu === 'OH') { atoms.push({ el: 'H', p: V.add(atoms[nuI].p, V.mul(V.norm(V.add(dNu, [0.7, 0, 0])), 0.97)) }); bonds.push([nuI, atoms.length - 1, 1]); if (t < 0.6) { atoms.push({ el: 'H', p: V.add(atoms[nuI].p, V.mul(V.norm(V.add(dNu, [-0.6, 0.6, 0])), 0.97)) }); bonds.push([nuI, atoms.length - 1, 1]); } }
  if (o.src) {
    const L = o.src === 'Al' ? 1.6 : 1.21, src = V.mul(BD, 3.0 + L), bi = atoms.length;
    atoms.push({ el: o.src, p: src }); info.src = bi;
    if (t < 0.15) bonds.push([bi, nuI, 1]); else if (t < 0.7) bonds.push([bi, nuI, 1, { partial: true }]);
    tetra3(V.mul(BD, -1), [0, 1, 0]).forEach((d) => { atoms.push({ el: 'H', p: V.add(src, V.mul(d, L)) }); bonds.push([bi, atoms.length - 1, 1]); });
  }
  if (prot > 0) {
    const dirP = V.norm(V.add(dO, [0, 0, -0.9 * side])), Op = atoms[1].p;
    const hp = V.add(Op, V.mul(dirP, 0.97 + 1.5 * (1 - prot)));
    const hi = atoms.length; atoms.push({ el: 'H', p: hp }); info.prot = hi;
    if (prot > 0.8) bonds.push([1, hi, 1]); else if (prot > 0.3) bonds.push([1, hi, 1, { partial: true }]);
    const so = atoms.length; atoms.push({ el: 'O', p: V.add(hp, V.mul(dirP, 1.0 + 1.6 * prot)) }); info.solvO = so;
    if (prot < 0.7) bonds.push([hi, so, 1, prot > 0.3 ? { partial: true } : {}]);
    [[0.6, 0.6, 0], [-0.6, 0.6, 0]].forEach((dd) => { atoms.push({ el: 'H', p: V.add(atoms[so].p, V.mul(V.norm(V.add(dirP, dd)), 0.97)) }); bonds.push([so, atoms.length - 1, 1]); });
  }
  if (o.mode === 'ox') {
    // éster de cromato no O; Cr afasta-se à medida que a C=O se forma (t → 0)
    const dirCr = V.norm(V.add(dO, [-0.3, 0, -0.95 * side])), Lc = 1.62 + 2.4 * (1 - t);
    const ci = atoms.length; atoms.push({ el: 'Cr', p: V.add(atoms[1].p, V.mul(dirCr, Lc)) }); info.cr = ci;
    if (t > 0.7) bonds.push([1, ci, 1]); else if (t > 0.3) bonds.push([1, ci, 1, { partial: true }]);
    tetra3(V.mul(dirCr, -1), [0, 1, 0]).forEach((d, k) => { atoms.push({ el: 'O', p: V.add(atoms[ci].p, V.mul(d, 1.6)) }); bonds.push([ci, atoms.length - 1, k < 2 ? 2 : 1]); if (k === 2) { atoms.push({ el: 'H', p: V.add(atoms[atoms.length - 1].p, V.mul(d, 0.97)) }); bonds.push([atoms.length - 2, atoms.length - 1, 1]); } });
  }
  return { atoms, bonds, info };
}
/** cena animável de adição / oxidação */
export function addScene(host, o = {}) {
  const v = new Viewer(host, { dist: o.dist || (o.src ? 11.5 : 9), hint: o.hint !== false, alt: o.alt || 'Adição nucleofílica à carbonila (3D)' });
  if (v.ok) v.setCamera(o.cam || [2.5, -6.8, 4.6]);
  let mol = null, grp = null; const st = { t: o.t ?? 0, prot: 0, pistar: !!o.pistar, labels: true };
  const api = { v, st, set(t, prot = st.prot) { st.t = t; st.prot = prot; draw(); }, opt: o };
  function draw() {
    if (!v.ok) return;
    if (mol) { v.scene.remove(mol.group); mol.labels.forEach((l) => l.obj.removeFromParent()); }
    if (grp) { v.scene.remove(grp); grp.traverse((x) => { if (x.material && x.material.dispose) x.material.dispose(); }); }
    grp = new THREE.Group(); v.scene.add(grp);
    const g = addGeom(st.t, o, st.prot, 0); api.g = g;
    mol = new Mol(v, g.atoms.map((a) => ({ el: a.el, p: a.p, color: a.nu && o.nu === 'H' ? YEL : undefined })), g.bonds.map(([a, b, ord, opt]) => [a, b, ord, Object.assign({ normal: [0, 0, 1] }, opt || {})]), { style: o.style || 'ball' });
    api.mol = mol;
    if (!st.labels) return;
    const ox = o.mode === 'ox', t = st.t;
    const hyb = t < 0.5 ? 'C sp² (trigonal)' : 'C sp³ (tetraédrico)';
    mol.addLabel(0, hyb, 'tag o', [-0.2, 0, -0.9 * (o.side || 1)]);
    let oLab = t < 0.35 ? 'O δ−' : ox ? (t > 0.7 ? 'O–Cr(VI)' : 'C=O formando') : st.prot > 0.8 ? 'O–H' : 'O⁻ (alcóxido)';
    if (ox && t < 0.3) oLab = 'C=O';
    mol.addLabel(1, oLab, 'tag c', [0.6, 0, -0.2]);
    if (o.nu === 'H') mol.addLabel(g.info.nuI, ox ? (t > 0.7 ? 'H no C' : 'H⁺ → base') : t < 0.85 ? 'H (hidreto equivalente)' : 'nova C–H', 'tag y', [0, 0, 0.5]);
    if (o.nu === 'OH') mol.addLabel(g.info.nuI, t < 0.85 ? 'Nu⁻ (ex.: HO⁻)' : 'nova C–Nu', 'tag o', [0, 0, 0.6]);
    if (g.info.src !== undefined) mol.addLabel(g.info.src, o.src === 'Al' ? 'Al' : 'B', 'tag v', [0, 0, 0.55]);
    if (g.info.cr !== undefined) mol.addLabel(g.info.cr, t > 0.3 ? 'Cr(VI)' : 'Cr(IV)', 'tag v', [0, 0, 0.7]);
    if (st.pistar && t < 0.25) { const C = g.atoms[0].p, O = g.atoms[1].p; moSurf(grp, [C, O], [[0, 0, 1], [0, 0, 1]], [0.83, -0.55], { opacity: 0.45 }); }
  }
  draw();
  return api;
}
/** quiralidade (R/S) do carbono 0 dados os índices por prioridade a > b > c > d */
export function rs(atoms, [a, b, c, d]) {
  const C = atoms[0].p, va = V.sub(atoms[a].p, C), vb = V.sub(atoms[b].p, C), vc = V.sub(atoms[c].p, C), vd = V.sub(atoms[d].p, C);
  return V.dot(V.cross(V.sub(vb, va), V.sub(vc, va)), vd) > 0 ? 'R' : 'S';
}

/* ===================================================================
 * Espécies isoladas (BH₄⁻, AlH₄⁻, DIBAL-H, O₃, éster de cromato…)
 * =================================================================== */
export const SPECIES = {
  BH4: ['[BH4-]', 'BH₄⁻ (tetraédrico)'], AlH4: ['[AlH4-]', 'AlH₄⁻ (tetraédrico)'], DIBAL: ['CC(C)C[AlH]CC(C)C', 'DIBAL-H: Al com orbital vazio (ácido de Lewis)'],
  O3: ['[O-][O+]=O', 'ozônio (angular)'], cromato: ['CC(C)O[Cr](=O)(=O)O', 'éster de cromato (simplificado)'], H2CrO4: ['O[Cr](=O)(=O)O', 'ácido crômico H₂CrO₄ (Cr(VI))'],
  hidrato: ['CC(O)O', 'hidrato do etanal (gem-diol)'], formaldeido: ['C=O', 'formaldeído'],
};
export const speciesScene = (host, k, o = {}) => molScene(host, fromSmiles(SPECIES[k][0], SPECIES[k][1]), Object.assign({ dist: 6.5, lp: false, angles: true, hint: false }, o));
export { angDeg };
