/*
 * rxn.js — base de dados de reações: simulador de álcoois, Williamson,
 * abertura de epóxidos, mapas de reações e desafio "Qual é o produto?".
 */

/* ===================================================================
 * Álcoois: substratos × reagentes
 * =================================================================== */
export const ALC = {
  butan1ol: { t: 'butan-1-ol', cls: '1°', d: 'álcool primário' },
  butan2olR: { t: '(R)-butan-2-ol', cls: '2°', d: 'álcool secundário, quiral' },
  tbutanol: { t: '2-metilpropan-2-ol', cls: '3°', d: 'álcool terciário (terc-butanol)' },
  fenilmetanol: { t: 'fenilmetanol', cls: 'benzílico', d: 'álcool benzílico (1°)' },
  alilico: { t: 'prop-2-en-1-ol', cls: 'alílico', d: 'álcool alílico (1°)' },
  dimetilbutan2ol: { t: '3,3-dimetilbutan-2-ol', cls: '2°', d: '2° vizinho a C quaternário' },
};

export const RG = {
  HBr: { t: 'HBr (conc.)', tr: 'álcool → brometo de alquila', sec: 'rea-hx' },
  HCl: { t: 'HCl (ZnCl₂)', tr: 'álcool → cloreto de alquila', sec: 'rea-hx' },
  PBr3: { t: 'PBr₃', tr: 'álcool → brometo (via ativação O–P)', sec: 'rea-pbr3' },
  SOCl2: { t: 'SOCl₂, piridina', tr: 'álcool → cloreto (via clorossulfito)', sec: 'rea-socl2' },
  TsCl: { t: 'TsCl, piridina', tr: 'álcool → tosilato (ativação sem quebrar C–O)', sec: 'rea-ts' },
  H2SO4: { t: 'H₂SO₄ conc., Δ', tr: 'desidratação → alceno', sec: 'rea-desid' },
  PCC: { t: 'PCC, CH₂Cl₂', tr: 'oxidação branda', sec: 'oxidacao' },
  Jones: { t: 'CrO₃, H₂SO₄, H₂O (Jones)', tr: 'oxidação forte', sec: 'oxidacao' },
  NaH: { t: 'NaH', tr: 'desprotonação → alcóxido', sec: 'acidez' },
};

/* m: mecanismo · c: carbocátion · r: rearranjo · st: estereoquímica */
const P = (k, n, x, m, c, r, st) => ({ k, n, x, m, c, r, st });
const NO = (n, x) => ({ k: null, n, x });
export const MECHS = ['SN2', 'SN1', 'E1', 'E2 (via ROH₂⁺)', 'oxidação', 'ácido-base', 'ativação do O (C–O intacta)'];
export const STEREO = ['inversão', 'retenção', 'racemização/mistura', 'não se aplica'];

