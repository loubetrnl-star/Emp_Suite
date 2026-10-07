# Propuestas y decisiones pendientes del dueño · cierre de la auditoría del 28-sep-2026

Lo que una tarea AUD no pudo aplicar porque mueve un número, exige regenerar un esperado o subir `MOTOR_VER`,
toca código congelado o pide una decisión del dueño. Nada de esto está aplicado. Cada renglón dice qué número se
mueve, cuánto y bajo qué norma o criterio, y la prueba que lo fijaría.

## AUD-24 · hidro

### 24.2 · `muebleDe` con un id desconocido cuenta un WC con fluxómetro (PROPUESTA · mueve números)
- Hoy: `const muebleDe = (id) => MUEBLES.find((m) => m.id === id) || MUEBLES[0];` (`index.html`, función de hidráulica).
  Un mueble con id que ya no existe (proyecto viejo, archivo editado a mano) se calcula como `wc_flux`.
- Propuesta: un id desconocido no se supone: el renglón queda fuera del cálculo con aviso de error «mueble desconocido
  «<id>»: pendiente de captura» (regla 6 de `CLAUDE.md`, «nada se estima»; criterio de la casa, no hay norma).
- Qué se mueve: sólo en proyectos con ids desconocidos. Por cada uno, las unidades mueble bajan en las que la suite
  asigna a un WC con fluxómetro (10 en uso público, 6 en privado; tabla `MUEBLES`) y la presión mínima de 24.6 m (35 psi,
  IPC 2015 Tabla 604.3) deja de regir si sólo él
  la imponía; cambian gasto probable, diámetros, carga dinámica y bomba de esos proyectos. `MOTOR_VER.hidro` 10 → 11.
- Prueba que lo fijaría: proyecto con `{ id: "no-existe", cant: 1 }` y un lavabo; esperar `umTotal` del lavabo solo y
  un aviso `err` con «mueble desconocido».

### 24.3 · el id `lavaojos` cambió de significado sin migración (DECISIÓN DEL DUEÑO)
- Antes de H-195 (hidro v6): `lavaojos` era «Lavaojos / regadera de emergencia», 6 unidades mueble dentro de Hunter.
  Hoy es «Regadera de emergencia (con o sin lavaojos)», 20 gpm fijos fuera de Hunter; el lavaojos fijo es `lavaojos_solo`.
- Un proyecto anterior con `lavaojos` abre calculando una regadera de 20 gpm por pieza. Opciones:
  a) dejarlo así y marcar esas piezas «de la migración, sin confirmar» hasta que el usuario diga si son regadera o lavaojos
     (no mueve números; precedente H-306);
  b) migrarlas a `lavaojos_solo` (0.4 gpm) — mueve números: baja el gasto de emergencia 19.6 gpm por pieza;
  c) no hacer nada.

## AUD-14 · valores por omisión que quedan (PROPUESTAS · mueven números salvo donde se dice)
- **elec · hilos por omisión** (`cotizacionElec`, `index.html`: `String((E && E.sistema) || "3F4H-220")`, y `sistemaDe` que cae a
  3F4H-220 con una clave desconocida). En la pantalla el sistema siempre se captura con su selector (`defaultElec` nace en
  3F4H-220, visible), así que sólo actúa con un sistema vacío o inválido. Propuesta: sin sistema, «pendiente de sistema» en
  la cotización eléctrica y en el cálculo. Se mueve: conductores por fase y neutro (cantidades y costo de cable) sólo en esos
  proyectos; `MOTOR_VER.elec` 10 → 11. Criterio: regla 6 de `CLAUDE.md` (nada se estima).
- **aire · material por omisión** (`defaultAire().material = "aluminio"`, `index.html:7012`): un proyecto nuevo nace con la red
  en aluminio, que desde AUD-14 queda pendiente del DI del fabricante. Propuesta: nacer sin material (pendiente de material).
  No mueve cifras de proyectos guardados; cambia lo que muestra un proyecto nuevo. `MOTOR_VER.aire` sin cambio si sólo
  cambia el estado inicial (decisión del dueño).
