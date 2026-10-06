/*
 * modules.js — componentes dos módulos conceituais: ligações e quebras,
 * espécies reativas, ácido-base, eletrófilos/nucleófilos, setas curvas,
 * pKa, fatores de acidez, termodinâmica e mecanismos.
 */
import { h, seg, shuffle } from './widgets2d.js';
import { mol, S, el, text } from './chem2d.js';
import { mechPlayer } from './anim2d.js';
import { abFrames, clclFrames, tbuBrFrames, oxoniumFrames, hclFrames, nuEFrames, cationWaterFrames, hoHclFrames, methanolFrames, bf3Frames, cnFrames, acetateFrames, allylFrames, SP, acetate, ethoxide } from './struct.js';
import { molScene, LIB3D_NAMES } from './mol3d.js';
import { approachScene, hybScene } from './scenes3d.js';
import { ACIDS, A, fmtP, CB, removeH } from './acid.js';
import { energyChart } from './energy.js';
import { exerciseCard } from './practice.js';

/* ---------- utilidades ---------- */
export const vbox = (cls = '') => h('div', { class: 'viewer ' + cls });
export const fig = (node, cap) => h('figure', { class: 'fig' }, node, cap ? h('figcaption', { html: cap }) : null);
export const sk = (s, o = {}) => mol(s, Object.assign({ scale: 46, fs: 18 }, o));
export const pick = (a) => a[Math.floor(Math.random() * a.length)];
export const btn = (t, f, cls = '') => h('button', { class: 'btn sm ' + cls, type: 'button', onclick: f }, t);
export const fbBox = () => h('div', { class: 'fb neutral', 'aria-live': 'polite', style: 'display:none' });
export function setFb(e, cls, html) { e.style.display = ''; e.className = 'fb ' + cls; e.innerHTML = html; }
export function select(opts, cur, on, label) { const s = h('select', { 'aria-label': label || 'Escolha' }, opts.map(([k, t]) => h('option', { value: k, selected: k === cur ? 'selected' : null }, t))); s.addEventListener('change', () => on(s.value)); return s; }
export const player = (host, frames, o) => mechPlayer(host, frames, o);

/* ===================================================================
 * Ligação A–B: mostrar elétrons
 * =================================================================== */
export function bondEl(host) {
  let on = false;
  const box = h('div', { class: 'projbox' });
  const draw = () => { const s = new S(); const a = s.a(0, 0, 'A'), b = s.a(1.8, 0, 'B'); s.b(a, b); if (on) s.e(0.9, -0.32, 2, 'bond'); box.innerHTML = ''; box.append(sk(s, { scale: 60, fs: 26 })); };
  const b = btn('Mostrar elétrons da ligação', (e) => { on = !on; e.currentTarget.setAttribute('aria-pressed', on); draw(); }, 'primary');
  host.append(box, h('div', { class: 'controls' }, b), h('p', { class: 'hint3' }, 'Cada traço de ligação simples representa um par de elétrons compartilhado (dois elétrons).'));
  draw();
}
export function homoHetero(host) {
  const a = h('div'), b = h('div');
  host.append(h('div', { class: 'grid2' }, h('div', null, h('h4', null, 'Homólise'), a), h('div', null, h('h4', null, 'Heterólise'), b)),
    h('div', { class: 'controls' }, btn('▶ Comparar lado a lado', () => { [pa, pb].forEach((p) => p.go(0)); let k = 0; const id = setInterval(() => { k++; if (k > 2) { clearInterval(id); return; } pa.go(k); pb.go(k); }, 2600); }, 'primary')));
  const pa = player(a, abFrames('homo'), { draw: { scale: 54 } }), pb = player(b, abFrames('hetero'), { draw: { scale: 54 } });
}

/* ===================================================================
 * Espécies reativas em 3D (radical, carbocátion, carbânion)
 * =================================================================== */
export function species3d(host, o = {}) {
  const v = vbox('tall'), note = h('p', { class: 'hint3' });
  let key = o.key || 'CH3p';
  const keys = o.keys || [['CH3r', 'radical metila'], ['CH3p', 'cátion metila'], ['tBup', 'cátion t-butila'], ['CH3m', 'ânion metila']];
  const ob = btn(o.orbLabel || 'Mostrar orbital', (e) => e.currentTarget.setAttribute('aria-pressed', sc.toggle('orb')));
  host.append(h('div', { class: 'controls' }, keys.length > 1 ? seg(keys, key, (k) => { key = k; sc.set(k); }, 'Espécie') : null, ob, btn('Mapa eletrostático', (e) => e.currentTarget.setAttribute('aria-pressed', sc.toggle('esp'))), btn('Volume', (e) => e.currentTarget.setAttribute('aria-pressed', sc.toggle('style')))), v, note);
  const sc = molScene(v, key, { flags: { orb: !!o.orbOn, lp: true }, onSet: (d) => { note.innerHTML = `<b>${d.name}</b>: ${d.note || ''}`; } });
  if (!sc.ok) note.innerHTML = 'Modelo 3D indisponível neste navegador.';
}

