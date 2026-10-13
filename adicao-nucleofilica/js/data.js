/*
 * data.js — compostos (2D), nucleófilos, produtos (gerados com RDKit por
 * modelos de reação), equilíbrios qualitativos e cenários de síntese.
 */
const C = (smi, name, cls) => ({ smi, name, cls });
export const COMP = {
  formaldeido: C('C=O', 'formaldeído (metanal)', 'aldeido'), acetaldeido: C('CC=O', 'acetaldeído (etanal)', 'aldeido'), propanal: C('CCC=O', 'propanal', 'aldeido'),
  acetona: C('CC(C)=O', 'acetona (propanona)', 'cetona'), butanona: C('CCC(C)=O', 'butanona', 'cetona'), cicloexanona: C('O=C1CCCCC1', 'cicloexanona', 'cetona'), ciclopentanona: C('O=C1CCCC1', 'ciclopentanona', 'cetona'),
  benzaldeido: C('O=Cc1ccccc1', 'benzaldeído', 'aldeido'), acetofenona: C('CC(=O)c1ccccc1', 'acetofenona', 'cetona'), cloral: C('ClC(Cl)(Cl)C=O', 'cloral', 'aldeido'), hexafluoroacetona: C('FC(F)(F)C(=O)C(F)(F)F', 'hexafluoroacetona', 'cetona'),
  pinacolona: C('CC(=O)C(C)(C)C', 'pinacolona', 'cetona'), diterc: C('CC(C)(C)C(=O)C(C)(C)C', 'di-terc-butilcetona', 'cetona'),
  hidratoForm: C('OCO', 'hidrato do formaldeído', 'gemdiol'), hidratoAcet: C('CC(O)O', 'hidrato do acetaldeído', 'gemdiol'), hidratoAcetona: C('CC(C)(O)O', 'hidrato da acetona', 'gemdiol'), hidratoCloral: C('ClC(Cl)(Cl)C(O)O', 'hidrato de cloral', 'gemdiol'),
  hemiacetal: C('CC(O)OCC', '1-etoxietanol (hemiacetal)', 'hemiacetal'), acetal: C('CC(OCC)OCC', '1,1-dietoxietano (acetal)', 'acetal'), hemicetal: C('CC(C)(O)OC', '2-metoxipropan-2-ol (hemicetal)', 'hemicetal'), cetal: C('CC(C)(OC)OC', '2,2-dimetoxipropano (cetal)', 'cetal'),
  hemiacetalMe: C('COC(C)O', '1-metoxietanol (hemiacetal)', 'hemiacetal'), acetalMe: C('COC(C)OC', '1,1-dimetoxietano (acetal)', 'acetal'), benzAcetal: C('COC(OC)c1ccccc1', 'dimetilacetal do benzaldeído', 'acetal'),
  dioxolano: C('C1CCC2(CC1)OCCO2', 'cetal cíclico (1,3-dioxolano) da cicloexanona', 'cetal'), dioxano: C('C1CCC2(CC1)OCCCO2', 'cetal cíclico (1,3-dioxano) da cicloexanona', 'cetal'), dioxolanoAcetona: C('CC1(C)OCCO1', '2,2-dimetil-1,3-dioxolano', 'cetal'),
  ditiolano: C('C1CCC2(CC1)SCCS2', 'tiocetal cíclico (1,3-ditiolano)', 'tiocetal'), ditiolanoBenz: C('c1ccc(C2SCCS2)cc1', '2-fenil-1,3-ditiolano (tioacetal)', 'tioacetal'), cicloexano: C('C1CCCCC1', 'cicloexano', 'alcano'), tolueno: C('Cc1ccccc1', 'tolueno', 'alcano'),
  etilenoglicol: C('OCCO', 'etilenoglicol', 'diol'), propanodiol: C('OCCCO', 'propano-1,3-diol', 'diol'), etanoditiol: C('SCCS', 'etano-1,2-ditiol', 'ditiol'),
  hidroxibutanal: C('O=CCCCO', '4-hidroxibutanal', 'hidroxialdeido'), thfOl: C('OC1CCCO1', 'tetra-hidrofuran-2-ol (hemiacetal cíclico, 5 membros)', 'hemiacetal'),
  hidroxipentanal: C('O=CCCCCO', '5-hidroxipentanal', 'hidroxialdeido'), thpOl: C('OC1CCCCO1', 'tetra-hidropiran-2-ol (hemiacetal cíclico, 6 membros)', 'hemiacetal'),
  hidroxipentanona: C('CC(=O)CCCO', '5-hidroxipentan-2-ona', 'hidroxicetona'), hemicetalC5: C('CC1(O)CCCO1', '2-metiltetra-hidrofuran-2-ol (hemicetal cíclico)', 'hemicetal'),
  hidroxiexanona: C('CC(=O)CCCCO', '6-hidroxi-hexan-2-ona', 'hidroxicetona'), hemicetalC6: C('CC1(O)CCCCO1', '2-metiltetra-hidropiran-2-ol (hemicetal cíclico)', 'hemicetal'),
  hidroxipropanal: C('O=CCCO', '3-hidroxipropanal', 'hidroxialdeido'),
  metilamina: C('CN', 'metilamina', 'amina1'), anilina: C('Nc1ccccc1', 'anilina', 'amina1'), pirrolidina: C('C1CCNC1', 'pirrolidina', 'amina2'), dimetilamina: C('CNC', 'dimetilamina', 'amina2'), piperidina: C('C1CCNCC1', 'piperidina', 'amina2'), morfolina: C('C1COCCN1', 'morfolina', 'amina2'),
  hidroxilamina: C('NO', 'hidroxilamina', 'outro'), hidrazina: C('NN', 'hidrazina', 'outro'),
  imina: C('CN=C1CCCCC1', 'N-metilcicloexanimina (imina)', 'imina'), iminaBenz: C('CN=Cc1ccccc1', 'N-metilbenzaldimina (imina)', 'imina'), iminaAcetona: C('CN=C(C)C', 'imina da acetona', 'imina'),
  carbinolamina: C('CNC1(O)CCCCC1', 'carbinolamina', 'carbinolamina'), enamina: C('C1=C(N2CCCC2)CCCC1', '1-pirrolidinocicloexeno (enamina)', 'enamina'), enaminaAcetona: C('C=C(C)N1CCCC1', 'enamina da acetona', 'enamina'),
  oxima: C('CC(C)=NO', 'oxima da acetona (cetoxima)', 'oxima'), oximaCiclo: C('ON=C1CCCCC1', 'oxima da cicloexanona', 'oxima'), aldoxima: C('ON=Cc1ccccc1', 'oxima do benzaldeído (aldoxima)', 'oxima'),
  hidrazona: C('CC(C)=NN', 'hidrazona da acetona', 'hidrazona'), hidrazonaCiclo: C('NN=C1CCCCC1', 'hidrazona da cicloexanona', 'hidrazona'), hidrazonaBenz: C('NN=Cc1ccccc1', 'hidrazona do benzaldeído', 'hidrazona'),
  cianoidrina: C('CC(C)(O)C#N', 'cianoidrina da acetona', 'cianoidrina'), mandelonitrila: C('N#CC(O)c1ccccc1', 'mandelonitrila (cianoidrina do benzaldeído)', 'cianoidrina'), cianoAcet: C('CC(O)C#N', 'cianoidrina do acetaldeído', 'cianoidrina'), cianoCiclo: C('N#CC1(O)CCCCC1', 'cianoidrina da cicloexanona', 'cianoidrina'),
  metilenocicloexano: C('C=C1CCCCC1', 'metilenocicloexano', 'alceno'), metilpropeno: C('C=C(C)C', '2-metilpropeno', 'alceno'), estireno: C('C=Cc1ccccc1', 'estireno', 'alceno'), fenilpropeno: C('CC=Cc1ccccc1', '1-fenilpropeno', 'alceno'),
  metilbuteno: C('CC=C(C)C', '2-metilbut-2-eno', 'alceno'), etilidenociclo: C('CC=C1CCCCC1', 'etilidenocicloexano', 'alceno'), but2eno: C('CC=CC', 'but-2-eno', 'alceno'), propeno: C('C=CC', 'propeno', 'alceno'),
  cinamato: C('CCOC(=O)C=Cc1ccccc1', 'cinamato de etila', 'ester_insat'), crotonato: C('CC=CC(=O)OCC', 'but-2-enoato de etila', 'ester_insat'), hweCiclo: C('CCOC(=O)C=C1CCCCC1', 'cicloexilidenoacetato de etila', 'ester_insat'),
  fosfonato: C('CCOC(=O)CP(=O)(OCC)OCC', 'fosfonoacetato de trietila', 'fosfonato'),
  levulinato: C('COC(=O)CCC(C)=O', '4-oxopentanoato de metila', 'cetoester'), levulinatoP: C('COC(=O)CCC1(C)OCCO1', 'cetoéster com a cetona protegida', 'cetal'), levulinatoPR: C('OCCCC1(C)OCCO1', 'álcool com a cetona protegida', 'cetal'),
  cetoesterCiclo: C('CCOC(=O)C1CCC(=O)CC1', '4-oxocicloexanocarboxilato de etila', 'cetoester'), cetoesterCicloP: C('CCOC(=O)C1CCC2(CC1)OCCO2', 'cetoéster protegido (dioxolano)', 'cetal'), cetoesterCicloPR: C('OCC1CCC2(CC1)OCCO2', 'álcool com a cetona protegida', 'cetal'), hidroximetilCiclo: C('OCC1CCC(=O)CC1', '4-(hidroximetil)cicloexanona', 'cetona'),
  oxopentanol: C('CC(=O)CCCO', '5-hidroxipentan-2-ona', 'hidroxicetona'), dioxolanoBenz: C('c1ccc(C2OCCO2)cc1', '2-fenil-1,3-dioxolano (acetal cíclico)', 'acetal'),
  glicol: C('OCCO', 'etilenoglicol', 'diol'), metanol: C('CO', 'metanol', 'alcool'), etanol: C('CCO', 'etanol', 'alcool'),
};
export const CLS_NAME = { aldeido: 'aldeído', cetona: 'cetona', gemdiol: 'gem-diol (hidrato)', hemiacetal: 'hemiacetal', acetal: 'acetal', hemicetal: 'hemicetal', cetal: 'cetal', tioacetal: 'tioacetal', tiocetal: 'tiocetal', imina: 'imina', enamina: 'enamina', oxima: 'oxima', hidrazona: 'hidrazona', cianoidrina: 'cianoidrina', alceno: 'alceno', carbinolamina: 'carbinolamina' };

