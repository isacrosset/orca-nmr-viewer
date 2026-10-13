/*
 * main.js — navegação entre módulos e inicialização sob demanda dos componentes.
 */
import { mol, S } from './chem2d.js';
import { VIEWERS } from './viewer3d.js';
import { M, hbrSN2, hbrSN1, pbr3Frames, socl2Frames, tosylFrames, dehydrationFrames, williamsonFrames, williamsonE2, cleavageFrames, halohydrinEpoxFrames, epoxBasic, epoxAcid, grignardFrames } from './struct.js';
import { molScene, hbondScene, HB_INFO, classifyScene, CLASSIFY, LIB, strainScene, alkoxideScene, ALKOX_STEPS, mcpbaScene, MCPBA_STEPS, epoxOpenScene } from './scenes.js';
import { energyChart } from './energy.js';
import { h, seg, player, quickTests, drawKeys, nomenTrainer, NOMEN_ALC, NOMEN_ETH, TILES_ETH, solubility, bpBars, pka, oxidation, propComparator, alcoholSim, williamsonSim, epoxSim, table, reactionMap } from './widgets2d.js';
import { lab } from './lab.js';
import { SOLVED, PROPOSED, PUZZLES } from './exdata.js';
import { exerciseCard, solvedCard, arrowPuzzle } from './practice.js';
import { quiz, challenge } from './quiz.js';

const SECTIONS = [...document.querySelectorAll('.section')];
const NAV = [...document.querySelectorAll('.mainnav a')];
const pager = document.getElementById('pager');
let current = null;
const cleanups = [];
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sem armazenamento */ } },
};

/* esquema de reação: substrato → condição → produto(s) */
function scheme(sub, cond, prods, cap, w = 170) {
  return h('figure', { class: 'fig', style: 'flex-basis:100%;max-width:none' }, h('div', { class: 'rxline' },
    h('div', { style: `width:${w}px` }, mol(M[sub](), { scale: 34 })), h('span', { class: 'arrow' }, '⟶'), h('div', { class: 'cond', html: cond }), h('span', { class: 'arrow' }, '⟶'), drawKeys(prods, { w })), cap ? h('figcaption', { html: cap }) : null);
}
const fig = (k, cap, sc = 38) => h('figure', { class: 'fig' }, mol(M[k](), { scale: sc }), h('figcaption', { html: cap }));
const FIG = {
  alcohols: (host) => host.append(fig('metanol', 'metanol (1°*)'), fig('etanol', 'etanol (1°)'), fig('propan2ol', 'propan-2-ol (2°)'), fig('tbutanol', '2-metilpropan-2-ol (3°)')),
  nomEx: (host) => host.append(fig('etanol', 'etanol'), fig('propan2ol', 'propan-2-ol'), fig('tbutanol', '2-metilpropan-2-ol'), fig('butano13diol', 'butano-1,3-diol'), fig('glicerol', 'propano-1,2,3-triol (glicerol)'), fig('ciclohexanol', 'ciclo-hexanol')),
  hydration: (host) => {
    host.append(scheme('metilciclohexeno', 'H₂O, H₂SO₄', 'metilciclohexanol1', '<b>Hidratação ácida</b>: Markovnikov (via carbocátion 3°).'));
    host.append(scheme('metilciclohexeno', '1. Hg(OAc)₂, H₂O<br>2. NaBH₄', 'metilciclohexanol1', '<b>Oximercuração-desmercuração</b>: Markovnikov, sem rearranjo.'));
    host.append(scheme('metilciclohexeno', '1. BH₃·THF<br>2. H₂O₂, NaOH', 'transMetilciclohexanol2', '<b>Hidroboração-oxidação</b>: anti-Markovnikov, adição syn de H e OH → CH₃ e OH <b>trans</b> (racêmico).'));
  },
  rearrHyd: (host) => {
    host.append(scheme('dimetilbut1eno33', 'H₂O, H₂SO₄', 'dimetilbutan2ol23', 'Via carbocátion: cátion 2° → migração de CH₃ → 3°: <b>2,3-dimetilbutan-2-ol</b> (rearranjado).'));
    host.append(scheme('dimetilbut1eno33', '1. Hg(OAc)₂, H₂O<br>2. NaBH₄', 'dimetilbutan2olOxy', 'Mercurínio, sem cátion livre: <b>3,3-dimetilbutan-2-ol</b> (sem rearranjo).'));
  },
  reduction: (host) => {
    host.append(scheme('butanal', 'NaBH₄, CH₃OH<br>(ou 1. LiAlH₄ 2. H₃O⁺)', 'butan1olProd', 'Aldeído → <b>álcool primário</b>.'));
    host.append(scheme('butanona', 'NaBH₄, CH₃OH<br>(ou 1. LiAlH₄ 2. H₃O⁺)', 'butan2olProd', 'Cetona → <b>álcool secundário</b> (aqui racêmico: o H⁻ entra pelas duas faces da C=O).'));
  },
  alkoxy: (host) => host.append(scheme('propeno', '1. Hg(OAc)₂, CH₃OH<br>2. NaBH₄', 'metoxipropano2', '<b>Alcoximercuração</b>: como a oximercuração, mas o nucleófilo é um álcool → éter Markovnikov, sem rearranjo.')),
  cleavCases: (host) => {
    host.append(scheme('metoxietano', 'HI (1 equiv.)', ['iodometano', 'etanol'], '<b>Metila + 1°</b>: SN2 no CH₃ (menos impedido).'));
    host.append(scheme('mtbe', 'HI', ['tbui', 'metanol'], '<b>Grupo 3°</b>: após a protonação, sai CH₃OH e forma-se o cátion terciário (SN1; E1 compete) → 2-iodo-2-metilpropano + metanol.'));
    host.append(scheme('anisol', 'HBr', ['fenol'], '<b>Arila</b>: o Br⁻ ataca o CH₃ (SN2) → <b>fenol + CH₃Br</b>. C(sp²)–O não é rompida: nunca se forma bromobenzeno.'));
  },
  epoxIntro: (host) => host.append(fig('oxirano', 'oxirano (óxido de etileno)'), fig('metiloxirano', '2-metiloxirano (óxido de propileno)'), fig('dimetiloxirano22', '2,2-dimetiloxirano'), fig('cisDimetiloxirano', 'cis-2,3-dimetiloxirano'), fig('oxidoCiclohexeno', 'óxido de ciclo-hexeno')),
  mcpbaScheme: (host) => host.append(scheme('propeno', 'mCPBA, CH₂Cl₂', 'metiloxirano', 'Epoxidação: um O é transferido do perácido para a C=C, numa única etapa.')),
  nucProducts: (host) => {
    host.append(scheme('dimetiloxirano22', 'CH₃O⁻, CH₃OH', 'metoxiBasico', '<b>Básico</b>: ataque no CH₂ → 1-metoxi-2-metilpropan-2-ol.'));
    host.append(scheme('dimetiloxirano22', 'CH₃OH, H₂SO₄ (cat.)', 'metoxiAcido', '<b>Ácido</b>: ataque no C terciário → 2-metoxi-2-metilpropan-1-ol.'));
  },
  stereoProd: (host) => {
    host.append(scheme('oxidoCiclohexeno', 'H₃O⁺ (ou OH⁻)', 'transDiolCiclohexano', 'Abertura <b>anti</b>: trans-ciclo-hexano-1,2-diol (racêmico).'));
    host.append(scheme('cisDimetiloxirano', 'H₂O, H₃O⁺', 'butanodiolRR', 'Epóxido <b>meso</b> → (2R,3R)-butano-2,3-diol + enantiômero (2S,3S): racêmico.'));
  },
  nucs: (host) => host.append(...['nitrilaEpox', 'azidaEpox', 'aminaEpox', 'grignardEpox'].map((k, i) => fig(k, ['CN⁻ → β-hidroxinitrila', 'N₃⁻ → β-azidoálcool', 'NH₃ → β-aminoálcool', 'CH₃MgBr; H₃O⁺ → 2-metilbutan-2-ol'][i], 32))),
};