/* ===================================================================
 * Brønsted–Lowry: clicar nos papéis
 * =================================================================== */
const ROLES = [['acido', 'ácido'], ['base', 'base'], ['bc', 'base conjugada'], ['ac', 'ácido conjugado']];
const RXNS = [
  { sp: ['CH₃COOH', 'NH₃', 'CH₃COO⁻', 'NH₄⁺'], a: ['acido', 'base', 'bc', 'ac'], why: 'CH₃COOH doa H⁺ ao NH₃. O que sobra do ácido (CH₃COO⁻) é sua base conjugada; o NH₃ protonado (NH₄⁺) é o ácido conjugado.' },
  { sp: ['HCl', 'H₂O', 'Cl⁻', 'H₃O⁺'], a: ['acido', 'base', 'bc', 'ac'], why: 'A água recebe o H⁺ do HCl.' },
  { sp: ['CH₃OH', 'NH₂⁻', 'CH₃O⁻', 'NH₃'], a: ['acido', 'base', 'bc', 'ac'], why: 'O amideto (base forte) remove o H do O–H do metanol.' },
  { sp: ['HC≡CH', 'NH₂⁻', 'HC≡C⁻', 'NH₃'], a: ['acido', 'base', 'bc', 'ac'], why: 'O acetileno (pKa 25) é ácido mais forte que o NH₃ (pKa 38).' },
  { sp: ['H₂O', 'CH₃O⁻', 'HO⁻', 'CH₃OH'], a: ['acido', 'base', 'bc', 'ac'], why: 'Aqui a água atua como ácido: doa H⁺ ao metóxido.' },
];
export function clickRoles(host) {
  let i = 0;
  const eq = h('div', { class: 'eqroles' }), fb = fbBox();
  host.append(h('p', null, 'Escolha um papel e clique na espécie correspondente (ou use os menus).'), eq, h('div', { class: 'controls' }, btn('Conferir', () => check(), 'primary'), btn('Outra reação →', () => { i = (i + 1) % RXNS.length; draw(); })), fb);
  let sels = [];
  function draw() {
    fb.style.display = 'none'; eq.innerHTML = ''; sels = [];
    const R = RXNS[i];
    R.sp.forEach((s, k) => {
      if (k === 1 || k === 3) eq.append(h('span', { class: 'op' }, '+'));
      if (k === 2) eq.append(h('span', { class: 'op' }, '⇌'));
      const sel = select([['', 'papel?'], ...ROLES], '', () => {}, 'Papel de ' + s);
      sels.push(sel); eq.append(h('div', { class: 'spbox' }, h('b', { class: 'spf' }, s), sel));
    });
  }
  function check() {
    const R = RXNS[i]; let n = 0;
    sels.forEach((s, k) => { const ok = s.value === R.a[k]; s.classList.toggle('ok', ok); s.classList.toggle('bad', !ok); if (ok) n++; });
    setFb(fb, n === 4 ? 'ok' : 'bad', `${n}/4. ${n === 4 ? '✔ ' : ''}${R.why} <b>Par conjugado:</b> ${R.sp[0]}/${R.sp[2]} e ${R.sp[3]}/${R.sp[1]} (diferem por um H⁺).`);
  }
  draw();
}
export function conjPairs(host) {
  const defs = [
    ['Qual é a base conjugada de CH₃COOH?', ['CH₃COO⁻', 'CH₃COOH₂⁺', 'CH₃CO⁺', 'CH₂COOH⁻'], 'Remova um H⁺ (do O–H): carga diminui em uma unidade.'],
    ['Qual é o ácido conjugado de NH₃?', ['NH₄⁺', 'NH₂⁻', 'NH₃⁺', 'H₂N–NH₂'], 'Adicione um H⁺ ao par livre do N.'],
    ['Qual é a base conjugada de H₂O?', ['HO⁻', 'H₃O⁺', 'O²⁻', 'H₂O⁻'], 'Remova um H⁺.'],
    ['Qual é o ácido conjugado de H₂O?', ['H₃O⁺', 'HO⁻', 'H₂O₂', 'H₄O²⁺'], 'Adicione um H⁺.'],
    ['Qual é a base conjugada de um álcool ROH?', ['RO⁻ (alcóxido)', 'ROH₂⁺', 'R⁻', 'R⁺'], 'O H ácido é o do O–H.'],
    ['Qual é a base conjugada de NH₄⁺?', ['NH₃', 'NH₂⁻', 'NH₅', 'N³⁻'], 'Um par conjugado difere por um H⁺.'],
  ];
  defs.forEach((d, k) => host.append(exerciseCard({ title: 'Par conjugado', type: 'mc', q: d[0], o: d[1], a: 0, e: d[2] }, 'C' + (k + 1))));
}

