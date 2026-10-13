/*
 * mods2.js — módulos 17–31: grupos protetores, tioacetais (Mozingo), aminas,
 * iminas, enaminas, oximas, hidrazonas, cianoidrinas, ligações C–C, Wittig,
 * ilídeos, HWE, Wittig × HWE e mapa geral das reações.
 */
import { h } from './widgets2d.js';
import { svgEl, add } from './arom2d.js';
import { COMP, PROTECT, COMPAT, WRETRO, NUCS } from './data.js';
import { molView, M3D } from './m3d.js';
import * as M from './an2d.js';
import { fb, clear, sel, vbox, skx, figK, figRow, nm, mechPlayer, PTS, card, note } from './ui.js';

/* ===================================================================
 * 17. Grupos protetores
 * =================================================================== */
export function protectFlow(host) {
  const P = PROTECT[0];
  host.append(
    h('p', { class: 'prompt', html: 'Objetivo: ' + P.want }),
    h('div', { class: 'cmp2' }, card('Sem proteção', h('div', null, figRow([P.start, `→<small>${P.reagent}</small>`, h('span', { class: 'qmark' }, '✘')]), h('p', { html: 'LiAlH₄ reduz <b>também</b> a cetona (mais reativa que o éster): obtém-se um diol, não o produto desejado.' })), 'bad'),
      card('Com proteção', h('div', null, h('ol', { class: 'flowv' }, [`<b>Proteger:</b> ${P.pg}`, `<b>Reagir:</b> ${P.reagent} (o cetal não reage)`, `<b>Desproteger:</b> ${P.deprot}`].map((t) => h('li', { html: t })))), 'good')),
    figRow([P.start, '→<small>HOCH₂CH₂OH, H⁺<br>− H₂O</small>', P.mid, '→<small>LiAlH₄</small>', P.mid2, '→<small>H₃O⁺</small>', P.goal], { scale: 24, fs: 12 }),
    note('key', 'Conceito-chave', 'O cetal “mascara” a carbonila: é estável em base, frente a nucleófilos e hidretos, e é removido por <b>ácido aquoso</b>.'));
}
export function diolCompare(host) {
  const a = vbox('short'), b = vbox('short');
  host.append(h('div', { class: 'cmp2' }, card('Etilenoglicol → 1,3-dioxolano (5 membros)', h('div', null, figK('dioxolano', { cap: false }), a)), card('Propano-1,3-diol → 1,3-dioxano (6 membros)', h('div', null, figK('dioxano', { cap: false }), b))),
    h('p', { class: 'hint3' }, 'Dióis formam cetais cíclicos: a segunda adição é intramolecular (entropicamente favorecida em relação a usar duas moléculas de álcool). Ambos são grupos protetores comuns; a escolha depende da facilidade de formação/remoção e do substrato.'));
  molView(a, 'dioxolano', { hlC: true, hint: false, labels: [[2, 'O', 'c'], [4, 'O', 'c']] });
  molView(b, 'dioxano', { hlC: true, hint: false, labels: [[2, 'O', 'c'], [4, 'O', 'c']] });
}
export function compatPanel(host) {
  host.append(h('div', { class: 'compat' }, COMPAT.map(([c, r, k]) => h('div', { class: 'crow ' + k }, h('span', null, c), h('b', null, r)))), h('p', { class: 'hint3' }, 'A escolha do grupo protetor depende das condições das etapas seguintes.'));
}

/* ===================================================================
 * 18. Tioacetais
 * =================================================================== */
