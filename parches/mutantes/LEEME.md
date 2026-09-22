# Compuerta de mutantes (Fase 1, rev 2.9.24)

`node parches/mutantes/mutantes.mjs <motor|todos> [--solo id] [--index index.html] [--dir carpeta]`

- Lee `parches/mutantes/<motor>.json`: una lista de mutaciones `{ id, que, logica, buscar, reemplazar, estado }`.
- Por cada una copia `index.html` a la carpeta temporal, aplica `buscar → reemplazar` (el texto debe ser único) y corre
  `node pruebas.mjs <copia>`. **El banco debe fallar** (código de salida 1). Un mutante VIVO es una prueba que falta.
- `logica: true` = lógica de cálculo (fórmula, tabla de norma, criterio de selección). La compuerta cierra (código 0)
  sólo con cero mutantes de lógica vivos con estado `vigente`.
- `estado: "fase2:H-nnn"` = la línea mutada es un piso o estimación que la Fase 2 retira con ese hallazgo; se reporta,
  no bloquea.
- Nunca se muta `index.html` del repo: sólo copias en la carpeta temporal.

Mutaciones mínimas por motor: las que la auditoría (AUDITORIA.md §4 y los informes por motor) probó que sobreviven, más
una por cada fórmula o tabla de norma que el motor usa.
