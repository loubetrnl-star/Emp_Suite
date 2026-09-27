# Revisión adversarial de H-264…H-266 (sobre 63a2794) · civil

## C4 · CONFIRMADO por refutador · alta · lente codigo
**Obra civil: con «De las áreas de obra» y la lista vacía, calcula y cotiza los totales a mano que la pantalla oculta**
Dónde: index.html:7446

Escenario: Proyecto nuevo con todos los cruces autorizados. En civil, «Totales capturados a mano»: área 500, altura 3, muros 300 → total 1,690,210 MXN. El usuario cambia a «De las áreas de obra capturadas aquí» y no agrega ningún área. La pantalla dice «Sin áreas de obra capturados» y oculta los totales; capturaReal(civil) = false y el semáforo queda en «Sin datos». Aun así CIVIL.area = 500, muroM2 = 300, la cotización lleva 5 partidas de civil por 1,690,210 MXN y el PDF dice «Superficie total 500 m2 · suma de 0 area(s) de obra capturadas en obra civil».

Razón del refutador: No se puede refutar. Se reproduce en 63a2794, desde la pantalla, con eventos input reales sobre #view. Scripts en /home/user/wt-lectura/x15/rev/verif-codigo/civil-vacia/: ui.mjs, legado.mjs, fixture.mjs y parcheado.html.

Paso a paso:
- Proyecto nuevo con todos los cruces autorizados. «Totales capturados a mano» con área 500, altura 3 y muros 300: CIVIL da área 500, muro 300 y 1,690,210 MXN.
- El usuario cambia el select civil.usarZonas a «De las áreas de obra capturadas aquí» y no agrega renglones (S.civil.areas=[]).
- Resultado: CIVIL.area=500, muroM2=300, alturaProm=3, 5 partidas, total 1,690,210. QUOTE.aux lleva 5 partidas de civil por 1,690,210 MXN.
- R.avisos=[]: el aviso «No hay área» de index.html:7568 no sale porque sólo se da con area===0.
- La pantalla dice «Sin áreas de obra capturados» y no pinta los campos areaManual/alturaManual/murosManual (22543-22547).
- capturaReal('civil')=false (18701) y el semáforo queda en «vacia». La verificación del motor dice «Falta la geometría: área y altura» (19060).
- buildCivilPdf imprime «Superficie total 500 m2 · suma de 0 area(s) de obra capturadas en obra civil» (22671), en contra de la regla 8.

Causa: index.html:7446 `if (C.usarZonas && zonas.length) {…} else { area = areaManual; … }`, donde zonas = C.areas (7433).
- Antes de H-265, zonas era S.zones. sanearEstado nunca lo deja vacío (23921) y zone-del exige más de una zona, así que la rama manual no se alcanzaba con usarZonas=true.
- Con pre-H-265 (2afdd81~1 = 5f8dfc4) el mismo flujo da área 0, total 0 y el aviso «No hay área». Es una regresión de 2afdd81.
- computeCivil contradice el criterio que el resto del código ya usa (`usarZonas !== false` en capturaReal 18701, viewCivil 22543 y buildCivilPdf 22681).

Precisión al hallazgo: la pantalla no oculta las cifras. La tarjeta muestra «Superficie 500 m²» y «Desarrollo de muro 300 m²», y el catálogo «TOTAL SECCIÓN A 1,690,210». Lo que oculta es su origen: los campos a mano no se ven ni se pueden editar en ese modo.

Segundo escenario, que choca con la decisión del dueño de que un proyecto guardado abra con las mismas cifras (legado.mjs):
- Proyecto guardado con 5f8dfc4, con usarZonas=true, una zona sin área y totales a mano residuales 500/3/300. Obra civil = 0.
- Al abrirlo en 63a2794, migrarCivilAutonoma no copia zonas sin área, areas queda [] y obra civil sale en 1,690,210 MXN.
- Lo mismo pasa si el usuario quita todos los renglones de «Áreas de obra»: reaparecen los totales a mano ocultos.

Ningún commit posterior (H-267 a H-277, incluido H-272a) tocó esa condición.

Corrección propuesta: Cambio de una línea en computeCivil (index.html:7446): `if (C.usarZonas && zonas.length) {` pasa a `if (C.usarZonas !== false) {`. Es el mismo criterio de capturaReal (18701), viewCivil (22543) y buildCivilPdf (22681).

