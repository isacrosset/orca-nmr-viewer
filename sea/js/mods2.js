/*
 * mods2.js — módulos 12–24: reatividade de benzenos substituídos, indução e
 * ressonância, comparador de complexos σ (orto/meta/para), diagramas de
 * energia por posição, halogênios, efeito estérico, anéis dissubstituídos,
 * planejamento sintético e mapa de reações.
 */
import { h, seg, tgl } from './widgets2d.js';
import { S } from './chem2d.js';
import { svgS, svgEl, add, profile } from './arom2d.js';
import { fb, clear, sel, vbox, legend } from './ui.js';
import { SUBS, SIM_SUBS, RX, rel, REL_NAME, barrier, regio, ringRank, rankText, compat } from './sub.js';
import { ringDraw, ringSVG2, sigmaForms, sigmaS, OUT } from './sea2d.js';
import { subScene, stericScene } from './sea3d.js';

export const subOpts = (keys = SIM_SUBS) => keys.map((k) => [k, `–${SUBS[k].lab} (${SUBS[k].ex})`]);
const DIRTXT = { op: 'orto/para', m: 'meta' };
export function subCard(k) {
  const S0 = SUBS[k];
  return h('div', { class: 'subcard ' + (S0.halogen ? 'hal' : S0.rank > 0 ? 'act' : 'deact') },
    h('div', { class: 'subhead' }, h('b', null, '–' + S0.lab), h('span', null, S0.name + ' · ' + S0.ex)),
    h('ul', { class: 'facts' }, h('li', null, h('span', null, 'efeito indutivo'), h('b', null, S0.I)), h('li', null, h('span', null, 'ressonância'), h('b', null, S0.R)), h('li', null, h('span', null, 'velocidade'), h('b', null, S0.cls)), h('li', null, h('span', null, 'orientação'), h('b', { class: S0.dir }, DIRTXT[S0.dir]))));
}

/* ===================================================================
 * 12. Pergunta da segunda metade
 * =================================================================== */
export function secondQ(host) {
  const list = ['CH3', 'NO2', 'OCH3', 'Cl'];
  host.append(h('div', { class: 'grid4' }, list.map((k) => {
    const out = h('div');
    return h('div', { class: 'chcard center' }, h('h4', null, SUBS[k].ex), h('div', { class: 'figs' }, ringSVG2({ kek: 'A', subs: { 0: k } }, { scale: 30, fs: 14 })),
      h('p', { class: 'prompt' }, 'Mais rápido ou mais lento que o benzeno?'),
      h('div', { class: 'ch-answers' }, ['mais rápido', 'mais lento'].map((t) => h('button', { class: 'btn sm', type: 'button', onclick: () => { const ok = (t === 'mais rápido') === (SUBS[k].rank > 0); out.replaceChildren(fb(ok ? 'ok' : 'bad', `${ok ? '✔' : '✘'} ${SUBS[k].ex}: ${SUBS[k].cls}; orientação <b>${DIRTXT[SUBS[k].dir]}</b>.`)); } }, t))), out);
  })));
}
export function twoEffects(host) {
  host.append(h('div', { class: 'cmp2' },
    h('div', { class: 'chcard' }, h('h4', null, '1. REATIVIDADE'), h('p', null, 'O anel reage mais rápido (ativado) ou mais devagar (desativado) que o benzeno? Depende de quanto o substituinte estabiliza o ET₁/complexo σ em geral.')),
    h('div', { class: 'chcard' }, h('h4', null, '2. REGIOSSELETIVIDADE'), h('p', null, 'Entre os caminhos orto, meta e para, qual tem o ET de menor energia? Depende de como o substituinte interage com a carga + em cada complexo σ.'))),
  h('div', { class: 'note care' }, h('b', { class: 't' }, 'Analise separadamente'), 'Os dois efeitos estão relacionados, mas não são a mesma coisa: os halogênios desativam o anel e, mesmo assim, dirigem orto/para.'));
}
/* escala qualitativa */
export function reactScale(host) {
  const pts = [['anilina', 'NH2'], ['fenol', 'OH'], ['anisol', 'OCH3'], ['acetanilida', 'NHCOCH3'], ['tolueno', 'CH3'], ['benzeno', null], ['clorobenzeno', 'Cl'], ['acetofenona', 'COCH3'], ['benzonitrila', 'CN'], ['nitrobenzeno', 'NO2']];
  const info = h('div', { 'aria-live': 'polite' });
  const W = 760, svg = svgEl(W, 150, 'Escala qualitativa de reatividade em SEA');
  const X = (r) => 380 - r * 105;
  add(svg, 'line', { x1: 30, y1: 70, x2: W - 30, y2: 70, class: 'scale' });
  add(svg, 'text', { x: 30, y: 140, class: 'lab' }, '← mais ativado (mais rápido)'); add(svg, 'text', { x: W - 30, y: 140, 'text-anchor': 'end', class: 'lab' }, 'mais desativado (mais lento) →');
  pts.forEach(([n, k], i) => {
    const r = k ? SUBS[k].rank : 0, x = X(r), up = i % 2 === 0;
    const g = add(svg, 'g', { class: 'spt', tabindex: 0, role: 'button', 'aria-label': n });
    add(g, 'circle', { cx: x, cy: 70, r: 7, class: k ? (r > 0 ? 'act' : SUBS[k].halogen ? 'hal' : 'deact') : 'ref' });
    add(g, 'text', { x, y: up ? 52 : 98, 'text-anchor': 'middle', class: 'lab' }, n);
    const f = () => info.replaceChildren(k ? subCard(k) : fb('neutral', 'Benzeno: referência (todas as posições equivalentes).'));
    g.addEventListener('click', f); g.addEventListener('keydown', (e) => { if (e.key === 'Enter') f(); });
  });
  host.append(h('div', { class: 'energywrap' }, svg), h('p', { class: 'hint3' }, 'Posições qualitativas (a ordem exata depende da reação e das condições). Clique numa molécula.'), info);
}

