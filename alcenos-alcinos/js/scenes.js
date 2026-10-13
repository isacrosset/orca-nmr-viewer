/*
 * scenes.js — cenas 3D: alceno sp² (orbitais p/π), rotação restrita, cis/trans,
 * alcino sp (duas π), hidrogenação em superfície (syn), bromação via bromônio
 * (anti), hidroboração (syn), produtos syn/anti e Lindlar × Na/NH3.
 */
import { THREE, Viewer, Mol, V, BOND, kf, smooth, lobe, curvedArrow, label, groupTemplate, placeGroup } from './viewer3d.js';

export function makeClock(max, onSet, o = {}) {
  const st = { s: 0, playing: false, speed: 1, dur: o.dur || 6, loop: !!o.loop };
  const api = {
    get s() { return st.s; },
    set(s) { st.s = Math.max(0, Math.min(max, s)); onSet(st.s); },
    play() { if (st.s >= max - 1e-6) st.s = 0; st.playing = true; api.onState && api.onState(true); },
    pause() { st.playing = false; api.onState && api.onState(false); },
    toggle() { st.playing ? api.pause() : api.play(); },
    speed(k) { st.speed = k; },
    stopAt: null,
    tick(dt) {
      if (!st.playing) return;
      let s = st.s + dt * st.speed * max / st.dur;
      if (api.stopAt !== null && s >= api.stopAt) { s = api.stopAt; api.stopAt = null; st.s = s; onSet(s); api.pause(); return; }
      if (s >= max) { if (st.loop) s = 0; else { s = max; st.playing = false; api.onState && api.onState(false); } }
      st.s = s; onSet(s);
    },
  };
  return api;
}
const rotX = (p, a) => { const c = Math.cos(a), s = Math.sin(a); return [p[0], c * p[1] - s * p[2], s * p[1] + c * p[2]]; };
const ANG = (a, b, c) => { const u = V.norm(V.sub(a, b)), w = V.norm(V.sub(c, b)); return Math.acos(Math.max(-1, Math.min(1, V.dot(u, w)))) * 180 / Math.PI; };
export { ANG };
/** lóbulo π: elipsoide alongado ao longo do eixo da ligação (ax), deslocado na direção n */
export function piLobe(scene, color, mid, ax, n, o = {}) {
  const l = lobe(scene, color, o.opacity || 0.35);
  const X = new THREE.Vector3(...V.norm(ax)), Y = new THREE.Vector3(...V.norm(n)), Zv = new THREE.Vector3().crossVectors(X, Y);
  l.m.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, Y, Zv));
  l.m.position.set(...V.add(mid, V.mul(V.norm(n), o.off || 0.6)));
  l.m.scale.set(o.len || 1.2, o.w || 0.5, o.d || 0.55);
  return l;
}

/* ===================================================================
 * Construtor de alceno: C1 (−x) = C2 (+x) no plano xy; p ao longo de z.
 * subs = [a1 (C1, alto), a2 (C1, baixo), b1 (C2, alto), b2 (C2, baixo)]
 * =================================================================== */
export function buildAlkene(subs, o = {}) {
  const atoms = [{ el: 'C', p: [-0.67, 0, 0], tag: 'c1' }, { el: 'C', p: [0.67, 0, 0], tag: 'c2' }];
  const bonds = [[0, 1, 2, { normal: [0, 0, 1] }]];
  const dirs = [[-0.5, 0.866, 0], [-0.5, -0.866, 0], [0.5, 0.866, 0], [0.5, -0.866, 0]];
  const parts = [];
  subs.forEach((g, k) => {
    const c = k < 2 ? 0 : 1;
    const tpl = groupTemplate(g), base = atoms.length;
    placeGroup(tpl, atoms[c].p, dirs[k], o.twist || Math.PI / 2).forEach((p, n) => atoms.push({ el: tpl.atoms[n].el, p, tag: 'g' + k }));
    bonds.push([c, base]); tpl.bonds.forEach((b) => bonds.push([base + b[0], base + b[1], b[2] || 1, b[3] || {}]));
    parts.push({ base, tpl, dir: dirs[k], c });
  });
  return { atoms, bonds, parts };
}
/** alcino linear ao longo de x */
export function buildAlkyne(ends) {
  const atoms = [{ el: 'C', p: [-0.6, 0, 0], tag: 'c1' }, { el: 'C', p: [0.6, 0, 0], tag: 'c2' }];
  const bonds = [[0, 1, 3, { normal: [0, 1, 0] }]];
  const parts = [];
  ends.forEach((g, k) => {
    const c = k, dir = k === 0 ? [-1, 0, 0] : [1, 0, 0];
    const tpl = groupTemplate(g), base = atoms.length;
    placeGroup(tpl, atoms[c].p, dir).forEach((p, n) => atoms.push({ el: tpl.atoms[n].el, p, tag: 'g' + k }));
    bonds.push([c, base]); tpl.bonds.forEach((b) => bonds.push([base + b[0], base + b[1], b[2] || 1, b[3] || {}]));
    parts.push({ base, tpl, dir, c });
  });
  return { atoms, bonds, parts };
}

