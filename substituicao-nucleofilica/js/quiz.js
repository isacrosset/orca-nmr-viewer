/*
 * quiz.js — quiz final (20 questões sorteadas) e modo Desafio SN1 × SN2.
 */
import { mol } from './chem2d.js';
import { SK } from './struct.js';
import { h, shuffle } from './widgets2d.js';

const BANK = [
  ['Fundamentos', 'Nucleófilo é uma espécie…', ['deficiente em elétrons', 'rica em elétrons, capaz de doar um par', 'sempre neutra', 'sempre um cátion'], 1, 'Nucleófilos doam um par de elétrons a um centro eletrofílico.'],
  ['Fundamentos', 'Em CH₃–Br, o carbono é eletrofílico porque…', ['tem um par de elétrons livre', 'está ligado a um átomo mais eletronegativo (C<sup>δ+</sup>–Br<sup>δ−</sup>)', 'tem carga formal negativa', 'é sp²'], 1, 'A polarização deixa o carbono deficiente em elétrons.'],
  ['Fundamentos', 'Uma seta curva de ponta inteira representa o movimento de…', ['um elétron', 'um par de elétrons', 'um próton', 'um átomo'], 1, 'Meia-ponta (anzol) = 1 elétron; ponta inteira = par.'],
  ['Fundamentos', 'Setas curvas devem partir de…', ['átomos com carga +', 'pares livres ou ligações', 'qualquer átomo', 'núcleos'], 1, 'Elas mostram de onde saem os elétrons.'],
  ['SN2', 'O "2" em SN2 indica que…', ['há duas etapas', 'duas espécies participam da etapa determinante da velocidade', 'formam-se dois produtos', 'o nucleófilo tem carga −2'], 1, 'Bimolecular: substrato e nucleófilo no estado de transição.'],
  ['SN2', 'A SN2 é…', ['concertada, com um estado de transição', 'em duas etapas, com carbocátion', 'radicalar', 'sempre endotérmica'], 0, 'Formação e quebra simultâneas.'],
  ['SN2', 'Na SN2, o nucleófilo ataca o carbono…', ['pelo mesmo lado do grupo abandonador', 'a ~180° do grupo abandonador (ataque traseiro)', 'a 90°', 'em qualquer direção'], 1, 'É a direção em que o par do Nu encontra o maior lóbulo do σ* C–LG.'],
  ['SN2', 'O orbital que recebe os elétrons do nucleófilo na SN2 é…', ['σ C–LG', 'σ* C–LG', 'p do grupo abandonador', 'π* C=C'], 1, 'Popular o antiligante σ* enfraquece e rompe a ligação C–LG.'],
  ['Substrato', 'Ordem de reatividade em SN2:', ['3° > 2° > 1° > metílico', 'metílico > 1° > 2° ≫ 3°', '2° > 1° > 3°', 'todos iguais'], 1, 'Impedimento estérico ao ataque traseiro.'],
  ['Substrato', 'Por que haletos terciários quase não reagem por SN2?', ['o carbocátion é instável', 'os três grupos alquila bloqueiam a face traseira', 'o C–X é muito forte', 'não são polares'], 1, 'Impedimento estérico.'],
  ['SN1', 'A lei de velocidade da SN1 é…', ['v = k[RX][Nu]', 'v = k[RX]', 'v = k[Nu]', 'v = k[RX]²'], 1, 'Só o substrato participa da etapa lenta (ionização).'],
  ['SN1', 'A etapa determinante da velocidade na SN1 é…', ['o ataque do nucleófilo', 'a formação do carbocátion', 'a desprotonação', 'a recombinação dos íons'], 1, 'A ionização tem a maior energia de ativação.'],
  ['SN1', 'A geometria do carbocátion é…', ['tetraédrica', 'trigonal plana, com orbital p vazio', 'linear', 'piramidal'], 1, 'Carbono sp²; o orbital p vazio é perpendicular ao plano.'],
  ['SN1', 'Na hidrólise do (CH₃)₃CBr, a última etapa é…', ['ionização', 'desprotonação do íon oxônio', 'ataque do Br⁻', 'migração de hidreto'], 1, 'Outra molécula de água remove H⁺ do R–OH₂⁺.'],
  ['Carbocátions', 'Ordem de estabilidade de carbocátions alquila:', ['metílico > 1° > 2° > 3°', '3° > 2° > 1° > metílico', '2° > 3° > 1°', '1° > 2° > 3°'], 1, 'Hiperconjugação e efeito indutivo dos grupos alquila.'],
  ['Carbocátions', 'O cátion benzílico é estabilizado principalmente por…', ['ligação de hidrogênio', 'ressonância com o anel aromático', 'impedimento estérico', 'efeito do solvente apenas'], 1, 'A carga + se deslocaliza pelas posições orto e para.'],
  ['Carbocátions', 'Hiperconjugação é…', ['doação de elétrons de ligações σ C–H/C–C vizinhas ao orbital p vazio', 'uma ligação de hidrogênio', 'ressonância com par livre', 'repulsão estérica'], 0, 'Quanto mais ligações vizinhas alinhadas, maior a estabilização.'],
  ['Carbocátions', 'Um carbocátion secundário vizinho a um carbono terciário com H tende a…', ['ficar inalterado', 'sofrer migração 1,2 de hidreto e formar um cátion terciário', 'perder um elétron', 'formar um carbânion'], 1, 'Rearranjos levam a cátions mais estáveis.'],
  ['Carbocátions', 'Rearranjos são esperados em…', ['SN2', 'SN1', 'ambos', 'nenhum'], 1, 'Só há carbocátion na SN1.'],
  ['Nucleofilicidade', 'Em solvente prótico, a ordem de nucleofilicidade dos haletos é…', ['F⁻ > Cl⁻ > Br⁻ > I⁻', 'I⁻ > Br⁻ > Cl⁻ > F⁻', 'todos iguais', 'Cl⁻ > I⁻ > F⁻ > Br⁻'], 1, 'Ânions pequenos são mais solvatados por ligações de H.'],
  ['Nucleofilicidade', 'Nucleofilicidade e basicidade…', ['são sinônimos', 'são relacionadas, mas não idênticas: nucleofilicidade é cinética e depende do meio', 'não têm relação nenhuma', 'só diferem para cátions'], 1, 'Ex.: I⁻ é ótimo nucleófilo em meio prótico e péssima base.'],
  ['Nucleofilicidade', 'Qual é o pior nucleófilo?', ['CN⁻', 'N₃⁻', 'H₂O', 'I⁻'], 2, 'Neutro e com par menos disponível.'],
  ['Solvente', 'Solventes polares apróticos favorecem SN2 porque…', ['estabilizam o carbocátion', 'solvatam pouco o nucleófilo aniônico, deixando-o mais reativo', 'são ácidos', 'reagem com o substrato'], 1, 'Sem ligações de H com o ânion.'],
  ['Solvente', 'Qual é polar prótico?', ['DMSO', 'acetona', 'metanol', 'DMF'], 2, 'Tem O–H capaz de doar ligação de hidrogênio.'],
  ['Solvente', 'Solventes próticos favorecem a SN1 porque…', ['estabilizam o estado de transição da ionização, o carbocátion e o ânion que sai', 'aumentam o impedimento estérico', 'são bases fortes', 'reagem por radicais'], 0, 'Solvatação de cargas facilita a ionização.'],
  ['Grupo abandonador', 'Bons grupos abandonadores são…', ['bases fortes', 'bases fracas e estáveis', 'cátions', 'sempre neutros'], 1, 'Quanto mais estável o ânion que sai, mais fácil a saída.'],
  ['Grupo abandonador', 'Por que R–OH não reage diretamente com Br⁻?', ['O é pouco eletronegativo', 'HO⁻ é base forte e péssimo grupo abandonador', 'Br⁻ é base forte', 'R–OH é apolar'], 1, 'É preciso protonar (→ H₂O) ou converter em tosilato/mesilato.'],
  ['Grupo abandonador', 'O tosilato é excelente grupo abandonador porque…', ['é base forte', 'sua carga negativa é deslocalizada por ressonância em três oxigênios', 'é volumoso', 'é neutro'], 1, 'Ânion muito estável.'],
  ['Estereoquímica', 'A SN2 em um centro quiral produz…', ['retenção', 'inversão (Walden)', 'racemização completa', 'mistura de diastereoisômeros'], 1, 'Ataque traseiro: o guarda-chuva vira.'],
  ['Estereoquímica', 'A SN1 em um centro quiral produz, em geral…', ['inversão completa', 'retenção completa', 'mistura de enantiômeros, muitas vezes com ligeiro excesso de inversão', 'apenas um diastereoisômero'], 2, 'Carbocátion plano atacado pelas duas faces; pares iônicos.'],
  ['Estereoquímica', 'Dizer que a SN2 é estereoespecífica significa que…', ['forma qualquer estereoisômero', 'cada estereoisômero do reagente dá um estereoisômero específico do produto', 'só ocorre com aquirais', 'não depende da geometria'], 1, '(R) → produto invertido; (S) → o outro.'],
  ['Energia', 'No diagrama da SN2 existe…', ['um intermediário', 'apenas um estado de transição e nenhum intermediário', 'dois estados de transição', 'um carbocátion'], 1, 'Reação em uma etapa.'],
  ['Energia', 'No diagrama da SN1, o carbocátion corresponde a…', ['um máximo', 'um mínimo local (intermediário)', 'os reagentes', 'o estado de transição'], 1, 'Intermediário = vale entre dois estados de transição.'],
  ['Energia', 'Intermediário × estado de transição:', ['são a mesma coisa', 'intermediário é mínimo local (vida finita); estado de transição é máximo (não isolável)', 'ET é mais estável', 'intermediários não existem'], 1, 'Distinção fundamental na leitura de mecanismos.'],
  ['Competição E1/E2', 'Um haleto terciário com base forte (RO⁻) tende a sofrer…', ['SN2', 'E2', 'nenhuma reação', 'SN1 apenas'], 1, 'SN2 é impossível; a base remove um H β.'],
  ['Competição E1/E2', 'Aumentar a temperatura geralmente favorece…', ['substituição', 'eliminação', 'nada muda', 'apenas SN2'], 1, 'Eliminações têm ΔS mais favorável.'],
  ['Previsão', 'CH₃CH₂CH₂Br + NaN₃ em DMSO:', ['SN1', 'SN2', 'E1', 'sem reação'], 1, 'Primário + Nu forte + aprótico.'],
  ['Previsão', '(CH₃)₃CBr em metanol, sem base:', ['SN2', 'SN1 (com algum E1)', 'E2', 'sem reação'], 1, 'Solvólise de terciário.'],
  ['Previsão', '2-bromopropano + NaI em acetona:', ['SN1', 'SN2', 'E1', 'rearranjo'], 1, 'Nucleófilo forte e pouco básico em aprótico.'],
  ['Previsão', 'Brometo de benzila em etanol (sem nucleófilo forte):', ['SN2 apenas', 'SN1 (solvólise)', 'E2', 'sem reação'], 1, 'Cátion benzílico estabilizado por ressonância + solvente prótico.'],
];

