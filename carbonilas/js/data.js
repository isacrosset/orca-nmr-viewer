/*
 * data.js — compostos (SMILES), classes funcionais, estados de oxidação,
 * reagentes e regras de transformação (reduções, oxidações, ozonólise).
 * As regras descrevem o comportamento típico em condições usuais; as
 * observações explicitam quando o resultado depende das condições.
 */
import { parseSmiles, fromGraph, sameMolecule } from './chem.js';

const C = (smi, name, cls, extra = {}) => Object.assign({ smi, name, cls }, extra);
export const COMP = {
  metanal: C('C=O', 'metanal (formaldeído)', 'aldeido'),
  etanal: C('CC=O', 'etanal (acetaldeído)', 'aldeido'),
  propanal: C('CCC=O', 'propanal', 'aldeido'),
  butanal: C('CCCC=O', 'butanal', 'aldeido'),
  pentanal: C('CCCCC=O', 'pentanal', 'aldeido'),
  benzaldeido: C('O=CC1=CC=CC=C1', 'benzaldeído', 'aldeido'),
  propanona: C('CC(C)=O', 'propanona (acetona)', 'cetona'),
  butanona: C('CCC(C)=O', 'butan-2-ona', 'cetona'),
  cicloexanona: C('O=C1CCCCC1', 'cicloexanona', 'cetona'),
  acetofenona: C('CC(=O)C1=CC=CC=C1', 'acetofenona', 'cetona'),
  pinacolona: C('CC(=O)C(C)(C)C', '3,3-dimetilbutan-2-ona', 'cetona'),
  metanol: C('CO', 'metanol', 'alcool1'),
  etanol: C('CCO', 'etanol', 'alcool1'),
  propan1ol: C('CCCO', 'propan-1-ol', 'alcool1'),
  butan1ol: C('CCCCO', 'butan-1-ol', 'alcool1'),
  pentan1ol: C('CCCCCO', 'pentan-1-ol', 'alcool1'),
  benzilico: C('OCC1=CC=CC=C1', 'álcool benzílico', 'alcool1'),
  propan2ol: C('CC(C)O', 'propan-2-ol', 'alcool2'),
  butan2ol: C('CCC(C)O', 'butan-2-ol', 'alcool2'),
  cicloexanol: C('OC1CCCCC1', 'cicloexanol', 'alcool2'),
  feniletanol: C('CC(O)C1=CC=CC=C1', '1-feniletanol', 'alcool2'),
  dimetilbutanol: C('CC(O)C(C)(C)C', '3,3-dimetilbutan-2-ol', 'alcool2'),
  tercbutanol: C('CC(C)(C)O', '2-metilpropan-2-ol (terc-butanol)', 'alcool3'),
  metilcicloexanol: C('CC1(O)CCCCC1', '1-metilcicloexanol', 'alcool3'),
  formico: C('OC=O', 'ácido fórmico (metanoico)', 'acido'),
  acetico: C('CC(=O)O', 'ácido etanoico (acético)', 'acido'),
  propanoico: C('CCC(=O)O', 'ácido propanoico', 'acido'),
  butanoico: C('CCCC(=O)O', 'ácido butanoico', 'acido'),
  pentanoico: C('CCCCC(=O)O', 'ácido pentanoico', 'acido'),
  benzoico: C('OC(=O)C1=CC=CC=C1', 'ácido benzoico', 'acido'),
  adipico: C('OC(=O)CCCCC(=O)O', 'ácido hexanodioico (adípico)', 'acido'),
  acetato: C('CCOC(C)=O', 'etanoato de etila (acetato de etila)', 'ester'),
  butanoatoMe: C('CCCC(=O)OC', 'butanoato de metila', 'ester'),
  benzoatoMe: C('COC(=O)C1=CC=CC=C1', 'benzoato de metila', 'ester'),
  butanonitrila: C('CCCC#N', 'butanonitrila', 'nitrila'),
  butanamina: C('CCCCN', 'butan-1-amina', 'amina'),
  hexanodial: C('O=CCCCCC=O', 'hexanodial', 'aldeido'),
  oxoheptanal: C('CC(=O)CCCCC=O', '6-oxo-heptanal', 'aldeido'),
  oxoheptanoico: C('CC(=O)CCCCC(=O)O', 'ácido 6-oxo-heptanoico', 'acido'),
  metilbuteno: C('CC=C(C)C', '2-metilbut-2-eno', 'alceno'),
  metilpropeno: C('C=C(C)C', '2-metilpropeno', 'alceno'),
  but2eno: C('CC=CC', 'but-2-eno', 'alceno'),
  but1eno: C('C=CCC', 'but-1-eno', 'alceno'),
  cicloexeno: C('C1=CCCCC1', 'cicloexeno', 'alceno'),
  metilcicloexeno: C('CC1=CCCCC1', '1-metilcicloexeno', 'alceno'),
  estireno: C('C=CC1=CC=CC=C1', 'estireno (vinilbenzeno)', 'alceno'),
  tetrametiletileno: C('CC(C)=C(C)C', '2,3-dimetilbut-2-eno', 'alceno'),
  pent2eno: C('CCC=CC', 'pent-2-eno', 'alceno'),
  butano: C('CCCC', 'butano', 'alcano'),
  propano: C('CCC', 'propano', 'alcano'),
  co2: C('O=C=O', 'CO₂', 'outro'),
};
export const CLS_NAME = { aldeido: 'aldeído', cetona: 'cetona', alcool1: 'álcool primário', alcool2: 'álcool secundário', alcool3: 'álcool terciário', acido: 'ácido carboxílico', ester: 'éster', nitrila: 'nitrila', amina: 'amina', alceno: 'alceno', alcano: 'alcano', outro: '—' };
const MOL = {};
export const molOf = (k) => (MOL[k] = MOL[k] || parseSmiles(COMP[k].smi));
/** encontra a chave de um grafo na biblioteca */
export function lookup(m) { return Object.keys(COMP).find((k) => { try { return sameMolecule(molOf(k), m); } catch (e) { return false; } }) || null; }

