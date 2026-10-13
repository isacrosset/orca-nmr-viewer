/*
 * exdata.js — exercícios resolvidos (7 níveis), propostos (15/20/15) e
 * quebra-cabeças de setas curvas ("Monte o mecanismo").
 */
import { S } from './chem2d.js';
import { M, hbrFrames, brominationFrames, acetylideFrames, tautoFrames, propCations, cloneS, R6 } from './struct.js';

const f = (k, cap, o = {}) => Object.assign({ s: M[k](), cap }, o);
const noArr = (s) => { const c = cloneS(s); c.arrows = []; return c; };
const rx = (k, cond) => f(k, `<span style="color:var(--magenta)">${cond}</span> → ?`);

/* ===================================================================
 * Monte o mecanismo (setas curvas + intermediário + produto)
 * =================================================================== */
export const PUZZLES = [
  {
    title: 'Protonação do propeno pelo HBr', intro: 'Desenhe as setas da 1ª etapa (π → H; H–Br → Br). Depois escolha o intermediário e o produto.',
    puzzle: (() => {
      const r = hbrFrames().r;
      return {
        s: r,
        sites: { pi: { k: 'bond', b: [0, 1], label: 'ligação π C=C' }, H: { k: 'atom', a: 3, label: 'H do HBr' }, HBr: { k: 'bond', b: [3, 4], label: 'ligação H–Br' }, Br: { k: 'atom', a: 4, label: 'Br' }, c1: { k: 'atom', a: 0, label: 'CH₂' }, c2: { k: 'atom', a: 1, label: 'CH' }, lpBr: { k: 'lp', a: 4, ang: 90, label: 'par livre do Br', why: 'O Br não doa elétrons nesta etapa: ele recebe o par da ligação H–Br.' } },
        sources: ['pi', 'HBr', 'lpBr'], targets: ['H', 'Br', 'c1', 'c2', 'pi'],
        answer: [['pi', 'H'], ['HBr', 'Br']],
        msgs: { 'pi>c1': 'A seta deve terminar no eletrófilo (H⁺), não em um carbono.', 'HBr>H': 'O par da ligação H–Br vai para o átomo mais eletronegativo (Br), que sai como Br⁻.' },
        bend: { 'pi>H': -0.45, 'HBr>Br': -0.6 },
        done: 'Os elétrons π atacam o H; o par da ligação H–Br fica no Br (Br⁻).',
        slots: [
          { title: 'intermediário', options: [{ s: propCations().sec, ok: true, why: 'Cátion secundário: o H entrou no CH₂ terminal.' }, { s: propCations().pri, ok: false, why: 'Cátion primário: muito menos estável; praticamente não se forma.' }] },
          { title: 'produto', options: [{ s: M.bromopropano2(), ok: true, why: '2-bromopropano (Markovnikov).' }, { s: M.bromopropano1(), ok: false, why: '1-bromopropano exigiria o cátion primário (ou um mecanismo radicalar com peróxidos, fora do escopo).' }] },
        ],
      };
    })(),
  },
  {
    title: 'Formação do íon bromônio', intro: 'Três setas simultâneas: π → Br, par livre desse Br → um C, e Br–Br → Br. Depois escolha o intermediário e o produto.',
    puzzle: (() => {
      const r = brominationFrames().r;
      return {
        s: r,
        sites: { pi: { k: 'bond', b: [0, 1], label: 'ligação π' }, B1: { k: 'atom', a: 6, label: 'Br (mais próximo)' }, B2: { k: 'atom', a: 7, label: 'Br (distante)' }, BB: { k: 'bond', b: [6, 7], label: 'ligação Br–Br' }, lp: { k: 'lp', a: 6, ang: 180, label: 'par livre do Br' }, c0: { k: 'atom', a: 0, label: 'C1' }, c1: { k: 'atom', a: 1, label: 'C2' } },
        sources: ['pi', 'BB', 'lp'], targets: ['B1', 'B2', 'c0', 'c1', 'pi'],
        answer: [['pi', 'B1'], ['lp', 'c0'], ['BB', 'B2']],
        msgs: { 'BB>B1': 'O par da ligação Br–Br vai para o Br distante, que sai como Br⁻.' },
        bend: { 'pi>B1': -0.5, 'lp>c0': 0.5, 'BB>B2': -0.6 },
        done: 'Forma-se o íon bromônio cíclico (sem carbocátion livre) e Br⁻.',
        slots: [
          { title: 'intermediário', options: [{ s: noArr(brominationFrames().i), ok: true, why: 'Íon bromônio em ponte: o Br⁺ está ligado aos dois carbonos.' }, { s: (() => { const s = R6(); s.atoms[0][3] = { chg: '+', halo: 'm' }; s.br(1, 60, 'Br', 1, { cls: 'add' }); return s; })(), ok: false, why: 'Carbocátion livre não é o intermediário da bromação: o bromônio explica a adição anti e a ausência de rearranjos.' }] },
          { title: 'produto', options: [{ s: M.transDibromociclohexano(), ok: true, why: 'trans-1,2-dibromociclo-hexano: adição anti.' }, { s: R6({ sub: { 0: [['Br', 'w']], 1: [['Br', 'w']] } }), ok: false, why: 'cis exigiria adição syn.' }] },
        ],
      };
    })(),
  },
  {
    title: 'Ataque do Br⁻ ao carbocátion', intro: 'Desenhe a seta que forma a ligação C–Br.',
    puzzle: (() => {
      const i = noArr(hbrFrames().i);
      return { s: i, sites: { lp: { k: 'lp', a: 3, ang: 90, label: 'par livre do Br⁻' }, cp: { k: 'atom', a: 1, label: 'C⁺' }, c1: { k: 'atom', a: 0, label: 'CH₃' }, b01: { k: 'bond', b: [0, 1], label: 'ligação C–C' } }, sources: ['lp', 'b01'], targets: ['cp', 'c1'], answer: [['lp', 'cp']], msgs: { 'b01>cp': 'Setas curvas não partem de ligações aleatórias: aqui quem doa o par é o Br⁻.' }, bend: { 'lp>cp': 0.25 }, done: 'Nucleófilo (Br⁻) + eletrófilo (C⁺) → 2-bromopropano.' };
    })(),
  },
  {
    title: 'Formação do acetileto', intro: 'O amideto remove o H terminal do propino.',
    puzzle: (() => {
      const r = noArr(acetylideFrames()[0]);
      return { s: r, sites: { lpN: { k: 'lp', a: 4, ang: 180, label: 'par livre do NH₂⁻' }, H: { k: 'atom', a: 3, label: 'H terminal' }, CH: { k: 'bond', b: [2, 3], label: 'ligação C–H' }, C: { k: 'atom', a: 2, label: 'C sp terminal' } }, sources: ['lpN', 'CH'], targets: ['H', 'C'], answer: [['lpN', 'H'], ['CH', 'C']], bend: { 'lpN>H': 0.5, 'CH>C': -0.7 }, msgs: { 'lpN>C': 'A base remove o próton (H), não ataca o carbono.' }, done: 'O par da ligação C–H fica no carbono sp: acetileto + NH₃.' };
    })(),
  },
  {
    title: 'Alquilação do acetileto (SN2)', intro: 'O acetileto ataca o CH₃–Br pelo lado oposto ao Br.',
    puzzle: (() => {
      const i = noArr(acetylideFrames()[2]);
      return { s: i, sites: { lpC: { k: 'lp', a: 2, ang: 0, label: 'par do carbânion' }, Cm: { k: 'atom', a: 3, label: 'CH₃ (eletrofílico)' }, CBr: { k: 'bond', b: [3, 4], label: 'ligação C–Br' }, Br: { k: 'atom', a: 4, label: 'Br' } }, sources: ['lpC', 'CBr'], targets: ['Cm', 'Br'], answer: [['lpC', 'Cm'], ['CBr', 'Br']], bend: { 'lpC>Cm': -0.5, 'CBr>Br': -0.6 }, done: 'SN2: nova ligação C–C e saída de Br⁻ → but-2-ino.' };
    })(),
  },
  {
    title: 'Tautomeria: protonação do enol', intro: 'Catálise ácida: o par do O empurra a π para capturar H⁺ do H₃O⁺.',
    puzzle: (() => {
      const r = noArr(tautoFrames()[0]);
      return { s: r, sites: { lpO: { k: 'lp', a: 3, ang: 180, label: 'par livre do O' }, CO: { k: 'bond', b: [0, 3], label: 'ligação C–O' }, pi: { k: 'bond', b: [0, 1], label: 'ligação π C=C' }, H: { k: 'atom', a: 5, label: 'H do H₃O⁺' }, HO: { k: 'bond', b: [5, 6], label: 'ligação H–O' }, W: { k: 'atom', a: 6, label: 'O do H₃O⁺' } }, sources: ['lpO', 'pi', 'HO'], targets: ['CO', 'H', 'W'], answer: [['lpO', 'CO'], ['pi', 'H'], ['HO', 'W']], bend: { 'lpO>CO': 0.5, 'pi>H': 0.45, 'HO>W': -0.6 }, done: 'Forma-se a carbonila protonada; a água então remove o H do O → cetona.' };
    })(),
  },
];

