/*
 * mods1.js — módulos 1–16: início, revisão da carbonila, mecanismo geral,
 * reversibilidade/equilíbrio, catálise, hidratação, gem-dióis, álcoois,
 * hemiacetais/acetais (mecanismo e hidrólise), reações intramoleculares,
 * hemiacetais cíclicos, glicose e sacarose.
 */
import { h, tgl, shuffle } from './widgets2d.js';
import { THREE, label } from './viewer3d.js';
import { V } from './struct.js';
import { parseSmiles } from './chem.js';
import { layout, drawSVG } from './depict.js';
import { svgEl, add } from './arom2d.js';
import { COMP, HYD, GLUCOSE_EQ } from './data.js';
import { molView, M3D } from './m3d.js';
import { addScene, ball, dashed, CYAN } from './co3d.js';
import * as M from './an2d.js';
import { S } from './chem2d.js';
import { fb, clear, sel, vbox, legend, ESP_LEG, ORB_LEG, svgOf, skx, figK, figRow, nm, mechPlayer, PTS, tabs, card, note, pickable } from './ui.js';

/* ===================================================================
 * 1. Início
 * =================================================================== */
export function hero(host) {
  const v = vbox('tall'), cap = h('p', { class: 'cardlab center' });
  host.append(v, cap);
  const NUCS = [['H₂O', 0x2fd4f5, 90], ['ROH', 0x7fe3f7, 162], ['RNH₂', 0x5b8cff, 234], ['CN⁻', 0xffd45c, 306], ['Ph₃P=CR₂', 0xffd45c, 18]];
  const A = molView(v, 'formaldeido', { pistar: true, delta: true, hlC: true, spin: true, hint: false, dist: 10.5, cam: [0.15, -0.6, 1],
    post(grp, G) {
      const C = G.atoms[G.map(1)].p, O = G.atoms[G.map(2)].p, u = V.norm(V.sub(O, C)), z = [0, 0, 1], y = [0, 1, 0];
      const th = 107 * Math.PI / 180;
      NUCS.forEach(([t, col, phi]) => {
        const f = phi * Math.PI / 180, perp = V.add(V.mul(z, Math.sin(f)), V.mul(y, Math.cos(f)));
        const d = V.add(V.mul(u, Math.cos(th)), V.mul(perp, Math.sin(th))), p = V.add(C, V.mul(d, 3.1));
        ball(grp, p, col, 0.3, t, t.includes('CN') || t.includes('P') ? 'y' : t.includes('N') ? 'c' : 'c'); dashed(grp, p, C, col);
      });
    } });
  cap.innerHTML = 'Carbonila (Cδ+=Oδ−) com o orbital <b>π*</b> e nucleófilos aproximando-se pela trajetória de Bürgi–Dunitz (≈ 107°): H₂O, ROH, RNH₂, CN⁻ e um ilídeo de fósforo.';
  void A;
}
export function pathsABC(host) {
  const col = (title, cls, steps, keys, cc) => h('div', { class: 'chcard path ' + cls }, h('h4', { html: title }), h('ol', { class: 'flowv' }, steps.map((t) => h('li', { html: t }))), h('div', { class: 'figs' }, keys.map((k) => figK(k, { scale: 24, fs: 12, cc }))));
  host.append(
    h('ol', { class: 'chainline' }, ['Nu:', 'ataque ao C=O', 'π → O', 'intermediário tetraédrico', 'destino depende do Nu e das condições'].map((t) => h('li', null, t))),
    h('div', { class: 'grid3' },
      col('Caminho A · <span class="pr">adição</span>', 'a', ['protonação do O⁻ (ou O–H⁺ → O–H)', 'produto <b>permanece tetraédrico</b> (sp³)'], ['hidratoAcetona', 'cianoidrina', 'hemicetal']),
      col('Caminho B · <span class="it">adição + eliminação</span>', 'b', ['transferências de próton', 'OH protonado sai como <b>H₂O</b>', 'C=N, C=O⁺R → novo produto'], ['cetal', 'imina', 'enamina']),
      col('Caminho C · <span class="cc">olefinação</span>', 'c', ['nucleófilo de carbono especial (P)', 'anel de 4 membros C–C–P–O', '<b>nova C=C</b> + P=O'], ['metilenocicloexano', 'cinamato'], true)));
}

/* ===================================================================
 * 2. Revisão da carbonila
 * =================================================================== */
export function espPair(host) {
  const a = vbox(), b = vbox();
  host.append(h('div', { class: 'cmp2' }, card('Cδ+=Oδ− · pares isolados', h('div', null, a, h('p', null, 'O (χ = 3,44) mais eletronegativo que C (2,55): densidade deslocada para o O; o C fica δ+ e eletrofílico.'))), card('Mapa de potencial (qualitativo)', h('div', null, b, ESP_LEG()))), h('div', { class: 'cmp2' }, card('Orbital π* (LUMO)', h('div', null, h('div', { class: 'viewer short', id: 'pistarv' }), ORB_LEG()))));
  molView(a, 'acetona', { delta: true, hlC: true, lp: true, hint: false });
  molView(b, 'acetona', { esp: true, hint: false });
  molView(host.querySelector('#pistarv'), 'acetona', { pistar: true, hlC: true, hint: false });
}
export function geoTet(host) {
  const v = vbox(), rng = h('input', { type: 'range', min: 0, max: 100, value: 0, 'aria-label': 'progresso do ataque' }), out = h('div', { 'aria-live': 'polite' });
  const A = addScene(v, { r1: 'CH3', r2: 'CH3', nu: 'OH', pistar: true, alt: 'Ataque nucleofílico: sp² → sp³' });
  let pend = 0;
  const go = () => { const t = +rng.value / 100; A.set(t, 0); const g = A.g, C = g.atoms[0].p, O = g.atoms[1].p; const d = V.len(V.sub(O, C)); out.replaceChildren(fb('neutral', `C–O = ${d.toFixed(2).replace('.', ',')} Å · carbono <b>${t < 0.5 ? 'sp² — trigonal planar, ≈ 120°' : 'sp³ — tetraédrico, ≈ 109,5°'}</b> · ${t < 0.3 ? 'C=O intacta; Nu na trajetória de Bürgi–Dunitz' : t < 0.85 ? 'nova ligação Nu–C formando-se enquanto a π C=O se rompe' : 'intermediário tetraédrico (alcóxido)'}`)); };
  rng.addEventListener('input', () => { cancelAnimationFrame(pend); pend = requestAnimationFrame(go); });
  host.append(v, h('div', { class: 'range-row' }, h('span', null, 'sp² planar'), rng, h('span', null, 'sp³ tetraédrico')), out);
  go();
}

