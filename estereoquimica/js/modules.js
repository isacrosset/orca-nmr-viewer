/*
 * modules.js — componentes interativos dos módulos conceituais:
 * isomeria, quiralidade, centros estereogênicos, enantiômeros,
 * diastereoisômeros, meso, regras CIP e configuração R/S.
 * Todas as figuras são geradas do mesmo modelo (stereo.js).
 */
import { h, seg, shuffle, tgl } from './widgets2d.js';
import { mol as render } from './chem2d.js';
import { Z } from './build.js';
import { LIB } from './library.js';
import { V, makeMol, withCfg, mirrorMol, nameOf, cfgString, formula, meso, relation, rankCenter, explainCenter, ligLabel, glab } from './stereo.js';
import { wedgeS, wedgeSVG, fischerSVG, ORIENT } from './draw.js';
import { molView, mirrorScene, pairScene, fischer3D, rotReflScene, branch, PCOL } from './scenes.js';
import { exerciseCard, sortable } from './practice.js';

/* ---------- utilidades ---------- */
export const M = (k, cfg) => (cfg ? withCfg(LIB[k], cfg) : makeMol(LIB[k]));
export const vbox = (cls = '') => h('div', { class: 'viewer ' + cls });
export const fig = (node, cap) => h('figure', { class: 'fig' }, node, cap ? h('figcaption', { html: cap }) : null);
export const pick = (a) => a[Math.floor(Math.random() * a.length)];
export function select(opts, cur, on, label) {
  const s = h('select', { 'aria-label': label || 'Escolha' }, opts.map(([k, t]) => h('option', { value: k, selected: k === cur ? 'selected' : null }, t)));
  s.addEventListener('change', () => on(s.value));
  return s;
}
export const fbBox = () => h('div', { class: 'fb neutral', 'aria-live': 'polite', style: 'display:none' });
export function setFb(el, cls, html) { el.style.display = ''; el.className = 'fb ' + cls; el.innerHTML = html; }
const btn = (t, f, cls = '') => h('button', { class: 'btn sm ' + cls, type: 'button', onclick: f }, t);
const PNAME = ['1', '2', '3', '4'];
/** legenda das cores de prioridade */
export const prioLegend = () => h('div', { class: 'legend' }, ...[0, 1, 2, 3].map((k) => h('span', null, h('i', { class: 'pdot p' + (k + 1) }), `prioridade ${k + 1}`)), h('span', null, h('i', { class: 'pdot c' }), 'centro estereogênico'));
const sk = (s) => render(s, { scale: 34, fs: 15 });
const sty = (d) => (d === 'R' ? '<b class="rc">R</b>' : d === 'S' ? '<b class="sc">S</b>' : '—');
export const descHTML = (mol) => mol.C.map((c, k) => (mol.desc[k] ? `C${mol.spec.loc[k]} = ${sty(mol.desc[k])}` : null)).filter(Boolean).join(' · ') || 'sem centros estereogênicos';
export function chiralTag(mol) {
  if (!mol.centers.length) return '<span class="chip">aquiral (sem centro estereogênico)</span>';
  return meso(mol) ? '<span class="chip mesoc">meso · aquiral</span>' : '<span class="chip ok">quiral</span>';
}

/* ===================================================================
 * Tela inicial
 * =================================================================== */
export function hero(host) {
  const R = M('butanol2'), Sm = mirrorMol(R);
  const a = vbox('short'), c = vbox('short');
  const wd = h('div', { class: 'projbox herowedge' },
    fig(wedgeSVG(R, { prio: R.centers[0], scale: 40 }), '(R)-butan-2-ol'),
    h('span', { class: 'mirrorbar', 'aria-hidden': 'true' }),
    fig(wedgeSVG(Sm, { prio: Sm.centers[0], scale: 40, orient: 'turn' }), '(S)-butan-2-ol'));
  host.append(fig(a, 'molécula quiral e sua <b>imagem especular</b>'), fig(wd, 'cunha e tracejado · números = prioridades CIP'), fig(c, 'modelo 3D manipulável'));
  const ms = mirrorScene(a, R);

  const mv = molView(c, R, { camPos: [0, 0.8, 9], autoRotate: true });
  if (mv.ok) mv.setPrio(R.centers[0]);
}

/* ===================================================================
 * Árvore da isomeria
 * =================================================================== */
