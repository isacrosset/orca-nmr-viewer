/*
 * depict.js — coordenadas 2D (cadeia principal em zigue-zague, ramos
 * alternados, anéis como polígonos regulares), desenho esquelético e
 * estrutural completo (SVG via chem2d) e fórmula condensada.
 */
import { S, mol as render } from './chem2d.js';
import { bondOrder } from './chem.js';

const D2R = Math.PI / 180;
const isSp = (m, i) => m.nb[i].some((x) => x.o === 3) || m.nb[i].filter((x) => x.o === 2).length === 2;

/* ===================================================================
 * Layout 2D
 * =================================================================== */
export function layout(m, mainPath) {
  const n = m.atoms.length, P = new Array(n).fill(null), placed = new Set();
  const put = (i, x, y) => { P[i] = [x, y]; placed.add(i); };
  const ringPlace = (r, entry, theta) => { // entra no anel pelo átomo "entry" vindo na direção theta
    const k = r.length, R = 1 / (2 * Math.sin(Math.PI / k));
    const e = P[entry], c = [e[0] + R * Math.cos(theta), e[1] + R * Math.sin(theta)];
    const start = r.indexOf(entry), a0 = theta + Math.PI;
    for (let t = 0; t < k; t++) { const at = r[(start + t) % k]; if (placed.has(at) && at !== entry) continue; const a = a0 + t * 2 * Math.PI / k; if (at !== entry) put(at, c[0] + R * Math.cos(a), c[1] + R * Math.sin(a)); }
    r.forEach((at) => { const ext = m.nb[at].filter(({ j }) => !placed.has(j) && !r.includes(j)).map(({ j }) => j); const out = Math.atan2(P[at][1] - c[1], P[at][0] - c[0]); ext.forEach((j, q) => { const ang = out + (ext.length > 1 ? (q ? -1 : 1) * 30 * D2R : 0); put(j, P[at][0] + Math.cos(ang), P[at][1] + Math.sin(ang)); grow(j, at, ang, 1); }); });
  };
  function grow(a, from, theta, turn) {
    if (m.ringOf[a] >= 0) { const r = m.rings[m.ringOf[a]]; if (!r.every((x) => x === a || !placed.has(x))) return; ringPlace(r, a, theta); return; }
    const kids = m.nb[a].map(({ j }) => j).filter((j) => !placed.has(j));
    if (!kids.length) return;
    // ordena: ramos maiores continuam a "cadeia"
    const size = (j) => { const seen = new Set([a, j]), st = [j]; let c = 0; while (st.length) { const x = st.pop(); c++; m.nb[x].forEach(({ j: y }) => { if (!seen.has(y)) { seen.add(y); st.push(y); } }); } return c; };
    kids.sort((x, y) => size(y) - size(x));
    let angs;
    if (isSp(m, a)) angs = [theta];
    else if (kids.length === 1) angs = [theta + turn * 60 * D2R];
    else if (kids.length === 2) angs = [theta + turn * 60 * D2R, theta - turn * 60 * D2R];
    else angs = [theta, theta + 90 * D2R, theta - 90 * D2R];
    kids.forEach((j, q) => { const ang = angs[q] ?? theta; put(j, P[a][0] + Math.cos(ang), P[a][1] + Math.sin(ang)); });
    kids.forEach((j, q) => grow(j, a, angs[q] ?? theta, q === 0 ? -turn : turn));
  }
  // início: anel principal ou cadeia principal
  let path = mainPath && mainPath.length ? mainPath : longestPath(m, true);
  if (!mainPath && m.rings.length && path.length < 3) { const r = m.rings[0]; path = r.slice(); }
  const inRing = m.ringOf[path[0]] >= 0 && path.every((x) => m.ringOf[x] === m.ringOf[path[0]]);
  if (inRing) {
    const r = m.rings[m.ringOf[path[0]]], k = r.length, R = 1 / (2 * Math.sin(Math.PI / k));
    // ordem do anel segue a numeração (path) para o átomo 1 ficar no alto
    path.forEach((at, t) => { const a = -Math.PI / 2 + t * 2 * Math.PI / k; put(at, R * Math.cos(a), R * Math.sin(a)); });
    path.forEach((at) => { const ext = m.nb[at].filter(({ j }) => !placed.has(j)).map(({ j }) => j); const out = Math.atan2(P[at][1], P[at][0]); ext.forEach((j, q) => { const ang = out + (ext.length > 1 ? (q ? -1 : 1) * 32 * D2R : 0); put(j, P[at][0] + Math.cos(ang), P[at][1] + Math.sin(ang)); grow(j, at, ang, 1); }); });
  } else {
    let ang = 30 * D2R, sgn = 1;
    path.forEach((at, t) => {
      if (t === 0) { put(at, 0, 0); return; }
      const prev = path[t - 1];
      if (t > 1 && !isSp(m, prev)) { ang = ang - sgn * 60 * D2R; sgn = -sgn; }
      put(at, P[prev][0] + Math.cos(ang), P[prev][1] + Math.sin(ang));
    });
    // ramos: saem pelo lado "de fora" de cada vértice
    path.forEach((at, t) => {
      const ext = m.nb[at].map(({ j }) => j).filter((j) => !placed.has(j));
      if (!ext.length) return;
      let out;
      const nbP = m.nb[at].map(({ j }) => j).filter((j) => placed.has(j));
      if (nbP.length === 1) { const p = P[nbP[0]]; out = Math.atan2(P[at][1] - p[1], P[at][0] - p[0]); if (ext.length === 1 && !isSp(m, at)) out += (t === 0 ? 1 : -1) * (m.nb[at].length > 2 ? 0 : 60) * D2R * (P[at][1] > p[1] ? -1 : 1); }
      else { const v = nbP.reduce((s, j) => { const d = [P[j][0] - P[at][0], P[j][1] - P[at][1]]; const l = Math.hypot(...d); return [s[0] - d[0] / l, s[1] - d[1] / l]; }, [0, 0]); out = Math.atan2(v[1], v[0]); }
      const spread = ext.length === 1 ? [0] : ext.length === 2 ? (nbP.length === 1 ? [-60, 60] : [-36, 36]) : [-60, 0, 60];
      ext.forEach((j, q) => { const a = out + spread[q] * D2R; put(j, P[at][0] + Math.cos(a), P[at][1] + Math.sin(a)); grow(j, at, a, spread[q] >= 0 ? 1 : -1); });
    });
  }
  // componentes não alcançados (segurança)
  for (let i = 0; i < n; i++) if (!placed.has(i)) { put(i, i * 0.8, 3); }
  return P;
}
export function longestPath(m, acyclic) {
  const n = m.atoms.length;
  const ok = (i) => !acyclic || m.ringOf[i] < 0;
  const start = m.atoms.findIndex((_, i) => ok(i));
  if (start < 0) return [];
  const bfs = (s) => { const prev = new Array(n).fill(-1), dist = new Array(n).fill(-1); dist[s] = 0; const q = [s]; while (q.length) { const u = q.shift(); m.nb[u].forEach(({ j }) => { if (dist[j] < 0 && ok(j)) { dist[j] = dist[u] + 1; prev[j] = u; q.push(j); } }); } let far = s; dist.forEach((d, i) => { if (d > dist[far]) far = i; }); const p = [far]; while (prev[p[0]] >= 0) p.unshift(prev[p[0]]); return p; };
  // maior caminho entre todos os componentes acíclicos
  let best = [];
  m.atoms.forEach((_, i) => { if (!ok(i)) return; const a = bfs(i); const b = bfs(a[a.length - 1]); if (b.length > best.length) best = b; });
  return best;
}

