/*
 * scenes.js — cenas 3D: álcoois, éteres e epóxidos com pares livres no O,
 * cargas parciais, ligações de hidrogênio, tensão de anel, classificação
 * 1°/2°/3°, alcóxido, epoxidação (mCPBA) e abertura de epóxidos (ácida/básica).
 */
import { THREE, Viewer, Mol, V, tetraDirs, lobe, label, groupTemplate, placeGroup, curvedArrow, line3, kf } from './viewer3d.js';

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
export const ANG = (a, b, c) => { const u = V.norm(V.sub(a, b)), w = V.norm(V.sub(c, b)); return Math.acos(Math.max(-1, Math.min(1, V.dot(u, w)))) * 180 / Math.PI; };

/* ===================================================================
 * Construtor de moléculas em árvore (geometria tetraédrica)
 * =================================================================== */
const BL = (a, b) => ({ 'C-H': 1.09, 'H-O': 0.97, 'C-O': 1.43, 'C-C': 1.53, 'H-N': 1.01, 'C-N': 1.47, 'H-H': 0.74 }[[a, b].sort().join('-')] || 1.5);
export class MB {
  constructor() { this.atoms = []; this.bonds = []; this.lps = []; }
  a(el, p, tag) { this.atoms.push({ el, p, tag }); return this.atoms.length - 1; }
  b(i, j, o = 1, opt = {}) { this.bonds.push([i, j, o, opt]); return this; }
  /** filhos do átomo i; u = direção de i até o vizinho já existente */
  grow(i, u, subs, phase = 0) { const d = tetraDirs(u, phase); subs.forEach((s, k) => { if (s) this.put(i, d[k], s); }); }
  put(i, d, s) {
    if (s === 'lp') { this.lps.push({ i, d: V.norm(d) }); return -1; }
    const el = typeof s === 'string' ? s : s.el;
    if (el === 'Ph') {
      const tpl = groupTemplate('Ph'), base = this.atoms.length;
      placeGroup(tpl, this.atoms[i].p, d, s.tw || 0).forEach((p, n) => this.a(tpl.atoms[n].el, V.add(p, V.mul(V.norm(d), -0.12))));
      this.b(i, base); tpl.bonds.forEach((b) => this.b(base + b[0], base + b[1], b[2] || 1, b[3] || {}));
      return base;
    }
    const j = this.a(el, V.add(this.atoms[i].p, V.mul(V.norm(d), BL(this.atoms[i].el, el))));
    this.b(i, j);
    if (typeof s === 'object' && s.subs) this.grow(j, V.mul(d, -1), s.subs, s.ph || 0);
    return j;
  }
  static tree(el, subs, phase = 0, d0 = [1, 0, 0]) {
    const m = new MB(); const r = m.a(el, [0, 0, 0]);
    m.put(r, d0, subs[0]); m.grow(r, d0, subs.slice(1), phase);
    return m;
  }
  /** acrescenta dois pares livres a um O com dois vizinhos */
  lp2(i) {
    const nb = this.bonds.filter((b) => b[0] === i || b[1] === i).map((b) => (b[0] === i ? b[1] : b[0]));
    const u1 = V.norm(V.sub(this.atoms[nb[0]].p, this.atoms[i].p)), u2 = V.norm(V.sub(this.atoms[nb[1]].p, this.atoms[i].p));
    const bis = V.norm(V.mul(V.add(u1, u2), -1)), n = V.norm(V.cross(u1, u2));
    [1, -1].forEach((sg) => this.lps.push({ i, d: V.norm(V.add(V.mul(bis, 0.58), V.mul(n, 0.82 * sg))) }));
    return this;
  }
  center() { const c = this.atoms.reduce((a, x) => V.add(a, x.p), [0, 0, 0]).map((q) => q / this.atoms.length); return c; }
}
/** remove a molécula da cena (inclusive rótulos HTML) */
export function dropMol(mol, D) {
  if (!mol) return;
  const objs = []; mol.group.traverse((x) => { if (x.isCSS2DObject) objs.push(x); });
  objs.forEach((x) => x.parent.remove(x));
  if (mol.group.parent) mol.group.parent.remove(mol.group);
  if (D) D.lps.forEach(({ lb }) => { lb.show(false); if (lb.m.parent) lb.m.parent.remove(lb.m); });
}
const CH3 = { el: 'C', subs: ['H', 'H', 'H'], ph: Math.PI / 3 };
const OH = { el: 'O', subs: ['H', 'lp', 'lp'] };
const CH2 = (x) => ({ el: 'C', subs: ['H', 'H', x] });

