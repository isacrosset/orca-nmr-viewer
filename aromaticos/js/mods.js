/*
 * mods.js — componentes dos módulos 1–19.
 */
import { h, seg, tgl, player } from './widgets2d.js';
import { S, mol } from './chem2d.js';
import { MOLS, analyze, geometry, TYPES, fillLevels, realMOs, ENERGY, CLS, mono } from './arom.js';
import { ringSVG, benz, svgS, cyclohexene, svgEl, add, profile } from './arom2d.js';
import { aromScene, moScene } from './a3d.js';
import { molScene } from './scene3d.js';
import { fromSmiles } from './struct.js';
import { fb, clear, sel, molOpts, vbox, legend, PI_LEGEND, badge, ringFig, choice, report } from './ui.js';

/* ===================================================================
 * 1. Início
 * =================================================================== */
export function hero(host) {
  const v = vbox('tall'), cap = h('p', { class: 'cardlab center' });
  host.append(v, cap);
  const A = aromScene(v, MOLS.benzeno, { p: true, cloud: false, spin: true, hint: false, dist: 10, cam: [0, -6.2, 7.6] });
  const caps = ['Seis orbitais p paralelos (fases em ciano e dourado)', 'Nuvem π deslocalizada acima e abaixo do anel'];
  let t = 0; cap.textContent = caps[0];
  const timer = setInterval(() => { if (!host.isConnected) { clearInterval(timer); return; } t++; A.st.p = t % 2 === 0; A.st.cloud = t % 2 === 1; A.rebuild(); cap.textContent = caps[t % 2]; }, 3500);
  host._stop = () => clearInterval(timer);
}

/* ===================================================================
 * 2. Pergunta central: alceno × benzeno
 * =================================================================== */
export function centralQ(host) {
  const r1 = new S(); cyclohexene(r1, { x: 0 }); r1.t(1.9, 0, '+ Br₂', 'cond', 18); r1.r(2.7, 4.3, 0, 'CH₂Cl₂', '25 °C'); cyclohexene(r1, { x: 5.6, dibromo: true });
  const r2 = new S(); benz(r2, { x: 0, kek: 'A' }); r2.t(1.9, 0, '+ Br₂', 'cond', 18); r2.r(2.7, 4.3, 0, 'mesmas condições', ''); r2.t(6.1, 0, 'sem adição', 'cond', 17);
  const r3 = new S(); benz(r3, { x: 0, kek: 'hyb' }); r3.t(1.9, 0, '+ Br₂', 'cond', 18); r3.r(2.7, 4.3, 0, 'FeBr₃', ''); benz(r3, { x: 5.6, kek: 'hyb', sub: 'Br' }); r3.t(7.6, 0, '+ HBr', 'cond', 18);
  host.append(
    h('div', { class: 'rxcard ok' }, h('h4', null, 'Alceno → ADIÇÃO'), svgS(r1, { scale: 34, fs: 15 }), h('p', null, 'cicloexeno + Br₂ → trans-1,2-dibromocicloexano: a ligação π é trocada por duas ligações σ.')),
    h('div', { class: 'rxcard bad' }, h('h4', null, 'Benzeno + Br₂ → (sem reação simples)'), svgS(r2, { scale: 34, fs: 15 }), h('p', null, 'Nas mesmas condições, o benzeno não descora o bromo: não ocorre a adição.')),
    h('div', { class: 'rxcard sub' }, h('h4', null, 'Benzeno → SUBSTITUIÇÃO'), svgS(r3, { scale: 34, fs: 15 }), h('p', null, 'Com FeBr₃ (ácido de Lewis), forma-se bromobenzeno: um H é substituído por Br e o anel continua aromático.')),
    h('div', { class: 'bigq' }, 'Por quê?'));
}

/* ===================================================================
 * 3. Estrutura do benzeno
 * =================================================================== */
export function benzStructure(host) {
  const v = vbox(), info = h('p', { class: 'cardlab' });
  const A = aromScene(v, MOLS.benzeno, { hybrid: true, dist: 8.6 });
  const modes = { sigma: [{ p: false, cloud: false, plane: false }, 'Esqueleto σ: seis carbonos sp² no mesmo plano, ângulos de 120°.'], p: [{ p: true, cloud: false, plane: false }, 'Cada carbono tem um orbital p não hibridizado, perpendicular ao plano: os seis são paralelos.'], plane: [{ p: true, plane: true }, 'Plano molecular (azul) com os orbitais p acima e abaixo dele.'] };
  host.append(seg([['sigma', 'anel σ'], ['p', '+ orbitais p'], ['plane', '+ plano']], 'sigma', (k) => { Object.assign(A.st, modes[k][0]); A.rebuild(); info.textContent = modes[k][1]; }, 'exibição'), v, info, h('div', { class: 'facts4' }, ['C₆H₆', '6 C sp²', 'trigonal planar · 120°', '6 orbitais p paralelos'].map((t) => h('div', { class: 'chcard center' }, h('b', null, t)))));
  info.textContent = modes.sigma[1];
}
export function bondLengths(host) {
  const rows = [['C–C (etano)', 1.54, 'simples'], ['C–C (benzeno)', 1.39, 'todas iguais'], ['C=C (eteno)', 1.34, 'dupla']];
  host.append(h('div', { class: 'blen' }, rows.map(([t, r, d]) => h('div', { class: 'barrow' + (d === 'todas iguais' ? ' hl' : '') }, h('small', null, t), h('div', { class: 'enbar' }, h('span', { style: `width:${(r - 1.1) / 0.5 * 100}%` })), h('b', null, r.toFixed(2).replace('.', ',') + ' Å')))), h('p', { class: 'hint3' }, 'As seis ligações C–C do benzeno têm o mesmo comprimento (≈ 1,39 Å), intermediário entre simples e dupla — incompatível com duplas localizadas.'));
}

/* ===================================================================
 * 4. Kekulé e ressonância
 * =================================================================== */
export function kekule(host) {
  const fA = () => { const s = new S(); const { id } = benz(s, { kek: 'A' }); s.arrow({ b: [id[0], id[1]] }, { b: [id[1], id[2]] }, 0.6, ''); s.arrow({ b: [id[2], id[3]] }, { b: [id[3], id[4]] }, 0.6, ''); s.arrow({ b: [id[4], id[5]] }, { b: [id[5], id[0]] }, 0.6, ''); return s; };
  const frames = [
    { s: (() => { const s = new S(); benz(s, { kek: 'A' }); return s; })(), cap: '<b>Kekulé A</b>: três duplas em posições alternadas.' },
    { s: fA(), cap: 'Setas curvas: cada par π desloca-se para a ligação vizinha. <b>Os átomos não se movem.</b>' },
    { s: (() => { const s = new S(); benz(s, { kek: 'B' }); return s; })(), cap: '<b>Kekulé B</b>: mesma posição dos átomos, outra distribuição dos elétrons π.' },
    { s: (() => { const s = new S(); benz(s, { kek: 'hyb' }); return s; })(), cap: '<b>Híbrido</b>: nem A nem B. Os seis elétrons π estão deslocalizados — representado por um círculo.' },
  ];
  const box = h('div');
  const p = player(box, frames, { interval: 2600, draw: { scale: 52 }, render: svgS });
  host.append(box, h('div', { class: 'resrow' }, ringFig('benzeno', { cap: 'Kekulé A' }), h('span', { class: 'resarrow' }, '↔'), ringFig('benzeno', { alt: true, cap: 'Kekulé B' }), h('span', { class: 'resarrow' }, '≡'), ringFig('benzeno', { mode: 'hybrid', cap: 'híbrido de ressonância' })));
  host._stop = () => p.stop();
}

