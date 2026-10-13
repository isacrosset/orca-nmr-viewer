/*
 * ac2d.js — mecanismos 2D (setas curvas, cargas, transferências de próton
 * explícitas) da química de ácidos carboxílicos e derivados: substituição
 * nucleofílica acílica (aniônica e neutra), SOCl₂, Fischer e hidrólise ácida,
 * saponificação, hidrólises de amidas, aminólise, desidratação de amidas,
 * hidrólises de nitrilas, descarboxilação de β-cetoácidos, ácido + amina,
 * ativação por DCC e estruturas de ressonância.
 * Etapa: { s, cap, en (índice da espécie no perfil), k3 (espécie 3D) }.
 * Ângulos: graus (0 = direita, 90 = cima). Coordenadas em comprimentos de ligação, y para baixo.
 */
import { S } from './chem2d.js';

const G = { cls: 'grey' }, LG = { cls: 'lg' };
const F = (s, cap, en, k3) => ({ s, cap, en, k3 });
const tag = (s, x, y, t, cls = 'cond', fs = 14) => s.t(x, y, t, cls, fs);
export const SIMPL = ' <i class="muted">Representação mecanística simplificada para fins didáticos.</i>';

/* ---------- blocos ---------- */
/** acila trigonal: O em cima, R embaixo à esquerda, Y embaixo à direita */
function acyl(s, Y, o = {}) {
  const c = s.a(0, 0, '', { halo: 'o' });
  const O = s.br(c, 90, 'O', 2, { cls: 'oxy', lp: o.prot ? [150] : [45, 135], chg: o.prot ? '+' : undefined }, 1.2);
  const H = o.prot ? s.br(O, 30, 'H', 1, { cls: 'hb' }, 0.95) : null;
  const R = s.br(c, 210, o.R || 'R', 1, G);
  const y = Array.isArray(Y) ? s.br(c, 330, Y[0], 1, Y[1] || LG, Y[2] || 1.2) : s.br(c, 330, Y, 1, LG, 1.2);
  return { c, O, H, R, y };
}
/** tetraédrico: O (cima), Nu (esquerda), R (baixo, cunha), Y (direita) */
function tet(s, top, nu, Y, o = {}) {
  const c = s.a(0, 0, '', { halo: o.halo || 'v' });
  const T = s.br(c, 90, top[0], 1, top[1] || { cls: 'oxy' }, 1.15);
  const N = s.br(c, 180, nu[0], 1, nu[1] || { cls: 'nu' }, nu[2] || 1.25);
  const R = s.br(c, 270, o.R || 'R', 'w', G, 1.05);
  const y = s.br(c, 0, Y[0], 1, Y[1] || LG, Y[2] || 1.3);
  return { c, T, N, R, y };
}
const acidH = (s, x, y, ang = 180) => { const O = s.a(x, y, 'OH₂', { chg: '+', cls: 'oxy2' }); const H = s.br(O, ang, 'H', 1, { cls: 'hb' }, 0.95); return { O, H }; };
const water = (s, x, y, lp) => s.a(x, y, 'H₂O', { cls: 'base', lp: [lp] });

/* ===================================================================
 * Substituição nucleofílica acílica — nucleófilo aniônico
 * =================================================================== */
export function nasAnion(o = {}) {
  const Y = o.Y || 'Y', nu = o.nu || 'Nu', out = [];
  const yl = o.Ylg || Y + '⁻';
  { const s = new S(); const A = acyl(s, Y); const n = s.a(-2.7, -0.9, nu, { chg: '−', cls: 'nu', lp: [0, 90, 270] }); s.arrow({ lp: [n, 0] }, { a: A.c, ang: 165 }, -0.35, 'm'); s.arrow({ b: [A.c, A.O] }, { a: A.O, ang: 0 }, 0.5, 'm'); out.push(F(s, `<b>1. Ataque:</b> ${o.nuName || nu + '⁻'} doa seu par ao <b>carbono acílico</b> (δ+); o par π da C=O vai para o O.`, 0, o.k0)); }
  { const s = new S(); const T = tet(s, ['O', { cls: 'oxy', chg: '−', lp: [30, 150] }], [nu, { cls: 'nu' }], [Y, LG]); s.arrow({ lp: [T.T, 30] }, { b: [T.c, T.T] }, -0.9, 'm'); s.arrow({ b: [T.c, T.y] }, { a: T.y, ang: 270 }, 0.6, 'm'); out.push(F(s, `<b>2. Intermediário tetraédrico</b> (C sp³, O⁻). <b>Colapso:</b> o par do O⁻ refaz a C=O e a ligação C–${Y} se rompe: sai o <b>grupo de saída</b> (${yl}).`, 1, o.k1)); }
  { const s = new S(); const A = acyl(s, [o.prodLab || nu, { cls: 'prod' }, o.prodLab && o.prodLab.length > 3 ? 1.4 : 1.2]); s.atoms[A.c][3].halo = 'g'; tag(s, 3.0, 0.2, '+  ' + yl, 'lg', 16); out.push(F(s, `<b>3. Produto:</b> a carbonila é regenerada (sp²) — <b>${nu} substituiu ${Y}</b>. ${o.end || ''}`, 2, o.k2)); }
  return out;
}

/* ===================================================================
 * Nucleófilo neutro (H–Nu) com cloreto de acila / anidrido / éster
 * =================================================================== */
