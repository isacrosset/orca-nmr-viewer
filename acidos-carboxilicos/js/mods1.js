/*
 * mods1.js — módulos 1–24: início, ácidos carboxílicos, ressonância, acidez,
 * propriedades, derivados, reatividade, substituição nucleofílica acílica,
 * intermediário tetraédrico, cloretos de acila (SOCl₂, (COCl)₂, PCl₃/PCl₅),
 * anidridos, ésteres, Fischer, hidrólise ácida, saponificação e lactonas.
 */
import { h, tgl } from './widgets2d.js';
import { V } from './struct.js';
import { svgEl, add } from './arom2d.js';
import { COMP, DERIV, LG, PKA, CLREAG } from './data.js';
import { molView, M3D } from './m3d.js';
import { ball, dashed } from './co3d.js';
import * as A from './ac2d.js';
import { fb, clear, sel, vbox, legend, ESP_LEG, svgOf, skx, figK, figRow, nm, mechPlayer, PTS, tabs, card, note } from './ui.js';

const dist = (key, a, b) => { const D = M3D[key], P = (i) => D.atoms[i].slice(1, 4); return V.len(V.sub(P(a), P(b))); };
const mp = (key, n) => M3D[key].map[n];
const ang = (key, a, b, c) => { const D = M3D[key], P = (i) => D.atoms[i].slice(1, 4); const u = V.norm(V.sub(P(a), P(b))), w = V.norm(V.sub(P(c), P(b))); return Math.acos(Math.max(-1, Math.min(1, V.dot(u, w)))) * 180 / Math.PI; };
const f2 = (x) => x.toFixed(2).replace('.', ',');
function bars(items, unit = '') { return h('div', { class: 'eqbars' }, items.map(([t, p, cls, val]) => h('div', { class: 'eqbar' }, h('span', { class: 'lab', html: t }), h('div', { class: 'track' }, h('i', { class: cls || 'p', style: `width:${Math.max(1, Math.min(100, p))}%` })), h('b', { html: val ?? (p.toFixed(0) + unit) })))); }

/* ===================================================================
 * 1. Início
 * =================================================================== */
const HEROY = [['cloretoAcetila', 'Y = Cl'], ['anidridoAcetico', 'Y = OCOR'], ['acetatoEtila', 'Y = OR'], ['acidoAcetico', 'Y = OH'], ['acetamida', 'Y = NR₂']];
export function hero(host) {
  const v = vbox('tall'), cap = h('p', { class: 'cardlab center', 'aria-live': 'polite' });
  host.append(v, cap);
  let k = 0;
  const post = (grp, G) => { const C = G.atoms[G.map(1)].p, O = G.atoms[G.map(2)].p, Y = G.atoms[G.map(4)].p; const u = V.norm(V.sub(O, C)); let n = V.cross(V.sub(O, C), V.sub(Y, C)); n = V.norm(n); const th = 107 * Math.PI / 180; const t = (performance.now() / 1000) % 4 / 4; const d = V.add(V.mul(u, Math.cos(th)), V.mul(n, Math.sin(th))), p = V.add(C, V.mul(d, 3.4 - 1.2 * t)); ball(grp, p, 0x2fd4f5, 0.3, 'Nu:⁻', 'c'); dashed(grp, p, C, 0xff4fa3); };
  const Av = molView(v, HEROY[0][0], { hlC: true, delta: true, pistar: true, hint: false, spin: true, dist: 9, cam: [0.3, 0.5, -0.81], labels: [[4, HEROY[0][1], 'y']], post });
  const show = () => { const [key, t] = HEROY[k]; Av.st.labels = [[4, t, 'y']]; Av.set(key); cap.innerHTML = `<b>R–C(=O)–Y</b> · ${M3D[key].name} (${t}). Nucleófilo aproximando-se do carbono acílico (laranja), na trajetória de Bürgi–Dunitz.`; };
  show();
  const tm = setInterval(() => { if (!host.isConnected) { clearInterval(tm); return; } k = (k + 1) % HEROY.length; show(); }, 3500);
  host._stop = () => clearInterval(tm);
}
export const heroFlow = (host) => mechPlayer(host, A.nasAnion({ k0: 'cloretoAcetila', k1: 'tetraClMeO', k2: 'acetatoMetila' }), { no3d: true, pts: PTS.nas, ladder: false });

/* ===================================================================
 * 2–5. Ácidos carboxílicos: estrutura, ressonância, acidez, propriedades
 * =================================================================== */
