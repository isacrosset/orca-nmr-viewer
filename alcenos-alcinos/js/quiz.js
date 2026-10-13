/*
 * quiz.js — quiz final (30 questões sorteadas) e desafio "Qual é o produto?".
 */
import { mol } from './chem2d.js';
import { M } from './struct.js';
import { h, shuffle, drawKeys } from './widgets2d.js';
import { SUBS, REAG, PR } from './rxn.js';

const BANK = [
  ['Estrutura', 'Os carbonos de uma C=C são:', ['sp³', 'sp²', 'sp', 'sp³d'], 1, 'Três domínios σ: trigonais planos.'],
  ['Estrutura', 'A ligação π resulta da sobreposição:', ['frontal de orbitais sp²', 'lateral de orbitais p paralelos', 'de orbitais s', 'de orbitais sp³'], 1, 'Densidade acima e abaixo do plano σ.'],
  ['Estrutura', 'Por que não há rotação livre em torno da C=C?', ['a ligação σ é muito forte', 'girar desalinha os orbitais p e rompe a π', 'os H se repelem', 'há uma ligação de hidrogênio'], 1, 'A 90° a sobreposição p–p é zero.'],
  ['Estrutura', 'No etino, o ângulo H–C≡C vale:', ['109,5°', '120°', '180°', '90°'], 2, 'Carbonos sp, lineares.'],
  ['Estrutura', 'As duas ligações π de um alcino são:', ['paralelas', 'perpendiculares entre si', 'coplanares com a σ', 'idênticas à σ'], 1, 'Formadas por pares p perpendiculares.'],
  ['Nomenclatura', 'Nome de CH₂=C(CH₃)CH₂CH₃:', ['2-metilbut-1-eno', '3-metilbut-3-eno', '2-etilprop-1-eno', 'pent-1-eno'], 0, 'Cadeia de 4 C com a dupla em C1; metila em C2.'],
  ['Nomenclatura', 'Nome de CH₃C≡CCH₂CH₃:', ['pent-3-ino', 'pent-2-ino', 'but-2-ino', 'pentino'], 1, 'Menor localizador para a tripla.'],
  ['Nomenclatura', 'Em cicloalcenos, os carbonos da dupla recebem os números:', ['1 e 2', '1 e 3', 'quaisquer', '2 e 3'], 0, 'E não é preciso indicar o "1".'],
  ['Isomeria', 'cis/trans pode ser usado quando:', ['há um grupo em comum nos dois C da dupla (ex.: H/H ou CH₃/CH₃)', 'sempre', 'nunca', 'só em alcinos'], 0, 'Caso contrário, use E/Z.'],
  ['Isomeria', 'Nas regras CIP, a prioridade é decidida primeiro por:', ['massa do grupo inteiro', 'número atômico do átomo ligado diretamente', 'número de H', 'tamanho do grupo'], 1, 'Depois, primeiro ponto de diferença.'],
  ['Isomeria', 'Alcinos apresentam isomeria E/Z na tripla?', ['sim', 'não, os carbonos sp são lineares', 'só os internos', 'só os terminais'], 1, 'Não há "lados".'],
  ['Estabilidade', 'Qual é o alceno mais estável?', ['but-1-eno', '(Z)-but-2-eno', '(E)-but-2-eno', '2,3-dimetilbut-2-eno'], 3, 'Tetrassubstituído.'],
  ['Estabilidade', 'Menor calor de hidrogenação indica:', ['alceno menos estável', 'alceno mais estável', 'reação mais rápida', 'mais ligações π'], 1, 'Menos energia a "liberar".'],
  ['Estabilidade', 'A principal explicação para a estabilização por grupos alquila é:', ['ligação de hidrogênio', 'hiperconjugação', 'ressonância com Br', 'efeito estérico favorável'], 1, 'σ C–H/C–C doando para o sistema π.'],
  ['Reatividade', 'Alcenos reagem principalmente com:', ['nucleófilos', 'eletrófilos', 'radicais apenas', 'nada'], 1, 'A π é uma fonte de elétrons exposta.'],
  ['Markovnikov', 'Na adição de HBr ao propeno, o H entra:', ['no CH₂ terminal', 'no CH central', 'no CH₃', 'em qualquer carbono'], 0, 'Gera o cátion 2°.'],
  ['Markovnikov', 'A regra de Markovnikov é consequência:', ['da estabilidade relativa dos intermediários/ET', 'do tamanho do haleto', 'do solvente', 'de nada: é empírica'], 0, 'Não é regra independente do mecanismo.'],
  ['Rearranjo', 'Rearranjos são esperados em:', ['HBr e H₃O⁺', 'Br₂ e BH₃', 'OsO₄', 'H₂/Pd'], 0, 'Só há carbocátion livre nesses casos.'],
  ['Rearranjo', 'Na migração 1,2 de hidreto, o H migra:', ['como H⁺', 'com seu par de elétrons (H⁻)', 'como radical', 'para o solvente'], 1, 'Gera um cátion mais estável.'],
  ['Halogenação', 'O intermediário da bromação de alcenos é:', ['carbocátion livre', 'íon bromônio', 'radical', 'carbânion'], 1, 'Explica a adição anti.'],
  ['Halogenação', 'A bromação do ciclo-hexeno dá:', ['cis-1,2-dibromociclo-hexano', 'trans-1,2-dibromociclo-hexano', 'bromociclo-hexano', 'ciclo-hexanol'], 1, 'Anti.'],
  ['Halogenação', 'Na formação de haloidrinas (Br₂/H₂O), o OH vai para:', ['o C menos substituído', 'o C mais substituído', 'qualquer C', 'o Br'], 1, 'Maior δ+ no bromônio assimétrico.'],
  ['Hidratação', 'Oximercuração-desmercuração é:', ['anti-Markovnikov', 'Markovnikov sem rearranjo', 'Markovnikov com rearranjo', 'syn'], 1, 'Íon mercurínio.'],
  ['Hidratação', 'Hidroboração-oxidação é:', ['Markovnikov, anti', 'anti-Markovnikov, syn', 'Markovnikov, syn', 'anti-Markovnikov, anti'], 1, 'Concertada.'],
  ['Hidratação', 'Na oxidação da organoborana com H₂O₂/OH⁻, o OH:', ['entra com inversão', 'ocupa a posição do B com retenção', 'vai para o outro carbono', 'forma um epóxido'], 1, 'Retenção de configuração.'],
  ['Oxidação', 'mCPBA converte alcenos em:', ['dióis', 'epóxidos', 'cetonas', 'alcanos'], 1, 'Transferência concertada de O.'],
  ['Oxidação', 'OsO₄ dá dióis:', ['anti', 'syn', 'geminais', 'sem estereoquímica definida'], 1, 'Éster ósmico cíclico.'],
  ['Oxidação', 'A ozonólise redutiva do (E)-but-2-eno dá:', ['2 etanal', 'propanona + metanal', '2 ácido acético', 'butanona'], 0, 'C=C → 2 C=O.'],
  ['Oxidação', 'KMnO₄ quente e ácido com alcenos promove:', ['di-hidroxilação syn', 'clivagem oxidativa', 'epoxidação', 'hidrogenação'], 1, 'Condições severas.'],
  ['Redução', 'Hidrogenação catalítica de alcenos é:', ['anti', 'syn', 'via carbocátion', 'via bromônio'], 1, 'Os H vêm da superfície metálica.'],
  ['Redução', 'Alcino + H₂ em excesso / Pd dá:', ['alceno cis', 'alceno trans', 'alcano', 'cetona'], 2, 'As duas π são reduzidas.'],
  ['Redução', 'O catalisador de Lindlar produz:', ['alceno trans', 'alceno cis', 'alcano', 'álcool'], 1, 'Superfície envenenada: para no alceno; syn.'],
  ['Redução', 'Na/NH₃(l) converte alcinos internos em:', ['alcenos cis', 'alcenos trans', 'alcanos', 'acetiletos'], 1, 'Anti global (ânion vinílico trans).'],
  ['Alcinos', 'Hidratação de alcino terminal com HgSO₄/H₂SO₄ dá:', ['aldeído', 'metilcetona', 'álcool', 'ácido'], 1, 'Enol Markovnikov → cetona.'],
  ['Alcinos', 'Hidroboração-oxidação de alcino terminal dá:', ['aldeído', 'metilcetona', 'diol', 'alcano'], 0, 'Enol anti-Markovnikov → aldeído.'],
  ['Alcinos', 'Alcino terminal + 2 HBr dá:', ['di-haleto vicinal', 'di-haleto geminal', 'haleto vinílico', 'tetra-haleto'], 1, 'Markovnikov duas vezes no mesmo C.'],
  ['Alcinos', 'Alcino + Br₂ em excesso dá:', ['di-haloalceno', 'tetra-haloalcano', 'haleto vinílico', 'cetona'], 1, 'Duas adições.'],
  ['Acidez', 'pKa aproximado do etino:', ['50', '44', '25', '15,7'], 2, 'Maior caráter s.'],
  ['Acidez', 'Qual base desprotona o propino?', ['NaOH', 'NaNH₂', 'H₂O', 'NaHCO₃'], 1, 'NH₃ (pKa 38) é ácido mais fraco que o alcino.'],
  ['Acidez', 'Alcinos terminais são mais ácidos porque o carbono sp:', ['tem mais caráter s e estabiliza melhor o par do ânion', 'é maior', 'tem mais H', 'é menos eletronegativo'], 0, '50% s.'],
  ['Acetiletos', 'Acetiletos reagem bem por SN2 com:', ['haletos terciários', 'haletos metílicos e primários', 'haletos de arila', 'alcenos'], 1, 'Com 2°/3° predomina E2.'],
  ['Tautomeria', 'Enol e cetona são:', ['estruturas de ressonância', 'tautômeros (isômeros em equilíbrio)', 'enantiômeros', 'idênticos'], 1, 'Diferem na posição de H e da π.'],
  ['Tautomeria', 'Em geral, o equilíbrio ceto-enólico favorece:', ['o enol', 'a forma ceto', 'igualmente', 'o carbocátion'], 1, 'C=O é mais forte que C=C.'],
  ['Mecanismo', 'Intermediário × estado de transição:', ['iguais', 'intermediário é mínimo local; ET é máximo', 'ET é isolável', 'intermediário nunca existe'], 1, 'Diferença fundamental.'],
  ['Mecanismo', 'A hidroboração tem:', ['carbocátion', 'um ET de 4 centros (concertada)', 'radical', 'bromônio'], 1, 'Por isso não rearranja.'],
  ['Polímeros', 'Polipropileno é formado a partir de:', ['eteno', 'propeno', 'estireno', 'propino'], 1, 'Polimerização de adição.'],
];
export const TOPIC_SECTION = {
  Estrutura: 'estrutura-alcenos', Nomenclatura: 'nomenclatura-alcenos', Isomeria: 'estabilidade', Estabilidade: 'estabilidade', Reatividade: 'reatividade', Markovnikov: 'hidrohalogenacao', Rearranjo: 'rearranjos',
  Halogenação: 'halogenacao', Hidratação: 'hidratacoes', Oxidação: 'epoxidacao', Redução: 'hidrogenacao', Alcinos: 'reacoes-alcinos', Acidez: 'acidez', Acetiletos: 'acetileto', Tautomeria: 'tautomeria', Mecanismo: 'reacoes-alcenos', Polímeros: 'polimeros',
};
export function classify(p) { return p < 50 ? 'Revise os fundamentos' : p < 70 ? 'Em desenvolvimento' : p < 85 ? 'Bom domínio' : 'Excelente domínio'; }

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
      topics.length ? h('div', null, h('p', null, h('b', null, 'Áreas com mais erros:')), h('ul', null, topics.map(([t, n]) => h('li', null, h('a', { href: '#' + (TOPIC_SECTION[t] || 'inicio'), onclick: (e) => { e.preventDefault(); nav(TOPIC_SECTION[t] || 'inicio'); } }, t), ` — ${n} erro(s)`)))) : h('p', null, 'Nenhum erro. Parabéns!'),
      h('div', { class: 'ex-actions', style: 'justify-content:center' }, h('button', { class: 'btn primary', type: 'button', onclick: start }, '↺ Novo quiz'), h('button', { class: 'btn', type: 'button', onclick: () => nav('quiz', 'desafio') }, '⚡ Desafio "Qual é o produto?"'))));
  }
  start();
}