export const AR = {
  butan1ol: {
    HBr: P('bromobutano1', '1-bromobutano', 'O OH é protonado (ROH₂⁺) e o Br⁻ desloca a H₂O pelo lado oposto. Carbocátion primário não se forma.', 'SN2', 'não', 'não', 'não se aplica'),
    HCl: P('clorobutano1', '1-clorobutano', 'Cl⁻ é um nucleófilo mais fraco que Br⁻ em meio prótico; com 1° a reação é lenta e o ZnCl₂ (ácido de Lewis) ajuda a ativar o OH.', 'SN2', 'não', 'não', 'não se aplica'),
    PBr3: P('bromobutano1', '1-bromobutano', 'O O ataca o P (ativação O–PBr₂); o Br⁻ liberado faz SN2 no carbono. Sem carbocátion.', 'SN2', 'não', 'não', 'não se aplica'),
    SOCl2: P('clorobutano1', '1-clorobutano', 'Forma-se um clorossulfito (ROSOCl); Cl⁻ faz SN2 e saem SO₂ + Cl⁻. Subprodutos gasosos facilitam a purificação.', 'SN2', 'não', 'não', 'não se aplica'),
    TsCl: P('butilOTs', 'tosilato de butila', 'O O do álcool ataca o enxofre do TsCl; a ligação C–O não é tocada. O TsO⁻ é um ótimo grupo abandonador para uma SN2/E2 posterior.', 'ativação do O (C–O intacta)', 'não', 'não', 'retenção'),
    H2SO4: P('but2enoE', '(E)-but-2-eno (principal)', 'Álcoois primários não formam carbocátion primário livre: a perda de H₂O é assistida pela remoção do H<sub>β</sub> (tipo E2 sobre ROH₂⁺), dando but-1-eno, que em meio ácido é reprotonado e isomeriza ao but-2-eno, mais estável. Exige temperaturas mais altas que para 2°/3°.', 'E2 (via ROH₂⁺)', 'não', 'não', 'não se aplica'),
    PCC: P('butanal', 'butanal', 'PCC (anidro) para no aldeído.', 'oxidação', 'não', 'não', 'não se aplica'),
    Jones: P('acidoButanoico', 'ácido butanoico', 'Em meio aquoso o aldeído forma hidrato e é oxidado de novo: o álcool 1° vai até ácido carboxílico. Cr(VI) laranja → Cr(III) verde.', 'oxidação', 'não', 'não', 'não se aplica'),
    NaH: P('butoxidoNa', 'butóxido de sódio (+ H₂↑)', 'H⁻ (pKa do H₂ ≈ 35) remove o H do OH (pKa ≈ 16) de forma irreversível: sai H₂ gasoso.', 'ácido-base', 'não', 'não', 'não se aplica'),
  },
  butan2olR: {
    HBr: P('bromobutano2', '2-bromobutano', 'Álcool 2°: caso intermediário. Mecanismos SN1 e SN2 podem competir; parte do produto pode racemizar. Não espere estereoespecificidade.', 'SN1', 'sim', 'não', 'racemização/mistura'),
    HCl: P('clorobutano2', '2-clorobutano', 'Com ZnCl₂ (reagente de Lucas) o 2° reage em alguns minutos (via caráter SN1).', 'SN1', 'sim', 'não', 'racemização/mistura'),
    PBr3: P('bromobutano2S', '(S)-2-bromobutano', 'SN2 do Br⁻ sobre o O ativado: <b>inversão</b> de configuração; sem carbocátion e sem rearranjo.', 'SN2', 'não', 'não', 'inversão'),
    SOCl2: P('clorobutano2S', '(S)-2-clorobutano', 'Com piridina, o Cl⁻ livre ataca o clorossulfito por SN2: <b>inversão</b>. Sem base, pode haver retenção (mecanismo SNi). A estereoquímica depende das condições.', 'SN2', 'não', 'não', 'inversão'),
    TsCl: P('butan2ilOTsR', 'tosilato de (R)-butan-2-ila', 'C–O intacta: <b>retenção</b>. Uma SN2 posterior (ex.: NaCN) dá inversão no carbono.', 'ativação do O (C–O intacta)', 'não', 'não', 'retenção'),
    H2SO4: P('but2enoE', '(E)-but-2-eno (principal)', 'E1: protonação, saída da água (lenta) → cátion 2°, perda de H<sub>β</sub>. Zaitsev: but-2-eno (E &gt; Z) &gt; but-1-eno.', 'E1', 'sim', 'não', 'não se aplica'),
    PCC: P('butanona', 'butanona', 'Álcool 2° → cetona.', 'oxidação', 'não', 'não', 'não se aplica'),
    Jones: P('butanona', 'butanona', 'Álcool 2° → cetona; a cetona não é oxidada adiante nessas condições.', 'oxidação', 'não', 'não', 'não se aplica'),
    NaH: P('sec_butoxidoNa', '(R)-butan-2-óxido de sódio', 'Só a ligação O–H é afetada: configuração mantida.', 'ácido-base', 'não', 'não', 'retenção'),
  },
  tbutanol: {
    HBr: P('tbubr', '2-bromo-2-metilpropano', 'SN1: ROH₂⁺ perde água → carbocátion 3° → Br⁻.', 'SN1', 'sim', 'não', 'não se aplica'),
    HCl: P('tbucl', '2-cloro-2-metilpropano', 'SN1 rápida mesmo sem ZnCl₂ (turvação imediata no teste de Lucas).', 'SN1', 'sim', 'não', 'não se aplica'),
    PBr3: NO('não é o método adequado', 'O PBr₃ depende de uma SN2 no carbono ativado: em carbono terciário ela é bloqueada. Para 3°, use HBr (SN1).'),
    SOCl2: NO('não é o método adequado', 'Com álcoois terciários o SOCl₂ tende a dar eliminação/misturas. Para o cloreto terciário use HCl (SN1).'),
    TsCl: NO('tosilação pouco eficiente', 'O O de um álcool 3° é muito impedido para atacar o TsCl com eficiência; além disso, um tosilato 3° não faria SN2.'),
    H2SO4: P('metilpropeno', '2-metilpropeno', 'E1 fácil (cátion 3°): ocorre em condições mais brandas que para 2° e 1°.', 'E1', 'sim', 'não', 'não se aplica'),
    PCC: NO('não há oxidação simples', 'O carbono carbinólico não tem H: álcoois 3° não são oxidados por PCC.'),
    Jones: NO('não há oxidação simples', 'Sem H no carbono do OH: a solução de Jones permanece laranja (não há reação de oxidação simples).'),
    NaH: P('tbuONa', 'terc-butóxido de sódio (+ H₂↑)', 'Base forte e volumosa (bom para E2, ruim como nucleófilo em SN2 impedida).', 'ácido-base', 'não', 'não', 'não se aplica'),
  },
  fenilmetanol: {
    HBr: P('benzilBr', 'brometo de benzila', 'Carbono benzílico: o cátion é estabilizado por ressonância (SN1 possível) e a SN2 também é rápida.', 'SN1', 'sim', 'não', 'não se aplica'),
    HCl: P('benzilCl', 'cloreto de benzila', 'Reação rápida (cátion benzílico estabilizado por ressonância).', 'SN1', 'sim', 'não', 'não se aplica'),
    PBr3: P('benzilBr', 'brometo de benzila', 'SN2 sobre o O ativado.', 'SN2', 'não', 'não', 'não se aplica'),
    SOCl2: P('benzilCl', 'cloreto de benzila', 'Via clorossulfito; SO₂ gasoso sai.', 'SN2', 'não', 'não', 'não se aplica'),
    TsCl: P('benzilOTs', 'tosilato de benzila', 'Ativação do O; C–O intacta.', 'ativação do O (C–O intacta)', 'não', 'não', 'não se aplica'),
    H2SO4: NO('não forma alceno', 'O carbono β é o carbono aromático (ipso), sem H elegível: não há desidratação a alceno. Em ácido, formam-se éter dibenzílico e outros produtos.'),
    PCC: P('benzaldeido', 'benzaldeído', 'PCC para no aldeído.', 'oxidação', 'não', 'não', 'não se aplica'),
    Jones: P('acidoBenzoico', 'ácido benzoico', 'Oxidação até ácido carboxílico.', 'oxidação', 'não', 'não', 'não se aplica'),
    NaH: P('benzilONa', 'benzilóxido de sódio', 'Desprotonação do OH.', 'ácido-base', 'não', 'não', 'não se aplica'),
  },
  alilico: {
    HBr: P('alilBr', '3-bromoprop-1-eno (brometo de alila)', 'O cátion alílico é estabilizado por ressonância; aqui as duas extremidades são equivalentes, então dão o mesmo produto. Em alílicos substituídos pode haver mistura (transposição alílica).', 'SN1', 'sim', 'não', 'não se aplica'),
    HCl: P('alilCl', '3-cloroprop-1-eno', 'Via cátion alílico (ressonância).', 'SN1', 'sim', 'não', 'não se aplica'),
    PBr3: P('alilBr', '3-bromoprop-1-eno', 'SN2 sobre o O ativado (sem cátion: evita transposição alílica).', 'SN2', 'não', 'não', 'não se aplica'),
    SOCl2: P('alilCl', '3-cloroprop-1-eno', 'Via clorossulfito.', 'SN2', 'não', 'não', 'não se aplica'),
    TsCl: P('alilOTs', 'tosilato de alila', 'Ativação do O; C–O intacta.', 'ativação do O (C–O intacta)', 'não', 'não', 'não se aplica'),
    H2SO4: NO('não é uma desidratação útil', 'O carbono β já é sp² (C=C): a eliminação daria um aleno, desfavorável. Em ácido concentrado ocorrem outras reações (adição à C=C, polimerização).'),
    PCC: P('propenal', 'propenal (acroleína)', 'PCC oxida o álcool alílico ao aldeído α,β-insaturado sem tocar a C=C.', 'oxidação', 'não', 'não', 'não se aplica'),
    Jones: P('acidoPropenoico', 'ácido propenoico', 'Oxidação até ácido (a C=C geralmente resiste nessas condições).', 'oxidação', 'não', 'não', 'não se aplica'),
    NaH: P('alilONa', 'alilóxido de sódio', 'Desprotonação do OH.', 'ácido-base', 'não', 'não', 'não se aplica'),
  },
  dimetilbutan2ol: {
    HBr: P('bromoDimetilbutano23', '2-bromo-2,3-dimetilbutano (rearranjado)', 'Cátion 2° vizinho a C quaternário: <b>migração 1,2 de metila</b> → cátion 3°; o Br⁻ ataca o carbono terciário.', 'SN1', 'sim', 'sim', 'não se aplica'),
    HCl: P('cloroDimetilbutano23', '2-cloro-2,3-dimetilbutano (rearranjado)', 'Mesmo rearranjo: cátion 2° → 3° por migração de CH₃.', 'SN1', 'sim', 'sim', 'não se aplica'),
    PBr3: P('bromoDimetilbutano22', '3-bromo-2,2-dimetilbutano (sem rearranjo)', 'Sem carbocátion → sem rearranjo. Atenção: a SN2 é lenta (carbono vizinho ao terc-butila, muito impedido).', 'SN2', 'não', 'não', 'inversão'),
    SOCl2: P('cloroDimetilbutano22', '3-cloro-2,2-dimetilbutano', 'Sem carbocátion livre → sem rearranjo (reação lenta por impedimento).', 'SN2', 'não', 'não', 'inversão'),
    TsCl: P('dimetilbutilOTs', 'tosilato de 3,3-dimetilbutan-2-ila', 'C–O intacta: sem rearranjo nesta etapa.', 'ativação do O (C–O intacta)', 'não', 'não', 'retenção'),
    H2SO4: P('dimetilbut2eno', '2,3-dimetilbut-2-eno (principal)', 'E1 com <b>migração de metila</b> (2° → 3°) e perda do H<sub>β</sub> que dá o alceno tetrassubstituído (Zaitsev).', 'E1', 'sim', 'sim', 'não se aplica'),
    PCC: P('dimetilbutanona', '3,3-dimetilbutan-2-ona', 'Álcool 2° → cetona (sem carbocátion: sem rearranjo).', 'oxidação', 'não', 'não', 'não se aplica'),
    Jones: P('dimetilbutanona', '3,3-dimetilbutan-2-ona', 'Álcool 2° → cetona.', 'oxidação', 'não', 'não', 'não se aplica'),
    NaH: P('dimetilbutONa', 'alcóxido de sódio correspondente', 'Desprotonação do OH.', 'ácido-base', 'não', 'não', 'não se aplica'),
  },
};