/* ===================================================================
 * 14–15. Indução e ressonância
 * =================================================================== */
export function inductive(host) {
  const mk = (k, sign) => { const s = new S(); const r = ringDraw(s, { kek: 'hyb', subs: { 0: k } }); const sa = r.subs[0].root; s.atoms[r.id[0]][3] = Object.assign({}, s.atoms[r.id[0]][3], { d: sign > 0 ? '−' : '+', dd: [0.55, 0.15] }); s.atoms[sa][3] = Object.assign({}, s.atoms[sa][3], { d: sign > 0 ? '+' : '−', dd: [0.7, 0] }); s.arrow(sign > 0 ? { a: sa, ang: 250 } : { a: r.id[0], ang: 70 }, sign > 0 ? { a: r.id[0], ang: 70 } : { a: sa, ang: 250 }, 0.25, sign > 0 ? 'o' : ''); return svgS(s, { scale: 38, fs: 16 }); };
  const a = vbox('short'), b = vbox('short');
  host.append(h('div', { class: 'cmp2' },
    h('div', { class: 'chcard good' }, h('h4', null, '+I: grupo alquila doa pelos σ'), h('div', { class: 'figs' }, mk('CH3', 1)), a, h('p', null, 'O carbono sp³ é ligeiramente doador frente ao carbono sp² do anel (+ hiperconjugação): anel um pouco mais rico; ativação fraca.')),
    h('div', { class: 'chcard bad' }, h('h4', null, '−I: CF₃ retira pelos σ'), h('div', { class: 'figs' }, mk('CF3', -1)), b, h('p', null, 'Três F muito eletronegativos polarizam as ligações σ: o carbono ligado ao anel fica δ+ e retira densidade. Sem pares para doar: desativador forte, meta.'))),
  h('p', { class: 'hint3' }, 'O efeito indutivo é transmitido pelas ligações σ e enfraquece rapidamente com a distância. Mapas: densidade π qualitativa.'));
  subScene(a, { 0: 'CH3' }, { esp: true, cloud: false, hint: false, dist: 11 });
  subScene(b, { 0: 'CF3' }, { esp: true, cloud: false, hint: false, dist: 11 });
}
/** formas de ressonância do próprio substituinte com o anel (estado fundamental) */
export function groundRes(host) {
  let key = 'OCH3';
  const box = h('div', { class: 'resrow wrap' }), cap = h('p', { class: 'cardlab' });
  const draw = () => {
    const Sb = SUBS[key], don = !!Sb.donor && !Sb.halogen, acc = Sb.acc;
    const forms = [{ dbl: [[0, 1], [2, 3], [4, 5]], form: '' }];
    if (don || acc) [[1, [[2, 3], [4, 5]]], [3, [[1, 2], [4, 5]]], [5, [[1, 2], [3, 4]]]].forEach(([q, dbl]) => forms.push({ dbl, form: don ? 'd' : 'w', q }));
    clear(box);
    forms.forEach((f, i) => {
      const s = new S();
      const r = ringDraw(s, { dbl: f.dbl, subs: { 0: key }, subForm: { 0: f.form }, chg: f.q ? { [f.q]: don ? '−' : '+' } : {}, halo: f.q ? { [f.q]: don ? 'g' : 'r' } : {}, subOpt: { lp: f.form !== 'd' } });
      if (i === 0 && don) s.arrow({ lp: [r.subs[0].root, 90] }, { b: [r.subs[0].root, r.id[0]] }, 0.6, '');
      if (i === 0 && acc) s.arrow({ b: [r.id[0], r.id[1]] }, { b: [r.id[0], r.subs[0].root] }, -0.6, '');
      if (i > 0) box.append(h('span', { class: 'resarrow' }, '↔'));
      box.append(h('figure', { class: 'fig' }, svgS(s, { scale: 30, fs: 13, zoom: 1.3 })));
    });
    cap.innerHTML = don ? `<b>${Sb.lab}: doador por ressonância (+R).</b> O par isolado conjuga com o anel; as formas com carga − aparecem nas posições <b>orto e para</b> (verde): o anel fica mais rico, sobretudo ali.` : acc ? `<b>${Sb.lab}: retirador por ressonância (−R).</b> O anel cede densidade ao grupo; surgem formas com carga + nas posições <b>orto e para</b> (vermelho): o anel fica mais pobre, sobretudo ali.` : `<b>${Sb.lab}</b>: sem forma de ressonância relevante com o anel (efeito principalmente indutivo/hiperconjugativo).`;
  };
  host.append(seg([['OCH3', '–OCH₃'], ['NH2', '–NH₂'], ['OH', '–OH'], ['NO2', '–NO₂'], ['CHO', '–CHO'], ['COCH3', '–COCH₃'], ['CN', '–CN'], ['CH3', '–CH₃']], key, (k) => { key = k; draw(); }, 'substituinte'), box, cap);
  draw();
}
export function espCompare(host) {
  const grid = h('div', { class: 'grid3' });
  host.append(grid, h('div', { class: 'legend center' }, h('span', null, h('i', { style: 'background:#f05a4a' }), 'mais rico'), h('span', null, h('i', { style: 'background:#e8e4d0' }), 'intermediário'), h('span', null, h('i', { style: 'background:#5b8cff' }), 'mais pobre')),
    h('div', { class: 'note err' }, h('b', { class: 't' }, 'Erro comum'), 'Mapas de densidade ajudam a visualizar a reatividade, mas não substituem a análise dos intermediários e estados de transição. A orientação vem da energia dos caminhos (complexos σ), não da “cor” de um mapa estático.'));
  [['anisol', { 0: 'OCH3' }, 'anel rico, sobretudo orto/para'], ['benzeno', {}, 'referência'], ['nitrobenzeno', { 0: 'NO2' }, 'anel pobre, sobretudo orto/para']].forEach(([n, subs, t]) => { const v = vbox('short'); grid.append(h('div', { class: 'chcard center' }, h('h4', null, n), v, h('small', null, t))); subScene(v, subs, { esp: true, cloud: false, hint: false, dist: 11, opm: Object.keys(subs).length ? 0 : null }); });
}

