/*
 * sea3d.js — cenas 3D da SEA: benzenos substituídos (gabaritos), posições
 * orto/meta/para, mapa de densidade π qualitativo, aproximação do eletrófilo,
 * mecanismo em etapas (reagentes → ET₁ → complexo σ → ET₂ → produto) e
 * impedimento estérico.
 */
import { THREE, label } from './viewer3d.js';
import { MOLS, mono, V } from './arom.js';
import { aromScene } from './a3d.js';
import { TEMPL, espCharges } from './sub.js';

export const groupsOf = (subs) => Object.fromEntries(Object.entries(subs || {}).map(([p, k]) => [p, TEMPL[SUBTPL[k] || k]()]));
const SUBTPL = { NHCH3: 'NH2' };
/** benzeno substituído: subs {pos: chave} */
export function subScene(host, subs, o = {}) {
  const st = Object.assign({ cloud: true, e: false, lp: false, dist: 10, cam: [0, -(o.dist || 10) * 0.78, (o.dist || 10) * 0.62] }, o, { groups: groupsOf(subs) });
  if (o.esp) st.esp = espCharges(subs);
  const A = aromScene(host, MOLS.benzeno, st);
  A.setSubs = (s2, keep = {}) => { A.st.groups = groupsOf(s2); if (A.st.esp) A.st.esp = espCharges(s2); Object.assign(A.st, keep); A.rebuild(); };
  return A;
}
/** esfera do eletrófilo (laranja) + rótulo */
export function eSphere(parent, pos, txt, r = 0.42) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 20), new THREE.MeshStandardMaterial({ color: 0xff9f43, emissive: 0x663300, emissiveIntensity: 0.6, roughness: 0.35 }));
  m.position.set(...pos); parent.add(m);
  if (txt) { const l = label(txt, 'tag o'); l.position.set(pos[0], pos[1], pos[2] + r + 0.35); parent.add(l); m.userData.lbl = l; }
  return m;
}
export function dashed(parent, a, b, color = 0xffd45c) {
  const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a), new THREE.Vector3(...b)]);
  const l = new THREE.Line(g, new THREE.LineDashedMaterial({ color, dashSize: 0.14, gapSize: 0.1 }));
  l.computeLineDistances(); parent.add(l); return l;
}
/** benzeno com E⁺ aproximando-se em ciclo (tela inicial) */
export function heroScene(host) {
  let t = 0, E = null;
  const A = aromScene(host, MOLS.benzeno, { cloud: true, hint: false, dist: 13, cam: [0, -9.6, 7.4], spin: false, extra: (grp, G) => { const a = G.atoms[0]; E = eSphere(grp, V.add(a.p, V.mul(a.pdir, 4)), 'E⁺', 0.38); E.userData.a = a; } });
  if (A.v.ok) A.v.onFrame((dt) => { t += dt; if (!E) return; const a = E.userData.a; const s = 0.5 + 0.5 * Math.cos(t * 1.2); const p = V.add(V.add(a.p, V.mul(a.out, 0.3)), V.mul(a.pdir, 1.9 + 1.9 * s)); E.position.set(...p); E.userData.lbl.position.set(p[0], p[1], p[2] + 0.75); A.v.scene.rotation.z += dt * 0.12; });
  return A;
}

/* ===================================================================
 * Mecanismo em 3D por etapas
 * =================================================================== */
const ETPL = { brom: 'Br', chlor: 'Cl', nitr: 'NO2', sulf: 'SO3H', alq: 'iPr', acil: 'COCH3' };
const ELAB = { brom: 'Br–Br···FeBr₃', chlor: 'Cl–Cl···FeCl₃', nitr: 'NO₂⁺', sulf: 'SO₃', alq: '(CH₃)₂CH⁺', acil: 'CH₃C≡O⁺' };
const ARENIUM = mono(['CH2', 'C+', 'C', 'C', 'C', 'C'], [[2, 3], [4, 5]], { name: 'complexo σ' });
export const STAGES = ['reagentes', 'ET₁', 'complexo σ', 'ET₂', 'produto'];
export function mechScene(host, rx = 'brom', o = {}) {
  let stage = 0;
  const A = aromScene(host, MOLS.benzeno, Object.assign({ cloud: true, e: false, dist: 12.5, cam: [3.8, -9.4, 5.6], extra: (grp, G) => extra(grp, G) }, o));
  function extra(grp, G) {
    const a = G.atoms[0];
    if (stage <= 1) {
      const d = stage === 0 ? 3.0 : 2.1;
      const p = V.add(V.add(a.p, V.mul(a.out, 0.2)), V.mul(a.pdir, d));
      eSphere(grp, p, ELAB[rx]);
      if (stage === 1) dashed(grp, a.p, p);
    }
    if (stage === 2 || stage === 3) {
      const l = label('C sp³', 'tag v'); l.position.set(...V.add(a.p, V.mul(a.out, -0.9))); grp.add(l);
    }
    if (stage === 3) {
      const h = G.atoms.find((x, i) => i >= G.ringN && x.el === 'H' && G.bonds.some((b) => b[0] === 0 && b[1] === i));
      if (h) { const dir = V.norm(V.sub(h.p, a.p)); const bp = V.add(h.p, V.mul(dir, 1.6)); const m = eSphere(grp, bp, 'base', 0.34); m.material.color.set(0x5b8cff); m.material.emissive.set(0x112244); dashed(grp, h.p, bp, 0x5b8cff); }
    }
    if (stage === 4) { const p = V.add(a.p, V.mul(a.out, 4.2)); const m = eSphere(grp, V.add(p, [2.4, 0, 0]), 'H⁺ (capturado pela base)', 0.22); m.material.color.set(0xf2f5fa); }
  }
  A.setStage = (k) => {
    stage = k;
    const g = { 0: TEMPL[ETPL[rx]]() };
    if (k <= 1) { A.st.groups = null; A.st.hybrid = false; A.setDef(MOLS.benzeno); }
    else if (k <= 3) { A.st.groups = g; A.setDef(ARENIUM); }
    else { A.st.groups = g; A.setDef(MOLS.benzeno); }
  };
  A.setRx = (r) => { rx = r; A.setStage(stage); };
  return A;
}
/** cena estérica: substituinte volumoso + eletrófilo em orto ou para */
export function stericScene(host, subs, o = {}) {
  let pos = o.pos ?? 1;
  const A = subScene(host, subs, Object.assign({ cloud: false, dist: 14, cam: [0, -5, 13.5], extra: (grp, G) => { const a = G.atoms[pos]; eSphere(grp, V.add(V.add(a.p, V.mul(a.out, 1.9)), V.mul(a.pdir, 0.9)), 'E⁺', 0.55); } }, o));
  A.setPos = (p) => { pos = p; A.rebuild(); };
  return A;
}
