/*
 * exdata.js — exercícios resolvidos (13 níveis) e propostos (fácil,
 * intermediário, avançado). Nomes, cadeias, numeração e substituintes
 * das resoluções são gerados pelo motor (explain), a partir do SMILES.
 */
import { h, shuffle } from './widgets2d.js';
import { M, ALL, REAL } from './lib.js';
import { FG_INFO, FUNCTIONS } from './chem.js';
import { STEM, PRIO_NAME, rankParents, whyBetter } from './namer.js';
import { draw, explain, nameHTML, funcList, rnd } from './core.js';
import { distractors } from './tools.js';
import { fnOf, classify } from './modules.js';

const F = (s, o = {}) => ({ node: () => h('div', { class: 'figs' }, draw(s, Object.assign({ scale: 40 }, o))) });
const FS = (s, cap) => ({ node: () => h('div', { class: 'figs' }, h('figure', { class: 'fig' }, draw(s, { color: 'roles', num: true, scale: 40 }), h('figcaption', { html: cap || nameHTML(M(s)) }))) });
const FG = (s) => ({ node: () => h('div', { class: 'figs' }, draw(s, { color: 'fg', scale: 40 })) });

/* resolvido de nomenclatura (passos do motor) */
const nameSolved = (level, title, s, think, hint) => ({ level, title, q: 'Dê o nome IUPAC do composto:', fig: F(s), think: think || 'Qual é a função principal? Onde está a cadeia principal?', hint: hint || 'Siga a ordem: função principal → cadeia → numeração → substituintes → nome.', steps: explain(M(s)), solFig: FS(s), answer: nameHTML(M(s)) });

