/*
 * scenes.js — cenas 3D animadas dos mecanismos.
 */
import {
  THREE, Viewer, Mol, Center, V, ELEM, BOND, kf, smooth, ease, lobe, curvedArrow, line3, chirality, tetraDirs, label,
} from './viewer3d.js';

const AX = [1, 0, 0];

/* utilitário: player de progresso (0..max) com play/pause/velocidade */
export function makeClock(max, onSet, o = {}) {
  const st = { s: o.start || 0, playing: false, speed: o.speed || 1, loop: !!o.loop, dur: o.dur || 6 };
  const api = {
    get s() { return st.s; },
    set(s) { st.s = Math.max(0, Math.min(max, s)); onSet(st.s); },
    play() { if (st.s >= max - 1e-6 && !st.loop) st.s = 0; st.playing = true; api.onState && api.onState(true); },
    pause() { st.playing = false; api.onState && api.onState(false); },
    toggle() { st.playing ? api.pause() : api.play(); },
    get playing() { return st.playing; },
    speed(k) { st.speed = k; },
    tick(dt) {
      if (!st.playing) return;
      let s = st.s + dt * st.speed * max / st.dur;
      if (api.stopAt !== null && s >= api.stopAt) { s = api.stopAt; api.stopAt = null; st.s = s; onSet(s); api.pause(); return; }
      if (s >= max) {
        if (st.loop) s = 0;
        else { s = max; st.playing = false; api.onState && api.onState(false); }
      }
      st.s = s; onSet(s);
    },
    stopAt: null,
  };
  return api;
}

/* ===================================================================
 * SN2: Nu⁻ + C(G1)(G2)(G3)–Br → Nu–C + Br⁻
 * =================================================================== */

export const SN2_STEPS = [
  { s: 0.0, t: '1 · Aproximação', d: 'O nucleófilo <b>HO⁻</b> (rico em elétrons) aproxima-se do carbono eletrofílico (δ+) <b>pelo lado oposto ao Br</b>.' },
  { s: 0.3, t: '2 · Ataque backside', d: 'O ataque ocorre a ~<b>180°</b> do grupo abandonador: é por esse lado que o par do nucleófilo encontra o orbital <b>σ* C–Br</b>.' },
  { s: 0.43, t: '3 · Ligação Nu–C se formando', d: 'Começa a formação da ligação <b>O–C</b> (parcial). Os três hidrogênios começam a se achatar.' },
  { s: 0.47, t: '4 · C–Br se rompendo', d: 'Ao <b>mesmo tempo</b>, a ligação <b>C–Br</b> se alonga e enfraquece: formação e quebra são simultâneas (mecanismo <b>concertado</b>).' },
  { s: 0.5, t: '5 · Estado de transição', d: '<b>Estado de transição</b> [HO···CH₃···Br]⁻‡: ligações parciais O···C e C···Br, H coplanares. Não é um intermediário: existe por ~10⁻¹³ s e não pode ser isolado.' },
  { s: 0.66, t: '6 · Saída do grupo abandonador', d: 'O <b>Br⁻</b> sai levando o par de elétrons da ligação C–Br. Os H "viram" para o outro lado, como um guarda-chuva ao vento.' },
  { s: 1.0, t: '7 · Produto', d: 'Produto: <b>CH₃OH + Br⁻</b>. O carbono agora tem a configuração <b>invertida</b> em relação ao reagente.' },
];

