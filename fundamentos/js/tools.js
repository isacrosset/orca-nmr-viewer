/*
 * tools.js — laboratório molecular 3D (sincronizado com Lewis), construtor
 * de Lewis (→ geometria 3D), simulador de ressonância, simulador VSEPR,
 * simulador de hibridização, construtor molecular, contador σ/π e modos
 * "Qual é a geometria?" / "Qual é a hibridização?".
 */
import { h, seg, tgl, shuffle } from './widgets2d.js';
import { S, mol } from './chem2d.js';
import { L, MOLS, LAB } from './lib.js';
import { lewisSVG, lewisS, centerInfo, nbs, sigmaPi, valenceElectrons, charge, fc, VAL, clone, bondSum, shellElectrons, drawnElectrons, fromSmiles, idealDirs, molGeo, EGEO, idealAngle, V } from './struct.js';
import { molScene, placeOrbital, LPC } from './scene3d.js';
import { THREE, Viewer, Mol, label } from './viewer3d.js';
import { fb, clear, sel, molOpts, vbox, SP_LEGEND, infoRows, choice, rnd, img3d } from './ui.js';
import { overlayAtoms, bondOf } from './m1.js';
import { aoViewer } from './m2.js';

/* ===================================================================
 * 24. Laboratório molecular 3D
 * =================================================================== */
export function lab3d(host) {
  let key = 'CH3OH';
  const st = { style: 'ball', lp: true, angles: false, hyb: false, sp: false, p: false, cloud: false, numbers: false };
  const v = vbox('tall'), side = h('div', { class: 'labside' }), panel = h('div', { class: 'labinfo', 'aria-live': 'polite' }), fig = h('div', { class: 'figs' });
  let M = null;
  const showInfo = (i) => {
    const LS = L(key);
    clear(fig).append(lewisSVG(LS, { scale: 38, fs: 16, halo: i !== null && i !== undefined ? { [i]: 'g' } : {} }));
    const s = sigmaPi(LS);
    panel.innerHTML = `<div class="readout"><span><b>${MOLS[key][1]}</b> · ${MOLS[key][2]}</span><span>σ: <b>${s.s}</b> · π: <b>${s.p}</b></span><span>elétrons de valência: <b>${valenceElectrons(LS)}</b></span></div>` + (i !== null && i !== undefined ? `<div class="readout">${infoRows(LS, i)}</div>` : '<p class="hint3">Clique em um átomo no modelo 3D: a estrutura de Lewis, a geometria VSEPR, a hibridização e os orbitais são atualizados.</p>');
  };
  const go = () => {
    if (M) M.v.dispose(); clear(v);
    M = molScene(v, L(key), Object.assign({}, st, { dist: key === 'benzeno' || key === 'final' || key === 'acetona' ? 9 : 7, onSelect: (i) => { showInfo(i); }, pick: true }));
    showInfo(null);
  };
  const t = (k, label0) => tgl(label0, () => { st[k] = !st[k]; go(); return st[k]; }, st[k]);
  const s = sel(molOpts(LAB), key, (x) => { key = x; go(); }, 'molécula');
  side.append(h('div', { class: 'optgroup-t' }, 'Molécula'), s, h('div', { class: 'optgroup-t' }, 'Modelo'), seg([['ball', 'Bola-vareta'], ['space', 'Preenchimento']], st.style, (k) => { st.style = k; go(); }, 'estilo'),
    h('div', { class: 'optgroup-t' }, 'Mostrar'), h('div', { class: 'tglgrid' }, t('lp', 'Pares isolados'), t('angles', 'Ângulos'), t('hyb', 'Hibridização'), t('sp', 'σ / π'), t('p', 'Orbitais p'), t('cloud', 'Nuvem π'), t('numbers', 'Numerar átomos'),
      h('button', { class: 'btn sm', type: 'button', onclick: () => { if (M && M.st.sel !== null) { M.st.hybOrb = M.st.hybOrb === M.st.sel ? null : M.st.sel; M.rebuild(); } } }, 'Orbitais do átomo')), fig);
  host.append(h('div', { class: 'labgrid' }, side, h('div', null, v, panel)), SP_LEGEND());
  go();
}

/* ===================================================================
 * 25. Laboratório de orbitais: comparação lado a lado
 * =================================================================== */
export function orbCompare(host) {
  const a = h('div'), b = h('div');
  host.append(h('div', { class: 'grid2' }, a, b));
  aoViewer(a, { key: '2pz' }); aoViewer(b, { key: 'sp3' });
}

/* ===================================================================
 * 26. Construtor de Lewis (→ geometria)
 * =================================================================== */
