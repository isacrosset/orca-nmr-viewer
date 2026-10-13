# Funções Orgânicas e Nomenclatura de Compostos Orgânicos

Aplicação educacional interativa para **Química Orgânica I**: leitura de estruturas,
cadeias carbônicas, reconhecimento de funções, regras IUPAC (2013, em português),
cadeia principal, numeração (primeiro ponto de diferença), substituintes, hidrocarbonetos,
funções oxigenadas, nitrogenadas e halogenadas, compostos multifuncionais, prioridade de
funções, construtor molecular (nome → estrutura), estrutura → nome, laboratório 3D,
simulador de nomenclatura em 8 etapas, exercícios, quiz e desafios.

Prof. Dr. Isac G. Rosset | UFPR – Setor Palotina

## Publicar no Netlify
Site estático, sem build: arraste a pasta (ou o `.zip`) em <https://app.netlify.com/drop>.
O `index.html` deve ficar na raiz.

## Como funciona
Todas as representações (esquelética, estrutural completa, condensada, fórmula molecular,
3D, nome IUPAC e as anotações de cadeia/numeração/substituintes) são geradas a partir de um
único SMILES por um motor próprio, o que garante consistência entre elas.

| Arquivo | Função |
| --- | --- |
| `js/chem.js` | leitura de SMILES, grafo molecular, grupos funcionais, valência, isomorfismo |
| `js/namer.js` | nomenclatura IUPAC 2013 (pt-BR): cadeia principal, numeração, substituintes, sinônimos aceitos |
| `js/depict.js` | layout 2D, estrutura esquelética/completa (SVG) e fórmula condensada |
| `js/embed3d.js` | coordenadas 3D e conformações (torções) |
| `js/lib.js` | biblioteca de moléculas por função, nomes usuais/retidos e moléculas reais |
| `js/core.js` | cores de papel (cadeia, substituintes, grupo principal), átomos clicáveis, 3D, explicações |
| `js/modules.js`, `js/tools.js` | atividades dos módulos, simulador, construtor, laboratório 3D |
| `js/exdata.js`, `js/quiz.js` | 44 resolvidos, 80 propostos, quiz de 40 questões e desafios |