/* ===================================================================
 * Alceno com orbitais p / ligação π (eteno por padrão)
 * =================================================================== */
export function alkeneScene(host, o = {}) {
  const v = new Viewer(host, { camPos: o.camPos || [2.4, 2.6, 7.2], alt: o.alt || 'Modelo 3D do eteno com orbitais p' });
  if (!v.ok) return { v };
  const B = buildAlkene(o.subs || ['H', 'H', 'H', 'H']);
  B.atoms.forEach((a) => { a.p = [a.p[0], a.p[2], -a.p[1]]; }); // plano σ horizontal (xz); orbitais p na vertical (y)
  B.bonds[0][3] = { normal: [0, 1, 0] };
  const mol = new Mol(v, B.atoms, B.bonds);
  const st = { orb: !!o.orbitals, pi: !!o.pi, angles: o.angles !== false, labels: o.labels !== false };
  const p = [lobe(v.scene, 0xff9f43, 0.42), lobe(v.scene, 0xff9f43, 0.42), lobe(v.scene, 0xff9f43, 0.42), lobe(v.scene, 0xff9f43, 0.42)];
  const pi1 = piLobe(v.scene, 0x2fd4f5, [0, 0, 0], [1, 0, 0], [0, 1, 0], { len: 1.3, w: 0.5, d: 0.62, off: 0.62 }), pi2 = piLobe(v.scene, 0x2fd4f5, [0, 0, 0], [1, 0, 0], [0, -1, 0], { len: 1.3, w: 0.5, d: 0.62, off: 0.62 });
  const lbl = [mol.addLabel(0, 'C sp²', 'tag c', [-0.5, -0.55, 0.3]), mol.addLabel(1, 'C sp²', 'tag c', [0.5, -0.55, 0.3])];
  const ang = label('', 'tag'); v.scene.add(ang);
  const info = label('', 'tag'); v.scene.add(info);
  function apply() {
    p.forEach((l, i) => { l.show(st.orb && !st.pi); l.set(B.atoms[i < 2 ? 0 : 1].p, [0, i % 2 ? -1 : 1, 0], 0.9, 0.42); });
    [pi1, pi2].forEach((l) => l.show(st.pi));
    lbl.forEach((l) => mol.setLabel(l, st.labels ? 'C sp²' : null));
    ang.visible = st.angles; ang.position.set(0, -0.6, 2.1);
    ang.userData.div.innerHTML = `H–C–H ≈ ${ANG(B.atoms[B.parts[0].base].p, B.atoms[0].p, B.atoms[B.parts[1].base].p).toFixed(0)}° · H–C=C ≈ ${ANG(B.atoms[B.parts[0].base].p, B.atoms[0].p, B.atoms[1].p).toFixed(0)}°`;
    info.visible = st.orb || st.pi; info.position.set(0, 2.0, 0);
    info.userData.div.innerHTML = st.pi ? 'ligação <b style="color:#2fd4f5">π</b>: densidade acima e abaixo do plano' : 'orbitais <b style="color:#ff9f43">p</b> paralelos, ⊥ ao plano σ';
  }
  apply();
  return { v, mol, toggle(k) { st[k] = !st[k]; if (k === 'pi' && st.pi) st.orb = true; apply(); return st[k]; }, setStyle(s) { mol.setStyle(s); } };
}

/* ===================================================================
 * Rotação em torno de C=C: perda de sobreposição
 * =================================================================== */
