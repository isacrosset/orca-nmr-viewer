/*
 * tools.js — módulos 38–41: laboratório acílico 3D (e comparação lado a lado),
 * simulador de reatividade (derivado × nucleófilo), “Essa reação acontece?”,
 * escada arrastável, “Quem sai?”, protonação como ativação, simulador de
 * mecanismos (setas curvas validadas) e simulador de síntese.
 */
import { h, tgl, shuffle } from './widgets2d.js';
import { S } from './chem2d.js';
import { V } from './struct.js';
import { COMP, MATRIX, NUCS, SUBS, DERIV, ROUTES } from './data.js';
import { molView, M3D } from './m3d.js';
import { fb, clear, sel, vbox, svgOf, skx, figK, figRow, nm, card, note, ESP_LEG } from './ui.js';

const G = { cls: 'grey' };
/* ===================================================================
 * 38. Laboratório acílico 3D
 * =================================================================== */
export const LAB = ['acidoAcetico', 'acidoBenzoico', 'cloretoAcetila', 'anidridoAcetico', 'acetatoEtila', 'acetamida', 'dma', 'gbl', 'gamaLactama', 'betaLactama', 'acetonitrila', 'benzonitrila', 'acetato', 'dimero', 'tetraClMeO', 'tetraEsterOH', 'tetraFischer', 'acetoacetico', 'clorossulfito', 'socl2'];
export function lab3d(host) {
  const v = vbox('tall'), info = h('div', { 'aria-live': 'polite' }); let key = 'acetamida';
  const A = molView(v, key, { hlC: true, delta: true, hint: true });
  const T = (t, k, f) => tgl(t, () => { A.st[k] = !A.st[k]; if (f) f(); A.rebuild(); return A.st[k]; }, !!A.st[k]);
  const desc = () => { const D = M3D[key], c = D.map[1], y = D.map[4]; const P = (i) => D.atoms[i].slice(1, 4); const nb = c === undefined ? 0 : D.bonds.filter(([a, b]) => a === c || b === c).length; const cy = c !== undefined && y !== undefined ? V.len(V.sub(P(c), P(y))) : null; info.replaceChildren(fb('neutral', `<b>${D.name}</b>${c !== undefined ? ` · carbono acílico: <b>${nb === 4 ? 'sp³ (tetraédrico)' : nb === 3 ? 'sp² (trigonal)' : nb === 2 ? 'sp (linear)' : ''}</b>` : ''}${cy ? ` · C–${D.atoms[y][0]} = ${cy.toFixed(2).replace('.', ',')} Å` : ''}. Geometria MMFF94.`)); };
  const Y = tgl('Destacar grupo Y / de saída', () => { const on = !(A.st.halos && A.st.halos.length); A.st.halos = on && M3D[key].map[4] !== undefined ? [[4, 0xffd45c]] : []; A.rebuild(); return on; }, false);
  host.append(h('div', { class: 'controls' }, h('label', null, 'Molécula: ', sel(LAB.map((k) => [k, M3D[k].name]), key, (k) => { key = k; A.set(k); desc(); }, 'molécula')), tgl('Preenchimento espacial', () => { A.st.style = A.st.style === 'ball' ? 'space' : 'ball'; A.rebuild(); return A.st.style === 'space'; }, false), T('C acílico', 'hlC'), T('δ+/δ−', 'delta'), T('Pares isolados', 'lp'), T('π*', 'pistar'), T('Mapa de potencial', 'esp'), T('Hibridização', 'hyb'), Y, T('Girar', 'spin', () => { A.v.controls.autoRotate = !A.st.spin; })), v, info, ESP_LEG());
  desc();
}
export function compare3(host) {
  const K = [['cloretoAcetila', 'Cloreto de acetila'], ['acetatoEtila', 'Acetato de etila'], ['acetamida', 'Acetamida']];
  let esp = false; const As = [];
  const len = (k) => { const D = M3D[k], P = (i) => D.atoms[i].slice(1, 4); return V.len(V.sub(P(D.map[1]), P(D.map[4]))).toFixed(2).replace('.', ','); };
  host.append(h('div', { class: 'controls' }, tgl('Mapa de potencial', () => { esp = !esp; As.forEach((A) => { A.st.esp = esp; A.rebuild(); }); return esp; }, false)), h('div', { class: 'grid3' }, K.map(([k, t]) => { const v = vbox('short'); As.push(molView(v, k, { hlC: true, lp: true, hint: false, labels: [[4, `C–Y ${len(k)} Å`, 'y']] })); return card(t, v); })),
    h('p', { class: 'hint3' }, 'C–Cl longa (ligação fraca, boa saída); C–O do éster e C–N da amida encurtadas pela ressonância (caráter parcial de dupla). A amida é a mais estabilizada e a menos eletrofílica.'));
}

