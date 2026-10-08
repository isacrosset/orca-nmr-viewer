/*
 * arom2d.js — desenho 2D (SVG) de anéis conjugados a partir do modelo
 * (arom.js), formas de Kekulé, híbrido com círculo, íon arênio (complexo σ),
 * esquemas de reação e diagramas de energia.
 */
import { S, mol, el as sel } from './chem2d.js';
import { geometry, TYPES } from './arom.js';

const SC = 1 / 1.4;
/** desenho de um modelo; o: {mode:'kekule'|'hybrid', alt:true (outra Kekulé), notes:{i:txt}, halo:{i:cls}, hl:{i:cls}, sp3:[], lp:true, scale} */
export function ringS(def, o = {}) {
  const G = geometry(def, { sp3: o.sp3, twist: 0 });
  const s = new S();
  const N = G.ringN;
  const ids = [];
  G.atoms.forEach((a, i) => {
    if (i >= N) return;
    const T = TYPES[a.type] || TYPES.C;
    let lab = a.el === 'C' ? '' : a.el;
    const opt = {};
    if (T.q && T.q !== '•' && !(o.mode === 'hybrid' && o.centerCharge)) opt.chg = T.q;
    if (o.hl && o.hl[i]) opt.cls = o.hl[i];
    if (o.halo && o.halo[i]) opt.halo = o.halo[i];
    if (o.notes && o.notes[i] !== undefined) { opt.note = String(o.notes[i]); opt.nd = [-a.out[0] * 0.5, a.out[1] * 0.5]; opt.ncls = 'enote'; }
    if (a.type === 'CH2' && o.showSp3 !== false) { lab = 'CH₂'; opt.cls = (opt.cls || '') + ' sp3'; }
    ids.push(s.a(a.p[0] * SC, -a.p[1] * SC, lab, opt));
  });
  // H explícitos só em N–H e quando pedido
  G.atoms.forEach((a, i) => {
    if (i < N) return;
    const b = G.bonds.find((x) => x[1] === i), host = b[0];
    if (G.atoms[host].el === 'N' || o.allH) { const k = s.a(a.p[0] * SC, -a.p[1] * SC, 'H', {}); s.b(ids[host], k, 1); }
  });
  G.bonds.forEach(([a, b, ord]) => {
    if (a >= N || b >= N) return;
    let t = ord;
    if (def.kind !== 'fused' && o.alt && def.n === 6 && def.types.every((x) => x === 'C' || x === 'N')) t = ord === 2 ? 1 : 2;
    if (o.mode === 'hybrid' && G.atoms[a].hasP && G.atoms[b].hasP) t = 1;
    const opt = {};
    if (t === 2) { const c = ringCenter(G, a, b); const mx = (G.atoms[a].p[0] + G.atoms[b].p[0]) / 2, my = (G.atoms[a].p[1] + G.atoms[b].p[1]) / 2; const dx = G.atoms[b].p[0] - G.atoms[a].p[0], dy = G.atoms[b].p[1] - G.atoms[a].p[1]; opt.side = ((c[0] - mx) * (dy) + (c[1] - my) * (-dx)) > 0 ? 1 : -1; }
    s.b(ids[a], ids[b], t, opt);
  });
  // pares isolados (pontos livres): no sistema π (magenta) × no plano (ciano)
  if (o.lp !== false) G.atoms.forEach((a, i) => {
    if (i >= N) return;
    const T = TYPES[a.type]; if (!T) return;
    const out = [a.out[0], -a.out[1]];
    const base = Math.atan2(out[1], out[0]);
    const list = [];
    if (a.type === 'N') list.push([0, 'lpin']);
    if (a.type === 'NH') list.push([0.95, 'lppi']);
    if (a.type === 'O' || a.type === 'S') { list.push([0.62, 'lppi']); list.push([-0.62, 'lpin']); }
    if (a.type === 'C-') list.push([0, 'lppi']);
    list.forEach(([off, cls]) => { const t = base + off, r = 0.36; s.e(a.p[0] * SC + Math.cos(t) * r, -a.p[1] * SC + Math.sin(t) * r, 2, cls, -(t * 180 / Math.PI) + 90); });
  });
  s._G = G; s._ids = ids;
  return s;
}
function ringCenter(G, a, b) {
  const pts = G.atoms.slice(0, G.ringN).map((x) => x.p);
  if (G.def.kind !== 'fused') return [pts.reduce((t, p) => t + p[0], 0) / pts.length, pts.reduce((t, p) => t + p[1], 0) / pts.length];
  // centro do hexágono mais próximo do ponto médio
  const mx = (G.atoms[a].p[0] + G.atoms[b].p[0]) / 2, my = (G.atoms[a].p[1] + G.atoms[b].p[1]) / 2;
  let best = null, bd = 1e9;
  const D = Math.sqrt(3) * 1.4, cx = pts.reduce((t, p) => t + p[0], 0) / pts.length, cy = pts.reduce((t, p) => t + p[1], 0) / pts.length;
  G.def.centers.forEach(([x, y]) => { const c = [x * D / 2, y * D / 2]; const cc = [c[0] - (cx + pts.reduce((t) => t, 0) * 0), c[1]]; void cc; });
  // aproximação: usa o centro geométrico dos 6 vizinhos mais próximos
  const near = pts.slice().sort((p, q) => Math.hypot(p[0] - mx, p[1] - my) - Math.hypot(q[0] - mx, q[1] - my)).slice(0, 6);
  best = [near.reduce((t, p) => t + p[0], 0) / 6, near.reduce((t, p) => t + p[1], 0) / 6]; void bd;
  return best;
}
export function ringSVG(def, o = {}) {
  const s = ringS(def, o);
  const svg = mol(s, { scale: o.scale || 46, fs: o.fs || 18, zoom: o.zoom || 1.2, maxw: o.maxw });
  svg.setAttribute('aria-label', (def.name || 'estrutura') + (o.mode === 'hybrid' ? ' (híbrido de ressonância)' : ''));
  if (o.mode === 'hybrid') addCircles(svg, s, def, o);
  svg._s = s;
  return svg;
}
function addCircles(svg, s, def, o) {
  const C = svg._chem, G = s._G;
  const g = sel('g', { transform: C.transform }, svg);
  const N = G.ringN;
  const pts = C.atoms.slice(0, N);
  const cx0 = pts.reduce((t, p) => t + p.x, 0) / N, cy0 = pts.reduce((t, p) => t + p.y, 0) / N;
  if (def.kind !== 'fused') {
    const r = Math.min(...pts.map((p) => Math.hypot(p.x - cx0, p.y - cy0))) * 0.6;
    sel('circle', { cx: cx0, cy: cy0, r, class: 'arcircle' }, g);
    if (o.centerCharge) { const t = sel('text', { x: cx0, y: cy0, 'text-anchor': 'middle', 'dominant-baseline': 'central', class: 'chg', 'font-size': 20 }, g); t.textContent = o.centerCharge; }
  } else {
    // um círculo por anel (convenção comum; ver texto sobre sistemas fundidos)
    const sc = (o.scale || 46) * SC;
    const ax = pts[0].x - G.atoms[0].p[0] * sc, ay = pts[0].y + G.atoms[0].p[1] * sc;
    G.centers.forEach(([x, y]) => sel('circle', { cx: ax + x * sc, cy: ay - y * sc, r: 1.4 * sc * 0.55, class: 'arcircle' }, g));
  }
}

