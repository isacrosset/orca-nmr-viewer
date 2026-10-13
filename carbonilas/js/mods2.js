/*
 * mods2.js — módulos 13–27: reduções (NaBH₄, LiAlH₄, DIBAL-H), perfil de
 * energia sincronizado, estados de oxidação, oxidações (PCC, Jones, KMnO₄,
 * Cr(VI)), oxidação de aldeídos, ozonólise e mapa de interconversões.
 */
import { h, seg, tgl } from './widgets2d.js';
import { S } from './chem2d.js';
import { parseSmiles } from './chem.js';
import { layout, drawSVG } from './depict.js';
import { svgEl, add, profile } from './arom2d.js';
import { COMP, CLS_NAME, REAG, RED, OX, react, molOf, oxState, funcCarbon, ccDoubles, ozonolysis, lookup, NET } from './data.js';
import { sk, fig, figs, svgOf, hydrideFrames, dibalFrames, crFrames, hydrateS, ozoFrames } from './co2d.js';
import { addScene, speciesScene } from './co3d.js';
import { fb, clear, sel, vbox, legend, syncPlayer, energySvg } from './mods1.js';

const arrowRow = (items) => h('div', { class: 'rxrow' }, items.map((x) => (typeof x === 'string' ? h('span', { class: 'rxarr', html: x }) : x)));
const F = (k, cap) => fig(k, { scale: 28, fs: 13, cap });

/* ===================================================================
 * 13. Redução: visão geral
 * =================================================================== */
export function reductionIntro(host) {
  host.append(
    arrowRow([F('butanal'), '→<small>[H]</small>', F('butan1ol', 'álcool primário')]),
    arrowRow([F('butanona'), '→<small>[H]</small>', F('butan2ol', 'álcool secundário')]),
    h('div', { class: 'note key' }, h('b', { class: 't' }, 'Regra visual'), h('p', { html: '<b>aldeído → álcool primário</b> · <b>cetona → álcool secundário</b>. O carbono carbonílico ganha uma ligação C–H e a C=O vira C–OH.' })));
}
export function productQuiz(host) {
  const pool = ['etanal', 'propanona', 'benzaldeido', 'cicloexanona', 'acetofenona', 'butanal', 'butanona', 'pentanal'];
  let k = null;
  const q = h('div'), out = h('div', { 'aria-live': 'polite' });
  const next = () => { k = pool[Math.floor(Math.random() * pool.length)]; const r = react(k, 'NaBH4'); const right = r.prods[0]; const wrong = Object.keys(COMP).filter((x) => COMP[x].cls.startsWith('alcool') && x !== right).sort(() => Math.random() - 0.5).slice(0, 2); const opts = [right, ...wrong].sort(() => Math.random() - 0.5); clear(q).append(h('p', { class: 'prompt' }, `${COMP[k].name} + NaBH₄ (depois H⁺) → ?`), h('div', { class: 'figs' }, F(k)), h('div', { class: 'pickgrid' }, opts.map((o) => h('button', { class: 'pickcard', type: 'button', onclick: () => out.replaceChildren(fb(o === right ? 'ok' : 'bad', o === right ? `✔ ${COMP[right].name} (${CLS_NAME[COMP[right].cls]}).` : `✘ O produto é ${COMP[right].name}: o esqueleto não muda; só a C=O vira CH–OH.`), h('button', { class: 'btn sm', type: 'button', onclick: next }, 'Próxima →')) }, sk(o, { scale: 22, fs: 11 }), h('small', null, COMP[o].name))))); out.replaceChildren(); };
  host.append(q, out); next();
}

/* ===================================================================
 * 14–16. NaBH₄, LiAlH₄ e transferência de hidreto
 * =================================================================== */
