/*
 * tools.js — módulos 32–36: laboratório 3D (com “antes e depois”), simulador de
 * equilíbrio, simulador de reversibilidade, simulador de mecanismos (setas
 * curvas validadas), “Quem deve ser protonado agora?”, simulador de grupos
 * protetores, “Escolha o nucleófilo” e problemas de síntese.
 */
import { h, tgl } from './widgets2d.js';
import { S } from './chem2d.js';
import { COMP, PROTECT, NUCS, SUBS, PRODS } from './data.js';
import { molView, M3D } from './m3d.js';
import { fb, clear, sel, vbox, legend, svgOf, figK, figRow, nm, card, note, ESP_LEG } from './ui.js';
import { solveAcetal } from './mods1.js';

/* ===================================================================
 * 32. Laboratório 3D
 * =================================================================== */
export const LAB = ['formaldeido', 'acetaldeido', 'acetona', 'benzaldeido', 'cicloexanona', 'hidratoAcet', 'hemiacetal', 'acetal', 'hemicetal', 'cetal', 'imina', 'enamina', 'oxima', 'hidrazona', 'cianoAcetona', 'carbinolamina', 'iminio', 'oxocarbenio', 'alfaGlicose', 'betaGlicose', 'glicoseAberta', 'sacarose', 'ilideo', 'oxafosfetano', 'dioxolano', 'ditiolano'];
export function lab3d(host) {
  const v = vbox('tall'), info = h('div', { 'aria-live': 'polite' });
  const st = { key: 'acetona' };
  const A = molView(v, st.key, { hlC: true, delta: true, hint: true });
  const isCO = () => { const D = M3D[st.key]; const c = D.map[1], o = D.map[2]; return c !== undefined && o !== undefined && D.bonds.some(([a, b, t]) => t === 2 && ((a === c && b === o) || (a === o && b === c))); };
  const desc = () => { const D = M3D[st.key], c = D.map[1]; const nb = c === undefined ? 0 : D.bonds.filter(([a, b]) => a === c || b === c).length; info.replaceChildren(fb('neutral', `<b>${D.name}</b>${c !== undefined ? ` · carbono destacado: <b>${nb === 4 ? 'sp³ (tetraédrico)' : nb === 3 ? 'sp² (trigonal planar)' : '—'}</b>` : ''}${isCO() ? ' · C=O presente: π* disponível' : ''}. Geometria otimizada (MMFF94).`)); };
  const T = (t, k, f) => tgl(t, () => { A.st[k] = !A.st[k]; if (f) f(); A.rebuild(); return A.st[k]; }, !!A.st[k]);
  host.append(h('div', { class: 'controls' }, h('label', null, 'Molécula: ', sel(LAB.map((k) => [k, M3D[k].name]), st.key, (k) => { st.key = k; A.set(k); desc(); }, 'molécula')),
    tgl('Preenchimento espacial', () => { A.st.style = A.st.style === 'ball' ? 'space' : 'ball'; A.rebuild(); return A.st.style === 'space'; }, false), T('C (ex-)carbonílico', 'hlC'), T('δ+/δ−', 'delta'), T('Pares isolados', 'lp'), T('π', 'pi', () => { A.st.pistar = false; }), T('π*', 'pistar', () => { A.st.pi = false; }), T('Mapa de potencial', 'esp'), T('Hibridização', 'hyb'), T('Girar', 'spin', () => { A.v.controls.autoRotate = !A.st.spin; })),
    v, info, ESP_LEG(), h('p', { class: 'hint3' }, 'π/π* aparecem para moléculas com C=O no carbono destacado. Mapa de potencial qualitativo (eletronegatividade), não calculado por métodos quânticos.'));
  desc();
}
const BA = [['Hidratação', 'acetona', 'hidratoAcetona', 'sp² → sp³ (adição)'], ['Cianoidrina', 'acetona', 'cianoAcetona', 'sp² → sp³ (nova C–C)'], ['Cetal', 'acetona', 'cetal', 'sp² → sp³ (adição + substituição)'], ['Hemiacetal cíclico', 'hidroxipentanal', 'thpOl', 'sp² → sp³ (intramolecular)'], ['Glicose', 'glicoseAberta', 'betaGlicose', 'C1: sp² → sp³ anomérico'], ['Imina', 'cicloexanona', 'imina', 'sp² → sp² (C=O → C=N)'], ['Enamina', 'cicloexanona', 'enamina', 'C=O → C=C–N'], ['Oxima', 'acetona', 'oxima', 'C=O → C=N–OH'], ['Wittig', 'acetona', 'metilpropeno', 'C=O → C=C (sp²)'], ['HWE', 'benzaldeido', 'cinamatoE', 'C=O → C=C (E)']];
export function beforeAfter(host) {
  const a = vbox(), b = vbox(), la = h('p', { class: 'cardlab center' }), lb = h('p', { class: 'cardlab center' }), out = h('div');
  let A = null, B = null, k = 0;
  const draw = () => { const [, x, y, t] = BA[k]; if (!A) { A = molView(a, x, { hlC: true, hyb: true, hint: false }); B = molView(b, y, { hlC: true, hyb: true, hint: false }); } else { A.set(x); B.set(y); } la.textContent = 'Antes: ' + M3D[x].name; lb.textContent = 'Depois: ' + M3D[y].name; out.replaceChildren(fb('neutral', `<b>${BA[k][0]}:</b> ${t}.`)); };
  host.append(h('label', null, 'Reação: ', sel(BA.map((r, i) => [i, r[0]]), 0, (i) => { k = +i; draw(); }, 'reação')), h('div', { class: 'cmp2' }, h('div', null, a, la), h('div', null, b, lb)), out);
  draw();
}

/* ===================================================================
 * 33. Simulador de equilíbrio e de reversibilidade
 * =================================================================== */
