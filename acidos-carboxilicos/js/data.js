/*
 * data.js — compostos (2D), derivados, grupos abandonadores, acidez,
 * matriz derivado × nucleófilo (simulador de reatividade) e cenários.
 */
const C = (smi, name, cls) => ({ smi, name, cls });
export const COMP = {
  acidoAcetico: C('CC(=O)O', 'ácido acético', 'acido'), acidoFormico: C('O=CO', 'ácido fórmico', 'acido'), acidoPropanoico: C('CCC(=O)O', 'ácido propanoico', 'acido'), acidoButanoico: C('CCCC(=O)O', 'ácido butanoico', 'acido'),
  acidoBenzoico: C('OC(=O)c1ccccc1', 'ácido benzoico', 'acido'), acidoFenilacetico: C('OC(=O)Cc1ccccc1', 'ácido fenilacético', 'acido'), acidoCloroacetico: C('OC(=O)CCl', 'ácido cloroacético', 'acido'),
  acidoDicloro: C('OC(=O)C(Cl)Cl', 'ácido dicloroacético', 'acido'), acidoTricloro: C('OC(=O)C(Cl)(Cl)Cl', 'ácido tricloroacético', 'acido'), acidoTrifluoro: C('OC(=O)C(F)(F)F', 'ácido trifluoroacético', 'acido'),
  acetato: C('CC(=O)[O-]', 'íon acetato', 'carboxilato'), benzoato: C('[O-]C(=O)c1ccccc1', 'íon benzoato', 'carboxilato'), propanoato: C('CCC(=O)[O-]', 'íon propanoato', 'carboxilato'),
  cloretoAcetila: C('CC(=O)Cl', 'cloreto de acetila', 'cloreto'), cloretoBenzoila: C('O=C(Cl)c1ccccc1', 'cloreto de benzoíla', 'cloreto'), cloretoPropanoila: C('CCC(=O)Cl', 'cloreto de propanoíla', 'cloreto'), cloretoButanoila: C('CCCC(=O)Cl', 'cloreto de butanoíla', 'cloreto'),
  anidridoAcetico: C('CC(=O)OC(C)=O', 'anidrido acético', 'anidrido'), anidridoBenzoico: C('O=C(OC(=O)c1ccccc1)c1ccccc1', 'anidrido benzoico', 'anidrido'), anidridoMisto: C('CC(=O)OC(=O)c1ccccc1', 'anidrido acético-benzoico (misto)', 'anidrido'),
  anidridoSuccinico: C('O=C1CCC(=O)O1', 'anidrido succínico (cíclico)', 'anidrido'), anidridoPropanoico: C('CCC(=O)OC(=O)CC', 'anidrido propanoico', 'anidrido'),
  acetatoEtila: C('CCOC(C)=O', 'acetato de etila', 'ester'), acetatoMetila: C('COC(C)=O', 'acetato de metila', 'ester'), benzoatoMetila: C('COC(=O)c1ccccc1', 'benzoato de metila', 'ester'), benzoatoEtila: C('CCOC(=O)c1ccccc1', 'benzoato de etila', 'ester'),
  propanoatoMetila: C('CCC(=O)OC', 'propanoato de metila', 'ester'), butanoatoEtila: C('CCCC(=O)OCC', 'butanoato de etila', 'ester'), acetatoIsopropila: C('CC(=O)OC(C)C', 'acetato de isopropila', 'ester'), acetatoFenila: C('CC(=O)Oc1ccccc1', 'acetato de fenila', 'ester'),
  acetamida: C('CC(N)=O', 'acetamida', 'amida'), nMetilacetamida: C('CNC(C)=O', 'N-metilacetamida', 'amida'), dma: C('CC(=O)N(C)C', 'N,N-dimetilacetamida', 'amida'), benzamida: C('NC(=O)c1ccccc1', 'benzamida', 'amida'),
  nMetilbenzamida: C('CNC(=O)c1ccccc1', 'N-metilbenzamida', 'amida'), nnDimetilbenzamida: C('CN(C)C(=O)c1ccccc1', 'N,N-dimetilbenzamida', 'amida'), propanamida: C('CCC(N)=O', 'propanamida', 'amida'), butanamida: C('CCCC(N)=O', 'butanamida', 'amida'), acetanilida: C('CC(=O)Nc1ccccc1', 'acetanilida (N-fenilacetamida)', 'amida'),
  gbl: C('O=C1CCCO1', 'γ-butirolactona', 'lactona'), dvl: C('O=C1CCCCO1', 'δ-valerolactona', 'lactona'), betaPropiolactona: C('O=C1CCO1', 'β-propiolactona', 'lactona'), caprolactona: C('O=C1CCCCCO1', 'ε-caprolactona', 'lactona'),
  betaLactama: C('O=C1CCN1', 'β-lactama (azetidin-2-ona)', 'lactama'), gamaLactama: C('O=C1CCCN1', 'γ-lactama (pirrolidin-2-ona)', 'lactama'), deltaLactama: C('O=C1CCCCN1', 'δ-lactama (piperidin-2-ona)', 'lactama'), caprolactama: C('O=C1CCCCCN1', 'ε-caprolactama', 'lactama'),
  hidroxibutanoico: C('OCCCC(=O)O', 'ácido 4-hidroxibutanoico', 'hidroxiacido'), hidroxipentanoico: C('OCCCCC(=O)O', 'ácido 5-hidroxipentanoico', 'hidroxiacido'), hidroxipropanoico: C('OCCC(=O)O', 'ácido 3-hidroxipropanoico', 'hidroxiacido'), hidroxiacetico: C('OCC(=O)O', 'ácido glicólico', 'hidroxiacido'),
  aminobutanoico: C('NCCCC(=O)O', 'ácido 4-aminobutanoico', 'aminoacido'), aminopentanoico: C('NCCCCC(=O)O', 'ácido 5-aminopentanoico', 'aminoacido'),
  acetonitrila: C('CC#N', 'acetonitrila', 'nitrila'), benzonitrila: C('N#Cc1ccccc1', 'benzonitrila', 'nitrila'), propanonitrila: C('CCC#N', 'propanonitrila', 'nitrila'), butanonitrila: C('CCCC#N', 'butanonitrila', 'nitrila'), fenilacetonitrila: C('N#CCc1ccccc1', 'fenilacetonitrila', 'nitrila'),
  bromoetano: C('CCBr', 'bromoetano', 'haleto'), brometoBenzila: C('BrCc1ccccc1', 'brometo de benzila', 'haleto'), bromopropano: C('CCCBr', '1-bromopropano', 'haleto'),
  acetoacetico: C('CC(=O)CC(=O)O', 'ácido acetoacético (β-cetoácido)', 'cetoacido'), benzoilacetico: C('OC(=O)CC(=O)c1ccccc1', 'ácido benzoilacético (β-cetoácido)', 'cetoacido'), metilAcetoacetico: C('CC(=O)C(C)C(=O)O', 'ácido 2-metil-3-oxobutanoico', 'cetoacido'),
  malonico: C('OC(=O)CC(=O)O', 'ácido malônico', 'diacido'), metilmalonico: C('CC(C(=O)O)C(=O)O', 'ácido metilmalônico', 'diacido'), benzilmalonico: C('OC(=O)C(Cc1ccccc1)C(=O)O', 'ácido benzilmalônico', 'diacido'), dietilmalonato: C('CCOC(=O)CC(=O)OCC', 'malonato de dietila', 'ester'),
  fenilpropanoico: C('OC(=O)CCc1ccccc1', 'ácido 3-fenilpropanoico', 'acido'), cetoNaoBeta: C('CC(=O)CCC(=O)O', 'ácido 4-oxopentanoico (γ-cetoácido)', 'cetoacido'),
  acetona: C('CC(C)=O', 'acetona', 'cetona'), acetofenona: C('CC(=O)c1ccccc1', 'acetofenona', 'cetona'), butanona: C('CCC(C)=O', 'butanona', 'cetona'), enolAcetona: C('C=C(C)O', 'enol da acetona', 'enol'),
  metanol: C('CO', 'metanol', 'alcool'), etanol: C('CCO', 'etanol', 'alcool'), isopropanol: C('CC(C)O', 'propan-2-ol', 'alcool'), fenol: C('Oc1ccccc1', 'fenol', 'alcool'),
  amonia: C('N', 'amônia', 'amina'), metilamina: C('CN', 'metilamina', 'amina'), dimetilamina: C('CNC', 'dimetilamina', 'amina'), anilina: C('Nc1ccccc1', 'anilina', 'amina'), etilamina: C('CCN', 'etilamina', 'amina'),
  metilamonio: C('C[NH3+]', 'metilamônio', 'amonio'), amonio: C('[NH4+]', 'amônio', 'amonio'), co2: C('O=C=O', 'CO₂', 'outro'), hcl: C('Cl', 'HCl', 'outro'),
};
export const CLS = { acido: 'ácido carboxílico', carboxilato: 'carboxilato', cloreto: 'cloreto de acila', anidrido: 'anidrido', ester: 'éster', amida: 'amida', lactona: 'lactona', lactama: 'lactama', nitrila: 'nitrila' };

