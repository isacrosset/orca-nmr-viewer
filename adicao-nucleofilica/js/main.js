/*
 * main.js — navegação entre módulos e inicialização sob demanda dos componentes.
 */
import { VIEWERS } from './viewer3d.js';
import { h, quickTests } from './widgets2d.js';
import * as A from './mods1.js';
import * as B from './mods2.js';
import * as T from './tools.js';
import { SOLVED, PROPOSED } from './exdata.js';
import { exerciseCard, solvedCard } from './practice.js';
import { quiz, challenge } from './quiz.js';

// append/replaceChildren ignoram filhos nulos (componentes opcionais)
['append', 'replaceChildren', 'prepend'].forEach((m) => { const f = Element.prototype[m]; Element.prototype[m] = function (...k) { return f.apply(this, k.filter((x) => x !== null && x !== undefined && x !== false)); }; });
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
const S = stoppable;

const W = {
  hero: A.hero, pathsABC: A.pathsABC, espPair: A.espPair, geoTet: A.geoTet, baseMech: S(A.baseMech), acidMech: S(A.acidMech),
  dGK: A.dGK, catVsEq: A.catVsEq, leChat: A.leChat, acidBaseCompare: A.acidBaseCompare, phWindow: (host) => A.phWindow(host),
  hydMech: S(A.hydMech), gemdiol3d: A.gemdiol3d, hydBars: A.hydBars, alcoholOverview: A.alcoholOverview, hemiMech: S(A.hemiMech), terminology: A.terminology,
  compareRow: A.compareRow, classifyQuiz: A.classifyQuiz, acetalCompare3d: A.acetalCompare3d, acetalMech: S(A.acetalMech), hydrolysisMech: S(A.hydrolysisMech), protStab: A.protStab,
  intraSim: A.intraSim, ringSize: A.ringSize, cyclicHemi: A.cyclicHemi, glucoseOpen: A.glucoseOpen, glucose3d: A.glucose3d, glucoseEq: A.glucoseEq, anomerQuiz: A.anomerQuiz,
  sucrose3d: A.sucrose3d, sucrose2d: A.sucrose2d, sugarCompare: A.sugarCompare,
  protectFlow: B.protectFlow, diolCompare: B.diolCompare, compatPanel: B.compatPanel, thioMech: S(B.thioMech), mozingo: B.mozingo, amineSplit: B.amineSplit,
  imineMech: S(B.imineMech), carbinolCompare: B.carbinolCompare, enamineMech: S(B.enamineMech), nTable: B.nTable, enamineRegio: B.enamineRegio,
  oximeMech: S(B.oximeMech), oximeFigs: B.oximeFigs, hydrazoneMech: S(B.hydrazoneMech), hydrazoneFigs: B.hydrazoneFigs,
  cyanoMech: S(B.cyanoMech), cyanoFaces: B.cyanoFaces, cyanoEq: B.cyanoEq, ccOverview: B.ccOverview, wittigOverview: B.wittigOverview, ylideMech: S(B.ylideMech), ylide3d: B.ylide3d,
  wittigMech: S(B.wittigMech), hweMech: S(B.hweMech), ezCompare: B.ezCompare, wittigHweTable: B.wittigHweTable, wittigOrHwe: B.wittigOrHwe, wittigRetro: B.wittigRetro,
  reactionMap: B.reactionMap, typesCompare: B.typesCompare, masterTable: B.masterTable, condPanel: B.condPanel,
  lab3d: T.lab3d, beforeAfter: T.beforeAfter, eqSim: T.eqSim, revSim: T.revSim, mechSim: T.mechSim, protTrainer: T.protTrainer, protectSim: T.protectSim,
  chooseNu: (host) => T.chooseNu(host, (id) => go(id)), synthProblems: T.synthProblems,
  levelChips(host) { [...new Set(SOLVED.map((s) => s.level))].forEach((l, i) => host.append(h('a', { class: 'chip', href: '#res-' + i }, `${i + 1}. ${l}`))); },
  solved(host) { let last = null, li = -1; SOLVED.forEach((d, i) => { if (d.level !== last) { last = d.level; li++; host.append(h('h3', { id: 'res-' + li }, `Nível ${li + 1} — ${d.level}`)); } host.append(solvedCard(d, `R${i + 1}`)); }); },
  propEasy(host) { renderProposed(host, PROPOSED.easy, 0); },
  propMid(host) { renderProposed(host, PROPOSED.mid, PROPOSED.easy.length); },
  propHard(host) { renderProposed(host, PROPOSED.hard, PROPOSED.easy.length + PROPOSED.mid.length); },
  quiz(host) { quiz(host, (sec, anchor) => go(sec, anchor)); },
  challenge(host) { const c = challenge(host); cleanups.push(() => c.stop()); },
  cmap: conceptMap,
};
function renderProposed(host, list, offset) {
  const done = store.get('adnu-prop', {});
  list.forEach((d, i) => host.append(exerciseCard(d, `P${offset + i + 1}`, (num, ok) => { done[num] = ok; store.set('adnu-prop', done); })));
}
function conceptMap(host) {
  const node = (t, id) => h('a', { class: 'cmnode', href: '#' + id }, t);
  const branch = (title, items) => h('div', { class: 'cmbranch' }, h('div', { class: 'cmbt' }, title), h('div', { class: 'cmitems' }, items.map(([t, id]) => node(t, id))));
  host.append(
    h('div', { class: 'cmaphead' }, h('div', { class: 'card cm1' }, 'ADIÇÃO NUCLEOFÍLICA À CARBONILA')),
    h('div', { class: 'cmgrid' },
      branch('O nucleófilo é O?', [['H₂O → gem-diol', 'hidratacao'], ['ROH → hemiacetal', 'hemiacetais'], ['ROH/H⁺ → acetal', 'mec-acetal'], ['hidrólise', 'hidrolise']]),
      branch('O nucleófilo é N?', [['RNH₂ → imina', 'iminas'], ['R₂NH → enamina', 'enaminas'], ['NH₂OH → oxima', 'oximas'], ['NH₂NH₂ → hidrazona', 'hidrazonas']]),
      branch('O nucleófilo é C?', [['CN⁻ → cianoidrina', 'cianoidrinas'], ['ilídeo → Wittig', 'wittig'], ['fosfonato → HWE', 'hwe'], ['nova C–C', 'cc']]),
      branch('Intramolecular', [['hemiacetais cíclicos', 'ciclicos'], ['glicose', 'glicose'], ['carbono anomérico', 'glicose'], ['sacarose', 'sacarose']]),
      branch('Estratégia sintética', [['proteção', 'protecao'], ['desproteção', 'protecao'], ['tioacetais', 'tioacetais'], ['síntese', 'simsintese']]),
      branch('Controle', [['reversibilidade', 'reversibilidade'], ['catálise ácida/básica', 'catalise'], ['Le Châtelier', 'simequilibrio'], ['pH ideal', 'iminas']])));
}