export function nasNeutral(o = {}) {
  const Y = o.Y || 'Cl', out = [], nuL = o.nuL || 'O', nuR = o.nuR || 'CH₃', yl = o.Ylg || 'Cl⁻', base = o.base || 'B:';
  const NUH = o.nuName || (nuL === 'N' ? 'a amina' : 'o álcool');
  { const s = new S(); const A = acyl(s, Y); const n = s.a(-2.7, -0.9, nuL, { cls: 'nu', lp: nuL === 'N' ? [0] : [0, 270] }); s.br(n, 120, 'H', 1, {}, 0.95); if (nuL === 'N') s.br(n, 165, o.nuR2 || 'H', 1, o.nuR2 ? G : {}, 0.95); s.br(n, 230, nuR, 1, G, 1.0);
    s.arrow({ lp: [n, 0] }, { a: A.c, ang: 165 }, -0.35, 'm'); s.arrow({ b: [A.c, A.O] }, { a: A.O, ang: 0 }, 0.5, 'm'); out.push(F(s, `<b>1. Ataque:</b> ${NUH} (par isolado do ${nuL}) ataca o carbono acílico; π → O.`, 0, o.k0)); }
  { const s = new S(); const T = tet(s, ['O', { cls: 'oxy', chg: '−', lp: [30, 150] }], [nuL, { cls: 'nu', chg: '+' }, 1.2], [Y, LG]); s.br(T.N, 120, 'H', 1, { cls: 'hb' }, 0.95); if (nuL === 'N') s.br(T.N, 180, o.nuR2 || 'H', 1, o.nuR2 ? G : {}, 0.95); s.br(T.N, 240, nuR, 1, G, 1.0);
    s.arrow({ lp: [T.T, 30] }, { b: [T.c, T.T] }, -0.9, 'm'); s.arrow({ b: [T.c, T.y] }, { a: T.y, ang: 270 }, 0.6, 'm'); out.push(F(s, `<b>2. Intermediário tetraédrico</b> (O⁻ e ${nuL}⁺–H). <b>Colapso:</b> O⁻ refaz a C=O e <b>${yl}</b> sai (${o.lgWhy || 'bom grupo de saída'}).`, 1, o.k1)); }
  { const s = new S(); const c = s.a(0, 0, '', { halo: 'v' }); s.br(c, 90, 'O', 2, { cls: 'oxy' }, 1.2); s.br(c, 330, 'R', 1, G); const n = s.br(c, 210, nuL, 1, { cls: 'nu', chg: '+' }, 1.2); const h = s.br(n, 120, 'H', 1, { cls: 'hb' }, 0.95); if (nuL === 'N') s.br(n, 210, o.nuR2 || 'H', 1, o.nuR2 ? G : {}, 0.95); s.br(n, 270, nuR, 1, G, 1.0);
    const b = s.a(-2.9, -1.9, base, { cls: 'base', lp: [0] }); s.arrow({ lp: [b, 0] }, { a: h, ang: 150 }, -0.3, 'm'); s.arrow({ b: [h, n] }, { a: n, ang: 0 }, 0.7, 'm'); tag(s, 2.2, 0.9, '+ ' + yl, 'lg', 15);
    out.push(F(s, `<b>3. Desprotonação:</b> ${o.baseName || 'uma base (excesso de amina, piridina, Et₃N)'} remove o H⁺ do ${nuL}⁺.`, 2, o.k2)); }
  { const s = new S(); const A = acyl(s, [nuL === 'N' ? (o.nuR2 ? 'N' + o.nuR2 + nuR : 'NH' + nuR) : 'O' + nuR, { cls: 'prod' }, 1.3]); s.atoms[A.c][3].halo = 'g'; tag(s, 3.3, 0.3, o.byprod || '+ BH⁺ + ' + yl, 'cond', 14); out.push(F(s, `<b>4. ${o.prodName || 'Produto'}.</b> ${o.end || ''}`, 3, o.k3)); }
  return out;
}

/* ===================================================================
 * SOCl₂: ácido → cloreto de acila (modelo didático)
 * =================================================================== */
export function socl2Frames() {
  const out = [];
  { const s = new S(); const A = acyl(s, ['O', { cls: 'nu', lp: [300, 0] }, 1.2]); s.br(A.y, 270, 'H', 1, {}, 0.95); const S0 = s.a(2.9, -0.3, 'S', { cls: 'cr' }); const so = s.br(S0, 90, 'O', 2, { cls: 'oxy2' }, 1.05); s.br(S0, 0, 'Cl', 1, { cls: 'lg' }, 1.1); s.br(S0, 300, 'Cl', 1, { cls: 'lg' }, 1.1);
    s.arrow({ lp: [A.y, 0] }, { a: S0, ang: 200 }, -0.3, 'm'); s.arrow({ b: [S0, so] }, { a: so, ang: 0 }, -0.6, 'm'); out.push(F(s, '<b>1. Ativação:</b> o O do grupo OH ataca o <b>enxofre</b> (eletrofílico) do SOCl₂; o par π S=O vai para o O.', 0, 'acidoAcetico')); }
  { const s = new S(); const A = acyl(s, ['O', { cls: 'nu', chg: '+' }, 1.2]); s.br(A.y, 270, 'H', 1, {}, 0.95); const S0 = s.br(A.y, 0, 'S', 1, { cls: 'cr' }, 1.2); const so = s.br(S0, 90, 'O', 1, { cls: 'oxy2', chg: '−', lp: [30, 150] }, 1.05); const cl1 = s.br(S0, 0, 'Cl', 1, { cls: 'lg' }, 1.1); s.br(S0, 300, 'Cl', 1, { cls: 'lg' }, 1.1);
    s.arrow({ lp: [so, 30] }, { b: [S0, so] }, -0.9, 'm'); s.arrow({ b: [S0, cl1] }, { a: cl1, ang: 90 }, -0.6, 'm'); out.push(F(s, '<b>2.</b> O O⁻ refaz a S=O e um <b>Cl⁻ sai do enxofre</b>.', 1, 'acidoAcetico')); }
  { const s = new S(); const A = acyl(s, ['O', { cls: 'nu', chg: '+' }, 1.2]); const h = s.br(A.y, 270, 'H', 1, { cls: 'hb' }, 0.95); const S0 = s.br(A.y, 0, 'S', 1, { cls: 'cr' }, 1.2); s.br(S0, 90, 'O', 2, { cls: 'oxy2' }, 1.05); s.br(S0, 0, 'Cl', 1, { cls: 'lg' }, 1.1); const cl = s.a(0.2, 2.5, 'Cl', { cls: 'lg', chg: '−', lp: [0] });
    s.arrow({ lp: [cl, 0] }, { a: h, ang: 200 }, 0.3, 'm'); s.arrow({ b: [h, A.y] }, { a: A.y, ang: 300 }, -0.6, 'm'); out.push(F(s, '<b>3. Desprotonação</b> (Cl⁻ ou outra base) → <b>acil clorossulfito</b>, R–CO–O–S(O)Cl: o O agora faz parte de um ótimo grupo de saída.', 2, 'clorossulfito')); }
  { const s = new S(); const A = acyl(s, ['OS(O)Cl', { cls: 'cr' }, 1.6]); const cl = s.a(-2.7, -0.9, 'Cl', { cls: 'lg', chg: '−', lp: [0, 90, 270] }); s.arrow({ lp: [cl, 0] }, { a: A.c, ang: 165 }, -0.35, 'm'); s.arrow({ b: [A.c, A.O] }, { a: A.O, ang: 0 }, 0.5, 'm'); out.push(F(s, '<b>4. Cl⁻ ataca o carbono acílico</b> (ativado; muitas vezes protonado pelo HCl formado) → intermediário tetraédrico.', 3, 'clorossulfito')); }
  { const s = new S(); const T = tet(s, ['O', { cls: 'oxy', chg: '−', lp: [30, 150] }], ['Cl', { cls: 'lg' }], ['OS(O)Cl', { cls: 'cr' }, 1.7]); s.arrow({ lp: [T.T, 30] }, { b: [T.c, T.T] }, -0.9, 'm'); s.arrow({ b: [T.c, T.y] }, { a: T.y, ang: 270 }, 0.6, 'm'); out.push(F(s, '<b>5. Colapso do tetraédrico:</b> sai ⁻O–S(O)Cl (excelente grupo de saída).', 4, 'tetraSOCl')); }
  { const s = new S(); const A = acyl(s, ['Cl', { cls: 'prod' }, 1.2]); s.atoms[A.c][3].halo = 'g'; const o1 = s.a(2.9, -0.4, 'O', { cls: 'oxy2', chg: '−', lp: [180] }); const S0 = s.br(o1, 0, 'S', 1, { cls: 'cr' }, 1.1); const so = s.br(S0, 90, 'O', 2, { cls: 'oxy2' }, 1.0); const cl = s.br(S0, 0, 'Cl', 1, { cls: 'lg' }, 1.1); void so;
    s.arrow({ lp: [o1, 270] }, { b: [o1, S0] }, 0.9, 'm'); s.arrow({ b: [S0, cl] }, { a: cl, ang: 90 }, -0.6, 'm'); out.push(F(s, '<b>6. Cloreto de acila formado.</b> O ⁻OS(O)Cl decompõe-se em <b>SO₂</b> + Cl⁻.', 5, 'cloretoAcetila')); }
  { const s = new S(); const A = acyl(s, ['Cl', { cls: 'prod' }, 1.2]); s.atoms[A.c][3].halo = 'g'; tag(s, 3.4, 0.2, '+ SO₂(g) + HCl(g)', 'cond', 15); out.push(F(s, '<b>7. Global:</b> RCOOH + SOCl₂ → RCOCl + SO₂↑ + HCl↑. Os subprodutos <b>gasosos</b> deixam o meio e dirigem a reação. <i>Modelo mecanístico didático; há variantes (ex.: catálise por DMF).</i>', 6, 'cloretoAcetila')); }
  return out;
}