/* ===================================================================
 * Desenho
 * o: { full: bool (todos os átomos e H), hl: {i: cls}, num: {i: n}, bondHl: Set("a-b"), scale, fs, clickable }
 * =================================================================== */
const SUBN = (k) => (k > 1 ? String(k) : '');
function heteroLabel(m, i, P) {
  const a = m.atoms[i], h = a.h;
  if (a.el === 'C') return '';
  const H = h ? 'H' + SUBN(h) : '';
  // grupo à esquerda do vizinho → escreve H antes (HO, H2N)
  const nb = m.nb[i][0];
  const left = nb && P[nb.j][0] > P[i][0] + 0.3 && m.nb[i].length === 1;
  return left && H ? H + a.el : a.el + H;
}
export function toS(m, P, o = {}) {
  const s = new S();
  const n = m.atoms.length;
  const ids = [];
  for (let i = 0; i < n; i++) {
    const a = m.atoms[i];
    let lab;
    if (o.full) lab = a.el === 'C' ? 'C' : heteroLabel(m, i, P).replace(/H\d?/, '') || a.el;
    else lab = a.el === 'C' ? (n === 1 || (m.nb[i].length === 0) ? 'CH' + SUBN(a.h) : '') : heteroLabel(m, i, P);
    if (!o.full && a.el === 'C' && n <= 2 && m.atoms.every((x) => x.el === 'C' || m.nb[i].length) && o.small) lab = 'C';
    if (o.lab && o.lab[i] !== undefined) lab = o.lab[i];
    const opt = {};
    if (a.charge) opt.chg = a.charge > 0 ? '+' : '−';
    if (o.hl && o.hl[i]) opt.cls = o.hl[i];
    if (o.halo && o.halo[i]) opt.halo = o.halo[i];
    if (o.num && o.num[i] !== undefined) { opt.note = String(o.num[i]); opt.nd = numOffset(m, P, i); opt.ncls = 'locant'; }
    ids.push(s.a(P[i][0], P[i][1], lab, opt));
  }
  m.bonds.forEach((b) => {
    const t = b.o;
    const opt = {};
    const key = Math.min(b.a, b.b) + '-' + Math.max(b.a, b.b);
    if (o.bondCls && o.bondCls[key]) opt.cls = o.bondCls[key];
    if (t === 2 && !o.full) { const inRing = m.ringOf[b.a] >= 0 && m.ringOf[b.a] === m.ringOf[b.b]; if (inRing) { const r = m.rings[m.ringOf[b.a]]; const c = r.reduce((acc, x) => [acc[0] + P[x][0] / r.length, acc[1] + P[x][1] / r.length], [0, 0]); const mx = (P[b.a][0] + P[b.b][0]) / 2, my = (P[b.a][1] + P[b.b][1]) / 2; const dx = P[b.b][0] - P[b.a][0], dy = P[b.b][1] - P[b.a][1]; const side = (c[0] - mx) * (-dy) + (c[1] - my) * dx > 0 ? 1 : -1; opt.side = side; } else if (m.atoms[b.a].el === 'C' && m.atoms[b.b].el === 'C' && !m.atoms[b.a].h === false) { /* centrado */ } }
    s.b(ids[b.a], ids[b.b], t, opt);
  });
  if (o.full) {
    // H explícitos em direções livres
    for (let i = 0; i < n; i++) {
      const a = m.atoms[i]; if (!a.h) continue;
      const used = m.nb[i].map(({ j }) => Math.atan2(P[j][1] - P[i][1], P[j][0] - P[i][0]));
      const cand = [0, 90, 180, 270, 45, 135, 225, 315].map((d) => d * D2R);
      const free = cand.filter((c) => used.every((u) => Math.abs(Math.atan2(Math.sin(c - u), Math.cos(c - u))) > 50 * D2R));
      for (let k = 0; k < a.h; k++) { const ang = free[k] ?? cand[k]; const hid = s.a(P[i][0] + Math.cos(ang) * 0.85, P[i][1] + Math.sin(ang) * 0.85, 'H', { cls: 'hfull' }); s.b(ids[i], hid, 1); }
    }
  }
  s._ids = ids;
  return s;
}
function numOffset(m, P, i) {
  const v = m.nb[i].reduce((s, { j }) => { const d = [P[j][0] - P[i][0], P[j][1] - P[i][1]]; const l = Math.hypot(...d) || 1; return [s[0] - d[0] / l, s[1] - d[1] / l]; }, [0, 0]);
  const l = Math.hypot(...v);
  if (l >= 0.35) return [v[0] / l * 0.55, v[1] / l * 0.55];
  // vizinhos equilibrados: usa a bissetriz do maior espaço livre
  const ang = m.nb[i].map(({ j }) => Math.atan2(P[j][1] - P[i][1], P[j][0] - P[i][0])).sort((a, b) => a - b);
  if (!ang.length) return [0, -0.55];
  let best = 0, at = 0;
  ang.forEach((a, k) => { const b = k === ang.length - 1 ? ang[0] + 2 * Math.PI : ang[k + 1]; if (b - a > best) { best = b - a; at = a + (b - a) / 2; } });
  return [Math.cos(at) * 0.55, Math.sin(at) * 0.55];
}
export function drawSVG(m, P, o = {}) {
  const s = toS(m, P, o);
  const svg = render(s, { scale: o.scale || 46, fs: o.fs || 18, zoom: o.zoom || 1.15, maxw: o.maxw, title: o.alt });
  svg.setAttribute('aria-label', o.alt || 'estrutura');
  svg._s = s;
  return svg;
}

