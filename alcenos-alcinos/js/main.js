/*
 * main.js — navegação entre módulos e inicialização sob demanda dos componentes.
 */
import { mol, S } from './chem2d.js';
import { VIEWERS } from './viewer3d.js';
import { M, genericAddition, hbrFrames, propCations, brominationFrames, hydrationFrames, oxymercFrames, hydroborationFrames, halohydrinFrames, epoxFrames, osmiumFrames, hydrideShiftFrames, methylShiftFrames, tautoFrames, acetylideFrames, dissolvingFrames, ozonolysisFrames, NOMEN } from './struct.js';
import { alkeneScene, rotationScene, alkyneScene, hydrogenationScene, brominationScene, BROM_STEPS, hydroborationScene, HB_STEPS, facesScene, reductionScene, isomerScene } from './scenes.js';
import { energyChart } from './energy.js';
import { h, player, quickTests, drawKeys, nomenTrainer, NOMEN_YNE, ezActivity, stability, hydrogenationLevels, markovPick, ozonolysisCutter, pka, polymer, hydrationTable, masterTable, alkVsAlkTable, reactionMap, simulator, comparator, bromineTest } from './widgets2d.js';
import { lab } from './lab.js';
import { SOLVED, PROPOSED, PUZZLES } from './exdata.js';
import { exerciseCard, solvedCard, arrowPuzzle } from './practice.js';
import { quiz, challenge } from './quiz.js';

const SECTIONS = [...document.querySelectorAll('.section')];
const NAV = [...document.querySelectorAll('.mainnav a')];
const pager = document.getElementById('pager');
let current = null;
const cleanups = [];
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sem armazenamento */ } },
};

/* esquema de reação: substrato → condição → produto(s) */
function scheme(sub, cond, prods, cap) {
  return h('figure', { class: 'fig', style: 'flex-basis:100%;max-width:none' }, h('div', { class: 'rxline' },
    h('div', { style: 'width:170px' }, mol(M[sub](), { scale: 34 })), h('span', { class: 'arrow' }, '⟶'), h('div', { class: 'cond', html: cond }), h('span', { class: 'arrow' }, '⟶'), drawKeys(prods, { w: 170 })), cap ? h('figcaption', { html: cap }) : null);
}
const FIG = {
  hydrogCyclo: (host) => host.append(scheme('dimetilciclohexeno', 'H₂, Pd/C', 'cisDimetilciclohexano', '1,2-dimetilciclo-hexeno → <b>cis</b>-1,2-dimetilciclo-hexano: os dois H entram pela mesma face, empurrando os CH₃ para a outra face (juntos).')),
  cations: (host) => {
    const c = propCations();
    host.append(h('figure', { class: 'fig' }, mol(c.sec, { scale: 44, zoom: 1.2 }), h('figcaption', { html: '<b>H no CH₂</b> → cátion <b style="color:var(--green)">secundário</b> (mais estável) ✓' })),
      h('figure', { class: 'fig' }, mol(c.pri, { scale: 44, zoom: 1.2 }), h('figcaption', { html: '<b>H no CH</b> → cátion <b style="color:var(--magenta)">primário</b> (muito instável) ✗' })));
  },
  rearrCompare: (host) => host.append(h('figure', { class: 'fig' }, mol(M.bromometilbutano3(), { scale: 40 }), h('figcaption', { html: 'produto <b>esperado sem rearranjo</b>: 2-bromo-3-metilbutano (minoritário)' })), h('figure', { class: 'fig' }, mol(M.bromometilbutano2(), { scale: 40 }), h('figcaption', { html: 'produto <b>real principal</b>: 2-bromo-2-metilbutano (rearranjado)' }))),
  kmno4: (host) => { host.append(scheme('ciclohexeno', 'KMnO₄ diluído, frio, OH⁻', 'cisDiolCiclohexano', 'condição branda: cis-diol')); host.append(scheme('metilciclohexeno', 'KMnO₄, H₃O⁺, Δ', 'oxoheptanoico', 'condição vigorosa: clivagem → ácido 6-oxo-heptanoico')); },
  alkyneH2: (host) => { const box = h('div', { class: 'rxline' }, h('div', { style: 'width:170px' }, mol(M.but2ino(), { scale: 32 })), h('span', { class: 'cond' }, 'H₂, Pd'), h('span', { class: 'arrow' }, '⟶'), h('div', { style: 'width:120px;opacity:.7' }, mol(M.but2enoZ(), { scale: 32 })), h('span', { class: 'cond' }, 'H₂, Pd'), h('span', { class: 'arrow' }, '⟶'), h('div', { style: 'width:140px' }, mol(M.butano(), { scale: 32 }))); host.append(h('figure', { class: 'fig', style: 'flex-basis:100%;max-width:none' }, box, h('figcaption', null, 'duas etapas de adição de H₂; o alceno intermediário reage rapidamente'))); },
  hxAlkyne: (host) => { host.append(scheme('propino', 'HBr (1 equiv.)', 'bromopropeno2', 'haleto vinílico (Markovnikov)')); host.append(scheme('propino', 'HBr (2 equiv.)', 'dibromopropano22', 'di-haleto geminal')); },
  hydrAlkyne: (host) => host.append(h('figure', { class: 'fig', style: 'flex-basis:100%;max-width:none' }, h('div', { class: 'rxline' }, h('div', { style: 'width:150px' }, mol(M.propino(), { scale: 32 })), h('span', { class: 'cond' }, 'HgSO₄, H₂SO₄, H₂O'), h('span', { class: 'arrow' }, '⟶'), h('div', { style: 'width:140px' }, mol(M.enolPropanona(), { scale: 32 })), h('span', { class: 'cond' }, 'tautomerização'), h('span', { class: 'arrow' }, '⇌'), h('div', { style: 'width:140px' }, mol(M.propanona(), { scale: 32 }))), h('figcaption', null, 'propino → enol (Markovnikov) → propanona'))),
  hbAlkyne: (host) => host.append(h('figure', { class: 'fig', style: 'flex-basis:100%;max-width:none' }, h('div', { class: 'rxline' }, h('div', { style: 'width:150px' }, mol(M.propino(), { scale: 32 })), h('span', { class: 'cond' }, '1. (Sia)₂BH 2. H₂O₂, OH⁻'), h('span', { class: 'arrow' }, '⟶'), h('div', { style: 'width:150px' }, mol(M.enolPropanal(), { scale: 32 })), h('span', { class: 'cond' }, 'tautomerização'), h('span', { class: 'arrow' }, '⇌'), h('div', { style: 'width:150px' }, mol(M.propanal(), { scale: 32 }))), h('figcaption', null, 'propino → enol (anti-Markovnikov) → propanal'))),
  halAlkyne: (host) => { host.append(scheme('propino', 'Br₂ (1 equiv.)', 'dibromopropenoE', '(E)-1,2-dibromopropeno')); host.append(scheme('propino', 'Br₂ (2 equiv.)', 'tetrabromopropano', '1,1,2,2-tetrabromopropano')); },
  cleavAlkyne: (host) => { host.append(scheme('propino', '1. O₃ 2. H₂O (ou KMnO₄, Δ)', ['acidoAcetico', 'co2'])); host.append(scheme('but2ino', 'KMnO₄, Δ', 'acidoAcetico', '2 ácido acético')); },
};

