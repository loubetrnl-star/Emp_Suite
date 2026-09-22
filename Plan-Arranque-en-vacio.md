# Plan · Arranque en vacío · SuiteEmp 2.9.6

14-sep-2026. Análisis de solo lectura (inventario por motor medido en ejecución, 3 diseños evaluados por 2 jueces, síntesis y crítica de completitud). **No se ha modificado nada.**

## Mecanismo propuesto

El diseño se implementa en 19 pasos, anclados por nombre de función, sobre la revisión que corrige los 14 defectos (Capa 0). 1. Red de seguridad antes de tocar la app (pasos 1-5):    - Se congela el «Caso de verificación — auditoría 2.9.5» con todas sus llaves explícitas y su huella. La huella se toma tras recompute + render + recompute.    - Se generan LEGADO_295, TEXTO_GUIA y un corpus de proyectos guardados con su línea base.    - Se firma cada cuerpo de motor, buscado por nombre.    - La plantilla se embebe como registro de solo lectura en «Mis proyectos». No pasa por projList, projDup, projOpen ni projSeedOnce.    - El banco arranca contra el caso con el perfil banco y la semilla de INIT como fixture. Medido en V5: 206/206 en la versión sembrada. 2. Mecanismo, con las fábricas todavía sembradas (pasos 6-16). Tras cada paso, el caso, el arranque, el corpus y el banco deben quedar idénticos:    - marca de esquema y estadoNuevo();    - dato, REQ y compuerta;    - recompute con compuerta y sombra de entrada;    - vistas tolerantes a null;    - semáforo;    - documentos y cotización;    - captura que escribe null;    - herencia por campo;    - cruces que exigen origen capturado;    - sanearEstado para el esquema nuevo;    - importadores que no rellenan con sembrados, con origen registrado por campo. 3. Vaciado de las fábricas (paso 17). Solo afecta a estadoNuevo(); los proyectos legados siguen usando LEGADO_295. 4. Migración explícita de proyectos legados (paso 18). 5. Verificación final (paso 19). Queda reportado, sin forzar a cero: - los campos donde vacío rompe un motor; - un defecto nuevo: recompute no es idempotente, porque SOPORTE (8321) usa el QUOTE de la corrida anterior (8323); - soportería lee Lramal y Lmontante en vivo (6179); - las pruebas 17.6 y 17.8 dependen de la altura sembrada en cxZonaDesde; - contra el caso literal sin perfil fallan 2.3, 8.5 y 12.2 (203/206).

## Pasos

1. **Congelar el caso de verificación sobre la revisión con Capa 0, antes de tocar index.html. Cómo se arma: siguiendo la ruta del banco (estado inicial sin saneador; nunca después de proj-new, porque así vent y fuego quedan como 'propio'). Contenido: - 2 zonas: 400 m² × 6 m × 30 personas y 100 m² × 3 m **  
   Dónde: Fuera de la app. Generador basado en sondas/caso-verificacion-construye.mjs (armarCaso) y plantillas-banco-congela.mjs. Produce caso-verificacion-2.9.5.json y huella-caso.json.  
   Riesgo: - Si la huella se toma tras una sola corrida, soportería da 393,020 y el total 13,916,944.01. - Si los ids o ts no se fijan, el resultado no es reproducible. - Si se congela sobre 2.9.5 y no sobre Capa 0, aparecen falsas regresiones. - Una llave que falte se rellenaría después desde una fábrica vacía.  
   Cómo se prueba: - Dos generaciones independientes deben dar JSON idénticos byte a byte. - Abrir con reemplazarEstado + recompute ×2 en ventana limpia debe reproducir la huella sin diferencias. - La copia sin esquema debe dar la misma huella. - El conjunto de llaves hoja debe contener las 456 hojas listadas por caso-verificacion-estabilidad.mjs.

2. **Generar tres artefactos de migración y regresión desde el código aún sembrado. (a) LEGADO_295: copia literal congelada de lo que hoy devuelven las fábricas, sin ids ni fechas: defaultState, defaultZone, defaultRoom, defaultSegment, defaultCarga, defaultTramoAgua, defaultConsumo, defaultElec, default**  
   Dónde: Fuera de la app: fixtures junto al banco y script basado en sondas/_carga.mjs. LEGADO_295 y TEXTO_GUIA se embeben después, como constantes junto a QUOTE_SEED.  
   Riesgo: - Si LEGADO_295 se genera después de vaciar las fábricas, sale vacío. - Si el corpus no incluye '' ni 0 tecleados, una regresión en proyectos viejos pasaría sin detectarse.  
   Cómo se prueba: - Generarlo dos veces debe dar lo mismo. - Comparar LEGADO_295 contra la salida en vivo de cada fábrica: cero diferencias. - El corpus abierto en la revisión con Capa 0 debe reproducir su línea base.

3. **Red de seguridad de la regla inviolable. (a) Script firma-motores. Con indice-funciones.tsv extrae por NOMBRE el cuerpo completo de cada función de cálculo y de cada tabla, y guarda un hash de cada una. Si no encuentra una función, falla en rojo. Funciones: computeLoad, peakLoad, loadOf, siteOf, psy**  
   Dónde: Solo archivos de verificación, fuera de index.html. Es puerta obligatoria al cerrar cada paso posterior.  
   Riesgo: Bajo. Si alguien renombra o parte una función, el script debe fallar y nunca pasar en silencio.  
   Cómo se prueba: - Dos corridas sobre la base deben dar los mismos hashes. - Un cambio de un carácter en computeFuego, hecho en una copia desechable, debe marcarse.

4. **Embeber la plantilla y el camino de apertura. Constante PLANTILLAS_SUITE, congelada a fondo: [{id: 'caso-verificacion-2.9.5', nombre: 'Caso de verificación — auditoría 2.9.5', rev, esquema: 'vacio-1', huella, data}]. Pesa unos 7 KB. Función plantillaSuiteAbrir(id), en este orden: 1. Valida el id con**  
   Dónde: - Constante junto a STORE_KEY (~18238). - Función junto a projOpen (~18637). - Sección en projectsModal (~18831). - Rama nueva en el despachador de data-act (bloque ~17700-18200). No usar projSeedOnce (18244), projPersist, projOpen ni projDup (18653).  
   Riesgo: - Con projDup se pierden los 21 cruces y las partidas: QUOTE.tot 195,268.70. - Con projOpen o un pid fijo, projAutosave escribe encima. - Sembrarla en el historial la mete en índices y selector. - sanearEstado rellena cualquier llave que falte.  
   Cómo se prueba: Pruebas nuevas: (a) Abrir reproduce la huella. (b) projList().length no cambia y la plantilla no aparece en índices, selector ni referencias. (c) Editar y guardar deja PLANTILLAS_SUITE igual (Object.isFrozen y comparación profunda) y crea un proyecto normal con pid nuevo. (d) Un id ajeno no hace nada. (e) Las llaves de data cubren todas las llaves de LEGADO_295, incluidos aire, civil y soporte, para detectar campos futuros. Prototipo medido en sondas/plantillas-banco-carga.mjs.

5. **El banco arranca contra el caso, sin reescribir comprobaciones. En pruebas-*.mjs cambia solo el bloque proyectoDePrueba (52-62): 1. Abrir PLANTILLAS_SUITE[0] con plantillaSuiteAbrir. 2. Aplicar el perfil banco: perms = {}, quote.items = [], elec.cargas = []. Así queda el mismo estado con que hoy cor**  
   Dónde: pruebas-*.mjs, bloque de arranque y usos de G().default*. Fixture semilla-banco.json. Variante base medida: sondas/plantillas-banco-pruebas-V5.mjs.  
   Riesgo: - Contra el caso literal sin perfil fallan 2.3, 8.5 y 12.2 (203/206) por supuestos del banco y por el orden SOPORTE→QUOTE. - Sin la semilla de INIT, la preparación en 1641 truena y aborta las secciones 18, 20, 21 y 19. - La semilla se regenera si cambian las llaves de defaultState.  
   Cómo se prueba: - Con la app aún sembrada, --base apuntando a la revisión con Capa 0: 206/206 más la sección 22. - Diff del cuerpo de comprobaciones contra el original: solo cambia la preparación.

6. **Marca de esquema y construcción de estados, sin cambiar ningún número. (a) En sanearEstado(d), antes de construir base: const esquema = (d && d.esquema === 'vacio-1') ? 'vacio-1' : 'legado-2.9.5' Se ignora la llave `v` que traen el respaldo .json (18906) y el paquete (12459). Al final: s.esquema = e**  
   Dónde: sanearEstado (18325-18431, base en 18326-18327), arranque 8255-8256, recompute 8303-8315, proj-new, cxAplicar, archivar, projDup (18653), projRevision (~18699), anonimizarRegistro (~18740), importarRespaldo, importador del paquete (~12478), setPath (8355). Constantes LEGADO_295 y TEXTO_GUIA.  
   Riesgo: - Alto si la marca se calcula después del spread: contaminaría a todos los proyectos legados. - En esta etapa, construir el arranque con sanearEstado aplicaría la migración vieja de her. Por eso la rama nueva conserva la regla actual hasta el paso 14.  
   Cómo se prueba: - Corpus: cero diferencias. - Tabla de caminos: arranque, proj-new, cxAplicar nuevo y archivar dan 'vacio-1'. projOpen, .json y ZIP sin marca dan legado. projDup, revisión y referencia conservan el esquema del origen. - Banco: 206/206. - Capturar quote.prop.no en frío no lanza error.