/* ===================================================================
 * Comparador de complexos σ (orto/meta/para)
 * =================================================================== */
const TAGTXT = { bad: 'muito desfavorável', good: 'estabilizado', extra: 'contribuinte extra (octetos completos)', half: 'efeito misto' };
export function sigmaCompare(host, o = {}) {
  let key = o.key || 'OCH3';
  const grid = h('div', { class: 'grid3 sigmacmp' }), concl = h('div');
  const draw = () => {
    clear(grid);
    const Sb = SUBS[key];
    ['o', 'm', 'p'].forEach((r) => {
      const { forms } = sigmaForms(key, r);
      const col = h('div', { class: 'chcard sigcol ' + r }, h('h4', null, `ataque ${REL_NAME[r]}`));
      forms.forEach((f, i) => {
        const s = sigmaS(key, r, f, { arrows: false });
        col.append(h('figure', { class: 'fig sm ' + (f.tag || '') }, svgS(s, { scale: 22, fs: 11, zoom: 1.35 }), h('figcaption', null, f.donated ? `forma ${i + 1}: ${Sb.lab}⁺=C` : `forma ${i + 1}: + em C${['', '', '', '', '', ''][0]}${[1, 2, 3, 4, 5, 6][f.plus]}`, f.tag ? h('span', { class: 'tagchip ' + f.tag }, TAGTXT[f.tag]) : null)));
      });
      const E = barrier(key, r);
      col.append(h('div', { class: 'ebar' }, h('span', null, 'barreira (qualitativa)'), h('div', { class: 'enbar' }, h('span', { style: `width:${Math.max(8, Math.min(100, (E - 20) * 1.6))}%` }))));
      grid.append(col);
    });
    const best = ['o', 'm', 'p'].sort((a, b) => barrier(key, a) - barrier(key, b));
    concl.replaceChildren(fb(Sb.dir === 'm' ? 'bad' : 'ok', Sb.dir === 'm' ? `<b>${Sb.lab}</b>: nos ataques orto e para há um contribuinte com a carga + no carbono ligado ao grupo retirador (vermelho) — muito desfavorável. No ataque meta a carga nunca chega a esse carbono. Todos os caminhos são mais lentos que no benzeno, mas <b>meta é o menos desfavorecido</b>.` : Sb.halogen ? `<b>${Sb.lab}</b>: o −I desestabiliza todos os complexos σ (anel desativado), mas nos ataques orto/para o par do halogênio permite um contribuinte adicional ${Sb.lab}⁺=C. Resultado: <b>desativador, orto/para</b>.` : Sb.donor ? `<b>${Sb.lab}</b>: nos ataques orto e para a carga + chega ao carbono ligado ao grupo e o par isolado gera um <b>contribuinte extra</b> (todos os átomos com octeto). No ataque meta isso não ocorre. Ordem das barreiras: ${best.map((x) => REL_NAME[x]).join(' < ')}.` : `<b>${Sb.lab}</b>: nos ataques orto/para uma das formas tem a carga + num carbono terciário vizinho ao grupo alquila (estabilização por indução e hiperconjugação). Orientação <b>orto/para</b>, ativação fraca.`), legend([['#3ddc97', 'estabiliza'], ['#ff5c6c', 'desestabiliza'], ['#ff9f43', 'misto'], ['#b18cff', 'carga + sem efeito especial do grupo']]));
  };
  host.append(o.fixed ? null : h('div', { class: 'controls' }, h('label', null, 'Substituinte: ', sel(subOpts(), key, (k) => { key = k; draw(); }, 'substituinte'))), grid, concl);
  draw();
  return { set(k) { key = k; draw(); } };
}
/** diagrama de energia com três caminhos */
export function pathDiagram(host, o = {}) {
  let key = o.key || 'OCH3';
  const box = h('div', { class: 'energywrap' }), out = h('div');
  const draw = () => {
    const svg = svgEl(640, 320, 'Perfis de energia para ataque orto, meta e para');
    const ts = { o: barrier(key, 'o'), m: barrier(key, 'm'), p: barrier(key, 'p') };
    const COL = { o: 'curve-o', m: 'curve-m', p: 'curve-p' };
    profile(svg, [[0, 0, ''], [0.3, 50, ''], [0.48, 28, ''], [0.62, 36, ''], [0.92, -15, '']], { ymin: -25, ymax: 95, cls: 'ref' });
    const lbl = {}; ['o', 'm', 'p'].forEach((r) => { const near = ['o', 'm', 'p'].filter((q) => Math.abs(ts[q] - ts[r]) < 3.5); if (near[0] === r) lbl[r] = 'ET₁ ' + near.map((q) => REL_NAME[q]).join('/'); });
    ['o', 'm', 'p'].forEach((r) => { const T = ts[r]; profile(svg, [[0, 0, r === 'o' ? 'reagentes' : ''], [0.3, T, lbl[r] || '', 'ts'], [0.48, T - 22, ''], [0.62, T - 14, ''], [0.92, -15, r === 'o' ? 'produtos' : '']], { ymin: -25, ymax: 95, cls: COL[r] }); });
    add(svg, 'text', { x: 6, y: 14, class: 'lab' }, 'Energia ↑ (qualitativa)');
    clear(box).append(svg);
    const best = ['o', 'm', 'p'].sort((a, b) => ts[a] - ts[b]);
    out.replaceChildren(legend([['#3ddc97', 'orto'], ['#b18cff', 'meta'], ['#2fd4f5', 'para'], ['#6f82a3', 'benzeno (referência, tracejado)']]), fb('neutral', `${SUBS[key].lab}: ET₁ mais baixo para <b>${REL_NAME[best[0]]}</b>${Math.abs(ts[best[0]] - ts[best[1]]) < 3 ? ' e ' + REL_NAME[best[1]] : ''}; ${ts[best[0]] < 50 ? 'abaixo' : 'acima'} do benzeno → ${SUBS[key].cls}.`));
  };
  host.append(o.fixed ? null : seg([['OCH3', '–OCH₃'], ['CH3', '–CH₃'], ['Cl', '–Cl'], ['NO2', '–NO₂'], ['tBu', '–C(CH₃)₃']], key, (k) => { key = k; draw(); }, 'substituinte'), box, out, h('p', { class: 'hint3' }, 'Diagramas qualitativos: as alturas ilustram tendências (não são valores medidos).'));
  draw();
}