export const SOLVED = [
  /* 1 Leitura */
  { level: 'Leitura de estruturas', title: 'Carbonos e hidrogênios implícitos', q: 'Quantos carbonos e quantos hidrogênios há na estrutura? Escreva a fórmula molecular.', fig: F('CC(C)CCO'), think: 'Cada vértice/extremidade é um C; complete cada C até 4 ligações com H.', hint: 'Conte os H por carbono: extremidades CH₃, vértices com 2 ligações CH₂, com 3 ligações CH.', steps: ['5 carbonos: 2 CH₃, 2 CH₂ e 1 CH.', 'H dos carbonos: 2×3 + 2×2 + 1 = 11; mais 1 H do OH = 12.', 'Fórmula: C₅H₁₂O.', 'Condensada: ' + M('CC(C)CCO').cond + '.'], solFig: { node: () => h('div', { class: 'figs' }, draw('CC(C)CCO', { full: true, scale: 34, fs: 15 })) }, answer: 'C₅H₁₂O — ' + nameHTML(M('CC(C)CCO')) },
  { level: 'Leitura de estruturas', title: 'Da condensada à esquelética', q: 'Converta CH₃CH(CH₃)CH₂COOH em estrutura esquelética.', think: 'Cada grupo entre parênteses é um ramo do carbono anterior.', hint: 'CH(CH₃) indica um ramo metila no 2º carbono.', steps: ['Cadeia: CH₃–CH–CH₂–COOH (4 C em linha).', 'O (CH₃) é um ramo ligado ao CH.', 'COOH: carbono com =O e –OH na ponta.', 'Desenhe em zigue-zague; cada vértice é um C.'], solFig: FS('CC(C)CC(=O)O'), answer: nameHTML(M('CC(C)CC(=O)O')) },
  { level: 'Leitura de estruturas', title: 'Mesma molécula?', q: 'As estruturas abaixo representam a mesma substância?', fig: { node: () => h('div', { class: 'figs' }, draw('CCC(C)CC', { scale: 36 }), draw('CC(CC)CC', { scale: 36 })) }, think: 'Ignore a orientação do desenho; compare a conectividade.', hint: 'Encontre a maior cadeia em cada uma e veja onde está o ramo.', steps: ['Em ambas, a cadeia mais longa tem 5 C.', 'O metila está no C3 nas duas.', 'Mesma conectividade → mesma substância, desenhada de formas diferentes.'], solFig: FS('CCC(C)CC'), answer: 'Sim: ambas são ' + nameHTML(M('CCC(C)CC')) },
  /* 2 Reconhecimento */
  { level: 'Reconhecimento de funções', title: 'Paracetamol', q: 'Identifique as funções orgânicas do paracetamol.', fig: F(REAL[1].s), think: 'Procure heteroátomos e carbonilas.', hint: 'Um N ligado a C=O é amida; OH no anel é fenol.', steps: ['OH ligado ao anel aromático → <b>fenol</b>.', 'N–C(=O) → <b>amida</b> (N-substituída).', 'Anel benzênico → núcleo aromático.'], solFig: FG(REAL[1].s), answer: 'fenol e amida (aromático)' },
  { level: 'Reconhecimento de funções', title: 'Vanilina', q: 'Quais funções há na vanilina?', fig: F(REAL[0].s), think: 'Três grupos oxigenados diferentes.', hint: 'O entre dois C = éter; CHO = aldeído.', steps: ['CHO no anel → <b>aldeído</b>.', 'OCH₃ → <b>éter</b> (metoxi).', 'OH no anel → <b>fenol</b>.', 'Nome sistemático: ' + nameHTML(M(REAL[0].s)) + ' (aldeído é a função principal).'], solFig: FG(REAL[0].s), answer: 'aldeído, éter e fenol' },
  { level: 'Reconhecimento de funções', title: 'Ácido lático', q: 'Identifique as funções e a função principal do ácido lático.', fig: F('CC(O)C(=O)O'), think: 'Há dois grupos com oxigênio.', hint: 'Compare as prioridades.', steps: ['–COOH → ácido carboxílico.', 'OH em C sp³ → álcool.', 'Ácido > álcool: sufixo “-oico”, OH como “hidroxi”.', 'Nome: ' + nameHTML(M('CC(O)C(=O)O')) + '.'], solFig: FS('CC(O)C(=O)O'), answer: nameHTML(M('CC(O)C(=O)O')) },
  /* 3 Cadeia principal */
  nameSolved('Cadeia principal', 'A maior cadeia "escondida"', 'CCC(CC)CC(C)C', 'A cadeia mais longa nem sempre está desenhada na horizontal.', 'Teste caminhos que passam pelo ramo etila.'),
  nameSolved('Cadeia principal', 'Cadeia com o grupo principal', 'OCC(CCC)CCCC', 'Existe uma cadeia de 8 C — mas ela contém o C–OH?', 'A cadeia principal deve conter o carbono ligado ao OH.'),
  nameSolved('Cadeia principal', 'Cetona no ramo', 'CCCC(CC(C)=O)CCC', 'Onde está o C=O?', 'A cadeia precisa incluir o carbono da carbonila.'),
  /* 4 Numeração */
  { level: 'Numeração', title: 'Primeiro ponto de diferença', q: 'Numere e dê o nome. Compare os dois sentidos.', fig: F('CC(C)CCCCC(C)C(C)CC'), think: 'Escreva o conjunto de localizadores nos dois sentidos.', hint: 'Não some os localizadores: compare termo a termo.', steps: ['Cadeia principal: 10 C (dec).', 'Sentido 1: {2,7,8}. Sentido 2: {3,4,9}.', 'Primeiro termo: 2 &lt; 3 → vence {2,7,8}, mesmo com soma maior (17 × 16).', 'Nome: ' + nameHTML(M('CC(C)CCCCC(C)C(C)CC')) + '.'], solFig: FS('CC(C)CCCCC(C)C(C)CC'), answer: nameHTML(M('CC(C)CCCCC(C)C(C)CC')) },
  nameSolved('Numeração', 'Isoctano', 'CC(C)CC(C)(C)C', 'Três metilas: quais localizadores?', 'Compare {2,2,4} e {2,4,4}.'),
  nameSolved('Numeração', 'Grupo principal manda', 'CC(O)CC(C)C', 'O OH ou o metil decide a numeração?', 'O grupo principal recebe o menor número antes dos substituintes.'),
  /* 5 Substituintes */
  nameSolved('Substituintes', 'Etil e dimetil', 'CCC(C)C(CC)CC(C)C', 'Quantos substituintes e de que tipo?', 'Agrupe os iguais com “di” e ordene: etil antes de metil.'),
  nameSolved('Substituintes', 'Substituinte ramificado', 'CCCC(C(C)C)CCC', 'O ramo de 3 C está ligado pelo carbono central?', 'Ligado pelo C do meio: propan-2-il (isopropil), entre parênteses.'),
  nameSolved('Substituintes', 'Halogênio e alquila', 'CC(Br)CCC(C)C', 'Halogênios são prefixos como os alquilas.', 'Ordem alfabética: bromo antes de metil.'),
  /* 6 Alcanos */
  nameSolved('Alcanos', 'Dois metilas no mesmo carbono', 'CC(C)(C)CC'),
  nameSolved('Alcanos', 'Simetria', 'CCC(CC)CC', 'Qualquer cadeia de 5 C serve?', 'Por simetria, o etil fica no C3 em qualquer caso.'),
  nameSolved('Alcanos', 'Trimetil-heptano', 'CC(CC)C(C)CC(C)C'),
  /* 7 Alcenos e alcinos */
  nameSolved('Alcenos e alcinos', 'Alceno ramificado', 'C=CC(C)CC', 'A dupla está na ponta.', 'A dupla recebe o menor localizador.'),
  nameSolved('Alcenos e alcinos', 'Dieno', 'C=CC=CCC', 'Duas duplas: use “dieno” com dois localizadores.', 'Acrescenta-se “a” ao radical: hexa-1,3-dieno.'),
  nameSolved('Alcenos e alcinos', 'Alcino ramificado', 'CC#CC(C)C'),
  nameSolved('Alcenos e alcinos', 'Enino', 'C=CCC#C', 'Dupla e tripla na mesma cadeia.', 'Menores localizadores às ligações múltiplas em conjunto; em empate, a dupla vence. “en” vem antes de “in”.'),
  /* 8 Cíclicos e aromáticos */
  nameSolved('Cíclicos e aromáticos', 'Cicloalcano dissubstituído', 'CCC1CCCC(C)C1', 'Numere o anel pelos substituintes.', 'Conjunto {1,3}; em empate, o primeiro em ordem alfabética (etil) recebe 1.'),
  nameSolved('Cíclicos e aromáticos', 'Benzeno dissubstituído', 'Cc1ccc(Cl)cc1', 'Posição relativa 1,4 (para).', 'Ordem alfabética: cloro → C1.'),
  nameSolved('Cíclicos e aromáticos', 'Bromo e nitro', 'Brc1cccc([N+](=O)[O-])c1'),
  /* 9 Oxigenadas */
  nameSolved('Oxigenadas', 'Álcool ramificado', 'CC(O)C(C)CC', 'OH é a função principal.', 'Numere para dar o menor número ao C–OH.'),
  nameSolved('Oxigenadas', 'Aldeído', 'CC(C)CC=O', 'O CHO é C1.', 'Localizador do “-al” é omitido.'),
  nameSolved('Oxigenadas', 'Cetona', 'CCC(=O)CC(C)C'),
  nameSolved('Oxigenadas', 'Ácido carboxílico', 'CC(C)CC(=O)O', 'O C do COOH é C1.', 'Nome começa por “ácido”.'),
  nameSolved('Oxigenadas', 'Éster', 'CCC(=O)OCC', 'Separe a parte acila (com C=O) da parte alquila (no O).', '…oato de …ila.'),
  nameSolved('Oxigenadas', 'Éter', 'COC(C)C', 'O menor grupo vira “alcóxi”.', 'Metoxi + cadeia de 3 C.'),
  /* 10 Nitrogenadas */
  nameSolved('Nitrogenadas', 'Amina terciária', 'CCN(C)C', 'Escolha a maior cadeia ligada ao N.', 'Os outros grupos no N recebem o localizador “N”.'),
  nameSolved('Nitrogenadas', 'Amida N-substituída', 'CCC(=O)NCC'),
  nameSolved('Nitrogenadas', 'Nitrila', 'CC(C)CC#N', 'O C do C≡N conta na cadeia e é C1.', 'Sufixo “-nitrila” após “ano”: “anonitrila”.'),
  nameSolved('Nitrogenadas', 'Nitrocomposto', 'CC(C)[N+](=O)[O-]', 'Nitro é sempre prefixo.', 'Cadeia de 3 C.'),
  /* 11 Multifuncionais */
  nameSolved('Multifuncionais', 'Hidroxiácido', 'CC(O)CC(=O)O'),
  nameSolved('Multifuncionais', 'Hidroxicetona', 'CC(=O)CC(C)(C)O'),
  nameSolved('Multifuncionais', 'Aminoácido (serina)', 'NC(CO)C(=O)O', 'Três funções: ácido, álcool, amina.', 'Ácido → sufixo; amino- e hidroxi- → prefixos.'),
  /* 12 Nome → estrutura */
  { level: 'Nome → estrutura', title: '3-metilpentan-2-ol', q: 'Desenhe a estrutura de <b>3-metilpentan-2-ol</b>.', think: 'Comece pelo nome-base: pent = 5 C, “an” = só simples, “2-ol” = OH no C2.', hint: 'Desenhe 5 C, numere, coloque OH em C2 e CH₃ em C3.', steps: ['pent → 5 carbonos em cadeia.', 'an → todas as ligações simples.', '2-ol → OH no C2.', '3-metil → CH₃ no C3.', 'Complete os H.'], solFig: FS('CC(O)C(C)CC'), answer: M('CC(O)C(C)CC').formula },
  { level: 'Nome → estrutura', title: '4-hidroxipentan-2-ona', q: 'Desenhe <b>4-hidroxipentan-2-ona</b>.', think: '“ona” = cetona (principal); “hidroxi” = OH como prefixo.', hint: 'C=O no C2 e OH no C4 de uma cadeia de 5 C.', steps: ['pentan → 5 C saturados.', '2-ona → C=O no C2.', '4-hidroxi → OH no C4.'], solFig: FS('CC(O)CC(C)=O'), answer: M('CC(O)CC(C)=O').formula },
  { level: 'Nome → estrutura', title: 'Etanoato de propan-2-ila', q: 'Desenhe <b>etanoato de propan-2-ila</b>.', think: 'Éster: parte ácida (etanoato) + parte alquila (propan-2-ila).', hint: 'CH₃–C(=O)–O– ligado ao C central de um grupo de 3 C.', steps: ['etanoato → CH₃–C(=O)–O–.', 'propan-2-ila → –CH(CH₃)₂, ligado pelo C2.', 'Junte: CH₃COOCH(CH₃)₂.'], solFig: FS('CC(=O)OC(C)C'), answer: 'CH₃COOCH(CH₃)₂' },
  /* 13 Estrutura → nome */
  nameSolved('Estrutura → nome', 'Haleto ramificado', 'CC(Cl)CC(C)C'),
  nameSolved('Estrutura → nome', 'Alceno trissubstituído', 'CC=C(C)C'),
  nameSolved('Estrutura → nome', 'Amina secundária', 'CCNC'),
];

