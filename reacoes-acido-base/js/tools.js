/*
 * tools.js — laboratório eletrônico 3D, "Onde estão os elétrons?",
 * simulador e calculadora de equilíbrio ácido-base, comparador de bases
 * conjugadas, ferramenta de raciocínio de acidez, rankings, simulador de
 * setas curvas e montagem de mecanismo.
 */
import { h, seg, shuffle } from './widgets2d.js';
import { molScene, LIB3D_NAMES } from './mol3d.js';
import { ACIDS, A, PAIRS, FACTORS, FNAME, fmtP } from './acid.js';
import { R } from './energy.js';
import { arrowPuzzle, sortable } from './practice.js';
import { PUZZLES, MECH_BUILD, SP, acetate, ethoxide } from './struct.js';
import { vbox, fig, sk, pick, btn, fbBox, setFb, select, espLegend, espCompare } from './modules.js';

/* ===================================================================
 * Laboratório eletrônico 3D
 * =================================================================== */
const LABK = ['HCl', 'HBr', 'ethanol', 'ethoxide', 'acetic', 'acetate', 'acetylene', 'acetylide', 'NH3', 'NH2', 'CH3Br', 'acetone', 'BF3', 'CH3p', 'tBup', 'CH3m', 'CH3r', 'H2O', 'HO', 'H3O', 'CN', 'ethylene'];
export function lab3d(host) {
  const v = vbox('tall'), note = h('p', { class: 'hint3' });
  const T = (lab, k, on) => h('button', { class: 'btn sm', type: 'button', 'aria-pressed': on ? 'true' : 'false', onclick: (e) => e.currentTarget.setAttribute('aria-pressed', sc.toggle(k)) }, lab);
  const side = h('div', { class: 'labside' },
    h('div', { class: 'optgroup-t' }, 'Molécula'), select(LABK.map((k) => [k, LIB3D_NAMES[k]]), 'acetic', (k) => sc.set(k), 'Molécula'),
    h('div', { class: 'optgroup-t' }, 'Modelo'), h('div', { class: 'controls' }, T('Volume (space-filling)', 'style', false)),
    h('div', { class: 'optgroup-t' }, 'Elétrons e cargas'), h('div', { class: 'controls' }, T('Pares livres', 'lp', true), T('Cargas formais', 'fc', true), T('Cargas parciais δ', 'dl', false), T('Orbitais', 'orb', true)),
    h('div', { class: 'optgroup-t' }, 'Mapas'), h('div', { class: 'controls' }, T('Potencial eletrostático', 'esp', false), T('Regiões Nu / E', 'reg', false)),
    h('p', { class: 'hint3', html: '<span class="sw nuc"></span> região nucleofílica (rica em elétrons) · <span class="sw elc"></span> região eletrofílica (pobre)' }));
  host.append(h('div', { class: 'labgrid' }, side, h('div', null, v, espLegend(), note)));
  const sc = molScene(v, 'acetic', { onSet: (d) => { note.innerHTML = `<b>${d.name}</b> · carga total ${d.charge > 0 ? '+' : ''}${d.charge}. ${d.note || ''}`; } });
}

/* ===================================================================
 * "Onde estão os elétrons?"
 * =================================================================== */
