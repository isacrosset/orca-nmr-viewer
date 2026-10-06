/*
 * exdata.js — exercícios resolvidos (10 níveis) e propostos (fácil,
 * intermediário, avançado). Respostas de R/S, nomes e relações são
 * calculadas pelo motor (stereo.js) a partir das mesmas estruturas
 * desenhadas, garantindo consistência.
 */
import { mol as render } from './chem2d.js';
import { Z } from './build.js';
import { LIB } from './library.js';
import { makeMol, withCfg, mirrorMol, nameOf, cfgString, relation, explainCenter, allStereo, meso } from './stereo.js';
import { wedgeSVG, fischerSVG, fischerGroups, crossSVG, crossDesc } from './draw.js';
import { orientWith4 } from './modules.js';

const M = (k, c) => (c ? withCfg(LIB[k], c) : makeMol(LIB[k]));
const W = (m, o = {}) => ({ svg: () => wedgeSVG(m, Object.assign({ scale: 36 }, o)), cap: o.cap });
const F = (m, o = {}) => ({ svg: () => fischerSVG(m, Object.assign({ maxw: 160 }, o)), cap: o.cap });
const SK = (s, cap) => ({ svg: () => render(s, { scale: 34, fs: 15 }), cap });
const d0 = (m) => m.desc[m.C.indexOf(m.centers[0])];
const RS = (m) => (d0(m) === 'R' ? 0 : 1);
const prios = (m, c) => explainCenter(m, c === undefined ? m.centers[0] : c);
const plist = (m, c) => prios(m, c).lig.map((l) => `${l.rank} = ${l.label}`).join(', ');
const whyList = (m, c) => prios(m, c).pairs.map((p) => `${p.a} &gt; ${p.b} (${p.why})`).join('; ');
/** Fischer de 1 centro com posições dadas */
function cross(m, perm) {
  const g = fischerGroups(m)[0];
  const base = { up: g.up, dn: g.dn, left: g.left, right: g.right };
  const pos = {}; Object.keys(perm).forEach((k) => { pos[k] = base[perm[k]]; });
  const lbl = {}; Object.keys(pos).forEach((k) => { lbl[k] = { t: (m.groupAt[pos[k]] || '').replace('CH2OH', 'CH₂OH').replace('CH3', 'CH₃').replace('NH2', 'NH₂') }; });
  return { pos, d: crossDesc(m, m.centers[0], pos), fig: { svg: () => crossSVG(lbl, { maxw: 180 }) } };
}
/** butan-2-ol com o H no plano */
function hPlane(want) {
  const sp = { family: 'butanol2', name: '{cfg}butan-2-ol', chain: ['H', { f: 'OH', b: 'CH3' }, 'Et'], loc: [2] };
  let m = makeMol(sp);
  if (m.desc[0] !== want) { sp.chain[1] = { f: 'CH3', b: 'OH' }; m = makeMol(sp); }
  return m;
}

/* ---------- moléculas usadas ---------- */
const but = M('butanol2', ['R']), brb = M('bromobutano2', ['S']), gli = M('gliceraldeido'), lac = M('lactico');
const bc = (a, b) => M('bromocloro', [a, b]);
const mpo = M('metilpentanol', ['R', 'S']), dib = M('dibromobutano', ['R', 'R']), cmh = M('clorometilhexanol', ['S', 'R', 'S']);
const hp = hPlane('R');
const glA = cross(gli, { up: 'up', dn: 'dn', left: 'left', right: 'right' });
const glRot = cross(gli, { up: 'left', right: 'up', dn: 'right', left: 'dn' });
const alaV = cross(M('alanina'), { up: 'right', dn: 'dn', left: 'left', right: 'up' });

