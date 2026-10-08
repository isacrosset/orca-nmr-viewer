/*
 * main.js — navegação entre módulos, inicialização sob demanda e guia rápido.
 */
import { VIEWERS } from './viewer3d.js';
import { h, quickTests } from './widgets2d.js';
import * as Mo from './modules.js';
import * as To from './tools.js';
import { SOLVED, PROPOSED } from './exdata.js';
import { exerciseCard, solvedCard } from './practice.js';
import { quiz, challenge } from './quiz.js';
import { M, fig, nameHTML } from './core.js';

const SECTIONS = [...document.querySelectorAll('.section')];
const NAV = [...document.querySelectorAll('.mainnav a')];
const pager = document.getElementById('pager');
let current = null;
const cleanups = [];
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sem armazenamento */ } },
};

const FIG = {
  mol(host) { (host.dataset.s || '').split(' ').forEach((s) => host.append(fig(M(s), true, { color: host.dataset.c || 'roles', num: host.dataset.n !== '0', scale: +(host.dataset.scale || 38) }))); },
};

const W = {
  hero: Mo.hero, reps: Mo.reps, countC: Mo.countC, clickC: Mo.clickC, implicitH: Mo.implicitH, chainClass: Mo.chainClass, repLab: Mo.repLab,
  fnMap: Mo.fnMap, patternMatch: Mo.patternMatch, clickFG: Mo.clickFG, multiFG: Mo.multiFG, rapidFn: Mo.rapidFn, realFind: Mo.realFind,
  compareFn(host) { Mo.compareFn(host, host.dataset.k); },
  anatomy: Mo.anatomy, prefixTable: Mo.prefixTable, partsQuiz: Mo.partsQuiz, chainSim: Mo.chainSim, numberAnim: Mo.numberAnim, directionEx: Mo.directionEx,
  alkylCards: Mo.alkylCards, alphaOrder: Mo.alphaOrder, fixName: Mo.fixName, gallery: Mo.gallery, straighten: Mo.straighten, ringVsChain: Mo.ringVsChain, omp: Mo.omp,
  aldKet: Mo.aldKet, esterSim: Mo.esterSim, amineClass: Mo.amineClass, amine3d: Mo.amine3d, multiGuide: Mo.multiGuide, prioTable: Mo.prioTable, prioOrder: Mo.prioOrder,
  builder(host) { To.builder(host); }, builderFree(host) { To.builder(host, { free: true }); }, nameToStructMC: To.nameToStructMC, structToName: To.structToName,
  lab3d: To.lab3d, threeToTwo: To.threeToTwo, twoToThree: To.twoToThree, nameSim: To.nameSim, summaryTable: To.summaryTable, guideList: To.guideList,
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
  const done = store.get('nom-prop', {});
  list.forEach((d, i) => host.append(exerciseCard(d, `P${offset + i + 1}`, (num, ok) => { done[num] = ok; store.set('nom-prop', done); })));
}
function conceptMap(host) {
  const node = (t, href) => h('a', { class: 'card', href, style: 'text-decoration:none;color:var(--text);text-align:left;font-size:.9rem;padding:8px 10px' }, t);
  const branch = (title, color, items) => h('div', { style: 'display:grid;gap:6px;align-content:start' }, h('div', { class: 'card', style: `font-weight:900;color:var(--${color});border-color:var(--${color})` }, title), ...items.map(([t, href]) => node(t, href)));
  host.append(
    h('div', { class: 'cmaphead' }, h('div', { class: 'card cm1' }, 'COMPOSTOS ORGÂNICOS')),
    h('div', { class: 'grid4' },
      branch('Hidrocarbonetos', 'cyan', [['alcanos', '#alcanos'], ['alcenos', '#alcenos'], ['alcinos', '#alcinos'], ['cicloalcanos', '#ciclicos'], ['aromáticos', '#aromaticos']]),
      branch('Oxigenadas', 'magenta', [['álcoois', '#alcoois'], ['fenóis', '#fenois'], ['éteres', '#eteres'], ['aldeídos', '#aldeidos'], ['cetonas', '#cetonas'], ['ácidos carboxílicos', '#acidos'], ['ésteres', '#esteres']]),
      branch('Nitrogenadas', 'green', [['aminas', '#aminas'], ['amidas', '#amidas'], ['nitrilas', '#nitrilas'], ['nitrocompostos', '#nitro']]),
      branch('Halogenadas', 'orange', [['haletos orgânicos', '#haletos']])),
    h('h3', { class: 'block-title', style: 'margin-top:20px' }, 'Da estrutura ao nome'),
    h('div', { class: 'cmflow' }, [['reconhecer funções', '#funcoes'], ['escolher função principal', '#prioridade'], ['escolher cadeia principal', '#cadeia'], ['numerar', '#numeracao'], ['nomear substituintes', '#substituintes'], ['montar o nome', '#simulador']].flatMap(([t, href], i) => [i ? h('span', { class: 'ar', 'aria-hidden': 'true' }, '→') : null, h('a', { class: 'cmstep', href }, h('b', null, String(i + 1)), ' ' + t)])));
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
  sec.querySelectorAll('[data-name]:not([data-done])').forEach((e) => { e.setAttribute('data-done', ''); e.innerHTML = nameHTML(M(e.dataset.name)); });
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
    const visited = store.get('nom-visited', []);
    if (!visited.includes(sec.id)) { visited.push(sec.id); store.set('nom-visited', visited); }
    markVisited(); buildPager();
    document.title = (sec.dataset.title || '') + ' · Funções Orgânicas e Nomenclatura';
    const cur = NAV.find((a) => a.getAttribute('aria-current'));
    if (cur) cur.scrollIntoView({ block: 'nearest', inline: 'center' });
  }
  if (anchor) { const t = document.getElementById(anchor); if (t) setTimeout(() => t.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60); }
  else { window.scrollTo(0, 0); setTimeout(() => window.scrollTo(0, 0), 0); }
}
function markVisited() {
  const visited = store.get('nom-visited', []);
  NAV.forEach((a) => a.classList.toggle('done', visited.includes(a.getAttribute('href').slice(1)) && !a.getAttribute('aria-current')));
  document.getElementById('progress').style.width = (100 * visited.length / SECTIONS.length) + '%';
}
function buildPager() {
  const i = SECTIONS.indexOf(current);
  pager.innerHTML = '';
  if (i > 0) pager.append(h('a', { class: 'btn', href: '#' + SECTIONS[i - 1].id }, '← ' + SECTIONS[i - 1].dataset.title));
  if (i < SECTIONS.length - 1) pager.append(h('a', { class: 'btn primary', href: '#' + SECTIONS[i + 1].id, style: 'margin-left:auto' }, SECTIONS[i + 1].dataset.title + ' →'));
}

