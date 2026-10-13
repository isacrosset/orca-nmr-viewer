/*
 * energy.js — diagramas de energia × coordenada de reação (SVG),
 * laboratório de perfis ajustáveis e gráfico K ↔ ΔG° (ΔG° = −RT ln K).
 * Curvas qualitativas: interpolação suave entre extremos (inclinação nula
 * em cada mínimo e máximo).
 */
import { el } from './chem2d.js';
import { h } from './widgets2d.js';

export const R = 8.314e-3; // kJ mol⁻¹ K⁻¹

export const PROFILES = {
  exo: { name: 'uma etapa, exergônica', pts: [{ x: 0.06, y: 45, k: 'end', lab: 'reagentes' }, { x: 0.5, y: 82, k: 'ts', lab: 'ET‡' }, { x: 0.94, y: 18, k: 'end', lab: 'produtos' }] },
  endo: { name: 'uma etapa, endergônica', pts: [{ x: 0.06, y: 25, k: 'end', lab: 'reagentes' }, { x: 0.55, y: 85, k: 'ts', lab: 'ET‡' }, { x: 0.94, y: 55, k: 'end', lab: 'produtos' }] },
  two: { name: 'duas etapas (1ª lenta)', pts: [{ x: 0.05, y: 40, k: 'end', lab: 'reagentes' }, { x: 0.3, y: 86, k: 'ts', lab: 'ET1‡' }, { x: 0.5, y: 58, k: 'int', lab: 'intermediário' }, { x: 0.7, y: 70, k: 'ts', lab: 'ET2‡' }, { x: 0.95, y: 16, k: 'end', lab: 'produtos' }] },
  two2: { name: 'duas etapas (2ª lenta)', pts: [{ x: 0.05, y: 40, k: 'end', lab: 'reagentes' }, { x: 0.28, y: 64, k: 'ts', lab: 'ET1‡' }, { x: 0.47, y: 50, k: 'int', lab: 'intermediário' }, { x: 0.7, y: 88, k: 'ts', lab: 'ET2‡' }, { x: 0.95, y: 22, k: 'end', lab: 'produtos' }] },
  quiz1: { name: 'diagrama A', pts: [{ x: 0.05, y: 30, k: 'end', lab: 'A' }, { x: 0.25, y: 60, k: 'ts', lab: 'B' }, { x: 0.45, y: 45, k: 'int', lab: 'C' }, { x: 0.68, y: 82, k: 'ts', lab: 'D' }, { x: 0.95, y: 40, k: 'end', lab: 'E' }] },
};

function pathOf(P) {
  let d = `M${P[0][0].toFixed(1)},${P[0][1].toFixed(1)}`;
  for (let i = 0; i < P.length - 1; i++) {
    const [x0, y0] = P[i], [x1, y1] = P[i + 1];
    for (let k = 1; k <= 24; k++) { const t = k / 24, s = (1 - Math.cos(Math.PI * t)) / 2; d += ` L${(x0 + (x1 - x0) * t).toFixed(1)},${(y0 + (y1 - y0) * s).toFixed(1)}`; }
  }
  return d;
}

/**
 * energyChart(host, { show: ['exo'] | pts: [...], h, ea: true, dg: true, labels: true, tips })
 * devolve { svg, update(pts) }
 */