/* ===================================================================
 * Esterificação de Fischer (RCOOH + CH₃OH, H⁺) e hidrólise ácida
 * =================================================================== */
export function fischerFrames() {
  const out = [];
  { const s = new S(); const A = acyl(s, ['OH', { cls: 'oxy2' }]); const a = acidH(s, 2.4, -1.9, 180); s.arrow({ lp: [A.O, 45] }, { a: a.H, ang: 180 }, -0.4, 'm'); s.arrow({ b: [a.H, a.O] }, { a: a.O, ang: 90 }, 0.6, 'm'); out.push(F(s, '<b>1. Protonação da carbonila</b> (H₃O⁺ / H₂SO₄): o carbono acílico fica mais eletrofílico.', 0, 'acidoAcetico')); }
  { const s = new S(); const A = acyl(s, ['OH', { cls: 'oxy2' }], { prot: true }); const n = s.a(-2.7, -0.9, 'O', { cls: 'nu', lp: [0, 270] }); s.br(n, 120, 'H', 1, {}, 0.95); s.br(n, 210, 'CH₃', 1, G); s.arrow({ lp: [n, 0] }, { a: A.c, ang: 165 }, -0.35, 'm'); s.arrow({ b: [A.c, A.O] }, { a: A.O, ang: 0 }, 0.5, 'm'); out.push(F(s, '<b>2. Ataque do álcool</b> (nucleófilo fraco) ao carbono ativado; π → O⁺ (que fica O–H).', 1, 'acidoProtonado')); }
  { const s = new S(); const T = tet(s, ['OH', { cls: 'oxy' }], ['O', { cls: 'nu', chg: '+' }, 1.2], ['OH', { cls: 'oxy2' }]); const h = s.br(T.N, 120, 'H', 1, { cls: 'hb' }, 0.95); s.br(T.N, 240, 'CH₃', 1, G); const w = water(s, -2.9, -1.7, 0); s.arrow({ lp: [w, 0] }, { a: h, ang: 180 }, -0.35, 'm'); s.arrow({ b: [h, T.N] }, { a: T.N, ang: 30 }, 0.6, 'm'); out.push(F(s, '<b>3. Intermediário tetraédrico</b> (oxônio) → <b>desprotonação</b> do O que atacou.', 2, 'tetraFischerOx')); }
  { const s = new S(); const T = tet(s, ['OH', { cls: 'oxy' }], ['OCH₃', { cls: 'nu' }, 1.4], ['O', { cls: 'oxy2', lp: [30, 300] }, 1.2]); s.br(T.y, 60, 'H', 1, {}, 0.95); const a = acidH(s, 2.6, 1.6, 180); s.arrow({ lp: [T.y, 300] }, { a: a.H, ang: 150 }, 0.3, 'm'); s.arrow({ b: [a.H, a.O] }, { a: a.O, ang: 270 }, -0.6, 'm'); out.push(F(s, '<b>4. Transferência de próton:</b> protona-se um dos <b>OH</b> (o que vai sair). HO⁻ seria péssimo grupo de saída; H₂O é bom.', 3, 'tetraFischer')); }
  { const s = new S(); const T = tet(s, ['O', { cls: 'oxy', lp: [30, 150] }], ['OCH₃', { cls: 'nu' }, 1.4], ['OH₂', { cls: 'lg', chg: '+' }, 1.3]); s.br(T.T, 90, 'H', 1, {}, 0.95); s.arrow({ lp: [T.T, 30] }, { b: [T.c, T.T] }, -0.9, 'm'); s.arrow({ b: [T.c, T.y] }, { a: T.y, ang: 270 }, 0.6, 'm'); out.push(F(s, '<b>5. Saída de H₂O:</b> o par do OH refaz a ligação π (C=O⁺H) e a <b>água</b> sai.', 4, 'tetraFischerH2O')); }
  { const s = new S(); const A = acyl(s, ['OCH₃', { cls: 'nu' }, 1.4], { prot: true }); const w = water(s, 2.5, -2.4, 180); s.arrow({ lp: [w, 180] }, { a: A.H, ang: 0 }, 0.35, 'm'); s.arrow({ b: [A.H, A.O] }, { a: A.O, ang: 90 }, -0.6, 'm'); tag(s, -2.6, -0.5, '+ H₂O', 'cond', 15); out.push(F(s, '<b>6. Desprotonação</b> do éster protonado: o catalisador (H₃O⁺) é regenerado.', 5, 'esterProtonado')); }
  { const s = new S(); const A = acyl(s, ['OCH₃', { cls: 'prod' }, 1.4]); s.atoms[A.c][3].halo = 'g'; tag(s, 3.1, 0.2, '+ H₂O  (⇌, H⁺)', 'cond', 15); out.push(F(s, '<b>7. Éster.</b> Global: RCOOH + CH₃OH ⇌ RCOOCH₃ + H₂O. <b>Reversível</b>: excesso de álcool ou remoção de água desloca para o éster.', 6, 'acetatoMetila')); }
  return out;
}
export function acidHydFrames() {
  const out = [];
  { const s = new S(); const A = acyl(s, ['OCH₃', { cls: 'oxy2' }, 1.4]); const a = acidH(s, 2.4, -1.9, 180); s.arrow({ lp: [A.O, 45] }, { a: a.H, ang: 180 }, -0.4, 'm'); s.arrow({ b: [a.H, a.O] }, { a: a.O, ang: 90 }, 0.6, 'm'); out.push(F(s, '<b>1. Protonação da carbonila</b> do éster.', 0, 'acetatoMetila')); }
  { const s = new S(); const A = acyl(s, ['OCH₃', { cls: 'oxy2' }, 1.4], { prot: true }); const n = s.a(-2.7, -0.9, 'O', { cls: 'nu', lp: [0, 270] }); s.br(n, 120, 'H', 1, {}, 0.95); s.br(n, 210, 'H', 1, {}, 0.95); s.arrow({ lp: [n, 0] }, { a: A.c, ang: 165 }, -0.35, 'm'); s.arrow({ b: [A.c, A.O] }, { a: A.O, ang: 0 }, 0.5, 'm'); out.push(F(s, '<b>2. A água ataca</b> o carbono ativado.', 1, 'esterProtonado')); }
  { const s = new S(); const T = tet(s, ['OH', { cls: 'oxy' }], ['OH', { cls: 'nu' }], ['O', { cls: 'oxy2', lp: [30, 300] }, 1.2]); s.br(T.y, 60, 'CH₃', 1, G, 1.0); const a = acidH(s, 2.6, 1.6, 180); s.arrow({ lp: [T.y, 300] }, { a: a.H, ang: 150 }, 0.3, 'm'); s.arrow({ b: [a.H, a.O] }, { a: a.O, ang: 270 }, -0.6, 'm'); out.push(F(s, '<b>3–4. Tetraédrico</b> (após desprotonação) → <b>protonação do OCH₃</b>: o álcool vira bom grupo de saída.', 3, 'tetraFischer')); }
  { const s = new S(); const T = tet(s, ['O', { cls: 'oxy', lp: [30, 150] }], ['OH', { cls: 'nu' }], ['O', { cls: 'lg', chg: '+' }, 1.2]); s.br(T.T, 90, 'H', 1, {}, 0.95); s.br(T.y, 60, 'H', 1, {}, 0.95); s.br(T.y, 330, 'CH₃', 1, G, 1.0); s.arrow({ lp: [T.T, 30] }, { b: [T.c, T.T] }, -0.9, 'm'); s.arrow({ b: [T.c, T.y] }, { a: T.y, ang: 270 }, 0.6, 'm'); out.push(F(s, '<b>5. Colapso:</b> sai <b>CH₃OH</b> (neutro).', 4, 'tetraFischerH2O')); }
  { const s = new S(); const A = acyl(s, ['OH', { cls: 'nu' }], { prot: true }); const w = water(s, 2.5, -2.4, 180); s.arrow({ lp: [w, 180] }, { a: A.H, ang: 0 }, 0.35, 'm'); s.arrow({ b: [A.H, A.O] }, { a: A.O, ang: 90 }, -0.6, 'm'); tag(s, -2.7, -0.5, '+ CH₃OH', 'cond', 15); out.push(F(s, '<b>6. Desprotonação.</b>', 5, 'acidoProtonado')); }
  { const s = new S(); const A = acyl(s, ['OH', { cls: 'prod' }]); s.atoms[A.c][3].halo = 'g'; tag(s, 3.1, 0.2, '+ CH₃OH  (⇌)', 'cond', 15); out.push(F(s, '<b>7. Ácido carboxílico.</b> Mesmo caminho da Fischer, percorrido ao contrário (princípio da reversibilidade microscópica); excesso de água favorece a hidrólise.', 6, 'acidoAcetico')); }
  return out;
}

