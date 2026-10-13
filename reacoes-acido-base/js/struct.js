/*
 * struct.js — estruturas 2D (espécies, quadros de mecanismos e quebra-cabeças
 * de setas curvas). Convenções: x para a direita, y para baixo, 1 = ligação.
 * Ângulos de pares livres: 0 = direita, 90 = cima, 180 = esquerda, 270 = baixo.
 * Classes: 'nuc' (rico em elétrons, ciano), 'elc' (pobre em elétrons, laranja).
 */
import { S } from './chem2d.js';

export function clone(src) {
  const s = new S();
  s.atoms = src.atoms.map((a) => [a[0], a[1], a[2], JSON.parse(JSON.stringify(a[3]))]);
  s.bonds = src.bonds.map((b) => [b[0], b[1], b[2], Object.assign({}, b[3])]);
  s.texts = src.texts.map((t) => t.slice());
  s.rxn = src.rxn.map((r) => r.slice());
  s.dots = (src.dots || []).map((d) => d.slice());
  s.arrows = [];
  return s;
}
const lab = (s, x, y, t, opt) => s.a(x, y, t, opt || {});

/* ===================================================================
 * Ligação A–B: homólise e heterólise genéricas
 * =================================================================== */
export function abFrames(kind) {
  const base = (dots = true) => { const s = new S(); const A = lab(s, 0, 0, 'A'), B = lab(s, 2.4, 0, 'B'); s.b(A, B); if (dots) s.e(1.2, -0.3, 2, 'bond'); return { s, A, B }; };
  const f0 = base();
  if (kind === 'homo') {
    const f1 = base(); f1.s.arrow({ xy: [1.12, -0.36] }, { a: f1.A, ang: 80 }, 0.75, 'h'); f1.s.arrow({ xy: [1.28, -0.36] }, { a: f1.B, ang: 100 }, -0.75, 'h');
    const p = new S(); lab(p, 0, 0, 'A', { rad: [0] }); p.plus(1.2, 0); lab(p, 2.4, 0, 'B', { rad: [180] });
    return [{ s: f0.s, cap: 'Ligação covalente A–B: <b>dois elétrons</b> compartilhados.' }, { s: f1.s, cap: '<b>Homólise</b>: duas setas de <b>meia ponta</b> — cada uma leva <b>um</b> elétron para um átomo.' }, { s: p, cap: 'Produtos: dois <b>radicais</b> (A• e •B), cada um com um elétron desemparelhado.' }];
  }
  const f1 = base(); f1.s.arrow({ xy: [1.2, -0.36] }, { a: f1.B, ang: 100 }, -0.7, '');
  const p = new S(); lab(p, 0, 0, 'A', { chg: '+', cls: 'elc' }); p.plus(1.2, 0); lab(p, 2.4, 0, 'B', { chg: '−', lp: [90, 0, 270, 180], cls: 'nuc' });
  return [{ s: f0.s, cap: 'Ligação A–B (B mais eletronegativo).' }, { s: f1.s, cap: '<b>Heterólise</b>: uma seta <b>completa</b> — o par inteiro vai para B.' }, { s: p, cap: 'Produtos: <b>íons</b>. B fica com o par (B⁻); A fica com orbital vazio (A⁺).' }];
}