/* ===================================================================
 * Tabelas de orientação (clique → justificativa)
 * =================================================================== */
export function orientTable(host, o = {}) {
  const groups = o.groups || [
    ['Fortemente ativadores · orto/para', ['NH2', 'NHCH3', 'OH', 'OCH3'], 'act'],
    ['Moderada/fracamente ativadores · orto/para', ['NHCOCH3', 'OCOCH3', 'CH3', 'C2H5', 'tBu'], 'act'],
    ['Desativadores · orto/para (halogênios)', ['F', 'Cl', 'Br', 'I'], 'hal'],
    ['Desativadores · meta', ['CHO', 'COCH3', 'COOH', 'COOCH3', 'CONH2', 'CN', 'SO3H', 'CF3', 'NO2', 'NMe3'], 'deact'],
  ];
  const det = h('div', { 'aria-live': 'polite' });
  host.append(h('div', { class: 'otable' }, groups.map(([t, ks, c]) => h('div', { class: 'ogroup ' + c }, h('h4', null, t), h('div', { class: 'chips' }, ks.map((k) => h('button', { class: 'chip sub ' + c, type: 'button', onclick: () => { clear(det).append(subCard(k), h('details', { class: 'why' }, h('summary', null, '🔍 Mostrar justificativa mecanística (complexos σ)'), h('div', { 'data-k': k }))); det.querySelector('details').addEventListener('toggle', (e) => { const d = e.currentTarget.querySelector('[data-k]'); if (!d.childElementCount) sigmaCompare(d, { key: k, fixed: true }); }); } }, '–' + SUBS[k].lab)))))), det);
}
export function matrix(host) {
  const rows = ['NH2', 'OH', 'OCH3', 'CH3', 'Cl', 'NO2', 'CHO', 'COCH3', 'COOH', 'CN'];
  const sp = { NH2: 'forte ativação', OH: 'forte ativação', OCH3: 'ativação', CH3: 'ativação moderada/fraca', Cl: 'desativação', NO2: 'forte desativação', CHO: 'desativação', COCH3: 'desativação', COOH: 'desativação', CN: 'desativação' };
  host.append(h('div', { class: 'table-wrap' }, h('table', { class: 'cmp' }, h('thead', null, h('tr', null, ['Substituinte', 'Efeito sobre a velocidade', 'Orientação', 'Indução', 'Ressonância'].map((t) => h('th', null, t)))), h('tbody', null, rows.map((k) => h('tr', null, h('th', null, '–' + SUBS[k].lab), h('td', null, sp[k]), h('td', { class: SUBS[k].dir }, DIRTXT[SUBS[k].dir]), h('td', null, SUBS[k].I), h('td', null, SUBS[k].R)))))), h('p', { class: 'hint3' }, 'Intensidades qualitativas: dependem da reação e das condições (não são valores universais).'));
}

/* ===================================================================
 * 18. Halogênios
 * =================================================================== */
export function halogen(host) {
  let key = 'Cl';
  const box = h('div');
  const vals = { F: [95, 35], Cl: [80, 18], Br: [75, 14], I: [62, 10] };
  const draw = () => {
    const [I, R] = vals[key];
    clear(box).append(h('div', { class: 'grid2' }, h('div', null,
      h('div', { class: 'barrow' }, h('small', null, '−I (retira por indução)'), h('div', { class: 'enbar red' }, h('span', { style: `width:${I}%` })), h('b', null, 'forte')),
      h('div', { class: 'barrow' }, h('small', null, '+R (doa por ressonância)'), h('div', { class: 'enbar grn' }, h('span', { style: `width:${R}%` })), h('b', null, 'fraco')),
      h('p', { class: 'hint3' }, 'Barras ilustrativas (qualitativas). A sobreposição do par do halogênio com o orbital 2p do carbono é pobre (sobretudo para Cl, Br, I: orbitais 3p, 4p, 5p).'),
      fb('neutral', `<b>Velocidade</b> ← o −I domina: anel <b>desativado</b>.<br><b>Orientação</b> ← o +R só atua quando a carga + chega ao carbono ligado ao ${key}: isso acontece nos ataques <b>orto e para</b>, que ficam menos desfavorecidos que o meta.`)),
    h('div', null, h('div', { class: 'figs' }, ringSVG2({ kek: 'A', subs: { 0: key } }, { scale: 34 })))));
  };
  host.append(seg([['F', 'F'], ['Cl', 'Cl'], ['Br', 'Br'], ['I', 'I']], key, (k) => { key = k; draw(); }, 'halogênio'), box);
  draw();
}

/* ===================================================================
 * 20. Efeito estérico
 * =================================================================== */