const TARGETS = ['CH4', 'NH3', 'H2O', 'CO2', 'HCN', 'CH2O', 'CH3OH', 'acetato', 'HCl', 'eteno', 'etino', 'NH4', 'CO', 'imina'];
export function lewisBuilder(host) {
  let key = TARGETS[0], W = null, selA = null;
  const fig = h('div', { class: 'figs pick bwrap' }), checks = h('div', { 'aria-live': 'polite' }), geo = h('div'), ctrl = h('div', { class: 'ex-actions' }), info = h('p', { class: 'prompt' });
  const reset = () => {
    const F = L(key);
    W = clone(F); W.bonds.forEach((b) => { b.o = 0; }); W.atoms.forEach((a) => { a.lp = 0; a.rad = 0; a.q = 0; });
    selA = null; clear(geo); checks.innerHTML = ''; render();
  };
  const render = () => {
    const F = L(key);
    info.innerHTML = `Monte <b>${MOLS[key][1]}</b> (${valenceElectrons(F)} elétrons de valência${charge(F) ? `, carga ${charge(F) > 0 ? '+' : ''}${charge(F)}` : ''}). Clique nas <b>ligações</b> (tracejadas) para alternar 0 → simples → dupla → tripla; clique em um <b>átomo</b> para selecioná-lo e use os botões para pares isolados e carga.`;
    // desenho: ligações de ordem 0 como tracejado
    const D = clone(W); D.bonds.forEach((b) => { if (!b.o) b.o = 'p'; });
    const sp = lewisS(D, { scale: 60, fc: false });
    sp.atoms.forEach((a, i) => { if (W.atoms[i].q) a[3].chg = W.atoms[i].q > 0 ? '+' : '−'; if (i === selA) a[3].halo = 'g'; });
    const svg = mol(sp, { scale: 60, fs: 21, zoom: 1.45 });
    clear(fig).append(svg);
    const C = svg._chem, NS = 'http://www.w3.org/2000/svg', g = document.createElementNS(NS, 'g'); g.setAttribute('transform', C.transform); svg.append(g);
    W.bonds.forEach((b, k) => {
      const A = C.atoms[b.a], B = C.atoms[b.b];
      const gg = document.createElementNS(NS, 'g'); gg.setAttribute('class', 'pk bondpk'); gg.setAttribute('tabindex', 0); gg.setAttribute('role', 'button'); gg.setAttribute('aria-label', `ligação ${W.atoms[b.a].el}–${W.atoms[b.b].el}: ordem ${b.o}`);
      const e = document.createElementNS(NS, 'ellipse'); e.setAttribute('cx', (A.x + B.x) / 2); e.setAttribute('cy', (A.y + B.y) / 2); e.setAttribute('rx', 12); e.setAttribute('ry', 12); gg.append(e);
      const f = (ev) => { ev.preventDefault(); b.o = (b.o + 1) % 4; render(); checks.innerHTML = ''; };
      gg.addEventListener('click', f); gg.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') f(ev); });
      g.append(gg);
    });
    W.atoms.forEach((a, i) => {
      const at = C.atoms[i];
      const gg = document.createElementNS(NS, 'g'); gg.setAttribute('class', 'pk'); gg.setAttribute('tabindex', 0); gg.setAttribute('role', 'button'); gg.setAttribute('aria-label', 'átomo ' + a.el);
      const c = document.createElementNS(NS, 'circle'); c.setAttribute('cx', at.x); c.setAttribute('cy', at.y); c.setAttribute('r', 15); gg.append(c);
      const f = (ev) => { ev.preventDefault(); selA = i; render(); };
      gg.addEventListener('click', f); gg.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') f(ev); });
      g.append(gg);
    });
    const a = selA !== null ? W.atoms[selA] : null;
    clear(ctrl).append(h('span', { class: 'hint3' }, a ? `${a.el} selecionado: ${a.lp} par(es), carga ${a.q > 0 ? '+' : ''}${a.q}` : 'Nenhum átomo selecionado'),
      h('button', { class: 'btn sm', type: 'button', disabled: !a, onclick: () => { a.lp = Math.min(4, a.lp + 1); render(); } }, '+ par isolado'),
      h('button', { class: 'btn sm', type: 'button', disabled: !a, onclick: () => { a.lp = Math.max(0, a.lp - 1); render(); } }, '− par isolado'),
      h('button', { class: 'btn sm', type: 'button', disabled: !a, onclick: () => { a.q = a.q >= 1 ? -1 : a.q + 1; render(); } }, 'carga: alternar −/0/+'),
      h('button', { class: 'btn sm', type: 'button', onclick: () => { const F = L(key); W = clone(F); W.atoms.forEach((x, i) => { x.q = fc(F, i); }); render(); verify(); } }, 'Ver resposta'));
  };
  const verify = () => {
    const F = L(key), msgs = [], need = valenceElectrons(F), have = drawnElectrons(W);
    if (have !== need) msgs.push(['bad', `Total de elétrons desenhados: <b>${have}</b>; são necessários <b>${need}</b> (${need / 2} pares).`]);
    else msgs.push(['ok', `Total de elétrons correto: ${need}.`]);
    W.atoms.forEach((a, i) => {
      const e = shellElectrons(W, i), tgt = a.el === 'H' ? 2 : 8;
      if (a.el === 'H' && bondSum(W, i) > 1) msgs.push(['bad', 'H com mais de uma ligação: o hidrogênio faz apenas uma ligação (dueto).']);
      else if (e > tgt && a.el !== 'S' && a.el !== 'P') msgs.push(['bad', `${a.el}: ${e} elétrons — excede o ${a.el === 'H' ? 'dueto' : 'octeto'}${a.el === 'C' && bondSum(W, i) > 4 ? ' (carbono com mais de 4 ligações!)' : ''}.`]);
      else if (e < tgt && !(a.el === 'B')) msgs.push(['bad', `${a.el}: apenas ${e} elétrons — ${a.el === 'H' ? 'dueto' : 'octeto'} incompleto.`]);
      const f = fc(W, i);
      if (f !== (a.q || 0)) msgs.push(['bad', `${a.el}: a carga indicada (${a.q > 0 ? '+' : ''}${a.q || 0}) não corresponde à carga formal calculada (${f > 0 ? '+' : ''}${f}).`]);
    });
    const tq = W.atoms.reduce((t, _, i) => t + fc(W, i), 0);
    if (tq !== charge(F)) msgs.push(['bad', `Carga total da estrutura: ${tq}; a espécie tem carga ${charge(F)}.`]);
    const ok = msgs.every(([c]) => c === 'ok');
    checks.replaceChildren(...msgs.map(([c, t]) => fb(c, t)), ok ? fb('ok', '<b>✔ Estrutura de Lewis válida!</b> Agora clique em “Gerar geometria”.') : '');
    return ok;
  };
  const gen = () => {
    if (!verify()) { geo.replaceChildren(fb('bad', 'Corrija a estrutura de Lewis antes de gerar a geometria.')); return; }
    const LS = clone(W); LS.name = MOLS[key][2];
    const v = vbox('short');
    const centers = LS.atoms.map((a, i) => i).filter((i) => LS.atoms[i].el !== 'H' && (nbs(LS, i).length > 1 || LS.atoms.length === 2 || nbs(LS, i).length + (LS.atoms[i].lp || 0) > 1));
    const s = sigmaPi(LS);
    clear(geo).append(h('div', { class: 'grid2' }, v, h('div', null,
      h('ol', { class: 'steps' }, h('li', { html: `Domínios: ${centers.map((i) => `${LS.atoms[i].el} → ${centerInfo(LS, i).D}`).join('; ')}` }), h('li', { html: `VSEPR: ${centers.map((i) => `${LS.atoms[i].el}: ${centerInfo(LS, i).axe} — ${centerInfo(LS, i).mgeo}`).join('; ')}` }), h('li', null, 'Modelo 3D gerado (ao lado).'), h('li', { html: `Hibridização: ${centers.map((i) => `${LS.atoms[i].el} ${centerInfo(LS, i).hyb || '—'}`).join('; ')}` }), h('li', { html: `Ligações: <b>${s.s} σ</b> e <b>${s.p} π</b>.` })))));
    molScene(v, LS, { lp: true, angles: true, hyb: true, dist: 6.5, hint: false });
  };
  host.append(h('div', { class: 'controls' }, h('label', null, 'Monte: ', sel(molOpts(TARGETS), key, (x) => { key = x; reset(); })), h('button', { class: 'btn', type: 'button', onclick: reset }, 'Recomeçar')), info, fig, ctrl,
    h('div', { class: 'ex-actions' }, h('button', { class: 'btn primary', type: 'button', onclick: verify }, 'Verificar Lewis'), h('button', { class: 'btn accent', type: 'button', onclick: gen }, 'Gerar geometria →')), checks, geo, SP_LEGEND());
  reset();
}