7. **Lector y compuerta, todavía sin consumidores. (a) dato(v) devuelve null para '', null, undefined, NaN o texto no numérico, y el número en cualquier otro caso. Un 0 es 0. (b) REQ[id] declara, por motor, cada ruta con su clase: - load (por zona): area>0, height>0, sitio resuelto (si custom: db, wb, al**  
   Dónde: dato() junto a num (2384-2388); se corrige el comentario H-29b (6271-6276), que dice que la pantalla escribe ''. REQ y compuerta en un bloque nuevo junto a hayProyecto (14185) y semaforoDisciplina (14528).  
   Riesgo: - Una clasificación errónea deja pasar un respaldo escondido o bloquea un motor con datos. - Si la compuerta eléctrica cuenta solo las cargas manuales, deja ELEC en null cuando elec.cargas está vacío y tomarHVAC está activo.  
   Cómo se prueba: (a) Con el caso: 11 disciplinas en ok y todas las filas completas. (b) Cada requerido vaciado uno por uno ('', null, llave borrada) da 'incompleta' con exactamente esa ruta. Se reutilizan las sondas hvac-campos, electrico-hidro-campos e incendio-aire-civil-soporte-campos. (c) Un centinela en '' da lo mismo que en 0. (d) Un 0 capturado en un requerido da ok.

8. **recompute con compuerta y sombra de entrada, solo en esquema nuevo. Al inicio: GATE = {id: compuerta(id)}. LOADS = S.zones.map(z => zona en GATE.load.filas ? loadOf(z) : null). LOADS conserva la alineación posicional con S.zones y LOADS_OK = LOADS.filter(Boolean). Usan LOADS_OK: totals, buildSystem,**  
   Dónde: recompute (8288-8335), totals (~8334), buildSystem (3406-3416), kaizenLazy y KZ_CACHE (13506-13511), VZ_CACHE (~15577). Consumidores de LOADS[i] que deben tolerar null: viewCarga (13129-13149), semaforoDisciplina (14537), validateAll (3122), buildMemoriaPdf (1398-1406), XLSX de zonas (4283-4285), viewProyecto (12763-12770), estadoZona (17564), Kaizen (13614-13640). Localizarlos con grep de `LOADS[` y `LOADS.forEach((r, i)`.  
   Riesgo: Alto. - Un consumidor de LOADS[i] sin guarda contra null lanza TypeError. - Una excepción dentro de la sombra sin finally dejaría S truncado. - Si las cachés no incluyen el nivel de GATE, muestran resultados viejos. Con datos completos, la sombra es idéntica a S.  
   Cómo se prueba: (a) Firma de motores idéntica. (b) Huella del caso en esquema nuevo y en legado sin diferencias. (c) Corpus legado sin diferencias. (d) Zona 1 vacía y zona 2 completa: la memoria y la vista nombran bien la zona 2 y la zona 1 aparece como 'no capturado'. (e) Sonda que lanza dentro de un motor con sombra: S sale íntegro. (f) Banco 206/206.

9. **Vistas: separar captura de resultados y tolerar globales en null. En cada vista la captura se pinta siempre. Los resultados solo se pintan con GATE ok; si no, se muestra una tarjeta «sin datos · faltan: …» con enlaces a los campos. Es el patrón de viewCarga (13121) y de viewOf('comparativo') (17597)**  
   Dónde: viewVent (~16140-16181), viewProyecto (~12760-12790), viewDuct y segmentSheet (16235-16497), viewLimpio (16059-16115), viewElec (16869-16940), viewHidro (16954-17024), viewFuego (~17295-17313), viewAire (17044-17090), viewCivil (~17123-17160), viewSoporte (~17184-17201), viewSeleccion, viewCotizacion, inp (13026), oriInputs (13131), fieldHelp, acciones clean-pdf y clean-to-zone (~17966).  
   Riesgo: Alto si se hace después del vaciado. Medido: con globales en null revientan 10 vistas (null.eq, null.segs, null.cur, null.calc, null.umTotal, null.r, null.cls, null.sisMuro, null.equipo).  
   Cómo se prueba: - Recorrer las 20 vistas con proyecto vacío (con nombre y pid) y con cada global en null por separado. Modelo: semaforo-documentos-motor-nulo.mjs. Sin excepción, sin NaN, sin undefined, sin '0 TR', '0 kVA' ni '$ 0' en resultados. - Con el caso, el HTML de resultados es igual a la línea base.

10. **Semáforo por captura (esquema nuevo). En semaforoDisciplina, antes del switch: - GATE vacia → 'vacia · sin datos'. - GATE incompleta → 'incompleta · faltan: …', con R.faltan = GATE.faltan. - El switch actual solo corre con ok, así que con datos completos no cambia ningún texto. hayProyecto (14185-14**  
   Dónde: semaforoDisciplina (14528-14570), hayProyecto (14185) y su duplicado (~17669), cxzAgregarArchivos (12138), rótulo por omisión de projSave (18276+), trazaHerencia.  
   Riesgo: - Si el centinela del nombre se cambia en unos sitios y no en otros (8198, 12138, 14187, 17669, projSave), el estado queda incoherente. - Kaizen y valor dependen de S.tab (kaizenLazy 13506); las pruebas deben fijar la pestaña.  
   Cómo se prueba: (a) Prueba 2.4b nueva: proyecto abierto sin capturas da 14 disciplinas en vacia. (b) Zona con altura vacía da 'incompleta · faltan altura libre'. (c) Con el caso: 13/1/0/0 idéntico. (d) En legado, semáforo igual a la línea base del corpus.

11. **Documentos, cotización y propuesta: nunca imprimir un cero como resultado. Solo se toca la emisión; ninguna fórmula. - buildMemoriaPdf: guarda por sección. Ventilación (5) y ductos (6) se omiten con VENT o DUCT null. Las tablas 3, 4.x y 7 solo incluyen zonas en ok; las demás aparecen como 'no captur**  
   Dónde: buildMemoriaPdf (1373-1421), pdfPortadaIntegral, buildMemoriaIntegralPdf (15677-15729), buildCotizacionPdf, buildPropuestaPdf, buildPropuestaXlsx, viewCotizacion, botones (~17882-17883), buildElecPdf (1640), buildHidroPdf (1690), buildAirePdf (5756), buildCivilPdf (17234), buildSoportePdf (17257), buildFuegoPdf (1749).  
   Riesgo: - Si la guarda se hace moviendo código de cálculo dentro de buildMemoriaPdf, viola la regla. - Cambiar un rótulo crudo modifica el texto de proyectos legados con indirect '' (hoy '0 %'): es corrección de rótulo, el importe no cambia. - La prueba 15.1 exige que la marca de la casa siga en la portada.  
   Cómo se prueba: (a) Proyecto vacío con nombre: memoria integral sin capítulos y portada 'no capturado'; propuesta sin '$ 0'; QUOTE.aux vacío; XLSX sin fórmulas rotas. (b) Con el caso: texto de memoria, cotización y propuesta igual a la línea base, y pasan 6.1 y 6.2. (c) Cocina sin duty: no imprime NaN.

12. **Captura en pantalla, solo en esquema nuevo. - Manejador de input data-path (17767-17770), data-live (17747) y select con data-tipo num: si el texto recortado está vacío o no es número, escriben null. Un 0 tecleado queda en 0. - data-qty (18180): null, no 1. - data-unit (18183): null, que significa p**  
   Dónde: Listeners ~17733-17796, cotización de equipos ~18178-18185, marcarPropio.  
   Riesgo: - Aplicado antes de los pasos 7-11, un null en un campo leído en crudo daría NaN o excepción (processCFM, hoodType, duty, flow). - Una fila de equipo con qty null debe quedar fuera de la sombra de items.  
   Cómo se prueba: - Repetir sondas/respaldos-num-ui.mjs en esquema nuevo con 12 campos más quote.fasar. Resultado esperado: estado null, input vacío con texto guía, disciplina 'incompleta' con esa ruta y ningún NaN. - Teclear 0 guarda 0 y calcula. - En legado se sigue guardando 0. - Banco 206/206.

13. **Herencia campo por campo, solo en esquema nuevo. - sincronizarHerencia (14239-14251): la compuerta pasa a ser por campo.   · area: debe haber área capturada.   · height: todas las zonas con área deben tener altura capturada; si alguna falta, no se promedia con 0.   · occ: debe haber ocupantes captur**  
   Dónde: sincronizarHerencia, geoProyectoDe, HEREDA, ventAreaVigente, ventAlturaVigente, herenciaHtml, trazaHerencia, sanearEstado (rama nueva de 18412-18422).  
   Riesgo: Si la compuerta de altura se aplica por zona y no por conjunto, la media del caso deja de dar 5.4.  
   Cómo se prueba: (a) Zona de 200 m² con altura vacía: vent.height y fuego.altura quedan null y aparecen en faltan (hoy salen 0). (b) Borrar las zonas deja vent y fuego en null, con estado incompleta. (c) Caso: vent 500/5.4/40 y fuego 500/5.4 idénticos; la prueba 3.3 da 700.

14. **Cruces con origen capturado, solo en esquema nuevo. - PROPUESTAS[*].disponible exige GATE ok en el origen:   · cedula>elec: SYS no nulo y LOADS_OK con TR;   · load>vent y load>duct: zonas con área;   · motores>soporte: al menos un motor fuente en ok. - enVivo (~14382) no se enciende si no hay metros**  
   Dónde: Bloque PROPUESTAS (~14340-14390), enVivo, registrarVinculo, propAceptar/propPropio (~14366-14384).  
   Riesgo: Una exigencia mal puesta oculta propuestas del caso. Hoy cedula>elec da 4 filas con 21 cruces.  
   Cómo se prueba: - Proyecto sin zonas: 0 propuestas pendientes o en vivo. - Aceptar con origen vacío no registra nada. - Caso: mismos estados y 4 filas en cedula>elec. - Pruebas 18.x del banco.

15. **sanearEstado normaliza el esquema nuevo. El legado no cambia. - Campo numérico de proyecto con llave ausente, '' o texto no numérico → null. Texto numérico → número. - walls y glass conservan las 8 llaves; donde falte valor, null (hoy num() pone 0 en 18339). - vent, duct.segments[i] y clean.rooms[i]**  
   Dónde: sanearEstado (18325-18431), rama 'vacio-1'.  
   Riesgo: Si una normalización se aplica también al legado, cambian números de proyectos guardados.  
   Cómo se prueba: - Casos de esquema nuevo: '' → null; walls {N:''} → null; vent sin ach → null e incompleta, sin NaN; zones [] se conserva. - Corpus legado sin diferencias.

16. **Importadores: llenan lo que detectan, registran origen y fecha, y dejan el resto vacío. Solo en esquema nuevo. - cxZonaDesde (11017-11040): sin altura detectada, height queda null. No escala occ, lights, equip ni muros desde la zona de 120 m² (k = área/120, 11021-11024); lo que no traiga el plano qu**  
   Dónde: cxZonaDesde, cxPropuestasPara, cxAplicar, bloque de soportería de cx, marcarPropio, trazaHerencia, sanearEstado (normaliza S.origen).  
   Riesgo: - Las pruebas 17.3, 17.6, 17.8 (muro 12 × 2.8) y 20.3 dependen de la altura sembrada. Decide el dueño; no se fuerza. - intacto() (11545-11551) con fábrica vacía reconoce la fila vacía como ejemplo, que es lo correcto; hay que verificarlo.  
   Cómo se prueba: - sondas/archivos-herencia-cx.mjs E1-E5 en esquema nuevo: DXF sin altura crea la zona con height null y sin excepción; ZIP, PDF, XLSX y CSV llenan solo lo detectado, con origen y ts; metadatos marcados; soportería null. - Legado: la sección 17 queda igual.

17. **Vaciar las fábricas. Es el cambio visible y solo alcanza a estadoNuevo(); los proyectos legados siguen con LEGADO_295. Se vacían (lista completa en campos_vaciar_por_motor): - defaultZone: números en null, walls y glass con 8 llaves en null. - defaultRoom y cleanRooms: la lista puede quedar en 0 cua**  
   Dónde: defaultState (8196-8254), defaultZone (2713-2731), defaultRoom (~6582-6583), cleanRooms (6586-6593), defaultSegment (6997), defaultCarga (7284-7286), defaultElec (7288-7300), defaultTramoAgua (7578-7579), defaultHidro (7581-7598), defaultFuego (7798-7808), defaultAire (5568-5590), defaultCivil (5903-5912), defaultSoporte (6123-6131), defaultPropuesta (4828-4844), acciones 17822, 17837, 17884, 17898, 17900, 17962-17963, 18083, chainToDuct.  
   Riesgo: Alto: expone cualquier guarda que haya faltado en los pasos 6-16. La semilla de INIT del banco y LEGADO_295 tienen que existir antes de este paso.  
   Cómo se prueba: (a) Firma de motores idéntica. (b) Arranque en frío y proj-new: inputs vacíos con texto guía, 14 disciplinas en vacia, QUOTE.tot sin renglones, memoria sin capítulos, propuesta sin '$ 0'. (c) Con nombre y pid siguen 14 en vacia (hoy 11 con datos). (d) La plantilla reproduce la huella. (e) Corpus legado sin diferencias. (f) Banco 206/206, o 204/206 con 17.6 y 17.8 si el dueño decide altura vacía en el importador.

18. **Migración explícita de proyectos legados. Nunca es automática. En viewProyecto y en el tablero, un proyecto legado muestra: «Proyecto de revisión anterior: sus valores por omisión se conservan como datos». El botón 'Revisar y actualizar' abre un modal con tres listas, calculadas contra LEGADO_295: (**  
   Dónde: Función nueva junto a projRevision (~18699). Aviso en viewProyecto y en el tablero (~14825). Modal con openModal. compararRevision (~4507) para la hoja CAMBIOS_REV.  
   Riesgo: - Una copia imprecisa de LEGADO_295 clasifica mal la lista (a). - Migrar sin guardar la revisión antes pierde la trazabilidad.  
   Cómo se prueba: En el corpus: - 'Conservar todo' da globales idénticos. - 'Dejar vacíos' cambia solo las disciplinas listadas en (c), que quedan en 'sin datos' y nunca en 0. - La revisión legada se sigue abriendo con sus números.

19. **Verificación final, pruebas nuevas y entregables. Pruebas nuevas: - arranque vacío con projList 0; - 2.4b; - recorrido de las 20 vistas sin excepción, NaN ni ceros de resultado; - documentos vacíos sin '$ 0', '0 TR' ni 'undefined'; - vacío no es cero: borrar guarda null, teclear 0 calcula; - caso li**  
   Dónde: Banco, sondas y script del corpus. index.html solo en lectura.  
   Riesgo: Si se valida contra 2.9.5 en lugar de la revisión con Capa 0, aparecen falsas regresiones en CDT, HP, soportería, alimentador y Kaizen.  
   Cómo se prueba: - Banco completo en verde contra la plantilla, salvo las excepciones aceptadas por escrito. - Firma de motores igual a la del paso 3. - Huella sin diferencias. - Corpus sin diferencias.

## Caso de verificación embebido

QUÉ ES: la constante PLANTILLAS_SUITE, congelada a fondo y embebida en index.html junto a STORE_KEY (~18238). Tiene una sola entrada: {id 'caso-verificacion-2.9.5', nombre 'Caso de verificación — auditoría 2.9.5', rev, esquema 'vacio-1', huella, data}. Pesa unos 7 KB. No toca localStorage ni IndexedDB, así que funciona sin conexión y en un navegador nuevo. DATA: el estado completo, con cada llave explícita. - Zonas: 400 m² × 6 m × 30 personas y 100 m² × 3 m × 10 personas. Como datos literales llevan muros 28/18/28/18 (diagonales 0), vidrio 4/6/12/8, light_block_20, roof_concrete_insul, glass_dgu, 1200 W, 1440 W, ach 0.4, iso8, achClean 15, office, 16 h, led, plenum false. - 21 perms con ts 1. - quote.items: vrf-40VMA-072 × 2. Son los «2 VRF de 6 TR»: el más chico con TR ≥ 11.703/2, familia vrf. - 3 cargas manuales: Compresor 15 kW, Alumbrado 6 kW y Contactos 4 kW, tipo proceso, 220 V, 3F, cant 1, L 25, ids c-caso-1..3. - vent completo: general, ach 6, processCFM 3000…; area/height/occ heredados 500/5.4/40. - duct.meta y tramos SA-PRINCIPAL (2500 L/s, 12 m) y SA-RAMAL (800 L/s, 8 m). - Cuarto limpio: ISO 7, 60 m², 2.7 m. - defaultElec. - Hidro: 13 muebles (72 UM), tramos de 25 y 18 m, presRed 25, 60 habitantes, alturaEdificio 6. - Fuego: ord2, k80, acero_neg, Lramal 30, Lmontante 12, cisterna; área y altura heredadas. - Aire: 3 consumos (12/20/6), 120+90 m. - defaultCivil y defaultSoporte. - site Tijuana (clave de catálogo climático). - ids, her.*.ts y meta.date fijos; pid, linaje y quote.prop en null; client y location en ''. HUELLA: se regenera sobre la revisión con Capa 0, tras recompute + render + recompute, y va acompañada de una tabla de deltas contra 2.9.5. Referencia 2.9.5: - TR 11.703, CFM 3,750.2, VRF modular - ventilación 9,535 CFM - ductos 334.1 kg y 32.6 Pa - limpios 7,290 m³/h y 14 FFU - eléctrico 29.412 kVA, 2 AWG, 100 A - hidro Qtotal 3.5988, CDT 32.144 m, 3 HP - incendio 42 rociadores y 2,302.54 L/min - aire FAD 1,597.2 - civil 1,648,796.26 - soportería 129 soportes, 430,020 - QUOTE.tot 13,975,383.88 - VALID 1 error y 1 aviso - semáforo 13/1/0/0 Cómo se abre: en «Mis proyectos» hay una sección aparte, «Casos incluidos en la suite», con el botón «Abrir como proyecto nuevo». Llama a plantillaSuiteAbrir(id), que: 1. valida el id contra la lista; 2. guarda el proyecto abierto; 3. aplica reemplazarEstado sobre una copia profunda; 4. pone pid y linaje en null; 5. ejecuta histReiniciar y recompute ×2. No cuenta en projList ni en el tope de 40. No aparece en índices, referencias ni el selector del tablero. No se puede borrar ni anonimizar. Nunca se usa projDup (pierde cruces y partidas: 195,268.70), projOpen (el autoguardado escribiría encima) ni projSeedOnce/projPersist. Comprobaciones de la plantilla: una prueba verifica que las llaves de data cubren el esquema de estado, para que un campo nuevo no llegue vacío en silencio. Una copia de data sin esquema debe dar la misma huella en modo legado. Arranque del banco: proyectoDePrueba (52-62) 1. abre la plantilla; 2. aplica el perfil banco (perms={}, quote.items=[], elec.cargas=[]), que reproduce el estado con que corren hoy las 206 comprobaciones; 3. pone el nombre 'Banco de pruebas 2.7.0'; 4. ejecuta recompute; 5. reemplaza el contenido de INIT por el fixture semilla-banco.json (INIT sembrado explícito más aire, civil y soporte) para los act('proj-new') de las secciones 18, 20 y 21. Los G().default* del banco pasan a una fábrica del fixture, salvo 16.1 y 20.1. Una sección 22 abre el caso literal y lo compara con la huella en los dos modos. Medido V5: 206/206 en la versión sembrada y 204/206 en la simulación vacía (17.6 y 17.8). Como la plantilla va en esquema nuevo con el perfil banco, hay que volver a medir: toda comprobación que falle solo por GATE indica un consumidor sin guarda y se corrige en la app, nunca en la expectativa.

## Proyectos ya guardados

Hecho verificado: el estado guardado no trae versión dentro de data. projSave guarda rev en el registro (18285). El respaldo .json se descarga como JSON.stringify({ v: 1, ...S }) (18906), y ese v:1 es fijo, así que no distingue revisiones. El paquete ZIP lleva v y rev fuera de 'proyecto' (12459). sanearEstado fusiona {...defaultState(), ...d} (18326-18327). Regla: (1) S.esquema se calcula sobre d ANTES del spread. Sin marca 'vacio-1' el registro se trata como 'legado-2.9.5'. Eso abarca localStorage, respaldos .json, ZIP, referencias internas y plantillas derivadas. La llave v se ignora. (2) Un legado se fusiona contra LEGADO_295, copia literal congelada de las fábricas de 2.9.5, con todas sus reglas actuales: reposición de zona y cuarto, num() en muros y vidrio, reposición de muebles, tramos y consumos, meta sembrada y migración de her. También quedan como hoy, en legado, el manejador de captura (// 0), el semáforo por nombre, la herencia y los renglones de cotización. La compuerta no se aplica, así que un legado con '' o con 0 tecleados (area 0, flow 0, kW 0, L 0) calcula exactamente igual que hoy. Ni un número cambia. (3) Los valores de ejemplo que ya quedaron escritos dentro del registro (zona de 120 m², tramos 2500/800 L/s, 13 muebles, 43 m, 3 consumos, cuarto de 60 m², ubicación sembrada) no se distinguen de datos reales y se respetan como datos. (4) Solo la migración explícita 'Revisar y actualizar' pasa un legado a vacío, previa revisión guardada con projRevision. Muestra tres listas: sembrado aceptado (se conserva salvo que el usuario lo vacíe uno a uno); respaldos usados, con conservar o vaciar y los conflictos de doble respaldo marcados; y disciplinas que cambian, con Δ TR y Δ total. (5) Al volver a guardar sin migrar, el registro sigue siendo legado. Al migrar se escribe esquema 'vacio-1' con valores explícitos y S.origen por ruta ('sembrado-2.9.5' o 'respaldo-2.9.5'). (6) projDup, projRevision y anonimizarRegistro heredan el esquema del origen. (7) Se conserva el aviso actual de projOpen cuando p.rev es distinto de REV. Prueba: corpus de fixtures (arranque con nombre, INIT, caso, respaldo con '' y null, 0 tecleados, anterior a 2.7.0 sin her, anterior a 2.2.0 sin disciplinas, referencia, plantilla, 4 orientaciones, cuarto viejo, instantánea de soportería, ZIP). Cada uno debe dar globales y texto de memoria idénticos en todos los pasos.

## Cómo se garantiza que ninguna fórmula cambia

(1) Ningún cuerpo de motor se edita, y computeQuote tampoco. La compuerta vive en recompute y decide antes de llamar al motor. Si falta un requerido, el global queda en null. Con datos completos, el motor recibe la misma entrada que hoy, porque la sombra es igual a S en profundidad. Los respaldos internos (num(F.area,600), Math.max(1, c.area), `// 50`, num(Ltablero,30), `// 15`, P.ACH) siguen en el código sin tocar; solo dejan de ejecutarse cuando falta un requerido. Los renglones automáticos de cotización se apagan porque su global de origen es null. (2) Firma mecánica. Con indice-funciones.tsv se extrae por nombre el cuerpo de cada función de cálculo y de cada tabla (lista en el paso 3) y se guarda un hash. Cambiar un hash bloquea el paso. Los únicos cambios permitidos están en recompute, las fábricas, sanearEstado, las vistas, los documentos, la captura, la herencia, los cruces y los importadores. (3) Equivalencia con datos completos. Hay pruebas que afirman que compuerta(id).filas contiene todas las filas del caso, que la sombra es idéntica a S y que LOADS_OK equivale a LOADS. (4) Testigo sembrado. Los pasos 6 a 16 se aplican con las fábricas todavía sembradas. Cualquier diferencia en el arranque, el caso (en los dos modos), el corpus o el banco (206/206) se detecta antes de vaciar. (5) Proyectos legados. La compuerta y la captura nueva no se les aplican, y se fusionan con LEGADO_295. El corpus da cero diferencias. (6) Hay cosas que moverían un número y NO se cambian aquí; se reportan: - orden SOPORTE (8321) → QUOTE (8323): la primera corrida da 393,020 / 13,916,944.01 y la estable 430,020 / 13,975,383.88; - tempAmb vacío: el factor se calcula con 30 °C y se imprime 40 °C; - tabla rectangular con pc vacío en ductos redondos; - soportería lee Lramal y Lmontante en vivo; - caché de Kaizen sin tarifa ni horas. Con la compuerta, ninguno de estos casos se alcanza con un campo vacío en un proyecto nuevo.

## 1. Campos a vaciar, por motor

### Proyecto (meta y sitio)

- meta.name: 'Proyecto sin nombre' pasa a ''. El centinela se retira de hayProyecto (14187, 17669), cxzAgregarArchivos (12138) y del rótulo de projSave.
- meta.location: 'Tijuana, B.C.' pasa a ''.
- meta.client: ya nace en ''.
- meta.date: vacía o fecha de creación, según decida el dueño.
- site.key: según decida el dueño; propuesta: vacío. SITES no se toca.
- site.db, site.wb, site.alt: null (solo cuentan cuando key es custom).
- forceTech, sysForce, sel.{sistema, motivo, ts, recAlElegir, modelos}: ya nacen vacíos.
- perms, her, vinculos, kaizen.{items, ve, desv}, cx.{lotes, archivos}, linaje, pid: ya nacen vacíos.

### Zonas / carga térmica

- zones (colección): [] o una fila vacía, según decida el dueño. sanearEstado (nuevo) y zone-add (17822) dejan de sembrar.
- zones[].area: null.
- zones[].height: null. Además la herencia deja de copiar 0 y ventAlturaVigente deja de dar 3 m.
- zones[].occ: null.
- zones[].lights: null.
- zones[].equip: null.
- zones[].ach: null. Queda por decidir si es requerido o si se aplica P.ACH rotulado.
- zones[].achClean: null (condicional, solo cuartos limpios).
- zones[].oaFraction: null (centinela: vacío = sin fracción mínima).
- zones[].oaFixed: null (centinela: vacío = calculado).
- zones[].swing: null (neutro).
- zones[].ffuHeat: null o se retira (ningún motor lo lee).
- Selecciones de la zona (spaceType, runHours, lightType, iso, wallMat, roofMat, glassMat): dudosas; propuesta: '— elegir —'.

### Envolvente

- zones[].walls.N/E/S/W: 28/18/28/18 pasan a null. Se conserva el objeto de 8 llaves.
- zones[].walls.NE/SE/SW/NW: 0 pasa a null.
- zones[].glass.N/E/S/W: 4/6/12/8 pasan a null. Se conserva el objeto de 8 llaves.
- zones[].glass.NE/SE/SW/NW: 0 pasa a null.
- zones[].roof: 0 pasa a null (centinela: vacío = losa entre pisos).
- sanearEstado (nuevo): walls y glass con null donde falte, ya no num() → 0 (18339).
- oriInputs (13132): pinta vacío, no '// 0'.
- cxZonaDesde: no escala muros ni vidrio desde la zona de 120 m².

### Cuartos limpios

- clean.rooms (colección): [] o una fila vacía. cleanRooms (6593), sanearEstado y cl-del dejan de reponer. cl-add siembra una fila vacía.
- El literal viejo S.clean de defaultState (8238) se elimina.
- clean.rooms[].name: ''.
- clean.rooms[].iso: según decida el dueño (propuesta: '— elegir —').
- clean.rooms[].area: null.
- clean.rooms[].height: null.
- clean.rooms[].dp: null.
- clean.rooms[].crackLen: null (metraje supuesto).
- clean.rooms[].occ: null.
- clean.rooms[].procW: null.
- clean.rooms[].achSet: null (centinela: vacío = usar el rango).

### Ventilación

- vent.name: ''.
- vent.mode: '— elegir —' (sin modo no hay fórmula).
- vent.spaceType: '— elegir —'.
- vent.area, vent.height, vent.occ: null. Siguen heredables con compuerta por campo.
- vent.ach: null.
- vent.hoodL, vent.hoodW: null.
- vent.hoodType, vent.duty: '— elegir —'.
- vent.processCFM: null.
- vent.freeArea, vent.louverW, vent.louverH: null.
- vent.ductLoss, vent.filterLoss: null.
- vent.faceVel: dudoso.

### Ductos

- duct.segments (colección): [] (hoy 2 tramos SA-PRINCIPAL y SA-RAMAL). seg-add y chainToDuct (18204-18212) dejan de fijar 800 L/s, 12 m y 20/10/15 m.
- duct.segments[].tag: ''.
- duct.segments[].flow: null.
- duct.segments[].length: null (metraje supuesto).
- duct.segments[].service, shape: '— elegir —'.
- duct.segments[].fittings: [] (cantidades supuestas).
- duct.segments[].fittings[].type y qty: vacíos en fila nueva.
- duct.segments[].d/w/h: ya nacen en null.
- duct.segments[].hmax: null (centinela: vacío = sin restricción).
- method, targetF, targetV, aspect, meta.material, meta.pc: dudosos.

### Eléctrico

- elec.sistema: '— elegir —' (dudoso: la lista no tiene opción vacía).
- elec.trafoKVA: null (dato de placa).
- elec.trafoZ: null (dato de placa).
- elec.Ltablero: null (longitud supuesta). Cotización e ingeniería de valor dejan de usar 30 m.
- elec.cargas: ya nace en [].
- Fila nueva (defaultCarga, ec-add): kW, cant y L en null; tipo '— elegir —'; V y ph en null (se heredan del sistema).
- Cargas desde archivo (cx 11301): cant y L en null si el archivo no las trae.

### Hidrosanitario

- hidro.uso: '— elegir —'.
- hidro.muebles: [] (hoy 5 filas, 72 UM). sanearEstado (nuevo) deja de reponer.
- hidro.muebles[].cant: vacía (la fila no existe hasta capturarla).
- hidro.presRed: null.
- hidro.tramos: [] (hoy 2 filas, 43 m).
- Fila nueva (defaultTramoAgua, ht-add): um, L y alt en null.
- Metraje de la red en cotización: sin tramos con L capturada no hay renglón. El '// 50' (6329) nunca se alcanza porque la compuerta de hidro exige tramos con L.
- hidro.dot: '— elegir —'.
- hidro.habitantes: null.
- hidro.alturaEdificio: null.
- hidro.material, calentador, tempEntrada: dudosos.

### Contra incendio

- fuego.riesgo: '— elegir —'.
- fuego.area: null (heredable con compuerta).
- fuego.altura: null (heredable con compuerta).
- fuego.rociador: '— elegir —'.
- fuego.areaDiseno: null (centinela: vacío = mínima de la clase).
- fuego.Lramal: null (longitud supuesta).
- fuego.Lmontante: null (longitud supuesta).
- fuego.presFuente: null (requerido si la fuente es municipal).
- fuego.fuente: dudosa; propuesta: '— elegir —'.
- fuego.material: dudoso.

### Aire comprimido

- aire.clase: '— elegir —'.
- aire.presionUso: null.
- aire.simultaneidad: null (centinela: vacío = curva automática).
- aire.Lprincipal: null (longitud supuesta).
- aire.Lramales: null (longitud supuesta).
- aire.horas: null.
- aire.redundancia: '— elegir —'.
- aire.consumos: [] (hoy 3 filas, 38 puntos). sanearEstado (nuevo) deja de reponer.
- Fila nueva (defaultConsumo, aire-add): nombre '', tipo '— elegir —', cant null; lmin, bar y uso en null (centinela: vacío = catálogo).
- aire.material, fugas, reserva, arranquesHora, dPtanque, tempEntrada, tarifaKWh: dudosos.

### Obra civil

- civil.areaManual: null.
- civil.alturaManual: null.
- civil.murosManual: null.
- civil.demolMuroM2, demolPlafonM2, demolPisoM2: null.
- civil.firmeM2, azulejoM2, pinturaM2: null.
- civil.puertasLimpias, puertasSimples, visores, passbox: null.
- Sistemas muro, plafón, piso, muroNoLimpio y pisoNoLimpio: dudosos.

### Soportería

- soporte.alturaTrabajo: null (centinela: vacío = altura de zona + 1.2).
- soporte.mesesElevacion: null.
- soporte.basesEquipo: null (centinela: vacío = contar equipos; solo cuenta motores capturados).
- soporte.rielM: null.
- soporte.ductoM, tubHidroM, tubFuegoM, tubAireM: null. Cargar desde plano no escribe 0 desde un motor en null.

### Selección de equipo, cotización, propuesta y Kaizen

- quote.items: ya nace en []. Fila nueva: qty y unit en null; borrar en pantalla guarda null, no 1 ni 0.
- Renglones automáticos de computeQuote: no se tocan. Se apagan porque el global de origen queda en null (ducto por kg, difusores, FFU, ventilación, alimentador, red hidráulica, cisterna, incendio, aire, civil, soportería).
- quote.refBase: ya nace en ''.
- quote.prop.no: el folio 'EMP-año-001' pasa a '' (dudoso: ¿se genera al emitir?).
- quote.prop.cliente, atencion, puesto, sitio: ya nacen en ''. sitio deja de heredar la ubicación sembrada porque meta.location nace vacía.
- quote.prop.comparaCon: ya nace vacío.
- kaizen.items[].titulo (kz-add): 'Mejora nueva' pasa a ''.
- kaizen.items[].ahorro (kz-add): 0 pasa a null.
- kaizen.items[].owner, nota: ya nacen en ''.

## 2. Valores que se conservan, con motivo

| Valor | Motivo |
|---|---|
| Catálogos de fabricante y de equipos (familias, modelos, Greenheck, rociadores ROCIADOR, CONSUMIDORES, MUEBLES, compresores, secadores) | Qué no se toca (1). |
| Tablas y constantes de norma: SITES, SPACES, ISO_CLASSES, HOOD, HOOD_LIN, FITTINGS con sus C, RECT_G/ROUND_G, TIPO_CARGA, DOTACION, RIESGO, TUB_AGUA/TUB_FUEGO/TUB_AIRE, ISO8573, SIS_MURO/SIS_PLAFON/SIS_PISO, P.ACH, P.HOUR | Qué no se toca (2) y (4). La clave de sitio que elige cada proyecto es otra cosa y se decide aparte. |
| QUOTE_SEED: precios unitarios price.* (9 familias), ductKg, diffuser, pipeTR, controls, alimM, tablero, circuito, hidroM, cisternaM3, bombaHP, tanqueL, filtroAire, puntoUso, rociador, bombaFuego, ffu, hepaSpare, grille, fanCFM; instPct, scaleExp, priceFactor | Qué no se toca (3): precios unitarios base y recetas. |
| quote.indirect 0.18, utility 0.12, freight 0.025, bond 0.015, financing 0, finPct 1.5, fasar 1.45, iva 0.16 | Qué no se toca (5): política de la casa. Si se borran, vuelven a la semilla. Los rótulos se leen igual que el motor. |
| quote.currency, basePrecio, modo, plazaFactor 0, compresorMXN 0, secadorM3min 0, aireM 0 | Listas de opciones (6) y centinelas «0 = precio de catálogo o factor de plaza». No son datos del proyecto. |
| MO_CAT, CUADRILLAS, EQ_CAT, RECETAS, HERR_MENOR_PCT, CARGO_INSPECCION, CARGO_CMIC, PLAZAS, BASES_PRECIO, SEC_PROP, PDCA | Catálogos, recetas, salarios base y listas de licitación: qué no se toca (1), (3) y (6). |
| quote.prop.razon y quote.prop.grupo | Identidad de la casa, no del proyecto. La prueba 15.1 exige la marca en la portada. |
| duct.meta.eps 0.09, rho 1.2, mu 1.8e-5 | Rugosidad y propiedades físicas del aire (constantes). Con valor vacío o 0 el cálculo rompe (Δp 0, Re infinito). |
| duct.meta.largoEspiro 3.048 y duct.meta.hoja 0 | Formatos comerciales de compra de la casa (receta). No describen el proyecto. |
| elec.tempAmb 40, nCond 3, dvRamal 3, dvTotal 5, fpObjetivo .95 | Factores y criterios normativos: Tabla 310-15, arts. 210-19 y 215-2. tempAmb depende del sitio y queda como duda; su defecto de factor se reporta. |
| hidro.pendiente 2, hidro.diasReserva 1, hidro.tempSalida 45, hidro.presResidual 15 | Criterios de diseño de norma y de la casa. Sin control o con recomendación normativa. |
| soporte.sismico true y civil.mediaCanaDoble true | Requisito de norma y criterio de acabado de área clasificada. Si se vacían, se apagan en silencio (propuesta del dueño a confirmar). |
| Interruptores de modo: soporte.usarMotores, civil.usarZonas, fuego.tomarArea, elec.tomarHVAC, duct.segments[].lock, zones[].plenum false | Son banderas de origen o de modo, no capturas numéricas. usarMotores ya no se enciende 'en vivo' si no hay metros capturados. |
| units, meta.engineer, peakScan, zi, tab, guia, advOpen, cat.*, qfam | Preferencias de quien trabaja y estado de la interfaz o del catálogo. proj-new conserva engineer y units (18147). No son datos del proyecto. |
| zones[].name ('Zona N'), hidro.tramos[].tag ('AF-N'), hidro.tramos[].servicio 'fria', elec.cargas[].nombre ('Carga N', siempre texto) | Rótulos de fila generados, no valores que se confundan con datos. nombre nunca puede ser null porque rompe buildElecPdf. |
| Estructura de zones[].walls y zones[].glass (8 llaves) | No es dato: el motor indexa sin guarda (con null lanza excepción) y la prueba 16.1 exige `o in z.walls`. Solo se vacían los valores. |
| ids internos (duct.segments[].id, elec.cargas[].id, hidro.tramos[].id, aire.consumos[].id, hidro.muebles[].id), tramos[].tipoUM 'auto', elec.cargas[].fp null, elec.cargas[].fija false, hidro.equipoHN, hidro.consumoVariable | Llaves técnicas, banderas internas o valores que ya significan «no capturado». tipoUM vacío cambia la curva en silencio. |
| kaizen.items[].estado 'planear' | Primer estado de la lista PDCA: lista de opciones (6). |
| Reglas de los renglones automáticos de computeQuote (instalación % del equipo, difusores CFM/400, rejillas CFM/500, tubería por TR, DDC por equipo) | Recetas y factores (qué no se toca, 2 y 3). Se apagan por la compuerta, no por edición. |
| LEGADO_295 (copia congelada de los sembrados de 2.9.5) | Solo para completar proyectos guardados antes del cambio sin mover ningún número. No se usa en proyectos nuevos. |
| Caso de verificación embebido (PLANTILLAS_SUITE) | Guarda como dato literal todos los sembrados actuales, porque el banco debe seguir dando los mismos resultados. |

## 3. Dudas que necesitan tu criterio

**D1. zones[].wallMat / roofMat / glassMat / spaceType / runHours / lightType / iso**  
¿Son capturas que nacen vacías o conservan el primer valor de la lista? Si están vacías, hoy el motor usa en silencio panel PUR (7.956→7.813 TR), oficina, 16 h y LED. En la clase ISO la etiqueta dice ISO 8 y los FFU salen de ISO 7.  
   a) Nacen vacías con '— elegir —' en el control y son requeridas (materiales solo si su área es > 0; iso solo en cuarto limpio)  
   b) Se conserva el primer valor de la lista como estándar de la casa  
   c) Mixto: iso y spaceType vacíos y requeridos; materiales, runHours y lightType conservados  

**D2. zones (colección) y clean.rooms (colección)**  
¿El proyecto nuevo nace con 0 zonas y 0 cuartos, o con una fila vacía?  
   a) 0 filas (la pantalla ya muestra 'Agregar la primera zona'; se agregan guardas en viewLimpio, clean-pdf y clean-to-zone)  
   b) 1 fila con todos los campos vacíos  

