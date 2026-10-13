/*
 * main.js — navegação entre módulos e inicialização sob demanda.
 */
import { VIEWERS } from './viewer3d.js';
import { h, quickTests, seg } from './widgets2d.js';
import { LIB } from './library.js';
import { mirrorMol, nameOf, cfgString, allStereo } from './stereo.js';
import { wedgeSVG, fischerSVG, ORIENT } from './draw.js';
import { molView } from './scenes.js';
import { M, vbox, fig, pick, fbBox, setFb, prioLegend, hero, isoTree, constActivity, rotRefl, sameMol, hands, mirror, fourGroups, clickCenters, trio, relComp, mesoPlane, ptable, cipTree, dupAtoms, cipOrder, rsView, g4front, g4plane, fischerMorph } from './modules.js';
import { fischerOps, fischerRS, fischerMulti, polarimeter, racemic, count2n, multi3d, relMatrix, lab, rsSim, nameSim, comparator, decTree, chiralBuilder, swapTool } from './tools.js';
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

/* ---------- figuras estáticas ---------- */
const FIG = {
  enantPair: (host) => { const R = M('butanol2'); host.append(fig(wedgeSVG(R, { prio: R.centers[0], scale: 40 }), nameOf(R)), h('span', { class: 'mirrorbar tall' }), fig(wedgeSVG(mirrorMol(R), { prio: R.centers[0], scale: 40, orient: 'turn' }), nameOf(mirrorMol(R)))); },
  tartaric: (host) => allStereo(LIB.tartarico).list.forEach((m) => host.append(fig(fischerSVG(m, { labels: true, maxw: 150 }), `${cfgString(m)} ${m.desc[0] === m.desc[1] ? '· quiral' : '· <b>meso</b>'}<br>[α] = ${m.desc[0] !== m.desc[1] ? '0' : m.desc[0] === 'R' ? '+12' : '−12'}`))),
  nameEx: (host) => [['butanol2', ['R']], ['dibromobutano', ['R', 'R']], ['bromocloro', ['R', 'S']], ['metilpentanol', ['S', 'R']]].forEach(([k, c]) => { const m = M(k, c); host.append(fig(wedgeSVG(m, { scale: 34 }), `<b>${nameOf(m)}</b>`)); }),
  orients: (host) => { const m = M('bromobutano2'); Object.keys(ORIENT).forEach((k) => host.append(fig(wedgeSVG(m, { orient: k, scale: 34 }), `${{ base: 'original', flip: 'girada 180° (eixo horizontal)', turn: 'girada 180° (eixo vertical)', rot180: 'girada 180° no plano' }[k]} · ${m.desc[0]}`))); },
};

