/*
 * scene3d.js — cenas 3D: molécula (VSEPR) com pares isolados, ângulos,
 * hibridização, ligações σ (laranja) e π (magenta), orbitais p e híbridos
 * (isosuperfícies reais de ψ), seleção de átomos; orbitais isolados;
 * instantâneos estáticos (imagens) para exercícios.
 */
import { THREE, Viewer, Mol, label } from './viewer3d.js';
import { to3D, centerInfo, nbs, angle3, V } from './struct.js';
import { surfaces, cube, p2, hyb, s1 } from './orbitals.js';

export const PH_A = 0x2fd4f5, PH_B = 0xffd45c, SIGMA = 0xff9f43, PI = 0xff4fa3, LPC = 0x7fe3ff;
const UP = new THREE.Vector3(0, 0, 1);

/* ---------- malhas de isosuperfície ---------- */
export function isoGeom(S) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(S.pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(S.nor, 3));
  return g;
}
export function isoMat(color, opacity = 0.72, o = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.05, transparent: opacity < 1, opacity, side: THREE.DoubleSide, depthWrite: true, emissive: color, emissiveIntensity: 0.12, clippingPlanes: o.clip || null, wireframe: !!o.wire });
}
/** grupo com as duas fases de uma função */
export function orbitalGroup(f, box, n, o = {}) {
  const S = surfaces(f, box, n, o);
  const grp = new THREE.Group();
  const mA = new THREE.Mesh(isoGeom(S.plus), isoMat(o.colorA ?? PH_A, o.opacity ?? 0.72, o));
  const mB = new THREE.Mesh(isoGeom(S.minus), isoMat(o.colorB ?? PH_B, o.opacity ?? 0.72, o));
  grp.add(mA, mB);
  grp.userData = { mA, mB, S };
  return grp;
}
/* modelos (em Å) de orbitais centrados na origem, ao longo de +z; reutilizados */
const TPL = {};
export function template(kind, q = 34, isoV) {
  const key = kind + q + (isoV || '');
  if (TPL[key]) return TPL[key];
  const f = kind === 'p' ? p2([0, 0, 1]) : kind === 's' ? s1() : hyb({ sp3: 3, sp2: 2, sp: 1 }[kind], [0, 0, 1]);
  const L = kind === 's' ? 4 : kind === 'p' ? 10.5 : 12;
  const S = surfaces(f, cube(L, kind === 'p' || kind === 's' ? [0, 0, 0] : [0, 0, 3]), q, { iso: isoV || (kind === 's' ? 0.06 : kind === 'p' ? 0.019 : 0.03) });
  TPL[key] = { plus: isoGeom(S.plus), minus: isoGeom(S.minus) };
  return TPL[key];
}
export function placeOrbital(parent, kind, pos, dir, scale, o = {}) {
  const T = template(kind, 34, o.iso);
  const g = new THREE.Group();
  const a = new THREE.Mesh(T.plus, isoMat(o.colorA ?? PH_A, o.opacity ?? 0.62)), b = new THREE.Mesh(T.minus, isoMat(o.colorB ?? PH_B, o.opacity ?? 0.62));
  g.add(a, b);
  g.position.set(...pos);
  g.quaternion.setFromUnitVectors(UP, new THREE.Vector3(...V.norm(dir)));
  g.scale.setScalar(scale);
  parent.add(g);
  return g;
}
/** nuvem π (densidade) de um conjunto de orbitais p paralelos: soma em fase */
export function piCloud(parent, centers, dirs, o = {}) {
  const s = o.s || 0.2; // Å por unidade atômica (esquemático)
  const fs = centers.map((c, k) => p2(dirs[k], V.mul(c, 1 / s)));
  const f = (x, y, z) => { let t = 0; for (const g of fs) t += g(x / s, y / s, z / s); return t; };
  let mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
  centers.forEach((c) => { mn = mn.map((v, k) => Math.min(v, c[k])); mx = mx.map((v, k) => Math.max(v, c[k])); });
  const pad = 1.6, box = [mn[0] - pad, mn[1] - pad, mn[2] - pad, mx[0] + pad, mx[1] + pad, mx[2] + pad];
  const S = surfaces(f, box, o.n || 34, { frac: o.frac || 0.42 });
  const grp = new THREE.Group();
  if (o.phase) grp.add(new THREE.Mesh(isoGeom(S.plus), isoMat(PH_A, 0.55)), new THREE.Mesh(isoGeom(S.minus), isoMat(PH_B, 0.55)));
  else grp.add(new THREE.Mesh(isoGeom(S.plus), isoMat(o.color ?? PI, o.opacity ?? 0.42)), new THREE.Mesh(isoGeom(S.minus), isoMat(o.color ?? PI, o.opacity ?? 0.42)));
  parent.add(grp);
  return grp;
}