/* controles para cenas com relógio e etapas */
function stepControls(sc, steps) {
  const c = sc.clock;
  const cap = h('div', { class: 'stepcap', 'aria-live': 'polite' });
  const tl = h('div', { class: 'timeline' });
  const range = h('input', { type: 'range', min: 0, max: 1000, value: 0, 'aria-label': 'Progresso' });
  const play = h('button', { class: 'btn sm primary', type: 'button', onclick: () => { c.stopAt = null; c.toggle(); } }, '▶ Reproduzir');
  c.onState = (p) => { play.textContent = p ? '❚❚ Pausar' : '▶ Reproduzir'; };
  const idx = (s) => { let k = 0; steps.forEach((st, i) => { if (s >= st.s - 1e-6) k = i; }); return k; };
  const stepB = h('button', { class: 'btn sm', type: 'button', onclick: () => { const k = Math.min(steps.length - 1, idx(c.s) + 1); c.stopAt = steps[k].s; c.play(); } }, 'Passo a passo ▶');
  const reset = h('button', { class: 'btn sm', type: 'button', onclick: () => { c.pause(); c.stopAt = null; c.set(0); } }, '⟲ Reiniciar');
  const slow = h('button', { class: 'btn sm', type: 'button', 'aria-pressed': 'false', onclick: (e) => { const on = e.currentTarget.getAttribute('aria-pressed') !== 'true'; e.currentTarget.setAttribute('aria-pressed', on); c.speed(on ? 0.35 : 1); } }, '🐢 Lento');
  range.addEventListener('input', () => { c.pause(); c.set(+range.value / 1000); });
  steps.forEach((st) => tl.append(h('button', { type: 'button', html: `<b>${st.t}</b>`, onclick: () => { c.pause(); c.set(st.s); } })));
  let cur = -1;
  const onSet = (s) => { const k = idx(s); if (k !== cur) { cur = k; cap.innerHTML = steps[k].d; [...tl.children].forEach((b, i) => b.classList.toggle('on', i === k)); } range.value = Math.round(s * 1000); };
  return { el: h('div', null, h('div', { class: 'controls' }, play, stepB, reset, slow), h('div', { class: 'range-row' }, range), tl, cap), onSet };
}
const tgl = (t, f, on) => h('button', { class: 'btn sm', type: 'button', 'aria-pressed': on ? 'true' : 'false', onclick: (e) => e.currentTarget.setAttribute('aria-pressed', f()) }, t);
function sceneWithSteps(host, make, steps, extra) {
  const vbox = h('div', { class: 'viewer tall' }), side = h('div');
  host.append(h('div', { class: 'split' }, h('div', null, vbox), side));
  let ctl = null;
  const sc = make(vbox, (s) => ctl && ctl.onSet(s));
  ctl = stepControls(sc, steps);
  side.append(ctl.el); if (extra) side.append(extra);
  if (sc.set) sc.set(0);
  return sc;
}

