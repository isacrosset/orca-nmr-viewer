/*
 * widgets2d.js — componentes interativos 2D da eliminação.
 */
import { mol, el as sel } from './chem2d.js';
import { EXP, SKA, newmanSVG } from './struct.js';
import { LEVELS, MECHS, MNAME, CLASSES, RCATS, score, ranked, competition, SUBS, REAGS, SOLVS, analyze } from './logic.js';

export function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  if (attrs) for (const k in attrs) {
    if (k === 'class') e.className = attrs[k];
    else if (k === 'html') e.innerHTML = attrs[k];
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), attrs[k]);
    else if (attrs[k] !== null && attrs[k] !== undefined && attrs[k] !== false) e.setAttribute(k, attrs[k]);
  }
  kids.flat().forEach((k) => { if (k !== null && k !== undefined) e.append(k.nodeType ? k : document.createTextNode(k)); });
  return e;
}
export const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const seg = (opts, cur, onPick, label) => {
  const box = h('div', { class: 'seg', role: 'group', 'aria-label': label || 'opções' });
  opts.forEach(([k, t]) => box.append(h('button', { type: 'button', 'aria-pressed': k === cur ? 'true' : 'false', 'data-k': k, html: t, onclick: () => { [...box.children].forEach((b) => b.setAttribute('aria-pressed', b.dataset.k === k)); onPick(k); } })));
  return box;
};

/* ===================================================================
 * Player de mecanismos 2D (quadros com setas curvas)
 * =================================================================== */
export function player(host, frames, o = {}) {
  let i = 0, timer = null;
  const stage = h('div', { class: 'stage', 'aria-live': 'polite' });
  const cap = h('div', { class: 'pcap' });
  const dots = h('div', { class: 'dots' }, frames.map(() => h('i')));
  const prev = h('button', { class: 'btn sm', type: 'button', onclick: () => { stop(); go(i - 1); } }, '◀ Etapa anterior');
  const next = h('button', { class: 'btn sm', type: 'button', onclick: () => { stop(); go(i + 1); } }, 'Passo a passo ▶');
  const play = h('button', { class: 'btn sm primary', type: 'button', onclick: () => toggle() }, '▶ Reproduzir');
  const reset = h('button', { class: 'btn sm', type: 'button', onclick: () => { stop(); go(0); } }, '⟲ Reiniciar');
  const root = h('div', { class: 'player mech' }, stage, cap, h('div', { class: 'pctrl' }, play, prev, next, reset, dots));
  host.appendChild(root);
  function go(k) {
    i = Math.max(0, Math.min(frames.length - 1, k));
    stage.innerHTML = '';
    const f = frames[i];
    stage.appendChild(mol(f.s, Object.assign({ animate: true, scale: 46, zoom: 1.45 }, o.draw || {}, f.o || {})));
    cap.innerHTML = f.cap || '';
    [...dots.children].forEach((d, n) => d.classList.toggle('on', n === i));
    prev.disabled = i === 0; next.disabled = i === frames.length - 1;
  }
  function stop() { if (timer) { clearInterval(timer); timer = null; play.textContent = '▶ Reproduzir'; } }
  function toggle() {
    if (timer) { stop(); play.textContent = '▶ Continuar'; return; }
    if (i === frames.length - 1) go(0);
    play.textContent = '❚❚ Pausar';
    timer = setInterval(() => {
      if (i >= frames.length - 1) { stop(); return; }
      go(i + 1);
    }, o.interval || 3200);
  }
  go(0);
  return { go, root, stop };
}

/* ===================================================================
 * Teste rápido (dentro do texto)
 * =================================================================== */
export function quickTests(root) {
  root.querySelectorAll('.note.quick[data-q]:not([data-done])').forEach((n) => {
    n.setAttribute('data-done', '');
    const opts = n.dataset.o.split(';');
    const a = +n.dataset.a;
    const fb = h('div', { class: 'qfb', 'aria-live': 'polite' });
    const box = h('div', { class: 'qopts' }, opts.map((t, k) => h('button', {
      class: 'btn sm', type: 'button',
      onclick: (e) => {
        [...box.children].forEach((b) => { b.disabled = true; });
        e.currentTarget.classList.add(k === a ? 'primary' : 'ghost');
        fb.innerHTML = (k === a ? '<b style="color:var(--green)">✔ Correto.</b> ' : `<b style="color:var(--red)">✘ Resposta: ${opts[a]}.</b> `) + n.dataset.e;
      },
    }, t)));
    n.innerHTML = `<b class="t">Teste rápido</b>${n.dataset.q}`;
    n.append(box, fb);
  });
}

/* ===================================================================
 * Sobreposição clicável em átomos de uma estrutura expandida
 * =================================================================== */
function clickable(ex, o = {}) {
  const svg = mol(ex.s, { scale: o.scale || 46, fs: 18, zoom: o.zoom || 1.5, pad: 18 });
  const C = svg._chem;
  const over = sel('g', { transform: C.transform }, svg);
  const nodes = {};
  C.atoms.forEach((a, i) => {
    if (!a.label) return;
    const g = sel('g', { class: 'pk', tabindex: 0, role: 'button', 'aria-label': (a.label === 'H' ? 'hidrogênio' : a.label === 'C' ? 'carbono' : a.label) + ' ' + i }, over);
    sel('circle', { cx: a.x, cy: a.y, r: a.label === 'H' ? 11 : 14 }, g);
    nodes[i] = g;
    const fire = () => o.onPick && o.onPick(i, g);
    g.addEventListener('click', fire);
    g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(); } });
  });
  return { svg, nodes };
}
const whatIs = (ex, i) => {
  if (i === ex.lg) return 'grupo abandonador';
  if (i === ex.alpha) return 'carbono α';
  if (ex.betaC.includes(i)) return 'carbono β';
  if (ex.betaH.includes(i)) return 'hidrogênio β';
  if (ex.alphaH.includes(i)) return 'hidrogênio α';
  if (ex.hs.includes(i)) return 'hidrogênio γ (ou mais distante)';
  return 'carbono γ (ou mais distante)';
};

export const PICK_MOLS = {
  bromoetano: { t: 'bromoetano', d: 'CH₃CH₂Br' },
  bromobutano2: { t: '2-bromobutano', d: 'CH₃CHBrCH₂CH₃' },
  bromometilbutano: { t: '2-bromo-2-metilbutano', d: '(CH₃)₂CBrCH₂CH₃' },
  bromobutano1: { t: '1-bromobutano', d: 'BrCH₂CH₂CH₂CH₃' },
  tbutil: { t: 'brometo de terc-butila', d: '(CH₃)₃CBr' },
  neopentil: { t: '1-bromo-2,2-dimetilpropano', d: 'BrCH₂C(CH₃)₃' },
};

