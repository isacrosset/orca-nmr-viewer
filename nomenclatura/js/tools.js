/*
 * tools.js — simulador de nomenclatura (8 etapas), construtor molecular
 * (nome → estrutura), estrutura → nome, laboratório 3D, 3D↔2D,
 * tabela-resumo e guia rápido.
 */
import { h, shuffle, seg, tgl } from './widgets2d.js';
import { el as svgEl } from './chem2d.js';
import { M, CAT, REAL, ALL } from './lib.js';
import { FG_INFO, FUNCTIONS, bondOrder, fromGraph, valenceIssues, sameMolecule, findFG, formula } from './chem.js';
import { STEM, PRIO, PRIO_NAME, rankParents, whyBetter, nameMolecule, nameMatches, normName } from './namer.js';
import { layout, drawSVG } from './depict.js';
import { decoy, draw, fig, pickable, nameHTML, explain, roles, view3d, vbox, cls, fgSet, funcList, ROLE_LEGEND, legend, FGCOL, hex, SUFX, PREFX, pickN, rnd, splitName } from './core.js';
import { judgeChain, FN_GROUPS } from './modules.js';
import { embed, torsions, applyTorsions } from './embed3d.js';

const fb = (c, html) => h('div', { class: 'fb ' + c, html });
const clear = (e) => { while (e.firstChild) e.removeChild(e.firstChild); return e; };
const sel = (opts, cur, on, label) => { const s = h('select', { 'aria-label': label || 'escolha' }, opts.map(([v, t]) => h('option', { value: v }, t))); s.value = cur; s.addEventListener('change', () => on(s.value)); return s; };

/* ===================================================================
 * Diagnóstico de nomes digitados (feedback inteligente)
 * =================================================================== */
export function diagnose(X, typed) {
  const r = X.r, t = normName(typed || '');
  if (!t) return { ok: false, msg: 'Digite um nome.' };
  if (nameMatches(r, typed)) return { ok: true, msg: '✔ Nome correto!' + (normName(r.name) !== t ? ` (forma recomendada: <b>${r.name}</b>)` : '') };
  const N = normName(r.name), cands = [N, ...(r.aliases || []).map(normName)];
  const letters = (s) => s.replace(/[\d,\-() ]/g, '');
  const digits = (s) => (s.match(/\d+/g) || []).join(',');
  const punct = (s) => s.replace(/[,\- ()]/g, '');
  if (cands.some((c) => punct(c) === punct(t))) return { ok: false, msg: 'Quase! Só a <b>pontuação</b> está errada: vírgula entre números (2,3), hífen entre número e letra (2-metil), e hífen antes de h (3-metil-hexano).' };
  if (cands.some((c) => letters(c) === letters(t) && digits(c) !== digits(t))) return { ok: false, msg: 'As partes do nome estão certas, mas os <b>localizadores</b> não. Verifique a cadeia principal e o sentido da numeração (menor localizador primeiro ao grupo principal, depois às insaturações e aos substituintes).' };
  const sortL = (s) => s.split(/[-\s]/).map(letters).filter(Boolean).sort().join('');
  if (cands.some((c) => sortL(c) === sortL(t))) return { ok: false, msg: 'Os prefixos estão fora de <b>ordem alfabética</b> (ignore di, tri, tetra, sec e terc ao ordenar).' };
  const n = r.parent.P.length;
  if (!r.arom && !t.includes(STEM[n])) return { ok: false, msg: `Confira a <b>cadeia principal</b>: ela deveria ter ${n} carbonos (prefixo <b>${STEM[n]}</b>).` };
  if (r.princType) { const suf = { acido: 'oico', ester: 'oato', amida: 'amida', nitrila: 'nitrila', aldeido: 'al', cetona: 'ona', alcool: 'ol', amina: 'amina' }[r.princType]; if (!t.includes(suf)) return { ok: false, msg: `A função principal é <b>${PRIO_NAME[r.princType]}</b>: o nome deve conter o sufixo <b>${SUFX[r.princType]}</b>.` }; }
  else if (/(ol|al|ona|oico|amina)$/.test(t)) return { ok: false, msg: 'Não há função que vá para o sufixo: halogênios, nitro e alcóxi são sempre <b>prefixos</b>; hidrocarbonetos terminam em -ano/-eno/-ino.' };
  if (r.parent.dl.length && !/en/.test(t)) return { ok: false, msg: 'Falta indicar a <b>ligação dupla</b> (infixo -en-).' };
  if (r.parent.tl.length && !/in/.test(t)) return { ok: false, msg: 'Falta indicar a <b>ligação tripla</b> (infixo -in-).' };
  const subs = r.subs.concat(r.nsubs || []).map((s) => s.name.replace(/[()]/g, ''));
  const miss = subs.find((s) => !t.includes(normName(s)) && !(r.subs.find((x) => x.name === s)?.alias || []).some((a) => t.includes(normName(a))));
  if (miss) return { ok: false, msg: `Falta (ou está errado) o substituinte <b>${miss}</b>.` };
  if (subs.length > 1 && /(^|-)(di|tri|tetra)/.test(N) && !/(di|tri|tetra)/.test(t)) return { ok: false, msg: 'Grupos iguais devem ser reunidos com <b>di-, tri-, tetra-</b>.' };
  return { ok: false, msg: 'Ainda não. Revise as etapas: função principal → cadeia → numeração → substituintes → ordem alfabética.' };
}

/* distratores plausíveis para múltipla escolha de nomes */
export function distractors(X, k = 3) {
  const out = new Set(), name = X.name, r = X.r, n = r.parent.P.length;
  if (!r.isRing) { const rev = name.replace(/\d+/g, (d) => (+d <= n ? String(n + 1 - +d) : d)); if (rev !== name) out.add(rev.replace(/(\d+),(\d+)/g, (m0, a, b) => [+a, +b].sort((x, y) => x - y).join(','))); }
  if (r.parts.prefixes.length >= 2) out.add(r.parts.prefixes.slice().reverse().join('-') + name.slice(r.parts.prefixes.join('-').length));
  if (!r.arom && STEM[n + 1] && n > 1) out.add(name.replace(new RegExp(STEM[n] + '(?=an|en|in|-)'), STEM[n - 1] || STEM[n + 1]));
  const iso = ALL.filter((s) => s !== X.smi && M(s).name && M(s).formula === X.formula).map((s) => M(s).name);
  iso.forEach((x) => out.add(x));
  const swap = [['-ol', '-al'], ['ona', 'al'], ['an', 'en'], ['ano', 'eno']];
  swap.forEach(([a, b]) => { if (name.includes(a)) out.add(name.replace(a, b)); });
  out.delete(name); (r.aliases || []).forEach((a) => out.delete(a));
  return shuffle([...out].filter((x) => x && !nameMatches(r, x))).slice(0, k);
}