export function acidIntro(host) {
  const v = vbox();
  host.append(h('div', { class: 'cmp2' }, h('div', null, h('div', { class: 'figs' }, ['acidoAcetico', 'acidoBenzoico', 'acidoFormico'].map((k) => figK(k))), note('key', 'Conceito-chave', 'O grupo <b>carboxila</b> (–COOH) reúne uma <b>carbonila</b> (C=O) e uma <b>hidroxila</b> (O–H) no mesmo carbono: as duas partes se influenciam mutuamente (ressonância).')), v));
  molView(v, 'acidoAcetico', { hlC: true, hyb: true, lp: true, hint: false, labels: [[2, 'O carbonílico', 'c'], [4, 'O–H (hidroxílico)', 'c']] });
}
export function bondLengths(host) {
  const a = vbox('short'), b = vbox('short');
  const k1 = 'acidoAcetico', k2 = 'acetato';
  const d1 = dist(k1, mp(k1, 1), mp(k1, 2)), d2 = dist(k1, mp(k1, 1), mp(k1, 4)), e1 = dist(k2, mp(k2, 1), mp(k2, 2)), e2 = dist(k2, mp(k2, 1), mp(k2, 4));
  host.append(h('div', { class: 'cmp2' }, card(`Ácido acético: C=O ${f2(d1)} Å · C–OH ${f2(d2)} Å`, a), card(`Acetato: C–O ${f2(e1)} Å e ${f2(e2)} Å (≈ iguais)`, b)), h('p', { class: 'hint3' }, 'Comprimentos das geometrias otimizadas (MMFF94) mostradas. No carboxilato a carga se distribui igualmente pelos dois oxigênios: as duas ligações C–O ficam praticamente equivalentes (valor experimental típico ≈ 1,26 Å).'));
  molView(a, k1, { hlC: true, hyb: true, hint: false, labels: [[2, 'C=O', 'c'], [4, 'C–OH', 'c']] });
  molView(b, k2, { hlC: true, hint: false, esp: true, labels: [[2, 'O (½−)', 'c'], [4, 'O (½−)', 'c']] });
}
export function carboxylateRes(host) { host.append(h('p', { class: 'mono center' }, 'RCOOH  ⇌  RCOO⁻  +  H⁺'), h('div', { class: 'figs' }, h('figure', { class: 'fig wide' }, svgOf(A.carboxylateRes(), { scale: 40, fs: 16 }), h('figcaption', null, 'Ressonância do carboxilato: duas estruturas equivalentes → carga −1 dividida entre os dois O.')))); }
export function acidity(host) {
  const a = vbox('short'), b = vbox('short');
  host.append(h('div', { class: 'cmp2' }, card('Etóxido (base conjugada do etanol, pKₐ ≈ 16)', h('div', null, a, h('p', null, 'Carga negativa <b>localizada</b> em um O.'))), card('Acetato (base conjugada do ácido acético, pKₐ ≈ 4,8)', h('div', null, b, h('p', null, 'Carga <b>deslocalizada</b> em dois O (ressonância).')))), ESP_LEG(), note('key', 'Conceito-chave', 'Ácidos carboxílicos são ≈ 10¹¹ vezes mais ácidos que álcoois principalmente pela <b>estabilização por ressonância da base conjugada</b> (o efeito indutivo do C=O também contribui).'));
  molView(a, 'etoxido', { esp: true, hint: false }); molView(b, 'acetato', { esp: true, hint: false });
}
export function inductive(host) {
  const L = PKA.slice(0, 4);
  host.append(bars(L.map(([k, p]) => [`<b>${COMP[k].name}</b>`, (5 - p) / 4.6 * 100, 'p', `pKₐ ${String(p).replace('.', ',')}`])), h('p', { class: 'hint3' }, 'Barras maiores = mais ácido (menor pKₐ; valores aproximados em água, 25 °C). Cada Cl retirador (efeito indutivo, −I) estabiliza adicionalmente o carboxilato.'));
  const a = vbox('short'), b = vbox('short'); host.append(h('div', { class: 'cmp2' }, card('Acetato', a), card('Tricloroacetato', b)), ESP_LEG());
  molView(a, 'acetato', { esp: true, hint: false }); molView(b, 'tricloroacetato', { esp: true, hint: false });
}
export function bpChart(host) {
  const D = [['butano', 58, -1, 'só dispersão', '#6f82a3'], ['propanal', 58, 48, 'dipolo–dipolo', '#ff9f43'], ['propan-1-ol', 60, 97, 'ligação de H', '#3ddc97'], ['ácido acético', 60, 118, 'ligações de H (dímeros)', '#2fd4f5']];
  const svg = svgEl(700, 250, 'Pontos de ebulição');
  D.forEach(([n, mm, bp, why, c], i) => { const y = 22 + i * 56, w = Math.max(4, (bp + 10) * 2.1); add(svg, 'text', { x: 160, y: y + 18, 'text-anchor': 'end', class: 'lab' }, `${n} (M ≈ ${mm})`); add(svg, 'rect', { x: 170, y, width: w, height: 28, rx: 6, fill: c }); add(svg, 'text', { x: 178 + w, y: y + 19, class: 'lab' }, `${bp} °C · ${why}`); });
  host.append(h('div', { class: 'energywrap' }, svg));
}
export function dimer3d(host) { const v = vbox(); host.append(v, h('p', { class: 'hint3 center' }, 'Dímero centrossimétrico do ácido acético: duas ligações de H O–H···O=C (tracejadas). Observado na fase gasosa e em solventes apolares.')); molView(v, 'dimero', { hint: false, lp: false, dist: 10 }); }

