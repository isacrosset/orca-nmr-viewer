/*
 * lab.js — Laboratório Molecular 3D.
 */
import { THREE, Viewer, Mol, V, ELEM, BOND, tetraDirs, lobe, label } from './viewer3d.js';
import { h } from './widgets2d.js';

class Builder {
  constructor() { this.atoms = []; this.bonds = []; }
  add(el, p, role) { this.atoms.push({ el, p, role }); return this.atoms.length - 1; }
  bond(i, j, o = 1, opt = {}) { this.bonds.push([i, j, o, opt]); }
  /* adiciona H em todas as direções dadas a partir do átomo i */
  hs(i, dirs, len = BOND['C-H']) { dirs.forEach((d) => { const k = this.add('H', V.add(this.atoms[i].p, V.mul(d, len))); this.bond(i, k); }); }
  /* CH3 ligado ao átomo i na direção d */
  methyl(i, d, phase = Math.PI / 3) {
    const c = this.add('C', V.add(this.atoms[i].p, V.mul(d, BOND['C-C'])));
    this.bond(i, c);
    this.hs(c, tetraDirs(V.mul(d, -1), phase));
    return c;
  }
}

const rot = (v, axis, ang) => {
  // rotação de Rodrigues
  const k = V.norm(axis), c = Math.cos(ang), s = Math.sin(ang);
  return V.add(V.add(V.mul(v, c), V.mul(V.cross(k, v), s)), V.mul(k, V.dot(k, v) * (1 - c)));
};

/* centro reativo na origem, X ao longo de +x */
function core(X) {
  const b = new Builder();
  const c = b.add('C', [0, 0, 0], 'ec');
  const x = b.add(X, [BOND['C-' + X], 0, 0], 'lg');
  b.bond(c, x);
  return { b, c, x, dirs: tetraDirs([1, 0, 0], Math.PI / 2) };
}

export const LAB = {
  ch3cl: { name: 'CH₃Cl', full: 'clorometano', cls: 'metílico', build() { const { b, c, dirs } = core('Cl'); b.hs(c, dirs); return b; }, note: 'Metílico: acesso traseiro totalmente livre. Só reage por <span class="sn2c">SN2</span> (CH₃⁺ é instável demais). C–Cl ≈ 1,78 Å.' },
  ch3br: { name: 'CH₃Br', full: 'bromometano', cls: 'metílico', build() { const { b, c, dirs } = core('Br'); b.hs(c, dirs); return b; }, note: 'Ligação C–Br mais longa (≈ 1,94 Å) e mais fraca que C–Cl; Br⁻ é melhor grupo abandonador. <span class="sn2c">SN2</span>.' },
  ch3i: { name: 'CH₃I', full: 'iodometano', cls: 'metílico', build() { const { b, c, dirs } = core('I'); b.hs(c, dirs); return b; }, note: 'C–I ≈ 2,14 Å: a mais longa e mais fraca da série; I⁻ é excelente grupo abandonador. Reagente clássico de <span class="sn2c">SN2</span> (metilação).' },
  etbr: { name: 'CH₃CH₂Br', full: 'bromoetano', cls: 'primário', build() { const { b, c, dirs } = core('Br'); b.methyl(c, dirs[0]); b.hs(c, [dirs[1], dirs[2]]); return b; }, note: 'Primário: um grupo metila próximo, mas a face traseira continua acessível. <span class="sn2c">SN2</span> favorecida.' },
  ipbr: { name: '(CH₃)₂CHBr', full: '2-bromopropano', cls: 'secundário', build() { const { b, c, dirs } = core('Br'); b.methyl(c, dirs[0]); b.methyl(c, dirs[1]); b.hs(c, [dirs[2]]); return b; }, note: 'Secundário: impedimento moderado. Pode seguir <span class="sn2c">SN2</span> ou <span class="sn1c">SN1</span> conforme nucleófilo e solvente; E2 compete com bases fortes.' },
  bubr: { name: 'CH₃CHBrCH₂CH₃', full: '2-bromobutano', cls: 'secundário, quiral', build() {
    const { b, c, dirs } = core('Br');
    b.methyl(c, dirs[0]);
    const c3 = b.add('C', V.mul(dirs[1], BOND['C-C'])); b.bond(c, c3);
    const d3 = tetraDirs(V.mul(dirs[1], -1), 0.2);
    b.methyl(c3, d3[0]); b.hs(c3, [d3[1], d3[2]]);
    b.hs(c, [dirs[2]]);
    return b;
  }, note: 'Carbono estereogênico (4 grupos diferentes). Por SN2 sofre <b>inversão</b>; por SN1 forma carbocátion plano e perde a informação estereoquímica.' },
  tbubr: { name: '(CH₃)₃CBr', full: '2-bromo-2-metilpropano (brometo de terc-butila)', cls: 'terciário', build() { const { b, c, dirs } = core('Br'); dirs.forEach((d) => b.methyl(c, d)); return b; }, note: 'Terciário: os nove H das metilas cercam a face traseira (veja em space-filling). SN2 impossível; <span class="sn1c">SN1</span> via carbocátion terciário.' },
  bzbr: { name: 'PhCH₂Br', full: 'brometo de benzila', cls: 'benzílico (1°)', build() {
    const { b, c, dirs } = core('Br');
    const u = V.norm(dirs[0]);
    const ipso = b.add('C', V.mul(u, 1.51)); b.bond(c, ipso);
    b.hs(c, [dirs[1], dirs[2]]);
    // plano do anel perpendicular ao C–Br (C–Br alinhada ao sistema π)
    let n = V.sub([1, 0, 0], V.mul(u, V.dot([1, 0, 0], u))); n = V.norm(n);
    const w = V.norm(V.cross(n, u));
    const ctr = V.add(b.atoms[ipso].p, V.mul(u, 1.39));
    const ring = [ipso];
    for (let k = 1; k < 6; k++) {
      const th = k * Math.PI / 3;
      const p = V.add(ctr, V.add(V.mul(u, -1.39 * Math.cos(th)), V.mul(w, 1.39 * Math.sin(th))));
      ring.push(b.add('C', p));
    }
    for (let k = 0; k < 6; k++) b.bond(ring[k], ring[(k + 1) % 6], k % 2 === 0 ? 2 : 1, { normal: n });
    for (let k = 1; k < 6; k++) b.hs(ring[k], [V.norm(V.sub(b.atoms[ring[k]].p, ctr))], 1.08);
    return b;
  }, note: 'Benzílico primário: desimpedido para <span class="sn2c">SN2</span> e capaz de formar cátion estabilizado por ressonância com o anel (<span class="sn1c">SN1</span>). Repare que a ligação C–Br fica alinhada aos orbitais p do anel.' },
  allylbr: { name: 'CH₂=CHCH₂Br', full: '3-bromoprop-1-eno (brometo de alila)', cls: 'alílico (1°)', build() {
    const { b, c, dirs } = core('Br');
    const u = V.norm(dirs[0]);
    const c2 = b.add('C', V.mul(u, 1.5)); b.bond(c, c2);
    b.hs(c, [dirs[1], dirs[2]]);
    let n = V.sub([1, 0, 0], V.mul(u, V.dot([1, 0, 0], u))); n = V.norm(n);
    const back = V.mul(u, -1);
    const dC3 = rot(back, n, 2 * Math.PI / 3), dH2 = rot(back, n, -2 * Math.PI / 3);
    const c3 = b.add('C', V.add(b.atoms[c2].p, V.mul(dC3, BOND['C=C']))); b.bond(c2, c3, 2, { normal: n });
    b.hs(c2, [dH2], 1.08);
    const back3 = V.mul(dC3, -1);
    b.hs(c3, [rot(back3, n, 2 * Math.PI / 3), rot(back3, n, -2 * Math.PI / 3)], 1.08);
    return b;
  }, note: 'Alílico: o cátion formado é deslocalizado por ressonância (+ em C1 e C3) → <span class="sn1c">SN1</span> viável; carbono primário desimpedido → <span class="sn2c">SN2</span> rápida.' },
};

