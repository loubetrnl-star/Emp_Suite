# Bitácora · independencia de motores (27-sep-2026)

Trabajo hecho desde la PAUSA (`801a326`, 26-sep-2026) hasta `63a2794`. Estado vigente y siguiente paso: **CONTINUACION.md**
(manda sobre este archivo, `PAUSA.md` y `RELEVO.md`). Reglas de trabajo: CLAUDE.md. Detalle de cada cambio de lógica:
CHANGELOG-motores.md y el cuerpo de cada commit.

## Decisión del dueño (27-sep-2026)
1. **Todos los motores independientes.** Cada disciplina calcula sólo con lo que el usuario captura en su pestaña; nada se
   hereda ni se lee en vivo de otra.
2. **Cruces sólo como propuesta aceptada.** Lo que viene de otra disciplina entra sólo si el usuario acepta la propuesta
   (instantánea con origen y fecha, regla 2) y, ya aceptada, no se mueve sola: si el origen cambia, la propuesta sale
   «desactualizada» y el usuario decide (regla 3).
3. **Regla 1 (herencia automática de geometría y ocupación) RETIRADA.** `HEREDA` queda vacío.
4. **Ventilación → carga térmica:** sólo el calor del motor del ventilador seleccionado (HP × 745.7 W, sensible) entra,
   como misceláneos, a la zona que el usuario elige al seleccionar. Nada más cruza entre las dos.
5. Contra incendio y obra civil autónomas («hay que dar entradas»); soportería cuantifica ductos y tuberías al aceptar la
   propuesta y, ya cuantificado, no se mueve; selección de equipo y eléctrico también independientes.
6. La carga de archivos (planos, Excel, bases de datos de planos o dibujos, catálogos) usa su metadata para iniciar el
   cálculo alimentando la captura propia de cada disciplina.

## Qué se hizo, por hallazgo
Cada hallazgo con su prueba escrita primero (falló por la conducta con el código anterior), un commit por hallazgo y los
dos bancos en verde. Las ramas por disciplina se integraron con merge sin fast-forward.

