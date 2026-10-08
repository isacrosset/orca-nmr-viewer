/*
 * sub.js — substituentes em anéis aromáticos: classificação (indução,
 * ressonância, ativação, orientação), modelos 3D (gabaritos geométricos),
 * energias qualitativas dos caminhos orto/meta/para, previsão para anéis
 * mono e dissubstituídos e compatibilidade com as reações de SEA.
 */
const V3 = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], mul: (a, k) => [a[0] * k, a[1] * k, a[2] * k],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  norm: (a) => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
};
/* ---------- construtor de gabaritos (referencial local: x = para fora do anel, y = tangente no plano, z = normal) ---------- */
function G() {
  const at = [];
  const api = {
    at,
    add(el, p, parent = -1, order = 1) { at.push([el, p, parent, order]); return at.length - 1; },
    pos(i) { return i < 0 ? [0, 0, 0] : at[i][1]; },
    dir2(deg) { const r = deg * Math.PI / 180; return [Math.cos(r), Math.sin(r), 0]; },
    /* três direções tetraédricas em torno de c, com a ligação de volta apontando para "back" */
    tetra(c, back, ref = [0, 0, 1], phase = 0) {
      const b = V3.norm(back);
      let r = V3.norm(V3.cross(b, ref)); if (!isFinite(r[0]) || Math.hypot(...V3.cross(b, ref)) < 1e-3) r = V3.norm(V3.cross(b, [0, 1, 0]));
      const s = V3.cross(b, r);
      return [0, 1, 2].map((k) => { const f = phase + k * 2 * Math.PI / 3 + Math.PI / 2; return V3.norm(V3.add(V3.mul(b, -1 / 3), V3.mul(V3.add(V3.mul(r, Math.cos(f)), V3.mul(s, Math.sin(f))), 0.9428))); });
    },
    methyl(ci, backVec, phase = 0) { const c = at[ci][1]; api.tetra(c, backVec, [0, 0, 1], phase).forEach((d) => api.add('H', V3.add(c, V3.mul(d, 1.09)), ci)); },
  };
  return api;
}
const at = (g, el, from, dir, L, order = 1) => g.add(el, V3.add(g.pos(from), V3.mul(dir, L)), from, order);
const back = (g, i, j) => V3.norm(V3.add(g.pos(j), V3.mul(g.pos(i), -1)));
/* gabaritos */
export const TEMPL = {
  H: () => { const g = G(); at(g, 'H', -1, [1, 0, 0], 1.08); return g.at; },
  CH3: () => { const g = G(); const c = at(g, 'C', -1, [1, 0, 0], 1.51); g.methyl(c, [-1, 0, 0]); return g.at; },
  C2H5: () => { const g = G(); const c1 = at(g, 'C', -1, [1, 0, 0], 1.51); const [d1, d2, d3] = g.tetra(g.pos(c1), [-1, 0, 0], [0, 1, 0]); const c2 = at(g, 'C', c1, d1, 1.53); at(g, 'H', c1, d2, 1.09); at(g, 'H', c1, d3, 1.09); g.methyl(c2, back(g, c2, c1)); return g.at; },
  tBu: () => { const g = G(); const c1 = at(g, 'C', -1, [1, 0, 0], 1.53); g.tetra(g.pos(c1), [-1, 0, 0], [0, 1, 0], 0.4).forEach((d) => { const c = at(g, 'C', c1, d, 1.53); g.methyl(c, back(g, c, c1), 0.3); }); return g.at; },
  iPr: () => { const g = G(); const c1 = at(g, 'C', -1, [1, 0, 0], 1.52); const [d1, d2, d3] = g.tetra(g.pos(c1), [-1, 0, 0], [0, 1, 0]); at(g, 'H', c1, d1, 1.09); [d2, d3].forEach((d) => { const c = at(g, 'C', c1, d, 1.53); g.methyl(c, back(g, c, c1)); }); return g.at; },
  OH: () => { const g = G(); const o = at(g, 'O', -1, [1, 0, 0], 1.36); at(g, 'H', o, g.dir2(71), 0.96); return g.at; },
  OCH3: () => { const g = G(); const o = at(g, 'O', -1, [1, 0, 0], 1.36); const c = at(g, 'C', o, g.dir2(63), 1.42); g.methyl(c, back(g, c, o)); return g.at; },
  NH2: () => { const g = G(); const n = at(g, 'N', -1, [1, 0, 0], 1.40); at(g, 'H', n, g.dir2(60), 1.01); at(g, 'H', n, g.dir2(-60), 1.01); return g.at; },
  NHCOCH3: () => { const g = G(); const n = at(g, 'N', -1, [1, 0, 0], 1.41); at(g, 'H', n, g.dir2(-60), 1.01); const c = at(g, 'C', n, g.dir2(60), 1.36); at(g, 'O', c, g.dir2(120), 1.23, 2); const m = at(g, 'C', c, g.dir2(0), 1.51); g.methyl(m, [-1, 0, 0]); return g.at; },
  OCOCH3: () => { const g = G(); const o = at(g, 'O', -1, [1, 0, 0], 1.40); const c = at(g, 'C', o, g.dir2(60), 1.36); at(g, 'O', c, g.dir2(120), 1.21, 2); const m = at(g, 'C', c, g.dir2(0), 1.50); g.methyl(m, [-1, 0, 0]); return g.at; },
  F: () => { const g = G(); at(g, 'F', -1, [1, 0, 0], 1.35); return g.at; },
  Cl: () => { const g = G(); at(g, 'Cl', -1, [1, 0, 0], 1.74); return g.at; },
  Br: () => { const g = G(); at(g, 'Br', -1, [1, 0, 0], 1.90); return g.at; },
  I: () => { const g = G(); at(g, 'I', -1, [1, 0, 0], 2.10); return g.at; },
  CHO: () => { const g = G(); const c = at(g, 'C', -1, [1, 0, 0], 1.48); at(g, 'O', c, g.dir2(60), 1.21, 2); at(g, 'H', c, g.dir2(-60), 1.10); return g.at; },
  COCH3: () => { const g = G(); const c = at(g, 'C', -1, [1, 0, 0], 1.49); at(g, 'O', c, g.dir2(60), 1.22, 2); const m = at(g, 'C', c, g.dir2(-60), 1.51); g.methyl(m, back(g, m, c)); return g.at; },
  COOH: () => { const g = G(); const c = at(g, 'C', -1, [1, 0, 0], 1.48); at(g, 'O', c, g.dir2(60), 1.21, 2); const o = at(g, 'O', c, g.dir2(-60), 1.34); at(g, 'H', o, g.dir2(0), 0.97); return g.at; },
  COOCH3: () => { const g = G(); const c = at(g, 'C', -1, [1, 0, 0], 1.48); at(g, 'O', c, g.dir2(60), 1.21, 2); const o = at(g, 'O', c, g.dir2(-60), 1.34); const m = at(g, 'C', o, g.dir2(0), 1.43); g.methyl(m, [-1, 0, 0]); return g.at; },
  CONH2: () => { const g = G(); const c = at(g, 'C', -1, [1, 0, 0], 1.50); at(g, 'O', c, g.dir2(60), 1.23, 2); const n = at(g, 'N', c, g.dir2(-60), 1.34); at(g, 'H', n, g.dir2(0), 1.01); at(g, 'H', n, g.dir2(-120), 1.01); return g.at; },
  CN: () => { const g = G(); const c = at(g, 'C', -1, [1, 0, 0], 1.44); at(g, 'N', c, [1, 0, 0], 1.16, 3); return g.at; },
  NO2: () => { const g = G(); const n = at(g, 'N', -1, [1, 0, 0], 1.47); at(g, 'O', n, g.dir2(62), 1.22, 2); at(g, 'O', n, g.dir2(-62), 1.22); return g.at; },
  SO3H: () => { const g = G(); const s = at(g, 'S', -1, [1, 0, 0], 1.77); const [d1, d2, d3] = g.tetra(g.pos(s), [-1, 0, 0], [0, 1, 0]); at(g, 'O', s, d1, 1.43, 2); at(g, 'O', s, d2, 1.43, 2); const o = at(g, 'O', s, d3, 1.57); at(g, 'H', o, V3.norm(V3.add(d3, [0.6, 0, 0])), 0.97); return g.at; },
  CF3: () => { const g = G(); const c = at(g, 'C', -1, [1, 0, 0], 1.50); g.tetra(g.pos(c), [-1, 0, 0]).forEach((d) => at(g, 'F', c, d, 1.35)); return g.at; },
  NMe3: () => { const g = G(); const n = at(g, 'N', -1, [1, 0, 0], 1.49); g.tetra(g.pos(n), [-1, 0, 0], [0, 1, 0]).forEach((d) => { const c = at(g, 'C', n, d, 1.49); g.methyl(c, back(g, c, n)); }); return g.at; },
};