/* ===================================================================
 * Mapas de potencial eletrostático (galeria e comparação)
 * =================================================================== */
export function espGallery(host, o = {}) {
  const keys = o.keys || ['HCl', 'CH3Br', 'acetone', 'ethanol', 'BF3'];
  const v = vbox('tall'), note = h('p', { class: 'hint3' });
  host.append(h('div', { class: 'controls' }, seg(keys.map((k) => [k, LIB3D_NAMES[k]]), keys[0], (k) => sc.set(k), 'Molécula'), btn('δ+/δ−', (e) => e.currentTarget.setAttribute('aria-pressed', sc.toggle('dl')), ''), btn('Pares livres', (e) => e.currentTarget.setAttribute('aria-pressed', sc.toggle('lp'))), btn('Mapa', (e) => e.currentTarget.setAttribute('aria-pressed', sc.toggle('esp')))), v, espLegend(), note);
  const sc = molScene(v, keys[0], { flags: { esp: true, dl: true, lp: false, orb: false }, onSet: (d) => { note.innerHTML = `<b>${d.name}</b>: ${d.note || ''}`; } });
}
export const espLegend = () => h('div', { class: 'esplegend' }, h('span', null, 'mais rico em elétrons (δ−)'), h('i'), h('span', null, 'mais pobre em elétrons (δ+)'));
export function espCompare(host, k1, k2, o = {}) {
  const a = vbox('short'), b = vbox('short');
  host.append(h('div', { class: 'grid2' }, h('div', null, a, h('p', { class: 'cardlab', html: LIB3D_NAMES[k1] })), h('div', null, b, h('p', { class: 'cardlab', html: LIB3D_NAMES[k2] }))), espLegend(), o.note ? h('p', { class: 'hint3', html: o.note }) : null);
  const f = { esp: true, lp: false, orb: false, fc: true };
  molScene(a, k1, { flags: f, esp: { range: o.range || 0.5 }, camPos: [3.5, 2.5, 7] }); molScene(b, k2, { flags: f, esp: { range: o.range || 0.5 }, camPos: [3.5, 2.5, 7] });
}

/* ===================================================================
 * Setas: errado × certo
 * =================================================================== */
export function arrowWrongRight(host) {
  const wrong = (() => { const s = new S(); const H = s.a(-0.9, 0, 'H'), O = s.a(0, 0, 'O', { chg: '−', lp: [90, 270, 0] }); s.b(H, O); const h2 = s.a(1.6, 0, 'H'), Cl = s.a(2.9, 0, 'Cl', { lp: [90, 0, 270] }); s.b(h2, Cl); s.arrow({ a: h2, ang: 120 }, { a: O, ang: 60 }, 0.5, ''); return s; })();
  const right = hoHclFrames()[1].s;
  host.append(h('div', { class: 'grid2' }, h('div', { class: 'chcard bad' }, h('h4', null, '✘ Errado'), h('div', { class: 'projbox' }, sk(wrong)), h('p', null, 'A seta "leva o H" até o O: parece movimento de átomo. Setas não partem de núcleos nem de H⁺.')), h('div', { class: 'chcard good' }, h('h4', null, '✔ Correto'), h('div', { class: 'projbox' }, sk(right)), h('p', { html: 'A seta parte do <b>par de elétrons</b> do O e termina no H; a segunda parte da <b>ligação</b> H–Cl e termina no Cl.' }))));
}

/* ===================================================================
 * Ka ↔ pKa; escala de pKa
 * =================================================================== */