/* Identifique Cα, Cβ, Hβ e grupo abandonador */
export function rolesPick(host) {
  const STEPS = [['alpha', 'Clique no <b>carbono α</b> (ligado ao grupo abandonador).'], ['beta', 'Clique em um <b>carbono β</b> (vizinho do Cα).'], ['hb', 'Clique em um <b>hidrogênio β</b>.'], ['lg', 'Clique no <b>grupo abandonador</b>.']];
  const stage = h('div', { class: 'pick mech' });
  const prompt = h('p', { class: 'prompt', 'aria-live': 'polite' });
  const fb = h('div', { class: 'fb neutral' }, 'Os átomos são clicáveis. Siga as instruções.');
  let key = 'bromobutano2', k = 0, ex;
  const tabs = seg(Object.keys(PICK_MOLS).slice(0, 3).map((m) => [m, PICK_MOLS[m].t]), key, (m) => { key = m; build(); }, 'Molécula');
  host.append(h('div', { class: 'controls' }, tabs), stage, prompt, fb);
  function build() {
    ex = EXP[key](); k = 0;
    stage.innerHTML = '';
    const { svg } = clickable(ex, { onPick });
    stage.append(svg);
    prompt.innerHTML = STEPS[0][1];
    fb.className = 'fb neutral'; fb.textContent = 'Os átomos são clicáveis. Siga as instruções.';
  }
  function onPick(i, g) {
    if (k >= STEPS.length) return;
    const want = STEPS[k][0];
    const ok = (want === 'alpha' && i === ex.alpha) || (want === 'beta' && ex.betaC.includes(i)) || (want === 'hb' && ex.betaH.includes(i)) || (want === 'lg' && i === ex.lg);
    if (ok) {
      g.classList.add('ok');
      k++;
      fb.className = 'fb ok';
      fb.innerHTML = '✔ Correto: ' + whatIs(ex, i) + '.';
      prompt.innerHTML = k < STEPS.length ? STEPS[k][1] : '🎉 Concluído! Agora troque de molécula ou vá para o desafio dos Hβ abaixo.';
    } else {
      g.classList.add('bad'); setTimeout(() => g.classList.remove('bad'), 900);
      fb.className = 'fb bad';
      fb.innerHTML = `✘ Isso é um(a) <b>${whatIs(ex, i)}</b>. ${want === 'hb' ? 'O Hβ está ligado a um carbono <b>vizinho</b> do Cα — não ao próprio Cα.' : want === 'beta' ? 'Carbono β é o carbono ligado diretamente ao Cα.' : ''}`;
    }
  }
  build();
}

/* Clique em todos os Hβ disponíveis */
export function betaPick(host, o = {}) {
  const stage = h('div', { class: 'pick mech' });
  const fb = h('div');
  let key = o.start || 'bromobutano2', ex, chosen = new Set(), nodes = {};
  const list = o.mols || ['bromoetano', 'bromobutano2', 'bromometilbutano', 'bromobutano1', 'neopentil'];
  const tabs = seg(list.map((m) => [m, PICK_MOLS[m].t]), key, (m) => { key = m; build(); }, 'Molécula');
  const check = h('button', { class: 'btn sm primary', type: 'button', onclick: () => verify() }, 'Conferir');
  const show = h('button', { class: 'btn sm', type: 'button', onclick: () => { chosen = new Set(ex.betaH); paint(); verify(true); } }, 'Ver resposta');
  const clear = h('button', { class: 'btn sm', type: 'button', onclick: () => { chosen.clear(); paint(); fb.innerHTML = ''; } }, 'Limpar');
  host.append(h('div', { class: 'controls' }, tabs), h('p', { class: 'prompt' }, 'Clique em todos os hidrogênios β disponíveis.'), stage, h('div', { class: 'ex-actions' }, check, show, clear), fb);
  function build() {
    ex = EXP[key](); chosen = new Set();
    stage.innerHTML = '';
    const r = clickable(ex, { onPick: (i) => { if (!ex.hs.includes(i)) { fb.className = 'fb neutral'; fb.innerHTML = `Esse átomo é um(a) <b>${whatIs(ex, i)}</b>. Aqui você deve clicar apenas em <b>hidrogênios</b>.`; return; } chosen.has(i) ? chosen.delete(i) : chosen.add(i); paint(); } });
    nodes = r.nodes; stage.append(r.svg); fb.innerHTML = '';
  }
  function paint() { Object.entries(nodes).forEach(([i, g]) => { g.classList.remove('ok', 'bad', 'miss'); g.classList.toggle('on', chosen.has(+i)); }); }
  function verify(reveal) {
    const wrong = [...chosen].filter((i) => !ex.betaH.includes(i));
    const miss = ex.betaH.filter((i) => !chosen.has(i));
    Object.entries(nodes).forEach(([i, g]) => {
      i = +i; g.classList.remove('on');
      if (chosen.has(i)) g.classList.add(ex.betaH.includes(i) ? 'ok' : 'bad');
      else if (ex.betaH.includes(i)) g.classList.add('miss');
    });
    const ok = !wrong.length && !miss.length;
    const nB = ex.betaC.length;
    let msg = ok ? `<b>✔ Correto!</b> Há <b>${ex.betaH.length}</b> Hβ distribuídos em ${nB} carbono(s) β.` : `<b>${reveal ? 'Resposta:' : '✘ Ainda não.'}</b> `;
    if (!ok && wrong.length) msg += `Você marcou ${wrong.length} H que não são β (${[...new Set(wrong.map((i) => whatIs(ex, i)))].join(', ')}). `;
    if (!ok && miss.length && !reveal) msg += `Faltam ${miss.length} Hβ (contorno tracejado verde). `;
    if (key === 'neopentil') msg += ' <br>Neste substrato o único carbono β é quaternário: <b>não há Hβ</b>, portanto <b>E2 não é possível</b> (e SN2 é muito lenta por impedimento).';
    else msg += ' <br>Os H do Cα (hidrogênios α) e de carbonos mais distantes (γ) <b>não</b> participam da eliminação β: removê-los não colocaria o par eletrônico vizinho ao C–X.';
    fb.className = 'fb ' + (ok ? 'ok' : 'bad');
    fb.innerHTML = msg;
  }
  build();
}

/* ===================================================================
 * Newman interativo: 2-bromobutano visto ao longo de C3(Cβ) → C2(Cα)
 * frente: C2 (Br, CH3, H) · fundo: C3 (Ha, Hb, CH3)
 * =================================================================== */