/* ---------- componentes ---------- */
const W = {
  hero(host) {
    const a = h('div', { class: 'viewer' }), b = h('div', { class: 'viewer' });
    host.append(a, b);
    const A = alkeneScene(a, { pi: true, orbitals: true, angles: false, labels: false });
    const B = alkyneScene(b, { pi: true, labels: false, camPos: [2.5, 2.2, 8] });
    if (A.v.ok) { A.v.caption('<b>C=C</b> · sp² · 1 σ + 1 π'); A.v.controls.autoRotate = true; }
    if (B.v.ok) { B.v.caption('<b>C≡C</b> · sp · 1 σ + 2 π'); B.v.controls.autoRotate = true; }
  },
  ethene3d(host) {
    const vbox = h('div', { class: 'viewer' }); host.append(vbox);
    const sc = alkeneScene(vbox, { angles: true });
    host.append(vbox, h('div', { class: 'controls' }, tgl('Mostrar orbitais', () => sc.toggle('orb'), false), tgl('ligação π', () => sc.toggle('pi'), false), tgl('ângulos', () => sc.toggle('angles'), true), tgl('rótulos sp²', () => sc.toggle('labels'), true)));
  },
  rotation(host) {
    const vbox = h('div', { class: 'viewer' }); host.append(vbox);
    const out = h('div', { class: 'stepcap', 'aria-live': 'polite' });
    const sc = rotationScene(vbox, (deg, ov) => { out.innerHTML = `θ = <b>${deg}°</b> · sobreposição p–p ≈ <b>${(ov * 100).toFixed(0)}%</b> ${ov < 0.1 ? '→ <span class="status-bad">ligação π rompida</span>' : ov > 0.95 ? '→ <span class="status-ok">π máxima</span>' : ''}`; });
    const r = h('input', { type: 'range', min: 0, max: 180, value: 0, 'aria-label': 'Ângulo de rotação' });
    r.addEventListener('input', () => sc.set && sc.set(+r.value));
    const anim = h('button', { class: 'btn sm primary', type: 'button', onclick: () => { let t = 0; const id = setInterval(() => { t += 2; r.value = t; sc.set && sc.set(t); if (t >= 90) clearInterval(id); }, 30); } }, '▶ Tentar girar 90°');
    host.append(vbox, h('div', { class: 'controls' }, h('div', { class: 'range-row' }, h('span', { class: 'chip' }, '0°'), r, h('span', { class: 'chip' }, '180°')), anim), out);
    if (sc.set) sc.set(0);
  },
  nomAlk(host) { nomenTrainer(host, NOMEN); },
  nomYne(host) { nomenTrainer(host, NOMEN_YNE, { namesOnly: true }); },
  cistrans(host) {
    const a = h('div', { class: 'viewer short' }), b = h('div', { class: 'viewer short' });
    host.append(h('div', { class: 'grid2' }, a, b));
    const A = isomerScene(a, ['CH3', 'H', 'CH3', 'H'], '<b>cis</b>-2-buteno = (Z)');
    const B = isomerScene(b, ['CH3', 'H', 'H', 'CH3'], '<b>trans</b>-2-buteno = (E)');
    host.append(h('div', { class: 'controls' }, tgl('space-filling', () => { const on = !(A._sp); A._sp = on; A.setStyle && A.setStyle(on ? 'space' : 'ball'); B.setStyle && B.setStyle(on ? 'space' : 'ball'); return on; }, false)));
  },
  ez(host) { ezActivity(host); },
  stability(host) { stability(host); },
  hydrogLevels(host) { hydrogenationLevels(host); },
  genAdd(host) {
    const f = genericAddition();
    player(host, [
      { s: f[0], cap: 'Alceno (elétrons π, nucleófilo) e reagente A–B polarizado (A<sup>δ+</sup> eletrofílico).' },
      { s: f[1], cap: 'Os elétrons π atacam A; o par da ligação A–B vai para B.' },
      { s: f[2], cap: 'Resultado global: a π se rompe e formam-se duas ligações σ (C–A e C–B).' },
    ]);
  },
  energyMk(host) { energyChart(host, { show: ['mk'], h: 300 }); },
  energyMk2(host) { energyChart(host, { show: ['mk', 'amk'], noEa: true, h: 320 }); },
  energyCat(host) { energyChart(host, { show: ['cat', 'nocat'], noEa: true, h: 280 }); },
  energyTaut(host) { energyChart(host, { show: ['taut'], noEa: true, h: 280 }); },
  hydrog3d(host) {
    const vbox = h('div', { class: 'viewer' }); host.append(vbox);
    const sc = hydrogenationScene(vbox);
    host.append(vbox, h('div', { class: 'controls' }, h('button', { class: 'btn sm primary', type: 'button', onclick: () => { sc.clock.set(0); sc.clock.play(); } }, '▶ Reproduzir'), h('button', { class: 'btn sm', type: 'button', onclick: () => { sc.clock.pause(); sc.clock.set(0); } }, '⟲ Reiniciar'), h('button', { class: 'btn sm', type: 'button', onclick: () => { sc.clock.pause(); sc.clock.set(1); } }, 'Produto')));
  },
  brom3d(host) { sceneWithSteps(host, (v, on) => brominationScene(v, on), BROM_STEPS, h('div', { class: 'legend' }, h('span', null, h('i', { style: 'background:#a5432a' }), 'Br'), h('span', null, h('i', { style: 'background:#ff4fa3' }), 'ataque do Br⁻ pela face oposta'))); },
  bromPlayer(host) {
    const f = brominationFrames();
    player(host, [
      { s: f.r, cap: 'Ciclo-hexeno + Br₂.' },
      { s: f.a, cap: 'π → Br; par livre desse Br → carbono; par Br–Br → Br⁻ (três setas simultâneas).' },
      { s: f.ia, cap: '<b>Íon bromônio</b> (intermediário em ponte). O Br⁻ ataca pela face oposta, abrindo o anel.' },
      { s: f.p, cap: '<b>trans</b>-1,2-dibromociclo-hexano (racêmico): adição <b>anti</b>.' },
    ]);
  },
  bromTest(host) { bromineTest(host); },
  hbrPlayer(host) {
    const f = hbrFrames();
    player(host, [
      { s: f.r, cap: 'Propeno + HBr.' },
      { s: f.a, cap: '<b>Etapa 1 (lenta):</b> π → H; H–Br → Br⁻.' },
      { s: f.ia, cap: '<b>Carbocátion secundário</b> + Br⁻. <b>Etapa 2 (rápida):</b> Br⁻ ataca o C⁺.' },
      { s: f.p, cap: '<b>2-bromopropano</b> (produto Markovnikov).' },
    ]);
  },
  markov(host) { markovPick(host); },
  rearrH(host) {
    const f = hydrideShiftFrames();
    player(host, [
      { s: f[0], cap: 'A protonação do 3-metilbut-1-eno dá um cátion <b>secundário</b>. O H do carbono vizinho migra com o par de elétrons (<b>hidreto</b>).' },
      { s: f[1], cap: 'Cátion <b>terciário</b>, mais estável. Br⁻ ataca.' },
      { s: f[2], cap: 'Produto principal <b>rearranjado</b>: 2-bromo-2-metilbutano.' },
    ], { draw: { scale: 40, fs: 16 } });
  },
  rearrM(host) {
    const f = methylShiftFrames();
    player(host, [
      { s: f[0], cap: 'Cátion <b>secundário</b> vizinho a um carbono quaternário: migra um <b>CH₃</b> com seu par.' },
      { s: f[1], cap: 'Cátion <b>terciário</b>; Cl⁻ ataca.' },
      { s: f[2], cap: 'Produto: <b>2-cloro-2,3-dimetilbutano</b>.' },
    ], { draw: { scale: 40, fs: 16 } });
  },
  hydrPlayer(host) {
    const f = hydrationFrames();
    player(host, [
      { s: f[0], cap: '2-metilpropeno + H₃O⁺ (catalisador).' },
      { s: f[1], cap: '<b>Protonação</b>: π → H; H–O → O.' },
      { s: f[2], cap: '<b>Carbocátion terciário</b> (Markovnikov).' },
      { s: f[3], cap: '<b>Ataque da água</b> ao C⁺.' },
      { s: f[4], cap: '<b>Íon oxônio</b>.' },
      { s: f[5], cap: '<b>Desprotonação</b> por outra água (regenera H₃O⁺).' },
      { s: f[6], cap: '<b>2-metilpropan-2-ol</b>.' },
    ]);
  },
  oxyPlayer(host) {
    const f = oxymercFrames();
    player(host, [
      { s: f[0], cap: 'Propeno + Hg(OAc)⁺ (de Hg(OAc)₂ em água).' },
      { s: f[1], cap: 'π → Hg: forma-se o <b>íon mercurínio</b>.' },
      { s: f[2], cap: '<b>Mercurínio</b> em ponte, com δ+ maior no carbono mais substituído (ligação C–Hg mais longa).' },
      { s: f[3], cap: 'A água ataca o <b>carbono mais substituído</b>, do lado oposto ao Hg (anti); após desprotonação forma-se o organomercurial.' },
      { s: f[4], cap: '<b>Desmercuração</b> com NaBH₄: Hg é trocado por H → <b>propan-2-ol</b> (Markovnikov, sem rearranjo).' },
    ]);
  },
  hb3d(host) { sceneWithSteps(host, (v, on) => hydroborationScene(v, on), HB_STEPS, h('div', { class: 'legend' }, h('span', null, h('i', { style: 'background:#ffa5a5' }), 'B'), h('span', null, h('i', { style: 'background:#ef3b3b' }), 'O'))); },
  hbPlayer(host) {
    const f = hydroborationFrames();
    player(host, [
      { s: f[0], cap: 'Propeno + BH₃ (B com orbital p vazio).' },
      { s: f[1], cap: 'π → B e B–H → C, <b>ao mesmo tempo</b>.' },
      { s: f[2], cap: '<b>Estado de transição de 4 centros</b> (não é intermediário): δ+ no C mais substituído; B no C menos impedido.' },
      { s: f[3], cap: 'Organoborana → H₂O₂, OH⁻ → <b>propan-1-ol</b> (anti-Markovnikov).' },
    ]);
  },
  hydrTable(host) { hydrationTable(host); },
  halohPlayer(host) {
    const f = halohydrinFrames();
    player(host, [
      { s: f[0], cap: 'Bromônio do propeno (δ+ maior no C2) com água em excesso.' },
      { s: f[1], cap: 'A <b>água</b> ataca o C2 pela face oposta ao Br.' },
      { s: f[2], cap: 'Após desprotonação: <b>1-bromopropan-2-ol</b> (OH no C mais substituído; adição anti).' },
    ]);
  },
  epoxPlayer(host) {
    const f = epoxFrames();
    player(host, [
      { s: f[0], cap: 'Alceno + perácido (RCO₃H; ex.: mCPBA). O O terminal do perácido é eletrofílico.' },
      { s: f[1], cap: '<b>Estado de transição "borboleta"</b>: as ligações se formam e se rompem ao mesmo tempo (tracejado).' },
      { s: f[2], cap: '<b>Epóxido</b> + ácido carboxílico. Adição syn: a geometria do alceno é mantida.' },
    ]);
  },
  faces3d(host) {
    const vbox = h('div', { class: 'viewer short' }); host.append(vbox);
    const sc = facesScene(vbox, 'alkene');
    const seg = h('div', { class: 'seg', role: 'group' });
    [['alkene', 'alceno (Z)'], ['epoxide', 'epóxido (syn)'], ['diol', 'diol syn (OsO₄)'], ['anti', 'dibrometo anti (Br₂)']].forEach(([k, t], i) => seg.append(h('button', { type: 'button', 'aria-pressed': i === 0 ? 'true' : 'false', onclick: (e) => { [...seg.children].forEach((b) => b.setAttribute('aria-pressed', b === e.currentTarget)); sc.build && sc.build(k); } }, t)));
    host.append(h('div', { class: 'controls' }, seg), vbox);
  },
  osmPlayer(host) {
    const f = osmiumFrames();
    player(host, [
      { s: f[0], cap: 'Ciclo-hexeno + OsO₄.' },
      { s: f[1], cap: 'Adição concertada dos dois O pela <b>mesma face</b>.' },
      { s: f[2], cap: '<b>Éster ósmico cíclico</b> (os dois C–O na mesma face).' },
      { s: f[3], cap: 'Clivagem (NaHSO₃/H₂O ou NMO) → <b>cis-ciclo-hexano-1,2-diol</b>.' },
    ]);
  },
  ozPlayer(host) {
    const f = ozonolysisFrames();
    player(host, [
      { s: f[0], cap: '2-metilbut-2-eno + O₃ (−78 °C).' },
      { s: f[1], cap: 'Cicloadição: <b>molozonídeo</b> (instável).' },
      { s: f[2], cap: 'Rearranjo a <b>ozonídeo</b>.' },
      { s: f[3], cap: '(CH₃)₂S (redutor) → <b>propanona + etanal</b>.' },
    ], { draw: { scale: 40, fs: 16 } });
  },
  ozCut(host) { ozonolysisCutter(host); },
  polymer(host) { polymer(host); },
  mapAlkene(host) { reactionMap(host, 'alkene'); },
  mapAlkyne(host) { reactionMap(host, 'alkyne'); },
  alkyne3d(host) {
    const vbox = h('div', { class: 'viewer' }); host.append(vbox);
    const sc = alkyneScene(vbox, { pi: false });
    host.append(vbox, h('div', { class: 'controls' }, tgl('Mostrar as duas ligações π', () => sc.toggle('pi'), false), tgl('rótulos sp', () => sc.toggle('labels'), true)));
  },
  pka(host) { pka(host); },
  acetPlayer(host) {
    const f = acetylideFrames();
    player(host, [
      { s: f[0], cap: 'Propino + NH₂⁻ (NaNH₂).' },
      { s: f[1], cap: 'NH₂⁻ remove o H terminal; o par da ligação C–H fica no carbono sp.' },
      { s: f[2], cap: '<b>Acetileto</b> (carbânion em C sp) + NH₃. Diante dele, CH₃–Br.' },
      { s: f[3], cap: '<b>SN2</b>: o acetileto ataca o CH₃ pelo lado oposto ao Br.' },
      { s: f[4], cap: '<b>But-2-ino</b>: nova ligação C–C.' },
    ]);
  },
  reduction(host) {
    const a = h('div', { class: 'viewer short' }), b = h('div', { class: 'viewer short' });
    host.append(h('div', { class: 'grid2' }, h('div', null, h('h4', { class: 'c-sn2' }, 'H₂, Lindlar → cis'), a), h('div', null, h('h4', { style: 'color:var(--orange)' }, 'Na, NH₃(l) → trans'), b)));
    const A = reductionScene(a, 'lindlar'), B = reductionScene(b, 'nanh3');
    host.append(h('div', { class: 'controls' }, h('button', { class: 'btn sm primary', type: 'button', onclick: () => { [A, B].forEach((x) => { x.clock.set(0); x.clock.play(); }); } }, '▶ Reproduzir as duas'), h('button', { class: 'btn sm', type: 'button', onclick: () => { [A, B].forEach((x) => { x.clock.pause(); x.clock.set(0); }); } }, '⟲ Reiniciar')));
  },
  dissPlayer(host) {
    const f = dissolvingFrames();
    player(host, [
      { s: f[0], cap: 'But-2-ino em Na/NH₃(l).' },
      { s: f[1], cap: 'Na doa um elétron: <b>radical-ânion</b>; a repulsão favorece os grupos em lados opostos.' },
      { s: f[2], cap: 'NH₃ protona o carbânion: <b>radical vinílico</b>.' },
      { s: f[3], cap: 'Segundo elétron: <b>ânion vinílico trans</b> (mais estável).' },
      { s: f[4], cap: 'Protonação: <b>(E)-but-2-eno</b>.' },
    ], { draw: { scale: 40, fs: 16 } });
  },
  tautoPlayer(host) {
    const f = tautoFrames();
    player(host, [
      { s: f[0], cap: 'Enol (prop-1-en-2-ol) em meio ácido.' },
      { s: f[1], cap: 'Par do O empurra a π, que captura H⁺ no carbono.' },
      { s: f[2], cap: 'Carbonila protonada (cátion estabilizado por ressonância).' },
      { s: f[3], cap: 'A água remove o H do oxigênio.' },
      { s: f[4], cap: '<b>Propanona</b>: forma ceto, mais estável.' },
    ]);
  },
  alkTable(host) { alkVsAlkTable(host); },
  lab(host) { const L = lab(host); cleanups.push(() => L.dispose()); },
  sim(host) { simulator(host); },
  puzzles(host) {
    PUZZLES.forEach((p, i) => { const d = h('div', { class: 'ex' }, h('div', { class: 'ex-head' }, h('span', { class: 'num' }, 'M' + (i + 1)), h('span', null, p.title)), h('div', { class: 'ex-body' }, h('p', null, p.intro))); host.append(d); arrowPuzzle(d.querySelector('.ex-body'), p.puzzle); });
  },
  master(host) { masterTable(host); },
  comparator(host) { comparator(host); },
  levelChips(host) { [...new Set(SOLVED.map((s) => s.level))].forEach((l, i) => host.append(h('a', { class: 'chip', href: '#res-' + i }, l))); },
  solved(host) { let last = null, li = -1; SOLVED.forEach((d, i) => { if (d.level !== last) { last = d.level; li++; host.append(h('h3', { id: 'res-' + li }, d.level)); } host.append(solvedCard(d, `R${i + 1}`)); }); },
  propEasy(host) { renderProposed(host, PROPOSED.easy, 0); },
  propMid(host) { renderProposed(host, PROPOSED.mid, 15); },
  propHard(host) { renderProposed(host, PROPOSED.hard, 35); },
  quiz(host) { quiz(host, (sec, anchor) => go(sec, anchor)); },
  challenge(host) { const c = challenge(host); cleanups.push(() => c.stop()); },
  cmap(host) { conceptMap(host); },
};

