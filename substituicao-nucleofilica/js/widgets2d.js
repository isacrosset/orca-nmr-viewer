/*
 * widgets2d.js — componentes interativos 2D.
 */
import { mol, el as sel } from './chem2d.js';
import { SK, cation, halide, anion } from './struct.js';

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

/* ===================================================================
 * Player de mecanismos 2D (quadros com setas curvas)
 * frames: [{ s: S, cap: html, o?: opções de desenho }]
 * =================================================================== */
export function player(host, frames, o = {}) {
  let i = 0, timer = null;
  const stage = h('div', { class: 'stage', 'aria-live': 'polite' });
  const cap = h('div', { class: 'pcap' });
  const dots = h('div', { class: 'dots' }, frames.map(() => h('i')));
  const prev = h('button', { class: 'btn sm', type: 'button', onclick: () => go(i - 1) }, '◀ Etapa anterior');
  const next = h('button', { class: 'btn sm', type: 'button', onclick: () => go(i + 1) }, 'Próxima etapa ▶');
  const play = h('button', { class: 'btn sm primary', type: 'button', onclick: () => toggle() }, '▶ Reproduzir');
  const root = h('div', { class: 'player mech' }, stage, cap, h('div', { class: 'pctrl' }, prev, next, play, dots));
  host.appendChild(root);
  function go(k) {
    i = Math.max(0, Math.min(frames.length - 1, k));
    stage.innerHTML = '';
    const f = frames[i];
    stage.appendChild(mol(f.s, Object.assign({ animate: true, scale: 46, zoom: 1.45 }, o.draw || {}, f.o || {})));
    cap.innerHTML = f.cap || '';
    [...dots.children].forEach((d, n) => d.classList.toggle('on', n === i));
    prev.disabled = i === 0; next.disabled = i === frames.length - 1;
  }
  function toggle() {
    if (timer) { clearInterval(timer); timer = null; play.textContent = '▶ Reproduzir'; return; }
    if (i === frames.length - 1) go(0);
    play.textContent = '❚❚ Pausar';
    timer = setInterval(() => {
      if (i >= frames.length - 1) { clearInterval(timer); timer = null; play.textContent = '▶ Reproduzir'; return; }
      go(i + 1);
    }, o.interval || 2600);
  }
  go(0);
  return { go, root };
}

/* ===================================================================
 * Teste rápido (dentro do texto)
 * =================================================================== */
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
 * Solvatação: prótico × aprótico
 * =================================================================== */
