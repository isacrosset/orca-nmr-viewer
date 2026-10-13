/*
 * exdata.js — exercícios resolvidos (6 níveis) e propostos (fácil/intermediário/avançado).
 */
import { S } from './chem2d.js';
import { SKA, e2Frames, e1Frames, hydrideE1, cloneS, newmanSVG, chair2D, LP3, LP4 } from './struct.js';

/* ---------- auxiliares de figuras ---------- */
const sk = (k, cap, o = {}) => Object.assign({ s: SKA[k](), cap }, o);
const nm = (front, back, ba, alt) => () => newmanSVG(front, back, 90, ba, { alt, fs: 16, maxw: 230 });
const F_BR_ME_H = [['Br', 'lg'], ['CH3', ''], ['H', '']];
const chair = (subs, t, cap, hl) => ({ s: chair2D(subs, t, { hl }), cap, scale: 40 });

function noArrows(src) { const s = cloneS(src); s.arrows = []; return s; }

/* E2: complete as setas */
function e2Puzzle() {
  const r = e2Frames('EtO').r;
  return {
    s: r,
    sites: {
      lpO: { k: 'lp', a: 8, ang: 90, label: 'par livre do O⁻ (base)' },
      lpBr: { k: 'lp', a: 2, ang: 90, label: 'par livre do Br', why: 'O Br é o grupo abandonador: nesta etapa ele <b>recebe</b> o par da ligação C–Br; seus pares livres não atacam nada.' },
      hb: { k: 'atom', a: 7, label: 'Hβ' },
      ha: { k: 'atom', a: 4, label: 'H do Cα (Hα)' },
      ca: { k: 'atom', a: 0, label: 'Cα' },
      bCH: { k: 'bond', b: [1, 7], label: 'ligação Cβ–H' },
      bCC: { k: 'bond', b: [0, 1], label: 'ligação Cα–Cβ' },
      bCBr: { k: 'bond', b: [0, 2], label: 'ligação Cα–Br' },
      br: { k: 'atom', a: 2, label: 'Br' },
    },
    sources: ['lpO', 'lpBr', 'bCH', 'bCC', 'bCBr'],
    targets: ['hb', 'ha', 'ca', 'bCC', 'br', 'bCH'],
    answer: [['lpO', 'hb'], ['bCH', 'bCC'], ['bCBr', 'br']],
    msgs: {
      'lpO>ha': 'Esse H está no <b>Cα</b>, não no Cβ. Removê-lo não deixaria um par de elétrons vizinho ao C–Br para formar a ligação π.',
      'lpO>ca': 'A base atacando o carbono seria uma <b>SN2</b>, não uma eliminação.',
      'bCC>bCBr': 'A ligação Cα–Cβ não se rompe; ela <b>recebe</b> o par que vem da ligação C–H e vira ligação dupla.',
      'bCBr>ca': 'O par da ligação C–Br vai para o átomo <b>mais eletronegativo</b> (Br), que sai como Br⁻.',
      'bCH>hb': 'Se o par da ligação C–H ficasse com o H, teríamos um hidreto (H⁻) saindo — isso não ocorre. O par fica com o carbono e forma a ligação π.',
    },
    bend: { 'lpO>hb': -0.35, 'bCH>bCC': 0.5, 'bCBr>br': 0.55 },
    done: 'Três setas em <b>uma única etapa</b>: base → Hβ; ligação Cβ–H → nova ligação π; ligação C–Br → Br.',
  };
}
function e1Step1() {
  const f = e1Frames()[0];
  return {
    s: f,
    sites: { bCBr: { k: 'bond', b: [0, 4], label: 'ligação C–Br' }, br: { k: 'atom', a: 4, label: 'Br' }, c: { k: 'atom', a: 0, label: 'carbono α' }, lpBr: { k: 'lp', a: 4, ang: 90, label: 'par livre do Br' } },
    sources: ['bCBr', 'lpBr'], targets: ['br', 'c', 'bCBr'],
    answer: [['bCBr', 'br']],
    msgs: { 'bCBr>c': 'Na ionização, o par da ligação vai para o Br (mais eletronegativo), deixando o carbono com carga +.', 'lpBr>c': 'Isso descreveria o Br formando uma nova ligação, não saindo.' },
    bend: { 'bCBr>br': -0.6 },
    done: 'Ionização: quebra heterolítica, forma o carbocátion terciário e Br⁻ (etapa lenta).',
  };
}
function e1Step2() {
  const f = noArrows(e1Frames()[2]);
  return {
    s: f,
    sites: { lpW: { k: 'lp', a: 7, ang: 120, label: 'par livre da água' }, hb: { k: 'atom', a: 6, label: 'Hβ' }, cp: { k: 'atom', a: 0, label: 'C⁺' }, bCH: { k: 'bond', b: [3, 6], label: 'ligação C–Hβ' }, bCC: { k: 'bond', b: [0, 3], label: 'ligação C⁺–Cβ' } },
    sources: ['lpW', 'bCH', 'bCC'], targets: ['hb', 'cp', 'bCC'],
    answer: [['lpW', 'hb'], ['bCH', 'bCC']],
    msgs: { 'lpW>cp': 'A água atacando o C⁺ é a etapa da <b>SN1</b> (formaria o álcool protonado). Aqui queremos a eliminação.', 'bCH>cp': 'Quase! Mas o par da ligação C–H forma a ligação π <b>entre</b> Cβ e C⁺: a seta deve terminar na ligação C–C.' },
    bend: { 'lpW>hb': 0.3, 'bCH>bCC': -0.5 },
    done: 'Segunda etapa da E1: a base fraca remove o Hβ e o par da ligação C–H forma a ligação π.',
  };
}
function hydridePuzzle() {
  const f = noArrows(hydrideE1()[0]);
  return {
    s: f,
    sites: { bCH: { k: 'bond', b: [2, 5], label: 'ligação C3–H' }, h: { k: 'atom', a: 5, label: 'H em C3' }, cp: { k: 'atom', a: 1, label: 'C⁺ (C2)' }, c3: { k: 'atom', a: 2, label: 'C3' }, bCC: { k: 'bond', b: [1, 2], label: 'ligação C2–C3' } },
    sources: ['bCH', 'bCC'], targets: ['cp', 'c3', 'h'],
    answer: [['bCH', 'cp']],
    msgs: { 'bCC>cp': 'A ligação C2–C3 não "migra"; quem migra é o H com seu par de elétrons (hidreto).', 'bCH>h': 'O H migra <b>com</b> o par de elétrons (como hidreto, H⁻) para o carbono positivo.' },
    bend: { 'bCH>cp': 0.6 },
    done: 'Deslocamento 1,2 de hidreto: o cátion secundário vira terciário (mais estável).',
  };
}

