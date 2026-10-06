/*
 * mol3d.js — moléculas 3D com cargas parciais QUALITATIVAS (para mapas de
 * potencial eletrostático didáticos), cargas formais, pares livres, orbitais
 * (p vazio, p semipreenchido, par em sp³) e regiões nucleofílicas/eletrofílicas.
 * As cargas parciais são estimativas ilustrativas, não resultados de cálculo.
 */
import { THREE, Viewer, Mol, V, tetraDirs, label } from './viewer3d.js';

const BL = { 'C-H': 1.09, 'C-C': 1.53, 'C=C': 1.34, 'C≡C': 1.2, 'C-O': 1.43, 'C=O': 1.23, 'O-H': 0.97, 'N-H': 1.01, 'C-N': 1.47, 'C≡N': 1.16, 'H-Cl': 1.27, 'H-Br': 1.41, 'H-F': 0.92, 'H-I': 1.61, 'C-Br': 1.94, 'C-Cl': 1.78, 'B-F': 1.31, 'B-N': 1.65, 'C-F': 1.35 };
const bl = (a, b, o) => { const k = [a, b].sort().join('-'); const k2 = o === 2 ? [a, b].sort().join('=') : o === 3 ? [a, b].sort().join('≡') : k; return BL[k2] || BL[k] || BL[[b, a].join('-')] || 1.4; };

function trig(u, n) { // duas direções a ±120° de u, no plano perpendicular a n
  u = V.norm(u); const w = V.norm(V.cross(n, u));
  return [V.add(V.mul(u, -0.5), V.mul(w, 0.866)), V.add(V.mul(u, -0.5), V.mul(w, -0.866))];
}
class MB {
  constructor(name, charge = 0) { this.name = name; this.charge = charge; this.atoms = []; this.bonds = []; this.lps = []; this.orbs = []; this.dl = {}; this.nuc = []; this.elec = []; }
  at(el, p, q = 0, fc = 0) { this.atoms.push({ el, p, q, fc }); return this.atoms.length - 1; }
  to(i, el, dir, q = 0, o = 1, fc = 0, len) { const L = len || bl(this.atoms[i].el, el, o); const j = this.at(el, V.add(this.atoms[i].p, V.mul(V.norm(dir), L)), q, fc); this.bonds.push([i, j, o]); return j; }
  b(i, j, o = 1, opt) { this.bonds.push([i, j, o, opt]); return this; }
  lp(i, dir) { this.lps.push({ i, dir: V.norm(dir) }); return this; }
  orb(i, dir, kind) { this.orbs.push({ i, dir: V.norm(dir), kind }); return this; }
  done() {
    // ajusta a soma das cargas parciais à carga total (distribui o resíduo)
    const s = this.atoms.reduce((t, a) => t + a.q, 0), r = (this.charge - s) / this.atoms.length;
    this.atoms.forEach((a) => { a.q += r; });
    const c = V.mul(this.atoms.reduce((t, a) => V.add(t, a.p), [0, 0, 0]), 1 / this.atoms.length);
    this.atoms.forEach((a) => { a.p = V.sub(a.p, c); });
    return this;
  }
}
const X = [1, 0, 0], Y = [0, 1, 0], Z = [0, 0, 1];
const neg = (v) => V.mul(v, -1);
function methylOn(m, c, u, qH = 0.06, phase = 0) { tetraDirs(u, phase).forEach((d) => m.to(c, 'H', d, qH)); }