/* ===================================================================
 * Cena molecular
 * o: { style, lp, angles, hyb, sp (σ/π), p (orbitais p), cloud (nuvem π), hybOrb (i | 'all'), pick(i), sel }
 * =================================================================== */
export function molScene(host, LS, o = {}) {
  const v = new Viewer(host, { dist: o.dist || 7.5, autoRotate: !!o.spin, hint: o.hint !== false, alt: o.alt || ('Modelo 3D de ' + (LS.name || 'molécula')) });
  const st = Object.assign({ style: 'ball', lp: false, angles: false, hyb: false, sp: false, p: false, cloud: false, hybOrb: null, sel: null, numbers: false }, o);
  if (!o.cam && v.ok) { const D = o.dist || 7.5; v.setCamera([D * 0.42, D * 0.38, D * 0.82]); }
  if (o.cam && v.ok) v.setCamera(o.cam);
  let G = to3D(LS), mol = null, extra = null, lbls = [];
  const api = { v, LS, G, st, set, select, rebuild, atomInfo: (i) => centerInfo(LS, i) };
  function clearExtra() {
    if (extra) { v.scene.remove(extra); extra.traverse((x) => { if (x.material) x.material.dispose(); }); }
    extra = new THREE.Group(); v.scene.add(extra);
  }
  function rebuild() {
    if (!v.ok) return;
    if (mol) { v.scene.remove(mol.group); mol.labels.forEach((l) => l.obj.removeFromParent()); }
    lbls.forEach((l) => l.removeFromParent()); lbls = [];
    G = to3D(LS); api.G = G;
    const bonds = G.bonds.map(([a, b, ord, arom]) => {
      const order = st.sp ? 1 : arom ? 1 : ord;
      const pd = (G.pdirs[a] || G.pdirs[b] || [])[0];
      return [a, b, order, { normal: pd || null }];
    });
    mol = new Mol(v, G.atoms.map((a) => ({ el: a.el, p: a.p.slice() })), bonds, { style: st.style });
    api.mol = mol;
    if (st.sp) mol.bondMeshes.forEach((ms) => ms.forEach((m) => { m.material.color.setHex(SIGMA); m.material.emissive = new THREE.Color(0x331a00); }));
    clearExtra();
    // pares isolados
    if (st.lp) G.lps.forEach(({ i, dir }) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), new THREE.MeshStandardMaterial({ color: LPC, transparent: true, opacity: 0.38, depthWrite: false, emissive: LPC, emissiveIntensity: 0.3 }));
      const p = G.atoms[i].p; m.position.set(...V.add(p, V.mul(dir, 0.62))); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...dir)); m.scale.set(0.24, 0.42, 0.24);
      extra.add(m);
      [-1, 1].forEach((s) => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff })); const side = V.norm(V.cross(dir, Math.abs(dir[2]) > 0.9 ? [1, 0, 0] : [0, 0, 1])); e.position.set(...V.add(V.add(p, V.mul(dir, 0.7)), V.mul(side, 0.09 * s))); extra.add(e); });
    });
    // orbitais p não hibridizados
    if (st.p) Object.entries(G.pdirs).forEach(([i, dirs]) => { if (st.pOnly && !st.pOnly.includes(+i)) return; dirs.forEach((d) => placeOrbital(extra, 'p', G.atoms[i].p, d, 0.095, { opacity: 0.55 })); });
    // nuvens π
    if (st.cloud) {
      if (G.ring) piCloud(extra, G.ring.map((i) => G.atoms[i].p), G.ring.map(() => [0, 0, 1]), { frac: 0.45 });
      G.piBonds.forEach((pb) => piCloud(extra, [G.atoms[pb.a].p, G.atoms[pb.b].p], [pb.dir, pb.dir], { frac: 0.42 }));
      if (st.cloudExtra) st.cloudExtra(extra, G);
    }
    // orbitais híbridos de um átomo (ou todos)
    if (st.hybOrb !== null && st.hybOrb !== undefined) {
      const list = st.hybOrb === 'all' ? G.atoms.map((_, i) => i).filter((i) => G.atoms[i].el !== 'H') : [st.hybOrb];
      list.forEach((i) => {
        const info = centerInfo(LS, i), k = { 'sp³': 'sp3', 'sp²': 'sp2', sp: 'sp' }[info.hyb];
        if (!k) return;
        const p = G.atoms[i].p;
        nbs(LS, i).forEach(({ j }) => placeOrbital(extra, k, p, V.sub(G.atoms[j].p, p), 0.15, { opacity: 0.55, iso: 0.05 }));
        G.lps.filter((x) => x.i === i).forEach(({ dir }) => placeOrbital(extra, k, p, dir, 0.15, { opacity: 0.55, iso: 0.05 }));
        (G.pdirs[i] || []).forEach((d) => placeOrbital(extra, 'p', p, d, 0.1, { opacity: 0.3, colorA: 0xb18cff, colorB: 0x8f6bff }));
      });
    }
    // rótulos
    G.atoms.forEach((a, i) => {
      if (a.el === 'H') return;
      const info = centerInfo(LS, i);
      const parts = [];
      if (st.numbers) parts.push(a.el + (i + 1));
      if (st.hyb && info.hyb) parts.push(info.hyb);
      if (info.fc) parts.push(info.fc > 0 ? '+' : '−');
      if (parts.length) mol.addLabel(i, parts.join(' '), 'tag ' + (st.hyb ? 'c' : ''), [0, 0.62, 0]);
    });
    if (st.angles) showAngles(st.sel ?? null);
    if (st.sel !== null && st.sel !== undefined) mol.halo(st.sel, 0x3ddc97, 1.9);
  }
  function showAngles(only) {
    const centers = only !== null ? [only] : G.atoms.map((_, i) => i).filter((i) => nbs(LS, i).length >= 2);
    centers.forEach((i) => {
      const N = nbs(LS, i).map(({ j }) => j);
      if (N.length < 2) return;
      const seen = new Set();
      for (let p = 0; p < N.length; p++) for (let q = p + 1; q < N.length; q++) {
        const ang = angle3(G.atoms[N[p]].p, G.atoms[i].p, G.atoms[N[q]].p);
        const key = Math.round(ang);
        if (seen.has(key) && only === null) continue;
        seen.add(key);
        const mid = V.add(G.atoms[i].p, V.mul(V.norm(V.add(V.norm(V.sub(G.atoms[N[p]].p, G.atoms[i].p)), V.norm(V.sub(G.atoms[N[q]].p, G.atoms[i].p)))), 0.62));
        const l = label((Math.abs(ang - Math.round(ang)) > 0.2 ? ang.toFixed(1) : Math.round(ang).toFixed(0)).replace('.', ',') + '°', 'tag o');
        l.position.set(...(V.len(V.sub(mid, G.atoms[i].p)) < 0.1 ? V.add(G.atoms[i].p, [0, 0.6, 0]) : mid));
        extra.add(l); lbls.push(l);
        // arco
        const a = V.norm(V.sub(G.atoms[N[p]].p, G.atoms[i].p)), b = V.norm(V.sub(G.atoms[N[q]].p, G.atoms[i].p));
        const pts = []; for (let t = 0; t <= 16; t++) { const w = V.norm(V.add(V.mul(a, 1 - t / 16), V.mul(b, t / 16))); pts.push(new THREE.Vector3(...V.add(G.atoms[i].p, V.mul(V.norm(slerp(a, b, t / 16)), 0.42)))); void w; }
        extra.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: SIGMA })));
        if (only === null && seen.size >= 2) break;
      }
    });
  }
  function set(k, val) { st[k] = val; rebuild(); }
  function select(i) { st.sel = i; rebuild(); if (o.onSelect) o.onSelect(i); }
  rebuild();
  // seleção por clique
  if (v.ok && (o.pick || o.onSelect)) {
    const rc = new THREE.Raycaster(), ptr = new THREE.Vector2();
    let down = null;
    v.renderer.domElement.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY]; });
    v.renderer.domElement.addEventListener('pointerup', (e) => {
      if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return;
      const r = v.renderer.domElement.getBoundingClientRect();
      ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      rc.setFromCamera(ptr, v.camera);
      const hit = rc.intersectObjects(mol.meshes)[0];
      if (!hit) return;
      const i = mol.meshes.indexOf(hit.object);
      if (o.pickH === false && G.atoms[i].el === 'H') return;
      select(i);
    });
  }
  return api;
}
function slerp(a, b, t) { const d = Math.max(-1, Math.min(1, V.dot(a, b))), th = Math.acos(d); if (th < 1e-3) return a; const s = Math.sin(th); return V.add(V.mul(a, Math.sin((1 - t) * th) / s), V.mul(b, Math.sin(t * th) / s)); }