/* ===================================================================
 * 31. Simulador de ressonância
 * =================================================================== */
const RES = ['acetato', 'alilaC', 'alilaA', 'carbonato', 'formamida', 'nitrometano', 'CH2O', 'butadieno'];
export function resSim(host) {
  let key = RES[0], W = null, moves = [], src = null;
  const left = h('div', { class: 'figs pick' }), right = h('div', { class: 'figs' }), out = h('div', { 'aria-live': 'polite' }), status = h('p', { class: 'ap-status' });
  const reset = () => { W = clone(L(key)); moves = []; src = null; render(); out.innerHTML = ''; status.textContent = 'Clique na origem dos elétrons (par isolado ou ligação π) e depois no destino (ligação vizinha ou átomo).'; };
  const render = () => {
    const A = L(key);
    // estrutura inicial com setas
    const sp = lewisS(A, { scale: 56 });
    moves.forEach((m, k) => sp.arrow(m.from.lp !== undefined ? { lp: [m.from.lp, sp._lp[m.from.lp][0]] } : { b: m.from.b }, m.to.b ? { b: m.to.b } : { a: m.to.a, ang: 90 }, k % 2 ? -0.5 : 0.5, k % 2 ? 'o' : ''));
    const svg = mol(sp, { scale: 56, fs: 20, zoom: 1.4 });
    clear(left).append(svg);
    // alvos: pares isolados, ligações, átomos
    const C = svg._chem, NS = 'http://www.w3.org/2000/svg', g = document.createElementNS(NS, 'g'); g.setAttribute('transform', C.transform); svg.append(g);
    const add = (x, y, r, lab, f) => { const gg = document.createElementNS(NS, 'g'); gg.setAttribute('class', 'pk'); gg.setAttribute('tabindex', 0); gg.setAttribute('role', 'button'); gg.setAttribute('aria-label', lab); const c = document.createElementNS(NS, 'circle'); c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('r', r); gg.append(c); gg.addEventListener('click', (e) => { e.preventDefault(); f(gg); }); gg.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); f(gg); } }); g.append(gg); return gg; };
    A.atoms.forEach((a, i) => { if (a.el === 'H') return; add(C.atoms[i].x, C.atoms[i].y, 13, 'átomo ' + a.el, () => pick({ a: i }, 'átomo ' + a.el)); });
    A.bonds.forEach((b) => { if (A.atoms[b.a].el === 'H' || A.atoms[b.b].el === 'H') return; const P = C.atoms[b.a], Q = C.atoms[b.b]; add((P.x + Q.x) / 2, (P.y + Q.y) / 2, 10, `ligação ${A.atoms[b.a].el}–${A.atoms[b.b].el}`, () => pick({ b: [b.a, b.b] }, `ligação ${A.atoms[b.a].el}–${A.atoms[b.b].el}`)); });
    A.atoms.forEach((a, i) => { (sp._lp[i] || []).forEach((ang) => { const p = C.lpPos(i, ang); add(p.x, p.y, 8, 'par isolado em ' + a.el, () => pick({ lp: i }, 'par isolado do ' + a.el)); }); });
    clear(right).append(h('figure', { class: 'fig' }, lewisSVG(W, { scale: 56, fs: 20, zoom: 1.4 }), h('figcaption', null, 'resultado das setas')));
  };
  const pick = (t, lab) => {
    if (!src) {
      if (t.a !== undefined) { status.textContent = 'Setas começam em elétrons: escolha um par isolado ou uma ligação π, não um átomo.'; return; }
      if (t.b) { const b = bondOf(W, ...t.b); if (b.o < 2) { status.textContent = 'Essa é uma ligação σ: em ressonância, as ligações σ (a conectividade) não se movem. Escolha uma ligação π.'; return; } }
      if (t.lp !== undefined && !(W.atoms[t.lp].lp > 0)) { status.textContent = 'Esse átomo não tem mais pares isolados na estrutura atual.'; return; }
      src = t; status.textContent = `Origem: ${lab}. Agora clique no destino.`; return;
    }
    // aplica o movimento
    const s = src; src = null;
    const R = clone(W);
    if (s.lp !== undefined) {
      if (!t.b || !t.b.includes(s.lp)) { status.textContent = 'Um par isolado só pode formar uma nova ligação π com um átomo vizinho: clique numa ligação desse átomo.'; return; }
      R.atoms[s.lp].lp -= 1; bondOf(R, ...t.b).o += 1;
    } else {
      const b = bondOf(R, ...s.b);
      if (t.a !== undefined) { if (!s.b.includes(t.a)) { status.textContent = 'Os elétrons π só podem ir para um dos dois átomos da própria ligação.'; return; } b.o -= 1; R.atoms[t.a].lp = (R.atoms[t.a].lp || 0) + 1; }
      else if (t.b) { const shared = s.b.find((x) => t.b.includes(x)); if (shared === undefined || (t.b[0] === s.b[0] && t.b[1] === s.b[1])) { status.textContent = 'O par π só pode deslocar-se para uma ligação adjacente (que compartilhe um átomo).'; return; } b.o -= 1; bondOf(R, ...t.b).o += 1; }
      else { status.textContent = 'Destino inválido.'; return; }
    }
    if (bondOf(R, ...(t.b || s.b)).o > 3) { status.textContent = 'Isso criaria uma ligação de ordem maior que 3.'; return; }
    W = R; moves.push({ from: s, to: t }); render();
    status.textContent = `Seta ${moves.length} desenhada. Continue ou clique em “Verificar”.`;
  };
  const check = () => {
    const A = L(key), msgs = [];
    W.atoms.forEach((a, i) => { const e = shellElectrons(W, i); if (a.el !== 'H' && e > 8) msgs.push(`${a.el} ficaria com ${e} elétrons: viola o octeto (${a.el === 'C' ? 'carbono pentavalente' : 'elemento do 2º período não expande o octeto'}). Faltou uma segunda seta "liberando" elétrons?`); });
    const same = W.bonds.every((b, k) => b.o === A.bonds[k].o) && W.atoms.every((a, i) => a.lp === A.atoms[i].lp);
    if (same) msgs.push('A estrutura resultante é igual à inicial.');
    if (msgs.length) { out.replaceChildren(fb('bad', '✘ ' + msgs.join('<br>'))); return; }
    const nq = W.atoms.filter((_, i) => fc(W, i)).length, nq0 = A.atoms.filter((_, i) => fc(A, i)).length;
    const lowOct = W.atoms.filter((a, i) => a.el !== 'H' && shellElectrons(W, i) < 8).length;
    out.replaceChildren(fb('ok', `✔ Forma de ressonância válida: mesmos átomos, mesma conectividade σ, mesmo número de elétrons (${valenceElectrons(A)}), carga total ${charge(W)}. ${nq > nq0 ? 'Ela tem <b>mais separação de cargas</b> que a inicial: contribuinte <b>menor</b>.' : nq === nq0 && !lowOct ? 'Mesma separação de cargas e octetos completos: contribuição <b>comparável</b> (equivalente se for simétrica).' : lowOct ? 'Há átomo com octeto incompleto: contribuinte menor.' : ''}`));
  };
  host.append(h('div', { class: 'controls' }, h('label', null, 'Espécie: ', sel(molOpts(RES), key, (x) => { key = x; reset(); })), h('button', { class: 'btn', type: 'button', onclick: () => { if (!moves.length) return; const m = moves.slice(0, -1); reset(); m.forEach((x) => { src = x.from; pick(x.to, ''); }); } }, '↶ Desfazer'), h('button', { class: 'btn', type: 'button', onclick: reset }, 'Limpar'), h('button', { class: 'btn primary', type: 'button', onclick: check }, 'Verificar')),
    status, h('div', { class: 'cmp2' }, left, right), out);
  reset();
}