/* ---------- estado de oxidação formal de cada carbono ---------- */
const EN = { H: 2.2, C: 2.55, N: 3.04, O: 3.44, F: 3.98, Cl: 3.16, Br: 2.96, I: 2.66, S: 2.58, B: 2.04 };
export function oxState(m, i) {
  let ox = 0;
  m.nb[i].forEach(({ j, o }) => { const e = m.atoms[j].el; if (e === 'C') return; ox += (EN[e] > EN.C ? 1 : -1) * o; });
  ox -= m.atoms[i].h; // H menos eletronegativo
  return ox;
}
/** carbono "funcional": carbonílico, carbinólico, etc. */
export function funcCarbon(m) {
  const score = (i) => m.atoms[i].el !== 'C' ? -9 : m.nb[i].filter(({ j }) => m.atoms[j].el !== 'C').reduce((s, x) => s + x.o, 0);
  let best = 0; m.atoms.forEach((_, i) => { if (score(i) > score(best)) best = i; });
  return best;
}

/* ===================================================================
 * Reagentes
 * =================================================================== */
export const RED = {
  NaBH4: { name: 'NaBH₄', full: 'borohidreto de sódio', kind: 'red', strength: 'brando', medium: 'MeOH ou EtOH (próticos) — compatível', note: 'transfere hidreto equivalente a partir de B–H; reduz aldeídos e cetonas' },
  LiAlH4: { name: 'LiAlH₄', full: 'hidreto de lítio e alumínio', kind: 'red', strength: 'forte', medium: 'éter/THF anidro; depois workup aquoso (H₃O⁺)', note: 'transfere hidreto a partir de Al–H; reage vigorosamente com água/solventes próticos' },
  DIBAL: { name: 'DIBAL-H', full: 'hidreto de diisobutilalumínio', kind: 'red', strength: 'seletivo (redução parcial controlada)', medium: 'tolueno/CH₂Cl₂ anidro, baixa temperatura (ex.: −78 °C), 1 equiv.; depois workup', note: 'ácido de Lewis (Al) coordena o O antes de transferir H; útil para éster → aldeído e nitrila → aldeído' },
};
export const OX = {
  PCC: { name: 'PCC', full: 'clorocromato de piridínio', kind: 'ox', strength: 'Cr(VI) relativamente brando', medium: 'CH₂Cl₂ anidro', note: 'álcool 1° → aldeído; álcool 2° → cetona' },
  Jones: { name: 'Jones (CrO₃/H₂SO₄, acetona/H₂O)', full: 'reagente de Jones', kind: 'ox', strength: 'Cr(VI) forte, meio ácido aquoso', medium: 'acetona/H₂O, H₂SO₄', note: 'álcool 1° → ácido (via hidrato do aldeído); álcool 2° → cetona' },
  KMnO4: { name: 'KMnO₄', full: 'permanganato de potássio', kind: 'ox', strength: 'oxidante forte', medium: 'depende do pH, temperatura e concentração', note: 'resultado muito dependente das condições e do substrato' },
  O3r: { name: '1. O₃; 2. Zn/H₂O (ou Me₂S)', full: 'ozonólise com workup redutivo', kind: 'ozo', strength: 'clivagem da C=C', medium: 'O₃ a baixa temperatura (ex.: −78 °C, CH₂Cl₂/MeOH); depois redutor', note: 'cada carbono da antiga C=C vira C=O; aldeídos são preservados' },
  O3o: { name: '1. O₃; 2. H₂O₂', full: 'ozonólise com workup oxidativo', kind: 'ozo', strength: 'clivagem + oxidação', medium: 'O₃; depois H₂O₂', note: 'fragmentos com C–H (aldeídos) são oxidados a ácidos; cetonas permanecem' },
};
export const REAG = Object.assign({}, RED, OX);

