/*
 * exdata.js — exercícios resolvidos (16 níveis) e propostos (fácil,
 * intermediário, avançado). Valores de pKa vêm de acid.js.
 */
import { SP, acetate, ethoxide, abFrames, tbuBrFrames, hoHclFrames, bf3Frames, cnFrames, allylFrames, PUZZLES, clclFrames } from './struct.js';
import { A, fmtP } from './acid.js';

const F = (fn, cap) => ({ s: typeof fn === 'function' ? fn() : fn, cap, scale: 36 });
const pk = (k) => fmtP(A[k].pKa);
const puzzle = (key) => PUZZLES.find((p) => p.key === key).puzzle();
const lk = (pa, pb) => pb - pa; // log K ≈ pKa(HB) − pKa(HA)

export const SOLVED = [
  // 1
  { level: 'Homólise e heterólise', title: 'Cl–Cl sob luz', q: 'Que espécies se formam na quebra da ligação Cl–Cl por luz? Que tipo de seta se usa?', fig: [F(clclFrames()[1].s)], think: 'A ligação é polar?', hint: 'Dois átomos iguais: nenhum "puxa" o par.', steps: ['Cl–Cl é apolar: não há átomo preferido para ficar com o par.', 'Com luz (hν) a quebra é homolítica: um elétron para cada Cl.', 'Usam-se duas setas de meia ponta (um elétron cada). Produtos: 2 Cl• (7 elétrons de valência, neutros).'], answer: '2 Cl• (radicais), setas de meia ponta' },
  { level: 'Homólise e heterólise', title: 'Heterólise de C–Br', q: 'Na heterólise da ligação C–Br do (CH₃)₃CBr, quem fica com o par?', fig: [F(tbuBrFrames()[1].s)], think: 'Qual átomo é mais eletronegativo?', hint: 'Br (2,96) × C (2,55).', steps: ['A ligação está polarizada: Cδ+–Brδ−.', 'Na heterólise, os dois elétrons vão para o Br (seta completa da ligação para o Br).', 'Produtos: (CH₃)₃C⁺ (carbocátion terciário, estabilizado) + Br⁻ (octeto, carga −1).'], answer: 'o Br: forma-se Br⁻ e o carbocátion' },
  { level: 'Homólise e heterólise', title: 'Por que A⁺ + B⁻ e não A⁻ + B⁺?', q: 'Para H–Cl, compare H⁺ + Cl⁻ com H⁻ + Cl⁺.', think: 'Qual distribuição coloca a carga negativa no átomo mais capaz de acomodá-la?', hint: 'Eletronegatividade e octeto.', steps: ['Cl é mais eletronegativo: ele já "segura" mais o par (Clδ−).', 'Cl⁻ tem octeto completo; Cl⁺ teria apenas 6 elétrons — muito instável.', 'Logo, a heterólise ocorre como H⁺ + Cl⁻ (na prática, em água, o H⁺ é transferido para H₂O).'], answer: 'H⁺ + Cl⁻' },
  // 2
  { level: 'Radicais, carbocátions e carbânions', title: 'Geometria do carbocátion', q: 'Qual a geometria e a hibridização do (CH₃)₃C⁺? Onde está o orbital vazio?', fig: [F(SP.tbu_cation)], think: 'Quantos grupos de elétrons ao redor do C⁺?', hint: 'Três ligações, nenhum par livre.', steps: ['O C⁺ tem 3 ligações σ e nenhum par: 3 domínios.', 'Geometria trigonal plana, ≈ sp², ângulos ≈ 120°.', 'O orbital p que sobra está vazio, perpendicular ao plano: é ali que o nucleófilo ataca.'], answer: 'trigonal plano, sp², orbital p vazio' },
  { level: 'Radicais, carbocátions e carbânions', title: 'Estabilidade de carbocátions', q: 'Ordene: CH₃⁺, (CH₃)₂CH⁺, (CH₃)₃C⁺, CH₃CH₂⁺.', think: 'O que estabiliza uma carga positiva no carbono?', hint: 'Grupos alquila doam densidade.', steps: ['Grupos alquila doam densidade por hiperconjugação (σC–H/σC–C → p vazio) e efeito indutivo.', 'Mais grupos alquila no C⁺ → mais estável.', '3° > 2° > 1° > metila.'], answer: '(CH₃)₃C⁺ > (CH₃)₂CH⁺ > CH₃CH₂⁺ > CH₃⁺' },
  { level: 'Radicais, carbocátions e carbânions', title: 'Cátion alílico', q: 'Por que o cátion alílico CH₂=CH–CH₂⁺ é mais estável que o propila CH₃CH₂CH₂⁺?', fig: allylFrames().slice(1).map((f) => F(f.s)), think: 'A carga pode se espalhar?', hint: 'Desenhe outra forma de ressonância.', steps: ['A ligação π vizinha pode se deslocar em direção ao C⁺.', 'Duas formas de ressonância equivalentes: a carga + fica em dois carbonos.', 'Carga deslocalizada = espécie mais estável. No propila a carga fica em um só C.'], answer: 'ressonância (deslocalização da carga)' },
  // 3
  { level: 'Brønsted–Lowry', title: 'Identifique os papéis', q: 'CH₃COOH + NH₃ ⇌ CH₃COO⁻ + NH₄⁺: identifique ácido, base e conjugados.', think: 'Quem perde H⁺? Quem ganha?', hint: 'Pares conjugados diferem por um H⁺.', steps: ['CH₃COOH perde H⁺ → ácido; CH₃COO⁻ é sua base conjugada.', 'NH₃ ganha H⁺ → base; NH₄⁺ é seu ácido conjugado.', 'Pares: CH₃COOH/CH₃COO⁻ e NH₄⁺/NH₃.'], answer: 'ácido CH₃COOH; base NH₃; base conj. CH₃COO⁻; ácido conj. NH₄⁺' },
  { level: 'Brønsted–Lowry', title: 'Água anfótera', q: 'A água é ácido ou base?', think: 'Depende do parceiro.', hint: 'Compare com HCl e com NH₂⁻.', steps: ['Com HCl, a água recebe H⁺ (base): forma H₃O⁺.', 'Com NH₂⁻, a água doa H⁺ (ácido): forma HO⁻.', 'Espécies que fazem os dois papéis são anfóteras.'], answer: 'ambos (anfótera)' },
  // 4
  { level: 'Lewis', title: 'BF₃ + NH₃', q: 'Classifique BF₃ e NH₃ segundo Lewis e desenhe a seta.', fig: [F(bf3Frames()[1].s)], think: 'Quem tem par livre? Quem tem orbital vazio?', hint: 'B tem só 6 elétrons.', steps: ['NH₃ tem um par livre: base de Lewis (doador).', 'BF₃ tem B com orbital p vazio: ácido de Lewis (receptor).', 'Seta: par do N → B. Produto H₃N⁺–B⁻F₃ (carga total 0).'], answer: 'NH₃ base de Lewis; BF₃ ácido de Lewis' },
  { level: 'Lewis', title: 'HO⁻ + HCl sob dois olhares', q: 'Na reação HO⁻ + HCl → H₂O + Cl⁻, o HO⁻ é base de Brønsted, de Lewis ou ambas?', fig: [F(hoHclFrames()[1].s)], think: 'O que o HO⁻ recebe? O que ele doa?', hint: 'Uma visão foca no H⁺, a outra no par.', steps: ['Recebe H⁺ → base de Brønsted.', 'Doa um par de elétrons para formar a ligação O–H → base de Lewis.', 'Toda base de Brønsted é base de Lewis; o H do HCl é o centro eletrofílico.'], answer: 'ambas' },
  // 5
  { level: 'Eletrófilos e nucleófilos', title: 'Classifique', q: 'Classifique: CN⁻, CH₃⁺, H₂O, BF₃, CH₃Br (carbono).', think: 'Rico ou pobre em elétrons?', hint: 'Par livre/carga − → nucleófilo; orbital vazio/δ+ → eletrófilo.', steps: ['CN⁻: par livre e carga −1 → nucleófilo.', 'CH₃⁺ e BF₃: orbital p vazio → eletrófilos.', 'H₂O: pares livres → nucleófilo (fraco). C do CH₃Br: δ+ → eletrófilo.'], answer: 'Nu: CN⁻, H₂O · E: CH₃⁺, BF₃, C do CH₃Br' },
  { level: 'Eletrófilos e nucleófilos', title: 'Basicidade × nucleofilicidade', q: 'Por que não se pode dizer simplesmente "base forte = nucleófilo forte"?', think: 'Uma propriedade é de equilíbrio; a outra, de velocidade.', hint: 'Termodinâmica × cinética.', steps: ['Basicidade: posição de equilíbrio com H⁺ (termodinâmica, pKa).', 'Nucleofilicidade: velocidade do ataque a um eletrófilo, geralmente carbono (cinética).', 'Costumam andar juntas, mas tamanho, solvente e impedimento estérico podem separá-las (ex.: I⁻ é ótimo nucleófilo e base muito fraca).'], answer: 'basicidade é termodinâmica; nucleofilicidade é cinética' },
  // 6
  { level: 'Setas curvas', title: 'Transferência de próton', q: 'Desenhe as setas para HO⁻ + H–Cl.', fig: [F(hoHclFrames()[0].s)], think: 'De onde vêm os elétrons? Para onde vão?', hint: 'Duas setas: uma forma, outra quebra.', steps: ['Seta 1: do par livre do O até o H (forma O–H).', 'Seta 2: da ligação H–Cl até o Cl (quebra H–Cl).', 'O H nunca fica com duas ligações; a carga −1 passa do O para o Cl.'], answer: 'par O → H; ligação H–Cl → Cl' },
  { level: 'Setas curvas', title: 'Por que duas setas no CH₃Br?', q: 'No ataque de CN⁻ ao CH₃Br, por que a seta C–Br → Br é obrigatória?', fig: [F(cnFrames()[1].s)], think: 'Conte as ligações do carbono.', hint: 'Valência do C.', steps: ['O C do CH₃Br já tem 4 ligações.', 'Se recebe uma nova ligação (do CN⁻), precisa perder outra.', 'A ligação C–Br se rompe e o par vai para o Br (Br⁻).'], answer: 'para o C não ficar com 5 ligações' },
  { level: 'Setas curvas', title: 'Seta de meia ponta', q: 'Quantos elétrons uma seta de meia ponta representa?', think: 'Compare com a seta completa.', hint: 'Radicais.', steps: ['Seta completa = 2 elétrons.', 'Seta de meia ponta (fishhook) = 1 elétron.', 'Usada em processos radicalares (homólise, formação homolítica).'], answer: '1 elétron' },
  // 7
  { level: 'pKa e força ácido-base', title: 'pKa e Ka', q: 'Um ácido tem pKa = 4,76. Qual o Ka? Ele é mais forte que um ácido de pKa 10?', think: 'pKa = −log Ka.', hint: 'Diferença de pKa = fator de 10 por unidade.', steps: ['Ka = 10⁻⁴·⁷⁶ ≈ 1,7 × 10⁻⁵.', 'Menor pKa → maior Ka → ácido mais forte.', 'Diferença de 5,24 unidades → ≈ 1,7 × 10⁵ vezes mais forte.'], answer: 'Ka ≈ 1,7 × 10⁻⁵; sim' },
  { level: 'pKa e força ácido-base', title: 'Ácido forte, base fraca', q: 'HCl (pKa ≈ −7) e H₂O (pKa 15,7): qual base conjugada é mais forte?', think: 'Relação inversa.', hint: 'Ácido forte → base conjugada fraca.', steps: ['HCl é muito mais forte que H₂O.', 'Logo Cl⁻ é uma base muito mais fraca que HO⁻.', 'HO⁻ é a base mais forte.'], answer: 'HO⁻' },
  // 8
  { level: 'Bases conjugadas', title: 'Etanol × ácido acético', q: 'Desenhe as bases conjugadas e explique a diferença de acidez.', fig: [F(ethoxide, 'etóxido'), F(() => acetate(0), 'acetato')], think: 'Onde fica a carga em cada uma?', hint: 'O acetato tem mais de uma forma de ressonância.', steps: [`Etanol (pKa ${pk('EtOH')}) → etóxido: carga em um único O.`, `Ácido acético (pKa ${pk('AcOH')}) → acetato: carga distribuída entre dois O.`, 'Base conjugada mais estável → ácido mais forte: o ácido acético é ≈ 10¹¹ vezes mais ácido.'], answer: 'ácido acético (ressonância no acetato)' },
  { level: 'Bases conjugadas', title: 'Qual H sai?', q: 'No ácido acético há H no CH₃ e H no O. Qual é removido por uma base?', think: 'Compare as bases conjugadas possíveis.', hint: 'Carga em O (ressonância) × carga em C.', steps: ['Remover o H do O gera o acetato (carga em O, deslocalizada).', 'Remover H do CH₃ geraria carbânion (C menos eletronegativo).', 'O H do O–H é muito mais ácido (pKa ≈ 4,8 × ≈ 25).'], answer: 'o H do O–H' },
  // 9
  { level: 'Ressonância', title: 'Formas do acetato', q: 'Desenhe as setas que convertem uma forma de ressonância do acetato na outra.', fig: [F(() => acetate(0, { arrows: true }))], think: 'Só elétrons se movem.', hint: 'Par livre do O⁻ → ligação C–O; π C=O → O.', steps: ['Seta 1: par livre do O⁻ forma π com o C.', 'Seta 2: π C=O vai para o outro O.', 'Mesma conectividade; a carga troca de O. O acetato real é o híbrido.'], answer: 'duas setas; conectividade inalterada' },
  { level: 'Ressonância', title: 'Ressonância não é equilíbrio', q: 'As duas formas do acetato se interconvertem rapidamente?', think: 'Formas de ressonância são moléculas?', hint: 'Medidas de comprimento de ligação.', steps: ['Não: são duas representações de UMA estrutura eletrônica.', 'Experimentalmente, as duas ligações C–O são iguais (≈ 1,26 Å).', 'O híbrido é a realidade; cada forma isolada é um "retrato" incompleto.'], answer: 'não — é uma única estrutura deslocalizada' },
  // 10
  { level: 'Eletronegatividade e tamanho', title: 'Período 2', q: 'Ordene a acidez: CH₄, NH₃, H₂O, HF.', think: 'Átomos de tamanhos semelhantes.', hint: 'Eletronegatividade C < N < O < F.', steps: ['Mesmo período: o fator dominante é a eletronegatividade.', 'F⁻ acomoda melhor a carga que HO⁻, NH₂⁻ e CH₃⁻.', `HF (${pk('HF')}) > H₂O (${pk('H2O')}) > NH₃ (${pk('NH3')}) > CH₄ (${pk('CH4')}).`], answer: 'HF > H₂O > NH₃ > CH₄' },
  { level: 'Eletronegatividade e tamanho', title: 'Grupo 17', q: 'Por que HI é mais ácido que HF, se o F é mais eletronegativo?', think: 'O que muda ao descer no grupo?', hint: 'Tamanho e força da ligação.', steps: ['Ao descer no grupo, o átomo cresce muito.', 'A carga de I⁻ se espalha em grande volume (mais estável) e a ligação H–I é longa e fraca (298 × 570 kJ/mol para H–F).', `Por isso HI (${pk('HI')}) ≫ HF (${pk('HF')}).`], answer: 'tamanho/ligação mais fraca dominam no grupo' },
  // 11
  { level: 'Hibridização', title: 'Etano × eteno × etino', q: 'Ordene a acidez dos H de etano, eteno e etino.', think: 'Em que orbital fica o par da base conjugada?', hint: '% de caráter s.', steps: ['sp³ (25% s), sp² (33% s), sp (50% s).', 'Mais caráter s → par mais próximo do núcleo → carga mais estabilizada.', 'Etino (25) > eteno (44) > etano (50).'], answer: 'etino > eteno > etano' },
  { level: 'Hibridização', title: 'Desprotonar acetileno', q: 'NH₂⁻ (pKa NH₃ = 38) desprotona HC≡CH (pKa 25)? E HO⁻ (pKa H₂O = 15,7)?', think: 'Compare os pKa dos ácidos dos dois lados.', hint: 'O equilíbrio favorece o ácido mais fraco.', steps: [`Com NH₂⁻: log K ≈ 38 − 25 = 13 → K ≈ 10¹³, desprotonação completa.`, 'Com HO⁻: log K ≈ 15,7 − 25 = −9,3 → K ≈ 10⁻⁹, praticamente não ocorre.', 'Para formar acetileto usa-se NaNH₂.'], answer: 'NH₂⁻ sim; HO⁻ não' },
  // 12
  { level: 'Efeito indutivo', title: 'Ácidos cloroacéticos', q: 'Ordene: CH₃COOH, ClCH₂COOH, Cl₂CHCOOH, Cl₃CCOOH.', think: 'O que os Cl fazem com a densidade eletrônica?', hint: 'Indução cumulativa.', steps: ['Cl retira densidade pelas ligações σ (efeito indutivo).', 'Mais Cl → carboxilato mais estabilizado.', `Cl₃C (${pk('CCl3COOH')}) > Cl₂CH (${pk('CHCl2COOH')}) > ClCH₂ (${pk('ClCH2COOH')}) > CH₃ (${pk('AcOH')}).`], answer: 'Cl₃CCOOH > Cl₂CHCOOH > ClCH₂COOH > CH₃COOH' },
  { level: 'Efeito indutivo', title: 'Distância', q: 'Compare ClCH₂COOH, ClCH₂CH₂COOH e ClCH₂CH₂CH₂COOH.', think: 'Como o efeito varia com o número de ligações?', hint: 'Decai rapidamente.', steps: ['O efeito indutivo é transmitido por ligações σ e enfraquece a cada ligação.', `α: ${pk('ClCH2COOH')}; β: ${pk('Cl3prop')}; γ: ${pk('Cl4but')}.`, 'Quanto mais perto do COOH, mais ácido.'], answer: 'α > β > γ' },
  // 13
  { level: 'Equilíbrio ácido-base', title: 'Prever o lado favorecido', q: 'CH₃COOH + HO⁻ ⇌ CH₃COO⁻ + H₂O: qual lado é favorecido? Estime K.', think: 'Compare os dois ácidos.', hint: 'log K ≈ pKa(HB) − pKa(HA).', steps: [`pKa(CH₃COOH) = ${pk('AcOH')}; pKa(H₂O) = ${pk('H2O')}.`, `log K ≈ 15,7 − 4,76 ≈ ${fmtP(+lk(4.76, 15.7).toFixed(1))} → K ≈ 10¹¹.`, 'Favorece produtos: lado do ácido mais fraco (H₂O) e da base mais fraca (CH₃COO⁻).'], answer: 'produtos; K ≈ 10¹¹' },
  { level: 'Equilíbrio ácido-base', title: 'Metanol + hidróxido', q: 'CH₃OH + HO⁻ ⇌ CH₃O⁻ + H₂O: K?', think: 'pKa muito próximos.', hint: '15,5 × 15,7.', steps: ['log K ≈ 15,7 − 15,5 = 0,2.', 'K ≈ 1,6: os dois lados têm concentrações comparáveis.', 'Por isso HO⁻ gera apenas parte do metóxido.'], answer: 'K ≈ 1–2' },
  // 14
  { level: 'K e ΔG', title: 'Sinal de ΔG°', q: 'Para K = 1000, 1 e 0,001, qual o sinal de ΔG°?', think: 'ΔG° = −RT ln K.', hint: 'ln 1 = 0.', steps: ['K = 1000: ln K > 0 → ΔG° < 0.', 'K = 1: ΔG° = 0.', 'K = 0,001: ln K < 0 → ΔG° > 0.'], answer: '−, 0, +' },
  { level: 'K e ΔG', title: 'Cálculo', q: 'Calcule ΔG° a 298 K para K = 1,0 × 10⁵.', think: 'Use R = 8,314 J mol⁻¹ K⁻¹.', hint: 'ln(10⁵) = 11,5.', steps: ['ΔG° = −(8,314)(298)(11,51) J/mol.', '= −28 500 J/mol ≈ −28,5 kJ/mol.', 'Atalho a 298 K: ΔG° ≈ −5,71 × log K kJ/mol.'], answer: '≈ −28,5 kJ/mol' },
  // 15
  { level: 'Diagramas de energia', title: 'Leia o diagrama', q: 'No diagrama, identifique reagentes, ETs, intermediário, produtos, etapa de maior barreira e sinal de ΔG.', fig: { energy: ['quiz1'] }, think: 'Máximos × mínimos.', hint: 'ET = máximo; intermediário = mínimo local entre dois ETs.', steps: ['A = reagentes; E = produtos; B e D = estados de transição; C = intermediário.', 'Maior barreira: de C até D (2ª etapa), que tende a controlar a velocidade.', 'E está acima de A → ΔG > 0 (endergônica).'], answer: 'B, D = ET; C = intermediário; etapa 2 mais lenta; ΔG > 0' },
  { level: 'Diagramas de energia', title: 'Favorável e lenta?', q: 'Uma reação tem ΔG° = −80 kJ/mol e Ea = 150 kJ/mol. Ela é rápida?', think: 'ΔG e Ea medem coisas diferentes.', hint: 'Termodinâmica × cinética.', steps: ['ΔG° < 0: produtos favorecidos no equilíbrio.', 'Ea muito alta: poucas colisões têm energia suficiente → lenta à temperatura ambiente.', 'Favorável ≠ rápida (ex.: combustão da madeira sem ignição).'], answer: 'não necessariamente — favorável, mas lenta' },
  // 16
  { level: 'Mecanismos introdutórios', title: 'Mecanismo ácido-base em 5 passos', q: 'Descreva o mecanismo de HO⁻ + CH₃OH ⇌ H₂O + CH₃O⁻.', think: 'Qual H é ácido?', hint: 'O–H, não C–H.', steps: ['A base identifica o H ácido (do O–H).', 'O par livre do HO⁻ ataca esse H.', 'A ligação O–H do metanol se rompe ao mesmo tempo; os elétrons ficam no O, formando CH₃O⁻ (uma etapa elementar, concertada).'], answer: 'uma etapa, duas setas' },
  { level: 'Mecanismos introdutórios', title: 'Mecanismo em 3 etapas', q: 'Proponha um mecanismo para (CH₃)₃CBr + H₂O → (CH₃)₃COH + HBr em etapas.', think: 'Que intermediários estáveis podem se formar?', hint: 'Carbocátion terciário.', steps: ['Heterólise C–Br → carbocátion + Br⁻ (etapa lenta).', 'H₂O ataca o C⁺ → íon oxônio.', 'Outra H₂O remove o H⁺ do oxônio → álcool + H₃O⁺ (que com Br⁻ corresponde a HBr).'], answer: 'heterólise → ataque nucleofílico → transferência de próton' },
  { level: 'Mecanismos introdutórios', title: 'Primeira seta correta', q: 'Na reação CH₃O⁻ + CH₃Br → CH₃OCH₃ + Br⁻, qual é a primeira seta?', think: 'Quem é o nucleófilo?', hint: 'Par livre do O⁻.', steps: ['Nucleófilo: CH₃O⁻ (par livre, carga −1).', 'Eletrófilo: C δ+ do CH₃Br.', 'Seta 1: par do O⁻ → C; seta 2 (simultânea): C–Br → Br.'], answer: 'par livre do O⁻ → C do CH₃Br' },
];

