/*
 * modules.js — componentes interativos dos módulos: painel sincronizado
 * 3D + Newman + cavalete + energia, diedro, passo a passo da Newman,
 * conversão Newman ↔ cavalete, tensões, cicloalcanos, cadeira (axial/
 * equatorial, up/down, inversão, perfil de energia, barco), substituintes,
 * dissubstituídos, construtores e laboratório conformacional.
 */
import { h, seg, tgl, shuffle } from './widgets2d.js';
import { mol, S, ringPts } from './chem2d.js';
import { lobe, VIEWERS } from './viewer3d.js';
import { GROUPS, gname, ROTORS, rotorE, rotorProfile, confName, mainDihedral, rotorAngles, ringGeom, flipParams, flipE, flipName, CONFS6, analyzeChair, relation, roleOf, V } from './conf.js';
import { newmanData, newmanSVG, sawhorseSVG, energyPlot, chairSVG } from './draw.js';
import { rotorScene, ringScene, chairScene, multiRotorScene } from './scenes.js';

const kj = (e) => e.toFixed(1).replace('.', ',');
const box = (cls, ...k) => h('div', { class: cls }, ...k);
const caption = (t) => h('div', { class: 'pcap2', html: t });

/* ===================================================================
 * Painel sincronizado: 3D + Newman + cavalete + gráfico de energia
 * o: { rotors: [...], start, energy, saw, newman, dirToggle, planes, phi, look }
 * =================================================================== */
export function rotorPanel(host, o = {}) {
  const keys = o.rotors || ['etano'];
  const st = { key: o.start || keys[0], phi: o.phi !== undefined ? o.phi : 0, dir: 'fwd' };
  let R = o.R || ROTORS[st.key];
  const vbox = h('div', { class: 'viewer' + (o.tall ? ' tall' : '') });
  const nbox = h('div', { class: 'projbox' }), sbox = h('div', { class: 'projbox' });
  const read = h('div', { class: 'readout', 'aria-live': 'polite' });
  const ebox = h('div');
  const range = h('input', { type: 'range', min: 0, max: 360, step: 1, value: st.phi, 'aria-label': 'Girar o carbono de trás (graus)' });
  const presets = h('div', { class: 'presets' }, [0, 60, 120, 180, 240, 300, 360].map((a) => h('button', { class: 'btn sm', type: 'button', onclick: () => setPhi(a % 360 === 0 && a ? 360 : a) }, a + '°')));
  let spin = null;
  const playB = h('button', { class: 'btn sm primary', type: 'button', onclick: () => { if (spin) { clearInterval(spin); spin = null; playB.textContent = '▶ Girar 360°'; return; } playB.textContent = '❚❚ Pausar'; spin = setInterval(() => { const p = (st.phi + 2) % 361; setPhi(p); if (p >= 360) { clearInterval(spin); spin = null; playB.textContent = '▶ Girar 360°'; } }, 30); } }, '▶ Girar 360°');
  const top = h('div', { class: 'controls' });
  if (keys.length > 1) top.append(seg(keys.map((k) => [k, ROTORS[k].n]), st.key, (k) => { st.key = k; R = ROTORS[k]; sc.setRotor(R); redrawPlot(); setPhi(st.phi); }, 'Molécula'));
  const [ca, cb] = R.bond.split('–');
  if (o.dirToggle) top.append(seg([['fwd', `olhar ${ca} → ${cb}`], ['rev', `olhar ${cb} → ${ca}`]], 'fwd', (k) => { st.dir = k; setPhi(st.phi); if (looking) sc.look(st.dir); }, 'Direção'));
  let looking = false;
  const tools = h('div', { class: 'controls' },
    tgl('👁 Ver Newman (alinhar câmera)', () => { looking = !looking; sc.look(st.dir, looking); return looking; }, false),
    tgl('space-filling', () => sc.toggle('space'), false),
    tgl('planos do diedro', () => sc.toggle('planes'), !!o.planes));
  host.append(top,
    h('div', { class: 'rotgrid' }, h('div', null, vbox, h('p', { class: 'hint3', html: 'Arraste: girar a molécula · role: zoom · <b>Shift/Ctrl + arrastar</b>: girar a ligação' })),
      h('div', { class: 'projs' }, o.newman !== false ? h('figure', { class: 'fig' }, nbox, h('figcaption', { html: '<b>Newman</b> · <span class="cf">frente</span> / <span class="cb">trás</span>' })) : null,
        o.saw !== false ? h('figure', { class: 'fig' }, sbox, h('figcaption', { html: '<b>Cavalete</b> (mesma conformação)' })) : null)),
    h('div', { class: 'range-row' }, h('span', { class: 'chip' }, '0°'), range, h('span', { class: 'chip' }, '360°')), h('div', { class: 'controls' }, presets, playB), tools, read, ebox);
  const sc = rotorScene(vbox, R, { phi: st.phi, dihLabel: true, onDrag: (p) => setPhi(p) });
  if (o.planes) sc.toggle('planes');
  let plot = null;
  function redrawPlot() {
    ebox.innerHTML = '';
    if (o.energy === false) return;
    const pts = rotorProfile(R);
    const SH = { anti: 'anti', gauche: 'gauche', ecl: 'eclipsada', toteclip: 'tot. eclipsada', alt: 'alternada', mid: '' };
    const emin = Math.min(...Array.from({ length: 361 }, (_, i) => rotorE(R, i)));
    const marks = [0, 60, 120, 180, 240, 300, 360].map((x) => [x, SH[confName(R, x).kind], rotorE(R, x) - emin < 0.3 ? 'low' : '']);
    const min = Math.min(...Array.from({ length: 361 }, (_, i) => rotorE(R, i)));
    plot = energyPlot(ebox, { pts, marks, at: (x) => rotorE(R, x) - min, onPick: (x) => setPhi(x), hover: (x) => h('div', null, newmanSVG(newmanData(R, x, st.dir), { maxw: 150, fs: 13 }), h('div', { class: 'tipname' }, `${x}° · ${confName(R, x).n}`)), alt: 'Energia relativa × ângulo diedro para ' + R.n });
    ebox.append(h('p', { class: 'hint3' }, 'Passe o mouse sobre o gráfico para ver a Newman; clique para ir até esse ângulo. Valores aproximados, válidos para esta molécula.'));
  }
  function setPhi(p) {
    st.phi = p; range.value = p; sc.set(p);
    const pp = p % 360;
    const A = rotorAngles(R, pp);
    const big = (arr) => { let k = 0; arr.forEach((g, i) => { if (GROUPS[g].s > GROUPS[arr[k]].s) k = i; }); return k; };
    const d = newmanData(R, pp, st.dir);
    const arcA = st.dir === 'fwd' ? [A.fa[big(R.front)], A.ba[big(R.back)]] : [d.back[big(R.front)][1], d.front[big(R.back)][1]];
    nbox.innerHTML = ''; nbox.append(newmanSVG(d, { arc: arcA, maxw: 250 }));
    sbox.innerHTML = ''; sbox.append(sawhorseSVG(R, pp, { dir: st.dir, maxw: 280 }));
    const min = Math.min(...Array.from({ length: 361 }, (_, i) => rotorE(R, i)));
    const E = rotorE(R, pp) - min, cn = confName(R, pp);
    const lowest = E < 0.3;
    read.innerHTML = `<span><b>${R.n}</b> · ligação ${R.bond}</span><span>diedro ${R.front.every((g) => g === 'H') ? 'H–C–C–H' : 'entre os grupos maiores'}: <b>${Math.round(mainDihedral(R, pp))}°</b> (rotação ${Math.round(p)}°)</span><span>conformação: <b class="${lowest ? 'ok' : cn.kind === 'toteclip' || cn.kind === 'ecl' ? 'hi' : ''}">${cn.n}</b></span><span>E relativa ≈ <b>${kj(E)} kJ/mol</b>${lowest ? ' <span class="status-ok">mínimo</span>' : ''}</span>`;
    if (plot) plot.set(pp);
    if (o.onPhi) o.onPhi(pp, R);
  }
  range.addEventListener('input', () => setPhi(+range.value));
  redrawPlot(); setPhi(st.phi);
  return { setPhi, sc, get R() { return R; }, setR(r) { R = r; sc.setRotor(r); redrawPlot(); setPhi(st.phi); } };
}