| Hallazgo | Motor | Qué | Commits | Pruebas | Banco al cerrar |
|---|---|---|---|---|---|
| H-262 | vent | Ventilación calcula con sus propios datos: área, altura y ocupantes se capturan en su pestaña (sin captura, «pendiente de captura»). Complemento: se retira la propuesta load>vent (proponía cambios/h sobre un volumen de respaldo de 1 m² × 0.1 m). vent 3 → 4 | `c95c093`, `990b9de` | S.98; reescritas 3.2–3.6, 9.1, S.58 | 505/505 · 511/511 |
| H-263 | load | El ventilador seleccionado en Ventilación entra a la zona elegida como «Misceláneos · Ventilación <modelo>» (HP × 745.7 W, sensible, íntegro). Complemento: el HP se declara ESTIMADO de catálogo (punto medio, rendimiento 0.65, +15 %, ¼ HP; ratificar con el submittal de fábrica); sellos, deshacer, gráfica y trazado de origen al día. load 5 → 6 | `c4b2fdb`, `e0e1cf4` | S.99; S.36 al día; mutante load.m87 | 505/505 · 511/511 |
| H-264 | fuego | Contra incendio autónomo: área a proteger y altura al rociador más alto capturadas; sin herencia ni cruce load>fuego. Complemento: el texto de captura propia pasa a la guía. fuego 3 → 4 | `5f8dfc4`, `969f6d9` | S.100; reescritas 3.2–3.6, 9.1, S.18, S.58, S.98; mutante fuego.m33 (sustituye a m14) | 507/507 · 513/513 |
| H-265 | civil | Obra civil autónoma: áreas de obra y cuartos clasificados capturados en su pestaña; sin zonas ni cuartos limpios (cruces load>civil y clean>civil retirados); sin altura ya no se suponen 2.8 m. civil 5 → 6 | `2afdd81` | S.101; reescritas 13.6, Q.7, S.13, S.18, S.78, S.79, GB.5 | 507/507 · 513/513 |
| H-266 | soporte | Soportería autónoma: sin instantánea aceptada cuenta sólo lo capturado; altura de trabajo, altura de la estructura y bases capturadas; sin conteo en vivo; se cierra la fuga de 30 + 12 m supuestos de la red contra incendio. soporte 11 → 12 | `fcda936` | S.102; mutantes soporte.m55 (sustituye a m43) y m56 | 508/508 · 514/514 |
| H-268 | elec | Eléctrico autónomo: las cargas de otros motores entran sólo como propuesta `cedula>elec` aceptada (instantánea); se retiró el modo en vivo (`tomarHVAC`); quitar un permiso ya no saca cargas. elec 8 → 9 | `bd86822` (merge `0154b27`) | S.103; reescritas 4.5, M.1, M.2, M.4, Q.5, S.25, S.35, S.36, S.48, S.50, S.52; mutantes elec.m140 y m141 | 509/509 · 515/515 |
| H-272a | civil | La carga de archivos alimenta la captura propia de obra civil: cada espacio del plano o renglón del Excel es un renglón de áreas o cuartos con su origen; ya no escribe totales a mano ni apaga `usarZonas` | `71ae636` | S.120 | 509/509 · 515/515 |
| H-272b | archivos | Reaplicar un archivo no duplica (clave archivo + dato, huella del contenido); no pisa lo editado; quitar el archivo avisa dónde quedaron sus datos; tope de trazado 30 → 300 | `41fceb1` | S.121 | 510/510 · 516/516 |
| H-272c | archivos | Nada se supone al cargar: la zona entra sólo con lo rotulado; sin clase ISO el cuarto queda pendiente y sin marcar; área a proteger = suma de los espacios; altura = la del cuarto más alto; aire sin columna de cantidad = 1 por renglón | `4ae6d2a` | S.122 | 511/511 · 517/517 |
| H-272d | archivos | Un levantamiento alimenta a varias disciplinas (civil, carga, limpios, contra incendio, ventilación, soportería), cada una a su captura propia; eléctrico lee HP y FP | `3bab099` | S.123 | 512/512 · 518/518 |
| H-272e | archivos | Catálogos y listas de precios quedan como referencia consultable (marca, modelo, capacidad, precio con moneda y vigencia; archivo, hoja o página y fila); no entran solos a ningún motor | `781089e` | S.124 | 513/513 · 519/519 |
| H-272f | archivos | Los entregables (memoria integral y libro, ES/EN) distinguen lo que entró solo al cargar de lo que aceptó el usuario, con archivo, página o fila | `4ba009e` (merge `f6992a8`) | S.125 | 514/514 · 520/520 |
| H-270 | elec | Diagrama unifilar en pantalla y memoria PDF, descrito desde computeElec; lo no capturado no se dibuja y se lista como pendiente. No mueve cifras | `ef7a41e` | S.150; mutante elec.m142 | 509/509 · 515/515 (rama) |
| H-271 | elec | Diagrama trifilar: bajadas por fase, neutro y tierra como las cuenta computeElec; lo que no distingue queda pendiente. No mueve cifras | `e1bbab8` (merge `ded0180`) | S.151; mutante elec.m143 | 510/510 · 516/516 (rama) |
| H-267 | equip | Selección de equipo autónoma: calcula sólo con sus zonas de selección (capturadas o aceptadas de carga térmica con la propuesta nueva `load>equip`); sale del núcleo térmico; zona sin perfil horario deja la simultaneidad pendiente. equip 1 → 2 | `2d953a9` (merge `c7b846d`) | S.104; reescritas 2.0.7, S.13, S.18, S.36, S.69, S.103; mutantes equip.m1–m4 | 518/518 · 524/524 |
| H-269a | elec | Cuantificación de materiales propia (`materialesElec`): conductores por calibre y función, canalización, protecciones, tablero y transformador; lo que el motor no da queda pendiente. No mueve cifras | `12a1146` | S.152; mutantes elec.m144 y m145 | 519/519 · 525/525 |
| H-269b | elec | Consideraciones de cálculo (`consideracionesElec`): cada parámetro con su valor y de dónde sale; 28 secciones de la NOM-001-SEDE-2012 citadas con página del DOF sólo con su texto en `parches/normas-texto/` (sin texto: BLOQUEADO). No mueve cifras | `c28ddeb` (merge `a3803da`) | S.153; mutantes elec.m146 y m147 | 520/520 · 526/526 |
| H-277 | elec | Memoria, PDF y libro dicen la temperatura ambiente con la que se calculó (sin captura 30 °C; antes imprimían 40 °C). Una sola función, `tempAmbDe`. No mueve cifras | `6b31f85` | S.154; mutantes elec.m148 y m149 | 521/521 · 527/527 |

Cierre: `63a2794` (CONTINUACION.md, punto de retome). Pruebas nuevas: S.98–S.104, S.120–S.125, S.150–S.154.

## Versiones de motor al cierre
load 6 · clean 3 · equip 2 · duct 4 · vent 4 · quote 24 · valor 1 · kaizen 1 · elec 9 · hidro 8 · fuego 4 · aire 5 ·
civil 6 · soporte 12.

Subieron: vent 3 → 4 (H-262), load 5 → 6 (H-263), fuego 3 → 4 (H-264), civil 5 → 6 (H-265), soporte 11 → 12 (H-266),
elec 8 → 9 (H-268), equip 1 → 2 (H-267). H-269a/b, H-270, H-271 y H-277 no mueven cifras (elec sigue en 9; filas
«9 (sin cambio)» en CHANGELOG-motores.md). H-272a–f cambian lo que se captura desde un archivo, no cómo se calcula:
ningún motor sube. En el proyecto fijo de regresión ningún esperado cambió de cifras: se regeneraron sólo de versión.