export function solvation(host) {
  const mkPanel = (kind) => {
    const svg = sel('svg', { viewBox: '0 0 300 260', role: 'img', 'aria-label': kind === 'protic' ? 'Ânion cercado por moléculas de solvente prótico fazendo ligações de hidrogênio' : 'Cátion solvatado por DMSO e ânion livre em solvente aprótico' });
    const cx = 150, cy = 130;
    if (kind === 'protic') {
      const shell = sel('g', { class: 'shell' }, svg);
      for (let k = 0; k < 7; k++) {
        const a = k * 2 * Math.PI / 7;
        const hx = cx + Math.cos(a) * 52, hy = cy + Math.sin(a) * 52;
        const ox = cx + Math.cos(a) * 80, oy = cy + Math.sin(a) * 80;
        sel('line', { x1: cx + Math.cos(a) * 26, y1: cy + Math.sin(a) * 26, x2: hx, y2: hy, stroke: '#2fd4f5', 'stroke-width': 1.6, 'stroke-dasharray': '3 3' }, shell);
        sel('line', { x1: hx, y1: hy, x2: ox, y2: oy, stroke: '#dfe7f5', 'stroke-width': 2 }, shell);
        sel('circle', { cx: hx, cy: hy, r: 6, fill: '#f2f5fa' }, shell);
        sel('circle', { cx: ox, cy: oy, r: 10, fill: '#ef3b3b' }, shell);
        const b = a + 0.9;
        sel('line', { x1: ox, y1: oy, x2: ox + Math.cos(b) * 20, y2: oy + Math.sin(b) * 20, stroke: '#dfe7f5', 'stroke-width': 2 }, shell);
        sel('circle', { cx: ox + Math.cos(b) * 20, cy: oy + Math.sin(b) * 20, r: k % 2 ? 6 : 8, fill: k % 2 ? '#f2f5fa' : '#6b7280' }, shell);
      }
      sel('circle', { cx, cy, r: 22, fill: '#ff4fa3' }, svg);
      const t = sel('text', { x: cx, y: cy + 5, 'text-anchor': 'middle', fill: '#fff', 'font-weight': 800, 'font-size': 15 }, svg); t.textContent = 'Nu⁻';
    } else {
      const ion = sel('g', null, svg);
      const nx = 95, ny = 130;
      sel('circle', { cx: nx, cy: ny, r: 16, fill: '#ab5cf2' }, ion);
      const tn = sel('text', { x: nx, y: ny + 5, 'text-anchor': 'middle', fill: '#fff', 'font-weight': 800, 'font-size': 13 }, ion); tn.textContent = 'Na⁺';
      for (let k = 0; k < 5; k++) {
        const a = k * 2 * Math.PI / 5 + 0.3;
        const ox = nx + Math.cos(a) * 34, oy = ny + Math.sin(a) * 34;
        const sx = nx + Math.cos(a) * 58, sy = ny + Math.sin(a) * 58;
        sel('line', { x1: ox, y1: oy, x2: sx, y2: sy, stroke: '#dfe7f5', 'stroke-width': 2 }, ion);
        sel('circle', { cx: ox, cy: oy, r: 9, fill: '#ef3b3b' }, ion);
        sel('circle', { cx: sx, cy: sy, r: 11, fill: '#f2c933' }, ion);
        [0.7, -0.7].forEach((d) => {
          const mx = sx + Math.cos(a + d) * 22, my = sy + Math.sin(a + d) * 22;
          sel('line', { x1: sx, y1: sy, x2: mx, y2: my, stroke: '#dfe7f5', 'stroke-width': 2 }, ion);
          sel('circle', { cx: mx, cy: my, r: 8, fill: '#6b7280' }, ion);
        });
      }
      const free = sel('g', { class: 'free' }, svg);
      sel('circle', { cx: 222, cy: 125, r: 34, fill: 'rgba(255,79,163,.12)', stroke: '#ff4fa3', 'stroke-dasharray': '4 4' }, free);
      sel('circle', { cx: 222, cy: 125, r: 22, fill: '#ff4fa3' }, free);
      const t = sel('text', { x: 222, y: 130, 'text-anchor': 'middle', fill: '#fff', 'font-weight': 800, 'font-size': 15 }, free); t.textContent = 'Nu⁻';
    }
    return svg;
  };
  const p = h('div', { class: 'solv protic fig' }, mkPanel('protic'), h('figcaption', { html: '<b>Solvente prótico</b> (H₂O, ROH): as ligações de hidrogênio formam uma "gaiola" em torno do ânion → nucleófilo <b>estabilizado e menos reativo</b>.' }));
  const a = h('div', { class: 'solv aprotic fig' }, mkPanel('aprotic'), h('figcaption', { html: '<b>Solvente polar aprótico</b> (DMSO, DMF, acetona, MeCN): solvata bem o <b>cátion</b> (pelo O), mas mal o ânion → nucleófilo <b>relativamente "livre" e mais reativo</b>.' }));
  host.appendChild(h('div', { class: 'grid2' }, p, a));
}

/* ===================================================================
 * Nucleofilicidade por solvente
 * =================================================================== */
const NUCS = [
  { k: 'I⁻', p: 7.4, a: 55, t: 'grande e polarizável; fracamente solvatado por ligação de H', base: 'base muito fraca' },
  { k: 'CN⁻', p: 6.7, a: 88, t: 'carga negativa no C; bom nucleófilo', base: 'base moderada' },
  { k: 'HO⁻', p: 6.5, a: 92, t: 'carga negativa no O; muito solvatado em água', base: 'base forte' },
  { k: 'RO⁻', p: 6.3, a: 95, t: 'alcóxido (ex.: CH₃O⁻)', base: 'base forte' },
  { k: 'N₃⁻', p: 5.8, a: 86, t: 'azida: excelente nucleófilo e base fraca', base: 'base fraca' },
  { k: 'Br⁻', p: 5.8, a: 66, t: 'intermediário entre I⁻ e Cl⁻', base: 'base muito fraca' },
  { k: 'Cl⁻', p: 4.4, a: 78, t: 'pequeno, fortemente solvatado em meio prótico', base: 'base muito fraca' },
  { k: 'H₂O', p: 0.0, a: 6, t: 'neutra: par de elétrons menos disponível', base: 'base fraca' },
  { k: 'ROH', p: 0.0, a: 6, t: 'neutro (ex.: CH₃OH)', base: 'base fraca' },
];
export function nucleophilicity(host) {
  let mode = 'p';
  const seg = h('div', { class: 'seg', role: 'group', 'aria-label': 'Tipo de solvente' });
  const bP = h('button', { type: 'button', 'aria-pressed': 'true', onclick: () => set('p') }, 'Solvente prótico (CH₃OH)');
  const bA = h('button', { type: 'button', 'aria-pressed': 'false', onclick: () => set('a') }, 'Solvente aprótico (DMF/DMSO)');
  seg.append(bP, bA);
  const list = h('div', { class: 'rank' });
  const note = h('p', { class: 'hint', style: 'color:var(--muted);font-size:.86rem' });
  host.append(h('div', { class: 'controls' }, seg), list, note);
  function set(m) {
    mode = m;
    bP.setAttribute('aria-pressed', m === 'p'); bA.setAttribute('aria-pressed', m === 'a');
    const arr = NUCS.slice().sort((x, y) => (m === 'p' ? y.p - x.p : y.a - x.a));
    list.innerHTML = '';
    arr.forEach((n) => {
      const w = m === 'p' ? Math.max(3, n.p / 7.5 * 100) : n.a;
      const bar = h('span', { style: `width:0%;background:${n.p === 0 ? 'var(--dim)' : 'linear-gradient(90deg,var(--magenta),var(--orange))'}` });
      list.append(h('div', { class: 'r', title: n.t }, h('span', { class: 'nm' }, n.k), h('div', { class: 'bar' }, bar), h('small', null, m === 'p' ? 'n = ' + n.p.toFixed(1).replace('.', ',') : n.base)));
      requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.width = w + '%'; }));
    });
    note.innerHTML = m === 'p'
      ? 'Valores de nucleofilicidade de Pearson (n, escala logarítmica, CH₃I em metanol). Em solvente prótico, <b>I⁻ &gt; Br⁻ &gt; Cl⁻</b>: os ânions pequenos ficam presos por ligações de hidrogênio.'
      : 'Tendência qualitativa em DMF/DMSO: sem ligações de hidrogênio com o ânion, a ordem dos haletos pode se <b>inverter</b> (Cl⁻ &gt; Br⁻ &gt; I⁻), acompanhando melhor a basicidade. Todos os ânions ficam muito mais reativos.';
  }
  set('p');
}

