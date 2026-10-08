/*
 * quiz.js — quiz final (35 questões sorteadas de um banco > 50) e modos
 * desafio: “Aromático ou não em 15 segundos” e “Quantos elétrons π?”.
 */
import { h, shuffle } from './widgets2d.js';
import { MOLS, analyze, CLS } from './arom.js';
import { ringFig, rnd } from './ui.js';

const T = (topic, q, o, e) => [topic, () => ({ q, o, a: 0, e })];
const clsG = (k) => ['Classificação', () => { const R = analyze(MOLS[k]); const right = CLS[R.cls][0]; return { fig: () => ringFig(k, { scale: 32, fs: 14 }), q: `Classifique: <b>${MOLS[k].name}</b>`, o: [right, ...['aromático', 'antiaromático', 'não aromático'].filter((x) => x !== right)], a: 0, e: R.msgs.join(' ') }; }];
const eG = (k) => ['Contagem π', () => { const e = analyze(MOLS[k]).e; return { fig: () => ringFig(k, { scale: 32, fs: 14 }), q: `Quantos elétrons π tem <b>${MOLS[k].name}</b>?`, o: [String(e), ...[e - 2, e + 2, e + 1, e - 1].filter((x) => x >= 0 && x !== e).slice(0, 3).map(String)], a: 0, e: 'Conte 2 por C=C do anel, 2 por par isolado em orbital p, 0 por orbital p vazio.' }; }];