/* ===================================================================
 * Benzeno e íon arênio desenhados à mão (mecanismos)
 * anel: átomo 0 no topo, sentido horário
 * =================================================================== */
const HEX = [0, 1, 2, 3, 4, 5].map((k) => { const t = -Math.PI / 2 + k * Math.PI / 3; return [Math.cos(t), Math.sin(t)]; });
/** o: {kek:'A'|'B'|'hyb', sub: rótulo no C0, H0: true, x, y, arenium: 'A'|'B'|'C', E, hl} → S e índices */
export function benz(s, o = {}) {
  const x0 = o.x || 0, y0 = o.y || 0, R = o.R || 1;
  const id = HEX.map(([x, y], k) => s.a(x0 + x * R, y0 + y * R, '', o.hl && o.hl[k] ? { cls: o.hl[k] } : {}));
  let dbl;
  if (o.arenium) dbl = { A: [[2, 3], [4, 5]], B: [[1, 2], [4, 5]], C: [[1, 2], [3, 4]] }[o.arenium];
  else dbl = o.kek === 'B' ? [[1, 2], [3, 4], [5, 0]] : [[0, 1], [2, 3], [4, 5]];
  for (let k = 0; k < 6; k++) { const a = k, b = (k + 1) % 6; const d = o.kek !== 'hyb' && dbl.some(([p, q]) => (p === a && q === b) || (p === b && q === a)); s.b(id[a], id[b], d ? 2 : (o.kek === 'hyb' ? 1 : 1), d ? { side: 1 } : {}); }
  const subs = {};
  if (o.arenium) {
    const plus = { A: 1, B: 3, C: 5 }[o.arenium];
    s.atoms[id[plus]][3] = Object.assign({}, s.atoms[id[plus]][3], { chg: '+' });
    subs.E = s.br(id[0], 135, o.E || 'E', 1); s.atoms[subs.E][3] = { cls: 'elec' };
    subs.H = s.br(id[0], 45, 'H', 1);
  } else if (o.sub) { subs.E = s.br(id[0], 90, o.sub, 1); s.atoms[subs.E][3] = { cls: o.subCls || 'elec' }; }
  else if (o.H0) subs.H = s.br(id[0], 90, 'H', 1);
  if (o.kek === 'hyb') (s._circles = s._circles || []).push([x0, y0, R * 0.58]);
  return { id, subs };
}
export function svgS(s, o = {}) {
  const svg = mol(s, { scale: o.scale || 46, fs: o.fs || 18, zoom: o.zoom || 1.2, maxw: o.maxw, animate: o.animate });
  if (s._circles) { const C = svg._chem, g = sel('g', { transform: C.transform }, svg); const sc = o.scale || 46; const c0 = C.atoms[0]; const ax = c0.x - s.atoms[0][0] * sc, ay = c0.y - s.atoms[0][1] * sc; s._circles.forEach((c) => sel('circle', { cx: ax + c[0] * sc, cy: ay + c[1] * sc, r: c[2] * sc, class: 'arcircle' }, g)); }
  return svg;
}
/** cicloexeno */
export function cyclohexene(s, o = {}) {
  const x0 = o.x || 0, y0 = o.y || 0;
  const id = HEX.map(([x, y], k) => s.a(x0 + x, y0 + y, '', {}));
  for (let k = 0; k < 6; k++) s.b(id[k], id[(k + 1) % 6], o.dibromo ? 1 : k === 0 ? 2 : 1, k === 0 && !o.dibromo ? { side: 1 } : {});
  if (o.dibromo) { const a = s.br(id[0], 90, 'Br', 'w'); const b = s.br(id[1], 30, 'Br', 'h'); s.atoms[a][3] = { cls: 'elec' }; s.atoms[b][3] = { cls: 'elec' }; }
  return id;
}