/* ===================================================================
 * Grupos abandonadores
 * =================================================================== */
const LGS = [
  { k: 'TsO⁻', name: 'tosilato', pka: '≈ −2,8 (TsOH)', q: 98, t: 'carga deslocalizada por ressonância em três oxigênios; excelente' },
  { k: 'MsO⁻', name: 'mesilato', pka: '≈ −1,9 (MsOH)', q: 95, t: 'como o tosilato; excelente' },
  { k: 'I⁻', name: 'iodeto', pka: '≈ −10 (HI)', q: 88, t: 'grande, polarizável, base muito fraca' },
  { k: 'H₂O', name: 'água (de R–OH₂⁺)', pka: '−1,7 (H₃O⁺)', q: 80, t: 'só sai depois de protonar o OH em meio ácido' },
  { k: 'Br⁻', name: 'brometo', pka: '≈ −9 (HBr)', q: 76, t: 'bom grupo abandonador' },
  { k: 'Cl⁻', name: 'cloreto', pka: '≈ −7 (HCl)', q: 58, t: 'razoável; reações mais lentas' },
  { k: 'F⁻', name: 'fluoreto', pka: '3,2 (HF)', q: 10, t: 'ligação C–F muito forte; péssimo' },
  { k: 'HO⁻', name: 'hidróxido', pka: '15,7 (H₂O)', q: 3, t: 'base forte: praticamente não sai' },
];
export function leavingGroups(host) {
  const list = h('div', { class: 'rank' });
  LGS.forEach((l) => {
    const bar = h('span', { style: `width:${l.q}%;background:linear-gradient(90deg,var(--orange),var(--yellow))` });
    list.append(h('div', { class: 'r', title: l.t }, h('span', { class: 'nm' }, l.k), h('div', { class: 'bar' }, bar), h('small', null, 'pKa ' + l.pka)));
  });
  host.append(h('div', { class: 'sort-axis' }, h('span', null, 'grupo abandonador'), h('span', null, 'facilidade de saída (qualitativa) · pKa do ácido conjugado')), list);
}

/* ===================================================================
 * Estabilidade de carbocátions
 * =================================================================== */
export function cationLadder(host) {
  const data = [
    { g: ['H', 'H', 'H'], n: 'metílico', hc: 0, s: 8 },
    { g: ['CH3', 'H', 'H'], n: 'primário', hc: 3, s: 30 },
    { g: ['CH3', 'CH3', 'H'], n: 'secundário', hc: 6, s: 60 },
    { g: ['CH3', 'CH3', 'CH3'], n: 'terciário', hc: 9, s: 90 },
  ];
  const row = h('div', { class: 'grid4' });
  data.forEach((d) => {
    const s = cation(d.g);
    row.append(h('div', { class: 'card' }, mol(s, { scale: 34, fs: 15 }), h('h4', null, d.n), h('small', null, `${d.hc} ligações C–H vizinhas para hiperconjugação`), h('div', { class: 'meter o' }, h('span', { style: `width:${d.s}%` }))));
  });
  host.append(row, h('div', { class: 'sort-axis', style: 'margin-top:6px' }, h('span', null, 'menos estável'), h('span', null, 'mais estável →')));
}

/* ===================================================================
 * Tabela comparativa clicável
 * =================================================================== */
