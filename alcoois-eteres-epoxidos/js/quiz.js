/*
 * quiz.js — quiz final (30 questões sorteadas de um banco) e desafio
 * "Qual é o produto?" com pontos, sequência e níveis de dificuldade.
 */
import { mol } from './chem2d.js';
import { M } from './struct.js';
import { h, shuffle, drawKeys } from './widgets2d.js';
import { CHALLENGE } from './rxn.js';

const BANK = [
  ['Estrutura', 'O oxigênio de um álcool tem:', ['hibridização sp³ e dois pares livres', 'hibridização sp² e um par livre', 'hibridização sp e nenhum par livre', 'hibridização sp³ e três pares livres'], 0, 'Duas ligações σ + dois pares livres.'],
  ['Estrutura', 'Em R–O–H, as ligações C–O e O–H são polarizadas com:', ['δ− no O; δ+ no C e no H', 'δ+ no O', 'nenhuma polarização', 'δ− no C'], 0, 'O é mais eletronegativo que C e H.'],
  ['Estrutura', 'O 2-metilpropan-2-ol é um álcool:', ['1°', '2°', '3°', 'benzílico'], 2, 'O C do OH está ligado a três carbonos.'],
  ['Estrutura', 'O ângulo C–O–C no oxirano é de aproximadamente:', ['61,5°', '109,5°', '112°', '120°'], 0, 'Anel de três membros.'],
  ['Nomenclatura', 'Nome IUPAC de CH₃CH(OH)CH₂CH₃:', ['butan-2-ol', 'butan-3-ol', '1-metilpropanol', 'sec-butanol-2'], 0, 'Menor localizador para o OH.'],
  ['Nomenclatura', 'Nome IUPAC de HOCH₂CH₂OH:', ['etano-1,2-diol', 'etanodiol-1,2', 'dietanol', 'etilenol'], 0, 'Nome usual: etilenoglicol.'],
  ['Nomenclatura', 'CH₃CH₂–O–CH₂CH₃ pela IUPAC é:', ['etoxietano', 'dietoxi', 'butan-2-ol', 'metoxipropano'], 0, 'Usual: éter dietílico.'],
  ['Nomenclatura', 'C₆H₅–O–CH₃ chama-se:', ['metoxibenzeno (anisol)', 'fenilmetanol', 'fenol metílico', 'benzil metil éter'], 0, 'Éter arílico.'],
  ['Propriedades', 'Por que o etanol ferve a 78 °C e o éter dimetílico a −24 °C?', ['ligações de hidrogênio entre moléculas de etanol', 'o etanol tem massa molar muito maior', 'o éter é iônico', 'o éter faz mais ligações de H'], 0, 'Mesma massa; só o álcool doa ligação de H.'],
  ['Propriedades', 'Éteres:', ['aceitam, mas não doam, ligações de H', 'doam e aceitam', 'não interagem com água', 'são mais ácidos que álcoois'], 0, 'Não há H em O.'],
  ['Propriedades', 'Ao aumentar a cadeia de um álcool (C1 → C8), a solubilidade em água:', ['diminui', 'aumenta', 'não muda', 'oscila'], 0, 'A parte apolar domina.'],
  ['Propriedades', 'Entre isômeros, mais ramificação geralmente:', ['diminui o ponto de ebulição', 'aumenta o ponto de ebulição', 'não altera', 'torna o álcool ácido'], 0, 'Menor área de contato.'],
  ['Acidez', 'O pKa do etanol é aproximadamente:', ['16', '4,8', '10', '38'], 0, 'Semelhante ao da água (15,7).'],
  ['Acidez', 'Qual base desprotona completamente o etanol?', ['NaH', 'NaHCO₃', 'Et₃N', 'H₂O'], 0, 'H⁻ → H₂ (pKa ≈ 35).'],
  ['Acidez', 'O fenol é mais ácido que o etanol porque:', ['o fenóxido é estabilizado por ressonância', 'o fenol é mais volumoso', 'o O do fenol é sp', 'o fenol não forma ligação de H'], 0, 'Deslocalização da carga no anel.'],
  ['Acidez', 'Em água, a ordem de acidez é:', ['metanol > etanol > terc-butanol', 'terc-butanol > etanol > metanol', 'todos iguais', 'etanol > metanol > terc-butanol'], 0, 'Solvatação do alcóxido.'],
  ['Preparação', 'Hidroboração-oxidação do propeno dá:', ['propan-1-ol', 'propan-2-ol', 'propanal', 'propano-1,2-diol'], 0, 'Anti-Markovnikov, syn.'],
  ['Preparação', 'A oximercuração-desmercuração:', ['é Markovnikov e evita rearranjos', 'é anti-Markovnikov', 'passa por carbocátion livre', 'forma diol'], 0, 'Íon mercurínio.'],
  ['Preparação', 'NaBH₄ reduz a butanona a:', ['butan-2-ol', 'butan-1-ol', 'butano', 'ácido butanoico'], 0, 'Cetona → álcool 2°.'],
  ['Reações de álcoois', 'Por que se adiciona ácido para substituir o OH de um álcool?', ['para transformar OH⁻ (ruim) em H₂O (bom grupo abandonador)', 'para oxidar o álcool', 'para formar alcóxido', 'para aumentar a nucleofilicidade do OH'], 0, 'Ativação do grupo abandonador.'],
  ['Reações de álcoois', 'terc-butanol + HBr segue mecanismo:', ['SN1', 'SN2', 'E2', 'radicalar'], 0, 'Cátion 3°.'],
  ['Reações de álcoois', '(R)-butan-2-ol + PBr₃ dá:', ['(S)-2-bromobutano', '(R)-2-bromobutano', 'racemato', 'but-2-eno'], 0, 'SN2 → inversão.'],
  ['Reações de álcoois', 'A tosilação (TsCl, piridina):', ['não rompe a ligação C–O (retenção)', 'inverte a configuração', 'forma carbocátion', 'oxida o álcool'], 0, 'O ataca o S.'],
  ['Reações de álcoois', 'O SOCl₂ converte álcoois em:', ['cloretos de alquila (+ SO₂ + HCl)', 'cetonas', 'éteres', 'alcenos apenas'], 0, 'Subprodutos gasosos.'],
  ['Reações de álcoois', 'A desidratação do 3,3-dimetilbutan-2-ol dá principalmente:', ['2,3-dimetilbut-2-eno', '3,3-dimetilbut-1-eno', '2,2-dimetilbutano', 'metilpropeno'], 0, 'Migração de metila + Zaitsev.'],
  ['Reações de álcoois', 'Na desidratação de um álcool 1°:', ['não se forma carbocátion primário livre', 'forma-se carbocátion 1° estável', 'a reação é mais fácil que com 3°', 'não pode haver isomerização'], 0, 'Perda de H₂O assistida.'],
  ['Oxidação', 'PCC oxida um álcool 1° a:', ['aldeído', 'ácido carboxílico', 'cetona', 'não oxida'], 0, 'Oxidante anidro.'],
  ['Oxidação', 'O reagente de Jones oxida um álcool 1° a:', ['ácido carboxílico', 'aldeído', 'éter', 'alceno'], 0, 'Em água o aldeído é oxidado de novo.'],
  ['Oxidação', 'Álcoois 3° com PCC:', ['não reagem (sem H no C do OH)', 'dão cetona', 'dão aldeído', 'dão ácido'], 0, 'Não há H carbinólico.'],
  ['Oxidação', 'Na oxidação com Cr(VI), a cor muda de:', ['laranja para verde', 'verde para laranja', 'incolor para azul', 'roxo para marrom'], 0, 'Cr(VI) → Cr(III).'],
  ['Éteres', 'Na síntese de Williamson, o haleto deve ser preferencialmente:', ['metílico ou primário', 'terciário', 'arílico', 'vinílico'], 0, 'SN2.'],
  ['Éteres', 'CH₃O⁻ + (CH₃)₃CBr dá principalmente:', ['metilpropeno (E2)', 'MTBE', 'terc-butanol', 'nada'], 0, 'Haleto 3°.'],
  ['Éteres', 'CH₃OCH₂CH₃ + HI (1 equiv.) dá:', ['CH₃I + CH₃CH₂OH', 'CH₃OH + CH₃CH₂I', 'só CH₃OH', 'etano'], 0, 'SN2 no CH₃.'],
  ['Éteres', 'Anisol + HBr dá:', ['fenol + CH₃Br', 'bromobenzeno + metanol', 'tolueno', 'não reage'], 0, 'C(sp²) não sofre SN2.'],
  ['Éteres', 'Um cuidado com éter dietílico e THF armazenados é:', ['a formação de peróxidos explosivos', 'a polimerização espontânea', 'a formação de HCl', 'a perda de cor'], 0, 'Não concentrar éter velho.'],
  ['Epóxidos', 'A epoxidação com mCPBA é:', ['concertada e estereoespecífica (syn)', 'via carbocátion', 'anti', 'radicalar'], 0, 'cis → cis.'],
  ['Epóxidos', 'Uma haloidrina com NaOH forma epóxido por:', ['SN2 intramolecular', 'E1', 'oxidação', 'SN1'], 0, 'O⁻ desloca X⁻ pelo lado oposto.'],
  ['Epóxidos', 'Em meio básico, o Nu ataca o carbono do epóxido:', ['menos substituído', 'mais substituído', 'qualquer um igualmente', 'nenhum'], 0, 'SN2: controle estérico.'],
  ['Epóxidos', 'Em meio ácido, o Nu fraco ataca em geral o carbono:', ['mais substituído', 'menos substituído', 'do O', 'de forma aleatória'], 0, 'Maior caráter δ+.'],
  ['Epóxidos', 'A abertura ácida de um epóxido:', ['não é uma SN1 com carbocátion livre: há inversão no C atacado', 'forma carbocátion livre e racemiza', 'é syn', 'não depende do ácido'], 0, 'ET com caráter catiônico parcial.'],
  ['Epóxidos', 'Óxido de ciclo-hexeno + H₃O⁺ dá o diol:', ['trans', 'cis', 'meso apenas', 'geminal'], 0, 'Abertura anti.'],
  ['Epóxidos', 'Óxido de etileno + RMgBr, depois H₃O⁺, dá:', ['R–CH₂CH₂–OH', 'R–OH', 'R–CH(OH)–CH₃', 'R–O–CH₂CH₃'], 0, 'C–C nova; +2 C.'],
  ['Síntese', 'Para inverter a configuração de um álcool quiral uma vez e trocar OH por CN:', ['TsCl/piridina; depois NaCN', 'NaCN direto', 'PCC; depois NaCN', 'H₂SO₄; depois HCN'], 0, 'Retenção + inversão.'],
  ['Síntese', 'Bromoetano → butan-1-ol:', ['1. Mg 2. óxido de etileno 3. H₃O⁺', '1. NaOH 2. PCC', '1. KOH 2. H₂O', '1. NaCN 2. H₃O⁺'], 0, 'Grignard + epóxido.'],
];
export const TOPIC_SECTION = {
  Estrutura: 'estrutura-alcoois', Nomenclatura: 'nomenclatura', Propriedades: 'estrutura-alcoois', Acidez: 'acidez', Preparação: 'preparacao', 'Reações de álcoois': 'reacoes-alcoois', Oxidação: 'oxidacao', Éteres: 'sintese-eteres', Epóxidos: 'abertura', Síntese: 'simulador',
};
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
      topics.length ? h('div', null, h('p', null, h('b', null, 'Tópicos para revisar:')), h('ul', null, topics.map(([t, n]) => h('li', null, h('a', { href: '#' + (TOPIC_SECTION[t] || 'inicio'), onclick: (e) => { e.preventDefault(); nav(TOPIC_SECTION[t] || 'inicio'); } }, t), ` — ${n} erro(s)`)))) : h('p', null, 'Nenhum erro. Parabéns!'),
      h('div', { class: 'ex-actions', style: 'justify-content:center' }, h('button', { class: 'btn primary', type: 'button', onclick: start }, '↺ Novo quiz'), h('button', { class: 'btn', type: 'button', onclick: () => nav('quiz', 'desafio') }, '⚡ Desafio "Qual é o produto?"'))));
  }
  start();
}

