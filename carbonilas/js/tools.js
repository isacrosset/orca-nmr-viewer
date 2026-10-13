/*
 * tools.js — laboratório carbonílico 3D, simuladores de redução e oxidação
 * (prever → justificar → conferir) e simulador de mecanismo com setas
 * curvas validadas (redução por hidreto e oxidação via éster de cromato).
 */
import { h, seg, tgl } from './widgets2d.js';
import { S } from './chem2d.js';
import { COMP, CLS_NAME, REAG, RED, OX, react } from './data.js';
import { sk, fig, svgOf } from './co2d.js';
import { coScene, findCO } from './co3d.js';
import { fb, clear, sel, vbox, legend, ESP_LEG, ORB_LEG } from './mods1.js';

/* ===================================================================
 * Laboratório 3D
 * =================================================================== */
export const LAB = [['metanal', 'C=O'], ['etanal', 'CC=O'], ['propanona', 'CC(C)=O'], ['butanona', 'CCC(C)=O'], ['cicloexanona', 'O=C1CCCCC1'], ['benzaldeido', 'O=CC1=CC=CC=C1'], ['acetofenona', 'CC(=O)C1=CC=CC=C1'], ['benzilico', 'OCC1=CC=CC=C1'], ['feniletanol', 'CC(O)C1=CC=CC=C1'], ['benzoico', 'OC(=O)C1=CC=CC=C1'], ['acetato', 'CCOC(C)=O']];
export function lab3d(host) {
  let key = 'propanona', A = null, quiz = false;
  const st = { style: 'ball', delta: true, esp: false, pi: false, pistar: false, bd: false, elec: false };
  const v = vbox('tall'), side = h('div'), out = h('div', { 'aria-live': 'polite' });
  const build = () => {
    if (A) A.v.dispose(); clear(v);
    const smi = LAB.find((x) => x[0] === key)[1];
    A = coScene(v, smi, { name: COMP[key].name, dist: smi.length > 10 ? 10 : 7.5, style: st.style, delta: st.delta, esp: st.esp, pi: st.pi, pistar: st.pistar, bd: st.bd ? 107 : null, cone: st.bd, elec: st.elec, pickH: false, onSelect: (i) => pick(i) });
    clear(side).append(fig(key, { scale: 34, fs: 15 }), h('p', { class: 'cardlab' }, CLS_NAME[COMP[key].cls]), out);
    out.replaceChildren(A.co ? fb('neutral', quiz ? 'Modo “Onde o nucleófilo ataca?”: clique no centro eletrofílico.' : 'Gire, aproxime e ative as camadas.') : fb('neutral', 'Esta molécula não tem C=O: compare com o composto carbonílico correspondente (ex.: álcool ↔ aldeído/cetona).'));
  };
  function pick(i) {
    if (!quiz || !A.co) return;
    if (i === A.co.c) { out.replaceChildren(fb('ok', '✔ O carbono carbonílico (δ+) é o centro eletrofílico: é onde o π* tem o maior lobo. Veja o π* agora.')); A.st.pistar = true; A.st.bd = 107; A.rebuild(); }
    else if (i === A.co.o) out.replaceChildren(fb('bad', '✘ O oxigênio é a região rica em elétrons (δ−): ataca eletrófilos/H⁺, não nucleófilos.'));
    else out.replaceChildren(fb('bad', '✘ Esse átomo não é o centro eletrofílico. Procure o carbono da C=O.'));
  }
  const T = (t, k) => tgl(t, () => { st[k] = !st[k]; if (A) { A.st[k === 'bd' ? 'bd' : k] = k === 'bd' ? (st.bd ? 107 : null) : st[k]; if (k === 'bd') A.st.cone = st.bd; A.rebuild(); } return st[k]; }, st[k]);
  host.append(
    h('div', { class: 'controls' }, h('label', null, 'Molécula: ', sel(LAB.map(([k]) => [k, COMP[k].name]), key, (k) => { key = k; build(); }, 'molécula')), seg([['ball', 'bola-vareta'], ['space', 'preenchimento']], 'ball', (k) => { st.style = k; A.st.style = k; A.rebuild(); }, 'modelo')),
    h('div', { class: 'controls' }, T('Cδ+/Oδ−', 'delta'), T('Mapa eletrostático', 'esp'), T('Orbital π', 'pi'), T('Orbital π*', 'pistar'), T('Bürgi–Dunitz', 'bd'), T('Carbono eletrofílico', 'elec'), tgl('🎯 Onde o nucleófilo ataca?', () => { quiz = !quiz; out.replaceChildren(fb('neutral', quiz ? 'Clique no centro eletrofílico no modelo 3D.' : 'Modo livre.')); return quiz; }, false)),
    h('div', { class: 'grid2' }, v, side), ORB_LEG(), ESP_LEG());
  build();
}

