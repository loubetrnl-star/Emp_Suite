# guias-b: textos de guía repetidos fuera de la vista (eléctrico, hidro, fuego, aire, civil, soporte)

Base: `index.html` rev 2.9.14 en curso (copia del 19-sep-2026, 3 289 215 bytes) y `pruebas.mjs` (5 004 líneas, 305/305 con `--base`).
Regla aplicada: el texto vive solo en la guía (`GUIA[tab]`, pintada por `guiaHtml`). Si la vista repetía o parafraseaba a la guía, se quitó de la vista y lo que la guía no traía (norma, umbral, criterio) se movió a `GUIA[tab]` antes de quitarlo. No se tocó: ayuda propia de campo (tabla `REF`), avisos y checks del motor, cifras, memorias (`r.memo`), PDF, Excel, ni ningún motor.

## Archivos

| Archivo | Qué es |
|---|---|
| `parche_guias.py` | Edita `index.html` (vistas y `GUIA`). Todos los reemplazos afirman coincidencia única (`count == 1`). Maneja CRLF. Argumento: ruta a `index.html`. |
| `parche_pruebas.py` | No modifica pruebas existentes (ninguna exige los textos quitados); AGREGA el bloque nuevo GB.1 a GB.6 antes de `const total = ok + fail;`. Argumento: ruta a `pruebas.mjs`. |
| `index.html`, `pruebas.mjs` | Copias ya parcheadas con estos dos scripts (verificado por `cmp` contra una aplicación limpia sobre las originales). |
| `index.orig.html`, `pruebas.orig.mjs` | Copias sin parchear tomadas al empezar. |
| `banco_final.log`, `identidad_numerica.log`, `base_run.log` | Salida del banco completo (311/311), de la comparación numérica (cero diferencias) y del banco base (305/305 antes del parche). |

Orden y coordinación con otros parches de guía: `parche_guias.py` añade a `guiaHtml` el campo opcional `metodo` (línea «Método.» entre «Cuándo se usa» y «Ojo»). Es idempotente: si otro parche ya añadió `g.metodo`, lo detecta, lo imprime y lo deja como está (probado con un parche simulado previo). Solo edita las entradas `GUIA.electrico`, `hidro`, `fuego`, `aire`, `civil`, `soporte`; el bloque de pruebas va en `{ }` (sus `const` no chocan con los de otros bloques) y usa el prefijo `GB.`. Si otro parche también usa el prefijo `GB.`, el script se detiene con un mensaje (no pisa nada).

## Eléctrico (`viewElec`)

| Texto quitado de la vista | Dónde queda en la guía | Información movida a la guía |
|---|---|---|
| Nota bajo «Transformador de la acometida»: «Solo se usa para estimar la corriente de falla y elegir capacidad interruptiva. No es un estudio de corto circuito.» | `GUIA.electrico.ojo` (ya decía «No es estudio de corto circuito ni coordinación de protecciones») | Sí: para qué sirve el transformador (solo estimar la corriente de falla y elegir la capacidad interruptiva). Ahora el ojo dice: «...los datos del transformador de la acometida solo sirven para estimar la corriente de falla y elegir la capacidad interruptiva.» |
| Hint «Método: ampacidad de la Tabla 310-15(b)(16) a 75 °C corregida por temperatura y agrupamiento, factores de demanda del art. 220, 125 % del motor mayor por el art. 430-24, protección por 240-6 y tierra por la Tabla 250-122. La caída de tensión se resuelve con R·cosφ + X·senφ y la Tabla 9 del capítulo 9, no con una constante K.» | `GUIA.electrico.metodo` (campo nuevo, pintado como «Método.») | Sí, íntegro: Tabla 310-15(b)(16) a 75 °C, art. 220, art. 430-24 (125 %), 240-6, Tabla 250-122, R·cosφ + X·senφ, Tabla 9 cap. 9, «no con una constante K». La guía solo tenía la lista de conceptos sin una sola norma. |

