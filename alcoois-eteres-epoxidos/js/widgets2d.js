/*
 * widgets2d.js — componentes interativos 2D: player de mecanismos, testes
 * rápidos, nomenclatura, solubilidade, pontos de ebulição, acidez, oxidação,
 * comparador de propriedades, simuladores (álcoois, Williamson, epóxidos),
 * tabelas expansíveis e mapas de reações.
 */
import { mol, el as sel } from './chem2d.js';
import { M, Z, R6, L } from './struct.js';
import { ALC, RG, AR, MECHS, STEREO, WILL, HALCLASS, NUC, epoxOutcome, MAP_ALC, MAP_ETH, MAP_EPOX } from './rxn.js';
import { epoxOpenScene } from './scenes.js';

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
const ox = { cls: 'ox' };
const OHs = (deg) => ['OH', 1, deg, ox];
export const NOMEN_ALC = [
  { k: 'a1', s: () => Z(4, { up: false, sub: { 1: [OHs()] } }), main: [0, 1, 2, 3], num: [0, 1, 2, 3], name: 'butan-2-ol', parts: ['butan', '2', 'ol'], hint: 'Cadeia de 4 C contendo o C do OH; numerando pela esquerda, o OH fica em C2 (pela direita seria C3).' },
  { k: 'a2', s: () => Z(5, { up: false, sub: { 1: [OHs()], 3: [['']] } }), main: [0, 1, 2, 3, 4], num: [0, 1, 2, 3, 4], name: '4-metilpentan-2-ol', parts: ['4-metil', 'pentan', '2', 'ol'], hint: 'O OH recebe o menor número (C2), mesmo que a metila fique com o 4.' },
  { k: 'a3', s: () => Z(5, { lab: { 0: 'HO' }, opt: { 0: ox }, sub: { 3: [OHs()] } }), main: [1, 2, 3, 4], num: [-1, 0, 1, 2, 3], name: 'butano-1,3-diol', parts: ['butano', '1,3', 'diol'], hint: 'Diol: mantém o "o" de butano + localizadores 1,3 + sufixo "diol".' },
  { k: 'a4', s: () => Z(4, { up: false, sub: { 1: [OHs()], 2: [['']] } }), main: [0, 1, 2, 3], num: [0, 1, 2, 3], name: '3-metilbutan-2-ol', parts: ['3-metil', 'butan', '2', 'ol'], hint: 'OH em C2 (menor localizador); metila em C3.' },
  { k: 'a5', s: () => Z(3, { up: false, sub: { 1: [['', 1, 90], OHs(270)] } }), name: '2-metilpropan-2-ol', parts: ['2-metil', 'propan', '2', 'ol'], hint: 'Cadeia de 3 C com o OH no C central (C2) e uma metila também em C2. Nome usual: terc-butanol (álcool terc-butílico).' },
  { k: 'a6', s: () => R6({ sub: { 0: [OHs()], 1: [['']] } }), name: '2-metilciclo-hexan-1-ol', parts: ['2-metil', 'ciclo-hexan', '1', 'ol'], hint: 'Álcool cíclico: o C do OH é o C1; numere para dar o menor número ao substituinte (C2).' },
];
export const NOMEN_ETH = [
  { k: 'e1', s: () => M.metoxietano(), name: 'metoxietano', parts: ['metoxi', 'etano'], hint: 'Grupo menor + O = alcóxi (metoxi); a cadeia maior é o alcano principal (etano). Nome usual: etil metil éter.' },
  { k: 'e2', s: () => M.metoxipropano2(), name: '2-metoxipropano', parts: ['2', 'metoxi', 'propano'], hint: 'O metoxi está no C2 do propano. Nome usual: isopropil metil éter.' },
  { k: 'e3', s: () => M.etoxibenzeno(), name: 'etoxibenzeno', parts: ['etoxi', 'benzeno'], hint: 'O anel é a estrutura principal; CH₃CH₂O– = etoxi. Nome usual: etil fenil éter (fenetol).' },
  { k: 'e4', s: () => M.eterDietilico(), name: 'etoxietano', parts: ['etoxi', 'etano'], hint: 'Éter simétrico. O nome usual "éter dietílico" (ou "éter etílico") é o mais usado no laboratório.' },
  { k: 'e5', s: () => M.mtbe(), name: '2-metoxi-2-metilpropano', parts: ['2', 'metoxi', '2-metil', 'propano'], hint: 'Cadeia principal de 3 C (propano); em C2 há metoxi e metila (ordem alfabética: metoxi antes de metil). Nome usual: MTBE.' },
];
const TILES_ALC = ['1', '2', '3', '4', '1,2', '2,3', 'metil', 'etil', '2-metil', '3-metil', 'pentan', 'butan', 'propan', 'hexan', 'butano', 'ol', 'diol', 'triol', 'ciclo-hexan', 'al', 'ona'];
export const TILES_ETH = ['1', '2', '3', 'metoxi', 'etoxi', 'propoxi', 'metano', 'etano', 'propano', 'butano', 'benzeno', '2-metil', 'ol', 'éter'];
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
  const EXTRA = o.tiles || TILES_ALC;
  let ui;
  function start() {
    chosen = new Set(); built = []; fb.innerHTML = ''; fb.className = '';
    const s = item.s();
    stage.innerHTML = '';
    ui = clickable(s, { onPick: (i, g) => pick(i, g) });
    stage.append(ui.svg);
    step = item.main ? 0 : 2;
    item._ids = s.ids || [];
    render();
  }
  function render() {
    controls.innerHTML = '';
    nameBox.style.display = step === 2 ? '' : 'none';
    tiles.style.display = step === 2 ? '' : 'none';
    if (step === 0) {
      prompt.innerHTML = '1 · Clique em <b>todos os carbonos da cadeia principal</b> (a mais longa que contém o carbono ligado ao OH).';
      controls.append(h('button', { class: 'btn sm primary', type: 'button', onclick: checkChain }, 'Conferir cadeia'), h('button', { class: 'btn sm', type: 'button', onclick: () => { chosen = new Set(item.main.map((i) => item._ids[i])); paint(); checkChain(); } }, 'Mostrar'));
    } else if (step === 1) {
      prompt.innerHTML = '2 · Clique no carbono que recebe o <b>número 1</b> (o C do OH deve ficar com o menor localizador).';
    } else {
      prompt.innerHTML = (item.main ? '3 · ' : '') + 'Monte o nome clicando nas peças na ordem correta.';
      nameBox.textContent = built.join('-') || '…';
      tiles.innerHTML = '';
      const pool = shuffle([...new Set(item.parts.concat(shuffle(EXTRA.filter((x) => !item.parts.includes(x))).slice(0, 5)))]);
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
        fb.className = 'fb bad'; fb.innerHTML = '✘ Numerando por aí, o carbono do OH não recebe o menor localizador possível (ou esse carbono não é uma extremidade da cadeia principal).';
      }
    }
  }
  function checkChain() {
    const want = new Set(item.main.map((i) => item._ids[i]));
    const ok = want.size === chosen.size && [...want].every((x) => chosen.has(x));
    Object.entries(ui.nodes).forEach(([i, g]) => { i = +i; g.classList.remove('on'); g.classList.toggle('ok', chosen.has(i) && want.has(i)); g.classList.toggle('bad', chosen.has(i) && !want.has(i)); g.classList.toggle('miss', !chosen.has(i) && want.has(i)); });
    fb.className = 'fb ' + (ok ? 'ok' : 'bad');
    fb.innerHTML = ok ? `✔ Cadeia principal correta: ${want.size} carbonos, incluindo o carbono ligado ao OH.` : '✘ A cadeia principal deve conter o <b>carbono ligado ao OH</b> (todos eles, em dióis) e ser a mais longa nessa condição.';
    if (ok) { step = 1; setTimeout(() => { Object.values(ui.nodes).forEach((g) => g.classList.remove('ok', 'bad', 'miss')); render(); }, 700); }
  }
  function checkName() {
    const norm = (x) => x.replace(/[-\s]/g, '');
    const ok = norm(built.join('')) === norm(item.parts.join(''));
    fb.className = 'fb ' + (ok ? 'ok' : 'bad');
    fb.innerHTML = ok ? `✔ <b>${item.name}</b>. ${item.hint}` : (o.badName || '✘ Ainda não. Ordem: substituintes (com localizadores, em ordem alfabética) + prefixo da cadeia + localizador do OH + sufixo -ol (-diol, -triol).');
  }
  start();
}

