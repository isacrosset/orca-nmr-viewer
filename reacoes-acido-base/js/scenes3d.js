/*
 * scenes3d.js — cenas 3D específicas: tela inicial (HO⁻ → CH₃Br com par
 * eletrônico em movimento), aproximação nucleófilo–eletrófilo com estado de
 * transição e orbitais híbridos sp³/sp²/sp.
 */
import { THREE, Viewer, Mol, V, label, curvedArrow } from './viewer3d.js';
import { LIB3D, espMesh, trig } from './mol3d.js';

const lobe = (color, opacity) => new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), new THREE.MeshStandardMaterial({ color, transparent: true, opacity, roughness: 0.3, depthWrite: false, emissive: color, emissiveIntensity: 0.25 }));
function place(m, pos, dir, len, wid) { m.position.set(...V.add(pos, V.mul(V.norm(dir), len))); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...V.norm(dir))); m.scale.set(wid, len, wid); }
const bez = (a, c, b, t) => V.add(V.add(V.mul(a, (1 - t) * (1 - t)), V.mul(c, 2 * t * (1 - t))), V.mul(b, t * t));

/* ===================================================================
 * Tela inicial
 * =================================================================== */
export function heroScene(host) {
  const v = new Viewer(host, { camPos: [0.6, 1.6, 9.5], target: [-0.8, 0, 0], alt: 'Hidróxido (nucleófilo) e bromometano (eletrófilo): o par eletrônico do O se move em direção ao carbono δ+' });
  if (!v.ok) return { v };
  const def = LIB3D.CH3Br(); const C = def.atoms[0].p;
  const shift = V.sub([0, 0, 0], C);
  const atoms = def.atoms.map((a) => ({ el: a.el, p: V.add(a.p, shift) }));
  new Mol(v, atoms, def.bonds.map(([i, j, o]) => [i, j, o, {}]));
  const esp = espMesh({ atoms: def.atoms.map((a) => ({ el: a.el, p: V.add(a.p, shift), q: a.q })) }, { opacity: 0.33 }); v.scene.add(esp);
  const O = [-3.3, 0, 0], H = [-4.15, 0.35, 0];
  new Mol(v, [{ el: 'O', p: O }, { el: 'H', p: H }], [[0, 1, 1, {}]]);
  const lpd = [[1, 0, 0], V.norm([-0.2, -0.6, 0.75]), V.norm([-0.2, -0.6, -0.75])];
  lpd.forEach((d, k) => { const m = lobe(0x2fd4f5, k ? 0.22 : 0.42); place(m, O, d, 0.62, 0.3); v.scene.add(m); });
  const tag = (t, cls, p) => { const l = label(t, 'lbl3d ' + cls); l.position.set(...p); v.scene.add(l); };
  tag('nucleófilo (HO⁻)', 'tag c', [-3.6, 1.35, 0]); tag('eletrófilo', 'tag o', [0.1, 1.65, 0]); tag('δ+', 'dplus', [0.15, -0.75, 0.6]); tag('δ−', 'dminus', [2.05, 0.85, 0]); tag('⊖', 'fc3d neg', [-3.0, 0.55, 0.3]); tag('par eletrônico', 'tag', [-2.5, -0.95, 0]);
  const a = [-2.55, 0.05, 0], c = [-1.55, 1.35, 0], b = [-0.42, 0.18, 0];
  const arr = curvedArrow(v.scene, 0xff4fa3); arr.set(a, c, b, 1);
  const e = [0, 1].map(() => { const s = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 8), new THREE.MeshBasicMaterial({ color: 0xbff4ff })); v.scene.add(s); return s; });
  const t0 = performance.now();
  v.onFrame(() => {
    const t = ((performance.now() - t0) / 2600) % 1, s = t < 0.75 ? (t / 0.75) : 1;
    const k = s * s * (3 - 2 * s);
    e.forEach((m, i) => { const p = bez(a, c, b, Math.max(0, k - i * 0.05)); m.position.set(p[0], p[1] + (i ? 0.08 : -0.08), p[2]); m.visible = t < 0.92; });
  });
  return { v };
}

/* ===================================================================
 * HO⁻ + CH₃Br: aproximação, estado de transição, produtos (slider)
 * =================================================================== */
