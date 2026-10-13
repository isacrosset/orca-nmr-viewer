/*
 * modules.js — componentes interativos dos módulos 1–29.
 */
import { h, shuffle, seg, tgl } from './widgets2d.js';
import { M, CAT, REAL, USUAL } from './lib.js';
import { FG_INFO, FUNCTIONS, bondOrder } from './chem.js';
import { STEM, PRIO, PRIO_NAME, rankParents, whyBetter, cmpArr, nameMatches } from './namer.js';
import { decoy, draw, fig, pickable, nameHTML, explain, roles, view3d, vbox, cls, fgSet, funcList, ROLE_LEGEND, legend, FGCOL, hex, SUFX, PREFX, pickN, rnd } from './core.js';
import { exerciseCard, sortable } from './practice.js';
import { emb } from './core.js';
import { torsions, applyTorsions } from './embed3d.js';

const sel = (opts, cur, on, label) => { const s = h('select', { 'aria-label': label || 'escolha' }, opts.map(([v, t]) => h('option', { value: v }, t))); s.value = cur; s.addEventListener('change', () => on(s.value)); return s; };
const molOpts = (list) => list.map((s) => [s, M(s).name || M(s).usual || s]);
const fb = (cls0, html) => h('div', { class: 'fb ' + cls0, html });
const clear = (e) => { while (e.firstChild) e.removeChild(e.firstChild); return e; };

/* ===================================================================
 * 1. Início
 * =================================================================== */
export function hero(host) {
  const X = M('CC(=O)CC(C)(C)O');
  const v = vbox('tall');
  host.append(h('div', { class: 'herofig' }, h('figure', { class: 'fig big' }, draw(X, { color: 'roles', num: true, scale: 58, fs: 22, zoom: 1.6 }), h('figcaption', { html: nameHTML(X) })), ROLE_LEGEND()), v);
  requestAnimationFrame(() => { const V = view3d(v, X, { color: 'roles', spin: true, hint: false }); V.v.caption && V.v.caption('<b>4-hidroxi-4-metilpentan-2-ona</b> · cetona (principal), álcool (prefixo hidroxi-)'); });
}

/* ===================================================================
 * 2. Leitura de estruturas
 * =================================================================== */
const REPS = ['CCCCO', 'CC(O)C', 'CCC(=O)O', 'CC(C)CC', 'CC(=O)C', 'CCOCC', 'C=CCC'];
export function reps(host) {
  let smi = REPS[0], v3 = null;
  const grid = h('div', { class: 'repgrid' });
  const go = () => {
    clear(grid);
    const X = M(smi);
    const card = (t, body, k) => h('div', { class: 'repcard', style: `animation-delay:${k * 0.12}s` }, h('h5', null, t), body);
    const v = vbox('short');
    grid.append(
      card('Fórmula molecular', h('div', { class: 'bigf' }, X.formula), 0),
      card('Fórmula condensada', h('div', { class: 'bigf sm' }, X.cond || '—'), 1),
      card('Estrutural completa', draw(X, { full: true, scale: 34, fs: 15 }), 2),
      card('Esquelética (bastão)', draw(X, { scale: 42 }), 3),
      card('Modelo 3D', v, 4));
    requestAnimationFrame(() => { v3 = view3d(v, X, { hint: false }); });
    cap.innerHTML = `${nameHTML(X)} — <span class="muted">todas as representações descrevem a mesma conectividade: ${X.formula}.</span>`;
  };
  const cap = h('p', { class: 'cardlab' });
  const s = sel(molOpts(REPS), smi, (x) => { smi = x; go(); }, 'molécula');
  host.append(h('div', { class: 'controls' }, h('label', null, 'Molécula: ', s), h('button', { class: 'btn primary', type: 'button', onclick: () => { grid.classList.remove('anim'); void grid.offsetWidth; grid.classList.add('anim'); } }, 'Ver a mesma molécula em diferentes representações')), cap, grid);
  go();
  void v3;
}

const COUNT_LEVELS = [['CCCC', 'CCCCC', 'CC(C)C', 'CCC=C'], ['CC(C)CC', 'CCC(C)CC', 'CC(C)(C)C', 'C1CCCCC1', 'CCC(=O)C'], ['CCC(CC)CC(C)C', 'CC1CCCC1C', 'Cc1ccccc1', 'CC(C)CC(C)(C)C', 'CCOC(=O)CC'], ['CCCC(C(C)C)CCC', 'CC(C)C1CCC(C)CC1O', 'CC(C)Cc1ccc(cc1)C(C)C(=O)O', 'CCC(C)(C)C(C)C']];
export function countC(host) {
  let lvl = 0, k = 0, score = 0;
  const box = h('div', { class: 'cntbox' }), out = h('div'), stat = h('div', { class: 'ch-stats' });
  const inp = h('input', { type: 'number', min: 1, max: 30, 'aria-label': 'número de carbonos', style: 'width:90px' });
  const go = () => {
    const list = COUNT_LEVELS[lvl], smi = list[k % list.length], X = M(smi);
    clear(box).append(draw(X, { scale: 44 }));
    inp.value = ''; out.innerHTML = '';
    stat.innerHTML = `<div><b>${lvl + 1}</b><small>nível</small></div><div><b>${score}</b><small>acertos</small></div>`;
    check.onclick = () => {
      const n = X.m.atoms.filter((a) => a.el === 'C').length, ok = +inp.value === n;
      out.replaceChildren(fb(ok ? 'ok' : 'bad', ok ? `✔ Correto: ${n} carbonos. ${X.name ? 'Nome: ' + nameHTML(X) : ''}` : `✘ São <b>${n}</b> carbonos. Lembre-se: cada vértice e cada extremidade de linha é um carbono.`));
      clear(box).append(draw(X, { scale: 44, hl: Object.fromEntries(X.m.atoms.map((a, i) => [i, 'mc'])), lab: Object.fromEntries(X.m.atoms.map((a, i) => [i, a.el === 'C' ? 'C' : undefined]).filter((x) => x[1])) }));
      if (ok) { score++; if (score % 3 === 0 && lvl < COUNT_LEVELS.length - 1) lvl++; }
      stat.innerHTML = `<div><b>${lvl + 1}</b><small>nível</small></div><div><b>${score}</b><small>acertos</small></div>`;
    };
  };
  const check = h('button', { class: 'btn primary', type: 'button' }, 'Conferir');
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') check.click(); });
  host.append(stat, box, h('div', { class: 'controls' }, h('label', null, 'Quantos carbonos? ', inp), check, h('button', { class: 'btn', type: 'button', onclick: () => { k++; go(); } }, 'Próxima →')), out);
  go();
}

const CLICKC = ['CC(C)CC=O', 'CCOC(C)C', 'OCC(C)CN', 'CC(C)C(=O)OC', 'ClCC1CCCC1', 'CC(N)C(=O)O', 'COc1ccc(C=O)cc1'];
export function clickC(host) {
  let k = 0;
  const wrap = h('div', { class: 'pick' }), out = h('div');
  const go = () => {
    const X = M(CLICKC[k % CLICKC.length]), svg = draw(X, { scale: 50, fs: 19, zoom: 1.4 });
    const chosen = new Set();
    const P = pickable(svg, X.m.atoms.map((_, i) => i), (i, g) => { if (chosen.has(i)) { chosen.delete(i); g.classList.remove('on'); } else { chosen.add(i); g.classList.add('on'); } out.innerHTML = ''; });
    clear(wrap).append(svg);
    const isC = (i) => X.m.atoms[i].el === 'C';
    btns.replaceChildren(
      h('button', { class: 'btn primary', type: 'button', onclick: () => {
        P.clear(); let hit = 0, wrong = 0, miss = 0;
        X.m.atoms.forEach((_, i) => { if (chosen.has(i) && isC(i)) { P.set(i, 'ok'); hit++; } else if (chosen.has(i)) { P.set(i, 'bad'); wrong++; } else if (isC(i)) { P.set(i, 'miss'); miss++; } });
        const nC = hit + miss;
        out.replaceChildren(fb(!wrong && !miss ? 'ok' : 'bad', !wrong && !miss ? `✔ Todos os ${nC} carbonos encontrados!` : `${hit} de ${nC} carbonos encontrados${miss ? `; faltaram ${miss} (tracejados)` : ''}${wrong ? `; ${wrong} clique(s) em heteroátomo — O, N e halogênios são sempre escritos com seu símbolo` : ''}.`));
      } }, 'Conferir'),
      h('button', { class: 'btn', type: 'button', onclick: () => { P.clear(); X.m.atoms.forEach((a, i) => { if (a.el === 'C') P.set(i, 'ok'); }); out.replaceChildren(fb('neutral', `${X.m.atoms.filter((a) => a.el === 'C').length} carbonos · ${X.formula}`)); } }, 'Revelar'),
      h('button', { class: 'btn', type: 'button', onclick: () => { k++; go(); } }, 'Próxima (mais difícil) →'));
    out.innerHTML = '';
  };
  const btns = h('div', { class: 'ex-actions' });
  host.append(h('p', { class: 'prompt' }, 'Clique em todos os carbonos (vértices e extremidades).'), wrap, btns, out);
  go();
}

