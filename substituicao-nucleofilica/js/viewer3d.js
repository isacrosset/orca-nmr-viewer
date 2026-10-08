/*
 * viewer3d.js — infraestrutura 3D sobre Three.js:
 *   Viewer   cena + câmera + OrbitControls (girar, zoom, reset) + rótulos HTML
 *   Mol      átomos (esferas) e ligações (cilindros) atualizáveis a cada quadro
 *   helpers  orbitais (lóbulos), setas curvas 3D, geometria tetraédrica, grupos
 */
import * as THREE from 'three';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from '../vendor/CSS2DRenderer.js';

export { THREE };

/* ---------- dados dos elementos ---------- */

export const ELEM = {
  H: { color: 0xf2f5fa, vdw: 1.2, ball: 0.24, name: 'hidrogênio' },
  C: { color: 0x6b7280, vdw: 1.7, ball: 0.36, name: 'carbono' },
  N: { color: 0x3b6cf6, vdw: 1.55, ball: 0.36, name: 'nitrogênio' },
  O: { color: 0xef3b3b, vdw: 1.52, ball: 0.36, name: 'oxigênio' },
  S: { color: 0xf2c933, vdw: 1.8, ball: 0.42, name: 'enxofre' },
  F: { color: 0x90e050, vdw: 1.47, ball: 0.34, name: 'flúor' },
  Cl: { color: 0x2fd06a, vdw: 1.75, ball: 0.44, name: 'cloro' },
  Br: { color: 0xa5432a, vdw: 1.85, ball: 0.5, name: 'bromo' },
  I: { color: 0x8b2fc9, vdw: 1.98, ball: 0.56, name: 'iodo' },
  Na: { color: 0xab5cf2, vdw: 2.27, ball: 0.5, name: 'sódio' },
};
export const BOND = { 'C-H': 1.09, 'C-C': 1.53, 'C-Cl': 1.78, 'C-Br': 1.94, 'C-I': 2.14, 'C-O': 1.43, 'O-H': 0.97, 'C-N': 1.47, 'C=C': 1.34, 'Car': 1.39, 'C-S': 1.8 };

/* ---------- vetores ---------- */

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

/** 3 direções tetraédricas para os demais ligantes de um átomo cujo vizinho está na direção u */
export function tetraDirs(u, phase = 0, ref = [0, 0, 1]) {
  u = V.norm(u);
  let p = V.cross(u, ref);
  if (V.len(p) < 1e-3) p = V.cross(u, [0, 1, 0]);
  p = V.norm(p);
  const q = V.cross(u, p);
  const k = Math.sqrt(8) / 3;
  return [0, 1, 2].map((i) => {
    const f = phase + i * 2 * Math.PI / 3;
    return V.add(V.mul(u, -1 / 3), V.add(V.mul(p, k * Math.cos(f)), V.mul(q, k * Math.sin(f))));
  });
}

/** quiralidade (R/S) a partir de vetores dos ligantes de prioridade 1..4 */
export function chirality(v1, v2, v3, v4) {
  const a = V.sub(v1, v4), b = V.sub(v2, v4), c = V.sub(v3, v4);
  return V.dot(a, V.cross(b, c)) < 0 ? 'R' : 'S';
}

/* ---------- grupos (eixo de ligação ao longo de +z, átomo de ligação em z = L) ---------- */

export function groupTemplate(name) {
  const atoms = [], bonds = [];
  const add = (el, p) => { atoms.push({ el, p }); return atoms.length - 1; };
  const tet = (idx, parentPos, phase = 0, ref) => {
    const u = V.sub(parentPos, atoms[idx].p);
    return tetraDirs(u, phase, ref);
  };
  if (name === 'H') { add('H', [0, 0, BOND['C-H']]); return { atoms, bonds }; }
  const c1 = add('C', [0, 0, BOND['C-C']]);
  if (name === 'CH3') {
    tet(c1, [0, 0, 0], Math.PI / 6).forEach((d) => { const h = add('H', V.add(atoms[c1].p, V.mul(d, BOND['C-H']))); bonds.push([c1, h]); });
    return { atoms, bonds };
  }
  // cadeias: CH2CH3 (Et), CH2CH2CH3 (Pr)
  const n = name === 'Pr' ? 3 : 2;
  let prev = [0, 0, 0], cur = c1;
  for (let k = 1; k <= n; k++) {
    const dirs = tet(cur, prev, Math.PI / 6 + (k % 2 ? 0 : Math.PI), [1, 0, 0]);
    if (k < n) {
      const nx = add('C', V.add(atoms[cur].p, V.mul(dirs[0], BOND['C-C'])));
      bonds.push([cur, nx]);
      [dirs[1], dirs[2]].forEach((d) => { const h = add('H', V.add(atoms[cur].p, V.mul(d, BOND['C-H']))); bonds.push([cur, h]); });
      prev = atoms[cur].p; cur = nx;
    } else {
      dirs.forEach((d) => { const h = add('H', V.add(atoms[cur].p, V.mul(d, BOND['C-H']))); bonds.push([cur, h]); });
    }
  }
  return { atoms, bonds };
}

