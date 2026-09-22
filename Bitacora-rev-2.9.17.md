# Bitácora · SuiteEmp rev 2.9.17

**Fecha:** 21-sep-2026 · **Base:** rev 2.9.16 · **Regla:** ningún número de los motores ni de las cotizaciones se mueve.

## 1. Qué es esta revisión

Revisión de textos contra el código de todo lo que faltaba (eléctrico e hidrosanitario ya se hicieron en la 2.9.15). Grupos:

- **G1:** carga térmica, comparativo, cuartos limpios y selección de equipo.
- **G2:** ductos y ventilación.
- **G4:** contra incendio, aire comprimido, obra civil, soportería y estructural.
- **G5:** cotización, tablero, proyecto y catálogo. Kaizen e Ingeniería de valor se revisaron solo como textos, no como disciplinas de cálculo.

Un agente por grupo buscó cada texto visible que contradijera al código: guía, REF, NORMAS, vista, avisos, memoria, PDF, Excel y espejo en inglés. Un segundo agente, escéptico, intentó refutar cada hallazgo contra el código. **El código manda:** solo se cambió texto.

**Resultado:** 68 hallazgos. 47 confirmados, 14 confirmados con la redacción corregida y 7 refutados. Se aplicaron 61, cada uno con su subcadena exacta y su número de ocurrencias verificado.

## 2. Aplicados

