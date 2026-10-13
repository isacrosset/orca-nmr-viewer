/*
 * mods1.js — módulos 1–11: tela inicial, revisão, reação geral, mecanismo
 * sincronizado (2D + 3D + energia), complexo σ, perfil energético e as
 * cinco reações (halogenação, nitração, sulfonação, Friedel–Crafts).
 */
import { h, seg, tgl } from './widgets2d.js';
import { S } from './chem2d.js';
import { MOLS, mono } from './arom.js';
import { svgS, svgEl, add, profile } from './arom2d.js';
import { aromScene } from './a3d.js';
import { molScene } from './scene3d.js';
import { fromSmiles } from './struct.js';
import { fb, clear, sel, vbox, legend, PI_LEGEND } from './ui.js';
import { RX, SUBS } from './sub.js';
import { ringDraw, ringSVG2, sigmaForms, sigmaS, mechFrames, genFrames, OUT } from './sea2d.js';
import { heroScene, mechScene, subScene, STAGES } from './sea3d.js';

export const RXKEYS = ['brom', 'nitr', 'sulf', 'alq', 'acil'];
const rxOpts = (keys = RXKEYS) => keys.map((k) => [k, RX[k].name]);

/* ===================================================================
 * 1. Início
 * =================================================================== */
export function hero(host) {
  const v = vbox('tall');
  host.append(v, h('p', { class: 'cardlab center' }, 'Nuvem π do benzeno (magenta) e um eletrófilo E⁺ (laranja) se aproximando.'));
  heroScene(v);
}
export function heroEq(host) {
  const s = new S();
  const r = ringDraw(s, { kek: 'hyb', H: [0] }); s.atoms[r.extra.H0][3] = { cls: 'hb' };
  s.t(1.9, 0, '+  E⁺', 'cond', 20); s.r(2.8, 4.4, 0, '', '');
  const r2 = ringDraw(s, { kek: 'hyb', x: 5.8 }); const k = s.br(r2.id[0], 90, 'E', 1); s.atoms[k][3] = { cls: 'elec' };
  s.t(7.9, 0, '+  H⁺', 'cond', 20);
  host.append(h('div', { class: 'figs' }, svgS(s, { scale: 40, fs: 18 })));
}

/* ===================================================================
 * 2. Revisão: adição × substituição
 * =================================================================== */
export function addVsSub(host) {
  const col = (title, steps, cls) => h('div', { class: 'chcard ' + cls }, h('h4', null, title), h('ol', { class: 'flowv' }, steps.map(([t, k]) => h('li', { class: k }, t))));
  host.append(h('div', { class: 'cmp2' },
    col('Adição (hipotética)', [['benzeno aromático', 'arom'], ['intermediário não aromático', 'non'], ['produto de adição NÃO aromático', 'non']], 'bad'),
    col('Substituição (SEA)', [['benzeno aromático', 'arom'], ['complexo σ: perda TEMPORÁRIA', 'non'], ['perda de H⁺', 'step'], ['produto AROMÁTICO', 'arom']], 'good')),
  h('div', { class: 'centralphrase' }, 'A aromaticidade é perdida temporariamente durante a SEA, mas restaurada no produto final.'));
}
export function subAddEnergy(host) {
  const svg = svgEl(640, 330, 'Perfis de energia: substituição × adição');
  profile(svg, [[0, 0, 'Ar–H + E⁺'], [0.25, 72, 'ET₁', 'ts'], [0.45, 38, 'complexo σ', 'int'], [0.62, 50, 'ET₂', 'ts'], [0.8, -22, 'Ar–E (aromático)', 'end']], { ymin: -40, ymax: 90, cls: 'sea' });
  profile(svg, [[0.45, 38, ''], [0.62, 58, ''], [0.9, 24, 'adição: não aromático', 'end']], { ymin: -40, ymax: 90, cls: 'addp' });
  add(svg, 'text', { x: 10, y: 16, class: 'lab' }, 'Energia ↑');
  host.append(h('div', { class: 'energywrap' }, svg), legend([['#3ddc97', 'substituição: perda de H⁺ restaura a aromaticidade'], ['#ff5c6c', 'captura do nucleófilo: produto não aromático, mais alto em energia']]), h('p', { class: 'hint3' }, 'Perfis qualitativos. Ambos os caminhos compartilham o complexo σ; o que decide é a etapa seguinte.'));
}

