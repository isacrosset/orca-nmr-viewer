/*
 * struct.js — estruturas 2D de álcoois, éteres, epóxidos, produtos e quadros
 * de mecanismos. Vértices sem rótulo são carbonos com os H implícitos.
 */
import { S, ringPts } from './chem2d.js';
import { Z, R6, L, merge, cloneS, LP2, LP3, LPR, LP4 } from './build.js';
export { Z, R6, L, merge, cloneS, LP2, LP3, LPR, LP4 };

const add = { cls: 'add' }, oxy = { cls: 'ox' }, el = { cls: 'el' }, inter = { cls: 'int' };

/** anel benzênico ligado ao átomo i na direção deg */
export function ph(s, i, deg, len = 1) {
  const a = s.atoms[i], r = deg * Math.PI / 180;
  const cx = a[0] + Math.cos(r) * (len + 1), cy = a[1] - Math.sin(r) * (len + 1);
  const ids = [];
  for (let k = 0; k < 6; k++) {
    const t = r + Math.PI + k * Math.PI / 3;
    ids.push(s.a(cx + Math.cos(t), cy - Math.sin(t)));
  }
  s.b(i, ids[0]);
  for (let k = 0; k < 6; k++) s.b(ids[k], ids[(k + 1) % 6], k % 2 === 0 ? 2 : 1, k % 2 === 0 ? { side: -1 } : {});
  return ids;
}
/** epóxido: C1 (0,0), C2 (1,0), O acima; subs = [[rótulo, tipo], ...] p/ C1 e C2 */
export function epox(s1 = [], s2 = [], o = {}) {
  const s = new S();
  const c1 = s.a(0, 0, '', o.c1 || {}), c2 = s.a(1, 0, '', o.c2 || {}), O = s.a(0.5, -0.86, 'O', Object.assign({ lp: [90, 180] }, o.O || oxy));
  s.b(c1, c2).b(c1, O).b(c2, O);
  const d1 = s1.length === 1 ? [225] : [195, 250], d2 = s2.length === 1 ? [315] : [345, 290];
  s1.forEach((g, k) => s.br(c1, g[2] !== undefined ? g[2] : d1[k], g[0], g[1] || 1, g[3] || {}));
  s2.forEach((g, k) => s.br(c2, g[2] !== undefined ? g[2] : d2[k], g[0], g[1] || 1, g[3] || {}));
  s.ids = [c1, c2, O];
  return s;
}
const OH = (t = 1, deg) => ['OH', t, deg, oxy];

/* ===================================================================
 * Biblioteca de moléculas
 * =================================================================== */
