/*
 * co2d.js — desenhos 2D: estruturas esqueléticas a partir de SMILES (com a
 * carbonila destacada), ressonância, mecanismos (adição nucleofílica,
 * transferência de hidreto com NaBH₄/LiAlH₄, DIBAL-H com éster, oxidação por
 * Cr(VI), hidratação, ozonólise) como quadros com setas curvas.
 */
import { h } from './widgets2d.js';
import { S } from './chem2d.js';
import { parseSmiles } from './chem.js';
import { layout, drawSVG } from './depict.js';
import { svgS } from './arom2d.js';
import { COMP } from './data.js';

/** estrutura esquelética; destaca C=O (C laranja, O ciano) */
export function sk(x, o = {}) {
  const m = typeof x === 'string' ? parseSmiles(COMP[x] ? COMP[x].smi : x) : x;
  const P = layout(m);
  const hl = {}, halo = {};
  if (o.hl !== false) m.bonds.forEach((b) => { if (b.o === 2) { const [c, oo] = m.atoms[b.a].el === 'C' && m.atoms[b.b].el === 'O' ? [b.a, b.b] : m.atoms[b.b].el === 'C' && m.atoms[b.a].el === 'O' ? [b.b, b.a] : [null, null]; if (c !== null) { hl[oo] = 'oxy'; halo[c] = 'o'; } } });
  m.atoms.forEach((a, i) => { if (a.el === 'O' && !hl[i]) hl[i] = 'oxy2'; });
  Object.assign(halo, o.halo || {});
  return drawSVG(m, P, { scale: o.scale || 34, fs: o.fs || 15, zoom: o.zoom || 1.2, hl: Object.assign(hl, o.hlx || {}), halo, alt: o.alt || (COMP[x] && COMP[x].name) || 'estrutura' });
}
export const fig = (x, o = {}) => h('figure', { class: 'fig' + (o.cls ? ' ' + o.cls : '') }, sk(x, o), o.cap === false ? null : h('figcaption', { html: o.cap || (COMP[x] ? COMP[x].name : '') }));
export const figs = (...list) => h('div', { class: 'figs' }, list.map((x) => (Array.isArray(x) ? fig(x[0], x[1] || {}) : fig(x))));
export const svgOf = (s, o = {}) => svgS(s, Object.assign({ scale: 44, fs: 18, zoom: 1.2 }, o));

/* ---------- blocos ---------- */
const at = (s, x, y, t, opt) => s.a(x, y, t, opt || {});
/** carbonila R(R')C=O no ponto (x, y): devolve índices */
function carbonyl(s, x = 0, y = 0, R = 'R', R2 = 'R′', o = {}) {
  const c = at(s, x, y, '', { halo: o.haloC === false ? undefined : 'o' });
  const oo = at(s, x, y - 1.2, 'O', { cls: 'oxy', lp: o.lp || [45, 135], chg: o.oChg });
  const r1 = at(s, x - 1.05, y + 0.6, R, { cls: 'grey' }), r2 = at(s, x + 1.05, y + 0.6, R2, { cls: 'grey' });
  s.b(c, oo, o.single ? 1 : 2); s.b(c, r1, 1); s.b(c, r2, 1);
  return { c, o: oo, r1, r2 };
}

/* ===================================================================
 * Ressonância da carbonila
 * =================================================================== */
export function resonanceS() {
  const s = new S();
  const A = carbonyl(s, 0, 0, 'R', 'R′', { lp: [45, 135] });
  s.arrow({ b: [A.c, A.o] }, { a: A.o, ang: 0 }, 0.5, '');
  s.t(2.2, -0.45, '↔', 'res', 26);
  const c2 = at(s, 4.2, 0, '', { chg: '+', halo: 'o' }), o2 = at(s, 4.2, -1.2, 'O', { cls: 'oxy', chg: '−', lp: [45, 135, 90] });
  const a1 = at(s, 3.15, 0.6, 'R', { cls: 'grey' }), a2 = at(s, 5.25, 0.6, 'R′', { cls: 'grey' }); s.b(c2, o2, 1); s.b(c2, a1, 1); s.b(c2, a2, 1);
  s.t(0, 1.5, 'contribuinte principal', 'cond', 13); s.t(4.2, 1.5, 'contribuinte minoritário (separação de cargas)', 'cond', 13);
  return s;
}
export function hybridS() {
  const s = new S();
  const c = at(s, 0, 0, '', { halo: 'o', d: '+', dd: [0.45, 0.25] }), oo = at(s, 0, -1.2, 'O', { cls: 'oxy', d: '−', dd: [0.55, 0] });
  const r1 = at(s, -1.05, 0.6, 'R', { cls: 'grey' }), r2 = at(s, 1.05, 0.6, 'R′', { cls: 'grey' });
  s.b(c, oo, '1p'); s.b(c, r1, 1); s.b(c, r2, 1);
  s.t(0, 1.5, 'híbrido: dupla polarizada Cδ+=Oδ−', 'cond', 13);
  return s;
}