**D3. site.key**  
¿La localidad climática del proyecto nace vacía (carga térmica sin datos hasta elegirla) o se conserva la de omisión? El catálogo SITES no se toca.  
   a) Vacía y requerida para carga, ventilación y corrección de equipo  
   b) Se conserva la clave por omisión como política  

**D4. bldDiv (1.00 sin crédito)**  
¿Factor neutro de la casa o captura del proyecto? Hoy el motor ya trata vacío y 0 como 1.  
   a) Conservar 1.00 (propuesta)  
   b) Nace vacío; vacío equivale a 1.00 y no cuenta como faltante  

**D5. zones[].plenum**  
No tiene control en pantalla. ¿Se deja false o null, que activa la regla automática h ≥ 3.5 m? En la zona de 6 m del caso cambia de 7.956 a 7.943 TR.  
   a) false (propuesta; el caso lo congela así)  
   b) null con regla automática  

**D6. zones[].ach, zones[].achClean, clean.rooms[].dp, crackLen, oaFrac**  
Hoy los respaldos de norma (0.35, 15, 12.5 Pa, 6 m, 0.10) se imprimen en la memoria como si fueran capturados. ¿Se exige el campo o se aplica el valor declarándolo?  
   a) Requeridos: sin ellos el motor queda 'incompleta'  
   b) Se conserva el valor de norma y la memoria lo rotula 'valor de norma aplicado, no capturado'  

