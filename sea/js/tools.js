/*
 * tools.js — laboratório aromático 3D, simulador de substituintes e de
 * regiosseletividade e simulador de mecanismo (setas curvas validadas).
 */
import { h, seg, tgl } from './widgets2d.js';
import { S } from './chem2d.js';
import { MOLS } from './arom.js';
import { svgS } from './arom2d.js';
import { aromScene } from './a3d.js';
import { fb, clear, sel, vbox, legend, PI_LEGEND } from './ui.js';
import { SUBS, LABMOLS, LAB_KEYS, RX, rel, REL_NAME, barrier, regio, compat, rankText, espCharges } from './sub.js';
import { ringDraw, ringSVG2, OUT } from './sea2d.js';
import { subScene } from './sea3d.js';
import { subCard, sigmaCompare, subOpts } from './mods2.js';

const DIRTXT = { op: 'orto/para', m: 'meta' };
/* ===================================================================
 * Laboratório 3D
 * =================================================================== */
export function lab3d(host) {
  let key = 'anisol';
  const st = { style: 'ball', p: false, cloud: true, esp: false, opm: true, e: false };
  const v = vbox('tall'), side = h('div'), pickOut = h('div', { 'aria-live': 'polite' });
  const subsOf = () => LABMOLS[key].subs;
  const A = subScene(v, subsOf(), { dist: 11.5, onPick: (i) => pick(i) });
  const apply = () => { const subs = subsOf(); Object.assign(A.st, { style: st.style, p: st.p, cloud: st.cloud && !st.esp, e: st.e, opm: st.opm && Object.keys(subs).length ? 0 : null, esp: st.esp ? espCharges(subs) : null }); A.setSubs(subs); info(); };
  const info = () => {
    const M = LABMOLS[key], k = M.subs[0];
    clear(side).append(h('div', { class: 'readout' }, h('span', null, h('b', null, M.name), ' · ' + M.f)), h('div', { class: 'figs' }, ringSVG2({ kek: 'A', subs: M.subs }, { scale: 34, fs: 15 })), k ? subCard(k) : fb('neutral', 'Benzeno: as seis posições são equivalentes.'), pickOut);
  };
  function pick(i) {
    const k = subsOf()[0];
    if (i >= 6) { pickOut.replaceChildren(fb('neutral', 'Clique num carbono do anel.')); return; }
    if (!k) { pickOut.replaceChildren(fb('neutral', 'No benzeno todas as posições são equivalentes.')); return; }
    const r = rel(0, i);
    if (r === 'ipso') { pickOut.replaceChildren(fb('neutral', 'Carbono ipso (ligado ao substituinte).')); return; }
    const S0 = SUBS[k], fav = (S0.dir === 'op' ? ['o', 'p'] : ['m']).includes(r);
    const why = h('details', { class: 'why' }, h('summary', null, '🔍 Por que esta posição?'), h('div'));
    why.addEventListener('toggle', () => { const d = why.lastChild; if (!d.childElementCount) sigmaCompare(d, { key: k, fixed: true }); });
    pickOut.replaceChildren(fb(fav ? 'ok' : 'bad', `C${i + 1}: posição <b>${REL_NAME[r]}</b> — ${fav ? 'favorecida' : 'desfavorecida'} para SEA em ${M_(key)} (–${S0.lab}: ${DIRTXT[S0.dir]}).`), why);
  }
  const M_ = (k) => LABMOLS[k].name;
  host.append(
    h('div', { class: 'controls' }, h('label', null, 'Molécula: ', sel(LAB_KEYS.map((k) => [k, LABMOLS[k].name]), key, (k) => { key = k; pickOut.replaceChildren(); apply(); }, 'molécula')), seg([['ball', 'bola-vareta'], ['space', 'preenchimento']], 'ball', (k) => { st.style = k; apply(); }, 'modelo')),
    h('div', { class: 'controls' }, ...[['Orbitais p', 'p'], ['Nuvem π', 'cloud'], ['Mapa de densidade', 'esp'], ['Orto/meta/para', 'opm']].map(([t, k]) => tgl(t, () => { st[k] = !st[k]; apply(); return st[k]; }, st[k]))),
    h('div', { class: 'grid2' }, v, side), PI_LEGEND(), legend([['#3ddc97', 'orto (C2/C6)'], ['#b18cff', 'meta (C3/C5)'], ['#2fd4f5', 'para (C4)']]), h('p', { class: 'hint3' }, 'Clique num carbono do anel no modelo 3D para ver a relação com o substituinte.'));
  apply();
}

