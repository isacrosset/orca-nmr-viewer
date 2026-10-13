/*
 * quiz.js — quiz final (30 questões sorteadas) e desafio
 * "Conformação em 10 segundos" (questões geradas a partir da geometria).
 */
import { h, shuffle } from './widgets2d.js';
import { ROTORS, confName, roleOf, analyzeChair, relation } from './conf.js';
import { newmanData, newmanSVG, chairSVG } from './draw.js';

const BANK = [
  ['Conceitos', 'Conformações são interconvertidas por:', ['rotação em torno de ligações simples', 'quebra de ligações', 'reações químicas', 'troca de átomos'], 0, 'Sem quebra de ligações.'],
  ['Conceitos', 'cis- e trans-1,2-dimetilciclo-hexano são:', ['estereoisômeros (configurações diferentes)', 'conformações', 'a mesma molécula', 'isômeros de cadeia'], 0, 'Não se interconvertem por rotação.'],
  ['Conceitos', 'O ângulo diedro é medido:', ['ao longo da ligação central (entre os planos A–B–C e B–C–D)', 'entre duas ligações no mesmo átomo', 'entre dois anéis', 'apenas em alcenos'], 0, 'É o ângulo visto na Newman.'],
  ['Newman', 'Na Newman, o carbono de trás é representado por:', ['um círculo', 'um ponto', 'uma cunha', 'um traço'], 0, 'O da frente é o ponto.'],
  ['Newman', 'Quantas ligações saem do ponto central de uma Newman de alcano?', ['3', '4', '2', '6'], 0, 'A 4ª é a C–C, ao longo do olhar.'],
  ['Newman', 'Inverter a direção de visualização (C3 → C2 em vez de C2 → C3):', ['troca frente/trás e espelha a figura', 'não muda nada', 'muda a conformação', 'transforma anti em gauche'], 0, 'A conformação é a mesma; o desenho muda.'],
  ['Newman', 'Uma projeção de Newman é:', ['outra forma de ver a mesma molécula', 'uma molécula diferente', 'um isômero', 'um estado de transição'], 0, 'Só o ponto de vista muda.'],
  ['Cavalete', 'No cavalete, o carbono da frente costuma ser desenhado:', ['embaixo, à esquerda', 'em cima, à direita', 'no centro', 'como um círculo'], 0, 'A ligação C–C aparece inclinada.'],
  ['Cavalete', 'Cavalete e Newman da mesma conformação têm:', ['o mesmo ângulo diedro', 'diedros diferentes', 'ligações diferentes', 'energias diferentes'], 0, 'São a mesma conformação.'],
  ['Etano', 'A barreira de rotação do etano é aproximadamente:', ['12 kJ/mol', '120 kJ/mol', '0,1 kJ/mol', '350 kJ/mol'], 0, '3 × 4 kJ/mol.'],
  ['Etano', 'A eclipsada do etano tem maior energia por causa de:', ['tensão torsional', 'tensão angular', 'ligações π', 'ligações de hidrogênio'], 0, 'Repulsão entre os pares das ligações C–H.'],
  ['Etano', 'Mínimos de energia do etano em:', ['60°, 180°, 300°', '0°, 120°, 240°', 'só 180°', '90°'], 0, 'Alternadas.'],
  ['Butano', 'A conformação mais estável do butano (C2–C3) é:', ['anti', 'gauche', 'eclipsada', 'totalmente eclipsada'], 0, 'CH₃ a 180°.'],
  ['Butano', 'A de maior energia é:', ['totalmente eclipsada (0°)', 'gauche', 'anti', 'eclipsada CH₃/H'], 0, '≈ 19 kJ/mol.'],
  ['Butano', 'A diferença gauche − anti vale cerca de:', ['3,8 kJ/mol', '19 kJ/mol', '0', '50 kJ/mol'], 0, 'Interação estérica gauche.'],
  ['Butano', 'Gauche e anti são ambas:', ['alternadas', 'eclipsadas', 'planas', 'cíclicas'], 0, 'Diferem pela proximidade dos CH₃.'],
  ['Butano', 'Em 120° o butano está em uma conformação:', ['eclipsada (CH₃/H)', 'anti', 'gauche', 'totalmente eclipsada'], 0, 'Máximo secundário.'],
  ['Tensões', 'Tensão estérica é causada por:', ['grupos próximos cujas nuvens se repelem', 'ângulos distorcidos', 'ligações eclipsadas sempre', 'cargas'], 0, 'Ex.: interação gauche, 1,3-diaxial.'],
  ['Cicloalcanos', 'O ciclopropano é muito tensionado porque seus ângulos são de:', ['60°', '109,5°', '120°', '90°'], 0, 'Tensão angular + torsional.'],
  ['Cicloalcanos', 'O ciclobutano não é plano para:', ['reduzir a tensão torsional', 'reduzir o número de H', 'formar ligações π', 'ficar quiral'], 0, 'Dobra ≈ 25°.'],
  ['Cicloalcanos', 'O ciclopentano adota principalmente a conformação:', ['envelope', 'cadeira', 'barco', 'plana'], 0, 'E meia-cadeira (pseudorrotação).'],
  ['Cadeira', 'Na cadeira os ângulos C–C–C são aproximadamente:', ['111°', '90°', '120°', '60°'], 0, 'Próximos do tetraédrico.'],
  ['Cadeira', 'Na cadeira, as ligações C–H estão:', ['todas alternadas', 'todas eclipsadas', 'metade eclipsadas', 'no plano do anel'], 0, 'Sem tensão torsional.'],
  ['Cadeira', 'O ciclo-hexano em cadeira tem:', ['6 posições axiais e 6 equatoriais', '12 axiais', '3 axiais e 9 equatoriais', 'nenhuma axial'], 0, 'Uma de cada por carbono.'],
  ['Axial/equatorial', 'Se o axial de C1 aponta para cima, o axial de C2 aponta:', ['para baixo', 'para cima', 'para fora', 'para dentro'], 0, 'Alternância.'],
  ['Axial/equatorial', 'Up/down e axial/equatorial são:', ['classificações independentes', 'sinônimos', 'opostos', 'sempre iguais'], 0, 'axial up, axial down, equatorial up, equatorial down.'],
  ['Flip', 'No flip de cadeira:', ['axial ↔ equatorial; up continua up', 'up ↔ down', 'cis ↔ trans', 'nada muda'], 0, 'Regra central.'],
  ['Flip', 'A meia-cadeira é:', ['o máximo de energia da inversão', 'a forma mais estável', 'um mínimo', 'igual ao barco'], 0, '≈ 45 kJ/mol.'],
  ['Flip', 'O barco torcido é:', ['um mínimo local, menos estável que a cadeira', 'mais estável que a cadeira', 'o estado de transição', 'plano'], 0, '≈ 23 kJ/mol.'],
  ['Flip', 'No barco, os H "de mastro" (flagpole) causam:', ['tensão estérica', 'tensão angular', 'ligações π', 'nada'], 0, 'Ficam muito próximos.'],
  ['Substituintes', 'O metilciclo-hexano prefere o CH₃:', ['equatorial', 'axial', 'em barco', 'eclipsado'], 0, 'Evita 1,3-diaxiais.'],
  ['Substituintes', 'Um CH₃ axial em C1 interage com os H axiais de:', ['C3 e C5', 'C2 e C6', 'C4', 'C2 e C4'], 0, 'Mesma face.'],
  ['Substituintes', 'O valor A mede:', ['a preferência de um grupo pela posição equatorial', 'a acidez', 'o tamanho do anel', 'a energia da ligação C–C'], 0, 'ΔG axial − equatorial.'],
  ['Substituintes', 'O t-butila praticamente "trava" a cadeira porque:', ['seu valor A é muito grande (≈ 21 kJ/mol)', 'é planar', 'forma ligações de H', 'é pequeno'], 0, '> 99,9% equatorial.'],
  ['cis/trans', 'Em cicloexanos, cis significa:', ['mesma face (ambos up ou ambos down)', 'ambos axiais', 'ambos equatoriais', 'carbonos vizinhos'], 0, 'Relação de face.'],
  ['cis/trans', 'Qual pode ser diequatorial?', ['trans-1,2', 'cis-1,2', 'cis-1,4', 'trans-1,3'], 0, 'trans-1,2: (a,a) ⇌ (e,e).'],
  ['cis/trans', 'O cis-1,3-dimetilciclo-hexano prefere:', ['diequatorial', 'diaxial', 'a,e', 'barco'], 0, 'cis-1,3: (a,a) ⇌ (e,e).'],
  ['cis/trans', 'O cis-1,4-dimetilciclo-hexano:', ['tem sempre um CH₃ axial', 'é diequatorial', 'é diaxial', 'não faz flip'], 0, '(a,e) ⇌ (e,a).'],
  ['cis/trans', 'O trans-1,3-dimetilciclo-hexano:', ['tem as duas cadeiras de mesma energia (a,e)', 'é diequatorial', 'é diaxial', 'é plano'], 0, '(a,e) ⇌ (e,a).'],
  ['Estabilidade', 'cis-1-t-butil-4-metil: na cadeira principal, o CH₃ está:', ['axial', 'equatorial', 'em barco', 'eclipsado'], 0, 't-Bu equatorial força o CH₃ axial.'],
  ['Estabilidade', 'Com dois substituintes diferentes, em geral:', ['o mais volumoso fica equatorial', 'o menor fica equatorial', 'ambos axiais', 'não há preferência'], 0, 'Maior valor A.'],
  ['Estabilidade', 'Diaxiais 1,3 na mesma face (dois CH₃) são:', ['muito desfavoráveis', 'favoráveis', 'neutras', 'impossíveis de desenhar'], 0, 'Forte repulsão estérica.'],
];
export const TOPIC_SECTION = { Conceitos: 'conformacoes', Newman: 'newman', Cavalete: 'cavalete', Etano: 'etano', Butano: 'butano', Tensões: 'anti-gauche', Cicloalcanos: 'cicloalcanos', Cadeira: 'cadeira', 'Axial/equatorial': 'axial', Flip: 'inversao', Substituintes: 'monossubstituidos', 'cis/trans': 'cis-trans', Estabilidade: 'dissubstituidos' };
export function classify(p) { return p < 50 ? 'Revise os fundamentos' : p < 70 ? 'Conhecimento em desenvolvimento' : p < 85 ? 'Bom domínio' : 'Excelente domínio'; }

