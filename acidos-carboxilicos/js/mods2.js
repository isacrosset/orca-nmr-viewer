/*
 * mods2.js — módulos 25–37: amidas (estrutura, formação, ácido + amina,
 * agentes de acoplamento, hidrólise), lactamas, nitrilas (desidratação,
 * hidrólises), descarboxilação e mapa de interconversões.
 */
import { h, tgl } from './widgets2d.js';
import { V } from './struct.js';
import { svgEl, add } from './arom2d.js';
import { COMP, DERIV } from './data.js';
import { molView, M3D } from './m3d.js';
import { moSurf, dashed } from './co3d.js';
import * as A from './ac2d.js';
import { fb, clear, vbox, legend, svgOf, skx, figK, figRow, nm, mechPlayer, PTS, tabs, card, note } from './ui.js';

const P3 = (key, i) => M3D[key].atoms[i].slice(1, 4);
const mp = (key, n) => M3D[key].map[n];
const dist = (key, a, b) => V.len(V.sub(P3(key, a), P3(key, b)));
const ang = (key, a, b, c) => { const u = V.norm(V.sub(P3(key, a), P3(key, b))), w = V.norm(V.sub(P3(key, c), P3(key, b))); return Math.acos(Math.max(-1, Math.min(1, V.dot(u, w)))) * 180 / Math.PI; };
const f2 = (x) => x.toFixed(2).replace('.', ',');
function bars(items) { return h('div', { class: 'eqbars' }, items.map(([t, p, cls, val]) => h('div', { class: 'eqbar' }, h('span', { class: 'lab', html: t }), h('div', { class: 'track' }, h('i', { class: cls || 'p', style: `width:${Math.max(1, Math.min(100, p))}%` })), h('b', { html: val ?? '' })))); }

/* ===================================================================
 * 25. Amidas: estrutura e ressonância
 * =================================================================== */