/* ===================================================================
 * 39. Simulador de reatividade
 * =================================================================== */
const OKTXT = { 'fácil': ['ok', 'Favorável e rápida'], moderada: ['ok', 'Favorável (moderada)'], 'catálise': ['neutral', 'Requer catálise (equilíbrio)'], lenta: ['neutral', 'Possível, porém lenta (aquecimento)'], 'ácido-base': ['bad', 'Reação ácido-base (não há substituição)'], 'não': ['bad', 'Não ocorre (desfavorável)'] };
const DN = { cloreto: 'cloreto de acetila', anidrido: 'anidrido acético', ester: 'acetato de etila', amida: 'acetamida', acido: 'ácido acético' };
export function reactSim(host) {
  let d = 'cloreto', n = 'MeOH'; const out = h('div', { 'aria-live': 'polite' });
  const draw = () => { const r = MATRIX[d][n], [cls, t] = OKTXT[r.ok]; out.replaceChildren(h('div', { class: 'rxrow' }, figK(SUBS[d], { scale: 24, fs: 12 }), h('span', { class: 'rxarr', html: `→<small>${NUCS[n]}</small>` }), ...(r.prods.length ? r.prods.map((p, i) => [i ? h('span', { class: 'rxarr' }, '+') : null, figK(p, { scale: 22, fs: 11 })]).flat() : [h('span', { class: 'qmark' }, '✘')])), fb(cls, `<b>${t}.</b> ${r.why}`)); };
  const bar = (obj, cur, f) => h('div', { class: 'chips nus' }, Object.entries(obj).map(([k, t]) => h('button', { class: 'chip', type: 'button', 'aria-pressed': k === cur ? 'true' : 'false', onclick: (e) => { f(k); [...e.currentTarget.parentNode.children].forEach((b) => b.setAttribute('aria-pressed', b === e.currentTarget ? 'true' : 'false')); draw(); } }, t)));
  host.append(h('p', { class: 'hint3' }, 'Derivado acílico:'), bar(DN, d, (k) => { d = k; }), h('p', { class: 'hint3' }, 'Nucleófilo:'), bar(NUCS, n, (k) => { n = k; }), out);
  draw();
}
const HAP = [['cloreto', 'MeOH', true, 'Desce a escada; Cl⁻ ótimo grupo de saída.'], ['amida', 'MeOH', false, 'Subiria a escada: NH₂⁻ teria de sair.'], ['ester', 'NH3', true, 'Aminólise (lenta, mas favorável): éster → amida.'], ['cloreto', 'NH3', true, 'Rápida; 2 equiv. de NH₃.'], ['acido', 'MeNH2', false, 'Em condições brandas: só ácido-base (sal).'], ['anidrido', 'H2O', true, 'Hidrólise do anidrido: favorável.'], ['ester', 'AcO', false, 'Éster → anidrido sobe a escada.'], ['amida', 'OH', true, 'Só com aquecimento prolongado (hidrólise básica).'], ['acido', 'MeOH', true, 'Com H⁺: Fischer (equilíbrio).']];
export function happens(host) {
  let k = 0; const box = h('div'), out = h('div', { 'aria-live': 'polite' });
  const draw = () => { const [d, n, ok, e] = HAP[k]; out.replaceChildren(); clear(box).append(h('div', { class: 'rxrow' }, figK(SUBS[d], { scale: 26 }), h('span', { class: 'rxarr', html: `+ ${NUCS[n]}` }), h('span', { class: 'qmark' }, '?')), h('p', { class: 'prompt' }, 'Substituição favorável? Escolha a melhor justificativa:'), h('div', { class: 'ch-answers col' }, shuffle([[true, 'Sim: vai de derivado mais reativo para menos reativo / bom grupo de saída'], [false, 'Não: o grupo que sairia é pior que o que entraria (subir a escada) ou ocorre ácido-base']]).map(([v, t]) => h('button', { class: 'btn', type: 'button', onclick: () => { const r = MATRIX[d][n]; out.replaceChildren(fb(v === ok ? 'ok' : 'bad', `${v === ok ? '✔' : '✘'} ${e} <br><small>${r.why}</small>`), h('button', { class: 'btn sm primary', type: 'button', onclick: () => { k = (k + 1) % HAP.length; draw(); } }, 'Próxima →')); } }, t)))); };
  host.append(box, out); draw();
}
export function ladderDnD(host) {
  const items = [['cloreto', 'cloreto de acila'], ['anidrido', 'anidrido'], ['ester', 'éster'], ['amida', 'amida']];
  let order = shuffle(items); while (order.map((x) => x[0]).join() === items.map((x) => x[0]).join()) order = shuffle(items);
  const ul = h('ol', { class: 'sortlist' }), out = h('div', { 'aria-live': 'polite' }); let drag = null;
  const render = () => { clear(ul); order.forEach((it, i) => { const li = h('li', { draggable: 'true', tabindex: 0 }, h('span', { class: 'grip' }, '⠿'), skx(DERIV.find((d) => d.k === it[0]).key, { scale: 18, fs: 10 }), h('b', null, it[1]), h('span', { class: 'mv' }, h('button', { class: 'btn sm', type: 'button', 'aria-label': 'subir', onclick: () => mv(i, -1) }, '▲'), h('button', { class: 'btn sm', type: 'button', 'aria-label': 'descer', onclick: () => mv(i, 1) }, '▼')));
    li.addEventListener('dragstart', () => { drag = i; }); li.addEventListener('dragover', (e) => e.preventDefault()); li.addEventListener('drop', (e) => { e.preventDefault(); if (drag === null) return; const x = order.splice(drag, 1)[0]; order.splice(i, 0, x); drag = null; render(); }); ul.append(li); }); };
  const mv = (i, d) => { const j = i + d; if (j < 0 || j >= order.length) return; [order[i], order[j]] = [order[j], order[i]]; render(); };
  host.append(h('div', { class: 'ladhead' }, 'MAIS REATIVO ↑'), ul, h('div', { class: 'ladhead' }, 'MENOS REATIVO ↓'), h('div', { class: 'ex-actions' }, h('button', { class: 'btn sm primary', type: 'button', onclick: () => { const ok = order.map((x) => x[0]).join() === items.map((x) => x[0]).join(); out.replaceChildren(fb(ok ? 'ok' : 'bad', ok ? '✔ Correto: cloreto > anidrido > éster > amida (Cl⁻ > RCOO⁻ > RO⁻ > R₂N⁻ como grupos de saída; doação por ressonância crescente).' : '✘ Ainda não. Pense no grupo de saída e na doação por ressonância.')); } }, 'Conferir')), out);
  render();
}
const WHO = [['Cl', 'OCH₃', 'Cl⁻', 'Cl⁻ (pKₐ HCl ≈ −7) é base muito mais fraca que CH₃O⁻ (pKₐ ≈ 16): sai o cloreto → éster.'], ['OCOCH₃', 'NH₂', 'CH₃COO⁻', 'Carboxilato (pKₐ ≈ 4,8) ≫ H₂N⁻ (pKₐ ≈ 38): sai o carboxilato → amida.'], ['OEt', 'OH', 'EtO⁻ (e depois ácido-base)', 'EtO⁻ e HO⁻ têm basicidade semelhante, mas a saída de EtO⁻ leva ao ácido, que é desprotonado irreversivelmente (saponificação).'], ['NH₂', 'OH', 'HO⁻ (volta à amida)', 'Sem calor/ativação, o tetraédrico expulsa HO⁻ (melhor grupo de saída que H₂N⁻): por isso amidas hidrolisam devagar.'], ['OCH₃', 'NH₂CH₃⁺', 'CH₃O⁻ (após transferências de próton)', 'Na aminólise, o grupo que sai é o alcóxido (o N, protonado/ligado, fica).']];
export function whoLeaves(host) {
  let k = 0; const box = h('div'), out = h('div', { 'aria-live': 'polite' });
  const draw = () => {
    const [y, nu, ans, e] = WHO[k]; out.replaceChildren();
    const s = new S(); const c = s.a(0, 0, '', { halo: 'v' }); s.br(c, 90, 'O', 1, { cls: 'oxy', chg: '−', lp: [30, 150] }, 1.15); s.br(c, 180, nu, 1, { cls: 'nu' }, 1.4); s.br(c, 270, 'CH₃', 'w', G); s.br(c, 0, y, 1, { cls: 'lg' }, 1.4);
    const opts = shuffle([ans, ...shuffle(['Cl⁻', 'CH₃COO⁻', 'HO⁻ (volta à amida)', 'H₂N⁻', 'EtO⁻ (e depois ácido-base)', 'CH₃O⁻ (após transferências de próton)', 'O²⁻'].filter((x) => x !== ans)).slice(0, 2)]);
    clear(box).append(h('p', { class: 'prompt' }, 'Intermediário tetraédrico: qual grupo deve sair para regenerar a C=O?'), h('div', { class: 'figs' }, svgOf(s, { scale: 44, fs: 17 })), h('div', { class: 'ch-answers col' }, opts.map((t) => h('button', { class: 'btn', type: 'button', onclick: () => out.replaceChildren(fb(t === ans ? 'ok' : 'bad', `${t === ans ? '✔' : '✘'} ${e}`), h('button', { class: 'btn sm primary', type: 'button', onclick: () => { k = (k + 1) % WHO.length; draw(); } }, 'Próximo →')) }, t))));
  };
  host.append(box, out); draw();
}
export function protonActivation(host) {
  const R = [['–OR (éster, hidrólise ácida)', '–O⁺(H)R → sai ROH', 'base fraca e neutra'], ['–OH (Fischer)', '–OH₂⁺ → sai H₂O', 'H₂O (pKₐ H₃O⁺ ≈ −1,7)'], ['–NR₂ (amida, hidrólise ácida)', '–N⁺HR₂ → sai R₂NH', 'amina neutra ≫ R₂N⁻'], ['C=O', 'C=O⁺H', 'carbono mais eletrofílico']];
  host.append(h('div', { class: 'table-wrap' }, h('table', { class: 'cmp' }, h('thead', null, h('tr', null, ['Grupo', 'Após protonação', 'Por que ajuda']. map((t) => h('th', null, t)))), h('tbody', null, R.map((r) => h('tr', null, h('th', null, r[0]), h('td', null, r[1]), h('td', null, r[2]))))))), note('err', 'Erro comum', 'Em meio ácido, <b>OH⁻ não sai espontaneamente</b>: o grupo precisa ser ativado por protonação para sair como H₂O.');
}

