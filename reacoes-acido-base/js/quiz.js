/*
 * quiz.js — quiz final (40 questões sorteadas) e modo desafio:
 * "Para onde vão os elétrons?", "Qual é mais ácido?", "Eletrófilo ou nucleófilo?".
 */
import { h, shuffle } from './widgets2d.js';
import { mol } from './chem2d.js';
import { PUZZLES, clone } from './struct.js';
import { A, PAIRS, fmtP, FNAME } from './acid.js';

const BANK = [
  ['Ligações', 'Na homólise, cada átomo recebe:', ['um elétron da ligação', 'os dois elétrons', 'nenhum elétron', 'um próton'], 0, 'Formam-se radicais.'],
  ['Ligações', 'Na heterólise, os dois elétrons ficam:', ['com o mesmo átomo', 'um com cada átomo', 'no solvente', 'no núcleo'], 0, 'Formam-se íons.'],
  ['Ligações', 'Produtos típicos da heterólise:', ['íons', 'radicais', 'moléculas neutras sempre', 'átomos isolados'], 0, 'A⁺ + B⁻.'],
  ['Ligações', 'A seta para a homólise é:', ['de meia ponta (1 e⁻)', 'completa (2 e⁻)', 'dupla ⇌', 'reta →'], 0, 'Fishhook.'],
  ['Ligações', 'Em C–Br, a heterólise gera:', ['C⁺ + Br⁻', 'C⁻ + Br⁺', 'C• + Br•', 'C + Br₂'], 0, 'Br mais eletronegativo.'],
  ['Espécies', 'Um carbocátion tem:', ['orbital p vazio e carga +', 'par livre e carga −', 'elétron desemparelhado', 'octeto completo'], 0, 'C com 6 elétrons.'],
  ['Espécies', 'Geometria típica de um carbânion simples (CH₃⁻):', ['piramidal', 'trigonal plana', 'linear', 'quadrado-planar'], 0, 'Par não ligante ≈ sp³.'],
  ['Espécies', 'Carbocátion mais estável:', ['terciário', 'secundário', 'primário', 'metila'], 0, 'Hiperconjugação/indução.'],
  ['Espécies', 'Cátions alílico e benzílico são estabilizados por:', ['ressonância', 'ligação de hidrogênio', 'repulsão estérica', 'hibridização sp³'], 0, 'Carga deslocalizada.'],
  ['Espécies', 'Um radical metila possui:', ['7 elétrons de valência no C', '8 elétrons no C', '6 elétrons no C', 'carga −1'], 0, '3 ligações + 1 elétron.'],
  ['Ácido-base', 'Ácido de Brønsted–Lowry:', ['doa H⁺', 'recebe H⁺', 'recebe par', 'doa par'], 0, 'Definição.'],
  ['Ácido-base', 'Base de Lewis:', ['doa par eletrônico', 'recebe par', 'doa H⁺', 'recebe 1 elétron'], 0, 'Definição.'],
  ['Ácido-base', 'BF₃ é:', ['ácido de Lewis', 'base de Lewis', 'base de Brønsted', 'nucleófilo'], 0, 'Orbital vazio.'],
  ['Ácido-base', 'A base conjugada de CH₃COOH é:', ['CH₃COO⁻', 'CH₃COOH₂⁺', 'CH₃⁻', 'HCOO⁻'], 0, 'Remove-se H⁺.'],
  ['Ácido-base', 'Em HO⁻ + HCl, o HO⁻ é:', ['base de Brønsted e de Lewis', 'só base de Brønsted', 'ácido de Lewis', 'eletrófilo'], 0, 'Recebe H⁺ doando um par.'],
  ['Eletrófilos', 'Eletrófilo é uma espécie:', ['pobre em elétrons que aceita densidade', 'rica em elétrons', 'sempre neutra', 'sempre radical'], 0, 'Definição.'],
  ['Eletrófilos', 'Qual é eletrófilo?', ['C da carbonila', 'O do H₂O', 'Cl⁻', 'NH₃'], 0, 'C δ+.'],
  ['Nucleófilos', 'Qual é nucleófilo?', ['CN⁻', 'BF₃', 'CH₃⁺', 'H⁺'], 0, 'Par livre e carga −.'],
  ['Nucleófilos', 'Uma ligação π pode atuar como:', ['fonte de elétrons (nucleófilo)', 'orbital vazio', 'grupo abandonador sempre', 'carga positiva'], 0, 'Elétrons π acessíveis.'],
  ['Nucleófilos', 'Nucleofilicidade é uma propriedade:', ['cinética (velocidade)', 'termodinâmica (equilíbrio)', 'puramente estrutural', 'de cor'], 0, 'Basicidade é de equilíbrio.'],
  ['Setas', 'A cauda de uma seta curva deve estar em:', ['par de elétrons ou ligação', 'átomo com carga +', 'H⁺', 'qualquer átomo'], 0, 'De onde saem os elétrons.'],
  ['Setas', 'A seta curva representa movimento de:', ['dois elétrons', 'um átomo', 'um próton', 'um núcleo'], 0, 'Nunca de átomos.'],
  ['Setas', 'Em B⁻ + H–A → B–H + A⁻, quantas setas?', ['2', '1', '3', '4'], 0, 'Forma B–H e quebra H–A.'],
  ['Setas', 'Por que o H não pode receber uma nova ligação sem perder a antiga?', ['H só faz uma ligação', 'H é eletronegativo', 'H tem pares livres', 'H é sp³'], 0, 'Valência 1.'],
  ['Setas', 'Uma seta terminando em um átomo de C que já tem 4 ligações exige:', ['quebra de uma ligação do C', 'nada', 'nova carga +', 'seta de meia ponta'], 0, 'Evite C pentavalente.'],
  ['pKa', 'pKa menor indica:', ['ácido mais forte', 'ácido mais fraco', 'base mais forte', 'maior velocidade'], 0, 'pKa = −log Ka.'],
  ['pKa', 'Ka = 10⁻⁵ corresponde a pKa:', ['5', '−5', '0,00001', '10'], 0, 'pKa = −log Ka.'],
  ['pKa', 'Ácidos carboxílicos têm pKa típico:', ['4–5', '15–18', '25', '50'], 0, 'Acetato estabilizado.'],
  ['pKa', 'Alcinos terminais têm pKa ≈', ['25', '4', '16', '50'], 0, 'C sp.'],
  ['pKa', 'Ácido forte → base conjugada', ['relativamente fraca', 'forte', 'nula', 'radical'], 0, 'Relação inversa.'],
  ['Equilíbrio', 'Equilíbrios ácido-base favorecem:', ['o ácido e a base mais fracos', 'o ácido mais forte', 'sempre os produtos', 'sempre os reagentes'], 0, 'Regra central.'],
  ['Equilíbrio', 'pKa(HA)=4,8; pKa(HB)=15,7. HA + B⁻ ⇌ A⁻ + HB:', ['produtos (K ≈ 10¹¹)', 'reagentes', 'K = 1', 'não há reação'], 0, 'log K ≈ 10,9.'],
  ['Equilíbrio', 'Para desprotonar HC≡CH (25) é adequado:', ['NH₂⁻ (38)', 'HO⁻ (15,7)', 'CH₃COO⁻ (4,8)', 'Cl⁻'], 0, 'Base de ácido conjugado mais fraco.'],
  ['Fatores', 'Acetato é mais estável que etóxido por:', ['ressonância', 'tamanho', 'hibridização', 'efeito doador'], 0, 'Carga em dois O.'],
  ['Fatores', 'No período 2, a acidez HF > H₂O > NH₃ > CH₄ segue:', ['a eletronegatividade', 'o tamanho', 'a ressonância', 'a hibridização'], 0, 'Mesmo período.'],
  ['Fatores', 'HI > HF em acidez principalmente por:', ['tamanho/ligação H–I fraca', 'eletronegatividade do I', 'ressonância', 'hibridização'], 0, 'Descendo o grupo.'],
  ['Fatores', 'Etino é mais ácido que etano por:', ['maior caráter s (sp)', 'ressonância', 'tamanho', 'carga formal'], 0, '50% s.'],
  ['Fatores', 'Cl₃CCOOH é mais ácido que CH₃COOH por:', ['efeito indutivo', 'ressonância extra', 'hibridização', 'tamanho do O'], 0, 'Cl retira densidade.'],
  ['Fatores', 'O efeito indutivo, com a distância:', ['diminui', 'aumenta', 'não muda', 'muda de sinal'], 0, 'Decai a cada ligação σ.'],
  ['Fatores', 'Grupos doadores de elétrons próximos à carga negativa:', ['a desestabilizam (ácido mais fraco)', 'a estabilizam', 'não influem', 'invertem o pKa'], 0, 'Mais densidade em A⁻.'],
  ['Fatores', 'Estruturas de ressonância são:', ['representações de uma mesma estrutura deslocalizada', 'isômeros em equilíbrio', 'moléculas diferentes', 'estados de transição'], 0, 'Não alternam.'],
  ['Termodinâmica', 'ΔG° = ', ['−RT ln K', 'RT ln K', '−RT/K', 'K/RT'], 0, 'Relação fundamental.'],
  ['Termodinâmica', 'K > 1 implica ΔG°', ['< 0', '> 0', '= 0', 'indefinido'], 0, 'Produtos favorecidos.'],
  ['Termodinâmica', 'K = 1 implica ΔG°', ['= 0', '< 0', '> 0', '= 1'], 0, 'ln 1 = 0.'],
  ['Termodinâmica', 'Uma reação com ΔG° muito negativo é necessariamente rápida?', ['não: velocidade depende da Ea', 'sim', 'só se K < 1', 'só em água'], 0, 'Termodinâmica ≠ cinética.'],
  ['Termodinâmica', 'A 298 K, ΔG° ≈ −5,7 × log K (kJ/mol). Para K = 10², ΔG° ≈', ['−11,4 kJ/mol', '+11,4 kJ/mol', '−5,7 kJ/mol', '0'], 0, '−5,71 × 2.'],
  ['Energia', 'O estado de transição é:', ['máximo de energia, não isolável', 'mínimo local', 'um intermediário', 'o produto'], 0, 'Topo da barreira (‡).'],
  ['Energia', 'Um intermediário é:', ['mínimo local entre dois ETs', 'máximo de energia', 'reagente', 'impossível de existir'], 0, 'Formado e consumido.'],
  ['Energia', 'A energia de ativação relaciona-se com:', ['a velocidade', 'a posição do equilíbrio', 'o pKa', 'a carga'], 0, 'Barreira.'],
  ['Energia', 'Reação endergônica: produtos', ['acima dos reagentes (ΔG > 0)', 'abaixo', 'na mesma energia', 'no ET'], 0, 'ΔG > 0.'],
  ['Energia', 'Em várias etapas, a etapa determinante costuma ser:', ['a de maior barreira relevante', 'a primeira sempre', 'a última sempre', 'a mais exergônica'], 0, 'Controla a velocidade global.'],
  ['Mecanismos', 'Um mecanismo descreve:', ['a sequência de etapas elementares com movimento de elétrons', 'só reagentes e produtos', 'só o rendimento', 'só a velocidade'], 0, 'Definição.'],
  ['Mecanismos', 'Uma etapa elementar tem:', ['um único estado de transição', 'vários ETs', 'nenhum ET', 'sempre um intermediário'], 0, 'Concertada.'],
  ['Mecanismos', 'Em CN⁻ + CH₃Br, o grupo abandonador é:', ['Br⁻', 'CN⁻', 'CH₃⁺', 'H⁺'], 0, 'Sai com o par.'],
  ['Mecanismos', 'Carga total de HO⁻ + CH₃Br:', ['−1 (deve ser −1 nos produtos)', '0', '+1', '−2'], 0, 'Conservação de carga.'],
  ['Mecanismos', 'Em (CH₃)₃CBr + H₂O, o intermediário principal é:', ['carbocátion terciário', 'carbânion', 'radical', 'BF₃'], 0, 'Heterólise.'],
];
export const TOPIC_SECTION = { Ligações: 'quebra', Espécies: 'especies', 'Ácido-base': 'bronsted', Eletrófilos: 'eletrofilos', Nucleófilos: 'eletrofilos', Setas: 'setas', pKa: 'pka', Equilíbrio: 'pka', Fatores: 'integracao', Termodinâmica: 'kdg', Energia: 'diagramas', Mecanismos: 'mecanismos' };
export function classify(p) { return p < 50 ? 'Revise os fundamentos' : p < 70 ? 'Em desenvolvimento' : p < 85 ? 'Bom domínio' : 'Excelente domínio'; }
export const BANK_SIZE = BANK.length;