const CMP = [
  ['Número de etapas', 'várias (ionização, ataque, às vezes desprotonação)', 'uma', 'Na SN1 a ligação C–LG rompe antes de o nucleófilo chegar; na SN2 tudo acontece num único evento.'],
  ['Intermediário', 'carbocátion', 'não há', 'O carbocátion é um mínimo de energia (intermediário). O "C pentacoordenado" da SN2 é apenas um estado de transição, um máximo de energia, e não pode ser isolado.'],
  ['Lei de velocidade', 'v = k[RX]', 'v = k[RX][Nu]', 'Na SN1 só o substrato participa da etapa lenta (ionização); dobrar [Nu] não muda a velocidade. Na SN2, dobrar [Nu] dobra a velocidade.'],
  ['Substrato típico', 'terciário (e alílico/benzílico)', 'metílico, primário (e alílico/benzílico)', 'Carbocátions mais substituídos são mais estáveis (SN1); carbonos menos substituídos são mais acessíveis ao ataque traseiro (SN2). Secundários podem seguir qualquer caminho.'],
  ['Nucleófilo', 'pode ser fraco/neutro (H₂O, ROH)', 'geralmente forte (I⁻, CN⁻, N₃⁻, RS⁻, RO⁻…)', 'O nucleófilo não entra na etapa lenta da SN1; por isso nucleófilos fracos (muitas vezes o próprio solvente: solvólise) funcionam. A SN2 depende diretamente da força do nucleófilo.'],
  ['Solvente', 'polar prótico', 'polar aprótico', 'Solventes próticos estabilizam o carbocátion e o ânion que sai (favorecem a ionização). Solventes apróticos deixam o nucleófilo aniônico menos solvatado e mais reativo.'],
  ['Estereoquímica', 'perda (parcial) da informação estereoquímica / racemização', 'inversão (Walden)', 'O carbocátion plano pode ser atacado pelas duas faces; pares iônicos costumam gerar ligeiro excesso de inversão. A SN2 é estereoespecífica: sempre inversão.'],
  ['Rearranjo', 'possível', 'não ocorre', 'Carbocátions podem sofrer migrações 1,2 de hidreto ou alquila para formar um cátion mais estável. Na SN2 não há carbocátion.'],
  ['Mecanismo', 'etapas sucessivas', 'concertado', 'Concertado = formação e quebra de ligações ao mesmo tempo, num único estado de transição.'],
];
export function compareTable(host) {
  const tb = h('tbody');
  CMP.forEach((r) => {
    const exp = h('tr', { class: 'exp', hidden: true }, h('td', { colspan: 3, html: '💡 ' + r[3] }));
    const row = h('tr', { class: 'row', tabindex: 0, role: 'button', 'aria-expanded': 'false' }, h('td', null, r[0]), h('td', { class: 's1' }, r[1]), h('td', { class: 's2' }, r[2]));
    const tg = () => { const op = exp.hidden; exp.hidden = !op; row.classList.toggle('open', op); row.setAttribute('aria-expanded', op); };
    row.addEventListener('click', tg);
    row.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tg(); } });
    tb.append(row, exp);
  });
  host.append(h('div', { class: 'table-wrap' }, h('table', { class: 'cmp' }, h('thead', null, h('tr', null, h('th', null, 'Característica'), h('th', { class: 'sn1c' }, 'SN1'), h('th', { class: 'sn2c' }, 'SN2'))), tb)));
}

/* ===================================================================
 * Árvore de decisão
 * =================================================================== */
