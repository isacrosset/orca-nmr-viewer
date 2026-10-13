/*
 * core.js — camada de interface sobre o motor: desenho com cores de papel
 * (cadeia principal = ciano, substituintes = laranja, grupo principal =
 * magenta), destaque por função, átomos clicáveis, visualizador 3D e
 * explicação passo a passo gerada a partir da análise do nome.
 */
import { h } from './widgets2d.js';
import { el as sel } from './chem2d.js';
import { drawSVG } from './depict.js';
import { M } from './lib.js';
import { FG_INFO, FUNCTIONS } from './chem.js';
import { STEM, PRIO_NAME, rankParents } from './namer.js';
import { layout } from './depict.js';
import { Viewer, Mol } from './viewer3d.js';
import { embed } from './embed3d.js';

export { M };
export const cls = (t) => (t === 'fenol' ? 'alcool' : t);
export const FGCOL = {
  acido: 0xff5c6c, ester: 0xffb86b, amida: 0xb18cff, nitrila: 0x5eead4, aldeido: 0xffd45c, cetona: 0xff8fd0, alcool: 0x5b8cff, fenol: 0x93c5fd,
  amina: 0x34d399, eter: 0xe9b8ff, nitro: 0xff7a45, haleto: 0xa3e635, alceno: 0x67e8f9, alcino: 0x22d3ee, aromatico: 0xc4b5fd,
};
export const SUFX = { acido: 'ácido …-oico', ester: '…-oato de …ila', amida: '…-amida', nitrila: '…-nitrila', aldeido: '…-al', cetona: '…-ona', alcool: '…-ol', amina: '…-amina' };
export const PREFX = { acido: 'carboxi-', amida: 'carbamoil-', nitrila: 'ciano-', aldeido: 'formil- / oxo-', cetona: 'oxo-', alcool: 'hidroxi-', amina: 'amino-', eter: 'alcóxi- (metoxi-, etoxi-)', haleto: 'fluoro-, cloro-, bromo-, iodo-', nitro: 'nitro-' };

/* ===================================================================
 * Papéis dos átomos
 * =================================================================== */
export function fgSet(f) { return new Set([...f.atoms, f.site]); }
export function roles(X) {
  const r = X.r, chain = new Set(r.ok ? r.parent.P : []), princ = new Set(), sub = new Set(), num = {};
  if (!r.ok) return { chain, princ, sub, num };
  r.parent.P.forEach((a, k) => { num[a] = k + 1; });
  if (r.princType) {
    X.fgs.filter((f) => cls(f.type) === r.princType).forEach((f) => {
      const onParent = r.princType === 'amina' ? f.cs.some((c) => chain.has(c)) : r.princType === 'ester' ? true : chain.has(f.site) || X.m.nb[f.site].some(({ j }) => chain.has(j) && r.isRing);
      if (onParent) f.atoms.forEach((a) => princ.add(a));
    });
  }
  r.subs.concat(r.nsubs || []).forEach((s) => s.atoms.forEach((a) => { if (!princ.has(a)) sub.add(a); }));
  if (r.ester) r.ester.alkylAtoms.forEach((a) => sub.add(a));
  return { chain, princ, sub, num };
}

/* ===================================================================
 * Desenho
 * o.color: 'roles' | 'fg' | 'chain' | null; o.num: localizadores; o.full; o.scale
 * =================================================================== */
