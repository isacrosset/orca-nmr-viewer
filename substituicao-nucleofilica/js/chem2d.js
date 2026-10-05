/*
 * chem2d.js — estruturas químicas 2D em SVG (vetorial).
 *
 * spec = {
 *   atoms: [[x, y, rótulo?, { cls, chg, lp, d, halo, note, nd }]],
 *   bonds: [[i, j, tipo, { cls }]]      tipo: 1 | 2 | 3 | 'w' | 'h' | 'p' (parcial, tracejada)
 *   arrows: [{ from, to, bend, cls }]    from/to: {a:i} | {lp:[i,k]} | {b:[i,j]} | {xy:[x,y]}
 *   texts: [[x, y, texto, cls, fs]]
 *   rxn: [[x1, x2, y, rótulo?]]          seta de reação
 * }
 * Coordenadas em comprimentos de ligação; y para baixo.
 */

const NS = 'http://www.w3.org/2000/svg';
let UID = 0;
const fmt = (n) => Math.round(n * 100) / 100;

export function el(tag, attrs, parent) {
  const e = document.createElementNS(NS, tag);
  if (attrs) for (const k in attrs) if (attrs[k] !== null && attrs[k] !== undefined) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}

function tokens(label) {
  const out = [];
  const re = /\d+|[^\d]+/g;
  let m, prev = '';
  while ((m = re.exec(label))) {
    const s = m[0];
    out.push({ s, sub: /^\d/.test(s) && /[A-Za-z)\]]$/.test(prev) });
    prev = s;
  }
  return out;
}
export function labelWidth(label, fs) {
  let w = 0;
  for (const t of tokens(String(label))) w += t.s.length * fs * (t.sub ? 0.46 : 0.62);
  return w;
}
export function text(parent, x, y, label, attrs) {
  const t = el('text', Object.assign({ x: fmt(x), y: fmt(y), 'text-anchor': 'middle', 'dominant-baseline': 'central' }, attrs || {}), parent);
  let shifted = false;
  for (const tok of tokens(String(label))) {
    if (tok.sub) { el('tspan', { dy: '0.32em', 'font-size': '72%' }, t).textContent = tok.s; shifted = true; }
    else { el('tspan', shifted ? { dy: '-0.32em' } : null, t).textContent = tok.s; shifted = false; }
  }
  return t;
}

function elemClass(label) {
  const m = /^(Br|Cl|I|O|N|S)/.exec(label || '');
  return m ? m[1] : '';
}

function trim(a, b, fs) {
  if (!a.label) return { x: a.x, y: a.y };
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
  const ux = dx / L, uy = dy / L;
  const rx = a.w / 2 + 3, ry = fs * 0.66;
  const t = 1 / Math.sqrt((ux / rx) ** 2 + (uy / ry) ** 2);
  return { x: a.x + ux * t, y: a.y + uy * t };
}

function drawBond(g, A, B, type, bo, fs) {
  const p = trim(A, B, fs), q = trim(B, A, fs);
  const dx = q.x - p.x, dy = q.y - p.y, L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L;
  const cls = 'bond' + (bo.cls ? ' ' + bo.cls : '');
  const line = (x1, y1, x2, y2, c) => el('line', { x1: fmt(x1), y1: fmt(y1), x2: fmt(x2), y2: fmt(y2), class: c || cls }, g);
  if (type === 1) line(p.x, p.y, q.x, q.y);
  else if (type === 'p') line(p.x, p.y, q.x, q.y, cls + ' partial');
  else if (type === 2) {
    if (bo.side) {
      line(p.x, p.y, q.x, q.y);
      const o = 5.5 * bo.side, sh = A.label || B.label ? 0 : 0.14;
      line(p.x + nx * o + dx * sh, p.y + ny * o + dy * sh, q.x + nx * o - dx * sh, q.y + ny * o - dy * sh);
    } else {
      line(p.x + nx * 2.8, p.y + ny * 2.8, q.x + nx * 2.8, q.y + ny * 2.8);
      line(p.x - nx * 2.8, p.y - ny * 2.8, q.x - nx * 2.8, q.y - ny * 2.8);
    }
  } else if (type === 3) {
    line(p.x, p.y, q.x, q.y);
    line(p.x + nx * 4.2, p.y + ny * 4.2, q.x + nx * 4.2, q.y + ny * 4.2);
    line(p.x - nx * 4.2, p.y - ny * 4.2, q.x - nx * 4.2, q.y - ny * 4.2);
  } else if (type === 'w') {
    const w = 4.6;
    el('polygon', { points: `${fmt(p.x)},${fmt(p.y)} ${fmt(q.x + nx * w)},${fmt(q.y + ny * w)} ${fmt(q.x - nx * w)},${fmt(q.y - ny * w)}`, class: 'wedge' }, g);
  } else if (type === 'h') {
    const n = Math.max(5, Math.round(L / 4.4));
    for (let i = 1; i <= n; i++) {
      const t = i / n, w = 0.7 + 4.2 * t, cx = p.x + dx * t, cy = p.y + dy * t;
      line(cx + nx * w, cy + ny * w, cx - nx * w, cy - ny * w, 'hash');
    }
  }
}