export function kaPka(host) {
  let p = 4.76;
  const r = h('input', { type: 'range', min: -10, max: 50, step: 0.01, value: p, 'aria-label': 'pKa' }), out = h('div', { class: 'readout' });
  r.addEventListener('input', () => { p = +r.value; draw(); });
  host.append(h('label', { class: 'range-row' }, 'pKa', r), out);
  function draw() { const ka = Math.pow(10, -p); out.innerHTML = `<span>pKa = <b>${p.toFixed(2).replace('.', ',')}</b></span><span>Ka = 10<sup>${(-p).toFixed(2).replace('.', ',')}</sup> ≈ <b>${ka.toExponential(2).replace('e', ' × 10^')}</b></span><span>${p < 0 ? 'ácido muito forte' : p < 6 ? 'ácido moderado' : p < 20 ? 'ácido fraco' : 'ácido extremamente fraco'}</span><span>cada unidade a menos de pKa = Ka <b>10 vezes</b> maior</span>`; }
  draw();
}
export function pkaRuler(host) {
  const list = ['HCl', 'H3O', 'AcOH', 'PhOH', 'NH4', 'H2O', 'EtOH', 'HCCH', 'NH3', 'C2H4', 'C2H6'].map((k) => A[k]);
  const W = 520, H = 640, x0 = 210, top = 30, bot = H - 30, lo = -10, hi = 52;
  const Y = (p) => top + (p - lo) / (hi - lo) * (bot - top);
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chem pkaruler', role: 'img', 'aria-label': 'Régua de pKa: valores menores (topo) são ácidos mais fortes' });
  svg.style.maxWidth = '520px';
  const grad = el('defs', null, svg); const lg = el('linearGradient', { id: 'pkg', x1: 0, y1: 0, x2: 0, y2: 1 }, grad); el('stop', { offset: 0, 'stop-color': '#ff5c6c' }, lg); el('stop', { offset: 0.5, 'stop-color': '#ffd45c' }, lg); el('stop', { offset: 1, 'stop-color': '#2fd4f5' }, lg);
  el('rect', { x: x0 - 8, y: top, width: 16, height: bot - top, rx: 8, fill: 'url(#pkg)' }, svg);
  for (let p = -10; p <= 50; p += 10) { el('line', { x1: x0 - 12, x2: x0 + 12, y1: Y(p), y2: Y(p), class: 'axis' }, svg); text(svg, x0 + 16, Y(p) - 7, String(p).replace('-', '−'), { class: 'tick', 'text-anchor': 'start' }); }
  text(svg, x0, 14, 'ácido mais forte ↑', { class: 'axl' }); text(svg, x0, H - 8, 'ácido mais fraco ↓', { class: 'axl' });
  const marks = el('g', null, svg);
  const tgt = el('g', null, svg);
  list.forEach((a, i) => { const y = Y(a.pKa), side = i % 2 ? 1 : -1; const g = el('g', { class: 'pkm' }, marks); el('line', { x1: x0 + 10 * side, x2: x0 + 52 * side, y1: y, y2: y, class: 'pkl' }, g); text(g, x0 + 58 * side, y, `${a.f}  ${fmtP(a.pKa)}`, { class: 'pkt', 'text-anchor': side > 0 ? 'start' : 'end' }); });
  const q = h('div', { class: 'prompt' }), fb = fbBox(), opts = h('div', { class: 'controls' });
  host.append(h('div', { class: 'split' }, h('div', { class: 'projbox' }, svg), h('div', null, h('div', { class: 'controls' }, btn('Mostrar/ocultar valores', () => { marks.style.display = marks.style.display === 'none' ? '' : 'none'; }), btn('Posicionar um composto', () => place(), 'primary'), btn('Qual é o ácido mais forte?', () => ask(0)), btn('Base conjugada mais estável?', () => ask(1))), q, opts, fb)));
  let placing = null;
  svg.addEventListener('click', (e) => {
    if (!placing) return;
    const m = svg.getScreenCTM(); const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    const guess = lo + (pt.y - top) / (bot - top) * (hi - lo), err = Math.abs(guess - placing.pKa);
    while (tgt.firstChild) tgt.removeChild(tgt.firstChild);
    el('circle', { cx: x0, cy: Y(guess), r: 7, class: 'guess' }, tgt); el('circle', { cx: x0, cy: Y(placing.pKa), r: 7, class: 'truth' }, tgt);
    setFb(fb, err < 5 ? 'ok' : 'bad', `${err < 5 ? '✔ Boa estimativa!' : '✘ Longe.'} Você marcou pKa ≈ ${guess.toFixed(0)}; o valor aproximado é <b>${fmtP(placing.pKa)}</b> (${placing.f} → ${placing.b}).`);
    placing = null; marks.style.display = '';
  });
  function place() { placing = pick(list); marks.style.display = 'none'; while (tgt.firstChild) tgt.removeChild(tgt.firstChild); opts.innerHTML = ''; fb.style.display = 'none'; q.innerHTML = `Clique na régua onde você acha que fica o pKa de <b>${placing.f}</b>.`; }
  function ask(kind) {
    placing = null; fb.style.display = 'none';
    const three = shuffle(list).slice(0, 3), best = three.reduce((a, b) => (a.pKa < b.pKa ? a : b));
    q.innerHTML = kind ? 'Qual destes ácidos tem a <b>base conjugada mais estável</b>?' : 'Qual é o <b>ácido mais forte</b>?';
    opts.innerHTML = '';
    three.forEach((a) => opts.append(btn(a.f, () => setFb(fb, a === best ? 'ok' : 'bad', `${a === best ? '✔' : '✘'} ${best.f} (pKa ${fmtP(best.pKa)}): menor pKa = ácido mais forte = base conjugada (${best.b}) mais estável. ${three.map((x) => `${x.f}: ${fmtP(x.pKa)}`).join(' · ')}`))));
  }
}

