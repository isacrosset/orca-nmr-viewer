/*
 * practice.js — componentes de exercícios: setas curvas clicáveis,
 * ordenação por arrastar, múltipla escolha, V/F, associação e cartões.
 */
import { mol, el as sel } from './chem2d.js';
import { h, shuffle } from './widgets2d.js';
import { energyChart } from './energy.js';

/* ===================================================================
 * Complete o mecanismo: o estudante desenha as setas curvas
 * =================================================================== */
export function arrowPuzzle(host, def) {
  const svg = mol(def.s, { scale: def.scale || 58, fs: 19, pad: 24, zoom: 1.55 });
  const C = svg._chem;
  const over = sel('g', { transform: C.transform }, svg);
  const arrowsG = sel('g', null, over);
  const sitesG = sel('g', null, over);
  const pos = {};
  // átomos por baixo; pares livres e ligações por cima (alvos menores ficam clicáveis)
  Object.entries(def.sites).sort((x, y) => (x[1].k === 'atom' ? 0 : 1) - (y[1].k === 'atom' ? 0 : 1)).forEach(([id, st]) => {
    let p;
    if (st.k === 'lp') { const q = C.lpPos(st.a, st.ang); p = { x: q.x, y: q.y }; }
    else if (st.k === 'bond') { const a = C.atoms[st.b[0]], b = C.atoms[st.b[1]]; p = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; }
    else { const a = C.atoms[st.a]; p = { x: a.x, y: a.y }; }
    pos[id] = p;
    const g = sel('g', { class: 'site', tabindex: 0, role: 'button', 'aria-label': st.label || id }, sitesG);
    const r = st.k === 'atom' ? Math.max(13, (C.atoms[st.a].w || 10) / 2 + 4) : st.k === 'lp' ? 9 : 10;
    if (st.k === 'bond') sel('ellipse', { cx: p.x, cy: p.y, rx: 13, ry: 9 }, g);
    else sel('circle', { cx: p.x, cy: p.y, r }, g);
    const t = sel('title', null, g); t.textContent = st.label || id;
    // clicar origem → destino, ou arrastar da origem até o destino
    g.addEventListener('pointerdown', (e) => { e.preventDefault(); if (!src || id !== src) pick(id, g); else { g.classList.remove('src'); src = null; status.textContent = 'Seleção cancelada.'; } });
    g.addEventListener('pointerup', () => { if (src && id !== src) pick(id, g); });
    g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(id, g); } });
    st.g = g;
  });
  const user = [];
  let src = null;
  const rubber = sel('line', { class: 'rubber', x1: 0, y1: 0, x2: 0, y2: 0, visibility: 'hidden' }, over);
  svg.addEventListener('pointermove', (e) => {
    if (!src) { rubber.setAttribute('visibility', 'hidden'); return; }
    const m = over.getScreenCTM(); if (!m) return;
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    rubber.setAttribute('x1', pos[src].x); rubber.setAttribute('y1', pos[src].y); rubber.setAttribute('x2', pt.x); rubber.setAttribute('y2', pt.y); rubber.setAttribute('visibility', 'visible');
  });
  svg.addEventListener('pointerleave', () => rubber.setAttribute('visibility', 'hidden'));
  const status = h('div', { class: 'ap-status', 'aria-live': 'polite' }, 'Arraste da origem dos elétrons (par livre ou ligação) até o destino — ou clique na origem e depois no destino.');
  const fb = h('div');
  const undo = h('button', { class: 'btn sm', type: 'button', onclick: () => { user.pop(); redraw(); } }, '↶ Desfazer');
  const clear = h('button', { class: 'btn sm', type: 'button', onclick: () => { user.length = 0; redraw(); fb.innerHTML = ''; } }, 'Limpar');
  const check = h('button', { class: 'btn sm primary', type: 'button', onclick: () => verify() }, 'Conferir setas');
  const show = h('button', { class: 'btn sm', type: 'button', onclick: () => { user.length = 0; def.answer.forEach((a) => user.push(a.slice())); redraw(); verify(true); } }, 'Ver resposta');
  host.append(h('div', { class: 'arrowpuzzle mech' }, svg, status, h('div', { class: 'ex-actions' }, undo, clear, check, show), fb));
  // escolhas complementares (intermediário/produto)
  if (def.slots) {
    const wrap = h('div', { class: 'slots' });
    def.slots.forEach((sl) => {
      const fbs = h('div', { class: 'fb neutral', style: 'display:none' });
      const ch = h('div', { class: 'choices' });
      sl.options.forEach((op) => {
        const b = h('button', { type: 'button', 'aria-label': op.alt || op.text || 'opção' });
        if (op.s) b.append(mol(op.s, { scale: 30, fs: 14 }));
        if (op.text) b.append(h('div', { html: op.text, style: 'font-size:.85rem' }));
        b.addEventListener('click', () => {
          [...ch.children].forEach((x) => x.classList.remove('sel', 'right', 'wrong'));
          b.classList.add(op.ok ? 'right' : 'wrong');
          fbs.style.display = '';
          fbs.className = 'fb ' + (op.ok ? 'ok' : 'bad');
          fbs.innerHTML = (op.ok ? '✔ ' : '✘ ') + op.why;
        });
        ch.append(b);
      });
      wrap.append(h('div', { class: 'slot' }, h('h5', null, sl.title), ch, fbs));
    });
    host.append(wrap);
  }
  function pick(id, g) {
    const st = def.sites[id];
    if (!src) {
      if (!def.sources.includes(id)) { status.textContent = 'Setas curvas representam movimentação de elétrons, portanto devem começar em pares de elétrons ou ligações.'; return; }
      src = id; g.classList.add('src');
      status.textContent = `Origem: ${st.label}. Agora clique no destino dos elétrons.`;
      return;
    }
    if (id === src) { g.classList.remove('src'); src = null; status.textContent = 'Seleção cancelada.'; return; }
    if (!def.targets.includes(id)) { status.textContent = 'Esse ponto não pode receber a seta. Escolha um átomo ou uma ligação.'; return; }
    user.push([src, id]);
    def.sites[src].g.classList.remove('src');
    src = null;
    status.textContent = `Seta ${user.length} desenhada. Continue ou clique em “Conferir setas”.`;
    rubber.setAttribute('visibility', 'hidden');
    redraw();
  }
  function redraw() {
    while (arrowsG.firstChild) arrowsG.removeChild(arrowsG.firstChild);
    user.forEach(([a, b], k) => {
      const P = pos[a], Q = pos[b];
      const dx = Q.x - P.x, dy = Q.y - P.y;
      const bend = (def.bend && def.bend[a + '>' + b]) || -0.35;
      const cx = (P.x + Q.x) / 2 - dy * bend, cy = (P.y + Q.y) / 2 + dx * bend;
      const ux = (Q.x - cx), uy = (Q.y - cy), ul = Math.hypot(ux, uy) || 1;
      const ex = Q.x - ux / ul * 10, ey = Q.y - uy / ul * 10;
      sel('path', { d: `M${P.x},${P.y} Q${cx},${cy} ${ex},${ey}`, class: 'arrow' + (k % 2 ? ' o' : ''), 'marker-end': `url(#${C.mid}${k % 2 ? 'o' : ''})` }, arrowsG);
    });
  }
  function verify(silent) {
    const key = (a) => a[0] + '>' + a[1];
    const exp = new Set(def.answer.map(key));
    const got = new Set(user.map(key));
    const lines = [];
    user.forEach((a) => {
      const k = key(a);
      if (exp.has(k)) lines.push(`<li style="color:var(--green)">✔ ${def.sites[a[0]].label} → ${def.sites[a[1]].label}</li>`);
      else lines.push(`<li style="color:#ffd3d8">✘ ${def.sites[a[0]].label} → ${def.sites[a[1]].label}: ${(def.msgs && def.msgs[k]) || def.sites[a[0]].why || def.generic || 'Essa seta não representa um movimento de elétrons desta etapa.'}</li>`);
    });
    const missing = [...exp].filter((k) => !got.has(k));
    const ok = missing.length === 0 && user.every((a) => exp.has(key(a)));
    fb.className = 'fb ' + (ok ? 'ok' : 'bad');
    fb.innerHTML = (ok ? `<b>✔ Mecanismo correto!</b> ${def.done || ''}` : `<b>${silent ? 'Resposta:' : 'Ainda não.'}</b> ${missing.length && !silent ? `Falta(m) ${missing.length} seta(s). ` : ''}`) + (lines.length && !ok ? `<ul style="margin:6px 0 0;padding-left:18px">${lines.join('')}</ul>` : '');
  }
}

