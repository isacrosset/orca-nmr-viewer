/*
 * an2d.js — mecanismos 2D (setas curvas, cargas e transferências de próton
 * explícitas) para adição nucleofílica à C=O: adição em base e em ácido,
 * hidratação, hemiacetal/acetal (completo e simplificado), hidrólise,
 * imina, enamina, oxima/hidrazona, cianoidrina, tioacetal, Wittig e HWE.
 * Cada etapa: { s (chem2d S), cap, en (ponto do perfil), k3 (espécie 3D) }.
 * Ângulos: graus, 0 = direita, 90 = cima. Coordenadas em comprimentos de ligação (y para baixo).
 */
import { S } from './chem2d.js';

const R1 = 'R', R2 = 'R′';
const G = { cls: 'grey' };
/* ---------- blocos ---------- */
function carb(s, o = {}) {
  const c = s.a(0, 0, '', { halo: 'o' });
  const O = s.br(c, 90, 'O', 2, { cls: 'oxy', lp: o.prot ? [150] : [45, 135], chg: o.prot ? '+' : undefined }, 1.2);
  const H = o.prot ? s.br(O, 30, 'H', 1, { cls: 'hb' }, 0.95) : null;
  const r1 = s.br(c, 210, o.r1 || R1, 1, G), r2 = s.br(c, 330, o.r2 || R2, 1, G);
  return { c, O, H, r1, r2 };
}
/** carbono tetraédrico: top (90°), left (180°), bottom (270°, cunha), right (0°, tracejada) */
function tet(s, top, left, o = {}) {
  const c = s.a(0, 0, '', { halo: o.halo || 'v' });
  const T = s.br(c, 90, top[0], 1, top[1] || {}, 1.15);
  const L = s.br(c, 180, left[0], 1, left[1] || {}, 1.2);
  const B = s.br(c, 270, o.r1 || R1, 'w', G, 1.05);
  const Rr = s.br(c, 0, o.r2 || R2, 'h', G, 1.15);
  return { c, T, L, B, R: Rr };
}
const acid = (s, x, y, ang = 180) => { const O = s.a(x, y, 'OH₂', { chg: '+', cls: 'oxy2' }); const H = s.br(O, ang, 'H', 1, { cls: 'hb' }, 0.95); return { O, H }; };
const water = (s, x, y, lp) => s.a(x, y, 'H₂O', { cls: 'base', lp: [lp] });
const tag = (s, x, y, t, cls = 'cond', fs = 14) => s.t(x, y, t, cls, fs);
const F = (s, cap, en, k3, extra = {}) => Object.assign({ s, cap, en, k3 }, extra);
const SIMPL = ' <i class="muted">Representação mecanística simplificada para fins didáticos.</i>';

/* ===================================================================
 * Adição em meio básico (Nu⁻) e protonação
 * =================================================================== */
export function baseFrames(nu = { lab: 'HO', name: 'HO⁻', k: 'alcoxidoOH', prod: 'hidratoAcetona', HA: 'H₂O' }) {
  const out = [];
  { const s = new S(); const A = carb(s); const n = s.a(-2.6, -0.9, nu.lab, { chg: '−', cls: 'nu', lp: [0, 90, 270] }); s.arrow({ lp: [n, 0] }, { a: A.c, ang: 165 }, -0.35, 'm'); s.arrow({ b: [A.c, A.O] }, { a: A.O, ang: 0 }, 0.5, 'm'); out.push(F(s, `<b>1. Ataque:</b> o par do ${nu.name} forma a ligação com o <b>carbono</b> (δ+, maior lobo do π*); ao mesmo tempo o par π da C=O vai para o <b>oxigênio</b>.`, 0, 'acetona')); }
  { const s = new S(); const T = tet(s, ['O', { cls: 'oxy', chg: '−', lp: [30, 150] }], [nu.lab, { cls: 'nu' }]); const w = s.a(1.9, -1.9, 'H', { cls: 'hb' }), wo = s.br(w, 0, nu.HA === 'HCN' ? 'CN' : 'OH', 1, { cls: 'oxy2' }, 1.0); s.arrow({ lp: [T.T, 30] }, { a: w, ang: 180 }, -0.35, 'm'); s.arrow({ b: [w, wo] }, { a: wo, ang: 90 }, 0.6, 'm'); out.push(F(s, `<b>2. Intermediário tetraédrico (alcóxido):</b> o carbono passou de sp² a sp³. O alcóxido (base) remove um próton de ${nu.HA}.`, 1, nu.k)); }
  { const s = new S(); tet(s, ['OH', { cls: 'prod' }], [nu.lab, { cls: 'nu' }], { halo: 'g' }); tag(s, 2.6, 0, nu.HA === 'HCN' ? '+ CN⁻ (regenerado)' : '+ HO⁻ (regenerado)'); out.push(F(s, `<b>3. Produto de adição:</b> carbono tetraédrico com OH e ${nu.lab === 'NC' ? 'CN' : nu.lab}. O ânion é regenerado (catálise básica).`, 2, nu.prod)); }
  return out;
}

/* ===================================================================
 * Adição ácido-catalisada de nucleófilo neutro H–O–R (água ou álcool)
 * =================================================================== */