const RATIO = { CH3: [58, 5, 37], tBu: [16, 8, 76], Cl: [30, 1, 69], OCH3: [31, 2, 67], NO2: [6, 93, 1] };
export function steric(host) {
  let key = 'tBu', pos = 1, space = true;
  const v = vbox(), bars = h('div');
  const A = stericScene(v, { 0: key }, { pos, style: 'space', opm: 0, opmOnly: ['o', 'p'], hint: true });
  const upd = () => { A.st.style = space ? 'space' : 'ball'; A.setSubs({ 0: key }); A.setPos(pos); const r = RATIO[key]; bars.replaceChildren(h('div', { class: 'ratio' }, ['orto', 'meta', 'para'].map((t, i) => h('div', { class: 'rcol' }, h('div', { class: 'rbar', style: `height:${r[i] * 1.4}px` }), h('b', null, r[i] + '%'), h('small', null, t)))), h('p', { class: 'hint3' }, `Nitração de ${SUBS[key].ex}: distribuição típica aproximada (varia com as condições).`)); };
  host.append(h('div', { class: 'controls' }, seg([['CH3', 'tolueno'], ['tBu', 'terc-butilbenzeno'], ['Cl', 'clorobenzeno'], ['OCH3', 'anisol']], key, (k) => { key = k; upd(); }, 'substrato'), seg([['1', 'E⁺ em orto'], ['3', 'E⁺ em para']], '1', (k) => { pos = +k; upd(); }, 'posição'), tgl('Preenchimento espacial', () => { space = !space; upd(); return space; }, true)), h('div', { class: 'grid2' }, v, h('div', null, bars, h('div', { class: 'note key' }, h('b', { class: 't' }, 'Eletrônica × estérica'), h('p', null, 'O efeito eletrônico define a preferência geral (orto/para). O efeito estérico altera a proporção orto:para — com grupos volumosos (ou eletrófilos volumosos), para aumenta. Note que há 2 posições orto e só 1 para: sem impedimento, a estatística favoreceria orto 2:1.')))));
  upd();
}

/* ===================================================================
 * 21–22. Anéis dissubstituídos
 * =================================================================== */
