# Compostos Aromáticos, Aromaticidade e Reatividade do Benzeno

Aplicação web educacional (Química Orgânica II · Prof. Dr. Isac G. Rosset | UFPR – Setor Palotina).

**Pergunta central:** por que o benzeno reage de forma diferente de um alceno comum?

## Conteúdo (26 módulos)
Início · O que é aromaticidade? · Estrutura do benzeno · Kekulé e ressonância · Orbitais p e sistema π ·
Deslocalização eletrônica (OM de Hückel) · Estabilidade termodinâmica · Calor de hidrogenação ·
Por que adição é desfavorecida? · Por que substituição é favorecida? · Critérios de aromaticidade ·
Regra de Hückel (círculo de Frost) · Aromático × antiaromático × não aromático · Íons aromáticos ·
Heteroaromáticos · Sistemas policíclicos · Introdução à SEA · Complexo σ · Restauração da aromaticidade ·
Laboratório Aromático 3D · Simulador de Hückel · Simulador de Aromaticidade · 33 exercícios resolvidos ·
60 exercícios propostos · Quiz final (35 questões) e modos desafio · Mapa conceitual.

## Como usar
Site estático, sem build. Para publicar no Netlify, arraste esta pasta (ou o .zip) em
<https://app.netlify.com/drop>. Para testar localmente, sirva a pasta com qualquer servidor HTTP
(ex.: `npx http-server .`) — abrir o `index.html` direto do disco não funciona por causa dos módulos ES.

## Tecnologia
HTML + CSS + JavaScript (módulos ES) e Three.js (incluído em `vendor/`). Um único modelo por espécie
(`js/arom.js`) gera o desenho 2D, o modelo 3D (orbitais p, nuvem π calculada como isosuperfície),
a contagem de elétrons π e a classificação — todas as representações ficam sincronizadas.
