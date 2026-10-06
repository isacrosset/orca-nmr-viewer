/*
 * m1.js — módulos 1–12: início, átomo, configuração eletrônica, valência,
 * símbolos de Lewis, octeto, ligação covalente, Lewis, carga formal,
 * ressonância e VSEPR (domínios).
 */
import { h, shuffle, seg, player } from './widgets2d.js';
import { S, mol } from './chem2d.js';
import { L, MOLS } from './lib.js';
import { lewisSVG, lewisS, centerInfo, valenceElectrons, charge, fc, nbs, VAL, clone, bondSum, shellElectrons, drawnElectrons } from './struct.js';
import { molScene } from './scene3d.js';
import { fb, clear, sel, molOpts, lewisFig, img3d, vbox, pickN, rnd, choice, infoRows, SP_LEGEND } from './ui.js';

/* ===================================================================
 * 1. Início — sequência animada
 * =================================================================== */
export function hero(host) {
  const steps = [
    ['Átomo de carbono', 'Z = 6 · 1s² 2s² 2p² · 4 elétrons de valência', () => boxes('C')],
    ['Orbitais', '2s e três 2p na camada de valência', () => h('div', { class: 'herofor' }, ['2s', '2pₓ', '2pᵧ', '2p_z'].map((t) => h('span', { class: 'orbchip' }, t)))],
    ['Ligações', 'compartilhamento de pares de elétrons', () => lewisSVG(L('H2'), { scale: 50 })],
    ['Estrutura de Lewis', 'CH₄: quatro pares ligantes', () => lewisSVG(L('CH4'), { scale: 46 })],
    ['Molécula tetraédrica', 'carbono sp³, ângulos de 109,5°', () => lewisSVG(L('etano'), { scale: 40 })],
    ['Etano · eteno · etino', 'sp³ · sp² · sp', () => h('div', { class: 'herotrio' }, ['etano', 'eteno', 'etino'].map((k) => lewisSVG(L(k), { scale: 30, fs: 14 })))],
  ];
  const keys = [null, null, 'H2', 'CH4', 'CH4', 'etano'];
  const stage = h('div', { class: 'herostage', 'aria-live': 'polite' }), dots = h('div', { class: 'dots' }, steps.map(() => h('i'))), v = vbox('tall');
  host.append(h('div', { class: 'herobox' }, stage, dots), v);
  let i = 0, S3 = null, trio = 0;
  const show = () => {
    const [t, d, f] = steps[i];
    clear(stage).append(h('div', { class: 'herostep' }, h('h4', null, t), f(), h('p', null, d)));
    [...dots.children].forEach((x, k) => x.classList.toggle('on', k === i));
    const k = i === 5 ? ['etano', 'eteno', 'etino'][trio++ % 3] : keys[i] || 'CH4';
    if (!S3 || S3.LS.key !== k) { if (S3) S3.v.dispose(); clear(v); S3 = molScene(v, L(k), { spin: true, hint: false, hyb: i >= 4, lp: false, dist: 7 }); }
  };
  show();
  const timer = setInterval(() => { if (!host.isConnected) { clearInterval(timer); return; } i = (i + 1) % steps.length; show(); }, 2800);
  host._stop = () => clearInterval(timer);
}

/* ===================================================================
 * 2. Por que o carbono forma tantas moléculas?
 * =================================================================== */
export function whyCarbon(host) {
  const list = [['CH4', 'sp³ · tetraédrico'], ['etano', 'C–C simples, rotação livre'], ['eteno', 'C=C · plano'], ['etino', 'C≡C · linear'], ['benzeno', 'anel plano, π deslocalizado']];
  host.append(h('div', { class: 'cards5' }, list.map(([k, t]) => h('div', { class: 'chcard center' }, h('h4', null, MOLS[k][1]), lewisSVG(L(k), { scale: 26, fs: 13 }), img3d(k, { w: 180, h: 130, dist: k === 'benzeno' ? 9 : 6.5 }), h('small', null, t)))));
}

/* ===================================================================
 * 3. Átomo
 * =================================================================== */
const ELS = { H: [1, 1, 0], He: [2, 4, 2], Li: [3, 7, 4], Be: [4, 9, 5], B: [5, 11, 6], C: [6, 12, 6], N: [7, 14, 7], O: [8, 16, 8], F: [9, 19, 10], Ne: [10, 20, 10], Na: [11, 23, 12], Mg: [12, 24, 12], Al: [13, 27, 14], Si: [14, 28, 14], P: [15, 31, 16], S: [16, 32, 16], Cl: [17, 35, 18], Ar: [18, 40, 22] };
export function atomCard(host) {
  let el = 'C';
  const box = h('div'), cv = h('canvas', { width: 260, height: 260, class: 'cloud', 'aria-label': 'nuvem de probabilidade (1s)' });
  const go = () => {
    const [Z, A, Nn] = ELS[el];
    clear(box).append(h('div', { class: 'tiles4' }, [['Z (prótons)', Z], ['nêutrons', Nn], ['elétrons (átomo neutro)', Z], ['número de massa A', A]].map(([t, v]) => h('div', { class: 'tc chcard' }, h('b', { class: 'big' }, String(v)), h('small', null, t)))), h('p', { class: 'hint3' }, `Configuração: ${config(Z)}`));
  };
  host.append(h('div', { class: 'grid2' }, h('div', null, h('div', { class: 'controls' }, h('label', null, 'Elemento: ', sel(Object.keys(ELS).map((e) => [e, e]), el, (x) => { el = x; go(); }))), box),
    h('figure', { class: 'fig' }, cv, h('figcaption', null, 'Cada ponto é uma posição possível do elétron 1s em uma medida; a densidade de pontos reflete |ψ|². Não há trajetória.'))));
  go();
  // amostragem de |ψ1s|² projetada em 2D (rejeição)
  const ctx = cv.getContext('2d'); let n = 0;
  ctx.fillStyle = '#0a1222'; ctx.fillRect(0, 0, 260, 260);
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(130, 130, 3, 0, 7); ctx.fill();
  const tick = () => {
    if (!cv.isConnected || n > 4000) return;
    for (let k = 0; k < 40; k++) {
      // r com distribuição r²e^{−2r} (gama k=3), direção isotrópica
      const r = -Math.log(Math.random() * Math.random() * Math.random()) / 2, ct = 2 * Math.random() - 1, ph = 2 * Math.PI * Math.random(), st = Math.sqrt(1 - ct * ct);
      const x = 130 + r * st * Math.cos(ph) * 32, y = 130 + r * ct * 32;
      ctx.fillStyle = 'rgba(47,212,245,.55)'; ctx.fillRect(x, y, 1.6, 1.6); n++;
    }
    requestAnimationFrame(tick);
  };
  tick();
}