export function newmanE2(host) {
  const box = h('div', { class: 'newman-box' });
  const fig = h('div', { class: 'mech', style: 'display:grid;place-items:center' });
  const side = h('div');
  const dh = h('div', { class: 'dihedral' });
  const status = h('div', { class: 'stepcap', 'aria-live': 'polite' });
  const result = h('div');
  let ang = 150; // ângulo do Ha no fundo
  const range = h('input', { type: 'range', min: 0, max: 359, step: 5, value: ang, 'aria-label': 'Rotação do carbono de trás' });
  const run = h('button', { class: 'btn accent', type: 'button', onclick: () => execute() }, '⚡ Executar E2');
  range.addEventListener('input', () => { ang = +range.value; draw(); });
  const rot = (d) => h('button', { class: 'btn sm', type: 'button', onclick: () => { ang = (ang + d + 360) % 360; range.value = ang; draw(); } }, (d > 0 ? '⟲ +' : '⟳ ') + Math.abs(d) + '°');
  side.append(h('p', { html: 'Vista ao longo da ligação <b>C3→C2</b>. Na frente, o <b>C2 (Cα)</b> com Br; atrás (círculo), o <b>C3 (Cβ)</b> com dois H e um CH₃. Gire o carbono de trás até que um <b>Hβ</b> fique <b>anti-periplanar</b> ao Br (diedro = 180°).' }),
    h('div', { class: 'range-row' }, range), h('div', { class: 'controls' }, rot(60), rot(-60), rot(120), run), dh, status, result);
  box.append(fig, side);
  host.append(box);
  const back = [['Ha', 'hb'], ['Hb', 'hb'], ['CH3', '']];
  const nameB = ['Ha', 'Hb', 'CH₃'];
  function rel(a) { let d = Math.abs(((a - 90) % 360 + 360) % 360); if (d > 180) d = 360 - d; return d; }
  function draw() {
    fig.innerHTML = '';
    fig.append(newmanSVG([['Br', 'lg'], ['CH3', ''], ['H', '']], back, 90, ang, { alt: 'Projeção de Newman do 2-bromobutano', fs: 17, maxw: 330 }));
    const ds = back.map((_, i) => rel(ang - i * 120));
    dh.innerHTML = 'H–C3–C2–Br: ' + ds.slice(0, 2).map((d, i) => `<span style="color:${Math.abs(d - 180) < 3 ? 'var(--green)' : 'var(--text)'}">${nameB[i]} ${d.toFixed(0)}°</span>`).join(' · ');
    const anti = ds.findIndex((d) => Math.abs(d - 180) < 3);
    result.innerHTML = '';
    if (anti === 0 || anti === 1) { status.innerHTML = `<span class="status-ok">Geometria favorável à E2</span>: ${nameB[anti]} está anti-periplanar ao Br.`; run.disabled = false; }
    else if (anti === 2) { status.innerHTML = '<span class="status-bad">Geometria desfavorável</span>: o grupo anti ao Br é o <b>CH₃</b> — não há H para remover nessa posição.'; run.disabled = true; }
    else { status.innerHTML = '<span class="status-bad">Geometria desfavorável</span>: nenhum Hβ está anti-periplanar ao Br. Gire o carbono de trás.'; run.disabled = true; }
  }
  function execute() {
    const ds = back.map((_, i) => rel(ang - i * 120));
    const anti = ds.findIndex((d) => Math.abs(d - 180) < 3);
    if (anti > 1) return;
    // CH3 de trás vs CH3 da frente (em 330°): diedro 60° → mesmo lado (cis) ; 180° → trans
    const aMe = ((ang - 240) % 360 + 360) % 360;
    let d = Math.abs(aMe - 330); if (d > 180) d = 360 - d;
    const Z = d < 90;
    result.innerHTML = '';
    result.append(h('div', { class: 'fb ok' },
      h('div', { html: `<b>E2 a partir desta conformação:</b> base remove ${nameB[anti]}; o par C–H forma a π enquanto o Br sai. Os dois CH₃ estavam <b>${Z ? 'gauche (60°)' : 'anti (180°)'}</b> → ficam <b>${Z ? 'do mesmo lado' : 'em lados opostos'}</b> da ligação dupla.` }),
      h('figure', { class: 'fig', style: 'margin-top:8px' }, mol(Z ? SKA.but2enoZ() : SKA.but2enoE(), { scale: 44, zoom: 1.3 }), h('figcaption', { html: `<b>(${Z ? 'Z' : 'E'})-but-2-eno</b> ${Z ? '(minoritário: conformação reativa com CH₃/CH₃ gauche, mais tensa)' : '(majoritário: conformação reativa com CH₃/CH₃ anti, mais estável)'}` }))));
  }
  draw();
}

/* ===================================================================
 * Zaitsev × Hofmann: "Qual alceno será formado?"
 * =================================================================== */
const ZH = [
  { k: 'b2', t: '2-bromobutano', s: () => SKA.bromobutano2(), opts: [['z', 'but-2-eno', () => SKA.but2enoE(), 'dissubstituído (E > Z)'], ['h', 'but-1-eno', () => SKA.but1eno(), 'monossubstituído']], small: [81, 19], bulky: [47, 53] },
  { k: 'p2', t: '2-bromopentano', s: () => SKA.bromopentano2(), opts: [['z', 'pent-2-eno', () => SKA.pent2enoE(), 'dissubstituído (E > Z)'], ['h', 'pent-1-eno', () => SKA.pent1eno(), 'monossubstituído']], small: [69, 31], bulky: [34, 66] },
  { k: 'mb', t: '2-bromo-2-metilbutano', s: () => SKA.bromometilbutano(), opts: [['z', '2-metilbut-2-eno', () => SKA.metilbut2eno(), 'trissubstituído'], ['h', '2-metilbut-1-eno', () => SKA.metilbut1eno(), 'dissubstituído (1,1)']], small: [70, 30], bulky: [28, 72] },
  { k: 'mc', t: '1-bromo-1-metilciclo-hexano', s: () => SKA.metilciclohexil(), opts: [['z', '1-metilciclo-hexeno', () => SKA.metilciclohexeno(), 'trissubstituído (endocíclico)'], ['h', 'metilideneciclo-hexano', () => SKA.metilenociclohexano(), 'dissubstituído (exocíclico)']], small: null, bulky: null },
];
export function zaitsev(host) {
  let cur = ZH[0], base = 'small', guess = null;
  const stage = h('div');
  const tabs = seg(ZH.map((z) => [z.k, z.t]), cur.k, (k) => { cur = ZH.find((z) => z.k === k); guess = null; draw(); }, 'Substrato');
  const bs = seg([['small', 'CH₃CH₂O⁻ (pequena)'], ['bulky', '(CH₃)₃CO⁻ (volumosa)']], base, (k) => { base = k; draw(); }, 'Base');
  host.append(h('div', { class: 'controls' }, tabs), h('div', { class: 'controls' }, h('span', { class: 'chip' }, 'base:'), bs), stage);
  function draw() {
    stage.innerHTML = '';
    stage.append(h('div', { class: 'figs' }, h('figure', { class: 'fig' }, mol(cur.s(), { scale: 42, zoom: 1.3 }), h('figcaption', { html: `<b>${cur.t}</b> + ${base === 'small' ? 'CH₃CH₂O⁻ / EtOH' : '(CH₃)₃CO⁻ / t-BuOH'}, Δ` }))));
    stage.append(h('p', { class: 'prompt' }, 'Qual alceno será formado em maior quantidade?'));
    const cards = h('div', { class: 'prodcards' });
    const fb = h('div');
    cur.opts.forEach(([k, name, f, sub]) => {
      const c = h('button', { class: 'card mopt struct', type: 'button', onclick: () => { guess = k; reveal(); } }, mol(f(), { scale: 34, fs: 15 }), h('b', null, name), h('small', null, sub));
      c.dataset.k = k;
      cards.append(c);
    });
    stage.append(cards, fb);
    function reveal() {
      const major = base === 'small' ? 'z' : 'h';
      [...cards.children].forEach((c) => { c.classList.toggle('right', c.dataset.k === major); c.classList.toggle('wrong', c.dataset.k === guess && guess !== major); });
      const pr = cur[base];
      fb.className = 'fb ' + (guess === major ? 'ok' : 'bad');
      fb.innerHTML = (guess === major ? '✔ ' : '✘ ') + (base === 'small'
        ? '<b>Regra de Zaitsev</b> (tendência): com base pequena, predomina o alceno <b>mais substituído</b> (mais estável). O estado de transição E2 já tem caráter parcial de ligação dupla, então reflete a estabilidade do alceno.'
        : '<b>Produto de Hofmann</b> (tendência): a base volumosa remove mais facilmente o Hβ <b>mais acessível</b> (geralmente de CH₃ terminal), formando o alceno <b>menos substituído</b>.')
        + (pr ? `<div class="ratio" aria-label="proporção aproximada"><span class="bg-e2" style="flex-grow:${pr[0]}">${cur.opts[0][1]} ≈ ${pr[0]}%</span><span style="flex-grow:${pr[1]};background:var(--orange)">${cur.opts[1][1]} ≈ ${pr[1]}%</span></div><small style="color:var(--muted)">Proporções aproximadas da literatura; variam com solvente, temperatura e grupo abandonador.</small>` : '<br><small style="color:var(--muted)">Com etóxido, o 1-metilciclo-hexeno (endocíclico, trissubstituído) predomina; com t-BuO⁻ a fração do alceno exocíclico aumenta.</small>');
    }
  }
  draw();
}