| Id | Disciplina | Superficie | Decía | Dice ahora (lo que hace el código) |
|---|---|---|---|---|
| G1-01 | HVAC nucleo · cuartos limpios en carga termica | vista | El calor de los ventiladores de filtro entra como carga interna, calculado a partir del caudal que exige la clase. | El calor de los ventiladores de filtro entra como carga interna, con los módulos que exige la clase: el mayor entre el conteo por caudal y el de cobertura de techo. |
| G1-02 | HVAC nucleo · carga termica | ref | LED sin lastre 1.00 · fluorescente con balastro 1.20 · descarga 1.25. | LED 1.00 · fluorescente con balastro 1.20 · incandescente 1.00. |
| G1-03 | HVAC nucleo · carga termica | ref | 24 h anula el crédito por almacenamiento. | 24 h reduce el crédito por almacenamiento: los factores suben hacia 1, pero no lo anulan del todo. |
| G1-04 | HVAC nucleo · carga termica | pdf | mes de julio, hora solar ${P.HOUR} · | mes de julio, ${S.peakScan === false ? ʼhora solar ${P.HOUR}ʼ : ʼbarrido de ${HOURS[0]} a ${HOURS[HOURS.length - 1]} h solares, se reporta la hora pico de cada zonaʼ} · |
| G1-05 | HVAC nucleo · cuartos limpios | pdf | Filtracion terminal HEPA H14 (EN 1822-1) en difusor perforado de plafon | Filtracion terminal HEPA segun la clase de cada cuarto (EN 1822-1: H14 en ISO 5, H13/H14 en ISO 6 e ISO 8, H13 en ISO 7) en difusor perforado de plafon |
| G1-06 | HVAC nucleo · cuartos limpios | pdf | (nivel ${c.level === "min" ? "minimo" : c.level === "max" ? "maximo" : "medio"} del rango ISO) | (${r.achManual ? "fijados por el proyecto" : ʼnivel ${c.level === "min" ? "minimo" : c.level === "max" ? "maximo" : "medio"} del rango ISOʼ}) |
| G1-07 | HVAC nucleo · cuartos limpios | ref | Persona con bata genera menos latente que en calle. | Aquí los ocupantes solo fijan el aire exterior mínimo (el mayor entre la regla por persona y la regla por área); su calor se calcula en la zona de Carga térmica igual que cualquier ocupante, sin descuento por bata. |
| G1-08 | HVAC nucleo · carga termica | ref | 0 lo deja calcularse por ASHRAE 62.1. | 0 lo deja calcularse: el mayor entre ASHRAE 62.1 y la tabla 45 por persona y por área (y la fracción mínima, si se capturó). |
| G1-09 | HVAC nucleo · seleccion de equipo | pdf | TR (bloque + ${P.MARGIN * 100} % margen) | TR (bloque x ${n(y.userDiv, 2)} de diversidad del edificio + ${P.MARGIN * 100} % margen) |
| G1-10 | HVAC nucleo · seleccion de equipo | normas | AHRI 210/240, 340/360, 550/590 y 1230 para los factores de corrección | AHRI 210/240, 310/380, 340/360, 550/590 y 1230 para los factores de corrección |
| G1-11 | HVAC nucleo · seleccion de equipo | vista | cuesta 79 % más, no 100 % más. | cuesta 80 % más, no 100 % más. |
| G1-12 | HVAC nucleo · sistema integrado | vista | Los tres motores cerraron sin observaciones. | Todos los motores cerraron sin observaciones. |
| G1-14 | HVAC nucleo · carga termica | pdf | "fluorescente (x1.2)" : "LED" | "fluorescente (x1.2)" : "LED o incandescente (x1.0)" |
| G2-01 | Ductos | vista | Incluye 12 % por traslapes y refuerzos. Juntas cada 1,22 m; soportes cada 2,4 m (1,8 m si el lado mayor supera 900 mm). | Incluye 12 % por traslapes y refuerzos. Juntas cada 1,22 m en rectangular y, en espiroducto, una por cada largo comercial elegido; soportes cada 2,4 m (1,8 m si el lado mayor supera 900 mm). |
| G2-02 | Ductos | vista | +15 % de margen · suma de tramos, cota superior solo de los tramos capturados | +15 % de margen · suma de los tramos de suministro y retorno (extracción y grasa van en sus propios ventiladores), cota superior solo de los tramos capturados |
| G2-03 | Ductos | aviso | Ducto de grasa: NFPA 96 pide ≥ 500 fpm (7,6 m/s) | Ducto de grasa: velocidad por debajo de 7,6 m/s, el mínimo que aplica el motor (NFPA 96) |
| G2-04 | Ventilación | ref | ASHRAE 62.1: 17 CFM por persona. | Ocupantes para el aire exterior: rige el mayor entre ASHRAE 62.1 (Rp por persona y Ra por área según el tipo de espacio) y la Tab.45 por persona y por área, la misma regla que la carga térmica. |
| G2-05 | Ventilación | ref | IMC / NFPA 96: caudal por área de campana. | Caudal de campana: rige el mayor entre el método por área de campana y el mínimo por pie lineal del lado abierto (IMC 507.2.1 / NFPA 96). |
| G2-06 | Ductos | ref | Material del ducto. Define la rugosidad absoluta de la pared.", rec: "Lámina galvanizada 0.09 mm · fibra de vidrio forrada 0.9 mm · flexible extendido 3 mm. | Material del ducto. Define el calibre (aluminio sube 2 calibres), la nota SMACNA y la densidad con la que se pesa la lámina; la rugosidad se captura aparte.", rec: "Acero galvanizado · aluminio · acero inoxidable. Para la rugosidad usa el campo ε: galvanizado limpio 0.09 mm. |
| G2-07 | Ventilación | vista | ft² (${v.freeArea} %) | ft² (${Math.max(5, v.freeArea)} %${v.freeArea < 5 ? ", mínimo del motor 5 %" : ""}) |
| G2-08 | Ductos | pdf | Ducto de lámina galvanizada instalado y sellado | Ducto de lámina ${({ galvanized: "galvanizada", aluminum: "de aluminio", stainless: "de acero inoxidable" })[S.duct.meta.material] || "galvanizada"} instalado y sellado |
| G2-09 | Ductos | ingles | Installed and sealed galvanized sheet metal duct | Installed and sealed ${({ galvanized: "galvanized", aluminum: "aluminum", stainless: "stainless steel" })[S.duct.meta.material] || "galvanized"} sheet metal duct |
| G2-10 | Ventilación | aviso | el rango del más grande de la familia es ${n(v.eq.primary.cfmMin, 0)}–${n(v.eq.primary.cfmMax, 0)} CFM. Hay que dividir la extracción en varios equipos o cambiar de familia. | el modelo más cercano del catálogo es ${v.eq.primary.model}, con rango ${n(v.eq.primary.cfmMin, 0)}–${n(v.eq.primary.cfmMax, 0)} CFM. Si la demanda rebasa ese rango, hay que dividir la extracción en varios equipos o cambiar de familia; si queda por debajo, revisar el caudal capturado o cambiar de fa |
| G4-01 | soporte | vista | inp("Altura de trabajo (m, 0 = la mayor de las zonas)" | inp("Altura de trabajo (m, 0 = la mayor de las zonas + 1.2 m, mínimo 3 m)" |
| G4-02 | soporte | aviso | No hay soportes que contar: no hay ductos ni tubería calculados, o los motores no están autorizados. | No hay soportes que contar: no hay ductos ni tubería calculados en los motores, ni metros capturados a mano. |
| G4-03 | soporte | pdf | NFPA 13 capitulo 18 para arriostramiento sismico: longitudinal cada 24 m y transversal cada 12 m. | NFPA 13 capitulo 18 para arriostramiento sismico: longitudinal cada 24.4 m y transversal cada 12.2 m. |
| G4-04 | soporte | pdf | MSS SP-58 tabla 3 para tuberia segun diametro y material: de 2.1 m en acero chico hasta 5.8 m en 8 pulgadas; en cobre baja a 1.8 m porque el material cede mas. | MSS SP-58 para tuberia segun diametro y material: acero de 2.1 m en diametros chicos hasta 7.0 m en 12 pulgadas; en cobre de 1.8 a 3.7 m porque el material cede mas; en la red contra incendio el espaciamiento se topa en 4.6 m (NFPA 13); termoplastico (CPVC/PEAD) de 0.9 a 1.8 m con la tabla propia de |
| G4-05 | soporte | vista | <div class="sub">${R.meses} mes(es) de renta</div> | <div class="sub">${R.meses} mes(es) de renta si hay soportes, riel o bases que montar</div> |
| G4-08 | civil | guia | área, altura y desarrollo de muro se copian zona por zona, no se recalculan, y si cambias un área allá esta sección se mueve sola. | área, altura y desarrollo de muro se copian zona por zona, y si cambias un área allá esta sección se mueve sola; si una zona no tiene muros capturados por orientación, su desarrollo se estima con un rectángulo de proporción 3:2 a la altura de la zona y queda marcado como estimado. |
| G4-09 | civil | vista | memo.push("Las cantidades salen de la geometría capturada en las zonas y en los cuartos limpios. Si cambia un área, esta sección se recalcula sola."); | memo.push("Las cantidades salen de la geometría de las zonas (o de la captura a mano de esta pestaña, si se eligió así) y el área clasificada de los cuartos limpios. Con geometría de zonas, si cambia un área esta sección se recalcula sola."); |
| G4-10 | civil | pdf | "muros capturados por orientacion" | (S.civil.usarZonas ? "muros capturados por orientacion" : "capturado a mano") |
| G4-11 | civil | pdf | "ponderada por area de zona" | (S.civil.usarZonas ? "ponderada por area de zona" : "capturada a mano") |
| G4-12 | civil | vista | ${sel("Plafón", "civil.plafon" | ${sel("Plafón en área clasificada (el área no clasificada lleva plafón reticular)", "civil.plafon" |
| G4-14 | aire | pdf | A.cubre ? "una unidad cubre la demanda" : "varias en paralelo con control secuencial" | A.totalUnidades === 0 ? "sin demanda capturada: no se cotiza ninguna unidad" : A.cubre ? "una unidad cubre la demanda" : "varias en paralelo con control secuencial" |
| G5-01 | Cotizacion | guia | Cada libro tiene quince hojas encadenadas por fórmula: si el cliente cambia una cantidad del catálogo de conceptos, el resumen, los indirectos, la utilidad, el IVA, el total y los hitos de pago se recalculan solos. | Cada libro tiene hasta quince hojas —las bases de HVAC y la memoria eléctrica sólo salen cuando esas disciplinas tienen datos—: el resumen, los indirectos, la utilidad, el IVA, el total y los hitos de pago son fórmulas que apuntan a los importes del catálogo de conceptos, pero el importe de cada con |
| G5-02 | Cotizacion | excel | Cambie una cantidad alla y todo esto se recalcula. | Cambiar una cantidad alla no mueve el importe: para recotizar, cambiela en la suite y vuelva a exportar el libro. |
| G5-03 | Cotizacion | ingles | Change a quantity there and all of this recalculates. | Changing a quantity there does not move the amount: to requote, change it in the suite and re-export the workbook. |
| G5-04 | Cotizacion | excel | Este motor no calcula esta disciplina. Requiere levantamiento y se cotiza por separado. | Sin partidas en esta propuesta: la disciplina no tiene captura, su cruce hacia la cotizacion no esta autorizado o sus partidas quedaron pendientes de un dato. Se cotiza por separado. |
| G5-05 | Cotizacion | ingles | This engine does not calculate this discipline. It requires a survey and is quoted separately. | No items in this proposal: the discipline has no input, its link to the quote is not authorized, or its items are pending a missing datum. It is quoted separately. |
| G5-06 | Cotizacion | pdf | NO COTIZADO en esta propuesta — requiere levantamiento y se cotiza por separado | NO COTIZADO en esta propuesta — sin partidas: falta captura, autorizacion del cruce o un dato; se cotiza por separado |
| G5-07 | Cotizacion | ingles | NOT QUOTED in this proposal — requires a survey and is quoted separately | NOT QUOTED in this proposal — no items: input, link authorization or a datum is missing; quoted separately |
| G5-08 | Cotizacion | excel | . Requieren levantamiento y se cotizan por separado. | . No tienen partidas en esta propuesta (sin captura, sin autorizacion del cruce o pendientes de un dato) y se cotizan por separado. |
| G5-09 | Cotizacion | ingles | . They require a survey and are quoted separately. | . They have no items in this proposal (no input, link not authorized or pending a datum) and are quoted separately. |
| G5-10 | Cotizacion | pdf | No incluye: obra civil, alimentacion electrica desde tablero general, permisos, ni certificacion de cuarto limpio salvo indicacion expresa. | No incluye: permisos, ni certificacion de cuarto limpio salvo indicacion expresa. La obra civil, la instalacion electrica y las demas disciplinas se incluyen solo en la medida en que aparecen como concepto en la seccion 3. |
| G5-11 | Cotizacion | ref | Indirectos: oficina, supervisión, fianzas, seguros y financiamiento. | Indirectos: oficina, supervisión y seguros. Fianzas y financiamiento van en renglones propios sobre el costo directo. |
| G5-12 | Cotizacion | vista | "oficina, supervisión, fianzas" | "oficina, supervisión, seguros" |
| G5-13 | Cotizacion | ref | Tubería hidrónica por tonelada: cobre o acero, aislamiento y accesorios.", rec: "Solo aplica en sistemas de agua helada." | Tubería de refrigerante o hidráulica por tonelada de equipo cotizado: cobre o acero, aislamiento y accesorios.", rec: "Se aplica a las toneladas de todo el equipo de la cotización, sea expansión directa o agua helada." |
| G5-15 | Kaizen | guia | Cada oportunidad se mide volviendo a correr el cálculo con el cambio aplicado: lo que no se puede medir no se enlista. | Las oportunidades de aire exterior, cambios de aire, muros, vidrio e iluminación se miden volviendo a correr la zona con el cambio aplicado; las demás se leen del resultado ya calculado, y algunas, como los defectos de captura, se enlistan sin ahorro cuantificado. |
| G5-16 | Kaizen | pdf | Cada oportunidad se detecta sobre el proyecto real y se cuantifica volviendo a correr el calculo con el cambio aplicado. Lo que no se puede medir no se enlista. | Cada oportunidad se detecta sobre el proyecto real. Las de aire exterior, cambios de aire, muros, vidrio e iluminacion se cuantifican volviendo a correr la zona con el cambio aplicado; las demas se leen del resultado ya calculado, y algunas, como los defectos de captura, se enlistan sin ahorro cuant |
| G5-17 | Kaizen | pdf | Lo que no se puede medir sobre el proyecto no se enlista. | Algunas oportunidades, como los defectos de captura, se enlistan aunque no traigan ahorro cuantificado. |
| G5-18 | Kaizen | vista | Kaizen no puede detectar nada por su cuenta: necesita volver a correr las zonas con cada cambio aplicado para medir el ahorro. | Sin la carga térmica Kaizen no revisa planta, terminales, diversidad, zonas ni defectos de captura. Alimentador, tubería de agua y contra incendio se siguen revisando; los ductos dependen de su propio enlace. |
| G5-19 | Kaizen | pdf |  · sin este acceso Kaizen no detecta ninguna oportunidad |  · sin este acceso no se revisan planta, terminales, diversidad, zonas ni defectos de captura |
| G5-20 | Kaizen | pdf | Sin el enlace load>kaizen Kaizen no puede detectar ninguna oportunidad: la lista de este documento esta vacia por falta de acceso, no porque el proyecto no tenga desperdicio. | Sin el enlace load>kaizen no se revisaron planta, terminales, diversidad, zonas ni defectos de captura: esas oportunidades faltan por falta de acceso, no porque el proyecto no tenga desperdicio. Alimentador, tuberia de agua y contra incendio si se revisan sin este enlace. |
| G5-21 | Ingenieria de valor | vista | El ahorro de inversión se valora con el precio por tonelada de <b>equipo</b> de la cotización, y para leerlo hace falta autorizar el enlace de la cotización con este motor. | El ahorro de inversión se valora con el precio por tonelada de <b>equipo</b> de la cotización, y la cotización todavía no tiene equipo con precio. |
| G5-22 | Ingenieria de valor | aviso | Sin la cotización no hay precio por tonelada de equipo: las medidas se detectan, pero quedan sin valuar. | Sin este enlace las oportunidades de Kaizen se detectan pero quedan sin valuar; las medidas de sistema y de equipo alterno se valúan igual con el precio por tonelada de equipo de la cotización. |
| G5-23 | Ingenieria de valor | pdf | Misma familia y misma linea de producto; la capacidad corregida por sitio debe cubrir la requerida por unidad (99 % o mas) sin pasar de 1.35 veces esa capacidad. | Misma familia del catalogo (la linea de producto puede cambiar dentro de la familia); la capacidad corregida por sitio debe cubrir la requerida por unidad (99 % o mas) sin pasar de 1.35 veces esa capacidad. |
| G5-24 | Ingenieria de valor | vista | y misma línea de producto, así que la instalación, el control y el espacio de máquinas no cambian. | . La línea de producto puede cambiar dentro de la familia: ratificar instalación, control y espacio de máquinas. |
| G5-25 | Proyecto | vista | Con todos autorizados, la cotización unificada incluye las siete secciones y cada motor muestra lo que aporta. | Con todos autorizados, la cotización unificada incluye cada sección que tenga partidas calculadas y cada motor muestra lo que aporta. |
| G5-28 | Ingenieria de valor | excel | Cada renglon compara lo calculado contra una alternativa equivalente del catalogo, con su ahorro estimado y su justificacion tecnica. | Cada renglon es una medida de una de tres fuentes medidas sobre el proyecto -otra opcion de sistema, equipo alterno del catalogo u oportunidad de Kaizen-, con su ahorro estimado y su justificacion tecnica. |
| G5-29 | Ingenieria de valor | ingles | Each line compares what was calculated against an equivalent catalog alternative, with its estimated saving and technical justification. | Each line is a measure from one of three sources measured on the project -another system option, alternate catalog equipment or a Kaizen opportunity-, with its estimated saving and technical justification. |
| G5-30 | Cotizacion | guia | el contenido es el mismo en los cuatro archivos y sólo cambia cómo se presenta. | el contenido es el mismo en los cuatro archivos y sólo cambia cómo se presenta, salvo las partidas pendientes de un dato, que se declaran sólo en el PDF. |

## 3. Refutados (no se tocaron)

| Id | Disciplina | Por qué se refutó |
|---|---|---|
| G1-13 | HVAC nucleo · cuartos limpios | The row only reports the project's protected HAP margin constant among the site data. It does not claim this document applies it, and the same PDF already says the heat is carried over to the load engine. The reading is forced. |
| G4-06 | soporte | La memoria solo nombra el equipo que corresponde a la altura de trabajo y cita NOM-009. No dice que la renta se cotice ni da meses, asi que no contradice el codigo. Leerlo como contradiccion es forzado. |
| G4-07 | soporte | estructuraTipo vale 'losa_concreto' por omision y no hay selector en la UI (ningun sel/inp de soporte.estructuraTipo), asi que el anclaje a concreto siempre se revisa en los tramos de SoporteCalc. El trapecio se revisa cuando existe, y el termoplastico ya trae su propio aviso (7932). La lectura es f |
| G4-13 | civil | Es una omision, no una contradiccion: la descripcion del sistema no dice que cubra toda la planta. La otra partida ya se rotula 'en área no clasificada'. Cambiar descripciones de partidas cotizadas va mas alla de corregir un texto que contradiga el codigo. |
| G5-14 | Cotizacion | Lo que cubre un porcentaje global de instalación es una descripción comercial que el código no determina. La sección G solo existe cuando el motor de soportería tiene datos y el cruce está autorizado, así que la propuesta afirmaría algo que no siempre ocurre. La duda favorece refutar. |
| G5-26 | Tablero | El panel Permisos entre motores existe y es el lugar documentado para autorizar (4303). Que no se pinte sin zonas es un caso límite. Además, la propuesta afirma que hay un botón Autorizar en cada disciplina, y la cotización no ofrece botón para civil, aire ni soporte (18393-18397). No se puede confi |
| G5-27 | Tablero | Es una lectura forzada: Kaizen e Ingeniería de valor no son disciplinas de cálculo, así que 'todas las disciplinas con su estado de completitud' sigue siendo cierto para las disciplinas. SIN_SEMAFORO (16637) solo cambia cómo se muestran esos dos módulos de gestión. |

## 4. Verificación

- **Banco:** 345/345 con `--base` (inicio de la 2.9.17) y 340/340 sin él. Se actualizaron cuatro frases esperadas que las pruebas copiaban del texto anterior: 22.6 (presión de ductos), GB.1/GB.2 (guía de obra civil), GB.5 (memoria de obra civil) y GC.1 (guía de Kaizen).
- **Comparador contra el inicio de la 2.9.17** (56 escenarios × 2 modos): **0 diferencias numéricas** en los motores, la cotización y el Excel (es y en). Ida y vuelta (guardar/abrir): **0**.
- **PDF:** todas las diferencias se revisaron y son dígitos que traen los textos corregidos, no números calculados:
  - AHRI 310/380 en las bases de selección;
  - «barrido de 8 a 18 h» en carga;
  - las clases HEPA por ISO en cuartos limpios;
  - 7.0 m, 3.7 m, 24.4 m y 12.2 m en soportería;
  - el modelo del ventilador (GB-360, CSW-30) en el aviso de ventilación;
  - «sección 3» en la nota de alcance.

  Informe en `parches/comparador-15-motores/informe-2.9.17-vs-2.9.16.txt`.

## 5. Pendiente

Sigue lo mismo que en la 2.9.16:
1. Capturar los precios de tubería hidráulica por diámetro.
2. Cotejar las áreas THW-LS contra la tabla impresa de la NOM.