export const M = {
  // ---------- álcoois ----------
  metanol: () => L(['H3C', 'OH'], [1], { opt: { 1: oxy } }),
  etanol: () => Z(3, { lab: { 2: 'OH' }, opt: { 2: oxy } }),
  propan1ol: () => Z(4, { lab: { 3: 'OH' }, opt: { 3: oxy } }),
  propan2ol: () => Z(3, { up: false, sub: { 1: [OH()] } }),
  butan1ol: () => Z(5, { lab: { 4: 'OH' }, opt: { 4: oxy } }),
  butan2ol: () => Z(4, { up: false, sub: { 1: [OH()] } }),
  butan2olR: () => Z(4, { up: false, sub: { 1: [OH('w')] } }),
  tbutanol: () => { const s = new S(); const c = s.a(0, 0); s.br(c, 210); s.br(c, 330); s.br(c, 90); s.br(c, 270, 'OH', 1, oxy); return s; },
  metilbutan2ol: () => Z(4, { sub: { 1: [['OH', 1, 300, oxy], ['', 1, 240]] } }),
  dimetilbutan2ol: () => Z(4, { up: false, sub: { 1: [OH()], 2: [['', 1, 235], ['', 1, 305]] } }), // 3,3-dimetilbutan-2-ol
  fenilmetanol: () => { const s = new S(); const c = s.a(0, 0); s.br(c, -30, 'OH', 1, oxy); ph(s, c, 210); return s; },
  alilico: () => Z(4, { dbl: [0], lab: { 3: 'OH' }, opt: { 3: oxy } }),
  etilenoglicol: () => Z(4, { lab: { 0: 'HO', 3: 'OH' }, opt: { 0: oxy, 3: oxy } }),
  butano13diol: () => Z(5, { lab: { 0: 'HO' }, opt: { 0: oxy }, sub: { 3: [OH()] } }),
  glicerol: () => Z(5, { lab: { 0: 'HO', 4: 'OH' }, opt: { 0: oxy, 4: oxy }, sub: { 2: [OH()] } }),
  ciclohexanol: () => R6({ sub: { 0: [OH()] } }),
  hexan1ol: () => Z(7, { lab: { 6: 'OH' }, opt: { 6: oxy } }),
  octan1ol: () => Z(9, { lab: { 8: 'OH' }, opt: { 8: oxy } }),
  // ---------- alcóxidos ----------
  etoxido: () => Z(3, { lab: { 2: 'O' }, opt: { 2: { chg: '−', lp: LPR, cls: 'ox' } } }),
  butoxido: () => Z(5, { lab: { 4: 'O' }, opt: { 4: { chg: '−', cls: 'ox' } } }),
  tbutoxido: () => { const s = new S(); const c = s.a(0, 0); s.br(c, 210); s.br(c, 330); s.br(c, 90); s.br(c, 270, 'O', 1, { chg: '−', cls: 'ox' }); return s; },
  // ---------- éteres ----------
  eterDimetilico: () => L(['H3C', 'O', 'CH3'], [1, 1], { opt: { 1: oxy } }),
  eterDietilico: () => Z(5, { lab: { 2: 'O' }, opt: { 2: oxy } }),
  metoxietano: () => Z(4, { lab: { 1: 'O' }, opt: { 1: oxy } }),
  metoxipropano2: () => Z(3, { up: false, sub: { 1: [['OCH3', 1, undefined, oxy]] } }),
  anisol: () => { const s = new S(); const o = s.a(0, 0, 'O', oxy); s.br(o, -30, 'CH3'); ph(s, o, 210); return s; },
  etoxibenzeno: () => { const s = new S(); const o = s.a(0, 0, 'O', oxy); const c = s.br(o, -30); s.br(c, 30); ph(s, o, 210); return s; },
  thf: () => { const s = new S(); const P = ringPts(5, 0, 0, -90); const ids = P.map((p, i) => s.a(p[0], p[1], i === 0 ? 'O' : '', i === 0 ? oxy : {})); for (let k = 0; k < 5; k++) s.b(ids[k], ids[(k + 1) % 5]); return s; },
  mtbe: () => { const s = new S(); const c = s.a(0, 0); s.br(c, 210); s.br(c, 150); s.br(c, 270); const o = s.br(c, 30, 'O', 1, oxy); s.br(o, -30); return s; },
  etilIsopropilEter: () => { const s = Z(3, { up: false, sub: { 1: [['O', 1, 90, oxy]] } }); const o = s.atoms.length - 1; const c = s.br(o, 30); s.br(c, -30); return s; },
  benzilMetilEter: () => { const s = new S(); const c = s.a(0, 0); const o = s.br(c, -30, 'O', 1, oxy); s.br(o, 30); ph(s, c, 210); return s; },
  tamilEtilEter: () => { const s = Z(4, { sub: { 1: [['', 1, 240], ['O', 1, 300, oxy]] } }); const o = s.atoms.length - 1; const c = s.br(o, 270); s.br(c, 330); return s; }, // 2-etoxi-2-metilbutano
  // ---------- epóxidos ----------
  oxirano: () => epox(),
  metiloxirano: () => epox([], [['']]),
  dimetiloxirano22: () => epox([], [[''], ['']]),
  cisDimetiloxirano: () => epox([['', 'w', 225]], [['', 'w', 315]]),
  oxidoCiclohexeno: () => { const s = R6(); const P0 = s.atoms[0], P1 = s.atoms[1]; const o = s.a((P0[0] + P1[0]) / 2, P0[1] - 0.86, 'O', Object.assign({ lp: [90] }, oxy)); s.b(0, o).b(1, o); return s; },
  // ---------- carbonílicos e ácidos ----------
  butanal: () => Z(5, { dbl: [3], lab: { 4: 'O' }, opt: { 4: add } }),
  acidoButanoico: () => Z(5, { lab: { 4: 'OH' }, opt: { 4: add }, sub: { 3: [['O', 2, undefined, add]] } }),
  butanona: () => Z(4, { sub: { 1: [['O', 2, undefined, add]] } }),
  propanona: () => Z(3, { sub: { 1: [['O', 2, undefined, add]] } }),
  propanal: () => Z(4, { dbl: [2], lab: { 3: 'O' }, opt: { 3: add } }),
  benzaldeido: () => { const s = new S(); const c = s.a(0, 0); s.br(c, -30, 'O', 2, add); ph(s, c, 210); return s; },
  acidoBenzoico: () => { const s = new S(); const c = s.a(0, 0); s.br(c, 30, 'O', 2, add); s.br(c, -30, 'OH', 1, add); ph(s, c, 180); return s; },
  propenal: () => Z(4, { dbl: [0, 2], lab: { 3: 'O' }, opt: { 3: add } }),
  acidoPropenoico: () => Z(4, { dbl: [0], lab: { 3: 'OH' }, opt: { 3: add }, sub: { 2: [['O', 2, undefined, add]] } }),
  dimetilbutanona: () => Z(4, { up: false, sub: { 1: [['O', 2, undefined, add]], 2: [['', 1, 235], ['', 1, 305]] } }),
  ciclohexanona: () => R6({ sub: { 0: [['O', 2, undefined, add]] } }),
  // ---------- haletos e sulfonatos ----------
  bromobutano1: () => Z(5, { lab: { 4: 'Br' }, opt: { 4: add } }),
  clorobutano1: () => Z(5, { lab: { 4: 'Cl' }, opt: { 4: add } }),
  bromobutano2: () => Z(4, { up: false, sub: { 1: [['Br', 1, undefined, add]] } }),
  bromobutano2S: () => Z(4, { up: false, sub: { 1: [['Br', 'h', undefined, add]] } }),
  clorobutano2S: () => Z(4, { up: false, sub: { 1: [['Cl', 'h', undefined, add]] } }),
  clorobutano2: () => Z(4, { up: false, sub: { 1: [['Cl', 1, undefined, add]] } }),
  tbubr: () => { const s = new S(); const c = s.a(0, 0); s.br(c, 210); s.br(c, 330); s.br(c, 90); s.br(c, 270, 'Br', 1, add); return s; },
  tbui: () => { const s = new S(); const c = s.a(0, 0); s.br(c, 210); s.br(c, 330); s.br(c, 90); s.br(c, 270, 'I', 1, add); return s; },
  tbucl: () => { const s = new S(); const c = s.a(0, 0); s.br(c, 210); s.br(c, 330); s.br(c, 90); s.br(c, 270, 'Cl', 1, add); return s; },
  benzilBr: () => { const s = new S(); const c = s.a(0, 0); s.br(c, -30, 'Br', 1, add); ph(s, c, 210); return s; },
  benzilCl: () => { const s = new S(); const c = s.a(0, 0); s.br(c, -30, 'Cl', 1, add); ph(s, c, 210); return s; },
  alilBr: () => Z(4, { dbl: [0], lab: { 3: 'Br' }, opt: { 3: add } }),
  alilCl: () => Z(4, { dbl: [0], lab: { 3: 'Cl' }, opt: { 3: add } }),
  bromoDimetilbutano23: () => Z(4, { sub: { 1: [['Br', 1, 300, add], ['', 1, 240]], 2: [['']] } }), // 2-bromo-2,3-dimetilbutano
  cloroDimetilbutano23: () => Z(4, { sub: { 1: [['Cl', 1, 300, add], ['', 1, 240]], 2: [['']] } }),
  bromoDimetilbutano22: () => Z(4, { up: false, sub: { 1: [['Br', 1, undefined, add]], 2: [['', 1, 235], ['', 1, 305]] } }), // 3-bromo-2,2-dimetilbutano
  cloroDimetilbutano22: () => Z(4, { up: false, sub: { 1: [['Cl', 1, undefined, add]], 2: [['', 1, 235], ['', 1, 305]] } }),
  iodometano: () => L(['H3C', 'I'], [1], { opt: { 1: add } }),
  butilOTs: () => Z(5, { lab: { 4: 'OTs' }, opt: { 4: add } }),
  butilOMs: () => Z(5, { lab: { 4: 'OMs' }, opt: { 4: add } }),
  butan2ilOTsR: () => Z(4, { up: false, sub: { 1: [['OTs', 'w', undefined, add]] } }),
  tbuOTs: () => { const s = new S(); const c = s.a(0, 0); s.br(c, 210); s.br(c, 330); s.br(c, 90); s.br(c, 270, 'OTs', 1, add); return s; },
  benzilOTs: () => { const s = new S(); const c = s.a(0, 0); s.br(c, -30, 'OTs', 1, add); ph(s, c, 210); return s; },
  alilOTs: () => Z(4, { dbl: [0], lab: { 3: 'OTs' }, opt: { 3: add } }),
  dimetilbutilOTs: () => Z(4, { up: false, sub: { 1: [['OTs', 1, undefined, add]], 2: [['', 1, 235], ['', 1, 305]] } }),
  // ---------- alcenos ----------
  but2enoE: () => Z(4, { dbl: [1] }),
  but1eno: () => Z(4, { dbl: [2] }),
  metilpropeno: () => { const s = new S(); const a = s.a(0, 0), b = s.a(0, -1); s.b(a, b, 2); s.br(a, 210); s.br(a, 330); return s; },
  dimetilbut2eno: () => { const s = new S(); const a = s.a(0, 0), b = s.a(1, 0); s.b(a, b, 2); s.br(a, 120); s.br(a, 240); s.br(b, 60); s.br(b, 300); return s; },
  metilbut1eno3: () => Z(4, { dbl: [0], sub: { 2: [['']] } }),
  metilciclohexeno: () => R6({ dbl: [0], sub: { 0: [['']] } }),
  // ---------- alcóxidos de sódio ----------
  butoxidoNa: () => Z(5, { lab: { 4: 'ONa' }, opt: { 4: oxy } }),
  sec_butoxidoNa: () => Z(4, { up: false, sub: { 1: [['ONa', 'w', undefined, oxy]] } }),
  tbuONa: () => { const s = new S(); const c = s.a(0, 0); s.br(c, 210); s.br(c, 330); s.br(c, 90); s.br(c, 270, 'ONa', 1, oxy); return s; },
  benzilONa: () => { const s = new S(); const c = s.a(0, 0); s.br(c, -30, 'ONa', 1, oxy); ph(s, c, 210); return s; },
  alilONa: () => Z(4, { dbl: [0], lab: { 3: 'ONa' }, opt: { 3: oxy } }),
  dimetilbutONa: () => Z(4, { up: false, sub: { 1: [['ONa', 1, undefined, oxy]], 2: [['', 1, 235], ['', 1, 305]] } }),
  // ---------- produtos de abertura de epóxidos ----------
  diolMetilpropano: () => Z(4, { lab: { 3: 'OH' }, opt: { 3: add }, sub: { 1: [['OH', 1, 300, oxy], ['', 1, 240]] } }), // 2-metilpropano-1,2-diol
  metoxiBasico: () => Z(5, { lab: { 3: 'O' }, opt: { 3: add }, sub: { 1: [['OH', 1, 300, oxy], ['', 1, 240]] } }), // 1-metoxi-2-metilpropan-2-ol
  metoxiAcido: () => Z(4, { lab: { 3: 'OH' }, opt: { 3: oxy }, sub: { 1: [['OCH3', 1, 300, add], ['', 1, 240]] } }), // 2-metoxi-2-metilpropan-1-ol
  etoxiBasico: () => Z(6, { lab: { 3: 'O' }, opt: { 3: add }, sub: { 1: [['OH', 1, 300, oxy], ['', 1, 240]] } }), // 1-etoxi-2-metilpropan-2-ol
  nitrilaEpox: () => Z(4, { lab: { 3: 'CN' }, opt: { 3: add }, sub: { 1: [['OH', 1, 300, oxy], ['', 1, 240]] } }), // 3-hidroxi-3-metilbutanonitrila
  azidaEpox: () => Z(4, { lab: { 3: 'N3' }, opt: { 3: add }, sub: { 1: [['OH', 1, 300, oxy], ['', 1, 240]] } }), // 1-azido-2-metilpropan-2-ol
  aminaEpox: () => Z(4, { lab: { 3: 'NH2' }, opt: { 3: add }, sub: { 1: [['OH', 1, 300, oxy], ['', 1, 240]] } }), // 1-amino-2-metilpropan-2-ol
  butanolDeOxirano: () => Z(5, { lab: { 4: 'OH' }, opt: { 4: oxy, 0: add, 1: add } }),
  transMetoxiCiclohexanol: () => R6({ sub: { 0: [['OCH3', 'w', undefined, add]], 1: [['OH', 'h', undefined, oxy]] } }),
  transDiolCiclohexano: () => R6({ sub: { 0: [['OH', 'w', undefined, add]], 1: [['OH', 'h', undefined, oxy]] } }),
  butanodiolRR: () => Z(4, { up: false, sub: { 1: [['OH', 'w', undefined, oxy]], 2: [['OH', 'w', undefined, add]] } }),
  // ---------- preparação ----------
  propeno: () => Z(3, { dbl: [0] }),
  propano: () => Z(3),
  metilciclohexanol1: () => R6({ sub: { 0: [['', 1], ['OH', 1, undefined, add]] } }),
  transMetilciclohexanol2: () => R6({ sub: { 0: [['', 'w']], 1: [['OH', 'h', undefined, add]] } }),
  dimetilbut1eno33: () => Z(4, { dbl: [0], sub: { 2: [['', 1, 55], ['', 1, 125]] } }),
  dimetilbutan2ol23: () => Z(4, { sub: { 1: [['OH', 1, 300, add], ['', 1, 240]], 2: [['']] } }),
  dimetilbutan2olOxy: () => Z(4, { up: false, sub: { 1: [['OH', 1, undefined, add]], 2: [['', 1, 235], ['', 1, 305]] } }),
  butan2olProd: () => Z(4, { up: false, sub: { 1: [['OH', 1, undefined, add]] } }),
  butan1olProd: () => Z(5, { lab: { 4: 'OH' }, opt: { 4: add } }),
  // ---------- haloidrinas ----------
  bromohidrina: () => Z(4, { lab: { 3: 'Br' }, opt: { 3: add }, sub: { 1: [['OH', 1, 300, oxy], ['', 1, 240]] } }), // 1-bromo-2-metilpropan-2-ol
  // ---------- outros ----------
  fenol: () => { const s = new S(); const o = s.a(0, 0, 'OH', oxy); ph(s, o, 180); return s; },
  agua: () => { const s = new S(); const o = s.a(0, 0, 'O', { lp: [45, 135], cls: 'ox' }); s.br(o, 210, 'H', 1, null, 0.85); s.br(o, 330, 'H', 1, null, 0.85); return s; },
};
M.grignardEpox = () => // 2-metilbutan-2-ol
   { const s = Z(4, { sub: { 1: [['OH', 1, 300, oxy], ['', 1, 240]] } }); s.atoms[3][3] = add; return s; };

