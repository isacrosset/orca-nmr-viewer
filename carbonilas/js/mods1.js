/*
 * mods1.js — módulos 1–12: carbonila, aldeídos e cetonas, estrutura,
 * geometria, polarização, ressonância, π/π*, Bürgi–Dunitz, propriedades,
 * reatividade e adição nucleofílica (2D + 3D + energia sincronizados).
 */
import { h, seg, tgl, shuffle } from './widgets2d.js';
import { svgEl, add, profile } from './arom2d.js';
import { THREE, label } from './viewer3d.js';
import { V } from './struct.js';
import { COMP } from './data.js';
import { sk, fig, figs, svgOf, resonanceS, hybridS, addFrames } from './co2d.js';
import { coScene, addScene, rs, dashed, ball, CYAN } from './co3d.js';

export const fb = (c, html) => h('div', { class: 'fb ' + c, html });
export const clear = (e) => { while (e.firstChild) e.removeChild(e.firstChild); return e; };
export const sel = (opts, cur, on, lab) => { const s = h('select', { 'aria-label': lab || 'escolha' }, opts.map(([v, t]) => h('option', { value: v }, t))); s.value = cur; s.addEventListener('change', () => on(s.value)); return s; };
export const vbox = (c = '') => h('div', { class: 'viewer ' + c });
export const legend = (items) => h('div', { class: 'legend' }, items.map(([c, t]) => h('span', null, h('i', { style: `background:${c}` }), t)));
export const ORB_LEG = () => legend([['#2fd4f5', 'fase + do orbital'], ['#ffd45c', 'fase − do orbital'], ['#ff9f43', 'carbono eletrofílico (δ+)']]);
export const ESP_LEG = () => legend([['#2fd4f5', 'mais rico em elétrons (δ−)'], ['#dfe6f2', 'intermediário'], ['#ff9f43', 'mais pobre (δ+)']]);

/* ===================================================================
 * 1. Início
 * =================================================================== */
export function hero(host) {
  const v = vbox('tall'), cap = h('p', { class: 'cardlab center' });
  host.append(v, cap);
  const A = coScene(v, 'C=O', { name: 'metanal', dist: 7.5, delta: true, pistar: true, bd: 107, cone: true, hint: false, spin: true });
  let k = 0; cap.innerHTML = 'Orbital <b>π*</b> (LUMO): maior lobo no carbono. Nucleófilo na trajetória de Bürgi–Dunitz (≈ 107°).';
  const tm = setInterval(() => { if (!host.isConnected) { clearInterval(tm); return; } k++; A.st.pistar = k % 2 === 0; A.st.pi = k % 2 === 1; A.rebuild(); cap.innerHTML = k % 2 ? 'Orbital <b>π</b> (ocupado): maior densidade no oxigênio.' : 'Orbital <b>π*</b> (LUMO): maior lobo no carbono. Nucleófilo na trajetória de Bürgi–Dunitz (≈ 107°).'; }, 4500);
  host._stop = () => clearInterval(tm);
}
export function chain(host) {
  host.append(h('ol', { class: 'chainline' }, ['C=O polarizada', 'carbono δ+', 'π* acessível', 'aproximação ≈ 107°', 'intermediário tetraédrico', 'produto'].map((t) => h('li', null, t))));
}

/* ===================================================================
 * 2–3. Famílias; aldeídos e cetonas
 * =================================================================== */