export function acidAddFrames(nu = { R: 'H', name: 'H₂O', k: 'hidratoAcetona', kOx: 'hemicetalOx' }) {
  const out = [], Rl = nu.R === 'H' ? 'H' : 'CH₃';
  { const s = new S(); const A = carb(s); const a = acid(s, 2.4, -1.9, 180); s.arrow({ lp: [A.O, 45] }, { a: a.H, ang: 180 }, -0.4, 'm'); s.arrow({ b: [a.H, a.O] }, { a: a.O, ang: 90 }, 0.6, 'm'); out.push(F(s, '<b>1. Protonação do O carbonílico</b> (ácido = H₃O⁺, ou H–A): um par do O captura o H⁺.', 0, 'acetona')); }
  { const s = new S(); const A = carb(s, { prot: true }); const n = s.a(-2.6, -0.9, 'O', { cls: 'nu', lp: [0, 270] }); s.br(n, 120, 'H', 1, {}, 0.95); s.br(n, 210, Rl, 1, G, 1.0); s.arrow({ lp: [n, 0] }, { a: A.c, ang: 165 }, -0.35, 'm'); s.arrow({ b: [A.c, A.O] }, { a: A.O, ang: 0 }, 0.5, 'm');
    s.t(2.9, -0.3, '↔ R₂C⁺–OH', 'cond', 14); out.push(F(s, `<b>2. Carbonila ativada</b> (C ainda mais eletrofílico: contribuinte R₂C⁺–OH). O nucleófilo neutro (${nu.name}) ataca o C; o par π vai para o O⁺, que fica neutro.`, 1, 'acetonaH')); }
  { const s = new S(); const T = tet(s, ['OH', { cls: 'oxy' }], ['O', { cls: 'nu', chg: '+', lp: [200] }]); const h = s.br(T.L, 120, 'H', 1, { cls: 'hb' }, 0.95); s.br(T.L, 240, Rl, 1, G, 1.0); const w = water(s, -2.9, -1.6, 0); s.arrow({ lp: [w, 0] }, { a: h, ang: 180 }, -0.35, 'm'); s.arrow({ b: [h, T.L] }, { a: T.L, ang: 30 }, 0.6, 'm'); out.push(F(s, '<b>3. Desprotonação</b> do oxigênio que atacou (O⁺): a água (base) remove o H⁺ e o catalisador ácido é regenerado.', 2, nu.kOx)); }
  { const s = new S(); tet(s, ['OH', { cls: 'prod' }], [nu.R === 'H' ? 'OH' : 'OCH₃', { cls: 'prod' }], { halo: 'g' }); tag(s, 2.6, 0, '+ H₃O⁺'); out.push(F(s, nu.R === 'H' ? '<b>4. Gem-diol (hidrato)</b>: dois OH no mesmo carbono. Todas as etapas são reversíveis (⇌).' : '<b>4. Hemicetal</b> (de cetona; de aldeído: hemiacetal): OH e OR no mesmo carbono. Etapas reversíveis (⇌).', 3, nu.k)); }
  return out;
}

/* ===================================================================
 * Hemicetal → cetal (continuação; mecanismo completo)
 * =================================================================== */
export function acetalFrames() {
  const out = [];
  { const s = new S(); const T = tet(s, ['O', { cls: 'oxy', lp: [45, 135] }], ['OCH₃', { cls: 'oxy2' }]); s.br(T.T, 150, 'H', 1, {}, 0.95); const a = acid(s, 2.4, -2.2, 180); s.arrow({ lp: [T.T, 45] }, { a: a.H, ang: 180 }, -0.4, 'm'); s.arrow({ b: [a.H, a.O] }, { a: a.O, ang: 90 }, 0.6, 'm'); out.push(F(s, '<b>5. Protonação do OH do hemicetal</b>: transforma o mau grupo de saída (HO⁻) em um bom grupo de saída (<b>H₂O</b>).', 4, 'hemicetal')); }
  { const s = new S(); const c = s.a(0, 0, '', { halo: 'v' }); const O2 = s.br(c, 90, 'OH₂', 1, { cls: 'oxy', chg: '+' }, 1.2); const Om = s.br(c, 180, 'O', 1, { cls: 'oxy2', lp: [90, 270] }, 1.2); s.br(Om, 180, 'CH₃', 1, G, 1.0); s.br(c, 270, R1, 'w', G, 1.05); s.br(c, 0, R2, 'h', G, 1.15);
    s.arrow({ lp: [Om, 90] }, { b: [c, Om] }, -0.9, 'm'); s.arrow({ b: [c, O2] }, { a: O2, ang: 0 }, -0.6, 'm'); out.push(F(s, '<b>6. Saída de H₂O assistida pelo par do O–CH₃</b>: enquanto a ligação C–OH₂⁺ se rompe, um par do oxigênio vizinho forma a ligação π C=O⁺. Não se forma um carbocátion “nu” localizado.', 5, 'hemicetalH2O')); }
  { const s = new S(); const c = s.a(0, 0, '', { halo: 'v' }); const Om = s.br(c, 180, 'O', 2, { cls: 'oxy2', chg: '+', lp: [90] }, 1.2); s.br(Om, 135, 'CH₃', 1, G, 1.0); s.br(c, 300, R1, 1, G); s.br(c, 60, R2, 1, G);
    s.t(1.3, 1.9, 'íon oxocarbênio:  R₂C=O⁺–CH₃  ↔  R₂C⁺–OCH₃', 'cond', 13);
    const n = s.a(2.5, -0.2, 'O', { cls: 'nu', lp: [180, 90] }); s.br(n, 300, 'H', 1, {}, 0.95); s.br(n, 30, 'CH₃', 1, G, 1.0); s.arrow({ lp: [n, 180] }, { a: c, ang: 0 }, 0.3, 'm'); s.arrow({ b: [c, Om] }, { a: Om, ang: 270 }, 0.6, 'm');
    out.push(F(s, '<b>7. Íon oxocarbênio</b> (estabilizado por ressonância com o O; o contribuinte principal tem octetos completos: C=O⁺). Um <b>segundo CH₃OH</b> ataca o carbono; o par π vai para o O⁺.', 6, 'oxocarbenio')); }
  { const s = new S(); const T = tet(s, ['O', { cls: 'nu', chg: '+', lp: [150] }], ['OCH₃', { cls: 'oxy2' }]); const h = s.br(T.T, 45, 'H', 1, { cls: 'hb' }, 0.95); s.br(T.T, 135, 'CH₃', 1, G, 1.0); const w = water(s, 2.6, -2.1, 180); s.arrow({ lp: [w, 180] }, { a: h, ang: 0 }, 0.35, 'm'); s.arrow({ b: [h, T.T] }, { a: T.T, ang: 90 }, -0.6, 'm'); out.push(F(s, '<b>8. Desprotonação</b> do O⁺ pelo solvente/base: o catalisador ácido é regenerado.', 7, 'cetalH')); }
  { const s = new S(); tet(s, ['OCH₃', { cls: 'prod' }], ['OCH₃', { cls: 'prod' }], { halo: 'g' }); tag(s, 2.9, 0, '+ H₃O⁺'); out.push(F(s, '<b>9. Cetal</b> (de aldeído: acetal): dois grupos OR, <b>nenhum OH</b>, no antigo carbono carbonílico. Global: R₂C=O + 2 CH₃OH ⇌ R₂C(OCH₃)₂ + H₂O.', 8, 'cetal')); }
  return out;
}
export const fullAcetal = () => [...acidAddFrames({ R: 'CH₃', name: 'CH₃OH', k: 'hemicetal', kOx: 'hemicetalOx' }), ...acetalFrames()];
export function simpleAcetal() {
  const mk = (cap, en, k3, build) => { const s = new S(); build(s); return F(s, cap, en, k3); };
  return [
    mk('<b>Ativação:</b> H⁺ protona o O da C=O.', 0, 'acetona', (s) => { carb(s); s.t(2.2, -1.5, '+ H⁺', 'cond', 16); }),
    mk('<b>Adição:</b> CH₃OH ataca; após transferência de próton → <b>hemicetal</b>.', 3, 'hemicetal', (s) => tet(s, ['OH', { cls: 'oxy' }], ['OCH₃', { cls: 'oxy2' }])),
    mk('<b>Eliminação:</b> OH protonado sai como H₂O → íon oxocarbênio (C=O⁺CH₃).', 6, 'oxocarbenio', (s) => { const c = s.a(0, 0, '', { halo: 'v' }); const O = s.br(c, 180, 'O', 2, { cls: 'oxy2', chg: '+' }, 1.2); s.br(O, 135, 'CH₃', 1, G); s.br(c, 300, R1, 1, G); s.br(c, 60, R2, 1, G); s.t(2.2, 0, '+ H₂O', 'cond', 15); }),
    mk('<b>Segunda adição:</b> CH₃OH ataca; desprotonação → <b>cetal</b>. Todo o processo é um equilíbrio (⇌).', 8, 'cetal', (s) => tet(s, ['OCH₃', { cls: 'prod' }], ['OCH₃', { cls: 'prod' }], { halo: 'g' })),
  ];
}