/* ---------- Cl–Cl (luz) e t-butil brometo ---------- */
export function clclFrames() {
  const r = new S(); const a = lab(r, 0, 0, 'Cl', { lp: [90, 180, 270] }), b = lab(r, 1.5, 0, 'Cl', { lp: [90, 0, 270] }); r.b(a, b); r.e(0.75, -0.3, 2, 'bond');
  const r1 = clone(r); r1.arrow({ xy: [0.75, -0.32] }, { a: 0, ang: 70 }, 0.6, 'h'); r1.arrow({ xy: [0.75, -0.32] }, { a: 1, ang: 110 }, -0.6, 'h'); r1.t(0.75, 1.0, 'luz (hν) ou calor', 'cond', 13);
  const p = new S(); lab(p, 0, 0, 'Cl', { lp: [90, 180, 270], rad: [0] }); p.plus(1.2, 0); lab(p, 2.4, 0, 'Cl', { lp: [90, 0, 270], rad: [180] });
  return [{ s: r, cap: 'Cl₂: ligação apolar — nenhum átomo "puxa" mais o par.' }, { s: r1, cap: 'Com luz ou calor, a ligação se rompe <b>homoliticamente</b> (setas de meia ponta).' }, { s: p, cap: 'Dois radicais cloro (Cl•), cada um com <b>7 elétrons</b> de valência: muito reativos.' }];
}
export function tbu(o = {}) {
  const s = new S(); const C = lab(s, 0, 0, o.cation ? 'C' : 'C', o.cation ? { chg: '+', cls: 'elc' } : {});
  lab(s, -0.95, -0.55, 'H3C'); lab(s, -0.95, 0.65, 'H3C'); s.b(C, 1); s.b(C, 2);
  if (o.cation) { lab(s, 0.95, 0.55, 'CH3'); s.b(C, 3); } else lab(s, 0, -1, 'CH3'), s.b(C, 3);
  return s;
}
export function tbuBrFrames() {
  const r = tbu(); const Br = lab(r, 1.2, 0, 'Br', { lp: [90, 0, 270], d: '−', dd: [0, -0.75] }); r.atoms[0][3] = { d: '+', dd: [0.15, 0.7] }; r.b(0, Br); r.e(0.6, -0.28, 2, 'bond');
  const r1 = clone(r); r1.arrow({ b: [0, Br] }, { a: Br, ang: 90 }, -0.7, '');
  const p = tbu({ cation: true }); p.plus(1.9, 0); lab(p, 2.9, 0, 'Br', { chg: '−', lp: [90, 0, 270, 180], cls: 'nuc' });
  return [{ s: r, cap: 'C–Br polarizada: Cδ+ e Brδ− (Br é mais eletronegativo).' }, { s: r1, cap: '<b>Heterólise</b>: o par da ligação C–Br vai para o Br.' }, { s: p, cap: 'Carbocátion terciário (sp², orbital p vazio) + íon brometo (8 elétrons, carga −1). Em solvente polar, a solvatação dos íons ajuda.' }];
}
/** álcool protonado → carbocátion + água */
export function oxoniumFrames() {
  const r = tbu(); const O = lab(r, 1.2, 0, 'O', { chg: '+', lp: [270] }); lab(r, 1.85, 0.6, 'H'); lab(r, 1.85, -0.6, 'H'); r.b(0, O); r.b(O, 5); r.b(O, 6);
  const r1 = clone(r); r1.arrow({ b: [0, O] }, { a: O, ang: 270 }, 0.6, '');
  const p = tbu({ cation: true }); p.plus(1.9, 0); const O2 = lab(p, 3.1, 0, 'O', { lp: [90, 270] }); lab(p, 2.6, 0.6, 'H'); lab(p, 3.6, 0.6, 'H'); p.b(O2, 5); p.b(O2, 6);
  return [{ s: r, cap: 'Álcool protonado: o O⁺ torna a ligação C–O muito polarizada.' }, { s: r1, cap: 'Heterólise C–O: o par vai para o O, que sai como <b>água neutra</b> (bom grupo abandonador).' }, { s: p, cap: 'Carbocátion + H₂O: o O passou de 3 ligações + 1 par (carga +) para 2 ligações + 2 pares (neutro).' }];
}
export function hclFrames() {
  const r = new S(); const H = lab(r, 0, 0, 'H', { d: '+', dd: [0, -0.7] }), Cl = lab(r, 1.3, 0, 'Cl', { lp: [90, 0, 270], d: '−', dd: [0, -0.8] }); r.b(H, Cl);
  const r1 = clone(r); r1.arrow({ b: [H, Cl] }, { a: Cl, ang: 90 }, -0.7, '');
  const p = new S(); lab(p, 0, 0, 'H', { chg: '+', cls: 'elc' }); p.plus(1.0, 0); lab(p, 2.0, 0, 'Cl', { chg: '−', lp: [90, 0, 270, 180], cls: 'nuc' });
  return [{ s: r, cap: 'H–Cl: Cl é mais eletronegativo (Hδ+, Clδ−).' }, { s: r1, cap: 'Heterólise: o par fica com o Cl.' }, { s: p, cap: 'H⁺ + Cl⁻. Em água, o H⁺ não fica livre: é transferido a uma molécula de H₂O (H₃O⁺).' }];
}

/* ===================================================================
 * Formação de ligação: Nu⁻ + E⁺; cátion + água
 * =================================================================== */
export function nuEFrames() {
  const r = new S(); lab(r, 0, 0, 'Nu', { chg: '−', lp: [0, 90, 270], cls: 'nuc' }); r.plus(1.1, 0.0); lab(r, 2.2, 0, 'E', { chg: '+', cls: 'elc' });
  const r1 = clone(r); r1.texts = []; r1.atoms[1][0] = 1.6; r1.arrow({ lp: [0, 0] }, { a: 1, ang: 180 }, -0.5, '');
  const p = new S(); const a = lab(p, 0, 0, 'Nu'), b = lab(p, 1.3, 0, 'E'); p.b(a, b); p.e(0.65, -0.3, 2, 'bond');
  return [{ s: r, cap: 'Nucleófilo (rico em elétrons, par livre) e eletrófilo (pobre em elétrons).' }, { s: r1, cap: 'A seta sai do <b>par livre</b> do Nu e termina no <b>E</b>: é ali que a nova ligação se forma.' }, { s: p, cap: 'Nova ligação Nu–E: o par livre virou par <b>compartilhado</b>. Carga total: (−1) + (+1) = 0 → 0.' }];
}
export function cationWaterFrames() {
  const r = tbu({ cation: true }); const O = lab(r, 2.2, 0, 'O', { lp: [90, 270], cls: 'nuc' }); lab(r, 2.75, 0.6, 'H'); lab(r, 2.75, -0.6, 'H'); r.b(O, 5); r.b(O, 6);
  const r1 = clone(r); r1.arrow({ lp: [O, 90] }, { a: 0, ang: 30 }, 0.5, '');
  const p = tbu(); const O2 = lab(p, 1.25, 0, 'O', { chg: '+', lp: [270] }); lab(p, 1.85, 0.6, 'H'); lab(p, 1.85, -0.6, 'H'); p.b(0, O2); p.b(O2, 5); p.b(O2, 6);
  return [{ s: r, cap: 'Carbocátion (eletrófilo) e água (nucleófilo fraco, pares livres no O).' }, { s: r1, cap: 'Par livre do O → C⁺.' }, { s: p, cap: 'Íon alquiloxônio: o O agora faz 3 ligações e tem 1 par → carga +1. Carga total conservada (+1).' }];
}

/* ===================================================================
 * Ácido–base
 * =================================================================== */