export const thioMech = (host) => mechPlayer(host, M.thioFrames(), { pts: PTS.thio });
export function mozingo(host) {
  host.append(figRow(['cicloexanona', '→<small>HSCH₂CH₂SH<br>ácido de Lewis/H⁺</small>', 'ditiolano', '→<small>Ni de Raney, H₂<br>(dessulfurização)</small>', 'cicloexano']), figRow(['benzaldeido', '→<small>HSCH₂CH₂SH, H⁺</small>', 'ditiolanoBenz', '→<small>Ni de Raney</small>', 'tolueno']),
    note('key', 'Dessulfurização de Mozingo', 'O tioacetal/tiocetal é reduzido (ligações C–S → C–H), convertendo a carbonila em <b>CH₂</b> sob condições neutras. Outras desoxigenações (Wolff–Kishner, básica; Clemmensen, ácida) chegam ao mesmo resultado em condições bem diferentes. <i>Descrição conceitual, não um protocolo.</i>'),
    note('care', 'Cuidado', 'Tioacetais são <b>mais resistentes à hidrólise ácida</b> que os acetais: a desproteção costuma exigir reagentes específicos (ex.: sais de Hg²⁺, oxidantes).'));
  const v = vbox('short'); host.append(v); molView(v, 'ditiolano', { hlC: true, hint: false, labels: [[2, 'S', 'y'], [4, 'S', 'y']] });
}

/* ===================================================================
 * 19–23. Nucleófilos nitrogenados
 * =================================================================== */
export function amineSplit(host) {
  host.append(h('div', { class: 'cmp2' },
    card('Amina primária, RNH₂ → <span class="pr">imina</span>', h('div', null, figRow(['cicloexanona', '→<small>CH₃NH₂, H⁺ cat.<br>− H₂O</small>', 'imina'], { scale: 24, fs: 12 }), h('p', null, 'No íon imínio ainda existe N–H: sua desprotonação dá a C=N neutra.'))),
    card('Amina secundária, R₂NH → <span class="pr">enamina</span>', h('div', null, figRow(['cicloexanona', '→<small>pirrolidina, H⁺ cat.<br>− H₂O</small>', 'enamina'], { scale: 24, fs: 12 }), h('p', null, 'O imínio R₂C=N⁺R₂ não tem N–H: perde-se um H do carbono α → C=C–NR₂.')))),
    h('ol', { class: 'chainline' }, ['adição do N', 'carbinolamina', 'protonação do OH', 'perda de H₂O', 'íon imínio', 'N–H? → imina · sem N–H → enamina'].map((t) => h('li', null, t))));
}
export const imineMech = (host) => mechPlayer(host, M.imineFrames('CH₃'), { pts: PTS.imine, slow: true });
export function carbinolCompare(host) {
  const a = vbox('short'), b = vbox('short'), c = vbox('short');
  host.append(h('div', { class: 'grid3' }, card('Hemicetal: C(OH)(OR)', a), card('Carbinolamina: C(OH)(NHR)', b), card('Íon imínio: C=N⁺', c)));
  molView(a, 'hemicetal', { hlC: true, hyb: true, hint: false }); molView(b, 'carbinolamina', { hlC: true, hyb: true, hint: false, labels: [[2, 'OH', 'c'], [4, 'NHCH₃', 'c']] }); molView(c, 'iminio', { hlC: true, hyb: true, hint: false, labels: [[2, 'N⁺', 'c']] });
}
export const enamineMech = (host) => mechPlayer(host, M.enamineFrames(), { pts: PTS.enamine, slow: true });
export function nTable(host) {
  const R = [['NH₃', 'imina simples (NH; frequentemente instável/hidrolisável)', 'aldeido'], ['RNH₂ (1ª)', 'imina (C=N–R)', 'imina'], ['R₂NH (2ª)', 'enamina (C=C–NR₂) — exige H no C α', 'enamina'], ['NH₂OH', 'oxima (C=N–OH)', 'oxima'], ['NH₂NH₂', 'hidrazona (C=N–NH₂)', 'hidrazona'], ['ArNHNH₂ (ex.: 2,4-DNPH)', 'arilidrazona (derivados sólidos coloridos)', 'hidrazona']];
  host.append(h('div', { class: 'table-wrap' }, h('table', { class: 'cmp' }, h('thead', null, h('tr', null, h('th', null, 'Reagente nitrogenado'), h('th', null, 'Produto típico'))), h('tbody', null, R.map(([a, b]) => h('tr', null, h('th', null, a), h('td', null, b)))))),
    h('ol', { class: 'chainline' }, ['adição', 'carbinolamina', 'desidratação (− H₂O)', 'C=N (ou C=C–N)'].map((t) => h('li', null, t))), h('p', { class: 'hint3' }, 'Todas: equilíbrios com catálise ácida moderada; remover água favorece o produto.'));
}
export function enamineRegio(host) {
  const P = ['C=C(CC)N1CCCC1', 'CC=C(C)N1CCCC1'];
  host.append(h('p', null, 'Butanona + pirrolidina: há H nos dois carbonos α → duas enaminas possíveis (desprotonação em CH₃ ou em CH₂).'), figRow(['butanona', '→<small>pirrolidina, H⁺<br>− H₂O</small>', [P[0], { cap: 'C=C no lado do CH₃ (menos substituída)' }], '+', [P[1], { cap: 'C=C no lado do CH₂ (mais substituída)' }]], { scale: 24, fs: 12 }),
    note('care', 'Nível avançado', 'A proporção depende de fatores estéricos (tensão entre o anel da amina e substituintes no C=C) e das condições; com pirrolidina, a enamina menos substituída costuma ser relevante. Não use regra única.'));
}
export const oximeMech = (host) => mechPlayer(host, M.imineFrames('OH', false), { pts: null, opt3d: {} });
export const hydrazoneMech = (host) => mechPlayer(host, M.imineFrames('NH₂', false), { pts: null });
export function oximeFigs(host) {
  const v = vbox('short');
  host.append(h('div', { class: 'cmp2' }, h('div', null, figRow(['benzaldeido', '→<small>NH₂OH</small>', 'aldoxima'], { scale: 24, fs: 12 }), figRow(['acetona', '→<small>NH₂OH</small>', 'oxima'], { scale: 24, fs: 12 })), v), h('p', { class: 'hint3' }, 'Aldeído → aldoxima; cetona → cetoxima. Oximas podem existir como isômeros E/Z (C=N não gira livremente).'));
  molView(v, 'oxima', { hlC: true, hyb: true, lp: true, hint: false, labels: [[2, 'N', 'c']] });
}
export function hydrazoneFigs(host) {
  const v = vbox('short');
  host.append(h('div', { class: 'cmp2' }, h('div', null, figRow(['acetona', '→<small>NH₂NH₂</small>', 'hidrazona'], { scale: 24, fs: 12 }), figRow(['cicloexanona', '→<small>NH₂NH₂</small>', 'hidrazonaCiclo'], { scale: 24, fs: 12 })), v),
    note('think', 'Extensão: 2,4-dinitrofenil-hidrazina (2,4-DNPH)', 'Reage com aldeídos e cetonas formando 2,4-dinitrofenil-hidrazonas, sólidos coloridos (amarelo-laranja) com ponto de fusão característico — teste histórico de identificação de carbonilas. <i>Contexto conceitual, não protocolo.</i>'));
  molView(v, 'hidrazona', { hlC: true, hyb: true, lp: true, hint: false });
}

