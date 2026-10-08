# Conformações de Moléculas Orgânicas

Laboratório virtual de análise conformacional para Química Orgânica I (graduação), em português.
Prof. Dr. Isac G. Rosset — UFPR, Setor Palotina.

## Módulos (24)

Início · O que são conformações? · Rotação em ligações simples · Projeção de Newman ·
Projeção em Cavalete · Etano · Butano · Anti, Gauche e Eclipsada · Diagramas de Energia ·
Cicloalcanos · Ciclo-hexano · Conformação Cadeira · Axial × Equatorial · Inversão de Cadeira ·
Cicloexanos Monossubstituídos · Cicloexanos Dissubstituídos · Cis × Trans ·
Laboratório Conformacional 3D · Conversor Newman ↔ Cavalete ↔ 3D · Simulador de Cadeira ·
Exercícios Resolvidos (29, 8 níveis) · Exercícios Propostos (50 + atividades interativas) ·
Quiz Final (30 questões) + "Conformação em 10 segundos" · Mapa Conceitual e resumo

Destaques: modelo 3D, projeção de Newman, cavalete e perfil de energia sincronizados
(slider, botões ou Shift/Ctrl + arrastar no 3D); câmera alinhada ao eixo C–C; planos do
diedro; inversão de direção de visualização; tensão estérica em space-filling; exercícios
de Newman com arrastar e soltar; cicloalcanos (dobra do ciclobutano, pseudorrotação do
ciclopentano); ciclo-hexano com cadeira, meia-cadeira, barco torcido e barco (coordenadas de
Cremer–Pople), inversão animada com perfil de energia, axial/equatorial e up/down, interações
1,3-diaxiais, valores A, cicloexanos 1,2/1,3/1,4 cis/trans e construtor de cadeira com
comparação das duas cadeiras (previsão antes da resposta).

Todas as projeções (Newman, cavalete, cadeira 2D) são geradas da mesma geometria usada no 3D.
Energias são estimativas qualitativas (ex.: butano: gauche ≈ 3,8; eclipsada ≈ 16;
totalmente eclipsada ≈ 19 kJ/mol).

## Tecnologia

HTML + CSS + JavaScript (módulos ES), sem build. 3D com Three.js r160 (local, `vendor/`,
licença MIT). Projeções, gráficos e cadeiras em SVG próprio.

## Publicar no Netlify

Arraste a pasta `conformacoes/` (ou o zip) em https://app.netlify.com/drop.
Pelo Git, use `conformacoes` como *Base directory*.