/* ===================================================================
 * Construtor de base conjugada
 * =================================================================== */
export function cbBuilder(host) {
  let key = 'etanol', M = null, chosen = null, base = null;
  const stage = h('div', { class: 'projbox' }), stage2 = h('div', { class: 'projbox' }), fb = fbBox(), q = h('div');
  host.append(h('div', { class: 'controls' }, h('label', null, 'Ácido ', select([['etanol', 'etanol'], ['acetico', 'ácido acético'], ['propino', 'propino'], ['cloroacetico', 'ácido cloroacético'], ['metilamina', 'metilamina']], key, (k) => { key = k; load(); }))), h('p', { class: 'prompt' }, '1. Clique no H que você removeria como H⁺ (o mais ácido).'), stage, stage2, q, fb);
  function load() { M = CB[key](); chosen = null; base = null; fb.style.display = 'none'; q.innerHTML = ''; stage2.innerHTML = ''; draw(); }
  function draw() {
    stage.innerHTML = '';
    const svg = mol(M.s, { scale: 58, fs: 21 }); stage.append(svg);
    const C = svg._chem, g = el('g', { transform: C.transform }, svg);
    Object.keys(M.info).forEach((hi) => {
      const a = C.atoms[hi]; const t = el('circle', { cx: a.x, cy: a.y, r: 13, class: 'hpick', tabindex: 0, role: 'button', 'aria-label': 'Remover ' + M.info[hi].d }, g);
      const go = () => choose(+hi); t.addEventListener('click', go); t.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    });
  }
  function choose(hi) {
    chosen = hi; const inf = M.info[hi]; const best = Object.values(M.info).reduce((a, b) => (a.pKa < b.pKa ? a : b));
    base = removeH(M, hi);
    stage2.innerHTML = ''; stage2.append(fig(sk(base.s, { scale: 44 }), 'base conjugada gerada'));
    setFb(fb, inf.pKa === best.pKa ? 'ok' : 'bad', `${inf.d}: pKa ≈ ${fmtP(inf.pKa)}. ${inf.pKa === best.pKa ? '✔ É o H mais ácido.' : `✘ Há um H mais ácido: ${best.d} (pKa ≈ ${fmtP(best.pKa)}).`}`);
    q.innerHTML = '';
    const atomName = base.s.atoms[base.on][2] || 'C';
    const opts = shuffle([['on', `no ${atomName} que perdeu o H`], ['res', 'distribuída por ressonância entre dois O'], ['h', 'em um H'], ['far', 'no átomo mais distante']]);
    const box = h('div', { class: 'controls' }, h('b', null, '2. Onde fica a carga negativa?'));
    opts.forEach(([k, t]) => box.append(btn(t, () => {
      const right = inf.res ? 'res' : 'on';
      setFb(fb, k === right ? 'ok' : 'bad', (k === right ? '✔ ' : '✘ ') + (inf.res ? 'No carboxilato a carga não fica presa a um O: ressonância a distribui igualmente entre os dois O — por isso o ácido é tão mais forte que um álcool.' : `A carga fica no ${atomName} que ficou com o par da ligação. ${/C/.test(atomName) ? (key === 'propino' && inf.pKa < 30 ? 'O par está em orbital sp (50% s): relativamente estável para um carbânion.' : 'Carbânion sp³: muito instável — por isso esse H é tão pouco ácido.') : ''}`));
    })));
    q.append(box);
  }
  load();
}

/* ===================================================================
 * Tendências: período, grupo, hibridização, indução
 * =================================================================== */