/* ===================================================================
 * 3. Mecanismo geral
 * =================================================================== */
export const baseMech = (host) => mechPlayer(host, M.baseFrames(), { pts: PTS.base });
export const acidMech = (host) => mechPlayer(host, M.acidAddFrames(), { pts: PTS.acidAdd });

/* ===================================================================
 * 4. Reversibilidade e equilíbrio
 * =================================================================== */
const fmtK = (K) => { if (K >= 0.01 && K < 1000) return K.toPrecision(3).replace('.', ','); const e = Math.floor(Math.log10(K)); const m = K / 10 ** e; return `${m.toFixed(1).replace('.', ',')} × 10${String(e).replace(/-/g, '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d])}`; };
function bars(items) { return h('div', { class: 'eqbars' }, items.map(([t, p, cls]) => h('div', { class: 'eqbar' }, h('span', { class: 'lab', html: t }), h('div', { class: 'track' }, h('i', { class: cls || '', style: `width:${Math.max(0.5, Math.min(100, p))}%` })), h('b', null, (p < 0.1 ? p.toExponential(1) : p.toFixed(p < 10 ? 1 : 0)).replace('.', ',') + '%')))); }
export function dGK(host) {
  const rng = h('input', { type: 'range', min: -20, max: 20, step: 1, value: -3, 'aria-label': 'ΔG°' }), out = h('div'), val = h('b');
  const go = () => { const dG = +rng.value, K = Math.exp(-dG * 1000 / (8.314 * 298)), f = 100 * K / (1 + K); val.textContent = `ΔG° = ${dG} kJ/mol`; clear(out).append(h('p', { class: 'mono center' }, `K = e^(−ΔG°/RT) = ${fmtK(K)}   (298 K)`), bars([['reagentes (C=O + Nu)', 100 - f, 'r'], ['produto (aduto)', f, 'p']]), fb(K > 1 ? 'ok' : 'bad', K > 1 ? 'K > 1: no equilíbrio predomina o <b>produto</b>.' : K < 1 ? 'K < 1: no equilíbrio predominam os <b>reagentes</b>.' : 'K = 1')); };
  rng.addEventListener('input', go);
  host.append(h('div', { class: 'range-row' }, h('span', null, 'produto mais estável'), rng, h('span', null, 'reagentes mais estáveis')), h('p', { class: 'center' }, val), out, h('p', { class: 'hint3' }, 'Equilíbrio 1:1 (A ⇌ B) para ilustrar a relação ΔG° = −RT ln K. Cada 5,7 kJ/mol a 298 K muda K por um fator de 10.'));
  go();
}
export function catVsEq(host) {
  const ea = h('input', { type: 'range', min: 20, max: 90, value: 70, 'aria-label': 'barreira' }), dg = h('input', { type: 'range', min: -30, max: 30, value: -10, 'aria-label': 'ΔG°' }), box = h('div', { class: 'energywrap' }), out = h('div');
  const go = () => {
    const E = +ea.value, G = +dg.value, svg = svgEl(520, 230, 'Barreira e equilíbrio');
    const y = (e) => 180 - e * 1.6, path = `M30,${y(0)} C120,${y(0)} 160,${y(E)} 260,${y(E)} S400,${y(G)} 490,${y(G)}`;
    add(svg, 'path', { d: path, class: 'curve red' }); add(svg, 'line', { x1: 250, y1: y(0), x2: 250, y2: y(E), class: 'ea' }); add(svg, 'text', { x: 256, y: (y(0) + y(E)) / 2, class: 'ealab' }, 'ΔG‡'); add(svg, 'line', { x1: 480, y1: y(0), x2: 480, y2: y(G), class: 'ea' }); add(svg, 'text', { x: 420, y: y(G) + (G < 0 ? 18 : -8), class: 'lab' }, 'ΔG°'); add(svg, 'line', { x1: 30, y1: y(0), x2: 490, y2: y(0), class: 'axis', 'stroke-dasharray': '4 4' });
    clear(box).append(svg);
    const K = Math.exp(-G * 1000 / (8.314 * 298)), k = Math.exp(-(E - 70) * 1000 / (8.314 * 298));
    out.replaceChildren(fb('neutral', `<b>Velocidade</b> relativa (ida e volta) ≈ ×${fmtK(k)} · <b>K</b> = ${fmtK(K)}. Um catalisador (H⁺, OH⁻) abaixa ΔG‡ nos <b>dois sentidos</b>: o equilíbrio é atingido mais rápido, mas <b>K não muda</b>.`));
  };
  [ea, dg].forEach((r) => r.addEventListener('input', go));
  host.append(h('div', { class: 'range-row' }, h('span', null, 'ΔG‡ (cinética)'), ea, h('span', null, 'com catalisador ← → sem')), h('div', { class: 'range-row' }, h('span', null, 'ΔG° (termodinâmica)'), dg, h('span', null, '')), box, out);
  go();
}
/** C=O + 2 ROH ⇌ acetal + H₂O — modelo ilustrativo (K arbitrário) */
export function solveAcetal(a0, b0, w0, K, wFix = null) {
  let lo = 0, hi = Math.min(a0, b0 / 2) * 0.999999;
  const f = (x) => { const w = wFix !== null ? wFix : w0 + x; return x * w - K * (a0 - x) * (b0 - 2 * x) ** 2; };
  for (let k = 0; k < 80; k++) { const m = (lo + hi) / 2; if (f(m) > 0) hi = m; else lo = m; }
  return (lo + hi) / 2;
}
export function leChat(host) {
  const st = { b0: 2, w0: 0, rem: false };
  const out = h('div'), msg = h('div', { 'aria-live': 'polite' });
  const draw = (m) => { const x = solveAcetal(1, st.b0, st.w0, 1, st.rem ? 0.02 : null), p = 100 * x; clear(out).append(h('p', { class: 'mono center' }, 'R₂C=O + 2 ROH ⇌ R₂C(OR)₂ + H₂O   (H⁺ cat.)'), bars([['carbonila', 100 - p, 'r'], ['acetal/cetal', p, 'p']])); if (m) msg.replaceChildren(fb('neutral', m)); };
  const B = (t, f) => h('button', { class: 'btn sm', type: 'button', onclick: f }, t);
  host.append(h('div', { class: 'controls' }, B('↺ início (1 : 2)', () => { Object.assign(st, { b0: 2, w0: 0, rem: false }); draw('Proporção estequiométrica, sem água inicial.'); }), B('Excesso de álcool (×10)', () => { st.b0 = 20; draw('Excesso de ROH desloca o equilíbrio para o acetal (Le Châtelier).'); }), B('Remover água (Dean–Stark, peneira)', () => { st.rem = true; draw('Removendo continuamente a água, o sistema “repõe” H₂O formando mais acetal.'); }), B('Adicionar muita água', () => { st.rem = false; st.w0 = 20; draw('Excesso de água (com H⁺) desloca no sentido da <b>hidrólise</b>: carbonila + álcool.'); })), out, msg, h('p', { class: 'hint3' }, 'Modelo ilustrativo com K arbitrário (não é uma constante real); mostra apenas o sentido do deslocamento.'));
  draw('Proporção estequiométrica, sem água inicial.');
}
export function acidBaseCompare(host) {
  host.append(h('div', { class: 'table-wrap' }, h('table', { class: 'cmp' }, h('thead', null, h('tr', null, h('th', null, ''), h('th', null, 'Catálise ácida'), h('th', null, 'Catálise básica'))), h('tbody', null, [
    ['1ª etapa', 'protonação do O carbonílico (C fica mais eletrofílico)', 'o nucleófilo aniônico (HO⁻, RO⁻, CN⁻) ataca diretamente'],
    ['Nucleófilo', 'neutro e fraco (H₂O, ROH, RNH₂)', 'aniônico e mais forte'],
    ['Intermediário', 'oxônio tetraédrico (O⁺–H) → desprotonação', 'alcóxido tetraédrico → protonação'],
    ['Saída de OH', 'possível após protonação (sai H₂O)', 'HO⁻ é mau grupo de saída: não forma acetal'],
    ['Exemplos', 'hemiacetal/acetal, imina, enamina, hidratação', 'hidratação, hemiacetal, cianoidrina'],
  ].map((r) => h('tr', null, h('th', null, r[0]), h('td', null, r[1]), h('td', null, r[2])))))));
}
export function phWindow(host, o = {}) {
  const rng = h('input', { type: 'range', min: 0, max: 12, step: 0.5, value: 4.5, 'aria-label': 'pH' }), box = h('div', { class: 'energywrap' }), out = h('div', { 'aria-live': 'polite' });
  // fator 1: amina livre (cai em pH baixo); fator 2: H⁺ disponível para a desidratação (cai em pH alto)
  const rate = (pH) => (1 / (1 + 10 ** (3.2 - pH))) * (1 / (1 + 10 ** (pH - 4.8)));
  const go = () => {
    const pH = +rng.value, svg = svgEl(520, 200, 'Velocidade relativa × pH (ilustrativa)');
    let d = ''; let mx = 0; for (let p = 0; p <= 12; p += 0.1) mx = Math.max(mx, rate(p));
    for (let p = 0; p <= 12.001; p += 0.1) { const x = 40 + p / 12 * 460, y = 170 - rate(p) / mx * 140; d += (p === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1); }
    add(svg, 'path', { d, class: 'curve red' }); add(svg, 'line', { x1: 40, y1: 170, x2: 500, y2: 170, class: 'axis' });
    for (let p = 0; p <= 12; p += 2) add(svg, 'text', { x: 40 + p / 12 * 460, y: 188, 'text-anchor': 'middle', class: 'lab' }, String(p));
    const x = 40 + pH / 12 * 460; add(svg, 'line', { x1: x, y1: 20, x2: x, y2: 170, class: 'cursor' }); add(svg, 'text', { x: 8, y: 16, class: 'lab' }, 'velocidade relativa (ilustrativa)');
    clear(box).append(svg);
    out.replaceChildren(fb(pH < 3 ? 'bad' : pH > 6.5 ? 'bad' : 'ok', pH < 3 ? `pH ${pH}: meio muito ácido — a amina fica protonada (R–NH₃⁺) e <b>perde o par livre</b>: o ataque fica lento.` : pH > 6.5 ? `pH ${pH}: pouco ácido — falta H⁺ para protonar o OH da carbinolamina; a <b>desidratação</b> fica lenta.` : `pH ${pH}: catálise ácida <b>moderada</b> — há amina livre suficiente e H⁺ suficiente para a desidratação.`));
  };
  rng.addEventListener('input', go);
  host.append(h('div', { class: 'range-row' }, h('span', null, 'pH'), rng, h('span', null, '')), box, out, h('p', { class: 'hint3' }, o.hint || 'Curva qualitativa (forma de sino); o máximo, muitas vezes perto de pH 4–5, depende da amina e da carbonila.'));
  go();
}

