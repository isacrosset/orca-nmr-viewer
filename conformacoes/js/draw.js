/*
 * draw.js — desenhos SVG gerados a partir da MESMA geometria do 3D:
 * projeção de Newman, cavalete (com interpolação Newman ↔ cavalete),
 * perfil de energia interativo e cadeira 2D do ciclo-hexano.
 */
import { el, text, labelWidth, mol, S } from './chem2d.js';
import { GROUPS, rotorAngles, norm360, ringGeom, V } from './conf.js';

const NS = 'http://www.w3.org/2000/svg';
const lab = (g) => GROUPS[g] ? GROUPS[g].t.replace('CH₂CH₃', 'Et').replace('CH(CH₃)₂', 'i-Pr').replace('C(CH₃)₃', 't-Bu') : g;

/* ===================================================================
 * Newman
 * data: { front: [[grupo, ângulo]], back: [[grupo, ângulo]] }
 * =================================================================== */
export function newmanData(R, phi, dir = 'fwd') {
  const A = rotorAngles(R, phi);
  if (dir === 'rev') return { front: R.back.map((g, i) => [g, norm360(180 - A.ba[i])]), back: R.front.map((g, i) => [g, norm360(180 - A.fa[i])]) };
  return { front: R.front.map((g, i) => [g, A.fa[i]]), back: R.back.map((g, i) => [g, A.ba[i]]) };
}
export function newmanSVG(data, o = {}) {
  const fs = (o.maxw && o.maxw <= 210) ? 21 : (o.fs || 15), Rc = 34, L = 70, pad = 14;
  const S2 = 2 * (L + 10 + 44 + pad);
  const c = S2 / 2;
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${S2} ${S2}`); svg.setAttribute('class', 'chem newman'); svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', o.alt || ('Projeção de Newman. Frente: ' + data.front.map((x) => lab(x[0]) + ' a ' + Math.round(x[1]) + '°').join(', ') + '. Trás: ' + data.back.map((x) => lab(x[0]) + ' a ' + Math.round(x[1]) + '°').join(', ')));
  svg.style.maxWidth = (o.maxw || 260) + 'px';
  const g = el('g', null, svg);
  const put = (ang, r0, g0, cls, back, slot) => {
    const a = ang * Math.PI / 180, ux = Math.cos(a), uy = -Math.sin(a);
    el('line', { x1: c + ux * r0, y1: c + uy * r0, x2: c + ux * L, y2: c + uy * L, class: 'nb ' + (back ? 'nback' : 'nfront') }, g);
    if (slot) return { x: c + ux * (L + 26), y: c + uy * (L + 22) };
    const t = lab(g0); const w = labelWidth(t, fs);
    const d = L + 7 + Math.abs(ux) * w / 2 + Math.abs(uy) * fs * 0.6;
    text(g, c + ux * d, c + uy * d, t, { class: 'atom ' + (back ? 'gback' : 'gfront') + (cls ? ' ' + cls : ''), 'font-size': fs });
    return null;
  };
  const slots = [];
  // em conformações (quase) eclipsadas, o grupo de trás é desenhado levemente deslocado para ficar visível
  const shown = (ang) => { let best = 999, sgn = 1; data.front.forEach((f) => { let d = norm360(ang - f[1]); if (d > 180) d -= 360; if (Math.abs(d) < Math.abs(best)) { best = d; sgn = d >= 0 ? 1 : -1; } }); return Math.abs(best) < 18 ? f14(ang, best, sgn) : ang; };
  const f14 = (ang, d, sgn) => ang + sgn * 18 - d;
  data.back.forEach((x) => { const s = put(shown(x[1]), Rc, x[0], (o.hl || {})['b' + x[0]], true, o.slots); if (s) slots.push(Object.assign(s, { side: 'b', ang: x[1] })); });
  el('circle', { cx: c, cy: c, r: Rc, class: 'ncirc' }, g);
  data.front.forEach((x) => { const s = put(x[1], 0, x[0], (o.hl || {})['f' + x[0]], false, o.slots); if (s) slots.push(Object.assign(s, { side: 'f', ang: x[1] })); });
  el('circle', { cx: c, cy: c, r: 3, class: 'ndot' }, g);
  if (o.arc) { // arco do diedro entre dois ângulos
    const [a1, a2] = o.arc; let d = norm360(a2 - a1); let s = a1; if (d > 180) { s = a2; d = 360 - d; }
    const r = Rc + 14, p = (ang) => [c + r * Math.cos(ang * Math.PI / 180), c - r * Math.sin(ang * Math.PI / 180)];
    const [x1, y1] = p(s), [x2, y2] = p(s + d);
    el('path', { d: `M${x1},${y1} A${r},${r} 0 0 0 ${x2},${y2}`, class: 'narc' }, g);
    const [tx, ty] = p(s + d / 2); const t = el('text', { x: tx + (tx - c) * 0.18, y: ty + (ty - c) * 0.18 + 4, class: 'narclab', 'text-anchor': 'middle' }, g); t.textContent = Math.round(d) + '°';
  }
  svg._slots = slots; svg._size = S2;
  return svg;
}

/* ===================================================================
 * Cavalete (e transição Newman → cavalete): t = 0 vista ao longo da
 * ligação (Newman); t = 1 cavalete. Mesma geometria do 3D.
 * =================================================================== */
export function sawhorseSVG(R, phi, o = {}) {
  const t = o.t === undefined ? 1 : o.t, fs = o.fs || 14;
  const d = newmanData(R, phi, o.dir || 'fwd');
  const W = 300, H = 250;
  const L0 = 48, off = [66 * t, -50 * t];
  const Cf = [W / 2 - off[0] / 2, H / 2 - off[1] / 2], Cb = [Cf[0] + off[0], Cf[1] + off[1]];
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('class', 'chem saw'); svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', o.alt || 'Projeção em cavalete da mesma conformação');
  svg.style.maxWidth = (o.maxw || 300) + 'px';
  const g = el('g', null, svg);
  const grp = (C, x, isFront, r0, k = 1) => {
    const a = x[1] * Math.PI / 180, ux = Math.cos(a), uy = -Math.sin(a), L = L0 * k;
    el('line', { x1: C[0] + ux * r0, y1: C[1] + uy * r0, x2: C[0] + ux * L, y2: C[1] + uy * L, class: 'nb ' + (isFront ? 'nfront' : 'nback') }, g);
    const tt = lab(x[0]); const w = labelWidth(tt, fs);
    text(g, C[0] + ux * (L + 5 + w / 2 * Math.abs(ux) + 2), C[1] + uy * (L + 4 + fs * 0.55 * Math.abs(uy)), tt, { class: 'atom ' + (isFront ? 'gfront' : 'gback'), 'font-size': fs });
  };
  const circ = t < 0.35, op = 1 - t / 0.35;
  d.back.forEach((x) => grp(Cb, x, false, circ ? Math.max(0, 30 * op) : 0, 0.82));
  if (circ) el('circle', { cx: Cb[0], cy: Cb[1], r: 30 * op + 3, class: 'ncirc', opacity: Math.max(op, 0.15) }, g);
  el('line', { x1: Cf[0], y1: Cf[1], x2: Cb[0], y2: Cb[1], class: 'ccbond' }, g);
  d.front.forEach((x) => grp(Cf, x, true, 0));
  if (o.labels && t > 0.5) {
    const lb = (p, s2, cls, dx, dy) => { const tt = el('text', { x: p[0] + dx, y: p[1] + dy, class: 'clab ' + cls }, g); tt.textContent = s2; };
    lb(Cf, 'frente', 'gfront', -44, 26); lb(Cb, 'trás', 'gback', 12, -8);
  }
  return svg;
}

/* ===================================================================
 * Perfil de energia interativo
 * =================================================================== */
export function energyPlot(host, o) {
  const W = o.w || 640, H = o.h || 260, ml = 50, mr = 14, mt = 16, mb = 40;
  const pw = W - ml - mr, ph = H - mt - mb;
  const pts = o.pts; const xmax = o.xmax || 360;
  const ymax = o.ymax || Math.max(5, Math.ceil(Math.max(...pts.map((p) => p[1])) / 5) * 5 + 2);
  const X = (x) => ml + x / xmax * pw, Y = (y) => mt + ph - y / ymax * ph;
  const wrap = document.createElement('div'); wrap.className = 'eplot';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('class', 'chem eplot-svg'); svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', o.alt || 'Energia potencial em função do ângulo diedro');
  wrap.append(svg); host.append(wrap);
  el('line', { x1: ml, y1: mt, x2: ml, y2: mt + ph, class: 'axis' }, svg);
  el('line', { x1: ml, y1: mt + ph, x2: ml + pw, y2: mt + ph, class: 'axis' }, svg);
  (o.xticks || [0, 60, 120, 180, 240, 300, 360]).forEach((x) => { el('line', { x1: X(x), y1: mt + ph, x2: X(x), y2: mt + ph + 5, class: 'axis' }, svg); const t = el('text', { x: X(x), y: mt + ph + 18, 'text-anchor': 'middle', class: 'tick' }, svg); t.textContent = o.xfmt ? o.xfmt(x) : x + '°'; el('line', { x1: X(x), y1: mt, x2: X(x), y2: mt + ph, class: 'grid' }, svg); });
  for (let y = 0; y <= ymax; y += o.ystep || 5) { const t = el('text', { x: ml - 6, y: Y(y) + 4, 'text-anchor': 'end', class: 'tick' }, svg); t.textContent = y; }
  const ty = el('text', { x: 13, y: mt + ph / 2, transform: `rotate(-90 13 ${mt + ph / 2})`, 'text-anchor': 'middle', class: 'tick' }, svg); ty.textContent = o.ylab || 'E relativa (kJ/mol, aprox.)';
  const tx = el('text', { x: ml + pw / 2, y: H - 4, 'text-anchor': 'middle', class: 'tick' }, svg); tx.textContent = o.xlab || 'ângulo diedro φ';
  el('path', { d: 'M' + pts.map((p) => `${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join(' L'), class: 'ecurve' }, svg);
  (o.marks || []).forEach(([x, t, cls]) => { const y = o.at ? o.at(x) : pts.reduce((a, p) => (Math.abs(p[0] - x) < Math.abs(a[0] - x) ? p : a))[1]; el('circle', { cx: X(x), cy: Y(y), r: 4.5, class: 'emark ' + (cls || '') }, svg); if (t) { const tt = el('text', { x: X(x), y: Y(y) - 9, 'text-anchor': 'middle', class: 'emlab ' + (cls || '') }, svg); tt.textContent = t; } });
  const vline = el('line', { x1: 0, y1: mt, x2: 0, y2: mt + ph, class: 'ecur' }, svg);
  const dot = el('circle', { cx: 0, cy: 0, r: 6.5, class: 'ecurdot' }, svg);
  const tip = document.createElement('div'); tip.className = 'etip'; wrap.append(tip);
  const val = (x) => (o.at ? o.at(x) : pts.reduce((a, p) => (Math.abs(p[0] - x) < Math.abs(a[0] - x) ? p : a))[1]);
  const set = (x) => { vline.setAttribute('x1', X(x)); vline.setAttribute('x2', X(x)); dot.setAttribute('cx', X(x)); dot.setAttribute('cy', Y(val(x))); };
  const toX = (e) => { const r = svg.getBoundingClientRect(); const px = (e.clientX - r.left) / r.width * W; return Math.max(0, Math.min(xmax, (px - ml) / pw * xmax)); };
  svg.addEventListener('pointermove', (e) => {
    if (!o.hover) return;
    const x = Math.round(toX(e) / (o.snap || 5)) * (o.snap || 5);
    tip.innerHTML = ''; const c = o.hover(x); if (c) { tip.append(c); tip.classList.add('show'); const r = svg.getBoundingClientRect(); tip.style.left = Math.min(r.width - 190, Math.max(0, (X(x) / W) * r.width - 90)) + 'px'; }
  });
  svg.addEventListener('pointerleave', () => tip.classList.remove('show'));
  svg.addEventListener('click', (e) => { if (o.onPick) o.onPick(Math.round(toX(e) / (o.snap || 5)) * (o.snap || 5)); });
  set(o.x0 || 0);
  return { set, svg };
}