/* ===================================================================
 * 6–7. Derivados e reatividade
 * =================================================================== */
export function derivCards(host) {
  host.append(h('div', { class: 'grid5' }, DERIV.map((d) => h('div', { class: 'chcard center deriv r' + d.rank }, h('h4', null, d.name), h('b', { class: 'mono' }, d.f), h('div', { class: 'figs' }, skx(d.key, { scale: 34 })), h('p', { html: `Y = <b>${d.Y}</b>` })))), legend([['#ff9f43', 'carbono acílico'], ['#ffd45c', 'grupo Y (potencial grupo de saída)']]));
}
export function ladder(host) {
  const rows = [['cloreto', 'Cloreto de acila', 'RCOCl', 'Cl⁻ ótimo grupo de saída; Cl doa pouco'], ['anidrido', 'Anidrido', '(RCO)₂O', 'RCOO⁻ bom grupo de saída (ressonância)'], ['ester', 'Éster ≈ ácido', 'RCOOR / RCOOH', 'O doa por ressonância; RO⁻/HO⁻ maus grupos de saída'], ['amida', 'Amida', 'RCONR₂', 'N doa fortemente; R₂N⁻ péssimo grupo de saída']];
  host.append(h('div', { class: 'ladder' }, h('div', { class: 'lend top' }, 'MAIS REATIVO'), rows.map(([k, t, f, w], i) => h('div', { class: 'lrow l' + i }, h('div', { class: 'figs' }, skx(DERIV.find((d) => d.k === k).key, { scale: 32, fs: 13 })), h('div', null, h('h4', null, t), h('b', { class: 'mono' }, f), h('p', null, w)))), h('div', { class: 'lend bot' }, 'MENOS REATIVO')),
    note('care', 'Cuidado', 'Sequência qualitativa para substituição nucleofílica acílica em condições comparáveis. O ácido carboxílico é um caso especial: em base vira carboxilato (pouco reativo); em ácido pode ser ativado (Fischer).'));
}
export function twoFactors(host) {
  host.append(h('div', { class: 'cmp2' }, card('1. Doação por ressonância de Y', 'Quanto mais Y doa seu par à C=O (Cl < OCOR < OR < NR₂), <b>menos eletrofílico</b> fica o carbono acílico e mais estável o derivado.'), card('2. Capacidade de saída de Y', 'Quanto mais fraca a base Y⁻ (menor pKₐ de HY), <b>melhor grupo de saída</b>: Cl⁻ > RCOO⁻ > RO⁻ ≈ HO⁻ ≫ R₂N⁻.')),
    h('div', { class: 'table-wrap' }, h('table', { class: 'cmp' }, h('thead', null, h('tr', null, ['Derivado', 'Y', 'Grupo de saída', 'pKₐ de HY', 'Doação por ressonância', 'Reatividade'].map((t) => h('th', null, t)))), h('tbody', null, DERIV.map((d) => h('tr', null, h('th', null, d.name), h('td', null, d.Y), h('td', null, d.lg), h('td', null, d.pKaHY), h('td', null, d.res), h('td', null, d.rx)))))));
}
export function resCompare(host) {
  const Ys = [['Cl', 'Cloreto de acila', 'cloretoAcetila', 'contribuinte C=Cl⁺ desprezível (sobreposição 2p–3p ruim)'], ['OR′', 'Éster', 'acetatoEtila', 'contribuinte C=O⁺R′ relevante'], ['NR₂', 'Amida', 'acetamida', 'contribuinte C=N⁺R₂ muito importante (N menos eletronegativo)']];
  let on = false; const boxes = Ys.map(() => h('div', { class: 'figs' })), Vs = Ys.map(() => vbox('short'));
  const draw = () => Ys.forEach(([Y], i) => clear(boxes[i]).append(svgOf(on ? A.resPair(Y, { cls: 'lg' }) : A.resPair(Y, { arrows: false, cls: 'lg' }), { scale: 30, fs: 14 })));
  host.append(h('div', { class: 'controls' }, tgl('Mostrar doação eletrônica', () => { on = !on; draw(); return on; }, false)), h('div', { class: 'grid3' }, Ys.map(([, t, , w], i) => card(t, h('div', null, boxes[i], Vs[i], h('p', { class: 'hint3' }, w))))), ESP_LEG());
  Ys.forEach(([, , k], i) => molView(Vs[i], k, { esp: true, hint: false }));
  draw();
}
export function lgCompare(host) {
  host.append(bars(LG.map(([t, p, ha, q]) => [`<b>${t}</b><small>ácido conjugado ${ha}</small>`, q / 5 * 100, q >= 4 ? 'p' : 'r', `pKₐ ${p}`])), note('key', 'Bases mais fracas são melhores grupos de saída', 'Quanto menor o pKₐ do ácido conjugado (HY), mais fraca a base Y⁻ e mais facilmente ela sai. Protonar OR, OH ou NR₂ transforma-os em ROH, H₂O ou R₂NH — grupos de saída muito melhores.'));
}