export const TOPIC_SECTION = {
  Fundamentos: 'fundamentos', SN2: 'sn2', Substrato: 'sn2', SN1: 'sn1', Carbocátions: 'sn1', Nucleofilicidade: 'sn2', Solvente: 'sn2',
  'Grupo abandonador': 'sn1', Estereoquímica: 'sn2', Energia: 'sn2', 'Competição E1/E2': 'comparacao', Previsão: 'simulador',
};

export function quiz(host, nav) {
  let qs = [], i = 0, score = 0, answered = false, wrongTopics = {};
  const box = h('div', { class: 'quizbox' });
  host.append(box);
  function start() {
    qs = shuffle(BANK).slice(0, 20).map((q) => {
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
    box.append(h('div', { class: 'qprog' }, h('b', null, `${i + 1}/${qs.length}`), h('div', { class: 'bar' }, bar), h('span', { class: 'chip ok' }, `${score} acertos`)));
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
    const cls = pct < 50 ? 'Revise os fundamentos' : pct < 70 ? 'Bom começo' : pct < 85 ? 'Bom domínio' : 'Excelente domínio';
    const topics = Object.entries(wrongTopics).sort((a, b) => b[1] - a[1]);
    try { localStorage.setItem('sn-quiz-best', Math.max(pct, +(localStorage.getItem('sn-quiz-best') || 0))); } catch (e) { /* sem armazenamento */ }
    box.append(h('div', { class: 'qcard result' },
      h('div', { class: 'pct' }, pct + '%'),
      h('div', { class: 'cls' }, cls),
      h('p', null, `${score} de ${qs.length} questões corretas.`),
      topics.length ? h('div', null, h('p', null, h('b', null, 'Tópicos para revisar:')), h('ul', null, topics.map(([t, n]) => h('li', null, h('a', { href: '#' + (TOPIC_SECTION[t] || 'fundamentos'), onclick: (e) => { e.preventDefault(); nav(TOPIC_SECTION[t] || 'fundamentos'); } }, t), ` — ${n} erro(s)`)))) : h('p', null, 'Nenhum tópico com erro. Parabéns!'),
      h('div', { class: 'ex-actions', style: 'justify-content:center' }, h('button', { class: 'btn primary', type: 'button', onclick: start }, '↺ Novo quiz (novas questões)'), h('button', { class: 'btn', type: 'button', onclick: () => nav('quiz', 'desafio') }, '⚡ Desafio SN1 × SN2'))));
  }
  start();
}

/* ===================================================================
 * Desafio SN1 × SN2 (tempo limitado)
 * =================================================================== */
const CH = [
  { l: 1, sub: 'methyl', X: 'I', nu: 'NaCN', solv: 'DMSO', a: 'SN2', w: 'Metílico: não forma carbocátion; acesso traseiro livre.' },
  { l: 1, sub: 'ethyl', X: 'Br', nu: 'NaN₃', solv: 'DMF', a: 'SN2', w: 'Primário + Nu forte + aprótico.' },
  { l: 1, sub: 'propyl', X: 'Br', nu: 'NaI', solv: 'acetona', a: 'SN2', w: 'Primário; I⁻ forte; acetona aprótica.' },
  { l: 1, sub: 'tbutyl', X: 'Br', nu: 'H₂O', solv: 'H₂O', a: 'SN1', w: 'Terciário + nucleófilo fraco + prótico.' },
  { l: 1, sub: 'tbutyl', X: 'Cl', nu: 'CH₃OH', solv: 'CH₃OH', a: 'SN1', w: 'Solvólise de terciário.' },
  { l: 1, sub: 'methyl', X: 'Br', nu: 'NaOH', solv: 'H₂O/acetona', a: 'SN2', w: 'Metílico só reage por SN2.' },
  { l: 1, sub: 'tbutyl', X: 'I', nu: 'EtOH', solv: 'EtOH', a: 'SN1', w: 'Terciário em álcool (solvólise).' },
  { l: 1, sub: 'ethyl', X: 'I', nu: 'NaCN', solv: 'DMSO', a: 'SN2', w: 'Primário, Nu forte, aprótico.' },
  { l: 2, sub: 'isopropyl', X: 'Br', nu: 'NaN₃', solv: 'DMSO', a: 'SN2', w: 'Secundário + Nu forte e pouco básico + aprótico.' },
  { l: 2, sub: 'isopropyl', X: 'OTs', nu: 'H₂O', solv: 'H₂O', a: 'SN1', w: 'Secundário em solvólise, ótimo grupo abandonador.' },
  { l: 2, sub: 'benzyl', X: 'Br', nu: 'EtOH', solv: 'EtOH', a: 'SN1', w: 'Cátion benzílico estabilizado + nucleófilo fraco/prótico.' },
  { l: 2, sub: 'benzyl', X: 'Cl', nu: 'NaCN', solv: 'DMSO', a: 'SN2', w: 'Benzílico primário desimpedido + Nu forte + aprótico.' },
  { l: 2, sub: 'allyl', X: 'Br', nu: 'NaN₃', solv: 'DMF', a: 'SN2', w: 'Alílico primário + Nu forte + aprótico.' },
  { l: 2, sub: 'allyl', X: 'Cl', nu: 'H₂O', solv: 'H₂O', a: 'SN1', w: 'Cátion alílico estabilizado por ressonância em solvente ionizante.' },
  { l: 2, sub: 'cyclohexyl', X: 'Br', nu: 'NaI', solv: 'acetona', a: 'SN2', w: 'Secundário + I⁻ + aprótico.' },
  { l: 2, sub: 'cyclohexyl', X: 'OTs', nu: 'CH₃OH', solv: 'CH₃OH', a: 'SN1', w: 'Secundário em solvólise com excelente grupo abandonador.' },
  { l: 3, sub: 'tbutyl', X: 'Br', nu: 'NaN₃', solv: 'CH₃OH', a: 'SN1', w: 'Terciário: SN2 impossível. A azida (pouco básica) captura o carbocátion formado no metanol.' },
  { l: 3, sub: 'propyl', X: 'Br', nu: 'H₂O', solv: 'H₂O', a: 'SN2', w: 'Primário não forma carbocátion: mesmo lenta, a substituição é SN2.' },
  { l: 3, sub: 'methyl', X: 'OTs', nu: 'CH₃OH', solv: 'CH₃OH', a: 'SN2', w: 'CH₃⁺ é instável demais; a metanólise do tosilato de metila é SN2.' },
  { l: 3, sub: 'isobutyl', X: 'Br', nu: 'NaCN', solv: 'DMSO', a: 'SN2', w: 'Primário (ramificado em β, mais lento), mas ainda SN2.' },
  { l: 3, sub: 'tbutyl', X: 'Cl', nu: 'H₂O', solv: 'acetona/H₂O', a: 'SN1', w: 'A água ionizante permite a SN1 do terciário.' },
  { l: 3, sub: 'isopropyl', X: 'Br', nu: 'HCOOH', solv: 'HCOOH', a: 'SN1', w: 'Ácido fórmico: solvente muito ionizante e nucleófilo fraco.' },
];

export function challenge(host) {
  const st = { level: 1, pts: 0, streak: 0, best: 0, n: 0, timer: null, t0: 0, cur: null, used: new Set() };
  const TIME = { 1: 15, 2: 10, 3: 7 };
  const stats = h('div', { class: 'ch-stats' });
  const lvl = h('div', { class: 'seg', role: 'group', 'aria-label': 'Nível' });
  [1, 2, 3].forEach((l) => lvl.append(h('button', { type: 'button', 'aria-pressed': l === 1, onclick: () => { st.level = l; [...lvl.children].forEach((b, k) => b.setAttribute('aria-pressed', k + 1 === l)); } }, ['Nível 1 · básico', 'Nível 2 · intermediário', 'Nível 3 · avançado'][l - 1])));
  const timerBar = h('span', { style: 'width:100%' });
  const card = h('div', { class: 'ch-card' });
  host.append(h('div', { class: 'challenge' }, h('div', { class: 'controls' }, lvl), stats, h('div', { class: 'timer' }, timerBar), card));
  function drawStats() {
    stats.innerHTML = '';
    [['pontos', st.pts], ['sequência', st.streak], ['melhor sequência', st.best], ['respondidas', st.n]].forEach(([k, v]) => stats.append(h('div', null, h('b', null, String(v)), h('small', null, k))));
  }
  function intro() {
    card.innerHTML = '';
    card.append(h('h3', { style: 'margin-top:0' }, 'Desafio SN1 × SN2'), h('p', null, 'Uma reação aparece; responda SN1 ou SN2 antes do tempo acabar. Acertos em sequência multiplicam os pontos.'),
      h('button', { class: 'btn accent lg', type: 'button', onclick: next }, '⚡ Começar'));
    drawStats();
  }
  function next() {
    clearInterval(st.timer);
    let pool = CH.filter((c) => c.l <= st.level && !st.used.has(c));
    if (!pool.length) { st.used.clear(); pool = CH.filter((c) => c.l <= st.level); }
    const c = pool[Math.floor(Math.random() * pool.length)];
    st.used.add(c); st.cur = c; c.done = false;
    card.innerHTML = '';
    const rx = h('div', { class: 'rx', style: 'display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap' },
      h('div', { style: 'width:170px' }, mol(SK[c.sub](c.X), { scale: 36, fs: 15 })),
      h('span', { style: 'font-size:1.5rem;color:var(--muted)' }, '+'),
      h('b', { style: 'font-size:1.3rem;color:var(--magenta)' }, c.nu),
      h('span', { style: 'font-size:1.5rem;color:var(--muted)' }, '→'));
    const fb = h('div', { 'aria-live': 'assertive' });
    const ans = h('div', { class: 'ch-answers' }, ['SN1', 'SN2'].map((a) => h('button', { class: 'btn', type: 'button', style: a === 'SN1' ? 'border-color:var(--orange);color:var(--orange)' : 'border-color:var(--cyan);color:var(--cyan)', onclick: () => answer(a, fb, ans) }, a)));
    card.append(h('div', { class: 'cond' }, `solvente: ${c.solv}`), rx, ans, fb);
    const T = TIME[st.level] * 1000;
    st.t0 = performance.now();
    st.timer = setInterval(() => {
      const left = Math.max(0, 1 - (performance.now() - st.t0) / T);
      timerBar.style.width = left * 100 + '%';
      if (left <= 0) answer(null, fb, ans);
    }, 80);
  }
  function answer(a, fb, ans) {
    clearInterval(st.timer);
    if (st.cur.done) return;
    st.cur.done = true;
    [...ans.children].forEach((b) => { b.disabled = true; });
    const ok = a === st.cur.a;
    st.n++;
    if (ok) {
      st.streak++; st.best = Math.max(st.best, st.streak);
      const left = 1 - (performance.now() - st.t0) / (TIME[st.level] * 1000);
      st.pts += Math.round((10 * st.level + 10 * Math.max(0, left)) * (1 + Math.min(st.streak - 1, 4) * 0.25));
    } else st.streak = 0;
    fb.innerHTML = `<div class="fb ${ok ? 'ok' : 'bad'}">${a === null ? '⏱ Tempo esgotado. ' : ok ? '✔ Correto! ' : '✘ Não. '}Resposta: <b>${st.cur.a}</b>. ${st.cur.w}</div>`;
    fb.append(h('div', { class: 'ex-actions', style: 'justify-content:center' }, h('button', { class: 'btn primary', type: 'button', onclick: next }, 'Próxima reação →')));
    drawStats();
  }
  intro();
  return { stop() { clearInterval(st.timer); } };
}
