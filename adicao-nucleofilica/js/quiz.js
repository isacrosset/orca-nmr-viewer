/*
 * quiz.js — quiz final (45 questões sorteadas de um banco maior) e modos
 * desafio: “Qual será o produto?”, “Qual nucleófilo foi usado?”, “Adição ou
 * adição–eliminação?”, “Protege ou desprotege?” e “Wittig ou HWE?”.
 */
import { h, shuffle } from './widgets2d.js';
import { NUCS, PRODS, SUBS } from './data.js';
import { skx, nm } from './ui.js';

const rnd = (a) => a[Math.floor(Math.random() * a.length)];
const T = (topic, q, o, e, fig) => [topic, () => ({ q, o, a: 0, e, fig })];
const fg = (k, o) => () => skx(k, Object.assign({ scale: 28, fs: 13 }, o || {}));
const PN = { H2O: 'gem-diol', MeOH1: 'hemiacetal/hemicetal', MeOH: 'acetal/cetal (dimetílico)', EtOH: 'acetal/cetal (dietílico)', glicol: 'acetal/cetal cíclico', RNH2: 'imina', R2NH: 'enamina', NH2OH: 'oxima', NH2NH2: 'hidrazona', CN: 'cianoidrina', ylide: 'alceno (Wittig)', HWE: 'alceno conjugado (HWE)' };
const genQ = () => { const s = rnd(SUBS), ks = Object.keys(PN).filter((k) => (PRODS[s][k] || []).length && k !== 'MeOH1' && k !== 'EtOH'); const k = rnd(ks); const wrong = shuffle(ks.filter((x) => x !== k && PN[x] !== PN[k])).slice(0, 3); return { q: `${nm(s)} + ${NUCS[k].lab} → ? (classe do produto)`, o: [PN[k], ...wrong.map((x) => PN[x])], a: 0, e: `${NUCS[k].type}; ${NUCS[k].prod}.`, fig: fg(s) }; };