/* ===================================================================
 * 24–25. Cianoidrinas e ligações C–C
 * =================================================================== */
export const cyanoMech = (host) => mechPlayer(host, M.cyanoFrames(), { pts: PTS.base });
export function cyanoFaces(host) {
  const a = vbox('short'), b = vbox('short');
  host.append(h('div', { class: 'cmp2' }, card('CN⁻ pela face <i>Si</i> → (<i>R</i>)-mandelonitrila', a), card('CN⁻ pela face <i>Re</i> → (<i>S</i>)-mandelonitrila', b)),
    h('p', { class: 'hint3' }, 'O benzaldeído é plano (proquiral): em ambiente aquiral, as duas faces são atacadas igualmente → mistura racêmica de (R)- e (S)-mandelonitrila. O C–CN é uma nova ligação C–C (amarelo).'));
  molView(a, 'cianoR', { hlC: true, hint: false, labels: [[1, 'C* (R)', 'o'], [4, 'C≡N (nova C–C)', 'y'], [2, 'OH', 'c']] });
  molView(b, 'cianoS', { hlC: true, hint: false, labels: [[1, 'C* (S)', 'o'], [4, 'C≡N (nova C–C)', 'y'], [2, 'OH', 'c']] });
}
export function cyanoEq(host) {
  host.append(figRow(['benzaldeido', '⇌<small>HCN / CN⁻ (cat.)</small>', 'mandelonitrila'], { scale: 26 }), figRow(['acetona', '⇌<small>HCN / CN⁻</small>', 'cianoidrina'], { scale: 26 }),
    note('key', 'Reversibilidade', 'Em base, a cianoidrina pode perder CN⁻ e regenerar a carbonila. O equilíbrio é favorável para aldeídos e para cetonas pouco impedidas; cetonas volumosas favorecem menos o aduto.'),
    note('care', 'Cuidado', 'HCN e cianetos são <b>extremamente tóxicos</b>. Estudo apenas conceitual.'));
}
export function ccOverview(host) {
  host.append(h('div', { class: 'grid3' },
    card('Cianoidrina', h('div', null, figRow(['acetona', '→', 'cianoidrina'], { scale: 20, fs: 11 }), h('p', null, 'Nova C–C (C–CN); C passa a sp³.'))),
    card('Wittig', h('div', null, figRow(['cicloexanona', '→', ['metilenocicloexano', { cc: true }]], { scale: 20, fs: 11 }), h('p', null, 'Nova C=C no lugar da C=O.'))),
    card('HWE', h('div', null, figRow(['benzaldeido', '→', ['cinamato', { cc: true }]], { scale: 20, fs: 11 }), h('p', null, 'Nova C=C conjugada, geralmente E.')))));
}