function bars(host, rows, o = {}) {
  const W = 620, rh = 46, H = rows.length * rh + 40, x0 = 160, max = o.max || 55, min = o.min || -12;
  const X = (v) => x0 + (v - min) / (max - min) * (W - x0 - 30);
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chem bars', role: 'img', 'aria-label': o.alt || 'gráfico de barras' }); svg.style.maxWidth = W + 'px';
  el('line', { x1: X(0), x2: X(0), y1: 10, y2: H - 22, class: 'axis' }, svg);
  rows.forEach((r, i) => { const y = 20 + i * rh; text(svg, x0 - 10, y + 14, r.l, { class: 'blab', 'text-anchor': 'end' }); const x1 = X(Math.min(0, r.v)), x2 = X(Math.max(0, r.v)); el('rect', { x: x1, y, width: Math.max(2, x2 - x1), height: 26, rx: 5, class: 'bar ' + (r.c || '') }, svg); text(svg, x2 + 8, y + 14, r.t || fmtP(r.v), { class: 'bval', 'text-anchor': 'start' }); });
  text(svg, W / 2, H - 4, o.axis || 'pKa (menor = ácido mais forte)', { class: 'axl' });
  host.append(svg);
}
export function periodTrend(host) {
  const rows = [['CH4', 'C', 2.55], ['NH3', 'N', 3.04], ['H2O', 'O', 3.44], ['HF', 'F', 3.98]];
  host.append(h('div', { class: 'grid4 tiles4' }, ...rows.map(([k, e, en]) => h('div', { class: 'chcard tc' }, h('b', { class: 'big' }, A[k].f), h('div', null, `→ ${A[k].b}`), h('small', null, `eletronegatividade de ${e}: ${String(en).replace('.', ',')}`), h('div', { class: 'enbar' }, h('span', { style: `width:${(en - 2) / 2 * 100}%` }))))));
  bars(host, rows.map(([k]) => ({ l: A[k].f, v: A[k].pKa, c: 'b' + k })), { min: 0, max: 55, alt: 'pKa de CH4, NH3, H2O e HF' });
  host.append(h('p', { class: 'hint3', html: 'Mesmo período, átomos de tamanho semelhante: quanto mais eletronegativo o átomo que fica com a carga, mais estável a base conjugada (CH₃⁻ &lt; NH₂⁻ &lt; HO⁻ &lt; F⁻ em estabilidade).' }));
}
export function groupTrend(host) {
  const rows = [['HF', 'F', 0.92, 570, 64], ['HCl', 'Cl', 1.27, 432, 99], ['HBr', 'Br', 1.41, 366, 114], ['HI', 'I', 1.61, 298, 133]];
  const svg = el('svg', { viewBox: '0 0 640 190', class: 'chem', role: 'img', 'aria-label': 'Tamanho dos haletos e comprimento da ligação H–X' }); svg.style.maxWidth = '640px';
  rows.forEach(([k, X, d, bde, r], i) => {
    const cx = 80 + i * 160, cy = 90, R = r / 3.2, L = d * 34;
    el('circle', { cx, cy, r: R, class: 'xatom' }, svg); el('circle', { cx: cx - R - L, cy, r: 9, class: 'hatom' }, svg);
    el('line', { x1: cx - R - L + 9, y1: cy, x2: cx - R, y2: cy, class: 'bond' }, svg);
    text(svg, cx, cy, X, { class: 'atom', 'font-size': 16 }); text(svg, cx - R - L, cy, 'H', { class: 'atom', 'font-size': 11 });
    text(svg, cx - L / 2 - R / 2, cy + R + 28, `H–${X}: ${String(d).replace('.', ',')} Å`, { class: 'tick' }); text(svg, cx - L / 2 - R / 2, cy + R + 44, `${bde} kJ/mol`, { class: 'tick' });
  });
  host.append(svg);
  bars(host, rows.map(([k]) => ({ l: A[k].f, v: A[k].pKa, c: 'b' + k })), { min: -12, max: 6, alt: 'pKa de HF, HCl, HBr, HI' });
  host.append(h('p', { class: 'hint3', html: 'Descendo no grupo: o átomo cresce, a carga de X⁻ se espalha em volume maior e a ligação H–X fica mais longa e fraca → acidez <b>aumenta</b> (HF &lt; HCl &lt; HBr &lt; HI), apesar de a eletronegatividade diminuir.' }));
}
export function ptTrend(host) {
  const els = [['C', 2.55, 'CH₄', 48, 0], ['N', 3.04, 'NH₃', 38, 1], ['O', 3.44, 'H₂O', 15.7, 2], ['F', 3.98, 'HF', 3.2, 3], ['S', 2.58, 'H₂S', 7.0, 2], ['Cl', 3.16, 'HCl', -7, 3], ['Br', 2.96, 'HBr', -9, 3], ['I', 2.66, 'HI', -10, 3]];
  const pos = { C: [1, 0], N: [1, 1], O: [1, 2], F: [1, 3], S: [2, 2], Cl: [2, 3], Br: [3, 3], I: [4, 3] };
  const grid = h('div', { class: 'ptmini' }), info = h('div', { class: 'readout' });
  els.forEach(([e, en, hx, pk]) => { const [r, c] = pos[e]; grid.append(h('button', { type: 'button', class: 'pel', style: `grid-row:${r};grid-column:${c + 1}`, onclick: () => { info.innerHTML = `<span><b>${e}</b>: eletronegatividade ${String(en).replace('.', ',')}</span><span>${hx}: pKa ≈ ${fmtP(pk)}</span><span>${['C', 'N', 'O', 'F'].includes(e) ? 'no período: <b>eletronegatividade</b> domina' : 'no grupo: <b>tamanho</b> e força da ligação dominam'}</span>`; } }, h('b', null, e), h('small', null, hx))); });
  host.append(h('div', { class: 'split' }, grid, h('div', null, h('p', { html: '<b>→ ao longo do período</b> (mesmo tamanho aproximado): manda a <b>eletronegatividade</b>.<br><b>↓ descendo no grupo</b>: mandam o <b>tamanho</b> do átomo e a <b>força da ligação</b> H–A.' }), info)));
}
export function hybTrend(host) {
  const v = vbox('tall');
  host.append(h('div', { class: 'controls' }, seg([['sp3', 'sp³ (etano)'], ['sp2', 'sp² (eteno)'], ['sp', 'sp (etino)']], 'sp3', (k) => sc.set(k), 'Hibridização')), v);
  const sc = hybScene(v);
  bars(host, [{ l: 'CH₃CH₃ (sp³)', v: 50, t: '50 · 25% s' }, { l: 'CH₂=CH₂ (sp²)', v: 44, t: '44 · 33% s' }, { l: 'HC≡CH (sp)', v: 25, t: '25 · 50% s' }], { min: 0, max: 60, alt: 'pKa de etano, eteno e etino' });
}
export function inductive(host) {
  bars(host, ['AcOH', 'ClCH2COOH', 'CHCl2COOH', 'CCl3COOH'].map((k) => ({ l: A[k].f, v: A[k].pKa, c: 'ind' })), { min: 0, max: 6, alt: 'pKa dos ácidos cloroacéticos' });
}
export function inductDist(host) {
  const rows = [['ClCH2COOH', 'Cl no C α', 1], ['Cl3prop', 'Cl no C β', 2], ['Cl4but', 'Cl no C γ', 3], ['AcOH', 'sem Cl (referência)', 0]];
  const box = h('div', { class: 'inddist' });
  rows.forEach(([k, d, n]) => {
    const chain = h('div', { class: 'chain' });
    const I = (i) => (n ? Math.pow(0.6, i) : 0); // polarização decai a cada ligação σ
    if (n) chain.append(h('span', { class: 'at cl', style: '--p:1' }, 'Cl'));
    else chain.append(h('span', { class: 'at c', style: '--p:0' }, 'H₃C'));
    for (let i = 1; i < n; i++) chain.append(h('span', { class: 'at c', style: `--p:${I(i)}` }, 'CH₂'));
    if (n) chain.append(h('span', { class: 'at c', style: `--p:${I(n)}` }, 'CH₂'));
    chain.append(h('span', { class: 'at o', style: `--p:${I(n + 1)}` }, 'COOH'));
    box.append(h('div', { class: 'indrow' }, h('div', { class: 'il' }, h('b', null, A[k].f), h('small', null, d)), chain, h('b', { class: 'pk' }, 'pKa ' + fmtP(A[k].pKa))));
  });
  host.append(box, h('p', { class: 'hint3' }, 'A intensidade do laranja representa, qualitativamente, a polarização transmitida pelas ligações σ: ela cai a cada ligação. Quanto mais longe o Cl do grupo COOH, menor o efeito sobre a base conjugada.'));
}