export function sn2Scene(host, o = {}) {
  o = Object.assign({ groups: ['H', 'H', 'H'], arrows: true, labels: true, orbitals: false, axis: false, umbrella: false, autoRotate: false, loop: false, dur: 7, camPos: [-0.9, 2.6, 12.5], target: [-1.3, 0, 0], stopAt: null }, o);
  const v = new Viewer(host, { autoRotate: o.autoRotate, camPos: o.camPos, target: o.target, alt: o.alt || 'Animação 3D do mecanismo SN2' });
  if (!v.ok) return { v, clock: makeClock(1, () => {}) };
  const C = new Center(o.groups);
  const O = C.add('O', [-6, 0, 0], 'nu');
  const HO = C.add('H', [-6.9, 0.9, 0], 'nu');
  const Br = C.add(o.lg || 'Br', [1.94, 0, 0], 'lg');
  C.bond(O, HO);
  const bCO = C.bond(0, O), bCOp = C.bond(0, O, 1, { partial: true });
  const bCBr = C.bond(0, Br), bCBrp = C.bond(0, Br, 1, { partial: true });
  const mol = new Mol(v, C.atoms, C.bonds);
  const lO = mol.addLabel(O, '−', 'charge', [0, 0.6, 0]);
  const lBr = mol.addLabel(Br, '', 'charge', [0, 0.8, 0]);
  const lC = mol.addLabel(0, 'δ+', 'dplus', [0.1, 0.62, 0.3]);
  const haloC = mol.halo(0, 0x2fd4f5, 1.9);
  const haloLG = mol.halo(Br, 0xff9f43, 1.45);
  if (o.labels) {
    mol.addLabel(O, 'Nu⁻', 'tag m', [0, -0.85, 0]);
    mol.addLabel(Br, 'grupo abandonador', 'tag o', [0, -0.95, 0]);
  }
  const lDesc = mol.addLabel(0, '', 'tag c big', [0, -2.4, 0]);
  lDesc.visible = false;
  const a1 = curvedArrow(v.scene, 0xff4fa3), a2 = curvedArrow(v.scene, 0xff9f43);
  const axis = line3(v.scene, 0x2fd4f5);
  const axLbl = label('180°', 'tag c'); v.scene.add(axLbl);
  // orbitais: σ* C–Br (lóbulo maior atrás do C) e par isolado do Nu
  const sA = lobe(v.scene, 0x2fd4f5, 0.42), sB = lobe(v.scene, 0xff9f43, 0.38), sC = lobe(v.scene, 0x2fd4f5, 0.3), nL = lobe(v.scene, 0xff4fa3, 0.5);
  const orbLbl = label('σ* C–Br', 'tag c'); v.scene.add(orbLbl);
  const nLbl = label('par do Nu (HOMO)', 'tag m'); v.scene.add(nLbl);
  // guarda-chuva
  const umb = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 40, 1, true), new THREE.MeshStandardMaterial({ color: 0xb18cff, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }));
  v.scene.add(umb);
  const state = { orbitals: o.orbitals, axis: o.axis, umbrella: o.umbrella, arrows: o.arrows };

  function priorities() {
    // grupos: índice no array groups → posição; prioridade CIP: Nu/LG(1) > Et(2) > CH3(3) > H(4)
    const rank = { Et: 2, Pr: 2, CH3: 3, H: 4 };
    return o.groups.map((g) => rank[g]);
  }
  function descriptor(useNu) {
    const pr = priorities();
    const vecs = [];
    vecs[0] = useNu ? mol.atoms[O].p : mol.atoms[Br].p;
    C.parts.forEach((pt, k) => { vecs[pr[k] - 1] = mol.atoms[pt.base].p; });
    return chirality(vecs[0], vecs[1], vecs[2], vecs[3]);
  }

  function set(s) {
    const stop = o.stopAt;
    const dCO = stop ? Math.max(stop, kf([[0, 6], [1, stop]], s)) : kf([[0, 6], [0.38, 2.7], [0.5, 2.05], [0.62, 1.43], [1, 1.43]], s);
    const dCBr = stop ? 1.94 : kf([[0, 1.94], [0.38, 2.0], [0.5, 2.45], [0.62, 3.25], [1, 6.2]], s);
    const hx = stop ? -1 / 3 : kf([[0, -1 / 3], [0.38, -0.29], [0.5, 0], [0.62, 0.29], [1, 1 / 3]], s);
    mol.setPos(O, [-dCO, 0, 0]);
    const hDir = V.norm([-0.34, 0.94, 0]);
    mol.setPos(HO, V.add([-dCO, 0, 0], V.mul(hDir, 0.97)));
    mol.setPos(Br, [dCBr, 0, 0]);
    C.umbrella(mol, hx);
    const B = mol.bonds;
    B[bCO].hidden = stop ? true : s < 0.56; B[bCOp].hidden = stop ? true : !(s >= 0.36 && s < 0.56);
    B[bCBr].hidden = !stop && s >= 0.44; B[bCBrp].hidden = stop ? true : !(s >= 0.44 && s < 0.6);
    mol.update();
    // cargas
    if (stop) { mol.setLabel(lO, '−', 'charge'); mol.setLabel(lBr, 'δ−', 'dminus'); mol.setLabel(lC, 'δ+', 'dplus'); }
    else {
      mol.setLabel(lO, s < 0.4 ? '−' : s < 0.6 ? 'δ−' : null, s < 0.4 ? 'charge' : 'dminus');
      mol.setLabel(lBr, s < 0.4 ? 'δ−' : s < 0.6 ? 'δ−' : '−', s < 0.6 ? 'dminus' : 'charge');
      mol.setLabel(lC, s < 0.45 ? 'δ+' : null, 'dplus');
    }
    haloC.on = true; haloLG.on = s < 0.75;
    // setas
    const fr1 = smooth(Math.min(1, Math.max(0, (s - 0.04) / 0.2)));
    const show1 = state.arrows && !stop && s > 0.04 && s < 0.48;
    a1.show(show1);
    if (show1) { const pO = mol.atoms[O].p; a1.set(V.add(pO, [0.35, 0.35, 0]), [pO[0] / 2, 1.5, 0], [-0.55, 0.15, 0], fr1); }
    const show2 = state.arrows && !stop && s > 0.12 && s < 0.52;
    a2.show(show2);
    if (show2) { const pB = mol.atoms[Br].p; const m = [pB[0] / 2, 0.15, 0]; a2.set(m, [pB[0] / 2 + 0.3, 1.6, 0], V.add(pB, [0.05, 0.65, 0]), smooth(Math.min(1, (s - 0.12) / 0.2))); }
    // eixo 180°
    axis.show(state.axis); axLbl.visible = state.axis;
    if (state.axis) { axis.set([-6.5, 0, 0], [dCBr + 1.2, 0, 0]); axLbl.position.set(-1.0, -0.45, 0); }
    // orbitais
    const so = state.orbitals && (stop || s < 0.5);
    [sA, sB, sC, nL].forEach((l) => l.show(so)); orbLbl.visible = so; nLbl.visible = so;
    if (so) {
      sA.set([0, 0, 0], [-1, 0, 0], 0.95, 0.62);
      sB.set([0, 0, 0], [1, 0, 0], 0.45, 0.42);
      sC.set([dCBr, 0, 0], [1, 0, 0], 0.5, 0.48);
      const pO = mol.atoms[O].p;
      nL.set(pO, [1, 0, 0], 0.62, 0.42);
      orbLbl.position.set(-1.4, 1.0, 0);
      nLbl.position.set(pO[0] + 0.3, -0.95, 0);
    }
    // guarda-chuva
    umb.visible = state.umbrella;
    if (state.umbrella) {
      const h = Math.max(0.04, Math.abs(hx) * 1.35 * 2.2);
      umb.scale.set(1.25, h, 1.25);
      umb.rotation.set(0, 0, hx < 0 ? Math.PI / 2 : -Math.PI / 2);
      umb.position.set(hx * 1.35 * 1.1, 0, 0);
    }
    // descritor R/S (quando há estereocentro)
    if (o.stereo) {
      const d = s < 0.5 ? descriptor(false) : descriptor(true);
      mol.setLabel(lDesc, s > 0.42 && s < 0.58 ? 'estado de transição' : `(${d})`, 'tag c big');
    }
    if (o.onSet) o.onSet(s);
  }

  const clock = makeClock(1, set, { loop: o.loop, dur: o.dur });
  v.onFrame((dt) => clock.tick(dt));
  if (o.autoPlay) clock.play();
  set(0);
  // seleção de átomos
  const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
  v.renderer.domElement.addEventListener('click', (e) => {
    const r = v.renderer.domElement.getBoundingClientRect();
    mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(mouse, v.camera);
    const hit = ray.intersectObjects(mol.meshes)[0];
    if (!hit || !o.onPick) return;
    o.onPick(hit.object.userData.atom);
  });
  return {
    v, mol, clock, set,
    toggle(k, val) { state[k] = val === undefined ? !state[k] : val; set(clock.s); return state[k]; },
    descriptor,
  };
}

