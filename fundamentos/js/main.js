/*
 * main.js — navegação entre módulos, inicialização sob demanda, qualidade gráfica.
 */
import { VIEWERS } from './viewer3d.js';
import { h, quickTests } from './widgets2d.js';
import * as A from './m1.js';
import * as B from './m2.js';
import * as T from './tools.js';
import { SOLVED, PROPOSED } from './exdata.js';
import { exerciseCard, solvedCard } from './practice.js';
import { quiz, challenge } from './quiz.js';
import { lewisFig } from './ui.js';
import { molScene } from './scene3d.js';
import { L, MOLS } from './lib.js';

const SECTIONS = [...document.querySelectorAll('.section')];
const NAV = [...document.querySelectorAll('.mainnav a')];
const pager = document.getElementById('pager');
let current = null;
const cleanups = [];
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sem armazenamento */ } },
};
B.setQuality(store.get('fund-q', 40));

const FIG = { lewis(host) { host.dataset.k.split(' ').forEach((k) => host.append(lewisFig(k))); } };
const ORB_INFO = {
  CH4: ['Modelo bola-vareta: C no centro de um tetraedro.', 'Quatro orbitais sp³ equivalentes apontando para os vértices do tetraedro.', 'Cada C–H é uma ligação σ(sp³–1s), em laranja.'],
  etano: ['Dois carbonos sp³ (tetraédricos).', 'Orbitais sp³ dos dois carbonos: um par deles se sobrepõe frontalmente formando a C–C.', 'C–C: σ(sp³–sp³); C–H: σ(sp³–1s). A σ tem simetria cilíndrica: rotação relativamente livre.'],
  eteno: ['Esqueleto σ (laranja): σ(sp²–sp²) e σ(sp²–1s).', 'Cada C: três orbitais sp² no plano + um p perpendicular (violeta).', 'Os dois orbitais p são paralelos (perpendiculares ao plano da molécula).', 'Sobreposição lateral dos p: ligação π (magenta), acima e abaixo do plano. C=C = σ + π.'],
  etino: ['Esqueleto σ: σ(sp–sp) e σ(sp–1s), linear.', 'Cada C: dois sp (opostos) + dois p perpendiculares (violeta).', 'Dois pares de orbitais p paralelos, em planos perpendiculares.', 'Duas ligações π perpendiculares: C≡C = σ + 2π; a densidade π envolve o eixo como um cilindro.'],
  CH2O: ['Esqueleto σ do formaldeído.', 'C sp² (três híbridos no plano + p); O descrito como sp² (dois híbridos com pares isolados).', 'Orbitais p do C e do O paralelos.', 'π C=O: mais concentrada no O (mais eletronegativo) — C δ+.'],
};
const molOrb = (k, o = {}) => (host) => B.molOrbitals(host, k, Object.assign({ info: (i) => ORB_INFO[k][i] || '', dist: o.dist, side: o.side, steps: o.steps }, o));
const STEPS_SP3 = [['modelo', {}], ['orbitais sp³', { hybOrb: 'all' }], ['ligações σ', { sp: true }]];