const IMPH = ['CC(C)CC(=O)O', 'C=CC(C)(C)C', 'CC#CCO', 'OC1CCCCC1', 'CC(C)NC'];
export function implicitH(host) {
  let smi = IMPH[0];
  const wrap = h('div', { class: 'pick' }), out = h('div', { class: 'readout', 'aria-live': 'polite' }, 'Clique em um carbono: a aplicação completa a tetravalência com os H implícitos.');
  let full = false;
  const go = () => {
    const X = M(smi), lab = {};
    const render = () => {
      const svg = draw(X, { scale: 52, fs: 19, zoom: 1.4, full, lab });
      clear(wrap).append(svg);
      if (full) return;
      pickable(svg, X.m.atoms.map((a, i) => i).filter((i) => X.m.atoms[i].el === 'C'), (i) => {
        const a = X.m.atoms[i], nb = X.m.nb[i], bonds = nb.reduce((s, x) => s + x.o, 0);
        lab[i] = 'C' + (a.h ? 'H' + (a.h > 1 ? a.h : '') : '');
        out.innerHTML = `<span>Ligações desenhadas: <b>${bonds}</b> (${nb.map((x) => ['', 'simples', 'dupla', 'tripla'][x.o]).join(', ')})</span><span>H implícitos: <b>${a.h}</b></span><span>Total: ${bonds} + ${a.h} = <b class="status-ok">4</b></span>`;
        render();
      });
    };
    Object.keys(lab).forEach((k) => delete lab[k]);
    render();
  };
  host.append(h('div', { class: 'controls' }, h('label', null, 'Molécula: ', sel(molOpts(IMPH), smi, (x) => { smi = x; go(); })), tgl('Mostrar todos os H (estrutural completa)', () => { full = !full; go(); return full; })), wrap, out);
  go();
}

/* ===================================================================
 * 3. Classificação de cadeias
 * =================================================================== */
export function classify(m) {
  const A = m.atoms, C = A.map((a, i) => i).filter((i) => A[i].el === 'C');
  const inRing = C.filter((i) => m.ringOf[i] >= 0);
  const forma = !inRing.length ? 'aberta' : inRing.length === C.length ? 'fechada' : 'mista';
  const cdeg = (i) => m.nb[i].filter(({ j }) => A[j].el === 'C').length;
  let disp;
  if (forma === 'aberta') disp = C.some((i) => cdeg(i) > 2) ? 'ramificada' : 'normal';
  else disp = C.some((i) => m.ringOf[i] >= 0 && m.nb[i].some(({ j }) => m.ringOf[j] < 0 && A[j].el !== 'H')) || forma === 'mista' ? 'ramificada' : 'normal';
  const sat = m.bonds.some((b) => A[b.a].el === 'C' && A[b.b].el === 'C' && (b.o > 1 || A[b.a].aromatic && A[b.b].aromatic)) ? 'insaturada' : 'saturada';
  const het = A.some((a, i) => a.el !== 'C' && m.nb[i].filter(({ j }) => A[j].el === 'C').length >= 2) ? 'heterogênea' : 'homogênea';
  return { forma, disp, sat, het };
}
const CLS_SET = ['CCCC', 'CC(C)CC', 'C=CCC', 'CCOCC', 'C1CCCCC1', 'CC1CCCCC1', 'c1ccccc1', 'CCNCC', 'CC(C)C=C', 'CCC(=O)OC', 'CCCO', 'Cc1ccccc1', 'C1CCOC1', 'CC#CC(C)C'];
export function chainClass(host) {
  let k = 0;
  const box = h('div'), out = h('div');
  const crit = [['forma', 'Forma', ['aberta', 'fechada', 'mista']], ['disp', 'Disposição', ['normal', 'ramificada']], ['sat', 'Ligações C–C', ['saturada', 'insaturada']], ['het', 'Natureza', ['homogênea', 'heterogênea']]];
  const go = () => {
    const X = M(CLS_SET[k % CLS_SET.length]), ans = classify(X.m);
    const sels = {};
    const grid = h('div', { class: 'qgrid' }, crit.map(([key, t, opts]) => { const s = h('select', { 'aria-label': t }, h('option', { value: '' }, '—'), opts.map((o) => h('option', { value: o }, o))); sels[key] = s; return h('label', null, t, s); }));
    clear(box).append(h('div', { class: 'figs' }, fig(X, X.name ? nameHTML(X) : '')), grid,
      h('div', { class: 'ex-actions' }, h('button', { class: 'btn primary', type: 'button', onclick: () => {
        let n = 0; crit.forEach(([key]) => { const ok = sels[key].value === ans[key]; sels[key].className = ok ? 'ok' : 'bad'; if (ok) n++; });
        const why = [];
        if (ans.het === 'heterogênea') why.push('há heteroátomo <b>entre</b> carbonos');
        else if (X.m.atoms.some((a) => a.el !== 'C')) why.push('o heteroátomo está fora da cadeia (na ponta), por isso ela é homogênea');
        if (ans.sat === 'insaturada') why.push('há ligação dupla/tripla (ou anel aromático) entre carbonos');
        if (ans.forma === 'mista') why.push('há anel e também carbonos fora do anel');
        out.replaceChildren(fb(n === 4 ? 'ok' : 'bad', `${n}/4 corretas. Resposta: ${ans.forma}, ${ans.disp}, ${ans.sat}, ${ans.het}.${why.length ? ' ' + why.join('; ') + '.' : ''}`));
      } }, 'Conferir'), h('button', { class: 'btn', type: 'button', onclick: () => { k++; go(); } }, 'Próxima →')));
    out.innerHTML = '';
  };
  host.append(box, out);
  go();
}

/* ===================================================================
 * 4. Representações (laboratório)
 * =================================================================== */
export function repLab(host) {
  const list = [...new Set([...CAT.alcanos.slice(0, 6), ...CAT.alcoois.slice(2, 8), ...CAT.cetonas.slice(0, 4), ...CAT.acidos.slice(1, 5), ...CAT.esteres.slice(1, 4), ...CAT.aminas.slice(0, 4), ...CAT.ciclicos.slice(3, 6), ...CAT.aromaticos.slice(0, 4)])];
  let smi = 'CC(C)CC(=O)O', mode = 'skel';
  const fig0 = h('div', { class: 'figs' }), info = h('div', { class: 'readout' }), v = vbox('short');
  let V = null;
  const go = () => {
    const X = M(smi);
    clear(fig0).append(h('figure', { class: 'fig' }, mode === 'skel' ? draw(X, { scale: 46 }) : mode === 'full' ? draw(X, { full: true, scale: 36, fs: 15 }) : h('div', { class: 'bigf' }, mode === 'cond' ? (X.cond || 'fórmula condensada não usual para anéis — use a esquelética') : X.formula)));
    info.innerHTML = `<span><b>Nome:</b> ${nameHTML(X)}</span><span><b>Fórmula:</b> ${X.formula}</span>${X.cond ? `<span><b>Condensada:</b> ${X.cond}</span>` : ''}`;
    clear(v); V = view3d(v, X, {});
  };
  host.append(h('div', { class: 'controls' }, h('label', null, 'Molécula: ', sel(molOpts(list), smi, (x) => { smi = x; go(); })), seg([['skel', 'Esquelética'], ['full', 'Completa'], ['cond', 'Condensada'], ['mol', 'Molecular']], mode, (k) => { mode = k; go(); }, 'representação')), h('div', { class: 'grid2' }, fig0, v), info);
  go();
  void V;
}

/* ===================================================================
 * 5. Funções orgânicas
 * =================================================================== */
export const FN_GROUPS = [
  ['Hidrocarbonetos', 'cyan', [['alcano', 'C–C apenas', 'CₙH₂ₙ₊₂', 'CCCC', 'ano'], ['alceno', 'C=C', 'CₙH₂ₙ', 'CC=CC', 'eno'], ['alcino', 'C≡C', 'CₙH₂ₙ₋₂', 'CC#CC', 'ino'], ['cicloalcano', 'anel saturado', 'CₙH₂ₙ', 'C1CCCCC1', 'ciclo…ano'], ['aromático', 'anel benzênico', 'Ar–', 'Cc1ccccc1', 'benzeno']]],
  ['Oxigenadas', 'magenta', [['álcool', 'R–OH (C sp³)', 'R–OH', 'CCCO', 'ol'], ['fenol', 'Ar–OH', 'Ar–OH', 'Oc1ccccc1', 'fenol'], ['éter', 'R–O–R′', 'R–O–R′', 'CCOC', 'alcóxi…ano'], ['aldeído', 'R–CHO', 'R–CHO', 'CCC=O', 'al'], ['cetona', 'R–CO–R′', 'R–CO–R′', 'CCC(C)=O', 'ona'], ['ácido carboxílico', 'R–COOH', 'R–COOH', 'CCC(=O)O', 'ácido …oico'], ['éster', 'R–COO–R′', 'R–COO–R′', 'CC(=O)OCC', '…oato de …ila']]],
  ['Nitrogenadas', 'green', [['amina', '–NH₂, –NHR, –NR₂', 'R–NH₂', 'CCCN', 'amina'], ['amida', 'R–CO–NH₂', 'R–CONH₂', 'CCC(N)=O', 'amida'], ['nitrila', 'R–C≡N', 'R–CN', 'CCC#N', 'nitrila'], ['nitrocomposto', 'R–NO₂', 'R–NO₂', 'CCC[N+](=O)[O-]', 'nitro- (prefixo)']]],
  ['Halogenadas', 'orange', [['haleto orgânico', 'R–X (X = F, Cl, Br, I)', 'R–X', 'CCCCl', 'halo- (prefixo)']]],
];
export function fnMap(host) {
  const det = h('div', { class: 'fndet', 'aria-live': 'polite' });
  let V = null;
  const open = (row, color) => {
    const [n, g, gen, smi, suf] = row, X = M(smi);
    const v = vbox('short');
    clear(det).append(h('div', { class: 'chcard', style: `border-color:var(--${color})` },
      h('h4', { style: `color:var(--${color})` }, n),
      h('div', { class: 'grid2' }, h('div', null, h('p', { html: `<b>Grupo funcional:</b> ${g}<br><b>Estrutura geral:</b> ${gen}<br><b>Terminação/prefixo:</b> <span class="p-suf">${suf}</span><br><b>Exemplo:</b> ${nameHTML(X)}${X.usual && !X.usual.startsWith(X.name) ? ' <small class="muted">· ' + X.usual + '</small>' : ''}` }), draw(X, { color: 'fg', scale: 42 })), v)));
    if (V) V.v.dispose();
    V = view3d(v, X, { color: 'fg', hint: false });
    det.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };
  host.append(h('div', { class: 'fnmap' }, FN_GROUPS.map(([t, color, rows]) => h('div', { class: 'fncol' },
    h('div', { class: 'fnhead', style: `color:var(--${color});border-color:var(--${color})` }, t),
    rows.map((row) => h('button', { class: 'fnbtn', type: 'button', onclick: () => open(row, color) }, draw(row[3], { color: 'fg', scale: 26, fs: 13 }), h('b', null, row[0]), h('small', null, row[1])))))), det);
}

