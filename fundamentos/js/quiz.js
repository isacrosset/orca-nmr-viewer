/*
 * quiz.js — quiz final (40 questões de um banco > 50) e modos desafio:
 * "Qual é a hibridização?", "Conte σ e π", "Qual geometria?",
 * "Lewis correta ou incorreta?".
 */
import { h, shuffle } from './widgets2d.js';
import { L, MOLS } from './lib.js';
import { lewisSVG, centerInfo, sigmaPi, nbs, clone, valenceElectrons, drawnElectrons, shellElectrons } from './struct.js';
import { rnd } from './ui.js';

const T = (topic, q, o, e) => [topic, () => ({ q, o, a: 0, e })];
const hybG = (k, i) => ['Hibridização', () => { const c = centerInfo(L(k), i); return { fig: () => lewisSVG(L(k), { scale: 36, halo: { [i]: 'g' } }), q: `Hibridização do <b>${L(k).atoms[i].el}</b> destacado?`, o: [c.hyb, ...['sp³', 'sp²', 'sp'].filter((x) => x !== c.hyb)], a: 0, e: `${c.D} domínios → ${c.hyb}.` }; }];
const geoG = (k, i) => ['VSEPR', () => { const c = centerInfo(L(k), i); return { fig: () => lewisSVG(L(k), { scale: 36, halo: { [i]: 'g' } }), q: `Geometria molecular em torno do <b>${L(k).atoms[i].el}</b>?`, o: [c.mgeo, ...['linear', 'trigonal planar', 'tetraédrica', 'angular', 'piramidal trigonal'].filter((x) => x !== c.mgeo)].slice(0, 4), a: 0, e: `${c.axe} → ${c.mgeo} (≈ ${c.ang}).` }; }];
const spG = (k) => ['σ e π', () => { const s = sigmaPi(L(k)); return { fig: () => lewisSVG(L(k), { scale: 34 }), q: `Ligações σ e π em ${MOLS[k][1]}?`, o: [`${s.s} σ, ${s.p} π`, `${s.s + s.p} σ, ${s.p} π`, `${s.s} σ, ${s.p + 1} π`, `${s.s - 1} σ, ${s.p + 1} π`], a: 0, e: '1 σ por ligação; +1 π por dupla; +2 π por tripla.' }; }];