/* ===================================================================
 * 4. Configuração eletrônica
 * =================================================================== */
const SUB = [['1s', 1], ['2s', 1], ['2p', 3], ['3s', 1], ['3p', 3]];
export function fill(Z) { // estado fundamental: Aufbau + Hund
  const out = {}; let left = Z;
  SUB.forEach(([s, n]) => { const cap = 2 * n, e = Math.min(left, cap); left -= e; const boxes = Array(n).fill(''); for (let k = 0; k < e; k++) { const b = k % n; boxes[b] += k < n ? '↑' : '↓'; } out[s] = boxes; });
  return out;
}
const SUP = (n) => String(n).replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]);
export function config(Z) { const F = fill(Z); return SUB.map(([s]) => { const e = F[s].join('').length; return e ? s + SUP(e) : ''; }).filter(Boolean).join(' '); }
export function boxes(el, o = {}) {
  const Z = ELS[el][0], F = o.state || fill(Z);
  return h('div', { class: 'obox-row' }, SUB.filter(([s]) => o.all || F[s].join('') || (Z > 10 && s[0] === '3') || (Z <= 10 && s[0] !== '3')).map(([s]) => h('div', { class: 'obox-g' }, h('div', { class: 'obox-set' }, F[s].map((b) => h('span', { class: 'obox' }, b))), h('small', null, s))));
}
export function configTable(host) {
  host.append(h('div', { class: 'cfgcards' }, ['H', 'C', 'N', 'O', 'F', 'Cl'].map((e) => h('div', { class: 'chcard center' }, h('h4', null, `${e} (Z = ${ELS[e][0]})`), h('div', { class: 'cfg' }, config(ELS[e][0])), boxes(e)))));
}
export function energyLadder(host) {
  // diagrama qualitativo de ordem de preenchimento
  const lv = [['1s', 0, 1], ['2s', 1, 1], ['2p', 1.5, 3], ['3s', 2.6, 1], ['3p', 3.1, 3], ['4s', 3.9, 1], ['3d', 4.3, 5]];
  const s = new S();
  lv.forEach(([t, y, n], k) => { for (let q = 0; q < n; q++) { const x = (k % 2 ? 4.2 : 0.6) + q * 0.9; s.a(x, 5 - y, '', {}); s.a(x + 0.7, 5 - y, '', {}); s.b(s.n - 2, s.n - 1, 1); } s.t((k % 2 ? 4.2 : 0.6) - 0.6, 5 - y, t, 'cond', 15); });
  s.t(8.6, 0.2, 'energia ↑', 'cond', 13);
  host.append(h('figure', { class: 'fig' }, mol(s, { scale: 40, fs: 14 }), h('figcaption', null, 'Ordem de preenchimento (Aufbau, esquemática): 1s < 2s < 2p < 3s < 3p < 4s < 3d. Em Química Orgânica, o foco é 1s, 2s e 2p.')));
}
export function configBuilder(host) {
  let el = 'C', st = null;
  const area = h('div', { class: 'cfgbuild' }), out = h('div', { 'aria-live': 'polite' }), info = h('p', { class: 'prompt' });
  const reset = () => { st = {}; SUB.forEach(([s, n]) => { st[s] = Array(n).fill(''); }); render(); out.innerHTML = ''; };
  const CYCLE = ['', '↑', '↑↓', '↓', '↑↑'];
  const render = () => {
    const Z = ELS[el][0];
    info.innerHTML = `Distribua <b>${Z}</b> elétron${Z > 1 ? 's' : ''} do ${el}. Clique em um orbital para alternar: vazio → ↑ → ↑↓ → ↓ → ↑↑.`;
    clear(area).append(...SUB.slice().reverse().map(([s, n]) => h('div', { class: 'cfgrow' }, h('b', null, s), h('div', { class: 'obox-set' }, st[s].map((b, k) => h('button', { type: 'button', class: 'obox btnbox', 'aria-label': `${s} orbital ${k + 1}: ${b || 'vazio'}`, onclick: () => { st[s][k] = CYCLE[(CYCLE.indexOf(b) + 1) % CYCLE.length]; render(); out.innerHTML = ''; } }, b))))));
  };
  const check = () => {
    const Z = ELS[el][0], msgs = [];
    const tot = SUB.reduce((t, [s]) => t + st[s].join('').length, 0);
    if (tot !== Z) msgs.push(`Total de elétrons: ${tot}; o ${el} neutro tem ${Z}.`);
    SUB.forEach(([s]) => st[s].forEach((b) => { if (b === '↑↑') msgs.push(`<b>Pauli:</b> em ${s} há dois elétrons com o mesmo spin no mesmo orbital — elétrons emparelhados têm spins opostos.`); }));
    const cnt = SUB.map(([s, n]) => [s, n, st[s].join('').length]);
    cnt.forEach(([s, n, e], k) => { if (e && cnt.slice(0, k).some(([, n2, e2]) => e2 < 2 * n2)) msgs.push(`<b>Aufbau:</b> há elétron em ${s} enquanto um subnível de menor energia ainda não está completo.`); });
    SUB.forEach(([s, n]) => { if (n < 3) return; const b = st[s]; if (b.some((x) => x.length === 2) && b.some((x) => x === '')) msgs.push(`<b>Hund:</b> em ${s}, emparelhe só depois de colocar um elétron em cada orbital.`); const singles = b.filter((x) => x.length === 1); if (new Set(singles).size > 1) msgs.push(`<b>Hund:</b> em ${s}, elétrons desemparelhados devem ter spins paralelos.`); });
    const uniq = [...new Set(msgs)];
    out.replaceChildren(fb(uniq.length ? 'bad' : 'ok', uniq.length ? uniq.join('<br>') : `✔ Correto: ${el} = ${config(Z)}. Elétrons desemparelhados: ${SUB.reduce((t, [s]) => t + st[s].filter((x) => x.length === 1).length, 0)}.`));
  };
  host.append(h('div', { class: 'controls' }, h('label', null, 'Elemento: ', sel(['H', 'He', 'Li', 'B', 'C', 'N', 'O', 'F', 'Ne', 'Na', 'Si', 'P', 'S', 'Cl'].map((e) => [e, `${e} (Z = ${ELS[e][0]})`]), el, (x) => { el = x; reset(); }))), info, area,
    h('div', { class: 'ex-actions' }, h('button', { class: 'btn primary', type: 'button', onclick: check }, 'Verificar'), h('button', { class: 'btn', type: 'button', onclick: reset }, 'Limpar'), h('button', { class: 'btn', type: 'button', onclick: () => { st = fill(ELS[el][0]); render(); out.replaceChildren(fb('neutral', `${el}: ${config(ELS[el][0])}`)); } }, 'Mostrar resposta')), out);
  reset();
}