**D7. Centinelas de 0: roof, oaFixed, oaFraction, swing, clean achSet, duct hmax, fuego.areaDiseno, aire.simultaneidad, consumos lmin/bar/uso, soporte.alturaTrabajo, basesEquipo**  
¿Vacío y 0 significan lo mismo ('automático' o 'no aplica') y no cuentan como faltante, o un 0 capturado pasa a ser dato?  
   a) Vacío y 0 dan el mismo automático (propuesta)  
   b) Solo vacío es automático; 0 es dato  

**D8. meta.date**  
¿Nace vacía o se sella con la fecha de creación, como hoy hacen proj-new, cxAplicar, archivar y projRevision?  
   a) Vacía; se propone la fecha detectada en archivos  
   b) Fecha de creación automática, con origen 'sistema'  

**D9. vent.faceVel, duct.segments[].method/targetF/targetV/aspect, clean.rooms[].level**  
Son criterios de diseño con valor recomendado. ¿Política de la casa o captura? Vaciar targetF o targetV da resultados absurdos (782 Pa, Ø1400).  
   a) Conservar como política (propuesta)  
   b) Vaciar y exigir en la compuerta  

**D10. duct.meta.material y duct.meta.pc**  
¿Selección del proyecto o estándar de la casa? Con pc vacío se aplica la tabla rectangular también a tramos redondos.  
   a) Conservar galvanizado y clase 2" como estándar  
   b) Vaciar y exigir  