/* ===================================================================
 * Adição nucleofílica genérica
 * =================================================================== */
export function addFrames(o = {}) {
  const Nu = o.nu || 'Nu';
  const F = [];
  { const s = new S(); const A = carbonyl(s, 0, 0); const n = at(s, -2.3, -0.7, Nu, { chg: '−', cls: 'nu', lp: [0] }); s.arrow({ lp: [n, 0] }, { a: A.c, ang: 160 }, -0.3, 'm'); s.arrow({ b: [A.c, A.o] }, { a: A.o, ang: 0 }, 0.5, 'm'); F.push({ s, stage: 0, cap: `<b>Ataque:</b> o par do ${Nu}⁻ forma a ligação com o <b>carbono</b> carbonílico (δ+, maior coeficiente no π*). Ao mesmo tempo o par π da C=O vai para o oxigênio.` }); }
  { const s = new S(); const c = at(s, 0, 0, '', { halo: 'v' }); const oo = at(s, 0, -1.25, 'O', { cls: 'oxy', chg: '−', lp: [0, 90, 180] }); const n = at(s, -1.15, 0.3, Nu, { cls: 'nu' }); const r1 = at(s, 0.55, 1.05, 'R', { cls: 'grey' }); const r2 = at(s, 1.15, 0.3, 'R′', { cls: 'grey' }); s.b(c, oo, 1); s.b(c, n, 'w'); s.b(c, r1, 1); s.b(c, r2, 'h'); s.t(0, 2.0, 'intermediário tetraédrico (C ≈ sp³), alcóxido', 'cond', 13); F.push({ s, stage: 2, cap: '<b>Intermediário tetraédrico:</b> o carbono passou de sp² (trigonal) a ≈ sp³ (tetraédrico); o O ficou com três pares e carga −: <b>alcóxido</b>.' }); }
  { const s = new S(); const c = at(s, 0, 0, ''); const oo = at(s, 0, -1.25, 'O', { cls: 'oxy', chg: '−', lp: [0, 180] }); const n = at(s, -1.15, 0.3, Nu, { cls: 'nu' }); const r1 = at(s, 0.55, 1.05, 'R', { cls: 'grey' }); const r2 = at(s, 1.15, 0.3, 'R′', { cls: 'grey' }); s.b(c, oo, 1); s.b(c, n, 'w'); s.b(c, r1, 1); s.b(c, r2, 'h'); const hh = at(s, 1.3, -1.9, 'H'), so = at(s, 2.5, -1.9, 'OR'); s.b(hh, so, 1); s.arrow({ lp: [oo, 90] }, { a: hh, ang: 180 }, -0.4, 'm'); s.arrow({ b: [hh, so] }, { a: so, ang: 90 }, -0.6, 'm'); F.push({ s, stage: 3, cap: '<b>Protonação:</b> o alcóxido (base) retira H⁺ de uma fonte prótica (solvente ou H₃O⁺ no workup).' }); }
  { const s = new S(); const c = at(s, 0, 0, ''); const oo = at(s, 0, -1.25, 'OH', { cls: 'prod' }); const n = at(s, -1.15, 0.3, Nu, { cls: 'nu' }); const r1 = at(s, 0.55, 1.05, 'R', { cls: 'grey' }); const r2 = at(s, 1.15, 0.3, 'R′', { cls: 'grey' }); s.b(c, oo, 1); s.b(c, n, 'w'); s.b(c, r1, 1); s.b(c, r2, 'h'); F.push({ s, stage: 4, cap: '<b>Produto:</b> R₂C(OH)Nu.' }); }
  return F;
}

/* ===================================================================
 * Redução por hidreto (NaBH₄ / LiAlH₄)
 * =================================================================== */