/* ===================================================================
 * 5–6. Orbitais p, nuvem π, OM
 * =================================================================== */
export function pOrbitals(host) {
  const v = vbox('tall');
  const A = aromScene(v, MOLS.benzeno, { p: true, dist: 8.6 });
  host.append(h('div', { class: 'controls' }, tgl('Orbitais p', () => { A.st.p = !A.st.p; A.rebuild(); return A.st.p; }, true), tgl('Fases', () => { A.st.phase = !A.st.phase; A.rebuild(); return A.st.phase; }, true), tgl('Plano molecular', () => { A.st.plane = !A.st.plane; A.rebuild(); return A.st.plane; }, false)), v, PI_LEGEND(), h('p', { class: 'hint3' }, 'Cada orbital p se sobrepõe lateralmente com os DOIS vizinhos: a sobreposição é contínua em volta do anel (não em pares isolados).'));
}
export function cloud(host) {
  const v = vbox('tall'), cap = h('p', { class: 'cardlab' });
  const A = aromScene(v, MOLS.benzeno, { p: true, dist: 8.6 });
  let on = false;
  const b = h('button', { class: 'btn primary', type: 'button', onclick: () => { on = !on; A.st.cloud = on; A.st.p = !on; A.rebuild(); b.textContent = on ? 'Mostrar os seis orbitais p' : 'Mostrar sistema π deslocalizado'; cap.innerHTML = on ? 'Duas regiões contínuas de densidade π (magenta): uma <b>acima</b> e outra <b>abaixo</b> do plano do anel (o plano do anel é nodal para o sistema π).' : 'Seis orbitais p paralelos, um por carbono.'; } }, 'Mostrar sistema π deslocalizado');
  host.append(b, v, cap, legend([['#ff4fa3', 'densidade π deslocalizada (combinação em fase dos 6 orbitais p)']]));
  cap.textContent = 'Seis orbitais p paralelos, um por carbono.';
}
/** diagrama de OM de Hückel do anel + desenho dos coeficientes + OM em 3D */
export function moDiagram(host, key = 'benzeno') {
  const def = MOLS[key], n = def.n;
  const e = analyze(def).e;
  const mos = realMOs(n);
  const box = h('div', { class: 'modiag' }), v = vbox('short'), cap = h('p', { class: 'cardlab' });
  let S3 = null;
  const show = (k) => {
    if (S3) S3.v.dispose(); clear(v);
    S3 = moScene(v, def, mos[k].c, { hint: false });
    const m = mos[k];
    cap.innerHTML = `ψ${k + 1}: ${m.x > 0.01 ? 'ligante' : m.x < -0.01 ? 'antiligante' : 'não ligante'} (E = α ${m.x >= 0 ? '+' : '−'} ${Math.abs(m.x).toFixed(m.x % 1 ? 2 : 0)}|β|). Nós perpendiculares ao anel: ${countNodes(m.c)}. ${k < e / 2 ? 'Ocupado.' : 'Vazio.'}`;
    [...box.querySelectorAll('.mobtn')].forEach((b) => b.classList.toggle('on', +b.dataset.k === k));
  };
  const xs = [...new Set(mos.map((m) => m.x.toFixed(3)))];
  let left = e;
  const occ = mos.map(() => 0);
  // preenche em ordem de energia (Hund nos degenerados)
  xs.forEach((x) => { const idx = mos.map((m, i) => (m.x.toFixed(3) === x ? i : -1)).filter((i) => i >= 0); const take = Math.min(left, 2 * idx.length); left -= take; for (let t = 0; t < take; t++) occ[idx[t % idx.length]]++; });
  xs.slice().reverse().forEach((x) => {
    const row = h('div', { class: 'morow' }, h('span', { class: 'mox' }, (+x > 0.01 ? 'α + ' : +x < -0.01 ? 'α − ' : 'α') + (Math.abs(+x) > 0.01 ? Math.abs(+x).toFixed(Math.abs(+x) % 1 ? 2 : 0).replace('.', ',') + '|β|' : '')));
    mos.forEach((m, i) => { if (m.x.toFixed(3) !== x) return; row.append(h('button', { class: 'mobtn', type: 'button', 'data-k': i, 'aria-label': `orbital ψ${i + 1}`, onclick: () => show(i) }, coefSVG(m.c), h('span', { class: 'moe' }, ['', '↑', '↑↓'][occ[i]] || ''))); });
    box.append(row);
  });
  host.append(h('div', { class: 'grid2' }, h('div', null, box, h('p', { class: 'hint3' }, `${e} elétrons π preenchem os ${Math.ceil(e / 2)} orbitais de menor energia${e === 6 && n === 6 ? ' — todos ligantes: camada fechada, como num gás nobre' : ''}. Clique num orbital para vê-lo em 3D.`)), h('div', null, v, cap)), legend([['#2fd4f5', 'fase +'], ['#ffd45c', 'fase −'], ['var(--muted)', 'energia cresce para cima (β < 0)']]));
  show(0);
}
function countNodes(c) { let s = 0; for (let i = 0; i < c.length; i++) { const a = c[i], b = c[(i + 1) % c.length]; if (Math.abs(a) > 1e-6 && Math.abs(b) > 1e-6 && a * b < 0) s++; if (Math.abs(a) < 1e-6) s += 0.5; } return Math.round(s) / 2 | 0 || (s ? 1 : 0); }
function coefSVG(c) {
  const n = c.length, NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '-34 -34 68 68'); svg.setAttribute('class', 'coef'); svg.setAttribute('aria-hidden', 'true');
  let html = '';
  const pts = c.map((_, j) => { const t = -Math.PI / 2 + j * 2 * Math.PI / n; return [22 * Math.cos(t), 22 * Math.sin(t)]; });
  html += `<polygon points="${pts.map((p) => p.join(',')).join(' ')}" fill="none" stroke="#6f82a3" stroke-width="1.5"/>`;
  c.forEach((w, j) => { if (Math.abs(w) < 1e-6) return; const r = 3 + 7 * Math.abs(w) / Math.max(...c.map(Math.abs)); html += `<circle cx="${pts[j][0]}" cy="${pts[j][1]}" r="${r}" fill="${w > 0 ? '#2fd4f5' : '#ffd45c'}" opacity=".85"/>`; });
  svg.innerHTML = html;
  return svg;
}
/** círculo de Frost */
export function frost(host, o = {}) {
  let n = o.n || 6, e = o.e ?? 6;
  const box = h('div', { class: 'frostbox' }), out = h('div', { 'aria-live': 'polite' });
  const rn = h('input', { type: 'range', min: 3, max: 8, value: n, 'aria-label': 'número de átomos no anel' }), re = h('input', { type: 'range', min: 0, max: 10, value: e, 'aria-label': 'elétrons π' });
  const ln = h('b'), le = h('b');
  const draw = () => {
    n = +rn.value; e = +re.value; ln.textContent = n; le.textContent = e;
    const W = 300, H = 300, R = 105, cx = 150, cy = 150;
    const svg = svgEl(W, H, `Círculo de Frost para anel de ${n} átomos com ${e} elétrons π`);
    add(svg, 'circle', { cx, cy, r: R, fill: 'none', stroke: '#6f82a3', 'stroke-dasharray': '4 4' });
    add(svg, 'line', { x1: 20, y1: cy, x2: W - 20, y2: cy, stroke: '#6f82a3', 'stroke-width': 1 });
    add(svg, 'text', { x: 4, y: cy - 6, class: 'lab' }, 'α');
    const pts = []; for (let k = 0; k < n; k++) { const t = Math.PI / 2 + k * 2 * Math.PI / n; pts.push([cx + R * Math.cos(t), cy + R * Math.sin(t)]); }
    add(svg, 'polygon', { points: pts.map((p) => p.join(',')).join(' '), fill: 'rgba(47,212,245,.06)', stroke: '#2fd4f5', 'stroke-width': 1.5 });
    const groups = fillLevels(n, e);
    groups.forEach((g) => {
      const y = cy + g.x * R / 2; // x = 2cos → y = cy + R cos
      const k = g.ks.length;
      g.ks.forEach((_, q) => {
        const x = cx + (k === 1 ? 0 : (q ? 1 : -1) * R * Math.sqrt(Math.max(0, 1 - (g.x / 2) ** 2)));
        add(svg, 'line', { x1: x - 16, y1: y, x2: x + 16, y2: y, stroke: g.kind === 'ligante' ? '#3ddc97' : g.kind === 'antiligante' ? '#ff5c6c' : '#ffd45c', 'stroke-width': 4 });
        add(svg, 'text', { x, y: y - 8, 'text-anchor': 'middle', class: 'elec' }, ['', '↑', '↑↓'][g.occ[q]] || '');
      });
    });
    add(svg, 'text', { x: 10, y: 18, class: 'lab' }, 'E ↑');
    clear(box).append(svg);
    const unpaired = groups.reduce((t, g) => t + g.occ.filter((x) => x === 1).length, 0);
    const antiOcc = groups.some((g) => g.kind === 'antiligante' && g.occ.some((x) => x));
    const closed = !unpaired && !antiOcc && groups.filter((g) => g.kind === 'ligante').every((g) => g.occ.every((x) => x === 2)) && !groups.some((g) => g.kind === 'não ligante' && g.occ.some((x) => x));
    const tag = e % 4 === 2 && closed ? ['ok', `✔ ${e} elétrons = 4n+2: todos os OM ligantes preenchidos, nenhum elétron em OM não ligante/antiligante — camada fechada (aromático, se o anel for plano e conjugado).`] : e % 4 === 0 && unpaired ? ['bad', `✘ ${e} elétrons = 4n: dois elétrons desemparelhados em OM degenerados de mesma energia — padrão antiaromático (se plano e conjugado).`] : ['neutral', `${e} elétrons: ${unpaired ? unpaired + ' desemparelhado(s); ' : ''}${antiOcc ? 'há elétrons em OM antiligantes; ' : ''}compare com a contagem 4n+2.`];
    out.replaceChildren(fb(...tag));
  };
  rn.addEventListener('input', draw); re.addEventListener('input', draw);
  host.append(h('div', { class: 'grid2' }, h('div', null, h('div', { class: 'range-row' }, h('span', null, 'átomos no anel'), rn, ln), h('div', { class: 'range-row' }, h('span', null, 'elétrons π'), re, le), out, h('p', { class: 'hint3' }, 'Polígono inscrito com um vértice para baixo: cada vértice é um nível de energia de Hückel (E = α + 2β cos 2πk/n).')), box));
  draw();
}

