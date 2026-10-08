/*
 * tools.js — ferramentas: operações em Fischer, polarímetro, misturas
 * racêmicas, 2ⁿ, matriz de relações, laboratório 3D, simulador R/S,
 * simulador de nomenclatura, comparador, fluxograma, construtor quiral
 * e troca de grupos.
 */
import { h, seg } from './widgets2d.js';
import { el, text } from './chem2d.js';
import { LIB, LABNAMES } from './library.js';
import { makeMol, withCfg, mirrorMol, nameOf, cfgString, formula, meso, relation, rankCenter, explainCenter, ligLabel, allStereo, glab, sameStereo } from './stereo.js';
import { wedgeSVG, fischerSVG, fischerGroups, crossSVG, crossDesc, ORIENT } from './draw.js';
import { molView, mirrorScene, pairScene, swapScene } from './scenes.js';
import { M, vbox, fig, pick, select, fbBox, setFb, prioLegend, descHTML, chiralTag, genPair, apparent } from './modules.js';

const btn = (t, f, cls = '') => h('button', { class: 'btn sm ' + cls, type: 'button', onclick: f }, t);
const NS = 'http://www.w3.org/2000/svg';
const inv = (d) => (d === 'R' ? 'S' : 'R');

/* ===================================================================
 * Operações em Fischer (giro 180°, giro 90°, trocas)
 * =================================================================== */
const ONE = ['gliceraldeido', 'lactico', 'alanina', 'butanol2', 'bromobutano2'];
function crossState(mol) {
  const g = fischerGroups(mol)[0];
  return { up: g.up, dn: g.dn, left: g.left, right: g.right };
}
const lblOf = (mol, pos, prio) => {
  const r = rankCenter(mol, mol.centers[0]).order, o = {};
  Object.keys(pos).forEach((k) => { const j = pos[k]; o[k] = { t: glab(mol.groupAt[j] || ''), c: prio ? 'g' + (r.indexOf(j) + 1) : '' }; });
  return o;
};
export function fischerOps(host) {
  let mol = M('gliceraldeido'), pos = crossState(mol), d0 = null, swaps = 0, busy = false, prio = true;
  const stage = h('div', { class: 'projbox big' }), log = h('ol', { class: 'oplog' }), fb = fbBox();
  const pickSel = h('div', { class: 'controls' });
  let sel = [];
  host.append(h('div', { class: 'controls' }, h('label', null, 'Molécula ', select(ONE.map((k) => [k, (LIB[k].name || '').replace('{cfg}', '')]), 'gliceraldeido', (k) => { mol = M(k); reset(); })), btn('Prioridades', (e) => { prio = !prio; e.currentTarget.setAttribute('aria-pressed', prio); draw(0); })),
    h('div', { class: 'split' }, stage, h('div', null, h('p', null, h('b', null, 'Operações')), h('div', { class: 'controls' }, btn('↻ Girar 180° no plano', () => rot(180), 'primary'), btn('↻ Girar 90°', () => rot(90), 'accent')), h('p', { class: 'hint3' }, 'Trocar dois grupos: clique em dois grupos abaixo.'), pickSel, log, btn('⟲ Recomeçar', () => reset()))), fb);
  function draw(rotDeg) {
    stage.innerHTML = '';
    stage.append(crossSVG(lblOf(mol, pos, prio), { rot: rotDeg, maxw: 260 }));
    const d = crossDesc(mol, mol.centers[0], pos);
    stage.append(h('div', { class: 'bigdesc ' + (d === 'R' ? 'rc' : 'sc') }, d));
    pickSel.innerHTML = '';
    ['up', 'left', 'right', 'dn'].forEach((k) => pickSel.append(h('button', { class: 'btn sm', type: 'button', 'aria-pressed': sel.includes(k), onclick: () => choose(k) }, `${{ up: 'topo', dn: 'base', left: 'esq.', right: 'dir.' }[k]}: ${glab(mol.groupAt[pos[k]])}`)));
    return d;
  }
  function reset() { pos = crossState(mol); swaps = 0; sel = []; log.innerHTML = ''; fb.style.display = 'none'; d0 = draw(0); }
  function note(t, d) {
    log.append(h('li', { html: `${t} → <b class="${d === 'R' ? 'rc' : 'sc'}">${d}</b> ${d === d0 ? '(mesma molécula)' : '(enantiômero!)'}` }));
    setFb(fb, d === d0 ? 'ok' : 'bad', d === d0 ? 'A configuração foi <b>mantida</b>.' : 'A configuração foi <b>invertida</b>: agora a projeção representa o enantiômero.');
  }
  function rot(deg) {
    if (busy) return; busy = true;
    const t0 = performance.now();
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / 900);
      stage.firstChild.replaceWith(crossSVG(lblOf(mol, pos, prio), { rot: deg * k * k * (3 - 2 * k), maxw: 260 }));
      if (k < 1) requestAnimationFrame(step);
      else {
        pos = deg === 180 ? { up: pos.dn, dn: pos.up, left: pos.right, right: pos.left } : { right: pos.up, dn: pos.right, left: pos.dn, up: pos.left };
        busy = false; note(`giro de ${deg}°`, draw(0));
      }
    };
    requestAnimationFrame(step);
  }
  function choose(k) {
    if (sel.includes(k)) sel = sel.filter((x) => x !== k); else sel.push(k);
    if (sel.length === 2) { const [a, b] = sel; [pos[a], pos[b]] = [pos[b], pos[a]]; swaps++; sel = []; note(`troca ${swaps} (${a === 'up' ? 'topo' : a}/${b === 'dn' ? 'base' : b})`, draw(0)); if (swaps === 2) fb.innerHTML += ' Duas trocas = configuração <b>restaurada</b> (desde que a outra troca não a tenha mudado de novo).'; }
    else draw(0);
  }
  reset();
}

/* ===================================================================
 * R/S a partir de Fischer (gerador de exercícios)
 * =================================================================== */