/* ===================================================================
 * 5. Elétrons de valência e símbolos de Lewis
 * =================================================================== */
const VE = { H: 1, C: 4, N: 5, O: 6, F: 7, Cl: 7, S: 6, P: 5, B: 3, Si: 4, Br: 7, Na: 1, Mg: 2, Al: 3 };
export function valQuiz(host) {
  let n = 0, ok = 0;
  const box = h('div'), stat = h('p', { class: 'hint3' });
  const ask = () => {
    const e = rnd(Object.keys(VE)), a = VE[e];
    const opts = shuffle([...new Set([a, a + 1, a - 1, a + 2, 8 - a].filter((x) => x > 0 && x <= 8))]).slice(0, 4);
    if (!opts.includes(a)) opts[0] = a;
    clear(box).append(h('div', { class: 'bigsp' }, e), h('p', { class: 'cardlab' }, 'Quantos elétrons de valência?'), choice(shuffle(opts), a, (good) => { n++; if (good) ok++; stat.textContent = `${ok}/${n} acertos`; box.append(fb(good ? 'ok' : 'bad', `${e}: ${ELS[e] ? config(ELS[e][0]) : ''} → <b>${a}</b> elétrons na camada de valência.`), h('button', { class: 'btn sm', type: 'button', onclick: ask }, 'Próximo →')); }));
  };
  host.append(stat, box);
  ask();
}
export function lewisSymbol(host) {
  let el = 'N';
  const wrap = h('div', { class: 'lsym' }), out = h('div');
  const slots = Array(8).fill(false);
  const pos = [[0, -1, -0.22], [0, -1, 0.22], [1, 0, -0.22], [1, 0, 0.22], [0, 1, -0.22], [0, 1, 0.22], [-1, 0, -0.22], [-1, 0, 0.22]];
  const render = () => {
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg'); svg.setAttribute('viewBox', '-60 -60 120 120'); svg.setAttribute('class', 'chem lsvg'); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', 'símbolo de Lewis');
    const t = document.createElementNS(svgNS, 'text'); t.setAttribute('x', 0); t.setAttribute('y', 0); t.setAttribute('text-anchor', 'middle'); t.setAttribute('dominant-baseline', 'central'); t.setAttribute('class', 'atom'); t.setAttribute('font-size', 34); t.textContent = el; svg.append(t);
    pos.forEach(([sx, sy, off], k) => {
      const cx = sx * 30 + (sy ? off * 40 : 0), cy = sy * 30 + (sx ? off * 40 : 0);
      const g = document.createElementNS(svgNS, 'circle'); g.setAttribute('cx', cx); g.setAttribute('cy', cy); g.setAttribute('r', slots[k] ? 4.2 : 6); g.setAttribute('class', slots[k] ? 'edotf' : 'eslot'); g.setAttribute('tabindex', 0); g.setAttribute('role', 'button'); g.setAttribute('aria-label', 'posição de elétron ' + (k + 1));
      const f = () => { slots[k] = !slots[k]; render(); out.innerHTML = ''; };
      g.addEventListener('click', f); g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); f(); } });
      svg.append(g);
    });
    clear(wrap).append(svg);
  };
  const check = () => {
    const n = slots.filter(Boolean).length, a = VE[el];
    const sides = [0, 2, 4, 6].map((k) => (slots[k] ? 1 : 0) + (slots[k + 1] ? 1 : 0));
    const pairedEarly = sides.some((x) => x === 2) && sides.some((x) => x === 0) && n <= 4;
    out.replaceChildren(fb(n === a ? 'ok' : 'bad', n === a ? `✔ ${a} elétrons de valência.` + (pairedEarly ? ' Convenção: coloque um elétron em cada lado antes de formar pares.' : '') + ` Pares: ${sides.filter((x) => x === 2).length} · elétrons desemparelhados: ${sides.filter((x) => x === 1).length}.` : `✘ Você colocou ${n}; o ${el} tem ${a} elétrons de valência.`));
  };
  host.append(h('div', { class: 'controls' }, h('label', null, 'Elemento: ', sel(['C', 'N', 'O', 'F', 'Cl', 'S', 'P', 'B', 'H'].map((e) => [e, e]), el, (x) => { el = x; slots.fill(false); render(); out.innerHTML = ''; }))), h('p', { class: 'hint3' }, 'Clique nas posições ao redor do símbolo para colocar elétrons.'), wrap,
    h('div', { class: 'ex-actions' }, h('button', { class: 'btn primary', type: 'button', onclick: check }, 'Verificar'), h('button', { class: 'btn', type: 'button', onclick: () => { slots.fill(false); const a = VE[el]; for (let k = 0; k < a; k++) slots[[0, 2, 4, 6, 1, 3, 5, 7][k]] = true; render(); } }, 'Mostrar')), out);
  render();
}