/* ===================================================================
 * Estabilidade de alcenos (calores de hidrogenação)
 * =================================================================== */
const ALK = [
  ['eteno', 'CH₂=CH₂', 'não substituído', 137, 'eteno'],
  ['propeno', 'CH₃CH=CH₂', 'monossubstituído', 126, 'propeno'],
  ['but1eno', 'CH₃CH₂CH=CH₂', 'monossubstituído', 127, 'but-1-eno'],
  ['but2enoZ', '(Z)-CH₃CH=CHCH₃', 'dissubstituído (cis)', 120, '(Z)-but-2-eno'],
  ['metilpropeno', '(CH₃)₂C=CH₂', 'dissubstituído (1,1)', 119, '2-metilpropeno'],
  ['but2enoE', '(E)-CH₃CH=CHCH₃', 'dissubstituído (trans)', 116, '(E)-but-2-eno'],
  ['metilbut2eno', '(CH₃)₂C=CHCH₃', 'trissubstituído', 113, '2-metilbut-2-eno'],
  ['dimetilbut2eno', '(CH₃)₂C=C(CH₃)₂', 'tetrassubstituído', 111, '2,3-dimetilbut-2-eno'],
];
export function stability(host) {
  const rows = h('div');
  const info = h('div', { class: 'stepcap' }, 'Clique em um alceno para ver sua estrutura.');
  host.append(h('p', { class: 'hint', style: 'color:var(--muted);font-size:.88rem', html: 'ΔH de hidrogenação (kJ/mol, valores aproximados): <b>quanto menor o calor liberado, mais estável o alceno</b> (comparando alcenos que dão o mesmo alcano ou alcanos semelhantes).' }), rows, info);
  ALK.forEach(([k, f, sub, dH, name]) => {
    const r = h('div', { class: 'hmeter', tabindex: 0, role: 'button', style: 'cursor:pointer' }, h('span', { html: `<b>${name}</b><br><small style="color:var(--muted)">${sub}</small>` }), h('div', { class: 'bar' }, h('span', { style: `width:${(150 - dH) / 40 * 100}%` })), h('small', null, '−' + dH));
    const show = () => { info.innerHTML = ''; info.append(h('div', { class: 'figs' }, h('figure', { class: 'fig' }, mol(SKA[k](), { scale: 40, zoom: 1.2 }), h('figcaption', { html: `<b>${name}</b> · ${f}<br>${sub} · ΔH°hidrog ≈ −${dH} kJ/mol` })))); };
    r.addEventListener('click', show); r.addEventListener('keydown', (e) => { if (e.key === 'Enter') show(); });
    rows.append(r);
  });
}

/* ===================================================================
 * Bases comuns em eliminação
 * =================================================================== */
const BASES = [
  { k: 'HO⁻', n: 'hidróxido (NaOH, KOH)', pka: '15,7 (H₂O)', b: 70, nu: 75, d: 'Base forte e bom nucleófilo, pequeno. Com secundários e aquecimento, favorece E2; com primários, SN2.' },
  { k: 'CH₃O⁻', n: 'metóxido', pka: '15,5 (CH₃OH)', b: 72, nu: 78, d: 'Pequeno; base forte e bom nucleófilo. E2 com secundários e terciários.' },
  { k: 'CH₃CH₂O⁻', n: 'etóxido', pka: '16 (EtOH)', b: 75, nu: 72, d: 'Base clássica para E2 (geralmente produto de Zaitsev). Com primários, SN2 compete fortemente.' },
  { k: '(CH₃)₃CO⁻', n: 'terc-butóxido', pka: '≈ 18 (t-BuOH)', b: 80, nu: 15, d: '<b>Volumoso</b>: base forte, mas nucleófilo fraco. Favorece E2 mesmo em primários e aumenta o produto de Hofmann.' },
  { k: 'NH₂⁻', n: 'amideto (NaNH₂)', pka: '≈ 38 (NH₃)', b: 100, nu: 60, d: 'Base muito forte (usada, por exemplo, em eliminações duplas para formar alcinos).' },
  { k: 'DBU', n: '1,8-diazabiciclo[5.4.0]undec-7-eno', pka: '≈ 12–13,5 (água)', b: 55, nu: 12, d: 'Amidina neutra, volumosa, pouco nucleofílica: base usada para promover E2 com pouca substituição.' },
  { k: 'DBN', n: '1,5-diazabiciclo[4.3.0]non-5-eno', pka: '≈ 13 (água)', b: 54, nu: 12, d: 'Semelhante ao DBU: base orgânica neutra e pouco nucleofílica.' },
];
export function bases(host) {
  const grid = h('div', { class: 'cards' });
  const info = h('div', { class: 'stepcap' }, 'Clique em uma base para ver detalhes.');
  BASES.forEach((b) => {
    const c = h('button', { class: 'card', type: 'button', style: 'cursor:pointer;color:var(--text);font:inherit', onclick: () => { info.innerHTML = `<b>${b.k}</b> · ${b.n}<br>pKa do ácido conjugado ≈ ${b.pka}<br>${b.d}`; } },
      h('h4', { class: 'c-sn1', style: 'color:var(--orange)' }, b.k), h('small', null, b.n),
      h('div', { style: 'font-size:.74rem;color:var(--muted);margin-top:6px;text-align:left' }, 'basicidade'), h('div', { class: 'meter o' }, h('span', { style: `width:${b.b}%` })),
      h('div', { style: 'font-size:.74rem;color:var(--muted);margin-top:4px;text-align:left' }, 'nucleofilicidade'), h('div', { class: 'meter' }, h('span', { style: `width:${b.nu}%` })));
    grid.append(c);
  });
  host.append(grid, info, h('p', { class: 'hint', style: 'color:var(--dim);font-size:.8rem' }, 'Barras qualitativas para comparação didática (não são escalas medidas).'));
}

