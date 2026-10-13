/*
 * m3d.js — visualização 3D de geometrias pré-otimizadas (RDKit/MMFF, mol3d.js).
 * Camadas: δ±, π/π*, mapa de potencial qualitativo, pares isolados, rótulos,
 * destaque do carbono (ex-)carbonílico e troca de espécie (mecanismos).
 */
import { THREE, Viewer, Mol, label } from './viewer3d.js';
import { V } from './struct.js';
import { M3D } from './mol3d.js';
import { moSurf, espSurf, charges, dashed, ORANGE, CYAN } from './co3d.js';

const VE = { O: 6, N: 5, S: 6, P: 5, C: 4, H: 1, Cl: 7 };
export const has = (k) => !!M3D[k];
export const nameOf = (k) => (M3D[k] ? M3D[k].name : k);

function clearGroup(g) {
  const css = []; g.traverse((x) => { if (x.isCSS2DObject) css.push(x); });
  css.forEach((x) => x.removeFromParent());
  g.traverse((x) => { if (x.material && x.material.dispose) x.material.dispose(); });
  g.removeFromParent();
}
function geom(key) {
  const D = M3D[key];
  const atoms = D.atoms.map(([el, x, y, z, q]) => ({ el, p: [x, y, z], q }));
  const nb = atoms.map(() => []);
  D.bonds.forEach(([a, b, o]) => { nb[a].push({ j: b, o }); nb[b].push({ j: a, o }); });
  return { D, atoms, nb, map: (n) => (D.map[n] !== undefined ? D.map[n] : null) };
}
function planeNormal(G, i, j) {
  // normal ao plano local da ligação i=j (para deslocar a dupla e orientar π)
  const ref = G.nb[i].find((x) => x.j !== j) || G.nb[j].find((x) => x.j !== i);
  const u = V.sub(G.atoms[j].p, G.atoms[i].p);
  const w = ref ? V.sub(G.atoms[ref.j].p, G.atoms[i].p) : [0, 0, 1];
  let n = V.cross(u, w); if (V.len(n) < 1e-3) n = V.cross(u, [0, 1, 0]);
  return V.norm(n);
}
function lonePairs(G, i) {
  const a = G.atoms[i]; if (!['O', 'N', 'S'].includes(a.el)) return [];
  const bs = G.nb[i].reduce((s, x) => s + x.o, 0), n = Math.round((VE[a.el] - a.q - bs) / 2);
  if (n <= 0) return [];
  const P = a.p, us = G.nb[i].map((x) => V.norm(V.sub(G.atoms[x.j].p, P)));
  const m = V.norm(V.mul(us.reduce((s, u) => V.add(s, u), [0, 0, 0]), -1));
  const dom = us.length + n, dbl = G.nb[i].some((x) => x.o === 2);
  if (n === 1) return [m];
  if (n === 2 && us.length === 2) { const pn = V.norm(V.cross(us[0], us[1])); const c = Math.cos(54.7 * Math.PI / 180), s = Math.sin(54.7 * Math.PI / 180); return [V.add(V.mul(m, c), V.mul(pn, s)), V.add(V.mul(m, c), V.mul(pn, -s))]; }
  if (n === 2 && us.length === 1 && dbl) { const j = G.nb[i][0].j, pn = planeNormal(G, j, i), w = V.norm(V.cross(pn, m)); const c = Math.cos(60 * Math.PI / 180), s = Math.sin(60 * Math.PI / 180); return [V.add(V.mul(m, c), V.mul(w, s)), V.add(V.mul(m, c), V.mul(w, -s))]; }
  // 3 pares (O⁻) ou casos residuais: tetraedro ao redor de −u
  const u = us[0] || [1, 0, 0]; let r = V.cross(u, [0, 0, 1]); if (V.len(r) < 1e-3) r = V.cross(u, [0, 1, 0]); r = V.norm(r); const s2 = V.cross(u, r);
  return [0, 1, 2].slice(0, n).map((k) => { const f = k * 2 * Math.PI / 3; return V.norm(V.add(V.mul(u, -1 / 3), V.mul(V.add(V.mul(r, Math.cos(f)), V.mul(s2, Math.sin(f))), 0.9428))); });
  void dom;
}
const LPMAT = () => new THREE.MeshStandardMaterial({ color: 0x7fe3ff, transparent: true, opacity: 0.55, roughness: 0.4, depthWrite: false });
const SPH = new THREE.SphereGeometry(1, 20, 14);

/**
 * molView(host, key, o)
 * o: style, delta, pi, pistar, esp, lp, hlC (halo laranja no map 1), labels: [[mapN|'#idx', texto, cls]], dist, cam, spin, alt
 */