/* ---------- guia rápido (disponível em toda a aplicação) ---------- */
const dlg = document.getElementById('guide');
To.guideList(dlg.querySelector('.guide-body'));
document.getElementById('guideBtn').addEventListener('click', () => { if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); });
dlg.addEventListener('click', (e) => {
  const b = e.target.closest('[data-g]');
  if (e.target === dlg) dlg.close();
  if (!b) return;
  if (b.dataset.g === 'close') dlg.close();
  if (b.dataset.g === 'print') { document.body.classList.add('print-guide'); window.print(); setTimeout(() => document.body.classList.remove('print-guide'), 500); }
  if (b.dataset.g === 'full') { const el = dlg; if (document.fullscreenElement) document.exitFullscreen(); else if (el.requestFullscreen) el.requestFullscreen().catch(() => {}); }
});
window.addEventListener('afterprint', () => document.body.classList.remove('print-guide'));

window.addEventListener('hashchange', () => go(location.hash.slice(1) || 'inicio'));
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-action]');
  if (!b) return;
  if (b.dataset.action === 'redo') {
    try { localStorage.removeItem('nom-prop'); } catch (err) { /* nada */ }
    const sec = document.getElementById('propostos');
    sec.querySelectorAll('[data-w]:not([data-3d])').forEach((x) => { x.innerHTML = ''; x.removeAttribute('data-done'); });
    initSection(sec);
  }
  if (b.dataset.action === 'guide') document.getElementById('guideBtn').click();
});
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
go(location.hash.slice(1) || 'inicio');
window.addEventListener('load', () => { const t = document.getElementById(location.hash.slice(1)); if (!t || t.classList.contains('section')) setTimeout(() => window.scrollTo(0, 0), 30); });