/** HO⁻ + H–Cl → H₂O + Cl⁻ */
export function hoHclFrames() {
  const r = new S(); const Hb = lab(r, -0.8, 0, 'H'), O = lab(r, 0, 0, 'O', { chg: '−', lp: [90, 270, 0], cls: 'nuc' }); r.b(Hb, O);
  const H = lab(r, 1.6, 0, 'H', { cls: 'elc' }), Cl = lab(r, 2.9, 0, 'Cl', { lp: [90, 0, 270] }); r.b(H, Cl);
  const r1 = clone(r); r1.arrow({ lp: [O, 0] }, { a: H, ang: 150 }, -0.45, ''); r1.arrow({ b: [H, Cl] }, { a: Cl, ang: 90 }, -0.7, '');
  const p = new S(); const h1 = lab(p, -0.8, 0, 'H'), O2 = lab(p, 0, 0, 'O', { lp: [90, 270] }), h2 = lab(p, 0.8, 0, 'H'); p.b(h1, O2); p.b(O2, h2); p.plus(1.7, 0); lab(p, 2.7, 0, 'Cl', { chg: '−', lp: [90, 0, 270, 180] });
  return [
    { s: r, cap: 'HO⁻ (base, par livre) e H–Cl (ácido, Hδ+).' },
    { s: r1, cap: '<b>Duas setas simultâneas</b>: par do O → H; ligação H–Cl → Cl. O H troca uma ligação por outra — nunca fica com duas.' },
    { s: p, cap: 'H₂O + Cl⁻. HO⁻ é base de Brønsted (recebe H⁺) <b>e</b> base de Lewis (doa o par).' },
  ];
}
/** mecanismo didático: HO⁻ + CH3OH ⇌ H2O + CH3O⁻ (5 quadros) */
export function methanolFrames() {
  const base = () => {
    const r = new S(); const Hb = lab(r, -0.8, 0, 'H'), O = lab(r, 0, 0, 'O', { chg: '−', lp: [90, 270, 0], cls: 'nuc' }); r.b(Hb, O);
    const H = lab(r, 1.6, 0, 'H'), O2 = lab(r, 2.6, 0, 'O', { lp: [90, 270] }), C = lab(r, 3.6, 0, 'CH3'); r.b(H, O2); r.b(O2, C);
    return { r, O, H, O2 };
  };
  const a = base(); a.r.atoms[a.H][3] = { cls: 'elc', halo: 'o' };
  const b = base(); b.r.arrow({ lp: [b.O, 0] }, { a: b.H, ang: 150 }, -0.45, '');
  const c = base(); c.r.arrow({ lp: [c.O, 0] }, { a: c.H, ang: 150 }, -0.45, ''); c.r.arrow({ b: [c.H, c.O2] }, { a: c.O2, ang: 90 }, -0.7, '');
  const p = new S(); const h1 = lab(p, -0.8, 0, 'H'), Ow = lab(p, 0, 0, 'O', { lp: [90, 270] }), h2 = lab(p, 0.8, 0, 'H'); p.b(h1, Ow); p.b(Ow, h2); p.plus(1.7, 0);
  const Om = lab(p, 2.7, 0, 'O', { chg: '−', lp: [90, 270, 180], cls: 'nuc', halo: 'c' }), Cm = lab(p, 3.7, 0, 'CH3'); p.b(Om, Cm);
  return [
    { s: a.r, cap: '① A base identifica o <b>H ácido</b>: o H ligado ao O (Hδ+), não os H do CH₃.' },
    { s: b.r, cap: '② O par livre do HO⁻ ataca esse H.' },
    { s: c.r, cap: '③ Ao mesmo tempo, a ligação O–H do metanol se rompe…' },
    { s: c.r, cap: '④ …e os dois elétrons dessa ligação <b>permanecem no O</b> do metanol.' },
    { s: p, cap: '⑤ Formam-se H₂O (ácido conjugado) e CH₃O⁻ (base conjugada). pKa(CH₃OH) ≈ 15,5 e pKa(H₂O) ≈ 15,7: K ≈ 1, o equilíbrio fica próximo do meio.' },
  ];
}
/** BF3 + NH3 */
export function bf3Frames() {
  const r = new S(); const N = lab(r, 0, 0, 'N', { lp: [0], cls: 'nuc' }); lab(r, -0.75, -0.6, 'H'); lab(r, -0.75, 0.6, 'H'); lab(r, -1.0, 0, 'H'); r.b(N, 1); r.b(N, 2); r.b(N, 3);
  const B = lab(r, 2.0, 0, 'B', { cls: 'elc' }); lab(r, 2.75, -0.65, 'F', { lp: [90, 0] }); lab(r, 2.75, 0.65, 'F', { lp: [270, 0] }); lab(r, 2.0, -1.0, 'F', { lp: [90, 180] }); r.b(B, 5); r.b(B, 6); r.b(B, 7);
  const r1 = clone(r); r1.arrow({ lp: [N, 0] }, { a: B, ang: 180 }, -0.4, '');
  const p = new S(); const N2 = lab(p, 0, 0, 'N', { chg: '+' }); lab(p, -0.75, -0.6, 'H'); lab(p, -0.75, 0.6, 'H'); lab(p, -1.0, 0, 'H'); p.b(N2, 1); p.b(N2, 2); p.b(N2, 3);
  const B2 = lab(p, 1.3, 0, 'B', { chg: '−' }); lab(p, 2.0, -0.65, 'F', { lp: [90, 0] }); lab(p, 2.0, 0.65, 'F', { lp: [270, 0] }); lab(p, 1.3, 1.0, 'F', { lp: [270, 180] }); p.b(N2, B2); p.b(B2, 5); p.b(B2, 6); p.b(B2, 7);
  return [
    { s: r, cap: 'NH₃: par livre no N (base de Lewis). BF₃: boro com apenas 6 elétrons e orbital p vazio (ácido de Lewis).' },
    { s: r1, cap: 'Par do N → B. Nenhum próton é transferido: é ácido-base de <b>Lewis</b>.' },
    { s: p, cap: 'Aduto H₃N⁺–B⁻F₃: N com 4 ligações (+1), B com 4 ligações (−1). Carga total 0.' },
  ];
}
/** CN⁻ + CH3Br → CH3CN + Br⁻ (sem detalhar SN2) */
export function cnFrames() {
  const r = new S(); const N = lab(r, -1.2, 0, 'N', { lp: [180] }), C1 = lab(r, 0, 0, 'C', { chg: '−', lp: [0], cls: 'nuc' }); r.b(N, C1, 3);
  const C = lab(r, 1.7, 0, 'C', { d: '+', dd: [0, -0.8], cls: 'elc' }); lab(r, 2.15, -0.75, 'H'); lab(r, 2.15, 0.75, 'H'); lab(r, 1.45, 0.85, 'H'); r.b(C, 3); r.b(C, 4); r.b(C, 5);
  const Br = lab(r, 3.1, 0, 'Br', { lp: [90, 0, 270], d: '−', dd: [0, -0.8] }); r.b(C, Br);
  const r1 = clone(r); r1.arrow({ lp: [C1, 0] }, { a: C, ang: 180 }, -0.4, ''); r1.arrow({ b: [C, Br] }, { a: Br, ang: 90 }, -0.7, '');
  const p = new S(); const n = lab(p, -1.2, 0, 'N', { lp: [180] }), c = lab(p, 0, 0, 'C'); p.b(n, c, 3); const m = lab(p, 1.1, 0, 'CH3'); p.b(c, m); p.plus(2.1, 0); lab(p, 3.1, 0, 'Br', { chg: '−', lp: [90, 0, 270, 180] });
  return [
    { s: r, cap: 'CN⁻: par livre no C (nucleófilo). CH₃Br: carbono δ+ (eletrófilo) ligado ao Br (futuro grupo abandonador).' },
    { s: r1, cap: 'Par do C⁻ → Cδ+ e, ao mesmo tempo, C–Br → Br (o carbono não pode ficar com 5 ligações).' },
    { s: p, cap: 'CH₃CN + Br⁻. Os detalhes (estereoquímica, velocidade) serão estudados em substituição nucleofílica (SN2).' },
  ];
}