const ISO = {
  isomeros: { t: 'Isômeros', d: 'Compostos diferentes com a <b>mesma fórmula molecular</b>.', ex: () => [fig(sk(Z(4)), 'butano · C₄H₁₀'), fig(sk(Z(3, { sub: { 1: [['']] } })), '2-metilpropano · C₄H₁₀')] },
  const: { t: 'Constitucionais', d: 'Mesma fórmula, <b>conectividade diferente</b> (átomos ligados em outra ordem).', ex: () => [fig(sk(Z(4)), 'butano'), fig(sk(Z(3, { sub: { 1: [['']] } })), '2-metilpropano')] },
  cadeia: { t: 'de cadeia', d: 'Esqueleto carbônico diferente (linear × ramificado).', ex: () => [fig(sk(Z(5)), 'pentano'), fig(sk(Z(4, { sub: { 1: [['']] } })), '2-metilbutano')] },
  posicao: { t: 'de posição', d: 'Mesmo esqueleto e mesmo grupo funcional, em <b>posição</b> diferente.', ex: () => [fig(sk(Z(4, { lab: { 3: 'OH' } })), 'propan-1-ol'), fig(sk(Z(3, { sub: { 1: [['OH']] } })), 'propan-2-ol')] },
  funcao: { t: 'de função', d: 'Grupos funcionais diferentes.', ex: () => [fig(sk(Z(3, { lab: { 2: 'OH' } })), 'etanol (álcool)'), fig(sk(Z(3, { lab: { 1: 'O' } })), 'éter dimetílico')] },
  estereo: { t: 'Estereoisômeros', d: 'Mesma conectividade, <b>arranjo espacial diferente</b> — não se interconvertem por rotação de ligações simples.', ex: () => { const R = M('butanol2'); return [fig(wedgeSVG(R, { scale: 34 }), '(R)-butan-2-ol'), fig(wedgeSVG(mirrorMol(R), { scale: 34 }), '(S)-butan-2-ol')]; } },
  enant: { t: 'Enantiômeros', d: 'Imagens especulares <b>não sobreponíveis</b>: todos os centros invertidos.', ex: () => [fig(fischerSVG(M('dibromobutano', ['R', 'R']), { labels: true, maxw: 150 }), '(2R,3R)'), fig(fischerSVG(M('dibromobutano', ['S', 'S']), { labels: true, maxw: 150 }), '(2S,3S)')] },
  diast: { t: 'Diastereoisômeros', d: 'Estereoisômeros que <b>não</b> são imagens especulares: só parte dos centros invertida.', ex: () => [fig(fischerSVG(M('bromocloro', ['R', 'R']), { labels: true, maxw: 150 }), '(2R,3R)'), fig(fischerSVG(M('bromocloro', ['R', 'S']), { labels: true, maxw: 150 }), '(2R,3S)')] },
  meso: { t: 'meso (caso especial)', d: 'Tem centros estereogênicos, mas é <b>aquiral</b>: possui plano de simetria interno; é diastereoisômero das formas quirais.', ex: () => [fig(fischerSVG(M('tartarico', ['R', 'S']), { labels: true, maxw: 160 }), 'ácido meso-tartárico')] },
  cistrans: { t: 'cis/trans', d: 'Diastereoisômeros em alcenos e anéis (rotação impedida).', ex: () => [fig(sk((() => { const s = Z(4, { dbl: [1] }); return s; })()), 'but-2-eno (trans)')] },
};
export function isoTree(host) {
  const panel = h('div', { class: 'itree-panel', 'aria-live': 'polite' });
  const node = (k, cls = '') => h('button', { class: 'inode ' + cls, type: 'button', 'data-k': k, onclick: () => show(k) }, ISO[k].t);
  const tree = h('div', { class: 'itree' },
    h('div', { class: 'lvl' }, node('isomeros', 'root')),
    h('div', { class: 'lvl two' },
      h('div', { class: 'col' }, node('const', 'o'), h('div', { class: 'lvl three' }, node('cadeia', 'o sm'), node('posicao', 'o sm'), node('funcao', 'o sm'))),
      h('div', { class: 'col' }, node('estereo', 'm'), h('div', { class: 'lvl three' }, node('enant', 'm sm'), node('diast', 'm sm')), h('div', { class: 'lvl three' }, node('meso', 'g sm'), node('cistrans', 'g sm')))));
  host.append(tree, panel);
  function show(k) {
    tree.querySelectorAll('.inode').forEach((b) => b.setAttribute('aria-pressed', b.dataset.k === k));
    panel.innerHTML = '';
    panel.append(h('h4', null, ISO[k].t), h('p', { html: ISO[k].d }), h('div', { class: 'figs' }, ISO[k].ex()));
  }
  show('isomeros');
}

/* ===================================================================
 * Atividades de classificação de pares
 * =================================================================== */
export function constActivity(host) {
  const R = M('butanol2');
  const defs = [
    { title: 'Mesma conectividade?', type: 'mc', q: 'Butano e 2-metilpropano (ambos C₄H₁₀):', fig: [{ svg: () => sk(Z(4)), cap: 'butano' }, { svg: () => sk(Z(3, { sub: { 1: [['']] } })), cap: '2-metilpropano' }], o: ['conectividade diferente → isômeros constitucionais (de cadeia)', 'mesma conectividade → estereoisômeros', 'a mesma molécula'], a: 0, e: 'No butano todos os C estão em sequência; no 2-metilpropano um C está ligado a três outros.' },
    { title: 'Mesma conectividade?', type: 'mc', q: 'Propan-1-ol e propan-2-ol:', fig: [{ svg: () => sk(Z(4, { lab: { 3: 'OH' } })), cap: 'propan-1-ol' }, { svg: () => sk(Z(3, { sub: { 1: [['OH']] } })), cap: 'propan-2-ol' }], o: ['conectividade diferente → isômeros de posição', 'mesma conectividade', 'isômeros de função'], a: 0, e: 'O OH está ligado a C1 em um e a C2 no outro.' },
    { title: 'Mesma conectividade?', type: 'mc', q: 'Etanol e éter dimetílico (C₂H₆O):', fig: [{ svg: () => sk(Z(3, { lab: { 2: 'OH' } })), cap: 'etanol' }, { svg: () => sk(Z(3, { lab: { 1: 'O' } })), cap: 'éter dimetílico' }], o: ['conectividade diferente → isômeros de função', 'estereoisômeros', 'a mesma molécula'], a: 0, e: 'Álcool (C–O–H) × éter (C–O–C).' },
    { title: 'Mesma conectividade?', type: 'mc', q: 'As duas estruturas abaixo:', fig: [{ svg: () => wedgeSVG(R, { scale: 34 }), cap: 'A' }, { svg: () => wedgeSVG(mirrorMol(R), { scale: 34 }), cap: 'B' }], o: ['mesma conectividade, arranjo espacial diferente → estereoisômeros', 'conectividade diferente', 'a mesma molécula'], a: 0, e: 'Os mesmos átomos estão ligados aos mesmos vizinhos; só a orientação de OH/H no C2 muda (cunha × tracejado).' },
  ];
  defs.forEach((d, i) => host.append(exerciseCard(d, 'A' + (i + 1))));
}

/* ===================================================================
 * Rotação não muda a identidade · rotação × reflexão
 * =================================================================== */
export function rotRefl(host, o = {}) {
  const v = vbox();
  const info = h('p', { class: 'hint3' }, 'Girar a molécula não muda o descritor; refletir (espelho) inverte R ↔ S.');
  host.append(v, h('div', { class: 'controls' }, btn('⟳ Girar 360°', () => sc.rotate(), 'primary'), o.rotateOnly ? null : btn('⇋ Refletir', () => sc.reflect(), 'accent')), info);
  const sc = rotReflScene(v, M(o.key || 'butanol2'));
}

/* ===================================================================
 * "São a mesma molécula?" — girar, sobrepor e verificar
 * =================================================================== */