/* ===================================================================
 * Saponificação
 * =================================================================== */
export function saponFrames() {
  const out = nasAnion({ Y: 'OEt', nu: 'HO', nuName: 'HO⁻', prodLab: 'OH', Ylg: 'EtO⁻', k0: 'acetatoEtila', k1: 'tetraEsterOH', k2: 'acidoAcetico', end: 'Mas o ácido formado convive com EtO⁻, uma base forte…' });
  out[2].cap = '<b>3. Ácido carboxílico + EtO⁻</b> (formados no colapso; EtO⁻ é mau grupo de saída, mas a etapa seguinte é muito favorável).';
  { const s = new S(); const A = acyl(s, ['O', { cls: 'oxy', lp: [300] }, 1.2]); const h = s.br(A.y, 30, 'H', 1, { cls: 'hb' }, 0.95); const b = s.a(2.9, -1.3, 'OEt', { cls: 'base', chg: '−', lp: [180] }); s.arrow({ lp: [b, 180] }, { a: h, ang: 30 }, 0.3, 'm'); s.arrow({ b: [h, A.y] }, { a: A.y, ang: 0 }, -0.6, 'm'); out.push(F(s, '<b>4. Ácido-base (rápida e muito favorável):</b> EtO⁻ (pKₐ EtOH ≈ 16) desprotona o ácido (pKₐ ≈ 4,8).', 3, 'acidoAcetico')); }
  { const s = new S(); const A = acyl(s, ['O', { cls: 'prod', chg: '−' }, 1.2]); s.atoms[A.c][3].halo = 'g'; tag(s, 3.0, 0.2, '+ EtOH', 'cond', 15); out.push(F(s, '<b>5. Carboxilato</b> (estabilizado por ressonância e pouco eletrofílico): a reação é <b>efetivamente irreversível</b>. Após acidificação (H₃O⁺) obtém-se o ácido.', 4, 'acetato')); }
  return out;
}

/* ===================================================================
 * Amidas: hidrólise ácida e básica
 * =================================================================== */
