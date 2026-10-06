/*
 * m2.js — módulos 13–23: teoria quântica, orbitais atômicos (1s, 2s, 2p),
 * orbitais moleculares (H₂), σ e π, hibridização sp³/sp²/sp, carbono em
 * moléculas orgânicas, comparação etano × eteno × etino.
 */
import { h, seg, tgl } from './widgets2d.js';
import { S, mol } from './chem2d.js';
import { L, MOLS } from './lib.js';
import { lewisSVG, centerInfo, nbs, sigmaPi, VAL } from './struct.js';
import { AO_PRESETS, RADIAL, radialDist, pair, PAIR_INFO, cube, p2, hyb, s2 } from './orbitals.js';
import { molScene, orbitalScene, orbitalImage, piCloud, PH_A, PH_B } from './scene3d.js';
import { fb, clear, sel, molOpts, vbox, legend, PHASE_LEGEND, SP_LEGEND, infoRows, choice, img3d } from './ui.js';
import { overlayAtoms, boxes } from './m1.js';

let QUALITY = 40;
export const setQuality = (q) => { QUALITY = q; };
export const q = () => QUALITY;

/* ===================================================================
 * 13. Bohr × quântico
 * =================================================================== */
export function bohrVsQuantum(host) {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', '-130 -130 260 260'); svg.setAttribute('class', 'bohr'); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', 'modelo de órbitas (histórico)');
  svg.innerHTML = '<circle r="5" fill="#fff"/>' + [50, 95].map((r) => `<circle r="${r}" fill="none" stroke="#6f82a3" stroke-dasharray="4 4"/>`).join('') + '<circle class="eorb" r="5" fill="#ff9f43"><animateMotion dur="3s" repeatCount="indefinite" path="M50,0 A50,50 0 1,1 -50,0 A50,50 0 1,1 50,0"/></circle><line x1="-110" y1="-110" x2="110" y2="110" stroke="#ff5c6c" stroke-width="3" opacity=".7"/>';
  const cv = h('canvas', { width: 260, height: 260, class: 'cloud', 'aria-label': 'distribuição de probabilidade do orbital 2p' });
  host.append(h('div', { class: 'cmp2' },
    h('div', { class: 'chcard center bad' }, h('h4', null, 'Órbitas (modelo de Bohr)'), svg, h('p', null, 'Elétron como partícula em trajetória circular definida. Útil historicamente (níveis de energia quantizados), mas <b>não</b> descreve o elétron em átomos com mais de um elétron nem a forma das ligações.'.replace(/<\/?b>/g, ''))),
    h('div', { class: 'chcard center good' }, h('h4', null, 'Orbital (mecânica quântica)'), cv, h('p', null, 'Estado descrito por uma função de onda ψ; |ψ|² dá a densidade de probabilidade. Cada ponto é um resultado possível de uma medida de posição (aqui, 2p_z): não há trajetória.'))));
  const ctx = cv.getContext('2d'); ctx.fillStyle = '#0a1222'; ctx.fillRect(0, 0, 260, 260);
  const f = p2([0, 1, 0]); let n = 0; const M = 0.0055;
  const tick = () => {
    if (!cv.isConnected || n > 6000) return;
    for (let k = 0; k < 400; k++) { const x = (Math.random() - 0.5) * 24, y = (Math.random() - 0.5) * 24, z = (Math.random() - 0.5) * 24; const v = f(x, y, z); if (Math.random() * M < v * v) { ctx.fillStyle = v > 0 ? 'rgba(47,212,245,.7)' : 'rgba(255,212,92,.7)'; ctx.fillRect(130 + x * 10.5, 130 - y * 10.5, 1.6, 1.6); n++; } }
    requestAnimationFrame(tick);
  };
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(130, 130, 3, 0, 7); ctx.fill(); tick();
}

/* ===================================================================
 * Visualizador de orbital atômico (presets)
 * =================================================================== */