/** epóxido: C1 (−x), C2 (+x), O (+y); s1/s2 = [grupo +z, grupo −z] */
export function epox3d(s1 = ['H', 'H'], s2 = ['H', 'H']) {
  const m = new MB();
  const c1 = m.a('C', [-0.735, 0, 0], 'c1'), c2 = m.a('C', [0.735, 0, 0], 'c2'), o = m.a('O', [0, 1.227, 0], 'o');
  m.b(c1, c2).b(c1, o).b(c2, o);
  m.groups = [];
  [[c1, s1, -1], [c2, s2, 1]].forEach(([c, ss, sx]) => ss.forEach((g, k) => {
    const dir = V.norm(V.add(V.mul([0.87 * sx, -0.493, 0], 0.53), [0, 0, k ? -0.848 : 0.848]));
    const tpl = groupTemplate(g), base = m.atoms.length;
    placeGroup(tpl, m.atoms[c].p, dir, Math.PI / 6).forEach((p, n) => m.a(tpl.atoms[n].el, p));
    m.b(c, base); tpl.bonds.forEach((b) => m.b(base + b[0], base + b[1], b[2] || 1, b[3] || {}));
    m.groups.push({ c, tpl, base, dir, name: g });
  }));
  m.lp2(o);
  return m;
}
/** THF (anel de 5 levemente em envelope) */
function thf() {
  const m = new MB(); const R = 1.25, ids = [];
  for (let k = 0; k < 5; k++) { const t = Math.PI / 2 + k * 2 * Math.PI / 5; ids.push(m.a(k ? 'C' : 'O', [R * Math.cos(t), R * Math.sin(t), k === 2 || k === 3 ? (k === 2 ? 0.22 : -0.22) : 0])); }
  for (let k = 0; k < 5; k++) m.b(ids[k], ids[(k + 1) % 5]);
  for (let k = 1; k < 5; k++) {
    const P = m.atoms[ids[k]].p, A = m.atoms[ids[k - 1]].p, B = m.atoms[ids[(k + 1) % 5]].p;
    const u = V.norm(V.sub(A, P)), w = V.norm(V.sub(B, P));
    const bis = V.norm(V.mul(V.add(u, w), -1)), n = V.norm(V.cross(u, w));
    [1, -1].forEach((sg) => { const hh = m.a('H', V.add(P, V.mul(V.norm(V.add(V.mul(bis, 0.58), V.mul(n, 0.82 * sg))), 1.09))); m.b(ids[k], hh); });
  }
  m.lp2(ids[0]);
  return m;
}
/** éter com ângulo C–O–C definido (graus) */
function etherAng(ang, g1 = 'CH3', g2 = 'CH3') {
  const m = new MB(); const o = m.a('O', [0, 0, 0]);
  const t = ang * Math.PI / 360;
  [[g1, -1], [g2, 1]].forEach(([g, sx]) => {
    const d = [sx * Math.sin(t), -Math.cos(t), 0];
    const sub = g === 'CH3' ? CH3 : CH2(CH3);
    m.put(o, d, sub);
  });
  m.lp2(o);
  return m;
}

/* biblioteca de moléculas 3D */
export const LIB = {
  metanol: { n: 'metanol', f: 'CH₃OH', b: () => MB.tree('C', [OH, 'H', 'H', 'H']) },
  etanol: { n: 'etanol', f: 'CH₃CH₂OH', b: () => MB.tree('C', [OH, 'H', 'H', CH3]) },
  propan1ol: { n: 'propan-1-ol', f: 'CH₃CH₂CH₂OH', b: () => MB.tree('C', [OH, 'H', 'H', { el: 'C', subs: ['H', 'H', CH3], ph: Math.PI / 3 }]) },
  propan2ol: { n: 'propan-2-ol', f: '(CH₃)₂CHOH', b: () => MB.tree('C', [OH, 'H', CH3, CH3]) },
  butan2ol: { n: 'butan-2-ol', f: 'CH₃CH(OH)CH₂CH₃', b: () => MB.tree('C', [OH, 'H', CH3, { el: 'C', subs: ['H', 'H', CH3], ph: Math.PI / 3 }]) },
  isobutanol: { n: '2-metilpropan-1-ol', f: '(CH₃)₂CHCH₂OH', b: () => MB.tree('C', [OH, 'H', 'H', { el: 'C', subs: ['H', CH3, CH3], ph: Math.PI / 3 }]) },
  tbutanol: { n: 'terc-butanol (2-metilpropan-2-ol)', f: '(CH₃)₃COH', b: () => MB.tree('C', [OH, CH3, CH3, CH3]) },
  etilenoglicol: { n: 'etilenoglicol (etano-1,2-diol)', f: 'HOCH₂CH₂OH', b: () => MB.tree('C', [OH, 'H', 'H', { el: 'C', subs: [OH, 'H', 'H'], ph: Math.PI / 3 }]) },
  eterDimetilico: { n: 'éter dimetílico', f: 'CH₃OCH₃', b: () => etherAng(112) },
  eterDietilico: { n: 'éter dietílico', f: 'CH₃CH₂OCH₂CH₃', b: () => etherAng(112, 'Et', 'Et') },
  thf: { n: 'THF (oxolano)', f: 'C₄H₈O', b: thf },
  anisol: { n: 'anisol (metoxibenzeno)', f: 'C₆H₅OCH₃', b: () => { const m = MB.tree('O', [{ el: 'Ph', tw: Math.PI / 2 }, CH3]); m.lp2(0); return m; } },
  oxirano: { n: 'óxido de etileno (oxirano)', f: 'C₂H₄O', b: () => epox3d() },
  metiloxirano: { n: 'óxido de propileno (2-metiloxirano)', f: 'C₃H₆O', b: () => epox3d(['H', 'H'], ['CH3', 'H']) },
  dimetiloxirano: { n: '2,2-dimetiloxirano', f: 'C₄H₈O', b: () => epox3d(['H', 'H'], ['CH3', 'CH3']) },
  cisDimetiloxirano: { n: 'cis-2,3-dimetiloxirano (meso)', f: 'C₄H₈O', b: () => epox3d(['CH3', 'H'], ['CH3', 'H']) },
  propano: { n: 'propano', f: 'CH₃CH₂CH₃', b: () => MB.tree('C', [CH3, 'H', 'H', CH3]) },
  agua: { n: 'água', f: 'H₂O', b: () => MB.tree('O', ['H', 'H', 'lp', 'lp']) },
  etoxido: { n: 'etóxido', f: 'CH₃CH₂O⁻', b: () => MB.tree('C', [{ el: 'O', subs: ['lp', 'lp', 'lp'] }, 'H', 'H', CH3]) },
};

/* ===================================================================
 * Cena genérica: molécula com pares livres, δ± e destaque do O
 * =================================================================== */
