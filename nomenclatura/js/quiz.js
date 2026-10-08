/*
 * quiz.js — quiz final (40 questões sorteadas de um banco > 50, com
 * questões geradas pelo motor de nomenclatura) e modos desafio:
 * "Nomeie em 20 segundos", "Qual é a função?", "Encontre a cadeia principal".
 */
import { h, shuffle } from './widgets2d.js';
import { M, ALL } from './lib.js';
import { bondOrder } from './chem.js';
import { STEM, PRIO_NAME, rankParents } from './namer.js';
import { decoy, draw, nameHTML, pickable, rnd } from './core.js';
import { fnOf, judgeChain } from './modules.js';
import { distractors } from './tools.js';

const FN4 = ['alcano', 'alceno', 'alcino', 'aromático', 'haleto', 'álcool', 'fenol', 'éter', 'aldeído', 'cetona', 'ácido carboxílico', 'éster', 'amina', 'amida', 'nitrila', 'nitrocomposto'];
const S = (s, sc = 34) => () => draw(s, { scale: sc, fs: 15 });

/* questões geradas: estrutura → nome */
const qName = (topic, s) => [topic, () => { const X = M(s); return { fig: S(s, 40), q: 'Qual é o nome IUPAC?', o: [X.name, ...distractors(X, 3)], a: 0, e: 'Resposta: ' + nameHTML(X) + '.' }; }];
/* nome → estrutura */
const qStruct = (topic, s) => [topic, () => { const X = M(s); const iso = shuffle(ALL.filter((x) => x !== s && M(x).formula === X.formula && M(x).name)).slice(0, 3); while (iso.length < 3) { const y = rnd(ALL); if (y !== s && !iso.includes(y)) iso.push(y); } return { q: `Qual estrutura é <b>${X.name}</b>?`, o: [S(s, 26), ...iso.map((y) => S(y, 26))], a: 0, struct: true, e: 'A estrutura correta tem ' + X.r.parent.P.length + ' C na cadeia principal.' }; }];
/* função */
const qFn = (s) => ['Reconhecimento', () => { const X = M(s), a = fnOf(X); const o = [a, ...shuffle(FN4.filter((x) => x !== a)).slice(0, 3)]; return { fig: S(s, 40), q: 'Qual é a função orgânica?', o, a: 0, e: `${a}. Nome: ${nameHTML(X)}.` }; }];
/* cadeia */
const qLen = (s) => ['Cadeia principal', () => { const X = M(s), n = X.r.parent.P.length; const o = [n, n + 1, n - 1, n + 2].map((k) => `${k} C (${STEM[k] || '?'})`); return { fig: S(s, 40), q: 'Quantos carbonos tem a cadeia principal?', o, a: 0, e: nameHTML(X) + '.' }; }];
/* função principal */
const qPrinc = (s) => ['Prioridade', () => { const X = M(s), types = [...new Set(X.fgs.map((f) => (f.type === 'fenol' ? 'alcool' : f.type)).filter((t) => PRIO_NAME[t]))]; const o = [PRIO_NAME[X.r.princType], ...types.filter((t) => t !== X.r.princType).map((t) => PRIO_NAME[t])]; return { fig: S(s, 40), q: 'Qual é a função principal (sufixo)?', o, a: 0, e: nameHTML(X) + '.' }; }];
const T = (topic, q, o, e) => [topic, () => ({ q, o, a: 0, e })];