/* ===================================================================
 * Exercícios resolvidos
 * =================================================================== */
const L1 = 'Nível 1 · Estrutura e nomenclatura', L2 = 'Nível 2 · Isomeria E/Z', L3 = 'Nível 3 · Produtos de alcenos', L4 = 'Nível 4 · Regio e estereoquímica', L5 = 'Nível 5 · Reações de alcinos', L6 = 'Nível 6 · Síntese curta', L7 = 'Nível 7 · Integração de mecanismos';
export const SOLVED = [
  { level: L1, title: 'Hibridização e geometria', q: 'Indique a hibridização de cada carbono do propino e o ângulo C–C≡C.', fig: f('propino', 'propino'), think: 'Conte domínios eletrônicos em cada carbono.', hint: 'Tripla = σ + 2π; os dois C da tripla têm 2 domínios.', steps: ['CH₃: 4 domínios → <b>sp³</b> (tetraédrico).', 'Os dois C da tripla: 2 domínios σ cada → <b>sp</b> (lineares).', 'C–C≡C = <b>180°</b>: o CH₃, os dois C sp e o H estão alinhados.'], answer: 'sp³, sp, sp; 180°.' },
  { level: L1, title: 'Nome IUPAC de um alceno', q: 'Dê o nome do composto.', fig: { s: M.metilbut1eno3(), cap: '' }, think: 'A cadeia principal precisa conter a C=C.', hint: 'Numere pela extremidade mais próxima da dupla.', steps: ['Cadeia principal: 4 C contendo a dupla → <b>but</b>.', 'Numerando a partir do CH₂=: dupla em C1 → <b>but-1-eno</b>.', 'Metila em C3 → <b>3-metilbut-1-eno</b>.'], answer: '3-metilbut-1-eno.' },
  { level: L1, title: 'Dieno', q: 'Nomeie CH₂=CH–CH₂–CH=CH–CH₃.', think: 'Duas duplas: use "-dieno".', hint: 'Escolha o sentido com o menor conjunto de localizadores.', steps: ['6 carbonos → hex-.', 'Da esquerda: duplas em 1 e 4; da direita: 2 e 5. Menor conjunto: <b>1,4</b>.', 'Nome: <b>hexa-1,4-dieno</b> (o "a" é de eufonia).'], answer: 'hexa-1,4-dieno.' },
  { level: L1, title: 'Alcino com dupla e tripla', q: 'Nomeie HC≡C–CH₂–CH=CH₂.', think: 'Quando há empate nos localizadores, quem tem prioridade?', hint: 'Sufixo "-en-…-ino".', steps: ['5 carbonos. Da direita: dupla 1, tripla 4 → {1,4}. Da esquerda: tripla 1, dupla 4 → {1,4}. Empate.', 'No empate, a <b>ligação dupla</b> recebe o menor número.', 'Nome: <b>pent-1-en-4-ino</b>.'], answer: 'pent-1-en-4-ino.' },
  { level: L2, title: 'cis/trans × E/Z', q: 'Por que não é possível usar cis/trans para BrClC=CH(CH₃) e qual descritor usar?', think: 'cis/trans exige um par de grupos iguais (ou semelhantes) nos dois C.', hint: 'Use as regras CIP.', steps: ['O C1 tem Br e Cl; o C2 tem H e CH₃: não há grupo "comum" para comparar.', 'Usa-se <b>E/Z</b>: em C1, Br > Cl; em C2, CH₃ > H.', 'Se Br e CH₃ estiverem do mesmo lado → Z; em lados opostos → E.'], answer: 'Usa-se E/Z (prioridades CIP).' },
  { level: L2, title: 'Primeiro ponto de diferença', q: 'Em um carbono da dupla estão –CH₂CH₂Br e –CH(CH₃)₂. Qual tem maior prioridade?', think: 'Compare átomo a átomo, a partir do carbono da dupla.', hint: 'No 1º carbono: (C,H,H) × (C,C,H).', steps: ['Ambos ligam-se por C.', 'Substituintes desse C: CH₂CH₂Br → (C,H,H); isopropila → (C,C,H).', 'Primeiro ponto de diferença: C > H → <b>isopropila vence</b>, mesmo havendo Br mais adiante.'], answer: '–CH(CH₃)₂.' },
  { level: L2, title: 'Alcinos e E/Z', q: 'O but-2-ino tem isômeros E/Z?', fig: f('but2ino', 'but-2-ino'), think: 'Quantos substituintes tem cada carbono sp?', hint: 'Geometria linear.', steps: ['Cada C da tripla tem apenas um substituinte (CH₃).', 'A geometria é linear: não existem "lados" diferentes.', '<b>Não há isomeria E/Z</b> na ligação tripla.'], answer: 'Não.' },
  { level: L3, title: 'HBr em alceno trissubstituído', q: 'Produto principal de 1-metilciclo-hexeno + HBr?', fig: rx('metilciclohexeno', 'HBr'), think: 'Qual carbocátion se forma?', hint: 'Compare cátion terciário × secundário.', steps: ['O H⁺ entra no CH do anel (C2).', 'Forma-se o carbocátion <b>terciário</b> no C1 (com CH₃).', 'Br⁻ ataca o C1 → <b>1-bromo-1-metilciclo-hexano</b>.'], answer: '1-bromo-1-metilciclo-hexano.', solFig: f('bromometilciclohexano1', 'produto') },
  { level: L3, title: 'Hidratação × oximercuração', q: 'Compare os produtos de 3-metilbut-1-eno com (a) H₂O/H₂SO₄ e (b) Hg(OAc)₂/H₂O; NaBH₄.', fig: f('metilbut1eno3', '3-metilbut-1-eno'), think: 'Qual dos dois métodos passa por carbocátion livre?', hint: 'O cátion 2° pode receber um hidreto vizinho.', steps: ['(a) Protonação → cátion 2° → <b>migração 1,2 de hidreto</b> → cátion 3° → água → <b>2-metilbutan-2-ol</b>.', '(b) Íon mercurínio, sem carbocátion livre → água no C mais substituído sem rearranjo → <b>3-metilbutan-2-ol</b>.'], answer: '(a) 2-metilbutan-2-ol; (b) 3-metilbutan-2-ol.', solFig: [f('metilbutanol2', '(a)'), f('metilbutanol3', '(b)')] },
  { level: L3, title: 'Ozonólise', q: 'Quais produtos se formam na ozonólise redutiva do 2-metilbut-2-eno?', fig: f('metilbut2eno', '2-metilbut-2-eno'), think: 'Troque C=C por C=O + O=C.', hint: 'Carbono com H vira aldeído.', steps: ['Corte a ligação dupla.', 'O carbono com dois CH₃ vira <b>propanona</b>.', 'O carbono com H e CH₃ vira <b>etanal</b>.'], answer: 'propanona + etanal.', solFig: [f('propanona', 'propanona'), f('etanal', 'etanal')] },
  { level: L3, title: 'Epoxidação e di-hidroxilação', q: 'Ciclo-hexeno reage com (a) mCPBA e (b) OsO₄ seguido de NaHSO₃. Dê os produtos.', fig: f('ciclohexeno', 'ciclo-hexeno'), think: 'As duas reações são syn.', hint: 'Um oxigênio (epóxido) × dois OH (diol).', steps: ['(a) Transferência concertada de O → <b>óxido de ciclo-hexeno</b>.', '(b) Éster ósmico cíclico (os dois O pela mesma face) → <b>cis-ciclo-hexano-1,2-diol</b>.'], answer: 'epóxido; cis-diol.', solFig: [f('oxidoCiclohexeno', '(a)'), f('cisDiolCiclohexano', '(b)')] },
  { level: L4, title: 'Por que Markovnikov?', q: 'Explique, usando intermediários, por que HBr + propeno dá 2-bromopropano.', fig: { energy: ['mk', 'amk'] }, think: 'Compare os dois caminhos no diagrama.', hint: 'Postulado de Hammond.', steps: ['A etapa lenta é a protonação, que gera carbocátion.', 'H no C1 → cátion <b>secundário</b>; H no C2 → cátion <b>primário</b>.', 'O ET que leva ao cátion mais estável tem menor energia (Hammond) → caminho mais rápido.', 'Por isso o Br termina no carbono mais substituído. "Markovnikov" é <b>consequência</b> do mecanismo.'], answer: 'Via carbocátion secundário, mais estável.' },
  { level: L4, title: 'Anti-Markovnikov e syn', q: 'Preveja o produto (com estereoquímica) da hidroboração-oxidação do 1-metilciclo-hexeno.', fig: rx('metilciclohexeno', '1. BH₃ 2. H₂O₂, OH⁻'), think: 'Onde vai o B? H e B entram pela mesma face?', hint: 'Depois o OH ocupa exatamente o lugar do B.', steps: ['B no carbono menos substituído (C2); H no C1.', 'H e B pela <b>mesma face</b> (syn).', 'O CH₃ fica do lado oposto ao H que entrou, logo <b>oposto ao OH</b>.', 'Produto: <b>trans-2-metilciclo-hexan-1-ol</b> (racêmico).'], answer: 'trans-2-metilciclo-hexan-1-ol.', solFig: f('transMetilciclohexanol2', 'produto') },
  { level: L4, title: 'Adição anti de Br₂', q: 'Por que o ciclo-hexeno dá apenas trans-1,2-dibromociclo-hexano com Br₂?', fig: f('transDibromociclohexano', 'produto'), think: 'De que lado o Br⁻ pode atacar o bromônio?', hint: 'A face com o Br⁺ está bloqueada.', steps: ['O Br₂ forma o <b>bromônio</b> numa face do anel.', 'O Br⁻ ataca pela <b>face oposta</b>, abrindo o anel de três membros (tipo SN2).', 'Os dois Br terminam em faces opostas → <b>trans</b> (racêmico).'], answer: 'Mecanismo via bromônio → anti.' },
  { level: L4, title: 'Haloidrina', q: 'Produto de propeno + Br₂/H₂O?', fig: rx('propeno', 'Br₂, H₂O'), think: 'Quem ataca o bromônio: Br⁻ ou H₂O?', hint: 'A água está em grande excesso; o C mais substituído tem mais δ+.', steps: ['Forma-se o bromônio.', 'A <b>água</b> (solvente, excesso) ataca o carbono <b>mais substituído</b>, que suporta melhor a carga parcial +.', 'Desprotonação → <b>1-bromopropan-2-ol</b>.'], answer: '1-bromopropan-2-ol.', solFig: f('bromopropanol', 'produto') },
  { level: L5, title: 'Lindlar × Na/NH₃', q: 'Dê os produtos de but-2-ino com (a) H₂/Lindlar e (b) Na/NH₃(l).', fig: f('but2ino', 'but-2-ino'), think: 'Syn ou anti?', hint: 'Lindlar: superfície; Na/NH₃: elétrons e prótons em etapas.', steps: ['(a) Adição <b>syn</b> de H₂ na superfície envenenada → <b>(Z)-but-2-eno</b>.', '(b) Radical-ânion → ânion vinílico <b>trans</b> (mais estável) → <b>(E)-but-2-eno</b>.'], answer: '(a) cis; (b) trans.', solFig: [f('but2enoZ', '(a)'), f('but2enoE', '(b)')] },
  { level: L5, title: 'Hidratação de alcino terminal', q: 'Propino + HgSO₄/H₂SO₄/H₂O. Mostre o intermediário e o produto.', fig: f('propino', 'propino'), think: 'Markovnikov: OH em qual carbono?', hint: 'Enóis tautomerizam.', steps: ['Adição Markovnikov de água → <b>enol</b> (OH no C2).', 'Tautomerização ceto-enólica → <b>propanona</b>.', 'Alcinos terminais dão <b>metilcetonas</b> nessas condições.'], answer: 'propanona.', solFig: [f('enolPropanona', 'enol'), f('propanona', 'cetona')] },
  { level: L5, title: 'Hidroboração de alcino terminal', q: 'Propino + (Sia)₂BH; depois H₂O₂/OH⁻. Produto?', think: 'Anti-Markovnikov: OH no C terminal.', hint: 'Enol terminal → aldeído.', steps: ['B no carbono terminal (menos impedido).', 'Oxidação → enol CH₃CH=CHOH.', 'Tautomerização → <b>propanal</b>.'], answer: 'propanal.', solFig: f('propanal', 'propanal') },
  { level: L5, title: 'Acidez de alcinos', q: 'Por que NaNH₂ desprotona o etino, mas NaOH não?', think: 'Compare pKa.', hint: 'pKa: etino 25; NH₃ 38; H₂O 15,7.', steps: ['Equilíbrio favorece o lado do ácido mais fraco.', 'NH₂⁻ gera NH₃ (pKa 38 > 25): <b>favorável</b>.', 'HO⁻ geraria H₂O (pKa 15,7 < 25): desfavorável.'], answer: 'pKa do ácido conjugado da base precisa ser > 25.' },
  { level: L5, title: 'HBr em excesso', q: 'Propino + 2 HBr. Produto?', fig: f('propino', 'propino'), think: 'Cada adição segue Markovnikov.', hint: 'O segundo Br vai para o mesmo carbono.', steps: ['1ª adição → 2-bromopropeno.', '2ª adição: o cátion mais estável é o do C que já tem Br (estabilizado pelo par do Br) → <b>2,2-dibromopropano</b> (geminal).'], answer: '2,2-dibromopropano.', solFig: f('dibromopropano22', 'produto') },
  { level: L6, title: 'Síntese: alcino interno', q: 'Prepare o but-2-ino a partir do propino.', think: 'Precisa formar uma ligação C–C.', hint: 'Acetileto + haleto de metila.', steps: ['1. NaNH₂ → propineto (acetileto).', '2. CH₃Br (metílico, ótimo para SN2) → <b>but-2-ino</b>.'], answer: '1. NaNH₂; 2. CH₃Br.', solFig: f('but2inoProd', 'but-2-ino') },
  { level: L6, title: 'Síntese: alceno cis', q: 'Como obter (Z)-but-2-eno a partir do propino?', think: 'Duas transformações: alongar a cadeia e reduzir parcialmente.', hint: 'Lindlar dá cis.', steps: ['1. NaNH₂; 2. CH₃I → but-2-ino.', '3. H₂, Lindlar → <b>(Z)-but-2-eno</b>.'], answer: 'NaNH₂; CH₃I; H₂/Lindlar.' },
  { level: L6, title: 'Síntese: álcool anti-Markovnikov', q: 'Converta propeno em propan-1-ol.', fig: f('propeno', 'propeno'), think: 'H₃O⁺ daria o álcool secundário.', hint: 'Hidroboração-oxidação.', steps: ['1. BH₃·THF; 2. H₂O₂, NaOH.', 'OH no carbono menos substituído → <b>propan-1-ol</b>.'], answer: 'BH₃; H₂O₂/OH⁻.' },
  { level: L6, title: 'Síntese: aldeído a partir de alcino', q: 'Converta propino em propanal.', think: 'Qual método coloca o O no carbono terminal?', hint: 'Borana volumosa.', steps: ['1. (Sia)₂BH (ou 9-BBN); 2. H₂O₂, NaOH.', 'Enol anti-Markovnikov → tautomerização → <b>propanal</b>.'], answer: '(Sia)₂BH; H₂O₂/OH⁻.' },
  { level: L7, title: 'Rearranjo em HCl', q: 'Por que 3,3-dimetilbut-1-eno + HCl dá principalmente 2-cloro-2,3-dimetilbutano?', fig: f('dimetilbut1eno33', '3,3-dimetilbut-1-eno'), think: 'O cátion secundário tem vizinho quaternário.', hint: 'Migração 1,2 de metila.', steps: ['Protonação → cátion <b>secundário</b> em C2.', 'Uma <b>metila</b> do C3 migra com seu par → cátion <b>terciário</b> em C3.', 'Cl⁻ ataca → <b>2-cloro-2,3-dimetilbutano</b> (rearranjado).', 'O produto "esperado" sem rearranjo (3-cloro-2,2-dimetilbutano) é minoritário.'], answer: 'Migração de metila → cátion terciário.', solFig: [f('clorodimetilbutano', 'principal'), f('clorodimetilbutano33', 'minoritário')] },
  { level: L7, title: 'Identifique o alceno pela ozonólise', q: 'Um alceno C₆H₁₀ dá, por ozonólise redutiva, apenas hexanodial. Qual é o alceno?', fig: f('hexanodial', 'hexanodial'), think: 'Um único produto com duas carbonilas: a dupla estava num anel.', hint: 'Ligue os dois carbonos carbonílicos por uma C=C.', steps: ['C₆H₁₀ tem 2 insaturações: 1 anel + 1 dupla.', 'Reconectando as duas CHO por uma C=C, fecha-se um anel de 6.', 'Alceno: <b>ciclo-hexeno</b>.'], answer: 'ciclo-hexeno.', solFig: f('ciclohexeno', 'ciclo-hexeno') },
  { level: L7, title: 'Intermediário × estado de transição', q: 'Classifique como intermediário ou ET: (a) bromônio; (b) espécie de 4 centros da hidroboração; (c) carbocátion da hidratação; (d) enol.', think: 'Intermediário = mínimo local; ET = máximo.', hint: 'Veja os perfis de energia.', steps: ['(a) <b>intermediário</b> (pode ser até observado em casos especiais).', '(b) <b>estado de transição</b> (reação concertada, sem intermediário).', '(c) <b>intermediário</b>.', '(d) <b>intermediário</b> isolável em princípio, mas tautomeriza rapidamente.'], answer: 'I, ET, I, I.' },
  { level: L7, title: 'Planejamento com estereoquímica', q: 'Como obter trans-2-bromociclo-hexan-1-ol a partir do ciclo-hexeno?', think: 'OH e Br vicinais e anti.', hint: 'Haloidrina.', steps: ['Br₂ em H₂O: bromônio + ataque anti da água.', 'Produto: <b>trans-2-bromociclo-hexan-1-ol</b> (racêmico).'], answer: 'Br₂, H₂O.', solFig: f('transBromociclohexanol', 'produto') },
];

