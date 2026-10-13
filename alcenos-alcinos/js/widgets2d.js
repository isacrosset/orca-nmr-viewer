/*
 * widgets2d.js — componentes interativos 2D: nomenclatura, E/Z, estabilidade,
 * Markovnikov, ozonólise, acidez, simulador, comparador, tabelas e mapas.
 */
import { mol, el as sel, S } from './chem2d.js';
import { M, NOMEN, L, Z } from './struct.js';
import { SUBS, REAG, PR, product, MAP_ALKENE, MAP_ALKYNE } from './rxn.js';

export function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  if (attrs) for (const k in attrs) {
    if (k === 'class') e.className = attrs[k];
    else if (k === 'html') e.innerHTML = attrs[k];
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), attrs[k]);
    else if (attrs[k] !== null && attrs[k] !== undefined && attrs[k] !== false) e.setAttribute(k, attrs[k]);
  }
  kids.flat().forEach((k) => { if (k !== null && k !== undefined) e.append(k.nodeType ? k : document.createTextNode(k)); });
  return e;
}
export const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const seg = (opts, cur, onPick, label) => {
  const box = h('div', { class: 'seg', role: 'group', 'aria-label': label || 'opções' });
  opts.forEach(([k, t]) => box.append(h('button', { type: 'button', 'aria-pressed': k === cur ? 'true' : 'false', 'data-k': k, html: t, onclick: () => { [...box.children].forEach((b) => b.setAttribute('aria-pressed', b.dataset.k === k)); onPick(k); } })));
  return box;
};
/** desenha uma ou mais chaves de M lado a lado (com "+") */
export function drawKeys(keys, o = {}) {
  const arr = Array.isArray(keys) ? keys : [keys];
  const box = h('div', { class: 'rxline' });
  arr.forEach((k, i) => { if (i) box.append(h('span', { class: 'arrow' }, '+')); box.append(h('div', { style: `width:${o.w || 170}px` }, mol(M[k](), { scale: o.scale || 34, fs: o.fs || 15 }))); });
  return box;
}

/* ===================================================================
 * Player de mecanismos 2D
 * =================================================================== */
export function player(host, frames, o = {}) {
  let i = 0, timer = null;
  const stage = h('div', { class: 'stage', 'aria-live': 'polite' });
  const cap = h('div', { class: 'pcap' });
  const dots = h('div', { class: 'dots' }, frames.map(() => h('i')));
  const prev = h('button', { class: 'btn sm', type: 'button', onclick: () => { stop(); go(i - 1); } }, '◀ Anterior');
  const next = h('button', { class: 'btn sm', type: 'button', onclick: () => { stop(); go(i + 1); } }, 'Passo a passo ▶');
  const play = h('button', { class: 'btn sm primary', type: 'button', onclick: () => toggle() }, '▶ Reproduzir');
  const reset = h('button', { class: 'btn sm', type: 'button', onclick: () => { stop(); go(0); } }, '⟲ Reiniciar');
  const root = h('div', { class: 'player mech' }, stage, cap, h('div', { class: 'pctrl' }, play, prev, next, reset, dots));
  host.appendChild(root);
  function go(k) {
    i = Math.max(0, Math.min(frames.length - 1, k));
    stage.innerHTML = '';
    const f = frames[i];
    stage.appendChild(mol(f.s, Object.assign({ animate: true, scale: 44, zoom: 1.4 }, o.draw || {}, f.o || {})));
    cap.innerHTML = f.cap || '';
    [...dots.children].forEach((d, n) => d.classList.toggle('on', n === i));
    prev.disabled = i === 0; next.disabled = i === frames.length - 1;
  }
  function stop() { if (timer) { clearInterval(timer); timer = null; play.textContent = '▶ Reproduzir'; } }
  function toggle() {
    if (timer) { stop(); return; }
    if (i === frames.length - 1) go(0);
    play.textContent = '❚❚ Pausar';
    timer = setInterval(() => { if (i >= frames.length - 1) { stop(); return; } go(i + 1); }, o.interval || 3200);
  }
  go(0);
  return { go, root, stop };
}

export function quickTests(root) {
  root.querySelectorAll('.note.quick[data-q]:not([data-done])').forEach((n) => {
    n.setAttribute('data-done', '');
    const opts = n.dataset.o.split(';');
    const a = +n.dataset.a;
    const fb = h('div', { class: 'qfb', 'aria-live': 'polite' });
    const box = h('div', { class: 'qopts' }, opts.map((t, k) => h('button', {
      class: 'btn sm', type: 'button',
      onclick: (e) => {
        [...box.children].forEach((b) => { b.disabled = true; });
        e.currentTarget.classList.add(k === a ? 'primary' : 'ghost');
        fb.innerHTML = (k === a ? '<b style="color:var(--green)">✔ Correto.</b> ' : `<b style="color:var(--red)">✘ Resposta: ${opts[a]}.</b> `) + n.dataset.e;
      },
    }, t)));
    n.innerHTML = `<b class="t">Teste rápido</b>${n.dataset.q}`;
    n.append(box, fb);
  });
}

/* ===================================================================
 * Átomos clicáveis sobre uma estrutura
 * =================================================================== */
function clickable(s, o = {}) {
  const svg = mol(s, { scale: o.scale || 52, fs: 18, zoom: o.zoom || 1.5, pad: 22 });
  const C = svg._chem;
  const over = sel('g', { transform: C.transform }, svg);
  const nodes = {}, nums = sel('g', null, over);
  C.atoms.forEach((a, i) => {
    if (o.only && !o.only.includes(i)) return;
    if (a.label && !/^(C|CH|CH2|H2C|CH3|H3C)$/.test(a.label) && !o.all) return;
    const g = sel('g', { class: 'pk', tabindex: 0, role: 'button', 'aria-label': 'átomo ' + (a.label || 'C') + ' ' + i }, over);
    sel('circle', { cx: a.x, cy: a.y, r: a.label ? Math.max(14, a.w / 2 + 4) : 12 }, g);
    nodes[i] = g;
    const fire = () => o.onPick && o.onPick(i, g);
    g.addEventListener('click', fire);
    g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(); } });
  });
  const number = (map) => {
    while (nums.firstChild) nums.removeChild(nums.firstChild);
    Object.entries(map).forEach(([i, n]) => { const a = C.atoms[i]; const t = sel('text', { x: a.x + 11, y: a.y - 13, class: 'numlab', 'font-size': 14, 'font-weight': 800, fill: '#ffd45c' }, nums); t.textContent = n; });
  };
  return { svg, nodes, number, C };
}