const TREE_Q = [
  { k: 'sub', q: 'Qual é o substrato?', a: [['met', 'metílico', 'CH₃–X'], ['pri', 'primário', 'RCH₂–X'], ['sec', 'secundário', 'R₂CH–X'], ['ter', 'terciário', 'R₃C–X'], ['bz', 'alílico / benzílico (1°)', 'C=C–CH₂–X, Ar–CH₂–X']] },
  { k: 'nu', q: 'Como é o nucleófilo?', a: [['fort', 'forte, pouco básico', 'I⁻, Br⁻, N₃⁻, CN⁻, RS⁻'], ['base', 'forte e base forte', 'HO⁻, RO⁻'], ['fraco', 'fraco / neutro', 'H₂O, ROH']] },
  { k: 'solv', q: 'Qual é o solvente?', a: [['prot', 'polar prótico', 'H₂O, CH₃OH, EtOH'], ['aprot', 'polar aprótico', 'DMSO, DMF, acetona, MeCN']] },
];
export function treeVerdict(sub, nu, solv) {
  const r = (v, t, extra) => ({ v, t, extra });
  if (sub === 'met' || sub === 'pri') {
    if (nu === 'fraco') return r('sn2', 'SN2 (lenta)', 'Carbocátions metílico e primário são instáveis demais para SN1. Com nucleófilo fraco, a SN2 ainda é o caminho possível, mas é lenta.');
    if (nu === 'base' && sub === 'pri') return r('sn2', 'SN2 provavelmente favorecida', 'Primários reagem bem por SN2 mesmo com HO⁻/RO⁻. Com bases volumosas (ex.: t-BuO⁻) ou aquecimento, E2 pode competir.');
    return r('sn2', 'SN2 provavelmente favorecida', solv === 'aprot' ? 'Substrato desimpedido + nucleófilo forte + solvente aprótico: condições clássicas de SN2.' : 'Substrato desimpedido + nucleófilo forte. Em solvente prótico a SN2 ocorre, porém mais devagar.');
  }
  if (sub === 'ter') {
    if (nu === 'base') return r('none', 'Situação competitiva — eliminação (E2) deve predominar', 'SN2 é impossível em terciários; com base forte, a <b>E2</b> é em geral o caminho principal.');
    if (solv === 'prot') return r('sn1', 'SN1 provavelmente favorecida', 'Carbocátion terciário estável + solvente prótico ionizante. Espere competição com <b>E1</b>, sobretudo com aquecimento.');
    return r('mix', 'Situação competitiva — outros fatores precisam ser considerados', 'SN2 é impossível e o solvente aprótico não favorece a ionização: a reação tende a ser lenta. Pode haver SN1 lenta e/ou eliminação.');
  }
  if (sub === 'sec') {
    if (nu === 'base') return r('mix', 'Situação competitiva — outros fatores precisam ser considerados', 'Secundário + base forte: <b>E2 compete fortemente</b> (e frequentemente predomina, principalmente a quente). A SN2 pode ocorrer em parte.');
    if (nu === 'fort' && solv === 'aprot') return r('sn2', 'SN2 provavelmente favorecida', 'Nucleófilo forte e pouco básico em solvente aprótico: condições que favorecem SN2 mesmo em secundários (com inversão).');
    if (nu === 'fraco' && solv === 'prot') return r('sn1', 'SN1 provavelmente favorecida', 'Solvólise de secundário: nucleófilo fraco e solvente ionizante. Lenta; atenção a <b>rearranjos</b> e à competição com <b>E1</b>.');
    return r('mix', 'Situação competitiva — outros fatores precisam ser considerados', 'Secundários estão na fronteira: substrato, nucleófilo, solvente e grupo abandonador precisam ser avaliados em conjunto.');
  }
  // alílico/benzílico primário
  if (nu === 'fraco' && solv === 'prot') return r('sn1', 'SN1 provavelmente favorecida', 'O carbocátion alílico/benzílico é estabilizado por ressonância e se forma com facilidade em solvente prótico.');
  if (nu !== 'fraco' && solv === 'aprot') return r('sn2', 'SN2 provavelmente favorecida', 'Carbono primário desimpedido; o estado de transição SN2 também é estabilizado pelo sistema π vizinho.');
  return r('mix', 'Situação competitiva — outros fatores precisam ser considerados', 'Substratos alílicos/benzílicos reagem rápido pelos dois mecanismos; as condições decidem.');
}
export function decisionTree(host) {
  const ans = {};
  const crumbs = h('div', { class: 'crumbs' });
  const stage = h('div');
  host.append(h('div', { class: 'tree' }, crumbs, stage));
  function render() {
    crumbs.innerHTML = '';
    TREE_Q.forEach((q, i) => {
      if (ans[q.k]) {
        const a = q.a.find((x) => x[0] === ans[q.k]);
        crumbs.append(h('span', { class: 'chip', role: 'button', tabindex: 0, title: 'Alterar', onclick: () => { TREE_Q.slice(i).forEach((qq) => delete ans[qq.k]); render(); } }, `${q.q.replace('?', '')}: ${a[1]} ✎`));
      }
    });
    stage.innerHTML = '';
    const q = TREE_Q.find((x) => !ans[x.k]);
    if (q) {
      stage.append(h('div', { class: 'q' }, h('h4', null, q.q), h('div', { class: 'answers' }, q.a.map((a) => h('button', { class: 'btn', type: 'button', onclick: () => { ans[q.k] = a[0]; render(); } }, h('span', null, a[1]), h('small', null, a[2]))))));
      return;
    }
    const v = treeVerdict(ans.sub, ans.nu, ans.solv);
    stage.append(h('div', { class: 'verdict ' + v.v }, h('h4', null, v.t), h('p', { html: v.extra }),
      h('p', { class: 'hint', style: 'color:var(--muted);font-size:.88rem', html: 'Lembre-se: o grupo abandonador também importa (I⁻, TsO⁻ &gt; Br⁻ &gt; Cl⁻) e a temperatura favorece eliminação. Estas são tendências, não regras absolutas.' }),
      h('button', { class: 'btn sm', type: 'button', onclick: () => { Object.keys(ans).forEach((k) => delete ans[k]); render(); } }, '↺ Recomeçar')));
  }
  render();
}

/* ===================================================================
 * Simulador "Monte sua reação"
 * =================================================================== */