/* ===================================================================
 * 7–8. Estabilidade e calor de hidrogenação
 * =================================================================== */
export function hydro(host) {
  const data = [['cicloexeno', 'C=C × 1', ENERGY.cicloexeno, 'observado'], ['ciclo-hexa-1,3-dieno', 'C=C × 2', ENERGY.dieno, 'observado (≈ 2 × 120)'], ['"ciclo-hexatrieno" hipotético', 'C=C × 3', ENERGY.ciclohexatrieno, 'esperado (3 × 120)'], ['benzeno', 'sistema aromático', ENERGY.benzeno, 'observado']];
  const W = 760, H = 300, svg = svgEl(W, H, 'Calores de hidrogenação');
  const x0 = 250, sc = (W - x0 - 210) / 380;
  data.forEach(([n, d, e, t], i) => {
    const y = 34 + i * 62;
    add(svg, 'text', { x: x0 - 10, y: y + 14, 'text-anchor': 'end', class: 'lab' }, n);
    add(svg, 'rect', { x: x0, y, width: -e * sc, height: 28, rx: 6, fill: i === 3 ? '#3ddc97' : i === 2 ? 'rgba(255,92,108,.55)' : '#5b8cff', class: 'hbar', 'data-i': i });
    add(svg, 'text', { x: x0 - e * sc + 8, y: y + 19, class: 'lab' }, `${e} kJ/mol · ${t}`);
  });
  add(svg, 'line', { x1: x0 - ENERGY.benzeno * sc, y1: 26, x2: x0 - ENERGY.benzeno * sc, y2: 290, stroke: '#3ddc97', 'stroke-dasharray': '4 4' });
  add(svg, 'line', { x1: x0 - ENERGY.ciclohexatrieno * sc, y1: 26, x2: x0 - ENERGY.ciclohexatrieno * sc, y2: 290, stroke: '#ff5c6c', 'stroke-dasharray': '4 4' });
  const st = Math.abs(ENERGY.ciclohexatrieno - ENERGY.benzeno);
  host.append(h('div', { class: 'energywrap' }, svg), fb('ok', `Se o benzeno fosse um ciclo-hexatrieno comum, sua hidrogenação liberaria ≈ ${-ENERGY.ciclohexatrieno} kJ/mol. Libera apenas ≈ ${-ENERGY.benzeno} kJ/mol: o benzeno <b>começa ≈ ${st} kJ/mol mais baixo</b> em energia — a <b>estabilização aromática</b>.`), h('p', { class: 'hint3' }, 'ΔH de hidrogenação a cicloexano (valores aproximados). A estabilização estimada depende da referência escolhida (≈ 150 kJ/mol por esta comparação).'));
}
export function thermo(host) {
  const W = 600, H = 340, svg = svgEl(W, H, 'Diagrama termodinâmico da hidrogenação do benzeno');
  svg.innerHTML = '<defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#e8eef9"/></marker></defs>';
  const yOf = (e) => 46 + (0 - e) * 0.72;
  const lvl = (x1, x2, e, c, t, dash) => { add(svg, 'line', { x1, y1: yOf(e), x2, y2: yOf(e), stroke: c, 'stroke-width': dash ? 1.5 : 4, 'stroke-dasharray': dash ? '5 5' : 'none' }); if (t) add(svg, 'text', { x: x1, y: yOf(e) - 9, class: 'lab' }, t); };
  lvl(40, 230, 0, '#ff5c6c', '"ciclo-hexatrieno" hipotético'); lvl(230, 330, 0, '#ff5c6c', '', true);
  lvl(40, 230, -152, '#3ddc97', 'benzeno (real)'); lvl(230, 470, -152, '#3ddc97', '', true);
  lvl(40, 560, -360, '#9fb0cc', 'cicloexano');
  const arr = (x, e1, e2, txt, c) => { add(svg, 'line', { x1: x, y1: yOf(e1) + 3, x2: x, y2: yOf(e2) - 5, stroke: c, 'stroke-width': 2.4, 'marker-end': 'url(#ah)' }); add(svg, 'text', { x: x + 8, y: (yOf(e1) + yOf(e2)) / 2 + 4, class: 'lab' }, txt); };
  arr(140, 0, -152, '≈ 150 kJ/mol', '#3ddc97');
  add(svg, 'text', { x: 148, y: yOf(-76) + 22, class: 'lab', fill: '#3ddc97' }, 'estabilização aromática');
  arr(320, 0, -360, '−360 (esperado)', '#ff5c6c');
  arr(460, -152, -360, '−208 (observado)', '#5b8cff');
  add(svg, 'text', { x: 8, y: 18, class: 'lab' }, 'Energia ↑   (kJ/mol, + 3 H₂)');
  host.append(h('div', { class: 'energywrap' }, svg));
}
export function threeEthenes(host) {
  const eth = () => { const s = new S(); const a = s.a(0, 0, 'H₂C'), b = s.a(1.3, 0, 'CH₂'); s.b(a, b, 2, { side: 0 }); return mol(s, { scale: 40, fs: 17 }); };
  host.append(h('div', { class: 'cmp2' },
    h('div', { class: 'chcard' }, h('h4', null, '3 × eteno (π localizadas)'), h('div', { class: 'figs' }, eth(), eth(), eth()), h('p', null, 'Cada ligação π envolve só dois carbonos e é independente das outras. Hidrogenar três C=C isoladas libera ≈ 3 × 120 kJ/mol.')),
    h('div', { class: 'chcard good' }, h('h4', null, 'benzeno (π deslocalizado)'), h('div', { class: 'figs' }, ringFig('benzeno', { mode: 'hybrid', cap: false, scale: 34 })), h('p', null, 'Seis elétrons π compartilhados por seis carbonos num ciclo contínuo: não são três "alcenos" independentes. O sistema todo é mais estável.'))));
}
export function alkeneVsBenzene(host) {
  const a = vbox('short'), b = vbox('short');
  host.append(h('div', { class: 'cmp2' },
    h('div', { class: 'chcard' }, h('h4', null, 'Alceno'), a, h('ul', null, h('li', null, 'π localizada (2 C)'), h('li', null, 'adição é comum'), h('li', null, 'produto saturado estável'), h('li', null, 'nenhum sistema aromático é perdido'))),
    h('div', { class: 'chcard good' }, h('h4', null, 'Benzeno'), b, h('ul', null, h('li', null, 'π deslocalizada (6 C, cíclica)'), h('li', null, 'estabilização aromática'), h('li', null, 'adição destrói a aromaticidade'), h('li', null, 'substituição pode restaurá-la')))));
  molScene(a, fromSmiles('C=C', 'eteno'), { sp: true, cloud: true, hint: false, dist: 6 });
  aromScene(b, MOLS.benzeno, { cloud: true, hint: false, dist: 8.6 });
}

