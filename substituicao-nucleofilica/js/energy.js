/*
 * energy.js — diagramas de energia potencial × coordenada de reação (SVG).
 */
import { el } from './chem2d.js';

export const PROFILES = {
  sn2: {
    cls: 'sn2', name: 'SN2',
    pts: [
      { x: 0.06, y: 22, k: 'end', lab: 'Reagentes', tip: '<b>Reagentes</b>: HO⁻ + CH₃–Br separados.' },
      { x: 0.5, y: 86, k: 'ts', lab: 'ET‡', tip: '<b>Estado de transição</b>: ligações Nu–C e C–LG parcialmente formadas/quebradas. Carbono com geometria bipiramidal trigonal; não é uma espécie isolável.' },
      { x: 0.94, y: 8, k: 'end', lab: 'Produtos', tip: '<b>Produtos</b>: CH₃–OH + Br⁻ (reação exotérmica neste exemplo).' },
    ],
    ea: [0, 1],
    notes: ['uma única etapa', 'um único estado de transição', 'nenhum intermediário'],
  },
  sn1: {
    cls: 'sn1', name: 'SN1',
    pts: [
      { x: 0.04, y: 26, k: 'end', lab: 'R–Br', tip: '<b>Reagentes</b>: (CH₃)₃C–Br + H₂O.' },
      { x: 0.2, y: 92, k: 'ts', lab: 'ET1‡', tip: '<b>ET1 (o mais alto)</b>: ligação C–Br quase rompida, carga positiva se desenvolvendo no carbono. A ionização é a <b>etapa determinante da velocidade</b>.' },
      { x: 0.36, y: 64, k: 'int', lab: 'R⁺', tip: '<b>Intermediário carbocátion</b> (CH₃)₃C⁺ + Br⁻: mínimo local de energia; tem tempo de vida finito e pode, em princípio, ser detectado ou rearranjar.' },
      { x: 0.5, y: 72, k: 'ts', lab: 'ET2‡', tip: '<b>ET2</b>: a água se liga ao carbocátion (barreira pequena, etapa rápida).' },
      { x: 0.64, y: 34, k: 'int', lab: 'R–OH₂⁺', tip: '<b>Intermediário íon oxônio</b>: (CH₃)₃C–OH₂⁺.' },
      { x: 0.78, y: 42, k: 'ts', lab: 'ET3‡', tip: '<b>ET3</b>: transferência de próton para outra molécula de água (desprotonação, rápida).' },
      { x: 0.95, y: 14, k: 'end', lab: 'R–OH', tip: '<b>Produtos</b>: (CH₃)₃C–OH + H₃O⁺ + Br⁻.' },
    ],
    ea: [0, 1],
    notes: ['várias etapas', 'três estados de transição', 'dois intermediários (carbocátion e oxônio)', 'ET1 é o ponto mais alto: ionização lenta'],
  },
};