/* ===================================================================
 * Fórmula condensada (compostos acíclicos)
 * =================================================================== */
const sub = (t) => t.replace(/(\d)/g, (d) => '₀₁₂₃₄₅₆₇₈₉'[d]);
export function condensed(m) {
  if (m.rings.length) return null;
  const A = m.atoms, n = A.length;
  const skel = (i) => A[i].el === 'C' || (['O', 'N', 'S'].includes(A[i].el) && m.nb[i].filter(({ j }) => A[j].el === 'C').length >= 2);
  const S0 = A.map((_, i) => i).filter(skel);
  if (!S0.length) return null;
  const bfs = (s0) => { const prev = new Array(n).fill(-1), dist = new Array(n).fill(-1); dist[s0] = 0; const q = [s0]; while (q.length) { const u = q.shift(); m.nb[u].forEach(({ j }) => { if (skel(j) && dist[j] < 0) { dist[j] = dist[u] + 1; prev[j] = u; q.push(j); } }); } let far = s0; dist.forEach((d, i) => { if (d > dist[far]) far = i; }); const p = [far]; while (prev[p[0]] >= 0) p.unshift(prev[p[0]]); return p; };
  const fn = (i) => m.nb[i].some(({ j }) => !skel(j) && A[j].el !== 'C') ? 1 : 0;
  // caminho mais longo no esqueleto, preferindo terminar em carbonos funcionais
  const leaves = S0.filter((i) => m.nb[i].filter(({ j }) => skel(j)).length <= 1);
  let base = null, bs = -1;
  leaves.forEach((a) => { const pa = bfsFrom(a); leaves.forEach((b) => { const p = pa(b); if (!p) return; const sc = p.length + 0.5 * (fn(p[0]) + fn(p[p.length - 1])); if (sc > bs) { bs = sc; base = p; } }); });
  if (!base) base = [S0[0]];
  function bfsFrom(s0) { const prev = new Array(n).fill(-1), seen = new Array(n).fill(false); seen[s0] = true; const q = [s0]; while (q.length) { const u = q.shift(); m.nb[u].forEach(({ j }) => { if (skel(j) && !seen[j]) { seen[j] = true; prev[j] = u; q.push(j); } }); } return (t) => { if (!seen[t]) return null; const p = [t]; while (p[0] !== s0) p.unshift(prev[p[0]]); return p; }; }
  const tries = [base, base.slice().reverse()].map((p) => write(p));
  const score = (t) => (/OC(O|=)/.test(t) && !/COO/.test(t) ? -5 : 0) + (/(COOH|CHO|CN|CONH2|NO₂)$/.test(t) ? 3 : 0) + (fn(t.p[t.p.length - 1]) ? 1 : 0) - (fn(t.p[0]) ? 1 : 0) + (/^(HO|H2N|HCO)/.test(t) ? 1 : 0) + (/COO[^H]|HCOO[^H]/.test(t) ? 5 : 0);
  tries.sort((x, y) => score(y) - score(x));
  return sub(tries[0].out);
  function write(path) {
  const onPath = new Set(path);
  const tokOf = (i) => A[i].el + (A[i].h ? 'H' + SUBN(A[i].h) : '');
  const grp = (i, from) => {
    const a = A[i];
    if (a.el === 'N' && m.nb[i].filter(({ j }) => A[j].el === 'O').length === 2) return 'NO2';
    const kids = m.nb[i].filter(({ j }) => j !== from).map(({ j }) => grp(j, i));
    if (!kids.length) return tokOf(i);
    const cnt = {}; kids.forEach((k) => { cnt[k] = (cnt[k] || 0) + 1; });
    const keys = Object.keys(cnt).sort((x, y) => x.length - y.length);
    if (keys.length === 1 && cnt[keys[0]] === 1) return tokOf(i) + keys[0];
    return tokOf(i) + keys.map((k) => '(' + k + ')' + SUBN(cnt[k])).join('');
  };
  let out = '';
  path.forEach((at, k) => {
    const a = A[at];
    if (k) { const o = bondOrder(m, path[k - 1], at); out += o === 2 ? '=' : o === 3 ? '≡' : ''; }
    const side = m.nb[at].filter(({ j }) => !onPath.has(j));
    const dO = side.find(({ j, o }) => o === 2 && A[j].el === 'O');
    let rest = side.filter((x) => x !== dO);
    let tok = tokOf(at);
    const isEnd = k === path.length - 1 && k > 0, isStart = k === 0 && path.length > 1;
    if (dO) {
      const OH = rest.find(({ j }) => A[j].el === 'O' && A[j].h === 1);
      const NH = rest.find(({ j }) => A[j].el === 'N' && !skel(j));
      if (OH) { out += (k === 0 && A[at].h ? 'HC' : k === 0 && path.length > 1 ? 'HOOC' : tokOf(at)) + (k === 0 && path.length > 1 && !A[at].h ? '' : 'OOH'); rest = rest.filter((x) => x !== OH); if (!rest.length) return; tok = ''; }
      else if (NH && (isEnd || path.length === 1)) { out += (k === 0 && A[at].h === 1 ? 'HCO' : tok + 'O') + grp(NH.j, at); return; }
      else if (k === 0 && A[at].h === 1) tok = 'HCO';
      else if (k === 0 && A[at].h === 2) tok = 'HCHO';
      else tok += 'O';
    }
    const cnt = {}; rest.forEach(({ j }) => { const g = grp(j, at); cnt[g] = (cnt[g] || 0) + 1; });
    const keys = Object.keys(cnt);
    let tail = '';
    if (keys.length === 1 && cnt[keys[0]] === 1 && (isEnd || path.length === 1) && !/C(?!l)/.test(keys[0])) tail = keys[0];
    else if (keys.length === 1 && cnt[keys[0]] === 1 && isStart && !/C(?!l)/.test(keys[0])) { const g = keys[0]; out += (g === 'OH' ? 'HO' : g === 'NH2' ? 'H2N' : g === 'NO2' ? 'O2N' : g) + tok; return; }
    else tail = keys.map((g) => '(' + g + ')' + SUBN(cnt[g])).join('');
    out += tok + tail;
  });
  const res = new String(out); res.p = path; res.out = out; return res;
  }
}