const SAME = [
  ['butanol2', 'R', 'R', 'butan-2-ol: A e B'],
  ['butanol2', 'R', 'S', 'butan-2-ol: A e B'],
  ['bromobutano2', 'S', 'S', '2-bromobutano: A e B'],
  ['lactico', 'S', 'R', 'ácido lático: A e B'],
  ['bcf', 'R', 'R', 'bromoclorofluorometano: A e B'],
  ['bcf', 'R', 'S', 'bromoclorofluorometano: A e B'],
];
export function sameMol(host) {
  const v = vbox('tall');
  const fb = fbBox(), q = h('p', { class: 'prompt' });
  let i = 0, sc = null, cur = null, guessed = null;
  const guess = h('div', { class: 'controls' }, h('b', null, 'Seu palpite:'),
    btn('São idênticas', () => setGuess('id')), btn('Não são sobreponíveis', () => setGuess('no')));
  const rot = h('div', { class: 'controls' }, h('span', { class: 'hint3' }, 'Girar B:'),
    ...[['x', 'x'], ['y', 'y'], ['z', 'z']].map(([ax, t]) => btn(`↻ ${t} 90°`, () => sc.rotB(ax === 'x' ? [1, 0, 0] : ax === 'y' ? [0, 1, 0] : [0, 0, 1], 90))),
    btn('✔ Verificar sobreposição', () => check(), 'primary'), btn('Próximo par →', () => load(i + 1)));
  host.append(q, v, rot, guess, fb);
  function setGuess(g) { guessed = g; guess.querySelectorAll('button').forEach((b, k) => b.setAttribute('aria-pressed', (k === 0) === (g === 'id'))); }
  function load(k) {
    i = (k + SAME.length) % SAME.length; guessed = null; fb.style.display = 'none';
    const [key, a, b, t] = SAME[i];
    const A = M(key, [a]), B = M(key, [b]);
    cur = { A, B };
    q.innerHTML = `<b>Par ${i + 1}/${SAME.length}</b> · ${t}. Gire B (botões ou arraste a cena) e tente fazê-la coincidir com A. Depois verifique.`;
    const r0 = [Math.random() * 3, Math.random() * 3, Math.random() * 3];
    if (!sc) sc = pairScene(v, A, B, { rotInit: r0 }); else sc.set(A, B, r0);
    guess.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', 'false'));
  }
  function check() {
    sc.check((r) => {
      const same = r && r.rmsd < 0.15;
      const ok = guessed === null ? null : (guessed === 'id') === same;
      setFb(fb, same ? 'ok' : 'bad', `${ok === null ? '' : ok ? '✔ Seu palpite estava certo. ' : '✘ Seu palpite não se confirmou. '}<b>${same ? 'Idênticas' : 'Não sobreponíveis'}</b>: ${same ? 'todos os átomos coincidem — é a mesma molécula, apenas girada.' : `mesmo na melhor sobreposição, ${r.bad} átomo(s) (em vermelho) ficam fora do lugar. A tem ${cfgString(cur.A)}, B tem ${cfgString(cur.B)}: são enantiômeros.`}`);
    });
  }
  load(0);
}

/* ===================================================================
 * Mãos: analogia da quiralidade
 * =================================================================== */
export function hands(host) {
  const L = h('span', { class: 'hand' }, '🖐'), R = h('span', { class: 'hand flip' }, '🖐');
  const stage = h('div', { class: 'hands' }, L, h('span', { class: 'mirrorbar' }), R);
  const fb = fbBox();
  host.append(stage, h('div', { class: 'controls' }, btn('Tentar sobrepor', () => { stage.classList.add('over'); setFb(fb, 'bad', 'Palma sobre palma, os polegares ficam em lados opostos; virando uma das mãos, as palmas ficam opostas. <b>Não há como sobrepor</b>: as mãos são <b>quirais</b> (do grego <i>cheir</i>, mão).'); }, 'primary'), btn('⟲', () => { stage.classList.remove('over'); fb.style.display = 'none'; })), fb);
}

/* ===================================================================
 * Espelho virtual 3D
 * =================================================================== */
const MIRROR_KEYS = ['bcf', 'butanol2', 'lactico', 'alanina', 'propan2ol', 'diclorometano', 'dibromobutano', 'diclorobutano'];
export function mirror(host, o = {}) {
  const keys = o.keys || MIRROR_KEYS;
  const v = vbox('tall'), fb = fbBox(), info = h('div', { class: 'readout' });
  let key = o.key || keys[0], sc = null, mol = null, shown = false;
  const showB = btn('🪞 Mostrar imagem especular', () => { shown = true; sc.showImage(true); showB.disabled = true; ov.disabled = false; }, 'accent');
  const ov = btn('⧉ Tentar sobrepor', () => {
    ov.disabled = true;
    sc.overlay((r) => {
      const sup = r.rmsd < 0.15;
      setFb(fb, sup ? 'ok' : 'bad', sup
        ? `<b>Sobreponível</b> → a molécula é <b>aquiral</b>${mol.centers.length ? ' — apesar de ter centros estereogênicos: é uma forma <b>meso</b> (o espelho apenas troca os papéis dos dois centros).' : '.'}`
        : `<b>Não sobreponível</b> → a molécula é <b>quiral</b>: na melhor tentativa, ${r.bad} átomo(s) (em vermelho) não coincidem. Molécula e imagem são <b>enantiômeros</b>: ${cfgString(mol)} × ${cfgString(mirrorMol(mol))}.`);
    });
  });
  const reset = btn('⟲ Reiniciar', () => load(key));
  host.append(h('div', { class: 'controls' }, h('label', null, 'Molécula ', select(keys.map((k) => [k, (LIB[k].name || k).replace('{cfg}', '').replace('{meso}', '')]), key, (k) => load(k), 'Molécula'))), v, h('div', { class: 'controls' }, showB, ov, reset), info, fb);
  function load(k) {
    key = k; mol = M(k); shown = false; fb.style.display = 'none';
    if (!sc) sc = mirrorScene(v, mol); else sc.setMol(mol);
    sc.showImage(!!o.showNow); showB.disabled = !!o.showNow; ov.disabled = !o.showNow;
    info.innerHTML = `<span><b>${nameOf(mol)}</b></span><span>${formula(mol)}</span><span>${descHTML(mol)}</span>`;
  }
  load(key);
  void shown;
}

/* ===================================================================
 * 2-butanol: clique nos quatro grupos do centro
 * =================================================================== */