const MAP3D = { 0: [0, 0], 1: [0.55, 0], 2: [1, 0], 3: [1, 0.5], 4: [1, 1] };
export function species(host, k, cap) { const v = vbox('short'); host.append(v, h('p', { class: 'cardlab' }, cap)); speciesScene(v, k); }
export function mechNaBH4(host) { syncPlayer(host, hydrideFrames('NaBH4'), { scene: (v) => addScene(v, { r1: 'CH3', r2: 'CH3', nu: 'H', src: 'B', pistar: true, alt: 'Redução da acetona por BH₄⁻' }), map3d: (st) => MAP3D[st] }); }
export function mechLiAlH4(host) { syncPlayer(host, hydrideFrames('LiAlH4'), { scene: (v) => addScene(v, { r1: 'CH3', r2: 'CH3', nu: 'H', src: 'Al', pistar: true, alt: 'Redução da acetona por AlH₄⁻' }), map3d: (st) => MAP3D[st] }); }
export function energyHydride(host) {
  const v = vbox(), rng = h('input', { type: 'range', min: 0, max: 100, value: 0, 'aria-label': 'coordenada da reação' }), en = h('div', { class: 'energywrap' }), out = h('div', { 'aria-live': 'polite' });
  const A = addScene(v, { r1: 'CH3', r2: 'CH3', nu: 'H', src: 'B', pistar: true, alt: 'Transferência de hidreto sincronizada com o perfil de energia' });
  const PTS = [[0, 0, 'cetona + BH₄⁻'], [0.25, 62, 'ET (H⁻ → C)', 'ts'], [0.48, 18, 'alcóxido', 'int'], [0.66, 30, 'ET (H⁺)', 'ts'], [0.88, -22, 'álcool', 'end']];
  let pend = 0;
  const go = () => {
    const x = +rng.value / 100 * 0.88;
    const t = Math.min(1, x / 0.48), p = x <= 0.5 ? 0 : Math.min(1, (x - 0.5) / 0.38);
    A.set(t, p);
    clear(en).append(energySvg(null, PTS, x).svg);
    const g = A.g, C = g.atoms[0].p, O = g.atoms[1].p, Hn = g.atoms[g.info.nuI].p;
    const dCO = Math.hypot(O[0] - C[0], O[1] - C[1], O[2] - C[2]), dCH = Math.hypot(Hn[0] - C[0], Hn[1] - C[1], Hn[2] - C[2]);
    out.replaceChildren(fb('neutral', `C–O ${dCO.toFixed(2).replace('.', ',')} Å · C···H ${dCH.toFixed(2).replace('.', ',')} Å · ${t < 0.5 ? 'C sp²' : 'C sp³'} · ${p > 0.8 ? 'álcool formado' : t > 0.95 ? 'alcóxido (O⁻)' : t > 0.3 ? 'estado de transição: C–H formando, C=O alongando' : 'hidreto equivalente se aproximando (≈ 107°)'}.`));
  };
  rng.addEventListener('input', () => { cancelAnimationFrame(pend); pend = requestAnimationFrame(go); });
  host.append(h('div', { class: 'grid2' }, v, h('div', null, en, out)), h('div', { class: 'range-row' }, h('span', null, 'reagentes'), rng, h('span', null, 'produto')), h('p', { class: 'hint3' }, 'Perfil qualitativo (sem valores universais). Protonação no solvente ou no workup.'));
  go();
}
export function redTable(host) {
  const rows = [['Reatividade', 'mais brando', 'mais forte'], ['Aldeídos', 'sim → álcool 1°', 'sim → álcool 1°'], ['Cetonas', 'sim → álcool 2°', 'sim → álcool 2°'], ['Ésteres', 'geralmente não (condições usuais)', 'sim → álcool 1°'], ['Ácidos carboxílicos', 'não, usualmente', 'sim → álcool 1°'], ['Meio prótico (MeOH, EtOH, H₂O)', 'compatível (reage lentamente)', 'incompatível: reage vigorosamente'], ['Workup separado', 'depende das condições', 'sim (H₃O⁺ após a redução)']];
  host.append(h('div', { class: 'table-wrap' }, h('table', { class: 'cmp' }, h('thead', null, h('tr', null, h('th', null, 'Característica'), h('th', null, 'NaBH₄'), h('th', null, 'LiAlH₄'))), h('tbody', null, rows.map(([a, b, c]) => h('tr', null, h('th', null, a), h('td', null, b), h('td', null, c)))))));
}
/** Qual redutor você escolheria? */
export const REDQ = [
  { sub: 'cicloexanona', goal: 'cicloexanol', best: ['NaBH4', 'LiAlH4'], pref: 'NaBH4', why: 'Cetona → álcool 2°: NaBH₄ basta (mais brando, prático em MeOH). LiAlH₄ também funciona, mas é desnecessariamente reativo.' },
  { sub: 'butanoatoMe', goal: 'butanal', best: ['DIBAL'], pref: 'DIBAL', why: 'Éster → aldeído (redução parcial): DIBAL-H, 1 equiv., −78 °C. LiAlH₄ iria até o álcool; NaBH₄ não reduz ésteres em condições usuais.' },
  { sub: 'butanoatoMe', goal: 'butan1ol', best: ['LiAlH4'], pref: 'LiAlH4', why: 'Éster → álcool 1°: LiAlH₄ (duas transferências de hidreto).' },
  { sub: 'benzoico', goal: 'benzilico', best: ['LiAlH4'], pref: 'LiAlH4', why: 'Ácido carboxílico → álcool 1°: LiAlH₄. NaBH₄ não reduz ácidos usualmente.' },
  { sub: 'butanonitrila', goal: 'butanal', best: ['DIBAL'], pref: 'DIBAL', why: 'Nitrila → aldeído: DIBAL-H (imina de alumínio, hidrolisada no workup). LiAlH₄ daria a amina.' },
  { sub: 'benzaldeido', goal: 'benzilico', best: ['NaBH4', 'LiAlH4'], pref: 'NaBH4', why: 'Aldeído → álcool 1°: NaBH₄ é a escolha simples e seletiva.' },
];
export function redChoice(host) {
  let i = 0;
  const box = h('div'), out = h('div', { 'aria-live': 'polite' });
  const draw = () => {
    const Q = REDQ[i];
    clear(box).append(h('div', { class: 'rxrow' }, F(Q.sub), h('span', { class: 'rxarr' }, '→ ?'), F(Q.goal, 'objetivo: ' + COMP[Q.goal].name)), h('div', { class: 'ch-answers' }, [['NaBH4', 'NaBH₄'], ['LiAlH4', 'LiAlH₄'], ['DIBAL', 'DIBAL-H'], ['outro', 'outro / nenhum desses']].map(([k, t]) => h('button', { class: 'btn', type: 'button', onclick: () => { const ok = Q.best.includes(k); const r = k !== 'outro' ? react(Q.sub, k) : null; out.replaceChildren(fb(ok ? 'ok' : 'bad', `${ok ? (k === Q.pref ? '✔ Ótima escolha.' : '≈ Funciona, mas há escolha mais adequada.') : '✘ Não é a melhor escolha.'} ${r ? `Com ${REAG[k].name}: ${r.ok ? 'forma ' + r.prods.map((p) => COMP[p] ? COMP[p].name : '?').join(' + ') : 'não reage como desejado'}. ` : ''}${Q.why}`), h('button', { class: 'btn sm', type: 'button', onclick: () => { i = (i + 1) % REDQ.length; draw(); } }, 'Próximo caso →')); } }, t))));
    out.replaceChildren();
  };
  host.append(box, out); draw();
}