/* ===================================================================
 * Substituintes
 * rank: efeito qualitativo sobre a velocidade (+ ativa, − desativa; benzeno = 0)
 * dir: 'op' | 'm' ; I, R: descrição ; lp: tem par/sistema doador ; acc: aceptor π
 * =================================================================== */
export const SUBS = {
  NH2: { lab: 'NH₂', name: 'amino', ex: 'anilina', tpl: 'NH2', I: '−I (fraco)', R: '+R (forte)', rank: 3, dir: 'op', cls: 'forte ativador', donor: 'N', basic: true, bulk: 1 },
  NHCH3: { lab: 'NHCH₃', name: 'metilamino', ex: 'N-metilanilina', tpl: 'NH2', I: '−I (fraco)', R: '+R (forte)', rank: 3, dir: 'op', cls: 'forte ativador', donor: 'N', basic: true, bulk: 1.3 },
  OH: { lab: 'OH', name: 'hidroxila', ex: 'fenol', tpl: 'OH', I: '−I', R: '+R (forte)', rank: 2.9, dir: 'op', cls: 'forte ativador', donor: 'O', bulk: 1 },
  OCH3: { lab: 'OCH₃', name: 'metoxila', ex: 'anisol', tpl: 'OCH3', I: '−I', R: '+R (forte)', rank: 2.6, dir: 'op', cls: 'forte ativador', donor: 'O', bulk: 1.2 },
  NHCOCH3: { lab: 'NHCOCH₃', name: 'acetamido', ex: 'acetanilida', tpl: 'NHCOCH3', I: '−I', R: '+R (moderado: o par do N também conjuga com a C=O)', rank: 1.7, dir: 'op', cls: 'ativador moderado', donor: 'N', bulk: 2.2 },
  OCOCH3: { lab: 'OCOCH₃', name: 'acetoxila', ex: 'acetato de fenila', tpl: 'OCOCH3', I: '−I', R: '+R (moderado)', rank: 1.4, dir: 'op', cls: 'ativador moderado', donor: 'O', bulk: 1.8 },
  CH3: { lab: 'CH₃', name: 'metila', ex: 'tolueno', tpl: 'CH3', I: '+I (fraco)', R: 'hiperconjugação (doadora)', rank: 1, dir: 'op', cls: 'ativador fraco', bulk: 1.3 },
  C2H5: { lab: 'CH₂CH₃', name: 'etila', ex: 'etilbenzeno', tpl: 'C2H5', I: '+I (fraco)', R: 'hiperconjugação (doadora)', rank: 1, dir: 'op', cls: 'ativador fraco', bulk: 1.6 },
  tBu: { lab: 'C(CH₃)₃', name: 'terc-butila', ex: 'terc-butilbenzeno', tpl: 'tBu', I: '+I (fraco)', R: '—', rank: 0.9, dir: 'op', cls: 'ativador fraco', bulk: 3 },
  F: { lab: 'F', name: 'flúor', ex: 'fluorobenzeno', tpl: 'F', I: '−I (forte)', R: '+R (fraco)', rank: -0.3, dir: 'op', cls: 'desativador fraco (halogênio)', donor: 'F', halogen: true, bulk: 0.8 },
  Cl: { lab: 'Cl', name: 'cloro', ex: 'clorobenzeno', tpl: 'Cl', I: '−I (forte)', R: '+R (fraco)', rank: -0.6, dir: 'op', cls: 'desativador fraco (halogênio)', donor: 'Cl', halogen: true, bulk: 1.2 },
  Br: { lab: 'Br', name: 'bromo', ex: 'bromobenzeno', tpl: 'Br', I: '−I (forte)', R: '+R (fraco)', rank: -0.6, dir: 'op', cls: 'desativador fraco (halogênio)', donor: 'Br', halogen: true, bulk: 1.4 },
  I: { lab: 'I', name: 'iodo', ex: 'iodobenzeno', tpl: 'I', I: '−I', R: '+R (fraco)', rank: -0.5, dir: 'op', cls: 'desativador fraco (halogênio)', donor: 'I', halogen: true, bulk: 1.6 },
  CHO: { lab: 'CHO', name: 'formila', ex: 'benzaldeído', tpl: 'CHO', I: '−I', R: '−R', rank: -2, dir: 'm', cls: 'desativador moderado', acc: true, bulk: 1.3 },
  COCH3: { lab: 'COCH₃', name: 'acetila', ex: 'acetofenona', tpl: 'COCH3', I: '−I', R: '−R', rank: -2, dir: 'm', cls: 'desativador moderado', acc: true, bulk: 1.6 },
  COOH: { lab: 'COOH', name: 'carboxila', ex: 'ácido benzoico', tpl: 'COOH', I: '−I', R: '−R', rank: -2.1, dir: 'm', cls: 'desativador moderado', acc: true, bulk: 1.5 },
  COOCH3: { lab: 'COOCH₃', name: 'metoxicarbonila', ex: 'benzoato de metila', tpl: 'COOCH3', I: '−I', R: '−R', rank: -2, dir: 'm', cls: 'desativador moderado', acc: true, bulk: 1.7 },
  CONH2: { lab: 'CONH₂', name: 'carbamoíla', ex: 'benzamida', tpl: 'CONH2', I: '−I', R: '−R', rank: -1.8, dir: 'm', cls: 'desativador moderado', acc: true, bulk: 1.5 },
  CN: { lab: 'CN', name: 'ciano', ex: 'benzonitrila', tpl: 'CN', I: '−I (forte)', R: '−R', rank: -2.6, dir: 'm', cls: 'desativador forte', acc: true, bulk: 0.9 },
  SO3H: { lab: 'SO₃H', name: 'sulfo', ex: 'ácido benzenossulfônico', tpl: 'SO3H', I: '−I (forte)', R: '−R', rank: -2.6, dir: 'm', cls: 'desativador forte', acc: true, bulk: 2 },
  CF3: { lab: 'CF₃', name: 'trifluorometila', ex: '(trifluorometil)benzeno', tpl: 'CF3', I: '−I (forte)', R: '— (sem par; retira só por indução)', rank: -2.5, dir: 'm', cls: 'desativador forte', bulk: 1.8 },
  NO2: { lab: 'NO₂', name: 'nitro', ex: 'nitrobenzeno', tpl: 'NO2', I: '−I (forte)', R: '−R (forte)', rank: -3, dir: 'm', cls: 'desativador forte', acc: true, bulk: 1.4 },
  NMe3: { lab: 'N⁺(CH₃)₃', name: 'trimetilamônio', ex: 'íon trimetilanilínio', tpl: 'NMe3', I: '−I (muito forte, carga +)', R: '— (sem par livre)', rank: -3.2, dir: 'm', cls: 'desativador forte', bulk: 2.6 },
};
export const SIM_SUBS = ['OH', 'OCH3', 'NH2', 'NHCOCH3', 'CH3', 'tBu', 'F', 'Cl', 'Br', 'NO2', 'CHO', 'COCH3', 'COOH', 'CN', 'SO3H', 'CF3', 'NMe3'];

