/*
 * main.js — navegação entre módulos e inicialização sob demanda.
 */
import { VIEWERS } from './viewer3d.js';
import { h, quickTests } from './widgets2d.js';
import { mol } from './chem2d.js';
import * as Mo from './modules.js';
import * as To from './tools.js';
import { heroScene } from './scenes3d.js';
import { energyChart, energyLab, kGraph, PROFILES } from './energy.js';
import { SOLVED, PROPOSED } from './exdata.js';
import { exerciseCard, solvedCard } from './practice.js';
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
const { fig, sk, SP } = Mo;

const FRAMES = {
  homoAB: () => Mo.abFrames('homo'), heteroAB: () => Mo.abFrames('hetero'), clcl: Mo.clclFrames, tbuBr: Mo.tbuBrFrames, hcl: Mo.hclFrames, oxonium: Mo.oxoniumFrames,
  nuE: Mo.nuEFrames, cationWater: Mo.cationWaterFrames, hoHcl: Mo.hoHclFrames, methanol: Mo.methanolFrames, bf3: Mo.bf3Frames, cn: Mo.cnFrames, acetate: Mo.acetateFrames, allyl: Mo.allylFrames,
};
const FIG = {
  species: (host) => host.append(fig(sk(SP.methyl_radical()), 'radical metila (7 e⁻ no C)'), fig(sk(SP.methyl_cation()), 'cátion metila (6 e⁻, p vazio)'), fig(sk(SP.methyl_anion()), 'ânion metila (par livre)')),
  radicals: (host) => [['CH₃•', 'metílico'], ['RCH₂•', 'primário'], ['R₂CH•', 'secundário'], ['R₃C•', 'terciário'], ['CH₂=CH–CH₂•', 'alílico'], ['C₆H₅CH₂•', 'benzílico']].forEach(([f, t]) => host.append(h('div', { class: 'chip big' }, h('b', null, f), ' ', t))),
  nuList: (host) => [['HO⁻', SP.hydroxide], ['CN⁻', SP.cyanide], ['NH₃', SP.ammonia], ['H₂O', SP.water], ['RO⁻', Mo.ethoxide], ['eteno (π)', SP.ethene]].forEach(([t, f]) => host.append(fig(sk(f(), { scale: 34 }), t))),
  elList: (host) => [['H⁺ (em H₃O⁺)', SP.hydronium], ['carbocátion', SP.tbu_cation], ['C de C=O', SP.acetone], ['C ligado a halogênio', SP.ch3br], ['BF₃', SP.bf3]].forEach(([t, f]) => host.append(fig(sk(f(), { scale: 34 }), t))),
  ethVsAce: (host) => host.append(fig(sk(SP.ethanol()), 'etanol · pKa ≈ 16'), fig(sk(Mo.ethoxide()), 'etóxido: carga em 1 O'), fig(sk(SP.acetic()), 'ácido acético · pKa ≈ 4,8'), fig(sk(Mo.acetate(0)), 'acetato: carga em 2 O (ressonância)')),
  exo: (host) => energyChart(host, { pts: PROFILES.exo.pts, h: 280 }),
  endo: (host) => energyChart(host, { pts: PROFILES.endo.pts, h: 280 }),
  two: (host) => energyChart(host, { pts: PROFILES.two.pts, h: 300 }),
  two2: (host) => energyChart(host, { pts: PROFILES.two2.pts, h: 300 }),
};

