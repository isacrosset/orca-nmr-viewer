/*
 * anim2d.js — player de mecanismos 2D: cada quadro é uma estrutura (chem2d);
 * nos quadros com setas, os elétrons (pontos) percorrem cada seta —
 * dois por seta curva completa, um por seta de meia ponta.
 * Controles: anterior, próximo, reproduzir/pausar, repetir elétrons, reiniciar.
 */
import { mol, el } from './chem2d.js';
import { h } from './widgets2d.js';

const reduce = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** anima pontos (elétrons) ao longo das setas de um SVG já renderizado */
export function flowElectrons(svg, dur = 1500) {
  const paths = [...svg.querySelectorAll('path.arrow')];
  const items = [];
  paths.forEach((p) => {
    const one = /\bh(c)?\b/.test(p.getAttribute('class'));
    const L = p.getTotalLength();
    const n = one ? 1 : 2;
    for (let k = 0; k < n; k++) items.push({ p, L, k, n, c: el('circle', { r: 3.4, class: 'eflow' + (one ? ' one' : '') }, p.parentNode) });
  });
  if (!items.length) return () => {};
  let raf = 0;
  const t0 = performance.now();
  const step = (now) => {
    const t = reduce() ? 1 : Math.min(1, (now - t0) / dur), e = t * t * (3 - 2 * t);
    items.forEach((it) => {
      const s = Math.min(1, Math.max(0, e - it.k * 0.06));
      const q = it.p.getPointAtLength(s * it.L * 0.97);
      const q2 = it.p.getPointAtLength(Math.min(it.L, s * it.L * 0.97 + 1));
      const nx = -(q2.y - q.y), ny = q2.x - q.x, nl = Math.hypot(nx, ny) || 1;
      const off = it.n === 2 ? (it.k ? 3.2 : -3.2) : 0;
      it.c.setAttribute('cx', q.x + nx / nl * off); it.c.setAttribute('cy', q.y + ny / nl * off);
    });
    if (t < 1) raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
  return () => { cancelAnimationFrame(raf); items.forEach((it) => it.c.remove()); };
}

/**
 * mechPlayer(host, frames, o)
 * frames: [{ s, cap, o? }]   o: { scale, zoom, interval }
 */
export function mechPlayer(host, frames, o = {}) {
  let i = 0, timer = null, stopFlow = () => {};
  const stage = h('div', { class: 'stage', 'aria-live': 'polite' });
  const cap = h('div', { class: 'pcap' });
  const dots = h('div', { class: 'dots' }, frames.map((_, k) => h('button', { type: 'button', class: 'dotb', 'aria-label': `Quadro ${k + 1}`, onclick: () => { stop(); go(k); } })));
  const prev = h('button', { class: 'btn sm', type: 'button', onclick: () => { stop(); go(i - 1); } }, '◀ Anterior');
  const next = h('button', { class: 'btn sm', type: 'button', onclick: () => { stop(); go(i + 1); } }, 'Próximo ▶');
  const play = h('button', { class: 'btn sm primary', type: 'button', onclick: () => toggle() }, '▶ Reproduzir');
  const again = h('button', { class: 'btn sm', type: 'button', title: 'Repetir o movimento dos elétrons', onclick: () => flow() }, '↻ elétrons');
  const reset = h('button', { class: 'btn sm', type: 'button', onclick: () => { stop(); go(0); } }, '⟲');
  const counter = h('span', { class: 'pcount' });
  const root = h('div', { class: 'player mech' }, stage, cap, h('div', { class: 'pctrl' }, play, prev, next, again, reset, counter, dots));
  host.appendChild(root);
  function flow() { stopFlow(); const svg = stage.querySelector('svg'); if (svg) stopFlow = flowElectrons(svg, o.flow || 1500); }
  function go(k) {
    i = Math.max(0, Math.min(frames.length - 1, k));
    stopFlow(); stage.innerHTML = '';
    const f = frames[i];
    stage.appendChild(mol(f.s, Object.assign({ scale: 46, zoom: 1.35, fs: 18 }, o.draw || {}, f.o || {})));
    cap.innerHTML = f.cap || '';
    [...dots.children].forEach((d, n) => d.classList.toggle('on', n === i));
    prev.disabled = i === 0; next.disabled = i === frames.length - 1;
    counter.textContent = `${i + 1}/${frames.length}`;
    again.disabled = !(f.s.arrows && f.s.arrows.length);
    requestAnimationFrame(flow);
  }
  function stop() { if (timer) { clearInterval(timer); timer = null; play.textContent = '▶ Reproduzir'; } }
  function toggle() {
    if (timer) { stop(); return; }
    if (i === frames.length - 1) go(0);
    play.textContent = '❚❚ Pausar';
    timer = setInterval(() => { if (i >= frames.length - 1) { stop(); return; } go(i + 1); }, o.interval || 3400);
  }
  go(0);
  return { go, root, stop: () => { stop(); stopFlow(); } };
}
