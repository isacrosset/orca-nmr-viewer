/*
 * scenes.js — cenas 3D: E2 (anti-periplanar, orbitais, estereoquímica), cadeira,
 * E1, carbocátion, bases e acessibilidade dos Hβ.
 */
import { THREE, Viewer, Mol, Center, V, ELEM, BOND, kf, smooth, lobe, curvedArrow, line3, tetraDirs, label, groupTemplate, placeGroup } from './viewer3d.js';

export function makeClock(max, onSet, o = {}) {
  const st = { s: o.start || 0, playing: false, speed: 1, loop: !!o.loop, dur: o.dur || 6 };
  const api = {
    get s() { return st.s; },
    set(s) { st.s = Math.max(0, Math.min(max, s)); onSet(st.s); },
    play() { if (st.s >= max - 1e-6 && !st.loop) st.s = 0; st.playing = true; api.onState && api.onState(true); },
    pause() { st.playing = false; api.onState && api.onState(false); },
    toggle() { st.playing ? api.pause() : api.play(); },
    get playing() { return st.playing; },
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

export function dihedral(a, b, c, d) {
  const b0 = V.sub(a, b), b1 = V.sub(c, b), b2 = V.sub(d, c);
  const n1 = V.norm(b1);
  const v = V.sub(b0, V.mul(n1, V.dot(b0, n1))), w = V.sub(b2, V.mul(n1, V.dot(b2, n1)));
  const x = V.dot(v, w), y = V.dot(V.cross(n1, v), w);
  return Math.atan2(y, x) * 180 / Math.PI;
}
const rotX = (p, deg) => { const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return [p[0], c * p[1] - s * p[2], s * p[1] + c * p[2]]; };

/* ===================================================================
 * E2 genérica: Cα (origem) — Cβ (+x). GA "para cima" em Cα; Hβ "para baixo" em Cβ.
 * alpha: [g1 (z−), g2 (z+)]  beta: [h1 (z−), h2 (z+)]
 * =================================================================== */
export const E2_STEPS = [
  { s: 0, t: '1 · Base se aproxima do Hβ', d: 'O etóxido (base, laranja) aproxima-se do <b>Hβ</b>, que está <b>anti-periplanar</b> ao Br (diedro H–Cβ–Cα–Br ≈ 180°).' },
  { s: 0.4, t: '2 · Base–H se formando', d: 'Começa a formar-se a ligação <b>O–H</b> (base–hidrogênio).' },
  { s: 0.45, t: '3 · Cβ–H se rompendo', d: 'Ao mesmo tempo, a ligação <b>Cβ–H</b> se alonga: seus elétrons passam a se deslocar para a região entre Cβ e Cα.' },
  { s: 0.5, t: '4 · Estado de transição', d: '<b>Estado de transição</b>: O···H, H···Cβ e Cα···Br parciais; ligação π <b>parcialmente formada</b>. Os dois carbonos ficam quase planos. Não é intermediário: não pode ser isolado.' },
  { s: 0.58, t: '5 · π se forma, Cα–Br se rompe', d: 'Os orbitais p de Cα e Cβ se alinham e formam a ligação <b>π C=C</b> enquanto o par da ligação Cα–Br vai para o Br.' },
  { s: 0.8, t: '6 · Saída de Br⁻', d: 'Produtos: <b>alceno</b> (verde), álcool (base protonada) e <b>Br⁻</b>. Tudo ocorreu em <b>uma única etapa</b> (concertada).' },
];

export function e2Scene(host, o = {}) {
  o = Object.assign({ alpha: ['CH3', 'H'], beta: ['H', 'CH3'], lg: 'Br', base: 'Et', rot: 0, arrows: true, orbitals: false, labels: true, loop: false, dur: 8, camPos: [1.6, 0.4, 14.5], target: [0.8, -1.5, 0] }, o);
  const v = new Viewer(host, { camPos: o.camPos, target: o.target, autoRotate: o.autoRotate, alt: o.alt || 'Mecanismo E2 em 3D' });
  if (!v.ok) return { v, clock: makeClock(1, () => {}) };
  const atoms = [], bonds = [];
  const add = (el, tag) => { atoms.push({ el, p: [0, 0, 0], tag }); return atoms.length - 1; };
  const CA = add('C', 'ca'), CB = add('C', 'cb');
  const bCC1 = bonds.push([CA, CB]) - 1, bCC2 = bonds.push([CA, CB, 2, { normal: [0, 1, 0] }]) - 1;
  const LG = add(o.lg, 'lg');
  const bLG = bonds.push([CA, LG]) - 1, bLGp = bonds.push([CA, LG, 1, { partial: true }]) - 1;
  const HB = add('H', 'hb');
  const bCH = bonds.push([CB, HB]) - 1, bCHp = bonds.push([CB, HB, 1, { partial: true }]) - 1;
  const O = add('O', 'base');
  const bOH = bonds.push([O, HB]) - 1, bOHp = bonds.push([O, HB, 1, { partial: true }]) - 1;
  const grp = (name, center, tag) => {
    const tpl = groupTemplate(name);
    const base = atoms.length;
    tpl.atoms.forEach((a) => add(a.el, tag));
    bonds.push([center, base]);
    tpl.bonds.forEach((b) => bonds.push([base + b[0], base + b[1], b[2] || 1, b[3] || {}]));
    return { tpl, base, name };
  };
  const A = o.alpha.map((g) => grp(g, CA, 'ga'));
  const B = o.beta.map((g) => grp(g, CB, 'gb'));
  const BASE = o.base ? grp(o.base, O, 'base') : null;
  const mol = new Mol(v, atoms, bonds);
  const lO = mol.addLabel(O, '−', 'charge', [0, 0.65, 0]);
  const lLG = mol.addLabel(LG, 'δ−', 'dminus', [0, 0.85, 0]);
  const lA = mol.addLabel(CA, 'Cα', 'tag c', [-0.4, 0.55, 0.6]);
  const lB = mol.addLabel(CB, 'Cβ', 'tag c', [0.5, 0.55, 0.6]);
  const lH = mol.addLabel(HB, 'Hβ', 'tag c', [0.5, -0.3, 0]);
  const lTS = label('', 'tag big'); v.scene.add(lTS);
  const lProd = label('', 'tag big'); v.scene.add(lProd);
  const lBase = o.labels ? mol.addLabel(O, 'base', 'tag o', [0, -0.85, 0]) : null;
  const hLG = mol.halo(LG, 0xff4fa3, 1.5);
  const hH = mol.halo(HB, 0x2fd4f5, 2.2);
  const a1 = curvedArrow(v.scene, 0xff9f43), a2 = curvedArrow(v.scene, 0x2fd4f5), a3 = curvedArrow(v.scene, 0xff4fa3);
  const oCH = lobe(v.scene, 0x2fd4f5, 0.4), oCX = lobe(v.scene, 0xff4fa3, 0.38);
  const pA1 = lobe(v.scene, 0xff9f43, 0.35), pA2 = lobe(v.scene, 0xff9f43, 0.35), pB1 = lobe(v.scene, 0xff9f43, 0.35), pB2 = lobe(v.scene, 0xff9f43, 0.35);
  const pi1 = lobe(v.scene, 0x3ddc97, 0.32), pi2 = lobe(v.scene, 0x3ddc97, 0.32);
  const oLbl = label('', 'tag'); v.scene.add(oLbl);
  const st = { arrows: o.arrows, orbitals: o.orbitals, rot: o.rot, s: 0 };
  const U = [-1 / 3, 0.943, 0];
  const aT = [[-1 / 3, -0.471, -0.816], [-1 / 3, -0.471, 0.816]], aP = [[-0.5, 0, -0.866], [-0.5, 0, 0.866]];
  const hT = [1 / 3, -0.943, 0];
  const bT = [[1 / 3, 0.471, -0.816], [1 / 3, 0.471, 0.816]], bP = [[0.5, 0, -0.866], [0.5, 0, 0.866]];

  function set(s) {
    st.s = s;
    const f = kf([[0, 0], [0.4, 0.08], [0.5, 0.5], [0.62, 0.92], [1, 1]], s);
    const dCC = 1.53 - 0.19 * f;
    const CBp = [dCC, 0, 0];
    mol.setPos(CA, [0, 0, 0]); mol.setPos(CB, CBp);
    const R = s < 0.02 ? st.rot : 0; // rotação em torno de Cα–Cβ (só antes da reação)
    A.forEach((g, i) => { const d = V.norm(V.lerp(aT[i], aP[i], f)); placeGroup(g.tpl, [0, 0, 0], d).forEach((p, n) => mol.setPos(g.base + n, p)); });
    B.forEach((g, i) => { let d = V.norm(V.lerp(bT[i], bP[i], f)); d = rotX(d, R); placeGroup(g.tpl, CBp, d).forEach((p, n) => mol.setPos(g.base + n, p)); });
    const dirH = V.norm(rotX(hT, R));
    const dCH = kf([[0, 1.09], [0.4, 1.14], [0.5, 1.35], [0.6, 1.75], [1, 1.75]], s);
    const dOH = kf([[0, 4.2], [0.4, 1.7], [0.5, 1.3], [0.6, 0.97], [1, 0.97]], s);
    const drift = kf([[0.6, 0], [1, 2.4]], s);
    const Hp = V.add(CBp, V.mul(dirH, dCH + drift));
    const Op = V.add(CBp, V.mul(dirH, dCH + dOH + drift));
    mol.setPos(HB, Hp); mol.setPos(O, Op);
    if (BASE) placeGroup(BASE.tpl, Op, V.norm(V.add(dirH, [0.9, 0, 0.35]))).forEach((p, n) => mol.setPos(BASE.base + n, p));
    // base só aparece quando o Hβ está anti ao GA (evita a base "girando" junto)
    const hideBase = s < 0.02 && Math.abs(R) > 3;
    mol.atoms[O].hidden = hideBase;
    if (BASE) BASE.tpl.atoms.forEach((_, n) => { mol.atoms[BASE.base + n].hidden = hideBase; });
    const dLG = kf([[0, BOND['C-' + o.lg] || 1.94], [0.4, 2.0], [0.5, 2.45], [0.62, 3.2], [1, 6]], s);
    mol.setPos(LG, V.mul(U, dLG));
    const B2 = mol.bonds;
    B2[bCC1].hidden = s >= 0.56; B2[bCC2].hidden = s < 0.56;
    B2[bLG].hidden = s >= 0.44; B2[bLGp].hidden = !(s >= 0.44 && s < 0.6);
    B2[bCH].hidden = s >= 0.44; B2[bCHp].hidden = !(s >= 0.44 && s < 0.6);
    B2[bOH].hidden = s < 0.6; B2[bOHp].hidden = !(s >= 0.36 && s < 0.6);
    mol.update();
    mol.setLabel(lO, s < 0.42 ? '−' : s < 0.55 ? 'δ−' : null, s < 0.42 ? 'charge' : 'dminus');
    mol.setLabel(lLG, s < 0.6 ? 'δ−' : '−', s < 0.6 ? 'dminus' : 'charge');
    hLG.on = true; hH.on = s < 0.6;
    lTS.visible = s > 0.47 && s < 0.56; lTS.userData.div.textContent = 'estado de transição ‡'; lTS.position.set(3.4, 1.4, 0);
    lProd.visible = s > 0.9; lProd.position.set(0.7, 1.6, 0);
    if (s > 0.9) lProd.userData.div.innerHTML = 'alceno ' + (productEZ() ? `<b>(${productEZ()})</b>` : '');
    if (lBase) mol.setLabel(lBase, s < 0.45 ? 'base' : null);
    if (o.labels) mol.setLabel(lH, s < 0.47 ? 'Hβ' : null);
    // setas
    const ar = st.arrows && s > 0.03 && s < 0.5;
    [a1, a2, a3].forEach((a) => a.show(ar));
    if (ar) {
      const fr = smooth(Math.min(1, (s - 0.03) / 0.22));
      a1.set(V.add(Op, V.mul(dirH, -0.35)), V.add(V.lerp(Op, Hp, 0.5), [-0.9, 0, 0.5]), V.add(Hp, V.mul(dirH, 0.25)), fr);
      const mCH = V.lerp(CBp, Hp, 0.5), mCC = [dCC / 2, -0.15, 0];
      a2.set(mCH, V.add(V.lerp(mCH, mCC, 0.5), [0.6, -0.4, 0.6]), mCC, fr);
      const Lp = mol.atoms[LG].p, mL = V.mul(Lp, 0.5);
      a3.set(mL, V.add(mL, [-0.9, 0.3, 0.5]), V.add(Lp, [-0.4, 0.1, 0.2]), fr);
    }
    // orbitais
    const so = st.orbitals;
    const showSig = so && s < 0.42, showP = so && s >= 0.3 && s < 0.85, showPi = so && s >= 0.7;
    oCH.show(showSig); oCX.show(showSig);
    if (showSig) { oCH.set(CBp, dirH, 0.62, 0.32); oCX.set([0, 0, 0], [0, -1, 0], 0.85, 0.45); }
    const pk = kf([[0.3, 0.3], [0.5, 0.8], [0.7, 1]], s);
    [pA1, pA2, pB1, pB2].forEach((l) => l.show(showP));
    if (showP) {
      pA1.set([0, 0, 0], [0, 1, 0], 0.75 * pk, 0.36 * pk); pA2.set([0, 0, 0], [0, -1, 0], 0.75 * pk, 0.36 * pk);
      pB1.set(CBp, [0, 1, 0], 0.75 * pk, 0.36 * pk); pB2.set(CBp, [0, -1, 0], 0.75 * pk, 0.36 * pk);
    }
    pi1.show(showPi); pi2.show(showPi);
    if (showPi) { const k = kf([[0.7, 0.2], [0.85, 1]], s); pi1.set([dCC / 2, 0, 0], [0, 1, 0], 0.55, 0.95 * k); pi1.m.scale.set(0.95 * k, 0.55, 0.42); pi2.set([dCC / 2, 0, 0], [0, -1, 0], 0.55, 0.95 * k); pi2.m.scale.set(0.95 * k, 0.55, 0.42); }
    oLbl.visible = so;
    oLbl.userData.div.textContent = showSig ? 'σ C–H (ciano) alinhado ao σ* C–Br (magenta)' : showPi ? 'ligação π formada' : 'orbitais p se formando em Cα e Cβ';
    oLbl.position.set(3.2, 3.0, 0);
    if (o.onSet) o.onSet(s);
  }
  function productEZ() {
    if (!o.prio) return null;
    // maior prioridade em cada carbono; mesmo sinal de z → Z
    const pa = o.prio.alpha, pb = o.prio.beta;
    const za = pa[0] < pa[1] ? -1 : 1, zb = pb[0] < pb[1] ? -1 : 1;
    return za === zb ? 'Z' : 'E';
  }
  const clock = makeClock(1, set, { loop: o.loop, dur: o.dur });
  v.onFrame((dt) => clock.tick(dt));
  if (o.autoPlay) clock.play();
  set(0);
  return {
    v, mol, clock, set, productEZ,
    toggle(k, val) { st[k] = val === undefined ? !st[k] : val; set(st.s); return st[k]; },
    setRot(deg) { st.rot = deg; set(st.s); },
    get rot() { return st.rot; },
    dihedral() { return dihedral(mol.atoms[HB].p, mol.atoms[CB].p, mol.atoms[CA].p, mol.atoms[LG].p); },
  };
}

/* ===================================================================
 * Cadeira do ciclo-hexano: E2 trans-diaxial
 * =================================================================== */
const CHAIR_ROT_POS = [3.2, 3.2, 12.5];
function chairAtoms(t, subs) {
  const R = 1.46, h = 0.25, ring = [], sub = {};
  for (let k = 0; k < 6; k++) {
    const phi = k * Math.PI / 3, s0 = k % 2 === 0 ? 1 : -1;
    ring.push([R * Math.cos(phi), R * Math.sin(phi), h * s0 * (1 - 2 * t)]);
  }
  for (let k = 0; k < 6; k++) {
    const phi = k * Math.PI / 3, s0 = k % 2 === 0 ? 1 : -1;
    const rad = [Math.cos(phi), Math.sin(phi), 0];
    const dirs = (sg) => ({ u: sg > 0 ? [0, 0, 1] : V.add(V.mul(rad, 0.943), [0, 0, 0.333]), d: sg < 0 ? [0, 0, -1] : V.add(V.mul(rad, 0.943), [0, 0, -0.333]) });
    const A = dirs(s0), B = dirs(-s0);
    ['u', 'd'].forEach((f) => {
      const d = V.norm(V.lerp(A[f], B[f], t));
      const role = (t < 0.5 ? (f === 'u' ? s0 > 0 : s0 < 0) : (f === 'u' ? -s0 > 0 : -s0 < 0)) ? 'ax' : 'eq';
      sub[k + f] = { dir: d, role, name: subs[k + f] || 'H' };
    });
  }
  // eixo axial (z) → vertical na tela (y)
  const M = (p) => [p[0], p[2], -p[1]];
  Object.values(sub).forEach((x) => { x.dir = M(x.dir); });
  return { ring: ring.map(M), sub };
}
export const CHAIR_SUBS = {
  bromo: { name: 'bromociclo-hexano', subs: { '0u': 'Br' } },
  cis: { name: 'cis-1-bromo-4-terc-butilciclo-hexano', subs: { '0u': 'Br', '3u': 'tBu' } },
  trans: { name: 'trans-1-bromo-4-terc-butilciclo-hexano', subs: { '0u': 'Br', '3d': 'tBu' } },
  metil: { name: '1-bromo-1-metilciclo-hexano', subs: { '0u': 'Br', '0d': 'CH3' } },
};
export function chairScene(host, kind = 'bromo', onState) {
  const v = new Viewer(host, { camPos: CHAIR_ROT_POS, alt: 'E2 em ciclo-hexano: exigência trans-diaxial' });
  if (!v.ok) return { v };
  let t = 0, cur = CHAIR_SUBS[kind];
  let mol = null, parts = [], line = null, lbl = null;
  const build = () => {
    if (mol) v.scene.remove(mol.group);
    const atoms = [], bonds = [];
    const ch = chairAtoms(t, cur.subs);
    ch.ring.forEach((p) => atoms.push({ el: 'C', p }));
    for (let k = 0; k < 6; k++) bonds.push([k, (k + 1) % 6]);
    parts = [];
    Object.entries(ch.sub).forEach(([key, s]) => {
      const tpl = groupTemplate(s.name);
      const base = atoms.length;
      placeGroup(tpl, ch.ring[+key[0]], s.dir).forEach((p, n) => atoms.push({ el: tpl.atoms[n].el, p, tag: key }));
      bonds.push([+key[0], base]);
      tpl.bonds.forEach((b) => bonds.push([base + b[0], base + b[1]]));
      parts.push({ key, base, tpl, n: tpl.atoms.length });
    });
    mol = new Mol(v, atoms, bonds);
    if (!line) { line = line3(v.scene, 0x3ddc97); lbl = label('', 'tag big'); v.scene.add(lbl); }
    refresh(ch);
  };
  function refresh(ch) {
    ch = ch || chairAtoms(t, cur.subs);
    parts.forEach((pt) => {
      const s = ch.sub[pt.key];
      placeGroup(pt.tpl, ch.ring[+pt.key[0]], s.dir).forEach((p, n) => mol.setPos(pt.base + n, p));
    });
    ch.ring.forEach((p, k) => mol.setPos(k, p));
    const brAx = ch.sub['0u'].role === 'ax';
    // H axiais anti ao Br: posições 1d e 5d
    ['1d', '5d'].forEach((key) => {
      const pt = parts.find((x) => x.key === key);
      const anti = brAx && ch.sub[key].role === 'ax' && ch.sub[key].name === 'H';
      mol.meshes[pt.base].material.color.set(anti ? 0x3ddc97 : ELEM.H.color);
    });
    const brI = parts.find((x) => x.key === '0u').base;
    const h1 = parts.find((x) => x.key === '1d').base;
    mol.meshes[brI].material.color.set(ELEM.Br.color);
    mol.update();
    const dh = dihedral(mol.atoms[h1].p, mol.atoms[1].p, mol.atoms[0].p, mol.atoms[brI].p);
    line.show(true);
    line.set(mol.atoms[brI].p, mol.atoms[h1].p);
    lbl.position.set(0, -3.1, 0);
    lbl.userData.div.innerHTML = brAx ? `Br <b>axial</b> · H–C2–C1–Br = ${Math.abs(dh).toFixed(0)}° <span class="status-ok">✓ E2</span>` : `Br <b>equatorial</b> · H–C2–C1–Br = ${Math.abs(dh).toFixed(0)}° <span class="status-bad">✗</span>`;
    if (onState) onState({ brAx, t, name: cur.name, kind });
  }
  build();
  return {
    v,
    flip() {
      const from = t, to = t < 0.5 ? 1 : 0, t0 = performance.now();
      const step = (now) => {
        const k = Math.min(1, (now - t0) / 1200);
        t = from + (to - from) * smooth(k);
        refresh();
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    },
    setKind(k) { kind = k; cur = CHAIR_SUBS[k]; t = 0; build(); },
  };
}

/* ===================================================================
 * E1: (CH3)3C–Br → (CH3)3C+ → 2-metilpropeno (base: H2O)
 * =================================================================== */
export const E1_STEPS = [
  { t: 'Início', d: 'Brometo de <i>terc</i>-butila em solvente prótico (ex.: etanol aquoso), sem base forte.' },
  { t: 'Etapa 1 · Ionização (lenta)', d: 'A ligação C–Br sofre <b>quebra heterolítica</b>: forma-se o <b>carbocátion</b> terciário (plano, orbital p vazio) e Br⁻. É a etapa determinante da velocidade: v = k[RX].' },
  { t: 'Etapa 2 · Remoção do Hβ', d: 'Uma base fraca (aqui, H₂O) remove um <b>Hβ</b> cuja ligação C–H está alinhada com o orbital p vazio. O par da ligação C–H forma a ligação <b>π</b>: produto <b>2-metilpropeno</b>.' },
];
export function e1Scene(host, o = {}) {
  const v = new Viewer(host, { camPos: [-1.5, 2.5, 12.5], target: [0.2, 0.4, 0], alt: 'Mecanismo E1 em 3D' });
  if (!v.ok) return { v, clock: makeClock(2, () => {}) };
  const C = new Center(['CH3', 'CH3']);
  const Br = C.add('Br', [1.97, 0, 0]);
  const bBr = C.bond(0, Br);
  // metila que será desprotonada: átomos explícitos
  const Cm = C.add('C', [0, 0, 0]);
  const bCm = C.bond(0, Cm), bCm2 = C.bond(0, Cm, 2, { normal: [1, 0, 0] });
  const Hm = [C.add('H', [0, 0, 0]), C.add('H', [0, 0, 0]), C.add('H', [0, 0, 0])];
  const bHm = Hm.map((hh) => C.bond(Cm, hh));
  const Ow = C.add('O', [0, 0, 0]), Hw1 = C.add('H', [0, 0, 0]), Hw2 = C.add('H', [0, 0, 0]);
  C.bond(Ow, Hw1); C.bond(Ow, Hw2);
  const bOH = C.bond(Ow, Hm[0]), bOHp = C.bond(Ow, Hm[0], 1, { partial: true });
  // os dois CH3 do Center ocupam phis 90° e 210°; a metila explícita fica em 330°
  C.phis = [Math.PI / 2, Math.PI / 2 + 2 * Math.PI / 3];
  const mol = new Mol(v, C.atoms, C.bonds);
  const lC = mol.addLabel(0, '', 'charge big', [0.2, 0.8, 0.4]);
  const lBr = mol.addLabel(Br, '', 'charge', [0, 0.85, 0]);
  const lO = mol.addLabel(Ow, '', 'charge', [0, 0.7, 0]);
  const lHb = mol.addLabel(Hm[0], 'Hβ', 'tag c', [0, 0.5, 0.4]);
  mol.addLabel(Ow, 'H₂O (base)', 'tag o', [0, -0.9, 0]);
  mol.halo(Hm[0], 0x2fd4f5, 2.2);
  const pA = lobe(v.scene, 0xff9f43, 0.33), pB = lobe(v.scene, 0xff9f43, 0.33);
  const a1 = curvedArrow(v.scene, 0xff4fa3), a2 = curvedArrow(v.scene, 0xff9f43), a3 = curvedArrow(v.scene, 0x2fd4f5);
  const phiM = Math.PI / 2 + 4 * Math.PI / 3;
  function set(t) {
    const hx = kf([[0, -1 / 3], [0.6, 0], [2, 0]], t);
    C.umbrella(mol, hx);
    const r = Math.sqrt(1 - hx * hx);
    const dM = [hx, r * Math.cos(phiM), r * Math.sin(phiM)];
    const dCm = 1.53 - 0.19 * kf([[1, 0], [1.6, 1], [2, 1]], t);
    const CmP = V.mul(V.norm(dM), dCm);
    mol.setPos(Cm, CmP);
    // H da metila: um alinhado ao orbital p (eixo x)
    const u = V.norm(V.mul(dM, -1));
    const ref = [0, 0, 1];
    const tds = tetraDirs(u, 0, V.cross(u, [1, 0, 0]).every((x) => Math.abs(x) < 1e-6) ? ref : V.norm(V.cross(u, V.cross([1, 0, 0], u))));
    // escolher a direção com maior |x| para o Hβ
    let iB = 0; tds.forEach((d, i) => { if (Math.abs(d[0]) > Math.abs(tds[iB][0])) iB = i; });
    const order = [iB, ...[0, 1, 2].filter((i) => i !== iB)];
    const pl = kf([[1, 0], [1.5, 0.5], [1.75, 1], [2, 1]], t);
    const inPlane = (d) => V.norm(V.sub(d, [d[0], 0, 0]));
    const finals = order.slice(1).map((i) => { const d = tds[i]; return V.norm(V.lerp(d, V.add(V.mul(u, -0.5), V.mul(inPlane(V.sub(d, V.mul(u, V.dot(d, u)))), 0.866)), pl)); });
    finals.forEach((d, k) => mol.setPos(Hm[k + 1], V.add(CmP, V.mul(d, 1.09))));
    const dirH = tds[iB];
    const dCH = kf([[1, 1.09], [1.45, 1.15], [1.55, 1.4], [1.7, 1.8], [2, 1.8]], t);
    const dOH = kf([[1, 4.6], [1.45, 1.6], [1.55, 1.25], [1.7, 0.97], [2, 0.97]], t);
    const drift = kf([[1.7, 0], [2, 2.0]], t);
    const Hp = V.add(CmP, V.mul(dirH, dCH + drift));
    const Op = V.add(CmP, V.mul(dirH, dCH + dOH + drift));
    mol.setPos(Hm[0], Hp); mol.setPos(Ow, Op);
    const wd = tetraDirs(V.mul(dirH, -1), 0.6);
    mol.setPos(Hw1, V.add(Op, V.mul(wd[0], 0.97))); mol.setPos(Hw2, V.add(Op, V.mul(wd[1], 0.97)));
    mol.setPos(Br, [kf([[0, 1.97], [0.55, 2.9], [1, 5.2], [2, 6.5]], t), 0, 0]);
    const B2 = mol.bonds;
    B2[bBr].hidden = t > 0.5;
    B2[bCm].hidden = t > 1.62; B2[bCm2].hidden = t <= 1.62;
    B2[bHm[0]].hidden = t > 1.6;
    B2[bOH].hidden = t < 1.62; B2[bOHp].hidden = !(t > 1.4 && t < 1.62);
    [Ow, Hw1, Hw2].forEach((i) => { mol.atoms[i].hidden = t < 0.95; });
    mol.update();
    mol.setLabel(lC, t > 0.55 && t < 1.6 ? '+' : null, 'charge big');
    mol.setLabel(lBr, t > 0.6 ? '−' : null, 'charge');
    mol.setLabel(lO, t > 1.65 ? '+' : null, 'charge');
    mol.setLabel(lHb, t < 1.6 ? 'Hβ' : null, 'tag c');
    const showP = t > 0.55 && t < 1.65;
    pA.show(showP); pB.show(showP);
    if (showP) { pA.set([0, 0, 0], [1, 0, 0], 1.0, 0.5); pB.set([0, 0, 0], [-1, 0, 0], 1.0, 0.5); }
    const s1 = t > 0.03 && t < 0.5; a1.show(s1);
    if (s1) a1.set([0.95, 0.15, 0], [1.3, 1.7, 0], [mol.atoms[Br].p[0] + 0.05, 0.7, 0], smooth(Math.min(1, (t - 0.03) / 0.2)));
    const s2 = t > 1.1 && t < 1.55; a2.show(s2); a3.show(s2);
    if (s2) {
      const fr = smooth(Math.min(1, (t - 1.1) / 0.2));
      a2.set(V.add(Op, V.mul(dirH, -0.4)), V.add(V.lerp(Op, Hp, 0.5), [0, 0.8, 0.6]), V.add(Hp, V.mul(dirH, 0.25)), fr);
      const mCH = V.lerp(CmP, Hp, 0.5);
      a3.set(mCH, V.add(V.lerp(mCH, V.mul(CmP, 0.5), 0.5), [0, -0.6, 0.5]), V.mul(CmP, 0.5), fr);
    }
    if (o.onSet) o.onSet(t);
  }
  const clock = makeClock(2, set, { dur: 9 });
  v.onFrame((dt) => clock.tick(dt));
  set(0);
  return { v, clock, set };
}

/* ===================================================================
 * Carbocátion sp³ → sp² com orbital p
 * =================================================================== */
export function cationScene(host) {
  const v = new Viewer(host, { camPos: [3.5, 3, 7.5], alt: 'Carbocátion trigonal plano' });
  if (!v.ok) return { v };
  const C = new Center(['CH3', 'CH3', 'CH3']);
  const Br = C.add('Br', [1.97, 0, 0]);
  const bBr = C.bond(0, Br);
  const mol = new Mol(v, C.atoms, C.bonds);
  const lC = mol.addLabel(0, '', 'charge big', [0.15, 0.8, 0.4]);
  const pA = lobe(v.scene, 0xff9f43, 0.38), pB = lobe(v.scene, 0xff9f43, 0.38);
  const lbl = label('', 'tag c'); v.scene.add(lbl);
  const st = { p: false, t: 0 };
  function set(t) {
    st.t = t;
    C.umbrella(mol, kf([[0, -1 / 3], [1, 0]], t));
    mol.setPos(Br, [1.97 + 3.2 * smooth(t), 0, 0]);
    mol.atoms[Br].hidden = t > 0.96; mol.bonds[bBr].hidden = t > 0.35;
    mol.update();
    mol.setLabel(lC, t > 0.6 ? '+' : null, 'charge big');
    const show = st.p && t > 0.55; pA.show(show); pB.show(show);
    if (show) { const k = smooth((t - 0.55) / 0.45); pA.set([0, 0, 0], [1, 0, 0], 1.25 * k, 0.6 * k); pB.set([0, 0, 0], [-1, 0, 0], 1.25 * k, 0.6 * k); }
    lbl.userData.div.textContent = t < 0.5 ? 'sp³ · tetraédrico (≈ 109,5°)' : 'sp² · trigonal plano (120°) · orbital p vazio ⊥ plano';
    lbl.position.set(0, -2.3, 0);
  }
  set(0);
  return { v, set, toggle(k) { st[k] = !st[k]; set(st.t); return st[k]; }, spin(on) { v.controls.autoRotate = on; } };
}

/* ===================================================================
 * Bases: etóxido × terc-butóxido
 * =================================================================== */
export function basesScene(host) {
  const v = new Viewer(host, { camPos: [0, 2, 13], alt: 'Comparação entre etóxido e terc-butóxido' });
  if (!v.ok) return { v };
  const mk = (g, x, name) => {
    const atoms = [{ el: 'O', p: [x, 0, 0] }], bonds = [];
    const tpl = groupTemplate(g);
    placeGroup(tpl, [x, 0, 0], [0, -1, 0]).forEach((p, n) => atoms.push({ el: tpl.atoms[n].el, p }));
    bonds.push([0, 1]); tpl.bonds.forEach((b) => bonds.push([1 + b[0], 1 + b[1]]));
    const m = new Mol(v, atoms, bonds);
    m.addLabel(0, 'O⁻', 'tag o', [0, 0.75, 0]);
    m.addLabel(0, name, 'tag', [0, -3.4, 0]);
    return m;
  };
  const A = mk('Et', -3, 'etóxido, CH₃CH₂O⁻'), B = mk('tBu', 3, 'terc-butóxido, (CH₃)₃CO⁻');
  return { v, setStyle(s) { A.setStyle(s); B.setStyle(s); } };
}

/* ===================================================================
 * 2-bromo-2-metilbutano: Hβ acessíveis (Hofmann) × impedidos (Zaitsev)
 * =================================================================== */
export function hofmannScene(host) {
  const v = new Viewer(host, { camPos: [-1.5, 5.5, 9.5], target: [0, -0.6, 0], alt: 'Hidrogênios β no 2-bromo-2-metilbutano' });
  if (!v.ok) return { v };
  const atoms = [{ el: 'C', p: [0, 0, 0] }], bonds = [];
  const U = [0, 1, 0];
  const dirs = tetraDirs(U, 0.3);
  atoms.push({ el: 'Br', p: V.mul(U, 1.94) }); bonds.push([0, 1]);
  const put = (name, d, tag) => {
    const tpl = groupTemplate(name), base = atoms.length;
    placeGroup(tpl, [0, 0, 0], d, 0.3).forEach((p, n) => atoms.push({ el: tpl.atoms[n].el, p, tag }));
    bonds.push([0, base]); tpl.bonds.forEach((b) => bonds.push([base + b[0], base + b[1]]));
    return { base, n: tpl.atoms.length };
  };
  const m1 = put('CH3', dirs[0], 'me'), m2 = put('CH3', dirs[1], 'me'), et = put('Et', dirs[2], 'et');
  const mol = new Mol(v, atoms, bonds);
  // H das metilas (C1 e 2-CH3): verdes; H do CH2: laranja
  [m1, m2].forEach((g) => { for (let k = 1; k <= 3; k++) mol.meshes[g.base + k].material.color.set(0x3ddc97); });
  // template Et: [C1, C2, H(C1)×2, ...] — os H ligados ao primeiro carbono
  const tplEt = groupTemplate('Et');
  tplEt.bonds.forEach((b) => { if (b[0] === 0 && tplEt.atoms[b[1]].el === 'H') mol.meshes[et.base + b[1]].material.color.set(0xff9f43); });
  mol.addLabel(1, 'Br', 'tag m', [0, 0.8, 0]);
  mol.addLabel(m1.base, 'CH₃: Hβ acessíveis', 'tag', V.mul(dirs[0], 1.5));
  mol.addLabel(m2.base, 'CH₃: Hβ acessíveis', 'tag', V.mul(dirs[1], 1.5));
  mol.addLabel(et.base, 'CH₂: Hβ mais impedidos', 'tag o', V.add(V.mul(dirs[2], 0.6), [0, -0.5, 0.9]));
  return { v, setStyle(s) { mol.setStyle(s); } };
}
