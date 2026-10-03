/*
 * widgets.js — laboratórios interativos. No HTML: <div data-widget="nome"></div>
 */
(function (G) {
  'use strict';
  const C = G.Chem;
  const H = G.FIGHELP;
  const W = {};

  const RT = 8.314 * 298.15 / 1000; // kJ/mol a 25 °C

  /* ---------- utilidades de DOM ---------- */

  function h(tag, attrs, ...kids) {
    const e = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        if (k === 'class') e.className = attrs[k];
        else if (k === 'html') e.innerHTML = attrs[k];
        else if (k.startsWith('on')) e.addEventListener(k.slice(2), attrs[k]);
        else if (attrs[k] !== null && attrs[k] !== undefined && attrs[k] !== false) e.setAttribute(k, attrs[k]);
      }
    }
    kids.flat().forEach((k) => { if (k !== null && k !== undefined) e.append(k.nodeType ? k : document.createTextNode(k)); });
    return e;
  }
  function lab(title, badge) {
    const body = h('div', { class: 'lab-body' });
    const root = h('div', { class: 'lab' },
      h('div', { class: 'lab-head' }, h('span', null, '🧪'), h('span', null, title), badge ? h('span', { class: 'badge' }, badge) : null),
      body);
    return { root, body };
  }
  function stat(k, v) {
    const vEl = h('div', { class: 'v' }, v || '—');
    return { el: h('div', { class: 'stat' }, h('div', { class: 'k' }, k), vEl), set: (x) => { vEl.innerHTML = x; } };
  }
  const num = (x, d) => x.toLocaleString('pt-BR', { minimumFractionDigits: d === undefined ? 1 : d, maximumFractionDigits: d === undefined ? 1 : d });
  const sub = (s) => String(s).replace(/(\d+)/g, (m, d, i, str) => (/[A-Za-z)]/.test(str[i - 1] || '') ? `<sub>${d}</sub>` : d));
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

  /* =====================================================================
   * 1. Laboratório de Newman / cavalete / energia
   * ===================================================================== */

  const NEWMAN_MOLS = {
    etano: {
      nome: 'Etano (C1–C2)', front: ['H', 'H', 'H'], back: ['H', 'H', 'H'], max: 15,
      E: (d) => 6 * (1 + Math.cos(3 * d * C.D2R)),
      presets: [[0, 'Eclipsada'], [60, 'Alternada']],
      name(d) {
        const e = Math.abs(((d % 120) + 120) % 120 - 60);
        if (e > 50) return ['Eclipsada', 'torsional (3 interações H/H eclipsadas)'];
        if (e < 10) return ['Alternada', 'nenhuma — mínimo de energia'];
        return ['Intermediária (oblíqua)', 'torsional parcial'];
      },
    },
    propano: {
      nome: 'Propano (C1–C2)', front: ['CH3', 'H', 'H'], back: ['H', 'H', 'H'], max: 15,
      E: (d) => 7 * (1 + Math.cos(3 * d * C.D2R)),
      presets: [[0, 'Eclipsada'], [60, 'Alternada']],
      name(d) {
        const e = Math.abs(((d % 120) + 120) % 120 - 60);
        if (e > 50) return ['Eclipsada', 'torsional + estérica (2 × H/H e 1 × CH₃/H)'];
        if (e < 10) return ['Alternada', 'nenhuma — mínimo de energia'];
        return ['Intermediária', 'torsional parcial'];
      },
    },
    butano: {
      nome: 'Butano (C2–C3)', front: ['CH3', 'H', 'H'], back: ['CH3', 'H', 'H'], max: 20,
      E: H.buE,
      presets: [[0, 'Sin (0°)'], [60, 'Gauche (60°)'], [120, 'Eclipsada (120°)'], [180, 'Anti (180°)']],
      name(d) {
        const x = Math.min(((d % 360) + 360) % 360, 360 - (((d % 360) + 360) % 360));
        const near = (a) => Math.abs(x - a) <= 10;
        if (near(0)) return ['Totalmente eclipsada (sinperiplanar)', 'torsional + estérica forte (CH₃/CH₃ eclipsados)'];
        if (near(60)) return ['Gauche (sinclinal)', 'estérica: CH₃ e CH₃ a 60° (≈ 3,8 kJ/mol)'];
        if (near(120)) return ['Eclipsada (anticlinal)', 'torsional + estérica (2 × CH₃/H e 1 × H/H)'];
        if (near(180)) return ['Anti (antiperiplanar)', 'nenhuma — conformação mais estável'];
        return ['Intermediária', 'mistura de tensão torsional e estérica'];
      },
    },
  };

  W.newmanLab = function (host) {
    const { root, body } = lab('Rotação em torno da ligação C–C', 'interativo');
    const sel = h('select', { 'aria-label': 'Molécula' },
      Object.entries(NEWMAN_MOLS).map(([k, m]) => h('option', { value: k }, m.nome)));
    sel.value = 'butano';
    const range = h('input', { type: 'range', min: 0, max: 360, step: 1, value: 180, 'aria-label': 'Ângulo diedro' });
    const angOut = h('span', { class: 'readout' }, '180°');
    const presetBox = h('span', { class: 'controls', style: 'margin:0' });
    const play = h('button', { class: 'btn', type: 'button' }, '▶ Girar');
    const controls = h('div', { class: 'controls' },
      h('label', null, 'Molécula ', sel), presetBox, play,
      h('div', { class: 'range-row' }, h('span', { class: 'hint' }, 'Gire o carbono de trás:'), range, angOut));
    const pNew = h('div', { class: 'panel' }, h('h4', null, 'Projeção de Newman'));
    const newHost = h('div');
    pNew.append(newHost);
    const pSaw = h('div', { class: 'panel' }, h('h4', null, 'Cavalete (arraste p/ girar)'));
    const pE = h('div', { class: 'panel', style: 'grid-column: 1 / -1' }, h('h4', null, 'Energia potencial × ângulo diedro'));
    const eHost = h('div');
    pE.append(eHost);
    const grid = h('div', { class: 'lab-grid' }, pNew, pSaw, pE);
    const sName = stat('Conformação'), sAng = stat('Ângulo diedro'), sE = stat('Energia relativa'), sT = stat('Tensões');
    body.append(controls, grid, h('div', { class: 'stats' }, sName.el, sAng.el, sE.el, sT.el),
      h('p', { class: 'hint' }, 'Dica: no butano, o ângulo diedro é medido entre os dois grupos CH₃. Use os botões para saltar para as conformações importantes. Duplo clique no cavalete restaura a vista.'));
    host.append(root);

    let mol, mol3d, plot, marker, vline, playing = false, raf = null;

    function build() {
      mol = NEWMAN_MOLS[sel.value];
      presetBox.innerHTML = '';
      mol.presets.forEach(([a, t]) => presetBox.append(h('button', { class: 'btn sm', type: 'button', onclick: () => { range.value = a; update(); } }, t)));
      // cavalete
      pSaw.querySelectorAll('svg').forEach((s) => s.remove());
      const g = C.ethaneGeom(mol.front, mol.back, 90, 90 + (+range.value), { showH: true });
      mol3d = new C.Mol3D(pSaw, { atoms: g.atoms, bonds: g.bonds, rot: C.SAWHORSE_ROT, w: 260, h: 230 });
      // gráfico
      eHost.innerHTML = '';
      plot = H.energyPlot(mol.E, { max: mol.max, w: 620, h: 230, xlabel: sel.value === 'butano' ? 'ângulo diedro CH₃–C2–C3–CH₃' : 'ângulo diedro H–C–C–H (ou CH₃–C–C–H)' });
      vline = C.el('line', { class: 'axis', 'stroke-dasharray': '3 3' }, plot.g);
      marker = C.el('circle', { r: 6, class: 'marker' }, plot.g);
      eHost.append(plot.svg);
      update();
    }

    function update() {
      const d = +range.value;
      angOut.textContent = d + '°';
      // pequeno deslocamento visual quando eclipsado para que ambos os ligantes apareçam
      const e = ((d + 60) % 120 + 120) % 120 - 60;
      const nudge = Math.abs(e) < 12 ? 9 * (1 - Math.abs(e) / 12) * (e < 0 ? -1 : 1) : 0;
      newHost.innerHTML = '';
      newHost.append(C.newman({ front: mol.front, back: mol.back, fa: 90, ba: 90 + d + nudge, hl: ['CH3'] }, { fs: 14 }));
      const g = C.ethaneGeom(mol.front, mol.back, 90, 90 + d, { showH: true });
      mol3d.set(g.atoms, g.bonds, true);
      const E = mol.E(d);
      marker.setAttribute('cx', plot.X(d)); marker.setAttribute('cy', plot.Y(E));
      vline.setAttribute('x1', plot.X(d)); vline.setAttribute('x2', plot.X(d));
      vline.setAttribute('y1', plot.Y(0)); vline.setAttribute('y2', plot.Y(mol.max));
      const [n, t] = mol.name(d);
      sName.set(n); sAng.set(d + '°'); sE.set(num(Math.max(0, E)) + ' kJ/mol'); sT.set(`<span style="font-size:.9rem;font-weight:600">${t}</span>`);
    }

    function loop() {
      range.value = (+range.value + 1) % 361;
      update();
      if (playing) raf = requestAnimationFrame(loop);
    }
    play.addEventListener('click', () => {
      playing = !playing;
      play.textContent = playing ? '❚❚ Pausar' : '▶ Girar';
      if (playing) loop(); else cancelAnimationFrame(raf);
    });
    sel.addEventListener('change', build);
    range.addEventListener('input', update);
    build();
  };

  /* =====================================================================
   * 2. Laboratório da cadeira (monossubstituído)
   * ===================================================================== */

  // custo de UMA interação 1,3-diaxial H/X (kJ/mol) — McMurry, Química Orgânica
  const A13 = {
    H: 0, CH3: 3.8, CH2CH3: 4.0, 'CH(CH3)2': 4.6, 'C(CH3)3': 11.4, C6H5: 6.3,
    OH: 2.1, F: 0.5, Cl: 1.0, Br: 1.0, CN: 0.4, COOH: 2.9,
  };
  const SUBNAMES = {
    H: 'H (ciclo-hexano)', CH3: 'CH₃ (metila)', CH2CH3: 'CH₂CH₃ (etila)', 'CH(CH3)2': 'CH(CH₃)₂ (isopropila)',
    'C(CH3)3': 'C(CH₃)₃ (terc-butila)', C6H5: 'C₆H₅ (fenila)', OH: 'OH (hidroxila)', F: 'F (flúor)',
    Cl: 'Cl (cloro)', Br: 'Br (bromo)', CN: 'CN (ciano)', COOH: 'COOH (carboxila)',
  };
  const SUBSHORT = { CH3: 'CH₃', CH2CH3: 'Et', 'CH(CH3)2': 'iPr', 'C(CH3)3': 't-Bu', C6H5: 'Ph', OH: 'OH', F: 'F', Cl: 'Cl', Br: 'Br', CN: 'CN', COOH: 'COOH', H: 'H' };
  G.A13 = A13;
  G.SUBNAMES = SUBNAMES;

  function eqPercent(dG) {
    const K = Math.exp(dG / RT);
    return { K, pct: 100 * K / (1 + K) };
  }
  G.eqPercent = eqPercent;

  W.chairLab = function (host) {
    const { root, body } = lab('A cadeira do ciclo-hexano e a interconversão', '3D');
    const sel = h('select', { 'aria-label': 'Substituinte em C1' },
      Object.keys(A13).map((k) => h('option', { value: k }, SUBNAMES[k])));
    sel.value = 'CH3';
    const flip = h('button', { class: 'btn primary', type: 'button' }, '⇄ Interconverter a cadeira');
    const cbRoles = h('input', { type: 'checkbox', checked: true });
    const cbNum = h('input', { type: 'checkbox', checked: true });
    const cbDiax = h('input', { type: 'checkbox', checked: true });
    const cbLbl = h('input', { type: 'checkbox' });
    const views = h('span', { class: 'controls', style: 'margin:0' },
      h('button', { class: 'btn sm', type: 'button', onclick: () => setView('std') }, 'Vista lateral'),
      h('button', { class: 'btn sm', type: 'button', onclick: () => setView('top') }, 'Vista de cima'),
      h('button', { class: 'btn sm', type: 'button', onclick: () => setView('newman') }, 'Ao longo de C1–C2 (Newman)'));
    body.append(
      h('div', { class: 'controls' }, h('label', null, 'Substituinte em C1: ', sel), flip),
      h('div', { class: 'controls' },
        h('label', null, cbRoles, 'cores axial/equatorial'),
        h('label', null, cbNum, 'numerar carbonos'),
        h('label', null, cbLbl, 'rotular H (a/e)'),
        h('label', null, cbDiax, 'interações 1,3-diaxiais')),
      h('div', { class: 'controls' }, h('span', { class: 'hint' }, 'Vistas:'), views));
    const stage = h('div', { class: 'panel' });
    body.append(stage);
    const legend = h('div', { class: 'legend', style: 'margin-top:8px' },
      h('span', null, h('i', { style: 'background:var(--ax)' }), 'axial'),
      h('span', null, h('i', { style: 'background:var(--eq)' }), 'equatorial'),
      h('span', null, h('i', { style: 'background:var(--accent-2)' }), 'interação 1,3-diaxial (tracejado)'));
    const sPos = stat('Substituinte está'), sDG = stat('ΔG° (axial → equatorial)'), sK = stat('K = [eq]/[ax]'), sPct = stat('% equatorial (25 °C)');
    body.append(legend, h('div', { class: 'stats' }, sPos.el, sDG.el, sK.el, sPct.el),
      h('p', { class: 'hint' }, 'Arraste o modelo para girá-lo; duplo clique restaura a vista. A animação da interconversão é ilustrativa: a molécula real passa pela meia-cadeira e pelo bote torcido.'));
    host.append(root);

    let t = 0, anim = null;
    const m3 = new C.Mol3D(stage, { w: 520, h: 330, rot: C.CHAIR_ROT, scale: C.chairScale(520, 330) });

    function geo() {
      const subs = { '0u': sel.value };
      return C.chairGeom(t, subs, {
        roleColors: cbRoles.checked, numbers: cbNum.checked, ringRoles: true,
        showHLabels: cbLbl.checked, diaxial: cbDiax.checked ? ['0u'] : null,
      });
    }
    function draw(keep) {
      const g = geo();
      m3.set(g.atoms, g.bonds, keep);
      const role = g.meta['0u'].role;
      const X = sel.value;
      const dG = 2 * A13[X];
      const { K, pct } = eqPercent(dG);
      if (X === 'H') {
        sPos.set('—'); sDG.set('0 kJ/mol'); sK.set('1'); sPct.set('50 %');
      } else {
        sPos.set(role === 'ax' ? '<span class="badge ax">axial</span>' : '<span class="badge eq">equatorial</span>');
        sDG.set(`−${num(dG)} kJ/mol <span class="hint">(2 × ${num(A13[X])})</span>`);
        sK.set(K > 1000 ? '≈ ' + Math.round(K).toLocaleString('pt-BR') : num(K, 1));
        sPct.set(num(pct, pct > 99.9 ? 2 : 1) + ' %');
      }
    }
    function setView(v) {
      let R;
      const g = geo();
      if (v === 'top') R = C.M.I();
      else if (v === 'newman') {
        // olhar ao longo de C1→C2 e girar em torno da linha de visão para deixar o eixo axial na vertical
        R = C.M.align(C.V.sub(g.atoms[1].p, g.atoms[0].p), [0, 0, -1]);
        const up = C.M.apply(R, [0, 0, 1]);
        R = C.M.mul(C.M.rz(90 - Math.atan2(up[1], up[0]) / C.D2R), R);
      } else R = C.CHAIR_ROT;
      m3.opt.scale = C.chairScale(520, 330) * (v === 'std' ? 1 : 0.8);
      m3.R0 = R;
      m3.R = R.slice();
      m3.set(g.atoms, g.bonds);
    }
    flip.addEventListener('click', () => {
      if (anim) return;
      const from = t, to = t < 0.5 ? 1 : 0, t0 = performance.now(), dur = 1300;
      const step = (now) => {
        const f = Math.min(1, (now - t0) / dur);
        t = from + (to - from) * ease(f);
        draw(true);
        if (f < 1) anim = requestAnimationFrame(step); else { anim = null; t = to; draw(true); }
      };
      anim = requestAnimationFrame(step);
    });
    [sel, cbRoles, cbNum, cbDiax, cbLbl].forEach((c) => c.addEventListener('change', () => draw(true)));
    draw(false);
  };

  /* tabela de valores 1,3-diaxiais */
  W.aValueTable = function (host) {
    const rows = Object.keys(A13).filter((k) => k !== 'H').map((k) => {
      const dG = 2 * A13[k];
      const { pct } = eqPercent(dG);
      return `<tr><td>${SUBNAMES[k]}</td><td class="num">${num(A13[k])}</td><td class="num">${num(dG)}</td><td class="num">${num(pct, pct > 99.9 ? 2 : 1)} %</td></tr>`;
    }).join('');
    host.innerHTML = `<div class="table-wrap"><table>
      <thead><tr><th>Substituinte (Y)</th><th class="num">1 interação H/Y (kJ/mol)</th><th class="num">ΔG° = 2 × (kJ/mol)</th><th class="num">% equatorial a 25 °C</th></tr></thead>
      <tbody>${rows}</tbody></table></div>`;
  };

  /* =====================================================================
   * 3. Laboratório de ciclo-hexanos dissubstituídos
   * ===================================================================== */

  function disubEnergy(pos, X, Y, rX, rY) {
    const parts = [];
    let E = 0;
    const both13 = pos === 3 && rX === 'ax' && rY === 'ax' && X !== 'H' && Y !== 'H';
    if (both13) {
      E += A13[X] + A13[Y] + 15.4;
      parts.push(`${SUBSHORT[X]} e ${SUBSHORT[Y]} axiais do mesmo lado: 1,3-diaxial ${SUBSHORT[X]}/${SUBSHORT[Y]} (≈ 15,4) + ${SUBSHORT[X]}/H (${num(A13[X])}) + ${SUBSHORT[Y]}/H (${num(A13[Y])})`);
    } else {
      if (rX === 'ax' && X !== 'H') { E += 2 * A13[X]; parts.push(`${SUBSHORT[X]} axial: 2 × ${num(A13[X])} = ${num(2 * A13[X])}`); }
      if (rY === 'ax' && Y !== 'H') { E += 2 * A13[Y]; parts.push(`${SUBSHORT[Y]} axial: 2 × ${num(A13[Y])} = ${num(2 * A13[Y])}`); }
    }
    if (pos === 2 && X !== 'H' && Y !== 'H' && !(rX === 'ax' && rY === 'ax')) {
      E += 3.8;
      parts.push(`interação gauche ${SUBSHORT[X]}/${SUBSHORT[Y]} entre carbonos vizinhos (≈ 3,8)`);
    }
    if (!parts.length) parts.push('nenhuma interação significativa');
    return { E, parts };
  }
  G.disubEnergy = disubEnergy;

  W.disubLab = function (host) {
    const { root, body } = lab('Ciclo-hexanos dissubstituídos: qual cadeira é mais estável?', '3D');
    const opts = Object.keys(A13).filter((k) => k !== 'H').map((k) => h('option', { value: k }, SUBNAMES[k]));
    const sPos = h('select', null, h('option', { value: 2 }, '1,2'), h('option', { value: 3 }, '1,3'), h('option', { value: 4 }, '1,4'));
    const sRel = h('select', null, h('option', { value: 'cis' }, 'cis'), h('option', { value: 'trans' }, 'trans'));
    const sX = h('select', null, opts.map((o) => o.cloneNode(true)));
    const sY = h('select', null, opts.map((o) => o.cloneNode(true)));
    sX.value = 'CH3'; sY.value = 'CH3'; sRel.value = 'trans';
    body.append(h('div', { class: 'controls' },
      h('label', null, 'Relação ', sRel), h('label', null, 'Posições ', sPos),
      h('label', null, 'Grupo em C1 ', sX), h('label', null, 'Grupo no outro carbono ', sY)));
    const pA = h('div', { class: 'panel' }, h('h4', null, 'Cadeira A'));
    const pB = h('div', { class: 'panel' }, h('h4', null, 'Cadeira B (após interconversão)'));
    const iA = h('div', { class: 'hint' }), iB = h('div', { class: 'hint' });
    const verdict = h('div', { class: 'verdict' });
    body.append(h('div', { class: 'lab-grid' }, pA, pB), verdict,
      h('p', { class: 'hint' }, 'Contorno vermelho = axial; azul = equatorial. As energias são estimativas por aditividade (valores de interações 1,3-diaxiais e gauche); servem para comparar as duas cadeiras.'));
    host.append(root);
    const mA = new C.Mol3D(pA, { w: 300, h: 220, rot: C.CHAIR_ROT, scale: C.chairScale(300, 220) });
    const mB = new C.Mol3D(pB, { w: 300, h: 220, rot: C.CHAIR_ROT, scale: C.chairScale(300, 220) });
    pA.append(iA); pB.append(iB);

    function update() {
      const pos = +sPos.value, X = sX.value, Y = sY.value;
      // C1 é desenhado no carbono 4 do modelo (frente, à esquerda) para que os grupos não se sobreponham
      const k2 = (4 + pos - 1) % 6;
      const subs = { '4u': X };
      const yKey = k2 + (sRel.value === 'cis' ? 'u' : 'd');
      subs[yKey] = Y;
      const res = [0, 1].map((t, i) => {
        const g = C.chairGeom(t, subs, { ringRoles: true, numbers: true, numOffset: 4 });
        (i === 0 ? mA : mB).set(g.atoms, g.bonds);
        const rX = g.meta['4u'].role, rY = g.meta[yKey].role;
        const en = disubEnergy(pos, X, Y, rX, rY);
        const rname = (r) => (r === 'ax' ? '<b style="color:var(--ax)">axial</b>' : '<b style="color:var(--eq)">equatorial</b>');
        (i === 0 ? iA : iB).innerHTML = `<p>C1 (${SUBSHORT[X]}): ${rname(rX)} · C${pos} (${SUBSHORT[Y]}): ${rname(rY)}</p>
          <p style="margin:4px 0">Tensão estimada: <b>${num(en.E)} kJ/mol</b></p><ul style="margin:4px 0 0;padding-left:18px">${en.parts.map((p) => `<li>${p}</li>`).join('')}</ul>`;
        return en.E;
      });
      const d = res[0] - res[1];
      const name = `${sRel.value}-1,${pos} (C1: ${SUBSHORT[X]}; C${pos}: ${SUBSHORT[Y]})`;
      if (Math.abs(d) < 0.05) {
        verdict.className = 'verdict neutral';
        verdict.innerHTML = `<b>${name}:</b> as duas cadeiras têm a mesma energia estimada → ≈ 50 : 50 no equilíbrio.`;
      } else {
        const best = d > 0 ? 'B' : 'A';
        const { pct } = eqPercent(Math.abs(d));
        verdict.className = 'verdict';
        verdict.innerHTML = `<b>${name}:</b> a cadeira <b>${best}</b> é mais estável por ≈ ${num(Math.abs(d))} kJ/mol → cerca de <b>${num(pct, pct > 99.9 ? 2 : 1)} %</b> das moléculas nessa conformação a 25 °C.`;
      }
    }
    [sPos, sRel, sX, sY].forEach((s) => s.addEventListener('change', update));
    update();
  };

  /* =====================================================================
   * 4. Objeto × imagem especular (quiralidade)
   * ===================================================================== */

  const CHIRAL_MOLS = {
    butan2ol: { nome: 'butan-2-ol', g: ['OH', 'CH2CH3', 'CH3', 'H'], quiral: true },
    alanina: { nome: 'alanina', g: ['NH2', 'COOH', 'CH3', 'H'], quiral: true },
    glic: { nome: 'gliceraldeído', g: ['OH', 'CHO', 'CH2OH', 'H'], quiral: true },
    bcf: { nome: 'bromoclorofluorometano', g: ['Br', 'Cl', 'F', 'H'], quiral: true },
    lactico: { nome: 'ácido lático', g: ['OH', 'COOH', 'CH3', 'H'], quiral: true },
    propan2ol: { nome: 'propan-2-ol (aquiral)', g: ['OH', 'CH3', 'CH3', 'H'], quiral: false },
    diclorometano: { nome: 'diclorometano (aquiral)', g: ['Cl', 'Cl', 'H', 'H'], quiral: false },
  };
  G.CHIRAL_MOLS = CHIRAL_MOLS;

  // ordem de colocação nos vértices do tetraedro (para variar o desenho)
  const PLACE = [1, 0, 2, 3];

  function placedLabels(m) {
    const out = [];
    PLACE.forEach((gi, vi) => { out[vi] = m.g[gi]; });
    return out;
  }
  function descr3D(m, mirror) {
    if (!m.quiral) return null;
    const v = [];
    PLACE.forEach((gi, vi) => {
      const t = C.TETRA[vi];
      v[gi] = mirror ? [-t[0], t[1], t[2]] : t;
    });
    return C.chirality(v[0], v[1], v[2], v[3]);
  }

  W.mirrorLab = function (host) {
    const { root, body } = lab('Objeto e imagem especular: são superponíveis?', '3D');
    const sel = h('select', null, Object.entries(CHIRAL_MOLS).map(([k, m]) => h('option', { value: k }, m.nome)));
    const sync = h('input', { type: 'checkbox' });
    const showRS = h('input', { type: 'checkbox' });
    const rot = h('button', { class: 'btn', type: 'button' }, '↻ Girar a imagem 180°');
    const reset = h('button', { class: 'btn', type: 'button' }, 'Restaurar vistas');
    body.append(h('div', { class: 'controls' }, h('label', null, 'Molécula ', sel), rot, reset,
      h('label', null, sync, 'girar os dois juntos'), h('label', null, showRS, 'mostrar R/S')));
    const pL = h('div', { class: 'panel' }, h('h4', null, 'Molécula'));
    const pR = h('div', { class: 'panel' }, h('h4', null, 'Imagem especular'));
    const capL = h('div', { class: 'hint', style: 'text-align:center' }), capR = h('div', { class: 'hint', style: 'text-align:center' });
    const msg = h('div', { class: 'verdict neutral' });
    body.append(h('div', { class: 'lab-grid' }, pL, pR), msg,
      h('p', { class: 'hint' }, 'Arraste cada modelo para tentar sobrepor um ao outro (mesma posição de todas as cores). Para moléculas quirais isso é impossível.'));
    host.append(root);
    let busy = false;
    const R0 = C.M.mul(C.M.rx(12), C.M.ry(-20));
    const mL = new C.Mol3D(pL, { w: 260, h: 230, rot: R0, onRotate: (m) => mirrorSync(m, mR) });
    const mR = new C.Mol3D(pR, { w: 260, h: 230, rot: C.M.mul(C.M.rx(12), C.M.ry(20)), onRotate: (m) => mirrorSync(m, mL) });
    pL.append(capL); pR.append(capR);
    function mirrorSync(src, dst) {
      if (!sync.checked || busy) return;
      busy = true;
      // reflexão em x: S R S
      const S = [-1, 0, 0, 0, 1, 0, 0, 0, 1];
      dst.setRot(C.M.mul(C.M.mul(S, src.R), S));
      busy = false;
    }
    function update() {
      const m = CHIRAL_MOLS[sel.value];
      const labs = placedLabels(m);
      const a = C.centerGeom(labs), b = C.centerGeom(labs, { mirror: true });
      mL.set(a.atoms, a.bonds); mR.set(b.atoms, b.bonds);
      const dl = descr3D(m, false), dr = descr3D(m, true);
      capL.innerHTML = showRS.checked && dl ? `configuração <b>${dl}</b>` : '&nbsp;';
      capR.innerHTML = showRS.checked && dr ? `configuração <b>${dr}</b>` : '&nbsp;';
      msg.innerHTML = m.quiral
        ? `<b>${m.nome}</b> tem um carbono ligado a <b>quatro grupos diferentes</b> (estereocentro). A molécula e sua imagem especular <b>não são superponíveis</b>: são <b>enantiômeros</b>.`
        : `<b>${m.nome}</b> tem dois ligantes iguais no carbono central e, portanto, um <b>plano de simetria</b>. Gire a imagem 180° e veja: ela é <b>superponível</b> ao original — é a mesma molécula (aquiral).`;
    }
    rot.addEventListener('click', () => {
      const start = mR.R.slice(), t0 = performance.now();
      const step = (now) => {
        const f = Math.min(1, (now - t0) / 700);
        mR.setRot(C.M.mul(C.M.ry(180 * ease(f)), start));
        if (f < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
    reset.addEventListener('click', () => { mL.reset(); mR.reset(); });
    sel.addEventListener('change', update);
    showRS.addEventListener('change', update);
    update();
  };

  /* =====================================================================
   * 5. R/S em 3D: orientar o grupo de menor prioridade para trás
   * ===================================================================== */

  W.rs3dLab = function (host) {
    const { root, body } = lab('Atribuindo R/S no modelo 3D', '3D');
    const chiral = Object.entries(CHIRAL_MOLS).filter(([, m]) => m.quiral);
    const sel = h('select', null, chiral.map(([k, m]) => h('option', { value: k }, m.nome)));
    const mir = h('select', null, h('option', { value: '0' }, 'enantiômero 1'), h('option', { value: '1' }, 'enantiômero 2'));
    const bRank = h('button', { class: 'btn', type: 'button', 'aria-pressed': 'false' }, '① Mostrar prioridades');
    const bOrient = h('button', { class: 'btn primary', type: 'button' }, '② Grupo 4 para trás');
    const bArrow = h('button', { class: 'btn', type: 'button', 'aria-pressed': 'false' }, '③ Traçar 1 → 2 → 3');
    body.append(h('div', { class: 'controls' }, h('label', null, 'Molécula ', sel), mir),
      h('div', { class: 'controls' }, bRank, bOrient, bArrow));
    const panel = h('div', { class: 'panel' });
    const out = h('div', { class: 'verdict neutral' }, 'Siga os passos ①, ② e ③.');
    body.append(panel, out);
    host.append(root);

    let showRanks = false, showArrow = false, cur = null;
    const m3 = new C.Mol3D(panel, {
      w: 420, h: 300, rot: C.M.mul(C.M.rx(20), C.M.ry(30)),
      onRender: (m) => overlay(m),
    });
    // marcador de seta
    const mk = C.el('marker', { id: m3.id + 'arr', viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse' }, m3.defs);
    C.el('path', { d: 'M0,0 L10,5 L0,10 z', class: 'arrowhead' }, mk);

    function overlay(m) {
      const g = m.over;
      while (g.firstChild) g.removeChild(g.firstChild);
      if (!cur) return;
      const P = m.P;
      const c = P[0];
      if (showRanks) {
        cur.prio.forEach((r, vi) => {
          const p = P[vi + 1];
          const dx = p.x - c.x, dy = p.y - c.y, L = Math.hypot(dx, dy) || 1;
          const rr = (m.atoms[vi + 1].r || 0.4) * m.scale + 11;
          C.el('circle', { cx: p.x + dx / L * rr, cy: p.y + dy / L * rr, r: 9, fill: 'var(--accent)' }, g);
          C.chemText(g, p.x + dx / L * rr, p.y + dy / L * rr, String(r), { 'font-size': 11, fill: '#fff', 'font-weight': 700, class: 'l3' });
        });
      }
      if (showArrow) {
        const idx = [1, 2, 3].map((r) => cur.prio.indexOf(r) + 1);
        const pts = idx.map((i) => P[i]);
        for (let k = 0; k < 2; k++) {
          const a = pts[k], b = pts[k + 1];
          const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
          const vx = mx - c.x, vy = my - c.y, L = Math.hypot(vx, vy) || 1;
          const cx = mx + vx / L * 40, cy = my + vy / L * 40;
          const shrink = (p, q, d) => { const ux = q.x - p.x, uy = q.y - p.y, l = Math.hypot(ux, uy) || 1; return { x: p.x + ux / l * d, y: p.y + uy / l * d }; };
          const s = shrink(a, { x: cx, y: cy }, 22), e = shrink(b, { x: cx, y: cy }, 22);
          C.el('path', { d: `M${s.x},${s.y} Q${cx},${cy} ${e.x},${e.y}`, class: 'arrow', 'marker-end': `url(#${m.id}arr)` }, g);
        }
      }
    }

    function build() {
      const m = CHIRAL_MOLS[sel.value];
      const mirror = mir.value === '1';
      const labs = placedLabels(m);
      const prio = labs.map((l, vi) => PLACE[vi] + 1);
      // prioridades: m.g já está em ordem decrescente → índice + 1
      cur = { prio, mirror, d: descr3D(m, mirror), m };
      const g = C.centerGeom(labs, { mirror });
      showArrow = false; bArrow.setAttribute('aria-pressed', 'false');
      m3.set(g.atoms, g.bonds);
      out.innerHTML = `Prioridades: ${m.g.map((x, i) => `<b>${i + 1}</b> = ${sub(x)}`).join(' · ')}. Agora oriente o grupo 4 (${sub(m.g[3])}) para longe de você.`;
    }
    function orient() {
      const vi = cur.prio.indexOf(4) + 1;
      const v = C.M.apply(m3.R, m3.atoms[vi].p);
      const T = C.M.align(v, [0.0, 0.25, -1]);
      const start = m3.R.slice();
      const ax = C.V.cross(C.V.norm(v), C.V.norm([0, 0.25, -1]));
      const ang = Math.acos(Math.max(-1, Math.min(1, C.V.dot(C.V.norm(v), C.V.norm([0, 0.25, -1])))));
      const t0 = performance.now();
      const step = (now) => {
        const f = Math.min(1, (now - t0) / 800);
        const Rk = C.V.len(ax) < 1e-6 ? T : C.M.axis(ax, ang * ease(f));
        m3.setRot(C.M.mul(Rk, start));
        if (f < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
    bRank.addEventListener('click', () => { showRanks = !showRanks; bRank.setAttribute('aria-pressed', showRanks); m3.render(); });
    bOrient.addEventListener('click', orient);
    bArrow.addEventListener('click', () => {
      showArrow = !showArrow;
      bArrow.setAttribute('aria-pressed', showArrow);
      m3.render();
      if (showArrow) {
        // sentido visto pelo observador (grupo 4 deve estar para trás)
        const vi4 = cur.prio.indexOf(4) + 1;
        const back = C.M.apply(m3.R, m3.atoms[vi4].p)[2] < -0.3;
        const P = [1, 2, 3].map((r) => C.M.apply(m3.R, m3.atoms[cur.prio.indexOf(r) + 1].p));
        const z = C.V.cross(C.V.sub(P[1], P[0]), C.V.sub(P[2], P[1]))[2];
        const sentido = z < 0 ? 'horário' : 'anti-horário';
        const lido = z < 0 ? 'R' : 'S';
        out.innerHTML = back
          ? `Com o grupo 4 para trás, 1 → 2 → 3 gira no sentido <b>${sentido}</b> → configuração <b>${lido}</b>.`
          : `O caminho 1 → 2 → 3 parece <b>${sentido}</b>, mas o grupo 4 <b>não</b> está para trás nesta vista. Use o passo ② antes (ou inverta a leitura se o grupo 4 estiver apontando para você). Resposta correta: <b>${cur.d}</b>.`;
      }
    });
    sel.addEventListener('change', build);
    mir.addEventListener('change', build);
    build();
  };

  /* =====================================================================
   * 6. Treinadores R/S (cunha) e Fischer
   * ===================================================================== */

  const RS_SETS = [
    { nome: '1-bromo-1-cloroetano', g: ['Br', 'Cl', 'CH3', 'H'], why: 'Br (Z = 35) > Cl (Z = 17) > C de CH₃ (Z = 6) > H (Z = 1).' },
    { nome: 'butan-2-ol', g: ['OH', 'CH2CH3', 'CH3', 'H'], why: 'O > C; entre os carbonos, CH₂CH₃ tem (C,H,H) e CH₃ tem (H,H,H) → etila vence.' },
    { nome: 'alanina', g: ['NH2', 'COOH', 'CH3', 'H'], why: 'N > C; COOH tem (O,O,O) contra (H,H,H) do CH₃.' },
    { nome: 'gliceraldeído', g: ['OH', 'CHO', 'CH2OH', 'H'], why: 'O > C; CHO conta como (O,O,H) por duplicação da ligação C=O, contra (O,H,H) do CH₂OH.' },
    { nome: 'ácido lático', g: ['OH', 'COOH', 'CH3', 'H'], why: 'O > C; COOH (O,O,O) > CH₃ (H,H,H).' },
    { nome: '1-bromoetanol', g: ['Br', 'OH', 'CH3', 'H'], why: 'Br (35) > O (8) > C (6) > H (1).' },
    { nome: 'pent-1-en-3-ol', g: ['OH', 'CH=CH2', 'CH2CH3', 'H'], why: 'O primeiro; vinila CH=CH₂ conta como (C,C,H) e etila como (C,H,H).' },
    { nome: '3-cloro-2-metilpentano', g: ['Cl', 'CH(CH3)2', 'CH2CH3', 'H'], why: 'Cl primeiro; isopropila (C,C,H) > etila (C,H,H).' },
    { nome: '3-metilpent-1-en-4-ino', g: ['C≡CH', 'CH=CH2', 'CH3', 'H'], why: 'Etinila conta como (C,C,C), vinila como (C,C,H) e metila como (H,H,H).' },
    { nome: 'etanol-1-d', g: ['OH', 'CH3', 'D', 'H'], why: 'O > C > D > H — o deutério (massa 2) tem prioridade sobre o hidrogênio comum (massa 1).' },
    { nome: '1-feniletan-1-amina', g: ['NH2', 'C6H5', 'CH3', 'H'], why: 'N > C; fenila (C,C,C) > metila (H,H,H).' },
    { nome: '1-bromo-3-cloro-2-metilpropano', g: ['CH2Br', 'CH2Cl', 'CH3', 'H'], why: 'Os três ligantes de carbono empatam no 1º átomo; no 2º nível: (Br,H,H) > (Cl,H,H) > (H,H,H).' },
    { nome: '2-metil-hexan-3-ol', g: ['OH', 'CH(CH3)2', 'CH2CH2CH3', 'H'], why: 'O primeiro; isopropila (C,C,H) > propila (C,H,H).' },
    { nome: '2-cloro-2,3-dimetilbutan-1-ol', g: ['Cl', 'CH2OH', 'CH(CH3)2', 'CH3'], why: 'Cl primeiro; CH₂OH (O,H,H) > CH(CH₃)₂ (C,C,H) porque O > C no primeiro ponto de diferença; CH₃ (H,H,H) por último.' },
  ];
  G.RS_SETS = RS_SETS;

  function trainerShell(title, badge) {
    const { root, body } = lab(title, badge);
    const score = h('span', { class: 'badge ok' }, '0 / 0');
    const stage = h('div', { class: 'trainer-stage' });
    const name = h('div', { class: 'hint', style: 'text-align:center' });
    const ans = h('div', { class: 'trainer-answer' });
    const fb = h('div', { class: 'feedback' });
    const next = h('button', { class: 'btn', type: 'button' }, 'Próxima molécula →');
    body.append(h('div', { class: 'controls', style: 'justify-content:space-between' }, h('span', { class: 'hint' }, 'Acertos: ', score), next),
      h('div', { class: 'panel' }, stage, name), ans, fb);
    return { root, body, score, stage, name, ans, fb, next };
  }

  W.rsTrainer = function (host) {
    const T = trainerShell('Treino: R ou S? (cunhas e tracejados)', 'ilimitado');
    host.append(T.root);
    let ok = 0, tot = 0, cur = null;
    function newQ() {
      const set = pick(RS_SETS);
      const layout = pick(['v', 't']);
      const order = shuffle([0, 1, 2, 3]); // order[pos] = índice do grupo (prioridade − 1)
      const labels = order.map((gi) => set.g[gi]);
      const prio = order.map((gi) => gi + 1);
      cur = { set, layout, labels, prio, answer: C.descriptorFor(prio, layout), done: false };
      T.stage.innerHTML = '';
      T.stage.append(C.stereoCenter(labels, { layout, fs: 16 }));
      T.name.textContent = set.nome;
      T.fb.className = 'feedback';
      T.ans.innerHTML = '';
      ['R', 'S'].forEach((x) => T.ans.append(h('button', { class: 'btn', type: 'button', onclick: () => answer(x) }, x)));
    }
    function answer(x) {
      if (cur.done) return;
      cur.done = true; tot++;
      const right = x === cur.answer;
      if (right) ok++;
      T.score.textContent = `${ok} / ${tot}`;
      T.stage.innerHTML = '';
      T.stage.append(C.stereoCenter(cur.labels, { layout: cur.layout, fs: 16, prio: cur.prio, showRanks: true, showDesc: true }));
      const types = C.STEREO_LAYOUTS[cur.layout].types;
      const pos4 = cur.prio.indexOf(4);
      const t4 = types[pos4];
      const how = t4 === 'h'
        ? 'O grupo 4 está no <b>tracejado</b> (para trás): o sentido 1 → 2 → 3 é lido diretamente.'
        : t4 === 'w'
          ? 'O grupo 4 está na <b>cunha</b> (para a frente): leia o sentido 1 → 2 → 3 e <b>inverta</b> a resposta.'
          : 'O grupo 4 está <b>no plano</b>: troque-o mentalmente com o grupo do tracejado (isso inverte a configuração), leia o sentido e inverta de volta — ou gire a molécula.';
      T.fb.className = 'feedback show ' + (right ? 'ok' : 'bad');
      T.fb.innerHTML = `<b>${right ? '✔ Correto!' : '✘ Não foi dessa vez.'} A configuração é ${cur.answer}.</b>
        Prioridades: ${cur.set.why}<br>${how}`;
      [...T.ans.children].forEach((b) => {
        b.disabled = true;
        if (b.textContent === cur.answer) b.classList.add('primary');
      });
    }
    T.next.addEventListener('click', newQ);
    newQ();
  };

  W.fischerTrainer = function (host) {
    const T = trainerShell('Treino: R ou S na projeção de Fischer', 'ilimitado');
    host.append(T.root);
    let ok = 0, tot = 0, cur = null;
    const POS = ['t', 'b', 'l', 'r'];
    function draw(withRanks) {
      const lab = {};
      POS.forEach((p, i) => { lab[p] = cur.labels[i]; });
      const left = lab.l === 'OH' ? 'HO' : lab.l === 'NH2' ? 'H2N' : lab.l === 'CH3' ? 'H3C' : lab.l === 'CH2CH3' ? 'H3CH2C' : lab.l;
      const f = { top: lab.t, bottom: lab.b, rows: [[left, lab.r]] };
      if (withRanks) {
        const rk = {};
        POS.forEach((p, i) => { rk[p] = cur.prio[i]; });
        f.ranks = [rk];
        f.top = `${lab.t} (${rk.t})`; f.bottom = `${lab.b} (${rk.b})`;
        f.rows = [[`(${rk.l}) ${left}`, `${lab.r} (${rk.r})`]];
      }
      T.stage.innerHTML = '';
      T.stage.append(C.fischer(f, { fs: 16, arm: 48 }));
    }
    function newQ() {
      const set = pick(RS_SETS.filter((s) => s.g.length === 4));
      const order = shuffle([0, 1, 2, 3]);
      cur = { set, labels: order.map((gi) => set.g[gi]), prio: order.map((gi) => gi + 1), done: false };
      const rk = {};
      POS.forEach((p, i) => { rk[p] = cur.prio[i]; });
      cur.answer = C.fischerDescriptor(rk);
      cur.pos4 = POS[cur.prio.indexOf(4)];
      draw(false);
      T.name.textContent = set.nome;
      T.fb.className = 'feedback';
      T.ans.innerHTML = '';
      ['R', 'S'].forEach((x) => T.ans.append(h('button', { class: 'btn', type: 'button', onclick: () => answer(x) }, x)));
    }
    function answer(x) {
      if (cur.done) return;
      cur.done = true; tot++;
      const right = x === cur.answer;
      if (right) ok++;
      T.score.textContent = `${ok} / ${tot}`;
      draw(true);
      const vertical = cur.pos4 === 't' || cur.pos4 === 'b';
      T.fb.className = 'feedback show ' + (right ? 'ok' : 'bad');
      T.fb.innerHTML = `<b>${right ? '✔ Correto!' : '✘ Não foi dessa vez.'} A configuração é ${cur.answer}.</b>
        Prioridades (entre parênteses): ${cur.set.why}<br>
        ${vertical ? 'O grupo 4 está na <b>vertical</b> (aponta para trás): leia 1 → 2 → 3 diretamente.' : 'O grupo 4 está na <b>horizontal</b> (aponta para você): leia 1 → 2 → 3 e <b>inverta</b>.'}`;
      [...T.ans.children].forEach((b) => { b.disabled = true; if (b.textContent === cur.answer) b.classList.add('primary'); });
    }
    T.next.addEventListener('click', newQ);
    newQ();
  };

  /* =====================================================================
   * 7. Polarímetro e excesso enantiomérico
   * ===================================================================== */

  W.polarimeter = function (host) {
    const { root, body } = lab('Polarímetro: rotação óptica e excesso enantiomérico', 'interativo');
    const range = h('input', { type: 'range', min: 0, max: 100, value: 75, step: 1 });
    const pctOut = h('span', { class: 'readout' });
    body.append(h('p', { class: 'hint', style: 'margin-top:0' }, 'Amostra de butan-2-ol. Rotação específica do enantiômero (S) puro: [α]D = +13,5°; do (R) puro: −13,5°.'),
      h('div', { class: 'controls' }, h('div', { class: 'range-row' }, h('span', null, '% de (S):'), range, pctOut)));
    const vis = h('div', { class: 'panel', style: 'display:flex;justify-content:center' });
    const sS = stat('Composição'), sEE = stat('Excesso enantiomérico'), sA = stat('[α] observada'), sN = stat('Classificação');
    body.append(vis, h('div', { class: 'stats' }, sS.el, sEE.el, sA.el, sN.el));
    host.append(root);
    const svg = C.makeSVG(300, 170, 'polar', 'Plano da luz polarizada');
    const g = C.el('g', null, svg);
    C.el('circle', { cx: 150, cy: 85, r: 64, class: 'grid', fill: 'none', 'stroke-width': 2 }, g);
    C.el('line', { x1: 150, y1: 15, x2: 150, y2: 155, class: 'axis', 'stroke-dasharray': '4 4' }, g);
    const beam = C.el('line', { x1: 150, y1: 25, x2: 150, y2: 145, class: 'arrow', 'stroke-width': 4 }, g);
    const txt = C.el('text', { x: 150, y: 166, 'text-anchor': 'middle', class: 'small' }, g);
    C.chemText(g, 34, 20, 'luz incidente: vertical', { class: 'small', 'text-anchor': 'start' });
    vis.append(svg);
    function update() {
      const s = +range.value;
      const ee = Math.abs(2 * s - 100);
      const a = 13.5 * (2 * s - 100) / 100;
      pctOut.textContent = s + ' %';
      sS.set(`${s}% S · ${100 - s}% R`);
      sEE.set(num(ee, 0) + ' %');
      sA.set((a > 0 ? '+' : a < 0 ? '−' : '') + num(Math.abs(a), 2) + '°');
      sN.set(s === 50 ? 'racêmica (±)' : s === 100 || s === 0 ? 'enantiomericamente pura' : 'enriquecida em ' + (s > 50 ? 'S' : 'R'));
      // ampliado 4× para visualização
      beam.setAttribute('transform', `rotate(${a * 4} 150 85)`);
      txt.textContent = a === 0 ? 'sem rotação' : (a > 0 ? 'dextrorrotatória (+): sentido horário' : 'levorrotatória (−): sentido anti-horário');
    }
    range.addEventListener('input', update);
    update();
  };

  G.WIDGETS = W;
  G.UI = { h, num, sub, shuffle, pick };
})(window);