/* ===================================================================
 * Temperatura (modelo ilustrativo)
 * =================================================================== */
export function temperature(host) {
  const DATA = { baixa: [25, 75], moderada: [40, 60], alta: [65, 35] };
  let t = 'moderada';
  const bar = h('div', { class: 'ratio' });
  const txt = h('div', { class: 'stepcap' });
  host.append(h('div', { class: 'controls' }, h('span', { class: 'chip' }, 'temperatura:'), seg([['baixa', '❄ baixa'], ['moderada', 'moderada'], ['alta', '🔥 alta']], t, (k) => { t = k; draw(); }, 'Temperatura')), bar, txt,
    h('p', { class: 'hint', style: 'color:var(--dim);font-size:.8rem' }, 'Modelo ilustrativo (não são dados experimentais): mostra apenas a tendência qualitativa para um haleto secundário/terciário em que eliminação e substituição competem.'));
  function draw() {
    const [e, s] = DATA[t];
    bar.innerHTML = `<span class="bg-e2" style="flex-grow:${e}">eliminação ~${e}%</span><span class="bg-sn2" style="flex-grow:${s}">substituição ~${s}%</span>`;
    txt.innerHTML = { baixa: 'Em temperatura baixa, a substituição tende a ser favorecida em relação à eliminação.', moderada: 'Temperatura intermediária: mistura de produtos.', alta: 'Aquecimento <b>favorece a eliminação</b>.' }[t] +
      '<br><small>Por quê? Na eliminação, <b>uma</b> molécula de substrato gera <b>mais partículas</b> (alceno + HB + X⁻) do que na substituição: ΔS é mais positivo. Em ΔG = ΔH − TΔS, o termo −TΔS fica mais negativo quando T aumenta. Além disso, a eliminação costuma ter energia de ativação um pouco maior, e sua velocidade cresce mais com o aquecimento.</small>';
  }
  draw();
}

/* ===================================================================
 * Tabelas expansíveis
 * =================================================================== */
function expTable(host, head, rows, cls) {
  const tb = h('tbody');
  rows.forEach((r) => {
    const exp = h('tr', { class: 'exp', hidden: true }, h('td', { colspan: head.length, html: '💡 ' + r[r.length - 1] }));
    const row = h('tr', { class: 'row', tabindex: 0, role: 'button', 'aria-expanded': 'false' }, h('td', null, r[0]), ...r.slice(1, -1).map((c, i) => h('td', { class: cls[i] || '', html: c })));
    const tg = () => { const op = exp.hidden; exp.hidden = !op; row.classList.toggle('open', op); row.setAttribute('aria-expanded', op); };
    row.addEventListener('click', tg);
    row.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tg(); } });
    tb.append(row, exp);
  });
  host.append(h('div', { class: 'table-wrap' }, h('table', { class: 'cmp' }, h('thead', null, h('tr', null, head.map((t, i) => h('th', { class: i ? cls[i - 1] : '' }, t)))), tb)),
    h('p', { class: 'hint', style: 'color:var(--dim);font-size:.8rem' }, 'Clique em uma linha para ver a explicação.'));
}
export function e1e2Table(host) {
  expTable(host, ['Característica', 'E1', 'E2'], [
    ['Significado', 'eliminação unimolecular', 'eliminação bimolecular', 'O número indica a <b>molecularidade da etapa determinante</b>, não o número de etapas.'],
    ['Lei de velocidade', 'v = k[RX]', 'v = k[RX][Base]', 'Na E1 a base não participa da etapa lenta; na E2 a base participa do único estado de transição.'],
    ['Número de etapas', 'duas (ou mais)', 'uma (concertada)', 'E1: ionização → carbocátion → perda de Hβ. E2: tudo ao mesmo tempo.'],
    ['Intermediário', 'carbocátion', 'nenhum', 'O carbocátion da E1 é o mesmo da SN1: por isso E1 e SN1 competem.'],
    ['Base', 'fraca basta (H₂O, ROH)', 'forte (HO⁻, RO⁻, t-BuO⁻, DBU)', 'Com base forte, a E2 ocorre antes que o carbocátion tenha chance de se formar.'],
    ['Substrato', '3° > 2° (1° não; exceto se estabilizado)', '3° > 2° > 1°', 'Na E2 terciários reagem rápido porque formam alcenos mais substituídos e não sofrem SN2 competitiva.'],
    ['Solvente', 'polar prótico (estabiliza íons)', 'menos determinante; frequentemente o álcool conjugado da base', 'Solventes próticos estabilizam o carbocátion e o haleto que sai.'],
    ['Geometria', 'sem exigência anti-periplanar (C⁺ é plano)', '<b>anti-periplanar</b> (H–C–C–X ≈ 180°)', 'Na E1, a ligação C–Hβ só precisa se alinhar com o orbital p vazio.'],
    ['Rearranjo', 'possível', 'não ocorre', 'Rearranjos exigem carbocátion.'],
    ['Regioquímica', 'Zaitsev (alceno mais estável)', 'Zaitsev com base pequena; Hofmann pode aumentar com base volumosa', 'Tendências, não leis absolutas.'],
    ['Estereoquímica', 'estereosseletiva (E > Z em geral)', '<b>estereoespecífica</b> (depende da conformação anti)', 'Na E2, o diastereoisômero do substrato determina se o alceno é E ou Z.'],
    ['Competição', 'SN1', 'SN2', 'Aquecimento favorece a eliminação nos dois casos.'],
  ], ['c-e1', 'c-e2']);
}
export function mech4Table(host) {
  expTable(host, ['Característica', 'SN1', 'SN2', 'E1', 'E2'], [
    ['Tipo', 'substituição', 'substituição', 'eliminação', 'eliminação', 'Substituição troca o grupo abandonador pelo nucleófilo; eliminação forma C=C.'],
    ['Etapas', '2+', '1', '2+', '1', 'SN1 e E1 passam pelo mesmo carbocátion.'],
    ['Velocidade', 'k[RX]', 'k[RX][Nu]', 'k[RX]', 'k[RX][B]', 'Unimolecular × bimolecular.'],
    ['Intermediário', 'carbocátion', '—', 'carbocátion', '—', 'Carbocátion ⇒ possibilidade de rearranjo.'],
    ['Substrato típico', '3°, benzílico, alílico', 'metílico, 1°, (2°)', '3°, (2°)', '3°, 2°, 1° com base volumosa', 'Primários e metílicos não formam carbocátions livres.'],
    ['Reagente', 'Nu fraco', 'Nu forte', 'base fraca', 'base forte', 'Mesma espécie pode agir como Nu ou base: o resultado depende do substrato e das condições.'],
    ['Solvente', 'prótico', 'aprótico (favorece)', 'prótico', 'variável', 'Prótico estabiliza íons; aprótico deixa ânions reativos.'],
    ['Estereoquímica', 'racemização (parcial)', 'inversão', 'E > Z (seletiva)', 'anti-periplanar (específica)', 'SN2: inversão de Walden; E2: geometria anti.'],
    ['Rearranjo', 'sim', 'não', 'sim', 'não', 'Migração 1,2 de hidreto ou alquila para formar cátion mais estável.'],
    ['Temperatura alta', 'perde para E1', '—', 'favorecida', 'favorecida', 'Eliminação tem ΔS mais positivo.'],
    ['Produto', 'R–Nu', 'R–Nu (invertido)', 'alceno', 'alceno', 'Analise sempre: estrutura + reagente + solvente + temperatura.'],
  ], ['c-sn1', 'c-sn2', 'c-e1', 'c-e2']);
}

