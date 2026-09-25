# CHANGELOG por motor · SuiteEmp

Cada motor lleva su propia versión (`MOTOR_VER`); sólo sube cuando cambia su lógica de cálculo. Los cambios de interfaz, textos y documentos no la tocan y viven en las bitácoras de cada revisión (`Bitacora-rev-*.md`). Un proyecto sellado con una versión anterior de un motor abre «Desactualizado» sólo en esa disciplina, con el hallazgo que lo movió; al recalcular, la memoria muestra el antes y el después.

Generado desde `MOTOR_VER` y `MOTOR_CAMBIOS` de index.html (rev 2.9.23).

## Carga térmica (`load`) · v5

| Versión | Rev | Hallazgo / cambio de lógica |
|---|---|---|
| 1 | 2.9.15 | lógica de partida |
| 2 | 2.9.20 | zonas con control de humedad se diseñan con dos casos ASHRAE (enfriamiento y deshumidificación) |
| 3 | 2.9.21 | cuarto limpio con presión positiva sin infiltración; unidad de aire exterior dedicada + serpentín seco (ADP desde la latente interna); crédito sensible del aire exterior topado en deshumidificación; cambios por hora obligatorios; calor del ventilador Q·ΔP/η. Declarada en la rev 2.9.24 (H-107): la 2.9.21 movió estas cifras sin subir la versión |
| 5 | 2.9.24 | H-141 (decisión (a) del dueño, 22-sep-2026): la diversidad del edificio se aplica una sola vez, en el objetivo de planta (`userDiv`); las ganancias internas de cada zona (ocupantes, iluminación, equipo) van al pico sin el factor. Antes se multiplicaban también en la zona: con 0.8 el objetivo quedaba ×0.713. Criterio Carrier (HAP), ratificar con el texto de la Parte 1. Proyecto fijo (bldDiv 1): sin cambio de cifras |
| 4 | 2.9.24 | H-120: el DET de muros y cubierta se corrige por la condición de diseño del sitio, (25.6 − ti) + (tm − 29.4) K con tm = to − rango/2 (corrección CLTD, ASHRAE Fundamentals 1997 cap. 28, texto secundario; ratificar con Carrier Parte 1 Tabla 20A). Tijuana +0.31 K; Mexicali +9.01 K |

## Cuartos limpios (`clean`) · v3

| Versión | Rev | Hallazgo / cambio de lógica |
|---|---|---|
| 1 | 2.9.15 | lógica de partida |
| 2 | 2.9.16 | sin pisos de 1 m² ni 2.2 m; 5 Pa de ISO 14644-4 con aviso; ceros capturados respetados |
| 3 | 2.9.24 | H-127: se respeta el signo de la presión diferencial capturada (un cuarto de contención va en negativa: EU GMP Anexo 1 (2022) §4.14, texto en parches/normas-texto); antes −10 Pa se volvían +5 Pa y el Excel imprimía «5 · Capturado». Piso de 5 Pa y fuga por rendijas sobre \|ΔP\|; `dPcap`, `dPneg`, `dPsigno` en el resultado; memoria, PDF y Excel imprimen el signo y citan los 10 Pa guía del Anexo 1. Proyecto fijo (positiva): sin cambio de cifras |

## Selección de equipo (`equip`) · v1

| Versión | Rev | Hallazgo / cambio de lógica |
|---|---|---|
| 1 | 2.9.15 | lógica de partida |

## Ductos y calibres (`duct`) · v1

| Versión | Rev | Hallazgo / cambio de lógica |
|---|---|---|
| 1 | 2.9.15 | lógica de partida |

## Ventilación (`vent`) · v3

| Versión | Rev | Hallazgo / cambio de lógica |
|---|---|---|
| 1 | 2.9.15 | lógica de partida |
| 2 | 2.9.24 | H-154 + H-156: la cobertura real manda en la selección Greenheck (cfmMin ≤ objetivo ≤ cfmMax, sin la tolerancia ×0.9); la familia propia del modo sólo ordena entre los que cubren (luego el de menor caudal nominal); si nadie cubre no hay modelo (`primary` null: nada llega a propuesta, memoria integral ni eléctrico) y `closest` sólo alimenta el aviso. Proyecto fijo: 11,643 CFM → CSW-30 (7,000–18,000) en vez de GB-360 (4,000–9,000) con «ningún modelo cubre» |
| 3 | 2.9.24 | H-155: sin medidas no hay caudal: campana sin largo o fondo y rejilla sin ancho, alto, área libre o velocidad de cara dan demanda 0 con aviso de error en el motor y la matriz (antes pisos de 0.1 ft, 5 % y 100 fpm fabricaban 30 y 258 CFM y sus partidas). `avisos` en el resultado de computeVent. Proyecto fijo: sin cambio |

## Cotización (`quote`) · v16