/* figuras de mecanismos errados */
function wrongAlphaH() { const r = e2Frames('EtO').r; r.arrow({ lp: [8, 90] }, { a: 4, ang: 270 }, -0.3, 'o'); r.arrow({ b: [0, 4] }, { b: [0, 1] }, 0.4, 'c'); r.arrow({ b: [0, 2] }, { a: 2, ang: 0 }, 0.6, ''); return r; }
function wrongInverted() { const r = e2Frames('EtO').r; r.arrow({ a: 7, ang: 180 }, { lp: [8, 90] }, 0.35, 'o'); r.arrow({ b: [0, 1] }, { b: [1, 7] }, 0.45, 'c'); r.arrow({ a: 2, ang: 0 }, { b: [0, 2] }, -0.6, ''); return r; }
function wrongPenta() {
  const s = new S(); const c = s.a(0, 0, 'C', { halo: 'm' });
  s.br(c, 90, 'Br', 1, { cls: 'lg' }); s.br(c, 162, 'H3C'); s.br(c, 234, 'H'); s.br(c, 306, 'CH2CH3'); s.br(c, 18, 'OCH2CH3', 1, { cls: 'base' }, 1.3);
  s.t(0, 1.9, '"intermediário" proposto', 'note', 13); return s;
}
function wrongSN2tert() {
  const s = SKA.tbutil(); const o = s.a(0, 2.4, 'HO', { chg: '−', lp: [90, 180], cls: 'base' });
  s.arrow({ lp: [o, 90] }, { a: 0, ang: 270 }, 0.2, 'o'); s.t(2.6, 0.2, '"SN2"', 'note', 15); return s;
}
function wrongCationE2() { const s = noArrows(e1Frames()[2]); s.t(-1.9, -1.4, 'E2 com EtO⁻?', 'note', 14); return s; }

/* ===================================================================
 * Exercícios resolvidos
 * =================================================================== */
