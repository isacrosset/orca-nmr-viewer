# Introdução às Reações Orgânicas e Equilíbrios Ácido-Base

Laboratório virtual de fundamentos de mecanismos orgânicos para **Química Orgânica I**:
homólise e heterólise, radicais, carbocátions e carbânions, ácidos e bases de Brønsted–Lowry
e de Lewis, eletrófilos e nucleófilos, setas curvas (incluindo setas de meia ponta), pKa e
equilíbrio, fatores de acidez (ressonância, eletronegatividade, tamanho, hibridização,
força de ligação, efeito indutivo), K e ΔG°, diagramas de energia, intermediários,
estados de transição e introdução a mecanismos.

Prof. Dr. Isac G. Rosset | UFPR – Setor Palotina

## Publicar no Netlify
Site estático, sem build: arraste a pasta (ou o `.zip`) em <https://app.netlify.com/drop>.
O `index.html` deve ficar na raiz.

## Estrutura
| Arquivo | Função |
| --- | --- |
| `js/chem2d.js` | estruturas 2D em SVG (pares livres, elétrons desemparelhados, setas completas e de meia ponta) |
| `js/anim2d.js` | player de mecanismos com elétrons percorrendo as setas, quadro a quadro |
| `js/struct.js` | espécies, quadros de mecanismos e quebra-cabeças de setas |
| `js/mol3d.js`, `js/scenes3d.js` | modelos 3D, pares livres, orbitais, mapas de potencial eletrostático (qualitativos) |
| `js/acid.js` | pKa aproximados, pares de comparação, construtor de base conjugada |
| `js/energy.js` | diagramas de energia ajustáveis e gráfico K ↔ ΔG° |
| `js/modules.js`, `js/tools.js` | componentes dos módulos, simuladores e laboratório |
| `js/exdata.js`, `js/quiz.js` | 36 exercícios resolvidos, 70 propostos, quiz e desafios |

Os valores de pKa são aproximados (em água quando aplicável) e os mapas de potencial
eletrostático são ilustrativos, gerados a partir de cargas parciais estimadas.
