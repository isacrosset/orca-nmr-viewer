/*
 * main.js — navegação entre módulos e inicialização sob demanda dos componentes.
 */
import { mol } from './chem2d.js';
import { VIEWERS } from './viewer3d.js';
import { SK, genericFrames, sn2Frames, sn1Frames, hydrideShift, methylShift, polarBond, arrowFormBond, arrowBreakBond, allylResonance, benzylResonance, tosylate, mesylate, protonatedAlcohol } from './struct.js';
import { sn2Scene, SN2_STEPS, stericScene, STERIC, sn1Scene, SN1_STEPS, cationScene, facesScene } from './scenes.js';
import { energyChart } from './energy.js';
import { h, player, quickTests, solvation, nucleophilicity, leavingGroups, cationLadder, compareTable, decisionTree, simulator } from './widgets2d.js';
import { lab } from './lab.js';
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
  polar: () => mol(polarBond('Br'), { scale: 50, zoom: 1.4 }),
  arrowForm: () => mol(arrowFormBond(), { scale: 48, zoom: 1.4 }),
  arrowBreak: () => mol(arrowBreakBond(), { scale: 48, zoom: 1.4 }),
  allyl: () => mol(allylResonance(), { scale: 44 }),
  benzyl: () => mol(benzylResonance(), { scale: 36, fs: 15 }),
  tosylate: () => mol(tosylate(), { scale: 34, fs: 15 }),
  mesylate: () => mol(mesylate(), { scale: 34, fs: 15 }),
  protAlc: () => mol(protonatedAlcohol(), { scale: 42, zoom: 1.4 }),
  subsRow: (host) => {
    [['methyl', 'CH₃–X · metílico'], ['ethyl', 'RCH₂–X · primário'], ['isopropyl', 'R₂CH–X · secundário'], ['tbutyl', 'R₃C–X · terciário']].forEach(([k, c]) => {
      host.append(h('figure', { class: 'fig' }, mol(SK[k]('X'), { scale: 40, fs: 16 }), h('figcaption', { html: c })));
    });
  },
};

/* ---------- controles reutilizáveis para cenas 3D ---------- */
function sceneControls(clock, o = {}) {
  const play = h('button', { class: 'btn sm primary', type: 'button' }, '▶ Reproduzir');
  const slow = h('button', { class: 'btn sm', type: 'button', 'aria-pressed': 'false' }, '🐢 Lento');
  const range = h('input', { type: 'range', min: 0, max: 1000, value: 0, 'aria-label': 'Progresso da reação' });
  clock.onState = (p) => { play.textContent = p ? '❚❚ Pausar' : '▶ Reproduzir'; };
  play.addEventListener('click', () => clock.toggle());
  slow.addEventListener('click', () => { const on = slow.getAttribute('aria-pressed') !== 'true'; slow.setAttribute('aria-pressed', on); clock.speed(on ? 0.35 : 1); });
  range.addEventListener('input', () => { clock.pause(); clock.set(+range.value / 1000 * (o.max || 1)); });
  return { el: h('div', { class: 'controls' }, play, slow, h('div', { class: 'range-row' }, h('span', { class: 'hint', style: 'color:var(--muted);font-size:.82rem' }, 'progresso'), range)), range, play };
}