function renderProposed(host, list, offset) {
  const done = store.get('aa-prop', {});
  list.forEach((d, i) => host.append(exerciseCard(d, `P${offset + i + 1}`, (num, ok) => { done[num] = ok; store.set('aa-prop', done); })));
}

function conceptMap(host) {
  const node = (t, href, color) => h('a', { class: 'card', href, style: `text-decoration:none;color:var(--text);border-color:var(--${color || 'border'});text-align:left;font-size:.9rem;padding:8px 10px` }, t);
  const branch = (title, color, items) => h('div', { style: 'display:grid;gap:6px;align-content:start' }, h('div', { class: 'card', style: `font-weight:900;color:var(--${color});border-color:var(--${color})` }, title), ...items.map(([t, href]) => node(t, href)));
  host.append(
    h('div', { style: 'display:grid;justify-items:center;margin-bottom:14px' }, h('div', { class: 'card', style: 'font-size:1.35rem;font-weight:900;border-color:var(--cyan);background:linear-gradient(135deg,rgba(47,212,245,.14),rgba(61,220,151,.12))' }, 'Alcenos e Alcinos')),
    h('div', { class: 'grid3' },
      branch('Estrutura', 'cyan', [['sp² (120°) · sp (180°)', '#estrutura-alcenos'], ['σ + π · σ + 2π', '#estrutura-alcinos'], ['rotação restrita', '#est-rot']]),
      branch('Nomenclatura', 'cyan', [['-eno, -dieno, ciclo-', '#nomenclatura-alcenos'], ['-ino, -en-ino', '#nomenclatura-alcinos']]),
      branch('Estabilidade', 'cyan', [['grau de substituição', '#iso-stab'], ['trans > cis', '#iso-stab'], ['calores de hidrogenação', '#iso-hid']]),
      branch('Estereoquímica', 'violet', [['cis/trans · E/Z (CIP)', '#iso-ez'], ['adição syn (H₂, BH₃, OsO₄, mCPBA)', '#hidroboracao'], ['adição anti (Br₂, Br₂/H₂O)', '#halogenacao']]),
      branch('Adições', 'orange', [['HX · H₃O⁺ (carbocátion)', '#hidrohalogenacao'], ['oximercuração (mercurínio)', '#oximercuracao'], ['hidroboração (concertada)', '#hidroboracao'], ['X₂ · haloidrina (halônio)', '#halogenacao']]),
      branch('Oxidações e clivagens', 'magenta', [['epoxidação · di-hidroxilação', '#epoxidacao'], ['ozonólise', '#ozonolise'], ['KMnO₄', '#permanganato'], ['clivagem de alcinos', '#clivagem-alcino']]),
      branch('Reduções', 'green', [['H₂/Pd → alcano', '#hidrogenacao'], ['Lindlar → cis', '#lindlar'], ['Na/NH₃ → trans', '#lindlar']]),
      branch('Alcinos', 'green', [['acidez (pKa 25)', '#acidez'], ['acetileto + R–X (SN2)', '#acetileto'], ['enol ⇌ cetona', '#tautomeria']]),
      branch('Síntese', 'green', [['Markovnikov × anti-Markovnikov', '#hidratacoes'], ['mapas de reações', '#mapa-alcenos'], ['simulador', '#simulador']])),
    h('div', { class: 'flowsteps', style: 'margin-top:18px;flex-direction:row;flex-wrap:wrap;justify-content:center' }, ['estrutura', 'mecanismo', 'intermediário', 'regioquímica', 'estereoquímica', 'produto'].map((t, i) => [i ? h('span', { class: 'ar' }, '→') : null, h('div', { class: 'fs', style: 'min-width:0' }, h('b', null, t))]).flat()));
}