/* ===================================================================
 * Ordenação (arrastar ou botões ↑↓)
 * =================================================================== */
export function sortable(host, def) {
  const ul = h('ul', { class: 'sortable', 'aria-label': def.label || 'Lista ordenável' });
  let order = def.items.slice();
  // embaralha garantindo que não comece já na ordem correta
  do { order = shuffle(def.items); } while (order.map((x) => x.id).join() === def.correct.join() && def.items.length > 1);
  const fb = h('div');
  const axis = h('div', { class: 'sort-axis' }, h('span', null, def.top || '1º'), h('span', null, def.bottom || ''));
  host.append(axis, ul, h('div', { class: 'ex-actions' },
    h('button', { class: 'btn sm primary', type: 'button', onclick: () => check(false) }, 'Conferir'),
    h('button', { class: 'btn sm', type: 'button', onclick: () => { order = def.correct.map((id) => def.items.find((x) => x.id === id)); render(); check(true); } }, 'Ver resposta')), fb);
  function render() {
    ul.innerHTML = '';
    order.forEach((it, i) => {
      const li = h('li', { 'data-id': it.id },
        h('span', { class: 'grip', 'aria-hidden': 'true' }, '⠿'),
        h('span', { class: 'pos' }, String(i + 1)),
        h('span', { class: 's' }, it.s ? mol(it.s, { scale: 30, fs: 14 }) : null, h('span', { html: it.label })),
        h('span', { class: 'mv' },
          h('button', { class: 'btn sm', type: 'button', 'aria-label': 'Mover para cima', onclick: () => move(i, -1) }, '▲'),
          h('button', { class: 'btn sm', type: 'button', 'aria-label': 'Mover para baixo', onclick: () => move(i, 1) }, '▼')));
      dragify(li, i);
      ul.append(li);
    });
  }
  function move(i, d) {
    const j = i + d;
    if (j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
    render(); fb.innerHTML = '';
  }
  function dragify(li, i) {
    const grip = li.querySelector('.grip');
    grip.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      grip.setPointerCapture(e.pointerId);
      li.classList.add('dragging');
      const startY = e.clientY;
      const rects = [...ul.children].map((c) => c.getBoundingClientRect());
      const onMove = (ev) => { li.style.transform = `translateY(${ev.clientY - startY}px)`; };
      const onUp = (ev) => {
        grip.removeEventListener('pointermove', onMove); grip.removeEventListener('pointerup', onUp);
        li.classList.remove('dragging'); li.style.transform = '';
        const y = ev.clientY;
        let target = rects.findIndex((r) => y < r.top + r.height / 2);
        if (target === -1) target = rects.length - 1;
        else if (target > i) target -= 1;
        const [it] = order.splice(i, 1);
        order.splice(target, 0, it);
        render(); fb.innerHTML = '';
      };
      grip.addEventListener('pointermove', onMove);
      grip.addEventListener('pointerup', onUp);
    });
  }
  function check(reveal) {
    const ok = order.every((it, i) => it.id === def.correct[i]);
    [...ul.children].forEach((li, i) => { li.classList.toggle('ok', li.dataset.id === def.correct[i]); li.classList.toggle('bad', li.dataset.id !== def.correct[i]); });
    fb.className = 'fb ' + (ok ? 'ok' : 'bad');
    fb.innerHTML = (ok ? '<b>✔ Ordem correta!</b> ' : reveal ? '<b>Ordem correta:</b> ' : '<b>✘ Ainda não.</b> Itens em vermelho estão fora do lugar. ') + (ok || reveal ? def.explain : '');
  }
  render();
}

