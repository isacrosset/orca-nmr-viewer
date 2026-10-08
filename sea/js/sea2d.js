/*
 * sea2d.js — desenhos 2D da SEA: anéis substituídos (Kekulé/híbrido),
 * complexos σ para ataque orto/meta/para com todos os contribuintes de
 * ressonância (inclusive o contribuinte extra de doadores e o contribuinte
 * desfavorável de retiradores), geração dos eletrófilos e quadros de mecanismo.
 */
import { S } from './chem2d.js';
import { svgS } from './arom2d.js';
import { SUBS, RX, rel, REL_NAME } from './sub.js';

const T = (k) => (-90 + 60 * k) * Math.PI / 180;
export const OUT = (k) => 90 - 60 * k; // ângulo (graus, 90 = cima) para fora do anel no átomo k
const KEK = { A: [[0, 1], [2, 3], [4, 5]], B: [[1, 2], [3, 4], [5, 0]] };

/** grupo substituinte desenhado a partir do átomo ai do anel, na direção ang. form: '' | 'd' (doou o par: X⁺=C) | 'w' (retirou: C=grupo, carga − no aceptor) */
export function subDraw(s, ai, ang, key, form = '', o = {}) {
  const Sb = SUBS[key];
  const cls = o.cls || 'sub';
  if (!Sb) { const k = s.br(ai, ang, key, 1); s.atoms[k][3] = { cls }; return { root: k }; }
  const carbonyl = { CHO: 'H', COCH3: 'CH₃', COOH: 'OH', COOCH3: 'OCH₃', CONH2: 'NH₂' }[key];
  if (carbonyl) {
    const c = s.br(ai, ang, '', form === 'w' ? 2 : 1);
    const oo = s.br(c, ang + 60, 'O', form === 'w' ? 1 : 2); s.atoms[oo][3] = { cls: 'acc', chg: form === 'w' ? '−' : undefined, lp: form === 'w' ? [ang + 60, ang + 150, ang - 30] : [ang + 150, ang - 30] };
    const r = s.br(c, ang - 60, carbonyl, 1); s.atoms[r][3] = { cls: 'grey' };
    return { root: c, acc: oo };
  }
  if (key === 'NO2') {
    const n = s.br(ai, ang, 'N', form === 'w' ? 2 : 1); s.atoms[n][3] = { chg: '+', cls: 'acc' };
    const o1 = s.br(n, ang + 60, 'O', form === 'w' ? 1 : 2); s.atoms[o1][3] = { chg: form === 'w' ? '−' : undefined, cls: 'acc' };
    const o2 = s.br(n, ang - 60, 'O', 1); s.atoms[o2][3] = { chg: '−', cls: 'acc' };
    return { root: n, acc: o1 };
  }
  if (key === 'CN') {
    const c = s.br(ai, ang, '', form === 'w' ? 2 : 1);
    const n = s.br(c, ang, 'N', form === 'w' ? 2 : 3); s.atoms[n][3] = { chg: form === 'w' ? '−' : undefined, cls: 'acc' };
    return { root: c, acc: n };
  }
  // doadores por par isolado / halogênios / alquilas / outros: rótulo condensado
  const k = s.br(ai, ang, Sb.lab, form === 'd' ? 2 : 1);
  s.atoms[k][3] = { cls: Sb.donor ? (Sb.halogen ? 'hal' : 'don') : Sb.dir === 'm' ? 'acc' : 'alk', chg: form === 'd' ? '+' : undefined, lp: Sb.donor && form !== 'd' && o.lp === true ? [ang] : undefined };
  return { root: k };
}