/* controles para cenas com relógio e etapas */
function stepControls(sc, steps) {
  const c = sc.clock;
  const cap = h('div', { class: 'stepcap', 'aria-live': 'polite' });
  const tl = h('div', { class: 'timeline' });
  const range = h('input', { type: 'range', min: 0, max: 1000, value: 0, 'aria-label': 'Progresso' });
  const play = h('button', { class: 'btn sm primary', type: 'button', onclick: () => { c.stopAt = null; c.toggle(); } }, '▶ Reproduzir');
  c.onState = (p) => { play.textContent = p ? '❚❚ Pausar' : '▶ Reproduzir'; };
  const idx = (s) => { let k = 0; steps.forEach((st, i) => { if (s >= st.s - 1e-6) k = i; }); return k; };
  const stepB = h('button', { class: 'btn sm', type: 'button', onclick: () => { const k = Math.min(steps.length - 1, idx(c.s) + 1); c.stopAt = steps[k].s; c.play(); } }, 'Passo a passo ▶');
  const reset = h('button', { class: 'btn sm', type: 'button', onclick: () => { c.pause(); c.stopAt = null; c.set(0); } }, '⟲ Reiniciar');
  const slow = h('button', { class: 'btn sm', type: 'button', 'aria-pressed': 'false', onclick: (e) => { const on = e.currentTarget.getAttribute('aria-pressed') !== 'true'; e.currentTarget.setAttribute('aria-pressed', on); c.speed(on ? 0.35 : 1); } }, '🐢 Lento');
  range.addEventListener('input', () => { c.pause(); c.set(+range.value / 1000); });
  steps.forEach((st) => tl.append(h('button', { type: 'button', html: `<b>${st.t}</b>`, onclick: () => { c.pause(); c.set(st.s); } })));
  let cur = -1;
  const onSet = (s) => { const k = idx(s); if (k !== cur) { cur = k; cap.innerHTML = steps[k].d; [...tl.children].forEach((b, i) => b.classList.toggle('on', i === k)); } range.value = Math.round(s * 1000); };
  return { el: h('div', null, h('div', { class: 'controls' }, play, stepB, reset, slow), h('div', { class: 'range-row' }, range), tl, cap), onSet };
}
const tgl = (t, f, on) => h('button', { class: 'btn sm', type: 'button', 'aria-pressed': on ? 'true' : 'false', onclick: (e) => e.currentTarget.setAttribute('aria-pressed', f()) }, t);
function sceneWithSteps(host, make, steps, extra) {
  const vbox = h('div', { class: 'viewer tall' }), side = h('div');
  host.append(h('div', { class: 'split' }, h('div', null, vbox), side));
  let ctl = null;
  const sc = make(vbox, (s) => ctl && ctl.onSet(s));
  if (!sc.clock) { side.append(h('p', { class: 'hint' }, 'Animação 3D indisponível neste navegador.')); return sc; }
  ctl = stepControls(sc, steps);
  side.append(ctl.el); if (extra) side.append(extra);
  sc.clock.set(0);
  return sc;
}
/** visualizador com troca de moléculas e botões (pares livres, δ, destacar O) */
function molSwitcher(host, keys, o = {}) {
  const vbox = h('div', { class: 'viewer' + (o.short ? ' short' : '') });
  const info = h('div', { class: 'stepcap', 'aria-live': 'polite' });
  let sc = null, st = { lp: true, q: !!o.q, ox: false, style: 'ball' };
  const build = (k) => {
    if (sc && sc.v) sc.v.dispose();
    vbox.innerHTML = '';
    sc = molScene(vbox, k, { lp: st.lp, q: st.q, ox: st.ox });
    if (sc.v.ok) { sc.v.caption(`<b>${LIB[k].n}</b> · ${LIB[k].f}`); if (st.style !== 'ball') sc.setStyle(st.style); }
    info.innerHTML = (o.notes && o.notes[k]) || '';
  };
  const tog = (k, t) => tgl(t, () => { st[k] = !st[k]; if (sc && sc.D) { sc.D.st[k] = st[k]; sc.D.apply(); } return st[k]; }, st[k]);
  host.append(h('div', { class: 'controls' }, seg(keys.map((k) => [k, LIB[k].n]), keys[0], build, 'Molécula')), vbox,
    h('div', { class: 'controls' }, tog('lp', 'pares livres'), tog('q', 'cargas parciais δ'), tog('ox', 'destacar O'), tgl('space-filling', () => { st.style = st.style === 'ball' ? 'space' : 'ball'; if (sc && sc.setStyle) sc.setStyle(st.style); return st.style === 'space'; }, false)), info);
  build(keys[0]);
}
function playerOf(host, frames, caps, o) { player(host, frames.map((s, i) => ({ s, cap: caps[i] })), o); }

