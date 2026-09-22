# Bitácora · SuiteEmp rev 2.9.15

**Fecha:** 21-sep-2026 · **Base:** rev 2.9.14 · **Regla permanente:** ningún número de los motores ni de las cotizaciones puede moverse.

## 1. Qué es esta revisión

Esta revisión corrige textos que contradecían al código. Como el código no se mueve, se corrigió el texto para que diga lo que el código hace. Además:
- las ventanas emergentes quedaron accesibles con teclado y lector de pantalla;
- el proyecto abierto muestra su semáforo en vivo en «Proyectos recientes»;
- el comparador ahora revisa también los números de los PDF.

No cambió ninguna fórmula, constante, umbral ni orden de cálculo.

## 2. Cambios

### 2.1 Textos corregidos a mano (conocidos desde la 2.9.14)

| Dónde | Decía | Dice ahora | Código |
|---|---|---|---|
| `REF["duct.meta.eps"]` | «Se usa en Colebrook-White…» | «Se usa en la ecuación de Haaland (forma explícita de Colebrook-White)…» | `friction()` llama a `haaland()` |
| `GUIA.ventilacion.que` | general, cocina, industrial o rejilla (4) | cinco modos: general, cocina, industrial, rejilla y reposición | `viewVent` ofrece 5 modos (`mua` = Reposición) |
| `GUIA.comparativo.ojo` | «más del 80 % por encima o por debajo de la mediana de las demás zonas» | «más de 1.8 veces la mediana de las zonas del proyecto, o menos de esa mediana entre 1.8 (≈ 56 %)» | `raro = v > med·1.8 \|\| v < med/1.8`, con la mediana de todas las zonas |
| Semáforo · ductos | «sin tramos» aunque haya tramos sin caudal | «N tramo(s) sin caudal» | la captura real de ductos exige caudal > 0 |
| Semáforo · cuartos limpios | «sin cuartos» | «sin cuartos con área y altura» | la semilla ya trae un cuarto vacío |

### 2.2 Barrido de textos contra código: eléctrico e hidrosanitario (grupo G3)

Un agente revisó todos los textos visibles del grupo: pantalla, guía, REF, NORMAS, avisos, PDF, Excel y espejo en inglés. Un segundo agente, escéptico, trató de refutar cada hallazgo contra el código. Los **21 quedaron confirmados** y se aplicaron sin cambios de código.