function bars2(items) { return h('div', { class: 'eqbars' }, items.map(([t, p, cls]) => h('div', { class: 'eqbar' }, h('span', { class: 'lab', html: t }), h('div', { class: 'track' }, h('i', { class: cls, style: `width:${Math.max(0.5, p)}%` })), h('b', null, p.toFixed(0) + '%')))); }
export function eqSim(host) {
  const R = (lab, min, max, val, step = 1) => { const r = h('input', { type: 'range', min, max, value: val, step, 'aria-label': lab }); return r; };
  const w = R('água', 0, 10, 0, 0.5), o = R('álcool', 2, 20, 2, 1), ac = R('acidez', 0, 3, 2), T = R('temperatura', 0, 2, 1);
  const out = h('div'), msg = h('div', { 'aria-live': 'polite' });
  const AC = ['sem catalisador', 'traço de ácido', 'ácido catalítico (ex.: TsOH)', 'ácido forte em excesso'], TT = ['baixa', 'ambiente', 'alta'];
  const go = () => {
    const W = +w.value, B = +o.value, a = +ac.value, t = +T.value;
    const K = [3, 1, 0.3][t]; // ΔS° < 0 (3 moléculas → 2): T maior desfavorece o acetal (ilustrativo)
    const x = solveAcetal(1, B, W, K) * 100;
    clear(out).append(h('p', { class: 'mono center' }, 'R₂C=O + 2 ROH ⇌ R₂C(OR)₂ + H₂O'), bars2([['carbonila', 100 - x, 'r'], ['acetal/cetal', x, 'p']]), h('div', { class: 'speed' }, h('span', null, 'rapidez para atingir o equilíbrio: '), h('b', null, ['praticamente nula', 'lenta', 'rápida', 'rápida (mas cuidado com grupos sensíveis a ácido)'][a])));
    msg.replaceChildren(fb('neutral', `[H₂O] = ${W} eq · [ROH] = ${B} eq · ${AC[a]} · T ${TT[t]}. ${a === 0 ? 'Sem ácido, a 2ª etapa (saída de OH) não ocorre: na prática não se forma acetal, embora a posição do equilíbrio não dependa do catalisador.' : 'O ácido acelera ida e volta; a <b>posição</b> depende de concentrações e temperatura.'} ${t === 2 ? 'Temperatura alta desfavorece o acetal (3 moléculas → 2: ΔS° < 0).' : ''}`));
  };
  [w, o, ac, T].forEach((r) => r.addEventListener('input', go));
  const row = (t, r, a, b) => h('div', { class: 'range-row' }, h('span', null, t), r, h('span', { class: 'muted' }, a + ' → ' + b));
  host.append(row('[H₂O]', w, '0', '10 eq'), row('[ROH]', o, '2', '20 eq'), row('acidez', ac, 'nenhuma', 'forte'), row('temperatura', T, 'baixa', 'alta'), out, msg, h('p', { class: 'hint3' }, 'Modelo ilustrativo: K arbitrário (não é uma constante real). Mostra o sentido dos deslocamentos (Le Châtelier) e a diferença entre equilíbrio e velocidade.'));
  go();
}
const REV = {
  hidrato: { t: 'R₂C=O + H₂O ⇌ gem-diol', rev: true, add: 'água favorece o hidrato', rem: 'remover água desloca para a carbonila', pH: 'ácido ou base aceleram (não mudam K)' },
  hemi: { t: 'R₂C=O + ROH ⇌ hemiacetal', rev: true, add: 'excesso de ROH favorece o hemiacetal', rem: 'hemiacetais acíclicos revertem facilmente', pH: 'ácido ou base aceleram' },
  acetal: { t: 'R₂C=O + 2 ROH ⇌ acetal + H₂O', rev: true, add: 'água + H⁺ → hidrólise', rem: 'remover água → mais acetal', pH: 'precisa de ácido; em base o acetal fica “congelado” (estável)' },
  imina: { t: 'R₂C=O + RNH₂ ⇌ imina + H₂O', rev: true, add: 'água + H⁺ → hidrólise da imina', rem: 'remover água → mais imina', pH: 'ácido moderado; muito ácido protona a amina' },
  enamina: { t: 'R₂C=O + R₂NH ⇌ enamina + H₂O', rev: true, add: 'água + H⁺ → carbonila + amina', rem: 'remover água → mais enamina', pH: 'ácido moderado' },
  ciano: { t: 'R₂C=O + HCN ⇌ cianoidrina', rev: true, add: 'excesso de HCN/CN⁻ favorece a cianoidrina', rem: 'em base forte, a cianoidrina pode perder CN⁻', pH: 'base catalisa (gera CN⁻)' },
  wittig: { t: 'R₂C=O + Ph₃P=CR₂ → alceno + Ph₃P=O', rev: false, add: 'água destrói o ilídeo (é básico) — use condições anidras', rem: '—', pH: 'o ilídeo é gerado com base forte' },
};
export function revSim(host) {
  let k = 'acetal'; const out = h('div', { 'aria-live': 'polite' }), head = h('div');
  const draw = (act) => { const R = REV[k]; clear(head).append(h('p', { class: 'mono center' }, R.t), fb(R.rev ? 'neutral' : 'bad', R.rev ? 'Reversível (⇌): a posição do equilíbrio pode ser controlada.' : 'Praticamente irreversível: força motriz da ligação P=O.')); out.replaceChildren(act ? fb('ok', R[act]) : ''); };
  const B = (t, a) => h('button', { class: 'btn sm', type: 'button', onclick: () => draw(a) }, t);
  host.append(h('label', null, 'Reação: ', sel(Object.keys(REV).map((x) => [x, REV[x].t]), k, (x) => { k = x; draw(); }, 'reação')), head, h('div', { class: 'controls' }, B('+ água / reagente', 'add'), B('remover água / produto', 'rem'), B('mudar pH', 'pH')), out);
  draw();
}

/* ===================================================================
 * 34. Simulador de mecanismos (setas curvas)
 * =================================================================== */