const W = {
  hero(host) { A.hero(host); cleanups.push(() => host._stop && host._stop()); }, whyCarbon: A.whyCarbon, atomCard: A.atomCard, configTable: A.configTable, energyLadder: A.energyLadder, configBuilder: A.configBuilder,
  valQuiz: A.valQuiz, lewisSymbol: A.lewisSymbol, octetCounter: (host) => A.octetCounter(host), octetLimits: (host) => A.octetCounter(host, ['BF3', 'NO', 'CH3']), bondEnergy: A.bondEnergy, bondCompare: A.bondCompare,
  lewisSteps: A.lewisSteps, eCount: A.eCount, fcCalc: A.fcCalc, plausible: A.plausible, resForms: A.resForms, resAnim(host) { A.resAnim(host); cleanups.push(() => host._stop && host._stop()); }, domainQuiz: A.domainQuiz,
  bohrVsQuantum: B.bohrVsQuantum, ao1s: (host) => B.aoViewer(host, { keys: ['1s'], cut: false }), ao2p: (host) => B.aoViewer(host, { keys: ['2px', '2py', '2pz'], key: '2pz' }), radialPlot: B.radialPlot, s12Compare: B.s12Compare,
  moH2: B.moH2, moDiagram: B.moDiagram, overlapLab: B.overlapLab, sigmaPi3d: (host) => B.sigmaPi3d(host), piRotation: B.piRotation,
  hybEnergy3: (host) => B.hybEnergy(host, 'sp3'), hybEnergy2: (host) => B.hybEnergy(host, 'sp2'), hybEnergy1: (host) => B.hybEnergy(host, 'sp'),
  hybrid3: (host) => B.hybrid3d(host, 'sp3'), hybrid2: (host) => B.hybrid3d(host, 'sp2'), hybrid1: (host) => B.hybrid3d(host, 'sp'),
  orbCH4: molOrb('CH4', { steps: STEPS_SP3, dist: 5.5 }), orbEtano: molOrb('etano', { steps: STEPS_SP3 }), orbEteno: molOrb('eteno', { side: [7, 0.3, 0.3] }), orbEtino: molOrb('etino'), orbCH2O: molOrb('CH2O'),
  otherSpecies: B.otherSpecies, benzeneCloud: B.benzeneCloud, allylBridge: B.allylBridge, compare3: B.compare3, hybTable: B.hybTable, summaryCards: B.summaryCards, orbToMol: B.orbToMol,
  lab3d: T.lab3d, aoLab: (host) => B.aoViewer(host, { tall: true, key: 'sp3' }), orbCompare: T.orbCompare, lewisBuilder: T.lewisBuilder, resSim: T.resSim, vseprSim: T.vseprSim, hybSim: T.hybSim, molBuilder: T.molBuilder, spCounter: T.spCounter,
  geoMode: (host) => T.quickMode(host, 'geo'), hybMode: (host) => T.quickMode(host, 'hyb'), etenoPlane: (host) => B.molOrbitals(host, 'eteno', { steps: [['plano', { lp: false, angles: true }]], side: [7, 0.2, 0.2], info: () => 'Os seis átomos do eteno estão no mesmo plano: os carbonos sp² e a necessidade de orbitais p paralelos para a π. Use “Ver de lado”.' }),
  geo3(host) {
    const D = [['CH4', '109,5°', 'AX₄ · tetraédrica'], ['NH3', '≈ 107°', 'AX₃E · piramidal trigonal'], ['H2O', '≈ 104,5°', 'AX₂E₂ · angular'], ['CO2', '180°', 'AX₂ · linear'], ['BF3', '120°', 'AX₃ · trigonal planar'], ['SO2', '≈ 119°', 'AX₂E · angular']];
    const grid = h('div', { class: 'grid3' });
    host.append(grid, h('p', { class: 'hint3' }, 'Pares isolados em azul-claro. Cada par isolado ocupa mais espaço que um par ligante e comprime os ângulos: 109,5° → 107° → 104,5°.'));
    D.forEach(([k, ang, t]) => { const v = h('div', { class: 'viewer short' }); grid.append(h('div', { class: 'chcard center' }, h('h4', null, `${MOLS[k][1]} · ${ang}`), v, h('small', null, t))); molScene(v, L(k), { lp: true, angles: true, hint: false, dist: 5.5 }); });
  },
  levelChips(host) { [...new Set(SOLVED.map((s) => s.level))].forEach((l, i) => host.append(h('a', { class: 'chip', href: '#res-' + i }, `${i + 1}. ${l}`))); },
  solved(host) { let last = null, li = -1; SOLVED.forEach((d, i) => { if (d.level !== last) { last = d.level; li++; host.append(h('h3', { id: 'res-' + li }, `Nível ${li + 1} — ${d.level}`)); } host.append(solvedCard(d, `R${i + 1}`)); }); },
  propEasy(host) { renderProposed(host, PROPOSED.easy, 0); },
  propMid(host) { renderProposed(host, PROPOSED.mid, PROPOSED.easy.length); },
  propHard(host) { renderProposed(host, PROPOSED.hard, PROPOSED.easy.length + PROPOSED.mid.length); },
  quiz(host) { quiz(host, (sec, anchor) => go(sec, anchor)); },
  challenge(host) { const c = challenge(host); cleanups.push(() => c.stop()); },
  cmap(host) { conceptMap(host); },
};
function renderProposed(host, list, offset) {
  const done = store.get('fund-prop', {});
  list.forEach((d, i) => host.append(exerciseCard(d, `P${offset + i + 1}`, (num, ok) => { done[num] = ok; store.set('fund-prop', done); })));
}
function conceptMap(host) {
  const chain = [['elétrons', 'atomos'], ['configuração eletrônica', 'configuracao'], ['elétrons de valência', 'valencia'], ['ligações covalentes', 'covalente'], ['estruturas de Lewis', 'lewis'], ['ressonância', 'ressonancia'], ['VSEPR', 'vsepr'], ['geometria', 'geometria'], ['orbitais', 'orbitais'], ['σ e π', 'sigmapi'], ['hibridização', 'sp3'], ['estrutura 3D', 'comparacao'], ['reatividade orgânica', 'mapa']];
  host.append(h('div', { class: 'cmaphead' }, h('div', { class: 'card cm1' }, 'ESTRUTURA MOLECULAR')),
    h('ol', { class: 'cmchain' }, chain.map(([t, id], i) => h('li', null, h('a', { href: '#' + id, class: 'cmstep' }, h('b', null, String(i + 1)), ' ' + t)))));
}