Efecto:
- La rama manual sólo corre con usarZonas === false.
- Con la lista vacía, forEach no suma nada: área 0, muro 0, alturaProm 0, ninguna partida de geometría, nada a QUOTE.aux. Sale el aviso que ya existe en 7568 («No hay área: captura las áreas de obra en esta pestaña (o el área total a mano)…»). Es la regla 6: sin dato capturado, pendiente.
- No se borran areaManual, alturaManual ni murosManual: al volver a «a mano» reaparecen.
- No hace falta migración: un proyecto anterior a H-265 con usarZonas y zonas sin área vuelve a abrir con obra civil 0, como calculaba antes de H-265.

Probado en una copia (parcheado.html):
- Flujo de pantalla: área 0, total 0, 0 partidas en la cotización, con el aviso.
- Proyecto anterior: 0 → 0.
- Fixture parches/regresion-motores/regresion-motores.emp.json sin cambios: 4 áreas, 700 m², muro 856.081, total 4,196,691.17, igual antes y después.

Como mueve números en ese estado (1,690,210 → 0 MXN), la regla 3 pide:
- MOTOR_VER.civil de "6" a "7" (index.html:19152), renglón en MOTOR_CAMBIOS.civil y entrada en CHANGELOG-motores.md.
- Correr `node parches/regresion-motores/genera.mjs` en el mismo commit; en el esperado de civil sólo cambia la versión.

Commit: «H-278 · civil · con «De las áreas de obra» y la lista vacía no se usan los totales a mano ocultos; MOTOR_VER.civil 6 → 7». CONTINUACION.md numera lo nuevo desde H-278. En el cuerpo:
- «decisión del dueño 27-sep-2026 (obra civil autónoma; un proyecto guardado abre con las mismas cifras) + regla 6».
- Antes → después: área 500 → 0, muro 300 → 0, sección A 1,690,210 → 0 MXN con aviso; proyecto anterior a H-265 con zonas sin área: 1,690,210 → 0, igual que antes de H-265.
- La prueba S.105 y los dos bancos en verde.

Prueba sugerida: Nombre: t("S.105 (H-278) obra civil: con «De las áreas de obra capturadas aquí» y la lista vacía el motor no usa los totales a mano que la pantalla no muestra (área 0, aviso, nada a la cotización); un proyecto anterior a H-265 con zonas sin área abre con la misma obra civil (decisión del dueño 27-sep-2026; regla 6)", …).

Estructura igual a S.101: guardado = JSON.stringify(S); try/finally con reemplazarEstado.

1. Montaje:
- `G("reemplazarEstado")(G("defaultState")())` y todos los LINKS en S.perms.
- `Object.assign(S.civil, { usarZonas:false, areaManual:500, alturaManual:3, murosManual:300 })` y recompute.
- Guarda de aislamiento: si no se cumple `G("CIVIL").area === 500 && G("CIVIL").total > 0`, lanza «el caso no aísla…».

2. Cambio de modo desde la pantalla:
- `S.tab = "civil"`, render.
- `const s = w.document.querySelector('#view [data-path="civil.usarZonas"]'); s.value = "true"; s.dispatchEvent(new w.Event("input", { bubbles: true }))` y luego recompute.
- Guardas de aislamiento: `S.civil.areas.length === 0` y no existe `#view [data-path="civil.areaManual"]`.

3. Aserciones (hoy fallan por la conducta, no por un símbolo):
- `eq(G("CIVIL").area, 0, …)` (hoy 500).
- `eq(G("CIVIL").muroM2, 0, …)` (hoy 300).
- `eq(G("CIVIL").part.length, 0, …)` (hoy 5).
- `eq(G("QUOTE").aux.filter(a => a.mot === "civil").length, 0, …)` (hoy 5, por 1,690,210 MXN).
- Debe haber `G("CIVIL").avisos.some(a => /captura las áreas de obra/.test(a.msg))` (hoy no hay aviso).

4. Al volver a mano no se pierde lo capturado:
- `S.civil.usarZonas = false`, recompute, `eq(G("CIVIL").area, 500, …)`.

5. Proyecto anterior:
- `const v = JSON.parse(JSON.stringify(G("defaultState")())); delete v.civil.areas; delete v.civil.cuartos; v.zones.forEach(z => z.area = 0); Object.assign(v.civil, { usarZonas:true, areaManual:500, alturaManual:3, murosManual:300 })`.
- `G("importarRespaldo")(JSON.stringify(v))`, recompute, `eq(G("CIVIL").total, 0, "abre con la obra civil que calculaba antes de H-265:")`. Hoy da 1,690,210; con 5f8dfc4 daba 0.