/* ---------- rótulos ---------- */

export function label(text, cls = '') {
  const div = document.createElement('div');
  div.className = 'lbl3d ' + cls;
  div.innerHTML = text;
  const o = new CSS2DObject(div);
  o.userData.div = div;
  return o;
}

/* ---------- Viewer ---------- */

let glOK = null;
function webglAvailable() {
  if (glOK !== null) return glOK;
  try { const c = document.createElement('canvas'); glOK = !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); }
  catch (e) { glOK = false; }
  return glOK;
}

export const VIEWERS = new Set();

export class Viewer {
  constructor(host, o = {}) {
    this.host = host;
    this.o = Object.assign({ dist: 9, fov: 38, autoRotate: false, hint: true, target: [0, 0, 0] }, o);
    this.frameFns = [];
    this.ok = webglAvailable();
    if (!this.ok) {
      host.insertAdjacentHTML('beforeend', '<div class="nogl">Seu navegador não ativou o WebGL, necessário para os modelos 3D. As explicações e figuras 2D continuam disponíveis.</div>');
      return;
    }
    const w = host.clientWidth || 600, h = host.clientHeight || 400;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(w, h);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(this.renderer.domElement);
    this.renderer.domElement.setAttribute('aria-label', o.alt || 'Modelo molecular 3D interativo');
    this.renderer.domElement.setAttribute('role', 'img');
    this.renderer.domElement.tabIndex = 0;

    this.css = new CSS2DRenderer();
    this.css.setSize(w, h);
    Object.assign(this.css.domElement.style, { position: 'absolute', inset: '0', pointerEvents: 'none' });
    host.appendChild(this.css.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(this.o.fov, w / h, 0.1, 200);
    this.home = new THREE.Vector3(...(o.camPos || [0, 1.5, this.o.dist]));
    this.camera.position.copy(this.home);
    this.scene.add(new THREE.HemisphereLight(0xdfe9ff, 0x1a2238, 1.6));
    const d1 = new THREE.DirectionalLight(0xffffff, 2.2); d1.position.set(4, 6, 8); this.scene.add(d1);
    const d2 = new THREE.DirectionalLight(0x88aaff, 0.8); d2.position.set(-6, -2, -4); this.scene.add(d2);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enablePan = false;
    this.controls.minDistance = 3;
    this.controls.maxDistance = 40;
    this.controls.target.set(...this.o.target);
    this.controls.autoRotate = this.o.autoRotate;
    this.controls.autoRotateSpeed = 1.2;
    this.controls.update();
    // teclado: setas giram, +/- zoom
    this.renderer.domElement.addEventListener('keydown', (e) => this._key(e));

    if (this.o.hint) host.insertAdjacentHTML('beforeend', '<div class="hint3d">arraste para girar · role para zoom · duplo clique para resetar</div>');
    this.renderer.domElement.addEventListener('dblclick', () => this.reset());
    const vb = document.createElement('div');
    vb.className = 'vbtns';
    vb.innerHTML = '<button class="btn sm" type="button" data-z="in" aria-label="Aproximar">+</button><button class="btn sm" type="button" data-z="out" aria-label="Afastar">−</button><button class="btn sm" type="button" data-z="reset" aria-label="Resetar orientação">⟲</button>';
    vb.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.z === 'reset') this.reset(); else this.zoom(b.dataset.z === 'in' ? 0.82 : 1.22);
    });
    host.appendChild(vb);

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(host);
    this.visible = true;
    this.io = new IntersectionObserver((en) => { this.visible = en[en.length - 1].isIntersecting; }, { threshold: 0.01 });
    this.io.observe(host);
    this.clock = new THREE.Clock();
    this.running = true;
    const loop = () => {
      if (!this.running) return;
      this.raf = requestAnimationFrame(loop);
      if (!this.visible || document.hidden) return;
      const dt = Math.min(this.clock.getDelta(), 0.05);
      this.frameFns.forEach((f) => f(dt));
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
      this.css.render(this.scene, this.camera);
    };
    loop();
    VIEWERS.add(this);
  }
  onFrame(fn) { this.frameFns.push(fn); }
  resize() {
    if (!this.ok) return;
    const w = this.host.clientWidth, h = this.host.clientHeight;
    if (!w || !h) return;
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h); this.css.setSize(w, h);
  }
  reset() {
    if (!this.ok) return;
    this.camera.position.copy(this.home);
    this.controls.target.set(...this.o.target);
    this.controls.update();
  }
  zoom(f) {
    const t = this.controls.target, p = this.camera.position;
    p.sub(t).multiplyScalar(f).add(t);
  }
  setCamera(pos, target) {
    this.home = new THREE.Vector3(...pos);
    if (target) this.o.target = target;
    this.reset();
  }
  _key(e) {
    const a = 0.12;
    const off = this.camera.position.clone().sub(this.controls.target);
    const sph = new THREE.Spherical().setFromVector3(off);
    if (e.key === 'ArrowLeft') sph.theta -= a; else if (e.key === 'ArrowRight') sph.theta += a;
    else if (e.key === 'ArrowUp') sph.phi = Math.max(0.1, sph.phi - a); else if (e.key === 'ArrowDown') sph.phi = Math.min(Math.PI - 0.1, sph.phi + a);
    else if (e.key === '+' || e.key === '=') { this.zoom(0.85); e.preventDefault(); return; }
    else if (e.key === '-') { this.zoom(1.18); e.preventDefault(); return; }
    else if (e.key === 'r' || e.key === 'R') { this.reset(); return; }
    else return;
    e.preventDefault();
    off.setFromSpherical(sph);
    this.camera.position.copy(this.controls.target).add(off);
  }
  caption(html) {
    if (!this.capEl) {
      const hud = document.createElement('div'); hud.className = 'hud';
      this.capEl = document.createElement('div'); this.capEl.className = 'cap';
      hud.appendChild(this.capEl);
      this.host.appendChild(hud);
    }
    this.capEl.innerHTML = html;
    this.capEl.style.display = html ? '' : 'none';
  }
  dispose() {
    if (!this.ok) return;
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.ro.disconnect(); this.io.disconnect();
    this.controls.dispose();
    this.scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
    });
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    VIEWERS.delete(this);
  }
}

