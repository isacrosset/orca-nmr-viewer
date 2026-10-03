/*
 * quiz.js — exercícios propostos (múltipla escolha com correção imediata).
 * No HTML: <div data-quiz="conjunto"></div>
 * Figuras dentro do enunciado: <div data-fig="nome"></div>
 */
(function (G) {
  'use strict';

  const Q = {};

  /* ------------------------------------------------------------------ */
  Q['conf-alcanos'] = [
    {
      q: 'Qual dos pares abaixo é formado por <b>isômeros constitucionais</b>?',
      o: ['Butano e 2-metilbutano', 'Etanol e metoximetano', 'Propano e propeno', 'Ciclo-hexano e benzeno'],
      a: 1,
      e: 'Etanol (CH₃CH₂OH) e metoximetano (CH₃OCH₃) têm a mesma fórmula molecular, C₂H₆O, mas conectividades diferentes (isômeros de função). Nos outros pares as fórmulas moleculares são diferentes.',
    },
    {
      q: 'Quantos isômeros constitucionais existem com a fórmula C<sub>6</sub>H<sub>14</sub>?',
      o: ['3', '4', '5', '6'],
      a: 2,
      e: 'São 5: hexano, 2-metilpentano, 3-metilpentano, 2,2-dimetilbutano e 2,3-dimetilbutano.',
    },
    {
      q: 'Propanal (CH₃CH₂CHO) e propanona (CH₃COCH₃) são isômeros de:',
      o: ['cadeia', 'posição', 'função', 'compensação (metameria)'],
      a: 2,
      e: 'Ambos são C₃H₆O, mas pertencem a funções orgânicas diferentes (aldeído × cetona): isomeria de função.',
    },
    {
      q: 'Conformações diferentes de uma mesma molécula se interconvertem por:',
      o: ['quebra e formação de ligações σ', 'rotação em torno de ligações simples', 'rotação em torno de ligações duplas', 'troca de dois ligantes de um carbono'],
      a: 1,
      e: 'Conformações surgem por rotação em torno de ligações σ (simples), sem quebrar ligações. Quebrar ligações ou trocar ligantes muda a <i>configuração</i>.',
    },
    {
      q: 'Na projeção de Newman, o carbono de <b>trás</b> é representado por:',
      o: ['um ponto no centro', 'um círculo', 'uma cunha cheia', 'uma linha tracejada'],
      a: 1,
      e: 'O carbono da frente é o ponto central (as ligações saem do centro); o de trás é o círculo (as ligações saem da borda do círculo).',
    },
    {
      q: 'A diferença de energia entre as conformações eclipsada e alternada do etano é de aproximadamente:',
      o: ['4 kJ/mol', '12 kJ/mol', '19 kJ/mol', '45 kJ/mol'],
      a: 1,
      e: 'São três interações H/H eclipsadas de ≈ 4,0 kJ/mol cada: 3 × 4,0 ≈ 12 kJ/mol de tensão torsional.',
    },
    {
      q: 'A tensão torsional é causada principalmente por:',
      o: ['desvio do ângulo de ligação de 109,5°', 'repulsão entre os elétrons das ligações eclipsadas', 'atração entre grupos volumosos', 'ligação de hidrogênio intramolecular'],
      a: 1,
      e: 'Tensão torsional = repulsão entre pares de elétrons de ligações em átomos vizinhos quando estão eclipsadas. O desvio do ângulo é tensão angular; grupos volumosos próximos geram tensão estérica.',
    },
    {
      q: 'No butano (rotação em torno de C2–C3), a conformação em que os grupos CH₃ formam ângulo diedro de 60° é chamada:',
      o: ['anti', 'gauche', 'eclipsada', 'totalmente eclipsada'],
      a: 1,
      e: 'Diedro de 60° entre os metilas = gauche (sinclinal). Custa ≈ 3,8 kJ/mol de tensão estérica em relação à anti.',
    },
    {
      q: 'Qual é a ordem <b>crescente</b> de energia das conformações do butano?',
      o: ['anti < gauche < eclipsada (CH₃/H) < totalmente eclipsada', 'gauche < anti < eclipsada (CH₃/H) < totalmente eclipsada', 'anti < eclipsada (CH₃/H) < gauche < totalmente eclipsada', 'totalmente eclipsada < eclipsada < gauche < anti'],
      a: 0,
      e: 'Valores relativos: anti 0; gauche 3,8; eclipsada CH₃/H 16; totalmente eclipsada (CH₃/CH₃) 19 kJ/mol.',
    },
    {
      q: 'A conformação eclipsada do butano em que cada CH₃ eclipsa um H (diedro de 120°) tem energia relativa de aproximadamente:',
      o: ['6 kJ/mol', '11 kJ/mol', '16 kJ/mol', '19 kJ/mol'],
      a: 2,
      e: '2 interações CH₃/H eclipsadas (2 × 6,0) + 1 interação H/H eclipsada (4,0) = 16 kJ/mol.',
    },
    {
      q: 'Considere a rotação em torno da ligação C1–C2 do 2-metilpropano. Qual a barreira de rotação estimada?',
      fig: 'metilpropanoEcl',
      o: ['12 kJ/mol', '14 kJ/mol', '16 kJ/mol', '19 kJ/mol'],
      a: 2,
      e: 'Na eclipsada há 2 interações CH₃/H (2 × 6,0 = 12) e 1 interação H/H (4,0): total 16 kJ/mol.',
    },
    {
      q: 'Para o 1-cloropropano (rotação em torno de C1–C2), a conformação de menor energia deve ser:',
      o: ['eclipsada com Cl e CH₃ sobrepostos', 'gauche entre Cl e CH₃', 'anti entre Cl e CH₃', 'todas têm a mesma energia'],
      a: 2,
      e: 'Os dois grupos maiores (Cl e CH₃) ficam o mais afastados possível: conformação anti (diedro 180°), como no butano.',
    },
  ];

  /* ------------------------------------------------------------------ */
  Q['conf-ciclo'] = [
    {
      q: 'Por que o ciclopropano é muito tensionado?',
      o: ['Somente por tensão estérica', 'Ângulos C–C–C de 60° (tensão angular) e todas as ligações C–H eclipsadas (tensão torsional)', 'Porque assume a conformação em cadeira', 'Porque suas ligações C–C são duplas'],
      a: 1,
      e: 'O anel de 3 membros é obrigatoriamente plano: ângulos de 60° (muito longe de 109,5°) e todos os H eclipsados. Tensão total ≈ 115 kJ/mol.',
    },
    {
      q: 'Quantos hidrogênios axiais existem no ciclo-hexano em cadeira?',
      o: ['3', '4', '6', '12'],
      a: 2,
      e: 'Seis axiais (três para cima, três para baixo, alternando) e seis equatoriais. Cada carbono tem um H axial e um H equatorial.',
    },
    {
      q: 'Qual conformação corresponde ao ponto de <b>máxima energia</b> na interconversão cadeira ⇄ cadeira?',
      o: ['bote', 'bote torcido', 'meia-cadeira', 'cadeira'],
      a: 2,
      e: 'A meia-cadeira (≈ 45 kJ/mol acima da cadeira) é o estado de transição. O bote (≈ 29) e o bote torcido (≈ 23) são, respectivamente, um máximo local e um mínimo local.',
    },
    {
      q: 'Na interconversão da cadeira, um substituinte que estava <b>axial e para cima</b> passa a ser:',
      o: ['axial e para baixo', 'equatorial e para cima', 'equatorial e para baixo', 'continua axial e para cima'],
      a: 1,
      e: 'Axial ⇄ equatorial, mas "para cima" continua "para cima": a interconversão não quebra ligações, então a face do anel (cis/trans) se mantém.',
    },
    {
      q: 'No metilciclo-hexano com o metila axial, ele sofre interações 1,3-diaxiais com:',
      o: ['os H equatoriais de C2 e C6', 'os H axiais de C3 e C5', 'o H axial de C4', 'os H axiais de C2 e C6'],
      a: 1,
      e: 'Um grupo axial em C1 fica próximo dos outros dois átomos axiais do mesmo lado do anel: os de C3 e C5.',
    },
    {
      q: 'À temperatura ambiente, aproximadamente qual porcentagem do metilciclo-hexano está com o metila em posição equatorial? (ΔG° = 7,6 kJ/mol)',
      o: ['50 %', '75 %', '95 %', '99,99 %'],
      a: 2,
      e: 'K = e^(ΔG°/RT) = e^(7600 / (8,314 × 298)) ≈ 21 → 21/(21 + 1) ≈ 95 % equatorial.',
    },
    {
      q: 'Qual substituinte tem a <b>maior</b> preferência pela posição equatorial?',
      o: ['–OH', '–CH₃', '–CH(CH₃)₂', '–C(CH₃)₃'],
      a: 3,
      e: 'O terc-butila (ΔG° ≈ 22,8 kJ/mol) fica > 99,9 % equatorial; na prática "trava" a conformação do anel.',
    },
    {
      q: 'No <b>cis</b>-1,2-dimetilciclo-hexano, as duas cadeiras possíveis são:',
      o: ['(e,e) e (a,a)', '(a,e) e (e,a), de mesma energia', 'apenas (e,e)', '(a,a) e (a,a)'],
      a: 1,
      e: 'Em 1,2-cis, um grupo é axial e o outro equatorial. A interconversão troca os papéis, gerando uma conformação de mesma energia.',
    },
    {
      q: 'Qual conformação é a mais estável para o <b>trans</b>-1,4-dimetilciclo-hexano?',
      o: ['diaxial', 'diequatorial', 'axial–equatorial', 'bote'],
      a: 1,
      e: 'Em 1,4-trans as possibilidades são (e,e) e (a,a). A diequatorial não tem interações 1,3-diaxiais com os metilas e é muito mais estável.',
    },
    {
      q: 'Qual isômero é mais estável: <b>cis</b>- ou <b>trans</b>-1,3-dimetilciclo-hexano?',
      o: ['cis, pois pode ficar (e,e)', 'trans, pois pode ficar (e,e)', 'têm a mesma estabilidade', 'nenhum deles adota a cadeira'],
      a: 0,
      e: 'Em 1,3: cis ⇒ (e,e) ou (a,a); trans ⇒ (a,e). O cis na conformação (e,e) não tem metila axial, sendo mais estável que o trans, que sempre tem um metila axial.',
    },
    {
      q: 'No cis-1-terc-butil-4-metilciclo-hexano, a conformação preferida tem:',
      fig: 'tBuMe',
      o: ['t-Bu axial e CH₃ equatorial', 't-Bu equatorial e CH₃ axial', 'ambos equatoriais', 'ambos axiais'],
      a: 1,
      e: 'Em 1,4-cis um grupo precisa ser axial. Fica axial o menor (CH₃, custo 7,6 kJ/mol) e o t-Bu fica equatorial (evita 22,8 kJ/mol).',
    },
    {
      q: 'O que desestabiliza a conformação <b>bote</b> em relação à cadeira?',
      o: ['Tensão angular elevada (ângulos de 90°)', 'Interação entre os H "mastro" e ligações C–H eclipsadas', 'Ligações de hidrogênio', 'A presença de ligações duplas'],
      a: 1,
      e: 'No bote os ângulos são próximos de 109,5°, mas há 4 pares de H eclipsados (tensão torsional) e repulsão estérica entre os dois H "mastro" (flagpole).',
    },
    {
      q: 'Estime a diferença de energia entre as cadeiras (a,a) e (e,e) do <b>trans</b>-1,2-dimetilciclo-hexano.',
      fig: 'trans12ee',
      o: ['3,8 kJ/mol', '7,6 kJ/mol', '11,4 kJ/mol', '15,2 kJ/mol'],
      a: 2,
      e: '(a,a): dois metilas axiais → 4 interações 1,3-diaxiais CH₃/H = 4 × 3,8 = 15,2 kJ/mol. (e,e): apenas uma interação gauche entre os metilas vizinhos ≈ 3,8 kJ/mol. Diferença ≈ 11,4 kJ/mol a favor da (e,e).',
    },
  ];

  /* ------------------------------------------------------------------ */
  Q['estereo'] = [
    {
      q: 'Dois enantiômeros diferem em qual propriedade?',
      o: ['Ponto de fusão', 'Solubilidade em água', 'Sentido da rotação do plano da luz polarizada', 'Densidade'],
      a: 2,
      e: 'Enantiômeros têm propriedades físicas idênticas em ambiente aquiral; giram a luz plano-polarizada em mesma intensidade e sentidos opostos (e interagem de modo diferente com outras moléculas quirais).',
    },
    {
      q: 'Uma mistura racêmica:',
      o: ['contém apenas um enantiômero', 'tem rotação óptica nula, pois contém 50 % de cada enantiômero', 'é sempre um composto meso', 'gira a luz para a direita'],
      a: 1,
      e: 'Mistura 1:1 de enantiômeros: as rotações se cancelam (α = 0). É indicada por (±) ou rac-.',
    },
    {
      q: 'Qual das moléculas abaixo possui um <b>estereocentro</b>?',
      o: ['propan-2-ol', 'pentan-3-ol', '2-metilpropan-2-ol', 'butan-2-ol'],
      a: 3,
      e: 'Em butan-2-ol, C2 está ligado a OH, H, CH₃ e CH₂CH₃ (quatro grupos diferentes). Nos demais, o carbono do OH tem dois grupos iguais.',
    },
    {
      q: 'Qual ligante tem a <b>maior</b> prioridade CIP: –OH, –NH₂, –COOH ou –CH₃?',
      o: ['–OH', '–NH₂', '–COOH', '–CH₃'],
      a: 0,
      e: 'Compara-se primeiro o número atômico do átomo ligado ao estereocentro: O (8) > N (7) > C (6). O –COOH é ligado pelo C.',
    },
    {
      q: 'Entre –CH₂OH e –C(CH₃)₃, qual tem maior prioridade?',
      o: ['–C(CH₃)₃, pois tem mais carbonos', '–CH₂OH, pois no 1º ponto de diferença O > C', 'Têm a mesma prioridade', 'Depende da configuração'],
      a: 1,
      e: 'Ambos ligam pelo C. Conjuntos: –CH₂OH (O,H,H) e –C(CH₃)₃ (C,C,C). Compara-se o átomo de maior número atômico de cada conjunto: O > C. Não se "soma" nada.',
    },
    {
      q: 'Trocar a posição de <b>dois</b> ligantes quaisquer de um estereocentro:',
      o: ['mantém a configuração', 'inverte a configuração (R ⇄ S)', 'gera um composto meso', 'gera um isômero constitucional'],
      a: 1,
      e: 'Uma troca inverte; duas trocas restauram a configuração original. Esse truque é útil para colocar o grupo 4 no tracejado.',
    },
    {
      q: 'Um composto com 3 estereocentros (e sem simetria interna) tem no máximo quantos estereoisômeros?',
      o: ['3', '6', '8', '9'],
      a: 2,
      e: 'Regra 2ⁿ: 2³ = 8 estereoisômeros (4 pares de enantiômeros).',
    },
    {
      q: '(2R,3R)-2-bromo-3-clorobutano e (2R,3S)-2-bromo-3-clorobutano são:',
      o: ['enantiômeros', 'diastereoisômeros', 'o mesmo composto', 'isômeros constitucionais'],
      a: 1,
      e: 'Diferem em apenas um dos dois estereocentros: não são imagens especulares → diastereoisômeros. O enantiômero de (2R,3R) é (2S,3S).',
    },
    {
      q: 'Um composto <b>meso</b>:',
      o: ['é quiral e opticamente ativo', 'possui estereocentros, mas é aquiral por ter um plano de simetria interno', 'não tem estereocentros', 'é uma mistura racêmica'],
      a: 1,
      e: 'Ex.: ácido meso-tartárico (2R,3S). É superponível à sua imagem especular e não gira a luz polarizada.',
    },
    {
      q: 'Na projeção de Fischer, girar o desenho em <b>90°</b> no plano do papel:',
      o: ['mantém a configuração', 'inverte a configuração', 'transforma em composto meso', 'não é permitido apenas para açúcares'],
      a: 1,
      e: 'Girar 90° troca as linhas horizontais (para a frente) com as verticais (para trás) → representa o enantiômero. Girar 180° é permitido.',
    },
    {
      q: 'Na projeção de Fischer, o H (prioridade 4) está em uma linha <b>horizontal</b> e o caminho 1 → 2 → 3 é horário. A configuração é:',
      o: ['R', 'S', 'Não é possível saber', 'meso'],
      a: 1,
      e: 'Linha horizontal = aponta para o observador. Lê-se o sentido e inverte-se: horário → R aparente → S verdadeiro.',
    },
    {
      q: 'Qual a relação entre o sinal da rotação óptica (+/−) e a configuração R/S?',
      o: ['R é sempre (+)', 'S é sempre (+)', 'Não há relação direta; o sinal é determinado experimentalmente', 'R é (+) somente para álcoois'],
      a: 2,
      e: 'R/S é uma convenção geométrica; (+)/(−) é uma medida experimental. Ex.: o (R)-gliceraldeído é (+), enquanto o (R)-ácido lático é (−).',
    },
    {
      q: 'Uma amostra contém 80 % do enantiômero R e 20 % do S. O excesso enantiomérico é:',
      o: ['20 %', '40 %', '60 %', '80 %'],
      a: 2,
      e: 'ee = %R − %S = 80 − 20 = 60 %.',
    },
    {
      q: 'Em um alceno, os grupos de maior prioridade de cada carbono estão do <b>mesmo lado</b> da dupla. A configuração é:',
      o: ['E', 'Z', 'R', 'S'],
      a: 1,
      e: 'Z (do alemão <i>zusammen</i>, "juntos") — mesmo lado; E (<i>entgegen</i>, "opostos").',
    },
    {
      q: 'Qual dos compostos abaixo é um alceno que <b>não</b> apresenta isomeria geométrica (cis/trans ou E/Z)?',
      o: ['but-2-eno', '2-metilbut-2-eno', 'pent-2-eno', '1,2-dicloroeteno'],
      a: 1,
      e: 'No 2-metilbut-2-eno, um dos carbonos da dupla tem dois CH₃ iguais. Para haver isomeria, cada carbono sp² precisa ter dois ligantes diferentes.',
    },
    {
      q: 'O cis-1,2-dimetilciclo-hexano é:',
      o: ['quiral', 'aquiral (meso)', 'um par de enantiômeros', 'isômero constitucional do trans'],
      a: 1,
      e: 'Tem dois estereocentros (1R,2S), mas possui um plano de simetria no desenho planar → meso. Já o trans-1,2 é quiral: (1R,2R) e (1S,2S).',
    },
    {
      q: 'A configuração da L-alanina (e da maioria dos L-aminoácidos) é:',
      fig: 'fischerAlaninaL',
      o: ['R', 'S', 'E', 'meso'],
      a: 1,
      e: 'Prioridades: NH₂ (1) > COOH (2) > CH₃ (3) > H (4). O caminho NH₂ (esquerda) → COOH (topo) → CH₃ (base) é horário ("R" aparente); como o H está na horizontal, inverte-se: <b>S</b>. Exceção famosa: a L-cisteína é R, porque o –CH₂SH tem prioridade maior que o –COOH.',
    },
    {
      q: 'Diastereoisômeros:',
      o: ['são sempre imagens especulares', 'têm propriedades físicas diferentes e podem ser separados por métodos comuns', 'só existem em alcenos', 'têm a mesma rotação específica, com sinais opostos'],
      a: 1,
      e: 'Como não são imagens especulares, diastereoisômeros têm PF, PE, solubilidade e espectros diferentes — podem ser separados por destilação, cristalização, cromatografia.',
    },
  ];

  G.QUIZ = Q;
})(window);