/* ===================================================================
 * 18. DIBAL-H
 * =================================================================== */
export function mechDIBAL(host) { syncPlayer(host, dibalFrames(), { energy: false }); }
export function dibalScheme(host) {
  host.append(arrowRow([F('butanoatoMe'), '→<small>1. DIBAL-H (1 equiv.), −78 °C<br>2. H₂O/H⁺</small>', F('butanal'), '+', F('metanol')]), arrowRow([F('butanonitrila'), '→<small>1. DIBAL-H<br>2. H₃O⁺</small>', F('butanal')]));
}

/* ===================================================================
 * 19. Estados de oxidação
 * =================================================================== */
export function oxLadder(host) {
  host.append(h('div', { class: 'cmp2' },
    h('div', { class: 'chcard' }, h('h4', null, 'Carbono primário'), h('div', { class: 'ladder2' }, [['butano', '−3'], ['butan1ol', '−1'], ['butanal', '+1'], ['butanoico', '+3']].map(([k, ox]) => h('div', { class: 'lstep' }, F(k), h('b', null, 'C funcional: ' + ox))))),
    h('div', { class: 'chcard' }, h('h4', null, 'Carbono secundário'), h('div', { class: 'ladder2' }, [['propano', '−2'], ['propan2ol', '0'], ['propanona', '+2']].map(([k, ox]) => h('div', { class: 'lstep' }, F(k, k === 'propano' ? 'propano (C central)' : undefined), h('b', null, 'C central: ' + ox)))))),
  h('div', { class: 'cmp2' }, h('div', { class: 'chcard good' }, h('h4', null, 'Oxidação orgânica'), h('p', null, 'mais ligações C–O / C–X · menos ligações C–H')), h('div', { class: 'chcard' }, h('h4', null, 'Redução orgânica'), h('p', null, 'mais ligações C–H · menos ligações C–O / C–X'))),
  h('p', { class: 'hint3' }, 'Heurística útil; não substitui a contagem formal (ex.: formar C–C não altera o nº de oxidação do carbono por esta regra simples).'));
}
export function oxCalc(host) {
  const keys = ['metanol', 'metanal', 'formico', 'etanol', 'etanal', 'acetico', 'propan2ol', 'propanona', 'butanoatoMe', 'butanonitrila'];
  let key = 'etanal';
  const box = h('div', { class: 'figs' }), out = h('div', { 'aria-live': 'polite' });
  const draw = () => {
    const m = parseSmiles(COMP[key].smi), P = layout(m);
    const svg = drawSVG(m, P, { scale: 48, fs: 18, zoom: 1.35, full: true });
    const C = svg._chem, NS = 'http://www.w3.org/2000/svg', g = document.createElementNS(NS, 'g'); g.setAttribute('transform', C.transform); svg.append(g);
    m.atoms.forEach((a, i) => { if (a.el !== 'C') return; const p = C.atoms[svg._s._ids[i]]; const c = document.createElementNS(NS, 'circle'); [['cx', p.x], ['cy', p.y], ['r', 16], ['class', 'pk'], ['tabindex', 0], ['role', 'button'], ['aria-label', 'carbono']].forEach(([x, y]) => c.setAttribute(x, y)); const f = () => { g.querySelectorAll('.pk').forEach((q) => q.classList.remove('on')); c.classList.add('on'); const ox = oxState(m, i); const nO = m.nb[i].filter(({ j }) => m.atoms[j].el !== 'C' && m.atoms[j].el !== 'H').reduce((s, x) => s + x.o, 0); out.replaceChildren(fb('neutral', `Carbono: ${nO} ligação(ões) com átomo mais eletronegativo (+1 cada) e ${m.atoms[i].h} com H (−1 cada); ligações C–C contam 0. Nº de oxidação = <b>${ox > 0 ? '+' : ''}${ox}</b>.`)); }; c.addEventListener('click', f); c.addEventListener('keydown', (e) => { if (e.key === 'Enter') f(); }); g.append(c); });
    clear(box).append(svg); out.replaceChildren(fb('neutral', 'Clique em um carbono.'));
  };
  host.append(h('label', null, 'Molécula: ', sel(keys.map((k) => [k, COMP[k].name]), key, (k) => { key = k; draw(); }, 'molécula')), box, out);
  draw();
}