/* ===================================================================
 * Impedimento estérico: CH3Br → (CH3)3CBr com Nu aproximando-se
 * =================================================================== */

export const STERIC = [
  { name: 'CH₃–Br (metílico)', rel: '≈ 2 000 000', stop: null, note: 'Acesso livre: o lado de trás do carbono está desimpedido.' },
  { name: 'CH₃CH₂–Br (primário)', rel: '≈ 40 000', stop: null, note: 'Um grupo alquila: o acesso ainda é bom, mas o estado de transição fica um pouco mais congestionado.' },
  { name: '(CH₃)₂CH–Br (secundário)', rel: '≈ 500', stop: null, note: 'Dois grupos alquila: o "funil" de aproximação estreita bastante; a SN2 fica lenta e passa a competir com outros caminhos.' },
  { name: '(CH₃)₃C–Br (terciário)', rel: '≈ 0', stop: 3.3, note: 'Três grupos metila bloqueiam a face traseira: o nucleófilo não alcança o carbono. Terciários praticamente não reagem por SN2.' },
];

export function stericScene(host, onInfo) {
  let n = 0, sc = null, style = 'ball';
  function build() {
    if (sc) { sc.v.dispose(); host.innerHTML = ''; }
    const groups = ['H', 'H', 'H'].map((g, k) => (k < n ? 'CH3' : g));
    const st = STERIC[n];
    sc = sn2Scene(host, { groups, arrows: false, labels: false, stopAt: st.stop, dur: 4.5, camPos: [-6.5, 3.2, 9.5], target: [-1.5, 0, 0], alt: 'Aproximação do nucleófilo a substratos com 0 a 3 grupos metila' });
    if (!sc.v.ok) return;
    sc.mol.setStyle(style);
    if (!st.stop) {
      // SN2 possível: anima até o estado de transição e volta
      sc.clock.speed(1);
    }
    // cone de aproximação
    const col = [0x3ddc97, 0x9be15d, 0xffd45c, 0xff5c6c][n];
    const cone = new THREE.Mesh(new THREE.ConeGeometry(1.1 - n * 0.22, 4.2, 32, 1, true), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false }));
    cone.rotation.z = -Math.PI / 2; cone.position.set(-2.5, 0, 0);
    sc.v.scene.add(cone);
    sc.v.caption(`<b>${st.name}</b> · velocidade relativa de SN2: <b>${st.rel}</b>`);
    if (onInfo) onInfo(st, n);
  }
  build();
  return {
    get n() { return n; },
    setN(k) { n = Math.max(0, Math.min(3, k)); build(); },
    attack() {
      if (!sc || !sc.v.ok) return;
      sc.clock.set(0);
      if (STERIC[n].stop) { sc.clock.play(); }
      else { sc.clock.play(); sc.clock.onState = (p) => { if (!p && sc.clock.s >= 0.999) sc.v.caption(`<b>${STERIC[n].name}</b> · o nucleófilo alcançou o carbono e o Br⁻ saiu.`); }; }
    },
    setStyle(s) { style = s; if (sc && sc.v.ok) { sc.mol.setStyle(s); } },
    dispose() { if (sc) sc.v.dispose(); },
  };
}