export function rotationScene(host, onAngle) {
  const v = new Viewer(host, { camPos: [3.5, 2.5, 7], alt: 'Rotação em torno da ligação dupla' });
  if (!v.ok) return { v };
  const B = buildAlkene(['H', 'H', 'H', 'H']);
  const base = B.atoms.map((a) => a.p.slice());
  const mol = new Mol(v, B.atoms, B.bonds);
  const p1 = [lobe(v.scene, 0xff9f43, 0.45), lobe(v.scene, 0xff9f43, 0.45)], p2 = [lobe(v.scene, 0x2fd4f5, 0.45), lobe(v.scene, 0x2fd4f5, 0.45)];
  const info = label('', 'tag big'); v.scene.add(info);
  function set(deg) {
    const a = deg * Math.PI / 180;
    B.parts.forEach((pt) => { if (pt.c === 1) for (let n = 0; n < pt.tpl.atoms.length; n++) mol.setPos(pt.base + n, rotX(base[pt.base + n], a)); });
    mol.update();
    p1.forEach((l, i) => l.set([-0.67, 0, 0], [0, 0, i ? -1 : 1], 0.9, 0.4));
    p2.forEach((l, i) => l.set([0.67, 0, 0], rotX([0, 0, i ? -1 : 1], a), 0.9, 0.4));
    const ov = Math.abs(Math.cos(a));
    info.position.set(0, -1.9, 0);
    info.userData.div.innerHTML = `sobreposição p–p ∝ |cos θ| = <b>${(ov * 100).toFixed(0)}%</b>`;
    if (onAngle) onAngle(deg, ov);
  }
  set(0);
  return { v, set };
}

/* ===================================================================
 * Alcino: dois conjuntos de orbitais p perpendiculares
 * =================================================================== */
export function alkyneScene(host, o = {}) {
  const v = new Viewer(host, { camPos: o.camPos || [1.8, 2.0, 6.2], alt: o.alt || 'Modelo 3D do etino com duas ligações π' });
  if (!v.ok) return { v };
  const B = buildAlkyne(o.ends || ['H', 'H']);
  const mol = new Mol(v, B.atoms, B.bonds);
  const st = { pi: !!o.pi, labels: o.labels !== false };
  const py = [[0, 1, 0], [0, -1, 0]].map((n) => piLobe(v.scene, 0x2fd4f5, [0, 0, 0], [1, 0, 0], n, { len: 1.15, w: 0.48, d: 0.5 })), pz = [[0, 0, 1], [0, 0, -1]].map((n) => piLobe(v.scene, 0xb18cff, [0, 0, 0], [1, 0, 0], n, { len: 1.15, w: 0.48, d: 0.5 }));
  const lbl = [mol.addLabel(0, 'C sp', 'tag m', [-0.2, -0.8, 0.5]), mol.addLabel(1, 'C sp', 'tag m', [0.2, -0.8, 0.5])];
  const info = label('', 'tag'); v.scene.add(info);
  function apply() {
    py.concat(pz).forEach((l) => l.show(st.pi));
    lbl.forEach((l) => mol.setLabel(l, st.labels ? 'C sp' : null));
    info.visible = st.pi; info.position.set(0, 1.9, 0);
    info.userData.div.innerHTML = '<b style="color:#2fd4f5">π₁</b> ⊥ <b style="color:#b18cff">π₂</b> · 180°';
  }
  apply();
  return { v, mol, toggle(k) { st[k] = !st[k]; apply(); return st[k]; }, setStyle(s) { mol.setStyle(s); } };
}

/* ===================================================================
 * Hidrogenação catalítica em superfície (syn)
 * =================================================================== */