/* ===================================================================
 * 20–25. Oxidações
 * =================================================================== */
export function oxAlcohols(host) {
  host.append(
    h('div', { class: 'chcard' }, h('h4', null, 'Álcool primário'), arrowRow([F('butan1ol'), '→', F('butanal'), '→', F('butanoico')]), h('p', null, 'O produto final (aldeído ou ácido) depende do oxidante e das condições.')),
    h('div', { class: 'chcard' }, h('h4', null, 'Álcool secundário'), arrowRow([F('butan2ol'), '→', F('butanona')]), h('p', null, 'A cetona não tem H no carbono carbonílico: não há oxidação simples posterior sem quebrar ligação C–C.')),
    h('div', { class: 'chcard bad' }, h('h4', null, 'Álcool terciário'), arrowRow([F('tercbutanol'), '→<small>✕</small>', h('span', { class: 'muted' }, 'sem oxidação usual')]), h('p', null, 'Não há H no carbono que porta o OH: a oxidação comum a C=O exigiria ruptura C–C.')));
}
export function pccJones(host) {
  host.append(h('div', { class: 'cmp2' },
    h('div', { class: 'chcard' }, h('h4', null, 'PCC (CH₂Cl₂ anidro)'), arrowRow([F('pentan1ol'), '→', F('pentanal')]), h('p', null, 'Sem água, o aldeído formado não se hidrata: a superoxidação a ácido é limitada.')),
    h('div', { class: 'chcard' }, h('h4', null, 'Jones (CrO₃, H₂SO₄, acetona/H₂O)'), arrowRow([F('pentan1ol'), '→', F('pentanal'), '⇌<small>H₂O</small>', h('span', { class: 'mono' }, 'hidrato'), '→', F('pentanoico')]), h('p', null, 'Em meio aquoso o aldeído forma o hidrato (gem-diol), que ainda tem H no carbono e é oxidado de novo.'))),
  h('div', { class: 'table-wrap' }, h('table', { class: 'cmp' }, h('thead', null, h('tr', null, ['Substrato', 'PCC', 'Jones'].map((t) => h('th', null, t)))), h('tbody', null, [['álcool 1°', 'aldeído', 'ácido carboxílico'], ['álcool 2°', 'cetona', 'cetona'], ['álcool 3°', 'sem oxidação simples usual', 'sem oxidação simples usual']].map((r) => h('tr', null, r.map((t, i) => h(i ? 'td' : 'th', null, t))))))));
}
export function hydrate(host) {
  const v = vbox('short');
  host.append(h('div', { class: 'grid2' }, h('div', null, h('div', { class: 'figs' }, svgOf(hydrateS(), { scale: 38, fs: 16 })), h('p', { class: 'cardlab' }, 'A extensão da hidratação depende da estrutura: grande para o metanal, intermediária para o etanal, pequena para a maioria das cetonas.')), v));
  speciesScene(v, 'hidrato', { dist: 6 });
}
export function mechCr(host) {
  syncPlayer(host, crFrames(), { scene: (v) => addScene(v, { r1: 'CH3', r2: 'CH3', nu: 'H', mode: 'ox', t: 1, alt: 'Oxidação do propan-2-ol via éster de cromato' }), map3d: (st) => ({ 0: [1, 0], 1: [1, 0], 2: [0.5, 0], 4: [0, 0] })[st] || [0, 0], mapEn: (st) => ({ 0: 0, 1: 2, 2: 3, 4: 4 })[st], pts: [[0, 0, 'álcool + Cr(VI)'], [0.22, 40, 'ET', 'ts'], [0.42, 15, 'éster de cromato', 'int'], [0.62, 55, 'ET (E2-like)', 'ts'], [0.88, -30, 'cetona + Cr(IV)', 'end']] });
}
export function oxSlider(host) {
  const v = vbox(), rng = h('input', { type: 'range', min: 0, max: 100, value: 0, 'aria-label': 'progresso da oxidação' }), out = h('div', { 'aria-live': 'polite' });
  const A = addScene(v, { r1: 'CH3', r2: 'CH3', nu: 'H', mode: 'ox', t: 1, alt: 'Oxidação: carbono sp³ → sp²' });
  const go = () => { const p = +rng.value / 100; A.set(1 - p, 0); out.replaceChildren(fb(p > 0.7 ? 'ok' : 'neutral', p < 0.3 ? 'Éster de cromato: C sp³ com H, O–Cr(VI).' : p < 0.7 ? 'A base remove o H do carbono; forma-se a π C=O enquanto a ligação O–Cr se rompe.' : 'Cetona (C sp²) formada; cromo reduzido (Cr(VI) → Cr(IV)).')); };
  rng.addEventListener('input', go);
  host.append(v, h('div', { class: 'range-row' }, h('span', null, 'C sp³ (álcool)'), rng, h('span', null, 'C sp² (cetona)')), out);
  go();
}
export function aldehydeOx(host) {
  host.append(arrowRow([F('benzaldeido'), '→<small>Jones, KMnO₄, Ag⁺…</small>', F('benzoico')]), arrowRow([F('acetofenona'), '→<small>oxidante usual</small>', h('span', { class: 'muted' }, 'sem oxidação simples (exigiria quebrar C–C)')]),
    h('details', { class: 'why' }, h('summary', null, 'Complementar: testes de Tollens e Fehling/Benedict'), h('ul', null, h('li', { html: '<b>Tollens</b> [Ag(NH₃)₂]⁺: o aldeído reduz Ag⁺ a Ag⁰ (espelho de prata) e é oxidado a carboxilato.' }), h('li', { html: '<b>Fehling/Benedict</b>: Cu²⁺ (azul) é reduzido a Cu₂O (precipitado vermelho-tijolo) por aldeídos (especialmente alifáticos e açúcares redutores).' }), h('li', null, 'Cetonas simples não dão teste positivo.'))));
}

