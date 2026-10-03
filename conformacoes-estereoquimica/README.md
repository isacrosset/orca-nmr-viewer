# Conformações & Estereoquímica

Material web interativo de Química Orgânica para estudantes, em português.

**Conformações** — isômeros constitucionais; conformações e confôrmeros;
projeções de cunha, cavalete e Newman; análise conformacional de etano,
propano e butano; cicloalcanos e tensão de anel; ciclo-hexano em cadeira
(axial/equatorial, interconversão, monossubstituídos e dissubstituídos).

**Estereoquímica** — estereoisômeros, quiralidade, enantiômeros e atividade
óptica, regras CIP, configuração R/S, projeção de Fischer, diastereoisômeros
e compostos meso, isomeria cis/trans e E/Z, nomenclatura.

Cada módulo tem exercícios resolvidos, exercícios propostos com correção
imediata e laboratórios interativos (modelos 3D giráveis, rotação em torno da
ligação C–C com gráfico de energia, cadeira com interconversão, comparação de
cadeiras de dissubstituídos, treinos ilimitados de R/S em cunha e em Fischer,
polarímetro).

## Estrutura

Site estático (HTML + CSS + JavaScript puro), sem etapa de build:

```
index.html        conteúdo teórico e exercícios resolvidos
css/style.css     estilos (tema claro/escuro, responsivo)
js/draw.js        desenho químico em SVG (esqueleto, Newman, Fischer, 3D)
js/figures.js     figuras estáticas
js/widgets.js     laboratórios interativos
js/quiz.js        exercícios propostos
js/app.js         navegação e inicialização
```

## Rodar localmente

Abra `index.html` no navegador, ou sirva a pasta:

```sh
npx http-server conformacoes-estereoquimica
```

## Publicar no Netlify

O arquivo `netlify.toml` na raiz do repositório já aponta a pasta de
publicação (`conformacoes-estereoquimica`) e não há comando de build.

- **Pelo Git:** no Netlify, *Add new site → Import an existing project*,
  escolha este repositório e mantenha as configurações lidas do
  `netlify.toml`.
- **Arrastar e soltar:** em <https://app.netlify.com/drop>, arraste a pasta
  `conformacoes-estereoquimica`.