/* ===================================================================
 * 33. Simulador de nomenclatura — 8 etapas
 * =================================================================== */
const SIMSET = ['CC(O)C(C)CC', 'CCC(CC)C(C)C', 'C=CC(C)CC', 'CC(C)CC(=O)C', 'CC(Cl)CC(C)C', 'CC#CC(C)C', 'OCC(CC)CC', 'CC(C)C(C)CC=O', 'CC(O)CC(=O)O', 'CC(C)CC(C)(C)O', 'CC(N)CC(C)C', 'CCC(C)(Br)CC'];
const STEPS8 = ['Marcar o grupo funcional', 'Escolher a função principal', 'Selecionar a cadeia principal', 'Escolher o sentido da numeração', 'Marcar as insaturações', 'Identificar os substituintes', 'Nomear os substituintes', 'Montar o nome'];
export function nameSim(host) {
  let smi = SIMSET[0], step = 0, done = [];
  const tl = h('div', { class: 'timeline' }), stage = h('div', { class: 'simstage' }), out = h('div', { 'aria-live': 'polite' }), pane = h('div');
  STEPS8.forEach((t, i) => tl.append(h('button', { type: 'button', disabled: true }, h('b', null, String(i + 1)), ' ' + t)));
  const setStep = (k) => { step = k; [...tl.children].forEach((b, i) => { b.classList.toggle('on', i === k); b.disabled = i > Math.max(...done, -1) + 1; b.onclick = () => { if (!b.disabled) setStep(i); }; }); out.innerHTML = ''; render(); };
  const ok = (msg) => { if (!done.includes(step)) done.push(step); out.replaceChildren(fb('ok', msg), h('button', { class: 'btn primary sm', type: 'button', onclick: () => setStep(Math.min(7, step + 1)) }, step < 7 ? 'Próxima etapa ▶' : 'Concluído')); [...tl.children].forEach((b, i) => { b.disabled = i > Math.max(...done) + 1; }); };
  const bad = (msg) => out.replaceChildren(fb('bad', msg));
  function render() {
    const X = M(smi), m = X.m, r = X.r, best = rankParents(m)[0];
    clear(stage); clear(pane);
    const groups = X.fgs.filter((f) => FUNCTIONS.includes(f.type));
    if (step === 0) {
      const found = new Set();
      const redraw = () => {
        const svg = draw(X, { color: 'fg', only: groups.filter((_, i) => found.has(i)).map((g) => g.type).concat(['__']), scale: 50, fs: 19, zoom: 1.4 });
        clear(stage).append(h('div', { class: 'pick' }, svg));
        pickable(svg, m.atoms.map((_, i) => i), (i) => {
          const gi = groups.findIndex((f) => fgSet(f).has(i) && (m.atoms[i].el !== 'C' || f.site === i && ['acido', 'ester', 'amida', 'aldeido', 'cetona', 'nitrila'].includes(f.type)));
          if (gi < 0) { bad(m.atoms[i].el === 'C' ? 'Esse carbono pertence ao esqueleto de carbonos. Grupos funcionais envolvem heteroátomos (O, N, halogênios) ou a carbonila.' : 'Esse átomo não forma um grupo funcional.'); return; }
          found.add(gi); redraw();
          if (found.size === groups.length) ok(`Grupos encontrados: ${groups.map((g) => FG_INFO[g.type].n).join(', ')}.`); else out.replaceChildren(fb('neutral', `✔ ${FG_INFO[groups[gi].type].n}. Há mais ${groups.length - found.size} grupo(s).`));
        });
      };
      if (groups.length) { pane.append(h('p', { class: 'prompt' }, 'Clique em um átomo de cada grupo funcional.')); redraw(); }
      else { stage.append(h('div', { class: 'figs' }, draw(X, { scale: 50 }))); pane.append(h('p', { class: 'prompt' }, 'Há algum grupo funcional?'), h('div', { class: 'ch-answers' }, h('button', { class: 'btn', type: 'button', onclick: () => ok(X.fgs.some((f) => f.type === 'alceno' || f.type === 'alcino') ? 'Correto: hidrocarboneto. A ligação múltipla C=C/C≡C é indicada pelo infixo (en/in).' : 'Correto: é um alcano — só C e H, ligações simples.') }, 'Não: é um hidrocarboneto'), h('button', { class: 'btn', type: 'button', onclick: () => bad('Observe: só há C e H. C=C e C≡C não são “grupos funcionais” para o sufixo — viram o infixo en/in.') }, 'Sim'))); }
    }
    if (step === 1) {
      stage.append(h('div', { class: 'figs' }, draw(X, { color: 'fg', scale: 50 })));
      const types = [...new Set(groups.map((g) => cls(g.type)))];
      const opts = [...new Set([...types.filter((t) => PRIO.includes(t)), ...types.filter((t) => !PRIO.includes(t))])];
      pane.append(h('p', { class: 'prompt' }, 'Qual função vai para o SUFIXO?'), h('div', { class: 'ch-answers' }, opts.map((t) => h('button', { class: 'btn', type: 'button', onclick: () => {
        if (t === r.princType) ok(`Correto: ${PRIO_NAME[t]} → sufixo ${SUFX[t]}.` + (types.length > 1 ? ' As outras funções viram prefixos.' : ''));
        else if (!PRIO.includes(t)) bad(`${FG_INFO[t].n} nunca vai para o sufixo: é sempre prefixo (${PREFX[t] || ''}).`);
        else bad(`${PRIO_NAME[t]} tem prioridade menor que ${PRIO_NAME[r.princType]} (veja a tabela de prioridade).`);
      } }, PRIO_NAME[t] || FG_INFO[t].n)), h('button', { class: 'btn', type: 'button', onclick: () => (r.princType ? bad(`Há uma função que vai ao sufixo: ${PRIO_NAME[r.princType]}.`) : ok('Correto: nenhuma função vai ao sufixo; o nome termina em -o (ano/eno/ino).')) }, 'nenhuma (sufixo -o)')));
    }
    if (step === 2) {
      const chosen = [];
      const redraw = () => {
        const bondCls = {};
        for (let i = 0; i < chosen.length; i++) for (let j = i + 1; j < chosen.length; j++) if (bondOrder(m, chosen[i], chosen[j])) bondCls[Math.min(chosen[i], chosen[j]) + '-' + Math.max(chosen[i], chosen[j])] = 'mc';
        const svg = draw(X, { scale: 50, fs: 19, zoom: 1.4, bondCls, color: null, P2: decoy(X), hl: Object.fromEntries(X.fgs.filter((f) => cls(f.type) === r.princType).flatMap((f) => f.atoms.filter((a) => m.atoms[a].el !== 'C').map((a) => [a, 'fg']))) });
        clear(stage).append(h('div', { class: 'pick' }, svg));
        const P = pickable(svg, m.atoms.map((_, i) => i).filter((i) => m.atoms[i].el === 'C'), (i) => { const p = chosen.indexOf(i); if (p >= 0) chosen.splice(p, 1); else chosen.push(i); redraw(); out.innerHTML = ''; });
        chosen.forEach((i) => P.set(i, 'on'));
      };
      redraw();
      pane.append(h('p', { class: 'prompt' }, 'Clique nos carbonos da cadeia principal.'), h('div', { class: 'ex-actions' }, h('button', { class: 'btn primary', type: 'button', onclick: () => { const res = judgeChain(X, chosen, best); if (res.classList.contains('ok')) ok(res.innerHTML); else out.replaceChildren(res); } }, 'Conferir cadeia'), h('button', { class: 'btn', type: 'button', onclick: () => { chosen.length = 0; best.P.forEach((x) => chosen.push(x)); redraw(); } }, 'Mostrar')));
    }
    if (step === 3) {
      const all = rankParents(m), rev = all.find((e) => e.P.length === best.P.length && e.P.every((x, q) => x === best.P[best.P.length - 1 - q]));
      const cards = shuffle([[best, true], [rev || best, !rev]]);
      stage.append(h('div', { class: 'cmp2' }, cards.map(([e, good], k) => {
        const num = {}; e.P.forEach((a, i) => { num[a] = i + 1; });
        return h('button', { class: 'chcard choice', type: 'button', onclick: () => {
          if (good || e === best) ok(`Correto! ${rev ? whyBetter(best, rev)?.txt || '' : ''}`.replace('Correto! ', 'Correto! A numeração escolhida ') + '.');
          else { const w = whyBetter(best, e); bad(`Não: a outra numeração ${w ? w.txt : 'é melhor'}. Compare os conjuntos termo a termo (primeiro ponto de diferença), não a soma.`); }
        } }, h('h4', null, `Numeração ${k + 1}`), draw(X, { scale: 38, num, color: 'chain' }), h('div', { class: 'locs', html: [e.pl.length ? `grupo principal {${e.pl}}` : '', e.ml.length ? `múltiplas {${e.ml}}` : '', e.sl.length ? `substituintes {${e.sl}}` : ''].filter(Boolean).join(' · ') || '—' }));
      })));
      pane.append(h('p', { class: 'prompt' }, 'Qual numeração está correta? Clique no cartão.'));
    }
    if (step === 4) {
      stage.append(h('div', { class: 'figs' }, draw(X, { scale: 46, num: true, color: 'chain' })));
      const truth = r.parent.ml.length ? (r.parent.dl.length ? 'dupla em ' + r.parent.dl.join(',') : '') + (r.parent.dl.length && r.parent.tl.length ? ' e ' : '') + (r.parent.tl.length ? 'tripla em ' + r.parent.tl.join(',') : '') : 'nenhuma (só ligações simples na cadeia)';
      const n = best.P.length, wrong = new Set();
      if (r.parent.ml.length) { wrong.add('nenhuma (só ligações simples na cadeia)'); const l = r.parent.ml[0]; wrong.add((r.parent.dl.length ? 'dupla' : 'tripla') + ' em ' + (n - l)); wrong.add((r.parent.dl.length ? 'tripla' : 'dupla') + ' em ' + l); }
      else { wrong.add('dupla em 1'); wrong.add('dupla em 2'); }
      wrong.delete(truth);
      pane.append(h('p', { class: 'prompt' }, 'Quais insaturações (C=C, C≡C) existem na cadeia principal e onde?'), h('div', { class: 'ch-answers' }, shuffle([truth, ...[...wrong].slice(0, 2)]).map((t) => h('button', { class: 'btn', type: 'button', onclick: () => (t === truth ? ok(`Correto: ${truth}. O localizador é o do <b>primeiro</b> carbono da ligação.`) : bad('Não. Lembre-se: o localizador da ligação múltipla é o menor número dos dois carbonos que ela une.')) }, t))));
    }
    if (step === 5) {
      const subs = r.subs.concat(r.nsubs || []);
      const found = new Set();
      const redraw = () => {
        const svg = draw(X, { scale: 50, fs: 19, zoom: 1.4, color: 'chain', num: true, hl: Object.fromEntries(subs.filter((_, i) => found.has(i)).flatMap((s) => s.atoms.map((a) => [a, 'sub']))), bondCls: Object.fromEntries(subs.filter((_, i) => found.has(i)).flatMap((s) => m.bonds.filter((b) => s.atoms.includes(b.a) || s.atoms.includes(b.b)).filter((b) => !(best.P.includes(b.a) && best.P.includes(b.b))).map((b) => [Math.min(b.a, b.b) + '-' + Math.max(b.a, b.b), 'sub']))) });
        clear(stage).append(h('div', { class: 'pick' }, svg));
        pickable(svg, m.atoms.map((_, i) => i), (i) => {
          const si = subs.findIndex((s) => s.atoms.includes(i));
          if (si < 0) { bad(best.P.includes(i) ? 'Esse átomo está na cadeia principal (ciano). Substituintes são os ramos que saem dela.' : 'Esse átomo pertence ao grupo principal (sufixo), não é substituinte.'); return; }
          found.add(si); redraw();
          if (found.size === subs.length) ok(`Substituintes: ${subs.map((s) => 'C' + s.loc).join(', ')}.`); else out.replaceChildren(fb('neutral', `✔ Substituinte em ${subs[si].loc === 'N' ? 'N' : 'C' + subs[si].loc}. Faltam ${subs.length - found.size}.`));
        });
      };
      if (subs.length) { pane.append(h('p', { class: 'prompt' }, 'Clique em cada substituinte (ramo ou grupo-prefixo).')); redraw(); }
      else { stage.append(h('div', { class: 'figs' }, draw(X, { scale: 46, num: true, color: 'roles' }))); pane.append(h('p', { class: 'prompt' }, 'Não há substituintes nesta molécula.'), h('button', { class: 'btn primary', type: 'button', onclick: () => ok('Correto: sem substituintes.') }, 'Confirmar')); }
    }
    if (step === 6) {
      stage.append(h('div', { class: 'figs' }, draw(X, { scale: 46, num: true, color: 'roles' })));
      const subs = r.subs.concat(r.nsubs || []);
      if (!subs.length) { pane.append(h('p', null, 'Nada a nomear.'), h('button', { class: 'btn primary', type: 'button', onclick: () => ok('Sem substituintes.') }, 'Continuar')); }
      else {
        const NAMES = ['metil', 'etil', 'propil', 'propan-2-il', 'butil', 'terc-butil', 'cloro', 'bromo', 'fluoro', 'iodo', 'hidroxi', 'oxo', 'amino', 'metoxi', 'nitro'];
        const rows = subs.map((s) => { const se = h('select', { 'aria-label': 'nome do substituinte' }, h('option', { value: '' }, '…'), [...new Set([...NAMES, s.name])].map((n) => h('option', { value: n }, n))); return { s, se, row: h('label', null, `em ${s.loc === 'N' ? 'N' : 'C' + s.loc}`, se) }; });
        pane.append(h('div', { class: 'qgrid' }, rows.map((x) => x.row)), h('button', { class: 'btn primary', type: 'button', onclick: () => {
          const wrong = rows.filter((x) => x.se.value !== x.s.name && !(x.s.alias || []).includes(x.se.value));
          rows.forEach((x) => { x.se.className = wrong.includes(x) ? 'bad' : 'ok'; });
          if (!wrong.length) ok('Correto! ' + subs.map((s) => s.name).join(', ') + '.'); else bad(wrong.map((x) => { const v = x.se.value; return v === 'hidroxi' || v === 'oxo' || v === 'amino' ? `Em ${x.s.loc}: ${v}- só se usa quando essa função NÃO é a principal.` : `Em ${x.s.loc}: conte os carbonos do ramo (1 C = metil, 2 C = etil, 3 C = propil…).`; }).join(' '));
        } }, 'Conferir'));
      }
    }
    if (step === 7) {
      stage.append(h('div', { class: 'figs' }, draw(X, { scale: 46, num: true, color: 'roles' })));
      const n = r.parent.P.length, flip = (t) => t.replace(/\d+/g, (d) => String(n + 1 - +d));
      const pieces = splitName(X).flatMap((p) => (p.c === 'p-pre' ? r.parts.prefixes.map((x) => ({ t: x, c: 'p-pre' })) : [p])).filter((p, i, a) => p.t.trim() && a.findIndex((q) => q.t === p.t) === i);
      const extra = [];
      pieces.forEach((p) => { if (/\d/.test(p.t) && flip(p.t) !== p.t && !r.arom) extra.push({ t: flip(p.t), c: '' }); });
      if (!r.arom && STEM[n + 1]) extra.push({ t: STEM[n + 1], c: '' });
      if (!r.parent.ml.length && !r.arom) extra.push({ t: 'en', c: '' });
      const inp = h('input', { type: 'text', class: 'nameinp', 'aria-label': 'nome', placeholder: 'digite ou clique nas peças', autocomplete: 'off', spellcheck: 'false' });
      const tiles = h('div', { class: 'tiles' }, shuffle(pieces.concat(extra.filter((e, i, a) => !pieces.some((p) => p.t === e.t) && a.findIndex((q) => q.t === e.t) === i))).map((p) => h('button', { type: 'button', onclick: () => { const v = inp.value; const pre = p.c === 'p-pre' && v && !/[-\s]$/.test(v) && !/^\(/.test(p.t) ? '-' : /[a-z]$/.test(v) && /^h/.test(p.t) ? '-' : ''; inp.value = v + pre + p.t; } }, p.t)));
      const check = () => { const d = diagnose(X, inp.value); if (d.ok) ok(d.msg + ' ' + nameHTML(X)); else bad(d.msg); };
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') check(); });
      pane.append(h('p', { class: 'prompt' }, 'Monte o nome: prefixos (ordem alfabética) + cadeia + insaturação + sufixo.'), tiles, h('div', { class: 'controls' }, inp, h('button', { class: 'btn primary', type: 'button', onclick: check }, 'Conferir'), h('button', { class: 'btn', type: 'button', onclick: () => { inp.value = ''; } }, 'Limpar'), h('button', { class: 'btn', type: 'button', onclick: () => out.replaceChildren(fb('neutral', h('ol', null, explain(X).map((t) => h('li', { html: t }))).outerHTML)) }, 'Ver resolução')));
    }
  }
  host.append(h('div', { class: 'controls' }, h('label', null, 'Molécula: ', sel(SIMSET.map((s) => [s, `${SIMSET.indexOf(s) + 1}. ${M(s).formula}`]), smi, (x) => { smi = x; done = []; setStep(0); })), h('button', { class: 'btn', type: 'button', onclick: () => { smi = rnd(SIMSET.filter((s) => s !== smi)); host.querySelector('select').value = smi; done = []; setStep(0); } }, '🎲 Sortear')), tl, h('div', { class: 'simgrid' }, stage, h('div', null, pane, out)), ROLE_LEGEND());
  setStep(0);
}

/* ===================================================================
 * 30. Construtor molecular (nome → estrutura)
 * =================================================================== */
const GROUPS = {
  CH3: { t: '–CH₃', a: [['C']], b: [] }, C2H5: { t: '–CH₂CH₃', a: [['C'], ['C']], b: [[0, 1, 1]] }, iPr: { t: '–CH(CH₃)₂', a: [['C'], ['C'], ['C']], b: [[0, 1, 1], [0, 2, 1]] },
  OH: { t: '–OH', a: [['O']], b: [] }, O2: { t: '=O', a: [['O']], b: [], o: 2 }, NH2: { t: '–NH₂', a: [['N']], b: [] }, N3: { t: '≡N', a: [['N']], b: [], o: 3 },
  F: { t: '–F', a: [['F']], b: [] }, Cl: { t: '–Cl', a: [['Cl']], b: [] }, Br: { t: '–Br', a: [['Br']], b: [] }, I: { t: '–I', a: [['I']], b: [] },
  OMe: { t: '–OCH₃', a: [['O'], ['C']], b: [[0, 1, 1]] }, NO2: { t: '–NO₂', a: [['N', 1, 0], ['O', 0, 0], ['O', -1, 0]], b: [[0, 1, 2], [0, 2, 1]] },
};
export const TARGETS = [
  ['3-metilpentan-2-ol', 'CC(O)C(C)CC'], ['2-metilbutano', 'CCC(C)C'], ['pent-2-eno', 'CCC=CC'], ['but-1-ino', 'C#CCC'], ['2,3-dimetilbutano', 'CC(C)C(C)C'], ['3-etil-2-metil-hexano', 'CCCC(CC)C(C)C'],
  ['ácido 2-metilpropanoico', 'CC(C)C(=O)O'], ['butanal', 'CCCC=O'], ['pentan-3-ona', 'CCC(=O)CC'], ['2-cloropropano', 'CC(Cl)C'], ['propan-1-amina', 'CCCN'], ['2-metilbut-2-eno', 'CC=C(C)C'],
  ['4-metilpent-1-ino', 'C#CCC(C)C'], ['butanonitrila', 'CCCC#N'], ['1-nitropropano', 'CCC[N+](=O)[O-]'], ['2-metoxipropano', 'COC(C)C'], ['4-hidroxipentan-2-ona', 'CC(O)CC(C)=O'], ['3-bromo-2-metilpentano', 'CCC(Br)C(C)C'], ['hexa-1,3-dieno', 'C=CC=CCC'], ['butanamida', 'CCCC(N)=O'],
];
export function builder(host, o = {}) {
  let n = 5, bo = [], subs = [], selC = null, target = o.free ? null : TARGETS[0];
  const wrap = h('div', { class: 'pick bwrap' }), out = h('div', { 'aria-live': 'polite' }), warn = h('div', { 'aria-live': 'polite' }), live = h('div', { class: 'readout' }), v3 = h('div');
  const reset = () => { bo = Array(9).fill(1); subs = Array.from({ length: 10 }, () => []); selC = null; };
  reset();
  const build = () => {
    const atoms = [], bonds = [];
    for (let i = 0; i < n; i++) atoms.push({ el: 'C' });
    for (let i = 0; i < n - 1; i++) bonds.push({ a: i, b: i + 1, o: bo[i] });
    for (let i = 0; i < n; i++) subs[i].forEach((g) => { const G = GROUPS[g], base = atoms.length; G.a.forEach(([el, ch, hx]) => atoms.push({ el, charge: ch || 0, hx: hx === undefined ? undefined : hx })); bonds.push({ a: i, b: base, o: G.o || 1 }); G.b.forEach(([x, y, oo]) => bonds.push({ a: base + x, b: base + y, o: oo })); });
    const m = fromGraph(atoms, bonds);
    return m;
  };
  const render = () => {
    const m = build(), path = [...Array(n).keys()], P2 = layout(m, path);
    const issues = valenceIssues(m);
    const hl = {}; issues.forEach((x) => { hl[x.i] = 'bad'; });
    const num = {}; path.forEach((i) => { num[i] = i + 1; });
    const bondCls = {}; for (let i = 0; i < n - 1; i++) bondCls[i + '-' + (i + 1)] = 'mc';
    const svg = drawSVG(m, P2, { scale: 54, fs: 19, zoom: 1.45, num, hl, bondCls, halo: selC !== null ? { [selC]: 'g' } : {}, lab: Object.fromEntries(issues.filter((x) => m.atoms[x.i].el === 'C').map((x) => [x.i, 'C'])) });
    clear(wrap).append(svg);
    const C = svg._chem, g = svgEl('g', { transform: C.transform }, svg);
    // ligações clicáveis (alternam simples → dupla → tripla)
    for (let i = 0; i < n - 1; i++) {
      const A = C.atoms[i], B = C.atoms[i + 1];
      const gg = svgEl('g', { class: 'pk bondpk', tabindex: 0, role: 'button', 'aria-label': `ligação C${i + 1}–C${i + 2}: clique para mudar a ordem` }, g);
      svgEl('ellipse', { cx: (A.x + B.x) / 2, cy: (A.y + B.y) / 2, rx: 12, ry: 12 }, gg);
      const f = (e) => { e.preventDefault(); bo[i] = bo[i] % 3 + 1; render(); };
      gg.addEventListener('click', f); gg.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') f(e); });
    }
    pickable(svg, path, (i) => { selC = selC === i ? null : i; render(); }, { label: (i) => 'carbono ' + (i + 1) });
    warn.replaceChildren(...issues.map((x) => fb('bad', `⚠ ${x.i < n ? 'C' + (x.i + 1) : 'átomo'}: ${x.msg}`)));
    palette.querySelectorAll('button[data-g]').forEach((b) => { b.disabled = selC === null; });
    selInfo.textContent = selC === null ? 'Selecione um carbono da cadeia para adicionar grupos.' : `C${selC + 1} selecionado: ${subs[selC].length ? subs[selC].map((g) => GROUPS[g].t).join(', ') : 'sem grupos'}`;
    if (!issues.length) { const r = nameMolecule(m); live.innerHTML = `<span><b>Fórmula:</b> ${formula(m)}</span>` + (o.free || o.showName ? `<span><b>Nome da sua estrutura:</b> ${r.ok ? r.name : 'fora do escopo do construtor'}</span>` : ''); }
    else live.innerHTML = '<span class="status-bad">Corrija a valência para continuar.</span>';
    return m;
  };
  const palette = h('div', { class: 'tiles' }, Object.entries(GROUPS).map(([k, G]) => h('button', { type: 'button', 'data-g': k, disabled: true, onclick: () => { if (selC === null) return; subs[selC].push(k); out.innerHTML = ''; render(); } }, G.t)),
    h('button', { type: 'button', class: 'del', onclick: () => { if (selC !== null) { subs[selC] = []; render(); } } }, '✕ remover grupos do C'));
  const selInfo = h('div', { class: 'hint3' });
  const nIn = h('input', { type: 'range', min: 1, max: 10, value: n, 'aria-label': 'carbonos na cadeia' }), nV = h('span', { class: 'val' }, String(n));
  nIn.addEventListener('input', () => { n = +nIn.value; nV.textContent = n; if (selC !== null && selC >= n) selC = null; for (let i = n; i < 10; i++) subs[i] = []; render(); });
  const tgtBox = h('div', { class: 'tgt' });
  const setTarget = (t) => { target = t; reset(); n = 4; nIn.value = n; nV.textContent = n; tgtBox.innerHTML = target ? `Construa: <b class="bigname">${target[0]}</b>` : '<b>Modo livre:</b> monte qualquer estrutura — a aplicação mostra o nome IUPAC.'; out.innerHTML = ''; clear(v3); render(); };
  const check = () => {
    const m = render();
    if (valenceIssues(m).length) { out.replaceChildren(fb('bad', 'Há erros de valência (átomos em vermelho).')); return; }
    const T = M(target[1]);
    if (sameMolecule(m, T.m)) {
      out.replaceChildren(fb('ok', `✔ Estrutura correta: ${nameHTML(T)}. Veja o modelo 3D gerado a partir dela.`));
      clear(v3); const v = vbox('short'); v3.append(v); view3d(v, T, { color: 'roles', numbers: true });
      return;
    }
    const r = nameMolecule(m);
    const hint = formula(m) !== T.formula ? `A fórmula da sua estrutura é ${formula(m)}; a do alvo é ${T.formula}. ` : 'Mesma fórmula, mas outra conectividade (isômero). ';
    out.replaceChildren(fb('bad', `✘ ${hint}${r.ok ? `Sua estrutura se chama <b>${r.name}</b>. ` : ''}Releia o nome: cadeia (${STEM[T.r.parent.P.length]} = ${T.r.parent.P.length} C), localizadores e grupos.`));
  };
  host.append(...[
    o.free ? null : h('div', { class: 'controls' }, h('label', null, 'Alvo: ', sel(TARGETS.map((t, i) => [String(i), t[0]]), '0', (i) => setTarget(TARGETS[+i]))), h('button', { class: 'btn', type: 'button', onclick: () => setTarget(null) }, 'Modo livre')),
    tgtBox,
    h('div', { class: 'range-row' }, h('span', null, 'Carbonos na cadeia'), nIn, nV),
    h('p', { class: 'hint3' }, 'Clique numa ligação da cadeia para alternar simples → dupla → tripla. Clique num carbono e escolha grupos na paleta.'),
    wrap, selInfo, palette, warn, live,
    o.free ? null : h('div', { class: 'ex-actions' }, h('button', { class: 'btn primary', type: 'button', onclick: () => (target ? check() : null) }, 'Conferir estrutura'), h('button', { class: 'btn', type: 'button', onclick: () => { reset(); render(); out.innerHTML = ''; clear(v3); } }, 'Recomeçar'), h('button', { class: 'btn', type: 'button', onclick: () => { if (!target) return; clear(out).append(h('div', { class: 'figs' }, fig(target[1], nameHTML(M(target[1])), { color: 'roles', num: true }))); } }, 'Ver resposta')),
    out, v3].filter(Boolean));
  setTarget(o.free ? null : TARGETS[0]);
}

export function nameToStructMC(host) {
  const list = shuffle(TARGETS).slice(0, 6);
  list.forEach(([nm, s], k) => {
    const X = M(s), iso = ALL.filter((x) => x !== s && M(x).formula === X.formula && M(x).name);
    const wrongs = shuffle(iso).slice(0, 3);
    while (wrongs.length < 3) { const y = rnd(ALL); if (y !== s && !wrongs.includes(y) && M(y).name) wrongs.push(y); }
    const opts = [s, ...wrongs];
    host.append(exerciseCardStruct(nm, opts, X, k));
  });
}
import { exerciseCard } from './practice.js';
function exerciseCardStruct(nm, opts, X, k) {
  return exerciseCard({ title: 'Nome → estrutura', type: 'mc', struct: true, q: `Qual estrutura corresponde a <b>${nm}</b>?`, o: opts.map((s) => ({ svg: () => draw(s, { scale: 28, fs: 13 }) })), a: 0, e: explain(X).join('<br>') }, 'NE' + (k + 1));
}

/* ===================================================================
 * 31. Estrutura → nome
 * =================================================================== */
export function structToName(host) {
  const pool = shuffle(ALL.filter((s) => M(s).name && !/ácido benzoico|anilina|fenol$|benzaldeído|benzonitrila|benzamida/.test(M(s).name)));
  let k = 0, mode = 'type', score = 0, tot = 0;
  const box = h('div'), out = h('div', { 'aria-live': 'polite' }), stat = h('div', { class: 'ch-stats' });
  const upd = () => { stat.innerHTML = `<div><b>${score}/${tot}</b><small>acertos</small></div>`; };
  const go = () => {
    const X = M(pool[k % pool.length]);
    clear(box).append(h('div', { class: 'figs' }, draw(X, { scale: 46 })));
    out.innerHTML = '';
    if (mode === 'mc') {
      const opts = shuffle([X.name, ...distractors(X, 3)]);
      box.append(h('div', { class: 'ch-answers' }, opts.map((t) => h('button', { class: 'btn', type: 'button', onclick: (e) => { tot++; const ok = t === X.name; if (ok) score++; upd(); [...e.currentTarget.parentNode.children].forEach((b) => { b.disabled = true; if (b.textContent === X.name) b.classList.add('primary'); }); out.replaceChildren(fb(ok ? 'ok' : 'bad', (ok ? '✔ ' : '✘ ') + nameHTML(X) + (ok ? '' : ' — ' + diagnose(X, t).msg))); } }, t))));
    } else {
      const inp = h('input', { type: 'text', class: 'nameinp', 'aria-label': 'nome IUPAC', placeholder: 'ex.: 3-metilpentan-2-ol', autocomplete: 'off', spellcheck: 'false' });
      const check = () => { tot++; const d = diagnose(X, inp.value); if (d.ok) score++; upd(); out.replaceChildren(fb(d.ok ? 'ok' : 'bad', d.msg)); };
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') check(); });
      box.append(h('div', { class: 'controls' }, inp, h('button', { class: 'btn primary', type: 'button', onclick: check }, 'Conferir'), h('button', { class: 'btn', type: 'button', onclick: () => out.replaceChildren(fb('neutral', '<ol>' + explain(X).map((t) => `<li>${t}</li>`).join('') + '</ol>')) }, 'Resolução')));
      setTimeout(() => inp.focus({ preventScroll: true }), 0);
    }
  };
  host.append(h('div', { class: 'controls' }, seg([['type', 'Digitar o nome'], ['mc', '4 alternativas']], mode, (m) => { mode = m; go(); }, 'modo'), h('button', { class: 'btn', type: 'button', onclick: () => { k++; go(); } }, 'Próxima →')), stat, box, out);
  upd(); go();
}

/* ===================================================================
 * 32. Laboratório 3D
 * =================================================================== */
export function lab3d(host) {
  const groups = [['Hidrocarbonetos', [...CAT.alcanos.slice(0, 7), ...CAT.alcenos.slice(0, 4), ...CAT.alcinos.slice(0, 3), ...CAT.ciclicos.slice(3, 6), ...CAT.aromaticos.slice(0, 4)]], ['Oxigenadas', ['CC(O)C(C)CC', ...CAT.alcoois.slice(1, 9), ...CAT.fenois.slice(0, 2), ...CAT.eteres.slice(1, 4), ...CAT.aldeidos.slice(1, 5), ...CAT.cetonas.slice(0, 5), ...CAT.acidos.slice(1, 5), ...CAT.esteres.slice(1, 5)]], ['Nitrogenadas e halogenadas', [...CAT.aminas.slice(1, 7), ...CAT.amidas.slice(1, 5), ...CAT.nitrilas.slice(0, 3), ...CAT.nitro.slice(0, 2), ...CAT.haletos.slice(0, 4)]], ['Multifuncionais', CAT.multi.slice(0, 10)], ['Moléculas reais', REAL.map((r) => r.s)]];
  let smi = 'CC(O)C(C)CC', V = null, style = 'ball', mode = 'cpk', nums = false, hideH = false;
  const v = vbox('tall'), side = h('div', { class: 'labside' }), info = h('div', { class: 'readout' }), f2 = h('div', { class: 'figs' });
  const s = h('select', { 'aria-label': 'molécula' }, groups.map(([t, list]) => h('optgroup', { label: t }, list.map((x) => h('option', { value: x }, M(x).name || (REAL.find((r) => r.s === x) || {}).n || x)))));
  s.value = smi;
  const go = () => {
    clear(v); const X = M(smi);
    V = view3d(v, X, { style, color: mode, numbers: nums && !!X.name });
    if (hideH) V.hideH(true);
    const real = REAL.find((r) => r.s === smi);
    info.innerHTML = `<span><b>${X.name ? nameHTML(X) : real.n}</b></span><span>${X.formula}</span>${real ? `<span class="muted">${real.n} — ${real.d}</span>` : X.usual ? `<span class="muted">${X.usual}</span>` : ''}<span>Funções: ${funcList(X).filter((f) => FUNCTIONS.includes(f.t)).map((f) => f.name).join(', ') || 'hidrocarboneto'}</span>`;
    clear(f2).append(h('figure', { class: 'fig' }, draw(X, { color: mode === 'fg' ? 'fg' : mode === 'roles' ? 'roles' : mode === 'chain' ? 'chain' : null, num: nums && !!X.name, scale: 38 }), h('figcaption', null, 'Estrutura esquelética correspondente')));
  };
  s.addEventListener('change', () => { smi = s.value; go(); });
  side.append(h('div', { class: 'optgroup-t' }, 'Molécula'), s,
    h('div', { class: 'optgroup-t' }, 'Modelo'), seg([['ball', 'Bola-vareta'], ['space', 'Preenchimento']], style, (k) => { style = k; V.style(k); }, 'estilo'),
    h('div', { class: 'optgroup-t' }, 'Destacar'), seg([['cpk', 'Cores CPK'], ['hetero', 'Heteroátomos'], ['fg', 'Grupos funcionais'], ['chain', 'Cadeia principal'], ['roles', 'Cadeia + subst. + função']], mode, (k) => { mode = k; go(); }, 'destaque'),
    h('div', { class: 'optgroup-t' }, 'Mostrar'), h('div', { class: 'ex-actions' }, tgl('Numeração', () => { nums = !nums; go(); return nums; }), tgl('Ocultar H', () => { hideH = !hideH; V.hideH(hideH); return hideH; })),
    f2);
  host.append(h('div', { class: 'labgrid' }, side, h('div', null, v, info)));
  go();
}

export function threeToTwo(host) {
  let k = 0;
  const pool = shuffle(['CC(C)CC', 'CCC(C)CC', 'CC(O)CC', 'CCC(=O)C', 'CC(C)C=O', 'CCOCC', 'CC(C)CO', 'CCCC(=O)O', 'CC(=O)OC', 'CC=CC', 'CC(C)(C)O', 'CCNC']);
  const v = vbox('short'), box = h('div'), out = h('div');
  const go = () => {
    const s = pool[k % pool.length], X = M(s);
    clear(v); view3d(v, X, { spin: true });
    const iso = shuffle(ALL.filter((x) => x !== s && M(x).formula === X.formula && M(x).name)).slice(0, 3);
    while (iso.length < 3) { const y = rnd(ALL); if (y !== s && !iso.includes(y)) iso.push(y); }
    const opts = shuffle([s, ...iso]);
    clear(box).append(h('div', { class: 'mcq cols' }, opts.map((o) => h('button', { class: 'mopt struct', type: 'button', onclick: (e) => { const ok = o === s; e.currentTarget.classList.add(ok ? 'right' : 'wrong'); out.replaceChildren(fb(ok ? 'ok' : 'bad', ok ? `✔ ${nameHTML(X)}` : '✘ Gire o modelo e conte: carbonos da cadeia, posição das ramificações e dos heteroátomos (vermelho = O, azul = N).')); } }, draw(o, { scale: 26, fs: 13 })))), h('button', { class: 'btn sm', type: 'button', onclick: () => { k++; go(); out.innerHTML = ''; } }, 'Próximo →'));
  };
  host.append(h('div', { class: 'grid2' }, v, h('div', null, h('p', { class: 'prompt' }, 'Qual estrutura esquelética corresponde ao modelo 3D?'), box, out)));
  go();
}
export function twoToThree(host) {
  const list = ['CCCCCC', 'CC(C)CCC', 'CCCCO', 'CCC(C)CC'];
  let smi = list[0], V = null, E = null, rots = null;
  const v = vbox(), f2 = h('div', { class: 'figs' }), rng = h('input', { type: 'range', min: 0, max: 100, value: 0, 'aria-label': 'giro das ligações simples' }), cap = h('p', { class: 'cardlab' });
  const go = () => { clear(v); const X = M(smi); V = view3d(v, X, { color: 'chain', numbers: true }); E = V.E; rots = torsions(X.m, E); rng.value = 0; clear(f2).append(fig(X, nameHTML(X), { color: 'chain', num: true })); cap.innerHTML = 'Arraste o controle: as ligações simples giram (conformações diferentes). <b>O nome não muda</b>: conectividade igual.'; };
  rng.addEventListener('input', () => { const P = applyTorsions(E, rots, +rng.value / 100); P.forEach((p, i) => V.mol.setPos(i, p)); V.mol.update(); });
  host.append(h('div', { class: 'controls' }, seg(list.map((s) => [s, M(s).name]), smi, (k) => { smi = k; go(); }, 'molécula')), h('div', { class: 'grid2' }, f2, v), h('div', { class: 'range-row' }, h('span', null, 'Conformação'), rng), cap);
  go();
}

/* ===================================================================
 * Tabela-resumo das funções e guia rápido
 * =================================================================== */
export function summaryTable(host) {
  const rows = FN_GROUPS.flatMap(([g, color, list]) => list.map((r) => [g, color, ...r]));
  const tb = h('tbody');
  rows.forEach(([g, color, n, grp, gen, smi, suf]) => {
    const X = M(smi);
    const row = h('tr', { class: 'row', tabindex: 0 }, h('td', { style: `color:var(--${color})` }, n), h('td', null, grp), h('td', { class: 'p-suf' }, suf), h('td', { html: nameHTML(X) }));
    const exp = h('tr', { class: 'exp', hidden: '' }, h('td', { colspan: 4 }, h('div', { class: 'grid2' }, h('div', { class: 'figs' }, fig(X, g + ' · ' + gen, { color: 'fg', scale: 40 })), h('ol', { class: 'steps' }, explain(X).map((t) => h('li', { html: t }))))));
    const tog = () => { exp.hidden = !exp.hidden; row.classList.toggle('open', !exp.hidden); };
    row.addEventListener('click', tog); row.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tog(); } });
    tb.append(row, exp);
  });
  host.append(h('div', { class: 'table-wrap' }, h('table', { class: 'cmp' }, h('thead', null, h('tr', null, h('th', null, 'Função'), h('th', null, 'Grupo'), h('th', null, 'Nomenclatura'), h('th', null, 'Exemplo'))), tb)));
}
export const GUIDE = [
  ['Identifique todas as funções', 'Procure O, N, halogênios, C=O, C≡N, C=C e C≡C.'],
  ['Escolha a função principal', 'Tabela de prioridade: ácido > éster > amida > nitrila > aldeído > cetona > álcool > amina. Halo, nitro e alcóxi são sempre prefixos.'],
  ['Escolha a estrutura principal', 'Deve conter o máximo de grupos principais; anel ou cadeia (IUPAC 2013: anel tem preferência); a cadeia mais longa; em empate, a com mais ligações múltiplas e depois mais substituintes.'],
  ['Numere pelo grupo principal', 'O grupo principal recebe o menor localizador possível (CHO e COOH são sempre C1).'],
  ['Depois, as ligações múltiplas', 'Menores localizadores para as duplas e triplas em conjunto; em empate, a dupla recebe o menor.'],
  ['Depois, os substituintes', 'Compare os conjuntos termo a termo: vence o primeiro ponto de diferença (não a soma).'],
  ['Nomeie os substituintes', 'metil, etil, propil, propan-2-il; fluoro, cloro, bromo, iodo; hidroxi, oxo, amino, metoxi, nitro.'],
  ['Agrupe os iguais', 'di-, tri-, tetra- com todos os localizadores: 2,2,4-trimetil.'],
  ['Ordem alfabética', 'Ignore di, tri, tetra, sec e terc; “iso” conta. Em empate final, menor localizador ao primeiro citado.'],
  ['Monte o nome', 'prefixos + cadeia + insaturação + sufixo. Vírgula entre números, hífen entre número e letra: 3-etil-2-metil-hexan-1-ol.'],
];
export function guideList(host) { host.append(h('ol', { class: 'ladder guide' }, GUIDE.map(([t, d]) => h('li', null, h('b', null, t), h('span', null, ' — ' + d))))); }