/* ===================================================================
 * Newman passo a passo
 * =================================================================== */
export function newmanSteps(host) {
  const R = ROTORS.butano, phi = 180;
  const vbox = h('div', { class: 'viewer short' }), fig = h('div', { class: 'projbox' }), cap = h('div', { class: 'stepcap', 'aria-live': 'polite' });
  const steps = [
    ['Escolha a ligação', 'Vamos olhar a ligação <b>C2–C3</b> do butano (em ciano no modelo).'],
    ['Escolha o lado', 'Olhe <b>do C2 para o C3</b>: o C2 fica na frente (laranja), o C3 atrás (magenta). A câmera se alinha ao eixo.'],
    ['Carbono da frente', 'O C2 vira um <b>ponto</b> no centro; seus três substituintes (CH₃, H, H) saem do ponto a 120° entre si.'],
    ['Carbono de trás', 'O C3 vira um <b>círculo</b>; seus substituintes saem da borda do círculo.'],
    ['Projeção pronta', 'Conformação <b>anti</b>: os dois CH₃ a 180°. Gire o modelo 3D e compare.'],
  ];
  let i = 0;
  const tl = h('div', { class: 'timeline' }, steps.map((s, k) => h('button', { type: 'button', html: `<b>${k + 1}. ${s[0]}</b>`, onclick: () => go(k) })));
  host.append(h('div', { class: 'split' }, vbox, h('div', null, fig, cap)), tl, h('div', { class: 'controls' }, h('button', { class: 'btn sm', type: 'button', onclick: () => go(i - 1) }, '◀'), h('button', { class: 'btn sm primary', type: 'button', onclick: () => go(i + 1) }, 'Próximo passo ▶')));
  const sc = rotorScene(vbox, R, { phi });
  function go(k) {
    i = Math.max(0, Math.min(steps.length - 1, k));
    [...tl.children].forEach((b, n) => b.classList.toggle('on', n === i));
    cap.innerHTML = steps[i][1];
    sc.look('fwd', i >= 1);
    const d = newmanData(R, phi);
    fig.innerHTML = '';
    if (i === 0) fig.append(h('div', { class: 'bigicon' }, 'C2 — C3'));
    else if (i === 1) fig.append(h('div', { class: 'bigicon' }, '👁 → C2 → C3'));
    else if (i === 2) fig.append(newmanSVG({ front: d.front, back: [] }, { maxw: 250 }));
    else fig.append(newmanSVG(i === 3 ? { front: d.front, back: d.back } : d, { maxw: 250, arc: i === 4 ? [d.front[0][1], d.back[0][1]] : null }));
  }
  go(0);
}

/* ===================================================================
 * Conversão Newman ↔ cavalete (animação da mudança do ponto de vista)
 * =================================================================== */
export function convertAnim(host) {
  const keys = ['butano', 'metilbutano', 'etano'];
  let R = ROTORS.butano, phi = 60, t = 0, raf = null;
  const fig = h('div', { class: 'projbox big' }), cap = h('div', { class: 'stepcap', 'aria-live': 'polite' });
  const run = (to) => { cancelAnimationFrame(raf); const from = t, t0 = performance.now(); const step = (now) => { const k = Math.min(1, (now - t0) / 1600); t = from + (to - from) * (k * k * (3 - 2 * k)); draw(); if (k < 1) raf = requestAnimationFrame(step); }; raf = requestAnimationFrame(step); };
  const range = h('input', { type: 'range', min: 0, max: 360, step: 30, value: phi, 'aria-label': 'diedro' });
  range.addEventListener('input', () => { phi = +range.value; draw(); });
  host.append(h('div', { class: 'controls' }, seg(keys.map((k) => [k, ROTORS[k].n]), 'butano', (k) => { R = ROTORS[k]; draw(); }, 'Molécula'),
    h('button', { class: 'btn sm primary', type: 'button', onclick: () => run(1) }, 'Newman → Cavalete'), h('button', { class: 'btn sm primary', type: 'button', onclick: () => run(0) }, 'Cavalete → Newman')),
  h('div', { class: 'range-row' }, h('span', { class: 'chip' }, 'rotação'), range), fig, cap);
  function draw() {
    fig.innerHTML = ''; fig.append(sawhorseSVG(R, phi, { t, maxw: 380, fs: 15 }));
    cap.innerHTML = t < 0.05 ? '<b>Newman</b>: vista ao longo da ligação; o C de trás fica escondido atrás do da frente (círculo).' : t > 0.95 ? '<b>Cavalete</b>: a mesma molécula vista em perspectiva; a ligação C–C aparece inclinada (C da frente embaixo à esquerda).' : 'Girando o ponto de vista… nenhum átomo muda de lugar na molécula.';
  }
  draw();
}

/* ===================================================================
 * Torsional: etano alternado × eclipsado com "densidade" das ligações C–H
 * =================================================================== */
export function torsional(host) {
  const a = h('div', { class: 'viewer short' }), b = h('div', { class: 'viewer short' });
  host.append(h('div', { class: 'grid2' }, h('div', null, h('h4', { class: 'okc' }, 'Alternada (60°): ligações C–H desencontradas'), a), h('div', null, h('h4', { class: 'hic' }, 'Eclipsada (0°): ligações C–H alinhadas'), b)));
  const lob = [];
  [[a, 60], [b, 0]].forEach(([vb, phi]) => {
    const sc = rotorScene(vb, ROTORS.etano, { phi });
    if (!sc.v.ok) return;
    const m = sc.mol;
    m.bonds.forEach((bd) => { if (bd.i > 1 || (bd.i === 0 && bd.j === 1)) return; const c = m.atoms[bd.i].p, hp = m.atoms[bd.j].p; const l = lobe(sc.v.scene, bd.i === 0 ? 0xff9f43 : 0xff4fa3, 0.3); l.set(c, V.sub(hp, c), 0.55, 0.22); lob.push(l); });
  });
  host.append(h('div', { class: 'controls' }, tgl('nuvens eletrônicas das ligações C–H', () => { const on = !(lob[0] && lob[0].m.visible); lob.forEach((l) => l.show(on)); return on; }, true)));
}

/* ===================================================================
 * Tensão estérica (space-filling)
 * =================================================================== */