const L1 = 'Nível 1 · Fundamentos', L2 = 'Nível 2 · E1 ou E2?', L3 = 'Nível 3 · Produtos', L4 = 'Nível 4 · Zaitsev × Hofmann', L5 = 'Nível 5 · Estereoquímica', L6 = 'Nível 6 · Integração';
export const SOLVED = [
  { level: L1, title: 'Identificando α e β', q: 'No 2-bromobutano, quantos carbonos β e quantos hidrogênios β existem?', fig: sk('bromobutano2', '2-bromobutano'), think: 'Localize primeiro o carbono que carrega o Br.', hint: 'Carbonos β são os vizinhos do Cα; conte os H de cada um.', steps: ['O Br está no C2 → C2 é o <b>Cα</b>.', 'Os vizinhos de C2 são C1 (CH₃) e C3 (CH₂) → <b>2 carbonos β</b>.', 'C1 tem 3 H e C3 tem 2 H → <b>5 Hβ</b>.', 'O H do próprio C2 é um Hα e os H de C4 são γ: nenhum deles participa da eliminação β.'], answer: '2 carbonos β e 5 hidrogênios β.' },
  { level: L1, title: 'Lei de velocidade', q: 'Ao dobrar a concentração de etóxido, a velocidade da reação do 2-bromo-2-metilpropano com EtO⁻/EtOH dobra. O que isso indica?', think: 'Qual mecanismo inclui a base na etapa determinante?', hint: 'Compare v = k[RX] com v = k[RX][B].', steps: ['Se a velocidade depende de [base], a base participa da etapa determinante.', 'Isso é compatível com <b>E2</b>: v = k[RX][Base].', 'Na E1 a velocidade não dependeria da base: v = k[RX].'], answer: 'Mecanismo E2 (bimolecular).' },
  { level: L1, title: '"E2" não significa duas etapas', q: 'Um colega afirma: "A E2 tem duas etapas, por isso se chama E2". Corrija.', think: 'O que o número representa?', hint: 'Molecularidade da etapa determinante.', steps: ['O "2" indica que <b>duas espécies</b> (substrato e base) participam da etapa determinante: é <b>bimolecular</b>.', 'A E2 ocorre em <b>uma única etapa</b> concertada, sem intermediário.', 'Da mesma forma, "E1" não quer dizer uma etapa: a E1 tem duas etapas, mas a determinante é unimolecular.'], answer: 'O número é a molecularidade, não o número de etapas.' },
  { level: L1, title: 'Sem Hβ, sem eliminação', q: 'Por que o brometo de neopentila, (CH₃)₃CCH₂Br, não sofre E2 com etóxido?', think: 'Olhe para o carbono vizinho ao CH₂Br.', hint: 'Conte os H do carbono β.', steps: ['Cα = CH₂Br; o único carbono β é o C(CH₃)₃, quaternário.', 'O carbono β não tem H → <b>não há Hβ</b> para a base remover.', 'Além disso, a SN2 é muito lenta (impedimento do t-butila vizinho).'], answer: 'Não existe Hβ.' },
  { level: L2, title: 'Terciário + base forte', q: 'Qual mecanismo predomina: (CH₃)₃CBr + CH₃CH₂ONa em etanol, 55 °C?', fig: sk('tbutil', '(CH₃)₃CBr'), think: 'Que tipo de reagente é o etóxido?', hint: 'Terciário não faz SN2; base forte não espera o carbocátion.', steps: ['Substrato terciário: <b>SN2 fortemente desfavorecida</b>.', 'Etóxido é base forte → remove Hβ diretamente: <b>E2</b>.', 'Aquecimento também favorece eliminação.'], answer: 'E2 → 2-metilpropeno.' },
  { level: L2, title: 'Terciário + solvente prótico', q: 'Qual mecanismo de eliminação ocorre quando (CH₃)₃CBr é aquecido em etanol, sem base adicionada?', think: 'Há base forte?', hint: 'Solvente prótico + base fraca + substrato terciário.', steps: ['Não há base forte: o etanol é base/nucleófilo fraco.', 'O solvente prótico favorece a ionização → carbocátion terciário.', 'O etanol remove um Hβ: <b>E1</b> (competindo com SN1, que dá o éter).', 'O aquecimento aumenta a fração de E1.'], answer: 'E1 (com SN1 competindo).' },
  { level: L2, title: 'Secundário + t-BuOK', q: 'Classifique: 2-bromopentano + t-BuOK em t-BuOH.', fig: sk('bromopentano2', '2-bromopentano'), think: 'Base volumosa favorece o quê?', hint: 'Base forte + volumosa → pouco nucleofílica.', steps: ['Secundário com base forte e volumosa.', 'A SN2 é desfavorecida pelo volume da base.', '<b>E2</b>, com aumento do produto de Hofmann (pent-1-eno).'], answer: 'E2 (pent-1-eno em maior proporção).' },
  { level: L2, title: 'Primário + etóxido', q: '1-bromobutano + NaOEt/EtOH: substituição ou eliminação?', fig: sk('bromobutano1', '1-bromobutano'), think: 'Primários são bons para quê?', hint: 'Base pequena + C primário desimpedido.', steps: ['Primário: ataque ao carbono pouco impedido.', 'Etóxido pequeno é bom nucleófilo → <b>SN2</b> predomina (1-etoxibutano).', 'E2 (but-1-eno) é minoritária, maior com aquecimento ou base volumosa.'], answer: 'SN2 majoritária.' },
  { level: L3, title: 'Produtos do 2-bromo-2-metilbutano', q: 'Desenhe os alcenos possíveis da E2 do 2-bromo-2-metilbutano com EtO⁻.', fig: sk('bromometilbutano', '2-bromo-2-metilbutano'), think: 'Quantos carbonos β diferentes existem?', hint: 'Os dois CH₃ ligados ao Cα são equivalentes.', steps: ['Carbonos β: dois CH₃ equivalentes e um CH₂.', 'Remoção de H do CH₂ → <b>2-metilbut-2-eno</b> (trissubstituído).', 'Remoção de H do CH₃ → <b>2-metilbut-1-eno</b> (dissubstituído).', 'Com EtO⁻, o mais substituído predomina (~70:30).'], answer: '2-metilbut-2-eno (principal) e 2-metilbut-1-eno.', solFig: [sk('metilbut2eno', '2-metilbut-2-eno (~70%)'), sk('metilbut1eno', '2-metilbut-1-eno (~30%)')] },
  { level: L3, title: 'Cicloalcano terciário', q: 'Qual o produto principal da E2 do 1-bromo-1-metilciclo-hexano com NaOEt?', fig: sk('metilciclohexil', '1-bromo-1-metilciclo-hexano'), think: 'Há Hβ no anel e no CH₃.', hint: 'Compare ligação dupla endo- e exocíclica.', steps: ['Hβ do anel (C2/C6) → <b>1-metilciclo-hexeno</b> (trissubstituído, endocíclico).', 'Hβ do CH₃ → <b>metilideneciclo-hexano</b> (dissubstituído, exocíclico).', 'Com base pequena, predomina o 1-metilciclo-hexeno (Zaitsev).'], answer: '1-metilciclo-hexeno.', solFig: [sk('metilciclohexeno', 'principal'), sk('metilenociclohexano', 'minoritário')] },
  { level: L3, title: 'E1 com rearranjo', q: 'Aquecendo 2-bromo-3-metilbutano em etanol, obtém-se principalmente 2-metilbut-2-eno. Explique.', think: 'O carbocátion inicial é o mais estável possível?', hint: 'Deslocamento 1,2 de hidreto.', steps: ['A ionização forma um carbocátion <b>secundário</b> em C2.', 'O H do C3 vizinho migra com seu par (hidreto) → cátion <b>terciário</b> em C3.', 'A perda de um Hβ do cátion terciário leva ao alceno trissubstituído <b>2-metilbut-2-eno</b>.', 'Rearranjos só ocorrem porque há carbocátion: não aparecem em E2.'], answer: 'E1 com deslocamento 1,2 de hidreto.' },
  { level: L3, title: 'Metileno a partir de terciário?', q: 'Qual é o único alceno formado na eliminação do brometo de terc-butila?', fig: sk('tbutil', '(CH₃)₃CBr'), think: 'Os carbonos β são equivalentes?', hint: 'Três CH₃ idênticos.', steps: ['Todos os 9 Hβ são equivalentes.', 'Qualquer Hβ removido dá o mesmo produto.'], answer: '2-metilpropeno.', solFig: sk('metilpropeno', '2-metilpropeno') },
  { level: L4, title: 'Zaitsev', q: 'Com etóxido, o 2-bromobutano dá ~81% de but-2-eno e ~19% de but-1-eno. Por quê?', think: 'Qual alceno é mais estável?', hint: 'Grau de substituição e caráter de dupla no ET.', steps: ['But-2-eno é dissubstituído; but-1-eno é monossubstituído.', 'Alcenos mais substituídos são mais estáveis (hiperconjugação).', 'O ET da E2 tem caráter parcial de ligação π: fatores que estabilizam o alceno também baixam a energia do ET.', 'Logo o caminho para o alceno mais substituído é mais rápido: <b>tendência de Zaitsev</b>.'], answer: 'O alceno mais estável se forma mais rápido.', fig: [sk('but2enoE', 'but-2-eno'), sk('but1eno', 'but-1-eno')] },
  { level: L4, title: 'Hofmann com base volumosa', q: '2-bromo-2-metilbutano: com EtO⁻ obtém-se ~70% de 2-metilbut-2-eno; com t-BuO⁻, ~72% de 2-metilbut-1-eno. Explique.', think: 'Quais Hβ são mais acessíveis?', hint: 'CH₃ terminal × CH₂ interno.', steps: ['Os Hβ do CH₃ são periféricos e numerosos (6); os do CH₂ estão mais impedidos.', 't-BuO⁻ é volumoso: aproxima-se mais facilmente dos H do CH₃.', 'Resultado: mais alceno <b>menos substituído</b> (produto de Hofmann).', 'É uma tendência, não uma regra absoluta.'], answer: 'Efeito estérico da base volumosa.' },
  { level: L4, title: 'Estabilidade relativa', q: 'Ordene por estabilidade: but-1-eno, (Z)-but-2-eno, (E)-but-2-eno, 2-metilbut-2-eno.', think: 'Use grau de substituição e tensão cis.', hint: 'Calores de hidrogenação: 127, 120, 116, 113 kJ/mol.', steps: ['Mais substituído → mais estável: tri > di > mono.', 'Entre os dissubstituídos, E > Z (no Z os CH₃ se repelem).', 'Ordem: 2-metilbut-2-eno > (E)-but-2-eno > (Z)-but-2-eno > but-1-eno.'], answer: '2-metilbut-2-eno > (E)-but-2-eno > (Z)-but-2-eno > but-1-eno.' },
  { level: L5, title: 'E ou Z pela conformação anti', q: 'Na E2 do 2-bromobutano (C2–C3), por que se forma mais (E)- do que (Z)-but-2-eno?', fig: { svg: nm(F_BR_ME_H, [['H', 'hb'], ['CH3', ''], ['H', '']], 270, 'Newman anti levando ao E'), cap: 'conformação reativa: CH₃/CH₃ anti' }, think: 'Há duas conformações com Hβ anti ao Br.', hint: 'Compare a relação entre os dois CH₃ em cada conformação.', steps: ['Em C3 há dois H: cada um pode ficar anti ao Br em uma conformação diferente.', 'Na conformação com os CH₃ <b>anti</b> (180°), a eliminação dá o <b>E</b>.', 'Na conformação com os CH₃ <b>gauche</b> (60°), dá o <b>Z</b>.', 'A primeira é mais estável (menos tensão) e leva a um ET de menor energia → E predomina.'], answer: '(E)-but-2-eno majoritário.' },
  { level: L5, title: 'Ciclo-hexano trans-diaxial', q: 'Por que o cis-1-bromo-4-terc-butilciclo-hexano sofre E2 muito mais rápido que o isômero trans?', fig: [chair({ '0u': 'Br', '3u': 'tBu' }, 0, 'cis: Br axial'), chair({ '0u': 'Br', '3d': 'tBu' }, 1, 'trans: Br equatorial')], think: 'O t-Bu fica sempre equatorial.', hint: 'E2 em ciclo-hexano exige H e Br axiais, em lados opostos.', steps: ['O grupo t-Bu trava a cadeira com ele equatorial.', 'No <b>cis</b>, isso coloca o Br <b>axial</b>: há H axiais anti (trans-diaxiais) em C2 e C6 → E2 rápida.', 'No <b>trans</b>, o Br fica <b>equatorial</b>: nenhum H está anti → precisa da cadeira desfavorecida (t-Bu axial) → E2 lenta.'], answer: 'Só o cis tem Br axial na conformação preferida.' },
  { level: L5, title: 'Estereoespecificidade', q: 'O meso-1,2-dibromo-1,2-difeniletano sofre E2 com KOH. Qual estereoisômero do 1-bromo-1,2-difeniletileno se forma?', think: 'Coloque o H de C2 anti ao Br de C1 e veja onde ficam os grupos.', hint: 'No meso, a conformação com Br anti a Br tem Ph anti a Ph. Gire C2 120° para colocar seu H anti ao Br de C1.', steps: ['Com Hβ (em C2) anti ao Br (em C1), os dois Ph ficam <b>gauche</b> → ficam do mesmo lado da dupla (cis).', 'No produto: C1 tem Ph e H; C2 tem Br e Ph.', 'Prioridades CIP: em C1, Ph > H; em C2, Br > Ph.', 'Ph (C1) e Br (C2) ficam em lados opostos → <b>(E)</b>.', 'O outro diastereoisômero (par R,R/S,S) daria o (Z): a E2 é <b>estereoespecífica</b>.'], answer: '(E)-1-bromo-1,2-difeniletileno (Ph cis entre si).' },
  { level: L5, title: 'E1 é estereosseletiva', q: 'A E1 do 2-bromopentano (solvólise, Δ) dá mais (E)- que (Z)-pent-2-eno, mas a proporção não depende da configuração do substrato. Por quê?', think: 'O que acontece com a estereoquímica no carbocátion?', hint: 'C⁺ é plano; não há exigência anti.', steps: ['O carbocátion é plano: a informação estereoquímica do substrato se perde.', 'A perda do Hβ pode ocorrer de conformações variadas do cátion; a mais estável leva ao alceno mais estável (E).', 'Logo a E1 é <b>estereosseletiva</b> (favorece E), mas não estereoespecífica.'], answer: 'Carbocátion plano → seletividade pela estabilidade do produto.' },
  { level: L6, title: 'O caso secundário', q: '2-bromobutano com: (a) NaOEt/EtOH, Δ; (b) NaCN/DMSO; (c) t-BuOK; (d) EtOH, Δ. Preveja o mecanismo principal.', fig: sk('bromobutano2', '2-bromobutano'), think: 'Classifique cada reagente: nucleófilo, base, volume.', hint: 'Secundário é o caso mais difícil: o reagente decide.', steps: ['(a) Base forte pequena → <b>E2</b> (but-2-eno, E > Z), SN2 competindo.', '(b) Nucleófilo forte pouco básico, aprótico → <b>SN2</b> (com inversão).', '(c) Base volumosa → <b>E2</b>, com mais but-1-eno.', '(d) Base/nucleófilo fraco, prótico → <b>SN1 + E1</b>, lentas.'], answer: 'E2 · SN2 · E2 (Hofmann ↑) · SN1/E1.' },
  { level: L6, title: 'Perfis de energia', q: 'Compare os diagramas: qual corresponde à E1 e qual à E2? Onde está o carbocátion?', fig: { energy: ['e1', 'e2'] }, think: 'Conte mínimos locais entre reagentes e produtos.', hint: 'Intermediário = vale entre dois picos.', steps: ['A curva com <b>um único pico</b> é a E2 (um ET, nenhum intermediário).', 'A curva com <b>dois picos e um vale</b> é a E1.', 'O vale é o <b>carbocátion</b>; o primeiro pico (ionização) é o mais alto: etapa determinante.'], answer: 'E1: dois ET + carbocátion; E2: um ET.' },
  { level: L6, title: 'Temperatura', q: 'O (CH₃)₃CBr em etanol aquoso dá álcool/éter (SN1) e 2-metilpropeno (E1). Como aumentar a fração de alceno sem adicionar base?', think: 'Que variável favorece a eliminação?', hint: 'ΔG = ΔH − TΔS.', steps: ['Aquecer a reação.', 'A eliminação gera mais partículas (ΔS mais positivo): o termo −TΔS cresce com T.', 'Além disso, a etapa de eliminação tende a ter Ea maior e acelera mais com o aquecimento.'], answer: 'Aumentar a temperatura.' },
];

