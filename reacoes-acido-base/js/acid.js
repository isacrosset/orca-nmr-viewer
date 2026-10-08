/*
 * acid.js — dados de acidez (pKa aproximados, em água quando aplicável;
 * valores muito altos ou muito baixos são estimativas e dependem do meio),
 * pares de comparação com o fator predominante e estruturas com H explícitos
 * para o construtor de base conjugada.
 */
import { S } from './chem2d.js';

/* k: chave · f: ácido · b: base conjugada · pKa · atom: átomo que fica com a carga */
export const ACIDS = [
  { k: 'HI', f: 'HI', b: 'I⁻', pKa: -10, atom: 'I', cls: 'haleto' },
  { k: 'HBr', f: 'HBr', b: 'Br⁻', pKa: -9, atom: 'Br', cls: 'haleto' },
  { k: 'HCl', f: 'HCl', b: 'Cl⁻', pKa: -7, atom: 'Cl', cls: 'haleto' },
  { k: 'H3O', f: 'H₃O⁺', b: 'H₂O', pKa: -1.7, atom: 'O', cls: 'oxônio' },
  { k: 'CCl3COOH', f: 'Cl₃CCOOH', b: 'Cl₃CCOO⁻', pKa: 0.7, atom: 'O', cls: 'carboxílico' },
  { k: 'CHCl2COOH', f: 'Cl₂CHCOOH', b: 'Cl₂CHCOO⁻', pKa: 1.3, atom: 'O', cls: 'carboxílico' },
  { k: 'ClCH2COOH', f: 'ClCH₂COOH', b: 'ClCH₂COO⁻', pKa: 2.9, atom: 'O', cls: 'carboxílico' },
  { k: 'HF', f: 'HF', b: 'F⁻', pKa: 3.2, atom: 'F', cls: 'haleto' },
  { k: 'Cl3prop', f: 'ClCH₂CH₂COOH', b: 'ClCH₂CH₂COO⁻', pKa: 4.1, atom: 'O', cls: 'carboxílico' },
  { k: 'Cl4but', f: 'ClCH₂CH₂CH₂COOH', b: 'ClCH₂CH₂CH₂COO⁻', pKa: 4.5, atom: 'O', cls: 'carboxílico' },
  { k: 'AcOH', f: 'CH₃COOH', b: 'CH₃COO⁻', pKa: 4.76, atom: 'O', cls: 'carboxílico' },
  { k: 'H2S', f: 'H₂S', b: 'HS⁻', pKa: 7.0, atom: 'S', cls: 'tiol' },
  { k: 'NH4', f: 'NH₄⁺', b: 'NH₃', pKa: 9.25, atom: 'N', cls: 'amônio' },
  { k: 'PhOH', f: 'C₆H₅OH (fenol)', b: 'C₆H₅O⁻ (fenóxido)', pKa: 10.0, atom: 'O', cls: 'fenol' },
  { k: 'MeSH', f: 'CH₃SH', b: 'CH₃S⁻', pKa: 10.3, atom: 'S', cls: 'tiol' },
  { k: 'CF3CH2OH', f: 'CF₃CH₂OH', b: 'CF₃CH₂O⁻', pKa: 12.4, atom: 'O', cls: 'álcool' },
  { k: 'MeOH', f: 'CH₃OH', b: 'CH₃O⁻', pKa: 15.5, atom: 'O', cls: 'álcool' },
  { k: 'H2O', f: 'H₂O', b: 'HO⁻', pKa: 15.7, atom: 'O', cls: 'água' },
  { k: 'EtOH', f: 'CH₃CH₂OH', b: 'CH₃CH₂O⁻', pKa: 16, atom: 'O', cls: 'álcool' },
  { k: 'tBuOH', f: '(CH₃)₃COH', b: '(CH₃)₃CO⁻', pKa: 18, atom: 'O', cls: 'álcool' },
  { k: 'cHexOH', f: 'cicloexanol', b: 'cicloexóxido', pKa: 18, atom: 'O', cls: 'álcool' },
  { k: 'acetone', f: 'CH₃COCH₃ (H α)', b: 'enolato', pKa: 19.2, atom: 'C/O', cls: 'carbonila' },
  { k: 'HCCH', f: 'HC≡CH', b: 'HC≡C⁻', pKa: 25, atom: 'C (sp)', cls: 'alcino' },
  { k: 'H2', f: 'H₂', b: 'H⁻', pKa: 35, atom: 'H', cls: 'hidrogênio' },
  { k: 'EtNH2', f: 'CH₃CH₂NH₂', b: 'CH₃CH₂NH⁻', pKa: 36, atom: 'N', cls: 'amina' },
  { k: 'NH3', f: 'NH₃', b: 'NH₂⁻', pKa: 38, atom: 'N', cls: 'amônia' },
  { k: 'C2H4', f: 'CH₂=CH₂', b: 'CH₂=CH⁻', pKa: 44, atom: 'C (sp²)', cls: 'alceno' },
  { k: 'CH4', f: 'CH₄', b: 'CH₃⁻', pKa: 48, atom: 'C (sp³)', cls: 'alcano' },
  { k: 'C2H6', f: 'CH₃CH₃', b: 'CH₃CH₂⁻', pKa: 50, atom: 'C (sp³)', cls: 'alcano' },
];
export const A = Object.fromEntries(ACIDS.map((a) => [a.k, a]));
export const fmtP = (x) => (x < 0 ? '−' : '') + String(Math.abs(x)).replace('.', ',');

