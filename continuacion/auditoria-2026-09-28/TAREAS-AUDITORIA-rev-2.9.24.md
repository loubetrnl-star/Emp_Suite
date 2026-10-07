# TAREAS · Auditoría de independencia y cifras · rev 2.9.24

Para: Claude Code (quien escribe el código) · De: auditoría de solo lectura (Cowork, 28-sep-2026)
Base revisada: `master` en `801a326` (PAUSA), entradas nuevas desde `af5894f` (Bitacora-rev-2.9.24.md).
Bancos al revisar: `node pruebas.mjs index.html` → 503/503; con `--base respaldo-rev-2.9.8/index-2.9.21-inicio-20260921-221100.html` → 509/509.

## Cómo trabajar estas tareas
- Aplican TODAS las reglas de `CLAUDE.md`: prueba primero con el ID, un commit por tarea, `MOTOR_VER` + `MOTOR_CAMBIOS` + `CHANGELOG-motores.md` + esperado si mueve números, nada de memoria, nada se estima, espejo `L(es, en)`.
- Encabezado de commit sugerido: `AUD-nn · motor · qué`.
- Las líneas son de `index.html` en `801a326`; si se movieron, localiza por el nombre de función indicado.
- Las marcadas **[a verificar]** se confirman primero; si resultan falso positivo se retiran con evidencia (regla 5), no se «corrigen».
- Las marcadas **[DECISIÓN DEL DUEÑO]** no se implementan sin respuesta de Rodrigo: pregúntale primero.
- Regla del dueño que manda sobre todo: cada motor es independiente (calcula, memoria, cotización y Excel propios); cruces sólo como propuesta aceptada congelada con origen y fecha; geometría (área, altura, volumen, personas) se hereda; **Selección de equipo sin ningún vínculo con Ductos**, ni en vivo ni como propuesta. Excepción: acoplamiento load/clean/equip en cargas.
- No tocar Estructural ni Soportería fuera de lo listado aquí (orden vigente en PAUSA.md). H-134 sigue en pausa.

---

## P1 · Independencia entre motores

**AUD-01 · equip · quitar el vínculo Selección ↔ Ductos** (preexistente, viola regla del dueño)
- `ENTRADAS.equip` l.18247 incluye `duct: ENTRADAS.duct()`; permiso `"duct>equip"` l.4318; uso en l.11196 (`DUCT.path` en selección); botón «Autorizar ductos → selección» l.19789-19790.
- Hacer: eliminar las tres cosas; la presión estática para selección se captura en la propia pestaña.
- Efecto colateral: `ENTRADAS.elec` hereda `equip` → deja de depender de `S.duct`.
- Aceptación: prueba que cambia `S.duct` y verifica que `huellaMotor("equip")` y `huellaMotor("elec")` no cambian y que el resultado de selección es idéntico. Sube `MOTOR_VER.equip`.

**AUD-02 · tablero · la carga automática (commit 51ca095) mete datos sin aceptación**
- `cxzProcesarFila` l.15426 aplica filas al terminar de leer el archivo; `cxzRevisar` l.15476-15478 reprocesa (riesgo de aplicar dos veces la misma fila y duplicar cantidades).
- `pdfOrigenArchivos` l.14660: el texto dice «aceptado» (l.14672-14674) para datos que entraron solos.
- Hacer: las filas quedan como propuesta; sólo se aplican al aceptar (copia congelada, origen, fecha). Reproceso idempotente (huella de fila aplicada). Texto del PDF veraz.
- Aceptación: prueba que carga un archivo y verifica que el estado no cambia hasta aceptar; prueba de doble proceso sin duplicar.

**AUD-03 · aire · no usar la tabla de cobre de hidro** (H-218)
- `computeAire` l.7053 lee `TUB_AGUA.cobre.d` (tabla de hidro, l.10420-10421).
- Hacer: tabla propia de DI de cobre tipo L en aire, con su cita. Prueba que fije esos DI dentro de aire.

**AUD-04 · fuego · área de carga térmica leída en vivo** (H-205)
- `computeFuego` l.10802-10807 usa `totals().area` con `linkAllowed("load>fuego")`, no declarado en `ENTRADAS.fuego`.
- Hacer: tomar el área por la herencia congelada (`HEREDA`) o declararla en `ENTRADAS.fuego`. Copiar `hazen()` al bloque de fuego (hoy es de hidro). Revisar el piso `Math.max(1, …)` de `HEREDA["fuego.area"]` l.17437 **[a verificar]**.