/* ===================================================================
 * 26–30. Wittig, ilídeos, HWE
 * =================================================================== */
export function wittigOverview(host) {
  host.append(h('p', { class: 'mono center' }, 'R₂C=O  +  Ph₃P=CR′₂   →   R₂C=CR′₂  +  Ph₃P=O'), figRow(['cicloexanona', '→<small>Ph₃P=CH₂</small>', ['metilenocicloexano', { cc: true }], '+ Ph₃P=O'], { scale: 28 }), figRow(['benzaldeido', '→<small>Ph₃P=CHCH₃</small>', ['fenilpropeno', { cc: true }]], { scale: 28 }));
}
export const ylideMech = (host) => mechPlayer(host, M.ylideFormation(), { pts: PTS.ylide });
export function ylide3d(host) {
  const v = vbox(); host.append(v, h('p', { class: 'hint3 center' }, 'Ph₃P=CH₂: carbono nucleofílico (par/densidade no C), P tetraédrico com três fenilas.'));
  molView(v, 'ilideo', { hint: false, lp: false, labels: [[4, 'C⁻ (nucleofílico)', 'y']], halos: [[4, 0xffd45c]] });
}
export const wittigMech = (host) => mechPlayer(host, M.wittigFrames(), { pts: PTS.wittig, cap3d: 'Espécies 3D (MMFF): acetona → betaína (didática) → oxafosfetano → 2-metilpropeno.' });
export const hweMech = (host) => mechPlayer(host, M.hweFrames(), { pts: PTS.hwe });
export function ezCompare(host) {
  const a = vbox('short'), b = vbox('short');
  host.append(h('div', { class: 'cmp2' }, card('(E)-cinamato de etila — favorecido na HWE típica', a), card('(Z)-cinamato de etila', b)));
  molView(a, 'cinamatoE', { hint: false, labels: [[4, 'C', 'y'], [1, 'C', 'y']] }); molView(b, 'cinamatoZ', { hint: false, labels: [[4, 'C', 'y'], [1, 'C', 'y']] });
}
export function wittigHweTable(host) {
  const R = [['Reagente', 'ilídeo de fósforo (Ph₃P=CR₂)', 'ânion de fosfonato ((RO)₂P(O)CH⁻R)'], ['Carbonila', 'aldeído / cetona', 'aldeído / cetona (aldeídos reagem melhor)'], ['Produto', 'alceno', 'alceno (frequentemente conjugado a C=O)'], ['Subproduto de P', 'Ph₃P=O (difícil de separar)', '(RO)₂PO₂⁻ (hidrossolúvel)'], ['E/Z', 'depende do ilídeo: não estabilizado → tendência Z; estabilizado → tendência E', 'muitas vezes E com fosfonatos estabilizados'], ['Nucleofilicidade', 'ilídeos não estabilizados: muito reativos', 'carbânion mais nucleofílico que ilídeos estabilizados correspondentes']];
  host.append(h('div', { class: 'table-wrap' }, h('table', { class: 'cmp' }, h('thead', null, h('tr', null, h('th', null, 'Característica'), h('th', null, 'Wittig'), h('th', null, 'HWE'))), h('tbody', null, R.map((r) => h('tr', null, h('th', null, r[0]), h('td', null, r[1]), h('td', null, r[2])))))));
}
const WQ = [['Alceno E conjugado a éster a partir de um aldeído, com subproduto fácil de remover.', 'HWE', 'Fosfonato estabilizado → E; fosfato hidrossolúvel.'], ['Introduzir =CH₂ numa cetona (metilenação).', 'Wittig', 'Ph₃P=CH₂ (ilídeo simples) é o reagente clássico.'], ['Alceno dissubstituído com tendência Z a partir de aldeído e ilídeo não estabilizado.', 'Wittig', 'Ilídeos não estabilizados, em condições sem sais, tendem a Z.'], ['α,β-insaturado éster (E) a partir de benzaldeído.', 'HWE', 'Clássico da HWE.']];
export function wittigOrHwe(host) {
  let k = 0; const box = h('div'), out = h('div', { 'aria-live': 'polite' });
  const draw = () => { const [q, a, e] = WQ[k]; out.replaceChildren(); clear(box).append(h('p', { class: 'prompt' }, q), h('div', { class: 'ch-answers' }, ['Wittig', 'HWE'].map((t) => h('button', { class: 'btn', type: 'button', onclick: () => out.replaceChildren(fb(t === a ? 'ok' : 'bad', `${t === a ? '✔' : '✘'} ${a}: ${e}`), h('button', { class: 'btn sm primary', type: 'button', onclick: () => { k = (k + 1) % WQ.length; draw(); } }, 'Próxima →')) }, t)))); };
  host.append(box, out); draw();
}
export function wittigRetro(host) {
  let k = 0; const box = h('div'), out = h('div', { 'aria-live': 'polite' });
  const draw = () => {
    const W = WRETRO[k]; out.replaceChildren();
    const svg = skx(W.alk, { scale: 44, fs: 17, cc: true, zoom: 1.3 });
    const C = svg._chem, NS = 'http://www.w3.org/2000/svg', g = document.createElementNS(NS, 'g'); g.setAttribute('transform', C.transform); svg.append(g);
    svg._s.bonds.forEach(([a, b, t]) => { if (t !== 2) return; const p = C.atoms[a], q = C.atoms[b]; const ln = document.createElementNS(NS, 'line'); [['x1', p.x], ['y1', p.y], ['x2', q.x], ['y2', q.y], ['class', 'cut'], ['tabindex', 0], ['role', 'button'], ['aria-label', 'ligação C=C: clique para desconectar']].forEach(([x, y]) => ln.setAttribute(x, y)); const f = () => { ln.classList.add('done'); show(); }; ln.addEventListener('click', f); ln.addEventListener('keydown', (e) => { if (e.key === 'Enter') f(); }); g.append(ln); });
    clear(box).append(h('p', { class: 'prompt' }, 'Clique na C=C que será formada pela Wittig (desconexão).'), h('div', { class: 'figs' }, h('figure', { class: 'fig' }, svg, h('figcaption', null, COMP[W.alk].name))));
    function show() { out.replaceChildren(h('p', null, 'Desconexões possíveis (cada carbono da C=C vem de um fragmento):'), h('div', { class: 'grid2' }, W.opts.map(([c, y], i) => card(`Opção ${i + 1}${i === W.best ? ' · <span class="pr">preferível</span>' : ''}`, `<b>${c}</b> + <b>${y}</b>`, i === W.best ? 'good' : ''))), fb('neutral', W.why), h('button', { class: 'btn sm primary', type: 'button', onclick: () => { k = (k + 1) % WRETRO.length; draw(); } }, 'Outro alceno →')); }
  };
  host.append(box, out); draw();
}

