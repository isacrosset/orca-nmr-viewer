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
const sp = (k, cap) => (host) => B.species(host, k, cap);

const W = {
  hero: stoppable(A.hero), chain: A.chain, familyTree: A.familyTree, hasCO: A.hasCO, aldKetExamples: A.aldKetExamples, aldOrKet: A.aldOrKet,
  structure: A.structure, geometry: A.geometry, polarization: A.polarization, resonance: A.resonance, piPistar: A.piPistar, bdSim: A.bdSim,
  boiling: A.boiling, waterHB: A.waterHB, reactivity: A.reactivity, addMech: stoppable(A.addMech), tetraSlider: A.tetraSlider, faces: A.faces,
  reductionIntro: B.reductionIntro, productQuiz: B.productQuiz, spBH4: sp('BH4', 'BH₄⁻ (tetraédrico): o B–H transfere o hidreto equivalente.'), spAlH4: sp('AlH4', 'AlH₄⁻: Al–H mais polarizada que B–H → mais reativo.'), spDIBAL: sp('DIBAL', 'DIBAL-H: Al ácido de Lewis com um único H transferível.'),
  spO3: sp('O3', 'Ozônio (O₃): molécula angular.'), spCromato: sp('H2CrO4', 'Ácido crômico, H₂CrO₄: Cr(VI) tetraédrico.'), spHidrato: sp('hidrato', 'Hidrato de aldeído, R–CH(OH)₂.'), spEster: sp('cromato', 'Éster de cromato (simplificado): O–Cr(VI).'),
  mechNaBH4: stoppable(B.mechNaBH4), mechLiAlH4: stoppable(B.mechLiAlH4), energyHydride: B.energyHydride, redTable: B.redTable, redChoice: B.redChoice,
  mechDIBAL: stoppable(B.mechDIBAL), dibalScheme: B.dibalScheme, oxLadder: B.oxLadder, oxCalc: B.oxCalc, oxAlcohols: B.oxAlcohols, pccJones: B.pccJones, hydrate: B.hydrate,
  mechCr: stoppable(B.mechCr), oxSlider: B.oxSlider, aldehydeOx: B.aldehydeOx, ozoCut: B.ozoCut, ozoReverse: B.ozoReverse, ozoMech: stoppable(B.ozoMech),
  netMap: B.netMap, reagentCompare: B.reagentCompare, masterRed: B.masterRed, masterOx: B.masterOx,
  lab3d: T.lab3d, redSim: T.redSim, oxSim: T.oxSim, mechSim: T.mechSim,
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
  const done = store.get('carb-prop', {});
  list.forEach((d, i) => host.append(exerciseCard(d, `P${offset + i + 1}`, (num, ok) => { done[num] = ok; store.set('carb-prop', done); })));
}
function conceptMap(host) {
  const node = (t, id) => h('a', { class: 'cmnode', href: '#' + id }, t);
  const branch = (title, items) => h('div', { class: 'cmbranch' }, h('div', { class: 'cmbt' }, title), h('div', { class: 'cmitems' }, items.map(([t, id]) => node(t, id))));
  host.append(
    h('div', { class: 'cmaphead' }, h('div', { class: 'card cm1' }, 'COMPOSTOS CARBONÍLICOS')),
    h('div', { class: 'cmgrid' },
      branch('Estrutura', [['C=O', 'estrutura'], ['sp² · trigonal', 'geometria'], ['polarização δ+/δ−', 'polarizacao'], ['ressonância', 'ressonancia'], ['π e π*', 'orbitais'], ['Bürgi–Dunitz', 'burgi']]),
      branch('Aldeídos e cetonas', [['aldeídos (R–CHO)', 'aldcet'], ['cetonas (R–CO–R′)', 'aldcet'], ['propriedades físicas', 'propriedades'], ['reatividade', 'reatividade']]),
      branch('Redução', [['NaBH₄', 'nabh4'], ['LiAlH₄', 'lialh4'], ['DIBAL-H', 'dibal'], ['aldeído → álcool 1°', 'reducao'], ['cetona → álcool 2°', 'reducao']]),
      branch('Oxidação', [['nº de oxidação', 'oxestados'], ['PCC', 'pcc'], ['Jones', 'jones'], ['KMnO₄', 'kmno4'], ['aldeído → ácido', 'oxaldeidos']]),
      branch('Formação de carbonilas', [['oxidação de álcoois', 'oxalcoois'], ['ozonólise', 'ozonolise'], ['DIBAL-H (ésteres, nitrilas)', 'dibal'], ['mapa de interconversões', 'mapa-inter']]),
      branch('Mecanismo', [['adição nucleofílica', 'adicao'], ['hidreto equivalente', 'hidreto'], ['alcóxido tetraédrico', 'adicao'], ['protonação', 'hidreto'], ['éster de cromato', 'cromo'], ['eliminação C–H/O–Cr', 'cromo']])));
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
    const visited = store.get('carb-visited', []);
    if (!visited.includes(sec.id)) { visited.push(sec.id); store.set('carb-visited', visited); }
    markVisited(); buildPager();
    document.title = (sec.dataset.title || '') + ' · Compostos Carbonílicos';
    const cur = NAV.find((a) => a.getAttribute('aria-current'));
    if (cur) cur.scrollIntoView({ block: 'nearest', inline: 'center' });
  }
  if (anchor) { const t = document.getElementById(anchor); if (t) setTimeout(() => t.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60); }
  else { window.scrollTo(0, 0); setTimeout(() => window.scrollTo(0, 0), 0); }
}
function markVisited() {
  const visited = store.get('carb-visited', []);
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
    try { localStorage.removeItem('carb-prop'); } catch (err) { /* nada */ }
    const sec = document.getElementById('propostos');
    sec.querySelectorAll('[data-w]:not([data-3d])').forEach((x) => { x.innerHTML = ''; x.removeAttribute('data-done'); });
    initSection(sec);
  }
});
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
go(location.hash.slice(1) || 'inicio');
window.addEventListener('load', () => { const t = document.getElementById(location.hash.slice(1)); if (!t || t.classList.contains('section')) setTimeout(() => window.scrollTo(0, 0), 30); });