const BANK = [
  T('Estrutura', 'Hibridização dos carbonos do benzeno:', ['sp²', 'sp³', 'sp', 'sp³d'], 'Três domínios σ; um orbital p.'),
  T('Estrutura', 'Comprimento C–C no benzeno:', ['≈ 1,39 Å, todas iguais', '1,54 e 1,34 Å alternadas', '1,20 Å', '1,54 Å'], 'Intermediário.'),
  T('Estrutura', 'O benzeno é:', ['planar, hexágono regular', 'em forma de cadeira', 'em forma de banheira', 'linear'], 'Orbitais p paralelos.'),
  T('Ressonância', 'As estruturas de Kekulé do benzeno:', ['são formas de ressonância de uma única molécula', 'são isômeros em equilíbrio', 'alternam rapidamente', 'são tautômeros'], 'Híbrido.'),
  T('Ressonância', 'O círculo dentro do hexágono representa:', ['6 elétrons π deslocalizados', 'uma ligação tripla', 'um par isolado', 'três ligações σ'], 'Híbrido de ressonância.'),
  T('Ressonância', 'Ordem de ligação C–C do benzeno:', ['1,5', '1', '2', '3'], 'Média das formas de Kekulé.'),
  T('Orbitais', 'Quantos OM π o benzeno tem e quantos estão ocupados?', ['6; 3 (ligantes)', '3; 3', '6; 6', '12; 6'], '6 orbitais p → 6 OM π.'),
  T('Orbitais', 'A densidade π do benzeno fica:', ['acima e abaixo do plano do anel', 'no plano do anel', 'só sobre os H', 'no centro do anel'], 'O plano do anel é nodal.'),
  T('Orbitais', 'No círculo de Frost do benzeno, os 6 elétrons ocupam:', ['os 3 OM ligantes (camada fechada)', 'OM não ligantes', 'OM antiligantes', '2 ligantes e 1 antiligante'], 'Por isso é estável.'),
  T('Estabilidade', 'Estabilização aromática estimada do benzeno:', ['≈ 150 kJ/mol', '≈ 15 kJ/mol', '≈ 1500 kJ/mol', 'zero'], '360 − 208.'),
  T('Estabilidade', 'ΔH(hidrogenação) observado do benzeno:', ['≈ −208 kJ/mol', '≈ −360 kJ/mol', '≈ −120 kJ/mol', '≈ +208 kJ/mol'], 'Menos exotérmico que o esperado.'),
  T('Estabilidade', '"Estável" no contexto da aromaticidade significa:', ['energia mais baixa que a do sistema não aromático de referência', 'que não reage', 'que é gasoso', 'que é inerte a eletrófilos'], 'Estável ≠ inerte.'),
  T('Estabilidade', 'O ciclo-hexa-1,3-dieno tem estabilização por conjugação:', ['pequena (≈ 8 kJ/mol)', '≈ 150 kJ/mol', 'negativa', 'igual à do benzeno'], 'Conjugação aberta.'),
  T('Critérios', 'Critérios de aromaticidade:', ['cíclico, planar, conjugado, 4n+2 elétrons π', 'cíclico e com heteroátomo', 'planar e saturado', 'cíclico e com 4n elétrons'], 'Hückel.'),
  T('Critérios', 'Um carbono sp³ no anel:', ['interrompe a conjugação cíclica', 'aumenta a aromaticidade', 'não altera nada', 'contribui com 2 elétrons π'], 'Sem orbital p.'),
  T('Critérios', 'O hexa-1,3,5-trieno não é aromático porque:', ['não é cíclico', 'não tem 6 elétrons π', 'não é conjugado', 'é antiaromático'], 'Cadeia aberta.'),
  T('Hückel', 'Valores 4n+2:', ['2, 6, 10, 14', '4, 8, 12', '3, 7, 11', '1, 5, 9'], 'n = 0, 1, 2, 3.'),
  T('Hückel', 'Antiaromático:', ['cíclico, plano, conjugado, 4n elétrons π', 'qualquer não aromático', 'acíclico com 4n elétrons', 'com C sp³'], 'Desestabilizado.'),
  T('Hückel', 'Por que a contagem 4n+2 sozinha não basta?', ['a regra só vale se o sistema for cíclico, planar e conjugado', 'porque é uma regra empírica falsa', 'porque depende do solvente', 'porque só vale para íons'], 'Ex.: COT.'),
  T('Classificação', 'O COT é não aromático porque:', ['adota forma de banheira (não planar)', 'tem 6 elétrons π', 'tem C sp³', 'é acíclico'], 'Escapa da antiaromaticidade.'),
  T('Classificação', 'O ciclobutadieno é:', ['antiaromático e muito instável', 'aromático', 'não aromático estável', 'um gás nobre'], '4 elétrons π.'),
  T('Íons', 'O carbocátion num anel conjugado contribui com:', ['orbital p vazio (0 elétrons π)', '2 elétrons π', '1 elétron π', 'interrompe a conjugação'], 'C⁺ sp².'),
  T('Íons', 'O carbânion num anel conjugado contribui com:', ['2 elétrons π (par no orbital p)', '0', '1', '3'], 'Par no p.'),
  T('Íons', 'O ciclopentadieno é ácido incomum (pKa ≈ 16) porque:', ['sua base conjugada é aromática', 'é aromático', 'tem N', 'é antiaromático'], 'C₅H₅⁻: 6 e π.'),
  T('Íons', 'O cátion tropílio tem:', ['6 elétrons π, aromático', '7 elétrons π', '8 elétrons π, antiaromático', '0 elétron π'], 'C₇H₇⁺.'),
  T('Heteroaromáticos', 'A piridina é básica porque:', ['seu par isolado (sp², no plano) não faz parte do sistema π', 'seu par está no sistema π', 'não é aromática', 'tem NH'], 'Disponível para H⁺.'),
  T('Heteroaromáticos', 'O pirrol é pouco básico porque:', ['seu par isolado faz parte do sexteto aromático', 'não tem par isolado', 'é antiaromático', 'tem N sp³'], 'Protonar destrói a aromaticidade.'),
  T('Heteroaromáticos', 'No furano, o O:', ['tem um par no sistema π e outro no plano', 'tem os dois pares no sistema π', 'não tem pares', 'é sp³'], 'Um orbital p comporta 2 e.'),
  T('Heteroaromáticos', 'Comparado ao benzeno, o anel do pirrol é:', ['π-excedente (mais rico)', 'π-deficiente', 'igual', 'não aromático'], 'O N doa seu par.'),
  T('Policíclicos', 'Naftaleno, antraceno e fenantreno têm, respectivamente:', ['10, 14 e 14 elétrons π', '10, 12 e 14', '6, 10 e 14', '8, 12 e 12'], 'C sp².'),
  T('Policíclicos', 'Sobre sistemas fundidos:', ['a regra de Hückel deve ser aplicada com cuidado (formulada para monocíclicos)', 'nunca são aromáticos', 'são sempre antiaromáticos', 'não têm elétrons π'], 'Análise qualitativa.'),
  T('Substituição × adição', 'Por que o benzeno prefere substituição a adição?', ['a substituição preserva a aromaticidade no produto; a adição a destrói', 'o benzeno não tem elétrons π', 'a adição é sempre impossível', 'Br₂ é nucleófilo'], 'Frase central.'),
  T('Substituição × adição', 'O produto de adição de Br₂ ao benzeno seria:', ['não aromático e menos estável', 'aromático', 'antiaromático', 'mais estável que o bromobenzeno'], 'Perde ≈ 150 kJ/mol.'),
  T('Substituição × adição', 'Aromáticos podem sofrer adição?', ['sim, em condições específicas (ex.: hidrogenação sob pressão/catalisador, adições radicalares)', 'nunca', 'só em água', 'só com FeBr₃'], 'Evite afirmações absolutas.'),
  T('SEA', 'Equação geral da SEA:', ['Ar–H + E⁺ → Ar–E + H⁺', 'Ar–H + Nu⁻ → Ar–Nu + H⁻', 'Ar + E₂ → Ar–E₂', 'Ar–H → Ar + H'], 'Substitui H por E.'),
  T('SEA', 'O complexo σ é:', ['um carbocátion não aromático estabilizado por ressonância', 'aromático', 'um radical', 'um carbânion'], 'Íon arênio / de Wheland.'),
  T('SEA', 'No íon arênio, a carga + fica em:', ['posições orto e para ao C sp³', 'meta', 'no C sp³', 'no eletrófilo'], 'Três formas.'),
  T('SEA', 'A etapa lenta da SEA costuma ser:', ['a formação do complexo σ', 'a perda de H⁺', 'a geração de HBr', 'a dissociação do produto'], 'Perda temporária de aromaticidade.'),
  T('SEA', 'Eletrófilo da nitração:', ['NO₂⁺', 'NO₃⁻', 'HNO₂', 'NO'], 'Íon nitrônio, linear.'),
  T('SEA', 'Função do FeBr₃ na bromação:', ['ácido de Lewis que polariza/ativa o Br₂', 'base que remove H⁺ apenas', 'solvente', 'agente redutor'], 'Gera eletrófilo forte.'),
  T('SEA', 'Qual SEA é reversível?', ['sulfonação', 'nitração', 'bromação', 'acilação'], 'Dessulfonação em ácido diluído a quente.'),
  T('SEA', 'Limitação da alquilação de Friedel–Crafts:', ['rearranjos de carbocátion e polialquilação', 'não ocorre com AlCl₃', 'gera ânions', 'é sempre reversível'], 'Prefira acilação + redução.'),
  clsG('benzeno'), clsG('ciclobutadieno'), clsG('cot'), clsG('cpH'), clsG('cp'), clsG('cpPlus'), clsG('tropilio'), clsG('cicloheptatrieno'), clsG('piridina'), clsG('pirrol'), clsG('cot2'), clsG('ciclopropenilio'),
  eG('pirrol'), eG('tropilio'), eG('cp'), eG('cot'), eG('ciclopropenilio'), eG('furano'), eG('naftaleno'),
];
export const TOPIC_SECTION = { Estrutura: 'estrutura', Ressonância: 'kekule', Orbitais: 'orbitais', Estabilidade: 'estabilidade', Critérios: 'criterios', Hückel: 'huckel', Classificação: 'classes', Íons: 'ions', Heteroaromáticos: 'hetero', Policíclicos: 'policiclicos', 'Contagem π': 'classes', 'Substituição × adição': 'adicao', SEA: 'sea' };
export const BANK_SIZE = BANK.length;
export function classify(p) { return p < 50 ? 'Revise os fundamentos' : p < 70 ? 'Em desenvolvimento' : p < 85 ? 'Bom domínio' : 'Excelente domínio'; }