/* ===================================================================
 * Matriz de decisão "Qual mecanismo é mais provável?"
 * =================================================================== */
function radioGroup(title, name, opts, cur, onChange) {
  const box = h('div', { class: 'opts' });
  opts.forEach(([k, t, small]) => box.append(h('label', { class: 'opt-radio' }, h('input', { type: 'radio', name, value: k, checked: k === cur ? true : null }), h('span', { html: t }), small ? h('small', { html: small }) : null)));
  box.addEventListener('change', (e) => onChange(e.target.value));
  return h('div', { class: 'optgroup' }, h('h4', null, title), box);
}
export function probCards(s) {
  return h('div', { class: 'prob' }, MECHS.map((m) => h('div', null, h('b', { class: 'c-' + m }, MNAME[m]), h('div', { class: 'lvl c-' + m }, LEVELS[s[m]]), h('div', { class: 'bar' }, h('span', { class: 'bg-' + m, style: `width:${s[m] * 25}%` })))));
}
export function matrix(host) {
  const st = { cls: 'sec', rcat: 'strong', solv: 'prot', temp: 'moderada' };
  const out = h('div', { 'aria-live': 'polite' });
  const n = 'mx' + Math.random().toString(36).slice(2, 6);
  host.append(h('div', { class: 'sim-grid' },
    radioGroup('Substrato', n + 's', Object.entries(CLASSES).map(([k, v]) => [k, v.t]), st.cls, (v) => { st.cls = v; draw(); }),
    radioGroup('Reagente', n + 'r', Object.entries(RCATS).map(([k, v]) => [k, v.t, v.ex]), st.rcat, (v) => { st.rcat = v; draw(); }),
    radioGroup('Solvente', n + 'v', [['prot', 'polar prótico', 'H₂O, ROH'], ['aprot', 'polar aprótico', 'DMSO, DMF, acetona']], st.solv, (v) => { st.solv = v; draw(); }),
    radioGroup('Temperatura', n + 't', [['baixa', 'baixa'], ['moderada', 'moderada'], ['alta', 'alta']], st.temp, (v) => { st.temp = v; draw(); })), out);
  function draw() {
    const { s, why } = score(st.cls, st.rcat, st.solv === 'prot', st.temp);
    const r = ranked(s);
    out.innerHTML = '';
    const comp = competition(s);
    const slow = s[r[0]] <= 1;
    out.append(probCards(s),
      h('div', { class: 'verdict ' + (slow ? 'none' : comp ? 'mix' : r[0].startsWith('e') ? 'sn2' : 'sn1') },
        h('h4', { html: slow ? 'Reação muito lenta nessas condições' : comp ? `Competição provável entre mecanismos (${r.filter((m) => s[m] >= s[r[0]] - 1 && s[m] >= 2).map((m) => MNAME[m]).join(' × ')})` : `${MNAME[r[0]]} é o mecanismo mais provável` }),
        h('ul', { style: 'margin:.4em 0 0;padding-left:18px' }, why.map((w) => h('li', { html: w })))),
      h('p', { class: 'hint', style: 'color:var(--dim);font-size:.8rem' }, 'Níveis qualitativos: tendências gerais. Casos reais podem fugir dessas regras (grupo abandonador, concentração, estrutura específica).'));
  }
  draw();
}

/* ===================================================================
 * Fluxograma por tipo de substrato
 * =================================================================== */
const FLOW = {
  metil: ['CH₃–X', 'Há carbono β? <b>Não</b> → sem eliminação', 'CH₃⁺ instável → sem SN1', '<b class="c-sn2">SN2</b> com nucleófilos (lenta com H₂O/ROH)'],
  prim: ['R–CH₂–X (1°)', 'Base volumosa (t-BuO⁻)? → <b class="c-e2">E2</b>', 'Nucleófilo forte (inclusive HO⁻/RO⁻)? → <b class="c-sn2">SN2</b> predominante (E2 minoritária, maior a quente)', 'Nucleófilo fraco? → reação muito lenta (sem SN1/E1)'],
  sec: ['R₂CH–X (2°)', 'Base forte (HO⁻, RO⁻)? → <b class="c-e2">E2</b> majoritária, SN2 compete', 'Base volumosa? → <b class="c-e2">E2</b>', 'Nucleófilo forte e pouco básico (I⁻, N₃⁻, CN⁻) em aprótico? → <b class="c-sn2">SN2</b>', 'H₂O/ROH, prótico? → <b class="c-sn1">SN1</b> + <b class="c-e1">E1</b> (lentas, rearranjos possíveis; Δ favorece E1)'],
  ter: ['R₃C–X (3°)', 'SN2? <b>Não</b> (impedimento)', 'Base forte? → <b class="c-e2">E2</b>', 'Base/nucleófilo fracos em prótico? → <b class="c-sn1">SN1</b> + <b class="c-e1">E1</b> (Δ → mais E1)'],
};
export function flowchart(host) {
  const stage = h('div');
  host.append(h('div', { class: 'controls' }, seg([['metil', 'metílico'], ['prim', 'primário'], ['sec', 'secundário'], ['ter', 'terciário']], 'sec', (k) => draw(k), 'Substrato')), stage);
  function draw(k) {
    stage.innerHTML = '';
    const f = h('div', { class: 'flowsteps' });
    FLOW[k].forEach((t, i) => { if (i) f.append(h('div', { class: 'ar' }, '↓')); f.append(h('div', { class: 'fs', html: i ? t : `<b style="font-size:1.1rem">${t}</b>` })); });
    stage.append(f);
  }
  draw('sec');
}

/* ===================================================================
 * Estudos de caso
 * =================================================================== */