/* ===================================================================
 * 9–10. Adição × substituição
 * =================================================================== */
export function breakArom(host, o = {}) {
  const v = vbox(), fig = h('div', { class: 'figs' }), out = h('div', { 'aria-live': 'polite' });
  let sp3 = [];
  const def = MOLS.benzeno;
  const A = aromScene(v, def, { cloud: true, dist: 8.6, onPick: (i) => toggle(i) });
  const partner = (k) => { const d = def.dbl.find((x) => x.includes(k)); return d[0] === k ? d[1] : d[0]; };
  const toggle = (i) => {
    if (i >= 6) return;
    if (sp3.includes(i)) sp3 = []; else { sp3 = [i, partner(i)]; }
    update();
  };
  const update = () => {
    A.st.sp3 = sp3; A.rebuild();
    const types = def.types.map((t, k) => (sp3.includes(k) ? 'CH2' : t)), dbl = def.dbl.filter((d) => !d.some((x) => sp3.includes(x)));
    const D = mono(types, dbl, { name: sp3.length ? 'produto de adição (hipotético)' : 'benzeno' });
    const R = analyze(D);
    clear(fig).append(ringFig(D, { cap: false, notes: Object.fromEntries(sp3.map((k) => [k, 'sp³'])) }), h('div', { class: 'readout', html: report(D, R) }), badge(R.cls));
    out.replaceChildren(fb(R.cls === 'arom' ? 'ok' : 'bad', sp3.length ? `Adição a uma C=C: os carbonos ${sp3.map((k) => k + 1).join(' e ')} passam de sp² para sp³ (orbital p perdido). A conjugação cíclica é <b>interrompida</b>, a nuvem π deixa de ser contínua → <b>não aromático</b>. Esse é o custo energético da adição.` : 'Clique num carbono (no modelo 3D) para simular uma adição a uma das ligações do anel.'));
  };
  host.append(h('p', { class: 'prompt' }, 'Modo “Quebre a aromaticidade”: clique em um carbono do anel no modelo 3D.'), h('div', { class: 'grid2' }, v, h('div', null, fig, out)), h('button', { class: 'btn sm', type: 'button', onclick: () => { sp3 = []; update(); } }, '↺ Restaurar benzeno'));
  update();
  void o;
}
export function subVsAdd(host) {
  const col = (title, steps, cls) => h('div', { class: 'chcard ' + cls }, h('h4', null, title), h('ol', { class: 'flowv' }, steps.map(([t, k]) => h('li', { class: k }, t))));
  host.append(h('div', { class: 'cmp2' },
    col('Adição', [['benzeno aromático', 'arom'], ['intermediário (aromaticidade perdida)', 'non'], ['produto de adição: NÃO aromático', 'non']], 'bad'),
    col('Substituição', [['benzeno aromático', 'arom'], ['complexo σ (perda TEMPORÁRIA)', 'non'], ['perda de H⁺', 'step'], ['produto AROMÁTICO novamente', 'arom']], 'good')),
  h('div', { class: 'centralphrase' }, 'A substituição preserva a aromaticidade global; a adição a destrói no produto final.'));
}
export function subAddEnergy(host) {
  const W = 640, H = 340, svg = svgEl(W, H, 'Perfis de energia: substituição × adição');
  profile(svg, [[0, 0, 'Ar–H + E⁺'], [0.25, 72, 'ET₁', 'ts'], [0.45, 38, 'complexo σ', 'int'], [0.62, 50, 'ET₂', 'ts'], [0.8, -22, 'Ar–E + H⁺ (aromático)', 'end']], { ymin: -40, ymax: 90, cls: 'sea' });
  profile(svg, [[0.45, 38, ''], [0.62, 58, ''], [0.9, 24, 'adição: não aromático', 'end']], { ymin: -40, ymax: 90, cls: 'addp' });
  add(svg, 'text', { x: 12, y: 18, class: 'lab' }, 'Energia ↑');
  host.append(h('div', { class: 'energywrap' }, svg), legend([['#3ddc97', 'substituição: aromaticidade restaurada'], ['#ff5c6c', 'adição ao complexo σ: produto sem aromaticidade (mais alto em energia)']]), h('p', { class: 'hint3' }, 'Perfis qualitativos: ambos passam pelo mesmo complexo σ; a perda de H⁺ leva a um produto muito mais estável (aromático).'));
}

/* ===================================================================
 * 11. Critérios
 * =================================================================== */