const G = { cls: 'grey' };
function bCarb(s, prot) { const T = {}; T.c = s.a(0, 0, '', { halo: 'o' }); T.o = s.br(T.c, 90, 'O', 2, { cls: 'oxy', lp: prot ? [150] : [45, 135], chg: prot ? '+' : undefined }, 1.2); if (prot) T.oh = s.br(T.o, 30, 'H', 1, {}, 0.95); s.br(T.c, 210, 'H₃C', 1, G); s.br(T.c, 330, 'CH₃', 1, G); return T; }
const MS = {
  hemi: {
    title: 'Hemicetal (acetona + CH₃OH, H⁺)',
    steps: ['O(C=O) → H⁺', 'H–O⁺ → O', 'CH₃OH → C', 'π C=O → O', 'H₂O → H', 'H–O⁺ → O', 'hemicetal'],
    frame: (st) => (st < 2 ? 0 : st < 4 ? 1 : st < 6 ? 2 : 3),
    build(f) {
      const s = new S(); let T = {};
      if (f === 0) { T = bCarb(s, false); T.ao = s.a(2.4, -1.9, 'OH₂', { chg: '+', cls: 'oxy2' }); T.h = s.br(T.ao, 180, 'H', 1, { cls: 'hb' }, 0.95); }
      else if (f === 1) { T = bCarb(s, true); T.n = s.a(-2.6, -0.9, 'O', { cls: 'nu', lp: [0, 270] }); s.br(T.n, 120, 'H', 1, {}, 0.95); s.br(T.n, 210, 'CH₃', 1, G); }
      else if (f === 2) { T.c = s.a(0, 0, '', { halo: 'v' }); s.br(T.c, 90, 'OH', 1, { cls: 'oxy' }, 1.15); T.on = s.br(T.c, 180, 'O', 1, { cls: 'nu', chg: '+', lp: [200] }, 1.2); T.h = s.br(T.on, 120, 'H', 1, { cls: 'hb' }, 0.95); s.br(T.on, 240, 'CH₃', 1, G); s.br(T.c, 270, 'CH₃', 'w', G); s.br(T.c, 0, 'CH₃', 'h', G); T.w = s.a(-2.9, -1.6, 'H₂O', { cls: 'base', lp: [0] }); }
      else { T.c = s.a(0, 0, '', { halo: 'g' }); s.br(T.c, 90, 'OH', 1, { cls: 'prod' }, 1.15); s.br(T.c, 180, 'OCH₃', 1, { cls: 'prod' }, 1.3); s.br(T.c, 270, 'CH₃', 'w', G); s.br(T.c, 0, 'CH₃', 'h', G); s.t(2.6, 0, '+ H₃O⁺', 'cond', 14); }
      return { s, T };
    },
    rules: [
      { from: ['a', 'o'], to: ['a', 'h'], arrow: (T) => ({ from: { lp: [T.o, 45] }, to: { a: T.h, ang: 180 }, bend: -0.4, cls: 'm' }), ok: '✔ Um par isolado do O carbonílico captura o H⁺.', bad: [[['a', 'c'], null, 'O carbono não tem par de elétrons para doar.'], [['a', 'o'], ['a', 'ao'], 'A seta aponta para o <b>H</b> que é transferido, não para o O do H₃O⁺.'], [['b', 'c', 'o'], null, 'Por convenção, a protonação usa um <b>par isolado</b> do O (não o par π).']] },
      { from: ['b', 'h', 'ao'], to: ['a', 'ao'], arrow: (T) => ({ from: { b: [T.h, T.ao] }, to: { a: T.ao, ang: 90 }, bend: 0.6, cls: 'm' }), ok: '✔ O par da ligação H–O fica no O (sai H₂O). Carbonila protonada: C mais eletrofílico.', bad: [] },
      { from: ['a', 'n'], to: ['a', 'c'], arrow: (T) => ({ from: { lp: [T.n, 0] }, to: { a: T.c, ang: 165 }, bend: -0.35, cls: 'm' }), ok: '✔ O par do O do metanol ataca o carbono δ+.', bad: [[['a', 'n'], ['a', 'o'], '<b>Erro comum:</b> o nucleófilo ataca o <b>carbono</b>, não o oxigênio.'], [['a', 'c'], null, 'A seta parte do <b>nucleófilo</b> (par do O do CH₃OH), não do eletrófilo.']] },
      { from: ['b', 'c', 'o'], to: ['a', 'o'], arrow: (T) => ({ from: { b: [T.c, T.o] }, to: { a: T.o, ang: 0 }, bend: 0.5, cls: 'm' }), ok: '✔ π C=O → O: o O⁺ fica neutro (O–H).', bad: [[['b', 'c', 'o'], ['a', 'c'], 'O par π vai para o <b>oxigênio</b>; senão o C ficaria com 5 ligações.']] },
      { from: ['a', 'w'], to: ['a', 'h'], arrow: (T) => ({ from: { lp: [T.w, 0] }, to: { a: T.h, ang: 180 }, bend: -0.35, cls: 'm' }), ok: '✔ A água (base) remove o H do O⁺.', bad: [[['a', 'w'], ['a', 'c'], 'A água não ataca o carbono agora: o problema é a carga + no O; remova o H⁺.']] },
      { from: ['b', 'h', 'on'], to: ['a', 'on'], arrow: (T) => ({ from: { b: [T.h, T.on] }, to: { a: T.on, ang: 30 }, bend: 0.6, cls: 'm' }), ok: '✔ O par O–H fica no O: hemicetal neutro; H₃O⁺ regenerado.', bad: [] },
    ],
  },
  imina: {
    title: 'Imina: desidratação da carbinolamina',
    steps: ['OH → H⁺', 'H–O⁺ → O', 'N → C–N (π)', 'C–OH₂⁺ → O', 'H₂O → H(N)', 'N–H → N', 'imina'],
    frame: (st) => (st < 2 ? 0 : st < 4 ? 1 : st < 6 ? 2 : 3),
    build(f) {
      const s = new S(); const T = {};
      if (f === 0) { T.c = s.a(0, 0, '', { halo: 'v' }); T.o = s.br(T.c, 90, 'O', 1, { cls: 'oxy', lp: [45, 135] }, 1.15); s.br(T.o, 150, 'H', 1, {}, 0.95); T.n = s.br(T.c, 180, 'N', 1, { cls: 'nu', lp: [270] }, 1.2); s.br(T.n, 120, 'H', 1, {}, 0.95); s.br(T.n, 210, 'CH₃', 1, G); s.br(T.c, 270, 'R', 'w', G); s.br(T.c, 0, 'R′', 'h', G); T.ao = s.a(2.4, -2.2, 'OH₂', { chg: '+', cls: 'oxy2' }); T.h = s.br(T.ao, 180, 'H', 1, { cls: 'hb' }, 0.95); }
      else if (f === 1) { T.c = s.a(0, 0, '', { halo: 'v' }); T.o = s.br(T.c, 90, 'OH₂', 1, { cls: 'oxy', chg: '+' }, 1.2); T.n = s.br(T.c, 180, 'N', 1, { cls: 'nu', lp: [90] }, 1.2); s.br(T.n, 225, 'H', 1, {}, 0.95); s.br(T.n, 150, 'CH₃', 1, G); s.br(T.c, 270, 'R', 'w', G); s.br(T.c, 0, 'R′', 'h', G); }
      else if (f === 2) { T.c = s.a(0, 0, '', { halo: 'v' }); T.n = s.br(T.c, 180, 'N', 2, { cls: 'nu', chg: '+' }, 1.2); T.h = s.br(T.n, 120, 'H', 1, { cls: 'hb' }, 0.95); s.br(T.n, 225, 'CH₃', 1, G); s.br(T.c, 300, 'R', 1, G); s.br(T.c, 60, 'R′', 1, G); T.w = s.a(-2.6, -2.4, 'H₂O', { cls: 'base', lp: [0] }); s.t(2.4, 0, '+ H₂O', 'cond', 14); }
      else { T.c = s.a(0, 0, '', { halo: 'g' }); s.br(T.c, 180, 'N', 2, { cls: 'prod', lp: [120] }, 1.2); s.br(s.atoms.length - 1, 225, 'CH₃', 1, G); s.br(T.c, 300, 'R', 1, G); s.br(T.c, 60, 'R′', 1, G); s.t(2.6, 0, 'imina + H₃O⁺', 'cond', 14); }
      return { s, T };
    },
    rules: [
      { from: ['a', 'o'], to: ['a', 'h'], arrow: (T) => ({ from: { lp: [T.o, 45] }, to: { a: T.h, ang: 180 }, bend: -0.4, cls: 'm' }), ok: '✔ Protona-se o <b>OH</b>: HO⁻ seria um péssimo grupo de saída; H₂O é bom.', bad: [[['a', 'n'], ['a', 'h'], 'Protonar o N tiraria o par que vai empurrar a saída da água — não é a protonação produtiva.'], [['b', 'c', 'o'], null, '<b>Erro comum:</b> OH⁻ não sai sem ser protonado. Primeiro protone o OH.']] },
      { from: ['b', 'h', 'ao'], to: ['a', 'ao'], arrow: (T) => ({ from: { b: [T.h, T.ao] }, to: { a: T.ao, ang: 90 }, bend: 0.6, cls: 'm' }), ok: '✔ Forma-se C–OH₂⁺.', bad: [] },
      { from: ['a', 'n'], to: ['b', 'c', 'n'], arrow: (T) => ({ from: { lp: [T.n, 90] }, to: { b: [T.c, T.n] }, bend: -0.9, cls: 'm' }), ok: '✔ O par do N começa a formar a π C=N…', bad: [[['a', 'n'], ['a', 'c'], 'Aponte para a <b>ligação C–N</b> (onde se forma a π), não para o átomo de C.'], [['b', 'c', 'o'], null, 'Também é válido pensar na saída da água primeiro, mas aqui siga o par do N empurrando (sem carbocátion livre).']] },
      { from: ['b', 'c', 'o'], to: ['a', 'o'], arrow: (T) => ({ from: { b: [T.c, T.o] }, to: { a: T.o, ang: 0 }, bend: -0.6, cls: 'm' }), ok: '✔ …e a água sai levando o par da ligação C–O.', bad: [] },
      { from: ['a', 'w'], to: ['a', 'h'], arrow: (T) => ({ from: { lp: [T.w, 0] }, to: { a: T.h, ang: 135 }, bend: -0.3, cls: 'm' }), ok: '✔ A base remove o H do N do íon imínio.', bad: [[['a', 'w'], ['a', 'c'], 'Se a água atacar o C, volta-se à carbinolamina (hidrólise). Para formar a imina, remova o H⁺ do N.']] },
      { from: ['b', 'h', 'n'], to: ['a', 'n'], arrow: (T) => ({ from: { b: [T.h, T.n] }, to: { a: T.n, ang: 90 }, bend: 0.6, cls: 'm' }), ok: '✔ O par N–H fica no N: imina neutra (C=N–CH₃).', bad: [] },
    ],
  },
  ciano: {
    title: 'Cianoidrina (acetona + CN⁻, depois HCN)',
    steps: ['C⁻ (CN) → C', 'π C=O → O', 'O⁻ → H (HCN)', 'H–C → C', 'cianoidrina'],
    frame: (st) => (st < 2 ? 0 : st < 4 ? 1 : 2),
    build(f) {
      const s = new S(); let T = {};
      if (f === 0) { T = bCarb(s, false); T.n = s.a(-2.7, -0.9, 'C', { cls: 'nu', chg: '−', lp: [0] }); s.br(T.n, 180, 'N', 3, { cls: 'nu' }, 1.0); }
      else if (f === 1) { T.c = s.a(0, 0, '', { halo: 'v' }); T.o = s.br(T.c, 90, 'O', 1, { cls: 'oxy', chg: '−', lp: [30, 150] }, 1.15); s.br(T.c, 180, 'C≡N', 1, { cls: 'nu' }, 1.3); s.br(T.c, 270, 'CH₃', 'w', G); s.br(T.c, 0, 'CH₃', 'h', G); T.h = s.a(1.9, -2.0, 'H', { cls: 'hb' }); T.cn = s.br(T.h, 0, 'C', 1, {}, 1.0); s.br(T.cn, 0, 'N', 3, {}, 1.0); }
      else { T.c = s.a(0, 0, '', { halo: 'g' }); s.br(T.c, 90, 'OH', 1, { cls: 'prod' }, 1.15); s.br(T.c, 180, 'C≡N', 1, { cls: 'prod' }, 1.3); s.br(T.c, 270, 'CH₃', 'w', G); s.br(T.c, 0, 'CH₃', 'h', G); s.t(2.8, 0, '+ CN⁻ (regenerado)', 'cond', 14); }
      return { s, T };
    },
    rules: [
      { from: ['a', 'n'], to: ['a', 'c'], arrow: (T) => ({ from: { lp: [T.n, 0] }, to: { a: T.c, ang: 165 }, bend: -0.35, cls: 'm' }), ok: '✔ O <b>carbono</b> do cianeto ataca o C carbonílico: nova ligação C–C.', bad: [[['a', 'n'], ['a', 'o'], '<b>Erro comum:</b> CN⁻ não ataca o oxigênio da carbonila (O é δ−).']] },
      { from: ['b', 'c', 'o'], to: ['a', 'o'], arrow: (T) => ({ from: { b: [T.c, T.o] }, to: { a: T.o, ang: 0 }, bend: 0.5, cls: 'm' }), ok: '✔ π → O: alcóxido tetraédrico.', bad: [] },
      { from: ['a', 'o'], to: ['a', 'h'], arrow: (T) => ({ from: { lp: [T.o, 30] }, to: { a: T.h, ang: 180 }, bend: -0.35, cls: 'm' }), ok: '✔ O alcóxido remove o H⁺ do HCN.', bad: [] },
      { from: ['b', 'h', 'cn'], to: ['a', 'cn'], arrow: (T) => ({ from: { b: [T.h, T.cn] }, to: { a: T.cn, ang: 90 }, bend: 0.6, cls: 'm' }), ok: '✔ CN⁻ regenerado: catálise básica.', bad: [] },
    ],
  },
  wittig: {
    title: 'Wittig: colapso do oxafosfetano',
    steps: ['C–P → C=C', 'C–O → P=O', 'alceno + Ph₃P=O'],
    frame: (st) => (st < 2 ? 0 : 1),
    build(f) {
      const s = new S(); const T = {};
      if (f === 0) { T.c = s.a(0, 0, '', { halo: 'v' }); T.o = s.br(T.c, 90, 'O', 1, { cls: 'oxy' }, 1.2); T.cy = s.br(T.c, 180, 'CH₂', 1, { cls: 'grey' }, 1.25); T.p = s.a(-1.25, -1.2, 'PPh₃', { cls: 'cr' }); s.b(T.cy, T.p, 1); s.b(T.p, T.o, 1); s.br(T.c, 300, 'CH₃', 1, G); s.br(T.c, 30, 'CH₃', 1, G); }
      else { T.c = s.a(0, 0, '', { halo: 'g' }); s.br(T.c, 180, 'CH₂', 2, { cls: 'prod' }, 1.3); s.br(T.c, 300, 'CH₃', 1, G); s.br(T.c, 60, 'CH₃', 1, G); s.t(3.0, 0, '+ Ph₃P=O', 'cr', 15); }
      return { s, T };
    },
    rules: [
      { from: ['b', 'cy', 'p'], to: ['b', 'c', 'cy'], arrow: (T) => ({ from: { b: [T.cy, T.p] }, to: { b: [T.c, T.cy] }, bend: -0.9, cls: 'm' }), ok: '✔ O par C–P forma a π C=C.', bad: [[['b', 'c', 'o'], null, 'Comece pela ligação C–P (os dois movimentos são simultâneos; aqui seguimos esta ordem).']] },
      { from: ['b', 'c', 'o'], to: ['b', 'o', 'p'], arrow: (T) => ({ from: { b: [T.c, T.o] }, to: { b: [T.o, T.p] }, bend: -0.8, cls: 'm' }), ok: '✔ O par C–O forma a π P=O: força motriz (ligação P=O muito forte).', bad: [[['b', 'c', 'o'], ['a', 'o'], 'Se o par ficasse só no O, formaria um O⁻ — o correto é formar a ligação π P=O.']] },
    ],
  },
};
export function mechSim(host) {
  let mode = 'hemi', step = 0, from = null, hist = [];
  const stage = h('div', { class: 'figs mechsim' }), prog = h('ol', { class: 'msteps' }), q = h('div'), out = h('div', { 'aria-live': 'polite' });
  const key = (t, T) => { const name = (i) => Object.keys(T).find((k) => T[k] === i); return t.type === 'a' ? ['a', name(t.i)] : ['b', name(t.a), name(t.b)]; };
  const same = (A, B) => A && B && A[0] === B[0] && (A[0] === 'a' ? A[1] === B[1] : (A[1] === B[1] && A[2] === B[2]) || (A[1] === B[2] && A[2] === B[1]));
  function render(fr) {
    const M = MS[mode]; fr = fr ?? M.frame(step);
    const { s, T } = M.build(fr); hist.forEach((a) => s.arrow(a.from, a.to, a.bend, a.cls));
    const svg = svgOf(s, { scale: 50, fs: 19, zoom: 1.3, animate: true }); clear(stage).append(svg);
    clear(prog).append(...M.steps.map((t, i) => h('li', { class: i < step ? 'done' : i === step ? 'cur' : '' }, t)));
    const final = step >= M.rules.length;
    if (!final) {
      const C = svg._chem, NS = 'http://www.w3.org/2000/svg', g = document.createElementNS(NS, 'g'); g.setAttribute('transform', C.transform); svg.append(g);
      const mk = (tag, a, tg) => { const e = document.createElementNS(NS, tag); Object.entries(a).forEach(([k, v]) => e.setAttribute(k, v)); e.setAttribute('tabindex', 0); e.setAttribute('role', 'button'); const f = () => click(tg, e, T); e.addEventListener('click', f); e.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); f(); } }); g.append(e); };
      s.bonds.forEach(([a, b]) => { const p = C.atoms[a], r = C.atoms[b]; mk('line', { x1: p.x, y1: p.y, x2: r.x, y2: r.y, class: 'hitb', 'aria-label': 'ligação' }, { type: 'b', a, b }); });
      s.atoms.forEach((_, i) => { const p = C.atoms[i]; mk('circle', { cx: p.x, cy: p.y, r: 15, class: 'hita', 'aria-label': 'átomo' }, { type: 'a', i }); });
    }
    clear(q).append(final ? fb('ok', `✔ Mecanismo completo: ${M.steps[M.steps.length - 1]}.`) : h('p', { class: 'prompt', html: `Etapa ${step + 1}: clique na <b>origem</b> da seta (par isolado = átomo; ou ligação que se rompe) e depois no <b>destino</b> (átomo ou ligação que se forma).` }));
  }
  function click(t, e, T) {
    const M = MS[mode];
    if (!from) { from = t; e.classList.add('sel'); return; }
    const R = M.rules[step], kf = key(from, T), kt = key(t, T); from = null;
    if (same(kf, R.from) && same(kt, R.to)) { out.replaceChildren(fb('ok', R.ok)); const f0 = M.frame(step); hist.push(R.arrow(T)); step++; if (M.frame(step) !== f0) { render(f0); setTimeout(() => { hist = []; render(); }, 1300); } else render(); return; }
    const b = R.bad.find(([f, to]) => same(kf, f) && (!to || same(kt, to)));
    out.replaceChildren(fb('bad', '✘ ' + (b ? b[2] : same(kf, R.from) ? 'Origem correta, mas o destino não. Para onde vão esses elétrons?' : 'Origem incorreta. Setas partem de <b>elétrons</b>: um par isolado (nucleófilo/base) ou uma ligação que se rompe.')));
    render();
  }
  host.append(h('div', { class: 'controls' }, sel(Object.keys(MS).map((k) => [k, MS[k].title]), mode, (k) => { mode = k; step = 0; hist = []; from = null; out.replaceChildren(); render(); }, 'mecanismo')), prog, h('div', { class: 'grid2' }, stage, h('div', null, q, out)), h('p', { class: 'hint3' }, 'Validação: origem, destino, cargas e ordem das etapas. Representação mecanística simplificada para fins didáticos.'));
  render();
}

