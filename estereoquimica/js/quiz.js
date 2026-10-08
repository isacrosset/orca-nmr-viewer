/*
 * quiz.js — quiz final (35 questões sorteadas) e desafio
 * "R ou S em 15 segundos" alternado com "Enantiômero ou diastereoisômero?".
 */
import { h, shuffle } from './widgets2d.js';
import { LIB } from './library.js';
import { withCfg, mirrorMol, relation, rankCenter } from './stereo.js';
import { wedgeSVG, fischerSVG, ORIENT } from './draw.js';
import { orientWith4 } from './modules.js';
import { genFischer1, genFischerPair } from './tools.js';
import { crossSVG } from './draw.js';
import { glab } from './stereo.js';

const BANK = [
  ['Isomeria', 'Isômeros têm obrigatoriamente:', ['a mesma fórmula molecular', 'a mesma conectividade', 'o mesmo PF', 'centros estereogênicos'], 0, 'Definição de isômeros.'],
  ['Isomeria', 'Butano e 2-metilpropano são isômeros:', ['constitucionais (de cadeia)', 'enantiômeros', 'diastereoisômeros', 'conformacionais'], 0, 'Esqueletos diferentes.'],
  ['Isomeria', 'Propan-1-ol e propan-2-ol são isômeros de:', ['posição', 'função', 'cadeia', 'configuração'], 0, 'O OH muda de carbono.'],
  ['Isomeria', 'Estereoisômeros diferem em:', ['arranjo espacial, com a mesma conectividade', 'conectividade', 'fórmula molecular', 'número de átomos'], 0, 'Mesma constituição.'],
  ['Isomeria', 'Girar uma molécula inteira no espaço produz:', ['a mesma molécula', 'o enantiômero', 'um diastereoisômero', 'um isômero constitucional'], 0, 'Rotação não muda a identidade.'],
  ['Quiralidade', 'Uma molécula quiral:', ['não é sobreponível à imagem especular', 'tem plano de simetria', 'tem sempre um só centro', 'não gira a luz'], 0, 'Definição.'],
  ['Quiralidade', 'Um plano de simetria interno torna a molécula:', ['aquiral', 'quiral', 'racêmica', 'levorrotatória'], 0, 'Ela coincide com sua imagem.'],
  ['Quiralidade', 'Qual é quiral?', ['CHBrClF', 'CH₂Cl₂', 'propan-2-ol', 'CHCl₃'], 0, 'Quatro grupos diferentes.'],
  ['Quiralidade', 'Quiralidade é propriedade:', ['da molécula inteira (global)', 'de um único átomo apenas', 'só de carbonos', 'só de sólidos'], 0, 'Centros são uma causa comum, não a definição.'],
  ['Centros', 'Um centro estereogênico de carbono típico tem:', ['quatro grupos diferentes', 'dois H', 'uma ligação dupla', 'três grupos iguais'], 0, 'Carbono assimétrico.'],
  ['Centros', 'Quantos centros estereogênicos há no 3-metilpentan-2-ol?', ['2', '1', '3', '0'], 0, 'C2 e C3.'],
  ['Centros', 'O C3 do 3-metilpentano é centro?', ['não: tem duas etilas', 'sim', 'só em solução', 'depende do solvente'], 0, 'Grupos iguais.'],
  ['Centros', 'Trocar dois grupos de um centro:', ['inverte R/S', 'mantém R/S', 'gera isômero constitucional', 'remove o centro'], 0, 'Uma troca = inversão.'],
  ['CIP', 'Regra 1 do CIP:', ['maior número atômico, maior prioridade', 'maior massa do grupo inteiro', 'maior número de H', 'ordem alfabética'], 0, 'Primeiro átomo ligado.'],
  ['CIP', 'Entre T, D e H:', ['T > D > H', 'H > D > T', 'iguais', 'D > T > H'], 0, 'Isótopos: maior número de massa.'],
  ['CIP', 'CH₂OH × CH₃:', ['CH₂OH > CH₃ (O > H na camada 2)', 'CH₃ > CH₂OH', 'iguais', 'depende da geometria'], 0, '(O,H,H) × (H,H,H).'],
  ['CIP', 'Como o CIP trata o C de CHO?', ['C(O,O,H): o O é duplicado', 'C(O,H)', 'C(O,H,H)', 'ignora a dupla'], 0, 'Átomos duplicados.'],
  ['CIP', 'COOH × CHO:', ['COOH > CHO', 'CHO > COOH', 'iguais', 'depende'], 0, '(O,O,O) × (O,O,H).'],
  ['CIP', 'Isopropila × propila:', ['isopropila > propila', 'propila > isopropila', 'iguais', 'depende do centro'], 0, 'Camada 2: (C,C,H) × (C,H,H).'],
  ['CIP', 'Num empate, comparamos:', ['os conjuntos da camada seguinte, até o primeiro ponto de diferença', 'o número total de átomos', 'a massa total', 'a ordem alfabética'], 0, 'Algoritmo hierárquico.'],
  ['R/S', 'Com o grupo 4 para trás, 1 → 2 → 3 horário é:', ['R', 'S', '(+)', '(−)'], 0, 'Rectus.'],
  ['R/S', 'Se o grupo 4 está na cunha (para a frente):', ['leia e inverta', 'leia direto', 'é sempre R', 'não dá para saber'], 0, 'A leitura sai invertida.'],
  ['R/S', 'Se o grupo 4 está no plano, uma estratégia é:', ['trocá-lo com o grupo do tracejado, ler e inverter', 'ignorar o 4', 'sempre S', 'girar a Fischer 90°'], 0, 'Uma troca inverte.'],
  ['R/S', 'A imagem especular de um centro R é:', ['S', 'R', 'meso', 'racêmica'], 0, 'Reflexão inverte.'],
  ['R/S', 'Girar a molécula 180° muda R para S?', ['não', 'sim', 'só em Fischer', 'só se houver H'], 0, 'Rotação preserva a configuração.'],
  ['Nomenclatura', 'Forma correta:', ['(2R,3S)-2-bromo-3-clorobutano', '(R,S)-2-bromo-3-clorobutano', '2R,3S-2-bromo-3-clorobutano', '2-bromo-3-clorobutano-(2R,3S)'], 0, 'Locantes + descritores entre parênteses, antes do nome.'],
  ['Nomenclatura', 'Para um único centro, escreve-se:', ['(R)-butan-2-ol', '(2R)-butan-2-ol é obrigatório', 'R-butan-2-ol-(R)', 'butan-2-(R)-ol'], 0, 'Com um só centro, o locante é opcional.'],
  ['Fischer', 'Na Fischer, as linhas verticais apontam:', ['para trás', 'para a frente', 'no plano', 'para cima apenas'], 0, 'Horizontal = frente.'],
  ['Fischer', 'Girar a Fischer 90° no plano:', ['inverte a configuração', 'mantém', 'gera meso', 'não muda nada'], 0, 'Horizontal ↔ vertical.'],
  ['Fischer', 'Girar a Fischer 180° no plano:', ['mantém a configuração', 'inverte', 'gera diastereoisômero', 'proibido'], 0, 'Permitido.'],
  ['Fischer', 'Duas trocas de grupos numa Fischer:', ['restauram a configuração', 'invertem', 'geram meso', 'geram constitucional'], 0, 'Número par.'],
  ['Fischer', 'Com o H na horizontal, ao ler R/S na Fischer:', ['inverta o resultado', 'leia direto', 'é sempre S', 'é sempre R'], 0, 'H para a frente.'],
  ['Enantiômeros', 'Enantiômeros em ambiente aquiral têm:', ['mesmas propriedades físicas, exceto o sinal da rotação', 'PF diferentes', 'solubilidades diferentes', 'densidades diferentes'], 0, 'Reflexão preserva distâncias.'],
  ['Enantiômeros', 'Enantiômeros podem se comportar diferente:', ['com luz polarizada, reagentes quirais e sistemas biológicos', 'em qualquer solvente', 'no ponto de ebulição', 'nunca'], 0, 'Ambientes quirais distinguem enantiômeros.'],
  ['Diastereoisômeros', 'Diastereoisômeros:', ['têm propriedades físicas diferentes', 'são imagens especulares', 'têm sempre o mesmo PF', 'só existem em anéis'], 0, 'Não são reflexos.'],
  ['Diastereoisômeros', '(2R,3R) × (2S,3R) são:', ['diastereoisômeros', 'enantiômeros', 'idênticos', 'constitucionais'], 0, 'Só um centro invertido.'],
  ['Meso', 'Compostos meso:', ['têm centros e plano de simetria; são aquirais', 'são quirais', 'são misturas', 'não têm centros'], 0, 'Definição.'],
  ['Meso', '(2R,3S)-2,3-dibromobutano e (2S,3R)-2,3-dibromobutano são:', ['o mesmo composto (meso)', 'enantiômeros', 'diastereoisômeros', 'constitucionais'], 0, 'Simetria.'],
  ['Meso', 'O ácido tartárico tem quantos estereoisômeros?', ['3', '4', '2', '8'], 0, 'R,R / S,S / meso.'],
  ['Contagem', 'Número máximo de estereoisômeros com n centros:', ['2ⁿ', 'n²', '2n', 'n!'], 0, 'Cada centro: R ou S.'],
  ['Contagem', 'Uma aldo-hexose aberta (4 centros) tem:', ['16 estereoisômeros', '8', '4', '32'], 0, '2⁴.'],
  ['Contagem', 'O número real pode ser menor que 2ⁿ quando:', ['há formas meso (simetria)', 'há H', 'a molécula é grande', 'nunca'], 0, 'Combinações repetidas.'],
  ['Atividade óptica', 'Dextrorrotatório gira o plano da luz:', ['no sentido horário (+)', 'anti-horário (−)', 'não gira', 'depende de R/S'], 0, 'Visto pelo observador.'],
  ['Atividade óptica', '[α] = ', ['α / (l · c)', 'α · l · c', 'l / (α · c)', 'α / l'], 0, 'l em dm, c em g/mL.'],
  ['Atividade óptica', 'R/S e (+)/(−):', ['são independentes', 'R é sempre (+)', 'S é sempre (+)', 'são sinônimos'], 0, 'Erro clássico.'],
  ['Atividade óptica', 'α = +4,0°, l = 2 dm, c = 0,5 g/mL. [α] =', ['+4,0', '+16', '+1,0', '+8,0'], 0, '4,0/(2 × 0,5).'],
  ['Racêmicos', 'Uma mistura racêmica:', ['50:50 de enantiômeros, α = 0', 'um composto meso', '100% de um enantiômero', 'tem ee = 50%'], 0, 'Rotações se cancelam.'],
  ['Racêmicos', '90% R e 10% S: ee =', ['80%', '90%', '10%', '45%'], 0, '90 − 10.'],
  ['Racêmicos', 'Meso e racemato têm α = 0 porque:', ['meso é aquiral; o racemato é mistura cujas rotações se cancelam', 'ambos são aquirais', 'ambos são misturas', 'ambos não têm centros'], 0, 'Causas diferentes.'],
  ['Biologia', 'Receptores e enzimas distinguem enantiômeros porque:', ['são quirais', 'são aquirais', 'medem massa', 'ignoram a geometria'], 0, 'Interação quiral–quiral.'],
];
export const TOPIC_SECTION = { Isomeria: 'isomeria', Quiralidade: 'quiralidade', Centros: 'centros', CIP: 'cip', 'R/S': 'rs', Nomenclatura: 'nomenclatura', Fischer: 'fischer', Enantiômeros: 'enantiomeros', Diastereoisômeros: 'diastereoisomeros', Meso: 'meso', Contagem: 'numero', 'Atividade óptica': 'optica', Racêmicos: 'racemicas', Biologia: 'optica' };
export function classify(p) { return p < 50 ? 'Revise os fundamentos' : p < 70 ? 'Em desenvolvimento' : p < 85 ? 'Bom domínio' : 'Excelente domínio'; }
export const BANK_SIZE = BANK.length;