function curvePath(P) {
  let d = `M${P[0][0]},${P[0][1]}`;
  for (let i = 0; i < P.length - 1; i++) {
    const p1 = P[i], p2 = P[i + 1];
    // tangentes horizontais nos pontos estacionários (máximos e mínimos)
    const c1 = [p1[0] + (p2[0] - p1[0]) * 0.42, p1[1]];
    const c2 = [p2[0] - (p2[0] - p1[0]) * 0.42, p2[1]];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

/**
 * energyChart(host, { show: ['sn2'] | ['sn1'] | ['sn1','sn2'], h })
 */
export function energyChart(host, o = {}) {
  const show = o.show || ['sn2'];
  const W = o.w || 760, H = o.h || 360, ml = 52, mr = 18, mt = 26, mb = 46;
  const pw = W - ml - mr, ph = H - mt - mb;
  const wrap = document.createElement('div');
  wrap.className = 'energy';
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chem', role: 'img', 'aria-label': 'Diagrama de energia potencial em função da coordenada de reação' });
  svg.style.maxWidth = W + 'px';
  const X = (x) => ml + x * pw, Y = (y) => mt + ph - (y / 100) * ph;
  const defs = el('defs', null, svg);
  const mk = el('marker', { id: 'ea' + Math.random().toString(36).slice(2, 7), viewBox: '0 0 10 10', refX: 5, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse' }, defs);
  el('path', { d: 'M0,0 L10,5 L0,10 z', fill: 'var(--green)' }, mk);
  el('line', { x1: ml, y1: mt - 6, x2: ml, y2: mt + ph, class: 'axis' }, svg);
  el('line', { x1: ml, y1: mt + ph, x2: ml + pw + 6, y2: mt + ph, class: 'axis' }, svg);
  const tY = el('text', { x: 16, y: mt + ph / 2, transform: `rotate(-90 16 ${mt + ph / 2})`, 'text-anchor': 'middle' }, svg); tY.textContent = 'Energia potencial';
  const tX = el('text', { x: ml + pw / 2, y: H - 10, 'text-anchor': 'middle' }, svg); tX.textContent = 'Coordenada da reação →';
  const tip = document.createElement('div');
  tip.className = 'tooltip';
  wrap.append(svg, tip);
  host.appendChild(wrap);
  const groups = {};
  show.forEach((k) => {
    const pf = PROFILES[k];
    const g = el('g', { class: 'prof ' + k }, svg);
    groups[k] = g;
    const P = pf.pts.map((p) => [X(p.x), Y(p.y)]);
    const path = el('path', { d: curvePath(P), class: 'curve ' + pf.cls }, g);
    if (o.animate !== false) {
      const L = 2000;
      path.style.strokeDasharray = L; path.style.strokeDashoffset = L;
      path.animate([{ strokeDashoffset: L }, { strokeDashoffset: 0 }], { duration: 1600, easing: 'ease-out', fill: 'forwards' });
    }
    // Ea
    if (!o.noEa) {
      const a = pf.pts[pf.ea[0]], b = pf.pts[pf.ea[1]];
      const xe = X(b.x) + (k === 'sn1' ? -26 : 24);
      el('line', { x1: X(a.x) + 6, y1: Y(a.y), x2: xe, y2: Y(a.y), class: 'axis', 'stroke-dasharray': '3 3' }, g);
      el('line', { x1: xe, y1: Y(a.y) - 2, x2: xe, y2: Y(b.y) + 4, class: 'ea', 'marker-end': `url(#${mk.id})`, 'marker-start': `url(#${mk.id})` }, g);
      const t = el('text', { x: xe + 6, y: (Y(a.y) + Y(b.y)) / 2, class: 'ealab' }, g);
      t.textContent = k === 'sn1' ? 'Ea (etapa lenta)' : 'Ea';
    }
    pf.pts.forEach((p) => {
      const c = el('circle', { cx: X(p.x), cy: Y(p.y), r: p.k === 'end' ? 6 : 8, class: 'pt ' + p.k, tabindex: 0, role: 'button', 'aria-label': p.tip.replace(/<[^>]+>/g, '') }, g);
      // área de toque maior
      const hit = el('circle', { cx: X(p.x), cy: Y(p.y), r: 22, fill: 'transparent' }, g);
      const lt = el('text', { x: X(p.x), y: Y(p.y) - 16, 'text-anchor': 'middle', class: 'lab' }, g);
      lt.textContent = p.lab;
      const showTip = () => {
        tip.innerHTML = p.tip;
        const r = svg.getBoundingClientRect(), sc = r.width / W;
        let left = X(p.x) * sc - 20, top = Y(p.y) * sc + 18;
        left = Math.min(left, r.width - 280);
        tip.style.left = Math.max(0, left) + 'px'; tip.style.top = top + 'px';
        tip.classList.add('show');
      };
      const hide = () => tip.classList.remove('show');
      [c, hit].forEach((n) => { n.addEventListener('mouseenter', showTip); n.addEventListener('mouseleave', hide); n.addEventListener('click', showTip); });
      c.addEventListener('focus', showTip); c.addEventListener('blur', hide);
    });
  });
  if (show.length > 1) {
    const lg = el('g', null, svg);
    show.forEach((k, i) => {
      el('line', { x1: W - 170, x2: W - 140, y1: mt + 6 + i * 20, y2: mt + 6 + i * 20, class: 'curve ' + k }, lg);
      const t = el('text', { x: W - 132, y: mt + 10 + i * 20 }, lg); t.textContent = PROFILES[k].name;
    });
  }
  return { wrap, svg, groups };
}