export function familyTree(host) {
  const cards = [['Aldeídos', 'R–CHO', 'etanal', 'focus'], ['Cetonas', 'R–CO–R′', 'propanona', 'focus'], ['Ácidos carboxílicos', 'R–COOH', 'acetico'], ['Ésteres', 'R–COOR′', 'acetato'], ['Amidas', 'R–CONR₂', 'CC(N)=O'], ['Haletos de acila', 'R–COX', 'CC(Cl)=O']];
  host.append(h('div', { class: 'tree' }, h('div', { class: 'treeroot' }, 'C=O · grupo carbonila'), h('div', { class: 'treekids' }, cards.map(([t, f, k, c]) => h('div', { class: 'chcard center ' + (c || '') }, h('h4', null, t), h('b', { class: 'mono' }, f), h('div', { class: 'figs' }, sk(k, { scale: 26, fs: 12 })))))), h('p', { class: 'hint3' }, 'Todos têm C=O, mas o que está ligado ao carbono carbonílico muda a reatividade. Foco desta aplicação: aldeídos e cetonas (cards destacados).'));
}
export function hasCO(host) {
  const pool = shuffle([['etanal', 1], ['propanona', 1], ['etanol', 0], ['acetico', 1], ['butano', 0], ['cicloexanona', 1], ['tercbutanol', 0], ['benzaldeido', 1], ['cicloexeno', 0], ['acetato', 1]]);
  const picked = new Set(), out = h('div', { 'aria-live': 'polite' });
  const grid = h('div', { class: 'pickgrid' }, pool.map(([k], i) => h('button', { class: 'pickcard', type: 'button', 'aria-pressed': 'false', onclick: (e) => { if (picked.has(i)) picked.delete(i); else picked.add(i); e.currentTarget.setAttribute('aria-pressed', picked.has(i)); } }, sk(k, { scale: 22, fs: 11, hl: false }), h('small', null, COMP[k].name))));
  host.append(h('p', { class: 'prompt' }, 'Selecione todas as moléculas que contêm uma carbonila (C=O):'), grid, h('button', { class: 'btn sm primary', type: 'button', onclick: () => { let err = 0; pool.forEach(([k, y], i) => { const b = grid.children[i]; const ok = !!y === picked.has(i); b.classList.toggle('right', ok); b.classList.toggle('wrong', !ok); if (!ok) err++; }); out.replaceChildren(fb(err ? 'bad' : 'ok', err ? `${err} item(ns) incorreto(s). Etanol e álcoois têm C–O (simples), não C=O; alcenos têm C=C.` : '✔ Correto! Aldeídos, cetonas, ácidos e ésteres contêm C=O.')); } }, 'Conferir'), out);
}
export function aldKetExamples(host) {
  host.append(h('div', { class: 'cmp2' },
    h('div', { class: 'chcard' }, h('h4', null, 'Aldeídos · R–CHO'), h('p', null, 'C carbonílico ligado a um H e a um grupo orgânico (no metanal, a dois H).'), figs('metanal', 'etanal', 'propanal', 'benzaldeido')),
    h('div', { class: 'chcard' }, h('h4', null, 'Cetonas · R–CO–R′'), h('p', null, 'C carbonílico ligado a dois grupos carbonados.'), figs('propanona', 'butanona', 'cicloexanona', 'acetofenona'))));
}
export function aldOrKet(host) {
  const pool = ['metanal', 'etanal', 'propanal', 'butanal', 'benzaldeido', 'propanona', 'butanona', 'cicloexanona', 'acetofenona', 'pinacolona', 'pentanal', 'hexanodial'];
  let k = null, A = null, n = 0, ok = 0;
  const f = h('div', { class: 'figs' }), v = vbox('short'), out = h('div', { 'aria-live': 'polite' }), score = h('span', { class: 'chip ok' });
  const next = () => { k = pool[Math.floor(Math.random() * pool.length)]; clear(f).append(sk(k, { scale: 38, fs: 16 })); if (A) A.v.dispose(); clear(v); A = coScene(v, COMP[k].smi, { hint: false, dist: 8, elec: true }); out.replaceChildren(); };
  const ans = (c) => { n++; const r = COMP[k].cls === c; if (r) ok++; score.textContent = `${ok}/${n}`; out.replaceChildren(fb(r ? 'ok' : 'bad', `${r ? '✔' : '✘'} ${COMP[k].name}: <b>${COMP[k].cls === 'aldeido' ? 'aldeído' : 'cetona'}</b> — o carbono carbonílico está ligado a ${COMP[k].cls === 'aldeido' ? 'pelo menos um H' : 'dois carbonos'}.`), h('button', { class: 'btn sm', type: 'button', onclick: next }, 'Próxima →')); };
  host.append(h('div', { class: 'controls' }, h('b', null, 'Aldeído ou cetona?'), score), h('div', { class: 'grid2' }, h('div', null, f, h('div', { class: 'ch-answers' }, h('button', { class: 'btn', type: 'button', onclick: () => ans('aldeido') }, 'aldeído'), h('button', { class: 'btn', type: 'button', onclick: () => ans('cetona') }, 'cetona')), out), v));
  next(); score.textContent = '0/0';
}