/* ---------- navegação ---------- */
function initSection(sec) {
  sec.querySelectorAll('[data-fig]:not([data-done])').forEach((e) => { e.setAttribute('data-done', ''); const f = FIG[e.dataset.fig]; if (f) { try { f(e); } catch (err) { console.error('Figura', e.dataset.fig, err); } } });
  sec.querySelectorAll('[data-w]:not([data-done])').forEach((e) => {
    e.setAttribute('data-done', '');
    const f = W[e.dataset.w];
    if (!f) { console.error('Componente inexistente', e.dataset.w); return; }
    try { f(e); } catch (err) { console.error('Componente', e.dataset.w, err); e.insertAdjacentHTML('beforeend', '<p class="hint">Não foi possível carregar este componente.</p>'); }
  });
  quickTests(sec);
}
function teardown(sec) {
  cleanups.splice(0).forEach((f) => { try { f(); } catch (e) { /* ok */ } });
  [...VIEWERS].forEach((v) => v.dispose());
  if (!sec) return;
  sec.querySelectorAll('[data-w][data-3d]').forEach((e) => { e.innerHTML = ''; e.removeAttribute('data-done'); });
}
function go(id, anchor) {
  let sec = document.getElementById(id);
  if (!sec || !sec.classList.contains('section')) { const inner = document.getElementById(id); sec = inner ? inner.closest('.section') : SECTIONS[0]; anchor = inner && inner !== sec ? id : anchor; }
  if (!sec) sec = SECTIONS[0];
  if (sec !== current) {
    if (current) teardown(current);
    current = sec;
    SECTIONS.forEach((s) => s.classList.toggle('active', s === sec));
    NAV.forEach((a) => { if (a.getAttribute('href') === '#' + sec.id) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    initSection(sec);
    const visited = store.get('fund-visited', []);
    if (!visited.includes(sec.id)) { visited.push(sec.id); store.set('fund-visited', visited); }
    markVisited(); buildPager();
    document.title = (sec.dataset.title || '') + ' · Fundamentos da Química Orgânica';
    const cur = NAV.find((a) => a.getAttribute('aria-current'));
    if (cur) cur.scrollIntoView({ block: 'nearest', inline: 'center' });
  }
  if (anchor) { const t = document.getElementById(anchor); if (t) setTimeout(() => t.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60); }
  else { window.scrollTo(0, 0); setTimeout(() => window.scrollTo(0, 0), 0); }
}
function markVisited() {
  const visited = store.get('fund-visited', []);
  NAV.forEach((a) => a.classList.toggle('done', visited.includes(a.getAttribute('href').slice(1)) && !a.getAttribute('aria-current')));
  document.getElementById('progress').style.width = (100 * visited.length / SECTIONS.length) + '%';
}
function buildPager() {
  const i = SECTIONS.indexOf(current);
  pager.innerHTML = '';
  if (i > 0) pager.append(h('a', { class: 'btn', href: '#' + SECTIONS[i - 1].id }, '← ' + SECTIONS[i - 1].dataset.title));
  if (i < SECTIONS.length - 1) pager.append(h('a', { class: 'btn primary', href: '#' + SECTIONS[i + 1].id, style: 'margin-left:auto' }, SECTIONS[i + 1].dataset.title + ' →'));
}
const qsel = document.getElementById('quality');
qsel.value = String(store.get('fund-q', 40));
qsel.addEventListener('change', () => { B.setQuality(+qsel.value); store.set('fund-q', +qsel.value); const s = current; current = null; teardown(s); go(s.id); });
window.addEventListener('hashchange', () => go(location.hash.slice(1) || 'inicio'));
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-action]');
  if (!b) return;
  if (b.dataset.action === 'redo') {
    try { localStorage.removeItem('fund-prop'); } catch (err) { /* nada */ }
    const sec = document.getElementById('propostos');
    sec.querySelectorAll('[data-w]:not([data-3d])').forEach((x) => { x.innerHTML = ''; x.removeAttribute('data-done'); });
    initSection(sec);
  }
});
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
go(location.hash.slice(1) || 'inicio');
window.addEventListener('load', () => { const t = document.getElementById(location.hash.slice(1)); if (!t || t.classList.contains('section')) setTimeout(() => window.scrollTo(0, 0), 30); });