export function amideTypes(host) { host.append(h('div', { class: 'figs' }, [['acetamida', 'primária (RCONH₂)'], ['nMetilacetamida', 'secundária (RCONHR)'], ['dma', 'terciária (RCONR₂)']].map(([k, t]) => figK(k, { cap: `${nm(k)} · ${t}` })))); }
export function amideRes(host) {
  const v = vbox(); const k = 'dma', c = mp(k, 1), n = mp(k, 4), o = mp(k, 2);
  const dCN = dist(k, c, n), dCO = dist(k, c, o);
  let pOn = false; const A3 = molView(v, k, { hlC: true, hint: false, labels: [[4, `N (C–N ${f2(dCN)} Å)`, 'c'], [2, `O (C=O ${f2(dCO)} Å)`, 'c']], post: (grp, G) => { if (!pOn) return; const C = G.atoms[G.map(1)].p, N = G.atoms[G.map(4)].p, O = G.atoms[G.map(2)].p; const nrm = V.norm(V.cross(V.sub(O, C), V.sub(N, C))); moSurf(grp, [O, C, N], [nrm, nrm, nrm], [0.5, 0.6, 0.62], { opacity: 0.5 }); } });
  host.append(h('div', { class: 'cmp2' }, h('div', null, h('div', { class: 'figs' }, svgOf(A.resPair('NR₂', { cls: 'nu', lpY: [330] }), { scale: 32, fs: 15 })), h('ul', null, h('li', { html: `C–N ≈ ${f2(dCN)} Å (amina simples ≈ 1,47 Å): caráter parcial de <b>dupla</b>.` }), h('li', { html: 'O, C, N e os átomos ligados ficam aproximadamente <b>coplanares</b>.' }), h('li', { html: 'Rotação C–N <b>restringida</b> (barreira ≈ 65–85 kJ/mol).' }))), h('div', null, v, h('div', { class: 'controls' }, tgl('Mostrar sistema π conjugado O–C–N (qualitativo)', () => { pOn = !pOn; A3.rebuild(); return pOn; }, false)))));
}
export function amideWhy(host) {
  host.append(h('ol', { class: 'chainline' }, ['forte doação por ressonância do N', 'carbono acílico menos eletrofílico', 'R₂N⁻ seria grupo de saída péssimo (pKₐ ≈ 35–38)'].map((t) => h('li', null, t))), note('err', 'Erro comum', 'Amidas são pouco reativas porque apresentam forte estabilização por ressonância <b>e</b> um grupo abandonador muito ruim — não por “falta” de carbonila.'));
}
/* ---------- formação ---------- */
export const amideFromCl = (host) => { host.append(figRow(['cloretoAcetila', '→<small>2 NH₃</small>', 'acetamida'], { scale: 22, fs: 11 }), figRow(['cloretoAcetila', '→<small>2 CH₃NH₂</small>', 'nMetilacetamida'], { scale: 22, fs: 11 }), figRow(['cloretoAcetila', '→<small>2 (CH₃)₂NH</small>', 'dma'], { scale: 22, fs: 11 })); const d = h('div'); host.append(d); mechPlayer(d, A.nasNeutral({ Y: 'Cl', nuL: 'N', nuR: 'CH₃', Ylg: 'Cl⁻', base: 'CH₃NH₂', baseName: 'uma 2ª molécula de amina (ou Et₃N/piridina)', prodName: 'N-metilacetamida', byprod: '+ CH₃NH₃⁺ Cl⁻', k0: 'cloretoAcetila', k1: 'tetraClNH3', k2: 'nMetilacetamida', k3: 'nMetilacetamida', end: 'É preciso base (ou 2 equiv. de amina) para neutralizar o HCl; senão a amina seria protonada e deixaria de ser nucleófila.' }), { pts: PTS.neutral }); host._stop = d._stop; };
export const amideFromAnh = (host) => mechPlayer(host, A.nasNeutral({ Y: 'OCOCH₃', nuL: 'N', nuR: 'CH₃', Ylg: 'CH₃COO⁻', lgWhy: 'carboxilato, estabilizado por ressonância', base: 'CH₃NH₂', prodName: 'Amida + carboxilato', byprod: '+ CH₃COO⁻ CH₃NH₃⁺', k0: 'anidridoAcetico', k1: 'tetraAnidridoOMe', k2: 'nMetilacetamida', k3: 'nMetilacetamida' }), { pts: PTS.neutral, cap3d: 'Espécies 3D da família acetila (o tetraédrico mostrado é análogo, com O no lugar do N).' });
export const aminolysis = (host) => mechPlayer(host, A.nasNeutral({ Y: 'OCH₃', nuL: 'N', nuR: 'CH₃', Ylg: 'CH₃O⁻ → CH₃OH', lgWhy: 'mau grupo de saída; por isso a etapa é lenta e costuma ser assistida por transferência de próton', base: 'CH₃O⁻', baseName: 'o metóxido liberado (ou outra amina)', prodName: 'Amida (aminólise de éster)', byprod: '+ CH₃OH', k0: 'acetatoMetila', k1: 'tetraClNH3', k2: 'nMetilacetamida', k3: 'nMetilacetamida', end: 'Éster → amida desce a escada, mas é bem mais lenta que a partir do cloreto de acila (exige aquecimento/excesso de amina).' }), { pts: PTS.neutral });
export const acidAmine = (host) => mechPlayer(host, A.acidAmineFrames(), { pts: PTS.acidAmine, cap3d: 'Ácido benzoico → íon carboxilato (sal).' });
export const dccMech = (host) => mechPlayer(host, A.dccFrames(), { pts: PTS.dcc });
export function amideRoutes(host) {
  const R = [['Cloreto de acila', 'RCOCl + 2 R′NH₂', 'muito rápida', 'Cl⁻'], ['Anidrido', '(RCO)₂O + 2 R′NH₂', 'rápida', 'RCOO⁻'], ['Éster', 'RCOOR″ + R′NH₂, calor', 'lenta', 'R″O⁻ (→ R″OH)'], ['Ácido ativado', 'RCOOH + DCC/EDC + R′NH₂', 'boa, condições brandas', 'ureia (DCU/EDU)'], ['Ácido + amina', 'RCOOH + R′NH₂, t.a.', '✘ forma sal', '—']];
  host.append(h('div', { class: 'table-wrap' }, h('table', { class: 'cmp' }, h('thead', null, h('tr', null, ['Rota', 'Reagentes', 'Reatividade', 'Grupo de saída'].map((t) => h('th', null, t)))), h('tbody', null, R.map((r) => h('tr', null, h('th', null, r[0]), ...r.slice(1).map((c) => h('td', null, c))))))));
}
export const amideHyd = (host) => tabs(host, [['Meio ácido', (p) => mechPlayer(p, A.amideAcidFrames(), { pts: PTS.amideAcid })], ['Meio básico', (p) => mechPlayer(p, A.amideBaseFrames(), { pts: PTS.amideBase })]]);
export function amideVsEster(host) {
  host.append(bars([['<b>cloreto de acila</b> + H₂O', 98, 'p', 'segundos'], ['<b>anidrido</b> + H₂O', 80, 'p', 'minutos'], ['<b>éster</b> + H₂O (H⁺ ou HO⁻)', 50, 'r', 'horas (aquecimento ajuda)'], ['<b>amida</b> + H₂O (H⁺ ou HO⁻)', 12, 'r', 'muito lenta; calor prolongado']]), h('p', { class: 'hint3' }, 'Escala qualitativa de facilidade de hidrólise. A meia-vida de uma ligação peptídica (amida) em água neutra a 25 °C é da ordem de anos.'));
}

