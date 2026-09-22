# Parche · Ejecución de las 13 decisiones de criterio (H-45..H-97)

Aplicado el 15/17-sep-2026 sobre la 2.9.8.2, que queda como **rev 2.9.9**.

Respaldo previo (ANTES de tocar nada): `respaldo-rev-2.9.8/index-2.9.8.2-antes-de-decisiones-h49-h78-20260915-210110.html` (+ su `pruebas.mjs`).
Respaldo posterior (con todo aplicado): `respaldo-rev-2.9.8/index-2.9.9-ejecucion-13-decisiones-20260917-163535.html`.

**Nota sobre este parche, a diferencia de `iva-botones/` y `contingencia/`:** son 13 decisiones independientes, varias de ellas tocando las mismas funciones (`computeSoporte`, `snapshotSoporte`, `computeSoporteGobernado`). No se armó un `.mjs` reaplicable por item — con este volumen no sale a cuenta el esfuerzo frente al beneficio real. En su lugar, cada item de abajo trae el ancla exacta de código (el comentario `H-XX (decisión del dueño, 15-sep-2026)` que se agregó en el propio `index.html`) para poder ubicarlo y revertirlo a mano sin tocar los demás. Si se quiere reversión mecánica de uno solo: restaurar el archivo `index-2.9.8.2-antes-de-decisiones-h49-h78-....html` y reaplicar a mano los otros 12 (o los que se quieran conservar) usando este documento como guía.

## Los 5 que mueven número (autorizados uno por uno)

### H-49 — Factor de seguridad de la varilla, unificado a 1.5
- **Archivo/función:** `index.html`, dentro de `computeSoporte()`, en la llamada a `calcularSoporteria({...factor_seguridad: 1.5...})`.
- **Antes:** `factor_seguridad: 1.0` (acero/cobre vía SoporteCalc) contra `FS_VARILLA = 1.5` (termoplástico, camino propio). Dos criterios para la misma tabla MSS SP-58.
- **Revertir:** cambiar `1.5` de vuelta a `1.0` en esa línea únicamente. `FS_VARILLA` (termoplástico) no se tocó.
- **Prueba:** Q.1.

### H-50 — Amplificación sísmica alimentada con la altura real (z=h=altura de zona)
- **Archivo/función:** `computeSoporte()`, bloque nuevo al inicio de la función (`hZonas`/`alturaMontaje`), y en la llamada a `calcularSoporteria`, campo `sismo.h: hZonas`; en la construcción de cada `tramosSC` (ducto y tubería), campo `altura_montaje_m: alturaMontaje`.
- **Antes:** `fuerzaSismica` siempre recibía `z=0, h=1` (nunca se pasaban), así que la amplificación `(1+2·z/h)` quedaba siempre en 1 (instalación tratada como a nivel de piso).
- **Revertir:** quitar `altura_montaje_m: alturaMontaje` de las 3 construcciones de tramo, y quitar `h: hZonas` de la llamada a `calcularSoporteria` (o ponerlo en `1`).
- **Prueba:** Q.2.

### H-75 — Espaciamiento de cobre ¾" sube de 1.5 a 1.8 m (supera la decisión de casa 2.5)
- **Archivo/función:** const `SOP_COBRE` (código muerto desde la 2.9.8, alineado por prolijidad — el que de verdad gobierna es `C_SOP.ESPAC_COBRE`, que YA tenía 1.8 y no se tocó).
- **Revertir:** en `SOP_COBRE`, regresar `[15, 1.8], [20, 1.8]` a `[15, 1.5], [20, 1.5]`. No tiene efecto en vivo (tabla muerta); solo importa si algo vuelve a alcanzarla.
- **Prueba:** L.2 (reescrita, ver abajo).

### H-77 (con H-45/H-46 cerrados de paso) — La instantánea de soportería guarda dimensiones/calibre/longitudes reales
- **Archivo/función:** `snapshotSoporte()` y `computeSoporteGobernado()`.
- **Antes:** la instantánea solo guardaba `{L, shape}` de ducto (todo ducto rectangular se recalculaba como 400×200 mm en modo instantánea, todo redondo como Ø250, y sin calibre) y `{nTotal, monD}` de incendio (sin longitudes: el modo instantánea daba CERO soportes de incendio).
- **Revertir:** en `snapshotSoporte()`, quitar los campos `d/w/h/gauge` del map de `duct` y los campos `Lram/ramD/Lmon` del objeto `fuego` (regresar a `{nTotal, monD}`); en `computeSoporteGobernado()`, regresar la reconstrucción de `DUCT`/`FUEGO` a la versión simple sin esos campos.
- **Prueba:** Q.8, Q.8b.