export function aoViewer(host, o = {}) {
  const keys = o.keys || Object.keys(AO_PRESETS);
  let key = o.key || keys[0], cut = !!o.cut, phase = true, op = 0.72;
  const v = vbox(o.tall ? 'tall' : ''), cap = h('p', { class: 'cardlab' });
  let S3 = null;
  const go = () => {
    const P = AO_PRESETS[key];
    if (!S3) S3 = orbitalScene(v, { axis: P.L, dist: P.L * 2.5 });
    S3.show(P.f, cube(P.L), o.n || q(), { iso: P.iso, cut, opacity: op });
    S3.phases(phase);
    cap.innerHTML = `<b>${key.replace(/^(\d)p(.)$/, '$1p$2').replace('sp3', 'sp³').replace('sp2', 'sp²')}</b> — ${P.txt}. Superfície de isovalor |ψ| = ${P.iso} (u.a.)${cut ? '; corte no plano xz mostra o interior' : ''}.`;
  };
  host.append(keys.length > 1 ? h('div', { class: 'controls' }, seg(keys.map((k) => [k, k.replace('sp3', 'sp³').replace('sp2', 'sp²').replace('2px', '2pₓ').replace('2py', '2pᵧ').replace('2pz', '2p_z')]), key, (k) => { key = k; go(); }, 'orbital')) : null,
    h('div', { class: 'controls' }, h('button', { class: 'btn sm', type: 'button', 'aria-pressed': cut ? 'true' : 'false', onclick: (e) => { cut = !cut; e.currentTarget.setAttribute('aria-pressed', cut); go(); } }, 'Corte transversal'), tgl('Fases', () => { phase = !phase; S3.phases(phase); return phase; }, true), h('label', null, 'Opacidade ', (() => { const r = h('input', { type: 'range', min: 25, max: 100, value: 72, 'aria-label': 'opacidade' }); r.addEventListener('change', () => { op = r.value / 100; go(); }); return r; })())),
    v, cap, PHASE_LEGEND());
  go();
  return { go };
}
export function radialPlot(host) {
  const W = 520, H = 240, x0 = 40, rmax = 16;
  const NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('class', 'energy'); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', 'distribuição radial');
  const X = (r) => x0 + r / rmax * (W - x0 - 14), Y = (p) => H - 30 - p / 0.6 * (H - 50);
  const cols = { '1s': '#2fd4f5', '2s': '#ffd45c', '2p': '#ff4fa3' };
  let html = `<line x1="${x0}" y1="${H - 30}" x2="${W - 8}" y2="${H - 30}" class="axis"/><line x1="${x0}" y1="16" x2="${x0}" y2="${H - 30}" class="axis"/><text x="${W - 10}" y="${H - 8}" text-anchor="end" class="lab">r (a₀)</text><text x="6" y="14" class="lab">P(r) = r²R²</text>`;
  Object.keys(RADIAL).forEach((k) => { let d = ''; for (let r = 0; r <= rmax; r += 0.05) d += (d ? 'L' : 'M') + X(r).toFixed(1) + ',' + Y(radialDist(k, r)).toFixed(1); html += `<path d="${d}" fill="none" stroke="${cols[k]}" stroke-width="2.6"/>`; });
  html += `<line x1="${X(2)}" y1="${H - 30}" x2="${X(2)}" y2="40" stroke="#ffd45c" stroke-dasharray="3 3"/><text x="${X(2) + 4}" y="52" class="lab">nó radial do 2s (r = 2a₀)</text>`;
  svg.innerHTML = html;
  host.append(h('div', { class: 'energywrap' }, svg), legend([['#2fd4f5', '1s: máximo em r = a₀'], ['#ffd45c', '2s: um nó radial, máximo externo'], ['#ff4fa3', '2p: nenhum nó radial']]), h('p', { class: 'hint3' }, 'Distribuição radial: probabilidade de encontrar o elétron numa casca de raio r (átomo hidrogenoide).'));
}
export function s12Compare(host) {
  const a = vbox('short'), b = vbox('short');
  host.append(h('div', { class: 'grid2' }, h('div', null, a, h('p', { class: 'cardlab' }, '1s: esfera, sem nós')), h('div', null, b, h('p', { class: 'cardlab' }, '2s em corte: esfera interna (fase +) e casca externa (fase −) separadas por um nó radial'))), PHASE_LEGEND());
  const A = orbitalScene(a, { axis: 4.2, hint: false }), B = orbitalScene(b, { axis: 13, hint: false });
  A.v.setCamera([4, 3, 10]); B.v.setCamera([6, 5, 30]);
  A.show(AO_PRESETS['1s'].f, cube(4.2), 34, { iso: 0.06 });
  B.show(AO_PRESETS['2s'].f, cube(13), q(), { iso: 0.011, cut: true });
}

/* ===================================================================
 * 16–17. Orbitais moleculares de H₂
 * =================================================================== */