| Id | Disciplina | Superficie | Qué decía | Qué dice ahora (lo que hace el código) |
|---|---|---|---|---|
| G3-01 | Eléctrico | excel | 125 % de la corriente de demanda, al tamano comercial superior | Mayor entre la proteccion del alimentador (125 % solo sobre las cargas continuas que no son motor; el 25 % del motor mayor ya va en la demanda) y la del ramal del motor mayor (art. 430-63) |
| G3-02 | Eléctrico | ingles | 125 % of demand current, rounded to the next standard size | Larger of the feeder protection (125 % only on continuous non-motor loads; the largest motor's 25 % is already in the demand) and the largest motor's branch protection (art. 430-63) |
| G3-03 | Eléctrico | guia | para que las cargas entren solas con su MCA. | para aceptar como propuesta sus cargas con su kW, tensión y fases. |
| G3-04 | Eléctrico | otro | con el mismo MCA que se imprime en el submittal | con la misma potencia, tensión y fases que se imprimen en el submittal (el conductor se dimensiona con la corriente de esa potencia, no con el MCA) |
| G3-05 | Eléctrico | vista | conductor de ${mat} tipo THW/THHW-LS 75 °C | conductor de ${mat} con ampacidad de la columna de 75 °C · relleno de canalización con áreas THHN/THWN-2 (Tabla 5 del capítulo 9) |
| G3-06 | Eléctrico | pdf | THW/THHW-LS 75 C · Tabla 310-15(b)(16) | (ampacidad a 75 C, Tabla 310-15(b)(16)) · canalizacion con areas THHN/THWN-2 (Tabla 5 del cap. 9) |
| G3-07 | Eléctrico | vista | cada uno solo si su cruce está autorizado. Al aceptarlas se vuelven cargas de este cuadro | cada uno solo si su motor ya lo calculó (la propuesta se arma con todos los cruces hacia el eléctrico). Al aceptarlas quedan autorizados esos cruces y se vuelven cargas de este cuadro |
| G3-08 | Eléctrico | otro | HP y kW del compresor seleccionado (y de su unidad de relevo, si la hay). | HP y kW del compresor seleccionado y número de unidades en servicio; la de relevo N+1, si la hay, no se suma porque no corre en simultáneo. |
| G3-09 | Hidrosanitario | vista | Pérdida total en la trayectoria más desfavorable ${n(hfTotal, 2)} m (incluye 30 % de longitud equivalente por accesorios y la altura estática). | Pérdida total sumando todos los tramos capturados, de agua fría y caliente, ${n(hfTotal, 2)} m (incluye 30 % de longitud equivalente por accesorios y la altura estática); la trayectoria más desfavorable no se aísla. |
| G3-10 | Hidrosanitario | otro | Metros de tubería por diámetro, muebles, cisterna y equipo de bombeo. | Metros totales de tubería de los tramos (50 m supuestos si no hay longitudes capturadas), volumen de cisterna y HP del equipo de bombeo. |
| G3-11 | Hidrosanitario | otro | Para cotizar la instalación hidrosanitaria con los diámetros que salieron del cálculo, no con los que se recuerdan. | Para cotizar la instalación hidrosanitaria con los metros de tubería, la cisterna y la bomba que salieron del cálculo, no con los que se recuerdan. |
| G3-12 | Hidrosanitario | excel | L("Hunter / NOM-008-CNA" | L("Hunter (IPC apendice E) / Hazen-Williams" |
| G3-13 | Hidrosanitario | ingles | "Hunter / NOM-008-CNA") | "Hunter (IPC Appendix E) / Hazen-Williams") |
| G3-14 | Eléctrico | pdf | proteccion hasta 250 % de la corriente a plena carga (art. 430-52) | proteccion al 250 % de la corriente a plena carga, a la capacidad normalizada inmediata superior (art. 430-52) |
| G3-15 | Eléctrico | vista | Criterio de caída de tensión: 3 % en circuito derivado y 5 % acumulados. | Criterio de caída de tensión: el capturado para circuito derivado y el acumulado desde la acometida (3 % y 5 % por omisión). |
| G3-16 | Eléctrico | guia | los datos del transformador de la acometida solo sirven para estimar la corriente de falla y elegir la capacidad interruptiva. | los datos del transformador de la acometida solo sirven para estimar la corriente de falla, elegir la capacidad interruptiva y avisar si la demanda pasa del 80 % de su capacidad. |
| G3-17 | Eléctrico | vista | ${c.auto ? " · desde la cédula" : ""} | ${c.auto ? " · desde otro motor" : ""} |
| G3-18 | Hidrosanitario | vista | la potencia al eje no cabe ni repartida entre ${nMax} bombas | la potencia al eje no cabe ni repartida entre ${nMax} bombas con una de relevo |
| G3-19 | Eléctrico | vista | "sin cargas" | "sin cargas con kW capturados" |
| G3-20 | Eléctrico | vista | "Faltan cargas eléctricas" | "Faltan cargas eléctricas con kW capturados" |
| G3-21 | Eléctrico | ref | un tubo en azotea pasa de 50 °C y pierde una cuarta parte de la ampacidad | un tubo en azotea llega a 50 °C y pierde una cuarta parte de la ampacidad |


### 2.3 Ventanas emergentes (accesibilidad)

- `#modal` lleva `role="dialog"`, `aria-modal="true"` y `aria-labelledby` apuntando al título de cada hoja.
- Al abrir, el foco entra al primer control, que en todas las hojas es **Cerrar o Cancelar, nunca la acción que confirma** (importante en «Borrar proyecto»).
- Tab y Mayús+Tab dan la vuelta dentro de la ventana. Con el foco afuera, Tab lo regresa a la ventana.
- Al cerrar, el foco regresa al control que la abrió. Si ese control se redibujó, regresa a su equivalente.
- Si la hoja se redibuja con la ventana abierta (el select de un tramo, la lista de proyectos), el foco y el cursor vuelven al mismo campo. Antes caían a `<body>`.
- Sin cambios visuales: la prueba S.A11Y.5 prohíbe anular el anillo de foco y se respetó.

### 2.4 Proyectos recientes

El proyecto abierto muestra su semáforo **en vivo**. Los demás muestran el de su último guardado, que es el que corresponde a la fecha de al lado. El `title` de cada renglón dice cuál de los dos es.

### 2.5 Comparador de los 15 motores

- **PDF (nuevo):** compara los números de cada PDF que emite la suite: memoria y cotización de cada motor, memoria integral, memoria general, cédula de equipos, propuesta en español y en inglés, y licitación. Los compara en orden, con igualdad exacta de su escritura y con el contexto de cada uno. Quita el pie «Página i de n» y normaliza la marca de revisión. El texto sin números se informa aparte.
- **Autoprueba:** además de lo que ya revisaba, exige que un precio movido a propósito se vea en los PDF; salieron **268 números distintos**.
- **Guardado simétrico:** en el modo nativo, las dos versiones guardan antes de leer el Excel y los PDF. Guardar solo en la base producía un falso «sin proyecto abierto» en la memoria integral.
- **10 escenarios nuevos de captura parcial** (`parcial-*`): proyecto vacío con una sola disciplina capturada.
  - Contra incendio sola.
  - Cantidades directas de obra civil.
  - Riel de soportería.
  - Cocina sin medidas y cocina con medidas.
  - Un tramo de ducto sin caudal y uno con caudal.
  - Un cuarto limpio solo.
  - Un equipo elegido a mano.
  - Una zona sola.

  En total son 56 escenarios.
- `LEEME.md` quedó actualizado.

## 3. Verificación

- **Banco:** 340 de 340 con --base (335 de 335 sin él). Pruebas nuevas:
  - **S.26:** ventana como diálogo, foco, Tab y regreso de foco.
  - **S.27:** los textos dicen lo que hace el código (Haaland, 5 modos, 1.8×, tramos sin caudal).
  - **S.28:** semáforo en vivo en Proyectos recientes.

  Se actualizaron dos textos esperados que la 2.9.14 copió de la guía (comparativo y eléctrico).
- **Comparador contra la 2.9.14** (56 escenarios × 2 modos, motores + Excel + PDF): **cero números movidos**. Motores, cotización, validación cruzada y Excel (es y en): 0 diferencias numéricas en 1,5 millones de hojas comparadas. Ida y vuelta (guardar/abrir): 0. PDF: 781,027 números comparados, 0 cambiados, 0 que desaparecieran y 1,190 agregados, todos por texto nuevo (ver abajo; se revisaron los 1,190 uno por uno, porque el comparador los guardó completos). Texto: 672 diferencias, todas de los textos corregidos. El código de salida es 1 porque el comparador cuenta como estructural un número que aparece en el texto nuevo.
- **Diferencias marcadas en PDF que NO son números calculados**, revisadas una por una:
  - «THHN/THWN-2 (Tabla 5 del cap. 9)» agrega los dígitos 2, 5 y 9 al texto de la memoria eléctrica y de la memoria integral (G3-05 y G3-06).
  - «1 tramo(s) sin caudal» agrega el conteo de tramos al semáforo de la memoria integral.

  Ninguna proviene de un motor. Las filas de los motores, del Excel y de la cotización quedaron en cero.

## 4. Pendiente

1. **Barrido de textos de los grupos G1, G2, G4 y G5:**
   - G1: carga térmica, comparativo, cuartos limpios y selección de equipo.
   - G2: ductos y ventilación.
   - G4: contra incendio, aire comprimido, civil, soportería y estructural.
   - G5: cotización, valor, Kaizen, tablero, proyecto y catálogo.

   Los cuatro agentes se cortaron por el límite de uso de la sesión. El guion está listo y se reanuda con los mismos criterios. Por el tamaño del G3 (21 hallazgos), se esperan del orden de 15 a 25 por grupo.
2. **Pendientes de la 2.9.14 que siguen abiertos** (decisiones del dueño):
   - pisos internos de los motores en la cotización;
   - precios sin uso;
   - controles anidados dentro de tarjetas-botón;
   - «Desactualizado» en el punto del menú;
   - semáforo de Kaizen y Valor dependiente de la pestaña;
   - paleta.
3. **Observación del G3 para el dueño (no es texto, no se tocó):** la memoria dice que el conductor es THW/THHW-LS, pero el tubo se calcula con áreas THHN/THWN-2, que son menores. Con THW-LS instalado, el tubo reportado puede quedar chico. El texto ya dice lo que el código hace. Si la obra usa THW-LS, **decidir** si el cálculo debe cambiar; eso sí movería números.
4. **Observación del G3 (no es texto, no se tocó):** la cotización hidrosanitaria usa un solo precio por metro, sin diámetro, y supone 50 m cuando no hay longitudes. El texto ya lo dice. Cambiarlo movería números.

## 5. Archivos

- `index.html`: rev 2.9.15.
- `pruebas.mjs`: S.26 a S.28.
- `SuiteEmp-2.9.15-instalador.zip`.
- `parches/comparador-15-motores/`: `comparar15.mjs` con PDF y escenarios parciales, `LEEME.md`, `informe-2.9.15-vs-2.9.14.txt` y `resultado-2.9.15.json`.
- Respaldos en `respaldo-rev-2.9.8/`: `index-2.9.15-inicio-*`, `pruebas-2.9.15-inicio-*` e `index-2.9.15-antes-de-G3-*`.
