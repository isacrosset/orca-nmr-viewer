/*
 * quiz.js — quiz final (40 questões sorteadas de um banco > 60) e modos
 * desafio: “Qual é o produto?”, “Oxidação ou redução?”,
 * “NaBH₄, LiAlH₄ ou DIBAL-H?” e “PCC ou Jones?”.
 */
import { h, shuffle } from './widgets2d.js';
import { COMP, REAG, react } from './data.js';
import { sk } from './co2d.js';

const rnd = (a) => a[Math.floor(Math.random() * a.length)];
const T = (topic, q, o, e) => [topic, () => ({ q, o, a: 0, e })];
const nm = (k) => (COMP[k] ? COMP[k].name : k);
const prodName = (r) => { if (!r.ok) return 'não há reação usual'; const c = {}; r.prods.forEach((p) => { const n = typeof p === 'string' ? nm(p) : 'produto'; c[n] = (c[n] || 0) + 1; }); return Object.entries(c).map(([n, k]) => (k > 1 ? k + ' × ' : '') + n).join(' + '); };

/* questões geradas a partir das regras de data.js */
const PRODQ = [['butanal', 'NaBH4'], ['propanona', 'NaBH4'], ['cicloexanona', 'LiAlH4'], ['butanoatoMe', 'LiAlH4'], ['butanoatoMe', 'DIBAL'], ['butanonitrila', 'DIBAL'], ['butan1ol', 'PCC'], ['butan1ol', 'Jones'], ['cicloexanol', 'PCC'], ['benzilico', 'KMnO4'], ['butanal', 'Jones'], ['metilbuteno', 'O3r'], ['metilbuteno', 'O3o'], ['cicloexeno', 'O3r'], ['tercbutanol', 'Jones'], ['benzoico', 'NaBH4']];
const TOPIC_OF = { NaBH4: 'NaBH₄', LiAlH4: 'LiAlH₄', DIBAL: 'DIBAL-H', PCC: 'PCC', Jones: 'Jones', KMnO4: 'Permanganato', O3r: 'Ozonólise', O3o: 'Ozonólise' };
const DISTRACT = ['butan1ol', 'butan2ol', 'butanal', 'butanona', 'butanoico', 'propan2ol', 'propan1ol', 'cicloexanol', 'cicloexanona', 'benzaldeido', 'benzoico', 'benzilico', 'etanal', 'acetico', 'propanona', 'hexanodial', 'adipico', 'butanamina', 'metanol'];
function prodQ([sub, rg]) {
  return [TOPIC_OF[rg], () => {
    const r = react(sub, rg);
    const right = prodName(r);
    const opts = new Set([right]);
    if (r.ok) opts.add('não há reação usual');
    shuffle(DISTRACT).forEach((k) => { if (opts.size < 4 && !(r.prods || []).includes(k)) opts.add(nm(k)); });
    return { fig: () => sk(sub, { scale: 28, fs: 13 }), q: `${nm(sub)} + ${REAG[rg].name}: produto principal (comportamento típico)?`, o: [...opts], a: 0, e: r.why };
  }];
}

