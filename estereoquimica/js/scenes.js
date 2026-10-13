/*
 * scenes.js — cenas 3D: molécula com prioridades CIP e centros, câmera
 * "grupo 4 para trás", seta 1→2→3, espelho virtual, sobreposição,
 * transformação Fischer → 3D, plano de simetria e troca de grupos.
 */
import { THREE, Viewer, Mol, label } from './viewer3d.js';
import { V, rankCenter, descriptor, reflectMol, fitOverlay } from './stereo.js';

export const PCOL = [0xff9f43, 0xff4fa3, 0x3ddc97, 0x9fb0cc];
const CYAN = 0x2fd4f5;
const toAtoms = (mol, T) => mol.atoms.map((a) => ({ el: a.el, p: T ? T(a.p) : a.p.slice() }));
const toBonds = (mol) => mol.bonds.map(([i, j, o]) => [i, j, o, o > 1 ? { normal: [0, 0, 1] } : {}]);
function dropMol(v, mol) {
  if (!mol) return;
  const objs = []; mol.group.traverse((x) => { if (x.isCSS2DObject) objs.push(x); });
  objs.forEach((x) => x.parent.remove(x)); v.scene.remove(mol.group);
}
/** seta circular (tubo + cone) por uma lista de pontos */
function arcObj(scene, color = 0xffd45c) {
  const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.55 });
  const tube = new THREE.Mesh(new THREE.BufferGeometry(), mat), head = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.34, 16), mat);
  scene.add(tube); scene.add(head);
  return {
    set(pts) {
      const path = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
      tube.geometry.dispose(); tube.geometry = new THREE.TubeGeometry(path, 60, 0.045, 8, false);
      const e = pts[pts.length - 1], q = pts[pts.length - 2];
      head.position.set(...e); head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...V.norm(V.sub(e, q))));
    },
    show(v) { tube.visible = v; head.visible = v; },
  };
}
/** pontos de um arco 1 → 2 → 3 em torno do eixo centro → grupo 4 */
export function arcPoints(atoms, c, order, R = 1.05) {
  const C = atoms[c].p, n = V.norm(V.sub(atoms[order[3]].p, C));
  const d1 = V.norm(V.sub(atoms[order[0]].p, C));
  const e1 = V.norm(V.sub(d1, V.mul(n, V.dot(d1, n)))), e2 = V.cross(n, e1);
  const ang = (j) => { const d = V.norm(V.sub(atoms[j].p, C)); return Math.atan2(V.dot(d, e2), V.dot(d, e1)); };
  const a2 = ang(order[1]), a3 = ang(order[2]);
  const md = (x) => ((x % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  let s = 1; if (md(a2) > md(a3)) s = -1;
  const tot = s > 0 ? md(a3) : md(-a3);
  const O = V.add(C, V.mul(n, -0.62)), pts = [];
  for (let k = 0; k <= 40; k++) { const t = s * (0.12 + (tot - 0.24) * k / 40); pts.push(V.add(O, V.add(V.mul(e1, R * Math.cos(t)), V.mul(e2, R * Math.sin(t))))); }
  return pts;
}
/** átomos de um ramo (a partir de j, sem passar pelo centro c) */
export function branch(mol, c, j) {
  const seen = new Set([c, j]), out = [j], st = [j];
  while (st.length) { const a = st.pop(); mol.nb[a].forEach(([b]) => { if (!seen.has(b)) { seen.add(b); out.push(b); st.push(b); } }); }
  return out;
}

/** após sobrepor: translúcido + átomos que não coincidem em vermelho (pesados e H dos centros) */
function markBad(M3, mol, fit) {
  let n = 0;
  const cset = new Set(mol.centers || []);
  M3.meshes.forEach((m, i) => {
    m.material.transparent = true; m.material.opacity = 0.55;
    const isH = mol.atoms[i].el === 'H', onCenter = isH && mol.nb[i].some(([b]) => cset.has(b));
    if (fit.dev[i] > 0.5 && (!isH || onCenter)) { m.material.emissive.set(0xff3355); m.material.emissiveIntensity = 0.9; n++; }
  });
  return n;
}

/* ===================================================================
 * Visualizador de uma molécula
 * =================================================================== */
export function molView(host, mol0, o = {}) {
  const v = new Viewer(host, { camPos: o.camPos || [0, 0.6, 10], alt: o.alt || 'Modelo 3D da molécula', autoRotate: !!o.autoRotate });
  const api = { v, ok: v.ok };
  if (!v.ok) { const no = () => {}; return Object.assign(api, { setMol(m) { api.mol = m; }, setPrio: no, look4: no, showArrow: no, hideArrow: no, flyTo: no, group4Away: () => -1, toggle() { return false; }, reset: no, mol: mol0 }); }
  let cur = null, m3 = null, plabels = [], halos = [], arrow = arcObj(v.scene), center = null, style = o.style || 'ball', anim = null;
  arrow.show(false);
  function build(mol) {
    dropMol(v, m3); cur = mol; plabels = []; halos = [];
    m3 = new Mol(v, toAtoms(mol, o.T), toBonds(mol), { style });
    if (o.centers !== false) mol.centers.forEach((c) => { const h = m3.halo(c, CYAN, 1.9); halos.push(h); });
    api.mol3 = m3; api.mol = mol;
    if (center !== null && mol.centers.includes(center)) setPrio(center); else { center = null; arrow.show(false); }
    if (o.onBuild) o.onBuild(m3, mol);
  }
  function setPrio(c, show = true) {
    plabels.forEach((l) => m3.setLabel(l, null)); plabels = [];
    m3.meshes.forEach((mm, i) => { if (mm.material.emissive) mm.material.emissive.set(0); void i; });
    center = c; arrow.show(false);
    if (c === null || !show) return;
    const r = rankCenter(cur, c).order;
    r.forEach((j, k) => {
      m3.meshes[j].material.emissive.set(PCOL[k]); m3.meshes[j].material.emissiveIntensity = 0.55;
      const off = V.mul(V.norm(V.sub(m3.atoms[j].p, m3.atoms[c].p)), 0.55);
      plabels.push(m3.addLabel(j, String(k + 1), 'prio p' + (k + 1), off));
    });
  }
  function showArrow(on = true) {
    if (center === null || !on) { arrow.show(false); return; }
    arrow.set(arcPoints(m3.atoms, center, rankCenter(cur, center).order)); arrow.show(true);
  }
  /** câmera do lado oposto ao grupo 4 (grupo 4 para trás) */
  function look4(c = center, on = true) {
    if (c === null || c === undefined) return;
    const r = rankCenter(cur, c).order, C = m3.atoms[c].p, v4 = V.norm(V.sub(m3.atoms[r[3]].p, C));
    const target = on ? V.add(C, V.mul(v4, -9)) : (o.camPos || [0, 0.6, 10]);
    const from = v.camera.position.toArray(), t0 = performance.now();
    const tgt0 = v.controls.target.toArray(), tgt1 = on ? C : [0, 0, 0];
    anim = () => { const k = Math.min(1, (performance.now() - t0) / 1100), s = k * k * (3 - 2 * k); v.controls.target.set(...V.lerp(tgt0, tgt1, s)); v.camera.position.set(...V.lerp(from, target, s)); if (k >= 1) { anim = null; if (on) showArrow(true); } };
  }
  /** o grupo 4 está apontando para longe do observador? (produto escalar com a direção da câmera) */
  function group4Away(c = center) {
    const r = rankCenter(cur, c).order, C = m3.atoms[c].p, v4 = V.norm(V.sub(m3.atoms[r[3]].p, C));
    const cam = V.norm(V.sub(v.camera.position.toArray(), C));
    return V.dot(v4, cam);
  }
  v.onFrame(() => { if (anim) anim(); });
  const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
  v.renderer.domElement.addEventListener('click', (e) => {
    if (!o.onPick || !m3) return;
    const r = v.renderer.domElement.getBoundingClientRect();
    mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(mouse, v.camera);
    const hit = ray.intersectObjects(m3.meshes)[0];
    if (hit) o.onPick(m3.meshes.indexOf(hit.object));
  });
  build(mol0);
  return Object.assign(api, {
    setMol: build, setPrio, look4, showArrow, group4Away,
    flyTo(pos, tgt = [0, 0, 0], ms = 1200) { const from = v.camera.position.toArray(), t0 = performance.now(), tg0 = v.controls.target.toArray(); anim = () => { const k = Math.min(1, (performance.now() - t0) / ms), s = k * k * (3 - 2 * k); v.controls.target.set(...V.lerp(tg0, tgt, s)); v.camera.position.set(...V.lerp(from, pos, s)); if (k >= 1) anim = null; }; },
    hideArrow: () => arrow.show(false),
    toggle(k) { if (k === 'space') { style = style === 'ball' ? 'space' : 'ball'; m3.setStyle(style); return style === 'space'; } if (k === 'centers') { const on = !(halos[0] && halos[0].on); halos.forEach((h) => { h.on = on; }); return on; } return false; },
    reset() { anim = null; v.setCamera(o.camPos || [0, 0.6, 10], [0, 0, 0]); arrow.show(false); },
    get center() { return center; },
  });
}

/* ===================================================================
 * Espelho virtual + tentativa de sobreposição
 * =================================================================== */
export function mirrorScene(host, mol0, o = {}) {
  const v = new Viewer(host, { camPos: o.camPos || [4.2, 2.6, 13.5], alt: 'Molécula, espelho e imagem especular' });
  if (!v.ok) return { v, setMol() {}, overlay() {}, reset() {}, showImage() {} };
  const DX = 3.4;
  let A = null, B = null, mol = null, img = null, anim = null, bad = [];
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(0.02, 1), new THREE.MeshBasicMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false }));
  plane.geometry = new THREE.PlaneGeometry(7, 6); plane.rotation.y = Math.PI / 2; v.scene.add(plane);
  const edge = new THREE.LineSegments(new THREE.EdgesGeometry(plane.geometry), new THREE.LineBasicMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0.6 })); edge.rotation.y = Math.PI / 2; v.scene.add(edge);
  const lab = label('espelho', 'tag c'); lab.position.set(0, 3.3, 0); v.scene.add(lab);
  function build(m) {
    dropMol(v, A); dropMol(v, B); mol = m; img = reflectMol(m);
    A = new Mol(v, toAtoms(m, (p) => [p[0] - DX, p[1], p[2]]), toBonds(m));
    B = new Mol(v, toAtoms(m, (p) => [-p[0] + DX, p[1], p[2]]), toBonds(m));
    m.centers.forEach((c) => { A.halo(c, CYAN, 1.9); B.halo(c, CYAN, 1.9); });
    plane.visible = edge.visible = lab.visible = true;
    bad = [];
  }
  v.onFrame(() => { if (anim) anim(); });
  build(mol0);
  return {
    v,
    setMol: build,
    /** desliza a imagem até a molécula original pela melhor rotação própria */
    overlay(done) {
      const fit = fitOverlay(mol, img);
      const start = B.atoms.map((x) => x.p.slice()), endPos = fit.end.map((p) => [p[0] - DX, p[1], p[2]]);
      const t0 = performance.now();
      plane.visible = edge.visible = lab.visible = false;
      anim = () => {
        const k = Math.min(1, (performance.now() - t0) / 1800), s = k * k * (3 - 2 * k);
        B.atoms.forEach((x, i) => B.setPos(i, V.lerp(start[i], endPos[i], s)));
        B.update();
        if (k >= 1) { anim = null; const nb = markBad(B, img, fit); if (done) done({ rmsd: fit.rmsd, bad: nb }); }
      };
    },
    reset() { anim = null; build(mol); },
    showImage(on) { if (B) B.group.visible = on; return on; },
    get img() { return img; },
  };
}

