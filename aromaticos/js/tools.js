/*
 * tools.js — laboratórios e simuladores (módulos 20–22):
 * laboratório aromático 3D, simulador de aromaticidade (construtor de anéis),
 * solucionador de Hückel, marcador de orbitais p e “Aromático ou não?”.
 */
import { h, seg, tgl, shuffle } from './widgets2d.js';
import { el as sel2 } from './chem2d.js';
import { MOLS, LAB, analyze, geometry, TYPES, TYPE_LABEL, CLS, mono } from './arom.js';
import { ringSVG } from './arom2d.js';
import { aromScene } from './a3d.js';
import { fb, clear, sel, molOpts, vbox, PI_LEGEND, badge, ringFig, report } from './ui.js';

/* ===================================================================
 * Laboratório aromático 3D
 * =================================================================== */
export function lab3d(host) {
  let key = 'benzeno', A = null;
  const st = { p: false, cloud: true, plane: false, e: true, lp: true, style: 'ball', hybrid: false };
  const v = vbox('tall'), fig = h('div', { class: 'figs' }), info = h('div');
  const build = () => {
    const def = MOLS[key], R = analyze(def);
    if (A) A.v.dispose();
    clear(v);
    A = aromScene(v, def, Object.assign({}, st, { dist: undefined }));
    clear(fig).append(ringFig(def, { mode: st.hybrid ? 'hybrid' : 'kekule', centerCharge: st.hybrid && def.types && def.types.includes('C-') && def.n === 5 ? '−' : undefined, scale: def.kind === 'fused' ? 32 : 42 }));
    info.innerHTML = `<div class="readout"><span><b>${def.name}</b> · ${def.f}</span><span>elétrons π: <b>${R.e}</b></span><span style="color:${CLS[R.cls][1]}"><b>${CLS[R.cls][0]}</b></span></div>${report(def, R)}${R.msgs.map((m) => `<p>${m}</p>`).join('')}`;
  };
  const T = (label, k) => tgl(label, () => { st[k] = !st[k]; if (k === 'p' && st.p) st.cloud = false; if (k === 'cloud' && st.cloud) st.p = false; syncBtns(); A.st.p = st.p; A.st.cloud = st.cloud; A.st[k] = st[k]; A.rebuild(); if (k === 'hybrid') build(); return st[k]; }, st[k]);
  const bp = T('Orbitais p', 'p'), bc = T('Nuvem π', 'cloud');
  const syncBtns = () => { bp.setAttribute('aria-pressed', st.p); bc.setAttribute('aria-pressed', st.cloud); };
  host.append(
    h('div', { class: 'controls' }, h('label', null, 'Molécula: ', sel(molOpts(LAB), key, (k) => { key = k; build(); }, 'molécula')), seg([['ball', 'bola-vareta'], ['space', 'preenchimento']], 'ball', (k) => { st.style = k; A.st.style = k; A.rebuild(); }, 'modelo')),
    h('div', { class: 'controls' }, bp, bc, T('Plano molecular', 'plane'), T('Elétrons π por átomo', 'e'), T('Pares isolados', 'lp'), T('Híbrido (anel)', 'hybrid')),
    h('div', { class: 'grid2' }, v, h('div', null, fig, info)), PI_LEGEND());
  build();
}

/* ===================================================================
 * Simulador de aromaticidade: construtor de anéis 3–8
 * =================================================================== */