/* produtos por substrato × reagente (gerados por modelos de reação no RDKit) */
export const PRODS = {"acetona": {"H2O": ["CC(C)(O)O"], "MeOH1": ["COC(C)(C)O"], "MeOH": ["COC(C)(C)OC"], "EtOH": ["CCOC(C)(C)OCC"], "glicol": ["CC1(C)OCCO1"], "propanodiol": ["CC1(C)OCCCO1"], "ditiol": ["CC1(C)SCCS1"], "RNH2": ["CN=C(C)C"], "R2NH": ["C=C(C)N1CCCC1"], "NH2OH": ["CC(C)=NO"], "NH2NH2": ["CC(C)=NN"], "CN": ["CC(C)(O)C#N"], "ylide": ["C=C(C)C"], "ylideEt": ["CC=C(C)C"], "HWE": ["CCOC(=O)C=C(C)C"]}, "cicloexanona": {"H2O": ["OC1(O)CCCCC1"], "MeOH1": ["COC1(O)CCCCC1"], "MeOH": ["COC1(OC)CCCCC1"], "EtOH": ["CCOC1(OCC)CCCCC1"], "glicol": ["C1CCC2(CC1)OCCO2"], "propanodiol": ["C1CCC2(CC1)OCCCO2"], "ditiol": ["C1CCC2(CC1)SCCS2"], "RNH2": ["CN=C1CCCCC1"], "R2NH": ["C1=C(N2CCCC2)CCCC1"], "NH2OH": ["ON=C1CCCCC1"], "NH2NH2": ["NN=C1CCCCC1"], "CN": ["N#CC1(O)CCCCC1"], "ylide": ["C=C1CCCCC1"], "ylideEt": ["CC=C1CCCCC1"], "HWE": ["CCOC(=O)C=C1CCCCC1"]}, "benzaldeido": {"H2O": ["OC(O)c1ccccc1"], "MeOH1": ["COC(O)c1ccccc1"], "MeOH": ["COC(OC)c1ccccc1"], "EtOH": ["CCOC(OCC)c1ccccc1"], "glicol": ["c1ccc(C2OCCO2)cc1"], "propanodiol": ["c1ccc(C2OCCCO2)cc1"], "ditiol": ["c1ccc(C2SCCS2)cc1"], "RNH2": ["CN=Cc1ccccc1"], "R2NH": [], "NH2OH": ["ON=Cc1ccccc1"], "NH2NH2": ["NN=Cc1ccccc1"], "CN": ["N#CC(O)c1ccccc1"], "ylide": ["C=Cc1ccccc1"], "ylideEt": ["CC=Cc1ccccc1"], "HWE": ["CCOC(=O)C=Cc1ccccc1"]}, "acetaldeido": {"H2O": ["CC(O)O"], "MeOH1": ["COC(C)O"], "MeOH": ["COC(C)OC"], "EtOH": ["CCOC(C)OCC"], "glicol": ["CC1OCCO1"], "propanodiol": ["CC1OCCCO1"], "ditiol": ["CC1SCCS1"], "RNH2": ["CC=NC"], "R2NH": ["C=CN1CCCC1"], "NH2OH": ["CC=NO"], "NH2NH2": ["CC=NN"], "CN": ["CC(O)C#N"], "ylide": ["C=CC"], "ylideEt": ["CC=CC"], "HWE": ["CC=CC(=O)OCC"]}, "butanona": {"H2O": ["CCC(C)(O)O"], "MeOH1": ["CCC(C)(O)OC"], "MeOH": ["CCC(C)(OC)OC"], "EtOH": ["CCOC(C)(CC)OCC"], "glicol": ["CCC1(C)OCCO1"], "propanodiol": ["CCC1(C)OCCCO1"], "ditiol": ["CCC1(C)SCCS1"], "RNH2": ["CCC(C)=NC"], "R2NH": ["C=C(CC)N1CCCC1", "CC=C(C)N1CCCC1"], "NH2OH": ["CCC(C)=NO"], "NH2NH2": ["CCC(C)=NN"], "CN": ["CCC(C)(O)C#N"], "ylide": ["C=C(C)CC"], "ylideEt": ["CC=C(C)CC"], "HWE": ["CCOC(=O)C=C(C)CC"]}};