/* ===================================================================
 * 27. Simulador VSEPR
 * =================================================================== */
const VEX = { '2,0': 'CO₂, BeCl₂, HC≡CH (cada C)', '3,0': 'BF₃, H₂C=O (C), eteno (cada C)', '2,1': 'SO₂, O₃', '4,0': 'CH₄, CCl₄, NH₄⁺', '3,1': 'NH₃, H₃O⁺', '2,2': 'H₂O, CH₃OH (O)', '1,1': 'HC≡N (N)', '1,2': 'O de C=O', '1,3': 'HF, HCl', '5,0': 'PCl₅', '4,1': 'SF₄', '3,2': 'ClF₃', '2,3': 'XeF₂', '6,0': 'SF₆', '5,1': 'BrF₅', '4,2': 'XeF₄' };
export function vseprSim(host) {
  let X = 3, E = 1, showE = true;
  const v = vbox('tall'), cards = h('div', { class: 'vcards' });
  const sx = h('input', { type: 'range', min: 1, max: 6, value: X, 'aria-label': 'número de átomos ligados' }), se = h('input', { type: 'range', min: 0, max: 3, value: E, 'aria-label': 'número de pares isolados' });
  const lx = h('b', null, ''), le = h('b', null, '');
  const viewer = new Viewer(v, { dist: 8, alt: 'Geometria VSEPR' });
  if (viewer.ok) viewer.setCamera([3.6, 2.6, 6.4]);
  let grp = null;
  const go = () => {
    X = +sx.value; E = +se.value;
    if (X + E > 6) { E = 6 - X; se.value = E; }
    if (X + E < 2) { E = 2 - X; se.value = E; }
    lx.textContent = X; le.textContent = E;
    const D = X + E;
    let dirs = idealDirs(D);
    // ordem: pares isolados primeiro nas posições adequadas
    const lpFirst = D === 5 ? [2, 3, 4, 0, 1] : D === 6 ? [0, 1, 2, 3, 4, 5] : dirs.map((_, i) => i);
    const lpIdx = lpFirst.slice(0, E), xIdx = dirs.map((_, i) => i).filter((i) => !lpIdx.includes(i));
    if (viewer.ok) {
      if (grp) { viewer.scene.remove(grp.group); grp.labels.forEach((l) => l.obj.removeFromParent()); }
      if (viewer._lp) viewer._lp.forEach((m) => viewer.scene.remove(m));
      const atoms = [{ el: 'C', p: [0, 0, 0], color: 0x8b95a5 }].concat(xIdx.map((i) => ({ el: 'F', p: V.mul(dirs[i], 1.5), color: 0xe8eef9 })));
      grp = new Mol(viewer, atoms, xIdx.map((_, k) => [0, k + 1, 1]), { style: 'ball' });
      grp.addLabel(0, 'A', 'tag', [0, 0.55, 0]);
      viewer._lp = lpIdx.map((i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), new THREE.MeshStandardMaterial({ color: LPC, transparent: true, opacity: 0.4, depthWrite: false, emissive: LPC, emissiveIntensity: 0.3 })); m.position.set(...V.mul(dirs[i], 0.75)); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...dirs[i])); m.scale.set(0.3, 0.6, 0.3); m.visible = showE; viewer.scene.add(m); return m; });
      // rótulo de ângulo entre os dois primeiros ligantes
      if (xIdx.length >= 2) { const a = dirs[xIdx[0]], b = dirs[xIdx[1]]; const l = label(idealAngle(X, E), 'tag o'); l.position.set(...V.mul(V.norm(V.add(a, b)), 0.9)); if (V.len(V.add(a, b)) < 0.1) l.position.set(0, 0.9, 0); grp.group.add(l); }
    }
    const axe = 'AX' + sub(X) + (E ? 'E' + sub(E) : '');
    cards.innerHTML = `<div class="vc"><small>fórmula</small><b>${axe}</b></div><div class="vc"><small>domínios</small><b>${D}</b></div><div class="vc"><small>geometria eletrônica</small><b>${EGEO[D]}</b></div><div class="vc good"><small>geometria molecular</small><b>${molGeo(X, E)}</b></div><div class="vc"><small>ângulo(s)</small><b>${idealAngle(X, E)}</b></div><div class="vc"><small>exemplos</small><b>${VEX[X + ',' + E] || '—'}</b></div>` + (D > 4 ? '<p class="hint3">5 e 6 domínios exigem octeto expandido (elementos do 3º período em diante): não ocorrem com C, N, O.</p>' : '');
  };
  sx.addEventListener('input', go); se.addEventListener('input', go);
  host.append(h('div', { class: 'grid2 vsepr' }, h('div', null, h('div', { class: 'range-row' }, h('span', null, 'átomos ligados (X)'), sx, lx), h('div', { class: 'range-row' }, h('span', null, 'pares isolados (E)'), se, le), tgl('Mostrar pares isolados (geometria eletrônica)', () => { showE = !showE; (viewer._lp || []).forEach((m) => { m.visible = showE; }); return showE; }, true), cards), v));
  go();
}
const sub = (n) => (n > 1 ? String(n).replace(/\d/g, (d) => '₀₁₂₃₄₅₆₇₈₉'[d]) : '');