/* ===================================================================
 * Transformações (comportamento típico)
 * =================================================================== */
const RED_ALC = { metanal: 'metanol', etanal: 'etanol', propanal: 'propan1ol', butanal: 'butan1ol', pentanal: 'pentan1ol', benzaldeido: 'benzilico', propanona: 'propan2ol', butanona: 'butan2ol', cicloexanona: 'cicloexanol', acetofenona: 'feniletanol', pinacolona: 'dimetilbutanol' };
const ESTER = { acetato: ['etanal', 'etanol', 'etanol'], butanoatoMe: ['butanal', 'metanol', 'butan1ol'], benzoatoMe: ['benzaldeido', 'metanol', 'benzilico'] };
const ACID_ALC = { acetico: 'etanol', propanoico: 'propan1ol', butanoico: 'butan1ol', pentanoico: 'pentan1ol', benzoico: 'benzilico', formico: 'metanol' };
const OX1 = { etanol: ['etanal', 'acetico'], propan1ol: ['propanal', 'propanoico'], butan1ol: ['butanal', 'butanoico'], pentan1ol: ['pentanal', 'pentanoico'], benzilico: ['benzaldeido', 'benzoico'], metanol: ['metanal', 'formico'] };
const OX2 = { propan2ol: 'propanona', butan2ol: 'butanona', cicloexanol: 'cicloexanona', feniletanol: 'acetofenona', dimetilbutanol: 'pinacolona' };
const ALD_ACID = { etanal: 'acetico', propanal: 'propanoico', butanal: 'butanoico', pentanal: 'pentanoico', benzaldeido: 'benzoico', metanal: 'formico', hexanodial: 'adipico' };