/* ===================================================================
 * Síntese de Williamson
 * g: [nome do grupo, alcóxido, haleto, classe do carbono do haleto]
 * =================================================================== */
export const HALCLASS = {
  metil: ['ok', 'CH₃–X: SN2 rápida, sem H<sub>β</sub> (não há E2).'],
  '1°': ['ok', 'Haleto primário: SN2 favorecida; a E2 é minoritária.'],
  benzil: ['ok', 'Haleto benzílico: SN2 rápida e sem H<sub>β</sub> no carbono adjacente ao anel.'],
  '2°': ['warn', 'Haleto secundário: com alcóxido (base forte) a <b>E2 compete fortemente</b>; rendimento ruim do éter.'],
  '3°': ['bad', 'Haleto terciário: SN2 bloqueada → <b>E2</b> (forma alceno).'],
  aril: ['bad', 'Haleto de arila: C sp² do anel <b>não sofre SN2</b> (não há ataque pelo lado oposto).'],
};
export const WILL = {
  mtbe: { t: 'terc-butil metil éter (MTBE)', f: '(CH₃)₃C–O–CH₃', g: [['terc-butila', '(CH₃)₃CO⁻ Na⁺', '(CH₃)₃C–Br', '3°', 'metilpropeno'], ['metila', 'CH₃O⁻ Na⁺', 'CH₃–I', 'metil']] },
  etilIsopropilEter: { t: 'etil isopropil éter (2-etoxipropano)', f: '(CH₃)₂CH–O–CH₂CH₃', g: [['isopropila', '(CH₃)₂CHO⁻ Na⁺', '(CH₃)₂CH–Br', '2°', 'propeno'], ['etila', 'CH₃CH₂O⁻ Na⁺', 'CH₃CH₂–Br', '1°']] },
  anisol: { t: 'anisol (metoxibenzeno)', f: 'C₆H₅–O–CH₃', g: [['fenila', 'C₆H₅O⁻ Na⁺ (fenóxido)', 'C₆H₅–Br', 'aril'], ['metila', 'CH₃O⁻ Na⁺', 'CH₃–I', 'metil']] },
  benzilMetilEter: { t: 'benzil metil éter', f: 'C₆H₅CH₂–O–CH₃', g: [['benzila', 'C₆H₅CH₂O⁻ Na⁺', 'C₆H₅CH₂–Br', 'benzil'], ['metila', 'CH₃O⁻ Na⁺', 'CH₃–I', 'metil']] },
  eterDietilico: { t: 'éter dietílico (etoxietano)', f: 'CH₃CH₂–O–CH₂CH₃', g: [['etila', 'CH₃CH₂O⁻ Na⁺', 'CH₃CH₂–Br', '1°'], ['etila', 'CH₃CH₂O⁻ Na⁺', 'CH₃CH₂–Br', '1°']] },
  tamilEtilEter: { t: '2-etoxi-2-metilbutano', f: 'CH₃CH₂C(CH₃)₂–O–CH₂CH₃', g: [['terc-pentila', 'CH₃CH₂C(CH₃)₂O⁻ Na⁺', 'CH₃CH₂C(CH₃)₂–Br', '3°', '2-metilbut-2-eno (+ 2-metilbut-1-eno)'], ['etila', 'CH₃CH₂O⁻ Na⁺', 'CH₃CH₂–Br', '1°']] },
};