**AUD-05 · elec · quitar el modo en vivo de los hp de otros motores** (H-178)
- l.10074-10085: `hpRef/hpRefOrigen` desde `AIRE.principal.hp`, `HIDRO.hpBomba`, `FUEGO.hpBomba`; existe modo congelado al aceptar, pero se conserva el modo vivo.
- Hacer: sólo el modo congelado (propuesta aceptada).

**AUD-06 · soporte · lecturas fuera de la instantánea** (H-231) **[a verificar]**
- `snapshotSoporte` l.17508 / `computeSoporteGobernado` l.17558: el conteo de bases lee `S.quote.items` y `AIRE.totalUnidades` en vivo.
- Hacer: que todo el camino use la instantánea aceptada o que quede declarado en `ENTRADAS.soporte`.

**AUD-07 · quote · cotización central que lee todos los motores en vivo** **[DECISIÓN DEL DUEÑO]**
- `computeQuote` lee HIDRO, AIRE, ELEC, etc.; `ENTRADAS.quote` agrega 10 motores. Contradice «cada motor genera su cotización por sí solo».
- Propuesta: cada motor emite sus partidas; la cotización general sólo las suma como propuesta aceptada. Es cambio de arquitectura: preguntar antes.

## P2 · Números que se mueven sin declararse

**AUD-08 · sellos · implementar «sube la versión del motor del que se alimenta»**
- Hoy el sello sólo compara `S.sellos[id].ver !== motorVer(id)`; `ENTRADAS` hashea entradas, no versiones aguas arriba.
- Evidencia: H-120 movió equip/quote/valor/kaizen; H-178 movió quote/valor; H-194 movió quote (cisterna 29,000 → 36,250 MXN); H-216 cambió la partida del tanque; H-198 recalculó CM.soporte.7. Ninguno subió la versión del consumidor → proyecto viejo abre «vigente» con otras cifras.
- Hacer: incluir las `MOTOR_VER` de los motores de los que se alimenta en la huella del consumidor (quote, soporte, elec, valor, kaizen), o subir la del consumidor. Declarar H-194 y H-216 en `MOTOR_CAMBIOS.quote`.
- Aceptación: prueba que sube la versión de hidro y verifica que quote queda «Desactualizado».

**AUD-09 · clean/load · H-126 y H-128 sin subir versión** **[a verificar]**
- H-126: traspaso de reposición por vínculo de id (`asegurarIdsZona` l.9025, ids asignados al leer; puede alterar la huella de load). H-128: zonas nacen en 0.
- Hacer: demostrar con un caso si mueven cifras; si sí, subir `clean`/`load` y registrar.

**AUD-10 · quote · H-250 y H-251 sin subir versión** **[a verificar]**
- H-250 (USD sólo con `fxVigente()`, l.4725) y H-251 (California como origen) pueden cambiar qué partidas entran y los totales. El fixture no los ejercita.
- Hacer: caso con partida en USD y referencia no California; si mueven importes, subir `quote`.

**AUD-11 · elec · H-180 cambia resultados fuera de [0.5, 1]**
- l.10106-10109, 10120, 22331: fp < 0.5, > 1 o 0 ahora cae al valor de la casa (antes se limitaba).
- Hacer: declararlo en `MOTOR_CAMBIOS.elec` (o subir versión si se considera cambio numérico).

## P3 · Cobertura del proyecto fijo de regresión

**AUD-12 · segundo proyecto fijo que ejercite las ramas corregidas**
- Versiones que subieron sin que el esperado cambiara: elec 4→7 (H-183, H-177, H-179), load 4→5 (H-141), vent 2→3, clean 2→3, duct 1→4, hidro 5→8 (H-195, H-197, H-198), aire (H-218), soporte 2→11 (H-224, H-228…H-232), quote 17→20 (H-252…H-254).
- El proyecto nuevo debe incluir: motor con MCA/MOP, aluminio, protección > 300 A, sin distancia ni transformador, cédula aceptada; factor de edificio ≠ 1; ΔP negativa y < 5 Pa; ducto de grasa; selección de ventilador sin cobertura; regadera de emergencia; CPVC fuera de catálogo; varios tanques; cobre en aire; ramas nuevas de soportería.
- En elec, agregar a las cifras vigiladas: tierra, caída de tensión, Icc y kAIC.
- Revisar que la reescritura de `R.10` (tras H-218) no haya debilitado la prueba.

## P4 · Valores supuestos y citas

**AUD-13 · kaizen · alimentador estimado** — 1,350 MXN/m (`QUOTE_SEED.alimM`, sin fuente) y `num(S.elec.Ltablero, 30)`. Debe quedar «Por cotizar»/pendiente.