export function addDecor(v, mol, B, o = {}) {
  const lps = B.lps.map((l) => { const lb = lobe(v.scene, 0x2fd4f5, 0.38); return { l, lb }; });
  const nbs = (i) => mol.bonds.filter((b) => b.i === i || b.j === i).map((b) => (b.i === i ? b.j : b.i));
  const outward = (i) => { const n = nbs(i); if (!n.length) return [0, 1, 0]; const s = n.reduce((a, j) => V.add(a, V.norm(V.sub(mol.atoms[j].p, mol.atoms[i].p))), [0, 0, 0]); return V.len(s) < 0.1 ? [0, 1, 0] : V.norm(V.mul(s, -1)); };
  const charges = [];
  mol.atoms.forEach((a, i) => {
    if (a.el !== 'O') return;
    const an = B.lps.filter((l) => l.i === i).length >= 3;
    charges.push({ i, l: mol.addLabel(i, an ? '−' : 'δ−', an ? 'charge' : 'dminus', [0, 0, 0]) });
    nbs(i).forEach((j) => { if (!charges.some((c) => c.i === j)) charges.push({ i: j, l: mol.addLabel(j, 'δ+', 'dplus', [0, 0, 0]), from: i }); });
  });
  const halos = mol.atoms.map((a, i) => (a.el === 'O' ? mol.halo(i, 0x2fd4f5, 1.9) : null)).filter(Boolean);
  const st = { lp: o.lp !== false, q: !!o.q, ox: !!o.ox };
  function apply() {
    lps.forEach(({ l, lb }) => { lb.show(st.lp && !mol.atoms[l.i].hidden && !l.hidden); lb.set(mol.atoms[l.i].p, l.d, 0.55, 0.3); });
    charges.forEach((c) => { c.l.off = V.mul(outward(c.i), c.from !== undefined ? 0.62 : 0.78); if (c.from !== undefined && mol.atoms[c.i].el === 'H') c.l.off = V.mul(outward(c.i), 0.45); mol.setLabel(c.l, st.q ? c.l.obj.userData.div.textContent : null); });
    halos.forEach((hh) => { hh.on = st.ox; });
    mol.update();
  }
  apply();
  return { st, apply, lps, toggle(k) { st[k] = !st[k]; apply(); return st[k]; } };
}
export function molScene(host, key, o = {}) {
  const L = LIB[key], B = L.b();
  const v = new Viewer(host, { camPos: o.camPos || [1.5, 2.2, 8], alt: o.alt || 'Modelo 3D de ' + L.n, autoRotate: !!o.autoRotate });
  if (!v.ok) return { v };
  const ctr = B.center();
  const R = Math.max(...B.atoms.map((a) => V.len(V.sub(a.p, ctr))));
  v.setCamera(V.add(ctr, V.mul(V.norm(o.camDir || [0.55, 0.4, 1]), Math.max(6.5, R * 3.4) * (o.zoom || 1))), ctr);
  const mol = new Mol(v, B.atoms.map((a) => ({ el: a.el, p: a.p.slice() })), B.bonds, { style: o.style || 'ball' });
  const D = addDecor(v, mol, B, o);
  if (o.cap) v.caption(o.cap);
  return { v, mol, B, D, toggle: (k) => D.toggle(k), setStyle: (s) => { mol.setStyle(s); D.apply(); } };
}

/* ===================================================================
 * Ligações de hidrogênio: etanol × éter dimetílico × propano
 * =================================================================== */