export function quiz(host, nav) {
  let qs = [], i = 0, score = 0, answered = false, wrong = {};
  const box = h('div', { class: 'quizbox' });
  host.append(box);
  function start() { qs = shuffle(BANK).slice(0, 35).map(([topic, g]) => { const q = g(); const ord = shuffle(q.o.map((_, k) => k)); return Object.assign({ topic }, q, { o: ord.map((k) => q.o[k]), a: ord.indexOf(q.a) }); }); i = 0; score = 0; wrong = {}; render(); }
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
      topics.length ? h('div', null, h('p', null, h('b', null, 'Tópicos para revisar:')), h('ul', null, topics.map(([t, n]) => h('li', null, h('a', { href: '#' + (TOPIC_SECTION[t] || 'inicio'), onclick: (e) => { e.preventDefault(); nav(TOPIC_SECTION[t] || 'inicio'); } }, t), ` — ${n} erro(s)`)))) : h('p', null, 'Nenhum erro: parabéns!'),
      h('div', { class: 'ex-actions', style: 'justify-content:center' }, h('button', { class: 'btn primary', type: 'button', onclick: start }, '↺ Novo quiz'), h('button', { class: 'btn', type: 'button', onclick: () => nav('quiz', 'desafio') }, '⚡ Modo desafio'))));
  }
  start();
}

