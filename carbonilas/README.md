# Compostos Carbonílicos — Química Orgânica II

Aplicação web educacional (estática, sem build) sobre **compostos carbonílicos, aldeídos, cetonas e reações de redução e oxidação**:
estrutura da carbonila, polarização, ressonância, orbitais π/π*, trajetória de Bürgi–Dunitz, propriedades físicas, adição nucleofílica,
NaBH₄, LiAlH₄, DIBAL-H, estados de oxidação, PCC, Jones, KMnO₄, mecanismo com Cr(VI), oxidação de aldeídos, ozonólise,
mapa de interconversões, laboratório 3D, simuladores, 42 exercícios resolvidos, 80 propostos, quiz e modos desafio.

## Publicar no Netlify
Arraste **esta pasta** (ou o zip) em <https://app.netlify.com/drop>. Não há etapa de build (`netlify.toml` já incluído).

## Rodar localmente
Por usar módulos ES, sirva por HTTP (não abra via `file://`):

```bash
npx http-server . -p 8080
# ou
python3 -m http.server 8080
```

## Estrutura
- `index.html` — 35 módulos
- `js/` — `main.js` (navegação), `mods1.js`/`mods2.js` (módulos), `tools.js` (laboratório e simuladores), `quiz.js`, `exdata.js`,
  `data.js` (compostos, regras de reação, nº de oxidação, ozonólise), `co2d.js`/`co3d.js` (desenhos 2D e cenas 3D)
- `vendor/three.module.min.js` — Three.js (local)

Os mecanismos são **representações simplificadas para fins didáticos**; os mapas de potencial e orbitais são qualitativos.

---
Química Orgânica II · Prof. Dr. Isac G. Rosset | UFPR – Setor Palotina