/* ---------- “Quem deve ser protonado agora?” ---------- */
const PQ = [
  { t: 'Formação de acetal — início', build(s) { const c = s.a(0, 0, '', { halo: 'o' }); const o = s.br(c, 90, 'O', 2, { cls: 'oxy' }, 1.2); s.br(c, 210, 'R', 1, G); s.br(c, 330, 'R′', 1, G); const m = s.a(2.6, 0.2, 'O', { cls: 'nu' }); s.br(m, 0, 'CH₃', 1, G); s.br(m, 90, 'H', 1, {}, 0.95); return { [o]: [true, '✔ Protonar a C=O torna o carbono mais eletrofílico para o ataque do álcool (nucleófilo fraco).'], [m]: [false, 'Protonar o CH₃OH (nucleófilo) o tornaria CH₃OH₂⁺, sem par disponível para atacar. Não é produtivo.'] }; } },
  { t: 'Hemicetal → acetal', build(s) { const c = s.a(0, 0, '', { halo: 'v' }); const o1 = s.br(c, 90, 'OH', 1, { cls: 'oxy' }, 1.15); const o2 = s.br(c, 180, 'OCH₃', 1, { cls: 'oxy2' }, 1.3); s.br(c, 270, 'R', 'w', G); s.br(c, 0, 'R′', 'h', G); return { [o1]: [true, '✔ Protonar o <b>OH</b> gera –OH₂⁺: a água sai e o OCH₃ estabiliza o oxocarbênio → caminho para o acetal.'], [o2]: [false, 'Protonar o OCH₃ e perder CH₃OH leva de volta à carbonila (caminho de reversão), não ao acetal.'] }; } },
  { t: 'Hidrólise de um acetal', build(s) { const c = s.a(0, 0, '', { halo: 'v' }); const o1 = s.br(c, 90, 'OCH₃', 1, { cls: 'oxy2' }, 1.2); const o2 = s.br(c, 180, 'OCH₃', 1, { cls: 'oxy2' }, 1.3); s.br(c, 270, 'R', 'w', G); s.br(c, 0, 'R′', 'h', G); const w = s.a(2.8, -1.4, 'H₂O', { cls: 'base' }); return { [o1]: [true, '✔ Protonar um OCH₃ permite a saída de CH₃OH, assistida pelo outro O (oxocarbênio).'], [o2]: [true, '✔ Qualquer um dos dois OCH₃: são equivalentes.'], [w]: [false, 'Protonar a água (H₃O⁺) é o próprio catalisador; o passo produtivo é protonar o substrato.'] }; } },
  { t: 'Carbinolamina → imina', build(s) { const c = s.a(0, 0, '', { halo: 'v' }); const o = s.br(c, 90, 'OH', 1, { cls: 'oxy' }, 1.15); const n = s.br(c, 180, 'NHCH₃', 1, { cls: 'nu' }, 1.4); s.br(c, 270, 'R', 'w', G); s.br(c, 0, 'R′', 'h', G); return { [o]: [true, '✔ Protonar o OH → H₂O sai, empurrada pelo par do N → íon imínio.'], [n]: [false, 'Protonar o N (mais básico) é possível, mas não é produtivo: tira o par que empurra a saída da água e pode reverter à carbonila + amina.'] }; } },
  { t: 'Amina antes do ataque (pH muito baixo)', build(s) { const c = s.a(0, 0, '', { halo: 'o' }); const o = s.br(c, 90, 'O', 2, { cls: 'oxy' }, 1.2); s.br(c, 210, 'R', 1, G); s.br(c, 330, 'R′', 1, G); const n = s.a(2.8, 0.2, 'NH₂CH₃', { cls: 'nu' }); return { [o]: [true, '✔ Ativar a carbonila (catálise moderada) mantém a amina livre para atacar.'], [n]: [false, 'Se a amina for protonada (R–NH₃⁺), ela <b>perde o par livre</b>: é por isso que meio muito ácido atrapalha.'] }; } },
];
export function protTrainer(host) {
  let k = 0; const box = h('div', { class: 'figs' }), out = h('div', { 'aria-live': 'polite' }), title = h('p', { class: 'prompt' });
  const draw = () => {
    const s = new S(), map = PQ[k].build(s); title.innerHTML = `<b>${PQ[k].t}:</b> clique no átomo que deve ser protonado agora.`; out.replaceChildren();
    const svg = svgOf(s, { scale: 48, fs: 18 }), C = svg._chem, NS = 'http://www.w3.org/2000/svg', g = document.createElementNS(NS, 'g'); g.setAttribute('transform', C.transform); svg.append(g);
    Object.entries(map).forEach(([i, [ok, msg]]) => { const p = C.atoms[+i]; const c = document.createElementNS(NS, 'circle'); [['cx', p.x], ['cy', p.y], ['r', 22], ['class', 'pk'], ['tabindex', 0], ['role', 'button'], ['aria-label', 'átomo candidato']].forEach(([x, y]) => c.setAttribute(x, y)); const f = () => { c.classList.add(ok ? 'right' : 'wrong'); out.replaceChildren(fb(ok ? 'ok' : 'bad', msg), ok ? h('button', { class: 'btn sm primary', type: 'button', onclick: () => { k = (k + 1) % PQ.length; draw(); } }, 'Próximo caso →') : ''); }; c.addEventListener('click', f); c.addEventListener('keydown', (e) => { if (e.key === 'Enter') f(); }); g.append(c); });
    clear(box).append(svg);
  };
  host.append(title, box, out, note('err', 'Erro comum', 'Catálise ácida não significa protonar qualquer átomo. Cada protonação deve <b>aumentar a eletrofilia</b>, <b>gerar um bom grupo de saída</b> ou viabilizar a etapa seguinte.'));
  draw();
}