export function fourGroups(host) {
  const mol = M('butanol2'), c = mol.centers[0];
  const lig = mol.nb[c].map(([j]) => j), br = {}; lig.forEach((j) => { br[j] = new Set(branch(mol, c, j)); });
  const found = new Set();
  const v = vbox(), list = h('ol', { class: 'glist' }), fb = fbBox();
  const COL = [0xff9f43, 0xff4fa3, 0x3ddc97, 0x9fb0cc];
  host.append(h('div', { class: 'split' }, v, h('div', null, h('p', { html: 'Clique nos átomos do modelo para descobrir os <b>quatro grupos</b> ligados ao carbono destacado (C2).' }), list, fb, btn('⟲ Recomeçar', () => { found.clear(); paint(); fb.style.display = 'none'; }))));
  const mv = molView(v, mol, { camPos: [0, 0.6, 9], onPick: (i) => {
    if (i === c) { setFb(fb, 'neutral', 'Esse é o próprio centro (C2). Clique nos grupos ligados a ele.'); return; }
    const j = lig.find((x) => br[x].has(i)); if (j === undefined) return;
    found.add(j); paint();
    if (found.size === 4) setFb(fb, 'ok', '✔ Quatro grupos <b>diferentes</b> (OH, CH₂CH₃, CH₃, H) → C2 é um <b>centro estereogênico</b> (carbono assimétrico). Trocar quaisquer dois deles gera o outro estereoisômero.');
  } });
  function paint() {
    list.innerHTML = '';
    [...found].forEach((j, n) => { list.append(h('li', null, h('b', null, ligLabel(mol, c, j)))); if (mv.ok) br[j].forEach((a) => { mv.mol3.meshes[a].material.emissive.set(COL[n]); mv.mol3.meshes[a].material.emissiveIntensity = 0.5; }); });
    if (mv.ok && !found.size) mv.mol3.meshes.forEach((m) => m.material.emissive.set(0));
    for (let k = found.size; k < 4; k++) list.append(h('li', { class: 'dim' }, '?'));
  }
  paint();
}

/* ===================================================================
 * Clique em todos os centros estereogênicos
 * =================================================================== */
const CC_KEYS = ['propan2ol', 'butanol2', 'butanol1', 'metilhexano3', 'bromocloro', 'diclorobutano', 'clorometilhexanol', 'glicose'];
function whyNot(mol, c) {
  const nbs = mol.nb[c].map(([j]) => j);
  const nH = nbs.filter((j) => mol.atoms[j].el === 'H').length;
  if (nbs.length < 4) return 'não tem quatro ligantes (carbono sp²/sp)';
  if (nH >= 2) return `tem ${nH} átomos de H iguais`;
  const r = rankCenter(mol, c);
  for (let i = 0; i < 3; i++) {
    const a = r.trees[i], b = r.trees[i + 1];
    if (a && b && JSON.stringify(a.t) === JSON.stringify(b.t)) return `tem dois grupos iguais (${ligLabel(mol, c, a.j)} e ${ligLabel(mol, c, b.j)})`;
  }
  return 'dois de seus grupos são idênticos';
}
export function clickCenters(host) {
  const v = vbox('tall'), fb = fbBox(), q = h('p', { class: 'prompt' });
  let i = 0, mol = null, mv = null, sel = new Set(), halos = {};
  host.append(q, v, h('div', { class: 'controls' }, btn('✔ Conferir', () => check(), 'primary'), btn('Mostrar resposta', () => show()), btn('Próxima molécula →', () => load(i + 1))), fb);
  const carbonsOf = (m) => m.atoms.map((a, k) => k).filter((k) => m.atoms[k].el === 'C');
  function load(k) {
    i = (k + CC_KEYS.length) % CC_KEYS.length; mol = M(CC_KEYS[i]); sel = new Set(); halos = {}; fb.style.display = 'none';
    q.innerHTML = `<b>${i + 1}/${CC_KEYS.length} · ${nameOf(mol).replace(/\([^)]*\)-/, '')}</b> — clique em <b>todos</b> os carbonos que são centros estereogênicos (pode não haver nenhum). Clique de novo para desmarcar.`;
    if (!mv) mv = molView(v, mol, { centers: false, camPos: [0, 0.6, 12], onPick: toggle }); else mv.setMol(mol);
  }
  function toggle(a) {
    if (mol.atoms[a].el !== 'C') return;
    if (!halos[a]) halos[a] = mv.mol3.halo(a, 0xffd45c, 2.0);
    if (sel.has(a)) { sel.delete(a); halos[a].on = false; } else { sel.add(a); halos[a].on = true; }
    fb.style.display = 'none';
  }
  function check() {
    const C = new Set(mol.centers), ok = [...sel].filter((a) => C.has(a)), wrong = [...sel].filter((a) => !C.has(a)), miss = [...C].filter((a) => !sel.has(a));
    const nm = (a) => { const k = mol.C.indexOf(a); return k >= 0 ? 'C' + mol.spec.loc[k] : 'C (terminal)'; };
    const all = !wrong.length && !miss.length;
    setFb(fb, all ? 'ok' : 'bad', (all ? `✔ Perfeito: ${C.size} centro(s) estereogênico(s).` : `${ok.length} certo(s). `) +
      (wrong.length ? `<br>✘ Não são centros: ${wrong.map((a) => `${nm(a)} — ${whyNot(mol, a)}`).join('; ')}.` : '') +
      (miss.length ? `<br>Faltou ${miss.length}: procure carbonos sp³ com quatro grupos diferentes.` : '') +
      (all && meso(mol) ? '<br>Observação: a molécula tem centros estereogênicos, mas é <b>meso</b> (aquiral).' : ''));
    void carbonsOf;
  }
  function show() {
    mol.centers.forEach((a) => { if (!halos[a]) halos[a] = mv.mol3.halo(a, 0xffd45c, 2.0); halos[a].on = true; sel.add(a); });
    [...sel].forEach((a) => { if (!mol.centers.includes(a)) { halos[a].on = false; sel.delete(a); } });
    setFb(fb, 'neutral', `Centros: ${mol.centers.length ? mol.centers.map((a) => 'C' + mol.spec.loc[mol.C.indexOf(a)]).join(', ') : 'nenhum'}. ${descHTML(mol)}`);
  }
  load(0);
}

/* ===================================================================
 * Diastereoisômeros do 2,3-diclorobutano (três modelos lado a lado)
 * =================================================================== */
