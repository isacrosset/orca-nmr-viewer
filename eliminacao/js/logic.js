/*
 * logic.js — motor qualitativo de previsão SN1 / SN2 / E1 / E2.
 * Heurísticas didáticas: os níveis são tendências, não valores absolutos.
 */

export const LEVELS = ['muito improvável', 'pouco provável', 'possível', 'provável', 'muito provável'];
export const MECHS = ['sn1', 'sn2', 'e1', 'e2'];
export const MNAME = { sn1: 'SN1', sn2: 'SN2', e1: 'E1', e2: 'E2' };

export const CLASSES = {
  metil: { t: 'metílico', beta: false },
  prim: { t: 'primário', beta: true },
  sec: { t: 'secundário', beta: true },
  ter: { t: 'terciário', beta: true },
  benz: { t: 'benzílico (1°)', beta: false },
  alil: { t: 'alílico (1°)', beta: false },
};
export const RCATS = {
  nuc: { t: 'nucleófilo forte / base fraca', ex: 'I⁻, N₃⁻, CN⁻, RS⁻' },
  strong: { t: 'nucleófilo forte / base forte', ex: 'HO⁻, CH₃O⁻, CH₃CH₂O⁻' },
  bulky: { t: 'base forte e volumosa', ex: '(CH₃)₃CO⁻, DBU' },
  weak: { t: 'nucleófilo e base fracos', ex: 'H₂O, CH₃OH, CH₃CH₂OH' },
};