const SIM = {
  sub: [
    ['met', 'metil haleto', 'CH₃–X', 'methyl'], ['pri', 'haleto primário', 'CH₃CH₂CH₂–X', 'propyl'], ['sec', 'haleto secundário', '(CH₃)₂CH–X', 'isopropyl'],
    ['ter', 'haleto terciário', '(CH₃)₃C–X', 'tbutyl'], ['bz', 'benzílico', 'PhCH₂–X', 'benzyl'], ['al', 'alílico', 'CH₂=CHCH₂–X', 'allyl'],
  ],
  lg: [['Cl', 'Cl'], ['Br', 'Br'], ['I', 'I'], ['OTs', 'OTs (tosilato)']],
  nu: [['OH', 'HO⁻'], ['OR', 'RO⁻'], ['CN', 'CN⁻'], ['N3', 'N₃⁻'], ['I', 'I⁻'], ['H2O', 'H₂O'], ['ROH', 'ROH']],
  solv: [['H2O', 'H₂O', 'prótico'], ['MeOH', 'metanol', 'prótico'], ['EtOH', 'etanol', 'prótico'], ['DMSO', 'DMSO', 'aprótico'], ['DMF', 'DMF', 'aprótico'], ['acetona', 'acetona', 'aprótico'], ['MeCN', 'acetonitrila', 'aprótico']],
};
const NU_PRODUCT = { OH: 'OH', OR: 'OCH3', CN: 'CN', N3: 'N3', I: 'I', H2O: 'OH', ROH: 'OCH3' };

