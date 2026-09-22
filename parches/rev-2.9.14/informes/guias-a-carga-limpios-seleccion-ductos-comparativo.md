# guias-a · guías repetidas: carga, limpios, selección, ventilación, ductos, comparativo

Regla del dueño (19-sep-2026): el texto explicativo estático vive solo en la guía (`GUIA` / `guiaHtml`);
si el usuario oculta la guía, ya no aparece. Ningún número de motor ni de cotización se mueve.

**Entregables** (esta carpeta): `parche_guias.py` (edita `index.html`), `parche_pruebas.py` (edita `pruebas.mjs`),
este informe. Copias ya parcheadas para inspección: `index.html`, `pruebas.mjs` (originales: `*.orig.*`).

## 1. Criterio aplicado

Se quita de la vista un texto solo si cumple las dos condiciones:

1. Repite o parafrasea lo que dice `GUIA[tab]` (qué calcula / cuándo se usa / ojo), o describe el motor, su método o sus
   normas sin estar atado a un control, a un estado del proyecto ni a un resultado.
2. No es ayuda propia de un campo (tabla `REF`), ni aviso calculado (estado de zona, permisos, cifras, retorno), ni memoria
   (`r.memo`), ni cifra.

Antes de quitarlo, lo que la guía no traía (norma, umbral, criterio) se copió a la guía. No se cambió `guiaHtml` (es
compartida con guias-b y guias-c): solo las cadenas de `GUIA.carga/seleccion/limpios/ductos/comparativo`.

## 2. Tablas por pantalla

### Carga (`viewCarga`)

| Texto quitado de la vista | Dónde queda en la guía | Información movida a la guía |
|---|---|---|
| Estado vacío: «Una zona es cada espacio con su propio termostato: un cuarto, un área abierta, una nave.» (se conserva «Este proyecto todavía no tiene zonas.» y el botón «Agregar la primera zona») | `GUIA.carga.ojo`, 1.ª oración (ya decía «una zona es cada espacio con su propio termostato, no cada cuarto») | Los ejemplos: «un cuarto con termostato propio, un área abierta o una nave». |
| Aviso «Ésta es la selección aislada de la zona. El proyecto tiene N zonas: el sistema consolidado del edificio —chiller con manejadoras, o condensadoras con unidades interiores— está en Proyecto → Sistema integrado, junto con la cédula de equipos.» (se conserva el botón «Ver el sistema del edificio», solo con más de una zona) | `GUIA.carga.ojo`, 2.ª oración | Que la selección de esta pestaña es la aislada de cada zona; dónde está el sistema consolidado (Proyecto → Sistema integrado, con la cédula de equipos); las dos formas del consolidado (chiller + manejadoras / condensadoras + interiores); la condición «con varias zonas». |

### Selección (`viewSeleccion`)

| Texto quitado de la vista | Dónde queda en la guía | Información movida a la guía |
|---|---|---|
| Aviso final de «Bases de precio»: «Lee esto antes de mandar una cotización. Los precios que traen de fábrica salen de una referencia interna de la casa de grado cuarto limpio, con filtración HEPA y variadores. Para una nave o una oficina normal esos números quedan altos. Ajusta el factor de arriba o captura tu lista vigente por familia; … valida contra la cotización del distribuidor antes de firmar. Los precios se guardan dentro del proyecto.» | `GUIA.seleccion.ojo`, oraciones 2 a 4 (antecedidas por «Antes de mandar una cotización:») | Grado cuarto limpio con HEPA y variadores; «para nave u oficina normal quedan altos»; ajustar factor o capturar lista vigente por familia; validar contra el distribuidor antes de firmar; los precios se guardan dentro del proyecto. |

El aviso **sigue en el campo**: `REF["quote.priceFactor"]` («1.00 = precio semilla, que viene de una obra de grado cuarto limpio y corre alto.
Para obra comercial suele quedar entre 0.55 y 0.75.») y `REF["quote.price.ahu"]` no se tocaron; la prueba GA.4 lo verifica con la guía oculta.

### Cuartos limpios (`viewLimpio`)