/* ===================================================================
 * Aproximação Nu → E, estado de transição
 * =================================================================== */
export function approach(host) {
  const v = vbox('tall'), stage = h('div', { class: 'readout' });
  const r = h('input', { type: 'range', min: 0, max: 1, step: 0.01, value: 0, 'aria-label': 'Coordenada da reação' });
  const chart = h('div');
  host.append(h('div', { class: 'split' }, v, chart), h('label', { class: 'range-row' }, 'coordenada da reação', r), stage);
  const pts = [{ x: 0.08, y: 40, k: 'end', lab: 'HO⁻ + CH₃Br' }, { x: 0.5, y: 84, k: 'ts', lab: 'ET‡' }, { x: 0.92, y: 18, k: 'end', lab: 'CH₃OH + Br⁻' }];
  const E = energyChart(chart, { pts, w: 520, h: 300 });
  const dot = el('circle', { r: 8, class: 'edot2' }, E.svg);
  const sc = approachScene(v, (st) => { stage.innerHTML = st === 'reagentes' ? '<span><b>Reagentes</b>: HO⁻ se aproxima do C δ+ pelo lado oposto ao Br.</span>' : st === 'ts' ? '<span><b>Estado de transição ‡</b>: ligação O···C parcialmente formada e C···Br parcialmente rompida; carga −1 compartilhada (δ− no O e no Br). Não é isolável.</span>' : '<span><b>Produtos</b>: CH₃OH e Br⁻ (o Br levou o par da ligação).</span>'; });
  function upd() { const t = +r.value; sc.set(t); const x = 0.08 + 0.84 * t; const idx = t < 0.5 ? [0, 1] : [1, 2]; const a = pts[idx[0]], b = pts[idx[1]]; const s = (x - a.x) / (b.x - a.x), y = a.y + (b.y - a.y) * (1 - Math.cos(Math.PI * s)) / 2; const W = 520, ml = 50, mr = 20, mt = 26, mb = 40, pw = W - ml - mr, ph = 300 - mt - mb; dot.setAttribute('cx', ml + x * pw); dot.setAttribute('cy', mt + ph - y / 100 * ph); }
  r.addEventListener('input', upd); upd();
}