export function hydrogenationScene(host, onSet) {
  const v = new Viewer(host, { camPos: [0, 3.2, 13], target: [0, -0.2, 0], alt: 'Hidrogenação catalítica: os dois H entram pela mesma face' });
  if (!v.ok) return { v, clock: makeClock(1, () => {}) };
  // superfície de Pd (plano y = −2.4)
  const metal = [];
  for (let i = -3; i <= 3; i++) for (let j = -2; j <= 2; j++) metal.push({ el: 'Pd', p: [i * 1.1 + (j % 2 ? 0.55 : 0), -2.6, j * 1.0] });
  const surf = new Mol(v, metal, []);
  // alceno (Z)-but-2-eno deitado (plano xz), H vão sair da superfície (−y)
  const B = buildAlkene(['CH3', 'H', 'CH3', 'H']);
  const rot = (p) => [p[0], -p[2], p[1]]; // plano xy → xz
  const base = B.atoms.map((a) => rot(a.p));
  const H1 = B.atoms.length, H2 = H1 + 1;
  const atoms = B.atoms.map((a, i) => ({ el: a.el, p: base[i], tag: a.tag })).concat([{ el: 'H', p: [-0.67, -2.1, 0.4], tag: 'h' }, { el: 'H', p: [0.67, -2.1, -0.4], tag: 'h' }]);
  const bonds = B.bonds.slice().concat([[0, H1], [1, H2], [0, 1]]);
  const mol = new Mol(v, atoms, bonds);
  const bH1 = bonds.length - 3, bH2 = bonds.length - 2, bS = bonds.length - 1;
  mol.halo(H1, 0x3ddc97, 2.2); mol.halo(H2, 0x3ddc97, 2.2);
  const info = label('', 'tag big'); v.scene.add(info);
  function set(s) {
    const drop = kf([[0, 2.2], [0.35, 0], [1, 0]], s);
    const f = kf([[0.45, 0], [0.85, 1]], s); // piramidalização
    B.parts.forEach((pt) => {
      const d = V.norm(V.add(rot(pt.dir), [0, 0.38 * f, 0]));
      placeGroup(pt.tpl, [pt.c ? 0.77 : -0.77, drop, 0], d, Math.PI / 2).forEach((p, n) => mol.setPos(pt.base + n, p));
    });
    mol.setPos(0, [-0.77 + 0.1 * (1 - f), drop, 0]); mol.setPos(1, [0.77 - 0.1 * (1 - f), drop, 0]);
    const hy = kf([[0.4, -2.05], [0.85, -1.09]], s);
    mol.setPos(H1, [-0.77, hy, 0]); mol.setPos(H2, [0.77, hy, 0]);
    mol.bonds[0].hidden = s > 0.8; mol.bonds[bS].hidden = s <= 0.8;
    mol.bonds[bH1].hidden = s < 0.8; mol.bonds[bH2].hidden = s < 0.8;
    mol.update();
    info.position.set(0, 2.6, 0);
    info.userData.div.innerHTML = s < 0.35 ? 'H₂ adsorvido e dissociado na superfície; o alceno se aproxima' : s < 0.8 ? 'alceno adsorvido pela face inferior: os H são transferidos da superfície' : '<b>adição syn</b>: os dois H entraram pela <b>mesma face</b>';
    if (onSet) onSet(s);
  }
  const clock = makeClock(1, set, { dur: 7 });
  v.onFrame((dt) => clock.tick(dt));
  set(0);
  return { v, clock, set, surf };
}

/* ===================================================================
 * Bromação: bromônio pela face superior, Br⁻ pela face inferior (anti)
 * =================================================================== */
