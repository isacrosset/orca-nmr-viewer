/*
 * quiz.js — quiz final (25 questões sorteadas, SN1/SN2/E1/E2) e desafio
 * "SN1, SN2, E1 ou E2?" gerado pelo motor qualitativo.
 */
import { mol } from './chem2d.js';
import { SKA } from './struct.js';
import { h, shuffle } from './widgets2d.js';
import { SUBS, REAGS, SOLVS, analyze, MNAME } from './logic.js';

const BANK = [
  ['Fundamentos', 'O carbono β é…', ['o carbono que carrega o grupo abandonador', 'o carbono vizinho ao carbono que carrega o grupo abandonador', 'qualquer carbono terminal', 'o carbono do grupo abandonador'], 1, 'Cα tem o GA; Cβ é o vizinho, e seus H são os Hβ.'],
  ['Fundamentos', 'Numa eliminação β, forma-se a ligação dupla entre…', ['Cα e Cβ', 'Cβ e Cγ', 'Cα e o grupo abandonador', 'Cα e a base'], 0, 'Perde-se H do Cβ e X do Cα: a π surge entre eles.'],
  ['Fundamentos', 'Setas curvas devem começar em…', ['átomos positivos', 'pares de elétrons ou ligações', 'hidrogênios', 'qualquer lugar'], 1, 'Setas representam o movimento de elétrons.'],
  ['Fundamentos', 'Quantos Hβ tem o 2-bromopropano?', ['1', '3', '6', '7'], 2, 'Dois CH₃ vizinhos ao Cα: 6 Hβ.'],
  ['E2', 'A E2 é…', ['concertada (uma etapa)', 'em duas etapas com carbocátion', 'radicalar', 'em três etapas'], 0, 'Base remove Hβ, forma-se a π e sai o GA ao mesmo tempo.'],
  ['E2', 'A lei de velocidade da E2 é…', ['v = k[RX]', 'v = k[RX][Base]', 'v = k[Base]', 'v = k[RX]²'], 1, 'Substrato e base participam do único ET.'],
  ['E2', 'O estado de transição da E2…', ['pode ser isolado', 'tem ligações parciais base···H, H···C e C···X e ligação π parcial', 'é um carbocátion', 'tem carbono pentavalente estável'], 1, 'Não é intermediário: é um máximo de energia.'],
  ['E2', 'A geometria preferida da E2 é…', ['sin-periplanar', 'anti-periplanar', 'gauche', 'eclipsada'], 1, 'Hβ e GA a 180°, no mesmo plano.'],
  ['E2', 'Por que anti-periplanar?', ['alinha o σ C–H com o σ* C–X, permitindo formar a π', 'aproxima a base do GA', 'evita a formação de carbocátion', 'aumenta a polaridade'], 0, 'Sobreposição orbital ótima e conformação alternada.'],
  ['E2', 'Em ciclo-hexanos, a E2 exige…', ['GA e Hβ equatoriais', 'GA e Hβ trans-diaxiais', 'GA axial e Hβ equatorial', 'qualquer arranjo'], 1, 'Só posições axiais em carbonos vizinhos ficam anti-periplanares.'],
  ['E2', 'A E2 é estereoespecífica porque…', ['o produto depende da conformação anti do estereoisômero de partida', 'sempre forma o E', 'passa por carbocátion plano', 'forma mistura racêmica'], 0, 'Diastereoisômeros diferentes podem dar E ou Z.'],
  ['Regioquímica', 'A regra de Zaitsev prevê que o alceno principal é…', ['o menos substituído', 'o mais substituído (mais estável)', 'sempre o terminal', 'o Z'], 1, 'É uma tendência, especialmente com bases pequenas.'],
  ['Regioquímica', 'Com t-BuO⁻, o 2-bromo-2-metilbutano dá principalmente…', ['2-metilbut-2-eno', '2-metilbut-1-eno', '2-metilbutan-2-ol', 'pent-2-eno'], 1, 'Base volumosa → Hβ mais acessível (Hofmann).'],
  ['Regioquímica', 'Alcenos mais substituídos são mais estáveis devido principalmente a…', ['ligação de hidrogênio', 'hiperconjugação', 'impedimento estérico', 'ressonância com o halogênio'], 1, 'Ligações σ C–H/C–C vizinhas doam densidade à π.'],
  ['Regioquímica', 'Qual alceno é o mais estável?', ['but-1-eno', '(Z)-but-2-eno', '(E)-but-2-eno', '2,3-dimetilbut-2-eno'], 3, 'Tetrassubstituído.'],
  ['Regioquímica', '(E)-but-2-eno é mais estável que (Z)-but-2-eno porque…', ['no Z os CH₃ estão do mesmo lado e se repelem', 'o E é mais substituído', 'o Z não tem hiperconjugação', 'são igualmente estáveis'], 0, 'Tensão estérica cis.'],
  ['E1', 'A lei de velocidade da E1 é…', ['v = k[RX][Base]', 'v = k[RX]', 'v = k[Base]', 'v = k[RX][Base]²'], 1, 'A etapa lenta é a ionização.'],
  ['E1', '"E1" significa que a reação…', ['tem uma etapa', 'tem etapa determinante unimolecular', 'forma um produto', 'usa uma base'], 1, 'A E1 tem duas etapas.'],
  ['E1', 'O intermediário da E1 é…', ['um carbânion', 'um carbocátion', 'um radical', 'nenhum'], 1, 'O mesmo da SN1.'],
  ['E1', 'Na E1, a base que remove o Hβ costuma ser…', ['forte, como t-BuO⁻', 'fraca, como H₂O ou ROH', 'sempre OH⁻', 'o próprio haleto'], 1, 'Base forte levaria à E2.'],
  ['E1', 'A E1 exige geometria anti-periplanar?', ['sim, sempre', 'não: o C⁺ é plano; basta o C–H alinhar com o orbital p vazio', 'só em ciclos', 'só com bases fortes'], 1, 'A ligação C–Hβ deve se sobrepor ao orbital p vazio.'],
  ['Carbocátions', 'Ordem usual de estabilidade:', ['1° > 2° > 3°', '3° > 2° > 1°', '2° > 3° > 1°', 'todos iguais'], 1, 'Hiperconjugação/efeito indutivo; benzílicos e alílicos também são estabilizados por ressonância.'],
  ['Carbocátions', 'Rearranjos podem ocorrer em…', ['E2 e SN2', 'E1 e SN1', 'só E2', 'nenhuma'], 1, 'Exigem carbocátion.'],
  ['Carbocátions', 'Um deslocamento 1,2 de hidreto transforma…', ['um cátion terciário em secundário', 'um cátion secundário em terciário (mais estável)', 'um alceno em alcano', 'um carbânion em cátion'], 1, 'O H migra com o par de elétrons.'],
  ['Carbocátions', 'O carbocátion tem geometria…', ['tetraédrica', 'trigonal plana com orbital p vazio', 'linear', 'piramidal'], 1, 'Carbono sp².'],
  ['SN2', 'Na SN2 o nucleófilo ataca…', ['pelo lado do GA', 'pelo lado oposto ao GA (backside)', 'o Hβ', 'o carbocátion'], 1, 'Inversão de configuração.'],
  ['SN2', 'Ordem de reatividade em SN2:', ['3° > 2° > 1°', 'metílico > 1° > 2° ≫ 3°', '2° > 3° > 1°', 'todos iguais'], 1, 'Impedimento estérico.'],
  ['SN1', 'A SN1 em centro quiral leva, em geral, a…', ['inversão completa', 'mistura de enantiômeros (racemização parcial)', 'retenção completa', 'alceno'], 1, 'Carbocátion plano atacado pelas duas faces.'],
  ['Basicidade', 'Basicidade e nucleofilicidade…', ['são a mesma coisa', 'são diferentes: basicidade é afinidade por H⁺; nucleofilicidade é velocidade de ataque ao carbono', 'não dependem do solvente', 'sempre crescem juntas'], 1, 'Ex.: t-BuO⁻ é base forte e mau nucleófilo; I⁻ é ótimo nucleófilo e péssima base.'],
  ['Basicidade', 'Qual reagente favorece E2 mesmo com substrato primário?', ['CN⁻', 'I⁻', '(CH₃)₃CO⁻', 'H₂O'], 2, 'Base forte e volumosa.'],
  ['Basicidade', 'Qual é base forte e bom nucleófilo?', ['I⁻', 'CH₃CH₂O⁻', 'H₂O', 'DBU'], 1, 'Pequeno e básico: SN2 ou E2 conforme o substrato.'],
  ['Competição', 'Haleto terciário + NaOEt:', ['SN2', 'E2', 'SN1 apenas', 'sem reação'], 1, 'SN2 impossível; base forte → E2.'],
  ['Competição', 'Haleto terciário em água, 25 °C, sem base:', ['E2', 'SN1 (com algum E1)', 'SN2', 'sem reação'], 1, 'Solvólise.'],
  ['Competição', 'Haleto primário + NaCN em DMSO:', ['SN2', 'E2', 'E1', 'SN1'], 0, 'Primário + nucleófilo forte pouco básico.'],
  ['Competição', '2-bromopropano + NaOEt/EtOH, Δ:', ['E2 majoritária, SN2 minoritária', 'só SN2', 'só E1', 'SN1'], 0, 'Secundário + base forte + aquecimento.'],
  ['Competição', '2-bromobutano + NaN₃ em DMF:', ['SN2', 'E2', 'E1', 'SN1'], 0, 'N₃⁻: ótimo nucleófilo, base fraca.'],
  ['Competição', 'Brometo de metila + t-BuOK:', ['E2', 'SN2 (não há Hβ)', 'E1', 'sem reação'], 1, 'Sem Hβ, não há eliminação.'],
  ['Competição', 'Brometo de benzila + NaOEt:', ['E2', 'SN2', 'E1', 'nenhuma'], 1, 'Sem Hβ; carbono primário desimpedido.'],
  ['Temperatura', 'Aquecer uma mistura em que SN1 e E1 competem…', ['aumenta a fração de E1', 'aumenta a fração de SN1', 'não muda', 'impede a reação'], 0, 'Eliminação tem ΔS mais positivo.'],
  ['Energia', 'Quantos estados de transição há na E1?', ['1', '2', '3', 'nenhum'], 1, 'Ionização e desprotonação.'],
  ['Energia', 'No perfil de energia da E2 há…', ['um intermediário', 'um único ET e nenhum intermediário', 'dois ET', 'um carbocátion'], 1, 'Reação concertada.'],
  ['Energia', 'No perfil da E1, o ponto mais alto corresponde a…', ['ET da desprotonação', 'ET da ionização (etapa lenta)', 'o carbocátion', 'os produtos'], 1, 'A ionização determina a velocidade.'],
  ['Estereoquímica', 'A E2 do 2-bromobutano dá mais (E)-but-2-eno porque…', ['a conformação anti reativa com os CH₃ anti é mais estável', 'o Z não pode se formar', 'ocorre via carbocátion', 'a base é volumosa'], 0, 'Conformação reativa com menor tensão → ET mais baixo.'],
  ['Estereoquímica', 'O cis-1-bromo-4-terc-butilciclo-hexano sofre E2 mais rápido que o trans porque…', ['no cis, com t-Bu equatorial, o Br fica axial', 'no cis o Br é equatorial', 'o trans não tem Hβ', 'o cis forma carbocátion'], 0, 'Exigência trans-diaxial.'],
  ['Grupo abandonador', 'Ordem de velocidade de E2 para R–X:', ['F > Cl > Br > I', 'I > Br > Cl > F', 'Cl > F > I > Br', 'todos iguais'], 1, 'Ligação C–X mais fraca e X⁻ mais estável.'],
];