export const SOLVED = [
  // 1 · Tipos de isômeros
  { level: 'Tipos de isômeros', title: 'Butano e 2-metilpropano', q: 'Qual a relação entre butano e 2-metilpropano?', fig: [SK(Z(4), 'butano'), SK(Z(3, { sub: { 1: [['']] } }), '2-metilpropano')], think: 'Mesma fórmula? Mesma sequência de ligações?', hint: 'Conte os carbonos e veja quantos vizinhos cada C tem.', steps: ['Ambos são C₄H₁₀ → isômeros.', 'No butano a cadeia é linear; no 2-metilpropano um C liga-se a três outros.', 'Conectividade diferente → isômeros constitucionais (de cadeia).'], answer: 'isômeros constitucionais de cadeia' },
  { level: 'Tipos de isômeros', title: 'Propan-1-ol e propan-2-ol', q: 'Classifique o par.', fig: [SK(Z(4, { lab: { 3: 'OH' } }), 'propan-1-ol'), SK(Z(3, { sub: { 1: [['OH']] } }), 'propan-2-ol')], think: 'O que muda: o esqueleto, o grupo funcional ou a posição?', hint: 'Mesmo esqueleto, mesmo grupo funcional.', steps: ['C₃H₈O nos dois.', 'O OH está em C1 em um e em C2 no outro.', 'Isômeros constitucionais de posição.'], answer: 'isômeros de posição' },
  { level: 'Tipos de isômeros', title: 'Duas formas do butan-2-ol', q: 'A e B são isômeros constitucionais ou estereoisômeros?', fig: [W(but, { cap: 'A' }), W(mirrorMol(but), { cap: 'B' })], think: 'Os átomos estão ligados aos mesmos vizinhos?', hint: 'Compare só a cunha e o tracejado em C2.', steps: ['Mesma conectividade: C2 liga-se a OH, H, CH₃ e CH₂CH₃ nas duas.', 'Muda apenas a orientação espacial de OH e H.', 'São estereoisômeros — e, por serem imagens especulares não sobreponíveis, enantiômeros.'], answer: 'estereoisômeros (enantiômeros)' },
  // 2 · Quiralidade
  { level: 'Quiralidade', title: 'O propan-2-ol é quiral?', q: 'Decida se o propan-2-ol é quiral.', fig: [W(M('propan2ol'), { cap: 'propan-2-ol' })], think: 'C2 tem quatro grupos diferentes?', hint: 'Olhe os dois grupos metila.', steps: ['C2 liga-se a OH, H, CH₃ e CH₃.', 'Dois grupos iguais → não é centro estereogênico.', 'Há um plano de simetria (passa por H–C–O): a molécula coincide com a imagem especular → aquiral.'], answer: 'aquiral' },
  { level: 'Quiralidade', title: 'Bromoclorofluorometano', q: 'CHBrClF é quiral?', fig: [W(M('bcf'), { cap: 'CHBrClF' })], think: 'Quantos grupos diferentes no carbono?', hint: 'H, F, Cl, Br.', steps: ['Quatro átomos diferentes ligados ao C.', 'Não há plano de simetria.', 'Molécula e imagem não se sobrepõem → quiral.'], answer: 'quiral' },
  { level: 'Quiralidade', title: 'Dois centros, mas aquiral?', q: 'O (2R,3S)-2,3-diclorobutano tem dois centros estereogênicos. Ele é quiral?', fig: [F(M('diclorobutano', ['R', 'S']), { labels: true, cap: '(2R,3S)' })], think: 'Existe um plano que divide a molécula em duas metades especulares?', hint: 'Na Fischer, compare a metade de cima com a de baixo.', steps: ['Os dois centros têm os mesmos substituintes (Cl, H, CH₃) e descritores opostos.', 'Na conformação eclipsada há um plano de simetria entre C2 e C3.', 'A molécula é sobreponível à sua imagem: forma meso, aquiral.'], answer: 'aquiral (meso)' },
  // 3 · Centros estereogênicos
  { level: 'Centros estereogênicos', title: '3-metilpentan-2-ol', q: 'Quantos centros estereogênicos?', fig: [W(mpo, { plain: true, cap: '3-metilpentan-2-ol' })], think: 'Analise C2 e C3.', hint: 'C3 tem etila de um lado e CH(OH)CH₃ do outro.', steps: ['C2: OH, H, CH₃, CH(CH₃)CH₂CH₃ → 4 diferentes.', 'C3: H, CH₃, CH₂CH₃, CH(OH)CH₃ → 4 diferentes.', 'Os demais têm dois ou três H.'], answer: '2 (C2 e C3)' },
  { level: 'Centros estereogênicos', title: '3-metil-hexano', q: 'C3 do 3-metil-hexano é centro estereogênico?', fig: [W(M('metilhexano3'), { plain: true })], think: 'Etila e propila são iguais?', hint: 'Compare os dois ramos até a primeira diferença.', steps: ['C3: H, CH₃, CH₂CH₃, CH₂CH₂CH₃.', 'Etila ≠ propila (diferem na 3ª camada).', 'Quatro grupos diferentes → sim.'], answer: 'sim' },
  { level: 'Centros estereogênicos', title: 'Aldo-hexose (glicose, cadeia aberta)', q: 'Quantos centros e quantos estereoisômeros no máximo?', fig: [F(M('glicose'), { cap: 'aldo-hexose' })], think: 'C1 (CHO) e C6 (CH₂OH) contam?', hint: 'CHO é sp²; CH₂OH tem dois H.', steps: ['C2, C3, C4 e C5 têm quatro grupos diferentes.', 'n = 4 → máximo 2⁴ = 16.', 'Sem simetria interna: os 16 existem (8 pares de enantiômeros; D/L-glicose é um deles).'], answer: '4 centros; 16 estereoisômeros' },
  // 4 · Enantiômeros e diastereoisômeros
  { level: 'Enantiômeros e diastereoisômeros', title: '(2R,3R) × (2S,3S)', q: 'Relação entre os estereoisômeros do 2-bromo-3-clorobutano:', fig: [F(bc('R', 'R'), { labels: true, cap: 'A' }), F(bc('S', 'S'), { labels: true, cap: 'B' })], think: 'Quantos centros mudaram?', hint: 'Todos invertidos?', steps: ['A = (2R,3R); B = (2S,3S).', 'Os dois centros estão invertidos.', 'Imagens especulares não sobreponíveis → enantiômeros.'], answer: relation(bc('R', 'R'), bc('S', 'S')).r },
  { level: 'Enantiômeros e diastereoisômeros', title: '(2R,3R) × (2R,3S)', q: 'E agora?', fig: [F(bc('R', 'R'), { labels: true, cap: 'A' }), F(bc('R', 'S'), { labels: true, cap: 'B' })], think: 'Mudou um centro ou os dois?', hint: 'Só C3 mudou.', steps: ['A = (2R,3R); B = (2R,3S).', 'Apenas um dos centros foi invertido.', 'Estereoisômeros que não são imagens especulares → diastereoisômeros.'], answer: relation(bc('R', 'R'), bc('R', 'S')).r },
  { level: 'Enantiômeros e diastereoisômeros', title: 'Propriedades físicas', q: 'Por que enantiômeros têm o mesmo ponto de fusão e diastereoisômeros não?', think: 'Distâncias e energias internas mudam numa reflexão?', hint: 'Reflexão preserva todas as distâncias entre átomos.', steps: ['Enantiômeros são reflexo um do outro: mesmas distâncias, ângulos e energias.', 'Em ambiente aquiral interagem igualmente → mesmas propriedades físicas (exceto rotação da luz polarizada).', 'Diastereoisômeros têm distâncias internas diferentes → propriedades diferentes (PF, PE, solubilidade).'], answer: 'reflexão preserva a geometria interna; diastereoisômeros não são reflexos' },
  // 5 · CIP
  { level: 'Regras CIP', title: 'Prioridades no butan-2-ol', q: 'Ordene OH, CH₂CH₃, CH₃ e H.', fig: [W(but, { prio: but.centers[0] })], think: 'Camada 1: O, C, C, H.', hint: 'Empate C × C: vá para a camada 2.', steps: ['Camada 1: O (8) > C = C > H.', 'Empate CH₂CH₃ × CH₃: (C,H,H) × (H,H,H).', 'C > H no primeiro ponto de diferença → etila > metila.'], answer: plist(but) },
  { level: 'Regras CIP', title: 'CH₂OH × CH₃', q: 'Prioridades no propano-1,2-diol (C2).', fig: [W(M('propanodiol'), { prio: M('propanodiol').centers[0] })], think: 'Qual é o primeiro átomo de cada ramo?', hint: 'Compare os conjuntos da camada 2.', steps: ['OH tem O na camada 1 → prioridade 1.', 'CH₂OH (O,H,H) × CH₃ (H,H,H): O > H.', 'Ordem final: ' + plist(M('propanodiol')) + '.'], answer: plist(M('propanodiol')) },
  { level: 'Regras CIP', title: 'Átomos duplicados: CHO × CH₂OH', q: 'No gliceraldeído, quem tem prioridade: CHO ou CH₂OH?', fig: [W(gli, { prio: gli.centers[0] })], think: 'Como a ligação C=O é contada?', hint: 'Duplique o O.', steps: ['CHO → C(O,O,H); CH₂OH → C(O,H,H).', 'Primeiro ponto de diferença: segundo elemento, O > H.', 'CHO > CH₂OH. Ordem: ' + plist(gli) + '.'], answer: 'CHO' },
  // 6 · R/S
  { level: 'Configuração R/S', title: 'Grupo 4 para trás', q: 'Determine R/S.', fig: [W(but, { prio: but.centers[0], orient: orientWith4(but, but.centers[0], 'back') })], think: 'O H está no tracejado?', hint: 'Leitura direta.', steps: ['Prioridades: ' + plist(but) + '.', 'O H (4) está no tracejado (para trás).', `1 → 2 → 3 ${d0(but) === 'R' ? 'horário' : 'anti-horário'} → ${d0(but)}.`], answer: nameOf(but) },
  { level: 'Configuração R/S', title: 'Grupo 4 para a frente', q: 'Determine R/S (o H está na cunha).', fig: [W(brb, { prio: brb.centers[0], orient: orientWith4(brb, brb.centers[0], 'front') })], think: 'O que muda quando o 4 aponta para você?', hint: 'Leia e inverta.', steps: ['Prioridades: ' + plist(brb) + '.', `No papel, 1 → 2 → 3 parece ${d0(brb) === 'R' ? 'anti-horário (S)' : 'horário (R)'}.`, `Como o 4 está para a frente, inverta: ${d0(brb)}.`], answer: nameOf(brb) },
  { level: 'Configuração R/S', title: 'Grupo 4 no plano', q: 'Determine R/S: o H está no plano do papel.', fig: [W(hp, { prio: hp.centers[0] })], think: 'Troque o H com o grupo do tracejado.', hint: 'Uma troca inverte a configuração.', steps: ['Troque H ↔ grupo do tracejado: agora o H está para trás.', `Leia a estrutura trocada: ${d0(hp) === 'R' ? 'S' : 'R'}.`, `Desfaça a troca (inverta): ${d0(hp)}.`], answer: nameOf(hp) },
  // 7 · Fischer
  { level: 'Projeções de Fischer', title: 'Gliceraldeído em Fischer', q: 'R ou S?', fig: [glA.fig], think: 'Onde está o H: vertical ou horizontal?', hint: 'H na horizontal → leia e inverta.', steps: ['Prioridades: OH > CHO > CH₂OH > H.', 'OH (dir.) → CHO (topo) → CH₂OH (base): anti-horário.', `H na horizontal (para a frente) → inverta: ${glA.d}.`], answer: `(${glA.d})-gliceraldeído` },
  { level: 'Projeções de Fischer', title: 'Girar 90°', q: 'A projeção anterior foi girada 90° no plano. Qual é a configuração?', fig: [glRot.fig], think: 'Um giro de 90° é permitido?', hint: 'Giro de 90° troca horizontal ↔ vertical.', steps: ['Girar 90° leva grupos de trás para a frente e vice-versa.', 'O resultado representa o enantiômero.', `Configuração: ${glRot.d}.`], answer: glRot.d },
  { level: 'Projeções de Fischer', title: 'H na vertical', q: 'Alanina: R ou S?', fig: [alaV.fig], think: 'Com o H na vertical, a leitura é direta?', hint: 'Prioridades: NH₂ > COOH > CH₃ > H.', steps: ['NH₂ (1), COOH (2), CH₃ (3), H (4).', 'H na vertical = para trás → leitura direta.', `Sentido de 1 → 2 → 3 → ${alaV.d}.`], answer: alaV.d },
  // 8 · Meso
  { level: 'Compostos meso', title: 'Ácido tartárico', q: 'Quantos estereoisômeros tem o ácido tartárico?', fig: allStereo(LIB.tartarico).list.map((m) => F(m, { labels: true, maxw: 130, cap: cfgString(m) })), think: '2² = 4. Algum se repete?', hint: '(R,S) e (S,R) são iguais?', steps: ['Dois centros → no máximo 4.', 'A molécula é simétrica: (2R,3S) = (2S,3R) = meso.', 'Total 3: par (R,R)/(S,S) + meso.'], answer: '3' },
  { level: 'Compostos meso', title: 'meso-2,3-dibromobutano?', q: 'O (2R,3S)-2,3-dibromobutano é meso?', fig: [F(M('dibromobutano', ['R', 'S']), { labels: true })], think: 'Mesmos substituintes nos dois centros?', hint: 'Compare as metades.', steps: ['C2 e C3 têm Br, H, CH₃ e o outro centro.', 'Descritores opostos (R,S) com metades equivalentes.', `Plano de simetria → ${meso(M('dibromobutano', ['R', 'S'])) ? 'meso' : 'quiral'}.`], answer: 'sim, meso' },
  { level: 'Compostos meso', title: 'Descritores opostos bastam?', q: 'O (2R,3S)-2-bromo-3-clorobutano é meso?', fig: [F(bc('R', 'S'), { labels: true })], think: 'As duas metades são iguais?', hint: 'Br ≠ Cl.', steps: ['Os centros têm substituintes diferentes (Br em um, Cl no outro).', 'Não existe plano de simetria interno.', `Logo é ${meso(bc('R', 'S')) ? 'meso' : 'quiral (não meso)'}.`], answer: 'não — é quiral' },
  // 9 · Nomenclatura
  { level: 'Nomenclatura completa', title: 'Dois centros', q: 'Dê o nome completo.', fig: [W(mpo)], think: 'Ache os centros, depois R/S de cada.', hint: 'Locante + descritor entre parênteses.', steps: ['Cadeia: pentan-2-ol com metila em C3.', `C2: ${mpo.desc[0]}; C3: ${mpo.desc[1]}.`, `Nome: ${nameOf(mpo)}.`], answer: nameOf(mpo) },
  { level: 'Nomenclatura completa', title: '2,3-dibromobutano', q: 'Nome completo:', fig: [W(dib)], think: 'Quais descritores?', hint: 'Compare as duas metades.', steps: ['Centros em C2 e C3.', `Descritores: ${dib.desc.join(', ')}.`, `Nome: ${nameOf(dib)} (forma quiral).`], answer: nameOf(dib) },
  { level: 'Nomenclatura completa', title: 'Três centros', q: 'Nome completo:', fig: [W(cmh)], think: 'Numere para dar o menor locante ao OH.', hint: 'Centros em C2, C3, C4.', steps: ['Cadeia principal: hexan-2-ol; substituintes 4-cloro e 3-metil (ordem alfabética).', `Descritores: C2 ${cmh.desc[0]}, C3 ${cmh.desc[1]}, C4 ${cmh.desc[2]}.`, `Nome: ${nameOf(cmh)}.`], answer: nameOf(cmh) },
  // 10 · Integrados
  { level: 'Integrados', title: 'R não é (+)', q: 'O (R)-gliceraldeído é dextrorrotatório (+8,7). O (R)-butan-2-ol também deve ser (+)?', think: 'R/S depende de quê? E o sinal da rotação?', hint: 'Uma é convenção geométrica; a outra, medida experimental.', steps: ['R/S vem das regras CIP aplicadas à geometria.', 'O sinal (+)/(−) é medido no polarímetro.', 'Não há relação: o (R)-butan-2-ol é (−), [α] = −13,5.'], answer: 'não' },
  { level: 'Integrados', title: 'Excesso enantiomérico', q: 'Uma amostra tem 80% de (S)-butan-2-ol ([α] = +13,5) e 20% do R. Calcule ee e [α] da mistura.', think: 'A parte racêmica contribui?', hint: 'ee = |%maior − %menor|.', steps: ['ee = 80 − 20 = 60%.', 'Os 40% racêmicos não giram a luz.', '[α] = 0,60 × (+13,5) = +8,1.'], answer: 'ee = 60%; [α] = +8,1' },
  { level: 'Integrados', title: 'Rotação específica', q: 'α<sub>obs</sub> = +2,6°, l = 1 dm, c = 0,20 g/mL. Calcule [α].', think: 'Qual a fórmula?', hint: '[α] = α/(l·c).', steps: ['[α] = 2,6 / (1 × 0,20).', '= +13,0.', 'Dextrorrotatório.'], answer: '+13,0' },
  { level: 'Integrados', title: 'Aldopentose', q: 'Quantos estereoisômeros tem a aldopentose de cadeia aberta (CHO–(CHOH)₃–CH₂OH)?', fig: [F(M('ribose'), { cap: 'ex.: D-ribose' })], think: 'Quantos centros? Há simetria?', hint: 'Extremidades diferentes (CHO × CH₂OH).', steps: ['C2, C3, C4 → n = 3.', 'Extremos diferentes: sem meso.', `2³ = ${allStereo(LIB.ribose).list.length} (4 pares de enantiômeros).`], answer: String(allStereo(LIB.ribose).list.length) },
];