export function trio(host, o = {}) {
  const key = o.key || 'diclorobutano', cfgs = o.cfgs || [['R', 'R'], ['S', 'S'], ['R', 'S']];
  const mols = cfgs.map((c) => M(key, c));
  const grid = h('div', { class: 'grid' + mols.length });
  host.append(grid);
  mols.forEach((m) => {
    const v = vbox('short');
    grid.append(h('div', { class: 'chcard' }, v, h('div', { class: 'cardlab', html: `<b>${cfgString(m)}</b> ${chiralTag(m)}` }), h('div', { class: 'projbox small' }, fischerSVG(m, { labels: true, maxw: 150 }))));
    molView(v, m, { camPos: [0, 0.4, 11] });
  });
  if (o.table !== false) {
    const rows = [];
    for (let a = 0; a < mols.length; a++) for (let b = a + 1; b < mols.length; b++) { const r = relation(mols[a], mols[b]); rows.push(h('tr', null, h('td', null, `${cfgString(mols[a])} × ${cfgString(mols[b])}`), h('td', null, h('b', { class: 'rel-' + r.r.slice(0, 4) }, r.r)), h('td', null, r.t))); }
    host.append(h('div', { class: 'table-wrap' }, h('table', { class: 'cmp' }, h('thead', null, h('tr', null, h('th', null, 'Par'), h('th', null, 'Relação'), h('th', null, 'Por quê'))), h('tbody', null, rows))));
  }
}

/* ===================================================================
 * Comparador rápido de relações (pares gerados)
 * =================================================================== */
const REL_FAM = ['butanol2', 'bromobutano2', 'lactico', 'dibromobutano', 'bromocloro', 'metilpentanol', 'diclorobutano', 'tartarico', 'eritrose'];
const RELS = [['idênticas', 'mesma molécula'], ['constitucionais', 'isômeros constitucionais'], ['enantiômeros', 'enantiômeros'], ['diastereoisômeros', 'diastereoisômeros']];
const randCfg = (spec) => { const m = makeMol(spec); return m.desc.map((d) => (d ? pick(['R', 'S']) : null)); };
export function genPair(kind) {
  if (kind === 'const' || (!kind && Math.random() < 0.15)) { const [a, b] = pick([['butanol2', 'butanol1'], ['bromobutano2', 'bromobutano1']]); return { A: M(a), B: M(b) }; }
  const k = pick(REL_FAM), spec = LIB[k];
  const A = withCfg(spec, randCfg(spec));
  let B;
  const r = Math.random();
  if (r < 0.3) B = mirrorMol(A); else if (r < 0.55) B = withCfg(spec, A.desc.slice()); else B = withCfg(spec, randCfg(spec));
  return { A, B };
}
export function relComp(host) {
  const figs = h('div', { class: 'figs' }), fb = fbBox(), opts = h('div', { class: 'controls' });
  let P = null;
  host.append(figs, h('p', { class: 'prompt' }, 'Qual é a relação entre A e B? (B pode estar desenhada em outra orientação.)'), opts, fb, h('div', { class: 'controls' }, btn('Novo par →', () => next(), 'primary')));
  RELS.forEach(([k, t]) => opts.append(btn(t, () => answer(k))));
  function next() {
    P = genPair(); fb.style.display = 'none';
    figs.innerHTML = '';
    figs.append(fig(wedgeSVG(P.A, { scale: 36 }), 'A'), fig(wedgeSVG(P.B, { scale: 36, orient: pick(Object.keys(ORIENT)) }), 'B'));
  }
  function answer(k) {
    const r = relation(P.A, P.B);
    setFb(fb, r.r === k ? 'ok' : 'bad', `${r.r === k ? '✔' : '✘'} <b>${r.r}</b> — ${r.t}. A: ${nameOf(P.A)} · B: ${nameOf(P.B)}.`);
  }
  next();
}

/* ===================================================================
 * Meso: Fischer → 3D com plano de simetria
 * =================================================================== */
export function mesoPlane(host) {
  const v = vbox('tall'), fb = fbBox(), side = h('div', { class: 'projbox' });
  let key = 'diclorobutano', cfg = ['R', 'S'], sc = null, mol = null, on = false;
  const opts = [['diclorobutano|R,S', '2,3-diclorobutano (2R,3S) — meso'], ['tartarico|R,S', 'ácido tartárico (2R,3S) — meso'], ['butanodiol|R,S', 'butano-2,3-diol (2R,3S) — meso'], ['diclorobutano|R,R', '2,3-diclorobutano (2R,3R) — quiral'], ['tartarico|R,R', 'ácido tartárico (2R,3R) — quiral']];
  const pb = btn('Mostrar plano de simetria', () => {
    on = !on; pb.setAttribute('aria-pressed', on);
    if (meso(mol)) { sc.plane(on); setFb(fb, 'ok', on ? 'O plano (verde) corta a ligação C2–C3 ao meio: a metade de cima é a imagem especular da de baixo. Por isso a molécula é <b>aquiral</b>, embora tenha dois centros (R e S).' : ''); }
    else setFb(fb, 'bad', 'Nesta configuração <b>não existe</b> plano de simetria interno: a metade de cima não é o espelho da de baixo. A molécula é <b>quiral</b>.');
  });
  host.append(h('div', { class: 'controls' }, h('label', null, 'Composto ', select(opts.map(([k, t]) => [k, t]), 'diclorobutano|R,S', (s) => { const [k, c] = s.split('|'); key = k; cfg = c.split(','); load(); }))), h('div', { class: 'split' }, v, side), h('div', { class: 'controls' }, btn('Fischer → 3D', () => sc.play(1)), btn('3D → Fischer', () => sc.play(0, false)), pb), fb);
  function load() {
    mol = M(key, cfg); on = false; pb.setAttribute('aria-pressed', 'false'); fb.style.display = 'none';
    v.innerHTML = ''; sc = fischer3D(v, mol, { plane: true, t0: 1 });
    if (sc.v.ok) sc.v.setCamera([5, 1.2, 9]);
    side.innerHTML = ''; side.append(fig(fischerSVG(mol, { labels: true }), `${nameOf(mol)}<br>${chiralTag(mol)}`));
  }
  load();
}

/* ===================================================================
 * Tabela periódica reduzida (prioridade por número atômico)
 * =================================================================== */