/* ===================================================================
 * Derivados — escada de reatividade
 * =================================================================== */
export const DERIV = [
  { k: 'cloreto', name: 'Cloreto de acila', f: 'RCOCl', Y: 'Cl', lg: 'Cl⁻', pKaHY: '≈ −7 (HCl)', res: 'fraca (2p C–3p Cl: sobreposição ruim)', rx: 'muito alta', rank: 5, key: 'cloretoAcetila', m3: 'cloretoAcetila' },
  { k: 'anidrido', name: 'Anidrido', f: 'RCOOCOR', Y: 'OCOR', lg: 'RCOO⁻', pKaHY: '≈ 4,8 (RCOOH)', res: 'moderada (par do O dividido entre duas C=O)', rx: 'alta', rank: 4, key: 'anidridoAcetico', m3: 'anidridoAcetico' },
  { k: 'ester', name: 'Éster', f: 'RCOOR′', Y: 'OR′', lg: 'R′O⁻ (ou R′OH após protonação)', pKaHY: '≈ 16 (R′OH)', res: 'significativa', rx: 'moderada', rank: 3, key: 'acetatoEtila', m3: 'acetatoEtila' },
  { k: 'acido', name: 'Ácido carboxílico', f: 'RCOOH', Y: 'OH', lg: 'HO⁻ (ou H₂O após protonação)', pKaHY: '≈ 15,7 (H₂O)', res: 'significativa', rx: 'moderada (em base vira carboxilato, pouco reativo)', rank: 3, key: 'acidoAcetico', m3: 'acidoAcetico' },
  { k: 'amida', name: 'Amida', f: 'RCONR₂', Y: 'NR₂', lg: 'R₂N⁻ (péssimo)', pKaHY: '≈ 35–38 (R₂NH)', res: 'forte (N menos eletronegativo doa melhor)', rx: 'baixa', rank: 1, key: 'acetamida', m3: 'acetamida' },
];
export const LG = [['Cl⁻', '−7', 'HCl', 5], ['RCOO⁻', '4,8', 'RCOOH', 4], ['H₂O (de –OH₂⁺)', '−1,7', 'H₃O⁺', 4.5], ['RO⁻', '16', 'ROH', 2], ['HO⁻', '15,7', 'H₂O', 2], ['NH₃ (de –NH₃⁺)', '9,2', 'NH₄⁺', 3], ['H₂N⁻', '38', 'NH₃', 0.3]];
export const PKA = [['acidoAcetico', 4.76], ['acidoCloroacetico', 2.86], ['acidoDicloro', 1.35], ['acidoTricloro', 0.65], ['acidoBenzoico', 4.20], ['acidoFormico', 3.75], ['etanol', 16], ['fenol', 10.0]];