export function molView(host, key, o = {}) {
  const v = new Viewer(host, { dist: o.dist || 9, hint: o.hint !== false, alt: o.alt || 'Modelo 3D: ' + nameOf(key), autoRotate: !!o.spin });
  const st = Object.assign({ key, style: 'ball', delta: false, pi: false, pistar: false, esp: false, lp: false, hlC: false }, o, { key });
  const api = { v, st, set(k, extra = {}) { st.key = k; Object.assign(st, extra); draw(true); }, rebuild() { draw(false); }, G: null, mol: null };
  let grp = null, lastKey = null;
  function draw(recam) {
    if (!v.ok || !M3D[st.key]) return;
    if (api.mol) clearGroup(api.mol.group);
    if (grp) clearGroup(grp);
    grp = new THREE.Group(); v.scene.add(grp);
    const G = geom(st.key); api.G = G;
    const bonds = G.D.bonds.map(([a, b, ord]) => [a, b, ord, { normal: ord === 2 ? planeNormal(G, a, b) : [0, 0, 1] }]);
    const mol = new Mol(v, G.atoms.map((a) => ({ el: a.el, p: a.p })), bonds, { style: st.style });
    api.mol = mol;
    const C = G.map(1), O = G.map(2);
    const cIsCO = C !== null && O !== null && G.nb[C].some((x) => x.j === O && x.o === 2);
    if (st.hlC && C !== null) mol.halo(C, ORANGE, 1.9);
    (G.D.hb || []).forEach(([a, b]) => dashed(grp, G.atoms[a].p, G.atoms[b].p, 0x2fd4f5));
    if (st.esp) { const q = charges(G.atoms, G.D.bonds, G.atoms.map((a) => a.q)); espSurf(grp, G.atoms, q); }
    if (cIsCO && (st.pi || st.pistar)) { const n = planeNormal(G, C, O), Pc = G.atoms[C].p, Po = G.atoms[O].p; const w = G.atoms[O].el === 'O' ? 0.55 : 0.62; moSurf(grp, [Pc, Po], [n, n], st.pistar ? [0.83, -w] : [w, 0.83], { opacity: 0.6 }); }
    if (st.delta && cIsCO) { const u = V.norm(V.sub(G.atoms[O].p, G.atoms[C].p)), n = planeNormal(G, C, O); const lc = label('C δ+', 'tag o'), lo = label(G.atoms[O].el + ' δ−', 'tag c'); lc.position.set(...V.add(G.atoms[C].p, V.add(V.mul(u, -0.45), V.mul(n, 0.75)))); lo.position.set(...V.add(G.atoms[O].p, V.add(V.mul(u, 0.55), V.mul(n, 0.45)))); grp.add(lc, lo); }
    if (st.lp) G.atoms.forEach((a, i) => lonePairs(G, i).forEach((d) => { const m = new THREE.Mesh(SPH, LPMAT()); m.scale.set(0.17, 0.17, 0.3); const p = V.add(a.p, V.mul(d, 0.62)); m.position.set(...p); m.lookAt(new THREE.Vector3(...V.add(p, d))); grp.add(m); }));
    if (st.hyb && C !== null) { const n = G.nb[C].length; mol.addLabel(C, n === 4 ? 'C sp³ (tetraédrico)' : n === 3 ? 'C sp² (trigonal)' : 'C', 'tag o', [0, -0.8, -0.4]); }
    const OFF = [[0, 0.7, 0.35], [0, -0.75, 0.35], [0.85, 0.25, 0.4], [-0.85, 0.25, 0.4]];
    (st.labels || []).forEach(([ref, txt, cls], k) => { const i = typeof ref === 'string' && ref[0] === '#' ? +ref.slice(1) : G.map(ref); if (i === null || i === undefined || !G.atoms[i]) return; mol.addLabel(i, txt, 'tag ' + (cls || 'c'), OFF[k % 4]); });
    (st.halos || []).forEach(([ref, color]) => { const i = typeof ref === 'string' && ref[0] === '#' ? +ref.slice(1) : G.map(ref); if (i !== null && i !== undefined) mol.halo(i, color ?? CYAN, 1.8); });
    if (recam || lastKey === null) {
      const R = Math.max(...G.atoms.map((a) => V.len(a.p)));
      const d = st.dist || Math.max(6.5, 2.4 * R + 3.2);
      if (v.ok) { v.setCamera(st.cam ? V.mul(V.norm(st.cam), d) : [0.6, -0.9 * d * 0.45, d * 0.9], [0, 0, 0]); v.home = v.camera.position.clone(); }
    }
    lastKey = st.key;
    if (st.post) st.post(grp, G, api);
  }
  draw(true);
  return api;
}
/** carbonos (índices) por mapa, para outros módulos */
export function idxOf(key, n) { const D = M3D[key]; return D && D.map[n] !== undefined ? D.map[n] : null; }
export function cipOf(key) { return (M3D[key] && M3D[key].cip) || {}; }
export { M3D };