/* ===================================================================
 * 8–9. Mecanismo geral e intermediário tetraédrico
 * =================================================================== */
export const nasMech = (host) => mechPlayer(host, A.nasAnion({ k0: 'cloretoAcetila', k1: 'tetraClMeO', k2: 'acetatoMetila' }), { pts: PTS.nas, cap3d: 'Exemplo 3D: CH₃COCl + CH₃O⁻ → tetraédrico → CH₃COOCH₃ (MMFF94).' });
export function vsAldehyde(host) {
  host.append(h('div', { class: 'cmp2' }, card('Aldeído/cetona: <span class="pr">adição</span>', h('div', null, figRow(['CC=O', '→<small>CN⁻, H⁺</small>', ['CC(O)C#N', { cap: 'cianoidrina' }]], { scale: 24, fs: 12 }), h('p', null, 'Não há grupo de saída: o tetraédrico é protonado e fica.'))), card('Derivado de ácido: <span class="it">adição + eliminação</span>', h('div', null, figRow(['cloretoAcetila', '→<small>CH₃O⁻</small>', 'acetatoMetila'], { scale: 24, fs: 12 }), h('p', null, 'O tetraédrico expulsa Y⁻ e a C=O é regenerada: <b>substituição</b>.')))),
    note('err', 'Erro comum', 'Ácidos carboxílicos e derivados não sofrem simplesmente a mesma adição nucleofílica de aldeídos e cetonas; normalmente ocorre <b>adição seguida de eliminação</b>.'));
}
export function tetraSim(host) {
  const fr = A.nasAnion({ k0: 'cloretoAcetila', k1: 'tetraClMeO', k2: 'acetatoMetila' });
  const S = (cap, s, k3, en) => ({ s, cap, k3, en });
  const frames = [S('<b>1. Reagente:</b> carbono acílico sp² (trigonal planar, ≈ 120°).', fr[0].s, 'cloretoAcetila', 0), S('<b>2. Ataque:</b> Nu → C e π → O (setas).', fr[0].s, 'cloretoAcetila', 0), S('<b>3. Intermediário tetraédrico:</b> C sp³ (≈ 109,5°), O⁻.', fr[1].s, 'tetraClMeO', 1), S('<b>4. Colapso:</b> O⁻ refaz a C=O; C–Cl rompe.', fr[1].s, 'tetraClMeO', 1), S('<b>5. Produto:</b> carbono de volta a sp² — sp² → sp³ → sp².', fr[2].s, 'acetatoMetila', 2)];
  frames[0].s = (() => { const t = A.nasAnion({ k0: 'x' })[0].s; t.arrows = []; return t; })();
  frames[2].s = (() => { const t = A.nasAnion({ k0: 'x' })[1].s; t.arrows = []; return t; })();
  mechPlayer(host, frames, { pts: PTS.nas, cap3d: 'Pause em cada etapa; o rótulo mostra a hibridização do carbono acílico.' });
}
export function conversions(host) {
  const order = ['cloreto', 'anidrido', 'ester', 'amida'], N = { cloreto: 'cloreto de acila', anidrido: 'anidrido', ester: 'éster', amida: 'amida' };
  let a = 'cloreto', b = 'ester'; const out = h('div', { 'aria-live': 'polite' });
  const go = () => { const ia = order.indexOf(a), ib = order.indexOf(b); out.replaceChildren(ia === ib ? fb('neutral', 'Mesmo nível.') : ia < ib ? fb('ok', `✔ <b>${N[a]} → ${N[b]}</b>: desce a escada (mais reativo → menos reativo). Conversão direta favorável com o nucleófilo adequado.`) : fb('bad', `✘ <b>${N[a]} → ${N[b]}</b>: sobe a escada. O grupo que sairia (${DERIV.find((d) => d.k === a).lg}) é pior que o que entraria: exige outra estratégia — ex.: hidrolisar ao ácido e <b>ativar</b> com SOCl₂.`)); };
  host.append(h('div', { class: 'controls' }, h('label', null, 'De: ', sel(order.map((x) => [x, N[x]]), a, (x) => { a = x; go(); }, 'de')), h('label', null, 'Para: ', sel(order.map((x) => [x, N[x]]), b, (x) => { b = x; go(); }, 'para'))), out);
  go();
}
export function stairs(host) {
  const W = 760, H = 380, svg = svgEl(W, H, 'Escada de derivados e interconversões');
  svg.innerHTML = '<defs><marker id="st" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#9fb0cc"/></marker></defs>';
  const P = { cloreto: [200, 40, 'Cloreto de acila'], anidrido: [200, 130, 'Anidrido'], ester: [200, 220, 'Éster / Ácido'], amida: [200, 310, 'Amida'], acido: [560, 175, 'Ácido carboxílico'] };
  const E = [['cloreto', 'anidrido', 'RCOO⁻'], ['anidrido', 'ester', 'ROH'], ['ester', 'amida', 'RNH₂ (lenta)'], ['acido', 'cloreto', 'SOCl₂ (ativação)']];
  E.forEach(([x, y, t]) => { const [x1, y1] = P[x], [x2, y2] = P[y]; const up = x === 'acido'; add(svg, 'path', { d: up ? `M${x1 - 90},${y1 - 10} C${x1 - 200},${y1 - 80} ${x2 + 160},${y2} ${x2 + 92},${y2}` : `M${x1},${y1 + 22} L${x2},${y2 - 24}`, class: 'edge ' + (up ? 'ox' : 'red'), 'marker-end': 'url(#st)' }); add(svg, 'text', { x: up ? 470 : x1 + 12, y: up ? 70 : (y1 + y2) / 2 + 4, class: 'lab' }, t); });
  [['cloreto', 'acido', 'H₂O'], ['anidrido', 'acido', 'H₂O'], ['ester', 'acido', 'H₃O⁺ ou HO⁻'], ['amida', 'acido', 'H₃O⁺, calor']].forEach(([x, y, t]) => { const [x1, y1] = P[x], [x2, y2] = P[y]; add(svg, 'path', { d: `M${x1 + 92},${y1} L${x2 - 92},${y2 + (y1 - y2) * 0.08}`, class: 'edge cl', 'marker-end': 'url(#st)' }); add(svg, 'text', { x: (x1 + x2) / 2 + 10, y: (y1 + y2) / 2 - 4, class: 'lab small' }, t); });
  Object.values(P).forEach(([x, y, t]) => { const g = add(svg, 'g', { class: 'node' }); add(g, 'rect', { x: x - 90, y: y - 22, width: 180, height: 44, rx: 12 }); add(g, 'text', { x, y: y + 5, 'text-anchor': 'middle' }, t); });
  host.append(h('div', { class: 'energywrap net' }, svg), legend([['#ffd45c', 'descer a escada (direto)'], ['#b18cff', 'subir exige ativação'], ['#ff4fa3', 'hidrólise → ácido']]));
}

