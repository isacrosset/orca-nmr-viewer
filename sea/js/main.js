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
const mech = (rx) => stoppable((host) => A.mechSync(host, { rx, fixed: true }));
const OP = [['Fortemente ativadores', ['NH2', 'NHCH3', 'OH', 'OCH3'], 'act'], ['Moderada/fracamente ativadores', ['NHCOCH3', 'OCOCH3', 'CH3', 'C2H5', 'tBu'], 'act'], ['Halogênios (caso especial: desativadores)', ['F', 'Cl', 'Br', 'I'], 'hal']];
const META = [['Desativadores moderados · meta', ['CHO', 'COCH3', 'COOH', 'COOCH3', 'CONH2'], 'deact'], ['Desativadores fortes · meta', ['CN', 'SO3H', 'CF3', 'NO2', 'NMe3'], 'deact']];

const W = {
  hero: A.hero, heroEq: A.heroEq, addVsSub: A.addVsSub, subAddEnergy: A.subAddEnergy, generalEq: A.generalEq, nucleophile: A.nucleophile,
  mechSync: stoppable((host) => A.mechSync(host)), sigmaVs: A.sigmaVs, sigmaRes: A.sigmaRes, restore: A.restore, energySync: A.energySync,
  genBrom: (host) => A.genPlayer(host, 'brom'), genNitr: (host) => A.genPlayer(host, 'nitr'), genSulf: (host) => A.genPlayer(host, 'sulf'), genAlq: (host) => A.genPlayer(host, 'alq'), genAcil: (host) => A.genPlayer(host, 'acil'),
  mechBrom: mech('brom'), mechNitr: mech('nitr'), mechSulf: mech('sulf'), mechAlq: mech('alq'), mechAcil: mech('acil'),
  nitronium3d: A.nitronium3d, so3: A.so3_3d, sulfRev: A.sulfRev, rearrange: A.rearrange, polyalk: A.polyalk, acylium: A.acylium, fcTable: A.fcTable, acylRed: A.acylRed,
  secondQ: B.secondQ, twoEffects: B.twoEffects, reactScale: B.reactScale, inductive: B.inductive, groundRes: B.groundRes, espCompare: B.espCompare,
  cmpOCH3: (host) => B.sigmaCompare(host, { key: 'OCH3' }), cmpNO2: (host) => B.sigmaCompare(host, { key: 'NO2' }), cmpCl: (host) => B.sigmaCompare(host, { key: 'Cl', fixed: true }), cmpAny: (host) => B.sigmaCompare(host, { key: 'CH3' }),
  pathAny: (host) => B.pathDiagram(host), pathNO2: (host) => B.pathDiagram(host, { key: 'NO2' }), pathCl: (host) => B.pathDiagram(host, { key: 'Cl', fixed: true }), pathOMe: (host) => B.pathDiagram(host, { key: 'OCH3' }),
  opTable: (host) => B.orientTable(host, { groups: OP }), metaTable: (host) => B.orientTable(host, { groups: META }), orientTable: (host) => B.orientTable(host), matrix: B.matrix,
  halogen: B.halogen, steric: B.steric, disubConc: (host) => B.disub(host, { types: ['concordantes'] }), disubConf: (host) => B.disub(host, { types: ['conflitantes', 'estérico'] }), congested: B.congested,
  anilineAlCl3: B.anilineAlCl3, protect: B.protect, planner: B.planner, blocking: B.blocking, rxMap: B.rxMap, rxCompare: B.rxCompare, masterTable: B.masterTable,
  lab3d: T.lab3d, subSim: T.subSim, regioSim: T.regioSim, mechSim: T.mechSim,
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
  const done = store.get('sea-prop', {});
  list.forEach((d, i) => host.append(exerciseCard(d, `P${offset + i + 1}`, (num, ok) => { done[num] = ok; store.set('sea-prop', done); })));
}
function conceptMap(host) {
  const node = (t, id) => h('a', { class: 'cmnode', href: '#' + id }, t);
  const branch = (title, items) => h('div', { class: 'cmbranch' }, h('div', { class: 'cmbt' }, title), h('div', { class: 'cmitems' }, items.map(([t, id]) => node(t, id))));
  host.append(
    h('div', { class: 'cmaphead' }, h('div', { class: 'card cm1' }, 'SUBSTITUIÇÃO ELETROFÍLICA AROMÁTICA')),
    h('div', { class: 'cmgrid' },
      branch('Mecanismo', [['eletrófilo', 'mecanismo'], ['ataque do anel π', 'mecanismo'], ['complexo σ', 'complexo'], ['desprotonação', 'complexo'], ['aromaticidade restaurada', 'energia']]),
      branch('Reações', [['halogenação', 'halogenacao'], ['nitração', 'nitracao'], ['sulfonação', 'sulfonacao'], ['Friedel–Crafts alquilação', 'alquilacao'], ['Friedel–Crafts acilação', 'acilacao']]),
      branch('Substituintes', [['ativadores', 'ativadores'], ['desativadores', 'ativadores'], ['orto/para', 'orto'], ['meta', 'meta'], ['halogênios', 'halogenios']]),
      branch('Controle', [['ressonância', 'ressonancia'], ['indução', 'inducao'], ['estérica', 'esterico'], ['regiosseletividade', 'regio'], ['velocidade', 'substituidos']]),
      branch('Síntese', [['ordem de introdução', 'sintese'], ['compatibilidade', 'conflito'], ['limitações', 'alquilacao']])));
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
    const visited = store.get('sea-visited', []);
    if (!visited.includes(sec.id)) { visited.push(sec.id); store.set('sea-visited', visited); }
    markVisited(); buildPager();
    document.title = (sec.dataset.title || '') + ' · Reações de Compostos Aromáticos';
    const cur = NAV.find((a) => a.getAttribute('aria-current'));
    if (cur) cur.scrollIntoView({ block: 'nearest', inline: 'center' });
  }
  if (anchor) { const t = document.getElementById(anchor); if (t) setTimeout(() => t.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60); }
  else { window.scrollTo(0, 0); setTimeout(() => window.scrollTo(0, 0), 0); }
}
function markVisited() {
  const visited = store.get('sea-visited', []);
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
    try { localStorage.removeItem('sea-prop'); } catch (err) { /* nada */ }
    const sec = document.getElementById('propostos');
    sec.querySelectorAll('[data-w]:not([data-3d])').forEach((x) => { x.innerHTML = ''; x.removeAttribute('data-done'); });
    initSection(sec);
  }
});
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
go(location.hash.slice(1) || 'inicio');
window.addEventListener('load', () => { const t = document.getElementById(location.hash.slice(1)); if (!t || t.classList.contains('section')) setTimeout(() => window.scrollTo(0, 0), 30); });