export const FACTORS = [
  ['res', 'ressonância'], ['en', 'eletronegatividade'], ['size', 'tamanho atômico'], ['hyb', 'hibridização'], ['ind', 'efeito indutivo'], ['bond', 'força/comprimento da ligação H–A'],
];
export const FNAME = Object.fromEntries(FACTORS);

/** pares de comparação: ácido mais forte = a */
export const PAIRS = [
  { a: 'AcOH', b: 'EtOH', f: ['res'], why: 'Nos dois a carga fica em O. No acetato ela se distribui por <b>ressonância</b> entre dois O equivalentes; no etóxido fica concentrada em um O.' },
  { a: 'HCCH', b: 'C2H6', f: ['hyb'], why: 'Carga no C nos dois. No acetileto o par está em orbital <b>sp</b> (50% s), mais próximo do núcleo; no etil-ânion, em sp³ (25% s).' },
  { a: 'H2O', b: 'NH3', f: ['en'], why: 'Mesmo período: O é mais <b>eletronegativo</b> que N, logo HO⁻ acomoda melhor a carga que NH₂⁻.' },
  { a: 'HI', b: 'HF', f: ['size', 'bond'], why: 'Mesmo grupo: o I é muito maior; a carga de I⁻ se espalha em grande volume e a ligação H–I é longa e fraca. Aqui o <b>tamanho</b> vence a eletronegatividade.' },
  { a: 'CCl3COOH', b: 'AcOH', f: ['ind'], why: 'Mesmo tipo de base (carboxilato com ressonância). Os três Cl retiram densidade eletrônica por <b>efeito indutivo</b> e estabilizam a carga.' },
  { a: 'ClCH2COOH', b: 'Cl3prop', f: ['ind'], why: 'Efeito indutivo diminui com a <b>distância</b>: Cl no C α estabiliza mais que no C β.' },
  { a: 'PhOH', b: 'cHexOH', f: ['res'], why: 'No fenóxido a carga do O é deslocalizada pelo anel aromático (<b>ressonância</b>); no cicloexóxido não.' },
  { a: 'H2S', b: 'H2O', f: ['size', 'bond'], why: 'Descendo no grupo 16: S é maior que O, a carga em HS⁻ fica mais dispersa e a ligação S–H é mais fraca.' },
  { a: 'CF3CH2OH', b: 'EtOH', f: ['ind'], why: 'Os F (muito eletronegativos) a dois carbonos do O retiram densidade por <b>indução</b>, estabilizando o alcóxido.' },
  { a: 'C2H4', b: 'C2H6', f: ['hyb'], why: 'C sp² (33% s) estabiliza mais a carga que C sp³ (25% s).' },
  { a: 'EtOH', b: 'EtNH2', f: ['en'], why: 'O é mais eletronegativo que N: o alcóxido é mais estável que o amideto.' },
  { a: 'HF', b: 'H2O', f: ['en'], why: 'F é mais eletronegativo que O (mesmo período).' },
  { a: 'MeSH', b: 'MeOH', f: ['size', 'bond'], why: 'S é maior que O: CH₃S⁻ é mais estável e a ligação S–H é mais fraca.' },
  { a: 'CHCl2COOH', b: 'ClCH2COOH', f: ['ind'], why: 'Dois Cl retiram mais densidade que um: indução cumulativa.' },
];

/* ===================================================================
 * Estruturas com H explícitos (construtor de base conjugada)
 * cada H "ácido" tem pKa aproximado e descrição
 * =================================================================== */