Va antes de S.150; S.105 está libre (hoy existen S.100 a S.104 y S.150 a S.154).


---

## C6 · CONFIRMADO por refutador · alta · lente dueno
**Obra civil: un área o un cuarto clasificado sin altura desaparece de la propuesta del cliente sin ningún «pendiente»**
Dónde: index.html:7471

Escenario: Área de obra «Nave» de 400 m² × 6 m (perímetro de 80 ml) y cuarto clasificado «Cuarto ISO 7» de 60 m² sin altura. El área clasificada pasa de 60 a 0 m²: se van el muro MgO, el plafón MgO, el piso epóxico ESD y la media caña, y esos 60 m² se cotizan como firme pulido con plafón reticular. Obra civil baja de 2,116,508 a 1,756,568 MXN (−359,940). QUOTE.pendientes no trae nada de civil y el PDF de la propuesta no dice «pendiente». Con un área de obra sin altura pasa lo mismo con la tabiquería: sale del catálogo sin renglón pendiente (7468).

Razón del refutador: No se pudo refutar: se reproduce en 63a2794 con jsdom (x15/rev/verif-dueno/civil-sin-altura-prop.mjs), con S.perms["civil>quote"] autorizado.

Escenario: área «Nave» de 400 m², 6 m de altura y 80 ml de perímetro, más «Cuarto ISO 7» de 60 m² con perímetro de 32 ml.
- Con 3 m de altura en el cuarto: CIVIL.total = 2,116,508.
- Con la altura del cuarto en 0: 1,756,568 (−359,940). CIVIL.areaLimpia pasa de 60 a 0.
- Salen del catálogo el muro MgO, el plafón MgO, el piso ESD y la media caña. Los 400 m² completos se cotizan como «Firme… pulido en área no clasificada» y «Plafón reticular en área no clasificada».
- QUOTE.pendientes sólo trae «importacion». buildPropuestaPdf (ES) y buildCotizacionPdf no mencionan ni «Cuarto ISO 7» ni «altura».
- Con «Nave» sin altura (index.html:7452, aviso 7468), el renglón A300 de tabiquería desaparece y tampoco queda ningún pendiente.

Por qué pasa:
- index.html:7435 y 7438: con h = 0 el cuarto se marca «vacío» y no suma área clasificada.
- index.html:7475: areaNoLimpia = area − areaLimpia, así que los m² del cuarto se van a acabados de área no clasificada.
- Los avisos de 7468 y 7472 son lvl "warn". Sólo llegan a la pestaña de civil (22592), a la tarjeta de validación y a la memoria de civil (22666).
- computeQuote (8692 a 8873) arma pendientes de ductos, eléctrico, hidráulica, soportería (H-266) y USD, pero ninguno con mot "civil".
- Por eso no los lee nada de lo que usa Q.pendientes: la propuesta PDF (6839), la cotización PDF (1622), la licitación (6713), la pantalla de cotización (20613), la tarjeta de costo de civil (6543) y la matriz de alcance del libro (pendSec, 5931).
- Además, el semáforo de civil queda en «datos» (verde, faltan []) porque sólo cuenta los "err".

Esto choca con la regla 6: sin altura debe decir «pendiente de altura», como hace soportería con H-266. En cambio, 60 m² capturados como clasificados salen con acabado no clasificado, un valor por omisión que parece cálculo. El camino es común: H-272a mete cuartos de planos sin altura rotulada (la prueba de pruebas.mjs:8084 lo hace con el cuarto ISO 8 de un DXF). Ningún commit posterior a fcda936 lo corrige: el código leído y el reproducido son los de 63a2794.

Corrección propuesta: Corrección mínima (no mueve importes):

1. **civil, computeCivil** (return en index.html:7574): exponer lo que ya se calcula.
   - `pendAltura.areas`: `zonasCivil.filter((z) => z.area > 0 && !(z.h > 0)).map((z) => ({ name: z.name, area: z.area, per: z.per }))`
   - `pendAltura.cuartos`: `limpios.filter((c) => c.area > 0 && !(c.h > 0)).map((c) => ({ name: c.name, area: c.area }))`