/** reposiciona B: átomo iA em P, iA→iB alinhado a d1, iA→iC no plano de d2 */
function orient(B, iA, iB, iC, P, d1, d2) {
  const A = B.atoms[iA].p;
  const e1 = V.norm(V.sub(B.atoms[iB].p, A));
  let e2 = V.sub(B.atoms[iC].p, A); e2 = V.norm(V.sub(e2, V.mul(e1, V.dot(e2, e1)))); const e3 = V.cross(e1, e2);
  const f1 = V.norm(d1); let f2 = V.norm(V.sub(d2, V.mul(f1, V.dot(d2, f1)))); const f3 = V.cross(f1, f2);
  const map = (x) => { const r = [V.dot(x, e1), V.dot(x, e2), V.dot(x, e3)]; return V.add(V.add(V.mul(f1, r[0]), V.mul(f2, r[1])), V.mul(f3, r[2])); };
  B.atoms.forEach((a) => { a.p = V.add(P, map(V.sub(a.p, A))); });
  B.lps.forEach((l) => { l.d = map(l.d); });
  return B;
}
function mergeMB(list) {
  const m = new MB();
  list.forEach((B) => { const base = m.atoms.length; B.atoms.forEach((a) => m.atoms.push({ el: a.el, p: a.p })); B.bonds.forEach((b) => m.bonds.push([b[0] + base, b[1] + base, b[2], b[3]])); B.lps.forEach((l) => m.lps.push({ i: l.i + base, d: l.d })); B._base = base; });
  return m;
}
/** ligação de hidrogênio: fileira de pontos amarelos */
export function hbDots(scene, n = 7) {
  const g = new THREE.Group(); const mat = new THREE.MeshBasicMaterial({ color: 0xffd45c, transparent: true }); const geo = new THREE.SphereGeometry(0.065, 10, 8);
  for (let i = 0; i < n; i++) g.add(new THREE.Mesh(geo, mat));
  scene.add(g);
  return { l: { material: mat }, set(a, b) { g.children.forEach((m, i) => m.position.set(...V.lerp(a, b, (i + 0.5) / n))); }, show(v) { g.visible = v; } };
}
export const HB_INFO = {
  etanol: { n: 'etanol', f: 'CH₃CH₂OH · 46 g/mol', pe: '78 °C', txt: 'O–H: <b>doa</b> e <b>aceita</b> ligações de hidrogênio. As moléculas ficam "presas" umas às outras → ponto de ebulição alto.' },
  dme: { n: 'éter dimetílico', f: 'CH₃OCH₃ · 46 g/mol', pe: '−24 °C', txt: 'Não há H ligado ao O: o éter <b>não doa</b> ligação de H; só <b>aceita</b> (de água ou álcool). Entre moléculas de éter: só dipolo–dipolo.' },
  propano: { n: 'propano', f: 'CH₃CH₂CH₃ · 44 g/mol', pe: '−42 °C', txt: 'Sem O: <b>nenhuma</b> ligação de hidrogênio; apenas forças de dispersão fracas.' },
};
export function hbondScene(host) {
  const v = new Viewer(host, { camPos: [0, 1.2, 13], alt: 'Ligações de hidrogênio entre moléculas' });
  if (!v.ok) return { v };
  let mol = null, D = null, lines = [], extra = [];
  const st = { kind: 'etanol', water: false };
  const ETOH = () => MB.tree('O', ['H', { el: 'C', subs: ['H', 'H', CH3], ph: Math.PI / 3 }, 'lp', 'lp']);
  const DME = () => { const m = etherAng(112); return m; };
  const PROP = () => LIB.propano.b();
  const WAT = () => MB.tree('O', ['H', 'H', 'lp', 'lp']);
  function build() {
    dropMol(mol, D);
    lines.forEach((l) => l.show(false)); extra.forEach((x) => x.parent && x.parent.remove(x)); extra = [];
    const parts = []; const hb = [];
    const Os = [[-2.9, -0.7, 0], [0, 0.7, 0], [2.9, -0.7, 0]];
    const mk = st.kind === 'etanol' ? ETOH : st.kind === 'dme' ? DME : PROP;
    if (!st.water) {
      Os.forEach((P, k) => {
        const B = mk();
        const next = Os[k + 1];
        if (st.kind === 'etanol') orient(B, 0, 1, 2, P, next ? V.sub(next, P) : [0.3, 0.4, 0.9], k % 2 ? [0, 1, 0] : [0, -1, 0]);
        else if (st.kind === 'dme') orient(B, 0, 1, B.atoms.length - 4, P, k % 2 ? [-0.6, 1, 0.3] : [-0.6, -1, -0.3], [1, 0, 0]);
        else orient(B, 0, 1, B.atoms.length - 4, P, [-1, k % 2 ? 0.4 : -0.4, 0.2], [1, 0, 0]);
        parts.push(B);
      });
      if (st.kind === 'etanol') { hb.push([[0, 1], [1, 0]], [[1, 1], [2, 0]]); }
    } else {
      const B = mk();
      if (st.kind === 'etanol') orient(B, 0, 1, 2, [0, 0, 0], [1, -0.2, 0], [-0.4, -1, 0]);
      else orient(B, 0, 1, B.atoms.length - 4, [0, 0, 0], [-1, -0.6, 0], [1, -0.6, 0]);
      parts.push(B);
      if (st.kind !== 'propano') {
        const lp = B.lps[0].d;
        const W = WAT(); orient(W, 0, 1, 2, V.mul(lp, 2.85), V.mul(lp, -1), [0, 0, 1]); parts.push(W); hb.push([[1, 1], [0, 0]]);
        const lp2 = B.lps[1].d; const W2 = WAT(); orient(W2, 0, 1, 2, V.mul(lp2, 2.85), V.mul(lp2, -1), [1, 0, 0]); parts.push(W2); hb.push([[2, 1], [0, 0]]);
      }
      if (st.kind === 'etanol') { const dOH = V.norm(B.atoms[1].p); const W3 = WAT(); orient(W3, 0, 1, 2, V.mul(dOH, 2.9), [0.2, 0.9, 0.3], [1, 0, 0]); parts.push(W3); hb.push([[0, 1], [3, 0]]); }
      if (st.kind === 'propano') {
        [[-3.2, 1.2, 0.5], [3.2, 1.0, -0.5], [0.3, -2.8, 0.4]].forEach((P, k) => { const W = WAT(); orient(W, 0, 1, 2, P, [k - 1, 0.5, 0.3], [0, 0, 1]); parts.push(W); });
      }
    }
    const all = mergeMB(parts);
    if (st.water && parts.length > 1) all.lps = all.lps.filter((l) => l.i < parts[1]._base);
    v.setCamera(st.water ? [5.5, 3.2, 9.5] : [0, 1.2, 13], [0, 0, 0]);
    mol = new Mol(v, all.atoms, all.bonds);
    D = addDecor(v, mol, all, { q: false });
    while (lines.length < hb.length) lines.push(hbDots(v.scene));
    hb.forEach(([[ma, ia], [mb, ib]], k) => { lines[k].set(all.atoms[parts[ma]._base + ia].p, all.atoms[parts[mb]._base + ib].p); lines[k].show(true); });
    const I = HB_INFO[st.kind];
    v.caption(`<b>${I.n}</b> · ${I.f} · P.E. ${I.pe}${st.water ? ' · com água' : ''}`);
  }
  let t = 0;
  v.onFrame((dt) => { t += dt; lines.forEach((l) => { l.l.material.opacity = 0.6 + 0.4 * Math.sin(t * 4); }); });
  build();
  return { v, set(k) { st.kind = k; build(); }, water(on) { st.water = on; build(); }, get st() { return st; } };
}

/* ===================================================================
 * Classifique o álcool: clique no carbono do OH
 * =================================================================== */