export function draw(X, o = {}) {
  if (typeof X === 'string') X = M(X);
  const m = X.m, hl = {}, bondCls = {}, halo = {};
  const key = (a, b) => Math.min(a, b) + '-' + Math.max(a, b);
  if (o.color === 'roles' || o.color === 'chain') {
    const R = roles(X);
    m.bonds.forEach((b) => {
      const k = key(b.a, b.b);
      if (o.color === 'roles' && R.princ.has(b.a) && R.princ.has(b.b)) bondCls[k] = 'fg';
      else if (o.color === 'roles' && (R.princ.has(b.a) && R.chain.has(b.b) || R.princ.has(b.b) && R.chain.has(b.a)) && m.atoms[b.a].el !== m.atoms[b.b].el) bondCls[k] = 'fg';
      else if (R.chain.has(b.a) && R.chain.has(b.b)) bondCls[k] = 'mc';
      else if (o.color === 'roles' && (R.sub.has(b.a) || R.sub.has(b.b))) bondCls[k] = 'sub';
    });
    if (o.color === 'roles') {
      m.atoms.forEach((a, i) => { if (a.el === 'C') return; if (R.princ.has(i)) hl[i] = 'fg'; else if (R.sub.has(i)) hl[i] = 'sub'; });
      R.princ.forEach((i) => { if (m.atoms[i].el === 'C') halo[i] = 'm'; });
    }
  }
  if (o.color === 'fg') {
    const only = o.only ? new Set(o.only) : null;
    X.fgs.forEach((f) => {
      if (only && !only.has(f.type)) return;
      const S = fgSet(f), c = FG_INFO[f.type].c;
      m.bonds.forEach((b) => { if (S.has(b.a) && S.has(b.b) && (['aromatico', 'alceno', 'alcino'].includes(f.type) || m.atoms[b.a].el !== 'C' || m.atoms[b.b].el !== 'C')) bondCls[key(b.a, b.b)] = c; });
      f.atoms.forEach((i) => { if (m.atoms[i].el !== 'C') hl[i] = c; });
      if (['acido', 'ester', 'amida', 'aldeido', 'cetona', 'nitrila'].includes(f.type)) halo[f.site] = c;
    });
  }
  Object.assign(hl, o.hl || {});
  Object.assign(bondCls, o.bondCls || {});
  Object.assign(halo, o.halo || {});
  let num = null;
  if (o.num) { num = {}; const R = roles(X); Object.assign(num, o.num === true ? R.num : o.num); }
  return drawSVG(m, o.P2 || X.P2, { full: o.full, hl, bondCls, halo, num, lab: o.lab, scale: o.scale || 40, fs: o.fs || 17, zoom: o.zoom || 1.15, maxw: o.maxw, alt: o.alt || X.name || 'estrutura' });
}
export function fig(X, cap, o = {}) {
  if (typeof X === 'string') X = M(X);
  return h('figure', { class: 'fig' + (o.cls ? ' ' + o.cls : '') }, draw(X, o), cap === undefined ? null : h('figcaption', { html: cap === true ? nameHTML(X) : cap }));
}

/* ===================================================================
 * Átomos clicáveis sobre o SVG
 * =================================================================== */
export function pickable(svg, idxs, onPick, o = {}) {
  const C = svg._chem, g = sel('g', { transform: C.transform }, svg), map = {};
  idxs.forEach((i) => {
    const a = C.atoms[i]; if (!a) return;
    const gg = sel('g', { class: 'pk', tabindex: 0, role: 'button', 'aria-label': (o.label ? o.label(i) : 'átomo ' + (i + 1)) }, g);
    sel('circle', { cx: a.x, cy: a.y, r: Math.max(o.r || 13, (a.w || 0) / 2 + 5) }, gg);
    const fire = (e) => { e.preventDefault(); onPick(i, gg); };
    gg.addEventListener('click', fire);
    gg.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') fire(e); });
    map[i] = gg;
  });
  return {
    el: (i) => map[i],
    set(i, c, on = true) { if (map[i]) map[i].classList.toggle(c, on); },
    clear(...cs) { Object.values(map).forEach((x) => x.classList.remove(...(cs.length ? cs : ['on', 'ok', 'bad', 'miss']))); },
    note(i, txt, cl = 'pknote') { const a = C.atoms[i]; const t = sel('text', { x: a.x, y: a.y - 18, class: cl, 'text-anchor': 'middle' }, g); t.textContent = txt; return t; },
    g,
  };
}

/* ===================================================================
 * Nome colorido (prefixos | cadeia | insaturação | sufixo)
 * =================================================================== */