| Texto quitado de la vista | Dónde queda en la guía | Información movida a la guía |
|---|---|---|
| Nota «ISO 14644-1 clasifica por concentración de partículas: con clase, área y altura basta para arrancar. El rango de cambios de aire, la cobertura de filtros en techo y la cascada de presión no salen de la 14644-1 —esa norma no los fija— sino de la ISO 14644-4 y de la guía ISPE.» (se deja un separador de 12 px para conservar el ritmo vertical) | `GUIA.limpios.ojo` (norma) y `GUIA.limpios.cuando` («con clase, área y altura basta para arrancar») | Las tres normas y qué sale de cuál (14644-1 clasifica; 14644-4 e ISPE fijan cambios de aire, cobertura y cascada); el criterio «con clase, área y altura basta para arrancar». |
| Nota «Este motor resuelve volumen de aire. Caudal, filtración terminal y presurización. La carga térmica de este cuarto no se calcula aquí: se captura como zona en Carga térmica, con el tipo de espacio Cuarto limpio, su clase ISO y sus cambios de aire. Así el calor de los ventiladores, el proceso, la iluminación, los ocupantes y la reposición entran una sola vez, con el barrido horario y la psicrometría completos.» | `GUIA.limpios.que` (las dos primeras oraciones ya estaban: «caudal por clase ISO, módulos de filtro terminal, presurización y reposición») y `GUIA.limpios.cuando` | Dónde y cómo se captura la carga térmica (zona de Carga térmica, tipo de espacio Cuarto limpio, clase ISO, cambios de aire) y el porqué: el calor de ventiladores, proceso, iluminación, ocupantes y reposición entran una sola vez con barrido horario y psicrometría completos. |

### Ventilación (`viewVent`)

Sin cambios. La vista no trae texto estático que repita `GUIA.ventilacion`: lo que se ve es de campos (`REF`), la propuesta
y la herencia (`propuestaHtml`, `herenciaHtml`, texto de la capa de interoperabilidad, ligado al estado), la selección
Greenheck, la memoria y `tarjetaCosto`. El HTML de `viewOf("ventilacion")` sale idéntico byte a byte en los siete estados probados.

### Ductos (`viewDuct`)

| Texto quitado de la vista | Dónde queda en la guía | Información movida a la guía |
|---|---|---|
| Nota «Método: Darcy–Weisbach con Haaland, dimensionado por fricción constante o por velocidad, calibres SMACNA por clase de presión y accesorios Ductmate compatibles.» | `GUIA.ductos.que` (ya decía «fricción constante o por velocidad, con calibre SMACNA y cuantificación de lámina») | Darcy–Weisbach con Haaland; calibres SMACNA **por clase de presión**; accesorios Ductmate compatibles. (Comprobado contra el motor: `haaland()` es lo que usa.) |
| Nota bajo la gráfica «Pérdida por tramo»: «La presión del ventilador que se muestra suma todos los tramos de suministro y retorno, porque el recorrido crítico todavía no se calcula: es una cota superior del recorrido crítico de los tramos capturados; no incluye tramos, rejillas ni filtros que no estén en la lista[; sin tramos de retorno capturados]. Si un tramo domina, revisa su velocidad o sus accesorios antes de subir el equipo.» | `GUIA.ductos.ojo` | Que la suma es de los tramos **de suministro y retorno** y **por qué** («el recorrido crítico todavía no se calcula»); el criterio «Si un tramo domina la pérdida, revisa su velocidad o sus accesorios antes de subir el equipo». Ya estaban en la guía: cota superior, lo que no incluye, retorno de la red generada. La cola dinámica «sin tramos de retorno capturados» NO se copia a la guía (la prueba 22.6 exige que no salga cuando hay retorno): sigue en el sub de la métrica. |
| Fila vacía de la tabla: «Sin tramos. Agrega uno o genéralo desde la carga térmica.» → «Sin tramos.» | `GUIA.ductos.cuando` («Se pueden generar los tramos desde la carga térmica con un botón») | Nada nuevo (los dos botones están en pantalla). |

### Comparativo (`viewComparativo`)

| Texto quitado de la vista | Dónde queda en la guía | Información movida a la guía |
|---|---|---|
| Leyenda bajo la tabla: «Los valores en ámbar se salen del patrón del propio proyecto —más del 80 % por encima o por debajo de la mediana de las demás zonas—. No están mal por definición: están fuera de familia, y eso vale la pena revisarlo.» | `GUIA.comparativo.ojo` (ya decía «mediana del propio proyecto»; `cuando` ya decía «fuera de familia») | El umbral («más del 80 % por encima o por debajo de la mediana de las demás zonas») y el criterio («no están mal por definición… vale la pena revisarlo»), tal como los decía la vista. Ver hallazgo 1. |

## 3. Revisado y conservado (con el motivo)