export const CLASSIFY = ['etanol', 'propan2ol', 'tbutanol', 'butan2ol', 'isobutanol', 'metanol'];
export function classifyScene(host, key, onPick) {
  const sc = molScene(host, key, { lp: false, q: false, zoom: 0.9 });
  if (!sc.v.ok) return sc;
  const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
  const hl = sc.mol.halo(0, 0xffd45c, 1.7); hl.on = false;
  sc.v.renderer.domElement.addEventListener('click', (e) => {
    const r = sc.v.renderer.domElement.getBoundingClientRect();
    mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(mouse, sc.v.camera);
    const hit = ray.intersectObjects(sc.mol.meshes)[0];
    if (!hit) return;
    const i = sc.mol.meshes.indexOf(hit.object);
    hl.i = i; hl.on = true;
    onPick(i, sc.mol.atoms[i]);
  });
  sc.nC = sc.mol.bonds.filter((b) => (b.i === 0 || b.j === 0) && sc.mol.atoms[b.i === 0 ? b.j : b.i].el === 'C').length;
  return sc;
}

/* ===================================================================
 * Tensão de anel: éter dimetílico × THF × oxirano
 * =================================================================== */
export function strainScene(host) {
  const v = new Viewer(host, { camPos: [0, 1.5, 15], alt: 'Comparação de ângulos C–O–C' });
  if (!v.ok) return { v };
  const parts = [LIB.eterDimetilico.b(), LIB.thf.b(), LIB.oxirano.b()];
  const xs = [-4.6, 0, 4.4];
  const oIdx = [0, 0, 2];
  parts.forEach((B, k) => { const c = B.atoms[oIdx[k]].p; B.atoms.forEach((a) => { a.p = V.add(V.sub(a.p, c), [xs[k], 0.4, 0]); }); });
  // vira o THF e o oxirano com o O para cima
  const rot = (B, cx) => { B.atoms.forEach((a) => { const p = V.sub(a.p, [cx, 0.4, 0]); a.p = V.add([p[0], -p[1], p[2]], [cx, 0.4, 0]); }); B.lps.forEach((l) => { l.d = [l.d[0], -l.d[1], l.d[2]]; }); };
  void rot;
  const all = mergeMB(parts);
  const mol = new Mol(v, all.atoms, all.bonds);
  const D = addDecor(v, mol, all, { lp: false });
  const angs = parts.map((B, k) => {
    const o = B._base + oIdx[k];
    const nb = all.bonds.filter((b) => b[0] === o || b[1] === o).map((b) => (b[0] === o ? b[1] : b[0])).filter((j) => all.atoms[j].el === 'C');
    const a = ANG(all.atoms[nb[0]].p, all.atoms[o].p, all.atoms[nb[1]].p);
    const names = ['éter dimetílico', 'THF', 'oxirano'];
    const real = ['≈ 112°', '≈ 106–109°', '≈ 61,5°'];
    const l = mol.addLabel(o, `${names[k]}<br>C–O–C ${real[k]}`, 'tag ' + (k === 2 ? 'm' : 'c'), [0, 1.25, 0]);
    void a; return l;
  });
  return { v, mol, D, toggle(k) { if (k === 'ang') { const on = !angs[0].visible; angs.forEach((l) => mol.setLabel(l, on ? l.obj.userData.div.innerHTML : null)); return on; } return D.toggle(k); } };
}

/* ===================================================================
 * Alcóxido: etanol + NaH → etóxido + H₂
 * =================================================================== */
export function alkoxideScene(host, onSet) {
  const v = new Viewer(host, { camPos: [0.6, 1.3, 10.5], target: [0.6, 0.8, 0], alt: 'Formação de alcóxido com NaH' });
  if (!v.ok) return { v };
  const B = MB.tree('O', ['H', { el: 'C', subs: ['H', 'H', CH3], ph: Math.PI / 3 }, 'lp', 'lp']);
  orient(B, 0, 1, 2, [0, 0, 0], [0.6, 0.8, 0], [-1, 0, 0]);
  const iH = 1, H0 = B.atoms[iH].p.slice(), dOH = V.norm(H0);
  const Hm = B.a('H', [3.3, 1.2, 0]), Na = B.a('Na', [4.3, 1.9, 0]);
  const third = { i: 0, d: dOH, hidden: true };
  B.lps.push(third);
  const mol = new Mol(v, B.atoms, B.bonds.concat([[iH, Hm, 1, { partial: true }]]));
  const hb = mol.bonds.length - 1, ohb = mol.bonds.findIndex((b) => (b.i === 0 && b.j === iH) || (b.j === 0 && b.i === iH));
  const D = addDecor(v, mol, B, { q: false });
  const qO = mol.addLabel(0, '−', 'charge', [-0.15, 0.6, 0.35]);
  const qNa = mol.addLabel(Na, 'NaH', 'tag', [0, 0.8, 0]);
  const tH = mol.addLabel(Hm, 'H⁻', 'tag o', [0, 0.55, 0]);
  const arr = curvedArrow(v.scene, 0xff9f43), arr2 = curvedArrow(v.scene, 0xff4fa3);
  const clock = makeClock(1, set, { dur: 5 });
  v.onFrame((dt) => clock.tick(dt));
  function set(s) {
    const a = kf([[0, 0], [0.4, 1]], s), b = kf([[0.4, 0], [0.72, 1]], s), c = kf([[0.75, 0], [1, 1]], s);
    const fly = [c * 1.6, c * 1.9, 0];
    const Hend = V.add(H0, V.mul(dOH, 0.74));
    mol.setPos(Hm, V.add(V.lerp([3.3, 1.2, 0], Hend, a), fly));
    mol.setPos(iH, V.add(H0, fly));
    mol.setPos(Na, V.lerp([4.3, 1.9, 0], [-0.6, 2.4, 0.9], b));
    mol.bonds[hb].hidden = a < 0.6; mol.bonds[hb].opt.partial = b < 0.6;
    mol.bondMeshes[hb].forEach((m) => { m.material.color.set(b < 0.6 ? 0xffd45c : 0xaeb8c8); });
    mol.bonds[ohb].hidden = b > 0.5;
    third.hidden = b < 0.5;
    mol.setLabel(qO, b > 0.5 ? '−' : null);
    mol.setLabel(qNa, b > 0.3 ? 'Na⁺' : 'NaH');
    mol.setLabel(tH, c > 0.2 ? 'H₂ ↑' : b > 0.5 ? null : 'H⁻');
    arr.show(s > 0.05 && s < 0.5); arr.set(V.add(V.lerp([3.3, 1.2, 0], Hend, a), [0, 0.3, 0]), V.add(V.lerp(H0, [3.3, 1.2, 0], 0.5), [0, 1.0, 0.3]), V.add(H0, [0.25, 0.25, 0]));
    arr2.show(s > 0.15 && s < 0.6); const mid = V.mul(H0, 0.5); arr2.set(mid, V.add(mid, [0, -0.7, 0.6]), [0.15, -0.3, 0.3]);
    D.apply();
    onSet && onSet(s);
  }
  set(0);
  return { v, clock, toggle: (k) => D.toggle(k) };
}
export const ALKOX_STEPS = [
  { s: 0, t: 'Etanol + NaH', d: 'NaH fornece o íon hidreto H⁻, uma base muito forte (ácido conjugado H₂, pKa ≈ 35).' },
  { s: 0.4, t: 'Transferência de H⁺', d: 'O H⁻ remove o H do O–H (pKa ≈ 16); o par da ligação O–H fica no oxigênio.' },
  { s: 1, t: 'Etóxido + H₂↑', d: 'Etóxido de sódio: O com <b>três pares livres</b> e carga −1. O H₂ escapa (reação irreversível). O alcóxido é base forte e bom nucleófilo.' },
];