/* ===================================================================
 * Simulador de substituintes (#64)
 * =================================================================== */
export function subSim(host) {
  let key = 'OCH3';
  const v = vbox(), side = h('div');
  const A = subScene(v, { 0: key }, { dist: 11.5, cloud: false, esp: true, opm: 0, opmOnly: ['o', 'p'] });
  const go = () => { const S0 = SUBS[key]; A.st.opmOnly = S0.dir === 'op' ? ['o', 'p'] : ['m']; A.setSubs({ 0: key }); clear(side).append(subCard(key), fb(S0.rank > 0 ? 'ok' : 'bad', `Velocidade: ${rankText(S0.rank)}.<br>Regiões favorecidas (destacadas no 3D): <b>${DIRTXT[S0.dir]}</b>.`)); };
  host.append(h('div', { class: 'controls' }, h('label', null, 'Substituinte: ', sel(subOpts(), key, (k) => { key = k; go(); }, 'substituinte'))), h('div', { class: 'grid2' }, v, side), legend([['#f05a4a', 'mais rico em densidade π'], ['#5b8cff', 'mais pobre']]));
  go();
}

/* ===================================================================
 * Simulador de regiosseletividade (#65–66)
 * =================================================================== */
const REGIO_SUBS = ['OCH3', 'CH3', 'NO2', 'Cl', 'Br', 'OH', 'NHCOCH3', 'CHO', 'COCH3', 'COOH', 'CN', 'tBu', 'CF3', 'NH2'];
const RXSIM = ['nitr', 'brom', 'sulf', 'alq', 'acil'];
export function regioSim(host) {
  let key = 'CH3', rx = 'nitr', answered = false;
  const fig = h('div', { class: 'figs' }), q = h('div'), out = h('div', { 'aria-live': 'polite' });
  const draw = () => {
    answered = false;
    clear(fig).append(h('figure', { class: 'fig' }, ringSVG2({ kek: 'A', subs: { 0: key }, notes: { 1: 'o', 2: 'm', 3: 'p', 4: 'm', 5: 'o' }, ncls: 'pos' }, { scale: 40, fs: 16 }), h('figcaption', null, `${SUBS[key].ex} + ${RX[rx].short}`)));
    clear(out);
    clear(q).append(h('p', { class: 'prompt' }, 'Onde ocorrerá preferencialmente a nova substituição?'), h('div', { class: 'ch-answers' }, [['o', 'orto'], ['m', 'meta'], ['p', 'para'], ['op', 'orto + para']].map(([k, t]) => h('button', { class: 'btn', type: 'button', onclick: (e) => answer(k, e.currentTarget) }, t)), h('button', { class: 'btn ghost', type: 'button', onclick: (e) => answer('none', e.currentTarget) }, 'não reage (nessas condições)')));
  };
  const answer = (k, btn) => {
    if (answered) return; answered = true;
    const S0 = SUBS[key], c = compat(rx, { 0: key });
    const truth = !c.ok ? 'none' : S0.dir === 'm' ? 'm' : 'op';
    const ok = k === truth || (truth === 'op' && k === 'p' && S0.bulk >= 2.5);
    btn.classList.add(ok ? 'primary' : 'ghost');
    const res = regio({ 0: key });
    const pp = { o: barrier(key, 'o'), m: barrier(key, 'm'), p: barrier(key, 'p') };
    const major = truth === 'none' ? null : truth === 'm' ? 'meta' : pp.o + 1.5 < pp.p ? 'orto' : S0.bulk >= 2 ? 'para (bem majoritário: grupo volumoso)' : 'para e orto (para geralmente favorecido; há 2 posições orto)';
    const prod = truth === 'none' ? null : ringSVG2({ kek: 'hyb', subs: truth === 'm' ? { 0: key, 2: RX[rx].E } : { 0: key, 3: RX[rx].E } }, { scale: 30, fs: 13 });
    const prodO = truth === 'op' ? ringSVG2({ kek: 'hyb', subs: { 0: key, 1: RX[rx].E } }, { scale: 30, fs: 13 }) : null;
    const why = h('details', { class: 'why' }, h('summary', null, '🔍 Por que esta posição? (complexos σ)'), h('div'));
    why.addEventListener('toggle', () => { const d = why.lastChild; if (!d.childElementCount) sigmaCompare(d, { key, fixed: true }); });
    out.replaceChildren(fb(ok ? 'ok' : 'bad', ok ? '✔ Correto — veja o raciocínio completo:' : '✘ Não é essa. Raciocínio completo:'),
      h('ol', { class: 'steps reason' },
        h('li', { html: `<b>Natureza do substituinte:</b> –${S0.lab} (${S0.name}).` }),
        h('li', { html: `<b>Ativador ou desativador:</b> ${S0.cls} → ${rankText(S0.rank)}.` }),
        h('li', { html: `<b>Ressonância:</b> ${S0.R}.` }),
        h('li', { html: `<b>Indução:</b> ${S0.I}.` }),
        h('li', { html: `<b>Intermediários:</b> ${S0.dir === 'm' ? 'nos complexos σ orto/para a carga + chega ao carbono ligado ao grupo retirador (contribuinte muito desfavorável); no meta, não.' : S0.halogen ? 'nos complexos σ orto/para o par do halogênio fornece um contribuinte extra (+R), embora o −I desative o anel.' : S0.donor ? 'nos complexos σ orto/para o par do heteroátomo gera um contribuinte extra com octetos completos.' : 'nos complexos σ orto/para a carga + fica num carbono terciário vizinho ao alquila (estabilização).'} Barreiras relativas: orto ${pp.o.toFixed(0)}, meta ${pp.m.toFixed(0)}, para ${pp.p.toFixed(0)} (benzeno = 50; unid. arbitrárias).` }),
        h('li', { html: `<b>Efeito estérico:</b> ${S0.bulk >= 2.5 ? 'grupo volumoso: orto fortemente desfavorecido.' : S0.bulk >= 1.5 ? 'moderado: favorece relativamente para.' : 'pequeno; ainda assim para costuma superar orto por posição.'}` }),
        h('li', { html: `<b>Produto majoritário provável:</b> ${major || '—'}.${c.msgs.length ? ' ' + c.msgs.join(' ') : ''}` })),
      prod ? h('div', { class: 'figs' }, prod, prodO) : null, why);
    void res;
  };
  host.append(h('div', { class: 'controls' }, h('label', null, 'Substrato: ', sel(REGIO_SUBS.map((k) => [k, SUBS[k].ex]), key, (k) => { key = k; draw(); }, 'substrato')), h('label', null, 'Reação: ', sel(RXSIM.map((k) => [k, RX[k].name]), rx, (k) => { rx = k; draw(); }, 'reação'))), h('div', { class: 'grid2' }, fig, q), out);
  draw();
}