/* moléculas do laboratório 3D: substituintes por posição do anel */
export const LABMOLS = {
  benzeno: { name: 'benzeno', f: 'C₆H₆', subs: {} },
  tolueno: { name: 'tolueno', f: 'C₇H₈', subs: { 0: 'CH3' } },
  etilbenzeno: { name: 'etilbenzeno', f: 'C₈H₁₀', subs: { 0: 'C2H5' } },
  fenol: { name: 'fenol', f: 'C₆H₅OH', subs: { 0: 'OH' } },
  anisol: { name: 'anisol', f: 'C₆H₅OCH₃', subs: { 0: 'OCH3' } },
  anilina: { name: 'anilina', f: 'C₆H₅NH₂', subs: { 0: 'NH2' } },
  clorobenzeno: { name: 'clorobenzeno', f: 'C₆H₅Cl', subs: { 0: 'Cl' } },
  bromobenzeno: { name: 'bromobenzeno', f: 'C₆H₅Br', subs: { 0: 'Br' } },
  nitrobenzeno: { name: 'nitrobenzeno', f: 'C₆H₅NO₂', subs: { 0: 'NO2' } },
  benzaldeido: { name: 'benzaldeído', f: 'C₆H₅CHO', subs: { 0: 'CHO' } },
  acetofenona: { name: 'acetofenona', f: 'C₆H₅COCH₃', subs: { 0: 'COCH3' } },
  benzoico: { name: 'ácido benzoico', f: 'C₆H₅COOH', subs: { 0: 'COOH' } },
  benzonitrila: { name: 'benzonitrila', f: 'C₆H₅CN', subs: { 0: 'CN' } },
  acetanilida: { name: 'acetanilida', f: 'C₆H₅NHCOCH₃', subs: { 0: 'NHCOCH3' } },
  tbutil: { name: 'terc-butilbenzeno', f: 'C₁₀H₁₄', subs: { 0: 'tBu' } },
};
export const LAB_KEYS = Object.keys(LABMOLS);
/* cargas parciais π qualitativas (para o mapa de densidade): por relação ao substituinte */
export function espCharges(subs) {
  const q = [0, 0, 0, 0, 0, 0];
  Object.entries(subs).forEach(([pos, k]) => {
    const S = SUBS[k]; if (!S) return;
    const p = +pos, s = S.dir === 'op' && !S.halogen ? -1 : 1; // doador: posições o/p mais ricas
    const amp = Math.min(1, Math.abs(S.rank) / 3) * 0.32;
    for (let j = 0; j < 6; j++) {
      const r = rel(p, j);
      if (S.halogen) q[j] += r === 'o' || r === 'p' ? 0.04 : r === 'm' ? 0.1 : 0.12;
      else if (r === 'o' || r === 'p') q[j] += s * amp;
      else if (r === 'm') q[j] += s * amp * 0.25;
      else if (r === 'ipso') q[j] += s > 0 ? amp * 0.6 : 0.05;
    }
  });
  return q;
}
/** relação entre a posição p (substituinte) e j */
export function rel(p, j) { const d = ((j - p) % 6 + 6) % 6; return ['ipso', 'o', 'm', 'p', 'm', 'o'][d]; }
export const REL_NAME = { o: 'orto', m: 'meta', p: 'para', ipso: 'ipso' };