/* ===================================================================
 * 3. Reação geral; benzeno como nucleófilo
 * =================================================================== */
export function generalEq(host) {
  const box = h('div', { class: 'figs' }), cap = h('p', { class: 'cardlab' });
  const draw = (k) => {
    const s = new S();
    const r = ringDraw(s, { kek: 'hyb', H: [0] }); s.atoms[r.extra.H0][3] = { cls: k === 'h' ? 'hb' : '', halo: k === 'h' ? 'o' : undefined };
    if (k === 'h') s.atoms[r.extra.H0][3].halo = 'o';
    s.t(1.9, 0, '+', 'cond', 22); const e = s.a(2.6, 0, 'E', { cls: 'elec', chg: '+', halo: k === 'e' ? 'o' : undefined });
    s.r(3.2, 4.7, 0, '', '');
    const r2 = ringDraw(s, { kek: 'hyb', x: 6.1 }); const kk = s.br(r2.id[0], 90, 'E', 1); s.atoms[kk][3] = { cls: 'elec', halo: k === 'p' ? 'g' : undefined };
    s.t(8.2, 0, '+', 'cond', 22); s.a(8.9, 0, 'H', { chg: '+', halo: k === 'h' ? 'o' : undefined });
    void e;
    clear(box).append(svgS(s, { scale: 40, fs: 18 }));
    cap.innerHTML = { a: '<b>Ar–H</b> = composto aromático (o hexágono com círculo é o grupo arila, Ar).', e: '<b>E⁺</b> = eletrófilo (espécie deficiente em elétrons, gerada pelos reagentes).', p: '<b>Ar–E</b> = produto substituído: E ocupa o lugar do H.', h: 'O <b>H</b> do anel sai como <b>H⁺</b> (capturado por uma base do meio).' }[k];
  };
  host.append(seg([['a', 'Ar–H'], ['e', 'E⁺'], ['p', 'Ar–E'], ['h', 'H substituído']], 'a', draw, 'destacar'), box, cap);
  draw('a');
}
export function nucleophile(host) {
  const a = vbox('short'), b = vbox('short');
  host.append(h('div', { class: 'cmp2' },
    h('div', { class: 'chcard' }, h('h4', null, 'Nuvem π: acima e abaixo do anel'), a, h('p', null, 'Seis elétrons π deslocalizados, acessíveis acima e abaixo do plano: é essa densidade que interage com o eletrófilo.')),
    h('div', { class: 'chcard' }, h('h4', null, 'Mapa qualitativo de densidade π'), b, h('p', null, 'As duas faces do anel (nuvem π) são regiões ricas em elétrons (vermelho): é por cima ou por baixo do plano que o eletrófilo se aproxima.'))),
  legend([['#ff4fa3', 'densidade π'], ['#f05a4a', 'mais rico'], ['#5b8cff', 'mais pobre']]));
  aromScene(a, MOLS.benzeno, { cloud: true, hint: false, dist: 10 });
  aromScene(b, MOLS.benzeno, { esp: [-0.25, -0.25, -0.25, -0.25, -0.25, -0.25], hint: false, dist: 10 });
}

/* ===================================================================
 * 4. Mecanismo sincronizado: 2D + 3D + perfil de energia
 * =================================================================== */