/* ---------- componentes ---------- */
const W = {
  hero(host) {
    [['metanol', '<b>R–OH</b> · álcool'], ['eterDimetilico', '<b>R–O–R′</b> · éter'], ['oxirano', '<b>epóxido</b>']].forEach(([k, cap]) => {
      const vb = h('div', { class: 'viewer short' }); host.append(vb);
      const sc = molScene(vb, k, { autoRotate: true, zoom: 1.0 });
      if (sc.v.ok) sc.v.caption(cap);
    });
  },
  alcohols3d(host) {
    molSwitcher(host, ['metanol', 'etanol', 'propan2ol', 'tbutanol'], { q: true, notes: {
      metanol: 'Metanol: o carbono do OH está ligado só a H (classificado à parte; comporta-se como 1°).',
      etanol: 'Etanol: álcool <b>1°</b>. Observe o O angular (C–O–H ≈ 108,5°) com dois pares livres.',
      propan2ol: 'Propan-2-ol: álcool <b>2°</b>.',
      tbutanol: '2-metilpropan-2-ol: álcool <b>3°</b>; o C do OH não tem H.' } });
  },
  hbond(host) {
    const vbox = h('div', { class: 'viewer tall' }); const info = h('div', { class: 'stepcap', 'aria-live': 'polite' });
    host.append(vbox);
    const sc = hbondScene(vbox);
    const upd = () => { const I = HB_INFO[sc.st ? sc.st.kind : 'etanol']; info.innerHTML = `<b>${I.n}</b> (${I.f}) · P.E. <b>${I.pe}</b><br>${I.txt}`; };
    host.append(h('div', { class: 'controls' }, seg([['etanol', 'etanol'], ['dme', 'éter dimetílico'], ['propano', 'propano']], 'etanol', (k) => { if (sc.set) sc.set(k); upd(); }, 'Molécula'), tgl('com água', () => { const on = !(sc.st && sc.st.water); if (sc.water) sc.water(on); upd(); return on; }, false)), info,
      h('div', { class: 'legend' }, h('span', null, h('i', { style: 'background:#ffd45c' }), 'ligação de hidrogênio (pisca)'), h('span', null, h('i', { style: 'background:#2fd4f5' }), 'par livre do O')));
    upd();
  },
  solub(host) { solubility(host); },
  solOrder(host) { host.append(exerciseCard({ title: 'Ordene os álcoois por solubilidade em água', type: 'order', q: 'Do <b>mais solúvel</b> para o <b>menos solúvel</b>.', items: [{ id: 'm', s: M.metanol(), label: 'metanol' }, { id: 'e', s: M.etanol(), label: 'etanol' }, { id: 'b', s: M.butan1ol(), label: 'butan-1-ol' }, { id: 'h', s: M.hexan1ol(), label: 'hexan-1-ol' }, { id: 'o', s: M.octan1ol(), label: 'octan-1-ol' }], correct: ['m', 'e', 'b', 'h', 'o'], top: 'mais solúvel', bottom: 'menos solúvel', explain: 'Metanol e etanol são miscíveis; depois a solubilidade cai com o tamanho da cadeia apolar (butan-1-ol ≈ 7, hexan-1-ol ≈ 0,6, octan-1-ol ≈ 0,05 g/100 mL).', e: 'O OH é o mesmo; o que muda é a parte hidrofóbica.' }, 'A1')); },
  bp(host) { bpBars(host); },
  classify3d(host) {
    const vbox = h('div', { class: 'viewer short' }); const fb = h('div', { 'aria-live': 'polite' });
    const prompt = h('p', { class: 'prompt' });
    let k = 0, sc = null, found = false;
    const btns = h('div', { class: 'qopts', style: 'display:flex;gap:8px;flex-wrap:wrap' }, ['1°', '2°', '3°'].map((c, n) => h('button', { class: 'btn', type: 'button', onclick: () => classify(n + 1) }, c)));
    const nextB = h('button', { class: 'btn sm', type: 'button', onclick: () => { k = (k + 1) % CLASSIFY.length; build(); } }, 'Próxima molécula →');
    host.append(h('div', { class: 'split' }, vbox, h('div', null, prompt, btns, fb, h('div', { class: 'controls' }, nextB))));
    function build() {
      if (sc && sc.v) sc.v.dispose(); vbox.innerHTML = ''; found = false; fb.innerHTML = '';
      const key = CLASSIFY[k];
      sc = classifyScene(vbox, key, (i, a) => {
        if (i === 0) { found = true; fb.innerHTML = '<div class="fb ok">✔ Esse é o carbono carbinólico (ligado ao OH). Agora conte quantos <b>carbonos</b> estão ligados a ele e classifique.</div>'; }
        else fb.innerHTML = `<div class="fb bad">✘ Esse ${a.el === 'C' ? 'carbono não está ligado ao O' : 'átomo é ' + (a.el === 'O' ? 'o oxigênio' : 'um hidrogênio')}. Clique no <b>carbono ligado ao OH</b>.</div>`;
      });
      if (sc.v.ok) sc.v.caption(`<b>${LIB[key].n}</b>`);
      prompt.innerHTML = `<b>1.</b> Clique, no modelo 3D, no carbono ligado ao OH. <b>2.</b> Classifique o álcool.`;
    }
    function classify(n) {
      const want = sc.nC === 0 ? 1 : sc.nC;
      if (!found && sc.v.ok) { fb.innerHTML = '<div class="fb neutral">Primeiro clique no carbono ligado ao OH.</div>'; return; }
      fb.innerHTML = `<div class="fb ${n === want ? 'ok' : 'bad'}">${n === want ? '✔ Correto' : '✘ Não'}: o carbono do OH está ligado a <b>${sc.nC}</b> carbono(s) → álcool <b>${want}°</b>${sc.nC === 0 ? ' (o metanol é um caso especial; reage como 1°)' : ''}.</div>`;
    }
    build();
  },
  nomAlc(host) { nomenTrainer(host, NOMEN_ALC); },
  nomEth(host) { nomenTrainer(host, NOMEN_ETH, { tiles: TILES_ETH, badName: '✘ Ainda não. Para éteres: localizador + alcóxi (grupo menor + O) + alcano principal. Substituintes em ordem alfabética.' }); },
  nomQuiz(host) {
    [
      { title: 'Nomeie', type: 'mc', q: 'CH₃CH₂CH(OH)CH₂CH₃:', o: ['pentan-3-ol', 'pentan-2-ol', '3-etilpropanol', '1-etilpropanol'], a: 0, e: 'OH no C3 nos dois sentidos.' },
      { title: 'Nomeie', type: 'mc', q: '(CH₃)₂CHCH₂OH:', o: ['2-metilpropan-1-ol', '2-metilpropan-3-ol', 'butan-1-ol', 'isobutan-2-ol'], a: 0, e: 'Numere a partir do C do OH.' },
      { title: 'Nomeie', type: 'mc', q: 'HOCH₂CH(OH)CH₂OH:', o: ['propano-1,2,3-triol', 'propanotriol-1,2,3', 'glicerina-1,2,3', '1,2,3-propanol'], a: 0, e: 'Glicerol.' },
    ].forEach((d, i) => host.append(exerciseCard(d, 'N' + (i + 1))));
  },
  pka(host) { pka(host); },
  alkoxide3d(host) { const sc = sceneWithSteps(host, (v, on) => alkoxideScene(v, on), ALKOX_STEPS, h('div', { class: 'legend' }, h('span', null, h('i', { style: 'background:#2fd4f5' }), 'par livre'), h('span', null, h('i', { style: 'background:#ab5cf2' }), 'Na⁺'))); void sc; },
  hydrTable(host) { table(host, 'hydration'); },
  protPlayer(host) {
    const f = hbrSN2();
    playerOf(host, f, ['Butan-1-ol + HBr. O OH sozinho seria um grupo abandonador péssimo (OH⁻, base forte).', '<b>Protonação</b>: um par livre do O captura o H⁺; o par da ligação H–Br fica com o Br.', '<b>Álcool protonado</b> (íon alquiloxônio, ROH₂⁺). O grupo abandonador agora é a <b>água</b>.', '<b>SN2</b>: Br⁻ ataca o carbono pelo lado oposto enquanto a H₂O sai (uma única etapa).', '<b>1-bromobutano</b> + H₂O.']);
  },
  sn1Player(host) {
    const f = hbrSN1();
    playerOf(host, f, ['2-metilpropan-2-ol + HBr.', 'Protonação do OH.', 'Álcool protonado.', '<b>Etapa lenta</b>: a ligação C–O se rompe e a água sai.', '<b>Carbocátion terciário</b> (planar). Br⁻ ataca (por qualquer face).', '<b>2-bromo-2-metilpropano</b>.']);
  },
  energyHX(host) { energyChart(host, { show: ['sn2', 'sn1'], noEa: true, h: 330 }); },
  pbr3Player(host) { playerOf(host, pbr3Frames(), ['(R)-butan-2-ol + PBr₃.', 'O par do O ataca o P; sai Br⁻.', 'O agora ligado ao P (e protonado): excelente grupo abandonador. O Br⁻ está do lado oposto.', '<b>SN2</b>: Br⁻ ataca pelo lado oposto ao O.', '<b>(S)-2-bromobutano</b>: inversão de configuração (sem carbocátion, sem rearranjo).']); },
  socl2Player(host) { playerOf(host, socl2Frames(), ['Butan-1-ol + SOCl₂ (com piridina).', '<b>Clorossulfito de alquila</b> (R–O–SOCl): o O foi ativado.', 'Cl⁻ ataca o carbono (SN2) e o grupo –OSOCl sai, decompondo-se em SO₂ + Cl⁻.', '<b>1-clorobutano</b> + SO₂(g) + HCl (capturado pela piridina).'], { draw: { scale: 40 } }); },
  tsPlayer(host) { playerOf(host, tosylFrames(), ['<b>Tosilação</b>: o O do álcool ataca o enxofre do TsCl; a ligação C–O <b>não</b> se rompe → configuração mantida (retenção).', '<b>SN2</b> com CN⁻: o TsO⁻ (base muito fraca, estabilizada por ressonância) sai; inversão no carbono.'], { draw: { scale: 38 } }); },
  dehydPlayer(host) {
    playerOf(host, dehydrationFrames(), ['3,3-dimetilbutan-2-ol + H₃O⁺ (de H₂SO₄).', '<b>Protonação</b> do OH.', 'Álcool protonado: a água sai (etapa lenta).', '<b>Carbocátion 2°</b>, vizinho a um carbono quaternário. Um <b>CH₃ migra</b> com seu par de elétrons (deslocamento 1,2).', '<b>Carbocátion 3°</b> (mais estável). A água remove um H<sub>β</sub>.', '<b>2,3-dimetilbut-2-eno</b>: alceno tetrassubstituído (Zaitsev).'], { draw: { scale: 38, fs: 16 } });
  },
  energyE1(host) { energyChart(host, { show: ['e1'], h: 320 }); },
  oxid(host) { oxidation(host); },
  ethers3d(host) {
    molSwitcher(host, ['eterDimetilico', 'eterDietilico', 'thf', 'anisol'], { notes: {
      eterDimetilico: 'Éter dimetílico: C–O–C ≈ 112°. O O tem dois pares livres, mas nenhum H.',
      eterDietilico: 'Éter dietílico: solvente clássico de extração e de reações de Grignard (P.E. 35 °C).',
      thf: 'THF: éter cíclico de 5 membros; o O "exposto" solvata bem cátions (Mg²⁺, Li⁺).',
      anisol: 'Anisol: éter arílico; a ligação O–C(arila) tem caráter parcial de dupla (ressonância).' } });
  },
  etherWater(host) {
    const vbox = h('div', { class: 'viewer' }); host.append(vbox);
    const sc = hbondScene(vbox);
    if (sc.set) { sc.set('dme'); sc.water(true); }
    host.append(h('div', { class: 'controls' }, seg([['dme', 'éter dimetílico + água'], ['etanol', 'etanol + água'], ['propano', 'propano + água']], 'dme', (k) => { if (sc.set) { sc.set(k); sc.water(true); } }, 'Sistema')),
      h('p', { class: 'hint', style: 'color:var(--muted);font-size:.86rem' }, 'Linhas amarelas: ligações de hidrogênio. O éter só recebe (O ← H–O–H); o etanol também doa (O–H → O da água).'));
  },
  willPlayer(host) { const f = williamsonFrames(); playerOf(host, f.concat([williamsonE2()]), ['Etóxido de sódio + iodometano.', '<b>SN2</b>: o par do O⁻ ataca o CH₃ pelo lado oposto ao I.', '<b>Metoxietano</b> + I⁻.', '<b>Contraexemplo</b>: CH₃O⁻ + (CH₃)₃CBr. O carbono terciário bloqueia a SN2; o alcóxido age como <b>base</b> e remove um H<sub>β</sub> (E2) → metilpropeno.'], { draw: { scale: 40 } }); },
  willSide(host) {
    host.append(exerciseCard({ title: 'Qual lado do éter deve ser usado como haleto?', type: 'mc', q: 'Para preparar o 2-etoxi-2-metilbutano por Williamson:', fig: [{ s: M.tamilEtilEter(), cap: 'alvo' }], o: ['CH₃CH₂C(CH₃)₂O⁻ + CH₃CH₂Br', 'CH₃CH₂O⁻ + CH₃CH₂C(CH₃)₂Br', 'qualquer uma das duas', 'nenhuma: éteres terciários não podem ser feitos'], a: 0, e: 'O lado terciário deve ficar no alcóxido; o haleto deve ser primário. A outra rota daria principalmente alcenos (E2).' }, 'W1'));
    host.append(exerciseCard({ title: 'Qual lado do éter deve ser usado como haleto?', type: 'mc', q: 'Para preparar o anisol (metoxibenzeno):', fig: [{ s: M.anisol(), cap: 'alvo' }], o: ['C₆H₅O⁻ + CH₃I', 'CH₃O⁻ + C₆H₅Br', 'qualquer uma', 'C₆H₅OH + CH₃OH, H₂SO₄'], a: 0, e: 'O carbono do anel (sp²) não sofre SN2: o lado arila fica no fenóxido.' }, 'W2'));
  },
  cleavPlayer(host) { playerOf(host, cleavageFrames(), ['Metoxietano + HI.', '<b>Protonação</b> do O do éter.', 'Éter protonado (oxônio): agora há um grupo abandonador neutro (álcool).', '<b>SN2</b>: I⁻ ataca o carbono <b>menos impedido</b> (CH₃).', '<b>CH₃I + etanol</b>. Com excesso de HI, o etanol também vira iodoetano.']); },
  epox3d(host) {
    molSwitcher(host, ['oxirano', 'metiloxirano', 'dimetiloxirano', 'cisDimetiloxirano'], { notes: {
      oxirano: 'Óxido de etileno: o menor epóxido (gás, P.E. 11 °C), usado industrialmente para fabricar etilenoglicol.',
      metiloxirano: 'Óxido de propileno: o C2 é estereocentro.',
      dimetiloxirano: '2,2-dimetiloxirano: um C primário e um terciário — ótimo para comparar a abertura ácida × básica.',
      cisDimetiloxirano: 'cis-2,3-dimetiloxirano: meso (os dois CH₃ do mesmo lado).' } });
  },
  strain3d(host) {
    const vbox = h('div', { class: 'viewer' }); host.append(vbox);
    const sc = strainScene(vbox);
    host.append(h('div', { class: 'controls' }, tgl('ângulos C–O–C', () => sc.toggle && sc.toggle('ang'), true), tgl('pares livres', () => sc.toggle && sc.toggle('lp'), false), tgl('destacar O', () => sc.toggle && sc.toggle('ox'), false)));
  },
  mcpba3d(host) { sceneWithSteps(host, (v, on) => mcpbaScene(v, on), MCPBA_STEPS, h('div', { class: 'legend' }, h('span', null, h('i', { style: 'background:#ef3b3b' }), 'O'), h('span', null, h('i', { style: 'background:#ffd45c' }), 'ligações parciais (ET)'), h('span', null, h('i', { style: 'background:#2fd4f5' }), 'ligação π'))); },
  halohPlayer(host) { playerOf(host, halohydrinEpoxFrames(), ['1-bromo-2-metilpropan-2-ol (haloidrina) + OH⁻.', 'A base remove o H do OH (ácido–base, rápido).', '<b>Alcóxido</b>: o O⁻ está vizinho ao C–Br.', '<b>SN2 intramolecular</b>: o O⁻ ataca o CH₂ pelo lado oposto ao Br (O e Br precisam estar anti).', '<b>2,2-dimetiloxirano</b> + Br⁻.'], { draw: { scale: 40 } }); },
  open3d(host) {
    const a = h('div', { class: 'viewer' }), b = h('div', { class: 'viewer' });
    host.append(h('div', { class: 'grid2' }, h('div', null, h('h4', { style: 'color:var(--cyan)' }, 'Básico: CH₃O⁻ ataca o CH₂'), a), h('div', null, h('h4', { style: 'color:var(--orange)' }, 'Ácido: CH₃OH ataca o C terciário'), b)));
    const A = epoxOpenScene(a, { cond: 'base', nu: 'MeO' }), B = epoxOpenScene(b, { cond: 'acid', nu: 'MeOH' });
    const run = () => { if (A.attack) A.attack(0); if (B.attack) B.attack(1); };
    host.append(h('div', { class: 'controls' }, h('button', { class: 'btn sm primary', type: 'button', onclick: run }, '▶ Reproduzir lado a lado'), h('button', { class: 'btn sm', type: 'button', onclick: () => { [A, B].forEach((x) => x.clock && (x.clock.pause(), x.clock.set(0))); } }, '⟲ Reiniciar'), h('button', { class: 'btn sm', type: 'button', onclick: () => { [A, B].forEach((x) => x.clock && (x.clock.pause(), x.clock.set(1))); } }, 'Produto')),
      h('p', { class: 'hint', style: 'color:var(--muted);font-size:.86rem' }, 'Laranja: ataque do nucleófilo pelo lado oposto ao O. Rosa: a ligação C–O se rompe (amarela enquanto parcial). Observe a inversão ("guarda-chuva") do carbono atacado.'));
    setTimeout(run, 400);
  },
  basicPlayer(host) { playerOf(host, epoxBasic(), ['2,2-dimetiloxirano + CH₃O⁻.', '<b>SN2</b>: o CH₃O⁻ ataca o CH₂ (menos impedido) pelo lado oposto ao O; a C–O se rompe.', '<b>Alcóxido</b> no carbono terciário.', 'Protonação pelo solvente (CH₃OH): <b>1-metoxi-2-metilpropan-2-ol</b>.']); },
  acidPlayer(host) { playerOf(host, epoxAcid(), ['2,2-dimetiloxirano em CH₃OH com ácido (H⁺ vem de CH₃OH₂⁺).', '<b>Protonação</b> do O do epóxido.', '<b>Epóxido protonado</b>: a C–O do carbono terciário fica mais longa e fraca; esse C carrega mais δ+.', 'O CH₃OH ataca o C <b>mais substituído</b>, pelo lado oposto ao O.', '<b>Estado de transição</b> com caráter catiônico parcial — mas <b>sem carbocátion livre</b>: há inversão.', 'Após perder H⁺: <b>2-metoxi-2-metilpropan-1-ol</b>.']); },
  energyOpen(host) { energyChart(host, { show: ['epB', 'epA'], noEa: true, h: 330 }); },
  openTable(host) { table(host, 'opening'); },
  stereo3d(host) {
    const vbox = h('div', { class: 'viewer' }); host.append(vbox);
    const sc = epoxOpenScene(vbox, { subs: [['CH3', 'H'], ['CH3', 'H']], cond: 'base', nu: 'OH' });
    const out = h('div', { class: 'stepcap', 'aria-live': 'polite' }, 'cis-2,3-dimetiloxirano (meso) + OH⁻. Escolha o carbono atacado.');
    host.append(h('div', { class: 'controls' }, h('button', { class: 'btn sm primary', type: 'button', onclick: () => { if (sc.attack) sc.attack(0); out.innerHTML = 'Ataque no <b>C2</b> (esquerda): inversão em C2, C3 inalterado → um enantiômero do butano-2,3-diol.'; } }, 'atacar C2'), h('button', { class: 'btn sm primary', type: 'button', onclick: () => { if (sc.attack) sc.attack(1); out.innerHTML = 'Ataque no <b>C3</b> (direita): inversão em C3 → o <b>outro</b> enantiômero. Como os dois ataques são igualmente prováveis: <b>racemato (2R,3R) + (2S,3S)</b>.'; } }, 'atacar C3')), out);
  },
  nucTable(host) { table(host, 'nucleophiles'); },
  grigPlayer(host) { playerOf(host, grignardFrames(), ['Óxido de etileno + CH₃CH₂MgBr (o C ligado ao Mg é nucleofílico, δ−).', 'O carbono do Grignard ataca um CH₂ do epóxido (SN2); a C–O se rompe.', '<b>Alcóxido de magnésio</b>. Depois, workup ácido.', '<b>Butan-1-ol</b>: a cadeia ganhou 2 carbonos e uma nova ligação C–C.'], { draw: { scale: 40 } }); },
  bigTable(host) { table(host, 'big'); },
  reagTable(host) { table(host, 'reagents'); },
  lab(host) { const L = lab(host); cleanups.push(() => L.dispose()); },
  props(host) { propComparator(host); },
  simAlc(host) { alcoholSim(host); },
  simWill(host) { williamsonSim(host); },
  simEpox(host) { epoxSim(host); },
  puzzles(host) {
    PUZZLES.forEach((p, i) => { const d = h('div', { class: 'ex' }, h('div', { class: 'ex-head' }, h('span', { class: 'num' }, 'M' + (i + 1)), h('span', null, p.title)), h('div', { class: 'ex-body' }, h('p', null, p.intro))); host.append(d); arrowPuzzle(d.querySelector('.ex-body'), p.puzzle); });
  },
  mapAlc(host) { reactionMap(host, 'alc'); },
  mapEth(host) { reactionMap(host, 'eth'); },
  mapEpox(host) { reactionMap(host, 'epox'); },
  mechCompare(host) {
    const grid = h('div', { class: 'grid2' }); host.append(grid);
    const cell = (t, color, txt) => { const d = h('div', { class: 'block', style: 'margin:0;box-shadow:none;background:var(--surface-2)' }, h('h4', { style: `margin-top:0;color:var(--${color})` }, t), h('p', { style: 'font-size:.86rem;color:var(--muted)', html: txt })); grid.append(d); return d; };
    const sm = { draw: { scale: 34, zoom: 1.1 } };
    const a = hbrSN2(), b = williamsonFrames(), c = epoxBasic(), d = epoxAcid();
    playerOf(cell('Álcool protonado + Nu', 'orange', 'Ativação por H⁺; grupo abandonador: H₂O. 1°: SN2; 3°: SN1.'), [a[1], a[3], a[4]], ['protonação', 'SN2 (Br⁻ × H₂O)', 'produto'], sm);
    playerOf(cell('Alcóxido + haleto (Williamson)', 'cyan', 'O alcóxido é o nucleófilo; o haleto deve ser metílico/1°.'), b, ['reagentes', 'SN2', 'éter'], sm);
    playerOf(cell('Epóxido + Nu (básico)', 'green', 'Nu forte; sem ativação; ataque no C menos impedido.'), [c[1], c[2], c[3]], ['SN2 no CH₂', 'alcóxido', 'produto'], sm);
    playerOf(cell('Epóxido protonado + Nu (ácido)', 'magenta', 'Ativação por H⁺; Nu fraco; ataque no C mais substituído; inversão.'), [d[1], d[3], d[4], d[5]], ['protonação', 'ataque', 'ET (caráter catiônico)', 'produto'], sm);
  },
  levelChips(host) { [...new Set(SOLVED.map((s) => s.level))].forEach((l, i) => host.append(h('a', { class: 'chip', href: '#res-' + i }, l))); },
  solved(host) { let last = null, li = -1; SOLVED.forEach((d, i) => { if (d.level !== last) { last = d.level; li++; host.append(h('h3', { id: 'res-' + li }, d.level)); } host.append(solvedCard(d, `R${i + 1}`)); }); },
  propEasy(host) { renderProposed(host, PROPOSED.easy, 0); },
  propMid(host) { renderProposed(host, PROPOSED.mid, 15); },
  propHard(host) { renderProposed(host, PROPOSED.hard, 35); },
  epoxEx3d(host) {
    const tasks = [['base', 'MeO', 'Em meio <b>básico</b> (CH₃O⁻), clique no carbono atacado.', 0], ['acid', 'MeOH', 'Em meio <b>ácido</b> (CH₃OH, H⁺), clique no carbono atacado.', 1]];
    tasks.forEach(([cond, nu, q, want], n) => {
      const vbox = h('div', { class: 'viewer short' }); const fb = h('div', { 'aria-live': 'polite' });
      const d = h('div', { class: 'ex' }, h('div', { class: 'ex-head' }, h('span', { class: 'num' }, '3D' + (n + 1)), h('span', null, 'Clique no carbono atacado'), h('span', { class: 'type chip' }, '3D')), h('div', { class: 'ex-body' }, h('p', { html: q + ' (2,2-dimetiloxirano)' }), vbox, fb));
      host.append(d);
      let sc = null;
      sc = epoxOpenScene(vbox, { cond, nu, onPick: (k) => {
        const ok = k === want;
        fb.innerHTML = `<div class="fb ${ok ? 'ok' : 'bad'}">${ok ? '✔ Correto!' : '✘ Não.'} ${cond === 'acid' ? 'Ácido: ataque no carbono mais substituído (maior δ+ no epóxido protonado), pelo lado oposto.' : 'Básico: SN2 no carbono menos impedido (CH₂).'}</div>`;
        if (sc && sc.attack) sc.attack(want);
      } });
      if (!sc.v.ok) fb.innerHTML = '<div class="fb neutral">3D indisponível: resposta — ' + (want ? 'C terciário' : 'CH₂') + '.</div>';
    });
  },
  quiz(host) { quiz(host, (sec, anchor) => go(sec, anchor)); },
  challenge(host) { const c = challenge(host); cleanups.push(() => c.stop()); },
  cmap(host) { conceptMap(host); },
};