/* ===================================================================
 * 31. Mapa geral
 * =================================================================== */
const MAP = [['H2O', 'H₂O', 'gem-diol', 'add', 'hidratoAcetona'], ['MeOH', 'ROH (H⁺)', 'hemiacetal → acetal', 'cond', 'cetal'], ['glicol', 'diol (H⁺)', 'acetal cíclico', 'cond', 'dioxolanoAcetona'], ['RNH2', 'RNH₂', 'imina', 'cond', 'iminaAcetona'], ['R2NH', 'R₂NH', 'enamina', 'cond', 'enaminaAcetona'], ['NH2OH', 'NH₂OH', 'oxima', 'cond', 'oxima'], ['NH2NH2', 'NH₂NH₂', 'hidrazona', 'cond', 'hidrazona'], ['CN', 'CN⁻/HCN', 'cianoidrina', 'add', 'cianoidrina'], ['ylide', 'ilídeo P', 'alceno (Wittig)', 'ole', 'metilpropeno'], ['HWE', 'fosfonato', 'alceno (HWE)', 'ole', 'crotonato']];
export function reactionMap(host) {
  const W = 860, H = 560, cx = W / 2, cy = H / 2, R = 215, svg = svgEl(W, H, 'Mapa geral: reações de aldeídos e cetonas com nucleófilos');
  svg.innerHTML = '<defs><marker id="rm" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#9fb0cc"/></marker></defs>';
  const out = h('div', { 'aria-live': 'polite' });
  const center = add(svg, 'g', { class: 'node center' }); add(center, 'rect', { x: cx - 92, y: cy - 30, width: 184, height: 60, rx: 16 }); add(center, 'text', { x: cx, y: cy + 6, 'text-anchor': 'middle' }, 'ALDEÍDO / CETONA');
  MAP.forEach(([k, nu, prod, kind, key], i) => {
    const a = -Math.PI / 2 + i * 2 * Math.PI / MAP.length, x = cx + R * Math.cos(a) * 1.55, y = cy + R * Math.sin(a);
    add(svg, 'line', { x1: cx + 95 * Math.cos(a), y1: cy + 34 * Math.sin(a), x2: x - 70 * Math.cos(a), y2: y - 26 * Math.sin(a), class: 'edge ' + kind, 'marker-end': 'url(#rm)' });
    const g = add(svg, 'g', { class: 'node ' + kind, tabindex: 0, role: 'button', 'aria-label': `${nu} → ${prod}` }); add(g, 'rect', { x: x - 78, y: y - 26, width: 156, height: 52, rx: 12 }); add(g, 'text', { x, y: y - 4, 'text-anchor': 'middle', class: 'nu' }, nu); add(g, 'text', { x, y: y + 15, 'text-anchor': 'middle', class: 'pr' }, prod);
    const f = () => { svg.querySelectorAll('.node').forEach((n) => n.classList.toggle('on', n === g)); const N = NUCS[k]; out.replaceChildren(h('div', { class: 'cmp2' }, h('div', null, figRow(['acetona', `→<small>${N.lab}</small>`, [key, { cc: kind === 'ole' }]], { scale: 24, fs: 12 })), h('div', null, h('p', { html: `<b>Tipo:</b> ${N.type}<br><b>Ligação formada:</b> ${N.bond}<br><b>Reversível?</b> ${N.rev}<br><b>Catálise:</b> ${N.cat}<br><b>Forma água?</b> ${N.water}` })))); };
    g.addEventListener('click', f); g.addEventListener('keydown', (e) => { if (e.key === 'Enter') f(); });
  });
  host.append(h('div', { class: 'energywrap net' }, svg), h('div', { class: 'legend' }, h('span', null, h('i', { style: 'background:#3ddc97' }), 'adição'), h('span', null, h('i', { style: 'background:#b18cff' }), 'adição + eliminação'), h('span', null, h('i', { style: 'background:#ffd45c' }), 'olefinação (nova C=C)')), out);
}
export function typesCompare(host) {
  host.append(h('div', { class: 'grid3' },
    card('<span class="pr">Adição</span>', h('div', null, h('p', null, 'Nu → C=O; π → O; protonação. O carbono termina <b>sp³</b>.'), h('div', { class: 'figs' }, ['hidratoAcetona', 'cianoidrina', 'hemicetal'].map((k) => figK(k, { scale: 20, fs: 11 }))))),
    card('<span class="it">Adição + eliminação</span>', h('div', null, h('p', null, 'Adição → transferências de H⁺ → perda de H₂O (ou ROH) → C=N, C=O⁺R, C=C–N.'), h('div', { class: 'figs' }, ['cetal', 'iminaAcetona', 'enaminaAcetona', 'oxima', 'hidrazona'].map((k) => figK(k, { scale: 20, fs: 11 }))))),
    card('<span class="cc">Olefinação</span>', h('div', null, h('p', null, 'Nucleófilo de carbono ligado a P → anel C–C–P–O → <b>C=C</b> + P=O.'), h('div', { class: 'figs' }, ['metilpropeno', 'crotonato'].map((k) => figK(k, { scale: 20, fs: 11, cc: true })))))));
}
export function masterTable(host) {
  const R = [['H₂O', 'gem-diol', 'adição', 'ácido ou base', 'sim'], ['ROH', 'hemiacetal / acetal', 'adição; adição + substituição (H⁺)', 'ácido (acetal)', 'sim'], ['RNH₂', 'imina', 'adição + eliminação', 'ácido moderado', 'sim'], ['R₂NH', 'enamina', 'adição + eliminação', 'ácido moderado', 'sim'], ['NH₂OH', 'oxima', 'adição + eliminação', 'ácido moderado', 'sim'], ['NH₂NH₂', 'hidrazona', 'adição + eliminação', 'ácido moderado', 'sim'], ['CN⁻ / HCN', 'cianoidrina', 'adição', 'base (CN⁻)', 'sim'], ['ilídeo de P', 'alceno', 'olefinação (Wittig)', 'base forte (preparo do ilídeo)', 'não, na prática'], ['fosfonato', 'alceno (geralmente E)', 'olefinação (HWE)', 'base', 'não, na prática']];
  const out = h('div', { 'aria-live': 'polite' });
  host.append(h('div', { class: 'table-wrap' }, h('table', { class: 'cmp clickable' }, h('thead', null, h('tr', null, ['Nucleófilo/reagente', 'Produto principal', 'Tipo de processo', 'Condições', 'Reversível?'].map((t) => h('th', null, t)))), h('tbody', null, R.map((r) => h('tr', { tabindex: 0, onclick: () => out.replaceChildren(fb('neutral', `<b>${r[0]}</b>: o nucleófilo ataca o C=O → intermediário tetraédrico → ${r[2].includes('elimina') ? 'perda de água (condensação)' : r[2].includes('olefina') ? 'anel com P → C=C + P=O' : 'protonação (produto tetraédrico)'} → <b>${r[1]}</b>.`)) }, r.map((c, i) => h(i ? 'td' : 'th', null, c))))))), out);
}
export function condPanel(host) {
  host.append(h('div', { class: 'grid4' },
    card('Hemiacetal / acetal', '<b>ROH</b> · <b>H⁺</b> (cat.) · excesso de álcool · <b>remover H₂O</b> favorece o acetal'),
    card('Hidrólise de acetal', '<b>H₂O</b> (excesso) · <b>H⁺</b> · em base o acetal é estável'),
    card('Imina', '<b>RNH₂</b> · catálise ácida <b>moderada</b> · remover H₂O'),
    card('Enamina', '<b>R₂NH</b> · catálise ácida moderada · remover H₂O · precisa de H α')));
}
void nm; void M3D;
