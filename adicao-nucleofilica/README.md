# Adição Nucleofílica à Carbonila — Química Orgânica II

Aplicação web educacional (estática, sem build) sobre **adição nucleofílica à ligação C=O e transformações de aldeídos e cetonas**:
reversibilidade e equilíbrio, catálise ácida e básica, hidratação e gem-dióis, hemiacetais/acetais (mecanismo completo e hidrólise),
reações intramoleculares, glicose e sacarose, grupos protetores, tioacetais (Mozingo), iminas, enaminas, oximas, hidrazonas,
cianoidrinas, Wittig e Horner–Wadsworth–Emmons.

- 40 módulos; mecanismos com setas curvas sincronizados com modelo 3D e perfil de energia qualitativo
- Geometrias 3D pré-otimizadas (RDKit ETKDG + MMFF94) em `js/mol3d.js`, incluindo α/β-glucopiranose, glicose aberta e sacarose (estereoquímica conferida por CIP)
- Simuladores: equilíbrio, reversibilidade, setas curvas validadas, “Quem deve ser protonado agora?”, grupos protetores, “Escolha o nucleófilo”, síntese
- 50 exercícios resolvidos (20 níveis), 90 propostos (30/35/25), quiz de 45 questões e 5 modos desafio

## Publicar no Netlify
Arraste **esta pasta** (ou o zip) em <https://app.netlify.com/drop>. Não há etapa de build (`netlify.toml` incluído).

## Rodar localmente
```bash
npx http-server . -p 8080
# ou
python3 -m http.server 8080
```

Mecanismos: **representações simplificadas para fins didáticos**. Mapas de potencial e orbitais são qualitativos.

---
Química Orgânica II · Prof. Dr. Isac G. Rosset | UFPR – Setor Palotina