/* ===================================================================
 * Ressonância
 * =================================================================== */
export function acetate(form = 0, o = {}) {
  const s = new S(); const C = lab(s, 0, 0, ''); const M = lab(s, -1.0, 0.0, 'H3C'); s.b(M, C);
  const O1 = lab(s, 0.55, -0.85, 'O', form === 0 ? { lp: [90, 30] } : { chg: '−', lp: [90, 30, 150], cls: 'nuc' });
  const O2 = lab(s, 0.55, 0.85, 'O', form === 0 ? { chg: '−', lp: [270, 330, 210], cls: 'nuc' } : { lp: [270, 330] });
  s.b(C, O1, form === 0 ? 2 : 1); s.b(C, O2, form === 0 ? 1 : 2);
  if (o.arrows) { if (form === 0) { s.arrow({ lp: [O2, 330] }, { b: [C, O2] }, 0.9, ''); s.arrow({ b: [C, O1] }, { a: O1, ang: 180 }, 0.6, ''); } }
  return s;
}
export function acetateFrames() {
  const h = new S(); const C = lab(h, 0, 0, ''); const M = lab(h, -1.0, 0, 'H3C'); h.b(M, C); const O1 = lab(h, 0.55, -0.85, 'O', { note: 'δ− (½)', nd: [0.95, -0.05] }); const O2 = lab(h, 0.55, 0.85, 'O', { note: 'δ− (½)', nd: [0.95, 0.05] }); h.b(C, O1, '1p', { side: -1 }); h.b(C, O2, '1p', { side: 1 });
  return [
    { s: acetate(0), cap: 'Forma de ressonância I: carga negativa no O de baixo.' },
    { s: acetate(0, { arrows: true }), cap: 'Setas: par livre do O⁻ forma a π com o C; a π C=O vai para o O de cima. <b>Nenhum átomo se move.</b>' },
    { s: acetate(1), cap: 'Forma II: a carga está no outro O. Mesma conectividade, mesmas posições atômicas.' },
    { s: h, cap: '<b>Híbrido</b>: as duas ligações C–O são iguais (≈ 1,26 Å) e cada O carrega ≈ ½ da carga. O acetato é <b>uma</b> estrutura deslocalizada, não duas alternando.' },
  ];
}
export function ethoxide() { const s = new S(); const a = lab(s, -1.35, 0, 'H3C'), b = lab(s, 0, 0, 'CH2'), O = lab(s, 1.2, 0, 'O', { chg: '−', lp: [90, 0, 270], cls: 'nuc', halo: 'c' }); s.b(a, b); s.b(b, O); return s; }
export function allylFrames() {
  const f = (k, ar) => {
    const s = new S(); const a = lab(s, 0, 0, ''), b = lab(s, 0.87, -0.5, ''), c = lab(s, 1.74, 0, '');
    s.b(a, b, k === 0 ? 2 : 1); s.b(b, c, k === 0 ? 1 : 2);
    s.atoms[k === 0 ? c : a][3] = { chg: '+', cls: 'elc', halo: 'o' };
    lab(s, 0.87, -1.25, 'H'); s.b(b, 3);
    if (ar) s.arrow({ b: [a, b] }, { b: [b, c] }, -0.8, '');
    return s;
  };
  return [{ s: f(0), cap: 'Cátion alílico: C⁺ vizinho a uma C=C.' }, { s: f(0, true), cap: 'Os elétrons π se deslocam em direção ao C⁺ (a seta parte da ligação π).' }, { s: f(1), cap: 'Forma equivalente: a carga + está no outro carbono terminal. A carga fica <b>distribuída</b> por dois carbonos → cátion estabilizado.' }];
}

