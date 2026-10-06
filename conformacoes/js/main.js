/*
 * main.js — navegação entre módulos e inicialização sob demanda.
 */
import { VIEWERS } from './viewer3d.js';
import { ROTORS, confName } from './conf.js';
import { newmanData, newmanSVG, chairSVG } from './draw.js';
import { rotorScene, chairScene } from './scenes.js';
import { h, quickTests, seg } from './widgets2d.js';
import { rotorPanel, newmanSteps, convertAnim, torsional, steric, newmanMatch, buildNewman, inverse3d, dihedralGuess, energyPointEx, cycloalkanes, cyclohexConfs, chairReps, axialEq, flipSim, boatFlag, diaxial, aValues, chairPair, chairBuilder, newmanBuilder, lab } from './modules.js';
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
const fig = (svg, cap) => h('figure', { class: 'fig' }, svg, h('figcaption', { html: cap }));
const nmf = (k, phi, cap, dir) => fig(newmanSVG(newmanData(ROTORS[k], phi, dir || 'fwd'), { maxw: 200 }), cap);

const FIG = {
  confcfg: (host) => host.append(
    h('div', { class: 'chcard' }, h('h4', { class: 'okc' }, 'Conformações (mesma molécula)'), h('div', { class: 'figs' }, nmf('butano', 180, 'butano anti'), nmf('butano', 60, 'butano gauche')), h('p', null, 'Basta girar a ligação C2–C3: nenhuma ligação é quebrada.')),
    h('div', { class: 'chcard' }, h('h4', { class: 'hic' }, 'Configurações (moléculas diferentes)'), h('div', { class: 'figs' }, fig(chairSVG({ '1u': 'CH3', '2u': 'CH3' }, 0, { scale: 36 }), 'cis-1,2-dimetil'), fig(chairSVG({ '1u': 'CH3', '2d': 'CH3' }, 0, { scale: 36 }), 'trans-1,2-dimetil')), h('p', null, 'Para converter uma na outra seria preciso quebrar ligações.'))),
  butaneSet: (host) => host.append(...[[180, 'anti · 180°'], [60, 'gauche · 60°'], [120, 'eclipsada CH₃/H · 120°'], [0, 'totalmente eclipsada · 0°']].map(([p, c]) => nmf('butano', p, c))),
  ethaneSet: (host) => host.append(nmf('etano', 60, '<b>alternada</b> · 60° · mínimo'), nmf('etano', 0, '<b>eclipsada</b> · 0° · máximo')),
  dirFig: (host) => host.append(nmf('butano', 60, 'gauche, olhando <b>C2 → C3</b>'), nmf('butano', 60, 'a MESMA conformação, olhando <b>C3 → C2</b>', 'rev')),
  updown: (host) => host.append(fig(chairSVG({}, 0, { H: true, color: true, num: true, scale: 50 }), 'azul = axial · âmbar = equatorial')),
  mono: (host) => host.append(fig(chairSVG({ '1u': 'CH3' }, 0, { scale: 44 }), 'CH₃ <b>axial</b> (up) · menos estável'), h('span', { class: 'arrow big' }, '⇌'), fig(chairSVG({ '1u': 'CH3' }, 1, { scale: 44 }), 'CH₃ <b>equatorial</b> (up) · ≈ 95%')),
};