### H-84 — Diámetros interiores reales de cobre/CPVC/acero
- **Archivo/función:** const `TUB_AGUA`.
- **Antes:** `cobre`, `cpvc` y `acero` compartían la MISMA lista `d` (diámetro genérico, ni siquiera correspondía al material declarado en el `label`).
- **Revertir:** restaurar las 3 listas `d` a la lista compartida original (ver `respaldo-rev-2.9.8/index-2.9.8.2-antes-de-decisiones-h49-h78-....html`, línea equivalente a `TUB_AGUA`). `pead` no se tocó.
- **Prueba:** Q.9 (indirecta, vía 22.5/22.8 reescritas — ver abajo).

## Los 8 que NO mueven número (salvo lo declarado en cada uno)

### H-47(b) — Trapecio automático cuando una línea sola excede el colgante sencillo
- **Función:** `calcularTramo()`. Antes `es_trapecio`/`n_varillas`/`carga_varilla`/`varilla` eran `const`; ahora `let`, con un bloque que reintenta a 2 varillas si 1 varilla no alcanza.
- **Revertir:** quitar el bloque `if (!varilla && !es_trapecio) {...}` y regresar las 4 declaraciones a `const`.
- **NO implementado (declarado, no silenciado):** criterio (a) — 2+ líneas paralelas en la misma ruta también van en trapecio. Requiere captura de ruta/coordenadas por tramo que ningún motor tiene hoy.
- **Prueba:** Q.4.

### H-51 — El cuadro eléctrico carga TODAS las unidades de aire comprimido en servicio
- **Función:** `computeElec()`, fila `aire-1`.
- **Antes:** `cant: 1` fijo, aunque `AIRE.nUnidades > 1`.
- **Revertir:** regresar `cant: Math.max(1, num(AIRE.nUnidades, 1))` a `cant: 1`.
- **Prueba:** Q.5.

### H-56 — Altura de colgado derivada de la altura de trabajo
- **Función:** `computeSoporte()` (variable `alturaColgado`), `defaultSoporte()` (campo nuevo `alturaColgadoM: 0`), `calcularSoporteria()` (`entrada.altura_colgado_default`), y el merge de varilla plástica (`p.n * alturaColgado` en vez de `p.n * 0.5`).
- **Antes:** `despiece()` usaba un respaldo fijo de 0.50 m si no se capturaba nada por tramo (y nunca se capturaba nada, porque no existía el campo).
- **Revertir:** quitar `alturaColgadoM` de `defaultSoporte()`, quitar `altura_colgado_default` de la llamada a `calcularSoporteria`, regresar `entrada.altura_colgado_default ?? 0.50` a solo `0.50` en `calcularSoporteria`, y `p.n * alturaColgado` a `p.n * 0.5`.
- **Prueba:** Q.3.

### H-57 — Estratificación declarada por escrito como criterio exclusivo de iluminación
- **Función:** `computeLoad()` (comentario nuevo junto a `const strat`), y el texto de ayuda del campo de altura (~línea del `warn` de altura).
- **No cambia fórmula.** Solo comentario + corrección del texto de ayuda, que antes decía "ya descuenta el aire caliente del techo" (ambiguo, sonaba a cubierta) y ahora dice explícitamente "ganancia de ILUMINACIÓN".
- **Revertir:** es cosmético; no hay nada que revertir en el cálculo.
- **Prueba:** Q.6.

### H-67 — Permisos de soportería y obra civil, sin bajar nunca a cero
- **Función:** const `LINKS` (6 entradas nuevas: `duct/hidro/fuego/aire>soporte`, `load/clean>civil`); `computeSoporte()` (checks `permDuct/permHidro/permFuego/permAire` + avisos "pendiente"); `computeCivil()` (checks `linkAllowed("load>civil")`/`linkAllowed("clean>civil")` + avisos).
- **Diseño explícito:** negar el permiso NUNCA quita la partida ni la baja a cero — solo agrega un aviso `pendiente`. Si se revierte, quitar las 6 entradas de `LINKS` y los checks/avisos correspondientes (las cantidades no cambian con o sin este parche).
- **Prueba:** Q.7.