const W = {
  hero(host) { const v = Mo.vbox('tall'); host.append(v); heroScene(v); },
  mech(host) { const f = FRAMES[host.dataset.k]; if (!f) return; const p = Mo.player(host, f(), { draw: { scale: +(host.dataset.scale || 46) } }); cleanups.push(() => p.stop()); },
  bondEl: Mo.bondEl, homoHetero: Mo.homoHetero, clickRoles: Mo.clickRoles, conjPairs: Mo.conjPairs, espGallery: (host) => Mo.espGallery(host), arrowWrongRight: Mo.arrowWrongRight,
  kaPka: Mo.kaPka, pkaRuler: Mo.pkaRuler, cbBuilder: Mo.cbBuilder, periodTrend: Mo.periodTrend, groupTrend: Mo.groupTrend, ptTrend: Mo.ptTrend, hybTrend: Mo.hybTrend, inductive: Mo.inductive, inductDist: Mo.inductDist, approach: Mo.approach, accounting: Mo.accounting,
  radical3d(host) { Mo.species3d(host, { keys: [['CH3r', 'radical metila']], key: 'CH3r', orbOn: true, orbLabel: 'Orbital p (1 elétron)' }); },
  cation3d(host) { Mo.species3d(host, { keys: [['CH3p', 'cátion metila'], ['tBup', 'cátion t-butila']], key: 'CH3p', orbLabel: 'Mostrar orbital p vazio' }); },
  anion3d(host) { Mo.species3d(host, { keys: [['CH3m', 'ânion metila'], ['acetylide', 'acetileto']], key: 'CH3m', orbOn: true, orbLabel: 'Orbital do par' }); },
  compare3d(host) { Mo.species3d(host, { keys: [['CH3p', 'carbocátion'], ['CH3m', 'carbânion'], ['CH3r', 'radical']], key: 'CH3p', orbOn: true, orbLabel: 'Orbitais' }); },
  bf3_3d(host) { Mo.species3d(host, { keys: [['BF3', 'BF₃'], ['NH3', 'NH₃']], key: 'BF3', orbOn: true, orbLabel: 'Orbital vazio / par' }); },
  espEthAce(host) { Mo.espCompare(host, 'ethoxide', 'acetate', { range: 0.9, note: 'Mesma escala de cores: no etóxido o vermelho intenso concentra-se em um O; no acetato a carga se divide entre os dois O.' }); },
  espHX(host) { Mo.espCompare(host, 'HF', 'HBr', { range: 0.18, note: 'HF é mais polar (H mais azul), mas HBr é muito mais ácido: a ligação longa e fraca e o Br⁻ grande e polarizável pesam mais.' }); },
  espHyb(host) { Mo.espCompare(host, 'CH3m', 'acetylide', { range: 1.0, note: 'Carbânion sp³ × acetileto (par em sp): a carga do acetileto está mais contida perto do núcleo.' }); },
  lab3d: To.lab3d, whereElectrons: To.whereElectrons, cxAttack: To.cxAttack, eqSim: To.eqSim, pkaCalc: To.pkaCalc, cbCompare: To.cbCompare, reasonTool: To.reasonTool, aciditySim: To.aciditySim, rankEx: To.rankEx, baseEx: To.baseEx, arrowSim: To.arrowSim, mechBuilder: To.mechBuilder, chargeEx: To.chargeEx,
  energyLab, kGraph: (host) => kGraph(host),
  homoEx(host) {
    [['Quebra homolítica de H₃C–CH₃:', ['2 CH₃•', 'CH₃⁺ + CH₃⁻', 'CH₄ + CH₂', 'C₂H₅• + H•'], 'Ligação C–C simétrica: um elétron para cada CH₃.'], ['Quebra heterolítica de H₃C–Cl:', ['CH₃⁺ + Cl⁻', 'CH₃⁻ + Cl⁺', 'CH₃• + Cl•', 'CH₂ + HCl'], 'Cl, mais eletronegativo, fica com o par.'], ['Quebra homolítica de Br–Br:', ['2 Br•', 'Br⁺ + Br⁻', 'Br₂²⁻', 'nada'], 'Ligação apolar.'], ['Heterólise de H–O⁺H₂ (no H₃O⁺, perda de H⁺):', ['H⁺ + H₂O', 'H⁻ + H₂O²⁺', 'H• + H₂O•⁺', 'H₂ + HO⁺'], 'O par fica no O, que volta a ser neutro.']]
      .forEach(([q, o, e], i) => host.append(exerciseCard({ title: 'Homólise × heterólise', type: 'mc', q, o, a: 0, e }, 'H' + (i + 1))));
  },
  classifyEx(host) {
    host.append(exerciseCard({ title: 'Eletrófilo, nucleófilo, ambos ou nenhum?', type: 'match', q: 'Classifique no contexto mais comum:', pairs: [['HO⁻', 'nucleófilo'], ['CH₃⁺', 'eletrófilo'], ['H₂O', 'ambos'], ['CH₄', 'nenhum']], e: 'H₂O: pares livres (Nu) e H δ+ (pode doar H⁺). CH₄: sem pares livres nem polarização apreciável.' }, 'E1'));
    host.append(exerciseCard({ title: 'Brønsted e Lewis', type: 'match', q: 'Em NH₃ + HCl → NH₄⁺ + Cl⁻:', pairs: [['NH₃', 'base de Brønsted e de Lewis'], ['HCl', 'ácido de Brønsted'], ['H do HCl', 'centro eletrofílico'], ['NH₄⁺', 'ácido conjugado']], e: 'NH₃ doa o par (Lewis) e recebe H⁺ (Brønsted).' }, 'E2'));
  },
  kdgEx(host) {
    [['K = 5,0 × 10³ → ΔG° é', ['negativo', 'positivo', 'zero'], 'K > 1.'], ['K = 1 → ΔG° é', ['zero', 'negativo', 'positivo'], 'ln 1 = 0.'], ['K = 2 × 10⁻⁴ → ΔG° é', ['positivo', 'negativo', 'zero'], 'K < 1.'], ['K = 10⁴ (298 K): ΔG° ≈', ['−22,8 kJ/mol', '+22,8 kJ/mol', '−4 kJ/mol'], '−5,71 × 4.'], ['ΔG° = +5,7 kJ/mol (298 K): K ≈', ['0,1', '10', '1'], 'log K = −1.']]
      .forEach(([q, o, e], i) => host.append(exerciseCard({ title: 'K e ΔG°', type: 'mc', q, o, a: 0, e }, 'G' + (i + 1))));
  },
  energyEx(host) {
    host.append(exerciseCard({ title: 'Leia o diagrama', type: 'match', q: 'Associe cada ponto:', fig: { energy: ['quiz1'] }, pairs: [['A', 'reagentes'], ['B', 'estado de transição'], ['C', 'intermediário'], ['D', 'estado de transição'], ['E', 'produtos']], e: 'Máximos = ET; mínimo local entre ETs = intermediário.' }, 'D1'));
    host.append(exerciseCard({ title: 'Sinal de ΔG', type: 'mc', q: 'No diagrama acima (A → E), ΔG é:', fig: { energy: ['quiz1'] }, o: ['positivo (endergônica)', 'negativo', 'zero'], a: 0, e: 'E está acima de A.' }, 'D2'));
  },
  levelChips(host) { [...new Set(SOLVED.map((s) => s.level))].forEach((l, i) => host.append(h('a', { class: 'chip', href: '#res-' + i }, l))); },
  solved(host) { let last = null, li = -1; SOLVED.forEach((d, i) => { if (d.level !== last) { last = d.level; li++; host.append(h('h3', { id: 'res-' + li }, `Nível ${li + 1} — ${d.level}`)); } host.append(solvedCard(d, `R${i + 1}`)); }); },
  propEasy(host) { renderProposed(host, PROPOSED.easy, 0); },
  propMid(host) { renderProposed(host, PROPOSED.mid, PROPOSED.easy.length); },
  propHard(host) { renderProposed(host, PROPOSED.hard, PROPOSED.easy.length + PROPOSED.mid.length); },
  quiz(host) { quiz(host, (sec, anchor) => go(sec, anchor)); },
  challenge(host) { const c = challenge(host); cleanups.push(() => c.stop()); },
  cmap(host) { conceptMap(host); },
};
function renderProposed(host, list, offset) {
  const done = store.get('rab-prop', {});
  list.forEach((d, i) => host.append(exerciseCard(d, `P${offset + i + 1}`, (num, ok) => { done[num] = ok; store.set('rab-prop', done); })));
}
function conceptMap(host) {
  const node = (t, href) => h('a', { class: 'card', href, style: 'text-decoration:none;color:var(--text);text-align:left;font-size:.9rem;padding:8px 10px' }, t);
  const branch = (title, color, items) => h('div', { style: 'display:grid;gap:6px;align-content:start' }, h('div', { class: 'card', style: `font-weight:900;color:var(--${color});border-color:var(--${color})` }, title), ...items.map(([t, href]) => node(t, href)));
  host.append(
    h('div', { class: 'cmaphead' }, h('div', { class: 'card cm1' }, 'REAÇÕES ORGÂNICAS'), h('div', { class: 'card cm2' }, 'movimento de elétrons')),
    h('div', { class: 'grid4' },
      branch('Quebra de ligação', 'magenta', [['homólise', '#quebra'], ['heterólise', '#quebra']]),
      branch('Espécies reativas', 'orange', [['radical', '#especies'], ['carbocátion', '#especies'], ['carbânion', '#especies']]),
      branch('Interações eletrônicas', 'cyan', [['eletrófilo', '#eletrofilos'], ['nucleófilo', '#eletrofilos']]),
      branch('Ácido-base', 'green', [['Brønsted–Lowry', '#bronsted'], ['Lewis', '#lewis']]),
      branch('Força ácido-base', 'yellow', [['pKa', '#pka'], ['base conjugada', '#basecj'], ['ressonância', '#ressonancia'], ['eletronegatividade', '#eletroneg'], ['tamanho', '#tamanho'], ['hibridização', '#hibridizacao'], ['efeito indutivo', '#indutivo'], ['força da ligação', '#ligacao']]),
      branch('Termodinâmica', 'violet', [['K', '#kdg'], ['ΔG', '#kdg']]),
      branch('Mecanismo', 'red', [['setas curvas', '#setas'], ['intermediários', '#intermediarios'], ['estados de transição', '#intermediarios'], ['energia de ativação', '#diagramas']])));
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
  if (sec !== current) {
    if (current) teardown(current);
    current = sec;
    SECTIONS.forEach((s) => s.classList.toggle('active', s === sec));
    NAV.forEach((a) => { if (a.getAttribute('href') === '#' + sec.id) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    initSection(sec);
    const visited = store.get('rab-visited', []);
    if (!visited.includes(sec.id)) { visited.push(sec.id); store.set('rab-visited', visited); }
    markVisited(); buildPager();
    document.title = (sec.dataset.title || '') + ' · Reações Orgânicas';
    const cur = NAV.find((a) => a.getAttribute('aria-current'));
    if (cur) cur.scrollIntoView({ block: 'nearest', inline: 'center' });
  }
  if (anchor) { const t = document.getElementById(anchor); if (t) setTimeout(() => t.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60); }
  else { window.scrollTo(0, 0); setTimeout(() => window.scrollTo(0, 0), 0); }
}
function markVisited() {
  const visited = store.get('rab-visited', []);
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
    try { localStorage.removeItem('rab-prop'); } catch (err) { /* nada */ }
    const sec = document.getElementById('propostos');
    sec.querySelectorAll('[data-w]:not([data-3d])').forEach((x) => { x.innerHTML = ''; x.removeAttribute('data-done'); });
    initSection(sec);
  }
});
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
go(location.hash.slice(1) || 'inicio');
window.addEventListener('load', () => { const t = document.getElementById(location.hash.slice(1)); if (!t || t.classList.contains('section')) setTimeout(() => window.scrollTo(0, 0), 30); });
void mol;