export function splitName(X) {
  const r = X.r; if (!r.ok) return [{ t: X.name || '?', c: '' }];
  let name = r.name;
  const out = [];
  if (r.ester) {
    const [acyl, alk] = name.split(' de ');
    const sub = splitParent(acyl, X, true);
    return sub.concat([{ t: ' de ', c: '' }, { t: alk, c: 'p-alk' }]);
  }
  let acid = false;
  if (name.startsWith('ácido ')) { acid = true; name = name.slice(6); out.push({ t: 'ácido ', c: 'p-suf' }); }
  return out.concat(splitParent(name, X, false, acid));
}
function splitParent(name, X, ester) {
  const r = X.r, out = [];
  let stem = r.isRing ? (r.arom ? r.parts.stem : 'ciclo' + STEM[r.parent.P.length]) : STEM[r.parent.P.length];
  if (r.arom) {
    const i = name.lastIndexOf(stem.replace(/^ácido /, ''));
    if (i > 0) out.push({ t: name.slice(0, i), c: 'p-pre' });
    out.push({ t: name.slice(Math.max(0, i)), c: r.princType ? 'p-suf' : 'p-stem' });
    return out;
  }
  let i = name.lastIndexOf(stem.replace('ciclohex', 'ciclo-hex'));
  if (stem === 'ciclohex' || stem.startsWith('ciclo')) { const j = name.lastIndexOf(stem.replace(/^ciclo(h)/, 'ciclo-$1')); if (j >= 0) { i = j; stem = stem.replace(/^ciclo(h)/, 'ciclo-$1'); } }
  if (i < 0) return [{ t: name, c: '' }];
  if (i > 0) out.push({ t: name.slice(0, i), c: 'p-pre' });
  out.push({ t: stem, c: 'p-stem' });
  let rest = name.slice(i + stem.length);
  const sm = /^(a?(?:-[\d,]+-)?(?:di|tri)?(?:an|en|in)(?:-[\d,]+-(?:di|tri)?in)?)(.*)$/.exec(rest);
  if (sm) { out.push({ t: sm[1], c: 'p-inf' }); rest = sm[2]; }
  if (rest) out.push({ t: rest, c: 'p-suf' });
  void ester;
  return out;
}
export function nameHTML(X, o = {}) {
  if (typeof X === 'string') X = M(X);
  if (!X.name) return X.usual || '?';
  if (o.plain) return X.name;
  return '<span class="nm">' + splitName(X).map((p) => `<span class="${p.c}">${p.t}</span>`).join('') + '</span>';
}

/* ===================================================================
 * Explicação passo a passo (derivada do motor)
 * =================================================================== */