/* ===================================================================
 * Diagramas (SVG simples)
 * =================================================================== */
const NS = 'http://www.w3.org/2000/svg';
export function svgEl(w, h, label) { const s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', `0 0 ${w} ${h}`); s.setAttribute('class', 'energy'); s.setAttribute('role', 'img'); s.setAttribute('aria-label', label); return s; }
export function add(svg, tag, at, txt) { const e = document.createElementNS(NS, tag); Object.entries(at).forEach(([k, v]) => e.setAttribute(k, v)); if (txt !== undefined) e.textContent = txt; svg.append(e); return e; }
/** perfil de energia: pts [[x, y, rótulo, tipo]] com y em unidades arbitrárias (maior = mais energia) */
export function profile(svg, pts, o = {}) {
  const W = +svg.getAttribute('viewBox').split(' ')[2], H = +svg.getAttribute('viewBox').split(' ')[3];
  const x0 = 50, x1 = W - 20, y0 = 20, y1 = H - 40;
  const ymin = o.ymin ?? Math.min(...pts.map((p) => p[1])) - 10, ymax = o.ymax ?? Math.max(...pts.map((p) => p[1])) + 10;
  const X = (x) => x0 + x * (x1 - x0), Y = (y) => y1 - (y - ymin) / (ymax - ymin) * (y1 - y0);
  let d = `M${X(pts[0][0])},${Y(pts[0][1])}`;
  for (let i = 1; i < pts.length; i++) { const [xa, ya] = pts[i - 1], [xb, yb] = pts[i]; const xm = (X(xa) + X(xb)) / 2; d += ` C${xm},${Y(ya)} ${xm},${Y(yb)} ${X(xb)},${Y(yb)}`; }
  add(svg, 'path', { d, class: 'curve ' + (o.cls || '') });
  pts.forEach(([x, y, lab, k]) => { if (!lab) return; add(svg, 'circle', { cx: X(x), cy: Y(y), r: 5, class: 'pt ' + (k || '') }); add(svg, 'text', { x: X(x), y: Y(y) + (k === 'ts' ? -12 : 20), 'text-anchor': 'middle', class: 'lab' }, lab); });
  return { X, Y };
}