const BANK = [
  T('Adição nucleofílica', 'O nucleófilo ataca a C=O no:', ['carbono δ+', 'oxigênio δ−', 'H', 'carbono α'], 'Maior lobo do π*.'),
  T('Adição nucleofílica', 'Ao ser atacado, o C carbonílico passa de:', ['sp² a sp³', 'sp³ a sp²', 'sp a sp²', 'sp² a sp'], 'Intermediário tetraédrico.'),
  T('Adição nucleofílica', 'Ângulo típico de aproximação (Bürgi–Dunitz):', ['≈ 107°', '90°', '180°', '60°'], 'Trajetória.'),
  T('Adição nucleofílica', 'Em meio ácido, a 1ª etapa costuma ser:', ['protonação do O carbonílico', 'ataque do nucleófilo aniônico', 'saída de H₂O', 'desprotonação do C α'], 'Ativação.'),
  T('Adição nucleofílica', 'Nucleófilos fortemente básicos são incompatíveis com meio muito ácido porque:', ['são protonados e perdem a nucleofilicidade', 'reagem mais rápido', 'formam acetais', 'não existem em solução'], 'Compromisso.'),
  T('Equilíbrio', 'ΔG° < 0 implica:', ['K > 1', 'K < 1', 'K = 0', 'reação rápida'], 'ΔG° = −RT ln K.'),
  T('Equilíbrio', 'Um catalisador ácido:', ['acelera a chegada ao equilíbrio sem mudar K', 'aumenta K', 'desloca para o produto', 'é consumido'], 'Velocidade ≠ equilíbrio.'),
  T('Equilíbrio', 'Remover água na formação de acetal:', ['desloca para o acetal', 'desloca para a carbonila', 'não tem efeito', 'gera hemiacetal estável'], 'Le Châtelier.'),
  T('Equilíbrio', 'Excesso de água + H⁺ sobre um acetal:', ['hidrólise à carbonila', 'mais acetal', 'imina', 'nada'], 'Le Châtelier.'),
  T('Gem-dióis', 'Gem-diol é:', ['dois OH no mesmo carbono', 'dois OH vizinhos', 'OH + OR', 'éter cíclico'], 'Hidrato.'),
  T('Gem-dióis', 'Maior fração de hidrato:', ['hexafluoroacetona', 'acetona', 'acetaldeído', 'benzaldeído'], 'CF₃ retiradores.', fg('hexafluoroacetona')),
  T('Gem-dióis', 'Aldeídos geralmente hidratam mais que cetonas por:', ['menor impedimento e menor doação eletrônica', 'serem aromáticos', 'terem mais O', 'formarem ligação de H entre si'], 'Estérica + eletrônica.'),
  T('Hemiacetais', 'Hemiacetal: o carbono tem:', ['OH, OR, H e R', 'OR, OR, H, R', 'OH, OH', 'OH, NR₂'], 'Definição.'),
  T('Hemiacetais', 'A estrutura mostrada é:', ['hemicetal', 'hemiacetal', 'cetal', 'acetal'], 'OH + OR, C sem H.', fg('hemicetal')),
  T('Hemiacetais', 'Hemiacetais acíclicos simples:', ['geralmente revertem facilmente à carbonila', 'são sempre muito estáveis', 'são acetais', 'não existem'], 'Equilíbrio.'),
  T('Acetais', 'A estrutura mostrada é:', ['acetal', 'hemiacetal', 'cetal', 'gem-diol'], 'Dois OR, C com H.', fg('acetal')),
  T('Acetais', 'Na formação de acetal, o OH do hemiacetal sai como:', ['H₂O, após protonação', 'OH⁻', 'O²⁻', 'H₃O⁺'], 'Grupo de saída.'),
  T('Acetais', 'O intermediário catiônico da formação de acetais é:', ['íon oxocarbênio (C=O⁺R)', 'carbocátion isolado', 'íon imínio', 'carbânion'], 'Estabilizado pelo O.'),
  T('Acetais', 'Acetais são:', ['estáveis em base e hidrolisados em ácido aquoso', 'hidrolisados em base', 'estáveis em ácido aquoso', 'reativos com NaBH₄'], 'Base fundamental da proteção.'),
  T('Intramolecular', '5-Hidroxipentanal forma hemiacetal cíclico de:', ['6 membros', '5 membros', '4 membros', '7 membros'], 'O + 5 C.', fg('hidroxipentanal')),
  T('Intramolecular', 'Anéis mais favorecidos no fechamento intramolecular:', ['5 e 6 membros', '3 e 4', '7 e 8', 'todos iguais'], 'Tensão + entropia.'),
  T('Glicose', 'A glicopiranose forma-se pelo ataque do OH de:', ['C5 a C1', 'C6 a C1', 'C4 a C1', 'C1 a C5'], 'Piranose.'),
  T('Glicose', 'O carbono anomérico da glicose é:', ['C1', 'C2', 'C5', 'C6'], 'Ex-aldeído.'),
  T('Glicose', 'Em água, a glicose existe majoritariamente como:', ['β-piranose', 'forma aberta', 'α-furanose', 'acetal'], '≈ 64% β.'),
  T('Glicose', 'α e β-glicose são:', ['anômeros (diferem no C1)', 'enantiômeros', 'isômeros constitucionais', 'idênticos'], 'C anomérico.'),
  T('Sacarose', 'A sacarose é formada por:', ['glicose + frutose', 'glicose + glicose', 'frutose + galactose', 'glicose + galactose'], 'Dissacarídeo.'),
  T('Sacarose', 'A sacarose não é redutora porque:', ['os dois carbonos anoméricos estão na ligação glicosídica', 'não tem OH', 'é aromática', 'tem aldeído livre'], 'Sem hemiacetal livre.'),
  T('Proteção', 'Para proteger uma cetona antes de LiAlH₄:', ['etilenoglicol, H⁺', 'NaOH', 'NH₂OH', 'HCN'], 'Cetal cíclico.'),
  T('Proteção', 'Desproteção de cetal:', ['H₃O⁺', 'NaOH', 'LiAlH₄', 'Ph₃P=CH₂'], 'Hidrólise ácida.'),
  T('Proteção', 'Etilenoglicol + cetona forma anel de:', ['5 membros', '6', '4', '7'], 'Dioxolano.'),
  T('Tioacetais', 'Tioacetal + Ni de Raney:', ['C=O → CH₂ (global)', 'regenera C=O', 'forma alceno', 'forma álcool'], 'Mozingo.'),
  T('Iminas', 'Amina primária + carbonila (H⁺ moderado):', ['imina', 'enamina', 'acetal', 'amida'], 'C=N–R.'),
  T('Iminas', 'Carbinolamina tem:', ['OH e N no mesmo carbono', 'C=N', 'C=C–N', 'OR e OR'], 'Intermediário.'),
  T('Iminas', 'pH ideal de formação de iminas:', ['ácido moderado (≈ 4–5)', 'muito ácido (pH 0)', 'muito básico', 'qualquer'], 'Compromisso.'),
  T('Iminas', 'Iminas em H₃O⁺:', ['hidrolisam a carbonila + amina', 'são estáveis', 'formam enaminas', 'polimerizam sempre'], 'Reversível.'),
  T('Enaminas', 'Amina secundária + cetona com H α:', ['enamina', 'imina', 'oxima', 'cianoidrina'], 'C=C–NR₂.'),
  T('Enaminas', 'Na enamina, o H removido por último está:', ['no carbono α', 'no N', 'no O', 'no carbono carbonílico'], 'Imínio sem N–H.'),
  T('Oximas', 'Carbonila + NH₂OH:', ['oxima', 'hidrazona', 'imina', 'nitrila'], 'C=N–OH.'),
  T('Hidrazonas', 'Carbonila + NH₂NH₂:', ['hidrazona', 'oxima', 'azida', 'amina'], 'C=N–NH₂.'),
  T('Cianoidrinas', 'Cianoidrina tem no mesmo carbono:', ['OH e CN', 'OR e CN', 'NH₂ e CN', 'dois CN'], 'R₂C(OH)CN.'),
  T('Cianoidrinas', 'A cianoidrina forma uma nova ligação:', ['C–C', 'C–N', 'C–O apenas', 'N–O'], 'C–CN.'),
  T('Cianoidrinas', 'Nucleófilo na formação da cianoidrina:', ['CN⁻ (pelo carbono)', 'HCN neutro pelo H', 'N do cianeto', 'H₂O'], 'Catálise básica.'),
  T('Wittig', 'Reagente da Wittig:', ['ilídeo de fósforo', 'fosfato', 'fosfina oxidada', 'PCC'], 'Ph₃P=CR₂.'),
  T('Wittig', 'Força motriz importante da Wittig:', ['formação da ligação P=O', 'formação de H₂O', 'liberação de CO₂', 'aromaticidade'], 'Ph₃P=O.'),
  T('Wittig', 'Intermediário cíclico de quatro membros:', ['oxafosfetano', 'dioxolano', 'oxirano', 'ditiolano'], 'C–C–P–O.'),
  T('Wittig', 'Preparo de Ph₃P=CH₂:', ['PPh₃ + CH₃Br, depois base forte', 'PCl₃ + CH₄', 'Ph₃P=O + CH₂', 'H₃PO₄ + metanol'], 'Fosfônio → ilídeo.'),
  T('HWE', 'Reagente da HWE:', ['ânion de fosfonato', 'ilídeo de fosfônio', 'tiol', 'hidrazina'], '(RO)₂P(O)CH⁻R.'),
  T('HWE', 'Tendência estereoquímica típica da HWE com fosfonatos estabilizados:', ['E', 'Z', 'nenhuma', 'sempre 1:1'], 'Depende das condições.'),
  T('HWE', 'Vantagem prática da HWE:', ['subproduto fosfato hidrossolúvel', 'não precisa de base', 'forma Ph₃P=O', 'forma álcool'], 'Separação.'),
  T('Mecanismos', 'Na formação de acetal, cada protonação deve:', ['aumentar a eletrofilia ou gerar bom grupo de saída', 'ocorrer em qualquer átomo', 'evitar o oxigênio', 'ocorrer só no C'], 'Protonação produtiva.'),
  T('Mecanismos', 'Adição × condensação: a imina é produto de:', ['adição + eliminação', 'adição simples', 'olefinação', 'substituição radicalar'], 'Perde H₂O.'),
  T('Mecanismos', 'A cianoidrina é produto de:', ['adição', 'condensação', 'olefinação', 'eliminação'], 'Permanece sp³.'),
  ...Array.from({ length: 10 }, () => ['Previsão de produto', genQ]),
];
export const TOPIC_SECTION = { 'Adição nucleofílica': 'mecanismo', Equilíbrio: 'reversibilidade', 'Gem-dióis': 'gemdiois', Hemiacetais: 'hemiacetais', Acetais: 'acetais', Intramolecular: 'intramolecular', Glicose: 'glicose', Sacarose: 'sacarose', Proteção: 'protecao', Tioacetais: 'tioacetais', Iminas: 'iminas', Enaminas: 'enaminas', Oximas: 'oximas', Hidrazonas: 'hidrazonas', Cianoidrinas: 'cianoidrinas', Wittig: 'wittig', HWE: 'hwe', Mecanismos: 'mec-acetal', 'Previsão de produto': 'simsintese' };
export const BANK_SIZE = BANK.length;
export function classify(p) { return p < 50 ? 'Revise os fundamentos' : p < 70 ? 'Em desenvolvimento' : p < 85 ? 'Bom domínio' : 'Excelente domínio'; }

