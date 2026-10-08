/*
 * energy.js — diagramas de energia potencial × coordenada de reação (SVG)
 * para SN1, SN2, E1 e E2. Curvas qualitativas (não estão em escala).
 */
import { el } from './chem2d.js';

export const PROFILES = {
  e2: {
    cls: 'e2', name: 'E2',
    pts: [
      { x: 0.06, y: 24, k: 'end', lab: 'Reagentes', tip: '<b>Reagentes</b>: 2-bromobutano + CH₃CH₂O⁻.' },
      { x: 0.5, y: 84, k: 'ts', lab: 'ET‡', tip: '<b>Estado de transição único</b>: base···H···Cβ, ligação π parcial, Cα···Br parcial. Ocorre em uma única etapa; não é isolável.' },
      { x: 0.94, y: 12, k: 'end', lab: 'Produtos', tip: '<b>Produtos</b>: but-2-eno (+ but-1-eno), CH₃CH₂OH e Br⁻.' },
    ],
    ea: [0, 1],
    notes: ['uma etapa (concertada)', 'um estado de transição', 'nenhum intermediário'],
  },
  e1: {
    cls: 'e1', name: 'E1',
    pts: [
      { x: 0.05, y: 26, k: 'end', lab: 'R–Br', tip: '<b>Reagentes</b>: (CH₃)₃C–Br em solvente prótico (base fraca).' },
      { x: 0.27, y: 90, k: 'ts', lab: 'ET1‡', tip: '<b>ET1 (o mais alto)</b>: a ligação C–Br está quase rompida. A ionização é a <b>etapa determinante da velocidade</b>: v = k[RX].' },
      { x: 0.5, y: 62, k: 'int', lab: 'R⁺', tip: '<b>Intermediário carbocátion</b>: mínimo local de energia; pode sofrer rearranjo ou ser capturado (SN1) ou perder Hβ (E1).' },
      { x: 0.7, y: 70, k: 'ts', lab: 'ET2‡', tip: '<b>ET2</b>: base fraca (H₂O/ROH) removendo um Hβ; ligação π se formando. Barreira pequena (etapa rápida).' },
      { x: 0.94, y: 16, k: 'end', lab: 'Alceno', tip: '<b>Produtos</b>: 2-metilpropeno + H₃O⁺ (ou ROH₂⁺) + Br⁻.' },
    ],
    ea: [0, 1],
    notes: ['duas etapas', 'dois estados de transição', 'um intermediário (carbocátion)', 'ET1 é o mais alto'],
  },
  sn2: {
    cls: 'sn2', name: 'SN2',
    pts: [
      { x: 0.06, y: 22, k: 'end', lab: 'Reagentes', tip: '<b>Reagentes</b>: Nu⁻ + CH₃–Br.' },
      { x: 0.5, y: 86, k: 'ts', lab: 'ET‡', tip: '<b>Estado de transição</b>: Nu···C···Br, ataque pelo lado oposto (backside).' },
      { x: 0.94, y: 8, k: 'end', lab: 'Produtos', tip: '<b>Produtos</b>: CH₃–Nu + Br⁻, com inversão de configuração.' },
    ],
    ea: [0, 1],
    notes: ['uma etapa', 'um estado de transição', 'nenhum intermediário'],
  },
  sn1: {
    cls: 'sn1', name: 'SN1',
    pts: [
      { x: 0.04, y: 26, k: 'end', lab: 'R–Br', tip: '<b>Reagentes</b>: (CH₃)₃C–Br + H₂O.' },
      { x: 0.22, y: 92, k: 'ts', lab: 'ET1‡', tip: '<b>ET1</b>: ionização (etapa lenta).' },
      { x: 0.4, y: 64, k: 'int', lab: 'R⁺', tip: '<b>Carbocátion</b>: o mesmo intermediário da E1.' },
      { x: 0.55, y: 72, k: 'ts', lab: 'ET2‡', tip: '<b>ET2</b>: o nucleófilo (H₂O) ataca o carbono do carbocátion.' },
      { x: 0.7, y: 36, k: 'int', lab: 'R–OH₂⁺', tip: '<b>Íon oxônio</b>.' },
      { x: 0.82, y: 42, k: 'ts', lab: 'ET3‡', tip: '<b>ET3</b>: desprotonação.' },
      { x: 0.96, y: 14, k: 'end', lab: 'R–OH', tip: '<b>Produto</b>: álcool.' },
    ],
    ea: [0, 1],
    notes: ['várias etapas', 'carbocátion como intermediário', 'ET1 é o mais alto'],
  },
};