/* ---------- molécula ---------- */

const SPH = new THREE.SphereGeometry(1, 32, 22);
const CYL = new THREE.CylinderGeometry(1, 1, 1, 16, 1);
const UP = new THREE.Vector3(0, 1, 0);
const matCache = new Map();
function atomMat(color, opacity = 1) {
  const k = color + ':' + opacity;
  if (!matCache.has(k)) matCache.set(k, new THREE.MeshStandardMaterial({ color, roughness: 0.38, metalness: 0.05, transparent: opacity < 1, opacity }));
  return matCache.get(k);
}

export class Mol {
  /* atoms: [{el, p, tag?}], bonds: [[i, j, ordem, {partial, normal}]] */
  constructor(viewer, atoms, bonds, o = {}) {
    this.v = viewer;
    this.o = Object.assign({ style: 'ball', bondR: 0.1 }, o);
    this.group = new THREE.Group();
    if (viewer.ok) viewer.scene.add(this.group);
    this.atoms = atoms.map((a) => Object.assign({ p: [0, 0, 0] }, a));
    this.bonds = bonds.map((b) => ({ i: b[0], j: b[1], order: b[2] || 1, opt: b[3] || {} }));
    if (!viewer.ok) return;
    this.meshes = this.atoms.map((a) => {
      const e = ELEM[a.el] || ELEM.C;
      const m = new THREE.Mesh(SPH, new THREE.MeshStandardMaterial({ color: a.color || e.color, roughness: 0.38, metalness: 0.05, transparent: true, opacity: 1 }));
      m.userData.atom = a;
      this.group.add(m);
      return m;
    });
    this.bondMeshes = this.bonds.map((b) => {
      const n = b.order === 2 ? 2 : 1;
      const arr = [];
      for (let k = 0; k < n; k++) {
        const mat = b.opt.partial
          ? new THREE.MeshStandardMaterial({ color: 0xffd45c, transparent: true, opacity: 0.55, emissive: 0x332200 })
          : new THREE.MeshStandardMaterial({ color: 0xaeb8c8, roughness: 0.5 });
        const m = new THREE.Mesh(CYL, mat);
        this.group.add(m);
        arr.push(m);
      }
      return arr;
    });
    this.labels = [];
    this.update();
  }
  setStyle(style) { this.o.style = style; this.update(); }
  radius(i) {
    const a = this.atoms[i], e = ELEM[a.el] || ELEM.C;
    return this.o.style === 'space' ? e.vdw * (a.scale || 1) : e.ball * (a.scale || 1);
  }
  setPos(i, p) { this.atoms[i].p = p; }
  update() {
    if (!this.v.ok) return;
    this.meshes.forEach((m, i) => {
      const a = this.atoms[i];
      m.position.set(...a.p);
      const r = this.radius(i);
      m.scale.setScalar(r);
      m.visible = a.hidden !== true;
      m.material.opacity = a.opacity === undefined ? 1 : a.opacity;
    });
    this.bonds.forEach((b, k) => {
      const A = this.atoms[b.i], B = this.atoms[b.j];
      const hide = this.o.style === 'space' || A.hidden || B.hidden || b.hidden;
      const pa = new THREE.Vector3(...A.p), pb = new THREE.Vector3(...B.p);
      const d = pb.clone().sub(pa), L = d.length();
      const meshes = this.bondMeshes[k];
      let off = new THREE.Vector3();
      if (meshes.length === 2) {
        const nrm = b.opt.normal ? new THREE.Vector3(...b.opt.normal) : new THREE.Vector3(0, 0, 1);
        off = d.clone().cross(nrm).normalize().multiplyScalar(0.13);
      }
      meshes.forEach((m, n) => {
        m.visible = !hide;
        if (hide) return;
        const r = (b.opt.partial ? 0.06 : this.o.bondR) * (meshes.length === 2 ? 0.7 : 1);
        const mid = pa.clone().add(pb).multiplyScalar(0.5);
        if (meshes.length === 2) mid.add(off.clone().multiplyScalar(n === 0 ? 1 : -1));
        m.position.copy(mid);
        m.quaternion.setFromUnitVectors(UP, d.clone().normalize());
        m.scale.set(r, L, r);
        if (b.opt.opacity !== undefined) { m.material.transparent = true; m.material.opacity = b.opt.opacity; }
      });
    });
    this.labels.forEach((l) => {
      const a = this.atoms[l.i];
      l.obj.position.set(a.p[0] + l.off[0], a.p[1] + l.off[1], a.p[2] + l.off[2]);
      l.obj.visible = !a.hidden && l.visible !== false;
    });
  }
  addLabel(i, text, cls = '', off = [0, 0.55, 0]) {
    const obj = label(text, cls);
    this.group.add(obj);
    const l = { i, obj, off, visible: true };
    this.labels.push(l);
    if (this.v.ok) l.obj.position.set(...V.add(this.atoms[i].p, off));
    return l;
  }
  setLabel(l, text, cls) {
    if (text === null) { l.visible = false; l.obj.visible = false; return; }
    l.visible = true;
    l.obj.visible = !this.atoms[l.i].hidden;
    if (l.obj.userData.div.innerHTML !== text) l.obj.userData.div.innerHTML = text;
    if (cls !== undefined) l.obj.userData.div.className = 'lbl3d ' + cls;
  }
  halo(i, color = 0x2fd4f5, scale = 1.75) {
    const m = new THREE.Mesh(SPH, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.22, depthWrite: false }));
    this.group.add(m);
    const h = { i, m, scale, on: true };
    (this.halos = this.halos || []).push(h);
    this.v.onFrame(() => {
      const a = this.atoms[h.i];
      m.visible = h.on && !a.hidden;
      m.position.set(...a.p);
      const t = performance.now() / 600;
      const e = ELEM[a.el] || ELEM.C;
      m.scale.setScalar(Math.max(this.radius(h.i) * 1.08, e.ball * h.scale) * (1 + 0.06 * Math.sin(t)));
    });
    return h;
  }
}

