/*
 * scenes.js — cenas 3D: rotor C–C (rotação, diedro, planos, olhar ao longo
 * da ligação, Shift/Ctrl + arrastar), anéis C3–C6 (com dobra/pseudorrotação)
 * e ciclo-hexano (cadeira, barco, inversão, axial/equatorial, up/down,
 * interações 1,3-diaxiais, substituintes, seleção de posições).
 */
import { THREE, Viewer, Mol, label, groupTemplate, placeGroup, line3 } from './viewer3d.js';
import { V, GROUPS, rotorGeom, ringGeom, flipParams, mainDihedral, ROTORS } from './conf.js';

export function makeClock(onSet, o = {}) {
  const st = { s: 0, playing: false, dur: o.dur || 4, speed: 1, from: 0, to: 1 };
  const api = {
    get s() { return st.s; },
    set(s) { st.s = Math.max(0, Math.min(1, s)); onSet(st.s); },
    play(to = 1) { st.to = to; st.playing = true; api.onState && api.onState(true); },
    pause() { st.playing = false; api.onState && api.onState(false); },
    speed(k) { st.speed = k; },
    get playing() { return st.playing; },
    tick(dt) {
      if (!st.playing) return;
      const dirn = st.to > st.s ? 1 : -1;
      let s = st.s + dirn * dt * st.speed / st.dur;
      if ((dirn > 0 && s >= st.to) || (dirn < 0 && s <= st.to)) { s = st.to; st.playing = false; api.onState && api.onState(false); }
      st.s = s; onSet(s);
    },
  };
  return api;
}
const FRONT = 0xff9f43, BACK = 0xff4fa3, AXIS = 0x2fd4f5;

/* ===================================================================
 * Rotor
 * =================================================================== */