export function hydrideFrames(rg = 'NaBH4', o = {}) {
  const M = rg === 'LiAlH4' ? 'Al' : 'B', R1 = o.R1 || 'H₃C', R2 = o.R2 || 'CH₃';
  const F = [];
  { const s = new S(); const A = carbonyl(s, 0, 0, R1, R2); const m = at(s, -3.2, -0.9, M + 'H₃', { chg: '−', cls: 'red' }); const hh = at(s, -2.0, -0.55, 'H', { cls: 'hyd' }); s.b(m, hh, 1); s.arrow({ b: [m, hh] }, { a: A.c, ang: 165 }, -0.45, 'm'); s.arrow({ b: [A.c, A.o] }, { a: A.o, ang: 0 }, 0.5, 'm'); F.push({ s, stage: 1, cap: `<b>Transferência de hidreto equivalente:</b> o par da ligação ${M}–H ataca o carbono carbonílico (Cδ+); o par π da C=O desloca-se para o O. ${rg === 'LiAlH4' ? 'Al–H é mais polarizada (Al menos eletronegativo que B): LiAlH₄ é muito mais reativo.' : 'Não há H⁻ livre: o hidreto é transferido diretamente do BH₄⁻.'}` }); }
  { const s = new S(); const c = at(s, 0, 0, '', { halo: 'v' }); const oo = at(s, 0, -1.25, 'O', { cls: 'oxy', chg: '−', lp: [0, 90, 180] }); const hh = at(s, -1.15, 0.3, 'H', { cls: 'hyd' }); const r1 = at(s, 0.55, 1.05, R1, { cls: 'grey' }); const r2 = at(s, 1.15, 0.3, R2, { cls: 'grey' }); s.b(c, oo, 1); s.b(c, hh, 'w'); s.b(c, r1, 1); s.b(c, r2, 'h'); at(s, -2.4, -1.3, M + 'H₃', { cls: 'red' }); s.t(0, 2.0, 'alcóxido (sp³); o O⁻ fica associado ao ' + M, 'cond', 13); F.push({ s, stage: 2, cap: `<b>Alcóxido tetraédrico.</b> ${rg === 'NaBH4' ? 'O BH₃ pode seguir transferindo hidretos (até 4 por BH₄⁻) como alcoxiboratos.' : 'Forma-se um alcóxido de alumínio; o reagente ainda pode transferir outros hidretos.'} <i>Representação mecanística simplificada.</i>` }); }
  { const s = new S(); const c = at(s, 0, 0, ''); const oo = at(s, 0, -1.25, 'O', { cls: 'oxy', chg: '−', lp: [0, 180] }); const hh = at(s, -1.15, 0.3, 'H', { cls: 'hyd' }); const r1 = at(s, 0.55, 1.05, R1, { cls: 'grey' }); const r2 = at(s, 1.15, 0.3, R2, { cls: 'grey' }); s.b(c, oo, 1); s.b(c, hh, 'w'); s.b(c, r1, 1); s.b(c, r2, 'h'); const hp = at(s, 1.3, -1.9, 'H'), so = at(s, 2.6, -1.9, rg === 'NaBH4' ? 'OCH₃' : 'OH₂', { chg: rg === 'NaBH4' ? undefined : '+' }); s.b(hp, so, 1); s.arrow({ lp: [oo, 90] }, { a: hp, ang: 180 }, -0.4, 'm'); s.arrow({ b: [hp, so] }, { a: so, ang: 90 }, -0.6, 'm'); F.push({ s, stage: 3, cap: rg === 'NaBH4' ? '<b>Protonação</b> pelo solvente prótico (MeOH/EtOH) ou no workup.' : '<b>Workup aquoso (H₃O⁺), etapa separada:</b> o LiAlH₄ reagiria vigorosamente com a água, por isso a protonação é feita só depois de a redução terminar.' }); }
  { const s = new S(); const c = at(s, 0, 0, ''); const oo = at(s, 0, -1.25, 'OH', { cls: 'prod' }); const hh = at(s, -1.15, 0.3, 'H', { cls: 'hyd' }); const r1 = at(s, 0.55, 1.05, R1, { cls: 'grey' }); const r2 = at(s, 1.15, 0.3, R2, { cls: 'grey' }); s.b(c, oo, 1); s.b(c, hh, 'w'); s.b(c, r1, 1); s.b(c, r2, 'h'); s.t(0, 2.0, R2 === 'H' ? 'álcool primário' : 'álcool secundário', 'cond', 14); F.push({ s, stage: 4, cap: '<b>Álcool:</b> houve <b>redução</b> (ganho de uma ligação C–H, perda de uma ligação C–O).' }); }
  return F;
}