export function genFischer1() {
  const mol = M(pick(ONE), [pick(['R', 'S'])]);
  let pos = crossState(mol);
  const n = 1 + Math.floor(Math.random() * 3);
  for (let i = 0; i < n; i++) { if (Math.random() < 0.5) pos = { up: pos.dn, dn: pos.up, left: pos.right, right: pos.left }; else { const ks = ['up', 'dn', 'left', 'right']; const a = pick(ks); const b = pick(ks.filter((x) => x !== a)); [pos[a], pos[b]] = [pos[b], pos[a]]; } }
  const r = rankCenter(mol, mol.centers[0]).order;
  const where4 = Object.keys(pos).find((k) => pos[k] === r[3]);
  return { mol, pos, d: crossDesc(mol, mol.centers[0], pos), vertical: where4 === 'up' || where4 === 'dn' };
}
export function fischerRS(host) {
  const stage = h('div', { class: 'projbox' }), fb = fbBox();
  let Q = null, prio = false;
  host.append(stage, h('div', { class: 'controls' }, btn('R', () => ans('R'), 'primary'), btn('S', () => ans('S'), 'primary'), btn('Mostrar prioridades', (e) => { prio = !prio; e.currentTarget.setAttribute('aria-pressed', prio); draw(); }), btn('Nova projeção →', () => next())), fb);
  function draw() { stage.innerHTML = ''; stage.append(crossSVG(lblOf(Q.mol, Q.pos, prio), { maxw: 230 })); }
  function next() { Q = genFischer1(); fb.style.display = 'none'; draw(); }
  function ans(a) {
    const ok = a === Q.d, ap = Q.vertical ? Q.d : inv(Q.d);
    setFb(fb, ok ? 'ok' : 'bad', `${ok ? '✔' : '✘'} <b>${Q.d}</b>. O grupo 4 (H) está na <b>${Q.vertical ? 'vertical (para trás)' : 'horizontal (para a frente)'}</b>: 1 → 2 → 3 no papel é ${ap === 'R' ? 'horário' : 'anti-horário'} (${ap})${Q.vertical ? ', leitura direta.' : '; como o 4 está para a frente, <b>inverta</b>.'}`);
    prio = true; draw();
  }
  next();
}

/* ===================================================================
 * Fischer com vários centros: classificação de pares
 * =================================================================== */
const MULTI = ['dibromobutano', 'tartarico', 'bromocloro', 'eritrose', 'diclorobutano', 'metilpentanol'];
export function genFischerPair() {
  const k = pick(MULTI), sp = LIB[k];
  const cf = () => [pick(['R', 'S']), pick(['R', 'S'])];
  const A = withCfg(sp, cf()), r = Math.random();
  const B = r < 0.3 ? mirrorMol(A) : r < 0.5 ? withCfg(sp, A.desc.slice()) : withCfg(sp, cf());
  return { A, B };
}
export function fischerMulti(host) {
  const figs = h('div', { class: 'figs' }), fb = fbBox();
  let P = null;
  const opts = [['idênticas', 'mesmo composto'], ['enantiômeros', 'enantiômeros'], ['diastereoisômeros', 'diastereoisômeros']];
  host.append(figs, h('div', { class: 'controls' }, ...opts.map(([k, t]) => btn(t, () => ans(k))), btn('Este par contém forma meso?', () => mesoQ()), btn('Novo par →', () => next(), 'primary')), fb);
  function next() { P = genFischerPair(); fb.style.display = 'none'; figs.innerHTML = ''; figs.append(fig(fischerSVG(P.A, { maxw: 170 }), 'A'), fig(fischerSVG(P.B, { maxw: 170 }), 'B')); }
  function ans(k) {
    const r = relation(P.A, P.B);
    setFb(fb, r.r === k ? 'ok' : 'bad', `${r.r === k ? '✔' : '✘'} <b>${r.r}</b>: A = ${cfgString(P.A)}, B = ${cfgString(P.B)}. ${r.t}.${meso(P.A) ? ' A é <b>meso</b> (plano de simetria horizontal na cruz).' : ''}`);
    figs.innerHTML = ''; figs.append(fig(fischerSVG(P.A, { maxw: 170, labels: true }), 'A'), fig(fischerSVG(P.B, { maxw: 170, labels: true }), 'B'));
  }
  function mesoQ() { const a = meso(P.A), b = meso(P.B); setFb(fb, 'neutral', `A: ${a ? '<b>meso</b>' : 'não é meso'} · B: ${b ? '<b>meso</b>' : 'não é meso'}. Uma forma meso tem centros com descritores opostos e substituintes "iguais" em cima e embaixo (plano de simetria na horizontal).`); }
  next();
}

/* ===================================================================
 * Polarímetro virtual
 * =================================================================== */
const SAMPLES = [
  { k: 'R-but', n: '(R)-butan-2-ol', a: -13.5 }, { k: 'S-but', n: '(S)-butan-2-ol', a: 13.5 },
  { k: 'R-gli', n: '(R)-gliceraldeído', a: 8.7 }, { k: 'S-lac', n: 'ácido (S)-lático', a: 3.8 },
  { k: 'rac', n: 'butan-2-ol racêmico', a: 0 }, { k: 'sac', n: 'sacarose', a: 66.5 }, { k: 'agua', n: 'água (aquiral)', a: 0 },
];
export function polarimeter(host) {
  let S = SAMPLES[0], c = 0.5, l = 1, an = 0;
  const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', '0 0 760 220'); svg.setAttribute('class', 'polsvg'); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', 'Polarímetro: fonte, polarizador, amostra, analisador e observador');
  const read = h('div', { class: 'readout' }), fb = fbBox();
  const rng = (lab, min, max, step, val, on, fmt) => { const out = h('b', { class: 'val' }, fmt(val)); const r = h('input', { type: 'range', min, max, step, value: val, 'aria-label': lab }); r.addEventListener('input', () => { on(+r.value); out.textContent = fmt(+r.value); draw(); }); return h('label', { class: 'range-row' }, lab, r, out); };
  host.append(h('div', { class: 'controls' }, h('label', null, 'Amostra ', select(SAMPLES.map((s) => [s.k, s.n]), S.k, (k) => { S = SAMPLES.find((x) => x.k === k); draw(); }))), svg,
    h('div', { class: 'grid3' }, rng('c (g/mL)', 0.05, 1, 0.05, c, (x) => { c = x; }, (x) => x.toFixed(2)), rng('l (dm)', 0.5, 2, 0.5, l, (x) => { l = x; }, (x) => x.toFixed(1)), rng('analisador', -90, 90, 0.5, an, (x) => { an = x; }, (x) => x.toFixed(1) + '°')),
    read, h('div', { class: 'controls' }, btn('Medir α', () => measure(), 'primary')), fb);
  const obs = () => S.a * l * c;
  function draw() {
    svg.innerHTML = '';
    const g = (t, a) => el(t, a, svg);
    g('line', { x1: 40, y1: 110, x2: 730, y2: 110, class: 'beam' });
    g('circle', { cx: 40, cy: 110, r: 22, class: 'lamp' }); text(svg, 40, 160, 'fonte', { class: 'plab' });
    // polarizador
    g('rect', { x: 150, y: 50, width: 16, height: 120, rx: 4, class: 'pol' }); text(svg, 158, 190, 'polarizador', { class: 'plab' });
    const plane = (x, ang, cls) => { const r = 34, a = (ang - 90) * Math.PI / 180; g('line', { x1: x - r * Math.cos(a), y1: 110 - r * Math.sin(a), x2: x + r * Math.cos(a), y2: 110 + r * Math.sin(a), class: 'pplane ' + cls }); };
    plane(115, 0, ''); plane(215, 0, '');
    // tubo de amostra
    g('rect', { x: 260, y: 82, width: 240, height: 56, rx: 26, class: 'tube' }); text(svg, 380, 190, `amostra: ${S.n}`, { class: 'plab' });
    plane(545, obs(), 'rot');
    // analisador
    g('rect', { x: 600, y: 50, width: 16, height: 120, rx: 4, class: 'pol an', transform: `rotate(${an} 608 110)` }); text(svg, 608, 190, 'analisador', { class: 'plab' });
    const I = Math.cos((an - obs()) * Math.PI / 180) ** 2;
    g('circle', { cx: 700, cy: 110, r: 24, class: 'eye', style: `fill: rgba(255, 230, 140, ${0.1 + 0.85 * I})` }); text(svg, 700, 160, 'observador', { class: 'plab' });
    read.innerHTML = `<span>intensidade no observador: <b>${Math.round(I * 100)}%</b></span><span>gire o analisador até o máximo de luz</span>`;
  }
  function measure() {
    const a = obs(), sp = a / (l * c);
    setFb(fb, 'ok', `α<sub>obs</sub> = <b>${a >= 0 ? '+' : ''}${a.toFixed(2)}°</b> (${a > 0 ? 'dextrorrotatória (+), sentido horário' : a < 0 ? 'levorrotatória (−), anti-horário' : 'sem rotação: amostra aquiral ou racêmica'}). Seu analisador: ${an.toFixed(1)}°.<br>[α] = α<sub>obs</sub> / (l · c) = ${a.toFixed(2)} / (${l.toFixed(1)} × ${c.toFixed(2)}) = <b>${sp >= 0 ? '+' : ''}${sp.toFixed(1)}</b>. ${S.k === 'R-but' ? 'Repare: (R)-butan-2-ol é (−) enquanto (R)-gliceraldeído é (+): <b>R/S não prevê o sinal</b>.' : ''}`);
  }
  draw();
}