export function rotorScene(host, R, o = {}) {
  const v = new Viewer(host, { camPos: o.camPos || [4.2, 2.6, 6.2], alt: o.alt || 'Modelo 3D com rotação em torno da ligação C–C' });
  if (!v.ok) return { v, set() {}, setRotor() {}, look() {}, toggle() { return false; } };
  const st = { R, phi: o.phi || 0, style: o.style || 'ball', planes: false, dir: 'fwd' };
  let mol = null, parts = [], planeM = [], dLabel = null;
  const mats = [];
  const planeMesh = (color) => {
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12), 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }));
    v.scene.add(m); m.visible = false; return m;
  };
  planeM = [planeMesh(FRONT), planeMesh(BACK)];
  function build() {
    if (mol) { const objs = []; mol.group.traverse((x) => { if (x.isCSS2DObject) objs.push(x); }); objs.forEach((x) => x.parent.remove(x)); v.scene.remove(mol.group); }
    const G = rotorGeom(st.R, st.phi);
    const atoms = [{ el: 'C', p: G.Cf }, { el: 'C', p: G.Cb }], bonds = [[0, 1]];
    parts = [];
    const addG = (name, c, d, side, i) => {
      const tpl = groupTemplate(name), base = atoms.length;
      placeGroup(tpl, c === 0 ? G.Cf : G.Cb, d, 0).forEach((p, n) => atoms.push({ el: tpl.atoms[n].el, p }));
      bonds.push([c, base]); tpl.bonds.forEach((b) => bonds.push([base + b[0], base + b[1]]));
      parts.push({ tpl, base, c, side, i, name });
    };
    st.R.front.forEach((g, i) => addG(g, 0, G.fd[i], 'f', i));
    st.R.back.forEach((g, i) => addG(g, 1, G.bd[i], 'b', i));
    mol = new Mol(v, atoms, bonds, { style: st.style });
    mol.meshes[0].material.color.set(FRONT); mol.meshes[1].material.color.set(BACK);
    mol.bondMeshes[0].forEach((m) => m.material.color.set(AXIS));
    // destaque dos grupos grandes (cor do carbono ligado)
    parts.forEach((pt) => { if (pt.name !== 'H' && o.tint !== false) mol.meshes[pt.base].material.emissive.set(pt.side === 'f' ? 0x4a2a00 : 0x4a0030); });
    dLabel = label('', 'tag c'); mol.group.add(dLabel);
    upd();
  }
  const mainIdx = (arr) => { let k = 0; arr.forEach((g, i) => { if (GROUPS[g].s > GROUPS[arr[k]].s) k = i; }); return k; };
  function upd() {
    const G = rotorGeom(st.R, st.phi);
    parts.forEach((pt) => placeGroup(pt.tpl, pt.c === 0 ? G.Cf : G.Cb, pt.side === 'f' ? G.fd[pt.i] : G.bd[pt.i], 0).forEach((p, n) => mol.setPos(pt.base + n, p)));
    mol.update();
    const pf = parts.find((p) => p.side === 'f' && p.i === mainIdx(st.R.front)), pb = parts.find((p) => p.side === 'b' && p.i === mainIdx(st.R.back));
    const A = mol.atoms[pf.base].p, D = mol.atoms[pb.base].p;
    const setQ = (m, pts) => { const a = m.geometry.attributes.position; pts.forEach((p, k) => a.setXYZ(k, ...p)); a.needsUpdate = true; m.geometry.computeBoundingSphere(); };
    setQ(planeM[0], [G.Cf, G.Cb, V.add(G.Cb, V.sub(A, G.Cf)), A]);
    setQ(planeM[1], [G.Cf, G.Cb, D, V.add(G.Cf, V.sub(D, G.Cb))]);
    planeM.forEach((m) => { m.visible = st.planes; });
    dLabel.visible = !!o.dihLabel;
    dLabel.position.set(...V.lerp(A, D, 0.5).map((x, k) => x + [0, 0.25, 0][k]));
    dLabel.userData.div.textContent = `φ = ${Math.round(mainDihedral(st.R, st.phi))}°`;
  }
  // Shift/Ctrl + arrastar → gira a ligação
  let drag = null;
  const cvs = v.renderer.domElement;
  cvs.addEventListener('pointerdown', (e) => { if (e.shiftKey || e.ctrlKey || e.metaKey) { drag = { x: e.clientX, phi: st.phi }; v.controls.enabled = false; e.preventDefault(); } }, true);
  window.addEventListener('pointermove', (e) => { if (!drag) return; const phi = ((drag.phi + (e.clientX - drag.x) * 0.8) % 360 + 360) % 360; if (o.onDrag) o.onDrag(Math.round(phi)); else api.set(phi); });
  window.addEventListener('pointerup', () => { if (drag) { drag = null; v.controls.enabled = true; } });
  let anim = null;
  v.onFrame(() => { if (anim) anim(); });
  const api = {
    v,
    get mol() { return mol; },
    set(phi) { st.phi = phi; if (mol) upd(); },
    setRotor(R2) { st.R = R2; build(); },
    setStyle(s) { st.style = s; if (mol) mol.setStyle(s); },
    toggle(k) { if (k === 'planes') { st.planes = !st.planes; upd(); return st.planes; } if (k === 'space') { api.setStyle(st.style === 'ball' ? 'space' : 'ball'); return st.style === 'space'; } return false; },
    /** câmera ao longo da ligação (dir: 'fwd' olha do C da frente; 'rev' do outro lado) */
    look(dir = 'fwd', on = true) {
      const target = on ? [0, 0, dir === 'rev' ? -9 : 9] : (o.camPos || [4.2, 2.6, 6.2]);
      const from = v.camera.position.toArray(); const t0 = performance.now();
      v.controls.target.set(0, 0, 0);
      anim = () => { const k = Math.min(1, (performance.now() - t0) / 900); const s = k * k * (3 - 2 * k); v.camera.position.set(...V.lerp(from, target, s)); v.camera.up.set(0, 1, 0); v.camera.lookAt(0, 0, 0); if (k >= 1) anim = null; };
    },
  };
  build();
  return api;
}

/* ===================================================================
 * Anéis C3–C6 (H em todas as posições)
 * =================================================================== */
const M3 = (p) => [p[0], p[2], -p[1]]; // eixo do anel (z) → vertical da tela
export function ringScene(host, n, o = {}) {
  const v = new Viewer(host, { camPos: o.camPos || [0, 3.2, 7.5], alt: o.alt || 'Modelo 3D de cicloalcano' });
  if (!v.ok) return { v, setN() {}, setParam() {} };
  let mol = null, cur = { n, par: o.par || {} }, t = 0, lbls = [];
  function geo() {
    const par = Object.assign({}, cur.par);
    if (cur.n === 4) par.p = cur.anim ? 0.14 * Math.sin(t * 2) : (par.p === undefined ? 0.14 : par.p);
    if (cur.n === 5) { par.Q = 0.43; par.ph = cur.anim ? t * 0.9 : (par.ph || 0); }
    if (cur.n === 6 && par.Q === undefined) Object.assign(par, flipParams(par.u || 0));
    return ringGeom(cur.n, par);
  }
  function build() {
    if (mol) v.scene.remove(mol.group);
    const g = geo(); const atoms = [], bonds = [];
    g.P.forEach((p) => atoms.push({ el: 'C', p: M3(p) }));
    for (let k = 0; k < cur.n; k++) bonds.push([k, (k + 1) % cur.n]);
    g.subs.forEach((s, k) => ['u', 'd'].forEach((f) => { atoms.push({ el: 'H', p: M3(V.add(g.P[k], V.mul(s[f].dir, 1.09))) }); bonds.push([k, atoms.length - 1]); }));
    mol = new Mol(v, atoms, bonds, { style: o.style || 'ball' });
    lbls = [];
    upd();
  }
  function upd() {
    const g = geo();
    g.P.forEach((p, k) => mol.setPos(k, M3(p)));
    let i = cur.n; g.subs.forEach((s, k) => ['u', 'd'].forEach((f) => { mol.setPos(i++, M3(V.add(g.P[k], V.mul(s[f].dir, 1.09)))); }));
    mol.update();
    if (o.onGeo) o.onGeo(g, mol);
  }
  v.onFrame((dt) => { if (cur.anim) { t += dt; upd(); } });
  build();
  return {
    v, get mol() { return mol; },
    setN(nn, par = {}) { cur = { n: nn, par, anim: cur.anim }; build(); },
    setParam(par) { Object.assign(cur.par, par); upd(); },
    animate(on) { cur.anim = on; if (!on) upd(); },
    setStyle(s) { mol.setStyle(s); },
    labels: lbls,
  };
}