/* ===================================================================
 * 10–14. Cloretos de acila
 * =================================================================== */
export function acylChloride(host) {
  const v = vbox(); host.append(h('div', { class: 'cmp2' }, h('div', null, h('div', { class: 'figs' }, figK('cloretoAcetila'), figK('cloretoBenzoila')), note('key', 'Por que tão reativo?', 'Cl doa pouco por ressonância (orbitais 3p do Cl sobrepõem-se mal ao 2p do C) e retira por indução; Cl⁻ é base muito fraca (pKₐ HCl ≈ −7), ótimo grupo de saída. Resultado: <b>alta eletrofilia e alta reatividade</b>.')), v), ESP_LEG());
  molView(v, 'cloretoAcetila', { esp: true, hlC: true, hint: false, labels: [[4, 'Cl (grupo de saída)', 'y']] });
}
export const socl2Mech = (host) => mechPlayer(host, A.socl2Frames(), { pts: PTS.socl2, slow: true, cap3d: 'Espécies 3D: ácido acético → acil clorossulfito → tetraédrico → cloreto de acetila.' });
export function socl2Species(host) { const a = vbox('short'), b = vbox('short'); host.append(h('div', { class: 'cmp2' }, card('SOCl₂ (S piramidal, eletrofílico)', a), card('Acil clorossulfito (intermediário ativado)', b))); molView(a, 'socl2', { hint: false, lp: true }); molView(b, 'clorossulfito', { hlC: true, hint: false, labels: [[4, 'O–S(O)Cl: ótimo grupo de saída', 'y']] }); }
export function oxalyl(host) {
  const v = vbox('short');
  host.append(h('div', { class: 'cmp2' }, h('div', null, h('p', { class: 'mono center' }, 'RCOOH + (COCl)₂ → RCOCl + CO↑ + CO₂↑ + HCl↑'), note('key', 'Cloreto de oxalila', 'Alternativa branda ao SOCl₂; em geral usada com quantidade catalítica de DMF. Todos os subprodutos são gasosos. <i>Condições experimentais não detalhadas.</i>')), card('(COCl)₂', v)));
  molView(v, 'oxalila', { hint: false });
}
export function pclx(host) {
  const v = vbox('short');
  host.append(h('div', { class: 'cmp2' }, h('div', null, h('p', { class: 'mono center' }, '3 RCOOH + PCl₃ → 3 RCOCl + H₃PO₃'), h('p', { class: 'mono center' }, 'RCOOH + PCl₅ → RCOCl + POCl₃ + HCl'), note('think', 'Modo avançado', 'Em ambos, o O da carboxila liga-se ao fósforo (formação de ligação P–O, muito forte), o que transforma o OH em bom grupo de saída; o Cl⁻ então ataca o carbono acílico. Mesmo princípio do SOCl₂: <b>ativar</b> o OH.')), card('PCl₅ (bipirâmide trigonal)', v)));
  molView(v, 'pcl5', { hint: false });
}
export function clReagents(host) {
  host.append(h('div', { class: 'table-wrap' }, h('table', { class: 'cmp' }, h('thead', null, h('tr', null, ['Reagente', 'Ativação', 'Subprodutos', 'Observação didática'].map((t) => h('th', null, t)))), h('tbody', null, CLREAG.map((r) => h('tr', null, h('th', null, `${r.k} (${r.name})`), h('td', null, r.act), h('td', null, r.by), h('td', null, r.why)))))));
}
const CLRX = [['H₂O', 'acidoAcetico', 'hidrólise (+ HCl)'], ['CH₃OH', 'acetatoMetila', 'éster (base neutraliza HCl)'], ['NH₃ (2 equiv.)', 'acetamida', 'amida (+ NH₄Cl)'], ['CH₃NH₂ (2 equiv.)', 'nMetilacetamida', 'amida secundária'], ['CH₃COO⁻', 'anidridoAcetico', 'anidrido (+ Cl⁻)']];
export function chlorideMap(host) {
  const out = h('div', { 'aria-live': 'polite' });
  host.append(h('div', { class: 'radial' }, h('div', { class: 'rcenter' }, figK('cloretoAcetila')), h('div', { class: 'rspokes' }, CLRX.map(([nu, p, t]) => h('button', { class: 'pickcard', type: 'button', onclick: () => out.replaceChildren(h('div', { class: 'rxrow' }, figK('cloretoAcetila', { scale: 26 }), h('span', { class: 'rxarr', html: `→<small>${nu}</small>` }), figK(p, { scale: 26 })), fb('neutral', `<b>${t}.</b> Nucleófilo ataca o carbono acílico → tetraédrico → <b>Cl⁻ sai</b> → (desprotonação) → produto. Desce a escada: favorável.`)) }, h('b', null, '+ ' + nu), skx(p, { scale: 20, fs: 11 }), h('small', null, t))))), out);
}
export const chlorideEster = (host) => mechPlayer(host, A.nasNeutral({ Y: 'Cl', nuL: 'O', nuR: 'CH₃', Ylg: 'Cl⁻', base: 'Py:', baseName: 'piridina (base)', prodName: 'Acetato de metila (éster)', byprod: '+ PyH⁺ Cl⁻', k0: 'cloretoAcetila', k1: 'tetraClMeOH', k2: 'acetatoMetila', k3: 'acetatoMetila', end: 'Cloreto de acila → éster: desce a escada; reação rápida.' }), { pts: PTS.neutral });

