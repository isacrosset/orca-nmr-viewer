/*
 * exdata.js — "Monte o mecanismo" (setas curvas), exercícios resolvidos
 * (8 níveis) e propostos (15 fáceis, 20 intermediários, 15 avançados).
 */
import { S } from './chem2d.js';
import { M, R6, Z, cloneS, hbrSN2, williamsonFrames, epoxBasic, halohydrinEpoxFrames, epoxAcid } from './struct.js';

const f = (k, cap, o = {}) => Object.assign({ s: M[k](), cap }, o);
const noArr = (s) => { const c = cloneS(s); c.arrows = []; return c; };
const opt = (k) => ({ s: M[k]() });
const ox = { cls: 'ox' };

/* ===================================================================
 * Monte o mecanismo
 * =================================================================== */
const cation1 = () => { const s = new S(); const c = s.a(0, 0, 'CH2', { chg: '+', halo: 'v' }); s.br(c, 180, 'CH3CH2CH2', 1, null, 2.6); return s; };
const freeCation = () => { const s = new S(); const c = s.a(0, 0, 'C', { chg: '+', halo: 'v' }); s.br(c, 90, 'CH3'); s.br(c, 210, 'H3C'); s.br(c, 330, 'CH2OH', 1, null, 1.4); return s; };
export const PUZZLES = [
  {
    title: 'Ativação do álcool: protonação pelo HBr', intro: 'Desenhe as setas da 1ª etapa (par livre do O → H; ligação H–Br → Br). Depois escolha o intermediário e o produto.',
    puzzle: (() => {
      const r = hbrSN2()[0];
      return {
        s: r,
        sites: { lpO: { k: 'lp', a: 2, ang: 270, label: 'par livre do O' }, lpO2: { k: 'lp', a: 2, ang: 90, label: 'outro par livre do O' }, H: { k: 'atom', a: 4, label: 'H do HBr' }, HBr: { k: 'bond', b: [4, 5], label: 'ligação H–Br' }, Br: { k: 'atom', a: 5, label: 'Br' }, C: { k: 'atom', a: 0, label: 'CH₂' }, OH: { k: 'bond', b: [2, 3], label: 'ligação O–H' } },
        sources: ['lpO', 'HBr', 'OH'], targets: ['H', 'Br', 'C'],
        answer: [['lpO', 'H'], ['HBr', 'Br']],
        msgs: { 'lpO>C': 'O oxigênio é o nucleófilo (base) aqui: ele ataca o H⁺, não o carbono.', 'OH>H': 'A ligação O–H do álcool não se rompe nesta etapa.', 'HBr>H': 'O par da ligação H–Br vai para o Br (mais eletronegativo), que sai como Br⁻.' },
        bend: { 'lpO>H': -0.4, 'HBr>Br': -0.7 },
        done: 'O par livre do O captura o H⁺; o par da ligação H–Br fica com o Br (Br⁻). Forma-se o íon alquiloxônio.',
        slots: [
          { title: 'intermediário', options: [{ s: noArr(hbrSN2()[2]), ok: true, why: 'Álcool protonado (ROH₂⁺): agora a H₂O é o grupo abandonador.' }, { s: cation1(), ok: false, why: 'Carbocátion primário: muito instável; com álcool 1° a substituição é SN2 sobre o ROH₂⁺.' }] },
          { title: 'produto', options: [{ s: M.bromobutano1(), ok: true, why: '1-bromobutano (SN2).' }, { s: M.bromobutano2(), ok: false, why: 'Exigiria um cátion/rearranjo que não ocorre com o butan-1-ol nessas condições.' }] },
        ],
      };
    })(),
  },
  {
    title: 'SN2 do Br⁻ sobre o álcool protonado', intro: 'O Br⁻ ataca o carbono pelo lado oposto ao grupo abandonador (H₂O). Desenhe as duas setas.',
    puzzle: (() => {
      const i = noArr(hbrSN2()[2]);
      return {
        s: i,
        sites: { lpBr: { k: 'lp', a: 5, ang: 0, label: 'par livre do Br⁻' }, C: { k: 'atom', a: 0, label: 'CH₂ (eletrofílico)' }, CO: { k: 'bond', b: [0, 2], label: 'ligação C–O' }, O: { k: 'atom', a: 2, label: 'O⁺' }, OH: { k: 'bond', b: [2, 3], label: 'ligação O–H' }, H: { k: 'atom', a: 3, label: 'H' } },
        sources: ['lpBr', 'CO', 'OH'], targets: ['C', 'O', 'H'],
        answer: [['lpBr', 'C'], ['CO', 'O']],
        msgs: { 'lpBr>H': 'Aqui o Br⁻ age como nucleófilo, não como base: ele ataca o carbono.', 'lpBr>O': 'O Br⁻ não se liga ao O; ele ataca o carbono δ+.', 'OH>O': 'Quem sai é a H₂O inteira: rompe-se a ligação C–O.' },
        bend: { 'lpBr>C': 0, 'CO>O': 0.6 },
        done: 'Ataque pelo lado oposto e saída da água em uma única etapa (SN2): inversão no carbono.',
        slots: [{ title: 'produto', options: [{ s: M.bromobutano1(), ok: true, why: '1-bromobutano + H₂O.' }, { s: M.butan1ol(), ok: false, why: 'Isso seria o reagente de volta (perda de H⁺).' }] }],
      };
    })(),
  },
  {
    title: 'Síntese de Williamson', intro: 'Etóxido + iodometano. Desenhe as setas da SN2.',
    puzzle: (() => {
      const r = williamsonFrames()[0];
      return {
        s: r,
        sites: { lpO: { k: 'lp', a: 2, ang: 0, label: 'par livre do O⁻' }, C: { k: 'atom', a: 3, label: 'CH₃' }, CI: { k: 'bond', b: [3, 4], label: 'ligação C–I' }, I: { k: 'atom', a: 4, label: 'I' } },
        sources: ['lpO', 'CI'], targets: ['C', 'I'],
        answer: [['lpO', 'C'], ['CI', 'I']],
        msgs: { 'lpO>I': 'O alcóxido ataca o carbono δ+, não o iodo.' },
        bend: { 'lpO>C': -0.5, 'CI>I': -0.6 },
        done: 'SN2 em carbono metílico: rápida e sem competição com E2.',
        slots: [{ title: 'produto', options: [{ s: M.metoxietano(), ok: true, why: 'Metoxietano + I⁻.' }, { s: M.eterDietilico(), ok: false, why: 'Exigiria um haleto de etila.' }, { s: M.etanol(), ok: false, why: 'Isso seria só a protonação do etóxido.' }] }],
      };
    })(),
  },
  {
    title: 'Abertura básica do epóxido', intro: 'CH₃O⁻ abre o 2,2-dimetiloxirano. Qual carbono ele ataca? Desenhe as setas.',
    puzzle: (() => {
      const r = epoxBasic()[0];
      return {
        s: r,
        sites: { lpNu: { k: 'lp', a: 5, ang: 0, label: 'par livre do CH₃O⁻' }, C1: { k: 'atom', a: 0, label: 'CH₂ (C1)' }, C2: { k: 'atom', a: 1, label: 'C(CH₃)₂ (C2)' }, C1O: { k: 'bond', b: [0, 2], label: 'ligação C1–O' }, C2O: { k: 'bond', b: [1, 2], label: 'ligação C2–O' }, O: { k: 'atom', a: 2, label: 'O do epóxido' } },
        sources: ['lpNu', 'C1O', 'C2O'], targets: ['C1', 'C2', 'O'],
        answer: [['lpNu', 'C1'], ['C1O', 'O']],
        msgs: { 'lpNu>C2': 'Em meio básico a abertura é SN2: o carbono terciário é impedido demais. Ataque o CH₂.', 'C2O>O': 'Rompe-se a ligação do carbono atacado (C1–O).' },
        bend: { 'lpNu>C1': 0.3, 'C1O>O': -0.5 },
        done: 'SN2 no carbono menos substituído; o O fica como alcóxido no carbono terciário.',
        slots: [{ title: 'produto (após protonação)', options: [{ s: M.metoxiBasico(), ok: true, why: '1-metoxi-2-metilpropan-2-ol.' }, { s: M.metoxiAcido(), ok: false, why: 'Esse é o produto da abertura ácida (ataque no C terciário).' }] }],
      };
    })(),
  },
  {
    title: 'Formação do epóxido a partir da haloidrina', intro: 'O alcóxido (já desprotonado) desloca o brometo por SN2 intramolecular.',
    puzzle: (() => {
      const i = noArr(halohydrinEpoxFrames()[2]);
      i.texts = [];
      return {
        s: i,
        sites: { lpO: { k: 'lp', a: 5, ang: 90, label: 'par livre do O⁻' }, C: { k: 'atom', a: 3, label: 'CH₂' }, CBr: { k: 'bond', b: [3, 4], label: 'ligação C–Br' }, Br: { k: 'atom', a: 4, label: 'Br' }, Cq: { k: 'atom', a: 0, label: 'C quaternário' } },
        sources: ['lpO', 'CBr'], targets: ['C', 'Br', 'Cq'],
        answer: [['lpO', 'C'], ['CBr', 'Br']],
        msgs: { 'lpO>Cq': 'O O⁻ já está ligado a esse carbono; ele ataca o CH₂ vizinho, que tem o Br.' },
        bend: { 'lpO>C': -0.55, 'CBr>Br': -0.6 },
        done: 'SN2 intramolecular: O⁻ e Br precisam estar anti (O ataca pelo lado oposto ao Br).',
        slots: [{ title: 'produto', options: [{ s: M.dimetiloxirano22(), ok: true, why: '2,2-dimetiloxirano + Br⁻.' }, { s: M.diolMetilpropano(), ok: false, why: 'O diol exigiria ataque de OH⁻ externo.' }] }],
      };
    })(),
  },
  {
    title: 'Abertura ácida: protonação do epóxido', intro: 'O par livre do O do epóxido captura o H⁺ (de CH₃OH₂⁺). Depois escolha o intermediário.',
    puzzle: (() => {
      const r = epoxAcid()[0];
      return {
        s: r,
        sites: { lpO: { k: 'lp', a: 2, ang: 90, label: 'par livre do O do epóxido' }, H: { k: 'atom', a: 5, label: 'H ácido' }, HO: { k: 'bond', b: [5, 6], label: 'ligação H–O⁺' }, Ow: { k: 'atom', a: 6, label: 'O do metanol protonado' }, C2: { k: 'atom', a: 1, label: 'C terciário' } },
        sources: ['lpO', 'HO'], targets: ['H', 'Ow', 'C2'],
        answer: [['lpO', 'H'], ['HO', 'Ow']],
        msgs: { 'lpO>C2': 'O O do epóxido é a base aqui: ele captura o H⁺.' },
        bend: { 'lpO>H': 0.4, 'HO>Ow': -0.6 },
        done: 'Epóxido protonado: o O⁺ é um grupo abandonador muito melhor.',
        slots: [{ title: 'intermediário', options: [{ s: noArr(epoxAcid()[2]), ok: true, why: 'Epóxido protonado, com δ+ maior no carbono terciário (ligação C–O mais longa). Não é um carbocátion livre.' }, { s: freeCation(), ok: false, why: 'Um carbocátion livre não explicaria a inversão (ataque anti) observada: o nucleófilo ataca enquanto a ligação C–O ainda existe.' }] }],
      };
    })(),
  },
];

