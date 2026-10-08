/*
 * exdata.js — exercícios resolvidos e propostos.
 */
import { S, zig, ringPts } from './chem2d.js';
import { SK, sn2Frames, sn1Frames, cation, halide, anion, water, hydrideShift, methylShift, polarBond, protonatedAlcohol, descriptor2D, cloneS, LP3, LP4 } from './struct.js';

/* ---------- estruturas auxiliares ---------- */

const txt = (t) => { const s = new S(); s.a(0, 0, t); return s; };
function chainWith(n, subs, up = true) {
  // subs: [[índice, grau, rótulo, tipo]]
  const s = new S();
  const ids = zig(n, 0, 0, up).map((p) => s.a(...p));
  for (let i = 0; i < n - 1; i++) s.b(ids[i], ids[i + 1]);
  subs.forEach(([i, deg, lab, t, opt]) => s.br(ids[i], deg, lab || '', t || 1, opt));
  return s;
}
/* 2-X-butano com configuração pedida (o tipo de ligação é escolhido pelo cálculo R/S) */
function butan2(X, want, cls = 'lg') {
  const desc = (bt) => descriptor2D([{ deg: 90, type: bt, prio: 1 }, { deg: 30, type: 1, prio: 2 }, { deg: 150, type: 1, prio: 3 }, { deg: 270, type: bt === 'w' ? 'h' : 'w', prio: 4 }]);
  const bt = desc('w') === want ? 'w' : 'h';
  return { s: chainWith(4, [[1, 90, X, bt, { cls }]]), bt, desc: desc(bt) };
}
function butan2bt(X, bt, cls = 'nu') {
  const desc = descriptor2D([{ deg: 90, type: bt, prio: 1 }, { deg: 30, type: 1, prio: 2 }, { deg: 150, type: 1, prio: 3 }, { deg: 270, type: bt === 'w' ? 'h' : 'w', prio: 4 }]);
  return { s: chainWith(4, [[1, 90, X, bt, { cls }]]), desc };
}
/* 3-X-3-metil-hexano: C3 com X (60°) e CH3 (120°) */
function methylhexane3(X, bt, cls = 'lg') {
  const desc = descriptor2D([{ deg: 60, type: bt, prio: 1 }, { deg: 330, type: 1, prio: 2 }, { deg: 210, type: 1, prio: 3 }, { deg: 120, type: bt === 'w' ? 'h' : 'w', prio: 4 }]);
  return { s: chainWith(6, [[2, 60, X, bt, { cls }], [2, 120, 'CH3', bt === 'w' ? 'h' : 'w']]), desc };
}
function ring14(X, tX, tMe, cls = 'lg') {
  const s = new S();
  const R = ringPts(6, 0, 0, -90).map((p) => s.a(p[0], p[1]));
  for (let i = 0; i < 6; i++) s.b(R[i], R[(i + 1) % 6]);
  s.br(R[0], 90, X, tX, { cls });
  s.br(R[3], 270, 'CH3', tMe);
  return s;
}
const bromo2methylbutane3 = () => chainWith(4, [[1, 270, 'Br', 1, { cls: 'lg' }], [2, 90, '']]);
const bromo33dimethylbutane2 = () => chainWith(4, [[1, 270, 'Br', 1, { cls: 'lg' }], [2, 90, ''], [2, 30, '']]);

/* reação genérica em uma linha: substrato + reagente → ? */
function rxnRow(sub, reagent, cond, prod) {
  const s = cloneS(sub);
  let maxx = Math.max(...s.atoms.map((a) => a[0])) + 0.8;
  const midY = s.atoms.reduce((m, a) => m + a[1], 0) / s.atoms.length;
  if (reagent) { s.plus(maxx + 0.2, midY); s.t(maxx + 1.35, midY, reagent, 'atom nu', 17); maxx += 2.3; }
  s.r(maxx + 0.1, maxx + 2.6, midY, cond || '', '');
  if (prod) s.t(maxx + 3.4, midY, prod, 'note', 22);
  return s;
}

/* ===================================================================
 * Quebra-cabeças de setas
 * =================================================================== */

export function puzzleSN2() {
  const s = sn2Frames().r;
  return {
    s,
    sites: {
      lpO: { k: 'lp', a: 0, ang: 0, label: 'par livre do O (HO⁻)' },
      lpBr: { k: 'lp', a: 5, ang: 90, label: 'par livre do Br', why: 'O bromo não doa elétrons ao carbono: ele é o grupo que vai sair.' },
      bCBr: { k: 'bond', b: [1, 5], label: 'ligação C–Br' },
      bCH: { k: 'bond', b: [1, 2], label: 'ligação C–H', why: 'As ligações C–H não se rompem na SN2: os H apenas mudam de posição (inversão).' },
      C: { k: 'atom', a: 1, label: 'carbono (δ+)', why: 'Setas curvas partem de onde estão os elétrons (pares livres ou ligações). O carbono δ+ é o destino, não a origem.' },
      O: { k: 'atom', a: 0, label: 'oxigênio' },
      Br: { k: 'atom', a: 5, label: 'bromo' },
    },
    sources: ['lpO', 'lpBr', 'bCBr', 'bCH', 'C'],
    targets: ['C', 'O', 'Br', 'bCBr'],
    answer: [['lpO', 'C'], ['bCBr', 'Br']],
    msgs: {
      'lpO>Br': 'O nucleófilo ataca o carbono eletrofílico (δ+), e não o bromo (δ−).',
      'bCBr>C': 'Na quebra heterolítica, o par da ligação vai para o átomo mais eletronegativo, o Br, que sai como Br⁻.',
      'lpO>bCBr': 'O ataque é ao carbono, pelo lado oposto ao Br; a seta não deve apontar para a ligação C–Br.',
    },
    done: 'O par do HO⁻ forma a ligação O–C enquanto o par da ligação C–Br sai com o Br⁻ — ao mesmo tempo.',
  };
}