/* ===================================================================
 * Mistura racêmica e excesso enantiomérico
 * =================================================================== */
export function racemic(host) {
  let pS = 50;
  const dots = h('div', { class: 'dots2' }), read = h('div', { class: 'readout' }), meter = h('div', { class: 'rotmeter' });
  const r = h('input', { type: 'range', min: 0, max: 100, step: 1, value: pS, 'aria-label': '% de (S)-(+)-butan-2-ol' });
  r.addEventListener('input', () => { pS = +r.value; draw(); });
  host.append(h('label', { class: 'range-row' }, '% (S)-(+)', r), dots, meter, read);
  function draw() {
    dots.innerHTML = '';
    const nS = Math.round(pS / 5);
    for (let i = 0; i < 20; i++) dots.append(h('span', { class: i < nS ? 'dS' : 'dR' }, i < nS ? 'S' : 'R'));
    const ee = Math.abs(pS - (100 - pS)), a = 13.5 * (pS - (100 - pS)) / 100;
    meter.innerHTML = `<div class="needle" style="transform:rotate(${a * 5}deg)"></div><span>[α]<sub>mistura</sub> = ${a >= 0 ? '+' : ''}${a.toFixed(1)}</span>`;
    read.innerHTML = `<span>S: <b>${pS}%</b></span><span>R: <b>${100 - pS}%</b></span><span>ee = |${Math.max(pS, 100 - pS)} − ${Math.min(pS, 100 - pS)}| = <b>${ee}%</b></span><span>${ee === 0 ? '<b class="okc">racêmico: rotação 0</b>' : ee === 100 ? 'enantiomericamente puro' : `rotação = ${ee}% da do enantiômero puro`}</span>`;
  }
  draw();
}

/* ===================================================================
 * Número de estereoisômeros (2ⁿ)
 * =================================================================== */
const COUNT = ['butanol2', 'dibromobutano', 'bromocloro', 'tartarico', 'metilpentanol', 'eritrose', 'clorometilhexanol', 'ribose', 'glicose'];
export function count2n(host) {
  const out = h('div'), list = h('div', { class: 'figs' });
  host.append(h('div', { class: 'controls' }, h('label', null, 'Composto ', select(COUNT.map((k) => [k, LABNAMES[k] || k]), 'dibromobutano', (k) => show(k)))), out, list);
  function show(k) {
    const A = allStereo(LIB[k]);
    const nm = A.list.filter((m) => meso(m)).length;
    out.innerHTML = `<div class="formula">n = <b>${A.n}</b> centro(s) → máximo 2<sup>${A.n}</sup> = <b>${A.max}</b> · existem <b>${A.list.length}</b> estereoisômeros${nm ? ` (<b>${nm}</b> meso)` : ''}</div>` + (A.list.length < A.max ? '<p class="hint3">Menos que 2ⁿ: a simetria da molécula faz duas combinações (ex.: R,S e S,R) representarem o mesmo composto meso.</p>' : '');
    list.innerHTML = '';
    const used = new Set();
    A.list.forEach((m, i) => {
      if (used.has(i)) return;
      const j = A.list.findIndex((x, n) => n !== i && sameStereo(x, mirrorMol(m)));
      const grp = h('div', { class: 'chcard pairgrp' });
      grp.append(h('div', { class: 'cardlab', html: j >= 0 ? 'par de enantiômeros' : meso(m) ? 'meso (aquiral)' : '' }));
      const row = h('div', { class: 'figs' }, fig(fischerSVG(m, { maxw: 120, labels: true }), cfgString(m)));
      if (j >= 0) { used.add(j); row.append(fig(fischerSVG(A.list[j], { maxw: 120, labels: true }), cfgString(A.list[j]))); }
      used.add(i); grp.append(row); list.append(grp);
    });
  }
  show('dibromobutano');
}

/* ===================================================================
 * Vários centros em 3D e matriz de relações
 * =================================================================== */
