# Ácidos Carboxílicos e Derivados — Química Orgânica II

Aplicação web educacional (estática, sem build) sobre **ácidos carboxílicos, derivados de ácidos carboxílicos e suas reações**,
organizada em torno da **substituição nucleofílica acílica** (derivado → ataque → intermediário tetraédrico → eliminação → novo derivado):
estrutura, ressonância e acidez; escada de reatividade; cloretos de acila (SOCl₂, (COCl)₂, PCl₃/PCl₅); anidridos; ésteres (Fischer,
hidrólise ácida, saponificação, lactonas); amidas (aminólise, DCC, hidrólise, lactamas); nitrilas (desidratação, hidrólise ácida e básica);
descarboxilação de β-cetoácidos e ácidos malônicos.

- 45 módulos; mecanismos com setas curvas e protonações explícitas, sincronizados com modelo 3D, perfil de energia qualitativo e posição na escada de reatividade
- Geometrias 3D pré-otimizadas (RDKit ETKDG + MMFF94) em `js/mol3d.js` (derivados, intermediários tetraédricos, espécies protonadas, dímero do ácido acético, β-cetoácido com ligação de H)
- Simuladores: laboratório acílico 3D, “Essa reação acontece?”, escada de reatividade (arrastar), mecanismos com setas validadas, síntese e problemas multietapas, equilíbrio de Fischer
- 53 exercícios resolvidos (19 níveis), 100 propostos (30/40/30, com 10 “Detecte o erro”), quiz de 45 questões e 5 modos desafio

## Publicar no Netlify
Arraste **esta pasta** (ou o zip) em <https://app.netlify.com/drop>. Não há etapa de build (`netlify.toml` incluído).

## Rodar localmente
```bash
npx http-server . -p 8080
# ou
python3 -m http.server 8080
```

Mecanismos: **representações simplificadas para fins didáticos** (indicadas no texto). Mapas de potencial e orbitais são qualitativos.

---
Química Orgânica II · Prof. Dr. Isac G. Rosset | UFPR – Setor Palotina