/* ===================================================================
 * Solubilidade em água × tamanho da cadeia
 * =================================================================== */
const SOL = [['metanol', 1, '∞', 'miscível'], ['etanol', 2, '∞', 'miscível'], ['propan-1-ol', 3, '∞', 'miscível'], ['butan-1-ol', 4, 7.4, '≈ 7,4 g/100 mL'], ['pentan-1-ol', 5, 2.2, '≈ 2,2 g/100 mL'], ['hexan-1-ol', 6, 0.59, '≈ 0,6 g/100 mL'], ['heptan-1-ol', 7, 0.17, '≈ 0,17 g/100 mL'], ['octan-1-ol', 8, 0.054, '≈ 0,05 g/100 mL']];
export function solubility(host) {
  const stage = h('div', { class: 'mech', style: 'min-height:150px;display:grid;place-items:center' });
  const info = h('div', { class: 'stepcap', 'aria-live': 'polite' });
  const r = h('input', { type: 'range', min: 1, max: 8, value: 1, 'aria-label': 'Número de carbonos' });
  const meter = h('div', { class: 'hmeter' }, h('span', null, h('b', null, 'solubilidade')), h('div', { class: 'bar' }, h('span')), h('small'));
  const bal = h('div', { class: 'hmeter' }, h('span', null, 'parte apolar'), h('div', { class: 'bar' }, h('span', { style: 'background:linear-gradient(90deg,#ff9f43,#ff5c6c)' })), h('small'));
  const play = h('button', { class: 'btn sm primary', type: 'button', onclick: () => { let n = 1; r.value = 1; draw(); const id = setInterval(() => { n++; r.value = n; draw(); if (n >= 8) clearInterval(id); }, 800); } }, '▶ Animar a cadeia crescendo');
  r.addEventListener('input', draw);
  host.append(h('div', { class: 'controls' }, h('div', { class: 'range-row' }, h('span', { class: 'chip' }, 'C1'), r, h('span', { class: 'chip' }, 'C8')), play), stage, meter, bal, info);
  function draw() {
    const n = +r.value, d = SOL[n - 1];
    const s = n === 1 ? L(['H3C', 'OH'], [1], { opt: { 1: { cls: 'ox', halo: 'c' } } }) : Z(n + 1, { lab: { [n]: 'OH' }, opt: { [n]: { cls: 'ox', halo: 'c' } } });
    stage.innerHTML = ''; stage.append(mol(s, { scale: 40, fs: 17 }));
    const v = d[2] === '∞' ? 100 : Math.max(2, Math.log10(d[2] * 100) / Math.log10(1000) * 70);
    meter.querySelector('.bar span').style.width = v + '%'; meter.querySelector('small').textContent = d[3];
    bal.querySelector('.bar span').style.width = (n / 8 * 100) + '%'; bal.querySelector('small').textContent = n + ' C';
    info.innerHTML = `<b>${d[0]}</b>: ${d[3]}. ` + (n <= 3 ? 'O grupo OH (polar, faz ligações de H com a água) domina: miscível em qualquer proporção.' : n <= 5 ? 'A cadeia apolar cresce: a água precisa "abrir espaço" sem ganhar ligações de H. A solubilidade cai rapidamente.' : 'A parte hidrofóbica domina: praticamente insolúvel. O OH sozinho não compensa a cadeia longa.');
  }
  draw();
}

/* ===================================================================
 * Pontos de ebulição (barras)
 * =================================================================== */