/* ---------- componentes ---------- */
const W = {
  hero(host) {
    const sc = sn2Scene(host, { labels: false, loop: true, autoRotate: true, autoPlay: true, dur: 8, camPos: [-0.5, 2.5, 12.5], alt: 'Animação 3D de uma reação SN2 entre hidróxido e bromometano' });
    if (sc.v.ok) sc.v.caption('<b>SN2</b>: HO⁻ + CH₃Br → CH₃OH + Br⁻');
  },
  fundPlayer(host) {
    const f = genericFrames();
    player(host, [
      { s: f[0], cap: '<b>Reagentes.</b> O nucleófilo (Nu⁻) tem pares livres; o carbono ligado a X é δ+ (eletrofílico); X é δ−.' },
      { s: f[1], cap: '<b>Nucleófilo → carbono eletrofílico.</b> A seta magenta mostra o par do Nu⁻ indo formar a ligação Nu–C.' },
      { s: f[2], cap: '<b>Saída do grupo abandonador.</b> A seta laranja mostra o par da ligação C–X ficando com X.' },
      { s: f[3], cap: '<b>Produtos.</b> Nova ligação Nu–C; X sai como X⁻ levando o par eletrônico. Observe que os grupos R "viraram" (o ataque foi pelo lado oposto).' },
    ]);
  },
  sn2Lab(host) {
    const wrap = h('div', { class: 'split' });
    const vbox = h('div', { class: 'viewer tall' });
    const side = h('div');
    wrap.append(h('div', null, vbox), side);
    host.append(wrap);
    const cap = h('div', { class: 'stepcap', 'aria-live': 'polite' });
    const tl = h('div', { class: 'timeline' });
    let cur = -1, ctl = null;
    const sc = sn2Scene(vbox, {
      labels: true,
      onSet: (s) => {
        let k = 0; SN2_STEPS.forEach((st, i) => { if (s >= st.s - 1e-6) k = i; });
        if (k !== cur) { cur = k; cap.innerHTML = SN2_STEPS[k].d; [...tl.children].forEach((b, i) => b.classList.toggle('on', i === k)); }
        if (ctl) ctl.range.value = Math.round(s * 1000);
      },
    });
    ctl = sceneControls(sc.clock);
    SN2_STEPS.forEach((st) => tl.append(h('button', { type: 'button', html: `<b>${st.t.split(' · ')[0]}</b>${st.t.split(' · ')[1]}`, onclick: () => { sc.clock.pause(); sc.clock.set(st.s); } })));
    const arrows = h('button', { class: 'btn sm', type: 'button', 'aria-pressed': 'true', onclick: (e) => e.currentTarget.setAttribute('aria-pressed', sc.toggle('arrows')) }, 'setas curvas');
    const axis = h('button', { class: 'btn sm', type: 'button', 'aria-pressed': 'false', onclick: (e) => e.currentTarget.setAttribute('aria-pressed', sc.toggle('axis')) }, 'eixo 180°');
    side.append(ctl.el, h('div', { class: 'controls' }, arrows, axis), tl, cap,
      h('div', { class: 'legend' }, h('span', null, h('i', { style: 'background:#ff4fa3' }), 'nucleófilo / seta do par do Nu'), h('span', null, h('i', { style: 'background:#ff9f43' }), 'grupo abandonador'), h('span', null, h('i', { style: 'background:#ffd45c' }), 'ligação parcial (ET)')));
    sc.set && sc.set(0);
  },
  sn2Player(host) {
    const f = sn2Frames();
    player(host, [
      { s: f.r, cap: '<b>Reagentes:</b> HO⁻ e CH₃Br. O carbono é δ+ e o Br, δ−.' },
      { s: f.a1, cap: '<b>Setas:</b> o par do O ataca o C pelo lado oposto ao Br <i>enquanto</i> o par da ligação C–Br vai para o Br.' },
      { s: f.ts, cap: '<b>Estado de transição ‡:</b> ligações parciais O···C···Br (tracejadas), H no mesmo plano, carga negativa distribuída (δ−) entre O e Br.' },
      { s: f.p, cap: '<b>Produtos:</b> CH₃OH + Br⁻. Os H apontam agora para o lado oposto (inversão).' },
    ]);
  },
  backside(host) {
    const vbox = h('div', { class: 'viewer' });
    const info = h('div', { class: 'stepcap', 'aria-live': 'polite' }, 'Clique em um átomo para identificá-lo.');
    const ROLE = { nu: 'nucleófilo (HO⁻): par de elétrons que vai atacar', lg: 'grupo abandonador (Br): vai sair como Br⁻', center: 'carbono eletrofílico (δ+), sp³ tetraédrico' };
    const sc = sn2Scene(vbox, { arrows: false, labels: true, orbitals: false, axis: true, dur: 5, camPos: [-2.5, 3.4, 10.5],
      onPick: (a) => { info.innerHTML = `<b>${a.el}</b> — ${ROLE[a.tag] || (a.el === 'H' ? 'hidrogênio ligado ao carbono eletrofílico' : '')}`; } });
    sc.clock.set(0.12);
    const orb = h('button', { class: 'btn sm primary', type: 'button', 'aria-pressed': 'false', onclick: (e) => e.currentTarget.setAttribute('aria-pressed', sc.toggle('orbitals')) }, 'Mostrar orbitais');
    const ax = h('button', { class: 'btn sm', type: 'button', 'aria-pressed': 'true', onclick: (e) => e.currentTarget.setAttribute('aria-pressed', sc.toggle('axis')) }, 'eixo 180°');
    const go = h('button', { class: 'btn sm', type: 'button', onclick: () => { sc.clock.set(0.05); sc.clock.stopAt = 0.42; sc.clock.play(); } }, 'Aproximar o nucleófilo');
    const back = h('button', { class: 'btn sm', type: 'button', onclick: () => { sc.clock.pause(); sc.clock.set(0.12); } }, 'Afastar');
    host.append(vbox, h('div', { class: 'controls' }, orb, ax, go, back), info);
  },
  walden(host) {
    const vbox = h('div', { class: 'viewer' });
    const sc = sn2Scene(vbox, { groups: ['H', 'CH3', 'Et'], stereo: true, labels: false, arrows: false, umbrella: true, dur: 6, camPos: [-0.9, 2.6, 13], alt: 'Inversão de Walden no 2-bromobutano' });
    const b = (t, s) => h('button', { class: 'btn sm', type: 'button', onclick: () => { sc.clock.pause(); sc.clock.set(s); } }, t);
    const umb = h('button', { class: 'btn sm', type: 'button', 'aria-pressed': 'true', onclick: (e) => e.currentTarget.setAttribute('aria-pressed', sc.toggle('umbrella')) }, '☂ guarda-chuva');
    const play = h('button', { class: 'btn sm primary', type: 'button', onclick: () => { sc.clock.set(0); sc.clock.play(); } }, '▶ Reproduzir');
    host.append(vbox, h('div', { class: 'controls' }, b('Antes da reação', 0), b('Estado de transição', 0.5), b('Depois da reação', 1), play, umb));
    if (sc.v.ok) sc.v.caption('2-bromobutano + HO⁻ · cone violeta = "guarda-chuva"');
  },
  energySN2(host) { energyChart(host, { show: ['sn2'] }); },
  energySN1(host) { energyChart(host, { show: ['sn1'] }); },
  energyCmp(host) { energyChart(host, { show: ['sn1', 'sn2'], noEa: true, h: 320 }); },
  steric(host) {
    const vbox = h('div', { class: 'viewer' });
    const info = document.getElementById('steric-info');
    const chipN = h('span', { class: 'chip' }, 'grupos alquila: 0/3');
    const sc = stericScene(vbox, (st, n) => { if (info) info.innerHTML = `<b>${st.name}</b><br>velocidade relativa (SN2, aprox.): <b>${st.rel}</b><br>${st.note}`; chipN.textContent = `grupos alquila: ${n}/3`; });
    let space = false;
    host.append(vbox, h('div', { class: 'controls' },
      h('button', { class: 'btn sm primary', type: 'button', onclick: () => sc.setN(sc.n + 1) }, '＋ Adicionar grupo alquila'),
      h('button', { class: 'btn sm', type: 'button', onclick: () => sc.setN(sc.n - 1) }, '− Remover'),
      h('button', { class: 'btn sm accent', type: 'button', onclick: () => sc.attack() }, '⇢ Lançar nucleófilo'),
      h('button', { class: 'btn sm', type: 'button', 'aria-pressed': 'false', onclick: (e) => { space = !space; e.currentTarget.setAttribute('aria-pressed', space); sc.setStyle(space ? 'space' : 'ball'); } }, 'space-filling'), chipN));
    cleanups.push(() => sc.dispose());
  },
  nucleo(host) { nucleophilicity(host); },
  solv(host) { solvation(host); },
  sn1Lab(host) {
    const wrap = h('div', { class: 'split' });
    const vbox = h('div', { class: 'viewer tall' });
    const side = h('div');
    wrap.append(h('div', null, vbox), side);
    host.append(wrap);
    const cap = h('div', { class: 'stepcap', 'aria-live': 'polite' });
    const tl = h('div', { class: 'timeline' });
    let cur = -1;
    const sc = sn1Scene(vbox, {
      onSet: (t) => {
        const k = Math.min(3, Math.floor(t + 1e-6));
        if (k !== cur) { cur = k; cap.innerHTML = `<b>${SN1_STEPS[k].t}</b><br>${SN1_STEPS[k].d}`; [...tl.children].forEach((b, i) => b.classList.toggle('on', i === k)); }
      },
    });
    const c = sc.clock;
    const btn = (t, f, cls = '') => h('button', { class: 'btn sm ' + cls, type: 'button', onclick: f }, t);
    const goStep = (k) => { c.pause(); const from = Math.max(0, k - 1); if (k === 0) { c.set(0); return; } c.set(from); c.stopAt = k; c.play(); };
    side.append(h('div', { class: 'controls' },
      btn('◀ Etapa anterior', () => { c.pause(); c.set(Math.max(0, Math.ceil(c.s - 1e-6) - 1)); }),
      btn('Próxima etapa ▶', () => { const k = Math.min(3, Math.floor(c.s + 1e-6) + 1); c.set(Math.floor(c.s + 1e-6)); c.stopAt = k; c.play(); }, 'primary'),
      btn('▶ Reproduzir animação', () => { c.stopAt = null; if (c.s >= 2.999) c.set(0); c.play(); }),
      btn('❚❚ Pausar', () => c.pause())),
    tl, cap,
    h('div', { class: 'controls' }, h('button', { class: 'btn sm', type: 'button', 'aria-pressed': 'true', onclick: (e) => e.currentTarget.setAttribute('aria-pressed', sc.toggle('porb')) }, 'orbital p'), h('button', { class: 'btn sm', type: 'button', 'aria-pressed': 'true', onclick: (e) => e.currentTarget.setAttribute('aria-pressed', sc.toggle('arrows')) }, 'setas curvas'),
      h('button', { class: 'btn sm', type: 'button', 'aria-pressed': 'false', onclick: (e) => { const on = e.currentTarget.getAttribute('aria-pressed') !== 'true'; e.currentTarget.setAttribute('aria-pressed', on); c.speed(on ? 0.35 : 1); } }, '🐢 Lento')));
    SN1_STEPS.forEach((st, k) => tl.append(h('button', { type: 'button', html: `<b>${k === 0 ? 'Início' : 'Etapa ' + k}</b>${st.t.split(' · ')[1] || 'reagente'}`, onclick: () => goStep(k) })));
  },
  sn1Player(host) {
    const f = sn1Frames();
    player(host, [
      { s: f[0], cap: '<b>Reagente:</b> brometo de terc-butila (C terciário δ+).' },
      { s: f[1], cap: '<b>Etapa 1 (lenta):</b> quebra heterolítica da ligação C–Br — o par vai para o Br.' },
      { s: f[2], cap: '<b>Intermediário:</b> carbocátion terciário (plano, orbital p vazio) + Br⁻.' },
      { s: f[3], cap: '<b>Etapa 2 (rápida):</b> um par livre da água ataca o carbocátion.' },
      { s: f[4], cap: '<b>Etapa 3 (rápida):</b> outra água remove o H⁺ do íon oxônio (seta ciano); o par da ligação O–H fica no oxigênio (seta laranja).' },
      { s: f[5], cap: '<b>Produtos:</b> álcool terc-butílico, H₃O⁺ e Br⁻.' },
    ], { interval: 2800 });
  },
  cation(host) {
    const vbox = h('div', { class: 'viewer' });
    const sc = cationScene(vbox);
    const range = h('input', { type: 'range', min: 0, max: 1000, value: 0, 'aria-label': 'De sp³ a sp²' });
    range.addEventListener('input', () => sc.set && sc.set(+range.value / 1000));
    const tg = (t, k, on) => h('button', { class: 'btn sm' + (k === 'p' ? ' primary' : ''), type: 'button', 'aria-pressed': on ? 'true' : 'false', onclick: (e) => e.currentTarget.setAttribute('aria-pressed', sc.toggle(k)) }, t);
    let spin = false;
    host.append(vbox, h('div', { class: 'controls' }, h('div', { class: 'range-row' }, h('span', { class: 'chip' }, 'sp³ tetraédrico'), range, h('span', { class: 'chip sn1' }, 'sp² plano'))),
      h('div', { class: 'controls' }, tg('Mostrar orbital p vazio', 'p'), tg('plano dos substituintes', 'plane'), tg('hiperconjugação', 'hyper'),
        h('button', { class: 'btn sm', type: 'button', 'aria-pressed': 'false', onclick: (e) => { spin = !spin; e.currentTarget.setAttribute('aria-pressed', spin); sc.spin && sc.spin(spin); } }, '⟳ girar 360°'),
        h('button', { class: 'btn sm', type: 'button', onclick: () => { let t = +range.value / 1000; const id = setInterval(() => { t = Math.min(1, t + 0.02); range.value = t * 1000; sc.set && sc.set(t); if (t >= 1) clearInterval(id); }, 30); } }, '▶ animar ionização')));
  },
  faces(host) {
    const vbox = h('div', { class: 'viewer' });
    const sc = facesScene(vbox);
    host.append(vbox, h('div', { class: 'controls' },
      h('button', { class: 'btn sm primary', type: 'button', onclick: () => { sc.clock.set(0); sc.clock.play(); } }, '▶ Ataque pelas duas faces'),
      h('button', { class: 'btn sm', type: 'button', onclick: () => { sc.clock.pause(); sc.clock.set(0); } }, '⟲ Carbocátion'),
      h('button', { class: 'btn sm', type: 'button', 'aria-pressed': 'false', onclick: (e) => e.currentTarget.setAttribute('aria-pressed', sc.toggle('pair')) }, 'par iônico (Br⁻)')),
    h('p', { class: 'hint', style: 'color:var(--muted);font-size:.86rem', html: 'Esquerda: ataque pela <b>face superior</b>. Direita: ataque pela <b>face inferior</b>. Os descritores (R/S) são calculados a partir das estruturas 3D.' }));
  },
  ladder(host) { cationLadder(host); },
  rearrH(host) {
    const f = hydrideShift();
    player(host, [
      { s: f[0], cap: 'Carbocátion <b>secundário</b> (de 2-bromo-3-metilbutano). O H do carbono vizinho migra <b>com seu par de elétrons</b> (hidreto, H⁻).' },
      { s: f[1], cap: 'Forma-se um carbocátion <b>terciário</b>, mais estável.' },
      { s: f[2], cap: 'A água captura o cátion terciário: produto principal <b>2-metilbutan-2-ol</b> (rearranjado).' },
    ], { draw: { scale: 40, fs: 16 } });
  },
  rearrM(host) {
    const f = methylShift();
    player(host, [
      { s: f[0], cap: 'Carbocátion <b>secundário</b> (de 2-bromo-3,3-dimetilbutano). Não há H no carbono vizinho, mas um <b>CH₃</b> migra com seu par de elétrons.' },
      { s: f[1], cap: 'Forma-se um carbocátion <b>terciário</b>.' },
      { s: f[2], cap: 'Produto principal após captura pela água: <b>2,3-dimetilbutan-2-ol</b>.' },
    ], { draw: { scale: 40, fs: 16 } });
  },
  lgRank(host) { leavingGroups(host); },
  cmpTable(host) { compareTable(host); },
  tree(host) { decisionTree(host); },
  sideBySide(host) {
    const v1 = h('div', { class: 'viewer short' }), v2 = h('div', { class: 'viewer short' });
    const c1 = h('div', { class: 'stepcap' }), c2 = h('div', { class: 'stepcap' });
    host.append(h('div', { class: 'grid2' },
      h('div', null, h('h4', { class: 'sn1c' }, 'SN1: grupo abandonador sai → carbocátion → nucleófilo ataca'), v1, c1),
      h('div', null, h('h4', { class: 'sn2c' }, 'SN2: nucleófilo ataca enquanto o grupo abandonador sai'), v2, c2)));
    const A = sn1Scene(v1, { labels: false });
    const B = sn2Scene(v2, { labels: false });
    const st = { p: 0, playing: false, speed: 1 };
    const range = h('input', { type: 'range', min: 0, max: 1000, value: 0, 'aria-label': 'Progresso comparado' });
    const play = h('button', { class: 'btn sm primary', type: 'button' }, '▶ Reproduzir');
    const slowB = h('button', { class: 'btn sm accent', type: 'button' }, '🐢 Reproduzir lentamente');
    function set(p) {
      st.p = p; range.value = p * 1000;
      A.set && A.set(p * 3); B.set && B.set(p);
      c1.innerHTML = p < 0.33 ? 'C–Br se rompe <b>sozinha</b> (etapa lenta); o nucleófilo ainda não participa.' : p < 0.66 ? 'Carbocátion plano formado; agora a água ataca.' : 'Desprotonação e produto.';
      c2.innerHTML = p < 0.4 ? 'O nucleófilo se aproxima pelo lado oposto ao Br.' : p < 0.6 ? '<b>Mesmo instante:</b> O–C se forma e C–Br se rompe (estado de transição).' : 'Produto com inversão.';
    }
    let last = performance.now(), raf;
    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!st.playing) return;
      let p = st.p + dt * st.speed / 9;
      if (p >= 1) { p = 1; st.playing = false; play.textContent = '▶ Reproduzir'; }
      set(p);
    };
    raf = requestAnimationFrame(loop);
    cleanups.push(() => cancelAnimationFrame(raf));
    play.addEventListener('click', () => { st.speed = 1; if (st.p >= 1) st.p = 0; st.playing = !st.playing; play.textContent = st.playing ? '❚❚ Pausar' : '▶ Reproduzir'; });
    slowB.addEventListener('click', () => { st.speed = 0.35; st.p = st.p >= 1 ? 0 : st.p; st.playing = true; play.textContent = '❚❚ Pausar'; });
    range.addEventListener('input', () => { st.playing = false; play.textContent = '▶ Reproduzir'; set(+range.value / 1000); });
    host.append(h('div', { class: 'controls' }, play, slowB, h('div', { class: 'range-row' }, range)));
    set(0);
  },
  lab(host) { const L = lab(host); cleanups.push(() => L.dispose()); },
  sim(host) { simulator(host); },
  levelChips(host) {
    [...new Set(SOLVED.map((s) => s.level))].forEach((l, i) => host.append(h('a', { class: 'chip', href: '#res-' + i }, l)));
  },
  solved(host) {
    let lastLevel = null, li = -1;
    SOLVED.forEach((d, i) => {
      if (d.level !== lastLevel) { lastLevel = d.level; li++; host.append(h('h3', { id: 'res-' + li }, d.level)); }
      host.append(solvedCard(d, `R${i + 1}`));
    });
  },
  propEasy(host) { renderProposed(host, PROPOSED.easy, 0); },
  propMid(host) { renderProposed(host, PROPOSED.mid, 10); },
  propHard(host) { renderProposed(host, PROPOSED.hard, 20); },
  quiz(host) { quiz(host, (sec, anchor) => go(sec, anchor)); },
  challenge(host) { const c = challenge(host); cleanups.push(() => c.stop()); },
  cmap(host) { conceptMap(host); },
};

