/*
 * orbitals.js — funções de onda (hidrogenoides, unidades atômicas, Z = 1),
 * orbitais híbridos (combinações de 2s e 2p no mesmo átomo), combinações
 * LCAO entre dois centros e superfícies de isovalor por "marching
 * tetrahedra". As superfícies são isovalores de ψ: a fase (+/−) é mostrada
 * por duas cores. Representação qualitativa: Z, distâncias e isovalores
 * foram escolhidos para visualização.
 */
const N1 = 1 / Math.sqrt(Math.PI), N2 = 1 / (4 * Math.sqrt(2 * Math.PI));
const len = (x, y, z) => Math.sqrt(x * x + y * y + z * z);
const norm = (d) => { const l = Math.hypot(d[0], d[1], d[2]) || 1; return [d[0] / l, d[1] / l, d[2] / l]; };

/* ---------- orbitais atômicos (centro c, direção d para p) ---------- */
export const s1 = (c = [0, 0, 0]) => (x, y, z) => N1 * Math.exp(-len(x - c[0], y - c[1], z - c[2]));
export const s2 = (c = [0, 0, 0]) => (x, y, z) => { const r = len(x - c[0], y - c[1], z - c[2]); return N2 * (2 - r) * Math.exp(-r / 2); };
export const p2 = (d = [0, 0, 1], c = [0, 0, 0]) => { d = norm(d); return (x, y, z) => { const X = x - c[0], Y = y - c[1], Z = z - c[2]; return N2 * (X * d[0] + Y * d[1] + Z * d[2]) * Math.exp(-len(X, Y, Z) / 2); }; };
/** híbrido spⁿ: (√n·2p_d − 2s)/√(1+n) (a parte externa do 2s hidrogenoide é negativa) — n = 3 (sp³), 2 (sp²), 1 (sp) */
export const hyb = (n, d = [0, 0, 1], c = [0, 0, 0]) => { const S = s2(c), P = p2(d, c), k = Math.sqrt(n), m = 1 / Math.sqrt(1 + n); return (x, y, z) => m * (k * P(x, y, z) - S(x, y, z)); }; // sinal do 2s escolhido para o lóbulo maior ficar em +d
export const sum = (fs, ws) => (x, y, z) => fs.reduce((t, f, i) => t + (ws ? ws[i] : 1) * f(x, y, z), 0);

/* presets do laboratório de orbitais: função, extensão da caixa e isovalor */
export const AO_PRESETS = {
  '1s': { f: s1(), L: 4.2, iso: 0.06, txt: 'esférico, sem nós' },
  '2s': { f: s2(), L: 13, iso: 0.011, txt: 'esférico, 1 nó radial (esfera nodal em r = 2 a₀)' },
  '2px': { f: p2([1, 0, 0]), L: 11, iso: 0.018, txt: '2 lóbulos de fases opostas; plano nodal yz' },
  '2py': { f: p2([0, 1, 0]), L: 11, iso: 0.018, txt: '2 lóbulos; plano nodal xz' },
  '2pz': { f: p2([0, 0, 1]), L: 11, iso: 0.018, txt: '2 lóbulos; plano nodal xy' },
  sp3: { f: hyb(3), L: 12, iso: 0.018, txt: '25% s, 75% p: um lóbulo grande e um pequeno de fase oposta' },
  sp2: { f: hyb(2), L: 12, iso: 0.018, txt: '33% s, 67% p' },
  sp: { f: hyb(1), L: 12, iso: 0.018, txt: '50% s, 50% p: lóbulo maior mais concentrado à frente' },
};

/* ===================================================================
 * Isosuperfície por marching tetrahedra
 * f: função (x,y,z); box: [x0,y0,z0,x1,y1,z1]; iso > 0 (superfície f = iso)
 * devolve { pos, nor } (Float32Array, triângulos soltos)
 * =================================================================== */