/* ===================================================================
 * 6–7. Hidratação e gem-dióis
 * =================================================================== */
export const hydMech = (host) => tabs(host, [['Meio ácido', (p) => mechPlayer(p, M.acidAddFrames(), { pts: PTS.acidAdd })], ['Meio básico', (p) => mechPlayer(p, M.baseFrames(), { pts: PTS.base })]]);
export function gemdiol3d(host) {
  const pairs = { formaldeido: 'hidratoForm', acetaldeido: 'hidratoAcet', cloral: 'hidratoCloral', acetona: 'hidratoAcetona' };
  let k = 'formaldeido'; const a = vbox('short'), b = vbox('short'), la = h('p', { class: 'cardlab center' }), lb = h('p', { class: 'cardlab center' });
  let A = null, B = null;
  const draw = () => { if (!A) { A = molView(a, k, { hlC: true, hyb: true, hint: false }); B = molView(b, pairs[k], { hlC: true, hyb: true, hint: false, labels: [[2, 'OH', 'c'], [4, 'OH', 'c']] }); } else { A.set(k); B.set(pairs[k]); } la.textContent = M3D[k].name; lb.textContent = M3D[pairs[k]].name; };
  host.append(h('label', null, 'Carbonila: ', sel(Object.keys(pairs).map((x) => [x, M3D[x].name]), k, (x) => { k = x; draw(); }, 'carbonila')), h('div', { class: 'cmp2' }, h('div', null, a, la), h('div', null, b, lb)), h('p', { class: 'hint3 center' }, 'Gem-diol: dois OH no mesmo carbono (sp³).'));
  draw();
}
export function hydBars(host) {
  host.append(h('div', { class: 'eqbars' }, HYD.map(([k, Ktxt, lg, why]) => { const K = 10 ** lg, p = 100 * K / (1 + K); return h('div', { class: 'eqbar wide' }, h('span', { class: 'lab', html: `<b>${COMP[k].name}</b><small>${why}</small>` }), h('div', { class: 'track' }, h('i', { class: 'p', style: `width:${Math.max(0.6, p)}%` })), h('b', { html: `K<sub>hid</sub> ${Ktxt}` })); })), h('p', { class: 'hint3' }, 'Barras: fração aproximada na forma de hidrato em água. Ordens de grandeza aproximadas (água, ~25 °C) da literatura; servem para comparar tendências, não como valores exatos.'));
}