/* ---------- navegação ---------- */
function initSection(sec) {
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
    const visited = store.get('adnu-visited', []);
    if (!visited.includes(sec.id)) { visited.push(sec.id); store.set('adnu-visited', visited); }
    markVisited(); buildPager();
    document.title = (sec.dataset.title || '') + ' · Adição Nucleofílica à Carbonila';
    const cur = NAV.find((a) => a.getAttribute('aria-current'));
    if (cur) cur.scrollIntoView({ block: 'nearest', inline: 'center' });
  }
  if (anchor) { const t = document.getElementById(anchor); if (t) setTimeout(() => t.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60); }
  else { window.scrollTo(0, 0); setTimeout(() => window.scrollTo(0, 0), 0); }
}
function markVisited() {
  const visited = store.get('adnu-visited', []);
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
    try { localStorage.removeItem('adnu-prop'); } catch (err) { /* nada */ }
    const sec = document.getElementById('propostos');
    sec.querySelectorAll('[data-w]:not([data-3d])').forEach((x) => { x.innerHTML = ''; x.removeAttribute('data-done'); });
    initSection(sec);
  }
});
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
go(location.hash.slice(1) || 'inicio');
window.addEventListener('load', () => { const t = document.getElementById(location.hash.slice(1)); if (!t || t.classList.contains('section')) setTimeout(() => window.scrollTo(0, 0), 30); });