const CASES = {
  prim: { title: 'Primário: 1-bromobutano', s: () => SKA.bromobutano1(), items: [
    ['CN⁻ / DMSO', 'sn2', 'Nucleófilo forte e base relativamente fraca em solvente aprótico: <b>SN2</b> → pentanonitrila.'],
    ['t-BuO⁻ / t-BuOH', 'e2', 'Base forte e volumosa não consegue atacar o carbono com facilidade, mas remove um Hβ: <b>E2</b> → but-1-eno.'],
  ] },
  sec: { title: 'Secundário — o caso mais difícil: 2-bromobutano', s: () => SKA.bromobutano2(), items: [
    ['NaOEt / EtOH, Δ', 'e2', 'Base forte e pequena: <b>E2 predomina</b> (but-2-eno, E > Z, pela regra de Zaitsev), com algum 2-etoxibutano (SN2).'],
    ['NaCN / DMSO', 'sn2', 'Nucleófilo forte, pouco básico, solvente aprótico: <b>SN2</b> com inversão → 2-metilbutanonitrila.'],
    ['t-BuOK / t-BuOH', 'e2', 'Base volumosa: <b>E2</b>; a proporção de but-1-eno (Hofmann) aumenta.'],
    ['EtOH, Δ (sem base)', 'e1', 'Solvólise lenta via carbocátion secundário: <b>SN1 + E1</b> competem (o aquecimento favorece E1).'],
  ] },
  ter: { title: 'Terciário: brometo de terc-butila', s: () => SKA.tbutil(), items: [
    ['H₂O, 25 °C', 'sn1', 'Solvólise: <b>SN1</b> majoritária (2-metilpropan-2-ol) com <b>E1</b> minoritária (2-metilpropeno).'],
    ['EtOH, Δ', 'e1', 'Carbocátion terciário; aquecimento → mais <b>E1</b> (2-metilpropeno) ao lado do éter (SN1).'],
    ['NaOEt / EtOH', 'e2', 'Base forte: <b>E2</b> → 2-metilpropeno.'],
    ['t-BuOK / t-BuOH', 'e2', '<b>E2</b> → 2-metilpropeno.'],
  ] },
};
export function cases(host) {
  Object.values(CASES).forEach((c) => {
    const out = h('div', { class: 'stepcap' }, 'Escolha as condições.');
    const btns = h('div', { class: 'controls' }, c.items.map(([cond, m, t]) => h('button', { class: 'btn sm', type: 'button', onclick: (e) => { [...btns.children].forEach((b) => b.setAttribute('aria-pressed', b === e.currentTarget)); out.innerHTML = `<span class="chip" style="background:var(--surface-3)"><b class="c-${m}">${MNAME[m]}</b></span> ${t}`; } }, cond)));
    host.append(h('div', { class: 'block', style: 'box-shadow:none;background:var(--surface-2)' }, h('h4', { style: 'margin-top:0' }, c.title),
      h('div', { class: 'split rev' }, h('figure', { class: 'fig' }, mol(c.s(), { scale: 40, zoom: 1.2 })), h('div', null, btns, out))));
  });
  host.append(h('div', { class: 'note key', html: '<b class="t">Conceito-chave</b>Em terciários, <b>SN2 é fortemente desfavorecida</b>; a competição é entre SN1/E1 (base fraca) e E2 (base forte).' }));
}

/* ===================================================================
 * Simulador E2: o estudante escolhe qual Hβ remover
 * =================================================================== */
const SIM_SUBS = {
  bromobutano2: { t: '2-bromobutano', map: { 0: 'h', 2: 'z' }, prod: { z: ['but2enoE', '(E)-but-2-eno + (Z)', 'dissubstituído'], h: ['but1eno', 'but-1-eno', 'monossubstituído'] }, small: [81, 19], bulky: [47, 53], ez: true },
  bromopentano2: { t: '2-bromopentano', map: { 0: 'h', 2: 'z' }, prod: { z: ['pent2enoE', '(E)-pent-2-eno + (Z)', 'dissubstituído'], h: ['pent1eno', 'pent-1-eno', 'monossubstituído'] }, small: [69, 31], bulky: [34, 66], ez: true },
  bromometilbutano: { t: '2-bromo-2-metilbutano', map: { 0: 'h', 4: 'h', 2: 'z' }, prod: { z: ['metilbut2eno', '2-metilbut-2-eno', 'trissubstituído'], h: ['metilbut1eno', '2-metilbut-1-eno', 'dissubstituído'] }, small: [70, 30], bulky: [28, 72] },
  tbutil: { t: 'brometo de terc-butila', map: { 0: 'z', 2: 'z', 3: 'z' }, prod: { z: ['metilpropeno', '2-metilpropeno', 'dissubstituído (1,1)'] }, small: [100], bulky: [100] },
  bromobutano1: { t: '1-bromobutano', map: { 1: 'z' }, prod: { z: ['but1eno', 'but-1-eno', 'monossubstituído'] }, small: [100], bulky: [100], sn2: true },
  bromoetano: { t: 'bromoetano', map: { 1: 'z' }, prod: { z: ['eteno', 'eteno', 'não substituído'] }, small: [100], bulky: [100], sn2: true },
};
const SIM_BASES = { EtO: ['CH₃CH₂O⁻', 'small'], HO: ['HO⁻', 'small'], MeO: ['CH₃O⁻', 'small'], tBuO: ['(CH₃)₃CO⁻', 'bulky'], DBU: ['DBU', 'bulky'] };
export function e2Sim(host) {
  const st = { sub: 'bromobutano2', base: 'EtO', lg: 'Br', solv: 'EtOH' };
  const stage = h('div', { class: 'pick mech' });
  const out = h('div', { 'aria-live': 'polite' });
  const tried = new Set();
  const n = 'sim' + Math.random().toString(36).slice(2, 6);
  host.append(h('div', { class: 'sim-grid' },
    radioGroup('Substrato', n + 's', Object.entries(SIM_SUBS).map(([k, v]) => [k, v.t]), st.sub, (v) => { st.sub = v; build(); }),
    radioGroup('Base', n + 'b', Object.entries(SIM_BASES).map(([k, v]) => [k, v[0], v[1] === 'bulky' ? 'volumosa' : 'pequena']), st.base, (v) => { st.base = v; summary(); }),
    radioGroup('Grupo abandonador', n + 'l', [['Br', 'Br'], ['Cl', 'Cl'], ['I', 'I'], ['OTs', 'OTs (tosilato)']], st.lg, (v) => { st.lg = v; build(); }),
    radioGroup('Solvente', n + 'v', [['EtOH', 'etanol'], ['tBuOH', 't-butanol'], ['DMSO', 'DMSO']], st.solv, (v) => { st.solv = v; summary(); })),
  h('p', { class: 'prompt' }, 'Clique em um hidrogênio β para removê-lo com a base e veja qual alceno se forma.'), stage, out);
  let ex, nodes;
  function build() {
    const key = st.sub;
    ex = EXP[key]();
    if (st.lg !== 'Br') ex.s.atoms[ex.lg][2] = st.lg;
    tried.clear();
    stage.innerHTML = '';
    const r = clickable(ex, { onPick });
    nodes = r.nodes;
    stage.append(r.svg);
    summary();
  }
  function onPick(i, g) {
    const P = SIM_SUBS[st.sub];
    if (!ex.hs.includes(i)) { out.innerHTML = `<div class="fb neutral">Esse átomo é um(a) <b>${whatIs(ex, i)}</b>. Clique em um <b>hidrogênio</b>.</div>`; summary(true); return; }
    if (!ex.betaH.includes(i)) {
      g.classList.add('bad'); setTimeout(() => g.classList.remove('bad'), 900);
      out.innerHTML = `<div class="fb bad">✘ Esse é um <b>${whatIs(ex, i)}</b>. Na eliminação β, o H removido precisa estar no carbono <b>vizinho</b> ao Cα — só assim o par da ligação C–H pode formar a ligação π C=C enquanto o grupo abandonador sai.</div>`;
      summary(true);
      return;
    }
    const pos = ex.carbons.indexOf(ex.parent[i]);
    const which = P.map[pos];
    tried.add(which);
    Object.values(nodes).forEach((x) => x.classList.remove('ok'));
    ex.betaH.filter((hh) => P.map[ex.carbons.indexOf(ex.parent[hh])] === which).forEach((hh) => nodes[hh].classList.add('ok'));
    const [sk, name, sub] = P.prod[which];
    out.innerHTML = '';
    out.append(h('div', { class: 'fb ok' }, h('div', { html: `✔ Removendo esse Hβ forma-se <b>${name}</b> (${sub}). Os H destacados em verde no mesmo carbono β levam ao mesmo produto.${P.ez && which === 'z' ? ' <br>Se o H removido estiver anti ao GA na conformação com os grupos maiores anti, forma-se o isômero <b>E</b> (majoritário); a outra conformação anti dá o <b>Z</b>.' : ''}` }),
      h('figure', { class: 'fig', style: 'margin-top:8px' }, mol(SKA[sk](), { scale: 40, zoom: 1.2 }), h('figcaption', { html: name }))));
    summary(true);
  }
  function summary(keep) {
    const P = SIM_SUBS[st.sub], [bn, size] = SIM_BASES[st.base];
    const pr = P[size];
    const box = h('div', { class: 'block', style: 'box-shadow:none;background:var(--surface-2);margin-top:12px' });
    box.append(h('h4', { style: 'margin-top:0' }, `Comparação dos produtos com ${bn} em ${st.solv === 'tBuOH' ? 't-butanol' : st.solv === 'EtOH' ? 'etanol' : 'DMSO'}`));
    const cards = h('div', { class: 'prodcards' });
    Object.entries(P.prod).forEach(([k, [sk, name, sub]], idx) => {
      const pct = pr[idx];
      const major = pct === Math.max(...pr);
      cards.append(h('div', { class: 'card' + (major ? ' major' : '') }, mol(SKA[sk](), { scale: 30, fs: 14 }), h('b', null, name), h('div', null, h('small', null, sub)),
        h('div', { class: 'pct' }, pr.length > 1 ? `≈ ${pct}%` : 'único alceno'), h('small', { html: (major ? '<b style="color:var(--green)">majoritário</b>' : 'minoritário') + (pr.length > 1 ? (k === 'z' ? ' · Zaitsev' : ' · Hofmann') : '') + (tried.has(k) ? ' · ✔ encontrado' : '') })));
    });
    box.append(cards);
    const notes = [];
    if (P.sn2) notes.push(size === 'small' ? '⚠ Substrato <b>primário</b> com base pequena: a <b>SN2</b> geralmente predomina sobre a E2 (produto de substituição). A E2 só domina com base volumosa.' : 'Com base volumosa, a <b>E2</b> predomina mesmo neste substrato primário.');
    if (pr.length > 1) notes.push(size === 'small' ? 'Base pequena → tendência de <b>Zaitsev</b> (alceno mais substituído).' : 'Base volumosa → aumenta o produto de <b>Hofmann</b> (Hβ mais acessível).');
    notes.push(`Grupo abandonador: ${st.lg === 'OTs' ? 'tosilato, excelente GA (base conjugada de ácido sulfônico forte)' : st.lg + '⁻'} — a velocidade segue aproximadamente <b>OTs ≈ I > Br > Cl</b>; as proporções acima são para Br (aproximadas).`);
    if (st.solv === 'DMSO') notes.push('DMSO (aprótico) não solvata o ânion: a base fica mais reativa e a E2 mais rápida.');
    if ((st.solv === 'tBuOH') !== (st.base === 'tBuO')) notes.push('Na prática usa-se o álcool conjugado da base como solvente (EtO⁻/EtOH, t-BuO⁻/t-BuOH) para evitar troca ácido-base com o solvente.');
    box.append(h('ul', { style: 'margin:0;padding-left:18px' }, notes.map((t) => h('li', { html: t }))));
    if (!keep) out.innerHTML = '';
    const old = host.querySelector('.simsum'); if (old) old.remove();
    box.classList.add('simsum');
    host.append(box);
  }
  build();
}