**D11. duct.meta.rho**  
Está fija en 1.2 aunque el sitio tenga altitud. ¿Se sigue conservando fija o debe ligarse al clima del sitio? Ligarla cambiaría resultados, así que no entra en esta tarea.  
   a) Conservar fija  
   b) Abrir una revisión aparte para ligarla al sitio  

**D12. elec.material, hidro.material, fuego.material, aire.material**  
¿El material se trata como selección del proyecto (vacío) o como práctica de la casa?  
   a) Conservar como práctica de la casa  
   b) Vaciar con '— elegir —' y exigir  

**D13. elec.sistema**  
Hoy la lista no tiene opción vacía y vacío equivale a 220/127 V sin avisar. ¿Se agrega la opción vacía en el control?  
   a) Agregar '— elegir —' en la vista, sin tocar SISTEMAS, y exigirlo  
   b) Conservar 3F4H-220 como política  

**D14. elec.tempAmb**  
Se conserva 40 °C. ¿Debe salir de los datos del sitio? Además, con vacío el factor usa 30 °C y la memoria imprime 40 °C. Es un defecto que se reporta.  
   a) Conservar 40 °C y con la compuerta nunca queda vacío  
   b) Derivar del sitio (revisión aparte)  

**D15. elec.trafoKVA, trafoZ, Ltablero**  
Clasificados para vaciar como dato de placa o de medición. ¿Se confirma, sabiendo que sin ellos eléctrico no calcula falla ni alimentador?  
   a) Vaciar (propuesta)  
   b) Conservar como supuesto declarado  

**D16. hidro.calentador, hidro.tempEntrada, hidro.presResidual, elec.fpObjetivo**  
No tienen control en pantalla; si se vacían no se pueden capturar. ¿Se agrega control o se conservan?  
   a) Conservar (propuesta)  
   b) Agregar control y vaciar  

**D17. aire.fugas, reserva, arranquesHora, dPtanque, tempEntrada**  
¿Son factores o criterios de la casa, o captura del proyecto? ¿tempEntrada debe venir del sitio?  
   a) Conservar como política  
   b) Vaciar y exigir  

**D18. aire.tarifaKWh, aire.horas, quote.tarifaKWh 2.85, quote.horasAno 3500**  
¿Referencia de la casa o dato del cliente? Solo afectan el costo de operación y los ahorros de Kaizen y valor.  
   a) Conservar como referencia de la casa  
   b) Vaciar; el ahorro de operación queda 'sin datos'  

**D19. civil.muro, plafon, piso, muroNoLimpio, pisoNoLimpio**  
¿Son selección del proyecto o receta de la casa?  
   a) Conservar como receta  
   b) Vaciar y exigir  