/* ===================================================================
 * Hidrólise de cetal (mecanismo inverso)
 * =================================================================== */
export function hydrolysisFrames() {
  const out = [];
  { const s = new S(); const T = tet(s, ['O', { cls: 'oxy', lp: [45, 135] }], ['OCH₃', { cls: 'oxy2' }]); s.br(T.T, 150, 'CH₃', 1, G, 1.0); const a = acid(s, 2.4, -2.2, 180); s.arrow({ lp: [T.T, 45] }, { a: a.H, ang: 180 }, -0.4, 'm'); s.arrow({ b: [a.H, a.O] }, { a: a.O, ang: 90 }, 0.6, 'm'); out.push(F(s, '<b>1. Protonação de um OCH₃</b> do cetal (meio ácido aquoso).', 0, 'cetal')); }
  { const s = new S(); const c = s.a(0, 0, '', { halo: 'v' }); const Ot = s.br(c, 90, 'O', 1, { cls: 'oxy', chg: '+' }, 1.2); s.br(Ot, 30, 'H', 1, {}, 0.95); s.br(Ot, 150, 'CH₃', 1, G, 1.0); const Om = s.br(c, 180, 'O', 1, { cls: 'oxy2', lp: [90, 270] }, 1.2); s.br(Om, 180, 'CH₃', 1, G); s.br(c, 270, R1, 'w', G, 1.05); s.br(c, 0, R2, 'h', G, 1.15);
    s.arrow({ lp: [Om, 90] }, { b: [c, Om] }, -0.9, 'm'); s.arrow({ b: [c, Ot] }, { a: Ot, ang: 0 }, -0.6, 'm'); out.push(F(s, '<b>2. Saída de CH₃OH</b> assistida pelo par do outro O → íon oxocarbênio.', 1, 'cetalH')); }
  { const s = new S(); const c = s.a(0, 0, '', { halo: 'v' }); const Om = s.br(c, 180, 'O', 2, { cls: 'oxy2', chg: '+', lp: [90] }, 1.2); s.br(Om, 135, 'CH₃', 1, G); s.br(c, 300, R1, 1, G); s.br(c, 60, R2, 1, G); const n = s.a(2.4, -0.2, 'O', { cls: 'nu', lp: [180, 90] }); s.br(n, 300, 'H', 1, {}, 0.95); s.br(n, 30, 'H', 1, {}, 0.95); s.arrow({ lp: [n, 180] }, { a: c, ang: 0 }, 0.3, 'm'); s.arrow({ b: [c, Om] }, { a: Om, ang: 270 }, 0.6, 'm'); out.push(F(s, '<b>3. A água ataca</b> o íon oxocarbênio (excesso de água desloca o equilíbrio para a hidrólise).', 2, 'oxocarbenio')); }
  { const s = new S(); tet(s, ['OH', { cls: 'oxy' }], ['OCH₃', { cls: 'oxy2' }]); tag(s, 2.7, 0, '(após desprotonação)'); out.push(F(s, '<b>4. Hemicetal</b>: a sequência se repete — protonação do OCH₃, saída de CH₃OH assistida pelo OH…', 3, 'hemicetal')); }
  { const s = new S(); carb(s, { prot: true }); tag(s, 2.6, -0.4, '→ − H⁺'); out.push(F(s, '<b>5. Carbonila protonada</b> → perde H⁺.', 4, 'acetonaH')); }
  { const s = new S(); carb(s); tag(s, 2.9, 0, '+ 2 CH₃OH', 'prod', 15); out.push(F(s, '<b>6. Carbonila regenerada.</b> Global: R₂C(OCH₃)₂ + H₂O ⇌ R₂C=O + 2 CH₃OH (H₃O⁺). Em <b>base</b>, não há como ativar o OR como grupo de saída: o cetal é estável.', 5, 'acetona')); }
  return out;
}