const BANK = [
  T('Estrutura eletrônica', 'Configuração do carbono:', ['1s² 2s² 2p²', '1s² 2s² 2p⁴', '1s² 2s⁴', '1s² 2p⁴'], 'Z = 6.'),
  T('Estrutura eletrônica', 'Elétrons de valência do oxigênio:', ['6', '8', '2', '4'], '2s² 2p⁴.'),
  T('Estrutura eletrônica', 'Regra de Hund:', ['ocupe orbitais degenerados individualmente, com spins paralelos, antes de emparelhar', 'dois elétrons no mesmo orbital têm spins opostos', 'preencha os níveis de menor energia primeiro', 'o octeto deve ser completado'], 'Hund; a 2ª é Pauli; a 3ª é Aufbau.'),
  T('Estrutura eletrônica', 'Elétrons desemparelhados do N no estado fundamental:', ['3', '1', '5', '0'], '2p³: ↑ ↑ ↑.'),
  T('Estrutura eletrônica', 'Os elétrons de valência são:', ['os da camada mais externa, que participam das ligações', 'todos os elétrons do átomo', 'os do 1s', 'os do núcleo'], 'Camada de valência.'),
  T('Lewis', 'Total de elétrons de valência do CH₂O:', ['12', '10', '14', '16'], '4 + 2 + 6.'),
  T('Lewis', 'Total de elétrons do íon acetato CH₃COO⁻:', ['24', '23', '22', '25'], '2×4 + 3×1 + 2×6 + 1 (carga).'),
  T('Lewis', 'Na estrutura do HCN, a ligação C–N é:', ['tripla', 'dupla', 'simples', 'iônica'], 'H–C≡N.'),
  T('Lewis', 'O hidrogênio completa:', ['dueto (2 elétrons)', 'octeto', '6 elétrons', '4 elétrons'], 'Apenas 1s.'),
  T('Lewis', 'BF₃ é um exemplo de:', ['átomo central com octeto incompleto', 'octeto expandido', 'radical', 'íon'], 'B com 6 elétrons.'),
  T('Lewis', 'NO (11 elétrons) é:', ['um radical', 'um íon', 'uma molécula com todos os octetos', 'deficiente em C'], 'Número ímpar de elétrons.'),
  T('Carga formal', 'CF = ', ['V − não ligantes − ½ ligantes', 'V − ligantes', 'não ligantes − V', 'V + ligações'], 'Definição.'),
  T('Carga formal', 'Carga formal do N em NH₄⁺:', ['+1', '0', '−1', '+2'], '5 − 0 − 4.'),
  T('Carga formal', 'Carga formal do O com 3 pares isolados e 1 ligação:', ['−1', '0', '+1', '−2'], '6 − 6 − 1.'),
  T('Carga formal', 'Entre estruturas comparáveis, é geralmente preferível:', ['minimizar a separação de cargas', 'maximizar as cargas', 'colocar carga negativa no átomo menos eletronegativo', 'deixar octetos incompletos'], 'Tendência (não regra absoluta).'),
  T('Ressonância', 'Formas de ressonância diferem em:', ['posição de elétrons π e pares isolados', 'posição dos átomos', 'ligações σ', 'número de elétrons'], 'Só elétrons.'),
  T('Ressonância', 'A molécula real com ressonância é:', ['um híbrido de ressonância', 'uma mistura de formas em equilíbrio', 'a forma mais estável apenas', 'alternância rápida entre formas'], 'Não é equilíbrio.'),
  T('Ressonância', 'No acetato, as duas ligações C–O são:', ['iguais (ordem ≈ 1½)', 'uma dupla e uma simples', 'ambas duplas', 'ambas simples'], 'Híbrido.'),
  T('Ressonância', 'Formas equivalentes contribuem:', ['igualmente', 'uma domina', 'nenhuma contribui', 'depende do solvente'], 'Simetria.'),
  T('VSEPR', 'Em VSEPR, uma ligação dupla conta como:', ['1 domínio', '2 domínios', '0', 'meio domínio'], 'Uma região de densidade.'),
  T('VSEPR', 'AX₃E tem geometria molecular:', ['piramidal trigonal', 'trigonal planar', 'tetraédrica', 'angular'], 'Ex.: NH₃.'),
  T('VSEPR', 'Ângulo H–O–H na água:', ['≈ 104,5°', '109,5°', '120°', '180°'], 'Dois pares isolados.'),
  T('VSEPR', 'Geometria eletrônica da NH₃:', ['tetraédrica', 'piramidal trigonal', 'trigonal planar', 'linear'], '4 domínios.'),
  T('VSEPR', 'CO₂ é linear porque o C tem:', ['2 domínios', '4 domínios', '2 pares isolados', '3 domínios'], 'Duas duplas.'),
  T('Orbitais', 'Um orbital é:', ['uma função de onda; sua representação indica regiões de maior probabilidade', 'a trajetória do elétron', 'uma órbita circular', 'uma partícula'], 'Não é trajetória.'),
  T('Orbitais', 'Nós do orbital 2s:', ['1 nó radial', 'nenhum', '1 plano nodal', '2 planos'], 'n − 1 = 1.'),
  T('Orbitais', 'As duas cores de um orbital p indicam:', ['fases opostas de ψ', 'cargas + e −', 'spins opostos', 'dois elétrons'], 'Fase ≠ carga.'),
  T('Orbitais', 'O orbital 2p_z tem plano nodal:', ['xy', 'xz', 'yz', 'nenhum'], 'Perpendicular ao eixo z.'),
  T('Orbitais', '|ψ|² representa:', ['densidade de probabilidade', 'energia', 'carga', 'velocidade'], 'Interpretação de Born.'),
  T('OM', 'Combinação em fase de 1s + 1s gera:', ['σ ligante', 'σ* antiligante', 'π', 'nada'], 'Densidade entre os núcleos.'),
  T('OM', 'O orbital antiligante tem:', ['nó entre os núcleos', 'mais densidade entre os núcleos', 'energia menor que os AO', 'sempre 2 elétrons'], 'σ*.'),
  T('OM', 'Ordem de ligação do H₂:', ['1', '0', '2', '½'], '½(2 − 0).'),
  T('OM', 'Ordem de ligação do He₂:', ['0', '1', '2', '½'], '½(2 − 2).'),
  T('σ e π', 'Ligação π resulta de:', ['sobreposição lateral de orbitais p paralelos', 'sobreposição frontal', 's + s', 'híbridos sp³'], 'Lateral.'),
  T('σ e π', 'Uma ligação tripla contém:', ['1 σ + 2 π', '3 σ', '2 σ + 1 π', '3 π'], 'Sempre 1 σ.'),
  T('σ e π', 'A ligação π tem densidade:', ['acima e abaixo do eixo, com nó no eixo', 'ao longo do eixo', 'apenas num núcleo', 'esférica'], 'Plano nodal contém o eixo.'),
  T('σ e π', 'A rotação em torno de C=C é restrita porque:', ['destruiria a sobreposição π', 'a σ é muito forte', 'C é sp³', 'há pares isolados'], 'p paralelos.'),
  T('Hibridização', 'sp³: quantos orbitais p não hibridizados?', ['0', '1', '2', '3'], '1 s + 3 p → 4 sp³.'),
  T('Hibridização', 'sp²: geometria e ângulo:', ['trigonal planar, 120°', 'tetraédrica, 109,5°', 'linear, 180°', 'angular, 104,5°'], '3 domínios.'),
  T('Hibridização', 'sp: orbitais p não hibridizados:', ['2', '1', '0', '3'], '1 s + 1 p → 2 sp.'),
  T('Hibridização', 'Hibridização é:', ['um modelo de combinação matemática de orbitais do mesmo átomo', 'um processo físico que ocorre antes de reagir', 'a mistura de orbitais de átomos diferentes', 'o mesmo que ressonância'], 'Modelo.'),
  T('Hibridização', 'Por que o metano tem 4 ligações C–H equivalentes, se o C tem 2 elétrons desemparelhados no estado fundamental?', ['o modelo de hibridização sp³ descreve 4 orbitais equivalentes', 'o C perde 2 elétrons', 'H forma ligações duplas', 'é uma exceção'], 'Problema do carbono.'),
  hybG('CH3OH', 1), hybG('HCN', 0), hybG('acetona', 1), hybG('eteno', 0), hybG('final', 3), hybG('imina', 1),
  geoG('NH3', 0), geoG('H2O', 0), geoG('BF3', 1), geoG('SO2', 1), geoG('CH4', 0),
  spG('propeno'), spG('HCN'), spG('CO2'), spG('final'),
];
export const TOPIC_SECTION = { 'Estrutura eletrônica': 'configuracao', Lewis: 'lewis', 'Carga formal': 'cargaformal', Ressonância: 'ressonancia', VSEPR: 'vsepr', Orbitais: 'orbitais', OM: 'orbmoleculares', 'σ e π': 'sigmapi', Hibridização: 'sp3' };
export const BANK_SIZE = BANK.length;
export function classify(p) { return p < 50 ? 'Revise os fundamentos' : p < 70 ? 'Em desenvolvimento' : p < 85 ? 'Bom domínio' : 'Excelente domínio'; }