export function criteria(host) {
  const keys = ['benzeno', 'cpH', 'cp', 'ciclobutadieno', 'cot', 'tropilio', 'piridina', 'pirrol', 'cicloexadieno', 'cpPlus'];
  let key = 'cpH', step = 0;
  const box = h('div'), qbox = h('div', { 'aria-live': 'polite' });
  const Q = [['É cíclico?', (A) => A.cyclic], ['É planar (ou pode ser planar)?', (A) => A.planar], ['Todos os átomos do anel têm orbital p?', (A) => A.allP], ['Quantos elétrons π?', (A) => A.e], ['4n+2 ou 4n?', (A) => (A.e % 4 === 2 ? '4n+2' : A.e % 4 === 0 ? '4n' : 'ímpar')], ['Classificação?', (A) => CLS[A.cls][0]]];
  const go = () => {
    const def = MOLS[key], A = analyze(def);
    clear(box).append(h('div', { class: 'grid2' }, h('div', { class: 'figs' }, ringFig(key)), h('div', { class: 'readout', html: report(def, A).replace('<ul class="crit">', '<ul class="crit blur">') })));
    ask(A);
  };
  const ask = (A) => {
    if (step >= Q.length) { qbox.replaceChildren(fb(A.cls === 'arom' ? 'ok' : A.cls === 'anti' ? 'bad' : 'neutral', `<b>${CLS[A.cls][0].toUpperCase()}</b>. ${A.msgs.join(' ')}`), h('button', { class: 'btn sm', type: 'button', onclick: () => { step = 0; go(); } }, 'Recomeçar')); box.querySelector('.crit')?.classList.remove('blur'); return; }
    const [q, f] = Q[step], ans = f(A);
    // critérios estruturais falhos encerram a análise
    if (step >= 3 && (!A.allP || !A.planar)) { step = Q.length - 1; return ask(A); }
    const opts = typeof ans === 'boolean' ? ['sim', 'não'] : step === 3 ? [...new Set([ans, ans - 2, ans + 2, ans + 1].filter((x) => x >= 0))].sort((a, b) => a - b).map(String) : step === 4 ? ['4n+2', '4n', 'ímpar'] : ['aromático', 'antiaromático', 'não aromático'];
    const right = typeof ans === 'boolean' ? (ans ? 'sim' : 'não') : String(ans);
    qbox.replaceChildren(h('p', { class: 'prompt' }, `${step + 1}. ${q}`), choice(opts, right, (ok) => { qbox.append(fb(ok ? 'ok' : 'bad', (ok ? '✔ ' : '✘ Resposta: ' + right + '. ') + hintFor(step, A)), h('button', { class: 'btn sm primary', type: 'button', onclick: () => { step++; ask(A); } }, 'Próximo critério →')); }));
  };
  const hintFor = (k, A) => [A.cyclic ? 'O anel fecha um caminho cíclico.' : '', A.planar ? 'Anéis pequenos totalmente conjugados podem ser planos.' : 'Este anel adota conformação não planar.', A.allP ? 'Todos os átomos são sp² (ou têm par/vacância em p).' : `Há carbono sp³ (átomo ${A.breaks.join(', ')}): sem orbital p, interrompe a conjugação.`, `Some 2 por C=C do anel, 2 por par isolado em p (carbânion, N tipo pirrol, O, S), 0 por carbocátion.`, '', A.msgs.join(' ')][k];
  host.append(h('div', { class: 'controls' }, h('label', null, 'Estrutura: ', sel(molOpts(keys), key, (x) => { key = x; step = 0; go(); }))), box, qbox);
  go();
}
export function openVsRing(host) {
  const s = new S(); let x = 0; const ids = []; for (let k = 0; k < 6; k++) { ids.push(s.a(x, k % 2 ? 0.5 : 0, '', {})); x += 0.87; } for (let k = 0; k < 5; k++) s.b(ids[k], ids[k + 1], k % 2 ? 1 : 2, { side: 1 });
  host.append(h('div', { class: 'cmp2' }, h('div', { class: 'chcard bad' }, h('h4', null, 'hexa-1,3,5-trieno (aberto)'), h('div', { class: 'figs' }, mol(s, { scale: 40 })), h('p', null, '6 elétrons π conjugados, mas a cadeia é aberta: não há caminho cíclico → a regra de Hückel não se aplica (não aromático).')), h('div', { class: 'chcard good' }, h('h4', null, 'benzeno (cíclico)'), ringFig('benzeno', { cap: false, mode: 'hybrid' }), h('p', null, 'Os mesmos 6 elétrons π num ciclo contínuo: aromático.'))));
}
export function planarity(host) {
  const v = vbox(), rng = h('input', { type: 'range', min: 0, max: 100, value: 0, 'aria-label': 'deformação do anel' }), bar = h('div', { class: 'enbar' }, h('span', { style: 'width:100%' })), cap = h('div', { 'aria-live': 'polite' });
  const A = aromScene(v, MOLS.benzeno, { p: true, cloud: false, twist: 0, dist: 8.6 });
  let mode = 'p', pend = 0;
  const go = () => {
    const tw = +rng.value / 100 * 0.9;
    A.st.twist = tw; A.st.p = mode === 'p'; A.st.cloud = mode === 'c'; A.rebuild();
    const G = A.G, N = G.ringN;
    let ov = 0; for (let i = 0; i < N; i++) { const a = G.atoms[i].pdir, b = G.atoms[(i + 1) % N].pdir; ov += Math.abs(a[0] * b[0] + a[1] * b[1] + a[2] * b[2]); }
    ov /= N;
    bar.firstChild.style.width = (ov * 100).toFixed(0) + '%';
    cap.replaceChildren(fb(ov > 0.9 ? 'ok' : 'bad', `Paralelismo médio dos orbitais p vizinhos: <b>${(ov * 100).toFixed(0)}%</b>. ${ov > 0.9 ? 'Anel plano: sobreposição lateral contínua.' : 'Anel torcido: os orbitais p deixam de ser paralelos e a sobreposição contínua diminui — a deslocalização (e a aromaticidade) se perde.'}`));
  };
  rng.addEventListener('input', () => { cancelAnimationFrame(pend); pend = requestAnimationFrame(go); });
  host.append(h('div', { class: 'controls' }, seg([['p', 'orbitais p'], ['c', 'nuvem π']], mode, (k) => { mode = k; go(); }, 'exibição')), v, h('div', { class: 'range-row' }, h('span', null, 'plano'), rng, h('span', null, 'torcido')), h('div', { class: 'barrow' }, h('small', null, 'sobreposição'), bar), cap, h('p', { class: 'hint3' }, 'Deformação ilustrativa (o benzeno real é plano).'));
  go();
}
export function conjCheck(host) {
  host.append(h('div', { class: 'resrow' }, ringFig('cpH', { badge: true, notes: { 0: 'sp³' } }), h('span', { class: 'resarrow' }, '− H⁺ →'), ringFig('cp', { badge: true, mode: 'hybrid', centerCharge: '−' })), h('p', { class: 'cardlab' }, 'Ciclopentadieno: o CH₂ sp³ interrompe a conjugação (não aromático). Removendo H⁺, o carbono fica com um par em orbital p: 6 elétrons π em ciclo contínuo — o ânion é aromático. Isso explica a acidez incomum do ciclopentadieno (pKa ≈ 16).'));
}