/* ===================================================================
 * Aminas: imina (Y = CH₃, OH, NH₂) e enamina
 * =================================================================== */
export function imineFrames(Y = 'CH₃', full = true) {
  const out = [], yl = Y, prodK = { 'CH₃': 'imina', OH: 'oxima', 'NH₂': 'hidrazona' }[Y];
  { const s = new S(); const A = carb(s); const a = acid(s, 2.4, -1.9, 180); s.arrow({ lp: [A.O, 45] }, { a: a.H, ang: 180 }, -0.4, 'm'); s.arrow({ b: [a.H, a.O] }, { a: a.O, ang: 90 }, 0.6, 'm'); out.push(F(s, '<b>1. Ativação</b> (catálise ácida moderada): protonação do O carbonílico.', 0, 'acetona')); }
  { const s = new S(); const A = carb(s, { prot: true }); const n = s.a(-2.6, -0.9, 'N', { cls: 'nu', lp: [0] }); s.br(n, 100, 'H', 1, {}, 0.95); s.br(n, 160, 'H', 1, {}, 0.95); s.br(n, 240, yl, 1, G, 1.0); s.arrow({ lp: [n, 0] }, { a: A.c, ang: 165 }, -0.35, 'm'); s.arrow({ b: [A.c, A.O] }, { a: A.O, ang: 0 }, 0.5, 'm'); out.push(F(s, `<b>2. Ataque do nitrogênio</b> (par livre de ${Y === 'CH₃' ? 'CH₃NH₂' : Y === 'OH' ? 'NH₂OH' : 'NH₂NH₂'}) ao carbono.`, 1, 'acetonaH')); }
  { const s = new S(); const T = tet(s, ['OH', { cls: 'oxy' }], ['N', { cls: 'nu', chg: '+' }]); const h = s.br(T.L, 120, 'H', 1, { cls: 'hb' }, 0.95); s.br(T.L, 200, 'H', 1, {}, 0.95); s.br(T.L, 260, yl, 1, G, 1.0); const w = water(s, -3.0, -1.7, 0); s.arrow({ lp: [w, 0] }, { a: h, ang: 180 }, -0.35, 'm'); s.arrow({ b: [h, T.L] }, { a: T.L, ang: 30 }, 0.6, 'm'); out.push(F(s, '<b>3. Transferência de próton:</b> o N⁺–H é desprotonado.', 2, 'carbinolamina')); }
  { const s = new S(); const T = tet(s, ['O', { cls: 'oxy', lp: [45, 135] }], ['N', { cls: 'nu', lp: [270] }]); s.br(T.T, 150, 'H', 1, {}, 0.95); s.br(T.L, 120, 'H', 1, {}, 0.95); s.br(T.L, 210, yl, 1, G, 1.0); const a = acid(s, 2.4, -2.2, 180); s.arrow({ lp: [T.T, 45] }, { a: a.H, ang: 180 }, -0.4, 'm'); s.arrow({ b: [a.H, a.O] }, { a: a.O, ang: 90 }, 0.6, 'm'); out.push(F(s, `<b>4. ${Y === 'CH₃' ? 'Carbinolamina' : 'Intermediário tetraédrico (tipo carbinolamina)'}</b> (OH e N no mesmo carbono — análoga ao hemiacetal). <b>5. Protonação do OH</b> → bom grupo de saída (H₂O).`, 3, 'carbinolamina')); }
  { const s = new S(); const c = s.a(0, 0, '', { halo: 'v' }); const O2 = s.br(c, 90, 'OH₂', 1, { cls: 'oxy', chg: '+' }, 1.2); const N = s.br(c, 180, 'N', 1, { cls: 'nu', lp: [90] }, 1.2); s.br(N, 225, 'H', 1, {}, 0.95); s.br(N, 150, yl, 1, G, 1.05); s.br(c, 270, R1, 'w', G, 1.05); s.br(c, 0, R2, 'h', G, 1.15);
    s.arrow({ lp: [N, 90] }, { b: [c, N] }, -0.9, 'm'); s.arrow({ b: [c, O2] }, { a: O2, ang: 0 }, -0.6, 'm'); out.push(F(s, '<b>6. Perda de água</b>, empurrada pelo par do nitrogênio (forma-se a ligação π C=N⁺).', 4, 'carbinolamina')); }
  { const s = new S(); const c = s.a(0, 0, '', { halo: 'v' }); const N = s.br(c, 180, 'N', 2, { cls: 'nu', chg: '+' }, 1.2); const h = s.br(N, 120, 'H', 1, { cls: 'hb' }, 0.95); s.br(N, 225, yl, 1, G, 1.05); s.br(c, 300, R1, 1, G); s.br(c, 60, R2, 1, G); s.t(1.0, 1.85, `íon imínio: R₂C=N⁺H${Y === 'CH₃' ? 'CH₃' : '–' + Y} ↔ R₂C⁺–NH${Y === 'CH₃' ? 'CH₃' : '–' + Y}`, 'cond', 13);
    const w = water(s, -2.6, -2.4, 0); s.arrow({ lp: [w, 0] }, { a: h, ang: 135 }, -0.3, 'm'); s.arrow({ b: [h, N] }, { b: [c, N] }, 0.8, 'm'); out.push(F(s, '<b>7. Íon imínio</b> (C=N⁺; ressonância com C⁺–N). <b>8. Desprotonação do N–H</b>: o par da ligação N–H fica no N.', 5, 'iminio')); }
  { const s = new S(); const c = s.a(0, 0, '', { halo: 'g' }); const N = s.br(c, 180, 'N', 2, { cls: 'prod', lp: [120] }, 1.2); s.br(N, 225, yl, 1, G, 1.05); s.br(c, 300, R1, 1, G); s.br(c, 60, R2, 1, G); tag(s, 2.4, 0, '+ H₂O  (⇌)'); out.push(F(s, `<b>9. ${Y === 'CH₃' ? 'Imina' : Y === 'OH' ? 'Oxima' : 'Hidrazona'}</b> (C=N${Y === 'CH₃' ? '–R' : '–' + Y}). Reação reversível: remover água favorece o produto; excesso de água + H⁺ hidrolisa.`, 6, prodK)); }
  return full ? out : [out[1], out[3], out[5], out[6]];
}
export function enamineFrames() {
  const out = [];
  { const s = new S(); const A = carb(s, { prot: true, r2: 'CH₂R' }); const n = s.a(-2.6, -0.9, 'N', { cls: 'nu', lp: [0] }); s.br(n, 100, 'H', 1, {}, 0.95); s.br(n, 160, 'R', 1, G, 1.0); s.br(n, 240, 'R', 1, G, 1.0); s.arrow({ lp: [n, 0] }, { a: A.c, ang: 165 }, -0.35, 'm'); s.arrow({ b: [A.c, A.O] }, { a: A.O, ang: 0 }, 0.5, 'm'); out.push(F(s, '<b>1–2. Ativação e ataque</b> da amina secundária R₂NH ao C carbonílico ativado.', 0, 'acetonaH')); }
  { const s = new S(); tet(s, ['OH', { cls: 'oxy' }], ['NR₂', { cls: 'nu' }], { r2: 'CH₂R' }); tag(s, 3.1, 0, '(após transferências de H⁺)'); out.push(F(s, '<b>3. Carbinolamina</b> (OH e NR₂ no mesmo carbono).', 2, 'carbinolamina')); }
  { const s = new S(); const c = s.a(0, 0, '', { halo: 'v' }); const O2 = s.br(c, 90, 'OH₂', 1, { cls: 'oxy', chg: '+' }, 1.2); const N = s.br(c, 180, 'N', 1, { cls: 'nu', lp: [90] }, 1.2); s.br(N, 225, 'R', 1, G); s.br(N, 135, 'R', 1, G); s.br(c, 270, R1, 'w', G, 1.05); s.br(c, 0, 'CH₂R', 'h', G, 1.25);
    s.arrow({ lp: [N, 90] }, { b: [c, N] }, -0.9, 'm'); s.arrow({ b: [c, O2] }, { a: O2, ang: 0 }, -0.6, 'm'); out.push(F(s, '<b>4. Desidratação:</b> OH protonado sai como H₂O, empurrado pelo par do N.', 3, 'carbinolamina')); }
  { const s = new S(); const c = s.a(0, 0, '', { halo: 'v' }); const N = s.br(c, 180, 'N', 2, { cls: 'nu', chg: '+' }, 1.2); s.br(N, 120, 'R', 1, G); s.br(N, 240, 'R', 1, G); s.br(c, 300, R1, 1, G); const ca = s.br(c, 60, '', 1, {}, 1.1); const h = s.br(ca, 90, 'H', 1, { cls: 'hb' }, 0.95); s.br(ca, 0, 'R', 1, G, 1.0);
    const w = water(s, 2.6, -2.1, 180); s.arrow({ lp: [w, 180] }, { a: h, ang: 0 }, 0.35, 'm'); s.arrow({ b: [ca, h] }, { b: [c, ca] }, 0.7, 'm'); s.arrow({ b: [c, N] }, { a: N, ang: 270 }, 0.6, 'm');
    s.t(-0.5, 1.9, 'íon imínio: sem N–H para perder → remove-se o H do carbono α', 'cond', 13); out.push(F(s, '<b>5. Íon imínio R₂C=N⁺R₂</b>: o N não tem H. A base remove um <b>H do carbono α</b>; o par C–H forma a C=C e o par π C=N⁺ vai para o N.', 4, 'iminioPir')); }
  { const s = new S(); const c = s.a(0, 0, '', { halo: 'g' }); const N = s.br(c, 180, 'N', 1, { cls: 'prod', lp: [90] }, 1.2); s.br(N, 120, 'R', 1, G); s.br(N, 240, 'R', 1, G); s.br(c, 300, R1, 1, G); const ca = s.br(c, 60, '', 2, {}, 1.1); s.br(ca, 90, 'H', 1, {}, 0.95); s.br(ca, 0, 'R', 1, G, 1.0); tag(s, 2.6, 0.9, '+ H₂O  (⇌)'); out.push(F(s, '<b>6. Enamina</b> (C=C–NR₂: “ene” + “amina”). Reversível: água/H⁺ regeneram a carbonila.', 5, 'enamina')); }
  return out;
}