export function puzzleSN1a() {
  const s = sn1Frames()[0];
  return {
    s,
    sites: {
      bCBr: { k: 'bond', b: [0, 4], label: 'ligação C–Br' },
      lpBr: { k: 'lp', a: 4, ang: 90, label: 'par livre do Br', why: 'Isso daria uma ligação a mais entre C e Br; na ionização, a ligação C–Br se rompe.' },
      bCC: { k: 'bond', b: [0, 1], label: 'ligação C–CH₃', why: 'As ligações C–C permanecem; quem sai é o brometo.' },
      C: { k: 'atom', a: 0, label: 'carbono', why: 'Setas partem de elétrons, não do carbono δ+.' },
      Br: { k: 'atom', a: 4, label: 'bromo' },
    },
    sources: ['bCBr', 'lpBr', 'bCC', 'C'],
    targets: ['C', 'Br'],
    answer: [['bCBr', 'Br']],
    msgs: { 'bCBr>C': 'Seta invertida: os elétrons da ligação vão para o Br (mais eletronegativo), formando Br⁻ e deixando o carbono com carga +.' },
    done: 'Quebra heterolítica: o Br leva o par de elétrons (Br⁻) e forma-se o carbocátion.',
    slots: [{
      title: 'Qual espécie se forma nesta etapa?',
      options: [
        { s: (() => { const c = cation(['CH3', 'CH3', 'CH3']); c.t(2.4, 0, '+ Br⁻', 'note', 15); return c; })(), ok: true, why: 'Carbocátion terciário (sp², plano) + brometo: quebra heterolítica.' },
        { text: '(CH₃)₃C• + Br•', ok: false, why: 'Isso seria quebra homolítica (radicais, setas de meia-ponta). Na SN1 a quebra é heterolítica.' },
        { text: '(CH₃)₃C⁻ + Br⁺', ok: false, why: 'Polaridade invertida: o Br é mais eletronegativo e sai com o par de elétrons.' },
      ],
    }],
  };
}

export function puzzleSN1b() {
  const s = new S();
  const c = s.a(0, 0, 'C', { chg: '+', halo: 'o', cls: 'ec' });
  s.br(c, 90, 'CH3'); s.br(c, 270, 'CH3'); s.br(c, 0, 'CH3', 1, null, 1.15);
  const o = s.a(-2.6, 0, 'O', { lp: [55, -55], cls: 'nu' });
  const h1 = s.br(o, 135, 'H'); s.br(o, 225, 'H');
  return {
    s,
    sites: {
      lpO: { k: 'lp', a: o, ang: -55, label: 'par livre do O (água)' },
      bOH: { k: 'bond', b: [o, h1], label: 'ligação O–H', why: 'Nesta etapa a água atua como nucleófilo: usa um par livre, sem romper O–H.' },
      Cp: { k: 'atom', a: c, label: 'carbocátion (C⁺)', why: 'O carbocátion não tem elétrons para doar: tem um orbital p vazio. Ele é o destino da seta.' },
      O: { k: 'atom', a: o, label: 'oxigênio' },
    },
    sources: ['lpO', 'bOH', 'Cp'],
    targets: ['Cp', 'O'],
    answer: [['lpO', 'Cp']],
    msgs: {},
    done: 'O par livre do oxigênio ocupa o orbital p vazio do carbocátion: forma-se o íon oxônio.',
    slots: [{
      title: 'Qual é o produto desta etapa?',
      options: [
        { text: '(CH₃)₃C–O⁺H₂ (íon oxônio)', ok: true, why: 'O oxigênio fica com três ligações e um par livre: carga formal +1.' },
        { text: '(CH₃)₃C–OH₂ (neutro)', ok: false, why: 'O oxigênio com três ligações e um par livre tem carga formal +1; sem a carga, a estrutura estaria errada.' },
        { text: '(CH₃)₃C–H + HO⁺', ok: false, why: 'Não há transferência de hidreto para o carbono nesta etapa.' },
      ],
    }],
  };
}

export function puzzleDeprot() {
  const s = new S();
  const c = s.a(0, 0, 'C', { cls: 'ec' });
  s.br(c, 90, 'CH3'); s.br(c, 270, 'CH3'); s.br(c, 0, 'CH3', 1, null, 1.15);
  const ox = s.a(-1.25, 0, 'O', { chg: '+', lp: [90], cls: 'nu' });
  s.b(c, ox);
  const h1 = s.br(ox, 135, 'H');
  s.br(ox, 225, 'H');
  const w = s.a(-3.7, -1.7, 'O', { lp: [-20, 290] });
  s.br(w, 150, 'H'); s.br(w, 210, 'H');
  return {
    s,
    sites: {
      lpW: { k: 'lp', a: w, ang: -20, label: 'par livre da água (base)' },
      bOH: { k: 'bond', b: [ox, h1], label: 'ligação O⁺–H' },
      bCO: { k: 'bond', b: [c, ox], label: 'ligação C–O', why: 'Romper C–O desfaria a etapa anterior (voltaria ao carbocátion). Aqui o objetivo é remover H⁺.' },
      H: { k: 'atom', a: h1, label: 'H do oxônio' },
      Op: { k: 'atom', a: ox, label: 'O⁺ do oxônio' },
      C: { k: 'atom', a: c, label: 'carbono' },
    },
    sources: ['lpW', 'bOH', 'bCO'],
    targets: ['H', 'Op', 'C'],
    answer: [['lpW', 'H'], ['bOH', 'Op']],
    bend: { 'bOH>Op': -0.9 },
    msgs: {
      'lpW>Op': 'A água atua como base: o par livre ataca o próton (H), e não o oxigênio.',
      'lpW>C': 'O carbono já tem quatro ligações; nesta etapa a água não é nucleófilo, é base.',
      'bOH>H': 'O par da ligação O–H fica com o oxigênio, neutralizando a carga +.',
    },
    done: 'A água remove o H⁺ (forma H₃O⁺) e o par da ligação O–H fica no oxigênio: forma-se o álcool neutro.',
  };
}