/* ===================================================================
 * Energias qualitativas (unid. arbitrárias): barreira ΔG‡ do ataque em cada posição
 * benzeno = 50 por posição
 * =================================================================== */
export function barrier(k, r) {
  if (!k) return 50;
  const S = SUBS[k];
  if (r === 'ipso') return 80;
  if (S.halogen) return { o: 55 + 0.8 * S.bulk, p: 54, m: 60 }[r];
  if (S.dir === 'op') {
    const R = S.rank;
    return { o: 50 - 8 * R + 1.6 * S.bulk, p: 50 - 8 * R, m: 50 - 1.3 * R }[r];
  }
  const R = -S.rank;
  return { m: 50 + 5 * R, o: 50 + 8.5 * R + 0.5 * S.bulk, p: 50 + 8.5 * R }[r];
}
/** Para cada posição livre de um anel com substituintes {pos: chave}, estimativa de barreira (aditiva) + estérica */
export function regio(subs) {
  const occ = Object.keys(subs).map(Number);
  const res = [];
  for (let j = 0; j < 6; j++) {
    if (occ.includes(j)) { res.push(null); continue; }
    let E = 50, notes = [];
    occ.forEach((p) => { const k = subs[p], r = rel(p, j); E += barrier(k, r) - 50; notes.push(`${REL_NAME[r]} a ${SUBS[k].lab}`); });
    // posição entre dois substituintes (orto a ambos): impedimento estérico
    const orthoTo = occ.filter((p) => rel(p, j) === 'o');
    if (orthoTo.length >= 2) { E += 9 + 2 * orthoTo.reduce((s, p) => s + SUBS[subs[p]].bulk, 0); notes.push('entre dois grupos: muito congestionada'); }
    res.push({ j, E, notes });
  }
  const free = res.filter(Boolean);
  const min = Math.min(...free.map((x) => x.E));
  free.forEach((x) => { x.best = x.E - min < 2.5; x.ok = x.E - min < 7; });
  return res;
}
/** reatividade global qualitativa (soma dos ranks) */
export const ringRank = (subs) => Object.values(subs).reduce((s, k) => s + SUBS[k].rank, 0);
export const rankText = (r) => (r >= 2.4 ? 'muito mais rápido que o benzeno (fortemente ativado)' : r >= 1.2 ? 'mais rápido que o benzeno (ativado)' : r >= 0.4 ? 'um pouco mais rápido que o benzeno (ativação fraca)' : r > -0.4 ? 'velocidade semelhante à do benzeno' : r > -1.2 ? 'um pouco mais lento que o benzeno (desativação fraca)' : r > -2.4 ? 'mais lento que o benzeno (desativado)' : 'muito mais lento que o benzeno (fortemente desativado)');

