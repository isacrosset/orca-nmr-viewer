/*
 * widgets2d.js — utilidades de interface: criação de elementos, botões
 * segmentados, alternadores, player de quadros e testes rápidos.
 */
import { mol } from './chem2d.js';

export function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  if (attrs) for (const k in attrs) {
    if (k === 'class') e.className = attrs[k];
    else if (k === 'html') e.innerHTML = attrs[k];
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), attrs[k]);
    else if (attrs[k] !== null && attrs[k] !== undefined && attrs[k] !== false) e.setAttribute(k, attrs[k]);
  }
  kids.flat().forEach((k) => { if (k !== null && k !== undefined) e.append(k.nodeType ? k : document.createTextNode(k)); });
  return e;
}
export const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const seg = (opts, cur, onPick, label) => {
  const box = h('div', { class: 'seg', role: 'group', 'aria-label': label || 'opções' });
  opts.forEach(([k, t]) => box.append(h('button', { type: 'button', 'aria-pressed': k === cur ? 'true' : 'false', 'data-k': k, html: t, onclick: () => { [...box.children].forEach((b) => b.setAttribute('aria-pressed', b.dataset.k === k)); onPick(k); } })));
  return box;
};
/* ===================================================================
 * Player de mecanismos 2D
 * =================================================================== */
export function player(host, frames, o = {}) {
  let i = 0, timer = null;
  const stage = h('div', { class: 'stage', 'aria-live': 'polite' });
  const cap = h('div', { class: 'pcap' });
  const dots = h('div', { class: 'dots' }, frames.map(() => h('i')));
  const prev = h('button', { class: 'btn sm', type: 'button', onclick: () => { stop(); go(i - 1); } }, '◀ Anterior');
  const next = h('button', { class: 'btn sm', type: 'button', onclick: () => { stop(); go(i + 1); } }, 'Passo a passo ▶');
  const play = h('button', { class: 'btn sm primary', type: 'button', onclick: () => toggle() }, '▶ Reproduzir');
  const reset = h('button', { class: 'btn sm', type: 'button', onclick: () => { stop(); go(0); } }, '⟲ Reiniciar');
  const root = h('div', { class: 'player mech' }, stage, cap, h('div', { class: 'pctrl' }, play, prev, next, reset, dots));
  host.appendChild(root);
  function go(k) {
    i = Math.max(0, Math.min(frames.length - 1, k));
    stage.innerHTML = '';
    const f = frames[i];
    stage.appendChild(mol(f.s, Object.assign({ animate: true, scale: 44, zoom: 1.4 }, o.draw || {}, f.o || {})));
    cap.innerHTML = f.cap || '';
    [...dots.children].forEach((d, n) => d.classList.toggle('on', n === i));
    prev.disabled = i === 0; next.disabled = i === frames.length - 1;
  }
  function stop() { if (timer) { clearInterval(timer); timer = null; play.textContent = '▶ Reproduzir'; } }
  function toggle() {
    if (timer) { stop(); return; }
    if (i === frames.length - 1) go(0);
    play.textContent = '❚❚ Pausar';
    timer = setInterval(() => { if (i >= frames.length - 1) { stop(); return; } go(i + 1); }, o.interval || 3200);
  }
  go(0);
  return { go, root, stop };
}

export function quickTests(root) {
  root.querySelectorAll('.note.quick[data-q]:not([data-done])').forEach((n) => {
    n.setAttribute('data-done', '');
    const opts = n.dataset.o.split(';');
    const a = +n.dataset.a;
    const fb = h('div', { class: 'qfb', 'aria-live': 'polite' });
    const box = h('div', { class: 'qopts' }, opts.map((t, k) => h('button', {
      class: 'btn sm', type: 'button',
      onclick: (e) => {
        [...box.children].forEach((b) => { b.disabled = true; });
        e.currentTarget.classList.add(k === a ? 'primary' : 'ghost');
        fb.innerHTML = (k === a ? '<b style="color:var(--green)">✔ Correto.</b> ' : `<b style="color:var(--red)">✘ Resposta: ${opts[a]}.</b> `) + n.dataset.e;
      },
    }, t)));
    n.innerHTML = `<b class="t">Teste rápido</b>${n.dataset.q}`;
    n.append(box, fb);
  });
}

export const tgl = (t, f, on, title) => h('button', { class: 'btn sm', type: 'button', title: title || null, 'aria-pressed': on ? 'true' : 'false', onclick: (e) => e.currentTarget.setAttribute('aria-pressed', f()) }, t);