/* ===================================================================
 * Exercícios resolvidos (15)
 * =================================================================== */

const r10 = butan2('Br', 'R');
const r10p = butan2bt('CN', r10.bt === 'w' ? 'h' : 'w');
const r11 = (() => { const a = methylhexane3('Br', 'w'); return a.desc === 'S' ? Object.assign(a, { bt: 'w' }) : Object.assign(methylhexane3('Br', 'h'), { bt: 'h' }); })();
const r11pA = methylhexane3('OH', 'w', 'nu'), r11pB = methylhexane3('OH', 'h', 'nu');

export const SOLVED = [
  /* ---- Nível 1 ---- */
  {
    level: 'Nível 1 · Fundamentos', title: 'Identificando os participantes',
    q: 'Na reação abaixo, identifique o nucleófilo, o carbono eletrofílico e o grupo abandonador.',
    fig: { s: rxnRow(SK.ethyl('Br'), 'NC⁻', 'DMSO', 'CH₃CH₂–CN + Br⁻'), scale: 34, cap: 'CH₃CH₂Br + NaCN → CH₃CH₂CN + NaBr' },
    think: 'Quem tem pares de elétrons disponíveis? Qual carbono está ligado a um átomo mais eletronegativo?',
    hint: 'O Na⁺ é íon espectador. Procure a espécie com carga negativa e o carbono ligado ao Br.',
    steps: [
      '<b>Nucleófilo:</b> o íon cianeto, <b>⁻C≡N</b>. A carga negativa e o par livre ficam no carbono, que forma a nova ligação C–C.',
      '<b>Carbono eletrofílico:</b> o CH₂ ligado ao Br. O Br é mais eletronegativo, então a ligação C–Br é polarizada (C<sup>δ+</sup>–Br<sup>δ−</sup>).',
      '<b>Grupo abandonador:</b> o <b>Br⁻</b>, que sai levando o par de elétrons da ligação C–Br.',
      'O Na⁺ não participa: apenas acompanha o ânion (íon espectador).',
    ],
    answer: 'Nu = CN⁻; eletrófilo = C ligado ao Br; grupo abandonador = Br⁻.',
  },
  {
    level: 'Nível 1 · Fundamentos', title: 'Polarização da ligação C–X',
    q: 'Indique as cargas parciais na ligação C–Cl do clorometano e explique por que esse carbono é atacado por nucleófilos.',
    fig: { s: polarBond('Cl'), scale: 44 },
    think: 'Compare as eletronegatividades do C (2,5) e do Cl (3,0).',
    hint: 'O átomo mais eletronegativo atrai a densidade eletrônica da ligação.',
    steps: [
      'O cloro é mais eletronegativo que o carbono: a densidade eletrônica da ligação se desloca para o Cl.',
      'Resultado: <b>C<sup>δ+</sup>–Cl<sup>δ−</sup></b>. O carbono fica deficiente em elétrons (eletrófilo).',
      'Nucleófilos (ricos em elétrons) são atraídos pelo C<sup>δ+</sup>. Além disso, o orbital antiligante σ* C–Cl, de baixa energia, está concentrado no lado do carbono oposto ao Cl: é ali que o nucleófilo doa seu par.',
      'Observação: a C–I é menos polar que a C–Cl, mas é mais fraca e o I⁻ é melhor grupo abandonador — por isso iodetos de alquila reagem mais rápido.',
    ],
  },
  {
    level: 'Nível 1 · Fundamentos', title: 'Lendo setas curvas',
    q: 'No esquema, o que representa cada seta curva? Quantos elétrons cada seta move?',
    fig: { s: sn2Frames().a1, scale: 40 },
    think: 'De onde sai cada seta (par livre ou ligação)? Para onde ela aponta?',
    hint: 'Uma seta com ponta inteira representa o movimento de um <b>par</b> de elétrons.',
    steps: [
      'Seta 1 (magenta): sai de um <b>par livre do oxigênio</b> e aponta para o carbono → o par passa a formar a nova ligação <b>O–C</b>.',
      'Seta 2 (laranja): sai da <b>ligação C–Br</b> e aponta para o Br → os dois elétrons da ligação ficam com o Br, que sai como <b>Br⁻</b>.',
      'Cada seta de ponta inteira move <b>2 elétrons</b>. Setas sempre partem de elétrons (pares livres ou ligações) e apontam para onde eles vão.',
    ],
  },
  /* ---- Nível 2 ---- */
  {
    level: 'Nível 2 · Previsão de mecanismo', title: '1-bromopropano + azida em DMSO',
    q: 'Preveja o mecanismo predominante: CH₃CH₂CH₂Br + NaN₃ em DMSO.',
    fig: { s: rxnRow(SK.propyl('Br'), 'N₃⁻', 'DMSO', '?'), scale: 34 },
    think: 'Analise substrato, nucleófilo e solvente — nessa ordem.',
    hint: 'Carbocátions primários são muito instáveis.',
    steps: [
      '<b>Substrato:</b> primário — pouco impedido (bom para SN2); carbocátion primário instável (SN1 inviável).',
      '<b>Nucleófilo:</b> N₃⁻ — aniônico, excelente nucleófilo e base fraca (pouca eliminação).',
      '<b>Solvente:</b> DMSO — polar aprótico, não "prende" o ânion por ligações de hidrogênio.',
      '<b>Conclusão:</b> <span class="sn2c">SN2</span>, formando CH₃CH₂CH₂N₃ (1-azidopropano) + Br⁻.',
    ],
  },
  {
    level: 'Nível 2 · Previsão de mecanismo', title: 'Brometo de terc-butila em etanol',
    q: 'Preveja o mecanismo da reação de (CH₃)₃CBr em etanol, sem outro nucleófilo adicionado.',
    fig: { s: rxnRow(SK.tbutyl('Br'), 'EtOH', 'solvólise', '?'), scale: 34 },
    think: 'Quem é o nucleófilo aqui? Ele é forte ou fraco?',
    hint: 'Quando o próprio solvente é o nucleófilo, a reação chama-se solvólise.',
    steps: [
      '<b>Substrato:</b> terciário — SN2 impossível (face traseira bloqueada); carbocátion terciário relativamente estável.',
      '<b>Nucleófilo:</b> etanol, neutro e fraco — não favorece SN2, mas é suficiente para capturar um carbocátion.',
      '<b>Solvente:</b> polar prótico — estabiliza o carbocátion e o Br⁻ (favorece a ionização).',
      '<b>Conclusão:</b> <span class="sn1c">SN1</span> (etanólise): (CH₃)₃C–OCH₂CH₃ + HBr. Espere também algum alceno por <b>E1</b>, mais ainda com aquecimento.',
    ],
  },
  {
    level: 'Nível 2 · Previsão de mecanismo', title: '2-bromopropano + NaI em acetona',
    q: 'Um substrato secundário reage com NaI em acetona. Qual mecanismo é favorecido?',
    fig: { s: rxnRow(SK.isopropyl('Br'), 'I⁻', 'acetona', '?'), scale: 34 },
    think: 'Secundários podem seguir os dois caminhos. Quais condições desempatam?',
    hint: 'I⁻ é ótimo nucleófilo e base muito fraca; acetona é aprótica.',
    steps: [
      '<b>Substrato:</b> secundário — SN2 possível (mais lenta que em primários); SN1 possível em princípio.',
      '<b>Nucleófilo:</b> I⁻ — forte e pouco básico (quase não provoca E2).',
      '<b>Solvente:</b> acetona — polar aprótica, pouco ionizante (não favorece a formação do carbocátion).',
      '<b>Conclusão:</b> <span class="sn2c">SN2</span> (reação de Finkelstein): forma-se 2-iodopropano. O NaBr é pouco solúvel em acetona e precipita, deslocando o equilíbrio.',
    ],
  },
  /* ---- Nível 3 ---- */
  {
    level: 'Nível 3 · Produtos', title: 'Síntese de Williamson',
    q: 'Qual o produto principal de CH₃CH₂Br com CH₃O⁻Na⁺ em metanol?',
    fig: { s: rxnRow(SK.ethyl('Br'), 'CH₃O⁻', 'CH₃OH', '?'), scale: 34 },
    think: 'O metóxido é nucleófilo forte. O substrato é impedido?',
    hint: 'Substrato primário + nucleófilo aniônico.',
    steps: [
      'Substrato primário, desimpedido → <span class="sn2c">SN2</span>.',
      'O oxigênio do metóxido ataca o CH₂ pelo lado oposto ao Br; o Br⁻ sai.',
      'Produto: <b>CH₃CH₂–O–CH₃</b> (metoxietano), um éter — síntese de Williamson.',
      'Como CH₃O⁻ também é base forte, uma pequena quantidade de eteno (E2) pode se formar; em primários não impedidos, a SN2 predomina.',
    ],
    solFig: { s: (() => { const s = chainWith(4, []); s.atoms[2][2] = 'O'; s.atoms[2][3] = { cls: 'nu' }; return s; })(), cap: 'metoxietano' },
  },
  {
    level: 'Nível 3 · Produtos', title: 'Hidrólise do cloreto de terc-butila',
    q: 'Escreva o produto e o mecanismo de (CH₃)₃C–Cl em água.',
    fig: { s: rxnRow(SK.tbutyl('Cl'), 'H₂O', '', '?'), scale: 34 },
    think: 'Qual a etapa lenta? O nucleófilo participa dela?',
    hint: 'Terciário + solvente prótico + nucleófilo fraco.',
    steps: [
      'Etapa 1 (lenta): ionização (CH₃)₃C–Cl → (CH₃)₃C⁺ + Cl⁻.',
      'Etapa 2 (rápida): a água ataca o carbocátion → (CH₃)₃C–OH₂⁺.',
      'Etapa 3 (rápida): outra água remove H⁺ → (CH₃)₃C–OH + H₃O⁺.',
      'Produto: <b>2-metilpropan-2-ol</b> (álcool terc-butílico) + HCl. Lei de velocidade: v = k[(CH₃)₃CCl].',
    ],
    solFig: { s: SK.tbutyl('OH'), cap: '2-metilpropan-2-ol' },
  },
  {
    level: 'Nível 3 · Produtos', title: 'Solvólise com rearranjo',
    q: 'O 2-bromo-3-metilbutano é aquecido em água. Qual o produto principal?',
    fig: { s: bromo2methylbutane3(), scale: 40, cap: '2-bromo-3-metilbutano' },
    think: 'Que carbocátion se forma primeiro? Existe um carbocátion mais estável a um passo de distância?',
    hint: 'Olhe o H do carbono vizinho ao C⁺.',
    steps: [
      'A ionização forma um carbocátion <b>secundário</b> em C2.',
      'O carbono vizinho (C3) é terciário e tem um H. Ocorre uma <b>migração 1,2 de hidreto</b>: o H⁻ (com seu par) passa para C2.',
      'Forma-se um carbocátion <b>terciário</b> em C3, mais estável.',
      'A água ataca o C3 e, após desprotonação, forma-se o <b>2-metilbutan-2-ol</b> (produto rearranjado, principal). O 3-metilbutan-2-ol (sem rearranjo) é minoritário.',
    ],
    solFig: hydrideShift().map((s, i) => ({ s, scale: 34, cap: ['cátion 2° + migração de H⁻', 'cátion 3°', '2-metilbutan-2-ol'][i] })),
  },
  /* ---- Nível 4 ---- */
  {
    level: 'Nível 4 · Estereoquímica', title: 'Inversão de Walden',
    q: `O (${r10.desc})-2-bromobutano reage com NaCN em DMSO. Qual a configuração do produto?`,
    fig: { s: r10.s, scale: 40, cap: `(${r10.desc})-2-bromobutano` },
    think: 'Qual mecanismo? O que ele faz com a configuração do carbono?',
    hint: 'Secundário + nucleófilo forte e pouco básico + solvente aprótico.',
    steps: [
      'Condições de <span class="sn2c">SN2</span>: o CN⁻ ataca pelo lado oposto ao Br.',
      'O ataque backside provoca <b>inversão da configuração</b> (o "guarda-chuva" vira).',
      'Prioridades no produto: CN (C ligado a N,N,N) > CH₂CH₃ > CH₃ > H — o CN ocupa o lugar de maior prioridade que era do Br.',
      `Logo o descritor também muda: produto <b>(${r10p.desc})-2-metilbutanonitrila</b>. A reação é <b>estereoespecífica</b>.`,
    ],
    solFig: { s: r10p.s, scale: 40, cap: `(${r10p.desc})-2-metilbutanonitrila` },
  },
  {
    level: 'Nível 4 · Estereoquímica', title: 'SN1 com centro quiral',
    q: `O (${r11.desc})-3-bromo-3-metil-hexano, opticamente puro, sofre hidrólise em água. Que produto(s) se forma(m)?`,
    fig: { s: r11.s, scale: 36, cap: `(${r11.desc})-3-bromo-3-metil-hexano` },
    think: 'Que geometria tem o intermediário? Por quantas faces ele pode ser atacado?',
    hint: 'Carbocátions são trigonais planos (sp²).',
    steps: [
      'Terciário em água → <span class="sn1c">SN1</span>. A ionização forma um carbocátion plano, que perde a informação estereoquímica.',
      'A água pode atacar <b>qualquer uma das duas faces</b> do carbocátion.',
      `Formam-se os dois enantiômeros do 3-metil-hexan-3-ol: (${r11pA.desc}) e (${r11pB.desc}).`,
      'Na prática, a mistura é <b>quase</b> racêmica: o Br⁻ recém-saído fica próximo de uma face (par iônico) e a protege parcialmente, gerando ligeiro excesso do produto de <b>inversão</b>.',
    ],
    solFig: [{ s: r11pA.s, scale: 34, cap: `(${r11pA.desc})` }, { s: r11pB.s, scale: 34, cap: `(${r11pB.desc})` }],
  },
  {
    level: 'Nível 4 · Estereoquímica', title: 'Inversão em anel',
    q: 'O <i>cis</i>-1-bromo-4-metilciclo-hexano reage com NaCN em DMSO. O produto é <i>cis</i> ou <i>trans</i>?',
    fig: { s: ring14('Br', 'w', 'w'), scale: 40, cap: 'cis-1-bromo-4-metilciclo-hexano' },
    think: 'SN2 sempre inverte o carbono atacado. O que acontece com a relação cis/trans?',
    hint: 'O CN entra pelo lado oposto ao Br.',
    steps: [
      'Secundário + nucleófilo forte e pouco básico + aprótico → <span class="sn2c">SN2</span>.',
      'O CN⁻ entra na face oposta à do Br: se o Br estava "para cima", o CN fica "para baixo".',
      'O CH₃ continua "para cima". Logo o produto é o <b>trans</b>-4-metilciclo-hexano-1-carbonitrila.',
      'Em anéis, a inversão de Walden aparece como troca cis ⇄ trans.',
    ],
    solFig: { s: ring14('CN', 'h', 'w', 'nu'), scale: 40, cap: 'trans-4-metilciclo-hexano-1-carbonitrila' },
  },
  /* ---- Nível 5 ---- */
  {
    level: 'Nível 5 · Casos integrados', title: 'Mesmo substrato, condições diferentes',
    q: 'O brometo de benzila reage (a) com NaCN em DMSO e (b) em etanol puro. Proponha o mecanismo de cada caso.',
    fig: { s: SK.benzyl('Br'), scale: 40, cap: 'brometo de benzila' },
    think: 'Substratos benzílicos são "especiais" para os dois mecanismos. Por quê?',
    hint: 'O carbono é primário (pouco impedido) e o cátion benzílico é estabilizado por ressonância.',
    steps: [
      '<b>Substrato:</b> benzílico primário — desimpedido (SN2 rápida) e forma carbocátion estabilizado por ressonância (SN1 viável).',
      '(a) CN⁻ é forte, DMSO é aprótico → <span class="sn2c">SN2</span>: PhCH₂CN (fenilacetonitrila).',
      '(b) Etanol é nucleófilo fraco e solvente prótico → <span class="sn1c">SN1</span> (solvólise): PhCH₂OCH₂CH₃.',
      'Moral: o substrato sozinho não decide — <b>nucleófilo e solvente</b> atuam em conjunto.',
    ],
  },
  {
    level: 'Nível 5 · Casos integrados', title: 'Velocidades e leis de velocidade',
    q: 'Dobrando a concentração do nucleófilo, o que acontece com a velocidade em (a) CH₃CH₂CH₂Br + NaN₃/DMF e (b) (CH₃)₃CBr + H₂O/acetona?',
    fig: [{ s: SK.propyl('Br'), scale: 34, cap: '(a)' }, { s: SK.tbutyl('Br'), scale: 34, cap: '(b)' }],
    think: 'Qual espécie participa da etapa determinante da velocidade em cada caso?',
    hint: 'Compare v = k[RX][Nu] com v = k[RX].',
    steps: [
      '(a) Primário + N₃⁻ + aprótico → SN2, <b>v = k[RX][N₃⁻]</b>: dobrar [N₃⁻] <b>dobra</b> a velocidade.',
      '(b) Terciário + água → SN1, <b>v = k[RX]</b>: a água não participa da etapa lenta; dobrar [H₂O] (em mistura com acetona) praticamente não muda a velocidade de ionização — embora mude a polaridade do meio.',
      'Por isso a cinética é uma das principais evidências experimentais para distinguir SN1 de SN2.',
    ],
  },
  {
    level: 'Nível 5 · Casos integrados', title: 'Transformando um álcool em haleto',
    q: 'O álcool terc-butílico não reage com NaBr, mas reage rapidamente com HBr concentrado. Explique com o mecanismo.',
    fig: { s: SK.tbutyl('OH'), scale: 38, cap: '(CH₃)₃C–OH' },
    think: 'O HO⁻ é um bom grupo abandonador?',
    hint: 'Protonar o OH transforma o grupo abandonador.',
    steps: [
      'O HO⁻ é base forte (pKa da água ≈ 15,7): péssimo grupo abandonador. Com NaBr, nada acontece.',
      'Em HBr, o OH é <b>protonado</b>: R–OH + H⁺ → R–OH₂⁺. Agora o grupo abandonador é a <b>água</b>, molécula neutra e estável.',
      'Substrato terciário: R–OH₂⁺ → R⁺ + H₂O (etapa lenta, <span class="sn1c">SN1</span>).',
      'O Br⁻ ataca o carbocátion: forma-se (CH₃)₃C–Br. Com álcoois primários, a etapa de substituição sobre R–OH₂⁺ ocorre por SN2.',
    ],
    solFig: [{ s: protonatedAlcohol(), scale: 36, cap: 'álcool protonado (R = terc-butila)' }, { s: SK.tbutyl('Br'), scale: 34, cap: 'produto' }],
  },
];