/* ===================================================================
 * Desafios
 * =================================================================== */
const POOL = ['benzeno', 'ciclobutadieno', 'cot', 'cot2', 'ciclopropenilio', 'cp', 'cpH', 'cpPlus', 'tropilio', 'cicloheptatrieno', 'heptatrienila', 'cicloexadieno', 'piridina', 'pirrol', 'furano', 'tiofeno', 'pirimidina', 'imidazol', 'naftaleno', 'antraceno', 'fenantreno'];
export function challenge(host) {
  const st = { pts: 0, streak: 0, best: 0, n: 0, ok: 0, timer: null, t0: 0, done: false, mode: 'cls' };
  const TIME = 15000;
  const stats = h('div', { class: 'ch-stats' }), bar = h('span', { style: 'width:100%' }), card = h('div', { class: 'ch-card' });
  const modes = h('div', { class: 'controls', style: 'justify-content:center' }, ...[['cls', 'Aromático ou não em 15 segundos'], ['e', 'Quantos elétrons π?']].map(([k, t]) => h('button', { class: 'btn sm', type: 'button', 'aria-pressed': k === st.mode, onclick: (e) => { st.mode = k; modes.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', b === e.currentTarget)); clearInterval(st.timer); intro(); } }, t)));
  host.append(h('div', { class: 'challenge' }, modes, stats, h('div', { class: 'timer' }, bar), card));
  const drawStats = () => { stats.innerHTML = ''; [['pontos', st.pts], ['sequência', st.streak], ['recorde', st.best], ['acertos', `${st.ok}/${st.n}`]].forEach(([k, v]) => stats.append(h('div', null, h('b', null, String(v)), h('small', null, k)))); };
  function intro() { card.innerHTML = ''; bar.style.width = '100%'; card.append(h('h3', { style: 'margin-top:0' }, 'Modo desafio'), h('p', null, 'Responda em até 15 s. Acertos rápidos valem mais; sequências multiplicam os pontos.'), h('button', { class: 'btn accent lg', type: 'button', onclick: next }, '▶ Começar')); drawStats(); }
  let last = null;
  function next() {
    clearInterval(st.timer); st.done = false; card.innerHTML = '';
    let k; do { k = rnd(POOL); } while (k === last); last = k;
    const def = MOLS[k], R = analyze(def);
    const q = st.mode === 'cls'
      ? { kind: 'Aromático ou não?', q: def.name, o: ['aromático', 'antiaromático', 'não aromático'], a: CLS[R.cls][0], e: R.msgs.join(' ') }
      : { kind: 'Quantos elétrons π?', q: def.name, o: [...new Set([R.e - 2, R.e, R.e + 2, R.e === 6 ? 4 : R.e + 4].filter((x) => x >= 0))].sort((a, b) => a - b).map(String), a: String(R.e), e: 'Conte 2 por C=C, 2 por par em orbital p, 0 por orbital p vazio.' };
    const fbx = h('div', { 'aria-live': 'assertive' });
    const ans = h('div', { class: 'ch-answers' }, q.o.map((t) => h('button', { class: 'btn', type: 'button', onclick: () => answer(t, q, ans, fbx) }, t)));
    card.append(h('div', { class: 'topic' }, q.kind), h('div', { class: 'figs' }, ringFig(def, { cap: false, scale: def.kind === 'fused' ? 30 : 40 })), h('h4', { style: 'text-align:center' }, q.q), ans, fbx);
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