## Hidráulico sanitario (`viewHidro`)

| Texto quitado de la vista | Dónde queda en la guía | Información movida a la guía |
|---|---|---|
| Hint «Método: unidades mueble y de descarga por tabla, gasto probable por la curva de Hunter (tanque o fluxómetro según los muebles), diámetros por velocidad máxima y pérdida por Hazen-Williams, drenaje por unidades de descarga con el límite de inodoros por diámetro, y cisterna por dotación.» | `GUIA.hidro.metodo` (campo nuevo) | Sí, íntegro: curva de tanque o fluxómetro según los muebles, diámetros por velocidad máxima, pérdida por Hazen-Williams, drenaje con límite de inodoros por diámetro, cisterna por dotación. La guía solo nombraba «unidades mueble y método de Hunter». |
| Aviso de diez UM | NO se quitó (ver «Retenido») | Nada que mover: `GUIA.hidro.ojo` ya trae la regla general. |

## Contra incendio (`viewFuego`)

| Texto quitado de la vista | Dónde queda en la guía | Información movida a la guía |
|---|---|---|
| Hint «Prediseño. Se resuelve la trayectoria más desfavorable completa, que es lo que dimensiona toma, cisterna y bomba. El cálculo formal de NFPA 13 balancea nodo por nodo toda el área de diseño y se entrega con su gráfica de demanda contra abastecimiento.» | `GUIA.fuego.ojo` (ya decía «Es prediseño: el cálculo formal de NFPA 13 balancea nodo por nodo...») | Sí: que se resuelve la trayectoria más desfavorable completa (lo que dimensiona toma, cisterna y bomba) y que el cálculo formal se entrega con su gráfica de demanda contra abastecimiento. |

## Aire comprimido (`viewAire`)

| Texto quitado de la vista | Dónde queda en la guía | Información movida a la guía |
|---|---|---|
| En «Levantamiento de consumos», la segunda frase de la nota: «El pico es la suma de nominales; la demanda de diseño es la mayor entre el consumo medio y el pico con simultaneidad.» (la primera, «Deja L/min y uso en cero para tomar el valor de referencia del tipo.», se queda: es la instrucción de uso de las dos columnas, ayuda de campo) | `GUIA.aire.metodo` (campo nuevo) | Sí: el criterio de demanda de diseño (pico = suma de nominales; demanda = mayor entre consumo medio y pico con simultaneidad). La guía solo decía «del levantamiento de consumos al FAD requerido». |

## Obra civil (`viewCivil`)

| Texto quitado de la vista | Dónde queda en la guía | Información movida a la guía |
|---|---|---|
| Banner de herencia: «Área, altura y desarrollo de muro **heredados** de la geometría del proyecto (N zona(s), X m²). Se copian zona por zona, no se recalculan.» Se queda solo el dato del proyecto: «**Heredado** de la geometría del proyecto: N zona(s), X m²» | `GUIA.civil.ojo` | Sí: qué se hereda (área, altura y desarrollo de muro) y el criterio (se copian zona por zona, no se recalculan). |
| Banner de captura a mano: «Cantidades capturadas a mano en esta pestaña: la geometría del proyecto no las toca.» (se quita entero; el menú «¿De dónde salen las cantidades?» ya dice «Capturadas a mano aquí») | `GUIA.civil.ojo` | Sí: «Si eliges capturarlas a mano en esta pestaña, la geometría del proyecto no las toca.» |

## Soportería (`viewSoporte`)

| Texto quitado de la vista | Dónde queda en la guía | Información movida a la guía |
|---|---|---|
| Opción del menú «Arriostramiento sísmico»: «Sí — NFPA 13 cap. 18 (Baja California es zona sísmica)» pasa a «Sí, se incluye» (la otra opción no cambia) | `GUIA.soporte.ojo` (ya traía NFPA 13 cap. 18 y Baja California) | Solo un matiz: «Baja California, zona sísmica». El valor guardado (`true`/`false`) no cambia. |