/* ===================================================================
 * Cianoidrina
 * =================================================================== */
export const cyanoFrames = () => baseFrames({ lab: 'NC', name: '⁻C≡N (o carbono do cianeto)', k: 'alcoxidoCN', prod: 'cianoAcetona', HA: 'HCN' });

/* ===================================================================
 * Tioacetal (resumo)
 * =================================================================== */
export function thioFrames() {
  const mk = (cap, en, k3, build) => { const s = new S(); build(s); return F(s, cap, en, k3); };
  return [
    mk('<b>1.</b> Carbonila + HS–CH₂CH₂–SH, catalisador ácido (de Brønsted ou de Lewis).', 0, 'cicloexanona', (s) => { carb(s); s.t(3.2, -0.4, '+ HS–CH₂CH₂–SH', 'cond', 15); }),
    mk('<b>2.</b> Ataque de um S (bom nucleófilo) ao C ativado → hemitioacetal (OH e SR no mesmo C).', 2, 'cicloexanona', (s) => tet(s, ['OH', { cls: 'oxy' }], ['S', { cls: 'nu' }])),
    mk('<b>3.</b> OH protonado sai como H₂O (assistido pelo par do S) → íon tiocarbênio (C=S⁺).', 3, 'cicloexanona', (s) => { const c = s.a(0, 0, '', { halo: 'v' }); const Sx = s.br(c, 180, 'S', 2, { cls: 'nu', chg: '+' }, 1.25); s.br(Sx, 135, '(CH₂)₂SH', 1, G, 1.4); s.br(c, 300, R1, 1, G); s.br(c, 60, R2, 1, G); }),
    mk('<b>4.</b> Ataque intramolecular do segundo S → <b>tiocetal cíclico</b> (1,3-ditiolano) + H₂O.', 5, 'ditiolano', (s) => { const c = s.a(0, 0, '', { halo: 'g' }); const s1 = s.br(c, 135, 'S', 1, { cls: 'prod' }, 1.2), s2 = s.br(c, 45, 'S', 1, { cls: 'prod' }, 1.2); const a = s.br(s1, 70, '', 1, {}, 1.0), b = s.br(s2, 110, '', 1, {}, 1.0); s.b(a, b, 1); s.br(c, 240, R1, 1, G); s.br(c, 300, R2, 1, G); }),
  ];
}

