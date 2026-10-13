/*
 * lab.js — Laboratório Molecular 3D para E1/E2: α/β/Hβ, diedros, rotação
 * em torno de Cα–Cβ, vista de Newman e cadeiras do ciclo-hexano.
 */
import { THREE, Viewer, Mol, V, ELEM, BOND, tetraDirs, groupTemplate, placeGroup, label, line3 } from './viewer3d.js';
import { chairScene, CHAIR_SUBS, dihedral } from './scenes.js';
import { h } from './widgets2d.js';

const rot = (v, axis, ang) => {
  const k = V.norm(axis), c = Math.cos(ang), s = Math.sin(ang);
  return V.add(V.add(V.mul(v, c), V.mul(V.cross(k, v), s)), V.mul(k, V.dot(k, v) * (1 - c)));
};
const C = (...k) => ({ el: 'C', k });
const ME = C('H', 'H', 'H');

/* Construção em árvore com conformação alternada: os ligantes do filho são
 * os opostos dos demais ligantes do pai (diedros de 180°). */
function build(tree) {
  const atoms = [], bonds = [];
  const add = (el, p, tag) => { atoms.push({ el, p, tag }); return atoms.length - 1; };
  const UP = [0, 1, 0];
  const root = add('C', [0, 0, 0], 'ca');
  const d4 = [UP, ...tetraDirs(UP, Math.PI / 2)];
  const place = (spec, parent, d, depth) => {
    if (typeof spec === 'string' && spec === 'CH3') spec = ME;
    const pp = atoms[parent].p;
    if (spec === 'Ph') {
      const tpl = groupTemplate('Ph'), base = atoms.length;
      placeGroup(tpl, pp, d, Math.PI / 2).forEach((p, n) => add(tpl.atoms[n].el, p, depth === 1 && n === 0 ? 'cb' : 'ring'));
      const nr = V.norm(V.cross(V.sub(atoms[base + 1].p, atoms[base].p), V.sub(atoms[base + 2].p, atoms[base].p)));
      bonds.push([parent, base]); tpl.bonds.forEach((b) => bonds.push([base + b[0], base + b[1], b[2] || 1, b[3] ? { normal: nr } : {}]));
      return;
    }
    if (spec === 'vinyl') {
      const c2 = add('C', V.add(pp, V.mul(d, 1.5)), 'cb'); bonds.push([parent, c2]);
      let n = V.cross(d, [0, 0, 1]); if (V.len(n) < 1e-3) n = V.cross(d, [1, 0, 0]); n = V.norm(n);
      const back = V.mul(d, -1);
      const dC3 = rot(back, n, 2 * Math.PI / 3), dH = rot(back, n, -2 * Math.PI / 3);
      const c3 = add('C', V.add(atoms[c2].p, V.mul(dC3, BOND['C=C'])), 'g'); bonds.push([c2, c3, 2, { normal: n }]);
      const hb = add('H', V.add(atoms[c2].p, V.mul(dH, 1.08)), 'hbv'); bonds.push([c2, hb]);
      const b3 = V.mul(dC3, -1);
      [rot(b3, n, 2 * Math.PI / 3), rot(b3, n, -2 * Math.PI / 3)].forEach((e) => { const k = add('H', V.add(atoms[c3].p, V.mul(e, 1.08)), 'g'); bonds.push([c3, k]); });
      return;
    }
    if (typeof spec === 'string') {
      const L = spec === 'H' ? BOND['C-H'] : BOND['C-' + spec] || 1.9;
      const k = add(spec, V.add(pp, V.mul(d, L)), spec === 'H' ? (depth === 1 ? 'ha' : depth === 2 ? 'hbq' : 'h') : 'lg');
      bonds.push([parent, k]);
      return;
    }
    const c = add('C', V.add(pp, V.mul(d, BOND['C-C'])), depth === 1 ? 'cb' : 'c');
    bonds.push([parent, c]);
    const own = atoms[parent]._d4.filter((x) => x !== d).map((x) => V.mul(x, -1));
    atoms[c]._d4 = [V.mul(d, -1), ...own];
    spec.k.forEach((ks, i) => place(ks, c, atoms[c]._d4[i + 1], depth + 1));
  };
  atoms[root]._d4 = d4;
  tree.forEach((ks, i) => place(ks, root, d4[i], 1));
  return { atoms, bonds };
}