/* ===================================================================
 * SN1: (CH3)3C–Br + 2 H2O → (CH3)3C–OH + H3O+ + Br⁻
 * =================================================================== */

export const SN1_STEPS = [
  { s: 0, t: 'Início', d: 'Brometo de <i>terc</i>-butila: carbono terciário tetraédrico (sp³) ligado ao Br.' },
  { s: 1, t: 'Etapa 1 · Ionização (lenta)', d: '<b>Quebra heterolítica</b> da ligação C–Br: o Br sai com o par de elétrons (Br⁻) e forma-se o <b>carbocátion</b> terciário, plano (sp²), com um orbital <b>p vazio</b>. Etapa determinante da velocidade.' },
  { s: 2, t: 'Etapa 2 · Ataque do nucleófilo', d: 'Uma molécula de <b>água</b> (nucleófilo fraco e neutro) doa um par de elétrons ao orbital p vazio. Forma-se um <b>íon oxônio</b> (O com carga +).' },
  { s: 3, t: 'Etapa 3 · Desprotonação', d: 'Outra molécula de água atua como <b>base</b> e remove um H⁺ do oxônio: forma-se o <b>álcool terc-butílico</b> e H₃O⁺.' },
];

export function sn1Scene(host, o = {}) {
  o = Object.assign({ arrows: true, porb: true, labels: true, dur: 12, camPos: [-1.2, 3, 16], target: [-0.6, 0.6, 0] }, o);
  const v = new Viewer(host, { camPos: o.camPos, target: o.target, alt: 'Animação 3D do mecanismo SN1 em três etapas', autoRotate: o.autoRotate });
  if (!v.ok) return { v, clock: makeClock(3, () => {}) };
  const C = new Center(['CH3', 'CH3', 'CH3']);
  const Br = C.add('Br', [1.97, 0, 0], 'lg');
  const bCBr = C.bond(0, Br);
  const O1 = C.add('O', [-6, 0, 0], 'nu'), H1a = C.add('H', [0, 0, 0]), H1b = C.add('H', [0, 0, 0]);
  C.bond(O1, H1a); const bHb = C.bond(O1, H1b);
  const bCO = C.bond(0, O1);
  const O2 = C.add('O', [-5, 4, 0]), H2a = C.add('H', [0, 0, 0]), H2b = C.add('H', [0, 0, 0]);
  C.bond(O2, H2a); C.bond(O2, H2b);
  const bO2Hb = C.bond(O2, H1b);
  const mol = new Mol(v, C.atoms, C.bonds);
  const lC = mol.addLabel(0, '', 'charge', [0.1, 0.75, 0.35]);
  const lBr = mol.addLabel(Br, '', 'charge', [0, 0.85, 0]);
  const lO1 = mol.addLabel(O1, '', 'charge', [0, 0.7, 0]);
  const lO2 = mol.addLabel(O2, '', 'charge', [0, 0.7, 0]);
  if (o.labels) {
    mol.addLabel(O1, 'H₂O', 'tag m', [0, -0.9, 0]);
    mol.addLabel(O2, 'H₂O (base)', 'tag', [0, -0.9, 0]);
  }
  const haloC = mol.halo(0, 0x2fd4f5, 1.9);
  const pA = lobe(v.scene, 0xff9f43, 0.35), pB = lobe(v.scene, 0xff9f43, 0.35);
  const pl = label('orbital p vazio', 'tag o'); v.scene.add(pl);
  const a1 = curvedArrow(v.scene, 0xff9f43), a2 = curvedArrow(v.scene, 0xff4fa3), a3 = curvedArrow(v.scene, 0x2fd4f5), a4 = curvedArrow(v.scene, 0xff9f43);
  const st = { porb: o.porb, arrows: o.arrows };

  function waterH(Opos, toward, phase) {
    const d = tetraDirs(V.sub(toward, Opos), phase, [0, 0, 1]);
    return [V.add(Opos, V.mul(d[0], 0.97)), V.add(Opos, V.mul(d[1], 0.97))];
  }

  function set(t) {
    const dBr = kf([[0, 1.97], [0.55, 2.9], [1, 5.2], [3, 6.8]], t);
    const hx = kf([[0, -1 / 3], [0.6, 0], [1.55, 0], [1.85, 1 / 3], [3, 1 / 3]], t);
    mol.setPos(Br, [dBr, -0.3 * Math.max(0, t - 1), 0]);
    C.umbrella(mol, hx);
    // água 1 (nucleófilo)
    const dO = kf([[1, 6.5], [1.6, 2.6], [1.85, 1.48], [3, 1.48]], t);
    const O1p = [-dO, 0, 0];
    mol.setPos(O1, O1p);
    const [ha, hb] = waterH(O1p, [0, 0, 0], 0.4);
    mol.setPos(H1a, ha);
    // água 2 (base) aproxima-se de H1b
    const O2far = V.add(hb, [-3.2, 3.4, 0]);
    const k2 = kf([[0, 0], [2.0, 0], [2.45, 1], [3, 1]], t);
    const O2near = V.add(hb, V.mul(V.norm(V.sub(O2far, hb)), 1.75));
    let O2p = V.lerp(O2far, O2near, k2);
    // transferência do H
    const tr = smooth(Math.min(1, Math.max(0, (t - 2.5) / 0.2)));
    const hTarget = V.add(O2p, V.mul(V.norm(V.sub(hb, O2p)), 0.97));
    const hNow = V.lerp(hb, hTarget, tr);
    // H3O+ se afasta
    const away = kf([[0, 0], [2.72, 0], [3, 1.6]], t);
    const dirAway = V.norm(V.sub(O2far, hb));
    O2p = V.add(O2p, V.mul(dirAway, away));
    const hMoved = V.add(hNow, V.mul(dirAway, away * tr));
    mol.setPos(H1b, hMoved);
    mol.setPos(O2, O2p);
    const [h2a, h2b] = waterH(O2p, hb, 1.2);
    mol.setPos(H2a, h2a); mol.setPos(H2b, h2b);
    const B = mol.bonds;
    B[bCBr].hidden = t > 0.5;
    B[bCO].hidden = t < 1.78;
    B[bHb].hidden = t > 2.6;
    B[bO2Hb].hidden = t < 2.6;
    const vis = (i, on) => { mol.atoms[i].hidden = !on; };
    [O1, H1a, H1b].forEach((i) => vis(i, t > 1.0));
    [O2, H2a, H2b].forEach((i) => vis(i, t > 1.9));
    mol.update();
    mol.setLabel(lC, t > 0.55 && t < 1.8 ? '+' : t < 0.45 ? 'δ+' : null, t > 0.55 ? 'charge big' : 'dplus');
    mol.setLabel(lBr, t > 0.6 ? '−' : t < 0.45 ? 'δ−' : null, t > 0.6 ? 'charge' : 'dminus');
    mol.setLabel(lO1, t > 1.8 && t < 2.6 ? '+' : null, 'charge');
    mol.setLabel(lO2, t > 2.62 ? '+' : null, 'charge');
    haloC.on = true;
    const showP = st.porb && t > 0.55 && t < 1.75;
    pA.show(showP); pB.show(showP); pl.visible = showP;
    if (showP) {
      const sz = kf([[0.55, 0.2], [0.8, 1], [1.5, 1], [1.75, 0.3]], t);
      pA.set([0, 0, 0], [1, 0, 0], 1.0 * sz, 0.5 * sz);
      pB.set([0, 0, 0], [-1, 0, 0], 1.0 * sz, 0.5 * sz);
      pl.position.set(0, 1.3, 0.8);
    }
    const ar = st.arrows;
    const s1 = ar && t > 0.03 && t < 0.5; a1.show(s1);
    if (s1) a1.set([0.95, 0.15, 0], [1.3, 1.7, 0], [dBr + 0.05, 0.7, 0], smooth(Math.min(1, (t - 0.03) / 0.2)));
    const s2 = ar && t > 1.15 && t < 1.75; a2.show(s2);
    if (s2) a2.set(V.add(O1p, [0.45, 0.3, 0]), [O1p[0] / 2, 1.6, 0.4], [-0.55, 0.2, 0], smooth(Math.min(1, (t - 1.15) / 0.2)));
    const s3 = ar && t > 2.15 && t < 2.55; a3.show(s3); a4.show(s3);
    if (s3) {
      a3.set(V.add(O2p, V.mul(V.norm(V.sub(hb, O2p)), 0.45)), V.add(V.lerp(O2p, hb, 0.5), [0.5, 0.5, 0.6]), V.add(hb, V.mul(V.norm(V.sub(O2p, hb)), 0.3)), smooth(Math.min(1, (t - 2.15) / 0.15)));
      const mid = V.lerp(O1p, hb, 0.5);
      a4.set(mid, V.add(mid, [0.3, -0.8, 0.6]), V.add(O1p, [0.2, -0.45, 0.2]), smooth(Math.min(1, (t - 2.2) / 0.15)));
    }
    if (o.onSet) o.onSet(t);
  }
  const clock = makeClock(3, set, { dur: o.dur });
  v.onFrame((dt) => clock.tick(dt));
  set(0);
  return { v, mol, clock, set, toggle(k, val) { st[k] = val === undefined ? !st[k] : val; set(clock.s); return st[k]; } };
}