/* ===================================================================
 * Nucleófilos (simulador “Escolha o nucleófilo”)
 * =================================================================== */
export const NUCS = {
  H2O: { lab: 'H₂O', atom: 'O', prod: 'gem-diol (hidrato)', type: 'adição', rev: 'sim — muito reversível; o equilíbrio depende fortemente da carbonila', cat: 'ácido ou base (catálise); a água também reage lentamente sem catalisador', water: 'não (a água é consumida)', mech: 'hydAcid', bond: 'C–O' },
  MeOH1: { lab: 'CH₃OH (1 equiv.)', atom: 'O', prod: 'hemiacetal / hemicetal', type: 'adição', rev: 'sim (hemiacetais acíclicos raramente são isoláveis)', cat: 'ácido ou base', water: 'não', mech: 'hemi', bond: 'C–O' },
  MeOH: { lab: 'CH₃OH (excesso) + H⁺', atom: 'O', prod: 'acetal / cetal', type: 'adição + substituição (via oxocarbênio)', rev: 'sim — remover água favorece o acetal; H₃O⁺ o hidrolisa', cat: 'ácido (obrigatório para a 2ª etapa)', water: 'sim (1 H₂O)', mech: 'acetal', bond: 'C–O' },
  EtOH: { lab: 'EtOH (excesso) + H⁺', atom: 'O', prod: 'acetal / cetal dietílico', type: 'adição + substituição', rev: 'sim', cat: 'ácido', water: 'sim', mech: 'acetal', bond: 'C–O' },
  glicol: { lab: 'etilenoglicol + H⁺', atom: 'O', prod: 'acetal/cetal cíclico (1,3-dioxolano)', type: 'adição + substituição intramolecular', rev: 'sim — favorecido entropicamente (intramolecular); remoção de água', cat: 'ácido (ex.: TsOH)', water: 'sim', mech: 'acetal', bond: 'C–O' },
  RNH2: { lab: 'CH₃NH₂ (amina 1ª)', atom: 'N', prod: 'imina (C=N–R)', type: 'adição + eliminação (condensação)', rev: 'sim — remover água favorece; H₃O⁺ hidrolisa', cat: 'ácido moderado (pH ≈ 4–5)', water: 'sim', mech: 'imine', bond: 'C=N' },
  R2NH: { lab: 'pirrolidina (amina 2ª)', atom: 'N', prod: 'enamina (C=C–NR₂)', type: 'adição + eliminação', rev: 'sim', cat: 'ácido moderado; remoção de água', water: 'sim', mech: 'enamine', bond: 'C–N e C=C' },
  NH2OH: { lab: 'NH₂OH', atom: 'N', prod: 'oxima (C=N–OH)', type: 'adição + eliminação', rev: 'sim (oximas costumam ser mais estáveis à hidrólise que iminas simples)', cat: 'ácido moderado', water: 'sim', mech: 'oxime', bond: 'C=N' },
  NH2NH2: { lab: 'NH₂NH₂', atom: 'N', prod: 'hidrazona (C=N–NH₂)', type: 'adição + eliminação', rev: 'sim', cat: 'ácido moderado', water: 'sim', mech: 'hydrazone', bond: 'C=N' },
  CN: { lab: 'HCN / CN⁻', atom: 'C', prod: 'cianoidrina (C(OH)CN)', type: 'adição', rev: 'sim — favorável para aldeídos e cetonas pouco impedidas', cat: 'base (CN⁻ é o nucleófilo; HCN protona o alcóxido)', water: 'não', mech: 'cyano', bond: 'C–C' },
  ylide: { lab: 'Ph₃P=CH₂ (ilídeo)', atom: 'C', prod: 'alceno (C=CH₂) + Ph₃P=O', type: 'olefinação (Wittig)', rev: 'não, na prática (força motriz: P=O)', cat: 'o ilídeo é preparado com base forte, a partir do sal de fosfônio', water: 'não (subproduto: Ph₃P=O)', mech: 'wittig', bond: 'C=C (nova C–C)' },
  HWE: { lab: '(EtO)₂P(O)CH₂CO₂Et + base', atom: 'C', prod: 'alceno conjugado, geralmente E', type: 'olefinação (HWE)', rev: 'não, na prática', cat: 'base (NaH, EtO⁻…) para gerar o carbânion', water: 'não (subproduto: (EtO)₂PO₂⁻, hidrossolúvel)', mech: 'hwe', bond: 'C=C (nova C–C)' },
};
export const SUBS = ['acetona', 'cicloexanona', 'benzaldeido', 'acetaldeido', 'butanona'];