/* ===================================================================
 * Propostos
 * =================================================================== */
const mc = (title, q, o, e, fig) => ({ title, type: 'mc', q, o, a: 0, e, fig });
const tf = (title, items, e) => ({ title, type: 'tf', q: 'Verdadeiro ou falso:', items, e });
const arrows = (title, key, q) => ({ title, type: 'arrows', q, puzzle: puzzle(key), e: 'Setas partem de pares ou ligações e terminam onde a nova ligação se forma (ou no átomo que recebe o par).' });

export const PROPOSED = {
  easy: [
    mc('Homólise', 'Na homólise de A–B formam-se:', ['dois radicais', 'dois íons', 'um carbocátion e um carbânion', 'nenhuma espécie nova'], 'Um elétron para cada átomo.'),
    mc('Heterólise', 'Na heterólise de C–Br, o par fica com:', ['o Br', 'o C', 'é dividido', 'sai como H⁺'], 'Átomo mais eletronegativo.'),
    mc('Setas', 'Uma seta de meia ponta representa:', ['1 elétron', '2 elétrons', 'um átomo', 'um próton'], 'Fishhook.'),
    mc('Radicais', 'Um radical tem:', ['elétron desemparelhado', 'carga obrigatoriamente negativa', 'octeto completo sempre', 'orbital vazio e carga +'], 'Definição.'),
    mc('Carbocátion', 'Geometria do CH₃⁺:', ['trigonal plana', 'tetraédrica', 'linear', 'piramidal'], 'sp², p vazio.', [F(SP.methyl_cation)]),
    mc('Carbânion', 'O CH₃⁻ possui:', ['um par não ligante no C', 'um orbital p vazio', 'um elétron desemparelhado', 'carga +'], 'Carga formal −1 e par livre.', [F(SP.methyl_anion)]),
    mc('Brønsted', 'Base de Brønsted–Lowry é:', ['receptora de próton', 'doadora de próton', 'receptora de par', 'doadora de elétron único'], 'Definição.'),
    mc('Lewis', 'Ácido de Lewis é:', ['receptor de par eletrônico', 'doador de par', 'doador de próton apenas', 'sempre um metal'], 'Definição.'),
    mc('Pares conjugados', 'Base conjugada de H₂O:', ['HO⁻', 'H₃O⁺', 'O²⁻', 'H₂'], 'Remova H⁺.'),
    mc('Pares conjugados', 'Ácido conjugado de NH₃:', ['NH₄⁺', 'NH₂⁻', 'N₂', 'NH₃⁺'], 'Adicione H⁺.'),
    { title: 'Eletrófilo ou nucleófilo?', type: 'match', q: 'Associe:', pairs: [['CN⁻', 'nucleófilo'], ['BF₃', 'eletrófilo'], ['NH₃', 'nucleófilo'], ['CH₃⁺', 'eletrófilo']], e: 'Par livre/carga − → Nu; orbital vazio/carga + → E.' },
    mc('pKa', 'Menor pKa significa:', ['ácido mais forte', 'ácido mais fraco', 'base mais forte', 'reação mais rápida'], 'pKa = −log Ka.'),
    mc('pKa', 'Qual é o mais ácido?', [`CH₃COOH (${pk('AcOH')})`, `H₂O (${pk('H2O')})`, `NH₃ (${pk('NH3')})`, `CH₄ (${pk('CH4')})`], 'Menor pKa.'),
    tf('Conceitos', [['Setas curvas mostram movimento de elétrons.', 'V'], ['Um ácido forte tem base conjugada forte.', 'F'], ['K > 1 ↔ ΔG° < 0.', 'V'], ['O estado de transição pode ser isolado.', 'F']], 'Revise as definições.'),
    mc('K e ΔG', 'Se K = 1, então ΔG° é:', ['zero', 'negativo', 'positivo', 'infinito'], 'ln 1 = 0.'),
    mc('Diagramas', 'Reação exergônica: os produtos estão', ['abaixo dos reagentes', 'acima dos reagentes', 'na mesma altura do ET', 'no topo da barreira'], 'ΔG < 0.'),
    mc('Intermediário', 'Um intermediário corresponde a:', ['um mínimo local de energia', 'um máximo', 'o ponto final', 'nenhum ponto do diagrama'], 'Entre dois ETs.'),
    mc('Hibridização', 'Caráter s de um orbital sp:', ['50%', '25%', '33%', '75%'], 'Um s + um p.'),
    mc('Indução', 'Efeito indutivo é transmitido por:', ['ligações σ', 'ligações π apenas', 'pontes de hidrogênio', 'luz'], 'Polarização ao longo das σ.'),
    { title: 'Ácido → base conjugada', type: 'match', q: 'Associe o ácido à sua base conjugada:', pairs: [['CH₃COOH', 'CH₃COO⁻'], ['NH₄⁺', 'NH₃'], ['ROH', 'RO⁻'], ['H₃O⁺', 'H₂O']], e: 'Diferem por um H⁺.' },
  ],
  mid: [
    arrows('Desenhe as setas', 'hoHcl', 'HO⁻ + HCl → H₂O + Cl⁻'),
    arrows('Desenhe as setas', 'bf3', 'NH₃ + BF₃ → aduto'),
    arrows('Desenhe as setas', 'tbuBr', 'Heterólise do (CH₃)₃CBr'),
    arrows('Desenhe as setas', 'cn', 'CN⁻ + CH₃Br → CH₃CN + Br⁻'),
    arrows('Ressonância', 'acetate', 'Desenhe outra forma de ressonância do acetato (setas).'),
    arrows('Desenhe as setas', 'acetoneH', 'Protonação da acetona por H₃O⁺'),
    mc('Homólise', 'Quebra homolítica de CH₃–H produz:', ['CH₃• + H•', 'CH₃⁺ + H⁻', 'CH₃⁻ + H⁺', 'CH₂ + H₂'], 'Um elétron para cada fragmento.'),
    mc('Heterólise', 'Heterólise mais provável de H₃C–OH₂⁺:', ['CH₃⁺ + H₂O', 'CH₃⁻ + H₂O²⁺', 'CH₃• + H₂O•⁺', 'CH₄ + OH⁺'], 'O par vai para o O⁺, que sai como água neutra.'),
    mc('Carbocátions', 'Mais estável:', ['(CH₃)₃C⁺', '(CH₃)₂CH⁺', 'CH₃CH₂⁺', 'CH₃⁺'], 'Hiperconjugação/indução.'),
    mc('Carbocátions', 'O cátion alílico é estabilizado por:', ['ressonância', 'ligação de hidrogênio', 'ser sp³', 'ter octeto completo'], 'Carga em dois C.', allylFrames().slice(0, 1).map((f) => F(f.s))),
    mc('Lewis × Brønsted', 'Em NH₃ + H₂O ⇌ NH₄⁺ + HO⁻, a água é:', ['ácido de Brønsted', 'base de Brønsted', 'base de Lewis', 'nenhum'], 'Doa H⁺ ao NH₃.'),
    mc('Nucleófilo × base', 'Basicidade está ligada a:', ['equilíbrio (termodinâmica)', 'velocidade (cinética)', 'massa molar', 'cor'], 'pKa é medida de equilíbrio.'),
    mc('Eletrófilos', 'Onde o nucleófilo ataca a acetona?', ['no C da carbonila', 'no O', 'nos H do CH₃', 'na ligação C–C'], 'C δ+.', [F(SP.acetone)]),
    mc('Acidez', 'Mais ácido: etanol ou ácido acético?', ['ácido acético (ressonância no acetato)', 'etanol (carga localizada)', 'iguais', 'depende só da massa'], `${pk('AcOH')} × ${pk('EtOH')}.`),
    mc('Acidez', 'Mais ácido: etano ou etino?', ['etino (C sp)', 'etano (C sp³)', 'iguais', 'nenhum é ácido'], '25 × 50.'),
    mc('Acidez', 'Mais ácido: fenol ou cicloexanol?', ['fenol (fenóxido deslocalizado no anel)', 'cicloexanol', 'iguais', 'depende da luz'], `${pk('PhOH')} × ${pk('cHexOH')}.`),
    mc('Acidez', 'Mais ácido: CH₃COOH ou Cl₃CCOOH?', ['Cl₃CCOOH (indução)', 'CH₃COOH', 'iguais', 'nenhum'], `${pk('CCl3COOH')} × ${pk('AcOH')}.`),
    mc('Acidez', 'Mais ácido: H₂O ou H₂S?', ['H₂S (S maior)', 'H₂O (O mais eletronegativo)', 'iguais', 'nenhum'], `Grupo: tamanho domina (${pk('H2S')} × ${pk('H2O')}).`),
    { title: 'Ranking', type: 'order', q: 'Ordene do ácido mais forte ao mais fraco:', items: [{ id: 'a', label: 'Cl₃CCOOH' }, { id: 'b', label: 'Cl₂CHCOOH' }, { id: 'c', label: 'ClCH₂COOH' }, { id: 'd', label: 'CH₃COOH' }], correct: ['a', 'b', 'c', 'd'], top: 'mais forte', bottom: 'mais fraco', explain: 'Mais Cl = mais indução = carboxilato mais estável.', e: 'Efeito indutivo cumulativo.' },
    { title: 'Ranking', type: 'order', q: 'Ordene do ácido mais forte ao mais fraco:', items: [{ id: 'a', label: 'HI' }, { id: 'b', label: 'HBr' }, { id: 'c', label: 'HCl' }, { id: 'd', label: 'HF' }], correct: ['a', 'b', 'c', 'd'], top: 'mais forte', bottom: 'mais fraco', explain: 'Tamanho e força da ligação H–X.', e: 'Descendo o grupo.' },
    { title: 'Ranking', type: 'order', q: 'Ordene do ácido mais forte ao mais fraco:', items: [{ id: 'a', label: 'HC≡CH' }, { id: 'b', label: 'CH₂=CH₂' }, { id: 'c', label: 'CH₃CH₃' }], correct: ['a', 'b', 'c'], top: 'mais forte', bottom: 'mais fraco', explain: 'sp > sp² > sp³ (caráter s).', e: 'Hibridização.' },
    mc('Equilíbrio', 'pKa(HA) = 5, pKa(HB) = 15. HA + B⁻ ⇌ A⁻ + HB favorece:', ['produtos, K ≈ 10¹⁰', 'reagentes, K ≈ 10⁻¹⁰', 'nenhum lado, K = 1', 'produtos, K ≈ 10'], 'log K ≈ 15 − 5 = 10.'),
    mc('Equilíbrio', 'HC≡CH + HO⁻ ⇌ HC≡C⁻ + H₂O:', ['reagentes favorecidos (K ≈ 10⁻⁹)', 'produtos favorecidos', 'K = 1', 'reação irreversível'], 'log K ≈ 15,7 − 25.'),
    mc('Base mais forte', 'Qual é a base mais forte?', ['NH₂⁻', 'HO⁻', 'F⁻', 'CH₃COO⁻'], 'Ácido conjugado de maior pKa (NH₃, 38).'),
    mc('K e ΔG', 'K = 10⁻³ a 298 K: ΔG° ≈', ['+17 kJ/mol', '−17 kJ/mol', '0', '+1,7 kJ/mol'], '−5,71 × (−3) ≈ +17.'),
    mc('K e ΔG', 'ΔG° = −11,4 kJ/mol (298 K): K ≈', ['100', '0,01', '1', '10⁶'], 'log K = 11,4/5,71 ≈ 2.'),
    { title: 'Diagrama', type: 'mc', q: 'No diagrama, o ponto C é:', fig: { energy: ['quiz1'] }, o: ['um intermediário', 'um estado de transição', 'o reagente', 'o produto'], a: 0, e: 'Mínimo local entre B e D.' },
    { title: 'Diagrama', type: 'mc', q: 'No mesmo diagrama, a etapa mais lenta é:', fig: { energy: ['quiz1'] }, o: ['C → E (pelo ET D)', 'A → C (pelo ET B)', 'nenhuma', 'ambas iguais'], a: 0, e: 'Maior barreira: C → D.' },
    { title: 'Conservação de carga', type: 'tf', q: 'A carga total foi conservada?', items: [['HO⁻ + HCl → H₂O + Cl⁻', 'V'], ['NH₃ + HCl → NH₄⁺ + Cl⁻', 'V'], ['HO⁻ + CH₃Br → CH₃OH + Br', 'F'], ['(CH₃)₃C⁺ + H₂O → (CH₃)₃COH₂⁺', 'V']], e: 'Some as cargas dos dois lados.' },
    { title: 'Fator → efeito', type: 'match', q: 'Associe o fator ao efeito na acidez:', pairs: [['ressonância na base conjugada', 'aumenta'], ['grupo doador de elétrons próximo', 'diminui'], ['maior caráter s do C', 'aumenta'], ['Cl mais distante do COOH', 'efeito menor']], e: 'Estabilizar A⁻ aumenta a acidez.' },
  ],
  hard: [
    mc('Detecte o erro', 'Um estudante desenhou uma seta partindo do H⁺ em direção ao par livre do O. Erro?', ['setas partem de elétrons, não de H⁺', 'nenhum', 'deveria ser seta de meia ponta', 'faltou a carga do O'], 'A seta mostra o par do O indo ao H.'),
    mc('Detecte o erro', 'Mecanismo desenha H ligado a dois átomos após a seta. Erro?', ['H com duas ligações (excede a valência)', 'carga não conservada', 'nenhum', 'ressonância incorreta'], 'H forma uma única ligação.'),
    mc('Detecte o erro', 'CN⁻ ataca o C do CH₃Br e só uma seta é desenhada. Erro?', ['carbono ficaria pentavalente', 'O CN⁻ não é nucleófilo', 'faltou seta de meia ponta', 'nenhum'], 'Precisa da seta C–Br → Br.'),
    mc('Detecte o erro', 'Mecanismo: HO⁻ + CH₃Br → CH₃OH + Br. Erro?', ['carga não conservada (Br deveria ser Br⁻)', 'nenhum', 'O deveria ser O⁺', 'falta um H'], '−1 → 0.'),
    mc('Detecte o erro', 'Uma "forma de ressonância" move um H de um átomo para outro. Erro?', ['mudou a conectividade (isso é tautomeria, não ressonância)', 'nenhum', 'faltou carga', 'deveria usar seta dupla'], 'Na ressonância só elétrons se movem.'),
    mc('Detecte o erro', '"O pKa do etanol (16) é maior que o da água (15,7), então o etanol é mais ácido." Erro?', ['maior pKa = ácido mais fraco', 'nenhum', 'pKa não se compara', 'água não é ácido'], 'Interpretação invertida.'),
    mc('Detecte o erro', '"A reação tem K = 10⁸, logo é muito rápida." Erro?', ['K fala de equilíbrio, não de velocidade', 'nenhum', 'K deveria ser < 1', 'confundiu pKa'], 'Velocidade depende da Ea.'),
    mc('Detecte o erro', '"ΔG‡ e ΔG° são a mesma grandeza." Erro?', ['ΔG° compara reagentes e produtos; Ea/ΔG‡ é a barreira', 'nenhum', 'são iguais em reações exergônicas', 'só diferem em sinal'], 'Grandezas diferentes.'),
    mc('Detecte o erro', '"A base conjugada de NH₄⁺ é NH₂⁻." Erro?', ['é NH₃ (difere por um H⁺)', 'nenhum', 'é N³⁻', 'é NH₅'], 'Um H⁺ por vez.'),
    mc('Detecte o erro', 'Uma seta parte de um par de elétrons inexistente (átomo sem par livre). Erro?', ['elétrons "inventados": não há par para mover', 'nenhum', 'carga incorreta apenas', 'seta deveria ser reta'], 'Verifique a contagem eletrônica.'),
    mc('Integração', 'CF₃CH₂OH (12,4) × CH₃CH₂OH (16): o fator decisivo é', ['efeito indutivo dos F', 'ressonância', 'hibridização', 'tamanho do O'], 'Os F estão a duas ligações do C–O.'),
    mc('Integração', 'NH₃ (38) × HC≡CH (25): por que o C (menos eletronegativo) ganha?', ['o par do acetileto está em sp (50% s)', 'o N é maior', 'ressonância no acetileto', 'efeito indutivo do H'], 'A hibridização compensa a menor eletronegatividade.'),
    mc('Integração', 'Qual base desprotona completamente o etanol (pKa 16)?', ['NaNH₂ (pKa NH₃ 38)', 'NaOH (15,7)', 'CH₃COONa (4,8)', 'NaCl'], 'Base cujo ácido conjugado tem pKa bem maior.'),
    mc('Integração', 'O fenóxido é mais estável que o cicloexóxido porque', ['a carga se deslocaliza pelo anel', 'o O do fenóxido é sp³', 'o anel é doador', 'o fenol é maior'], 'Ressonância com o anel aromático.'),
    mc('Cálculo', 'CH₃COOH + NH₃ ⇌ CH₃COO⁻ + NH₄⁺: K ≈', ['10⁴·⁵', '10⁻⁴·⁵', '1', '10⁻⁹'], 'log K ≈ 9,25 − 4,76.'),
    mc('Cálculo', 'K = 1,0 × 10⁻⁵ a 298 K: ΔG° ≈', ['+28,5 kJ/mol', '−28,5 kJ/mol', '+5,7 kJ/mol', '0'], '−5,71 × (−5).'),
    mc('Cálculo', 'Duplicar T (de 298 para 596 K) com K = 10³ fixo faz ΔG°', ['dobrar em módulo (−17 → −34 kJ/mol)', 'ficar igual', 'mudar de sinal', 'zerar'], 'ΔG° = −RT ln K.'),
    mc('Mecanismo', 'Em (CH₃)₃COH₂⁺ → (CH₃)₃C⁺ + H₂O, a seta vai', ['da ligação C–O para o O', 'do O para o C', 'do C para o O (átomo)', 'do H para o O'], 'Heterólise: par vai para o O⁺.'),
    mc('Mecanismo', 'Na etapa determinante de (CH₃)₃CBr + H₂O, forma-se', ['carbocátion terciário', 'carbânion', 'radical', 'aduto de Lewis'], 'Heterólise C–Br.'),
    { title: 'Diagrama → classificação', type: 'match', q: 'Associe cada ponto do diagrama (perfil de duas etapas):', fig: { energy: ['quiz1'] }, pairs: [['A', 'reagentes'], ['B', 'estado de transição'], ['C', 'intermediário'], ['E', 'produtos']], e: 'Máximos = ET; mínimo local = intermediário.' },
  ],
};
void abFrames; void SP; void bf3Frames;