/** cls, rcat, protic (bool), temp ('baixa'|'moderada'|'alta') → { s:{sn1..e2}, why:[...] } */
export function score(cls, rcat, protic, temp) {
  const s = { sn1: 0, sn2: 0, e1: 0, e2: 0 };
  const why = [];
  const T = temp === 'alta' ? 1 : temp === 'baixa' ? -1 : 0;
  const C = CLASSES[cls];
  if (cls === 'metil') {
    s.sn2 = rcat === 'weak' ? 1 : rcat === 'bulky' ? 3 : 4;
    why.push('Substrato metílico: não há carbono β, portanto <b>não há eliminação</b> (nem E1 nem E2).');
    why.push('CH₃⁺ é instável demais: <b>SN1 não ocorre</b>.');
    if (rcat === 'weak') why.push('Com nucleófilo fraco, a SN2 é muito lenta.');
  } else if (cls === 'benz' || cls === 'alil') {
    why.push(cls === 'benz' ? 'Brometo de benzila: o carbono vizinho é aromático e não tem H — <b>não há Hβ</b> para eliminação.' : 'Brometo de alila: o único carbono β é sp² (=CH–); a eliminação formaria um aleno, desfavorável. Considere eliminação desprezível.');
    if (rcat === 'weak') { s.sn1 = protic ? 3 : 1; s.sn2 = 1; why.push('Carbocátion primário mas <b>estabilizado por ressonância</b>: com solvente prótico e nucleófilo fraco, a SN1 é viável.'); }
    else { s.sn2 = rcat === 'bulky' ? 2 : 4; s.sn1 = protic && rcat === 'nuc' ? 1 : 0; why.push('Carbono primário desimpedido + nucleófilo forte → <b>SN2</b> rápida.'); }
  } else if (cls === 'prim') {
    if (rcat === 'nuc') { s.sn2 = 4; why.push('Primário + bom nucleófilo pouco básico → <b>SN2</b>.'); }
    if (rcat === 'strong') { s.sn2 = 4; s.e2 = 1; why.push('Primário + base forte não volumosa: a <b>SN2</b> geralmente predomina; E2 é minoritária (aumenta com aquecimento).'); }
    if (rcat === 'bulky') { s.e2 = 4; s.sn2 = 1; why.push('Base volumosa tem dificuldade de atacar o carbono (SN2), mas remove facilmente um Hβ periférico → <b>E2</b>.'); }
    if (rcat === 'weak') { s.sn2 = 1; why.push('Carbocátion primário é muito instável: SN1/E1 praticamente não ocorrem; com nucleófilo fraco tudo é muito lento.'); }
  } else if (cls === 'sec') {
    if (rcat === 'nuc') { s.sn2 = protic ? 3 : 4; s.e2 = 1; s.sn1 = protic ? 1 : 0; why.push('Secundário + nucleófilo forte e pouco básico → <b>SN2</b> favorecida (sobretudo em solvente polar aprótico).'); }
    if (rcat === 'strong') { s.e2 = 4; s.sn2 = T > 0 ? 1 : 2; why.push('Secundário + base forte (HO⁻, RO⁻) → <b>E2</b> geralmente predomina, com SN2 competindo.'); }
    if (rcat === 'bulky') { s.e2 = 4; why.push('Base forte e volumosa → <b>E2</b>; a SN2 fica muito desfavorecida.'); }
    if (rcat === 'weak') {
      if (protic) { s.sn1 = 2; s.e1 = T > 0 ? 3 : T < 0 ? 1 : 2; why.push('Secundário + nucleófilo/base fracos em solvente prótico: reações <b>lentas</b> via carbocátion (SN1/E1), com possibilidade de rearranjo.'); }
      else { s.sn1 = 1; s.e1 = 1; why.push('Sem solvente prótico para estabilizar o carbocátion, e sem nucleófilo/base fortes: reação muito lenta.'); }
    }
  } else if (cls === 'ter') {
    why.push('Terciário: o carbono α está muito impedido — <b>SN2 é fortemente desfavorecida</b>.');
    if (rcat === 'strong' || rcat === 'bulky') { s.e2 = 4; why.push('Base forte presente → <b>E2</b> (não é preciso esperar a formação do carbocátion).'); }
    if (rcat === 'nuc') {
      if (protic) { s.sn1 = 3; s.e1 = T > 0 ? 2 : 1; s.e2 = 1; why.push('Nucleófilo pouco básico em solvente prótico → carbocátion → <b>SN1</b>, com E1 competindo.'); }
      else { s.sn1 = 1; s.e1 = 1; s.e2 = 2; why.push('Em solvente aprótico o carbocátion forma-se com dificuldade; ânions com alguma basicidade (ex.: CN⁻) podem levar a E2.'); }
    }
    if (rcat === 'weak') {
      if (protic) { s.sn1 = T > 0 ? 2 : 3; s.e1 = T > 0 ? 3 : T < 0 ? 1 : 2; why.push('Solvente prótico + nucleófilo/base fracos → carbocátion terciário: <b>SN1 e E1 competem</b>.'); }
      else { s.sn1 = 1; s.e1 = 1; why.push('Sem solvente prótico, a ionização é lenta.'); }
    }
  }
  // temperatura
  if (C.beta) {
    if (T > 0) why.push('<b>Temperatura alta</b> favorece eliminação (a eliminação forma mais partículas, ΔS mais positivo; o termo −TΔS pesa mais).');
    if (T < 0 && (s.e1 || s.e2)) { why.push('<b>Temperatura baixa</b> tende a favorecer a substituição em relação à eliminação.'); }
    if (T > 0 && s.e2 && s.e2 < 4 && rcat !== 'weak') s.e2 += 1;
  }
  if (!protic && (s.sn1 || s.e1)) why.push('Solvente aprótico estabiliza mal carbocátions: SN1/E1 ficam mais lentas.');
  if (!protic && s.sn2 >= 3) why.push('Solvente polar aprótico deixa o nucleófilo aniônico mais "livre": favorece SN2.');
  if (protic && s.sn2 >= 3 && rcat !== 'weak') why.push('Solvente prótico solvata o nucleófilo aniônico e reduz um pouco sua reatividade (a SN2 ainda ocorre).');
  MECHS.forEach((k) => { s[k] = Math.max(0, Math.min(4, s[k])); });
  return { s, why };
}

export function ranked(s) {
  return MECHS.slice().sort((a, b) => s[b] - s[a]);
}
export function competition(s) {
  const r = ranked(s);
  return s[r[0]] >= 2 && s[r[1]] >= s[r[0]] - 1 && s[r[1]] >= 2;
}

/* ===================================================================
 * Substratos e reagentes concretos ("Monte a reação")
 * =================================================================== */