/* ===================================================================
 * 8–12. Álcoois, hemiacetais, acetais
 * =================================================================== */
export function alcoholOverview(host) {
  host.append(figRow(['acetaldeido', '⇌<small>ROH</small>', 'hemiacetal', '⇌<small>ROH, H⁺<br>− H₂O</small>', 'acetal']), figRow(['acetona', '⇌<small>ROH</small>', 'hemicetal', '⇌<small>ROH, H⁺<br>− H₂O</small>', 'cetal']));
}
export const hemiMech = (host) => mechPlayer(host, M.acidAddFrames({ R: 'CH₃', name: 'CH₃OH', k: 'hemicetal', kOx: 'hemicetalOx' }), { pts: PTS.acidAdd });
export function terminology(host) {
  const T = [['hemiacetal', 'Hemiacetal', 'OH, OR, <b>H</b>, R', 'de aldeído'], ['hemicetal', 'Hemicetal', 'OH, OR, R, R′', 'de cetona'], ['acetal', 'Acetal', 'OR, OR, <b>H</b>, R', 'de aldeído'], ['cetal', 'Cetal', 'OR, OR, R, R′', 'de cetona']];
  host.append(h('div', { class: 'grid4' }, T.map(([k, t, subs, src]) => h('div', { class: 'chcard center term' }, h('h4', null, t), h('div', { class: 'figs' }, skx(k, { scale: 30 })), h('p', { html: `C ligado a: ${subs}` }), h('small', { class: 'muted' }, src)))), legend([['#ff9f43', 'antigo carbono carbonílico'], ['#2fd4f5', 'O–H'], ['#7fe3f7', 'O–R']]),
    note('key', 'Nomenclatura', 'A IUPAC atual usa “acetal” (e “hemiacetal”) de forma geral, incluindo os derivados de cetonas; “cetal/hemicetal” é uma subclasse tradicional, mantida aqui por clareza didática.'));
}
export function compareRow(host) {
  const rows = { ald: ['acetaldeido', 'hemiacetal', 'acetal'], cet: ['acetona', 'hemicetal', 'cetal'] };
  let r = 'cet'; const vs = [vbox('short'), vbox('short'), vbox('short')], labs = [0, 1, 2].map(() => h('p', { class: 'cardlab center' })), f2 = [0, 1, 2].map(() => h('div', { class: 'figs' }));
  const As = [];
  const draw = () => rows[r].forEach((k, i) => { const L = [[2, M3D[k].atoms[M3D[k].map[2]][0] === 'O' && i === 0 ? 'C=O' : i === 2 ? 'OR' : 'OH', 'c'], [4, 'OR', 'c']]; if (!As[i]) As[i] = molView(vs[i], k, { hlC: true, hint: false, labels: i ? L : [] }); else { As[i].st.labels = i ? L : []; As[i].set(k); } labs[i].textContent = M3D[k].name; clear(f2[i]).append(skx(k, { scale: 26 })); });
  host.append(h('div', { class: 'controls' }, sel([['ald', 'Aldeído → hemiacetal → acetal'], ['cet', 'Cetona → hemicetal → cetal']], r, (x) => { r = x; draw(); }, 'série')), h('div', { class: 'grid3' }, [0, 1, 2].map((i) => h('div', { class: 'chcard' }, f2[i], vs[i], labs[i]))));
  draw();
}
const CLASSQ = [['hemiacetal', 'hemiacetal'], ['acetal', 'acetal'], ['hemicetal', 'hemicetal'], ['cetal', 'cetal'], ['thpOl', 'hemiacetal'], ['thfOl', 'hemiacetal'], ['dioxolano', 'cetal'], ['dioxolanoAcetona', 'cetal'], ['benzAcetal', 'acetal'], ['dioxolanoBenz', 'acetal'], ['hemicetalC5', 'hemicetal'], ['hemicetalC6', 'hemicetal'], ['hidratoAcet', 'gem-diol'], ['acetalMe', 'acetal']];
export function classifyQuiz(host) {
  let q = null, n = 0, ok = 0; const box = h('div'), out = h('div', { 'aria-live': 'polite' }), sc = h('span', { class: 'chip' });
  const next = () => { q = CLASSQ[Math.floor(Math.random() * CLASSQ.length)]; out.replaceChildren(); clear(box).append(h('div', { class: 'figs' }, figK(q[0], { scale: 34, cap: '?' })), h('div', { class: 'ch-answers' }, ['hemiacetal', 'acetal', 'hemicetal', 'cetal', 'gem-diol'].map((t) => h('button', { class: 'btn', type: 'button', onclick: (e) => { n++; const right = t === q[1]; if (right) ok++; sc.textContent = `${ok}/${n}`; out.replaceChildren(fb(right ? 'ok' : 'bad', `${right ? '✔' : '✘'} ${nm(q[0])}: <b>${q[1]}</b>. ${q[1] === 'gem-diol' ? 'Dois OH no mesmo C.' : (q[1].startsWith('hemi') ? 'Um OH e um OR' : 'Dois OR e nenhum OH') + ' no carbono destacado; ' + (q[1].endsWith('acetal') ? 'esse C tem um H (derivado de aldeído).' : 'esse C não tem H (derivado de cetona).')}`), h('button', { class: 'btn sm primary', type: 'button', onclick: next }, 'Próxima →')); [...e.currentTarget.parentNode.children].forEach((b) => { b.disabled = true; if (b.textContent === q[1]) b.classList.add('primary'); }); } }, t)))); };
  host.append(h('div', { class: 'controls' }, h('b', null, 'Reconhecimento estrutural'), sc), box, out); next();
}
export function acetalCompare3d(host) {
  const a = vbox('short'), b = vbox('short');
  host.append(h('div', { class: 'cmp2' }, card('Hemicetal: OH + OR', a), card('Cetal: OR + OR (sem OH)', b)));
  molView(a, 'hemicetal', { hlC: true, lp: true, hint: false, labels: [[2, 'OH', 'c'], [4, 'OCH₃', 'c']] });
  molView(b, 'cetal', { hlC: true, lp: true, hint: false, labels: [[2, 'OCH₃', 'c'], [4, 'OCH₃', 'c']] });
}
export const acetalMech = (host) => tabs(host, [['Mecanismo completo (9 etapas)', (p) => mechPlayer(p, M.fullAcetal(), { pts: PTS.acetal, slow: true })], ['Mecanismo simplificado', (p) => mechPlayer(p, M.simpleAcetal(), { pts: PTS.acetal })]]);
export const hydrolysisMech = (host) => mechPlayer(host, M.hydrolysisFrames(), { pts: PTS.hydrolysis });
export function protStab(host) {
  host.append(h('div', { class: 'cmp2' }, card('Base (HO⁻, RO⁻, hidretos, RMgX)', '<b class="pr">Acetal estável.</b> Não há como transformar OR em grupo de saída: RO⁻ é mau grupo de saída e não há carbonila eletrofílica para ser atacada.', 'good'), card('Ácido aquoso (H₃O⁺)', '<b class="bad">Acetal hidrolisado.</b> Protonação de OR → saída de ROH assistida pelo outro O → oxocarbênio → ataque da água → … → carbonila.', 'bad')));
}