/** resultado de substrato + reagente: { prods: [chaves], ok, kind: 'red'|'ox'|'none', why, warn } */
export function react(sub, rg) {
  const c = COMP[sub].cls;
  const R = (prods, why, o = {}) => Object.assign({ prods, ok: !!prods.length, why }, o);
  const none = (why, o = {}) => Object.assign({ prods: [], ok: false, why }, o);
  if (rg === 'NaBH4' || rg === 'LiAlH4' || rg === 'DIBAL') {
    if (c === 'aldeido' && RED_ALC[sub]) return R([RED_ALC[sub]], `Aldeído → álcool primário: um hidreto equivalente é transferido ao carbono carbonílico e o alcóxido é protonado.${rg === 'DIBAL' ? ' (O DIBAL-H também reduz aldeídos, mas seu valor está na redução parcial de ésteres/nitrilas.)' : ''}`, { kind: 'red' });
    if (c === 'cetona' && RED_ALC[sub]) return R([RED_ALC[sub]], `Cetona → álcool secundário.${rg === 'DIBAL' ? ' (DIBAL-H também reduz cetonas; não é seu uso mais característico.)' : ''}`, { kind: 'red' });
    if (c === 'ester') {
      const [ald, rOH, alc] = ESTER[sub];
      if (rg === 'NaBH4') return none('NaBH₄ é brando: em condições usuais não reduz ésteres de forma significativa (o C=O do éster é menos eletrofílico, estabilizado pela doação do O–R).', { kind: 'none' });
      if (rg === 'LiAlH4') return R(alc === rOH ? [alc] : [alc, rOH], 'LiAlH₄ reduz o éster até o álcool primário (duas transferências de hidreto: via aldeído, que é mais reativo que o éster), liberando também o álcool da porção alcoxila.', { kind: 'red' });
      return R([ald, rOH], 'DIBAL-H (1 equiv., −78 °C): coordena o O, transfere um hidreto e forma um intermediário tetraédrico estável a baixa temperatura; o workup libera o aldeído. Com excesso ou aquecimento, a redução pode prosseguir até o álcool.', { kind: 'red', warn: 'Seletividade dependente de temperatura, equivalentes, solvente e workup.' });
    }
    if (c === 'acido') {
      if (rg === 'NaBH4') return none('NaBH₄ não reduz ácidos carboxílicos em condições usuais (o ácido é desprotonado; o carboxilato é muito pouco eletrofílico).', { kind: 'none' });
      if (rg === 'LiAlH4') return R([ACID_ALC[sub]], 'LiAlH₄ reduz ácidos carboxílicos a álcoois primários (após desprotonação inicial e workup aquoso).', { kind: 'red' });
      return none('DIBAL-H não é o reagente típico para ácidos carboxílicos: o comportamento depende muito das condições.', { kind: 'none', warn: 'Dependente das condições.' });
    }
    if (c === 'nitrila') {
      if (rg === 'NaBH4') return none('NaBH₄ não reduz nitrilas em condições usuais.', { kind: 'none' });
      if (rg === 'LiAlH4') return R(['butanamina'], 'LiAlH₄ reduz a nitrila até a amina primária (duas adições de hidreto).', { kind: 'red' });
      return R(['butanal'], 'DIBAL-H: uma adição de hidreto forma uma imina de alumínio; a hidrólise no workup fornece o aldeído.', { kind: 'red', warn: 'Condições controladas.' });
    }
    if (c.startsWith('alcool') || c === 'alcano' || c === 'amina') return none('Não há grupo redutível por hidreto nesse substrato (sem C=O/C≡N).', { kind: 'none' });
    if (c === 'alceno') return none('Alcenos isolados não são reduzidos por esses hidretos (não há carbono eletrofílico polarizado).', { kind: 'none' });
  }
  if (rg === 'PCC' || rg === 'Jones' || rg === 'KMnO4') {
    if (c === 'alcool1') { const [ald, ac] = OX1[sub]; if (rg === 'PCC') return R([ald], 'PCC (Cr(VI), CH₂Cl₂ anidro): álcool primário → aldeído. Sem água, o aldeído não forma hidrato e a superoxidação é limitada.', { kind: 'ox' }); return R([ac], rg === 'Jones' ? 'Jones (Cr(VI), meio ácido aquoso): o aldeído formado hidrata-se (gem-diol) e o hidrato é oxidado de novo → ácido carboxílico.' : 'KMnO₄ (oxidante forte, condições adequadas): álcool primário → ácido carboxílico.', { kind: 'ox', warn: rg === 'KMnO4' ? 'O resultado depende de pH, temperatura e concentração.' : '' }); }
    if (c === 'alcool2') return R([OX2[sub]], 'Álcool secundário → cetona (o carbono carbinólico tem um único H). Não há oxidação simples posterior sem quebra C–C.', { kind: 'ox' });
    if (c === 'alcool3') return none('Álcool terciário: não há H no carbono que porta o OH; não ocorre a oxidação usual a C=O sem ruptura de ligação C–C.', { kind: 'none', warn: rg === 'KMnO4' ? 'Condições muito drásticas podem causar degradação/quebra C–C.' : '' });
    if (c === 'aldeido') { if (rg === 'PCC') return none('PCC é usado para oxidar álcoois; em condições anidras usuais o aldeído é o produto final — não é o reagente típico para aldeído → ácido.', { kind: 'none', warn: 'Dependente das condições.' }); return R([ALD_ACID[sub]], 'Aldeídos oxidam-se facilmente: o C–H do aldeído é substituído por C–OH → ácido carboxílico.', { kind: 'ox' }); }
    if (c === 'cetona') return none('Cetonas resistem à oxidação simples: não há H no carbono carbonílico (oxidar exigiria quebrar C–C).', { kind: 'none' });
    if (c === 'acido') return none('O ácido carboxílico já é o nível de oxidação mais alto antes do CO₂ para esse carbono.', { kind: 'none' });
    if (c === 'alceno') return none(rg === 'KMnO4' ? 'KMnO₄ reage com alcenos, mas o produto depende das condições (frio/diluído: diol; quente/concentrado: clivagem). Não é uma oxidação de álcool.' : 'PCC/Jones são usados para álcoois, não para clivar alcenos.', { kind: 'none', warn: rg === 'KMnO4' ? 'Dependente das condições.' : '' });
    return none('Não há grupo oxidável típico por esse reagente.', { kind: 'none' });
  }
  if (rg === 'O3r' || rg === 'O3o') {
    if (c !== 'alceno') return none('A ozonólise cliva ligações C=C; o substrato não tem alceno.', { kind: 'none' });
    const prods = ozonolysis(molOf(sub), null, rg === 'O3o');
    return R(prods.map((p) => p.key || p.m), rg === 'O3r' ? 'Cada carbono da antiga C=C torna-se um C=O. Workup redutivo (Zn/H₂O ou Me₂S): aldeídos preservados.' : 'Workup oxidativo (H₂O₂): os fragmentos aldeídicos são oxidados a ácidos carboxílicos; cetonas permanecem.', { kind: 'ozo', frags: prods });
  }
  return none('Combinação não prevista.');
}