const EPTS = [[0, 0, 'reagentes'], [0.25, 76, 'ET₁', 'ts'], [0.46, 42, 'complexo σ', 'int'], [0.62, 54, 'ET₂', 'ts'], [0.86, -14, 'produto', 'end']];
function energyMini(stage) {
  const svg = svgEl(560, 230, 'Perfil de energia da SEA, etapa atual destacada');
  const { X, Y } = profile(svg, EPTS, { ymin: -30, ymax: 95, cls: 'sea' });
  if (stage !== null && stage !== undefined) { const [x, y] = EPTS[stage]; add(svg, 'circle', { cx: X(x), cy: Y(y), r: 10, class: 'cur' }); }
  add(svg, 'text', { x: 6, y: 14, class: 'lab' }, 'Energia ↑');
  return svg;
}
export function mechSync(host, o = {}) {
  let rx = o.rx || 'brom', i = 0, timer = null, slow = false, F = [];
  const stage2d = h('div', { class: 'stage2d' }), cap = h('div', { class: 'pcap', 'aria-live': 'polite' }), dots = h('div', { class: 'dots' }), en = h('div', { class: 'energywrap mini' }), v = vbox(), arom = h('div', { class: 'aromflag' });
  const M = mechScene(v, rx, { hint: false });
  const go = (k) => {
    i = Math.max(0, Math.min(F.length - 1, k)); const f = F[i];
    clear(stage2d).append(svgS(f.s, { scale: 40, fs: 17, animate: true, zoom: 1.25 }));
    cap.innerHTML = f.cap;
    clear(dots).append(...F.map((_, n) => h('i', { class: n === i ? 'on' : '' })));
    M.setStage(f.stage);
    clear(en).append(energyMini(f.stage));
    const lost = f.stage === 2 || f.stage === 3 || (f.stage === 1);
    arom.className = 'aromflag ' + (f.stage === 0 && i < F.length - 1 && F[i].stage === 0 ? 'on' : lost ? 'off' : 'on');
    arom.textContent = f.stage === 1 ? 'aromaticidade sendo perdida (ET₁)' : f.stage === 2 ? 'aromaticidade temporariamente perdida' : f.stage === 3 ? 'restaurando a aromaticidade (ET₂)' : f.stage === 4 ? 'aromaticidade restaurada' : 'anel aromático';
    prev.disabled = i === 0; next.disabled = i === F.length - 1;
  };
  const stop = () => { if (timer) { clearInterval(timer); timer = null; play.textContent = '▶ Reproduzir'; } };
  const play = h('button', { class: 'btn sm primary', type: 'button', onclick: () => { if (timer) { stop(); return; } if (i === F.length - 1) go(0); play.textContent = '❚❚ Pausar'; timer = setInterval(() => { if (i >= F.length - 1) { stop(); return; } go(i + 1); }, slow ? 6500 : 3400); } }, '▶ Reproduzir');
  const prev = h('button', { class: 'btn sm', type: 'button', onclick: () => { stop(); go(i - 1); } }, '◀ Etapa anterior');
  const next = h('button', { class: 'btn sm', type: 'button', onclick: () => { stop(); go(i + 1); } }, 'Próxima etapa ▶');
  const load = () => { stop(); F = mechFrames(rx, { sub: o.sub, r: o.r }); M.setRx(rx); go(0); };
  host.append(
    h('div', { class: 'controls' }, o.fixed ? null : h('label', null, 'Reação: ', sel(rxOpts(), rx, (k) => { rx = k; load(); }, 'reação')), play, prev, next,
      tgl('🐢 Lento', () => { slow = !slow; if (timer) { stop(); play.click(); } return slow; }, false),
      tgl('Mostrar elétrons', () => { M.st.e = !M.st.e; M.rebuild(); return M.st.e; }, false),
      tgl('Mostrar orbitais', () => { M.st.p = !M.st.p; M.st.cloud = !M.st.p; M.rebuild(); return M.st.p; }, false)),
    h('div', { class: 'grid2 mech' }, h('div', { class: 'player mech' }, stage2d, cap, dots), h('div', null, v, arom)), en);
  load();
  host._stop = stop;
}

/* ===================================================================
 * 5. Complexo σ
 * =================================================================== */