## Estructural (`viewEstructural`): sin cambios

Esta pantalla no tiene entrada en `GUIA` (`guiaHtml("estructural")` devuelve vacío), así que no hay guía con la que repita. Sus textos SON el contenido de la pantalla (declaración del módulo externo): identidad de StructCalc v0.1.2, criterio de liberación, uso admisible y la tarjeta «Qué hace hoy». Lo que sí hay es repetición interna (la tarjeta 1, la tarjeta 2 «sin revisar», la nota `.accnota` de la barra y `DISCIPLINAS.estr`/`MOTOR_ACC.estr.externo` dicen lo mismo con otras palabras); la nota de la barra es la razón accesible de los botones apagados (una prueba la exige) y no se puede quitar. Decisión pendiente del dueño: crear `GUIA.estructural` y vaciar la tarjeta 1, o dejarla así. No lo hice por su cuenta porque dejaría la pantalla casi vacía.

## Retenido a propósito (repite la guía en parte, pero por regla no se toca)

| Texto que se queda | Dónde | Por qué |
|---|---|---|
| Aviso «Con N unidades mueble el método de Hunter pierde sentido estadístico...» | Observaciones de hidro (motor, `computeHidro`, solo si 0 < UM < 10) | Aviso calculado por el motor con la cifra del proyecto. La guía tiene la regla general; el aviso sale solo cuando aplica. |
| Nota «PREDISEÑO: la trayectoria más desfavorable se resuelve completa...» | Memoria de cálculo de fuego (`r.memo`) y párrafo del PDF | Memoria: no se toca. Con esto el mismo mensaje sigue apareciendo en pantalla (memoria), PDF y guía. |
| Nota «Las cantidades salen de la geometría capturada en las zonas y en los cuartos limpios. Si cambia un área, esta sección se recalcula sola.» | Notas de civil (`r.memo`) y PDF | Es el par «origen de cantidades» más literal con `GUIA.civil.ojo`, pero es memoria del motor. Si el dueño quiere quitarla, es un cambio del motor y de su PDF, no de la vista. |
| Aviso «Arriostramiento sísmico DESACTIVADO. Baja California es zona sísmica; NFPA 13 cap. 18 lo exige. Declarar como exclusión expresa...» | Observaciones de soporte (motor) | Aviso calculado; sale solo cuando el usuario elige «No». |
| Descripción de la opción elegida: `R.cls.uso` (clase ISO 8573-1), `R.mat.nota` (material de la red de aire), `R.sisMuro/sisPlafon/sisPiso.nota` (obra civil), `R.r.ej` (clase de riesgo NFPA 13), `R.equipo.nota` (elevación) | Bajo cada menú | Ayuda propia del campo, cambia con lo elegido; la guía es fija y no puede sustituirla. Dos se parecen a la guía de aire (clase 1.2.1 «la pide la URS de cuarto limpio» e inoxidable «lo exige una URS»). |
| Tarjeta «Equipo hidroneumático»: «La curva la firma el fabricante...», «Su elección queda asentada... no modifica ningún cálculo», «Esto no sirve para contra incendio. NFPA 20 exige bomba listada UL y aprobada FM.» | `tarjetaHidroneumatico()` en hidro | La guía de hidro no dice nada de esto (no se repite); son la advertencia del campo de selección y una advertencia de seguridad. |
| Proposición entre disciplinas (`propuestaHtml`, texto `P.que`) en eléctrico y soporte; tarjeta de costo (`tarjetaCosto`); panel «Punto de partida» (`cxPanelCargaHtml`) | Componentes comunes | Reglas 1 a 3 de interoperabilidad y estados; son componentes compartidos por todas las pantallas, no texto de guía de estas seis. |
| Etiquetas de tarjeta («ISO 8573-1», «MSS SP-58 · SMACNA · NFPA 13», «NFPA 20», «sección A», «lo que la geometría no sabe») | h3 de las tarjetas | Rótulos, no texto explicativo. |