/* ===================================================================
 * Exercícios resolvidos (8 níveis)
 * =================================================================== */
const L1 = 'Estrutura e nomenclatura', L2 = 'Propriedades físicas', L3 = 'Acidez e basicidade', L4 = 'Reações de álcoois', L5 = 'Oxidação', L6 = 'Éteres e Williamson', L7 = 'Epóxidos', L8 = 'Síntese integrada';
export const SOLVED = [
  { level: L1, title: 'Classifique os álcoois', q: 'Classifique como 1°, 2° ou 3°: (a) propan-2-ol; (b) 2-metilpropan-1-ol; (c) 2-metilbutan-2-ol; (d) fenilmetanol.', think: 'Olhe para o carbono ligado ao OH e conte quantos carbonos estão ligados a ele.', hint: 'O critério é o carbono carbinólico, não o tamanho da molécula.', steps: ['(a) C do OH ligado a 2 C → <b>2°</b>.', '(b) C do OH é um CH₂ ligado a 1 C → <b>1°</b> (a ramificação está longe).', '(c) C do OH ligado a 3 C → <b>3°</b>.', '(d) C do OH ligado ao anel (1 C) → <b>1°</b> (benzílico).'], answer: '2°, 1°, 3°, 1°.' },
  { level: L1, title: 'Nomeie o álcool', q: 'Dê o nome IUPAC.', fig: f('metilbutan2ol', '?'), think: 'Cadeia mais longa contendo o C do OH; numere para dar o menor número ao OH.', hint: 'O OH e a metila estão no mesmo carbono.', steps: ['Cadeia principal: 4 C (butano), contendo o C do OH.', 'Numeração: o OH fica em C2 pela esquerda (C3 pela direita).', 'Substituinte: metila em C2.', 'Sufixo -ol, com localizador.'], answer: '<b>2-metilbutan-2-ol</b>.' },
  { level: L1, title: 'Diol', q: 'Nomeie HOCH₂CH₂CH(OH)CH₃.', fig: f('butano13diol', ''), think: 'Dois OH: sufixo "diol" e o "o" de butano é mantido.', hint: 'Numere para dar os menores localizadores ao conjunto de OH.', steps: ['4 C, OH nos C1 e C3 (pela esquerda) ou C2 e C4 (pela direita).', 'Conjunto {1,3} < {2,4}.', 'Nome: butano + -1,3-diol.'], answer: '<b>butano-1,3-diol</b>.' },
  { level: L1, title: 'Nomeie o éter', q: 'Nomeie (CH₃)₂CH–O–CH₃ pela IUPAC (alcoxialcano) e pelo nome usual.', fig: f('metoxipropano2', ''), think: 'O grupo menor + O vira "alcóxi"; o maior é a cadeia principal.', hint: 'CH₃O– = metoxi.', steps: ['Grupo menor: CH₃ → metoxi.', 'Cadeia principal: propano, com o metoxi em C2.', 'Nome usual: lista os dois grupos + "éter".'], answer: '<b>2-metoxipropano</b> (isopropil metil éter).' },
  { level: L2, title: 'Ponto de ebulição', q: 'Por que o etanol (P.E. 78 °C) ferve 100 °C acima do éter dimetílico (−24 °C), sendo isômeros?', think: 'Mesma massa molar: compare as forças intermoleculares.', hint: 'Quem tem H ligado a O?', steps: ['Ambos têm 46 g/mol e são polares.', 'O etanol tem O–H: cada molécula <b>doa e aceita</b> ligações de H.', 'O éter não tem H no O: <b>não doa</b> — entre suas moléculas só há dipolo–dipolo e dispersão.', 'Romper as ligações de H exige muito mais energia → P.E. muito maior.'], answer: 'Ligações de hidrogênio entre as moléculas de etanol.' },
  { level: L2, title: 'Solubilidade', q: 'Ordene por solubilidade em água: hexan-1-ol, etanol, butan-1-ol.', think: 'O OH é polar; a cadeia é apolar.', hint: 'Quanto maior a parte hidrocarbônica, menor a solubilidade.', steps: ['Etanol: o OH domina → miscível.', 'Butan-1-ol: ≈ 7 g/100 mL.', 'Hexan-1-ol: ≈ 0,6 g/100 mL.'], answer: 'etanol > butan-1-ol > hexan-1-ol.' },
  { level: L2, title: 'Éteres como solventes', q: 'Por que o éter dietílico dissolve bem compostos orgânicos e ainda é parcialmente solúvel em água?', think: 'O que o O do éter faz e o que ele não faz?', hint: 'Aceptor × doador.', steps: ['As duas etilas tornam a molécula pouco polar: dissolve compostos orgânicos.', 'O O tem pares livres: aceita ligações de H da água (≈ 6 g/100 mL).', 'Não há H em O: o éter não se associa fortemente consigo mesmo → P.E. baixo (35 °C), fácil de evaporar.'], answer: 'Pouco polar, aceptor de ligações de H e volátil.' },
  { level: L3, title: 'Base adequada', q: 'Qual base converte o etanol completamente em etóxido: NaOH ou NaH?', think: 'Compare os pKa dos ácidos conjugados com o do etanol (≈ 16).', hint: 'pKa(H₂O) = 15,7; pKa(H₂) ≈ 35.', steps: ['Com NaOH, o ácido conjugado é a água (15,7) — praticamente igual ao etanol: equilíbrio ≈ 1:1.', 'Com NaH, o ácido conjugado é H₂ (≈ 35): K ≈ 10¹⁹ a favor do etóxido.', 'Além disso o H₂ sai como gás: irreversível.'], answer: '<b>NaH</b>.' },
  { level: L3, title: 'Fenol × etanol', q: 'Por que o fenol (pKa 10) é muito mais ácido que o etanol (pKa 16)?', think: 'Compare as bases conjugadas.', hint: 'Onde fica a carga negativa no fenóxido?', steps: ['Ambos perdem o H do O–H.', 'No etóxido, a carga fica concentrada no O.', 'No fenóxido, a carga se deslocaliza no anel por <b>ressonância</b> (orto e para).', 'Base conjugada mais estável → ácido mais forte.'], answer: 'Estabilização do fenóxido por ressonância.' },
  { level: L3, title: 'Acidez de álcoois', q: 'Ordene a acidez: metanol, terc-butanol, etanol.', think: 'O efeito principal em solução é a solvatação do alcóxido.', hint: 'Alcóxido volumoso é pior solvatado.', steps: ['CH₃O⁻: pequeno, muito bem solvatado → mais estável.', '(CH₃)₃CO⁻: volumoso, a água não o envolve tão bem → menos estável.', 'pKa: metanol 15,5 < etanol 16 < terc-butanol 18.'], answer: 'metanol > etanol > terc-butanol.' },
  { level: L4, title: 'Álcool 1° + HBr', q: 'Explique o mecanismo de butan-1-ol + HBr → 1-bromobutano.', fig: f('butan1ol', 'butan-1-ol'), think: 'O OH⁻ é um grupo abandonador ruim. Como ativá-lo?', hint: 'Protonação, depois SN2.', steps: ['O par livre do O captura o H⁺ → ROH₂⁺ (íon alquiloxônio).', 'Agora o grupo abandonador é H₂O (base fraca, bom grupo abandonador).', 'Carbono 1°: não forma carbocátion; o Br⁻ ataca pelo lado oposto (SN2) e a água sai.'], answer: 'Protonação + SN2.' },
  { level: L4, title: 'Álcool 3° + HCl', q: 'Por que o terc-butanol reage com HCl à temperatura ambiente e o butan-1-ol quase não reage sem ZnCl₂?', think: 'Que intermediário cada um pode formar?', hint: 'SN1 × SN2.', steps: ['3°: ROH₂⁺ perde água → carbocátion 3° estável (SN1, rápida).', '1°: não forma cátion; depende da SN2 com Cl⁻, nucleófilo fraco em meio prótico → lenta.', 'O ZnCl₂ (ácido de Lewis) coordena o O e acelera.'], answer: 'SN1 (3°) rápida × SN2 (1°) lenta.' },
  { level: L4, title: 'Estereoquímica com PBr₃', q: '(R)-butan-2-ol + PBr₃ → ? Indique a configuração.', fig: f('butan2olR', '(R)-butan-2-ol'), think: 'Qual etapa forma a ligação C–Br?', hint: 'O Br⁻ ataca pelo lado oposto ao O ativado.', steps: ['O O ataca o P: forma-se R–O–PBr₂ (protonado), excelente grupo abandonador.', 'Br⁻ faz SN2 no carbono: <b>inversão</b>.', 'Sem carbocátion: sem racemização e sem rearranjo.'], answer: '<b>(S)-2-bromobutano</b>.', solFig: f('bromobutano2S', '(S)-2-bromobutano') },
  { level: L4, title: 'Tosilato: retenção e depois inversão', q: '(R)-butan-2-ol: 1. TsCl, piridina 2. NaCN. Qual a configuração final?', think: 'Em qual etapa a ligação C–O é rompida?', hint: 'A tosilação não toca o carbono.', steps: ['TsCl: o O ataca o S; C–O intacta → tosilato com <b>retenção</b> (R).', 'NaCN: SN2 no carbono → <b>inversão</b>.', 'Resultado: uma única inversão no total.'], answer: '2-metilbutanonitrila com configuração invertida em relação ao álcool.' },
  { level: L4, title: 'Desidratação com rearranjo', q: '3,3-dimetilbutan-2-ol + H₂SO₄, Δ → produto principal?', fig: f('dimetilbutan2ol', '3,3-dimetilbutan-2-ol'), think: 'Que carbocátion se forma primeiro? Ele pode melhorar?', hint: 'Há um carbono quaternário vizinho.', steps: ['Protonação e saída da água → cátion 2°.', 'Migração 1,2 de metila → cátion 3°.', 'Perda do Hβ que forma a dupla mais substituída (Zaitsev).'], answer: '<b>2,3-dimetilbut-2-eno</b>.', solFig: f('dimetilbut2eno', '2,3-dimetilbut-2-eno') },
  { level: L5, title: 'PCC × Jones', q: 'Butan-1-ol com (a) PCC e (b) reagente de Jones.', think: 'Um oxidante é anidro; o outro trabalha em água.', hint: 'Em água o aldeído forma hidrato.', steps: ['(a) PCC (em CH₂Cl₂): para no <b>butanal</b>.', '(b) Jones (CrO₃/H₂SO₄/H₂O): o aldeído hidratado é oxidado de novo → <b>ácido butanoico</b>.'], answer: 'butanal; ácido butanoico.' },
  { level: L5, title: 'Álcool 3°', q: 'Por que o 2-metilpropan-2-ol não é oxidado pelo PCC?', think: 'O que acontece com o carbono carbinólico na oxidação?', hint: 'Forma-se C=O às custas de qual ligação?', steps: ['Na oxidação, o C do OH perde um H para formar C=O.', 'No álcool 3° esse carbono não tem H.', 'Seria preciso romper ligações C–C: não ocorre em condições simples.'], answer: 'Não há H no carbono carbinólico.' },
  { level: L5, title: 'Teste com dicromato/Jones', q: 'Três frascos (álcool 1°, 2°, 3°) recebem Cr(VI) laranja. O que se observa?', think: 'Quais são oxidados?', hint: 'Cr(VI) laranja → Cr(III) verde.', steps: ['1° e 2°: são oxidados → solução fica verde (Cr³⁺).', '3°: sem reação → continua laranja.'], answer: 'Verde, verde, laranja.' },
  { level: L6, title: 'Qual lado vira haleto?', q: 'Planeje a síntese do terc-butil metil éter (MTBE) por Williamson.', fig: f('mtbe', 'MTBE'), think: 'Há duas desconexões. Qual delas usa um haleto que faz SN2?', hint: 'Haleto terciário + base forte = E2.', steps: ['Rota A: CH₃O⁻ + (CH₃)₃CBr → o alcóxido age como base: <b>E2</b> → metilpropeno. ✘', 'Rota B: (CH₃)₃CO⁻ + CH₃I → SN2 em carbono metílico. ✔', 'Regra: o haleto deve ser metílico ou primário; o lado ramificado fica no alcóxido.'], answer: '(CH₃)₃CO⁻ Na⁺ + CH₃I.' },
  { level: L6, title: 'Clivagem com HI', q: 'CH₃–O–CH₂CH₃ + HI (1 equiv.) → ?', fig: f('metoxietano', ''), think: 'Protone o O; o I⁻ ataca qual carbono?', hint: 'SN2: carbono menos impedido.', steps: ['Protonação do O (oxônio).', 'I⁻ ataca o CH₃ (menos impedido) por SN2.', 'Sai o etanol.'], answer: '<b>CH₃I + CH₃CH₂OH</b>.' },
  { level: L6, title: 'Clivagem de éter arílico', q: 'Anisol + HBr (excesso) → ?', fig: f('anisol', 'anisol'), think: 'Pode haver SN2 em um carbono do anel?', hint: 'C(sp²) do anel não sofre ataque pelo lado oposto.', steps: ['Protonação do O.', 'Br⁻ ataca o CH₃ (SN2).', 'A ligação O–C(arila) não se rompe: forma-se fenol (que não vira bromobenzeno).'], answer: '<b>fenol + CH₃Br</b>.' },
  { level: L6, title: 'Éter terciário: SN1', q: '(CH₃)₃C–O–CH₃ + HI → ?', think: 'Com um grupo terciário, qual mecanismo de clivagem domina?', hint: 'Carbocátion 3°.', steps: ['Protonação do O.', 'Saída de CH₃OH formando o cátion terciário (SN1/E1).', 'I⁻ captura o cátion.'], answer: '(CH₃)₃CI + CH₃OH (o lado terciário reage por SN1).' },
  { level: L7, title: 'Básico × ácido', q: '2,2-dimetiloxirano com (a) CH₃O⁻/CH₃OH e (b) CH₃OH/H₂SO₄.', fig: f('dimetiloxirano22', ''), think: 'Controle estérico (base) × controle eletrônico (ácido).', hint: 'Em ácido o O é protonado primeiro.', steps: ['(a) SN2: ataque no CH₂ (menos impedido).', '(b) O protonado; o C terciário sustenta melhor δ+; o CH₃OH ataca esse carbono pelo lado oposto.'], answer: '(a) 1-metoxi-2-metilpropan-2-ol; (b) 2-metoxi-2-metilpropan-1-ol.', solFig: [f('metoxiBasico', '(a) básico'), f('metoxiAcido', '(b) ácido')] },
  { level: L7, title: 'Estereoquímica anti', q: 'Óxido de ciclo-hexeno + CH₃O⁻/CH₃OH → ? (estereoquímica)', fig: f('oxidoCiclohexeno', ''), think: 'De que lado o nucleófilo entra?', hint: 'Lado oposto ao O.', steps: ['SN2: o CH₃O⁻ ataca pelo lado oposto ao O.', 'O O fica na face original e o OCH₃ na face oposta → <b>trans</b>.', 'Ataques nos dois carbonos (equivalentes) dão os dois enantiômeros: racêmico.'], answer: '<b>trans</b>-2-metoxiciclo-hexan-1-ol (racêmico).', solFig: f('transMetoxiCiclohexanol', 'trans') },
  { level: L7, title: 'Grignard + óxido de etileno', q: 'CH₃CH₂MgBr + óxido de etileno; depois H₃O⁺.', think: 'O carbono do Grignard é nucleofílico.', hint: 'A cadeia cresce dois carbonos.', steps: ['O carbânion (CH₃CH₂⁻) ataca um CH₂ do epóxido (SN2), abrindo o anel.', 'Forma-se o alcóxido de magnésio.', 'H₃O⁺ protona → álcool primário com 2 C a mais.'], answer: '<b>butan-1-ol</b>.', solFig: f('butanolDeOxirano', 'butan-1-ol') },
  { level: L7, title: 'Epóxido meso', q: 'cis-2,3-dimetiloxirano + H₂O/H⁺ → ?', fig: f('cisDimetiloxirano', 'cis (meso)'), think: 'A abertura é anti. O epóxido é meso.', hint: 'Ataques nos dois carbonos são equivalentes por simetria.', steps: ['O nucleófilo entra pelo lado oposto ao O: inversão no C atacado.', 'O outro carbono mantém a configuração.', 'Atacar C2 ou C3 dá enantiômeros: mistura racêmica de (2R,3R) e (2S,3S).'], answer: 'Butano-2,3-diol racêmico (2R,3R)/(2S,3S).', solFig: f('butanodiolRR', '(2R,3R) — e o enantiômero') },
  { level: L8, title: 'Do álcool ao éter', q: 'Como preparar o 1-etoxibutano a partir de butan-1-ol e etanol?', think: 'Williamson: um vira alcóxido, o outro vira haleto/tosilato. Ambos são 1°.', hint: 'Qualquer combinação funciona com 1°.', steps: ['Butan-1-ol + NaH → butóxido.', 'Etanol + PBr₃ → bromoetano (ou TsCl → tosilato de etila).', 'Butóxido + bromoetano → SN2 → 1-etoxibutano.'], answer: 'NaH no butanol; PBr₃ no etanol; depois SN2.' },
  { level: L8, title: 'Alongar a cadeia', q: 'Converta bromoetano em butan-1-ol.', think: 'Adicione 2 C com uma nova ligação C–C.', hint: 'Grignard + óxido de etileno.', steps: ['CH₃CH₂Br + Mg (éter) → CH₃CH₂MgBr.', '+ óxido de etileno → alcóxido.', 'H₃O⁺ → butan-1-ol.'], answer: '1. Mg, éter 2. óxido de etileno 3. H₃O⁺.' },
  { level: L8, title: 'Alceno → epóxido → éter-álcool', q: '2-metilpropeno → 1-metoxi-2-metilpropan-2-ol. Proponha os reagentes.', think: 'Primeiro forme o epóxido; depois escolha a condição que coloca o OCH₃ no CH₂.', hint: 'Básico → carbono menos substituído.', steps: ['mCPBA → 2,2-dimetiloxirano.', 'CH₃ONa/CH₃OH (básico) → OCH₃ no CH₂, OH no C terciário.', 'Com CH₃OH/H⁺ o regioisômero seria o outro.'], answer: '1. mCPBA 2. CH₃O⁻ Na⁺, CH₃OH.' },
];