export function quiz(host, nav) {
  let qs = [], i = 0, score = 0, answered = false, wrong = {};
  const box = h('div', { class: 'quizbox' });
  host.append(box);
  function start() { qs = shuffle(BANK).slice(0, 40).map((q) => { const o = shuffle(q[2].map((_, k) => k)); return { topic: q[0], q: q[1], o: o.map((k) => q[2][k]), a: o.indexOf(q[3]), e: q[4] }; }); i = 0; score = 0; wrong = {}; render(); }
  function render() {
    box.innerHTML = '';
    if (i >= qs.length) return result();
    const q = qs[i]; answered = false;
    box.append(h('div', { class: 'qprog' }, h('b', null, `${i + 1}/${qs.length}`), h('div', { class: 'bar' }, h('span', { style: `width:${(i / qs.length) * 100}%` })), h('span', { class: 'chip ok' }, `${score} acertos · ${i ? Math.round(100 * score / i) : 0}%`)));
    const fb = h('div', { 'aria-live': 'polite' });
    const next = h('button', { class: 'btn primary', type: 'button', disabled: true, onclick: () => { i++; render(); } }, i === qs.length - 1 ? 'Ver resultado' : 'Próxima →');
    const opts = h('div', { class: 'mcq' });
    q.o.forEach((t, k) => opts.append(h('button', { class: 'mopt', type: 'button', html: `<span class="l">${'abcd'[k]}</span><span>${t}</span>`, onclick: (e) => {
      if (answered) return; answered = true;
      const ok = k === q.a; if (ok) score++; else wrong[q.topic] = (wrong[q.topic] || 0) + 1;
      [...opts.children].forEach((b, n) => { b.disabled = true; if (n === q.a) b.classList.add('right'); });
      if (!ok) e.currentTarget.classList.add('wrong');
      fb.innerHTML = `<div class="fb ${ok ? 'ok' : 'bad'}">${ok ? '✔ Correto.' : '✘ Incorreto.'} ${q.e}</div>`;
      next.disabled = false; next.focus();
    } })));
    box.append(h('div', { class: 'qcard' }, h('div', { class: 'topic' }, q.topic), h('h4', { html: q.q }), opts, fb, h('div', { class: 'ex-actions' }, next)));
  }
  function result() {
    const pct = Math.round(100 * score / qs.length);
    const topics = Object.entries(wrong).sort((a, b) => b[1] - a[1]);
    box.append(h('div', { class: 'qcard result' }, h('div', { class: 'pct' }, pct + '%'), h('div', { class: 'cls' }, classify(pct)), h('p', null, `${score} de ${qs.length} corretas.`),
      topics.length ? h('div', null, h('p', null, h('b', null, 'Tópicos com maior dificuldade:')), h('ul', null, topics.map(([t, n]) => h('li', null, h('a', { href: '#' + (TOPIC_SECTION[t] || 'inicio'), onclick: (e) => { e.preventDefault(); nav(TOPIC_SECTION[t] || 'inicio'); } }, t), ` — ${n} erro(s)`)))) : h('p', null, 'Nenhum erro: parabéns!'),
      h('div', { class: 'ex-actions', style: 'justify-content:center' }, h('button', { class: 'btn primary', type: 'button', onclick: start }, '↺ Novo quiz'), h('button', { class: 'btn', type: 'button', onclick: () => nav('quiz', 'desafio') }, '⚡ Modo desafio'))));
  }
  start();
}