2. **quote, computeQuote** (index.html:8874): antes del `if (verCiv && CIVIL && CIVIL.total > 0)`, con la compuerta verCiv pero sin exigir total > 0, agregar a pendientes:
   - Por cada área: `{ mot: "civil", desc: «Tabiquería del área de obra «Nave» (400 m²)», descEn, motivo: "pendiente de altura (sin captura no se supone, H-265)", motivoEn: "height pending (not assumed without capture, H-265)" }`.
   - Por cada cuarto: `desc` «Cuarto clasificado «X» (60 m²): muro, plafón y piso de área clasificada y media caña; sus m² van hoy como área no clasificada» (regla 8), `motivo` «pendiente de altura (sin captura no cuenta como área clasificada; no se supone)», y su versión en inglés (regla 7).
   - Con esto basta: propuesta ES/EN, cotización, licitación, pantalla, tarjeta de civil y matriz de alcance ya leen Q.pendientes (SEC_PROP.A.motor = "civil").

3. **Versiones y banco**
   - El proyecto fijo de regresión trae todas las alturas (zonas de 6, 3, 3 y 3 m; cuarto de 3 m), así que R.1 no cambia. Por la regla 3 no hace falta subir versión. Si el integrador toma la lista de pendientes como salida de quote, sube MOTOR_VER.quote de 24 a 25, con MOTOR_CAMBIOS y CHANGELOG.
   - Toca la región de quote: va como dependencia de civil para el integrador, con encabezado `H-nnn · quote · …`.
   - Lo probé en una copia parchada (x15/rev/verif-dueno/index-fix.html) y pasa sin errores de página.

4. **Aparte, decisión del dueño (fuera del mínimo)**: hoy los 60 m² del cuarto sin altura se cotizan con piso y plafón de área no clasificada, y piso, plafón y media caña no dependen de la altura. Hay dos salidas:
   - sacarlos de areaNoLimpia, o
   - contarlos como clasificados dejando pendiente sólo el muro.

   Cualquiera de las dos mueve cifras de civil: MOTOR_VER.civil de 6 a 7, MOTOR_CAMBIOS, CHANGELOG y `genera.mjs`. También revierte el criterio de la rev 2.9.19 que reafirmó H-272a.

Prueba sugerida: Nueva prueba en el bloque CM.civil: t("S.155 (H-nnn) obra civil: un cuarto clasificado o un área de obra sin altura llega a la cotización y a la propuesta (ES/EN) como «pendiente de altura», no como partida menor (regla 6)").

Pasos, dentro de try/finally con reemplazarEstado:
1. `S.perms["civil>quote"] = { ts: 1, via: "S.155" }`
2. `S.civil = { ...defaultCivil(), areas: [{ id: "a1", nombre: "Nave", area: 400, altura: 6, perimetro: 80 }], cuartos: [{ id: "k1", nombre: "Cuarto ISO 7", area: 60, altura: 0, perimetro: 32 }] }`, luego recompute.
3. `eq(CIVIL.areaLimpia, 0)`
4. Exigir en `QUOTE.pendientes` un `p` con `p.mot === "civil"`, `/Cuarto ISO 7/` en desc y `/pendiente de altura/` en motivo.
5. Con `pdfTxt` (el helper de pruebas.mjs:3901): buildPropuestaPdf({lang:"es",mon:"MXN"}) debe contener «Cuarto ISO 7…pendiente de altura», y buildPropuestaPdf({lang:"en",mon:"USD"}) debe contener «height pending».
6. `cuartos[0].altura = 3`, `areas[0].altura = 0`, recompute: exigir el pendiente civil de «Nave» (tabiquería).
7. Con las dos alturas capturadas: 0 pendientes con mot "civil".

Hoy falla por la conducta, no por un símbolo que falte: «el cuarto sin altura no llega a la cotización como pendiente: ["importacion"]». Con la corrección pasa. Está verificado con x15/rev/verif-dueno/prueba-fix.mjs contra index.html (NO PASA) y contra index-fix.html (PASA).


---

## U1 · SIN VERIFICAR (verificar con prueba primero) · media · lente reglas
**Obra civil: un área o un cuarto clasificado sin altura sale de la propuesta sin renglón pendiente**
Dónde: index.html:7468

Escenario: Área de obra «Nave» de 500 m² con altura 0 (el botón «Agregar área de obra» la crea así) y un cuarto de 60 m² × 3 m. Resultado: muro 0 m² y total civil 1,665,970 MXN, contra 2,478,133 con 6 m. QUOTE.pendientes no trae nada de civil, así que la sección A de la propuesta no dice «PENDIENTE»; sólo hay aviso en pantalla. Con un cuarto clasificado sin altura, el área clasificada queda en 0 y el total en 2,107,623, también sin pendiente.