/* ===================================================================
 * 6. Octeto: contagem por átomo
 * =================================================================== */
export function octetCounter(host, keys = ['CH4', 'NH3', 'H2O', 'HF', 'BF3', 'NO']) {
  let key = keys[0];
  const fig = h('div', { class: 'figs pickfig' }), out = h('div', { class: 'readout', 'aria-live': 'polite' });
  const go = () => {
    const LS = L(key), svg = lewisSVG(LS, { scale: 54, fs: 20 });
    clear(fig).append(svg);
    overlayAtoms(svg, LS, (i) => {
      const e = shellElectrons(LS, i), a = LS.atoms[i], tgt = a.el === 'H' ? 2 : 8;
      out.innerHTML = `<span><b>${a.el}</b>: ${bondSum(LS, i)} par(es) ligante(s) × 2 + ${a.lp || 0} par(es) isolado(s) × 2${a.rad ? ' + 1 elétron desemparelhado' : ''} = <b>${e}</b> elétrons</span><span>${e === tgt ? `<b class="status-ok">${a.el === 'H' ? 'dueto' : 'octeto'} completo</b>` : e < tgt ? `<b class="status-bad">menos que ${tgt}: ${a.el === 'B' ? 'deficiente em elétrons' : a.rad ? 'radical (número ímpar de elétrons)' : ''}</b>` : 'octeto expandido'}</span>`;
    });
    out.innerHTML = 'Clique em um átomo para contar os elétrons ao seu redor (pares ligantes contam para os dois átomos).';
  };
  host.append(h('div', { class: 'controls' }, seg(keys.map((k) => [k, MOLS[k][1]]), key, (k) => { key = k; go(); }, 'molécula')), fig, out);
  go();
}
/** alvos clicáveis sobre os átomos de um SVG de Lewis */
export function overlayAtoms(svg, LS, onPick, o = {}) {
  const C = svg._chem, NS = 'http://www.w3.org/2000/svg';
  const g = document.createElementNS(NS, 'g'); g.setAttribute('transform', C.transform); svg.append(g);
  svg.parentNode && svg.parentNode.classList.add('pick');
  const map = {};
  LS.atoms.forEach((a, i) => {
    if (o.skipH && a.el === 'H') return;
    const at = C.atoms[i];
    const gg = document.createElementNS(NS, 'g'); gg.setAttribute('class', 'pk'); gg.setAttribute('tabindex', 0); gg.setAttribute('role', 'button'); gg.setAttribute('aria-label', 'átomo ' + a.el);
    const c = document.createElementNS(NS, 'circle'); c.setAttribute('cx', at.x); c.setAttribute('cy', at.y); c.setAttribute('r', 15); gg.append(c);
    const f = (e) => { e.preventDefault(); Object.values(map).forEach((x) => x.classList.remove('on')); gg.classList.add('on'); onPick(i, gg); };
    gg.addEventListener('click', f); gg.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') f(e); });
    g.append(gg); map[i] = gg;
  });
  return map;
}

/* ===================================================================
 * 7. Ligação covalente: curva de energia e comparação
 * =================================================================== */