export function steric(host) {
  const pairs = { HH: ['H', 'H'], HMe: ['H', 'CH3'], MeMe: ['CH3', 'CH3'], tt: ['tBu', 'tBu'] };
  const vbox = h('div', { class: 'viewer' }), out = h('div', { class: 'readout', 'aria-live': 'polite' });
  let cur = 'MeMe', phi = 0;
  const mk = () => { const [x, y] = pairs[cur]; return { n: `${gname(x)} / ${gname(y)}`, bond: 'C–C', front: [x, 'H', 'H'], back: [y, 'H', 'H'] }; };
  host.append(h('div', { class: 'controls' }, seg([['HH', 'H / H'], ['HMe', 'H / CH₃'], ['MeMe', 'CH₃ / CH₃'], ['tt', 't-Bu / t-Bu']], cur, (k) => { cur = k; sc.setRotor(mk()); upd(); }, 'Par'), seg([['0', 'eclipsados (0°)'], ['60', 'gauche (60°)'], ['180', 'anti (180°)']], '0', (k) => { phi = +k; sc.set(phi); upd(); }, 'Ângulo')), vbox, out);
  const sc = rotorScene(vbox, mk(), { phi, style: 'space' });
  function upd() { const R = mk(); const min = Math.min(...Array.from({ length: 361 }, (_, i) => rotorE(R, i))); out.innerHTML = `<span>${R.n} a ${phi}°</span><span>E relativa (modelo) ≈ <b>${kj(rotorE(R, phi) - min)} kJ/mol</b></span><span>${cur === 'tt' && phi === 0 ? 'nuvens de van der Waals se interpenetram: conformação praticamente inacessível' : 'quanto maiores os grupos, maior a repulsão quando se aproximam'}</span>`; }
  upd();
}

/* ===================================================================
 * Exercício: qual Newman corresponde ao 3D? (inclui direção de visualização)
 * =================================================================== */
const sig = (d) => d.front.map((x) => x[0] + Math.round(x[1])).sort().join() + '|' + d.back.map((x) => x[0] + Math.round(x[1])).sort().join();
export function newmanMatch(host, o = {}) {
  const pool = o.pool || ['metilbutano', 'metilpentano', 'dimetilbutano', 'butano'];
  const vbox = h('div', { class: 'viewer short' }), q = h('p', { class: 'prompt' }), opts = h('div', { class: 'mcq cols' }), fb = h('div', { 'aria-live': 'polite' });
  host.append(h('div', { class: 'split' }, h('div', null, vbox, h('div', { class: 'controls' }, tgl('👁 alinhar câmera', () => { lk = !lk; sc.look(cur.dir, lk); return lk; }, false), h('button', { class: 'btn sm', type: 'button', onclick: next }, 'Nova molécula ↻'))), h('div', null, q, opts, fb)));
  let sc = null, cur = null, lk = false;
  sc = rotorScene(vbox, ROTORS.butano, { phi: 60 });
  function next() {
    const key = pool[Math.floor(Math.random() * pool.length)], R = ROTORS[key];
    const phi = [60, 180, 300, 0, 120][Math.floor(Math.random() * 5)];
    const dir = o.dir === 'random' ? (Math.random() < 0.5 ? 'fwd' : 'rev') : 'fwd';
    cur = { R, phi, dir }; lk = false; sc.setRotor(R); sc.set(phi); sc.look(dir, false);
    const [ca, cb] = R.bond.split('–');
    q.innerHTML = `<b>${R.n}</b>, ligação <b>${R.bond}</b>. Olhando <b>${dir === 'fwd' ? ca + ' → ' + cb : cb + ' → ' + ca}</b> (o carbono ${dir === 'fwd' ? ca : cb} fica na frente; o laranja no 3D é o ${ca}). Qual projeção corresponde à conformação mostrada?`;
    const right = newmanData(R, phi, dir);
    const cands = [newmanData(R, phi + 120, dir), newmanData(R, phi + 60, dir), newmanData(R, phi, dir === 'fwd' ? 'rev' : 'fwd'), newmanData(R, phi + 240, dir), newmanData(R, 360 - phi, dir)];
    const wrong = []; cands.forEach((d) => { if (sig(d) !== sig(right) && !wrong.some((w) => sig(w) === sig(d))) wrong.push(d); });
    const list = shuffle([right].concat(wrong.slice(0, 3)));
    opts.innerHTML = ''; fb.innerHTML = '';
    list.forEach((d, i) => opts.append(h('button', { class: 'mopt struct', type: 'button', onclick: (e) => {
      const ok = d === right; [...opts.children].forEach((b, n) => b.classList.toggle('right', list[n] === right && !ok ? false : list[n] === right && ok)); e.currentTarget.classList.add(ok ? 'right' : 'wrong');
      fb.innerHTML = `<div class="fb ${ok ? 'ok' : 'bad'}">${ok ? '✔ Correto!' : '✘ Não. Dica: alinhe a câmera ao eixo e compare as posições dos grupos grandes.'} ${dir === 'rev' ? 'Lembre-se: olhar pelo outro lado troca frente/trás e espelha a figura.' : ''}</div>`;
      if (!ok) [...opts.children].forEach((b, n) => { if (list[n] === right) b.classList.add('right'); });
    } }, h('span', { class: 'l' }, 'abcd'[i]), newmanSVG(d, { maxw: 170, fs: 13 }))));
  }
  next();
}

/* ===================================================================
 * Exercício: monte a Newman (arrastar e soltar; também por clique)
 * =================================================================== */
export function buildNewman(host, o = {}) {
  const tasks = o.tasks || [['butano', 60], ['metilbutano', 180], ['dimetilbutano', 60], ['metilpentano', 180]];
  let ti = 0, sel = null;
  const left = h('div'), stage = h('div', { class: 'dndstage' }), chips = h('div', { class: 'chips' }), fb = h('div', { 'aria-live': 'polite' }), q = h('p', { class: 'prompt' });
  host.append(q, h('div', { class: 'split' }, left, h('div', null, stage, chips, h('div', { class: 'ex-actions' }, h('button', { class: 'btn sm primary', type: 'button', onclick: check }, 'Conferir'), h('button', { class: 'btn sm', type: 'button', onclick: show }, 'Ver resposta'), h('button', { class: 'btn sm', type: 'button', onclick: () => { ti = (ti + 1) % tasks.length; start(); } }, 'Próximo ↻')), fb)));
  let slots = [], placed = [], data = null, R = null;
  function start() {
    const [key, phi] = tasks[ti]; R = ROTORS[key]; data = newmanData(R, phi);
    q.innerHTML = `<b>${R.n}</b>, ligação ${R.bond} (C da frente = ${R.bond.split('–')[0]}). Arraste os grupos para a projeção de Newman correspondente ao cavalete.`;
    left.innerHTML = ''; left.append(h('figure', { class: 'fig' }, sawhorseSVG(R, phi, { maxw: 300 }), h('figcaption', null, 'cavalete (C da frente embaixo à esquerda)')));
    stage.innerHTML = ''; fb.innerHTML = '';
    const blank = { front: data.front.map((x) => ['', x[1]]), back: data.back.map((x) => ['', x[1]]) };
    const svg = newmanSVG(blank, { slots: true, maxw: 320 });
    stage.append(svg);
    slots = svg._slots.map((s) => { const d = h('div', { class: 'slot ' + (s.side === 'f' ? 'sf' : 'sb'), style: `left:${s.x / svg._size * 100}%;top:${s.y / svg._size * 100}%`, tabindex: 0, role: 'button', 'aria-label': (s.side === 'f' ? 'posição do carbono da frente a ' : 'posição do carbono de trás a ') + Math.round(s.ang) + '°' }); d._s = s; stage.append(d); return d; });
    placed = slots.map(() => null);
    slots.forEach((d, i) => {
      d.addEventListener('dragover', (e) => e.preventDefault());
      d.addEventListener('drop', (e) => { e.preventDefault(); put(i, e.dataTransfer.getData('text')); });
      const clk = () => { if (sel !== null) { put(i, sel); sel = null; [...chips.children].forEach((c) => c.classList.remove('sel')); } else if (placed[i]) { placed[i] = null; d.textContent = ''; } };
      d.addEventListener('click', clk); d.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); clk(); } });
    });
    chips.innerHTML = '';
    shuffle(R.front.concat(R.back)).forEach((g, k) => { const c = h('button', { class: 'chipg', type: 'button', draggable: 'true', 'data-g': g }, gname(g, true)); c.addEventListener('dragstart', (e) => e.dataTransfer.setData('text', g + '#' + k)); c.addEventListener('click', () => { sel = g + '#' + k; [...chips.children].forEach((x) => x.classList.toggle('sel', x === c)); }); c.dataset.k = k; chips.append(c); });
  }
  function put(i, tok) {
    const [g, k] = tok.split('#');
    const prev = placed.findIndex((x) => x && x.k === k); if (prev >= 0) { placed[prev] = null; slots[prev].textContent = ''; }
    placed[i] = { g, k }; slots[i].textContent = gname(g, true);
  }
  const want = () => slots.map((d) => { const s = d._s; const arr = s.side === 'f' ? data.front : data.back; return arr.find((x) => Math.abs(x[1] - s.ang) < 1)[0]; });
  function check() {
    const w = want(); let n = 0;
    slots.forEach((d, i) => { const ok = placed[i] && placed[i].g === w[i]; d.classList.toggle('ok', !!ok); d.classList.toggle('bad', !ok); if (ok) n++; });
    fb.innerHTML = `<div class="fb ${n === 6 ? 'ok' : 'bad'}">${n === 6 ? '✔ Perfeito! Projeção correta.' : `${n}/6 posições corretas. Lembre: grupos do C da frente saem do <b>centro</b>; os de trás saem do <b>círculo</b>.`}</div>`;
  }
  function show() { const w = want(); slots.forEach((d, i) => { placed[i] = { g: w[i], k: 'x' + i }; d.textContent = gname(w[i], true); d.classList.add('ok'); d.classList.remove('bad'); }); }
  start();
}