/* ===================================================================
 * Duas moléculas lado a lado; B pode ser girada; verificar sobreposição
 * =================================================================== */
export function pairScene(host, molA, molB, o = {}) {
  const v = new Viewer(host, { camPos: [0, 1.8, 14], alt: 'Duas moléculas para comparar' });
  if (!v.ok) return { v, rotB() {}, check() {}, set() {} };
  const DX = 3.2;
  let A = null, B = null, mA = null, mB = null, anim = null, q = new THREE.Quaternion();
  function build(a, b, rotInit) {
    dropMol(v, A); dropMol(v, B); mA = a; mB = b; q = new THREE.Quaternion();
    if (rotInit) q.setFromEuler(new THREE.Euler(...rotInit));
    A = new Mol(v, toAtoms(a, (p) => [p[0] - DX, p[1], p[2]]), toBonds(a));
    B = new Mol(v, toAtoms(b), toBonds(b));
    a.centers.forEach((c) => A.halo(c, CYAN, 1.9)); b.centers.forEach((c) => B.halo(c, CYAN, 1.9));
    place();
  }
  function place() { mB.atoms.forEach((at, i) => { const w = new THREE.Vector3(...at.p).applyQuaternion(q); B.setPos(i, [w.x + DX, w.y, w.z]); }); B.update(); }
  v.onFrame(() => { if (anim) anim(); });
  build(molA, molB, o.rotInit);
  return {
    v,
    set(a, b, rotInit) { anim = null; build(a, b, rotInit); },
    rotB(axis, deg) {
      const q0 = q.clone(), dq = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(...axis), deg * Math.PI / 180), q1 = dq.multiply(q0), t0 = performance.now();
      anim = () => { const k = Math.min(1, (performance.now() - t0) / 500); q.copy(q0).slerp(q1, k); place(); if (k >= 1) anim = null; };
    },
    check(done) {
      const fit = fitOverlay(mA, mB);
      if (!fit) { if (done) done(null); return; }
      const start = B.atoms.map((x) => x.p.slice()), ends = fit.end.map((p) => [p[0] - DX, p[1], p[2]]), t0 = performance.now();
      anim = () => { const k = Math.min(1, (performance.now() - t0) / 1500), s = k * k * (3 - 2 * k); B.atoms.forEach((x, i) => B.setPos(i, V.lerp(start[i], ends[i], s))); B.update(); if (k >= 1) { anim = null; const nb = markBad(B, mB, fit); if (done) done({ rmsd: fit.rmsd, bad: nb }); } };
    },
  };
}

