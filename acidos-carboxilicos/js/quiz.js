/*
 * quiz.js — quiz final (45 questões sorteadas de um banco maior) e modos
 * desafio: “Qual reage mais rápido?”, “Quem sai?”, “Qual produto?”,
 * “Qual reagente?” e “Substituição possível ou não?”.
 */
import { h, shuffle } from './widgets2d.js';
import { MATRIX, NUCS, SUBS, DERIV } from './data.js';
import { skx, nm } from './ui.js';

const rnd = (a) => a[Math.floor(Math.random() * a.length)];
const T = (topic, q, o, e, fig) => [topic, () => ({ q, o, a: 0, e, fig })];
const fg = (k) => () => skx(k, { scale: 28, fs: 13 });
const BANK = [
  T('Acidez', 'A acidez dos ácidos carboxílicos deve-se principalmente à:', ['estabilização por ressonância do carboxilato', 'ligação de H', 'massa molar', 'hibridização sp³'], 'Base conjugada.'),
  T('Acidez', 'Mais ácido:', ['ácido tricloroacético', 'ácido acético', 'etanol', 'ácido cloroacético'], 'Três Cl (−I).'),
  T('Acidez', 'pKₐ aproximado do ácido acético:', ['4,8', '16', '−7', '10'], 'Valor clássico.'),
  T('Acidez', 'No acetato, as ligações C–O são:', ['equivalentes (≈ 1,26 Å)', 'uma dupla e uma simples', 'ambas 1,43 Å', 'ambas 1,21 Å'], 'Ressonância.'),
  T('Estrutura', 'O carbono do grupo carboxila é:', ['sp², trigonal planar', 'sp³', 'sp', 'sp³d'], '120°.'),
  T('Estrutura', 'Ácidos carboxílicos podem formar dímeros por:', ['duas ligações de H', 'ligação covalente', 'interação iônica', 'π-stacking'], 'Dímero cíclico.'),
  T('Reatividade', 'Ordem de reatividade (SNAc):', ['cloreto > anidrido > éster > amida', 'amida > éster > anidrido > cloreto', 'éster > cloreto > amida > anidrido', 'anidrido > cloreto > amida > éster'], 'Escada.'),
  T('Reatividade', 'Por que o cloreto de acila é tão reativo?', ['Cl doa pouco e Cl⁻ é ótimo grupo de saída', 'Cl doa muito', 'não tem C=O', 'é aromático'], 'Dois fatores.'),
  T('Reatividade', 'Melhor grupo de saída:', ['Cl⁻', 'EtO⁻', 'H₂N⁻', 'HO⁻'], 'Base mais fraca.'),
  T('Reatividade', 'É fácil converter:', ['cloreto em éster', 'amida em cloreto', 'éster em anidrido', 'amida em éster'], 'Descer.'),
  T('Mecanismo', 'Intermediário da SNAc:', ['tetraédrico', 'carbocátion acílio', 'radical', 'carbeno'], 'sp³.'),
  T('Mecanismo', 'A diferença entre SNAc e adição a aldeídos é:', ['o tetraédrico expulsa um grupo de saída', 'não há ataque ao C', 'aldeídos têm grupo de saída', 'SNAc é radicalar'], 'Eliminação.'),
  T('Mecanismo', 'Hibridização do C acílico: reagente → tetraédrico → produto:', ['sp² → sp³ → sp²', 'sp³ → sp² → sp³', 'sp → sp² → sp', 'sp² → sp² → sp²'], 'Ida e volta.'),
  T('Mecanismo', 'Em meio ácido, um OH só sai após:', ['protonação (sai H₂O)', 'desprotonação', 'oxidação', 'redução'], 'Ativação.'),
  T('Cloretos', 'RCOOH + SOCl₂ →', ['RCOCl + SO₂ + HCl', 'RCOOR + SO₂', 'RCN + SO₂', 'RCHO'], 'Cloreto de acila.'),
  T('Cloretos', 'No mecanismo com SOCl₂, o primeiro ataque é do O do ácido ao:', ['S', 'C acílico', 'Cl', 'H'], 'Ativação.'),
  T('Cloretos', 'Subprodutos do (COCl)₂:', ['CO + CO₂ + HCl', 'SO₂ + HCl', 'H₃PO₃', 'POCl₃'], 'Gases.'),
  T('Cloretos', 'RCOCl + 2 RNH₂ →', ['RCONHR + RNH₃⁺Cl⁻', 'RCOOH', 'RCN', 'RCOOR'], 'Amida.'),
  T('Anidridos', 'Síntese de anidrido:', ['RCOCl + RCOO⁻', 'RCOOR + H₂O', 'RCONH₂ + RCOOH', 'RCN + H₂O'], 'Carboxilato ataca.'),
  T('Anidridos', 'Anidrido + ROH →', ['éster + ácido', 'amida + ácido', 'dois ésteres', 'cloreto + ácido'], 'Sai carboxilato.'),
  T('Anidridos', 'Carboxilato é bom grupo de saída porque:', ['é estabilizado por ressonância (base fraca)', 'é base forte', 'é neutro', 'é volumoso'], 'pKₐ 4,8.'),
  T('Ésteres', 'Esterificação de Fischer é:', ['reversível e catalisada por ácido', 'irreversível', 'catalisada por base', 'radicalar'], 'Equilíbrio.'),
  T('Ésteres', 'Para deslocar a Fischer para o éster:', ['excesso de álcool e remoção de água', 'adicionar água', 'adicionar NaOH', 'aquecer em água'], 'Le Châtelier.'),
  T('Ésteres', 'Na Fischer, a primeira etapa é:', ['protonação da C=O', 'ataque do álcool ao O', 'saída de HO⁻', 'formação de acílio'], 'Ativação.'),
  T('Ésteres', 'Hidrólise ácida de éster é:', ['o inverso da Fischer (equilíbrio)', 'irreversível', 'uma saponificação', 'uma redução'], 'Reversibilidade.'),
  T('Ésteres', 'Saponificação forma:', ['carboxilato + álcool', 'ácido + alcóxido', 'amida', 'cetona'], 'Irreversível.'),
  T('Ésteres', 'A saponificação é efetivamente irreversível porque:', ['o carboxilato é pouco eletrofílico (ácido-base final)', 'HO⁻ é catalisador', 'o álcool sai como gás', 'é radicalar'], 'ΔpKₐ.'),
  T('Lactonas', 'Lactonas são:', ['ésteres cíclicos', 'amidas cíclicas', 'éteres cíclicos', 'anidridos'], 'Definição.'),
  T('Lactonas', 'Ácido 4-hidroxibutanoico + H⁺ →', ['γ-butirolactona', 'β-lactona', 'δ-lactona', 'lactama'], 'Anel de 5.', fg('hidroxibutanoico')),
  T('Amidas', 'Na amida, a ligação C–N tem:', ['caráter parcial de dupla (rotação restrita)', 'caráter de tripla', 'livre rotação', 'carga +1 inteira no C'], 'Ressonância.'),
  T('Amidas', 'Ácido + amina em condições brandas:', ['formam sal (ácido-base)', 'formam amida', 'formam nitrila', 'não reagem'], 'Ácido-base.'),
  T('Amidas', 'Agentes como DCC/EDC servem para:', ['ativar o ácido carboxílico', 'reduzir a amida', 'oxidar a amina', 'hidrolisar ésteres'], 'Acoplamento.'),
  T('Amidas', 'Aminólise de éster:', ['éster + amina → amida + álcool (lenta)', 'amida + álcool → éster', 'éster + água → ácido', 'impossível'], 'Desce a escada.'),
  T('Amidas', 'Na hidrólise ácida da amida, o N é protonado para:', ['sair como amina/NH₃ neutra', 'aumentar a nucleofilicidade', 'formar nitrila', 'formar imina'], 'Grupo de saída.'),
  T('Amidas', 'Hidrólise de amidas exige normalmente:', ['ácido ou base concentrados e aquecimento', 'apenas água fria', 'luz', 'catalisador metálico'], 'Pouco reativas.'),
  T('Lactamas', 'Lactamas são:', ['amidas cíclicas', 'ésteres cíclicos', 'aminas cíclicas', 'iminas'], 'Definição.'),
  T('Lactamas', 'β-lactamas são mais reativas por:', ['tensão e ressonância reduzida', 'serem aromáticas', 'terem Cl', 'não terem N'], 'Anel de 4.'),
  T('Nitrilas', 'O C nitrílico é:', ['sp, linear', 'sp², trigonal', 'sp³', 'sp³d'], '180°.'),
  T('Nitrilas', 'RCONH₂ + P₂O₅ (ou SOCl₂) →', ['RC≡N', 'RCOOH', 'RCH₂NH₂', 'RCOCl'], 'Desidratação.'),
  T('Nitrilas', 'Hidrólise de nitrila em H₃O⁺, calor:', ['ácido + NH₄⁺ (via amida)', 'amina', 'aldeído', 'álcool'], 'Sequência.'),
  T('Nitrilas', 'Nitrila em NaOH(aq), calor:', ['carboxilato + NH₃', 'ácido + NH₄⁺', 'amina', 'éster'], 'Meio básico.'),
  T('Nitrilas', 'R–X → R–CN → R–COOH serve para:', ['acrescentar um carbono à cadeia', 'remover um carbono', 'formar éter', 'formar alceno'], 'Equivalente de ácido.'),
  T('Descarboxilação', 'Descarboxila facilmente ao aquecer:', ['β-cetoácido', 'ácido benzoico', 'ácido acético', 'ácido butanoico'], 'Ciclo de 6.'),
  T('Descarboxilação', 'O ET da descarboxilação de β-cetoácido é:', ['cíclico de 6 membros', 'linear', 'de 4 membros', 'radicalar'], 'Concertado.'),
  T('Descarboxilação', 'Produto imediato antes da tautomerização:', ['enol', 'aldeído', 'alcano', 'éster'], 'Enol → cetona.'),
  T('Síntese', 'Ácido → éster com alto rendimento sem equilíbrio:', ['SOCl₂; depois ROH/piridina', 'ROH a t.a.', 'NaOH; ROH', 'H₂O'], 'Via cloreto.'),
  T('Síntese', 'Amida → cloreto de acila:', ['H₃O⁺/calor; depois SOCl₂', 'HCl direto', 'NaCl', 'Cl₂'], 'Subir exige ativação.'),
  T('Síntese', 'Ácido → nitrila:', ['SOCl₂; NH₃; SOCl₂ (desidratação)', 'NH₃ direto', 'NaCN', 'H₂O'], 'Três etapas.'),
];
const genQ = () => { const d = rnd(['cloreto', 'anidrido', 'ester', 'amida', 'acido']); const ks = Object.keys(MATRIX[d]); const n = rnd(ks); const r = MATRIX[d][n]; const lab = { 'fácil': 'favorável e rápida', moderada: 'favorável', 'catálise': 'requer catálise (equilíbrio)', lenta: 'possível, porém lenta', 'ácido-base': 'reação ácido-base', 'não': 'não ocorre' }; const right = lab[r.ok]; const opts = [right, ...shuffle(Object.values(lab).filter((x) => x !== right)).slice(0, 3)]; return { q: `${nm(SUBS[d])} + ${NUCS[n]}: o que acontece?`, o: opts, a: 0, e: r.why.replace(/<[^>]+>/g, ''), fig: fg(SUBS[d]) }; };
BANK.push(...Array.from({ length: 10 }, () => ['Reatividade (simulador)', genQ]));
export const TOPIC_SECTION = { Acidez: 'acidez', Estrutura: 'estrutura', Reatividade: 'reatividade', 'Reatividade (simulador)': 'simreat', Mecanismo: 'snac', Cloretos: 'cloretos', Anidridos: 'anidridos', Ésteres: 'fischer', Lactonas: 'lactonas', Amidas: 'amidas', Lactamas: 'lactamas', Nitrilas: 'nitrilas', Descarboxilação: 'descarboxilacao', Síntese: 'simsintese' };
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
const RANK = { cloreto: 4, anidrido: 3, ester: 2, acido: 2, amida: 1 };
const WHO = [['Cl e OCH₃', 'Cl⁻', ['CH₃O⁻', 'O²⁻']], ['OCOCH₃ e NH₂', 'CH₃COO⁻', ['H₂N⁻', 'O²⁻']], ['Cl e NHCH₃', 'Cl⁻', ['CH₃NH⁻', 'CH₃⁻']], ['OEt e OH (base)', 'EtO⁻ (seguido de ácido-base)', ['O²⁻', 'CH₃⁻']], ['OH₂⁺ e OCH₃ (ácido)', 'H₂O', ['CH₃O⁻', 'HO⁻']], ['NH₃⁺ e OH (ácido)', 'NH₃', ['HO⁻', 'H₂N⁻']]];
const REAG = [['RCOOH → RCOCl', 'SOCl₂', ['NaCl', 'HCl(aq)', 'NaOH']], ['RCONH₂ → RC≡N', 'P₂O₅ (ou SOCl₂)', ['NaOH', 'H₂O', 'CH₃OH']], ['RCOOR′ → RCOO⁻', 'NaOH(aq)', ['SOCl₂', 'NH₃ a frio', 'HCl gás']], ['RCOOH → RCOOCH₃', 'CH₃OH, H⁺', ['CH₃OH, NaOH', 'CH₃Cl', 'NaOCH₃']], ['RCOCl → (RCO)₂O', 'RCOO⁻', ['H₂O', 'NH₃', 'RCOOR']], ['RC≡N → RCOOH', 'H₃O⁺, calor', ['NaBH₄', 'SOCl₂', 'NH₃']], ['β-cetoácido → cetona', 'calor (− CO₂)', ['NaOH', 'SOCl₂', 'NH₃']]];
export function challenge(host) {
  const st = { pts: 0, streak: 0, best: 0, n: 0, ok: 0, timer: null, t0: 0, done: false, mode: 'fast' };
  const TIME = 15000;
  const stats = h('div', { class: 'ch-stats' }), bar = h('span', { style: 'width:100%' }), card = h('div', { class: 'ch-card' });
  const MODES = [['fast', 'Qual reage mais rápido?'], ['who', 'Quem sai?'], ['prod', 'Qual produto?'], ['reag', 'Qual reagente?'], ['poss', 'Substituição possível ou não?']];
  const modes = h('div', { class: 'controls', style: 'justify-content:center' }, ...MODES.map(([k, t]) => h('button', { class: 'btn sm', type: 'button', 'aria-pressed': k === st.mode ? 'true' : 'false', onclick: (e) => { st.mode = k; [...modes.children].forEach((b) => b.setAttribute('aria-pressed', b === e.currentTarget ? 'true' : 'false')); st.streak = 0; next(); } }, t)));
  host.append(h('div', { class: 'challenge' }, modes, stats, h('div', { class: 'timer' }, bar), card));
  const drawStats = () => { stats.innerHTML = ''; [['pontos', st.pts], ['sequência', st.streak], ['recorde', st.best], ['acertos', `${st.ok}/${st.n}`]].forEach(([k, v]) => stats.append(h('div', null, h('b', null, String(v)), h('small', null, k)))); };
  function intro() { card.innerHTML = ''; card.append(h('h3', { style: 'margin-top:0' }, 'Modo desafio'), h('p', null, 'Escolha um modo e responda em até 15 s. Acertos rápidos valem mais; sequências multiplicam os pontos.'), h('button', { class: 'btn accent lg', type: 'button', onclick: next }, '▶ Começar')); drawStats(); }
  function build() {
    if (st.mode === 'fast') { let a, b; do { a = rnd(['cloreto', 'anidrido', 'ester', 'amida']); b = rnd(['cloreto', 'anidrido', 'ester', 'amida']); } while (a === b); const n = rnd(['H₂O', 'CH₃OH', 'NH₃']); const win = RANK[a] > RANK[b] ? a : b; return { kind: 'Qual reage mais rápido?', q: `Com ${n}:`, o: [a, b].map((x) => ({ v: x, node: skx(SUBS[x], { scale: 20, fs: 11 }) })), a: win, e: `${nm(SUBS[win])} está mais alto na escada (melhor grupo de saída / menos doação por ressonância).` }; }
    if (st.mode === 'who') { const [g, a, w] = rnd(WHO); return { kind: 'Quem sai?', q: `Tetraédrico com ${g}: qual grupo sai?`, o: shuffle([a, ...w]).map((x) => ({ v: x, t: x })), a, e: 'Sai a base mais fraca (melhor grupo de saída).' }; }
    if (st.mode === 'prod') { const d = rnd(['cloreto', 'anidrido', 'ester', 'acido']); const ks = Object.keys(MATRIX[d]).filter((k) => MATRIX[d][k].prods.length); const n = rnd(ks); const p = MATRIX[d][n].prods[0]; const others = shuffle(['acidoAcetico', 'acetatoMetila', 'acetamida', 'nMetilacetamida', 'acetato', 'anidridoAcetico', 'acetonitrila'].filter((x) => x !== p)).slice(0, 3); return { kind: 'Qual produto?', fig: skx(SUBS[d], { scale: 24, fs: 12 }), q: `${nm(SUBS[d])} + ${NUCS[n]}`, o: shuffle([p, ...others]).map((x) => ({ v: x, node: skx(x, { scale: 18, fs: 10 }) })), a: p, e: MATRIX[d][n].why.replace(/<[^>]+>/g, '') }; }
    if (st.mode === 'reag') { const [t, a, w] = rnd(REAG); return { kind: 'Qual reagente?', q: t, o: shuffle([a, ...w]).map((x) => ({ v: x, t: x })), a, e: `${t}: ${a}.` }; }
    const d = rnd(['cloreto', 'anidrido', 'ester', 'amida', 'acido']), n = rnd(Object.keys(MATRIX[d])), r = MATRIX[d][n]; const yes = ['fácil', 'moderada', 'lenta', 'catálise'].includes(r.ok);
    return { kind: 'Substituição possível ou não?', fig: skx(SUBS[d], { scale: 24, fs: 12 }), q: `${nm(SUBS[d])} + ${NUCS[n]}`, o: ['possível', 'não'].map((x) => ({ v: x, t: x })), a: yes ? 'possível' : 'não', e: r.why.replace(/<[^>]+>/g, '') };
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
void DERIV;