Detalle: La regla 6 pide «pendiente», no un 0 que se cotiza como si fuera cálculo. H-265 quitó los 2.8 m supuestos, pero dejó el muro en 0 con sólo un aviso (7452, 7468, 7472), y computeQuote (8875) no agrega ningún pendiente de civil. Con H-265 el caso se volvió frecuente, porque la altura ya no viene de las zonas. En cambio H-225, H-232 y H-266 (renta, 8871) sí llevan su pendiente a la cotización.


---

## U7 · SIN VERIFICAR (verificar con prueba primero) · media · lente codigo
**Obra civil: la migración descarta las zonas sin área que tenían tabiquería capturada y el proyecto abre con otras cifras**
Dónde: index.html:7415

Escenario: Proyecto guardado con e0e1cf4: zona «Nave» de 400 m² × 6 m y zona «Pasillo» de 0 m² × 3 m, con 50 ml de tabiquería capturados en civil para el pasillo (la pantalla anterior sí mostraba ese campo). En e0e1cf4: muro 639.9 m² y total 2,025,996 MXN. En 63a2794, civil.areas sólo trae «Nave»: muro 489.9 m² y total 1,773,246 MXN (−252,750).

Detalle: migrarCivilAutonoma filtra con `num(z.area, 0) > 0` y lo justifica con «no aportaban nada». Es falso: el computeCivil anterior sumaba perímetro capturado × altura aunque el área fuera 0. Esto rompe «un proyecto guardado abre con las mismas cifras». Corrección: copiar también las zonas sin área que tengan perímetro capturado (con su altura). Reproducción: /home/user/wt-lectura/x15/rev/codigo/expG.mjs.


---

## U9 · SIN VERIFICAR (verificar con prueba primero) · media · lente codigo
**«Nuevo desde plantilla» y «Referencia interna» conservan los nombres de las áreas y cuartos de obra civil (obra o cliente anterior)**
Dónde: index.html:24194

Escenario: Proyecto con la zona «Nave ACME Planta 3» y el cuarto limpio «Sala ISO 7 ACME», anterior a H-265 (la migración los copia a civil) o capturados directamente en civil. projDup y anonimizarRegistro vuelven genéricas las zonas y los cuartos (Oficina 1, Cuarto limpio 1…), pero civil.areas y civil.cuartos siguen llamándose «Nave ACME Planta 3» y «Sala ISO 7 ACME». Esos nombres salen en la pestaña, en el PDF de civil («Renglones capturados y su origen») y en los entregables.

Detalle: etiquetasGenericas no cubre S.civil.areas[].nombre ni S.civil.cuartos[].nombre, que son nuevos desde H-265. Además, migrarCivilAutonoma copia ahí z.name y r.name dentro de sanearEstado, antes de volverlos genéricos (24417 y 24494 pasan civil tal cual). Esto viola «Lo que nunca» (nombres de clientes u obras anteriores) y la anonimización irreversible de la Referencia interna. Las pruebas 18.7 y 18.15 no lo detectan porque su área de civil se llama «Nave histórica». Corrección: en etiquetasGenericas renombrar civil.areas («Área de obra n») y civil.cuartos («Cuarto clasificado n») y quitarles el origen de archivo. Reproducción: /home/user/wt-lectura/x15/rev/codigo/expCDE.mjs (bloque E) y expE2.mjs.


---

## U4 · SIN VERIFICAR (verificar con prueba primero) · media · lente reglas
**La prueba 2.0.6 quedó reescrita como tautología y ya no comprueba el estado de ninguna flecha (cobertura perdida sin sustituto)**
Dónde: pruebas.mjs:294

Escenario: Mutante en una copia: estadoArista devuelve siempre «inerte». Resultado: 2.0.6 PASA, porque acepta cualquiera de los cinco estados y luego sólo busca 'dar-inerte' en la vista. Ninguna otra prueba llama a estadoArista. Antes de 2afdd81 la prueba exigía 'vigente' y 'dar-vigente'.

Detalle: El commit H-265 dice que la nueva 2.0.6 prueba que «las flechas se pintan con el estado de su propuesta», pero la aserción `["vigente","desactualizada","propia","pendiente","inerte"].includes(e)` (línea 300) es siempre verdadera. La prueba debería aceptar una propuesta con flecha (p. ej. cedula>elec), exigir 'vigente', mover el origen y exigir 'desactualizada'. Algo parecido pasa con S.21 (5711-5712): se quitó 'soporte' de los que el ramal de incendio debe marcar, pero no se agregó (ni 'civil') a los que NO debe marcar. Con eso ya no se prueba la independencia del sello de soportería y civil (un mutante que vuelva a meter ENTRADAS.fuego en la huella de soporte sobrevive).