export function sigmaVs(host) {
  const a = vbox('short'), b = vbox('short');
  host.append(h('div', { class: 'cmp2' },
    h('div', { class: 'chcard good' }, h('h4', null, 'Benzeno: 6 orbitais p contínuos'), a, h('p', null, 'Ciclo completo de sobreposição: nuvem π contínua — aromático.')),
    h('div', { class: 'chcard bad' }, h('h4', null, 'Complexo σ: um carbono ≈ sp³'), b, h('p', { html: 'O carbono que recebeu E (com H e E) não tem orbital p: o ciclo se interrompe. Restam 5 orbitais p com <b>4 elétrons</b> e carga + (sistema pentadienila). <b>Aromaticidade temporariamente perdida.</b>' }))),
  h('div', { class: 'controls' }, seg([['c', 'nuvem π'], ['p', 'orbitais p']], 'c', (k) => { [A, B].forEach((X) => { X.st.cloud = k === 'c'; X.st.p = k === 'p'; X.rebuild(); }); }, 'exibição')), PI_LEGEND());
  const A = aromScene(a, MOLS.benzeno, { cloud: true, hint: false, dist: 9.5 });
  const B = aromScene(b, mono(['CH2', 'C+', 'C', 'C', 'C', 'C'], [[2, 3], [4, 5]]), { cloud: true, hint: false, dist: 9.5, sub: 'Br', e: true });
}
export function sigmaRes(host) {
  let k = 0;
  const { forms } = sigmaForms(null, null);
  const box = h('div', { class: 'figs' }), cap = h('p', { class: 'cardlab' });
  const draw = () => {
    if (k === 3) { const s = new S(); const r = ringDraw(s, { dbl: [], sp3: { pos: 0 } }); [1, 3, 5].forEach((q) => { s.atoms[r.id[q]][3] = { chg: 'δ+', halo: 'v' }; }); for (let q = 1; q < 5; q++) s.bonds[q][2] = '1p'; clear(box).append(svgS(s, { scale: 50, zoom: 1.4 })); cap.innerHTML = 'Híbrido: carga + repartida entre os carbonos <b>orto e para</b> ao carbono sp³ (C2, C4, C6) — nunca no meta. <b>Não são três intermediários diferentes</b>: são formas canônicas do mesmo íon.'; return; }
    const f = forms[k]; const s = sigmaS(null, null, Object.assign({}, f), { arrows: false });
    const nx = forms[k + 1]; if (nx && nx.arrow) s.arrow({ b: [s._ring.id[nx.arrow[0][0]], s._ring.id[nx.arrow[0][1]]] }, { b: [s._ring.id[nx.arrow[1][0]], s._ring.id[nx.arrow[1][1]]] }, 0.55, '');
    clear(box).append(svgS(s, { scale: 50, zoom: 1.4, animate: true }));
    cap.innerHTML = [`Contribuinte 1: carga + em C2 (orto ao carbono sp³). Seta: o par π C3=C4 desloca-se para C2–C3.`, 'Contribuinte 2: carga + em C4 (para ao carbono sp³). Seta: o par π C5=C6 desloca-se para C4–C5.', 'Contribuinte 3: carga + em C6 (o outro orto).'][k];
  };
  host.append(seg([['0', 'forma 1'], ['1', 'forma 2'], ['2', 'forma 3'], ['3', 'híbrido']], '0', (x) => { k = +x; draw(); }, 'contribuinte'), box, cap);
  draw();
}
export function restore(host) {
  const v = vbox(), out = h('div', { 'aria-live': 'polite' }), fig = h('div', { class: 'figs' });
  const def = mono(['CH2', 'C+', 'C', 'C', 'C', 'C'], [[2, 3], [4, 5]], { name: 'complexo σ' });
  let A = null, done = false;
  const start = () => {
    done = false; if (A) A.v.dispose(); clear(v);
    A = aromScene(v, def, { cloud: true, sub: 'Br', dist: 9.5, cam: [4.2, -6.8, 5.2], sel: 0, onPick: pick });
    const s = sigmaS(null, null, sigmaForms(null, null).forms[0], {}); clear(fig).append(svgS(s, { scale: 40 }));
    out.replaceChildren(fb('neutral', 'Modo “Restaure a aromaticidade”: clique (no modelo 3D) no H que a base deve remover. O carbono sp³ está destacado.'));
  };
  function pick(i) {
    if (done) return;
    const G = A.G, at = G.atoms[i];
    if (!at || at.el !== 'H') { out.replaceChildren(fb('bad', 'Escolha um átomo de H.')); return; }
    const host0 = G.bonds.find((b) => b[1] === i)[0];
    if (host0 !== 0) { out.replaceChildren(fb('bad', '✘ Esse H está num carbono sp². Removê-lo deixaria o carbono sp³ intacto: o ciclo de orbitais p continuaria interrompido.')); return; }
    done = true; A.v.dispose(); clear(v);
    A = aromScene(v, MOLS.benzeno, { cloud: true, sub: 'Br', hybrid: true, dist: 9.5, cam: [4.2, -6.8, 5.2] });
    const s = new S(); const r = ringDraw(s, { kek: 'hyb' }); const k = s.br(r.id[0], 90, 'Br', 1); s.atoms[k][3] = { cls: 'elec' }; clear(fig).append(svgS(s, { scale: 40 }));
    out.replaceChildren(fb('ok', '✔ A base remove o H do carbono sp³; o par da ligação C–H volta ao anel (C–H → sistema π): o carbono volta a ser sp², o sexto orbital p reaparece e a nuvem π se fecha — <b>aromaticidade restaurada</b>. Esse ganho é a forte força motriz desta etapa.'), h('button', { class: 'btn sm', type: 'button', onclick: start }, '↺ Repetir'));
  }
  host.append(h('div', { class: 'grid2' }, v, h('div', null, fig, out)), PI_LEGEND());
  start();
}