export function quiz(host, nav) {
  let qs = [], i = 0, score = 0, answered = false, wrong = {};
  const box = h('div', { class: 'quizbox' });
  host.append(box);
  function start() { qs = shuffle(BANK).slice(0, 40).map(([topic, g]) => { const q = g(); const ord = shuffle(q.o.map((_, k) => k)); return Object.assign({ topic }, q, { o: ord.map((k) => q.o[k]), a: ord.indexOf(q.a) }); }); i = 0; score = 0; wrong = {}; render(); }
  function render() {
    box.innerHTML = '';
    if (i >= qs.length) return result();
    const q = qs[i]; answered = false;
    box.append(h('div', { class: 'qprog' }, h('b', null, `${i + 1}/${qs.length}`), h('div', { class: 'bar' }, h('span', { style: `width:${(i / qs.length) * 100}%` })), h('span', { class: 'chip ok' }, `${score} acertos · ${i ? Math.round(100 * score / i) : 0}%`)));
    const fbx = h('div', { 'aria-live': 'polite' });
    const next = h('button', { class: 'btn primary', type: 'button', disabled: true, onclick: () => { i++; render(); } }, i === qs.length - 1 ? 'Ver resultado' : 'Próxima →');
    const opts = h('div', { class: 'mcq' });
    q.o.forEach((t, k) => opts.append(h('button', { class: 'mopt', type: 'button', html: `<span class="l">${'abcd'[k]}</span><span>${t}</span>`, onclick: (e) => {
      if (answered) return; answered = true;
      const ok = k === q.a; if (ok) score++; else wrong[q.topic] = (wrong[q.topic] || 0) + 1;
      [...opts.children].forEach((b, n) => { b.disabled = true; if (n === q.a) b.classList.add('right'); });
      if (!ok) e.currentTarget.classList.add('wrong');
      fbx.innerHTML = `<div class="fb ${ok ? 'ok' : 'bad'}">${ok ? '✔ Correto.' : '✘ Incorreto.'} ${q.e}</div>`;
      next.disabled = false; next.focus();
    } })));
    box.append(h('div', { class: 'qcard' }, h('div', { class: 'topic' }, q.topic), h('h4', { html: q.q }), q.fig ? h('div', { class: 'figs' }, q.fig()) : null, opts, fbx, h('div', { class: 'ex-actions' }, next)));
  }
  function result() {
    const pct = Math.round(100 * score / qs.length);
    const topics = Object.entries(wrong).sort((a, b) => b[1] - a[1]);
    box.append(h('div', { class: 'qcard result' }, h('div', { class: 'pct' }, pct + '%'), h('div', { class: 'cls' }, classify(pct)), h('p', null, `${score} de ${qs.length} corretas.`),
      topics.length ? h('div', null, h('p', null, h('b', null, 'Tópicos com maior índice de erro — sugestão de revisão:')), h('ul', null, topics.map(([t, n]) => h('li', null, h('a', { href: '#' + (TOPIC_SECTION[t] || 'inicio'), onclick: (e) => { e.preventDefault(); nav(TOPIC_SECTION[t] || 'inicio'); } }, t), ` — ${n} erro(s)`)))) : h('p', null, 'Nenhum erro: parabéns!'),
      h('div', { class: 'ex-actions', style: 'justify-content:center' }, h('button', { class: 'btn primary', type: 'button', onclick: start }, '↺ Novo quiz'), h('button', { class: 'btn', type: 'button', onclick: () => nav('quiz', 'desafio') }, '⚡ Modo desafio'))));
  }
  start();
}