export const SUBS = {
  bromometano: { t: 'bromometano (CH₃Br)', cls: 'metil', prod: { OH: 'metanol', OR: 'metoxietano', CN: 'etanonitrila (acetonitrila)', N3: 'azidometano', I: 'iodometano', OtBu: '2-metoxi-2-metilpropano' } },
  bromobutano1: { t: '1-bromobutano', cls: 'prim', prod: { OH: 'butan-1-ol', OR: '1-etoxibutano', CN: 'pentanonitrila', N3: '1-azidobutano', I: '1-iodobutano', OtBu: '1-(terc-butoxi)butano' }, zai: 'but-1-eno', hof: 'but-1-eno' },
  bromobutano2: { t: '2-bromobutano', cls: 'sec', prod: { OH: 'butan-2-ol', OR: '2-etoxibutano', CN: '2-metilbutanonitrila', N3: '2-azidobutano', I: '2-iodobutano', OtBu: '2-(terc-butoxi)butano' }, zai: 'but-2-eno (E > Z)', hof: 'but-1-eno' },
  bromopentano2: { t: '2-bromopentano', cls: 'sec', prod: { OH: 'pentan-2-ol', OR: '2-etoxipentano', CN: '2-metilpentanonitrila', N3: '2-azidopentano', I: '2-iodopentano', OtBu: '2-(terc-butoxi)pentano' }, zai: 'pent-2-eno (E > Z)', hof: 'pent-1-eno' },
  bromometilbutano: { t: '2-bromo-2-metilbutano', cls: 'ter', prod: { OH: '2-metilbutan-2-ol', OR: '2-etoxi-2-metilbutano', CN: '2,2-dimetilbutanonitrila', N3: '2-azido-2-metilbutano', I: '2-iodo-2-metilbutano', OtBu: '—' }, zai: '2-metilbut-2-eno', hof: '2-metilbut-1-eno' },
  tbutil: { t: '2-bromo-2-metilpropano (brometo de terc-butila)', cls: 'ter', prod: { OH: '2-metilpropan-2-ol', OR: '2-etoxi-2-metilpropano', CN: '2,2-dimetilpropanonitrila', N3: '2-azido-2-metilpropano', I: '2-iodo-2-metilpropano', OtBu: '—' }, zai: '2-metilpropeno', hof: '2-metilpropeno' },
  metilciclohexil: { t: '1-bromo-1-metilciclo-hexano', cls: 'ter', prod: { OH: '1-metilciclo-hexan-1-ol', OR: '1-etoxi-1-metilciclo-hexano', CN: '1-metilciclo-hexano-1-carbonitrila', N3: '1-azido-1-metilciclo-hexano', I: '1-iodo-1-metilciclo-hexano', OtBu: '—' }, zai: '1-metilciclo-hexeno', hof: 'metilideneciclo-hexano' },
  benzyl: { t: 'brometo de benzila (PhCH₂Br)', cls: 'benz', prod: { OH: 'fenilmetanol (álcool benzílico)', OR: '(etoximetil)benzeno', CN: '2-fenilacetonitrila', N3: '(azidometil)benzeno', I: '(iodometil)benzeno', OtBu: '(terc-butoximetil)benzeno' } },
  allyl: { t: '3-bromoprop-1-eno (brometo de alila)', cls: 'alil', prod: { OH: 'prop-2-en-1-ol', OR: '3-etoxiprop-1-eno', CN: 'but-3-enonitrila', N3: '3-azidoprop-1-eno', I: '3-iodoprop-1-eno', OtBu: '3-(terc-butoxi)prop-1-eno' } },
};
export const REAGS = {
  OH: { t: 'HO⁻ (NaOH)', cat: 'strong', nu: 'OH', nucl: 'forte', bas: 'forte (pKa do H₂O ≈ 15,7)', size: 'pequeno' },
  RO: { t: 'CH₃CH₂O⁻ (NaOEt)', cat: 'strong', nu: 'OR', nucl: 'forte', bas: 'forte (pKa do EtOH ≈ 16)', size: 'pequeno' },
  CN: { t: 'CN⁻ (NaCN)', cat: 'nuc', nu: 'CN', nucl: 'forte', bas: 'moderada (pKa do HCN ≈ 9,2)', size: 'pequeno, linear' },
  N3: { t: 'N₃⁻ (NaN₃)', cat: 'nuc', nu: 'N3', nucl: 'forte', bas: 'fraca (pKa do HN₃ ≈ 4,7)', size: 'pequeno, linear' },
  I: { t: 'I⁻ (NaI)', cat: 'nuc', nu: 'I', nucl: 'forte (muito polarizável)', bas: 'muito fraca (pKa do HI ≈ −10)', size: 'grande, mas polarizável' },
  H2O: { t: 'H₂O', cat: 'weak', nu: 'OH', nucl: 'fraca (neutra)', bas: 'fraca', size: 'pequeno' },
  ROH: { t: 'CH₃CH₂OH', cat: 'weak', nu: 'OR', nucl: 'fraca (neutra)', bas: 'fraca', size: 'pequeno' },
  tBuO: { t: '(CH₃)₃CO⁻ (t-BuOK)', cat: 'bulky', nu: 'OtBu', nucl: 'fraca (muito impedida)', bas: 'forte (pKa do t-BuOH ≈ 18)', size: '<b>volumoso</b>' },
};
export const SOLVS = {
  agua: { t: 'água', protic: true },
  metanol: { t: 'metanol', protic: true },
  etanol: { t: 'etanol', protic: true },
  dmso: { t: 'DMSO', protic: false },
  dmf: { t: 'DMF', protic: false },
  acetona: { t: 'acetona', protic: false },
  mecn: { t: 'acetonitrila', protic: false },
};