export function quiz(host, nav) {
  let qs = [], i = 0, score = 0, answered = false, wrong = {};
  const box = h('div', { class: 'quizbox' });
  host.append(box);
  function start() {
    qs = shuffle(BANK).slice(0, 30).map((q) => { const o = shuffle(q[2].map((_, k) => k)); return { topic: q[0], q: q[1], o: o.map((k) => q[2][k]), a: o.indexOf(q[3]), e: q[4] }; });
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
      topics.length ? h('div', null, h('p', null, h('b', null, 'Tópicos com maior dificuldade:')), h('ul', null, topics.map(([t, n]) => h('li', null, h('a', { href: '#' + (TOPIC_SECTION[t] || 'inicio'), onclick: (e) => { e.preventDefault(); nav(TOPIC_SECTION[t] || 'inicio'); } }, t), ` — ${n} erro(s)`)))) : h('p', null, 'Nenhum erro. Parabéns!'),
      h('div', { class: 'ex-actions', style: 'justify-content:center' }, h('button', { class: 'btn primary', type: 'button', onclick: start }, '↺ Novo quiz'), h('button', { class: 'btn', type: 'button', onclick: () => nav('quiz', 'desafio') }, '⚡ Conformação em 10 segundos'))));
  }
  start();
}

/* ===================================================================
 * Conformação em 10 segundos
 * =================================================================== */