/* ===================================================================
 * DIBAL-H + éster → aldeído
 * =================================================================== */
export function dibalFrames() {
  const F = [];
  const ester = (s, x, y, oChg) => { const c = at(s, x, y, '', { halo: 'o' }); const oo = at(s, x, y - 1.2, 'O', { cls: 'oxy', chg: oChg, lp: oChg ? [135] : [45, 135] }); const r = at(s, x - 1.05, y + 0.6, 'R', { cls: 'grey' }); const or = at(s, x + 1.05, y + 0.6, 'OR′', { cls: 'oxy2' }); s.b(c, oo, 2); s.b(c, r, 1); s.b(c, or, 1); return { c, o: oo, or }; };
  { const s = new S(); const E = ester(s, 0, 0); const al = at(s, 2.2, -2.2, 'Al', { cls: 'red' }); at(s, 3.3, -2.2, '(i-Bu)₂', { cls: 'grey' }); const hh = at(s, 2.2, -3.2, 'H', { cls: 'hyd' }); s.b(al, hh, 1); s.arrow({ lp: [E.o, 45] }, { a: al, ang: 180 }, -0.3, 'o'); F.push({ s, stage: 0, cap: '<b>1. Coordenação:</b> o Al do DIBAL-H tem orbital vazio (ácido de Lewis) e recebe um par do O carbonílico — o C fica ainda mais eletrofílico.' }); }
  { const s = new S(); const E = ester(s, 0, 0, '+'); const al = at(s, 1.4, -2.0, 'Al', { cls: 'red', chg: '−' }); const hh = at(s, 0.1, -2.6, 'H', { cls: 'hyd' }); s.b(E.o, al, 1); s.b(al, hh, 1); s.arrow({ b: [al, hh] }, { a: E.c, ang: 120 }, 0.5, 'm'); s.arrow({ b: [E.c, E.o] }, { a: E.o, ang: 0 }, 0.5, 'm'); F.push({ s, stage: 1, cap: '<b>2. Transferência intramolecular de hidreto</b> do Al ao carbono carbonílico. <i>Representação mecanística simplificada.</i>' }); }
  { const s = new S(); const c = at(s, 0, 0, '', { halo: 'v' }); const oo = at(s, 0, -1.25, 'O', { cls: 'oxy' }); const al = at(s, 1.2, -1.9, 'Al(i-Bu)₂', { cls: 'red' }); const hh = at(s, -1.15, 0.3, 'H', { cls: 'hyd' }); const r = at(s, 0.55, 1.05, 'R', { cls: 'grey' }); const or = at(s, 1.15, 0.3, 'OR′', { cls: 'oxy2' }); s.b(c, oo, 1); s.b(oo, al, 1); s.b(c, hh, 'w'); s.b(c, r, 1); s.b(c, or, 'h'); s.t(0, 2.0, 'intermediário tetraédrico estável a −78 °C', 'cond', 13); F.push({ s, stage: 2, cap: '<b>3. Intermediário tetraédrico</b> (hemiacetal de alumínio). A baixa temperatura ele <b>não colapsa</b>: não se forma aldeído livre que pudesse ser reduzido de novo.' }); }
  { const s = new S(); const c = at(s, 0, 0, '', { halo: 'o' }); const oo = at(s, 0, -1.2, 'O', { cls: 'oxy', lp: [45, 135] }); const r = at(s, -1.05, 0.6, 'R', { cls: 'grey' }); const hh = at(s, 1.05, 0.6, 'H', { cls: 'hyd' }); s.b(c, oo, 2); s.b(c, r, 1); s.b(c, hh, 1); s.t(2.9, -0.2, '+  R′OH', 'cond', 16); F.push({ s, stage: 4, cap: '<b>4. Workup:</b> a hidrólise libera o <b>aldeído</b> (e R′OH). A seletividade depende de temperatura, equivalentes, solvente e workup — com excesso de DIBAL-H ou aquecimento, forma-se o álcool.' }); }
  return F;
}