/* ===================================================================
 * Desafios
 * =================================================================== */
const POOL = ['CH4', 'NH3', 'H2O', 'CO2', 'BF3', 'HCN', 'CH2O', 'CH3OH', 'eteno', 'etino', 'propeno', 'acetona', 'imina', 'acetonitrila', 'final', 'CH3COOH', 'metilamina', 'SO2', 'H3O', 'etano'];
function corrupt(LS) {
  const W = clone(LS), heavy = W.atoms.map((a, i) => i).filter((i) => W.atoms[i].el !== 'H');
  const kind = rnd(['lp+', 'lp-', 'bond+', 'h2']);
  if (kind === 'lp+') { const i = rnd(heavy); W.atoms[i].lp = (W.atoms[i].lp || 0) + 1; return [W, `há elétrons a mais (${drawnElectrons(W)} desenhados, deveriam ser ${valenceElectrons(LS)}); ${W.atoms[i].el} excede o octeto`]; }
  if (kind === 'lp-') { const c = heavy.filter((i) => W.atoms[i].lp > 0); if (c.length) { const i = rnd(c); W.atoms[i].lp -= 1; return [W, `faltam elétrons: o ${W.atoms[i].el} fica com ${shellElectrons(W, i)} (octeto incompleto)`]; } }
  const b = W.bonds.find((x) => W.atoms[x.a].el === 'C' && W.atoms[x.b].el !== 'H' && x.o < 3) || W.bonds.find((x) => W.atoms[x.a].el === 'C');
  if (b) { b.o += 1; return [W, `uma ligação a mais: ${W.atoms[b.a].el} fica com mais de 8 elétrons (${W.atoms[b.a].el === 'C' ? 'carbono pentavalente' : 'octeto excedido'})`]; }
  return [W, 'estrutura incorreta'];
}
export function challenge(host) {
  const st = { pts: 0, streak: 0, best: 0, n: 0, ok: 0, timer: null, t0: 0, done: false, mode: 'hyb' };
  const TIME = 12000;
  const stats = h('div', { class: 'ch-stats' }), bar = h('span', { style: 'width:100%' }), card = h('div', { class: 'ch-card' });
  const modes = h('div', { class: 'controls', style: 'justify-content:center' }, ...[['hyb', 'Qual é a hibridização?'], ['sp', 'Conte σ e π'], ['geo', 'Qual geometria?'], ['lewis', 'Lewis correta ou incorreta?']].map(([k, t]) => h('button', { class: 'btn sm', type: 'button', 'aria-pressed': k === st.mode, onclick: (e) => { st.mode = k; modes.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', b === e.currentTarget)); clearInterval(st.timer); intro(); } }, t)));
  host.append(h('div', { class: 'challenge' }, modes, stats, h('div', { class: 'timer' }, bar), card));
  const drawStats = () => { stats.innerHTML = ''; [['pontos', st.pts], ['sequência', st.streak], ['recorde', st.best], ['acertos', `${st.ok}/${st.n}`]].forEach(([k, v]) => stats.append(h('div', null, h('b', null, String(v)), h('small', null, k)))); };
  function intro() { card.innerHTML = ''; bar.style.width = '100%'; card.append(h('h3', { style: 'margin-top:0' }, 'Modo desafio'), h('p', null, 'Responda em até 12 s. No modo hibridização a estrutura some após 4 s! Acertos rápidos valem mais; sequências multiplicam os pontos.'), h('button', { class: 'btn accent lg', type: 'button', onclick: next }, '▶ Começar')); drawStats(); }
  function next() {
    clearInterval(st.timer); st.done = false; card.innerHTML = '';
    const k = rnd(POOL), LS = L(k), cs = LS.atoms.map((a, i) => i).filter((i) => LS.atoms[i].el !== 'H' && nbs(LS, i).length > 1);
    let q;
    if (st.mode === 'hyb' || st.mode === 'geo') {
      const i = rnd(cs.length ? cs : [0]), c = centerInfo(LS, i);
      q = st.mode === 'hyb' ? { kind: 'Qual é a hibridização?', fig: lewisSVG(LS, { scale: 40, halo: { [i]: 'g' } }), q: `Hibridização do ${LS.atoms[i].el} destacado`, o: ['sp³', 'sp²', 'sp'], a: c.hyb, e: `${c.D} domínios → ${c.hyb}.` } : { kind: 'Qual geometria?', fig: lewisSVG(LS, { scale: 40, halo: { [i]: 'g' } }), q: `Geometria molecular em torno do ${LS.atoms[i].el}`, o: ['linear', 'trigonal planar', 'tetraédrica', 'angular', 'piramidal trigonal'], a: c.mgeo, e: `${c.axe} → ${c.mgeo}.` };
    } else if (st.mode === 'sp') {
      const s = sigmaPi(LS), right = `${s.s} σ / ${s.p} π`;
      q = { kind: 'Conte σ e π', fig: lewisSVG(LS, { scale: 40 }), q: MOLS[k][1], o: shuffle([...new Set([right, `${s.s + s.p} σ / ${s.p} π`, `${s.s} σ / ${s.p + 1} π`, `${s.s - 1} σ / ${s.p} π`])]), a: right, e: '1 σ por ligação; +1 π por dupla; +2 π por tripla.' };
    } else {
      const good = Math.random() < 0.5; const [W, why] = good ? [LS, ''] : corrupt(LS);
      q = { kind: 'Lewis correta ou incorreta?', fig: lewisSVG(W, { scale: 40 }), q: `${MOLS[k][1]} (${valenceElectrons(LS)} elétrons de valência)`, o: ['correta', 'incorreta'], a: good ? 'correta' : 'incorreta', e: good ? 'Total de elétrons, octetos/duetos e cargas formais conferem.' : 'Incorreta: ' + why + '.' };
    }
    const fbx = h('div', { 'aria-live': 'assertive' }), figBox = h('div', { class: 'figs' }, q.fig);
    const ans = h('div', { class: 'ch-answers' }, q.o.map((t) => h('button', { class: 'btn', type: 'button', onclick: () => answer(t, q, ans, fbx, figBox) }, t)));
    card.append(h('div', { class: 'topic' }, q.kind), figBox, h('h4', { style: 'text-align:center' }, q.q), ans, fbx);
    if (st.mode === 'hyb') setTimeout(() => { if (!st.done && figBox.isConnected) figBox.classList.add('fadeout'); }, 4000);
    st.t0 = performance.now();
    st.timer = setInterval(() => { const left = Math.max(0, 1 - (performance.now() - st.t0) / TIME); bar.style.width = left * 100 + '%'; if (left <= 0) answer(null, q, ans, fbx, figBox); }, 100);
  }
  function answer(t, q, ans, fbx, figBox) {
    if (st.done) return; st.done = true; clearInterval(st.timer);
    figBox.classList.remove('fadeout');
    [...ans.children].forEach((b) => { b.disabled = true; if (b.textContent === q.a) b.classList.add('primary'); });
    const ok = t === q.a; st.n++;
    if (ok) { st.ok++; st.streak++; st.best = Math.max(st.best, st.streak); const left = Math.max(0, 1 - (performance.now() - st.t0) / TIME); st.pts += Math.round((10 + 10 * left) * (1 + Math.min(st.streak - 1, 4) * 0.25)); } else st.streak = 0;
    fbx.innerHTML = `<div class="fb ${ok ? 'ok' : 'bad'}">${t === null ? '⏱ Tempo esgotado. ' : ok ? '✔ Correto! ' : '✘ Não. '}${q.e}</div>`;
    fbx.append(h('div', { class: 'ex-actions', style: 'justify-content:center' }, h('button', { class: 'btn primary', type: 'button', onclick: next }, 'Próxima →')));
    drawStats();
  }
  intro();
  return { stop() { clearInterval(st.timer); } };
}