/* ===================================================================
 * Matriz derivado × nucleófilo (família acetila)
 * ok: 'fácil' | 'moderada' | 'catálise' | 'lenta' | 'ácido-base' | 'não'
 * =================================================================== */
export const NUCS = { H2O: 'H₂O', MeOH: 'CH₃OH', MeO: 'CH₃O⁻', NH3: 'NH₃', MeNH2: 'CH₃NH₂', OH: 'HO⁻', AcO: 'CH₃COO⁻' };
export const SUBS = { cloreto: 'cloretoAcetila', anidrido: 'anidridoAcetico', ester: 'acetatoEtila', amida: 'acetamida', acido: 'acidoAcetico' };
const R = (ok, prods, why, mech) => ({ ok, prods, why, mech });
export const MATRIX = {
  cloreto: {
    H2O: R('fácil', ['acidoAcetico', 'hcl'], 'Cloretos de acila hidrolisam rapidamente (Cl⁻ é ótimo grupo de saída; C muito eletrofílico).', 'neutral'),
    MeOH: R('fácil', ['acetatoMetila', 'hcl'], 'Álcool ataca; Cl⁻ sai; desprotonação. Uma base (piridina, Et₃N) costuma neutralizar o HCl.', 'neutral'),
    MeO: R('fácil', ['acetatoMetila'], 'Alcóxido ataca; Cl⁻ sai.', 'anion'),
    NH3: R('fácil', ['acetamida', 'amonio'], 'NH₃ ataca; Cl⁻ sai; o HCl formado é neutralizado por excesso de NH₃ (2 equiv.).', 'neutral'),
    MeNH2: R('fácil', ['nMetilacetamida', 'metilamonio'], 'Amina primária → amida secundária; excesso de amina ou base neutraliza HCl.', 'neutral'),
    OH: R('fácil', ['acetato'], 'Hidrólise rápida; em base o ácido formado vira carboxilato.', 'anion'),
    AcO: R('fácil', ['anidridoAcetico'], 'Carboxilato ataca; Cl⁻ sai → anidrido (síntese clássica de anidridos).', 'anion'),
  },
  anidrido: {
    H2O: R('moderada', ['acidoAcetico', 'acidoAcetico'], 'Hidrólise mais lenta que a do cloreto, mas ocorre; sai carboxilato (protonado no fim).', 'neutral'),
    MeOH: R('moderada', ['acetatoMetila', 'acidoAcetico'], 'Éster + ácido; o grupo de saída é o carboxilato.', 'neutral'),
    MeO: R('fácil', ['acetatoMetila', 'acetato'], 'Éster + carboxilato.', 'anion'),
    NH3: R('fácil', ['acetamida', 'acetato'], 'Amida + carboxilato de amônio (2 equiv. de NH₃).', 'neutral'),
    MeNH2: R('fácil', ['nMetilacetamida', 'acetato'], 'Amida + carboxilato.', 'neutral'),
    OH: R('fácil', ['acetato', 'acetato'], 'Dois carboxilatos.', 'anion'),
    AcO: R('não', [], 'Troca degenerada: o produto é o próprio anidrido acético (sem conversão líquida).', null),
  },
  ester: {
    H2O: R('catálise', ['acidoAcetico', 'etanol'], 'Sem catalisador é muito lenta. Com H₃O⁺: hidrólise ácida, <b>equilíbrio</b> (inverso da Fischer).', 'acidHyd'),
    MeOH: R('catálise', ['acetatoMetila', 'etanol'], 'Transesterificação: equilíbrio que exige catálise ácida ou básica; excesso de MeOH desloca.', 'neutral'),
    MeO: R('moderada', ['acetatoMetila', 'etanol'], 'Transesterificação básica (equilíbrio; RO⁻ entra e EtO⁻ sai — basicidades semelhantes).', 'anion'),
    NH3: R('lenta', ['acetamida', 'etanol'], '<b>Aminólise</b>: possível, mas lenta (éster é menos reativo); costuma exigir aquecimento/excesso de amina. Desce a escada (éster → amida).', 'neutral'),
    MeNH2: R('lenta', ['nMetilacetamida', 'etanol'], 'Aminólise com amina primária: lenta; favorecida termodinamicamente.', 'neutral'),
    OH: R('fácil', ['acetato', 'etanol'], '<b>Saponificação</b>: o ácido formado é desprotonado (RCOO⁻) → efetivamente irreversível.', 'sapon'),
    AcO: R('não', [], 'Formar anidrido a partir de éster seria subir a escada: no intermediário tetraédrico, o carboxilato (melhor grupo de saída que RO⁻) é que sairia de volta. Desfavorável.', null),
  },
  amida: {
    H2O: R('não', [], 'Sem catálise e calor, amidas praticamente não hidrolisam (forte ressonância + NH₂⁻ péssimo grupo de saída). Com H₃O⁺/calor: ácido + NH₄⁺.', 'amideAcid'),
    MeOH: R('não', [], 'Não ocorre em condições usuais: subir a escada (amida → éster) exigiria expulsar NH₂⁻.', null),
    MeO: R('não', [], 'O intermediário tetraédrico expulsaria CH₃O⁻ (melhor grupo de saída) em vez de NH₂⁻: volta à amida.', null),
    NH3: R('não', [], 'Troca degenerada (sem conversão).', null),
    MeNH2: R('não', [], 'Transamidação: não ocorre em condições brandas.', null),
    OH: R('lenta', ['acetato', 'amonia'], 'Só com aquecimento prolongado e HO⁻ concentrado: carboxilato + NH₃.', 'amideBase'),
    AcO: R('não', [], 'Não ocorre: amida está no fundo da escada.', null),
  },
  acido: {
    H2O: R('não', [], 'Troca degenerada de oxigênio (sem conversão líquida).', null),
    MeOH: R('catálise', ['acetatoMetila'], 'Só com <b>catálise ácida</b>: esterificação de Fischer (equilíbrio). Excesso de álcool/remover água desloca.', 'fischer'),
    MeO: R('ácido-base', ['acetato', 'metanol'], 'O alcóxido é base: desprotona o ácido → carboxilato (não forma éster).', null),
    NH3: R('ácido-base', ['acetato', 'amonio'], '<b>Reação ácido-base</b>: forma o sal carboxilato de amônio, não amida (em condições brandas).', null),
    MeNH2: R('ácido-base', ['acetato', 'metilamonio'], '<b>Ácido-base primeiro</b>: sal de metilamônio. Para a amida: ativar o ácido (SOCl₂ → RCOCl; DCC/EDC) ou aquecimento forte com desidratação.', null),
    OH: R('ácido-base', ['acetato'], 'Neutralização: carboxilato (pouco eletrofílico).', null),
    AcO: R('não', [], 'Nenhuma reação útil.', null),
  },
};