export const BROM_STEPS = [
  { s: 0, t: 'Início', d: 'Br₂ aproxima-se da <b>face superior</b> da ligação π (polarização Br<sup>δ+</sup>–Br<sup>δ−</sup>).' },
  { s: 0.35, t: 'Bromônio', d: 'Forma-se o <b>íon bromônio</b> cíclico (Br⁺ ligado aos dois carbonos) e Br⁻ sai. Não há carbocátion livre.' },
  { s: 0.6, t: 'Ataque anti', d: 'O Br⁻ só pode atacar pela <b>face oposta</b> (inferior), abrindo o anel como numa SN2.' },
  { s: 0.9, t: 'Produto', d: 'Dibrometo vicinal: os dois Br em faces opostas → <b>adição anti</b>.' },
];
export function brominationScene(host, onSet) {
  const v = new Viewer(host, { camPos: [1.5, 2.5, 15.5], target: [0, 1.4, 0], alt: 'Bromação de alceno via íon bromônio' });
  if (!v.ok) return { v, clock: makeClock(1, () => {}) };
  const B = buildAlkene(['CH3', 'H', 'H', 'CH3']); // (E)-but-2-eno no plano xy, π em z
  const rot = (p) => [p[0], p[2], -p[1]]; // plano do alceno → xz (π ao longo de y)
  const atoms = B.atoms.map((a) => ({ el: a.el, p: rot(a.p), tag: a.tag }));
  const Ba = atoms.length, Bb = Ba + 1;
  atoms.push({ el: 'Br', p: [0, 4, 0], tag: 'br1' }, { el: 'Br', p: [0, 6, 0], tag: 'br2' });
  const bonds = B.bonds.slice().concat([[Ba, Bb], [0, Ba], [1, Ba], [1, Bb], [0, 1]]);
  const kBB = B.bonds.length, k1 = kBB + 1, k2 = kBB + 2, k3 = kBB + 3, kS = kBB + 4;
  const mol = new Mol(v, atoms, bonds);
  const lp = mol.addLabel(Ba, '', 'charge', [0, 0.75, 0]), lm = mol.addLabel(Bb, '', 'charge', [0.4, 0.6, 0]);
  const arrow = curvedArrow(v.scene, 0xff4fa3);
  const faceT = label('face superior', 'tag'), faceB = label('face inferior', 'tag'); v.scene.add(faceT); v.scene.add(faceB);
  function set(s) {
    const f1 = kf([[0.25, 0], [0.45, 1]], s), f2 = kf([[0.65, 0], [0.9, 1]], s);
    // grupos: C1 recebe Br por cima (grupos descem); C2 recebe Br por baixo (grupos sobem)
    B.parts.forEach((pt) => {
      const sign = pt.c === 0 ? -1 : 1;
      const k = pt.c === 0 ? kf([[0.25, 0], [0.45, 0.5], [0.9, 1]], s) : f2;
      const d = V.norm(V.add(rot(pt.dir), [0, 0.42 * sign * k, 0]));
      placeGroup(pt.tpl, atoms[pt.c].p, d, Math.PI / 2).forEach((p, n) => mol.setPos(pt.base + n, p));
    });
    mol.setPos(0, [-0.67 - 0.1 * f1, 0, 0]); mol.setPos(1, [0.67 + 0.1 * f1, 0, 0]);
    // Br1: desce sobre o centro (bromônio), depois fica no C1
    const yA = kf([[0, 3.6], [0.35, 1.7], [0.6, 1.7], [0.9, 1.9]], s), xA = kf([[0.6, 0], [0.9, -0.67]], s);
    mol.setPos(Ba, [xA, yA, 0]);
    // Br2: sai (Br⁻), contorna e ataca C2 por baixo
    let pB;
    if (s < 0.35) pB = [0, yA + 2.3 + 2 * kf([[0.25, 0], [0.35, 1]], s), 0];
    else { const t = kf([[0.35, 0], [0.62, 1], [0.9, 1.6]], s); pB = t <= 1 ? [3.4 * Math.sin(t * Math.PI / 2) + 0.6, 6 - 7.6 * t, 0] : [0.67 + 2.9 * (1.6 - t) / 0.6, -2.0 + 0.1 * (t - 1), 0]; }
    if (s >= 0.9) pB = [0.67, -1.95, 0];
    mol.setPos(Bb, pB);
    mol.bonds[kBB].hidden = s > 0.3;
    mol.bonds[k1].hidden = s < 0.33;
    mol.bonds[k2].hidden = !(s >= 0.33 && s < 0.85);
    mol.bonds[k3].hidden = s < 0.85;
    mol.bonds[0].hidden = s > 0.33; mol.bonds[kS].hidden = s <= 0.33;
    mol.update();
    mol.setLabel(lp, s > 0.33 && s < 0.85 ? '+' : null, 'charge');
    mol.setLabel(lm, s > 0.33 && s < 0.88 ? '−' : null, 'charge');
    const ar = s > 0.62 && s < 0.86;
    arrow.show(ar);
    if (ar) { const P = mol.atoms[Bb].p; arrow.set(V.add(P, [-0.2, 0.3, 0]), [1.6, -1.2, 0.6], [0.8, -0.35, 0], smooth(Math.min(1, (s - 0.62) / 0.12))); }
    faceT.position.set(-2.6, 1.3, 0); faceB.position.set(-2.6, -1.3, 0);
    if (onSet) onSet(s);
  }
  const clock = makeClock(1, set, { dur: 9 });
  v.onFrame((dt) => clock.tick(dt));
  set(0);
  return { v, clock, set };
}