const WHERE = ['CH3Br', 'acetone', 'ethanol', 'HCl', 'BF3', 'acetic', 'NH3', 'H3O'];
export function whereElectrons(host) {
  const v = vbox('tall'), q = h('p', { class: 'prompt' }), fb = fbBox();
  let i = 0, mode = 'nuc', picked = new Set(), marks = [];
  host.append(q, v, h('div', { class: 'controls' }, btn('Conferir', () => check(), 'primary'), btn('Mostrar mapa', (e) => e.currentTarget.setAttribute('aria-pressed', sc.toggle('esp'))), btn('Próxima →', () => next())), fb);
  const sc = molScene(v, WHERE[0], { flags: { lp: false, fc: true, orb: false, esp: false, reg: false }, onPick: (a) => toggle(a) });
  function prompt() { q.innerHTML = `<b>${sc.def ? sc.def.name : ''}</b> — ${mode === 'nuc' ? 'clique nos átomos das regiões <b>mais ricas em elétrons</b> (as que doariam elétrons: comportamento nucleofílico/básico).' : 'agora clique nos átomos das regiões <b>mais pobres em elétrons</b> (sítios eletrofílicos ou ácidos).'}`; }
  function clearMarks() { marks.forEach((m) => m.parent && m.parent.remove(m)); marks = []; picked = new Set(); }
  function toggle(a) { if (picked.has(a)) return; picked.add(a); marks.push(sc.mark(a, mode === 'nuc' ? 0x2fd4f5 : 0xff9f43)); fb.style.display = 'none'; }
  function check() {
    const want = new Set(mode === 'nuc' ? sc.def.nuc : sc.def.elec);
    const ok = [...picked].filter((a) => want.has(a)).length, wrong = [...picked].filter((a) => !want.has(a)).length;
    const all = ok === want.size && !wrong;
    setFb(fb, all ? 'ok' : 'bad', `${all ? '✔ Isso!' : `${ok} de ${want.size} certos${wrong ? `, ${wrong} a mais` : ''}.`} ${mode === 'nuc' ? 'Regiões ricas: pares livres, cargas negativas, ligações π → comportamento <b>nucleofílico/básico</b>.' : 'Regiões pobres: átomos δ+ ligados a elementos eletronegativos, orbitais vazios, cargas positivas → comportamento <b>eletrofílico/ácido</b>.'}`);
    sc.toggle('reg', true);
    if (all || wrong || ok) setTimeout(() => { if (mode === 'nuc') { mode = 'elec'; clearMarks(); sc.toggle('reg', false); prompt(); } }, 2600);
  }
  function next() { i = (i + 1) % WHERE.length; mode = 'nuc'; clearMarks(); sc.set(WHERE[i]); sc.toggle('reg', false); fb.style.display = 'none'; prompt(); }
  prompt();
}

/* ===================================================================
 * C–X: onde o nucleófilo ataca?
 * =================================================================== */
export function cxAttack(host) {
  const v = vbox(), fb = fbBox();
  host.append(h('p', { class: 'prompt' }, 'CH₃Br: clique no átomo que o nucleófilo atacaria.'), v, espLegend(), fb);
  const sc = molScene(v, 'CH3Br', { flags: { esp: true, dl: true, lp: false }, onPick: (a) => {
    const el2 = sc.def.atoms[a].el;
    setFb(fb, a === 0 ? 'ok' : 'bad', a === 0 ? '✔ O <b>carbono δ+</b>: região pobre em elétrons, ligada ao Br eletronegativo. O ataque ocorre pelo lado oposto ao Br, que sai levando o par da ligação.' : el2 === 'Br' ? '✘ O Br é δ− e tem octeto completo: repele o nucleófilo rico em elétrons.' : '✘ Os H são levemente δ+, mas não há ligação que possa se romper para acomodar um novo par: o eletrófilo é o C.');
  } });
}

/* ===================================================================
 * Simulador de equilíbrio ácido-base + calculadora
 * =================================================================== */