export function bondEnergy(host) {
  const W = 520, H = 300, x0 = 50, y0 = 30;
  const re = 0.74, De = 436, a = 1.94;
  const E = (r) => De * (1 - Math.exp(-a * (r - re))) ** 2 - De;
  const X = (r) => x0 + (r - 0.3) / 2.7 * (W - x0 - 20), Y = (e) => y0 + (e + 470) / -620 * -(H - y0 - 40) * -1;
  const Yv = (e) => y0 + (150 - e) / 620 * (H - y0 - 40);
  const NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('class', 'energy'); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', 'Energia potencial em função da distância H–H');
  const el = (t, at, txt) => { const e = document.createElementNS(NS, t); Object.entries(at).forEach(([k, v]) => e.setAttribute(k, v)); if (txt) e.textContent = txt; svg.append(e); return e; };
  el('line', { x1: x0, y1: Yv(0), x2: W - 10, y2: Yv(0), class: 'axis', 'stroke-dasharray': '4 4' });
  el('line', { x1: x0, y1: y0, x2: x0, y2: H - 30, class: 'axis' });
  el('text', { x: W - 12, y: H - 8, 'text-anchor': 'end', class: 'lab' }, 'distância internuclear r (Å)');
  el('text', { x: 10, y: 20, class: 'lab' }, 'energia');
  el('text', { x: W - 14, y: Yv(0) - 6, 'text-anchor': 'end', class: 'lab' }, 'átomos separados (E = 0)');
  let d = ''; for (let r = 0.42; r <= 3; r += 0.01) d += (d ? 'L' : 'M') + X(r).toFixed(1) + ',' + Yv(Math.min(150, E(r))).toFixed(1);
  el('path', { d, class: 'curve' });
  el('line', { x1: X(re), y1: Yv(-De), x2: X(re), y2: H - 30, class: 'ea' });
  el('text', { x: X(re) + 6, y: H - 36, class: 'ealab' }, 'rₑ = 0,74 Å');
  const pt = el('circle', { r: 7, class: 'pt' });
  const rng = h('input', { type: 'range', min: 45, max: 300, value: 220, 'aria-label': 'distância H–H' });
  const cap = h('p', { class: 'cardlab' }), atoms = h('div', { class: 'hhpair' });
  const upd = () => {
    const r = rng.value / 100, e = E(r);
    pt.setAttribute('cx', X(r)); pt.setAttribute('cy', Yv(Math.min(150, e)));
    const zone = r < 0.62 ? 'muito próximos: a repulsão entre os núcleos domina e a energia sobe rapidamente' : r < 0.86 ? 'distância de equilíbrio: energia mínima — <b>comprimento de ligação</b>' : r < 1.8 ? 'a sobreposição dos orbitais 1s aumenta a densidade entre os núcleos: a energia diminui' : 'átomos afastados: praticamente sem interação';
    cap.innerHTML = `r = <b>${r.toFixed(2).replace('.', ',')} Å</b> · E ≈ <b>${Math.round(Math.min(e, 999))} kJ/mol</b> — ${zone}.`;
    const gap = Math.max(18, r * 70);
    atoms.innerHTML = `<span class="hcl" style="transform:translateX(${-gap / 2}px)">H</span><span class="hcl" style="transform:translateX(${gap / 2}px)">H</span>`;
  };
  rng.addEventListener('input', upd);
  host.append(h('div', { class: 'energywrap' }, svg), atoms, h('div', { class: 'range-row' }, h('span', null, 'aproximar'), rng, h('span', null, 'afastar')), cap, h('p', { class: 'hint3' }, 'Curva qualitativa (forma de Morse) para H₂: Dₑ ≈ 436 kJ/mol, rₑ = 0,74 Å.'));
  rng.value = 220; upd();
  void Y;
}
export function bondCompare(host) {
  const rows = [['C–C', 'etano', 1.54, 347, '1 σ'], ['C=C', 'eteno', 1.34, 614, '1 σ + 1 π'], ['C≡C', 'etino', 1.20, 839, '1 σ + 2 π']];
  host.append(h('div', { class: 'bcmp' }, rows.map(([b, k, r, e, sp]) => h('div', { class: 'chcard' }, h('h4', null, b + ' · ' + MOLS[k][1]), lewisSVG(L(k), { scale: 30, fs: 14 }),
    h('div', { class: 'barrow' }, h('small', null, 'comprimento'), h('div', { class: 'enbar' }, h('span', { style: `width:${r / 1.6 * 100}%` })), h('b', null, r.toFixed(2).replace('.', ',') + ' Å')),
    h('div', { class: 'barrow' }, h('small', null, 'energia de ligação'), h('div', { class: 'enbar o' }, h('span', { style: `width:${e / 900 * 100}%` })), h('b', null, '≈ ' + e + ' kJ/mol')), h('p', { class: 'cardlab' }, sp)))),
  h('p', { class: 'hint3' }, 'Valores médios aproximados. Ligações múltiplas são mais curtas e têm maior energia total de ligação que a simples correspondente — mas não "o dobro" ou "o triplo": a componente π não equivale a uma σ.'));
}

/* ===================================================================
 * 8. Lewis passo a passo e contador de elétrons
 * =================================================================== */