const BP = {
  massa: { t: 'mesma massa molar', d: 'Massas quase iguais (44–46 g/mol): a diferença vem das forças intermoleculares.', rows: [['propano', -42, 'só dispersão'], ['éter dimetílico', -24, 'dipolo–dipolo'], ['etanol', 78, 'ligação de H']] },
  serie: { t: 'série de álcoois', d: 'Cada CH₂ a mais aumenta as forças de dispersão.', rows: [['metanol', 65], ['etanol', 78], ['propan-1-ol', 97], ['butan-1-ol', 118]] },
  ramo: { t: 'ramificação', d: 'Mais ramificado → mais "esférico" → menor área de contato → P.E. menor.', rows: [['butan-1-ol', 118], ['butan-2-ol', 99.5], ['2-metilpropan-2-ol', 82]] },
  eter: { t: 'éteres × álcoois', d: 'Isômeros C₄H₁₀O: o álcool faz ligação de H entre suas moléculas; o éter não.', rows: [['éter dietílico', 35], ['THF (C₄H₈O)', 66], ['butan-1-ol', 118]] },
  diol: { t: 'mais OH', d: 'Cada OH adicional acrescenta ligações de H.', rows: [['etanol', 78], ['etilenoglicol', 197], ['glicerol', 290]] },
  epox: { t: 'epóxidos', d: 'Epóxidos são éteres: P.E. baixos (só aceitam ligação de H).', rows: [['óxido de etileno', 11], ['óxido de propileno', 34], ['propan-1-ol', 97]] },
};
export function bpBars(host) {
  const out = h('div');
  host.append(h('div', { class: 'controls' }, seg(Object.entries(BP).map(([k, v]) => [k, v.t]), 'massa', draw, 'Grupo')), out);
  function draw(k) {
    const g = BP[k];
    out.innerHTML = '';
    out.append(h('p', { class: 'hint', style: 'color:var(--muted)' }, g.d));
    g.rows.forEach(([n, t, why]) => out.append(h('div', { class: 'hmeter' }, h('span', { html: `<b>${n}</b>` }), h('div', { class: 'bar' }, h('span', { style: `width:${Math.max(3, (t + 60) / 360 * 100)}%;background:linear-gradient(90deg,${t > 50 ? '#3ddc97,#2fd4f5' : '#9fb0cc,#ff9f43'})` })), h('small', null, `${String(t).replace('.', ',')} °C`))));
    if (g.rows.some((r) => r[2])) out.append(h('p', { style: 'font-size:.86rem;color:var(--muted)' }, g.rows.map((r) => `${r[0]}: ${r[2]}`).join(' · ')));
  }
  draw('massa');
}

/* ===================================================================
 * Acidez: escada de pKa e escolha da base
 * =================================================================== */
const PKA = [['ácido acético', 4.8, 'carboxilato: ressonância (2 O)'], ['fenol', 10, 'fenóxido: ressonância com o anel'], ['água', 15.7, 'HO⁻'], ['metanol', 15.5, 'CH₃O⁻ bem solvatado'], ['etanol', 16, 'CH₃CH₂O⁻'], ['terc-butanol', 18, '(CH₃)₃CO⁻: solvatação dificultada'], ['etino', 25, 'C sp: 50% s'], ['amônia', 38, 'N menos eletronegativo que O'], ['etano', 50, 'C sp³']];
const BASES = [['NaHCO₃', 6.4, 'H₂CO₃'], ['Et₃N (trietilamina)', 10.7, 'Et₃NH⁺'], ['NaOH', 15.7, 'H₂O'], ['NaNH₂', 38, 'NH₃'], ['NaH', 35, 'H₂']];
export function pka(host) {
  const bars = h('div', { class: 'pka' });
  PKA.forEach(([n, p, why]) => bars.append(h('div', { class: 'hmeter' }, h('span', { html: `<b>${n}</b>` }), h('div', { class: 'bar' }, h('span', { style: `width:${(55 - p) / 52 * 100}%;${/etanol|metanol|butanol|água/.test(n) ? 'background:linear-gradient(90deg,#2fd4f5,#7ad7ff)' : ''}` })), h('small', { title: why }, 'pKa ≈ ' + String(p).replace('.', ',')))));
  const out = h('div', { class: 'stepcap', 'aria-live': 'polite' }, 'Escolha uma base para desprotonar o etanol (pKa ≈ 16).');
  const btns = h('div', { class: 'reagents' }, BASES.map(([b, pk, conj]) => h('button', { type: 'button', onclick: (e) => {
    [...btns.children].forEach((x) => x.setAttribute('aria-pressed', x === e.currentTarget));
    const d = pk - 16;
    out.innerHTML = `CH₃CH₂OH + ${b} ⇌ CH₃CH₂O⁻ + ${conj} &nbsp; (pKa do ${conj} ≈ ${String(pk).replace('.', ',')})<br>` +
      (d > 2 ? `<span class="status-ok">✔ Desprotona completamente</span>: ${conj} é um ácido muito mais fraco que o etanol (K ≈ 10<sup>${Math.round(d)}</sup>).${b === 'NaH' ? ' Além disso o H₂ escapa como gás: irreversível.' : ''}` :
        Math.abs(d) <= 2 ? '<span style="color:var(--orange);font-weight:800">≈ Equilíbrio</span>: pKa semelhantes (15,7 × 16). Forma-se pouco alcóxido; para gerar alcóxido "limpo" use NaH ou Na metálico.' :
        `<span class="status-bad">✘ Não desprotona</span>: ${conj} é um ácido mais forte que o etanol (K ≈ 10<sup>${Math.round(d)}</sup>).`);
  } }, b)));
  host.append(h('p', { class: 'hint', style: 'color:var(--muted);font-size:.86rem' }, 'Barras: acidez relativa (mais longa = mais ácido). Valores aproximados em água; passe o mouse sobre o pKa para ver o motivo.'), bars, h('h4', null, 'Qual base forma o etóxido?'), btns, out,
    h('p', { class: 'hint', style: 'color:var(--muted);font-size:.84rem' }, 'Na metálico também gera alcóxido (2 ROH + 2 Na → 2 RO⁻Na⁺ + H₂), por uma reação redox — não é uma simples transferência de próton.'));
}

/* ===================================================================
 * Oxidação: álcool × oxidante → produto (com a cor do Cr)
 * =================================================================== */
