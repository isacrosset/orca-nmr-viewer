/*
 * rxn.js — base de reações: substratos, reagentes e produtos (com propriedades
 * mecanísticas) usada pelo simulador, comparador, tabelas, mapas e desafio.
 */

export const SUBS = {
  propeno: { t: 'propeno', kind: 'alceno', d: 'alceno monossubstituído (assimétrico)' },
  metilciclohexeno: { t: '1-metilciclo-hexeno', kind: 'alceno', d: 'alceno trissubstituído cíclico' },
  metilbut1eno3: { t: '3-metilbut-1-eno', kind: 'alceno', d: 'monossubstituído; pode rearranjar via carbocátion' },
  ciclohexeno: { t: 'ciclo-hexeno', kind: 'alceno', d: 'cicloalceno simétrico' },
  propino: { t: 'propino', kind: 'alcino', d: 'alcino terminal' },
  but2ino: { t: 'but-2-ino', kind: 'alcino', d: 'alcino interno simétrico' },
};

export const REAG = {
  H2Pd: { t: 'H₂, Pd/C', kind: 'ambos', tr: 'hidrogenação', regio: 'não se aplica', stereo: 'syn', inter: 'superfície metálica (H adsorvido)', cation: false, rearr: 'não', sec: 'hidrogenacao' },
  Br2: { t: 'Br₂ (CH₂Cl₂)', kind: 'ambos', tr: 'halogenação', regio: 'não se aplica', stereo: 'anti', inter: 'íon bromônio (halônio)', cation: false, rearr: 'não', sec: 'halogenacao' },
  HBr: { t: 'HBr', kind: 'ambos', tr: 'hidro-halogenação', regio: 'Markovnikov', stereo: 'não específica', inter: 'carbocátion', cation: true, rearr: 'possível', sec: 'hidrohalogenacao' },
  H3O: { t: 'H₂O, H₂SO₄ (cat.)', kind: 'alceno', tr: 'hidratação ácida', regio: 'Markovnikov', stereo: 'não específica', inter: 'carbocátion', cation: true, rearr: 'possível', sec: 'hidratacao' },
  OxyM: { t: '1. Hg(OAc)₂, H₂O  2. NaBH₄', kind: 'alceno', tr: 'oximercuração-desmercuração', regio: 'Markovnikov', stereo: 'anti (Hg/OH); global não específica', inter: 'íon mercurínio', cation: false, rearr: 'evitado', sec: 'oximercuracao' },
  HB: { t: '1. BH₃·THF  2. H₂O₂, NaOH', kind: 'alceno', tr: 'hidroboração-oxidação', regio: 'anti-Markovnikov', stereo: 'syn', inter: 'ET concertado de 4 centros', cation: false, rearr: 'não', sec: 'hidroboracao' },
  mCPBA: { t: 'mCPBA', kind: 'alceno', tr: 'epoxidação', regio: 'não se aplica', stereo: 'syn (geometria mantida)', inter: 'concertado ("borboleta")', cation: false, rearr: 'não', sec: 'epoxidacao' },
  OsO4: { t: '1. OsO₄  2. NaHSO₃, H₂O', kind: 'alceno', tr: 'di-hidroxilação', regio: 'não se aplica', stereo: 'syn', inter: 'éster ósmico cíclico', cation: false, rearr: 'não', sec: 'dihidroxilacao' },
  O3: { t: '1. O₃  2. (CH₃)₂S', kind: 'ambos', tr: 'ozonólise redutiva', regio: 'não se aplica', stereo: 'não se aplica', inter: 'molozonídeo → ozonídeo', cation: false, rearr: 'não', sec: 'ozonolise' },
  Br2H2O: { t: 'Br₂, H₂O', kind: 'alceno', tr: 'formação de haloidrina', regio: 'OH no C mais substituído', stereo: 'anti', inter: 'íon bromônio', cation: false, rearr: 'não', sec: 'haloidrina' },
  KMnO4: { t: 'KMnO₄, H₃O⁺, Δ', kind: 'ambos', tr: 'clivagem oxidativa', regio: 'não se aplica', stereo: 'não se aplica', inter: '—', cation: false, rearr: 'não', sec: 'permanganato' },
  Lindlar: { t: 'H₂, Pd-Lindlar', kind: 'alcino', tr: 'hidrogenação parcial', regio: 'não se aplica', stereo: 'syn → alceno cis (Z)', inter: 'superfície metálica (envenenada)', cation: false, rearr: 'não', sec: 'lindlar' },
  NaNH3: { t: 'Na, NH₃(l)', kind: 'alcino', tr: 'redução por metal dissolvido', regio: 'não se aplica', stereo: 'anti → alceno trans (E)', inter: 'radical-ânion / ânion vinílico', cation: false, rearr: 'não', sec: 'nanh3' },
  HgSO4: { t: 'HgSO₄, H₂SO₄, H₂O', kind: 'alcino', tr: 'hidratação de alcino', regio: 'Markovnikov', stereo: 'não se aplica', inter: 'enol → tautomerização', cation: false, rearr: 'não', sec: 'hidratacao-alcino' },
  R2BH: { t: '1. (Sia)₂BH  2. H₂O₂, NaOH', kind: 'alcino', tr: 'hidroboração-oxidação de alcino', regio: 'anti-Markovnikov', stereo: 'syn (na etapa de hidroboração)', inter: 'enol → tautomerização', cation: false, rearr: 'não', sec: 'hidroboracao-alcino' },
  HBr2: { t: 'HBr (2 equiv.)', kind: 'alcino', tr: 'dupla hidro-halogenação', regio: 'Markovnikov (di-haleto geminal)', stereo: 'não se aplica', inter: 'cátions (vinílico, depois alquílico)', cation: true, rearr: 'não', sec: 'hx-alcino' },
  Br2x: { t: 'Br₂ (2 equiv.)', kind: 'alcino', tr: 'halogenação exaustiva', regio: 'não se aplica', stereo: '1ª adição anti', inter: 'halônio', cation: false, rearr: 'não', sec: 'halogenacao-alcino' },
  NaNH2: { t: 'NaNH₂', kind: 'alcino', tr: 'desprotonação (acetileto)', regio: 'não se aplica', stereo: 'não se aplica', inter: 'ânion acetileto', cation: false, rearr: 'não', sec: 'acetileto' },
};

