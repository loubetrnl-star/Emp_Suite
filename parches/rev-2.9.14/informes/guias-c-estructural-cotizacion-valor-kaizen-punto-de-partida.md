# guias-c · Guías repetidas: Estructural, Cotización, Ingeniería de valor, Kaizen + panel «Punto de partida» + modbar

SuiteEmp rev 2.9.14 · 19-sep-2026 · sólo texto: ningún motor, cifra ni cotización se tocó.

Entregables (esta carpeta): `parche_guias.py` (edita `index.html`), `parche_pruebas.py` (edita `pruebas.mjs`), este informe.
Apoyo: `verifica.sh` (repite toda la verificación), `w14_guiasc_dump.mjs` (volcado de capas y huellas de motores; corre con el arnés de `tests2`) + `cmp_dump.mjs` + `cmp_resultado.txt` (comparación antes/después), `run_final.log` (banco sobre mi copia), `run_real_sin_parche.log` / `run_real_con_parche.log` (banco sobre una copia del archivo real de las 19:43, sin y con parche), `index.html` / `pruebas.mjs` (copias ya parcheadas), `index.orig.html` / `pruebas.orig.mjs` (partida).

## 0. Resultado en una línea

- Parches probados con `assert count == 1` sobre mi copia (partida 2.9.14) **y** sobre una copia del archivo real tal como estaba a las 19:43 (sha1 `969d2974…`): aplican limpio los dos.
- Banco completo con `--base`: mi copia **310/310** (305 + 5 pruebas nuevas GC.1–GC.5); copia del real actual **309/309 sin parche → 314/314 con parche**. La única falla que vi en el real (S.20) era del entorno (busca `parches/fixtures-formato/` junto a `pruebas.mjs`); con esa carpeta copiada pasa igual con y sin parche.
- Estado de los motores antes/después, 4 escenarios (vacío, proyecto de prueba, cotización llena con datos en todos los motores, sin permisos): **76 huellas sha1 comparadas (LOADS, SYS, QUOTE, KAIZEN, VALOR, DUCT, VENT, CLEAN, ELEC, HIDRO, FUEGO, AIRE, CIVIL, SOPORTE, SITE, VALID, catálogo de conceptos, semáforo, totals): 0 diferencias.**
- Modbar y barra de acciones de las 19 pantallas × 4 escenarios × guía visible/oculta: **304 comparaciones, 0 diferencias.**
- Cifras que desaparecen del cuerpo de las vistas: sólo las de las frases quitadas (0.1.2, 3D, 360, 0.2, «regla 1», «regla 2» en Estructural; el «1» de «por debajo de 1» en Cotización), y todas están ahora en la guía. Ninguna cifra de resultado.
- Las únicas pantallas cuyo cuerpo cambia son Estructural, Cotización, Valor y Kaizen. La guía cambia en esas tres primeras más las 12 disciplinas (renglón «Punto de partida»); el panel de carga cambia sólo en las 12 disciplinas.

## 1. Criterio que apliqué

«Texto repetido» = algo que se dice dos veces sobre la misma pantalla: vista ↔ guía, vista ↔ modbar/barra de acciones/panel, o dos veces dentro de la propia vista. Se quita de la vista; si traía norma, umbral, criterio o advertencia que la guía no tenía, se movió a `GUIA[tab]` (o a `guiaHtml`) antes de quitarlo.
**No toqué**: la ayuda propia de cada campo (`ref/rec/warn` de la tabla de ayudas y las notas de los controles), avisos calculados o de estado con cifras o botón de acción, resultados, memorias, ni el semáforo.
Regla que seguí para lo dudoso: si el texto no repite nada y explica un mecanismo de una tarjeta concreta, se queda (sección 7).

## 2. Estructural (`viewEstructural`) · antes NO tenía guía