/* ===================================================================
 * Cartão de exercício proposto
 * tipos: mc | tf | match | order | arrows
 * =================================================================== */
function figOf(f) {
  if (!f) return null;
  if (f.energy) { const d = h('div'); energyChart(d, { show: f.energy, h: 300, animate: false, noEa: f.energy.length > 1 }); return d; }
  const box = h('div', { class: 'figs' });
  (Array.isArray(f) ? f : [f]).forEach((x) => box.append(h('figure', { class: 'fig' }, x.svg ? x.svg() : mol(x.s, { scale: x.scale || 38, fs: 16, zoom: x.zoom }), x.cap ? h('figcaption', { html: x.cap }) : null)));
  return box;
}

export function exerciseCard(def, num, store) {
  const body = h('div', { class: 'ex-body' }, h('p', { html: def.q }));
  const f = figOf(def.fig);
  if (f) body.append(f);
  const ans = h('div'), expl = h('div');
  const actions = h('div', { class: 'ex-actions' });
  const mark = (ok) => { if (store) store(num, ok); };
  const typeName = { mc: 'múltipla escolha', tf: 'verdadeiro ou falso', match: 'associação', order: 'ordenação', arrows: 'complete o mecanismo', struct: 'escolha a estrutura', pickH: 'clique nos átomos' }[def.struct ? 'struct' : def.type];
  if (def.type === 'mc') {
    // embaralha as alternativas (mantendo a correta)
    const ord = shuffle(def.o.map((_, i) => i));
    def = Object.assign({}, def, { o: ord.map((i) => def.o[i]), a: ord.indexOf(def.a) });
    let chosen = null;
    const box = h('div', { class: 'mcq' + (def.struct ? ' cols' : '') });
    def.o.forEach((op, i) => {
      const b = h('button', { class: 'mopt' + (def.struct ? ' struct' : ''), type: 'button' }, h('span', { class: 'l' }, 'abcdef'[i]));
      if (op.s || op.svg) { b.append(op.svg ? op.svg() : mol(op.s, { scale: 32, fs: 15 })); if (op.t) b.append(h('span', { html: op.t })); }
      else b.append(h('span', { html: op.t || op }));
      b.addEventListener('click', () => { [...box.children].forEach((x) => x.classList.remove('sel', 'right', 'wrong')); b.classList.add('sel'); chosen = i; ans.innerHTML = ''; });
      box.append(b);
    });
    body.append(box);
    actions.append(h('button', { class: 'btn sm primary', type: 'button', onclick: () => {
      if (chosen === null) { ans.innerHTML = '<div class="fb neutral">Escolha uma alternativa primeiro.</div>'; return; }
      const ok = chosen === def.a;
      box.children[chosen].classList.remove('sel'); box.children[chosen].classList.add(ok ? 'right' : 'wrong');
      ans.innerHTML = `<div class="fb ${ok ? 'ok' : 'bad'}">${ok ? '✔ Correto!' : '✘ Não é essa. Tente de novo ou veja a resposta.'}</div>`;
      mark(ok);
    } }, 'Conferir'));
    actions.append(h('button', { class: 'btn sm', type: 'button', onclick: () => { [...box.children].forEach((x, i) => x.classList.toggle('right', i === def.a)); ans.innerHTML = `<div class="reveal ans"><b>Resposta:</b> ${'abcdef'[def.a]}) ${def.o[def.a].t || (typeof def.o[def.a] === 'string' ? def.o[def.a] : 'estrutura destacada')}</div>`; } }, 'Ver resposta'));
  } else if (def.type === 'tf') {
    const rows = def.items.map((it) => {
      const sel1 = h('select', { 'aria-label': 'Verdadeiro ou falso' }, h('option', { value: '' }, '—'), h('option', { value: 'V' }, 'V'), h('option', { value: 'F' }, 'F'));
      const row = h('div', { class: 'mrow' }, h('span', { html: it[0] }), sel1);
      return { row, sel: sel1, a: it[1] };
    });
    body.append(h('div', { class: 'match' }, rows.map((r) => r.row)));
    actions.append(h('button', { class: 'btn sm primary', type: 'button', onclick: () => {
      let n = 0; rows.forEach((r) => { const ok = r.sel.value === r.a; r.row.classList.toggle('ok', ok); r.row.classList.toggle('bad', !ok); if (ok) n++; });
      ans.innerHTML = `<div class="fb ${n === rows.length ? 'ok' : 'bad'}">${n} de ${rows.length} corretas.</div>`;
      mark(n === rows.length);
    } }, 'Conferir'));
    actions.append(h('button', { class: 'btn sm', type: 'button', onclick: () => { rows.forEach((r) => { r.sel.value = r.a; r.row.classList.add('ok'); r.row.classList.remove('bad'); }); ans.innerHTML = '<div class="reveal ans"><b>Resposta:</b> ' + rows.map((r, i) => `${i + 1}-${r.a}`).join(' · ') + '</div>'; } }, 'Ver resposta'));
  } else if (def.type === 'match') {
    const opts = shuffle(def.pairs.map((p) => p[1]));
    const rows = def.pairs.map((p) => {
      const s = h('select', { 'aria-label': 'Associação para ' + p[0] }, h('option', { value: '' }, 'escolha…'), opts.map((o) => h('option', { value: o }, o)));
      const row = h('div', { class: 'mrow' }, h('span', { html: '<b>' + p[0] + '</b>' }), s);
      return { row, s, a: p[1] };
    });
    body.append(h('div', { class: 'match' }, rows.map((r) => r.row)));
    actions.append(h('button', { class: 'btn sm primary', type: 'button', onclick: () => {
      let n = 0; rows.forEach((r) => { const ok = r.s.value === r.a; r.row.classList.toggle('ok', ok); r.row.classList.toggle('bad', !ok); if (ok) n++; });
      ans.innerHTML = `<div class="fb ${n === rows.length ? 'ok' : 'bad'}">${n} de ${rows.length} associações corretas.</div>`;
      mark(n === rows.length);
    } }, 'Conferir'));
    actions.append(h('button', { class: 'btn sm', type: 'button', onclick: () => { rows.forEach((r) => { r.s.value = r.a; r.row.classList.add('ok'); r.row.classList.remove('bad'); }); ans.innerHTML = ''; } }, 'Ver resposta'));
  } else if (def.type === 'order') {
    const d = h('div'); body.append(d);
    sortable(d, def);
  } else if (def.type === 'arrows') {
    const d = h('div'); body.append(d);
    arrowPuzzle(d, def.puzzle);
  }
  actions.append(h('button', { class: 'btn sm ghost', type: 'button', onclick: () => { expl.innerHTML = expl.innerHTML ? '' : `<div class="reveal sol"><b>Explicação:</b> ${def.e}</div>`; } }, 'Ver explicação'));
  body.append(actions, ans, expl);
  return h('div', { class: 'ex' }, h('div', { class: 'ex-head' }, h('span', { class: 'num' }, num), h('span', { html: def.title || '' }), h('span', { class: 'type chip' }, typeName)), body);
}