const PRESETS = [['benzeno', 'benzeno'], ['ciclobutadieno', 'ciclobutadieno'], ['cpH', 'ciclopentadieno'], ['cp', 'ânion Cp⁻'], ['cpPlus', 'cátion Cp⁺'], ['tropilio', 'tropílio'], ['cicloheptatrieno', 'cicloeptatrieno'], ['piridina', 'piridina'], ['pirrol', 'pirrol'], ['furano', 'furano'], ['cot', 'COT'], ['ciclopropenilio', 'C₃H₃⁺']];
export function builder(host) {
  let def = clone(MOLS.benzeno), A = null, pend = 0;
  const ringBox = h('div', { class: 'bld' }), out = h('div'), v = vbox(), fig = h('div', { class: 'figs' });
  const sizeSel = sel([3, 4, 5, 6, 7, 8].map((n) => [n, n + ' átomos']), 6, (n) => { n = +n; def = mono(Array(n).fill('CH2'), [], { name: 'anel construído' }); draw(); }, 'tamanho do anel');
  const draw = () => {
    clear(ringBox);
    const n = def.n;
    // editor: lista de átomos (tipo) e ligações (simples/dupla)
    const W = 300, H = 300, cx = 150, cy = 150, R = 100;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('class', 'bldsvg'); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', 'Editor do anel: clique nas ligações para alternar simples/dupla');
    const P = [...Array(n).keys()].map((k) => { const t = -Math.PI / 2 + k * 2 * Math.PI / n; return [cx + R * Math.cos(t), cy + R * Math.sin(t)]; });
    for (let k = 0; k < n; k++) {
      const a = k, b = (k + 1) % n, d = def.dbl.some(([p, q]) => (p === a && q === b) || (p === b && q === a));
      const g = sel2('g', { class: 'bbtn' + (d ? ' on' : ''), tabindex: 0, role: 'button', 'aria-label': `ligação ${a + 1}–${b + 1}: ${d ? 'dupla' : 'simples'}` }, svg);
      sel2('line', { x1: P[a][0], y1: P[a][1], x2: P[b][0], y2: P[b][1], class: 'hit' }, g);
      sel2('line', { x1: P[a][0], y1: P[a][1], x2: P[b][0], y2: P[b][1], class: 'bl' }, g);
      if (d) { const mx = (P[a][0] + P[b][0]) / 2, my = (P[a][1] + P[b][1]) / 2; const ux = (cx - mx), uy = (cy - my), L = Math.hypot(ux, uy); const ox = ux / L * 9, oy = uy / L * 9; sel2('line', { x1: P[a][0] + ox + (P[b][0] - P[a][0]) * 0.15, y1: P[a][1] + oy + (P[b][1] - P[a][1]) * 0.15, x2: P[b][0] + ox - (P[b][0] - P[a][0]) * 0.15, y2: P[b][1] + oy - (P[b][1] - P[a][1]) * 0.15, class: 'bl' }, g); }
      const f = () => { if (d) def.dbl = def.dbl.filter(([p, q]) => !((p === a && q === b) || (p === b && q === a))); else def.dbl.push([a, b]); autoTypes(); draw(); };
      g.addEventListener('click', f); g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); f(); } });
    }
    P.forEach(([x, y], k) => { sel2('circle', { cx: x, cy: y, r: 17, class: 'bat t-' + def.types[k].replace(/[^A-Za-z]/g, '') }, svg); const t = sel2('text', { x, y, 'text-anchor': 'middle', 'dominant-baseline': 'central', class: 'batl' }, svg); t.textContent = short(def.types[k]); });
    const list = h('div', { class: 'bldatoms' }, def.types.map((t, k) => h('label', null, h('b', null, String(k + 1)), sel(Object.keys(TYPES).map((x) => [x, TYPE_LABEL[x]]), t, (x) => { def.types[k] = x; if (!TYPES[x].dbl) def.dbl = def.dbl.filter((d) => !d.includes(k)); draw(); }, 'tipo do átomo ' + (k + 1)))));
    ringBox.append(h('div', { class: 'grid2' }, h('div', null, svg, h('p', { class: 'hint3' }, 'Clique numa ligação para alternar simples/dupla. Escolha o tipo de cada átomo ao lado.')), list));
    analyzeNow();
  };
  // ao criar/remover duplas, ajusta C ↔ CH2 automaticamente (só para carbonos neutros)
  const autoTypes = () => { def.types = def.types.map((t, k) => { const has = def.dbl.some((d) => d.includes(k)); if (has && t === 'CH2') return 'C'; if (!has && t === 'C') return 'CH2'; return t; }); };
  const analyzeNow = () => {
    const R = analyze(def);
    clear(fig);
    if (!R.valid) { out.replaceChildren(fb('bad', '<b>Estrutura inválida.</b> ' + [...new Set(R.warn)].join(' ')), h('p', { class: 'hint3' }, 'Dica: cada C neutro sp² precisa de exatamente uma dupla; C⁺, C⁻, CH₂, NH, O e S não participam de duplas no anel.')); if (A) { A.v.dispose(); A = null; } clear(v).append(h('p', { class: 'hint center' }, 'Corrija a estrutura para ver o modelo 3D.')); return; }
    fig.append(ringFig(def, { cap: false, scale: 40 }));
    out.replaceChildren(h('div', { class: 'readout' }, h('span', null, 'elétrons π: ', h('b', null, String(R.e))), badge(R.cls)), h('div', { html: report(def, R) }), fb(R.cls === 'arom' ? 'ok' : R.cls === 'anti' ? 'bad' : 'neutral', R.msgs.join(' ')));
    cancelAnimationFrame(pend);
    pend = requestAnimationFrame(() => { if (A) A.v.dispose(); clear(v); A = aromScene(v, def, { cloud: true, e: true, hint: false }); });
  };
  host.append(h('div', { class: 'controls' }, h('label', null, 'Tamanho: ', sizeSel), h('span', { class: 'muted' }, 'ou carregue:'), sel([['', 'exemplo…'], ...PRESETS], '', (k) => { if (!k) return; def = clone(MOLS[k]); sizeSel.value = def.n; draw(); }, 'exemplo')), ringBox, h('div', { class: 'grid2' }, h('div', null, fig, out), v), PI_LEGEND(), h('p', { class: 'hint3' }, 'Modelo didático: um anel de 8 átomos com 4n elétrons é tratado como não planar (banheira, como o COT). Radicais (número ímpar de elétrons π) ficam fora da classificação simples.'));
  draw();
}
const short = (t) => ({ C: 'C', 'C+': 'C⁺', 'C-': 'C⁻', 'C.': 'C•', CH2: 'CH₂', N: 'N', NH: 'NH', O: 'O', S: 'S' }[t]);
const clone = (d) => Object.assign({}, d, { types: d.types.slice(), dbl: d.dbl.map((x) => x.slice()) });