/* ===================================================================
 * 12. Hückel
 * =================================================================== */
export function huckelSeq(host) {
  host.append(h('div', { class: 'hseq' }, [0, 1, 2, 3, 4].map((n) => h('div', { class: 'hcell' }, h('small', null, `n = ${n}`), h('b', null, String(4 * n + 2)), h('small', null, [ 'ciclopropenílio', 'benzeno', 'naftaleno', 'antraceno', '—'][n])))), h('p', { class: 'hint3' }, '4n: 4, 8, 12… (padrão antiaromático, se cíclico, plano e conjugado).'));
}

/* ===================================================================
 * 13. Classes; COT
 * =================================================================== */
export function classes(host) {
  const C = [['arom', 'Aromático', ['cíclico', 'planar', 'conjugado', '4n+2 elétrons π'], 'benzeno'], ['anti', 'Antiaromático', ['cíclico', 'planar', 'conjugado', '4n elétrons π'], 'ciclobutadieno'], ['non', 'Não aromático', ['falha em pelo menos um critério estrutural (ciclo, planaridade ou conjugação)'], 'cpH']];
  host.append(h('div', { class: 'grid3' }, C.map(([k, t, l, ex]) => h('div', { class: 'clscard ' + k }, h('h4', null, t), h('ul', null, l.map((x) => h('li', null, x))), ringFig(ex, { scale: 30 })))));
}
export function cot(host) {
  const a = vbox('short'), b = vbox('short');
  host.append(h('div', { class: 'cmp2' }, h('div', { class: 'chcard' }, h('h4', null, 'COT real: forma de banheira'), a, h('p', null, '8 elétrons π (4n). O anel dobra-se: as ligações duplas ficam em planos diferentes e os orbitais p vizinhos deixam de ser paralelos — não aromático (comporta-se como um polieno).')), h('div', { class: 'chcard bad' }, h('h4', null, 'COT plano (hipotético)'), b, h('p', null, 'Se fosse plano e conjugado, teria 8 elétrons π num ciclo contínuo: antiaromático. A molécula evita essa situação mudando de geometria.'))));
  aromScene(a, MOLS.cot, { p: true, hint: false, dist: 8.5, cam: [0, -2.5, 8] });
  aromScene(b, Object.assign({}, MOLS.cot, { planar: true }), { p: true, hint: false, dist: 8.5, twist: 0 });
}
export function sameE(host) {
  const rows = [['ciclobutadieno', 4, 'plano (distorcido em retângulo)', 'anti'], ['benzeno', 6, 'plano', 'arom'], ['cot', 8, 'banheira (não plano)', 'non'], ['cot2', 10, 'plano', 'arom']];
  host.append(h('div', { class: 'table-wrap' }, h('table', null, h('thead', null, h('tr', null, ['Estrutura', 'Elétrons π', 'Geometria', 'Classificação'].map((t) => h('th', null, t)))), h('tbody', null, rows.map(([k, e, g, c]) => h('tr', null, h('td', null, ringFig(k, { scale: 22, fs: 12 })), h('td', null, String(e)), h('td', null, g), h('td', null, badge(c))))))), h('p', { class: 'cardlab' }, 'Mesmo número de elétrons π ≠ mesma classificação: a geometria decide se a regra pode ser aplicada.'));
}

/* ===================================================================
 * 14–16. Íons, heteroaromáticos, policíclicos (galeria sincronizada)
 * =================================================================== */
export function gallery(host, keys, o = {}) {
  let key = o.key || keys[0];
  const fig = h('div', { class: 'figs' }), v = vbox(o.tall ? 'tall' : ''), info = h('div');
  let A = null;
  const go = () => {
    const def = MOLS[key], R = analyze(def), G = geometry(def);
    const notes = {}; G.atoms.slice(0, G.ringN).forEach((a, i) => { if (def.kind !== 'fused') notes[i] = a.hasP ? a.e : 'sp³'; });
    clear(fig).append(ringFig(def, { notes: o.notes === false ? {} : notes, scale: def.kind === 'fused' ? 34 : 44, zoom: def.kind === 'fused' ? 1.2 : 1.7 }));
    if (A) A.v.dispose(); clear(v);
    A = aromScene(v, def, { p: !!o.p, cloud: o.cloud !== false && !o.p, e: def.kind !== 'fused', dist: o.dist });
    const types = def.kind === 'fused' ? [] : [...new Set(def.types)];
    info.innerHTML = `<div class="readout"><span><b>${def.name}</b> · ${def.f}</span><span>elétrons π: <b>${R.e}</b></span><span style="color:${CLS[R.cls][1]}"><b>${CLS[R.cls][0]}</b></span></div>${report(def, R)}<p class="hint3">${types.map((t) => TYPES[t].t).join(' · ')}</p>${R.msgs.map((m) => `<p>${m}</p>`).join('')}`;
  };
  host.append(h('div', { class: 'controls' }, seg(keys.map((k) => [k, o.formula ? MOLS[k].f : MOLS[k].name.replace(/^(cátion|ânion) /, '').split(' (')[0]]), key, (k) => { key = k; go(); }, 'estrutura'), tgl('Orbitais p', () => { A.st.p = !A.st.p; A.st.cloud = !A.st.p; A.rebuild(); return A.st.p; }, !!o.p)), h('div', { class: 'grid2' }, h('div', null, fig, info), v), PI_LEGEND(), h('p', { class: 'hint3' }, 'Números no desenho: elétrons π de cada átomo do anel.'));
  go();
}
export function pyrVsPyrrole(host) {
  const a = vbox(), b = vbox();
  host.append(h('div', { class: 'cmp2' }, h('div', { class: 'chcard' }, h('h4', null, 'Piridina'), ringFig('piridina', { scale: 34 }), a, h('p', { html: 'N com 1 elétron no orbital p (como um C da C=C). O <b>par isolado fica num orbital sp² no plano</b> (ciano): não participa do sexteto — por isso a piridina é básica.' })), h('div', { class: 'chcard' }, h('h4', null, 'Pirrol'), ringFig('pirrol', { scale: 34 }), b, h('p', { html: 'O <b>par isolado do N ocupa o orbital p</b> (magenta) e faz parte do sexteto: 4 (duas C=C) + 2 (par) = 6 elétrons π. Protonar o N destruiria a aromaticidade.' }))), PI_LEGEND());
  aromScene(a, MOLS.piridina, { lp: true, p: false, hint: false, plane: true, dist: 7 });
  aromScene(b, MOLS.pirrol, { lp: true, p: false, hint: false, plane: true, dist: 7 });
}
export function furanPairs(host) {
  const v = vbox();
  host.append(h('div', { class: 'grid2' }, h('div', null, ringFig('furano'), h('p', { html: 'O do furano: <b>um par no orbital p</b> (sistema π, magenta) e <b>outro num híbrido no plano</b> (ciano). Total π: 4 + 2 = 6. O tiofeno é análogo (S).' })), v), PI_LEGEND());
  aromScene(v, MOLS.furano, { lp: true, plane: true, dist: 7 });
}
export function espCompare(host) {
  const Q = { benzeno: [0, 0, 0, 0, 0, 0], piridina: [-0.55, 0.18, 0.04, 0.12, 0.04, 0.18], pirrol: [0.35, -0.16, -0.12, -0.12, -0.16] };
  const T = { benzeno: 'densidade π uniforme', piridina: 'N retira densidade do anel: carbonos (sobretudo C2, C4) mais pobres — anel "π-deficiente"', pirrol: 'o par do N é doado ao anel: carbonos mais ricos — anel "π-excedente" (N fica δ+ no sistema π)' };
  const grid = h('div', { class: 'grid3' });
  host.append(grid, h('div', { class: 'legend center' }, h('span', null, h('i', { style: 'background:#f05a4a' }), 'mais rico em densidade π'), h('span', null, h('i', { style: 'background:#c9d6e8' }), 'intermediário'), h('span', null, h('i', { style: 'background:#5b8cff' }), 'mais pobre')), h('p', { class: 'hint3' }, 'Mapas qualitativos (cargas parciais estimadas, não calculadas). Nos três casos o sistema π continua cíclico e aromático.'));
  Object.keys(Q).forEach((k) => { const v = vbox('short'); grid.append(h('div', { class: 'chcard center' }, h('h4', null, MOLS[k].name), v, h('small', null, T[k]))); aromScene(v, MOLS[k], { esp: Q[k], hint: false, lp: false, dist: 9 }); });
}
export function whichPair(host) {
  const list = [['piridina', 0, 'in'], ['pirrol', 0, 'p'], ['furano', 0, 'p'], ['tiofeno', 0, 'p']];
  let k = 0;
  const box = h('div');
  const go = () => {
    const [key] = list[k % list.length], def = MOLS[key];
    const svg = ringSVG(def, { scale: 56, fs: 21, zoom: 1.5 });
    const dots = [...svg.querySelectorAll('circle.edot')];
    // agrupa os pontos em pares (2 em 2)
    const pairs = []; for (let i = 0; i < dots.length; i += 2) pairs.push([dots[i], dots[i + 1]]);
    const out = h('div', { 'aria-live': 'polite' });
    pairs.forEach(([d1, d2]) => {
      const inPi = d1.classList.contains('lppi');
      [d1, d2].forEach((d) => { d.setAttribute('r', 4.2); d.style.cursor = 'pointer'; d.setAttribute('tabindex', 0); d.setAttribute('role', 'button'); d.setAttribute('aria-label', 'par de elétrons'); const f = () => { out.replaceChildren(fb(inPi ? 'ok' : 'bad', inPi ? `✔ Esse par ocupa o orbital p e participa do sistema π aromático de ${def.name}.` : `✘ Esse par está num orbital no plano do anel (perpendicular ao sistema π): não participa da aromaticidade.${key === 'piridina' ? ' Na piridina nenhum par isolado participa: o N contribui com 1 elétron, como um carbono de C=C.' : ''}`)); }; d.addEventListener('click', f); d.addEventListener('keydown', (e) => { if (e.key === 'Enter') f(); }); });
    });
    // na exibição, todos os pares em cor neutra (não entregar a resposta)
    dots.forEach((d) => d.classList.add('neutral'));
    clear(box).append(h('p', { class: 'prompt' }, `${def.name}: clique no par de elétrons que participa do sistema π${key === 'piridina' ? ' (se houver)' : ''}.`), h('div', { class: 'figs' }, svg), out, h('div', { class: 'ex-actions' }, key === 'piridina' ? h('button', { class: 'btn sm', type: 'button', onclick: () => out.replaceChildren(fb('ok', '✔ Correto: na piridina o par isolado do N fica em sp², no plano, fora do sexteto.')) }, 'Nenhum par participa') : null, h('button', { class: 'btn sm', type: 'button', onclick: () => { k++; go(); } }, 'Próximo →')));
  };
  host.append(box); go();
}