/* ===================================================================
 * Exercícios propostos
 * =================================================================== */
const opt = (k) => ({ s: M[k]() });
const pz = (i) => ({ type: 'arrows', puzzle: PUZZLES[i].puzzle });
const easy = [
  { title: 'Ligações na dupla', type: 'mc', q: 'Uma ligação C=C é formada por:', o: ['duas ligações σ', 'uma σ e uma π', 'duas ligações π', 'uma σ e duas π'], a: 1, e: 'C=C = σ (sobreposição frontal sp²–sp²) + π (sobreposição lateral p–p).' },
  { title: 'Ligações na tripla', type: 'mc', q: 'Quantas ligações π existem em uma ligação C≡C?', o: ['0', '1', '2', '3'], a: 2, e: 'σ + 2π, perpendiculares entre si.' },
  { title: 'Geometria', type: 'match', q: 'Associe o carbono à geometria.', pairs: [['C de alcano', 'tetraédrico, 109,5°'], ['C de alceno', 'trigonal planar, ~120°'], ['C de alcino', 'linear, 180°']], e: 'sp³ → sp² → sp: aumenta o caráter s e muda a geometria.' },
  { title: 'Nomenclatura', type: 'mc', q: 'Nome de CH₃CH=CHCH₂CH₃:', o: ['pent-3-eno', 'pent-2-eno', 'but-2-eno', '2-penteno-3'], a: 1, e: 'Numere pela extremidade mais próxima da dupla: C2.' },
  { title: 'Nomenclatura de alcino', type: 'mc', q: 'Nome de HC≡C–CH(CH₃)–CH₃:', o: ['3-metilbut-1-ino', '2-metilbut-3-ino', 'pent-1-ino', '3-metilbut-2-ino'], a: 0, e: 'Tripla em C1; metila em C3.' },
  { title: 'Rotação', type: 'tf', q: 'Verdadeiro ou falso:', items: [['Há rotação livre em torno da C=C à temperatura ambiente.', 'F'], ['Girar 90° em torno da C=C anularia a sobreposição p–p.', 'V'], ['cis-but-2-eno e trans-but-2-eno são estereoisômeros.', 'V'], ['O ciclo-hexeno pode ter a dupla trans no anel de 6.', 'F']], e: 'A rotação romperia a π; em anéis pequenos/médios a dupla é cis.' },
  { title: 'E ou Z?', type: 'mc', q: 'O (CH₃)HC=CH(CH₃) com os CH₃ do mesmo lado é:', o: ['E', 'Z', 'nenhum dos dois', 'R'], a: 1, e: 'Mesmo lado = zusammen (Z).' },
  { title: 'Estabilidade', type: 'order', q: 'Ordene do <b>mais estável</b> para o <b>menos estável</b>.', items: [{ id: 'a', s: M.dimetilbut2eno(), label: 'tetrassubstituído' }, { id: 'b', s: M.metilbut2eno(), label: 'trissubstituído' }, { id: 'c', s: M.but2enoE(), label: 'trans-dissubstituído' }, { id: 'd', s: M.but1eno(), label: 'monossubstituído' }], correct: ['a', 'b', 'c', 'd'], top: 'mais estável', bottom: 'menos estável', explain: 'Mais grupos alquila → mais hiperconjugação.' },
  { title: 'Calor de hidrogenação', type: 'mc', q: 'Qual libera MAIS calor na hidrogenação a butano?', o: ['(E)-but-2-eno', '(Z)-but-2-eno', 'but-1-eno', 'todos iguais'], a: 2, e: 'But-1-eno é o menos estável: −127 kJ/mol.' },
  { title: 'Produto de hidrogenação', type: 'mc', struct: true, q: 'Propeno + H₂, Pd → ?', o: [opt('propano'), opt('propanol2'), opt('propeno'), opt('dibromopropano12')], a: 0, e: 'Adição de H₂: alcano.' },
  { title: 'Produto com Br₂', type: 'mc', struct: true, q: 'Ciclo-hexeno + Br₂ → ?', o: [opt('transDibromociclohexano'), opt('bromociclohexano'), { s: R6({ sub: { 0: [['Br', 'w']], 1: [['Br', 'w']] } }) }, opt('ciclohexanol')], a: 0, e: 'Via bromônio: adição anti → trans.' },
  { title: 'Intermediários', type: 'match', q: 'Associe a reação ao intermediário.', pairs: [['Br₂', 'íon halônio'], ['HBr', 'carbocátion'], ['BH₃', 'ET concertado'], ['Hg(OAc)₂/H₂O', 'íon mercurínio']], e: 'Só a hidro-halogenação e a hidratação ácida passam por carbocátion livre.' },
  { title: 'Acidez', type: 'order', q: 'Ordene do <b>mais ácido</b> ao <b>menos ácido</b> (H ligado ao C).', items: [{ id: 'y', label: 'etino (C sp)' }, { id: 'e', label: 'eteno (C sp²)' }, { id: 'a', label: 'etano (C sp³)' }], correct: ['y', 'e', 'a'], top: 'mais ácido', bottom: 'menos ácido', explain: 'Mais caráter s → ânion mais estável → mais ácido (pKa 25 < 44 < 50).' },
  { title: 'Lindlar', type: 'mc', q: 'H₂/Lindlar converte um alcino interno em:', o: ['alcano', 'alceno cis (Z)', 'alceno trans (E)', 'cetona'], a: 1, e: 'Adição syn em superfície envenenada.' },
  { title: 'Teste do bromo', type: 'tf', q: 'Verdadeiro ou falso:', items: [['Alcenos descoram a solução de Br₂.', 'V'], ['Alcanos descoram Br₂ rapidamente no escuro.', 'F'], ['O teste substitui a análise do mecanismo.', 'F']], e: 'O teste indica insaturação; o mecanismo é o do bromônio.' },
];
const mid = [
  { title: 'Monte o mecanismo (HBr)', ...pz(0), q: 'Desenhe as setas e escolha intermediário e produto.', e: 'π → H; H–Br → Br; cátion 2°; 2-bromopropano.' },
  { title: 'Monte o mecanismo (bromônio)', ...pz(1), q: 'Desenhe as três setas da formação do bromônio.', e: 'π → Br; par do Br → C; Br–Br → Br.' },
  { title: 'Markovnikov', type: 'mc', struct: true, q: '2-metilpropeno + HCl → ?', o: [{ s: (() => { const s = new S(); const c = s.a(0, 0); s.br(c, 210); s.br(c, 330); s.br(c, 90); s.br(c, 270, 'Cl'); return s; })() }, { s: (() => { const s = new S(); const c = s.a(0, 0); s.br(c, 210); s.br(c, 330); const d = s.br(c, 90); s.br(d, 30, 'Cl'); return s; })() }, opt('metilpropeno'), opt('propano')], a: 0, e: 'Cátion terciário → 2-cloro-2-metilpropano.' },
  { title: 'Anti-Markovnikov', type: 'mc', struct: true, q: '1-metilciclo-hexeno: 1. BH₃·THF 2. H₂O₂, NaOH → ?', o: [opt('transMetilciclohexanol2'), opt('metilciclohexanol1'), { s: R6({ sub: { 0: [['', 'w']], 1: [['OH', 'w']] } }) }, opt('cisDiolMetil')], a: 0, e: 'OH no C menos substituído; H e OH syn → CH₃ e OH trans.' },
  { title: 'Qual reagente?', type: 'mc', q: 'Propeno → propan-1-ol. Qual conjunto de reagentes?', fig: [f('propeno', 'propeno'), f('propanol1', 'propan-1-ol')], o: ['H₂O, H₂SO₄', '1. Hg(OAc)₂, H₂O 2. NaBH₄', '1. BH₃·THF 2. H₂O₂, NaOH', 'OsO₄'], a: 2, e: 'Só a hidroboração-oxidação é anti-Markovnikov.' },
  { title: 'Qual reagente?', type: 'mc', q: 'But-2-ino → (E)-but-2-eno.', o: ['H₂, Pd/C', 'H₂, Lindlar', 'Na, NH₃(l)', 'HgSO₄, H₂SO₄'], a: 2, e: 'Metal dissolvido → trans.' },
  { title: 'Rearranjo', type: 'mc', struct: true, q: '3-metilbut-1-eno + HBr → produto principal:', o: [opt('bromometilbutano2'), opt('bromometilbutano3'), opt('dibromoMetilbutano'), opt('metilbutano2')], a: 0, e: 'Cátion 2° → hidreto migra → 3° → 2-bromo-2-metilbutano.' },
  { title: 'Sem rearranjo', type: 'mc', struct: true, q: '3-metilbut-1-eno: 1. Hg(OAc)₂, H₂O 2. NaBH₄ → ?', o: [opt('metilbutanol3'), opt('metilbutanol2'), opt('metilbutanol1'), opt('metilbutanodiol')], a: 0, e: 'Markovnikov sem rearranjo (mercurínio).' },
  { title: 'Ozonólise', type: 'mc', q: 'Ozonólise redutiva do 1-metilciclo-hexeno dá:', o: ['6-oxo-heptanal', 'ciclo-hexanona + metanal', 'ácido adípico', 'dois aldeídos de 3 C'], a: 0, e: 'Anel aberto: uma única molécula com cetona e aldeído.' },
  { title: 'Haloidrina', type: 'mc', struct: true, q: '1-metilciclo-hexeno + Br₂/H₂O → ?', o: [opt('transBromoMetilciclohexanol'), opt('transDibromoMetil'), { s: R6({ sub: { 0: [['Br', 'h', 148], ['', 1, 92]], 1: [['OH', 'w']] } }) }, opt('metilciclohexanol1')], a: 0, e: 'OH no carbono terciário; Br e OH anti.' },
  { title: 'Hidratação de alcino', type: 'mc', struct: true, q: 'Propino + HgSO₄, H₂SO₄, H₂O → ?', o: [opt('propanona'), opt('propanal'), opt('enolPropanona'), opt('propanol2')], a: 0, e: 'Enol Markovnikov → metilcetona.' },
  { title: 'Alcino + borana', type: 'mc', struct: true, q: 'Propino: 1. (Sia)₂BH 2. H₂O₂, NaOH → ?', o: [opt('propanal'), opt('propanona'), opt('propanol1'), opt('enolPropanal')], a: 0, e: 'Enol anti-Markovnikov → aldeído.' },
  { title: 'Tautomeria', type: 'tf', q: 'Sobre tautomeria ceto-enólica:', items: [['Enol e cetona são formas de ressonância.', 'F'], ['Tautômeros diferem na posição de um H e de uma ligação π.', 'V'], ['A forma ceto costuma ser mais estável.', 'V'], ['A tautomerização é catalisada por ácido ou base.', 'V']], e: 'Tautômeros são isômeros constitucionais em equilíbrio, não estruturas de ressonância.' },
  { title: 'Monte o mecanismo (tautomeria)', ...pz(5), q: 'Protonação do enol em meio ácido.', e: 'Par do O → C–O; π → H; H–O → O.' },
  { title: 'Monte o mecanismo (acetileto)', ...pz(3), q: 'Formação do acetileto com NH₂⁻.', e: 'NH₂⁻ remove o H; o par fica no C sp.' },
  { title: 'Acetiletos + haletos', type: 'mc', q: 'Qual haleto dá o melhor rendimento de alquilação com propineto de sódio?', o: ['CH₃CH₂Br', '(CH₃)₂CHBr', '(CH₃)₃CBr', 'bromobenzeno'], a: 0, e: 'Primário: SN2. Secundário/terciário: E2 (acetileto é base forte). Arila: não faz SN2.' },
  { title: 'Reação → estereoquímica', type: 'match', q: 'Associe.', pairs: [['Br₂', 'anti'], ['OsO₄', 'syn'], ['H₂/Lindlar', 'syn (alceno Z)'], ['Na/NH₃', 'anti (alceno E)'], ['BH₃; H₂O₂', 'syn']], e: 'Cada estereoquímica vem do mecanismo: bromônio, éster cíclico, superfície, etapas radical-ânion.' },
  { title: 'Reação → regioquímica', type: 'match', q: 'Associe.', pairs: [['HBr', 'Markovnikov'], ['BH₃; H₂O₂/OH⁻', 'anti-Markovnikov'], ['HgSO₄/H₃O⁺ (alcino)', 'Markovnikov (cetona)'], ['(Sia)₂BH; H₂O₂ (alcino terminal)', 'anti-Markovnikov (aldeído)']], e: 'A regioquímica decorre do intermediário/ET mais estável.' },
  { title: 'Permanganato', type: 'mc', q: 'KMnO₄ diluído e frio com ciclo-hexeno dá ____; KMnO₄ quente e ácido dá ____.', o: ['cis-diol; ácido adípico', 'trans-diol; ciclo-hexanol', 'epóxido; hexanodial', 'ciclo-hexano; CO₂'], a: 0, e: 'Condições brandas: di-hidroxilação syn; severas: clivagem oxidativa.' },
  { title: 'Polímeros', type: 'match', q: 'Associe o monômero ao polímero.', pairs: [['eteno', 'polietileno'], ['propeno', 'polipropileno'], ['estireno', 'poliestireno'], ['cloreto de vinila', 'PVC']], e: 'Polímeros de adição: cada π vira σ na cadeia.' },
];
const hard = [
  { title: 'Monte o mecanismo (SN2 do acetileto)', ...pz(4), q: 'Alquilação do propineto com CH₃Br.', e: 'Par do carbânion → CH₃; C–Br → Br.' },
  { title: 'Detecte o erro (1)', type: 'mc', q: 'Um estudante desenhou a bromação do ciclo-hexeno passando por um carbocátion secundário. Qual o erro?', o: ['o intermediário correto é o íon bromônio em ponte (explica a adição anti)', 'deveria ser um carbânion', 'não há erro', 'o Br₂ não reage com alcenos'], a: 0, e: 'Halogenação: halônio, não carbocátion livre.' },
  { title: 'Detecte o erro (2)', type: 'mc', q: '"Seta partindo do C⁺ em direção ao Br⁻." Qual o erro?', o: ['setas curvas partem dos elétrons (Br⁻), não da carga positiva', 'o C⁺ deveria ter 5 ligações', 'falta um H', 'nenhum'], a: 0, e: 'A seta sai do par livre do nucleófilo e chega ao eletrófilo.' },
  { title: 'Detecte o erro (3)', type: 'mc', q: '"H₂, Lindlar converte o hex-3-ino em (E)-hex-3-eno." Qual o erro?', o: ['Lindlar dá o alceno cis (Z)', 'Lindlar reduz até alcano', 'não reage', 'nenhum'], a: 0, e: 'Adição syn → Z.' },
  { title: 'Detecte o erro (4)', type: 'mc', q: '"Na/NH₃ converte o but-2-ino em (Z)-but-2-eno." Qual o erro?', o: ['Na/NH₃ dá o alceno trans (E)', 'Na/NH₃ não reduz alcinos', 'dá alcano', 'nenhum'], a: 0, e: 'Anti global → E.' },
  { title: 'Detecte o erro (5)', type: 'mc', q: '"Na hidroboração do 3-metilbut-1-eno ocorre migração de hidreto." Qual o erro?', o: ['a hidroboração é concertada: não há carbocátion para rearranjar', 'deveria migrar metila', 'a hidroboração é Markovnikov', 'nenhum'], a: 0, e: 'Rearranjos exigem carbocátion livre.' },
  { title: 'Detecte o erro (6)', type: 'mc', q: '"HBr + propeno → 1-bromopropano, porque o H entra no carbono com menos H." Qual o erro?', o: ['Markovnikov aplicado ao contrário: o H entra no C com MAIS H (formando o cátion 2°)', 'HBr não reage', 'o produto é 1,2-dibromopropano', 'nenhum'], a: 0, e: 'O H vai para o CH₂ terminal, gerando o cátion mais estável.' },
  { title: 'Detecte o erro (7)', type: 'mc', q: 'Um mecanismo mostra um carbono com cinco ligações no estado de transição da hidroboração, desenhado como "intermediário". Qual o problema?', o: ['confunde estado de transição (máximo, ligações parciais) com intermediário; carbono não tem 5 ligações completas', 'a hidroboração forma carbocátion', 'o B entra no C mais substituído', 'nenhum'], a: 0, e: 'Concertado: um único ET, sem intermediário.' },
  { title: 'Síntese 1', type: 'mc', q: 'Como converter propino em (Z)-pent-2-eno?', o: ['1. NaNH₂ 2. CH₃CH₂Br 3. H₂, Lindlar', '1. NaNH₂ 2. CH₃CH₂Br 3. Na, NH₃', '1. H₂, Lindlar 2. CH₃CH₂Br', '1. HBr 2. Na, NH₃'], a: 0, e: 'Alquilação → pent-2-ino; Lindlar → cis.' },
  { title: 'Síntese 2', type: 'mc', q: 'Como converter but-1-ino em butanal?', o: ['1. (Sia)₂BH 2. H₂O₂, NaOH', 'HgSO₄, H₂SO₄, H₂O', 'H₂, Lindlar', 'O₃'], a: 0, e: 'Anti-Markovnikov + tautomerização → aldeído.' },
  { title: 'Síntese 3', type: 'mc', q: 'Melhor rota de propeno a propan-2-ol sem risco de rearranjo:', o: ['1. Hg(OAc)₂, H₂O 2. NaBH₄', '1. BH₃ 2. H₂O₂, NaOH', 'O₃', 'H₂, Pd'], a: 0, e: 'Markovnikov sem carbocátion livre.' },
  { title: 'Síntese 4', type: 'mc', q: 'Qual sequência converte o etino em (E)-hex-3-eno?', o: ['1. NaNH₂ 2. CH₃CH₂Br 3. NaNH₂ 4. CH₃CH₂Br 5. Na, NH₃(l)', '1. NaNH₂ 2. CH₃CH₂Br 3. NaNH₂ 4. CH₃CH₂Br 5. H₂, Lindlar', '1. 2 CH₃CH₂Br 2. Na, NH₃', '1. H₂, Lindlar 2. 2 CH₃CH₂Br'], a: 0, e: 'Duas alquilações (uma de cada lado) → hex-3-ino; Na/NH₃ → E. (Lindlar daria Z.)' },
  { title: 'Identifique o alceno', type: 'mc', q: 'Um alceno C₅H₁₀ dá propanona + etanal por ozonólise redutiva. Qual é?', o: ['2-metilbut-2-eno', 'pent-2-eno', '3-metilbut-1-eno', '2-metilbut-1-eno'], a: 0, e: 'Reconecte C=O + O=C: (CH₃)₂C=CHCH₃.' },
  { title: 'Estereoquímica do diol', type: 'mc', q: '(Z)-but-2-eno + OsO₄ dá o butano-2,3-diol:', o: ['meso', 'racêmico (R,R)/(S,S)', 'só (R,R)', 'não forma diol'], a: 0, e: 'Adição syn em alceno cis simétrico → meso. Com o trans, dá o par racêmico.' },
  { title: 'Integração', type: 'mc', q: 'Qual sequência converte o ciclo-hexeno em hexanodial?', o: ['1. O₃ 2. (CH₃)₂S', 'KMnO₄ diluído, frio', 'mCPBA', '1. BH₃ 2. H₂O₂/OH⁻'], a: 0, e: 'Ozonólise redutiva abre o anel com duas CHO.' },
];
export const PROPOSED = { easy, mid, hard };