/* ===================================================================
 * Exercício inverso: Newman → qual modelo 3D?
 * =================================================================== */
export function inverse3d(host) {
  const vbox = h('div', { class: 'viewer' }), fb = h('div', { 'aria-live': 'polite' }), fig = h('div', { class: 'projbox' }), btns = h('div', { class: 'qopts', style: 'display:flex;gap:8px' });
  host.append(h('div', { class: 'split' }, h('div', null, h('p', { class: 'prompt' }, 'Esta projeção de Newman (butano, C2 → C3) corresponde a qual modelo 3D? (laranja = C2, magenta = C3)'), fig, btns, fb), vbox));
  const R = ROTORS.butano, ans = 60;
  const items = shuffle([{ R, phi: ans, ok: true }, { R, phi: 180 }, { R, phi: 0 }, { R, phi: 120 }]);
  fig.append(newmanSVG(newmanData(R, ans), { maxw: 230 }));
  multiRotorScene(vbox, items.map((x) => ({ R: x.R, phi: x.phi })));
  items.forEach((it, k) => btns.append(h('button', { class: 'btn', type: 'button', onclick: () => { fb.innerHTML = `<div class="fb ${it.ok ? 'ok' : 'bad'}">${it.ok ? '✔ Correto: CH₃ gauche (60°).' : '✘ Não. Procure o modelo em que os dois CH₃ estão a 60° (gauche) quando vistos ao longo da ligação.'}</div>`; } }, 'abcd'[k])));
}

/* ===================================================================
 * Exercício: diedro aproximado no 3D
 * =================================================================== */
export function dihedralGuess(host) {
  const vbox = h('div', { class: 'viewer short' }), fb = h('div', { 'aria-live': 'polite' }), opts = h('div', { class: 'qopts', style: 'display:flex;gap:8px;flex-wrap:wrap' });
  host.append(h('div', { class: 'split' }, vbox, h('div', null, h('p', { class: 'prompt' }, 'Qual é aproximadamente o ângulo diedro entre os dois grupos CH₃ (C1–C2–C3–C4)? Gire o modelo.'), opts, fb, h('button', { class: 'btn sm', type: 'button', onclick: next }, 'Outra ↻'))));
  const sc = rotorScene(vbox, ROTORS.butano, { phi: 60 });
  let ans = 60;
  [0, 60, 120, 180].forEach((a) => opts.append(h('button', { class: 'btn', type: 'button', onclick: () => { fb.innerHTML = `<div class="fb ${a === ans ? 'ok' : 'bad'}">${a === ans ? '✔ Correto' : '✘ Resposta: ' + ans + '°'} — ${confName(ROTORS.butano, ans).n}.</div>`; } }, a + '°')));
  function next() { const p = [0, 60, 120, 180, 240, 300][Math.floor(Math.random() * 6)]; ans = Math.round(mainDihedral(ROTORS.butano, p)); sc.set(p); fb.innerHTML = ''; }
  next();
}

/* ===================================================================
 * Exercício: ponto no gráfico do butano → qual Newman?
 * =================================================================== */
export function energyPointEx(host) {
  const R = ROTORS.butano, ebox = h('div'), opts = h('div', { class: 'mcq cols' }), fb = h('div', { 'aria-live': 'polite' });
  host.append(h('p', { class: 'prompt' }, 'O ponto amarelo marca uma conformação no perfil do butano (C2–C3). Qual projeção corresponde a ele?'), ebox, opts, fb, h('button', { class: 'btn sm', type: 'button', onclick: next }, 'Outro ponto ↻'));
  const min = Math.min(...Array.from({ length: 361 }, (_, i) => rotorE(R, i)));
  const plot = energyPlot(ebox, { pts: rotorProfile(R), at: (x) => rotorE(R, x) - min, h: 220 });
  function next() {
    const p = [0, 60, 120, 180][Math.floor(Math.random() * 4)];
    plot.set(p);
    const list = shuffle([0, 60, 120, 180]);
    opts.innerHTML = ''; fb.innerHTML = '';
    list.forEach((x, i) => opts.append(h('button', { class: 'mopt struct', type: 'button', onclick: (e) => { const ok = x === p; e.currentTarget.classList.add(ok ? 'right' : 'wrong'); fb.innerHTML = `<div class="fb ${ok ? 'ok' : 'bad'}">${ok ? '✔' : '✘'} O ponto está em ${p}°: <b>${confName(R, p).n}</b>.</div>`; } }, h('span', { class: 'l' }, 'abcd'[i]), newmanSVG(newmanData(R, x), { maxw: 160, fs: 13 }))));
  }
  next();
}

/* ===================================================================
 * Cicloalcanos
 * =================================================================== */