/* ===================================================================
 * 40. Simulador de mecanismos (setas curvas)
 * =================================================================== */
function acylT(s, Y, o = {}) { const T = {}; T.c = s.a(0, 0, '', { halo: 'o' }); T.o = s.br(T.c, 90, 'O', 2, { cls: 'oxy', lp: o.prot ? [150] : [45, 135], chg: o.prot ? '+' : undefined }, 1.2); if (o.prot) T.oh = s.br(T.o, 30, 'H', 1, {}, 0.95); s.br(T.c, 210, 'CH₃', 1, G); T.y = s.br(T.c, 330, Y, 1, { cls: 'lg' }, 1.25); return T; }
const MS = {
  ester: {
    title: 'CH₃COCl + CH₃OH → acetato de metila',
    steps: ['O(MeOH) → C', 'π C=O → O', 'O⁻ → C–O (π)', 'C–Cl → Cl', 'B: → H', 'H–O⁺ → O', 'éster'],
    frame: (st) => (st < 2 ? 0 : st < 4 ? 1 : st < 6 ? 2 : 3),
    build(f) {
      const s = new S(); let T = {};
      if (f === 0) { T = acylT(s, 'Cl'); T.n = s.a(-2.7, -0.9, 'O', { cls: 'nu', lp: [0, 270] }); s.br(T.n, 120, 'H', 1, {}, 0.95); s.br(T.n, 210, 'CH₃', 1, G); }
      else if (f === 1) { T.c = s.a(0, 0, '', { halo: 'v' }); T.o = s.br(T.c, 90, 'O', 1, { cls: 'oxy', chg: '−', lp: [30, 150] }, 1.15); T.n = s.br(T.c, 180, 'O', 1, { cls: 'nu', chg: '+' }, 1.2); s.br(T.n, 120, 'H', 1, {}, 0.95); s.br(T.n, 240, 'CH₃', 1, G); s.br(T.c, 270, 'CH₃', 'w', G); T.y = s.br(T.c, 0, 'Cl', 1, { cls: 'lg' }, 1.3); }
      else if (f === 2) { T.c = s.a(0, 0, '', { halo: 'v' }); s.br(T.c, 90, 'O', 2, { cls: 'oxy' }, 1.2); s.br(T.c, 330, 'CH₃', 1, G); T.n = s.br(T.c, 210, 'O', 1, { cls: 'nu', chg: '+' }, 1.2); T.h = s.br(T.n, 120, 'H', 1, { cls: 'hb' }, 0.95); s.br(T.n, 270, 'CH₃', 1, G); T.b = s.a(-2.9, -1.9, 'Py:', { cls: 'base', lp: [0] }); s.t(2.2, 0.9, '+ Cl⁻', 'lg', 15); }
      else { T.c = s.a(0, 0, '', { halo: 'g' }); s.br(T.c, 90, 'O', 2, { cls: 'oxy' }, 1.2); s.br(T.c, 210, 'CH₃', 1, G); s.br(T.c, 330, 'OCH₃', 1, { cls: 'prod' }, 1.3); s.t(3.2, 0.2, '+ PyH⁺ Cl⁻', 'cond', 14); }
      return { s, T };
    },
    rules: [
      { from: ['a', 'n'], to: ['a', 'c'], arrow: (T) => ({ from: { lp: [T.n, 0] }, to: { a: T.c, ang: 165 }, bend: -0.35, cls: 'm' }), ok: '✔ O O do metanol ataca o carbono acílico.', bad: [[['a', 'n'], ['a', 'o'], '<b>Erro comum:</b> o nucleófilo ataca o <b>carbono</b>, não o O carbonílico.'], [['a', 'n'], ['a', 'y'], 'O Cl não é atacado: o eletrófilo é o carbono acílico.'], [['a', 'c'], null, 'A seta parte do nucleófilo (par isolado), não do carbono.']] },
      { from: ['b', 'c', 'o'], to: ['a', 'o'], arrow: (T) => ({ from: { b: [T.c, T.o] }, to: { a: T.o, ang: 0 }, bend: 0.5, cls: 'm' }), ok: '✔ π → O: evita carbono pentavalente.', bad: [[['b', 'c', 'o'], ['a', 'c'], 'O par π vai para o O; senão o C ficaria com 5 ligações.'], [['b', 'c', 'y'], null, 'Ainda não! Primeiro forma-se o intermediário tetraédrico (π → O). Não pule o tetraédrico.']] },
      { from: ['a', 'o'], to: ['b', 'c', 'o'], arrow: (T) => ({ from: { lp: [T.o, 30] }, to: { b: [T.c, T.o] }, bend: -0.9, cls: 'm' }), ok: '✔ O par do O⁻ começa a refazer a C=O…', bad: [[['b', 'c', 'y'], null, 'Comece pelo O⁻: seu par empurra a saída do grupo.'], [['b', 'c', 'n'], null, 'Se o O⁺CH₃ saísse, voltaríamos aos reagentes. Quem deve sair é o melhor grupo de saída: Cl⁻.']] },
      { from: ['b', 'c', 'y'], to: ['a', 'y'], arrow: (T) => ({ from: { b: [T.c, T.y] }, to: { a: T.y, ang: 270 }, bend: 0.6, cls: 'm' }), ok: '✔ …e Cl⁻ sai (ótimo grupo de saída).', bad: [[['b', 'c', 'n'], null, 'Sai o Cl⁻ (base mais fraca), não o metanol.']] },
      { from: ['a', 'b'], to: ['a', 'h'], arrow: (T) => ({ from: { lp: [T.b, 0] }, to: { a: T.h, ang: 150 }, bend: -0.3, cls: 'm' }), ok: '✔ A piridina remove o H⁺ do O⁺.', bad: [] },
      { from: ['b', 'h', 'n'], to: ['a', 'n'], arrow: (T) => ({ from: { b: [T.h, T.n] }, to: { a: T.n, ang: 0 }, bend: 0.7, cls: 'm' }), ok: '✔ Éster neutro formado.', bad: [] },
    ],
  },
  sapon: {
    title: 'Saponificação: acetato de etila + HO⁻',
    steps: ['HO⁻ → C', 'π → O', 'O⁻ → C–O (π)', 'C–OEt → O', 'EtO⁻ → H(ácido)', 'O–H → O', 'carboxilato'],
    frame: (st) => (st < 2 ? 0 : st < 4 ? 1 : st < 6 ? 2 : 3),
    build(f) {
      const s = new S(); let T = {};
      if (f === 0) { T = acylT(s, 'OEt'); T.n = s.a(-2.7, -0.9, 'HO', { cls: 'nu', chg: '−', lp: [0, 90, 270] }); }
      else if (f === 1) { T.c = s.a(0, 0, '', { halo: 'v' }); T.o = s.br(T.c, 90, 'O', 1, { cls: 'oxy', chg: '−', lp: [30, 150] }, 1.15); s.br(T.c, 180, 'OH', 1, { cls: 'nu' }, 1.25); s.br(T.c, 270, 'CH₃', 'w', G); T.y = s.br(T.c, 0, 'OEt', 1, { cls: 'lg' }, 1.35); }
      else if (f === 2) { T.c = s.a(0, 0, '', { halo: 'v' }); s.br(T.c, 90, 'O', 2, { cls: 'oxy' }, 1.2); s.br(T.c, 210, 'CH₃', 1, G); T.o2 = s.br(T.c, 330, 'O', 1, { cls: 'oxy2', lp: [270] }, 1.2); T.h = s.br(T.o2, 30, 'H', 1, { cls: 'hb' }, 0.95); T.b = s.a(2.9, -1.3, 'OEt', { cls: 'base', chg: '−', lp: [180] }); }
      else { T.c = s.a(0, 0, '', { halo: 'g' }); s.br(T.c, 90, 'O', 2, { cls: 'oxy' }, 1.2); s.br(T.c, 210, 'CH₃', 1, G); s.br(T.c, 330, 'O', 1, { cls: 'prod', chg: '−' }, 1.2); s.t(2.9, 0.2, '+ EtOH', 'cond', 15); }
      return { s, T };
    },
    rules: [
      { from: ['a', 'n'], to: ['a', 'c'], arrow: (T) => ({ from: { lp: [T.n, 0] }, to: { a: T.c, ang: 165 }, bend: -0.35, cls: 'm' }), ok: '✔ HO⁻ ataca o carbono acílico.', bad: [[['a', 'n'], ['a', 'o'], 'O HO⁻ ataca o carbono, não o oxigênio.']] },
      { from: ['b', 'c', 'o'], to: ['a', 'o'], arrow: (T) => ({ from: { b: [T.c, T.o] }, to: { a: T.o, ang: 0 }, bend: 0.5, cls: 'm' }), ok: '✔ Intermediário tetraédrico.', bad: [] },
      { from: ['a', 'o'], to: ['b', 'c', 'o'], arrow: (T) => ({ from: { lp: [T.o, 30] }, to: { b: [T.c, T.o] }, bend: -0.9, cls: 'm' }), ok: '✔ O⁻ refaz a C=O…', bad: [] },
      { from: ['b', 'c', 'y'], to: ['a', 'y'], arrow: (T) => ({ from: { b: [T.c, T.y] }, to: { a: T.y, ang: 270 }, bend: 0.6, cls: 'm' }), ok: '✔ …e EtO⁻ sai.', bad: [] },
      { from: ['a', 'b'], to: ['a', 'h'], arrow: (T) => ({ from: { lp: [T.b, 180] }, to: { a: T.h, ang: 30 }, bend: 0.3, cls: 'm' }), ok: '✔ Ácido-base: EtO⁻ desprotona o ácido (muito favorável).', bad: [] },
      { from: ['b', 'h', 'o2'], to: ['a', 'o2'], arrow: (T) => ({ from: { b: [T.h, T.o2] }, to: { a: T.o2, ang: 0 }, bend: -0.6, cls: 'm' }), ok: '✔ Carboxilato: irreversível nas condições usuais.', bad: [] },
    ],
  },
  fischer: {
    title: 'Fischer (início): protonação e ataque do álcool',
    steps: ['O(C=O) → H⁺', 'H–O⁺ → O', 'MeOH → C', 'π C=O⁺ → O', 'tetraédrico'],
    frame: (st) => (st < 2 ? 0 : st < 4 ? 1 : 2),
    build(f) {
      const s = new S(); let T = {};
      if (f === 0) { T = acylT(s, 'OH'); T.ao = s.a(2.4, -1.9, 'OH₂', { chg: '+', cls: 'oxy2' }); T.h = s.br(T.ao, 180, 'H', 1, { cls: 'hb' }, 0.95); }
      else if (f === 1) { T = acylT(s, 'OH', { prot: true }); T.n = s.a(-2.7, -0.9, 'O', { cls: 'nu', lp: [0, 270] }); s.br(T.n, 120, 'H', 1, {}, 0.95); s.br(T.n, 210, 'CH₃', 1, G); }
      else { T.c = s.a(0, 0, '', { halo: 'v' }); s.br(T.c, 90, 'OH', 1, { cls: 'oxy' }, 1.15); s.br(T.c, 180, 'O⁺(H)CH₃', 1, { cls: 'nu' }, 1.6); s.br(T.c, 270, 'CH₃', 'w', G); s.br(T.c, 0, 'OH', 1, { cls: 'oxy2' }, 1.25); }
      return { s, T };
    },
    rules: [
      { from: ['a', 'o'], to: ['a', 'h'], arrow: (T) => ({ from: { lp: [T.o, 45] }, to: { a: T.h, ang: 180 }, bend: -0.4, cls: 'm' }), ok: '✔ Protona-se o O <b>carbonílico</b> (o cátion formado é estabilizado por ressonância).', bad: [[['a', 'y'], ['a', 'h'], 'Protonar o OH agora não é produtivo: o H₂O sairia gerando um acílio (desfavorável aqui). Ative a carbonila.']] },
      { from: ['b', 'h', 'ao'], to: ['a', 'ao'], arrow: (T) => ({ from: { b: [T.h, T.ao] }, to: { a: T.ao, ang: 90 }, bend: 0.6, cls: 'm' }), ok: '✔ Carbonila ativada.', bad: [] },
      { from: ['a', 'n'], to: ['a', 'c'], arrow: (T) => ({ from: { lp: [T.n, 0] }, to: { a: T.c, ang: 165 }, bend: -0.35, cls: 'm' }), ok: '✔ O álcool ataca o C ativado.', bad: [[['a', 'n'], ['a', 'o'], 'Ataque ao carbono, não ao O.']] },
      { from: ['b', 'c', 'o'], to: ['a', 'o'], arrow: (T) => ({ from: { b: [T.c, T.o] }, to: { a: T.o, ang: 0 }, bend: 0.5, cls: 'm' }), ok: '✔ Intermediário tetraédrico (oxônio). Seguem-se transferências de próton e saída de H₂O.', bad: [] },
    ],
  },
};
export function mechSim(host) {
  let mode = 'ester', step = 0, from = null, hist = [];
  const stage = h('div', { class: 'figs mechsim' }), prog = h('ol', { class: 'msteps' }), q = h('div'), out = h('div', { 'aria-live': 'polite' });
  const key = (t, T) => { const name = (i) => Object.keys(T).find((k) => T[k] === i); return t.type === 'a' ? ['a', name(t.i)] : ['b', name(t.a), name(t.b)]; };
  const same = (A, B) => A && B && A[0] === B[0] && (A[0] === 'a' ? A[1] === B[1] : (A[1] === B[1] && A[2] === B[2]) || (A[1] === B[2] && A[2] === B[1]));
  function render(fr) {
    const M = MS[mode]; fr = fr ?? M.frame(step);
    const { s, T } = M.build(fr); hist.forEach((a) => s.arrow(a.from, a.to, a.bend, a.cls));
    const svg = svgOf(s, { scale: 50, fs: 19, zoom: 1.3, animate: true }); clear(stage).append(svg);
    clear(prog).append(...M.steps.map((t, i) => h('li', { class: i < step ? 'done' : i === step ? 'cur' : '' }, t)));
    const final = step >= M.rules.length;
    if (!final) {
      const C = svg._chem, NS = 'http://www.w3.org/2000/svg', g = document.createElementNS(NS, 'g'); g.setAttribute('transform', C.transform); svg.append(g);
      const mk = (tag, a, tg) => { const e = document.createElementNS(NS, tag); Object.entries(a).forEach(([k, v]) => e.setAttribute(k, v)); e.setAttribute('tabindex', 0); e.setAttribute('role', 'button'); const f = () => click(tg, e, T); e.addEventListener('click', f); e.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); f(); } }); g.append(e); };
      s.bonds.forEach(([a, b]) => { const p = C.atoms[a], r = C.atoms[b]; mk('line', { x1: p.x, y1: p.y, x2: r.x, y2: r.y, class: 'hitb', 'aria-label': 'ligação' }, { type: 'b', a, b }); });
      s.atoms.forEach((_, i) => { const p = C.atoms[i]; mk('circle', { cx: p.x, cy: p.y, r: 15, class: 'hita', 'aria-label': 'átomo' }, { type: 'a', i }); });
    }
    clear(q).append(final ? fb('ok', `✔ Mecanismo completo: ${M.steps[M.steps.length - 1]}.`) : h('p', { class: 'prompt', html: `Etapa ${step + 1}: clique na <b>origem</b> (átomo = par isolado; ou ligação que se rompe) e depois no <b>destino</b>.` }));
  }
  function click(t, e, T) {
    const M = MS[mode];
    if (!from) { from = t; e.classList.add('sel'); return; }
    const R = M.rules[step], kf = key(from, T), kt = key(t, T); from = null;
    if (same(kf, R.from) && same(kt, R.to)) { out.replaceChildren(fb('ok', R.ok)); const f0 = M.frame(step); hist.push(R.arrow(T)); step++; if (M.frame(step) !== f0) { render(f0); setTimeout(() => { hist = []; render(); }, 1300); } else render(); return; }
    const b = R.bad.find(([f, to]) => same(kf, f) && (!to || same(kt, to)));
    out.replaceChildren(fb('bad', '✘ ' + (b ? b[2] : same(kf, R.from) ? 'Origem correta; destino incorreto. Para onde vão esses elétrons?' : 'Origem incorreta: setas partem de elétrons — par isolado (nucleófilo/base) ou ligação que se rompe.')));
    render();
  }
  host.append(h('div', { class: 'controls' }, sel(Object.keys(MS).map((k) => [k, MS[k].title]), mode, (k) => { mode = k; step = 0; hist = []; from = null; out.replaceChildren(); render(); }, 'mecanismo')), prog, h('div', { class: 'grid2' }, stage, h('div', null, q, out)), h('p', { class: 'hint3' }, 'Validação: origem e destino das setas, valência/cargas, tetraédrico obrigatório e grupo de saída correto. Representação simplificada para fins didáticos.'));
  render();
}