/* ===================================================================
 * 31. Lactamas
 * =================================================================== */
export function lactamIntro(host) { host.append(h('div', { class: 'figs' }, [['betaLactama', 'β (4)'], ['gamaLactama', 'γ (5)'], ['deltaLactama', 'δ (6)'], ['caprolactama', 'ε (7)']].map(([k, t]) => figK(k, { cap: `${nm(k)} · ${t}` })))); }
export function lactamForm(host) { host.append(figRow(['aminobutanoico', '→<small>ativação (ex.: aquecimento com remoção de H₂O,<br>ou ácido ativado)</small>', 'gamaLactama'], { scale: 26 }), note('care', 'Cuidado', 'A simples presença de NH₂ e COOH na mesma molécula não garante ciclização espontânea: à temperatura ambiente predomina o <b>zwitterion</b> (NH₃⁺/COO⁻). Em geral é necessária ativação ou aquecimento.')); }
export function lactam3d(host) {
  const v = vbox(); const K = ['betaLactama', 'gamaLactama', 'deltaLactama']; let k = 1;
  const lab = (key) => { const c = mp(key, 1), n = mp(key, 4), o = mp(key, 2); const nb = M3D[key].bonds.filter(([a, b]) => a === c || b === c).map(([a, b]) => (a === c ? b : a)).filter((x) => x !== o && x !== n)[0]; return [[1, `C=O · ∠(N–C–C) ${Math.round(ang(key, n, c, nb))}°`, 'o'], [4, `N (C–N ${f2(dist(key, c, n))} Å)`, 'c']]; };
  const Av = molView(v, K[k], { hlC: true, hint: false, labels: lab(K[k]) });
  host.append(h('div', { class: 'controls' }, ...K.map((x, i) => h('button', { class: 'btn sm', type: 'button', onclick: () => { k = i; Av.st.labels = lab(x); Av.set(x); } }, M3D[x].name))), v,
    note('think', 'β-lactamas (complementar)', 'No anel de 4 membros os ângulos (≈ 90°) ficam longe de 120°: há <b>tensão</b> e o N fica mais piramidal, com <b>ressonância amídica menos eficiente</b>. Resultado: a carbonila é mais eletrofílica e o anel abre com mais facilidade que em amidas comuns.'));
}

/* ===================================================================
 * 32–35. Nitrilas
 * =================================================================== */
