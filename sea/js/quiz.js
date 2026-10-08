/*
 * quiz.js — quiz final (40 questões sorteadas de um banco > 60) e modos
 * desafio: “Orto, meta ou para?”, “Ativador ou desativador?”,
 * “Qual é o eletrófilo?” e “Friedel–Crafts funciona?”.
 */
import { h, shuffle } from './widgets2d.js';
import { rnd } from './ui.js';
import { SUBS, RX, compat } from './sub.js';
import { ringSVG2 } from './sea2d.js';

const T = (topic, q, o, e) => [topic, () => ({ q, o, a: 0, e })];
const fig = (subs) => () => ringSVG2({ kek: 'A', subs }, { scale: 30, fs: 13 });
const dirG = (k) => ['Orientação', () => ({ fig: fig({ 0: k }), q: `Orientação de –${SUBS[k].lab} (${SUBS[k].ex})?`, o: SUBS[k].dir === 'm' ? ['meta', 'orto/para', 'ipso', 'não orienta'] : ['orto/para', 'meta', 'ipso', 'não orienta'], a: 0, e: `${SUBS[k].cls}; ressonância: ${SUBS[k].R}.` })];
const actG = (k) => ['Efeitos eletrônicos', () => ({ fig: fig({ 0: k }), q: `Em relação ao benzeno, ${SUBS[k].ex} reage em SEA:`, o: SUBS[k].rank > 0 ? ['mais rápido (ativado)', 'mais devagar (desativado)', 'igual', 'não reage nunca'] : ['mais devagar (desativado)', 'mais rápido (ativado)', 'igual', 'não reage nunca'], a: 0, e: `–${SUBS[k].lab}: ${SUBS[k].I}; ${SUBS[k].R}.` })];

