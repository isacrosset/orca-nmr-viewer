/*
 * energy.js — diagramas de energia potencial × coordenada de reação (SVG)
 * para SN1, SN2, E1 e E2. Curvas qualitativas (não estão em escala).
 */
import { el } from './chem2d.js';

export const PROFILES = {
  mk: { cls: 'mk', name: 'via carbocátion 2° (Markovnikov)', pts: [
    { x: 0.05, y: 30, k: 'end', lab: 'propeno + HBr', tip: '<b>Reagentes</b>: propeno + HBr.' },
    { x: 0.28, y: 74, k: 'ts', lab: 'ET1‡', tip: '<b>ET1</b> da protonação que leva ao cátion <b>secundário</b>: mais baixo (postulado de Hammond: o ET se parece com o carbocátion).' },
    { x: 0.5, y: 52, k: 'int', lab: '2° R⁺', tip: '<b>Carbocátion secundário</b> (CH₃)₂CH⁺: estabilizado por hiperconjugação de dois grupos alquila.' },
    { x: 0.64, y: 58, k: 'ts', lab: 'ET2‡', tip: '<b>ET2</b>: Br⁻ ataca o carbocátion (barreira pequena).' },
    { x: 0.94, y: 12, k: 'end', lab: '2-bromopropano', tip: '<b>Produto Markovnikov</b>: 2-bromopropano.' } ], ea: [0, 1], notes: [] },
  amk: { cls: 'amk', name: 'via carbocátion 1° (anti-Markovnikov)', pts: [
    { x: 0.05, y: 30, k: 'end', lab: '', tip: '<b>Reagentes</b>.' },
    { x: 0.3, y: 95, k: 'ts', lab: '', tip: '<b>ET1′</b> para o cátion <b>primário</b>: muito mais alto → caminho muito mais lento.' },
    { x: 0.5, y: 84, k: 'int', lab: '1° R⁺', tip: '<b>Carbocátion primário</b> CH₃CH₂CH₂⁺: muito instável (praticamente não se forma).' },
    { x: 0.64, y: 88, k: 'ts', lab: '', tip: 'Ataque do Br⁻.' },
    { x: 0.94, y: 18, k: 'end', lab: '', tip: '1-bromopropano (praticamente não formado por esse mecanismo).' } ], ea: [0, 1], notes: [] },
  brom: { cls: 'c', name: 'bromação', pts: [
    { x: 0.05, y: 30, k: 'end', lab: 'alceno + Br₂', tip: '<b>Reagentes</b>.' },
    { x: 0.27, y: 80, k: 'ts', lab: 'ET1‡', tip: '<b>ET1</b>: formação do bromônio (π ataca o Br; Br–Br se rompe).' },
    { x: 0.47, y: 55, k: 'int', lab: 'bromônio', tip: '<b>Intermediário</b>: íon bromônio cíclico + Br⁻ (não é carbocátion livre).' },
    { x: 0.66, y: 66, k: 'ts', lab: 'ET2‡', tip: '<b>ET2</b>: Br⁻ ataca pela face oposta (tipo SN2).' },
    { x: 0.94, y: 10, k: 'end', lab: 'di-haleto', tip: '<b>Produto</b>: dibrometo vicinal anti.' } ], ea: [0, 1], notes: ['duas etapas', 'intermediário: bromônio', 'adição anti'] },
  hb: { cls: 'mk', name: 'hidroboração (concertada)', pts: [
    { x: 0.06, y: 30, k: 'end', lab: 'alceno + BH₃', tip: '<b>Reagentes</b>.' },
    { x: 0.5, y: 70, k: 'ts', lab: 'ET‡ (4 centros)', tip: '<b>Estado de transição único</b> de quatro centros: C–B e C–H formam-se juntos, pela mesma face. Leve δ+ no carbono mais substituído.' },
    { x: 0.94, y: 14, k: 'end', lab: 'trialquilborana', tip: '<b>Produto</b>: organoborana (depois oxidada a álcool).' } ], ea: [0, 1], notes: ['uma etapa', 'sem carbocátion', 'syn'] },
  taut: { cls: 'o', name: 'tautomeria', pts: [
    { x: 0.06, y: 52, k: 'end', lab: 'enol', tip: '<b>Enol</b>: menos estável (C=C + O–H).' },
    { x: 0.3, y: 82, k: 'ts', lab: 'ET1‡', tip: 'Protonação do carbono (ácido).' },
    { x: 0.5, y: 64, k: 'int', lab: 'C=OH⁺', tip: '<b>Intermediário</b>: carbonila protonada (oxocarbênio, estabilizado por ressonância).' },
    { x: 0.66, y: 70, k: 'ts', lab: 'ET2‡', tip: 'Desprotonação do O–H.' },
    { x: 0.94, y: 18, k: 'end', lab: 'cetona', tip: '<b>Forma ceto</b>: mais estável (C=O forte). O equilíbrio fica muito deslocado para ela.' } ], ea: [0, 1], notes: [] },
  cat: { cls: 'mk', name: 'com catalisador', pts: [
    { x: 0.06, y: 40, k: 'end', lab: 'alceno + H₂', tip: '<b>Reagentes</b>.' },
    { x: 0.5, y: 62, k: 'ts', lab: 'com Pd', tip: 'Com catalisador metálico: caminho com barreiras muito menores (várias etapas na superfície).' },
    { x: 0.94, y: 8, k: 'end', lab: 'alcano', tip: '<b>Produto</b>: alcano; ΔH negativo (≈ −120 kJ/mol).' } ], ea: [0, 1], notes: [] },
  nocat: { cls: 'amk', name: 'sem catalisador', pts: [
    { x: 0.06, y: 40, k: 'end', lab: '', tip: 'Reagentes.' },
    { x: 0.5, y: 98, k: 'ts', lab: 'sem catalisador', tip: 'Sem catalisador a barreira é altíssima: a mistura alceno + H₂ não reage na prática.' },
    { x: 0.94, y: 8, k: 'end', lab: '', tip: 'Produto (mesma variação de energia: o catalisador não altera ΔH).' } ], ea: [0, 1], notes: [] },
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