export function moH2(host) {
  const a = vbox('short'), b = vbox('short'), rng = h('input', { type: 'range', min: 140, max: 700, value: 140, 'aria-label': 'distância entre os núcleos' }), cap = h('p', { class: 'cardlab' });
  host.append(h('div', { class: 'grid2' }, h('div', null, h('h4', { class: 'center' }, 'Em fase: 1s(A) + 1s(B) → σ1s (ligante)'), a), h('div', null, h('h4', { class: 'center' }, 'Fora de fase: 1s(A) − 1s(B) → σ*1s (antiligante)'), b)), h('div', { class: 'range-row' }, h('span', null, 'distância H···H'), rng), cap, PHASE_LEGEND());
  const A = orbitalScene(a, { axis: 6, hint: false }), B = orbitalScene(b, { axis: 6, hint: false });
  A.axes(false); B.axes(false); A.v.setCamera([2, 3, 13]); B.v.setCamera([2, 3, 13]);
  let pend = 0;
  const go = () => {
    const R = rng.value / 100;
    const P = pair('ss', R, 1), N = pair('ss', R, -1);
    A.show(P.f, P.box, 36, { iso: 0.07 }); B.show(N.f, N.box, 36, { iso: 0.07 });
    A.nuclei([P.A, P.B]); B.nuclei([N.A, N.B]);
    cap.innerHTML = `R = ${R.toFixed(1).replace('.', ',')} a₀ (${(R * 0.529).toFixed(2).replace('.', ',')} Å). ${R < 2 ? 'Em fase: densidade <b>acumulada entre os núcleos</b> (estabiliza). Fora de fase: <b>plano nodal</b> entre os núcleos (desestabiliza).' : 'Afastados: os orbitais quase não se sobrepõem — ligante e antiligante ficam parecidos com os 1s isolados.'}`;
  };
  rng.addEventListener('input', () => { cancelAnimationFrame(pend); pend = requestAnimationFrame(go); });
  go();
}
export function moDiagram(host) {
  const sp = { 'H₂': 2, 'H₂⁺': 1, 'He₂⁺': 3, 'He₂': 4 };
  let k = 'H₂';
  const box = h('div'), cap = h('div');
  const go = () => {
    const n = sp[k], nb = Math.min(2, n), na = Math.max(0, n - 2), bo = (nb - na) / 2;
    const s = new S();
    const lvl = (x, y, w, lab, e) => { const a = s.a(x - w / 2, y, ''), b = s.a(x + w / 2, y, ''); s.b(a, b, 1, { cls: 'hl' }); s.t(x, y + 0.42, lab, 'cond', 14); if (e) s.t(x, y - 0.32, e, 'elec', 20); };
    const at = k.startsWith('He') ? 'He' : 'H', ea = Math.ceil(n / 2), eb = n - ea;
    lvl(0, 2.2, 1.2, `1s (${at} A)`, ea === 2 ? '↑↓' : ea === 1 ? '↑' : '');
    lvl(6, 2.2, 1.2, `1s (${at} B)`, eb === 2 ? '↑↓' : eb === 1 ? '↑' : '');
    lvl(3, 3.6, 1.4, 'σ*1s (antiligante)', na === 2 ? '↑↓' : na === 1 ? '↑' : '');
    lvl(3, 0.8, 1.4, 'σ1s (ligante)', nb === 2 ? '↑↓' : nb === 1 ? '↑' : '');
    [[0.6, 2.2, 2.3, 3.6], [0.6, 2.2, 2.3, 0.8], [5.4, 2.2, 3.7, 3.6], [5.4, 2.2, 3.7, 0.8]].forEach(([x1, y1, x2, y2]) => { const a = s.a(x1, y1, ''), b = s.a(x2, y2, ''); s.b(a, b, 'p'); });
    s.t(-1.4, 4.1, 'E ↑', 'cond', 14);
    clear(box).append(h('figure', { class: 'fig' }, mol(s, { scale: 52, fs: 15, zoom: 1.3 }), h('figcaption', null, 'Diagrama qualitativo: σ abaixo dos 1s isolados, σ* acima.')));
    cap.replaceChildren(fb(bo > 0 ? 'ok' : 'bad', `<b>${k}</b>: ${nb} elétron(s) ligante(s), ${na} antiligante(s). Ordem de ligação = ½(${nb} − ${na}) = <b>${String(bo).replace('.', ',')}</b>. ${bo > 0 ? 'Há ligação.' : 'Sem ligação líquida: He₂ não é estável.'}`));
  };
  host.append(seg(Object.keys(sp).map((x) => [x, x]), k, (x) => { k = x; go(); }, 'espécie'), box, cap);
  go();
}

/* ===================================================================
 * 18. Sobreposição: σ e π (laboratório)
 * =================================================================== */