- **aire · longitudes por omisión** (`index.html:7216`: `num(A.Lprincipal, 120)` y `num(A.Lramales, 90)`): con el campo
  vacío o nulo se suponen 120 m y 90 m. Propuesta: «pendiente de longitud» (regla 6). Se mueve: caída de presión, diámetros y
  metros cotizados de esos proyectos; `MOTOR_VER.aire` 6 → 7.
- **soporte · familia por omisión** (`computeSoporte` y `snapshotSoporte`: lo que no es cobre se soporta como acero en aire;
  `FU.tub || "acero_neg"` en contra incendio; `famSoporteAgua` cae a cobre). Propuesta: material no capturado = pendiente de
  material, como ya hace la tubería a mano desde AUD-14. Se mueve: espaciamiento y número de soportes de esos tramos;
  `MOTOR_VER.soporte` 14 → 15. Norma: la tabla de espaciamiento que ya usa soportería para cada familia.
- **quote · libro de la propuesta** (`buildPropuestaXlsx`, hoja MEMORIA_ELECTRICA): dice «de placa» para un MCA estimado porque
  `mcaEst` quedó en false desde AUD-14. DEPENDENCIA: es Cotización general (congelada); no mueve números.

## AUD-12 · cobertura de los proyectos fijos (PROPUESTAS · regeneran esperados)
Ninguna mueve una cifra del cálculo: amplían lo que R.1 y R.4 vigilan, y eso obliga a regenerar los esperados
(`node parches/regresion-motores/genera.mjs`), que la regla 3 de `CLAUDE.md` sólo permite con la versión que subió.
- `cifrasMotor("hidro")` sin drenaje ni agua caliente, y los dos proyectos fijos con cisterna 0: H-197 y AUD-18 no se ven
  en R.1/R.4. Propuesta: sumar diámetro del colector, UD de descarga y cisterna; un tercer caso con cisterna.
- `cifrasMotor("aire")` sin diámetros ni caída de la red: el efecto del cobre (H-218, AUD-03) sólo se ve de rebote en la
  cotización (congelada). Propuesta: sumar diámetros y ΔP por tramo.
- ΔP negativa de |ΔP| ≥ 5 Pa en el proyecto fijo 2 (hoy −3 Pa, que con el piso de 5 Pa da lo mismo que +3).
- Ramas de AUD-14 en los fijos: MCA/MOP estimados, aire en aluminio/inoxidable o sin material, soportería a mano sin
  material, hidro sin presión de la red ni altura (hoy sólo las cubren S.193–S.196).
- `S.site` y `S.sitioCarga` iguales en el fijo 2: un retroceso a leer el sitio de Proyecto no movería carga (H-290).
- Red contra incendio en cobre o CPVC para H-224 (el fijo 2 es acero).
- Quitar de R.4 la aserción vacía `!c.mcaEst && !c.mopEst` (desde AUD-14 siempre son falsos) o cambiarla por `placaRef`.

## AUD-19 · fuego (texto relacionado, no aplicado por alcance)
- El aviso «Con más de 12 m de altura hay que revisar si aplica protección en rack…» y la guía del campo (`fuego.altura`) usan
  el umbral de 12 m sin cita. Igual que la estática, NFPA 13 no está en `parches/normas-texto`: propuesta de declararlo
  «criterio de la casa sin fuente normativa» o pasar el texto de NFPA 13 al repositorio. No mueve números.

## AUD-20 · citas (lo que no se pudo cerrar)
- **20(d) · cotejo de la Tabla 604.3 con el texto base de ICC** (BLOQUEADO por texto): la única fuente en el repositorio es la
  transcripción de up.codes, edición adoptada por Connecticut (`parches/normas-texto/IPC-2015_Tabla-604.3_y_424.3_upcodes.txt`).
  Desde AUD-20 la salida lo dice («sin cotejar con el texto base de ICC»). Para cerrarlo hace falta el texto de ICC; si
  difiere, mueve las presiones mínimas por mueble y `MOTOR_VER.hidro`.