const EQ_LIST = ['HCl', 'H3O', 'AcOH', 'HF', 'NH4', 'PhOH', 'H2O', 'MeOH', 'EtOH', 'HCCH', 'NH3', 'C2H6'];
export function eqSim(host) {
  let a = 'AcOH', b = 'H2O';
  const eq = h('div', { class: 'eqline' }), q = h('div', { class: 'controls' }), fb = fbBox(), res = h('div', { class: 'readout', style: 'display:none' });
  host.append(h('div', { class: 'grid2' }, h('label', null, 'Ácido HA ', select(EQ_LIST.map((k) => [k, `${A[k].f}`]), a, (k) => { a = k; draw(); })), h('label', null, 'Base B⁻ ', select(EQ_LIST.map((k) => [k, `${A[k].b}`]), b, (k) => { b = k; draw(); }))), eq, q, fb, res);
  function draw() {
    fb.style.display = 'none'; res.style.display = 'none';
    eq.innerHTML = `<span class="sp ac">${A[a].f}</span> + <span class="sp bs">${A[b].b}</span> <span class="eqa">⇌</span> <span class="sp bs">${A[a].b}</span> + <span class="sp ac">${A[b].f}</span>`;
    q.innerHTML = '';
    if (a === b) { q.append(h('span', { class: 'hint3' }, 'Escolha ácido e base de pares diferentes.')); return; }
    q.append(h('b', null, 'O equilíbrio favorece: '), btn('← reagentes', () => ans('L')), btn('produtos →', () => ans('R')));
  }
  function ans(side) {
    const pa = A[a].pKa, pb = A[b].pKa, lk = pb - pa, right = lk > 0 ? 'R' : 'L';
    const dG = -R * 298 * lk * Math.log(10);
    setFb(fb, side === right ? 'ok' : 'bad', `${side === right ? '✔' : '✘'} Favorece o lado do <b>ácido mais fraco</b> (maior pKa): ${pa > pb ? A[a].f : A[b].f} (pKa ${fmtP(Math.max(pa, pb))}).`);
    res.style.display = '';
    res.innerHTML = `<span>pKa(HA) = <b>${fmtP(pa)}</b></span><span>pKa(HB) = <b>${fmtP(pb)}</b></span><span>log K ≈ pKa(HB) − pKa(HA) = <b>${fmtP(+lk.toFixed(2))}</b></span><span>K ≈ <b>10<sup>${fmtP(+lk.toFixed(1))}</sup></b></span><span>ΔG° ≈ −RT ln K = <b class="${dG < 0 ? 'okc' : 'hic'}">${fmtP(+dG.toFixed(0))} kJ/mol</b> (298 K)</span><span>${Math.abs(lk) < 1 ? 'pKa próximos: mistura apreciável dos dois lados' : lk > 0 ? 'produtos favorecidos' : 'reagentes favorecidos'}</span>`;
  }
  draw();
}
export function pkaCalc(host) {
  let p1 = 4.76, p2 = 15.7;
  const out = h('div', { class: 'readout' });
  const inp = (lab, v, on) => { const i = h('input', { type: 'number', step: 0.1, value: v, 'aria-label': lab, style: 'width:90px' }); i.addEventListener('input', () => { on(+i.value); draw(); }); return h('label', null, lab + ' ', i); };
  host.append(h('div', { class: 'controls' }, inp('pKa do ácido reagente (HA)', p1, (x) => { p1 = x; }), inp('pKa do ácido produto (HB)', p2, (x) => { p2 = x; })), out);
  function draw() {
    const lk = p2 - p1, dG = -R * 298 * lk * Math.log(10);
    out.innerHTML = `<span>log K ≈ ${fmtP(+p2.toFixed(2))} − ${fmtP(+p1.toFixed(2))} = <b>${fmtP(+lk.toFixed(2))}</b></span><span>K ≈ 10<sup>${fmtP(+lk.toFixed(1))}</sup></span><span>ΔG° ≈ −5,71 × log K = <b>${fmtP(+dG.toFixed(1))} kJ/mol</b></span><span><b>Interpretação:</b> ${lk > 0 ? `o ácido reagente é ${Math.abs(lk) >= 1 ? '10^' + fmtP(+lk.toFixed(1)) + ' vezes' : 'pouco'} mais forte que o ácido produto → equilíbrio deslocado para os <b>produtos</b>.` : lk < 0 ? 'o ácido produto é mais forte → o equilíbrio fica do lado dos <b>reagentes</b>.' : 'mesma força: K = 1.'}</span>`;
  }
  draw();
}

/* ===================================================================
 * Comparador de bases conjugadas
 * =================================================================== */
const CBC = [
  { a: 'EtOH', b: 'AcOH', k3: ['ethoxide', 'acetate'], sa: () => ethoxide(), sb: () => acetate(0), f: { res: 'acetato: carga distribuída entre 2 O (ressonância)', en: 'carga em O nos dois', hyb: 'O nos dois casos', ind: 'C=O vizinha retira densidade no acetato' }, best: 'b' },
  { a: 'C2H6', b: 'HCCH', k3: ['CH3m', 'acetylide'], sa: () => SP.methyl_anion(), sb: () => SP.acetylide(), f: { res: 'nenhuma nos dois', en: 'carga em C nos dois', hyb: 'sp³ (25% s) × sp (50% s)', ind: '—' }, best: 'b' },
  { a: 'NH3', b: 'H2O', k3: ['NH2', 'HO'], sa: () => SP.amide(), sb: () => SP.hydroxide(), f: { res: 'nenhuma', en: 'N (3,0) × O (3,4)', hyb: 'ambos ≈ sp³', ind: '—' }, best: 'b' },
];
export function cbCompare(host) {
  let i = 0;
  const box = h('div'), fb = fbBox(), tg = h('div', { class: 'controls' });
  host.append(h('div', { class: 'controls' }, ...CBC.map((c, k) => btn(`${A[c.a].b} × ${A[c.b].b}`, () => { i = k; draw(); }))), box, tg, fb);
  function draw() {
    const c = CBC[i]; box.innerHTML = ''; fb.style.display = 'none'; tg.innerHTML = '';
    const info = h('div', { class: 'factors' });
    box.append(h('div', { class: 'grid2' }, fig(sk(c.sa()), A[c.a].b), fig(sk(c.sb()), A[c.b].b)), info);
    [['res', 'ressonância'], ['en', 'eletronegatividade'], ['hyb', 'hibridização'], ['ind', 'grupos indutivos']].forEach(([k, t]) => tg.append(btn(t, () => { info.append(h('div', { class: 'fchip', html: `<b>${t}:</b> ${c.f[k]}` })); })));
    tg.append(btn('Mapa eletrostático 3D', () => { const d = h('div'); info.append(d); espCompare(d, c.k3[0], c.k3[1], { range: 0.6 }); }));
    tg.append(h('b', null, ' Qual é mais estável? '), btn(A[c.a].b, () => ans('a')), btn(A[c.b].b, () => ans('b')));
  }
  function ans(x) { const c = CBC[i], best = c[c.best]; setFb(fb, x === c.best ? 'ok' : 'bad', `${x === c.best ? '✔' : '✘'} ${A[best].b} é mais estável → <b>${A[best].f}</b> é o ácido mais forte (pKa ${fmtP(A[best].pKa)} × ${fmtP(A[c.best === 'a' ? c.b : c.a].pKa)}).`); }
  draw();
}