/* ===================================================================
 * Ozonólise sobre o grafo
 * =================================================================== */
export function ccDoubles(m) { return m.bonds.map((b, k) => ({ b, k })).filter(({ b }) => b.o === 2 && m.atoms[b.a].el === 'C' && m.atoms[b.b].el === 'C' && !(m.atoms[b.a].aromatic && m.atoms[b.b].aromatic)); }
/** cliva a C=C (índice k na lista de ligações; null = todas) e devolve fragmentos [{m, key}] */
export function ozonolysis(m, k = null, oxid = false) {
  const cut = k === null ? ccDoubles(m).map((x) => x.k) : [k];
  const bonds = m.bonds.filter((_, i) => !cut.includes(i));
  const n = m.atoms.length;
  // componentes conexos
  const adj = Array.from({ length: n }, () => []); bonds.forEach((b) => { adj[b.a].push(b.b); adj[b.b].push(b.a); });
  const comp = new Array(n).fill(-1); let nc = 0;
  for (let s = 0; s < n; s++) { if (comp[s] >= 0) continue; const st = [s]; comp[s] = nc; while (st.length) { const x = st.pop(); adj[x].forEach((y) => { if (comp[y] < 0) { comp[y] = nc; st.push(y); } }); } nc++; }
  const cutAtoms = cut.flatMap((i) => [m.bonds[i].a, m.bonds[i].b]);
  const out = [];
  for (let c = 0; c < nc; c++) {
    const idx = [...Array(n).keys()].filter((i) => comp[i] === c), map = {}; idx.forEach((i, q) => { map[i] = q; });
    const atoms = idx.map((i) => ({ el: m.atoms[i].el, charge: m.atoms[i].charge }));
    const bs = bonds.filter((b) => comp[b.a] === c).map((b) => ({ a: map[b.a], b: map[b.b], o: b.o }));
    cutAtoms.filter((i) => comp[i] === c).forEach((i) => {
      // cada átomo cortado recebe =O (uma vez por ligação cortada)
      const times = cutAtoms.filter((x) => x === i).length;
      for (let t = 0; t < times; t++) { atoms.push({ el: 'O' }); bs.push({ a: map[i], b: atoms.length - 1, o: 2 }); }
      if (oxid) { const hasH = (4 - bs.filter((b) => b.a === map[i] || b.b === map[i]).reduce((s, b) => s + b.o, 0)) > 0; if (hasH) { atoms.push({ el: 'O' }); bs.push({ a: map[i], b: atoms.length - 1, o: 1 }); } }
    });
    const fm = fromGraph(atoms, bs);
    out.push({ m: fm, key: lookup(fm) });
  }
  return out;
}

/* ===================================================================
 * Rede de interconversões
 * =================================================================== */
export const NET = {
  nodes: { alceno: 'alceno', alcool1: 'álcool 1°', alcool2: 'álcool 2°', alcool3: 'álcool 3°', aldeido: 'aldeído', cetona: 'cetona', acido: 'ácido carboxílico', ester: 'éster' },
  edges: [
    ['aldeido', 'alcool1', ['NaBH₄', 'LiAlH₄ (depois H₃O⁺)'], 'redução'],
    ['cetona', 'alcool2', ['NaBH₄', 'LiAlH₄ (depois H₃O⁺)'], 'redução'],
    ['alcool1', 'aldeido', ['PCC'], 'oxidação'],
    ['alcool1', 'acido', ['Jones', 'KMnO₄'], 'oxidação'],
    ['alcool2', 'cetona', ['PCC', 'Jones', 'KMnO₄'], 'oxidação'],
    ['aldeido', 'acido', ['Jones', 'KMnO₄'], 'oxidação'],
    ['ester', 'aldeido', ['DIBAL-H (1 equiv., −78 °C)'], 'redução parcial'],
    ['ester', 'alcool1', ['LiAlH₄'], 'redução'],
    ['acido', 'alcool1', ['LiAlH₄'], 'redução'],
    ['alceno', 'aldeido', ['O₃; Zn/H₂O ou Me₂S'], 'clivagem (ozonólise)'],
    ['alceno', 'cetona', ['O₃; Zn/H₂O ou Me₂S'], 'clivagem (ozonólise)'],
    ['alceno', 'acido', ['O₃; H₂O₂'], 'clivagem oxidativa'],
  ],
};