export function multi3d(host) {
  const grid = h('div', { class: 'grid4' });
  host.append(grid);
  [['R', 'R'], ['S', 'S'], ['R', 'S'], ['S', 'R']].forEach((cf, i) => {
    const m = M('metilpentanol', cf), v = vbox('short');
    grid.append(h('div', { class: 'chcard' }, h('div', { class: 'cardlab', html: `<b>${'ABCD'[i]}</b> · ${cfgString(m)}` }), v));
    const mv = molView(v, m, { camPos: [0, 0.4, 11] }); void mv;
  });
}
export function relMatrix(host) {
  const box = h('div'), fb = fbBox();
  let key = 'bromocloro';
  host.append(seg([['bromocloro', '2-bromo-3-clorobutano'], ['dibromobutano', '2,3-dibromobutano (com meso)']], key, (k) => { key = k; draw(); }, 'Composto'), box, h('div', { class: 'controls' }, btn('Conferir matriz', () => check(), 'primary'), btn('Mostrar respostas', () => check(true))), fb);
  let mols = [], cells = [];
  function draw() {
    fb.style.display = 'none';
    mols = [['R', 'R'], ['S', 'S'], ['R', 'S'], ['S', 'R']].map((c) => M(key, c));
    box.innerHTML = '';
    box.append(h('div', { class: 'figs' }, mols.map((m, i) => fig(fischerSVG(m, { maxw: 120, labels: true }), `<b>${'ABCD'[i]}</b> ${cfgString(m)}`))));
    const t = h('table', { class: 'cmp matrix' }), head = h('tr', null, h('th', null, ''));
    mols.forEach((m, i) => head.append(h('th', null, 'ABCD'[i])));
    t.append(h('thead', null, head)); const tb = h('tbody'); cells = [];
    mols.forEach((a, i) => {
      const tr = h('tr', null, h('th', null, 'ABCD'[i]));
      mols.forEach((b, j) => {
        if (j <= i) { tr.append(h('td', { class: 'dim' }, j === i ? '—' : '')); return; }
        const s = select([['', '?'], ['idênticas', 'idênticas'], ['enantiômeros', 'enantiômeros'], ['diastereoisômeros', 'diastereoisômeros']], '', () => {}, `Relação ${'ABCD'[i]}–${'ABCD'[j]}`);
        cells.push({ s, r: relation(a, b).r }); tr.append(h('td', null, s));
      });
      tb.append(tr);
    });
    t.append(tb); box.append(h('div', { class: 'table-wrap' }, t));
  }
  function check(rev) {
    let n = 0; cells.forEach((c) => { if (rev) c.s.value = c.r; const ok = c.s.value === c.r; c.s.classList.toggle('ok', ok); c.s.classList.toggle('bad', !ok); if (ok) n++; });
    setFb(fb, n === cells.length ? 'ok' : 'bad', `${n}/${cells.length} corretas. Enantiômeros: <b>todos</b> os centros invertidos; diastereoisômeros: <b>parte</b> deles.${key === 'dibromobutano' ? ' Aqui (R,S) e (S,R) são o <b>mesmo</b> composto meso: só 3 estereoisômeros.' : ' Com dois centros diferentes, 4 estereoisômeros = 2 pares de enantiômeros.'}`);
  }
  draw();
}

/* ===================================================================
 * Laboratório Estereoquímico 3D
 * =================================================================== */