| Texto quitado de la vista | Dónde queda en la guía | Información movida a la guía |
|---|---|---|
| «El motor estructural de la casa es EMP StructCalc v0.1.2 (solver 3D, P-Delta, análisis modal, pandeo, generador de marco a dos aguas). Corre como archivo aparte, StructCalc.html, sin instalación.» | `GUIA.estructural.que` (nueva, casi literal) | Nombre del archivo (`StructCalc.html`), «sin instalación» y «generador de marco a dos aguas» (la tarjeta «Qué hace hoy» no lo decía). «Corre como archivo aparte» ya lo dicen el modbar (`hara` del semáforo) y la nota de la barra de acciones: eran tres veces en la misma pantalla. |
| «Todavía no cumple su propio criterio de liberación (así lo declara su README): resuelve la física del marco, pero no revisa miembros contra AISC 360 —sin eso no hay memoria firmable— y las cargas de viento y sismo se capturan a mano… No está empalmado a este archivo: su cálculo no entra a la memoria integral ni a la cotización.» | `GUIA.estructural.ojo` | Criterio de liberación, norma AISC 360, «sin memoria firmable», viento/sismo a mano, «no empalmado / no entra a memoria ni cotización». |
| «…Uso admisible hoy: modelado, análisis, comparación de alternativas y prueba piloto; no construcción. Cuando tenga su capa de revisión de miembros (rev 0.2), entrará como cualquier otro motor autónomo: hereda geometría (regla 1) y recibe cargas de equipo en cubierta como propuesta (regla 2).» | `GUIA.estructural.cuando` | Uso admisible y prohibición «no construcción», hito rev 0.2, reglas 1 y 2 de interoperabilidad. |

La vista conserva: tarjeta «módulo externo» con «Geometría que heredaría» y la tarjeta «Qué hace hoy StructCalc, verificado contra su código» (incluye el aviso «sin revisar»).

## 3. Cotización (`viewCotizacion`)

| Texto quitado de la vista | Dónde queda en la guía | Información movida a la guía |
|---|---|---|
| `.ref` bajo Perillas: «El factor de lista multiplica todo el equipo. Los precios semilla vienen de una cotización interna de referencia, de grado cuarto limpio, y corren altos: para obra comercial normal el factor suele quedar por debajo de 1.» | `GUIA.cotizacion.ojo` (junto a «los precios de fábrica son de referencia») | Factor de lista = multiplica todo el equipo; origen de la semilla (grado cuarto limpio); «corren altos»; criterio: en obra comercial normal el factor queda por debajo de 1. La ayuda del campo `quote.priceFactor` (entre 0.55 y 0.75) no se tocó. |
| Subtítulo de «Propuesta para licitación pública»: «Misma ingeniería y mismo catálogo que la propuesta de arriba, pero con el precio demostrado: tarjeta de análisis por concepto, análisis del FASAR, integración del sobrecosto en cascada y explosión de insumos. Es lo que exige una convocante; sin tarjetas la propuesta se desecha en la apertura técnica.» | `GUIA.cotizacion.que` (qué lleva la de licitación) y `.ojo` (criterio) | Los cuatro componentes del precio demostrado; «lo exige una convocante»; «sin tarjeta de análisis se desecha en la apertura técnica». |
| «Propuesta integral» párrafo 1: «El PDF de arriba es el desglose interno… Este es el documento que se le manda al cliente: encabezado con número y revisión, resumen ejecutivo, catálogo de conceptos con clave, unidad, cantidad y precio unitario abierto por sección de disciplina (A civil · B HVAC …), esquema de pagos, matriz de alcance y condiciones. Es el formato de propuesta de la casa.» | `GUIA.cotizacion.que` | Contenido del documento del cliente. **Reescrito en un punto:** «el PDF de arriba» ya no existe (rev 2.9.13 lo pasó a la barra de acciones): ahora dice «la memoria de cálculo de la barra de acciones es su desglose interno». No repetí «(A civil · B HVAC · … G elevación)»: la tabla de secciones de la misma tarjeta lo muestra. |
| «Propuesta integral» párrafo 2: «La propuesta sale con la misma identidad gráfica que las memorias… espejo exacto… quince hojas encadenadas por fórmula… se recalculan solos… Incluye las bases de HVAC, la memoria eléctrica y la ingeniería de valor de Kaizen. Las secciones que este motor no calcula —obra civil, aire comprimido y elevación— salen declaradas como NO COTIZADAS…» | `GUIA.cotizacion.que` (documento, espejo, 15 hojas, fórmulas, contenido) y `.ojo` (NO COTIZADA) | Todo lo descriptivo (identidad gráfica, cuatro archivos con el mismo contenido, 15 hojas, qué se recalcula, qué incluye) y la advertencia de alcance. **Reescrito en un punto:** la frase «las secciones que este motor no calcula —civil, aire y elevación—» estaba desactualizada (esos tres motores ya existen y entran por su cruce). Hoy el código declara NO COTIZADA **toda sección sin partidas** (matriz de alcance de Excel y PDF; ver los `cost` de `civil>quote`, `aire>quote`, `soporte>quote`), y así quedó escrito. |