/* ---------- componentes ---------- */
const W = {
  hero(host) {
    const a = h('div', { class: 'viewer short' }), n = h('div', { class: 'projbox heroN' }), c = h('div', { class: 'viewer short' });
    const lab = h('div', { class: 'heroLab' });
    host.append(h('figure', { class: 'fig' }, a, h('figcaption', null, 'molécula 3D (butano)')), h('figure', { class: 'fig' }, n, lab, h('figcaption', null, 'projeção de Newman')), h('figure', { class: 'fig' }, c, h('figcaption', null, 'ciclo-hexano em cadeira')));
    const R = ROTORS.butano;
    const sc = rotorScene(a, R, { phi: 180, camPos: [4.6, 2.4, 6.6] });
    let phi = 180;
    const tick = () => { phi = (phi + 0.6) % 360; sc.set(phi); if (Math.round(phi * 10) % 30 === 0 || true) { n.innerHTML = ''; n.append(newmanSVG(newmanData(R, phi), { maxw: 220 })); lab.textContent = `${Math.round(phi)}° · ${confName(R, phi).n}`; } };
    const id = setInterval(tick, 50); cleanups.push(() => clearInterval(id));
    const ch = chairScene(c, { color: true, nums: false });
    if (ch.v.ok) ch.v.controls.autoRotate = true;
  },
  rotEthane(host) { rotorPanel(host, { rotors: ['etano'], phi: 0 }); },
  dihedral(host) { rotorPanel(host, { rotors: ['dicloroetano'], phi: 60, planes: true, energy: false }); },
  newmanSteps(host) { newmanSteps(host); },
  newman3d(host) { rotorPanel(host, { rotors: ['butano', 'propano', 'metilbutano'], phi: 60, saw: false }); },
  cavalete(host) { rotorPanel(host, { rotors: ['butano', 'etano'], phi: 60, energy: false }); },
  convert(host) { convertAnim(host); },
  ethaneCmp(host) { torsional(host); },
  ethaneProfile(host) { rotorPanel(host, { rotors: ['etano'], phi: 60 }); },
  butane(host) { rotorPanel(host, { rotors: ['butano'], phi: 180, dirToggle: true, tall: false }); },
  butaneQuick(host) {
    let p = null;
    const pan = h('div');
    host.append(h('div', { class: 'controls' }, seg([['180', 'anti'], ['60', 'gauche'], ['120', 'eclipsada CH₃/H'], ['0', 'totalmente eclipsada']], '180', (k) => p.setPhi(+k), 'Conformação')), pan);
    p = rotorPanel(pan, { rotors: ['butano'], phi: 180 });
  },
  steric(host) { steric(host); },
  newmanMatch(host) { newmanMatch(host); },
  buildNewman(host) { buildNewman(host); },
  dirMatch(host) { newmanMatch(host, { dir: 'random', pool: ['butano', 'metilbutano', 'metilpentano'] }); },
  energyAll(host) { rotorPanel(host, { rotors: ['butano', 'etano', 'propano', 'metilbutano', 'dimetilbutano', 'pentano'], phi: 180, saw: false }); },
  energyPoint(host) { energyPointEx(host); },
  rings(host) { cycloalkanes(host); },
  ring3(host) { cycloalkanes(host, { n: 3, fixed: true }); },
  ring4(host) { cycloalkanes(host, { n: 4, fixed: true, anim: true }); },
  ring5(host) { cycloalkanes(host, { n: 5, fixed: true, anim: true }); },
  hexConfs(host) { cyclohexConfs(host); },
  boat(host) { boatFlag(host); },
  chairReps(host) { chairReps(host); },
  axialEq(host) { axialEq(host); },
  flipPlain(host) { flipSim(host, { subs: { '1u': 'Cl' } }); },
  diaxial(host) { diaxial(host); },
  aValues(host) { aValues(host); },
  tbu(host) { diaxial(host, { g: 'tBu', space: true }); },
  disub(host) { chairPair(host); },
  cis12(host) { chairPair(host, { pos: '12', rel: 'cis' }); },
  mixed(host) {
    [
      { title: 'Qual substituinte fica equatorial?', type: 'mc', q: '<b>cis-1-terc-butil-3-metilciclo-hexano</b>: na cadeira mais estável,', fig: [{ svg: () => chairSVG({ '1u': 'tBu', '3u': 'CH3' }, 1, { scale: 40 }), cap: 'uma das cadeiras' }], o: ['os dois grupos ficam equatoriais', 't-Bu axial e CH₃ equatorial', 'os dois axiais', 'CH₃ axial e t-Bu equatorial'], a: 0, e: 'cis-1,3 permite (e,e): é a cadeira mostrada.' },
      { title: 'Qual substituinte fica equatorial?', type: 'mc', q: '<b>trans-1-isopropil-4-metilciclo-hexano</b>:', o: ['ambos equatoriais', 'i-Pr axial', 'CH₃ axial', 'ambos axiais'], a: 0, e: 'trans-1,4: (a,a) ⇌ (e,e); prefere (e,e).' },
      { title: 'Qual substituinte fica equatorial?', type: 'mc', q: '<b>cis-1-isopropil-4-metilciclo-hexano</b>: um grupo precisa ser axial. Qual?', o: ['CH₃ (menor valor A)', 'i-Pr', 'nenhum', 'os dois'], a: 0, e: 'cis-1,4 é (a,e): o i-Pr (A ≈ 9,2) fica equatorial e o CH₃ (A ≈ 7,3) axial.' },
      { title: 'Qual substituinte fica equatorial?', type: 'mc', q: '<b>trans-1-terc-butil-3-metilciclo-hexano</b>:', o: ['t-Bu equatorial, CH₃ axial', 't-Bu axial, CH₃ equatorial', 'ambos equatoriais', 'ambos axiais'], a: 0, e: 'trans-1,3 é (a,e); o t-Bu decide (trava conformacional).' },
    ].forEach((d, i) => host.append(exerciseCard(d, 'S' + (i + 1))));
  },
  cisTransEx(host) {
    [
      { title: 'cis ou trans?', type: 'mc', q: 'Classifique o composto:', fig: [{ svg: () => chairSVG({ '1u': 'CH3', '3u': 'CH3' }, 1, { scale: 40, num: true }) }], o: ['cis-1,3', 'trans-1,3', 'cis-1,4', 'trans-1,2'], a: 0, e: 'Ambos up (mesma face): cis. Note que estão diequatoriais.' },
      { title: 'cis ou trans?', type: 'mc', q: 'Classifique:', fig: [{ svg: () => chairSVG({ '1u': 'CH3', '2d': 'CH3' }, 1, { scale: 40, num: true }) }], o: ['trans-1,2', 'cis-1,2', 'trans-1,3', 'cis-1,4'], a: 0, e: 'Um up e um down: trans — mesmo sendo os dois equatoriais.' },
      { title: 'Axial ou equatorial?', type: 'mc', q: 'No cis-1,4-dimetilciclo-hexano, o CH₃ de C4 na cadeira em que o de C1 é axial é:', o: ['equatorial', 'axial', 'eclipsado', 'anti'], a: 0, e: '(a,e).' },
    ].forEach((d, i) => host.append(exerciseCard(d, 'C' + (i + 1))));
  },
  lab(host) { lab(host); },
  newmanBuilder(host) { newmanBuilder(host); },
  inverse3d(host) { inverse3d(host); },
  chairBuilder(host) { chairBuilder(host); },
  dihedralGuess(host) { dihedralGuess(host); },
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
  const done = store.get('conf-prop', {});
  list.forEach((d, i) => host.append(exerciseCard(d, `P${offset + i + 1}`, (num, ok) => { done[num] = ok; store.set('conf-prop', done); })));
}
function conceptMap(host) {
  const node = (t, href) => h('a', { class: 'card', href, style: 'text-decoration:none;color:var(--text);text-align:left;font-size:.9rem;padding:8px 10px' }, t);
  const branch = (title, color, items) => h('div', { style: 'display:grid;gap:6px;align-content:start' }, h('div', { class: 'card', style: `font-weight:900;color:var(--${color});border-color:var(--${color})` }, title), ...items.map(([t, href]) => node(t, href)));
  host.append(
    h('div', { style: 'display:grid;justify-items:center;margin-bottom:14px' }, h('div', { class: 'card', style: 'font-size:1.4rem;font-weight:900;border-color:var(--cyan);background:linear-gradient(135deg,rgba(47,212,245,.14),rgba(61,220,151,.12))' }, 'CONFORMAÇÕES')),
    h('div', { class: 'grid3' },
      branch('Cadeias acíclicas', 'cyan', [['rotação C–C', '#rotacao'], ['Newman', '#newman'], ['cavalete', '#cavalete'], ['anti · gauche · eclipsada', '#anti-gauche'], ['energia × diedro', '#energia']]),
      branch('Cicloalcanos', 'orange', [['tensão angular', '#cicloalcanos'], ['tensão torsional', '#cicloalcanos'], ['C3 plano · C4 dobrado · C5 envelope', '#cicloalcanos']]),
      branch('Ciclo-hexano', 'green', [['cadeira · barco · barco torcido', '#cicloexano'], ['axial · equatorial · up/down', '#axial'], ['flip (axial ↔ equatorial)', '#inversao'], ['1,3-diaxiais · valores A', '#monossubstituidos'], ['cis/trans · 1,2 / 1,3 / 1,4', '#dissubstituidos']])));
}