/* ===================================================================
 * Fischer → 3D: a cruz "ganha profundidade"
 * =================================================================== */
export function fischer3D(host, mol, o = {}) {
  const v = new Viewer(host, { camPos: [0, 0, 11], alt: 'Projeção de Fischer transformando-se em modelo 3D' });
  if (!v.ok) return { v, set() {}, play() {}, plane() { return false; } };
  const F = mol.fischer;
  const base = F.atoms.map((a) => a.p.slice());
  const m3 = new Mol(v, toAtoms(F, (p) => [p[0], p[1], 0]), toBonds(F));
  F.centers = mol.centers.map((c) => F.C[mol.C.indexOf(c)]);
  F.centers.forEach((c) => m3.halo(c, CYAN, 1.9));
  const lf = label('horizontal → para a frente', 'tag o'), lb = label('vertical → para trás', 'tag m');
  v.scene.add(lf); v.scene.add(lb); lf.visible = lb.visible = false;
  let plane = null;
  if (o.plane) {
    const C0 = F.atoms[F.C[0]].p, C1 = F.atoms[F.C[1]].p, mid = V.lerp(C0, C1, 0.5), n = V.norm(V.sub(C1, C0));
    plane = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 5.5), new THREE.MeshBasicMaterial({ color: 0x3ddc97, transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false }));
    plane.position.set(...mid); plane.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(...n)); plane.visible = false; v.scene.add(plane);
  }
  let t = 0, anim = null;
  function set(s) {
    t = s;
    F.atoms.forEach((a, i) => m3.setPos(i, [base[i][0], base[i][1], base[i][2] * s]));
    m3.update();
    lf.visible = lb.visible = s > 0.9 && !o.plane;
    const C = F.atoms[F.C[0]].p; lf.position.set(C[0] + 1.6, C[1] + 0.6, 1.2); lb.position.set(C[0], C[1] + 2.1, -1.0);
  }
  v.onFrame(() => { if (anim) anim(); });
  set(o.t0 !== undefined ? o.t0 : 0);
  return {
    v, mol3: m3,
    set,
    play(to = 1, side = true) {
      const from = t, t0 = performance.now(), cam0 = v.camera.position.toArray(), cam1 = side && to > 0.5 ? [7.5, 2.5, 7.5] : [0, 0, 11];
      anim = () => { const k = Math.min(1, (performance.now() - t0) / 1600), s = k * k * (3 - 2 * k); set(from + (to - from) * s); v.camera.position.set(...V.lerp(cam0, cam1, s)); v.camera.lookAt(0, 0, 0); if (k >= 1) anim = null; };
    },
    plane(on) { if (plane) plane.visible = on; return on; },
  };
}