const OXI = {
  butan1ol: { t: 'butan-1-ol (1°)', PCC: ['butanal', 'Aldeído: em meio anidro o PCC para aqui.'], Jones: ['acidoButanoico', 'Em água, o aldeído forma hidrato e é oxidado de novo → ácido carboxílico.'] },
  butan2ol: { t: 'butan-2-ol (2°)', PCC: ['butanona', 'Cetona.'], Jones: ['butanona', 'Cetona: não há H no C da carbonila para continuar a oxidação.'] },
  tbutanol: { t: 'terc-butanol (3°)', PCC: [null, 'Sem H no carbono carbinólico: não há oxidação simples.'], Jones: [null, 'Sem reação: a solução continua laranja.'] },
  fenilmetanol: { t: 'fenilmetanol (benzílico 1°)', PCC: ['benzaldeido', 'Aldeído aromático.'], Jones: ['acidoBenzoico', 'Ácido benzoico.'] },
};
export function oxidation(host) {
  const st = { a: 'butan1ol', ox: 'PCC' };
  const out = h('div', { 'aria-live': 'polite' });
  const tube = h('div', { style: 'width:46px;height:110px;border:2px solid #9fb0cc;border-top:0;border-radius:0 0 22px 22px;transition:background 1.4s;margin:0 auto' });
  host.append(h('div', { class: 'controls' }, seg(Object.entries(OXI).map(([k, v]) => [k, v.t]), st.a, (k) => { st.a = k; draw(); }, 'Álcool'), seg([['PCC', 'PCC (CH₂Cl₂)'], ['Jones', 'Jones (CrO₃, H₂SO₄, H₂O)']], st.ox, (k) => { st.ox = k; draw(); }, 'Oxidante')),
    h('div', { class: 'split', style: 'align-items:center' }, out, h('div', { style: 'text-align:center' }, tube, h('small', { class: 'tubecap' }))));
  function draw() {
    const [k, why] = OXI[st.a][st.ox];
    out.innerHTML = '';
    out.append(h('div', { class: 'rxline' }, h('div', { style: 'width:160px' }, mol(M[st.a](), { scale: 32 })), h('span', { class: 'cond' }, st.ox === 'PCC' ? 'PCC' : 'CrO₃, H₂SO₄, H₂O'), h('span', { class: 'arrow' }, '⟶'), k ? h('div', { style: 'width:170px' }, mol(M[k](), { scale: 32 })) : h('b', { style: 'color:var(--red)' }, 'sem reação')), h('div', { class: 'fb ' + (k ? 'ok' : 'neutral'), html: why }));
    const orange = 'linear-gradient(#0000 20%, #e8781e 20%)', green = 'linear-gradient(#0000 20%, #2f8f5b 20%)';
    tube.style.background = orange;
    host.querySelector('.tubecap').textContent = 'Cr(VI) laranja';
    if (k) setTimeout(() => { tube.style.background = green; host.querySelector('.tubecap').textContent = 'Cr(III) verde: o álcool foi oxidado'; }, 500);
  }
  draw();
}

/* ===================================================================
 * Comparador de propriedades (prever antes de ver)
 * =================================================================== */
const PROPS = {
  propano: { n: 'propano', mm: 44, d: 'não', a: 'não', pol: 'apolar', pe: -42, sol: 'insolúvel' },
  eterDimetilico: { n: 'éter dimetílico', mm: 46, d: 'não', a: 'sim', pol: 'polar', pe: -24, sol: 'solúvel' },
  etanol: { n: 'etanol', mm: 46, d: 'sim', a: 'sim', pol: 'polar', pe: 78, sol: 'miscível' },
  butan1ol: { n: 'butan-1-ol', mm: 74, d: 'sim', a: 'sim', pol: 'polar', pe: 118, sol: '≈ 7 g/100 mL' },
  eterDietilico: { n: 'éter dietílico', mm: 74, d: 'não', a: 'sim', pol: 'pouco polar', pe: 35, sol: '≈ 6 g/100 mL' },
  thf: { n: 'THF', mm: 72, d: 'não', a: 'sim', pol: 'polar', pe: 66, sol: 'miscível' },
  etilenoglicol: { n: 'etilenoglicol', mm: 62, d: 'sim (2 OH)', a: 'sim', pol: 'muito polar', pe: 197, sol: 'miscível' },
  oxirano: { n: 'óxido de etileno', mm: 44, d: 'não', a: 'sim', pol: 'polar', pe: 11, sol: 'miscível' },
  octan1ol: { n: 'octan-1-ol', mm: 130, d: 'sim', a: 'sim', pol: 'cadeia apolar longa', pe: 195, sol: '≈ 0,05 g/100 mL' },
  agua: { n: 'água', mm: 18, d: 'sim (2 H)', a: 'sim', pol: 'muito polar', pe: 100, sol: '—' },
};
const SOLRANK = { insolúvel: 0, '≈ 0,05 g/100 mL': 1, '≈ 6 g/100 mL': 2, '≈ 7 g/100 mL': 3, solúvel: 4, miscível: 5, '—': 6 };
export function propComparator(host) {
  const chosen = new Set(['propano', 'eterDimetilico', 'etanol']);
  const chips = h('div', { class: 'reagents' });
  Object.entries(PROPS).forEach(([k, p]) => chips.append(h('button', { type: 'button', 'aria-pressed': chosen.has(k) ? 'true' : 'false', onclick: (e) => {
    if (chosen.has(k)) { if (chosen.size > 2) chosen.delete(k); } else { if (chosen.size >= 3) chosen.delete([...chosen][0]); chosen.add(k); }
    [...chips.children].forEach((b, i) => b.setAttribute('aria-pressed', chosen.has(Object.keys(PROPS)[i])));
    void e; draw();
  } }, p.n)));
  const out = h('div');
  host.append(h('p', { class: 'hint', style: 'color:var(--muted);font-size:.86rem' }, 'Escolha 2 ou 3 moléculas; faça sua previsão e só então revele a tabela.'), chips, out);
  function draw() {
    out.innerHTML = '';
    const ks = [...chosen];
    const q = (label) => h('label', null, label, h('select', { 'aria-label': label }, h('option', { value: '' }, 'escolha…'), ks.map((k) => h('option', { value: k }, PROPS[k].n))));
    const q1 = q('Maior ponto de ebulição?'), q2 = q('Mais solúvel em água?');
    const figs = h('div', { class: 'figs' }, ks.map((k) => h('figure', { class: 'fig' }, mol(M[k](), { scale: 32 }), h('figcaption', null, PROPS[k].n))));
    const tbl = h('div');
    const fb = h('div');
    out.append(figs, h('div', { class: 'qgrid' }, q1, q2), h('div', { class: 'ex-actions' }, h('button', { class: 'btn primary', type: 'button', onclick: reveal }, 'Revelar e comparar')), fb, tbl);
    function reveal() {
      const bestPE = ks.reduce((a, b) => (PROPS[a].pe > PROPS[b].pe ? a : b));
      const bestSol = ks.reduce((a, b) => (SOLRANK[PROPS[a].sol] >= SOLRANK[PROPS[b].sol] ? a : b));
      const s1 = q1.querySelector('select'), s2 = q2.querySelector('select');
      s1.classList.toggle('ok', s1.value === bestPE); s1.classList.toggle('bad', s1.value !== bestPE);
      s2.classList.toggle('ok', s2.value === bestSol); s2.classList.toggle('bad', s2.value !== bestSol);
      fb.innerHTML = `<div class="fb ${s1.value === bestPE && s2.value === bestSol ? 'ok' : 'neutral'}">Maior P.E.: <b>${PROPS[bestPE].n}</b> · mais solúvel: <b>${PROPS[bestSol].n}</b>. Doador de ligação de H (O–H) → P.E. muito maior; aceptor (O) já ajuda na solubilidade em água.</div>`;
      tbl.innerHTML = '';
      tbl.append(h('div', { class: 'table-wrap' }, h('table', { class: 'cmp' }, h('thead', null, h('tr', null, h('th', null, ''), ks.map((k) => h('th', null, PROPS[k].n)))),
        h('tbody', null, [['massa molar (g/mol)', 'mm'], ['doa ligação de H?', 'd'], ['aceita ligação de H?', 'a'], ['polaridade', 'pol'], ['P.E. (°C)', 'pe'], ['solubilidade em água', 'sol']].map(([t, f]) => h('tr', null, h('td', null, h('b', null, t)), ks.map((k) => h('td', null, String(PROPS[k][f]).replace('.', ',')))))))));
    }
  }
  draw();
}