/* ---------- navegação ---------- */
function initSection(sec) {
  sec.querySelectorAll('[data-fig]:not([data-done])').forEach((el) => { el.setAttribute('data-done', ''); const f = FIG[el.dataset.fig]; if (f) { try { f(el); } catch (err) { console.error('Figura', el.dataset.fig, err); } } });
  sec.querySelectorAll('[data-w]:not([data-done])').forEach((el) => {
    el.setAttribute('data-done', '');
    const f = W[el.dataset.w];
    if (!f) return;
    try { f(el); } catch (err) { console.error('Componente', el.dataset.w, err); el.insertAdjacentHTML('beforeend', '<p class="hint">Não foi possível carregar este componente.</p>'); }
  });
  quickTests(sec);
}
function teardown(sec) {
  cleanups.splice(0).forEach((f) => { try { f(); } catch (e) { /* ok */ } });
  [...VIEWERS].forEach((v) => v.dispose());
  if (!sec) return;
  sec.querySelectorAll('[data-w][data-3d]').forEach((el) => { el.innerHTML = ''; el.removeAttribute('data-done'); });
}
function go(id, anchor) {
  let sec = document.getElementById(id);
  if (!sec || !sec.classList.contains('section')) { const inner = document.getElementById(id); sec = inner ? inner.closest('.section') : SECTIONS[0]; anchor = inner && inner !== sec ? id : anchor; }
  if (sec !== current) {
    if (current) teardown(current);
    current = sec;
    SECTIONS.forEach((s) => s.classList.toggle('active', s === sec));
    NAV.forEach((a) => { if (a.getAttribute('href') === '#' + sec.id) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    initSection(sec);
    const visited = store.get('aa-visited', []);
    if (!visited.includes(sec.id)) { visited.push(sec.id); store.set('aa-visited', visited); }
    markVisited(); buildPager();
    document.title = (sec.dataset.title || '') + ' · Alcenos e Alcinos';
    const cur = NAV.find((a) => a.getAttribute('aria-current'));
    if (cur) cur.scrollIntoView({ block: 'nearest', inline: 'center' });
  }
  if (anchor) { const t = document.getElementById(anchor); if (t) setTimeout(() => t.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60); }
  else { window.scrollTo(0, 0); setTimeout(() => window.scrollTo(0, 0), 0); }
}
function markVisited() {
  const visited = store.get('aa-visited', []);
  NAV.forEach((a) => a.classList.toggle('done', visited.includes(a.getAttribute('href').slice(1)) && !a.getAttribute('aria-current')));
  document.getElementById('progress').style.width = (100 * visited.length / SECTIONS.length) + '%';
}
function buildPager() {
  const i = SECTIONS.indexOf(current);
  pager.innerHTML = '';
  if (i > 0) pager.append(h('a', { class: 'btn', href: '#' + SECTIONS[i - 1].id }, '← ' + SECTIONS[i - 1].dataset.title));
  if (i < SECTIONS.length - 1) pager.append(h('a', { class: 'btn primary', href: '#' + SECTIONS[i + 1].id, style: 'margin-left:auto' }, SECTIONS[i + 1].dataset.title + ' →'));
}
window.addEventListener('hashchange', () => go(location.hash.slice(1) || 'inicio'));
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-action]');
  if (!b) return;
  if (b.dataset.action === 'redo') {
    try { localStorage.removeItem('aa-prop'); } catch (err) { /* nada */ }
    const sec = document.getElementById('propostos');
    sec.querySelectorAll('[data-w]').forEach((el) => { el.innerHTML = ''; el.removeAttribute('data-done'); });
    initSection(sec);
  }
});
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
go(location.hash.slice(1) || 'inicio');
window.addEventListener('load', () => { const t = document.getElementById(location.hash.slice(1)); if (!t || t.classList.contains('section')) setTimeout(() => window.scrollTo(0, 0), 30); });
void S;