/* ===================================================================
 * Centro com 4 grupos: trocar dois grupos (animação) e girar × refletir
 * =================================================================== */
export function swapScene(host, mol, o = {}) {
  const v = new Viewer(host, { camPos: [3.5, 3, 8], alt: 'Troca de dois grupos em um centro estereogênico' });
  if (!v.ok) return { v, swap() {}, desc: () => null, lig: [] };
  const c = mol.centers[0];
  const m3 = new Mol(v, toAtoms(mol), toBonds(mol));
  m3.halo(c, CYAN, 1.9);
  const live = { atoms: m3.atoms, nb: mol.nb, groupAt: mol.groupAt, C: mol.C, info: mol.info, spec: mol.spec };
  const lig = mol.nb[c].map(([j]) => j);
  const br = {}; lig.forEach((j) => { br[j] = branch(mol, c, j); });
  const rk = rankCenter(mol, c).order;
  const labels = {}; rk.forEach((j, k) => { m3.meshes[j].material.emissive.set(PCOL[k]); m3.meshes[j].material.emissiveIntensity = 0.55; labels[j] = m3.addLabel(j, String(k + 1), 'prio p' + (k + 1), V.mul(V.norm(V.sub(m3.atoms[j].p, m3.atoms[c].p)), 0.55)); });
  let anim = null;
  v.onFrame(() => { if (anim) anim(); });
  const rotTo = (pts, C, from, to, t) => { // gira os pontos do ramo da direção 'from' para 'to' (fração t)
    const a = new THREE.Vector3(...V.norm(from)), b = new THREE.Vector3(...V.norm(to));
    const q = new THREE.Quaternion().setFromUnitVectors(a, b); const qi = new THREE.Quaternion().slerp(q, t);
    return pts.map((p) => { const w = new THREE.Vector3(...V.sub(p, C)).applyQuaternion(qi); return V.add(C, [w.x, w.y, w.z]); });
  };
  return {
    v, lig,
    desc: () => descriptor(live, c),
    swap(j1, j2, done) {
      const C = m3.atoms[c].p;
      const s1 = br[j1].map((i) => m3.atoms[i].p.slice()), s2 = br[j2].map((i) => m3.atoms[i].p.slice());
      const d1 = V.sub(m3.atoms[j1].p, C), d2 = V.sub(m3.atoms[j2].p, C), t0 = performance.now();
      anim = () => {
        const k = Math.min(1, (performance.now() - t0) / 1200), s = k * k * (3 - 2 * k);
        rotTo(s1, C, d1, d2, s).forEach((p, n) => m3.setPos(br[j1][n], p));
        rotTo(s2, C, d2, d1, s).forEach((p, n) => m3.setPos(br[j2][n], p));
        [j1, j2].forEach((j) => { labels[j].off = V.mul(V.norm(V.sub(m3.atoms[j].p, C)), 0.55); });
        m3.update();
        if (k >= 1) { anim = null; if (done) done(descriptor(live, c)); }
      };
    },
  };
}
export function rotReflScene(host, mol) {
  const v = new Viewer(host, { camPos: [0, 1.5, 15], alt: 'Rotação × reflexão' });
  if (!v.ok) return { v, rotate() {}, reflect() {} };
  const DX = 3.3;
  const A = new Mol(v, toAtoms(mol, (p) => [p[0] - DX, p[1], p[2]]), toBonds(mol));
  const B = new Mol(v, toAtoms(mol, (p) => [p[0] + DX, p[1], p[2]]), toBonds(mol));
  mol.centers.forEach((c) => { A.halo(c, CYAN, 1.9); B.halo(c, CYAN, 1.9); });
  const la = label('', 'tag c big'), lb = label('', 'tag m big'); v.scene.add(la); v.scene.add(lb); la.position.set(-DX, -2.8, 0); lb.position.set(DX, -2.8, 0);
  const d0 = mol.desc.find(Boolean);
  la.userData.div.textContent = 'girar: ' + d0; lb.userData.div.textContent = 'refletir: ' + d0;
  let anim = null;
  v.onFrame(() => { if (anim) anim(); });
  return {
    v,
    rotate() { const t0 = performance.now(); anim = () => { const k = Math.min(1, (performance.now() - t0) / 2400), a = k * 2 * Math.PI; mol.atoms.forEach((at, i) => { const [x, y, z] = at.p; const c = Math.cos(a), s = Math.sin(a); A.setPos(i, [x * c + z * s - DX, y, -x * s + z * c]); }); A.update(); la.userData.div.textContent = `girar ${Math.round(k * 360)}°: continua ${d0}`; if (k >= 1) anim = null; }; },
    reflect() { const t0 = performance.now(); anim = () => { const k = Math.min(1, (performance.now() - t0) / 2000), sx = 1 - 2 * (k * k * (3 - 2 * k)); mol.atoms.forEach((at, i) => B.setPos(i, [at.p[0] * sx + DX, at.p[1], at.p[2]])); B.update(); lb.userData.div.textContent = k < 1 ? 'refletindo…' : `refletido: ${d0 === 'R' ? 'S' : 'R'} (enantiômero)`; if (k >= 1) anim = null; }; },
  };
}