const STEPKEYS = ['CH4', 'NH3', 'H2O', 'CO2', 'HCN', 'CH2O', 'CH3OH', 'CH3OCH3', 'CH3COOH'];
export function lewisSteps(host) {
  let key = 'CH2O', step = 0;
  const fig = h('div', { class: 'figs' }), cap = h('div', { class: 'stepcap', 'aria-live': 'polite' }), tl = h('div', { class: 'timeline' });
  const T = ['Contar elétrons de valência', 'Escolher a conectividade e formar ligações simples', 'Completar o dueto do H', 'Completar octetos dos átomos terminais', 'Distribuir os elétrons restantes', 'Formar ligações múltiplas se necessário', 'Calcular cargas formais', 'Verificar plausibilidade'];
  const go = () => {
    const F = L(key), total = valenceElectrons(F);
    const W = clone(F);
    W.bonds.forEach((b) => { b.o = step >= 5 ? b.o : 1; });
    W.atoms.forEach((a, i) => {
      const terminal = nbs(F, i).length === 1;
      if (step < 3 || a.el === 'H') a.lp = 0;
      else if (step < 5) a.lp = terminal ? 3 : 0;
      else a.lp = F.atoms[i].lp;
      a.rad = 0;
    });
    if (step === 4) { // distribui o restante nos átomos centrais (heteroátomos primeiro)
      let rest = total - drawnElectrons(W);
      const centers = W.atoms.map((a, i) => i).filter((i) => nbs(W, i).length > 1).sort((x, y) => (W.atoms[y].el !== 'C') - (W.atoms[x].el !== 'C'));
      centers.forEach((i) => { while (rest >= 2 && shellElectrons(W, i) < 8) { W.atoms[i].lp = (W.atoms[i].lp || 0) + 1; rest -= 2; } });
    }
    const used = drawnElectrons(W);
    const counts = Object.entries(F.atoms.reduce((t, a) => { t[a.el] = (t[a.el] || 0) + 1; return t; }, {})).map(([e, n]) => `${n} ${e} × ${VAL[e]} = ${n * VAL[e]}`).join(' + ');
    const lows = W.atoms.map((a, i) => (a.el !== 'H' && shellElectrons(W, i) < 8 ? a.el : null)).filter(Boolean);
    if (step === 0) W.bonds = [];
    clear(fig).append(h('figure', { class: 'fig' }, lewisSVG(W, { scale: 52, fs: 20, fc: step >= 6 }), h('figcaption', { html: `elétrons desenhados: <b>${step === 0 ? 0 : used}</b> de <b>${total}</b>` })));
    cap.innerHTML = `<b>${step + 1}. ${T[step]}.</b> ` + [
      `${counts}${charge(F) ? ` ${charge(F) < 0 ? '+' : '−'} ${Math.abs(charge(F))} (carga)` : ''} = <b>${total}</b> elétrons (${total / 2} pares).`,
      `O átomo menos eletronegativo (exceto H) costuma ficar no centro; H e halogênios são terminais. Cada ligação simples usa 2 elétrons.`,
      'Cada H faz uma ligação e fica com 2 elétrons (dueto).',
      'Os átomos terminais (não H) recebem pares isolados até completar 8 elétrons.',
      `Elétrons restantes vão para os átomos centrais.${lows.length ? ` Ainda há átomo(s) com menos de 8 elétrons: ${lows.join(', ')}.` : ''}`,
      lows.length || W.bonds.some((b) => F.bonds.find((x) => x.a === b.a && x.b === b.b).o > 1) ? 'Pares isolados de um átomo vizinho viram ligações π até completar os octetos.' : 'Não é necessário formar ligações múltiplas: todos os octetos já estão completos.',
      `Carga formal = V − (não ligantes) − ½(ligantes). ${F.atoms.some((_, i) => fc(F, i)) ? 'Há cargas formais (indicadas).' : 'Todas as cargas formais são zero.'}`,
      `Octetos completos, ${charge(F) ? 'carga total ' + charge(F) : 'cargas formais mínimas'} e total de ${total} elétrons: estrutura plausível.`,
    ][step];
    [...tl.children].forEach((b, k) => b.classList.toggle('on', k === step));
  };
  T.forEach((t, k) => tl.append(h('button', { type: 'button', onclick: () => { step = k; go(); } }, h('b', null, String(k + 1)), ' ' + t)));
  host.append(h('div', { class: 'controls' }, h('label', null, 'Molécula: ', sel(molOpts(STEPKEYS), key, (x) => { key = x; step = 0; go(); })), h('button', { class: 'btn', type: 'button', onclick: () => { step = Math.max(0, step - 1); go(); } }, '◀'), h('button', { class: 'btn primary', type: 'button', onclick: () => { step = Math.min(T.length - 1, step + 1); go(); } }, 'Próximo passo ▶')), tl, fig, cap);
  go();
}
export function eCount(host) {
  const keys = ['CH4', 'H2O', 'CO2', 'HCN', 'CH2O', 'CH3COOH', 'acetato', 'NH4', 'H3O', 'OH', 'carbonato'];
  let key = 'acetato';
  const box = h('div');
  const go = () => {
    const F = L(key), q = charge(F), cnt = F.atoms.reduce((t, a) => { t[a.el] = (t[a.el] || 0) + 1; return t; }, {});
    clear(box).append(h('div', { class: 'table-wrap' }, h('table', null, h('tbody', null,
      ...Object.entries(cnt).map(([e, n]) => h('tr', null, h('td', null, `${e}`), h('td', null, `${n} × ${VAL[e]}`), h('td', null, h('b', null, String(n * VAL[e]))))),
      q ? h('tr', null, h('td', null, 'carga'), h('td', null, q < 0 ? `${-q} elétron(s) a mais` : `${q} elétron(s) a menos`), h('td', null, h('b', null, (q < 0 ? '+' : '−') + Math.abs(q)))) : null,
      h('tr', { class: 'tot' }, h('td', null, 'total'), h('td'), h('td', null, h('b', null, `${valenceElectrons(F)} elétrons = ${valenceElectrons(F) / 2} pares`)))))), lewisFig(key));
  };
  host.append(h('div', { class: 'controls' }, h('label', null, 'Fórmula: ', sel(molOpts(keys), key, (x) => { key = x; go(); }))), box);
  go();
}

/* ===================================================================
 * 9. Carga formal
 * =================================================================== */