/* ===================================================================
 * Hidroboração-oxidação do propeno (syn, anti-Markovnikov)
 * =================================================================== */
export const HB_STEPS = [
  { s: 0, t: 'Início', d: 'BH₃ (B com orbital p vazio, eletrofílico) aproxima-se da face superior do propeno.' },
  { s: 0.4, t: 'ET de 4 centros', d: 'Estado de transição <b>concertado</b>: C–B e C–H formam-se ao mesmo tempo, pela <b>mesma face</b>. O B liga-se ao C menos impedido (CH₂).' },
  { s: 0.65, t: 'Alquilborana', d: 'H e B entraram pela mesma face: <b>adição syn</b>. Regioquímica <b>anti-Markovnikov</b>.' },
  { s: 0.85, t: 'Oxidação', d: 'H₂O₂/OH⁻ substitui B por OH com <b>retenção</b> de configuração: propan-1-ol.' },
];
export function hydroborationScene(host, onSet) {
  const v = new Viewer(host, { camPos: [1.5, 2.5, 13.5], target: [0, 1.3, 0], alt: 'Hidroboração syn do propeno' });
  if (!v.ok) return { v, clock: makeClock(1, () => {}) };
  const Bk = buildAlkene(['H', 'H', 'CH3', 'H']);
  const rot = (p) => [p[0], p[2], -p[1]];
  const atoms = Bk.atoms.map((a) => ({ el: a.el, p: rot(a.p), tag: a.tag }));
  const iB = atoms.length; atoms.push({ el: 'B', p: [-0.7, 4, 0] });
  const iH = atoms.length; atoms.push({ el: 'H', p: [0.6, 4, 0] });
  const iBH = [atoms.length, atoms.length + 1]; atoms.push({ el: 'H', p: [-1.2, 4.8, 0.7] }, { el: 'H', p: [-1.2, 4.8, -0.7] });
  const iO = atoms.length; atoms.push({ el: 'O', p: [-0.67, 1.5, 0] }); const iOH = atoms.length; atoms.push({ el: 'H', p: [-1.2, 2.2, 0] });
  const bonds = Bk.bonds.slice().concat([[iB, iH], [iB, iBH[0]], [iB, iBH[1]], [0, iB], [1, iH], [iB, iH, 1, { partial: true }], [0, iB, 1, { partial: true }], [1, iH, 1, { partial: true }], [0, iO], [iO, iOH], [0, 1]]);
  const K = Bk.bonds.length;
  const mol = new Mol(v, atoms, bonds);
  const tB = mol.addLabel(iB, 'B', 'tag o', [0, 0.65, 0]), tH = mol.addLabel(iH, 'H', 'tag c', [0, 0.55, 0]), tO = mol.addLabel(iO, 'OH', 'tag m', [0, 0.65, 0]);
  const tMe = mol.addLabel(Bk.parts[2].base, 'CH₃', 'tag', [0.3, -0.5, 0]);
  void tMe;
  function set(s) {
    const f = kf([[0.3, 0], [0.62, 1]], s);
    Bk.parts.forEach((pt) => {
      const d = V.norm(V.add(rot(pt.dir), [0, -0.42 * f, 0]));
      placeGroup(pt.tpl, mol.atoms[pt.c].p, d, Math.PI / 2).forEach((p, n) => mol.setPos(pt.base + n, p));
    });
    const y = kf([[0, 3.6], [0.4, 1.95], [0.62, 1.55], [1, 1.55]], s);
    const Bp = [-0.67, y, 0], Hp = [0.67, kf([[0, 3.6], [0.4, 1.75], [0.62, 1.09], [1, 1.09]], s), 0];
    mol.setPos(iB, s < 0.4 ? [-0.2, y + 0.1, 0] : Bp);
    mol.setPos(iH, s < 0.4 ? [0.95, y, 0] : Hp);
    const bp = mol.atoms[iB].p;
    mol.setPos(iBH[0], V.add(bp, [-0.55, 0.9, 0.6])); mol.setPos(iBH[1], V.add(bp, [-0.55, 0.9, -0.6]));
    mol.setPos(iO, [-0.67, 1.43, 0]); mol.setPos(iOH, [-1.25, 2.1, 0]);
    const ox = s >= 0.85;
    [iB, iBH[0], iBH[1]].forEach((i) => { mol.atoms[i].hidden = ox; });
    [iO, iOH].forEach((i) => { mol.atoms[i].hidden = !ox; });
    const bs = mol.bonds;
    bs[K].hidden = s > 0.62; // B–H (vai para o C)
    bs[K + 3].hidden = s < 0.62 || ox; bs[K + 4].hidden = s < 0.62;
    bs[K + 5].hidden = !(s >= 0.36 && s < 0.62); bs[K + 6].hidden = !(s >= 0.36 && s < 0.62); bs[K + 7].hidden = !(s >= 0.36 && s < 0.62);
    bs[0].hidden = s > 0.6; bs[bs.length - 1].hidden = s <= 0.6;
    mol.update();
    mol.setLabel(tB, ox ? null : 'B', 'tag o'); mol.setLabel(tO, ox ? 'OH' : null, 'tag m'); mol.setLabel(tH, 'H', 'tag c');
    if (onSet) onSet(s);
  }
  const clock = makeClock(1, set, { dur: 9 });
  v.onFrame((dt) => clock.tick(dt));
  set(0);
  return { v, clock, set };
}

