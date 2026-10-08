/*
 * a3d.js — cenas 3D de sistemas cíclicos conjugados: orbitais p (fases),
 * nuvem π (soma em fase dos p: isosuperfície real), pares isolados no
 * plano × no sistema π, plano molecular, elétrons π por átomo, OM de Hückel,
 * densidade π qualitativa (heteroaromáticos) e seleção de átomos.
 */
import { THREE, Viewer, Mol, label } from './viewer3d.js';
import { geometry, V, TYPES } from './arom.js';
import { placeOrbital, piCloud, isoGeom, isoMat, PH_A, PH_B } from './scene3d.js';
import { surfaces, p2 } from './orbitals.js';

export const LP_IN = 0x7fe3ff, LP_PI = 0xff4fa3;
export function aromScene(host, def0, o = {}) {
  let def = def0;
  const v = new Viewer(host, { dist: o.dist || dist(def), autoRotate: !!o.spin, hint: o.hint !== false, alt: 'Modelo 3D: ' + (def.name || '') });
  const st = Object.assign({ p: false, cloud: false, lp: true, plane: false, e: false, style: 'ball', sp3: [], twist: undefined, hybrid: false, phase: true, sel: null, esp: null }, o);
  let grp = null, mol = null;
  if (v.ok) { const D = o.dist || dist(def); v.setCamera(o.cam || [0, D * 0.8, D * 0.52]); }
  const api = { v, def, st, rebuild, set(k, val) { st[k] = val; rebuild(); }, setDef(d) { def = d; api.def = d; rebuild(); } };
  function rebuild() {
    if (!v.ok) return;
    if (grp) { v.scene.remove(grp); grp.traverse((x) => { if (x.material && x.material.dispose) x.material.dispose(); }); }
    if (mol) { v.scene.remove(mol.group); mol.labels.forEach((l) => l.obj.removeFromParent()); }
    grp = new THREE.Group(); v.scene.add(grp);
    const G = geometry(def, { sp3: st.sp3, twist: st.twist, sub: st.sub, groups: st.groups });
    api.G = G;
    const N = G.ringN;
    const bonds = G.bonds.map(([a, b, ord]) => [a, b, st.hybrid && a < N && b < N && G.atoms[a].hasP && G.atoms[b].hasP ? 1 : ord, { normal: G.atoms[a].pdir || [0, 0, 1] }]);
    mol = new Mol(v, G.atoms.map((a) => ({ el: a.el, p: a.p.slice() })), bonds, { style: st.style });
    api.mol = mol;
    // anel do híbrido
    if (st.hybrid && def.kind !== 'fused' && G.atoms.slice(0, N).every((a) => a.hasP)) {
      const R = Math.hypot(G.atoms[0].p[0], G.atoms[0].p[1]) * 0.62;
      const t = new THREE.Mesh(new THREE.TorusGeometry(R, 0.035, 8, 64), new THREE.MeshStandardMaterial({ color: 0x3ddc97, emissive: 0x114422 }));
      grp.add(t);
    }
    // orbitais p
    if (st.p) G.atoms.slice(0, N).forEach((a, i) => { if (!a.hasP) return; const empty = a.e === 0; placeOrbital(grp, 'p', a.p, a.pdir, 0.1, { opacity: empty ? 0.22 : 0.6, colorA: st.phase ? PH_A : PH_A, colorB: st.phase ? PH_B : PH_A }); void i; });
    // nuvem π: segmentos contínuos de átomos com p
    if (st.cloud) {
      segments(G).forEach((seg) => { if (seg.length < 2) return; piCloud(grp, seg.map((i) => G.atoms[i].p), seg.map((i) => G.atoms[i].pdir), { frac: 0.36, n: 36, opacity: 0.48 }); });
    }
    if (st.esp) espCloud(grp, G, st.esp);
    // pares isolados
    if (st.lp) G.atoms.slice(0, N).forEach((a) => (a.lps || []).forEach((lp) => {
      if (lp.inPi && st.p) return; // já representado pelo orbital p
      const col = lp.inPi ? LP_PI : LP_IN;
      const m = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), new THREE.MeshStandardMaterial({ color: col, transparent: true, opacity: 0.45, depthWrite: false, emissive: col, emissiveIntensity: 0.3 }));
      const d = lp.dir;
      m.position.set(...V.add(a.p, V.mul(d, 0.62))); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...d)); m.scale.set(0.24, 0.42, 0.24);
      grp.add(m);
      if (lp.inPi) { const m2 = m.clone(); m2.position.set(...V.add(a.p, V.mul(d, -0.62))); m2.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...V.mul(d, -1))); m2.material = m.material.clone(); m2.material.opacity = 0.25; grp.add(m2); }
      const l = label(lp.inPi ? 'par no p (π)' : 'par no plano (sp²)', 'tag ' + (lp.inPi ? 'm' : 'c'));
      l.position.set(...V.add(a.p, V.mul(d, 1.15))); grp.add(l);
    }));
    // plano molecular
    if (st.plane) { const R = Math.max(...G.atoms.map((a) => Math.hypot(a.p[0], a.p[1]))) + 0.6; const pl = new THREE.Mesh(new THREE.CircleGeometry(R, 64), new THREE.MeshBasicMaterial({ color: 0x5b8cff, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false })); grp.add(pl); }
    // elétrons π por átomo / carga
    G.atoms.slice(0, N).forEach((a, i) => {
      const T = TYPES[a.type];
      const parts = [];
      if (st.e && a.hasP) parts.push(a.e + ' e⁻');
      if (st.e && !a.hasP) parts.push('sp³');
      if (T && T.q && T.q !== '•') parts.push(T.q);
      if (parts.length) mol.addLabel(i, parts.join(' '), 'tag ' + (a.hasP ? (a.e === 2 ? 'm' : 'c') : 'o'), V.mul(a.out || [0, 0, 1], 0.75));
    });
    if (st.sel !== null && st.sel !== undefined) [].concat(st.sel).forEach((i) => mol.halo(i, 0x3ddc97, 1.9));
    if (st.opm !== null && st.opm !== undefined) {
      const COL = { o: 0x3ddc97, m: 0xb18cff, p: 0x2fd4f5 };
      for (let j = 0; j < N; j++) { const d = ((j - st.opm) % N + N) % N; const r = ['ipso', 'o', 'm', 'p', 'm', 'o'][d]; if (r === 'ipso') continue; if (st.opmOnly && !st.opmOnly.includes(r)) continue; mol.halo(j, COL[r], 1.75); mol.addLabel(j, { o: 'orto', m: 'meta', p: 'para' }[r] + ' C' + (d + 1), 'tag ' + { o: 'g', m: 'v', p: 'c' }[r], V.mul(G.atoms[j].out, 1.25)); }
    }
    if (o.extra) o.extra(grp, G, api);
  }
  rebuild();
  if (v.ok && o.onPick) {
    const rc = new THREE.Raycaster(), ptr = new THREE.Vector2(); let down = null;
    v.renderer.domElement.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY]; });
    v.renderer.domElement.addEventListener('pointerup', (e) => {
      if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return;
      const r = v.renderer.domElement.getBoundingClientRect();
      ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      rc.setFromCamera(ptr, v.camera);
      const hit = rc.intersectObjects(mol.meshes)[0]; if (!hit) return;
      o.onPick(mol.meshes.indexOf(hit.object));
    });
  }
  return api;
}
const dist = (def) => (def.kind === 'fused' ? 8.5 + def.centers.length * 1.6 : 7.4 + (def.n || 6) * 0.22);
/** segmentos contínuos (cíclicos) de átomos do anel com orbital p */
export function segments(G) {
  const N = G.ringN, has = G.atoms.slice(0, N).map((a) => a.hasP);
  if (G.def.kind === 'fused' || has.every(Boolean)) return [[...Array(N).keys()]];
  const start = has.findIndex((x) => !x), segs = []; let cur = [];
  for (let t = 1; t <= N; t++) { const i = (start + t) % N; if (has[i]) cur.push(i); else { if (cur.length) segs.push(cur); cur = []; } }
  if (cur.length) segs.push(cur);
  return segs;
}
/** densidade π qualitativa colorida por cargas parciais atribuídas (vermelho = rica, azul = pobre) */
function espCloud(parent, G, charges) {
  const N = G.ringN, s = 0.2;
  const fs = G.atoms.slice(0, N).filter((a) => a.hasP).map((a) => p2(a.pdir, V.mul(a.p, 1 / s)));
  const f = (x, y, z) => { let t = 0; for (const g of fs) t += g(x / s, y / s, z / s); return t; };
  const R = Math.max(...G.atoms.slice(0, N).map((a) => Math.hypot(a.p[0], a.p[1]))) + 1.6;
  const S = surfaces(f, [-R, -R, -1.8, R, R, 1.8], 40, { frac: 0.3 });
  [S.plus, S.minus].forEach((P) => {
    const geo = isoGeom(P), pos = P.pos, col = new Float32Array(pos.length);
    for (let k = 0; k < pos.length; k += 3) {
      let pot = 0; G.atoms.slice(0, N).forEach((a, i) => { const d = Math.hypot(pos[k] - a.p[0], pos[k + 1] - a.p[1], pos[k + 2] - a.p[2]); pot += (charges[i] || 0) / Math.max(0.6, d); });
      const t = Math.max(-1, Math.min(1, pot / 0.16));
      const c = t < 0 ? [0.95, 0.35 + 0.6 * (1 + t), 0.3 + 0.5 * (1 + t)] : [0.35 + 0.6 * (1 - t), 0.6 + 0.3 * (1 - t), 0.98];
      col[k] = c[0]; col[k + 1] = c[1]; col[k + 2] = c[2];
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, transparent: true, opacity: 0.85, side: THREE.DoubleSide, roughness: 0.4 }));
    parent.add(m);
  });
}
/** orbital molecular de Hückel com fases (coeficientes c por átomo do anel) */
export function moScene(host, def, c, o = {}) {
  const v = new Viewer(host, { dist: o.dist || 8, hint: o.hint !== false, alt: 'Orbital molecular π (qualitativo)' });
  if (v.ok) v.setCamera([0, -5.2, 6.2]);
  const G = geometry(def);
  if (!v.ok) return { v };
  new Mol(v, G.atoms.map((a) => ({ el: a.el, p: a.p })), G.bonds.map(([a, b]) => [a, b, 1]), { style: 'ball' });
  const s = 0.2, N = G.ringN;
  const fs = G.atoms.slice(0, N).map((a, i) => ({ f: p2(a.pdir, V.mul(a.p, 1 / s)), w: c[i] }));
  const f = (x, y, z) => { let t = 0; for (const g of fs) if (Math.abs(g.w) > 1e-6) t += g.w * g.f(x / s, y / s, z / s); return t; };
  const R = Math.max(...G.atoms.slice(0, N).map((a) => Math.hypot(a.p[0], a.p[1]))) + 1.6;
  const S = surfaces(f, [-R, -R, -1.9, R, R, 1.9], o.n || 38, { frac: 0.3 });
  v.scene.add(new THREE.Mesh(isoGeom(S.plus), isoMat(PH_A, 0.75)), new THREE.Mesh(isoGeom(S.minus), isoMat(PH_B, 0.75)));
  return { v };
}