/* ===================================================================
 * Contabilidade eletrônica (antes × depois)
 * =================================================================== */
const ACC = [
  { t: 'HO⁻ + H–Cl → H₂O + Cl⁻', rows: [['O (do HO⁻)', '1 ligação, 3 pares, carga −1', '2 ligações, 2 pares, carga 0'], ['H (transferido)', '1 ligação (com Cl)', '1 ligação (com O)'], ['Cl', '1 ligação, 3 pares, carga 0', '0 ligação, 4 pares, carga −1']], tot: ['−1', '−1'] },
  { t: 'NH₃ + BF₃ → H₃N⁺–B⁻F₃', rows: [['N', '3 ligações, 1 par, carga 0', '4 ligações, 0 par, carga +1'], ['B', '3 ligações, 6 elétrons, carga 0', '4 ligações, 8 elétrons, carga −1']], tot: ['0', '0'] },
  { t: '(CH₃)₃C–Br → (CH₃)₃C⁺ + Br⁻', rows: [['C central', '4 ligações, carga 0', '3 ligações, orbital p vazio, carga +1'], ['Br', '1 ligação, 3 pares, carga 0', '0 ligação, 4 pares, carga −1']], tot: ['0', '0'] },
  { t: 'Cl–Cl → 2 Cl• (luz)', rows: [['cada Cl', '1 ligação, 3 pares (8 e⁻ ao redor)', '0 ligação, 3 pares + 1 elétron (7 e⁻), carga 0']], tot: ['0', '0'] },
];
export function accounting(host) {
  let i = 0;
  const box = h('div');
  host.append(h('div', { class: 'controls' }, ...ACC.map((a, k) => btn(a.t, () => { i = k; draw(); }))), box);
  function draw() {
    const a = ACC[i]; box.innerHTML = '';
    box.append(h('div', { class: 'table-wrap' }, h('table', { class: 'cmp' }, h('thead', null, h('tr', null, h('th', null, 'Átomo'), h('th', null, 'Antes'), h('th', null, 'Depois'))), h('tbody', null, a.rows.map((r) => h('tr', null, h('td', null, h('b', null, r[0])), h('td', null, r[1]), h('td', null, r[2]))), h('tr', null, h('td', null, h('b', null, 'Carga total')), h('td', null, a.tot[0]), h('td', { class: 'okc' }, h('b', null, a.tot[1] + ' ✔')))))));
    box.append(h('p', { class: 'hint3', html: 'Carga formal = elétrons de valência − (elétrons não ligantes + ½ elétrons ligantes). Cada seta curva move <b>2</b> elétrons; cada seta de meia ponta, <b>1</b>.' }));
  }
  draw();
}

export { mechPlayer, abFrames, clclFrames, tbuBrFrames, oxoniumFrames, hclFrames, nuEFrames, cationWaterFrames, hoHclFrames, methanolFrames, bf3Frames, cnFrames, acetateFrames, allylFrames, SP, acetate, ethoxide, ACIDS };
