# Bitácora rev 2.9.23 · Precios de cobre tipo L (21-sep-2026, decisión del dueño)

Alcance: sólo la cotización (Budget Proposal) **dentro de la suite**. Nada de esto toca el proyecto de cotización en Excel (ADMIN), que es aparte.

## 1. Precios encontrados (cobre tipo L, tubo rígido, tramo de 6.10 m, MXN)

| Diámetro | Importe por tramo | IVA | Tienda / lista | URL | Fecha consulta |
|---|---:|---|---|---|---|
| 1/2" | 1,105.00 | incluido | Tienda IUSA, menudeo (dato del dueño) | — | 21-sep-2026 |
| 3/4" | 1,762.00 | incluido | Tienda IUSA, menudeo (dato del dueño) | — | 21-sep-2026 |
| 1" | 2,924.99 | incluido | Tienda IUSA, menudeo (dato del dueño) | — | 21-sep-2026 |
| 1-1/4" | 6,172.11 | no incluido | IUSA lista de precios distribuidor plomería-cobre, vigente a partir del 11-ago-2026, cód. 308765 | https://www.iusa.com.mx/assets/descargables/listas/construccion/lista-de-precios-plomeria-cobre.pdf | 21-sep-2026 |
| 1-1/2" | 8,045.11 | no incluido | ídem, cód. 308766 | ídem | 21-sep-2026 |
| 2" | 12,851.20 | no incluido | ídem, cód. 308767 | ídem | 21-sep-2026 |
| 2-1/2" | 22,748.07 | no incluido | ídem, cód. 308768 | ídem | 21-sep-2026 |
| 3" | 30,821.54 | no incluido | ídem, cód. 312964 | ídem | 21-sep-2026 |
| 4" | 57,438.08 | no incluido | ídem, cód. 312967 | ídem | 21-sep-2026 |

Observaciones (no se corrigió nada; se cargó tal cual):
- El PDF de IUSA dice «vigente a partir del 11 de agosto 2026», no 01-jul-2026 como decía la liga. La lista aclara «los precios no incluyen IVA».
- Los tres precios de menudeo del dueño (con IVA) quedan muy por debajo de la lista de distribuidor (sin IVA) para el mismo tipo L: 1/2" 1,105.00 con IVA vs 1,827.14 sin IVA; 3/4" 1,762.00 vs 2,916.91; 1" 2,924.99 vs 4,846.88. Se usaron los tres del dueño como ordenó. Conviene ratificar de qué lista o promoción salieron.
- Ningún precio se estimó ni extrapoló. Nacobre, Home Depot y Casa Cravioto no hicieron falta: la lista IUSA cubre 1-1/4" a 4".

## 2. Cómo quedaron cargados en la suite
- `HIDRO_PU_REFERENCIA` (index.html): un renglón por diámetro con `precio` tal como se publica, `porTramo` 6.10, `iva` (true/false), `moneda`, `origen: "referencia"`, `fuente`, `url`, `fecha`.
- El motor lleva cada renglón a **MXN por metro antes de IVA**: precio ÷ 6.10 ÷ 1.16 si incluye IVA (÷ 1.16 no aplica a la lista de distribuidor). Ejemplos: 1/2" → 156.15 MXN/m; 2" → 2,106.75 MXN/m.
- Etiqueta de origen en pantalla y en la partida: **Referencia Budget** / **Proveedor local**. Todo lo cargado ahora es Referencia Budget.
- Al capturar un costo de proveedor local (pantalla: MXN/m antes de IVA; CSV: columnas `precio, por_tramo_m, iva_incluido, moneda, origen, fuente, url, fecha`) el renglón pasa a Proveedor local, sustituye la referencia y queda el **antes/después** en `S.quote.hidroPUlog`, visible en pantalla y en el Budget. El CSV viejo (`precio_por_metro`) sigue entrando. Una fila `origen=referencia` sin fuente se rechaza.
- Proyectos guardados con precio numérico: se conservan como Proveedor local; los diámetros sin precio propio toman la referencia al abrir.

## 3. Budget vs cotización formal
- Diámetros sin precio vigente salen en el Budget (PDF y Excel) como **POR COTIZAR** sin importe, dentro de su sección y en la matriz de alcance; contador **PARTIDAS POR COTIZAR: n** en la primera hoja (resumen ejecutivo del PDF, portada del Excel). `cotUnificadaEstado` ya no bloquea por esto.
- La **cotización formal** (licitación y la cotización técnica de hidro) sigue bloqueada mientras falte un precio; `buildLicitacionPdf` lo dice con el diámetro.
- Leyenda en el Budget cuando se usan referencias: «Precios de referencia de mercado, sujetos a cotización de proveedor», con la fuente y fecha de cada renglón.