/* ===================================================================
 * 28. Simulador de hibridização
 * =================================================================== */
const HKEYS = ['CH3OH', 'CH2O', 'HCN', 'propeno', 'acetato', 'CH3COOH', 'final', 'imina', 'acetona', 'metilamina', 'CO2', 'etino'];
const GEOS = ['linear', 'trigonal planar', 'tetraédrica', 'angular', 'piramidal trigonal'];
export function hybSim(host) {
  let key = 'final', M = null;
  const fig = h('div', { class: 'figs' }), v = vbox(), q = h('div', { 'aria-live': 'polite' });
  const ask = (i) => {
    const LS = L(key), c = centerInfo(LS, i);
    if (LS.atoms[i].el === 'H') { q.replaceChildren(fb('neutral', 'H faz apenas uma ligação usando seu orbital 1s: não se atribui hibridização ao hidrogênio. Escolha outro átomo.')); return; }
    const step = (n) => {
      if (n === 0) q.replaceChildren(h('p', { class: 'prompt' }, `1. Quantos domínios eletrônicos há ao redor do ${LS.atoms[i].el}?`), choice([2, 3, 4], c.D, (ok) => { q.append(fb(ok ? 'ok' : 'bad', `${c.X} ligado(s) + ${c.E} par(es) isolado(s) = ${c.D} (ligação múltipla conta 1).`), h('button', { class: 'btn sm', type: 'button', onclick: () => step(1) }, 'Próxima →')); }));
      if (n === 1) { const g = c.X === 1 ? EGEO[c.D] : c.mgeo; const opts = [...new Set([g, ...GEOS])].slice(0, 5); q.replaceChildren(h('p', { class: 'prompt' }, `2. Qual é a geometria ${c.X === 1 ? 'eletrônica' : 'molecular'} em torno do ${LS.atoms[i].el}?`), choice(opts, g, (ok) => { q.append(fb(ok ? 'ok' : 'bad', `${c.axe}: geometria eletrônica ${c.egeo}; molecular ${c.mgeo}; ângulo ≈ ${c.ang}.`), h('button', { class: 'btn sm', type: 'button', onclick: () => step(2) }, 'Próxima →')); })); }
      if (n === 2) q.replaceChildren(h('p', { class: 'prompt' }, `3. Qual é a hibridização do ${LS.atoms[i].el}?`), choice(['sp³', 'sp²', 'sp'], c.hyb, (ok) => { q.append(fb(ok ? 'ok' : 'bad', `${c.D} domínios → <b>${c.hyb}</b>. Orbitais híbridos (lóbulos) e p não hibridizados (violeta) aparecem no modelo 3D.${c.conj ? ' Atenção: este par está conjugado com uma ligação π; na prática o átomo se comporta como sp² (plano).' : ''}`)); M.st.hybOrb = i; M.st.sel = i; M.rebuild(); }));
    };
    step(0);
  };
  const go = () => {
    const LS = L(key);
    const svg = lewisSVG(LS, { scale: 46, fs: 18 });
    clear(fig).append(svg);
    overlayAtoms(svg, LS, (i) => { M.select(i); }, { skipH: true });
    if (M) M.v.dispose(); clear(v);
    M = molScene(v, LS, { lp: true, dist: key === 'final' || key === 'CH3COOH' || key === 'acetona' ? 8.5 : 6.5, pick: true, pickH: false, onSelect: (i) => ask(i) });
    q.replaceChildren(h('p', { class: 'hint3' }, 'Clique em um átomo (na estrutura de Lewis ou no modelo 3D).'));
  };
  host.append(h('div', { class: 'controls' }, h('label', null, 'Molécula: ', sel(molOpts(HKEYS), key, (x) => { key = x; go(); }))), h('div', { class: 'grid2' }, h('div', null, fig, q), v));
  go();
}