export function approachScene(host, onStage) {
  const v = new Viewer(host, { camPos: [0, 2.2, 10], alt: 'Aproximação do hidróxido ao carbono do bromometano, estado de transição e produtos' });
  if (!v.ok) return { v, set() {} };
  const atoms = [{ el: 'O', p: [-3.6, 0, 0] }, { el: 'H', p: [-4.5, 0.3, 0] }, { el: 'C', p: [0, 0, 0] }, { el: 'H', p: [0, 0, 0] }, { el: 'H', p: [0, 0, 0] }, { el: 'H', p: [0, 0, 0] }, { el: 'Br', p: [1.94, 0, 0] }];
  const bonds = [[0, 1, 1, {}], [2, 3, 1, {}], [2, 4, 1, {}], [2, 5, 1, {}], [0, 2, 1, {}], [0, 2, 1, { partial: true }], [2, 6, 1, {}], [2, 6, 1, { partial: true }]];
  const m = new Mol(v, atoms, bonds);
  const lab = (t, cls) => { const l = label(t, 'lbl3d ' + cls); v.scene.add(l); return l; };
  const lO = lab('⊖', 'fc3d neg'), lBr = lab('', 'fc3d neg'), lTS = lab('‡', 'tag m big'), dO = lab('δ−', 'dminus'), dB = lab('δ−', 'dminus');
  const ring = trig([1, 0, 0], [0, 0, 1]).concat([[0, 0, 0]]);
  void ring;
  function set(t) {
    const dCO = 3.4 - 1.97 * Math.min(1, t / 0.5) - (t > 0.5 ? 0 : 0); // 3,4 → 1,43 (em t = 1) passando por ~2,0 no ET
    const xO = -(t < 0.5 ? 3.4 - (3.4 - 2.05) * (t / 0.5) : 2.05 - (2.05 - 1.43) * ((t - 0.5) / 0.5));
    const xBr = t < 0.5 ? 1.94 + (2.4 - 1.94) * (t / 0.5) : 2.4 + (4.2 - 2.4) * ((t - 0.5) / 0.5);
    void dCO;
    const hx = -0.36 * Math.cos(Math.PI * t), r = Math.sqrt(1.09 * 1.09 - hx * hx);
    [0, 1, 2].forEach((k) => { const a = Math.PI / 2 + k * 2 * Math.PI / 3; m.setPos(3 + k, [hx, r * Math.cos(a), r * Math.sin(a)]); });
    m.setPos(0, [xO, 0, 0]); m.setPos(1, [xO - 0.85, 0.45, 0]); m.setPos(6, [xBr, 0, 0]);
    const ts = t > 0.3 && t < 0.7;
    m.bonds[4].hidden = t <= 0.7; m.bonds[5].hidden = !ts; m.bonds[6].hidden = t >= 0.3; m.bonds[7].hidden = !ts;
    m.update();
    lO.position.set(xO + 0.3, 0.6, 0.3); lO.visible = t <= 0.3;
    lBr.userData.div.textContent = '⊖'; lBr.position.set(xBr + 0.35, 0.65, 0.3); lBr.visible = t >= 0.7;
    lTS.position.set(0, 2.0, 0); lTS.visible = ts;
    dO.position.set(xO, 0.75, 0); dB.position.set(xBr, 0.85, 0); dO.visible = dB.visible = ts;
    if (onStage) onStage(t < 0.3 ? 'reagentes' : ts ? 'ts' : 'produtos');
  }
  set(0);
  return { v, set };
}

/* ===================================================================
 * Orbitais híbridos (qualitativos)
 * =================================================================== */
export function hybScene(host) {
  const v = new Viewer(host, { camPos: [5, 3.6, 10], alt: 'Orbitais híbridos de um carbono: sp³, sp² ou sp' });
  if (!v.ok) return { v, set() {} };
  const grp = new THREE.Group(); v.scene.add(grp);
  const C = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 16), new THREE.MeshStandardMaterial({ color: 0x6b7280 })); v.scene.add(C);
  function clear() { const o = []; grp.traverse((x) => { if (x.isCSS2DObject) o.push(x); }); o.forEach((x) => x.parent.remove(x)); while (grp.children.length) grp.remove(grp.children[0]); }
  function hyb(dir, sfrac, color) {
    // lóbulo maior "curto e gordo" quanto maior o caráter s (elétrons mais próximos do núcleo)
    const len = 1.35 - 0.9 * (sfrac - 0.25), wid = 0.48 + 0.2 * (sfrac - 0.25);
    const big = lobe(color, 0.5); place(big, [0, 0, 0], dir, len, wid); grp.add(big);
    const small = lobe(color, 0.25); place(small, [0, 0, 0], V.mul(dir, -1), 0.35, 0.28); grp.add(small);
  }
  function pOrb(dir) { [1, -1].forEach((s) => { const m = lobe(0xb18cff, 0.28); place(m, [0, 0, 0], V.mul(dir, s), 1.0, 0.36); grp.add(m); }); }
  function set(k) {
    clear();
    if (k === 'sp3') [[0, 1, 0], ...[0, 1, 2].map((i) => { const a = i * 2 * Math.PI / 3; return [0.943 * Math.cos(a), -0.333, 0.943 * Math.sin(a)]; })].forEach((d, i) => hyb(d, 0.25, i ? 0x2fd4f5 : 0x3ddc97));
    if (k === 'sp2') { [[1, 0, 0], ...trig([1, 0, 0], [0, 1, 0])].forEach((d, i) => hyb(d, 1 / 3, i ? 0x2fd4f5 : 0x3ddc97)); pOrb([0, 1, 0]); }
    if (k === 'sp') { [[1, 0, 0], [-1, 0, 0]].forEach((d, i) => hyb(d, 0.5, i ? 0x2fd4f5 : 0x3ddc97)); pOrb([0, 1, 0]); pOrb([0, 0, 1]); }
    const l = label({ sp3: 'sp³: 4 híbridos, 109,5° · 25% s', sp2: 'sp²: 3 híbridos, 120° + 1 p · 33% s', sp: 'sp: 2 híbridos, 180° + 2 p · 50% s' }[k], 'lbl3d tag c'); l.position.set(0, 2.6, 0); grp.add(l);
  }
  set('sp3');
  return { v, set };
}