export function quiz(host, nav) {
  let qs = [], i = 0, score = 0, answered = false, wrong = {};
  const box = h('div', { class: 'quizbox' });
  host.append(box);
  function start() {
    qs = shuffle(BANK).slice(0, 35).map((q) => { const o = shuffle(q[2].map((_, k) => k)); return { topic: q[0], q: q[1], o: o.map((k) => q[2][k]), a: o.indexOf(q[3]), e: q[4] }; });
    i = 0; score = 0; wrong = {}; render();
  }
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
      h('div', { class: 'ex-actions', style: 'justify-content:center' }, h('button', { class: 'btn primary', type: 'button', onclick: start }, '↺ Novo quiz'), h('button', { class: 'btn', type: 'button', onclick: () => nav('quiz', 'desafio') }, '⚡ R ou S em 15 segundos'))));
  }
  start();
}

/* ===================================================================
 * Desafio: R ou S em 15 s ⇄ Enantiômero ou diastereoisômero?
 * =================================================================== */
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const ONE = ['butanol2', 'bromobutano2', 'lactico', 'gliceraldeido', 'alanina', 'propanodiol', 'bcf', 'metilhexano3', 'cloropropenol'];
function qRS(level) {
  if (level >= 3 && Math.random() < 0.4) {
    const F = genFischer1(), r = rankCenter(F.mol, F.mol.centers[0]).order, lbl = {};
    Object.keys(F.pos).forEach((k) => { lbl[k] = { t: glab(F.mol.groupAt[F.pos[k]]), c: '' }; void r; });
    return { fig: crossSVG(lbl, { maxw: 200 }), q: 'R ou S? (Fischer)', o: ['R', 'S'], a: F.d === 'R' ? 0 : 1, e: `${F.d}: H na ${F.vertical ? 'vertical → leitura direta' : 'horizontal → inverta'}.` };
  }
  const m = withCfg(LIB[pick(ONE)], [pick(['R', 'S'])]), c = m.centers[0];
  const where = level === 1 ? 'back' : pick(['back', 'front']);
  const o = orientWith4(m, c, where);
  return { fig: wedgeSVG(m, { orient: o, scale: 48, prio: level === 1 ? c : undefined }), q: 'R ou S?', o: ['R', 'S'], a: m.desc[0] === 'R' ? 0 : 1, e: `${m.desc[0]}${where === 'front' ? ' (o 4 estava na cunha: era preciso inverter)' : ''}.` };
}
function qED(level) {
  let P, r;
  do { P = genFischerPair(); r = relation(P.A, P.B).r; } while (r !== 'enantiômeros' && r !== 'diastereoisômeros');
  const wrap = h('div', { class: 'twochairs' });
  if (level >= 2 && Math.random() < 0.5) wrap.append(h('div', null, h('b', null, 'A'), wedgeSVG(P.A, { scale: 30 })), h('div', null, h('b', null, 'B'), wedgeSVG(P.B, { scale: 30, orient: pick(Object.keys(ORIENT)) })));
  else wrap.append(h('div', null, h('b', null, 'A'), fischerSVG(P.A, { maxw: 130 })), h('div', null, h('b', null, 'B'), fischerSVG(P.B, { maxw: 130 })));
  void mirrorMol;
  return { fig: wrap, q: 'Enantiômeros ou diastereoisômeros?', o: ['enantiômeros', 'diastereoisômeros'], a: r === 'enantiômeros' ? 0 : 1, e: `${r}: todos os centros ${r === 'enantiômeros' ? 'invertidos' : 'não — só parte deles invertida'}.` };
}
export function challenge(host) {
  const st = { pts: 0, streak: 0, best: 0, n: 0, ok: 0, timer: null, t0: 0, done: false, level: 1 };
  const TIME = 15000;
  const stats = h('div', { class: 'ch-stats' }), bar = h('span', { style: 'width:100%' }), card = h('div', { class: 'ch-card' });
  host.append(h('div', { class: 'challenge' }, stats, h('div', { class: 'timer' }, bar), card));
  const drawStats = () => { stats.innerHTML = ''; [['pontos', st.pts], ['nível', st.level], ['sequência', st.streak], ['melhor', st.best], ['acertos', `${st.ok}/${st.n}`]].forEach(([k, v]) => stats.append(h('div', null, h('b', null, String(v)), h('small', null, k)))); };
  function intro() {
    card.innerHTML = '';
    card.append(h('h3', { style: 'margin-top:0' }, 'R ou S em 15 segundos'), h('p', null, 'Rodadas alternadas: atribua R/S e depois classifique pares como enantiômeros ou diastereoisômeros. Nível 1: prioridades numeradas e H para trás · Nível 2: H também para a frente e pares em cunha · Nível 3: inclui Fischer. A cada 5 acertos você sobe de nível; sequências multiplicam os pontos.'), h('button', { class: 'btn accent lg', type: 'button', onclick: next }, '▶ Começar'));
    drawStats();
  }
  function next() {
    clearInterval(st.timer);
    const q = st.n % 2 === 0 ? qRS(st.level) : qED(st.level);
    st.done = false; card.innerHTML = '';
    const fb = h('div', { 'aria-live': 'assertive' });
    const ans = h('div', { class: 'qopts', style: 'display:flex;gap:10px;justify-content:center;flex-wrap:wrap' }, q.o.map((t, i) => h('button', { class: 'btn lg', type: 'button', onclick: () => answer(i, q, ans, fb) }, t)));
    card.append(h('div', { class: 'projbox' }, q.fig), h('h4', { style: 'text-align:center' }, q.q), ans, fb);
    st.t0 = performance.now();
    st.timer = setInterval(() => { const left = Math.max(0, 1 - (performance.now() - st.t0) / TIME); bar.style.width = left * 100 + '%'; if (left <= 0) answer(null, q, ans, fb); }, 80);
  }
  function answer(i, q, ans, fb) {
    if (st.done) return; st.done = true; clearInterval(st.timer);
    [...ans.children].forEach((b, k) => { b.disabled = true; if (k === q.a) b.classList.add('primary'); });
    const ok = i === q.a; st.n++;
    if (ok) { st.ok++; st.streak++; st.best = Math.max(st.best, st.streak); const left = Math.max(0, 1 - (performance.now() - st.t0) / TIME); st.pts += Math.round((10 + 10 * left) * (1 + Math.min(st.streak - 1, 4) * 0.25) * st.level); } else st.streak = 0;
    const up = ok && st.ok % 5 === 0 && st.level < 3;
    if (up) st.level++;
    fb.innerHTML = `<div class="fb ${ok ? 'ok' : 'bad'}">${i === null ? '⏱ Tempo esgotado. ' : ok ? '✔ Correto! ' : '✘ Não. '}${q.e}${up ? ` <b>Subiu para o nível ${st.level}!</b>` : ''}</div>`;
    fb.append(h('div', { class: 'ex-actions', style: 'justify-content:center' }, h('button', { class: 'btn primary', type: 'button', onclick: next }, 'Próxima →')));
    drawStats();
  }
  intro();
  return { stop() { clearInterval(st.timer); } };
}