/* ===================================================================
 * Desafio
 * =================================================================== */
const pick = (a) => a[Math.floor(Math.random() * a.length)];
function endOf(site, isHead) {
  if (site.k === 'lp') return { lp: [site.a, site.ang] };
  if (site.k === 'bond') return { b: site.b };
  return { a: site.a, ang: isHead ? 90 : 90 };
}
function arrowFig(P, pairs) {
  const s = clone(P.s);
  pairs.forEach(([a, b]) => s.arrow(endOf(P.sites[a]), endOf(P.sites[b], true), (P.bend && P.bend[a + '>' + b]) || -0.5, ''));
  return mol(s, { scale: 34, fs: 15 });
}
function qArrow() {
  const def = pick(PUZZLES), P = def.puzzle();
  const right = P.answer;
  const rev = right.map(([a, b]) => [b, a]).filter(([a]) => P.sites[a].k !== 'atom' || true);
  const wrongT = right.map(([a, b], k) => { if (k) return [a, b]; const alt = P.targets.find((t) => t !== b && t !== a); return [a, alt || b]; });
  const opts = shuffle([{ f: arrowFig(P, right), ok: true }, { f: arrowFig(P, rev), ok: false }, { f: arrowFig(P, wrongT), ok: false }]);
  return { kind: 'Para onde vão os elétrons?', fig: h('p', { class: 'cardlab', html: `<b>${def.title}</b>` }), q: 'Qual conjunto de setas está correto?', o: opts.map((x) => x.f), a: opts.findIndex((x) => x.ok), e: P.done || '' };
}
function qAcid() {
  const P = pick(PAIRS), o = shuffle([P.a, P.b]);
  return { kind: 'Qual é mais ácido?', fig: null, q: 'Qual é o ácido mais forte?', o: o.map((k) => A[k].f), a: o.indexOf(P.a), e: `${A[P.a].f} (pKa ${fmtP(A[P.a].pKa)}) × ${A[P.b].f} (${fmtP(A[P.b].pKa)}): ${P.f.map((f) => FNAME[f]).join(' + ')}.` };
}
const EN = [['CN⁻', 0, 'par livre, carga −'], ['BF₃', 1, 'orbital p vazio'], ['H₂O', 0, 'pares livres no O'], ['CH₃⁺', 1, 'carbocátion'], ['NH₃', 0, 'par livre no N'], ['H⁺', 1, 'sem elétrons'], ['C da C=O', 1, 'C δ+'], ['HO⁻', 0, 'carga − no O'], ['C do CH₃Br', 1, 'C δ+ ligado ao Br'], ['ligação π do eteno', 0, 'elétrons π'], ['Br⁻', 0, 'pares livres e carga −'], ['AlCl₃', 1, 'Al com orbital vazio']];
function qEN() { const [t, a, why] = pick(EN); return { kind: 'Eletrófilo ou nucleófilo?', fig: h('div', { class: 'bigsp' }, t), q: 'Eletrófilo ou nucleófilo?', o: ['nucleófilo', 'eletrófilo'], a, e: `${t}: ${why}.` }; }