/* ===================================================================
 * 17–19. SEA
 * =================================================================== */
const areniumS = (form, o = {}) => { const s = new S(); const r = benz(s, { arenium: form, E: o.E || 'E' }); return [s, r]; };
export function seaSteps(host) {
  const frames = [];
  { const s = new S(); const { id } = benz(s, { kek: 'A', H0: true }); const E = s.a(-2.3, -2.1, 'E⁺', { cls: 'elec' }); s.arrow({ b: [id[0], id[1]] }, { a: E }, -0.4, ''); frames.push({ s, cap: '<b>Etapas 1–2.</b> O eletrófilo E⁺ (gerado pelos reagentes) é atacado pelos elétrons π do anel.' }); }
  { const [s] = areniumS('A'); frames.push({ s, cap: '<b>Etapa 3.</b> Complexo σ (íon arênio): o carbono atacado fica <b>sp³</b>, com H e E. A carga + é deslocalizada; a aromaticidade foi perdida temporariamente.' }); }
  { const [s, r] = areniumS('A'); const B = s.a(1.9, -2.2, 'B:', { cls: 'nu' }); s.arrow({ a: B, ang: 180 }, { a: r.subs.H }, 0.3, 'o'); s.arrow({ b: [r.id[0], r.subs.H] }, { b: [r.id[0], r.id[1]] }, -0.6, ''); frames.push({ s, cap: '<b>Etapa 4.</b> Uma base remove o H⁺ do carbono sp³; o par da ligação C–H volta ao anel.' }); }
  { const s = new S(); benz(s, { kek: 'hyb', sub: 'E' }); frames.push({ s, cap: '<b>Etapa 5.</b> Aromaticidade <b>restaurada</b>: Ar–E + H⁺. Um H foi substituído por E.' }); }
  const box = h('div');
  const p = player(box, frames, { interval: 3400, draw: { scale: 50 }, render: svgS });
  host.append(h('div', { class: 'eqline' }, 'Ar–H + E⁺ → Ar–E + H⁺'), box);
  host._stop = () => p.stop();
}
export function areniumForms(host) {
  let form = 'A';
  const box = h('div', { class: 'figs' }), cap = h('p', { class: 'cardlab' });
  const go = () => {
    clear(box);
    if (form === 'H') { const s = new S(); const r = benz(s, { arenium: 'A' }); s.bonds.forEach((b) => { if (b[2] === 2) b[2] = '1p'; }); [r.id[1], r.id[3], r.id[5]].forEach((i) => { s.atoms[i][3] = { chg: 'δ+' }; }); s.bonds.forEach((b) => { const ring = r.id; const ia = ring.indexOf(b[0]), ib = ring.indexOf(b[1]); if (ia > 0 && ib > 0) b[2] = '1p'; }); box.append(svgS(s, { scale: 52, zoom: 1.4 })); cap.innerHTML = 'Híbrido: carga + distribuída nos carbonos <b>orto e para</b> ao carbono sp³ (nunca no meta). Cinco orbitais p ainda conjugados — mas o ciclo está interrompido pelo C sp³.'; return; }
    const [s] = areniumS(form);
    box.append(svgS(s, { scale: 52, zoom: 1.4 }));
    cap.innerHTML = { A: 'Contribuinte 1: carga + no carbono <b>orto</b> (C2).', B: 'Contribuinte 2: carga + no carbono <b>para</b> (C4).', C: 'Contribuinte 3: carga + no outro carbono <b>orto</b> (C6).' }[form];
  };
  host.append(seg([['A', 'forma 1'], ['B', 'forma 2'], ['C', 'forma 3'], ['H', 'híbrido']], form, (k) => { form = k; go(); }, 'contribuinte'), box, cap);
  go();
}
export function arenium3d(host) {
  const v = vbox();
  const def = mono(['CH2', 'C+', 'C', 'C', 'C', 'C'], [[2, 3], [4, 5]], { name: 'íon arênio (complexo σ)' });
  host.append(v, h('p', { class: 'cardlab' }, 'Complexo σ em 3D: o carbono sp³ (com H e Br) não tem orbital p; os outros cinco orbitais p formam um sistema π aberto (pentadienila) com 4 elétrons e carga +: estabilizado por ressonância, mas não aromático.'), PI_LEGEND());
  aromScene(v, def, { cloud: true, sub: 'Br', e: true, dist: 9.5, cam: [4.2, -6.8, 5.2] });
}
export function seaProfile(host) {
  const W = 620, H = 320, svg = svgEl(W, H, 'Perfil de energia da SEA');
  const { X, Y } = profile(svg, [[0, 0, 'reagentes'], [0.28, 80, 'ET₁', 'ts'], [0.48, 45, 'complexo σ', 'int'], [0.62, 55, 'ET₂', 'ts'], [0.9, -15, 'produto aromático', 'end']], { ymin: -30, ymax: 95, cls: 'sea' });
  add(svg, 'line', { x1: X(0.28), y1: Y(0), x2: X(0.28), y2: Y(80), class: 'ea' });
  add(svg, 'text', { x: X(0.28) - 8, y: Y(40), 'text-anchor': 'end', class: 'ealab' }, 'barreira alta:'); add(svg, 'text', { x: X(0.28) - 8, y: Y(40) + 16, 'text-anchor': 'end', class: 'ealab' }, 'perda temporária');
  add(svg, 'text', { x: 12, y: 18, class: 'lab' }, 'Energia ↑');
  host.append(h('div', { class: 'energywrap' }, svg), h('p', { class: 'hint3' }, 'Perfil qualitativo: a etapa 1 (formação do complexo σ) costuma ser a etapa lenta; a etapa 2 (perda de H⁺) é rápida e restaura a aromaticidade.'));
}
export function restore(host) {
  const v = vbox(), out = h('div', { 'aria-live': 'polite' }), fig = h('div', { class: 'figs' });
  let done = false;
  const def = mono(['CH2', 'C+', 'C', 'C', 'C', 'C'], [[2, 3], [4, 5]], { name: 'complexo σ' });
  let A = null;
  const start = () => {
    done = false;
    if (A) A.v.dispose(); clear(v);
    A = aromScene(v, def, { cloud: true, sub: 'Br', dist: 9.5, cam: [4.2, -6.8, 5.2], sel: 0, onPick: pick });
    const [s] = areniumS('A', { E: 'Br' }); clear(fig).append(svgS(s, { scale: 40 }));
    out.replaceChildren(fb('neutral', 'Clique (no modelo 3D) no H que deve ser removido pela base para restaurar a aromaticidade.'));
  };
  function pick(i) {
    if (done) return;
    const G = A.G, at = G.atoms[i];
    if (!at || at.el !== 'H') { out.replaceChildren(fb('bad', 'Escolha um átomo de H.')); return; }
    const host0 = G.bonds.find((b) => b[1] === i)[0];
    if (host0 !== 0) { out.replaceChildren(fb('bad', '✘ Esse H está num carbono sp² do anel. Removê-lo não devolveria o orbital p ao carbono sp³: o ciclo continuaria interrompido.')); return; }
    done = true;
    A.v.dispose(); clear(v);
    A = aromScene(v, MOLS.benzeno, { cloud: true, sub: 'Br', hybrid: true, dist: 9.5, cam: [4.2, -6.8, 5.2] });
    const s = new S(); benz(s, { kek: 'hyb', sub: 'Br' }); clear(fig).append(svgS(s, { scale: 40 }));
    out.replaceChildren(fb('ok', '✔ A base remove o H do carbono sp³. Os elétrons da ligação C–H voltam ao anel: o carbono torna-se sp², o orbital p reaparece, a nuvem π volta a ser contínua — <b>aromaticidade restaurada</b> (bromobenzeno).'), h('button', { class: 'btn sm', type: 'button', onclick: start }, '↺ Repetir'));
  }
  host.append(h('div', { class: 'grid2' }, v, h('div', null, fig, out)), PI_LEGEND());
  start();
}
export function seaTypes(host) {
  const C = [
    ['Halogenação', 'Br₂ / FeBr₃ (ou Cl₂ / FeCl₃)', 'Br–Br⁺–FeBr₃⁻: o ácido de Lewis polariza Br₂ e o torna eletrofílico (Br⁺ não existe livre)', 'Ar–Br', 'Br₂ + FeBr₃ ⇌ Br–Br···FeBr₃ (complexo ativado)'],
    ['Nitração', 'HNO₃ / H₂SO₄', 'íon nitrônio NO₂⁺ (linear)', 'Ar–NO₂', 'HNO₃ + 2 H₂SO₄ ⇌ NO₂⁺ + H₃O⁺ + 2 HSO₄⁻'],
    ['Sulfonação', 'SO₃ / H₂SO₄ (fumegante)', 'SO₃ (ou HSO₃⁺)', 'Ar–SO₃H', 'reversível: aquecimento em H₂SO₄ diluído remove o –SO₃H'],
    ['Alquilação de Friedel–Crafts', 'R–Cl / AlCl₃', 'carbocátion R⁺ (ou complexo R–Cl···AlCl₃)', 'Ar–R', 'cuidado: carbocátions podem rearranjar; polialquilação'],
    ['Acilação de Friedel–Crafts', 'RCOCl / AlCl₃', 'íon acílio R–C≡O⁺ (estabilizado por ressonância)', 'Ar–COR', 'o acílio não rearranja; o produto (cetona) é menos reativo: monoacilação'],
  ];
  const det = h('div', { 'aria-live': 'polite' });
  let V3 = null;
  const tb = h('tbody', null, C.map(([n, r, e, p, note], i) => { const tr = h('tr', { class: 'row', tabindex: 0 }, h('td', null, n), h('td', null, r), h('td', null, e), h('td', null, p)); const open = () => { [...tb.children].forEach((x) => x.classList.remove('open')); tr.classList.add('open'); clear(det).append(h('div', { class: 'chcard' }, h('h4', null, n), h('p', { html: `<b>Reagentes:</b> ${r}<br><b>Eletrófilo efetivo:</b> ${e}<br><b>Produto:</b> ${p}<br><small class="muted">${note}</small>` }), i === 1 ? (() => { const v = vbox('short'); setTimeout(() => { if (V3) V3.v.dispose(); V3 = molScene(v, fromSmiles('O=[N+]=O', 'íon nitrônio'), { lp: true, angles: true, hint: false, dist: 5 }); }, 0); return h('div', null, v, h('p', { class: 'cardlab' }, 'NO₂⁺ em 3D: N sp, linear (180°), isoeletrônico do CO₂.')); })() : null)); }; tr.addEventListener('click', open); tr.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); open(); } }); return tr; }));
  host.append(h('div', { class: 'table-wrap' }, h('table', { class: 'cmp' }, h('thead', null, h('tr', null, ['Reação', 'Reagentes', 'Eletrófilo', 'Produto'].map((t) => h('th', null, t)))), tb)), h('p', { class: 'hint3' }, 'Clique em uma linha para detalhes (na nitração, o NO₂⁺ em 3D).'), det);
}
void sel; void TYPES; void mol;