/* ===================================================================
 * Ferramenta de raciocínio + simulador de acidez
 * =================================================================== */
const QUEST = ['A base conjugada tem ressonância?', 'Em qual átomo fica a carga?', 'Qual a eletronegatividade desse átomo?', 'Qual o tamanho desse átomo?', 'Qual a hibridização?', 'Existe efeito indutivo?', 'Qual a força da ligação H–A?', 'Há vários fatores ao mesmo tempo?'];
export function reasonTool(host) {
  host.append(h('ol', { class: 'reason' }, QUEST.map((q) => h('li', null, q))), h('p', { class: 'hint3' }, 'Não existe uma regra única: responda às perguntas para as duas bases conjugadas e veja qual fator realmente as diferencia.'));
}
export function aciditySim(host) {
  let P = null;
  const stage = h('div'), fb = fbBox();
  host.append(stage, fb, h('div', { class: 'controls' }, btn('Outro par →', () => next(), 'primary')));
  function next() {
    P = pick(PAIRS); fb.style.display = 'none'; stage.innerHTML = '';
    const order = shuffle([P.a, P.b]);
    const chk = FACTORS.map(([k, t]) => { const c = h('input', { type: 'checkbox', value: k }); return h('label', { class: 'chk' }, c, ' ' + t); });
    stage.append(h('p', { class: 'prompt', html: `<b>${A[order[0]].f}</b> × <b>${A[order[1]].f}</b>` }), h('p', null, '1. Marque os fatores que você considera relevantes:'), h('div', { class: 'chks' }, chk), h('p', null, '2. Qual é o ácido mais forte?'), h('div', { class: 'controls' }, ...order.map((k) => btn(A[k].f, () => ans(k, chk)))));
  }
  function ans(k, chk) {
    const marked = chk.map((l) => l.querySelector('input')).filter((c) => c.checked).map((c) => c.value);
    const okF = P.f.every((f) => marked.includes(f)), extra = marked.filter((f) => !P.f.includes(f));
    setFb(fb, k === P.a ? 'ok' : 'bad', `${k === P.a ? '✔' : '✘'} Mais ácido: <b>${A[P.a].f}</b> (pKa ≈ ${fmtP(A[P.a].pKa)}) × ${A[P.b].f} (pKa ≈ ${fmtP(A[P.b].pKa)}).<br><b>Análise:</b> ${P.why}<br><b>Fator predominante:</b> ${P.f.map((f) => FNAME[f]).join(' + ')}. ${okF ? '✔ Você marcou o fator certo.' : '✘ Você não marcou o fator principal.'}${extra.length ? ` (Marcados sem papel decisivo aqui: ${extra.map((f) => FNAME[f]).join(', ')}.)` : ''}`);
  }
  next();
}
export function rankEx(host) {
  const d = h('div');
  host.append(d);
  sortable(d, { items: ['AcOH', 'H2O', 'HCCH', 'NH3', 'CH4'].map((k) => ({ id: k, label: `${A[k].f}` })), correct: ['AcOH', 'H2O', 'HCCH', 'NH3', 'CH4'], top: 'ácido mais forte', bottom: 'mais fraco', explain: 'CH₃COOH (4,8; ressonância no acetato) > H₂O (15,7; carga em O) > HC≡CH (25; carga em C sp) > NH₃ (38; N menos eletronegativo que O) > CH₄ (≈ 48; carga em C sp³). Compare: H₂O × NH₃ (eletronegatividade), HC≡CH × CH₄ (hibridização), NH₃ × HC≡CH (sp do C compensa a menor eletronegatividade).' });
}
export function baseEx(host) {
  const keys = ['C2H6', 'NH3', 'H2O', 'HF', 'AcOH', 'HCCH'];
  const fb = fbBox();
  host.append(h('p', { class: 'prompt' }, 'Qual é a base mais forte?'), h('div', { class: 'controls' }, ...shuffle(keys).map((k) => btn(A[k].b, () => setFb(fb, k === 'C2H6' ? 'ok' : 'bad', `${k === 'C2H6' ? '✔' : '✘'} A base mais forte é a conjugada do ácido <b>mais fraco</b> (maior pKa): CH₃CH₂⁻ (pKa do etano ≈ 50). Ordem de basicidade: ${keys.slice().sort((x, y) => A[y].pKa - A[x].pKa).map((x) => A[x].b).join(' > ')}.`)))), fb);
}