/* ===================================================================
 * Simuladores (redução / oxidação): 4 perguntas antes da resposta
 * =================================================================== */
const STR = {
  NaBH4: 'redutor brando (aldeídos e cetonas)', LiAlH4: 'redutor forte (reduz também ésteres, ácidos, nitrilas)', DIBAL: 'redução parcial controlada (éster/nitrila → aldeído)',
  PCC: 'oxidante de Cr(VI) relativamente brando, anidro', Jones: 'oxidante de Cr(VI) forte, aquoso ácido', KMnO4: 'oxidante forte (resultado depende das condições)', O3r: 'clivagem de C=C com workup redutivo', O3o: 'clivagem de C=C com workup oxidativo',
};
function simulator(host, subs, reagents) {
  let sub = subs[0], rg = reagents[0], step = 0;
  const top = h('div', { class: 'rxrow' }), box = h('div'), out = h('div', { 'aria-live': 'polite' });
  const kindOf = (r) => (REAG[r].kind === 'red' ? 'redução' : REAG[r].kind === 'ox' ? 'oxidação' : 'clivagem oxidativa de C=C');
  const start = () => { step = 0; clear(top).append(fig(sub, { scale: 30, fs: 13 }), h('span', { class: 'rxarr', html: `→<small>${REAG[rg].name}</small>` }), h('span', { class: 'qmark' }, '?')); ask(); out.replaceChildren(); };
  const Q = () => {
    const r = react(sub, rg);
    const clsOpts = [...new Set([COMP[sub].cls, 'aldeido', 'cetona', 'alcool1', 'alcool2', 'alcool3', 'ester', 'acido', 'alceno', 'nitrila'])].slice(0, 6);
    const prods = r.prods.filter((p) => typeof p === 'string');
    const distract = Object.keys(COMP).filter((k) => !prods.includes(k) && k !== sub && COMP[k].cls !== 'alceno' && COMP[k].cls !== 'outro').sort(() => Math.random() - 0.5).slice(0, 2);
    return [
      { q: '1. Qual é a função do substrato?', opts: clsOpts.map((c) => [c, CLS_NAME[c]]).sort(() => Math.random() - 0.5), right: COMP[sub].cls, e: `${COMP[sub].name}: ${CLS_NAME[COMP[sub].cls]}.` },
      { q: '2. O reagente promove…', opts: [['redução', 'redução'], ['oxidação', 'oxidação'], ['clivagem oxidativa de C=C', 'clivagem de C=C (ozonólise)']], right: kindOf(rg), e: `${REAG[rg].name}: ${kindOf(rg)}.` },
      { q: '3. Quão forte/seletivo é o reagente?', opts: Object.entries(STR).filter(([k]) => reagents.includes(k)).map(([k, t]) => [k, t]).sort(() => Math.random() - 0.5), right: rg, e: STR[rg] + '. ' + REAG[rg].note + '.' },
      { q: '4. Qual é o produto esperado?', opts: [...(r.ok ? [['__p', null]] : []), ...distract.map((d) => [d, null]), ['__none', null]].sort(() => Math.random() - 0.5), right: r.ok ? '__p' : '__none', e: '', r, prods },
    ];
  };
  let QS = [];
  function ask() {
    if (step === 0) QS = Q();
    if (step >= QS.length) return;
    const q = QS[step];
    const btn = (val, content) => h('button', { class: content.nodeType ? 'pickcard' : 'btn', type: 'button', onclick: () => answer(val) }, content);
    const opt = ([k, t]) => {
      if (step < 3) return btn(k, t);
      if (k === '__none') return btn(k, h('span', null, 'não reage / sem transformação usual'));
      if (k === '__p') return btn(k, h('div', { class: 'figs' }, ...q.r.prods.map((p) => (typeof p === 'string' ? sk(p, { scale: 20, fs: 10 }) : sk(p, { scale: 20, fs: 10 })))));
      return btn(k, h('div', null, sk(k, { scale: 20, fs: 10 }), h('small', null, COMP[k].name)));
    };
    clear(box).append(h('p', { class: 'prompt' }, q.q), h('div', { class: step < 3 ? 'ch-answers' : 'pickgrid' }, q.opts.map(opt)));
  }
  function answer(v) {
    const q = QS[step], ok = v === q.right;
    if (step < 3) { out.append(fb(ok ? 'ok' : 'bad', `${ok ? '✔' : '✘'} ${q.e}`)); step++; ask(); return; }
    const r = q.r;
    clear(box);
    clear(top).append(fig(sub, { scale: 30, fs: 13 }), h('span', { class: 'rxarr', html: `→<small>${REAG[rg].name}</small>` }), ...(r.ok ? r.prods.map((p, i) => [i ? h('span', { class: 'rxarr' }, '+') : null, typeof p === 'string' ? fig(p, { scale: 30, fs: 13 }) : h('figure', { class: 'fig' }, sk(p, { scale: 30, fs: 13 }))]).flat() : [h('span', { class: 'muted' }, 'sem transformação usual')]));
    out.append(fb(ok ? 'ok' : 'bad', `${ok ? '✔ Produto correto.' : '✘ Veja o resultado acima.'} ${r.why}${r.warn ? ` <i>${r.warn}</i>` : ''}`), h('button', { class: 'btn sm', type: 'button', onclick: start }, '↺ Refazer'));
  }
  host.append(h('div', { class: 'controls' }, h('label', null, 'Substrato: ', sel(subs.map((k) => [k, COMP[k].name]), sub, (k) => { sub = k; start(); }, 'substrato')), h('label', null, 'Reagente: ', sel(reagents.map((k) => [k, REAG[k].name]), rg, (k) => { rg = k; start(); }, 'reagente'))), top, box, out);
  start();
}
export const redSim = (host) => simulator(host, ['butanal', 'benzaldeido', 'propanona', 'cicloexanona', 'acetofenona', 'butanoatoMe', 'acetato', 'benzoico', 'butanoico', 'butanonitrila', 'butan1ol'], ['NaBH4', 'LiAlH4', 'DIBAL']);
export const oxSim = (host) => simulator(host, ['butan1ol', 'pentan1ol', 'benzilico', 'butan2ol', 'cicloexanol', 'tercbutanol', 'butanal', 'benzaldeido', 'butanona', 'metilbuteno', 'cicloexeno', 'estireno'], ['PCC', 'Jones', 'KMnO4', 'O3r', 'O3o']);