/* ===================================================================
 * Ciclo-hexano com substituintes: cadeira A (u = 0) ↔ cadeira B (u = 1)
 * =================================================================== */
const AXC = 0x2fd4f5, EQC = 0xffb347, UPC = 0x3ddc97;
export function chairScene(host, o = {}) {
  const v = new Viewer(host, { camPos: o.camPos || [-1.85, 3.0, 8.4], target: [0, 0.1, 0], alt: o.alt || 'Ciclo-hexano em 3D' });
  if (!v.ok) return { v, setU() {}, setSubs() {}, toggle() { return false; }, clock: makeClock(() => {}) };
  const st = { subs: Object.assign({}, o.subs || {}), u: o.u || 0, color: !!o.color, nums: o.nums !== false, style: o.style || 'ball', diax: !!o.diax, updown: !!o.updown };
  let mol = null, parts = [], lab = [], lines = [], hlKeys = new Set();
  function build() {
    if (mol) { const objs = []; mol.group.traverse((x) => { if (x.isCSS2DObject) objs.push(x); }); objs.forEach((x) => x.parent.remove(x)); v.scene.remove(mol.group); }
    const g = ringGeom(6, flipParams(st.u));
    const atoms = g.P.map((p) => ({ el: 'C', p: M3(p) })), bonds = [];
    for (let k = 0; k < 6; k++) bonds.push([k, (k + 1) % 6]);
    parts = [];
    g.subs.forEach((s, k) => ['u', 'd'].forEach((f) => {
      const key = (k + 1) + f, name = st.subs[key] || 'H';
      const tpl = groupTemplate(name), base = atoms.length;
      placeGroup(tpl, M3(g.P[k]), M3(s[f].dir), 0).forEach((p, n) => atoms.push({ el: tpl.atoms[n].el, p }));
      bonds.push([k, base]); tpl.bonds.forEach((b) => bonds.push([base + b[0], base + b[1]]));
      parts.push({ key, k, f, tpl, base, name, bond: bonds.length - 1 - tpl.bonds.length });
    }));
    mol = new Mol(v, atoms, bonds, { style: st.style });
    lab = [];
    for (let k = 0; k < 6; k++) lab.push({ l: mol.addLabel(k, 'C' + (k + 1), 'tag', [0, 0, 0]), k });
    parts.forEach((pt) => { if (pt.name !== 'H') pt.l = mol.addLabel(pt.base, '', 'tag o', [0, 0.55, 0]); });
    while (lines.length < 4) lines.push(line3(v.scene, 0xff5c6c, true));
    upd();
  }
  function upd() {
    const g = ringGeom(6, flipParams(st.u));
    g.P.forEach((p, k) => mol.setPos(k, M3(p)));
    parts.forEach((pt) => {
      const s = g.subs[pt.k][pt.f];
      placeGroup(pt.tpl, M3(g.P[pt.k]), M3(s.dir), 0).forEach((p, n) => mol.setPos(pt.base + n, p));
      pt.role = s.role;
      const hl = hlKeys.has(pt.key);
      const col = hl ? 0xffd45c : st.updown ? (pt.f === 'u' ? UPC : 0xb18cff) : st.color ? (s.role === 'ax' ? AXC : EQC) : null;
      mol.bondMeshes[pt.bond].forEach((m) => m.material.color.set(col !== null ? col : 0xaeb8c8));
      if (pt.name === 'H') mol.meshes[pt.base].material.color.set(col !== null ? col : 0xf2f5fa);
      if (pt.l) mol.setLabel(pt.l, `${GROUPS[pt.name].short || GROUPS[pt.name].t} · ${s.role === 'ax' ? 'axial' : 'equatorial'} · ${pt.f === 'u' ? 'up' : 'down'}`);
    });
    lab.forEach(({ l, k }) => { const out = V.norm([g.P[k][0], g.P[k][1], 0]); l.off = M3(V.mul(out, 0.55)); mol.setLabel(l, st.nums ? 'C' + (k + 1) : null); });
    mol.update();
    // interações 1,3-diaxiais do primeiro substituinte axial não-H
    lines.forEach((ln) => ln.show(false));
    if (st.diax) {
      const ax = parts.find((pt) => pt.name !== 'H' && g.subs[pt.k][pt.f].role === 'ax');
      if (ax) {
        let n = 0;
        [2, 4].forEach((d) => { const k2 = (ax.k + d) % 6; const q = parts.find((p2) => p2.k === k2 && p2.f === ax.f); if (q && g.subs[k2][ax.f].role === 'ax') { lines[n].set(mol.atoms[ax.base].p, mol.atoms[q.base].p); lines[n].show(true); n++; } });
      }
    }
    if (o.onState) o.onState({ u: st.u, g, parts });
  }
  const clock = makeClock((u) => { st.u = u; if (mol) upd(); }, { dur: o.dur || 3.5 });
  v.onFrame((dt) => clock.tick(dt));
  // seleção por clique
  const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
  v.renderer.domElement.addEventListener('click', (e) => {
    if (!o.onPick || !mol) return;
    const r = v.renderer.domElement.getBoundingClientRect();
    mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(mouse, v.camera);
    const hit = ray.intersectObjects(mol.meshes)[0];
    if (!hit) return;
    const i = mol.meshes.indexOf(hit.object);
    const pt = parts.find((p) => i >= p.base && i < p.base + p.tpl.atoms.length);
    if (pt) o.onPick(pt, i); else if (i < 6) o.onPick({ ring: i }, i);
  });
  build();
  return {
    v, clock,
    get st() { return st; }, get parts() { return parts; }, get mol() { return mol; },
    setU(u) { clock.pause(); clock.set(u); },
    flip() { clock.play(st.u < 0.5 ? 1 : 0); },
    setSubs(s) { st.subs = Object.assign({}, s); build(); },
    highlight(keys) { hlKeys = new Set(keys || []); upd(); },
    toggle(k) { if (k === 'space') { st.style = st.style === 'ball' ? 'space' : 'ball'; mol.setStyle(st.style); return st.style === 'space'; } st[k] = !st[k]; upd(); return st[k]; },
    set(k, val) { st[k] = val; upd(); },
  };
}