/* ---------- componentes ---------- */
const W = {
  hero, isoTree, constActivity, sameMol, hands, fourGroups, clickCenters, relComp, mesoPlane, ptable, cipTree, dupAtoms, cipOrder, rsView, g4front, g4plane, fischerMorph,
  rotOnly(host) { rotRefl(host, { rotateOnly: true }); },
  rotRefl(host) { rotRefl(host, { key: 'lactico' }); },
  mirror(host) { mirror(host); },
  enantMirror(host) { mirror(host, { keys: ['butanol2', 'lactico', 'alanina', 'gliceraldeido', 'dibromobutano'], showNow: true }); },
  mesoMirror(host) { mirror(host, { keys: ['diclorobutano', 'butanodiol', 'tartarico', 'dibromobutano'], key: 'diclorobutano', showNow: true }); },
  trioDicl(host) { trio(host); },
  wedge3d(host) {
    const m = M('bromobutano2'), v = vbox('tall'), side = h('div', { class: 'projbox' });
    host.append(h('div', { class: 'split' }, v, side), h('div', { class: 'controls' }, h('button', { class: 'btn sm primary', type: 'button', onclick: () => mv.flyTo([0, 0, 10]) }, '3D → cunha/tracejado (olhar de frente)'), h('button', { class: 'btn sm accent', type: 'button', onclick: () => mv.flyTo([6, 3.5, 7]) }, 'Cunha/tracejado → 3D (girar)')));
    side.append(fig(wedgeSVG(m, { scale: 44 }), 'linha cheia = no plano · <b>cunha</b> = para você · <b>tracejado</b> = para trás'));
    const mv = molView(v, m, { camPos: [6, 3.5, 7] });
  },
  wedgeQuiz(host) {
    const v = vbox(), opts = h('div', { class: 'mcq cols' }), fb = fbBox();
    let m = null, mv = null;
    host.append(h('div', { class: 'split' }, v, h('div', null, h('p', { class: 'prompt' }, 'Qual desenho representa o modelo 3D? (Gire o modelo à vontade.)'), opts, fb)), h('div', { class: 'controls' }, h('button', { class: 'btn sm', type: 'button', onclick: () => next() }, 'Outra →')));
    function next() {
      m = M(pick(['butanol2', 'bromobutano2', 'lactico', 'alanina', 'gliceraldeido']), [pick(['R', 'S'])]); fb.style.display = 'none';
      if (!mv) mv = molView(v, m, { camPos: [pick([-6, 6]), 3, 7] }); else { mv.setMol(m); }
      const cands = [[m, pick(Object.keys(ORIENT)), true], [mirrorMol(m), pick(Object.keys(ORIENT)), false], [mirrorMol(m), pick(Object.keys(ORIENT)), false]];
      opts.innerHTML = '';
      cands.sort(() => Math.random() - 0.5).forEach(([mm, o, ok]) => opts.append(h('button', { class: 'mopt struct', type: 'button', onclick: (e) => { e.currentTarget.classList.add(ok ? 'right' : 'wrong'); setFb(fb, ok ? 'ok' : 'bad', ok ? `✔ Mesma configuração (${m.desc[0]}), só desenhada em outra orientação.` : `✘ Esse desenho é ${mm.desc[0]}: o enantiômero. O modelo é ${m.desc[0]}.`); } }, wedgeSVG(mm, { orient: o, scale: 30 }))));
    }
    next();
  },
  nameEx(host) {
    [['bromobutano2', ['R']], ['bromocloro', ['S', 'S']], ['dibromobutano', ['R', 'S']]].forEach(([k, c], i) => {
      const m = M(k, c), wrong = [nameOf(mirrorMol(m)), m.spec.name.replace('{cfg}', '').replace('{meso}', ''), nameOf(m).replace(/\(([^)]*)\)/, (x, y) => '(' + y.replace(/\d/g, '') + ')')];
      const o = [nameOf(m), ...wrong.filter((w) => w !== nameOf(m))].slice(0, 4);
      host.append(exerciseCard({ title: 'Nome completo', type: 'mc', q: 'Escolha o nome correto:', fig: [{ svg: () => wedgeSVG(m, { scale: 36 }) }], o: [...new Set(o)], a: 0, e: `Descritores: ${cfgString(m)}.` }, 'N' + (i + 1)));
    });
  },
  fischerOps, fischerRS, fischerMulti, polarimeter, racemic, count2n, multi3d, relMatrix, lab, rsSim, nameSim, comparator, decTree, chiralBuilder, swapTool,
  countEx(host) {
    [['2-bromobutano', 1, 2, 'um centro'], ['2-bromo-3-clorobutano', 2, 4, 'sem simetria'], ['2,3-dibromobutano', 2, 3, 'meso reduz'], ['4-cloro-3-metil-hexan-2-ol', 3, 8, 'sem simetria'], ['aldo-hexose (glicose aberta)', 4, 16, 'sem simetria'], ['ácido tartárico', 2, 3, 'meso reduz']].forEach(([n, c, t, why], i) =>
      host.append(exerciseCard({ title: 'Quantos estereoisômeros?', type: 'mc', q: `<b>${n}</b> (${c} centro${c > 1 ? 's' : ''}):`, o: [...new Set([String(t), String(2 ** c), String(c * 2 + 1), String(2 ** c - 1)])], a: 0, e: `2^${c} = ${2 ** c} no máximo; ${why}: <b>${t}</b>.` }, 'C' + (i + 1))));
  },
  levelChips(host) { [...new Set(SOLVED.map((s) => s.level))].forEach((l, i) => host.append(h('a', { class: 'chip', href: '#res-' + i }, l))); },
  solved(host) { let last = null, li = -1; SOLVED.forEach((d, i) => { if (d.level !== last) { last = d.level; li++; host.append(h('h3', { id: 'res-' + li }, d.level)); } host.append(solvedCard(d, `R${i + 1}`)); }); },
  propEasy(host) { renderProposed(host, PROPOSED.easy, 0); },
  propMid(host) { renderProposed(host, PROPOSED.mid, PROPOSED.easy.length); },
  propHard(host) { renderProposed(host, PROPOSED.hard, PROPOSED.easy.length + PROPOSED.mid.length); },
  quiz(host) { quiz(host, (sec, anchor) => go(sec, anchor)); },
  challenge(host) { const c = challenge(host); cleanups.push(() => c.stop()); },
  cmap(host) { conceptMap(host); },
  prio(host) { host.append(prioLegend()); },
};
function renderProposed(host, list, offset) {
  const done = store.get('est-prop', {});
  list.forEach((d, i) => host.append(exerciseCard(d, `P${offset + i + 1}`, (num, ok) => { done[num] = ok; store.set('est-prop', done); })));
}
function conceptMap(host) {
  const node = (t, href) => h('a', { class: 'card', href, style: 'text-decoration:none;color:var(--text);text-align:left;font-size:.9rem;padding:8px 10px' }, t);
  const branch = (title, color, items) => h('div', { style: 'display:grid;gap:6px;align-content:start' }, h('div', { class: 'card', style: `font-weight:900;color:var(--${color});border-color:var(--${color})` }, title), ...items.map(([t, href]) => node(t, href)));
  host.append(
    h('div', { style: 'display:grid;justify-items:center;margin-bottom:14px' }, h('div', { class: 'card', style: 'font-size:1.4rem;font-weight:900;border-color:var(--cyan);background:linear-gradient(135deg,rgba(47,212,245,.14),rgba(255,79,163,.12))' }, 'ISOMERIA')),
    h('div', { class: 'grid4' },
      branch('Constitucionais', 'orange', [['de cadeia', '#constitucionais'], ['de posição', '#constitucionais'], ['de função', '#constitucionais']]),
      branch('Estereoisômeros', 'magenta', [['enantiômeros', '#enantiomeros'], ['diastereoisômeros', '#diastereoisomeros'], ['meso', '#meso'], ['2ⁿ estereoisômeros', '#numero']]),
      branch('Quiralidade', 'cyan', [['imagem especular não sobreponível', '#quiralidade'], ['centros estereogênicos', '#centros'], ['atividade óptica (+)/(−)', '#optica'], ['racêmicos e ee', '#racemicas']]),
      branch('Representação e nomenclatura', 'green', [['regras CIP', '#cip'], ['R/S', '#rs'], ['cunha/tracejado', '#estereoisomeria'], ['Fischer', '#fischer'], ['nome completo', '#nomenclatura']])));
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
    const visited = store.get('est-visited', []);
    if (!visited.includes(sec.id)) { visited.push(sec.id); store.set('est-visited', visited); }
    markVisited(); buildPager();
    document.title = (sec.dataset.title || '') + ' · Estereoquímica';
    const cur = NAV.find((a) => a.getAttribute('aria-current'));
    if (cur) cur.scrollIntoView({ block: 'nearest', inline: 'center' });
  }
  if (anchor) { const t = document.getElementById(anchor); if (t) setTimeout(() => t.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60); }
  else { window.scrollTo(0, 0); setTimeout(() => window.scrollTo(0, 0), 0); }
}
function markVisited() {
  const visited = store.get('est-visited', []);
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
    try { localStorage.removeItem('est-prop'); } catch (err) { /* nada */ }
    const sec = document.getElementById('propostos');
    sec.querySelectorAll('[data-w]:not([data-3d])').forEach((el) => { el.innerHTML = ''; el.removeAttribute('data-done'); });
    initSection(sec);
  }
});
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
go(location.hash.slice(1) || 'inicio');
window.addEventListener('load', () => { const t = document.getElementById(location.hash.slice(1)); if (!t || t.classList.contains('section')) setTimeout(() => window.scrollTo(0, 0), 30); });
void seg;