/* ===================================================================
 * Propostos
 * =================================================================== */
const ex = (o) => o;
const mcName = (title, s) => { const X = M(s); return ex({ title, type: 'mc', q: 'Qual é o nome IUPAC?', fig: F(s), o: [X.name, ...distractors(X, 3)], a: 0, e: explain(X).join('<br>') }); };
const mcStruct = (title, s) => { const X = M(s); const iso = shuffle(ALL.filter((x) => x !== s && M(x).formula === X.formula && M(x).name)).slice(0, 3); while (iso.length < 3) { const y = rnd(ALL); if (y !== s && !iso.includes(y) && M(y).name) iso.push(y); } return ex({ title, type: 'mc', struct: true, q: `Qual estrutura é <b>${X.name}</b>?`, o: [s, ...iso].map((y) => ({ svg: () => draw(y, { scale: 26, fs: 13 }) })), a: 0, e: explain(X).join('<br>') }); };
const FNS = ['alcano', 'alceno', 'alcino', 'aromático', 'haleto', 'álcool', 'fenol', 'éter', 'aldeído', 'cetona', 'ácido carboxílico', 'éster', 'amina', 'amida', 'nitrila', 'nitrocomposto'];
const mcFn = (s) => { const X = M(s), a = fnOf(X); return ex({ title: 'Reconheça a função', type: 'mc', q: 'A que função pertence o composto?', fig: F(s), o: [a, ...shuffle(FNS.filter((x) => x !== a)).slice(0, 3)], a: 0, e: `${a}. Nome: ${nameHTML(X)}.` }); };
const mcCount = (s) => { const X = M(s), n = X.m.atoms.filter((a) => a.el === 'C').length; return ex({ title: 'Leitura de estrutura', type: 'mc', q: 'Quantos carbonos há na molécula?', fig: F(s), o: [String(n), String(n - 1), String(n + 1), String(n + 2)], a: 0, e: `${n} C — fórmula ${X.formula}.` }); };
const mcLen = (s) => { const X = M(s), n = X.r.parent.P.length; return ex({ title: 'Cadeia principal', type: 'mc', q: 'Quantos carbonos tem a cadeia principal?', fig: F(s), o: [n, n + 1, n - 1, n + 2].map(String), a: 0, e: explain(X).slice(0, 3).join('<br>') }); };
const mcDir = (s) => {
  const X = M(s), all = rankParents(X.m), best = all[0], rev = all.find((e) => e.P.length === best.P.length && e.P.every((x, q) => x === best.P[best.P.length - 1 - q]));
  const loc = (e) => [e.pl.length ? 'função {' + e.pl + '}' : '', e.ml.length ? 'múltiplas {' + e.ml + '}' : '', e.sl.length ? 'subst. {' + e.sl + '}' : ''].filter(Boolean).join('; ');
  const w = whyBetter(best, rev);
  return ex({ title: 'Numeração', type: 'mc', q: 'Qual numeração da cadeia principal está correta?', fig: F(s, { color: 'chain' }), o: [loc(best), loc(rev)], a: 0, e: `A correta ${w ? w.txt : ''}. ${nameHTML(X)}.` });
};
const mcPrinc = (s) => { const X = M(s), types = [...new Set(X.fgs.map((f) => (f.type === 'fenol' ? 'alcool' : f.type)).filter((t) => PRIO_NAME[t]))]; return ex({ title: 'Função principal', type: 'mc', q: 'Qual função dá o sufixo do nome?', fig: FG(s), o: [PRIO_NAME[X.r.princType], ...types.filter((t) => t !== X.r.princType).map((t) => PRIO_NAME[t]), 'nenhuma: todas são prefixos'].slice(0, 4), a: 0, e: nameHTML(X) + '.' }); };
const mcWrong = (wrong, s, why) => { const X = M(s); return ex({ title: 'Nome incorreto', type: 'mc', q: `O nome <b>“${wrong}”</b> está incorreto. Qual é o nome correto da mesma estrutura?`, o: [X.name, wrong, ...distractors(X, 2).filter((d) => d !== wrong)].slice(0, 4), a: 0, e: why + ' Correto: ' + nameHTML(X) + '.' }); };
const mcMismatch = (name, s, ok) => { const X = M(s); return ex({ title: 'Nome e estrutura correspondem?', type: 'mc', q: `A estrutura abaixo corresponde a <b>${name}</b>?`, fig: F(s), o: ok ? ['sim', 'não'] : ['não', 'sim'], a: 0, e: `A estrutura é ${nameHTML(X)}.` }); };
const tf = (title, items, e) => ex({ title, type: 'tf', q: 'Marque V ou F:', items, e });
const cls4 = (s) => { const c = classify(M(s).m); return ex({ title: 'Classificação da cadeia', type: 'mc', q: 'Classifique a cadeia carbônica:', fig: F(s), o: [`${c.forma}, ${c.disp}, ${c.sat}, ${c.het}`, `${c.forma}, ${c.disp}, ${c.sat === 'saturada' ? 'insaturada' : 'saturada'}, ${c.het}`, `${c.forma}, ${c.disp === 'normal' ? 'ramificada' : 'normal'}, ${c.sat}, ${c.het}`, `${c.forma}, ${c.disp}, ${c.sat}, ${c.het === 'homogênea' ? 'heterogênea' : 'homogênea'}`], a: 0, e: 'Forma (aberta/fechada/mista), disposição (normal/ramificada), saturação (C–C) e heteroátomo entre carbonos.' }); };