const BANK = [
  qName('Alcanos', 'CC(C)CC(C)C(C)C'), qName('Alcanos', 'CCC(CC)CC'), qName('Alcanos', 'CCCC(CC)C(C)C'), qName('Alcenos e alcinos', 'C=CC(C)CC'), qName('Alcenos e alcinos', 'CC#CCC'), qName('Alcenos e alcinos', 'C=CC=CCC'),
  qName('Cíclicos e aromáticos', 'CCC1CCCC(C)C1'), qName('Cíclicos e aromáticos', 'Cc1ccc(Cl)cc1'), qName('Oxigenadas', 'CC(O)C(C)C'), qName('Oxigenadas', 'CC(C)CC=O'), qName('Oxigenadas', 'CCC(=O)CC(C)C'), qName('Oxigenadas', 'CC(C)CC(=O)O'),
  qName('Oxigenadas', 'CCC(=O)OCC'), qName('Nitrogenadas', 'CCC(C)N'), qName('Nitrogenadas', 'CCC(=O)NC'), qName('Nitrogenadas', 'CC(C)CC#N'), qName('Multifuncionais', 'CC(O)CC(=O)O'), qName('Multifuncionais', 'CC(=O)CC(C)(C)O'), qName('Halogenados', 'CC(Cl)CC(C)C'),
  qStruct('Nome → estrutura', 'CC(O)C(C)CC'), qStruct('Nome → estrutura', 'CC(C)C(C)C'), qStruct('Nome → estrutura', 'CCC(=O)CC'), qStruct('Nome → estrutura', 'CC(C)CO'), qStruct('Nome → estrutura', 'CCOCC'), qStruct('Nome → estrutura', 'CC=C(C)C'),
  qFn('CCOCC'), qFn('CC(=O)OC'), qFn('Oc1ccccc1'), qFn('CCC#N'), qFn('CC(N)=O'), qFn('CCC=O'), qFn('CNC'),
  qLen('CCC(CC)CC(C)C'), qLen('OCC(CCC)CCCC'), qLen('CCCC(C(C)C)CCC'), qLen('C=CC(CC)CCC'),
  qPrinc('CC(O)CC(=O)O'), qPrinc('NCCC=O'), qPrinc('CC(=O)CCO'), qPrinc('NCCC#N'), qPrinc('NC(C)CO'),
  T('Leitura', 'Na estrutura esquelética, cada vértice e cada extremidade representam:', ['um carbono (com os H implícitos)', 'um hidrogênio', 'um heteroátomo', 'um par de elétrons'], 'Os H dos carbonos ficam implícitos.'),
  T('Leitura', 'Quantos H implícitos tem um carbono com duas ligações simples desenhadas?', ['2', '1', '3', '0'], 'Tetravalência: 2 + 2 = 4.'),
  T('Leitura', 'C₄H₁₀O, CH₃CH₂CH₂CH₂OH e a estrutura esquelética do butan-1-ol representam:', ['a mesma molécula', 'três isômeros', 'moléculas diferentes', 'conformações diferentes de isômeros'], 'São representações da mesma conectividade (a fórmula molecular sozinha, porém, não define a estrutura).'),
  T('Cadeias', 'CH₃–CH₂–O–CH₂–CH₃ tem cadeia:', ['aberta, normal, saturada, heterogênea', 'fechada, homogênea', 'aberta, ramificada, insaturada', 'mista'], 'O entre carbonos → heterogênea.'),
  T('Regras', 'Qual é a forma correta?', ['2,3-dimetilbutano', '2,3 dimetilbutano', '2-3-dimetilbutano', '2,3-dimetil-butano'], 'Vírgula entre números, hífen entre número e letra; prefixo colado ao nome-base.'),
  T('Regras', 'Na ordem alfabética dos prefixos, ignora-se:', ['di, tri, tetra, sec e terc', 'iso', 'todas as letras', 'os nomes dos halogênios'], '“iso” conta (isopropil em “i”).'),
  T('Numeração', 'Entre os conjuntos {2,7,8} e {3,4,9}, a regra escolhe:', ['{2,7,8}, pelo primeiro ponto de diferença', '{3,4,9}, por ter soma menor', 'qualquer um', 'o de maior soma'], 'Compara-se termo a termo: 2 < 3. A soma não é usada.'),
  T('Numeração', 'No pentan-2-ol, numera-se a partir da extremidade:', ['mais próxima do OH', 'mais próxima de um metil', 'da esquerda sempre', 'mais distante do OH'], 'O grupo principal recebe o menor localizador.'),
  T('Numeração', 'Em um aldeído, o carbono do CHO é sempre:', ['C1 (localizador omitido)', 'o último carbono', 'C2', 'um substituinte'], 'Grupo terminal.'),
  T('Cadeia principal', 'A cadeia principal é sempre a mais longa?', ['não: primeiro ela deve conter o grupo principal', 'sim, sempre', 'só em alcanos ela não é', 'só em cíclicos'], 'Ex.: 2-propil-hexan-1-ol.'),
  T('Cadeia principal', 'Pela IUPAC 2013, entre anel e cadeia (sem grupo principal decidindo):', ['o anel é a estrutura principal', 'a cadeia sempre', 'o maior número de carbonos', 'tanto faz'], 'Ex.: propilciclo-hexano.'),
  T('Substituintes', '–CH(CH₃)₂ é chamado:', ['propan-2-il (isopropil)', 'propil', 'butil', 'terc-butil'], 'Ligado pelo C central.'),
  T('Substituintes', '–C(CH₃)₃ é chamado:', ['terc-butil', 'isobutil', 'sec-butil', 'butil'], 'C ligado a três metilas.'),
  T('Prioridade', 'Qual função tem maior prioridade?', ['ácido carboxílico', 'aldeído', 'cetona', 'álcool'], 'Ácidos e derivados no topo.'),
  T('Prioridade', 'Em uma molécula com OH e C=O de cetona, o OH aparece como:', ['hidroxi- (prefixo)', '-ol (sufixo)', 'oxo-', 'não aparece'], 'Cetona > álcool.'),
  T('Prioridade', 'Halogênios, nitro e alcóxi aparecem:', ['sempre como prefixos', 'sempre como sufixos', 'como infixos', 'só em nomes usuais'], 'Nunca são sufixos.'),
  T('Oxigenadas', 'Fenol × álcool: no fenol o OH está ligado a:', ['carbono do anel aromático', 'carbono sp³', 'oxigênio', 'carbonila'], 'C₆H₅CH₂OH é álcool.'),
  T('Oxigenadas', 'O nome de um éster segue o padrão:', ['…oato de …ila', 'ácido …oico', '…ol', 'alcóxi…ano'], 'Ex.: etanoato de etila.'),
  T('Oxigenadas', 'CH₃–O–CH₂CH₃ chama-se:', ['metoxietano', 'etoximetano', 'etanoato de metila', 'propan-2-ol'], 'O grupo menor vira alcóxi; a cadeia maior é o nome-base.'),
  T('Nitrogenadas', '(CH₃)₂NH é uma amina:', ['secundária', 'primária', 'terciária', 'quaternária'], 'Dois C ligados ao N.'),
  T('Nitrogenadas', 'No nome N,N-dimetilmetanamida, o “N” indica:', ['substituintes ligados ao nitrogênio', 'posição 14 da cadeia', 'nitrila', 'nitro'], 'Localizador do átomo de N.'),
  T('Nitrogenadas', 'CH₃CH₂C≡N chama-se:', ['propanonitrila', 'etanonitrila', 'propinamina', 'but-1-ino'], 'O C do CN conta na cadeia.'),
  T('Aromáticos', '1,3-dimetilbenzeno corresponde ao prefixo:', ['meta (m-)', 'orto (o-)', 'para (p-)', 'nenhum'], '1,2 = orto; 1,3 = meta; 1,4 = para.'),
  T('Nomes usuais', '“Tolueno” é:', ['nome usual (retido) do metilbenzeno', 'nome sistemático obrigatório', 'um alcano', 'um fenol'], 'Distinga nome sistemático de usual/retido.'),
  T('3D', 'Girar ligações simples (mudar a conformação) altera o nome?', ['não: a conectividade é a mesma', 'sim', 'só em alcenos', 'só em cicloalcanos'], 'Nome depende da conectividade.'),
];
export const TOPIC_SECTION = { Alcanos: 'alcanos', 'Alcenos e alcinos': 'alcenos', 'Cíclicos e aromáticos': 'ciclicos', Oxigenadas: 'alcoois', Nitrogenadas: 'aminas', Multifuncionais: 'multifuncionais', Halogenados: 'haletos', 'Nome → estrutura': 'nomeestrutura', Reconhecimento: 'funcoes', 'Cadeia principal': 'cadeia', Prioridade: 'prioridade', Leitura: 'leitura', Cadeias: 'cadeias', Regras: 'regras', Numeração: 'numeracao', Substituintes: 'substituintes', Aromáticos: 'aromaticos', 'Nomes usuais': 'regras', '3D': 'lab3d' };
export const BANK_SIZE = BANK.length;
export function classify(p) { return p < 50 ? 'Revise os fundamentos' : p < 70 ? 'Em desenvolvimento' : p < 85 ? 'Bom domínio' : 'Excelente domínio'; }