/* ===================================================================
 * 13–14. Reações intramoleculares e hemiacetais cíclicos
 * =================================================================== */
const INTRA = { hidroxibutanal: ['thfOl', 5, 'hemiacetal'], hidroxipentanal: ['thpOl', 6, 'hemiacetal'], hidroxipentanona: ['hemicetalC5', 5, 'hemicetal'], hidroxiexanona: ['hemicetalC6', 6, 'hemicetal'], hidroxipropanal: ['OC1CCO1', 4, 'hemiacetal'] };
export function intraSim(host) {
  let key = 'hidroxipentanal', step = 0; const box = h('div', { class: 'figs' }), q = h('div'), out = h('div', { 'aria-live': 'polite' }), res = h('div');
  const draw = () => {
    step = 0; clear(res); out.replaceChildren();
    const m = parseSmiles(COMP[key].smi), svg = drawSVG(m, layout(m), { scale: 46, fs: 18, zoom: 1.3, hl: Object.fromEntries(m.atoms.map((a, i) => [i, a.el === 'O' ? 'oxy' : ''])) });
    pickable(svg, m, (a) => a.el === 'O' || a.el === 'C', (i, c) => {
      const a = m.atoms[i];
      if (step === 0) { if (a.el === 'O' && a.h === 1) { c.classList.add('on'); step = 1; ask(); out.replaceChildren(fb('ok', '✔ O oxigênio do <b>OH</b> é o nucleófilo (pares isolados).')); } else out.replaceChildren(fb('bad', a.el === 'O' ? 'Esse é o O da carbonila (é ele que recebe o par π, não o que ataca).' : 'Um carbono não é o nucleófilo aqui. Procure o O do grupo OH.')); return; }
      if (step === 1) { const isCO = a.el === 'C' && m.nb[i].some((x) => x.o === 2 && m.atoms[x.j].el === 'O'); if (isCO) { c.classList.add('on'); step = 2; ask(); out.replaceChildren(fb('ok', '✔ Carbono carbonílico (δ+): é ele que é atacado.')); } else out.replaceChildren(fb('bad', 'Procure o carbono eletrofílico: o C da C=O.')); }
    }, 16);
    clear(box).append(h('figure', { class: 'fig' }, svg, h('figcaption', null, COMP[key].name))); ask();
  };
  const ask = () => {
    clear(q);
    if (step === 0) q.append(h('p', { class: 'prompt' }, '1. Clique no átomo nucleofílico.'));
    else if (step === 1) q.append(h('p', { class: 'prompt' }, '2. Clique no carbono eletrofílico.'));
    else if (step === 2) q.append(h('p', { class: 'prompt' }, '3. Quantos átomos terá o anel formado (contando o O)?'), h('div', { class: 'ch-answers' }, [4, 5, 6, 7].map((n) => h('button', { class: 'btn', type: 'button', onclick: () => { const [pk, size, cls] = INTRA[key]; if (n !== size) { out.replaceChildren(fb('bad', `Conte: O do OH, os carbonos até o C carbonílico (inclusive). Não são ${n}.`)); return; } step = 3; clear(q); out.replaceChildren(fb(size === 4 ? 'bad' : 'ok', size === 4 ? '✔ 4 membros — mas esse anel é muito tenso: o fechamento <b>não é favorecido</b>; predomina a forma aberta.' : `✔ Anel de <b>${size} membros</b> (${size === 5 ? 'furanose-like, tetra-hidrofurano' : 'piranose-like, tetra-hidropirano'}): ${cls} cíclico — baixa tensão e reação intramolecular (efeito entrópico favorável).`)); const v = vbox('short'); clear(res).append(h('div', { class: 'cmp2' }, h('div', null, figK(pk, { cap: COMP[pk] ? COMP[pk].name : 'oxetan-2-ol (4 membros, desfavorecido)' })), M3D[pk] ? v : null)); if (M3D[pk]) molView(v, pk, { hlC: true, hint: false, labels: [[4, 'O do anel', 'c'], [2, 'OH', 'c']] }); } }, String(n)))));
  };
  host.append(h('label', null, 'Molécula: ', sel(Object.keys(INTRA).map((k) => [k, COMP[k].name]), key, (k) => { key = k; draw(); }, 'molécula')), box, q, out, res);
  draw();
}
export function ringSize(host) {
  const D = [[3, 'muito tensionado', 0.05], [4, 'tensionado', 0.15], [5, 'favorável', 0.9], [6, 'mais favorável (pouca tensão)', 1], [7, 'menos provável (entropia)', 0.35], [8, 'raro', 0.1]];
  host.append(h('div', { class: 'eqbars' }, D.map(([n, t, v]) => h('div', { class: 'eqbar' }, h('span', { class: 'lab', html: `<b>${n} membros</b><small>${t}</small>` }), h('div', { class: 'track' }, h('i', { class: n === 5 || n === 6 ? 'p' : 'r', style: `width:${v * 100}%` })), h('b', null, '')))), h('p', { class: 'hint3' }, 'Facilidade relativa de fechamento (qualitativa). Anéis de 5 e 6: ângulos próximos aos ideais (pouca tensão) e as extremidades se encontram com frequência (custo entrópico menor que em anéis grandes).'));
}
export function cyclicHemi(host) {
  const a = vbox('short'), b = vbox('short');
  host.append(h('div', { class: 'cmp2' }, card('5-hidroxipentanal (aberto)', h('div', null, a)), card('Hemiacetal cíclico (6 membros)', h('div', null, b))));
  molView(a, 'hidroxipentanal', { hlC: true, hyb: true, hint: false, labels: [[4, 'OH (nucleófilo)', 'c']] });
  molView(b, 'thpOl', { hlC: true, hyb: true, hint: false, labels: [[4, 'O do anel', 'c'], [2, 'OH (novo)', 'c']] });
}