/* ===================================================================
 * 35. Simulador de grupos protetores
 * =================================================================== */
export function protectSim(host) {
  let k = 0, step = 0; const box = h('div'), out = h('div', { 'aria-live': 'polite' }), path = h('div');
  const QS = (P) => [
    { q: 'É necessário proteger algum grupo?', o: ['sim — a cetona', 'sim — o éster', 'não: o reagente é seletivo'], a: 0, e: 'O reagente (hidreto forte) atacaria a cetona, que é mais reativa que o éster.' },
    { q: 'Qual grupo protetor/condição?', o: ['etilenoglicol, H⁺ cat., remoção de H₂O', 'NaOH aquoso', 'NaBH₄', 'H₃O⁺'], a: 0, e: 'Forma-se um cetal cíclico (1,3-dioxolano), estável às condições seguintes.', fig: P.mid },
    { q: 'Qual reagente executa a transformação desejada?', o: [P.reagent, 'H₃O⁺', 'NaBH₄ em MeOH', 'PCC'], a: 0, e: 'Com a cetona protegida, o hidreto reduz apenas o éster.', fig: P.mid2 },
    { q: 'Quando e como desproteger?', o: ['ao final, com H₃O⁺ (ácido aquoso)', 'antes da redução, com base', 'nunca: o cetal é o produto', 'com LiAlH₄'], a: 0, e: 'A hidrólise ácida do cetal regenera a cetona.', fig: P.goal },
  ];
  const draw = () => {
    const P = PROTECT[k], Q = QS(P); out.replaceChildren();
    if (step === 0) clear(path).append(h('p', { class: 'prompt', html: 'Objetivo: ' + P.want }), h('div', { class: 'figs' }, figK(P.start), h('span', { class: 'rxarr' }, '→ ?'), figK(P.goal, { cap: 'alvo: ' + nm(P.goal) })));
    if (step >= Q.length) { clear(box).append(fb('ok', '✔ Sequência completa: proteger → reagir → desproteger. ' + P.why), h('button', { class: 'btn sm primary', type: 'button', onclick: () => { k = (k + 1) % PROTECT.length; step = 0; draw(); } }, 'Outro problema →')); return; }
    const S0 = Q[step];
    clear(box).append(h('p', { class: 'prompt' }, `${step + 1}. ${S0.q}`), h('div', { class: 'ch-answers col' }, S0.o.map((t, i) => h('button', { class: 'btn', type: 'button', onclick: () => { if (i !== S0.a) { out.replaceChildren(fb('bad', '✘ Reveja: ' + (step === 0 ? 'o que o reagente faria com a cetona?' : step === 3 ? 'o cetal sai em ácido aquoso, depois da etapa que exigia a proteção.' : 'pense nas condições compatíveis.'))); return; } out.replaceChildren(fb('ok', '✔ ' + S0.e)); if (S0.fig) path.append(h('div', { class: 'figs' }, h('span', { class: 'rxarr' }, '↓'), figK(S0.fig))); step++; setTimeout(draw, 900); } }, t))));
  };
  host.append(path, box, out); draw();
}