export const LIB3D = {
  HCl: () => { const m = new MB('HCl'); const H = m.at('H', [0, 0, 0], 0.25), Cl = m.to(H, 'Cl', X, -0.25); tetraDirs(neg(X)).forEach((d) => m.lp(Cl, d)); m.dl = { [H]: '+', [Cl]: '−' }; m.elec = [H]; m.nuc = [Cl]; m.note = 'Cl é mais eletronegativo: Hδ+ é o sítio ácido/eletrofílico.'; return m.done(); },
  HBr: () => { const m = new MB('HBr'); const H = m.at('H', [0, 0, 0], 0.2), Br = m.to(H, 'Br', X, -0.2); tetraDirs(neg(X)).forEach((d) => m.lp(Br, d)); m.dl = { [H]: '+', [Br]: '−' }; m.elec = [H]; m.nuc = [Br]; m.note = 'Ligação H–Br mais longa e mais fraca que H–Cl.'; return m.done(); },
  HF: () => { const m = new MB('HF'); const H = m.at('H', [0, 0, 0], 0.42), F = m.to(H, 'F', X, -0.42); tetraDirs(neg(X)).forEach((d) => m.lp(F, d)); m.dl = { [H]: '+', [F]: '−' }; m.elec = [H]; m.nuc = [F]; m.note = 'A ligação mais polar dos haletos de hidrogênio — mas também a mais curta e forte.'; return m.done(); },
  H2O: () => { const m = new MB('água'); const O = m.at('O', [0, 0, 0], -0.66); const t = tetraDirs(Y); m.to(O, 'H', t[0], 0.33); m.to(O, 'H', t[1], 0.33); m.lp(O, Y); m.lp(O, t[2]); m.dl = { [O]: '−', 1: '+', 2: '+' }; m.nuc = [O]; m.elec = [1, 2]; return m.done(); },
  HO: () => { const m = new MB('hidróxido', -1); const O = m.at('O', [0, 0, 0], -1.25, -1); m.to(O, 'H', X, 0.25); tetraDirs(X).forEach((d) => m.lp(O, d)); m.nuc = [O]; m.note = 'Carga −1 concentrada no O: base e nucleófilo forte.'; return m.done(); },
  H3O: () => { const m = new MB('hidrônio', 1); const O = m.at('O', [0, 0, 0], -0.2, 1); tetraDirs(Y).forEach((d) => m.to(O, 'H', d, 0.4)); m.lp(O, Y); m.elec = [1, 2, 3]; m.note = 'O H⁺ é transferido a partir do H₃O⁺; o O⁺ ainda tem um par livre, mas não é eletrófilo.'; return m.done(); },
  ethanol: () => { const m = new MB('etanol'); const c1 = m.at('C', [0, 0, 0], -0.18); const c2 = m.to(c1, 'C', [1, 0.3, 0], 0.05); methylOn(m, c1, [1, 0.3, 0], 0.06, 0.4); const d = tetraDirs([-1, -0.3, 0], 0.2); const O = m.to(c2, 'O', d[0], -0.62); m.to(c2, 'H', d[1], 0.05); m.to(c2, 'H', d[2], 0.05); const dO = tetraDirs(V.sub(m.atoms[c2].p, m.atoms[O].p), 1.0); const HO = m.to(O, 'H', dO[0], 0.42); m.lp(O, dO[1]); m.lp(O, dO[2]); m.dl = { [O]: '−', [HO]: '+' }; m.nuc = [O]; m.elec = [HO]; m.note = 'O com dois pares livres (região rica); H do O–H é o H ácido.'; return m.done(); },
  ethoxide: () => { const m = new MB('etóxido', -1); const c1 = m.at('C', [0, 0, 0], -0.15); const c2 = m.to(c1, 'C', [1, 0.3, 0], 0.0); methylOn(m, c1, [1, 0.3, 0], 0.03, 0.4); const d = tetraDirs([-1, -0.3, 0], 0.2); const O = m.to(c2, 'O', d[0], -1.05, 1, -1); m.to(c2, 'H', d[1], 0.0); m.to(c2, 'H', d[2], 0.0); tetraDirs(V.sub(m.atoms[c2].p, m.atoms[O].p), 1.0).forEach((x) => m.lp(O, x)); m.nuc = [O]; m.note = 'Base conjugada do etanol: carga −1 <b>localizada</b> em um único O.'; return m.done(); },
  acetic: () => { const m = new MB('ácido acético'); const c1 = m.at('C', [0, 0, 0], -0.2); const c2 = m.to(c1, 'C', X, 0.6); methylOn(m, c1, X, 0.07, 0.3); const t = trig(neg(X), Z); const O1 = m.to(c2, 'O', t[0], -0.5, 2); const O2 = m.to(c2, 'O', t[1], -0.55); const dH = trig(V.sub(m.atoms[c2].p, m.atoms[O2].p), Z); const H = m.to(O2, 'H', dH[0], 0.45); m.lp(O1, trig(V.sub(m.atoms[c2].p, m.atoms[O1].p), Z)[0]); m.lp(O1, trig(V.sub(m.atoms[c2].p, m.atoms[O1].p), Z)[1]); m.lp(O2, dH[1]); m.lp(O2, Z); m.dl = { [O1]: '−', [c2]: '+', [H]: '+' }; m.nuc = [O1, O2]; m.elec = [H, c2]; m.note = 'H do O–H: ácido (pKa ≈ 4,8). O da C=O: rico em elétrons. C da carbonila: δ+.'; return m.done(); },
  acetate: () => { const m = new MB('acetato', -1); const c1 = m.at('C', [0, 0, 0], -0.2); const c2 = m.to(c1, 'C', X, 0.4); methylOn(m, c1, X, 0.02, 0.3); const t = trig(neg(X), Z); const O1 = m.to(c2, 'O', t[0], -0.68, 1.5, 0, 1.26); const O2 = m.to(c2, 'O', t[1], -0.68, 1.5, 0, 1.26); [O1, O2].forEach((O) => { trig(V.sub(m.atoms[c2].p, m.atoms[O].p), Z).forEach((d) => m.lp(O, d)); }); m.nuc = [O1, O2]; m.note = 'Carga −1 <b>deslocalizada</b>: cada O carrega ≈ −½; as duas ligações C–O são iguais.'; return m.done(); },
  acetylene: () => { const m = new MB('acetileno'); const c1 = m.at('C', [0, 0, 0], -0.2); const c2 = m.to(c1, 'C', X, -0.2, 3); m.to(c1, 'H', neg(X), 0.2); const H = m.to(c2, 'H', X, 0.2); m.dl = { [H]: '+' }; m.elec = [H, 2]; m.nuc = [c1, c2]; m.note = 'C sp: H relativamente ácido (pKa ≈ 25); a ligação tripla é região rica em elétrons.'; return m.done(); },
  acetylide: () => { const m = new MB('acetileto', -1); const c1 = m.at('C', [0, 0, 0], -0.25); const c2 = m.to(c1, 'C', X, -0.9, 3, -1); m.to(c1, 'H', neg(X), 0.15); m.lp(c2, X); m.orb(c2, X, 'sp'); m.nuc = [c2]; m.note = 'Par livre em orbital sp (50% s): mais perto do núcleo, carga mais estabilizada que em sp³.'; return m.done(); },
  NH3: () => { const m = new MB('amônia'); const N = m.at('N', [0, 0, 0], -0.9); tetraDirs(Y).forEach((d) => m.to(N, 'H', d, 0.3)); m.lp(N, Y); m.nuc = [N]; m.note = 'Par livre no N: base e nucleófilo (doador).'; return m.done(); },
  NH2: () => { const m = new MB('íon amideto', -1); const N = m.at('N', [0, 0, 0], -1.4, -1); const t = tetraDirs(Y); m.to(N, 'H', t[0], 0.2); m.to(N, 'H', t[1], 0.2); m.lp(N, Y); m.lp(N, t[2]); m.nuc = [N]; m.note = 'Base muito forte (pKa do NH₃ ≈ 38): N é pouco eletronegativo para acomodar a carga.'; return m.done(); },
  CH3Br: () => { const m = new MB('bromometano'); const C = m.at('C', [0, 0, 0], 0.12); const Br = m.to(C, 'Br', X, -0.32); methylOn(m, C, X, 0.067); tetraDirs(neg(X)).forEach((d) => m.lp(Br, d)); m.dl = { [C]: '+', [Br]: '−' }; m.elec = [C]; m.nuc = [Br]; m.note = 'C δ+ (eletrófilo); Br δ− será o grupo abandonador. O nucleófilo ataca o C pelo lado oposto ao Br.'; return m.done(); },
  acetone: () => { const m = new MB('acetona'); const C = m.at('C', [0, 0, 0], 0.5); const O = m.to(C, 'O', Y, -0.55, 2); const t = trig(Y, Z); const a = m.to(C, 'C', t[0], -0.18); const b = m.to(C, 'C', t[1], -0.18); methylOn(m, a, V.sub(m.atoms[C].p, m.atoms[a].p), 0.07, 0.5); methylOn(m, b, V.sub(m.atoms[C].p, m.atoms[b].p), 0.07, 0.5); trig(neg(Y), Z).forEach((d) => m.lp(O, d)); m.dl = { [C]: '+', [O]: '−' }; m.elec = [C]; m.nuc = [O]; m.note = 'C=O polarizada: C δ+ (eletrófilo), O δ− com dois pares livres.'; return m.done(); },
  BF3: () => { const m = new MB('trifluoreto de boro'); const B = m.at('B', [0, 0, 0], 0.9); [X, ...trig(X, Z)].forEach((d) => m.to(B, 'F', d, -0.3)); m.orb(B, Z, 'empty'); m.elec = [B]; m.nuc = [1, 2, 3]; m.note = 'B com 6 elétrons e orbital p vazio: ácido de Lewis (eletrófilo).'; return m.done(); },
  CH3p: () => { const m = new MB('cátion metila', 1); const C = m.at('C', [0, 0, 0], 0.5, 1); [X, ...trig(X, Z)].forEach((d) => m.to(C, 'H', d, 0.17)); m.orb(C, Z, 'empty'); m.elec = [C]; m.note = 'Trigonal plano (sp²), 6 elétrons, orbital p vazio perpendicular ao plano.'; return m.done(); },
  tBup: () => { const m = new MB('cátion t-butila', 1); const C = m.at('C', [0, 0, 0], 0.35, 1); [X, ...trig(X, Z)].forEach((d) => { const c = m.to(C, 'C', d, -0.1); methylOn(m, c, V.sub(m.atoms[C].p, m.atoms[c].p), 0.08, 0.5); }); m.orb(C, Z, 'empty'); m.elec = [C]; m.note = 'Os três grupos alquila doam densidade (hiperconjugação e indução): cátion 3° mais estável que o metila.'; return m.done(); },
  CH3m: () => { const m = new MB('ânion metila', -1); const C = m.at('C', [0, 0, 0], -0.85, -1); tetraDirs(Y).forEach((d) => m.to(C, 'H', d, -0.05)); m.lp(C, Y); m.orb(C, Y, 'lp'); m.nuc = [C]; m.note = 'Piramidal (≈ sp³), par não ligante: base e nucleófilo muito fortes.'; return m.done(); },
  CH3r: () => { const m = new MB('radical metila'); const C = m.at('C', [0, 0, 0], 0); [X, ...trig(X, Z)].forEach((d) => m.to(C, 'H', d, 0)); m.orb(C, Z, 'rad'); m.note = 'Aproximadamente plano; o elétron desemparelhado ocupa um orbital p.'; return m.done(); },
  CN: () => { const m = new MB('cianeto', -1); const C = m.at('C', [0, 0, 0], -0.6, -1); const N = m.to(C, 'N', X, -0.4, 3); m.lp(C, neg(X)); m.lp(N, X); m.nuc = [C, N]; m.note = 'Nucleófilo: pares livres no C (carga formal −1) e no N.'; return m.done(); },
  ethane: () => { const m = new MB('etano'); const c1 = m.at('C', [0, 0, 0], -0.18); const c2 = m.to(c1, 'C', X, -0.18); methylOn(m, c1, X, 0.06); methylOn(m, c2, neg(X), 0.06, Math.PI / 3); m.note = 'C sp³: H muito pouco ácidos (pKa ≈ 50).'; return m.done(); },
  ethylene: () => { const m = new MB('eteno'); const c1 = m.at('C', [0, 0, 0], -0.14); const c2 = m.to(c1, 'C', X, -0.14, 2); trig(X, Z).forEach((d) => m.to(c1, 'H', d, 0.07)); trig(neg(X), Z).forEach((d) => m.to(c2, 'H', d, 0.07)); m.nuc = [c1, c2]; m.note = 'Ligação π: região rica em elétrons acima e abaixo do plano.'; return m.done(); },
};
export const LIB3D_NAMES = { HCl: 'HCl', HBr: 'HBr', HF: 'HF', H2O: 'água', HO: 'hidróxido (HO⁻)', H3O: 'hidrônio (H₃O⁺)', ethanol: 'etanol', ethoxide: 'etóxido', acetic: 'ácido acético', acetate: 'acetato', acetylene: 'acetileno', acetylide: 'acetileto', NH3: 'amônia', NH2: 'íon amideto (NH₂⁻)', CH3Br: 'bromometano (CH₃Br)', acetone: 'acetona', BF3: 'BF₃', CH3p: 'cátion metila', tBup: 'cátion t-butila', CH3m: 'ânion metila (carbânion)', CH3r: 'radical metila', CN: 'cianeto', ethane: 'etano', ethylene: 'eteno' };

