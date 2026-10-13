/*
 * lab.js — Laboratório Molecular 3D: alcenos e alcinos com orbitais, ligações σ/π,
 * hibridização e medida de ângulos.
 */
import { THREE, Viewer, Mol, V, ELEM, tetraDirs, lobe, label } from './viewer3d.js';
import { buildAlkene, buildAlkyne, ANG, piLobe } from './scenes.js';
import { h } from './widgets2d.js';

function cyclohexene() {
  const C = [[0.67, 0, 0], [-0.67, 0, 0], [-1.42, 1.3, 0], [-0.62, 2.55, 0.42], [0.62, 2.55, -0.42], [1.42, 1.3, 0]];
  const atoms = C.map((p) => ({ el: 'C', p }));
  const bonds = [[0, 1, 2, { normal: [0, 0, 1] }], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0]];
  const nb = { 0: [1, 5], 1: [0, 2], 2: [1, 3], 3: [2, 4], 4: [3, 5], 5: [4, 0] };
  const addH = (i, d, L = 1.09) => { const k = atoms.push({ el: 'H', p: V.add(atoms[i].p, V.mul(V.norm(d), L)) }) - 1; bonds.push([i, k]); };
  [0, 1].forEach((i) => { const [a, b] = nb[i]; addH(i, V.mul(V.add(V.norm(V.sub(C[a], C[i])), V.norm(V.sub(C[b], C[i]))), -1), 1.08); });
  [2, 3, 4, 5].forEach((i) => {
    const [a, b] = nb[i];
    const u = V.norm(V.sub(C[a], C[i])), w = V.norm(V.sub(C[b], C[i]));
    const bis = V.norm(V.mul(V.add(u, w), -1)), n = V.norm(V.cross(u, w));
    [1, -1].forEach((sg) => addH(i, V.add(V.mul(bis, 0.58), V.mul(n, 0.81 * sg))));
  });
  return { atoms, bonds };
}

export const LAB = {
  eteno: { n: 'eteno', f: 'CH₂=CH₂', b: () => buildAlkene(['H', 'H', 'H', 'H']), note: 'Os 6 átomos estão no mesmo plano; ângulos ≈ 120° (sp²). C=C ≈ 1,34 Å (mais curta que C–C, 1,54 Å).' },
  propeno: { n: 'propeno', f: 'CH₃CH=CH₂', b: () => buildAlkene(['H', 'H', 'CH3', 'H']), note: 'Alceno monossubstituído e assimétrico: os dois carbonos sp² são diferentes (importante para Markovnikov).' },
  but1eno: { n: 'but-1-eno', f: 'CH₂=CHCH₂CH₃', b: () => buildAlkene(['H', 'H', 'Et', 'H']), note: 'Dupla terminal; o grupo etila gira livremente em torno das ligações σ C–C.' },
  cis2buteno: { n: 'cis-2-buteno (Z)', f: 'CH₃CH=CHCH₃', b: () => buildAlkene(['CH3', 'H', 'CH3', 'H']), note: 'CH₃ do mesmo lado: repulsão estérica → menos estável que o trans (ΔH°hidrog −120 × −116 kJ/mol).' },
  trans2buteno: { n: 'trans-2-buteno (E)', f: 'CH₃CH=CHCH₃', b: () => buildAlkene(['CH3', 'H', 'H', 'CH3']), note: 'CH₃ em lados opostos. Não se converte no cis à temperatura ambiente: seria preciso romper a ligação π.' },
  metilbut2eno: { n: '2-metilbut-2-eno', f: '(CH₃)₂C=CHCH₃', b: () => buildAlkene(['CH3', 'CH3', 'CH3', 'H']), note: 'Trissubstituído: mais estável que os dissubstituídos (hiperconjugação). Não tem isômeros E/Z (um dos C tem dois CH₃).' },
  ciclohexeno: { n: 'ciclo-hexeno', f: 'C₆H₁₀', b: cyclohexene, note: 'Cicloalceno: a dupla no anel é necessariamente cis. Conformação de meia-cadeira: 4 carbonos (C=C e vizinhos) quase no mesmo plano.' },
  etino: { n: 'etino (acetileno)', f: 'HC≡CH', b: () => buildAlkyne(['H', 'H']), note: 'Linear (180°). C≡C ≈ 1,20 Å. H com pKa ≈ 25: o mais "ácido" entre os hidrocarbonetos simples.' },
  propino: { n: 'propino', f: 'CH₃C≡CH', b: () => buildAlkyne(['CH3', 'H']), note: 'Alcino terminal: forma acetileto com NaNH₂.' },
  but1ino: { n: 'but-1-ino', f: 'HC≡CCH₂CH₃', b: () => buildAlkyne(['H', 'Et']), note: 'Alcino terminal; o fragmento H–C≡C–C é linear.' },
  but2ino: { n: 'but-2-ino', f: 'CH₃C≡CCH₃', b: () => buildAlkyne(['CH3', 'CH3']), note: 'Alcino interno: 4 carbonos alinhados; sem H ácido. Lindlar → (Z)-but-2-eno; Na/NH₃ → (E)-but-2-eno.' },
};