/* ===================================================================
 * Nomenclatura: cadeia principal → numeração → nome
 * =================================================================== */
const TILE_EXTRA = ['1', '2', '3', '5', 'hex', 'hept', 'pent', 'but', 'eno', 'dieno', 'ino', 'metil', 'etil', '3-metil', '5-metil', '2,2-dimetil', 'ciclo-hexeno', 'en', 'trieno'];
export const NOMEN_YNE = [
  { k: 'y1', s: () => L(['H3C', '', '', 'CH2CH3'], [1, 3, 1]), name: 'pent-2-ino', parts: ['pent', '2', 'ino'], hint: '5 carbonos; numere pelo lado mais próximo da tripla: C2.' },
  { k: 'y2', s: () => L(['H3C', '', '', 'CH(CH3)2'], [1, 3, 1]), name: '4-metilpent-2-ino', parts: ['4-metil', 'pent', '2', 'ino'], hint: 'Cadeia de 5 C contendo a tripla; numerando pela esquerda a tripla fica em C2 e a metila em C4.' },
  { k: 'y3', s: () => L(['H', '', '', 'C(CH3)3'], [1, 3, 1]), name: '3,3-dimetilbut-1-ino', parts: ['3,3-dimetil', 'but', '1', 'ino'], hint: 'Alcino terminal: o C≡CH é C1; duas metilas em C3.' },
  { k: 'y4', s: () => L(['H2C', 'CH', 'CH2', '', '', 'H'], [2, 1, 1, 3, 1]), name: 'pent-1-en-4-ino', parts: ['pent', '1', 'en', '4', 'ino'], hint: 'Dupla e tripla: menor conjunto de localizadores {1,4} nos dois sentidos; no empate, a dupla recebe o menor número. Sufixo: "-en-…-ino".' },
  { k: 'y5', s: () => L(['CH3CH2', '', '', 'CH2CH3'], [1, 3, 1]), name: 'hex-3-ino', parts: ['hex', '3', 'ino'], hint: 'Alcino interno simétrico de 6 C: tripla em C3 nos dois sentidos.' },
];
export function nomenTrainer(host, items, o = {}) {
  let item = items[0], step = 0, chosen = new Set(), built = [];
  const stage = h('div', { class: 'pick mech' });
  const prompt = h('p', { class: 'prompt', 'aria-live': 'polite' });
  const fb = h('div');
  const nameBox = h('div', { class: 'namebox', 'aria-live': 'polite' });
  const tiles = h('div', { class: 'tiles' });
  const controls = h('div', { class: 'ex-actions' });
  const tabs = seg(items.map((it, i) => [it.k, 'Exemplo ' + (i + 1)]), item.k, (k) => { item = items.find((x) => x.k === k); start(); }, 'Exemplo');
  host.append(h('div', { class: 'controls' }, tabs), stage, prompt, nameBox, tiles, controls, fb);
  let ui;
  function start() {
    chosen = new Set(); built = []; fb.innerHTML = ''; fb.className = '';
    const s = item.s();
    stage.innerHTML = '';
    const ids = s.ids || [];
    ui = clickable(s, { onPick: (i, g) => pick(i, g) });
    stage.append(ui.svg);
    step = item.main && !o.namesOnly ? 0 : 2;
    item._ids = ids;
    render();
  }
  function render() {
    controls.innerHTML = '';
    nameBox.style.display = step === 2 ? '' : 'none';
    tiles.style.display = step === 2 ? '' : 'none';
    if (step === 0) {
      prompt.innerHTML = '1 · Clique em <b>todos os carbonos da cadeia principal</b> (a cadeia mais longa que contém a ligação múltipla).';
      controls.append(h('button', { class: 'btn sm primary', type: 'button', onclick: checkChain }, 'Conferir cadeia'), h('button', { class: 'btn sm', type: 'button', onclick: () => { chosen = new Set(item.main.map((i) => item._ids[i])); paint(); checkChain(); } }, 'Mostrar'));
    } else if (step === 1) {
      prompt.innerHTML = '2 · Clique no carbono que recebe o <b>número 1</b> (a ligação múltipla deve ficar com o menor localizador).';
    } else {
      prompt.innerHTML = (item.main && !o.namesOnly ? '3 · ' : '') + 'Monte o nome clicando nas peças na ordem correta.';
      nameBox.textContent = built.join('-') || '…';
      tiles.innerHTML = '';
      const pool = shuffle([...new Set(item.parts.concat(shuffle(TILE_EXTRA.filter((x) => !item.parts.includes(x))).slice(0, 5)))]);
      pool.forEach((t) => tiles.append(h('button', { type: 'button', onclick: (e) => { built.push(t); e.currentTarget.disabled = true; nameBox.textContent = built.join('-'); } }, t)));
      controls.append(h('button', { class: 'btn sm primary', type: 'button', onclick: checkName }, 'Conferir nome'), h('button', { class: 'btn sm', type: 'button', onclick: () => { built = []; render(); } }, '↶ Limpar'), h('button', { class: 'btn sm', type: 'button', onclick: () => { fb.className = 'fb ok'; fb.innerHTML = `<b>Nome:</b> ${item.name}. ${item.hint}`; } }, 'Ver resposta'));
    }
  }
  function paint() { Object.entries(ui.nodes).forEach(([i, g]) => { g.classList.toggle('on', chosen.has(+i)); }); }
  function pick(i, g) {
    if (step === 0) { chosen.has(i) ? chosen.delete(i) : chosen.add(i); paint(); return; }
    if (step === 1) {
      const pos = item._ids.indexOf(i);
      if (pos >= 0 && item.num[pos] === 0) {
        g.classList.add('ok');
        const map = {}; item.main.forEach((ci) => { map[item._ids[ci]] = item.num[ci] + 1; });
        ui.number(map);
        fb.className = 'fb ok'; fb.innerHTML = '✔ Isso! ' + item.hint;
        step = 2; render();
      } else {
        g.classList.add('bad'); setTimeout(() => g.classList.remove('bad'), 800);
        fb.className = 'fb bad'; fb.innerHTML = '✘ Numerando por aí, a ligação múltipla não recebe o menor localizador possível (ou esse carbono não é uma extremidade da cadeia principal).';
      }
    }
  }
  function checkChain() {
    const want = new Set(item.main.map((i) => item._ids[i]));
    const ok = want.size === chosen.size && [...want].every((x) => chosen.has(x));
    Object.entries(ui.nodes).forEach(([i, g]) => { i = +i; g.classList.remove('on'); g.classList.toggle('ok', chosen.has(i) && want.has(i)); g.classList.toggle('bad', chosen.has(i) && !want.has(i)); g.classList.toggle('miss', !chosen.has(i) && want.has(i)); });
    fb.className = 'fb ' + (ok ? 'ok' : 'bad');
    fb.innerHTML = ok ? `✔ Cadeia principal correta: ${want.size} carbonos, contendo a ligação dupla.` : '✘ A cadeia principal deve conter os <b>dois carbonos da ligação múltipla</b> e ser a mais longa possível nessa condição. Carbonos fora dela são substituintes.';
    if (ok) { step = 1; setTimeout(() => { Object.values(ui.nodes).forEach((g) => g.classList.remove('ok', 'bad', 'miss')); render(); }, 700); }
  }
  function checkName() {
    const norm = (x) => x.replace(/[-\s]/g, '');
    const ok = norm(built.join('')) === norm(item.parts.join(''));
    fb.className = 'fb ' + (ok ? 'ok' : 'bad');
    fb.innerHTML = ok ? `✔ <b>${item.name}</b>. ${item.hint}` : '✘ Ainda não. Ordem: substituintes (com localizadores) + prefixo da cadeia + localizador da ligação múltipla + sufixo (-eno, -ino).';
  }
  start();
}