export function overlapLab(host) {
  let kind = 'ppl', ph = 1;
  const v = vbox('tall'), rng = h('input', { type: 'range', min: 25, max: 120, value: 40, 'aria-label': 'distância entre os centros' }), cap = h('div', { 'aria-live': 'polite' });
  host.append(h('div', { class: 'controls' }, seg([['ss', 's + s'], ['sp', 's + p (frontal)'], ['ppf', 'p + p frontal'], ['ppl', 'p + p lateral']], kind, (k) => { kind = k; go(); }, 'orbitais'), seg([['1', 'em fase'], ['-1', 'fora de fase']], '1', (k) => { ph = +k; go(); }, 'fase')),
    v, h('div', { class: 'range-row' }, h('span', null, 'aproximar'), rng, h('span', null, 'afastar')), cap, PHASE_LEGEND());
  const S3 = orbitalScene(v, { axis: 10, hint: true });
  S3.axes(false); S3.v.setCamera([8, 7, 38]);
  let pend = 0;
  function go() {
    const R = (kind === 'ss' ? rng.value / 30 : rng.value / 10);
    const P = pair(kind, R, ph);
    S3.show(P.f, P.box, 36, { iso: P.iso });
    S3.nuclei([P.A, P.B]);
    const res = ph > 0 ? PAIR_INFO[kind].b : PAIR_INFO[kind].a;
    const near = kind === 'ss' ? R < 2.5 : R < 6;
    const txt = kind === 'ppl' ? 'Sobreposição <b>lateral</b> de orbitais p paralelos: densidade acima e abaixo do eixo, com um <b>plano nodal que contém o eixo</b> internuclear.' : 'Sobreposição <b>frontal</b>, ao longo do eixo internuclear: simetria cilíndrica em torno do eixo.';
    cap.replaceChildren(fb(ph > 0 ? 'ok' : 'bad', `<b>${near ? res : 'pouca sobreposição'}</b> — ${txt} ${ph > 0 ? 'Fases iguais se somam entre os núcleos: interação <b>ligante</b>.' : 'Fases opostas se cancelam entre os núcleos: surge um <b>nó</b> perpendicular ao eixo — interação <b>antiligante</b>.'}`));
  }
  rng.addEventListener('input', () => { cancelAnimationFrame(pend); pend = requestAnimationFrame(go); });
  go();
}
export function sigmaPi3d(host, o = {}) {
  let key = o.key || 'eteno', mode = 'sp';
  const v = vbox(), info = h('div', { class: 'readout' });
  let M = null;
  const go = () => {
    if (M) M.v.dispose(); clear(v);
    M = molScene(v, L(key), { sp: true, cloud: mode !== 'p', p: mode === 'p', dist: 7 });
    const s = sigmaPi(L(key));
    info.innerHTML = `<span><b>${MOLS[key][1]}</b></span><span>ligações σ: <b>${s.s}</b></span><span>ligações π: <b>${s.p}</b></span><span>${{ etano: 'C–C = 1 σ (sp³–sp³)', eteno: 'C=C = 1 σ (sp²–sp²) + 1 π (p–p)', etino: 'C≡C = 1 σ (sp–sp) + 2 π perpendiculares', CO2: 'cada C=O: 1 σ + 1 π; os dois π são perpendiculares', HCN: 'C≡N: 1 σ + 2 π', propeno: 'C=C: σ + π; demais: σ' }[key] || ''}</span>`;
  };
  host.append(h('div', { class: 'controls' }, seg((o.keys || ['etano', 'eteno', 'etino']).map((k) => [k, MOLS[k][1]]), key, (k) => { key = k; go(); }, 'molécula'), seg([['sp', 'nuvem π'], ['p', 'orbitais p']], mode, (k) => { mode = k; go(); }, 'exibição')), v, info, SP_LEGEND());
  go();
}
export function piRotation(host) {
  const v = vbox(), rng = h('input', { type: 'range', min: 0, max: 90, value: 0, 'aria-label': 'ângulo de torção' }), cap = h('div', { 'aria-live': 'polite' }), bar = h('div', { class: 'enbar' }, h('span', { style: 'width:100%' }));
  const LS = L('eteno');
  const M = molScene(v, LS, { sp: true, dist: 7 });
  const G0 = M.G;
  // índices: C0, C1; H do C1 giram com o eixo C0–C1
  const right = [1, ...nbs(LS, 1).map((x) => x.j).filter((j) => j !== 0)];
  const go = () => {
    const th = rng.value * Math.PI / 180, ax = norm3(sub3(G0.atoms[1].p, G0.atoms[0].p)), o0 = G0.atoms[1].p;
    right.forEach((i) => { M.mol.setPos(i, rotAbout(G0.atoms[i].p, o0, ax, th)); });
    M.mol.update();
    const pA = G0.pdirs[0][0], pB = rotAbout(G0.pdirs[1][0], [0, 0, 0], ax, th);
    rebuildP(M, [[G0.atoms[0].p, pA], [G0.atoms[1].p, pB]]);
    const ov = Math.cos(th);
    bar.firstChild.style.width = Math.max(0, ov * 100) + '%';
    cap.replaceChildren(fb(rng.value < 45 ? 'ok' : 'bad', `Torção = ${rng.value}° · sobreposição p–p ∝ cos θ ≈ <b>${ov.toFixed(2).replace('.', ',')}</b>. ${rng.value >= 85 ? 'A 90°, os orbitais p ficam perpendiculares: <b>não há sobreposição π</b> — a ligação π se rompe (≈ 260 kJ/mol). Por isso a rotação em torno de C=C é fortemente restrita (origem dos isômeros E/Z).' : 'Girar um CH₂ desalinha os orbitais p e diminui a sobreposição lateral.'}`));
  };
  rng.addEventListener('input', go);
  host.append(v, h('div', { class: 'range-row' }, h('span', null, 'torção C=C'), rng, h('span', null, '90°')), h('div', { class: 'barrow' }, h('small', null, 'sobreposição π'), bar), cap, PHASE_LEGEND());
  go();
}
import { THREE } from './viewer3d.js';
import { placeOrbital } from './scene3d.js';
function rebuildP(M, list) {
  if (M._pg) M.v.scene.remove(M._pg);
  const g = new THREE.Group();
  list.forEach(([p, d]) => placeOrbital(g, 'p', p, d, 0.095, { opacity: 0.6 }));
  M.v.scene.add(g); M._pg = g;
}
const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const norm3 = (a) => { const l = Math.hypot(...a) || 1; return a.map((x) => x / l); };
function rotAbout(p, o, ax, th) { const v = sub3(p, o), c = Math.cos(th), s = Math.sin(th), d = v[0] * ax[0] + v[1] * ax[1] + v[2] * ax[2]; const cr = [ax[1] * v[2] - ax[2] * v[1], ax[2] * v[0] - ax[0] * v[2], ax[0] * v[1] - ax[1] * v[0]]; return [0, 1, 2].map((k) => o[k] + v[k] * c + cr[k] * s + ax[k] * d * (1 - c)); }