- **20(e) · lavaojos 0.4 gpm contra ANSI Z358.1-2014** (BLOQUEADO por texto del dueño): hoy se cita Z358.1-1990 vía cartas de
  OSHA (secundaria) y la salida ya dice «ratificar con Z358.1-2014». Falta que el dueño pase el texto (está en la lista de
  textos pendientes de `parches/normas-texto/README.md`).
- **20(c) · ediciones de ASTM B88 y ASME B36.10** (BLOQUEADO por texto): la salida dice «edición pendiente». Para dar la
  edición hacen falta los textos; no mueve números si coinciden con los DI de la fuente secundaria.
- **DEPENDENCIA (congelado)**: el libro de la propuesta (`buildPropuestaXlsx`) cita «NOM-001-SEDE» sin edición ni página en la
  hoja eléctrica y «IPC 2015 Tabla 604.3 (mínima por mueble)» sin el matiz de up.codes en hidro. No mueve números.

## AUD-04 · fuego · piso de 1 m² en la migración (PROPUESTA · mueve números en un caso de borde)
- `sanearEstado` (`index.html:24895`): `if (hS && hS.modo === "heredado") { s.fuego.area = Math.max(1, Math.round(geo.area)); … }`.
  Un proyecto anterior a H-264 con área heredada entre 0 y 0.5 m² abre con 1 m² inventado (queda marcado «sin confirmar»).
  El motor ya usa `Math.max(0, num(F.area, 0))` (`computeFuego`); el [a verificar] de AUD-04 se confirma sólo en la migración.
- Propuesta: `Math.max(0, Math.round(geo.area))`. Se mueve: en esos proyectos el área a proteger pasa de 1 m² a 0 m² (queda
  pendiente) y con ella el área de diseño, el gasto, la reserva y la bomba. `MOTOR_VER.fuego` 6 → 7. Criterio: regla 6 de
  `CLAUDE.md` (nada se estima). Prueba que lo fijaría: proyecto anterior con zonas que suman 0.3 m² y herencia → área 0.

## AUD-10 · quote · H-250 y H-251 sin declarar (DEPENDENCIA · congelado)
- Falta declararlos en `MOTOR_CAMBIOS.quote` y en el CHANGELOG, y un caso que compare importes con partida en USD y
  referencia fuera de California (S.44 prueba la conducta, no los importes). Todo es de la Cotización general: congelado
  hasta que el dueño lo abra. Por lectura de código: H-251 saca del Budget una referencia «Tijuana, Baja California» (pasa a
  «Por cotizar»); H-250 con USD sin fecha deja la moneda en MXN y agrega un pendiente, sin cambiar importes en MXN.

## AUD-08 y AUD-13 · CONGELADAS (constan en bitacora.md:25 y :31 como «siguiente etapa AUD-08/AUD-13»)
- AUD-08 (sellos que no ven la versión de los motores de los que se alimentan quote, kaizen y valor) y AUD-13 (alimentador
  de Kaizen con 1,350 MXN/m y 30 m sin fuente) siguen como estaban: son Cotización general y Kaizen.

## AUD-07 · DECIDIDA, congelada
- Decisión del dueño del 6-oct-2026: la cotización general será sólo la suma de las cotizaciones aceptadas de cada
  disciplina, sin lecturas en vivo. No se implementa hasta que el dueño la descongele (commit 3b79605).

## AUD-17 · aire · DECISIÓN DEL DUEÑO pendiente
- `enA1` compara con 35 °C la temperatura de SUCCIÓN del compresor; ISO 7183:2007 Tabla 2 (muestra en el repositorio) define
  A1 con 35 °C a la ENTRADA del secador y 25 °C de ambiente. La corrección del FAD «~5 % por bar» no tiene cita (sólo la
  hoja de pruebas la llama criterio de la casa). Fuera de A1 el secador queda con factor 1.0 y marcado «pendiente del fabricante».
- Opciones: (a) declarar las tres cosas «criterio de la casa sin fuente» en memoria y PDF, sin mover números; (b) dejar el
  secador «pendiente del fabricante» sin factor fuera de A1 (mueve la capacidad del secador cotizada) — `MOTOR_VER.aire`
  6 → 7; (c) capturar la temperatura de entrada al secador y comparar con ella (mueve qué proyectos caen en A1) — aire 6 → 7.