const optNode = (t) => (typeof t === 'function' ? t() : h('span', { html: String(t) }));
export function quiz(host, nav) {
  let qs = [], i = 0, score = 0, answered = false, wrong = {};
  const box = h('div', { class: 'quizbox' });
  host.append(box);
  function start() {
    qs = shuffle(BANK).slice(0, 40).map(([topic, gen]) => { const q = gen(); const ord = shuffle(q.o.map((_, k) => k)); return Object.assign({ topic }, q, { o: ord.map((k) => q.o[k]), a: ord.indexOf(q.a) }); });
    i = 0; score = 0; wrong = {}; render();
  }
  function render() {
    box.innerHTML = '';
    if (i >= qs.length) return result();
    const q = qs[i]; answered = false;
    box.append(h('div', { class: 'qprog' }, h('b', null, `${i + 1}/${qs.length}`), h('div', { class: 'bar' }, h('span', { style: `width:${(i / qs.length) * 100}%` })), h('span', { class: 'chip ok' }, `${score} acertos · ${i ? Math.round(100 * score / i) : 0}%`)));
    const fb = h('div', { 'aria-live': 'polite' });
    const next = h('button', { class: 'btn primary', type: 'button', disabled: true, onclick: () => { i++; render(); } }, i === qs.length - 1 ? 'Ver resultado' : 'Próxima →');
    const opts = h('div', { class: 'mcq' + (q.struct ? ' cols' : '') });
    q.o.forEach((t, k) => opts.append(h('button', { class: 'mopt' + (q.struct ? ' struct' : ''), type: 'button', onclick: (e) => {
      if (answered) return; answered = true;
      const ok = k === q.a; if (ok) score++; else wrong[q.topic] = (wrong[q.topic] || 0) + 1;
      [...opts.children].forEach((b, n) => { b.disabled = true; if (n === q.a) b.classList.add('right'); });
      if (!ok) e.currentTarget.classList.add('wrong');
      fb.innerHTML = `<div class="fb ${ok ? 'ok' : 'bad'}">${ok ? '✔ Correto.' : '✘ Incorreto.'} ${q.e}</div>`;
      next.disabled = false; next.focus();
    } }, h('span', { class: 'l' }, 'abcd'[k]), optNode(t))));
    box.append(h('div', { class: 'qcard' }, h('div', { class: 'topic' }, q.topic), h('h4', { html: q.q }), q.fig ? h('div', { class: 'figs' }, q.fig()) : null, opts, fb, h('div', { class: 'ex-actions' }, next)));
  }
  function result() {
    const pct = Math.round(100 * score / qs.length);
    const topics = Object.entries(wrong).sort((a, b) => b[1] - a[1]);
    box.append(h('div', { class: 'qcard result' }, h('div', { class: 'pct' }, pct + '%'), h('div', { class: 'cls' }, classify(pct)), h('p', null, `${score} de ${qs.length} corretas.`),
      topics.length ? h('div', null, h('p', null, h('b', null, 'Tópicos com maior dificuldade (revise):')), h('ul', null, topics.map(([t, n]) => h('li', null, h('a', { href: '#' + (TOPIC_SECTION[t] || 'inicio'), onclick: (e) => { e.preventDefault(); nav(TOPIC_SECTION[t] || 'inicio'); } }, t), ` — ${n} erro(s)`)))) : h('p', null, 'Nenhum erro: parabéns!'),
      h('div', { class: 'ex-actions', style: 'justify-content:center' }, h('button', { class: 'btn primary', type: 'button', onclick: start }, '↺ Novo quiz'), h('button', { class: 'btn', type: 'button', onclick: () => nav('quiz', 'desafio') }, '⚡ Modo desafio'))));
  }
  start();
}