function renderProposed(host, list, offset) {
  const done = store.get('sn-prop', {});
  list.forEach((d, i) => host.append(exerciseCard(d, `P${offset + i + 1}`, (num, ok) => { done[num] = ok; store.set('sn-prop', done); })));
}

function conceptMap(host) {
  const leaf = (t, href, cls) => h('a', { class: 'card', href, style: `text-decoration:none;color:var(--text);border-color:${cls === 'o' ? 'rgba(255,159,67,.5)' : 'rgba(47,212,245,.5)'};text-align:left` }, t);
  const col = (title, cls, items) => h('div', { style: 'display:grid;gap:8px;align-content:start' },
    h('div', { class: 'card', style: `background:${cls === 'o' ? 'rgba(255,159,67,.14)' : 'rgba(47,212,245,.14)'};border-color:${cls === 'o' ? 'var(--orange)' : 'var(--cyan)'};font-size:1.4rem;font-weight:900;color:${cls === 'o' ? 'var(--orange)' : 'var(--cyan)'}` }, title),
    ...items.map(([t, href]) => leaf(t, href, cls)));
  host.append(
    h('div', { style: 'display:grid;justify-items:center;margin-bottom:10px' }, h('div', { class: 'card', style: 'font-size:1.25rem;font-weight:900;background:linear-gradient(135deg,rgba(47,212,245,.15),rgba(255,79,163,.15));border-color:var(--magenta)' }, 'Substituição nucleofílica'),
      h('div', { style: 'color:var(--muted);font-family:var(--mono);margin-top:6px' }, 'Nu:⁻ + R–X → R–Nu + X:⁻')),
    h('div', { class: 'grid2' },
      col('SN1', 'o', [['carbocátion como intermediário', '#sn1-cat'], ['duas ou mais etapas', '#sn1-mec'], ['cinética unimolecular: v = k[RX]', '#sn1-def'], ['substratos mais substituídos (3°, alílico, benzílico)', '#sn1-estab'], ['solvente polar prótico', '#sn2-solv'], ['possibilidade de rearranjo', '#sn1-rearr'], ['ataque às duas faces do intermediário → racemização', '#sn1-est']]),
      col('SN2', 'c', [['concertada (uma etapa)', '#sn2-def'], ['cinética bimolecular: v = k[RX][Nu]', '#sn2-def'], ['ataque backside (180°)', '#sn2-back'], ['inversão de configuração (Walden)', '#sn2-walden'], ['baixo impedimento estérico (metílico, 1°)', '#sn2-sub'], ['nucleófilo forte', '#sn2-nu'], ['solvente polar aprótico', '#sn2-solv']])));
}