const RINGINFO = {
  3: ['Ciclopropano', 'Anel plano obrigatório; ângulo C–C–C = <b>60°</b> (ideal 109,5°): enorme <b>tensão angular</b>. Todas as ligações C–H estão eclipsadas (tensão torsional). As ligações C–C são "curvas" (banana): a sobreposição dos orbitais ocorre fora do eixo internuclear.', '≈ 115 kJ/mol'],
  4: ['Ciclobutano', 'Ângulos ≈ 88°. O anel se <b>dobra</b> (≈ 25°): aumenta um pouco a tensão angular, mas reduz o eclipsamento das ligações C–H (tensão torsional). O anel oscila entre duas formas dobradas.', '≈ 110 kJ/mol'],
  5: ['Ciclopentano', 'Se fosse plano, teria ângulos de 108° (quase ideais), mas 10 pares C–H eclipsados. Adota o <b>envelope</b> (um C fora do plano) e a <b>meia-cadeira</b>, que se interconvertem rapidamente (pseudorrotação).', '≈ 26 kJ/mol'],
  6: ['Ciclo-hexano', 'Na <b>cadeira</b>, os ângulos são ≈ 111° e todas as ligações C–H são alternadas: praticamente sem tensão.', '≈ 0 kJ/mol'],
};
export function cycloalkanes(host, o = {}) {
  const vbox = h('div', { class: 'viewer' }), info = h('div', { class: 'stepcap', 'aria-live': 'polite' });
  let n = o.n || 3;
  const anim = tgl('animar (dobra / pseudorrotação)', () => { a = !a; sc.animate(a); return a; }, false); let a = false;
  if (!o.fixed) host.append(h('div', { class: 'controls' }, seg([['3', 'ciclopropano'], ['4', 'ciclobutano'], ['5', 'ciclopentano'], ['6', 'ciclo-hexano']], String(n), (k) => { n = +k; sc.setN(n); upd(); }, 'Anel')));
  host.append(vbox, h('div', { class: 'controls' }, anim, tgl('space-filling', () => { sp = !sp; sc.setStyle(sp ? 'space' : 'ball'); return sp; }, false)), info);
  let sp = false;
  const sc = ringScene(vbox, n);
  if (o.anim) { a = true; sc.animate(true); anim.setAttribute('aria-pressed', 'true'); }
  function upd() { const I = RINGINFO[n]; const g = ringGeom(n, n === 6 ? flipParams(0) : n === 5 ? { Q: 0.43, ph: 0 } : n === 4 ? { p: 0.14 } : {}); const P = g.P; const ang = Math.acos(V.dot(V.norm(V.sub(P[n - 1], P[0])), V.norm(V.sub(P[1], P[0])))) * 180 / Math.PI; info.innerHTML = `<b>${I[0]}</b> · ângulo C–C–C no modelo ≈ <b>${ang.toFixed(0)}°</b> · tensão total ${I[2]}<br>${I[1]}`; }
  upd();
}

/* ===================================================================
 * Ciclo-hexano: conformações (cadeira, meia-cadeira, barco torcido, barco)
 * =================================================================== */
export function cyclohexConfs(host) {
  const vbox = h('div', { class: 'viewer' }), info = h('div', { class: 'readout', 'aria-live': 'polite' });
  const txt = { cadeira: 'ângulos ≈ 111°, todas as ligações alternadas: mais estável.', 'meia-cadeira': 'cinco carbonos quase coplanares: grande tensão angular e torsional — é um <b>máximo</b> de energia (estado de transição da inversão).', 'barco torcido': 'mínimo local: a torção reduz o eclipsamento e afasta os H "de mastro".', barco: 'quatro pares C–H eclipsados e interação entre os H de mastro (flagpole); ligeiramente acima do barco torcido.' };
  host.append(h('div', { class: 'controls' }, seg(Object.keys(CONFS6).map((k) => [k, k]), 'cadeira', (k) => { sc.setU(CONFS6[k]); info.innerHTML = `<span><b>${k}</b></span><span>E ≈ <b>${kj(flipE(CONFS6[k]))} kJ/mol</b> acima da cadeira</span><span>${txt[k]}</span>`; }, 'Conformação')), vbox, info, h('div', { class: 'controls' }, tgl('space-filling', () => sc.toggle('space'), false), tgl('numerar C', () => sc.toggle('nums'), true)));
  const sc = chairScene(vbox, {});
  info.innerHTML = `<span><b>cadeira</b></span><span>E ≈ <b>0 kJ/mol</b></span><span>${txt.cadeira}</span>`;
}

/* ===================================================================
 * Cadeira em três representações (3D + cadeira 2D + esquelética)
 * =================================================================== */
export function chairReps(host) {
  const vbox = h('div', { class: 'viewer short' }), c2 = h('div', { class: 'projbox' }), sk = h('div', { class: 'projbox' });
  host.append(h('div', { class: 'grid3' }, h('figure', { class: 'fig' }, vbox, h('figcaption', null, 'cadeira 3D')), h('figure', { class: 'fig' }, c2, h('figcaption', null, 'desenho da cadeira (perspectiva)')), h('figure', { class: 'fig' }, sk, h('figcaption', null, 'estrutura esquelética'))),
    h('div', { class: 'controls' }, h('button', { class: 'btn sm primary', type: 'button', onclick: () => sc.flip && sc.flip() }, '⟲ Inverter cadeira'), tgl('mostrar H (axial/equatorial)', () => { H = !H; draw(lastU); return H; }, false)));
  let H = false, lastU = 0;
  const draw = (u) => { c2.innerHTML = ''; c2.append(chairSVG({}, u, { geo: ringGeom(6, flipParams(u)), num: true, H, color: H, scale: 52 })); };
  const s = new S(); const P = ringPts(6, 0, 0, -90); const ids = P.map((p) => s.a(p[0], p[1])); for (let k = 0; k < 6; k++) s.b(ids[k], ids[(k + 1) % 6]); P.forEach((p, k) => s.t(p[0] * 1.32, p[1] * 1.32 + 0.05, String(k + 1), 'cnum', 12));
  sk.append(mol(s, { scale: 46 }));
  const sc = chairScene(vbox, { onState: (st) => { if (Math.abs(st.u - lastU) > 0.015 || st.u === 0 || st.u === 1) { lastU = st.u; draw(st.u); } } });
  draw(0);
}

/* ===================================================================
 * Axial × equatorial (+ atividade: clique nos axiais para cima)
 * =================================================================== */
export function axialEq(host) {
  const vbox = h('div', { class: 'viewer' }), fb = h('div', { 'aria-live': 'polite' });
  const found = new Set();
  host.append(vbox, h('div', { class: 'legend' }, h('span', null, h('i', { style: 'background:#2fd4f5' }), 'axial (paralela ao eixo)'), h('span', null, h('i', { style: 'background:#ffb347' }), 'equatorial (ao redor do "equador")')),
    h('div', { class: 'controls' }, tgl('cores axial/equatorial', () => sc.toggle('color'), true), tgl('cores up/down', () => sc.toggle('updown'), false), tgl('space-filling', () => sc.toggle('space'), false), h('button', { class: 'btn sm', type: 'button', onclick: () => { found.clear(); sc.highlight([]); fb.innerHTML = ''; } }, '↺ recomeçar atividade')),
    h('div', { class: 'note quick', style: 'margin-top:10px' }, h('b', { class: 't' }, 'Atividade'), 'Clique, no modelo 3D, nas três posições ', h('b', null, 'axiais para cima'), '.'), fb);
  const sc = chairScene(vbox, { color: true, onPick: (pt) => {
    if (!pt.key) return;
    const ok = pt.role === 'ax' && pt.f === 'u';
    if (ok) { found.add(pt.key); sc.highlight([...found]); }
    fb.innerHTML = `<div class="fb ${ok ? 'ok' : 'bad'}">${ok ? `✔ C${pt.k + 1}: axial para cima (${found.size}/3).` : `✘ Esse H em C${pt.k + 1} é <b>${pt.role === 'ax' ? 'axial' : 'equatorial'} ${pt.f === 'u' ? 'up' : 'down'}</b>.`}${found.size === 3 ? ' 🎉 Encontrou todos: C1, C3 e C5 — os axiais alternam para cima e para baixo ao redor do anel.' : ''}</div>`;
  } });
}

