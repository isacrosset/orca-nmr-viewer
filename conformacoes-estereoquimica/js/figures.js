/*
 * figures.js — figuras estáticas nomeadas. No HTML: <div data-fig="nome"></div>
 */
(function (G) {
  'use strict';
  const C = G.Chem;
  const { skeleton: sk, zigzag, ringPts, newman, fischer, stereoCenter } = C;

  /* monta uma cadeia em zigue-zague com rótulos opcionais nas pontas */
  function chain(n, opts) {
    opts = opts || {};
    const pts = zigzag(n, 0, 0, opts.up);
    const atoms = pts.map((p, i) => [p[0], p[1], (opts.labels || {})[i] || '', (opts.atomOpts || {})[i]]);
    const bonds = [];
    for (let i = 0; i < n - 1; i++) bonds.push([i, i + 1, (opts.types || {})[i] || 1]);
    return { atoms, bonds };
  }
  /* adiciona um ramo ao átomo i (direção em graus, y para baixo) */
  function branch(mol, i, deg, label, type, aopt) {
    const a = mol.atoms[i];
    const r = deg * Math.PI / 180;
    mol.atoms.push([a[0] + Math.cos(r), a[1] + Math.sin(r), label || '', aopt]);
    mol.bonds.push([i, mol.atoms.length - 1, type || 1]);
    return mol.atoms.length - 1;
  }

  const F = {};

  /* ---------------- isômeros constitucionais ---------------- */

  F.butano = () => sk(chain(4));
  F.isobutano = () => { const m = chain(3); branch(m, 1, -90); return sk(m); };
  F.pentano = () => sk(chain(5));
  F.metilbutano = () => { const m = chain(4); branch(m, 1, -90); return sk(m); };
  F.dimetilpropano = () => {
    const m = { atoms: [[0, 0], [1, 0], [-1, 0], [0, -1], [0, 1]], bonds: [[0, 1], [0, 2], [0, 3], [0, 4]] };
    return sk(m);
  };
  F.propan1ol = () => sk(chain(4, { labels: { 3: 'OH' } }));
  F.propan2ol = () => { const m = chain(3); branch(m, 1, -90, 'OH'); return sk(m); };
  F.etanol = () => sk(chain(3, { labels: { 2: 'OH' } }));
  F.dme = () => sk(chain(3, { labels: { 1: 'O' } }));
  F.etoxietano = () => sk(chain(5, { labels: { 2: 'O' } }));
  F.metoxipropano = () => sk(chain(5, { labels: { 1: 'O' } }));
  F.propanona = () => { const m = chain(3); branch(m, 1, -90, 'O', 2); return sk(m); };
  F.propenol = () => { const m = chain(3, { types: { 0: 2 } }); branch(m, 1, -90, 'OH'); return sk(m); };
  F.propanal = () => { const m = chain(4); m.atoms[3][2] = 'O'; m.bonds[2][2] = 2; return sk(m); };

  // C4H10O
  F.butan1ol = () => sk(chain(5, { labels: { 4: 'OH' } }));
  F.butan2ol = () => { const m = chain(4); branch(m, 1, -90, 'OH'); return sk(m); };
  F.metilpropan1ol = () => { const m = chain(4, { labels: { 3: 'OH' } }); branch(m, 1, -90); return sk(m); };
  F.metilpropan2ol = () => { const m = chain(3); branch(m, 1, -90, 'OH'); branch(m, 1, 90); return sk(m); };
  F.metoxi2propano = () => { const m = chain(3, { labels: { 1: 'O' } }); branch(m, 2, -90); m.atoms.push([m.atoms[2][0] + 0.866, m.atoms[2][1] + 0.5]); m.bonds.push([2, 4]); return sk(m); };

  // C6H14 (usado em exercício)
  F.hexano = () => sk(chain(6));
  F.metilpentano2 = () => { const m = chain(5); branch(m, 1, -90); return sk(m); };
  F.metilpentano3 = () => { const m = chain(5); branch(m, 2, 90); return sk(m); };
  F.dimetilbutano22 = () => { const m = chain(4); branch(m, 1, -90); branch(m, 1, 90); return sk(m); };
  F.dimetilbutano23 = () => { const m = chain(4); branch(m, 1, -90); branch(m, 2, 90); return sk(m); };

  /* ---------------- representações do etano ---------------- */

  F.etanoCunha = () => sk({
    atoms: [[0, 0, 'C'], [1.3, 0, 'C'],
      [-0.55, -1.0, 'H'], [-1.05, 0.55, 'H'], [-0.15, 1.15, 'H'],
      [1.85, 1.0, 'H'], [2.35, -0.55, 'H'], [1.45, -1.15, 'H']],
    bonds: [[0, 1], [0, 2], [0, 3, 'w'], [0, 4, 'h'], [1, 5], [1, 6, 'w'], [1, 7, 'h']],
  }, { scale: 44 });

  function sawhorse(host, front, back, fa, ba, w) {
    const g = C.ethaneGeom(front, back, fa, ba, { showH: true });
    new C.Mol3D(host, { atoms: g.atoms, bonds: g.bonds, rot: C.SAWHORSE_ROT, w: w || 230, h: 190, interactive: false });
  }
  F.etanoCavaleteAlt = (h) => sawhorse(h, ['H', 'H', 'H'], ['H', 'H', 'H'], 90, 30);
  F.etanoCavaleteEcl = (h) => sawhorse(h, ['H', 'H', 'H'], ['H', 'H', 'H'], 90, 90);

  F.etanoNewmanAlt = () => newman({ front: ['H', 'H', 'H'], back: ['H', 'H', 'H'], fa: 90, ba: 30 });
  F.etanoNewmanEcl = () => newman({ front: ['H', 'H', 'H'], back: ['H', 'H', 'H'], fa: 90, ba: 100 });

  /* sawhorse 2D desenhado à mão (para o passo a passo) */
  F.cavalete2d = () => sk({
    atoms: [[0, 0.9, 'C'], [1.3, -0.4, 'C'],
      [0, 2.0, 'H'], [-0.95, 0.35, 'H'], [0.95, 0.35, 'H'],
      [1.3, -1.5, 'H'], [0.35, 0.15, 'H'], [2.25, 0.15, 'H']],
    bonds: [[0, 1], [0, 2], [0, 3], [0, 4], [1, 5], [1, 6, 1, { cls: 'back' }], [1, 7]],
  });

  /* ---------------- butano ---------------- */

  const BU_F = ['CH3', 'H', 'H'];
  F.buNewman = (host, ang) => newman({ front: BU_F, back: BU_F, fa: 90, ba: 90 + ang, hl: ['CH3'] }, { fs: 14 });
  F.buAnti = () => F.buNewman(null, 180);
  F.buGauche = () => F.buNewman(null, 60);
  F.buEcl120 = () => F.buNewman(null, 125);
  F.buSin = () => F.buNewman(null, 10);

  /* propano e 2,3-dimetilbutano */
  F.propanoNewmanEcl = () => newman({ front: ['CH3', 'H', 'H'], back: ['H', 'H', 'H'], fa: 90, ba: 100, hl: ['CH3'] }, { fs: 14 });
  F.propanoNewmanAlt = () => newman({ front: ['CH3', 'H', 'H'], back: ['H', 'H', 'H'], fa: 90, ba: 30, hl: ['CH3'] }, { fs: 14 });

  const DMB_F = ['H', 'CH3', 'CH3'];
  F.dmbA = () => newman({ front: DMB_F, back: ['H', 'CH3', 'CH3'], fa: 90, ba: 270, hl: ['CH3'] }, { fs: 13 });
  F.dmbB = () => newman({ front: DMB_F, back: ['H', 'CH3', 'CH3'], fa: 90, ba: 30, hl: ['CH3'] }, { fs: 13 });
  F.dmbC = () => newman({ front: DMB_F, back: ['H', 'CH3', 'CH3'], fa: 90, ba: 150, hl: ['CH3'] }, { fs: 13 });

  F.metilpropanoEcl = () => newman({ front: ['H', 'H', 'H'], back: ['H', 'CH3', 'CH3'], fa: 90, ba: 100, hl: ['CH3'] }, { fs: 14 });
  F.cloropropanoAnti = () => newman({ front: ['Cl', 'H', 'H'], back: ['CH3', 'H', 'H'], fa: 90, ba: 270, hl: ['Cl', 'CH3'] }, { fs: 14 });

  /* ---------------- diagrama de energia do butano ---------------- */

  function buE(deg) {
    const t = deg * C.D2R;
    return 9.7667 + 2.2667 * Math.cos(t) - 0.2667 * Math.cos(2 * t) + 7.2333 * Math.cos(3 * t);
  }
  function energyPlot(fn, o) {
    o = Object.assign({ w: 560, h: 250, max: 20, marks: [], label: 'E (kJ/mol)' }, o);
    const ml = 46, mr = 14, mt = 18, mb = 40;
    const pw = o.w - ml - mr, ph = o.h - mt - mb;
    const svg = C.makeSVG(o.w, o.h, 'plot', o.title);
    const g = C.el('g', null, svg);
    const X = (d) => ml + d / 360 * pw, Y = (e) => mt + ph - e / o.max * ph;
    for (let e = 0; e <= o.max; e += 5) {
      C.el('line', { x1: ml, x2: ml + pw, y1: Y(e), y2: Y(e), class: 'grid' }, g);
      C.chemText(g, ml - 8, Y(e), String(e), { class: 'small', 'text-anchor': 'end' });
    }
    for (let d = 0; d <= 360; d += 60) {
      C.el('line', { x1: X(d), x2: X(d), y1: mt + ph, y2: mt + ph + 4, class: 'axis' }, g);
      C.chemText(g, X(d), mt + ph + 14, d + '°', { class: 'small' });
    }
    C.el('line', { x1: ml, x2: ml + pw, y1: mt + ph, y2: mt + ph, class: 'axis' }, g);
    C.el('line', { x1: ml, x2: ml, y1: mt, y2: mt + ph, class: 'axis' }, g);
    let d = `M${X(0)},${Y(fn(0))}`;
    for (let a = 2; a <= 360; a += 2) d += ` L${C.fmt(X(a))},${C.fmt(Y(fn(a)))}`;
    C.el('path', { d: d + ` L${X(360)},${Y(0)} L${X(0)},${Y(0)} Z`, class: 'curve-fill' }, g);
    C.el('path', { d, class: 'curve' }, g);
    C.chemText(g, 12, mt + ph / 2, o.label, { class: 'small', transform: `rotate(-90 12 ${mt + ph / 2})` });
    C.chemText(g, ml + pw / 2, o.h - 6, o.xlabel || 'ângulo diedro', { class: 'small' });
    o.marks.forEach((m) => {
      C.el('circle', { cx: X(m[0]), cy: Y(fn(m[0])), r: 4, class: 'marker' }, g);
      C.chemText(g, X(m[0]), Y(fn(m[0])) - 12, m[1], { class: 'lbl' });
    });
    return { svg, g, X, Y };
  }
  F.buEnergia = () => energyPlot(buE, {
    xlabel: 'ângulo diedro CH₃–C2–C3–CH₃',
    marks: [[0, '19'], [60, 'gauche 3,8'], [120, '16'], [180, 'anti 0'], [240, '16'], [300, 'gauche 3,8'], [360, '19']],
  }).svg;

  /* ---------------- cicloalcanos ---------------- */

  function poly(n, start) {
    const pts = ringPts(n, 0, 0, start);
    return sk({ atoms: pts.map((p) => [p[0], p[1]]), bonds: pts.map((_, i) => [i, (i + 1) % n]) });
  }
  F.ciclopropano = () => poly(3, -90);
  F.ciclobutano = () => poly(4, -45);
  F.ciclopentano = () => poly(5, -90);
  F.ciclohexano = () => poly(6, -90);

  F.tensaoAnel = () => {
    const data = [[3, 115], [4, 110], [5, 26], [6, 0], [7, 26], [8, 40]];
    const w = 480, h = 230, ml = 46, mb = 40, mt = 16, pw = w - ml - 14, ph = h - mt - mb;
    const svg = C.makeSVG(w, h, 'plot', 'Tensão de anel total de cicloalcanos');
    const g = C.el('g', null, svg);
    const Y = (e) => mt + ph - e / 120 * ph;
    for (let e = 0; e <= 120; e += 20) {
      C.el('line', { x1: ml, x2: ml + pw, y1: Y(e), y2: Y(e), class: 'grid' }, g);
      C.chemText(g, ml - 8, Y(e), String(e), { class: 'small', 'text-anchor': 'end' });
    }
    const bw = pw / data.length;
    data.forEach((d, i) => {
      const x = ml + i * bw + bw * 0.18;
      C.el('rect', { x, y: Y(d[1]) - (d[1] === 0 ? 2 : 0), width: bw * 0.64, height: Math.max(2, ph - (Y(d[1]) - mt)), rx: 4, class: 'bar' + (d[1] === 0 ? ' zero' : '') }, g);
      C.chemText(g, x + bw * 0.32, Y(d[1]) - 10, String(d[1]), { class: 'lbl' });
      C.chemText(g, x + bw * 0.32, mt + ph + 14, 'C' + d[0], { class: 'small' });
    });
    C.chemText(g, 12, mt + ph / 2, 'kJ/mol', { class: 'small', transform: `rotate(-90 12 ${mt + ph / 2})` });
    C.chemText(g, ml + pw / 2, h - 6, 'tamanho do anel', { class: 'small' });
    return svg;
  };

  /* diagrama de energia da interconversão do ciclo-hexano */
  F.cicloEnergia = () => {
    const pts = [[0, 0, 'cadeira'], [1, 45, 'meia-cadeira'], [2, 23, 'bote torcido'], [3, 29, 'bote'], [4, 23, 'bote torcido'], [5, 45, 'meia-cadeira'], [6, 0, 'cadeira']];
    const w = 600, h = 260, ml = 46, mr = 20, mt = 30, mb = 30, pw = w - ml - mr, ph = h - mt - mb;
    const svg = C.makeSVG(w, h, 'plot', 'Energia das conformações do ciclo-hexano');
    const g = C.el('g', null, svg);
    const X = (i) => ml + 20 + i / 6 * (pw - 40), Y = (e) => mt + ph - e / 50 * ph;
    for (let e = 0; e <= 50; e += 10) {
      C.el('line', { x1: ml, x2: ml + pw, y1: Y(e), y2: Y(e), class: 'grid' }, g);
      C.chemText(g, ml - 8, Y(e), String(e), { class: 'small', 'text-anchor': 'end' });
    }
    // curva suave (Catmull-Rom → Bézier)
    const P = pts.map((p) => [X(p[0]), Y(p[1])]);
    let d = `M${P[0][0]},${P[0][1]}`;
    for (let i = 0; i < P.length - 1; i++) {
      const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${C.fmt(c1[0])},${C.fmt(c1[1])} ${C.fmt(c2[0])},${C.fmt(c2[1])} ${C.fmt(p2[0])},${C.fmt(p2[1])}`;
    }
    C.el('path', { d, class: 'curve' }, g);
    pts.forEach((p, i) => {
      C.el('circle', { cx: P[i][0], cy: P[i][1], r: 4, class: 'marker' }, g);
      C.chemText(g, P[i][0], P[i][1] + (p[1] > 30 ? -24 : (p[1] === 0 ? 16 : -24)), p[2], { class: 'lbl' });
      C.chemText(g, P[i][0], P[i][1] + (p[1] > 30 ? -11 : (p[1] === 0 ? 29 : -11)), p[1] + ' kJ/mol', { class: 'small' });
    });
    C.chemText(g, 12, mt + ph / 2, 'E (kJ/mol)', { class: 'small', transform: `rotate(-90 12 ${mt + ph / 2})` });
    return svg;
  };

  /* modelos 3D estáticos de ciclo-hexano */
  function chair3d(host, subs, o) {
    const geo = C.chairGeom((o && o.t) || 0, subs, o);
    const opt = Object.assign({ atoms: geo.atoms, bonds: geo.bonds, rot: C.CHAIR_ROT, w: 300, h: 210 }, o);
    opt.scale = C.chairScale(opt.w, opt.h);
    return new C.Mol3D(host, opt);
  }
  F.cadeiraAE = (h) => chair3d(h, {}, { roleColors: true, numbers: false });
  F.cadeiraMetilAx = (h) => chair3d(h, { '0u': 'CH3' }, { diaxial: ['0u'], w: 260, h: 200 });
  F.cadeiraMetilEq = (h) => chair3d(h, { '0u': 'CH3' }, { t: 1, w: 260, h: 200 });

  /* passo a passo para desenhar a cadeira (projeção 2D) */
  F.passosCadeira = (host) => {
    const P = C.chairProjected(0);
    const steps = [
      { title: '1. Duas linhas paralelas, levemente inclinadas', ring: [[1, 2], [4, 5]], ax: false, eq: false },
      { title: '2. Feche as pontas: uma para cima (direita), outra para baixo (esquerda)', ring: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0]], ax: false, eq: false, newb: [[0, 1], [5, 0], [2, 3], [3, 4]] },
      { title: '3. Axiais: verticais, para cima nos carbonos "de cima" e para baixo nos "de baixo"', ring: 'all', ax: true, eq: false },
      { title: '4. Equatoriais: paralelas às ligações do anel "uma adiante"', ring: 'all', ax: true, eq: true },
    ];
    const S = 34;
    const wrap = document.createElement('div');
    wrap.className = 'figs';
    steps.forEach((st) => {
      const fig = document.createElement('figure');
      fig.className = 'fig';
      const atoms = P.slice(0, 6).map((p) => [p[0], p[1]]);
      const bonds = [];
      const ringB = st.ring === 'all' ? [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0]] : st.ring;
      ringB.forEach((b) => bonds.push([b[0], b[1], 1, (st.newb || []).some((n) => n[0] === b[0] && n[1] === b[1]) ? { cls: 'hlb' } : {}]));
      const geo = C.chairGeom(0, {});
      const addSub = (key, cls) => {
        const m = geo.meta[key];
        const q = C.M.apply(C.CHAIR_ROT_2D, geo.atoms[m.index].p);
        atoms.push([q[0], -q[1]]);
        bonds.push([+key[0], atoms.length - 1, 1, { cls }]);
      };
      for (let k = 0; k < 6; k++) {
        ['u', 'd'].forEach((f) => {
          const role = geo.meta[k + f].role;
          if (role === 'ax' && st.ax) addSub(k + f, 'ax');
          if (role === 'eq' && st.eq) addSub(k + f, 'eq');
        });
      }
      // garante caixa constante incluindo todas as posições
      if (!st.eq || !st.ax) {
        for (let k = 0; k < 6; k++) {
          ['u', 'd'].forEach((f) => {
            const m = geo.meta[k + f];
            const role = m.role;
            if ((role === 'ax' && !st.ax) || (role === 'eq' && !st.eq)) {
              const q = C.M.apply(C.CHAIR_ROT_2D, geo.atoms[m.index].p);
              atoms.push([q[0], -q[1]]);
            }
          });
        }
      }
      fig.appendChild(sk({ atoms, bonds }, { scale: S, pad: 6 }));
      const cap = document.createElement('figcaption');
      cap.textContent = st.title;
      fig.appendChild(cap);
      fig.style.flex = '1 1 200px';
      fig.style.maxWidth = '260px';
      wrap.appendChild(fig);
    });
    host.appendChild(wrap);
  };

  /* ciclo-hexanos planos com cunha/tracejado (cis/trans) */
  function flatRing(n, subs) {
    // subs: [[índice do carbono, rótulo, 'w'|'h']]
    const pts = ringPts(n, 0, 0, n === 6 ? -90 : -90);
    const atoms = pts.map((p) => [p[0], p[1]]);
    const bonds = pts.map((_, i) => [i, (i + 1) % n]);
    subs.forEach((s) => {
      const p = pts[s[0]];
      const L = Math.hypot(p[0], p[1]);
      atoms.push([p[0] + p[0] / L * 0.95, p[1] + p[1] / L * 0.95, s[1]]);
      bonds.push([s[0], atoms.length - 1, s[2]]);
    });
    return sk({ atoms, bonds });
  }
  F.cis12 = () => flatRing(6, [[0, 'CH3', 'w'], [1, 'CH3', 'w']]);
  F.trans12 = () => flatRing(6, [[0, 'CH3', 'w'], [1, 'CH3', 'h']]);
  F.cis13 = () => flatRing(6, [[0, 'CH3', 'w'], [2, 'CH3', 'w']]);
  F.trans14 = () => flatRing(6, [[0, 'CH3', 'w'], [3, 'CH3', 'h']]);
  F.cis14 = () => flatRing(6, [[0, 'CH3', 'w'], [3, 'CH3', 'w']]);
  F.cisCiclopentano = () => flatRing(5, [[0, 'CH3', 'w'], [1, 'CH3', 'w']]);
  F.transCiclopentano = () => flatRing(5, [[0, 'CH3', 'w'], [1, 'CH3', 'h']]);

  /* cadeiras dos dissubstituídos (estáticas, mas giráveis) */
  F.trans12ee = (h) => chair3d(h, { '4u': 'CH3', '5d': 'CH3' }, { t: 1, ringRoles: true, w: 250, h: 190 });
  F.trans12aa = (h) => chair3d(h, { '4u': 'CH3', '5d': 'CH3' }, { t: 0, ringRoles: true, w: 250, h: 190 });
  F.cis12ae = (h) => chair3d(h, { '4u': 'CH3', '5u': 'CH3' }, { t: 0, ringRoles: true, w: 250, h: 190 });
  F.cis12ea = (h) => chair3d(h, { '4u': 'CH3', '5u': 'CH3' }, { t: 1, ringRoles: true, w: 250, h: 190 });
  F.tBuMe = (h) => chair3d(h, { '4u': 'C(CH3)3', '1u': 'CH3' }, { t: 1, ringRoles: true, w: 260, h: 200 });

  /* ---------------- estereoquímica ---------------- */

  // butan-2-ol e sua imagem especular (desenho v: [sup-esq, sup-dir, cunha, tracejado])
  F.butan2olA = () => stereoCenter(['CH3', 'CH2CH3', 'OH', 'H'], { prio: [3, 2, 1, 4], showDesc: true });
  F.butan2olB = () => stereoCenter(['CH2CH3', 'CH3', 'OH', 'H'], { prio: [2, 3, 1, 4], showDesc: true });
  F.butan2olRanks = () => stereoCenter(['CH3', 'CH2CH3', 'OH', 'H'], { prio: [3, 2, 1, 4], showRanks: true });

  F.alanina = () => stereoCenter(['COOH', 'CH3', 'NH2', 'H'], {});
  F.alaninaRanks = () => stereoCenter(['COOH', 'CH3', 'NH2', 'H'], { prio: [2, 3, 1, 4], showRanks: true, showDesc: true });
  F.exRS1 = () => stereoCenter(['Br', 'CH3', 'H', 'CH2CH3'], {});
  F.exRS1ranks = () => stereoCenter(['Br', 'CH3', 'H', 'CH2CH3'], { prio: [1, 3, 4, 2], showRanks: true, showDesc: true });
  F.exRS2 = () => stereoCenter(['H', 'OH', 'CH3', 'COOH'], { layout: 't' });
  F.exRS2ranks = () => stereoCenter(['H', 'OH', 'CH3', 'COOH'], { layout: 't', prio: [4, 1, 3, 2], showRanks: true, showDesc: true });

  F.estereocentros = () => {
    // butan-2-ol com asterisco
    const m = chain(4);
    branch(m, 1, -90, 'OH');
    m.atoms[1][3] = { hl: true, note: '*', nd: [0.28, 0.32] };
    return sk(m);
  };
  F.metilhexano3 = () => {
    const m = chain(6);
    branch(m, 2, 90);
    m.atoms[2][3] = { hl: true, note: '*', nd: [0.3, -0.3] };
    return sk(m);
  };
  F.metilpentano3b = () => { const m = chain(5); branch(m, 2, 90); return sk(m); };
  F.acidoLatico = () => {
    const m = chain(3);
    branch(m, 1, -90, 'OH');
    m.atoms[2][2] = 'COOH';
    m.atoms[1][3] = { hl: true, note: '*', nd: [0.3, 0.32] };
    return sk(m);
  };
  F.ibuprofeno = () => {
    const ring = ringPts(6, 0, 0, -90).map((p) => [p[0] + 2.0, p[1]]);
    const atoms = ring.map((p) => [p[0], p[1]]);
    const bonds = [[0, 1, 2, { side: 1 }], [1, 2], [2, 3, 2, { side: 1 }], [3, 4], [4, 5, 2, { side: 1 }], [5, 0]];
    // ramo esquerdo (isobutila) em C4 (índice 4: esquerda-baixo) e direito em C1 (índice 1)
    const add = (x, y, lab, from, type, opt) => { atoms.push([x, y, lab || '', opt]); bonds.push([from, atoms.length - 1, type || 1]); return atoms.length - 1; };
    const a = ring[4];
    const c1 = add(a[0] - 0.866, a[1] + 0.5, '', 4);
    const c2 = add(atoms[c1][0] - 0.866, atoms[c1][1] - 0.5, '', c1);
    add(atoms[c2][0] - 0.866, atoms[c2][1] + 0.5, '', c2);
    add(atoms[c2][0], atoms[c2][1] - 1, '', c2);
    const b = ring[1];
    const s = add(b[0] + 0.866, b[1] - 0.5, '', 1, 1, { hl: true, note: '*', nd: [0.05, 0.45] });
    add(atoms[s][0], atoms[s][1] - 1, '', s);
    add(atoms[s][0] + 0.866, atoms[s][1] + 0.5, 'COOH', s);
    return sk({ atoms, bonds });
  };

  /* Fischer */
  F.fischerPerspectiva = () => fischer({ top: 'CHO', bottom: 'CH2OH', rows: [['H', 'OH']] }, { perspective: true });
  F.fischerGliceraldeidoD = () => fischer({ top: 'CHO', bottom: 'CH2OH', rows: [['H', 'OH']], ranks: [{ r: 1, t: 2, b: 3, l: 4 }] });
  F.fischerGliceraldeidoL = () => fischer({ top: 'CHO', bottom: 'CH2OH', rows: [['HO', 'H']], ranks: [{ l: 1, t: 2, b: 3, r: 4 }] });
  F.fischerAlaninaL = () => fischer({ top: 'COOH', bottom: 'CH3', rows: [['H2N', 'H']], ranks: [{ l: 1, t: 2, b: 3, r: 4 }] });

  // 2-bromo-3-clorobutano (C2: Br > C3 > CH3 > H ; C3: Cl > C2 > CH3 > H)
  const bc = (r2, r3) => {
    // row: [esq, dir]; o halogênio tem prioridade 1 e o H, 4.
    // topIsMethyl: o vizinho de cima é o CH3 (3) e o de baixo, o outro estereocentro (2).
    const rank = (row, halo, topIsMethyl) => {
      const res = { l: row[0] === halo ? 1 : 4, r: row[1] === halo ? 1 : 4 };
      if (topIsMethyl) { res.t = 3; res.b = 2; } else { res.t = 2; res.b = 3; }
      return res;
    };
    return fischer({
      top: 'CH3', bottom: 'CH3', rows: [r2, r3],
      ranks: [rank(r2, 'Br', true), rank(r3, 'Cl', false)],
    });
  };
  F.bc1 = () => bc(['H', 'Br'], ['H', 'Cl']);
  F.bc2 = () => bc(['Br', 'H'], ['Cl', 'H']);
  F.bc3 = () => bc(['H', 'Br'], ['Cl', 'H']);
  F.bc4 = () => bc(['Br', 'H'], ['H', 'Cl']);

  // ácido tartárico (C2/C3: OH > COOH > outro C > H)
  const tart = (r2, r3) => {
    const rank = (row, topIsCOOH) => {
      const res = { l: row[0] === 'H' ? 4 : 1, r: row[1] === 'H' ? 4 : 1 };
      if (topIsCOOH) { res.t = 2; res.b = 3; } else { res.t = 3; res.b = 2; }
      return res;
    };
    return fischer({ top: 'COOH', bottom: 'COOH', rows: [r2, r3], ranks: [rank(r2, true), rank(r3, false)] });
  };
  F.tartRR = () => tart(['H', 'OH'], ['HO', 'H']);
  F.tartSS = () => tart(['HO', 'H'], ['H', 'OH']);
  F.tartMeso = () => tart(['H', 'OH'], ['H', 'OH']);
  F.tartMeso2 = () => tart(['HO', 'H'], ['HO', 'H']);

  // pentano-2,4-diol (exercício) desenhado em zigue-zague
  F.pentanodiol = () => {
    const m = chain(5);
    branch(m, 1, -90, 'OH');
    branch(m, 3, -90, 'OH');
    m.atoms[1][3] = { hl: true };
    m.atoms[3][3] = { hl: true };
    return sk(m);
  };

  /* alcenos */
  function alkene(a, b, c, d) {
    // C1=C2 horizontal; a: sup-esq, b: inf-esq, c: sup-dir, d: inf-dir
    return sk({
      atoms: [[0, 0], [1, 0], [-0.5, -0.866, a], [-0.5, 0.866, b], [1.5, -0.866, c], [1.5, 0.866, d]],
      bonds: [[0, 1, 2], [0, 2], [0, 3], [1, 4], [1, 5]],
    }, { scale: 42 });
  }
  F.cisBut2eno = () => alkene('H3C', 'H', 'CH3', 'H');
  F.transBut2eno = () => alkene('H3C', 'H', 'H', 'CH3');
  F.cisDicloro = () => alkene('Cl', 'H', 'Cl', 'H');
  F.transDicloro = () => alkene('Cl', 'H', 'H', 'Cl');
  F.cloroButenoZ = () => alkene('H3C', 'Cl', 'H', 'CH3');
  F.semIsomeria = () => alkene('H3C', 'H3C', 'H', 'CH3');
  F.metilpentenoZ = () => alkene('H3C', 'H', 'CH2CH3', 'CH3');
  F.bromoclorofluoro = () => alkene('Br', 'Cl', 'F', 'H');
  F.ezExemplo = () => alkene('Br', 'H', 'Cl', 'CH3');

  /* nomenclatura: exemplos */
  F.nome2bromobutano = () => stereoCenter(['CH3', 'CH2CH3', 'H', 'Br'], { prio: [3, 2, 4, 1], showDesc: true });

  G.FIG = F;
  G.FIGHELP = { energyPlot, buE, chair3d };
})(window);