/* ===================================================================
 * Desafio "Qual é o produto?" (com tempo)
 * =================================================================== */
function pool() {
  const out = [];
  Object.entries(PR).forEach(([s, rs]) => Object.entries(rs).forEach(([r, p]) => { if (p.k && (SUBS[s].kind === 'alcino' || !['HBr2', 'Br2x', 'R2BH'].includes(r))) out.push({ s, r, p }); }));
  return out;
}
export function challenge(host) {
  const st = { pts: 0, streak: 0, best: 0, n: 0, ok: 0, timer: null, t0: 0, done: false };
  const TIME = 15000;
  const stats = h('div', { class: 'ch-stats' }), bar = h('span', { style: 'width:100%' }), card = h('div', { class: 'ch-card' });
  host.append(h('div', { class: 'challenge' }, stats, h('div', { class: 'timer' }, bar), card));
  const all = pool();
  const drawStats = () => { stats.innerHTML = ''; [['pontos', st.pts], ['sequência', st.streak], ['melhor sequência', st.best], ['acertos', `${st.ok}/${st.n}`]].forEach(([k, v]) => stats.append(h('div', null, h('b', null, String(v)), h('small', null, k)))); };
  function intro() {
    card.innerHTML = '';
    card.append(h('h3', { style: 'margin-top:0' }, 'Qual é o produto?'), h('p', null, `Uma reação aparece; escolha o produto principal em até ${TIME / 1000} s. Quanto mais rápido, mais pontos; acertos seguidos multiplicam a pontuação.`), h('button', { class: 'btn accent lg', type: 'button', onclick: next }, '⚡ Começar'));
    drawStats();
  }
  function next() {
    clearInterval(st.timer);
    const c = all[Math.floor(Math.random() * all.length)];
    const others = shuffle(Object.values(PR[c.s]).filter((p) => p.k && p.n !== c.p.n && JSON.stringify(p.k) !== JSON.stringify(c.p.k)));
    const uniq = []; others.forEach((p) => { if (!uniq.some((u) => u.n === p.n)) uniq.push(p); });
    const opts = shuffle([c.p].concat(uniq.slice(0, 3)));
    st.done = false;
    card.innerHTML = '';
    const fb = h('div', { 'aria-live': 'assertive' });
    const ans = h('div', { class: 'mcq cols' }, opts.map((p, i) => h('button', { class: 'mopt struct', type: 'button', onclick: () => answer(p, c, opts, ans, fb) }, h('span', { class: 'l' }, 'abcd'[i]), drawKeys(p.k, { w: 140, scale: 27, fs: 13 }))));
    card.append(h('div', { class: 'rxline' }, h('div', { style: 'width:170px' }, mol(M[c.s](), { scale: 34 })), h('span', { class: 'arrow' }, '⟶'), h('div', { class: 'cond', html: REAG[c.r].t }), h('span', { class: 'arrow' }, '⟶'), h('b', { style: 'font-size:1.6rem' }, '?')), ans, fb);
    st.t0 = performance.now();
    st.timer = setInterval(() => { const left = Math.max(0, 1 - (performance.now() - st.t0) / TIME); bar.style.width = left * 100 + '%'; if (left <= 0) answer(null, c, opts, ans, fb); }, 80);
  }
  function answer(p, c, opts, ans, fb) {
    if (st.done) return; st.done = true; clearInterval(st.timer);
    [...ans.children].forEach((b, i) => { b.disabled = true; b.classList.toggle('right', opts[i] === c.p); if (opts[i] === p && p !== c.p) b.classList.add('wrong'); });
    const ok = p === c.p; st.n++;
    if (ok) { st.ok++; st.streak++; st.best = Math.max(st.best, st.streak); const left = Math.max(0, 1 - (performance.now() - st.t0) / TIME); st.pts += Math.round((10 + 10 * left) * (1 + Math.min(st.streak - 1, 4) * 0.25)); } else st.streak = 0;
    const r = REAG[c.r];
    fb.innerHTML = `<div class="fb ${ok ? 'ok' : 'bad'}">${p === null ? '⏱ Tempo esgotado. ' : ok ? '✔ Correto! ' : '✘ Não. '}<b>${c.p.n}</b>. ${c.p.x || ''}<br><small>${r.tr} · ${r.regio} · ${r.stereo} · intermediário: ${r.inter}</small></div>`;
    fb.append(h('div', { class: 'ex-actions', style: 'justify-content:center' }, h('button', { class: 'btn primary', type: 'button', onclick: next }, 'Próxima →')));
    drawStats();
  }
  intro();
  return { stop() { clearInterval(st.timer); } };
}