export function quiz(host, nav) {
  let qs = [], i = 0, score = 0, answered = false, wrong = {};
  const box = h('div', { class: 'quizbox' }); host.append(box);
  function start() { qs = shuffle(BANK).slice(0, 45).map(([topic, g]) => { const q = g(); const ord = shuffle(q.o.map((_, k) => k)); return Object.assign({ topic }, q, { o: ord.map((k) => q.o[k]), a: ord.indexOf(q.a) }); }); i = 0; score = 0; wrong = {}; render(); }
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
    const pct = Math.round(100 * score / qs.length), topics = Object.entries(wrong).sort((a, b) => b[1] - a[1]);
    box.append(h('div', { class: 'qcard result' }, h('div', { class: 'pct' }, pct + '%'), h('div', { class: 'cls' }, classify(pct)), h('p', null, `${score} de ${qs.length} corretas.`),
      topics.length ? h('div', null, h('p', null, h('b', null, 'Tópicos com mais erros — módulos recomendados:')), h('ul', null, topics.map(([t, n]) => h('li', null, h('a', { href: '#' + (TOPIC_SECTION[t] || 'inicio'), onclick: (e) => { e.preventDefault(); nav(TOPIC_SECTION[t] || 'inicio'); } }, t), ` — ${n} erro(s)`)))) : null,
      h('div', { class: 'ex-actions', style: 'justify-content:center' }, h('button', { class: 'btn primary', type: 'button', onclick: start }, '↺ Novo quiz'), h('button', { class: 'btn', type: 'button', onclick: () => nav('quiz', 'desafio') }, '⚡ Modo desafio'))));
  }
  start();
}