/* ===================================================================
 * Exercícios propostos
 * =================================================================== */
const cisDiolCy = () => R6({ sub: { 0: [['OH', 'w']], 1: [['OH', 'w']] } });
const metilciclohexanol1 = () => R6({ sub: { 0: [['OH', 1, 95, ox], ['', 1, 145]] } });
const easy = [
  { title: 'Classificação', type: 'match', q: 'Associe o álcool à classe.', pairs: [['etanol', '1°'], ['propan-2-ol', '2°'], ['2-metilpropan-2-ol', '3°'], ['fenilmetanol', '1° (benzílico)']], e: 'Conte os carbonos ligados ao C do OH.' },
  { title: 'Hibridização do O', type: 'mc', q: 'O oxigênio de álcoois e éteres é:', o: ['sp³, com dois pares livres', 'sp², com um par livre', 'sp, linear', 'sp³ sem pares livres'], a: 0, e: 'Quatro domínios (2 ligações + 2 pares): geometria angular.' },
  { title: 'Nome do álcool', type: 'mc', q: 'Nome IUPAC de (CH₃)₂CHOH:', o: ['propan-2-ol', 'propan-1-ol', '2-metiletanol', 'isopropanol-2'], a: 0, e: 'Isopropanol é o nome usual.' },
  { title: 'Nome do éter', type: 'mc', q: 'Nome IUPAC de CH₃CH₂–O–CH₃:', o: ['metoxietano', 'etoximetano', 'propan-1-ol', 'dimetil éter'], a: 0, e: 'O grupo menor vira o alcóxi.' },
  { title: 'Ligação de H', type: 'tf', q: 'Verdadeiro ou falso:', items: [['Álcoois doam e aceitam ligações de H.', 'V'], ['Éteres doam ligações de H.', 'F'], ['Éteres aceitam ligações de H da água.', 'V'], ['Alcanos fazem ligação de H com a água.', 'F']], e: 'Só H ligado a O (ou N, F) é doador.' },
  { title: 'Ponto de ebulição', type: 'order', q: 'Ordene do <b>maior</b> para o <b>menor</b> ponto de ebulição.', items: [{ id: 'a', s: M.etanol(), label: 'etanol' }, { id: 'b', s: M.eterDimetilico(), label: 'éter dimetílico' }, { id: 'c', label: 'propano' }], correct: ['a', 'b', 'c'], top: 'maior P.E.', bottom: 'menor P.E.', explain: 'Ligação de H > dipolo–dipolo > dispersão (78 > −24 > −42 °C).' },
  { title: 'Solubilidade', type: 'order', q: 'Ordene do <b>mais solúvel</b> ao <b>menos solúvel</b> em água.', items: [{ id: 'm', label: 'metanol' }, { id: 'b', label: 'butan-1-ol' }, { id: 'h', label: 'hexan-1-ol' }, { id: 'o', label: 'octan-1-ol' }], correct: ['m', 'b', 'h', 'o'], top: 'mais solúvel', bottom: 'menos solúvel', explain: 'A cadeia apolar cresce; a parte polar (OH) é a mesma.' },
  { title: 'Base para alcóxido', type: 'mc', q: 'Qual reagente converte completamente o etanol em etóxido de sódio?', o: ['NaH', 'NaHCO₃', 'H₂O', 'HCl'], a: 0, e: 'H⁻ é base muito mais forte que o etóxido; sai H₂.' },
  { title: 'Grupo abandonador', type: 'mc', q: 'Por que álcoois não sofrem SN2 diretamente com Br⁻ (sem ácido)?', o: ['OH⁻ é uma base forte: péssimo grupo abandonador', 'o Br⁻ não é nucleófilo', 'o C–O é forte demais para qualquer reação', 'álcoois não têm carbono eletrofílico'], a: 0, e: 'É preciso ativar o OH (H⁺, PBr₃, SOCl₂, TsCl).' },
  { title: 'Oxidação', type: 'match', q: 'Associe o álcool ao produto com PCC.', pairs: [['butan-1-ol', 'butanal'], ['butan-2-ol', 'butanona'], ['2-metilpropan-2-ol', 'sem reação']], e: '1° → aldeído; 2° → cetona; 3° não oxida.' },
  { title: 'Produto com PBr₃', type: 'mc', struct: true, q: 'Butan-1-ol + PBr₃ → ?', o: [opt('bromobutano1'), opt('bromobutano2'), opt('but1eno'), opt('butanal')], a: 0, e: 'SN2 sobre o O ativado.' },
  { title: 'Produto com PCC', type: 'mc', struct: true, q: 'Ciclo-hexanol + PCC → ?', o: [opt('ciclohexanona'), opt('ciclohexanol'), opt('metilciclohexeno'), { s: cisDiolCy() }], a: 0, e: 'Álcool 2° → cetona.' },
  { title: 'Epóxido', type: 'mc', q: 'Por que epóxidos são muito mais reativos que éteres acíclicos?', o: ['tensão do anel de 3 membros (ângulos ≈ 60°)', 'o O do epóxido é sp²', 'epóxidos têm H ácido', 'epóxidos são iônicos'], a: 0, e: 'Abrir o anel libera ≈ 115 kJ/mol de tensão.' },
  { title: 'Peróxidos', type: 'tf', q: 'Sobre segurança com éteres:', items: [['Éter dietílico e THF podem formar peróxidos ao longo do tempo.', 'V'], ['Peróxidos de éteres são perigosos (podem explodir ao concentrar).', 'V'], ['Frascos de éter abertos há muito tempo devem ser destilados até a secura.', 'F']], e: 'Nunca concentre éteres velhos; siga as normas de segurança da instituição.' },
  { title: 'Alcoximercuração', type: 'mc', q: 'Propeno: 1. Hg(OAc)₂, CH₃OH 2. NaBH₄ → ?', o: ['2-metoxipropano (Markovnikov)', '1-metoxipropano', 'propan-2-ol', 'propano-1,2-diol'], a: 0, e: 'Como a oximercuração, mas com álcool como nucleófilo.' },
];
const mid = [
  { title: 'Monte o mecanismo (protonação)', type: 'arrows', puzzle: PUZZLES[0].puzzle, q: 'Setas da protonação do butan-1-ol pelo HBr.', e: 'Par do O → H; H–Br → Br.' },
  { title: 'Monte o mecanismo (SN2)', type: 'arrows', puzzle: PUZZLES[1].puzzle, q: 'Setas do ataque do Br⁻ ao álcool protonado.', e: 'Par do Br⁻ → C; C–O → O.' },
  { title: 'Monte o mecanismo (Williamson)', type: 'arrows', puzzle: PUZZLES[2].puzzle, q: 'Setas da SN2 de Williamson.', e: 'Par do O⁻ → CH₃; C–I → I.' },
  { title: 'Mecanismo e classe', type: 'match', q: 'Associe o álcool ao mecanismo com HBr.', pairs: [['butan-1-ol', 'SN2 sobre ROH₂⁺'], ['2-metilpropan-2-ol', 'SN1 (cátion 3°)'], ['3,3-dimetilbutan-2-ol', 'SN1 com migração de metila']], e: 'A classe do carbono decide se há carbocátion.' },
  { title: 'Rearranjo', type: 'mc', struct: true, q: '3,3-dimetilbutan-2-ol + HBr → produto principal:', o: [opt('bromoDimetilbutano23'), opt('bromoDimetilbutano22'), opt('dimetilbut2eno'), opt('dimetilbutanona')], a: 0, e: 'Cátion 2° → migração de CH₃ → cátion 3°.' },
  { title: 'Sem rearranjo', type: 'mc', struct: true, q: '3,3-dimetilbutan-2-ol + PBr₃ → ?', o: [opt('bromoDimetilbutano22'), opt('bromoDimetilbutano23'), opt('dimetilbut2eno'), opt('tbubr')], a: 0, e: 'Sem carbocátion → sem rearranjo (a reação é lenta pelo impedimento).' },
  { title: 'Estereoquímica', type: 'mc', struct: true, q: '(R)-butan-2-ol + SOCl₂, piridina → ?', o: [opt('clorobutano2S'), { s: Z(4, { up: false, sub: { 1: [['Cl', 'w', undefined, { cls: 'add' }]] } }) }, opt('clorobutano1'), opt('but2enoE')], a: 0, e: 'Com piridina: SN2 → inversão.' },
  { title: 'Desidratação', type: 'mc', struct: true, q: '2-metilbutan-2-ol + H₂SO₄, Δ → principal:', o: [{ s: (() => { const s = Z(4, { dbl: [1], sub: { 1: [['', 1, 240]] } }); return s; })(), t: '' }, { s: Z(4, { sub: { 1: [['', 2, 240]] } }) }, opt('metilbut1eno3'), opt('metilpropeno')], a: 0, e: 'E1 via cátion 3°; Zaitsev → 2-metilbut-2-eno (trissubstituído).' },
  { title: 'Desidratação de 1°', type: 'tf', q: 'Sobre a desidratação do butan-1-ol:', items: [['Forma-se um carbocátion primário livre.', 'F'], ['Exige condições mais severas que a de álcoois 3°.', 'V'], ['O but-2-eno pode predominar por isomerização em meio ácido.', 'V']], e: 'Álcoois 1°: perda de H₂O assistida (tipo E2); o alceno pode isomerizar.' },
  { title: 'Oxidante certo', type: 'mc', q: 'Para converter butan-1-ol em butanal, use:', o: ['PCC (CH₂Cl₂)', 'CrO₃, H₂SO₄, H₂O', 'KMnO₄, Δ', 'NaBH₄'], a: 0, e: 'Oxidante anidro para no aldeído. (Dess–Martin e Swern também.)' },
  { title: 'Williamson: escolha', type: 'mc', q: 'Melhor rota para o etil isopropil éter:', o: ['(CH₃)₂CHO⁻ + CH₃CH₂Br', 'CH₃CH₂O⁻ + (CH₃)₂CHBr', '(CH₃)₂CHOH + CH₃CH₂OH, H₂SO₄', 'CH₃CH₂Br + (CH₃)₂CHBr'], a: 0, e: 'Haleto primário; com o haleto 2° a E2 compete.' },
  { title: 'Williamson impossível', type: 'mc', q: 'Por que CH₃O⁻ + bromobenzeno não dá anisol?', o: ['C(sp²) do anel não sofre SN2', 'o metóxido é fraco demais', 'o bromobenzeno sofre E2', 'forma-se tolueno'], a: 0, e: 'Use fenóxido + CH₃I.' },
  { title: 'Clivagem', type: 'mc', q: 'CH₃OCH₂CH₂CH₃ + HI (1 equiv.) → ?', o: ['CH₃I + CH₃CH₂CH₂OH', 'CH₃OH + CH₃CH₂CH₂I', 'CH₃I + propeno', 'não reage'], a: 0, e: 'SN2 no carbono menos impedido (metila).' },
  { title: 'Abertura básica', type: 'mc', struct: true, q: '2,2-dimetiloxirano + NaCN → ? (após protonação)', o: [opt('nitrilaEpox'), { s: Z(4, { lab: { 3: 'OH' }, opt: { 3: ox }, sub: { 1: [['CN', 1, 300, { cls: 'add' }], ['', 1, 240]] } }) }, opt('diolMetilpropano'), opt('metoxiBasico')], a: 0, e: 'CN⁻ ataca o CH₂ (menos impedido).' },
  { title: 'Abertura ácida', type: 'mc', struct: true, q: '2,2-dimetiloxirano + CH₃OH, H⁺ → ?', o: [opt('metoxiAcido'), opt('metoxiBasico'), opt('mtbe'), opt('diolMetilpropano')], a: 0, e: 'Nu fraco no carbono mais substituído.' },
  { title: 'Condição → carbono atacado', type: 'match', q: 'Associe a condição ao carbono atacado no 2-metiloxirano.', pairs: [['CH₃O⁻, CH₃OH', 'C menos substituído (CH₂)'], ['CH₃OH, H₂SO₄', 'C mais substituído (CH)'], ['CH₃MgBr; H₃O⁺', 'C menos substituído (CH₂)'], ['H₂O, H₃O⁺', 'C mais substituído (CH)']], e: 'Básico/organometálico: estérico. Ácido: eletrônico.' },
  { title: 'Reagente → transformação', type: 'match', q: 'Associe.', pairs: [['TsCl, piridina', 'ativa o OH com retenção'], ['SOCl₂', 'álcool → cloreto'], ['NaH', 'álcool → alcóxido'], ['mCPBA', 'alceno → epóxido'], ['HI (excesso)', 'cliva éteres']], e: 'Cada reagente tem um papel típico.' },
  { title: 'Função → propriedade', type: 'match', q: 'Associe.', pairs: [['álcool', 'doador e aceptor de ligação de H'], ['éter', 'só aceptor; bom solvente'], ['epóxido', 'tensão de anel; muito reativo'], ['alcóxido', 'base forte e nucleófilo']], e: 'Estrutura → propriedade → reatividade.' },
  { title: 'Grignard', type: 'mc', struct: true, q: 'Óxido de etileno: 1. CH₃CH₂MgBr 2. H₃O⁺ → ?', o: [opt('butanolDeOxirano'), opt('butan2ol'), opt('etilenoglicol'), opt('eterDietilico')], a: 0, e: 'Nova C–C; cadeia + 2 C.' },
  { title: 'Monte o mecanismo (abertura básica)', type: 'arrows', puzzle: PUZZLES[3].puzzle, q: 'Setas da abertura do 2,2-dimetiloxirano por CH₃O⁻.', e: 'Par do CH₃O⁻ → CH₂; C1–O → O.' },
];
const hard = [
  { title: 'Monte o mecanismo (haloidrina → epóxido)', type: 'arrows', puzzle: PUZZLES[4].puzzle, q: 'SN2 intramolecular.', e: 'O⁻ → CH₂; C–Br → Br.' },
  { title: 'Monte o mecanismo (abertura ácida)', type: 'arrows', puzzle: PUZZLES[5].puzzle, q: 'Protonação do epóxido.', e: 'Par do O → H; H–O⁺ → O.' },
  { title: 'Detecte o erro (1)', type: 'mc', q: '"Na reação do butan-1-ol com HBr, o OH⁻ sai e o Br⁻ entra." Qual o erro?', o: ['OH⁻ é um grupo abandonador ruim; quem sai é a H₂O do álcool protonado', 'o Br⁻ não é nucleófilo', 'deveria formar alceno', 'nenhum'], a: 0, e: 'Primeiro o álcool é protonado.' },
  { title: 'Detecte o erro (2)', type: 'mc', q: '"Para preparar o 2-bromo-2-metilpropano, trate o terc-butanol com PBr₃." Qual o problema?', o: ['PBr₃ depende de SN2, bloqueada em C terciário; use HBr (SN1)', 'PBr₃ oxida o álcool', 'o produto seria um éter', 'nenhum'], a: 0, e: 'Álcoois 3° → HX.' },
  { title: 'Detecte o erro (3)', type: 'mc', q: '"MTBE = CH₃O⁻Na⁺ + (CH₃)₃CBr." Qual o erro?', o: ['haleto terciário + base forte dá E2 (metilpropeno)', 'o metóxido não reage', 'forma-se metanol', 'nenhum'], a: 0, e: 'Inverta: (CH₃)₃CO⁻ + CH₃I.' },
  { title: 'Detecte o erro (4)', type: 'mc', q: '"Na abertura ácida, forma-se um carbocátion terciário livre que é atacado pelos dois lados." Qual o erro?', o: ['não há carbocátion livre: o Nu ataca o epóxido protonado pelo lado oposto (anti, inversão)', 'em meio ácido o ataque é no CH₂', 'o epóxido não é protonado', 'nenhum'], a: 0, e: 'O ET tem caráter catiônico parcial, mas a ligação C–O ainda existe.' },
  { title: 'Detecte o erro (5)', type: 'mc', q: '"Em meio básico, o CH₃O⁻ ataca o carbono mais substituído do 2-metiloxirano." Qual o erro?', o: ['em base (SN2) o ataque é no carbono menos impedido', 'CH₃O⁻ não abre epóxidos', 'deveria formar alceno', 'nenhum'], a: 0, e: 'Controle estérico.' },
  { title: 'Detecte o erro (6)', type: 'mc', q: '"2-metilpropan-2-ol + Jones → 2-metilpropanal." Qual o erro?', o: ['álcool 3° não tem H no C do OH: não é oxidado', 'o produto seria um ácido', 'Jones não oxida álcoois', 'nenhum'], a: 0, e: 'A solução permanece laranja.' },
  { title: 'Detecte o erro (7)', type: 'mc', q: '"Anisol + HBr → bromobenzeno + metanol." Qual o erro?', o: ['o C(sp²) do anel não sofre SN2: formam-se fenol + CH₃Br', 'o anisol não reage com HBr', 'forma-se tolueno', 'nenhum'], a: 0, e: 'O Br⁻ ataca o CH₃.' },
  { title: 'Síntese 1', type: 'mc', q: 'Melhor sequência: butan-1-ol → pentanonitrila (CH₃CH₂CH₂CH₂CN).', o: ['1. TsCl, piridina 2. NaCN', 'NaCN direto', '1. PCC 2. NaCN', '1. H₂SO₄, Δ 2. HCN'], a: 0, e: 'Ative o OH; depois SN2 com CN⁻.' },
  { title: 'Síntese 2', type: 'mc', q: 'Como obter (S)-2-azidobutano a partir de (R)-butan-2-ol (uma inversão)?', o: ['1. TsCl, piridina 2. NaN₃', '1. PBr₃ 2. NaN₃', 'HN₃ direto', '1. PCC 2. NaN₃'], a: 0, e: 'Tosilação (retenção) + SN2 (inversão) = uma inversão. Com PBr₃ seriam duas inversões (volta ao R).' },
  { title: 'Síntese 3', type: 'mc', q: '2-metilpropeno → 2-metoxi-2-metilpropan-1-ol:', o: ['1. mCPBA 2. CH₃OH, H₂SO₄ (cat.)', '1. mCPBA 2. CH₃ONa, CH₃OH', '1. H₃O⁺ 2. CH₃I', '1. BH₃ 2. CH₃OH'], a: 0, e: 'Ácido: OCH₃ no carbono terciário.' },
  { title: 'Síntese 4 (desconexão)', type: 'mc', q: 'Melhor desconexão de Williamson para o benzil metil éter:', o: ['qualquer uma: PhCH₂O⁻ + CH₃I ou CH₃O⁻ + PhCH₂Br (ambos sem E2)', 'só PhCH₂Br + CH₃O⁻', 'só PhO⁻ + CH₃CH₂Br', 'nenhuma funciona'], a: 0, e: 'Metila e benzila não têm Hβ elegível para E2 com alcóxido.' },
  { title: 'Integração', type: 'mc', q: 'Óxido de propileno: 1. CH₃MgBr 2. H₃O⁺ → ?', o: ['butan-2-ol', 'butan-1-ol', '2-metilpropan-1-ol', '2-metilpropan-2-ol'], a: 0, e: 'Ataque no CH₂: CH₃–CH₂–CH(OH)–CH₃.' },
  { title: 'Estereoquímica do diol', type: 'mc', q: 'Óxido de ciclo-hexeno + H₃O⁺ dá o ciclo-hexano-1,2-diol:', o: ['trans (racêmico)', 'cis (meso)', 'só o (1R,2R)', 'mistura cis/trans 1:1'], a: 0, e: 'Abertura anti. (O cis-diol vem de OsO₄ no ciclo-hexeno.)' },
];
export const PROPOSED = { easy, mid, hard };
void metilciclohexanol1;