const LABKEYS = ['butanol2', 'bromobutano2', 'lactico', 'metilpentanol', 'dibromobutano', 'diclorobutano', 'butanodiol', 'tartarico', 'bromocloro', 'gliceraldeido', 'alanina', 'bcf', 'metilhexano3', 'eritrose', 'clorometilhexanol', 'ribose', 'propan2ol'];
export function lab(host) {
  let key = 'butanol2', cfg = null, mol = null, mv = null, center = null, repr = 'wedge';
  const v = vbox('tall'), info = h('div', { class: 'readout' }), rep = h('div', { class: 'projbox' }), cfgBox = h('div', { class: 'controls' }), cenBox = h('div', { class: 'controls' });
  const mirrorHost = h('div'), fb = fbBox();
  const side = h('div', { class: 'labside' },
    h('div', { class: 'optgroup-t' }, 'Molécula'), select(LABKEYS.map((k) => [k, LABNAMES[k] || k]), key, (k) => { key = k; cfg = null; center = null; load(); }, 'Molécula'),
    h('div', { class: 'optgroup-t' }, 'Configuração'), cfgBox,
    h('div', { class: 'optgroup-t' }, 'Visual'), h('div', { class: 'controls' }, btn('Bola-vareta / volume', (e) => e.currentTarget.setAttribute('aria-pressed', mv.toggle('space'))), btn('Centros', (e) => e.currentTarget.setAttribute('aria-pressed', mv.toggle('centers')))),
    h('div', { class: 'optgroup-t' }, 'Centro / prioridades'), cenBox,
    h('div', { class: 'optgroup-t' }, 'Ações'), h('div', { class: 'controls' }, btn('Grupo 4 para trás', () => { if (center === null) pickCenter(mol.centers[0]); mv.look4(center, true); }), btn('Atribuir R/S', () => assign(), 'primary'), btn('Gerar enantiômero', () => enant(), 'accent'), btn('⟲ Vista', () => { mv.reset(); mv.hideArrow(); })),
    h('div', { class: 'optgroup-t' }, 'Converter'), seg([['wedge', 'cunha/tracejado'], ['fischer', 'Fischer'], ['none', 'só 3D']], 'wedge', (k) => { repr = k; drawRep(); }, 'Representação'));
  host.append(h('div', { class: 'labgrid' }, side, h('div', null, v, prioLegend(), info, rep, fb, mirrorHost)));
  function load() {
    mol = cfg ? M(key, cfg) : M(key); fb.style.display = 'none'; mirrorHost.innerHTML = '';
    if (!mv) mv = molView(v, mol, { camPos: [0, 0.6, 11], onPick: (i) => { if (mol.centers.includes(i)) pickCenter(i); } }); else { mv.setMol(mol); mv.reset(); }
    cfgBox.innerHTML = '';
    mol.C.forEach((c, k) => { if (!mol.desc[k]) return; cfgBox.append(h('span', { class: 'hint3' }, `C${mol.spec.loc[k]}`), seg([['R', 'R'], ['S', 'S']], mol.desc[k], (d) => { const n = mol.desc.slice(); n[k] = d; cfg = n; load(); }, `C${mol.spec.loc[k]}`)); });
    if (!mol.centers.length) cfgBox.append(h('span', { class: 'hint3' }, 'sem centros estereogênicos'));
    cenBox.innerHTML = '';
    mol.centers.forEach((c) => cenBox.append(btn(`C${mol.spec.loc[mol.C.indexOf(c)]}`, () => pickCenter(c))));
    if (center !== null && !mol.centers.includes(center)) center = null;
    if (center !== null) pickCenter(center);
    info.innerHTML = `<span><b>${nameOf(mol)}</b></span><span>${formula(mol)}</span><span>${chiralTag(mol)}</span><span>${mol.centers.length} centro(s)</span>`;
    drawRep();
  }
  function pickCenter(c) { center = c; mv.setPrio(c); mv.hideArrow(); cenBox.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', b.textContent === `C${mol.spec.loc[mol.C.indexOf(c)]}`)); drawRep(); }
  function drawRep() {
    rep.innerHTML = '';
    if (repr === 'wedge') rep.append(fig(wedgeSVG(mol, { prio: center ?? undefined, scale: 40 }), 'cunha/tracejado'));
    if (repr === 'fischer' && mol.centers.length) rep.append(fig(fischerSVG(mol, { prio: center !== null ? center : undefined, labels: false, maxw: 200 }), 'projeção de Fischer'));
  }
  function assign() {
    if (!mol.centers.length) { setFb(fb, 'neutral', 'Esta molécula não tem centro estereogênico.'); return; }
    if (center === null) pickCenter(mol.centers[0]);
    mv.look4(center, true);
    const E = explainCenter(mol, center), k = mol.C.indexOf(center);
    setFb(fb, 'ok', `C${mol.spec.loc[k]}: ${E.lig.map((l) => `<span class="pchip p${l.rank}">${l.rank}</span> ${l.label}`).join(' ')} → com o 4 atrás, 1 → 2 → 3 é ${mol.desc[k] === 'R' ? 'horário: <b>R</b>' : 'anti-horário: <b>S</b>'}.<br>Todos: ${descHTML(mol)}.`);
  }
  function enant() {
    mirrorHost.innerHTML = '';
    const vv = vbox(), q = h('div', { class: 'controls' }), f2 = fbBox();
    mirrorHost.append(h('h4', null, 'Molécula e imagem especular'), vv, h('p', { class: 'prompt' }, 'Essa imagem é sobreponível à molécula original?'), q, f2);
    const sc = mirrorScene(vv, mol);
    const answer = (yes) => sc.overlay((r) => { const sup = r.rmsd < 0.15; setFb(f2, yes === sup ? 'ok' : 'bad', `${yes === sup ? '✔' : '✘'} ${sup ? '<b>Sim</b>: sobreponível → aquiral' + (mol.centers.length ? ' (meso).' : '.') : `<b>Não</b>: ${r.bad} átomo(s) não coincidem → a imagem é o <b>enantiômero</b>, ${nameOf(mirrorMol(mol))}.`}`); });
    q.append(btn('Sim, sobreponível', () => answer(true)), btn('Não', () => answer(false)));
  }
  load();
}

/* ===================================================================
 * Simulador R/S em 5 etapas
 * =================================================================== */
const SIM = [['butanol2'], ['bromobutano2'], ['lactico'], ['gliceraldeido'], ['alanina'], ['propanodiol'], ['metilhexano3'], ['cloropropenol'], ['deuterioetanol'], ['metilpentanol', 0], ['bromocloro', 1]];
export function rsSim(host) {
  const v = vbox('tall'), q = h('div', { class: 'simq' }), fb = fbBox(), stepsBar = h('div', { class: 'timeline' });
  let mol = null, mv = null, c = null, step = 1, tries = 0;
  const NAMES = ['Centro', 'Prioridades', 'Grupo 4 atrás', 'Sentido', 'Descritor'];
  host.append(stepsBar, h('div', { class: 'split' }, v, h('div', null, q, fb)), h('div', { class: 'controls' }, btn('Nova molécula →', () => load()), btn('Posicionar grupo 4 para trás', () => { if (step >= 3) { mv.look4(c, true); } else setFb(fb, 'neutral', 'Primeiro conclua as etapas 1 e 2.'); })), prioLegend());
  function bar() { stepsBar.innerHTML = ''; NAMES.forEach((t, i) => stepsBar.append(h('button', { type: 'button', class: i + 1 === step ? 'on' : '', disabled: true }, h('b', null, String(i + 1)), ' ' + t))); }
  function load() {
    const [k, idx] = pick(SIM);
    mol = M(k, LIB[k].cfg.map(() => pick(['R', 'S'])));
    c = mol.C[idx || 0]; if (!mol.centers.includes(c)) c = mol.centers[0];
    step = 1; tries = 0; fb.style.display = 'none';
    if (!mv) mv = molView(v, mol, { camPos: [0.5, 2.5, 10], centers: false, onPick: (i) => onPick(i) }); else { mv.setMol(mol); }
    mv.reset(); mv.setPrio(null); mv.hideArrow();
    render();
  }
  function render() {
    bar(); q.innerHTML = '';
    const nm = nameOf(mol).replace(/\([^)]*\)-/, '');
    if (step === 1) q.append(h('h4', null, `1 · Encontre o centro estereogênico`), h('p', { html: `<b>${nm}</b>${mol.centers.length > 1 ? ` — use o centro <b>C${mol.spec.loc[mol.C.indexOf(c)]}</b>` : ''}. Clique no carbono com quatro grupos diferentes.` }), h('div', { class: 'controls' }, h('span', { class: 'hint3' }, 'ou escolha:'), ...mol.C.map((a, k) => btn('C' + mol.spec.loc[k], () => onPick(a)))));
    if (step === 2) {
      const E = explainCenter(mol, c), lig = E.lig.slice().sort((a, b) => a.j - b.j);
      const sels = lig.map((l) => ({ l, s: select([['', '?'], ['1', '1'], ['2', '2'], ['3', '3'], ['4', '4']], '', () => {}, 'Prioridade de ' + l.label) }));
      q.append(h('h4', null, '2 · Atribua as prioridades CIP'), h('div', { class: 'qgrid' }, sels.map((x) => h('label', null, h('b', null, x.l.label), x.s))), btn('Conferir prioridades', () => {
        const wrong = sels.filter((x) => +x.s.value !== x.l.rank);
        sels.forEach((x) => { x.s.classList.toggle('ok', +x.s.value === x.l.rank); x.s.classList.toggle('bad', +x.s.value !== x.l.rank); });
        if (!wrong.length) { mv.setPrio(c); setFb(fb, 'ok', '✔ Prioridades corretas. ' + E.pairs.map((p) => `${p.a} &gt; ${p.b} (${p.why})`).join('; ')); step = 3; setTimeout(render, 400); return; }
        tries++;
        const p = E.pairs.find((pp) => wrong.some((w) => w.l.label === pp.a || w.l.label === pp.b));
        setFb(fb, 'bad', `✘ ${wrong.length} prioridade(s) errada(s). ${p ? `Dica: compare <b>${p.a}</b> e <b>${p.b}</b> — ${tries > 1 ? p.why : 'olhe a camada 1 (número atômico) e, se empatar, a camada seguinte.'}` : ''}`);
      }, 'primary'));
    }
    if (step === 3) q.append(h('h4', null, '3 · Coloque o grupo 4 para trás'), h('p', { html: 'Arraste o modelo até o grupo <b>4</b> (cinza) apontar para longe de você, atrás do carbono. Depois confira.' }), btn('Conferir orientação', () => {
      const d = mv.group4Away(c);
      if (d < -0.75) { setFb(fb, 'ok', '✔ O grupo 4 está atrás.'); step = 4; render(); }
      else { tries++; setFb(fb, 'bad', `✘ Ainda não: o grupo 4 ${d > 0.3 ? 'aponta para você' : 'está de lado'}. ${tries > 1 ? 'Use “Posicionar grupo 4 para trás”.' : 'Gire mais um pouco.'}`); }
    }, 'primary'));
    if (step === 4) q.append(h('h4', null, '4 · Sentido de 1 → 2 → 3'), h('div', { class: 'controls' }, btn('Horário ↻', () => dir('R')), btn('Anti-horário ↺', () => dir('S'))));
    if (step === 5) q.append(h('h4', null, '5 · Descritor'), h('div', { class: 'controls' }, btn('R', () => fin('R'), 'primary'), btn('S', () => fin('S'), 'primary')));
  }
  function onPick(i) {
    if (step !== 1) return;
    if (i === c) { setFb(fb, 'ok', '✔ Esse é o centro: quatro grupos diferentes.'); step = 2; render(); return; }
    if (mol.atoms[i].el !== 'C') { setFb(fb, 'bad', 'Centros estereogênicos aqui são carbonos (esferas cinza-escuras).'); return; }
    setFb(fb, 'bad', mol.centers.includes(i) ? 'Esse também é um centro, mas o exercício pede o indicado.' : '✘ Esse carbono não tem quatro grupos diferentes.');
  }
  function dir(d) {
    const d0 = mol.desc[mol.C.indexOf(c)];
    if (mv.group4Away(c) > -0.6) mv.look4(c, true);
    mv.showArrow(true);
    if (d === d0) { setFb(fb, 'ok', `✔ ${d === 'R' ? 'Horário' : 'Anti-horário'}.`); step = 5; render(); }
    else setFb(fb, 'bad', '✘ Siga a seta amarela 1 → 2 → 3 com o 4 atrás. Lembre: ignore o grupo 4.');
  }
  function fin(d) {
    const d0 = mol.desc[mol.C.indexOf(c)];
    setFb(fb, d === d0 ? 'ok' : 'bad', d === d0 ? `✔ <b>${d0}</b>! Nome completo: <b>${nameOf(mol)}</b>.` : `✘ Com o 4 atrás, ${d0 === 'R' ? 'horário = R' : 'anti-horário = S'}.`);
  }
  load();
}