/* ===================================================================
 * 15–17. Anidridos
 * =================================================================== */
export function anhydrideStruct(host) {
  const v = vbox();
  host.append(h('div', { class: 'cmp2' }, h('div', null, h('div', { class: 'figs' }, figK('anidridoAcetico', { cap: 'anidrido acético (simétrico)' }), figK('anidridoMisto'), figK('anidridoSuccinico')), h('p', null, 'Duas carbonilas ligadas ao mesmo O. <b>Simétrico</b>: (RCO)₂O; <b>misto</b>: RCO–O–COR′; cíclico: a partir de diácidos.')), v));
  molView(v, 'anidridoAcetico', { hlC: true, hint: false, halos: [['#4', 0xff9f43]], labels: [[1, 'C acílico 1', 'o'], ['#4', 'C acílico 2', 'o'], [4, 'O ponte', 'c']] });
}
export const anhydrideSynth = (host) => mechPlayer(host, A.nasAnion({ Y: 'Cl', nu: 'AcO', nuName: 'o carboxilato (CH₃COO⁻)', Ylg: 'Cl⁻', prodLab: 'OCOCH₃', k0: 'cloretoAcetila', k1: 'tetraAcetato', k2: 'anidridoAcetico', end: 'Anidrido: cloreto + carboxilato.' }), { pts: PTS.nas });
export function anhydrideRx(host) {
  host.append(figRow(['anidridoAcetico', '→<small>H₂O</small>', ['acidoAcetico', { cap: '2 ácido acético' }]], { scale: 24, fs: 12 }), figRow(['anidridoAcetico', '→<small>CH₃OH</small>', 'acetatoMetila', '+', 'acidoAcetico'], { scale: 24, fs: 12 }), figRow(['anidridoAcetico', '→<small>2 NH₃</small>', 'acetamida', '+ CH₃COO⁻ NH₄⁺'], { scale: 24, fs: 12 }));
}
export const anhydrideMech = (host) => mechPlayer(host, A.nasNeutral({ Y: 'OCOCH₃', nuL: 'O', nuR: 'CH₃', Ylg: 'CH₃COO⁻', lgWhy: 'carboxilato estabilizado por ressonância', base: 'B:', prodName: 'Éster + ácido acético', byprod: '+ CH₃COOH', k0: 'anidridoAcetico', k1: 'tetraAnidridoOMe', k2: 'acetatoMetila', k3: 'acetatoMetila' }), { pts: PTS.neutral });