/* ===================================================================
 * 15. Glicose
 * =================================================================== */
export function glucoseOpen(host) {
  const a = h('div', { class: 'figs' }), b = h('div', { class: 'figs' });
  a.append(h('figure', { class: 'fig' }, svgOf(M.fischer({ hlC1: true, hlC5: true, arrow: true }), { scale: 36, fs: 15 }), h('figcaption', { html: 'D-glicose (projeção de Fischer): <b>aldeído em C1</b>; <b>OH de C5</b> (nucleófilo)' })));
  b.append(h('figure', { class: 'fig' }, svgOf(M.haworth('b'), { scale: 52, fs: 16 }), h('figcaption', { html: 'β-D-glucopiranose (Haworth)' })), h('figure', { class: 'fig' }, svgOf(M.haworth('a'), { scale: 52, fs: 16 }), h('figcaption', { html: 'α-D-glucopiranose (Haworth)' })));
  host.append(h('div', { class: 'cmp2' }, h('div', null, a), h('div', null, b)), h('ol', { class: 'chainline' }, ['C1 é aldeído', 'O de C5–OH ataca C1', 'anel de 6 membros (piranose)', 'C1 = carbono anomérico', 'formas α e β'].map((t) => h('li', null, t))));
}
export function glucose3d(host) {
  const v = vbox('tall'), cap = h('div', { 'aria-live': 'polite' });
  const L = { glicoseAberta: [[1, 'C1 (aldeído)', 'o'], [4, 'O de C5–OH', 'c']], alfaGlicose: [[1, 'C1 anomérico', 'o'], [2, 'OH anomérico (α, axial)', 'c'], [4, 'O do anel (ex-C5–OH)', 'c']], betaGlicose: [[1, 'C1 anomérico', 'o'], [2, 'OH anomérico (β, equatorial)', 'c'], [4, 'O do anel (ex-C5–OH)', 'c']] };
  const T = { glicoseAberta: 'Forma aberta: C1 aldeído; o OH de C5 pode alcançar C1.', alfaGlicose: 'α-D-glucopiranose: cadeira; OH anomérico <b>axial</b> (trans ao CH₂OH no Haworth).', betaGlicose: 'β-D-glucopiranose: cadeira com <b>todos</b> os substituintes grandes equatoriais — forma predominante em água.' };
  let k = 'betaGlicose'; const A = molView(v, k, { hlC: true, hint: false, labels: L[k] });
  const go = (x) => { k = x; A.st.labels = L[k]; A.set(k); cap.replaceChildren(fb('neutral', T[k])); [...bar.children].forEach((b) => b.setAttribute('aria-pressed', b.dataset.k === k ? 'true' : 'false')); };
  const bar = h('div', { class: 'controls' }, ...Object.keys(L).map((x) => h('button', { class: 'btn sm', type: 'button', 'data-k': x, onclick: () => go(x) }, M3D[x].name)), tgl('Preenchimento', () => { A.st.style = A.st.style === 'ball' ? 'space' : 'ball'; A.rebuild(); return A.st.style === 'space'; }, false));
  host.append(bar, v, cap); go(k);
}
export function glucoseEq(host) {
  host.append(h('p', { class: 'mono center' }, 'α-D-glucopiranose  ⇌  forma aberta  ⇌  β-D-glucopiranose'), bars(GLUCOSE_EQ.map(([t, p], i) => [t, p, i === 2 ? 'r' : 'p'])), h('p', { class: 'hint3' }, 'Valores aproximados em água a ~25 °C (≈ 36 : 64; forma aberta ≪ 1%; furanoses < 1% não mostradas). A forma aberta é minoritária, mas é por ela que α e β se interconvertem (mutarrotação).'));
}
export function anomerQuiz(host) {
  const out = h('div', { 'aria-live': 'polite' });
  const s = M.fischer({ hlC1: false });
  const svg = svgOf(s, { scale: 34, fs: 14 }), C = svg._chem, NS = 'http://www.w3.org/2000/svg', g = document.createElementNS(NS, 'g'); g.setAttribute('transform', C.transform); svg.append(g);
  let step = 0;
  s.atoms.forEach((a, i) => { if (!(a[2] === 'OH' || a[2] === '' || a[2] === 'O' || a[2] === 'CH₂OH')) return; const p = C.atoms[i]; const c = document.createElementNS(NS, 'circle'); [['cx', p.x], ['cy', p.y], ['r', 15], ['class', 'pk'], ['tabindex', 0], ['role', 'button']].forEach(([x, y]) => c.setAttribute(x, y)); c.addEventListener('click', () => {
    const isC5OH = a[2] === 'OH' && i === s.atoms.findIndex((b, j) => b[2] === 'OH' && j > 0 && s.bonds.some(([x, y]) => (x === 4 && y === j) || (y === 4 && x === j)));
    if (step === 0) { if (isC5OH) { c.classList.add('on'); step = 1; out.replaceChildren(fb('ok', '✔ O OH de <b>C5</b> forma o anel de 6 membros (piranose). Agora clique no carbono que se torna <b>anomérico</b>.')); } else out.replaceChildren(fb('bad', a[2] === 'OH' ? 'Esse OH formaria outro tamanho de anel (o de C4 daria 5 membros, uma furanose minoritária para a glicose). Para o anel de 6 membros predominante, é o de C5.' : 'Clique em um grupo OH.')); return; }
    if (step === 1) { if (i === 0) { c.classList.add('on'); step = 2; out.replaceChildren(fb('ok', '✔ <b>C1</b>, o antigo carbono do aldeído, vira um novo centro estereogênico: o <b>carbono anomérico</b> (α ou β).')); } else out.replaceChildren(fb('bad', 'É o carbono que era a carbonila (C1, no topo).')); }
  }); g.append(c); });
  host.append(h('p', { class: 'prompt' }, 'Teste: clique no OH que forma o anel de seis membros predominante.'), h('div', { class: 'figs' }, svg), out);
}

