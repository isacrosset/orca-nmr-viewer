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
  hero: S(A.hero), heroFlow: S(A.heroFlow), acidIntro: A.acidIntro, bondLengths: A.bondLengths, carboxylateRes: A.carboxylateRes, acidity: A.acidity, inductive: A.inductive,
  bpChart: A.bpChart, dimer3d: A.dimer3d, derivCards: A.derivCards, ladder: A.ladder, twoFactors: A.twoFactors, resCompare: A.resCompare, lgCompare: A.lgCompare,
  nasMech: S(A.nasMech), vsAldehyde: A.vsAldehyde, tetraSim: S(A.tetraSim), conversions: A.conversions, stairs: A.stairs,
  acylChloride: A.acylChloride, socl2Mech: S(A.socl2Mech), socl2Species: A.socl2Species, oxalyl: A.oxalyl, pclx: A.pclx, clReagents: A.clReagents, chlorideMap: A.chlorideMap, chlorideEster: S(A.chlorideEster),
  anhydrideStruct: A.anhydrideStruct, anhydrideSynth: S(A.anhydrideSynth), anhydrideRx: A.anhydrideRx, anhydrideMech: S(A.anhydrideMech),
  esterStruct: A.esterStruct, fischerMech: S(A.fischerMech), fischerSim: A.fischerSim, esterRoutes: A.esterRoutes, acidHydMech: S(A.acidHydMech), sideBySide: A.sideBySide, saponMech: S(A.saponMech), saponTable: A.saponTable,
  lactoneIntro: A.lactoneIntro, lactoneMech: S(A.lactoneMech), lactoneRing: A.lactoneRing, lactone3d: A.lactone3d,
  amideTypes: B.amideTypes, amideRes: B.amideRes, amideWhy: B.amideWhy, amideFromCl: S(B.amideFromCl), amideFromAnh: S(B.amideFromAnh), aminolysis: S(B.aminolysis), acidAmine: S(B.acidAmine), dccMech: S(B.dccMech), amideRoutes: B.amideRoutes,
  amideHyd: S(B.amideHyd), amideVsEster: B.amideVsEster, lactamIntro: B.lactamIntro, lactamForm: B.lactamForm, lactam3d: B.lactam3d,
  nitrile3d: B.nitrile3d, nitrileSynth: B.nitrileSynth, dehydMech: S(B.dehydMech), geomChange: B.geomChange, nitAcid: S(B.nitAcid), nitBase: S(B.nitBase),
  decarbMech: S(B.decarbMech), decarbTS: B.decarbTS, malonic: B.malonic, decarbQuiz: B.decarbQuiz, interMap: B.interMap, masterDeriv: B.masterDeriv, masterInter: B.masterInter,
  lab3d: T.lab3d, compare3: T.compare3, reactSim: T.reactSim, happens: T.happens, ladderDnD: T.ladderDnD, whoLeaves: T.whoLeaves, protonActivation: T.protonActivation, mechSim: T.mechSim, synthSim: T.synthSim, multiStep: T.multiStep,
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
  const done = store.get('acid-prop', {});
  list.forEach((d, i) => host.append(exerciseCard(d, `P${offset + i + 1}`, (num, ok) => { done[num] = ok; store.set('acid-prop', done); })));
}
function conceptMap(host) {
  const node = (t, id) => h('a', { class: 'cmnode', href: '#' + id }, t);
  const branch = (title, items) => h('div', { class: 'cmbranch' }, h('div', { class: 'cmbt' }, title), h('div', { class: 'cmitems' }, items.map(([t, id]) => node(t, id))));
  host.append(
    h('div', { class: 'cmaphead' }, h('div', { class: 'card cm1' }, 'ÁCIDOS CARBOXÍLICOS E DERIVADOS')),
    h('div', { class: 'cmgrid' },
      branch('Estrutura', [['carboxila', 'acidos'], ['ressonância', 'estrutura'], ['acidez', 'acidez'], ['propriedades', 'propriedades']]),
      branch('Derivados', [['cloreto de acila', 'cloretos'], ['anidrido', 'anidridos'], ['éster', 'esteres'], ['amida', 'amidas']]),
      branch('Mecanismo comum', [['ataque', 'snac'], ['tetraédrico', 'tetraedrico'], ['eliminação', 'snac'], ['escada de reatividade', 'reatividade']]),
      branch('Derivados cíclicos', [['lactonas', 'lactonas'], ['lactamas', 'lactamas']]),
      branch('Nitrilas', [['formação (desidratação)', 'desidratacao'], ['hidrólise ácida', 'nitrila-acida'], ['hidrólise básica', 'nitrila-basica']]),
      branch('Reações especiais', [['Fischer', 'fischer'], ['saponificação', 'saponificacao'], ['descarboxilação', 'descarboxilacao'], ['SOCl₂', 'socl2']]),
      branch('Síntese', [['interconversões', 'mapa-inter'], ['ativação', 'amida-acido'], ['planejamento', 'simsintese']])));
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
    const visited = store.get('acid-visited', []);
    if (!visited.includes(sec.id)) { visited.push(sec.id); store.set('acid-visited', visited); }
    markVisited(); buildPager();
    document.title = (sec.dataset.title || '') + ' · Ácidos Carboxílicos e Derivados';
    const cur = NAV.find((a) => a.getAttribute('aria-current'));
    if (cur) cur.scrollIntoView({ block: 'nearest', inline: 'center' });
  }
  if (anchor) { const t = document.getElementById(anchor); if (t) setTimeout(() => t.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60); }
  else { window.scrollTo(0, 0); setTimeout(() => window.scrollTo(0, 0), 0); }
}
function markVisited() {
  const visited = store.get('acid-visited', []);
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
    try { localStorage.removeItem('acid-prop'); } catch (err) { /* nada */ }
    const sec = document.getElementById('propostos');
    sec.querySelectorAll('[data-w]:not([data-3d])').forEach((x) => { x.innerHTML = ''; x.removeAttribute('data-done'); });
    initSection(sec);
  }
});
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
go(location.hash.slice(1) || 'inicio');
window.addEventListener('load', () => { const t = document.getElementById(location.hash.slice(1)); if (!t || t.classList.contains('section')) setTimeout(() => window.scrollTo(0, 0), 30); });