export const TOPIC_SECTION = {
  Fundamentos: 'fundamentos', E2: 'e2', Regioquímica: 'regioquimica', E1: 'e1', Carbocátions: 'carbocations', SN2: 'sn-vs-e', SN1: 'sn-vs-e',
  Basicidade: 'e2', Competição: 'sn-vs-e', Temperatura: 'e1', Energia: 'e1xe2', Estereoquímica: 'estereo', 'Grupo abandonador': 'e2',
};

export function classify(pct) {
  return pct < 50 ? 'Revise os fundamentos' : pct < 70 ? 'Conhecimento em desenvolvimento' : pct < 85 ? 'Bom domínio' : 'Excelente domínio';
}

export function quiz(host, nav) {
  let qs = [], i = 0, score = 0, answered = false, wrongTopics = {};
  const box = h('div', { class: 'quizbox' });
  host.append(box);
  function start() {
    qs = shuffle(BANK).slice(0, 25).map((q) => {
      const order = shuffle(q[2].map((_, k) => k));
      return { topic: q[0], q: q[1], o: order.map((k) => q[2][k]), a: order.indexOf(q[3]), e: q[4] };
    });
    i = 0; score = 0; wrongTopics = {};
    render();
  }
  function render() {
    box.innerHTML = '';
    if (i >= qs.length) return result();
    const q = qs[i];
    answered = false;
    const bar = h('span', { style: `width:${(i / qs.length) * 100}%` });
    box.append(h('div', { class: 'qprog' }, h('b', null, `${i + 1}/${qs.length}`), h('div', { class: 'bar' }, bar), h('span', { class: 'chip ok' }, `${score} acertos · ${i ? Math.round(100 * score / i) : 0}%`)));
    const fb = h('div', { 'aria-live': 'polite' });
    const next = h('button', { class: 'btn primary', type: 'button', disabled: true, onclick: () => { i++; render(); } }, i === qs.length - 1 ? 'Ver resultado' : 'Próxima →');
    const opts = h('div', { class: 'mcq' });
    q.o.forEach((t, k) => {
      opts.append(h('button', { class: 'mopt', type: 'button', html: `<span class="l">${'abcd'[k]}</span><span>${t}</span>`, onclick: (e) => {
        if (answered) return;
        answered = true;
        const ok = k === q.a;
        if (ok) score++; else wrongTopics[q.topic] = (wrongTopics[q.topic] || 0) + 1;
        [...opts.children].forEach((b, n) => { b.disabled = true; if (n === q.a) b.classList.add('right'); });
        if (!ok) e.currentTarget.classList.add('wrong');
        fb.innerHTML = `<div class="fb ${ok ? 'ok' : 'bad'}">${ok ? '✔ Correto.' : '✘ Incorreto.'} ${q.e}</div>`;
        next.disabled = false;
        next.focus();
      } }));
    });
    box.append(h('div', { class: 'qcard' }, h('div', { class: 'topic' }, q.topic), h('h4', { html: q.q }), opts, fb, h('div', { class: 'ex-actions' }, next)));
  }
  function result() {
    const pct = Math.round(100 * score / qs.length);
    const topics = Object.entries(wrongTopics).sort((a, b) => b[1] - a[1]);
    try { localStorage.setItem('el-quiz-best', Math.max(pct, +(localStorage.getItem('el-quiz-best') || 0))); } catch (e) { /* sem armazenamento */ }
    box.append(h('div', { class: 'qcard result' },
      h('div', { class: 'pct' }, pct + '%'),
      h('div', { class: 'cls' }, classify(pct)),
      h('p', null, `${score} de ${qs.length} questões corretas.`),
      topics.length ? h('div', null, h('p', null, h('b', null, 'Tópicos com mais erros:')), h('ul', null, topics.map(([t, n]) => h('li', null, h('a', { href: '#' + (TOPIC_SECTION[t] || 'fundamentos'), onclick: (e) => { e.preventDefault(); nav(TOPIC_SECTION[t] || 'fundamentos'); } }, t), ` — ${n} erro(s)`)))) : h('p', null, 'Nenhum tópico com erro. Parabéns!'),
      h('div', { class: 'ex-actions', style: 'justify-content:center' }, h('button', { class: 'btn primary', type: 'button', onclick: start }, '↺ Novo quiz (novas questões)'), h('button', { class: 'btn', type: 'button', onclick: () => nav('quiz', 'desafio') }, '⚡ Desafio SN1, SN2, E1 ou E2?'))));
  }
  start();
}