/* ===================================================================
 * Carbocátion: sp3 tetraédrico → sp2 trigonal plano
 * =================================================================== */

export function cationScene(host, o = {}) {
  const v = new Viewer(host, { camPos: [3.5, 3, 7.5], alt: 'Transformação do carbono tetraédrico em carbocátion trigonal plano' });
  if (!v.ok) return { v };
  const C = new Center(['CH3', 'CH3', 'CH3']);
  const Br = C.add('Br', [1.97, 0, 0], 'lg');
  const bBr = C.bond(0, Br);
  const mol = new Mol(v, C.atoms, C.bonds);
  const lC = mol.addLabel(0, '', 'charge big', [0.15, 0.8, 0.4]);
  const lBr = mol.addLabel(Br, 'Br', 'tag o', [0, 0.85, 0]);
  const pA = lobe(v.scene, 0xff9f43, 0.38), pB = lobe(v.scene, 0xff9f43, 0.38);
  const pLbl = label('orbital p vazio', 'tag o'); v.scene.add(pLbl);
  const plane = new THREE.Mesh(new THREE.CircleGeometry(2.4, 48), new THREE.MeshBasicMaterial({ color: 0x2fd4f5, transparent: true, opacity: 0.1, side: THREE.DoubleSide, depthWrite: false }));
  plane.rotation.y = Math.PI / 2; v.scene.add(plane);
  const angLbl = label('', 'tag c'); v.scene.add(angLbl);
  const st = { p: false, plane: false, hyper: false, t: 0 };
  function set(t) {
    st.t = t;
    const hx = kf([[0, -1 / 3], [1, 0]], t);
    C.umbrella(mol, hx);
    mol.setPos(Br, [1.97 + 3.2 * smooth(t), 0, 0]);
    mol.atoms[Br].hidden = t > 0.96;
    mol.bonds[bBr].hidden = t > 0.35;
    // hiperconjugação: H cujas ligações C–H ficam quase paralelas ao orbital p (eixo x)
    C.parts.forEach((pt) => {
      const cpos = mol.atoms[pt.base].p;
      for (let n = 1; n <= 3; n++) {
        const hi = pt.base + n;
        const d = V.norm(V.sub(mol.atoms[hi].p, cpos));
        const aligned = Math.abs(d[0]) > 0.7;
        mol.meshes[hi].material.color.set(st.hyper && t > 0.6 && aligned ? 0xffd45c : ELEM.H.color);
      }
    });
    mol.update();
    mol.setLabel(lC, t > 0.6 ? '+' : null, 'charge big');
    lBr.visible = t < 0.96;
    const show = st.p && t > 0.55;
    pA.show(show); pB.show(show); pLbl.visible = show;
    if (show) {
      const k = smooth((t - 0.55) / 0.45);
      pA.set([0, 0, 0], [1, 0, 0], 1.25 * k, 0.6 * k);
      pB.set([0, 0, 0], [-1, 0, 0], 1.25 * k, 0.6 * k);
      pLbl.position.set(0, 1.6, 0);
    }
    plane.visible = st.plane;
    plane.material.opacity = 0.05 + 0.12 * t;
    const angle = Math.acos(V.dot(V.norm(V.sub(mol.atoms[C.parts[0].base].p, [0, 0, 0])), V.norm(V.sub(mol.atoms[C.parts[1].base].p, [0, 0, 0])))) * 180 / Math.PI;
    angLbl.userData.div.textContent = `C–C–C ≈ ${angle.toFixed(0)}°  ·  ${t < 0.5 ? 'sp³ (tetraédrico)' : 'sp² (trigonal plano)'}`;
    angLbl.position.set(0, -2.3, 0);
    if (o.onSet) o.onSet(t);
  }
  set(0);
  return {
    v, set,
    toggle(k, val) { st[k] = val === undefined ? !st[k] : val; set(st.t); return st[k]; },
    spin(on) { v.controls.autoRotate = on; },
  };
}