const ord = (n) => n + 'º';
export function funcList(X) {
  const seen = new Map();
  X.fgs.forEach((f) => { if (!FUNCTIONS.includes(f.type) && !['alceno', 'alcino', 'aromatico'].includes(f.type)) return; seen.set(f.type, (seen.get(f.type) || 0) + 1); });
  return [...seen.entries()].map(([t, n]) => ({ t, n, name: FG_INFO[t].n }));
}
export function explain(X) {
  if (typeof X === 'string') X = M(X);
  const r = X.r; if (!r.ok) return [];
  const steps = [], P = r.parent.P, n = P.length;
  const fl = funcList(X).filter((f) => FUNCTIONS.includes(f.t));
  if (fl.length) steps.push(`<b>Funções presentes:</b> ${fl.map((f) => f.name + (f.n > 1 ? ` (×${f.n})` : '')).join(', ')}.` + (r.princType ? ` <b>Função principal:</b> ${PRIO_NAME[r.princType]} → sufixo <span class="p-suf">${SUFX[r.princType]}</span>${fl.length > 1 ? '; as demais entram como prefixos' : ''}.` : ' Nenhuma função vai para o sufixo (haletos, nitro e éteres são sempre prefixos).'));
  else steps.push('<b>Função:</b> hidrocarboneto (só C e H) — o nome termina em <b>-o</b> (ano/eno/ino).');
  if (r.ester) steps.push(`<b>Éster:</b> separe a parte ácida (acila, com a C=O: <span class="p-stem">${n} C</span>) da parte alquila ligada ao O (<span class="p-alk">${r.ester.alkName}</span>). Nome: <i>…oato de …ila</i>.`);
  if (r.arom) steps.push(`<b>Estrutura principal:</b> anel benzênico${r.princType ? ' com nome retido (' + r.parts.stem + ')' : ' (benzeno)'}.`);
  else if (r.isRing) steps.push(`<b>Estrutura principal:</b> anel de ${n} carbonos → <span class="p-stem">ciclo${STEM[n]}</span>. (Anel com ≥ tantos C quanto a cadeia lateral: na IUPAC 2013, o anel é sempre preferido.)`);
  else {
    const why = [];
    if (r.princType && !r.ester) why.push('contém o carbono da função principal');
    if (r.parent.ml.length) why.push('contém as ligações múltiplas');
    why.push('é a mais longa possível com essas condições');
    steps.push(`<b>Cadeia principal:</b> ${n} carbono${n > 1 ? 's' : ''} → prefixo <span class="p-stem">${STEM[n]}</span> (${why.join('; ')}).`);
  }
  if (n > 1 && !r.arom) {
    const parts = [];
    if (r.parent.pl.length) parts.push(`grupo principal em C${r.parent.pl.join(', C')}`);
    if (r.parent.dl.length) parts.push(`dupla(s) em ${r.parent.dl.join(', ')}`);
    if (r.parent.tl.length) parts.push(`tripla(s) em ${r.parent.tl.join(', ')}`);
    if (r.subs.length) parts.push(`substituintes em ${r.subs.map((s) => s.loc).sort((a, b) => a - b).join(', ')}`);
    const first = r.princType ? 'o grupo principal' : r.parent.ml.length ? 'as ligações múltiplas' : 'os substituintes';
    steps.push(`<b>Numeração:</b> ${r.isRing ? 'no anel, C1 é o carbono do grupo principal (ou de um substituinte) e segue-se o sentido de menores localizadores' : 'comece pela extremidade que dá o menor localizador a ' + first}: ${parts.join('; ') || 'sem localizadores necessários'}.`);
  } else if (r.arom && r.subs.length > 1) steps.push(`<b>Numeração:</b> no anel, menores localizadores para o conjunto: ${r.subs.map((s) => s.loc).sort((a, b) => a - b).join(', ')}${r.princType ? ' (C1 = carbono que leva o grupo do nome retido)' : ''}.`);
  const all = r.subs.concat(r.nsubs || []);
  if (all.length) steps.push(`<b>Substituintes:</b> ${all.map((s) => `<span class="p-pre">${s.name}</span> em ${s.loc === 'N' ? 'N' : 'C' + s.loc}`).join('; ')}. Ordem alfabética (sem contar di, tri, sec, terc): ${r.parts.prefixes.map((p) => '<span class="p-pre">' + p + '</span>').join(', ')}.`);
  else steps.push('<b>Substituintes:</b> nenhum.');
  steps.push(`<b>Nome:</b> ${nameHTML(X)}` + (r.aliases && r.aliases.length ? ` <small class="muted">(também aceito: ${r.aliases.slice(0, 2).join('; ')})</small>` : '') + (X.usual && !X.usual.startsWith(X.name) ? ` <small class="muted">· ${X.usual}</small>` : ''));
  return steps;
}

/* ===================================================================
 * 3D
 * =================================================================== */