## Migraciones de proyectos guardados (misma cifra al abrir)
Criterio común: un proyecto guardado se migra UNA vez al abrirlo y abre con las mismas cifras; desde ahí ya no sigue a
la otra disciplina.
- **Ventilación (H-262) y contra incendio (H-264):** conservan los valores que ya tenían copiados; `sanearEstado` retira
  los registros de herencia (`her.*`). En el proyecto fijo, contra incendio captura 700 m² y 6 m (lo que la herencia le
  imponía al abrir).
- **Carga térmica (H-263):** `z.miscVent` y `vent.seleccion` se completan en null; sin selección, sin cambio.
- **Obra civil (H-265):** se copian al abrir las zonas con área y los cuartos limpios con área, con los perímetros que ya
  tenían capturados.
- **Soportería (H-266):** alturas con el valor que usaban; si contaban en vivo, se toma la instantánea de lo que
  contaban; a mano sin bases, las bases que contaban.
- **Eléctrico (H-268):** un proyecto en vivo acepta una vez sólo las filas de los cruces que tenía autorizados
  (fixture con todos los cruces: 165.70 kVA antes y después; sólo equip>elec: 83.46 kVA antes y después); `tomarHVAC`
  queda apagado; el sello dice «el motor cambió (v8 → v9)».
- **Selección de equipo (H-267):** sin zonas de selección, acepta una vez la instantánea de carga térmica con fecha y
  vínculo, sin conceder el cruce (proyecto fijo: 16.8989 TR objetivo, 19.8518 TR instalada, sin cambio).
- **Sellos:** un proyecto sellado antes abre con cotización, Kaizen e ingeniería de valor en «desactualizado · la captura
  cambió» aunque ninguna cifra se mueve. Decisión pendiente del dueño (CONTINUACION.md §5): subir quote a v25
  «(dependencia)» para que diga «el motor cambió».

## Textos de norma que siguen bloqueados
Sin texto en `parches/normas-texto/` ni fuente pública con URL (regla 4): SMACNA DCS (H-168, H-227), NFPA 13
T17.4.2.1(a) (CPVC de incendio, H-224), NFPA 96 (ratifica H-165), Carrier Parte 1 Tabla 20A (ratifica H-120 y H-141),
ANSI Z358.1 (ratifica H-195), AISC 360, CFE MDOC viento y sismo, NTC sismo. Las 28 secciones de la NOM-001-SEDE-2012
que cita H-269b tienen su texto (DOF 29-nov-2012). El HP del ventilador de H-263 es ESTIMADO de catálogo: se ratifica
con el submittal de fábrica (no es norma).

## Decisiones que quedan con el dueño
Listadas en CONTINUACION.md §5: sellos (quote v25), H-268 (migración parcial; permisos que ya no mueven el cuadro),
H-272 (aire sin columna de cantidad, clase ISO, planta con varios espacios, tensión desde archivo, quitar un archivo),
H-270/H-271 (neutro en `selConductor`, segunda fase en monofásico, circuitos repartibles), H-267 (perfil horario, SHF
0.85, preselección `r.eq`, conservar ediciones al volver a aceptar), H-269 (ramales por unidad, polos y neutro,
neutro en 3F3H, espacios y accesorios). Siguen abiertas las de H-134, Estructural/Soportería y H-233.

## Lo que sigue
La cola de CONTINUACION.md §6, una tarea a la vez, por criticidad:
1. Revisión adversarial de H-264…H-266 → complementos (`continuacion/flujos/01-revision-h264-h266.js`).
2. Inventario de lecturas en vivo que quedan (clean, duct, aire, hidro, quote, valor, kaizen, load) → H-274 en adelante
   (saltando los reservados H-273, H-275, H-276; lo nuevo desde H-278).
3. H-273 mutantes de ventilación (parcial en `continuacion/parciales/H-273-vent-mutantes.patch`) y documentación de relevo.
4. Auditoría contra las reglas de la casa.
5. Contenido de entregables PDF/Excel verificado con Python.
6. Flujos de usuario de punta a punta en Chromium.
7. Recorrido visual claro/oscuro/celular.
8. Oráculo en Python de vent, fuego, civil y soporte.
9. Mutantes de civil y load (H-275, H-276).
10. Cascada de módulos (acordeón en la ventana principal, sin paneles laterales).
11. Inventario de normas pendientes para el dueño.
12. Lector de archivos probado con archivos reales.

Después: ofrecer un renglón de catálogo como equipo seleccionado (H-272e, ya sin la espera de H-267); aislar el estado de
18.10/18.16 para correr bancos en paralelo; H-134; decisión Estructural/Soportería; bloques 5a–5e; quitar la pestaña
«Cuartos limpios» (preguntar antes).