/* ===================================================================
 * Espécies para figuras e exercícios
 * =================================================================== */
export const SP = {
  water: () => { const s = new S(); const O = lab(s, 0, 0, 'O', { lp: [60, 120] }); lab(s, -0.8, 0.55, 'H'); lab(s, 0.8, 0.55, 'H'); s.b(O, 1); s.b(O, 2); return s; },
  hydronium: () => { const s = new S(); const O = lab(s, 0, 0, 'O', { chg: '+', lp: [90] }); lab(s, -0.85, 0.5, 'H'); lab(s, 0.85, 0.5, 'H'); lab(s, 0, 1, 'H'); s.b(O, 1); s.b(O, 2); s.b(O, 3); return s; },
  hydroxide: () => { const s = new S(); const H = lab(s, -0.9, 0, 'H'), O = lab(s, 0, 0, 'O', { chg: '−', lp: [90, 0, 270], cls: 'nuc' }); s.b(H, O); return s; },
  methyl_cation: () => { const s = new S(); const C = lab(s, 0, 0, 'C', { chg: '+', cls: 'elc' }); lab(s, 0, -1, 'H'); lab(s, -0.87, 0.5, 'H'); lab(s, 0.87, 0.5, 'H'); s.b(C, 1); s.b(C, 2); s.b(C, 3); return s; },
  methyl_anion: () => { const s = new S(); const C = lab(s, 0, 0, 'C', { chg: '−', lp: [90], cls: 'nuc' }); lab(s, 0, 1, 'H'); lab(s, -0.87, -0.4, 'H'); lab(s, 0.87, -0.4, 'H'); s.b(C, 1); s.b(C, 2); s.b(C, 3); return s; },
  methyl_radical: () => { const s = new S(); const C = lab(s, 0, 0, 'C', { rad: [90] }); lab(s, 0, 1, 'H'); lab(s, -0.87, -0.4, 'H'); lab(s, 0.87, -0.4, 'H'); s.b(C, 1); s.b(C, 2); s.b(C, 3); return s; },
  tbu_cation: () => tbu({ cation: true }),
  acetic: () => { const s = new S(); const C = lab(s, 0, 0, ''); lab(s, -1, 0, 'H3C'); s.b(1, C); const O1 = lab(s, 0.55, -0.85, 'O', { lp: [90, 30] }); const O2 = lab(s, 0.55, 0.85, 'O', { lp: [270, 210] }); const H = lab(s, 1.45, 0.85, 'H', { cls: 'elc' }); s.b(C, O1, 2); s.b(C, O2); s.b(O2, H); return s; },
  acetate: () => acetate(0),
  ethanol: () => { const s = new S(); const a = lab(s, -1.35, 0, 'H3C'), b = lab(s, 0, 0, 'CH2'), O = lab(s, 1.2, 0, 'O', { lp: [90, 270] }), H = lab(s, 2.05, 0, 'H', { cls: 'elc' }); s.b(a, b); s.b(b, O); s.b(O, H); return s; },
  ethoxide,
  ammonia: () => { const s = new S(); const N = lab(s, 0, 0, 'N', { lp: [90] }); lab(s, -0.85, 0.5, 'H'); lab(s, 0.85, 0.5, 'H'); lab(s, 0, 1, 'H'); s.b(N, 1); s.b(N, 2); s.b(N, 3); return s; },
  ammonium: () => { const s = new S(); const N = lab(s, 0, 0, 'N', { chg: '+' }); lab(s, -1, 0, 'H'); lab(s, 1, 0, 'H'); lab(s, 0, -1, 'H'); lab(s, 0, 1, 'H'); [1, 2, 3, 4].forEach((k) => s.b(N, k)); return s; },
  amide: () => { const s = new S(); const N = lab(s, 0, 0, 'N', { chg: '−', lp: [90, 0], cls: 'nuc' }); lab(s, -0.85, 0.5, 'H'); lab(s, -0.85, -0.5, 'H'); s.b(N, 1); s.b(N, 2); return s; },
  acetylene: () => { const s = new S(); const a = lab(s, 0, 0, 'H'), b = lab(s, 1, 0, 'C'), c = lab(s, 2.2, 0, 'C'), d = lab(s, 3.2, 0, 'H'); s.b(a, b); s.b(b, c, 3); s.b(c, d); return s; },
  acetylide: () => { const s = new S(); const a = lab(s, 0, 0, 'H'), b = lab(s, 1, 0, 'C'), c = lab(s, 2.2, 0, 'C', { chg: '−', lp: [0], cls: 'nuc' }); s.b(a, b); s.b(b, c, 3); return s; },
  ch3br: () => { const s = new S(); const C = lab(s, 0, 0, 'H3C', { d: '+', dd: [0, -0.7], cls: 'elc' }), Br = lab(s, 1.4, 0, 'Br', { lp: [90, 0, 270], d: '−', dd: [0, -0.8] }); s.b(C, Br); return s; },
  acetone: () => { const s = new S(); const C = lab(s, 0, 0, '', { d: '+', dd: [0.42, -0.3] }); lab(s, -0.95, 0.55, 'H3C'); lab(s, 0.95, 0.55, 'CH3'); const O = lab(s, 0, -1.05, 'O', { lp: [45, 135], d: '−', dd: [-0.7, 0] }); s.b(C, 1); s.b(C, 2); s.b(C, O, 2); return s; },
  bf3: () => { const s = new S(); const B = lab(s, 0, 0, 'B', { cls: 'elc' }); lab(s, 0, -1, 'F', { lp: [90, 0, 180] }); lab(s, -0.87, 0.5, 'F', { lp: [180, 270, 135] }); lab(s, 0.87, 0.5, 'F', { lp: [0, 270, 45] }); s.b(B, 1); s.b(B, 2); s.b(B, 3); return s; },
  hcl: () => { const s = new S(); const H = lab(s, 0, 0, 'H', { d: '+', dd: [0, -0.7] }), Cl = lab(s, 1.3, 0, 'Cl', { lp: [90, 0, 270], d: '−', dd: [0, -0.8] }); s.b(H, Cl); return s; },
  cyanide: () => { const s = new S(); const C = lab(s, 0, 0, 'C', { chg: '−', lp: [180], cls: 'nuc' }), N = lab(s, 1.2, 0, 'N', { lp: [0] }); s.b(C, N, 3); return s; },
  ethene: () => { const s = new S(); const a = lab(s, 0, 0, ''), b = lab(s, 1, 0, ''); s.b(a, b, 2); return s; },
};