/* ===================================================================
 * "Monte a reação": análise em 10 pontos
 * =================================================================== */
export function analyzer(host) {
  const st = { sub: 'bromobutano2', reag: 'RO', solv: 'etanol', temp: 'moderada' };
  const n = 'an' + Math.random().toString(36).slice(2, 6);
  const out = h('div', { class: 'analysis', 'aria-live': 'polite' });
  host.append(h('div', { class: 'sim-grid' },
    radioGroup('Substrato', n + 's', Object.entries(SUBS).map(([k, v]) => [k, v.t.replace(/ \(.*\)$/, ''), CLASSES[v.cls].t]), st.sub, (v) => { st.sub = v; }),
    radioGroup('Nucleófilo / base', n + 'r', Object.entries(REAGS).map(([k, v]) => [k, v.t]), st.reag, (v) => { st.reag = v; }),
    radioGroup('Solvente', n + 'v', Object.entries(SOLVS).map(([k, v]) => [k, v.t, v.protic ? 'prótico' : 'aprótico']), st.solv, (v) => { st.solv = v; }),
    radioGroup('Temperatura', n + 't', [['baixa', 'baixa'], ['moderada', 'moderada'], ['alta', 'alta']], st.temp, (v) => { st.temp = v; })),
  h('div', { class: 'controls' }, h('button', { class: 'btn primary lg', type: 'button', onclick: () => run() }, '🔬 Analisar reação')), out);
  function run() {
    const A = analyze(st.sub, st.reag, st.solv, st.temp);
    out.innerHTML = '';
    const step = (n2, t, html) => h('div', { class: 'astep' }, h('h5', null, h('span', { class: 'n' }, String(n2)), t), h('div', { html }));
    A.points.forEach(([t, x], i) => out.append(step(i + 1, t, x)));
    const others = A.r.slice(1).filter((m) => A.s[m] >= 1);
    out.append(step(8, 'Mecanismo mais provável', A.slow ? 'Nenhum mecanismo é favorecido: <b>reação muito lenta</b> nessas condições.' : `<b class="c-${A.top}" style="font-size:1.2rem">${MNAME[A.top]}</b> — ${LEVELS[A.s[A.top]]}.`));
    out.append(step(9, 'Mecanismos concorrentes', (A.comp ? '<b>Competição provável entre mecanismos.</b> ' : '') + (others.length ? others.map((m) => `<b class="c-${m}">${MNAME[m]}</b> (${LEVELS[A.s[m]]})`).join(', ') : 'nenhum relevante')));
    out.append(step(10, 'Produto principal', A.slow ? '—' : `<b style="color:var(--green)">${A.prodOf(A.top)}</b>` + (A.comp && A.s[A.r[1]] >= 2 ? `<br>Produto do concorrente (${MNAME[A.r[1]]}): ${A.prodOf(A.r[1])}` : '')));
    out.append(probCards(A.s), h('div', { class: 'verdict mix' }, h('h4', null, 'Justificativa'), h('ul', { style: 'margin:0;padding-left:18px' }, A.why.map((w) => h('li', { html: w })))));
  }
  run();
}