/* ===================================================================
 * Simulador de reações de álcoois
 * =================================================================== */
export function alcoholSim(host) {
  const st = { sub: 'butan1ol', rg: 'HBr' };
  const subs = h('div', { class: 'subcards' });
  Object.entries(ALC).forEach(([k, s]) => subs.append(h('button', { type: 'button', 'aria-pressed': k === st.sub ? 'true' : 'false', onclick: (e) => { st.sub = k; [...subs.children].forEach((b) => b.setAttribute('aria-pressed', b === e.currentTarget)); out.innerHTML = ''; } }, mol(M[k](), { scale: 30, fs: 14 }), h('b', null, s.t), h('small', null, `${s.cls} · ${s.d}`))));
  const reags = h('div', { class: 'reagents' });
  Object.entries(RG).forEach(([k, r]) => reags.append(h('button', { type: 'button', 'aria-pressed': k === st.rg ? 'true' : 'false', onclick: (e) => { st.rg = k; [...reags.children].forEach((b) => b.setAttribute('aria-pressed', b === e.currentTarget)); out.innerHTML = ''; } }, r.t)));
  const out = h('div', { 'aria-live': 'polite' });
  host.append(h('h4', null, '1 · Escolha o álcool'), subs, h('h4', null, '2 · Escolha o reagente'), reags,
    h('div', { class: 'controls' }, h('button', { class: 'btn primary lg', type: 'button', onclick: () => predict() }, '🔮 Prever')), out);
  function predict() {
    const E = AR[st.sub][st.rg], R = RG[st.rg];
    out.innerHTML = '';
    out.append(h('div', { class: 'rxline' }, h('div', { style: 'width:180px' }, mol(M[st.sub](), { scale: 34 })), h('span', { class: 'arrow' }, '⟶'), h('div', { class: 'cond', html: R.t })));
    if (!E.k) { out.append(h('div', { class: 'fb neutral', html: `<b>${E.n}.</b> ${E.x}` })); return; }
    const q = (label, key, opts) => { const s = h('select', { 'aria-label': label }, h('option', { value: '' }, 'escolha…'), opts.map((o) => h('option', { value: o }, o))); s.dataset.key = key; return h('label', null, label, s); };
    const grid = h('div', { class: 'qgrid' },
      q('Qual o mecanismo principal?', 'm', MECHS), q('Há carbocátion?', 'c', ['sim', 'não']), q('Há rearranjo?', 'r', ['sim', 'não']), q('Estereoquímica no C do OH?', 'st', STEREO));
    const others = shuffle(Object.values(AR[st.sub]).filter((p) => p.k && p.k !== E.k));
    const uniq = []; others.forEach((p) => { if (!uniq.some((u) => u.k === p.k)) uniq.push(p); });
    const opts = shuffle([E].concat(uniq.slice(0, 3)));
    let chosen = null;
    const choices = h('div', { class: 'mcq cols' }, opts.map((p, i) => h('button', { class: 'mopt struct', type: 'button', onclick: (e) => { chosen = p; [...choices.children].forEach((b) => b.classList.remove('sel')); e.currentTarget.classList.add('sel'); } }, h('span', { class: 'l' }, 'abcd'[i]), drawKeys(p.k, { w: 150, scale: 28, fs: 13 }))));
    const fb = h('div');
    out.append(h('p', { class: 'prompt' }, 'Antes de ver a resposta, responda:'), grid, h('p', { class: 'prompt' }, 'Qual é o produto principal?'), choices,
      h('div', { class: 'ex-actions' }, h('button', { class: 'btn primary', type: 'button', onclick: () => check(false) }, 'Conferir'), h('button', { class: 'btn', type: 'button', onclick: () => check(true) }, 'Mostrar resposta')), fb);
    function check(reveal) {
      let n = 0;
      grid.querySelectorAll('select').forEach((s) => { const want = E[s.dataset.key]; if (reveal) s.value = want; const ok = s.value === want; s.classList.toggle('ok', ok); s.classList.toggle('bad', !ok); if (ok) n++; });
      [...choices.children].forEach((b, i) => { b.classList.toggle('right', opts[i] === E); b.classList.toggle('wrong', opts[i] === chosen && chosen !== E); });
      const pOk = chosen === E;
      fb.innerHTML = '';
      fb.append(h('div', { class: 'fb ' + (n === 4 && pOk ? 'ok' : reveal ? 'neutral' : 'bad'), html: `${reveal ? '' : `${n}/4 perguntas · produto ${pOk ? '✔' : '✘'}<br>`}<b>Produto:</b> ${E.n}. ${E.x}<br><small>Transformação: ${R.tr} · mecanismo: ${E.m} · carbocátion: ${E.c} · rearranjo: ${E.r} · estereoquímica: ${E.st}</small><br><a href="#${R.sec}">ver no módulo →</a>` }));
    }
  }
}