/* ===================================================================
 * E ou Z? (prioridades CIP)
 * =================================================================== */
const EZ = [
  { a: ['CH3', 'H'], b: ['CH3', 'H'], pa: 0, pb: 0, why: 'Em cada carbono, CH₃ (C) > H. Os dois CH₃ estão do mesmo lado → <b>Z</b> (= cis).' },
  { a: ['Br', 'CH3'], b: ['CH3', 'H'], pa: 0, pb: 0, why: 'C1: Br (Z = 35) > CH₃ (C). C2: CH₃ > H. Br e CH₃ do mesmo lado → <b>Z</b>.' },
  { a: ['Cl', 'Br'], b: ['CH2CH3', 'CH3'], pa: 1, pb: 0, why: 'C1: Br > Cl (número atômico). C2: CH₂CH₃ > CH₃ (no 1º ponto de diferença: (C,H,H) > (H,H,H)). Br embaixo e etila em cima → <b>E</b>.' },
  { a: ['OH', 'CH3'], b: ['CH(CH3)2', 'CH2CH2OH'], pa: 0, pb: 0, why: 'C1: OH > CH₃. C2: compare o 1º átomo de cada lado: isopropila (C,C,H) > CH₂CH₂OH (C,H,H) — o O "distante" não importa no 1º ponto de diferença. OH e isopropila do mesmo lado → <b>Z</b>.' },
  { a: ['CH2OH', 'CH(CH3)2'], b: ['H', 'CH3'], pa: 0, pb: 1, why: 'C1: CH₂OH (O,H,H) > CH(CH₃)₂ (C,C,H), pois O > C no primeiro átomo diferente. C2: CH₃ > H. Prioridades em lados opostos → <b>E</b>.' },
];
export function ezActivity(host) {
  let i = 0;
  const stage = h('div');
  host.append(h('div', { class: 'controls' }, seg(EZ.map((_, k) => [String(k), 'Alceno ' + (k + 1)]), '0', (k) => { i = +k; draw(); }, 'Exemplo')), stage);
  function draw() {
    const ex = EZ[i];
    const s = new S();
    const c1 = s.a(0, 0, '', {}), c2 = s.a(1.3, 0, '', {});
    s.b(c1, c2, 2);
    const g = [s.br(c1, 125, ex.a[0], 1, null, 1.1), s.br(c1, 235, ex.a[1], 1, null, 1.1), s.br(c2, 55, ex.b[0], 1, null, 1.1), s.br(c2, 305, ex.b[1], 1, null, 1.1)];
    stage.innerHTML = '';
    const svg = mol(s, { scale: 50, fs: 17, zoom: 1.4 });
    const pa = h('div', { class: 'controls' }, h('span', { class: 'chip' }, 'maior prioridade no C da esquerda:'), seg([['0', ex.a[0]], ['1', ex.a[1]]], null, (k) => { st.pa = +k; }, 'C esquerdo'));
    const pb = h('div', { class: 'controls' }, h('span', { class: 'chip' }, 'maior prioridade no C da direita:'), seg([['0', ex.b[0]], ['1', ex.b[1]]], null, (k) => { st.pb = +k; }, 'C direito'));
    const ez = h('div', { class: 'controls' }, h('span', { class: 'chip' }, 'configuração:'), seg([['E', 'E (entgegen)'], ['Z', 'Z (zusammen)']], null, (k) => { st.ez = k; }, 'E ou Z'));
    const fb = h('div');
    const st = { pa: null, pb: null, ez: null };
    stage.append(h('div', { class: 'split' }, h('figure', { class: 'fig' }, svg), h('div', null, pa, pb, ez,
      h('div', { class: 'ex-actions' }, h('button', { class: 'btn sm primary', type: 'button', onclick: () => {
        const ans = (ex.pa === 0) === (ex.pb === 0) ? 'Z' : 'E';
        const ok1 = st.pa === ex.pa, ok2 = st.pb === ex.pb, ok3 = st.ez === ans;
        fb.className = 'fb ' + (ok1 && ok2 && ok3 ? 'ok' : 'bad');
        fb.innerHTML = `${ok1 ? '✔' : '✘'} C esquerdo · ${ok2 ? '✔' : '✘'} C direito · ${ok3 ? '✔' : '✘'} configuração<br>${ex.why}`;
      } }, 'Conferir'), h('button', { class: 'btn sm', type: 'button', onclick: () => { fb.className = 'fb ok'; fb.innerHTML = ex.why; } }, 'Ver resposta')), fb)));
    void g;
  }
  draw();
}

/* ===================================================================
 * Estabilidade: calores de hidrogenação
 * =================================================================== */
