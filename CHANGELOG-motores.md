# CHANGELOG por motor · SuiteEmp

Cada motor lleva su propia versión (`MOTOR_VER`); sólo sube cuando cambia su lógica de cálculo. Los cambios de interfaz, textos y documentos no la tocan y viven en las bitácoras de cada revisión (`Bitacora-rev-*.md`). Un proyecto sellado con una versión anterior de un motor abre «Desactualizado» sólo en esa disciplina, con el hallazgo que lo movió; al recalcular, la memoria muestra el antes y el después.

Generado desde `MOTOR_VER` y `MOTOR_CAMBIOS` de index.html (rev 2.9.23).

## Carga térmica (`load`) · v2

| Versión | Rev | Hallazgo / cambio de lógica |
|---|---|---|
| 1 | 2.9.15 | lógica de partida |
| 2 | 2.9.20 | zonas con control de humedad se diseñan con dos casos ASHRAE (enfriamiento y deshumidificación) |

## Cuartos limpios (`clean`) · v2

| Versión | Rev | Hallazgo / cambio de lógica |
|---|---|---|
| 1 | 2.9.15 | lógica de partida |
| 2 | 2.9.16 | sin pisos de 1 m² ni 2.2 m; 5 Pa de ISO 14644-4 con aviso; ceros capturados respetados |

## Selección de equipo (`equip`) · v1

| Versión | Rev | Hallazgo / cambio de lógica |
|---|---|---|
| 1 | 2.9.15 | lógica de partida |

## Ductos y calibres (`duct`) · v1

| Versión | Rev | Hallazgo / cambio de lógica |
|---|---|---|
| 1 | 2.9.15 | lógica de partida |

## Ventilación (`vent`) · v1

| Versión | Rev | Hallazgo / cambio de lógica |
|---|---|---|
| 1 | 2.9.15 | lógica de partida |

## Cotización (`quote`) · v4

| Versión | Rev | Hallazgo / cambio de lógica |
|---|---|---|
| 1 | 2.9.15 | lógica de partida |
| 2 | 2.9.16 | red hidráulica por diámetro con precio capturado; sin 50 m supuestos; partidas pendientes |
| 3 | 2.9.19 | tramo con longitud y sin unidades mueble queda pendiente |
| 4 | 2.9.23 | precio de tubería por renglón con origen (referencia de mercado o proveedor local), IVA desglosado y por metro; sin precio: partida Por cotizar en el Budget, bloqueo sólo en la formal |

## Ingeniería de valor (`valor`) · v1

| Versión | Rev | Hallazgo / cambio de lógica |
|---|---|---|
| 1 | 2.9.15 | lógica de partida |

## Kaizen (`kaizen`) · v1

| Versión | Rev | Hallazgo / cambio de lógica |
|---|---|---|
| 1 | 2.9.15 | lógica de partida |

## Eléctrico (`elec`) · v4

| Versión | Rev | Hallazgo / cambio de lógica |
|---|---|---|
| 1 | 2.9.15 | lógica de partida |
| 2 | 2.9.16 | canalización con las áreas del conductor de la memoria (THW-LS por omisión, NOM-001-SEDE Cap. 10 Tabla 5) |
| 3 | 2.9.18 | siete áreas THHN/THWN-2 corregidas a la Tabla 5 |
| 4 | 2.9.19 | sin compresor de aire cuando no hay demanda |

## Hidráulico sanitario (`hidro`) · v4

| Versión | Rev | Hallazgo / cambio de lógica |
|---|---|---|
| 1 | 2.9.15 | lógica de partida |
| 2 | 2.9.16 | tramo sin longitud ya no supone 10 m |
| 3 | 2.9.18 | curva de Hunter de IPC apéndice E Table E103.3(3) |
| 4 | 2.9.19 | renglones de 2500 a 5000 UM de la misma tabla |

## Contra incendio (`fuego`) · v2

| Versión | Rev | Hallazgo / cambio de lógica |
|---|---|---|
| 1 | 2.9.15 | lógica de partida |
| 2 | 2.9.16 | sin área no hay demanda, bomba ni reserva; área mínima de operación NFPA 13 con aviso |

## Aire comprimido (`aire`) · v2

| Versión | Rev | Hallazgo / cambio de lógica |
|---|---|---|
| 1 | 2.9.15 | lógica de partida |
| 2 | 2.9.16 | sin demanda no se cuentan unidades |

## Obra civil (`civil`) · v3

| Versión | Rev | Hallazgo / cambio de lógica |
|---|---|---|
| 1 | 2.9.15 | lógica de partida |
| 2 | 2.9.16 | sin área clasificada no hay partidas de área clasificada |
| 3 | 2.9.19 | un cuarto limpio vacío no cuenta como área clasificada |

## Soportería (`soporte`) · v2

| Versión | Rev | Hallazgo / cambio de lógica |
|---|---|---|
| 1 | 2.9.15 | lógica de partida |
| 2 | 2.9.16 | renta de elevación sólo con algo que montar |