export const LAB = {
  bromobutano1: { name: '1-bromobutano', cls: 'primário', tree: ['Br', C('H', 'H', C('H', 'H', 'CH3')), 'H', 'H'], note: 'Primário: um único carbono β (2 Hβ). Com base pequena, SN2 predomina; com t-BuO⁻, E2 → but-1-eno.' },
  bromobutano2: { name: '2-bromobutano', cls: 'secundário', tree: ['Br', C('H', 'CH3', 'H'), 'CH3', 'H'], note: 'Dois carbonos β diferentes (C1 e C3) → but-1-eno e but-2-eno. Em C3, cada Hβ anti ao Br leva a um estereoisômero: gire C3 e compare (E com CH₃/CH₃ anti; Z com CH₃/CH₃ gauche).' },
  bromopentano2: { name: '2-bromopentano', cls: 'secundário', tree: ['Br', C('H', C('H', 'H', 'CH3'), 'H'), 'CH3', 'H'], note: 'Como o 2-bromobutano, com um etila em C3: pent-2-eno (Zaitsev, E > Z) e pent-1-eno (Hofmann).' },
  bromometilbutano: { name: '2-bromo-2-metilbutano', cls: 'terciário', tree: ['Br', C('H', 'CH3', 'H'), 'CH3', 'CH3'], note: 'Três carbonos β: dois CH₃ (6 Hβ acessíveis) e um CH₂ (2 Hβ mais impedidos). Zaitsev: 2-metilbut-2-eno; Hofmann (t-BuO⁻): 2-metilbut-1-eno.' },
  tbutil: { name: 'brometo de terc-butila', cls: 'terciário', tree: ['Br', 'CH3', 'CH3', 'CH3'], note: 'Nove Hβ equivalentes: só um alceno possível (2-metilpropeno). E2 com base forte; E1/SN1 em solvente prótico.' },
  benzyl: { name: 'brometo de benzila', cls: 'benzílico', tree: ['Br', 'Ph', 'H', 'H'], note: 'O carbono β é o C ipso do anel: <b>não tem H</b>. Sem Hβ, não há eliminação β; reage por SN2 (ou SN1, cátion estabilizado por ressonância).' },
  allyl: { name: 'brometo de alila', cls: 'alílico', tree: ['Br', 'vinyl', 'H', 'H'], note: 'O carbono β é sp² (=CH–). A eliminação formaria um aleno (C=C=C), muito desfavorável: espera-se substituição.' },
  bromoetano: { name: 'bromoetano', cls: 'primário', tree: ['Br', 'CH3', 'H', 'H'], note: 'Exemplo mais simples: 3 Hβ no CH₃. Gire o CH₃ e veja que sempre há um Hβ que pode ficar anti ao Br.' },
};
const CHAIRS = { metil: '1-bromo-1-metilciclo-hexano', bromo: 'bromociclo-hexano', cis: 'cis-1-bromo-4-terc-butil', trans: 'trans-1-bromo-4-terc-butil' };