const PT = [['H', 1, 1, 1], ['C', 6, 2, 14], ['N', 7, 2, 15], ['O', 8, 2, 16], ['F', 9, 2, 17], ['S', 16, 3, 16], ['Cl', 17, 3, 17], ['Br', 35, 4, 17], ['I', 53, 5, 17]];
export function ptable(host) {
  const tray = h('div', { class: 'tray', 'aria-live': 'polite' }), sel = [];
  const grid = h('div', { class: 'ptable' });
  PT.forEach(([s, z, row, col]) => grid.append(h('button', { type: 'button', class: 'pel', style: `grid-row:${row};grid-column:${col > 2 ? col - 10 : col}`, onclick: (e) => { const k = sel.indexOf(s); if (k >= 0) sel.splice(k, 1); else sel.push(s); e.currentTarget.setAttribute('aria-pressed', k < 0); draw(); } }, h('small', null, String(z)), h('b', null, s))));
  host.append(h('p', { html: 'Clique em dois ou mais elementos: eles são ordenados pelo <b>número atômico</b> (maior Z = maior prioridade).' }), grid, tray);
  function draw() {
    const z = (s) => PT.find((p) => p[0] === s)[1];
    const srt = sel.slice().sort((a, b) => z(b) - z(a));
    tray.innerHTML = srt.length ? srt.map((s, i) => `<span class="pchip ${i < 4 ? 'p' + (i + 1) : ''}">${s} <small>Z=${z(s)}</small></span>`).join(' <b>&gt;</b> ') : '<span class="hint3">nenhum elemento escolhido</span>';
  }
  draw();
}

/* ===================================================================
 * Algoritmo CIP em camadas (árvore)
 * =================================================================== */
const CIP_OPTS = [['butanol2', 'butan-2-ol: CH₂CH₃ × CH₃'], ['propanodiol', 'propano-1,2-diol: CH₂OH × CH₃'], ['gliceraldeido', 'gliceraldeído: CHO × CH₂OH'], ['metilhexano3', '3-metil-hexano: propila × etila'], ['cloropropenol', 'but-3-en-2-ol: CH=CH₂ × CH₃'], ['lactico', 'ácido lático: COOH × CH₃'], ['deuterioetanol', '1-deutério-etanol: D × H'], ['bromobutano2', '2-bromobutano']];
export function cipTree(host, o = {}) {
  const out = h('div', { class: 'ciptree' }), v = vbox('short'), fb = h('div', { class: 'cipwhy' });
  let mol = null, step = 0, mv = null, E = null;
  const nextB = btn('Próxima camada ▶', () => { step++; draw(); }, 'primary');
  host.append(h('div', { class: 'controls' }, h('label', null, 'Exemplo ', select(CIP_OPTS, o.key || 'propanodiol', (k) => load(k)))), h('div', { class: 'split' }, h('div', null, out, h('div', { class: 'controls' }, nextB, btn('Mostrar tudo', () => { step = 9; draw(); }), btn('⟲', () => { step = 0; draw(); }))), v), fb);
  function load(k) {
    mol = M(k); step = 0; E = explainCenter(mol, mol.centers[0]);
    if (!mv) mv = molView(v, mol, { camPos: [0, 0.6, 9] }); else mv.setMol(mol);
    if (mv.ok) mv.setPrio(null);
    draw();
  }
  function draw() {
    out.innerHTML = '';
    const maxL = Math.max(...E.lig.map((l) => l.layers.length));
    const t = h('table', { class: 'cmp ciptab' });
    t.append(h('thead', null, h('tr', null, h('th', null, 'Ligante'), ...Array.from({ length: Math.min(maxL, 3) }, (_, d) => h('th', null, `camada ${d + 1}`)), h('th', null, 'prioridade'))));
    const tb = h('tbody');
    // ordem de apresentação fixa (não revela a resposta): pela posição na molécula
    const shown = E.lig.slice().sort((a, b) => a.j - b.j);
    shown.forEach((l) => {
      const tr = h('tr', null, h('td', null, h('b', null, l.label)));
      for (let d = 0; d < Math.min(maxL, 3); d++) tr.append(h('td', { class: d < step ? '' : 'hid' }, d < step ? (l.layers[d] || '—') : '·'));
      tr.append(h('td', null, step >= Math.min(maxL, 3) ? h('span', { class: 'pchip p' + l.rank }, String(l.rank)) : '?'));
      tb.append(tr);
    });
    t.append(tb); out.append(h('div', { class: 'table-wrap' }, t));
    nextB.disabled = step >= Math.min(maxL, 3);
    fb.innerHTML = step === 0 ? '<p class="hint3">Camada 1: os átomos ligados diretamente ao centro. Avance para comparar.</p>' :
      '<ul>' + E.pairs.map((p) => `<li><b>${p.a}</b> &gt; <b>${p.b}</b>: ${p.why}</li>`).join('') + '</ul>';
    if (step < Math.min(maxL, 3)) fb.innerHTML = step ? `<p class="hint3">Camada ${step}: compare os conjuntos em ordem decrescente; o <b>primeiro ponto de diferença</b> decide. Empatou? Siga para a próxima camada pelo ramo de maior prioridade.</p>` : fb.innerHTML;
    if (mv && mv.ok) mv.setPrio(step >= Math.min(maxL, 3) ? mol.centers[0] : null);
  }
  load(o.key || 'propanodiol');
}

/* ===================================================================
 * Ligações múltiplas: átomos duplicados
 * =================================================================== */
