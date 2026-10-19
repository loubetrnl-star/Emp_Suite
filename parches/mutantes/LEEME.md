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

## Mutantes retirados (registro)
Un mutante se retira sólo cuando la línea que muta ya no existe o es inalcanzable (equivalente), con la referencia que lo
justifica; se borra de `<motor>.json` y se anota aquí. Retirar un mutante no es debilitar una prueba: no hay conducta que vigilar.

| Mutante | Retirado | Motivo | Referencia |
|---|---|---|---|
| fuego.m14 | 27-sep-2026 | La herencia de altura se retiró (contra incendio captura su altura): la línea ya no existe; lo sustituye fuego.m33 | H-264; fuego.pendientes.md |
| soporte.m43 | 27-sep-2026 | La fórmula de altura de trabajo +5.2 ya no existe; lo sustituye soporte.m55 | H-266; soporte.pendientes.md |
| soporte.m84 | 10-oct-2026 | Equivalente: con la guarda de S.228 sólo se evalúa con L > 0, donde ⌈L/e⌉ + 1 ≥ 2 (el mínimo de 2 nunca rige) | S.228; bitacora.md 10-oct 01:32 |
| civil.m14 | 10-oct-2026 | Equivalente: con área > 0 el perímetro es > 0, así que «área limpia > 0 y mlCana = 0» es inalcanzable | S.235; bitacora.md 10-oct 04:15 |
| soporte.m70, m72, m73, m74 | 12-oct-2026 | Inalcanzables: mutan la propuesta motores>soporte y sus cruces, retirados por H-307 (decisión del dueño) | H-307; ef87f1f |
| elec.m100, m101, m127 | 18-oct-2026 | Inalcanzables: mutan la firma y el «volver a aceptar» de la propuesta cedula>elec (hp de referencia y marca de aparato en la firma; distancia y fp conservados al volver a aceptar), retirada por H-306; sobrevivían con 622/622 en la corrida completa del 12/13-oct (decisión del dueño, mismo criterio que soporte.m70 y m72–m74) | H-306; aea092e |