/* ===================================================================
 * 19–21. Hibridização
 * =================================================================== */
const HYB = { sp3: { n: 3, cnt: 4, p: 0, geo: 'tetraédrica', ang: '109,5°', ex: 'CH₄, etano' }, sp2: { n: 2, cnt: 3, p: 1, geo: 'trigonal planar', ang: '120°', ex: 'eteno, BF₃, C=O' }, sp: { n: 1, cnt: 2, p: 2, geo: 'linear', ang: '180°', ex: 'etino, CO₂, HCN' } };
const DIRS = { sp3: [[0, 0.943, -0.333], [-0.816, -0.471, -0.333], [0.816, -0.471, -0.333], [0, 0, 1]], sp2: [[1, 0, 0], [-0.5, 0.866, 0], [-0.5, -0.866, 0]], sp: [[1, 0, 0], [-1, 0, 0]] };
const PDIR = { sp3: [], sp2: [[0, 0, 1]], sp: [[0, 1, 0], [0, 0, 1]] };
export function hybEnergy(host, t = 'sp3') {
  const H = HYB[t], s = new S();
  const lv = (x, y, n, lab, el, cls) => { for (let k = 0; k < n; k++) { const a = s.a(x + k * 0.95, y, ''), b = s.a(x + k * 0.95 + 0.75, y, ''); s.b(a, b, 1, { cls: cls || 'hl' }); if (el[k]) s.t(x + k * 0.95 + 0.37, y - 0.3, el[k], 'elec', 18); } s.t(x + n * 0.95 / 2, y + 0.45, lab, 'cond', 13); };
  lv(0, 3, 1, '2s', ['↑↓']); lv(0, 1.4, 3, '2p', ['↑', '↑', '']);
  const pn = H.p, hn = H.cnt;
  lv(5.2, 2.0, hn, `${hn} orbitais ${t.replace('3', '³').replace('2', '²')}`, Array(hn).fill('↑'), 'hl');
  if (pn) lv(5.2 + hn * 0.95 + 0.3, 1.2, pn, `${pn} p não hibridizado${pn > 1 ? 's' : ''}`, Array(pn).fill('↑'), 'hl p');
  s.t(4.3, 2.2, '→', 'cond', 24);
  s.t(-0.9, 3.8, 'E', 'cond', 14);
  host.append(h('figure', { class: 'fig wide' }, mol(s, { scale: 46, fs: 14, zoom: 1.3 }), h('figcaption', null, `Esquema de contagem (C): 1 s + ${H.cnt - 1} p → ${H.cnt} híbridos ${t.replace('3', '³').replace('2', '²')}${pn ? ` + ${pn} p` : ''}. Não é um processo físico em etapas: é um modelo para descrever as ligações.`)));
}
export function hybrid3d(host, t = 'sp3') {
  const H = HYB[t];
  const v = vbox(), row = h('div', { class: 'aorow' });
  const imgs = [['2s', s2(), 13, 0.011], ...['2pₓ', '2pᵧ', '2p_z'].slice(0, H.cnt - 1).map((n, k) => [n, p2([[1, 0, 0], [0, 1, 0], [0, 0, 1]][k]), 11, 0.018])];
  imgs.forEach(([n, f, Lx, iso], k) => { const url = orbitalImage(f, cube(Lx), 30, { iso, w: 130, h: 110, dist: 30, rot: [0.4, 0.5, 0] }); row.append(h('figure', { class: 'aofig' }, url ? h('img', { src: url, alt: 'orbital ' + n, width: 130, height: 110 }) : null, h('figcaption', null, n))); if (k < imgs.length - 1) row.append(h('span', { class: 'plus' }, '+')); });
  row.append(h('span', { class: 'plus' }, '→'), h('b', { class: 'big' }, `${H.cnt} × ${t.replace('3', '³').replace('2', '²')}`));
  const cap = h('p', { class: 'cardlab' }, `${H.cnt} orbitais ${t.replace('3', '³').replace('2', '²')} equivalentes em geometria ${H.geo} (${H.ang})${H.p ? ` + ${H.p} orbital(is) p não hibridizado(s), em violeta` : ''}. Cada híbrido tem um lóbulo grande (fase +) e um pequeno (fase −).`);
  host.append(row, v, cap, PHASE_LEGEND());
  const S3 = orbitalScene(v, { axis: 12 });
  if (S3.v.ok) {
    DIRS[t].forEach((d) => placeOrbital(S3.root, t, [0, 0, 0], d, 1, { opacity: 0.7, iso: 0.05 }));
    PDIR[t].forEach((d) => placeOrbital(S3.root, 'p', [0, 0, 0], d, 1, { opacity: 0.45, colorA: 0xb18cff, colorB: 0x8f6bff }));
  }
}
/** molécula com orbitais: modos em etapas */
export function molOrbitals(host, key, o = {}) {
  const stepsDef = o.steps || [['σ', { sp: true }], ['híbridos', { sp: true, hybOrb: 'all' }], ['orbitais p', { sp: true, p: true }], ['ligação π', { sp: true, cloud: true }]];
  let k = 0;
  const v = vbox(o.tall ? 'tall' : ''), info = h('div', { class: 'readout' });
  let M = null;
  const go = () => {
    if (M) M.v.dispose(); clear(v);
    M = molScene(v, L(key), Object.assign({ dist: o.dist || 7, hyb: true }, stepsDef[k][1]));
    if (o.cam) M.v.setCamera(o.cam);
    info.innerHTML = o.info ? o.info(k) : '';
  };
  host.append(h('div', { class: 'controls' }, seg(stepsDef.map(([t], i) => [String(i), t]), '0', (x) => { k = +x; go(); }, 'etapa'), o.side ? h('button', { class: 'btn sm', type: 'button', onclick: () => M.v.setCamera(o.side) }, 'Ver de lado') : null), v, info, SP_LEGEND());
  go();
}