export function dupAtoms(host) {
  const rows = [['CHO', 'C=O', 'C(<b>O</b>, <b class="dup">O</b>, H)', 'o O duplicado conta como um segundo O'], ['COOH', 'C(=O)OH', 'C(O, O, <b class="dup">O</b>)', 'três oxigênios'], ['CH₂OH', 'C–OH', 'C(O, H, H)', 'apenas um O'], ['CH=CH₂', 'C=C', 'C(C, <b class="dup">C</b>, H)', 'C duplicado'], ['C≡CH', 'C≡C', 'C(C, <b class="dup">C</b>, <b class="dup">C</b>)', 'dois C duplicados'], ['CH₃', '—', 'C(H, H, H)', '']];
  host.append(h('div', { class: 'table-wrap' }, h('table', { class: 'cmp' }, h('thead', null, h('tr', null, h('th', null, 'Grupo'), h('th', null, 'ligação'), h('th', null, 'como o CIP "enxerga"'), h('th', null, ''))), h('tbody', null, rows.map((r) => h('tr', null, h('td', null, h('b', null, r[0])), h('td', null, r[1]), h('td', { html: r[2] }), h('td', { class: 'hint3' }, r[3])))))));
  const d = h('div'); host.append(h('p', null, 'Ordene por prioridade (arraste ou use ▲▼):'), d);
  sortable(d, { items: [{ id: 'a', label: 'COOH' }, { id: 'b', label: 'CHO' }, { id: 'c', label: 'CH₂OH' }, { id: 'd', label: 'CH₃' }], correct: ['a', 'b', 'c', 'd'], top: 'maior prioridade', bottom: 'menor', explain: 'Todos começam por C (empate na camada 1). Camada 2: COOH (O,O,O) > CHO (O,O,H) > CH₂OH (O,H,H) > CH₃ (H,H,H).' });
}
export function cipOrder(host) {
  const defs = [
    { title: 'Ordene os grupos', type: 'order', q: 'Ligantes: Br, OH, CH₃, H.', items: [{ id: 'Br', label: 'Br' }, { id: 'OH', label: 'OH' }, { id: 'CH3', label: 'CH₃' }, { id: 'H', label: 'H' }], correct: ['Br', 'OH', 'CH3', 'H'], top: 'prioridade 1', bottom: 'prioridade 4', explain: 'Camada 1 decide: Br (35) > O (8) > C (6) > H (1).', e: 'Número atômico do átomo diretamente ligado.' },
    { title: 'Ordene os grupos', type: 'order', q: 'Ligantes: CH₂OH, CH₂Cl, CH₃, H.', items: [{ id: 'a', label: 'CH₂OH' }, { id: 'b', label: 'CH₂Cl' }, { id: 'c', label: 'CH₃' }, { id: 'd', label: 'H' }], correct: ['b', 'a', 'c', 'd'], top: 'prioridade 1', bottom: 'prioridade 4', explain: 'Camada 1: C, C, C, H (H é o 4). Camada 2: CH₂Cl (Cl,H,H) > CH₂OH (O,H,H) > CH₃ (H,H,H), pois Cl (17) > O (8).', e: 'Desempate na camada 2.' },
    { title: 'Ordene os grupos', type: 'order', q: 'Ligantes: CHO, CH₂OH, CH₃, H.', items: [{ id: 'a', label: 'CHO' }, { id: 'b', label: 'CH₂OH' }, { id: 'c', label: 'CH₃' }, { id: 'd', label: 'H' }], correct: ['a', 'b', 'c', 'd'], top: 'prioridade 1', bottom: 'prioridade 4', explain: 'CHO é visto como C(O,O,H) > CH₂OH C(O,H,H) > CH₃ C(H,H,H).', e: 'Ligação dupla: duplique o O.' },
  ];
  defs.forEach((d, i) => host.append(exerciseCard(d, 'O' + (i + 1))));
}

/* ===================================================================
 * Seção central R/S: prioridades → grupo 4 para trás → seta
 * =================================================================== */
const RS_KEYS = ['butanol2', 'bromobutano2', 'lactico', 'gliceraldeido', 'alanina', 'propanodiol', 'bcf', 'metilhexano3', 'cloropropenol'];
export function rsView(host) {
  const v = vbox('tall'), steps = h('ol', { class: 'rssteps' }), side = h('div', { class: 'projbox' }), fb = fbBox();
  let mol = null, mv = null, cfg = 'R', key = 'butanol2';
  const S = [btn('1 · Numerar prioridades', () => go(1)), btn('2 · Grupo 4 para trás', () => go(2)), btn('3 · Seta 1 → 2 → 3', () => go(3)), btn('4 · Concluir', () => go(4), 'primary')];
  host.append(h('div', { class: 'controls' }, h('label', null, 'Molécula ', select(RS_KEYS.map((k) => [k, (LIB[k].name || '').replace('{cfg}', '')]), key, (k) => { key = k; load(); })), seg([['R', 'R'], ['S', 'S']], 'R', (k) => { cfg = k; load(); }, 'Configuração')),
    h('div', { class: 'split' }, v, h('div', null, side, steps)), h('div', { class: 'controls' }, ...S, btn('⟲', () => load())), prioLegend(), fb);
  function load() {
    mol = M(key, [cfg]); fb.style.display = 'none';
    if (!mv) mv = molView(v, mol, { camPos: [0, 0.6, 9] }); else mv.setMol(mol);
    mv.reset(); mv.setPrio(null);
    side.innerHTML = ''; side.append(fig(wedgeSVG(mol, { scale: 40 }), nameOf(mol).replace(/^\([RS]\)-/, '(?)-')));
    steps.innerHTML = '';
  }
  function go(n) {
    const c = mol.centers[0], E = explainCenter(mol, c);
    if (n >= 1) { mv.setPrio(c); side.innerHTML = ''; side.append(fig(wedgeSVG(mol, { prio: c, scale: 40 }), 'prioridades numeradas')); steps.innerHTML = ''; steps.append(h('li', { html: 'Prioridades: ' + E.lig.map((l) => `<span class="pchip p${l.rank}">${l.rank}</span> ${l.label}`).join(' ') + '<br><small>' + E.pairs.map((p) => `${p.a} &gt; ${p.b}: ${p.why}`).join('<br>') + '</small>' })); }
    if (n >= 2) { mv.look4(c, true); steps.append(h('li', { html: 'A câmera gira até o grupo <b>4</b> ficar <b>atrás</b> do carbono (apontando para longe de você).' })); }
    if (n >= 3) { setTimeout(() => mv.showArrow(true), n === 3 ? 1150 : 0); steps.append(h('li', { html: `Siga 1 → 2 → 3: sentido <b>${mol.desc[0] === 'R' ? 'horário ↻' : 'anti-horário ↺'}</b>.` })); }
    if (n >= 4) setFb(fb, 'ok', `Sentido ${mol.desc[0] === 'R' ? 'horário → <b>R</b> (rectus)' : 'anti-horário → <b>S</b> (sinister)'}. Nome: <b>${nameOf(mol)}</b>.`);
  }
  load();
}

/* ===================================================================
 * Grupo 4 para a frente (inverter) e grupo 4 no plano
 * =================================================================== */
