# Fundamentos Estruturais e Eletrônicos da Química Orgânica

Laboratório virtual de estrutura molecular e eletrônica para **Química Orgânica I**:
configuração eletrônica, elétrons de valência, octeto, ligação covalente, estruturas de
Lewis, carga formal, ressonância, VSEPR, geometria, orbitais atômicos e moleculares,
ligações σ e π e hibridização sp³, sp² e sp — com modelos 3D, simuladores e exercícios.

Prof. Dr. Isac G. Rosset | UFPR – Setor Palotina

## Publicar no Netlify
Site estático, sem build: arraste a pasta (ou o `.zip`) em <https://app.netlify.com/drop>.
O `index.html` deve ficar na raiz.

## Como funciona
- Cada molécula é descrita uma única vez (SMILES → estrutura de Lewis com pares isolados).
  A partir dela são calculados elétrons de valência, cargas formais, domínios (VSEPR),
  geometria, hibridização, ligações σ/π e as coordenadas 3D — por isso Lewis, 3D e as
  informações de cada átomo ficam sempre sincronizados.
- Os orbitais são isosuperfícies reais da função de onda (átomo hidrogenoide, Z = 1),
  calculadas no navegador por *marching tetrahedra*: 1s, 2s, 2p, híbridos
  (√n·2p − 2s)/√(1+n) e combinações LCAO (σ, σ*, π, π*). As cores indicam a fase de ψ.
  Distâncias e isovalores são escolhidos para visualização (representação qualitativa).

| Arquivo | Função |
| --- | --- |
| `js/struct.js` | estrutura de Lewis, cargas formais, domínios, VSEPR, hibridização, σ/π, coordenadas 3D |
| `js/orbitals.js` | funções de onda, híbridos, LCAO, isosuperfícies |
| `js/scene3d.js` | cenas 3D (moléculas, pares isolados, ângulos, nuvens π, orbitais), imagens estáticas |
| `js/m1.js`, `js/m2.js` | atividades dos módulos 1–23 |
| `js/tools.js` | laboratório 3D, construtor de Lewis, simuladores de ressonância, VSEPR e hibridização |
| `js/exdata.js`, `js/quiz.js` | 42 resolvidos, 80 propostos, quiz e desafios |