export function lab(host) {
  const list = h('div', { class: 'opts', role: 'listbox', 'aria-label': 'Moléculas' });
  const vbox = h('div', { class: 'viewer tall' });
  const info = h('div', { class: 'stepcap', 'aria-live': 'polite' });
  const meas = h('div', { class: 'stepcap', 'aria-live': 'polite' }, 'Medir ângulo: ative e clique em 3 átomos (o do meio é o vértice).');
  const tg = (k, t, on) => h('button', { class: 'btn sm', type: 'button', 'aria-pressed': on ? 'true' : 'false', 'data-k': k }, t);
  const styleSeg = h('div', { class: 'seg', role: 'group', 'aria-label': 'Representação' },
    h('button', { type: 'button', 'aria-pressed': 'true', 'data-style': 'ball' }, 'bola-e-vareta'),
    h('button', { type: 'button', 'aria-pressed': 'false', 'data-style': 'space' }, 'space-filling'));
  const toggles = h('div', { class: 'controls' }, styleSeg, tg('hyb', 'hibridização (sp², sp)', true), tg('orb', 'orbitais p', false), tg('pi', 'ligações σ / π', false), tg('ang', '📐 medir ângulo', false), tg('spin', 'girar 360°', false));
  host.append(h('div', { class: 'split rev' },
    h('div', null, h('div', { class: 'optgroup' }, h('h4', null, 'Moléculas'), list), info, meas),
    h('div', null, toggles, vbox, h('div', { class: 'legend' },
      ...[['C', 'carbono'], ['H', 'hidrogênio']].map(([e, n]) => h('span', null, h('i', { style: `background:#${ELEM[e].color.toString(16).padStart(6, '0')}` }), n)),
      h('span', null, h('i', { style: 'background:transparent;border:2px solid var(--cyan)' }), 'C sp²'),
      h('span', null, h('i', { style: 'background:transparent;border:2px solid var(--magenta)' }), 'C sp'),
      h('span', null, h('i', { style: 'background:#ff9f43' }), 'orbital p'),
      h('span', null, h('i', { style: 'background:#2fd4f5' }), 'componente π da ligação múltipla')))));
  const st = { style: 'ball', hyb: true, orb: false, pi: false, ang: false, spin: false };
  let v = null, mol = null, extras = null, picks = [], cur = 'eteno';
  Object.entries(LAB).forEach(([k, m]) => list.append(h('label', { class: 'opt-radio' }, h('input', { type: 'radio', name: 'labmol', value: k, checked: k === cur ? true : null }), h('span', { html: m.n }), h('small', null, m.f))));
  list.addEventListener('change', (e) => { cur = e.target.value; build(); });
  styleSeg.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; st.style = b.dataset.style; styleSeg.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', x === b)); if (mol) mol.setStyle(st.style); });
  toggles.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-k]'); if (!b) return;
    const k = b.dataset.k; st[k] = !st[k]; b.setAttribute('aria-pressed', st[k]);
    if (k === 'ang') { picks = []; meas.textContent = st.ang ? 'Clique em 3 átomos (o do meio é o vértice).' : 'Medida de ângulo desligada.'; }
    apply();
  });
  function build() {
    if (v) v.dispose();
    vbox.innerHTML = '';
    const M = LAB[cur], B = M.b();
    v = new Viewer(vbox, { camPos: [2.2, 2.6, 8.5], alt: 'Modelo 3D de ' + M.n });
    info.innerHTML = `<b>${M.n}</b> · ${M.f}<p style="margin:.5em 0 0">${M.note}</p>`;
    if (!v.ok) return;
    const ctr = B.atoms.reduce((a, x) => V.add(a, x.p), [0, 0, 0]).map((q) => q / B.atoms.length);
    v.setCamera([ctr[0] + 2.2, ctr[1] + 2.6, ctr[2] + 9], ctr);
    mol = new Mol(v, B.atoms.map((a) => ({ el: a.el, p: a.p.slice() })), B.bonds, { style: st.style });
    // hibridização
    const hyb = mol.atoms.map((a, i) => {
      if (a.el !== 'C') return null;
      const bs = mol.bonds.filter((b) => b.i === i || b.j === i);
      return bs.some((b) => b.order === 3) ? 'sp' : bs.some((b) => b.order === 2) ? 'sp²' : 'sp³';
    });
    extras = { halos: [], labels: [], lobes: [], pis: [] };
    hyb.forEach((t, i) => {
      if (!t) return;
      if (t !== 'sp³') extras.halos.push(mol.halo(i, t === 'sp' ? 0xff4fa3 : 0x2fd4f5, 1.7));
      extras.labels.push(mol.addLabel(i, t, 'tag' + (t === 'sp' ? ' m' : t === 'sp²' ? ' c' : ''), [0, -0.62, 0.35]));
    });
    // orbitais p: normal ao plano dos vizinhos (sp²) ou dois p ⊥ (sp)
    mol.bonds.filter((b) => b.order >= 2).forEach((b) => {
      const A = mol.atoms[b.i].p, Bp = mol.atoms[b.j].p, ax = V.norm(V.sub(Bp, A));
      let n1 = b.opt.normal ? V.norm(b.opt.normal) : [0, 0, 1];
      if (Math.abs(V.dot(n1, ax)) > 0.9) n1 = V.norm(V.cross(ax, [0, 1, 0]));
      n1 = V.norm(V.sub(n1, V.mul(ax, V.dot(n1, ax))));
      const sets = b.order === 3 ? [n1, V.norm(V.cross(ax, n1))] : [n1];
      if (b.order === 2) { // normal ao plano σ: use os vizinhos
        const nbs = mol.bonds.filter((x) => (x.i === b.i || x.j === b.i) && x !== b).map((x) => (x.i === b.i ? x.j : x.i));
        if (nbs.length) { const w = V.norm(V.sub(mol.atoms[nbs[0]].p, A)); const n = V.norm(V.cross(ax, w)); if (V.len(n) > 0.1) sets[0] = n; }
      }
      sets.forEach((n, si) => {
        [A, Bp].forEach((P) => [1, -1].forEach((sg) => { const l = lobe(v.scene, 0xff9f43, 0.4); l.set(P, V.mul(n, sg), 0.85, 0.38); extras.lobes.push(l); }));
        [1, -1].forEach((sg) => {
          const l = piLobe(v.scene, si ? 0xb18cff : 0x2fd4f5, V.lerp(A, Bp, 0.5), ax, V.mul(n, sg), { len: V.len(V.sub(Bp, A)) * 0.95, w: 0.48, d: 0.52 });
          extras.pis.push(l);
        });
      });
    });
    const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
    v.renderer.domElement.addEventListener('click', (e) => {
      if (!st.ang) return;
      const r = v.renderer.domElement.getBoundingClientRect();
      mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(mouse, v.camera);
      const hit = ray.intersectObjects(mol.meshes)[0];
      if (!hit) return;
      if (picks.length >= 3) picks = [];
      picks.push(mol.meshes.indexOf(hit.object));
      apply();
    });
    picks = [];
    apply();
  }
  function apply() {
    if (!mol || !v || !v.ok) return;
    extras.halos.forEach((x) => { x.on = st.hyb; });
    extras.labels.forEach((l) => mol.setLabel(l, st.hyb ? l.obj.userData.div.textContent : null));
    extras.lobes.forEach((l) => l.show(st.orb && !st.pi));
    extras.pis.forEach((l) => l.show(st.pi));
    mol.bonds.forEach((b, k) => mol.bondMeshes[k].forEach((m, n) => m.material.color.set(st.pi && b.order >= 2 && (b.order === 2 ? n === 1 : n > 0) ? 0x2fd4f5 : st.pi ? 0xff9f43 : 0xaeb8c8)));
    mol.meshes.forEach((m) => m.material.emissive && m.material.emissive.set(0x000000));
    picks.forEach((i) => mol.meshes[i].material.emissive.set(0x665500));
    if (st.ang) {
      const nm = (i) => mol.atoms[i].el;
      meas.innerHTML = picks.length === 3 ? `Ângulo ${picks.map(nm).join('–')} = <span class="dihedral">${ANG(...picks.map((i) => mol.atoms[i].p)).toFixed(1)}°</span>` : `Selecionados: ${picks.map(nm).join(' → ') || 'nenhum'} (${picks.length}/3)`;
    }
    v.controls.autoRotate = st.spin;
    mol.update();
  }
  build();
  return { dispose() { if (v) v.dispose(); } };
}
export { tetraDirs, label };