export function challenge(host) {
  const st = { pts: 0, streak: 0, best: 0, n: 0, ok: 0, timer: null, t0: 0, done: false, mode: 'mix' };
  const TIME = 12000;
  const stats = h('div', { class: 'ch-stats' }), bar = h('span', { style: 'width:100%' }), card = h('div', { class: 'ch-card' });
  const modes = h('div', { class: 'controls', style: 'justify-content:center' }, ...[['mix', 'Misturado'], ['arrow', 'Para onde vão os elétrons?'], ['acid', 'Qual é mais ácido?'], ['en', 'Eletrófilo ou nucleófilo?']].map(([k, t]) => h('button', { class: 'btn sm', type: 'button', 'aria-pressed': k === 'mix', onclick: (e) => { st.mode = k; modes.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', b === e.currentTarget)); } }, t)));
  host.append(h('div', { class: 'challenge' }, modes, stats, h('div', { class: 'timer' }, bar), card));
  const drawStats = () => { stats.innerHTML = ''; [['pontos', st.pts], ['sequência', st.streak], ['melhor', st.best], ['acertos', `${st.ok}/${st.n}`]].forEach(([k, v]) => stats.append(h('div', null, h('b', null, String(v)), h('small', null, k)))); };
  function intro() { card.innerHTML = ''; card.append(h('h3', { style: 'margin-top:0' }, 'Modo desafio'), h('p', null, 'Responda antes de o tempo acabar (12 s). Acertos seguidos multiplicam os pontos.'), h('button', { class: 'btn accent lg', type: 'button', onclick: next }, '▶ Começar')); drawStats(); }
  function next() {
    clearInterval(st.timer);
    const m = st.mode === 'mix' ? pick(['arrow', 'acid', 'en']) : st.mode;
    const q = m === 'arrow' ? qArrow() : m === 'acid' ? qAcid() : qEN();
    st.done = false; card.innerHTML = '';
    const fb = h('div', { 'aria-live': 'assertive' });
    const ans = h('div', { class: 'qopts ' + (m === 'arrow' ? 'figopts' : ''), style: 'display:flex;gap:10px;justify-content:center;flex-wrap:wrap' }, q.o.map((t, i) => h('button', { class: 'btn lg', type: 'button', onclick: () => answer(i, q, ans, fb) }, t)));
    card.append(h('div', { class: 'topic' }, q.kind), q.fig, h('h4', { style: 'text-align:center' }, q.q), ans, fb);
    st.t0 = performance.now();
    st.timer = setInterval(() => { const left = Math.max(0, 1 - (performance.now() - st.t0) / TIME); bar.style.width = left * 100 + '%'; if (left <= 0) answer(null, q, ans, fb); }, 80);
  }
  function answer(i, q, ans, fb) {
    if (st.done) return; st.done = true; clearInterval(st.timer);
    [...ans.children].forEach((b, k) => { b.disabled = true; if (k === q.a) b.classList.add('primary'); });
    const ok = i === q.a; st.n++;
    if (ok) { st.ok++; st.streak++; st.best = Math.max(st.best, st.streak); const left = Math.max(0, 1 - (performance.now() - st.t0) / TIME); st.pts += Math.round((10 + 10 * left) * (1 + Math.min(st.streak - 1, 4) * 0.25)); } else st.streak = 0;
    fb.innerHTML = `<div class="fb ${ok ? 'ok' : 'bad'}">${i === null ? '⏱ Tempo esgotado. ' : ok ? '✔ Correto! ' : '✘ Não. '}${q.e}</div>`;
    fb.append(h('div', { class: 'ex-actions', style: 'justify-content:center' }, h('button', { class: 'btn primary', type: 'button', onclick: next }, 'Próxima →')));
    drawStats();
  }
  intro();
  return { stop() { clearInterval(st.timer); } };
}