export function orientWith4(mol, c, want) {
  const r = rankCenter(mol, c).order;
  for (const k of ['base', 'turn', 'flip', 'rot180']) {
    const s = wedgeS(mol, { orient: k });
    const z = s._p3[r[3]][2];
    if ((want === 'front' && z > 0.3) || (want === 'back' && z < -0.3) || (want === 'plane' && Math.abs(z) < 0.1)) return k;
  }
  return 'base';
}
/** sentido aparente 1→2→3 no papel (ignora o 4) */
export function apparent(mol, s, c) {
  const r = rankCenter(mol, c).order, P = r.map((j) => s._p3[j]);
  const cr = (P[1][0] - P[0][0]) * (P[2][1] - P[0][1]) - (P[1][1] - P[0][1]) * (P[2][0] - P[0][0]);
  return cr < 0 ? 'horário' : 'anti-horário';
}
export function g4front(host) {
  const keys = ['butanol2', 'bromobutano2', 'lactico', 'gliceraldeido', 'alanina'];
  const box = h('div', { class: 'split' }), v = vbox(), fb = fbBox();
  let i = 0, mol = null, mv = null;
  const figb = h('div', { class: 'projbox' });
  box.append(figb, v);
  host.append(box, h('div', { class: 'controls' }, btn('Ler a seta no papel', () => read(), 'primary'), btn('Animar: levar o 4 para trás', () => { mv.setPrio(mol.centers[0]); mv.look4(mol.centers[0], true); }), btn('Outra molécula →', () => load(i + 1))), fb);
  function load(k) {
    i = (k + keys.length) % keys.length; mol = M(keys[i], [pick(['R', 'S'])]); fb.style.display = 'none';
    const c = mol.centers[0], o = orientWith4(mol, c, 'front');
    figb.innerHTML = ''; figb.append(fig(wedgeSVG(mol, { prio: c, orient: o, scale: 42 }), 'o grupo <b>4 (H)</b> está na <b>cunha</b> — para a frente'));
    if (!mv) mv = molView(v, mol, { camPos: [0, 0.6, 9] }); else { mv.setMol(mol); mv.reset(); }
    mv.setPrio(c);
    figb.dataset.o = o;
  }
  function read() {
    const c = mol.centers[0], s = wedgeS(mol, { orient: figb.dataset.o }), ap = apparent(mol, s, c);
    setFb(fb, 'ok', `No papel, 1 → 2 → 3 parece <b>${ap}</b> (${ap === 'horário' ? 'R' : 'S'}). Mas o grupo 4 aponta <b>para você</b>, então a leitura sai invertida: a configuração real é <b>${mol.desc[0]}</b>. <br><b>Regra:</b> grupo 4 para a frente → determine e <b>inverta</b>.`);
  }
  load(0);
}
export function g4plane(host) {
  // butan-2-ol desenhado com o H no plano (H como extremidade da cadeia)
  const base = M('butanol2', [pick(['R', 'S'])]);
  const specIn = { family: 'butanol2', name: '{cfg}butan-2-ol', chain: ['H', { f: 'OH', b: 'CH3' }, 'Et'], loc: [2] };
  let m1 = makeMol(specIn);
  if (m1.desc[0] !== base.desc[0]) { specIn.chain[1] = { f: 'CH3', b: 'OH' }; m1 = makeMol(specIn); }
  const c = m1.centers[0];
  const s1 = wedgeS(m1, {});
  const hashed = m1.info.sub[0].b, hashedG = m1.groupAt[hashed];
  // troca do H (no plano) com o grupo do tracejado
  const swapSpec = { family: 'butanol2x', name: '', chain: [hashedG, { f: m1.groupAt[m1.info.sub[0].f], b: 'H' }, 'Et'], loc: [2] };
  const m2 = build2(swapSpec);
  function build2(sp) { const s = JSON.parse(JSON.stringify(sp)); return makeMol(s); }
  const fb = fbBox();
  host.append(h('div', { class: 'figs' },
    fig(wedgeSVG(m1, { prio: c, scale: 42 }), '① H (prioridade 4) <b>no plano</b>'),
    h('span', { class: 'arrow big' }, '⇄'),
    fig(wedgeSVG(m2, { prio: m2.centers[0], scale: 42 }), `② troque o H com o grupo do tracejado (${glab(hashedG)})`)),
    h('div', { class: 'controls' }, btn('Resolver passo a passo', () => setFb(fb, 'ok', `Em ②, o H está no tracejado (para trás): 1 → 2 → 3 é ${m2.desc[0] === 'R' ? 'horário → R' : 'anti-horário → S'}. Uma troca de dois grupos <b>inverte</b> a configuração; logo a estrutura original ① é <b>${m1.desc[0]}</b>. (Alternativa: gire mentalmente a molécula até o H ir para trás, ou use o modelo 3D.)`), 'primary')), fb);
  void s1;
}

/* ===================================================================
 * Fischer → 3D, 3 representações da mesma molécula
 * =================================================================== */
export function fischerMorph(host) {
  const v = vbox('tall'), figs = h('div', { class: 'figs' });
  let key = 'gliceraldeido', sc = null;
  const opts = [['gliceraldeido', '(R)-gliceraldeído'], ['lactico', 'ácido (S)-lático'], ['alanina', '(S)-alanina'], ['dibromobutano', '(2R,3R)-2,3-dibromobutano'], ['diclorobutano', 'meso-2,3-diclorobutano'], ['eritrose', 'aldotetrose (2R,3R)']];
  host.append(h('div', { class: 'controls' }, h('label', null, 'Molécula ', select(opts, key, (k) => { key = k; load(); })), btn('Transformar Fischer em 3D', () => sc.play(1), 'primary'), btn('Voltar à cruz', () => sc.play(0, false))), h('div', { class: 'split' }, v, figs), h('p', { class: 'hint3' }, 'Na cruz, as linhas horizontais apontam para o observador (cunhas) e as verticais para trás (tracejados).'));
  function load() {
    const m = M(key);
    v.innerHTML = ''; sc = fischer3D(v, m, { t0: 0 });
    figs.innerHTML = '';
    figs.append(fig(fischerSVG(m, { labels: true, maxw: 210 }), 'Fischer'), fig(fischerSVG(m, { wedges: true, maxw: 210 }), 'cruz com cunhas'), fig(wedgeSVG(m, { scale: 34 }), `cunha/tracejado (zigue-zague)<br><b>${nameOf(m)}</b>`));
  }
  load();
}

/* ===================================================================
 * Cálculo do número de pontos no espaço
 * =================================================================== */
export { PCOL, V, PNAME, sty, shuffle, tgl };