/* ===================================================================
 * Mecanismos
 * =================================================================== */
const h2o = (s, x, y, lp = [90, 0]) => { const o = s.a(x, y, 'O', { lp, cls: 'ox' }); s.br(o, 210, 'H', 1, null, 0.85); s.br(o, 330, 'H', 1, null, 0.85); return o; };

/** protonação do álcool e SN2 (álcool 1° + HBr) */
export function hbrSN2() {
  const base = (cat) => {
    const s = new S();
    const c = s.a(0, 0, 'CH2', cat ? el : {}); s.br(c, 90, 'CH3CH2CH2', 1, null, 1.05);
    return s;
  };
  const r = base(false);
  const O = r.br(0, 0, 'O', 1, { lp: [90, 270], cls: 'ox' }, 1.2); r.br(O, 0, 'H', 1, null, 0.85);
  const H = r.a(1.2, 1.55, 'H', el), Br = r.a(1.2, 2.75, 'Br', { lp: [190, 270, 350] }); r.b(H, Br);
  const a = cloneS(r);
  a.arrow({ lp: [O, 270] }, { a: H, ang: 90 }, -0.4, 'o');
  a.arrow({ b: [H, Br] }, { a: Br, ang: 25 }, -0.7, '');
  const i = base(true);
  const O2 = i.br(0, 0, 'O', 1, { chg: '+', lp: [125], cls: 'ox' }, 1.2); i.br(O2, 0, 'H', 1, null, 0.85); i.br(O2, 270, 'H', 1, null, 0.85);
  const Bm = i.a(-1.9, 0, 'Br', { chg: '−', lp: [0, 90, 270], cls: 'add' });
  i.t(0.1, 1.6, 'O–H₂⁺: bom grupo abandonador', 'note', 12);
  const ia = cloneS(i);
  ia.arrow({ lp: [Bm, 0] }, { a: 0, ang: 180 }, 0, 'o');
  ia.arrow({ b: [0, O2] }, { a: O2, ang: 225 }, 0.6, '');
  const p = M.bromobutano1(); p.plus(4.5, 0); h2o(p, 5.9, 0, [50, 130]);
  return [r, a, i, ia, p];
}
/** álcool 3° + HBr (SN1) */
export function hbrSN1() {
  const r = new S();
  const c = r.a(0, 0, 'C'); r.br(c, 90, 'CH3'); r.br(c, 180, 'H3C'); r.br(c, 270, 'CH3');
  const O = r.br(c, 0, 'O', 1, { lp: [90, 270], cls: 'ox' }, 1.15); r.br(O, 0, 'H', 1, null, 0.85);
  const H = r.a(r.atoms[O][0], -1.55, 'H', el), Br = r.a(r.atoms[O][0], -2.75, 'Br', { lp: [60, 120, 180] }); r.b(H, Br);
  const a = cloneS(r); a.arrow({ lp: [O, 90] }, { a: H, ang: 270 }, 0.4, 'o'); a.arrow({ b: [H, Br] }, { a: Br, ang: 0 }, -0.6, '');
  const i1 = new S();
  const c2 = i1.a(0, 0, 'C'); i1.br(c2, 90, 'CH3'); i1.br(c2, 180, 'H3C'); i1.br(c2, 270, 'CH3');
  const O2 = i1.br(c2, 0, 'O', 1, { chg: '+', lp: [125], cls: 'ox' }, 1.15); i1.br(O2, 0, 'H', 1, null, 0.85); i1.br(O2, 270, 'H', 1, null, 0.85);
  const i1a = cloneS(i1); i1a.arrow({ b: [c2, O2] }, { a: O2, ang: 225 }, 0.6, '');
  const i2 = new S();
  const cp = i2.a(0, 0, 'C', { chg: '+', halo: 'v' }); i2.br(cp, 90, 'CH3'); i2.br(cp, 210, 'H3C'); i2.br(cp, 330, 'CH3');
  const Bm = i2.a(0, 2.0, 'Br', { chg: '−', lp: [0, 180, 270], cls: 'add' }); i2.t(-2.6, 1.0, '+ H₂O', 'note', 14);
  i2.t(3.0, 1.3, 'carbocátion 3° (planar)', 'note', 12);
  i2.arrow({ a: Bm, ang: 90 }, { a: cp, ang: 270 }, 0.35, 'o');
  return [r, a, i1, i1a, i2, M.tbubr()];
}
/** PBr3 com inversão */
export function pbr3Frames() {
  const r = M.butan2olR();
  const oi = r.atoms.length - 1; r.atoms[oi][3] = { lp: [30, 150], cls: 'ox' };
  const P = r.a(r.atoms[oi][0] + 1.3, r.atoms[oi][1] - 0.9, 'PBr2', { cls: 'el' });
  const Brx = r.a(r.atoms[P][0] + 1.5, r.atoms[P][1], 'Br', { lp: [0, 90, 270] }); r.b(P, Brx);
  const a = cloneS(r);
  a.arrow({ lp: [oi, 30] }, { a: P, ang: 200 }, -0.4, 'o');
  a.arrow({ b: [P, Brx] }, { a: Brx, ang: 90 }, -0.6, '');
  const i = Z(4, { up: false, sub: { 1: [['O', 'w', undefined, { chg: '+', cls: 'ox' }]] } });
  const oi2 = i.atoms.length - 1; const P2 = i.br(oi2, 0, 'PBr2', 1, el, 1.25); void P2; i.br(oi2, 150, 'H', 1, null, 0.85);
  const Bm = i.a(i.atoms[1][0], i.atoms[1][1] + 1.7, 'Br', { chg: '−', lp: LP4, cls: 'add' });
  const ia = cloneS(i);
  ia.arrow({ lp: [Bm, 90] }, { a: 1, ang: 270 }, 0.25, 'o');
  ia.arrow({ b: [1, oi2] }, { a: oi2, ang: 120 }, -0.6, '');
  const p = M.bromobutano2S(); p.t(4.2, 0, '+ HOPBr₂', 'note', 15);
  return [r, a, i, ia, p];
}
/** SOCl2 (esquema) */
export function socl2Frames() {
  const r = M.butan1ol(); r.r(4.8, 6.6, 0, 'SOCl₂', 'piridina');
  const cs = Z(5, { lab: { 4: 'O' }, opt: { 4: oxy } }); const o = cs.atoms.length - 1; const s = cs.br(o, 30, 'S', 1, el); cs.br(s, 90, 'O', 2); cs.br(s, -30, 'Cl');
  cs.t(2.8, 1.4, 'clorossulfito de alquila (intermediário)', 'note', 13);
  const cs2 = Z(5, { lab: { 4: 'O' }, opt: { 4: oxy, 3: el } }); { const s2 = cs2.br(4, 30, 'S', 1, el); cs2.br(s2, 90, 'O', 2); cs2.br(s2, -30, 'Cl'); }
  const Cl = cs2.a(1.6, 1.6, 'Cl', { chg: '−', lp: LP4, cls: 'add' });
  cs2.arrow({ lp: [Cl, 45] }, { a: 3, ang: 290 }, 0.3, 'o'); cs2.arrow({ b: [3, 4] }, { a: 4, ang: 300 }, -0.5, '');
  const p = M.clorobutano1(); p.t(7.0, 0, '+ SO₂ + Cl⁻ (+ pyH⁺)', 'note', 14);
  return [r, cs, cs2, p];
}
/** tosilação e SN2 */
export function tosylFrames() {
  const r = M.butan2olR(); r.r(3.4, 5.6, 0, 'TsCl', 'piridina'); merge(r, M.butan2ilOTsR(), 6.4, 0);
  r.t(8.0, 1.3, 'C–O intacta: configuração mantida', 'note', 13);
  const s2 = M.butan2ilOTsR(); s2.r(3.4, 5.6, 0, 'NaCN', 'DMSO (SN2)');
  const prod = Z(4, { up: false, sub: { 1: [['CN', 'h', undefined, add]] } }); merge(s2, prod, 6.4, 0);
  s2.t(8.0, 1.3, 'ataque backside: inversão', 'note', 13);
  return [r, s2];
}
/** desidratação E1 com migração de metila (3,3-dimetilbutan-2-ol) */
export function dehydrationFrames() {
  const r = new S();
  const a = r.a(0, 0, 'H3C'), b = r.a(1.5, 0, 'CH'), c = r.a(3.0, 0, 'C'), d = r.a(4.5, 0, 'CH3');
  r.b(a, b).b(b, c).b(c, d); r.br(c, 90, 'CH3'); r.br(c, 270, 'CH3');
  const O = r.br(b, 270, 'O', 1, { lp: [180, 0], cls: 'ox' }); r.br(O, 270, 'H', 1, null, 0.85);
  const H = r.a(-0.3, 2.7, 'H', el), W = r.a(-1.5, 2.7, 'O', { chg: '+', lp: [270] }); r.b(H, W); r.br(W, 150, 'H', 1, null, 0.85); r.br(W, 210, 'H', 1, null, 0.85);
  const ra = cloneS(r); ra.arrow({ lp: [O, 180] }, { a: H, ang: 30 }, -0.3, 'o'); ra.arrow({ b: [H, W] }, { a: W, ang: 90 }, -0.6, '');
  const i1 = new S();
  const a1 = i1.a(0, 0, 'H3C'), b1 = i1.a(1.5, 0, 'CH'), c1 = i1.a(3.0, 0, 'C'), d1 = i1.a(4.5, 0, 'CH3');
  i1.b(a1, b1).b(b1, c1).b(c1, d1); i1.br(c1, 90, 'CH3'); i1.br(c1, 270, 'CH3');
  const O1 = i1.br(b1, 270, 'O', 1, { chg: '+', lp: [0], cls: 'ox' }); i1.br(O1, 210, 'H', 1, null, 0.85); i1.br(O1, 330, 'H', 1, null, 0.85);
  i1.arrow({ b: [b1, O1] }, { a: O1, ang: 30 }, -0.5, '');
  const i2 = new S();
  const a2 = i2.a(0, 0, 'H3C'), b2 = i2.a(1.5, 0, 'CH', { chg: '+', halo: 'v' }), c2 = i2.a(3.0, 0, 'C'), d2 = i2.a(4.5, 0, 'CH3');
  i2.b(a2, b2).b(b2, c2).b(c2, d2); const m = i2.br(c2, 90, 'CH3', 1, { cls: 'el' }); i2.br(c2, 270, 'CH3');
  i2.arrow({ b: [c2, m] }, { a: b2, ang: 60 }, 0.55, 'c');
  i2.t(-1.0, 1.5, '+ H₂O', 'note', 14); i2.t(1.5, 2.3, 'carbocátion 2° → migração de CH₃ (1,2)', 'note', 12);
  const i3 = new S();
  const a3 = i3.a(0, 0, 'H3C'), b3 = i3.a(1.5, 0, 'C'), c3 = i3.a(3.0, 0, 'C', { chg: '+', halo: 'v' }), d3 = i3.a(4.5, 0, 'CH3');
  i3.b(a3, b3).b(b3, c3).b(c3, d3); i3.br(b3, 90, 'CH3'); const hb = i3.br(b3, 270, 'H', 1, { cls: 'el', halo: 'c' }); i3.br(c3, 270, 'CH3');
  const W3 = h2o(i3, 0.0, 2.6, [0, 90]); i3.t(4.6, 1.6, 'carbocátion 3° (mais estável)', 'note', 12);
  i3.arrow({ lp: [W3, 0] }, { a: hb, ang: 200 }, 0.3, 'o'); i3.arrow({ b: [b3, hb] }, { b: [b3, c3] }, -0.6, 'c');
  return [r, ra, i1, i2, i3, M.dimetilbut2eno()];
}
/** Williamson (SN2) e falha por E2 */
export function williamsonFrames() {
  const r = Z(3, { lab: { 2: 'O' }, opt: { 2: { chg: '−', lp: [90, 270, 0], cls: 'ox' } } });
  const Cm = r.a(r.atoms[2][0] + 1.6, r.atoms[2][1], 'CH3', el), I = r.a(r.atoms[2][0] + 2.85, r.atoms[2][1], 'I', { lp: [240, 300, 0] }); r.b(Cm, I);
  const a = cloneS(r); a.arrow({ lp: [2, 0] }, { a: Cm, ang: 180 }, -0.5, 'o'); a.arrow({ b: [Cm, I] }, { a: I, ang: 90 }, -0.6, '');
  const p = M.metoxietano(); p.atoms[3][3] = add; p.t(4.2, 0, '+ I⁻', 'note', 15);
  return [r, a, p];
}
export function williamsonE2() {
  const s = new S();
  const c = s.a(0, 0, 'C'); const Br = s.br(c, 90, 'Br', 1, { lp: [60, 120, 180] }, 1.1); s.br(c, 150, 'H3C'); s.br(c, 210, 'H3C');
  const cb = s.br(c, 0, 'C', 1, null, 1.4); s.br(cb, 90, 'H', 1, null, 0.85); s.br(cb, 0, 'H', 1, null, 0.85);
  const hb = s.br(cb, 270, 'H', 1, { cls: 'el', halo: 'c' }, 0.9);
  const O = s.a(1.4, 2.4, 'O', { chg: '−', lp: [90, 180, 270], cls: 'base' }); s.br(O, 0, 'CH3');
  s.arrow({ lp: [O, 90] }, { a: hb, ang: 270 }, 0.35, 'o'); s.arrow({ b: [cb, hb] }, { b: [c, cb] }, -0.6, 'c'); s.arrow({ b: [c, Br] }, { a: Br, ang: 0 }, -0.6, '');
  s.t(-0.6, 3.5, 'C terciário: SN2 bloqueada → E2 (metilpropeno)', 'note', 12);
  return s;
}
/** clivagem de éter metílico com HI */
export function cleavageFrames() {
  const r = M.metoxietano(); const O = 1; r.atoms[O][3] = { lp: [90, 270], cls: 'ox' };
  const H = r.a(r.atoms[O][0], r.atoms[O][1] - 1.5, 'H', el), I = r.a(r.atoms[O][0], r.atoms[O][1] - 2.7, 'I', { lp: [60, 120, 180] }); r.b(H, I);
  const a = cloneS(r); a.arrow({ lp: [O, 90] }, { a: H, ang: 270 }, 0.4, 'o'); a.arrow({ b: [H, I] }, { a: I, ang: 0 }, -0.6, '');
  const i = M.metoxietano(); i.atoms[O][3] = { chg: '+', cls: 'ox' }; i.br(O, 90, 'H', 1, null, 0.85);
  const Im = i.a(-1.6, -1.15, 'I', { chg: '−', lp: [90, 180, 270], cls: 'add' }); i.t(1.6, 1.5, 'SN2 no CH₃ (menos impedido)', 'note', 12);
  const ia = cloneS(i); ia.arrow({ a: Im, ang: 330 }, { a: 0, ang: 150 }, 0, 'o'); ia.arrow({ b: [0, O] }, { a: O, ang: 300 }, 0.5, '');
  const p = M.iodometano(); p.plus(2.6, 0); merge(p, M.etanol(), 3.4, 0);
  return [r, a, i, ia, p];
}
/** haloidrina → epóxido (SN2 intramolecular) */
export function halohydrinEpoxFrames() {
  const r = new S();
  const c2 = r.a(0, 0, 'C'); r.br(c2, 150, 'H3C'); r.br(c2, 210, 'H3C');
  const c1 = r.br(c2, 0, 'CH2', 1, null, 1.3); const Br = r.br(c1, 270, 'Br', 1, { lp: [180, 270, 0] }, 1.15);
  const O = r.br(c2, 90, 'O', 1, { lp: [180, 0], cls: 'ox' }); const H = r.br(O, 90, 'H', 1, el, 0.85);
  const B = r.a(-2.0, -1.85, 'OH', { chg: '−', lp: [90, 270], cls: 'base' });
  const a = cloneS(r); a.arrow({ lp: [B, 0] }, { a: H, ang: 180 }, 0.3, 'o'); a.arrow({ b: [O, H] }, { a: O, ang: 150 }, -0.6, 'c');
  const i = new S();
  const d2 = i.a(0, 0, 'C'); i.br(d2, 150, 'H3C'); i.br(d2, 210, 'H3C');
  const d1 = i.br(d2, 0, 'CH2', 1, null, 1.3); const Br2 = i.br(d1, 270, 'Br', 1, { lp: [180, 270, 0] }, 1.15);
  const O2 = i.br(d2, 90, 'O', 1, { chg: '−', lp: [180, 90], cls: 'ox' });
  i.t(-1.6, -2.1, '+ H₂O', 'note', 14);
  const ia = cloneS(i); ia.arrow({ lp: [O2, 90] }, { a: d1, ang: 90 }, -0.55, 'o'); ia.arrow({ b: [d1, Br2] }, { a: Br2, ang: 0 }, -0.6, '');
  const p = M.dimetiloxirano22(); p.t(3.0, 0, '+ Br⁻', 'note', 15);
  return [r, a, i, ia, p];
}
/** abertura básica (CH3O⁻) do 2,2-dimetiloxirano */
export function epoxBasic() {
  const r = M.dimetiloxirano22();
  const Nu = r.a(-1.5, 0.9, 'O', { chg: '−', lp: [0, 90, 270], cls: 'base' }); r.br(Nu, 180, 'H3C');
  const a = cloneS(r); a.arrow({ lp: [Nu, 0] }, { a: 0, ang: 210 }, 0.3, 'o'); a.arrow({ b: [0, 2] }, { a: 2, ang: 150 }, -0.5, '');
  const i = Z(5, { lab: { 3: 'O' }, opt: { 3: add }, sub: { 1: [['O', 1, 300, { chg: '−', cls: 'ox' }], ['', 1, 240]] } });
  i.t(2.0, 2.0, 'alcóxido; depois CH₃OH protona o O⁻', 'note', 13);
  return [r, a, i, M.metoxiBasico()];
}
/** abertura ácida (CH3OH, H⁺) do 2,2-dimetiloxirano */
export function epoxAcid() {
  const r = M.dimetiloxirano22(); r.atoms[2][3] = { lp: [90, 180], cls: 'ox' };
  const H = r.a(0.5, -2.25, 'H', el), W = r.a(0.5, -3.4, 'O', { chg: '+', lp: [90] }); r.b(H, W); r.br(W, 0, 'CH3'); r.br(W, 180, 'H', 1, null, 0.85);
  const a = cloneS(r); a.arrow({ lp: [2, 90] }, { a: H, ang: 270 }, 0.4, 'o'); a.arrow({ b: [H, W] }, { a: W, ang: 330 }, -0.6, '');
  const prot = (ts) => {
    const i = epox([], [['', 1, 15], ['', 1, 255]], { c2: { d: '+', dd: [0.3, -0.45] }, O: { chg: '+', lp: [180], cls: 'ox' } });
    i.br(2, 90, 'H', 1, null, 0.85);
    const Me = i.a(2.45, 1.45, 'O', { lp: [135, 200], cls: 'base' }); i.br(Me, 0, 'CH3'); i.br(Me, 270, 'H', 1, null, 0.85);
    if (ts) { i.bonds[2][2] = 'p'; i.b(1, Me, 'p'); i.atoms[Me][3] = { d: '+', dd: [0.3, -0.5], cls: 'base' }; i.atoms[2][3] = { d: '−', dd: [-0.5, -0.1], lp: [180], cls: 'ox' }; i.t(1.2, 3.0, '‡ C–O alongada; C terciário com caráter catiônico parcial', 'note', 12); }
    else i.t(1.2, 3.0, 'epóxido protonado (intermediário)', 'note', 12);
    i.Me = Me; return i;
  };
  const i = prot(false);
  const ia = cloneS(i); ia.arrow({ lp: [i.Me, 135] }, { a: 1, ang: 315 }, 0.25, 'o'); ia.arrow({ b: [1, 2] }, { a: 2, ang: 30 }, 0.5, '');
  return [r, a, i, ia, prot(true), M.metoxiAcido()];
}
/** Grignard + óxido de etileno */
export function grignardFrames() {
  const r = M.oxirano(); const Mg = r.a(-3.2, 1.4, 'CH3CH2', { cls: 'base', d: '−', dd: [0.3, 0.6] }); const m2 = r.a(-1.1, 1.4, 'MgBr', { d: '+', dd: [0, 0.6] }); r.b(Mg, m2);
  const a = cloneS(r); a.arrow({ b: [Mg, m2] }, { a: 0, ang: 200 }, -0.5, 'o'); a.arrow({ b: [0, 2] }, { a: 2, ang: 150 }, -0.5, '');
  const i = Z(5, { lab: { 4: 'O' }, opt: { 4: { chg: '−', cls: 'ox' }, 0: add, 1: add } }); i.t(5.2, 0, '+ MgBr⁺', 'note', 14);
  i.r(6.6, 8.4, 0, 'H₃O⁺', '(workup)');
  return [r, a, i, M.butanolDeOxirano()];
}