/* ===================================================================
 * Superfície de potencial eletrostático (qualitativa)
 * =================================================================== */
const ESPC = [[-1, [0.85, 0.15, 0.2]], [-0.45, [1, 0.62, 0.15]], [0, [0.35, 0.86, 0.45]], [0.45, [0.2, 0.75, 0.95]], [1, [0.2, 0.35, 0.95]]];
function espColor(t) {
  t = Math.max(-1, Math.min(1, t));
  for (let i = 0; i < ESPC.length - 1; i++) { const [a, ca] = ESPC[i], [b, cb] = ESPC[i + 1]; if (t <= b) { const s = (t - a) / (b - a); return [0, 1, 2].map((k) => ca[k] + (cb[k] - ca[k]) * s); } }
  return ESPC[ESPC.length - 1][1];
}
const VDW = { H: 1.1, C: 1.7, N: 1.55, O: 1.52, F: 1.47, Cl: 1.75, Br: 1.85, I: 1.98, B: 1.8, S: 1.8 };
export function espMesh(def, o = {}) {
  const sc = o.scale || 0.85, R = def.atoms.map((a) => (VDW[a.el] || 1.6) * sc);
  const base = new THREE.IcosahedronGeometry(1, 4); const bp = base.attributes.position.array;
  const pos = [], nor = [], col = [], vals = [];
  const pot = (p) => def.atoms.reduce((s, a) => s + a.q / Math.max(0.6, V.len(V.sub(p, a.p))), 0);
  def.atoms.forEach((a, i) => {
    for (let t = 0; t < bp.length; t += 9) {
      const tri = [0, 1, 2].map((k) => [bp[t + 3 * k], bp[t + 3 * k + 1], bp[t + 3 * k + 2]]);
      const w = tri.map((v) => V.add(a.p, V.mul(v, R[i])));
      const cen = V.mul(V.add(V.add(w[0], w[1]), w[2]), 1 / 3);
      if (def.atoms.some((b, j) => j !== i && V.len(V.sub(cen, b.p)) < R[j] - 0.01)) continue;
      w.forEach((p, k) => { pos.push(...p); nor.push(...tri[k]); vals.push(pot(p)); });
    }
  });
  // escala qualitativa: com faixa fixa (comparações) ou normalizando cada sinal separadamente
  const vneg = Math.max(0.04, -Math.min(0, ...vals)), vpos = Math.max(0.04, Math.max(0, ...vals));
  const vmax = o.range || Math.max(vneg, vpos);
  vals.forEach((v) => col.push(...espColor(o.range ? v / o.range : v < 0 ? v / vneg : v / vpos)));
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, transparent: true, opacity: o.opacity || 0.72, roughness: 0.55, depthWrite: false }));
  mesh.renderOrder = 2; mesh.userData.vmax = vmax;
  return mesh;
}

