/*
 * main.js — navegação entre módulos e inicialização sob demanda dos componentes.
 */
import { mol, S } from './chem2d.js';
import { VIEWERS } from './viewer3d.js';
import { SKA, e2Frames, e1Frames, hydrideE1, methylE1, ringExpansionE1, newmanSVG, chair2D } from './struct.js';
import { e2Scene, E2_STEPS, chairScene, CHAIR_SUBS, e1Scene, E1_STEPS, cationScene, basesScene, hofmannScene } from './scenes.js';
import { energyChart, energyCompare } from './energy.js';
import { h, player, quickTests, rolesPick, betaPick, newmanE2, zaitsev, stability, bases, temperature, e1e2Table, mech4Table, matrix, flowchart, cases, e2Sim, analyzer } from './widgets2d.js';
import { lab } from './lab.js';
import { SOLVED, PROPOSED } from './exdata.js';
import { exerciseCard, solvedCard } from './practice.js';
import { quiz, challenge } from './quiz.js';

const SECTIONS = [...document.querySelectorAll('.section')];
const NAV = [...document.querySelectorAll('.mainnav a')];
const pager = document.getElementById('pager');
let current = null;
const cleanups = [];
const SC = {};

const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sem armazenamento */ } },
};

/* ---------- figuras estáticas ---------- */
const FIG = {
  general: (host) => {
    const s = new S();
    const ca = s.a(0, 0, 'C', { halo: 'c', note: 'α', nd: [-0.45, 0.5] }), cb = s.a(1.3, 0, 'C', { note: 'β', nd: [0.45, 0.5] });
    s.b(ca, cb);
    s.br(ca, 90, 'X', 1, { cls: 'lg' }, 1.0); s.br(ca, 180, 'R′', 1, null, 1.0); s.br(ca, 270, 'H', 1, null, 0.85);
    s.br(cb, 90, 'H', 1, { cls: 'hb', halo: 'c' }, 0.85); s.br(cb, 0, 'R', 1, null, 1.0); s.br(cb, 270, 'H', 1, null, 0.85);
    s.rxn.push([2.9, 4.3, 0, 'base', '− HX']);
    const a = s.a(5.1, 0, 'C', { cls: 'prod' }), b = s.a(6.4, 0, 'C', { cls: 'prod' });
    s.b(a, b, 2);
    s.br(a, 150, 'R′', 1, null, 0.9); s.br(a, 210, 'H', 1, null, 0.8); s.br(b, 30, 'R', 1, null, 0.9); s.br(b, 330, 'H', 1, null, 0.8);
    host.append(h('figure', { class: 'fig' }, mol(s, { scale: 46, zoom: 1.35 }), h('figcaption', { html: 'Saem <b style="color:var(--cyan)">Hβ</b> e <b style="color:var(--magenta)">X</b>; forma-se a ligação <b style="color:var(--green)">C=C</b> entre Cα e Cβ.' })));
  },
  chairs: (host) => {
    [[{ '0u': 'Br' }, 0, { '1d': 'hb', '5d': 'hb' }, '<b>Br axial</b>: H axiais em C2 e C6 anti ao Br → E2 possível'], [{ '0u': 'Br' }, 1, {}, '<b>Br equatorial</b>: nenhum Hβ anti → E2 não ocorre nessa cadeira']].forEach(([subs, t, hl, cap]) => {
      host.append(h('figure', { class: 'fig' }, mol(chair2D(subs, t, { hl, allH: t === 0 ? false : false }), { scale: 42, zoom: 1.2 }), h('figcaption', { html: cap })));
    });
  },
  stereoNewman: (host) => {
    const F = [['Br', 'lg'], ['CH3', ''], ['H', '']];
    host.append(
      h('figure', { class: 'fig' }, newmanSVG(F, [['H', 'hb'], ['CH3', ''], ['H', '']], 90, 270, { fs: 16, maxw: 240, alt: 'Newman com CH3 anti ao CH3' }), h('figcaption', { html: 'Hβ anti ao Br; CH₃/CH₃ <b>anti</b> → <b>(E)</b>-but-2-eno' })),
      h('figure', { class: 'fig' }, newmanSVG(F, [['H', 'hb'], ['H', ''], ['CH3', '']], 90, 270, { fs: 16, maxw: 240, alt: 'Newman com CH3 gauche ao CH3' }), h('figcaption', { html: 'Hβ anti ao Br; CH₃/CH₃ <b>gauche</b> → <b>(Z)</b>-but-2-eno' })));
  },
};