function renderProposed(host, list, offset) {
  const done = store.get('aee-prop', {});
  list.forEach((d, i) => host.append(exerciseCard(d, `P${offset + i + 1}`, (num, ok) => { done[num] = ok; store.set('aee-prop', done); })));
}

function conceptMap(host) {
  const node = (t, href) => h('a', { class: 'card', href, style: 'text-decoration:none;color:var(--text);text-align:left;font-size:.9rem;padding:8px 10px' }, t);
  const branch = (title, color, items) => h('div', { style: 'display:grid;gap:6px;align-content:start' }, h('div', { class: 'card', style: `font-weight:900;color:var(--${color});border-color:var(--${color})` }, title), ...items.map(([t, href]) => node(t, href)));
  host.append(
    h('div', { style: 'display:grid;justify-items:center;margin-bottom:14px' }, h('div', { class: 'card', style: 'font-size:1.35rem;font-weight:900;border-color:var(--cyan);background:linear-gradient(135deg,rgba(47,212,245,.14),rgba(61,220,151,.12))' }, 'Compostos Orgânicos Oxigenados')),
    h('div', { class: 'grid3' },
      branch('Álcoois · estrutura', 'cyan', [['O sp³, 2 pares livres; C–O e O–H polares', '#estrutura-alcoois'], ['1° · 2° · 3°', '#est-class'], ['nomenclatura -ol', '#nomenclatura']]),
      branch('Álcoois · propriedades', 'cyan', [['ligação de H (doador + aceptor)', '#est-hbond'], ['P.E. altos; solubilidade × cadeia', '#est-sol'], ['acidez (pKa ≈ 16) → alcóxidos', '#acidez']]),
      branch('Álcoois · mecanismos', 'orange', [['ativar o OH: H⁺, PBr₃, SOCl₂, TsCl', '#reacoes-alcoois'], ['SN1 (3°) × SN2 (1°)', '#rea-hx'], ['desidratação E1 + rearranjos', '#rea-desid']]),
      branch('Álcoois · produtos', 'green', [['haletos, tosilatos, alcenos', '#reacoes-alcoois'], ['aldeído / cetona / ácido', '#oxidacao'], ['éteres (Williamson)', '#sintese-eteres']]),
      branch('Éteres', 'violet', [['só aceptor; P.E. baixo; solventes', '#estrutura-eteres'], ['Williamson: haleto metílico/1°', '#sintese-eteres'], ['clivagem com HI/HBr', '#reacoes-eteres']]),
      branch('Epóxidos', 'magenta', [['tensão de anel (≈ 60°)', '#epoxidos'], ['mCPBA · haloidrina + base', '#epox-prep'], ['abertura básica: C menos substituído', '#abertura'], ['abertura ácida: C mais substituído', '#ab-acida'], ['anti; Grignard → C–C', '#ab-estereo']])),
    h('div', { class: 'flowsteps', style: 'margin-top:18px;flex-direction:row;flex-wrap:wrap;justify-content:center' }, ['estrutura', 'propriedade', 'mecanismo', 'produto'].map((t, i) => [i ? h('span', { class: 'ar' }, '→') : null, h('div', { class: 'fs', style: 'min-width:0' }, h('b', null, t))]).flat()));
}