/* ===================================================================
 * 26. Ozonólise
 * =================================================================== */
export function ozoCut(host) {
  const keys = ['metilbuteno', 'metilpropeno', 'but2eno', 'but1eno', 'cicloexeno', 'metilcicloexeno', 'estireno', 'tetrametiletileno', 'pent2eno'];
  let key = 'metilbuteno', wk = 'r';
  const box = h('div', { class: 'figs' }), res = h('div'), out = h('div', { 'aria-live': 'polite' });
  const draw = () => {
    const m = molOf(key), P = layout(m);
    const svg = drawSVG(m, P, { scale: 50, fs: 19, zoom: 1.35 });
    const C = svg._chem, NS = 'http://www.w3.org/2000/svg', g = document.createElementNS(NS, 'g'); g.setAttribute('transform', C.transform); svg.append(g);
    ccDoubles(m).forEach(({ b, k }) => { const p = C.atoms[svg._s._ids[b.a]], q = C.atoms[svg._s._ids[b.b]]; const ln = document.createElementNS(NS, 'line'); [['x1', p.x], ['y1', p.y], ['x2', q.x], ['y2', q.y], ['class', 'cut'], ['tabindex', 0], ['role', 'button'], ['aria-label', 'ligação C=C: clique para cortar']].forEach(([x, y]) => ln.setAttribute(x, y)); const f = () => { ln.classList.add('done'); cut(m, k); }; ln.addEventListener('click', f); ln.addEventListener('keydown', (e) => { if (e.key === 'Enter') f(); }); g.append(ln); });
    clear(box).append(h('figure', { class: 'fig' }, svg, h('figcaption', null, COMP[key].name)));
    res.replaceChildren(); out.replaceChildren(fb('neutral', 'Clique (tesoura) na ligação C=C para cortá-la.'));
  };
  const cut = (m, k) => {
    const frags = ozonolysis(m, k, wk === 'o');
    res.replaceChildren(h('div', { class: 'rxrow' }, h('span', { class: 'rxarr', html: wk === 'o' ? '→<small>1. O₃; 2. H₂O₂</small>' : '→<small>1. O₃; 2. Zn/H₂O ou Me₂S</small>' }), ...frags.map((f, i) => [i ? h('span', { class: 'rxarr' }, '+') : null, h('figure', { class: 'fig' }, sk(f.m, { scale: 30, fs: 13 }), h('figcaption', null, f.key ? COMP[f.key].name : 'produto'))]).flat()));
    out.replaceChildren(fb('ok', `Cada carbono da antiga C=C virou C=O. ${frags.length === 1 ? 'Alceno cíclico: o anel se abre e forma <b>um único</b> produto com duas carbonilas.' : ''} ${wk === 'o' ? 'Workup oxidativo: fragmentos com H no carbono carbonílico (aldeídos) → ácidos; o metanal → ácido fórmico (que pode seguir até CO₂).' : 'Workup redutivo: aldeídos preservados.'}`));
  };
  host.append(h('div', { class: 'controls' }, h('label', null, 'Alceno: ', sel(keys.map((k) => [k, COMP[k].name]), key, (k) => { key = k; draw(); }, 'alceno')), seg([['r', 'workup redutivo (Zn/H₂O, Me₂S)'], ['o', 'workup oxidativo (H₂O₂)']], 'r', (k) => { wk = k; draw(); }, 'workup')), box, res, out);
  draw();
}
/** ozonólise inversa */
export const REVOZO = [
  { prods: ['propanona', 'metanal'], ans: 'metilpropeno', opts: ['metilpropeno', 'but1eno', 'but2eno', 'metilbuteno'] },
  { prods: ['propanona', 'etanal'], ans: 'metilbuteno', opts: ['metilbuteno', 'pent2eno', 'metilpropeno', 'tetrametiletileno'] },
  { prods: ['propanal', 'etanal'], ans: 'pent2eno', opts: ['pent2eno', 'but2eno', 'metilbuteno', 'but1eno'] },
  { prods: ['hexanodial'], ans: 'cicloexeno', opts: ['cicloexeno', 'metilcicloexeno', 'but1eno', 'estireno'] },
  { prods: ['benzaldeido', 'metanal'], ans: 'estireno', opts: ['estireno', 'but1eno', 'metilpropeno', 'cicloexeno'] },
];
export function ozoReverse(host) {
  let i = 0;
  const box = h('div'), out = h('div', { 'aria-live': 'polite' });
  const draw = () => {
    const Q = REVOZO[i];
    clear(box).append(h('p', { class: 'prompt' }, 'Qual alceno daria estes produtos por ozonólise redutiva?'), h('div', { class: 'rxrow' }, ...Q.prods.map((p, k) => [k ? h('span', { class: 'rxarr' }, '+') : null, F(p)]).flat()), h('div', { class: 'pickgrid' }, Q.opts.slice().sort(() => Math.random() - 0.5).map((o) => h('button', { class: 'pickcard', type: 'button', onclick: () => out.replaceChildren(fb(o === Q.ans ? 'ok' : 'bad', o === Q.ans ? '✔ Correto: una os dois carbonos carbonílicos por uma C=C (removendo os O).' : '✘ Reconstrua a dupla: cada C=O dos produtos era um carbono da antiga C=C.'), h('button', { class: 'btn sm', type: 'button', onclick: () => { i = (i + 1) % REVOZO.length; draw(); } }, 'Próximo →')) }, sk(o, { scale: 22, fs: 11 }), h('small', null, COMP[o].name)))));
    out.replaceChildren();
  };
  host.append(box, out); draw();
}
export function ozoMech(host) { const d = h('details', { class: 'why' }, h('summary', null, 'Modo avançado: mecanismo da ozonólise'), h('div')); d.addEventListener('toggle', () => { const x = d.lastChild; if (!x.childElementCount) syncPlayer(x, ozoFrames(), { energy: false }); }); host.append(d); }