/* ===================================================================
 * 22. Outras espécies, benzeno, alila
 * =================================================================== */
export function otherSpecies(host) {
  const list = [['metilamina', 1, 'N de amina: 3 ligações + 1 par isolado → 4 domínios → sp³ (piramidal).'], ['H2O', 0, 'O da água: 2 ligações + 2 pares → 4 domínios → sp³ (angular, ≈104,5°).'], ['CH3OH', 1, 'O de álcool: sp³, como na água.'], ['imina', 1, 'N de imina (C=N): 2 ligados + 1 par → 3 domínios → sp²; o orbital p do N forma a ligação π.'], ['CH2O', 1, 'O carbonílico: no modelo usual, sp² (1 ligado + 2 pares) com um p para a ligação π.'], ['formamida', 0, 'N de amida: pela contagem seriam 4 domínios (sp³), mas o par está em ressonância com a C=O: o N é praticamente plano, melhor descrito como sp². A hibridização é um modelo!']];
  let k = 0;
  const v = vbox(), fig = h('div', { class: 'figs' }), cap = h('div');
  let M = null;
  const go = () => {
    const [key, i, txt] = list[k];
    if (M) M.v.dispose(); clear(v);
    M = molScene(v, L(key), { hybOrb: i, lp: true, sel: i, dist: 6.5 });
    clear(fig).append(lewisSVG(L(key), { scale: 42, halo: { [i]: 'g' } }));
    cap.replaceChildren(fb(key === 'formamida' ? 'neutral' : 'ok', txt), h('div', { class: 'readout', html: infoRows(L(key), i) }));
  };
  host.append(seg(list.map(([kk], i) => [String(i), MOLS[kk][1]]), '0', (x) => { k = +x; go(); }, 'espécie'), h('div', { class: 'grid2' }, fig, v), cap);
  go();
}
export function benzeneCloud(host) {
  let mode = 'p';
  const v = vbox('tall'), cap = h('p', { class: 'cardlab' });
  let M = null;
  const go = () => { if (M) M.v.dispose(); clear(v); M = molScene(v, L('benzeno'), { sp: true, p: mode === 'p', cloud: mode === 'c', dist: 9 }); M.v.setCamera([0, -6, 6]); cap.innerHTML = mode === 'p' ? 'Seis carbonos sp², cada um com um orbital p perpendicular ao plano do anel, todos paralelos.' : 'Sobreposição contínua dos seis orbitais p: densidade π <b>deslocalizada</b> em dois anéis, acima e abaixo do plano (combinação em fase de menor energia).'; };
  host.append(seg([['p', 'seis orbitais p'], ['c', 'nuvem π deslocalizada']], mode, (k) => { mode = k; go(); }, 'exibição'), v, cap);
  go();
}
export function allylBridge(host) {
  const v = vbox('short');
  host.append(h('div', { class: 'grid2' }, h('div', null, h('h4', null, 'Lewis + ressonância'), h('div', { class: 'figs' }, lewisSVG(L('alilaC'), { scale: 34 }), h('span', { class: 'resarrow' }, '↔'), lewisSVG(resonated(), { scale: 34 })), h('p', null, 'Duas formas canônicas: a carga + e a ligação π aparecem "em lugares diferentes".')), h('div', null, h('h4', null, 'Orbitais'), v, h('p', null, 'Três orbitais p paralelos: a combinação em fase de menor energia espalha a densidade π pelos três carbonos.'))), fb('neutral', '<b>Duas linguagens, uma realidade:</b> a ressonância representa a deslocalização com várias estruturas de Lewis; os orbitais moleculares descrevem-na diretamente.'));
  molScene(v, L('alilaC'), { sp: true, cloud: true, hint: false, dist: 6.5 });
}
import { resonate } from './m1.js';
const resonated = () => resonate(L('alilaC'), 'alilaC');