/* ===================================================================
 * 16. Sacarose
 * =================================================================== */
export function sucrose3d(host) {
  const v = vbox('tall'), out = h('div', { 'aria-live': 'polite' });
  const base = [[1, 'C1 da glicose (anomérico)', 'o'], ['#6', 'C2 da frutose (anomérico)', 'o'], [2, 'O glicosídico', 'c']];
  const A = molView(v, 'sacarose', { hint: false, labels: base, dist: 15 });
  let on = false;
  const btn = h('button', { class: 'btn primary', type: 'button', onclick: () => { on = !on; A.st.halos = on ? [[1, 0xff9f43], ['#6', 0xff9f43], [2, 0x2fd4f5]] : []; A.rebuild(); out.replaceChildren(on ? fb('neutral', '<b>Por que a sacarose não é redutora?</b> Os <b>dois</b> carbonos anoméricos (C1 da glicose e C2 da frutose) estão na mesma ligação glicosídica: cada um é um centro do tipo <b>acetal/cetal</b>. Não há hemiacetal anomérico livre; logo, não há abertura simples para uma carbonila (aldeído) que pudesse reduzir Ag⁺ (Tollens) ou Cu²⁺ (Fehling/Benedict). <i>Extensão didática.</i>') : ''); } }, 'Por que não é açúcar redutor?');
  host.append(v, h('div', { class: 'controls' }, btn, tgl('Preenchimento', () => { A.st.style = A.st.style === 'ball' ? 'space' : 'ball'; A.rebuild(); return A.st.style === 'space'; }, false)), out);
}
export function sucrose2d(host) {
  const s = new S();
  // glicose (esquerda) — anel piranose
  const P = { O5: [1.1, -0.7], C1: [2.0, 0.1], C2: [1.3, 0.9], C3: [-0.3, 0.9], C4: [-1.0, 0.1], C5: [-0.1, -0.7] }, id = {};
  Object.entries(P).forEach(([k, [x, y]]) => { id[k] = s.a(x, y, k === 'O5' ? 'O' : '', k === 'C1' ? { halo: 'o' } : k === 'O5' ? { cls: 'oxy2' } : {}); });
  [['O5', 'C1'], ['C1', 'C2'], ['C2', 'C3'], ['C3', 'C4'], ['C4', 'C5'], ['C5', 'O5']].forEach(([a, b]) => s.b(id[a], id[b], 1));
  const t = (k, dy, lab, cls) => { const [x, y] = P[k]; const n = s.a(x, y + dy, lab, cls ? { cls } : {}); s.b(id[k], n, 1); return n; };
  t('C5', -0.9, 'CH₂OH', 'grey'); t('C4', 0.9, 'OH', 'oxy2'); t('C3', -0.9, 'OH', 'oxy2'); t('C2', 0.9, 'OH', 'oxy2'); t('C1', -0.8, 'H');
  const og = s.a(2.0, 1.1, 'O', { cls: 'nu', halo: 'c' }); s.b(id.C1, og, 1);
  // frutose (direita) — anel furanose (β), C2 ligado ao O glicosídico
  const F = { C2: [3.0, 1.6], O5: [4.2, 1.1], C5: [4.9, 2.0], C4: [4.3, 2.9], C3: [3.2, 2.7] }, f = {};
  Object.entries(F).forEach(([k, [x, y]]) => { f[k] = s.a(x, y, k === 'O5' ? 'O' : '', k === 'C2' ? { halo: 'o' } : k === 'O5' ? { cls: 'oxy2' } : {}); });
  [['C2', 'O5'], ['O5', 'C5'], ['C5', 'C4'], ['C4', 'C3'], ['C3', 'C2']].forEach(([a, b]) => s.b(f[a], f[b], 1));
  s.b(og, f.C2, 1);
  const u = (k, dx, dy, lab, cls) => { const [x, y] = F[k]; const n = s.a(x + dx, y + dy, lab, cls ? { cls } : {}); s.b(f[k], n, 1); return n; };
  u('C2', -0.75, 0.75, 'CH₂OH', 'grey'); u('C5', 1.0, -0.4, 'CH₂OH', 'grey'); u('C3', -0.55, 0.85, 'OH', 'oxy2'); u('C4', 0.75, 0.75, 'OH', 'oxy2');
  s.t(0.6, -2.2, 'unidade α-D-glicopiranosil', 'cond', 13); s.t(3.4, 4.5, 'unidade β-D-frutofuranosil', 'cond', 13); s.t(2.75, 0.15, 'C1', 'cond', 12); s.t(3.45, 1.05, 'C2′', 'cond', 12);
  host.append(h('figure', { class: 'fig wide' }, svgOf(s, { scale: 50, fs: 15 }), h('figcaption', { html: 'Sacarose: ligação glicosídica α(1→2)β entre os <b>dois carbonos anoméricos</b> (laranja). Esquema simplificado: o anel da glicose em perspectiva de Haworth; o da frutose em projeção plana (sem estereoquímica). Veja o modelo 3D.' })));
}
export function sugarCompare(host) {
  host.append(h('div', { class: 'cmp2' }, card('Glicose', '<b>Hemiacetal livre</b> em C1 → equilíbrio com a forma aberta (aldeído) → mutarrotação; açúcar <b>redutor</b>.', 'good'), card('Sacarose', 'Centros anoméricos <b>bloqueados</b> na ligação glicosídica (acetal/cetal) → sem abertura simples → sem mutarrotação; açúcar <b>não redutor</b>. Em ácido aquoso (ou por enzimas), a ligação glicosídica é hidrolisada → glicose + frutose.', 'bad')));
}
void THREE; void label; void CYAN; void shuffle; void svgEl;