/* ===================================================================
 * Cadeira 2D (projeção da geometria 3D)
 * subs: { '1u': 'CH3', ... }; u = parâmetro de inversão (0 ou 1)
 * o.H: mostrar H; o.color: colorir axial/equatorial; o.hl: {'1u': 'cls'}
 * =================================================================== */
export function chairS(subs, u, o = {}) {
  const geo = o.geo || ringGeom(6, { Q: 0.63, th: u > 0.5 ? Math.PI : 0, ph: u > 0.5 ? Math.PI / 2 : Math.PI / 6 });
  const az = (o.az !== undefined ? o.az : 12) * Math.PI / 180, elv = (o.el !== undefined ? o.el : 18) * Math.PI / 180;
  const proj = (p) => { const x = p[0] * Math.cos(az) - p[1] * Math.sin(az), y = p[0] * Math.sin(az) + p[1] * Math.cos(az); return [x, -(p[2] * Math.cos(elv) + y * Math.sin(elv))]; };
  const s = new S();
  const ring = geo.P.map((p) => { const q = proj(p); return s.a(q[0], q[1]); });
  for (let k = 0; k < 6; k++) s.b(ring[k], ring[(k + 1) % 6]);
  const hl = o.hl || {};
  for (let k = 0; k < 6; k++) ['u', 'd'].forEach((f) => {
    const key = (k + 1) + f, g = subs[key] || 'H', sub = geo.subs[k][f];
    if (g === 'H' && !o.H && !hl[key]) return;
    const len = g === 'H' ? 0.72 : 0.95, p = geo.P[k];
    const q = proj(V.add(p, V.mul(sub.dir, len)));
    const cls = hl[key] || (o.color ? sub.role : (g !== 'H' ? 'sub' : ''));
    s.a(q[0], q[1], g === 'H' ? 'H' : lab(g), { cls, fs: g === 'H' ? 12 : 15 });
    s.b(ring[k], s.atoms.length - 1, 1, o.color || hl[key] ? { cls: 'b' + (hl[key] ? 'hl' : sub.role) } : {});
  });
  if (o.num) geo.P.forEach((p, k) => { const q = proj(p); const out = V.norm([p[0], p[1], 0]); const q2 = proj(V.add(p, V.mul(out, o.H ? -0.4 : 0.42))); s.t(q2[0], q2[1] + 0.05, String(k + 1), 'cnum', 11); void q; });
  return s;
}
export function chairSVG(subs, u, o = {}) { return mol(chairS(subs, u, o), { scale: o.scale || 46, fs: 15, zoom: o.zoom || 1.1 }); }