export const DISUB = [
  { k: 'pnt', name: '4-nitrotolueno', subs: { 0: 'CH3', 3: 'NO2' }, type: 'concordantes' },
  { k: 'mdn', name: '1,3-dinitrobenzeno', subs: { 0: 'NO2', 2: 'NO2' }, type: 'concordantes' },
  { k: 'pna', name: '4-nitroanisol', subs: { 0: 'OCH3', 3: 'NO2' }, type: 'concordantes' },
  { k: 'pma', name: '4-metilanisol', subs: { 0: 'OCH3', 3: 'CH3' }, type: 'conflitantes' },
  { k: 'mma', name: '3-metilanisol', subs: { 0: 'OCH3', 2: 'CH3' }, type: 'conflitantes' },
  { k: 'pct', name: '4-clorotolueno', subs: { 0: 'CH3', 3: 'Cl' }, type: 'conflitantes' },
  { k: 'pac', name: '4-metilacetanilida', subs: { 0: 'NHCOCH3', 3: 'CH3' }, type: 'conflitantes' },
  { k: 'mtb', name: '1,3-di-terc-butilbenzeno', subs: { 0: 'tBu', 2: 'tBu' }, type: 'estérico' },
  { k: 'mxy', name: 'm-xileno', subs: { 0: 'CH3', 2: 'CH3' }, type: 'concordantes' },
];
export function disub(host, o = {}) {
  const list = DISUB.filter((d) => !o.types || o.types.includes(d.type));
  let cur = list[0], guess = null;
  const fig = h('div', { class: 'figs' }), out = h('div', { 'aria-live': 'polite' });
  const draw = () => {
    const res = regio(cur.subs);
    const notes = {}; const halo = {};
    if (guess !== null) res.forEach((x) => { if (!x) return; notes[x.j] = x.best ? '★' : x.ok ? '○' : '✕'; halo[x.j] = x.best ? 'g' : x.ok ? 'o' : ''; });
    const s = new S(); const r = ringDraw(s, { kek: 'A', subs: cur.subs, halo, notes, ncls: 'pos' });
    const svg = svgS(s, { scale: 44, fs: 17, zoom: 1.35 });
    // alvos clicáveis
    const C = svg._chem, g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); g.setAttribute('transform', C.transform); svg.append(g);
    res.forEach((x, j) => { if (!x) return; const p = C.atoms[r.id[j]]; const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); Object.entries({ cx: p.x, cy: p.y, r: 17, class: 'pk' + (guess === j ? ' on' : ''), tabindex: 0, role: 'button', 'aria-label': `posição C${j + 1}` }).forEach(([a, b]) => c.setAttribute(a, b)); const f = () => { guess = j; draw(); }; c.addEventListener('click', f); c.addEventListener('keydown', (e) => { if (e.key === 'Enter') f(); }); g.append(c); });
    clear(fig).append(svg);
    if (guess === null) { out.replaceChildren(fb('neutral', `${cur.name} (diretores ${cur.type}): clique na posição onde a próxima SEA deve ocorrer preferencialmente.`)); return; }
    const pick = res[guess], best = res.filter((x) => x && x.best);
    const occ = Object.entries(cur.subs);
    const lines = occ.map(([p, k]) => `–${SUBS[k].lab} (${SUBS[k].cls}, ${DIRTXT[SUBS[k].dir]}) favorece ${[0, 1, 2, 3, 4, 5].filter((j) => !cur.subs[j] && (SUBS[k].dir === 'op' ? ['o', 'p'] : ['m']).includes(rel(+p, j))).map((j) => 'C' + (j + 1)).join(', ') || '—'}`);
    out.replaceChildren(fb(pick.best ? 'ok' : pick.ok ? 'neutral' : 'bad', `${pick.best ? '✔ Posição favorecida.' : pick.ok ? '≈ Possível, mas não a principal.' : '✘ Desfavorecida.'} Posição(ões) prevista(s): <b>${best.map((x) => 'C' + (x.j + 1)).join(', ')}</b>.`), h('ul', { class: 'steps' }, lines.map((t) => h('li', { html: t })), h('li', { html: cur.type === 'concordantes' ? 'Os grupos <b>concordam</b>: apontam para as mesmas posições.' : cur.type === 'estérico' ? 'A posição entre os dois grupos (C2) é eletronicamente possível, mas fica <b>muito congestionada</b>.' : 'Os grupos <b>conflitam</b>: em geral prevalece o grupo <b>mais ativador</b>; considere também o impedimento estérico e as posições disponíveis.' }), pick.notes.length ? h('li', { html: `C${guess + 1}: ` + pick.notes.join('; ') }) : null), h('p', { class: 'hint3' }, '★ favorecida · ○ possível/minoritária · ✕ desfavorecida (estimativa qualitativa: soma dos efeitos + estérica).'));
  };
  host.append(h('div', { class: 'controls' }, h('label', null, 'Substrato: ', sel(list.map((d) => [d.k, `${d.name} (${d.type})`]), cur.k, (k) => { cur = list.find((d) => d.k === k); guess = null; draw(); }, 'substrato'))), h('div', { class: 'grid2' }, fig, out));
  draw();
}
export function congested(host) {
  const v = vbox();
  host.append(v, h('p', { class: 'cardlab' }, '1,3-di-terc-butilbenzeno em preenchimento espacial com E⁺ na posição entre os dois grupos (C2): congestionamento severo. Gire o modelo.'));
  stericScene(v, { 0: 'tBu', 2: 'tBu' }, { pos: 1, style: 'space', dist: 13 });
}
export function anilineAlCl3(host) {
  const s = new S();
  const r = ringDraw(s, { kek: 'hyb' }); const n = s.br(r.id[0], 90, 'NH₂', 1); s.atoms[n][3] = { cls: 'don', lp: [90] };
  const al = s.a(1.3, -3.4, 'AlCl₃', { cls: 'cat' }); s.arrow({ lp: [n, 90] }, { a: al, ang: 200 }, -0.4, 'o');
  s.r(1.8, 3.6, -0.3, '', '');
  const r2 = ringDraw(s, { kek: 'hyb', x: 5.4 }); const n2 = s.br(r2.id[0], 90, 'NH₂', 1); s.atoms[n2][3] = { chg: '+', cls: 'acc' }; const al2 = s.br(n2, 90, 'AlCl₃', 1); s.atoms[al2][3] = { chg: '−', cls: 'cat' };
  host.append(h('div', { class: 'figs' }, svgS(s, { scale: 34, fs: 15 })), h('p', { class: 'cardlab', html: 'O N básico doa seu par ao AlCl₃: o grupo vira <b>–NH₂⁺–AlCl₃⁻</b>, que não tem mais par para doar e retira densidade (desativador forte). A Friedel–Crafts clássica falha. <b>Tabelas de orientação não substituem a análise das condições reacionais.</b>' }));
}
export function protect(host) {
  const s = new S();
  ringDraw(s, { kek: 'hyb', subs: { 0: 'NH2' } });
  s.r(1.7, 4.3, 0, '(CH₃CO)₂O', '');
  ringDraw(s, { kek: 'hyb', x: 6, subs: { 0: 'NHCOCH3' } });
  s.r(7.7, 10.3, 0, 'SEA', '(ex.: Br₂)');
  ringDraw(s, { kek: 'hyb', x: 12, subs: { 0: 'NHCOCH3', 3: 'Br' } });
  s.r(13.7, 16.3, 0, 'H₃O⁺, Δ', '');
  ringDraw(s, { kek: 'hyb', x: 18, subs: { 0: 'NH2', 3: 'Br' } });
  host.append(h('div', { class: 'figs scrollx' }, svgS(s, { scale: 26, fs: 12 })), h('p', { class: 'cardlab', html: 'Acetanilida: o par do N também conjuga com a C=O → ativação <b>moderada</b> (monossubstituição controlada), grupo volumoso (favorece <b>para</b>) e não básico (evita protonação/complexação). Depois, hidrólise regenera a amina.' }));
}

/* ===================================================================
 * 23. Planejamento sintético
 * =================================================================== */