/* ---------- navegação ---------- */
function initSection(sec) {
  sec.querySelectorAll('[data-fig]:not([data-done])').forEach((el) => { el.setAttribute('data-done', ''); const f = FIG[el.dataset.fig]; if (f) { try { f(el); } catch (err) { console.error('Figura', el.dataset.fig, err); } } });
  sec.querySelectorAll('[data-w]:not([data-done])').forEach((el) => {
    el.setAttribute('data-done', '');
    const f = W[el.dataset.w];
    if (!f) { console.error('Componente inexistente', el.dataset.w); return; }
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
    const visited = store.get('conf-visited', []);
    if (!visited.includes(sec.id)) { visited.push(sec.id); store.set('conf-visited', visited); }
    markVisited(); buildPager();
    document.title = (sec.dataset.title || '') + ' · Conformações';
    const cur = NAV.find((a) => a.getAttribute('aria-current'));
    if (cur) cur.scrollIntoView({ block: 'nearest', inline: 'center' });
  }
  if (anchor) { const t = document.getElementById(anchor); if (t) setTimeout(() => t.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60); }
  else { window.scrollTo(0, 0); setTimeout(() => window.scrollTo(0, 0), 0); }
}
function markVisited() {
  const visited = store.get('conf-visited', []);
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
    try { localStorage.removeItem('conf-prop'); } catch (err) { /* nada */ }
    const sec = document.getElementById('propostos');
    sec.querySelectorAll('[data-w]:not([data-3d])').forEach((el) => { el.innerHTML = ''; el.removeAttribute('data-done'); });
    initSection(sec);
  }
});
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
go(location.hash.slice(1) || 'inicio');
window.addEventListener('load', () => { const t = document.getElementById(location.hash.slice(1)); if (!t || t.classList.contains('section')) setTimeout(() => window.scrollTo(0, 0), 30); });
