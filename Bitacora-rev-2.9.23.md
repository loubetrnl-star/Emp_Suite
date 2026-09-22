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

## 7. Decisión del dueño (22-sep-2026): una sola fuente, lista de distribuidor IUSA
Los tres precios de menudeo con IVA (Tienda IUSA) se sustituyen por la misma lista de distribuidor IUSA vigente 11-ago-2026 (tipo L, tramo 6.10 m, sin IVA) que ya cubría 1-1/4"–4". Antes/después (precio publicado por tramo → MXN/m antes de IVA):

| Diámetro | Antes (menudeo, con IVA) | Después (lista distribuidor, sin IVA) | Cód. IUSA |
|---|---:|---:|---|
| 1/2" | 1,105.00 → 156.15 MXN/m | 1,827.14 → 299.53 MXN/m | 308759 |
| 3/4" | 1,762.00 → 249.01 MXN/m | 2,916.91 → 478.18 MXN/m | 308761 |
| 1" | 2,924.99 → 413.36 MXN/m | 4,846.88 → 794.57 MXN/m | 308763 |

1-1/4"–4" sin cambio. Sólo datos de referencia: `MOTOR_VER` no cambia; golden de regresión sin cambio (CPVC). S.41 ajustada (nueve precios de la lista, ninguno de menudeo; la ruta «con IVA ÷ 1.16» sigue cubierta por el CSV de proveedor de S.41). Banco 350/350 y 355/355 con base. Instalador y tag `rev-2.9.23-candidata` rehechos sobre este commit.