/* ===================================================================
 * Abertura do 2,2-dimetiloxirano
 * =================================================================== */
export const NUC = {
  OH: { t: 'OH⁻ (NaOH, H₂O)', kind: 'base', k: 'diolMetilpropano', n: '2-metilpropano-1,2-diol' },
  MeO: { t: 'CH₃O⁻ (CH₃ONa, CH₃OH)', kind: 'base', k: 'metoxiBasico', n: '1-metoxi-2-metilpropan-2-ol' },
  CN: { t: 'CN⁻ (NaCN)', kind: 'base', k: 'nitrilaEpox', n: '3-hidroxi-3-metilbutanonitrila' },
  RMgBr: { t: 'CH₃MgBr; depois H₃O⁺', kind: 'base', k: 'grignardEpox', n: '2-metilbutan-2-ol' },
  H2O: { t: 'H₂O (H₂SO₄ cat.)', kind: 'acid', k: 'diolMetilpropano', n: '2-metilpropano-1,2-diol' },
  MeOH: { t: 'CH₃OH (H₂SO₄ cat.)', kind: 'acid', k: 'metoxiAcido', n: '2-metoxi-2-metilpropan-1-ol' },
};
export function epoxOutcome(cond, nu) {
  const N = NUC[nu];
  if (cond === 'acid' && N.kind === 'base') return { bad: nu === 'CN' ? 'Em meio ácido o CN⁻ é protonado a HCN (tóxico e pouco nucleofílico): condição incompatível.' : nu === 'RMgBr' ? 'Reagentes de Grignard são destruídos por ácido (e por qualquer H ácido): CH₃MgBr + H⁺ → CH₄. Use condições básicas/anidras e só depois H₃O⁺.' : 'Um nucleófilo aniônico forte seria protonado em meio ácido. Use H₂O ou ROH como nucleófilo na catálise ácida.' };
  if (cond === 'base' && N.kind === 'acid') return { bad: 'Nucleófilo neutro e fraco sem ativação do epóxido: reação muito lenta. Use o ânion correspondente (OH⁻, CH₃O⁻) ou catálise ácida.' };
  return { k: N.k, n: N.n, at: cond === 'acid' ? 'C2' : 'C1' };
}