/* ===================================================================
 * 18–23. Ésteres, Fischer, hidrólise, saponificação
 * =================================================================== */
export function esterStruct(host) {
  const v = vbox();
  host.append(h('div', { class: 'cmp2' }, h('div', null, h('div', { class: 'figs' }, svgOf(A.resPair('OR′', { cls: 'oxy2', lpY: [330, 270] }), { scale: 32, fs: 15 })), h('p', null, 'O par do O alcoxila doa à carbonila: o éster é menos eletrofílico que cloretos e anidridos.')), v));
  molView(v, 'acetatoEtila', { hlC: true, lp: true, hint: false, labels: [[4, 'O–R′', 'c']] });
}
export const fischerMech = (host) => mechPlayer(host, A.fischerFrames(), { pts: PTS.fischer, slow: true, cap3d: 'Espécies 3D: ácido acético + metanol → … → acetato de metila.' });
export function fischerSim(host) {
  const al = h('input', { type: 'range', min: 1, max: 20, value: 1, 'aria-label': 'equivalentes de álcool' }), w = h('input', { type: 'range', min: 0, max: 90, value: 0, step: 10, 'aria-label': 'água removida (%)' }), out = h('div'), msg = h('div', { 'aria-live': 'polite' });
  const K = 4;
  const go = () => {
    const B = +al.value, rem = +w.value / 100;
    // RCOOH + ROH ⇌ éster + H₂O; K = x·(x(1−rem))/((1−x)(B−x)) — remoção de água modelada reduzindo [H₂O] livre
    let lo = 0, hi = 0.999999; for (let k = 0; k < 80; k++) { const x = (lo + hi) / 2; const f = x * x * (1 - rem) - K * (1 - x) * (B - x); if (f > 0) hi = x; else lo = x; }
    const x = (lo + hi) / 2 * 100;
    clear(out).append(h('p', { class: 'mono center' }, `RCOOH + ROH ⇌ RCOOR + H₂O     K ≈ ${K}`), bars([['ácido', 100 - x, 'r'], ['éster', x, 'p']], '%'));
    msg.replaceChildren(fb('neutral', `${B} equiv. de álcool, ${Math.round(rem * 100)}% da água removida → conversão ≈ <b>${x.toFixed(0)}%</b>. ${B === 1 && rem === 0 ? 'Com 1:1 e K ≈ 4, o equilíbrio chega a ≈ 2/3 de éster.' : 'Excesso de reagente e/ou remoção de produto deslocam o equilíbrio (Le Châtelier).'}`));
  };
  [al, w].forEach((r) => r.addEventListener('input', go));
  host.append(h('div', { class: 'range-row' }, h('span', null, 'álcool (equiv.)'), al, h('span', { class: 'muted' }, '1 → 20')), h('div', { class: 'range-row' }, h('span', null, 'água removida'), w, h('span', { class: 'muted' }, '0 → 90%')), out, msg, h('p', { class: 'hint3' }, 'K ≈ 4: ordem de grandeza clássica para ácido acético + etanol. Modelo simplificado (comportamento ideal).'));
  go();
}
export const chlorideEster2 = chlorideEster;
export const anhydrideEster = anhydrideMech;
export function esterRoutes(host) {
  const R = [['Fischer', 'ácido + álcool, H⁺', 'reversível (K ≈ 4); excesso de álcool/remover água', 'barato; ácido não ativado'], ['Cloreto de acila', 'RCOCl + ROH (piridina)', 'praticamente irreversível; rápida', 'exige preparar RCOCl; forma HCl (neutralizado)'], ['Anidrido', '(RCO)₂O + ROH', 'favorável; rápida com catalisador', 'subproduto: RCOOH (perde-se metade do acila)']];
  host.append(h('div', { class: 'table-wrap' }, h('table', { class: 'cmp' }, h('thead', null, h('tr', null, ['Rota', 'Reagentes', 'Equilíbrio/velocidade', 'Observação'].map((t) => h('th', null, t)))), h('tbody', null, R.map((r) => h('tr', null, h('th', null, r[0]), ...r.slice(1).map((c) => h('td', null, c))))))));
}
export const acidHydMech = (host) => mechPlayer(host, A.acidHydFrames(), { pts: PTS.acidHyd, slow: true });
export function sideBySide(host) {
  const F = ['protonação da C=O', 'ROH ataca', 'tetraédrico', 'transferência de H⁺ (protona OH)', 'sai H₂O', 'desprotonação → éster'];
  const Hh = ['protonação da C=O', 'H₂O ataca', 'tetraédrico', 'transferência de H⁺ (protona OR)', 'sai ROH', 'desprotonação → ácido'];
  host.append(h('div', { class: 'cmp2' }, card('Esterificação de Fischer →', h('ol', { class: 'flowv' }, F.map((t) => h('li', null, t)))), card('← Hidrólise ácida de éster', h('ol', { class: 'flowv' }, Hh.map((t) => h('li', null, t))))), note('key', 'Reversibilidade microscópica', 'São o mesmo conjunto de etapas em sentidos opostos; o sentido líquido é decidido pelas concentrações (excesso de álcool × excesso de água).'));
}
export const saponMech = (host) => mechPlayer(host, A.saponFrames(), { pts: PTS.sapon });
export function saponTable(host) {
  const R = [['Catalisador/reagente', 'H⁺ (catalítico)', 'HO⁻ (consumido, ≥ 1 equiv.)'], ['Nucleófilo', 'H₂O', 'HO⁻'], ['Produto acílico', 'ácido carboxílico', 'carboxilato (ácido após acidificação)'], ['Reversibilidade', 'sim (equilíbrio)', 'efetivamente não nas condições usuais'], ['Grupo de saída', 'ROH (após protonação)', 'RO⁻ (seguido de ácido-base)']];
  host.append(h('div', { class: 'table-wrap' }, h('table', { class: 'cmp' }, h('thead', null, h('tr', null, ['Característica', 'Hidrólise ácida', 'Hidrólise básica (saponificação)'].map((t) => h('th', null, t)))), h('tbody', null, R.map((r) => h('tr', null, h('th', null, r[0]), h('td', null, r[1]), h('td', null, r[2])))))));
}