export function lab(host, opts = {}) {
  const list = h('div', { class: 'opts', role: 'listbox', 'aria-label': 'Moléculas' });
  const vbox = h('div', { class: 'viewer tall' });
  const info = h('div', { class: 'stepcap', 'aria-live': 'polite' });
  const pick = h('div', { class: 'stepcap', 'aria-live': 'polite' }, 'Clique em um átomo para identificá-lo.');
  const tg = (k, t, on) => h('button', { class: 'btn sm', type: 'button', 'aria-pressed': on ? 'true' : 'false', 'data-k': k }, t);
  const toggles = h('div', { class: 'controls' },
    h('div', { class: 'seg', role: 'group', 'aria-label': 'Representação' },
      h('button', { type: 'button', 'aria-pressed': 'true', 'data-style': 'ball' }, 'bola-e-vareta'),
      h('button', { type: 'button', 'aria-pressed': 'false', 'data-style': 'space' }, 'space-filling')),
    tg('labels', 'rótulos dos átomos', false), tg('delta', 'cargas parciais δ+/δ−', true), tg('ec', 'carbono eletrofílico', true), tg('lg', 'grupo abandonador', true), tg('orb', 'orbital σ* C–X', false), tg('spin', 'girar 360°', false));
  host.append(h('div', { class: 'split rev' },
    h('div', null, h('div', { class: 'optgroup' }, h('h4', null, 'Moléculas'), list), info, pick),
    h('div', null, toggles, vbox, h('div', { class: 'legend' },
      ...[['C', 'carbono'], ['H', 'hidrogênio'], ['O', 'oxigênio'], ['Cl', 'cloro'], ['Br', 'bromo'], ['I', 'iodo']].map(([e, n]) => h('span', null, h('i', { style: `background:#${ELEM[e].color.toString(16).padStart(6, '0')}` }), n)),
      h('span', null, h('i', { style: 'background:transparent;border:2px solid var(--cyan)' }), 'halo ciano = C eletrofílico'),
      h('span', null, h('i', { style: 'background:transparent;border:2px solid var(--orange)' }), 'halo laranja = grupo abandonador')))));
  const st = { style: 'ball', labels: false, delta: true, ec: true, lg: true, orb: false, spin: false };
  let v = null, mol = null, extras = [];
  let cur = opts.start || 'ch3br';
  Object.entries(LAB).forEach(([k, m]) => list.append(h('label', { class: 'opt-radio' }, h('input', { type: 'radio', name: 'labmol', value: k, checked: k === cur ? true : null }), h('span', { html: m.name }), h('small', null, m.cls))));
  list.addEventListener('change', (e) => { cur = e.target.value; build(); });
  toggles.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.style) { st.style = b.dataset.style; toggles.querySelectorAll('[data-style]').forEach((x) => x.setAttribute('aria-pressed', x === b)); if (mol) { mol.setStyle(st.style); if (st.style === 'space') v.zoom(1.25); else v.zoom(0.8); } return; }
    const k = b.dataset.k; st[k] = !st[k]; b.setAttribute('aria-pressed', st[k]); apply();
  });
  function build() {
    if (v) v.dispose();
    vbox.innerHTML = '';
    const M = LAB[cur];
    const B = M.build();
    v = new Viewer(vbox, { camPos: [-2.5, 2.4, 9], alt: 'Modelo 3D de ' + M.full });
    info.innerHTML = `<b>${M.name}</b> · ${M.full}<br><span class="chip">${M.cls}</span><p style="margin:.5em 0 0">${M.note}</p>`;
    if (!v.ok) return;
    // centraliza a vista
    const ctr = B.atoms.reduce((a, x) => V.add(a, x.p), [0, 0, 0]).map((q) => q / B.atoms.length);
    v.setCamera([ctr[0] - 3, ctr[1] + 3, ctr[2] + (st.style === 'space' ? 13 : 11)], ctr);
    mol = new Mol(v, B.atoms, B.bonds, { style: st.style });
    const ecI = B.atoms.findIndex((a) => a.role === 'ec'), lgI = B.atoms.findIndex((a) => a.role === 'lg');
    extras = {
      labels: B.atoms.map((a, i) => mol.addLabel(i, a.el, 'tag', [0, 0, 0])),
      dC: mol.addLabel(ecI, 'δ+', 'dplus', [-0.2, 0.75, 0.3]),
      dX: mol.addLabel(lgI, 'δ−', 'dminus', [0.2, 0.85, 0]),
      hC: mol.halo(ecI, 0x2fd4f5, 1.9),
      hX: mol.halo(lgI, 0xff9f43, 1.45),
      tag: mol.addLabel(lgI, 'grupo abandonador', 'tag o', [0.3, -0.95, 0]),
      o1: lobe(v.scene, 0x2fd4f5, 0.42), o2: lobe(v.scene, 0xff9f43, 0.36), o3: lobe(v.scene, 0x2fd4f5, 0.3),
      ol: label('σ* C–X: lóbulo maior no lado oposto ao X', 'tag c'),
      ecI, lgI,
    };
    v.scene.add(extras.ol);
    const pX = B.atoms[lgI].p;
    extras.o1.set([0, 0, 0], [-1, 0, 0], 1.0, 0.62);
    extras.o2.set([0, 0, 0], [1, 0, 0], 0.45, 0.42);
    extras.o3.set(pX, [1, 0, 0], 0.55, 0.5);
    extras.ol.position.set(-2.2, 0.9, 0);
    // seleção de átomos
    const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
    v.renderer.domElement.addEventListener('click', (e) => {
      const r = v.renderer.domElement.getBoundingClientRect();
      mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(mouse, v.camera);
      const hit = ray.intersectObjects(mol.meshes)[0];
      if (!hit) return;
      const a = hit.object.userData.atom;
      const i = mol.atoms.indexOf(a);
      const role = i === ecI ? 'carbono eletrofílico (δ+) — alvo do nucleófilo' : i === lgI ? 'grupo abandonador (δ−) — sai como haleto' : a.el === 'H' ? 'hidrogênio' : a.el === 'C' ? 'carbono' : '';
      const nb = mol.bonds.filter((b) => b.i === i || b.j === i).length;
      pick.innerHTML = `<b>${ELEM[a.el].name}</b> (${a.el}) · ${nb} ligação(ões)${role ? '<br>' + role : ''}`;
      mol.meshes.forEach((m) => m.material.emissive && m.material.emissive.set(0x000000));
      hit.object.material.emissive.set(0x334455);
    });
    apply();
  }
  function apply() {
    if (!v || !v.ok) return;
    extras.labels.forEach((l) => { l.visible = st.labels; });
    extras.dC.visible = st.delta; extras.dX.visible = st.delta;
    extras.hC.on = st.ec; extras.hX.on = st.lg; extras.tag.visible = st.lg;
    [extras.o1, extras.o2, extras.o3].forEach((o) => o.show(st.orb)); extras.ol.visible = st.orb;
    v.controls.autoRotate = st.spin;
    mol.update();
  }
  build();
  return { dispose() { if (v) v.dispose(); } };
}