/* produto: k = chave(s) em M; n = nome; x = observação */
const P = (k, n, x) => ({ k, n, x });
export const PR = {
  propeno: {
    H2Pd: P('propano', 'propano'),
    Br2: P('dibromopropano12', '1,2-dibromopropano', 'Di-haleto vicinal formado via bromônio (adição anti).'),
    HBr: P('bromopropano2', '2-bromopropano', 'O H entra no CH₂ terminal, gerando o carbocátion secundário; Br⁻ ataca o C2.'),
    H3O: P('propanol2', 'propan-2-ol', 'Markovnikov: OH no carbono mais substituído.'),
    OxyM: P('propanol2', 'propan-2-ol', 'Markovnikov, via íon mercurínio.'),
    HB: P('propanol1', 'propan-1-ol', 'Anti-Markovnikov: o B (depois OH) vai para o carbono menos impedido.'),
    R2BH: P('propanol1', 'propan-1-ol', 'Boranas volumosas também fazem hidroboração anti-Markovnikov de alcenos.'),
    mCPBA: P('oxidoPropeno', '2-metiloxirano (óxido de propileno)'),
    OsO4: P('propanodiol', 'propano-1,2-diol'),
    O3: P(['etanal', 'metanal'], 'etanal + metanal'),
    Br2H2O: P('bromopropanol', '1-bromopropan-2-ol', 'A água ataca o carbono mais substituído do bromônio.'),
    KMnO4: P(['acidoAcetico', 'co2'], 'ácido acético + CO₂', 'O CH₂= terminal é oxidado até CO₂.'),
    HBr2: P('bromopropano2', '2-bromopropano', 'O alceno tem só uma ligação π: o 2º equivalente de HBr não reage.'),
    Br2x: P('dibromopropano12', '1,2-dibromopropano', 'Só uma ligação π para reagir.'),
  },
  metilciclohexeno: {
    H2Pd: P('metilciclohexano', 'metilciclo-hexano'),
    Br2: P('transDibromoMetil', 'trans-1,2-dibromo-1-metilciclo-hexano (racêmico)', 'Os dois Br ficam em faces opostas do anel.'),
    HBr: P('bromometilciclohexano1', '1-bromo-1-metilciclo-hexano', 'Protonação gera o carbocátion terciário.'),
    H3O: P('metilciclohexanol1', '1-metilciclo-hexan-1-ol'),
    OxyM: P('metilciclohexanol1', '1-metilciclo-hexan-1-ol'),
    HB: P('transMetilciclohexanol2', 'trans-2-metilciclo-hexan-1-ol (racêmico)', 'H e OH entram pela mesma face (syn); por isso CH₃ e OH ficam trans.'),
    R2BH: P('transMetilciclohexanol2', 'trans-2-metilciclo-hexan-1-ol (racêmico)'),
    mCPBA: P('oxidoMetilciclohexeno', '1-metil-7-oxabiciclo[4.1.0]heptano (epóxido)'),
    OsO4: P('cisDiolMetil', 'cis-1-metilciclo-hexano-1,2-diol (racêmico)', 'Os dois OH na mesma face (syn).'),
    O3: P('oxoheptanal', '6-oxo-heptanal', 'Ciclo + ozonólise = uma única cadeia com duas carbonilas.'),
    Br2H2O: P('transBromoMetilciclohexanol', 'trans-2-bromo-1-metilciclo-hexan-1-ol', 'OH no carbono terciário; Br e OH anti.'),
    KMnO4: P('oxoheptanoico', 'ácido 6-oxo-heptanoico'),
    HBr2: P('bromometilciclohexano1', '1-bromo-1-metilciclo-hexano'),
    Br2x: P('transDibromoMetil', 'trans-1,2-dibromo-1-metilciclo-hexano'),
  },
  metilbut1eno3: {
    H2Pd: P('metilbutano2', '2-metilbutano'),
    Br2: P('dibromoMetilbutano', '1,2-dibromo-3-metilbutano', 'Sem carbocátion livre: sem rearranjo.'),
    HBr: P('bromometilbutano2', '2-bromo-2-metilbutano (principal, rearranjado)', 'O carbocátion 2° sofre deslocamento 1,2 de hidreto → 3°. O 2-bromo-3-metilbutano (não rearranjado) é minoritário.'),
    H3O: P('metilbutanol2', '2-metilbutan-2-ol (rearranjado)', 'Carbocátion → migração de hidreto → álcool terciário.'),
    OxyM: P('metilbutanol3', '3-metilbutan-2-ol', 'Markovnikov SEM rearranjo: não há carbocátion livre.'),
    HB: P('metilbutanol1', '3-metilbutan-1-ol', 'Anti-Markovnikov, sem rearranjo.'),
    R2BH: P('metilbutanol1', '3-metilbutan-1-ol'),
    mCPBA: P('isopropiloxirano', '2-(propan-2-il)oxirano'),
    OsO4: P('metilbutanodiol', '3-metilbutano-1,2-diol'),
    O3: P(['metilpropanal', 'metanal'], '2-metilpropanal + metanal'),
    Br2H2O: P('bromoMetilbutanol', '1-bromo-3-metilbutan-2-ol'),
    KMnO4: P(null, 'ácido 2-metilpropanoico + CO₂'),
    HBr2: P('bromometilbutano2', '2-bromo-2-metilbutano'),
    Br2x: P('dibromoMetilbutano', '1,2-dibromo-3-metilbutano'),
  },
  ciclohexeno: {
    H2Pd: P('ciclohexano', 'ciclo-hexano'),
    Br2: P('transDibromociclohexano', 'trans-1,2-dibromociclo-hexano (racêmico)'),
    HBr: P('bromociclohexano', 'bromociclo-hexano'),
    H3O: P('ciclohexanol', 'ciclo-hexanol'),
    OxyM: P('ciclohexanol', 'ciclo-hexanol'),
    HB: P('ciclohexanol', 'ciclo-hexanol', 'Alceno simétrico: regioquímica não importa aqui.'),
    R2BH: P('ciclohexanol', 'ciclo-hexanol'),
    mCPBA: P('oxidoCiclohexeno', '7-oxabiciclo[4.1.0]heptano (óxido de ciclo-hexeno)'),
    OsO4: P('cisDiolCiclohexano', 'cis-ciclo-hexano-1,2-diol (meso)'),
    O3: P('hexanodial', 'hexanodial'),
    Br2H2O: P('transBromociclohexanol', 'trans-2-bromociclo-hexan-1-ol (racêmico)'),
    KMnO4: P('acidoHexanodioico', 'ácido hexanodioico (ácido adípico)'),
    HBr2: P('bromociclohexano', 'bromociclo-hexano'),
    Br2x: P('transDibromociclohexano', 'trans-1,2-dibromociclo-hexano'),
  },
  propino: {
    H2Pd: P('propano', 'propano', 'Excesso de H₂: as duas ligações π são reduzidas.'),
    Lindlar: P('propeno', 'propeno', 'Para alcinos terminais não há isômero cis/trans.'),
    NaNH3: P('propeno', 'propeno', 'Na prática usa-se Na/NH₃ com alcinos internos (alcinos terminais são desprotonados pelo NaNH₂ formado).'),
    HBr: P('bromopropeno2', '2-bromopropeno (haleto vinílico)', '1 equiv.: Markovnikov.'),
    HBr2: P('dibromopropano22', '2,2-dibromopropano (di-haleto geminal)', '2 equiv.: os dois Br no mesmo carbono.'),
    Br2: P('dibromopropenoE', '(E)-1,2-dibromopropeno', '1 equiv.: adição anti.'),
    Br2x: P('tetrabromopropano', '1,1,2,2-tetrabromopropano'),
    HgSO4: P('propanona', 'propanona (acetona)', 'Enol → cetona: alcino terminal dá metilcetona.'),
    R2BH: P('propanal', 'propanal', 'Enol anti-Markovnikov → aldeído.'),
    HB: P('propanal', 'propanal', 'Para alcinos terminais prefere-se borana volumosa ((Sia)₂BH, 9-BBN) para parar após uma adição.'),
    H3O: P('propanona', 'propanona', 'Sem Hg²⁺ a hidratação de alcinos é lenta; com catalisador dá a metilcetona.'),
    KMnO4: P(['acidoAcetico', 'co2'], 'ácido acético + CO₂'),
    NaNH2: P('propilAcetileto', 'propineto de sódio (acetileto)', 'Ácido-base: pKa ≈ 25 (alcino) < 38 (NH₃).'),
  },
  but2ino: {
    H2Pd: P('butano', 'butano'),
    Lindlar: P('but2enoZ', '(Z)-but-2-eno (cis)', 'Adição syn de H₂ na superfície envenenada.'),
    NaNH3: P('but2enoE', '(E)-but-2-eno (trans)', 'Adição anti global (radical-ânion → ânion vinílico trans).'),
    HBr: P('bromobut2eno', '2-bromobut-2-eno (mistura E/Z)'),
    HBr2: P('dibromobutano22', '2,2-dibromobutano'),
    Br2: P('dibromobutenoE', '(E)-2,3-dibromobut-2-eno', 'Adição anti.'),
    Br2x: P('tetrabromobutano', '2,2,3,3-tetrabromobutano'),
    HgSO4: P('butanona', 'butanona'),
    R2BH: P('butanona', 'butanona', 'Alcino interno simétrico: os dois carbonos são equivalentes, ambos os métodos dão a mesma cetona.'),
    HB: P('butanona', 'butanona'),
    H3O: P('butanona', 'butanona'),
    KMnO4: P('acidoAcetico', '2 ácido acético'),
    NaNH2: P(null, 'sem reação', 'Não há H terminal (≡C–H) para remover.'),
  },
};