/* ===================================================================
 * Propostos
 * =================================================================== */
const mcRS = (title, m, o = {}) => ({ title, type: 'mc', q: o.q || 'Atribua a configuração do centro estereogênico.', fig: [W(m, Object.assign({ scale: 38 }, o.w || {}))], o: ['R', 'S'], a: RS(m), e: o.e || `Prioridades: ${plist(m)}. ${whyList(m)}.` });
const crossRS = (title, m, perm) => { const X = cross(m, perm); return { title, type: 'mc', q: 'R ou S?', fig: [X.fig], o: ['R', 'S'], a: X.d === 'R' ? 0 : 1, e: `Configuração ${X.d}. H na vertical → leitura direta; H na horizontal → leia e inverta.` }; };
const pairMC = (title, A, B, o = {}) => { const r = relation(A, B).r; const opts = ['idênticas', 'enantiômeros', 'diastereoisômeros', 'constitucionais']; return { title, type: 'mc', q: o.q || 'Relação entre A e B:', fig: o.fischer ? [F(A, { cap: 'A' }), F(B, { cap: 'B' })] : [W(A, { cap: 'A' }), W(B, { cap: 'B', orient: o.orient })], o: opts, a: opts.indexOf(r), e: `A = ${cfgString(A) || nameOf(A)}, B = ${cfgString(B) || nameOf(B)}. ${relation(A, B).t}.` }; };
const ala = M('alanina'), bcf = M('bcf');