/* ===================================================================
 * 84–85. Construtor molecular (cadeia) e contador σ/π
 * =================================================================== */
const ELB = ['C', 'N', 'O', 'F', 'Cl'];
export function molBuilder(host) {
  let els = ['C', 'C', 'C', 'C', 'N'], bo = [1, 2, 1, 3];
  const ctl = h('div', { class: 'mbrow' }), fig = h('div', { class: 'figs' }), v = vbox(), tbl = h('div'), warn = h('div', { 'aria-live': 'polite' });
  let M = null;
  const smiles = () => els.map((e, k) => (k ? ['', '', '=', '#'][bo[k - 1]] : '') + (e === 'Cl' ? 'Cl' : e)).join('');
  const render = () => {
    clear(ctl);
    els.forEach((e, k) => {
      ctl.append(sel(ELB.map((x) => [x, x]), e, (x) => { els[k] = x; update(); }, `átomo ${k + 1}`));
      if (k < els.length - 1) ctl.append(sel([['1', '—'], ['2', '='], ['3', '≡']], String(bo[k]), (x) => { bo[k] = +x; update(); }, `ligação ${k + 1}–${k + 2}`));
    });
    ctl.append(h('button', { class: 'btn sm', type: 'button', disabled: els.length >= 6, onclick: () => { els.push('C'); bo.push(1); render(); update(); } }, '+ átomo'), h('button', { class: 'btn sm', type: 'button', disabled: els.length <= 1, onclick: () => { els.pop(); bo.pop(); render(); update(); } }, '− átomo'));
  };
  const update = () => {
    // valência
    const errs = [];
    els.forEach((e, k) => { const b = (k ? bo[k - 1] : 0) + (k < els.length - 1 ? bo[k] : 0); const max = { C: 4, N: 3, O: 2, F: 1, Cl: 1 }[e]; if (b > max) errs.push(`${e}${k + 1} teria ${b} ligações; ${e} neutro faz no máximo ${max}.`); });
    if (errs.length) { warn.replaceChildren(fb('bad', '⚠ ' + errs.join('<br>'))); clear(tbl); return; }
    warn.innerHTML = '';
    const LS = fromSmiles(smiles(), 'molécula construída');
    clear(fig).append(lewisSVG(LS, { scale: 40, fs: 16, note: Object.fromEntries(els.map((_, k) => [k, String(k + 1)])) }));
    if (M) M.v.dispose(); clear(v);
    M = molScene(v, LS, { lp: true, hyb: true, angles: false, dist: 4 + els.length * 1.1 });
    const s = sigmaPi(LS);
    clear(tbl).append(h('div', { class: 'table-wrap' }, h('table', null, h('thead', null, h('tr', null, ['átomo', 'domínios', 'geometria', 'ângulo', 'hibridização'].map((t) => h('th', null, t)))), h('tbody', null, els.map((e, k) => { const c = centerInfo(LS, k); return h('tr', null, h('td', null, `${e}${k + 1}`), h('td', null, String(c.D)), h('td', null, c.X > 1 ? c.mgeo : c.egeo + ' (eletrônica)'), h('td', null, c.ang), h('td', null, c.hyb || '—')); })))), h('p', { class: 'readout', html: `<span>ligações σ: <b>${s.s}</b></span><span>ligações π: <b>${s.p}</b></span><span>orbitais p em ligações π: <b>${2 * s.p}</b></span>` }));
  };
  host.append(h('p', { class: 'hint3' }, 'Escolha os átomos da cadeia e as ligações entre eles; os H são completados automaticamente pela valência.'), ctl,
    h('div', { class: 'ex-actions' }, h('button', { class: 'btn sm', type: 'button', onclick: () => { els = ['C', 'C', 'C', 'C', 'N']; bo = [1, 2, 1, 3]; render(); update(); } }, 'CH₃CH=CHC≡N'), h('button', { class: 'btn sm', type: 'button', onclick: () => { els = ['C', 'O']; bo = [2]; render(); update(); } }, 'H₂C=O'), h('button', { class: 'btn sm', type: 'button', onclick: () => { els = ['O', 'C', 'O']; bo = [2, 2]; render(); update(); } }, 'O=C=O'), h('button', { class: 'btn sm', type: 'button', onclick: () => { els = ['C', 'C', 'O']; bo = [1, 1]; render(); update(); } }, 'etanol')),
    warn, h('div', { class: 'grid2' }, fig, v), tbl, SP_LEGEND());
  render(); update();
}
export function spCounter(host) {
  const keys = ['etano', 'eteno', 'etino', 'propeno', 'HCN', 'CO2', 'CH2O', 'acetonitrila', 'final', 'benzeno'];
  let k = 0;
  const box = h('div');
  const go = () => {
    const key = keys[k % keys.length], LS = L(key), s = sigmaPi(LS);
    const iS = h('input', { type: 'number', min: 0, max: 20, 'aria-label': 'número de σ', style: 'width:70px' }), iP = h('input', { type: 'number', min: 0, max: 6, 'aria-label': 'número de π', style: 'width:70px' });
    const res = h('div'), v = vbox('short');
    clear(box).append(h('div', { class: 'grid2' }, h('div', null, h('figure', { class: 'fig' }, lewisSVG(LS, { scale: 40 }), h('figcaption', null, MOLS[key][1] + ' — ' + MOLS[key][2])), h('div', { class: 'controls' }, h('label', null, 'σ = ', iS), h('label', null, 'π = ', iP), h('button', { class: 'btn primary', type: 'button', onclick: () => {
      const ok = +iS.value === s.s && +iP.value === s.p;
      res.replaceChildren(fb(ok ? 'ok' : 'bad', `${ok ? '✔' : '✘'} ${s.s} σ e ${s.p} π. Toda ligação tem exatamente uma σ; cada ligação dupla acrescenta 1 π e cada tripla, 2 π.`));
      clear(v); molScene(v, LS, { sp: true, cloud: true, hint: false, dist: key === 'final' || key === 'benzeno' ? 8.5 : 6.5 });
    } }, 'Conferir'), h('button', { class: 'btn', type: 'button', onclick: () => { k++; go(); } }, 'Próxima →')), res), v), SP_LEGEND());
  };
  host.append(box); go();
}
/* modos rápidos */
export function quickMode(host, kind = 'geo') {
  const keys = ['CH4', 'NH3', 'H2O', 'CO2', 'BF3', 'HCN', 'CH2O', 'CH3OH', 'eteno', 'etino', 'propeno', 'acetona', 'imina', 'SO2', 'NH4', 'H3O', 'acetonitrila', 'metilamina'];
  let n = 0, ok = 0;
  const box = h('div'), stat = h('div', { class: 'ch-stats' });
  const upd = () => { stat.innerHTML = `<div><b>${ok}/${n}</b><small>acertos</small></div>`; };
  const ask = () => {
    const key = rnd(keys), LS = L(key), cs = LS.atoms.map((a, i) => i).filter((i) => LS.atoms[i].el !== 'H' && nbs(LS, i).length > 1);
    const i = rnd(cs), c = centerInfo(LS, i);
    const ans = kind === 'geo' ? c.mgeo : c.hyb, opts = kind === 'geo' ? GEOS : ['sp³', 'sp²', 'sp'];
    clear(box).append(h('figure', { class: 'fig' }, lewisSVG(LS, { scale: 42, halo: { [i]: 'g' } }), h('figcaption', { html: `${kind === 'geo' ? 'Geometria molecular' : 'Hibridização'} do <b>${LS.atoms[i].el}</b> destacado?` })),
      choice(opts, ans, (good) => { n++; if (good) ok++; upd(); box.append(fb(good ? 'ok' : 'bad', `${c.axe}: ${c.D} domínios → ${c.egeo} (eletrônica) · ${c.mgeo} (molecular) · ${c.hyb} · ≈ ${c.ang}.`), img3d(LS, { w: 240, h: 170, lp: true, dist: 6 }), h('button', { class: 'btn sm', type: 'button', onclick: ask }, 'Próxima →')); }));
  };
  host.append(stat, box); upd(); ask();
}
void S; void shuffle; void VAL; void bondOf; void placeOrbital; void sub;