export function analyze(c) {
  const steps = [];
  let s1 = 0, s2 = 0, no1 = false, no2 = false;
  const warn = [];
  // 1. substrato
  const sub = {
    met: ['Carbono metílico: totalmente desimpedido para o ataque traseiro. O cátion CH₃⁺ seria instável demais.', 3, 0, true, false],
    pri: ['Carbono primário: pouco impedido → SN2 fácil. Carbocátion primário muito instável → SN1 praticamente não ocorre.', 2, 0, true, false],
    sec: ['Carbono secundário: impedimento moderado (SN2 mais lenta) e carbocátion de estabilidade intermediária. Pode seguir os dois caminhos.', 1, 1, false, false],
    ter: ['Carbono terciário: a face traseira está bloqueada → SN2 impossível. Carbocátion terciário relativamente estável → SN1 viável.', 0, 3, false, true],
    bz: ['Benzílico primário: desimpedido (SN2 rápida) <b>e</b> forma carbocátion estabilizado por ressonância com o anel (SN1 viável).', 2, 2, false, false],
    al: ['Alílico primário: desimpedido (SN2 rápida) <b>e</b> forma carbocátion alílico estabilizado por ressonância (SN1 viável).', 2, 2, false, false],
  }[c.sub];
  s2 += sub[1]; s1 += sub[2]; if (sub[3]) no1 = true; if (sub[4]) no2 = true;
  steps.push({ t: 'Análise do substrato', d: sub[0], d1: sub[3] ? '✗' : '+' + sub[2], d2: sub[4] ? '✗' : '+' + sub[1] });
  // 2. nucleófilo
  const nu = {
    OH: ['HO⁻: aniônico, bom nucleófilo — favorece SN2. Mas também é <b>base forte</b>.', 2, -1, 'base'],
    OR: ['RO⁻ (alcóxido): bom nucleófilo, favorece SN2, mas é <b>base forte</b>.', 2, -1, 'base'],
    CN: ['CN⁻: aniônico, ótimo nucleófilo, basicidade moderada — favorece SN2.', 2, -1, 'mod'],
    N3: ['N₃⁻ (azida): excelente nucleófilo e base fraca — favorece SN2.', 2, -1, 'weak'],
    I: ['I⁻: excelente nucleófilo (polarizável) e base muito fraca — favorece SN2.', 2, -1, 'weak'],
    H2O: ['H₂O: neutra, nucleófilo fraco. Não favorece SN2; é compatível com SN1, que não depende do nucleófilo na etapa lenta.', -2, 1, 'weak'],
    ROH: ['ROH: neutro, nucleófilo fraco. Desfavorece SN2; compatível com SN1 (solvólise).', -2, 1, 'weak'],
  }[c.nu];
  s2 += nu[1]; s1 += nu[2];
  steps.push({ t: 'Análise do nucleófilo', d: nu[0], d1: (nu[2] >= 0 ? '+' : '') + nu[2], d2: (nu[1] >= 0 ? '+' : '') + nu[1] });
  // 3. solvente
  const so = {
    H2O: ['Água: polar prótica e muito ionizante — estabiliza o carbocátion e o ânion que sai (favorece SN1); solvata fortemente nucleófilos aniônicos (desfavorece SN2).', -1, 2],
    MeOH: ['Metanol: polar prótico — favorece a ionização (SN1) e diminui a reatividade de ânions (SN2 mais lenta).', -1, 1.5],
    EtOH: ['Etanol: polar prótico, um pouco menos ionizante que água/metanol — tende a favorecer SN1.', -1, 1],
    DMSO: ['DMSO: polar aprótico — nucleófilo aniônico pouco solvatado e mais reativo (favorece SN2); não estabiliza tão bem o carbocátion.', 2, -1],
    DMF: ['DMF: polar aprótico — favorece SN2.', 2, -1],
    acetona: ['Acetona: polar aprótica (menos polar que DMSO) — favorece SN2; pouco ionizante.', 1.5, -1],
    MeCN: ['Acetonitrila: polar aprótica — favorece SN2.', 1.5, -1],
  }[c.solv];
  s2 += so[1]; s1 += so[2];
  steps.push({ t: 'Análise do solvente', d: so[0], d1: (so[2] >= 0 ? '+' : '') + so[2], d2: (so[1] >= 0 ? '+' : '') + so[1] });
  // 4. grupo abandonador
  const lg = {
    I: ['I⁻: excelente grupo abandonador (base muito fraca) — acelera os dois mecanismos.', 1, 1],
    OTs: ['Tosilato: excelente grupo abandonador (ânion estabilizado por ressonância) — acelera os dois mecanismos.', 1, 1],
    Br: ['Br⁻: bom grupo abandonador.', 0.5, 0.5],
    Cl: ['Cl⁻: grupo abandonador razoável — reações mais lentas, especialmente a ionização (SN1).', 0, -0.5],
  }[c.lg];
  s2 += lg[1]; s1 += lg[2];
  steps.push({ t: 'Análise do grupo abandonador', d: lg[0] + ' O grupo abandonador afeta mais a <i>velocidade</i> do que a escolha entre SN1 e SN2.', d1: (lg[2] >= 0 ? '+' : '') + lg[2], d2: (lg[1] >= 0 ? '+' : '') + lg[1] });
  // interações e avisos
  const neutral = c.nu === 'H2O' || c.nu === 'ROH';
  const protic = ['H2O', 'MeOH', 'EtOH'].includes(c.solv);
  if (neutral && !protic) warn.push('Nucleófilo neutro em solvente aprótico: combinação pouco usual — a reação tende a ser muito lenta.');
  if (nu[3] === 'base' && (c.sub === 'sec' || c.sub === 'ter')) warn.push('<b>Atenção a E2:</b> base forte com substrato ' + (c.sub === 'ter' ? 'terciário' : 'secundário') + ' — a eliminação compete fortemente' + (c.sub === 'ter' ? ' e deve predominar.' : ', principalmente com aquecimento.'));
  if (neutral && protic && (c.sub === 'ter' || c.sub === 'sec')) warn.push('<b>Atenção a E1:</b> o mesmo carbocátion pode perder H⁺ e formar alceno, sobretudo com aquecimento.');
  if (c.sub === 'sec' && !no1 && s1 >= s2) warn.push('Carbocátions secundários podem <b>rearranjar</b> (migração de hidreto/alquila) se houver um cátion mais estável acessível.');
  if (c.nu === 'ROH' || c.nu === 'H2O') {
    const solvNu = { H2O: 'H2O', MeOH: 'ROH', EtOH: 'ROH' }[c.solv];
    if (solvNu && solvNu !== c.nu) warn.push('O solvente também é nucleófilo: espere mistura de produtos (álcool e éter).');
  }
  // conclusão
  let v, title;
  if (no2) {
    if (nu[3] === 'base') { v = 'none'; title = 'Competição provável — eliminação (E2) deve predominar'; }
    else if (s1 >= 3) { v = 'sn1'; title = 'SN1 favorecida'; }
    else { v = 'mix'; title = 'Competição provável / reação lenta'; }
  } else if (no1) {
    v = 'sn2'; title = s2 >= 3 ? 'SN2 favorecida' : 'SN2 favorecida (porém lenta)';
  } else {
    const d = s2 - s1;
    if (d >= 2) { v = 'sn2'; title = 'SN2 favorecida'; }
    else if (d <= -2) { v = 'sn1'; title = 'SN1 favorecida'; }
    else { v = 'mix'; title = 'Competição provável'; }
    if (c.sub === 'sec' && nu[3] === 'base') { v = 'mix'; title = 'Competição provável (SN2 × E2)'; }
  }
  return { steps, s1, s2, no1, no2, v, title, warn, product: NU_PRODUCT[c.nu] };
}

