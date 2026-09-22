# pruebas-motores · casos calculados a mano por motor (Fase 1, rev 2.9.24)

Cada motor tiene aquí un módulo `<motor>.mjs` que `pruebas.mjs` carga al final del banco. Motores: `load`, `clean`,
`equip`, `vent`, `duct`, `elec`, `hidro`, `fuego`, `aire`, `soporte`, `civil`, `quote`.

## Contrato del módulo
```js
export default async function ({ t, eq, cerca, contiene, G, S, w, fs, file, baseFile, cargar, REG_PROY, CM, llenarTodoS, proyectoDePrueba }) {
  const filas = CM.casos("vent");                         // parches/casos-a-mano/vent.csv
  t("CM.vent.1 (ASHRAE 62.1-2016 Tabla 6.2.2.1) oficina 100 m², 10 personas: Vbz", () => {
    const guardado = JSON.stringify(S);
    try {
      G("reemplazarEstado(defaultState())"); /* arma el estado del caso */ S.vent = { ...S.vent, mode: "general", area: 100, height: 3, occ: 10 }; G("recompute")();
      filas.filter((f) => f.id.startsWith("CM.vent.1")).forEach((f) => { if (CM.esFase2(f) && !CM.exigirFase2) return; CM.comprobar(f); });
    } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
  });
}
```
- El módulo arma el estado (captura) del caso; la hoja trae el número esperado y su procedencia; `CM.comprobar(fila)`
  evalúa `fila.expresion` en la suite y compara con tolerancia. Se comparan **números**, nunca textos.
- **Siempre** restaurar el estado en `finally` (el banco comparte `S`).
- Nombre de la prueba: `CM.<motor>.<n> (<norma, edición, tabla>) <caso>`.
- Una prueba por caso o por grupo de filas con el mismo estado armado.

## Hoja `parches/casos-a-mano/<motor>.csv`
Columnas obligatorias (UTF-8, coma, comillas dobles donde haga falta):

| columna | qué va |
|---|---|
| `id` | `CM.<motor>.<n>[.<letra>]` (único) |
| `descripcion` | qué se calcula |
| `entradas` | datos del caso, en texto (los mismos que arma el módulo) |
| `formula` | fórmula y números del cálculo a mano |
| `fuente` | norma con edición y tabla/ecuación, catálogo, o «criterio de la casa (index.html:línea)» |
| `caracter` | `primaria` (texto en parches/normas-texto o URL pública citada) · `secundaria` · `memoria` |
| `expresion` | expresión JS que la suite evalúa (p. ej. `VENT.demand`, `LOADS[0].grand`) |
| `esperado` | número calculado FUERA de la suite |
| `tolerancia` | absoluta (`0.5`) o relativa (`1%`) |
| `estado` | `vigente` = la suite debe dar esto hoy · `fase2:H-nnn` = valor correcto por norma que hoy la suite no da (se exige sólo con `CM_FASE2=1`; al cerrar el hallazgo pasa a `vigente`) |
| `calculado_por` | script o hoja con el cálculo independiente (ruta en `parches/casos-a-mano/`) |

Regla: el `esperado` no puede salir de la suite (ni de `cifrasMotor`, ni de un esperado de regresión). Sale de un script
propio (`parches/casos-a-mano/<motor>.calc.mjs`, sin cargar index.html) o de una hoja con la aritmética visible.

## Pruebas que protegen valores equivocados
No se «arreglan» en la Fase 1. Se marcan en el módulo del motor, en un bloque al inicio:
```js
/* PRUEBAS QUE PROTEGEN VALORES INCORRECTOS (se corrigen en la Fase 2 con su hallazgo):
   - pruebas.mjs:3793 L.2 fija cobre ½–¾" a 1.8 m; MSS SP-58 da 1.5 m → H-229 */
```
y se listan en `parches/casos-a-mano/<motor>.pendientes.md`.

## Compuerta de mutantes
`parches/mutantes/<motor>.json` y `node parches/mutantes/mutantes.mjs <motor>`: ver `parches/mutantes/LEEME.md`.
Ninguna disciplina se da por cubierta con mutantes vivos en lógica de cálculo.