const E3 = new Map();
export function emb(X) { if (!E3.has(X.smi)) E3.set(X.smi, embed(X.m, X.P2)); return E3.get(X.smi); }
export const vbox = (c = '') => h('div', { class: 'viewer ' + c });
const ROLECOL = { chain: 0x2fd4f5, sub: 0xff9f43, princ: 0xff4fa3 };
export function view3d(host, X, o = {}) {
  if (typeof X === 'string') X = M(X);
  const E = emb(X);
  const v = new Viewer(host, { dist: o.dist || Math.max(8, Math.sqrt(E.heavy) * 3.4), autoRotate: !!o.spin, hint: o.hint !== false, alt: 'Modelo 3D: ' + (X.name || X.usual || '') });
  const mol = new Mol(v, E.atoms.map((a) => ({ el: a.el, p: a.p.slice() })), E.bonds, { style: o.style || 'ball' });
  const st = { mode: 'cpk', H: true, nums: [], halos: [] };
  const api = {
    v, mol, X, E,
    color(mode) {
      st.mode = mode; if (!v.ok) return;
      const R = roles(X), heavy = E.heavy;
      mol.meshes.forEach((me, i) => {
        let c = null;
        if (i < heavy) {
          if (mode === 'roles') c = R.princ.has(i) ? ROLECOL.princ : R.chain.has(i) ? ROLECOL.chain : R.sub.has(i) ? ROLECOL.sub : null;
          if (mode === 'chain') c = R.chain.has(i) ? ROLECOL.chain : null;
          if (mode === 'fg') { const f = X.fgs.find((g) => FUNCTIONS.includes(g.type) && fgSet(g).has(i) && (X.m.atoms[i].el !== 'C' || ['acido', 'ester', 'amida', 'aldeido', 'cetona', 'nitrila'].includes(g.type) && g.site === i)); if (f) c = FGCOL[f.type]; }
          if (mode === 'hetero' && X.m.atoms[i].el !== 'C') c = 0xffd45c;
        }
        const base = { H: 0xf2f5fa, C: 0x6b7280, N: 0x3b6cf6, O: 0xef3b3b, F: 0x90e050, Cl: 0x2fd06a, Br: 0xa5432a, I: 0x8b2fc9 }[E.atoms[i].el] || 0x999999;
        me.material.color.setHex(c ?? base);
        me.material.emissive && me.material.emissive.setHex(c ? (c & 0x3f3f3f) : 0x000000);
      });
    },
    numbers(on) {
      st.nums.forEach((l) => mol.setLabel(l, null)); st.nums = [];
      if (!on || !v.ok) return;
      Object.entries(roles(X).num).forEach(([i, k]) => st.nums.push(mol.addLabel(+i, String(k), 'tag c', [0, 0.62, 0])));
    },
    hideH(hide) { st.H = !hide; E.atoms.forEach((a, i) => { if (a.el === 'H') mol.atoms[i].hidden = hide; }); mol.update(); },
    style(s) { mol.setStyle(s); },
  };
  if (o.color) api.color(o.color);
  if (o.numbers) api.numbers(true);
  return api;
}

/* ===================================================================
 * utilidades
 * =================================================================== */
export const pickN = (arr, n) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, n); };
export const rnd = (arr) => arr[Math.floor(Math.random() * arr.length)];
export function legend(items) { return h('div', { class: 'legend' }, items.map(([c, t]) => h('span', null, h('i', { style: `background:${c}` }), t))); }
export const ROLE_LEGEND = () => legend([['var(--cyan)', 'cadeia principal'], ['var(--orange)', 'substituintes'], ['var(--magenta)', 'grupo funcional principal']]);
export const hex = (c) => '#' + c.toString(16).padStart(6, '0');

/* layout "despistado": desenha na horizontal uma cadeia que NÃO é a principal
 * (para os simuladores não entregarem a resposta pelo desenho) */
const DEC = new Map();
export function decoy(X) {
  if (DEC.has(X.smi)) return DEC.get(X.smi);
  const all = rankParents(X.m), best = all[0], bs = new Set(best ? best.P : []);
  const alt = all.filter((e) => e.cand.type === 'chain' && e.P.length >= 3 && !(e.P.length === bs.size && e.P.every((x) => bs.has(x)))).sort((a, b) => b.P.length - a.P.length)[0];
  const P2 = alt ? layout(X.m, alt.P) : X.P2;
  DEC.set(X.smi, P2);
  return P2;
}