function lpPos(a, ang, fs) {
  const r = (a.label ? Math.max(a.w / 2, fs * 0.45) : 4) + 7;
  const t = ang * Math.PI / 180;
  return { x: a.x + Math.cos(t) * r, y: a.y - Math.sin(t) * r, t };
}

function addMarkers(svg) {
  const defs = el('defs', null, svg);
  const id = 'm' + (++UID);
  ['', 'o', 'c', 'g'].forEach((c) => {
    const mk = el('marker', { id: id + c, viewBox: '0 0 10 10', refX: 7.5, refY: 5, markerWidth: 5.5, markerHeight: 5.5, orient: 'auto-start-reverse' }, defs);
    el('path', { d: 'M0,0 L10,5 L0,10 z', class: 'arrowhead' + (c ? ' ' + c : '') }, mk);
  });
  return id;
}

/** Desenha a estrutura dentro de um <g>; devolve { g, bbox } */
export function render(spec, o, parentSvg, mid) {
  o = Object.assign({ scale: 44, fs: 17, pad: 16 }, o || {});
  const s = o.scale, fs = o.fs;
  const A = (spec.atoms || []).map((a) => {
    const label = a[2] || '';
    const fs2 = (a[3] && a[3].fs) || fs;
    return { x: a[0] * s, y: a[1] * s, label, opt: a[3] || {}, w: label ? labelWidth(label, fs2) : 0, fs: fs2 };
  });
  let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
  const grow = (x0, y0, x1, y1) => { minx = Math.min(minx, x0); miny = Math.min(miny, y0); maxx = Math.max(maxx, x1); maxy = Math.max(maxy, y1); };
  A.forEach((a) => {
    const hw = a.label ? a.w / 2 + 4 : 4, hh = a.label ? a.fs * 0.75 : 4;
    grow(a.x - hw - 10, a.y - hh - 8, a.x + hw + 12, a.y + hh + 8);
  });
  (spec.texts || []).forEach((t) => { const w = labelWidth(t[2], t[4] || fs) / 2 + 4; grow(t[0] * s - w, t[1] * s - 14, t[0] * s + w, t[1] * s + 14); });
  (spec.rxn || []).forEach((r) => grow(r[0] * s, r[2] * s - 26, r[1] * s, r[2] * s + 22));
  (spec.arrows || []).forEach((ar) => {
    const P = endpoint(ar.from, A, fs, s), Q = endpoint(ar.to, A, fs, s);
    const c = ctrl(P, Q, ar.bend === undefined ? 0.5 : ar.bend);
    grow(Math.min(P.x, Q.x, c.x) - 6, Math.min(P.y, Q.y, c.y) - 6, Math.max(P.x, Q.x, c.x) + 6, Math.max(P.y, Q.y, c.y) + 6);
  });
  if (!isFinite(minx)) { minx = 0; miny = 0; maxx = 10; maxy = 10; }
  const g = el('g', null, parentSvg);
  const layers = { halo: el('g', null, g), bonds: el('g', null, g), atoms: el('g', null, g), arrows: el('g', null, g) };
  A.forEach((a) => {
    if (a.opt.halo) {
      const r = a.label ? Math.max(15, a.w / 2 + 8) : 13;
      el('circle', { cx: fmt(a.x), cy: fmt(a.y), r, class: 'halo ' + (a.opt.halo === true ? '' : a.opt.halo) }, layers.halo);
    }
  });
  (spec.bonds || []).forEach((b) => drawBond(layers.bonds, A[b[0]], A[b[1]], b[2] === undefined ? 1 : b[2], b[3] || {}, fs));
  A.forEach((a) => {
    if (a.label) {
      const cls = 'atom ' + elemClass(a.label) + (a.opt.cls ? ' ' + a.opt.cls : '');
      text(layers.atoms, a.x, a.y, a.label, { class: cls, 'font-size': a.fs });
    }
    if (a.opt.chg) {
      const cx = a.x + (a.label ? a.w / 2 + 5 : 9), cy = a.y - a.fs * 0.62;
      text(layers.atoms, cx, cy, a.opt.chg, { class: 'chg', 'font-size': a.fs * 0.85 });
    }
    if (a.opt.d) {
      const nd = a.opt.dd || [0, -0.62];
      text(layers.atoms, a.x + nd[0] * s, a.y + nd[1] * s, a.opt.d === '+' ? 'δ+' : 'δ−', { class: 'dlt ' + (a.opt.d === '+' ? 'p' : 'm'), 'font-size': a.fs * 0.8 });
    }
    if (a.opt.note) {
      const nd = a.opt.nd || [0, 0.7];
      text(layers.atoms, a.x + nd[0] * s, a.y + nd[1] * s, a.opt.note, { class: 'note' + (a.opt.ncls ? ' ' + a.opt.ncls : ''), 'font-size': a.fs * 0.72 });
    }
    (a.opt.lp || []).forEach((ang) => {
      const p = lpPos(a, ang, a.fs);
      const ox = Math.sin(p.t) * 3.2, oy = Math.cos(p.t) * 3.2;
      el('circle', { cx: fmt(p.x + ox), cy: fmt(p.y + oy), r: 1.9, class: 'lp' }, layers.atoms);
      el('circle', { cx: fmt(p.x - ox), cy: fmt(p.y - oy), r: 1.9, class: 'lp' }, layers.atoms);
    });
  });
  (spec.texts || []).forEach((t) => text(layers.atoms, t[0] * s, t[1] * s, t[2], { class: t[3] || '', 'font-size': t[4] || fs }));
  (spec.rxn || []).forEach((r) => {
    const y = r[2] * s;
    el('line', { x1: r[0] * s, y1: y, x2: r[1] * s - 4, y2: y, class: 'rxn', 'marker-end': `url(#${mid}g)` }, layers.arrows);
    if (r[3]) text(layers.atoms, (r[0] + r[1]) / 2 * s, y - 14, r[3], { class: 'cond', 'font-size': 13 });
    if (r[4]) text(layers.atoms, (r[0] + r[1]) / 2 * s, y + 14, r[4], { class: 'cond', 'font-size': 13 });
  });
  (spec.arrows || []).forEach((ar) => {
    const P = endpoint(ar.from, A, fs, s), Q = endpoint(ar.to, A, fs, s, true);
    const c = ctrl(P, Q, ar.bend === undefined ? 0.5 : ar.bend);
    const cls = ar.cls || '';
    el('path', {
      d: `M${fmt(P.x)},${fmt(P.y)} Q${fmt(c.x)},${fmt(c.y)} ${fmt(Q.x)},${fmt(Q.y)}`,
      class: 'arrow ' + cls + (o.animate ? ' draw' : ''), pathLength: 100,
      'marker-end': `url(#${mid}${cls})`,
    }, layers.arrows);
  });
  return { g, bbox: { minx, miny, maxx, maxy }, atoms: A };
}