/* ===================================================================
 * 4–5. Estrutura, geometria, sp²
 * =================================================================== */
export function structure(host) {
  const v = vbox('tall'), cap = h('p', { class: 'cardlab' });
  const A = coScene(v, 'C=O', { name: 'metanal', dist: 6.5 });
  const M = { s: [{ sp: true, p: false, pi: false, cloud: false }, '<b>Ligações σ</b> (laranja): C–H, C–H e a σ C–O, todas no plano.'], p: [{ sp: true, p: true, pi: false, cloud: false }, 'Um <b>orbital p</b> no C e um no O, paralelos e perpendiculares ao plano.'], pi: [{ sp: true, p: false, pi: false, cloud: true }, 'Sobreposição lateral dos p: <b>ligação π</b> acima e abaixo do plano. C=O = 1 σ + 1 π.'] };
  host.append(seg([['s', 'σ'], ['p', 'orbitais p'], ['pi', 'ligação π']], 's', (k) => { Object.assign(A.st, M[k][0]); A.rebuild(); cap.innerHTML = M[k][1]; }, 'camada'), v, cap, ORB_LEG());
  Object.assign(A.st, M.s[0]); A.rebuild(); cap.innerHTML = M.s[1];
}
export function geometry(host) {
  const v = vbox('tall'), cap = h('p', { class: 'cardlab' });
  const A = coScene(v, 'CC(C)=O', { name: 'propanona', dist: 7.5, angles: true, sel: 1 });
  host.append(h('div', { class: 'controls' }, seg([['ang', 'ângulos'], ['hyb', 'orbitais sp² + p']], 'ang', (k) => { A.st.angles = k === 'ang'; A.st.hybOrb = k === 'hyb' ? 1 : null; A.rebuild(); cap.innerHTML = k === 'ang' ? 'C carbonílico <b>trigonal planar</b>: ângulos ≈ 120° (≈ 121–122° para O=C–C e ≈ 116° para C–C–C na acetona). O, o C carbonílico e os dois átomos ligados ficam no mesmo plano.' : '<b>Três orbitais sp²</b> no plano (formam as σ) e <b>um p</b> perpendicular (lilás), que forma a π com o p do O.'; }, 'exibição')), v, cap);
  cap.innerHTML = 'C carbonílico <b>trigonal planar</b>: ângulos ≈ 120° (≈ 121–122° para O=C–C e ≈ 116° para C–C–C na acetona). O, o C carbonílico e os dois átomos ligados ficam no mesmo plano.';
}

/* ===================================================================
 * 6–7. Polarização e ressonância
 * =================================================================== */
export function polarization(host) {
  const a = vbox(), b = vbox();
  host.append(h('div', { class: 'cmp2' }, h('div', { class: 'chcard' }, h('h4', null, 'Cδ+=Oδ−: polarização da ligação'), a, h('p', null, 'O O (3,44) é mais eletronegativo que o C (2,55): a densidade da ligação desloca-se para o O.')), h('div', { class: 'chcard' }, h('h4', null, 'Mapa eletrostático qualitativo'), b, h('p', null, 'Carbono: região eletrofílica (laranja). Oxigênio: região rica em elétrons (ciano), que pode aceitar ligação de hidrogênio ou H⁺.'))), ESP_LEG());
  coScene(a, 'CC(C)=O', { dist: 7.5, delta: true, elec: true, hint: false, post2: true });
  coScene(b, 'CC(C)=O', { dist: 7.5, esp: true, hint: false });
}
export function resonance(host) {
  host.append(h('div', { class: 'figs' }, svgOf(resonanceS(), { scale: 40, fs: 17 })), h('div', { class: 'figs' }, svgOf(hybridS(), { scale: 40, fs: 17 })));
}

/* ===================================================================
 * 8. Orbitais π e π*
 * =================================================================== */
