/*
 * app.js — navegação por abas/seções, renderização preguiçosa de figuras,
 * laboratórios e exercícios.
 */
(function (G) {
  'use strict';

  const TABS = {
    inicio: 'Início',
    conf: 'Conformações',
    estereo: 'Estereoquímica',
  };

  const pages = [...document.querySelectorAll('.page')];
  const sidenav = document.getElementById('sidenav');
  const mobileSel = document.getElementById('mobile-select');
  const tabBtns = [...document.querySelectorAll('.tab')];

  /* ---------- figuras, laboratórios e exercícios ---------- */

  function renderFigs(root) {
    root.querySelectorAll('[data-fig]:not([data-done])').forEach((el) => {
      el.setAttribute('data-done', '');
      const fn = G.FIG[el.dataset.fig];
      if (!fn) { el.textContent = '[figura ' + el.dataset.fig + ']'; return; }
      try {
        const out = fn(el);
        if (out && out.nodeType) el.appendChild(out);
      } catch (err) {
        console.error('Figura', el.dataset.fig, err);
      }
    });
  }

  function renderWidgets(root) {
    root.querySelectorAll('[data-widget]:not([data-done])').forEach((el) => {
      el.setAttribute('data-done', '');
      const fn = G.WIDGETS[el.dataset.widget];
      if (fn) {
        try { fn(el); } catch (err) { console.error('Widget', el.dataset.widget, err); }
      }
    });
  }

  function storeGet(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function storeSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sem armazenamento */ } }

  function renderQuiz(el) {
    const set = el.dataset.quiz;
    const qs = G.QUIZ[set] || [];
    const key = 'quiz:' + set;
    let state = storeGet(key) || {};
    const { h } = G.UI;
    const score = h('span', { class: 'score' });
    const bar = h('span');
    const reset = h('button', { class: 'btn sm', type: 'button' }, 'Recomeçar');
    el.append(h('div', { class: 'quiz-head' }, score, h('div', { class: 'progress' }, bar), reset));
    const list = h('div');
    el.append(list);

    function refresh() {
      const answered = Object.keys(state).length;
      const right = Object.entries(state).filter(([i, v]) => qs[i] && qs[i].a === v).length;
      score.textContent = `${right} acerto(s) em ${answered} de ${qs.length} respondidas`;
      bar.style.width = (100 * answered / qs.length) + '%';
    }

    function build() {
      list.innerHTML = '';
      qs.forEach((q, i) => {
        const fb = h('div', { class: 'feedback' });
        const opts = h('div', { class: 'opts' });
        const body = h('div', { class: 'ex-body', html: `<p>${q.q}</p>` });
        if (q.fig) body.append(h('div', { class: 'figs' }, h('figure', { class: 'fig', 'data-fig': q.fig })));
        body.append(opts, fb);
        const card = h('div', { class: 'ex' },
          h('div', { class: 'ex-head' }, h('span', { class: 'ex-num' }, `Questão ${i + 1}`)), body);
        const show = (choice, save) => {
          [...opts.children].forEach((b, j) => {
            b.disabled = true;
            if (j === q.a) b.classList.add('correct');
            else if (j === choice) b.classList.add('wrong');
          });
          const ok = choice === q.a;
          fb.className = 'feedback show ' + (ok ? 'ok' : 'bad');
          fb.innerHTML = `<b>${ok ? '✔ Correto!' : '✘ Incorreto.'}</b> ${q.e}`;
          if (save) { state[i] = choice; storeSet(key, state); refresh(); }
        };
        q.o.forEach((o, j) => {
          opts.append(h('button', { class: 'opt', type: 'button', onclick: () => show(j, true), html: `<span class="letter">${'abcde'[j]}</span><span>${o}</span>` }));
        });
        if (state[i] !== undefined) show(state[i], false);
        list.append(card);
      });
      renderFigs(list);
      refresh();
    }
    reset.addEventListener('click', () => { state = {}; storeSet(key, state); build(); });
    build();
  }

  function renderQuizzes(root) {
    root.querySelectorAll('[data-quiz]:not([data-done])').forEach((el) => {
      el.setAttribute('data-done', '');
      renderQuiz(el);
    });
  }

  /* ---------- navegação ---------- */

  function pagesOf(tab) { return pages.filter((p) => p.dataset.tab === tab); }

  function buildNav(tab) {
    sidenav.innerHTML = '';
    const ps = pagesOf(tab);
    const title = document.createElement('h2');
    title.textContent = TABS[tab];
    const ol = document.createElement('ol');
    ps.forEach((p) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#' + p.id;
      a.textContent = p.dataset.title;
      if (p.dataset.ex !== undefined) a.classList.add('ex');
      li.append(a);
      ol.append(li);
    });
    sidenav.append(title, ol);
    mobileSel.innerHTML = '';
    ps.forEach((p, i) => {
      const o = document.createElement('option');
      o.value = p.id;
      o.textContent = `${i + 1}. ${p.dataset.title}`;
      mobileSel.append(o);
    });
  }

  function addPager(p) {
    if (p.querySelector('.pager')) return;
    const ps = pagesOf(p.dataset.tab);
    const i = ps.indexOf(p);
    const nav = document.createElement('nav');
    nav.className = 'pager';
    if (i > 0) nav.innerHTML += `<a class="prev" href="#${ps[i - 1].id}">← ${ps[i - 1].dataset.title}</a>`;
    if (i < ps.length - 1) nav.innerHTML += `<a class="next" href="#${ps[i + 1].id}">${ps[i + 1].dataset.title} →</a>`;
    else if (p.dataset.tab === 'conf') nav.innerHTML += '<a class="next" href="#est-intro">Ir para Estereoquímica →</a>';
    else if (p.dataset.tab === 'estereo') nav.innerHTML += '<a class="next" href="#inicio">Voltar ao início →</a>';
    p.append(nav);
  }

  let currentTab = null;

  function show(id, scroll) {
    let p = document.getElementById(id);
    if (!p || !p.classList.contains('page')) p = pages[0];
    const tab = p.dataset.tab;
    if (tab !== currentTab) {
      currentTab = tab;
      buildNav(tab);
      tabBtns.forEach((b) => b.setAttribute('aria-selected', b.dataset.target === tab ? 'true' : 'false'));
      document.body.dataset.tab = tab;
    }
    pages.forEach((x) => x.classList.toggle('active', x === p));
    sidenav.querySelectorAll('a').forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + p.id));
    mobileSel.value = p.id;
    if (tab !== 'inicio') addPager(p);
    renderFigs(p);
    renderWidgets(p);
    renderQuizzes(p);
    document.title = (p.dataset.title ? p.dataset.title + ' · ' : '') + 'Conformações & Estereoquímica';
    storeSet('last:' + tab, p.id);
    if (scroll !== false) window.scrollTo(0, 0);
  }

  tabBtns.forEach((b) => b.addEventListener('click', () => {
    const tab = b.dataset.target;
    const last = storeGet('last:' + tab);
    const first = pagesOf(tab)[0];
    location.hash = '#' + (last && document.getElementById(last) ? last : first.id);
  }));
  mobileSel.addEventListener('change', () => { location.hash = '#' + mobileSel.value; });
  window.addEventListener('hashchange', () => show(location.hash.slice(1)));

  /* tema claro/escuro */
  const themeBtn = document.getElementById('theme-btn');
  const savedTheme = storeGet('theme');
  if (savedTheme) document.documentElement.dataset.theme = savedTheme;
  themeBtn.addEventListener('click', () => {
    const dark = document.documentElement.dataset.theme
      ? document.documentElement.dataset.theme === 'dark'
      : matchMedia('(prefers-color-scheme: dark)').matches;
    const next = dark ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    storeSet('theme', next);
  });

  show(location.hash ? location.hash.slice(1) : 'inicio');
  // o navegador rola até o elemento do hash no carregamento; volta ao topo da seção
  window.addEventListener('load', () => window.scrollTo(0, 0));
})(window);