function endpoint(e, A, fs, s, isHead) {
  if (!e) return { x: 0, y: 0 };
  if (e.xy) return { x: e.xy[0] * s, y: e.xy[1] * s };
  if (e.lp) { const a = A[e.lp[0]]; const p = lpPos(a, e.lp[1], a.fs); return { x: p.x, y: p.y }; }
  if (e.b) {
    const a = A[e.b[0]], b = A[e.b[1]];
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }
  if (e.a !== undefined) {
    const a = A[e.a];
    const r = (a.label ? Math.max(a.w / 2, fs * 0.5) : 5) + (isHead ? 7 : 4);
    const ang = (e.ang !== undefined ? e.ang : 90) * Math.PI / 180;
    return { x: a.x + Math.cos(ang) * r, y: a.y - Math.sin(ang) * r };
  }
  return { x: 0, y: 0 };
}
function ctrl(P, Q, bend) {
  const mx = (P.x + Q.x) / 2, my = (P.y + Q.y) / 2;
  const dx = Q.x - P.x, dy = Q.y - P.y;
  return { x: mx - dy * bend, y: my + dx * bend };
}

/** SVG completo de uma estrutura */
export function mol(spec, o) {
  o = Object.assign({ pad: 14 }, o || {});
  const svg = el('svg', { class: 'chem', role: 'img' });
  if (o.title || spec.title) el('title', null, svg).textContent = o.title || spec.title;
  const mid = addMarkers(svg);
  const { g, bbox, atoms } = render(spec, o, svg, mid);
  const W = bbox.maxx - bbox.minx + 2 * o.pad, H = bbox.maxy - bbox.miny + 2 * o.pad;
  const tr = `translate(${fmt(o.pad - bbox.minx)},${fmt(o.pad - bbox.miny)})`;
  g.setAttribute('transform', tr);
  // usado por componentes interativos (alvos clicáveis sobre átomos/ligações)
  svg._chem = { atoms, transform: tr, mid, lpPos: (i, ang) => lpPos(atoms[i], ang, atoms[i].fs), fs: o.fs || 17 };
  svg.setAttribute('viewBox', `0 0 ${fmt(W)} ${fmt(H)}`);
  svg.style.maxWidth = (o.maxw || Math.ceil(W * (o.zoom || 1))) + 'px';
  if (o.minh) svg.style.minHeight = o.minh + 'px';
  return svg;
}