const BANK = [
  T('Mecanismo', 'Na SEA, o anel aromático atua como:', ['nucleófilo', 'eletrófilo', 'base de Lewis do catalisador', 'grupo de saída'], 'Sistema π.'),
  T('Mecanismo', 'O intermediário da SEA é:', ['o complexo σ (íon arênio)', 'um carbânion', 'um radical', 'um benzino'], 'Wheland.'),
  T('Mecanismo', 'No complexo σ, o carbono atacado é:', ['sp³', 'sp²', 'sp', 'carbocátion'], 'Quatro ligações σ.'),
  T('Mecanismo', 'Na desprotonação, o par da ligação C–H:', ['forma a C=C e restaura o sexteto aromático', 'vai para a base', 'forma ligação C–E', 'gera um carbânion'], 'C–H → π.'),
  T('Mecanismo', 'As formas de ressonância do íon arênio colocam a carga + em:', ['orto e para ao carbono sp³', 'meta', 'no carbono sp³', 'no eletrófilo'], 'Nunca meta.'),
  T('Mecanismo', 'As formas de ressonância do complexo σ são:', ['representações do mesmo intermediário', 'três intermediários diferentes em equilíbrio', 'estados de transição', 'isômeros'], 'Formas canônicas.'),
  T('Energia', 'A etapa geralmente lenta da SEA é:', ['o ataque do anel e formação do complexo σ', 'a perda de H⁺', 'a regeneração do catalisador', 'a difusão'], 'Perda da aromaticidade.'),
  T('Energia', 'A forte força motriz da etapa de desprotonação é:', ['a restauração da aromaticidade', 'a formação de um carbocátion', 'a quebra da ligação C–E', 'a perda de entropia'], 'Aromaticidade.'),
  T('Energia', 'kH/kD ≈ 1 na nitração indica:', ['a ruptura C–H não ocorre na etapa lenta', 'a C–H rompe na etapa lenta', 'mecanismo radicalar', 'ausência de intermediário'], 'Etapa 1 é a lenta.'),
  T('Halogenação', 'Na bromação, o FeBr₃:', ['polariza/ativa o Br₂ (ácido de Lewis)', 'é a base final', 'é o eletrófilo', 'é reduzido a Fe'], 'Catalisador.'),
  T('Halogenação', 'O subproduto da bromação do benzeno é:', ['HBr', 'H₂', 'Br⁻ livre', 'FeBr₂'], 'FeBr₃ regenerado.'),
  T('Halogenação', 'A representação “Br⁺” na bromação é:', ['uma simplificação: o eletrófilo real é o complexo Br₂–FeBr₃', 'exata', 'um radical', 'um nucleófilo'], 'Sem Br⁺ livre.'),
  T('Nitração', 'Eletrófilo da nitração:', ['NO₂⁺', 'NO₃⁻', 'HNO₂', 'NO₂⁻'], 'Nitrônio.'),
  T('Nitração', 'Função do H₂SO₄ na nitração:', ['protonar o HNO₃ para formar NO₂⁺', 'ser o eletrófilo', 'oxidar o benzeno', 'reduzir o NO₂'], 'Ácido mais forte.'),
  T('Nitração', 'Geometria do NO₂⁺:', ['linear', 'angular', 'trigonal planar', 'piramidal'], 'N sp.'),
  T('Sulfonação', 'A sulfonação é:', ['reversível', 'irreversível sempre', 'radicalar', 'nucleofílica'], 'Dessulfonação com ácido diluído e calor.'),
  T('Sulfonação', 'Uso sintético do –SO₃H:', ['grupo bloqueador temporário', 'ativador forte', 'grupo de proteção de aminas', 'catalisador'], 'Ocupa uma posição e depois é removido.'),
  T('Friedel–Crafts', 'Problemas típicos da alquilação de Friedel–Crafts:', ['rearranjos e polialquilação', 'rearranjo do íon acílio', 'monoacilação', 'reação só em anéis desativados'], 'Carbocátions.'),
  T('Friedel–Crafts', 'Benzeno + 1-cloropropano/AlCl₃ dá principalmente:', ['isopropilbenzeno', 'propilbenzeno', 'clorobenzeno', 'tolueno'], 'Migração de hidreto.'),
  T('Friedel–Crafts', 'O eletrófilo da acilação é:', ['R–C≡O⁺', 'R⁺', 'RCOO⁻', 'AlCl₄⁻'], 'Íon acílio.'),
  T('Friedel–Crafts', 'A acilação não leva à poliacilação porque:', ['o grupo acila desativa o anel', 'o acílio rearranja', 'o AlCl₃ é catalítico', 'o produto é mais reativo'], '–COR retirador.'),
  T('Friedel–Crafts', 'A Friedel–Crafts falha no:', ['nitrobenzeno', 'tolueno', 'benzeno', 'anisol (com cuidado)'], 'Anel fortemente desativado.'),
  T('Friedel–Crafts', 'Anilina + AlCl₃:', ['o N coordena o AlCl₃, desativando o anel', 'ativa a FC', 'gera NO₂⁺', 'forma acílio'], 'N básico.'),
  T('Friedel–Crafts', 'Rota sem rearranjo para alquilbenzenos lineares:', ['acilação + redução da C=O', 'alquilação com haleto primário', 'sulfonação', 'nitração + redução'], 'Clemmensen/Wolff–Kishner.'),
  T('Efeitos eletrônicos', 'Efeito indutivo é transmitido:', ['pelas ligações σ', 'pela conjugação π', 'pelo espaço apenas', 'pelo solvente'], 'Indução × ressonância.'),
  T('Efeitos eletrônicos', '–OCH₃ é ativador porque:', ['o +R do O supera o −I', 'o −I domina', 'é volumoso', 'retira por ressonância'], 'Par do O.'),
  T('Efeitos eletrônicos', '–CF₃ é:', ['desativador meta (só −I)', 'ativador o/p', 'desativador o/p', 'ativador meta'], 'Sem pares.'),
  T('Efeitos eletrônicos', '–NH₃⁺ (anilínio) é:', ['desativador forte, meta', 'ativador, o/p', 'desativador, o/p', 'neutro'], 'Sem par livre.'),
  T('Halogênios', 'Halogênios são:', ['desativadores orto/para', 'ativadores orto/para', 'desativadores meta', 'ativadores meta'], '−I controla a velocidade; +R a orientação.'),
  T('Halogênios', 'Por que halogênios dirigem o/p?', ['o par do halogênio estabiliza os complexos σ o/p por ressonância', 'o −I ativa o/p', 'o halogênio é volumoso', 'o halogênio é meta diretor'], 'Forma X⁺=C.'),
  T('Orientação', 'A orientação meta dos retiradores se explica porque:', ['nos ataques o/p há uma forma com + vizinha ao grupo retirador', 'meta tem mais densidade em mapas estáticos', 'meta é mais distante sempre', 'é uma regra arbitrária'], 'Estabilidade dos intermediários.'),
  T('Orientação', 'Doadores por ressonância favorecem o/p porque:', ['geram um contribuinte extra (X⁺=C) nesses complexos σ', 'retiram densidade do meta', 'são volumosos', 'aumentam a carga no meta'], 'Contribuinte com octetos completos.'),
  T('Regiosseletividade', 'Grupos volumosos (ex.: terc-butila) aumentam:', ['a fração para', 'a fração orto', 'a fração meta', 'a velocidade em orto'], 'Estérica.'),
  T('Regiosseletividade', 'Nitração do tolueno dá principalmente:', ['o- e p-nitrotolueno', 'm-nitrotolueno', 'nitrobenzeno', 'ácido benzoico'], 'o/p.'),
  T('Regiosseletividade', 'Nitração do benzoato de metila dá:', ['m-nitrobenzoato de metila', 'p-nitro', 'o-nitro', 'nitrobenzeno'], '–COOCH₃ meta.'),
  T('Dois substituintes', 'Em diretores conflitantes, geralmente prevalece:', ['o grupo mais ativador', 'o grupo mais desativador', 'o grupo maior', 'o primeiro introduzido'], 'Considerar estérica também.'),
  T('Dois substituintes', 'A posição entre dois substituintes em meta (C2 do m-xileno) é:', ['desfavorecida por impedimento estérico', 'a mais reativa sempre', 'inacessível eletronicamente', 'ipso'], 'Congestionada.'),
  T('Síntese', 'Para m-bromonitrobenzeno: primeiro…', ['nitração', 'bromação', 'acilação', 'sulfonação'], 'NO₂ meta.'),
  T('Síntese', 'Para p-bromonitrobenzeno: primeiro…', ['bromação', 'nitração', 'sulfonação', 'alquilação'], 'Br o/p.'),
  T('Síntese', 'Para m-nitroacetofenona: primeiro…', ['acilação', 'nitração', 'bromação', 'redução'], 'FC falha no nitrobenzeno.'),
  dirG('OCH3'), dirG('NO2'), dirG('Cl'), dirG('CHO'), dirG('CH3'), dirG('CN'), dirG('NHCOCH3'), dirG('COOH'), dirG('Br'), dirG('SO3H'),
  actG('OH'), actG('NO2'), actG('Cl'), actG('CH3'), actG('COCH3'), actG('NH2'), actG('CF3'), actG('OCH3'),
];
export const TOPIC_SECTION = { Mecanismo: 'mecanismo', Energia: 'energia', Halogenação: 'halogenacao', Nitração: 'nitracao', Sulfonação: 'sulfonacao', 'Friedel–Crafts': 'alquilacao', 'Efeitos eletrônicos': 'ressonancia', Halogênios: 'halogenios', Orientação: 'meta', Regiosseletividade: 'regio', 'Dois substituintes': 'dissubstituidos', Síntese: 'sintese' };
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
      topics.length ? h('div', null, h('p', null, h('b', null, 'Assuntos para revisar:')), h('ul', null, topics.map(([t, n]) => h('li', null, h('a', { href: '#' + (TOPIC_SECTION[t] || 'inicio'), onclick: (e) => { e.preventDefault(); nav(TOPIC_SECTION[t] || 'inicio'); } }, t), ` — ${n} erro(s)`)))) : h('p', null, 'Nenhum erro: parabéns!'),
      h('div', { class: 'ex-actions', style: 'justify-content:center' }, h('button', { class: 'btn primary', type: 'button', onclick: start }, '↺ Novo quiz'), h('button', { class: 'btn', type: 'button', onclick: () => nav('quiz', 'desafio') }, '⚡ Modo desafio'))));
  }
  start();
}