/* ===================================================================
 * Reagentes para RCOCl
 * =================================================================== */
export const CLREAG = [
  { k: 'SOCl₂', name: 'cloreto de tionila', act: 'O do ácido ataca o S → acil clorossulfito (bom grupo de saída)', by: 'SO₂(g) + HCl(g)', why: 'subprodutos gasosos deixam o meio e facilitam o isolamento' },
  { k: '(COCl)₂', name: 'cloreto de oxalila', act: 'forma um intermediário ativado (frequentemente com DMF catalítico, via reagente tipo Vilsmeier)', by: 'CO(g) + CO₂(g) + HCl(g)', why: 'condições brandas; subprodutos gasosos' },
  { k: 'PCl₃', name: 'tricloreto de fósforo', act: 'O do ácido liga-se ao P (ativação por fósforo)', by: 'H₃PO₃ (ácido fosforoso)', why: '3 RCOOH + PCl₃ → 3 RCOCl + H₃PO₃' },
  { k: 'PCl₅', name: 'pentacloreto de fósforo', act: 'ativação por fósforo (P–O)', by: 'POCl₃ + HCl', why: 'RCOOH + PCl₅ → RCOCl + POCl₃ + HCl' },
];

/* ===================================================================
 * Síntese: alvo → rotas
 * =================================================================== */