/* ===================================================================
 * Simulador de nomenclatura (passo a passo)
 * =================================================================== */
const DISTR = {
  butanol2: ['butan-3-ol', '2-metilpropan-1-ol'], bromobutano2: ['3-bromobutano', '1-bromo-1-metilpropano'], dibromobutano: ['1,2-dibromobutano', '2,2-dibromobutano'],
  bromocloro: ['3-bromo-2-clorobutano', '2-cloro-3-bromobutano'], metilpentanol: ['3-metilpentan-4-ol', '2-etilbutan-3-ol'], clmh: ['3-cloro-4-metil-hexan-5-ol', '4-metil-3-cloro-hexan-2-ol'],
  diclorobutano: ['1,4-diclorobutano', '2,2-diclorobutano'], metilhexano3: ['4-metil-hexano', '2-etilpentano'],
};
const NAMEKEYS = ['butanol2', 'bromobutano2', 'dibromobutano', 'bromocloro', 'metilpentanol', 'clorometilhexanol', 'diclorobutano', 'metilhexano3'];
export function nameSim(host) {
  const figb = h('div', { class: 'projbox' }), q = h('div'), fb = fbBox();
  let mol = null, st = 1;
  host.append(h('div', { class: 'split' }, figb, h('div', null, q, fb)), h('div', { class: 'controls' }, btn('Outra molécula →', () => load(), 'primary')));
  const base = () => mol.spec.name.replace('{cfg}', '').replace('{meso}', '');
  function load() {
    const k = pick(NAMEKEYS); mol = M(k, LIB[k].cfg.map(() => pick(['R', 'S']))); st = 1; fb.style.display = 'none';
    figb.innerHTML = ''; figb.append(fig(wedgeSVG(mol, { scale: 40 }), 'dê o nome completo'));
    render();
  }
  function render() {
    q.innerHTML = '';
    const locs = mol.centers.map((c) => mol.spec.loc[mol.C.indexOf(c)]);
    if (st >= 1) {
      const opts = [base(), ...(DISTR[mol.spec.family] || [])];
      q.append(h('h4', null, '1 · Nome do composto (sem estereoquímica)'), h('div', { class: 'controls' }, ...[...new Set(opts)].sort().map((o) => btn(o, () => { if (o === base()) { st = Math.max(st, 2); setFb(fb, 'ok', '✔ Esqueleto e substituintes corretos.'); render(); } else setFb(fb, 'bad', '✘ Escolha a cadeia mais longa, numere dando o menor locante ao grupo principal (–OH) ou, sem ele, aos substituintes, e cite os substituintes em ordem alfabética.'); }))));
    }
    if (st >= 2) {
      const inp = h('input', { type: 'text', placeholder: 'ex.: 2,3', 'aria-label': 'Locantes', size: 8 });
      q.append(h('h4', null, '2 · Locantes dos centros estereogênicos'), h('div', { class: 'controls' }, inp, btn('OK', () => { const v = inp.value.replace(/\s/g, ''); if (v === locs.join(',')) { st = Math.max(st, 3); setFb(fb, 'ok', `✔ Centros em C${locs.join(' e C')}.`); render(); } else setFb(fb, 'bad', `✘ Procure os carbonos com quatro grupos diferentes (são ${locs.length}).`); })));
    }
    if (st >= 3) {
      const sels = mol.centers.map((c, i) => ({ c, s: select([['', '?'], ['R', 'R'], ['S', 'S']], '', () => {}, 'C' + locs[i]) }));
      q.append(h('h4', null, '3 · Descritor de cada centro'), h('div', { class: 'qgrid' }, sels.map((x, i) => h('label', null, `C${locs[i]}`, x.s))), btn('Conferir', () => { const ok = sels.every((x) => x.s.value === mol.desc[mol.C.indexOf(x.c)]); sels.forEach((x) => x.s.classList.toggle(x.s.value === mol.desc[mol.C.indexOf(x.c)] ? 'ok' : 'bad', true)); if (ok) { st = Math.max(st, 4); setFb(fb, 'ok', '✔ Descritores corretos.'); render(); } else setFb(fb, 'bad', '✘ Use o simulador R/S se precisar: prioridades, 4 para trás, sentido.'); }, 'primary'));
    }
    if (st >= 4) {
      const cs = cfgString(mol), right = nameOf(mol);
      const wrong1 = right.replace(cs, cs.replace(/\d/g, '')), wrong2 = right.replace(cs + '-', '') + ' ' + cs, wrong3 = right.replace(cs, cs.replace(/R/g, 'x').replace(/S/g, 'R').replace(/x/g, 'S'));
      const opts = [...new Set([right, wrong1, wrong2, wrong3])].sort();
      q.append(h('h4', null, '4 · Monte o nome completo'), h('div', { class: 'mcq' }, opts.map((o) => h('button', { class: 'mopt', type: 'button', onclick: (e) => { e.currentTarget.classList.add(o === right ? 'right' : 'wrong'); setFb(fb, o === right ? 'ok' : 'bad', o === right ? `✔ <b>${right}</b>: descritores entre parênteses, com locantes, antes do nome, separados por hífen.${meso(mol) ? ' (É a forma meso.)' : ''}` : '✘ Formato: (locante+descritor, ...)-nome.'); } }, o))));
    }
  }
  load();
}

