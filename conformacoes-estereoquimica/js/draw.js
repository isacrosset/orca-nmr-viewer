/*
 * draw.js — biblioteca mínima de desenho químico em SVG.
 *   - fórmulas de esqueleto (com cunhas e tracejados)
 *   - projeções de Newman e de Fischer
 *   - modelos 3D (bola-e-vareta) giráveis com o mouse/toque
 *   - geometrias: etano/butano (cavalete) e ciclo-hexano em cadeira
 */
(function (G) {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const D2R = Math.PI / 180;
  let UID = 0;

  const fmt = (n) => Math.round(n * 100) / 100;

  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    if (attrs) {
      for (const k in attrs) {
        const v = attrs[k];
        if (v !== null && v !== undefined) e.setAttribute(k, v);
      }
    }
    if (parent) parent.appendChild(e);
    return e;
  }

  function makeSVG(w, h, cls, title) {
    const s = el('svg', {
      viewBox: `0 0 ${fmt(w)} ${fmt(h)}`,
      class: 'chem' + (cls ? ' ' + cls : ''),
      role: 'img',
    });
    s.style.maxWidth = Math.ceil(w) + 'px';
    if (title) el('title', null, s).textContent = title;
    return s;
  }

  /* ---------- rótulos com subscritos (CH3 → CH₃) ---------- */

  function labelTokens(label) {
    const out = [];
    const re = /\d+|[^\d]+/g;
    let m;
    let prev = '';
    while ((m = re.exec(label))) {
      const s = m[0];
      const isDigit = /^\d/.test(s);
      out.push({ s, sub: isDigit && /[A-Za-z)\]]$/.test(prev) });
      prev = s;
    }
    return out;
  }

  function labelWidth(label, fs) {
    let w = 0;
    for (const t of labelTokens(String(label))) w += t.s.length * fs * (t.sub ? 0.46 : 0.64);
    return w;
  }

  function chemText(parent, x, y, label, attrs) {
    const t = el('text', Object.assign({
      x: fmt(x), y: fmt(y), 'text-anchor': 'middle', 'dominant-baseline': 'central',
    }, attrs || {}), parent);
    let shifted = false;
    for (const tok of labelTokens(String(label))) {
      if (tok.sub) {
        el('tspan', { dy: '0.32em', 'font-size': '72%' }, t).textContent = tok.s;
        shifted = true;
      } else {
        el('tspan', shifted ? { dy: '-0.32em' } : null, t).textContent = tok.s;
        shifted = false;
      }
    }
    return t;
  }

  /* ---------- vetores ---------- */

  const V = {
    add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
    sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
    mul: (a, k) => [a[0] * k, a[1] * k, a[2] * k],
    dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
    len: (a) => Math.hypot(a[0], a[1], a[2]),
    norm: (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
    lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t],
  };

  /**
   * Descritor CIP a partir dos vetores (centro → ligante) dos ligantes de
   * prioridade 1, 2, 3 e 4. Convenção: x para a direita, y para cima,
   * z apontando para o observador.
   */
  function chirality(v1, v2, v3, v4) {
    const a = V.sub(v1, v4), b = V.sub(v2, v4), c = V.sub(v3, v4);
    return V.dot(a, V.cross(b, c)) < 0 ? 'R' : 'S';
  }

  /* ---------- matrizes 3x3 ---------- */

  const M = {
    I: () => [1, 0, 0, 0, 1, 0, 0, 0, 1],
    mul(a, b) {
      const r = new Array(9);
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          r[i * 3 + j] = a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j];
        }
      }
      return r;
    },
    apply: (m, p) => [
      m[0] * p[0] + m[1] * p[1] + m[2] * p[2],
      m[3] * p[0] + m[4] * p[1] + m[5] * p[2],
      m[6] * p[0] + m[7] * p[1] + m[8] * p[2],
    ],
    rx(deg) { const a = deg * D2R, c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, c, -s, 0, s, c]; },
    ry(deg) { const a = deg * D2R, c = Math.cos(a), s = Math.sin(a); return [c, 0, s, 0, 1, 0, -s, 0, c]; },
    rz(deg) { const a = deg * D2R, c = Math.cos(a), s = Math.sin(a); return [c, -s, 0, s, c, 0, 0, 0, 1]; },
    /* rotação (Rodrigues) em torno do eixo u por ang (rad) */
    axis(u, ang) {
      const [x, y, z] = V.norm(u), c = Math.cos(ang), s = Math.sin(ang), t = 1 - c;
      return [
        t * x * x + c, t * x * y - s * z, t * x * z + s * y,
        t * x * y + s * z, t * y * y + c, t * y * z - s * x,
        t * x * z - s * y, t * y * z + s * x, t * z * z + c,
      ];
    },
    /* matriz que leva o vetor v para a direção alvo */
    align(v, target) {
      const a = V.norm(v), b = V.norm(target);
      const d = Math.max(-1, Math.min(1, V.dot(a, b)));
      let ax = V.cross(a, b);
      if (V.len(ax) < 1e-6) {
        if (d > 0) return M.I();
        ax = Math.abs(a[0]) < 0.9 ? V.cross(a, [1, 0, 0]) : V.cross(a, [0, 1, 0]);
      }
      return M.axis(ax, Math.acos(d));
    },
  };

  /* ---------- fórmulas de esqueleto ---------- */

  function trimPoint(a, b, fs) {
    if (!a.label) return { x: a.x, y: a.y };
    const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
    const ux = dx / L, uy = dy / L;
    const rx = a.w / 2 + 3, ry = fs * 0.66;
    const t = 1 / Math.sqrt((ux / rx) ** 2 + (uy / ry) ** 2);
    return { x: a.x + ux * t, y: a.y + uy * t };
  }

  function drawBond(g, A, B, type, bo, fs) {
    const p = trimPoint(A, B, fs), q = trimPoint(B, A, fs);
    const dx = q.x - p.x, dy = q.y - p.y, L = Math.hypot(dx, dy) || 1;
    const nx = -dy / L, ny = dx / L;
    const cls = 'bond' + (bo.cls ? ' ' + bo.cls : '');
    const line = (x1, y1, x2, y2, c) => el('line', {
      x1: fmt(x1), y1: fmt(y1), x2: fmt(x2), y2: fmt(y2), class: c || cls,
    }, g);

    if (type === 1) {
      line(p.x, p.y, q.x, q.y);
    } else if (type === 2) {
      if (bo.side) {
        line(p.x, p.y, q.x, q.y);
        const off = 5.5 * bo.side, sh = A.label || B.label ? 0 : 0.14;
        line(p.x + nx * off + dx * sh, p.y + ny * off + dy * sh,
          q.x + nx * off - dx * sh, q.y + ny * off - dy * sh);
      } else {
        const o = 2.8;
        line(p.x + nx * o, p.y + ny * o, q.x + nx * o, q.y + ny * o);
        line(p.x - nx * o, p.y - ny * o, q.x - nx * o, q.y - ny * o);
      }
    } else if (type === 3) {
      line(p.x, p.y, q.x, q.y);
      const o = 4.2;
      line(p.x + nx * o, p.y + ny * o, q.x + nx * o, q.y + ny * o);
      line(p.x - nx * o, p.y - ny * o, q.x - nx * o, q.y - ny * o);
    } else if (type === 'w') {
      const w = 4.4;
      el('polygon', {
        points: `${fmt(p.x)},${fmt(p.y)} ${fmt(q.x + nx * w)},${fmt(q.y + ny * w)} ${fmt(q.x - nx * w)},${fmt(q.y - ny * w)}`,
        class: 'wedge' + (bo.cls ? ' ' + bo.cls : ''),
      }, g);
    } else if (type === 'h') {
      const n = Math.max(5, Math.round(L / 4.4));
      for (let i = 1; i <= n; i++) {
        const t = i / n, w = 0.7 + 4 * t;
        const cx = p.x + dx * t, cy = p.y + dy * t;
        line(cx + nx * w, cy + ny * w, cx - nx * w, cy - ny * w, 'hash' + (bo.cls ? ' ' + bo.cls : ''));
      }
    } else if (type === 'd') {
      line(p.x, p.y, q.x, q.y, cls + ' dashed');
    }
  }

  /**
   * mol = { atoms: [[x, y, rótulo?, {hl, note, cls}]], bonds: [[i, j, tipo, {side, cls}]] }
   * coordenadas em unidades de comprimento de ligação, y para baixo.
   */
  function skeleton(mol, o) {
    o = Object.assign({ scale: 40, fs: 15, pad: 12 }, mol.opts || {}, o || {});
    const s = o.scale, fs = o.fs;
    const A = mol.atoms.map((a) => {
      const label = a[2] || '';
      return { x: a[0] * s, y: a[1] * s, label, opt: a[3] || {}, w: label ? labelWidth(label, fs) : 0 };
    });
    let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
    const grow = (x0, y0, x1, y1) => {
      minx = Math.min(minx, x0); miny = Math.min(miny, y0);
      maxx = Math.max(maxx, x1); maxy = Math.max(maxy, y1);
    };
    A.forEach((a) => {
      const hw = a.label ? a.w / 2 + 2 : 3, hh = a.label ? fs * 0.7 : 3;
      grow(a.x - hw, a.y - hh, a.x + hw, a.y + hh);
      if (a.opt.note) {
        const nd = a.opt.nd || [0.3, -0.36];
        const nx = a.x + nd[0] * s, ny = a.y + nd[1] * s;
        const nw = labelWidth(a.opt.note, fs * 0.8) / 2 + 2;
        grow(nx - nw, ny - fs * 0.6, nx + nw, ny + fs * 0.6);
      }
    });
    (mol.extra || []).forEach((t) => grow(t[0] * s - 30, t[1] * s - 12, t[0] * s + 30, t[1] * s + 12));
    const pad = o.pad;
    const W = maxx - minx + 2 * pad, H = maxy - miny + 2 * pad;
    const svg = makeSVG(W, H, 'skel', o.title || mol.title);
    const g = el('g', { transform: `translate(${fmt(pad - minx)},${fmt(pad - miny)})` }, svg);
    A.forEach((a) => {
      if (a.opt.hl) el('circle', { cx: fmt(a.x), cy: fmt(a.y), r: a.opt.hlr || (a.label ? Math.max(12, a.w / 2 + 5) : 9), class: 'hl ' + (typeof a.opt.hl === 'string' ? a.opt.hl : '') }, g);
    });
    (mol.bonds || []).forEach((b) => drawBond(g, A[b[0]], A[b[1]], b[2] === undefined ? 1 : b[2], b[3] || {}, fs));
    A.forEach((a) => {
      if (a.label) chemText(g, a.x, a.y, a.label, { class: 'atom' + (a.opt.cls ? ' ' + a.opt.cls : ''), 'font-size': fs });
      if (a.opt.note) {
        const nd = a.opt.nd || [0.3, -0.36];
        chemText(g, a.x + nd[0] * s, a.y + nd[1] * s, a.opt.note, { class: 'note' + (a.opt.ncls ? ' ' + a.opt.ncls : ''), 'font-size': fs * 0.8 });
      }
    });
    (mol.extra || []).forEach((t) => chemText(g, t[0] * s, t[1] * s, t[2], { class: 'note ' + (t[3] || ''), 'font-size': fs * 0.85 }));
    return svg;
  }

  /* helpers para montar coordenadas */
  function zigzag(n, x0, y0, up) {
    const pts = [];
    for (let i = 0; i < n; i++) pts.push([x0 + i * 0.866, y0 + ((i % 2 === 0) === !!up ? -0.25 : 0.25)]);
    return pts;
  }
  function ringPts(n, cx, cy, startDeg) {
    const R = 1 / (2 * Math.sin(Math.PI / n));
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (startDeg + i * 360 / n) * D2R;
      pts.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]);
    }
    return pts;
  }

  /* ---------- centro estereogênico em cunha/tracejado ---------- */

  /*
   * Layout fixo: duas ligações no plano (para cima-esquerda e para cima-direita),
   * cunha para baixo-esquerda e tracejado para baixo-direita.
   * Os vetores 3D correspondem ao desenho (y para cima, z para o observador).
   */
  const STEREO_LAYOUTS = {
    v: {
      pos2d: [[-0.87, -0.5], [0.87, -0.5], [-0.5, 0.87], [0.62, 0.78]],
      types: [1, 1, 'w', 'h'],
      vec3: [[-0.82, 0.47, 0], [0.82, 0.47, 0], [-0.45, -0.55, 0.7], [0.45, -0.55, -0.7]],
    },
    t: {
      // para cima, para baixo-esquerda, cunha à direita e tracejado para baixo
      pos2d: [[0, -1], [-0.87, 0.5], [0.95, 0.3], [0.35, 0.94]],
      types: [1, 1, 'w', 'h'],
      vec3: [[0, 1, 0], [-0.87, -0.4, 0], [0.7, -0.15, 0.7], [0.3, -0.5, -0.8]],
    },
  };

  function stereoVectors(layout) {
    return STEREO_LAYOUTS[layout || 'v'].vec3;
  }

  /**
   * Desenha C com 4 ligantes. labels[i] vai na posição i do layout.
   * opts.center: rótulo do centro (padrão 'C'); opts.hl: destaca o centro.
   */
  function stereoCenter(labels, o) {
    o = Object.assign({ layout: 'v', len: 1.3, center: 'C', fs: 17, scale: 44 }, o || {});
    const L = STEREO_LAYOUTS[o.layout];
    let note = o.note;
    if (o.prio && o.showDesc) note = descriptorFor(o.prio, o.layout);
    const atoms = [[0, 0, o.center, { hl: o.hl, note, nd: o.nd || [0, -0.52], ncls: 'desc' }]];
    const bonds = [];
    labels.forEach((lab, i) => {
      const p = L.pos2d[i];
      const r = o.prio && o.showRanks ? o.prio[i] : null;
      const half = labelWidth(lab, o.fs) / 2 / o.scale;
      const nd = [p[0] < -0.1 ? -half - 0.2 : half + 0.2, -0.38];
      atoms.push([p[0] * o.len, p[1] * o.len, lab, r ? { note: String(r), nd, ncls: 'rank' } : {}]);
      bonds.push([0, i + 1, L.types[i]]);
    });
    return skeleton({ atoms, bonds }, { fs: o.fs, scale: o.scale, title: o.title });
  }
  /* prio[i] = prioridade CIP do ligante na posição i do layout */
  function descriptorFor(prio, layout) {
    const vec = STEREO_LAYOUTS[layout || 'v'].vec3;
    const v = [];
    prio.forEach((r, i) => { v[r - 1] = vec[i]; });
    return chirality(v[0], v[1], v[2], v[3]);
  }
  /* ---------- projeção de Fischer ---------- */

  const FISCHER_VEC = { t: [0, 1, -1], b: [0, -1, -1], l: [-1, 0, 1], r: [1, 0, 1] };

  /** ranks: {t, b, l, r} → 'R' | 'S' */
  function fischerDescriptor(ranks) {
    const v = [];
    for (const k in ranks) v[ranks[k] - 1] = FISCHER_VEC[k];
    return chirality(v[0], v[1], v[2], v[3]);
  }

  /**
   * f = { top, bottom, rows: [[esq, dir], ...], ranks?: [{t,b,l,r}], descr?: true }
   */
  function fischer(f, o) {
    o = Object.assign({ fs: 15, arm: 44, gap: 50, pad: 12, perspective: false }, o || {});
    const fs = o.fs, n = f.rows.length;
    const lw = Math.max(...f.rows.map((r) => labelWidth(r[0], fs)));
    const rw = Math.max(...f.rows.map((r) => labelWidth(r[1], fs)));
    const tw = Math.max(labelWidth(f.top, fs), labelWidth(f.bottom, fs));
    const descW = f.ranks ? 26 : 0;
    const cx = o.pad + Math.max(lw + 6 + o.arm, tw / 2);
    const W = cx + Math.max(rw + 6 + o.arm + descW, tw / 2) + o.pad;
    const yTop = o.pad + fs * 0.6;
    const y0 = yTop + o.gap * 0.85;
    const yBot = y0 + (n - 1) * o.gap + o.gap * 0.85;
    const H = yBot + fs * 0.6 + o.pad;
    const svg = makeSVG(W, H, 'fischer', o.title);
    const g = el('g', null, svg);
    const persp = o.perspective && n === 1;
    // vertical
    if (persp) {
      drawBond(g, { x: cx, y: y0, label: '' }, { x: cx, y: yTop + fs * 0.7, label: '' }, 'h', {}, fs);
      drawBond(g, { x: cx, y: y0, label: '' }, { x: cx, y: yBot - fs * 0.7, label: '' }, 'h', {}, fs);
    } else {
      el('line', { x1: cx, y1: yTop + fs * 0.7, x2: cx, y2: yBot - fs * 0.7, class: 'bond' }, g);
    }
    chemText(g, cx, yTop, f.top, { class: 'atom', 'font-size': fs });
    chemText(g, cx, yBot, f.bottom, { class: 'atom', 'font-size': fs });
    f.rows.forEach((r, i) => {
      const y = y0 + i * o.gap;
      if (persp) {
        drawBond(g, { x: cx, y, label: '' }, { x: cx - o.arm, y, label: '' }, 'w', {}, fs);
        drawBond(g, { x: cx, y, label: '' }, { x: cx + o.arm, y, label: '' }, 'w', {}, fs);
        el('circle', { cx, cy: y, r: 2.6, class: 'cdot' }, g);
      } else {
        el('line', { x1: cx - o.arm, y1: y, x2: cx + o.arm, y2: y, class: 'bond' }, g);
      }
      chemText(g, cx - o.arm - 4, y, r[0], { class: 'atom', 'font-size': fs, 'text-anchor': 'end' });
      chemText(g, cx + o.arm + 4, y, r[1], { class: 'atom', 'font-size': fs, 'text-anchor': 'start' });
      if (f.ranks && f.ranks[i]) {
        const d = fischerDescriptor(f.ranks[i]);
        chemText(g, cx + 9, y - 11, d, { class: 'desc', 'font-size': fs * 0.75, 'text-anchor': 'start' });
      }
    });
    return svg;
  }

  /* ---------- projeção de Newman ---------- */

  /**
   * nm = { front: [3 rótulos], back: [3 rótulos], fa: ângulo do 1º ligante da frente (graus),
   *        ba: ângulo do 1º ligante de trás, hl: [rótulos destacados] }
   * Os ligantes são distribuídos no sentido horário (−120°).
   */
  function newman(nm, o) {
    o = Object.assign({ R: 30, L: 60, fs: 15, pad: 10, size: null }, o || {});
    const fs = o.fs;
    const all = nm.front.concat(nm.back);
    const maxW = Math.max(...all.map((l) => labelWidth(l, fs)));
    const ext = o.L + 6 + maxW + 4;
    const S = o.size || 2 * (ext + o.pad);
    const c = S / 2;
    const svg = makeSVG(S, S, 'newman', o.title);
    const g = el('g', null, svg);
    const hl = nm.hl || [];
    const put = (ang, r0, lab, cls) => {
      const a = ang * D2R, ux = Math.cos(a), uy = -Math.sin(a);
      el('line', { x1: fmt(c + ux * r0), y1: fmt(c + uy * r0), x2: fmt(c + ux * o.L), y2: fmt(c + uy * o.L), class: 'bond ' + cls }, g);
      const w = labelWidth(lab, fs);
      const d = o.L + 5 + Math.abs(ux) * w / 2 + Math.abs(uy) * fs * 0.62;
      chemText(g, c + ux * d, c + uy * d, lab, {
        class: 'atom ' + cls + (hl.includes(lab) ? ' hlt' : ''), 'font-size': fs,
      });
    };
    nm.back.forEach((lab, i) => put(nm.ba - i * 120, o.R, lab, 'back'));
    el('circle', { cx: c, cy: c, r: o.R, class: 'nm-circle' }, g);
    nm.front.forEach((lab, i) => put(nm.fa - i * 120, 0, lab, 'front'));
    el('circle', { cx: c, cy: c, r: 2.4, class: 'cdot' }, g);
    if (o.caption) chemText(g, c, S - 6, o.caption, { class: 'note', 'font-size': fs * 0.75 });
    return svg;
  }

  /* ---------- modelos 3D ---------- */

  const GROUPS = {
    H: { color: '#f1f3f5', r: 0.27, len: 1.05, text: '' },
    C: { color: '#5c636e', r: 0.36, len: 1.5 },
    D: { color: '#dee2e6', r: 0.3, len: 1.05 },
    CH3: { color: '#f59f00', r: 0.5, len: 1.5 },
    CH2CH3: { color: '#fd7e14', r: 0.56, len: 1.5 },
    'CH(CH3)2': { color: '#e64980', r: 0.6, len: 1.5 },
    'C(CH3)3': { color: '#ae3ec9', r: 0.68, len: 1.55 },
    C6H5: { color: '#7048e8', r: 0.64, len: 1.5 },
    OH: { color: '#fa5252', r: 0.46, len: 1.43 },
    NH2: { color: '#4c6ef5', r: 0.48, len: 1.47 },
    F: { color: '#94d82d', r: 0.4, len: 1.38 },
    Cl: { color: '#37b24d', r: 0.48, len: 1.6 },
    Br: { color: '#a5432a', r: 0.54, len: 1.7 },
    I: { color: '#862e9c', r: 0.6, len: 1.8 },
    SH: { color: '#fcc419', r: 0.5, len: 1.6 },
    COOH: { color: '#e8590c', r: 0.58, len: 1.5 },
    CHO: { color: '#ff8787', r: 0.52, len: 1.5 },
    CH2OH: { color: '#ffa8a8', r: 0.56, len: 1.5 },
    CN: { color: '#15aabf', r: 0.46, len: 1.47 },
    'CH=CH2': { color: '#20c997', r: 0.6, len: 1.5 },
    'C≡CH': { color: '#0ca678', r: 0.56, len: 1.46 },
    CH2Br: { color: '#c0765a', r: 0.6, len: 1.5 },
    CH2Cl: { color: '#69db7c', r: 0.6, len: 1.5 },
    CH2CH2CH3: { color: '#ffa94d', r: 0.62, len: 1.5 },
    OCH3: { color: '#ff6b6b', r: 0.56, len: 1.43 },
  };

  function groupStyle(label) {
    return GROUPS[label] || { color: '#adb5bd', r: 0.55, len: 1.5 };
  }

  function lum(hex) {
    const n = parseInt(hex.slice(1), 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }
  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    const f = (c) => Math.max(0, Math.min(255, Math.round(k > 0 ? c + (255 - c) * k : c * (1 + k))));
    const r = f((n >> 16) & 255), g = f((n >> 8) & 255), b = f(n & 255);
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  }

  /**
   * new Mol3D(host, { atoms: [{p:[x,y,z], color, r, label, ring}], bonds: [[i,j,{cls,dash,color}]],
   *                   w, h, rot (matriz), interactive, onRender })
   */
  class Mol3D {
    constructor(host, opt) {
      this.opt = Object.assign({ w: 320, h: 260, interactive: true, fit: 0.86, labelScale: 0.72 }, opt || {});
      this.id = 'm3d' + (++UID);
      this.R = this.opt.rot ? this.opt.rot.slice() : M.I();
      this.R0 = this.R.slice();
      const { w, h } = this.opt;
      this.svg = makeSVG(w, h, 'mol3d' + (this.opt.interactive ? ' grab' : ''), this.opt.title);
      this.defs = el('defs', null, this.svg);
      this.grads = {};
      this.g = el('g', null, this.svg);
      this.over = el('g', { class: 'overlay' }, this.svg);
      host.appendChild(this.svg);
      if (this.opt.interactive) this._bind();
      if (this.opt.atoms) this.set(this.opt.atoms, this.opt.bonds || []);
    }

    set(atoms, bonds, keepScale) {
      this.atoms = atoms;
      this.bonds = bonds;
      if (!keepScale || !this.scale) {
        let rmax = 0.5;
        const c = this.center(atoms);
        atoms.forEach((a) => { rmax = Math.max(rmax, V.len(V.sub(a.p, c)) + (a.r || 0.3)); });
        this.scale = this.opt.scale || (Math.min(this.opt.w, this.opt.h) / 2) * this.opt.fit / rmax;
        this.c = c;
      }
      this.render();
    }

    center(atoms) {
      if (this.opt.center) return this.opt.center;
      let lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
      atoms.forEach((a) => {
        for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], a.p[k]); hi[k] = Math.max(hi[k], a.p[k]); }
      });
      return V.mul(V.add(lo, hi), 0.5);
    }

    grad(color) {
      if (this.grads[color]) return this.grads[color];
      const id = `${this.id}g${Object.keys(this.grads).length}`;
      const rg = el('radialGradient', { id, cx: '35%', cy: '32%', r: '70%' }, this.defs);
      el('stop', { offset: '0%', 'stop-color': shade(color, 0.6) }, rg);
      el('stop', { offset: '55%', 'stop-color': color }, rg);
      el('stop', { offset: '100%', 'stop-color': shade(color, -0.35) }, rg);
      this.grads[color] = `url(#${id})`;
      return this.grads[color];
    }

    project(p) {
      const q = M.apply(this.R, V.sub(p, this.c));
      return { x: this.opt.w / 2 + q[0] * this.scale, y: this.opt.h / 2 - q[1] * this.scale, z: q[2] };
    }

    render() {
      const g = this.g;
      while (g.firstChild) g.removeChild(g.firstChild);
      const P = this.atoms.map((a) => this.project(a.p));
      this.P = P;
      const s = this.scale;
      const items = [];
      this.bonds.forEach((b) => {
        const p = P[b[0]], q = P[b[1]], bo = b[2] || {};
        items.push({
          z: (p.z + q.z) / 2 - 0.02 + (bo.dash ? 0.6 : 0),
          draw: () => {
            const ln = el('line', {
              x1: fmt(p.x), y1: fmt(p.y), x2: fmt(q.x), y2: fmt(q.y),
              class: 'b3' + (bo.cls ? ' ' + bo.cls : '') + (bo.dash ? ' b3dash' : ''),
              'stroke-width': fmt((bo.dash ? 0.06 : 0.14) * s),
            }, g);
            if (bo.color) ln.style.stroke = bo.color;
          },
        });
      });
      this.atoms.forEach((a, i) => {
        if (a.hidden) return;
        const p = P[i];
        items.push({
          z: p.z,
          draw: () => {
            const r = (a.r || 0.3) * s;
            const c = el('circle', {
              cx: fmt(p.x), cy: fmt(p.y), r: fmt(r), fill: this.grad(a.color || '#adb5bd'),
              class: 'a3' + (a.cls ? ' ' + a.cls : ''),
            }, g);
            if (a.ring) { c.style.stroke = a.ring; c.style.strokeWidth = Math.max(2, 0.07 * s); }
            if (a.label) {
              const fsz = Math.max(8.5, Math.min(r * this.opt.labelScale * (a.label.length > 3 ? 0.85 : 1), 15));
              chemText(g, p.x, p.y, a.label, {
                class: 'l3', 'font-size': fmt(fsz),
                fill: a.labelColor || (lum(a.color || '#adb5bd') > 0.62 ? '#1d2433' : '#ffffff'),
              });
            }
          },
        });
      });
      items.sort((a, b) => a.z - b.z).forEach((it) => it.draw());
      if (this.opt.onRender) this.opt.onRender(this);
    }

    setRot(R) { this.R = R.slice(); this.render(); }
    reset() { this.R = this.R0.slice(); this.render(); }

    _bind() {
      const svg = this.svg;
      let last = null;
      svg.addEventListener('pointerdown', (e) => {
        last = [e.clientX, e.clientY];
        svg.setPointerCapture(e.pointerId);
        svg.classList.add('grabbing');
      });
      svg.addEventListener('pointermove', (e) => {
        if (!last) return;
        const dx = e.clientX - last[0], dy = e.clientY - last[1];
        last = [e.clientX, e.clientY];
        const k = 0.6;
        this.R = M.mul(M.mul(M.ry(dx * k), M.rx(dy * k)), this.R);
        this.render();
        if (this.opt.onRotate) this.opt.onRotate(this);
      });
      const end = () => { last = null; svg.classList.remove('grabbing'); };
      svg.addEventListener('pointerup', end);
      svg.addEventListener('pointercancel', end);
      svg.addEventListener('dblclick', () => this.reset());
    }
  }

  /* ---------- geometrias ---------- */

  const BETA = (180 - 109.47) * D2R;

  /**
   * Dois carbonos sp3 ao longo de z (frente em +z). front/back: 3 rótulos.
   * fa: ângulo do 1º ligante da frente; dihedral: rotação do carbono de trás.
   * Retorna { atoms, bonds } para Mol3D.
   */
  function ethaneGeom(front, back, fa, ba, o) {
    o = o || {};
    const cc = 1.54;
    const atoms = [
      { p: [0, 0, cc / 2], color: GROUPS.C.color, r: 0.36 },
      { p: [0, 0, -cc / 2], color: GROUPS.C.color, r: 0.36 },
    ];
    const bonds = [[0, 1]];
    const addSet = (labels, a0, ci, sign) => {
      labels.forEach((lab, i) => {
        const gs = groupStyle(lab);
        const a = (a0 - i * 120) * D2R;
        const d = [Math.sin(BETA) * Math.cos(a), Math.sin(BETA) * Math.sin(a), sign * Math.cos(BETA)];
        const len = lab === 'H' ? 1.09 : 1.54;
        atoms.push({
          p: V.add(atoms[ci].p, V.mul(d, len)), color: gs.color, r: lab === 'H' ? 0.3 : 0.5,
          label: lab === 'H' ? (o.showH ? 'H' : '') : lab,
        });
        bonds.push([ci, atoms.length - 1]);
      });
    };
    addSet(front, fa, 0, 1);
    addSet(back, ba, 1, -1);
    return { atoms, bonds };
  }

  /* Rotação padrão "cavalete": carbono da frente embaixo à esquerda. */
  const SAWHORSE_ROT = M.mul(M.rx(28), M.ry(-52));

  /*
   * Ciclo-hexano em cadeira. t = 0 → cadeira A; t = 1 → cadeira invertida.
   * subs: { '0u': 'CH3', '3d': 'Cl', ... } (k = 0..5, u = face de cima, d = face de baixo)
   * Os carbonos pares (0, 2, 4) estão "para cima" na cadeira A.
   */
  const CHAIR_R = 1.46, CHAIR_H = 0.25;
  const EQ_RAD = Math.sin(109.47 * D2R), EQ_Z = -Math.cos(109.47 * D2R); // 0.943, 0.333

  function chairDirs(k, sign) {
    const phi = k * 60 * D2R;
    const rad = [Math.cos(phi), Math.sin(phi), 0];
    // sign: +1 se o carbono está para cima
    const up = sign > 0 ? [0, 0, 1] : V.add(V.mul(rad, EQ_RAD), [0, 0, EQ_Z]);
    const down = sign < 0 ? [0, 0, -1] : V.add(V.mul(rad, EQ_RAD), [0, 0, -EQ_Z]);
    return { up, down, upRole: sign > 0 ? 'ax' : 'eq', downRole: sign < 0 ? 'ax' : 'eq' };
  }

  function chairGeom(t, subs, o) {
    o = Object.assign({ numbers: false, roleColors: false, showHLabels: false, diaxial: null }, o || {});
    subs = subs || {};
    const atoms = [], bonds = [], meta = {};
    for (let k = 0; k < 6; k++) {
      const phi = k * 60 * D2R;
      const s0 = k % 2 === 0 ? 1 : -1;
      const z = CHAIR_H * s0 * (1 - 2 * t);
      atoms.push({
        p: [CHAIR_R * Math.cos(phi), CHAIR_R * Math.sin(phi), z],
        color: GROUPS.C.color, r: o.numbers ? 0.3 : 0.24,
        label: o.numbers ? String(((k - (o.numOffset || 0) + 6) % 6) + 1) : '', labelColor: '#fff',
      });
    }
    for (let k = 0; k < 6; k++) bonds.push([k, (k + 1) % 6, { cls: 'ring' }]);
    for (let k = 0; k < 6; k++) {
      const s0 = k % 2 === 0 ? 1 : -1;
      const A = chairDirs(k, s0), B = chairDirs(k, -s0);
      const cur = t < 0.5 ? A : B;
      ['u', 'd'].forEach((f) => {
        const key = k + f;
        const lab = subs[key] || 'H';
        const gs = groupStyle(lab);
        const d0 = f === 'u' ? A.up : A.down, d1 = f === 'u' ? B.up : B.down;
        const dir = V.norm(V.lerp(d0, d1, t));
        const role = f === 'u' ? cur.upRole : cur.downRole;
        const len = lab === 'H' ? 1.0 : gs.len;
        const isH = lab === 'H';
        let color = gs.color, ring = null;
        if (isH && o.roleColors) color = role === 'ax' ? '#ff8787' : '#74c0fc';
        if (!isH && o.ringRoles) ring = role === 'ax' ? '#e03131' : '#1c7ed6';
        atoms.push({
          p: V.add(atoms[k].p, V.mul(dir, len)), color, ring,
          r: isH ? (o.roleColors ? 0.25 : 0.22) : gs.r,
          label: isH ? (o.showHLabels ? (role === 'ax' ? 'a' : 'e') : '') : lab,
          labelColor: isH ? '#1d2433' : undefined,
        });
        const idx = atoms.length - 1;
        let bcls = 'sub';
        if (o.roleColors) bcls += role === 'ax' ? ' ax' : ' eq';
        bonds.push([k, idx, { cls: bcls }]);
        meta[key] = { index: idx, role, label: lab };
      });
    }
    // interações 1,3-diaxiais: linhas tracejadas entre substituintes axiais do mesmo lado
    if (o.diaxial) {
      o.diaxial.forEach((key) => {
        const m = meta[key];
        if (!m || m.role !== 'ax') return;
        const k = +key[0], f = key[1];
        [(k + 2) % 6, (k + 4) % 6].forEach((j) => {
          const n = meta[j + f];
          if (n && n.role === 'ax') bonds.push([m.index, n.index, { dash: true, cls: 'diax' }]);
        });
      });
    }
    return { atoms, bonds, meta };
  }

  /* Rotação "de livro": cadeira vista quase de perfil, ligeiramente de cima. */
  const CHAIR_ROT = M.mul(M.rx(-76), M.rz(8));
  /* Para os desenhos 2D passo a passo (ligações da frente e de trás alinhadas). */
  const CHAIR_ROT_2D = M.rx(-78);

  /* escala fixa para modelos de cadeira (mesmo tamanho antes e depois da interconversão) */
  function chairScale(w, h) {
    return Math.min(w / 2 / 3.7, h / 2 / 2.6);
  }

  /* Projeção 2D da cadeira (para desenhos estáticos passo a passo). */
  function chairProjected(t) {
    const geo = chairGeom(t || 0, {});
    return geo.atoms.map((a) => {
      const q = M.apply(CHAIR_ROT_2D, a.p);
      return [q[0], -q[1]];
    });
  }

  /* centro quiral 3D: 4 ligantes nos vértices de um tetraedro */
  const TETRA = [
    [0, 1, 0],
    [0.943, -0.333, 0],
    [-0.471, -0.333, 0.816],
    [-0.471, -0.333, -0.816],
  ];
  function centerGeom(labels, o) {
    o = o || {};
    const atoms = [{ p: [0, 0, 0], color: GROUPS.C.color, r: 0.4, label: o.centerLabel || '' }];
    const bonds = [];
    labels.forEach((lab, i) => {
      const gs = groupStyle(lab);
      const v = o.mirror ? [-TETRA[i][0], TETRA[i][1], TETRA[i][2]] : TETRA[i];
      const len = lab === 'H' ? 1.1 : 1.55;
      atoms.push({ p: V.mul(v, len), color: gs.color, r: lab === 'H' ? 0.34 : Math.min(gs.r + 0.05, 0.62), label: lab === 'H' ? 'H' : lab });
      bonds.push([0, i + 1]);
    });
    return { atoms, bonds };
  }

  G.Chem = {
    el, makeSVG, chemText, labelWidth, fmt, D2R, V, M,
    chirality, skeleton, zigzag, ringPts, stereoCenter, stereoVectors, descriptorFor, STEREO_LAYOUTS,
    fischer, fischerDescriptor, FISCHER_VEC, newman,
    Mol3D, GROUPS, groupStyle, ethaneGeom, SAWHORSE_ROT, chairGeom, CHAIR_ROT, CHAIR_ROT_2D, chairProjected, chairScale,
    centerGeom, TETRA,
  };
})(window);