/* ===================================================================
 * 36. Escolha o nucleófilo · problemas de síntese
 * =================================================================== */
export function chooseNu(host, nav) {
  let sub = 'cicloexanona', nu = 'RNH2'; const out = h('div', { 'aria-live': 'polite' });
  const draw = () => {
    const N = NUCS[nu], ps = (PRODS[sub] || {})[nu] || [];
    const prod = ps.length ? h('div', { class: 'figs' }, ps.map((p, i) => figK(p, { cap: ps.length > 1 ? `produto ${i + 1}` : 'produto', cc: N.atom === 'C' && nu !== 'CN' }))) : fb('bad', 'Sem produto do tipo esperado: para enamina é preciso H no carbono α (o benzaldeído não tem). Com aminas secundárias, aldeídos sem H α podem formar íons imínio/aminais.');
    out.replaceChildren(h('div', { class: 'cmp2' }, h('div', null, h('div', { class: 'rxrow' }, figK(sub), h('span', { class: 'rxarr', html: `→<small>${N.lab}</small>` })), prod),
      h('div', null, h('table', { class: 'cmp mini' }, h('tbody', null, [['Nucleófilo (átomo)', N.atom], ['Produto', N.prod], ['Tipo de reação', N.type], ['Ligação formada', N.bond], ['Reversível?', N.rev], ['Ácido/base?', N.cat], ['Forma água?', N.water]].map(([a, b]) => h('tr', null, h('th', null, a), h('td', { html: b }))))),
        nav ? h('button', { class: 'btn sm', type: 'button', onclick: () => nav({ hydAcid: 'hidratacao', hemi: 'hemiacetais', acetal: 'mec-acetal', imine: 'iminas', enamine: 'enaminas', oxime: 'oximas', hydrazone: 'hidrazonas', cyano: 'cianoidrinas', wittig: 'mec-wittig', hwe: 'hwe' }[N.mech]) }, 'Ver o mecanismo →') : '')));
  };
  const nuBar = h('div', { class: 'chips nus' }, Object.keys(NUCS).map((k) => h('button', { class: 'chip', type: 'button', 'aria-pressed': k === nu ? 'true' : 'false', onclick: (e) => { nu = k; [...nuBar.children].forEach((b) => b.setAttribute('aria-pressed', b === e.currentTarget ? 'true' : 'false')); draw(); } }, NUCS[k].lab)));
  host.append(h('label', null, 'Carbonila: ', sel(SUBS.map((k) => [k, nm(k)]), sub, (k) => { sub = k; draw(); }, 'carbonila')), h('p', { class: 'hint3' }, 'Escolha o nucleófilo:'), nuBar, out);
  draw();
}
const SYN = [
  { t: 'Aldeído → acetal', start: 'acetaldeido', goal: 'acetal', steps: [['EtOH (excesso), H⁺ cat., remoção de H₂O', ['NaOH, EtOH', 'H₂O, H⁺', 'NaBH₄']]] },
  { t: 'Proteger e recuperar uma cetona', start: 'cicloexanona', goal: 'cicloexanona', mid: ['dioxolano'], steps: [['etilenoglicol, H⁺, − H₂O', ['NaOH aquoso', 'CH₃NH₂', 'HCN']], ['H₃O⁺ (ácido aquoso)', ['NaOH', 'LiAlH₄', 'Ph₃P=CH₂']]] },
  { t: 'Carbonila → imina', start: 'cicloexanona', goal: 'imina', steps: [['CH₃NH₂, ácido moderado, − H₂O', ['(CH₃)₂NH, H⁺', 'CH₃NH₂ em HCl concentrado', 'CH₃OH, H⁺']]] },
  { t: 'Cetona → alceno (=CH₂)', start: 'cicloexanona', goal: 'metilenocicloexano', steps: [['Ph₃P=CH₂ (Wittig)', ['CH₃MgBr, depois H₃O⁺', 'H₂, Pd', 'LiAlH₄']]] },
  { t: 'Aumentar a cadeia (nova C–C) via cianoidrina', start: 'benzaldeido', goal: 'mandelonitrila', steps: [['HCN / KCN (cat.)', ['NaCN em ácido forte concentrado', 'NH₂OH', 'CH₃OH, H⁺']]] },
  { t: 'Benzaldeído → éster α,β-insaturado E', start: 'benzaldeido', goal: 'cinamato', steps: [['(EtO)₂P(O)CH₂CO₂Et, NaH (HWE)', ['EtOH, H⁺', 'Ph₃P=CH₂', 'NH₂NH₂']]] },
  { t: 'Carbonila → CH₂ via tioacetal', start: 'cicloexanona', goal: 'cicloexano', mid: ['ditiolano'], steps: [['HSCH₂CH₂SH, H⁺ (ou ácido de Lewis)', ['etilenoglicol, H⁺', 'NH₂OH', 'HCN']], ['Ni de Raney (dessulfurização)', ['H₃O⁺', 'NaOH', 'PCC']]] },
  { t: 'Cetoéster: reduzir só o éster', start: 'levulinato', goal: 'oxopentanol', mid: ['levulinatoP', 'levulinatoPR'], steps: [['etilenoglicol, H⁺, − H₂O', ['LiAlH₄ direto', 'NaOH aquoso', 'H₃O⁺']], ['LiAlH₄, depois workup', ['H₃O⁺', 'Ph₃P=CH₂', 'CH₃OH, H⁺']], ['H₃O⁺', ['NaOH', 'LiAlH₄', 'NaBH₄']]] },
  { t: 'Cetona → enamina', start: 'cicloexanona', goal: 'enamina', steps: [['pirrolidina, H⁺ cat., − H₂O', ['metilamina, H⁺', 'NH₂OH', 'NaBH₄']]] },
];
export function synthProblems(host) {
  let k = 0, step = 0; const head = h('div'), body = h('div'), out = h('div', { 'aria-live': 'polite' });
  const draw = () => {
    const P = SYN[k]; out.replaceChildren();
    if (step === 0) clear(head).append(h('h4', null, `Problema ${k + 1}/${SYN.length}: ${P.t}`), figRow([P.start, '→ ? →', [P.goal, { cap: 'alvo: ' + nm(P.goal) }]], { scale: 26 }));
    if (step >= P.steps.length) { clear(body).append(fb('ok', '✔ Rota completa!'), h('button', { class: 'btn sm primary', type: 'button', onclick: () => { k = (k + 1) % SYN.length; step = 0; draw(); } }, 'Próximo problema →')); return; }
    const [right, wrong] = P.steps[step], opts = [right, ...wrong].sort(() => Math.random() - 0.5);
    clear(body).append(h('p', { class: 'prompt' }, `Etapa ${step + 1}: escolha o reagente/condição.`), h('div', { class: 'ch-answers col' }, opts.map((o) => h('button', { class: 'btn', type: 'button', onclick: () => { if (o !== right) { out.replaceChildren(fb('bad', `✘ “${o}” não leva ao intermediário/produto necessário. Pense: qual nucleófilo e quais condições?`)); return; } const nx = P.mid && P.mid[step] ? P.mid[step] : step === P.steps.length - 1 ? P.goal : null; out.replaceChildren(fb('ok', `✔ ${o}`)); if (nx) head.append(figRow(['→<small>' + o + '</small>', nx], { scale: 22, fs: 11 })); step++; setTimeout(draw, 800); } }, o))));
  };
  host.append(head, body, out); draw();
}
void legend; void card; void COMP;