/* ===================================================================
 * Desafios
 * =================================================================== */
const POOL = ['NH2', 'OH', 'OCH3', 'NHCOCH3', 'CH3', 'tBu', 'F', 'Cl', 'Br', 'I', 'CHO', 'COCH3', 'COOH', 'COOCH3', 'CN', 'SO3H', 'CF3', 'NO2', 'NMe3'];
const ELEC = { brom: 'Br₂···FeBr₃', chlor: 'Cl₂···FeCl₃', nitr: 'NO₂⁺', sulf: 'SO₃', alq: 'R⁺ (ou R–X···AlCl₃)', acil: 'R–C≡O⁺' };
export function challenge(host) {
  const st = { pts: 0, streak: 0, best: 0, n: 0, ok: 0, timer: null, t0: 0, done: false, mode: 'omp' };
  const TIME = 12000;
  const stats = h('div', { class: 'ch-stats' }), bar = h('span', { style: 'width:100%' }), card = h('div', { class: 'ch-card' });
  const modes = h('div', { class: 'controls', style: 'justify-content:center' }, ...[['omp', 'Orto, meta ou para?'], ['act', 'Ativador ou desativador?'], ['elec', 'Qual é o eletrófilo?'], ['fc', 'Friedel–Crafts funciona?']].map(([k, t]) => h('button', { class: 'btn sm', type: 'button', 'aria-pressed': k === st.mode, onclick: (e) => { st.mode = k; modes.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', b === e.currentTarget)); clearInterval(st.timer); intro(); } }, t)));
  host.append(h('div', { class: 'challenge' }, modes, stats, h('div', { class: 'timer' }, bar), card));
  const drawStats = () => { stats.innerHTML = ''; [['pontos', st.pts], ['sequência', st.streak], ['recorde', st.best], ['acertos', `${st.ok}/${st.n}`]].forEach(([k, v]) => stats.append(h('div', null, h('b', null, String(v)), h('small', null, k)))); };
  function intro() { card.innerHTML = ''; bar.style.width = '100%'; card.append(h('h3', { style: 'margin-top:0' }, 'Modo desafio'), h('p', null, 'Responda em até 12 s. Acertos rápidos valem mais; sequências multiplicam os pontos.'), h('button', { class: 'btn accent lg', type: 'button', onclick: next }, '▶ Começar')); drawStats(); }
  function next() {
    clearInterval(st.timer); st.done = false; card.innerHTML = '';
    let q;
    if (st.mode === 'omp' || st.mode === 'act') {
      const k = rnd(POOL), S0 = SUBS[k];
      q = st.mode === 'omp' ? { kind: 'Orto, meta ou para?', fig: fig({ 0: k })(), q: `${S0.ex} + E⁺`, o: ['orto/para', 'meta'], a: S0.dir === 'm' ? 'meta' : 'orto/para', e: `–${S0.lab}: ${S0.cls}.` } : { kind: 'Ativador ou desativador?', fig: fig({ 0: k })(), q: `–${S0.lab}`, o: ['ativador', 'desativador'], a: S0.rank > 0 ? 'ativador' : 'desativador', e: `${S0.I}; ${S0.R}.` };
    } else if (st.mode === 'elec') {
      const r = rnd(Object.keys(ELEC)), right = ELEC[r];
      q = { kind: 'Qual é o eletrófilo?', fig: null, q: `${RX[r].name}: ${RX[r].reag}`, o: shuffle([right, ...shuffle(Object.values(ELEC).filter((x) => x !== right)).slice(0, 3)]), a: right, e: RX[r].elec + '.' };
    } else {
      const k = rnd(['CH3', 'OCH3', 'NO2', 'Cl', 'COCH3', 'NH2', 'CN', 'Br', 'tBu', null]), rx = rnd(['alq', 'acil']);
      const subs = k ? { 0: k } : {}, c = compat(rx, subs);
      q = { kind: 'Friedel–Crafts funciona?', fig: fig(subs)(), q: `${k ? SUBS[k].ex : 'benzeno'} + ${RX[rx].short}`, o: ['funciona', 'não funciona'], a: c.ok ? 'funciona' : 'não funciona', e: c.ok ? 'Anel não desativado e sem grupo básico.' + (c.msgs.length ? ' ' + c.msgs.join(' ') : '') : c.msgs.join(' ') };
    }
    const fbx = h('div', { 'aria-live': 'assertive' });
    const ans = h('div', { class: 'ch-answers' }, q.o.map((t) => h('button', { class: 'btn', type: 'button', onclick: () => answer(t, q, ans, fbx) }, t)));
    card.append(h('div', { class: 'topic' }, q.kind), q.fig ? h('div', { class: 'figs' }, q.fig) : null, h('h4', { style: 'text-align:center' }, q.q), ans, fbx);
    st.t0 = performance.now();
    st.timer = setInterval(() => { const left = Math.max(0, 1 - (performance.now() - st.t0) / TIME); bar.style.width = left * 100 + '%'; if (left <= 0) answer(null, q, ans, fbx); }, 100);
  }
  function answer(t, q, ans, fbx) {
    if (st.done) return; st.done = true; clearInterval(st.timer);
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