/* ===================================================================
 * Simulador de mecanismo (setas validadas)
 * =================================================================== */
const at = (s, x, y, t, opt) => s.a(x, y, t, opt || {});
const MECH = {
  red: {
    title: 'Redução de cetona por NaBH₄',
    steps: ['seta B–H → C', 'seta π C=O → O', 'protonação (O⁻ → H)', 'H–O → O', 'álcool'],
    build(step) {
      const s = new S(), T = {};
      if (step <= 1) {
        T.c = at(s, 0, 0, '', { halo: 'o' }); T.o = at(s, 0, -1.2, 'O', { cls: 'oxy', lp: [45, 135] }); const r1 = at(s, -1.05, 0.6, 'H₃C', { cls: 'grey' }), r2 = at(s, 1.05, 0.6, 'CH₃', { cls: 'grey' }); s.b(T.c, T.o, 2); s.b(T.c, r1, 1); s.b(T.c, r2, 1);
        T.b = at(s, -3.2, -0.9, 'BH₃', { chg: '−', cls: 'red' }); T.hh = at(s, -2.0, -0.55, 'H', { cls: 'hyd' }); s.b(T.b, T.hh, 1);
      } else if (step <= 3) {
        T.c = at(s, 0, 0, ''); T.o = at(s, 0, -1.25, 'O', { cls: 'oxy', chg: '−', lp: [0, 180] }); T.hh = at(s, -1.15, 0.3, 'H', { cls: 'hyd' }); const r1 = at(s, 0.55, 1.05, 'H₃C', { cls: 'grey' }), r2 = at(s, 1.15, 0.3, 'CH₃', { cls: 'grey' }); s.b(T.c, T.o, 1); s.b(T.c, T.hh, 'w'); s.b(T.c, r1, 1); s.b(T.c, r2, 'h');
        T.hp = at(s, 1.4, -1.9, 'H'); T.so = at(s, 2.7, -1.9, 'OCH₃', { cls: 'oxy2', lp: [90] }); s.b(T.hp, T.so, 1);
      } else { T.c = at(s, 0, 0, ''); at(s, 0, -1.25, 'OH', { cls: 'prod' }); const hh = at(s, -1.15, 0.3, 'H', { cls: 'hyd' }); const r1 = at(s, 0.55, 1.05, 'H₃C', { cls: 'grey' }), r2 = at(s, 1.15, 0.3, 'CH₃', { cls: 'grey' }); s.b(T.c, 1, 1); s.b(T.c, hh, 'w'); s.b(T.c, r1, 1); s.b(T.c, r2, 'h'); s.t(0, 2, 'propan-2-ol (álcool secundário)', 'cond', 14); }
      return { s, T };
    },
    check(step, T, f, t) {
      const isB = (x, a, b) => x.type === 'b' && ((x.a === a && x.b === b) || (x.a === b && x.b === a));
      if (step === 0) {
        if (isB(f, T.c, T.o)) return [false, 'Comece pela fonte do hidreto: a ligação B–H é o “nucleófilo”.'];
        if (!isB(f, T.b, T.hh)) return [false, 'A origem é o par de elétrons da ligação <b>B–H</b> (hidreto equivalente; não há H⁻ livre).'];
        if (t.type === 'a' && t.i === T.o) return [false, '<b>Erro comum:</b> o hidreto ataca o <b>carbono</b> carbonílico (δ+, maior lobo do π*), não o oxigênio.'];
        if (!(t.type === 'a' && t.i === T.c)) return [false, 'O destino é o carbono carbonílico.'];
        return [true, '✔ B–H → C: forma-se a nova ligação C–H.', { from: { b: [T.b, T.hh] }, to: { a: T.c, ang: 165 }, bend: -0.45, cls: 'm' }];
      }
      if (step === 1) {
        if (!isB(f, T.c, T.o)) return [false, 'Agora o par <b>π da C=O</b> precisa se deslocar (o C não pode ficar com 5 ligações).'];
        if (t.type === 'a' && t.i === T.c) return [false, 'O par π vai para o <b>oxigênio</b> (mais eletronegativo), não para o carbono — senão o C ficaria pentavalente.'];
        if (!(t.type === 'a' && t.i === T.o)) return [false, 'Destino: o átomo de oxigênio.'];
        return [true, '✔ π C=O → O: forma-se o alcóxido (O⁻, três pares).', { from: { b: [T.c, T.o] }, to: { a: T.o, ang: 0 }, bend: -0.5, cls: 'm' }];
      }
      if (step === 2) {
        if (!(f.type === 'a' && f.i === T.o)) return [false, 'Origem: um par isolado do <b>O⁻</b> (alcóxido, base).'];
        if (!(t.type === 'a' && t.i === T.hp)) return [false, 'Destino: o H ácido do solvente (CH₃O–H).'];
        return [true, '✔ O⁻ captura o H⁺.', { from: { lp: [T.o, 90] }, to: { a: T.hp, ang: 180 }, bend: -0.4, cls: 'm' }];
      }
      if (step === 3) {
        if (!isB(f, T.hp, T.so)) return [false, 'Origem: a ligação H–OCH₃ que se rompe.'];
        if (!(t.type === 'a' && t.i === T.so)) return [false, 'Destino: o O do metanol (sai como CH₃O⁻).'];
        return [true, '✔ Protonação completa.', { from: { b: [T.hp, T.so] }, to: { a: T.so, ang: 90 }, bend: -0.6, cls: 'm' }];
      }
      return [false, ''];
    },
    arrowsPerFrame: [2, 2],
  },
  ox: {
    title: 'Oxidação de álcool secundário via éster de cromato',
    steps: ['O(álcool) → Cr', 'identifique o H removido', 'base → H', 'C–H → C=O', 'O–Cr → Cr', 'cetona'],
    build(step, real) {
      const s = new S(), T = {};
      const alc = (withCr) => { T.c = at(s, 0, 0, ''); T.h = at(s, 0, 1.1, 'H', { cls: 'hb' }); const r1 = at(s, -1.0, -0.55, 'R', { cls: 'grey' }), r2 = at(s, -1.0, 0.55, 'R′', { cls: 'grey' }); T.o = at(s, 1.1, -0.6, withCr ? 'O' : 'OH', { cls: 'oxy', lp: withCr ? undefined : [90] }); s.b(T.c, T.h, 1); s.b(T.c, r1, 1); s.b(T.c, r2, 1); s.b(T.c, T.o, 1); };
      const cr = (x, y) => { T.cr = at(s, x, y, 'Cr', { cls: 'cr' }); const a = at(s, x, y - 1.15, 'O', { cls: 'oxy2' }), b = at(s, x + 1.15, y, 'O', { cls: 'oxy2' }), c = at(s, x, y + 1.15, 'OH', { cls: 'oxy2' }); s.b(T.cr, a, 2); s.b(T.cr, b, 2); s.b(T.cr, c, 1); T.crOH = c; };
      if (step === 0) { alc(false); cr(3.4, -0.6); const lo = at(s, 2.25, -0.6, 'HO', { cls: 'oxy2' }); s.b(lo, T.cr, 1); }
      else if (step <= 4) { alc(true); cr(2.3, -0.6); s.b(T.o, T.cr, 1); if (real >= 2) { T.w = at(s, 1.4, 2.0, 'OH₂', { cls: 'base', lp: [180] }); } }
      else { T.c = at(s, 0, 0, '', { halo: 'o' }); const oo = at(s, 1.05, -0.6, 'O', { cls: 'oxy', lp: [45, 315] }); const r1 = at(s, -1.0, -0.55, 'R', { cls: 'grey' }), r2 = at(s, -1.0, 0.55, 'R′', { cls: 'grey' }); s.b(T.c, oo, 2); s.b(T.c, r1, 1); s.b(T.c, r2, 1); s.t(3.3, 0, '+ H₃O⁺ + Cr(IV)', 'cond', 15); }
      return { s, T };
    },
    check(step, T, f, t) {
      const isB = (x, a, b) => x.type === 'b' && ((x.a === a && x.b === b) || (x.a === b && x.b === a));
      if (step === 0) {
        if (f.type === 'a' && f.i === T.cr) return [false, 'A seta parte do <b>nucleófilo</b> (o O do álcool, com pares isolados) para o eletrófilo (Cr(VI)).'];
        if (!(f.type === 'a' && f.i === T.o)) return [false, 'Origem: um par isolado do O do álcool.'];
        if (!(t.type === 'a' && t.i === T.cr)) return [false, 'Destino: o cromo (Cr(VI), eletrofílico).'];
        return [true, '✔ O ataca o Cr. Após transferências de próton e saída de H₂O, forma-se o éster de cromato. <i>Simplificado.</i>', { from: { lp: [T.o, 90] }, to: { a: T.cr, ang: 120 }, bend: -0.45, cls: 'o' }];
      }
      if (step === 1) {
        if (f.type === 'a' && f.i === T.h) return [true, '✔ É o H do <b>carbono</b> que porta o O. (Por isso álcoois terciários não reagem assim: não têm esse H.)'];
        return [false, 'Procure o H ligado ao <b>carbono</b> que porta o O–Cr (não o H do grupo OH do cromo).'];
      }
      if (step === 2) {
        if (!(f.type === 'a' && f.i === T.w)) return [false, 'Origem: um par isolado da <b>base</b> (H₂O).'];
        if (!(t.type === 'a' && t.i === T.h)) return [false, 'Destino: o H do carbono identificado.'];
        return [true, '✔ A base remove o H.', { from: { lp: [T.w, 180] }, to: { a: T.h, ang: 0 }, bend: 0.35, cls: 'o' }];
      }
      if (step === 3) {
        if (!isB(f, T.c, T.h)) return [false, 'Origem: a ligação <b>C–H</b> que se rompe.'];
        if (!((t.type === 'b' && isB(t, T.c, T.o)) || (t.type === 'a' && t.i === T.o))) return [false, 'Destino: entre C e O, formando a ligação π <b>C=O</b>.'];
        return [true, '✔ Forma-se a π C=O.', { from: { b: [T.c, T.h] }, to: { b: [T.c, T.o] }, bend: -0.6, cls: 'm' }];
      }
      if (step === 4) {
        if (!isB(f, T.o, T.cr)) return [false, 'Origem: a ligação <b>O–Cr</b> (o O não pode ficar com 3 ligações + 2 pares).'];
        if (!(t.type === 'a' && t.i === T.cr)) return [false, 'Destino: o cromo, que recebe o par e é <b>reduzido</b> (Cr(VI) → Cr(IV)).'];
        return [true, '✔ O–Cr → Cr: cromo reduzido; álcool oxidado.', { from: { b: [T.o, T.cr] }, to: { a: T.cr, ang: 200 }, bend: -0.6, cls: 'm' }];
      }
      return [false, ''];
    },
  },
};
export function mechSim(host) {
  let mode = 'red', step = 0, from = null, hist = [];
  const stage = h('div', { class: 'figs mechsim' }), prog = h('ol', { class: 'msteps' }), q = h('div'), out = h('div', { 'aria-live': 'polite' });
  const frameOf = (st) => (mode === 'red' ? (st <= 1 ? 0 : st <= 3 ? 2 : 4) : (st === 0 ? 0 : st <= 4 ? 1 : 5));
  function render(fr = frameOf(step)) {
    const M = MECH[mode];
    const { s, T } = M.build(fr, step);
    hist.forEach((a) => s.arrow(a.from, a.to, a.bend, a.cls));
    const svg = svgOf(s, { scale: 50, fs: 19, zoom: 1.35, animate: true });
    clear(stage).append(svg);
    clear(prog).append(...M.steps.map((t, i) => h('li', { class: i < step ? 'done' : i === step ? 'cur' : '' }, t)));
    const final = step >= M.steps.length - 1;
    if (!final) {
      const C = svg._chem, NS = 'http://www.w3.org/2000/svg', g = document.createElementNS(NS, 'g'); g.setAttribute('transform', C.transform); svg.append(g);
      const mk = (tag, a, tg) => { const e = document.createElementNS(NS, tag); Object.entries(a).forEach(([k, v]) => e.setAttribute(k, v)); e.setAttribute('tabindex', 0); e.setAttribute('role', 'button'); const f = () => click(tg, e, T); e.addEventListener('click', f); e.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); f(); } }); g.append(e); };
      s.bonds.forEach(([a, b]) => { const p = C.atoms[a], r = C.atoms[b]; mk('line', { x1: p.x, y1: p.y, x2: r.x, y2: r.y, class: 'hitb', 'aria-label': 'ligação' }, { type: 'b', a, b }); });
      s.atoms.forEach((_, i) => { const p = C.atoms[i]; mk('circle', { cx: p.x, cy: p.y, r: 16, class: 'hita', 'aria-label': 'átomo' }, { type: 'a', i }); });
    }
    const pickStep = mode === 'ox' && step === 1;
    clear(q).append(final ? fb('ok', mode === 'red' ? '✔ Mecanismo completo: cetona → alcóxido → <b>álcool secundário</b> (redução).' : '✔ Mecanismo completo: álcool 2° → <b>cetona</b> (oxidação); Cr(VI) → Cr(IV).') : h('p', { class: 'prompt', html: pickStep ? 'Clique no <b>H</b> que será removido pela base.' : `Etapa ${step + 1}: desenhe a seta — clique na <b>origem</b> (par de elétrons) e depois no <b>destino</b>.` }), final ? h('button', { class: 'btn sm', type: 'button', onclick: () => { step = 0; hist = []; out.replaceChildren(); render(); } }, '↺ Recomeçar') : null, from ? h('p', { class: 'hint3' }, 'Origem selecionada — agora o destino.') : null);
  }
  function click(t, e, T) {
    const M = MECH[mode], pickStep = mode === 'ox' && step === 1;
    if (pickStep) { const [ok, msg] = M.check(step, T, t, null); out.replaceChildren(fb(ok ? 'ok' : 'bad', ok ? msg : '✘ ' + msg)); if (ok) { step++; render(); } return; }
    if (!from) { from = t; e.classList.add('sel'); render0(); return; }
    const [ok, msg, arrow] = M.check(step, T, from, t);
    from = null;
    out.replaceChildren(fb(ok ? 'ok' : 'bad', ok ? msg : '✘ ' + msg));
    if (!ok) { render(); return; }
    const f0 = frameOf(step); hist.push(arrow); step++;
    if (frameOf(step) !== f0) { render(f0); setTimeout(() => { hist = []; render(); }, 1300); } else render();
  }
  const render0 = () => { const p = q.querySelector('.hint3'); if (!p) q.append(h('p', { class: 'hint3' }, 'Origem selecionada — agora o destino.')); };
  host.append(h('div', { class: 'controls' }, seg([['red', 'Redução (NaBH₄)'], ['ox', 'Oxidação (Cr(VI))']], mode, (k) => { mode = k; step = 0; hist = []; from = null; out.replaceChildren(); render(); }, 'mecanismo')), prog, h('div', { class: 'grid2' }, stage, h('div', null, q, out)), h('p', { class: 'hint3' }, 'Representação mecanística simplificada para fins didáticos. Origem da seta: par isolado (clique no átomo), ligação π ou ligação σ que se rompe (clique na ligação).'));
  render();
}
void RED; void OX; void legend; void findCO;