## 4. Ingeniería de valor (`viewValor`)

| Texto quitado de la vista | Dónde queda en la guía | Información movida a la guía |
|---|---|---|
| Subtítulo de la tarjeta principal: «La consolidación compara lo calculado contra alternativas equivalentes del catálogo y contra lo que Kaizen detecta sobre el proyecto. Cada medida trae su ahorro estimado y su justificación técnica. Aceptar una medida **no cambia el cálculo**: registra la decisión y deja constancia; el cambio lo haces tú en la pestaña de la disciplina, con tu firma.» | `GUIA.valor.que` (ya lo decía, casi palabra por palabra) y `GUIA.valor.ojo` | Sólo dos matices que la guía no tenía: «y deja constancia» y «con tu firma»; se agregaron al `ojo`. |

## 5. Kaizen (`viewKaizen`)

| Texto quitado de la vista | Dónde queda en la guía | Información movida a la guía |
|---|---|---|
| Subtítulo de la tarjeta principal: «Cada oportunidad se detecta sobre el proyecto real y se mide volviendo a correr el cálculo con el cambio aplicado. Lo que no se puede medir no se enlista.» | `GUIA.kaizen.que` («sobre el proyecto real») y `.ojo` («se mide volviendo a correr el cálculo… lo que no se puede medir no se enlista») | Ninguna: era palabra por palabra lo que la guía ya dice. |

## 6. Capas transversales

### 6.1 Panel «Punto de partida» (`cxPanelCargaHtml`, 12 disciplinas)

| Texto quitado de la vista | Dónde queda en la guía | Información movida a la guía |
|---|---|---|
| «Captura desde cero con el motor de abajo, o carga el proyecto ejecutivo de esta disciplina: {acepta}. También puedes soltar los archivos sobre este recuadro.» | Renglón nuevo **«Punto de partida.»** en la guía de cada disciplina de `CX_DISC` (entre «Cuándo se usa» y «Ojo»), armado por la función nueva `cxGuiaTexto(tab)` y pintado desde `guiaHtml` | Los formatos que acepta cada disciplina (`CX_DISC[tab].acepta`) y que se pueden soltar los archivos sobre el recuadro (ahora dice «sobre el recuadro «Punto de partida»»). |

El panel queda con su rótulo «Punto de partida», los botones («Cargar proyecto ejecutivo», «Origen de los datos») y el estado «Última carga: …». Con la guía oculta ya no explica nada. Sigue siendo zona de soltar archivos. No aparece en pantallas que no son disciplinas (17.1 lo sigue verificando).

### 6.2 Modbar (`.modsub` = texto del semáforo)

Sin cambios de código ni de texto (0/304 diferencias). Lo comparé contra la vista en los cuatro escenarios:

