/*
 * library.js — moléculas da aplicação. Cada entrada define cadeia,
 * substituintes, configuração desejada, locantes e nome (com {cfg}).
 * family: identifica a constituição (mesma family = mesma conectividade).
 */
const c = (f, b) => ({ f, b });
export const LIB = {
  bcf: { family: 'bcf', name: '{cfg}bromoclorofluorometano', chain: ['Br', c('F', 'H'), 'Cl'], cfg: ['R'], loc: [1] },
  butanol2: { family: 'butanol2', name: '{cfg}butan-2-ol', chain: ['CH3', c('OH', 'H'), 'Et'], cfg: ['R'], loc: [2] },
  bromobutano2: { family: 'bromobutano2', name: '{cfg}2-bromobutano', chain: ['CH3', c('Br', 'H'), 'Et'], cfg: ['S'], loc: [2] },
  lactico: { family: 'lactico', name: 'ácido {cfg}2-hidroxipropanoico (ácido lático)', chain: ['COOH', c('OH', 'H'), 'CH3'], cfg: ['S'], loc: [2] },
  gliceraldeido: { family: 'gliceraldeido', name: '{cfg}2,3-di-hidroxipropanal (gliceraldeído)', chain: ['CHO', c('OH', 'H'), 'CH2OH'], cfg: ['R'], loc: [2] },
  alanina: { family: 'alanina', name: 'ácido {cfg}2-aminopropanoico (alanina)', chain: ['COOH', c('NH2', 'H'), 'CH3'], cfg: ['S'], loc: [2] },
  metilhexano3: { family: 'metilhexano3', name: '{cfg}3-metil-hexano', chain: ['Et', c('CH3', 'H'), 'Pr'], cfg: ['R'], loc: [3] },
  deuterioetanol: { family: 'deuterioetanol', name: '{cfg}1-deutério-etanol', chain: ['CH3', c('D', 'H'), 'OH'], cfg: ['S'], loc: [1] },
  cloropropenol: { family: 'butenol', name: '{cfg}but-3-en-2-ol', chain: ['CH3', c('OH', 'H'), 'vinil'], cfg: ['R'], loc: [2] },
  propanodiol: { family: 'propanodiol', name: '{cfg}propano-1,2-diol', chain: ['CH2OH', c('OH', 'H'), 'CH3'], cfg: ['S'], loc: [2] },
  // aquirais
  propan2ol: { family: 'propan2ol', name: 'propan-2-ol', chain: ['CH3', c('OH', 'H'), 'CH3'], loc: [2] },
  diclorometano: { family: 'dcm', name: 'diclorometano', chain: ['Cl', c('H', 'H'), 'Cl'], loc: [1] },
  butanol1: { family: 'butanol1', name: 'butan-1-ol', chain: ['Pr', c('OH', 'H'), 'H'], loc: [1] },
  bromobutano1: { family: 'bromobutano1', name: '1-bromobutano', chain: ['Pr', c('Br', 'H'), 'H'], loc: [1] },
  // dois centros
  dibromobutano: { family: 'dibromobutano', name: '{cfg}2,3-dibromobutano{meso}', chain: ['CH3', c('Br', 'H'), c('Br', 'H'), 'CH3'], cfg: ['R', 'R'], loc: [2, 3] },
  diclorobutano: { family: 'diclorobutano', name: '{cfg}2,3-diclorobutano{meso}', chain: ['CH3', c('Cl', 'H'), c('Cl', 'H'), 'CH3'], cfg: ['R', 'S'], loc: [2, 3] },
  butanodiol: { family: 'butanodiol', name: '{cfg}butano-2,3-diol{meso}', chain: ['CH3', c('OH', 'H'), c('OH', 'H'), 'CH3'], cfg: ['R', 'S'], loc: [2, 3] },
  tartarico: { family: 'tartarico', name: 'ácido {cfg}2,3-di-hidroxibutanodioico (tartárico){meso}', chain: ['COOH', c('OH', 'H'), c('OH', 'H'), 'COOH'], cfg: ['R', 'R'], loc: [2, 3] },
  bromocloro: { family: 'bromocloro', name: '{cfg}2-bromo-3-clorobutano', chain: ['CH3', c('Br', 'H'), c('Cl', 'H'), 'CH3'], cfg: ['R', 'S'], loc: [2, 3] },
  metilpentanol: { family: 'metilpentanol', name: '{cfg}3-metilpentan-2-ol', chain: ['CH3', c('OH', 'H'), c('CH3', 'H'), 'Et'], cfg: ['R', 'S'], loc: [2, 3] },
  eritrose: { family: 'tetrose', name: '{cfg}2,3,4-tri-hidroxibutanal', chain: ['CHO', c('OH', 'H'), c('OH', 'H'), 'CH2OH'], cfg: ['R', 'R'], loc: [2, 3] },
  // três e quatro centros
  ribose: { family: 'pentose', name: '{cfg}2,3,4,5-tetra-hidroxipentanal', chain: ['CHO', c('OH', 'H'), c('OH', 'H'), c('OH', 'H'), 'CH2OH'], cfg: ['R', 'R', 'R'], loc: [2, 3, 4] },
  clorometilhexanol: { family: 'clmh', name: '{cfg}4-cloro-3-metil-hexan-2-ol', chain: ['CH3', c('OH', 'H'), c('CH3', 'H'), c('Cl', 'H'), 'Et'], cfg: ['S', 'R', 'S'], loc: [2, 3, 4] },
  glicose: { family: 'hexose', name: '{cfg}2,3,4,5,6-penta-hidroxi-hexanal', chain: ['CHO', c('OH', 'H'), c('OH', 'H'), c('OH', 'H'), c('OH', 'H'), 'CH2OH'], cfg: ['R', 'S', 'R', 'R'], loc: [2, 3, 4, 5] },
};
export const LABNAMES = {
  bcf: 'bromoclorofluorometano', butanol2: 'butan-2-ol', bromobutano2: '2-bromobutano', lactico: 'ácido lático', gliceraldeido: 'gliceraldeído', alanina: 'alanina', metilhexano3: '3-metil-hexano', deuterioetanol: '1-deutério-etanol', cloropropenol: 'but-3-en-2-ol', propanodiol: 'propano-1,2-diol',
  propan2ol: 'propan-2-ol (aquiral)', butanol1: 'butan-1-ol', bromobutano1: '1-bromobutano', diclorometano: 'diclorometano (aquiral)', dibromobutano: '2,3-dibromobutano', diclorobutano: '2,3-diclorobutano', butanodiol: 'butano-2,3-diol', tartarico: 'ácido tartárico', bromocloro: '2-bromo-3-clorobutano', metilpentanol: '3-metilpentan-2-ol', eritrose: 'aldotetrose (eritrose/treose)', ribose: 'aldopentose (ribose)', clorometilhexanol: '4-cloro-3-metil-hexan-2-ol', glicose: 'aldo-hexose (glicose)',
};