/* ===================================================================
 * 24. Lactonas
 * =================================================================== */
export function lactoneIntro(host) { host.append(h('div', { class: 'figs' }, [['betaPropiolactona', 'β (4 membros)'], ['gbl', 'γ (5)'], ['dvl', 'δ (6)'], ['caprolactona', 'ε (7)']].map(([k, t]) => figK(k, { cap: `${nm(k)} · ${t}` })))); }
export const lactoneMech = (host) => mechPlayer(host, A.lactoneFrames(), { pts: PTS.lactone });
export function lactoneRing(host) {
  const D = [[4, 'β: tensão alta', 0.15], [5, 'γ: muito favorável', 0.95], [6, 'δ: favorável', 0.85], [7, 'ε: menos (entropia)', 0.35]];
  host.append(bars(D.map(([n, t, v]) => [`<b>${n} membros</b><small>${t}</small>`, v * 100, n === 5 || n === 6 ? 'p' : 'r', ''])), h('p', { class: 'hint3' }, 'Facilidade relativa de lactonização (qualitativa): tensão de anel, geometria e entropia intramolecular.'));
}
export function lactone3d(host) {
  const v = vbox(); let k = 'hidroxibutanoico';
  const L = { hidroxibutanoico: [[4, 'OH (nucleófilo)', 'c'], [1, 'C acílico', 'o']], gbl: [[4, 'O do anel (nova O–C)', 'c'], [1, 'C acílico', 'o']] };
  const Av = molView(v, k, { hlC: true, hyb: true, hint: false, labels: L[k] });
  host.append(h('div', { class: 'controls' }, h('button', { class: 'btn sm', type: 'button', onclick: () => { k = k === 'gbl' ? 'hidroxibutanoico' : 'gbl'; Av.st.labels = L[k]; Av.set(k); } }, 'Alternar: aberto ↔ lactona')), v);
}
void LG; void dist; void ang;
