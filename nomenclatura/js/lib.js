/*
 * lib.js — biblioteca de moléculas (SMILES) por categoria. Nomes são
 * gerados pelo motor (namer.js) e conferidos em teste; "usual" registra
 * nomes retidos/comuns, identificados como tais.
 */
import { parseSmiles, findFG, formula } from './chem.js';
import { nameMolecule } from './namer.js';
import { layout, condensed } from './depict.js';

export const CAT = {
  alcanos: ['CCCC', 'CC(C)CC', 'CCCCCC', 'CC(C)CCC', 'CCC(C)CC', 'CC(C)C(C)CC', 'CC(C)(C)CC', 'CCC(CC)CC', 'CCCC(CC)C(C)C', 'CC(C)CC(C)(C)C', 'CCC(C)(C)C(C)C', 'CCCC(C(C)C)CCC'],
  alcenos: ['C=CCC', 'CC=CC', 'C=CC(C)CC', 'CC=C(C)C', 'CC=CC(C)C', 'C=CC=CCC', 'C=CCC=C'],
  alcinos: ['C#CCC', 'CC#CCC', 'C#CC(C)CCC', 'CCC#CCC', 'CC#CC(C)C'],
  eninos: ['C=CCC#C', 'C=CCCC#C', 'C#CC=CC'],
  ciclicos: ['C1CC1', 'C1CCC1', 'C1CCCC1', 'C1CCCCC1', 'CC1CCCCC1', 'CCC1CCCC(C)C1', 'CC1CCCC1C', 'CCC1CCCC1', 'C1=CCCCC1', 'CCCC1CCCCC1'],
  aromaticos: ['c1ccccc1', 'Cc1ccccc1', 'CCc1ccccc1', 'Clc1ccccc1', '[O-][N+](=O)c1ccccc1', 'Cc1ccccc1C', 'Cc1cccc(C)c1', 'Cc1ccc(C)cc1', 'Cc1ccc(Cl)cc1', 'Brc1cccc([N+](=O)[O-])c1', 'CC(C)c1ccccc1'],
  haletos: ['CCCCCl', 'CC(Br)C', 'CC(C)CBr', 'CC(Cl)CC(C)C', 'ClCCCl', 'CI', 'ClC(Cl)Cl', 'CC(C)(C)Br', 'CCF'],
  alcoois: ['CO', 'CCO', 'CCCO', 'CC(O)C', 'CCCCO', 'CC(O)C(C)C', 'CC(C)(C)O', 'CCC(C)C(C)O', 'OCCO', 'OCC(O)CO', 'C=CC(O)C', 'OC1CCCCC1'],
  fenois: ['Oc1ccccc1', 'Cc1ccccc1O', 'Oc1ccc(Cl)cc1', 'Cc1ccc(O)cc1', 'Oc1cccc([N+](=O)[O-])c1'],
  eteres: ['COC', 'COCC', 'CCOCC', 'COC(C)C', 'COCCC', 'COc1ccccc1'],
  aldeidos: ['C=O', 'CC=O', 'CCC=O', 'CCCC=O', 'CC(C)C=O', 'CC(C)CC=O', 'CC=CC=O', 'O=Cc1ccccc1'],
  cetonas: ['CC(=O)C', 'CCC(=O)C', 'CCCC(=O)C', 'CCC(=O)CC', 'CC(=O)CC(C)C', 'CC(=O)CC(C)=O', 'O=C1CCCCC1', 'CC(=O)c1ccccc1'],
  acidos: ['OC=O', 'CC(=O)O', 'CCC(=O)O', 'CCCC(=O)O', 'CC(C)C(=O)O', 'CC(C)CC(=O)O', 'CC=CC(=O)O', 'OC(=O)C(=O)O', 'OC(=O)c1ccccc1'],
  esteres: ['O=COC', 'CC(=O)OC', 'CC(=O)OCC', 'CCC(=O)OCC', 'CCCC(=O)OC', 'CC(=O)OC(C)C', 'COC(=O)c1ccccc1', 'CCCC(=O)OCC'],
  aminas: ['CN', 'CCN', 'CCCN', 'CC(N)C', 'CCC(C)N', 'CNC', 'CCNC', 'CCN(C)C', 'Nc1ccccc1'],
  amidas: ['NC=O', 'CC(N)=O', 'CCC(N)=O', 'CC(=O)NC', 'CCC(=O)NCC', 'O=CN(C)C', 'NC(=O)c1ccccc1'],
  nitrilas: ['CC#N', 'CCC#N', 'CCCC#N', 'CC(C)CC#N', 'N#Cc1ccccc1'],
  nitro: ['C[N+](=O)[O-]', 'CCC[N+](=O)[O-]', 'CC(C)[N+](=O)[O-]', '[O-][N+](=O)c1ccccc1'],
  multi: ['CC(O)C(=O)O', 'CC(=O)CC(=O)O', 'CC(N)C(=O)O', 'NCC(=O)O', 'NCCO', 'CC(=O)CCO', 'CC(=O)CCC(=O)O', 'CC(O)CC=O', 'OCC(O)C=O', 'NCCCC(=O)O', 'COCCO', 'OC(=O)CC(O)C(=O)O', 'CC(=O)CC(C)(C)O', 'CC(O)CC(=O)O', 'NCCC#N', 'NC(CO)C(=O)O', 'O=Cc1ccc(O)cc1', 'OC(=O)c1ccc(O)cc1', 'ClCC(=O)O', 'OCC(=O)O'],
};
/* nomes usuais/retidos (complemento; nunca substituem o sistemático nos exercícios) */
export const USUAL = {
  'Cc1ccccc1': 'tolueno (nome usual)', 'Cc1ccccc1C': 'o-xileno (usual)', 'Cc1cccc(C)c1': 'm-xileno (usual)', 'Cc1ccc(C)cc1': 'p-xileno (usual)', 'CC(C)c1ccccc1': 'cumeno (usual)',
  'ClC(Cl)Cl': 'clorofórmio (usual)', 'CCO': 'álcool etílico (usual)', 'CO': 'álcool metílico (usual)', 'OCCO': 'etilenoglicol (usual)', 'OCC(O)CO': 'glicerol (retido)',
  'CCOCC': 'éter dietílico (usual)', 'COc1ccccc1': 'anisol (usual)', 'C=O': 'formaldeído (retido)', 'CC=O': 'acetaldeído (retido)', 'CC(=O)C': 'acetona (retido)', 'CC(=O)c1ccccc1': 'acetofenona (usual)',
  'OC=O': 'ácido fórmico (retido)', 'CC(=O)O': 'ácido acético (retido)', 'OC(=O)C(=O)O': 'ácido oxálico (retido)', 'CC(=O)OCC': 'acetato de etila (usual)', 'CC(=O)OC': 'acetato de metila (usual)',
  'O=CN(C)C': 'dimetilformamida, DMF (usual)', 'CC(N)=O': 'acetamida (retido)', 'CC#N': 'acetonitrila (usual)', 'Nc1ccccc1': 'anilina (retido)', 'CNC': 'dimetilamina (usual)',
  'CC(O)C(=O)O': 'ácido lático (usual)', 'CC(N)C(=O)O': 'alanina (aminoácido)', 'NCC(=O)O': 'glicina (aminoácido)', 'NC(CO)C(=O)O': 'serina (aminoácido)', 'NCCO': 'etanolamina (usual)',
  'OC(=O)CC(O)C(=O)O': 'ácido málico (usual)', 'NCCCC(=O)O': 'GABA (neurotransmissor)', 'CC(=O)CC(=O)O': 'ácido acetoacético (usual)', 'CC(=O)CCC(=O)O': 'ácido levulínico (usual)', 'OCC(O)C=O': 'gliceraldeído (usual)', 'O=Cc1ccccc1': 'benzaldeído (retido)', 'OC(=O)c1ccccc1': 'ácido benzoico (retido)', 'Oc1ccccc1': 'fenol (retido)',
};
/* moléculas reais (reconhecimento de funções; nomes usuais) */
export const REAL = [
  { s: 'COc1cc(C=O)ccc1O', n: 'vanilina', d: 'aroma de baunilha' },
  { s: 'CC(=O)Nc1ccc(O)cc1', n: 'paracetamol', d: 'analgésico' },
  { s: 'CC(=O)Oc1ccccc1C(=O)O', n: 'ácido acetilsalicílico (aspirina)', d: 'anti-inflamatório' },
  { s: 'CC(C)Cc1ccc(cc1)C(C)C(=O)O', n: 'ibuprofeno', d: 'anti-inflamatório' },
  { s: 'CCOC(=O)c1ccc(N)cc1', n: 'benzocaína', d: 'anestésico local' },
  { s: 'CC(=O)OCCC(C)C', n: 'acetato de isoamila', d: 'aroma de banana' },
  { s: 'CCCC(=O)OCC', n: 'butanoato de etila', d: 'aroma de abacaxi' },
  { s: 'CC(C)C1CCC(C)CC1O', n: 'mentol', d: 'aroma de hortelã' },
  { s: 'NCCc1ccc(O)c(O)c1', n: 'dopamina', d: 'neurotransmissor' },
  { s: 'OC(=O)CC(O)(CC(=O)O)C(=O)O', n: 'ácido cítrico', d: 'metabólito (ciclo de Krebs)' },
  { s: 'CC(O)C(=O)O', n: 'ácido lático', d: 'metabólito' },
  { s: 'NC(Cc1ccccc1)C(=O)O', n: 'fenilalanina', d: 'aminoácido' },
];

/* ---------- fábrica com cache ---------- */
const cache = new Map();
export function M(smi) {
  if (cache.has(smi)) return cache.get(smi);
  const m = parseSmiles(smi);
  const r = nameMolecule(m);
  const path = r.ok ? r.parent.P : null;
  const P2 = layout(m, path);
  const obj = { smi, m, r, name: r.ok ? r.name : null, P2, fgs: findFG(m), formula: formula(m), cond: condensed(m), usual: USUAL[smi] || null };
  cache.set(smi, obj);
  return obj;
}
export const ALL = [...new Set(Object.values(CAT).flat())];
export const catOf = (smi) => Object.keys(CAT).find((k) => CAT[k].includes(smi));