/* ===================================================================
 * Inversão de cadeira: 3D + perfil de energia + rótulos
 * =================================================================== */
export function flipSim(host, o = {}) {
  const vbox = h('div', { class: 'viewer tall' }), read = h('div', { class: 'readout', 'aria-live': 'polite' }), ebox = h('div');
  const range = h('input', { type: 'range', min: 0, max: 1000, value: 0, 'aria-label': 'Progresso da inversão' });
  const play = h('button', { class: 'btn sm primary', type: 'button', onclick: () => { if (sc.clock.playing) { sc.clock.pause(); return; } sc.flip(); } }, '⟲ Inverter cadeira');
  host.append(h('div', { class: 'controls' }, play, h('button', { class: 'btn sm', type: 'button', onclick: () => sc.clock.pause() }, '❚❚ Pausar'), tgl('🐢 lento', () => { sl = !sl; sc.clock.speed(sl ? 0.3 : 1); return sl; }, false), tgl('cores axial/equatorial', () => sc.toggle('color'), true), tgl('cores up/down', () => sc.toggle('updown'), false)),
    vbox, h('div', { class: 'range-row' }, h('span', { class: 'chip' }, 'cadeira A'), range, h('span', { class: 'chip' }, 'cadeira B')), read, ebox);
  let sl = false;
  const subs = o.subs || { '1u': 'CH3' };
  range.addEventListener('input', () => sc.setU(+range.value / 1000));
  const plot = energyPlot(ebox, { pts: Array.from({ length: 101 }, (_, i) => [i / 100, flipE(i / 100)]), xmax: 1, at: (x) => flipE(x), xticks: [0, 0.16, 0.3, 0.5, 0.7, 0.84, 1], xfmt: (x) => ({ 0: 'cadeira', 0.16: 'meia-c.', 0.3: 'b. torcido', 0.5: 'barco', 0.7: 'b. torcido', 0.84: 'meia-c.', 1: 'cadeira' })[x], ystep: 10, ymax: 50, xlab: 'coordenada da inversão', marks: [[0, '', 'low'], [0.16, ''], [0.3, ''], [0.5, ''], [0.7, ''], [0.84, ''], [1, '', 'low']], onPick: (x) => sc.setU(Math.round(x * 50) / 50), alt: 'Perfil de energia da inversão do ciclo-hexano' });
  ebox.append(h('p', { class: 'hint3' }, 'Clique no gráfico para ver a conformação correspondente. Energias aproximadas: meia-cadeira ≈ 45, barco ≈ 29, barco torcido ≈ 23 kJ/mol acima da cadeira.'));
  const sc = chairScene(vbox, { subs, color: true, dur: 4, onState: (s) => {
    range.value = Math.round(s.u * 1000); plot.set(s.u);
    const pts = s.parts.filter((p) => p.name !== 'H');
    read.innerHTML = `<span>conformação: <b>${flipName(s.u)}</b></span><span>E ≈ <b>${kj(flipE(s.u))} kJ/mol</b></span>` + pts.map((p) => `<span>${gname(p.name, 1)} em C${p.k + 1}: <b>${p.role === 'ax' ? 'axial' : 'equatorial'}</b> · <b class="ok">${p.f === 'u' ? 'up' : 'down'}</b> (não muda)</span>`).join('') + (s.u > 0.98 ? '<span class="status-ok">axial ↔ equatorial trocaram; up continua up</span>' : '');
  } });
}

/* ===================================================================
 * Barco: H de mastro (flagpole)
 * =================================================================== */
export function boatFlag(host) {
  const vbox = h('div', { class: 'viewer' });
  host.append(vbox, h('div', { class: 'controls' }, tgl('space-filling', () => sc.toggle('space'), true), seg([['0.5', 'barco'], ['0.3', 'barco torcido'], ['0', 'cadeira']], '0.5', (k) => { sc.setU(+k); mark(+k); }, 'Conformação')));
  const sc = chairScene(vbox, { u: 0.5, style: 'space', nums: false });
  function mark(u) {
    const g = ringGeom(6, flipParams(u));
    if (u !== 0.5) { sc.highlight([]); return; }
    const ord = g.z.map((z, k) => [z, k]).sort((a, b) => a[0] - b[0]);
    const bows = [ord[0][1], ord[1][1]];
    const keys = bows.map((k, i) => { const other = g.P[bows[1 - i]]; const vec = V.sub(other, g.P[k]); return (k + 1) + (V.dot(g.subs[k].u.dir, vec) > V.dot(g.subs[k].d.dir, vec) ? 'u' : 'd'); });
    sc.highlight(keys);
  }
  mark(0.5);
}

/* ===================================================================
 * Substituinte axial × equatorial e interações 1,3-diaxiais
 * =================================================================== */
export function diaxial(host, o = {}) {
  const vbox = h('div', { class: 'viewer' }), read = h('div', { class: 'readout', 'aria-live': 'polite' });
  let g = o.g || 'CH3';
  host.append(h('div', { class: 'controls' }, seg([['H', 'H'], ['CH3', 'CH₃'], ['iPr', 'i-Pr'], ['tBu', 't-Bu']], g, (k) => { g = k; sc.setSubs({ '1u': g }); upd(); }, 'Grupo em C1'), seg([['0', 'axial'], ['1', 'equatorial']], '0', (k) => { sc.setU(+k); setTimeout(upd, 30); }, 'Posição')),
    vbox, h('div', { class: 'controls' }, tgl('space-filling', () => sc.toggle('space'), !!o.space), tgl('destacar 1,3-diaxiais', () => sc.toggle('diax'), true)), read);
  const sc = chairScene(vbox, { subs: { '1u': g }, diax: true, style: o.space ? 'space' : 'ball' });
  function upd() { const ax = sc.st.u < 0.5; read.innerHTML = `<span>${gname(g)} <b>${ax ? 'axial' : 'equatorial'}</b> em C1</span>` + (ax && g !== 'H' ? `<span>interage com os H axiais de <b>C3 e C5</b> (mesma face) — linhas vermelhas</span><span>custo ≈ <b>${kj(GROUPS[g].A)} kJ/mol</b> em relação ao equatorial (valor A)</span>` : `<span>${g === 'H' ? 'sem substituinte' : 'aponta para fora do anel: sem interações 1,3-diaxiais'}</span>`); }
  upd();
}
export function aValues(host) {
  const list = ['Cl', 'Br', 'OH', 'CH3', 'Et', 'iPr', 'tBu'];
  const max = 22;
  list.forEach((g) => host.append(h('div', { class: 'hmeter' }, h('span', { html: `<b>${GROUPS[g].t}</b>` }), h('div', { class: 'bar' }, h('span', { style: `width:${GROUPS[g].A / max * 100}%;${g === 'tBu' ? 'background:linear-gradient(90deg,#ff9f43,#ff5c6c)' : ''}` })), h('small', null, '≈ ' + kj(GROUPS[g].A) + ' kJ/mol'))));
  const pct = (A) => { const K = Math.exp(A * 1000 / (8.314 * 298)); return (100 * K / (1 + K)); };
  host.append(h('p', { class: 'hint3', html: `Proporção equatorial a 25 °C: CH₃ ≈ ${pct(7.3).toFixed(0)}%; i-Pr ≈ ${pct(9.2).toFixed(0)}%; t-Bu &gt; 99,9%. (K = e<sup>ΔG/RT</sup>; valores A aproximados.)` }));
}

/* ===================================================================
 * Dissubstituídos: 1,2 / 1,3 / 1,4 × cis/trans → duas cadeiras
 * =================================================================== */