| Pantalla | `.modsub` | ¿La vista lo repite? | Decisión |
|---|---|---|---|
| Estructural | «StructCalc v0.1.2 · corre como archivo aparte» (texto estático `hara`) | Sí, el subtítulo de la vista (y además la nota de la barra de acciones) | Se quitó de la vista (sección 2). El modbar se queda. |
| Cotización | «$ …» / «sin partidas» / «motor listo · sin proyecto abierto» | Sólo como cifra de resultado («Total con IVA») | No se toca (resultado). |
| Valor | «N medida(s) · $ … en juego» / «sin comparar · N enlace(s) por autorizar» … | Sólo como cifras y conteos (etiqueta «N medida(s)», «En juego») | No se toca (resultados). |
| Kaizen | «N oportunidad(es)» / «sin revisar» | Sólo la etiqueta «N oportunidad(es)» de la tarjeta | No se toca (resultado). |

## 7. Revisado y CONSERVADO (no repite la guía, o es ayuda de campo / aviso de estado)

| Pantalla | Texto | Por qué se queda |
|---|---|---|
| Estructural | Tarjeta «Qué hace hoy StructCalc…» y su renglón «sin revisar: no revisa miembros… no hace despiece…» | Es el contenido de la pantalla. Solapa en parte con el `ojo` nuevo, pero es la única advertencia visible con la guía oculta y agrega lo del despiece. |
| Cotización | Estado vacío: «Trae de un golpe el chiller y las manejadoras…» | Llamada a la acción junto a sus dos botones; la guía no lo dice. |
| Cotización | Nota del IVA («El 8 % de franja fronteriza exige estar inscrito en el padrón… El arranque es 16 %.») | Ayuda propia del control de IVA, con criterio normativo. |
| Cotización | «Contra tus obras cerradas»: «Compara el costo por tonelada y por m²… el problema casi siempre está en el factor de lista» | Criterio propio de esa tarjeta; la guía no lo dice. Candidato a moverse si se quiere adelgazar la tarjeta. |
| Cotización | Hints de licitación: art. 185 del Reglamento de la Ley de Obras Públicas, FASAR de mercado 0.x–x, «N de M conceptos tienen tarjeta…», «rendimientos de cuadrilla preliminares», «Esta cotización todavía no incluye…», «Todavía no hay otra revisión…», notas de las perillas | Ayuda de campo (norma, umbral), avisos calculados con cifras o de estado. |
| Valor | Hint de enlace sin autorizar (con cuenta de medidas sin valuar y botón), hint de bloqueos, «Nada que proponer sobre esta corrida…» | Avisos de estado/resultado. |
| Valor | `.ref` «El orden pesa el ahorro por la tasa histórica de aceptación (factor de 0.6 a 1.4)…» | Nota de método de la lista que ordena (umbral); la guía no lo dice. |
| Kaizen | Avisos «sin autorizar» (`permiso`), estados vacíos | Avisos de estado con botón. |
| Kaizen | Ciclo PDCA: «Solo cuenta como ahorro verificado cuando llega a Actuar con su medición hecha» | Criterio de esa tarjeta; la guía no habla de PDCA. Candidato a moverse. |
| Kaizen | Subtítulos de «Desviaciones de esta corrida» y «Base de conocimiento de la casa»; tabla «Los siete desperdicios» | Describen tarjetas que la guía no menciona; la tabla es glosario de referencia. |

## 8. Pruebas (`parche_pruebas.py`)

- **17.1** (panel de carga): ya no exigía «desde cero» en el panel; ahora exige el texto en `cxGuiaTexto`/`.guia`, el rótulo en el panel y que el panel **no** repita el texto. Era la única falla del banco original tras el parche (304/305).
- **P.1** (Estructural v0.1.2 y aviso de liberación): reapuntada a `GUIA.estructural` (v0.1.2, criterio de liberación, AISC 360, «no construcción»), con la guía visible y con la guía oculta (no debe quedar el aviso en ningún otro lugar). Los chequeos originales de la vista siguen y pasan porque la guía va dentro de `#view`.
- **GC.1** lo que decían las vistas está en la guía (fuente y guía pintada). **GC.2** las vistas ya no dicen las frases quitadas, con la guía visible y con ella oculta. **GC.3** el panel de las 12 disciplinas no explica nada, la guía sí, y con la guía oculta no aparece nada. **GC.4** el modbar sigue diciendo lo que dice el semáforo y Estructural no lo repite. **GC.5** se conservan la ayuda de campo, el IVA, los avisos con cifras y los de estado.