/* ===================================================================
 * Produtos: syn × anti (epóxido, diol, dibrometo) a partir do (Z)-but-2-eno
 * =================================================================== */
export function facesScene(host, kind = 'diol') {
  const v = new Viewer(host, { camPos: [1.5, 2.5, 9], alt: 'Produto de adição syn ou anti' });
  if (!v.ok) return { v };
  let mol = null;
  const info = label('', 'tag big'); v.scene.add(info);
  function build(k) {
    if (mol) v.scene.remove(mol.group);
    const Bk = buildAlkene(['CH3', 'H', 'CH3', 'H']);
    const rot = (p) => [p[0], p[2], -p[1]];
    const atoms = Bk.atoms.map((a) => ({ el: a.el, p: rot(a.p) }));
    const bonds = Bk.bonds.map((b) => b.slice());
    bonds[0] = [0, 1, k === 'alkene' ? 2 : 1, { normal: [0, 1, 0] }];
    const up = (c, sgn) => {
      Bk.parts.filter((pt) => pt.c === c).forEach((pt) => { const d = V.norm(V.add(rot(pt.dir), [0, -0.4 * sgn, 0])); placeGroup(pt.tpl, atoms[c].p, d, Math.PI / 2).forEach((p, n) => { atoms[pt.base + n].p = p; }); });
    };
    if (k === 'epoxide') { up(0, 1); up(1, 1); const o = atoms.push({ el: 'O', p: [0, 1.25, 0] }) - 1; bonds.push([0, o], [1, o]); }
    if (k === 'diol') { up(0, 1); up(1, 1); [0, 1].forEach((c) => { const o = atoms.push({ el: 'O', p: [atoms[c].p[0] * 1.15, 1.43, 0] }) - 1; bonds.push([c, o]); const hh = atoms.push({ el: 'H', p: [atoms[c].p[0] * 1.15 + (c ? 0.5 : -0.5), 2.1, 0.3] }) - 1; bonds.push([o, hh]); }); }
    if (k === 'anti') { up(0, 1); up(1, -1); const b1 = atoms.push({ el: 'Br', p: [atoms[0].p[0], 1.94, 0] }) - 1, b2 = atoms.push({ el: 'Br', p: [atoms[1].p[0], -1.94, 0] }) - 1; bonds.push([0, b1], [1, b2]); }
    mol = new Mol(v, atoms, bonds);
    info.position.set(0, -2.4, 0);
    info.userData.div.innerHTML = { alkene: '(Z)-but-2-eno: duas faces (superior e inferior)', epoxide: 'epóxido: O na <b>mesma face</b> dos dois C (syn)', diol: 'diol vicinal syn: os dois OH na <b>mesma face</b>', anti: 'dibrometo: Br em <b>faces opostas</b> (anti)' }[k];
  }
  build(kind);
  return { v, build };
}

/* ===================================================================
 * Lindlar (syn → cis) × Na/NH3 (anti → trans): but-2-ino
 * =================================================================== */