**D20. fuego.fuente**  
Con vacío, hoy se cotizan bomba y cisterna (todo lo que no es municipal cuenta como cisterna). ¿Nace vacía?  
   a) Vacía y requerida (propuesta)  
   b) Conservar cisterna  

**D21. quote.fx 18.5 y quote.plaza**  
¿El tipo de cambio es política o dato con fecha? En USD, ¿se exige antes de cotizar? ¿La plaza depende de la ubicación?  
   a) Conservar ambos como política  
   b) fx vacío y exigido solo en USD; plaza conservada  

**D22. quote.prop.vigencia, hitos, firma, rev, no**  
¿Plantilla de la casa o dato por propuesta? ¿El folio se captura o se genera al emitir?  
   a) Conservar vigencia, hitos, firma y rev; folio vacío y generado al emitir  
   b) Todo vacío por propuesta  

**D23. quote.indirectPct y quote.profitPct**  
No existen en la semilla y la licitación los lee en 0 % (defecto de Capa 0). ¿La corrección toma indirect y utility o siembra estos dos campos?  
   a) Tomar indirect y utility  
   b) Sembrarlos como política nueva  

**D24. Soportería sin metros (renta de elevación y base de equipo)**  
¿Se deja de cotizar la renta y la base de un compresor con FAD 0? Con la compuerta, un proyecto nuevo sin metros ya no cotiza.  
   a) Sí, 'sin datos' (propuesta)  
   b) Cotizar la renta como supuesto declarado  

**D25. computeSoporte, lectura de S.fuego.Lramal/Lmontante en vivo (6179)**  
¿Soportería debe leer de la instantánea aceptada? Cambiarlo mueve números.  
   a) Revisión aparte  
   b) Dejar como está y documentar  

**D26. Renglón de red hidráulica con L = 0 tecleado**  
La corrección de Capa 0 declara los 50 m como supuesto. Con tramos capturados en 0 m, ¿qué se cotiza?  
   a) 0 m; no hay renglón  
   b) Supuesto declarado visible  

**D27. Importador DXF: altura de zona (cxZonaDesde)**  
Sin altura en el plano, ¿la zona entra con altura vacía o se declara 2.8 m como supuesto con origen? Esto decide 17.3, 17.6, 17.8 y 20.3.  
   a) Vacía y 'sin datos' (las pruebas cambian su expectativa por decisión escrita)  
   b) Supuesto declarado con origen visible  

**D28. Filas de archivo: elec.cargas[].cant/L, duct.segments[].length/fittings, clean.rooms[].dp/crackLen**  
¿Quedan vacías si el archivo no las trae? En ese caso el ramal o el tramo no se calcula hasta capturarlos.  
   a) Vacías (propuesta)  
   b) Supuesto declarado  

**D29. Orden SOPORTE→QUOTE en recompute (8321/8323)**  
Defecto nuevo, fuera de los 14: la primera corrida da otro total. ¿Se corrige?  
   a) Corregir el orden y regenerar la huella  
   b) Documentar y usar recompute ×2 en el caso y en el banco  

**D30. Arranque del banco**  
¿Perfil banco (caso + perms/items/cargas vacíos + semilla de INIT) más la sección del caso literal, o el caso literal en todo?  
   a) Perfil banco + sección 22 (propuesta; medido 206/206)  
   b) Caso literal en todo, ajustando 2.3, 8.5 y 12.2  

**D31. Composición del caso de verificación**  
¿Las '3 cargas' son las manuales de 15, 6 y 4 kW, y los '2 VRF de 6 TR' son vrf-40VMA-072 × 2 en la cotización? Al aceptar la cédula entrarían 4 cargas, y 'traer el sistema' da 1 × 40VMA-168 + 6 interiores.  
   a) Confirmar la composición propuesta  
   b) Otra composición indicada por el dueño  

**D32. Texto guía (placeholder)**  
¿Puede incluir un número de referencia o debe ser solo descriptivo? La instrucción prohíbe números de ejemplo dentro del campo.  
   a) Solo descriptivo con unidad (propuesta)  
   b) Descriptivo con rango típico fuera del campo, en la ayuda  

**D33. Ducto por kg y difusores sin permiso de cruce (6294-6297)**  
Con la compuerta dejan de entrar si ductos o zonas no están completos. ¿Se agrega además un permiso? Hacerlo cambiaría el caso.  
   a) No agregar permiso (propuesta)  
   b) Agregar permiso y regenerar la huella  

## 4. Campos donde hoy el vacío rompe un motor (medido)

| Campo | Efecto |
|---|---|
| zones (colección) | '' o null: excepción 'S.zones.map is not a function' en recompute. [] no rompe. |
| zi | null o '': excepción «reading 'lines'» en viewCarga (13129). |
| zones[].walls / zones[].glass (objeto) | null o ausente: excepción «reading 'N'» en computeLoad (2530-2567) y en estadoZona. '' o 0: cada orientación cuenta 0. |
| zones[].area | Vacío: la zona sigue calculando con muros, vidrio y ocupantes (7.956→5.294 TR) y elige equipo. Con todo vacío elige 24ACC618 con 0 TR y la memoria imprime renglones en 0. |
| zones[].height | Vacío: la carga usa 3 m (2522), civil usa 2.8 m (5926) y la herencia copia 0 a vent.height y fuego.altura (5.4→0.6). Un 0 capturado da h=0.1 m. |
| zones[].iso (cuarto limpio) | Vacío: la etiqueta dice ISO 8 (2529) pero los FFU se cuentan como ISO 7 (6561/6576): 9.394→10.378 TR, 34→60 FFU. |
| zones[].achClean | Vacío y también 0 capturado: se usa 15/h en silencio (2610, 2651). |
| zones[].ach | Vacío: se usa P.ACH 0.35 y la memoria lo imprime como capturado. |
| site (objeto) | null o borrado: excepción «reading 'key'» (siteOf 2348, zoneKey 8274). |
| site.db (custom) | '' o 0: excepción 'Reduce of empty array' en buildSystem y la app no recalcula. |
| site.wb (custom) | '' o 0: wb = 0 °C calculado como dato (11.703→9.274 TR). |
| vent.mode | Vacío: demanda 0, pero pickVent elige G-080 y la memoria imprime 'Selección Greenheck >= 0 CFM'. |
| vent.hoodType (cocina) | Vacío: excepción «reading 'medium'» en recompute (6466). |
| vent.duty (cocina) | Vacío: demanda NaN; la memoria imprime 'undefined CFM/ft² = NaN CFM'. |
| vent.processCFM (industrial) | '' o null: excepción 'toFixed is not a function' (6482). |
| vent.hoodL / louverW / louverH / freeArea | Vacío: pisos Math.max inventan 30 CFM, 18 CFM o un 5 % libre, y se cotizan. |
| vent.* (llaves ausentes en proyecto nuevo) | demand NaN; computeVent lee en crudo y sanearEstado no fusiona por llave. |
| duct.segments[].flow | Ausente: V y total NaN, 2400×1400 y 1393 kg. '', null o 0: 400×200 y lámina cuantificada (127 kg cotizados). |
| duct.segments[].length | Vacío: 0 m, pero sigue contando 1 junta, 1 soporte y la pérdida de accesorios. |
| duct.segments[].targetF / targetV | targetF '' o 0: 400×200 a 31 m/s y 782 Pa. targetF null: 1500×1100 y 819 kg. targetV vacío: Ø1400 y 499 kg. |
| duct.segments[].fittings[].qty | Vacío: el cálculo usa 0 y el despiece de compra cuenta 1. |
| duct.meta.rho / mu | rho vacío o 0: Δp total 0 Pa. mu vacío: Re infinito y Δp 32.6→41.5 Pa. |
| duct.meta.pc | Vacío: tabla rectangular también para tramos redondos (calibre 20→22). |
| duct.segments[].d/w/h con lock | Vacío: medidas de respaldo 400×200 o Ø250 en silencio. |
| clean.rooms (colección) | []: viewLimpio, render de limpios, clean-pdf y clean-to-zone lanzan excepción (CLEAN.cur undefined, 16059); cleanRooms (6593) repone el cuarto. |
| clean.rooms[].area | Vacío: Math.max(1) da 1 m², 1 FFU cotizado y semáforo 'datos'. |
| elec.cargas[].nombre | null, undefined o número: excepción en buildElecPdf (c.nombre.slice, 1659). |
| elec.tempAmb | Vacío: el factor se calcula con 30 °C (fTemp 7094) y memoria, PDF y XLSX imprimen 40 °C; el alimentador pasa de 2/0 a 1/0. |
| elec.sistema | Vacío: 220 V en silencio; el PDF deja 'Sistema:' en blanco. |
| elec.cargas (colección vacía) | El motor sigue emitiendo alimentador 14 AWG, principal de 15 A y 9.8 kA con transformador sembrado, y buildElecPdf lo imprime. |
| hidro.tramos[].L | Vacío: 10 m (7632), distinto de 0. Tramos [] o L 0: la cotización imprime '50 m de los tramos calculados' (6329). |
| hidro.tramos[].tipoUM | Vacío: curva de tanque aunque haya fluxómetros; 2"→1 1/4", presión insuficiente. |
| hidro.muebles (colección vacía) / hidro.habitantes | El motor calcula drenaje, CDT, cisterna y bomba de 0 HP y el PDF imprime 'TOTAL 0'. Con habitantes vacío se cotiza una cisterna de 0 m³. |
| fuego.area | Vacío en modo propio: 600 m² o 1 rociador; qTotal siempre > 0 y el semáforo nunca queda vacío. |
| fuego.riesgo | Vacío: ord1 en silencio; bomba 2500→2000 L/min y cotización más baja. |
| fuego.Lramal / Lmontante | Vacío: 30 y 12 m, que soportería lee en vivo aunque haya instantánea (6179): 42 m y 11 soportes fantasma. |
| aire.consumos (colección vacía) | Compresor de 10 HP, tanque de 1500 L y 120+90 m de red: 210 m de soportería, 1 base de equipo y 'FAD REQUERIDO 0' en el PDF. |
| aire.Lprincipal / Lramales | Vacío: 120 y 90 m escondidos, que llegan a soportería. |
| civil.alturaManual | Vacío: 3 m (5940); con 0 da 0. Vacío y cero dan totales distintos. |
| soporte.mesesElevacion | Vacío: 3 meses; con 0, 1 mes. La renta de tijera y la base se cotizan con nSoportes 0 (6348). |
| quote.items (colección) | '' o null: excepción forEach en computeQuote; se caen recompute y 5 pantallas. |
| quote.items[].qty | '': suma de texto (nEquip '033', 33 DDC, el total sube) y excepción toFixed en el PDF. null: línea en 0. |
| quote.items[].unit / quote.price.* | '' o 0: equipo a $0 (el ?? de listPrice 3684). price completo en null: excepción en viewSeleccion. |
| quote.scaleExp / priceFactor | '' o 0: equipo sin escala o todo en 0. |
| quote.indirect / utility / iva | '' o null: el importe usa la semilla, pero el rótulo dice 0 % y el XLSX escribe <f>C11*</f> o <f>C11*null</f>. |
| quote.currency / quote.fx | currency null: el PDF imprime 'null'. fx vacío en USD: importes en pesos rotulados US$. |
| quote.prop (en frío) | null: setPath lanza TypeError al capturar el folio o la vigencia (8355). no, rev, firma o razon en null: 'null' impreso 7-19 veces. |
| kaizen (objeto) | null: veDecidir lanza «reading 've'»; '': 'Cannot set properties of undefined'. |
| Globales de motor en null (con compuerta) | Revientan viewVent, viewProyecto, viewDuct, viewLimpio, viewElec, viewHidro, viewFuego, viewAire, viewCivil y viewSoporte; buildMemoriaPdf falla con VENT o DUCT null. Se corrige en el paso 9, antes del vaciado. |
| cxZonaDesde con altura vacía | Excepción en h.toFixed (11020-11024); cxAplicar descarta la zona en silencio (17.6, 17.8). Con altura: ocupantes 1, luces y equipo 0. |
| Herencia (sincronizarHerencia 14244 / migración de her 18418-18420) | Sin origen se queda el valor viejo; con altura u ocupantes vacíos copia 0. La migración marca los vacíos y sembrados como 'propio/usuario' con valor 0 y ya no heredan. |
| recompute (orden SOPORTE 8321 → QUOTE 8323) | Defecto nuevo: resultado no idempotente. En el caso, la primera corrida da 393,020 y 13,916,944.01; la estable, 430,020 y 13,975,383.88. |