/* ===================================================================
 * Exercícios propostos
 * =================================================================== */
const easy = [
  { title: 'Hβ no bromoetano', type: 'pickH', mol: 'bromoetano', q: 'Clique em todos os hidrogênios β do bromoetano.', e: 'O CH₃ é o único carbono β: seus 3 H são Hβ. Os 2 H do CH₂Br são Hα.' },
  { title: 'Significado de E2', type: 'mc', q: 'Na sigla E2, o número 2 indica que:', o: ['a reação ocorre em duas etapas', 'duas espécies participam da etapa determinante (bimolecular)', 'formam-se dois produtos', 'o substrato é secundário'], a: 1, e: 'O número é a <b>molecularidade</b> da etapa determinante. A E2 tem uma única etapa.' },
  { title: 'Lei de velocidade da E1', type: 'mc', q: 'Qual é a lei de velocidade da E1?', o: ['v = k[RX][Base]', 'v = k[Base]', 'v = k[RX]', 'v = k[RX]²'], a: 2, e: 'A etapa lenta é a ionização do substrato; a base entra depois.' },
  { title: 'Intermediários', type: 'tf', q: 'Verdadeiro ou falso:', items: [['A E2 forma um carbocátion.', 'F'], ['A E1 passa por um carbocátion.', 'V'], ['O estado de transição da E2 pode ser isolado.', 'F'], ['E1 e SN1 compartilham o mesmo intermediário.', 'V']], e: 'E2: uma etapa, sem intermediário. E1/SN1: carbocátion.' },
  { title: 'Base volumosa', type: 'mc', q: 'Qual destas bases é a mais volumosa (e pouco nucleofílica)?', o: ['HO⁻', 'CH₃O⁻', '(CH₃)₃CO⁻', 'CH₃CH₂O⁻'], a: 2, e: 'O terc-butóxido tem três metilas ao redor do O.' },
  { title: 'Ordem de estabilidade', type: 'order', q: 'Ordene os alcenos do <b>mais estável</b> para o <b>menos estável</b>.', items: [{ id: 'a', s: SKA.dimetilbut2eno(), label: 'tetrassubstituído' }, { id: 'b', s: SKA.metilbut2eno(), label: 'trissubstituído' }, { id: 'c', s: SKA.but2enoE(), label: '(E)-dissubstituído' }, { id: 'd', s: SKA.but1eno(), label: 'monossubstituído' }], correct: ['a', 'b', 'c', 'd'], top: 'mais estável', bottom: 'menos estável', explain: 'Mais grupos alquila na dupla → mais hiperconjugação → mais estável.' },
  { title: 'Geometria da E2', type: 'mc', q: 'Qual é a geometria preferida para a E2?', o: ['sin-periplanar (0°)', 'gauche (60°)', 'anti-periplanar (180°)', 'qualquer uma'], a: 2, e: 'Hβ e grupo abandonador em lados opostos e no mesmo plano: o σ C–H fica alinhado ao σ* C–X.' },
  { title: 'Produto do tBuBr', type: 'mc', struct: true, q: 'Qual alceno se forma na E2 do brometo de terc-butila?', o: [{ s: SKA.metilpropeno() }, { s: SKA.but1eno() }, { s: SKA.but2enoE() }, { s: SKA.propeno() }], a: 0, e: 'Os 9 Hβ são equivalentes: só 2-metilpropeno.' },
  { title: 'Temperatura', type: 'mc', q: 'Aumentar a temperatura, em geral:', o: ['favorece a substituição', 'favorece a eliminação', 'não altera a competição', 'impede a E1'], a: 1, e: 'A eliminação tem ΔS mais positivo; o termo −TΔS cresce com T.' },
  { title: 'Condição → mecanismo', type: 'match', q: 'Associe cada condição ao mecanismo mais provável.', pairs: [['(CH₃)₃CBr + NaOEt', 'E2'], ['(CH₃)₃CBr + H₂O, 25 °C', 'SN1'], ['CH₃CH₂Br + NaCN/DMSO', 'SN2'], ['(CH₃)₃CBr + EtOH, Δ', 'E1']], e: 'Base forte → E2; terciário em água → SN1; primário + bom Nu → SN2; prótico e quente → E1.' },
];
const mid = [
  { title: 'Complete o mecanismo E2', type: 'arrows', q: 'Desenhe as três setas curvas da E2 do 2-bromobutano com etóxido. Clique na <b>origem</b> e depois no <b>destino</b> de cada seta.', puzzle: e2Puzzle(), e: 'Base (par livre) → Hβ; ligação Cβ–H → região Cα–Cβ (nova π); ligação C–Br → Br.' },
  { title: 'E1, etapa 1', type: 'arrows', q: 'Desenhe a seta da ionização do brometo de terc-butila.', puzzle: e1Step1(), e: 'O par da ligação C–Br vai para o Br.' },
  { title: 'E1, etapa 2', type: 'arrows', q: 'Desenhe as setas da remoção do Hβ pela água no carbocátion terc-butila.', puzzle: e1Step2(), e: 'Par livre da água → Hβ; ligação C–Hβ → ligação C–C (forma a π).' },
  { title: 'Hβ no 2-bromo-2-metilbutano', type: 'pickH', mol: 'bromometilbutano', q: 'Clique em todos os Hβ.', e: '8 Hβ: 3 + 3 nos dois CH₃ e 2 no CH₂.' },
  { title: 'Newman reativa', type: 'mc', struct: true, q: 'Qual projeção de Newman (ao longo de C3→C2 do 2-bromobutano) leva ao <b>(E)-but-2-eno</b> por E2?', o: [
    { svg: nm(F_BR_ME_H, [['H', 'hb'], ['CH3', ''], ['H', '']], 270, 'A'), t: '' },
    { svg: nm(F_BR_ME_H, [['H', 'hb'], ['H', ''], ['CH3', '']], 270, 'B'), t: '' },
    { svg: nm(F_BR_ME_H, [['CH3', ''], ['H', ''], ['H', '']], 270, 'C'), t: '' },
    { svg: nm(F_BR_ME_H, [['H', ''], ['CH3', ''], ['H', '']], 78, 'D'), t: 'quase eclipsada' }], a: 0, e: 'A correta tem um H anti ao Br e os dois CH₃ anti → E. A que tem H anti ao Br mas os CH₃ gauche leva ao Z. A que tem CH₃ anti ao Br não tem H para remover nessa posição. A quase eclipsada tem o H praticamente sin-periplanar (≈ 0°) ao Br.' },
  { title: 'Zaitsev', type: 'mc', struct: true, q: 'Produto principal: 2-bromopentano + NaOEt/EtOH, Δ.', o: [{ s: SKA.pent1eno() }, { s: SKA.pent2enoE() }, { s: SKA.pent2enoZ() }, { s: SKA.but2enoE() }], a: 1, e: 'Base pequena → alceno mais substituído; entre os pent-2-enos, o E (mais estável).' },
  { title: 'Hofmann', type: 'mc', struct: true, q: 'Produto principal: 2-bromo-2-metilbutano + t-BuOK.', o: [{ s: SKA.metilbut2eno() }, { s: SKA.metilbut1eno() }, { s: SKA.dimetilbut2eno() }, { s: SKA.but1eno() }], a: 1, e: 'A base volumosa remove o Hβ mais acessível (CH₃): 2-metilbut-1-eno (~72%).' },
  { title: 'Velocidade de E2', type: 'order', q: 'Ordene pela velocidade de E2 com uma base forte (mais rápido primeiro).', items: [{ id: 't', s: SKA.tbutil(), label: 'terciário' }, { id: 's', s: SKA.isopropyl(), label: 'secundário' }, { id: 'p', s: SKA.ethyl(), label: 'primário' }], correct: ['t', 's', 'p'], top: 'mais rápido', bottom: 'mais lento', explain: 'Na E2, 3° > 2° > 1°: mais Hβ e alceno mais substituído (ET mais estável).' },
  { title: 'Grupo abandonador', type: 'order', q: 'Ordene os haletos de terc-butila pela velocidade de E2 (mais rápido primeiro).', items: [{ id: 'I', s: SKA.tbutil('I'), label: 'C–I' }, { id: 'Br', s: SKA.tbutil('Br'), label: 'C–Br' }, { id: 'Cl', s: SKA.tbutil('Cl'), label: 'C–Cl' }, { id: 'F', s: SKA.tbutil('F'), label: 'C–F' }], correct: ['I', 'Br', 'Cl', 'F'], top: 'mais rápido', bottom: 'mais lento', explain: 'A ligação C–X se rompe no ET: I⁻ é o melhor GA (base mais fraca, ligação mais fraca).' },
  { title: 'E1 × E2', type: 'tf', q: 'Verdadeiro ou falso:', items: [['A E2 exige geometria anti-periplanar.', 'V'], ['A E1 exige geometria anti-periplanar.', 'F'], ['Rearranjos são comuns na E2.', 'F'], ['A velocidade da E1 independe da concentração da base.', 'V'], ['Bases fortes favorecem E1.', 'F']], e: 'E1: carbocátion plano, sem exigência anti, rearranjos possíveis, v = k[RX]. Bases fortes favorecem E2.' },
  { title: 'Cadeira reativa', type: 'mc', struct: true, q: 'Em qual cadeira do bromociclo-hexano a E2 pode ocorrer?', o: [{ s: chair2D({ '0u': 'Br' }, 0, { hl: { '1d': 'hb', '5d': 'hb' } }), t: 'cadeira A' }, { s: chair2D({ '0u': 'Br' }, 1, {}), t: 'cadeira B' }], a: 0, e: 'Só com Br axial existem H axiais anti-periplanares (trans-diaxiais) em C2 e C6.' },
  { title: 'O que está errado? (1)', type: 'mc', q: 'O que está errado neste mecanismo E2?', fig: { s: wrongAlphaH(), cap: 'mecanismo proposto', zoom: 1.3 }, o: ['a base removeu um H do Cα, não um Hβ', 'a seta do C–Br deveria ir para o carbono', 'falta formar um carbocátion', 'nada: está correto'], a: 0, e: 'O H removido deve estar no carbono <b>vizinho</b> ao Cα (Hβ). Removendo um Hα, o par não pode formar a π com o carbono que perde o Br.' },
  { title: 'O que está errado? (2)', type: 'mc', q: 'Identifique o erro nas setas.', fig: { s: wrongInverted(), cap: 'mecanismo proposto', zoom: 1.3 }, o: ['as setas estão invertidas: devem partir dos elétrons (par livre/ligação)', 'a base deveria atacar o Br', 'deveria haver só uma seta', 'o Br deveria ficar no produto'], a: 0, e: 'Setas curvas representam movimento de elétrons: começam em pares livres ou ligações e terminam onde os elétrons vão.' },
  { title: 'O que está errado? (3)', type: 'mc', q: 'Um estudante propôs este intermediário para a E2. Qual o problema?', fig: { s: wrongPenta(), cap: '' }, o: ['carbono com cinco ligações (10 elétrons de valência)', 'falta a carga positiva', 'o Br deveria estar em outra posição', 'nenhum'], a: 0, e: 'Carbono não pode ter 5 ligações. Na E2 não há intermediário; e a base ataca o H, não o carbono.' },
  { title: 'Solvente e base', type: 'match', q: 'Associe cada reagente à sua classificação.', pairs: [['(CH₃)₃CO⁻', 'base forte, volumosa'], ['I⁻', 'nucleófilo forte, base muito fraca'], ['CH₃CH₂O⁻', 'base forte e bom nucleófilo'], ['H₂O', 'nucleófilo/base fracos']], e: 'Basicidade e nucleofilicidade são propriedades diferentes.' },
];
const hard = [
  { title: 'Rearranjo: hidreto', type: 'arrows', q: 'O cátion secundário do 2-bromo-3-metilbutano rearranja antes da eliminação. Desenhe a seta do deslocamento 1,2 de hidreto.', puzzle: hydridePuzzle(), e: 'O par da ligação C3–H acompanha o H até o C⁺.' },
  { title: 'Produto após rearranjo', type: 'mc', struct: true, q: '2-bromo-3-metilbutano aquecido em etanol (E1). Alceno principal?', o: [{ s: SKA.metilbut2eno() }, { s: SKA.metilbut1eno() }, { s: SKA.pent2enoE() }, { s: SKA.dimetilbut2eno() }], a: 0, e: 'Hidreto migra → cátion terciário → perda de Hβ → 2-metilbut-2-eno (trissubstituído).' },
  { title: 'Migração de metila', type: 'mc', struct: true, q: '3,3-dimetilbutan-2-ol em H₂SO₄ quente (via carbocátion) forma principalmente:', o: [{ s: SKA.dimetilbut2eno() }, { s: SKA.metilbut2eno() }, { s: SKA.metilpropeno() }, { s: SKA.but2enoE() }], a: 0, e: 'Cátion 2° → migração 1,2 de CH₃ → cátion 3° → 2,3-dimetilbut-2-eno (tetrassubstituído).' },
  { title: 'Expansão de anel', type: 'mc', q: 'Por que o cátion 1-ciclobutiletila rearranja para um cátion ciclopentila?', o: ['alivia a tensão do anel de 4 membros e gera um cátion mais substituído', 'porque a E2 exige anel de 5', 'porque o carbono fica pentavalente', 'não rearranja'], a: 0, e: 'A migração de uma ligação do anel expande-o (4 → 5, menos tensão) e o C⁺ passa a terciário/secundário mais estável.' },
  { title: 'cis × trans', type: 'mc', q: 'Qual reage mais rápido por E2 com NaOEt?', fig: [chair({ '0u': 'Br', '3u': 'tBu' }, 0, 'cis'), chair({ '0u': 'Br', '3d': 'tBu' }, 1, 'trans')], o: ['cis-1-bromo-4-terc-butilciclo-hexano', 'trans-1-bromo-4-terc-butilciclo-hexano', 'reagem igualmente', 'nenhum reage'], a: 0, e: 'No cis, com t-Bu equatorial, o Br é axial → H trans-diaxiais disponíveis.' },
  { title: 'Cloreto de mentila', type: 'mc', q: 'O cloreto de mentila (Cl equatorial na cadeira preferida, com os três substituintes equatoriais) sofre E2 lentamente e dá só um alceno, o "menos substituído". O motivo é que:', o: ['ele precisa reagir pela cadeira com Cl axial, e nessa cadeira só um Hβ é axial anti', 'o Cl é mau grupo abandonador', 'a E2 ocorre via carbocátion', 'a base é volumosa'], a: 0, e: 'Na cadeira reativa (Cl axial) apenas um carbono β tem H axial anti; por isso o produto é determinado pela geometria, não por Zaitsev.' },
  { title: 'Estereoespecífica', type: 'tf', q: 'Sobre a E2:', items: [['Diastereoisômeros diferentes podem dar alcenos E e Z diferentes.', 'V'], ['A E2 sempre dá o alceno E.', 'F'], ['A E1 é estereoespecífica.', 'F'], ['Na E2, a conformação anti determina quais grupos ficam cis no alceno.', 'V']], e: 'E2: estereoespecífica (depende da conformação anti do substrato). E1: apenas estereosseletiva.' },
  { title: 'O que está errado? (4)', type: 'mc', q: 'Qual o erro nesta proposta?', fig: { s: wrongSN2tert(), cap: 'HO⁻ + (CH₃)₃CBr por "SN2"' }, o: ['SN2 em carbono terciário é fortemente desfavorecida', 'a seta deve sair do Br', 'HO⁻ não tem pares livres', 'faltou o carbocátion na SN2'], a: 0, e: 'O ataque traseiro está bloqueado pelas três metilas; com HO⁻ (base forte) ocorre E2.' },
  { title: 'O que está errado? (5)', type: 'mc', q: 'Este intermediário foi proposto para a reação de (CH₃)₃CBr com NaOEt (E2). Qual o erro?', fig: { s: wrongCationE2(), cap: '' }, o: ['a E2 não forma carbocátion: é concertada', 'falta a carga negativa no C', 'a água não pode ser base', 'nenhum'], a: 0, e: 'Com base forte o mecanismo é E2, em uma etapa. Carbocátion pertence a E1/SN1.' },
  { title: 'O que está errado? (6)', type: 'mc', q: 'Um estudante desenhou a E2 a partir de uma conformação em que o Hβ está a 60° do Br (gauche). Qual a crítica?', fig: { svg: nm(F_BR_ME_H, [['H', 'hb'], ['H', ''], ['CH3', '']], 150, 'gauche'), cap: 'Hβ (ciano) gauche ao Br' }, o: ['os orbitais σ C–H e σ* C–Br não estão alinhados: a E2 exige anti-periplanar', 'a base é fraca demais', 'o Br deveria ser axial', 'nenhuma crítica'], a: 0, e: 'Sem alinhamento (diedro ≈ 180°), a sobreposição necessária para formar a π é ruim.' },
  { title: 'O que está errado? (7)', type: 'mc', q: 'Proposta: "1-bromo-2,2-dimetilpropano + NaCN/DMSO dá produto rearranjado por SN2". Qual o erro?', o: ['rearranjo exige carbocátion; SN2 e E2 não rearranjam', 'CN⁻ é base forte', 'DMSO é prótico', 'nada'], a: 0, e: 'SN2 e E2 são concertadas: não há intermediário para rearranjar.' },
  { title: 'Previsão completa', type: 'match', q: 'Para o 2-bromobutano, associe cada condição ao mecanismo principal.', pairs: [['NaOEt/EtOH, Δ', 'E2 (Zaitsev)'], ['NaN₃/DMF', 'SN2'], ['t-BuOK/t-BuOH', 'E2 (mais Hofmann)'], ['EtOH, Δ, sem base', 'SN1/E1']], e: 'Secundário: o reagente e o solvente decidem.' },
  { title: 'E/Z por E2', type: 'mc', q: 'Do meso-1,2-dibromo-1,2-difeniletano com KOH (E2) forma-se:', o: ['(E)-1-bromo-1,2-difeniletileno', '(Z)-1-bromo-1,2-difeniletileno', 'mistura 1:1', 'difenilacetileno diretamente'], a: 0, e: 'Com H anti ao Br, os Ph ficam gauche → cis no alceno; pelas prioridades CIP (Br > Ph em C2; Ph > H em C1), o alceno é E.' },
  { title: 'Desafio: proporções', type: 'mc', q: '2-bromobutano + NaOEt dá ~81% de but-2-eno; com t-BuOK, ~53% de but-1-eno. Qual afirmação explica a diferença?', o: ['a base volumosa remove preferencialmente os Hβ mais acessíveis do CH₃', 't-BuO⁻ forma carbocátion', 'o but-1-eno é mais estável', 'o etóxido é mais volumoso'], a: 0, e: 'Efeito estérico na aproximação da base (tendência de Hofmann).' },
  { title: 'Ordem de tendência à E2', type: 'order', q: 'Ordene os substratos pela tendência a sofrer E2 (e não substituição) com NaOEt.', items: [{ id: 't', s: SKA.tbutil(), label: '(CH₃)₃CBr' }, { id: 's', s: SKA.bromobutano2(), label: '2-bromobutano' }, { id: 'p', s: SKA.bromobutano1(), label: '1-bromobutano' }, { id: 'm', s: SKA.methyl(), label: 'CH₃Br' }], correct: ['t', 's', 'p', 'm'], top: 'mais E2', bottom: 'menos E2', explain: 'Terciário: só E2. Secundário: E2 predomina. Primário: SN2 predomina. Metílico: sem Hβ, só SN2.' },
];
export const PROPOSED = { easy, mid, hard };
export { LP3, LP4 };
