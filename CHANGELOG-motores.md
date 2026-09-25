# CHANGELOG por motor · SuiteEmp

Cada motor lleva su propia versión (`MOTOR_VER`); sólo sube cuando cambia su lógica de cálculo. Los cambios de interfaz, textos y documentos no la tocan y viven en las bitácoras de cada revisión (`Bitacora-rev-*.md`). Un proyecto sellado con una versión anterior de un motor abre «Desactualizado» sólo en esa disciplina, con el hallazgo que lo movió; al recalcular, la memoria muestra el antes y el después.

Generado desde `MOTOR_VER` y `MOTOR_CAMBIOS` de index.html (rev 2.9.23).

## Carga térmica (`load`) · v4

| Versión | Rev | Hallazgo / cambio de lógica |
|---|---|---|
| 1 | 2.9.15 | lógica de partida |
| 2 | 2.9.20 | zonas con control de humedad se diseñan con dos casos ASHRAE (enfriamiento y deshumidificación) |
| 3 | 2.9.21 | cuarto limpio con presión positiva sin infiltración; unidad de aire exterior dedicada + serpentín seco (ADP desde la latente interna); crédito sensible del aire exterior topado en deshumidificación; cambios por hora obligatorios; calor del ventilador Q·ΔP/η. Declarada en la rev 2.9.24 (H-107): la 2.9.21 movió estas cifras sin subir la versión |
| 4 | 2.9.24 | H-120: el DET de muros y cubierta se corrige por la condición de diseño del sitio, (25.6 − ti) + (tm − 29.4) K con tm = to − rango/2 (corrección CLTD, ASHRAE Fundamentals 1997 cap. 28, texto secundario; ratificar con Carrier Parte 1 Tabla 20A). Tijuana +0.31 K; Mexicali +9.01 K |

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

## Cotización (`quote`) · v8

| Versión | Rev | Hallazgo / cambio de lógica |
|---|---|---|
| 1 | 2.9.15 | lógica de partida |
| 2 | 2.9.16 | red hidráulica por diámetro con precio capturado; sin 50 m supuestos; partidas pendientes |
| 3 | 2.9.19 | tramo con longitud y sin unidades mueble queda pendiente |
| 4 | 2.9.23 | precio de tubería por renglón con origen (referencia de mercado o proveedor local), IVA desglosado y por metro; sin precio: partida Por cotizar en el Budget, bloqueo sólo en la formal |
| 5 | 2.9.23 | precios en USD sólo se convierten con tipo de cambio capturado con fecha; sin fecha salen Por cotizar y bloquean la formal (nada se estima) |
| 8 | 2.9.24 | H-196: cisterna y equipo de bombeo del hidrosanitario sin precio semilla (9,500 MXN/m³ y 14,500 MXN/HP no tenían fuente ni fecha): van «Por cotizar» con su volumen (m³) y su potencia (HP); la bomba sólo cuando la presión de la red no alcanza al mueble más exigente (`presOk` falso); cisterna en 0 queda «pendiente de volumen», nunca «cisterna de 0 m³». La matriz de alcance del Excel declara pendientes y partidas Por cotizar también en una sección sin partida con importe. Proyecto fijo: −36,250 MXN directos (bomba 2.5 HP a Por cotizar) |
| 7 | 2.9.24 | H-198: un tramo de agua sin diámetro verificado (fuera del catálogo del material, o PEAD sin SDR ni fuente) va «Por cotizar» con sus metros; ya no se cotiza con el precio del mayor diámetro ni se pide precio de un diámetro que no le corresponde. Proyecto fijo: sin cambio de cifras (cobre) |
| 6 | 2.9.23 | referencias sólo de California y sólo material (mano de obra por capturar; combinados → Por cotizar); referencias IUSA retiradas; flete, aduana e importación como renglón propio siempre Por cotizar hasta capturarlo |

## Ingeniería de valor (`valor`) · v1

| Versión | Rev | Hallazgo / cambio de lógica |
|---|---|---|
| 1 | 2.9.15 | lógica de partida |

## Kaizen (`kaizen`) · v1

| Versión | Rev | Hallazgo / cambio de lógica |
|---|---|---|
| 1 | 2.9.15 | lógica de partida |

## Eléctrico (`elec`) · v8