/* ---------- controles para cenas com relógio ---------- */
function stepControls(sc, steps, opt = {}) {
  const c = sc.clock;
  const cap = h('div', { class: 'stepcap', 'aria-live': 'polite' });
  const tl = h('div', { class: 'timeline' });
  const range = h('input', { type: 'range', min: 0, max: 1000, value: 0, 'aria-label': 'Progresso da reação' });
  const max = opt.max || 1;
  const play = h('button', { class: 'btn sm primary', type: 'button', onclick: () => { c.stopAt = null; c.toggle(); } }, '▶ Reproduzir');
  c.onState = (p) => { play.textContent = p ? '❚❚ Pausar' : '▶ Reproduzir'; };
  const stepIdx = (s) => { let k = 0; steps.forEach((st, i) => { if (s >= st.s - 1e-6) k = i; }); return k; };
  const stepB = h('button', { class: 'btn sm', type: 'button', onclick: () => { const k = Math.min(steps.length - 1, stepIdx(c.s) + 1); c.stopAt = steps[k].s; if (c.s >= steps[k].s) c.set(steps[k].s); else c.play(); } }, 'Passo a passo ▶');
  const reset = h('button', { class: 'btn sm', type: 'button', onclick: () => { c.pause(); c.stopAt = null; c.set(0); } }, '⟲ Reiniciar');
  const slow = h('button', { class: 'btn sm', type: 'button', 'aria-pressed': 'false', onclick: (e) => { const on = e.currentTarget.getAttribute('aria-pressed') !== 'true'; e.currentTarget.setAttribute('aria-pressed', on); c.speed(on ? 0.35 : 1); } }, '🐢 Lento');
  range.addEventListener('input', () => { c.pause(); c.set(+range.value / 1000 * max); });
  steps.forEach((st) => tl.append(h('button', { type: 'button', html: `<b>${st.t.split(' · ')[0]}</b>${st.t.split(' · ')[1] || ''}`, onclick: () => { c.pause(); c.set(st.s); } })));
  let cur = -1;
  const onSet = (s) => {
    const k = stepIdx(s);
    if (k !== cur) { cur = k; cap.innerHTML = steps[k].d; [...tl.children].forEach((b, i) => b.classList.toggle('on', i === k)); }
    range.value = Math.round(s / max * 1000);
  };
  return { el: h('div', null, h('div', { class: 'controls' }, play, stepB, reset, slow), h('div', { class: 'range-row' }, h('span', { class: 'chip' }, 'progresso'), range), tl, cap), onSet };
}
const toggleBtn = (t, f, on) => h('button', { class: 'btn sm', type: 'button', 'aria-pressed': on ? 'true' : 'false', onclick: (e) => e.currentTarget.setAttribute('aria-pressed', f()) }, t);
const PRIO_E = { alpha: [1, 2], beta: [2, 1] };