export function subsFor(pos, rel, g1 = 'CH3', g2 = 'CH3') {
  const c2 = pos === '12' ? 2 : pos === '13' ? 3 : 4;
  return { '1u': g1, [c2 + (rel === 'cis' ? 'u' : 'd')]: g2 };
}
export function chairPair(host, o = {}) {
  const st = { pos: o.pos || '12', rel: o.rel || 'cis', g1: o.g1 || 'CH3', g2: o.g2 || 'CH3' };
  const A = h('div', { class: 'viewer short' }), B = h('div', { class: 'viewer short' });
  const dA = h('div', { class: 'projbox' }), dB = h('div', { class: 'projbox' });
  const tA = h('div'), tB = h('div'), q = h('div'), res = h('div', { 'aria-live': 'polite' });
  const gs = [['CH3', 'CH₃'], ['Et', 'Et'], ['iPr', 'i-Pr'], ['tBu', 't-Bu'], ['OH', 'OH'], ['Cl', 'Cl']];
  const sel = (k) => { const s = h('select', { 'aria-label': k }, gs.map(([v, t]) => h('option', { value: v, selected: v === st[k] ? true : null }, t))); s.addEventListener('change', () => { st[k] = s.value; upd(); }); return s; };
  if (!o.fixed) host.append(h('div', { class: 'controls' }, seg([['12', '1,2'], ['13', '1,3'], ['14', '1,4']], st.pos, (k) => { st.pos = k; upd(); }, 'Posições'), seg([['cis', 'cis'], ['trans', 'trans']], st.rel, (k) => { st.rel = k; upd(); }, 'Relação'), h('label', null, 'C1: ', sel('g1')), h('label', null, ' outro C: ', sel('g2'))));
  host.append(h('div', { class: 'grid2' }, h('div', { class: 'chcard' }, h('h4', null, 'Cadeira A'), A, dA, tA), h('div', { class: 'chcard' }, h('h4', null, 'Cadeira B (após o flip)'), B, dB, tB)), q, res);
  const sA = chairScene(A, { color: true, nums: false, diax: true }), sB = chairScene(B, { color: true, nums: false, diax: true, u: 1 });
  function card(an, el2) {
    el2.innerHTML = '';
    el2.append(h('table', { class: 'mini' }, h('tbody', null, an.list.map((x) => h('tr', null, h('td', null, `${gname(x.g, 1)} (C${x.c})`), h('td', { class: x.role === 'ax' ? 'axc' : 'eqc' }, x.role === 'ax' ? 'axial' : 'equatorial'), h('td', null, x.f === 'u' ? 'up' : 'down'))))));
  }
  function upd() {
    const subs = subsFor(st.pos, st.rel, st.g1, st.g2);
    if (sA.setSubs) { sA.setSubs(subs); sB.setSubs(subs); }
    dA.innerHTML = ''; dB.innerHTML = '';
    dA.append(chairSVG(subs, 0, { scale: 40 })); dB.append(chairSVG(subs, 1, { scale: 40 }));
    const a = analyzeChair(subs, false), b = analyzeChair(subs, true);
    card(a, tA); card(b, tB);
    res.innerHTML = '';
    const rel = relation(subs);
    q.innerHTML = '';
    const ask = h('div', { class: 'note quick' }, h('b', { class: 't' }, 'Antes de ver'), `${st.rel}-1,${st.pos[1]}-${gname(st.g1, 1)}/${gname(st.g2, 1)}: qual cadeira você acredita ser mais estável? `,
      h('div', { class: 'qopts' }, ['A', 'B', 'iguais'].map((x) => h('button', { class: 'btn sm', type: 'button', onclick: () => reveal(x) }, x))));
    q.append(ask);
    function reveal(guess) {
      const d = a.E - b.E; const best = Math.abs(d) < 0.6 ? 'iguais' : d < 0 ? 'A' : 'B';
      res.innerHTML = `<div class="fb ${guess === best ? 'ok' : 'bad'}">${guess === best ? '✔ Correto.' : '✘ Não.'} <b>${best === 'iguais' ? 'As duas cadeiras têm a mesma energia' : 'Cadeira ' + best + ' é mais estável'}</b> (${rel}: ${rel === 'cis' ? 'mesma face' : 'faces opostas'}).<br>Cadeira A ≈ ${kj(a.E)} kJ/mol: ${a.notes.join('; ') || 'sem grupos axiais'}.<br>Cadeira B ≈ ${kj(b.E)} kJ/mol: ${b.notes.join('; ') || 'sem grupos axiais'}.<br><small>Estimativa aditiva com valores A; serve para comparar qualitativamente.</small></div>`;
      [sA, sB].forEach((s, k) => { if (s.v && s.v.host) s.v.host.parentElement.classList.toggle('best', (best === 'A' && k === 0) || (best === 'B' && k === 1)); });
    }
  }
  upd();
}

/* ===================================================================
 * Construtor de cadeira + comparador
 * =================================================================== */
export function chairBuilder(host) {
  const subs = { '1u': 'tBu', '3u': 'CH3' };
  const list = h('div'), c = h('select', { 'aria-label': 'Carbono' }, [1, 2, 3, 4, 5, 6].map((k) => h('option', { value: k }, 'C' + k)));
  const gsel = h('select', { 'aria-label': 'Grupo' }, ['CH3', 'Et', 'iPr', 'tBu', 'OH', 'Cl', 'Br'].map((g) => h('option', { value: g }, gname(g, 1))));
  const fsel = h('select', { 'aria-label': 'Face' }, h('option', { value: 'u' }, 'up (para cima)'), h('option', { value: 'd' }, 'down (para baixo)'));
  const emptyFig = h('div', { class: 'projbox' });
  const pair = h('div');
  host.append(h('div', { class: 'split' }, h('div', null, h('h4', null, 'Cadeira vazia (carbonos numerados)'), emptyFig), h('div', null, h('h4', null, 'Adicionar substituinte'), h('div', { class: 'controls' }, c, gsel, fsel, h('button', { class: 'btn sm primary', type: 'button', onclick: add }, '+ adicionar'), h('button', { class: 'btn sm', type: 'button', onclick: () => { Object.keys(subs).forEach((k) => delete subs[k]); refresh(); } }, 'limpar')), list,
    h('p', { class: 'hint3' }, 'A posição axial/equatorial é decidida automaticamente pela cadeira; você escolhe apenas up/down (que define cis/trans).'))), pair);
  emptyFig.append(chairSVG({}, 0, { num: true, H: true, color: true, scale: 50 }));
  function add() { const k = c.value; delete subs[k + 'u']; delete subs[k + 'd']; subs[k + fsel.value] = gsel.value; refresh(); }
  let cp = null;
  function refresh() {
    list.innerHTML = '';
    Object.entries(subs).forEach(([k, g]) => list.append(h('div', { class: 'mrow' }, h('span', { html: `<b>${gname(g, 1)}</b> em C${k[0]} · ${k[1] === 'u' ? 'up' : 'down'} · cadeira A: <b>${roleOf(+k[0], k[1], false) === 'ax' ? 'axial' : 'equatorial'}</b>` }), h('button', { class: 'btn sm ghost', type: 'button', onclick: () => { delete subs[k]; refresh(); } }, '✕'))));
    pair.innerHTML = ''; cp = customPair(pair, Object.assign({}, subs));
  }
  refresh();
  void cp;
}
function customPair(host, subs) {
  const A = h('div', { class: 'viewer short' }), B = h('div', { class: 'viewer short' }), res = h('div', { 'aria-live': 'polite' });
  const a = analyzeChair(subs, false), b = analyzeChair(subs, true);
  const tbl = (an) => h('div', null, h('p', null, `grupos axiais: ${an.nAx}${an.nAx ? ' (' + an.list.filter((x) => x.role === 'ax').map((x) => gname(x.g, 1)).join(', ') + ')' : ''}`));
  host.append(h('div', { class: 'grid2' }, h('div', { class: 'chcard' }, h('h4', null, 'Cadeira A'), A, tbl(a)), h('div', { class: 'chcard' }, h('h4', null, 'Cadeira B (flip)'), B, tbl(b))),
    h('div', { class: 'note quick' }, h('b', { class: 't' }, 'Antes de ver'), 'Qual conformação você acredita ser mais estável?', h('div', { class: 'qopts' }, ['A', 'B', 'iguais'].map((x) => h('button', { class: 'btn sm', type: 'button', onclick: () => {
      const d = a.E - b.E; const best = Math.abs(d) < 0.6 ? 'iguais' : d < 0 ? 'A' : 'B';
      res.innerHTML = `<div class="fb ${x === best ? 'ok' : 'bad'}">${x === best ? '✔' : '✘'} <b>Conformação mais estável: ${best === 'iguais' ? 'nenhuma (mesma energia)' : 'cadeira ' + best}</b>.<br>A ≈ ${kj(a.E)} kJ/mol (${a.notes.join('; ') || 'nenhum grupo axial'}).<br>B ≈ ${kj(b.E)} kJ/mol (${b.notes.join('; ') || 'nenhum grupo axial'}).<br>Regra: o grupo mais volumoso tende a ficar equatorial; grupos axiais grandes pagam interações 1,3-diaxiais.</div>`;
    } }, x)))), res);
  chairScene(A, { subs, color: true, diax: true, nums: true }); chairScene(B, { subs, color: true, diax: true, nums: true, u: 1 });
}

