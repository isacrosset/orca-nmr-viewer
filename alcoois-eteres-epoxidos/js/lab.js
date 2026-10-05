/*
 * lab.js — Laboratório Molecular 3D: álcoois, éteres e epóxidos com pares
 * livres, cargas parciais, destaque do O, ligações de H, medida de ângulos
 * e comparação da tensão de anel.
 */
import { THREE, Viewer, Mol, V, ELEM } from './viewer3d.js';
import { LIB, MB, addDecor, ANG, dropMol, hbDots } from './scenes.js';
import { h } from './widgets2d.js';

export const LAB = {
  metanol: { g: 'Álcoois', note: 'O álcool mais simples. O sp³ com dois pares livres; C–O–H ≈ 108,5°. Miscível com água; P.E. 65 °C.' },
  etanol: { g: 'Álcoois', note: 'Álcool 1°. Doa e aceita ligações de H: P.E. 78 °C, muito maior que o do éter dimetílico (−24 °C), de mesma massa molar.' },
  propan1ol: { g: 'Álcoois', note: 'Álcool 1° (C do OH ligado a 1 carbono). P.E. 97 °C; ainda miscível com água.' },
  propan2ol: { g: 'Álcoois', note: 'Álcool 2° (C do OH ligado a 2 carbonos). P.E. 82 °C: mais ramificado → menor área de contato que o propan-1-ol.' },
  tbutanol: { g: 'Álcoois', note: 'Álcool 3°. Sem H no carbono carbinólico: não sofre oxidação simples. Reage com HX por SN1.' },
  etilenoglicol: { g: 'Álcoois', note: 'Diol: dois grupos OH → muitas ligações de H. P.E. 197 °C; usado como anticongelante.' },
  eterDimetilico: { g: 'Éteres', note: 'C–O–C ≈ 112° (maior que 109,5° por repulsão entre os grupos). Só aceita ligações de H.' },
  eterDietilico: { g: 'Éteres', note: 'Solvente clássico (P.E. 35 °C). Forma peróxidos com O₂ e luz ao longo do tempo.' },
  thf: { g: 'Éteres', note: 'Éter cíclico de 5 membros: pequena tensão. O mais exposto → ótimo solvente para reagentes organometálicos (solvata Mg²⁺/Li⁺).' },
  anisol: { g: 'Éteres', note: 'Éter arílico: o par do O conjuga com o anel. A ligação C(sp²)–O não sofre SN2 (clivagem com HI dá fenol + CH₃I).' },
  oxirano: { g: 'Epóxidos', note: 'Anel de 3 membros: ângulos internos ≈ 60° (C–O–C ≈ 61,5°), longe de 109,5°. Grande tensão (≈ 115 kJ/mol) → muito mais reativo que éteres comuns.' },
  metiloxirano: { g: 'Epóxidos', note: 'Assimétrico: o C2 (mais substituído) é estereocentro. Base ataca o CH₂; ácido, o C2.' },
  dimetiloxirano: { g: 'Epóxidos', note: 'Um carbono primário e um terciário: contraste máximo entre abertura básica (CH₂) e ácida (C terciário).' },
  cisDimetiloxirano: { g: 'Epóxidos', note: 'Meso (plano de simetria). A abertura anti por qualquer um dos carbonos dá enantiômeros: produto racêmico (2R,3R) + (2S,3S).' },
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
  const toggles = h('div', { class: 'controls' }, styleSeg, tg('lp', 'pares livres', true), tg('q', 'cargas parciais δ', false), tg('ox', 'destacar O', false), tg('hb', 'ligações de H', false), tg('strain', 'ângulos / tensão', false), tg('ang', '📐 medir ângulo', false), tg('spin', 'girar 360°', false));
  host.append(h('div', { class: 'split rev' },
    h('div', null, h('div', { class: 'optgroup' }, h('h4', null, 'Moléculas'), list), info, meas),
    h('div', null, toggles, vbox, h('div', { class: 'legend' },
      ...[['C', 'carbono'], ['H', 'hidrogênio'], ['O', 'oxigênio']].map(([e, n]) => h('span', null, h('i', { style: `background:#${ELEM[e].color.toString(16).padStart(6, '0')}` }), n)),
      h('span', null, h('i', { style: 'background:#2fd4f5' }), 'par livre'),
      h('span', null, h('i', { style: 'background:#ffd45c' }), 'ligação de H')))));
  const st = { style: 'ball', lp: true, q: false, ox: false, hb: false, strain: false, ang: false, spin: false };
  let v = null, mol = null, D = null, B = null, picks = [], cur = 'etanol', ghost = null, lines = [], strainL = [];
  let last = '';
  Object.entries(LAB).forEach(([k, m]) => {
    if (m.g !== last) { last = m.g; list.append(h('div', { class: 'optgroup-t', style: 'font-weight:800;color:var(--muted);font-size:.78rem;margin:8px 0 2px;text-transform:uppercase;letter-spacing:.06em' }, m.g)); }
    list.append(h('label', { class: 'opt-radio' }, h('input', { type: 'radio', name: 'labmol', value: k, checked: k === cur ? true : null }), h('span', { html: LIB[k].n }), h('small', null, LIB[k].f)));
  });
  list.addEventListener('change', (e) => { cur = e.target.value; build(); });
  styleSeg.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; st.style = b.dataset.style; styleSeg.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', x === b)); if (mol) { mol.setStyle(st.style); if (ghost) ghost.setStyle(st.style); } });
  toggles.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-k]'); if (!b) return;
    const k = b.dataset.k; st[k] = !st[k]; b.setAttribute('aria-pressed', st[k]);
    if (k === 'ang') { picks = []; meas.textContent = st.ang ? 'Clique em 3 átomos (o do meio é o vértice).' : 'Medida de ângulo desligada.'; }
    apply();
  });
  const WAT = () => MB.tree('O', ['H', 'H', 'lp', 'lp']);
  function orientW(W, P, d1) {
    const e1 = V.norm(W.atoms[1].p); let e2 = V.sub(W.atoms[2].p, V.mul(e1, V.dot(W.atoms[2].p, e1))); e2 = V.norm(e2); const e3 = V.cross(e1, e2);
    const f1 = V.norm(d1); let f2 = Math.abs(f1[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]; f2 = V.norm(V.sub(f2, V.mul(f1, V.dot(f2, f1)))); const f3 = V.cross(f1, f2);
    W.atoms.forEach((a) => { const r = [V.dot(a.p, e1), V.dot(a.p, e2), V.dot(a.p, e3)]; a.p = V.add(P, V.add(V.add(V.mul(f1, r[0]), V.mul(f2, r[1])), V.mul(f3, r[2]))); });
    return W;
  }
  function build() {
    if (v) v.dispose();
    vbox.innerHTML = '';
    const L = LIB[cur]; B = L.b();
    v = new Viewer(vbox, { camPos: [2, 2.4, 9], alt: 'Modelo 3D de ' + L.n });
    info.innerHTML = `<b>${L.n}</b> · ${L.f}<p style="margin:.5em 0 0">${LAB[cur].note}</p>`;
    if (!v.ok) return;
    const ctr = B.center();
    const R = Math.max(...B.atoms.map((a) => V.len(V.sub(a.p, ctr))));
    v.setCamera(V.add(ctr, V.mul(V.norm([0.55, 0.4, 1]), Math.max(7, R * 3.6))), ctr);
    mol = new Mol(v, B.atoms.map((a) => ({ el: a.el, p: a.p.slice() })), B.bonds, { style: st.style });
    D = addDecor(v, mol, B, { lp: st.lp, q: st.q, ox: st.ox });
    // águas "fantasmas" para ligações de H
    const parts = []; const hb = [];
    mol.atoms.forEach((a, i) => {
      if (a.el !== 'O') return;
      B.lps.filter((l) => l.i === i).forEach((l) => { const W = orientW(WAT(), V.add(a.p, V.mul(l.d, 2.85)), V.mul(l.d, -1)); parts.push(W); hb.push([W, 1, i]); });
      mol.bonds.filter((b) => (b.i === i || b.j === i) && mol.atoms[b.i === i ? b.j : b.i].el === 'H').forEach((b) => {
        const hI = b.i === i ? b.j : b.i; const d = V.norm(V.sub(mol.atoms[hI].p, a.p));
        const W = orientW(WAT(), V.add(a.p, V.mul(d, 2.9)), [d[1], -d[0], 0.5]); parts.push(W); hb.push([hI, W, 0]);
      });
    });
    const gAt = [], gB = [];
    parts.forEach((W) => { W._b = gAt.length; W.atoms.forEach((a) => gAt.push({ el: a.el, p: a.p, opacity: 0.5 })); W.bonds.forEach((b) => gB.push([b[0] + W._b, b[1] + W._b])); });
    ghost = gAt.length ? new Mol(v, gAt, gB, { style: st.style }) : null;
    lines = hb.map(([x, y, z]) => {
      const l = hbDots(v.scene);
      const pA = typeof x === 'number' ? mol.atoms[x].p : gAt[x._b + y].p;
      const pB = typeof x === 'number' ? gAt[y._b + z].p : mol.atoms[z].p;
      l.set(pA, pB); return l;
    });
    // ângulos C–O–C (éteres/epóxidos) e C–C–O (epóxido)
    strainL = [];
    mol.atoms.forEach((a, i) => {
      if (a.el !== 'O') return;
      const nb = mol.bonds.filter((b) => b.i === i || b.j === i).map((b) => (b.i === i ? b.j : b.i)).filter((j) => mol.atoms[j].el === 'C' || mol.atoms[j].el === 'H');
      if (nb.length < 2) return;
      const ang = ANG(mol.atoms[nb[0]].p, a.p, mol.atoms[nb[1]].p);
      const ring = mol.bonds.some((b) => (b.i === nb[0] && b.j === nb[1]) || (b.i === nb[1] && b.j === nb[0]));
      const nm = nb.map((j) => mol.atoms[j].el).join('–O–');
      strainL.push(mol.addLabel(i, `${nm} ≈ ${ang.toFixed(0)}°${ring ? ' · anel de 3: muita tensão' : ''}`, 'tag ' + (ring ? 'm' : 'c'), [0, 0.95, 0]));
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
    D.st.lp = st.lp; D.st.q = st.q; D.st.ox = st.ox; D.apply();
    if (ghost) { ghost.meshes.forEach((m) => { m.visible = st.hb && st.style === 'ball' ? true : st.hb; }); ghost.group.visible = st.hb; }
    lines.forEach((l) => l.show(st.hb));
    strainL.forEach((l) => mol.setLabel(l, st.strain ? l.obj.userData.div.innerHTML : null));
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
  return { dispose() { if (v) v.dispose(); dropMol(null); } };
}