/* ===================================================================
 * SN1: ataque às duas faces de um carbocátion quiral (3-metil-hexan-3-ila)
 * =================================================================== */

export function facesScene(host, onDone) {
  const v = new Viewer(host, { camPos: [0, 7.5, 19], alt: 'Ataque da água pelas duas faces de um carbocátion plano' });
  if (!v.ok) return { v };
  const mk = (offset, fromTop) => {
    const C = new Center(['CH3', 'Et', 'Pr']);
    const O = C.add('O', [6, 0, 0]), Ha = C.add('H', [0, 0, 0]);
    C.bond(O, Ha);
    const bCO = C.bond(0, O);
    const mol = new Mol(v, C.atoms, C.bonds);
    mol.group.rotation.z = Math.PI / 2; // eixo x local → vertical
    mol.group.position.x = offset;
    const lC = mol.addLabel(0, '+', 'charge big', [0.5, 0.2, 0.6]);
    const lD = mol.addLabel(0, '', 'tag c big', [-3.2, 0, 0]);
    lD.visible = false; lD.obj.visible = false;
    const pU = lobe(mol.group, 0xff9f43, 0.32), pD = lobe(mol.group, 0xff9f43, 0.32);
    pU.set([0, 0, 0], [1, 0, 0], 1.0, 0.5); pD.set([0, 0, 0], [-1, 0, 0], 1.0, 0.5);
    mol.addLabel(0, fromTop ? 'face superior ↓' : 'face inferior ↑', 'tag m', [fromTop ? 2.6 : -2.6, 0, 0]);
    return { C, O, Ha, bCO, mol, lC, lD, pU, pD, sign: fromTop ? 1 : -1 };
  };
  const A = mk(-5, true), B = mk(5, false);
  const brIon = new Mol(v, [{ el: 'Br', p: [0, 0, 0] }], []);
  const brL = brIon.addLabel(0, 'Br⁻ (par iônico)', 'tag o', [0, 0.9, 0]);
  const st = { pair: false, t: 0 };
  const tl = label('', 'tag'); v.scene.add(tl);
  const pr = { CH3: 4, Et: 3, Pr: 2 };
  function setOne(X, t) {
    const sgn = X.sign;
    const d = kf([[0, 6.5], [0.7, 2.2], [0.9, 1.43], [1, 1.43]], t);
    X.mol.setPos(X.O, [sgn * d, 0, 0]);
    X.mol.setPos(X.Ha, [sgn * (d + 0.32), 0.92, 0]);
    const hx = kf([[0, 0], [0.7, 0], [0.95, -sgn / 3], [1, -sgn / 3]], t);
    X.C.umbrella(X.mol, hx);
    X.mol.bonds[X.bCO].hidden = t < 0.82;
    X.mol.atoms[X.O].hidden = X.mol.atoms[X.Ha].hidden = t < 0.02;
    X.mol.update();
    X.mol.setLabel(X.lC, t < 0.85 ? '+' : null, 'charge big');
    X.pU.show(t < 0.6); X.pD.show(t < 0.6);
    if (t > 0.92) {
      const vec = [];
      vec[0] = X.mol.atoms[X.O].p;
      X.C.parts.forEach((pt) => { vec[pr[pt.name] - 1] = X.mol.atoms[pt.base].p; });
      const dsc = chirality(vec[0], vec[1], vec[2], vec[3]);
      X.mol.setLabel(X.lD, `(${dsc})`, 'tag c big');
      X.desc = dsc;
    } else X.mol.setLabel(X.lD, null);
  }
  function set(t) {
    st.t = t;
    setOne(A, t); setOne(B, t);
    brIon.atoms[0].hidden = !st.pair;
    brIon.setPos(0, [-5, 3.4, 0]);
    brIon.update();
    brL.visible = st.pair;
    tl.userData.div.innerHTML = t < 0.05 ? 'carbocátion plano: duas faces equivalentes' : t < 0.9 ? 'H₂O ataca: à esquerda pela face superior, à direita pela inferior' : `produtos: (${A.desc}) e (${B.desc}) — enantiômeros`;
    tl.position.set(0, -4.6, 0);
    if (t >= 1 && onDone) onDone(A.desc, B.desc);
  }
  const clock = makeClock(1, set, { dur: 4 });
  v.onFrame((dt) => clock.tick(dt));
  set(0);
  return { v, clock, set, toggle(k, val) { st[k] = val === undefined ? !st[k] : val; set(st.t); return st[k]; } };
}