const BANK = [
  T('Carbonila', 'O grupo carbonila é:', ['C=O', 'C–OH', 'C–O–C', 'C=C'], 'Definição.'),
  T('Carbonila', 'Qual NÃO é um composto carbonílico?', ['etanol', 'etanal', 'acetona', 'ácido acético'], 'Etanol tem C–OH, sem C=O.'),
  T('Carbonila', 'Ésteres, amidas e cloretos de acila são:', ['derivados de ácidos carboxílicos (também carbonílicos)', 'aldeídos', 'cetonas', 'compostos sem C=O'], 'Famílias carbonílicas.'),
  T('Aldeídos e cetonas', 'Um aldeído tem, no carbono carbonílico:', ['pelo menos um H', 'dois grupos carbonados obrigatoriamente', 'um OH', 'um halogênio'], 'R–CHO.'),
  T('Aldeídos e cetonas', 'A acetofenona é:', ['uma cetona', 'um aldeído', 'um ácido', 'um éster'], 'C=O entre fenila e metila.'),
  T('Estrutura', 'Hibridização do carbono carbonílico:', ['sp²', 'sp³', 'sp', 'sp³d'], 'Três domínios σ.'),
  T('Estrutura', 'Ângulos em torno do C carbonílico:', ['≈ 120°', '≈ 109,5°', '180°', '90°'], 'Trigonal planar.'),
  T('Estrutura', 'A ligação π C=O resulta da sobreposição:', ['lateral de orbitais p do C e do O', 'frontal de sp²', 's–s', 'de sp³ com p'], 'Perpendicular ao plano.'),
  T('Polarização', 'Na C=O, o carbono é:', ['δ+ (eletrofílico)', 'δ− (nucleofílico)', 'neutro', 'carbânion'], 'O mais eletronegativo.'),
  T('Polarização', 'No mapa de potencial, a região rica em elétrons da acetona fica:', ['no oxigênio', 'no carbono carbonílico', 'nos H', 'uniforme'], 'Pares livres e π polarizada.'),
  T('Ressonância', 'A forma R₂C⁺–O⁻ é:', ['contribuinte minoritário que explica a polarização', 'a estrutura real', 'uma espécie em equilíbrio', 'um intermediário'], 'Ressonância não é equilíbrio.'),
  T('Orbitais', 'O LUMO da carbonila é essencialmente:', ['o π* C=O, com maior coeficiente no C', 'o π, no O', 'um par livre do O', 'o σ C–H'], 'Orbital vazio de baixa energia.'),
  T('Orbitais', 'O π ocupado tem maior coeficiente:', ['no oxigênio', 'no carbono', 'nos dois igualmente', 'no H'], 'O é mais eletronegativo.'),
  T('Bürgi–Dunitz', 'Ângulo de ataque Nu···C=O típico:', ['≈ 107°', '90°', '180°', '45°'], 'Trajetória de Bürgi–Dunitz.'),
  T('Bürgi–Dunitz', 'O ângulo de Bürgi–Dunitz maximiza:', ['a sobreposição com o π* e minimiza a repulsão com o O', 'a repulsão com o O', 'a sobreposição com o π', 'o contato com os H'], 'Combinação orbital + eletrostática.'),
  T('Bürgi–Dunitz', 'Redução da butanona com NaBH₄ fornece:', ['butan-2-ol racêmico', 'só (R)-butan-2-ol', 'só (S)-butan-2-ol', 'butan-1-ol'], 'Ataque igual pelas duas faces.'),
  T('Propriedades', 'Maior ponto de ebulição:', ['butan-1-ol', 'butanal', 'butanona', 'pentano'], 'Ligação de H.'),
  T('Propriedades', 'Aldeídos e cetonas simples, entre si, fazem:', ['dipolo–dipolo (não doam ligação de H)', 'ligação de H como doadores', 'só dispersão', 'ligação iônica'], 'Sem O–H.'),
  T('Propriedades', 'A acetona é miscível em água porque:', ['o O carbonílico aceita ligação de H da água', 'doa ligação de H', 'é iônica', 'é apolar'], 'Aceptor de H.'),
  T('Reatividade', 'Em geral, mais reativo frente a nucleófilos:', ['aldeído', 'cetona', 'iguais', 'depende só do solvente'], 'Menos impedimento, C mais δ+.'),
  T('Reatividade', 'Grupos alquila no carbono carbonílico:', ['doam densidade e aumentam o impedimento, reduzindo a reatividade', 'aumentam a eletrofilicidade', 'não influenciam', 'tornam o C δ−'], 'Efeitos eletrônico e estérico.'),
  T('Adição nucleofílica', 'Na adição nucleofílica, o carbono passa de:', ['sp² (trigonal) a sp³ (tetraédrico)', 'sp³ a sp²', 'sp a sp²', 'sp² a sp'], 'Intermediário tetraédrico.'),
  T('Adição nucleofílica', 'Quando o Nu ataca o C, o par π C=O:', ['vai para o O (alcóxido)', 'vai para o C', 'vai para o Nu', 'é perdido como H₂'], 'Evita carbono pentavalente.'),
  T('NaBH₄', 'Em NaBH₄, o hidreto:', ['é transferido a partir da ligação B–H (hidreto equivalente)', 'existe livre em solução', 'é um próton', 'ataca o oxigênio'], 'Não há H⁻ livre.'),
  T('NaBH₄', 'NaBH₄ reduz, em condições usuais:', ['aldeídos e cetonas', 'ésteres e ácidos', 'alcenos', 'nitrilas a aminas'], 'Redutor brando.'),
  T('LiAlH₄', 'LiAlH₄ é usado em:', ['éter/THF anidro, com workup aquoso posterior', 'água', 'metanol', 'ácido sulfúrico aquoso'], 'Reage vigorosamente com água.'),
  T('LiAlH₄', 'Ácido butanoico + LiAlH₄ (depois H₃O⁺):', ['butan-1-ol', 'butanal', 'butanona', 'não reage'], 'Redutor forte.'),
  T('NaBH₄ × LiAlH₄', 'Por que LiAlH₄ é mais reativo que NaBH₄?', ['a ligação Al–H é mais polarizada (Al menos eletronegativo)', 'tem mais H', 'é mais pesado', 'é oxidante'], 'Al–H mais “hidrídica”.'),
  T('DIBAL-H', 'DIBAL-H, 1 equiv., −78 °C, com um éster dá, após workup:', ['aldeído', 'álcool primário sempre', 'ácido', 'cetona'], 'Redução parcial controlada.'),
  T('DIBAL-H', 'Sobre o DIBAL-H é correto:', ['o resultado depende de temperatura, equivalentes e workup', 'sempre para no aldeído', 'nunca reduz aldeídos', 'é um oxidante'], 'Não é regra absoluta.'),
  T('Estado de oxidação', 'Nº de oxidação do C funcional no metanol, metanal e ácido fórmico:', ['−2, 0, +2', '0, +2, +4', '+2, 0, −2', '−1, +1, +3'], '+1 por ligação a O, −1 por H.'),
  T('Estado de oxidação', 'Converter aldeído em álcool é:', ['redução', 'oxidação', 'nem um nem outro', 'eliminação'], 'Ganha C–H.'),
  T('Oxidação de álcoois', 'Álcool terciário com Cr(VI):', ['não sofre a oxidação usual', 'dá cetona', 'dá aldeído', 'dá ácido'], 'Sem H no carbono carbinólico.'),
  T('PCC', 'PCC em CH₂Cl₂ converte álcool 1° em:', ['aldeído', 'ácido', 'cetona', 'éter'], 'Condições anidras.'),
  T('Jones', 'O reagente de Jones é:', ['CrO₃/H₂SO₄ em acetona/água', 'PCC em CH₂Cl₂', 'KMnO₄ frio', 'O₃'], 'Cr(VI) ácido aquoso.'),
  T('Jones', 'Superoxidação no Jones ocorre via:', ['hidrato do aldeído', 'enol', 'radical', 'carbocátion'], 'R–CH(OH)₂.'),
  T('Permanganato', 'KMnO₄ é melhor descrito como:', ['oxidante forte cujo resultado depende das condições', 'redutor brando', 'reagente seletivo para aldeídos', 'catalisador ácido'], 'pH, T, concentração.'),
  T('Mecanismo Cr(VI)', 'O primeiro intermediário na oxidação de álcoois por Cr(VI) é:', ['o éster de cromato', 'um carbocátion', 'um radical alquila', 'um alcóxido de sódio'], 'O–CrO₃H.'),
  T('Mecanismo Cr(VI)', 'Na etapa de formação da C=O, o Cr passa de:', ['Cr(VI) a Cr(IV)', 'Cr(IV) a Cr(VI)', 'Cr(III) a Cr(VI)', 'não muda'], 'O Cr é reduzido.'),
  T('Oxidação de aldeídos', 'Teste de Tollens positivo indica:', ['aldeído (Ag⁺ → Ag⁰)', 'cetona', 'álcool 3°', 'alceno'], 'Espelho de prata.'),
  T('Oxidação de aldeídos', 'Cetonas resistem à oxidação simples porque:', ['não têm H no C carbonílico', 'são aromáticas', 'são básicas', 'já são ácidos'], 'Exigiria quebra C–C.'),
  T('Ozonólise', 'Na ozonólise, cada carbono da C=C:', ['torna-se um carbono carbonílico', 'vira álcool', 'vira alcano', 'permanece sp²–C=C'], 'Clivagem.'),
  T('Ozonólise', 'Workup com Me₂S ou Zn/H₂O é:', ['redutivo (preserva aldeídos)', 'oxidativo', 'ácido forte', 'básico'], 'Aldeídos sobrevivem.'),
  T('Ozonólise', '2,3-dimetilbut-2-eno + O₃; Me₂S:', ['2 acetona', 'acetona + etanal', 'butanona', '2 etanal'], 'Simétrico e tetrassubstituído.'),
  T('Ozonólise', 'Qual alceno dá acetona + metanal?', ['2-metilpropeno', 'but-2-eno', 'but-1-eno', 'propeno'], 'Ozonólise inversa.'),
  T('Interconversões', 'Para ir de álcool 1° a aldeído e de volta:', ['PCC; depois NaBH₄', 'NaBH₄; depois PCC', 'Jones; depois DIBAL', 'O₃; depois PCC'], 'Oxidação e redução.'),
  T('Interconversões', 'Éster → aldeído → álcool 2°? O segundo passo exigiria:', ['adição de um nucleófilo de carbono (não estudado aqui), não apenas redução', 'NaBH₄', 'PCC', 'O₃'], 'Redução de aldeído dá álcool 1°.'),
  ...PRODQ.map(prodQ),
];
export const TOPIC_SECTION = {
  Carbonila: 'carbonilicos', 'Aldeídos e cetonas': 'aldcet', Estrutura: 'estrutura', Polarização: 'polarizacao', Ressonância: 'ressonancia', Orbitais: 'orbitais', 'Bürgi–Dunitz': 'burgi', Propriedades: 'propriedades', Reatividade: 'reatividade',
  'Adição nucleofílica': 'adicao', 'NaBH₄': 'nabh4', 'LiAlH₄': 'lialh4', 'NaBH₄ × LiAlH₄': 'comparacao', 'DIBAL-H': 'dibal', 'Estado de oxidação': 'oxestados', 'Oxidação de álcoois': 'oxalcoois', PCC: 'pcc', Jones: 'jones', Permanganato: 'kmno4',
  'Mecanismo Cr(VI)': 'cromo', 'Oxidação de aldeídos': 'oxaldeidos', Ozonólise: 'ozonolise', Interconversões: 'mapa-inter',
};
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
      topics.length ? h('div', null, h('p', null, h('b', null, 'Assuntos para revisar:')), h('ul', null, topics.map(([t, n]) => h('li', null, h('a', { href: '#' + (TOPIC_SECTION[t] || 'inicio'), onclick: (e) => { e.preventDefault(); nav(TOPIC_SECTION[t] || 'inicio'); } }, t), ` — ${n} erro(s)`)))) : null,
      h('div', { class: 'ex-actions', style: 'justify-content:center' }, h('button', { class: 'btn primary', type: 'button', onclick: start }, '↺ Novo quiz'), h('button', { class: 'btn', type: 'button', onclick: () => nav('quiz', 'desafio') }, '⚡ Modo desafio'))));
  }
  start();
}