/** Análise em 10 pontos */
export function analyze(subK, reagK, solvK, temp) {
  const S = SUBS[subK], R = REAGS[reagK], L = SOLVS[solvK];
  const { s, why } = score(S.cls, R.cat, L.protic, temp);
  const r = ranked(s);
  const top = r[0];
  const prodOf = (m) => {
    if (m === 'sn1' || m === 'sn2') {
      let p = S.prod[R.nu];
      if (m === 'sn1' && S.cls === 'sec') p += ' (possíveis produtos rearranjados se houver migração 1,2)';
      if (m === 'sn1' && (subK === 'bromobutano2' || subK === 'bromopentano2')) p = S.prod[R.nu] + ' (mistura racêmica se o C for estereogênico)';
      if (m === 'sn2' && (subK === 'bromobutano2' || subK === 'bromopentano2')) p += ' com inversão de configuração';
      return p;
    }
    if (!S.zai) return '—';
    if (m === 'e2' && R.cat === 'bulky') return S.hof === S.zai ? S.zai : `${S.hof} (Hofmann tende a aumentar) + ${S.zai}`;
    return S.zai === S.hof ? S.zai : `${S.zai} (Zaitsev, majoritário) + ${S.hof}`;
  };
  const lgq = 'Br⁻ é um <b>bom grupo abandonador</b> (base conjugada de ácido forte, HBr, pKa ≈ −9). Tanto substituição quanto eliminação são possíveis.';
  const steric = { metil: 'Nenhum impedimento: acesso traseiro livre.', prim: 'Pouco impedimento no carbono α.', sec: 'Impedimento moderado: SN2 mais lenta que em primários.', ter: 'Muito impedido: ataque traseiro bloqueado.', benz: 'Carbono primário desimpedido.', alil: 'Carbono primário desimpedido.' }[S.cls] + (R.cat === 'bulky' ? ' A base volumosa acentua o impedimento: ela prefere Hβ periféricos.' : '');
  const points = [
    ['Substrato', `${S.t} — carbono α <b>${CLASSES[S.cls].t}</b>. ${CLASSES[S.cls].beta ? 'Há hidrogênios β: eliminação é possível.' : 'Sem Hβ utilizáveis: eliminação não é esperada.'}`],
    ['Grupo abandonador', lgq],
    ['Nucleofilicidade', `${R.t}: nucleofilicidade <b>${R.nucl}</b>.`],
    ['Basicidade', `${R.t}: basicidade <b>${R.bas}</b>. Lembre: basicidade (afinidade por H⁺, termodinâmica) ≠ nucleofilicidade (velocidade de ataque ao carbono).`],
    ['Impedimento estérico', `${steric} Tamanho do reagente: ${R.size}.`],
    ['Solvente', `${L.t}: solvente <b>${L.protic ? 'polar prótico' : 'polar aprótico'}</b>. ${L.protic ? 'Estabiliza carbocátions e ânions por ligação de hidrogênio (favorece SN1/E1; reduz a reatividade de nucleófilos aniônicos).' : 'Não forma ligação de H com ânions: nucleófilo mais reativo (favorece SN2/E2); estabiliza mal carbocátions.'}`],
    ['Temperatura', temp === 'alta' ? 'Alta: favorece a eliminação.' : temp === 'baixa' ? 'Baixa: favorece a substituição em relação à eliminação.' : 'Moderada: sem deslocamento importante.'],
  ];
  return { s, why, r, top, points, prodOf, comp: competition(s), slow: s[top] <= 1, S, R, L };
}