function curvePath(P) {
  let d = `M${P[0][0]},${P[0][1]}`;
  for (let i = 0; i < P.length - 1; i++) {
    const p1 = P[i], p2 = P[i + 1];
    const c1 = [p1[0] + (p2[0] - p1[0]) * 0.42, p1[1]];
    const c2 = [p2[0] - (p2[0] - p1[0]) * 0.42, p2[1]];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

/**
 * energyChart(host, { show: ['e2'] | ['e1','e2'] ..., h, noEa, animate, onPick })
 */
export function energyChart(host, o = {}) {
  const show = o.show || ['e2'];
  const W = o.w || 760, H = o.h || 360, ml = 52, mr = 18, mt = 26, mb = 46;
  const pw = W - ml - mr, ph = H - mt - mb;
  const wrap = document.createElement('div');
  wrap.className = 'energy';
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chem', role: 'img', 'aria-label': 'Diagrama de energia potencial em função da coordenada de reação: ' + show.map((k) => PROFILES[k].name).join(', ') });
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
  show.forEach((k, ki) => {
    const pf = PROFILES[k];
    const g = el('g', { class: 'prof ' + k }, svg);
    const P = pf.pts.map((p) => [X(p.x), Y(p.y)]);
    const path = el('path', { d: curvePath(P), class: 'curve ' + pf.cls }, g);
    if (o.animate !== false) {
      const L = 2000;
      path.style.strokeDasharray = L; path.style.strokeDashoffset = L;
      path.animate([{ strokeDashoffset: L }, { strokeDashoffset: 0 }], { duration: 1600, easing: 'ease-out', fill: 'forwards' });
    }
    if (!o.noEa) {
      const a = pf.pts[pf.ea[0]], b = pf.pts[pf.ea[1]];
      const xe = X(b.x) + (pf.pts.length > 3 ? -28 : 24);
      el('line', { x1: X(a.x) + 6, y1: Y(a.y), x2: xe, y2: Y(a.y), class: 'axis', 'stroke-dasharray': '3 3' }, g);
      el('line', { x1: xe, y1: Y(a.y) - 2, x2: xe, y2: Y(b.y) + 4, class: 'ea', 'marker-end': `url(#${mk.id})`, 'marker-start': `url(#${mk.id})` }, g);
      const t = el('text', { x: xe + 6, y: (Y(a.y) + Y(b.y)) / 2, class: 'ealab' }, g);
      t.textContent = pf.pts.length > 3 ? 'Ea (etapa lenta)' : 'Ea';
    }
    pf.pts.forEach((p) => {
      const c = el('circle', { cx: X(p.x), cy: Y(p.y), r: p.k === 'end' ? 6 : 8, class: 'pt ' + p.k, tabindex: 0, role: 'button', 'aria-label': pf.name + ': ' + p.tip.replace(/<[^>]+>/g, '') }, g);
      const hit = el('circle', { cx: X(p.x), cy: Y(p.y), r: 20, fill: 'transparent' }, g);
      const lt = el('text', { x: X(p.x), y: Y(p.y) - 16 - (show.length > 1 && ki % 2 ? -34 : 0), 'text-anchor': 'middle', class: 'lab' }, g);
      lt.textContent = p.lab;
      const showTip = () => {
        tip.innerHTML = `<b style="color:var(--${k === 'e1' ? 'violet' : k === 'e2' ? 'green' : k === 'sn1' ? 'orange' : 'cyan'})">${pf.name}</b> · ` + p.tip;
        const r = svg.getBoundingClientRect(), sc = r.width / W;
        let left = X(p.x) * sc - 20; const top = Y(p.y) * sc + 18;
        left = Math.min(left, r.width - 280);
        tip.style.left = Math.max(0, left) + 'px'; tip.style.top = top + 'px';
        tip.classList.add('show');
        if (o.onPick) o.onPick(k, p);
      };
      const hide = () => tip.classList.remove('show');
      [c, hit].forEach((n) => { n.addEventListener('mouseenter', showTip); n.addEventListener('mouseleave', hide); n.addEventListener('click', showTip); });
      c.addEventListener('focus', showTip); c.addEventListener('blur', hide);
    });
  });
  if (show.length > 1) {
    const lg = el('g', null, svg);
    show.forEach((k, i) => {
      el('line', { x1: W - 150, x2: W - 120, y1: mt + 6 + i * 20, y2: mt + 6 + i * 20, class: 'curve ' + k }, lg);
      const t = el('text', { x: W - 112, y: mt + 10 + i * 20 }, lg); t.textContent = PROFILES[k].name;
    });
  }
  return { wrap, svg };
}

/* Comparador: escolha dois dos quatro mecanismos */
export function energyCompare(host, H) {
  const keys = ['sn1', 'sn2', 'e1', 'e2'];
  let sel = ['e1', 'e2'];
  const pick = document.createElement('div'); pick.className = 'ecmp-pick';
  const chart = document.createElement('div');
  const info = document.createElement('div'); info.className = 'stepcap';
  const notes = document.createElement('div'); notes.className = 'grid2';
  host.append(pick, chart, notes, info);
  info.innerHTML = 'Clique em um ponto (estado de transição ou intermediário) para ver o que ele representa.';
  const draw = () => {
    [...pick.children].forEach((b) => b.setAttribute('aria-pressed', sel.includes(b.dataset.k)));
    chart.innerHTML = '';
    energyChart(chart, { show: sel, noEa: true, h: H || 340, onPick: (k, p) => { info.innerHTML = `<b>${PROFILES[k].name}</b> — ${p.tip}`; } });
    notes.innerHTML = sel.map((k) => `<div class="defbox ${k === 'e1' || k === 'sn1' ? 'o' : ''}"><b class="c-${k}">${PROFILES[k].name}</b>${PROFILES[k].notes.join(' · ')}</div>`).join('');
  };
  keys.forEach((k) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'btn sm ' + k; b.dataset.k = k; b.textContent = PROFILES[k].name;
    b.addEventListener('click', () => {
      if (sel.includes(k)) { if (sel.length > 1) sel = sel.filter((x) => x !== k); } else { sel = sel.length >= 2 ? [sel[1], k] : sel.concat(k); }
      draw();
    });
    pick.append(b);
  });
  const hint = document.createElement('span'); hint.className = 'chip'; hint.textContent = 'escolha dois mecanismos para comparar';
  pick.append(hint);
  draw();
}