/* ===================================================================
 * Desafios
 * =================================================================== */
const PROD_POOL = [['butanal', 'NaBH4'], ['propanona', 'NaBH4'], ['benzaldeido', 'NaBH4'], ['cicloexanona', 'NaBH4'], ['acetofenona', 'LiAlH4'], ['butanoatoMe', 'LiAlH4'], ['butanoico', 'LiAlH4'], ['butanoatoMe', 'DIBAL'], ['butanonitrila', 'DIBAL'], ['butanonitrila', 'LiAlH4'],
  ['butan1ol', 'PCC'], ['butan1ol', 'Jones'], ['pentan1ol', 'PCC'], ['pentan1ol', 'Jones'], ['butan2ol', 'PCC'], ['cicloexanol', 'Jones'], ['feniletanol', 'PCC'], ['benzilico', 'KMnO4'], ['benzaldeido', 'Jones'], ['butanal', 'Jones'],
  ['metilbuteno', 'O3r'], ['metilbuteno', 'O3o'], ['tetrametiletileno', 'O3r'], ['metilpropeno', 'O3r'], ['but2eno', 'O3r'], ['cicloexeno', 'O3r'], ['tercbutanol', 'PCC'], ['propanona', 'Jones'], ['butanoatoMe', 'NaBH4']];
