/*
 * main.js — navegação entre módulos, inicialização sob demanda dos componentes.
 */
import { VIEWERS } from './viewer3d.js';
import { h, quickTests } from './widgets2d.js';
import * as M from './mods.js';
import * as T from './tools.js';
import { SOLVED, PROPOSED } from './exdata.js';
import { exerciseCard, solvedCard } from './practice.js';
import { quiz, challenge } from './quiz.js';
import { ringFig } from './ui.js';

const SECTIONS = [...document.querySelectorAll('.section')];
const NAV = [...document.querySelectorAll('.mainnav a')];
const pager = document.getElementById('pager');
let current = null;
const cleanups = [];
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sem armazenamento */ } },
};
const stoppable = (f) => (host) => { f(host); cleanups.push(() => host._stop && host._stop()); };

const FIG = { ring(host) { host.dataset.k.split(' ').forEach((k) => host.append(ringFig(k, { badge: host.hasAttribute('data-badge'), mode: host.dataset.mode }))); } };

const W = {
  hero: stoppable(M.hero), centralQ: M.centralQ, benzStructure: M.benzStructure, bondLengths: M.bondLengths, kekule: stoppable(M.kekule),
  pOrbitals: M.pOrbitals, cloud: M.cloud, moBenzene: (host) => M.moDiagram(host, 'benzeno'), moCbd: (host) => M.moDiagram(host, 'ciclobutadieno'), frost: (host) => M.frost(host), frost4: (host) => M.frost(host, { n: 4, e: 4 }),
  hydro: M.hydro, thermo: M.thermo, threeEthenes: M.threeEthenes, alkeneVsBenzene: M.alkeneVsBenzene,
  breakArom: M.breakArom, subVsAdd: M.subVsAdd, subAddEnergy: M.subAddEnergy,
  criteria: M.criteria, openVsRing: M.openVsRing, planarity: M.planarity, conjCheck: M.conjCheck, huckelSeq: M.huckelSeq,
  classes: M.classes, cot: M.cot, sameE: M.sameE,
  ions: (host) => M.gallery(host, ['ciclopropenilio', 'cp', 'tropilio', 'cpPlus', 'cpH', 'cpRad'], { formula: true }),
  hetero: (host) => M.gallery(host, ['piridina', 'pirrol', 'furano', 'tiofeno', 'pirimidina', 'imidazol'], { p: false }),
  fused: (host) => M.gallery(host, ['naftaleno', 'antraceno', 'fenantreno'], { notes: false }),
  pyrVsPyrrole: M.pyrVsPyrrole, furanPairs: M.furanPairs, espCompare: M.espCompare, whichPair: M.whichPair,
  seaSteps: stoppable(M.seaSteps), areniumForms: M.areniumForms, arenium3d: M.arenium3d, seaProfile: M.seaProfile, restore: M.restore, seaTypes: M.seaTypes,
  lab3d: T.lab3d, builder: T.builder, huckelSolver: T.huckelSolver, pPicker: T.pPicker,
  levelChips(host) { [...new Set(SOLVED.map((s) => s.level))].forEach((l, i) => host.append(h('a', { class: 'chip', href: '#res-' + i }, `${i + 1}. ${l}`))); },
  solved(host) { let last = null, li = -1; SOLVED.forEach((d, i) => { if (d.level !== last) { last = d.level; li++; host.append(h('h3', { id: 'res-' + li }, `Nível ${li + 1} — ${d.level}`)); } host.append(solvedCard(d, `R${i + 1}`)); }); },
  propEasy(host) { renderProposed(host, PROPOSED.easy, 0); },
  propMid(host) { renderProposed(host, PROPOSED.mid, PROPOSED.easy.length); },
  propHard(host) { renderProposed(host, PROPOSED.hard, PROPOSED.easy.length + PROPOSED.mid.length); },
  quiz(host) { quiz(host, (sec, anchor) => go(sec, anchor)); },
  challenge(host) { const c = challenge(host); cleanups.push(() => c.stop()); },
  cmap: conceptMap, summary: summaryPanel, finalCompare,
};
function renderProposed(host, list, offset) {
  const done = store.get('aro-prop', {});
  list.forEach((d, i) => host.append(exerciseCard(d, `P${offset + i + 1}`, (num, ok) => { done[num] = ok; store.set('aro-prop', done); })));
}