/* ===================================================================
 * Epoxidação com mCPBA (concertada; geometria mantida)
 * =================================================================== */
export function mcpbaScene(host, onSet, o = {}) {
  const v = new Viewer(host, { camPos: [3.2, 3.6, 11.5], target: [0, 1.4, 0], alt: 'Epoxidação de alceno com perácido' });
  if (!v.ok) return { v };
  const cis = o.cis !== false;
  const m = new MB();
  const c1 = m.a('C', [-0.67, 0, 0]), c2 = m.a('C', [0.67, 0, 0]);
  const g = [];
  const subs = cis ? [['CH3', c1, -1, 1], ['H', c1, -1, -1], ['CH3', c2, 1, 1], ['H', c2, 1, -1]] : [['CH3', c1, -1, 1], ['H', c1, -1, -1], ['H', c2, 1, 1], ['CH3', c2, 1, -1]];
  subs.forEach(([name, c, sx, sz]) => {
    const tpl = groupTemplate(name), base = m.atoms.length;
    const d0 = [0.5 * sx, 0, 0.866 * sz], d1 = V.norm(V.add(V.mul([0.87 * sx, -0.493, 0], 0.53), [0, 0, 0.848 * sz]));
    placeGroup(tpl, m.atoms[c].p, d0, Math.PI / 6).forEach((p, n) => m.a(tpl.atoms[n].el, p));
    m.b(c, base); tpl.bonds.forEach((b) => m.b(base + b[0], base + b[1], b[2] || 1, b[3] || {}));
    g.push({ tpl, base, c, d0, d1 });
  });
  const O = m.a('O', [0, 3.1, 0]); const O2 = m.a('O', [0.2, 4.45, 0.3]);
  const bonds = m.bonds.concat([[c1, c2, 2, { normal: [0, 1, 0] }], [c1, c2, 1], [O, O2, 1], [c1, O, 1, { partial: true }], [c2, O, 1, { partial: true }]]);
  const mol = new Mol(v, m.atoms, bonds);
  const nb = m.bonds.length;
  const tO2 = mol.addLabel(O2, 'O–C(=O)Ar', 'tag', [0.9, 0.35, 0]);
  const tO = mol.addLabel(O, 'O eletrofílico', 'tag m', [-1.1, 0.2, 0]);
  const tProd = mol.addLabel(O, '', 'tag c', [0, 0.75, 0]);
  const arr = curvedArrow(v.scene, 0xff4fa3);
  const pi = [lobe(v.scene, 0x2fd4f5, 0.35), lobe(v.scene, 0x2fd4f5, 0.35)];
  const clock = makeClock(1, set, { dur: 5 });
  v.onFrame((dt) => clock.tick(dt));
  function set(s) {
    const a = kf([[0, 0], [0.45, 1]], s), b = kf([[0.35, 0], [0.8, 1]], s), c = kf([[0.75, 0], [1, 1]], s);
    const x = 0.67 + 0.065 * b;
    mol.setPos(c1, [-x, 0, 0]); mol.setPos(c2, [x, 0, 0]);
    g.forEach((gg) => { const d = V.norm(V.lerp(gg.d0, gg.d1, b)); placeGroup(gg.tpl, mol.atoms[gg.c].p, d, Math.PI / 6).forEach((p, n) => mol.setPos(gg.base + n, p)); });
    const Op = V.lerp([0, 3.1, 0], [0, 1.227, 0], a);
    mol.setPos(O, Op); mol.setPos(O2, V.add(Op, V.lerp([0.2, 1.35, 0.3], [1.6, 2.6, 0.8], c)));
    mol.bonds[nb].hidden = b > 0.55; mol.bonds[nb + 1].hidden = b <= 0.55;
    mol.bonds[nb + 2].hidden = c > 0.5;
    [nb + 3, nb + 4].forEach((k) => { mol.bonds[k].hidden = a < 0.5; mol.bonds[k].opt.partial = b < 0.95; });
    mol.bondMeshes[nb + 3].concat(mol.bondMeshes[nb + 4]).forEach((mm) => { mm.material.color.set(b < 0.95 ? 0xffd45c : 0xaeb8c8); mm.material.opacity = b < 0.95 ? 0.6 : 1; });
    mol.setLabel(tO2, c > 0.5 ? 'ArCO₂H' : 'O–C(=O)Ar');
    mol.setLabel(tO, s < 0.3 ? 'O eletrofílico' : null);
    mol.setLabel(tProd, s > 0.9 ? (cis ? 'cis-2,3-dimetiloxirano' : 'trans-2,3-dimetiloxirano') : s > 0.35 && s < 0.85 ? 'ET concertado ("borboleta")' : null);
    pi.forEach((l, k) => { l.show(s < 0.45); l.set([0, 0, 0], [0, k ? -1 : 1, 0], 0.6 * (1 - a * 0.5), 0.5); });
    arr.show(s > 0.05 && s < 0.5); arr.set([0, 0.75, 0.25], [-0.9, 2.0, 0.6], V.add(Op, [-0.2, -0.35, 0.1]));
    mol.update();
    onSet && onSet(s);
  }
  set(0);
  return { v, clock };
}
export const MCPBA_STEPS = [
  { s: 0, t: 'Alceno + perácido', d: 'O alceno (rico em elétrons π) se aproxima do O terminal eletrofílico do perácido.' },
  { s: 0.4, t: 'ET concertado', d: 'Todas as ligações se formam e se rompem <b>ao mesmo tempo</b> (estado de transição "borboleta", não intermediário). Os dois C–O se formam pela <b>mesma face</b>.' },
  { s: 1, t: 'Epóxido', d: 'Epóxido + ácido carboxílico. A geometria é mantida: alceno <b>cis</b> → epóxido <b>cis</b> (adição syn, estereoespecífica).' },
];