/* ===================================================================
 * Quebra-cabeças de setas curvas (para practice.arrowPuzzle)
 * =================================================================== */
const P = {};
P.hoHcl = () => { const s = hoHclFrames()[0].s; return { s, sites: { lpO: { k: 'lp', a: 1, ang: 0, label: 'par livre do O⁻' }, H: { k: 'atom', a: 2, label: 'H do HCl' }, HCl: { k: 'bond', b: [2, 3], label: 'ligação H–Cl' }, Cl: { k: 'atom', a: 3, label: 'Cl' }, O: { k: 'atom', a: 1, label: 'O' }, OH: { k: 'bond', b: [0, 1], label: 'ligação O–H do HO⁻', why: 'A ligação O–H do hidróxido não se rompe: quem doa elétrons é o par livre.' } },
  sources: ['lpO', 'HCl', 'OH'], targets: ['H', 'Cl', 'O', 'HCl'], answer: [['lpO', 'H'], ['HCl', 'Cl']],
  msgs: { 'lpO>Cl': 'O Cl já tem octeto e carga parcial negativa: não aceita o par. O alvo é o H (δ+).', 'HCl>H': 'Os elétrons da ligação vão para o átomo mais eletronegativo, o Cl.', 'lpO>HCl': 'A seta deve terminar no átomo que forma a nova ligação (H), não no meio da ligação H–Cl.' },
  bend: { 'lpO>H': -0.45, 'HCl>Cl': -0.7 }, done: 'H₂O + Cl⁻: O passa de −1 a 0 (3 pares → 2 pares + nova ligação); Cl passa de 0 a −1. Carga total: −1 → −1.' }; };
P.bf3 = () => { const s = bf3Frames()[0].s; return { s, sites: { lpN: { k: 'lp', a: 0, ang: 0, label: 'par livre do N' }, B: { k: 'atom', a: 4, label: 'B' }, F: { k: 'atom', a: 5, label: 'F' }, lpF: { k: 'lp', a: 5, ang: 90, label: 'par livre do F', why: 'O F é muito eletronegativo e não atua como doador aqui; o doador é o N.' }, N: { k: 'atom', a: 0, label: 'N' } },
  sources: ['lpN', 'lpF'], targets: ['B', 'F', 'N'], answer: [['lpN', 'B']], msgs: { 'lpN>F': 'O F já tem octeto completo. O receptor é o B (6 elétrons, orbital p vazio).' }, bend: { 'lpN>B': -0.4 }, done: 'Aduto H₃N⁺–B⁻F₃: N fica com 4 ligações (+1), B com 4 ligações (−1); carga total 0.' }; };
P.cn = () => { const s = cnFrames()[0].s; return { s, sites: { lpC: { k: 'lp', a: 1, ang: 0, label: 'par livre do C⁻' }, lpN: { k: 'lp', a: 0, ang: 180, label: 'par livre do N', why: 'Neste exemplo, o ataque ocorre pelo carbono (C-nucleófilo); o produto é a nitrila CH₃CN.' }, C: { k: 'atom', a: 2, label: 'C do CH₃' }, CBr: { k: 'bond', b: [2, 6], label: 'ligação C–Br' }, Br: { k: 'atom', a: 6, label: 'Br' }, H: { k: 'atom', a: 3, label: 'H do CH₃' } },
  sources: ['lpC', 'lpN', 'CBr'], targets: ['C', 'Br', 'H'], answer: [['lpC', 'C'], ['CBr', 'Br']],
  msgs: { 'lpC>H': 'O CN⁻ não é usado aqui como base; o alvo é o carbono δ+.', 'lpC>Br': 'O Br é δ− e tem octeto: não é o eletrófilo.', 'CBr>C': 'Os elétrons da ligação C–Br vão para o Br (mais eletronegativo).' },
  bend: { 'lpC>C': -0.4, 'CBr>Br': -0.7 }, done: 'Sem a seta C–Br → Br, o carbono ficaria com 5 ligações. Carga: −1 → −1 (no Br⁻).' }; };