/* ===================================================================
 * Oxidação por Cr(VI)
 * =================================================================== */
function chromic(s, x, y, o = {}) {
  const cr = at(s, x, y, 'Cr', { cls: 'cr' });
  const a = at(s, x, y - 1.15, 'O', { cls: 'oxy2' }), b = at(s, x + 1.15, y, 'O', { cls: 'oxy2' }), c = at(s, x, y + 1.15, o.bottom || 'OH', { cls: 'oxy2' });
  s.b(cr, a, 2); s.b(cr, b, 2); s.b(cr, c, 1);
  return { cr, a, b, c };
}
export function crFrames() {
  const F = [];
  { const s = new S(); const c = at(s, 0, 0, ''); const hh = at(s, 0, 1.1, 'H', { cls: 'hb' }); const r1 = at(s, -1.0, -0.55, 'R', { cls: 'grey' }); const r2 = at(s, -1.0, 0.55, 'R′', { cls: 'grey' }); const oo = at(s, 1.1, -0.6, 'OH', { cls: 'oxy', lp: [90] }); s.b(c, hh, 1); s.b(c, r1, 1); s.b(c, r2, 1); s.b(c, oo, 1); const K = chromic(s, 3.4, -0.6); const lo = at(s, 2.25, -0.6, 'HO', { cls: 'oxy2' }); s.b(lo, K.cr, 1); s.arrow({ lp: [oo, 90] }, { a: K.cr, ang: 120 }, -0.45, 'o'); F.push({ s, stage: 0, cap: '<b>1.</b> O oxigênio do álcool ataca o Cr(VI) do ácido crômico (H₂CrO₄, formado do CrO₃ em ácido). Após transferências de próton, sai H₂O. <i>Representação mecanística simplificada.</i>' }); }
  { const s = new S(); const c = at(s, 0, 0, ''); const hh = at(s, 0, 1.1, 'H', { cls: 'hb', halo: 'g' }); const r1 = at(s, -1.0, -0.55, 'R', { cls: 'grey' }); const r2 = at(s, -1.0, 0.55, 'R′', { cls: 'grey' }); const oo = at(s, 1.1, -0.6, 'O', { cls: 'oxy' }); s.b(c, hh, 1); s.b(c, r1, 1); s.b(c, r2, 1); s.b(c, oo, 1); const K = chromic(s, 2.3, -0.6); s.b(oo, K.cr, 1); s.t(1.2, 2.1, 'éster de cromato: R₂CH–O–CrO₃H', 'cond', 13); F.push({ s, stage: 1, cap: '<b>2. Éster de cromato.</b> Note o <b>H no carbono</b> que porta o O (destacado): ele é indispensável para a etapa seguinte.' }); }
  { const s = new S(); const c = at(s, 0, 0, ''); const hh = at(s, 0, 1.1, 'H', { cls: 'hb' }); const r1 = at(s, -1.0, -0.55, 'R', { cls: 'grey' }); const r2 = at(s, -1.0, 0.55, 'R′', { cls: 'grey' }); const oo = at(s, 1.1, -0.6, 'O', { cls: 'oxy' }); s.b(c, hh, 1); s.b(c, r1, 1); s.b(c, r2, 1); s.b(c, oo, 1); const K = chromic(s, 2.3, -0.6); s.b(oo, K.cr, 1); const w = at(s, 1.4, 2.0, 'OH₂', { cls: 'base', lp: [180] }); s.arrow({ lp: [w, 180] }, { a: hh, ang: 0 }, 0.35, 'o'); s.arrow({ b: [c, hh] }, { b: [c, oo] }, -0.6, 'm'); s.arrow({ b: [oo, K.cr] }, { a: K.cr, ang: 200 }, -0.6, 'm'); F.push({ s, stage: 2, cap: '<b>3. Etapa tipo eliminação (E2-like):</b> a base (H₂O) remove o H do carbono; o par C–H forma a ligação π C=O; a ligação O–Cr se rompe e os elétrons vão para o Cr.' }); }
  { const s = new S(); const c = at(s, 0, 0, '', { halo: 'o' }); const oo = at(s, 1.05, -0.6, 'O', { cls: 'oxy', lp: [45, 315] }); const r1 = at(s, -1.0, -0.55, 'R', { cls: 'grey' }); const r2 = at(s, -1.0, 0.55, 'R′', { cls: 'grey' }); s.b(c, oo, 2); s.b(c, r1, 1); s.b(c, r2, 1); s.t(3.3, 0, '+  H₃O⁺  +  H₂CrO₃ (Cr(IV))', 'cond', 15); F.push({ s, stage: 4, cap: '<b>4. Carbonila formada</b> (C sp²) e cromo <b>reduzido</b> de Cr(VI) a Cr(IV) (que segue reagindo até Cr(III), verde). O álcool foi <b>oxidado</b>.' }); }
  return F;
}
/* hidratação do aldeído */
export function hydrateS() {
  const s = new S();
  const A = carbonyl(s, 0, 0, 'R', 'H'); void A;
  s.t(1.9, -0.3, '+ H₂O', 'cond', 16); s.t(3.3, -0.3, '⇌', 'res', 28);
  const c = at(s, 5.2, -0.3, ''); const o1 = at(s, 5.2, -1.5, 'OH', { cls: 'oxy' }), o2 = at(s, 6.3, 0.2, 'OH', { cls: 'oxy' }), r = at(s, 4.1, 0.2, 'R', { cls: 'grey' }), hh = at(s, 5.2, 0.9, 'H', { cls: 'hb' }); s.b(c, o1, 1); s.b(c, o2, 1); s.b(c, r, 1); s.b(c, hh, 1);
  s.t(5.2, 1.8, 'hidrato (gem-diol): ainda tem H no C', 'cond', 13);
  return s;
}
/* mecanismo avançado da ozonólise (esquema) */
export function ozoFrames() {
  const F = [];
  const ring5 = (s, x, y, labs, cls) => { const ids = labs.map((l, k) => { const t = (-90 + 72 * k) * Math.PI / 180; return at(s, x + 0.85 * Math.cos(t), y + 0.85 * Math.sin(t), l, { cls: l === 'O' ? 'oxy' : cls || '' }); }); for (let k = 0; k < 5; k++) s.b(ids[k], ids[(k + 1) % 5], 1); return ids; };
  { const s = new S(); const c1 = at(s, -0.6, 0.8, ''), c2 = at(s, 0.6, 0.8, ''); s.b(c1, c2, 2); at(s, -1.4, 1.3, 'R', { cls: 'grey' }); at(s, 1.4, 1.3, 'R', { cls: 'grey' }); s.b(c1, 2, 1); s.b(c2, 3, 1); const o1 = at(s, -0.9, -0.8, 'O', { cls: 'oxy', chg: '−' }), o2 = at(s, 0, -1.4, 'O', { cls: 'oxy', chg: '+' }), o3 = at(s, 0.9, -0.8, 'O', { cls: 'oxy' }); s.b(o1, o2, 1); s.b(o2, o3, 2); s.arrow({ b: [c1, c2] }, { a: o3, ang: 270 }, -0.3, 'm'); s.arrow({ a: o1, ang: 300 }, { a: c1, ang: 90 }, 0.3, 'm'); F.push({ s, cap: '<b>1.</b> Cicloadição 1,3-dipolar do O₃ à C=C. <i>Modo avançado; representação simplificada.</i>' }); }
  { const s = new S(); ring5(s, 0, 0, ['O', 'O', 'C', 'C', 'O']); s.t(0, 1.5, 'molozonídeo (1,2,3-trioxolano), instável', 'cond', 13); F.push({ s, cap: '<b>2.</b> Molozonídeo: fragmenta-se em um composto carbonílico e um óxido de carbonila.' }); }
  { const s = new S(); ring5(s, 0, 0, ['O', 'C', 'O', 'O', 'C']); s.t(0, 1.5, 'ozonídeo (1,2,4-trioxolano)', 'cond', 13); F.push({ s, cap: '<b>3.</b> Recombinação → ozonídeo, que contém a ligação O–O (peróxido).' }); }
  { const s = new S(); const A = carbonyl(s, 0, 0, 'R', 'H'); const B = carbonyl(s, 3.2, 0, 'R', 'R'); void A; void B; s.t(1.6, -0.4, '+', 'cond', 22); F.push({ s, cap: '<b>4. Workup:</b> Zn/H₂O ou Me₂S (redutivo) reduz a ligação O–O → aldeídos/cetonas. H₂O₂ (oxidativo) → ácidos a partir dos fragmentos aldeídicos.' }); }
  return F;
}