const FN_CHOICES = ['alcano', 'alceno', 'alcino', 'aromático', 'haleto', 'álcool', 'fenol', 'éter', 'aldeído', 'cetona', 'ácido carboxílico', 'éster', 'amina', 'amida', 'nitrila', 'nitrocomposto'];
export function fnOf(X) {
  const t = X.fgs.map((f) => f.type);
  const pick = ['acido', 'ester', 'amida', 'nitrila', 'aldeido', 'cetona', 'fenol', 'alcool', 'amina', 'eter', 'nitro', 'haleto'].find((x) => t.includes(x));
  if (pick) return { acido: 'ácido carboxílico', ester: 'éster', amida: 'amida', nitrila: 'nitrila', aldeido: 'aldeído', cetona: 'cetona', fenol: 'fenol', alcool: 'álcool', amina: 'amina', eter: 'éter', nitro: 'nitrocomposto', haleto: 'haleto' }[pick];
  if (t.includes('alcino')) return 'alcino'; if (t.includes('alceno')) return 'alceno'; if (t.includes('aromatico')) return 'aromático';
  return 'alcano';
}
const SINGLE = ['CCCC', 'CC(C)CC', 'CC=CC', 'C=CC(C)C', 'CC#CC', 'C#CCC', 'Cc1ccccc1', 'CCCCl', 'CC(Br)C', 'CCO', 'CC(O)C', 'Oc1ccccc1', 'Cc1ccc(O)cc1', 'CCOCC', 'COC(C)C', 'CCC=O', 'CC(C)C=O', 'CC(=O)CC', 'CCC(=O)CC', 'CCC(=O)O', 'CC(C)C(=O)O', 'CC(=O)OC', 'CCC(=O)OCC', 'CCN', 'CNC', 'CCN(C)C', 'CC(N)=O', 'CC(=O)NC', 'CCC#N', 'CC#N', 'CCC[N+](=O)[O-]', 'C1CCCCC1'];
export function patternMatch(host) {
  const pool = shuffle(SINGLE.filter((s) => fnOf(M(s)) !== 'alcano')).slice(0, 8);
  const rows = pool.map((s) => { const X = M(s), a = fnOf(X); const se = h('select', { 'aria-label': 'função' }, h('option', { value: '' }, 'função…'), FN_CHOICES.map((c) => h('option', { value: c }, c))); return { X, a, se, card: h('div', { class: 'pmcard' }, draw(X, { scale: 32, fs: 15 }), se) }; });
  const out = h('div');
  host.append(h('div', { class: 'pmgrid' }, rows.map((r) => r.card)), h('div', { class: 'ex-actions' },
    h('button', { class: 'btn primary', type: 'button', onclick: () => { let n = 0; rows.forEach((r) => { const ok = r.se.value === r.a; r.card.classList.toggle('ok', ok); r.card.classList.toggle('bad', !ok); if (ok) n++; }); out.replaceChildren(fb(n === rows.length ? 'ok' : 'bad', `${n} de ${rows.length} corretas.`)); } }, 'Conferir'),
    h('button', { class: 'btn', type: 'button', onclick: () => { rows.forEach((r) => { r.se.value = r.a; r.card.classList.add('ok'); r.card.classList.remove('bad'); clear(r.card).append(draw(r.X, { color: 'fg', scale: 32, fs: 15 }), r.se); }); } }, 'Ver resposta'),
    h('button', { class: 'btn', type: 'button', onclick: () => { clear(host); patternMatch(host); } }, 'Novas estruturas')), out);
}

/* clique na função: cada clique revela a função do átomo */
export function findFunctions(host, list, o = {}) {
  let k = 0;
  const wrap = h('div', { class: 'pick' }), out = h('div', { 'aria-live': 'polite' }), info = h('p', { class: 'prompt' }), lg = h('div');
  const go = () => {
    const item = list[k % list.length], X = M(item.s || item);
    const groups = X.fgs.filter((f) => FUNCTIONS.includes(f.type) || f.type === 'aromatico' || f.type === 'alceno' || f.type === 'alcino');
    const found = new Set();
    const only = [];
    const redraw = () => {
      const svg = draw(X, { color: 'fg', only: only.length ? only.map((g) => g.type) : ['__none'], scale: 46, fs: 18, zoom: 1.3 });
      clear(wrap).append(svg);
      pickable(svg, X.m.atoms.map((_, i) => i), (i) => {
        const g = groups.find((f) => FUNCTIONS.includes(f.type) && fgSet(f).has(i) && (X.m.atoms[i].el !== 'C' || f.site === i)) || groups.find((f) => fgSet(f).has(i));
        if (!g) { out.replaceChildren(fb('neutral', 'Esse carbono faz parte do esqueleto hidrocarbônico, não de um grupo funcional.')); return; }
        const idx = groups.indexOf(g);
        if (!found.has(idx)) { found.add(idx); only.push(g); }
        out.replaceChildren(fb('ok', `✔ <b>${FG_INFO[g.type].n}</b> (${FG_INFO[g.type].g}). Encontradas: ${found.size}/${groups.length}.` + (found.size === groups.length ? ' <b>Todas as funções foram encontradas!</b>' : '')));
        redraw();
      });
      lg.replaceChildren(legend(only.map((g) => [hex(FGCOL[g.type]), FG_INFO[g.type].n])));
    };
    info.innerHTML = (item.n ? `<b>${item.n}</b> <span class="muted">(${item.d})</span> — ` : '') + `Clique nos grupos funcionais. Há <b>${groups.length}</b> grupo(s) a encontrar.`;
    out.innerHTML = '';
    redraw();
    btns.replaceChildren(h('button', { class: 'btn', type: 'button', onclick: () => { groups.forEach((g, i2) => { if (!found.has(i2)) { found.add(i2); only.push(g); } }); redraw(); out.replaceChildren(fb('neutral', 'Funções: ' + [...new Set(groups.map((g) => FG_INFO[g.type].n))].join(', ') + (X.name ? `. Nome sistemático: ${nameHTML(X)}` : item.n ? '. (Nome usual — o sistemático está além do escopo deste curso.)' : ''))); } }, 'Revelar todas'), h('button', { class: 'btn primary', type: 'button', onclick: () => { k++; go(); } }, o.next || 'Próxima molécula →'));
  };
  const btns = h('div', { class: 'ex-actions' });
  host.append(info, wrap, lg, btns, out);
  go();
}
export const clickFG = (host) => findFunctions(host, ['CC(O)CC(=O)O', 'NCCC(=O)OC', 'CC(=O)CCCl', 'OCC(N)C=O', 'COc1ccc(C=O)cc1', 'CC(=O)NC(C)C(=O)O', 'CC#CC(O)C']);
export const realFind = (host) => findFunctions(host, REAL, { next: 'Próxima molécula real →' });

export function multiFG(host) {
  const list = ['CC(O)C(=O)O', 'NC(CO)C(=O)O', 'OC(=O)CC(O)C(=O)O', 'CC(=O)CC(C)(C)O', 'COc1cc(C=O)ccc1O', 'CC(=O)Nc1ccc(O)cc1', 'NCCc1ccc(O)c(O)c1', 'CCOC(=O)c1ccc(N)cc1'];
  let smi = list[0];
  const box = h('div'), chips = h('div', { class: 'chips' });
  const go = () => {
    const X = M(smi), types = [...new Set(X.fgs.map((f) => f.type).filter((t) => FUNCTIONS.includes(t)))];
    const on = new Set(types);
    const render = () => {
      clear(box).append(h('div', { class: 'figs' }, h('figure', { class: 'fig' }, draw(X, { color: 'fg', only: [...on], scale: 48, fs: 18, zoom: 1.35 }), h('figcaption', { html: X.name ? nameHTML(X) : (REAL.find((r) => r.s === smi) || {}).n || '' }))));
      const pr = PRIO.find((p) => types.map(cls).includes(p));
      box.append(h('p', { class: 'cardlab', html: pr ? `Função principal (sufixo): <b class="p-suf">${PRIO_NAME[pr]}</b> — as demais aparecem como prefixos.` : '' }));
    };
    clear(chips).append(...types.map((t) => h('button', { class: 'btn sm', type: 'button', 'aria-pressed': 'true', style: `border-color:${hex(FGCOL[t])};color:${hex(FGCOL[t])}`, onclick: (e) => { if (on.has(t)) on.delete(t); else on.add(t); e.currentTarget.setAttribute('aria-pressed', on.has(t)); render(); } }, '■ ' + FG_INFO[t].n)));
    render();
  };
  host.append(h('div', { class: 'controls' }, h('label', null, 'Molécula: ', sel(list.map((s) => [s, M(s).name || (REAL.find((r) => r.s === s) || {}).n || s]), smi, (x) => { smi = x; go(); }))), chips, box);
  go();
}