export function amideAcidFrames() {
  const out = [];
  { const s = new S(); const A = acyl(s, ['NH₂', { cls: 'nu' }]); const a = acidH(s, 2.4, -1.9, 180); s.arrow({ lp: [A.O, 45] }, { a: a.H, ang: 180 }, -0.4, 'm'); s.arrow({ b: [a.H, a.O] }, { a: a.O, ang: 90 }, 0.6, 'm'); out.push(F(s, '<b>1. Protonação do O carbonílico</b> (o O, não o N: o par do N está deslocalizado na C=O).', 0, 'acetamida')); }
  { const s = new S(); const A = acyl(s, ['NH₂', { cls: 'nu' }], { prot: true }); const n = s.a(-2.7, -0.9, 'O', { cls: 'nu', lp: [0, 270] }); s.br(n, 120, 'H', 1, {}, 0.95); s.br(n, 210, 'H', 1, {}, 0.95); s.arrow({ lp: [n, 0] }, { a: A.c, ang: 165 }, -0.35, 'm'); s.arrow({ b: [A.c, A.O] }, { a: A.O, ang: 0 }, 0.5, 'm'); out.push(F(s, '<b>2. Água ataca</b> o carbono ativado.', 1, 'amidaProtonada')); }
  { const s = new S(); const T = tet(s, ['OH', { cls: 'oxy' }], ['OH', { cls: 'nu' }], ['N', { cls: 'lg', lp: [300] }, 1.2]); s.br(T.y, 60, 'H', 1, {}, 0.95); s.br(T.y, 0, 'H', 1, {}, 0.95); const a = acidH(s, 2.5, 1.9, 180); s.arrow({ lp: [T.y, 300] }, { a: a.H, ang: 150 }, 0.3, 'm'); s.arrow({ b: [a.H, a.O] }, { a: a.O, ang: 270 }, -0.6, 'm'); out.push(F(s, '<b>3–5. Tetraédrico</b> (após desprotonação) → <b>protonação do N</b>: NH₂⁻ seria um grupo de saída péssimo; NH₃ neutro é muito melhor.', 2, 'tetraAmida')); }
  { const s = new S(); const T = tet(s, ['O', { cls: 'oxy', lp: [30, 150] }], ['OH', { cls: 'nu' }], ['NH₃', { cls: 'lg', chg: '+' }, 1.3]); s.br(T.T, 90, 'H', 1, {}, 0.95); s.arrow({ lp: [T.T, 30] }, { b: [T.c, T.T] }, -0.9, 'm'); s.arrow({ b: [T.c, T.y] }, { a: T.y, ang: 270 }, 0.6, 'm'); out.push(F(s, '<b>6. Colapso:</b> sai <b>NH₃</b>.', 3, 'tetraAmidaNH3')); }
  { const s = new S(); const A = acyl(s, ['OH', { cls: 'prod' }]); s.atoms[A.c][3].halo = 'g'; tag(s, 3.2, 0.2, '+ NH₄⁺', 'cond', 15); out.push(F(s, '<b>7–8. Ácido carboxílico + amônio:</b> NH₃ captura H⁺ (do ácido protonado/meio) → NH₄⁺, que não é nucleófilo: isso torna a hidrólise ácida <b>efetivamente irreversível</b>. Exige calor prolongado.', 4, 'acidoAcetico')); }
  return out;
}
export function amideBaseFrames() {
  const out = nasAnion({ Y: 'NH₂', nu: 'HO', nuName: 'HO⁻', prodLab: 'OH', Ylg: 'H₂N⁻', k0: 'acetamida', k1: 'tetraAmidaOH', k2: 'acidoAcetico' });
  out[0].cap = '<b>1. HO⁻ ataca</b> a carbonila da amida (lento: pouco eletrofílica). Exige HO⁻ concentrado e <b>aquecimento</b>.';
  out[1].cap = '<b>2. Intermediário tetraédrico; colapso</b> com saída de H₂N⁻ — grupo de saída péssimo (pKₐ NH₃ ≈ 38): etapa difícil, que se completa porque a etapa seguinte é muito favorável (na prática a saída pode ser assistida por transferência de próton do solvente).';
  out[2].cap = '<b>3. Ácido + H₂N⁻:</b> transferência de próton imediata.';
  { const s = new S(); const A = acyl(s, ['O', { cls: 'prod', chg: '−' }, 1.2]); s.atoms[A.c][3].halo = 'g'; tag(s, 3.0, 0.2, '+ NH₃', 'cond', 15); out.push(F(s, '<b>4. Carboxilato + NH₃</b> — irreversível nas condições usuais. Após acidificação: ácido carboxílico.', 3, 'acetato')); }
  return out;
}

/* ===================================================================
 * Ácido + amina (ácido-base) e ativação com DCC
 * =================================================================== */
export function acidAmineFrames() {
  const out = [];
  { const s = new S(); const A = acyl(s, ['O', { cls: 'oxy2', lp: [300] }, 1.2], { R: 'Ph' }); const h = s.br(A.y, 30, 'H', 1, { cls: 'hb' }, 0.95); const n = s.a(3.0, -1.4, 'N', { cls: 'base', lp: [180] }); s.br(n, 90, 'H', 1, {}, 0.95); s.br(n, 0, 'CH₃', 1, G); s.br(n, 300, 'H', 1, {}, 0.95);
    s.arrow({ lp: [n, 180] }, { a: h, ang: 30 }, 0.3, 'm'); s.arrow({ b: [h, A.y] }, { a: A.y, ang: 0 }, -0.6, 'm'); out.push(F(s, '<b>Ácido + amina (condições brandas):</b> a amina é <b>base</b> e retira o H⁺ ácido (pKₐ ≈ 4,2) muito mais rápido do que atacaria a carbonila.', 0, 'acidoBenzoico')); }
  { const s = new S(); const A = acyl(s, ['O', { cls: 'oxy', chg: '−' }, 1.2], { R: 'Ph' }); void A; tag(s, 3.2, 0.2, 'CH₃NH₃⁺', 'base', 16); out.push(F(s, '<b>Sal: benzoato de metilamônio.</b> O carboxilato é muito pouco eletrofílico e o amônio não tem par livre: <b>não há amida</b> à temperatura ambiente. Para obtê-la: ativar o ácido (SOCl₂ → RCOCl; DCC/EDC) ou aquecer fortemente com remoção de água.', 1, 'acetato')); }
  return out;
}
export function dccFrames() {
  const out = [];
  { const s = new S(); const A = acyl(s, ['O', { cls: 'nu', chg: '−', lp: [0, 300] }, 1.2]); const c = s.a(3.1, -0.3, '', { halo: 'o' }); const n1 = s.br(c, 135, 'N', 2, { cls: 'nu' }, 1.1); const n2 = s.br(c, 315, 'N', 2, { cls: 'nu' }, 1.1); s.br(n1, 135, 'Cy', 1, G); s.br(n2, 315, 'Cy', 1, G);
    s.arrow({ lp: [A.y, 0] }, { a: c, ang: 200 }, -0.3, 'm'); out.push(F(s, '<b>1. Ativação:</b> o carboxilato (após transferência de próton para o DCC) ataca o carbono central da carbodiimida (Cy–N=C=N–Cy).', 0, 'acidoAcetico')); }
  { const s = new S(); const A = acyl(s, ['O–C(=NCy)NHCy', { cls: 'cr' }, 2.2]); const n = s.a(-2.7, -0.9, 'N', { cls: 'nu', lp: [0] }); s.br(n, 120, 'H', 1, {}, 0.95); s.br(n, 165, 'H', 1, {}, 0.95); s.br(n, 230, 'R′', 1, G); s.arrow({ lp: [n, 0] }, { a: A.c, ang: 165 }, -0.35, 'm'); s.arrow({ b: [A.c, A.O] }, { a: A.O, ang: 0 }, 0.5, 'm'); out.push(F(s, '<b>2. O-acilisoureia</b> (ácido “ativado”: o O-isoureia é um bom grupo de saída). A amina ataca o carbono acílico → tetraédrico.', 1, 'acetamida')); }
  { const s = new S(); const A = acyl(s, ['NHR′', { cls: 'prod' }, 1.3]); s.atoms[A.c][3].halo = 'g'; tag(s, 3.5, 0.2, '+ DCU (diciclo-hexilureia)', 'cond', 14); out.push(F(s, '<b>3. Amida + diciclo-hexilureia.</b> O agente de acoplamento “paga” a desidratação, tornando a substituição possível. <i>Modelo conceitual; protocolos omitidos.</i>', 2, 'nMetilacetamida')); }
  return out;
}

/* ===================================================================
 * Desidratação de amida primária (SOCl₂) — modelo didático
 * =================================================================== */