## 9. Para decidir (yo no lo resolví)

1. **La guía de Cotización quedó larga** (334 palabras; la siguiente más larga, Ductos, tiene 109, y Estructural 139): moví todo lo descriptivo para no perder nada. Si se prefiere corta, es podable sin perder norma, umbral, criterio ni advertencia: «Incluye las bases de HVAC, la memoria eléctrica y la ingeniería de valor de Kaizen», la parte «misma portada, jerarquía de encabezados, tablas y pie», «el contenido es el mismo en los cuatro archivos» y el listado de qué se recalcula solo.
2. **Estructural:** el aviso «no cumple su criterio de liberación / no construcción» ahora se puede ocultar con la guía (como pidió el dueño). Sigue visible siempre: el modbar («corre como archivo aparte»), la nota de la barra de acciones («esta suite no lo calcula ni simula») y el renglón «sin revisar». Si el dueño quiere el aviso de liberación siempre a la vista, es volver a poner una línea `<div class="hint">` en `viewEstructural`.
3. **Selección de equipo** (otro grupo) repite la misma nota de precios semilla («Lee esto antes de mandar una cotización»). Si allá también se mueve a `GUIA.seleccion.ojo`, el hecho queda en dos guías, cada una en su pantalla: es correcto, pero conviene que se decida a propósito.
4. El texto «Captura desde cero con el motor de abajo» también sale en Estructural, que no tiene motor de captura en esta suite (ya lo decía el panel antes). No lo corregí: no era repetido sino impreciso.
5. Sin tocar: la nota de la barra de acciones de Estructural repite el modbar; se queda porque es a lo que apunta `aria-describedby` (prueba S.2/S.4).

## 10. Cómo aplicar y verificar

```
python parche_guias.py   <ruta>\index.html      # edita en sitio; o agrega una 2.ª ruta para escribir aparte
python parche_pruebas.py <ruta>\pruebas.mjs
node pruebas.mjs index.html --base <base-pre.html>
```
Respeta CRLF. Ambos fallan con `AssertionError` si una coincidencia deja de ser única (no se pueden aplicar dos veces). `bash verifica.sh` repite mi verificación completa. Los parches sólo tocan: `GUIA` (valor, cotizacion, estructural nueva), `guiaHtml` (un renglón), `cxPanelCargaHtml` (una línea) + función nueva `cxGuiaTexto`, y 8 líneas de las cuatro vistas + 4 comentarios. Otro grupo que edite `GUIA` en sus propias entradas o esas mismas funciones no choca mientras no ancle en esas líneas.

## 11. Para la bitácora (texto sugerido)

> rev 2.9.14 · Guías repetidas, Estructural/Cotización/Valor/Kaizen y capas. Decisión del dueño: el texto explicativo vive sólo en la guía y, si se oculta, no aparece. Se quitaron de la vista el subtítulo de Kaizen y el de Valor (repetían la guía), la nota de precios semilla, el subtítulo de licitación y los dos párrafos de la propuesta integral de Cotización, y la presentación y el aviso de liberación de Estructural (que no tenía guía: se creó). Nada se perdió: lo que la guía no tenía se movió a `GUIA` (deja constancia y firma en Valor; semilla de cuarto limpio y factor < 1, secciones NO COTIZADAS, licitación y propuesta integral en Cotización; criterio de liberación, AISC 360, uso admisible en Estructural). El texto del panel «Punto de partida» de las 12 disciplinas pasó a un renglón de la guía (`cxGuiaTexto`). Modbar sin cambios. Dos frases movidas se actualizaron porque estaban vencidas («PDF de arriba»; «secciones que este motor no calcula»). Pruebas: 17.1 y P.1 reapuntadas a la guía; GC.1–GC.5 nuevas. Motores y cotizaciones: 0 diferencias (76 huellas × 4 escenarios).