/** anel: o = {x, y, R, kek: 'A'|'B'|'hyb' | dbl:[[i,j]], subs:{pos:key}, subForm:{pos:form}, plus, sp3:{pos, E}, hl:{pos:cls}, halo:{pos:cls}, H:[pos] } */
export function ringDraw(s, o = {}) {
  const x0 = o.x || 0, y0 = o.y || 0, R = o.R || 1;
  const id = [0, 1, 2, 3, 4, 5].map((k) => { const opt = {}; if (o.hl && o.hl[k]) opt.cls = o.hl[k]; if (o.halo && o.halo[k]) opt.halo = o.halo[k]; if (o.plus === k) opt.chg = '+'; if (o.chg && o.chg[k]) opt.chg = o.chg[k]; if (o.notes && o.notes[k] !== undefined) { opt.note = o.notes[k]; opt.nd = [Math.cos(T(k)) * 0.55, Math.sin(T(k)) * 0.55 + 0.12]; opt.ncls = o.ncls || 'pos'; } return s.a(x0 + R * Math.cos(T(k)), y0 + R * Math.sin(T(k)), '', opt); });
  const dbl = o.dbl || (o.kek === 'hyb' ? [] : KEK[o.kek || 'A']);
  for (let k = 0; k < 6; k++) { const a = k, b = (k + 1) % 6; const d = dbl.some(([p, q]) => (p === a && q === b) || (p === b && q === a)); s.b(id[a], id[b], d ? 2 : 1, d ? { side: 1 } : {}); }
  const subs = {};
  Object.entries(o.subs || {}).forEach(([p, key]) => { subs[p] = subDraw(s, id[+p], OUT(+p), key, (o.subForm || {})[p], o.subOpt); });
  const extra = {};
  if (o.sp3) { const p = o.sp3.pos; extra.E = s.br(id[p], OUT(p) + 32, o.sp3.E || 'E', 1); s.atoms[extra.E][3] = { cls: 'elec' }; extra.H = s.br(id[p], OUT(p) - 32, 'H', 1); s.atoms[extra.H][3] = { cls: o.sp3.Hcls || '' }; }
  (o.H || []).forEach((p) => { extra['H' + p] = s.br(id[p], OUT(p), 'H', 1); });
  if (o.kek === 'hyb') (s._circles = s._circles || []).push([x0, y0, R * 0.58]);
  return { id, subs, extra };
}
export const ringSVG2 = (o, d = {}) => { const s = new S(); const r = ringDraw(s, o); if (d.after) d.after(s, r); return svgS(s, Object.assign({ scale: 42, fs: 17 }, d)); };

/* ===================================================================
 * Complexo σ: contribuintes para ataque em p (relativo ao substituinte em 0)
 * =================================================================== */
export function sigmaForms(subKey, r, o = {}) {
  const p = { o: 1, m: 2, p: 3 }[r] ?? 0;
  const a = [1, 2, 3, 4, 5].map((d) => (p + d) % 6);
  const base = [
    { plus: a[0], dbl: [[a[1], a[2]], [a[3], a[4]]] },
    { plus: a[2], dbl: [[a[0], a[1]], [a[3], a[4]]], arrow: [[a[1], a[2]], [a[0], a[1]]] },
    { plus: a[4], dbl: [[a[0], a[1]], [a[2], a[3]]], arrow: [[a[3], a[4]], [a[2], a[3]]] },
  ];
  const Sb = SUBS[subKey];
  const forms = base.map((f) => Object.assign({ tag: '', note: '' }, f));
  forms.forEach((f) => {
    if (!Sb || f.plus !== 0) return;
    if (Sb.dir === 'm') { f.tag = 'bad'; f.note = Sb.key === 'CF3' || subKey === 'CF3' || subKey === 'NMe3' ? `carga + vizinha ao grupo fortemente retirador por indução (${Sb.lab}): contribuinte muito desfavorável` : `carga + no carbono ligado ao ${Sb.lab}, cujo átomo vizinho já é δ+ ou +: cargas positivas adjacentes — contribuinte muito desfavorável`; }
    else if (Sb.donor) { f.tag = Sb.halogen ? 'half' : 'good'; f.note = Sb.halogen ? `carga + no carbono ligado ao ${Sb.lab}: −I desfavorece, mas o par do halogênio pode doar (próxima forma)` : `carga + no carbono ligado ao ${Sb.lab}: o par isolado pode doar`; }
    else { f.tag = 'good'; f.note = `carga + em carbono terciário, ligado ao grupo alquila: estabilizado por indução/hiperconjugação`; }
  });
  if (Sb && Sb.donor && forms.some((f) => f.plus === 0)) {
    const f0 = forms.find((f) => f.plus === 0);
    forms.push({ plus: null, dbl: f0.dbl, donated: true, tag: Sb.halogen ? 'half' : 'extra', note: Sb.halogen ? `contribuinte com ${Sb.lab}⁺=C: o halogênio doa um par (+R fraco) — estabiliza o ataque ${REL_NAME[r]} em relação ao meta` : `contribuinte EXTRA: ${Sb.lab}⁺=C — todos os átomos com octeto; estabilização adicional`, fromLp: true });
  }
  return { p, forms };
}
/** desenha um contribuinte (S) */
export function sigmaS(subKey, r, f, o = {}) {
  const { p } = sigmaForms(subKey, r);
  const s = new S();
  const subs = subKey ? { 0: subKey } : {};
  const subForm = f.donated ? { 0: 'd' } : {};
  const halo = {};
  if (f.plus !== null && f.plus !== undefined) halo[f.plus] = f.tag === 'bad' ? 'r' : f.tag === 'good' ? 'g' : f.tag === 'half' ? 'o' : 'v';
  const R = ringDraw(s, { dbl: f.dbl, plus: f.plus, sp3: { pos: p, E: o.E || 'E' }, subs, subForm, halo, subOpt: { lp: !f.donated } });
  if (o.arrows && f.arrow) s.arrow({ b: [R.id[f.arrow[0][0]], R.id[f.arrow[0][1]]] }, { b: [R.id[f.arrow[1][0]], R.id[f.arrow[1][1]]] }, 0.55, '');
  s._ring = R;
  return s;
}