/* ===================================================================
 * Comparador A × B (6 etapas) + sobreposição 3D
 * =================================================================== */
const CMP_KEYS = ['butanol2', 'butanol1', 'bromobutano2', 'bromobutano1', 'lactico', 'dibromobutano', 'diclorobutano', 'bromocloro', 'metilpentanol', 'tartarico', 'propan2ol'];
export function comparator(host) {
  const v = vbox('tall'), steps = h('ol', { class: 'rssteps' }), fb = fbBox();
  let A = null, B = null, sc = null;
  const pane = (lab, onChange) => {
    let key = lab === 'A' ? 'dibromobutano' : 'dibromobutano', cfg = null;
    const box = h('div', { class: 'chcard' }), cb = h('div', { class: 'controls' }), f = h('div', { class: 'projbox small' });
    const api = {
      get mol() { return cfg ? M(key, cfg) : M(key); },
      init(k, c) { key = k; cfg = c; sl.value = k; draw(); },
    };
    function draw() {
      const m = api.mol; cfg = m.desc.slice(); cb.innerHTML = '';
      m.C.forEach((c, k) => { if (m.desc[k]) cb.append(h('span', { class: 'hint3' }, `C${m.spec.loc[k]}`), seg([['R', 'R'], ['S', 'S']], m.desc[k], (d) => { cfg[k] = d; draw(); onChange(); }, `C${m.spec.loc[k]}`)); });
      f.innerHTML = ''; f.append(wedgeSVG(m, { scale: 32, orient: lab === 'B' ? 'flip' : 'base' }));
    }
    const sl = select(CMP_KEYS.map((k) => [k, LABNAMES[k] || k]), key, (k) => { key = k; cfg = null; draw(); onChange(); }, 'Molécula ' + lab);
    box.append(h('h4', null, lab), sl, cb, f);
    api.box = box; return api;
  };
  const pa = pane('A', () => upd()), pb = pane('B', () => upd());
  host.append(h('div', { class: 'grid2' }, pa.box, pb.box), h('div', { class: 'controls' }, btn('Explicar em 6 etapas', () => explain(), 'primary'), btn('⧉ Sobrepor moléculas', () => over(), 'accent'), btn('Par aleatório', () => randomPair())), v, steps, fb);
  function randomPair() {
    if (Math.random() < 0.15) { const [a, b] = pick([['butanol2', 'butanol1'], ['bromobutano2', 'bromobutano1']]); pa.init(a, null); pb.init(b, null); upd(); return; }
    const k = pick(['butanol2', 'bromobutano2', 'lactico', 'dibromobutano', 'diclorobutano', 'bromocloro', 'metilpentanol', 'tartarico']);
    const rc = () => LIB[k].cfg.map(() => pick(['R', 'S'])), a = rc(), r = Math.random();
    pa.init(k, a); pb.init(k, r < 0.3 ? a.map(inv) : r < 0.5 ? a.slice() : rc()); upd();
  }
  pa.init('dibromobutano', ['R', 'R']); pb.init('dibromobutano', ['S', 'S']);
  function upd() { A = pa.mol; B = pb.mol; steps.innerHTML = ''; fb.style.display = 'none'; if (!sc) sc = pairScene(v, A, B, { rotInit: [0.4, 1.2, 0.3] }); else sc.set(A, B, [0.4, 1.2, 0.3]); }
  function explain() {
    const r = relation(A, B), fA = formula(A), fB = formula(B);
    const S6 = [
      `<b>Fórmula molecular</b>: ${fA} × ${fB} → ${fA === fB ? 'iguais' : 'diferentes: não são isômeros'}.`,
      `<b>Conectividade</b>: ${A.spec.family === B.spec.family ? 'mesma sequência de ligações' : 'diferente → isômeros constitucionais'}.`,
      `<b>Centros estereogênicos</b>: A tem ${A.centers.length}, B tem ${B.centers.length}.`,
      `<b>Descritores</b>: A ${cfgString(A) || '—'} · B ${cfgString(B) || '—'}.`,
      `<b>Comparação</b>: ${r.r === 'enantiômeros' ? 'todos os centros invertidos' : r.r === 'diastereoisômeros' ? 'só parte dos centros invertida' : r.r === 'idênticas' ? (A.desc.join() === B.desc.join() ? 'descritores iguais' : 'descritores equivalentes por simetria (meso)') : 'não se aplica'}.`,
      `<b>Conclusão</b>: <b>${r.r}</b>. ${meso(A) || meso(B) ? 'Atenção: há forma meso.' : ''}`,
    ];
    if (fA !== fB || A.spec.family !== B.spec.family) S6.splice(2, 3, '— (as etapas 3–5 só se aplicam a estereoisômeros)');
    steps.innerHTML = ''; S6.forEach((s) => steps.append(h('li', { html: s })));
  }
  function over() {
    if (A.spec.family !== B.spec.family) { setFb(fb, 'bad', 'Conectividades diferentes: não faz sentido sobrepor átomo a átomo.'); return; }
    sc.check((r) => setFb(fb, r.rmsd < 0.15 ? 'ok' : 'bad', r.rmsd < 0.15 ? '✔ Sobreponíveis: mesma molécula.' : `Não sobreponíveis: ${r.bad} átomo(s) fora do lugar na melhor sobreposição.`));
  }
  upd();
}

/* ===================================================================
 * Fluxograma de decisão (aplicado a um par)
 * =================================================================== */