/* ===================================================================
 * Cena de orbital isolado (laboratório)
 * =================================================================== */
export function orbitalScene(host, o = {}) {
  const v = new Viewer(host, { dist: o.dist || 26, hint: o.hint !== false, alt: 'Isosuperfície de orbital (qualitativa)' });
  if (v.ok) v.renderer.localClippingEnabled = true;
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);
  let grp = null;
  const axes = new THREE.Group();
  // raiz com o eixo z da química na vertical da tela
  const root = new THREE.Group(); root.rotation.x = -Math.PI / 2;
  if (v.ok) {
    v.scene.add(root);
    const D = o.dist || 26; v.setCamera([D * 0.42, D * 0.28, D * 0.86]);
    const L = o.axis || 12;
    [[1, 0, 0, 0xff6b6b], [0, 1, 0, 0x6bff9b], [0, 0, 1, 0x6b9bff]].forEach(([x, y, z, c]) => axes.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-x * L, -y * L, -z * L), new THREE.Vector3(x * L, y * L, z * L)]), new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: 0.45 }))));
    ['x', 'y', 'z'].forEach((t, k) => { const l = label(t, 'tag'); l.position.set(k === 0 ? L : 0, k === 1 ? L : 0, k === 2 ? L : 0); axes.add(l); });
    root.add(axes);
    const nuc = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    root.add(nuc); axes.userData.nuc = nuc;
  }
  const api = {
    v,
    show(f, box, n, opt = {}) {
      if (!v.ok) return;
      if (grp) { root.remove(grp); grp.traverse((x) => { if (x.geometry) x.geometry.dispose(); if (x.material) x.material.dispose(); }); }
      grp = orbitalGroup(f, box, n, Object.assign({ clip: opt.cut ? [plane] : null }, opt));
      root.add(grp);
      api.grp = grp;
      return grp;
    },
    phases(on) { if (grp) { grp.userData.mB.material.color.setHex(on ? PH_B : PH_A); grp.userData.mB.material.emissive.setHex(on ? PH_B : PH_A); } },
    axes(on) { axes.visible = on; },
    nuclei(list) { axes.userData.nuc.visible = !list; if (api.nucs) api.nucs.forEach((m) => root.remove(m)); api.nucs = (list || []).map((p) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffffff })); m.position.set(...p); root.add(m); return m; }); },
    plane, root,
  };
  return api;
}