/* ===================================================================
 * 27. Mapa de interconversões e comparador
 * =================================================================== */
const POS = { alceno: [90, 240], alcool1: [300, 130], aldeido: [520, 130], acido: [740, 130], alcool2: [300, 350], cetona: [520, 350], ester: [740, 350], alcool3: [90, 400] };
export function netMap(host) {
  let from = null;
  const W = 840, Hh = 450, svg = svgEl(W, Hh, 'Mapa de interconversões de aldeídos, cetonas e álcoois');
  svg.innerHTML = '<defs><marker id="mh" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#9fb0cc"/></marker></defs>';
  const out = h('div', { 'aria-live': 'polite' });
  NET.edges.forEach(([a, b, , kind], k) => { const [x1, y1] = POS[a], [x2, y2] = POS[b]; const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy); const off = NET.edges.some(([c, d]) => c === b && d === a) ? 10 : 0; const nx = -dy / L * off, ny = dx / L * off; const ax = x1 + dx / L * 78 + nx, ay = y1 + dy / L * 30 + ny, bx = x2 - dx / L * 78 + nx, by = y2 - dy / L * 30 + ny, skip = Math.abs(dx) > 300 && !dy, cx = (ax + bx) / 2 + (skip ? nx * 9 : 0), cy = (ay + by) / 2 + (skip ? ny * 9 : 0); add(svg, 'path', { d: skip ? `M${ax},${ay - ny * 2.2} Q${cx},${cy} ${bx},${by - ny * 2.2}` : `M${ax},${ay} L${bx},${by}`, class: 'edge ' + (kind.startsWith('red') ? 'red' : kind.startsWith('oxi') ? 'ox' : 'cl'), 'marker-end': 'url(#mh)', 'data-k': k }); });
  Object.entries(POS).forEach(([k, [x, y]]) => { const g = add(svg, 'g', { class: 'node', tabindex: 0, role: 'button', 'aria-label': NET.nodes[k], 'data-n': k }); add(g, 'rect', { x: x - 76, y: y - 22, width: 152, height: 44, rx: 12 }); add(g, 'text', { x, y: y + 5, 'text-anchor': 'middle' }, NET.nodes[k]); const f = () => click(k, g); g.addEventListener('click', f); g.addEventListener('keydown', (e) => { if (e.key === 'Enter') f(); }); });
  function click(k, g) {
    if (!from) { from = k; svg.querySelectorAll('.node').forEach((n) => n.classList.toggle('on', n === g)); out.replaceChildren(fb('neutral', `Substrato: <b>${NET.nodes[k]}</b>. Agora clique no produto desejado.`)); return; }
    const e = NET.edges.find(([a, b]) => a === from && b === k);
    svg.querySelectorAll('.edge').forEach((l) => l.classList.toggle('on', e && +l.dataset.k === NET.edges.indexOf(e)));
    out.replaceChildren(e ? h('div', null, fb('ok', `<b>${NET.nodes[from]} → ${NET.nodes[k]}</b> (${e[3]}): qual reagente? Pense antes de revelar.`), h('details', { class: 'why' }, h('summary', null, 'Mostrar reagente(s)'), h('p', { html: e[2].join(' · ') }))) : fb('bad', `Não há uma transformação direta usual de ${NET.nodes[from]} para ${NET.nodes[k]} neste mapa${from === 'alcool3' ? ' (álcoois terciários não sofrem a oxidação usual)' : from === 'cetona' && k === 'acido' ? ' (cetonas resistem à oxidação simples)' : ''}.`));
    from = null; svg.querySelectorAll('.node').forEach((n) => n.classList.remove('on'));
  }
  host.append(h('div', { class: 'energywrap net' }, svg), legend([['#ffd45c', 'redução (hidretos)'], ['#b18cff', 'oxidação'], ['#ff4fa3', 'clivagem (ozonólise)']]), out);
}
export function reagentCompare(host) {
  const keys = Object.keys(REAG);
  let a = 'NaBH4', b = 'PCC';
  const out = h('div');
  const rows = [['Nome', 'full'], ['Tipo', 'kind'], ['Força / seletividade', 'strength'], ['Meio reacional (geral)', 'medium'], ['Observação', 'note']];
  const K = { red: 'redução', ox: 'oxidação', ozo: 'clivagem de C=C' };
  const draw = () => out.replaceChildren(h('div', { class: 'table-wrap' }, h('table', { class: 'cmp' }, h('thead', null, h('tr', null, h('th', null, ''), h('th', null, REAG[a].name), h('th', null, REAG[b].name))), h('tbody', null, rows.map(([t, k]) => h('tr', null, h('th', null, t), h('td', null, k === 'kind' ? K[REAG[a][k]] : REAG[a][k]), h('td', null, k === 'kind' ? K[REAG[b][k]] : REAG[b][k])))))));
  host.append(h('div', { class: 'controls' }, h('label', null, 'A: ', sel(keys.map((k) => [k, REAG[k].name]), a, (k) => { a = k; draw(); }, 'reagente A')), h('label', null, 'B: ', sel(keys.map((k) => [k, REAG[k].name]), b, (k) => { b = k; draw(); }, 'reagente B'))), out);
  draw();
}
export function masterRed(host) {
  const rows = [['NaBH₄', 'álcool 1°', 'álcool 2°', 'geralmente não (condições usuais)', 'não', 'redutor brando'], ['LiAlH₄', 'álcool 1°', 'álcool 2°', 'álcool 1° (+ R′OH)', 'álcool 1°', 'redutor forte; workup separado'], ['DIBAL-H', 'pode reduzir (álcool 1°)', 'pode reduzir (álcool 2°)', 'aldeído sob condições controladas (1 equiv., −78 °C)', 'dependente das condições', 'destaque: redução parcial']];
  host.append(h('div', { class: 'table-wrap' }, h('table', { class: 'cmp' }, h('thead', null, h('tr', null, ['Reagente', 'Aldeído', 'Cetona', 'Éster', 'Ácido carboxílico', 'Observação'].map((t) => h('th', null, t)))), h('tbody', null, rows.map((r) => h('tr', null, r.map((t, i) => h(i ? 'td' : 'th', null, t))))))), h('p', { class: 'hint3' }, 'Comportamento típico; a seletividade não é absoluta fora das condições indicadas.'));
}
export function masterOx(host) {
  const rows = [['álcool 1°', 'aldeído', 'ácido', 'ácido (condições oxidantes adequadas)'], ['álcool 2°', 'cetona', 'cetona', 'cetona'], ['álcool 3°', 'sem oxidação simples usual', 'sem oxidação simples usual', 'condições severas podem causar quebra C–C'], ['aldeído', 'depende das condições (não é o uso típico)', 'ácido', 'ácido']];
  host.append(h('div', { class: 'table-wrap' }, h('table', { class: 'cmp' }, h('thead', null, h('tr', null, ['Substrato', 'PCC', 'Jones', 'KMnO₄'].map((t) => h('th', null, t)))), h('tbody', null, rows.map((r) => h('tr', null, r.map((t, i) => h(i ? 'td' : 'th', null, t))))))));
}
void S; void tgl; void profile; void funcCarbon; void lookup; void RED; void OX; void figs; void sk;