const ALK = [
  ['eteno', 'não substituído', 137, 'eteno'], ['propeno', 'monossubstituído', 126, 'propeno'], ['but1eno', 'monossubstituído', 127, 'but-1-eno'],
  ['but2enoZ', 'dissubstituído (cis)', 120, '(Z)-but-2-eno'], ['metilpropeno', 'dissubstituído (1,1)', 119, '2-metilpropeno'], ['but2enoE', 'dissubstituído (trans)', 116, '(E)-but-2-eno'],
  ['metilbut2eno', 'trissubstituído', 113, '2-metilbut-2-eno'], ['dimetilbut2eno', 'tetrassubstituído', 111, '2,3-dimetilbut-2-eno'],
];
export function stability(host) {
  const rows = h('div');
  const info = h('div', { class: 'stepcap' }, 'Clique em um alceno para ver a estrutura.');
  host.append(h('p', { class: 'hint', style: 'color:var(--muted);font-size:.88rem', html: '−ΔH°<sub>hidrog</sub> (kJ/mol, aproximado). <b>Menor calor liberado = alceno mais estável.</b>' }), rows, info);
  ALK.forEach(([k, sub, dH, name]) => {
    const r = h('div', { class: 'hmeter', tabindex: 0, role: 'button', style: 'cursor:pointer' }, h('span', { html: `<b>${name}</b><br><small style="color:var(--muted)">${sub}</small>` }), h('div', { class: 'bar' }, h('span', { style: `width:${(dH - 100) / 40 * 100}%` })), h('small', null, dH + ' kJ'));
    const show = () => { info.innerHTML = ''; info.append(h('div', { class: 'figs' }, h('figure', { class: 'fig' }, mol(M[k](), { scale: 40, zoom: 1.2 }), h('figcaption', { html: `<b>${name}</b> · ${sub} · −ΔH°hidrog ≈ ${dH} kJ/mol` })))); };
    r.addEventListener('click', show); r.addEventListener('keydown', (e) => { if (e.key === 'Enter') show(); });
    rows.append(r);
  });
}
/** diagrama de níveis: butenos → butano */
export function hydrogenationLevels(host) {
  const W = 680, H = 330, base = 290, k = 1.9;
  const svg = sel('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chem', role: 'img', 'aria-label': 'Diagrama de energia: but-1-eno, cis e trans-but-2-eno hidrogenados a butano' });
  svg.style.maxWidth = W + 'px';
  const lv = [['but-1-eno + H₂', 127, '#ff4fa3'], ['(Z)-but-2-eno + H₂', 120, '#ff9f43'], ['(E)-but-2-eno + H₂', 116, '#3ddc97']];
  const y = (e) => base - (e - 100) * k * 4.2;
  lv.forEach(([n, e, c], i) => {
    const x = 70 + i * 200;
    sel('line', { x1: x, x2: x + 150, y1: y(e), y2: y(e), stroke: c, 'stroke-width': 4 }, svg);
    const t = sel('text', { x: x + 75, y: y(e) - 10, 'text-anchor': 'middle', fill: '#e8eef9', 'font-size': 14, 'font-weight': 700 }, svg); t.textContent = n;
    sel('line', { x1: x + 75, x2: x + 75, y1: y(e) + 6, y2: base - 8, stroke: c, 'stroke-width': 2, 'stroke-dasharray': '5 4' }, svg);
    const t2 = sel('text', { x: x + 82, y: (y(e) + base) / 2, fill: c, 'font-size': 14, 'font-weight': 800 }, svg); t2.textContent = `−${e} kJ/mol`;
  });
  sel('line', { x1: 50, x2: 650, y1: base, y2: base, stroke: '#9fb0cc', 'stroke-width': 4 }, svg);
  const tb = sel('text', { x: 350, y: base + 24, 'text-anchor': 'middle', fill: '#9fb0cc', 'font-size': 14, 'font-weight': 700 }, svg); tb.textContent = 'butano (mesmo produto)';
  const ty = sel('text', { x: 18, y: 160, transform: 'rotate(-90 18 160)', 'text-anchor': 'middle', fill: '#9fb0cc', 'font-size': 13 }, svg); ty.textContent = 'energia (entalpia) →';
  host.append(svg, h('p', { class: 'hint', style: 'color:var(--muted);font-size:.86rem' }, 'Como os três dão o mesmo alcano, a diferença nos calores liberados reflete diretamente a diferença de energia (estabilidade) entre os alcenos. Escala vertical expandida.'));
}

/* ===================================================================
 * Markovnikov: marque o carbono protonado
 * =================================================================== */
const MK = [
  { t: 'propeno', s: () => { const s = new S(); const a = s.a(0, 0, 'H2C'), b = s.a(1.35, 0, 'CH'), c = s.a(2.7, 0, 'CH3'); s.b(a, b, 2).b(b, c); return s; }, only: [0, 1], ok: 0, why: 'Protonando o CH₂ forma-se o carbocátion <b>secundário</b> (CH₃)₂CH⁺. Protonando o CH, formaria o <b>primário</b> CH₃CH₂CH₂⁺, muito menos estável. Produto: 2-bromopropano.' },
  { t: '2-metilpropeno', s: () => { const s = new S(); const a = s.a(0, 0, 'H2C'), b = s.a(1.35, 0, 'C'); s.b(a, b, 2); s.br(b, 30, 'CH3'); s.br(b, 330, 'CH3'); return s; }, only: [0, 1], ok: 0, why: 'H no CH₂ → carbocátion <b>terciário</b> (CH₃)₃C⁺. A alternativa seria um cátion primário. Produto: 2-bromo-2-metilpropano.' },
  { t: '1-metilciclo-hexeno', s: () => M.metilciclohexeno(), only: [0, 1], ok: 1, why: 'H no CH do anel (C2) → carbocátion <b>terciário</b> no C que tem o CH₃. Protonar C1 daria um cátion secundário. Produto: 1-bromo-1-metilciclo-hexano.' },
  { t: '3-metilbut-1-eno', s: () => { const s = new S(); const a = s.a(0, 0, 'H2C'), b = s.a(1.35, 0, 'CH'), c = s.a(2.7, 0, 'CH'), d = s.a(4.05, 0, 'CH3'); s.b(a, b, 2).b(b, c).b(c, d); s.br(c, 270, 'CH3'); return s; }, only: [0, 1], ok: 0, why: 'H no CH₂ → cátion <b>secundário</b>. Atenção: esse cátion ainda pode sofrer <b>migração de hidreto</b> e virar terciário (veja "Rearranjos").' },
];
export function markovPick(host) {
  let i = 0;
  const stage = h('div', { class: 'pick mech' }), fb = h('div');
  host.append(h('div', { class: 'controls' }, seg(MK.map((m, k) => [String(k), m.t]), '0', (k) => { i = +k; draw(); }, 'Alceno')), h('p', { class: 'prompt' }, 'Marque o carbono que será protonado primeiro pelo HBr.'), stage, fb);
  function draw() {
    const m = MK[i];
    stage.innerHTML = ''; fb.innerHTML = ''; fb.className = '';
    const ui = clickable(m.s(), { only: m.only, all: true, onPick: (k, g) => {
      Object.values(ui.nodes).forEach((x) => x.classList.remove('ok', 'bad'));
      const ok = k === m.only[m.ok];
      g.classList.add(ok ? 'ok' : 'bad');
      fb.className = 'fb ' + (ok ? 'ok' : 'bad');
      fb.innerHTML = (ok ? '✔ Correto. ' : '✘ Não: compare os carbocátions que se formariam. ') + m.why;
    } });
    stage.append(ui.svg);
  }
  draw();
}