export function piPistar(host) {
  const v = vbox('tall'), cap = h('p', { class: 'cardlab' }), dia = h('div', { class: 'energywrap' });
  const A = coScene(v, 'C=O', { name: 'metanal', dist: 6.5, pistar: true, hint: true });
  const draw = (k) => {
    const svg = svgEl(360, 300, 'Diagrama qualitativo de OM da ligação π C=O');
    const lv = (x, y, w, c, t) => { add(svg, 'line', { x1: x - w, y1: y, x2: x + w, y2: y, stroke: c, 'stroke-width': 4 }); add(svg, 'text', { x, y: y - 9, 'text-anchor': 'middle', class: 'lab' }, t); };
    lv(70, 130, 30, '#ff9f43', 'p (C)'); lv(290, 175, 30, '#2fd4f5', 'p (O)');
    lv(180, 60, 36, k === 'pistar' ? '#ffd45c' : '#6f82a3', 'π* (LUMO)'); lv(180, 240, 36, k === 'pi' ? '#ffd45c' : '#6f82a3', 'π (ocupado)');
    add(svg, 'text', { x: 180, y: 236, 'text-anchor': 'middle', class: 'elec' }, '↑↓');
    [[100, 130, 144, 60], [100, 130, 144, 240], [260, 175, 216, 60], [260, 175, 216, 240]].forEach(([x1, y1, x2, y2]) => add(svg, 'line', { x1, y1, x2, y2, stroke: '#6f82a3', 'stroke-dasharray': '4 4' }));
    add(svg, 'text', { x: 6, y: 16, class: 'lab' }, 'E ↑');
    clear(dia).append(svg);
    A.st.pi = k === 'pi'; A.st.pistar = k === 'pistar'; A.rebuild();
    cap.innerHTML = k === 'pi' ? '<b>π (ligante, ocupado):</b> combinação em fase; maior coeficiente no <b>O</b> (mais eletronegativo, p de menor energia).' : '<b>π* (antiligante, vazio):</b> combinação fora de fase, com nó entre C e O; <b>maior lobo no carbono</b>. É um importante componente do <b>LUMO</b>: o nucleófilo doa seus elétrons para esse orbital — por isso ataca o C.';
  };
  host.append(seg([['pistar', 'π* (LUMO)'], ['pi', 'π (ocupado)']], 'pistar', draw, 'orbital'), h('div', { class: 'grid2' }, h('div', null, v, cap), dia), ORB_LEG(), h('p', { class: 'hint3' }, 'Orbitais qualitativos (combinação de p_C e p_O com coeficientes ilustrativos), não calculados.'));
  draw('pistar');
}

/* ===================================================================
 * 9. Bürgi–Dunitz
 * =================================================================== */
export function bdSim(host, o = {}) {
  const v = vbox('tall'), out = h('div', { 'aria-live': 'polite' });
  const rng = h('input', { type: 'range', min: 60, max: 180, value: o.start || 150, 'aria-label': 'ângulo Nu–C=O' }), val = h('b');
  const A = coScene(v, o.smi || 'C=O', { dist: 7.5, pistar: true, bd: +rng.value, cone: false, delta: true, hint: true });
  let pend = 0;
  const go = () => {
    const th = +rng.value; val.textContent = th + '°'; A.st.bd = th; A.rebuild();
    const good = Math.abs(th - 107) <= 8;
    out.replaceChildren(fb(good ? 'ok' : 'bad', good ? `✔ ${th}°: trajetória compatível com Bürgi–Dunitz (≈ 105–110°). O par do nucleófilo encontra o grande lobo do π* no C e evita a densidade do O; o C começa a se piramidalizar rumo ao tetraédrico.` : th < 99 ? `${th}°: aproximação pelo lado do oxigênio — forte repulsão com os pares e a densidade π do O; sobreposição ruim com o π* (que tem nó entre C e O).` : th < 125 ? `${th}°: próximo, mas ainda fora da região favorável (≈ 107°).` : `${th}°: chegando “por trás” do C, quase no plano — sobreposição pobre com o π* e repulsão com os substituintes.`));
  };
  rng.addEventListener('input', () => { cancelAnimationFrame(pend); pend = requestAnimationFrame(go); });
  host.append(h('div', { class: 'range-row' }, h('span', null, 'ângulo Nu···C=O'), rng, val), h('div', { class: 'controls' }, tgl('Cone ≈ 107°', () => { A.st.cone = !A.st.cone; A.rebuild(); return A.st.cone; }, false), tgl('π*', () => { A.st.pistar = !A.st.pistar; A.rebuild(); return A.st.pistar; }, true), seg([['1', 'face superior'], ['-1', 'face inferior']], '1', (k) => { A.st.side = +k; A.rebuild(); }, 'face')), v, out, legend([['#2fd4f5', 'nucleófilo e seu orbital'], ['#3ddc97', 'trajetória favorável'], ['#ff5c6c', 'desfavorável']]));
  go();
}