/* ---------- navegação ---------- */
function initSection(sec) {
  sec.querySelectorAll('[data-fig]:not([data-done])').forEach((el) => { el.setAttribute('data-done', ''); const f = FIG[el.dataset.fig]; if (f) { try { f(el); } catch (err) { console.error('Figura', el.dataset.fig, err); } } });
  sec.querySelectorAll('[data-w]:not([data-done])').forEach((el) => {
    el.setAttribute('data-done', '');
    const f = W[el.dataset.w];
    if (!f) { console.error('Componente inexistente', el.dataset.w); return; }
    try { f(el); } catch (err) { console.error('Componente', el.dataset.w, err); el.insertAdjacentHTML('beforeend', '<p class="hint">Não foi possível carregar este componente.</p>'); }
  });
  quickTests(sec);
}
function teardown(sec) {
  cleanups.splice(0).forEach((f) => { try { f(); } catch (e) { /* ok */ } });
  [...VIEWERS].forEach((v) => v.dispose());
  if (!sec) return;
  sec.querySelectorAll('[data-w][data-3d]').forEach((el) => { el.innerHTML = ''; el.removeAttribute('data-done'); });
}
function go(id, anchor) {
  let sec = document.getElementById(id);
  if (!sec || !sec.classList.contains('section')) { const inner = document.getElementById(id); sec = inner ? inner.closest('.section') : SECTIONS[0]; anchor = inner && inner !== sec ? id : anchor; }
  if (sec !== current) {
    if (current) teardown(current);
    current = sec;
    SECTIONS.forEach((s) => s.classList.toggle('active', s === sec));
    NAV.forEach((a) => { if (a.getAttribute('href') === '#' + sec.id) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    initSection(sec);
    const visited = store.get('aee-visited', []);
    if (!visited.includes(sec.id)) { visited.push(sec.id); store.set('aee-visited', visited); }
    markVisited(); buildPager();
    document.title = (sec.dataset.title || '') + ' · Álcoois, Éteres e Epóxidos';
    const cur = NAV.find((a) => a.getAttribute('aria-current'));
    if (cur) cur.scrollIntoView({ block: 'nearest', inline: 'center' });
  }
  if (anchor) { const t = document.getElementById(anchor); if (t) setTimeout(() => t.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60); }
  else { window.scrollTo(0, 0); setTimeout(() => window.scrollTo(0, 0), 0); }
}
function markVisited() {
  const visited = store.get('aee-visited', []);
  NAV.forEach((a) => a.classList.toggle('done', visited.includes(a.getAttribute('href').slice(1)) && !a.getAttribute('aria-current')));
  document.getElementById('progress').style.width = (100 * visited.length / SECTIONS.length) + '%';
}
function buildPager() {
  const i = SECTIONS.indexOf(current);
  pager.innerHTML = '';
  if (i > 0) pager.append(h('a', { class: 'btn', href: '#' + SECTIONS[i - 1].id }, '← ' + SECTIONS[i - 1].dataset.title));
  if (i < SECTIONS.length - 1) pager.append(h('a', { class: 'btn primary', href: '#' + SECTIONS[i + 1].id, style: 'margin-left:auto' }, SECTIONS[i + 1].dataset.title + ' →'));
}
window.addEventListener('hashchange', () => go(location.hash.slice(1) || 'inicio'));
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-action]');
  if (!b) return;
  if (b.dataset.action === 'redo') {
    try { localStorage.removeItem('aee-prop'); } catch (err) { /* nada */ }
    const sec = document.getElementById('propostos');
    sec.querySelectorAll('[data-w]').forEach((el) => { el.innerHTML = ''; el.removeAttribute('data-done'); });
    initSection(sec);
  }
});
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
go(location.hash.slice(1) || 'inicio');
window.addEventListener('load', () => { const t = document.getElementById(location.hash.slice(1)); if (!t || t.classList.contains('section')) setTimeout(() => window.scrollTo(0, 0), 30); });
void S;