/* ===================================================================
 * Instantâneos (imagens estáticas) — um único renderizador compartilhado
 * =================================================================== */
let SNAP = null;
export function snapshot(build, o = {}) {
  try {
    if (!SNAP) {
      const c = document.createElement('canvas');
      const r = new THREE.WebGLRenderer({ canvas: c, antialias: true, alpha: true, preserveDrawingBuffer: true });
      r.outputColorSpace = THREE.SRGBColorSpace;
      SNAP = { r };
    }
    const w = o.w || 260, h = o.h || 200;
    SNAP.r.setSize(w, h, false);
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xdfe9ff, 0x1a2238, 1.6));
    const d1 = new THREE.DirectionalLight(0xffffff, 2.2); d1.position.set(4, 6, 8); scene.add(d1);
    const cam = new THREE.PerspectiveCamera(36, w / h, 0.1, 200);
    cam.position.set(...(o.cam || [0, 1.2, 8])); cam.lookAt(0, 0, 0);
    const fake = { ok: true, scene, onFrame() {} };
    build(fake, scene);
    SNAP.r.render(scene, cam);
    const url = SNAP.r.domElement.toDataURL('image/png');
    scene.traverse((x) => { if (x.material && !x.material.isShared) x.material.dispose(); });
    return url;
  } catch (e) { return null; }
}
export function molImage(LS, o = {}) {
  return snapshot((fake) => {
    const G = to3D(LS);
    const m = new Mol(fake, G.atoms.map((a) => ({ el: a.el, p: a.p })), G.bonds.map(([a, b, ord, arom]) => [a, b, arom ? 1 : ord, { normal: (G.pdirs[a] || G.pdirs[b] || [])[0] || null }]), { style: 'ball' });
    if (o.lp) G.lps.forEach(({ i, dir }) => { const s = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), new THREE.MeshStandardMaterial({ color: LPC, transparent: true, opacity: 0.4 })); s.position.set(...V.add(G.atoms[i].p, V.mul(dir, 0.62))); s.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...dir)); s.scale.set(0.24, 0.42, 0.24); fake.scene.add(s); });
    if (o.rot) m.group.rotation.set(...o.rot);
  }, o);
}
export function orbitalImage(f, box, n, o = {}) {
  return snapshot((fake, scene) => { const g = orbitalGroup(f, box, n, o); const r = new THREE.Group(); r.rotation.x = -Math.PI / 2; r.add(g); const w = new THREE.Group(); w.add(r); if (o.rot) w.rotation.set(...o.rot); scene.add(w); }, Object.assign({ cam: [0, 0, o.dist || 26] }, o));
}