export function reductionScene(host, mode = 'lindlar') {
  const v = new Viewer(host, { camPos: [0, 1.2, 10.5], target: [0, 0.3, 0], alt: mode === 'lindlar' ? 'Hidrogenação de Lindlar formando alceno cis' : 'Redução com Na/NH3 formando alceno trans' });
  if (!v.ok) return { v, clock: makeClock(1, () => {}) };
  const atoms = [{ el: 'C', p: [-0.6, 0, 0] }, { el: 'C', p: [0.6, 0, 0] }];
  const me = [groupTemplate('CH3'), groupTemplate('CH3')];
  const base = [2, 2 + me[0].atoms.length];
  me.forEach((tpl) => tpl.atoms.forEach((a) => atoms.push({ el: a.el, p: [0, 0, 0] })));
  const H1 = atoms.length, H2 = H1 + 1;
  atoms.push({ el: 'H', p: [0, 0, 0] }, { el: 'H', p: [0, 0, 0] });
  const bonds = [[0, 1, 3, { normal: [0, 0, 1] }], [0, 1, 2, { normal: [0, 0, 1] }], [0, base[0]], [1, base[1]], [0, H1], [1, H2]];
  me.forEach((tpl, k) => tpl.bonds.forEach((b) => bonds.push([base[k] + b[0], base[k] + b[1]])));
  const mol = new Mol(v, atoms, bonds);
  mol.halo(H1, 0x3ddc97, 2.2); mol.halo(H2, 0x3ddc97, 2.2);
  const info = label('', 'tag big'); v.scene.add(info);
  const lin = mode === 'lindlar';
  function set(s) {
    const f = kf([[0.3, 0], [0.8, 1]], s);
    const cx = 0.6 + 0.07 * f;
    // CH3: de linear (180°) a 120°; C1 sempre "para cima"; C2 para cima (cis) ou para baixo (trans)
    const th = (Math.PI / 3) * f; // desvio em relação ao eixo
    const d1 = [-Math.cos(th), Math.sin(th), 0], d2 = [Math.cos(th), (lin ? 1 : -1) * Math.sin(th), 0];
    mol.setPos(0, [-cx, 0, 0]); mol.setPos(1, [cx, 0, 0]);
    placeGroup(me[0], [-cx, 0, 0], d1, Math.PI / 2).forEach((p, n) => mol.setPos(base[0] + n, p));
    placeGroup(me[1], [cx, 0, 0], d2, Math.PI / 2).forEach((p, n) => mol.setPos(base[1] + n, p));
    const hd1 = [-0.5, -0.866, 0], hd2 = [0.5, lin ? -0.866 : 0.866, 0];
    const hy = kf([[0, 2.7], [0.3, 2.1], [0.8, 1.09]], s);
    mol.setPos(H1, V.add([-cx, 0, 0], V.mul(hd1, hy))); mol.setPos(H2, V.add([cx, 0, 0], V.mul(hd2, hy)));
    mol.bonds[0].hidden = s > 0.6; mol.bonds[1].hidden = s <= 0.6;
    mol.bonds[4].hidden = s < 0.6; mol.bonds[5].hidden = s < 0.6;
    mol.update();
    info.position.set(0, 2.9, 0);
    info.userData.div.innerHTML = s < 0.3 ? 'but-2-ino (linear, C sp)' : s < 0.8 ? (lin ? 'H₂ entra pela <b>mesma face</b> (superfície)' : 'e⁻ / H⁺ / e⁻ / H⁺: os H ficam em <b>lados opostos</b>') : (lin ? '<b>(Z)-but-2-eno</b> (cis)' : '<b>(E)-but-2-eno</b> (trans)');
  }
  const clock = makeClock(1, set, { dur: 6 });
  v.onFrame((dt) => clock.tick(dt));
  set(0);
  return { v, clock, set };
}

/* ===================================================================
 * Cis × trans (ou E × Z) lado a lado
 * =================================================================== */
export function isomerScene(host, subs, cap) {
  const v = new Viewer(host, { camPos: [0.5, 2.5, 8.5], alt: cap || 'Isômero geométrico' });
  if (!v.ok) return { v };
  const B = buildAlkene(subs);
  const mol = new Mol(v, B.atoms, B.bonds);
  if (cap) v.caption(cap);
  return { v, mol, setStyle(s) { mol.setStyle(s); } };
}
export { BOND };