## 4. Diámetros «Por cotizar»
- Cobre tipo L: **ninguno** (1/2" a 4" cubiertos). Diámetros de cobre fuera de ese rango, y todo CPVC, PP-R y acero ced. 40 sin precio capturado, salen Por cotizar en el Budget (la plantilla CSV trae 12 precios USD de CPVC de la cotización de referencia sólo como muestra; no se cargan solos).

## 5. Motor y pruebas
- `MOTOR_VER.quote` 3 → 4 (hallazgo en `MOTOR_CAMBIOS` y CHANGELOG-motores.md). Cifras del proyecto de regresión sin cambio (CPVC con precio numérico); esperado regenerado sólo por la versión.
- Pruebas actualizadas: 22.11 (saneado deja las referencias), S.35 (caso sin precio con CPVC; la formal truena sin precio), S.39 (encabezado nuevo, Budget sin bloqueo), S.40 (instalación limpia trae sólo referencias, sin bitácora). Nueva **S.41**: las dos rutas (referencia → Budget con leyenda; proveedor local por pantalla y por CSV con antes/después), Por cotizar con contador, formal bloqueada, compatibilidad con precio numérico viejo.
- Banco: 350/350 sin base; 355/355 con `--base respaldo-rev-2.9.8/index-2.9.21-inicio-20260921-221100.html`.

## 6. Verificación del dueño (22-sep-2026): sello por motor y dos casos ASHRAE
Pruebas de humo sobre la rev actual (no se rehízo nada):
- Proyecto sellado con `load` v1 e `hidro` v1 (motores actuales v2 y v4): al abrir, los sellos quedan byte a byte como venían, nada se guarda solo, sólo Carga térmica e Hidráulico marcan «Desactualizado» con aviso v1 → v2 / v1 → v4 y el hallazgo de cada versión; las otras 12 disciplinas siguen «Calculado».
- Laboratorio con HR especificada en Tijuana: dos casos (enfriamiento 32.8 °C / 6.42 g/kg = 5.99 kW SHF 0.94; deshumidificación 22.8 °C / DP 19.2 °C, 14.2 g/kg = 6.11 kW SHF 0.682), rige deshumidificación; memoria y PDF lo dicen.

**Hallazgo (brecha corregida):** el PDF de carga térmica y la memoria integral no citaban la fuente climática del sitio (ASHRAE Handbook—Fundamentals 2021, estación, WMO, 0.4 %) cuando el sitio trae dato propio; sólo la pantalla lo mostraba. Se agrega la línea «Fuente climatica: …» después de las condiciones exteriores en ambos PDF (documento, no lógica: `MOTOR_VER` no cambia; cifras de regresión sin cambio). Prueba S.37 ampliada. Banco 350/350 y 355/355 con base.