/* ===================================================================
 * 41. Simulador de síntese
 * =================================================================== */
export function synthSim(host) {
  let tgt = 'nMetilbenzamida'; const box = h('div'), out = h('div', { 'aria-live': 'polite' });
  const draw = () => { out.replaceChildren(); clear(box).append(h('div', { class: 'figs' }, figK(tgt, { cap: 'alvo: ' + nm(tgt) })), h('p', { class: 'prompt' }, 'Quais rotas formam este composto? (clique em todas que funcionam)'), h('div', { class: 'ch-answers col' }, ROUTES[tgt].map(([t, ok, e]) => h('button', { class: 'btn', type: 'button', onclick: (ev) => { ev.currentTarget.classList.add(ok ? 'primary' : 'wrongb'); out.append(fb(ok ? 'ok' : 'bad', `${ok ? '✔' : '✘'} ${t}: ${e}`)); } }, t)))); };
  host.append(h('label', null, 'Alvo: ', sel(Object.keys(ROUTES).map((k) => [k, nm(k)]), tgt, (k) => { tgt = k; draw(); }, 'alvo')), box, out); draw();
}
const MULTI = [
  { t: 'Ácido → cloreto → amida → nitrila', start: 'acidoBenzoico', steps: [['SOCl₂', 'cloretoBenzoila', ['NH₃', 'H₃O⁺', 'NaOH']], ['NH₃ (2 equiv.)', 'benzamida', ['H₂O', 'CH₃OH, H⁺', 'SOCl₂']], ['SOCl₂ (desidratação)', 'benzonitrila', ['NaOH, calor', 'H₃O⁺', 'NH₃']]] },
  { t: 'Éster → ácido → cloreto → outro éster', start: 'acetatoEtila', steps: [['NaOH; depois H₃O⁺', 'acidoAcetico', ['SOCl₂', 'NH₃', 'CH₃OH']], ['SOCl₂', 'cloretoAcetila', ['CH₃OH', 'NaOH', 'H₂O']], ['(CH₃)₂CHOH, piridina', 'acetatoIsopropila', ['H₂O', 'NH₃', 'NaOH']]] },
  { t: 'Haleto → nitrila → ácido → éster', start: 'bromoetano', steps: [['NaCN', 'propanonitrila', ['NaOH', 'H₃O⁺', 'CH₃OH']], ['H₃O⁺, calor', 'acidoPropanoico', ['SOCl₂', 'NaCN', 'NH₃']], ['CH₃OH, H⁺ (Fischer)', 'propanoatoMetila', ['NaOH', 'NH₃', 'H₂O']]] },
  { t: 'Hidroxiácido → lactona', start: 'hidroxibutanoico', steps: [['H⁺ (cat.), − H₂O', 'gbl', ['NaOH', 'NH₃', 'SOCl₂ em excesso de H₂O']]] },
  { t: 'Amida → ácido → cloreto de acila', start: 'butanamida', steps: [['H₃O⁺, calor', 'acidoButanoico', ['NaBH₄', 'SOCl₂', 'CH₃OH']], ['SOCl₂', 'cloretoButanoila', ['H₂O', 'NaOH', 'NH₃']]] },
];
export function multiStep(host) {
  let k = 0, step = 0; const head = h('div'), body = h('div'), out = h('div', { 'aria-live': 'polite' });
  const draw = () => {
    const P = MULTI[k]; out.replaceChildren();
    if (step === 0) clear(head).append(h('h4', null, `Problema ${k + 1}/${MULTI.length}: ${P.t}`), h('div', { class: 'figs' }, figK(P.start)));
    if (step >= P.steps.length) { clear(body).append(fb('ok', '✔ Rota completa!'), h('button', { class: 'btn sm primary', type: 'button', onclick: () => { k = (k + 1) % MULTI.length; step = 0; draw(); } }, 'Próximo problema →')); return; }
    const [right, prod, wrong] = P.steps[step];
    clear(body).append(h('p', { class: 'prompt' }, `Etapa ${step + 1}: qual reagente leva a ${nm(prod)}?`), h('div', { class: 'ch-answers col' }, shuffle([right, ...wrong]).map((o) => h('button', { class: 'btn', type: 'button', onclick: () => { if (o !== right) { out.replaceChildren(fb('bad', `✘ “${o}” não leva a ${nm(prod)}.`)); return; } body.querySelectorAll("button").forEach((x) => { x.disabled = true; }); head.append(figRow([`→<small>${o}</small>`, prod], { scale: 22, fs: 11 })); step++; setTimeout(draw, 500); } }, o))));
  };
  host.append(head, body, out); draw();
}
void COMP; void card;