P.tbuBr = () => { const s = tbuBrFrames()[0].s; s.dots = []; return { s, sites: { CBr: { k: 'bond', b: [0, 4], label: 'ligação C–Br' }, C: { k: 'atom', a: 0, label: 'C central' }, Br: { k: 'atom', a: 4, label: 'Br' }, lpBr: { k: 'lp', a: 4, ang: 90, label: 'par livre do Br', why: 'Pares livres do Br não participam: o que se rompe é a ligação C–Br.' } },
  sources: ['CBr', 'lpBr'], targets: ['C', 'Br'], answer: [['CBr', 'Br']], msgs: { 'CBr>C': 'O par fica com o átomo mais eletronegativo (Br), gerando Br⁻ e o carbocátion.' }, bend: { 'CBr>Br': -0.7 }, done: 'C⁺ (6 elétrons, orbital p vazio) + Br⁻ (8 elétrons).' }; };
P.cationWater = () => { const s = cationWaterFrames()[0].s; return { s, sites: { lpO: { k: 'lp', a: 4, ang: 90, label: 'par livre do O' }, C: { k: 'atom', a: 0, label: 'C⁺' }, OH: { k: 'bond', b: [4, 5], label: 'ligação O–H', why: 'Uma ligação O–H não é a fonte de elétrons para atacar o C⁺: use o par livre.' }, CH3: { k: 'atom', a: 1, label: 'CH₃' } },
  sources: ['lpO', 'OH'], targets: ['C', 'CH3'], answer: [['lpO', 'C']], msgs: { 'lpO>CH3': 'O eletrófilo é o carbono com carga + (orbital p vazio), não um CH₃.' }, bend: { 'lpO>C': 0.5 }, done: 'Íon oxônio: O com 3 ligações e 1 par (+1).' }; };
P.acetate = () => { const s = acetate(0); return { s, sites: { lpO: { k: 'lp', a: 3, ang: 330, label: 'par livre do O⁻' }, CO2: { k: 'bond', b: [0, 3], label: 'ligação C–O⁻' }, pi: { k: 'bond', b: [0, 2], label: 'ligação π C=O' }, O1: { k: 'atom', a: 2, label: 'O de cima' }, C: { k: 'atom', a: 0, label: 'C' }, M: { k: 'atom', a: 1, label: 'CH₃', why: 'O CH₃ não tem par livre nem ligação π para deslocalizar.' } },
  sources: ['lpO', 'pi', 'M'], targets: ['CO2', 'O1', 'C', 'pi'], answer: [['lpO', 'CO2'], ['pi', 'O1']],
  msgs: { 'lpO>C': 'Para formar a nova ligação π C=O, a seta termina na ligação C–O (posição da nova ligação).', 'pi>C': 'Os elétrons π saem em direção ao O, mais eletronegativo, que fica com a carga.' },
  bend: { 'lpO>CO2': 0.9, 'pi>O1': 0.6 }, done: 'Forma II: carga no O de cima. Só elétrons se moveram; conectividade e posições dos átomos iguais.' }; };
P.waterHBr = () => {
  const s = new S(); const O = lab(s, 0, 0, 'O', { lp: [90, 0], cls: 'nuc' }); lab(s, -0.8, 0.55, 'H'); lab(s, -0.8, -0.55, 'H'); s.b(O, 1); s.b(O, 2);
  const H = lab(s, 1.6, 0, 'H'), Br = lab(s, 2.9, 0, 'Br', { lp: [90, 0, 270] }); s.b(H, Br);
  return { s, sites: { lpO: { k: 'lp', a: 0, ang: 0, label: 'par livre do O' }, H: { k: 'atom', a: 3, label: 'H do HBr' }, HBr: { k: 'bond', b: [3, 4], label: 'ligação H–Br' }, Br: { k: 'atom', a: 4, label: 'Br' }, Hw: { k: 'atom', a: 1, label: 'H da água', why: 'Átomos não são fonte de elétrons; e um H já tem sua única ligação.' } },
    sources: ['lpO', 'HBr', 'Hw'], targets: ['H', 'Br', 'Hw'], answer: [['lpO', 'H'], ['HBr', 'Br']],
    msgs: { 'lpO>Br': 'O alvo é o H δ+ (o próton transferido).', 'HBr>H': 'O par vai para o Br, que sai como Br⁻.' }, bend: { 'lpO>H': -0.45, 'HBr>Br': -0.7 }, done: 'H₃O⁺ + Br⁻: O com 3 ligações e 1 par (+1); Br⁻ com 4 pares. Carga total 0 → 0.' };
};
P.acetoneH = () => {
  const s = new S(); const C = lab(s, 0, 0, ''); lab(s, -0.95, 0.55, 'H3C'); lab(s, 0.95, 0.55, 'CH3'); const O = lab(s, 0, -1.05, 'O', { lp: [45, 135], cls: 'nuc' }); s.b(C, 1); s.b(C, 2); s.b(C, O, 2);
  const H = lab(s, 1.5, -1.05, 'H'), Ow = lab(s, 2.5, -1.05, 'O', { chg: '+', lp: [90] }); lab(s, 3.1, -0.45, 'H'); lab(s, 3.1, -1.65, 'H'); s.b(H, Ow); s.b(Ow, 6); s.b(Ow, 7);
  return { s, sites: { lpO: { k: 'lp', a: 3, ang: 45, label: 'par livre do O da carbonila' }, H: { k: 'atom', a: 4, label: 'H do H₃O⁺' }, HO: { k: 'bond', b: [4, 5], label: 'ligação H–O⁺' }, Ow: { k: 'atom', a: 5, label: 'O⁺ do H₃O⁺', why: 'Uma seta não pode começar em uma carga positiva: O⁺ não tem par para doar nesta etapa.' }, pi: { k: 'bond', b: [0, 3], label: 'ligação π C=O', why: 'A protonação ocorre no par livre do O; a π continua intacta.' }, C: { k: 'atom', a: 0, label: 'C da carbonila' } },
    sources: ['lpO', 'HO', 'Ow', 'pi'], targets: ['H', 'Ow', 'C'], answer: [['lpO', 'H'], ['HO', 'Ow']],
    msgs: { 'HO>H': 'O par da ligação H–O⁺ fica no O, regenerando H₂O.', 'lpO>Ow': 'O alvo é o H transferido.' }, bend: { 'lpO>H': -0.4, 'HO>Ow': -0.7 }, done: 'Acetona protonada (O⁺ com 3 ligações e 1 par) + H₂O. Carga total +1 → +1.' };
};
P.oxo = () => { const s = oxoniumFrames()[0].s; return { s, sites: { CO: { k: 'bond', b: [0, 4], label: 'ligação C–O⁺' }, O: { k: 'atom', a: 4, label: 'O⁺' }, C: { k: 'atom', a: 0, label: 'C' }, lpO: { k: 'lp', a: 4, ang: 270, label: 'par livre do O⁺', why: 'O par livre do O⁺ não é doado aqui; o que se rompe é a ligação C–O.' } },
  sources: ['CO', 'lpO'], targets: ['O', 'C'], answer: [['CO', 'O']], msgs: { 'CO>C': 'O par vai para o O (positivo e eletronegativo), que sai como H₂O neutra.' }, bend: { 'CO>O': 0.6 }, done: 'Carbocátion + H₂O. Carga: +1 → +1 (agora no C).' }; };