## AUD-23 · elec · cerrada por H-306 (sin cambio)
- La propuesta `cedula>elec` se retiró (H-306): ya no hay «volver a aceptar la cédula». El emparejamiento por nombre sólo vive
  en la migración única al abrir (`aceptarCargasElec`, llamada desde `recompute`) y su firma ya no se compara con nada. No se
  toca: cambiarlo movería las cifras que esa migración copia una vez.

## Estado al 7-oct-2026 (aprobaciones del dueño)
- Aplicadas: 24.2 (`eaafe40`, hidro 11), 24.3 opción (a) (`73be952`, sin versión), hilos en elec (`53396b5`, elec 11),
  longitudes de aire (`a8c898d`, aire 7), material de aire (`ae51c1d`, aire 8), piso de fuego (`3f08178`, fuego 7), cobertura
  de R.1/R.4 sólo con renglones nuevos (`f6b0eb4`).
- **AUD-17 opción (c): DETENIDA por la compuerta.** El esperado de la Cotización general (congelada) guarda los renglones de aire
  tal como salen: «Compresor de tornillo lubricado 20 HP · 2,430 L/min a 6.8 bar» (ya con la corrección de ~5 %/bar) y
  «Secador refrigerativo de 2.43 m³/min … corrección a 35 °C y 6.75 bar…» (con la temperatura de succión). La opción (c) cambia
  los dos (FAD a la presión de trabajo pendiente; temperatura de entrada al secador), así que cambia el esperado de un motor
  que no se está trabajando. Para seguir hace falta que el dueño autorice regenerar sólo el esperado de quote (sin tocar su
  código ni su versión) o que espere a descongelarla.
- **Familia por omisión en soportería: PROHIBIDA por ahora.** PAUSA.md:51 registra la orden del dueño de no tocar Estructural
  ni Soportería, y TAREAS-AUDITORIA-rev-2.9.24.md:14 la da por vigente para todo lo que no esté listado en la auditoría; esta
  propuesta no está en esa lista.
- Partes de AUD-12 no aplicadas (cambiarían valores existentes de los proyectos fijos): ΔP negativa ≥ 5 Pa, ramas de AUD-14,
  sitios distintos, red de incendio no acero.

## AUD-17 · DEPENDENCIA (registrada el 7-oct-2026)
- La opción (c) que eligió el dueño no se aplica: cambia el esperado de la Cotización general, que está congelada (renglones del
  compresor y del secador de aire), y además faltan los documentos que la harían trazable.
- Documentos que faltan:
  1. Tabla de corrección de capacidad del secador del fabricante, por temperatura de entrada y por presión de trabajo
     (ISO 7183 sólo define el punto A1: 35 °C, 7 bar(e)).
  2. Tabla de capacidad (FAD) del compresor del fabricante por presión de descarga, para sustituir la corrección de ~5 % por bar.
- Mientras tanto (commit de cierre): la memoria y el PDF de aire rotulan «criterio provisional, sin fuente» la comparación de
  la temperatura de succión contra los 35 °C de entrada de A1 y la corrección de ~5 % por bar (S.222). No cambió ningún
  esperado de ningún motor (verificado con genera.mjs).

## Cifras «antes» que faltaban (medidas el 7-oct-2026 sobre copias temporales de los commits anteriores)
- elec, sistema vacío (motor de 15 kW, 220 V, 3 fases, 30 m al tablero), en `73be952` (antes de `53396b5`): 32.389 kVA de
  demanda, 85 A en el alimentador, principal de 175 A, conductor 3 AWG, «1 juego × 4 hilos × 30 m» = 120 m de conductor por
  cotizar. Después: 0 kVA, nada dimensionado ni cotizado, sistema «dato pendiente».
- aire, material por omisión (600 L/min, 30 m de troncal y 20 m de ramales), en `a8c898d` (antes de `ae51c1d`): «Red de aire
  comprimido en aluminio calibrado tipo push-fit: diámetros pendientes (DI del fabricante)», 50 m × 1,171 MXN/m = 58,550 MXN.
  Después: sin importe, «Red de aire comprimido: pendiente de material».