export function dehydrationFrames() {
  const out = [];
  { const s = new S(); const A = acyl(s, ['NH₂', { cls: 'nu' }], { R: 'Ph' }); const S0 = s.a(2.4, -2.2, 'S(O)Cl', { cls: 'cr' }); const cl = s.br(S0, 0, 'Cl', 1, { cls: 'lg' }, 1.5); s.arrow({ lp: [A.O, 45] }, { a: S0, ang: 180 }, -0.3, 'm'); s.arrow({ b: [S0, cl] }, { a: cl, ang: 90 }, -0.6, 'm'); out.push(F(s, '<b>1. Ativação do oxigênio:</b> o O da amida (rico em elétrons pela ressonância) ataca o S do SOCl₂; sai Cl⁻.', 0, 'benzamida')); }
  { const s = new S(); const c = s.a(0, 0, '', { halo: 'v' }); const O = s.br(c, 90, 'O–S(O)Cl', 1, { cls: 'cr' }, 1.3); s.br(c, 210, 'Ph', 1, G); const N = s.br(c, 330, 'N', 2, { cls: 'nu', chg: '+' }, 1.2); const h = s.br(N, 30, 'H', 1, { cls: 'hb' }, 0.95); s.br(N, 270, 'H', 1, {}, 0.95); const cl = s.a(2.8, -1.3, 'Cl', { cls: 'lg', chg: '−', lp: [270] }); void O;
    s.arrow({ lp: [cl, 270] }, { a: h, ang: 90 }, 0.3, 'm'); s.arrow({ b: [h, N] }, { a: N, ang: 0 }, -0.7, 'm'); out.push(F(s, '<b>2. Desprotonação do N</b> (Cl⁻ ou base, ex.: piridina) → imidato ativado R–C(=NH)–O–S(O)Cl.', 1, 'benzamida')); }
  { const s = new S(); const c = s.a(0, 0, '', { halo: 'v' }); const O = s.br(c, 90, 'O–S(O)Cl', 1, { cls: 'cr' }, 1.3); s.br(c, 210, 'Ph', 1, G); const N = s.br(c, 330, 'N', 2, { cls: 'nu', lp: [300] }, 1.2); const h = s.br(N, 30, 'H', 1, { cls: 'hb' }, 0.95); const b = s.a(2.9, -1.4, 'B:', { cls: 'base', lp: [270] });
    s.arrow({ lp: [b, 270] }, { a: h, ang: 90 }, 0.3, 'm'); s.arrow({ b: [h, N] }, { b: [c, N] }, 0.9, 'm'); s.arrow({ b: [c, O] }, { a: O, ang: 180 }, 0.6, 'm'); out.push(F(s, '<b>3. Eliminação:</b> a base remove o último H do N; o par N–H forma a 2ª ligação π (C≡N) e a ligação C–O se rompe (sai ⁻OS(O)Cl → SO₂ + Cl⁻).', 2, 'benzamida')); }
  { const s = new S(); const c = s.a(0, 0, '', { halo: 'g' }); s.br(c, 0, 'N', 3, { cls: 'prod' }, 1.15); s.br(c, 180, 'Ph', 1, G); tag(s, 3.3, 0.0, '+ SO₂ + 2 HCl', 'cond', 15); out.push(F(s, '<b>4. Nitrila</b> (C sp, linear, 180°). Global: perda dos elementos de H₂O: RCONH₂ → RC≡N. Só amidas <b>primárias</b> (dois H no N).' + SIMPL, 3, 'benzonitrila')); }
  return out;
}

/* ===================================================================
 * Nitrilas: hidrólise ácida (detalhada e simplificada) e básica
 * =================================================================== */