/* ===================================================================
 * Simulador de setas curvas e montagem de mecanismo
 * =================================================================== */
export function arrowSim(host) {
  const box = h('div'), title = h('p', { class: 'prompt' });
  host.append(h('div', { class: 'controls' }, select(PUZZLES.map((p, k) => [String(k), p.title]), '0', (k) => load(+k), 'Reação')), title, box);
  function load(k) { const P = PUZZLES[k]; box.innerHTML = ''; title.innerHTML = `<b>${P.title}</b> — ${P.intro}`; arrowPuzzle(box, P.puzzle()); }
  load(0);
}
export function mechBuilder(host) {
  let k = 0;
  const box = h('div'), t = h('p', { class: 'prompt' }), bar = h('div', { class: 'timeline' });
  host.append(h('p', null, h('b', null, MECH_BUILD.title)), bar, t, box, h('div', { class: 'controls' }, btn('◀ Etapa anterior', () => go(k - 1)), btn('Próxima etapa ▶', () => go(k + 1), 'primary')));
  function go(n) {
    k = Math.max(0, Math.min(MECH_BUILD.steps.length - 1, n));
    bar.innerHTML = ''; MECH_BUILD.steps.forEach((s, i) => bar.append(h('button', { type: 'button', class: i === k ? 'on' : '', onclick: () => go(i) }, h('b', null, String(i + 1)), ' ' + s.t.split('—')[1])));
    t.innerHTML = MECH_BUILD.steps[k].t; box.innerHTML = ''; arrowPuzzle(box, MECH_BUILD.P(MECH_BUILD.steps[k].key));
  }
  go(0);
}

/* ===================================================================
 * Conservação de carga
 * =================================================================== */
const CHG = [
  ['HO⁻ + HCl → H₂O + Cl⁻', '−1', '−1', true], ['NH₃ + HCl → NH₄⁺ + Cl⁻', '0', '0', true], ['CH₃O⁻ + H₂O → CH₃OH + HO⁻', '−1', '−1', true],
  ['(CH₃)₃C⁺ + H₂O → (CH₃)₃COH₂⁺', '+1', '+1', true], ['HO⁻ + CH₃Br → CH₃OH + Br', '−1', '0', false], ['NH₃ + BF₃ → H₃N–BF₃ (com cargas +1 e −1)', '0', '0', true], ['CH₃COOH + HO⁻ → CH₃COO⁻ + H₃O⁺', '−1', '0', false],
];
export function chargeEx(host) {
  CHG.forEach(([r, a, b, ok], i) => {
    const fb = fbBox();
    host.append(h('div', { class: 'chgrow' }, h('span', { class: 'rx' }, r), btn('conservada', () => setFb(fb, ok ? 'ok' : 'bad', `${ok ? '✔' : '✘'} carga inicial ${a}, final ${b}. ${ok ? 'Conservada.' : 'Não conservada: a equação está errada (' + (i === 4 ? 'o produto deve ser Br⁻' : 'o produto da água seria H₂O, não H₃O⁺') + ').'}`)), btn('não conservada', () => setFb(fb, !ok ? 'ok' : 'bad', `${!ok ? '✔' : '✘'} carga inicial ${a}, final ${b}.`)), fb));
  });
}
export { FACTORS };