const pick = (a) => a[Math.floor(Math.random() * a.length)];
function genQ() {
  const t = pick(['ag', 'ag', 'ae', 'ct', 'st']);
  if (t === 'ag') {
    const R = ROTORS[pick(['butano', 'pentano', 'hexano'])], phi = pick([60, 180, 300]);
    return { fig: newmanSVG(newmanData(R, phi), { maxw: 200 }), q: `${R.n}: anti ou gauche?`, o: ['anti', 'gauche'], a: phi === 180 ? 0 : 1, e: confName(R, phi).n };
  }
  if (t === 'ae') {
    const c = pick([1, 2, 3, 4, 5, 6]), f = pick(['u', 'd']), g = pick(['CH3', 'OH', 'Cl', 'Br']), fl = pick([0, 1]);
    const r = roleOf(c, f, fl);
    return { fig: chairSVG({ [c + f]: g }, fl, { scale: 40, num: true, hl: { [c + f]: 'hlq' } }), q: `O grupo em C${c} está:`, o: ['axial', 'equatorial'], a: r === 'ax' ? 0 : 1, e: `${r === 'ax' ? 'axial' : 'equatorial'} (${f === 'u' ? 'up' : 'down'})` };
  }
  if (t === 'ct') {
    const c2 = pick([2, 3, 4]), f1 = pick(['u', 'd']), f2 = pick(['u', 'd']);
    const subs = { ['1' + f1]: 'CH3', [c2 + f2]: 'CH3' };
    const rel = relation(subs);
    return { fig: chairSVG(subs, pick([0, 1]), { scale: 40, num: true }), q: `1,${c2}-dimetil: cis ou trans?`, o: ['cis', 'trans'], a: rel === 'cis' ? 0 : 1, e: `${rel}: ${rel === 'cis' ? 'mesma face' : 'faces opostas'} (olhe para cima/baixo, não axial/equatorial)` };
  }
  const subs = pick([{ '1u': 'CH3' }, { '1u': 'tBu' }, { '1u': 'tBu', '4u': 'CH3' }, { '1u': 'CH3', '2d': 'CH3' }, { '1u': 'iPr', '3u': 'CH3' }]);
  const a = analyzeChair(subs, false).E, b = analyzeChair(subs, true).E;
  const wrap = h('div', { class: 'twochairs' }, h('div', null, h('b', null, 'A'), chairSVG(subs, 0, { scale: 34 })), h('div', null, h('b', null, 'B'), chairSVG(subs, 1, { scale: 34 })));
  return { fig: wrap, q: 'Qual cadeira é mais estável?', o: ['A', 'B'], a: a < b ? 0 : 1, e: `A ≈ ${a.toFixed(1)} × B ≈ ${b.toFixed(1)} kJ/mol (grupo maior equatorial).` };
}
export function challenge(host) {
  const st = { pts: 0, streak: 0, best: 0, n: 0, ok: 0, timer: null, t0: 0, done: false };
  const TIME = 10000;
  const stats = h('div', { class: 'ch-stats' }), bar = h('span', { style: 'width:100%' }), card = h('div', { class: 'ch-card' });
  host.append(h('div', { class: 'challenge' }, stats, h('div', { class: 'timer' }, bar), card));
  const drawStats = () => { stats.innerHTML = ''; [['pontos', st.pts], ['sequência', st.streak], ['melhor sequência', st.best], ['acertos', `${st.ok}/${st.n}`]].forEach(([k, v]) => stats.append(h('div', null, h('b', null, String(v)), h('small', null, k)))); };
  function intro() {
    card.innerHTML = '';
    card.append(h('h3', { style: 'margin-top:0' }, 'Conformação em 10 segundos'), h('p', null, 'Anti ou gauche? Axial ou equatorial? Cis ou trans? Cadeira A ou B? Responda antes do tempo acabar; acertos seguidos multiplicam os pontos.'), h('button', { class: 'btn accent lg', type: 'button', onclick: next }, '⚡ Começar'));
    drawStats();
  }
  function next() {
    clearInterval(st.timer);
    const q = genQ(); st.done = false;
    card.innerHTML = '';
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
    if (ok) { st.ok++; st.streak++; st.best = Math.max(st.best, st.streak); const left = Math.max(0, 1 - (performance.now() - st.t0) / TIME); st.pts += Math.round((10 + 10 * left) * (1 + Math.min(st.streak - 1, 4) * 0.25)); } else st.streak = 0;
    fb.innerHTML = `<div class="fb ${ok ? 'ok' : 'bad'}">${i === null ? '⏱ Tempo esgotado. ' : ok ? '✔ Correto! ' : '✘ Não. '}${q.e}</div>`;
    fb.append(h('div', { class: 'ex-actions', style: 'justify-content:center' }, h('button', { class: 'btn primary', type: 'button', onclick: next }, 'Próxima →')));
    drawStats();
  }
  intro();
  return { stop() { clearInterval(st.timer); } };
}