| Versión | Rev | Hallazgo / cambio de lógica |
|---|---|---|
| 1 | 2.9.15 | lógica de partida |
| 2 | 2.9.16 | red hidráulica por diámetro con precio capturado; sin 50 m supuestos; partidas pendientes |
| 3 | 2.9.19 | tramo con longitud y sin unidades mueble queda pendiente |
| 4 | 2.9.23 | precio de tubería por renglón con origen (referencia de mercado o proveedor local), IVA desglosado y por metro; sin precio: partida Por cotizar en el Budget, bloqueo sólo en la formal |
| 5 | 2.9.23 | precios en USD sólo se convierten con tipo de cambio capturado con fecha; sin fecha salen Por cotizar y bloquean la formal (nada se estima) |
| 15 | 2.9.24 | dependencia de soporte v8 (H-229): más soportes de cobre con los claros MSS/IPC |
| 16 | 2.9.24 | dependencia de civil v4 (H-243): muro clasificado y media caña por cuarto limpio. Proyecto fijo: directo 10,558,140.85 → 10,807,890.51 MXN |
| 14 | 2.9.24 | dependencia de soporte v6 (H-226): el anclaje va Por cotizar mientras no haya SDS con fuente, estructura y f'c |
| 13 | 2.9.24 | dependencia de soporte v5 (H-225): sin altura de colgado la varilla sale pendiente, no cotizada |
| 12 | 2.9.24 | dependencia de vent v2 (H-154): la partida de ventilación nombra el modelo que cubre de verdad, o ninguno |
| 11 | 2.9.24 | dependencia de aire v5 (H-218): la partida de la red declara «diámetros indicativos: DI del fabricante pendiente» en aluminio e inoxidable |
| 10 | 2.9.24 | dependencia de aire v3 (H-215): la partida del secador lleva la capacidad nominal de ISO 7183 A1 y declara si la corrección del fabricante queda pendiente |
| 9 | 2.9.24 | H-206: la bomba contra incendio y su reserva no llevan precio fijo (385,000 MXN + 9,500 MXN/m³ sin fuente ni fecha): van «Por cotizar» (sección D) con capacidad (gpm y L/min), presión, potencia y volumen (m³ = L/min × min) declarados; con red municipal que alcanza no hay bomba ni reserva. `QUOTE_SEED.bombaFuego` y `cisternaM3` retirados. Proyecto fijo: −1,697,446.66 MXN directos |
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

## Contra incendio (`fuego`) · v3

| Versión | Rev | Hallazgo / cambio de lógica |
|---|---|---|
| 1 | 2.9.15 | lógica de partida |
| 2 | 2.9.16 | sin área no hay demanda, bomba ni reserva; área mínima de operación NFPA 13 con aviso |
| 3 | 2.9.24 | H-205: la altura que contra incendio hereda de las zonas es la MÁXIMA (rociador más alto), no la media ponderada por área (que sigue para ventilación, que trabaja por volumen): estática y presión requerida al rociador más alto, aviso de almacenamiento en rack con la altura real, campo «Altura libre al rociador más alto». Proyecto fijo: 4.71 → 6 m, presión requerida +1.29 m (37.815 → 39.105 m), 35 HP sin cambio |

## Aire comprimido (`aire`) · v5

| Versión | Rev | Hallazgo / cambio de lógica |
|---|---|---|
| 1 | 2.9.15 | lógica de partida |
| 2 | 2.9.16 | sin demanda no se cuentan unidades |
| 3 | 2.9.24 | H-215: secador por ISO 7183:2007 Tabla 2 opción A1 (entrada 35 °C, 7 bar(e), 100 % del caudal): capacidad = todo el caudal del compresor (n × FAD real) a la capacidad nominal, factor 1.0; fuera del punto A1 la norma no da factores: la corrección es del fabricante y queda pendiente con aviso (antes FAD requerido / (0.92 × (0.9 + 0.03/bar)) de memoria, que en el propio punto de catálogo sobredimensionaba ×1.21). Proyecto fijo: secador 2.46 → 2.43 m³/min; kW de operación y energía siguen la capacidad nueva. Cifras de regresión: entra `secador` |
| 4 | 2.9.24 | H-216: el tanque pulmón no se trunca a 5,000 L en silencio: si el teórico rebasa el mayor de la lista comercial de la casa se instalan varios de 5,000 L en paralelo (capacidad instalada ≥ teórica; `tanqueUnit`, `nTanques`), con aviso; memoria, PDF, pantalla y partida lo declaran (13,103 L → 3 × 5,000 = 15,000 L; antes 5,000 L y «se sube al comercial inmediato superior»). Proyecto fijo: sin cambio (3,000 L). Cifras de regresión: entra `nTanques` |
| 5 | 2.9.24 | H-218: el diámetro interior es del material: cobre tipo L con los DI de ASTM B88 (los mismos de `TUB_AGUA.cobre`; 55 m de cobre: 1" → 1 1/4"), acero con cédula 40 (ASME B36.10), aluminio e inoxidable con cédula 40 sólo como indicativo y el DI real del fabricante pendiente (aviso, memoria, PDF, pantalla y partida). Proyecto fijo (aluminio): sin cambio de cifras, con la pendencia declarada |

## Obra civil (`civil`) · v4

