/*
 * energy.js — diagramas de energia potencial × coordenada de reação (SVG)
 * para reações de álcoois e epóxidos. Curvas qualitativas (não estão em escala).
 */
import { el } from './chem2d.js';

export const PROFILES = {
  sn2: { cls: 'mk', name: 'álcool 1° + HBr (SN2)', pts: [
    { x: 0.05, y: 40, k: 'end', lab: 'ROH + HBr', tip: '<b>Reagentes</b>: álcool primário + HBr.' },
    { x: 0.2, y: 52, k: 'ts', lab: '', tip: 'Protonação do O: transferência de próton rápida (equilíbrio ácido–base).' },
    { x: 0.32, y: 46, k: 'int', lab: 'ROH₂⁺', tip: '<b>Álcool protonado (íon alquiloxônio)</b>: intermediário. Agora o grupo abandonador é H₂O, neutra e estável.' },
    { x: 0.6, y: 86, k: 'ts', lab: 'ET SN2‡', tip: '<b>Estado de transição da SN2</b>: Br⁻ entra pelo lado oposto enquanto a H₂O sai; carbono pentacoordenado <i>transitório</i> (não é intermediário).' },
    { x: 0.94, y: 18, k: 'end', lab: 'RBr + H₂O', tip: '<b>Produtos</b>: brometo de alquila primário + água.' } ], ea: [2, 3], notes: [] },
  sn1: { cls: 'amk', name: 'álcool 3° + HBr (SN1)', pts: [
    { x: 0.05, y: 40, k: 'end', lab: '', tip: '<b>Reagentes</b>: álcool terciário + HBr.' },
    { x: 0.16, y: 50, k: 'ts', lab: '', tip: 'Protonação rápida do O.' },
    { x: 0.27, y: 45, k: 'int', lab: '', tip: '<b>Álcool protonado</b> (intermediário).' },
    { x: 0.45, y: 80, k: 'ts', lab: 'ET‡ (lenta)', tip: '<b>Etapa lenta</b>: a ligação C–OH₂⁺ se rompe; ET com caráter de carbocátion.' },
    { x: 0.6, y: 66, k: 'int', lab: 'R₃C⁺', tip: '<b>Carbocátion terciário</b>: intermediário real (mínimo local), planar.' },
    { x: 0.72, y: 70, k: 'ts', lab: '', tip: 'Ataque rápido do Br⁻ ao carbocátion.' },
    { x: 0.94, y: 16, k: 'end', lab: '', tip: '<b>Produto</b>: brometo terciário.' } ], ea: [2, 3], notes: [] },
  e1: { cls: 'c', name: 'desidratação E1 (álcool 2°/3°)', pts: [
    { x: 0.05, y: 30, k: 'end', lab: 'ROH + H⁺', tip: '<b>Reagentes</b>: álcool + ácido (H₂SO₄ ou H₃PO₄), aquecimento.' },
    { x: 0.15, y: 40, k: 'ts', lab: '', tip: 'Protonação rápida do OH.' },
    { x: 0.26, y: 35, k: 'int', lab: 'ROH₂⁺', tip: '<b>Álcool protonado</b>.' },
    { x: 0.44, y: 82, k: 'ts', lab: 'ET‡ (lenta)', tip: '<b>Etapa lenta</b>: saída da água → carbocátion.' },
    { x: 0.58, y: 68, k: 'int', lab: 'R⁺', tip: '<b>Carbocátion</b>: pode rearranjar (hidreto/alquila) para um cátion mais estável antes da perda do H<sub>β</sub>.' },
    { x: 0.71, y: 74, k: 'ts', lab: '', tip: 'Uma base fraca (H₂O, HSO₄⁻) remove um H<sub>β</sub>.' },
    { x: 0.94, y: 40, k: 'end', lab: 'alceno + H₂O', tip: '<b>Produtos</b>: alceno (Zaitsev) + água. A reação é reversível: o aquecimento e a remoção do alceno/água deslocam o equilíbrio.' } ], ea: [2, 3], notes: [] },
  epB: { cls: 'mk', name: 'abertura básica (SN2)', pts: [
    { x: 0.05, y: 54, k: 'end', lab: 'epóxido + Nu⁻', tip: '<b>Reagentes</b>: epóxido tensionado (≈ 115 kJ/mol de tensão) + nucleófilo forte.' },
    { x: 0.45, y: 84, k: 'ts', lab: 'ET SN2‡', tip: '<b>Único estado de transição</b>: Nu⁻ ataca o carbono <b>menos impedido</b> pelo lado oposto ao O; a C–O se rompe ao mesmo tempo.' },
    { x: 0.7, y: 22, k: 'int', lab: 'alcóxido', tip: '<b>Alcóxido</b>: a liberação da tensão do anel torna a etapa muito favorável.' },
    { x: 0.94, y: 12, k: 'end', lab: 'álcool', tip: 'Protonação do alcóxido (solvente ou workup).' } ], ea: [0, 1], notes: [] },
  epA: { cls: 'amk', name: 'abertura ácida', pts: [
    { x: 0.05, y: 54, k: 'end', lab: '', tip: '<b>Reagentes</b>: epóxido + H⁺ + nucleófilo fraco (H₂O, ROH).' },
    { x: 0.15, y: 62, k: 'ts', lab: '', tip: 'Protonação rápida do O do epóxido.' },
    { x: 0.27, y: 58, k: 'int', lab: 'epóxido–H⁺', tip: '<b>Epóxido protonado</b>: intermediário. A ligação C–O do carbono mais substituído fica mais longa e fraca (mais δ+ nesse carbono).' },
    { x: 0.47, y: 78, k: 'ts', lab: 'ET‡', tip: '<b>Estado de transição "frouxo"</b>: C–O bastante rompida e Nu ainda distante; caráter catiônico parcial no carbono mais substituído. <b>Não</b> há carbocátion livre: o ataque é pelo lado oposto (inversão).' },
    { x: 0.66, y: 30, k: 'int', lab: '', tip: 'Oxônio após o ataque; perde H⁺.' },
    { x: 0.94, y: 14, k: 'end', lab: '', tip: '<b>Produto</b>: Nu no carbono mais substituído; OH no outro; anti.' } ], ea: [2, 3], notes: [] },
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
      const lt = el('text', { x: X(p.x), y: Y(p.y) - 16, 'text-anchor': 'middle', class: 'lab' }, g);
      lt.textContent = p.lab;
      const showTip = () => {
        tip.innerHTML = p.tip;
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
      el('line', { x1: ml + pw * 0.36, x2: ml + pw * 0.36 + 30, y1: mt + ph - 40 + i * 20, y2: mt + ph - 40 + i * 20, class: 'curve ' + PROFILES[k].cls }, lg);
      const t = el('text', { x: ml + pw * 0.36 + 38, y: mt + ph - 36 + i * 20 }, lg); t.textContent = PROFILES[k].name;
    });
  }
  return { wrap, svg };
}