## Pruebas

- Antes: 305/305 (`--base ...\tests2\base-pre.html`, `base_run.log`).
- Después del parche: **311/311** con `--base` (305 anteriores intactas + GB.1 a GB.6). `banco_final.log`. La comparación `--base` del propio banco sigue en cero diferencias numéricas.
- Comparación de estados con el mismo proyecto lleno (eléctrico, hidro con tramo de id fijo, fuego, aire, civil, soportería con motores, permisos concedidos): `LOADS, SYS, DUCT, VENT, CLEAN, QUOTE, ELEC, HIDRO, FUEGO, AIRE, CIVIL, SOPORTE, VALID` en JSON, `catalogoConceptos()` y los 8 PDF (`buildElecPdf`, `Hidro`, `Fuego`, `Aire`, `Civil`, `Soporte`, `MemoriaIntegral`, `Cotizacion`, con las fechas enmascaradas): **cero diferencias** entre `index.orig.html` y `index.html` (`identidad_numerica.log`). Nota: el id de un tramo de agua nuevo es aleatorio (`defaultTramoAgua`) y aparece en `HIDRO`; sin fijarlo dos cargas del MISMO archivo ya difieren, no es efecto del parche.
- Las pruebas nuevas detectan la regresión: contra `index.orig.html` fallan GB.1, GB.2, GB.3, GB.4 y GB.5 (GB.6 solo comprueba que dibujan).
- Ninguna comprobación existente exigía los textos quitados (se buscó `contiene(vista..)`, `.guia` y `GUIA`; la única que lee `GUIA` es la de ductos, `GUIA.ductos.ojo`, que no es de este parche).

| Prueba | Qué fija |
|---|---|
| GB.1 | Lo quitado de cada vista vive en `GUIA[tab]`, en el campo que toca (`ojo` o `metodo`). |
| GB.2 | Con la guía visible el texto sale solo dentro de `.guia-txt`, no en el resto de la vista (proyecto lleno, para que memorias y tarjetas no lo reintroduzcan). |
| GB.3 | Con la guía oculta ninguno de esos textos aparece y el botón «Qué calcula esta pestaña» sigue. |
| GB.4 | `metodo` se pinta como «Método.» entre «Cuándo se usa» y «Ojo», y solo si existe; eléctrico, hidro y aire lo traen. |
| GB.5 | Lo que no se toca sigue: aviso de diez UM (0 < UM < 10), ayuda de campo del transformador, nota PREDISEÑO de la memoria de fuego, instrucción de columnas de aire, banner de herencia de civil con «N zona(s), X m²», memoria de civil, menú «Capturadas a mano aquí» sin banner, aviso de sismo desactivado. |
| GB.6 | Las seis pantallas dibujan sin error, con guía visible u oculta, sin «undefined» ni «NaN». |

## Para decidir / notas

1. `metodo` es un campo nuevo de `GUIA`. Alternativa sin tocar `guiaHtml`: fundir el método dentro de `que` u `ojo`; la guía quedaría con párrafos largos. Si otro grupo de guías ya añadió el mismo campo con otro nombre, hay que unificarlo a mano (este parche no lo detecta si el nombre es distinto).
2. La guía de eléctrico queda en cuatro renglones (que, cuándo, método, ojo); el comentario de `guiaHtml` dice «dos renglones», ya no es cierto para las que traen método.
3. Civil, modo captura a mano: ya no hay banner. Si el dueño lo quiere como marca de estado, basta reponer un `<div class="her propio">` sin frase.
4. Pares que se dejaron por ser memoria o motor (fuego PREDISEÑO, civil «las cantidades salen de...», hidro diez UM, soporte sismo desactivado) siguen repitiendo lo que dice la guía en pantalla; si el dueño quiere cero repetición también ahí, es decisión sobre el motor/PDF, no sobre la vista.
5. El bloque estructural queda como está (ver arriba).