## 8. Corrección del dueño (22-sep-2026): «los de USA» no era IUSA
- Lo que el dueño quiso decir: precios de **Estados Unidos, únicamente California**, como fuente única para todos los componentes. El commit `fd267a0` (nueve precios de la lista de distribuidor IUSA) fue una interpretación equivocada.
- Se revirtió con `git revert` limpio (commit `3c5f235`); `fd267a0` queda en la historia. Las referencias de cobre vuelven a como estaban en `205c40a` (tres de menudeo con IVA + seis de lista IUSA, MXN) hasta que se apruebe la fuente de California y se sustituyan.
- Tags: los existentes (`rev-2.9.23-candidata`) no se mueven; esta candidata lleva tag nuevo.
- Fuente de California: propuesta en `PLAN.md`, sin cargar precios hasta aprobación.
- Moneda: `S.quote.fxFecha` y `S.quote.fxFuente` capturables; `fxVigente()` sólo con tipo > 0 y fecha AAAA-MM-DD. Un precio en USD sin tipo de cambio fechado no se convierte: sale «Por cotizar» (motivo «tipo de cambio sin capturar») y bloquea la formal. El tipo de cambio con su fecha y fuente se imprime en la cotización técnica, la propuesta (PDF y Excel) y las condiciones. Motor `quote` 4 → 5 con hallazgo.
- Etiqueta de cada precio: fuente, ubicación, fecha, moneda, impuestos incluidos/antes de impuestos, lista bruta/neta (renglón, CSV con columnas `ubicacion` y `lista`, pantalla, leyenda del Budget).
- Regresión: el proyecto fijo pasa a cobre tipo L (1/2" con precio numérico de proveedor local; el resto por referencia de mercado) para que el golden ejercite ambas rutas; tipo de cambio fechado en el fixture. Se regeneraron `hidro` y `quote` a propósito (cambio de fixture, no de lógica de hidro).

## 9. Decisiones del dueño (22-sep-2026): Craftsman aprobado, sólo material, etiqueta honesta, Terra Universal, IUSA fuera, importación
1. **Fuente aprobada**: Craftsman Book Company (Carlsbad, CA), estimadores 2026 de construcción, plomería/HVAC y eléctrico, factor de área San Diego. El dueño consigue los libros/acceso y pasa el PDF. **No se ha cargado nada.**
2. **Sólo material**: de la fuente se toma únicamente el costo de material; la mano de obra la pone la empresa con sus rendimientos y costos. Renglón de referencia con `alcance: "material"`; si la fuente combina material + mano de obra sin separarlos (`material_mo`) → «Por cotizar». Mientras no se capture la mano de obra, cada red con referencia de material deja el pendiente «mano de obra por capturar» (no se estima).
3. **Etiqueta honesta**: cada precio se imprime como lo describe la fuente: fuente, edición, página, ubicación, fecha, moneda, alcance, impuestos (incluidos / antes de impuestos / **no especificado**), lista (texto tal cual / **no especificado**). Se retiró el valor «lista bruta» que se había puesto por suposición.
4. **Terra Universal** (Fullerton, CA): complemento sólo para cuarto limpio (FFU, HEPA, paneles, puertas, pass-through), con su propia fuente y fecha de consulta. Todo lo demás, Craftsman o «Por cotizar». Se cargará junto con Craftsman al extender el modelo de referencia a las demás secciones.
5. **IUSA fuera del Budget** (regla: únicamente California). `HIDRO_PU_REFERENCIA` queda vacía; el cobre sale «Por cotizar» hasta recibir los libros. Al abrir un proyecto guardado con referencias fuera de California, `sanearEstado` las retira y deja el antes/después en `hidroPUlog` (vía «regla California»). Archivo de lo retirado (cobre tipo L, tramo 6.10 m, MXN; antes → después):

| Diámetro | Antes (referencia IUSA) | MXN/m antes de IVA | Después |
|---|---:|---:|---|
| 1/2" | 1,105.00 con IVA (Tienda IUSA menudeo, 21-sep-2026) | 156.15 | Por cotizar |
| 3/4" | 1,762.00 con IVA (ídem) | 249.01 | Por cotizar |
| 1" | 2,924.99 con IVA (ídem) | 413.36 | Por cotizar |
| 1-1/4" | 6,172.11 sin IVA (lista distribuidor IUSA vigente 11-ago-2026, cód. 308765) | 1,011.82 | Por cotizar |
| 1-1/2" | 8,045.11 sin IVA (cód. 308766) | 1,318.87 | Por cotizar |
| 2" | 12,851.20 sin IVA (cód. 308767) | 2,106.75 | Por cotizar |
| 2-1/2" | 22,748.07 sin IVA (cód. 308768) | 3,729.19 | Por cotizar |
| 3" | 30,821.54 sin IVA (cód. 312964) | 5,052.71 | Por cotizar |
| 4" | 57,438.08 sin IVA (cód. 312967) | 9,416.08 | Por cotizar |

   Fixture de regresión: referencia de prueba aislada («REFERENCIA DE PRUEBA del fixture de regresión, no es una fuente real», San Diego CA, USD, sólo material) en 3/4"–4" y proveedor local numérico en 1/2"; esperado de `quote` regenerado (v6).
6. **Flete, aduana e importación a México**: sección H propia, siempre «Por cotizar» (Budget PDF/Excel, contador, pendiente en la formal) hasta capturar monto, moneda, fuente y fecha en Cotización. Nunca se prorratea ni se estima. Nota: el porcentaje «Flete y maniobras» sobre el costo directo (parámetro comercial del dueño, capturable) se dejó como estaba; si también debe salir, es decisión aparte.

Motor `quote` 5 → 6. Pruebas: S.20 y S.39 ajustadas (la importación siempre pendiente), S.41 reescrita (11 bloques: IUSA fuera y archivada, referencia de prueba, etiqueta honesta, sólo material, únicamente California, USD con tipo de cambio fechado, Por cotizar y formal bloqueada, importación, proveedor local por pantalla y CSV, pantalla). Banco 350/350 y 355/355 con base.