/* ---------- navegação ---------- */

function initSection(sec) {
  sec.querySelectorAll('[data-fig]:not([data-done])').forEach((el) => {
    el.setAttribute('data-done', '');
    const f = FIG[el.dataset.fig];
    if (!f) return;
    const out = f(el);
    if (out && out.nodeType) el.append(out);
  });
  sec.querySelectorAll('[data-w]:not([data-done])').forEach((el) => {
    el.setAttribute('data-done', '');
    const f = W[el.dataset.w];
    if (!f) return;
    try { f(el); } catch (err) { console.error('Componente', el.dataset.w, err); el.insertAdjacentHTML('beforeend', '<p class="hint">Não foi possível carregar este componente.</p>'); }
  });
  quickTests(sec);
}

function teardown(sec) {
  cleanups.splice(0).forEach((f) => { try { f(); } catch (e) { /* já descartado */ } });
  [...VIEWERS].forEach((v) => v.dispose());
  if (!sec) return;
  sec.querySelectorAll('[data-w][data-3d]').forEach((el) => { el.innerHTML = ''; el.removeAttribute('data-done'); });
}

function go(id, anchor) {
  let sec = document.getElementById(id);
  if (!sec || !sec.classList.contains('section')) {
    const inner = document.getElementById(id);
    sec = inner ? inner.closest('.section') : SECTIONS[0];
    anchor = inner && inner !== sec ? id : anchor;
  }
  if (sec !== current) {
    if (current) teardown(current);
    current = sec;
    SECTIONS.forEach((s) => s.classList.toggle('active', s === sec));
    NAV.forEach((a) => {
      if (a.getAttribute('href') === '#' + sec.id) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    initSection(sec);
    const visited = store.get('sn-visited', []);
    if (!visited.includes(sec.id)) { visited.push(sec.id); store.set('sn-visited', visited); }
    markVisited();
    buildPager();
    document.title = (sec.dataset.title || '') + ' · SN1 e SN2';
    const cur = NAV.find((a) => a.getAttribute('aria-current'));
    if (cur) cur.scrollIntoView({ block: 'nearest', inline: 'center' });
  }
  if (anchor) {
    const t = document.getElementById(anchor);
    if (t) setTimeout(() => t.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  } else { window.scrollTo(0, 0); setTimeout(() => window.scrollTo(0, 0), 0); }
}

function markVisited() {
  const visited = store.get('sn-visited', []);
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
    try { localStorage.removeItem('sn-prop'); } catch (err) { /* nada */ }
    const sec = document.getElementById('propostos');
    sec.querySelectorAll('[data-w]').forEach((el) => { el.innerHTML = ''; el.removeAttribute('data-done'); });
    location.hash = '#propostos';
  }
  if (b.dataset.action === 'challenge') location.hash = '#desafio';
});

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
go(location.hash.slice(1) || 'inicio');
window.addEventListener('load', () => {
  const t = document.getElementById(location.hash.slice(1));
  if (!t || t.classList.contains('section')) setTimeout(() => window.scrollTo(0, 0), 30);
});