/* ===================================================================
 * Ozonólise: "corte a ligação dupla"
 * =================================================================== */
const OZ = [
  { k: 'metilbut2eno', t: '2-metilbut-2-eno', red: ['propanona', 'etanal'], ox: 'propanona + ácido acético' },
  { k: 'metilciclohexeno', t: '1-metilciclo-hexeno', red: ['oxoheptanal'], ox: 'ácido 6-oxo-heptanoico (um único produto: o anel se abre)' },
  { k: 'propeno', t: 'propeno', red: ['etanal', 'metanal'], ox: 'ácido acético + CO₂ (o CH₂ terminal vai a HCOOH → CO₂)' },
  { k: 'dimetilbut2eno', t: '2,3-dimetilbut-2-eno', red: ['propanona', 'propanona'], ox: '2 propanona (cetonas não são oxidadas)' },
  { k: 'but2enoE', t: '(E)-but-2-eno', red: ['etanal', 'etanal'], ox: '2 ácido acético' },
  { k: 'ciclohexeno', t: 'ciclo-hexeno', red: ['hexanodial'], ox: 'ácido hexanodioico (adípico)' },
];
export function ozonolysisCutter(host) {
  let i = 0, mode = 'red';
  const stage = h('div', { class: 'pick mech' }), out = h('div', { 'aria-live': 'polite' });
  host.append(h('div', { class: 'controls' }, seg(OZ.map((o, k) => [String(k), o.t]), '0', (k) => { i = +k; draw(); }, 'Alceno')),
    h('div', { class: 'controls' }, h('span', { class: 'chip' }, 'condição:'), seg([['red', '1. O₃ 2. (CH₃)₂S (redutiva)'], ['ox', '1. O₃ 2. H₂O₂ (oxidativa)']], mode, (k) => { mode = k; if (out.innerHTML) cut(); }, 'Condição')),
    h('p', { class: 'prompt' }, '✂ Clique sobre a ligação C=C para "cortá-la".'), stage, out);
  function draw() {
    const z = OZ[i];
    out.innerHTML = '';
    stage.innerHTML = '';
    const s = M[z.k]();
    const svg = mol(s, { scale: 52, fs: 18, zoom: 1.5, pad: 22 });
    const C = svg._chem;
    const over = sel('g', { transform: C.transform }, svg);
    s.bonds.forEach((b) => {
      if (b[2] !== 2) return;
      const A = C.atoms[b[0]], B = C.atoms[b[1]];
      const g = sel('g', { class: 'pk', tabindex: 0, role: 'button', 'aria-label': 'ligação dupla C=C' }, over);
      const ang = Math.atan2(B.y - A.y, B.x - A.x) * 180 / Math.PI;
      sel('ellipse', { cx: (A.x + B.x) / 2, cy: (A.y + B.y) / 2, rx: 22, ry: 12, transform: `rotate(${ang} ${(A.x + B.x) / 2} ${(A.y + B.y) / 2})`, style: 'fill:rgba(47,212,245,.15);stroke:var(--cyan);stroke-dasharray:4 3' }, g);
      const go = () => { g.classList.add('ok'); cut(); };
      g.addEventListener('click', go); g.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
    });
    stage.append(svg);
  }
  function cut() {
    const z = OZ[i];
    out.innerHTML = '';
    if (mode === 'red') out.append(h('div', { class: 'fb ok', html: '<b>C=C → C=O + O=C.</b> Cada carbono da dupla vira um carbono carbonílico. H no carbono da dupla → aldeído; dois grupos alquila → cetona.' }), drawKeys(z.red, { w: 300, scale: 40, fs: 16 }));
    else out.append(h('div', { class: 'fb ok', html: `<b>Condição oxidativa:</b> os aldeídos são oxidados a ácidos carboxílicos (cetonas permanecem). Produtos: <b>${z.ox}</b>.` }));
  }
  draw();
}

/* ===================================================================
 * Acidez: pKa e escolha da base
 * =================================================================== */
const ACID = [['etano (C sp³, 25% s)', 50], ['eteno (C sp², 33% s)', 44], ['etino (C sp, 50% s)', 25]];
const BASES = [['HO⁻ (NaOH)', 15.7, 'H₂O'], ['CH₃CH₂O⁻', 16, 'CH₃CH₂OH'], ['NH₂⁻ (NaNH₂)', 38, 'NH₃'], ['H⁻ (NaH)', 35, 'H₂'], ['CH₃Li (CH₃⁻)', 50, 'CH₄']];
export function pka(host) {
  const bars = h('div', { class: 'pka' });
  ACID.forEach(([n, p]) => bars.append(h('div', { class: 'hmeter' }, h('span', { html: `<b>${n}</b>` }), h('div', { class: 'bar' }, h('span', { style: `width:${(60 - p) / 40 * 100}%` })), h('small', null, 'pKa ≈ ' + p))));
  const out = h('div', { class: 'stepcap', 'aria-live': 'polite' }, 'Escolha uma base para tentar desprotonar o etino (pKa ≈ 25).');
  const btns = h('div', { class: 'reagents' }, BASES.map(([b, pk, conj]) => h('button', { type: 'button', onclick: (e) => {
    [...btns.children].forEach((x) => x.setAttribute('aria-pressed', x === e.currentTarget));
    const ok = pk > 25;
    out.innerHTML = `HC≡CH + ${b} ⇌ HC≡C⁻ + ${conj} &nbsp; (pKa do ${conj} ≈ ${pk})<br>` + (ok ? `<span class="status-ok">✔ Funciona</span>: o ácido conjugado formado (${conj}) é <b>mais fraco</b> que o etino (pKa ${pk} > 25), então o equilíbrio fica deslocado para o acetileto (K ≈ 10<sup>${Math.round(pk - 25)}</sup>).` : `<span class="status-bad">✘ Não funciona</span>: ${conj} (pKa ${pk}) é um ácido <b>mais forte</b> que o etino; o equilíbrio favorece os reagentes (K ≈ 10<sup>${(pk - 25).toFixed(0)}</sup>).`);
  } }, b)));
  host.append(h('p', { class: 'hint', style: 'color:var(--muted);font-size:.86rem' }, 'Barras: acidez relativa (mais longa = mais ácido). Valores aproximados.'), bars, h('h4', null, 'Qual base forma o acetileto?'), btns, out);
}