/* ---------- orbitais e setas ---------- */

/** lóbulo (elipsoide) apontando na direção dir a partir de pos */
export function lobe(scene, color, opacity = 0.45) {
  const m = new THREE.Mesh(SPH, new THREE.MeshStandardMaterial({ color, transparent: true, opacity, roughness: 0.3, depthWrite: false, emissive: color, emissiveIntensity: 0.25 }));
  scene.add(m);
  return {
    m,
    set(pos, dir, len, width) {
      const d = new THREE.Vector3(...V.norm(dir));
      m.position.set(...V.add(pos, V.mul(V.norm(dir), len)));
      m.quaternion.setFromUnitVectors(UP, d);
      m.scale.set(width, len, width);
    },
    show(v) { m.visible = v; },
  };
}

export function curvedArrow(scene, color = 0xff4fa3) {
  const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.5, transparent: true, opacity: 0.95 });
  const tube = new THREE.Mesh(new THREE.BufferGeometry(), mat);
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.36, 16), mat);
  scene.add(tube); scene.add(head);
  return {
    set(a, ctrl, b, frac = 1) {
      const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(...a), new THREE.Vector3(...ctrl), new THREE.Vector3(...b));
      const pts = curve.getPoints(32).slice(0, Math.max(2, Math.round(33 * frac)));
      const path = new THREE.CatmullRomCurve3(pts);
      tube.geometry.dispose();
      tube.geometry = new THREE.TubeGeometry(path, 24, 0.045, 8, false);
      const end = pts[pts.length - 1], prev = pts[pts.length - 2];
      head.position.copy(end);
      head.quaternion.setFromUnitVectors(UP, end.clone().sub(prev).normalize());
    },
    show(v) { tube.visible = v; head.visible = v; },
    opacity(o) { mat.opacity = o; },
  };
}