/* ===================================================================
 * Simulador de Williamson
 * =================================================================== */
export function williamsonSim(host) {
  const st = { t: 'mtbe', al: null, hx: null };
  const out = h('div', { 'aria-live': 'polite' });
  const left = h('div'), right = h('div');
  const tsel = h('select', { 'aria-label': 'Éter-alvo' }, Object.entries(WILL).map(([k, w]) => h('option', { value: k }, w.t)));
  tsel.addEventListener('change', () => { st.t = tsel.value; st.al = st.hx = null; draw(); });
  const target = h('div');
  host.append(h('div', { class: 'controls' }, h('label', null, 'Éter-alvo: ', tsel)), target, h('div', { class: 'grid2' }, h('div', null, h('h4', null, '1 · Alcóxido (nucleófilo)'), left), h('div', null, h('h4', null, '2 · Haleto (eletrófilo)'), right)),
    h('div', { class: 'controls' }, h('button', { class: 'btn primary', type: 'button', onclick: judge }, '⚗ Reagir')), out);
  function draw() {
    const W = WILL[st.t];
    target.innerHTML = '';
    target.append(h('div', { class: 'rxline' }, h('div', { style: 'width:200px' }, mol(M[st.t](), { scale: 34 })), h('div', { html: `<b>${W.t}</b><br><code>${W.f}</code>` })));
    const uniq = (arr) => arr.filter((x, i) => arr.findIndex((y) => y[0] === x[0]) === i);
    left.innerHTML = ''; right.innerHTML = '';
    const mk = (box, key, idx) => uniq(W.g.map((g, i) => [g[idx], i])).forEach(([t, i]) => box.append(h('label', { class: 'opt-radio' }, h('input', { type: 'radio', name: 'w-' + key, value: i, onchange: () => { st[key] = i; out.innerHTML = ''; } }), h('span', { html: t }))));
    mk(left, 'al', 1); mk(right, 'hx', 2);
    out.innerHTML = '';
  }
  function judge() {
    const W = WILL[st.t];
    if (st.al === null || st.hx === null) { out.innerHTML = '<div class="fb neutral">Escolha um alcóxido e um haleto.</div>'; return; }
    const ga = W.g[st.al], gx = W.g[st.hx];
    if (st.al === st.hx && W.g[0][0] !== W.g[1][0]) { out.innerHTML = `<div class="fb bad">✘ ${ga[1]} + ${gx[2]} daria o éter <b>simétrico</b> (os dois grupos ${ga[0]}), não o alvo. Combine o alcóxido de um lado com o haleto do <b>outro</b> lado.</div>`; return; }
    const [cls, why] = HALCLASS[gx[3]];
    const ok = cls === 'ok';
    const alt = W.g.find((g, i) => i !== st.hx && HALCLASS[g[3]][0] === 'ok');
    out.innerHTML = `<div class="fb ${ok ? 'ok' : cls === 'warn' ? 'neutral' : 'bad'}">${ok ? '✔ <b>Boa escolha!</b> SN2' : cls === 'warn' ? '⚠ <b>Funciona mal.</b> SN2 × E2' : '✘ <b>Não forma o éter.</b>'}: ${ga[1]} + ${gx[2]} → ${ok ? W.f : cls === 'warn' ? 'mistura (éter + alceno: ' + (gx[4] || 'propeno') + ')' : gx[3] === 'aril' ? 'sem reação' : 'principalmente ' + (gx[4] || 'alceno') + ' (E2)'}.<br>${why}${!ok && alt ? `<br><b>Melhor rota:</b> ${W.g.find((g) => g !== alt)[1]} + ${alt[2]}.` : ''}</div>`;
  }
  draw();
}

/* ===================================================================
 * Simulador de abertura de epóxido (3D: clique no carbono atacado)
 * =================================================================== */