/* ===================================================================
 * Wittig
 * =================================================================== */
const ph3P = (s, x, y, o = {}) => s.a(x, y, 'PPh₃', Object.assign({ cls: 'cr' }, o));
export function ylideFormation() {
  const out = [];
  { const s = new S(); const p = s.a(-2.2, 0, 'Ph₃P', { cls: 'cr', lp: [0] }); const c = s.a(0, 0, 'CH₃', { halo: 'o' }); const br = s.br(c, 0, 'Br', 1, { cls: 'red' }, 1.3); s.arrow({ lp: [p, 0] }, { a: c, ang: 180 }, -0.3, 'm'); s.arrow({ b: [c, br] }, { a: br, ang: 270 }, 0.6, 'm'); out.push(F(s, '<b>1. SN2:</b> a trifenilfosfina (nucleófilo) ataca o haleto de alquila → sal de fosfônio.', 0, 'fosfonio')); }
  { const s = new S(); const p = s.a(0, 0, 'Ph₃P', { cls: 'cr', chg: '+' }); const c = s.br(p, 0, 'C', 1, {}, 1.4); const h = s.br(c, 60, 'H', 1, { cls: 'hb' }, 0.95); s.br(c, 300, 'H', 1, {}, 0.95); s.br(c, 0, 'H', 1, {}, 0.95); const b = s.a(2.9, -1.6, 'Bu', { cls: 'base', chg: '−', lp: [180] }); s.t(-0.4, 1.1, 'Br⁻', 'cond', 14);
    s.arrow({ lp: [b, 180] }, { a: h, ang: 30 }, 0.3, 'm'); s.arrow({ b: [c, h] }, { a: c, ang: 270 }, -0.8, 'm'); out.push(F(s, '<b>2. Base forte</b> (ex.: BuLi) remove um H do carbono vizinho ao P⁺ (ácido pela carga positiva adjacente).', 1, 'fosfonio')); }
  { const s = new S(); const p = s.a(0, 0, 'Ph₃P', { cls: 'cr', chg: '+' }); s.br(p, 0, 'CH₂', 1, { cls: 'nu', chg: '−', lp: [270] }, 1.6); s.t(3.4, 0, '↔', 'cond', 22); const p2 = s.a(4.6, 0, 'Ph₃P', { cls: 'cr' }); s.br(p2, 0, 'CH₂', 2, { cls: 'nu' }, 1.6); out.push(F(s, '<b>3. Ilídeo de fósforo:</b> Ph₃P⁺–CH₂⁻ ↔ Ph₃P=CH₂. O carbono tem caráter <b>nucleofílico</b> (carbânion estabilizado pelo P⁺ adjacente).', 2, 'ilideo')); }
  return out;
}
export function wittigFrames() {
  const out = [];
  { const s = new S(); const A = carb(s); const p = s.a(-3.3, -2.0, 'Ph₃P', { cls: 'cr', chg: '+' }); const y = s.br(p, 0, 'CH₂', 1, { cls: 'nu', chg: '−', lp: [270] }, 1.5); s.arrow({ lp: [y, 270] }, { a: A.c, ang: 150 }, 0.35, 'm'); s.arrow({ b: [A.c, A.O] }, { a: A.O, ang: 0 }, 0.5, 'm'); out.push(F(s, '<b>1. O carbono nucleofílico do ilídeo</b> interage com o carbono carbonílico (nova ligação C–C).', 0, 'acetona')); }
  { const s = new S(); const c = s.a(0, 0, '', { halo: 'v' }); const O = s.br(c, 90, 'O', 1, { cls: 'oxy', chg: '−', lp: [30, 150] }, 1.2); const cy = s.br(c, 180, 'CH₂', 1, { cls: 'grey' }, 1.3); const p = s.br(cy, 90, 'PPh₃', 1, { cls: 'cr', chg: '+' }, 1.2); s.br(c, 270, R1, 'w', G, 1.05); s.br(c, 0, R2, 'h', G, 1.15);
    s.arrow({ lp: [O, 150] }, { a: p, ang: 0 }, 0.5, 'm'); out.push(F(s, '<b>2. Betaína</b> (O⁻ e P⁺ — representação didática). O O⁻ liga-se ao P⁺ formando o anel. <i>Em muitas reações (sem sais de Li), o oxafosfetano parece formar-se diretamente, por cicloadição.</i>', 1, 'betaina')); }
  { const s = new S(); const c = s.a(0, 0, '', { halo: 'v' }); const O = s.br(c, 90, 'O', 1, { cls: 'oxy' }, 1.2); const cy = s.br(c, 180, 'CH₂', 1, { cls: 'grey' }, 1.25); const p = s.a(-1.25, -1.2, 'PPh₃', { cls: 'cr' }); s.b(cy, p, 1); s.b(p, O, 1); s.br(c, 300, R1, 1, G); s.br(c, 30, R2, 1, G);
    s.arrow({ b: [cy, p] }, { b: [c, cy] }, -0.9, 'm'); s.arrow({ b: [c, O] }, { b: [O, p] }, -0.8, 'm'); out.push(F(s, '<b>3. Oxafosfetano</b> (anel de 4 membros C–C–P–O). O anel colapsa: o par C–P forma a π C=C e o par C–O forma a π P=O.', 2, 'oxafosfetano')); }
  { const s = new S(); const c = s.a(0, 0, '', { halo: 'g' }); s.br(c, 180, 'CH₂', 2, { cls: 'prod' }, 1.3); s.br(c, 300, R1, 1, G); s.br(c, 60, R2, 1, G); s.t(3.2, 0, '+  Ph₃P=O', 'cr', 16); out.push(F(s, '<b>4. Alceno + óxido de trifenilfosfina.</b> A forte ligação <b>P=O</b> é um importante componente da força motriz. C=O foi substituída por C=C (olefinação — não é redução).', 3, 'metilpropeno')); }
  return out;
}