/* ===================================================================
 * Exercício resolvido
 * =================================================================== */
export function solvedCard(def, num) {
  const body = h('div', { class: 'ex-body' }, h('p', { html: '<b>Enunciado.</b> ' + def.q }));
  const f = figOf(def.fig);
  if (f) body.append(f);
  body.append(h('p', { class: 'think', html: '💭 <b>Pense primeiro:</b> ' + def.think }));
  const hint = h('div'), sol = h('div');
  body.append(h('div', { class: 'ex-actions' },
    h('button', { class: 'btn sm', type: 'button', onclick: () => { hint.innerHTML = hint.innerHTML ? '' : `<div class="reveal hint"><b>Dica:</b> ${def.hint}</div>`; } }, '💡 Mostrar dica'),
    h('button', { class: 'btn sm primary', type: 'button', onclick: () => {
      if (sol.innerHTML) { sol.innerHTML = ''; return; }
      const r = h('div', { class: 'reveal sol' }, h('b', null, 'Resolução'), h('ol', null, def.steps.map((s) => h('li', { html: s }))));
      const sf = figOf(def.solFig);
      if (sf) r.append(sf);
      if (def.answer) r.append(h('p', { html: '<b>Resposta:</b> ' + def.answer }));
      sol.append(r);
    } }, '✔ Mostrar resolução')), hint, sol);
  return h('div', { class: 'ex' }, h('div', { class: 'ex-head' }, h('span', { class: 'num' }, num), h('span', { html: def.title }), h('span', { class: 'type chip' }, def.level)), body);
}