/* ===================================================================
 * Desafio "Qual é o produto?" (tempo, pontos, sequência e níveis)
 * =================================================================== */
export function challenge(host) {
  const st = { pts: 0, streak: 0, best: 0, n: 0, ok: 0, timer: null, t0: 0, done: false, lvl: 1 };
  const TIME = { 1: 20000, 2: 16000, 3: 14000 };
  const stats = h('div', { class: 'ch-stats' }), bar = h('span', { style: 'width:100%' }), card = h('div', { class: 'ch-card' });
  host.append(h('div', { class: 'challenge' }, stats, h('div', { class: 'timer' }, bar), card));
  const drawStats = () => { stats.innerHTML = ''; [['pontos', st.pts], ['sequência', st.streak], ['melhor sequência', st.best], ['acertos', `${st.ok}/${st.n}`], ['nível', ['', 'básico', 'intermediário', 'avançado'][st.lvl]]].forEach(([k, v]) => stats.append(h('div', null, h('b', null, String(v)), h('small', null, k)))); };
  function intro() {
    card.innerHTML = '';
    const lv = h('div', { class: 'seg', role: 'group', 'aria-label': 'Nível' }, [[1, 'Básico'], [2, 'Intermediário'], [3, 'Avançado']].map(([k, t]) => h('button', { type: 'button', 'aria-pressed': k === st.lvl ? 'true' : 'false', onclick: (e) => { st.lvl = k; [...lv.children].forEach((b) => b.setAttribute('aria-pressed', b === e.currentTarget)); drawStats(); } }, t)));
    card.append(h('h3', { style: 'margin-top:0' }, 'Qual é o produto?'), h('p', null, 'Uma reação aparece; escolha o produto principal antes do tempo acabar. Quanto mais rápido, mais pontos; acertos seguidos multiplicam a pontuação. Os níveis mais altos incluem rearranjos, estereoquímica e regioquímica de epóxidos.'), lv, h('div', { style: 'margin-top:12px' }, h('button', { class: 'btn accent lg', type: 'button', onclick: next }, '⚡ Começar')));
    drawStats();
  }
  function next() {
    clearInterval(st.timer);
    const pool = CHALLENGE.filter((c) => c.l <= st.lvl && (st.lvl === 1 || c.l >= st.lvl - 1));
    const c = pool[Math.floor(Math.random() * pool.length)];
    const opts = shuffle([c.p].concat(c.o));
    st.done = false;
    card.innerHTML = '';
    const fb = h('div', { 'aria-live': 'assertive' });
    const ans = h('div', { class: 'mcq cols' }, opts.map((p, i) => h('button', { class: 'mopt struct', type: 'button', onclick: () => answer(p, c, opts, ans, fb) }, h('span', { class: 'l' }, 'abcd'[i]), drawKeys(p, { w: 140, scale: 27, fs: 13 }))));
    card.append(h('div', { class: 'rxline' }, h('div', { style: 'width:170px' }, mol(M[c.s](), { scale: 34 })), h('span', { class: 'arrow' }, '⟶'), h('div', { class: 'cond', html: c.c }), h('span', { class: 'arrow' }, '⟶'), h('b', { style: 'font-size:1.6rem' }, '?')), ans, fb);
    st.t0 = performance.now();
    const T = TIME[st.lvl];
    st.timer = setInterval(() => { const left = Math.max(0, 1 - (performance.now() - st.t0) / T); bar.style.width = left * 100 + '%'; if (left <= 0) answer(null, c, opts, ans, fb); }, 80);
  }
  function answer(p, c, opts, ans, fb) {
    if (st.done) return; st.done = true; clearInterval(st.timer);
    [...ans.children].forEach((b, i) => { b.disabled = true; b.classList.toggle('right', opts[i] === c.p); if (opts[i] === p && p !== c.p) b.classList.add('wrong'); });
    const ok = p === c.p; st.n++;
    if (ok) { st.ok++; st.streak++; st.best = Math.max(st.best, st.streak); const left = Math.max(0, 1 - (performance.now() - st.t0) / TIME[st.lvl]); st.pts += Math.round((10 * c.l + 10 * left) * (1 + Math.min(st.streak - 1, 4) * 0.25)); } else st.streak = 0;
    fb.innerHTML = `<div class="fb ${ok ? 'ok' : 'bad'}">${p === null ? '⏱ Tempo esgotado. ' : ok ? '✔ Correto! ' : '✘ Não. '}${c.x}</div>`;
    fb.append(h('div', { class: 'ex-actions', style: 'justify-content:center' }, h('button', { class: 'btn primary', type: 'button', onclick: next }, 'Próxima →'), h('button', { class: 'btn', type: 'button', onclick: intro }, 'Trocar nível')));
    drawStats();
  }
  intro();
  return { stop() { clearInterval(st.timer); } };
}