/* ===================================================================
 * Vários rotores lado a lado (exercício inverso)
 * =================================================================== */
export function multiRotorScene(host, items) {
  const v = new Viewer(host, { camPos: [0, 2.5, 15], alt: 'Quatro modelos 3D (a–d)' });
  if (!v.ok) return { v };
  const atoms = [], bonds = [];
  items.forEach((it, k) => {
    const G = rotorGeom(it.R, it.phi);
    const off = [(k - (items.length - 1) / 2) * 4.2, 0, 0];
    const rot = (p) => { let [x, y, z] = p; if (it.dir === 'rev') { x = -x; z = -z; } const c = Math.cos(-0.6), s = Math.sin(-0.6); return V.add([x * c + z * s, y, -x * s + z * c], off); };
    const b0 = atoms.length;
    atoms.push({ el: 'C', p: rot(G.Cf) }, { el: 'C', p: rot(G.Cb) }); bonds.push([b0, b0 + 1]);
    [['front', 0, G.fd], ['back', 1, G.bd]].forEach(([side, c, ds]) => it.R[side].forEach((g, i) => {
      const tpl = groupTemplate(g), base = atoms.length;
      placeGroup(tpl, c ? G.Cb : G.Cf, ds[i], 0).forEach((p, n) => atoms.push({ el: tpl.atoms[n].el, p: rot(p) }));
      bonds.push([b0 + c, base]); tpl.bonds.forEach((b) => bonds.push([base + b[0], base + b[1]]));
    }));
    it._c = b0;
  });
  const mol = new Mol(v, atoms, bonds);
  items.forEach((it, k) => { mol.meshes[it._c].material.color.set(FRONT); mol.meshes[it._c + 1].material.color.set(BACK); mol.addLabel(it._c, 'abcd'[k], 'tag big', [0, -2.2, 0]); });
  return { v, mol };
}
export { ROTORS };