**AUD-14 · valores por omisión inventados** (dejar «pendiente» con aviso):
- elec: `selConductor` `num(o.L, 20)` y fp 0.9 (l.9788-9789).
- hidro: `num(H.alturaEdificio, 6)` y `num(H.presRed, 25)` (l.2483, 10593, 10595, 10660, 10667) **[a verificar semántica de `num`]**.
- quote (H-181): hilos «3F4H-220» por omisión **[a verificar]**.
- soporte (H-230): material «acero» si no se captura **[a verificar]**.
- aire (H-218): material desconocido cae a «aluminio»; aluminio e inoxidable se dimensionan con DI de cédula 40 «indicativo» (l.7052-7055, 7094-7095).
- elec (H-177): MOP estimada con 0.85·FLA / 125 % / 175 % fija la protección impresa (l.9899-9928, 10042) → «pendiente de placa» o criterio con fuente.

**AUD-15 · quote/hidro · H-196** — sin `presRed` capturada se afirma «la bomba no alcanza». Debe decir «dato pendiente». La cita NFPA 20 de la partida (l.8717) no corresponde: corregir o quitar.

**AUD-16 · hidro · H-194 rotula como norma lo que es criterio de la casa** — regadera de emergencia (21 m) y tarja de laboratorio no están en IPC 2015 T604.3; `rigeNorma` l.10657; PDF l.2486, 2514; memoria l.10677. Rotular por fila según `presFuente`.

**AUD-17 · aire · H-215** — `enA1` l.7032 usa `tempEntrada` (succión); confirmar contra ISO 7183 si A1 es la entrada al secador. Corrección del FAD «~5 % por bar» (l.6986) sin cita. Fuera de A1 el secador queda con factor 1.0: **[DECISIÓN DEL DUEÑO]** pendiente o factor.

**AUD-18 · hidro · H-197** — `pendMin704` l.10467 vs `sizeDrenaje`: la columna ¼ in/ft se elige con `pend >= 2`, pero ¼ in/ft = 2.083 %. Umbral 2.0833 % y ajustar CM.hidro.9.x/9.y **[a verificar contra IPC T710.1(1)]**.

**AUD-19 · fuego · H-205** — altura máxima al rociador está «de memoria» (l.10845-10847). Citar NFPA 13 con edición y sección, o declarar «criterio del dueño, sin norma» en memoria y PDF (como H-217).

**AUD-20 · citas en salidas al usuario**
- elec: memoria, PDF (l.1742) y Excel (l.5572) deben decir «NOM-001-SEDE-2012, Tabla X, p. N».
- elec (H-183): prueba celda por celda de la Tabla 250-122 contra el DOF (19 filas Cu/Al), como CM.elec.15.
- aire: ASTM B88 y ASME B36.10 con edición (hoy vía CDA Copper Tube Handbook, secundaria).
- hidro: T604.3 viene de la variante «connecticut» de up.codes; cotejar con el texto base de ICC.
- hidro (H-195): Z358.1-1990 vía OSHA; ratificar lavaojos 0.4 gpm con Z358.1-2014 cuando Rodrigo pase el texto (ya está en la lista de textos pendientes).

## P5 · Menores

**AUD-21 · espejo ES/EN** — `dPsigno` (l.1709, 9116), errores de tramo de ductos (l.9402), memorias de hidro/fuego/aire.
**AUD-22 · plantilla CSV** — 16 columnas vs importador de 18 (l.19483 y 19493); S.39 aprueba la diferencia: corregir ambas.
**AUD-23 · elec · capturas por nombre** — al reaceptar la cédula se conservan hp/L/fp por nombre de carga (l.17625); usar id estable e incluir mca/mop/fp/kWOrigen en la firma.
**AUD-24 · hidro · H-195** — la memoria titula «Hunter» un gasto que ya incluye el fijo de emergencia (l.10550); `muebleDe` devuelve WC con fluxómetro para un id desconocido (l.10362); el id `lavaojos` cambió de significado para proyectos viejos (migrar o id nuevo).

## Pendiente de la auditoría (segunda pasada)
Revisar a fondo antes de darlos por buenos: H-224, H-243, H-244, H-252, H-253, H-254, H-142 (código muerto / datos residuales).

## Commits validados limpios
H-107 (3096e7a), H-217 (d5a743b), Fase 1 load/vent/duct/elec/hidro/fuego/aire/soporte, H-178 pruebas y pendientes (e48d07e, 03d8654, db26c03).
