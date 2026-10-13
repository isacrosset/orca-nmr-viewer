# Estereoquímica de Moléculas Orgânicas

Ambiente interativo para **Química Orgânica I**: isomeria, quiralidade, centros estereogênicos,
enantiômeros, diastereoisômeros, compostos meso, regras CIP, configuração R/S, nomenclatura,
projeções de Fischer, atividade óptica, misturas racêmicas e número de estereoisômeros, com
modelos 3D manipuláveis (Three.js).

Prof. Dr. Isac G. Rosset | UFPR – Setor Palotina

## Publicar no Netlify

Site estático, sem build. Arraste a pasta (ou o arquivo `.zip`) em
<https://app.netlify.com/drop>; o `index.html` deve estar na raiz.

## Estrutura

| Arquivo | Função |
| --- | --- |
| `js/stereo.js` | motor: geometria 3D, árvore CIP com átomos duplicados, R/S, nomes, meso, relações, sobreposição |
| `js/library.js` | moléculas (cadeia + substituintes + R/S desejados) |
| `js/draw.js` | cunha/tracejado e Fischer gerados do mesmo modelo |
| `js/scenes.js` | cenas 3D: prioridades, grupo 4 para trás, espelho, sobreposição, Fischer → 3D, trocas |
| `js/modules.js`, `js/tools.js` | componentes interativos dos módulos e ferramentas |
| `js/exdata.js`, `js/quiz.js` | exercícios (31 resolvidos, 60 propostos), quiz e desafio |

Todas as representações (3D, cunha/tracejado, Fischer, R/S e nome) derivam de uma única
especificação por molécula e são validadas automaticamente entre si.