export function nitrileAcidFrames(detail = true) {
  const out = [];
  { const s = new S(); const c = s.a(0, 0, '', { halo: 'o' }); const N = s.br(c, 0, 'N', 3, { cls: 'nu', lp: [0] }, 1.15); s.br(c, 180, 'R', 1, G); const a = acidH(s, 3.6, -0.9, 180); s.arrow({ lp: [N, 0] }, { a: a.H, ang: 210 }, -0.3, 'm'); s.arrow({ b: [a.H, a.O] }, { a: a.O, ang: 90 }, 0.6, 'm'); out.push(F(s, '<b>1. Protonação do N</b> → íon nitrílio (C muito eletrofílico).', 0, 'acetonitrila')); }
  { const s = new S(); const c = s.a(0, 0, '', { halo: 'o' }); const N = s.br(c, 0, 'N', 3, { cls: 'nu', chg: '+' }, 1.15); s.br(N, 0, 'H', 1, {}, 0.95); s.br(c, 180, 'R', 1, G); const w = s.a(-0.6, -2.1, 'O', { cls: 'nu', lp: [270, 0] }); s.br(w, 90, 'H', 1, {}, 0.95); s.br(w, 180, 'H', 1, {}, 0.95);
    s.arrow({ lp: [w, 270] }, { a: c, ang: 100 }, 0.3, 'm'); s.arrow({ b: [c, N] }, { a: N, ang: 270 }, 0.6, 'm'); out.push(F(s, '<b>2. Água ataca o carbono</b> nitrílico; um par π vai para o N.', 1, 'nitrilaProtonada')); }
  if (detail) {
    { const s = new S(); const c = s.a(0, 0, '', { halo: 'v' }); const O = s.br(c, 90, 'O', 1, { cls: 'nu', chg: '+' }, 1.2); const h = s.br(O, 30, 'H', 1, { cls: 'hb' }, 0.95); s.br(O, 150, 'H', 1, {}, 0.95); s.br(c, 210, 'R', 1, G); const N = s.br(c, 330, 'N', 2, { cls: 'nu', lp: [300] }, 1.2); s.br(N, 30, 'H', 1, {}, 0.95); const w = water(s, 2.6, -2.2, 180);
      s.arrow({ lp: [w, 180] }, { a: h, ang: 0 }, 0.35, 'm'); s.arrow({ b: [h, O] }, { a: O, ang: 90 }, -0.6, 'm'); void N; out.push(F(s, '<b>3. Desprotonação do O⁺</b> → <b>ácido imídico</b> R–C(OH)=NH (tautômero da amida).', 2, 'acidoImidico')); }
    { const s = new S(); const c = s.a(0, 0, '', { halo: 'v' }); const O = s.br(c, 90, 'O', 1, { cls: 'oxy', lp: [150] }, 1.2); const h = s.br(O, 30, 'H', 1, { cls: 'hb' }, 0.95); s.br(c, 210, 'R', 1, G); const N = s.br(c, 330, 'N', 2, { cls: 'nu', lp: [270] }, 1.2); s.br(N, 30, 'H', 1, {}, 0.95); const a = acidH(s, 1.0, 2.6, 90); const w = water(s, 2.5, -2.2, 180);
      s.arrow({ lp: [N, 270] }, { a: a.H, ang: 90 }, 0.3, 'm'); s.arrow({ lp: [w, 180] }, { a: h, ang: 0 }, 0.35, 'm'); s.arrow({ b: [h, O] }, { b: [c, O] }, -0.8, 'm'); s.arrow({ b: [c, N] }, { a: N, ang: 0 }, -0.4, 'm'); out.push(F(s, '<b>4. Tautomerização</b> (catalisada por ácido; aqui condensada): o N é protonado e o O–H perde o próton; forma-se a C=O.', 3, 'acidoImidico')); }
  }
  { const s = new S(); const c = s.a(0, 0, '', { halo: 'v' }); s.br(c, 90, 'O', 2, { cls: 'oxy' }, 1.2); s.br(c, 210, 'R', 1, G); s.br(c, 330, 'NH₂', 1, { cls: 'nu' }, 1.2); tag(s, 3.0, 0.2, '→ H₃O⁺, calor →', 'cond', 14); out.push(F(s, `<b>${detail ? '5' : '3'}. Amida</b> — intermediário importante. Nas mesmas condições ela sofre <b>hidrólise ácida</b> (ver Hidrólise de amidas).`, detail ? 4 : 2, 'acetamida')); }
  { const s = new S(); const c = s.a(0, 0, '', { halo: 'g' }); s.br(c, 90, 'O', 2, { cls: 'oxy' }, 1.2); s.br(c, 210, 'R', 1, G); s.br(c, 330, 'OH', 1, { cls: 'prod' }, 1.2); tag(s, 2.8, 0.2, '+ NH₄⁺', 'cond', 15); out.push(F(s, `<b>${detail ? '6' : '4'}. Ácido carboxílico + NH₄⁺.</b> Sequência: nitrila → amida → ácido.`, detail ? 5 : 3, 'acidoAcetico')); }
  return out;
}
export function nitrileBaseFrames() {
  const out = [];
  { const s = new S(); const c = s.a(0, 0, '', { halo: 'o' }); const N = s.br(c, 0, 'N', 3, { cls: 'nu', lp: [0] }, 1.15); s.br(c, 180, 'R', 1, G); const n = s.a(-0.6, -2.1, 'HO', { cls: 'nu', chg: '−', lp: [270] }); s.arrow({ lp: [n, 270] }, { a: c, ang: 100 }, 0.3, 'm'); s.arrow({ b: [c, N] }, { a: N, ang: 270 }, 0.6, 'm'); out.push(F(s, '<b>1. HO⁻ ataca</b> o carbono da nitrila (aquecimento).', 0, 'acetonitrila')); }
  { const s = new S(); const c = s.a(0, 0, '', { halo: 'v' }); s.br(c, 90, 'OH', 1, { cls: 'oxy' }, 1.2); s.br(c, 210, 'R', 1, G); const N = s.br(c, 330, 'N', 2, { cls: 'nu', chg: '−', lp: [270, 0] }, 1.2); const h = s.a(2.6, -1.4, 'H', { cls: 'hb' }); const o = s.br(h, 0, 'OH', 1, { cls: 'oxy2' }, 1.0);
    s.arrow({ lp: [N, 0] }, { a: h, ang: 270 }, 0.3, 'm'); s.arrow({ b: [h, o] }, { a: o, ang: 90 }, -0.6, 'm'); out.push(F(s, '<b>2. Ânion imidato</b> → o N⁻ é protonado pela água → ácido imídico; tautomerização (via base) → amida.', 1, 'imidatoAnion')); }
  { const s = new S(); const c = s.a(0, 0, '', { halo: 'v' }); s.br(c, 90, 'O', 2, { cls: 'oxy' }, 1.2); s.br(c, 210, 'R', 1, G); s.br(c, 330, 'NH₂', 1, { cls: 'nu' }, 1.2); tag(s, 3.1, 0.2, '→ HO⁻, calor →', 'cond', 14); out.push(F(s, '<b>3. Amida</b> → sofre hidrólise básica (ver Hidrólise de amidas).', 2, 'acetamida')); }
  { const s = new S(); const c = s.a(0, 0, '', { halo: 'g' }); s.br(c, 90, 'O', 2, { cls: 'oxy' }, 1.2); s.br(c, 210, 'R', 1, G); s.br(c, 330, 'O', 1, { cls: 'prod', chg: '−' }, 1.2); tag(s, 2.9, 0.2, '+ NH₃', 'cond', 15); out.push(F(s, '<b>4. Carboxilato + NH₃.</b> Acidificação (H₃O⁺) → ácido carboxílico.', 3, 'acetato')); }
  return out;
}

/* ===================================================================
 * Descarboxilação de β-cetoácido (ciclo de 6 membros)
 * =================================================================== */
export function decarbFrames() {
  const out = [];
  // anel: O_k(0) – C_k – Cα – C_ac – O_b – H
  const ring = (s, o = {}) => {
    const P = { Ok: [-1.2, -1.1], Ck: [-1.2, 0.25], Ca: [0, 1.0], Cac: [1.2, 0.25], Ob: [1.2, -1.1], H: [0, -1.7] };
    const I = {}; I.Ok = s.a(...P.Ok, 'O', { cls: 'oxy', lp: [150, 210] }); I.Ck = s.a(...P.Ck, ''); I.Ca = s.a(...P.Ca, '', { halo: o.ca ? 'o' : undefined }); I.Cac = s.a(...P.Cac, '', { halo: 'o' }); I.Ob = s.a(...P.Ob, 'O', { cls: 'oxy2', lp: [30] }); I.H = s.a(...P.H, 'H', { cls: 'hb' });
    s.b(I.Ok, I.Ck, 2); s.b(I.Ck, I.Ca, 1); s.b(I.Ca, I.Cac, 1); s.b(I.Cac, I.Ob, 1); s.b(I.Ob, I.H, 1); s.b(I.H, I.Ok, 'p');
    I.Oa = s.br(I.Cac, 330, 'O', 2, { cls: 'oxy2' }, 1.1); s.br(I.Ck, 210, 'CH₃', 1, G); return I;
  };
  { const s = new S(); const I = ring(s); s.arrow({ b: [I.Ok, I.Ck] }, { b: [I.Ok, I.H] }, -0.6, 'm'); s.arrow({ b: [I.Ob, I.H] }, { b: [I.Cac, I.Ob] }, -0.6, 'm'); s.arrow({ b: [I.Ca, I.Cac] }, { b: [I.Ck, I.Ca] }, 0.6, 'm');
    out.push(F(s, '<b>1. Estado de transição cíclico de 6 membros</b> (concertado): o H ácido é transferido ao O cetônico, a ligação C–C (Cα–COOH) se rompe e forma-se a C=C do enol; o grupo carboxila sai como <b>CO₂</b>. Conformação com ligação de H intramolecular.', 0, 'acetoacetico')); }
  { const s = new S(); const ok = s.a(-1.2, -1.1, 'O', { cls: 'oxy' }); const ck = s.a(-1.2, 0.25, ''); const ca = s.a(0, 1.0, 'CH₂', { halo: 'o' }); s.b(ok, ck, 1); s.b(ck, ca, 2); s.br(ok, 90, 'H', 1, {}, 0.9); s.br(ck, 210, 'CH₃', 1, G); s.t(2.4, -0.4, '+  O=C=O', 'oxy2', 17);
    out.push(F(s, '<b>2. Enol + CO₂</b> (gás; sai do meio, tornando a etapa irreversível).', 1, 'enolAcetona')); }
  { const s = new S(); const ok = s.a(-1.2, -1.1, 'O', { cls: 'oxy', lp: [180] }); const ck = s.a(-1.2, 0.25, ''); const ca = s.a(0, 1.0, ''); s.b(ok, ck, 1); s.b(ck, ca, 2); const h = s.br(ok, 90, 'H', 1, { cls: 'hb' }, 0.9); s.br(ck, 210, 'CH₃', 1, G); const a = acidH(s, 1.6, 2.1, 180); const w = water(s, 1.2, -2.2, 180);
    s.arrow({ b: [ck, ca] }, { a: a.H, ang: 180 }, 0.4, 'm'); s.arrow({ lp: [w, 180] }, { a: h, ang: 0 }, -0.3, 'm'); s.arrow({ b: [ok, h] }, { b: [ok, ck] }, 0.7, 'm');
    out.push(F(s, '<b>3. Tautomerização</b> (enol → cetona; catalisada por ácido, aqui condensada): o Cα é protonado e o O–H perde o próton.', 2, 'enolAcetona')); }
  { const s = new S(); const c = s.a(0, 0, '', { halo: 'g' }); s.br(c, 90, 'O', 2, { cls: 'prod' }, 1.2); s.br(c, 210, 'CH₃', 1, G); s.br(c, 330, 'CH₃', 1, G); tag(s, 2.6, 0.2, '+ CO₂', 'oxy2', 16); out.push(F(s, '<b>4. Cetona (acetona) + CO₂.</b> O β-C=O é essencial: ele recebe o H no ciclo e estabiliza o produto (enol).', 3, 'acetona')); }
  return out;
}