/* ===================================================================
 * Desafios
 * =================================================================== */
const NAMEPOOL = () => ALL.filter((s) => M(s).name && !M(s).r.arom);
const SINGLE_FN = ['CCCC', 'CC=CC', 'CC#CC', 'Cc1ccccc1', 'CCCCl', 'CCO', 'Oc1ccccc1', 'CCOCC', 'CCC=O', 'CC(=O)CC', 'CCC(=O)O', 'CC(=O)OC', 'CCN', 'CC(N)=O', 'CCC#N', 'CCC[N+](=O)[O-]', 'CC(C)CO', 'CNC', 'COC(C)C', 'CC(C)C=O'];
const CHAINS = ['CCC(CC)CC(C)C', 'CC(C)C(CC)CCC', 'CCCC(C(C)C)CCC', 'OCC(CCC)CCCC', 'C=CC(CC)CCC', 'CC(CC)C(C)CC(C)C', 'CCC(C)C(CC)CC', 'CCCC(CC=O)CC'];
export function challenge(host) {
  const st = { pts: 0, streak: 0, best: 0, n: 0, ok: 0, timer: null, t0: 0, done: false, mode: 'name' };
  const TIME = 20000;
  const stats = h('div', { class: 'ch-stats' }), bar = h('span', { style: 'width:100%' }), card = h('div', { class: 'ch-card' });
  const modes = h('div', { class: 'controls', style: 'justify-content:center' }, ...[['name', 'Nomeie em 20 segundos'], ['fn', 'Qual é a função?'], ['chain', 'Encontre a cadeia principal']].map(([k, t]) => h('button', { class: 'btn sm', type: 'button', 'aria-pressed': k === st.mode, onclick: (e) => { st.mode = k; modes.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', b === e.currentTarget)); clearInterval(st.timer); intro(); } }, t)));
  host.append(h('div', { class: 'challenge' }, modes, stats, h('div', { class: 'timer' }, bar), card));
  const drawStats = () => { stats.innerHTML = ''; [['pontos', st.pts], ['sequência', st.streak], ['recorde', st.best], ['acertos', `${st.ok}/${st.n}`]].forEach(([k, v]) => stats.append(h('div', null, h('b', null, String(v)), h('small', null, k)))); };
  function intro() { card.innerHTML = ''; bar.style.width = '100%'; card.append(h('h3', { style: 'margin-top:0' }, 'Modo desafio'), h('p', null, 'Você tem 20 s por questão. Acertos rápidos valem mais e sequências multiplicam os pontos.'), h('button', { class: 'btn accent lg', type: 'button', onclick: next }, '▶ Começar')); drawStats(); }
  function next() {
    clearInterval(st.timer); st.done = false; card.innerHTML = '';
    const fb = h('div', { 'aria-live': 'assertive' });
    let q;
    if (st.mode === 'chain') {
      const s = rnd(CHAINS), X = M(s), best = rankParents(X.m)[0], chosen = [];
      const wrap = h('div', { class: 'pick' });
      const redraw = () => { const bc = {}; for (let i = 0; i < chosen.length; i++) for (let j = i + 1; j < chosen.length; j++) if (bondOrder(X.m, chosen[i], chosen[j])) bc[Math.min(chosen[i], chosen[j]) + '-' + Math.max(chosen[i], chosen[j])] = 'mc'; const svg = draw(X, { scale: 44, fs: 18, zoom: 1.3, bondCls: bc, P2: decoy(X) }); wrap.replaceChildren(svg); const P = pickable(svg, X.m.atoms.map((_, i) => i).filter((i) => X.m.atoms[i].el === 'C'), (i) => { if (st.done) return; const p = chosen.indexOf(i); if (p >= 0) chosen.splice(p, 1); else chosen.push(i); redraw(); }); chosen.forEach((i) => P.set(i, 'on')); };
      redraw();
      q = { judge: () => { const r = judgeChain(X, chosen, best); return { ok: r.classList.contains('ok'), html: r.innerHTML }; } };
      card.append(h('div', { class: 'topic' }, 'Encontre a cadeia principal'), wrap, h('div', { class: 'ex-actions', style: 'justify-content:center' }, h('button', { class: 'btn primary', type: 'button', onclick: () => answer(q, fb) }, 'Pronto')), fb);
    } else {
      let s, ans, opts, e, fig;
      if (st.mode === 'name') { s = rnd(NAMEPOOL()); const X = M(s); ans = X.name; opts = shuffle([ans, ...distractors(X, 3)]); e = nameHTML(X); fig = draw(X, { scale: 44, fs: 18 }); }
      else { s = rnd(SINGLE_FN); const X = M(s); ans = fnOf(X); opts = shuffle([ans, ...shuffle(FN4.filter((x) => x !== ans)).slice(0, 3)]); e = `${ans} · ${nameHTML(X)}`; fig = draw(X, { scale: 44, fs: 18 }); }
      const box = h('div', { class: 'ch-answers' }, opts.map((t) => h('button', { class: 'btn', type: 'button', onclick: () => answer({ pick: t, ans, e, box }, fb) }, t)));
      q = { box };
      card.append(h('div', { class: 'topic' }, st.mode === 'name' ? 'Nomeie em 20 segundos' : 'Qual é a função?'), h('div', { class: 'figs' }, fig), box, fb);
      q.timeout = () => answer({ pick: null, ans, e, box }, fb);
    }
    st.t0 = performance.now();
    st.timer = setInterval(() => { const left = Math.max(0, 1 - (performance.now() - st.t0) / TIME); bar.style.width = left * 100 + '%'; if (left <= 0) { if (q.timeout) q.timeout(); else answer(q, fb, true); } }, 100);
  }
  function answer(q, fb, timeout) {
    if (st.done) return; st.done = true; clearInterval(st.timer);
    let ok, msg;
    if (q.judge) { const r = q.judge(); ok = !timeout && r.ok; msg = r.html; }
    else { ok = q.pick === q.ans; msg = q.e; [...q.box.children].forEach((b) => { b.disabled = true; if (b.textContent === q.ans) b.classList.add('primary'); }); }
    st.n++;
    if (ok) { st.ok++; st.streak++; st.best = Math.max(st.best, st.streak); const left = Math.max(0, 1 - (performance.now() - st.t0) / TIME); st.pts += Math.round((10 + 10 * left) * (1 + Math.min(st.streak - 1, 4) * 0.25)); } else st.streak = 0;
    fb.innerHTML = `<div class="fb ${ok ? 'ok' : 'bad'}">${timeout || q.pick === null ? '⏱ Tempo esgotado. ' : ok ? '✔ Correto! ' : '✘ Não. '}${msg}</div>`;
    fb.append(h('div', { class: 'ex-actions', style: 'justify-content:center' }, h('button', { class: 'btn primary', type: 'button', onclick: next }, 'Próxima →')));
    drawStats();
  }
  intro();
  return { stop() { clearInterval(st.timer); } };
}