/* ===================================================================
 * Mapas de reações (centro → produto)
 * [produto, reagentes, detalhe, chave M p/ exemplo, legenda do exemplo]
 * =================================================================== */
export const MAP_ALC = [
  ['haleto de alquila', 'HX · PBr₃ · SOCl₂', 'HX: 3° SN1, 1° SN2 (ROH₂⁺). PBr₃/SOCl₂: SN2 (inversão), sem rearranjo; não use com 3°.', 'bromobutano1', 'butan-1-ol + PBr₃'],
  ['alceno', 'H₂SO₄ ou H₃PO₄, Δ', 'Desidratação: E1 (2°/3°), Zaitsev, rearranjos possíveis; 1° sem cátion livre.', 'dimetilbut2eno', '3,3-dimetilbutan-2-ol → 2,3-dimetilbut-2-eno'],
  ['aldeído', 'PCC (ou DMP, Swern)', 'Só álcoois 1°. Oxidantes anidros param no aldeído.', 'butanal', 'butan-1-ol + PCC'],
  ['cetona', 'PCC, Jones, DMP…', 'Álcoois 2°.', 'butanona', 'butan-2-ol → butanona'],
  ['ácido carboxílico', 'CrO₃/H₂SO₄/H₂O (Jones), KMnO₄', 'Álcoois 1° com oxidante forte em água.', 'acidoButanoico', 'butan-1-ol + Jones'],
  ['tosilato / mesilato', 'TsCl ou MsCl, piridina', 'C–O intacta (retenção); depois SN2 (inversão) ou E2.', 'butilOTs', 'tosilato de butila'],
  ['alcóxido', 'NaH, Na ou K', 'Ácido–base; H₂ sai. Alcóxidos: bases e nucleófilos.', 'butoxidoNa', 'butóxido de sódio'],
  ['éter', 'NaH; depois R′X (1°)', 'Williamson: SN2 do alcóxido sobre haleto metílico/1°.', 'metoxietano', 'etóxido + CH₃I → metoxietano'],
];
export const MAP_ETH = [
  ['álcool + haleto', 'HI ou HBr (1 equiv.)', 'Protonação do O; X⁻ ataca o carbono menos impedido (SN2) ou forma-se cátion 3° (SN1).', 'metoxietano', 'CH₃OCH₂CH₃ + HI → CH₃I + CH₃CH₂OH'],
  ['2 haletos', 'HI ou HBr (excesso), Δ', 'O álcool formado também é convertido em haleto.', 'iodometano', ''],
  ['fenol + CH₃I', 'HI (éter arílico)', 'C(sp²)–O do anel não sofre SN2: forma fenol, nunca haleto de arila.', 'fenol', 'anisol + HI → fenol + CH₃I'],
  ['⟵ Williamson', 'RO⁻ + R′X (R′ = metila/1°)', 'Síntese: escolha o lado em que o haleto é metílico ou primário.', 'eterDietilico', ''],
  ['⟵ alcoximercuração', '1. Hg(OAc)₂, ROH 2. NaBH₄', 'Éter Markovnikov a partir de alceno, sem rearranjo.', 'metoxipropano2', 'propeno → 2-metoxipropano'],
  ['peróxidos (cuidado!)', 'O₂, luz, armazenamento', 'Éteres como Et₂O e THF formam peróxidos explosivos com o tempo.', 'thf', ''],
];
export const MAP_EPOX = [
  ['diol vicinal (anti)', 'H₂O, H₃O⁺ ou OH⁻', 'Ácido: ataque no C mais substituído; básico: no menos substituído. Anti (inversão no C atacado).', 'transDiolCiclohexano', 'óxido de ciclo-hexeno → trans-diol'],
  ['éter-álcool (ácido)', 'ROH, H⁺', 'Nu no carbono <b>mais substituído</b>.', 'metoxiAcido', '2,2-dimetiloxirano + CH₃OH/H⁺'],
  ['éter-álcool (básico)', 'RO⁻', 'Nu no carbono <b>menos substituído</b> (SN2).', 'metoxiBasico', '2,2-dimetiloxirano + CH₃O⁻'],
  ['β-hidroxinitrila', 'CN⁻', 'SN2 no C menos impedido; nova ligação C–C.', 'nitrilaEpox', ''],
  ['β-azidoálcool', 'N₃⁻', 'SN2 no C menos impedido.', 'azidaEpox', ''],
  ['β-aminoálcool', 'NH₃ ou RNH₂', 'SN2 no C menos impedido.', 'aminaEpox', ''],
  ['álcool (C–C nova)', 'RMgX ou RLi; H₃O⁺', 'O carbono nucleofílico ataca o C menos impedido: cadeia aumenta 2 C (óxido de etileno).', 'butanolDeOxirano', 'EtMgBr + óxido de etileno → butan-1-ol'],
  ['⟵ mCPBA (de alceno)', 'RCO₃H', 'Epoxidação concertada: geometria do alceno mantida.', 'cisDimetiloxirano', ''],
  ['⟵ haloidrina + base', 'NaOH', 'SN2 intramolecular: O⁻ desloca X⁻ pelo lado oposto (anti).', 'dimetiloxirano22', ''],
];