/* ===================================================================
 * 10. Propriedades físicas
 * =================================================================== */
export function boiling(host) {
  const D = [['butano', 'CCCC', 58, -1, 'só dispersão'], ['propanal', 'CCC=O', 58, 48, 'dipolo–dipolo'], ['propanona', 'CC(C)=O', 58, 56, 'dipolo–dipolo'], ['propan-1-ol', 'CCCO', 60, 97, 'ligação de H']];
  const W = 640, H = 260, svg = svgEl(W, H, 'Pontos de ebulição comparados');
  const x0 = 170, sc = 2.9;
  D.forEach(([n, , mm, bp, why], i) => { const y = 24 + i * 56; add(svg, 'text', { x: x0 - 10, y: y + 18, 'text-anchor': 'end', class: 'lab' }, `${n} (M ≈ ${mm})`); add(svg, 'rect', { x: x0, y, width: Math.max(4, (bp + 10) * sc), height: 28, rx: 6, fill: i === 3 ? '#3ddc97' : i === 0 ? '#6f82a3' : '#ff9f43' }); add(svg, 'text', { x: x0 + Math.max(4, (bp + 10) * sc) + 8, y: y + 19, class: 'lab' }, `${bp} °C · ${why}`); });
  host.append(h('div', { class: 'energywrap' }, svg), h('p', { class: 'hint3' }, 'Pontos de ebulição aproximados, massas molares semelhantes: alcano < aldeído/cetona < álcool (tendência para exemplos simples comparáveis).'));
}
export function waterHB(host) {
  const v = vbox();
  coScene(v, 'CC(C)=O', { dist: 9, hint: true, post: (extra, G) => {
    const ok = G.lps.filter((x) => G.atoms[x.i].el === 'O');
    ok.forEach(({ i, dir }, k) => {
      const O = G.atoms[i].p, Hp = V.add(O, V.mul(dir, 1.9)), Ow = V.add(Hp, V.mul(dir, 0.97));
      dashed(extra, V.add(O, V.mul(dir, 0.3)), Hp, CYAN);
      ball(extra, Hp, 0xf2f5fa, 0.22); ball(extra, Ow, 0xef3b3b, 0.33, k ? null : 'H₂O', 'c');
      const side = V.norm(V.cross(dir, [0, 0, 1])); ball(extra, V.add(Ow, V.mul(V.norm(V.add(dir, V.mul(side, 1.4))), 0.97)), 0xf2f5fa, 0.22);
    });
  } });
  host.append(h('div', { class: 'grid2' }, v, h('div', null, h('div', { class: 'note key' }, h('b', { class: 't' }, 'Solubilidade'), h('p', { html: 'O O carbonílico <b>aceita</b> ligações de hidrogênio da água (linhas tracejadas), mas aldeídos e cetonas simples não têm O–H para <b>doar</b>. Por isso: pequenas carbonilas (metanal, etanal, acetona) são miscíveis ou muito solúveis; a solubilidade cai à medida que a cadeia hidrocarbonada cresce (butanal → pentanal → hexanal…).' })))));
}

/* ===================================================================
 * 11. Reatividade aldeído × cetona
 * =================================================================== */