/* ---------- helpers geométricos ---------- */

export function zig(n, x0 = 0, y0 = 0, up = false) {
  const pts = [];
  for (let i = 0; i < n; i++) pts.push([x0 + i * 0.866, y0 + ((i % 2 === 0) === up ? -0.25 : 0.25)]);
  return pts;
}
export function ringPts(n, cx, cy, startDeg) {
  const R = 1 / (2 * Math.sin(Math.PI / n));
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (startDeg + i * 360 / n) * Math.PI / 180;
    pts.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]);
  }
  return pts;
}

/** builder fluente: S().a(x,y,lab,opt) ... */
export class S {
  constructor() { this.atoms = []; this.bonds = []; this.arrows = []; this.texts = []; this.rxn = []; }
  a(x, y, label, opt) { this.atoms.push([x, y, label || '', opt || {}]); return this.atoms.length - 1; }
  b(i, j, t, opt) { this.bonds.push([i, j, t === undefined ? 1 : t, opt || {}]); return this; }
  /* ramo a partir do átomo i, direção em graus (0 = direita, 90 = cima) */
  br(i, deg, label, t, opt, len) {
    const a = this.atoms[i], r = deg * Math.PI / 180, L = len || 1;
    const k = this.a(a[0] + Math.cos(r) * L, a[1] - Math.sin(r) * L, label, opt);
    this.b(i, k, t);
    return k;
  }
  arrow(from, to, bend, cls) { this.arrows.push({ from, to, bend, cls }); return this; }
  t(x, y, s, cls, fs) { this.texts.push([x, y, s, cls, fs]); return this; }
  plus(x, y) { return this.t(x, y, '+', 'plus', 24); }
  r(x1, x2, y, top, bot) { this.rxn.push([x1, x2, y, top, bot]); return this; }
  shift(dx, dy, from = 0) { for (let i = from; i < this.atoms.length; i++) { this.atoms[i][0] += dx; this.atoms[i][1] += dy; } return this; }
  get n() { return this.atoms.length; }
  svg(o) { return mol(this, o); }
}