/* ===================================================================
 * Geração dos eletrófilos (quadros)
 * =================================================================== */
const lab = (s, x, y, t, opt) => s.a(x, y, t, opt || {});
export function genFrames(rx) {
  const F = [];
  if (rx === 'brom' || rx === 'chlor') {
    const X = rx === 'brom' ? 'Br' : 'Cl', M = rx === 'brom' ? 'FeBr₃' : 'FeCl₃', M4 = rx === 'brom' ? 'FeBr₄⁻' : 'FeCl₄⁻';
    { const s = new S(); const a = lab(s, 0, 0, X, { lp: [90, 270, 180] }), b = lab(s, 1.1, 0, X, { lp: [90, 270, 0] }); s.b(a, b, 1); const fe = lab(s, 3, 0, M.replace('₃', '₃'), { cls: 'cat' }); s.arrow({ lp: [b, 0] }, { a: fe, ang: 180 }, -0.4, 'o'); F.push({ s, cap: `<b>Ativação:</b> um par isolado do ${X}₂ é doado ao ácido de Lewis ${M}.` }); }
    { const s = new S(); const a = lab(s, 0, 0, X, { lp: [90, 270, 180], d: '+' }), b = lab(s, 1.1, 0, X, { chg: '+' }), fe = lab(s, 2.4, 0, M.slice(0, 2), { chg: '−', cls: 'cat' }); s.b(a, b, 1); s.b(b, fe, 1); lab(s, 3.2, 0, X + '₃', {}); s.t(1.2, 1, 'complexo X–X⁺–FeX₃⁻: ligação X–X muito polarizada', 'cond', 13); F.push({ s, cap: `Complexo <b>${X}–${X}⁺–Fe⁻${X}₃</b>: o ${X} terminal (δ+) é fortemente eletrofílico. <i>Representação mecanística simplificada</i>: não há ${X}⁺ livre em solução.` }); }
    return { F, tail: `${X}–${X}–${M}`, base: M4 };
  }
  if (rx === 'nitr') {
    { const s = new S(); const h = lab(s, -1, 0, 'H'), o = lab(s, 0, 0, 'O', { lp: [90, 270] }), n = lab(s, 1.1, 0, 'N', { chg: '+' }), o1 = lab(s, 1.65, -0.95, 'O'), o2 = lab(s, 1.65, 0.95, 'O', { chg: '−' }); s.b(h, o, 1); s.b(o, n, 1); s.b(n, o1, 2); s.b(n, o2, 1); const hs = lab(s, -0.3, -1.7, 'H', { cls: 'cat' }), os = lab(s, 0.9, -1.7, 'OSO₃H', { cls: 'cat' }); s.b(hs, os, 1); s.arrow({ lp: [o, 90] }, { a: hs, ang: 270 }, 0.3, 'o'); s.arrow({ b: [hs, os] }, { a: os, ang: 90 }, -0.6, ''); F.push({ s, cap: '<b>1.</b> H₂SO₄ (ácido mais forte) protona o grupo –OH do HNO₃.' }); }
    { const s = new S(); const h1 = lab(s, -0.9, -0.6, 'H'), h2 = lab(s, -0.9, 0.6, 'H'), o = lab(s, 0, 0, 'O', { chg: '+' }), n = lab(s, 1.1, 0, 'N', { chg: '+' }), o1 = lab(s, 1.65, -0.95, 'O'), o2 = lab(s, 1.65, 0.95, 'O', { chg: '−', lp: [0, 270] }); s.b(h1, o, 1); s.b(h2, o, 1); s.b(o, n, 1); s.b(n, o1, 2); s.b(n, o2, 1); s.arrow({ b: [o, n] }, { a: o, ang: 90 }, -0.5, ''); s.arrow({ lp: [o2, 0] }, { b: [n, o2] }, 0.5, ''); F.push({ s, cap: '<b>2.</b> Sai H₂O (bom grupo de saída) e o par do O⁻ forma a segunda ligação N=O.' }); }
    { const s = new S(); const o1 = lab(s, 0, 0, 'O', { lp: [90, 270, 180] }), n = lab(s, 1.15, 0, 'N', { chg: '+', cls: 'elec' }), o2 = lab(s, 2.3, 0, 'O', { lp: [90, 270, 0] }); s.b(o1, n, 2); s.b(n, o2, 2); s.t(1.15, 1.1, 'íon nitrônio: linear (180°), N sp', 'cond', 13); s.t(4.2, 0, '+ H₂O + HSO₄⁻', 'cond', 15); F.push({ s, cap: '<b>3.</b> Íon nitrônio <b>O=N⁺=O</b>: o eletrófilo efetivo. Global: HNO₃ + 2 H₂SO₄ ⇌ NO₂⁺ + H₃O⁺ + 2 HSO₄⁻.' }); }
    return { F, tail: 'O=N⁺=O', base: 'HSO₄⁻' };
  }
  if (rx === 'sulf') {
    { const s = new S(); const S0 = lab(s, 0, 0, 'S', { cls: 'elec', d: '+' }), o1 = lab(s, 0, -1.1, 'O'), o2 = lab(s, -0.95, 0.6, 'O'), o3 = lab(s, 0.95, 0.6, 'O'); s.b(S0, o1, 2); s.b(S0, o2, 2); s.b(S0, o3, 2); s.t(2.6, 0, '(ou HSO₃⁺ em meio muito ácido)', 'cond', 13); F.push({ s, cap: '<b>Eletrófilo:</b> SO₃ — S fortemente δ+ (três O muito eletronegativos). Em H₂SO₄ fumegante, SO₃ (ou sua forma protonada HSO₃⁺) é a espécie sulfonante. <i>Representação simplificada.</i>' }); }
    return { F, tail: 'SO₃', base: 'HSO₄⁻' };
  }
  if (rx === 'alq') {
    { const s = new S(); const c = lab(s, 0, 0, '(CH₃)₂CH', { cls: 'elec' }), cl = lab(s, 1.9, 0, 'Cl', { lp: [90, 270, 0] }), al = lab(s, 3.6, 0, 'AlCl₃', { cls: 'cat' }); s.b(c, cl, 1); s.arrow({ lp: [cl, 0] }, { a: al, ang: 180 }, -0.4, 'o'); F.push({ s, cap: '<b>1.</b> O Cl do haleto doa um par ao AlCl₃.' }); }
    { const s = new S(); const c = lab(s, 0, 0, '(CH₃)₂CH', { cls: 'elec' }), cl = lab(s, 1.9, 0, 'Cl', { chg: '+' }), al = lab(s, 3.4, 0, 'AlCl₃', { chg: '−', cls: 'cat' }); s.b(c, cl, 1); s.b(cl, al, 1); s.arrow({ b: [c, cl] }, { a: cl, ang: 270 }, 0.5, ''); s.t(6.4, 0, '→  (CH₃)₂CH⁺  +  AlCl₄⁻', 'cond', 16); F.push({ s, cap: '<b>2.</b> A ligação C–Cl enfraquece: carbocátion secundário (ou complexo com forte caráter carbocatiônico). Com haletos primários, o complexo R–Cl–AlCl₃ costuma ser a espécie que reage. <i>Representação simplificada.</i>' }); }
    return { F, tail: '(CH₃)₂CH⁺', base: 'AlCl₄⁻' };
  }
  if (rx === 'acil') {
    { const s = new S(); const r = lab(s, -1, 0.55, 'H₃C'), c = lab(s, 0, 0, ''), o = lab(s, 0, -1.1, 'O'), cl = lab(s, 1.0, 0.55, 'Cl', { lp: [0, 270] }), al = lab(s, 2.8, 0.55, 'AlCl₃', { cls: 'cat' }); s.b(r, c, 1); s.b(c, o, 2); s.b(c, cl, 1); s.arrow({ lp: [cl, 0] }, { a: al, ang: 180 }, -0.4, 'o'); F.push({ s, cap: '<b>1.</b> O cloro do cloreto de acila doa um par ao AlCl₃.' }); }
    { const s = new S(); const r = lab(s, -1.2, 0, 'H₃C'), c = lab(s, 0, 0, 'C', { cls: 'elec' }), o = lab(s, 1.2, 0, 'O', { chg: '+', lp: [0] }); s.b(r, c, 1); s.b(c, o, 3); const r2 = lab(s, 3.4, 0, 'H₃C'), c2 = lab(s, 4.6, 0, 'C', { chg: '+', cls: 'elec' }), o2 = lab(s, 5.8, 0, 'O', { lp: [90, 270] }); s.b(r2, c2, 1); s.b(c2, o2, 2); s.t(2.4, 0, '↔', 'res', 22); s.arrow({ b: [c, o] }, { a: o, ang: 270 }, -0.5, ''); s.t(2.1, 1.1, '+ AlCl₄⁻', 'cond', 15); F.push({ s, cap: '<b>2.</b> Íon acílio: R–C≡O⁺ ↔ R–C⁺=O. A forma com tripla ligação (todos com octeto) contribui muito: o íon é estabilizado por ressonância e <b>não rearranja</b>.' }); }
    return { F, tail: 'CH₃–C≡O⁺', base: 'AlCl₄⁻' };
  }
  return { F, tail: 'E⁺', base: 'B:' };
}