export const PROPOSED = {
  easy: [
    mcFn('CCO'), mcFn('CC(=O)C'), mcFn('CCC(=O)O'), mcFn('CCN'), mcFn('CCOCC'),
    mcCount('CC(C)CC'), mcCount('CCC(CC)CO'), mcCount('Cc1ccccc1'),
    ex({ title: 'Grupo → função', type: 'dnd', q: 'Arraste o nome da função até o grupo funcional:', pairs: [['–OH (C sp³)', 'álcool'], ['–CHO', 'aldeído'], ['–COOH', 'ácido carboxílico'], ['–NH₂', 'amina'], ['–C≡N', 'nitrila'], ['–COO–', 'éster']], e: 'Grupos característicos das principais funções.' }),
    ex({ title: 'Nº de C → prefixo', type: 'dnd', q: 'Associe o número de carbonos ao prefixo:', pairs: [['1 C', 'met'], ['3 C', 'prop'], ['5 C', 'pent'], ['6 C', 'hex'], ['8 C', 'oct'], ['10 C', 'dec']], e: 'met, et, prop, but, pent, hex, hept, oct, non, dec.' }),
    mcName('Alcano', 'CCC(C)C'), mcName('Alcano', 'CCCCCC'), mcName('Álcool', 'CC(O)C'), mcName('Alceno', 'C=CCC'), mcName('Ácido', 'CCC(=O)O'),
    tf('Regras de escrita', [['Entre números usa-se vírgula: 2,3-dimetil.', 'V'], ['Entre número e letra usa-se ponto: 2.metil.', 'F'], ['“Dimetil” é ordenado pela letra “d”.', 'F']], 'Vírgula entre números; hífen entre número e letra; di/tri não contam na ordem alfabética.'),
    tf('Leitura de estruturas', [['Na esquelética, os H ligados a C ficam implícitos.', 'V'], ['O carbono faz 4 ligações.', 'V'], ['Os heteroátomos (O, N) também ficam implícitos.', 'F']], 'Heteroátomos são sempre escritos.'),
    tf('Funções', [['Fenol tem OH ligado ao anel aromático.', 'V'], ['Cetona tem C=O na ponta da cadeia.', 'F'], ['Éster tem o grupo –COO– entre dois carbonos.', 'V']], 'Aldeído: C=O na ponta; cetona: no meio.'),
    cls4('CC(C)CC'), cls4('CCOCC'),
    mcStruct('Nome → estrutura', 'CCCO'), mcStruct('Nome → estrutura', 'CC(C)C'), mcStruct('Nome → estrutura', 'CCC=O'),
    ex({ title: 'Substituintes', type: 'mc', q: 'O grupo –CH₂CH₃ chama-se:', o: ['etil', 'metil', 'propil', 'etano'], a: 0, e: '2 C ligado pela ponta: etil.' }),
    ex({ title: 'Substituintes', type: 'mc', q: 'O grupo –CH(CH₃)₂ chama-se:', o: ['propan-2-il (isopropil)', 'propil', 'terc-butil', 'isobutil'], a: 0, e: '3 C, ligado pelo C central.' }),
  ],
  mid: [
    mcName('Alceno', 'C=CC(C)CC'), mcName('Cetona', 'CCC(=O)CC(C)C'), mcName('Ácido', 'CC(C)CC(=O)O'), mcName('Amina', 'CCC(C)N'), mcName('Éster', 'CC(=O)OCC'), mcName('Haleto', 'CC(Br)CC(C)C'),
    mcLen('CCC(CC)CC(C)C'), mcLen('CC(C)C(CC)CCC'), mcLen('OCC(CC)CCC'), mcLen('C=CC(CC)CCC'),
    mcDir('CC(C)CC(C)C(C)C'), mcDir('CC(O)CC(C)C'), mcDir('C=CCC(C)C'), mcDir('CCC(C)CC(C)(C)C'),
    mcStruct('Nome → estrutura', 'CC(O)C(C)CC'), mcStruct('Nome → estrutura', 'CCC(=O)CC'), mcStruct('Nome → estrutura', 'CC(C)CC=O'),
    mcWrong('2-etilbutano', 'CCC(C)CC', 'O etil no C2 prolonga a cadeia principal.'), mcWrong('4-metilpentan-2-eno', 'CC=CC(C)C', 'Numeração: a dupla recebe o menor localizador.'), mcWrong('2-metilbutan-3-ol', 'CC(O)C(C)C', 'O OH (grupo principal) deve receber o menor localizador.'),
    ex({ title: 'Estrutura → sufixo', type: 'dnd', q: 'Arraste o sufixo correto até cada estrutura:', pairs: [[{ svg: () => draw('CCC=O', { scale: 26, fs: 13 }) }, '-al'], [{ svg: () => draw('CC(=O)CC', { scale: 26, fs: 13 }) }, '-ona'], [{ svg: () => draw('CCCO', { scale: 26, fs: 13 }) }, '-ol'], [{ svg: () => draw('CCC#N', { scale: 26, fs: 13 }) }, '-nitrila'], [{ svg: () => draw('CCC(N)=O', { scale: 26, fs: 13 }) }, '-amida']], e: 'Aldeído -al, cetona -ona, álcool -ol, nitrila -nitrila, amida -amida.' }),
    ex({ title: 'Substituinte → posição', type: 'dnd', q: 'No 3-etil-2,4-dimetil-hexano, arraste cada substituinte ao seu carbono:', fig: FS('CCC(C)C(CC)C(C)C'), pairs: [['C2', 'metil'], ['C3', 'etil'], ['C4', 'metil']], e: 'Localizadores 2,3,4.' }),
    ex({ title: 'Ordem alfabética', type: 'order', q: 'Ordene os prefixos como aparecem no nome:', items: [['m', 'metil'], ['cl', 'cloro'], ['e', 'etil'], ['b', 'bromo']].map(([id, label]) => ({ id, label })), correct: ['b', 'cl', 'e', 'm'], top: '1º', bottom: 'último', explain: 'bromo, cloro, etil, metil.', e: 'bromo, cloro, etil, metil.' }),
    ex({ title: 'Prioridade', type: 'order', q: 'Ordene da maior para a menor prioridade:', items: [['ol', 'álcool'], ['on', 'cetona'], ['oic', 'ácido carboxílico'], ['al', 'aldeído']].map(([id, label]) => ({ id, label })), correct: ['oic', 'al', 'on', 'ol'], top: 'maior', bottom: 'menor', explain: 'ácido > aldeído > cetona > álcool.', e: 'ácido > aldeído > cetona > álcool.' }),
    mcPrinc('CC(O)CC=O'), mcPrinc('NCCC(=O)O'), mcPrinc('CC(=O)CCCl'),
    tf('Cadeia principal', [['A cadeia principal sempre é a maior cadeia desenhada na horizontal.', 'F'], ['A cadeia principal deve conter o grupo principal.', 'V'], ['Em alcanos, entre cadeias de mesmo tamanho, escolhe-se a com mais substituintes.', 'V']], 'Critérios da IUPAC.'),
    tf('Numeração', [['Compara-se a soma dos localizadores.', 'F'], ['Vence o conjunto com o menor número no primeiro ponto de diferença.', 'V'], ['O grupo principal tem prioridade sobre os substituintes na numeração.', 'V']], '{2,7,8} vence {3,4,9}.'),
    tf('Nomes usuais × sistemáticos', [['“Acetona” é nome retido; o sistemático é propan-2-ona (propanona).', 'V'], ['“Tolueno” é o nome sistemático do metilbenzeno.', 'F'], ['“Ácido acético” = ácido etanoico.', 'V']], 'Use nomes sistemáticos nos exercícios.'),
  ],
  hard: [
    mcName('Multifuncional', 'CC(O)CC(=O)O'), mcName('Multifuncional', 'CC(=O)CC(C)(C)O'), mcName('Multifuncional', 'NCCC(=O)O'), mcName('Multifuncional', 'OCC(O)C=O'), mcName('Multifuncional', 'NCCC#N'), mcName('Multifuncional', 'COCC(Cl)C'),
    mcDir('CC(C)CCCCC(C)C(C)CC'), mcDir('CCC(C)C(CC)CC(C)C'), mcDir('CC(Cl)CC(C)CC'),
    mcMismatch('2-metilbutan-2-ol', 'CCC(C)(C)O', true), mcMismatch('pent-1-en-4-ino', 'C=CCC#C', true), mcMismatch('3-metilpentanal', 'CC(C)CCC=O', false),
    mcWrong('2-metil-3-etilpentano', 'CC(C)C(CC)CC', 'Ordem alfabética: etil antes de metil.'), mcWrong('1,2-dimetilpropan-1-ol', 'CC(C)C(C)O', 'Metil no C1 prolonga a cadeia principal.'), mcWrong('1-hidroxibutan-3-ona', 'CC(=O)CCO', 'A cetona é a função principal: ela recebe o menor localizador.'),
    mcStruct('Nome → estrutura', 'CC(O)CC(C)=O'), mcStruct('Nome → estrutura', 'CC(N)C(=O)O'), mcStruct('Nome → estrutura', 'CCOC(=O)CC'),
    tf('Moléculas reais', [['A aspirina contém éster e ácido carboxílico.', 'V'], ['O paracetamol contém amina e cetona.', 'F'], ['A dopamina contém amina e fenol.', 'V'], ['O mentol é um fenol.', 'F']], 'Aspirina: éster + ácido; paracetamol: amida + fenol; dopamina: amina + fenol (catecol); mentol: álcool (OH em anel saturado).'),
    tf('Ésteres', [['Em “etanoato de metila”, “metila” é a parte ligada ao O.', 'V'], ['O carbono da C=O pertence à parte alquila.', 'F'], ['HCOOCH₃ é metanoato de metila.', 'V']], 'Acila (com C=O) + alquila (no O).'),
    ex({ title: 'Nome → estrutura (associação)', type: 'dnd', q: 'Arraste cada nome até sua estrutura:', pairs: [[{ svg: () => draw('CC(C)CO', { scale: 24, fs: 12 }) }, '2-metilpropan-1-ol'], [{ svg: () => draw('CCC(C)O', { scale: 24, fs: 12 }) }, 'butan-2-ol'], [{ svg: () => draw('CC(C)(C)O', { scale: 24, fs: 12 }) }, '2-metilpropan-2-ol'], [{ svg: () => draw('CCOCC', { scale: 24, fs: 12 }) }, 'etoxietano']], e: 'Isômeros C₄H₁₀O.' }),
    ex({ title: 'Prioridade completa', type: 'order', q: 'Ordene da maior para a menor prioridade:', items: [['am', 'amina'], ['ni', 'nitrila'], ['es', 'éster'], ['ol', 'álcool'], ['on', 'cetona']].map(([id, label]) => ({ id, label })), correct: ['es', 'ni', 'on', 'ol', 'am'], top: 'maior', bottom: 'menor', explain: 'éster > nitrila > cetona > álcool > amina.', e: 'éster > nitrila > cetona > álcool > amina.' }),
    mcName('Cíclico', 'CC1CCCC1C'), mcName('Aromático', 'Brc1cccc([N+](=O)[O-])c1'), mcName('Cíclico', 'CCC1CCCC(C)C1'),
  ],
};
void FG_INFO; void FUNCTIONS; void STEM; void funcList;