const REDOX = [['butanal', 'butan1ol', 'redução'], ['propan2ol', 'propanona', 'oxidação'], ['butanal', 'butanoico', 'oxidação'], ['cicloexanona', 'cicloexanol', 'redução'], ['benzilico', 'benzaldeido', 'oxidação'], ['benzoico', 'benzilico', 'redução'],
  ['butanoatoMe', 'butanal', 'redução'], ['etanol', 'acetico', 'oxidação'], ['feniletanol', 'acetofenona', 'oxidação'], ['butanonitrila', 'butanamina', 'redução'], ['metanol', 'metanal', 'oxidação'], ['acetofenona', 'feniletanol', 'redução']];
const WHICH_RED = [['cetona → álcool secundário, em metanol', 'NaBH₄', 'Brando e compatível com MeOH.'], ['aldeído → álcool primário, sem tocar num éster da mesma molécula', 'NaBH₄', 'Quimiosseletivo.'],
  ['éster → álcool primário', 'LiAlH₄', 'Redutor forte; NaBH₄ não reduz ésteres usualmente.'], ['ácido carboxílico → álcool primário', 'LiAlH₄', 'NaBH₄ não reduz ácidos.'], ['nitrila → amina primária', 'LiAlH₄', 'Duas adições de hidreto.'],
  ['éster → aldeído (−78 °C, 1 equiv.)', 'DIBAL-H', 'Redução parcial controlada.'], ['nitrila → aldeído (após hidrólise)', 'DIBAL-H', 'Imina de Al → aldeído.'], ['reduzir uma cetona usando etanol como solvente', 'NaBH₄', 'LiAlH₄ reagiria com o etanol.']];