export function fcCalc(host) {
  const keys = ['acetato', 'NH4', 'H3O', 'nitrometano', 'CO', 'carbonato', 'CH3', 'CH3m', 'HCN'];
  let key = 'nitrometano';
  const fig = h('div', { class: 'figs' }), panel = h('div', { 'aria-live': 'polite' });
  const go = () => {
    const LS = L(key), svg = lewisSVG(LS, { scale: 54, fs: 20, fc: false });
    clear(fig).append(svg); panel.innerHTML = '<p class="hint3">Clique em um átomo (as cargas estão ocultas: calcule antes de revelar).</p>';
    overlayAtoms(svg, LS, (i) => {
      const a = LS.atoms[i], V0 = VAL[a.el], nl = 2 * (a.lp || 0) + (a.rad || 0), lig = 2 * bondSum(LS, i), f = fc(LS, i);
      const inp = h('input', { type: 'number', min: -3, max: 3, value: '', 'aria-label': 'carga formal', style: 'width:80px' });
      const res = h('div');
      clear(panel).append(h('div', { class: 'readout' }, h('span', { html: `<b>${a.el}</b>` }), h('span', { html: `elétrons de valência: <b>${V0}</b>` }), h('span', { html: `não ligantes: <b>${nl}</b>` }), h('span', { html: `ligações: <b>${bondSum(LS, i)}</b> (${lig} elétrons ligantes)` })),
        h('div', { class: 'controls' }, h('label', null, 'CF = ', inp), h('button', { class: 'btn primary', type: 'button', onclick: () => { const ok = +inp.value === f; res.replaceChildren(fb(ok ? 'ok' : 'bad', `${ok ? '✔' : '✘'} CF = ${V0} − ${nl} − ½(${lig}) = <b>${f > 0 ? '+' + f : f}</b>`)); } }, 'Conferir'), h('button', { class: 'btn', type: 'button', onclick: () => res.replaceChildren(fb('neutral', `CF = ${V0} − ${nl} − ½(${lig}) = <b>${f > 0 ? '+' + f : f}</b>`)) }, 'Revelar')), res);
      setTimeout(() => inp.focus({ preventScroll: true }), 0);
    });
  };
  host.append(h('div', { class: 'controls' }, h('label', null, 'Espécie: ', sel(molOpts(keys), key, (x) => { key = x; go(); })), h('button', { class: 'btn', type: 'button', onclick: () => clear(fig).append(lewisSVG(L(key), { scale: 54, fs: 20 })) }, 'Mostrar todas as cargas')), fig, panel);
  go();
}
const ALT = {
  CO2: [['O=C=O', 'O=C=O: octetos completos, nenhuma carga formal'], ['[O-]C#[O+]', '⁻O–C≡O⁺: octetos completos, mas separação de cargas']],
  CH2O: [['C=O', 'H₂C=O: sem cargas formais'], ['[CH2+][O-]', 'H₂C⁺–O⁻: C com apenas 6 elétrons e separação de cargas']],
  HCN: [['C#N', 'H–C≡N: sem cargas formais'], ['[C-]=[NH+]', 'H–N⁺≡C⁻? (conectividade diferente: isocianeto H–N≡C é outra substância)']],
};
export function plausible(host) {
  Object.entries(ALT).forEach(([k, forms]) => host.append(h('div', { class: 'chcard' }, h('h4', null, MOLS[k][1]), h('div', { class: 'figs' }, forms.map(([s, t], i) => { const LS = Object.assign(fromS(s), { name: '' }); return h('figure', { class: 'fig' + (i === 0 ? ' good' : '') }, lewisSVG(LS, { scale: 40, fs: 17 }), h('figcaption', { html: (i === 0 ? '<b class="status-ok">mais plausível</b> · ' : '<b class="status-bad">menos plausível</b> · ') + t })); })))));
}
import { fromSmiles } from './struct.js';
const fromS = (s) => fromSmiles(s);

/* ===================================================================
 * 10. Ressonância
 * =================================================================== */