export function reactivity(host) {
  const L = [['metanal', 'C=O', 'mais reativo: dois H, nenhum impedimento'], ['etanal', 'CC=O', 'um grupo alquila'], ['propanona', 'CC(C)=O', 'dois grupos alquila'], ['di-terc-butilcetona', 'CC(C)(C)C(=O)C(C)(C)C', 'muito impedida: acesso difícil ao C']];
  const grid = h('div', { class: 'grid4' });
  host.append(grid, h('p', { class: 'hint3' }, 'Modelos em preenchimento espacial; o C carbonílico está destacado (laranja).'), h('div', { class: 'cmp2' }, h('div', { class: 'chcard' }, h('h4', null, 'Estérica'), h('p', null, 'Grupos maiores dificultam a aproximação do nucleófilo e aumentam a tensão no intermediário tetraédrico (ângulos ≈ 109°).')), h('div', { class: 'chcard' }, h('h4', null, 'Eletrônica'), h('p', null, 'Grupos alquila doam densidade (indução/hiperconjugação) e estabilizam o Cδ+, tornando-o menos eletrofílico.'))));
  L.forEach(([n, smi, t]) => { const v = vbox('short'); grid.append(h('div', { class: 'chcard center' }, h('h4', null, n), v, h('small', null, t))); coScene(v, smi, { style: 'space', elec: true, hint: false, dist: smi.length > 10 ? 11 : 7 }); });
}

/* ===================================================================
 * 12. Adição nucleofílica — 2D + 3D + energia sincronizados
 * =================================================================== */