export function nitrile3d(host) {
  const v = vbox(); const k = 'acetonitrila', c = mp(k, 1), n = mp(k, 2), r = mp(k, 3);
  host.append(h('div', { class: 'cmp2' }, h('div', null, h('p', { class: 'mono center' }, 'R–C≡N'), h('ul', null, h('li', { html: 'Carbono nitrílico <b>sp</b>, <b>linear</b> (R–C≡N ≈ 180°).' }), h('li', { html: 'C≡N: <b>1 σ + 2 π</b> (perpendiculares).' }), h('li', { html: 'O carbono é eletrofílico (C≡N polarizada); mesmo nível de oxidação de um ácido carboxílico.' }))), v));
  molView(v, k, { hlC: true, lp: true, hint: false, labels: [[1, `C sp · ∠ ${Math.round(ang(k, r, c, n))}°`, 'o'], [2, 'N (par isolado)', 'c']] });
}
export function nitrileSynth(host) { host.append(figRow(['bromoetano', '→<small>NaCN (SN2)</small>', 'propanonitrila', '→<small>H₃O⁺, calor</small>', 'acidoPropanoico'], { scale: 24, fs: 12 }), figRow(['brometoBenzila', '→<small>NaCN</small>', 'fenilacetonitrila', '→<small>H₃O⁺, calor</small>', 'acidoFenilacetico'], { scale: 24, fs: 12 }), note('key', 'Nitrila como equivalente sintético de ácido', 'R–X → R–C≡N → R–COOH: a nitrila introduz <b>um carbono a mais</b> e depois é hidrolisada ao ácido.')); }
export const dehydMech = (host) => mechPlayer(host, A.dehydrationFrames(), { pts: PTS.dehyd });
export function geomChange(host) {
  const a = vbox('short'), b = vbox('short'); const k1 = 'benzamida', k2 = 'benzonitrila';
  const a1 = ang(k1, mp(k1, 3), mp(k1, 1), mp(k1, 2)), a2 = ang(k2, mp(k2, 3), mp(k2, 1), mp(k2, 2));
  host.append(h('div', { class: 'cmp2' }, card(`Benzamida: C sp² · ∠(C–C=O) ${Math.round(a1)}°`, a), card(`Benzonitrila: C sp · ∠(C–C≡N) ${Math.round(a2)}°`, b)));
  molView(a, k1, { hlC: true, hyb: true, hint: false }); molView(b, k2, { hlC: true, hint: false, labels: [[1, 'C sp (linear)', 'o']] });
}
export const nitAcid = (host) => tabs(host, [['Mecanismo detalhado', (p) => mechPlayer(p, A.nitrileAcidFrames(true), { pts: PTS.nitAcid, slow: true })], ['Simplificado', (p) => mechPlayer(p, A.nitrileAcidFrames(false), { pts: PTS.nitAcidS })]]);
export const nitBase = (host) => mechPlayer(host, A.nitrileBaseFrames(), { pts: PTS.nitBase });

/* ===================================================================
 * 36. Descarboxilação
 * =================================================================== */
export const decarbMech = (host) => mechPlayer(host, A.decarbFrames(), { pts: PTS.decarb, cap3d: 'Ácido acetoacético na conformação com ligação de H intramolecular (ciclo de 6), enol e acetona (MMFF94).' });
export function decarbTS(host) {
  const v = vbox(); const k = 'acetoacetico';
  const D = M3D[k], Hh = D.bonds.filter(([a, b]) => a === mp(k, 4) || b === mp(k, 4)).map(([a, b]) => (a === mp(k, 4) ? b : a)).find((x) => D.atoms[x][0] === 'H');
  const Ok = D.atoms.findIndex((a, i) => a[0] === 'O' && i !== mp(k, 2) && i !== mp(k, 4));
  const Av = molView(v, k, { hlC: true, hint: false, labels: [[4, 'O–H', 'c'], ['#' + Ok, 'O cetônico (recebe o H)', 'c'], [1, 'C → CO₂', 'o']], post: (grp, G) => dashed(grp, G.atoms[Hh].p, G.atoms[Ok].p, 0x2fd4f5) });
  void Av;
  host.append(v, h('p', { class: 'hint3 center' }, 'Conformação com ligação de H intramolecular (tracejado): o ciclo de 6 átomos (O=C–C–C–O–H) que leva ao estado de transição concertado. Representação esquemática do ET.'));
}
export function malonic(host) { host.append(figRow(['metilmalonico', '→<small>calor<br>− CO₂</small>', 'acidoPropanoico'], { scale: 24, fs: 12 }), figRow(['benzilmalonico', '→<small>calor, − CO₂</small>', 'fenilpropanoico'], { scale: 24, fs: 12 }), note('think', 'Ponte para a síntese malônica', 'Derivados do ácido malônico descarboxilam pelo mesmo mecanismo cíclico (a segunda C=O faz o papel da cetona). Base da síntese malônica de ácidos substituídos.')); }
const DQ = [['acetoacetico', true, 'β-cetoácido: ciclo de 6 com o O cetônico.'], ['acidoButanoico', false, 'Ácido simples: sem C=O em β; não descarboxila por simples aquecimento.'], ['malonico', true, 'Derivado malônico: a outra C=O está em β.'], ['acidoBenzoico', false, 'Ácido aromático simples: estável ao aquecimento moderado.'], ['cetoNaoBeta', false, 'γ-Cetoácido: a C=O cetônica está longe demais para o ciclo de 6.'], ['benzoilacetico', true, 'β-cetoácido.']];
export function decarbQuiz(host) {
  const out = h('div', { 'aria-live': 'polite' });
  host.append(h('p', { class: 'prompt' }, 'Qual sofre descarboxilação fácil ao ser aquecido? Clique.'), h('div', { class: 'pickgrid' }, DQ.map(([k, ok, e]) => h('button', { class: 'pickcard', type: 'button', onclick: (ev) => { ev.currentTarget.classList.add(ok ? 'right' : 'wrong'); out.replaceChildren(fb(ok ? 'ok' : 'bad', `${ok ? '✔ Sim' : '✘ Não'}: ${e}`)); } }, skx(k, { scale: 20, fs: 11 }), h('small', null, nm(k))))), out,
    note('err', 'Erro comum', 'Nem todo ácido carboxílico descarboxila facilmente. É favorecida quando a estrutura estabiliza o ET/produto — β-cetoácidos e derivados malônicos.'));
}