### H-74 — Clima: Hermosillo, San Luis Río Colorado (sustituto Mexicali) y Rosarito (sustituto Tijuana protegido)
- **Función:** const `SITES` (3 entradas nuevas: `hermosillo`, `sanluis`, `rosarito`).
- **No toca** las 4 filas existentes (`tijuana` sigue PROTECTED, `tecate`/`mexicali`/`ensenada` sin cambio).
- **Discrepancia dejada sin resolver, a propósito:** el ASHRAE 2021 puro de Tijuana (32.8°C BS / 17.5°C BH, estación WMO 760013) es más bajo que los 35/24 de la fila protegida. Ver comentario en el código, junto a `SITES`.
- **Revertir:** quitar las 3 entradas nuevas de `SITES`.
- **Prueba:** Q.11.

### H-78 — Factor de mano de obra por plaza, separado del de material
- **Función:** const `PLAZAS` (todas las `mo` reseteadas a `1.00`), `analizarPU()` (`moT = (cua.total / rend) * PLZ.mo`).
- **Antes:** el campo `mo` existía con valores 1.01-1.10 desde que se creó la tabla, pero NINGÚN cálculo lo leía — cifras con apariencia de dato real, nunca validadas.
- **Revertir:** quitar `* PLZ.mo` de `moT` en `analizarPU()`. Los valores de `mo` en `PLAZAS` se dejan en 1.00 de cualquier forma (restaurarlos a 1.01-1.10 sin fuente sería reintroducir el problema original).
- **Prueba:** Q.9.

### H-97 — El importe de cada partida en el libro Excel es el importe real, no una reconstrucción qty×P.U.
- **Función:** `buildPropuestaXlsx()`, hoja de cotización de construcción.
- **Causa real (no solo redondeo):** para equipo con precio por economía de escala (`listPrice()`, exponente 0.85), el "P.U." mostrado es una referencia/promedio, NO `total/qty` — la fórmula `D*E` reconstruía un importe distinto al real. Además había doble redondeo (`.toFixed(3)`/`.toFixed(2)` antes de escribir la celda) que sí era puro redondeo acumulado.
- **Revertir:** regresar la celda de importe de `xN(conv(p.total), XS.MXN)` a `xF('D${r}*E${r}', XS.MXN)` (con `const r = cf.length + 1;` restaurado antes del push), y el texto de la nota de la hoja a su versión anterior. **No recomendado**: reintroduce el descuadre confirmado contra el PDF.
- **Prueba:** Q.10.

## H-82 / H-30 — NO ejecutado, con constancia
Investigación propia (no código): el Catálogo Nacional de Normas de la Secretaría de Economía y una revisión directa del índice del DOF del 13-mar-2023 **no respaldan** que exista una "NOM-001-SEDE-2022" definitiva — la 2012 (DOF 29-nov-2012) sigue marcada como vigente. La cita de "2022, DOF 13-mar-2023" que repiten varias fuentes comerciales no se pudo verificar en ningún documento primario. No se migró ninguna tabla ni cita eléctrica hasta que la casa lo confirme por una vía oficial (llamada a la Dirección General de Normas / SENER, o el PDF oficial del Handbook si se tiene acceso).

## Banco de pruebas
- Antes de empezar (línea base, sobre el respaldo pre-lote): **259/259**.
- 3 pruebas existentes se REESCRIBIERON para reflejar los deltas autorizados (no son nuevas): `22.5`, `22.8` (H-84, diámetros de agua), `L.2` (H-75, espaciamiento de cobre — nota agregada explicando que supera la decisión 2.5).
- 13 pruebas nuevas, sección **Q** (`Q.1`–`Q.11`, con `Q.8b` aparte): una por hallazgo, cada una aislando el mecanismo específico, no solo repitiendo el banco general.
- Total después: **271/271** sin `--base`; **276/276** con `--base respaldo-rev-2.9.8.2-pre-lote` (agrega las 5 comprobaciones de la sección 8, que no cubren SOPORTE — limitación ya señalada en la propia auditoría, H-70/H-71).