export function simulator(host) {
  const group = (key, title, items, sub) => h('div', { class: 'optgroup' }, h('h4', null, title), h('div', { class: 'opts', role: 'radiogroup', 'aria-label': title },
    items.map((it, i) => h('label', { class: 'opt-radio' }, h('input', { type: 'radio', name: 'sim-' + key, value: it[0], checked: i === (sub || 0) ? true : null }), h('span', { html: it[1] }), it[2] ? h('small', null, it[2]) : null))));
  const form = h('div', { class: 'sim-grid' },
    group('sub', 'Substrato', SIM.sub, 1), group('lg', 'Grupo abandonador', SIM.lg, 1), group('nu', 'Nucleófilo', SIM.nu, 3), group('solv', 'Solvente', SIM.solv, 3));
  const scheme = h('div', { class: 'mech', style: 'margin-top:14px;display:grid;place-items:center' });
  const guess = h('div', { class: 'controls' }, h('span', { class: 'hint', style: 'color:var(--muted)' }, 'Seu palpite antes da análise:'),
    ...['SN1', 'SN2', 'competição'].map((g) => h('label', { class: 'opt-radio' }, h('input', { type: 'radio', name: 'sim-guess', value: g }), g)));
  const go = h('button', { class: 'btn primary lg', type: 'button' }, '⚗ Prever mecanismo');
  const out = h('div', { class: 'analysis', 'aria-live': 'polite' });
  host.append(form, scheme, guess, h('div', { class: 'controls' }, go), out);
  const val = (k) => host.querySelector(`input[name="sim-${k}"]:checked`).value;
  function drawScheme() {
    const sub = SIM.sub.find((x) => x[0] === val('sub'));
    const lg = val('lg');
    scheme.innerHTML = '';
    const row = h('div', { style: 'display:flex;align-items:center;gap:14px;flex-wrap:wrap;justify-content:center' });
    row.append(h('div', { style: 'width:170px' }, mol(SK[sub[3]](lg), { scale: 36, fs: 15 })));
    row.append(h('span', { style: 'font-size:1.6rem;color:var(--muted)' }, '+'));
    const nuL = SIM.nu.find((x) => x[0] === val('nu'))[1];
    row.append(h('span', { style: 'font-size:1.4rem;font-weight:800;color:var(--magenta)' }, nuL));
    const solv = SIM.solv.find((x) => x[0] === val('solv'));
    row.append(h('span', { style: 'font-size:1.6rem;color:var(--muted)' }, '→'), h('span', { class: 'chip' }, solv[1] + ' · ' + solv[2]), h('span', { style: 'font-size:1.6rem;color:var(--muted)' }, '?'));
    scheme.append(row);
    out.innerHTML = '';
  }
  form.addEventListener('change', drawScheme);
  drawScheme();
  go.addEventListener('click', () => {
    const c = { sub: val('sub'), lg: val('lg'), nu: val('nu'), solv: val('solv') };
    const r = analyze(c);
    out.innerHTML = '';
    const scaleEl = h('div', null, h('div', { class: 'sort-axis' }, h('span', { class: 'sn1c' }, '◀ tendência SN1'), h('span', { class: 'sn2c' }, 'tendência SN2 ▶')));
    const L = h('span', { style: 'width:0%' }), R = h('span', { style: 'width:0%' });
    scaleEl.append(h('div', { class: 'scale' }, h('div', { class: 'l' }, L), h('div', { class: 'r' }, R)));
    r.steps.forEach((st, i) => {
      setTimeout(() => {
        out.append(h('div', { class: 'astep' }, h('h5', null, h('span', { class: 'n' }, String(i + 1)), st.t, h('span', { class: 'pts' }, h('span', { class: 'chip sn1' }, 'SN1 ' + st.d1.replace('.', ',')), h('span', { class: 'chip sn2' }, 'SN2 ' + st.d2.replace('.', ',')))), h('div', { html: st.d })));
      }, i * 450);
    });
    setTimeout(() => {
      const tot = (x, no) => (no ? 0 : Math.max(0, Math.min(100, x * 12)));
      out.append(scaleEl);
      requestAnimationFrame(() => { L.style.width = tot(r.s1, r.no1) + '%'; R.style.width = tot(r.s2, r.no2) + '%'; });
      const g = host.querySelector('input[name="sim-guess"]:checked');
      const map = { sn1: 'SN1', sn2: 'SN2', mix: 'competição', none: 'competição' };
      const gtxt = g ? (g.value === map[r.v] ? '<b style="color:var(--green)">Seu palpite coincide com a análise.</b>' : `<b style="color:var(--orange)">Seu palpite foi “${g.value}”.</b> Releia os fatores acima.`) : '';
      const prod = r.v === 'none' ? '' : `<p>Produto de substituição esperado: o grupo <b>${r.product.replace(/(\d)/g, '<sub>$1</sub>')}</b> no lugar do grupo abandonador${r.v !== 'sn2' && c.sub !== 'met' && c.sub !== 'pri' ? ' (com perda de estereoquímica, se o carbono for estereogênico)' : r.v === 'sn2' ? ' (com inversão, se o carbono for estereogênico)' : ''}.</p>`;
      out.append(h('div', { class: 'verdict ' + r.v }, h('h4', null, '5 · Conclusão: ' + r.title),
        h('div', { html: prod + (r.warn.length ? '<ul>' + r.warn.map((w) => `<li>${w}</li>`).join('') + '</ul>' : '') + gtxt })));
    }, r.steps.length * 450 + 200);
  });
}

export { SIM };
export { halide, anion };