export const PROPOSED = {
  easy: [
    { title: 'Isomeria', type: 'mc', q: 'Isômeros constitucionais diferem em:', o: ['conectividade', 'apenas orientação espacial', 'fórmula molecular', 'número de centros'], a: 0, e: 'Mesma fórmula, átomos ligados em outra ordem.' },
    { title: 'Isomeria', type: 'mc', q: 'Etanol e éter dimetílico são isômeros de:', o: ['função', 'cadeia', 'posição', 'configuração'], a: 0, e: 'Álcool × éter.' },
    { title: 'Isomeria', type: 'mc', q: 'Estereoisômeros têm:', o: ['mesma conectividade e arranjo espacial diferente', 'conectividade diferente', 'fórmulas diferentes', 'sempre o mesmo PF'], a: 0, e: 'Definição.' },
    { title: 'Quiralidade', type: 'mc', q: 'Uma molécula é quiral quando:', o: ['não é sobreponível à sua imagem especular', 'tem um átomo de O', 'gira em torno de ligações simples', 'tem plano de simetria'], a: 0, e: 'Quiralidade é propriedade da molécula inteira.' },
    { title: 'Clique mental', type: 'mc', q: 'Qual molécula tem centro estereogênico?', struct: true, o: [{ svg: () => wedgeSVG(M('butanol2'), { scale: 30, plain: true }), t: 'butan-2-ol' }, { svg: () => wedgeSVG(M('propan2ol'), { scale: 30, plain: true }), t: 'propan-2-ol' }, { svg: () => wedgeSVG(M('butanol1'), { scale: 30, plain: true }), t: 'butan-1-ol' }], a: 0, e: 'Só no butan-2-ol o C do OH tem quatro grupos diferentes.' },
    { title: 'Centros', type: 'mc', q: 'Quantos centros estereogênicos no 2-bromo-3-clorobutano?', o: ['2', '1', '0', '4'], a: 0, e: 'C2 e C3.' },
    { title: 'Centros', type: 'tf', q: 'V ou F:', items: [['Um CH₂ nunca é centro estereogênico.', 'V'], ['Todo composto com centro estereogênico é quiral.', 'F'], ['Um carbono sp² de C=O não é centro estereogênico (tetraédrico).', 'V'], ['Trocar dois grupos de um centro inverte R/S.', 'V']], e: 'Formas meso têm centros e são aquirais.' },
    { title: 'CIP', type: 'mc', q: 'Maior prioridade:', o: ['Br', 'Cl', 'OH', 'CH₃'], a: 0, e: 'Br (Z = 35).' },
    { title: 'CIP', type: 'mc', q: 'Entre D e H:', o: ['D > H (maior massa)', 'H > D', 'iguais', 'depende da molécula'], a: 0, e: 'Isótopos: maior número de massa ganha (T > D > H).' },
    { title: 'CIP', type: 'order', q: 'Ordene: Br, OH, CH₃, H.', items: [{ id: 'a', label: 'Br' }, { id: 'b', label: 'OH' }, { id: 'c', label: 'CH₃' }, { id: 'd', label: 'H' }], correct: ['a', 'b', 'c', 'd'], top: '1', bottom: '4', explain: 'Br > O > C > H.', e: 'Número atômico.' },
    mcRS('R ou S? (4 atrás)', but, { w: { orient: orientWith4(but, but.centers[0], 'back') } }),
    mcRS('R ou S? (4 atrás)', M('lactico'), { w: { orient: orientWith4(lac, lac.centers[0], 'back') } }),
    { title: 'Enantiômeros', type: 'mc', q: 'Enantiômeros diferem em:', o: ['sentido da rotação da luz polarizada', 'ponto de fusão', 'densidade', 'fórmula'], a: 0, e: 'Em ambiente aquiral, só a rotação óptica (sinal oposto).' },
    { title: 'Diastereoisômeros', type: 'mc', q: '(2R,3R) e (2R,3S)-2-bromo-3-clorobutano são:', o: ['diastereoisômeros', 'enantiômeros', 'idênticos', 'constitucionais'], a: 0, e: 'Só um centro invertido.' },
    { title: 'Meso', type: 'mc', q: 'Um composto meso:', o: ['tem centros estereogênicos e é aquiral', 'é sempre quiral', 'não tem centros', 'gira a luz'], a: 0, e: 'Plano de simetria interno.' },
    { title: 'Atividade óptica', type: 'mc', q: 'Uma mistura racêmica:', o: ['tem 50% de cada enantiômero e α = 0', 'é um composto meso', 'gira a luz para a direita', 'tem ee = 100%'], a: 0, e: 'As rotações se cancelam.' },
    { title: 'Atividade óptica', type: 'mc', q: '(+) significa:', o: ['dextrorrotatório (horário)', 'configuração R', 'mais estável', 'quiral'], a: 0, e: 'Sinal medido, não R/S.' },
    { title: 'Fischer', type: 'mc', q: 'Na projeção de Fischer, as linhas horizontais:', o: ['apontam para o observador', 'apontam para trás', 'estão no plano', 'são ligações duplas'], a: 0, e: 'Horizontal = frente; vertical = trás.' },
    { title: 'Contagem', type: 'mc', q: 'Uma molécula com 3 centros (sem simetria) tem:', o: ['8 estereoisômeros', '6', '3', '9'], a: 0, e: '2³.' },
    { title: 'Associe', type: 'match', q: 'Associe o termo à definição.', pairs: [['enantiômeros', 'imagens especulares não sobreponíveis'], ['diastereoisômeros', 'estereoisômeros não especulares'], ['meso', 'centros + plano de simetria'], ['racêmico', 'mistura 1:1 de enantiômeros']], e: 'Definições básicas.' },
  ],
  mid: [
    mcRS('R ou S? (4 para a frente)', brb, { w: { orient: orientWith4(brb, brb.centers[0], 'front') }, e: 'H na cunha: leia e inverta.' }),
    mcRS('R ou S? (4 para a frente)', gli, { w: { orient: orientWith4(gli, gli.centers[0], 'front') }, e: 'H na cunha: leia e inverta. ' + plist(gli) }),
    mcRS('R ou S? (4 no plano)', hp, { e: 'Troque o H com o grupo do tracejado, leia e inverta.' }),
    mcRS('R ou S? (4 no plano)', hPlane('S'), { e: 'Troque o H com o grupo do tracejado, leia e inverta.' }),
    mcRS('R ou S? (isótopos)', M('deuterioetanol'), { e: 'OH > CH₃ > D > H.' }),
    mcRS('R ou S? (ligação dupla)', M('cloropropenol'), { e: 'CH=CH₂ é C(C,C,H) > CH₃.' }),
    { title: 'CIP', type: 'order', q: 'Ordene: CH₂OH, CH₂Cl, CH₃, H.', items: [{ id: 'a', label: 'CH₂OH' }, { id: 'b', label: 'CH₂Cl' }, { id: 'c', label: 'CH₃' }, { id: 'd', label: 'H' }], correct: ['b', 'a', 'c', 'd'], top: '1', bottom: '4', explain: 'Camada 2: (Cl,H,H) > (O,H,H) > (H,H,H).', e: 'Primeiro ponto de diferença.' },
    { title: 'CIP', type: 'order', q: 'Ordene: CHO, CH₂OH, CH₃, H.', items: [{ id: 'a', label: 'CHO' }, { id: 'b', label: 'CH₂OH' }, { id: 'c', label: 'CH₃' }, { id: 'd', label: 'H' }], correct: ['a', 'b', 'c', 'd'], top: '1', bottom: '4', explain: 'CHO = C(O,O,H).', e: 'Duplicação.' },
    { title: 'CIP', type: 'order', q: 'Ordene: isopropila, propila, etila, metila.', items: [{ id: 'a', label: 'CH(CH₃)₂' }, { id: 'b', label: 'CH₂CH₂CH₃' }, { id: 'c', label: 'CH₂CH₃' }, { id: 'd', label: 'CH₃' }], correct: ['a', 'b', 'c', 'd'], top: '1', bottom: '4', explain: 'Camada 2: (C,C,H) > (C,H,H) = (C,H,H) > (H,H,H); propila × etila decide na camada 3.', e: 'Camadas.' },
    crossRS('Fischer → R/S', gli, { up: 'up', dn: 'dn', left: 'left', right: 'right' }),
    crossRS('Fischer → R/S', ala, { up: 'right', dn: 'dn', left: 'left', right: 'up' }),
    crossRS('Fischer → R/S', lac, { up: 'dn', dn: 'up', left: 'right', right: 'left' }),
    { title: 'Fischer', type: 'mc', q: 'Girar uma projeção de Fischer 180° no plano:', o: ['mantém a configuração', 'inverte', 'gera um diastereoisômero', 'não é permitido'], a: 0, e: 'Horizontais continuam horizontais.' },
    { title: 'Fischer', type: 'mc', q: 'Trocar dois grupos numa Fischer e depois trocar outros dois:', o: ['restaura a configuração', 'inverte', 'gera meso', 'gera constitucional'], a: 0, e: 'Número par de trocas.' },
    pairMC('Mesma molécula girada?', but, but, { orient: 'flip' }),
    pairMC('Relação', bc('R', 'S'), bc('S', 'R'), { fischer: true }),
    pairMC('Relação', bc('R', 'S'), bc('R', 'R'), { fischer: true }),
    pairMC('Relação', M('diclorobutano', ['R', 'S']), M('diclorobutano', ['S', 'R']), { fischer: true }),
    { title: 'Contagem', type: 'mc', q: 'Quantos estereoisômeros tem o 2,3-dibromobutano?', o: ['3', '4', '2', '8'], a: 0, e: 'Par quiral + meso.' },
    { title: 'Atividade óptica', type: 'mc', q: 'α = −3,0°, l = 2 dm, c = 0,10 g/mL. [α] =', o: ['−15', '−0,6', '−60', '+15'], a: 0, e: '−3,0/(2 × 0,10).' },
  ],
  hard: [
    { title: 'Detecte o erro', type: 'mc', q: '"O (R)-butan-2-ol é dextrorrotatório porque é R."', o: ['erro: R/S não determina o sinal (+)/(−)', 'correto', 'erro: deveria ser S', 'erro: não é quiral'], a: 0, e: 'Na verdade o (R)-butan-2-ol é (−).' },
    { title: 'Detecte o erro', type: 'mc', q: '"Com o H na cunha, li horário, então é R."', o: ['erro: com o 4 para a frente é preciso inverter (S)', 'correto', 'erro: H nunca fica na cunha', 'erro: deveria usar Fischer'], a: 0, e: 'Inverter quando o 4 aponta para o observador.' },
    { title: 'Detecte o erro', type: 'mc', q: '"CH₂Cl > CH₂CH₂Br porque o grupo inteiro é mais pesado."', o: ['a conclusão é certa, mas o motivo não: compara-se camada a camada (Cl × C na camada 2)', 'é errado: CH₂CH₂Br vence', 'correto pela massa total', 'são iguais'], a: 0, e: 'Camada 2: (Cl,H,H) × (C,H,H) → Cl. A massa total não importa.' },
    { title: 'Detecte o erro', type: 'mc', q: '"O meso-tartárico é quiral porque tem dois centros estereogênicos."', o: ['erro: tem plano de simetria → aquiral', 'correto', 'erro: tem só um centro', 'erro: é constitucional'], a: 0, e: 'Ter centros não garante quiralidade.' },
    { title: 'Detecte o erro', type: 'mc', q: '"Girei a Fischer 90°: é a mesma molécula."', o: ['erro: 90° gera o enantiômero', 'correto', 'erro: 90° gera diastereoisômero', 'erro: rotações são proibidas'], a: 0, e: 'Só 180° no plano preserva.' },
    { title: 'Detecte o erro', type: 'mc', q: '"O C2 do pentano é centro estereogênico: tem CH₃ e propila."', o: ['erro: C2 tem dois H', 'correto', 'erro: é C3', 'erro: pentano tem 2 centros'], a: 0, e: 'C2: H, H, CH₃, C₃H₇.' },
    { title: 'Nomenclatura', type: 'mc', q: 'Nome completo:', fig: [W(mpo)], o: [nameOf(mpo), nameOf(mirrorMol(mpo)), nameOf(M('metilpentanol', ['R', 'R'])), nameOf(M('metilpentanol', ['S', 'S']))], a: 0, e: `Calcule C2 e C3: ${mpo.desc.join(', ')}.` },
    { title: 'Nomenclatura', type: 'mc', q: 'Nome completo:', fig: [W(cmh)], o: [nameOf(cmh), nameOf(mirrorMol(cmh)), nameOf(M('clorometilhexanol', ['S', 'S', 'S'])), nameOf(M('clorometilhexanol', ['R', 'R', 'S']))], a: 0, e: `Descritores: ${cmh.desc.join(', ')}.` },
    { title: 'Nomenclatura', type: 'mc', q: 'Qual nome está escrito corretamente?', o: ['(2R,3S)-3-metilpentan-2-ol', '(R,S)-3-metilpentan-2-ol', '3-metilpentan-2-ol-(2R,3S)', '(2R)(3S)-3-metilpentan-2-ol'], a: 0, e: 'Locante + descritor, separados por vírgula, entre parênteses, antes do nome.' },
    mcRS('R ou S? (C2)', mpo, { q: 'Configuração de C2 (o centro com OH):', e: `C2: ${plist(mpo, mpo.C[0])}.` }),
    { title: 'Meso?', type: 'mc', q: 'Qual é meso?', struct: true, o: [{ svg: () => fischerSVG(M('tartarico', ['R', 'S']), { maxw: 120 }) }, { svg: () => fischerSVG(M('tartarico', ['R', 'R']), { maxw: 120 }) }, { svg: () => fischerSVG(bc('R', 'S'), { maxw: 120 }) }], a: 0, e: 'Metades iguais e especulares (plano horizontal).' },
    { title: 'Qual é o enantiômero?', type: 'mc', q: `Enantiômero de ${nameOf(dib)}:`, struct: true, o: [{ svg: () => fischerSVG(mirrorMol(dib), { maxw: 120 }) }, { svg: () => fischerSVG(M('dibromobutano', ['R', 'S']), { maxw: 120 }) }, { svg: () => fischerSVG(dib, { maxw: 120 }) }], a: 0, e: 'Todos os centros invertidos: (2S,3S).' },
    pairMC('Relação (com rotação)', mpo, M('metilpentanol', ['R', 'S']), { orient: 'turn' }),
    pairMC('Relação', mpo, mirrorMol(mpo), { orient: 'rot180' }),
    pairMC('Relação', mpo, M('metilpentanol', ['S', 'S']), { orient: 'flip' }),
    { title: 'Contagem', type: 'mc', q: 'Quantos estereoisômeros tem o 4-cloro-3-metil-hexan-2-ol?', o: ['8', '6', '4', '3'], a: 0, e: '3 centros, sem simetria: 2³.' },
    { title: 'Contagem', type: 'mc', q: 'Quantos estereoisômeros tem o butano-2,3-diol?', o: ['3', '4', '2', '1'], a: 0, e: 'Como o tartárico: par + meso.' },
    { title: 'Excesso enantiomérico', type: 'mc', q: 'Uma amostra de (S)-butan-2-ol mostra [α] = +6,75 (puro: +13,5). ee e composição:', o: ['ee 50%: 75% S / 25% R', 'ee 50%: 50/50', 'ee 25%: 75/25', 'ee 75%'], a: 0, e: '6,75/13,5 = 0,50; %S − %R = 50 → 75/25.' },
    { title: 'Associe', type: 'match', q: 'Associe a operação ao efeito na Fischer.', pairs: [['girar 180° no plano', 'mantém'], ['girar 90°', 'inverte'], ['uma troca de grupos', 'inverte (1 troca)'], ['duas trocas', 'restaura']], e: 'Regras de manipulação.' },
    { title: 'Associe', type: 'match', q: 'Associe descritor e nome.', pairs: [['(R)-gliceraldeído', `[α] ${'+'}8,7 (dextro)`], ['(R)-butan-2-ol', '[α] −13,5 (levo)'], ['meso-tartárico', '[α] = 0'], ['racemato', 'α = 0 (mistura)']], e: 'R/S e (+)/(−) são independentes; meso e racemato têm α = 0 por motivos diferentes.' },
  ],
};
void bcf;