export function epoxSim(host) {
  const st = { cond: 'base', nu: 'MeO' };
  const vbox = h('div', { class: 'viewer' });
  const fb = h('div', { 'aria-live': 'polite' });
  const prod = h('div');
  const nuSeg = h('div', { class: 'reagents' });
  const condSeg = seg([['base', 'meio básico / Nu forte'], ['acid', 'meio ácido (H⁺ cat.)']], st.cond, (k) => { st.cond = k; reset(); }, 'Condição');
  Object.entries(NUC).forEach(([k, n]) => nuSeg.append(h('button', { type: 'button', 'aria-pressed': k === st.nu ? 'true' : 'false', onclick: (e) => { st.nu = k; [...nuSeg.children].forEach((b) => b.setAttribute('aria-pressed', b === e.currentTarget)); reset(); } }, n.t)));
  host.append(h('div', { class: 'split' }, h('div', null, vbox, h('div', { class: 'controls' }, h('button', { class: 'btn sm', type: 'button', onclick: () => sc.v && sc.v.ok && sc.clock.set(0) }, '⟲ Reiniciar'), h('button', { class: 'btn sm', type: 'button', onclick: () => sc.v && sc.v.ok && sc.toggle('lp') }, 'pares livres'))),
    h('div', null, h('h4', null, '1 · Condição'), condSeg, h('h4', null, '2 · Nucleófilo'), nuSeg, h('h4', null, '3 · Clique no carbono que será atacado (no modelo 3D)'), h('p', { class: 'hint', style: 'color:var(--muted);font-size:.85rem;margin:0' }, '2,2-dimetiloxirano: C1 = CH₂ (esquerda); C2 = C(CH₃)₂ (direita). Ou use os botões:'),
      h('div', { class: 'controls' }, h('button', { class: 'btn sm', type: 'button', onclick: () => pick(0) }, 'atacar C1 (CH₂)'), h('button', { class: 'btn sm', type: 'button', onclick: () => pick(1) }, 'atacar C2 (C terciário)')), fb, prod)));
  const sc = epoxOpenScene(vbox, { onPick: (k) => pick(k) });
  function reset() { fb.innerHTML = ''; prod.innerHTML = ''; const N = NUC[st.nu]; if (sc.v && sc.v.ok) sc.config({ cond: st.cond, nu: st.nu === 'RMgBr' ? 'RMgBr' : st.nu, s: 0 }); void N; }
  function pick(k) {
    const R = epoxOutcome(st.cond, st.nu);
    prod.innerHTML = '';
    if (R.bad) { fb.innerHTML = `<div class="fb bad">⚠ ${R.bad}</div>`; return; }
    const want = st.cond === 'acid' ? 1 : 0;
    const ok = k === want;
    fb.innerHTML = `<div class="fb ${ok ? 'ok' : 'bad'}">${ok ? '✔ Correto!' : '✘ Não.'} ${st.cond === 'acid'
      ? 'Em meio <b>ácido</b> o O é protonado; a ligação C–O do carbono <b>mais substituído</b> fica mais longa e esse carbono suporta melhor a carga parcial positiva. O nucleófilo fraco ataca esse carbono, pelo lado oposto (não é um carbocátion livre).'
      : 'Em meio <b>básico</b> (Nu forte) a abertura é SN2: o nucleófilo ataca o carbono <b>menos impedido</b> (CH₂), pelo lado oposto ao O.'}</div>`;
    if (sc.v && sc.v.ok) { sc.config({ cond: st.cond, nu: st.nu }); sc.attack(want); }
    prod.append(h('p', { class: 'prompt' }, 'Produto:'), drawKeys(R.k, { w: 220, scale: 34 }), h('p', { html: `<b>${R.n}</b>${st.nu === 'RMgBr' ? ' (após H₃O⁺). Nova ligação C–C!' : ''}` }));
  }
  reset();
  return sc;
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
export const TABLES = {
  hydration: ['Método', 'Regioquímica', 'Estereoquímica', 'Rearranjo', [
    ['H₂O, H₂SO₄ (cat.)', 'Markovnikov', 'não específica', 'possível', 'Passa por <b>carbocátion livre</b>: o OH vai para o carbono mais substituído; pode haver migração de hidreto/alquila.'],
    ['1. Hg(OAc)₂, H₂O 2. NaBH₄', 'Markovnikov', 'não específica (global)', 'não', 'O íon <b>mercurínio</b> em ponte evita o carbocátion livre: Markovnikov <b>sem rearranjo</b>.'],
    ['1. BH₃·THF 2. H₂O₂, NaOH', '<b>anti-Markovnikov</b>', '<b>syn</b>', 'não', 'Adição concertada: B no carbono menos impedido; H e B pela mesma face; a oxidação troca B por OH com retenção.'],
  ]],
  opening: ['Característica', 'Meio básico (Nu forte)', 'Meio ácido (Nu fraco)', [
    ['Primeira etapa', 'ataque direto do Nu⁻', 'protonação do O do epóxido', 'Em ácido, o O protonado vira um grupo abandonador muito melhor; em base, a própria tensão do anel (≈ 115 kJ/mol) basta.'],
    ['Nucleófilos típicos', 'OH⁻, RO⁻, CN⁻, N₃⁻, NH₃, RMgX, RLi, LiAlH₄', 'H₂O, ROH, HX', 'Nucleófilos fortes (aniônicos) seriam protonados em meio ácido; nucleófilos fracos não abrem o anel sem ativação.'],
    ['Carbono atacado', '<b>menos substituído</b>', '<b>mais substituído</b> (em geral)', 'Base: controle estérico (SN2). Ácido: controle eletrônico — o C mais substituído sustenta melhor a carga δ+ no ET (C–O mais longa).'],
    ['Caráter do ET', 'SN2 clássica', 'SN2 "frouxa", com caráter catiônico parcial', 'Não há carbocátion livre: por isso ainda há inversão.'],
    ['Estereoquímica', 'inversão no C atacado; anti', 'inversão no C atacado; anti', 'Nos dois casos o Nu entra pelo lado oposto ao O: os grupos OH e Nu ficam anti (trans em anéis).'],
    ['Exemplo', '2,2-dimetiloxirano + CH₃O⁻ → 1-metoxi-2-metilpropan-2-ol', '2,2-dimetiloxirano + CH₃OH/H⁺ → 2-metoxi-2-metilpropan-1-ol', 'Mesmos reagentes "CH₃O", produtos regioisoméricos diferentes!'],
  ]],
  big: ['Característica', 'Álcoois', 'Éteres', 'Epóxidos', [
    ['Estrutura geral', 'R–OH', 'R–O–R′', 'éter cíclico de 3 membros', 'O sp³ em todos; muda o que está ligado a ele.'],
    ['Ângulo no O', 'C–O–H ≈ 108,5°', 'C–O–C ≈ 110–112°', 'C–O–C ≈ 61,5°', 'O epóxido é forçado a ≈ 60°: grande tensão angular.'],
    ['Ligação de H', 'doador e aceptor', 'só aceptor', 'só aceptor', 'Só O–H doa ligação de hidrogênio.'],
    ['Ponto de ebulição', 'alto', 'baixo (≈ alcano de mesma massa)', 'baixo', 'Etanol 78 °C × éter dimetílico −24 °C × óxido de etileno 11 °C.'],
    ['Solubilidade em água', 'alta para cadeias curtas', 'moderada (aceita ligação de H)', 'alta para os pequenos', 'Cadeias apolares longas reduzem a solubilidade em todos.'],
    ['Acidez', 'fraca (pKa ≈ 16–18)', 'não ácidos', 'não ácidos', 'Só há H ácido no O–H.'],
    ['Basicidade do O', 'fraca (protonável por ácidos fortes)', 'fraca', 'fraca, mas a protonação ativa o anel', 'Os pares livres do O aceitam H⁺ ou ácidos de Lewis.'],
    ['Reatividade geral', 'moderada (OH precisa ser ativado)', 'baixa (bons solventes)', '<b>alta</b> (tensão de anel)', 'A tensão do epóxido é a "mola" que impulsiona a abertura.'],
    ['Grupo abandonador', 'OH⁻ ruim → ativar (H⁺, PBr₃, SOCl₂, TsCl)', 'RO⁻ ruim → precisa de HI/HBr', 'o próprio O do anel (alívio de tensão)', 'Grupos abandonadores bons são bases fracas: H₂O, TsO⁻, X⁻.'],
    ['Reações principais', 'HX, PBr₃, SOCl₂, desidratação, oxidação, alcóxidos', 'clivagem com HI/HBr; Williamson (síntese)', 'abertura ácida e básica; Grignard', 'Veja os mapas de reações no Simulador.'],
  ]],
  nucleophiles: ['Nucleófilo', 'Condição', 'C atacado (2,2-dimetiloxirano)', 'Produto', [
    ['OH⁻ / H₂O', 'básica (NaOH, H₂O)', 'CH₂ (menos substituído)', '2-metilpropano-1,2-diol', 'Na abertura ácida com H₂O o diol é o mesmo, mas o O novo entra no outro carbono (detectável com ¹⁸O).'],
    ['RO⁻', 'básica', 'CH₂', 'éter no C1; OH no C2', '1-metoxi-2-metilpropan-2-ol com CH₃O⁻.'],
    ['CN⁻', 'básica', 'CH₂', 'β-hidroxinitrila', 'Nova ligação C–C; a nitrila pode virar ácido ou amina depois.'],
    ['N₃⁻', 'básica', 'CH₂', 'β-azidoálcool', 'Redução da azida → β-aminoálcool.'],
    ['NH₃ / RNH₂', 'neutra/básica', 'CH₂', 'β-aminoálcool', 'Aminas são bons nucleófilos neutros.'],
    ['RMgX / RLi', 'anidra; depois H₃O⁺', 'CH₂', 'álcool com C–C nova', 'Óxido de etileno + RMgX → RCH₂CH₂OH (cadeia + 2 C).'],
    ['H₂O, H⁺', 'ácida', 'C(CH₃)₂ (mais substituído)', 'diol', 'Controle eletrônico.'],
    ['ROH, H⁺', 'ácida', 'C(CH₃)₂', 'éter no C2; OH no C1', '2-metoxi-2-metilpropan-1-ol com CH₃OH/H⁺.'],
  ]],
  reagents: ['Reagente', 'Álcool', 'Produto', 'Mecanismo / estereoquímica', [
    ['HBr, HI', '3° (rápido), 2°, 1°', 'R–X', '3°: SN1 (carbocátion, rearranjos); 1°: SN2 sobre ROH₂⁺; 2°: intermediário', 'O H⁺ transforma OH (ruim) em H₂O (bom grupo abandonador).'],
    ['HCl, ZnCl₂', '3° > 2° > 1°', 'R–Cl', 'como acima; ZnCl₂ ativa o O', 'Teste de Lucas: turvação imediata (3°), em minutos (2°), lenta/nula (1°).'],
    ['PBr₃', '1°, 2°', 'R–Br', 'SN2: inversão; sem rearranjo', 'Não use com 3°.'],
    ['SOCl₂ (piridina)', '1°, 2°', 'R–Cl + SO₂ + HCl', 'via clorossulfito; com piridina: SN2 (inversão)', 'Sem base pode haver retenção: depende das condições.'],
    ['TsCl / MsCl, piridina', '1°, 2°', 'R–OTs / R–OMs', 'C–O intacta: retenção', 'Depois: SN2 (inversão) ou E2 com base forte.'],
    ['H₂SO₄/H₃PO₄, Δ', '3° > 2° > 1°', 'alceno', 'E1 (2°/3°); 1°: sem cátion livre', 'Zaitsev; rearranjos possíveis; temperatura alta favorece eliminação.'],
    ['PCC', '1°, 2°', 'aldeído / cetona', 'oxidação branda (anidra)', '3°: sem reação.'],
    ['CrO₃, H₂SO₄, H₂O (Jones)', '1°, 2°', 'ácido / cetona', 'oxidação forte', '1° → ácido carboxílico.'],
    ['NaH, Na, K', 'todos', 'RO⁻ M⁺ + H₂', 'ácido–base / redox', 'Alcóxidos: bases e nucleófilos.'],
  ]],
};
export function table(host, key) { const T = TABLES[key]; expTable(host, T.slice(0, -1), T[T.length - 1]); }

/* ===================================================================
 * Mapas de reações
 * =================================================================== */
export function reactionMap(host, kind) {
  const edges = kind === 'eth' ? MAP_ETH : kind === 'epox' ? MAP_EPOX : MAP_ALC;
  const title = kind === 'eth' ? ['ÉTER', 'R–O–R′'] : kind === 'epox' ? ['EPÓXIDO', 'anel C–C–O'] : ['ÁLCOOL', 'R–OH'];
  const detail = h('div', { class: 'stepcap', 'aria-live': 'polite' }, 'Clique em um produto para ver reagentes, mecanismo, regioquímica e estereoquímica.');
  const mk = (e) => h('button', { class: 'edge', type: 'button', onclick: (ev) => {
    host.querySelectorAll('.edge').forEach((b) => b.setAttribute('aria-pressed', b === ev.currentTarget));
    detail.innerHTML = `<b style="color:var(--green)">${e[0]}</b> · reagentes: <b style="color:var(--magenta)">${e[1]}</b><br>${e[2]}`;
    if (e[3]) detail.append(h('div', null, drawKeys(e[3], { w: 190 }), e[4] ? h('small', null, e[4]) : null));
  } }, h('span', null, '⟵'), h('b', { html: e[0] }), h('small', { html: e[1] }));
  const half = Math.ceil(edges.length / 2);
  host.append(h('div', { class: 'rmap' }, h('div', { class: 'col l' }, edges.slice(0, half).map(mk)), h('div', { class: 'center' }, title[0], h('div', { style: 'font-size:.9rem;font-weight:600;color:var(--muted)' }, title[1])), h('div', { class: 'col' }, edges.slice(half).map(mk))), detail);
  host.querySelectorAll('.col:not(.l) .edge span:first-child').forEach((s) => { s.textContent = '⟶'; });
}
export { Z };