| Versión | Rev | Hallazgo / cambio de lógica |
|---|---|---|
| 1 | 2.9.15 | lógica de partida |
| 2 | 2.9.16 | canalización con las áreas del conductor de la memoria (THW-LS por omisión, NOM-001-SEDE Cap. 10 Tabla 5) |
| 3 | 2.9.18 | siete áreas THHN/THWN-2 corregidas a la Tabla 5 |
| 4 | 2.9.19 | sin compresor de aire cuando no hay demanda |
| 5 | 2.9.24 | H-183: conductor de puesta a tierra con la Tabla 250-122 de la NOM-001-SEDE-2012 (p. 151): 400 A → 2 AWG (antes 3 AWG, valor del NEC), renglones hasta 6000 A y columna de aluminio (hasta 100 A la tabla sólo da cobre) |
| 6 | 2.9.24 | H-177: equipo con motocompresor hermético con MCA y MOP por el art. 440: conductor por la MCA de placa (440-4(b), 440-35; una MCA estimada por la suite no lo baja del 125 %) y protección igual al MOP o al valor inmediato inferior de 240-6(a) completo (16, 32, 63 A; abajo de 15 A sólo fusibles de 1, 3, 6, 10 A), sin el 250 % de la Tabla 430-52 (40VMA-240: 150 → 90 A; 40MBC-24: 25 → 15 A). Aceptar la cédula conserva MCA y MOP (marcados estimados); una carga sin kW no fija el principal |
| 7 | 2.9.24 | H-179: nada se supone. Sin distancia al tablero, sin transformador (kVA y Z de placa) o sin longitud de una carga, la caída del alimentador, la corriente de falla con su capacidad interruptiva y la caída del ramal quedan «pendiente» con aviso (antes 30 m, 150 kVA / Z 4 % y 25 m supuestos; 0 m daba 0.00 %). Las cargas de otros motores ya no traen distancia automática (Ltablero + 10 a 30 m). Sin longitud el calibre se declara mínimo por ampacidad. El 80 % del transformador se revisa con sólo el kVA. Proyectos guardados antes conservan sus valores, marcados «sin confirmar». La memoria, el PDF y el libro dan la L de cada carga. Cubre H-189 |
| 8 | 2.9.24 | H-178: la corriente de un motor de uso general sale de la Tabla 430-250 (trifásico) o 430-248 (monofásico, con su columna de 127 V) de la NOM-001-SEDE-2012 (430-6(a)(1)), no de kW/(1.732·V·fp): hp de placa (campo nuevo) o, sin él, el renglón inmediato superior al kW por la columna kW de la propia tabla (decisión del dueño 2; 15 kW → 25 hp → 68 A, antes 46.31 A → 4 AWG/125 A, ahora 3 AWG/175 A). Su kVA en la demanda sale de esa corriente. El hp de catálogo o estimado por otro motor (compresor, bombas) no es de placa: sólo puede subir el renglón. Los FFU entran como aparato (Exc. 2). Fuera de la tabla, corriente ESTIMADA con aviso, o PENDIENTE sin kW. Los proyectos que aceptaron la cédula antes salen con la propuesta «Desactualizada» |

## Hidráulico sanitario (`hidro`) · v8

| Versión | Rev | Hallazgo / cambio de lógica |
|---|---|---|
| 1 | 2.9.15 | lógica de partida |
| 2 | 2.9.16 | tramo sin longitud ya no supone 10 m |
| 3 | 2.9.18 | curva de Hunter de IPC apéndice E Table E103.3(3) |
| 4 | 2.9.19 | renglones de 2500 a 5000 UM de la misma tabla |
| 5 | 2.9.24 | H-194: presión mínima en la salida de cada mueble por la Tabla 604.3 del IPC 2015 (texto en `parches/normas-texto/IPC-2015_Tabla-604.3_y_424.3_upcodes.txt`): WC con fluxómetro sifónico 35 psi = 24.6 m (antes 10.5 m sin fuente), mingitorio con válvula 25, WC de tanque 20, regadera 20 (renglón con válvula balanceada/termostática, la que exige §424.3), lavabo/fregadero/lavadero/bebedero/toma de manguera 8 psi; tarja de laboratorio asimilada a sink, service (criterio de la casa); lavaojos sin cambio (H-195). Sin muebles: 8 psi, el menor renglón. La carga dinámica de la bomba lleva máx(residual capturado 15 m, mínima de norma del mueble más exigente); antes sólo el residual fijo. Proyecto fijo: CDT 19.95 → 29.56 m, bomba 2 → 2.5 HP; quote (v6, aguas abajo) 29,000 → 36,250 MXN en la partida de cisterna y bomba |
| 6 | 2.9.24 | H-195: regadera de emergencia (20 gpm = 75.7 L/min) y lavaojos fijo (0.4 gal/min = 1.5 L/min, mueble nuevo) fuera de Hunter, con gasto fijo sumado al del sistema (antes 6 unidades mueble cada uno); volumen para 15 min con aviso si la cisterna no lo guarda; cada tramo declara el gasto de emergencia que conduce (L/min), con aviso si ninguno lo lleva; presión del equipo (21 m) declarada criterio de la casa. Fuente secundaria: ANSI Z358.1-1990 citada por OSHA (cartas del 18-abr-2002 y 22-nov-1993, `parches/normas-texto/OSHA-cartas-Z358.1_regadera-y-lavaojos.txt`); ratificar con Z358.1-2014. Proyecto fijo: sin cambio de cifras (no tiene equipo de emergencia) |
| 7 | 2.9.24 | H-197: sin pisos sin norma. Días de reserva capturados se respetan (0 o negativos = cisterna pendiente con aviso; antes piso de 0.5 día: 0 días daban 3 m³); ΔT ≤ 0 = calentador pendiente con aviso (antes piso de 5 K); la pendiente del colector se respeta y sólo sube, con aviso, a la mínima de IPC 2015 §704.1 para su diámetro (¼ in/ft hasta 2½", ⅛ de 3" a 6", 1/16 de 8" en adelante; antes piso de 0.5 % sin norma). Memoria y PDF dicen si la pendiente es la capturada o la mínima de norma. Proyecto fijo: sin cambio de cifras (1 día, 18 → 45 °C, 2 %) |
| 8 | 2.9.24 | H-198: CPVC sin los renglones de 2 1/2", 3" y 4" «SIN VERIFICAR» (CTS SDR-11 llega a 2"; la familia IPS queda pendiente de fuente); un tramo cuyo gasto no cabe en el mayor diámetro verificado queda fuera de catálogo con error visible (la hidráulica usa el tope sólo para mostrar el exceso); PEAD (diámetros genéricos sin SDR ni fuente) da error visible. Aguas abajo: quote v7 («Por cotizar») y la soportería sigue contando el tramo con el tope (dependencia registrada). Proyecto fijo: sin cambio de cifras (cobre) |

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