/* ===================================================================
 * Simulador de mecanismo com setas curvas validadas (#86–88)
 * =================================================================== */
const MECH_RX = {
  brom: { E: 'Br', Elab: 'Br', ok: 'Br₂ ativado (Br–Br⁺–Fe⁻Br₃): o Br terminal δ+', wrong: ['Br⁻ (brometo)', 'FeBr₃ isolado', 'Br• (radical)'], base: 'FeBr₄⁻', side: 'Br–FeBr₃' },
  nitr: { E: 'NO₂', Elab: 'NO₂', ok: 'NO₂⁺ (íon nitrônio)', wrong: ['NO₃⁻ (nitrato)', 'HNO₃ neutro', 'H₂SO₄'], base: 'HSO₄⁻', side: '' },
  acil: { E: 'COCH₃', Elab: 'C', ok: 'CH₃C≡O⁺ (íon acílio)', wrong: ['CH₃COCl sem ativação', 'AlCl₄⁻', 'CH₃⁺ (metila)'], base: 'AlCl₄⁻', side: '' },
};
export function mechSim(host) {
  let rx = 'brom', step = 0, from = null, hist = [];
  const stage = h('div', { class: 'figs mechsim' }), q = h('div'), out = h('div', { 'aria-live': 'polite' }), prog = h('ol', { class: 'msteps' });
  const STEPS = ['eletrófilo', 'seta do ataque', 'carga no complexo σ', 'ressonância (2ª forma)', 'ressonância (3ª forma)', 'base → H', 'C–H → anel', 'aromaticidade'];
  const pos = (s, i) => s.atoms[i];
  // monta a estrutura de cada etapa com índices conhecidos
  function build() {
    const M = MECH_RX[rx], s = new S(); const T = {};
    if (step <= 1) {
      const r = ringDraw(s, { dbl: [[0, 1], [2, 3], [4, 5]], H: [0] }); T.ring = r.id; T.H = r.extra.H0;
      const a = OUT(0) + 62; const c = pos(s, r.id[0]);
      T.E = s.a(c[0] + Math.cos(a * Math.PI / 180) * 2.1, c[1] - Math.sin(a * Math.PI / 180) * 2.1, M.E, { cls: 'elec', chg: rx === 'brom' ? 'δ+' : '+' });
      if (M.side) { const x = s.a(pos(s, T.E)[0] - 1.3, pos(s, T.E)[1] - 0.2, M.side, { cls: 'cat' }); s.b(T.E, x, 1); T.X = x; }
    } else {
      const forms = [{ plus: 1, dbl: [[2, 3], [4, 5]] }, { plus: 3, dbl: [[1, 2], [4, 5]] }, { plus: 5, dbl: [[1, 2], [3, 4]] }];
      const f = step === 2 ? { plus: null, dbl: forms[0].dbl } : step === 3 ? forms[0] : step === 4 ? forms[1] : step === 5 || step === 6 ? forms[0] : null;
      if (f) { const r = ringDraw(s, { dbl: f.dbl, plus: f.plus, sp3: { pos: 0, E: M.E } }); T.ring = r.id; T.H = r.extra.H; T.Esub = r.extra.E; if (step >= 5) { const hp = pos(s, T.H); T.B = s.a(hp[0] + 1.5, hp[1] - 0.6, M.base.replace('⁻', ''), { cls: 'base', chg: '−', lp: [180] }); } }
      else { const r = ringDraw(s, { kek: 'hyb' }); const k = s.br(r.id[0], 90, M.E, 1); s.atoms[k][3] = { cls: 'elec' }; T.ring = r.id; }
    }
    hist.forEach((a) => s.arrow(a.from, a.to, a.bend ?? 0.45, a.cls || ''));
    return { s, T };
  }
  const isB = (t, a, b) => t && t.type === 'b' && ((t.a === a && t.b === b) || (t.a === b && t.b === a));
  // validação: devolve [ok, msg, seta]
  function validate(T, f, t) {
    const R = T.ring;
    if (step === 1) {
      if (f.type === 'a' && f.i === T.E) return [false, 'A seta parte de uma <b>fonte de elétrons</b> (o par π do anel, nucleófilo) e vai para o eletrófilo — nunca do eletrófilo para o anel.'];
      if (f.type === 'b' && !isB(f, R[0], R[1]) && [[2, 3], [4, 5]].some(([x, y]) => isB(f, R[x], R[y]))) return [false, 'Esse par π está longe do eletrófilo. Use a ligação π que contém o carbono mais próximo do E (C1).'];
      if (f.type === 'b' && !isB(f, R[0], R[1])) return [false, 'Ligações σ (simples, C–C ou C–H) não fazem o ataque: use um par de elétrons π (ligação dupla).'];
      if (f.type === 'a') return [false, 'Um átomo do anel sem par isolado não é a origem: os elétrons que atacam são os da ligação π.'];
      if (!(t.type === 'a' && t.i === T.E)) return [false, 'A seta deve terminar no <b>eletrófilo</b>, onde se forma a nova ligação C–E.'];
      return [true, '✔ O par π C1=C2 forma a ligação C1–E.', { from: { b: [R[0], R[1]] }, to: { a: T.E, ang: 240 }, bend: -0.35 }];
    }
    if (step === 3 || step === 4) {
      const [o1, o2, d1, d2] = step === 3 ? [2, 3, 1, 2] : [4, 5, 3, 4];
      if (!(f.type === 'b' && isB(f, R[o1], R[o2]))) return [false, step === 3 ? 'Origem: o par π <b>vizinho</b> ao carbono positivo (C3=C4).' : 'Origem: o par π vizinho ao novo carbono positivo (C5=C6).'];
      if (!((t.type === 'b' && isB(t, R[d1], R[d2])) || (t.type === 'a' && t.i === R[d1]))) return [false, `Destino: entre o carbono + (C${d1 + 1}) e seu vizinho, formando a nova ligação π.`];
      return [true, `✔ A carga + passa para C${o2 + 1}.`, { from: { b: [R[o1], R[o2]] }, to: { b: [R[d1], R[d2]] }, bend: 0.55 }];
    }
    if (step === 5) {
      if (!(f.type === 'a' && f.i === T.B)) return [false, 'Primeiro: a <b>base</b> usa um par isolado para capturar o H⁺.'];
      if (t.type === 'a' && t.i === T.Esub) return [false, 'O grupo que sai é o <b>H⁺</b>, não o eletrófilo recém-ligado.'];
      if (!(t.type === 'a' && t.i === T.H)) return [false, 'A base deve atacar o <b>H do carbono sp³</b> (os H dos carbonos sp² não são removidos).'];
      return [true, '✔ A base captura o H⁺.', { from: { lp: [T.B, 180] }, to: { a: T.H, ang: 0 }, bend: 0.3, cls: 'o' }];
    }
    if (step === 6) {
      if (f.type === 'b' && (isB(f, R[0], T.Esub))) return [false, 'A ligação C–E deve permanecer: é a ligação C–<b>H</b> que se rompe.'];
      if (!(f.type === 'b' && isB(f, R[0], T.H))) return [false, 'Origem: o par da ligação <b>C–H</b> que está sendo rompida.'];
      if (t.type === 'b' && isB(t, R[0], R[5])) return [false, 'C6 não tem carga +: o par deve formar a ligação π com o carbono <b>positivo (C2)</b>.'];
      if (!((t.type === 'b' && isB(t, R[0], R[1])) || (t.type === 'a' && t.i === R[1]))) return [false, 'Destino: a ligação C1–C2, com o carbono positivo — assim se forma a C=C e o sexteto se completa.'];
      return [true, '✔ O par C–H volta ao anel: C1 volta a ser sp².', { from: { b: [R[0], T.H] }, to: { b: [R[0], R[1]] }, bend: -0.5 }];
    }
    return [false, ''];
  }
  let A3 = null;
  function render() {
    const { s, T } = build();
    const svg = svgS(s, { scale: 50, fs: 19, zoom: 1.35, animate: true });
    clear(stage).append(svg);
    clear(prog).append(...STEPS.map((t, i) => h('li', { class: i < step ? 'done' : i === step ? 'cur' : '' }, t)));
    if (A3) { A3.v.dispose(); A3 = null; }
    const arrowStep = [1, 3, 4, 5, 6].includes(step), pickStep = step === 2;
    if (arrowStep || pickStep) {
      const C = svg._chem, NS = 'http://www.w3.org/2000/svg', g = document.createElementNS(NS, 'g'); g.setAttribute('transform', C.transform); svg.append(g);
      const mk = (tag, at, t) => { const e = document.createElementNS(NS, tag); Object.entries(at).forEach(([k, v]) => e.setAttribute(k, v)); e.setAttribute('tabindex', 0); e.setAttribute('role', 'button'); const f = () => click(t, e, T); e.addEventListener('click', f); e.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); f(); } }); g.append(e); return e; };
      if (arrowStep) s.bonds.forEach(([a, b]) => { const p = C.atoms[a], q2 = C.atoms[b]; mk('line', { x1: p.x, y1: p.y, x2: q2.x, y2: q2.y, class: 'hitb', 'aria-label': 'ligação' }, { type: 'b', a, b }); });
      s.atoms.forEach((_, i) => { const p = C.atoms[i]; if (pickStep && !T.ring.includes(i)) return; mk('circle', { cx: p.x, cy: p.y, r: 15, class: 'hita', 'aria-label': 'átomo' }, { type: 'a', i }); });
    }
    const QS = {
      1: 'Desenhe a seta do ataque: clique na <b>origem</b> (fonte de elétrons) e depois no <b>destino</b>.',
      2: 'Complexo σ formado. Clique no carbono que ficou com a <b>carga positiva</b>.',
      3: 'Desenhe a seta que gera o <b>2º contribuinte</b> de ressonância (origem → destino).',
      4: 'Agora a seta que gera o <b>3º contribuinte</b>.',
      5: 'Desprotonação: desenhe a seta da <b>base</b> até o H correto.',
      6: 'Desenhe a seta que <b>restaura a aromaticidade</b> (o par da ligação C–H).',
    };
    if (step === 0) {
      const M = MECH_RX[rx], opts = [M.ok, ...M.wrong].sort(() => Math.random() - 0.5);
      clear(q).append(h('p', { class: 'prompt' }, `${RX[rx].name} (${RX[rx].short}). Qual é o eletrófilo efetivo?`), h('div', { class: 'ch-answers col' }, opts.map((t) => h('button', { class: 'btn', type: 'button', onclick: () => { if (t === M.ok) { out.replaceChildren(fb('ok', '✔ ' + RX[rx].elec + '.')); step = 1; render(); } else out.replaceChildren(fb('bad', `✘ ${t} não é o eletrófilo efetivo: ${rx === 'nitr' ? 'NO₃⁻ e HNO₃ não são deficientes em elétrons o suficiente; o H₂SO₄ protona o HNO₃ e gera NO₂⁺.' : rx === 'brom' ? 'o Br₂ precisa ser ativado pelo ácido de Lewis (Br⁻ é nucleófilo; não se forma Br⁺ livre).' : 'o AlCl₃ remove o Cl⁻ e gera o íon acílio (estabilizado por ressonância).'}`)); } }, t))));
    } else if (step === 7) {
      const v = vbox('short');
      clear(q).append(fb('ok', '✔ Mecanismo completo: o par da ligação C–H forma a C=C e o anel recupera os 6 orbitais p contínuos — <b>aromaticidade restaurada</b>.'), v, h('button', { class: 'btn sm', type: 'button', onclick: () => { step = 0; hist = []; out.replaceChildren(); render(); } }, '↺ Recomeçar'));
      A3 = aromScene(v, MOLS.benzeno, { cloud: true, hint: false, dist: 10, sub: rx === 'brom' ? 'Br' : rx === 'nitr' ? 'N' : 'C' });
    } else clear(q).append(h('p', { class: 'prompt', html: QS[step] }), from ? h('p', { class: 'hint3' }, 'Origem selecionada — agora clique no destino.') : null);
  }
  function click(t, e, T) {
    if (step === 2) {
      const R = T.ring;
      if (t.i === R[1]) { out.replaceChildren(fb('ok', '✔ C2 perdeu seu par π (que formou C1–E): fica com orbital p vazio, carga +. C1 agora é sp³.')); step = 3; hist = []; render(); }
      else if (t.i === R[0]) out.replaceChildren(fb('bad', '✘ C1 agora tem quatro ligações (anel ×2, H e E): é sp³ e neutro.'));
      else out.replaceChildren(fb('bad', '✘ Esse carbono continua numa ligação dupla. A carga + fica no carbono que “perdeu” o par π usado no ataque.'));
      return;
    }
    if (!from) { from = t; e.classList.add('sel'); clear(q.querySelector('.hint3') || h('i')); q.append(h('p', { class: 'hint3' }, 'Origem selecionada — agora clique no destino.')); return; }
    const [ok, msg, arrow] = validate(T, from, t);
    from = null;
    out.replaceChildren(fb(ok ? 'ok' : 'bad', ok ? msg : '✘ ' + msg));
    if (!ok) { render(); return; }
    if (step === 5) { hist = [arrow]; step = 6; render(); return; }
    hist.push(arrow);
    const showFor = () => { hist = []; step = { 1: 2, 3: 4, 4: 5, 6: 7 }[step]; render(); };
    render();
    setTimeout(showFor, 1300);
  }
  host.append(h('div', { class: 'controls' }, h('label', null, 'Reação: ', sel(Object.keys(MECH_RX).map((k) => [k, RX[k].name]), rx, (k) => { rx = k; step = 0; hist = []; from = null; out.replaceChildren(); render(); }, 'reação'))), prog, h('div', { class: 'grid2' }, stage, h('div', null, q, out)), h('p', { class: 'hint3' }, 'Setas: origem = par de elétrons (ligação π, par isolado ou ligação σ que se rompe); destino = átomo ou posição da nova ligação. Representação mecanística simplificada.'));
  render();
}
void ringDraw; void regio;