| Versión | Rev | Hallazgo / cambio de lógica |
|---|---|---|
| 1 | 2.9.15 | lógica de partida |
| 2 | 2.9.16 | sin área clasificada no hay partidas de área clasificada |
| 3 | 2.9.19 | un cuarto limpio vacío no cuenta como área clasificada |
| 4 | 2.9.24 | H-243 (criterio de la casa, PLAN-CRITICOS §Fase 3): muro clasificado y media caña CUARTO POR CUARTO: perímetro capturado en la pestaña de obra civil o, sin captura, rectángulo 3:2 del área del cuarto declarado «estimado» en la partida (ES/EN) × la altura del cuarto; antes el desarrollo de todo el edificio × fracción de área limpia, entre la altura media de todas las zonas. El muro no clasificado sigue con la fracción de área. Proyecto fijo (cuarto de 120 m² × 3 m): muro clasificado 73.32 → 134.16 m², media caña 31.11 → 89.44 ml; total 3,348,872.39 → 3,598,622.05 MXN |

## Soportería (`soporte`) · v9

| Versión | Rev | Hallazgo / cambio de lógica |
|---|---|---|
| 1 | 2.9.15 | lógica de partida |
| 2 | 2.9.16 | renta de elevación sólo con algo que montar |
| 3 | 2.9.24 | H-232 (política de pisos 2.9.16): 0 meses de renta capturados se respetan (sin partida) y sin captura la renta queda pendiente (aviso en el motor y pendiente en la cotización); `defaultSoporte().mesesElevacion` pasa de 3 a null. Antes el 0 se volvía 1 mes y la omisión 3. Proyecto fijo (3 meses capturados): sin cambio |
| 4 | 2.9.24 | H-231: en modo gobernado (instantánea motores>soporte aceptada) las bases de equipo salen de `snap.nEquip` (equipos cotizados + unidades de aire al tomar la instantánea); antes el conteo en vivo sumaba 0 unidades de aire del sustituto y perdía el compresor (3 → 2 bases, −18,500 MXN). Proyecto fijo (en vivo): sin cambio |
| 5 | 2.9.24 | H-225 («nada se estima»): campo «Altura de colgado (m)» en pantalla; sin captura la varilla roscada queda pendiente (aviso en el motor, pendiente en la cotización; la altura de trabajo sólo se sugiere). Antes se tomaba la altura de trabajo: 7.2 m por varilla, 633.6 ML = 41,184 MXN en el proyecto fijo. Proyecto fijo: 385,760 → 344,576 MXN |
| 6 | 2.9.24 | H-226 («nada se estima»): SDS del sitio con su fuente, tipo de estructura y f'c se capturan en pantalla; sin ellos SoporteCalc predimensiona con valores de referencia DECLARADOS (SDS 1.0, losa f'c 250; las fórmulas no cambian) y el anclaje va «Por cotizar» (sección G) con sus piezas; la memoria imprime Fp, SDS (capturado o de referencia), Ip, ap, Rp, z/h y el aviso «ap y Rp son valores DECLARADOS». Antes SDS 1.0 / losa / f'c 250 se afirmaban como datos. Proyecto fijo: 344,576 → 336,216 MXN |
| 7 | 2.9.24 | H-230 («nada se estima»): el modo «valores propios» pide ancho y alto del ducto, y diámetro y material (acero / cobre / termoplástico) de cada tubería capturada a mano; sin ellos la línea no se cuenta ni se cotiza y queda pendiente (aviso en el motor, pendiente en la cotización); la memoria dice que las medidas son capturadas a mano. Antes se inventaban 400×300 mm y 50 / 100 / 32 mm de acero y la memoria los imprimía como calculados. Proyecto fijo (modo motores): sin cambio |
| 8 | 2.9.24 | H-229 (decisión 4 del dueño): claros de cobre = mínimo de ANSI/MSS SP-58-2018 (reproducción PHD, URL en el código) e IPC 2009 Tabla 308.5 (folleto MCP, URL): ½"–¾" 1.524 m, 1"–1¼" 1.829, 1½"–2" 2.438, 2½" 2.743, 3"–4" 3.048 (antes 1.8 / 2.4 / 3.0 / 3.7 m sin fuente). Secundarias declaradas en la memoria; ratificar con el texto. Proyecto fijo (cobre): más soportes |
| 9 | 2.9.24 | H-228: claros del termoplástico por subtipo, IPC 2009 Tabla 308.5 (folleto MCP, secundaria; URL en el código): CPVC ≤ 1" 0.9 m (decisión del dueño, más cerrado que 3 ft) y ≥ 1¼" 1.219 m (antes 1.2 hasta 3" y 1.8 arriba); PP-R ≤ 1" 0.813 m y ≥ 1¼" 1.219 m (antes la tabla de CPVC); PEAD no tiene renglón (la tabla sólo lista PE-AL-PE y PEX): queda pendiente de claro, no se cuenta ni se cotiza. El subtipo viaja en la instantánea motores>soporte (`hidroSub`) y el modo a mano pide CPVC / PP-R / PEAD. Cada soporte de termoplástico lleva ancla (misma selección ACI 318-19 y la compuerta H-226) y 4 tuercas + 4 rondanas, el criterio del despiece (antes 0 / 0). Proyecto fijo (cobre): sin cambio |