export const ROUTES = {
  nMetilbenzamida: [['cloretoBenzoila + CH₃NH₂ (2 equiv.)', true, 'Rápida; excesso de amina neutraliza o HCl.'], ['anidrido benzoico + CH₃NH₂', true, 'Funciona; subproduto: benzoato.'], ['benzoato de metila + CH₃NH₂ (calor)', true, 'Aminólise: possível, mais lenta.'], ['ácido benzoico + CH₃NH₂ (t.a.)', false, 'Só forma o sal (ácido-base)!'], ['ácido benzoico + DCC + CH₃NH₂', true, 'Ácido ativado por agente de acoplamento.'], ['benzonitrila + CH₃OH', false, 'Não forma amida N-substituída.']],
  acetatoEtila: [['ácido acético + EtOH, H⁺ (Fischer)', true, 'Equilíbrio; excesso de EtOH/remover água.'], ['cloreto de acetila + EtOH (piridina)', true, 'Rápida.'], ['anidrido acético + EtOH', true, 'Gera ácido acético como subproduto.'], ['acetamida + EtOH', false, 'Subir a escada: não ocorre.'], ['acetato de sódio + EtOH', false, 'Carboxilato não é eletrófilo útil.']],
  anidridoAcetico: [['cloreto de acetila + acetato', true, 'Rota clássica.'], ['ácido acético + acetato de etila', false, 'Não forma anidrido.'], ['acetamida + ácido acético', false, 'Subir a escada.']],
  benzonitrila: [['benzamida + SOCl₂ (ou P₂O₅, POCl₃)', true, 'Desidratação de amida primária.'], ['ácido benzoico + NH₃ (t.a.)', false, 'Só sal.'], ['N,N-dimetilbenzamida + SOCl₂', false, 'Amida terciária não tem os H para perder: não forma nitrila.']],
  acidoPropanoico: [['propanonitrila + H₃O⁺, calor', true, 'Hidrólise completa (via amida).'], ['propanoato de metila + NaOH; depois H₃O⁺', true, 'Saponificação + acidificação.'], ['propanamida + H₃O⁺, calor', true, 'Hidrólise ácida da amida.'], ['cloreto de propanoíla + H₂O', true, 'Rápida.'], ['ácido metilmalônico + calor', true, 'Descarboxilação de derivado malônico.']],
};