/* ===================================================================
 * Horner–Wadsworth–Emmons
 * =================================================================== */
export function hweFrames() {
  const out = [];
  { const s = new S(); const P = s.a(0, 0, 'P', { cls: 'cr' }); s.br(P, 90, 'O', 2, { cls: 'oxy2' }, 1.1); s.br(P, 150, 'EtO', 1, G, 1.2); s.br(P, 210, 'EtO', 1, G, 1.2); const c = s.br(P, 0, '', 1, {}, 1.2); const h = s.br(c, 90, 'H', 1, { cls: 'hb' }, 0.95); s.br(c, 0, 'CO₂Et', 1, { cls: 'oxy2' }, 1.35); const b = s.a(2.6, -2.2, 'EtO', { cls: 'base', chg: '−', lp: [180] });
    s.arrow({ lp: [b, 180] }, { a: h, ang: 30 }, 0.3, 'm'); s.arrow({ b: [c, h] }, { a: c, ang: 270 }, -0.9, 'm'); out.push(F(s, '<b>1. Desprotonação do fosfonato</b> (base, ex.: NaH ou EtO⁻): o C–H entre P=O e C=O é ácido.', 0, 'fosfonato')); }
  { const s = new S(); const P = s.a(-2.8, -1.8, 'P', { cls: 'cr' }); s.br(P, 90, 'O', 2, { cls: 'oxy2' }, 1.1); s.br(P, 180, '(EtO)₂', 1, G, 1.3); const cn = s.br(P, 0, 'CH', 1, { cls: 'nu', chg: '−', lp: [270] }, 1.3); s.br(cn, 60, 'CO₂Et', 1, { cls: 'oxy2' }, 1.3);
    const c = s.a(0, 0, '', { halo: 'o' }); const O = s.br(c, 270, 'O', 2, { cls: 'oxy', lp: [225, 315] }, 1.2); s.br(c, 30, 'Ph', 1, G); s.br(c, 150, 'H', 1, {}, 0.95);
    s.arrow({ lp: [cn, 270] }, { a: c, ang: 135 }, 0.3, 'm'); s.arrow({ b: [c, O] }, { a: O, ang: 0 }, -0.5, 'm'); out.push(F(s, '<b>2. Carbânion estabilizado</b> (ressonância com o C=O do éster) ataca o aldeído (aqui, benzaldeído).', 1, 'fosfonatoAnion')); }
  { const s = new S(); const c = s.a(0, 0, '', { halo: 'v' }); const O = s.br(c, 90, 'O', 1, { cls: 'oxy', chg: '−', lp: [30] }, 1.2); const cy = s.br(c, 180, '', 1, {}, 1.2); s.br(cy, 250, 'CO₂Et', 1, { cls: 'oxy2' }, 1.2); const P = s.br(cy, 90, 'P(O)(OEt)₂', 1, { cls: 'cr' }, 1.2); s.br(c, 0, 'Ph', 1, G); s.br(c, 290, 'H', 1, {}, 0.95);
    s.arrow({ lp: [O, 150] }, { a: P, ang: 0 }, 0.5, 'm'); out.push(F(s, '<b>3. Alcóxido → oxafosfetano:</b> o O⁻ ataca o P, formando o anel de 4 membros.', 2, 'fosfonatoAnion')); }
  { const s = new S(); const c = s.a(0, 0, '', { halo: 'v' }); const O = s.br(c, 90, 'O', 1, { cls: 'oxy' }, 1.2); const cy = s.br(c, 180, '', 1, {}, 1.2); s.br(cy, 250, 'CO₂Et', 1, { cls: 'oxy2' }, 1.2); const P = s.a(-1.2, -1.2, 'P(OEt)₂', { cls: 'cr' }); s.b(cy, P, 1); s.b(P, O, 1); s.br(c, 0, 'Ph', 1, G); s.br(c, 290, 'H', 1, {}, 0.95);
    s.arrow({ b: [cy, P] }, { b: [c, cy] }, -0.9, 'm'); s.arrow({ b: [c, O] }, { b: [O, P] }, -0.8, 'm'); out.push(F(s, '<b>4. Eliminação</b> (colapso do oxafosfetano): formam-se C=C e P=O.', 3, 'cinamatoE')); }
  { const s = new S(); const a = s.a(0, 0, '', { halo: 'g' }); const b = s.br(a, 330, '', 2, { halo: 'g' }, 1.1); s.br(a, 210, 'EtO₂C', 1, { cls: 'oxy2' }, 1.2); s.br(b, 30, 'Ph', 1, G, 1.0); s.br(a, 90, 'H', 1, {}, 0.9); s.br(b, 270, 'H', 1, {}, 0.9); s.t(3.6, 0.3, '+ (EtO)₂PO₂⁻ (hidrossolúvel)', 'cr', 14); out.push(F(s, '<b>5. Alceno, majoritariamente E</b> (com fosfonatos estabilizados, em condições típicas) + fosfato dialquílico solúvel em água — separação fácil.', 4, 'cinamatoE')); }
  return out;
}