/* ===================================================================
 * Desafio "Qual é o produto?" (substrato, condição, produto, distratores, nível)
 * =================================================================== */
export const CHALLENGE = [
  // nível 1
  { l: 1, s: 'butan1ol', c: 'PBr₃', p: 'bromobutano1', o: ['bromobutano2', 'but1eno', 'butanal'], x: 'SN2 no O ativado.' },
  { l: 1, s: 'butan2ol', c: 'PCC', p: 'butanona', o: ['butanal', 'acidoButanoico', 'but2enoE'], x: 'Álcool 2° → cetona.' },
  { l: 1, s: 'butan1ol', c: 'PCC', p: 'butanal', o: ['acidoButanoico', 'butanona', 'bromobutano1'], x: 'PCC para no aldeído.' },
  { l: 1, s: 'butan1ol', c: 'Jones (CrO₃, H₂SO₄, H₂O)', p: 'acidoButanoico', o: ['butanal', 'butanona', 'but1eno'], x: 'Oxidação até ácido.' },
  { l: 1, s: 'tbutanol', c: 'HCl', p: 'tbucl', o: ['metilpropeno', 'clorobutano1', 'tbubr'], x: 'SN1 via cátion 3°.' },
  { l: 1, s: 'etanol', c: 'NaH', p: 'etoxido', o: ['eterDietilico', 'etanol', 'metoxietano'], x: 'Desprotonação: etóxido (+ H₂).' },
  { l: 1, s: 'oxirano', c: '1. CH₃CH₂MgBr 2. H₃O⁺', p: 'butanolDeOxirano', o: ['butan2ol', 'etilenoglicol', 'propan1ol'], x: 'Grignard ataca o CH₂; a cadeia cresce 2 C.' },
  // nível 2
  { l: 2, s: 'butan2olR', c: 'PBr₃', p: 'bromobutano2S', o: ['bromobutano2', 'but2enoE', 'butanona'], x: 'SN2 → inversão: (S)-2-bromobutano.' },
  { l: 2, s: 'tbutanol', c: 'H₂SO₄, Δ', p: 'metilpropeno', o: ['tbuOTs', 'mtbe', 'tbubr'], x: 'E1.' },
  { l: 2, s: 'dimetiloxirano22', c: 'CH₃O⁻ / CH₃OH', p: 'metoxiBasico', o: ['metoxiAcido', 'diolMetilpropano', 'mtbe'], x: 'Básico: ataque no CH₂.' },
  { l: 2, s: 'dimetiloxirano22', c: 'CH₃OH, H₂SO₄ (cat.)', p: 'metoxiAcido', o: ['metoxiBasico', 'diolMetilpropano', 'tbutanol'], x: 'Ácido: ataque no C terciário.' },
  { l: 2, s: 'metoxietano', c: 'HI (1 equiv.)', p: 'iodometano', o: ['etanol', 'eterDimetilico', 'metanol'], x: 'I⁻ ataca o CH₃ (menos impedido); forma CH₃I + etanol.' },
  { l: 2, s: 'butan2olR', c: 'TsCl, piridina', p: 'butan2ilOTsR', o: ['bromobutano2S', 'butanona', 'sec_butoxidoNa'], x: 'Retenção (C–O intacta).' },
  // nível 3
  { l: 3, s: 'dimetilbutan2ol', c: 'HBr', p: 'bromoDimetilbutano23', o: ['bromoDimetilbutano22', 'dimetilbut2eno', 'dimetilbutanona'], x: 'Migração de metila → cátion 3°.' },
  { l: 3, s: 'dimetilbutan2ol', c: 'H₂SO₄, Δ', p: 'dimetilbut2eno', o: ['metilbut1eno3', 'bromoDimetilbutano23', 'dimetilbutanona'], x: 'Rearranjo + Zaitsev.' },
  { l: 3, s: 'oxidoCiclohexeno', c: 'CH₃O⁻ / CH₃OH', p: 'transMetoxiCiclohexanol', o: ['transDiolCiclohexano', 'ciclohexanol', 'ciclohexanona'], x: 'Ataque anti: trans-2-metoxiciclo-hexan-1-ol (racêmico).' },
  { l: 3, s: 'cisDimetiloxirano', c: 'H₂O, H₃O⁺', p: 'butanodiolRR', o: ['butano13diol', 'butan2ol', 'butanona'], x: 'Abertura anti do epóxido meso → (2R,3R)/(2S,3S)-butano-2,3-diol (racêmico; um enantiômero desenhado).' },
  { l: 3, s: 'bromohidrina', c: 'NaOH', p: 'dimetiloxirano22', o: ['diolMetilpropano', 'metilpropeno', 'tbutanol'], x: 'SN2 intramolecular → epóxido.' },
];