/* ===================================================================
 * Desafio "SN1, SN2, E1 ou E2?"
 * =================================================================== */
const SK_OF = { bromometano: 'methyl', bromobutano1: 'bromobutano1', bromobutano2: 'bromobutano2', bromopentano2: 'bromopentano2', bromometilbutano: 'bromometilbutano', tbutil: 'tbutil', metilciclohexil: 'metilciclohexil', benzyl: 'benzyl', allyl: 'allyl' };
function scenario() {
  for (let n = 0; n < 400; n++) {
    const sub = shuffle(Object.keys(SUBS))[0];
    const reag = shuffle(Object.keys(REAGS))[0];
    let solv;
    if (reag === 'H2O') solv = 'agua';
    else if (reag === 'ROH') solv = 'etanol';
    else if (reag === 'tBuO') solv = 'dmso';
    else if (reag === 'RO') solv = shuffle(['etanol', 'etanol', 'dmso'])[0];
    else if (reag === 'OH') solv = shuffle(['agua', 'etanol', 'dmso'])[0];
    else solv = shuffle(['dmso', 'dmf', 'acetona', 'mecn', 'metanol', 'etanol'])[0];
    const temp = shuffle(['baixa', 'moderada', 'alta'])[0];
    const A = analyze(sub, reag, solv, temp);
    const top = A.r[0], sec = A.r[1];
    if (A.s[top] >= 3 && A.s[top] - A.s[sec] >= 2) return { sub, reag, solv, temp, A };
  }
  return null;
}
export function challenge(host) {
  const st = { pts: 0, streak: 0, best: 0, n: 0, ok: 0 };
  const stats = h('div', { class: 'ch-stats' });
  const card = h('div', { class: 'ch-card' });
  host.append(h('div', { class: 'challenge' }, stats, card));
  function drawStats() {
    stats.innerHTML = '';
    [['pontos', st.pts], ['sequência', st.streak], ['melhor sequência', st.best], ['acertos', `${st.ok}/${st.n}`]].forEach(([k, v]) => stats.append(h('div', null, h('b', null, String(v)), h('small', null, k))));
  }
  function intro() {
    card.innerHTML = '';
    card.append(h('h3', { style: 'margin-top:0' }, 'SN1, SN2, E1 ou E2?'), h('p', null, 'Analise substrato, reagente, solvente e temperatura e escolha o mecanismo mais provável. Acertos em sequência valem mais pontos.'),
      h('button', { class: 'btn accent lg', type: 'button', onclick: next }, '⚡ Começar'));
    drawStats();
  }
  function next() {
    const c = scenario();
    card.innerHTML = '';
    if (!c) { card.append(h('p', null, 'Não foi possível gerar um cenário. Tente novamente.')); return; }
    const { A } = c;
    const rx = h('div', { class: 'rx', style: 'display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap' },
      h('div', { style: 'width:170px' }, mol(SKA[SK_OF[c.sub]](), { scale: 36, fs: 15 })),
      h('span', { style: 'font-size:1.5rem;color:var(--muted)' }, '+'),
      h('b', { style: 'font-size:1.25rem;color:var(--orange)', html: A.R.t }),
      h('span', { style: 'font-size:1.5rem;color:var(--muted)' }, '→'));
    const fb = h('div', { 'aria-live': 'assertive' });
    const ans = h('div', { class: 'ch-answers', style: 'flex-wrap:wrap' }, ['sn1', 'sn2', 'e1', 'e2'].map((m) => h('button', { class: 'btn c-' + m, type: 'button', style: 'border-color:currentColor', onclick: () => answer(m, c, fb, ans) }, MNAME[m])));
    card.append(h('div', { class: 'cond', html: `${A.S.t} · solvente: <b>${A.L.t}</b> · temperatura: <b>${c.temp}</b>` }), rx, ans, fb);
  }
  function answer(m, c, fb, ans) {
    [...ans.children].forEach((b) => { b.disabled = true; });
    const { A } = c;
    const ok = m === A.top;
    st.n++;
    if (ok) { st.ok++; st.streak++; st.best = Math.max(st.best, st.streak); st.pts += 10 * (1 + Math.min(st.streak - 1, 4) * 0.5); } else st.streak = 0;
    fb.innerHTML = `<div class="fb ${ok ? 'ok' : 'bad'}">${ok ? '✔ Correto!' : '✘ Não.'} Mecanismo mais provável: <b>${MNAME[A.top]}</b>. Produto principal: <b>${A.prodOf(A.top)}</b>.<ul style="text-align:left;margin:.5em 0 0;padding-left:18px">${A.why.map((w) => `<li>${w}</li>`).join('')}</ul></div>`;
    fb.append(h('div', { class: 'ex-actions', style: 'justify-content:center' }, h('button', { class: 'btn primary', type: 'button', onclick: next }, 'Próxima reação →')));
    drawStats();
  }
  intro();
  return { stop() {} };
}