export function lab(host) {
  const list = h('div', { class: 'opts', role: 'listbox', 'aria-label': 'Moléculas' });
  const vbox = h('div', { class: 'viewer tall' });
  const info = h('div', { class: 'stepcap', 'aria-live': 'polite' });
  const dhBox = h('div', { class: 'stepcap', 'aria-live': 'polite' });
  const pickBox = h('div', { class: 'stepcap', 'aria-live': 'polite' }, 'Modo diedro: clique em 4 átomos em sequência.');
  const rng = h('input', { type: 'range', min: 0, max: 359, value: 0, 'aria-label': 'Rotação em torno de Cα–Cβ' });
  const rngVal = h('span', { class: 'val' }, '0°');
  const cbSel = h('div', { class: 'seg', role: 'group', 'aria-label': 'Carbono β ativo' });
  const tg = (k, t, on) => h('button', { class: 'btn sm', type: 'button', 'aria-pressed': on ? 'true' : 'false', 'data-k': k }, t);
  const styleSeg = h('div', { class: 'seg', role: 'group', 'aria-label': 'Representação' },
    h('button', { type: 'button', 'aria-pressed': 'true', 'data-style': 'ball' }, 'bola-e-vareta'),
    h('button', { type: 'button', 'aria-pressed': 'false', 'data-style': 'space' }, 'space-filling'));
  const toggles = h('div', { class: 'controls' }, styleSeg, tg('ab', 'α / β / Hβ', true), tg('dh', '📐 medir diedro', false), tg('newman', '👁 vista de Newman', false), tg('spin', 'girar 360°', false));
  const acyc = h('div', null, h('div', { class: 'controls' }, h('span', { class: 'chip' }, 'Cβ ativo:'), cbSel), h('div', { class: 'range-row' }, h('span', { class: 'chip' }, 'rotação Cα–Cβ'), rng, rngVal), h('div', { class: 'controls', 'data-anti': '' }));
  const chairCtl = h('div', { class: 'controls' }, h('button', { class: 'btn sm primary', type: 'button', onclick: () => { if (chair) chair.flip(); } }, '⇅ Inverter cadeira'));
  host.append(h('div', { class: 'split rev' },
    h('div', null, h('div', { class: 'optgroup' }, h('h4', null, 'Moléculas'), list), info, dhBox, pickBox),
    h('div', null, toggles, acyc, chairCtl, vbox, h('div', { class: 'legend' },
      ...[['C', 'carbono'], ['H', 'hidrogênio'], ['Br', 'bromo']].map(([e, n]) => h('span', null, h('i', { style: `background:#${ELEM[e].color.toString(16).padStart(6, '0')}` }), n)),
      h('span', null, h('i', { style: 'background:#2fd4f5' }), 'Hβ do Cβ ativo'),
      h('span', null, h('i', { style: 'background:#3ddc97' }), 'Hβ anti-periplanar ao Br'),
      h('span', null, h('i', { style: 'background:transparent;border:2px solid var(--magenta)' }), 'grupo abandonador')))));
  const st = { style: 'ball', ab: true, dh: false, newman: false, spin: false };
  let v = null, mol = null, M = null, base = null, frag = [], cbs = [], cb = 0, ang = 0, labels = [], picks = [], pline = [], chair = null, hbList = [], lgI = -1;
  let cur = 'bromobutano2';
  const all = Object.entries(LAB).map(([k, m]) => [k, m.name, m.cls]).concat(Object.entries(CHAIRS).map(([k, n]) => ['chair:' + k, n, 'ciclo-hexano']));
  all.forEach(([k, n, c]) => list.append(h('label', { class: 'opt-radio' }, h('input', { type: 'radio', name: 'labmol', value: k, checked: k === cur ? true : null }), h('span', { html: n }), h('small', null, c))));
  list.addEventListener('change', (e) => { cur = e.target.value; make(); });
  styleSeg.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    st.style = b.dataset.style; styleSeg.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', x === b));
    if (mol) mol.setStyle(st.style);
  });
  toggles.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-k]'); if (!b) return;
    const k = b.dataset.k; st[k] = !st[k]; b.setAttribute('aria-pressed', st[k]);
    if (k === 'spin' && v && v.ok) v.controls.autoRotate = st.spin;
    if (k === 'newman') newman();
    if (k === 'dh') { picks = []; refresh(); pickBox.textContent = st.dh ? 'Modo diedro ativo: clique em 4 átomos em sequência (ex.: Hβ → Cβ → Cα → Br).' : 'Modo diedro desligado.'; }
    if (k === 'ab') refresh();
  });
  rng.addEventListener('input', () => { ang = +rng.value; rngVal.textContent = ang + '°'; apply(); });

  function make() {
    if (v) v.dispose();
    vbox.innerHTML = ''; chair = null; mol = null;
    if (cur.startsWith('chair:')) {
      const kind = cur.slice(6);
      acyc.style.display = 'none'; chairCtl.style.display = ''; toggles.querySelectorAll('[data-k="dh"],[data-k="newman"],[data-k="ab"]').forEach((b) => { b.disabled = true; });
      dhBox.innerHTML = ''; dhBox.style.display = 'none';
      pickBox.style.display = 'none';
      chair = chairScene(vbox, kind, (s) => {
        const tb = kind === 'cis' || kind === 'trans';
        info.innerHTML = `<b>${CHAIR_SUBS[kind].name}</b><br>${s.brAx ? '<span class="status-ok">Br axial</span>: os H axiais em C2 e C6 (verdes) estão anti-periplanares ao Br (trans-diaxiais) → <b>conformação reativa para E2</b>.' : '<span class="status-bad">Br equatorial</span>: nenhum Hβ fica anti ao Br (diedros ≈ 60°) → <b>conformação não reativa</b> para E2.'}` +
          (tb ? `<br><small>O grupo terc-butila praticamente "trava" a cadeira com ele em posição <b>equatorial</b>. ${kind === 'cis' ? 'No isômero <b>cis</b>, com t-Bu equatorial o Br fica <b>axial</b>: E2 rápida.' : 'No isômero <b>trans</b>, com t-Bu equatorial o Br fica <b>equatorial</b>: E2 muito mais lenta (exige a cadeira desfavorecida).'}</small>` : kind === 'metil' ? '<br><small>A E2 forma o alceno endocíclico (1-metilciclo-hexeno, Zaitsev) a partir dos H axiais do anel; o CH₃ também fornece Hβ (produto exocíclico, Hofmann).</small>' : '');
      });
      v = chair.v;
      return;
    }
    acyc.style.display = ''; chairCtl.style.display = 'none'; pickBox.style.display = ''; dhBox.style.display = '';
    toggles.querySelectorAll('button[data-k]').forEach((b) => { b.disabled = false; });
    M = LAB[cur];
    const B = build(M.tree);
    base = B.atoms.map((a) => a.p.slice());
    v = new Viewer(vbox, { camPos: [-2.5, 2.4, 10], alt: 'Modelo 3D de ' + M.name });
    info.innerHTML = `<b>${M.name}</b> <span class="chip">${M.cls}</span><p style="margin:.5em 0 0">${M.note}</p>`;
    if (!v.ok) return;
    const ctr = B.atoms.reduce((a, x) => V.add(a, x.p), [0, 0, 0]).map((q) => q / B.atoms.length);
    v.setCamera([ctr[0] - 3, ctr[1] + 3, ctr[2] + 11], ctr);
    mol = new Mol(v, B.atoms.map((a) => ({ el: a.el, p: a.p.slice(), tag: a.tag })), B.bonds, { style: st.style });
    v.controls.autoRotate = st.spin;
    lgI = B.atoms.findIndex((a) => a.tag === 'lg');
    cbs = B.atoms.map((a, i) => (a.tag === 'cb' ? i : -1)).filter((i) => i >= 0);
    cb = 0; ang = 0; rng.value = 0; rngVal.textContent = '0°'; picks = [];
    // rótulos
    labels = [];
    labels.push(mol.addLabel(0, 'Cα', 'tag c', [-0.5, 0.2, 0.6]));
    mol.halo(lgI, 0xff4fa3, 1.4);
    cbLabel = mol.addLabel(cbs[0] ?? 0, 'Cβ', 'tag c', [0.4, 0.5, 0.5]);
    hbLabels = [];
    cbSel.innerHTML = '';
    cbs.forEach((c, i) => cbSel.append(h('button', { type: 'button', 'aria-pressed': i === 0 ? 'true' : 'false', onclick: (e) => { cb = i; ang = 0; rng.value = 0; rngVal.textContent = '0°'; [...cbSel.children].forEach((x) => x.setAttribute('aria-pressed', x === e.currentTarget)); setFrag(); } }, `Cβ ${i + 1} (${countH(c)} H)`)));
    // seleção de átomos (medição de diedro)
    const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
    v.renderer.domElement.addEventListener('click', (e) => {
      if (!st.dh) return;
      const r = v.renderer.domElement.getBoundingClientRect();
      mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(mouse, v.camera);
      const hit = ray.intersectObjects(mol.meshes.filter((m) => m.visible))[0];
      if (!hit) return;
      const i = mol.meshes.indexOf(hit.object);
      if (picks.length >= 4) picks = [];
      picks.push(i);
      refresh();
    });
    pline = [0, 1, 2].map(() => line3(v.scene, 0xffd45c, false));
    setFrag();
  }
  let cbLabel = null, hbLabels = [];
  function countH(c) { return mol.bonds.filter((b) => (b.i === c && mol.atoms[b.j].el === 'H') || (b.j === c && mol.atoms[b.i].el === 'H')).length; }
  function setFrag() {
    const c = cbs[cb];
    // fragmento do lado de Cβ
    const adj = {}; mol.bonds.forEach((b) => { (adj[b.i] = adj[b.i] || []).push(b.j); (adj[b.j] = adj[b.j] || []).push(b.i); });
    const seen = new Set([0, c]); const stack = [c]; frag = [c];
    while (stack.length) { const x = stack.pop(); (adj[x] || []).forEach((y) => { if (!seen.has(y)) { seen.add(y); frag.push(y); stack.push(y); } }); }
    hbList = (adj[c] || []).filter((y) => mol.atoms[y].el === 'H');
    hbLabels.forEach((l) => mol.setLabel(l, null));
    hbLabels = hbList.map((hh, i) => mol.addLabel(hh, 'Hβ' + (hbList.length > 1 ? '<sub>' + (i + 1) + '</sub>' : ''), 'tag c', [0.25, 0.35, 0.25]));
    cbLabel.i = c;
    const anti = acyc.querySelector('[data-anti]');
    anti.innerHTML = '';
    hbList.forEach((hh, i) => anti.append(h('button', { class: 'btn sm', type: 'button', onclick: () => { ang = antiAngle(hh); rng.value = ang; rngVal.textContent = ang + '°'; apply(); } }, `Hβ${hbList.length > 1 ? i + 1 : ''} anti ao Br`)));
    apply();
  }
  function antiAngle(hh) {
    // procura o ângulo que leva o diedro a 180°
    let best = 0, bd = 1e9;
    for (let a = 0; a < 360; a += 1) { const d = Math.abs(Math.abs(dhAt(hh, a)) - 180); if (d < bd) { bd = d; best = a; } }
    return best;
  }
  function posAt(i, a) {
    const c = cbs[cb];
    if (!frag.includes(i) || i === c) return base[i];
    const axis = V.sub(base[c], base[0]);
    return V.add(base[c], rot(V.sub(base[i], base[c]), axis, a * Math.PI / 180));
  }
  function dhAt(hh, a) { return dihedral(posAt(hh, a), base[cbs[cb]], base[0], base[lgI]); }
  function apply() {
    if (!mol || !v.ok) return;
    mol.atoms.forEach((_, i) => mol.setPos(i, posAt(i, ang)));
    // cores dos Hβ
    mol.atoms.forEach((a, i) => { if (a.el === 'H') mol.meshes[i].material.color.set(ELEM.H.color); });
    const rows = [];
    hbList.forEach((hh, i) => {
      const d = Math.abs(dihedral(mol.atoms[hh].p, mol.atoms[cbs[cb]].p, mol.atoms[0].p, mol.atoms[lgI].p));
      const anti = Math.abs(d - 180) < 8;
      if (st.ab) mol.meshes[hh].material.color.set(anti ? 0x3ddc97 : 0x2fd4f5);
      rows.push(`Hβ${hbList.length > 1 ? i + 1 : ''}–Cβ–Cα–Br: <b style="font-family:var(--mono)">${d.toFixed(0)}°</b> ${anti ? '<span class="status-ok">anti-periplanar ✓</span>' : d < 15 ? '<span class="status-bad">sin-periplanar</span>' : '<span style="color:var(--muted)">gauche/oblíquo</span>'}`);
    });
    const c = cbs[cb];
    dhBox.innerHTML = c === undefined ? '' : hbList.length ? `<b>Diedros no Cβ ativo</b><br>${rows.join('<br>')}<br><small>${rows.some((r) => r.includes('✓')) ? '<span class="status-ok">Geometria favorável à E2</span>' : '<span class="status-bad">Geometria desfavorável</span>: gire até um Hβ ficar a 180°.'}</small>` : '<b>Este carbono β não tem hidrogênios</b>: não pode participar de eliminação β.';
    labels.forEach((l) => { l.visible = st.ab; });
    if (cbLabel) mol.setLabel(cbLabel, st.ab ? 'Cβ' : null);
    hbLabels.forEach((l) => mol.setLabel(l, st.ab ? l.obj.userData.div.innerHTML : null));
    labels.forEach((l) => mol.setLabel(l, st.ab ? 'Cα' : null));
    mol.update();
    refresh(true);
    if (st.newman) newman(true);
  }
  function refresh(noApply) {
    if (!mol || !v || !v.ok) return;
    mol.meshes.forEach((m) => m.material.emissive && m.material.emissive.set(0x000000));
    picks.forEach((i) => mol.meshes[i].material.emissive.set(0x665500));
    pline.forEach((l, k) => { const ok = st.dh && picks[k + 1] !== undefined; l.show(ok); if (ok) l.set(mol.atoms[picks[k]].p, mol.atoms[picks[k + 1]].p); });
    if (st.dh) {
      const nm = (i) => mol.atoms[i].el + (i === 0 ? '(α)' : i === cbs[cb] ? '(β)' : '');
      pickBox.innerHTML = picks.length === 4 ? `Diedro ${picks.map(nm).join('–')} = <span class="dihedral">${dihedral(...picks.map((i) => mol.atoms[i].p)).toFixed(1)}°</span>` : `Selecionados: ${picks.map(nm).join(' → ') || 'nenhum'} (${picks.length}/4)`;
    }
    if (!noApply) mol.update();
  }
  function newman(keep) {
    if (!v || !v.ok || !mol) return;
    if (!st.newman) { if (!keep) v.setCamera([-2.5, 2.4, 10], [0, 0, 0]); return; }
    const c = cbs[cb]; if (c === undefined) return;
    const a = mol.atoms[0].p, b = mol.atoms[c].p;
    const dir = V.norm(V.sub(a, b));
    const mid = V.lerp(a, b, 0.5);
    if (!keep) v.setCamera(V.add(a, V.mul(dir, 10)), mid);
  }
  make();
  return { dispose() { if (v) v.dispose(); } };
}