/* ===================================================================
 * Construtor de Newman (gera Newman, cavalete e 3D)
 * =================================================================== */
export function newmanBuilder(host) {
  const gs = ['H', 'CH3', 'Et', 'iPr', 'tBu', 'Cl', 'OH'];
  const R = { n: 'molécula montada', bond: 'C1–C2', front: ['CH3', 'H', 'H'], back: ['CH3', 'H', 'H'] };
  const mk = (side, i) => { const s = h('select', { 'aria-label': (side === 'front' ? 'grupo da frente ' : 'grupo de trás ') + (i + 1) }, gs.map((g) => h('option', { value: g, selected: g === R[side][i] ? true : null }, gname(g, 1)))); s.addEventListener('change', () => { R[side][i] = s.value; panel.setR(Object.assign({}, R, { front: R.front.slice(), back: R.back.slice() })); }); return s; };
  host.append(h('div', { class: 'grid2' }, h('div', { class: 'card left' }, h('b', { class: 'cf' }, 'Carbono da frente: '), ...[0, 1, 2].map((i) => mk('front', i))), h('div', { class: 'card left' }, h('b', { class: 'cb' }, 'Carbono de trás: '), ...[0, 1, 2].map((i) => mk('back', i)))));
  const p = h('div'); host.append(p);
  const panel = rotorPanel(p, { R: Object.assign({}, R, { front: R.front.slice(), back: R.back.slice() }), phi: 60, energy: true });
}

/* ===================================================================
 * Laboratório conformacional
 * =================================================================== */
export const LABMOLS = {
  etano: ['rotor', 'etano'], propano: ['rotor', 'propano'], butano: ['rotor', 'butano'], metilbutano: ['rotor', 'metilbutano'], dimetilbutano: ['rotor', 'dimetilbutano'], pentano: ['rotor', 'pentano'], hexano: ['rotor', 'hexano'],
  ciclopropano: ['ring', 3], ciclobutano: ['ring', 4], ciclopentano: ['ring', 5],
  cicloexano: ['chair', {}], metilcicloexano: ['chair', { '1u': 'CH3' }], tbutilcicloexano: ['chair', { '1u': 'tBu' }],
  dimetil12: ['chair2', '12'], dimetil13: ['chair2', '13'], dimetil14: ['chair2', '14'],
};
const LABNAMES = { etano: 'etano', propano: 'propano', butano: 'butano', metilbutano: '2-metilbutano', dimetilbutano: '2,3-dimetilbutano', pentano: 'pentano', hexano: 'hexano', ciclopropano: 'ciclopropano', ciclobutano: 'ciclobutano', ciclopentano: 'ciclopentano', cicloexano: 'ciclo-hexano', metilcicloexano: 'metilciclo-hexano', tbutilcicloexano: 'terc-butilciclo-hexano', dimetil12: '1,2-dimetilciclo-hexano', dimetil13: '1,3-dimetilciclo-hexano', dimetil14: '1,4-dimetilciclo-hexano' };
export function lab(host) {
  const list = h('div', { class: 'opts', role: 'listbox', 'aria-label': 'Moléculas' });
  const area = h('div');
  const groups = [['Cadeias abertas', ['etano', 'propano', 'butano', 'metilbutano', 'dimetilbutano', 'pentano', 'hexano']], ['Cicloalcanos', ['ciclopropano', 'ciclobutano', 'ciclopentano', 'cicloexano']], ['Ciclo-hexanos substituídos', ['metilcicloexano', 'tbutilcicloexano', 'dimetil12', 'dimetil13', 'dimetil14']]];
  groups.forEach(([t, ks]) => { list.append(h('div', { class: 'optgroup-t' }, t)); ks.forEach((k) => list.append(h('label', { class: 'opt-radio' }, h('input', { type: 'radio', name: 'clab', value: k, checked: k === 'butano' ? true : null }), h('span', null, LABNAMES[k])))); });
  host.append(h('div', { class: 'labgrid' }, h('div', { class: 'optgroup' }, h('h4', null, 'Moléculas'), list), area));
  let disposers = [];
  list.addEventListener('change', (e) => build(e.target.value));
  function build(k) {
    disposers.forEach((f) => f()); disposers = [];
    [...VIEWERS].forEach((v) => { if (area.contains(v.host)) v.dispose(); });
    area.innerHTML = ''; go(k);
  }
  function go(k) {
    const [type, arg] = LABMOLS[k];
    area.append(h('h3', { class: 'block-title' }, LABNAMES[k]));
    if (type === 'rotor') rotorPanel(area, { rotors: [arg], dirToggle: true });
    else if (type === 'ring') cycloalkanes(area, { n: arg, fixed: true, anim: arg > 3 });
    else if (type === 'chair') labChair(area, arg);
    else chairPair(area, { pos: arg, fixed: false });
  }
  go('butano');
}
function labChair(host, subs) {
  flipSim(host, { subs });
  if (Object.keys(subs).length) host.append(h('p', { class: 'hint3', html: `Cadeira A: ${Object.entries(subs).map(([k, g]) => `${gname(g, 1)} ${roleOf(+k[0], k[1], false) === 'ax' ? 'axial' : 'equatorial'}`).join(', ')} (≈ ${kj(analyzeChair(subs, false).E)} kJ/mol) · Cadeira B: ${Object.entries(subs).map(([k, g]) => `${gname(g, 1)} ${roleOf(+k[0], k[1], true) === 'ax' ? 'axial' : 'equatorial'}`).join(', ')} (≈ ${kj(analyzeChair(subs, true).E)} kJ/mol)` }));
}