const WHICH_OX = [['butan-1-ol → butanal', 'PCC', 'Anidro: para no aldeído.'], ['butan-1-ol → ácido butanoico', 'Jones', 'Meio aquoso: hidrato → ácido.'], ['cicloexanol → cicloexanona', 'ambos', 'Álcool 2° → cetona com qualquer dos dois.'],
  ['álcool benzílico → benzaldeído', 'PCC', 'Para no aldeído.'], ['etanol → ácido acético', 'Jones', 'Superoxidação via hidrato.'], ['propan-2-ol → acetona', 'ambos', 'Álcool 2°.'], ['pentanal → ácido pentanoico', 'Jones', 'Aldeído hidrata em água e oxida.'], ['pentan-1-ol → pentanal', 'PCC', 'Condições anidras.']];

export function challenge(host) {
  const st = { pts: 0, streak: 0, best: 0, n: 0, ok: 0, timer: null, t0: 0, done: false, mode: 'prod' };
  const TIME = 15000;
  const stats = h('div', { class: 'ch-stats' }), bar = h('span', { style: 'width:100%' }), card = h('div', { class: 'ch-card' });
  const MODES = [['prod', 'Qual é o produto?'], ['redox', 'Oxidação ou redução?'], ['red', 'NaBH₄, LiAlH₄ ou DIBAL-H?'], ['ox', 'PCC ou Jones?']];
  const modes = h('div', { class: 'controls', style: 'justify-content:center' }, ...MODES.map(([k, t]) => h('button', { class: 'btn sm', type: 'button', 'aria-pressed': k === st.mode ? 'true' : 'false', onclick: (e) => { st.mode = k; [...modes.children].forEach((b) => b.setAttribute('aria-pressed', b === e.currentTarget ? 'true' : 'false')); st.streak = 0; next(); } }, t)));
  host.append(h('div', { class: 'challenge' }, modes, stats, h('div', { class: 'timer' }, bar), card));
  const drawStats = () => { stats.innerHTML = ''; [['pontos', st.pts], ['sequência', st.streak], ['recorde', st.best], ['acertos', `${st.ok}/${st.n}`]].forEach(([k, v]) => stats.append(h('div', null, h('b', null, String(v)), h('small', null, k)))); };
  function intro() { card.innerHTML = ''; bar.style.width = '100%'; card.append(h('h3', { style: 'margin-top:0' }, 'Modo desafio'), h('p', null, 'Escolha um modo e responda em até 15 s. Acertos rápidos valem mais; sequências multiplicam os pontos.'), h('button', { class: 'btn accent lg', type: 'button', onclick: next }, '▶ Começar')); drawStats(); }
  function build() {
    if (st.mode === 'prod') {
      const [sub, rg] = rnd(PROD_POOL), r = react(sub, rg);
      const right = prodName(r);
      const o = new Set([right]); if (r.ok) o.add('não há reação usual');
      shuffle(DISTRACT).forEach((k) => { if (o.size < 4 && !r.prods.includes(k)) o.add(nm(k)); });
      return { kind: 'Qual é o produto?', fig: sk(sub, { scale: 28, fs: 13 }), q: `${nm(sub)} + ${REAG[rg].name}`, o: shuffle([...o]), a: right, e: r.why };
    }
    if (st.mode === 'redox') {
      const [a, b, k] = rnd(REDOX);
      return { kind: 'Oxidação ou redução?', fig: h('div', { class: 'rxrow' }, sk(a, { scale: 26, fs: 12 }), h('span', { class: 'rxarr' }, '→'), sk(b, { scale: 26, fs: 12 })), q: `${nm(a)} → ${nm(b)}`, o: ['oxidação', 'redução'], a: k, e: k === 'oxidação' ? 'O carbono funcional ganha ligações a O (ou perde C–H): nº de oxidação aumenta.' : 'O carbono funcional ganha C–H (ou perde ligações a O): nº de oxidação diminui.' };
    }
    if (st.mode === 'red') { const [q, a, e] = rnd(WHICH_RED); return { kind: 'NaBH₄, LiAlH₄ ou DIBAL-H?', q, o: ['NaBH₄', 'LiAlH₄', 'DIBAL-H'], a, e }; }
    const [q, a, e] = rnd(WHICH_OX); return { kind: 'PCC ou Jones?', q, o: ['PCC', 'Jones', 'ambos'], a, e };
  }
  function next() {
    clearInterval(st.timer); st.done = false; card.innerHTML = '';
    const q = build();
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
    fbx.innerHTML = `<div class="fb ${ok ? 'ok' : 'bad'}">${t === null ? '⏱ Tempo esgotado. ' : ok ? '✔ Correto! ' : '✘ Não. '}Resposta: <b>${q.a}</b>. ${q.e}</div>`;
    fbx.append(h('div', { class: 'ex-actions', style: 'justify-content:center' }, h('button', { class: 'btn primary', type: 'button', onclick: next }, 'Próxima →')));
    drawStats();
  }
  intro();
  return { stop() { clearInterval(st.timer); } };
}