const TETS = [[0, 5, 1, 6], [0, 1, 2, 6], [0, 2, 3, 6], [0, 3, 7, 6], [0, 7, 4, 6], [0, 4, 5, 6]];
const CORNER = [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]];
export function grid(f, box, n) {
  const [x0, y0, z0, x1, y1, z1] = box, nx = n, ny = n, nz = n;
  const dx = (x1 - x0) / nx, dy = (y1 - y0) / ny, dz = (z1 - z0) / nz;
  const v = new Float32Array((nx + 1) * (ny + 1) * (nz + 1));
  let k = 0, mx = 0;
  for (let i = 0; i <= nx; i++) for (let j = 0; j <= ny; j++) for (let l = 0; l <= nz; l++) { const w = f(x0 + i * dx, y0 + j * dy, z0 + l * dz); v[k++] = w; if (Math.abs(w) > mx) mx = Math.abs(w); }
  return { v, nx, ny, nz, x0, y0, z0, dx, dy, dz, max: mx, f };
}
export function iso(G, level, sign = 1) {
  const { v, nx, ny, nz, x0, y0, z0, dx, dy, dz, f } = G;
  const idx = (i, j, l) => (i * (ny + 1) + j) * (nz + 1) + l;
  const out = [];
  const P = new Array(4), Vv = new Array(4);
  const lerp = (a, b, va, vb) => { const t = (level - va) / (vb - va); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; };
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) for (let l = 0; l < nz; l++) {
    // descarta cubos sem cruzamento
    let any = false, all = true;
    for (let c = 0; c < 8; c++) { const w = sign * v[idx(i + CORNER[c][0], j + CORNER[c][1], l + CORNER[c][2])] > level; any = any || w; all = all && w; }
    if (!any || all) continue;
    for (const T of TETS) {
      let mask = 0;
      for (let q = 0; q < 4; q++) {
        const c = CORNER[T[q]];
        P[q] = [x0 + (i + c[0]) * dx, y0 + (j + c[1]) * dy, z0 + (l + c[2]) * dz];
        Vv[q] = sign * v[idx(i + c[0], j + c[1], l + c[2])];
        if (Vv[q] > level) mask |= 1 << q;
      }
      if (mask === 0 || mask === 15) continue;
      const ins = [0, 1, 2, 3].filter((q) => mask & (1 << q)), outs = [0, 1, 2, 3].filter((q) => !(mask & (1 << q)));
      const e = (a, b) => lerp(P[a], P[b], Vv[a], Vv[b]);
      if (ins.length === 1) out.push([e(ins[0], outs[0]), e(ins[0], outs[1]), e(ins[0], outs[2])]);
      else if (ins.length === 3) out.push([e(outs[0], ins[0]), e(outs[0], ins[1]), e(outs[0], ins[2])]);
      else { const a = e(ins[0], outs[0]), b = e(ins[0], outs[1]), c = e(ins[1], outs[1]), d = e(ins[1], outs[0]); out.push([a, b, c], [a, c, d]); }
    }
  }
  const pos = new Float32Array(out.length * 9), nor = new Float32Array(out.length * 9);
  const h = Math.min(dx, dy, dz) * 0.5, h0 = h;
  let k = 0;
  // orienta cada triângulo pela normal do gradiente (enrolamento consistente)
  out.forEach((tri) => {
    const [a, b, c] = tri, e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
    const m = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3];
    const g = [f(m[0] + h0, m[1], m[2]) - f(m[0] - h0, m[1], m[2]), f(m[0], m[1] + h0, m[2]) - f(m[0], m[1] - h0, m[2]), f(m[0], m[1], m[2] + h0) - f(m[0], m[1], m[2] - h0)].map((x) => x * sign);
    if (n[0] * g[0] + n[1] * g[1] + n[2] * g[2] > 0) { tri[1] = c; tri[2] = b; } // a normal deve apontar para fora (−∇)
  });
  out.forEach((tri) => tri.forEach((p) => {
    const gx = (f(p[0] + h, p[1], p[2]) - f(p[0] - h, p[1], p[2])) * sign, gy = (f(p[0], p[1] + h, p[2]) - f(p[0], p[1] - h, p[2])) * sign, gz = (f(p[0], p[1], p[2] + h) - f(p[0], p[1], p[2] - h)) * sign;
    const L = Math.hypot(gx, gy, gz) || 1;
    pos[k] = p[0]; pos[k + 1] = p[1]; pos[k + 2] = p[2];
    nor[k] = -gx / L; nor[k + 1] = -gy / L; nor[k + 2] = -gz / L;
    k += 3;
  }));
  return { pos, nor, ntri: out.length };
}
/** as duas fases de uma função: isovalor relativo (frac × máx) ou absoluto */
export function surfaces(f, box, n = 40, o = {}) {
  const G = grid(f, box, n);
  const level = o.iso || (o.frac || 0.2) * G.max;
  return { plus: iso(G, level, 1), minus: iso(G, level, -1), level, max: G.max };
}
export const cube = (L, c = [0, 0, 0]) => [c[0] - L, c[1] - L, c[2] - L, c[0] + L, c[1] + L, c[2] + L];

/* ===================================================================
 * Funções radiais e distribuição radial P(r) = r²R²
 * =================================================================== */
export const RADIAL = {
  '1s': (r) => 2 * Math.exp(-r),
  '2s': (r) => (1 / (2 * Math.SQRT2)) * (2 - r) * Math.exp(-r / 2),
  '2p': (r) => (1 / (2 * Math.sqrt(6))) * r * Math.exp(-r / 2),
};
export const radialDist = (k, r) => r * r * RADIAL[k](r) ** 2;

/* ===================================================================
 * Combinações de dois centros (LCAO) para o laboratório de sobreposição
 * kind: 'ss' | 'sp' | 'ppf' (frontal) | 'ppl' (lateral); phase: +1 / −1
 * =================================================================== */
export function pair(kind, R, phase = 1) {
  const A = [-R / 2, 0, 0], B = [R / 2, 0, 0];
  let fa, fb;
  if (kind === 'ss') { fa = s1(A); fb = s1(B); }
  else if (kind === 'sp') { fa = s1(A); fb = p2([-1, 0, 0], B); }
  else if (kind === 'ppf') { fa = p2([1, 0, 0], A); fb = p2([-1, 0, 0], B); }
  else { fa = p2([0, 0, 1], A); fb = p2([0, 0, 1], B); }
  const f = (x, y, z) => fa(x, y, z) + phase * fb(x, y, z);
  const L = kind === 'ss' ? 3.6 : 11.5;
  return { f, fa, fb, box: [-R / 2 - L, -L, -L, R / 2 + L, L, L], A, B, iso: kind === 'ss' ? 0.07 : 0.016 };
}
export const PAIR_INFO = {
  ss: { b: 'σ (1s + 1s)', a: 'σ* (1s − 1s)' }, sp: { b: 'σ (s + p frontal)', a: 'σ* (s − p)' },
  ppf: { b: 'σ (p + p frontal)', a: 'σ* (p − p frontal)' }, ppl: { b: 'π (p + p lateral)', a: 'π* (p − p lateral)' },
};