const EPTS = [[0, 0, 'reagentes'], [0.25, 62, 'ET', 'ts'], [0.48, 18, 'alcóxido', 'int'], [0.66, 30, 'ET (H⁺)', 'ts'], [0.88, -22, 'álcool', 'end']];
export function energySvg(stage, pts = EPTS, cur = null) {
  const svg = svgEl(560, 220, 'Perfil de energia qualitativo');
  const { X, Y } = profile(svg, pts, { ymin: -35, ymax: 80, cls: 'red' });
  if (stage !== null && stage !== undefined) { const [x, y] = pts[stage]; add(svg, 'circle', { cx: X(x), cy: Y(y), r: 10, class: 'cur' }); }
  if (cur !== null) add(svg, 'line', { x1: X(cur), y1: 14, x2: X(cur), y2: 196, class: 'cursor' });
  add(svg, 'text', { x: 6, y: 14, class: 'lab' }, 'Energia ↑ (qualitativa)');
  return { svg, X, Y };
}
const STAGE3D = { 0: [0, 0], 1: [0.55, 0], 2: [1, 0], 3: [1, 0.5], 4: [1, 1] };
const STAGEEN = { 0: 0, 1: 1, 2: 2, 3: 3, 4: 4 };
/** reprodutor sincronizado genérico */
export function syncPlayer(host, frames, o = {}) {
  let i = 0, timer = null;
  const stage = h('div', { class: 'stage2d' }), cap = h('div', { class: 'pcap', 'aria-live': 'polite' }), dots = h('div', { class: 'dots' }), en = h('div', { class: 'energywrap mini' }), v = vbox();
  const S3 = o.scene ? o.scene(v) : null;
  const go = (k) => {
    i = Math.max(0, Math.min(frames.length - 1, k)); const f = frames[i];
    clear(stage).append(svgOf(f.s, { scale: 40, fs: 17, animate: true }));
    cap.innerHTML = f.cap;
    clear(dots).append(...frames.map((_, n) => h('i', { class: n === i ? 'on' : '' })));
    if (S3 && o.map3d) { const [t, p] = o.map3d(f.stage ?? i); S3.set(t, p); }
    if (o.energy !== false) clear(en).append(energySvg(o.mapEn ? o.mapEn(f.stage ?? i) : STAGEEN[f.stage ?? i], o.pts).svg);
    pv.disabled = i === 0; nx.disabled = i === frames.length - 1;
  };
  const stop = () => { if (timer) { clearInterval(timer); timer = null; play.textContent = '▶ Reproduzir'; } };
  const play = h('button', { class: 'btn sm primary', type: 'button', onclick: () => { if (timer) { stop(); return; } if (i === frames.length - 1) go(0); play.textContent = '❚❚ Pausar'; timer = setInterval(() => { if (i >= frames.length - 1) { stop(); return; } go(i + 1); }, o.slow ? 6000 : 3400); } }, '▶ Reproduzir');
  const pv = h('button', { class: 'btn sm', type: 'button', onclick: () => { stop(); go(i - 1); } }, '◀ Etapa anterior');
  const nx = h('button', { class: 'btn sm', type: 'button', onclick: () => { stop(); go(i + 1); } }, 'Próxima etapa ▶');
  host.append(h('div', { class: 'controls' }, play, pv, nx, S3 ? tgl('Mostrar π*', () => { S3.st.pistar = !S3.st.pistar; S3.set(S3.st.t, S3.st.prot); return S3.st.pistar; }, !!(S3 && S3.st.pistar)) : null), h('div', { class: S3 ? 'grid2 mech' : '' }, h('div', { class: 'player mech' }, stage, cap, dots), S3 ? v : null), o.energy !== false ? en : null);
  go(0);
  host._stop = stop;
  return { go, S3 };
}
export function addMech(host) {
  syncPlayer(host, addFrames(), { scene: (v) => addScene(v, { r1: 'CH3', r2: 'CH3', nu: 'OH', pistar: true, alt: 'Ataque nucleofílico à acetona' }), map3d: (st) => STAGE3D[st] });
}
export function tetraSlider(host) {
  const v = vbox(), rng = h('input', { type: 'range', min: 0, max: 100, value: 0, 'aria-label': 'progresso do ataque' }), out = h('div', { 'aria-live': 'polite' });
  const A = addScene(v, { r1: 'CH3', r2: 'H', nu: 'OH', pistar: true, alt: 'Formação do intermediário tetraédrico' });
  let pend = 0;
  const go = () => { const t = +rng.value / 100; A.set(t, 0); const g = A.g, C = g.atoms[0].p, O = g.atoms[1].p; const dCO = V.len(V.sub(O, C)); out.replaceChildren(fb('neutral', `C–O = ${dCO.toFixed(2).replace('.', ',')} Å · carbono ${t < 0.5 ? '<b>sp²</b> (trigonal planar)' : '<b>sp³</b> (tetraédrico)'} · ${t < 0.3 ? 'C=O intacta' : t < 0.85 ? 'π se rompendo enquanto a σ Nu–C se forma' : 'alcóxido formado'}.`)); };
  rng.addEventListener('input', () => { cancelAnimationFrame(pend); pend = requestAnimationFrame(go); });
  host.append(v, h('div', { class: 'range-row' }, h('span', null, 'sp² planar'), rng, h('span', null, 'sp³ tetraédrico')), out);
  go();
}
export function faces(host) {
  let side = 1;
  const v = vbox(), out = h('div', { 'aria-live': 'polite' }), rng = h('input', { type: 'range', min: 0, max: 100, value: 0, 'aria-label': 'progresso' });
  const A = addScene(v, { r1: 'CH3', r2: 'C2H5', nu: 'H', side, alt: 'Ataque de hidreto à butanona pelas duas faces' });
  const go = () => { const t = +rng.value / 100; A.opt.side = side; A.set(t, t > 0.95 ? 1 : 0); if (t > 0.95) { const g = A.g; const cfg = rs(g.atoms, [1, 6, 2, g.info.nuI]); out.replaceChildren(fb('ok', `Face ${side > 0 ? 'superior' : 'inferior'} → <b>(${cfg})-butan-2-ol</b>. ${side > 0 ? 'Ataque pela outra face daria o enantiômero.' : ''} Sem influência quiral, as duas faces são atacadas igualmente: <b>mistura racêmica</b>.`)); } else out.replaceChildren(fb('neutral', 'Arraste até o fim para formar o álcool. A butanona é plana: o hidreto pode chegar por qualquer uma das duas faces.')); };
  rng.addEventListener('input', go);
  host.append(h('div', { class: 'controls' }, seg([['1', 'face superior'], ['-1', 'face inferior']], '1', (k) => { side = +k; go(); }, 'face')), v, h('div', { class: 'range-row' }, h('span', null, 'butanona'), rng, h('span', null, 'butan-2-ol')), out, h('details', { class: 'why' }, h('summary', null, 'Avançado: faces Re e Si'), h('p', null, 'Olhando para uma face, ordene os três substituintes do C trigonal por prioridade CIP (O > C₂H₅ > CH₃): sentido horário = face Re; anti-horário = face Si. Na butanona, hidreto pela face Re dá (S)-butan-2-ol e pela face Si dá (R)-butan-2-ol (o H entra com a menor prioridade).')));
  go();
}
void THREE; void label; void fig;