/* ---------- mapa conceitual, resumo e comparação final ---------- */
function conceptMap(host) {
  const node = (t, id, cls = '') => h('a', { class: 'cmnode ' + cls, href: '#' + id }, t);
  const branch = (title, items) => h('div', { class: 'cmbranch' }, h('div', { class: 'cmbt' }, title), h('div', { class: 'cmitems' }, items.map(([t, id, c]) => node(t, id, c))));
  host.append(
    h('div', { class: 'cmaphead' }, h('div', { class: 'card cm1' }, 'AROMATICIDADE'), h('span', { class: 'cmdown' }, '↓'), h('div', { class: 'card cm2' }, 'sistema π cíclico, planar e contínuo')),
    h('div', { class: 'cmgrid' },
      branch('Estrutura', [['cíclico', 'criterios'], ['planar', 'criterios'], ['conjugado (p em todos)', 'orbitais']]),
      branch('Elétrons', [['4n + 2 elétrons π', 'huckel'], ['regra de Hückel', 'huckel'], ['círculo de Frost', 'huckel']]),
      branch('Consequência', [['deslocalização', 'deslocalizacao'], ['estabilização aromática ≈ 150 kJ/mol', 'estabilidade'], ['calor de hidrogenação menor', 'hidrogenacao']]),
      branch('Reatividade', [['adição desfavorecida', 'adicao'], ['substituição favorecida', 'substituicao'], ['SEA: complexo σ → perda de H⁺', 'sea'], ['aromaticidade restaurada', 'restauracao']]),
      branch('Exemplos', [['benzeno', 'estrutura', 'arom'], ['íons: C₃H₃⁺, C₅H₅⁻, C₇H₇⁺', 'ions', 'arom'], ['piridina, pirrol, furano, tiofeno', 'hetero', 'arom'], ['naftaleno, antraceno, fenantreno', 'policiclicos', 'arom'], ['ciclobutadieno (anti)', 'classes', 'anti'], ['COT (não aromático)', 'classes', 'non']])));
}
function summaryPanel(host) {
  const C = [['arom', 'Aromático', ['cíclico', 'planar', 'totalmente conjugado', '4n + 2 elétrons π', 'estabilizado'], 'benzeno', 'benzeno, C₅H₅⁻, C₇H₇⁺, piridina, pirrol, naftaleno'],
    ['anti', 'Antiaromático', ['cíclico', 'planar', 'totalmente conjugado', '4n elétrons π', 'desestabilizado'], 'ciclobutadieno', 'ciclobutadieno, C₅H₅⁺'],
    ['non', 'Não aromático', ['falha em ciclo, planaridade ou conjugação', 'Hückel não se aplica', 'comporta-se como polieno'], 'cot', 'COT, ciclopentadieno, cicloeptatrieno']];
  host.append(h('div', { class: 'grid3' }, C.map(([k, t, l, ex, more]) => h('div', { class: 'clscard ' + k }, h('h4', null, t), h('ul', null, l.map((x) => h('li', null, x))), ringFig(ex, { scale: 28, fs: 13 }), h('small', null, more)))));
}
function finalCompare(host) {
  const rows = [['Elétrons π', 'localizados (2 C)', 'deslocalizados (6 C, ciclo)'], ['Estabilidade especial', 'não', 'estabilização aromática (≈ 150 kJ/mol)'], ['Reação típica com eletrófilos', 'adição', 'substituição eletrofílica aromática'], ['Produto', 'saturado (C sp³)', 'aromático (anel preservado)'], ['Br₂ sem catalisador', 'reage (descora)', 'não reage'], ['Catalisador necessário', 'não', 'sim (FeBr₃, AlCl₃, H₂SO₄…)'], ['Por quê?', 'nada a perder: π isolada é trocada por 2 σ', 'adição destruiria a aromaticidade; substituição a restaura']];
  host.append(h('div', { class: 'table-wrap' }, h('table', { class: 'cmp' }, h('thead', null, h('tr', null, h('th', null, ''), h('th', null, 'Alceno (cicloexeno)'), h('th', null, 'Benzeno'))), h('tbody', null, rows.map(([a, b, c]) => h('tr', null, h('th', null, a), h('td', null, b), h('td', null, c)))))),
    h('div', { class: 'centralphrase' }, 'A substituição preserva a aromaticidade global; a adição a destrói no produto final.'));
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
    const visited = store.get('aro-visited', []);
    if (!visited.includes(sec.id)) { visited.push(sec.id); store.set('aro-visited', visited); }
    markVisited(); buildPager();
    document.title = (sec.dataset.title || '') + ' · Compostos Aromáticos e Aromaticidade';
    const cur = NAV.find((a) => a.getAttribute('aria-current'));
    if (cur) cur.scrollIntoView({ block: 'nearest', inline: 'center' });
  }
  if (anchor) { const t = document.getElementById(anchor); if (t) setTimeout(() => t.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60); }
  else { window.scrollTo(0, 0); setTimeout(() => window.scrollTo(0, 0), 0); }
}
function markVisited() {
  const visited = store.get('aro-visited', []);
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
    try { localStorage.removeItem('aro-prop'); } catch (err) { /* nada */ }
    const sec = document.getElementById('propostos');
    sec.querySelectorAll('[data-w]:not([data-3d])').forEach((x) => { x.innerHTML = ''; x.removeAttribute('data-done'); });
    initSection(sec);
  }
});
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
go(location.hash.slice(1) || 'inicio');
window.addEventListener('load', () => { const t = document.getElementById(location.hash.slice(1)); if (!t || t.classList.contains('section')) setTimeout(() => window.scrollTo(0, 0), 30); });