/* ===================================================================
 * Exercícios propostos (30)
 * =================================================================== */

const subsSet = (X = 'Br') => [
  { id: 'met', s: SK.methyl(X), label: 'metílico' },
  { id: 'pri', s: SK.ethyl(X), label: 'primário' },
  { id: 'sec', s: SK.isopropyl(X), label: 'secundário' },
  { id: 'ter', s: SK.tbutyl(X), label: 'terciário' },
];
const a2 = butan2('Br', 'S');
const a2p = butan2bt('N3', a2.bt === 'w' ? 'h' : 'w');
const a2q = butan2bt('N3', a2.bt);
const errMech = (() => { const s = cloneS(sn2Frames().r); s.arrow({ a: 1, ang: 180 }, { a: 0, ang: 0 }, 0.25); s.arrow({ b: [1, 5] }, { a: 5, ang: 90 }, -0.55, 'o'); return s; })();

export const PROPOSED = {
  easy: [
    { type: 'mc', title: 'Quem é o nucleófilo?', q: 'Qual das espécies pode atuar como nucleófilo?', o: ['CH₃⁺', 'CN⁻', 'CH₄', 'Na⁺'], a: 1, e: 'Nucleófilos são ricos em elétrons e têm um par disponível. O CN⁻ tem carga negativa e par livre. CH₃⁺ e Na⁺ são deficientes em elétrons; CH₄ não tem pares livres.' },
    { type: 'tf', title: 'Conceitos básicos', q: 'Classifique como verdadeiro (V) ou falso (F):', items: [['A SN2 ocorre em uma única etapa.', 'V'], ['Na SN1, o "1" significa que a reação tem uma única etapa.', 'F'], ['O grupo abandonador sai levando o par de elétrons da ligação.', 'V'], ['Em R–Br, o carbono ligado ao Br tem carga parcial δ−.', 'F']], e: 'O "1" da SN1 refere-se à molecularidade da etapa determinante (só o substrato). Em C–Br, o Br é mais eletronegativo: C<sup>δ+</sup>–Br<sup>δ−</sup>.' },
    { type: 'match', title: 'Associe os termos', q: 'Associe cada termo à sua definição:', pairs: [['Nucleófilo', 'espécie rica em elétrons que doa um par'], ['Eletrófilo', 'espécie deficiente em elétrons que recebe um par'], ['Grupo abandonador', 'sai levando o par de elétrons da ligação'], ['Estado de transição', 'máximo de energia; não pode ser isolado'], ['Intermediário', 'mínimo local de energia; tempo de vida finito']], e: 'Diferencie bem estado de transição (máximo, não isolável) de intermediário (mínimo local, ex.: carbocátion).' },
    { type: 'mc', struct: true, title: 'Clique na estrutura', q: '<b>Qual substrato reagirá mais rapidamente por SN2?</b>', o: subsSet().map((x) => ({ s: x.s, t: x.label })), a: 0, e: 'O metílico é o menos impedido: o nucleófilo alcança a face traseira sem obstáculos. Ordem: metílico > primário > secundário ≫ terciário.' },
    { type: 'mc', title: 'Lei de velocidade', q: 'Qual a lei de velocidade de uma reação SN2?', o: ['v = k[RX]', 'v = k[Nu]', 'v = k[RX][Nu]', 'v = k[RX]²'], a: 2, e: 'Substrato e nucleófilo participam da única etapa (bimolecular).' },
    { type: 'mc', title: 'Grupo abandonador', q: 'Qual é o melhor grupo abandonador?', o: ['I⁻', 'F⁻', 'HO⁻', 'H₃C⁻'], a: 0, e: 'Bons grupos abandonadores são bases fracas e estáveis. I⁻ (ácido conjugado HI, pKa ≈ −10) é excelente; HO⁻ e CH₃⁻ são bases fortes.' },
    { type: 'mc', title: 'Tipo de solvente', q: 'Qual destes é um solvente polar <b>aprótico</b>?', o: ['água', 'metanol', 'DMSO', 'etanol'], a: 2, e: 'DMSO não tem H ligado a O ou N, portanto não faz ligação de hidrogênio como doador. Água e álcoois são próticos.' },
    { type: 'mc', struct: true, title: 'Clique na estrutura', q: '<b>Qual substrato apresenta maior tendência a reagir por SN1?</b>', o: subsSet().map((x) => ({ s: x.s, t: x.label })), a: 3, e: 'O terciário forma o carbocátion mais estável (hiperconjugação e efeito indutivo de três grupos alquila).' },
    { type: 'mc', title: 'Lendo o diagrama', q: 'No diagrama de energia da SN1 (com desprotonação), quantos <b>intermediários</b> aparecem?', fig: { energy: ['sn1'] }, o: ['nenhum', '1', '2', '3'], a: 2, e: 'São dois mínimos locais entre reagentes e produtos: o carbocátion e o íon oxônio. Os três máximos são estados de transição.' },
    { type: 'arrows', title: 'Complete o mecanismo SN2', q: 'Desenhe as setas curvas da reação HO⁻ + CH₃Br. Clique na origem dos elétrons e depois no destino.', puzzle: puzzleSN2(), e: 'Duas setas: par livre do O → C (forma O–C) e ligação C–Br → Br (forma Br⁻). Ambas no mesmo evento (concertado).' },
  ],
  mid: [
    { type: 'order', title: 'Ordenação · SN2', q: '<b>Ordene os substratos em ordem crescente de velocidade de SN2</b> (o mais lento no topo).', items: subsSet(), correct: ['ter', 'sec', 'pri', 'met'], top: 'mais lento', bottom: 'mais rápido', e: 'Impedimento estérico: cada grupo alquila dificulta o acesso do nucleófilo à face traseira.', explain: 'Cada grupo alquila adicionado ao carbono reativo bloqueia parte da face traseira e congestiona o estado de transição pentacoordenado. O terciário praticamente não reage por SN2.' },
    { type: 'order', title: 'Ordenação · SN1', q: '<b>Ordene os substratos em ordem crescente de velocidade de SN1</b> (o mais lento no topo).', items: subsSet(), correct: ['met', 'pri', 'sec', 'ter'], top: 'mais lento', bottom: 'mais rápido', e: 'A velocidade da SN1 acompanha a estabilidade do carbocátion formado na etapa lenta.', explain: 'A etapa lenta forma o carbocátion; quanto mais estável ele é (3° > 2° > 1° > metílico), menor a energia do estado de transição da ionização (postulado de Hammond) e mais rápida a reação.' },
    { type: 'mc', title: 'Nucleofilicidade em meio prótico', q: 'Em metanol, qual é o melhor nucleófilo?', o: ['F⁻', 'Cl⁻', 'I⁻', 'H₂O'], a: 2, e: 'Em solvente prótico, ânions pequenos (F⁻, Cl⁻) são fortemente solvatados por ligações de hidrogênio. O I⁻, grande e polarizável, fica mais disponível.' },
    { type: 'mc', title: 'Nucleofilicidade em meio aprótico', q: 'Em DMSO (sem ligações de hidrogênio com o ânion), qual haleto <b>tende</b> a ser o nucleófilo mais reativo?', o: ['Cl⁻', 'Br⁻', 'I⁻', 'todos iguais'], a: 0, e: 'Sem a "gaiola" de solvatação, a reatividade passa a acompanhar mais a basicidade/densidade de carga: Cl⁻ > Br⁻ > I⁻. Isso mostra que nucleofilicidade depende do meio.' },
    { type: 'mc', title: 'Previsão de produto', q: 'Qual é o produto principal de CH₃CH₂CH₂Br + NaCN em DMSO?', fig: { s: rxnRow(SK.propyl('Br'), 'NC⁻', 'DMSO', '?'), scale: 30 }, o: ['CH₃CH₂CH₂CN', 'CH₃CH=CH₂', 'CH₃CH₂CH₂OH', 'CH₃CH(CN)CH₃'], a: 0, e: 'Primário + nucleófilo forte + aprótico → SN2: o CN substitui o Br no mesmo carbono (sem rearranjo), formando butanonitrila.' },
    { type: 'arrows', title: 'Complete o mecanismo SN1 (etapa 1)', q: 'Desenhe a seta da etapa lenta da SN1 do brometo de terc-butila e escolha a espécie formada.', puzzle: puzzleSN1a(), e: 'Uma única seta: da ligação C–Br para o Br (quebra heterolítica). Forma-se o carbocátion terciário e Br⁻.' },
    { type: 'tf', title: 'Solventes', q: 'Classifique:', items: [['Solventes próticos estabilizam carbocátions e ânions, favorecendo a ionização da SN1.', 'V'], ['Solventes polares apróticos solvatam fortemente ânions por ligações de hidrogênio.', 'F'], ['Em DMSO, um nucleófilo aniônico é, em geral, mais reativo do que em metanol.', 'V'], ['A acetona é um solvente prótico.', 'F']], e: 'Apróticos (DMSO, DMF, acetona, MeCN) solvatam bem cátions, mas não "prendem" ânions por ligação de H — por isso favorecem SN2.' },
    { type: 'mc', title: 'Cinética SN1', q: 'Numa reação SN1, a concentração do nucleófilo é dobrada. A velocidade:', o: ['dobra', 'quadruplica', 'praticamente não muda', 'cai pela metade'], a: 2, e: 'v = k[RX]: o nucleófilo só participa depois da etapa lenta.' },
    { type: 'mc', title: 'Encontre o erro', q: 'O mecanismo abaixo tem um erro. Qual?', fig: { s: errMech, scale: 36 }, o: ['A seta do C para o O está invertida: os elétrons partem do par livre do O em direção ao C.', 'O Br deveria atacar o oxigênio.', 'A ligação C–H deveria se romper.', 'Não há erro.'], a: 0, e: 'Setas curvas representam movimento de elétrons: partem do par livre do nucleófilo (O) e chegam ao carbono eletrofílico. O carbono δ+ não tem par para doar.' },
    { type: 'mc', title: 'Diagrama SN2', q: 'No diagrama da SN2, o máximo da curva representa:', fig: { energy: ['sn2'] }, o: ['um intermediário que pode ser isolado', 'o estado de transição, com ligações parciais Nu···C···LG', 'o carbocátion', 'os produtos'], a: 1, e: 'Na SN2 há um único máximo (estado de transição) e nenhum intermediário. O "carbono pentacoordenado" não é uma molécula estável.' },
  ],
  hard: [
    { type: 'mc', title: 'Estereoquímica SN2', q: `O (${a2.desc})-2-bromobutano reage com NaN₃ em DMF. Qual o produto?`, fig: { s: a2.s, scale: 36 }, struct: true, o: [{ s: a2p.s, t: `(${a2p.desc})-2-azidobutano` }, { s: a2q.s, t: `(${a2q.desc})-2-azidobutano` }, { t: 'mistura racêmica' }, { t: 'but-1-eno' }], a: 0, e: `SN2 com inversão: o N₃ entra pelo lado oposto ao Br (troca cunha ⇄ tracejado). Como N₃ tem a mesma prioridade relativa (1ª) que o Br, o descritor muda: (${a2.desc}) → (${a2p.desc}).` },
    { type: 'mc', title: 'Estereoquímica SN1', q: 'Um haleto terciário quiral, opticamente puro, sofre SN1 em água. O que se espera?', o: ['apenas o produto de retenção', 'apenas o produto de inversão', 'mistura dos dois enantiômeros, frequentemente com ligeiro excesso de inversão', 'nenhum produto quiral'], a: 2, e: 'O carbocátion plano é atacado pelas duas faces; pares iônicos fazem com que a face de onde saiu o grupo abandonador seja parcialmente bloqueada.' },
    { type: 'mc', title: 'Rearranjo de alquila', q: 'O 2-bromo-3,3-dimetilbutano é aquecido em água. Produto principal:', fig: { s: bromo33dimethylbutane2(), scale: 38 }, o: ['3,3-dimetilbutan-2-ol', '2,3-dimetilbutan-2-ol', '2,2-dimetilbutan-1-ol', '3,3-dimetilbut-1-eno'], a: 1, e: 'O cátion secundário inicial sofre migração 1,2 de <b>metila</b>, gerando um cátion terciário, que é capturado pela água: 2,3-dimetilbutan-2-ol.' },
    { type: 'mc', title: 'Rearranjo de hidreto', q: 'O 2-bromo-3-metilbutano é aquecido em etanol. Produto de substituição principal:', fig: { s: bromo2methylbutane3(), scale: 38 }, o: ['2-etoxi-3-metilbutano', '2-etoxi-2-metilbutano', '1-etoxi-3-metilbutano', 'nenhum'], a: 1, e: 'Migração 1,2 de hidreto transforma o cátion 2° em 3°; o etanol captura o cátion terciário.' },
    { type: 'arrows', title: 'Complete a desprotonação', q: 'Desenhe as duas setas da etapa final da hidrólise do brometo de terc-butila.', puzzle: puzzleDeprot(), e: 'A água (base) usa um par livre para remover o H⁺; o par da ligação O–H fica no oxigênio, que perde a carga +.' },
    { type: 'order', title: 'Ordenação · nucleofilicidade', q: '<b>Ordene em ordem crescente de nucleofilicidade em metanol</b> (o mais fraco no topo).', items: [{ id: 'h2o', label: 'H₂O' }, { id: 'cl', label: 'Cl⁻' }, { id: 'br', label: 'Br⁻' }, { id: 'i', label: 'I⁻' }], correct: ['h2o', 'cl', 'br', 'i'], top: 'mais fraco', bottom: 'mais forte', e: 'Em meio prótico, polarizabilidade e solvatação dominam.', explain: 'A água é neutra (nucleófilo fraco). Entre os haletos, em meio prótico, o ânion menor é mais solvatado por ligações de hidrogênio: Cl⁻ < Br⁻ < I⁻.' },
    { type: 'mc', title: 'Substrato primário impedido', q: 'O brometo de neopentila, (CH₃)₃CCH₂Br, é primário. Como ele reage por SN2?', fig: { s: SK.neopentyl('Br'), scale: 38 }, o: ['muito rápido, como todo primário', 'extremamente devagar, por impedimento do grupo terc-butila vizinho', 'só por SN1, sem rearranjo', 'com retenção de configuração'], a: 1, e: 'A ramificação no carbono β bloqueia a trajetória de ataque traseiro. "Primário" é um ponto de partida, não uma regra absoluta.' },
    { type: 'mc', title: 'Ativando um álcool', q: 'Qual reagente converte (CH₃)₃C–OH em (CH₃)₃C–Br com eficiência?', o: ['NaBr em DMSO', 'HBr concentrado', 'NaOH', 'Br₂ em CCl₄'], a: 1, e: 'É preciso protonar o OH para transformá-lo em H₂O (bom grupo abandonador). Com HBr: SN1 via carbocátion terciário.' },
    { type: 'tf', title: 'Competição com eliminação', q: 'Classifique:', items: [['Base forte com haleto terciário tende a dar E2, e não SN2.', 'V'], ['Aquecimento favorece eliminação em relação à substituição.', 'V'], ['Todo nucleófilo forte leva sempre a SN2.', 'F'], ['Nucleofilicidade e basicidade são a mesma propriedade.', 'F']], e: 'Basicidade é termodinâmica (afinidade por H⁺); nucleofilicidade é cinética (velocidade de ataque ao carbono). Mecanismos competem e dependem do conjunto de condições.' },
    { type: 'mc', struct: true, title: 'Estereoquímica em anel', q: 'O <i>cis</i>-1-bromo-4-metilciclo-hexano reage com NaCN em DMSO. Clique no produto principal.', fig: { s: ring14('Br', 'w', 'w'), scale: 34 }, o: [{ s: ring14('CN', 'w', 'w', 'nu'), t: 'cis' }, { s: ring14('CN', 'h', 'w', 'nu'), t: 'trans' }, { t: 'mistura 1:1 cis/trans' }, { t: '4-metilciclo-hexeno apenas' }], a: 1, e: 'SN2 inverte o carbono atacado: o CN entra na face oposta à do Br, e o produto é trans.' },
  ],
};
export { LP3, LP4, halide, anion, water, txt, methylShift };