export function decTree(host) {
  const crumbs = h('div', { class: 'crumbs' }), qbox = h('div', { class: 'q' }), figs = h('div', { class: 'figs' }), fb = fbBox();
  let P = null, node = 'formula', path = [];
  host.append(h('div', { class: 'tree' }, figs, crumbs, qbox), fb, h('div', { class: 'controls' }, btn('Novo par →', () => start(), 'primary')));
  const T = {
    formula: { q: 'Têm a mesma fórmula molecular?', yes: 'conect', no: 'END:não são isômeros', truth: () => formula(P.A) === formula(P.B) },
    conect: { q: 'Têm a mesma conectividade?', yes: 'super', no: 'END:isômeros constitucionais', truth: () => P.A.spec.family === P.B.spec.family },
    super: { q: 'São sobreponíveis (girando, sem quebrar ligações)?', yes: 'END:mesma molécula', no: 'espelho', truth: () => relation(P.A, P.B).r === 'idênticas' },
    espelho: { q: 'São imagens especulares uma da outra?', yes: 'END:enantiômeros', no: 'END:diastereoisômeros', truth: () => relation(P.A, P.B).r === 'enantiômeros' },
  };
  function start() { P = Math.random() < 0.2 ? genPair('const') : genPair(); node = 'formula'; path = []; fb.style.display = 'none'; figs.innerHTML = ''; figs.append(fig(wedgeSVG(P.A, { scale: 32 }), 'A'), fig(wedgeSVG(P.B, { scale: 32, orient: pick(Object.keys(ORIENT)) }), 'B')); draw(); }
  function draw() {
    crumbs.innerHTML = ''; path.forEach((p) => crumbs.append(h('span', { class: 'chip' }, p)));
    qbox.innerHTML = '';
    if (node.startsWith('END:')) {
      const res = node.slice(4);
      const extra = res === 'mesma molécula' && meso(P.A) ? ' — e, como tem centros estereogênicos mas coincide com sua imagem, é <b>meso</b>.' : '';
      qbox.append(h('h4', { html: `Conclusão: <b>${res}</b>${extra}` }));
      return;
    }
    const n = T[node];
    qbox.append(h('h4', null, n.q), h('div', { class: 'answers' }, btn('Sim', () => ans(true)), btn('Não', () => ans(false))));
  }
  function ans(a) {
    const n = T[node], t = n.truth();
    if (a !== t) { setFb(fb, 'bad', `✘ Confira: ${node === 'formula' ? `${formula(P.A)} × ${formula(P.B)}` : node === 'conect' ? 'compare quem está ligado a quem' : node === 'super' ? `A: ${cfgString(P.A)} · B: ${cfgString(P.B)}` : 'todos os centros invertidos = imagem especular'}.`); return; }
    fb.style.display = 'none'; path.push(`${n.q.replace('?', '')}: ${a ? 'sim' : 'não'}`); node = a ? n.yes : n.no; draw();
  }
  start();
}

/* ===================================================================
 * Construtor quiral
 * =================================================================== */
const SUBS = ['H', 'CH3', 'OH', 'Cl', 'Br', 'Et'];
export function chiralBuilder(host) {
  const g = ['Br', 'Cl', 'CH3', 'H'];
  const v = vbox(), fb = fbBox(), f = h('div', { class: 'projbox small' });
  const row = h('div', { class: 'qgrid' });
  ['topo (no plano)', 'cunha', 'tracejado', 'base (no plano)'].forEach((t, i) => row.append(h('label', null, t, select(SUBS.map((s) => [s, glab(s)]), g[i], (s) => { g[i] = s; }, t))));
  host.append(row, h('div', { class: 'controls' }, btn('Montar', () => buildIt(), 'primary')), h('div', { class: 'split' }, h('div', null, f, fb), v));
  function buildIt() {
    const spec = { family: 'cx-' + g.slice().sort().join(), name: '', chain: [g[0], { f: g[1], b: g[2] }, g[3]], loc: [1] };
    const m = makeMol(spec);
    f.innerHTML = ''; f.append(wedgeSVG(m, { scale: 40, labelCH3: true }));
    v.innerHTML = '';
    if (!m.centers.length) {
      const dup = g.filter((x, i) => g.indexOf(x) !== i);
      setFb(fb, 'bad', `Não é centro estereogênico: o grupo <b>${glab(dup[0])}</b> aparece duas vezes. A molécula coincide com sua imagem especular (aquiral).`);
      molView(v, m, { camPos: [0, 0.6, 9] });
      return;
    }
    const E = explainCenter(m, m.centers[0]);
    setFb(fb, 'ok', `✔ Quatro grupos diferentes → <b>centro estereogênico</b>. Prioridades: ${E.lig.map((l) => `<span class="pchip p${l.rank}">${l.rank}</span> ${l.label}`).join(' ')}. À esquerda: <b>${m.desc[0]}</b>; no espelho: <b>${inv(m.desc[0])}</b>. São enantiômeros.`);
    mirrorScene(v, m).showImage(true);
  }
  buildIt();
}

/* ===================================================================
 * Troca de dois grupos
 * =================================================================== */
export function swapTool(host) {
  const v = vbox(), fb = fbBox(), bx = h('div', { class: 'controls' }), log = h('div', { class: 'readout' });
  let sc = null, sel = [], n = 0, d0 = null, mol = null;
  host.append(h('div', { class: 'controls' }, h('label', null, 'Molécula ', select([['butanol2', 'butan-2-ol'], ['bromobutano2', '2-bromobutano'], ['lactico', 'ácido lático'], ['bcf', 'bromoclorofluorometano']], 'butanol2', (k) => load(k)))), v, h('p', { class: 'hint3' }, 'Escolha dois grupos e clique em Trocar.'), bx, log, fb);
  function load(k) {
    mol = M(k); v.innerHTML = ''; sc = swapScene(v, mol); n = 0; sel = []; d0 = mol.desc[0]; fb.style.display = 'none';
    draw();
  }
  function draw() {
    bx.innerHTML = '';
    const c = mol.centers[0], r = rankCenter(mol, c).order;
    sc.lig.forEach((j) => bx.append(h('button', { class: 'btn sm', type: 'button', 'aria-pressed': sel.includes(j), onclick: () => { if (sel.includes(j)) sel = sel.filter((x) => x !== j); else if (sel.length < 2) sel.push(j); draw(); } }, h('span', { class: 'pchip p' + (r.indexOf(j) + 1) }, String(r.indexOf(j) + 1)), ' ' + ligLabel(mol, c, j))));
    bx.append(btn('⇄ Trocar', () => { if (sel.length !== 2) return; const [a, b] = sel; sel = []; sc.swap(a, b, (d) => { n++; log.innerHTML = `<span>trocas: <b>${n}</b></span><span>configuração: <b class="${d === 'R' ? 'rc' : 'sc'}">${d}</b></span>`; setFb(fb, d === d0 ? 'ok' : 'bad', d === d0 ? `${n} trocas (número par) → configuração <b>original</b> (${d}).` : `${n} troca(s) (número ímpar) → configuração <b>invertida</b> (${d0} → ${d}): agora é o enantiômero.`); draw(); }); }, 'primary'), btn('⟲', () => load(mol.spec.family === 'bcf' ? 'bcf' : Object.keys(LIB).find((k) => LIB[k].family === mol.spec.family))));
    if (!n) log.innerHTML = `<span>trocas: <b>0</b></span><span>configuração: <b class="${d0 === 'R' ? 'rc' : 'sc'}">${d0}</b></span>`;
  }
  load('butanol2');
}

export { apparent, inv };