| Pantalla | Texto | Motivo |
|---|---|---|
| carga | Semáforo de zona («Zona completa / incompleta / necesita revisión») | Aviso calculado por `estadoZona` con la lista de lo que falta. |
| carga | «Con área, altura y tipo de espacio basta para un estimado: Autollenar… Envolvente automática…» | Explica los dos botones que tiene encima; no está en la guía. |
| carga | Aviso «Cuarto limpio. El caudal lo manda la clase ISO…» dentro de la zona | Condicional al tipo de espacio (la guía no puede serlo); no repite `GUIA.carga`. Se parece a `GUIA.limpios.ojo` y a `REF["zone.achClean"]` (ver hallazgo 4). |
| carga | «0 = losa entre pisos» junto a «Cubierta expuesta» | Ayuda de campo. |
| carga | «Toca cualquier modelo para abrir su submittal…» | Operación de un control. |
| selección | `criterio.nota`, `fam.use`, «Procedencia», «La presión que pide la red de ductos no se está tomando en cuenta», «Precio base … exponente», «Queda registrado…», «Aún no hay equipos…» | Por familia, calculados o de estado; «Queda registrado» solo sale si el usuario eligió distinto de lo recomendado. |
| selección | «Alternativas de otras marcas» (explicación de la tarjeta) y «El desglose completo … está en la pestaña Cotización» | No repiten `GUIA.seleccion`; la segunda es señalización hacia otra pestaña, con el botón «Ir a Cotización» arriba. **Candidatos** si el dueño quiere vaciar más las vistas (destino: `GUIA.seleccion.cuando`). |
| limpios | Nota «El aire de reposición es el que sostiene la cascada de presión…» | Leyenda de la gráfica. |
| ductos | Sub de la métrica «Presión del ventilador»: «+15 % de margen · suma de tramos, cota superior solo de los tramos capturados[ · sin tramos de retorno capturados]» | Califica una cifra y su cola depende del estado (hay o no retorno): regla 4 (cifras y avisos con datos del proyecto). Es la tercera vez que se dice la presión del ventilador; con esto quedan dos (métrica + guía). Ver hallazgo 2. |
| ductos | «Con qué se compra: cambian el despiece y la merma, no el cálculo hidráulico» | Ayuda de dos campos contiguos. |
| ductos | Notas del despiece y de la BOQ (12 % de traslapes, 4 pies entre juntas, 5 a 10 % de taller, juntas cada 1,22 m, soportes cada 2,4 m) | Notas de método de un resultado, con umbrales que la guía no trae. **Candidatos** (destino: `GUIA.ductos.que`). |
| comparativo | «El porcentaje de vidrio … Arriba de 40 % …» y «Si una sola zona se lleva más de la mitad…» | No repiten la guía: son criterios de una columna y de una gráfica. **Candidatos** (destino: `GUIA.comparativo.ojo`). |
| comparativo | Estado vacío «Todavía no hay zonas que comparar…» (en `viewOf`) | Estado del proyecto + acción. |
| todas | `tarjetaCosto`, `propuestaHtml`, `herenciaHtml`, memorias, tablas | Resultados, estado o componentes compartidos. |

## 4. Pruebas (`parche_pruebas.py`)

* **22.6 (ductos)**: exigía en pantalla la nota de la gráfica. Ahora exige que **no** se repita y que su contenido salga en la
  pantalla por `GUIA.ductos.ojo` («la suite muestra la suma de los tramos de suministro y retorno, porque el recorrido crítico
  todavía no se calcula: es cota superior …»). Conserva la exigencia del sub de la métrica y del «sin tramos de retorno
  capturados» solo cuando no hay retorno. La sección «Guía del módulo» exige además lo movido y que la guía **no** traiga la cola dinámica.
* **Grupo nuevo GA.1 a GA.6** (6 pruebas): GA.1 la guía trae las 19 frases movidas; GA.2 `viewOf()` ya no trae los textos
  quitados (2 zonas, 1 zona, sin zonas, ductos sin tramos); GA.3 cada frase movida sale exactamente una vez con la guía visible y
  cero con la guía oculta; GA.4 la ayuda del factor de lista sigue con la guía oculta; GA.5 el botón «Ver el sistema del edificio»
  y el estado vacío de carga; GA.6 ventilación sigue sin repetir la guía. GA.1 a GA.3 fallan sobre el original (comprobado) y pasan parcheado.
* El ancla común `const total = ok + fail;` se conserva en la inserción, así que, si los parches de guias-b/guias-c también insertan antes de
  ella, se pueden aplicar en cualquier orden.

## 5. Verificación

* Sobre mi copia original de la rev 2.9.14 (305): parche de vistas sin parche de pruebas → 304/305 (solo cae 22.6, esperado);
  con ambos parches → **311/311** (`--base base-pre.html`).
* Sobre copias frescas del archivo real al final del trabajo (ya con S.20 y demás cambios del dueño, copiando `parches/fixtures-formato` porque S.20 lo lee
  relativo al directorio de trabajo): sin parche **309/309**; con ambos parches **315/315** (309 + 6 GA). Ambos parches aplican sin editar el archivo real.