/* ===================================================================
 * Polimerização
 * =================================================================== */
const POLY = [['eteno', 'H', 'polietileno (PE)', 'sacolas, filmes, frascos'], ['propeno', 'CH3', 'polipropileno (PP)', 'embalagens, peças automotivas'], ['estireno', 'Ph', 'poliestireno (PS)', 'isopor® (expandido), copos'], ['cloreto de vinila', 'Cl', 'PVC', 'tubos, revestimentos']];
export function polymer(host) {
  const stage = h('div');
  host.append(h('div', { class: 'controls' }, seg(POLY.map((p, k) => [String(k), p[0]]), '0', (k) => draw(+k), 'Monômero')), stage);
  function draw(k) {
    const [n, X, poly, uso] = POLY[k];
    const mono = new S(); const a = mono.a(0, 0, 'H2C', { cls: 'pi' }), b = mono.a(1.35, 0, 'CH', { cls: 'pi' }); mono.b(a, b, 2); if (X !== 'H') mono.br(b, 270, X === 'Ph' ? 'C6H5' : X); else mono.atoms[1][2] = 'CH2';
    mono.t(-1.2, 0, 'n', 'note', 20);
    const pol = new S();
    const c = []; for (let i = 0; i < 6; i++) c.push(pol.a(i * 1.25, 0, i % 2 ? (X === 'H' ? 'CH2' : 'CH') : 'CH2', { cls: 'add' }));
    for (let i = 0; i < 5; i++) pol.b(c[i], c[i + 1]);
    if (X !== 'H') [1, 3, 5].forEach((i) => pol.br(c[i], 270, X === 'Ph' ? 'C6H5' : X));
    pol.t(-0.8, 0, '···', 'note', 20).t(7.0, 0, '···', 'note', 20);
    stage.innerHTML = '';
    stage.append(h('div', { class: 'rxline' }, h('div', { style: 'width:200px' }, mol(mono, { scale: 40 })), h('span', { class: 'arrow' }, '⟶'), h('div', { style: 'width:420px;max-width:100%' }, mol(pol, { scale: 36, fs: 15 }))),
      h('p', { html: `<b>${poly}</b> — usos: ${uso}. Cada ligação π vira uma ligação σ C–C da cadeia: a reação é uma sequência de <b>adições</b> (polímero de adição).` }));
  }
  draw(0);
}

/* ===================================================================
 * Tabelas expansíveis
 * =================================================================== */
export function expTable(host, head, rows, cls = []) {
  const tb = h('tbody');
  rows.forEach((r) => {
    const exp = h('tr', { class: 'exp', hidden: true }, h('td', { colspan: head.length, html: '💡 ' + r[r.length - 1] }));
    const row = h('tr', { class: 'row', tabindex: 0, role: 'button', 'aria-expanded': 'false' }, h('td', { html: r[0] }), ...r.slice(1, -1).map((c, i) => h('td', { class: cls[i] || '', html: c })));
    const tg = () => { const op = exp.hidden; exp.hidden = !op; row.classList.toggle('open', op); row.setAttribute('aria-expanded', op); };
    row.addEventListener('click', tg);
    row.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tg(); } });
    tb.append(row, exp);
  });
  host.append(h('div', { class: 'table-wrap' }, h('table', { class: 'cmp' }, h('thead', null, h('tr', null, head.map((t) => h('th', null, t)))), tb)),
    h('p', { class: 'hint', style: 'color:var(--dim);font-size:.8rem' }, 'Clique em uma linha para ver a explicação.'));
}
export function hydrationTable(host) {
  expTable(host, ['Método', 'Regioquímica', 'Estereoquímica', 'Rearranjo'], [
    ['H₂O / H₃O⁺', 'Markovnikov', 'não específica', 'possível', 'Passa por <b>carbocátion livre</b>: o OH vai para o carbono que melhor estabiliza a carga +; o cátion pode rearranjar (hidreto/alquila). Reversível (o inverso é a desidratação).'],
    ['1. Hg(OAc)₂, H₂O 2. NaBH₄', 'Markovnikov', 'anti na adição de Hg/OH; o NaBH₄ não é estereoespecífico', 'evitado', 'O íon <b>mercurínio</b> em ponte não é um carbocátion livre: a carga δ+ fica no C mais substituído (onde a água ataca), mas não há migração.'],
    ['1. BH₃·THF 2. H₂O₂, NaOH', '<b>anti-Markovnikov</b>', '<b>syn</b>', 'não', 'Adição <b>concertada</b> (ET de 4 centros): o B vai ao carbono menos impedido, que também comporta melhor a δ−; H e B entram pela mesma face. A oxidação troca B por OH com retenção.'],
  ]);
}
export function masterTable(host) {
  const rows = Object.entries(REAG).map(([k, r]) => [`<b>${r.t}</b>`, r.tr, r.regio, r.stereo, r.inter, r.rearr, `Use em: ${r.kind}. ${k === 'HBr' ? 'Exemplo: propeno → 2-bromopropano.' : ''} <a href="#${r.sec}">ver no módulo →</a>`]);
  expTable(host, ['Reagente', 'Transformação', 'Regioquímica', 'Estereoquímica', 'Intermediário', 'Rearranjo?'], rows);
}
export function alkVsAlkTable(host) {
  expTable(host, ['Característica', 'Alceno', 'Alcino'], [
    ['Hibridização', 'sp²', 'sp', 'Três orbitais híbridos (sp²) × dois (sp); o restante são orbitais p que formam ligações π.'],
    ['Geometria', 'trigonal planar', 'linear', 'Repulsão mínima entre 3 × 2 domínios eletrônicos.'],
    ['Ligações π', '1', '2 (perpendiculares)', 'C=C = σ + π; C≡C = σ + 2π.'],
    ['Ângulo', '≈ 120°', '180°', 'Veja no Laboratório 3D.'],
    ['Comprimento C–C', '≈ 1,34 Å', '≈ 1,20 Å', 'Mais ligações entre os átomos → ligação mais curta e forte (mas cada π é mais fraca que a σ).'],
    ['Isomeria E/Z', 'possível', 'não na tripla', 'Carbonos sp lineares: só há um substituinte em cada C da tripla.'],
    ['Hidrogenação', 'alcano', 'alceno (Lindlar, Na/NH₃) ou alcano', 'O controle da 1ª redução é a chave sintética dos alcinos.'],
    ['Acidez do H terminal', 'baixa (pKa ≈ 44)', 'maior (pKa ≈ 25)', 'Maior caráter s do C sp: o par do ânion fica mais próximo do núcleo e mais estabilizado.'],
    ['Formação de acetileto', 'não', 'sim (alcinos terminais)', 'NaNH₂ (pKa NH₃ ≈ 38) desprotona alcinos terminais.'],
    ['Adição eletrofílica', 'rápida', 'geralmente mais lenta', 'Cátions vinílicos são menos estáveis que os alquílicos.'],
  ], ['', 'c-e2', 'c-sn2']);
}

