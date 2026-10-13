# Substituição Nucleofílica: entendendo SN1 e SN2

Plataforma interativa para Química Orgânica I (graduação), em português.
Prof. Dr. Isac G. Rosset — UFPR, Setor Palotina.

## Módulos

1. Início · 2. Fundamentos · 3. SN2 · 4. SN1 · 5. SN1 × SN2 · 6. Laboratório Molecular 3D ·
7. Simulador de reações · 8. Exercícios resolvidos (15) · 9. Exercícios propostos (30) ·
10. Quiz (20 questões sorteadas) + Desafio SN1 × SN2 · 11. Resumo final

Recursos: mecanismos SN2 e SN1 animados em 3D (com setas curvas, orbitais σ* e p,
estado de transição, inversão de Walden, carbocátion sp³ → sp², ataque às duas faces),
impedimento estérico interativo, gráficos de energia com dicas, solvatação animada,
árvore de decisão, simulador com análise fator a fator, exercícios de setas curvas
("complete o mecanismo"), ordenação por arrastar, clique na estrutura, quiz e desafio cronometrado.

## Tecnologia

HTML + CSS + JavaScript (módulos ES), sem etapa de build.
3D com [Three.js](https://threejs.org) r160, incluído localmente em `vendor/` (licença MIT em
`vendor/three-LICENSE.txt`). Estruturas 2D e gráficos em SVG próprio.

```
index.html          conteúdo
css/style.css       tema escuro, responsivo
js/main.js          navegação e inicialização sob demanda
js/viewer3d.js      visualizador 3D (Three.js), átomos, ligações, orbitais, setas 3D
js/scenes.js        cenas animadas (SN2, SN1, carbocátion, faces, estérico)
js/lab.js           Laboratório Molecular
js/chem2d.js        desenho de estruturas 2D e setas curvas
js/struct.js        estruturas e quadros de mecanismo
js/energy.js        diagramas de energia
js/widgets2d.js     componentes 2D, árvore de decisão, simulador
js/practice.js      componentes de exercícios
js/exdata.js        exercícios resolvidos e propostos
js/quiz.js          quiz e desafio
```

## Rodar localmente

Por usar módulos ES, abra por um servidor local (não por `file://`):

```sh
npx http-server .
```

## Publicar no Netlify

- **Arrastar e soltar:** em https://app.netlify.com/drop, arraste a pasta (ou o .zip) com
  o `index.html` na raiz.
- **Pelo Git:** defina esta pasta como *Base directory*; o `netlify.toml` já configura a publicação.