/* ===================================================================
 * Hidratação — ordens de grandeza aproximadas (água, ~25 °C; literatura)
 * =================================================================== */
export const HYD = [
  ['hexafluoroacetona', '≈ 10⁶', 6, 'dois CF₃ fortemente retiradores: C muito δ+; carbonila desestabilizada'],
  ['cloral', '≈ 10⁴', 4.4, 'CCl₃ retirador de elétrons (hidrato de cloral é isolável)'],
  ['formaldeido', '≈ 10³', 3.3, 'sem grupos alquila: mínimo impedimento e nenhuma doação'],
  ['acetaldeido', '≈ 1', 0, 'um grupo alquila doador; ~ metade hidratado'],
  ['benzaldeido', '≈ 10⁻²', -2, 'conjugação com o anel estabiliza a C=O'],
  ['acetona', '≈ 10⁻³', -2.9, 'dois grupos alquila: doação + impedimento estérico'],
];
export const GLUCOSE_EQ = [['β-D-glucopiranose', 64], ['α-D-glucopiranose', 36], ['forma aberta (aldeído)', 0.003]];

/* ===================================================================
 * Cenários de proteção (simulador)
 * =================================================================== */
export const PROTECT = [
  { id: 'levul', start: 'levulinato', goal: 'oxopentanol', want: 'Reduzir o <b>éster</b> a álcool primário sem tocar na cetona.', reagent: 'LiAlH₄ (depois H₃O⁺)', protect: 'cetona', pg: 'etilenoglicol, H⁺ (remoção de água)', mid: 'levulinatoP', mid2: 'levulinatoPR', deprot: 'H₃O⁺ (ácido aquoso)', why: 'LiAlH₄ reduz cetonas mais rápido que ésteres. O cetal é estável em meio básico/nucleofílico e a hidretos; depois é hidrolisado com ácido aquoso.' },
  { id: 'ciclo', start: 'cetoesterCiclo', goal: 'hidroximetilCiclo', want: 'Converter o <b>éster</b> em CH₂OH mantendo a cetona do anel.', reagent: 'LiAlH₄ (depois workup neutro/básico)', protect: 'cetona', pg: 'etilenoglicol, TsOH (cat.), remoção de água', mid: 'cetoesterCicloP', mid2: 'cetoesterCicloPR', deprot: 'H₃O⁺ / acetona aquosa ácida', why: 'Proteger a cetona como 1,3-dioxolano; reduzir; desproteger.' },
];
export const COMPAT = [
  ['Base aquosa (NaOH, H₂O)', 'estável', 'ok'], ['Nucleófilos / hidretos (NaBH₄, LiAlH₄)', 'estável', 'ok'], ['Organometálicos (RMgX, RLi)', 'estável', 'ok'], ['Oxidantes brandos / básicos', 'geralmente estável', 'ok'],
  ['Ácido aquoso (H₃O⁺)', 'hidrolisado → carbonila', 'bad'], ['Ácido de Lewis + água', 'pode ser removido', 'bad'], ['Ácido anidro + diol', 'é formado (proteção)', 'mid'],
];