P.deprot = () => {
  const s = tbu(); const O = lab(s, 1.25, 0, 'O', { chg: '+', lp: [270] }); lab(s, 1.85, 0.6, 'H'); const H = lab(s, 1.85, -0.6, 'H'); s.b(0, O); s.b(O, 5); s.b(O, H);
  const W = lab(s, 3.6, -0.6, 'O', { lp: [160, 200], cls: 'nuc' }); lab(s, 4.15, 0, 'H'); lab(s, 4.15, -1.2, 'H'); s.b(W, 8); s.b(W, 9);
  return { s, sites: { lpW: { k: 'lp', a: 7, ang: 160, label: 'par livre da água' }, H: { k: 'atom', a: 6, label: 'H do O⁺' }, OH: { k: 'bond', b: [4, 6], label: 'ligação O⁺–H' }, O: { k: 'atom', a: 4, label: 'O⁺' }, C: { k: 'atom', a: 0, label: 'C', why: 'O carbono não tem par para doar.' } },
    sources: ['lpW', 'OH', 'C'], targets: ['H', 'O', 'C'], answer: [['lpW', 'H'], ['OH', 'O']], msgs: { 'lpW>O': 'O alvo é o H ácido do O⁺, não o O.', 'lpW>C': 'Nesta etapa a água atua como base (remove H⁺), não como nucleófilo.', 'OH>H': 'O par da ligação O–H fica no O, que volta a ser neutro.' }, bend: { 'lpW>H': 0.5, 'OH>O': 0.6 }, done: 't-BuOH + H₃O⁺. Carga total +1 → +1.' };
};
export const MECH_BUILD = {
  title: 'Brometo de t-butila + água → t-butanol + HBr (3 etapas)',
  steps: [
    { key: 'tbuBr', t: 'Etapa 1 — heterólise: o grupo abandonador sai.' },
    { key: 'cationWater', t: 'Etapa 2 — a água (nucleófilo) ataca o carbocátion.' },
    { key: 'deprot', t: 'Etapa 3 — transferência de próton: outra molécula de água remove o H⁺.' },
  ],
  P: (k) => P[k](),
};
export const PUZZLES = [
  { key: 'hoHcl', title: 'HO⁻ + HCl → H₂O + Cl⁻', intro: 'Transferência de próton: desenhe as duas setas.' },
  { key: 'waterHBr', title: 'H₂O + HBr → H₃O⁺ + Br⁻', intro: 'A água atua como base.' },
  { key: 'bf3', title: 'NH₃ + BF₃ → aduto', intro: 'Ácido-base de Lewis: uma seta.' },
  { key: 'tbuBr', title: 'Heterólise do brometo de t-butila', intro: 'Uma seta: para onde vai o par da ligação C–Br?' },
  { key: 'cationWater', title: 'Carbocátion + água', intro: 'Formação de ligação Nu → E.' },
  { key: 'cn', title: 'CN⁻ + CH₃Br → CH₃CN + Br⁻', intro: 'Nucleófilo, eletrófilo e grupo abandonador: duas setas.' },
  { key: 'acetate', title: 'Ressonância do acetato', intro: 'Desenhe as setas que levam à outra forma de ressonância.' },
  { key: 'acetoneH', title: 'Protonação da acetona por H₃O⁺', intro: 'Duas setas: quem é a base?' },
].map((p) => Object.assign(p, { puzzle: () => P[p.key]() }));