/* ===================================================================
 * Desafios
 * =================================================================== */
const TYPE = { H2O: 'adição', MeOH1: 'adição', CN: 'adição', MeOH: 'adição–eliminação', glicol: 'adição–eliminação', RNH2: 'adição–eliminação', R2NH: 'adição–eliminação', NH2OH: 'adição–eliminação', NH2NH2: 'adição–eliminação', ylide: 'olefinação', HWE: 'olefinação' };
const PROT = [['cicloexanona + etilenoglicol, TsOH, remoção de água', 'protege', 'Forma-se o cetal cíclico (carbonila mascarada).'], ['cetal cíclico + H₃O⁺', 'desprotege', 'Hidrólise ácida regenera a cetona.'], ['benzaldeído + HSCH₂CH₂SH, BF₃', 'protege', 'Tioacetal cíclico.'], ['2,2-dimetil-1,3-dioxolano + HCl aquoso', 'desprotege', 'Volta à acetona.'], ['aldeído + MeOH (excesso), H⁺, peneira molecular', 'protege', 'Acetal dimetílico.'], ['acetal dietílico + H₂O, TsOH, acetona', 'desprotege', 'Transacetalização/hidrólise.']];
const WH = [['=CH₂ numa cetona', 'Wittig', 'Ph₃P=CH₂.'], ['(E)-α,β-insaturado éster a partir de aldeído', 'HWE', 'Fosfonato estabilizado → E.'], ['alceno Z a partir de ilídeo não estabilizado', 'Wittig', 'Tendência Z (sem sais).'], ['produto fácil de purificar (subproduto hidrossolúvel)', 'HWE', 'Fosfato solúvel.'], ['metilenação de cicloexanona', 'Wittig', 'Ilídeo simples.'], ['cinamato de etila (E)', 'HWE', 'Clássico.']];
export function challenge(host) {
  const st = { pts: 0, streak: 0, best: 0, n: 0, ok: 0, timer: null, t0: 0, done: false, mode: 'prod' };
  const TIME = 15000;
  const stats = h('div', { class: 'ch-stats' }), bar = h('span', { style: 'width:100%' }), card = h('div', { class: 'ch-card' });
  const MODES = [['prod', 'Qual será o produto?'], ['nuc', 'Qual nucleófilo foi usado?'], ['type', 'Adição ou adição–eliminação?'], ['prot', 'Protege ou desprotege?'], ['wh', 'Wittig ou HWE?']];
  const modes = h('div', { class: 'controls', style: 'justify-content:center' }, ...MODES.map(([k, t]) => h('button', { class: 'btn sm', type: 'button', 'aria-pressed': k === st.mode ? 'true' : 'false', onclick: (e) => { st.mode = k; [...modes.children].forEach((b) => b.setAttribute('aria-pressed', b === e.currentTarget ? 'true' : 'false')); st.streak = 0; next(); } }, t)));
  host.append(h('div', { class: 'challenge' }, modes, stats, h('div', { class: 'timer' }, bar), card));
  const drawStats = () => { stats.innerHTML = ''; [['pontos', st.pts], ['sequência', st.streak], ['recorde', st.best], ['acertos', `${st.ok}/${st.n}`]].forEach(([k, v]) => stats.append(h('div', null, h('b', null, String(v)), h('small', null, k)))); };
  function intro() { card.innerHTML = ''; card.append(h('h3', { style: 'margin-top:0' }, 'Modo desafio'), h('p', null, 'Escolha um modo e responda em até 15 s. Acertos rápidos valem mais; sequências multiplicam os pontos.'), h('button', { class: 'btn accent lg', type: 'button', onclick: next }, '▶ Começar')); drawStats(); }
  function build() {
    if (st.mode === 'prod' || st.mode === 'nuc' || st.mode === 'type') {
      const s = rnd(SUBS), ks = Object.keys(TYPE).filter((k) => (PRODS[s][k] || []).length), k = rnd(ks), p = PRODS[s][k][0];
      if (st.mode === 'prod') { const others = shuffle(ks.filter((x) => x !== k && PRODS[s][x][0] !== p)).slice(0, 3); return { kind: 'Qual será o produto?', fig: skx(s, { scale: 26, fs: 12 }), q: `${nm(s)} + ${NUCS[k].lab}`, o: shuffle([k, ...others]).map((x) => ({ v: x, node: skx(PRODS[s][x][0], { scale: 20, fs: 11 }) })), a: k, e: `${NUCS[k].prod} (${NUCS[k].type}).` }; }
      if (st.mode === 'nuc') { const others = shuffle(ks.filter((x) => x !== k && PRODS[s][x][0] !== p && TYPE[x])).slice(0, 3); return { kind: 'Qual nucleófilo foi usado?', fig: h('div', { class: 'rxrow' }, skx(s, { scale: 22, fs: 11 }), h('span', { class: 'rxarr' }, '→'), skx(p, { scale: 22, fs: 11 })), q: 'Reagente?', o: shuffle([k, ...others]).map((x) => ({ v: x, t: NUCS[x].lab })), a: k, e: NUCS[k].prod + '.' }; }
      return { kind: 'Adição ou adição–eliminação?', fig: h('div', { class: 'rxrow' }, skx(s, { scale: 22, fs: 11 }), h('span', { class: 'rxarr', html: `→<small>${NUCS[k].lab}</small>` }), skx(p, { scale: 22, fs: 11 })), q: 'Que tipo de processo?', o: ['adição', 'adição–eliminação', 'olefinação'].map((x) => ({ v: x, t: x })), a: TYPE[k], e: `${NUCS[k].type}: ${TYPE[k] === 'adição' ? 'o C termina sp³ e nada é eliminado' : TYPE[k] === 'olefinação' ? 'forma-se C=C com P=O como subproduto' : 'há perda de H₂O'}.` };
    }
    if (st.mode === 'prot') { const [q, a, e] = rnd(PROT); return { kind: 'Protege ou desprotege?', q, o: ['protege', 'desprotege'].map((x) => ({ v: x, t: x })), a, e }; }
    const [q, a, e] = rnd(WH); return { kind: 'Wittig ou HWE?', q, o: ['Wittig', 'HWE'].map((x) => ({ v: x, t: x })), a, e };
  }
  function next() {
    clearInterval(st.timer); st.done = false; card.innerHTML = '';
    const q = build(), fbx = h('div', { 'aria-live': 'assertive' });
    const ans = h('div', { class: 'ch-answers' + (q.o.some((x) => x.node) ? ' figs' : '') }, q.o.map((x) => { const b = h('button', { class: x.node ? 'pickcard' : 'btn', type: 'button', onclick: () => answer(x.v, q, ans, fbx) }, x.node || x.t); b.dataset.v = x.v; return b; }));
    card.append(h('div', { class: 'topic' }, q.kind), q.fig ? h('div', { class: 'figs' }, q.fig) : null, h('h4', { style: 'text-align:center' }, q.q), ans, fbx);
    st.t0 = performance.now();
    st.timer = setInterval(() => { const left = Math.max(0, 1 - (performance.now() - st.t0) / TIME); bar.style.width = left * 100 + '%'; if (left <= 0) answer(null, q, ans, fbx); }, 100);
  }
  function answer(v, q, ans, fbx) {
    if (st.done) return; st.done = true; clearInterval(st.timer);
    [...ans.children].forEach((b) => { b.disabled = true; if (b.dataset.v === q.a) b.classList.add(b.classList.contains('pickcard') ? 'right' : 'primary'); });
    const ok = v === q.a; st.n++;
    if (ok) { st.ok++; st.streak++; st.best = Math.max(st.best, st.streak); const left = Math.max(0, 1 - (performance.now() - st.t0) / TIME); st.pts += Math.round((10 + 10 * left) * (1 + Math.min(st.streak - 1, 4) * 0.25)); } else st.streak = 0;
    fbx.innerHTML = `<div class="fb ${ok ? 'ok' : 'bad'}">${v === null ? '⏱ Tempo esgotado. ' : ok ? '✔ Correto! ' : '✘ Não. '}${q.e}</div>`;
    fbx.append(h('div', { class: 'ex-actions', style: 'justify-content:center' }, h('button', { class: 'btn primary', type: 'button', onclick: next }, 'Próxima →')));
    drawStats();
  }
  intro();
  return { stop() { clearInterval(st.timer); } };
}