## 5. Comprobaciones del banco afectadas

| Comprobación | Dependencia | Tratamiento |
|---|---|---|
| Preparación proyectoDePrueba (52-62) | Solo fija 2 zonas y toma de defaultZone y defaultState la envolvente, las cargas internas, ventilación, ductos, cuarto limpio, hidro, incendio, aire, civil y soporte. Con fábricas vacías da 6.29 TR en lugar de 11.7. | Se sustituye solo la preparación: abrir el caso embebido, aplicar el perfil banco (perms={}, quote.items=[], elec.cargas=[]), nombrar 'Banco de pruebas 2.7.0' y correr recompute. |
| Preparación de la sección 18 (línea 1641) y act('proj-new') en 1638, 1878+, 2017-2240 y 2456-2684 | proj-new copia INIT sembrado. Con aire vacío, S.aire.consumos[0] truena fuera de un t() y aborta las secciones 18, 20, 21 y 19. | Se reemplaza el contenido de INIT por el fixture semilla-banco.json (INIT sembrado explícito + aire/civil/soporte). No se toca ninguna expectativa. |
| Usos de G().defaultZone/defaultState/defaultSegment (580, 1122, 1168, 1181, 1209, 1442, 1639, 1744, 1774, 1834, 1904, 1916, 2197, 2382, 2530, 2553) | Construyen zonas y tramos con valores sembrados. | Pasan a una fábrica del fixture (LEGADO_295 del banco). Es cambio de preparación, no de expectativa. |
| 16.1, 16.5-16.7, 20.1 | Verifican la estructura: 8 llaves de walls/glass, orientaciones y forma del estado. | Siguen leyendo la fábrica real de la app. Deben pasar con null en los valores y la estructura intacta. |
| 2.2 | Espera carga 'datos'. Con zona vacía da 'incompleta'. Aire sin consumos da 'vacia'. | Corre contra el caso: pasa sin cambios. |
| 2.3 | Espera sem-vacia en el menú. Con el caso literal, HVAC muestra el peor nivel y ductos vacía no aparece. | Con el perfil banco pasa. Contra el caso literal falla y se reporta. Solo se ajusta (comparar por ícono de grupo) si el dueño exige el caso literal en todo. |
| 2.4 | Pone nombre 'Proyecto sin nombre' y pid null, y espera todo 'vacia'. | Pasa: hayProyecto sigue aceptando el literal viejo. Se agrega la 2.4b (proyecto abierto sin capturas: 14 en vacia). |
| 3.3 | Espera 700 por la herencia. Armado después de proj-new daba 80/600. | El caso se congela por la ruta del banco con her en heredado: da 700. Se vigila con la herencia por campo. |
| 6.1 y 6.2 | Memoria de 60,000 bytes o más, al menos 4 capítulos y los textos 'Carga termica', 'Cuadro de cargas' y 'Cedula de ductos'. En vacío: 3 páginas y 0 capítulos. | Corren contra el caso, que trae ductos, ventilación y demás como datos: pasan. Sin cambio. |
| 8.3 y 8.5 | Comparan contra la ventana --base. 8.5 falla con el caso literal por el orden SOPORTE→QUOTE: la base corre una vez y la diferencia es 58,439.87. | Con el perfil banco pasan. Si se usa el caso literal, se reporta el defecto nuevo. La decisión es del dueño: corregir el orden o correr recompute ×2 en la ventana base. |
| 9.1, 21.5 | Usan estructura o valores explícitos. | Pasan contra el caso (medido en la simulación vacía). |
| 12.2 | Espera 'por autorizar'. Con 7 cargas acumuladas, Kaizen detecta una medida del alimentador sin enlace. Además depende del alimentador que corrige Capa 0. | Con el perfil banco pasa. Contra el literal falla por el orden de cargas y se reporta. Si el dueño exige el literal, se aísla de las cargas acumuladas. Hay que volver a medir sobre Capa 0. |
| 13.8 | Pone meta.name '' y zones [] pero no pone pid en null. Con un caso abierto con pid, el nodo HVAC da 'incompleta'. | Ajuste de preparación: poner S.pid = null, como en la 2.4. Requiere autorización del dueño. |
| 15.1 | Busca la marca de la casa en la portada de la propuesta (prop.razon/grupo). | razon y grupo se conservan. La propuesta sin partidas mantiene la portada. Pasa. |
| 17.3, 17.6, 17.8, 20.3 | cxZonaDesde toma la altura sembrada de 2.8 m y escala desde la zona de 120 m². 17.6 espera área y 17.8 muro N = 12 × 2.8. | En modo legado y con la semilla del banco pasan. En esquema nuevo, con altura vacía, fallan (medido 204/206). Se reportan como campo donde el vacío rompe; la decisión es del dueño (supuesto declarado o nueva expectativa por escrito). |
| 18.6 y 18.25 | En un proyecto vacío la cotización no pinta el selector q-cmp-sel. | Pasan con la semilla de INIT. Se reporta que un proyecto nuevo vacío no muestra el comparativo hasta tener carga. |
| 18.15 | Después de proj-new escribe en S.duct.segments[0] y [1] y en S.hidro.tramos[0] y [1]. Con fábricas vacías: 'Cannot set properties of undefined'. | Cubierta por la semilla de INIT del banco. No se reescribe. |
| 18.17 | Espera 2 tramos. Con INIT que trae la ingeniería del caso da 3 zonas. | La semilla de INIT es la sembrada de la revisión base, no la del caso (variante V2b descartada). Pasa. |
| Pruebas que despachan eventos input con '' (buscar dispatchEvent en el banco) | Hoy borrar guarda 0. En esquema nuevo guarda null. | Corren contra el caso en esquema nuevo. Toda falla se revisa: si el consumidor no tolera null, se corrige en la app; si la prueba espera 0 al borrar, se reporta al dueño sin cambiar la expectativa. |
| Pruebas que leen ELEC.* con elec.cargas vacío (perfil banco) | En esquema nuevo, sin cargas manuales ni automáticas, ELEC queda en null. | Volver a medir. La compuerta cuenta las cargas automáticas (tomarHVAC) y las de la cédula. Si una prueba lee ELEC sin cargas, se protege el consumidor y se reporta. |
| Nuevas: sección 22 y pruebas de vacío | No existen hoy. | Se agregan: caso literal contra huella en dos modos; aislamiento de la plantilla; llaves de la plantilla contra el esquema; 2.4b; 20 vistas en vacío; documentos sin cero; borrar = null y 0 = dato; corpus legado intacto; importador sin altura sin descarte. |

## 6. Crítica de completitud (a resolver al implementar)