/* ===================================================================
 * Mapas de reações
 * =================================================================== */
export function reactionMap(host, kind) {
  const edges = kind === 'alkyne' ? MAP_ALKYNE : MAP_ALKENE;
  const sub = kind === 'alkyne' ? 'propino' : 'propeno';
  const detail = h('div', { class: 'stepcap', 'aria-live': 'polite' }, 'Clique em uma seta (produto) para ver reagentes, mecanismo, regioquímica e estereoquímica.');
  const mk = (e) => h('button', { class: 'edge', type: 'button', onclick: (ev) => {
    host.querySelectorAll('.edge').forEach((b) => b.setAttribute('aria-pressed', b === ev.currentTarget));
    const r = e[2] ? REAG[e[2]] : null;
    const p = e[2] ? product(sub, e[2]) : null;
    detail.innerHTML = `<b style="color:var(--green)">${e[0]}</b> · reagentes: <b style="color:var(--magenta)">${e[1]}</b><br>${e[3]}` + (r ? `<br><small>intermediário: ${r.inter} · regio: ${r.regio} · estereo: ${r.stereo} · rearranjo: ${r.rearr}</small>` : '');
    if (p && p.k && !(e[0].includes('alquilação'))) detail.append(h('div', null, h('small', null, `Exemplo com ${SUBS[sub].t}:`), drawKeys(p.k, { w: 170 }), h('small', null, p.n)));
    if (e[0].includes('alquilação')) detail.append(h('div', null, h('small', null, 'Exemplo: propino → (NaNH₂) → propineto → (CH₃Br) → but-2-ino'), drawKeys('but2inoProd', { w: 190 })));
    if (r) detail.append(h('div', null, h('a', { href: '#' + r.sec }, 'ver mecanismo →')));
  } }, h('span', null, '⟵'), h('b', null, e[0]), h('small', null, e[1]));
  const half = Math.ceil(edges.length / 2);
  host.append(h('div', { class: 'rmap' }, h('div', { class: 'col l' }, edges.slice(0, half).map(mk)), h('div', { class: 'center' }, kind === 'alkyne' ? 'ALCINO' : 'ALCENO', h('div', { style: 'font-size:.9rem;font-weight:600;color:var(--muted)' }, kind === 'alkyne' ? 'R–C≡C–R′' : 'R₂C=CR₂')), h('div', { class: 'col' }, edges.slice(half).map(mk))), detail);
  host.querySelectorAll('.col:not(.l) .edge span:first-child').forEach((s) => { s.textContent = '⟶'; });
  host.querySelectorAll('.col.l .edge span:first-child').forEach((s) => { s.textContent = '⟵'; });
}

/* ===================================================================
 * Simulador: substrato + reagente → perguntas → produto
 * =================================================================== */
