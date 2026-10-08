# Reações de Eliminação: E1 e E2

Plataforma interativa para Química Orgânica I (graduação), em português.
Prof. Dr. Isac G. Rosset — UFPR, Setor Palotina.

## Módulos

1. Início · 2. Fundamentos da Eliminação · 3. Reação E2 · 4. Geometria da E2 ·
5. Regioquímica · 6. Estereoquímica · 7. Reação E1 · 8. Carbocátions e Rearranjos ·
9. E1 × E2 · 10. SN1 × SN2 × E1 × E2 · 11. Laboratório Molecular 3D ·
12. Simulador de Reações · 13. Exercícios Resolvidos (22, em 6 níveis) ·
14. Exercícios Propostos (40: 10 fáceis, 15 intermediários, 15 avançados) ·
15. Quiz Final (25 questões sorteadas) + desafio "SN1, SN2, E1 ou E2?" · 16. Mapa Conceitual

Recursos: E2 animada em 3D (6 etapas, setas curvas, orbitais σ/σ*/p/π, estado de
transição), diedro anti-periplanar com rotação Cα–Cβ, Newman interativa com "Executar E2",
cadeira do ciclo-hexano com inversão (trans-diaxial), Zaitsev × Hofmann, estabilidade de
alcenos, E/Z a partir de conformações anti, E1 em 3D passo a passo, carbocátion sp³ → sp²,
rearranjos (hidreto, metila, expansão de anel) seguidos de eliminação, perfis de energia
SN1/SN2/E1/E2 comparáveis, matriz de decisão, fluxograma, estudos de caso, simulador E2
(o estudante escolhe o Hβ), "Monte a reação" com análise em 10 pontos, exercícios de setas
curvas, clique nos Hβ, ordenação por arrastar, "o que está errado neste mecanismo?", quiz e desafio.

## Tecnologia

HTML + CSS + JavaScript (módulos ES), sem etapa de build.
3D com [Three.js](https://threejs.org) r160 incluído localmente em `vendor/` (licença MIT em
`vendor/three-LICENSE.txt`). Estruturas 2D, Newman, cadeiras e gráficos em SVG próprio.

```
index.html          conteúdo dos 16 módulos
css/style.css       tema escuro, responsivo
js/main.js          navegação e inicialização sob demanda
js/viewer3d.js      visualizador 3D (Three.js): átomos, ligações, orbitais, setas 3D
js/scenes.js        cenas 3D (E2, cadeira, E1, carbocátion, bases, Hofmann)
js/lab.js           Laboratório Molecular 3D
js/chem2d.js        desenho de estruturas 2D em SVG
js/struct.js        estruturas, mecanismos 2D, Newman e cadeiras
js/logic.js         motor qualitativo SN1/SN2/E1/E2
js/widgets2d.js     componentes interativos 2D (Hβ, Newman, Zaitsev, matriz, simuladores…)
js/energy.js        diagramas de energia
js/practice.js      componentes de exercícios
js/exdata.js        exercícios resolvidos e propostos
js/quiz.js          quiz e desafio
```

## Publicar no Netlify

Arraste a pasta `eliminacao/` (ou o arquivo zip) em https://app.netlify.com/drop.
Pelo Git, use `eliminacao` como *Base directory* (o `netlify.toml` já publica `.`).
Para testar localmente: `npx http-server eliminacao` (módulos ES exigem um servidor HTTP).