export function rapidFn(host, o = {}) {
  let streak = 0, best = 0, n = 0, ok = 0, cur = null;
  const stat = h('div', { class: 'ch-stats' }), card = h('div', { class: 'ch-card' }), ans = h('div', { class: 'ch-answers' }), out = h('div', { 'aria-live': 'polite' });
  const upd = () => { stat.innerHTML = `<div><b>${ok}/${n}</b><small>acertos</small></div><div><b>${streak}</b><small>sequência</small></div><div><b>${best}</b><small>recorde</small></div>`; };
  const next = () => {
    let s; do { s = rnd(SINGLE); } while (s === cur);
    cur = s; const X = M(s), a = fnOf(X);
    const opts = shuffle([a, ...pickN(FN_CHOICES.filter((c) => c !== a), 3)]);
    clear(card).append(draw(X, { scale: 46, fs: 18 }));
    clear(ans).append(...opts.map((t) => h('button', { class: 'btn', type: 'button', onclick: (e) => {
      n++; const good = t === a;
      if (good) { ok++; streak++; best = Math.max(best, streak); } else streak = 0;
      [...ans.children].forEach((b) => { b.disabled = true; if (b.textContent === a) b.classList.add('primary'); });
      if (!good) e.currentTarget.classList.add('ghost');
      clear(card).append(draw(X, { color: 'fg', scale: 46, fs: 18 }));
      out.replaceChildren(fb(good ? 'ok' : 'bad', (good ? '✔ ' : `✘ É <b>${a}</b>. `) + (X.name ? 'Nome: ' + nameHTML(X) : '')));
      upd(); setTimeout(() => { if (host.isConnected) next(); }, good ? 1100 : 2400);
    } }, t)));
    out.innerHTML = '';
  };
  host.append(stat, card, ans, out);
  upd(); next();
  void o;
}

const COMPARE = {
  'alcool-fenol': [['CCO', 'álcool', 'OH ligado a carbono <b>sp³</b> (saturado).'], ['Oc1ccccc1', 'fenol', 'OH ligado <b>diretamente</b> ao anel aromático.'], 'Em <i>fenilmetanol</i> (C₆H₅CH₂OH) o OH está num CH₂ — é álcool, não fenol!', 'OCc1ccccc1'],
  'aldeido-cetona': [['CCC=O', 'aldeído', 'C=O na <b>ponta</b> da cadeia (C ligado a H).'], ['CC(=O)C', 'cetona', 'C=O no <b>meio</b>: o C da carbonila está ligado a dois carbonos.'], 'Aldeído: CHO sempre é C1, por isso o localizador do “-al” é omitido.', null],
  'acido-ester': [['CC(=O)O', 'ácido carboxílico', '–COOH: H ligado ao O.'], ['CC(=O)OC', 'éster', '–COO–R′: no lugar do H há um grupo alquila.'], 'Ácido etanoico × etanoato de metila: troque o H do OH por R′.', null],
  'amina-amida': [['CCN', 'amina', 'N ligado só a C sp³ / H.'], ['CC(N)=O', 'amida', 'N ligado a uma <b>carbonila</b> (C=O).'], 'Se o N está ligado ao C=O, é amida — mesmo que tenha grupos alquila no N.', null],
  'nitrila-alcino': [['CCC#N', 'nitrila', 'Ligação tripla C≡<b>N</b> (termina no N).'], ['CC#CC', 'alcino', 'Ligação tripla C≡<b>C</b>.'], 'Ambas têm ligação tripla e geometria linear; observe o átomo da ponta.', null],
};
export function compareFn(host, key) {
  const keys = key ? [key] : Object.keys(COMPARE);
  let cur = keys[0];
  const box = h('div');
  const go = () => {
    const [a, b, note, extra] = COMPARE[cur];
    clear(box).append(h('div', { class: 'cmp2' }, [a, b].map(([s, t, d]) => h('div', { class: 'chcard' }, h('h4', null, t), h('div', { class: 'figs' }, draw(s, { color: 'fg', scale: 44 })), h('p', { class: 'cardlab', html: nameHTML(s) + (M(s).usual && !M(s).usual.startsWith(M(s).name) ? ` <small class="muted">· ${M(s).usual}</small>` : '') }), h('p', { html: d })))),
      ...[h('div', { class: 'note care', html: '<b class="t">Cuidado</b>' + note }), extra ? h('div', { class: 'figs' }, fig(extra, nameHTML(extra) + ' — álcool', { color: 'fg' })) : null].filter(Boolean));
  };
  if (keys.length > 1) host.append(seg(keys.map((k) => [k, k.replace('-', ' × ').replace('alcool', 'álcool').replace('aldeido', 'aldeído').replace('acido', 'ácido').replace('ester', 'éster')]), cur, (k) => { cur = k; go(); }, 'comparação'));
  host.append(box);
  go();
}

/* ===================================================================
 * 6. Regras gerais: partes do nome e prefixos de contagem
 * =================================================================== */
const ANAT = ['CC(O)C(C)CC', 'C=CC(C)CC', 'CC(C)CC(=O)O', 'CCC(=O)CC(C)C', 'CC#CC(C)C', 'ClCC(C)CC=O'];
export function anatomy(host) {
  let smi = ANAT[0];
  const box = h('div');
  const go = () => {
    const X = M(smi), r = X.r;
    const pre = r.parts.prefixes.join('-');
    const n = r.parent.P.length;
    clear(box).append(h('div', { class: 'grid2' },
      h('div', { class: 'figs' }, fig(X, null, { color: 'roles', num: true, scale: 48 })),
      h('div', null,
        h('div', { class: 'bigname', html: nameHTML(X) }),
        h('table', { class: 'anat' }, h('tbody', null,
          h('tr', null, h('th', { class: 'p-pre' }, 'Prefixos'), h('td', { html: pre ? `<b>${pre}</b> — substituintes com localizadores, em ordem alfabética` : '— (sem substituintes)' })),
          h('tr', null, h('th', { class: 'p-stem' }, 'Cadeia'), h('td', { html: `<b>${STEM[n]}</b> — ${n} carbonos na cadeia principal` })),
          h('tr', null, h('th', { class: 'p-inf' }, 'Insaturação'), h('td', { html: `<b>${r.parent.ml.length ? (r.parent.dl.length ? 'en' : '') + (r.parent.tl.length ? 'in' : '') : 'an'}</b> — ${r.parent.ml.length ? 'ligação ' + (r.parent.dl.length ? 'dupla' : 'tripla') + ' em ' + r.parent.ml.join(',') : 'só ligações simples'}` })),
          h('tr', null, h('th', { class: 'p-suf' }, 'Sufixo'), h('td', { html: r.princType ? `<b>${SUFX[r.princType]}</b> — função principal: ${PRIO_NAME[r.princType]}` : '<b>o</b> — hidrocarboneto' })))))));
  };
  host.append(h('div', { class: 'controls' }, h('label', null, 'Exemplo: ', sel(molOpts(ANAT), smi, (x) => { smi = x; go(); }))), box, ROLE_LEGEND());
  go();
}