/* ---------- componentes ---------- */
const W = {
  hero(host) {
    const sc = e2Scene(host, { labels: false, loop: true, autoPlay: true, dur: 9, prio: PRIO_E, autoRotate: false, camPos: [1.4, 0.6, 15], target: [0.8, -1.3, 0], alt: 'Animação 3D da reação E2' });
    if (sc.v.ok) sc.v.caption('<b>E2</b>: CH₃CH₂O⁻ + 2-bromobutano → but-2-eno + CH₃CH₂OH + Br⁻');
  },
  rolesPick(host) { rolesPick(host); },
  betaPick(host) { betaPick(host); },
  fund3d(host) { SC.fund3d = hofmannScene(host); },
  e2Lab(host) {
    const vbox = h('div', { class: 'viewer tall' });
    const side = h('div');
    host.append(h('div', { class: 'split' }, h('div', null, vbox), side));
    let ctl = null;
    const sc = e2Scene(vbox, { labels: true, prio: PRIO_E, dur: 10, onSet: (s) => ctl && ctl.onSet(s) });
    ctl = stepControls(sc, E2_STEPS);
    side.append(ctl.el, h('div', { class: 'controls' }, toggleBtn('setas curvas', () => sc.toggle('arrows'), true), toggleBtn('Mostrar orbitais', () => sc.toggle('orbitals'), false)),
      h('div', { class: 'legend' }, h('span', null, h('i', { style: 'background:#ff9f43' }), 'base / seta base→H'), h('span', null, h('i', { style: 'background:#2fd4f5' }), 'Hβ / seta C–H→π'), h('span', null, h('i', { style: 'background:#ff4fa3' }), 'seta C–Br→Br'), h('span', null, h('i', { style: 'background:#ffd45c' }), 'ligação parcial')));
    sc.set && sc.set(0);
  },
  e2Player(host) {
    const f = e2Frames('EtO');
    player(host, [
      { s: f.r, cap: '<b>Reagentes:</b> etóxido (base, laranja) e 2-bromobutano. O <b>Hβ</b> (ciano) está anti ao Br.' },
      { s: f.a, cap: '<b>Setas (simultâneas):</b> par do O⁻ → Hβ; par da ligação Cβ–H → região Cα–Cβ (nova π); par da ligação Cα–Br → Br.' },
      { s: f.ts, cap: '<b>Estado de transição ‡:</b> ligações parciais (tracejadas) O···H···Cβ, π parcial e Cα···Br; δ− na base e no Br.' },
      { s: f.p, cap: '<b>Produtos:</b> (E)-but-2-eno (principal), etanol e Br⁻.' },
    ]);
  },
  ts3d(host) {
    const sc = e2Scene(host, { labels: true, arrows: false, prio: PRIO_E });
    if (sc.v.ok) { sc.clock.set(0.5); sc.v.caption('Estado de transição ‡ (tracejado amarelo = ligações parciais)'); }
  },
  energyE2(host) { energyChart(host, { show: ['e2'] }); },
  energyE1(host) { energyChart(host, { show: ['e1'] }); },
  energyCmp(host) { energyCompare(host); },
  bases(host) { bases(host); },
  bases3d(host) { SC.bases3d = basesScene(host); },
  anti3d(host) {
    const vbox = h('div', { class: 'viewer tall' });
    const side = h('div');
    host.append(h('div', { class: 'split' }, h('div', null, vbox), side));
    const sc = e2Scene(vbox, { labels: true, arrows: false, prio: PRIO_E, rot: 120, camPos: [-6, 1.5, 12], target: [0.7, -1.0, 0] });
    if (!sc.v.ok) return;
    const dh = h('div', { class: 'dihedral' });
    const status = h('div', { class: 'stepcap', 'aria-live': 'polite' });
    const range = h('input', { type: 'range', min: -180, max: 180, step: 1, value: 120, 'aria-label': 'Rotação em torno da ligação Cα–Cβ' });
    const upd = () => {
      const d = Math.abs(sc.dihedral());
      dh.innerHTML = `H–Cβ–Cα–Br = ${d.toFixed(0)}°`;
      const ok = Math.abs(d - 180) < 6;
      status.innerHTML = ok ? '<span class="status-ok">Geometria favorável à E2</span><br>Hβ e Br anti-periplanares: σ C–H paralelo ao σ* C–Br.' : d < 20 ? '<span class="status-bad">Geometria desfavorável</span><br>sin-periplanar (eclipsada): muito mais lenta.' : '<span class="status-bad">Geometria desfavorável</span><br>Os orbitais não estão alinhados. Gire até 180°.';
    };
    range.addEventListener('input', () => { sc.clock.pause(); sc.clock.set(0); sc.setRot(+range.value); upd(); });
    const run = h('button', { class: 'btn accent', type: 'button', onclick: () => {
      if (Math.abs(Math.abs(sc.dihedral()) - 180) > 6) { status.innerHTML = '<span class="status-bad">Geometria desfavorável</span><br>Primeiro gire a ligação até o diedro ≈ 180°.'; return; }
      sc.setRot(0); range.value = 0; sc.clock.set(0); sc.clock.play();
    } }, '⚡ Executar E2');
    const back = h('button', { class: 'btn sm', type: 'button', onclick: () => { sc.clock.pause(); sc.clock.set(0); sc.setRot(+range.value); upd(); } }, '⟲ Voltar ao reagente');
    side.append(h('p', null, 'Arraste para girar o carbono β em torno da ligação Cα–Cβ e acompanhe o diedro H–Cβ–Cα–Br.'), h('div', { class: 'range-row' }, h('span', { class: 'chip' }, '−180°'), range, h('span', { class: 'chip' }, '+180°')), dh, status,
      h('div', { class: 'controls' }, run, back, toggleBtn('Mostrar orbitais', () => sc.toggle('orbitals'), false)),
      h('p', { class: 'hint', style: 'color:var(--muted);font-size:.86rem' }, 'Orbitais: σ C–H (ciano) e σ* C–Br (magenta) antes da reação; orbitais p (laranja) se formando em Cα e Cβ; π (verde) no produto.'));
    upd();
  },
  newmanE2(host) { newmanE2(host); },
  chair3d(host) {
    const vbox = h('div', { class: 'viewer' });
    const info = h('div', { class: 'stepcap', 'aria-live': 'polite' });
    let sc = null;
    const kinds = h('div', { class: 'seg', role: 'group', 'aria-label': 'Substrato' });
    Object.entries({ bromo: 'bromociclo-hexano', cis: 'cis-4-t-Bu', trans: 'trans-4-t-Bu', metil: '1-bromo-1-metil' }).forEach(([k, t], i) => kinds.append(h('button', { type: 'button', 'aria-pressed': i === 0 ? 'true' : 'false', onclick: (e) => { [...kinds.children].forEach((b) => b.setAttribute('aria-pressed', b === e.currentTarget)); sc && sc.setKind && sc.setKind(k); } }, t)));
    host.append(h('div', { class: 'controls' }, kinds, h('button', { class: 'btn sm primary', type: 'button', onclick: () => sc && sc.flip && sc.flip() }, '⇅ Inverter cadeira')), vbox, info);
    sc = chairScene(vbox, 'bromo', (s) => {
      info.innerHTML = `<b>${s.name}</b> · ${s.brAx ? '<span class="status-ok">conformação reativa</span>: Br axial com H trans-diaxiais (verdes) em C2 e C6.' : '<span class="status-bad">conformação não reativa</span>: Br equatorial, sem Hβ anti-periplanar.'}${s.kind === 'cis' ? ' No isômero cis, a cadeira com t-Bu equatorial é justamente a que tem Br axial.' : s.kind === 'trans' ? ' No isômero trans, Br axial exige t-Bu axial (muito desfavorável).' : ''}`;
    });
  },
  zaitsev(host) { zaitsev(host); },
  hof3d(host) { SC.hof3d = hofmannScene(host); },
  stability(host) { stability(host); },
  stereo3d(host) {
    const v1 = h('div', { class: 'viewer short' }), v2 = h('div', { class: 'viewer short' });
    host.append(h('div', { class: 'grid2' },
      h('div', null, h('h4', { class: 'c-e2' }, 'Conformação 1: CH₃ e CH₃ anti'), v1),
      h('div', null, h('h4', { style: 'color:var(--orange)' }, 'Conformação 2: CH₃ e CH₃ gauche'), v2)));
    const A = e2Scene(v1, { labels: false, arrows: true, beta: ['H', 'CH3'], prio: { alpha: [1, 2], beta: [2, 1] }, rot: 120, dur: 7, camPos: [1.6, 0.4, 16.5] });
    const B = e2Scene(v2, { labels: false, arrows: true, beta: ['CH3', 'H'], prio: { alpha: [1, 2], beta: [1, 2] }, rot: 120, dur: 7, camPos: [1.6, 0.4, 16.5] });
    if (!A.v.ok) return;
    A.v.caption('produto: <b>(E)</b>-but-2-eno'); B.v.caption('produto: <b>(Z)</b>-but-2-eno');
    let raf = null;
    const run = () => {
      cancelAnimationFrame(raf);
      [A, B].forEach((x) => { x.clock.pause(); x.clock.set(0); x.setRot(120); });
      const t0 = performance.now();
      const step = (now) => {
        const k = Math.min(1, (now - t0) / 1800);
        const r = 120 * (1 - k * k * (3 - 2 * k));
        A.setRot(r); B.setRot(r);
        if (k < 1) raf = requestAnimationFrame(step); else { A.clock.play(); B.clock.play(); }
      };
      raf = requestAnimationFrame(step);
    };
    cleanups.push(() => cancelAnimationFrame(raf));
    host.append(h('div', { class: 'controls' }, h('button', { class: 'btn primary', type: 'button', onclick: run }, '▶ Reagente → conformação anti → ET → alceno'),
      h('button', { class: 'btn sm', type: 'button', onclick: () => { cancelAnimationFrame(raf); [A, B].forEach((x) => { x.clock.pause(); x.clock.set(0); x.setRot(120); }); } }, '⟲ Reiniciar')));
  },
  e1Lab(host) {
    const vbox = h('div', { class: 'viewer tall' });
    const side = h('div');
    host.append(h('div', { class: 'split' }, h('div', null, vbox), side));
    const cap = h('div', { class: 'stepcap', 'aria-live': 'polite' });
    const tl = h('div', { class: 'timeline' });
    let cur = -1;
    const sc = e1Scene(vbox, {
      onSet: (t) => {
        const k = t < 0.02 ? 0 : t <= 1.02 ? 1 : 2;
        if (k !== cur) { cur = k; cap.innerHTML = `<b>${E1_STEPS[k].t}</b><br>${E1_STEPS[k].d}`; [...tl.children].forEach((b, i) => b.classList.toggle('on', i === k)); }
      },
    });
    const c = sc.clock;
    const btn = (t, f, cls = '') => h('button', { class: 'btn sm ' + cls, type: 'button', onclick: f }, t);
    E1_STEPS.forEach((st, k) => tl.append(h('button', { type: 'button', html: `<b>${st.t.split(' · ')[0]}</b>${st.t.split(' · ')[1] || 'reagente'}`, onclick: () => { c.pause(); if (k === 0) { c.set(0); return; } c.set(k - 1); c.stopAt = k; c.play(); } })));
    c.onState = () => {};
    side.append(h('div', { class: 'controls' },
      btn('▶ Reproduzir', () => { c.stopAt = null; if (c.s >= 1.999) c.set(0); c.play(); }, 'primary'),
      btn('❚❚ Pausar', () => c.pause()),
      btn('Passo a passo ▶', () => { const k = Math.min(2, Math.floor(c.s + 1e-6) + 1); c.set(Math.floor(c.s + 1e-6)); c.stopAt = k; c.play(); }),
      btn('⟲ Reiniciar', () => { c.pause(); c.stopAt = null; c.set(0); }),
      h('button', { class: 'btn sm', type: 'button', 'aria-pressed': 'false', onclick: (e) => { const on = e.currentTarget.getAttribute('aria-pressed') !== 'true'; e.currentTarget.setAttribute('aria-pressed', on); c.speed(on ? 0.35 : 1); } }, '🐢 Lento')),
    tl, cap,
    h('div', { class: 'legend' }, h('span', null, h('i', { style: 'background:#ff9f43' }), 'orbital p vazio do carbocátion'), h('span', null, h('i', { style: 'background:#2fd4f5' }), 'Hβ'), h('span', null, h('i', { style: 'background:#ff4fa3' }), 'saída do Br⁻')));
  },
  e1Player(host) {
    const f = e1Frames();
    player(host, [
      { s: f[0], cap: '<b>Reagente:</b> brometo de terc-butila (C terciário).' },
      { s: f[1], cap: '<b>Etapa 1 (lenta):</b> quebra heterolítica da ligação C–Br; o par vai para o Br.' },
      { s: f[2], cap: '<b>Intermediário:</b> carbocátion terciário (plano, orbital p vazio) + Br⁻. Uma molécula de água (base fraca) se aproxima de um Hβ.' },
      { s: f[3], cap: '<b>Etapa 2 (rápida):</b> par livre da água → Hβ (laranja); par da ligação C–H → nova ligação π (ciano).' },
      { s: f[4], cap: '<b>Produtos:</b> 2-metilpropeno, H₃O⁺ e Br⁻.' },
    ], { interval: 3200 });
  },
  temperature(host) { temperature(host); },
  cation(host) {
    const vbox = h('div', { class: 'viewer' });
    const sc = cationScene(vbox);
    const range = h('input', { type: 'range', min: 0, max: 1000, value: 0, 'aria-label': 'De sp³ a sp²' });
    range.addEventListener('input', () => sc.set && sc.set(+range.value / 1000));
    host.append(vbox, h('div', { class: 'controls' }, h('div', { class: 'range-row' }, h('span', { class: 'chip' }, 'sp³ (R–Br)'), range, h('span', { class: 'chip' }, 'sp² (R⁺)'))),
      h('div', { class: 'controls' }, h('button', { class: 'btn sm primary', type: 'button', 'aria-pressed': 'false', onclick: (e) => { if (!sc.toggle) return; e.currentTarget.setAttribute('aria-pressed', sc.toggle('p')); if (+range.value < 600) { range.value = 1000; sc.set(1); } } }, 'Mostrar orbital p'),
        h('button', { class: 'btn sm', type: 'button', onclick: () => { let t = +range.value / 1000; const id = setInterval(() => { t = Math.min(1, t + 0.02); range.value = t * 1000; sc.set && sc.set(t); if (t >= 1) clearInterval(id); }, 30); } }, '▶ animar ionização')));
  },
  rearrH(host) {
    const f = hydrideE1();
    player(host, [
      { s: f[0], cap: 'Carbocátion <b>secundário</b> (de 2-bromo-3-metilbutano). O H do carbono vizinho migra <b>com seu par de elétrons</b> (deslocamento 1,2 de hidreto).' },
      { s: f[1], cap: 'Forma-se um carbocátion <b>terciário</b>, mais estável.' },
      { s: f[2], cap: 'Uma base fraca (H₂O/EtOH) remove um Hβ do cátion terciário.' },
      { s: f[3], cap: 'Produto principal: <b>2-metilbut-2-eno</b> (trissubstituído).' },
    ], { draw: { scale: 42, fs: 16 } });
  },
  rearrM(host) {
    const f = methylE1();
    player(host, [
      { s: f[0], cap: 'Carbocátion <b>secundário</b> (de 3,3-dimetilbutan-2-ol ou 2-bromo-3,3-dimetilbutano). Não há H no carbono vizinho, mas um <b>CH₃</b> migra com seu par.' },
      { s: f[1], cap: 'Carbocátion <b>terciário</b> formado.' },
      { s: f[2], cap: 'A base fraca remove um Hβ.' },
      { s: f[3], cap: 'Produto principal: <b>2,3-dimetilbut-2-eno</b> (tetrassubstituído).' },
    ], { draw: { scale: 42, fs: 16 } });
  },
  ringExp(host) {
    const f = ringExpansionE1();
    player(host, [
      { s: f[0], cap: 'Cátion <b>1-ciclobutiletila</b> (secundário, vizinho a um anel tenso de 4 membros). Uma ligação C–C do anel migra para o C⁺.' },
      { s: f[1], cap: 'Expansão de anel: forma-se o cátion <b>2-metilciclopentila</b> (anel de 5, muito menos tenso).' },
      { s: f[2], cap: 'A base fraca remove o Hβ do carbono que carrega o CH₃.' },
      { s: f[3], cap: 'Produto: <b>1-metilciclopenteno</b> (trissubstituído).' },
    ], { draw: { scale: 42, fs: 16 } });
  },
  e1e2Table(host) { e1e2Table(host); },
  mech4Table(host) { mech4Table(host); },
  matrix(host) { matrix(host); },
  flowchart(host) { flowchart(host); },
  cases(host) { cases(host); },
  lab(host) { const L = lab(host); cleanups.push(() => L.dispose()); },
  e2Sim(host) { e2Sim(host); },
  analyzer(host) { analyzer(host); },
  levelChips(host) { [...new Set(SOLVED.map((s) => s.level))].forEach((l, i) => host.append(h('a', { class: 'chip', href: '#res-' + i }, l))); },
  solved(host) {
    let lastLevel = null, li = -1;
    SOLVED.forEach((d, i) => {
      if (d.level !== lastLevel) { lastLevel = d.level; li++; host.append(h('h3', { id: 'res-' + li }, d.level)); }
      host.append(solvedCard(d, `R${i + 1}`));
    });
  },
  propEasy(host) { renderProposed(host, PROPOSED.easy, 0); },
  propMid(host) { renderProposed(host, PROPOSED.mid, 10); },
  propHard(host) { renderProposed(host, PROPOSED.hard, 25); },
  quiz(host) { quiz(host, (sec, anchor) => go(sec, anchor)); },
  challenge(host) { const c = challenge(host); cleanups.push(() => c.stop()); },
  cmap(host) { conceptMap(host); },
  summaries(host) {
    const f2 = e2Frames('EtO'), f1 = e1Frames();
    host.append(
      h('div', { class: 'defbox', style: 'border-left-color:var(--green)' }, h('b', { class: 'c-e2' }, 'E2 em um olhar'), mol(f2.a, { scale: 38, fs: 15, zoom: 1.15 }),
        h('ul', { html: '<li>uma etapa, concertada; v = k[RX][B]</li><li>base forte (HO⁻, RO⁻, t-BuO⁻)</li><li>Hβ e GA <b>anti-periplanares</b> (trans-diaxiais em ciclos)</li><li>Zaitsev (base pequena) × Hofmann (base volumosa)</li><li>estereoespecífica; sem rearranjos</li>' })),
      h('div', { class: 'defbox', style: 'border-left-color:var(--violet)' }, h('b', { class: 'c-e1' }, 'E1 em um olhar'), mol(f1[3], { scale: 38, fs: 15, zoom: 1.15 }),
        h('ul', { html: '<li>duas etapas; v = k[RX]</li><li>carbocátion intermediário (compete com SN1)</li><li>3° (ou 2°), solvente prótico, base fraca, aquecimento</li><li>rearranjos possíveis</li><li>Zaitsev; estereosseletiva (E &gt; Z)</li>' })));
  },
};