/* ===================================================================
 * Cena de molécula com camadas: pares, cargas, orbitais, ESP, regiões
 * =================================================================== */
function lobeMesh(color, opacity) { return new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), new THREE.MeshStandardMaterial({ color, transparent: true, opacity, roughness: 0.3, depthWrite: false, emissive: color, emissiveIntensity: 0.25 })); }
function placeLobe(m, pos, dir, len, wid) { const d = new THREE.Vector3(...V.norm(dir)); m.position.set(...V.add(pos, V.mul(V.norm(dir), len))); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d); m.scale.set(wid, len, wid); }

export function molScene(host, key, o = {}) {
  const v = new Viewer(host, { camPos: o.camPos || [4.6, 3.4, 6.6], alt: o.alt || 'Modelo 3D da molécula', autoRotate: !!o.autoRotate });
  const api = { v, ok: v.ok, def: null, flags: Object.assign({ lp: true, fc: true, dl: false, orb: true, esp: false, reg: false, style: 'ball' }, o.flags || {}) };
  if (!v.ok) return Object.assign(api, { set() {}, toggle() { return false; }, onPick: null });
  let layers = null, mol = null;
  const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
  function clear() {
    if (!layers) return;
    const objs = []; layers.traverse((x) => { if (x.isCSS2DObject) objs.push(x); }); objs.forEach((x) => x.parent.remove(x));
    if (mol) { const o2 = []; mol.group.traverse((x) => { if (x.isCSS2DObject) o2.push(x); }); o2.forEach((x) => x.parent.remove(x)); v.scene.remove(mol.group); }
    v.scene.remove(layers);
  }
  function set(k) {
    clear();
    const def = typeof k === 'string' ? LIB3D[k]() : k; api.def = def;
    mol = new Mol(v, def.atoms.map((a) => ({ el: a.el, p: a.p })), def.bonds.map(([i, j, ord, opt]) => [i, j, ord === 1.5 ? 1 : ord, Object.assign({ normal: [0, 0, 1] }, opt || {})]), { style: api.flags.style });
    api.mol = mol;
    layers = new THREE.Group(); v.scene.add(layers);
    const G = (name) => { const g = new THREE.Group(); g.name = name; layers.add(g); return g; };
    const gl = G('lp'), gf = G('fc'), gd = G('dl'), go = G('orb'), ge = G('esp'), gr = G('reg');
    def.lps.forEach(({ i, dir }) => { const P = def.atoms[i].p; const lob = lobeMesh(0x2fd4f5, 0.32); placeLobe(lob, P, dir, 0.62, 0.3); gl.add(lob); [-1, 1].forEach((s) => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), new THREE.MeshBasicMaterial({ color: 0xbff4ff })); const perp = V.norm(V.cross(dir, Math.abs(dir[2]) < 0.9 ? Z : X)); e.position.set(...V.add(V.add(P, V.mul(dir, 0.8)), V.mul(perp, 0.09 * s))); gl.add(e); }); });
    def.atoms.forEach((a, i) => { if (a.fc) { const l = label(a.fc > 0 ? '⊕' : '⊖', 'lbl3d fc3d ' + (a.fc > 0 ? 'pos' : 'neg')); l.position.set(...V.add(a.p, [0.38, 0.42, 0.3])); gf.add(l); } });
    Object.entries(def.dl).forEach(([i, s]) => { const a = def.atoms[i]; const l = label('δ' + s, 'lbl3d ' + (s === '+' ? 'dplus' : 'dminus')); l.position.set(...V.add(a.p, [0, 0.62, 0.2])); gd.add(l); });
    def.orbs.forEach(({ i, dir, kind }) => {
      const P = def.atoms[i].p;
      if (kind === 'empty' || kind === 'rad') {
        [1, -1].forEach((s) => { const lob = lobeMesh(kind === 'empty' ? 0xff9f43 : 0xb18cff, kind === 'empty' ? 0.22 : 0.3); placeLobe(lob, P, V.mul(dir, s), 0.95, 0.42); go.add(lob); });
        if (kind === 'rad') { const e = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffffff })); e.position.set(...V.add(P, V.mul(dir, 1.0))); go.add(e); }
        const l = label(kind === 'empty' ? 'p vazio' : 'p com 1 e⁻', 'lbl3d tag ' + (kind === 'empty' ? 'o' : 'm')); l.position.set(...V.add(P, V.mul(dir, 2.1))); go.add(l);
      } else { const lob = lobeMesh(0x2fd4f5, 0.3); placeLobe(lob, P, dir, 1.0, 0.45); go.add(lob); const l = label(kind === 'sp' ? 'par em sp' : 'par em sp³', 'lbl3d tag c'); l.position.set(...V.add(P, V.mul(dir, 2.0))); go.add(l); }
    });
    ge.add(espMesh(def, o.esp || {}));
    def.nuc.forEach((i) => { const h = lobeMesh(0x2fd4f5, 0.16); h.scale.setScalar(0.95); h.position.set(...def.atoms[i].p); gr.add(h); });
    def.elec.forEach((i) => { const h = lobeMesh(0xff9f43, 0.2); h.scale.setScalar(0.8); h.position.set(...def.atoms[i].p); gr.add(h); });
    apply();
    if (o.onSet) o.onSet(def);
  }
  function apply() {
    if (!layers) return;
    layers.children.forEach((g) => { g.visible = !!api.flags[g.name]; g.traverse((x) => { if (x.isCSS2DObject) x.visible = !!api.flags[g.name]; }); });
    mol.setStyle(api.flags.style);
  }
  v.renderer.domElement.addEventListener('click', (e) => {
    if (!api.onPick || !mol) return;
    const r = v.renderer.domElement.getBoundingClientRect();
    mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(mouse, v.camera);
    const hit = ray.intersectObjects(mol.meshes)[0];
    if (hit) api.onPick(mol.meshes.indexOf(hit.object));
  });
  api.onPick = o.onPick || null;
  set(key);
  return Object.assign(api, {
    set,
    toggle(k, val) { if (k === 'style') api.flags.style = api.flags.style === 'ball' ? 'space' : 'ball'; else api.flags[k] = val === undefined ? !api.flags[k] : val; apply(); return k === 'style' ? api.flags.style === 'space' : api.flags[k]; },
    mark(i, color) { const h = lobeMesh(color || 0xffd45c, 0.35); h.scale.setScalar(0.62); h.position.set(...api.def.atoms[i].p); layers.add(h); return h; },
  });
}
export { MB, trig };