/** quadros completos: geração + ataque + σ + ressonância + desprotonação + produto (substituinte opcional em 0, ataque em r) */
export function mechFrames(rx, o = {}) {
  const R = RX[rx], g = genFrames(rx);
  const subKey = o.sub, r = o.r || 'p';
  const p = subKey ? { o: 1, m: 2, p: 3 }[r] : 0;
  const subs = subKey ? { 0: subKey } : {};
  const F = g.F.map((f) => Object.assign({ stage: 0 }, f));
  // dupla de Kekulé que contém o carbono atacado p e o vizinho p+1
  const dbl = [[p, (p + 1) % 6], [(p + 2) % 6, (p + 3) % 6], [(p + 4) % 6, (p + 5) % 6]];
  { const s = new S(); const rg = ringDraw(s, { dbl, subs, H: [p] }); const ang = OUT(p) + 70, L = 2.2; const x = s.atoms[rg.id[p]][0] + Math.cos(ang * Math.PI / 180) * L, y = s.atoms[rg.id[p]][1] - Math.sin(ang * Math.PI / 180) * L; const hal = rx === 'brom' || rx === 'chlor';
    const e = s.a(x, y, R.Elab === 'R' ? '(CH₃)₂CH' : R.Elab === 'COR' ? 'CH₃C≡O' : R.Elab === 'SO₃H' ? 'SO₃' : R.Elab, { cls: 'elec', chg: rx === 'sulf' || hal ? undefined : '+', d: hal ? '+' : undefined, dd: [0.1, 0.62] });
    s.arrow({ b: [rg.id[p], rg.id[(p + 1) % 6]] }, { a: e, ang: OUT(p) + 70 + 180 }, -0.35, '');
    if (hal) { const X = R.E; const x2 = s.a(x - 1.5, y - 0.2, X, { chg: '+' }), fe = s.a(x - 3.0, y - 0.4, 'FeX₃'.replace('X', X), { chg: '−', cls: 'cat' }); s.b(e, x2, 1); s.b(x2, fe, 1); s.arrow({ b: [e, x2] }, { a: x2, ang: 270 }, 0.6, ''); } F.push({ s, stage: 1, cap: `<b>Ataque do anel:</b> o par π (C=C) ataca o eletrófilo (${R.elec}). A seta parte dos elétrons π (nucleófilo) e vai para o eletrófilo.` }); }
  const sf = sigmaForms(subKey, subKey ? r : null);
  const Eshow = R.Elab === 'R' ? 'CH(CH₃)₂' : R.Elab === 'COR' ? 'COCH₃' : R.Elab === 'SO₃H' ? 'SO₃⁻' : R.Elab;
  sf.forms.forEach((f, i) => { const s = new S(); const rg = ringDraw(s, { dbl: f.dbl, plus: f.plus, sp3: { pos: p, E: Eshow }, subs, subForm: f.donated ? { 0: 'd' } : {}, halo: f.plus !== null && f.plus !== undefined ? { [f.plus]: 'v' } : {} }); const nx = sf.forms[i + 1]; if (nx && nx.arrow) s.arrow({ b: [rg.id[nx.arrow[0][0]], rg.id[nx.arrow[0][1]]] }, { b: [rg.id[nx.arrow[1][0]], rg.id[nx.arrow[1][1]]] }, 0.55, ''); F.push({ s, stage: 2, cap: i === 0 ? `<b>Complexo σ</b> (íon arênio / intermediário de Wheland): o carbono atacado fica <b>sp³</b>; aromaticidade perdida temporariamente. Contribuinte ${i + 1}.` : `Contribuinte ${i + 1} do <b>mesmo</b> intermediário${f.note ? ': ' + f.note : ''}.` }); });
  { const s = new S(); const f0 = sf.forms[0]; const rg = ringDraw(s, { dbl: f0.dbl, plus: f0.plus, sp3: { pos: p, E: Eshow, Hcls: 'hb' }, subs }); const ang = OUT(p) - 32; const hx = s.atoms[rg.extra.H]; const b = s.a(hx[0] + Math.cos((ang - 20) * Math.PI / 180) * 1.5, hx[1] - Math.sin((ang - 20) * Math.PI / 180) * 1.5, g.base.replace('⁻', ''), { cls: 'base', chg: '−' }); s.arrow({ a: b, ang: ang - 20 + 180 }, { a: rg.extra.H }, 0.3, 'o'); s.arrow({ b: [rg.id[p], rg.extra.H] }, { b: [rg.id[p], rg.id[(p + 1) % 6]] }, -0.5, ''); F.push({ s, stage: 3, cap: `<b>Desprotonação:</b> ${g.base} (base) remove o H do carbono sp³; o par da ligação C–H volta ao anel e forma a C=C.` }); }
  { const s = new S(); const prodE = R.Elab === 'R' ? 'CH(CH₃)₂' : R.Elab === 'COR' ? 'COCH₃' : R.Elab; const rg = ringDraw(s, { kek: 'hyb', subs: Object.assign({}, subs) }); const k = s.br(rg.id[p], OUT(p), prodE, 1); s.atoms[k][3] = { cls: 'elec' }; s.t(3.4, 0, rx === 'brom' ? '+ HBr + FeBr₃' : rx === 'chlor' ? '+ HCl + FeCl₃' : rx === 'nitr' ? '+ H₂SO₄' : rx === 'sulf' ? '(após transferência de H⁺)' : rx === 'alq' ? '+ HCl + AlCl₃' : '+ HCl', 'cond', 14); F.push({ s, stage: 4, cap: `<b>Aromaticidade restaurada:</b> ${R.prod}.${rx === 'brom' || rx === 'chlor' || rx === 'alq' ? ' O catalisador é regenerado.' : ''}${rx === 'acil' ? ' A cetona forma complexo com AlCl₃ (por isso usa-se ≥ 1 equivalente); a hidrólise (workup aquoso) libera a cetona.' : ''}` }); }
  return F;
}
export { rel, REL_NAME };