function renderProposed(host, list, offset) {
  const done = store.get('el-prop', {});
  list.forEach((d, i) => host.append(exerciseCard(d, `P${offset + i + 1}`, (num, ok) => { done[num] = ok; store.set('el-prop', done); })));
}

function conceptMap(host) {
  const col = (title, color, sub) => h('div', { style: 'display:grid;gap:8px;align-content:start' },
    h('div', { class: 'card', style: `font-size:1.3rem;font-weight:900;color:var(--${color});border-color:var(--${color})` }, title),
    h('div', { class: 'grid2', style: 'gap:8px' }, sub.map(([m, items]) => h('div', { style: 'display:grid;gap:6px;align-content:start' },
      h('div', { class: 'card', style: `font-weight:900;font-size:1.15rem;color:var(--${m === 'SN1' ? 'orange' : m === 'SN2' ? 'cyan' : m === 'E1' ? 'violet' : 'green'})` }, m),
      ...items.map(([t, href]) => h('a', { class: 'card', href, style: 'text-decoration:none;color:var(--text);text-align:left;font-size:.88rem;padding:8px 10px' }, t))))));
  host.append(
    h('div', { style: 'display:grid;justify-items:center;margin-bottom:12px' }, h('div', { class: 'card', style: 'font-size:1.3rem;font-weight:900;border-color:var(--magenta);background:linear-gradient(135deg,rgba(47,212,245,.12),rgba(61,220,151,.12))' }, 'Reações de haloalcanos'),
      h('div', { style: 'color:var(--muted);font-family:var(--mono);margin-top:6px;text-align:center' }, 'R–X + Nu/B⁻ → substituição (R–Nu) ou eliminação (C=C)')),
    h('div', { class: 'grid2' },
      col('Substituição', 'cyan', [['SN1', [['carbocátion', '#carbocations'], ['v = k[RX]', '#sn-vs-e'], ['3°, prótico, Nu fraco', '#sne-matrix'], ['racemização', '#sne-table'], ['rearranjos', '#cat-h']]], ['SN2', [['uma etapa, backside', '#sne-table'], ['v = k[RX][Nu]', '#sn-vs-e'], ['metílico/1°, Nu forte', '#sne-matrix'], ['aprótico', '#sne-matrix'], ['inversão', '#sne-table']]]]),
      col('Eliminação', 'green', [['E1', [['carbocátion', '#e1-def'], ['v = k[RX]', '#e1-def'], ['base fraca, prótico, Δ', '#e1-temp'], ['Zaitsev', '#reg-zh'], ['rearranjos', '#cat-me']]], ['E2', [['uma etapa', '#e2-def'], ['v = k[RX][B]', '#e2-def'], ['anti-periplanar', '#geo-anti'], ['Zaitsev × Hofmann', '#reg-zh'], ['estereoespecífica', '#estereo']]]])),
    h('div', { class: 'grid4', style: 'margin-top:14px' }, [['Substrato', 'metílico · 1° · 2° · 3° · alílico · benzílico'], ['Reagente', 'nucleofilicidade × basicidade × volume'], ['Solvente', 'prótico (SN1/E1) × aprótico (SN2)'], ['Temperatura', 'alta favorece eliminação']].map(([t, d]) => h('div', { class: 'card' }, h('b', null, t), h('div', null, h('small', null, d))))));
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
  Object.keys(SC).forEach((k) => delete SC[k]);
  if (!sec) return;
  sec.querySelectorAll('[data-w][data-3d]').forEach((el) => { el.innerHTML = ''; el.removeAttribute('data-done'); });
  sec.querySelectorAll('[data-act][aria-pressed]').forEach((b) => b.setAttribute('aria-pressed', 'false'));
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
    const visited = store.get('el-visited', []);
    if (!visited.includes(sec.id)) { visited.push(sec.id); store.set('el-visited', visited); }
    markVisited();
    buildPager();
    document.title = (sec.dataset.title || '') + ' · E1 e E2';
    const cur = NAV.find((a) => a.getAttribute('aria-current'));
    if (cur) cur.scrollIntoView({ block: 'nearest', inline: 'center' });
  }
  if (anchor) {
    const t = document.getElementById(anchor);
    if (t) setTimeout(() => t.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  } else { window.scrollTo(0, 0); setTimeout(() => window.scrollTo(0, 0), 0); }
}

function markVisited() {
  const visited = store.get('el-visited', []);
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
  const b = e.target.closest('[data-action],[data-act]');
  if (!b) return;
  if (b.dataset.act) {
    const k = b.dataset.act.replace('-space', '');
    const sc = SC[k];
    if (sc && sc.setStyle) { const on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', on); sc.setStyle(on ? 'space' : 'ball'); }
    return;
  }
  if (b.dataset.action === 'redo') {
    try { localStorage.removeItem('el-prop'); } catch (err) { /* nada */ }
    const sec = document.getElementById('propostos');
    sec.querySelectorAll('[data-w]').forEach((el) => { el.innerHTML = ''; el.removeAttribute('data-done'); });
    initSection(sec);
  }
});

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
go(location.hash.slice(1) || 'inicio');
window.addEventListener('load', () => {
  const t = document.getElementById(location.hash.slice(1));
  if (!t || t.classList.contains('section')) setTimeout(() => window.scrollTo(0, 0), 30);
});