export function energyChart(host, o = {}) {
  const W = o.w || 720, H = o.h || 340, ml = 50, mr = 20, mt = 26, mb = 40, pw = W - ml - mr, ph = H - mt - mb;
  const X = (x) => ml + x * pw, Y = (y) => mt + ph - (y / 100) * ph;
  const wrap = h('div', { class: 'energy' });
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chem', role: 'img' });
  svg.style.maxWidth = W + 'px';
  wrap.append(svg); host.append(wrap);
  const defs = el('defs', null, svg); const mid = 'ea' + Math.random().toString(36).slice(2, 7);
  [['g', 'var(--green)'], ['o', 'var(--orange)']].forEach(([c, col]) => { const mk = el('marker', { id: mid + c, viewBox: '0 0 10 10', refX: 5, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse' }, defs); el('path', { d: 'M0,0 L10,5 L0,10 z', fill: col }, mk); });
  el('line', { x1: ml, y1: mt - 6, x2: ml, y2: mt + ph, class: 'axis' }, svg);
  el('line', { x1: ml, y1: mt + ph, x2: ml + pw + 6, y2: mt + ph, class: 'axis' }, svg);
  const tY = el('text', { x: 16, y: mt + ph / 2, transform: `rotate(-90 16 ${mt + ph / 2})`, 'text-anchor': 'middle', class: 'axl' }, svg); tY.textContent = 'Energia (G) →';
  const tX = el('text', { x: ml + pw / 2, y: H - 8, 'text-anchor': 'middle', class: 'axl' }, svg); tX.textContent = 'Coordenada da reação →';
  const g = el('g', null, svg);
  function update(pts) {
    while (g.firstChild) g.removeChild(g.firstChild);
    const P = pts.map((p) => [X(p.x), Y(p.y)]);
    el('path', { d: pathOf(P), class: 'ecurve' }, g);
    const first = pts[0], last = pts[pts.length - 1];
    if (o.dg !== false) {
      el('line', { x1: X(first.x) - 6, y1: Y(first.y), x2: X(last.x) + 10, y2: Y(first.y), class: 'guide' }, g);
      const xd = X(last.x) + 4;
      if (Math.abs(first.y - last.y) > 2) el('line', { x1: xd, y1: Y(first.y), x2: xd, y2: Y(last.y), class: 'dgline', 'marker-end': `url(#${mid}o)` }, g);
      const t = el('text', { x: xd - 6, y: (Y(first.y) + Y(last.y)) / 2, class: 'dglab', 'text-anchor': 'end' }, g); t.textContent = `ΔG ${last.y < first.y ? '< 0' : last.y > first.y ? '> 0' : '= 0'}`;
    }
    if (o.ea !== false) {
      // barreira de cada etapa: de um mínimo ao máximo seguinte
      let maxBar = -1, maxI = -1;
      for (let i = 0; i < pts.length - 1; i++) if (pts[i].k !== 'ts' && pts[i + 1].k === 'ts') { const b = pts[i + 1].y - pts[i].y; if (b > maxBar) { maxBar = b; maxI = i; } }
      for (let i = 0; i < pts.length - 1; i++) {
        if (pts[i].k === 'ts' || pts[i + 1].k !== 'ts') continue;
        const a = pts[i], b = pts[i + 1], xe = X(b.x) - 2;
        el('line', { x1: X(a.x) + 6, y1: Y(a.y), x2: xe + 4, y2: Y(a.y), class: 'guide' }, g);
        el('line', { x1: xe, y1: Y(a.y) - 2, x2: xe, y2: Y(b.y) + 6, class: 'ealine' + (i === maxI && pts.length > 3 ? ' max' : ''), 'marker-end': `url(#${mid}g)` }, g);
        const t = el('text', { x: xe + 6, y: (Y(a.y) + Y(b.y)) / 2 + 4, class: 'ealab' }, g); t.textContent = pts.length > 3 ? `Ea${i === 0 ? '1' : '2'}${i === maxI ? ' (maior)' : ''}` : 'Ea';
      }
    }
    pts.forEach((p) => {
      const c = el('circle', { cx: X(p.x), cy: Y(p.y), r: p.k === 'end' ? 6 : 7, class: 'ept ' + p.k, tabindex: 0 }, g);
      if (o.labels !== false && p.lab) { const t = el('text', { x: X(p.x), y: Y(p.y) + (p.k === 'ts' ? -14 : 22), 'text-anchor': 'middle', class: 'elab ' + p.k }, g); t.textContent = p.lab; }
      if (o.onPick) { c.addEventListener('click', () => o.onPick(p)); c.style.cursor = 'pointer'; }
      const tt = el('title', null, c); tt.textContent = p.tip || p.lab || '';
    });
    svg.setAttribute('aria-label', 'Diagrama de energia: ' + pts.map((p) => `${p.lab || p.k} (${p.k === 'ts' ? 'máximo' : 'mínimo'})`).join(', '));
  }
  const pts0 = o.pts || (PROFILES[(o.show || ['exo'])[0]] || PROFILES.exo).pts;
  update(pts0);
  return { svg, wrap, update };
}

/* ===================================================================
 * Laboratório de perfis: sliders para ET, intermediário e produtos
 * =================================================================== */
export function energyLab(host) {
  const st = { two: false, ts1: 82, mid: 55, ts2: 70, prod: 20, react: 45 };
  const chart = h('div'), read = h('div', { class: 'readout' }), ctrls = h('div', { class: 'grid3' });
  const rng = (lab, key, min, max) => { const out = h('b', { class: 'val' }); const r = h('input', { type: 'range', min, max, step: 1, value: st[key], 'aria-label': lab }); r.addEventListener('input', () => { st[key] = +r.value; draw(); }); const row = h('label', { class: 'range-row' }, lab, r, out); row._out = out; row._key = key; return row; };
  const rows = [rng('reagentes', 'react', 10, 70), rng('ET1‡', 'ts1', 30, 98), rng('intermediário', 'mid', 15, 85), rng('ET2‡', 'ts2', 30, 98), rng('produtos', 'prod', 5, 85)];
  const tg = h('button', { class: 'btn sm', type: 'button', 'aria-pressed': 'false', onclick: () => { st.two = !st.two; tg.setAttribute('aria-pressed', st.two); draw(); } }, 'Duas etapas (com intermediário)');
  host.append(h('div', { class: 'controls' }, tg), chart, ctrls, read);
  rows.forEach((r) => ctrls.append(r));
  const E = energyChart(chart, { pts: PROFILES.exo.pts });
  function draw() {
    const s = Object.assign({}, st);
    if (s.ts1 < Math.max(s.react, s.two ? s.mid : s.prod) + 3) s.ts1 = Math.max(s.react, s.two ? s.mid : s.prod) + 3;
    if (s.two) { if (s.mid > s.ts1 - 3) s.mid = s.ts1 - 3; if (s.ts2 < Math.max(s.mid, s.prod) + 3) s.ts2 = Math.max(s.mid, s.prod) + 3; }
    const pts = s.two
      ? [{ x: 0.05, y: s.react, k: 'end', lab: 'reagentes' }, { x: 0.28, y: s.ts1, k: 'ts', lab: 'ET1‡' }, { x: 0.5, y: s.mid, k: 'int', lab: 'intermediário' }, { x: 0.72, y: s.ts2, k: 'ts', lab: 'ET2‡' }, { x: 0.95, y: s.prod, k: 'end', lab: 'produtos' }]
      : [{ x: 0.06, y: s.react, k: 'end', lab: 'reagentes' }, { x: 0.5, y: s.ts1, k: 'ts', lab: 'ET‡' }, { x: 0.94, y: s.prod, k: 'end', lab: 'produtos' }];
    E.update(pts);
    rows.forEach((r) => { r._out.textContent = s[r._key]; r.style.display = !s.two && (r._key === 'mid' || r._key === 'ts2') ? 'none' : ''; });
    const dG = s.prod - s.react, ea1 = s.ts1 - s.react, ea2 = s.two ? s.ts2 - s.mid : null;
    const top = s.two ? (s.ts2 > s.ts1 ? 'ET2‡' : 'ET1‡') : 'ET‡';
    read.innerHTML = `<span>ΔG = <b class="${dG < 0 ? 'okc' : 'hic'}">${dG > 0 ? '+' : ''}${dG}</b> (unid. arbitrárias) → ${dG < 0 ? 'exergônica: produtos favorecidos' : dG > 0 ? 'endergônica: reagentes favorecidos' : 'K = 1'}</span>` +
      `<span>Ea${s.two ? '1' : ''} = <b>${ea1}</b>${s.two ? ` · Ea2 = <b>${ea2}</b>` : ''}</span>` +
      (s.two ? `<span>ponto mais alto: <b>${top}</b> → a etapa ${top === 'ET2‡' ? '2' : '1'} tende a controlar a velocidade</span>` : '<span>uma etapa elementar: um único ET</span>');
  }
  draw();
}

/* ===================================================================
 * K ↔ ΔG° (ΔG° = −RT ln K)
 * =================================================================== */
export function kGraph(host, o = {}) {
  let lk = o.logK !== undefined ? o.logK : 3, T = 298;
  const W = 640, H = 300, ml = 56, mr = 20, mt = 20, mb = 44, pw = W - ml - mr, ph = H - mt - mb;
  const LK = 8, GM = 50;
  const X = (l) => ml + (l + LK) / (2 * LK) * pw, Y = (g) => mt + ph / 2 - g / GM * ph / 2;
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chem kgraph', role: 'img', 'aria-label': 'Gráfico de ΔG° em função de log K' });
  svg.style.maxWidth = W + 'px';
  for (let l = -LK; l <= LK; l += 2) { el('line', { x1: X(l), y1: mt, x2: X(l), y2: mt + ph, class: 'grid' }, svg); const t = el('text', { x: X(l), y: mt + ph + 16, 'text-anchor': 'middle', class: 'tick' }, svg); t.textContent = l; }
  for (let gg = -GM; gg <= GM; gg += 25) { el('line', { x1: ml, y1: Y(gg), x2: ml + pw, y2: Y(gg), class: 'grid' }, svg); const t = el('text', { x: ml - 6, y: Y(gg) + 4, 'text-anchor': 'end', class: 'tick' }, svg); t.textContent = gg; }
  el('line', { x1: ml, y1: Y(0), x2: ml + pw, y2: Y(0), class: 'axis' }, svg); el('line', { x1: X(0), y1: mt, x2: X(0), y2: mt + ph, class: 'axis' }, svg);
  const ax = el('text', { x: ml + pw / 2, y: H - 6, 'text-anchor': 'middle', class: 'axl' }, svg); ax.textContent = 'log K';
  const ay = el('text', { x: 14, y: mt + ph / 2, transform: `rotate(-90 14 ${mt + ph / 2})`, 'text-anchor': 'middle', class: 'axl' }, svg); ay.textContent = 'ΔG° (kJ/mol)';
  el('rect', { x: X(0), y: Y(0), width: pw / 2, height: ph / 2, class: 'zone ok' }, svg);
  el('rect', { x: ml, y: mt, width: pw / 2, height: ph / 2, class: 'zone bad' }, svg);
  const zt = (x, y, t, c) => { const e = el('text', { x, y, 'text-anchor': 'middle', class: 'zlab ' + c }, svg); e.textContent = t; };
  zt(X(LK / 2), Y(-GM * 0.85), 'K > 1 · ΔG° < 0 · produtos', 'ok'); zt(X(-LK / 2), Y(GM * 0.85), 'K < 1 · ΔG° > 0 · reagentes', 'bad');
  const line = el('line', { class: 'kline' }, svg), dot = el('circle', { r: 7, class: 'kdot' }, svg);
  const read = h('div', { class: 'readout' });
  const rk = h('input', { type: 'range', min: -6, max: 6, step: 0.1, value: lk, 'aria-label': 'log K' }), rt = h('input', { type: 'range', min: 200, max: 400, step: 1, value: T, 'aria-label': 'Temperatura (K)' });
  const ok = h('b', { class: 'val' }), ot = h('b', { class: 'val' });
  rk.addEventListener('input', () => { lk = +rk.value; draw(); }); rt.addEventListener('input', () => { T = +rt.value; draw(); });
  const presets = h('div', { class: 'controls' }, h('span', { class: 'hint3' }, 'Exemplos:'), ...[[3, 'K = 1000'], [0, 'K = 1'], [-3, 'K = 0,001']].map(([v, t]) => h('button', { class: 'btn sm', type: 'button', onclick: () => { lk = v; rk.value = v; draw(); } }, t)), h('button', { class: 'btn sm', type: 'button', onclick: () => { T = 298; rt.value = 298; draw(); } }, 'T = 298 K'));
  host.append(svg, h('div', { class: 'grid2' }, h('label', { class: 'range-row' }, 'log K', rk, ok), h('label', { class: 'range-row' }, 'T (K)', rt, ot)), presets, read);
  function draw() {
    const g1 = -R * T * Math.log(10) * LK, g2 = R * T * Math.log(10) * LK;
    line.setAttribute('x1', X(-LK)); line.setAttribute('y1', Y(Math.max(-GM * 1.2, Math.min(GM * 1.2, g2)))); line.setAttribute('x2', X(LK)); line.setAttribute('y2', Y(Math.max(-GM * 1.2, Math.min(GM * 1.2, g1))));
    const K = Math.pow(10, lk), lnK = lk * Math.log(10), dG = -R * T * lnK;
    dot.setAttribute('cx', X(lk)); dot.setAttribute('cy', Y(Math.max(-GM, Math.min(GM, dG))));
    ok.textContent = lk.toFixed(1); ot.textContent = T + ' K';
    const c = (x, n) => x.toFixed(n).replace('.', ',').replace('-', '−');
    const ex = Math.floor(lk), man = Math.pow(10, lk - ex);
    const fmtK = Math.abs(lk) >= 2 ? `${c(man, 1)} × 10<sup>${String(ex).replace('-', '−')}</sup>` : c(K, K < 1 ? 3 : 2);
    read.innerHTML = `<span>K = <b>${fmtK}</b></span><span>ln K = <b>${c(lnK, 2)}</b></span><span>ΔG° = −RT ln K = −(8,314 × 10⁻³)(${T})(${c(lnK, 2)}) = <b class="${dG < -0.05 ? 'okc' : dG > 0.05 ? 'hic' : ''}">${c(dG, 1)} kJ/mol</b></span><span>${Math.abs(lk) < 0.05 ? 'K = 1 → ΔG° = 0: nenhum lado favorecido' : lk > 0 ? 'K > 1 → ΔG° < 0: <b>produtos</b> favorecidos' : 'K < 1 → ΔG° > 0: <b>reagentes</b> favorecidos'}</span>`;
  }
  draw();
}