/* ===================================================================
 * Solucionador de Hückel
 * =================================================================== */
export function huckelSolver(host) {
  const inp = h('input', { type: 'number', min: 0, max: 30, value: 6, 'aria-label': 'número de elétrons π', class: 'num' });
  const out = h('div', { 'aria-live': 'polite' });
  const go = () => {
    const e = Math.round(+inp.value);
    if (!(e >= 0 && e <= 30)) { out.replaceChildren(fb('neutral', 'Digite um número de 0 a 30.')); return; }
    const n1 = (e - 2) / 4, n2 = e / 4;
    const row = (lab, f, n) => h('div', { class: 'hsolve ' + (Number.isInteger(n) && n >= 0 ? 'ok' : 'bad') }, h('b', null, lab), h('span', null, f), h('span', null, Number.isInteger(n) && n >= 0 ? `n = ${n} ✓ inteiro` : `n = ${n.toString().replace('.', ',')} ✗`));
    out.replaceChildren(
      row('4n + 2 = ' + e, `n = (${e} − 2) / 4`, n1),
      row('4n = ' + e, `n = ${e} / 4`, n2),
      fb(e % 2 ? 'neutral' : e % 4 === 2 ? 'ok' : 'bad', e % 2 ? `${e} é ímpar: não se encaixa em 4n+2 nem em 4n (espécie radicalar).` : e % 4 === 2 ? `${e} elétrons π satisfazem 4n + 2 (n = ${n1}). <b>Candidato</b> a aromático.` : `${e} elétrons π = 4n (n = ${n2}). <b>Candidato</b> a antiaromático.`),
      h('div', { class: 'note care' }, h('b', { class: 't' }, 'Cuidado'), 'A contagem sozinha não basta: a regra só se aplica a um sistema cíclico, planar e totalmente conjugado (orbital p em todos os átomos do anel). Ex.: o COT tem 8 elétrons π, mas não é plano → não aromático.'));
  };
  inp.addEventListener('input', go);
  host.append(h('div', { class: 'controls' }, h('label', null, 'Elétrons π: ', inp), ...[2, 4, 6, 8, 10, 14].map((n) => h('button', { class: 'btn sm', type: 'button', onclick: () => { inp.value = n; go(); } }, String(n)))), out);
  go();
}

/* ===================================================================
 * Marcador de orbitais p
 * =================================================================== */
const PICK = ['cpH', 'cp', 'cicloheptatrieno', 'tropilio', 'cicloexadieno', 'pirrol', 'piridina', 'furano', 'ciclopropenilio', 'benzeno'];
export function pPicker(host) {
  let order = shuffle(PICK), k = 0;
  const box = h('div');
  const go = () => {
    const key = order[k % order.length], def = MOLS[key], G = geometry(def);
    const marked = new Set();
    const svg = ringSVG(def, { scale: 54, fs: 20, zoom: 1.4, lp: false });
    const C = svg._chem, g = sel2('g', { transform: C.transform }, svg);
    const out = h('div', { 'aria-live': 'polite' });
    const spots = C.atoms.slice(0, G.ringN).map((p, i) => {
      const c = sel2('circle', { cx: p.x, cy: p.y, r: 20, class: 'pk', tabindex: 0, role: 'button', 'aria-label': `átomo ${i + 1}` }, g);
      const f = () => { if (marked.has(i)) marked.delete(i); else marked.add(i); c.classList.toggle('on', marked.has(i)); };
      c.addEventListener('click', f); c.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); f(); } });
      return c;
    });
    const check = () => {
      const truth = G.atoms.slice(0, G.ringN).map((a) => a.hasP);
      let err = 0; truth.forEach((t, i) => { const m = marked.has(i); spots[i].classList.toggle('right', t === m); spots[i].classList.toggle('wrong', t !== m); if (t !== m) err++; });
      const all = truth.every(Boolean);
      out.replaceChildren(fb(err ? 'bad' : 'ok', (err ? `✘ ${err} átomo(s) marcado(s) incorretamente. ` : '✔ Correto! ') + (all ? 'Todos os átomos do anel têm orbital p: o caminho de sobreposição é <b>contínuo</b> em volta do anel.' : `Há átomo(s) sp³ sem orbital p (${truth.map((t, i) => (t ? null : i + 1)).filter(Boolean).join(', ')}): o ciclo de sobreposição é <b>interrompido</b> → não aromático.`) + ' ' + analyze(def).msgs.join(' ')));
    };
    clear(box).append(h('p', { class: 'prompt' }, `${def.name}: marque os átomos do anel que têm orbital p disponível (vazio, com 1 ou com 2 elétrons).`), h('div', { class: 'figs' }, svg), h('div', { class: 'ex-actions' }, h('button', { class: 'btn sm primary', type: 'button', onclick: check }, 'Conferir'), h('button', { class: 'btn sm', type: 'button', onclick: () => { k++; go(); } }, 'Próxima →')), out);
  };
  host.append(box); go();
}
void TYPES;