/* ===================================================================
 * Lactonização (esterificação intramolecular, resumo)
 * =================================================================== */
export function lactoneFrames() {
  const out = [];
  const chain = (s, o = {}) => { const c = s.a(0, 0, '', { halo: o.halo || 'o' }); const a = s.a(-0.9, 0.7, ''), b = s.a(-0.6, 1.85, ''), d = s.a(0.6, 1.95, ''); s.b(c, a, 1); s.b(a, b, 1); s.b(b, d, 1); return { c, d }; };
  { const s = new S(); const K = chain(s); const O = s.br(K.c, 90, 'O', 2, { cls: 'oxy', lp: [45, 135] }, 1.15); s.br(K.c, 15, 'OH', 1, { cls: 'oxy2' }, 1.2); const oh = s.br(K.d, 0, 'O', 1, { cls: 'nu', lp: [90] }, 1.0); s.br(oh, 300, 'H', 1, {}, 0.9); tag(s, 2.6, -1.6, 'H⁺', 'cond', 16); void O;
    s.arrow({ lp: [oh, 90] }, { a: K.c, ang: 300 }, 0.3, 'm'); out.push(F(s, '<b>1–2. Ativação e ataque intramolecular:</b> após protonação da C=O, o OH da própria molécula ataca o carbono acílico.', 0, 'hidroxibutanoico')); }
  { const s = new S(); const K = chain(s, { halo: 'v' }); s.br(K.c, 90, 'OH', 1, { cls: 'oxy' }, 1.15); s.br(K.c, 15, 'OH₂', 1, { cls: 'lg', chg: '+' }, 1.3); const o = s.a(1.05, 0.95, 'O', { cls: 'nu' }); s.b(K.d, o, 1); s.b(o, K.c, 1); out.push(F(s, '<b>3–5. Intermediário tetraédrico cíclico</b>; transferências de próton tornam um OH em –OH₂⁺, que sai como água.', 2, 'hidroxibutanoico')); }
  { const s = new S(); const K = chain(s, { halo: 'g' }); s.br(K.c, 90, 'O', 2, { cls: 'prod' }, 1.15); const o = s.a(1.05, 0.95, 'O', { cls: 'prod' }); s.b(K.d, o, 1); s.b(o, K.c, 1); tag(s, 2.6, 0.5, '+ H₂O (⇌)', 'cond', 15); out.push(F(s, '<b>6. γ-Lactona</b> (anel de 5 membros, γ-butirolactona): éster cíclico. Reversível; anéis de 5 e 6 são favorecidos.', 3, 'gbl')); }
  return out;
}

/* ===================================================================
 * Estruturas de ressonância
 * =================================================================== */
export function resPair(Y, o = {}) {
  const s = new S();
  const c = s.a(0, 0, '', { halo: 'o' }); const O = s.br(c, 90, 'O', 2, { cls: 'oxy', lp: [45, 135] }, 1.15); s.br(c, 210, o.R || 'R', 1, G); const y = s.br(c, 330, Y, 1, { cls: o.cls || 'lg', lp: o.lpY || [330] }, 1.15);
  if (o.arrows !== false) { s.arrow({ lp: [y, 330] }, { b: [c, y] }, 0.9, 'm'); s.arrow({ b: [c, O] }, { a: O, ang: 0 }, 0.5, 'm'); }
  const c2 = s.a(4.2, 0, '', { halo: 'o' }); s.br(c2, 90, 'O', 1, { cls: 'oxy', chg: '−', lp: [30, 150] }, 1.15); s.br(c2, 210, o.R || 'R', 1, G); s.br(c2, 330, Y, 2, { cls: o.cls || 'lg', chg: '+' }, 1.15);
  s.t(2.1, 0, '↔', 'cond', 24);
  return s;
}
export function carboxylateRes() {
  const s = new S();
  const c = s.a(0, 0, '', { halo: 'o' }); const O1 = s.br(c, 90, 'O', 2, { cls: 'oxy', lp: [45, 135] }, 1.15); s.br(c, 210, 'R', 1, G); const O2 = s.br(c, 330, 'O', 1, { cls: 'oxy', chg: '−', lp: [270, 0, 60] }, 1.15);
  s.arrow({ lp: [O2, 60] }, { b: [c, O2] }, 0.9, 'm'); s.arrow({ b: [c, O1] }, { a: O1, ang: 0 }, 0.5, 'm');
  const c2 = s.a(4.2, 0, '', { halo: 'o' }); s.br(c2, 90, 'O', 1, { cls: 'oxy', chg: '−', lp: [30, 150, 90] }, 1.15); s.br(c2, 210, 'R', 1, G); s.br(c2, 330, 'O', 2, { cls: 'oxy', lp: [270, 0] }, 1.15);
  s.t(2.1, 0, '↔', 'cond', 24);
  const c3 = s.a(8.0, 0, '', { halo: 'o' }); s.br(c3, 90, 'O', '1p', { cls: 'oxy' }, 1.15); s.br(c3, 210, 'R', 1, G); s.br(c3, 330, 'O', '1p', { cls: 'oxy' }, 1.15); s.t(8.0, -2.0, 'δ−   (C–O ≈ 1,26 Å)   δ−', 'cond', 12); s.t(6.1, 0, '≡ híbrido:', 'cond', 13);
  return s;
}