const ang = (d) => d * Math.PI / 180;
function addH(s, i, degs, cls) { return degs.map((d) => s.a(s.atoms[i][0] + Math.cos(ang(d)) * 0.85, s.atoms[i][1] - Math.sin(ang(d)) * 0.85, 'H', cls ? { cls } : {})); }
const bondAll = (s, i, hs) => hs.forEach((x) => s.b(i, x));
export const CB = {
  etanol: () => {
    const s = new S(); const c1 = s.a(0, 0, 'C'), c2 = s.a(1.1, 0, 'C'), O = s.a(2.2, 0, 'O', { lp: [90, 270] }); s.b(c1, c2); s.b(c2, O);
    const h1 = addH(s, c1, [90, 180, 270]); bondAll(s, c1, h1); const h2 = addH(s, c2, [90, 270]); bondAll(s, c2, h2); const hO = addH(s, O, [0]); bondAll(s, O, hO);
    const info = {}; hO.forEach((x) => { info[x] = { pKa: 16, on: O, d: 'H do O–H' }; }); h2.forEach((x) => { info[x] = { pKa: 50, on: c2, d: 'H de C sp³ (CH₂)' }; }); h1.forEach((x) => { info[x] = { pKa: 50, on: c1, d: 'H de C sp³ (CH₃)' }; });
    return { s, info, name: 'etanol', res: null };
  },
  acetico: () => {
    const s = new S(); const c1 = s.a(0, 0, 'C'), c2 = s.a(1.1, 0, 'C'), O1 = s.a(1.65, -0.9, 'O', { lp: [90, 30] }), O2 = s.a(1.65, 0.9, 'O', { lp: [270, 210] }); s.b(c1, c2); s.b(c2, O1, 2); s.b(c2, O2);
    const h1 = addH(s, c1, [90, 180, 270]); bondAll(s, c1, h1); const hO = addH(s, O2, [0]); bondAll(s, O2, hO);
    const info = {}; hO.forEach((x) => { info[x] = { pKa: 4.76, on: O2, d: 'H do O–H (carboxila)', res: [O1, O2] }; }); h1.forEach((x) => { info[x] = { pKa: 25, on: c1, d: 'H α (C sp³ vizinho à C=O), bem menos ácido' }; });
    return { s, info, name: 'ácido acético' };
  },
  propino: () => {
    const s = new S(); const h0 = s.a(-0.9, 0, 'H'), c1 = s.a(0, 0, 'C'), c2 = s.a(1.2, 0, 'C'), c3 = s.a(2.3, 0, 'C'); s.b(h0, c1); s.b(c1, c2, 3); s.b(c2, c3);
    const h3 = addH(s, c3, [90, 0, 270]); bondAll(s, c3, h3);
    const info = { [h0]: { pKa: 25, on: c1, d: 'H do C sp (alcino terminal)' } }; h3.forEach((x) => { info[x] = { pKa: 50, on: c3, d: 'H de C sp³ (CH₃)' }; });
    return { s, info, name: 'propino' };
  },
  cloroacetico: () => {
    const s = new S(); const Cl = s.a(-1.0, 0, 'Cl', { lp: [90, 180, 270] }), c1 = s.a(0, 0, 'C'), c2 = s.a(1.1, 0, 'C'), O1 = s.a(1.65, -0.9, 'O', { lp: [90, 30] }), O2 = s.a(1.65, 0.9, 'O', { lp: [270, 210] }); s.b(Cl, c1); s.b(c1, c2); s.b(c2, O1, 2); s.b(c2, O2);
    const h1 = addH(s, c1, [90, 270]); bondAll(s, c1, h1); const hO = addH(s, O2, [0]); bondAll(s, O2, hO);
    const info = {}; hO.forEach((x) => { info[x] = { pKa: 2.9, on: O2, d: 'H do O–H (carboxila)', res: [O1, O2] }; }); h1.forEach((x) => { info[x] = { pKa: 20, on: c1, d: 'H do CH₂ (bem menos ácido)' }; });
    return { s, info, name: 'ácido cloroacético' };
  },
  metilamina: () => {
    const s = new S(); const c1 = s.a(0, 0, 'C'), N = s.a(1.1, 0, 'N', { lp: [90] }); s.b(c1, N);
    const h1 = addH(s, c1, [90, 180, 270]); bondAll(s, c1, h1); const hN = addH(s, N, [-30, 270]); bondAll(s, N, hN);
    const info = {}; hN.forEach((x) => { info[x] = { pKa: 40, on: N, d: 'H do N–H' }; }); h1.forEach((x) => { info[x] = { pKa: 50, on: c1, d: 'H de C sp³' }; });
    return { s, info, name: 'metilamina' };
  },
};
/** gera a base conjugada removendo o H índice hi */
export function removeH(mol, hi) {
  const s0 = mol.s, on = mol.info[hi].on;
  const s = new S();
  const map = {}; s0.atoms.forEach((a, i) => { if (i === hi) return; map[i] = s.a(a[0], a[1], a[2], JSON.parse(JSON.stringify(a[3]))); });
  s0.bonds.forEach((b) => { if (b[0] === hi || b[1] === hi) return; s.b(map[b[0]], map[b[1]], b[2], Object.assign({}, b[3])); });
  const H = s0.atoms[hi], C = s0.atoms[on], deg = Math.round(Math.atan2(-(H[1] - C[1]), H[0] - C[0]) * 180 / Math.PI);
  const t = s.atoms[map[on]][3]; t.chg = '−'; t.lp = (t.lp || []).concat([deg]); t.cls = 'nuc'; t.halo = 'c';
  return { s, on: map[on], map };
}