* Estado de los 15 motores (`sonda-motores.mjs`, con y sin permisos): **idéntico byte a byte** entre original y parcheado (0 diferencias numéricas).
* `viewOf()` de las 20 pestañas en 7 estados: las 14 que no son de guias-a salen idénticas byte a byte; en las seis de guias-a solo difieren las líneas de la sección 2
  (15 bloques de cambio en `index.html`: 9 en vistas y 6 en `GUIA`, que son 7 campos). Con la guía oculta ninguna de las seis pantallas conserva lo movido (lo único que contiene «Darcy» es la ayuda de campo `duct.meta.rho`, intacta).
* Solo cambian cadenas de texto y una plantilla (`go-sys`): sin cambios de JS lógico, CSS, colores, dependencias ni red.

## 6. Hallazgos y decisiones para el dueño

1. **Umbral del ámbar (comparativo).** El texto decía «más del 80 % por encima o por debajo de la mediana»; el código (`raro`, ~línea 18622) marca
   `v > 1.8 × mediana` o `v < mediana / 1.8` (es decir, se marca cuando queda más de 44 % por debajo, no 80 %). Se movió **tal cual** a la guía para no cambiar un criterio sin autorización.
   O se corrige el texto («o por debajo de 1/1.8 de ella») o el código; hoy la guía dice algo inexacto por debajo. Una línea.
2. **Presión del ventilador (ductos).** Quedan dos apariciones: el sub de la métrica y la guía. Si el dueño quiere solo la guía, hay que quitar ese `<div class="sub">` y adaptar 22.6
   (también perdería el aviso «sin tramos de retorno capturados» junto a la cifra). No lo hice porque calificaría una cifra y su cola es dinámica.
3. **Las guías crecieron.** `carga.ojo` 66→385 caracteres, `seleccion.ojo` 104→511, `limpios.cuando` 104→425, `limpios.ojo` 98→339, `ductos.ojo` 424→597,
   `comparativo.ojo` 95→292. Se pensaron «en dos renglones». Si molesta, la salida limpia es que `guiaHtml` admita un bloque plegable «Detalle»
   (función compartida: la decisión es del orquestador para no chocar con guias-b/guias-c).
4. **Aviso de cuarto limpio dentro de la zona (carga)** repite en parte `REF["zone.achClean"]` («Este valor es un piso…») y las filas calculadas «Caudal que gobierna» y «Calor de esos ventiladores». No es texto de guía y es condicional; lo dejé. Si se quiere quitar, no se pierde nada.
5. Repeticiones internas sin relación con la guía, no tocadas: «0 = losa entre pisos» repite `REF["zone.roof"].rec`; el exponente de escala se explica tres veces en selección
   (`REF["quote.scaleExp"]`, el precio base y la ref «1.00 = precio lineal por TR…»); `REF["duct.meta.eps"].rec` habla de Colebrook-White y el motor usa Haaland (aproximación explícita de la anterior).
6. `GUIA.ventilacion.que` enumera cuatro modos (general, cocina, industrial, rejilla) y la pantalla tiene cinco (falta «Reposición»). No tocado.
7. La prueba S.20 lee `parches/fixtures-formato/...` relativo al directorio desde donde se corre; corriéndola desde otra carpeta sin esa ruta cae por ENOENT, no por estos parches.

## 7. Cómo aplicar y texto sugerido para la bitácora

```
cd C:\Users\ASUS\Desktop\Emp_Suite
python <ruta>\parche_guias.py index.html
python <ruta>\parche_pruebas.py pruebas.mjs
node pruebas.mjs index.html --base <base-pre.html>     # esperado: banco actual + 6 (GA.1 a GA.6)
```
Ambos scripts afirman coincidencia única, no escriben nada si algo no coincide y respetan CRLF. No suben `REV`.

Bitácora (sugerida): «Guías repetidas, pantallas carga, cuartos limpios, selección, ductos y comparativo (decisión del dueño 19-sep-2026): se quitan de la vista
nueve textos explicativos que repetían la guía y se pasa a `GUIA` lo que solo decía la vista (definición de zona con ejemplos y selección aislada,
precios de fábrica de grado cuarto limpio y validación con distribuidor, normas ISO 14644-1/-4 e ISPE y captura de la carga térmica del cuarto limpio,
método Darcy–Weisbach/Haaland, criterio de tramo dominante, umbral del ámbar). Ventilación sin cambios. Ayuda de campo, avisos calculados, cifras, memorias y motores intactos;
estado de los 15 motores idéntico. Pruebas: 22.6 reapuntada a la guía y grupo GA.1–GA.6.»