const ALK = ['C', 'CC', 'CCC', 'CCCC', 'CCCCC', 'CCCCCC', 'CCCCCCC', 'CCCCCCCC', 'CCCCCCCCC', 'CCCCCCCCCC'];
export function prefixTable(host) {
  let n = 4;
  const box = h('div'), rng = h('input', { type: 'range', min: 1, max: 10, value: n, 'aria-label': 'número de carbonos' });
  const tbl = h('div', { class: 'ptab' }, ALK.map((s, i) => h('button', { type: 'button', class: 'pcell', 'data-n': i + 1, onclick: () => { n = i + 1; rng.value = n; go(); } }, h('b', null, String(i + 1)), h('span', null, STEM[i + 1]))));
  const go = () => {
    [...tbl.children].forEach((b) => b.classList.toggle('on', +b.dataset.n === n));
    const X = M(ALK[n - 1]);
    clear(box).append(h('div', { class: 'figs' }, h('figure', { class: 'fig' }, draw(X, { scale: 40, num: true, color: 'chain', lab: n === 1 ? { 0: 'CH₄' } : undefined }), h('figcaption', { html: `${n} C → <b class="p-stem">${STEM[n]}</b> · ${nameHTML(X)} · ${X.formula}` }))));
  };
  rng.addEventListener('input', () => { n = +rng.value; go(); });
  host.append(tbl, h('div', { class: 'range-row' }, h('span', null, 'nº de C'), rng), box);
  go();
  // mini-quiz
  const q = h('div', { class: 'chcard', style: 'margin-top:12px' }), qo = h('div');
  const ask = () => {
    const k = 2 + Math.floor(Math.random() * 9), X = M(ALK[k - 1]);
    const opts = shuffle([k, ...pickN([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter((x) => x !== k), 3)]);
    clear(q).append(h('h4', null, 'Teste: qual é o prefixo desta cadeia?'), draw(X, { scale: 34 }), h('div', { class: 'ch-answers' }, opts.map((o) => h('button', { class: 'btn', type: 'button', onclick: () => { qo.replaceChildren(fb(o === k ? 'ok' : 'bad', o === k ? `✔ ${k} C → ${STEM[k]}.` : `✘ Conte de novo: são ${k} carbonos → <b>${STEM[k]}</b>.`)); setTimeout(() => { if (host.isConnected) { qo.innerHTML = ''; ask(); } }, 1600); } }, STEM[o]))), qo);
  };
  host.append(q); ask();
}

export function partsQuiz(host) {
  const list = ['CC(O)C(C)CC', 'C=CC(C)CC', 'CCC(C)CC(=O)C', 'CC#CCC(C)C', 'CC(C)C(Cl)CC=O', 'NCC(C)CC'];
  const out = h('div');
  const opts = [['p-pre', 'prefixo (substituinte)'], ['p-stem', 'cadeia principal'], ['p-inf', 'insaturação'], ['p-suf', 'sufixo (função)']];
  const rows = [];
  list.forEach((s) => {
    const X = M(s);
    const parts = splitPieces(X);
    rows.push(h('div', { class: 'pqrow' }, h('div', { class: 'pqname' }, X.name), h('div', { class: 'pqparts' }, parts.map((p) => { const se = h('select', { 'aria-label': 'parte ' + p.t }, h('option', { value: '' }, '?'), opts.map(([v, t]) => h('option', { value: v }, t))); se._a = p.c; return h('label', { class: 'pqp' }, h('code', null, p.t), se); }))));
  });
  host.append(...rows, h('div', { class: 'ex-actions' }, h('button', { class: 'btn primary', type: 'button', onclick: () => { let n = 0, t = 0; host.querySelectorAll('.pqp select').forEach((s) => { t++; const ok = s.value === s._a; s.className = ok ? 'ok' : 'bad'; if (ok) n++; }); out.replaceChildren(fb(n === t ? 'ok' : 'bad', `${n} de ${t} partes corretas.`)); } }, 'Conferir'), h('button', { class: 'btn', type: 'button', onclick: () => { host.querySelectorAll('.pqp select').forEach((s) => { s.value = s._a; s.className = 'ok'; }); } }, 'Ver resposta')), out);
}
import { splitName } from './core.js';
function splitPieces(X) {
  // divide prefixos em cada substituinte e separa localizadores do sufixo
  const out = [];
  splitName(X).forEach((p) => {
    if (p.c === 'p-pre') p.t.replace(/-$/, '').split(/-(?=\d)/).forEach((x) => out.push({ t: x, c: 'p-pre' }));
    else if (p.t.trim()) out.push({ t: p.t, c: p.c });
  });
  return out;
}

/* ===================================================================
 * 7. Cadeia principal — simulador
 * =================================================================== */
const MAINCH = ['CCC(CC)CC(C)C', 'CC(C)C(CC)CCC', 'CCCC(C(C)C)CCC', 'OCC(CCC)CCCC', 'C=CC(CC)CCC', 'CC(CC)C(C)CC(C)C', 'CCCC(CC(C)=O)CCC', 'CC(C)CC(C=O)CC', 'CCC(CC)C(CC)C(=O)O'];
export function chainSim(host) {
  let k = 0;
  const wrap = h('div', { class: 'pick' }), out = h('div', { 'aria-live': 'polite' }), info = h('div', { class: 'readout' });
  const go = () => {
    const X = M(MAINCH[k % MAINCH.length]), m = X.m, best = rankParents(m)[0];
    const chosen = [];
    const render = (showBest) => {
      const bondCls = {};
      const path = showBest ? best.P : chosen;
      for (let i = 0; i < path.length; i++) for (let j = i + 1; j < path.length; j++) if (bondOrder(m, path[i], path[j])) bondCls[Math.min(path[i], path[j]) + '-' + Math.max(path[i], path[j])] = 'mc';
      const svg = draw(X, { scale: 50, fs: 19, zoom: 1.4, bondCls, num: showBest ? true : undefined, color: showBest ? 'roles' : null, P2: showBest ? null : decoy(X) });
      clear(wrap).append(svg);
      const P = pickable(svg, m.atoms.map((_, i) => i).filter((i) => m.atoms[i].el === 'C'), (i) => {
        const p = chosen.indexOf(i); if (p >= 0) chosen.splice(p, 1); else chosen.push(i);
        out.innerHTML = ''; render(false);
      });
      (showBest ? best.P : chosen).forEach((i) => P.set(i, showBest ? 'ok' : 'on'));
      info.innerHTML = `<span>Carbonos selecionados: <b>${chosen.length}</b></span><span class="muted">Clique nos carbonos da cadeia principal (clique de novo para desmarcar).</span>`;
    };
    render(false);
    btns.replaceChildren(
      h('button', { class: 'btn primary', type: 'button', onclick: () => out.replaceChildren(judgeChain(X, chosen, best)) }, 'Conferir'),
      h('button', { class: 'btn', type: 'button', onclick: () => { chosen.length = 0; out.innerHTML = ''; render(false); } }, 'Limpar'),
      h('button', { class: 'btn', type: 'button', onclick: () => { render(true); out.replaceChildren(fb('neutral', `Cadeia principal: <b>${best.P.length} C</b> → ${nameHTML(X)}.<br>${explain(X).slice(0, 3).join('<br>')}`)); } }, 'Mostrar resposta'),
      h('button', { class: 'btn', type: 'button', onclick: () => { k++; go(); } }, 'Próxima →'));
    out.innerHTML = '';
  };
  const btns = h('div', { class: 'ex-actions' });
  host.append(wrap, info, btns, out, ROLE_LEGEND());
  go();
}
export function judgeChain(X, chosen, best) {
  const m = X.m, set = new Set(chosen);
  if (!chosen.length) return fb('neutral', 'Selecione os carbonos da cadeia.');
  // contínua e sem ramificação?
  const deg = chosen.map((i) => m.nb[i].filter(({ j }) => set.has(j)).length);
  const ends = deg.filter((d) => d === 1).length;
  const seen = new Set([chosen[0]]), st = [chosen[0]];
  while (st.length) { const x = st.pop(); m.nb[x].forEach(({ j }) => { if (set.has(j) && !seen.has(j)) { seen.add(j); st.push(j); } }); }
  if (seen.size !== set.size) return fb('bad', '✘ Os carbonos escolhidos não estão todos conectados: a cadeia principal é uma sequência contínua.');
  if (chosen.length > 1 && (deg.some((d) => d > 2) || ends !== 2)) return fb('bad', '✘ A seleção tem ramificação. A cadeia principal é um caminho linear: cada carbono ligado a no máximo dois outros da cadeia.');
  const bestSet = new Set(best.P);
  if (set.size === bestSet.size && [...set].every((x) => bestSet.has(x))) return fb('ok', `✔ Cadeia correta: ${set.size} carbonos (${STEM[set.size]}). Nome: ${nameHTML(X)}`);
  const ev = rankParents(m).find((e) => e.P.length === set.size && e.P.every((x) => set.has(x)));
  if (!ev) {
    const pc = X.fgs.filter((f) => cls(f.type) === X.r.princType).map((f) => f.site).filter((c) => m.atoms[c].el === 'C');
    if (pc.length && !pc.some((c) => set.has(c)) && X.r.princType !== 'amina') return fb('bad', '✘ A cadeia principal deve conter o carbono do grupo funcional principal.');
    if (set.size < best.P.length) return fb('bad', `✘ Existe uma cadeia principal com ${best.P.length} carbonos — a sua tem ${set.size}. Procure caminhos que passem pelos ramos.`);
    return fb('bad', '✘ Essa sequência não pode ser a cadeia principal: ela deixaria de fora grupos que precisam estar nela.');
  }
  const w = whyBetter(best, ev);
  const extra = { nPrinc: ' A cadeia principal deve conter o carbono do grupo funcional principal.', len: ` Existe uma cadeia com ${best.P.length} carbonos — a sua tem ${set.size}.`, nml: ' A cadeia principal deve incluir a ligação dupla/tripla.', nsub: ' Entre cadeias de mesmo tamanho, escolha a que tem mais substituintes (mais ramificada).' }[w && w.key] || '';
  return fb('bad', `✘ Quase. A cadeia correta ${w ? w.txt : 'é outra'}.${extra} <b>A maior cadeia nem sempre é a principal</b>: primeiro vêm o grupo principal (e, para cadeias de mesmo tamanho, as insaturações).`);
}

/* ===================================================================
 * 8. Numeração — animação e comparação termo a termo
 * =================================================================== */
const NUMS = ['CC(C)CC(C)C(C)C', 'CCC(C)CC(C)(C)C', 'CC(C)CCCCC(C)C(C)CC', 'CC(O)CC(C)C', 'C=CCC(C)C', 'CC(Cl)CC(C)CC', 'CCC(C)C(CC)CC(C)C', 'CC(C)C#CC'];
export function numberAnim(host) {
  let smi = NUMS[0], timers = [];
  const box = h('div'), out = h('div');
  const go = () => {
    timers.forEach(clearTimeout); timers = [];
    const X = M(smi), m = X.m, all = rankParents(m), best = all[0];
    const rev = all.find((e) => e.P.length === best.P.length && e.P.every((x, i) => x === best.P[best.P.length - 1 - i])) || best;
    const panel = (ev, t) => {
      const num = {}, fig0 = h('div', { class: 'figs' });
      const card = h('div', { class: 'chcard' }, h('h4', null, t), fig0, h('div', { class: 'locs', html: locSets(ev) }));
      const step = (k) => { ev.P.slice(0, k).forEach((a, i) => { num[a] = i + 1; }); clear(fig0).append(draw(X, { scale: 40, num, color: 'chain' })); };
      step(0);
      ev.P.forEach((_, i) => timers.push(setTimeout(() => step(i + 1), 350 * (i + 1))));
      return card;
    };
    const A = panel(best === rev ? best : orderLR(best, rev)[0], '→ Sentido 1'), B = panel(orderLR(best, rev)[1], '← Sentido 2');
    clear(box).append(h('div', { class: 'cmp2' }, A, B));
    const w = whyBetter(best, rev);
    timers.push(setTimeout(() => out.replaceChildren(fb('ok', w ? `<b>Vence a numeração que ${w.txt}.</b> Compare termo a termo: ${cmpTxt(best, rev, w.key)}. Nome: ${nameHTML(X)}` : `As duas numerações são equivalentes. Nome: ${nameHTML(X)}`)), 350 * (best.P.length + 1)));
    out.innerHTML = '';
  };
  host.append(h('div', { class: 'controls' }, h('label', null, 'Molécula: ', sel(molOpts(NUMS), smi, (x) => { smi = x; go(); })), h('button', { class: 'btn primary', type: 'button', onclick: () => go() }, '▶ Animar numeração')), box, out);
  go();
}
function orderLR(a, b) { return [a, b]; }
function locSets(e) {
  const rows = [];
  if (e.pl.length) rows.push(`grupo principal: <b>{${e.pl.join(', ')}}</b>`);
  if (e.ml.length) rows.push(`ligações múltiplas: <b>{${e.ml.join(', ')}}</b>`);
  if (e.sl.length) rows.push(`substituintes: <b>{${e.sl.join(', ')}}</b>`);
  return rows.join('<br>') || '—';
}
function cmpTxt(a, b, key) {
  const k = { pl: 'pl', ml: 'ml', dl: 'dl', sl: 'sl', al: 'al' }[key];
  if (!k) return '';
  const x = a[k], y = b[k];
  let i = 0; while (i < x.length && x[i] === y[i]) i++;
  return `{${x.join(', ')}} × {${y.join(', ')}} — primeiro ponto de diferença: ${x[i]} &lt; ${y[i]}` + (k === 'sl' && x.reduce((s, v) => s + v, 0) > y.reduce((s, v) => s + v, 0) ? ' (mesmo com soma maior! Não se usa a soma)' : '');
}
export function directionEx(host) {
  const list = ['CC(C)CC(C)C(C)C', 'CCC(C)CC(C)(C)C', 'CC(O)CC(C)C', 'C=CCC(C)C', 'CC(Br)CCC(C)C'];
  list.forEach((s, i) => {
    const X = M(s), best = rankParents(X.m)[0];
    const rev = rankParents(X.m).find((e) => e.P.length === best.P.length && e.P.every((x, q) => x === best.P[best.P.length - 1 - q]));
    const leftFirst = X.P2[best.P[0]][0] <= X.P2[best.P[best.P.length - 1]][0];
    const w = whyBetter(best, rev);
    host.append(exerciseCard({ title: 'Escolha o sentido da numeração', type: 'mc', q: 'Em que sentido a cadeia principal deve ser numerada? Justifique pela regra.', fig: { node: () => h('div', { class: 'figs' }, draw(X, { color: 'chain', scale: 40 })) }, o: [`da esquerda para a direita (${locSets(leftFirst ? best : rev).replace(/<br>/g, '; ')})`, `da direita para a esquerda (${locSets(leftFirst ? rev : best).replace(/<br>/g, '; ')})`], a: leftFirst ? 0 : 1, e: `A numeração correta ${w ? w.txt : ''}. Nome: ${nameHTML(X)}.` }, 'N' + (i + 1)));
  });
}

/* ===================================================================
 * 9. Substituintes
 * =================================================================== */
const ALKYLS = [['metil', 'CI', '–CH₃'], ['etil', 'CCI', '–CH₂CH₃'], ['propil', 'CCCI', '–CH₂CH₂CH₃'], ['propan-2-il (isopropil)', 'CC(C)I', '–CH(CH₃)₂'], ['butil', 'CCCCI', '–CH₂(CH₂)₂CH₃'], ['butan-2-il (sec-butil)', 'CCC(C)I', '–CH(CH₃)CH₂CH₃'], ['2-metilpropil (isobutil)', 'CC(C)CI', '–CH₂CH(CH₃)₂'], ['terc-butil', 'CC(C)(C)I', '–C(CH₃)₃'], ['fenil', 'Ic1ccccc1', '–C₆H₅'], ['ciclo-hexil', 'IC1CCCCC1', '–C₆H₁₁']];
export function alkylCards(host) {
  host.append(h('div', { class: 'alkgrid' }, ALKYLS.map(([n, s, f]) => {
    const X = M(s), iI = X.m.atoms.findIndex((a) => a.el === 'I'), at = X.m.nb[iI][0].j;
    const bc = {}; X.m.bonds.forEach((b) => { if (b.a !== iI && b.b !== iI) bc[Math.min(b.a, b.b) + '-' + Math.max(b.a, b.b)] = 'sub'; });
    return h('div', { class: 'alkcard' }, drawSVGlab(X, iI, at, bc), h('b', { class: 'p-pre' }, n), h('small', null, f));
  })));
}
function drawSVGlab(X, iI, at, bc) { return draw(X, { scale: 34, fs: 15, lab: { [iI]: 'R' }, bondCls: bc, halo: { [at]: 'o' } }); }

export function alphaOrder(host) {
  const sets = [
    { title: '3-etil-2-metil-hexano', items: [['m', 'metil'], ['e', 'etil']], correct: ['e', 'm'], why: '<b>e</b>til antes de <b>m</b>etil.' },
    { title: 'Ordene os prefixos (ignore di, tri, sec, terc)', items: [['dm', 'dimetil'], ['e', 'etil'], ['cl', 'cloro'], ['b', 'bromo']], correct: ['b', 'cl', 'e', 'dm'], why: 'bromo, cloro, etil, (di)metil — “di” não conta na ordem alfabética.' },
    { title: 'Ordene os prefixos', items: [['tb', 'terc-butil'], ['ip', 'isopropil'], ['p', 'propil'], ['h', 'hidroxi']], correct: ['tb', 'h', 'ip', 'p'], why: '<b>b</b>util (terc não conta) → <b>h</b>idroxi → <b>i</b>sopropil (iso CONTA) → <b>p</b>ropil.' },
  ];
  sets.forEach((s, i) => host.append(exerciseCard({ title: s.title, type: 'order', q: 'Arraste para a ordem em que os prefixos aparecem no nome:', items: s.items.map(([id, label]) => ({ id, label })), correct: s.correct, top: '1º no nome', bottom: 'último', explain: s.why, e: s.why }, 'A' + (i + 1))));
}

export const WRONG = [
  ['2-etil-3-metilpentano', 'CC(CC)C(C)CC', 'Um etil no C2 indica que a cadeia não é a mais longa: o etil prolonga a cadeia.'],
  ['3-metilbutano', 'CCC(C)C', 'Numeração pelo lado errado: o metil deve receber o menor localizador.'],
  ['2-metil-3-etilpentano', 'CC(C)C(CC)CC', 'Prefixos em ordem alfabética: etil antes de metil.'],
  ['2,3 dimetilbutano', 'CC(C)C(C)C', 'Falta o hífen entre número e letra: “2,3-dimetilbutano”.'],
  ['2-3-dimetilbutano', 'CC(C)C(C)C', 'Entre números usa-se vírgula; entre número e letra, hífen.'],
  ['2,2-dimetil-4-metilpentano', 'CC(C)CC(C)(C)C', 'Grupos iguais são reunidos com um único multiplicador: trimetil.'],
  ['butan-3-ol', 'CCC(C)O', 'O grupo principal (OH) deve ter o menor localizador possível.'],
  ['1-metilpropano', 'CCCC', 'Metil no C1 prolonga a cadeia: é simplesmente butano.'],
  ['pent-3-eno', 'CCC=CC', 'A dupla deve receber o menor localizador.'],
  ['3-metilbut-3-en-1-ino', 'C#CC(C)=C', 'Empate nos localizadores das ligações múltiplas {1,3} nos dois sentidos: então a dupla recebe o menor localizador.'],
  ['2-etilpropan-1-ol', 'OCC(C)CC', 'O etil faz parte da cadeia mais longa que contém o C–OH.'],
];
export function fixName(host) {
  let k = 0;
  const box = h('div'), out = h('div');
  const list = WRONG.filter((w) => !M(w[1]).name || M(w[1]).name !== w[0]);
  const go = () => {
    const [wrong, smi, why] = list[k % list.length], X = M(smi);
    const inp = h('input', { type: 'text', 'aria-label': 'nome corrigido', placeholder: 'digite o nome correto', autocomplete: 'off', spellcheck: 'false', class: 'nameinp' });
    const check = () => { const ok = nameMatches(X.r, inp.value); out.replaceChildren(fb(ok ? 'ok' : 'bad', (ok ? '✔ Correto! ' : '✘ Ainda não. ') + (ok ? '' : 'Dica: ' + why))); if (ok) showFig(); };
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') check(); });
    const figBox = h('div', { class: 'figs' });
    const showFig = () => clear(figBox).append(fig(X, nameHTML(X), { color: 'roles', num: true }));
    clear(box).append(h('p', null, 'Nome incorreto: ', h('code', { class: 'wrongname' }, wrong)), h('div', { class: 'controls' }, inp, h('button', { class: 'btn primary', type: 'button', onclick: check }, 'Conferir'), h('button', { class: 'btn', type: 'button', onclick: () => { showFig(); out.replaceChildren(fb('neutral', `<b>Erro:</b> ${why}<br><b>Correto:</b> ${nameHTML(X)}`)); } }, 'Ver correção'), h('button', { class: 'btn', type: 'button', onclick: () => { k++; go(); } }, 'Próximo →')), figBox);
    out.innerHTML = '';
  };
  host.append(box, out);
  go();
}

/* ===================================================================
 * Galeria genérica por classe
 * =================================================================== */
export function gallery(host) {
  const keys = host.dataset.cat.split(',');
  const list = keys.flatMap((k) => CAT[k]);
  const grid = h('div', { class: 'gal' });
  const det = h('div', { 'aria-live': 'polite' });
  list.forEach((s) => {
    const X = M(s); if (!X.name) return;
    const nm = h('div', { class: 'galname' }, h('button', { class: 'btn sm ghost', type: 'button', onclick: (e) => { e.currentTarget.replaceWith(h('span', { html: nameHTML(X) })); } }, 'Mostrar nome'));
    const card = h('div', { class: 'galcard' }, h('div', { class: 'galfig' }, draw(X, { scale: 32, fs: 15 })), nm, h('button', { class: 'btn sm', type: 'button', onclick: () => {
      [...grid.children].forEach((c) => c.classList.remove('on')); card.classList.add('on');
      clear(det).append(h('div', { class: 'chcard' }, h('div', { class: 'grid2' }, h('div', { class: 'figs' }, fig(X, nameHTML(X) + (X.usual ? `<br><small class="muted">${X.usual}</small>` : ''), { color: 'roles', num: true, scale: 46 })), h('ol', { class: 'steps' }, explain(X).map((t) => h('li', { html: t })))), ROLE_LEGEND()));
      det.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } }, 'Passo a passo'));
    grid.append(card);
  });
  host.append(grid, det);
}

/* ===================================================================
 * 11. Alcanos — endireitar a cadeia em 3D
 * =================================================================== */
export function straighten(host) {
  const list = ['CCC(C)CCC', 'CCC(CC)CC(C)C', 'CCCCCC', 'CC(C)CC(C)C(C)C'];
  let smi = list[0], V = null, raf = 0;
  const v = vbox(), cap = h('p', { class: 'cardlab' });
  const go = () => {
    cancelAnimationFrame(raf);
    clear(v); const X = M(smi);
    V = view3d(v, X, {});
    const E = emb(X), rots = torsions(X.m, E);
    const P = applyTorsions(E, rots, 1);
    P.forEach((p, i) => V.mol.setPos(i, p)); V.mol.update();
    V.rots = rots; V.E = E;
    cap.innerHTML = 'Conformação “enrolada”: a cadeia principal não aparece em linha reta. Gire o modelo e depois endireite.';
  };
  const run = () => {
    const t0 = performance.now(), D = 1600;
    V.color('chain');
    const tick = (t) => { const s = Math.min(1, (t - t0) / D), e = 1 - s; const P = applyTorsions(V.E, V.rots, e * e * (3 - 2 * e)); P.forEach((p, i) => V.mol.setPos(i, p)); V.mol.update(); if (s < 1) raf = requestAnimationFrame(tick); else { V.numbers(true); cap.innerHTML = `Cadeia em zigue-zague, numerada: ${nameHTML(V.X)}. <b>Girar ligações simples (conformação) não muda o nome</b> — a conectividade é a mesma.`; } };
    raf = requestAnimationFrame(tick);
  };
  host.append(h('div', { class: 'controls' }, h('label', null, 'Alcano: ', sel(molOpts(list), smi, (x) => { smi = x; go(); })), h('button', { class: 'btn primary', type: 'button', onclick: run }, 'Endireitar cadeia para nomenclatura'), h('button', { class: 'btn', type: 'button', onclick: go }, '↺ Enrolar de novo')), v, cap);
  go();
}

/* ===================================================================
 * 14. Anel × cadeia; 15. orto/meta/para
 * =================================================================== */
const RVC = [['CCCC1CCCCC1', 'ring'], ['CC1CCCC1', 'ring'], ['OCCC1CCCCC1', 'chain'], ['CC(C)C1CCCCC1', 'ring'], ['CC(=O)C1CCCCC1', 'chain'], ['NCC1CCCCC1', 'chain'], ['CCCCCC1CCCCC1', 'ring']];
export function ringVsChain(host) {
  RVC.forEach(([s, a], i) => {
    const X = M(s);
    host.append(exerciseCard({ title: 'Anel ou cadeia?', type: 'mc', q: 'Qual é a estrutura principal (a que recebe o sufixo/nome-base)?', fig: { node: () => h('div', { class: 'figs' }, draw(X, { scale: 38 })) }, o: ['o anel', 'a cadeia acíclica'], a: a === 'ring' ? 0 : 1, e: (a === 'ring' ? 'O anel é a estrutura principal (IUPAC 2013: anel é sênior à cadeia quando não há grupo principal decidindo).' : 'O grupo funcional principal está na cadeia: ela tem prioridade (critério 1: máximo de grupos principais).') + ` Nome: ${nameHTML(X)}.` }, 'C' + (i + 1)));
  });
}
const OMP = [['Cc1ccccc1C', 1, 'orto'], ['Cc1cccc(C)c1', 3, 'meta'], ['Cc1ccc(C)cc1', 4, 'para'], ['Clc1ccccc1Br', 1, 'orto'], ['Oc1ccc(Cl)cc1', 4, 'para'], ['Brc1cccc([N+](=O)[O-])c1', 3, 'meta'], ['Cc1ccc(O)cc1', 4, 'para'], ['Cc1ccccc1O', 1, 'orto']];
export function omp(host) {
  let k = 0;
  const box = h('div'), out = h('div');
  const go = () => {
    const [s, rel, word] = OMP[k % OMP.length], X = M(s);
    const loc = rel === 1 ? '1,2' : rel === 3 ? '1,3' : '1,4';
    clear(box).append(h('div', { class: 'figs' }, draw(X, { scale: 46 })), h('div', { class: 'ch-answers' }, [['1,2', 'orto (o-)'], ['1,3', 'meta (m-)'], ['1,4', 'para (p-)']].map(([l, w]) => h('button', { class: 'btn', type: 'button', onclick: () => { const ok = l === loc; clear(box.firstChild).append(draw(X, { scale: 46, num: true, color: 'roles' })); out.replaceChildren(fb(ok ? 'ok' : 'bad', `${ok ? '✔' : '✘'} Posição <b>${loc}</b> = <b>${word}</b>. Nome sistemático: ${nameHTML(X)}${X.usual ? ` · usual: ${X.usual}` : ''}. <i>orto/meta/para são aceitos apenas para dissubstituídos; nos exercícios use os localizadores.</i>`)); } }, `${l} · ${w}`))), h('button', { class: 'btn ghost sm', type: 'button', onclick: () => { k++; go(); } }, 'Próximo →'));
    out.innerHTML = '';
  };
  host.append(box, out);
  go();
}

/* ===================================================================
 * 21. Aldeído × cetona; 23. ésteres; 24. aminas
 * =================================================================== */
export function aldKet(host) {
  const pool = shuffle([...CAT.aldeidos, ...CAT.cetonas]).slice(0, 8);
  const out = h('div');
  const rows = pool.map((s) => { const X = M(s), a = X.fgs.some((f) => f.type === 'aldeido') ? 'aldeído' : 'cetona'; const b = seg([['aldeído', 'aldeído'], ['cetona', 'cetona']], null, (v) => { b._v = v; }, 'classe'); return { X, a, b, card: h('div', { class: 'pmcard' }, draw(X, { scale: 32, fs: 15 }), b) }; });
  host.append(h('div', { class: 'pmgrid' }, rows.map((r) => r.card)), h('div', { class: 'ex-actions' }, h('button', { class: 'btn primary', type: 'button', onclick: () => { let n = 0; rows.forEach((r) => { const ok = r.b._v === r.a; r.card.classList.toggle('ok', ok); r.card.classList.toggle('bad', !ok); if (ok) n++; if (!r.card.querySelector('.cardlab')) r.card.append(h('div', { class: 'cardlab', html: nameHTML(r.X) })); }); out.replaceChildren(fb(n === rows.length ? 'ok' : 'bad', `${n}/${rows.length}. Aldeído: C=O na extremidade (CHO, sempre C1, sufixo -al). Cetona: C=O entre dois carbonos (sufixo -ona, com localizador).`)); } }, 'Conferir')), out);
}

export function esterSim(host) {
  const list = CAT.esteres.slice(1).concat(['CCCCC(=O)OC(C)C', CAT.esteres[0]]);
  let k = 0;
  const wrap = h('div', { class: 'pick' }), out = h('div', { 'aria-live': 'polite' }), steps = h('div');
  const go = () => {
    const X = M(list[k % list.length]), m = X.m, E = X.r.ester;
    const alk = new Set(E.alkylAtoms);
    const chosen = new Set();
    const render = (final) => {
      const bondCls = {};
      if (final) m.bonds.forEach((b) => { const k2 = Math.min(b.a, b.b) + '-' + Math.max(b.a, b.b); if (alk.has(b.a) && alk.has(b.b)) bondCls[k2] = 'sub'; else if (!alk.has(b.a) && !alk.has(b.b)) bondCls[k2] = 'mc'; });
      const svg = draw(X, { scale: 48, fs: 18, zoom: 1.35, bondCls });
      clear(wrap).append(svg);
      const P = pickable(svg, m.atoms.map((_, i) => i).filter((i) => m.atoms[i].el === 'C'), (i) => { if (chosen.has(i)) chosen.delete(i); else chosen.add(i); P.set(i, 'on', chosen.has(i)); out.innerHTML = ''; });
      chosen.forEach((i) => P.set(i, 'on'));
      if (final) E.alkylAtoms.forEach((i) => P.set(i, 'ok'));
    };
    render(false);
    clear(steps).append(
      h('div', { class: 'ex-actions' }, h('button', { class: 'btn primary', type: 'button', onclick: () => {
        const ok = chosen.size === alk.size && [...chosen].every((x) => alk.has(x));
        const inAcyl = [...chosen].some((x) => !alk.has(x));
        out.replaceChildren(fb(ok ? 'ok' : 'bad', ok ? '✔ Isso! ' + build(X) : inAcyl ? '✘ Você marcou carbono da parte ácida (acila). A parte acila contém o carbono da C=O; a alquila está do outro lado do O.' : '✘ Faltam carbonos da parte alquila.'));
        if (ok) render(true);
      } }, 'Conferir'), h('button', { class: 'btn', type: 'button', onclick: () => { render(true); out.replaceChildren(fb('neutral', build(X))); } }, 'Mostrar'), h('button', { class: 'btn', type: 'button', onclick: () => { k++; go(); } }, 'Próximo éster →')));
    out.innerHTML = '';
  };
  const build = (X) => { const E = X.r.ester, n = X.r.parent.P.length; return `Parte ácida: <span class="p-stem">${n} C</span> (contando o C da C=O) → <b>${E.acyl}</b>; parte alquila: <span class="p-alk">${E.alkName.replace(/a$/, '')}</span> → <b>${E.alkName}</b>. Nome: <b>${E.acyl} de ${E.alkName}</b>${X.usual ? ' · ' + X.usual : ''}.`; };
  host.append(h('p', { class: 'prompt' }, 'Clique nos carbonos da parte ALQUILA (ligada ao O, sem a C=O).'), wrap, steps, out, legend([['var(--cyan)', 'parte ácida (acila: …oato)'], ['var(--orange)', 'parte alquila (…ila)']]));
  go();
}

export function amineClass(host) {
  const list = ['CCCN', 'CCNC', 'CCN(C)C', 'CC(C)N', 'CNC', 'CN(C)C', 'CC(C)(C)N', 'Nc1ccccc1'];
  const out = h('div');
  const rows = list.map((s) => { const X = M(s), N = X.m.atoms.findIndex((a) => a.el === 'N'), nc = X.m.nb[N].length, a = ['', 'primária', 'secundária', 'terciária'][nc]; const b = seg([['primária', '1ª'], ['secundária', '2ª'], ['terciária', '3ª']], null, (v) => { b._v = v; }, 'classe'); return { X, a, b, card: h('div', { class: 'pmcard' }, draw(X, { scale: 32, fs: 15 }), b) }; });
  host.append(h('div', { class: 'pmgrid' }, rows.map((r) => r.card)), h('div', { class: 'ex-actions' }, h('button', { class: 'btn primary', type: 'button', onclick: () => { let n = 0; rows.forEach((r) => { const ok = r.b._v === r.a; r.card.classList.toggle('ok', ok); r.card.classList.toggle('bad', !ok); if (ok) n++; if (!r.card.querySelector('.cardlab')) r.card.append(h('div', { class: 'cardlab', html: `${r.a} · ${nameHTML(r.X)}` })); }); out.replaceChildren(fb(n === rows.length ? 'ok' : 'bad', `${n}/${rows.length}. Conte quantos carbonos estão ligados ao N: 1 → primária, 2 → secundária, 3 → terciária. (Não confunda com álcool 1º/2º/3º, que olha o carbono do OH!)`)); } }, 'Conferir')), out);
}
export function amine3d(host) {
  const list = ['CN(C)C', 'CCN', 'CC(N)=O'];
  let smi = list[0];
  const v = vbox(), cap = h('p', { class: 'cardlab' });
  const go = () => { clear(v); const X = M(smi); view3d(v, X, { color: 'fg' }); cap.innerHTML = nameHTML(X) + (smi === 'CC(N)=O' ? ' — na amida o N fica <b>plano</b> (sp², par conjugado com a C=O).' : ' — N <b>piramidal</b> (sp³): três ligações + um par de elétrons não ligante.'); };
  host.append(h('div', { class: 'controls' }, seg(list.map((s) => [s, M(s).name]), smi, (k) => { smi = k; go(); }, 'molécula')), v, cap);
  go();
}

/* ===================================================================
 * 28. Multifuncionais — guia de 6 etapas
 * =================================================================== */
const MULTI = ['CC(O)CC(=O)O', 'CC(=O)CC(C)(C)O', 'NCCC(=O)O', 'OCC(O)C=O', 'CC(Cl)CC(=O)C', 'NC(CO)C(=O)O', 'CC(O)CC=O', 'COCCO', 'NCCC#N', 'O=Cc1ccc(O)cc1'];
export function multiGuide(host) {
  let smi = MULTI[0], step = 0;
  const box = h('div'), txt = h('div', { class: 'stepcap', 'aria-live': 'polite' }), tl = h('div', { class: 'timeline' });
  const T = ['Identificar todas as funções', 'Escolher a função principal', 'Escolher a cadeia principal', 'Numerar', 'Nomear os prefixos', 'Montar o nome'];
  const go = () => {
    const X = M(smi), r = X.r, fl = funcList(X).filter((f) => FUNCTIONS.includes(f.t));
    const o = [{ color: 'fg', scale: 48 }, { color: 'fg', only: X.fgs.filter((f) => cls(f.type) === r.princType).map((f) => f.type), scale: 48 }, { color: 'chain', scale: 48 }, { color: 'chain', num: true, scale: 48 }, { color: 'roles', num: true, scale: 48 }, { color: 'roles', num: true, scale: 48 }][step];
    clear(box).append(h('div', { class: 'figs' }, h('figure', { class: 'fig' }, draw(X, o), step === 5 ? h('figcaption', { html: nameHTML(X) }) : null)));
    const ex = explain(X);
    txt.innerHTML = `<b>${step + 1}. ${T[step]}.</b> ` + [
      `Funções: ${fl.map((f) => `<span style="color:${hex(FGCOL[f.t])}">${f.name}</span>`).join(', ')}.`,
      r.princType ? `Pela tabela de prioridade, <b class="p-suf">${PRIO_NAME[r.princType]}</b> é a função principal → sufixo ${SUFX[r.princType]}. As outras viram prefixos (${fl.filter((f) => cls(f.t) !== r.princType).map((f) => PREFX[cls(f.t)] || f.name).join(', ') || '—'}).` : 'Nenhuma função vai ao sufixo.',
      ex.find((s) => s.includes('Cadeia principal') || s.includes('Estrutura principal')) || '',
      ex.find((s) => s.includes('Numeração')) || 'Numeração trivial.',
      ex.find((s) => s.includes('Substituintes')) || '',
      `Prefixos (ordem alfabética) + cadeia + insaturação + sufixo: ${nameHTML(X)}`,
    ][step];
    [...tl.children].forEach((b, i) => { b.classList.toggle('on', i === step); });
  };
  T.forEach((t, i) => tl.append(h('button', { type: 'button', onclick: () => { step = i; go(); } }, h('b', null, String(i + 1)), ' ' + t)));
  host.append(h('div', { class: 'controls' }, h('label', null, 'Molécula: ', sel(molOpts(MULTI), smi, (x) => { smi = x; step = 0; go(); })), h('button', { class: 'btn', type: 'button', onclick: () => { step = Math.max(0, step - 1); go(); } }, '◀'), h('button', { class: 'btn primary', type: 'button', onclick: () => { step = Math.min(5, step + 1); go(); } }, 'Próximo passo ▶')), tl, box, txt, ROLE_LEGEND());
  go();
}

/* ===================================================================
 * 29. Prioridade
 * =================================================================== */
const PRIO_ROWS = [
  ['ácidos carboxílicos', 'ácido …-oico', 'carboxi-', 'OC(=O)CCO'], ['ésteres', '…-oato de …ila', 'alcoxicarbonil-', 'COC(=O)CCN'], ['amidas', '…-amida', 'carbamoil-', 'NC(=O)CCO'], ['nitrilas', '…-nitrila', 'ciano-', 'NCCC#N'],
  ['aldeídos', '…-al', 'oxo- / formil-', 'CC(O)CC=O'], ['cetonas', '…-ona', 'oxo-', 'CC(=O)CCO'], ['álcoois e fenóis', '…-ol', 'hidroxi-', 'NCCO'], ['aminas', '…-amina', 'amino-', 'NCC=C'],
  ['ligações duplas e triplas', 'en / in (infixo)', '—', 'C=CC#C'], ['halo, alcóxi, nitro, alquil', 'sempre prefixos', 'cloro-, metoxi-, nitro-, metil-', 'COCC(Cl)C'],
];
export function prioTable(host) {
  const tb = h('tbody');
  PRIO_ROWS.forEach(([f, s, p, ex], i) => {
    const row = h('tr', { class: 'row', tabindex: 0 }, h('td', null, `${i + 1}. ${f}`), h('td', { class: 's1 p-suf' }, s), h('td', { class: 'p-pre' }, p));
    const X = M(ex);
    const exp = h('tr', { class: 'exp', hidden: '' }, h('td', { colspan: 3 }, h('div', { class: 'grid2' }, h('div', { class: 'figs' }, fig(X, nameHTML(X), { color: 'roles', num: true, scale: 38 })), h('ol', { class: 'steps' }, explain(X).map((t) => h('li', { html: t }))))));
    const tog = () => { exp.hidden = !exp.hidden; row.classList.toggle('open', !exp.hidden); };
    row.addEventListener('click', tog); row.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tog(); } });
    tb.append(row, exp);
  });
  host.append(h('div', { class: 'table-wrap' }, h('table', { class: 'cmp prio' }, h('thead', null, h('tr', null, h('th', null, 'Prioridade (maior → menor)'), h('th', null, 'Como sufixo'), h('th', null, 'Como prefixo'))), tb)), h('p', { class: 'hint3' }, 'Clique em uma linha para ver um exemplo resolvido.'));
}
export function prioOrder(host) {
  host.append(exerciseCard({ title: 'Ordene por prioridade', type: 'order', q: 'Coloque as funções da mais prioritária (vai ao sufixo) para a menos:', items: [['al', 'aldeído'], ['ol', 'álcool'], ['ac', 'ácido carboxílico'], ['am', 'amina'], ['on', 'cetona'], ['ni', 'nitrila']].map(([id, label]) => ({ id, label })), correct: ['ac', 'ni', 'al', 'on', 'ol', 'am'], top: 'maior prioridade', bottom: 'menor', explain: 'ácido > nitrila > aldeído > cetona > álcool > amina.', e: 'ácido > nitrila > aldeído > cetona > álcool > amina.' }, 'PR1'));
  const qs = ['CC(O)CC(=O)O', 'NCCC=O', 'CC(=O)CCO', 'NCCC#N', 'OCC(Cl)C', 'NC(C)CO', 'CCOC(=O)CC(C)=O'];
  qs.forEach((s, i) => {
    const X = M(s), types = [...new Set(X.fgs.map((f) => cls(f.type)).filter((t) => PRIO.includes(t) || ['haleto', 'eter', 'nitro'].includes(t)))];
    const opts = types.map((t) => PRIO_NAME[t] || FG_INFO[t].n);
    const a = opts.indexOf(PRIO_NAME[X.r.princType]);
    host.append(exerciseCard({ title: 'Função principal', type: 'mc', q: 'Qual função define o sufixo?', fig: { node: () => h('div', { class: 'figs' }, draw(X, { color: 'fg', scale: 40 })) }, o: opts, a, e: `${PRIO_NAME[X.r.princType]} tem maior prioridade. Nome: ${nameHTML(X)}.` }, 'PR' + (i + 2)));
  });
}

export { USUAL };