export const STEPS = {
  brom: { t: 'Br₂, FeBr₃', add: 'Br' }, chlor: { t: 'Cl₂, FeCl₃', add: 'Cl' }, nitr: { t: 'HNO₃, H₂SO₄', add: 'NO2' }, sulf: { t: 'SO₃, H₂SO₄', add: 'SO3H' },
  alq: { t: 'CH₃Cl, AlCl₃', add: 'CH3' }, acil: { t: 'CH₃COCl, AlCl₃', add: 'COCH3' },
  redco: { t: 'Zn(Hg), HCl (Clemmensen)', from: 'COCH3', to: 'C2H5' }, redno: { t: 'Sn ou Fe, HCl; depois NaOH', from: 'NO2', to: 'NH2' }, dessulf: { t: 'H₃O⁺ diluído, Δ', from: 'SO3H', to: null },
};
const STEP_RX = { brom: 'brom', chlor: 'chlor', nitr: 'nitr', sulf: 'sulf', alq: 'alq', acil: 'acil' };
/** aplica uma etapa a um anel {pos:key}: devolve {subs, msg, ok, mix} */
export function applyStep(subs, st) {
  const D = STEPS[st];
  if (D.from) { const p = Object.keys(subs).find((q) => subs[q] === D.from); if (p === undefined) return { subs, ok: false, msg: `Não há grupo –${SUBS[D.from].lab} para transformar.` }; const n = Object.assign({}, subs); if (D.to) n[p] = D.to; else delete n[p]; return { subs: n, ok: true, msg: D.to ? `–${SUBS[D.from].lab} → –${SUBS[D.to].lab}` : `–${SUBS[D.from].lab} removido` }; }
  const keys = Object.keys(subs);
  if (!keys.length) return { subs: { 0: D.add }, ok: true, msg: `${SUBS[D.add].ex}` };
  const c = compat(STEP_RX[st], subs);
  if (!c.ok) return { subs, ok: false, msg: c.msgs.join(' ') };
  const res = regio(subs).filter((x) => x && x.best);
  // normaliza: substituinte original em 0
  const pos = res.map((x) => x.j);
  const n = Object.assign({}, subs); n[pos.find((j) => j === 3) ?? pos[0]] = D.add;
  const mixRel = [...new Set(pos.map((j) => rel(+keys[0], j)))];
  return { subs: n, ok: true, mix: pos.length > 1 && mixRel.length > 1 ? mixRel : null, msg: `entra em ${[...new Set(pos.map((j) => 'C' + (j + 1)))].join('/')} (${mixRel.map((r) => REL_NAME[r]).join(' + ')} ao grupo existente)`, warn: c.msgs.join(' ') };
}
export const TARGETS = [
  { k: 'mbn', name: 'm-bromonitrobenzeno', a: 'NO2', b: 'Br', r: 'm', sol: ['nitr', 'brom'], why: 'NO₂ primeiro: ele dirige meta. Se o Br entrasse primeiro, dirigiria orto/para.' },
  { k: 'pbn', name: 'p-bromonitrobenzeno', a: 'Br', b: 'NO2', r: 'p', sol: ['brom', 'nitr'], why: 'Br primeiro (orto/para; separa-se o isômero para). Nitrar primeiro levaria ao meta.' },
  { k: 'mna', name: 'm-nitroacetofenona', a: 'COCH3', b: 'NO2', r: 'm', sol: ['acil', 'nitr'], why: 'Acilação primeiro: a Friedel–Crafts não funciona no nitrobenzeno (anel desativado).' },
  { k: 'pnt', name: 'p-nitrotolueno', a: 'CH3', b: 'NO2', r: 'p', sol: ['alq', 'nitr'], why: 'CH₃ primeiro (orto/para); Friedel–Crafts no nitrobenzeno falharia.' },
  { k: 'mcn', name: 'm-cloronitrobenzeno', a: 'NO2', b: 'Cl', r: 'm', sol: ['nitr', 'chlor'], why: 'NO₂ primeiro (meta diretor).' },
  { k: 'pba', name: 'p-bromoanilina', a: 'Br', b: 'NH2', r: 'p', sol: ['brom', 'nitr', 'redno'], why: 'Br → nitração (para) → redução do NO₂ a NH₂. (Alternativa: anilina protegida como acetanilida e depois bromada.)' },
  { k: 'mba', name: 'm-bromoanilina', a: 'NO2', b: 'Br', r: 'm', sol: ['nitr', 'brom', 'redno'], why: 'Nitrar (meta diretor), bromar em meta, e só então reduzir NO₂ → NH₂.' },
  { k: 'pet', name: 'p-etilnitrobenzeno (via acilação)', a: 'C2H5', b: 'NO2', r: 'p', sol: ['acil', 'redco', 'nitr'], why: 'Acilação → redução (etila, orto/para) → nitração em para. Nitrar a acetofenona daria meta!' },
];
export function planner(host) {
  let T = TARGETS[0], seq = [];
  const tbox = h('div', { class: 'figs' }), seqBox = h('div', { class: 'seq' }), out = h('div', { 'aria-live': 'polite' });
  const targetSubs = (t) => ({ 0: t.a, [{ o: 1, m: 2, p: 3 }[t.r]]: t.b });
  const run = () => {
    let subs = {}; const log = [];
    let fail = false;
    seq.forEach((st, i) => { if (fail) return; const r = applyStep(subs, st); log.push(h('li', { class: r.ok ? '' : 'bad', html: `<b>${i + 1}. ${STEPS[st].t}</b> → ${r.ok ? r.msg : '✘ ' + r.msg}${r.warn ? `<br><small class="muted">${r.warn}</small>` : ''}` })); if (!r.ok) fail = true; subs = r.subs; });
    clear(seqBox).append(seq.length ? h('ol', { class: 'steps' }, log) : h('p', { class: 'hint3' }, 'Escolha as etapas na ordem.'), seq.length ? h('div', { class: 'figs' }, ringSVG2({ kek: 'hyb', subs }, { scale: 30, fs: 13 })) : null);
    if (!seq.length) { out.replaceChildren(); return; }
    const want = targetSubs(T), ks = Object.keys(subs);
    const match = !fail && ks.length === 2 && Object.values(subs).sort().join() === Object.values(want).sort().join() && rel(+ks[0], +ks[1]) === T.r;
    out.replaceChildren(fb(match ? 'ok' : 'neutral', match ? `✔ Sequência adequada para ${T.name}. ${T.why}` : fail ? '✘ Uma etapa não é viável nessas condições.' : `Produto obtido não corresponde ao alvo (ou ainda faltam etapas). Dica: ${T.why.split('.')[0]}.`), h('button', { class: 'btn sm ghost', type: 'button', onclick: () => out.append(fb('neutral', `Rota sugerida: ${T.sol.map((s) => STEPS[s].t).join(' → ')}. ${T.why}`)) }, 'Ver rota sugerida'));
  };
  const drawT = () => clear(tbox).append(h('figure', { class: 'fig' }, ringSVG2({ kek: 'hyb', subs: targetSubs(T) }, { scale: 34, fs: 14 }), h('figcaption', null, 'alvo: ' + T.name)));
  host.append(h('div', { class: 'controls' }, h('label', null, 'Alvo: ', sel(TARGETS.map((t) => [t.k, t.name]), T.k, (k) => { T = TARGETS.find((t) => t.k === k); seq = []; drawT(); run(); }, 'alvo'))),
    h('div', { class: 'grid2' }, h('div', null, tbox, h('p', { class: 'prompt' }, 'A partir do benzeno, adicione etapas:'), h('div', { class: 'chips' }, Object.keys(STEPS).map((k) => h('button', { class: 'chip', type: 'button', onclick: () => { if (seq.length < 4) { seq.push(k); run(); } } }, STEPS[k].t)), h('button', { class: 'btn sm', type: 'button', onclick: () => { seq.pop(); run(); } }, '↶ desfazer'), h('button', { class: 'btn sm', type: 'button', onclick: () => { seq = []; run(); } }, '↺ limpar'))), h('div', null, seqBox, out)));
  drawT(); run();
}
export function blocking(host) {
  const s = new S();
  ringDraw(s, { kek: 'hyb', subs: { 0: 'CH3' } });
  s.r(1.7, 4.3, 0, 'SO₃, H₂SO₄', 'bloqueia para');
  ringDraw(s, { kek: 'hyb', x: 6, subs: { 0: 'CH3', 3: 'SO3H' } });
  s.r(7.7, 10.3, 0, 'Br₂, FeBr₃', 'entra em orto');
  ringDraw(s, { kek: 'hyb', x: 12, subs: { 0: 'CH3', 1: 'Br', 3: 'SO3H' } });
  s.r(13.9, 16.3, 0, 'H₃O⁺, Δ', 'remove –SO₃H');
  ringDraw(s, { kek: 'hyb', x: 18, subs: { 0: 'CH3', 1: 'Br' } });
  host.append(h('div', { class: 'figs scrollx' }, svgS(s, { scale: 26, fs: 12 })), h('p', { class: 'cardlab', html: 'Grupo bloqueador: a sulfonação reversível ocupa a posição <b>para</b>; a bromação vai para orto (CH₃ orto/para; SO₃H meta — concordam em C2); a dessulfonação remove o bloqueio: <b>o-bromotolueno</b> com boa seletividade. Exemplo didático.' }));
}