/* ===================================================================
 * 37. Mapa de interconversões e tabelas mestre
 * =================================================================== */
const NODES = { acido: [430, 210, 'ÁCIDO CARBOXÍLICO'], cloreto: [150, 60, 'cloreto de acila'], anidrido: [430, 50, 'anidrido'], ester: [720, 80, 'éster'], amida: [720, 330, 'amida'], nitrila: [430, 400, 'nitrila'], carboxilato: [150, 340, 'carboxilato'], lactona: [860, 200, 'lactona'], lactama: [880, 420, 'lactama'], hidroxi: [960, 110, 'hidroxiácido'], cetoacido: [150, 200, 'β-cetoácido'] };
const EDGES = [['acido', 'cloreto', 'SOCl₂, (COCl)₂, PCl₃, PCl₅'], ['cloreto', 'anidrido', 'RCOO⁻'], ['cloreto', 'ester', 'ROH (base)'], ['cloreto', 'amida', 'RNH₂ (2 equiv.)'], ['anidrido', 'ester', 'ROH'], ['anidrido', 'amida', 'RNH₂'], ['acido', 'ester', 'ROH, H⁺ (Fischer) ⇌'], ['ester', 'acido', 'H₃O⁺ ⇌'], ['ester', 'carboxilato', 'HO⁻ (saponificação)'], ['ester', 'amida', 'RNH₂, calor (aminólise)'], ['amida', 'acido', 'H₃O⁺, calor'], ['amida', 'carboxilato', 'HO⁻, calor'], ['amida', 'nitrila', 'SOCl₂/P₂O₅/POCl₃ (amida 1ª)'], ['nitrila', 'amida', 'H₂O (H⁺ ou HO⁻)'], ['nitrila', 'acido', 'H₃O⁺, calor (via amida)'], ['carboxilato', 'acido', 'H₃O⁺'], ['acido', 'carboxilato', 'base'], ['hidroxi', 'lactona', 'H⁺, − H₂O'], ['lactama', 'amida', '(amida cíclica)'], ['cetoacido', 'acido', '(β-cetoácido) calor: − CO₂ → cetona']];
export function interMap(host) {
  const W = 1060, Hh = 470, svg = svgEl(W, Hh, 'Mapa de interconversões de ácidos carboxílicos e derivados');
  svg.innerHTML = '<defs><marker id="im" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#9fb0cc"/></marker></defs>';
  const out = h('div', { 'aria-live': 'polite' });
  EDGES.forEach(([a, b], k) => { const [x1, y1] = NODES[a], [x2, y2] = NODES[b]; const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy); const off = EDGES.some(([c, d]) => c === b && d === a) ? 9 : 0, nx = -dy / L * off, ny = dx / L * off; add(svg, 'line', { x1: x1 + dx / L * 80 + nx, y1: y1 + dy / L * 26 + ny, x2: x2 - dx / L * 80 + nx, y2: y2 - dy / L * 26 + ny, class: 'edge ' + (['cloreto', 'anidrido'].includes(b) && a !== 'cloreto' && a !== 'anidrido' ? 'ox' : b === 'acido' || b === 'carboxilato' ? 'cl' : 'red'), 'marker-end': 'url(#im)', 'data-k': k }); });
  Object.entries(NODES).forEach(([k, [x, y, t]]) => { const g = add(svg, 'g', { class: 'node' + (k === 'acido' ? ' center' : ''), tabindex: 0, role: 'button', 'aria-label': t }); const hw = k === 'acido' ? 112 : 80; add(g, 'rect', { x: x - hw, y: y - 22, width: 2 * hw, height: 44, rx: 12 }); add(g, 'text', { x, y: y + 5, 'text-anchor': 'middle' }, t);
    const f = () => { svg.querySelectorAll('.node').forEach((n) => n.classList.toggle('on', n === g)); svg.querySelectorAll('.edge').forEach((l) => { const e = EDGES[+l.dataset.k]; l.classList.toggle('on', e[0] === k || e[1] === k); l.classList.toggle('dim', !(e[0] === k || e[1] === k)); }); out.replaceChildren(h('div', null, h('p', null, h('b', null, t + ':')), h('ul', null, EDGES.filter((e) => e[0] === k).map((e) => h('li', { html: `→ <b>${NODES[e[1]][2]}</b>: ${e[2]}` })), EDGES.filter((e) => e[1] === k).map((e) => h('li', { html: `← de <b>${NODES[e[0]][2]}</b>: ${e[2]}` }))))); };
    g.addEventListener('click', f); g.addEventListener('keydown', (e) => { if (e.key === 'Enter') f(); }); });
  host.append(h('div', { class: 'energywrap net' }, svg), legend([['#ffd45c', 'descer a escada / formação direta'], ['#b18cff', 'ativação (subir)'], ['#ff4fa3', 'hidrólise → ácido/carboxilato']]), out);
}
export function masterDeriv(host) {
  host.append(h('div', { class: 'table-wrap' }, h('table', { class: 'cmp' }, h('thead', null, h('tr', null, ['Derivado', 'Fórmula geral', 'Grupo de saída típico', 'Reatividade'].map((t) => h('th', null, t)))), h('tbody', null, DERIV.map((d) => h('tr', null, h('th', null, d.name), h('td', null, d.f), h('td', null, d.k === 'acido' ? 'OH: necessita ativação' : d.k === 'ester' ? 'RO⁻ / ROH após ativação' : d.k === 'amida' ? 'R₂N⁻ é muito ruim' : d.lg), h('td', null, d.k === 'acido' ? 'dependente das condições' : d.rx)))))));
}
export function masterInter(host) {
  const R = [['Ácido', 'SOCl₂', 'cloreto de acila'], ['Cloreto de acila', 'RCOO⁻', 'anidrido'], ['Ácido + ROH', 'H⁺', 'éster (⇌)'], ['RCOCl + ROH', 'base adequada', 'éster'], ['Éster', 'H₂O / H⁺', 'ácido (⇌)'], ['Éster', 'HO⁻', 'carboxilato'], ['RCOCl + amina', 'base / excesso de amina', 'amida'], ['Éster + amina', 'condições adequadas (calor)', 'amida'], ['Amida', 'agente desidratante', 'nitrila (amida 1ª)'], ['Nitrila', 'H₃O⁺, calor', 'ácido'], ['Nitrila', 'HO⁻, H₂O, calor', 'carboxilato'], ['β-cetoácido', 'calor', 'carbonila + CO₂']];
  host.append(h('div', { class: 'table-wrap' }, h('table', { class: 'cmp' }, h('thead', null, h('tr', null, ['Partida', 'Reagente/condição', 'Produto'].map((t) => h('th', null, t)))), h('tbody', null, R.map((r) => h('tr', null, h('th', null, r[0]), h('td', null, r[1]), h('td', null, r[2])))))));
}
void COMP; void clear;