const SYM = { ciclohexeno: true, but2ino: true };
function expected(sub, rg) {
  const r = REAG[rg], p = product(sub, rg);
  const regio = SYM[sub] && /Markov|substituído/.test(r.regio) ? 'não se aplica' : /anti-Markovnikov/.test(r.regio) ? 'anti-Markovnikov' : /Markovnikov|mais substituído/.test(r.regio) ? 'Markovnikov' : 'não se aplica';
  const stereo = rg === 'OxyM' ? 'não específica' : /^syn/.test(r.stereo) ? 'syn' : /^anti|1ª adição anti/.test(r.stereo) ? 'anti' : r.stereo === 'não específica' ? 'não específica' : 'não se aplica';
  const cation = r.cation ? 'sim' : 'não';
  const rearr = p.x && /rearranj|migração de hidreto|hidreto/.test(p.x) && !/SEM rearranjo|sem rearranjo|Sem carbocátion/.test(p.x) ? 'sim' : 'não';
  return { regio, stereo, cation, rearr, p, r };
}
export function simulator(host) {
  const st = { sub: 'propeno', rg: 'HBr' };
  const subs = h('div', { class: 'subcards' });
  Object.entries(SUBS).forEach(([k, s]) => subs.append(h('button', { type: 'button', 'aria-pressed': k === st.sub ? 'true' : 'false', 'data-k': k, onclick: (e) => { st.sub = k; [...subs.children].forEach((b) => b.setAttribute('aria-pressed', b === e.currentTarget)); markReag(); out.innerHTML = ''; } }, mol(M[k](), { scale: 30, fs: 14 }), h('b', null, s.t), h('small', null, s.d))));
  const reags = h('div', { class: 'reagents' });
  Object.entries(REAG).forEach(([k, r]) => reags.append(h('button', { type: 'button', 'aria-pressed': k === st.rg ? 'true' : 'false', 'data-k': k, onclick: (e) => { st.rg = k; [...reags.children].forEach((b) => b.setAttribute('aria-pressed', b === e.currentTarget)); out.innerHTML = ''; } }, r.t)));
  function markReag() { const kind = SUBS[st.sub].kind; [...reags.children].forEach((b) => { const k = REAG[b.dataset.k].kind; b.classList.toggle('dim', k !== 'ambos' && k !== kind); }); }
  const out = h('div', { 'aria-live': 'polite' });
  host.append(h('h4', null, '1 · Escolha o substrato'), subs, h('h4', null, '2 · Escolha o reagente'), h('p', { class: 'hint', style: 'color:var(--dim);font-size:.8rem;margin:0 0 6px' }, 'Reagentes esmaecidos são pouco usuais para o tipo de substrato escolhido (você ainda pode testá-los).'), reags,
    h('div', { class: 'controls' }, h('button', { class: 'btn primary lg', type: 'button', onclick: () => predict() }, '🔮 Prever produto')), out);
  markReag();
  function predict() {
    const E = expected(st.sub, st.rg);
    out.innerHTML = '';
    out.append(h('div', { class: 'rxline' }, h('div', { style: 'width:180px' }, mol(M[st.sub](), { scale: 34 })), h('span', { class: 'arrow' }, '⟶'), h('div', { class: 'cond', html: E.r.t })));
    if (!E.p.k) {
      out.append(h('div', { class: 'fb neutral', html: `<b>${E.p.n}.</b> ${E.p.x || ''}` }));
      return;
    }
    const q = (label, key, opts) => { const s = h('select', { 'aria-label': label }, h('option', { value: '' }, 'escolha…'), opts.map((o) => h('option', { value: o }, o))); s.dataset.key = key; return h('label', null, label, s); };
    const grid = h('div', { class: 'qgrid' },
      q('Qual é a regioquímica?', 'regio', ['Markovnikov', 'anti-Markovnikov', 'não se aplica']),
      q('Adição syn ou anti?', 'stereo', ['syn', 'anti', 'não específica', 'não se aplica']),
      q('Há carbocátion?', 'cation', ['sim', 'não']),
      q('Há rearranjo neste caso?', 'rearr', ['sim', 'não']));
    // opções de produto
    const others = shuffle(Object.entries(PR[st.sub]).filter(([rk, p]) => p.k && p.n !== E.p.n && JSON.stringify(p.k) !== JSON.stringify(E.p.k)).map(([, p]) => p));
    const uniq = []; others.forEach((p) => { if (!uniq.some((u) => u.n === p.n)) uniq.push(p); });
    const opts = shuffle([E.p].concat(uniq.slice(0, 3)));
    let chosen = null;
    const choices = h('div', { class: 'mcq cols' }, opts.map((p, i) => h('button', { class: 'mopt struct', type: 'button', onclick: (e) => { chosen = p; [...choices.children].forEach((b) => b.classList.remove('sel')); e.currentTarget.classList.add('sel'); } }, h('span', { class: 'l' }, 'abcd'[i]), drawKeys(p.k, { w: 150, scale: 28, fs: 13 }))));
    const fb = h('div');
    out.append(h('p', { class: 'prompt' }, 'Antes de ver a resposta, responda:'), grid, h('p', { class: 'prompt' }, 'Qual é o produto principal?'), choices,
      h('div', { class: 'ex-actions' }, h('button', { class: 'btn primary', type: 'button', onclick: () => check(false) }, 'Conferir'), h('button', { class: 'btn', type: 'button', onclick: () => check(true) }, 'Mostrar resposta')), fb);
    function check(reveal) {
      let n = 0;
      grid.querySelectorAll('select').forEach((s) => { const want = E[s.dataset.key]; if (reveal) s.value = want; const ok = s.value === want; s.classList.toggle('ok', ok); s.classList.toggle('bad', !ok); if (ok) n++; });
      [...choices.children].forEach((b, i) => { b.classList.toggle('right', opts[i] === E.p); b.classList.toggle('wrong', opts[i] === chosen && chosen !== E.p); });
      const pOk = chosen === E.p;
      fb.innerHTML = '';
      fb.append(h('div', { class: 'fb ' + (n === 4 && pOk ? 'ok' : reveal ? 'neutral' : 'bad'), html: `${reveal ? '' : `${n}/4 perguntas · produto ${pOk ? '✔' : '✘'}<br>`}<b>Produto:</b> ${E.p.n}. ${E.p.x || ''}<br><small>Regioquímica: ${E.regio} · estereoquímica: ${E.r.stereo} · intermediário: ${E.r.inter} · carbocátion: ${E.cation} · rearranjo: ${E.rearr}</small><br><a href="#${E.r.sec}">ver o mecanismo →</a>` }));
    }
  }
}

/* ===================================================================
 * Comparador de duas reações
 * =================================================================== */
export function comparator(host) {
  const st = { sub: 'metilbut1eno3', a: 'H3O', b: 'HB' };
  const out = h('div', { class: 'cmp2' });
  const mkSel = (key, list) => { const s = h('select', { 'aria-label': key }, list.map(([k, t]) => h('option', { value: k, selected: k === st[key] ? true : null }, t))); s.addEventListener('change', () => { st[key] = s.value; draw(); }); return s; };
  const alkenes = Object.entries(SUBS).map(([k, s]) => [k, s.t]);
  const reags = Object.entries(REAG).map(([k, r]) => [k, r.t]);
  host.append(h('div', { class: 'controls' }, h('label', null, 'substrato ', mkSel('sub', alkenes)), h('label', null, 'reação A ', mkSel('a', reags)), h('label', null, 'reação B ', mkSel('b', reags))), out);
  function col(rg) {
    const E = expected(st.sub, rg);
    return h('div', { class: 'block', style: 'margin:0;box-shadow:none;background:var(--surface-2)' }, h('h4', { style: 'margin-top:0;color:var(--magenta)', html: E.r.t }),
      E.p.k ? drawKeys(E.p.k, { w: 190 }) : h('p', null, '—'),
      h('p', { html: `<b>${E.p.n}</b>${E.p.x ? '<br><small>' + E.p.x + '</small>' : ''}` }),
      h('table', null, h('tbody', null, [['orientação', E.regio], ['estereoquímica', E.r.stereo], ['intermediário', E.r.inter], ['carbocátion', E.cation], ['rearranjo', E.rearr]].map(([a, b]) => h('tr', null, h('td', null, a), h('td', { html: '<b>' + b + '</b>' }))))));
  }
  function draw() { out.innerHTML = ''; out.append(col(st.a), col(st.b)); }
  draw();
}

/* ===================================================================
 * Teste do bromo (contexto)
 * =================================================================== */
export function bromineTest(host) {
  const tube = (lab) => { const t = h('div', { style: 'width:46px;height:120px;border:2px solid #9fb0cc;border-top:0;border-radius:0 0 22px 22px;background:linear-gradient(#0000 18%, #c2571a 18%);transition:background 1.4s;margin:0 auto' }); return { t, box: h('div', { style: 'text-align:center' }, t, h('small', null, lab)) }; };
  const A = tube('ciclo-hexano'), B = tube('ciclo-hexeno');
  host.append(h('div', { style: 'display:flex;gap:30px;justify-content:center;align-items:flex-end' }, A.box, B.box),
    h('div', { class: 'controls', style: 'justify-content:center' }, h('button', { class: 'btn sm primary', type: 'button', onclick: () => { B.t.style.background = 'linear-gradient(#0000 18%, #f4ead2 18%)'; } }, 'Adicionar Br₂ e agitar'), h('button', { class: 'btn sm', type: 'button', onclick: () => { B.t.style.background = 'linear-gradient(#0000 18%, #c2571a 18%)'; } }, '⟲')));
}
export { Z };