- [alta] El paso 6(d) rompe el arranque. Si `let S` (8255) e INIT (8256) se construyen con estadoNuevo() = sanearEstado(...), la app no arranca. — Todo el código vive en un solo <script> (813-19062). sanearEstado usa constantes que todavía no están inicializadas en la línea 8255: CX_ZIP_MAX_ENTRADAS (11650, usada en 18371), CX_MAX_LOTES (10698), CXZ_MOTOR_NOMBRE (11929) y HEREDA (14223, usada en 18416). Lo medí en sondas/critico-completitud-tdz.mjs, con una copia en memoria que reemplaza la línea 8255: error de arranque «Cannot access 'CX_ZI
- [alta] Diseño de LOADS con null alineado (paso 8). Una sombra con try/finally dentro de recompute no protege a quienes leen LOADS al pintar o desde acciones. La lista de consumidores del plan omite varios. — totals() (8334-8337) se llama fuera de recompute: projSave (18284), buildCotizacionPdf (1475), PROPUESTAS load>duct disponible y firma (14338-14339), chainHtml (12751), chainToDuct (18202, 18206), requisitoFam (8178-8182), selfCheck (14021), viewComparativo (16365), reopenSegment (17828), peakMatrix (2922), zoneTerminals (2939) y XLSX (4330, 4393). Medido con LOADS=[LOADS[0], null] (sondas/critico
- [alta] Los 50 m hidráulicos siguen apareciendo. El plan afirma que el '// 50' «nunca se alcanza», pero REQ de hidro no exige al menos un tramo con L>0, y un 0 capturado es dato válido. — computeQuote 6329: `HIDRO.tramos.reduce(... num(t.L,0)) // 50`. Medido: con 13 muebles (72 UM) y tramos=[], el renglón de red hidráulica sale con 50 m; con un tramo capturado en L=0, también 50 m. computeQuote no se puede editar (regla del propio plan).
- [alta] REQ de carga térmica no clasifica occ, lights ni equip. Vacíos, el motor los calcula como 0 e imprime el renglón. — computeLoad lee num(z.occ) en 2576, num(z.lights) en 2580-2582 («0 W × …» en la memoria) y num(z.equip) en 2584-2585. En el paso 7, REQ load solo exige area, height, sitio, spaceType y runHours. Las 8 orientaciones de walls y glass quedan como 'opcional neutro': con todo vacío, la envolvente calcula 0 en silencio.
- [alta] REQ eléctrico no exige, por carga, la longitud, la cantidad ni el tipo. Las cargas automáticas toman la longitud sembrada de 30 m. — computeElec: tipo vacío → 'proceso' (7350); cant vacía → 1 (7355); L vacía → 25 m (7359, `num(c.L, 25)`). Las cargas automáticas usan `L: num(E.Ltablero, 30) + 15` (7337) y `+ 25` (7343). En computeQuote 6324 el alimentador usa `num(S.elec.Ltablero, 30)`, leído directo de S y no de la sombra. Medido: con Ltablero=null y una carga de 10 kW, ELEC calcula y la cotización pone el alimentador en 30 m.
- [alta] Borrar fletes o fianzas NO regresa a la semilla. El plan afirma que «campos de política borrados: null, y el motor aplica la semilla» y que los rótulos leen num(q.x, QUOTE_SEED.x) «igual que el motor»; con esos rótulos se imprimiría 2.5 % con importe $0. — computeQuote 6390: `num(q.freight)`, `num(q.bond)` y `num(q.financing)` no tienen valor de respaldo (num devuelve 0 por omisión, 2384). Medido: freight y bond en null dan QUOTE.flete 0 y QUOTE.fianza 0 (antes 189,488 y 113,693). indirect en null sí usa la semilla.
- [media] La salida de la cotización PDF sigue imprimiendo ceros de resultado. El paso 11 solo quita 'TR instaladas' y '$/TR'. — buildCotizacionPdf 1481-1482: medido con proyecto con nombre y 0 zonas, imprime «0.0 TR en 0 zona(s) · 0 m2» y «0 CFM». Los rótulos en crudo de 1496-1502 (`q.indirect*100`, freight, bond, financing, iva) no están en la lista de rótulos del paso 11, que cita 15780, 5385-5390 y 4167-4172.
- [media] El tablero no está en la lista de vistas del paso 9. Sigue mostrando «0 m² · 0 TR» y el sitio y la ubicación sembrados. — viewTablero 14833: `n(t.area,0) m² · n(SYS.blockTons,1) TR`. 14825 muestra S.meta.location y 14827 muestra SITE.label y db/wb. Medido: «Área · carga 0 m² · 0 TR» y etiqueta «Tijuana, B.C.». siteOf (2348-2352) cae a la localidad por omisión cuando key es '' (medido: siteOf({key:''}) da Tijuana), y siteOf está en la firma de motores, así que no se puede cambiar.
- [media] Normalizar '' → null en site custom (paso 15) cambia la excepción de hoy por un clima sembrado en silencio. — siteOf 2350-2352: `s.db ?? base.db`, con base = SITES.tijuana. Medido: siteOf({key:'custom', db:null, wb:null, alt:null}) da db 35, wb 24, alt 0, igual que la localidad por omisión. alt null → 0 no se distingue de un 0 capturado.
- [media] «clean-to-zone» escribe supuestos como dato capturado, y ninguna lista lo recoge. — En 17964-17978: z.ach = 0.05, lights = área×12, walls, glass y roof en 0, runHours 24, iso de respaldo 'iso8' y equip = área×(procW//0). El paso 9 solo trata la dependencia de CLEAN.cur.
- [media] Horas y tarifa de aire, Kaizen e ingeniería de valor tienen respaldo sembrado dentro del motor. Vaciarlos no produce 'sin datos'. — computeAire 5731: num(A.horas, 3500) y num(A.tarifaKWh, 2.85). computeKaizen 13541 y computeIngValor 15349: num(q.horasAno, 3500) y num(q.tarifaKWh, 2.85). El plan pone aire.horas en null (campos_vaciar), pero REQ de aire no incluye horas, y valor y kaizen no tienen compuerta en REQ.
- [media] La firma de motores (paso 3) está incompleta. Faltan funciones y tablas de cálculo que los pasos 8 y 13 rodean. — No están en la lista, según indice-funciones.tsv: peakMatrix 2921, zoneTerminals 2938, corrKeyOf 2790, pAtmOf 2346, rhoAire 5595, dimRed 5709, computeCleanAll 6597, despieceProyecto 6850, tierraDe 7098, tuboPara 7104, elecOf 7225, hazen 7527, sizeAgua 7538, sizeDrenaje 7560, selPorFamilia 8100, requisitoFam 8174 y computeSoporteGobernado 14318. Tablas: AMP75, R_KM, X_KM, AREA_COND, TUBO, OCPD_STD,
- [baja] «Mis proyectos» imprime 0 m² y 0 TR en los proyectos vacíos guardados. — projSave 18285 guarda tons desde totals(). projectsModal 18852 y 18872 muestran `n(num(p.area),0) m² · num(p.tons) TR`. El índice filtra tons>0 (18840), pero la ficha no.
- [baja] En el diagrama, el nodo 'proyecto' nace con nivel 'datos' aunque el proyecto esté vacío. — diagramaPartes 15120: el nivel es 'datos' por omisión para cualquier nodo sin semáforo. NODOS incluye id 'proyecto' (14961+), que no está en DISCIPLINAS (14143-14165).
- [baja] La hoja URS del XLSX imprime condiciones interiores y clase ISO que no salen de ninguna captura. — 4329: `num(S.zones[0].tdb, 24)` y `num(S.zones[0].rh, 50)`, campos que ni siquiera existen en defaultZone (2713-2731). 4337: `ISO ${num(c.iso, 8)}` con c.iso = 'iso7' imprime ISO 8 (medido). Puede quedar dentro del defecto «hoja URS» de Capa 0; verificar.
- [baja] Campos sembrados que no aparecen en ninguna lista o están mal clasificados. — civil.demoler (false en 5909; leído en 5959 y 17142) no está en ninguna lista. fit-add (17839) siembra el accesorio {qty:1, C:.21} y no está en la lista de acciones del paso 17. hidro.equipoHN (5157, 5178) es una selección de equipo, pero se conserva como 'llave técnica'. hidro.consumoVariable tiene respaldo true en el lector (5165). aire.horas aparece a la vez en campos_vaciar y en dudosos.

**Contradicciones con la instrucción que la crítica detectó:**

- Banco (paso 5): el dueño exige que corra «contra ese caso». El plan lo corre contra una variante sin los 21 cruces, sin las 2 VRF y sin las 3 cargas (perfil banco: perms={}, quote.items=[], elec.cargas=[]). Además rellena INIT y los G().default* con un fixture sembrado, así que las secciones 16-21 prueban el estado sembrado y no el caso.
- El paso 5 depende de reemplazar el contenido de INIT para los act('proj-new') de las secciones 18, 20 y 21. Pero el paso 6(d) cambia proj-new (18153) a estadoNuevo(), que ya no lee INIT. Después del paso 17 esas secciones reciben el estado vacío y abortan, que es la falla que el propio plan predice en 1641.
- «Ningún motor calcula con campos vacíos» / «vacío no es cero»: REQ deja fuera zones[].occ, lights, equip (2576-2585), elec.cargas[].L, cant y tipo (7350-7359), aire.horas (5731) y clean occ y procW (6631). Además clasifica las 8 orientaciones como neutras, así que el motor calcula esos vacíos como 0, 25 m, 1 pieza o 3500 h.
- Respaldo de norma (ach 0.35, achClean 15, dp 12.5, crackLen 6, oaFrac 0.10) aplicado sobre un campo que el plan vacía y rotulado «valor de norma aplicado»: el motor sigue calculando con campo vacío. Solo es compatible con la instrucción si el dueño reclasifica esos campos como constante de norma.
- Fianzas y fletes 'siguen con su valor por omisión': con la captura nueva (paso 12), borrar el campo guarda null y computeQuote (6390) lo cotiza en 0, no en la semilla.
- Los 50 m de tubería hidráulica que el dueño manda retirar siguen cotizándose con tramos [] o con L=0 capturado (6329, medido). El plan no puede quitarlos sin editar computeQuote o sin exigir en REQ al menos un tramo con L>0 y definir qué pasa con L=0.
- Regla inviolable: la opción de dudosos «vaciar tarifaKWh/horasAno → ahorro 'sin datos'» no se puede implementar sin editar computeKaizen (13541) y computeIngValor (15349), que traen 2.85 y 3500 como respaldo interno. El plan tampoco define compuerta para valor ni kaizen.
- «Todo proyecto nuevo empieza vacío»: projDup y anonimizarRegistro heredan el esquema legado de su origen (paso 6e). Un proyecto nuevo creado desde un guardado anterior sigue completándose con LEGADO_295 (sembrados de 2.9.5) para las llaves que no traiga.
- «Compuerta lee solo S.*» contradice REQ equip (TR>0 de LOADS_OK), elec (cargas automáticas de tomarHVAC, que salen de SYS y VENT en 7324-7343), soporte (metros de un motor en ok) y quote (motor en ok con permiso). Esas compuertas dependen de resultados que en recompute todavía no existen cuando se calcula GATE, al inicio del paso 8.

**Afirmaciones aún sin medir:**

- «El '// 50' (6329) nunca se alcanza porque la compuerta de hidro exige tramos con L»: medido falso con tramos [] y con L=0 (sondas/critico-completitud.mjs, hidro_50m: 50 y 50).
- «Campos de política borrados: null, y el motor aplica la semilla» y «los rótulos leen num(q.x, QUOTE_SEED.x), igual que el motor»: medido falso para freight y bond (QUOTE.flete y QUOTE.fianza en 0). financing tiene el mismo patrón en 6390.
- «estadoNuevo() lo usan el arranque `let S` (8255) e INIT (8256)»: no se probó, y al probarlo en memoria rompe el arranque por zona muerta temporal de las const (sondas/critico-completitud-tdz.mjs).
- «LOADS conserva la alineación con null y LOADS_OK se presenta con sombra try/finally donde haga falta»: no hay medición de consumidores fuera de recompute. Medido: totals, projSave, buildCotizacionPdf, PROPUESTAS load>duct, chainHtml y requisitoFam lanzan con un null.
- «Medido V5: 206/206»: solo sobre la versión sembrada. El propio plan admite que con plantilla en esquema nuevo y perfil banco «hay que volver a medir». No hay corrida del banco sobre el mecanismo con compuerta.
- «Con datos completos, la sombra es idéntica a S en profundidad» y «compuerta(id).filas contiene todas las filas del caso»: son pruebas propuestas, no resultados medidos.
- «Proyecto nuevo: 14 disciplinas en vacía» con GATE: valor, kaizen y quote no tienen compuerta definida en REQ para el switch previo del paso 10. Solo existe la medición previa con todos los motores nulos y 0 zonas (semaforo-documentos-motor-nulo: 14 vacía), no sobre estadoNuevo().
- «KZ_CACHE y VZ_CACHE con el nivel de GATE evitan resultados viejos»: kaizenLazy devuelve KZ_CACHE.val sin mirar la llave cuando S.tab no está en su lista (13507). Sin medir.
- «La compuerta eléctrica cuenta las cargas automáticas»: incompatible con «compuerta lee solo S.*». Sin prototipo medido.
- «Recorrer las 20 vistas»: la sonda de referencia recorre 18 pestañas y no incluye diagrama, estructural ni catálogo. viewTablero, que imprime 0 m² · 0 TR (medido), falta en la lista del paso 9.
- «hidro.equipoHN y hidro.consumoVariable son llaves técnicas»: equipoHN es la selección del equipo hidroneumático (5157, 5178). No se verificó qué imprime al quedar sin selección.
- «Pesa unos 7 KB» y «el conjunto de hojas contiene las 456 listadas»: cifras tomadas de sondas previas, no revalidadas sobre la revisión con Capa 0, que es la base declarada.