/* ===================================================================
 * 6. Perfil energético com cursor sincronizado
 * =================================================================== */
export function energySync(host) {
  const W = 640, H = 300;
  const svg = svgEl(W, H, 'Energia potencial × coordenada da reação (arraste o cursor)');
  const { X, Y } = profile(svg, EPTS, { ymin: -30, ymax: 95, cls: 'sea' });
  add(svg, 'line', { x1: X(0.25), y1: Y(0), x2: X(0.25), y2: Y(76), class: 'ea' });
  add(svg, 'text', { x: X(0.25) + 8, y: Y(14), class: 'ealab' }, 'maior barreira (ET₁)');
  add(svg, 'text', { x: 6, y: 14, class: 'lab' }, 'Energia potencial ↑');
  add(svg, 'text', { x: W - 10, y: H - 6, 'text-anchor': 'end', class: 'lab' }, 'coordenada da reação →');
  const cur = add(svg, 'line', { x1: X(0), y1: 20, x2: X(0), y2: H - 30, class: 'cursor' });
  const rng = h('input', { type: 'range', min: 0, max: 100, value: 0, 'aria-label': 'posição ao longo da coordenada da reação' });
  const fig = h('div', { class: 'figs' }), v = vbox('short'), info = h('div', { 'aria-live': 'polite' });
  const M = mechScene(v, 'brom', { hint: false, dist: 11 });
  const F = mechFrames('brom');
  const pick = { 0: F.findIndex((f) => f.stage === 1) - 1, 1: F.findIndex((f) => f.stage === 1), 2: F.findIndex((f) => f.stage === 2), 3: F.findIndex((f) => f.stage === 3), 4: F.length - 1 };
  let last = -1;
  const TXT = ['<b>Reagentes:</b> benzeno aromático + eletrófilo ativado. 6 orbitais p contínuos.', '<b>ET₁</b> (estado de transição): a ligação C–E está se formando e o anel está perdendo a aromaticidade. Ponto de maior energia: <b>etapa lenta</b>.', '<b>Complexo σ</b>: intermediário (mínimo local). Carbono sp³, carga + deslocalizada, sem aromaticidade.', '<b>ET₂</b>: a ligação C–H está se rompendo; barreira pequena porque a aromaticidade começa a ser recuperada.', '<b>Produto</b>: aromaticidade restaurada; energia bem abaixo do complexo σ.'];
  const go = () => {
    const t = +rng.value / 100, x = t * 0.86; cur.setAttribute('x1', X(x)); cur.setAttribute('x2', X(x));
    let k = 0; EPTS.forEach((p, n) => { if (Math.abs(p[0] - x) < Math.abs(EPTS[k][0] - x)) k = n; });
    if (k === last) return; last = k;
    M.setStage(k);
    const f = F[Math.max(0, pick[k])]; clear(fig).append(svgS(f.s, { scale: 34, fs: 15 }));
    info.replaceChildren(fb(k === 2 || k === 1 || k === 3 ? 'neutral' : 'ok', TXT[k] + ` <span class="aromflag ${k === 0 || k === 4 ? 'on' : 'off'}">${k === 0 || k === 4 ? 'aromático' : 'sem aromaticidade'}</span>`));
  };
  rng.addEventListener('input', go);
  host.append(h('div', { class: 'energywrap' }, svg), h('div', { class: 'range-row' }, h('span', null, 'reagentes'), rng, h('span', null, 'produtos')), h('div', { class: 'grid2' }, h('div', null, fig, info), v));
  go();
}