/* ===================================================================
 * 23. Comparação etano × eteno × etino; tabela mestre; resumo
 * =================================================================== */
export function compare3(host) {
  const D = [['etano', 'sp³', 'tetraédrico', '109,5°', 'σ', '1,54 Å'], ['eteno', 'sp²', 'trigonal planar', '120°', 'σ + π', '1,34 Å'], ['etino', 'sp', 'linear', '180°', 'σ + 2π', '1,20 Å']];
  let mode = 'ball';
  const cols = D.map(([k]) => ({ k, v: vbox('short') }));
  host.append(seg([['ball', 'bola-vareta'], ['orb', 'orbitais'], ['sp', 'σ / π']], mode, (x) => { mode = x; go(); }, 'exibição'),
    h('div', { class: 'grid3' }, D.map(([k, hy, geo, ang, b, len], i) => h('div', { class: 'chcard center' }, h('h4', null, MOLS[k][1]), lewisSVG(L(k), { scale: 28, fs: 13 }), cols[i].v, h('div', { class: 'facts' }, h('span', { html: `hibridização <b>${hy}</b>` }), h('span', { html: `geometria <b>${geo}</b>` }), h('span', { html: `ângulo <b>${ang}</b>` }), h('span', { html: `C–C: <b>${b}</b>` }), h('span', { html: `comprimento C–C <b>${len}</b>` }))))), SP_LEGEND());
  const Ms = [];
  function go() { Ms.forEach((m) => m.v.dispose()); Ms.length = 0; cols.forEach(({ k, v }) => { clear(v); Ms.push(molScene(v, L(k), { hint: false, dist: 6.5, sp: mode !== 'ball', cloud: mode === 'sp', hybOrb: mode === 'orb' ? 'all' : null, angles: mode === 'ball' })); }); }
  go();
}
export function hybTable(host) {
  const rows = [['sp3', 'sp³', 4, 0, 'tetraédrica', '109,5°', 'CH4'], ['sp2', 'sp²', 3, 1, 'trigonal planar', '120°', 'eteno'], ['sp', 'sp', 2, 2, 'linear', '180°', 'etino']];
  const det = h('div');
  let M = null;
  const tb = h('tbody', null, rows.map(([t, n, a, b, g, ang, k]) => { const tr = h('tr', { class: 'row', tabindex: 0 }, h('td', null, n), h('td', null, String(a)), h('td', null, String(b)), h('td', null, g), h('td', null, ang), h('td', null, MOLS[k][1])); const open = () => { [...tb.children].forEach((x) => x.classList.remove('open')); tr.classList.add('open'); if (M) M.v.dispose(); const v = vbox('short'); clear(det).append(h('div', { class: 'grid2' }, v, h('div', null, h('p', { html: `<b>${n}</b>: ${a} orbitais híbridos (${a} domínios), ${b} p não hibridizado(s). ${MOLS[k][1]}: ${g}, ${ang}.` }), lewisSVG(L(k), { scale: 36 })))); M = molScene(v, L(k), { hybOrb: 0, hyb: true, dist: 6 }); }; tr.addEventListener('click', open); tr.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } }); return tr; }));
  host.append(h('div', { class: 'table-wrap' }, h('table', { class: 'cmp' }, h('thead', null, h('tr', null, ['Hibridização', 'Orbitais híbridos', 'p não hibridizados', 'Geometria', 'Ângulo', 'Exemplo'].map((t) => h('th', null, t)))), tb)), h('p', { class: 'hint3' }, 'Clique em uma linha para abrir o modelo 3D com os orbitais.'), det);
}
export function summaryCards(host) {
  const C = [['sp³', 4, 4, 'tetraédrico', '≈109,5°', 0, '—', 'CH₄ / etano'], ['sp²', 3, 3, 'trigonal planar', '≈120°', 1, 'uma ligação π', 'eteno'], ['sp', 2, 2, 'linear', '180°', 2, 'duas ligações π', 'etino']];
  host.append(h('div', { class: 'grid3' }, C.map(([t, d, n, g, a, p, pi, ex]) => h('div', { class: 'sumcard' }, h('div', { class: 'sumt' }, t), h('ul', null, h('li', null, `${d} domínios`), h('li', null, `${n} orbitais híbridos`), h('li', null, g), h('li', null, a), h('li', null, `${p} orbital(is) p não hibridizado(s)`), pi !== '—' ? h('li', null, 'possibilidade de ' + pi) : null, h('li', null, 'exemplo: ' + ex))))));
}
export function orbToMol(host) {
  let t = 'sp²';
  const box = h('div');
  const keys = ['CH4', 'etano', 'CH3OH', 'NH3', 'H2O', 'eteno', 'CH2O', 'BF3', 'acetona', 'imina', 'benzeno', 'etino', 'HCN', 'CO2', 'acetonitrila', 'propeno', 'final'];
  const go = () => {
    clear(box);
    keys.forEach((k) => { const LS = L(k); const at = LS.atoms.map((a, i) => i).filter((i) => LS.atoms[i].el !== 'H' && nbs(LS, i).length > 1 && centerInfo(LS, i).hyb === t); if (!at.length) return; box.append(h('figure', { class: 'fig' }, lewisSVG(LS, { scale: 28, fs: 13, halo: Object.fromEntries(at.map((i) => [i, 'g'])) }), h('figcaption', { html: `${MOLS[k][1]}: ${at.map((i) => LS.atoms[i].el).join(', ')} com ${centerInfo(LS, at[0]).D} domínios` }))); });
  };
  host.append(seg([['sp³', 'sp³'], ['sp²', 'sp²'], ['sp', 'sp']], t, (x) => { t = x; go(); }, 'hibridização'), h('p', { class: 'hint3' }, 'Átomos centrais com a hibridização escolhida aparecem destacados: o número de domínios explica a escolha.'), box);
  box.className = 'figs';
  go();
}
void PH_A; void PH_B; void piCloud; void hyb; void VAL; void choice; void img3d; void overlayAtoms; void boxes; void molOpts; void sel;
