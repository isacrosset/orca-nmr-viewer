/*
 * lib.js — moléculas e íons usados na aplicação (SMILES → estrutura de Lewis).
 */
import { fromSmiles } from './struct.js';

export const MOLS = {
  H2: ['[H][H]', 'H₂', 'hidrogênio'], CH4: ['C', 'CH₄', 'metano'], NH3: ['N', 'NH₃', 'amônia'], H2O: ['O', 'H₂O', 'água'], HF: ['F', 'HF', 'fluoreto de hidrogênio'], HCl: ['Cl', 'HCl', 'cloreto de hidrogênio'],
  CO2: ['O=C=O', 'CO₂', 'dióxido de carbono'], BF3: ['FB(F)F', 'BF₃', 'trifluoreto de boro'], SO2: ['O=S=O', 'SO₂', 'dióxido de enxofre'], HCN: ['C#N', 'HCN', 'cianeto de hidrogênio'],
  CH2O: ['C=O', 'CH₂O', 'formaldeído (metanal)'], CH3OH: ['CO', 'CH₃OH', 'metanol'], CH3OCH3: ['COC', 'CH₃OCH₃', 'éter dimetílico (metoximetano)'], CH3COOH: ['CC(=O)O', 'CH₃COOH', 'ácido acético (etanoico)'],
  acetato: ['CC(=O)[O-]', 'CH₃COO⁻', 'íon acetato'], etano: ['CC', 'CH₃CH₃', 'etano'], eteno: ['C=C', 'CH₂=CH₂', 'eteno'], etino: ['C#C', 'HC≡CH', 'etino'],
  propeno: ['CC=C', 'CH₃CH=CH₂', 'propeno'], benzeno: ['c1ccccc1', 'C₆H₆', 'benzeno'], NO: ['[N]=O', 'NO', 'monóxido de nitrogênio (radical)'], NH4: ['[NH4+]', 'NH₄⁺', 'íon amônio'],
  H3O: ['[OH3+]', 'H₃O⁺', 'íon hidrônio'], OH: ['[OH-]', 'OH⁻', 'íon hidróxido'], metilamina: ['CN', 'CH₃NH₂', 'metilamina'], imina: ['C=N', 'CH₂=NH', 'metanimina'], acetona: ['CC(C)=O', 'CH₃COCH₃', 'acetona (propanona)'],
  CH3Cl: ['CCl', 'CH₃Cl', 'clorometano'], carbonato: ['[O-]C([O-])=O', 'CO₃²⁻', 'íon carbonato'], nitrometano: ['C[N+](=O)[O-]', 'CH₃NO₂', 'nitrometano'], formamida: ['NC=O', 'HCONH₂', 'formamida'],
  alilaC: ['[CH2+]C=C', 'CH₂=CH–CH₂⁺', 'cátion alila'], alilaA: ['[CH2-]C=C', 'CH₂=CH–CH₂⁻', 'ânion alila'], acetamida: ['CC(N)=O', 'CH₃CONH₂', 'acetamida'], final: ['CC=CC#N', 'CH₃CH=CHC≡N', 'but-2-enonitrila'],
  propino: ['CC#C', 'CH₃C≡CH', 'propino'], butadieno: ['C=CC=C', 'CH₂=CH–CH=CH₂', 'buta-1,3-dieno'], etanol: ['CCO', 'CH₃CH₂OH', 'etanol'], acetaldeido: ['CC=O', 'CH₃CHO', 'etanal'], acetonitrila: ['CC#N', 'CH₃CN', 'acetonitrila'],
  N2: ['N#N', 'N₂', 'nitrogênio'], O2: ['O=O', 'O₂ (representação de Lewis)', 'oxigênio'], CO: ['[C-]#[O+]', 'CO', 'monóxido de carbono'], CH3: ['[CH3+]', 'CH₃⁺', 'cátion metila'], CH3m: ['[CH3-]', 'CH₃⁻', 'ânion metila'],
};
const cache = {};
export function L(key) {
  if (cache[key]) return cache[key];
  const [s, f, n] = MOLS[key];
  const LS = fromSmiles(s, n);
  LS.key = key; LS.formula = f; LS.smi = s;
  cache[key] = LS;
  return LS;
}
export const LAB = ['H2', 'CH4', 'NH3', 'H2O', 'CO2', 'BF3', 'etano', 'eteno', 'etino', 'CH3OH', 'CH2O', 'HCN', 'acetato', 'benzeno', 'SO2', 'propeno', 'CH3COOH', 'CH3OCH3', 'metilamina', 'imina', 'acetona', 'final', 'NH4', 'H3O'];