/* ===================================================================
 * 7–11. Reações específicas
 * =================================================================== */
export function genPlayer(host, rx) {
  const { F } = genFrames(rx);
  let i = 0;
  const stage = h('div', { class: 'figs' }), cap = h('p', { class: 'cardlab' });
  const go = (k) => { i = Math.max(0, Math.min(F.length - 1, k)); clear(stage).append(svgS(F[i].s, { scale: 46, fs: 18, animate: true })); cap.innerHTML = F[i].cap; pv.disabled = i === 0; nx.disabled = i === F.length - 1; };
  const pv = h('button', { class: 'btn sm', type: 'button', onclick: () => go(i - 1) }, '◀'), nx = h('button', { class: 'btn sm primary', type: 'button', onclick: () => go(i + 1) }, 'Próximo ▶');
  host.append(h('div', { class: 'player mech' }, stage, cap, F.length > 1 ? h('div', { class: 'pctrl' }, pv, nx) : null));
  go(0);
}
export function nitronium3d(host) {
  const v = vbox('short');
  host.append(v, h('p', { class: 'cardlab' }, 'NO₂⁺: N sp, linear (O=N=O 180°), isoeletrônico do CO₂. O N tem carga formal + e é o centro eletrofílico.'));
  molScene(v, fromSmiles('O=[N+]=O', 'íon nitrônio'), { lp: true, angles: true, hint: false, dist: 5.5 });
}
export function so3_3d(host) {
  const v = vbox('short');
  host.append(v, h('p', { class: 'cardlab' }, 'SO₃: trigonal planar; o S (fortemente δ+) é atacado pelo anel. Representação de Lewis simplificada (ligações S=O).'));
  molScene(v, fromSmiles('O=S(=O)=O', 'trióxido de enxofre'), { lp: false, angles: true, hint: false, dist: 5.5 });
}
export function acylium(host) {
  const s = new S();
  const r = s.a(-1.2, 0, 'R'), c = s.a(0, 0, 'C', { cls: 'elec' }), o = s.a(1.2, 0, 'O', { chg: '+', lp: [0] }); s.b(r, c, 1); s.b(c, o, 3);
  s.arrow({ b: [c, o] }, { a: o, ang: 270 }, -0.5, '');
  s.t(2.15, 0, '↔', 'res', 24);
  const r2 = s.a(3.1, 0, 'R'), c2 = s.a(4.3, 0, 'C', { chg: '+', cls: 'elec' }), o2 = s.a(5.5, 0, 'O', { lp: [90, 270] }); s.b(r2, c2, 1); s.b(c2, o2, 2);
  const v = vbox('short');
  host.append(h('div', { class: 'grid2' }, h('div', null, h('div', { class: 'figs' }, svgS(s, { scale: 46, fs: 19 })), h('p', { class: 'cardlab', html: 'À esquerda, todos os átomos com octeto (C≡O⁺): contribuinte principal. À direita, C⁺ (sexteto): explica a eletrofilia no carbono. O íon é <b>linear</b> e estabilizado por ressonância.' })), v));
  molScene(v, fromSmiles('C[C+]=O', 'íon acílio'), { lp: false, angles: true, hint: false, dist: 6 });
}
export function sulfRev(host) {
  const s = new S();
  const r = ringDraw(s, { kek: 'hyb' }); void r;
  s.t(2.4, -0.35, 'SO₃, H₂SO₄', 'cond', 14); s.t(2.4, 0.42, 'H₂O/H⁺ diluído, Δ', 'cond', 14); s.t(2.4, 0.03, '⇌', 'res', 34);
  const r2 = ringDraw(s, { kek: 'hyb', x: 4.8 }); const k = s.br(r2.id[0], 90, 'SO₃H', 1); s.atoms[k][3] = { cls: 'elec' };
  host.append(h('div', { class: 'figs' }, svgS(s, { scale: 42, fs: 17 })), h('div', { class: 'cmp2' }, h('div', { class: 'chcard' }, h('h4', null, '→ sulfonação'), h('p', null, 'SO₃ concentrado (ácido sulfúrico fumegante) desloca o equilíbrio para o ácido benzenossulfônico.')), h('div', { class: 'chcard' }, h('h4', null, '← dessulfonação'), h('p', null, 'Ácido diluído e aquecimento (às vezes vapor): o H⁺ ataca o carbono ipso e o SO₃ é eliminado — a SEA “ao contrário”.'))));
}
export function rearrange(host) {
  const steps = [
    ['CH₃CH₂CH₂–Cl + AlCl₃', 'complexo de cloreto primário: carbono primário com forte caráter carbocatiônico', ''],
    ['CH₃–CH(H)–CH₂⁺  →  CH₃–C⁺H–CH₃', 'migração de hidreto (1,2-H⁻): o H do carbono vizinho migra com seu par de elétrons', 'gera carbocátion secundário, mais estável'],
    ['benzeno + (CH₃)₂CH⁺', 'o anel ataca o carbocátion secundário', ''],
    ['produto principal: isopropilbenzeno (cumeno)', 'produto rearranjado', 'o propilbenzeno (sem rearranjo) é minoritário'],
  ];
  let i = 0;
  const box = h('div'), fig = h('div', { class: 'figs' });
  const draw = () => {
    const s = new S();
    if (i < 2) {
      // propila → isopropila
      const c1 = s.a(0, 0, 'CH₃'), c2 = s.a(1.1, -0.6, i === 0 ? 'CH₂' : 'CH', { cls: i === 1 ? 'elec' : '', chg: i === 1 ? '+' : undefined }), c3 = s.a(2.2, 0, i === 0 ? 'CH₂' : 'CH₃', { chg: undefined }); s.b(c1, c2, 1); s.b(c2, c3, 1);
      if (i === 0) { const cl = s.a(3.3, -0.6, 'Cl', { chg: 'δ−' }); s.b(c3, cl, 'p'); s.a(4.6, -0.6, 'AlCl₃', { cls: 'cat' }); const hh = s.a(1.1, -1.7, 'H', { cls: 'hb' }); s.b(c2, hh, 1); s.arrow({ b: [c2, hh] }, { a: c3, ang: 90 }, -0.5, ''); s.t(2.2, 0.8, 'δ+', 'dlt p', 14); }
      else s.t(1.1, 0.8, 'carbocátion secundário', 'cond', 13);
    } else {
      const r = ringDraw(s, { kek: 'hyb' });
      const c = s.br(r.id[0], 90, '', 1); const a1 = s.br(c, 150, 'CH₃', 1); const a2 = s.br(c, 30, 'CH₃', 1); s.atoms[c][3] = { cls: 'elec' }; void a1; void a2;
      s.t(0, 1.75, i === 2 ? 'ataque ao carbocátion secundário' : 'isopropilbenzeno (cumeno) — majoritário', 'cond', 13);
      if (i === 3) { const r2 = ringDraw(s, { kek: 'hyb', x: 4.3 }); const p1 = s.br(r2.id[0], 90, 'CH₂CH₂CH₃', 1); s.atoms[p1][3] = { cls: 'grey' }; s.t(4.3, 1.75, 'propilbenzeno — minoritário', 'cond', 13); }
    }
    clear(fig).append(svgS(s, { scale: 42, fs: 17, animate: true }));
    clear(box).append(h('div', { class: 'readout' }, h('span', null, h('b', null, steps[i][0])), h('span', null, steps[i][1]), steps[i][2] ? h('span', { class: 'ok' }, steps[i][2]) : null));
  };
  host.append(seg(steps.map((_, n) => [String(n), `etapa ${n + 1}`]), '0', (k) => { i = +k; draw(); }, 'etapa'), fig, box, h('div', { class: 'cmp2' }, h('div', { class: 'chcard' }, h('h4', null, 'Pretendido'), h('p', null, 'propilbenzeno (cadeia linear)')), h('div', { class: 'chcard bad' }, h('h4', null, 'Obtido (majoritário)'), h('p', null, 'isopropilbenzeno: o eletrófilo rearranjou antes de reagir'))));
  draw();
}
export function polyalk(host) {
  const s = new S();
  ringDraw(s, { kek: 'hyb' });
  s.r(1.6, 3.2, 0, 'CH₃Cl', 'AlCl₃');
  const r2 = ringDraw(s, { kek: 'hyb', x: 4.8, subs: { 0: 'CH3' } }); void r2;
  s.r(6.4, 8.0, 0, 'CH₃Cl', 'AlCl₃');
  ringDraw(s, { kek: 'hyb', x: 9.6, subs: { 0: 'CH3', 3: 'CH3' } });
  s.t(12, 0, '+ orto, + tri…', 'cond', 14);
  host.append(h('div', { class: 'figs' }, svgS(s, { scale: 34, fs: 15 })), h('p', { class: 'cardlab', html: 'O grupo alquila introduzido <b>ativa</b> o anel: o tolueno reage mais rápido que o benzeno e compete pelo eletrófilo. Usa-se excesso do aromático para minimizar a polialquilação.' }));
}
export function fcTable(host) {
  const rows = [['Produto', 'Ar–R', 'Ar–COR'], ['Eletrófilo', 'caráter carbocatiônico (R⁺ ou R–X···AlCl₃)', 'íon acílio R–C≡O⁺'], ['Rearranjo', 'possível', 'geralmente não'], ['Polissubstituição', 'pode ocorrer', 'menos favorecida'], ['Efeito do grupo introduzido', 'ativador', 'desativador'], ['AlCl₃', 'quantidade catalítica', '≥ 1 equivalente (complexa a cetona)']];
  host.append(h('div', { class: 'table-wrap' }, h('table', { class: 'cmp' }, h('thead', null, h('tr', null, h('th', null, 'Característica'), h('th', null, 'Alquilação'), h('th', null, 'Acilação'))), h('tbody', null, rows.map(([a, b, c]) => h('tr', null, h('th', null, a), h('td', null, b), h('td', null, c)))))));
}
export function acylRed(host) {
  const s = new S();
  ringDraw(s, { kek: 'hyb' });
  s.r(1.7, 4.3, 0, 'CH₃CH₂COCl', 'AlCl₃');
  const r2 = ringDraw(s, { kek: 'hyb', x: 6 }); const c = s.br(r2.id[0], 90, '', 1); s.br(c, 150, 'O', 2); s.br(c, 30, 'CH₂CH₃', 1);
  s.r(8.2, 11.4, 0, 'Zn(Hg), HCl', 'ou H₂NNH₂, KOH, Δ');
  const r3 = ringDraw(s, { kek: 'hyb', x: 13.4 }); const p = s.br(r3.id[0], 90, 'CH₂CH₂CH₃', 1); s.atoms[p][3] = { cls: 'elec' };
  host.append(h('div', { class: 'figs' }, svgS(s, { scale: 32, fs: 14 })), h('p', { class: 'cardlab', html: 'Acilação (sem rearranjo, monoacilação) seguida de <b>redução da carbonila</b> (Clemmensen ou Wolff–Kishner): propilbenzeno <b>linear</b>, inacessível pela alquilação direta com 1-cloropropano.' }));
}
void OUT; void SUBS; void tgl;