export function line3(scene, color = 0x2fd4f5, dashed = true) {
  const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(1, 0, 0)]);
  const mat = dashed ? new THREE.LineDashedMaterial({ color, dashSize: 0.18, gapSize: 0.12 }) : new THREE.LineBasicMaterial({ color });
  const l = new THREE.Line(g, mat);
  scene.add(l);
  return {
    l,
    set(a, b) { g.setFromPoints([new THREE.Vector3(...a), new THREE.Vector3(...b)]); l.computeLineDistances(); },
    show(v) { l.visible = v; },
  };
}

/* ---------- utilidades de animação ---------- */

export const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const smooth = (t) => t * t * (3 - 2 * t);
/** interpolação por quadros-chave: keys = [[s, valor], ...] em ordem */
export function kf(keys, s) {
  if (s <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (s <= keys[i][0]) {
      const [s0, v0] = keys[i - 1], [s1, v1] = keys[i];
      const t = smooth((s - s0) / (s1 - s0));
      return v0 + (v1 - v0) * t;
    }
  }
  return keys[keys.length - 1][1];
}

/** orienta pontos locais (eixo +z) para a direção dir e translada para origin */
export function placeGroup(tpl, origin, dir, twist = 0) {
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(...V.norm(dir)));
  if (twist) q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), twist));
  return tpl.atoms.map((a) => {
    const v = new THREE.Vector3(...a.p).applyQuaternion(q);
    return [v.x + origin[0], v.y + origin[1], v.z + origin[2]];
  });
}

/**
 * Construtor de "centro reativo": carbono central na origem, três grupos com
 * direção controlada (guarda-chuva) e átomos extras livres (Nu, LG, solvente).
 */
export class Center {
  constructor(groups, o = {}) {
    this.atoms = [{ el: 'C', p: [0, 0, 0], tag: 'center' }];
    this.bonds = [];
    this.parts = [];
    this.phis = o.phis || [Math.PI / 2, Math.PI / 2 + 2 * Math.PI / 3, Math.PI / 2 + 4 * Math.PI / 3];
    groups.forEach((g, k) => {
      const tpl = groupTemplate(g);
      const base = this.atoms.length;
      tpl.atoms.forEach((a) => this.atoms.push({ el: a.el, p: [0, 0, 0], tag: 'g' + k }));
      this.bonds.push([0, base]);
      tpl.bonds.forEach((b) => this.bonds.push([base + b[0], base + b[1]]));
      this.parts.push({ tpl, base, name: g });
    });
  }
  add(el, p, tag) { this.atoms.push({ el, p, tag }); return this.atoms.length - 1; }
  bond(i, j, order, opt) { this.bonds.push([i, j, order || 1, opt || {}]); return this.bonds.length - 1; }
  /** hx: componente x (−1/3 = longe de +x … +1/3) da direção dos grupos */
  umbrella(mol, hx, axis = [1, 0, 0]) {
    const r = Math.sqrt(Math.max(0, 1 - hx * hx));
    this.parts.forEach((pt, k) => {
      const f = this.phis[k];
      const dir = [hx * axis[0], r * Math.cos(f), r * Math.sin(f)];
      const pos = placeGroup(pt.tpl, mol.atoms[0].p, dir, 0);
      pos.forEach((p, n) => mol.setPos(pt.base + n, p));
    });
  }
}