/* ===================================================================
 * Glicose: Fischer e Haworth
 * =================================================================== */
export function fischer(o = {}) {
  const s = new S(); const y0 = 0, dy = 1.15, side = ['', 'R', 'L', 'R', 'R']; // D-glicose: C2 OH dir., C3 esq., C4 dir., C5 dir.
  const C = []; for (let k = 0; k < 6; k++) C.push(s.a(0, y0 + k * dy, k === 5 ? 'CH₂OH' : '', k === 0 && o.hlC1 ? { halo: 'o' } : k === 4 && o.hlC5 ? { halo: 'c' } : k === 5 ? { cls: 'oxy2' } : {}));
  for (let k = 0; k < 5; k++) s.b(C[k], C[k + 1], 1);
  const o1 = s.br(C[0], 30, 'O', 2, { cls: 'oxy' }, 0.95); s.br(C[0], 150, 'H', 1, {}, 0.9); void o1;
  const oh = [];
  for (let k = 1; k <= 4; k++) { const r = side[k] === 'R'; const O = s.br(C[k], r ? 0 : 180, 'OH', 1, { cls: k === 4 ? 'nu' : 'oxy2' }, 1.0); s.br(C[k], r ? 180 : 0, 'H', 1, {}, 0.9); oh.push(O); }
  ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'].forEach((t, k) => s.t(-1.9, y0 + k * dy, t, 'cond', 12));
  if (o.arrow) s.arrow({ a: oh[3], ang: 90 }, { a: C[0], ang: 0 }, 0.9, 'm');
  return s;
}
export function haworth(anomer = 'b', o = {}) {
  // anel: O5 (posterior direito), C1 (direita), C2, C3 (frente), C4 (esquerda), C5 (posterior esquerdo)
  const s = new S(); const P = { O5: [1.1, -0.7], C1: [2.0, 0.1], C2: [1.3, 0.9], C3: [-0.3, 0.9], C4: [-1.0, 0.1], C5: [-0.1, -0.7] };
  const id = {}; Object.entries(P).forEach(([k, [x, y]]) => { id[k] = s.a(x, y, k === 'O5' ? 'O' : '', k === 'O5' ? { cls: 'nu' } : k === 'C1' ? { halo: o.hlC1 === false ? undefined : 'o' } : {}); });
  [['O5', 'C1'], ['C1', 'C2'], ['C2', 'C3'], ['C3', 'C4'], ['C4', 'C5'], ['C5', 'O5']].forEach(([a, b]) => s.b(id[a], id[b], ['C2', 'C3'].includes(a) && b !== 'C4' ? 1 : 1));
  const up = (k, lab, cls) => { const [x, y] = P[k]; const t = s.a(x, y - 0.9, lab, cls ? { cls } : {}); s.b(id[k], t, 1); return t; };
  const dn = (k, lab, cls) => { const [x, y] = P[k]; const t = s.a(x, y + 0.9, lab, cls ? { cls } : {}); s.b(id[k], t, 1); return t; };
  // D-glicose: C5 CH2OH para cima; C4 OH baixo; C3 OH cima; C2 OH baixo; C1 OH: β cima, α baixo
  up('C5', 'CH₂OH', 'grey'); dn('C4', 'OH', 'oxy2'); up('C4', 'H'); up('C3', 'OH', 'oxy2'); dn('C3', 'H'); dn('C2', 'OH', 'oxy2'); up('C2', 'H');
  if (anomer === 'b') { up('C1', o.c1 || 'OH', o.c1cls || 'nu'); dn('C1', 'H'); } else { dn('C1', o.c1 || 'OH', o.c1cls || 'nu'); up('C1', 'H'); }
  s.t(2.75, 0.15, 'C1', 'cond', 12);
  return s;
}
export { SIMPL };