/* ===================================================================
 * Abertura de epóxido 3D (básica: SN2 no C menos impedido; ácida: protona
 * o O e o Nu ataca o C mais substituído, também pelo lado oposto)
 * =================================================================== */
const NU3D = {
  OH: { t: 'HO⁻', atoms: [['O', [0, 0, 0]], ['H', [0, 0, 0.97]]], neg: true , b: [[0, 1]] },
  MeO: { t: 'CH₃O⁻', atoms: [['O', [0, 0, 0]], ['C', [0, 0, 1.43]]], neg: true , b: [[0, 1]] },
  CN: { t: '⁻C≡N', atoms: [['C', [0, 0, 0]], ['N', [0, 0, 1.16]]], tri: true, neg: true , b: [[0, 1, 3]] },
  RMgBr: { t: 'CH₃⁻ (de CH₃MgBr)', atoms: [['C', [0, 0, 0]], ['H', [0.9, 0.5, 0.36]], ['H', [-0.9, 0.5, 0.36]], ['H', [0, -1.03, 0.36]]], neg: true , b: [[0, 1], [0, 2], [0, 3]] },
  H2O: { t: 'H₂O', atoms: [['O', [0, 0, 0]], ['H', [0.76, 0, 0.59]], ['H', [-0.76, 0, 0.59]]] , b: [[0, 1], [0, 2]] },
  MeOH: { t: 'CH₃OH', atoms: [['O', [0, 0, 0]], ['H', [0.9, 0, 0.32]], ['C', [-0.75, 0, 1.22]]] , b: [[0, 1], [0, 2]] },
  N3: { t: 'N₃⁻', atoms: [['N', [0, 0, 0]], ['N', [0, 0, 1.16]], ['N', [0, 0, 2.32]]], neg: true , b: [[0, 1, 2], [1, 2, 2]] },
  NH3: { t: 'NH₃', atoms: [['N', [0, 0, 0]], ['H', [0.95, 0, 0.33]], ['H', [-0.47, 0.82, 0.33]], ['H', [-0.47, -0.82, 0.33]]] , b: [[0, 1], [0, 2], [0, 3]] },
};
export function epoxOpenScene(host, o = {}) {
  const v = new Viewer(host, { camPos: [0.8, 2.0, 11.5], target: [0, -0.5, 0], alt: 'Abertura de epóxido em 3D' });
  if (!v.ok) return { v };
  const subs = o.subs || [['H', 'H'], ['CH3', 'CH3']];
  let mol = null, D = null, B = null, nuIdx = [], Hx = -1, info = null, labels = {};
  const st = { cond: o.cond || 'base', nu: o.nu || 'MeO', at: 1, s: 0 };
  const arr = curvedArrow(v.scene, 0xff9f43), arr2 = curvedArrow(v.scene, 0xff4fa3);
  const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
  let base0 = null;
  function build() {
    dropMol(mol, D);
    B = epox3d(subs[0], subs[1]);
    const N = NU3D[st.nu];
    nuIdx = N.atoms.map(([el, p]) => B.a(el, p));
    const nb = N.b.map(([i, j, ord]) => [nuIdx[i], nuIdx[j], ord || 1, { normal: [1, 0, 0] }]);
    Hx = B.a('H', [0, 3.6, 0.6]);
    const extra = [[B.atoms.findIndex((a) => a.tag === 'o'), Hx, 1], [nuIdx[0], 0, 1, { partial: true }], [nuIdx[0], 1, 1, { partial: true }]];
    base0 = B.atoms.map((a) => a.p.slice());
    mol = new Mol(v, B.atoms, B.bonds.concat(nb, extra));
    D = addDecor(v, mol, B, { q: false });
    labels = { nu: mol.addLabel(nuIdx[0], N.t, 'tag o', [0, -0.7, 0]), c: mol.addLabel(0, 'δ+', 'dplus', [0, -0.6, 0.3]), res: mol.addLabel(2, '', 'tag c', [0, 1.1, 0]), O: mol.addLabel(2, '', 'charge', [0.35, 0.4, 0.2]) };
    info = { nb: B.bonds.length + nb.length };
    set(st.s);
  }
  const groupsOf = (c) => B.groups.filter((g) => g.c === c);
  function set(s) {
    st.s = s;
    if (!mol) return;
    const N = NU3D[st.nu];
    const at = st.at, other = 1 - at; // índices 0 (C1) ou 1 (C2)
    const acid = st.cond === 'acid';
    const pA = acid ? kf([[0, 0], [0.3, 1]], s) : 1; // protonação
    const t = acid ? kf([[0.32, 0], [1, 1]], s) : kf([[0, 0], [1, 1]], s);
    const app = kf([[0, 0], [0.7, 1]], t), brk = kf([[0.35, 0], [0.85, 1]], t), inv = kf([[0.4, 0], [0.95, 1]], t);
    // reposição
    base0.forEach((p, i) => mol.setPos(i, p.slice()));
    const C = base0[at], Co = base0[other], Op = base0[2];
    const u = V.norm(V.sub(C, Op));
    // O se afasta ao romper C–O (fica ligado ao outro C)
    const Of = V.add(Co, V.mul(V.norm(V.add(V.sub(Op, Co), V.mul(u, -0.9))), 1.43));
    const Onow = V.lerp(Op, Of, brk);
    mol.setPos(2, Onow);
    // grupos do carbono atacado: guarda-chuva invertido
    groupsOf(at).forEach((g) => {
      const d0 = g.dir; const perp = V.norm(V.sub(d0, V.mul(u, V.dot(d0, u))));
      const d1 = V.norm(V.add(V.mul(perp, 0.94), V.mul(u, -0.34)));
      placeGroup(g.tpl, C, V.norm(V.lerp(d0, d1, inv)), Math.PI / 6).forEach((p, n) => mol.setPos(g.base + n, p));
    });
    // nucleófilo
    const dist = 3.3 - (3.3 - 1.47) * app;
    const P0 = V.add(C, V.mul(u, dist));
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(...u));
    N.atoms.forEach(([, p], k) => { const w = new THREE.Vector3(...p).applyQuaternion(q); mol.setPos(nuIdx[k], [P0[0] + w.x, P0[1] + w.y, P0[2] + w.z]); });
    // H⁺ (ácido) sobre o O
    const lpd = B.lps[0].d;
    const Hp = V.lerp(V.add(Op, [0, 2.4, 0.8]), V.add(Op, V.mul(lpd, 0.97)), pA);
    mol.setPos(Hx, V.add(Hp, V.sub(Onow, Op)));
    mol.atoms[Hx].hidden = !acid;
    const nbB = info.nb;
    mol.bonds[nbB].hidden = !acid || pA < 0.95; // O–H
    B.lps[0].hidden = acid && pA > 0.95;
    const nuB = mol.bonds[nbB + 1 + at]; nuB.hidden = app < 0.55; nuB.opt.partial = app < 0.98;
    mol.bonds[nbB + 1 + other].hidden = true;
    const ringB = mol.bonds.findIndex((b) => (b.i === at && b.j === 2) || (b.i === 2 && b.j === at));
    mol.bonds[ringB].hidden = brk > 0.7;
    mol.bondMeshes[ringB].forEach((mm) => { mm.material.color.set(brk > 0.2 ? 0xffd45c : 0xaeb8c8); mm.material.transparent = true; mm.material.opacity = brk > 0.2 ? 0.6 : 1; });
    mol.bondMeshes[nbB + 1 + at].forEach((mm) => { mm.material.color.set(app < 0.98 ? 0xffd45c : 0x3ddc97); });
    labels.c.i = at;
    mol.setLabel(labels.c, acid && pA > 0.95 && t < 0.7 ? 'δ+' : null);
    mol.setLabel(labels.nu, N.t);
    mol.setLabel(labels.res, t > 0.97 ? (acid ? 'OH (após perder H⁺ do Nu)' : 'O⁻ → OH no workup') + ' · inversão no C atacado' : null);
    mol.setLabel(labels.O, acid && pA > 0.95 && t < 0.97 ? '+' : !acid && t > 0.97 ? '−' : null);
    arr.show(t > 0.02 && t < 0.6); arr.set(V.add(P0, V.mul(u, -0.35)), V.add(V.lerp(P0, C, 0.5), [0, -0.6, 0.6]), V.add(C, V.mul(u, 0.45)));
    arr2.show(t > 0.2 && t < 0.75); const mid = V.lerp(C, Op, 0.5); arr2.set(mid, V.add(mid, [0, 0.5, 0.8]), V.add(Op, [0, 0.1, 0.35]));
    D.apply();
    mol.update();
    o.onSet && o.onSet(s);
  }
  const clock = makeClock(1, set, { dur: 6 });
  v.onFrame((dt) => clock.tick(dt));
  v.renderer.domElement.addEventListener('click', (e) => {
    if (!o.onPick || !mol) return;
    const r = v.renderer.domElement.getBoundingClientRect();
    mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(mouse, v.camera);
    const hit = ray.intersectObjects(mol.meshes.slice(0, 2))[0];
    if (hit) o.onPick(mol.meshes.indexOf(hit.object));
  });
  build();
  return {
    v, clock,
    config(c) { Object.assign(st, c); build(); return st; },
    attack(at) { st.at = at; clock.set(0); clock.play(); },
    mark(k) { const H = mol.halo(k, k === st.at ? 0x3ddc97 : 0xffd45c, 1.8); void H; },
    get st() { return st; },
    toggle: (k) => D.toggle(k),
  };
}