/* ===================================================================
 * 24. Mapa de reações e comparador
 * =================================================================== */
export function rxMap(host) {
  const det = h('div', { 'aria-live': 'polite' });
  const keys = ['brom', 'nitr', 'sulf', 'alq', 'acil'];
  const card = (k) => h('button', { class: 'rxnode', type: 'button', onclick: (e) => { host.querySelectorAll('.rxnode').forEach((b) => b.classList.toggle('on', b === e.currentTarget)); const R = RX[k]; det.replaceChildren(h('div', { class: 'chcard' }, h('h4', null, R.name), h('ul', { class: 'facts' }, h('li', null, h('span', null, 'reagentes'), h('b', null, R.reag)), h('li', null, h('span', null, 'eletrófilo'), h('b', null, R.elec)), h('li', null, h('span', null, 'produto'), h('b', null, R.prod)), h('li', null, h('span', null, 'reversível?'), h('b', null, R.rev)), h('li', null, h('span', null, 'observações/limitações'), h('b', null, R.note))), h('a', { class: 'btn sm', href: '#' + { brom: 'halogenacao', nitr: 'nitracao', sulf: 'sulfonacao', alq: 'alquilacao', acil: 'acilacao' }[k] }, 'Ver mecanismo →'))); } }, h('b', null, RX[k].name), h('small', null, RX[k].short));
  host.append(h('div', { class: 'rxmap' }, h('div', { class: 'rxcenter' }, h('div', { class: 'figs' }, ringSVG2({ kek: 'hyb' }, { scale: 30 })), h('b', null, 'BENZENO')), ...keys.map(card)), det);
}
export function rxCompare(host) {
  let a = 'nitr', b = 'acil';
  const out = h('div');
  const rows = [['Reagentes', 'reag'], ['Eletrófilo', 'elec'], ['Produto', 'prod'], ['Reversível?', 'rev'], ['Observações', 'note']];
  const draw = () => out.replaceChildren(h('div', { class: 'table-wrap' }, h('table', { class: 'cmp' }, h('thead', null, h('tr', null, h('th', null, ''), h('th', null, RX[a].name), h('th', null, RX[b].name))), h('tbody', null, rows.map(([t, k]) => h('tr', null, h('th', null, t), h('td', null, RX[a][k]), h('td', null, RX[b][k]))), h('tr', null, h('th', null, 'Intermediário'), h('td', null, 'complexo σ (íon arênio)'), h('td', null, 'complexo σ (íon arênio)'))))));
  const keys = ['brom', 'chlor', 'nitr', 'sulf', 'alq', 'acil'].map((k) => [k, RX[k].name]);
  host.append(h('div', { class: 'controls' }, h('label', null, 'A: ', sel(keys, a, (k) => { a = k; draw(); }, 'reação A')), h('label', null, 'B: ', sel(keys, b, (k) => { b = k; draw(); }, 'reação B'))), out);
  draw();
}
export function masterTable(host) {
  const keys = ['brom', 'nitr', 'sulf', 'alq', 'acil'];
  host.append(h('div', { class: 'table-wrap' }, h('table', { class: 'cmp' }, h('thead', null, h('tr', null, ['Reação', 'Reagentes', 'Eletrófilo', 'Produto', 'Observações'].map((t) => h('th', null, t)))), h('tbody', null, keys.map((k) => h('tr', null, h('th', null, RX[k].name), h('td', null, RX[k].short), h('td', null, RX[k].elec), h('td', null, RX[k].prod), h('td', null, RX[k].note)))))));
}
void OUT; void ringRank; void rankText; void sigmaS;