/* ===================================================================
 * Reações
 * =================================================================== */
export const RX = {
  brom: { name: 'Bromação', short: 'Br₂/FeBr₃', reag: 'Br₂, FeBr₃', E: 'Br', Elab: 'Br', elec: 'Br₂ polarizado/ativado pelo FeBr₃ (Br–Br···FeBr₃)', prod: 'Ar–Br', note: 'catalisada por ácido de Lewis; regenera FeBr₃ e libera HBr', rev: 'não (nas condições usuais)' },
  chlor: { name: 'Cloração', short: 'Cl₂/FeCl₃', reag: 'Cl₂, FeCl₃ (ou AlCl₃)', E: 'Cl', Elab: 'Cl', elec: 'Cl₂ ativado pelo ácido de Lewis (Cl–Cl···FeCl₃)', prod: 'Ar–Cl', note: 'catalisada por ácido de Lewis', rev: 'não' },
  nitr: { name: 'Nitração', short: 'HNO₃/H₂SO₄', reag: 'HNO₃, H₂SO₄ conc.', E: 'NO2', Elab: 'NO₂', elec: 'íon nitrônio NO₂⁺', prod: 'Ar–NO₂', note: 'H₂SO₄ protona o HNO₃ e gera NO₂⁺', rev: 'não' },
  sulf: { name: 'Sulfonação', short: 'SO₃/H₂SO₄', reag: 'SO₃ em H₂SO₄ (ácido sulfúrico fumegante)', E: 'SO3H', Elab: 'SO₃H', elec: 'SO₃ (ou HSO₃⁺, conforme a acidez do meio)', prod: 'Ar–SO₃H', note: 'reversível: H₂SO₄ diluído/vapor a quente remove –SO₃H', rev: 'sim' },
  alq: { name: 'Alquilação de Friedel–Crafts', short: 'R–Cl/AlCl₃', reag: 'R–Cl (ou R–Br), AlCl₃', E: 'CH3', Elab: 'R', elec: 'carbocátion R⁺ ou complexo R–Cl···AlCl₃ com forte caráter carbocatiônico', prod: 'Ar–R', note: 'rearranjos possíveis; polialquilação (o produto é mais reativo)', rev: 'parcialmente (pode haver isomerização)', fc: true },
  acil: { name: 'Acilação de Friedel–Crafts', short: 'RCOCl/AlCl₃', reag: 'RCOCl (ou anidrido), AlCl₃ (quantidade estequiométrica)', E: 'COCH3', Elab: 'COR', elec: 'íon acílio R–C≡O⁺', prod: 'Ar–COR', note: 'sem rearranjo; monoacilação (o produto é desativado); a cetona complexa o AlCl₃ → workup aquoso', rev: 'não', fc: true },
};
/** compatibilidade de uma reação com o anel (substituintes) */
export function compat(rx, subs) {
  const ks = Object.values(subs).map((k) => SUBS[k]);
  const R = RX[rx];
  const msgs = [];
  let ok = true;
  if (R.fc) {
    const basic = ks.find((s) => s.basic);
    if (basic) { ok = false; msgs.push(`O ${basic.lab} é básico: coordena-se ao AlCl₃ (ácido de Lewis), gerando –NH₂⁺–AlCl₃⁻, um grupo fortemente desativador; a Friedel–Crafts clássica falha.`); }
    const strong = ks.find((s) => s.rank <= -1.7);
    if (strong) { ok = false; msgs.push(`Anel desativado por ${strong.lab} (${strong.cls}): a Friedel–Crafts geralmente não funciona em anéis moderada/fortemente desativados.`); }
  }
  if (rx === 'nitr' && ks.find((s) => s.basic)) msgs.push('Cuidado: em meio fortemente ácido, o –NH₂ é protonado (–NH₃⁺, desativador meta) e também pode ser oxidado; na prática protege-se a amina (acetanilida).');
  if (rx === 'brom' && ks.find((s) => s.rank >= 2.5)) msgs.push('Anel muito ativado: a bromação ocorre mesmo sem catalisador e tende à polissubstituição (ex.: anilina + Br₂/H₂O → 2,4,6-tribromoanilina).');
  if (rx === 'alq' && ks.every((s) => s.rank >= 0)) msgs.push('Lembre: o produto alquilado é mais reativo que o substrato — risco de polialquilação.');
  return { ok, msgs };
}