/** reagente inadequado para o substrato */
export function product(sub, reag) {
  const p = PR[sub] && PR[sub][reag];
  if (p) return p;
  const k = SUBS[sub].kind;
  if (k === 'alceno' && (reag === 'Lindlar')) return P(null, 'praticamente sem reação', 'O catalisador de Lindlar é "envenenado" justamente para não reduzir alcenos.');
  if (k === 'alceno' && reag === 'NaNH3') return P(null, 'sem reação', 'Na/NH₃ reduz alcinos, não alcenos isolados.');
  if (k === 'alceno' && reag === 'NaNH2') return P(null, 'sem reação', 'O H vinílico (pKa ≈ 44) não é removido por NH₂⁻ (pKa do NH₃ ≈ 38).');
  if (k === 'alceno' && reag === 'HgSO4') return P(null, 'use H₃O⁺ ou oximercuração', 'HgSO₄/H₂SO₄ é a condição típica para alcinos.');
  if (k === 'alcino' && ['mCPBA', 'OsO4', 'Br2H2O', 'OxyM'].includes(reag)) return P(null, 'não abordado em Química Orgânica I', 'Essas condições são usadas, neste curso, com alcenos.');
  return P(null, 'sem reação útil');
}

/* mapas de reações */
export const MAP_ALKENE = [
  ['alcano', 'H₂, Pd/Pt/Ni', 'H2Pd', 'syn; sem regioquímica'],
  ['haloalcano', 'HX', 'HBr', 'Markovnikov; via carbocátion; rearranjos possíveis'],
  ['álcool (Markovnikov)', 'H₃O⁺ ou Hg(OAc)₂/H₂O; NaBH₄', 'OxyM', 'Markovnikov; oximercuração evita rearranjo'],
  ['álcool (anti-Markovnikov)', 'BH₃; H₂O₂/OH⁻', 'HB', 'anti-Markovnikov; syn; concertado'],
  ['di-haleto vicinal', 'Br₂ ou Cl₂', 'Br2', 'anti; via halônio'],
  ['haloidrina', 'Br₂, H₂O', 'Br2H2O', 'anti; OH no C mais substituído'],
  ['epóxido', 'mCPBA', 'mCPBA', 'syn; concertado'],
  ['diol vicinal', 'OsO₄ ou KMnO₄ diluído/frio', 'OsO4', 'syn'],
  ['carbonilas', 'O₃; (CH₃)₂S', 'O3', 'clivagem da C=C'],
  ['ácidos/cetonas', 'KMnO₄ quente', 'KMnO4', 'clivagem oxidativa'],
  ['polímero', 'iniciador', null, 'adição em cadeia'],
];
export const MAP_ALKYNE = [
  ['alcano', 'H₂ (excesso), Pd/Pt/Ni', 'H2Pd', 'redução das duas π'],
  ['alceno cis (Z)', 'H₂, Lindlar', 'Lindlar', 'syn'],
  ['alceno trans (E)', 'Na, NH₃(l)', 'NaNH3', 'anti global'],
  ['haleto vinílico', 'HX (1 equiv.)', 'HBr', 'Markovnikov'],
  ['di-haleto geminal', 'HX (2 equiv.)', 'HBr2', 'Markovnikov ×2'],
  ['di-haloalceno / tetra-haleto', 'X₂ (1 ou 2 equiv.)', 'Br2', 'anti'],
  ['cetona', 'HgSO₄, H₂SO₄, H₂O', 'HgSO4', 'Markovnikov; enol → cetona'],
  ['aldeído', '(Sia)₂BH; H₂O₂/OH⁻', 'R2BH', 'anti-Markovnikov; enol → aldeído'],
  ['ácidos / CO₂', 'O₃ ou KMnO₄', 'KMnO4', 'clivagem oxidativa'],
  ['acetileto', 'NaNH₂', 'NaNH2', 'ácido-base (alcinos terminais)'],
  ['alcino interno (alquilação)', 'NaNH₂; R–X (1°)', 'NaNH2', 'SN2: C–C nova'],
];