export function resForms(host) {
  const pairs = [
    ['acetato', [{ from: { lp: [3, null] }, to: { b: [1, 3] } }, { from: { b: [1, 2] }, to: { a: 2 } }]],
    ['alilaC', [{ from: { b: [1, 2] }, to: { b: [0, 1] } }]],
  ];
  pairs.forEach(([k]) => {
    const A = L(k), B = resonate(A, k);
    host.append(h('div', { class: 'resrow' }, h('figure', { class: 'fig' }, arrowsSVG(A, k), h('figcaption', null, 'forma A (com setas)')), h('span', { class: 'resarrow' }, '↔'), h('figure', { class: 'fig' }, lewisSVG(B, { scale: 44 }), h('figcaption', null, 'forma B')), h('span', { class: 'resarrow' }, '='), h('figure', { class: 'fig' }, hybridSVG(k), h('figcaption', null, 'híbrido de ressonância'))));
  });
}
/* aplica as movimentações canônicas */
export function resonate(A, k) {
  const B = clone(A);
  if (k === 'acetato') { B.atoms[3].lp = 2; bondOf(B, 1, 3).o = 2; bondOf(B, 1, 2).o = 1; B.atoms[2].lp = 3; }
  if (k === 'alilaC') { bondOf(B, 1, 2).o = 1; bondOf(B, 0, 1).o = 2; }
  if (k === 'alilaA') { B.atoms[0].lp = 0; bondOf(B, 0, 1).o = 2; bondOf(B, 1, 2).o = 1; B.atoms[2].lp = 1; }
  return B;
}
export const bondOf = (LS, a, b) => LS.bonds.find((x) => (x.a === a && x.b === b) || (x.a === b && x.b === a));
function arrowsSVG(A, k) {
  const sp = lewisS(A, { scale: 44 });
  if (k === 'acetato') { sp.arrow({ lp: [3, sp._lp[3][0]] }, { b: [1, 3] }, -0.5, ''); sp.arrow({ b: [1, 2] }, { a: 2, ang: 0 }, -0.5, 'o'); }
  if (k === 'alilaC') sp.arrow({ b: [1, 2] }, { b: [0, 1] }, 0.6, '');
  if (k === 'alilaA') { sp.arrow({ lp: [0, sp._lp[0][0]] }, { b: [0, 1] }, 0.5, ''); sp.arrow({ b: [1, 2] }, { a: 2 }, 0.5, 'o'); }
  return mol(sp, { scale: 44, fs: 18, zoom: 1.2 });
}
function hybridSVG(k) {
  const A = L(k), H = clone(A);
  const s = lewisS(H, { scale: 44, fc: false });
  // ligações parciais (simples + pontilhada) e cargas parciais
  const out = (i, c) => { const a = s.atoms[i], b = s.atoms[c], dx = a[0] - b[0], dy = a[1] - b[1], l = Math.hypot(dx, dy) || 1; return [dx / l * 0.55, dy / l * 0.55]; };
  const part = (pairs) => s.bonds.forEach((b) => { if (pairs.some(([x, y]) => (b[0] === x && b[1] === y) || (b[0] === y && b[1] === x))) b[2] = '1p'; });
  if (k === 'acetato') { part([[1, 2], [1, 3]]); [2, 3].forEach((i) => { s.atoms[i][3] = Object.assign({}, s.atoms[i][3], { lp: [], note: '−½', nd: out(i, 1), ncls: 'dq' }); }); }
  if (k === 'alilaC' || k === 'alilaA') { part([[0, 1], [1, 2]]); [0, 2].forEach((i) => { s.atoms[i][3] = Object.assign({}, s.atoms[i][3], { lp: [], note: k === 'alilaC' ? '+½' : '−½', nd: out(i, 1), ncls: 'dq' }); }); }
  return mol(s, { scale: 44, fs: 18, zoom: 1.2 });
}
export function resAnim(host) {
  let k = 'acetato';
  const box = h('div');
  const go = () => {
    const A = L(k), B = resonate(A, k);
    clear(box);
    const frames = [
      { s: lewisS(A, { scale: 44 }), cap: 'Forma A. Os <b>átomos não se movem</b>; observe apenas os elétrons.' },
      { s: (() => { const sp = lewisS(A, { scale: 44 }); if (k === 'acetato') { sp.arrow({ lp: [3, sp._lp[3][0]] }, { b: [1, 3] }, -0.5, ''); sp.arrow({ b: [1, 2] }, { a: 2, ang: 0 }, -0.5, 'o'); } else if (k === 'alilaC') sp.arrow({ b: [1, 2] }, { b: [0, 1] }, 0.6, ''); else { sp.arrow({ lp: [0, sp._lp[0][0]] }, { b: [0, 1] }, 0.5, ''); sp.arrow({ b: [1, 2] }, { a: 2 }, 0.5, 'o'); } return sp; })(), cap: 'Setas curvas: um par isolado (ou par π) passa a formar uma ligação π, e um par π vira par isolado (ou desloca-se). <b>Ligações σ não mudam.</b>' },
      { s: lewisS(B, { scale: 44 }), cap: 'Forma B: mesma posição dos átomos, outra distribuição eletrônica.' },
    ];
    const p = player(box, frames, { interval: 2600, draw: { scale: 44 } });
    host._stop = () => p.stop();
  };
  host.append(seg([['acetato', 'acetato'], ['alilaC', 'cátion alila'], ['alilaA', 'ânion alila']], k, (x) => { k = x; go(); }, 'espécie'), box);
  go();
}

/* ===================================================================
 * 11. Domínios eletrônicos
 * =================================================================== */
export function domainQuiz(host) {
  const keys = ['CH4', 'NH3', 'H2O', 'CO2', 'BF3', 'HCN', 'CH2O', 'SO2', 'eteno', 'etino', 'acetona', 'imina'];
  let n = 0, ok = 0;
  const box = h('div'), stat = h('p', { class: 'hint3' });
  const ask = () => {
    const k = rnd(keys), LS = L(k);
    const centers = LS.atoms.map((a, i) => i).filter((i) => nbs(LS, i).length > 1);
    const i = rnd(centers), c = centerInfo(LS, i);
    clear(box).append(h('figure', { class: 'fig' }, lewisSVG(LS, { scale: 42, halo: { [i]: 'g' } }), h('figcaption', { html: `Quantos domínios eletrônicos há ao redor do <b>${LS.atoms[i].el}</b> destacado?` })),
      choice([2, 3, 4, 5], c.D, (good) => { n++; if (good) ok++; stat.textContent = `${ok}/${n}`; box.append(fb(good ? 'ok' : 'bad', `${c.X} átomo(s) ligado(s) + ${c.E} par(es) isolado(s) = <b>${c.D}</b> domínios (${c.axe}). Ligação dupla ou tripla conta como <b>um</b> domínio.`), h('button', { class: 'btn sm', type: 'button', onclick: ask }, 'Próximo →')); }));
  };
  host.append(stat, box); ask();
}
void S; void pickN; void infoRows; void SP_LEGEND; void img3d; void vbox; void molScene;