/* ===================================================================
 * Retrossíntese Wittig: alcenos e desconexões
 * =================================================================== */
export const WRETRO = [
  { alk: 'metilenocicloexano', opts: [['cicloexanona', 'Ph₃P=CH₂', true], ['formaldeído', 'Ph₃P=C(CH₂)₅ (ilídeo do cicloexila)', true]], best: 0, why: 'Preferível: cicloexanona + Ph₃P=CH₂ (ilídeo simples, fácil de preparar a partir de CH₃Br).' },
  { alk: 'estireno', opts: [['benzaldeído', 'Ph₃P=CH₂', true], ['formaldeído', 'Ph₃P=CHPh', true]], best: 0, why: 'Ambas funcionam no papel; benzaldeído + Ph₃P=CH₂ usa reagentes muito acessíveis.' },
  { alk: 'metilbuteno', opts: [['acetona', 'Ph₃P=CHCH₃', true], ['acetaldeído', 'Ph₃P=C(CH₃)₂', true]], best: 0, why: 'Acetona + ilídeo do etila (a partir de CH₃CH₂Br) evita o ilídeo de um haleto secundário, menos eficiente na SN2.' },
  { alk: 'fenilpropeno', opts: [['benzaldeído', 'Ph₃P=CHCH₃', true], ['acetaldeído', 'Ph₃P=CHPh', true]], best: 0, why: 'As duas desconexões são possíveis; a seletividade E/Z depende do ilídeo (estabilizado ou não) e das condições.' },
  { alk: 'etilidenociclo', opts: [['cicloexanona', 'Ph₃P=CHCH₃', true], ['acetaldeído', 'Ph₃P=C(CH₂)₅', true]], best: 0, why: 'Cicloexanona + ilídeo do etila: reagentes simples.' },
];
