# AUDITORÍA · SuiteEmp rev 2.9.23 (tag rev-2.9.23-candidata-4, commit c83ecba)

Fecha: 22-sep-2026 · Papel: auditor. No se corrigió nada: el repo quedó igual (`git status` limpio antes y después). Este archivo es lo único que se escribió.

---

## Resumen (una página)

**Qué está sano (con evidencia)**
- **Banco:** 351/351 y 356/356 con `--base respaldo-rev-2.9.8/index-2.9.21-inicio-20260921-221100.html`. Lo corrí yo y también cada subagente.
- **Aritmética:** en los 13 motores, cada caso calculado a mano de forma independiente reproduce a la suite con diferencia de 0 a 1.7 % (ver cada motor).
  - Excepción: la constante de fricción Haaland frente a Colebrook da −1.2 % en ductos.
  - Los errores están en **qué** se calcula, no en **cómo** se suma.
- **Sello por motor:** funciona como se diseñó. Un proyecto con sellos v1 de `load` e `hidro` abre con **sólo** esas dos disciplinas «Desactualizado» (v1→v2, v1→v4). Los sellos quedan byte a byte, nada se guarda ni se recalcula, y la memoria muestra antes y después tras Calcular.
- **Tijuana, dos casos ASHRAE:** mi psicrometría independiente da 6.423 g/kg (32.8/17.5 °C a 99.548 kPa) y 14.221 g/kg (DP 19.2 °C), iguales a la suite. La memoria cita ASHRAE 2021, WMO 760013.
- **Conductor = canalización = memoria:** comprobado con THW-LS y con THHN. Las 20 + 20 áreas coinciden con la NOM-001-SEDE-2012 Cap. 10 Tabla 5 (cotejo contra el texto del DOF).
- **Hidro:** precio por material + diámetro. Sin longitud queda «pendiente de longitud». No hay 50 m ni 10 m supuestos.
- **Budget:** «POR COTIZAR» sale sin importe y fuera del total.
- **Espejo ES/EN numérico:** exacto. Los 118 montos del PDF EN son igual a ES/18.5, y el Excel coincide celda por celda.
- **Arranque en vacío, Kaizen/Valor sin semáforo, tags sin mover y el instalador:** verificados (sección 2).

**Qué no está sano**
1. **Normas mal aplicadas en puntos de seguridad y dimensionamiento.** Hay 44 hallazgos críticos. Los más graves:
   - Ducto de grasa en galvanizado delgado y sin soldar.
   - Presión negativa de cuarto limpio convertida en +5 Pa.
   - Protección de equipos HVAC arriba de su MOP.
   - Corriente de motor sin la Tabla 430-250.
   - Tierras sin 250-122(b).
   - Altura de rociadores tomada como promedio de zonas.
   - Carga térmica por muros y cubierta sin corrección por sitio: −54 % en Mexicali.
   - Presión mínima de muebles bajo el IPC.
   - Regadera de emergencia calculada como unidades mueble.
2. **Estimaciones que se presentan como dato.** Todos los motores tienen constantes, pisos y valores por omisión sin fuente que llegan a memoria y cotización. Casos típicos:
   - Particiones de 12 %.
   - Alimentador de 30 m y transformador de 150 kVA.
   - Longitudes de 20/10/15 m al generar ductos.
   - Altura de colgado igual a la de trabajo.
   - Iluminación de 12 W/m² al crear una zona.
   - Curva de simultaneidad de aire.
3. **Precios.** La regla del dueño (sólo California, sólo material, etiqueta tal cual) sólo existe para la tubería hidráulica. El **99.93 % del costo directo** del proyecto de regresión sale de precios semilla sin fuente ni fecha.
   - La propuesta en USD convierte con 18.5 aunque el tipo de cambio no tenga fecha.
   - La regla «California» acepta «Tijuana, Baja California».
4. **Espejo ES/EN.** Sólo la propuesta tiene inglés. Aun así, su texto en inglés trae bloques completos en español (trazabilidad, normas, resultados, pie, sección H, unidades) y montos en MXN con «$» dentro del libro en USD.
5. **Versionado.** La rev 2.9.21 cambió la lógica de carga térmica sin subir `MOTOR_VER.load`: un proyecto sellado en 2.9.20 abre «Calculado» con otra carga (14.9 → 15.37 TR).
6. **Pruebas.** El banco protege textos, no números.
   - R.1 compara la suite contra cifras que generó ella misma.
   - En pruebas de mutación sobreviven al banco: ventilación 7/7, ductos 8/9, soportería 14/17, eléctrico 6/9 y aire 6/12.
   - Hay pruebas que consagran valores equivocados: L.2 fija el cobre a 1.8 m y P.9 fija una receta mal emparejada.

**Qué corregiría primero (orden propuesto)**
1. **H-107.** Subir `MOTOR_VER.load` a v3 con su hallazgo. Es barato, no mueve números y devuelve la garantía del sello.
2. **H-250 y H-251.** Cotización en USD sólo con tipo de cambio fechado, y regla de California estructurada. El cliente recibe hoy montos convertidos sin fecha.
3. **Seguridad**, cada uno con su prueba de valor independiente:
   - H-165: ducto de grasa.
   - H-127: presión negativa.
   - H-177, H-178, H-182 y H-183: art. 440, Tabla 430-250, 250-122(b) y tabla de tierras.
   - H-205: altura de rociadores.
   - H-194 y H-195: presión mínima por mueble y regadera de emergencia.
   - H-120: DET por sitio.
4. **H-115.** Pruebas con valores calculados a mano por disciplina, antes de mover números, para que cada corrección sea verificable.
5. **Estimaciones → «pendiente» o «Por cotizar».** Precios A–G (H-252), valores por omisión del eléctrico (H-179) y civil (H-245/H-246). Aquí el dueño decide caso por caso.

**Qué no se pudo verificar:** ver la sección 5. Lo principal:
- Textos de pago de SMACNA, NFPA 13/20 y ASCE 7. Se usaron fuentes secundarias, marcadas «de memoria» o «secundaria».
- Tabla B.2 de ISO 14644-4:2001 y texto de la edición 2022.
- ASHRAE 2021 en línea: el servicio respondió HTTP 500. Sólo se verificó la coherencia psicrométrica.
- Precios de mercado.
- Render visual y Excel real: sólo se revisaron jsdom y el XML.
- **Carga térmica:** el dueño detuvo su subagente. La cubrí yo con 3 casos y una revisión de constantes, sin la revisión exhaustiva de los otros motores.

**Conteo:** 155 renglones, H-107 a H-261, contiguos y sin duplicados: 44 críticos, 68 altos, 28 medios y 15 bajos. Los bajos están agrupados, uno por motor. Casi todos los críticos y altos mueven números (ver la columna).

---

## 1. Alcance y método
- **Leídos:** PLAN.md, CHANGELOG-motores.md, Bitácoras 2.9.18, 2.9.19, 2.9.20, 2.9.22 y 2.9.23, y PROMPT-MAESTRO-EMP-B12.md.
- **CLAUDE.md no existe** (ni en el repo ni en el usuario): ver H-117.
- **Subagentes:** uno por motor, 13 en total. El de carga térmica lo detuvo el dueño y ese motor lo audité yo.
- **Arnés:** jsdom de sólo lectura, en el scratchpad de la sesión (`arnes.mjs` + carpeta por motor).
- **Pruebas de mutación:** sobre copias en el scratchpad, nunca sobre el repo.
- Las líneas citadas son de `index.html` en c83ecba (22,238 líneas) y `pruebas.mjs`.
- **Historia:** repetí el proyecto de regresión en los 18 commits (`historia-motores.mjs`). El único commit que movió cifras sin subir versión es d3da45c (rev 2.9.21).

## 2. Decisiones ya tomadas · verificación con evidencia

| Decisión | Veredicto | Evidencia |
|---|---|---|
| MOTOR_VER por motor en la huella; «Desactualizado» sólo en la disciplina cuyo motor cambió; sin recálculo automático | **Mecanismo: cumple. En la práctica: falla** (H-107) | MOTOR_VER index.html:17487; sello con `ver` 17628; `selloDe` 17558-17565; `motoresCambiados` 17546; saneo de `ver`/`previo` 21499-21514; R.2 pruebas.mjs:5907-5922. Ejecución propia: sólo load/hidro marcados, sellos idénticos, menú marca hvac/hidro, nada se guarda. Falla: d3da45c cambió load sin subir versión; un proyecto de 7d7c2d0 abre «Calculado · motor v2» con 15.37 TR contra 14.9 TR sellados. Aparte: ductos marca «Desactualizado» por cambio de sitio aunque ρ no depende del sitio (H-174) |
| Tijuana: dos casos (enfriamiento y deshumidificación 0.4 %) en cuartos con HR controlada, fuente ASHRAE citada | **Cumple**, con 3 observaciones | SITES.tijuana index.html:3107+; `requiereHR` 10552; `sitioDeshum` 10553; `combinarCasos` 10560; S.37 pruebas.mjs:5723-5782; el PDF de carga cita «ASHRAE Handbook—Fundamentals 2021 … WMO 760013». Observaciones: la preselección de equipo usa el sitio de deshumidificación (H-144); el enfriamiento de Tecate y Ensenada es supuesto (H-125); el dato ASHRAE no se pudo reconsultar en línea (HTTP 500) |
| Conductor: la canalización usa las áreas del mismo conductor que dice la memoria | **Cumple** | THW-LS: 1/0 → 620.44 mm² → 2" y el PDF dice «THW-LS / THHW-LS». THHN: 511.51 mm² → 1½" y el PDF dice «THHN / THWN-2». AREA_COND_THW 9176; S.29 pruebas.mjs:5489. Salvedades: THW-LS no aparece por nombre en la Tabla 5 (H-192); el tubo cuenta un neutro inexistente en 3F3H (H-191); la mutación del área THW 2 AWG pasa el banco (H-115) |
| Hidrosanitario: precio por diámetro y material; sin longitud, «pendiente de longitud», nunca 50 m | **Cumple**, con excepciones | `claveHidroPU` 8235 (cobre y CPVC no se heredan); `num(t.L,0)` 9848, aviso 9859, «pendiente de longitud» 8349 y 8381-8384; sin `num(…L,50/10)` en hidro. Excepciones: la bomba se cotiza con CDT incompleto y la formal sale si ningún tramo tiene longitud (H-200); cisterna y bomba quedan fuera de la regla de precio (H-196) |
| Precios: únicamente California, sólo material, etiqueta tal cual, IUSA fuera, USD sólo con tipo de cambio fechado, sección H siempre «Por cotizar» | **Parcial** | Tubería: `HIDRO_PU_REFERENCIA = {}` 4701; material+MO → Por cotizar 8199; «no especificado» 8206-8212; H «Por cotizar» 8296-8301. Fallas: la regla sólo existe para tubería (H-252); `/california\|\bCA\b/i` 4702 acepta «Baja California» (H-251); la propuesta USD usa `num(S.quote.fx, 18.5)` sin `fxVigente` 6532 y 5104 (H-250); H pasa por factor de plaza y porcentajes (H-254, H-255); la bitácora de precios con «Tienda IUSA» llega al PDF del cliente (H-256) |
| Catálogo íntegro, consultado desde Selección | **Íntegro: sí. Acceso: parcial** | 132 modelos, 21 líneas, 9 familias, sin duplicados, fuente única RAW.carrier (870 → CARRIER 2634). viewSeleccion 18944 lee el mismo pool (18947) y la misma ficha (18986). No hay enlace de Selección a la pestaña Catálogo (19673), que es donde vive la procedencia. 13 de 21 líneas sin Product Data y 4 de 8 documentos mal atribuidos (H-147, H-152) |
| Kaizen y Valor sin semáforo y fuera de la completitud | **Cumple** | `SIN_SEMAFORO` 17015-17016, 17058, 17093; `.sem-gestion{display:none}` 172; conteos del tablero sólo datos/incompleta/desactualizada/vacía 17725 y 14948; memoria integral `filter(conSemaforo)` 18584; pruebas 337, 950, 4998 y 5941 |
| La suite abre en vacío; los datos de prueba no se cargan al abrir | **Cumple** | S.40 pruebas.mjs:5926-5946. Arnés propio: una zona en ceros, sin sellos, `hidroPU` = {}, `fxFecha` "". Ningún fetch ni referencia a fixtures en index.html. Observación: el sitio y la ubicación nacen en Tijuana (decisión 2.9.19), y hay valores de ejemplo que reviven si el JSON trae `null` (H-119) |
| Tags anteriores sin mover | **Cumple** | 4 tags anotados; la fecha de cada tag es la de su commit (candidata → fd267a0 00:37:44, -2 → 34f2a1b, -3 → bb25e25, -4 → c83ecba 01:49:40). Reflog de HEAD lineal, sin reset ni amend. El index.html del instalador 2.9.23 es igual al del árbol (SHA-256 7B3CE0FE…) |

---

## 3. Tabla de hallazgos

Severidad: **C** crítica · **A** alta · **M** media · **B** baja. «Mueve números» se refiere a la corrección propuesta.

### 3.1 Transversales

| ID | Motor | Sev. | Hallazgo | Evidencia | Norma / regla | Corrección propuesta | ¿Mueve números? |
|---|---|---|---|---|---|---|---|
| H-107 | versionado (load) | A | La rev 2.9.21 (d3da45c, «Humedad (c)») cambió la lógica de carga térmica sin subir `MOTOR_VER.load`. MOTOR_CAMBIOS y CHANGELOG-motores siguen con v2 = 2.9.20 | `historia-motores.mjs`: el único commit con cifras distintas sin subir versión es d3da45c (load; y aguas abajo equip, quote, valor, kaizen). Proyecto sellado en 7d7c2d0 (14.9 TR / planta 16.39) abre en HEAD «Calculado · motor v2» con 15.37 TR / 16.85; `motoresCambiados` = []. Bitácora 2.9.22 §1 documenta las cifras movidas | Regla del dueño rev 2.9.20 | `load` v3 con hallazgo «rev 2.9.21: aire exterior dedicado + serpentín seco, infiltración 0» y regenerar el esperado de load | No (sólo estado del sello) |
| H-108 | versionado | M | Aguas abajo no se marca: si cambia load, Selección, Eléctrico, Cotización, Valor y Kaizen siguen «Calculado» aunque sus cifras cambien (la huella son capturas, no resultados de origen) | Mismo ensayo: equip 16.39 → 16.85 TR «Calculado» | Consistente con la regla actual | Decisión del dueño: nota «el motor de origen cambió» o incluir las versiones de origen en la huella | No |
| H-109 | versionado | M | Se puede emitir la memoria con sello de versión vieja sin «CAMBIO DE MOTOR»: el antes/después sólo sale si hay `previo`, que nace al pulsar Calcular. El semáforo dice «Con datos / Complete» aunque el sello esté desactualizado | 1286-1290, 17629, 17638-17648; `memoria-sin-calcular.mjs`; `integral-desact.mjs` (propuesta sin mención) | Regla 2.9.20 «la memoria muestra antes y después» | Bloquear Memoria hasta Calcular, o imprimir antes (resumen del sello) y después (resumen actual) | No |
| H-110 | ES/EN | A | Memorias por disciplina, memoria de cotización, cotización por disciplina, licitación y memoria integral existen **sólo en español** | Comentario 1396-1399; `XLANG` sólo en 5096 y 6528; los 13 subagentes lo confirman por motor | Requisito del dueño: espejo exacto ES/EN | Pasar idioma a todos los `build*Pdf` | No |
| H-111 | ES/EN | A | La propuesta EN no es espejo exacto en texto. Queda en español: hoja DETAIL_ENGINEERING (disciplina, norma, resultado; 5317-5319 sin `L()`), bloque de trazabilidad del PDF EN (1410-1418, llamado en 6637), pie «Página N de M…» (1253), sección H (SEC_EN sin H, 5787-5805), unidades JUEGO/LITRO/ETAPA (UNIDAD_EN 5843), CAT_REV.nota (6554), `refTexto` («no especificado»), clases de riesgo, tipos eléctricos. El libro USD trae montos MXN con «$» («13 partida(s) · $ 3,348,872», «$ 229,955 en juego» junto a «US$ 12,430») y un párrafo completo en español («Subir a 1 cuesta del orden de $ 6,447…») | `excel-en-estado.mjs`: 69 cadenas en español; `excel-en-montos.mjs`; cotización: 31 líneas en el PDF EN y 94 celdas en el Excel EN | Espejo exacto | Traducir con `L()` todas las fuentes; montos por la función de moneda; prueba que busque español en el EN | No |
| H-112 | normas | M | NORMAS declara «vigente» en vez de edición y año: clean, vent, duct, fuego, aire, soporte. Load: «tablas protegidas de la casa». Se imprime en la trazabilidad de cada memoria y en el Excel | 10407-10417 | Trazabilidad | Edición y año por norma (p. ej. NFPA 13-2019, ISO 14644-4:2022, IMC 2021, MSS SP-58-2018) | No |
| H-113 | propuesta | A | La propuesta firma y pone «Contacto único» con un nombre fijo, no con `S.meta.engineer` | `defaultPropuesta` 5962 `firma: "Ing. …"`; usado en 5203, 5279, 5740, 6552, 6634-6635 | PROMPT-MAESTRO-EMP-B12.md:9: «no un nombre fijo» | Tomar `S.meta.engineer`; vacío → pendiente | No |
| H-114 | trazabilidad | M | Afirmaciones falsas en entregables: «La procedencia de cada línea está declarada abajo» (CAT_REV.nota) y «exponente de escala capturado» (NORMAS.quote), cuando es la semilla 0.85 | 10173, 10418; propuesta ES:30-32 | — | Corregir los textos | No |
| H-115 | pruebas | A | El banco no protege números. `t()` da por buena cualquier prueba que no lance error ni devuelva false. R.1 compara contra un esperado que genera la propia suite; `genera.mjs <motor>` lo regenera sin exigir versión (genera.mjs:62); `cifrasMotor` (17524-17543) omite salidas clave (tierra, caída, kAIC, presión mínima, UD, riostras, anclas). 8.x con `--base` sólo cubre 5 motores con el proyecto de oficinas. Mutaciones que sobreviven: vent 7/7, ductos 8/9, soporte 14/17 (incluido quitar el peso del agua), elec 6/9 (área THW, tierra de 400 A, falla ×0.5), aire 6/12. Pruebas que consagran errores: L.2 3793 (cobre 1.8 m), P.9 4211 (ESD ↔ pintura), S.18 4983, 3.2 358 (altura promedio en incendio), 22.12 3433 (cita ISO) | Informes de cada subagente (carpetas `mut/`) | — | Por motor, un «golden» calculado a mano con fórmula y fuente. R.1 debe fallar si cambian cifras sin subir versión. Ampliar `cifrasMotor` | No |
| H-116 | pruebas | B | IDs duplicados: R.1 y R.2 existen dos veces | pruebas.mjs:4532/5891 y 4555/5907 | — | Renombrar | No |
| H-117 | documentación | B | No existe CLAUDE.md. PLAN.md §3 recomienda «lista bruta» y §4.3 «retirar IUSA al cargar», ya superados por Bitácora 2.9.23 §9. `REV_NOTA` (2979) es una constante muerta que todavía anuncia precios IUSA. `REV_FECHA` dice 21-sep, pero las candidatas 2-4 son del 22-sep. Bitácora 2.9.23 salta la §7. MOTOR_CAMBIOS.quote v6 dice «IUSA» y llega a toast y memoria (17491) | grep y lectura | — | Limpieza documental | No |
| H-118 | entrega | B | `SuiteEmp-2.9.23-instalador.zip` se sobrescribió en cada candidata. El tag `rev-2.9.23-candidata` lo cita, pero el zip ya contiene c83ecba | SHA-256 del index.html del zip igual al del árbol | — | Nombrar el instalador por tag | No |
| H-119 | arranque en ceros | M | Valores de ejemplo que reviven cuando un respaldo trae `null` o "": incendio 30/12/6/30 (10091, 10097, 10103), hidro 25 m y 6 m (9869, 9914, 9921-9923), aire 120/90 m (6914), soportería de incendio 30+12 m (8029), eléctrico `num(c.L,25)` (9519). `sanearEstado` conserva `null` (21449) | Subagentes de fuego, hidro, aire, soporte y eléctrico | Decisión «arranque en ceros» | Valor por omisión 0 y pendiente | Sí (sólo con null) |

### 3.2 Carga térmica (`load`, v2) · auditado por mí

| ID | Sev. | Hallazgo | Evidencia | Norma | Corrección propuesta | ¿Mueve números? |
|---|---|---|---|---|---|---|
| H-120 | C | El DET de muros y cubierta **no se corrige** por temperatura de diseño ni por rango diario del sitio. Sólo el vidrio usa el ΔT del sitio | `carga-muros-sitio.mjs`: Muro N 100 m² K 0.85 → DET 7.8 °C / 662 W; Muro W 19.0 °C / 1,616 W; cubierta 16.7 °C / 921 W. **Idénticos** en Tijuana (32.8 °C, rango 9.2), Mexicali (44 °C, 14.2) y Hermosillo (42.8 °C, 12.1). detWall/detRoof 3306-3334; `shadeAt` 3301 sólo escala por hora (razón 1 a las 16 h). A mano (corrección CLTD, de memoria): Mexicali tom = 44 − 7.1 = 36.9 → +(25.5−24)+(36.9−29.4) = **+9.0 K** → Muro N 1,428 W (−54 % en la suite); cubierta 1,414 W (−35 %). Tijuana +0.3 K | Carrier Handbook, Part 1, Tabla 20A «Corrections to equivalent temperature differences» y ASHRAE Fundamentals (método CLTD): **de memoria, sin confirmar contra el texto** | Corregir el DET por (to − ti) y rango diario del sitio, con fuente | **Sí** (sube la carga en sitios calientes) |
| H-121 | A | Ganancias que nadie capturó, en toda zona: «Particiones adyacentes» (área × 12 % × U 1.5 × máx(3 K, 0.35ΔT)) y «Piso sobre no acondicionado» (área × 10 % × U 0.8 × máx(2 K, 0.25ΔT)) cuando no hay cubierta | 3398-3401; HAP 2990. Oficina de 100 m²: 55.44 W + 17.60 W (a mano igual a la suite) | «Nada se estima» | Captura explícita o 0 | Sí (≈ −2 a −3 %) |
| H-122 | A | Perfil solar horario (SUN_H) y DET de pico (DET_PEAK) son «estimación propia de EMP, no tabla publicada», y deciden la hora pico y la ganancia de fachadas N/NE/E | 3239-3290 (FUENTE_HORARIA se imprime) | ASHRAE CLTD/RTS para 32° N | Tablas publicadas con cita | Sí |
| H-123 | M | Piso ΔW = 0.5 g/kg cuando el exterior es más seco que el interior: latente de aire exterior inventada | `psychro` 3181. Tijuana: ΔW real −3.044 g/kg; oficina con 300 m³/h: 122.3 W latentes | Política de pisos 2.9.16 | ΔW = máx(0, real) con aviso | Sí |
| H-124 | M | Constantes de la casa sin norma que se imprimen como «HAP»: ventilador 2.6 %, conductos 3 %, «margen de error HAP» 5 %, BF 0.15, diversidades SPACES, estratificación 0.7–0.92, almacenamiento 12/16/24 h, «Tab. 45» 30 m³/h·persona y 1.8 m³/h·m² sin documento ni edición (rige el aire exterior en casi toda zona; ver H-158) | 2982-2996, 3368 | Trazabilidad | Declarar como criterio de la casa con valor, o citar Carrier con edición y tabla | No (sólo texto) |
| H-125 | A | Tecate (40/21 °C, 540 m, 16 K, «supuesto de valle interior · ratificar») y Ensenada (30/22 °C, 20 m, 8 K, «referencia costera · ratificar») calculan el caso de **enfriamiento** con datos sin fuente, y la memoria lo imprime como «Fuente climatica» | SITES 3107+; `sitios.mjs` | ASHRAE 2021 (las estaciones de referencia ya están en `ref`: Brown Field 32.2/17.9; Imperial Beach 29.9/18.1) | El dueño decide adoptar BS/BH de referencia o capturar dato con fuente | Sí |
| — | — | Sano | Caso a mano de oficina 100 m², 10 personas, 1 kW de luz y 0.5 kW de equipo: **3,378.2 W = 0.9605 TR**, igual a la suite. Psicrometría Hyland-Wexler a 149 m: 6.423 / 9.467 / 14.221 g/kg, igual a la suite | `carga-mano.mjs` | ASHRAE Fundamentals 2021 cap. 1 | — | — |

### 3.3 Cuartos limpios (`clean`, v2)

| ID | Sev. | Hallazgo | Evidencia | Norma | Corrección propuesta | ¿Mueve números? |
|---|---|---|---|---|---|---|
| H-126 | C | «Traspasar la reposición» empata cuarto y zona por la primera palabra del nombre: la reposición del ISO 5 «Sala de llenado» cae en la oficina «Sala de juntas» | 21023-21033 (`split(" ")[0]` + `startsWith`) | Integridad de datos | Vínculo por id; rechazar empates ambiguos | Sí (carga y equipo) |
| H-127 | C | No se puede diseñar presión negativa: −10 o −15 Pa se vuelven +5 Pa, y el Excel imprime «5 · Capturado» | 8706 `Math.max(5, dPcap)`; carga sí acepta negativa (3440) | EU GMP Anexo 1 (2022) §4.14 | Capturar el sentido; aplicar el piso al valor absoluto | Sí (seguridad) |
| H-128 | C | «Crear zona de carga con este cuarto» inventa 12 W/m² de iluminación y 0.05 renovaciones/h | 21045-21046 | «Nada se estima» | Iluminación sin capturar, que la pida el semáforo | Sí |
| H-129 | A | La memoria declara 0.45 m/s unidireccional en ISO 5; con la regla de la suite da 0.347 m/s | 1718 | GMP Anexo 1 §4.30 (0.36–0.54 m/s, guía) | Dimensionar ISO 5 por velocidad o quitar la frase | Sí (+30 % de caudal) |
| H-130 | A | Rangos de cambios de aire y cobertura atribuidos a «ISO 14644-4 · ISPE, vigente». La 14644-4:2022 retiró la tabla y la de 2001 daba ISO 6 = 70–160/h (la suite usa 90–180) | 8609-8615, 10408 | ISO 14644-4:2022 (2.ª ed.) | «Criterio de la casa», o fuente con edición y tabla | Posible |
| H-131 | A | ISO 6 rotulado «GMP grado B» | 8612 | GMP Anexo 1 (2022) Tabla 1 | Quitar el grado | No |
| H-132 | A | El piso de 5 Pa se presenta como exigencia de ISO. El aviso no llega al PDF ni al Excel, y el Excel rotula «Capturado» valores por omisión o de piso | 8703-8706, 8728; 5369 | 14644-4:2001 A.5.3 (informativo); GMP §4.14 (10 Pa) | Recomendación con edición; origen real del dato en entregables | No |
| H-133 | A | La memoria PDF no trae bases de cálculo: imprime fuga y reposición sin fórmula ni constantes. La reposición de la regresión sale 100 % del 10 % por omisión | 1601-1635, 1691-1721 (existe `r.memo` 8726-8736 que no se imprime) | Trazabilidad | Imprimir la derivación | No |
| H-134 | A | El conteo de FFU difiere entre limpios (cotización y eléctrico) y carga térmica (calor) para el mismo cuarto: 27 contra 36 | 8688/8700 contra 3426 `levelFromAch` | Reabre H-04 | Un solo origen del dato | Sí |
| H-135 | A | Terminales cotizadas dos veces: los difusores con plenum usan `totals().cfm` de carga, que incluye los 9,535 CFM de la zona limpia ya cotizados como FFU (≈ 24 de 41 difusores, ≈ 164,400 MXN). Además, la regla de 400 CFM por boca no tiene fuente | 8280-8283 | — | Excluir zonas servidas por FFU; regla con fuente | Sí |
| H-136 | A | Rejillas de retorno: «500 CFM por rejilla» sin fuente y redondeo sobre el total del proyecto (33 contra 34 por cuarto) | 8320 | — | Capacidad de catálogo; por cuarto | Sí |
| H-137 | A | Clase ISO supuesta o sustituida sin aviso: al importar cae a ISO 7; una ISO 4 se crea como ISO 7; clave desconocida → ISO 7 en limpios pero ISO 8 en carga | 13630, 13635, 13637, 8687, 3347 | — | Avisar y no crear; una regla | Sí |
| H-138 | M | Modelo de fuga y FFU sin fuente: 0.827, rendija de 3 mm no capturable, 6 m, ×1.25, sin corrección por altitud. FFU operando al 56 % de su nominal sin declararlo. La memoria dice que el calor «se traslada» a carga y carga usa otro método | 8707-8719, 8616-8618, 8734 | Ecuación de orificio | Citar; capturar la holgura; densidad del sitio | Sí, si cambian |
| H-139 | M | Citas obsoletas: EN 779 (sustituida por ISO 16890 en 2018), «Clase 100…100 000» (FED-STD-209E, cancelada en 2001), EN 1822 usada para asignar clase. No imprime Cn ni el estado de ocupación. Acepta cobertura imposible (14.67 m² de filtro en 12 m² de plafón, «100 %») | 1629, 1631, 1718, 8642 | ISO 14644-1:2015; ISO 16890 | Actualizar citas; imprimir Cn; error por cobertura | No |
| H-140 | B | Bajos agrupados: «JUEGO» y «NPT» en EN; altura impresa mal con área < 1 m²; textos fijos «@ 629 CFM», «cascada 12.5 Pa», «Margen HAP 5 %»; el total de área suma cuartos no calculados; ocupantes no numéricos dan NaN | 5843/8319, 1704, 1706, 1700, 1608, 8680, 8718 | — | Limpieza | No |

### 3.4 Selección de equipo (`equip`, v1)

| ID | Sev. | Hallazgo | Evidencia | Norma | Corrección propuesta | ¿Mueve números? |
|---|---|---|---|---|---|---|
| H-141 | C | La diversidad del edificio (`bldDiv`) se aplica dos veces: en cada ganancia interna de zona y otra vez en la planta. Con 0.8 el objetivo queda ×0.713. El panel por familia no la aplica (15.02 contra 12.02 TR) | 3404, 3408, 3411 (`bd`) y 4427-4428 (`userDiv`) | — | Aplicarla una sola vez (planta) | Sí (con bldDiv < 1) |
| H-142 | C | El submittal y la ficha llevan datos inventados como si fueran del equipo: peso y refrigerante por fórmula lineal en TR (50TC-A07: 16.8–25.2 lb contra 14.1 lb del documento), número de revisión por el código del último carácter, chiller con «Caudal 8000 CFM / ESP», fan coils con «AHRI 550/590 (chiller)», «en condiciones AHRI» sin documento | 951-962, 966, 973, 992 | Form 50TC-7-16-03PD | Quitar o marcar renglón por renglón | Sí (valores del submittal) |
| H-143 | A | Coeficientes de corrección por sitio sin fuente y atribuidos a AHRI. Su sensibilidad al BH (1.5 %/K) es la mitad de la del documento citado (mediana 3.0 %/K). BH del cuarto fijo. El chiller se corrige por BH. La WSHP se corrige como PTAC | CAP_CORR 3630-3639, 3659; NORMAS.equip 10409. Form 50TC: factor 0.948–0.952 contra 0.988 de la suite; el rooftop de Producción pasaría de A12 a A14 | AHRI 340/360 fija el punto de clasificación, no coeficientes | Coeficientes del fabricante por línea | Sí |
| H-144 | A | En zonas con control de humedad la preselección usa el sitio de deshumidificación (factor 1.127 en lugar de 0.993; memoria §8 con 2.86 TR contra §7 con 2.91) | 10664, 10582/10634 | — | Recalcular `eq` tras combinar casos | Sí (memoria; no el sistema) |
| H-145 | A | Los terminales se eligen sólo por TR: Limpio ISO 7 recibe 14.7–16.8 % de su caudal. Sin aviso | 3737-3756, 3791-3803; checks 3891-3905 | — | Revisar caudal y presión estática por zona | Posible |
| H-146 | A | «Split ducted» sin condensadora (40RUA sola) y mezcla con «Multi outdoor» | LINE.split 3724; 870; 4497; 21282-21291 | — | Pareja evaporadora + condensadora | Sí |
| H-147 | A | Procedencia atribuida a documentos que no cubren la línea: 50HC → Form 50TC (no contiene «50HC»), 39L → 39M-13PD, 42BJ → ficha 42CT, 40MBC → 40MBCQ. Los modelos 42C-06…36 no existen en 42CT | LINEA_FUENTE 10235-10243 | — | Corregir o «sin documento» | No |
| H-148 | A | Chillers 30RB-040…200 catalogados de 10 a 50 TR, cuando el documento citado cubre 60–300 TR. La regresión cotiza 2 × 30RB-040 con precio extrapolado 10:1, sin aviso en entregables | 10205-10213, 4663, 4675-4681 | — | Llevar el aviso de fuera de rango a entregables; ratificar | Posible (importe) |
| H-149 | A | Manejadoras 39M/39L con TR que su documento no da (caudal sintético de 400 CFM/TR); se eligen por TR contra su propio criterio | FUENTES 39M-13PD; 10316-10317 | — | Elegir por caudal y presión estática | Posible |
| H-150 | M | Panel por familia incoherente con el sistema: recomienda 40MBC-06 (0.5 TR) para 9.15 TR y lo registra como desviación | 10362, 10433, 21084-21085 | — | Misma referencia y cantidad que el sistema | Sí (registro) |
| H-151 | M | La memoria rotula valores de placa como «en sitio» (17.8 contra 17.6 TR). Constantes de decisión sin fuente (10 %, 98 %, penalizaciones 0.06 y ×5, puntajes, 15 % de ESP, «Carrier admite 50–130 %»). AHRI sin edición. `fueraDeRango` no revisa caudal | 2012, 2056, 3742-3746, 4444-4506, 10447, 4475 | — | Etiquetas correctas; declarar criterios | Sí (cifra impresa) |
| H-152 | M | Catálogo: 13 de 21 líneas (74 modelos, 56 %) sin Product Data. La ficha dice «Dentro del rango declarado» para modelos sin documento. No hay enlace de Selección a la pestaña Catálogo | 10249, 19814, 15122, 19673 | Decisión «consultado desde Selección» | Enlace directo; «sin rango» cuando no hay documento | No |
| H-153 | B | Bajos agrupados: kWt = TR × 3.5 frente a 3.517; IPLV = EER × 1.35 sin fuente; dos secciones «6.»; «Equipo sugerido» toma la zona 1; «US$ 3,702.7» | 2632, 1683-1685, 15173-15179 | — | Limpieza | No |

### 3.5 Ventilación (`vent`, v1)

| ID | Sev. | Hallazgo | Evidencia | Norma | Corrección propuesta | ¿Mueve números? |
|---|---|---|---|---|---|---|
| H-154 | C | La familia preferida se impone a la cobertura: para 11,643 CFM elige GB-360 (máx. 9,000) y dice «ningún modelo cubre», aunque el CSW-30 (7,000–18,000) del mismo pool sí cubre. El GB-360 llega a propuesta, memoria integral y eléctrico | 8579-8582, 8593; B107 8304-8305 | — | Filtrar por cobertura y luego ordenar por familia; sin modelo si ninguno cubre | Sí (modelo, eléctrico) |
| H-155 | C | Pisos internos fabrican partidas: cocina sin medidas (piso de 0.1 ft) da 30 CFM y B101 con QUOTE.tot 13,729.56 MXN; rejilla sin área libre capturada (5 %, 400 fpm) da 258 CFM y 37,410 MXN | 8537, 8557-8558, 10484 | Política 2.9.16 | Demanda 0 si falta una medida | Sí |
| H-156 | A | El margen del 10 % se anula con la tolerancia ×0.9: 9,041 CFM se aceptan con un GB-360 de 9,000 como «cubre» | 8577, 8593 | — | cubre ⇔ cfmMin ≤ objetivo ≤ cfmMax | Sí |
| H-157 | A | Tres filas de SPACES no coinciden con 62.1: almacén Rp 2.5 (es 5), habitacional Ra 0.15 (es 0.3), site/datos Rp 0 (es 2.5). El cuarto limpio usa valores de oficina sin declararlo. La tabla también alimenta carga térmica | 3004-3011 | ASHRAE 62.1-2016 Tabla 6.2.2.1 (Addendum s) | Corregir y declarar | Sí (almacén −16.7 %) |
| H-158 | A | El valor rotulado «Aire exterior ASHRAE 62.1» casi siempre sale de «Tab.45» (+52 % en la oficina). La hoja URS dice «SI · ASHRAE 62.1 · 19,782 m³/h» comparando cambios de aire | 2986, 8505, 8525-8531, 5414-5417 | 62.1-2016 Ec. 6.2.2.1 | Separar 62.1 del criterio de la casa | Sólo rótulo |
| H-159 | A | Campanas: la visera en carga pesada o de combustible sólido no está permitida y la suite le asigna 300/400 cfm/ft inventados. «Combustible sólido» no se puede elegir en pantalla (la corrección H-35 no llega). La ayuda clasifica freidora y plancha como «pesada» | 8489-8495, 19142, 15307 | IMC 2021 §507.5.1/.2; ASHRAE 154 (vía CKV Guide) | Bloquear con error; agregar opción; corregir ayuda | Sí |
| H-160 | A | 6 cambios/h por omisión sin fuente rigen la demanda y se imprimen como dato | 10484, 15413-15415 | — | Omisión 0 o criterio declarado | Sí |
| H-161 | A | Modo reposición: la partida «de extracción» lleva el modelo de la unidad de reposición y además se cotiza reposición (2 × 136,590 MXN). La rejilla se cotiza como extractor con arrancador y curbs | 8302-8311, 8573-8576 | — | Una partida por equipo real | Sí |
| H-162 | M | Citas equivocadas: IMC 507.2 (la tabla es 507.5), NFPA 96 no tabula CFM por pie; no se verifica el mínimo de 500 fpm en ducto de grasa y ductos avisa con 7.6 m/s «NFPA 96», valor derogado en 2002 | 8497, 8544, 15306-15313, 9023 | IMC 2021 §507.5; NFPA 96 §8.2.1.1; IMC 506.3.4 | Corregir; verificar de 500 a 2,500 fpm | Sólo avisos |
| H-163 | M | Herencia del proyecto completo (incluye el cuarto limpio, que tiene su propio sistema); `chainToVent` con pisos (0.5 1/h, 0.1 m: 300 → 9,000 m³/h al capturar la altura); 62.1 sin Ez ni aviso con 0 ocupantes; la selección ignora la presión estática (`sp` sin definir); el catálogo Greenheck sin Product Data pero la memoria dice «CAPS» | 16669-16671, 21323, 16869-16870, 8523-8526, 8563, 8588, 872, 10255-10258 | 62.1-2016 §6.2.2.1.6 | Heredar por zona; guardar m³/h; declarar Ez; quitar «CAPS» | Sí |
| H-164 | B | Bajos agrupados: altura impresa 4.7 frente a 4.71; faltan campanas de doble isla y backshelf | 2129, 2156, 19141 | IMC 507.5 | — | Sí (en esos casos) |

### 3.6 Ductos y calibres (`duct`, v1)

| ID | Sev. | Hallazgo | Evidencia | Norma | Corrección propuesta | ¿Mueve números? |
|---|---|---|---|---|---|---|
| H-165 | C | Ducto de grasa en lámina galvanizada con «tabla + 2 calibres» (500 L/s clase ½": cal 22, 0.853 mm) y juntas T-1/TDC/espiral, no soldadas | 8815-8816 | NFPA 96 (resumen FE-3400): acero ≥ 1.37 mm u inox ≥ 1.09 mm, soldadura continua; UMC 2018 §510.5.1 | Mínimo 16 MSG acero / 18 inox, junta soldada, sin «galvanizado» | Sí |
| H-166 | C | Medidas inventadas que llegan a cédula y cotización: sin candidato → 400×200 (6,000 L/s a 75 m/s, 3,933 Pa); respaldos 250, 400/200 y Ø250 para medidas bloqueadas; tramo sin caudal con 25 m cotizado (225 kg, 37,142 MXN) | 8863, 8998-9000 | — | Error visible, sección vacía, fuera de kg y cotización | Sí |
| H-167 | C | «Generar desde carga» pone longitudes y accesorios no capturados: principal 20 m, ramales 10 m, aire exterior 15 m, tee 0.65, salida 1.0. Ejemplo: 889 kg = 146,684 MXN | 21297-21305 | «Arranque en ceros» | Longitud 0 (pendiente) o declarar cada supuesto | Sí |
| H-168 | C (fuente secundaria) | La tabla de calibres redondos (ROUND_G) sale 2 a 4 calibres más pesada que la tabla SMACNA de espiral: kg ×1.23 a ×1.87 | 8760-8768 | SMACNA, redondo espiral +2" (reproducción Pacific Duct, sin edición) | Cargar la tabla SMACNA citada | Sí |
| H-169 | A | La fricción constante apunta al diámetro redondo ya redondeado: entrega 0.46–0.73 Pa/m contra el objetivo de 0.8 (regresión: 0.512/0.516/0.601), con lámina +7 % en promedio | 9010, 8852-8860 | ASHRAE Fundamentals 2017 cap. 21 | De continuo; puntuación homogénea | Sí |
| H-170 | A | RECT_G sin número de tabla, edición ni refuerzo; un cuadro basado en SMACNA 1995 daría ≈ −24 % de kg en la regresión (**no verificado contra la fuente primaria**) | 8751-8759 | SMACNA HVAC DCS | Citar tabla y refuerzo | Sí |
| H-171 | A | La clase de presión no se compara con la presión calculada (clase ½" con 389 Pa, sin aviso) | Revisiones 3960-4000 | SMACNA Tabla 1-1 nota 4 | Avisar o bloquear | Sí (calibre) |
| H-172 | A | Cada tramo nuevo trae 2 codos no capturados (C 0.28): en la regresión son 48.9 de 73.3 Pa (67 %) y entran al ESP del equipo | 9100 | — | Tramo sin accesorios o con marca de «supuesto» | Sí |
| H-173 | A | La cédula no permite reproducir los números: no imprime ρ, μ, ε, método, objetivo ni accesorios con C; sin firmas | 1502-1550 | Trazabilidad | Agregar «Bases de diseño» | No |
| H-174 | M | ρ fija en 1.2 sin corrección por altitud (Tecate +5.5 %), mientras la huella incluye el sitio y marca «Desactualizado» sin cambio real. Coeficientes de accesorios sin código DFDB (codo R/D 1.5 = 0.21 contra 0.15 de ASHRAE; tee fijo en 0.65) | 10486, 17467, 8770-8778 | ASHRAE cap. 1 ec. 3; DFDB | ρ del sitio; citar DFDB | Sí |
| H-175 | M | Factores de cuantificación sin fuente: 12 % de traslapes, esquineros ×4 por junta (serían 8), soportes 1.8/2.4 m, +15 % de ventilador. Velocidades incoherentes (9/8 contra 10/6 m/s). Series comerciales mezcladas y tope Ø2000 sin aviso. Aluminio con espesor de acero | 9034-9047, 9021-9022, 3980-3981, 8742-8743, 8834, 8817 | SMACNA (no verificado) | Citar o declarar | Sí |
| H-176 | B | Bajos agrupados: Haaland (−1.2 %) frente a Colebrook; dos conteos de juntas (38 contra 35); peso por calibre (≈ −2 %); esquinero incompatible con la junta TDC | 8784, 9042/8924, 8824-8830 | — | — | Menor |

### 3.7 Eléctrico (`elec`, v4)

Norma cotejada contra el texto del DOF de la NOM-001-SEDE-2012 (página citada).

| ID | Sev. | Hallazgo | Evidencia | Norma | Corrección propuesta | ¿Mueve números? |
|---|---|---|---|---|---|---|
| H-177 | C | Los equipos HVAC se protegen al 250 % de FLA y quedan arriba de su propio MOP: VRF 40VMA-240 con 150 A contra MOP 90; 40MBC-24 con 25 contra 15. MCA y MOP se reciben pero no se usan | 9451-9452, 9518-9520, 9318, 16849 | 440-22(a), 440-32 (p. 449) | Art. 440 con datos de placa; nunca pasar del MOP | Sí |
| H-178 | C | La corriente de motor sale de P/(√3·V·fp), sin eficiencia y sin Tabla 430-250: 11 kW da 8 AWG donde la tabla pide 6 AWG (conductor chico); 15 kW da 125 A contra 150 A | 9518 | 430-6(a)(1), Tabla 430-250 (p. 405, 442) | Capturar hp y usar la corriente de tabla | Sí |
| H-179 | C | Valores por omisión impresos como captura: Ltablero 30 m (partida de alimentador de 40,500 MXN), transformador de 150 kVA y Z 4 % (falla impresa sin marca de supuesto), distancias automáticas Ltablero + 15/25/20… m. La memoria no imprime distancias | 9416-9417, 8331-8335, 9605, 9452-9503 | «Arranque en ceros»; ayuda 15365 | Vacíos y pendientes; imprimir L | Sí |
| H-180 | C | Cargas estimadas presentadas como dato: kWe de catálogo estimados con `estimado:false`; fp por tipo sin fuente, no editable y no impreso; fpObjetivo 0.95 oculto | 2604-2640, 16739, 9384-9391, 9418 | Trazabilidad | Marcar estimados; campo de fp | Sí |
| H-181 | C | La cotización eléctrica no sigue al cálculo: 400 kW da 4 × 600 kcmil en 4 tubos y la partida cotiza 1 juego a 1,350 MXN/m. El tablero de 1,600 A cuesta lo mismo que uno de 250 A. Precios sin fuente | 4732-4734 | Regla de precios | Juegos × conductores × metros por calibre; tablero por capacidad; o «Por cotizar» | Sí |
| H-182 | A | No se aplica 250-122(b): la tierra no crece cuando el conductor de fase crece por caída (500 kcmil con tierra 8 AWG a 150 m) | 9322 | 250-122(b) (p. 150) | Escalar por razón de áreas | Sí |
| H-183 | A | La tabla de tierras es la del NEC: 400 A → 3 AWG, cuando la NOM da 33.6 mm² (2 AWG). Sólo cobre; se corta en 2000 A | 9196 | Tabla 250-122 (p. 151) | Transcribir la tabla NOM (Cu y Al) | Sí |
| H-184 | A | Arriba de 800 A la protección queda por encima de la ampacidad (2 × 750 kcmil = 836 A con 1,000 A) | 9310-9314 | 240-4(c) (p. 102) | Subir el conductor, no la protección | Sí |
| H-185 | A | Lista de protecciones cortada en 2000 A (Idis 2,375 A → 2,000 A) y kAIC topado en 100 kA (falla de 114.1 kA) | 9193, 9210, 9595 | 240-6(a) (p. 104) | Completar la lista y avisar | Sí |
| H-186 | A | Aluminio de 12, 10 y 8 AWG, que la NOM no admite | 9138 | Tabla 310-106(a) (p. 216) | Aluminio desde 6 AWG | Sí |
| H-187 | A | La bomba contra incendio se trata como motor general (250 %, en el tablero general, sumada a la demanda) | 9492-9496 | Art. 695-4(b)(2), 695-6, 695-7 (p. 827) | Rama propia según art. 695 | Sí |
| H-188 | A | El principal se toma como el mayor de dos valores, no como la suma (125 A contra 150–175 A) | 9586 | 430-62, 430-63 (p. 426) | Implementar la suma | Sí |
| H-189 | A | Carga con L = 0 imprime caída 0.00 % sin aviso | 9405, 9519, 9598-9603 | 210-19 notas | Pendiente, no cero | Sí |
| H-190 | M | Resistencia de la columna PVC usada con tubo de acero (hasta +11 %) y X fija 0.19. Ambiente de 40 °C no ligado al sitio; `fTemp` devuelve 0.35 inventado arriba de 70 °C (la NOM no da valor). Columna de 75 °C sin declarar para ≤ 100 A | 9143, 9154, 9414, fTemp, 9130-9134 | Tabla 9 (p. 1011); 310-15(b)(2)(a); 110-14(c)(1)(a) | Columna del tubo; ambiente del sitio; bloquear > 70 °C | Sí |
| H-191 | M | Neutro contado en todo circuito trifásico, incluso en 3F3H-440 (un motor de 11 kW sale en 1" en vez de ¾"). Carga 1F a 220 V asignada a una sola fase (300 % de desbalance). Falla en 1F3H con √3. Circuitos cotizados por fila, no por unidad; una fila de 0 kW cuenta | 9326, 9594, `caso2` | Cap. 10 Tabla 1; 310-15(b)(5) | Corregir cada regla | Sí |
| H-192 | M | THW-LS no aparece por nombre en la Tabla 5 (se usa el renglón THW, con las 20 áreas iguales): equivalencia no declarada. La memoria no tiene columna de cantidad; 27 FFU salen como un circuito de 30 A | 9171-9175 | Cap. 10 Tabla 5 (p. 1006) | Declarar la equivalencia; columna de cantidad | No |
| H-193 | B | Bajos agrupados: «factor de demanda 1.16» (es ampacidad); renglón «Norma» sin año; tubo 3½" designación 89 (es 91); resistencia Al 8 AWG; factor por debajo de 25 °C | 1733, 9189 | Art. 100; Tabla 4 | — | No |

### 3.8 Hidrosanitario (`hidro`, v4)

| ID | Sev. | Hallazgo | Evidencia | Norma | Corrección propuesta | ¿Mueve números? |
|---|---|---|---|---|---|---|
| H-194 | C | Presión mínima por mueble sin fuente y bajo la norma (WC con fluxómetro 10.5 mca contra 24.6 mca de IPC); el CDT usa un residual fijo de 15 m y no la presión mínima | 9652-9654, 9831, 9870-9871, 9914 | IPC 2015/2024 Tabla 604.3 | Tabla 604.3 citada; CDT con máx(residual, mínima) | Sí (CDT 19.95 → 29.56 m) |
| H-195 | C | Lavaojos y regadera de emergencia tratados como 6 unidades mueble de Hunter | 9662 | ANSI/ISEA Z358.1-2014: 75.7 L/min durante 15 min, agua tibia | Demanda simultánea fija, fuera de Hunter | Sí (seguridad) |
| H-196 | C | Cisterna y bomba con precio semilla sin fuente (9,500 MXN/m³; 14,500 MXN/HP), cotizadas aunque la presión alcance y aun con «Cisterna de 0 m³» (29,000 MXN en el esperado de regresión) | 4740-4741, 8385-8387 | Regla de precios 22-sep | «Por cotizar»; bomba sólo si hace falta | Sí |
| H-197 | C | Pisos sin norma ni aviso: días ≥ 0.5 (0 días da 3 m³ y 57,500 MXN), pendiente ≥ 0.5 %, ΔT ≥ 5 | 9908, 9883, 9893 | IPC 704.1; decisión 2.9.16 | Respetar la captura; si hay piso, que sea de norma y con aviso | Sí |
| H-198 | C | CPVC de 2½", 3" y 4» marcados en el código «SIN VERIFICAR, CTS/SDR-11 no llega aquí» se eligen y cotizan sin aviso (la nota no llega al cliente). PEAD con tabla genérica sin SDR | 9713-9726, 8353-8354 | ASTM D2846 (de memoria, hasta 2") | Retirar o marcar error y «Por cotizar» | Sí |
| H-199 | A | Unidades mueble distintas de IPC E103.3(2) (uso privado, bebedero, mingitorio de 1"); manguera 5/3 y lavaojos 6 no están en la tabla. La fracción de agua caliente (0.5–0.7) no tiene fuente frente a la regla de ¾ (calentador 83.3 contra 97.7 kW). El agua caliente se dimensiona con la curva de fluxómetro aunque la memoria dice «tanque» | 9651-9663, 9655-9660, 9842, 9835 | IPC E103.3(2), E103.3(3) | Transcribir la tabla; columna «Hot»; curva de tanque para agua caliente | Sí |
| H-200 | A | La bomba se cotiza con CDT incompleto (L = 0 baja de 2 a 1.5 HP sin marca) y la formal sale cuando ningún tramo tiene longitud. Tramos con UM y L pero sin muebles desaparecen sin pendiente | `a2` casos 1 y 1c; 8340, 18669 | Decisión del dueño | Bomba pendiente; decidir el bloqueo por longitud | Sí |
| H-201 | A | Bajada: columna «más de 3 intervalos» para cualquier edificio y filas mal transcritas (75 mm 70 contra 72; 150 mm 1,100 contra 1,900; 200 mm 2,500 contra 3,600). Colector de 75 mm con 20/27 contra 36/42 | 9759-9767 | IPC 2015 710.1(1)/(2) | Corregir las filas; columna ≤ 3 intervalos | Sí |
| H-202 | A | Dotaciones no trazables («NTC / reglamentos de BC»): oficina 70 contra 50 L/persona/día de NTC-PA; cuarto limpio 130 sin fuente; escuela e industria mal aplicadas | 9772-9782 | NTC para el Proyecto Arquitectónico, Tabla 3.1 | Citar norma y año; corregir | Sí |
| H-203 | M | Tabla de Hunter incompleta (faltan 51 renglones; al interpolar hasta −8 %). UD distintas de IPC 709.1 (WC con fluxómetro 8 contra 4). η 0.6 y 0.65 sin fuente y redondeo a 0.5 HP (2.5 HP no es comercial). V máx. y C de Hazen-Williams sin cita. Rótulo PP-R «PN20 SDR 7.4» (es SDR 6). Supuestos no editables (18/45 °C, residual 15 m, gas 11.63 kWh/m³). La plantilla CSV pre-llena «IVA incluido = no» | 9675-9678, 9652/9661, 9926/6253/9927, 9723-9742, 9727, 9808-9811, 18679 | IPC E103.3(3), 709.1 | Completar tablas; citar; editar | Sí |
| H-204 | B | Bajos agrupados: «IPC 916» (es 906.2); `REV_NOTA` muerta; presión 0 capturada tomada como medida; extrapolación arriba de 5,000 UM sin aviso | 9885-9886, 9869-9871, 9694-9697 | IPC 906.2 | — | No |

### 3.9 Contra incendio (`fuego`, v2)

| ID | Sev. | Hallazgo | Evidencia | Norma | Corrección propuesta | ¿Mueve números? |
|---|---|---|---|---|---|---|
| H-205 | C | La altura estática es el **promedio** de las zonas, no la del rociador más alto, y así oculta el aviso de almacenamiento en rack (> 12 m). La regresión calcula con 700 m² y 4.71 m, no con los 600/6 declarados en genera.mjs:40 | 16662 (`vol/area`), 16673, 10097, 10144. Caso con zona de 13 m: 37.0 m / 35 HP contra 46.1 m / 40 HP | Cálculo al rociador más remoto y alto (de memoria) | Altura máxima o capturada | Sí (+1.29 m en regresión; hasta +9.1 m) |
| H-206 | C | El precio de la bomba es fijo (385,000 MXN) sin importar capacidad ni potencia | 4750, 8394-8396 | Regla de precios | Por capacidad y potencia con fuente, o «Por cotizar» | Sí |
| H-207 | A | La reserva usa el valor bajo del rango de duración sin la condición de supervisión que NFPA exige; `durMax` no se usa | 9970-9979, 10121 | NFPA 13-2016 §11.2.3.1.3 / Tabla 11.2.3.1.2 | Por omisión el valor alto; el bajo con casilla | Sí (138 → 207 m³) |
| H-208 | A | La lista de bombas no es la de NFPA 20 (tope 1,321 gpm; «2,500 L/min (661 gpm)» no es capacidad de norma); sin mínimo de 40 psi (salen «bombas» a 3.2 m, 5 HP); todo riesgo extra rebasa la lista | 10111 | NFPA 20-2016 §4.9 | Tabla de NFPA 20 y presión ≥ 2.7 bar | Sí |
| H-209 | A | Potencia en punto nominal con η 0.65 sin fuente y redondeo a 5 HP (35 HP no es NEMA); al eléctrico pasa «35 HP» con 23.78 kW | 10113-10114, 9494-9495 | NFPA 20-2019 §4.7.6 | Potencia máxima de curva; tamaño NEMA; placa al eléctrico | Sí |
| H-210 | A | Con área capturada y cabezal/montante/altura en 0 (el arranque normal) da 16.3 m y 15 HP sin aviso y con semáforo «datos» | 10091, 10095-10097, 17081 | — | Error, pendiente y semáforo «incompleta» | Sí |
| H-211 | A | Red municipal que no alcanza: el motor pide bomba y cisterna, pero la cotización no las incluye ni las deja pendientes | 10105, 8393 | — | «Por cotizar» | Sí |
| H-212 | A | Precios de rociador (2,850) y cisterna (9,500/m³) sin fuente; el número de rociadores es el mínimo teórico; cabezal, montante y válvulas sin partida propia | 4740, 4749, 10068, 8390-8392 | Regla de precios | Fuente y fecha; partidas de red | Sí |
| H-213 | M | «Vigente» con valores de punto único y texto de curva de 2019. Piso de área de operación que hace «operar» rociadores inexistentes (12 en diseño contra 5 en total). Manguera sumada a bomba y reserva sin declarar el supuesto. K80 con 0.40 gpm/ft² sin aviso. Supuestos 1.15, 30 %, +1 m y 6.1 m/s sin fuente | 10414, 9961-9964, 10065-10068, 10086-10090, 9989-9993, 10084-10097 | NFPA 13-2019/2022/2025 | Declarar la edición; mín(área/cobertura, total); preguntar por gabinetes | Sí |
| H-214 | B | Bajos agrupados: densidades impresas redondeadas hacia abajo; «extrusión de plástico» como riesgo extra 1; con red suficiente imprime «Bomba 1,500 L/min · 0 HP»; «riesgo Riesgo»; numeración que salta | 10130, 9976-9977, 10111-10114, 5435 | NFPA 13 §1.6, Anexo A | — | Mínimo |

### 3.10 Aire comprimido (`aire`, v2)

| ID | Sev. | Hallazgo | Evidencia | Norma | Corrección propuesta | ¿Mueve números? |
|---|---|---|---|---|---|---|
| H-215 | C | Los factores del secador contradicen su propia referencia: el comentario dice «catálogo a 35 °C y 7 bar», pero fT(35) = 0.92 y fP(7) = 0.90 (sobredimensiona ×1.21). Además dimensiona con el FAD requerido y no con el caudal del compresor | 6895-6900, 6907 | ISO 7183:2007 Tabla 2, opción A1 | Factor 1.0 en A1; tabla del fabricante; caudal máximo | Sí (2.46 → 2.02 m³/min) |
| H-216 | C | El tanque se trunca en silencio a 5,000 L (13,103 L teóricos → 5,000) y la memoria dice «se sube al comercial inmediato superior» | 6890-6892 (respaldo «o 5000») | Guía Atlas Copco (fabricante) | Aviso y varios tanques | Sí |
| H-217 | C | La demanda de diseño = máx(medio, pico × simultaneidad) con una curva sin fuente decide compresor, tanque e importe (regresión: 1,530 contra 700 L/min; sección E −38 % con los mismos precios) | 6835-6843 | Ninguna | Citar o declarar; el dueño decide | Sí |
| H-218 | C | Diámetros interiores de cédula 40 para todo material: con cobre de 55 m elige 1" (26.6 mm) cuando el DI real (26.04) obliga a 1¼" | DIAM_AIRE 6754-6755 contra TUB_AGUA.cobre 9723 | ASTM B88 tipo L | DI por material | Sí |
| H-219 | A | Referencia del aire libre no declarada y sin corrección por sitio (a 35 °C y 149 m: FAD equivalente 2,132.6 contra 2,019.6). La presión de cada consumo (`bar`) se lee y no se usa. La energía y el costo de fugas se calculan sobre el FAD de diseño (141,250 contra ≈ 52,800 MXN/año). La caída de red de 0.30 bar se supone aunque la calculada es 0.041 | 6932, 6889, 6912, 6826, 6856, 6953-6959, 6858-6859 | ISO 1217:2009 §3.4.1 | Declarar la referencia; máx(bar); consumo medio; caída calculada | Sí |
| H-220 | A | Normas mal usadas: ASME B31.3 citada sin ningún cálculo; «clase 1.2.1 exige inoxidable… grado médico» como error (el aire medicinal pide cobre ASTM B819 según NFPA 99); «la clase de aceite obliga a exento» (+1,095,000 MXN en el caso 3). La propuesta omite aire en la trazabilidad y la licitación imprime «Norma · E — sin declarar» | 10415, 6961-6962, 6878, 6637, 6509 | ISO 8573-1:2010; NFPA 99 | Criterio de la casa declarado; ids de motor en trazabilidad | Sí |
| H-221 | A | Red a un solo precio por metro y material, sin diámetro (el patrón que el dueño retiró en hidro); tanque lineal a 195 MXN/L: 585,000 MXN, más que el compresor | 6741-6750, 8438-8442, 4744 | Regla de precios | Por diámetro y tamaño con fuente | Sí |
| H-222 | M | NOM-020-STPS-2011 (recipientes sujetos a presión) no citada; ramal = 40 % del FAD sin fuente y ramales nombrados sin cotizarse; ediciones faltantes | 6944, 10415 | NOM-020-STPS-2011 | Nota y requisito | Diámetros |
| H-223 | B | Bajos agrupados: sin demanda, pantalla y `cifrasMotor` muestran 10 HP / 1,500 L; «Secador secador»; «304l, acabado ba»; unidades LITRO/ETAPA en EN (ver H-111) | 6907, 8440 | — | — | No |

### 3.11 Soportería (`soporte`, v2)

| ID | Sev. | Hallazgo | Evidencia | Norma | Corrección propuesta | ¿Mueve números? |
|---|---|---|---|---|---|---|
| H-224 | C | La red contra incendio se soporta siempre como acero ced. 40, aunque sea CPVC o cobre (CPVC 3" a 3.7 m) | 8026-8027, 8030 | NFPA 13 Tabla 17.4.2.1(a) (de memoria); tabla CPVC en NYC 1 RCNY §29-09 | Pasar el material de incendio | Sí |
| H-225 | C | Altura de colgado = altura de trabajo (7.2 m por varilla) sin campo de captura (el comentario dice que lo hay): 633.6 ML = 41,184 MXN; con 1 m serían 5,720 | 7944, 7949, 8061, 8135; viewSoporte 20157-20199 | «Nada se estima» | Campo visible y declarado | Sí |
| H-226 | C | Datos del edificio supuestos sin captura ni declaración en la memoria: SDS 1.0, estructura «losa de concreto», f'c 250. La memoria afirma «Anclaje M10 a losa f'c 250» y cita ASCE 7-16; el aviso «ap y Rp DECLARADOS» nunca llega | 7909-7911, 8053-8054, 7690, 7745-7750, 8173-8175 | ASCE 7-16 §13.3.1 (ya sustituida por 7-22); CFE MDOC-Sismo 2015 | Capturar con fuente; sin captura, anclaje «Por cotizar» | Sí |
| H-227 | C (si SMACNA se confirma) | Ducto rectangular con una sola varilla por soporte (faltarían 165.6 ML + 23 anclas + tuercas ≈ 14,605 MXN en la regresión) | 7752 | SMACNA DCS 2005 Tabla 5-1 «pair» (**de memoria**) | Par de colgantes o trapecio | Sí |
| H-228 | C | Termoplástico sin anclas ni tuercas en la cotización (38 soportes, 0 anclas); espaciamiento de termoplástico > 3" a 1.8 m (IPC: 1.22 m) y PP-R ≤ 1" a 0.9 m (IPC: 0.81) | 8130-8146, SOP_PLASTICO 7289 | IPC 2009 Tabla 308.5 | Sumar anclas; topar claros | Sí |
| H-229 | C | Cobre ½"–¾" a 1.8 m y 2½" a 3.0 m, mayores que MSS (1.5/1.5/2.7 m), con fuente «MSS»; la prueba L.2 protege el valor equivocado | ESPAC_COBRE 7440-7443; pruebas.mjs:3793 | ANSI/MSS SP-58 (tabla PHD 2018) | Valores MSS o norma declarada | Sí |
| H-230 | C | Modo «valores propios» inventa diámetros (hidráulica 50 mm, incendio 100, aire 32, ducto 400×300) y la memoria los imprime como calculados | 7985, 8043-8045 | — | Pedir diámetro y material | Sí |
| H-231 | C | Al aceptar la instantánea cambian las bases de equipo (3 → 2; se pierde el compresor, −18,500 MXN) | 16806-16808 contra 8122-8124 | — | Usar `snap.nEquip` | Sí |
| H-232 | C | Renta de elevación: 0 meses capturados se convierte en 1 (+32,000 MXN) y 3 meses por omisión; entra andamio con sólo 2 bases de equipo | 8116, 7897 | Política de pisos 2.9.16 | Respetar el 0; declarar la omisión | Sí |
| H-233 | A | La tabla «MSS SP-58 / IMC 305.4» no cumple completa ninguna: acero de 3" a 12" excede 12 ft del IPC/IMC; para plomería rige IPC 308.5 | 7435-7443, 7562 | IPC 2009 T308.5 | El dueño decide la norma | Sí |
| H-234 | A | Anclas revisadas con carga de servicio (sin 1.4D) y τcr 4.8 MPa por omisión, sin revisión sostenida (φNa 699.7 → ≈ 306 kgf con 2.1 MPa) | 7790, 7622, 7477 | ACI 318-19 cap. 17 y 5.3; Tabla 17.6.5.2.5 (de memoria) | Factorizar; τcr mínimo ACI o ESR | Sí |
| H-235 | A | Sísmico sólo contado: riostras NFPA 13 aplicadas también a ductos, hidráulica y aire (130,200 MXN, 34 % de la sección G, a 4,200 sin capacidad); Fp sólo como cortante del ancla | 7692-7698, 7806, 8146 | NFPA 13 sólo rociadores; ASCE 7-16 cap. 13; SMACNA SRM 2008 (no verificado) | Criterio por disciplina con fuente o «Por cotizar» | Sí |
| H-236 | A | No se aplica la varilla mínima por diámetro (hidráulica 2½"–4" con 3/8"); aire de aluminio o inoxidable soportado como acero (30 contra 21 soportes) | 7754, 8035, 16773 | MSS SP-58-2018 §7.2.1 (fragmento); IPC T308.5 aluminio | Tabla de varilla mínima; por material | Sí |
| H-237 | M | Capacidad de varilla de la edición anterior (610 contra 730 lb); cita «tabla 3» y «tabla 4»; NFPA 13 con numeración mezclada; NOM-009-STPS sin año; memoria afirma «trapecio revisado por capacidad» cuando ese camino nunca se alcanza (tope 3,521 kgf) y no cita norma; montante tratado como horizontal; factores 1.10/1.20/1.15/1.5 sin cita; «Conteo por tramo» omite 23 soportes de ducto | 7406, 7318, 7566, 10417, 8175, 7773-7783, 8027, 7514/7539/7460, 20236-20240 | MSS SP-58-2018 Tabla 2; AISI S100-16 / AISC 360-22 | Declarar edición; retirar el texto del trapecio o diseñarlo | Sí |
| H-238 | B | Bajos agrupados: metros redondeados hacia arriba; φ/τ salen «?» en el PDF; «elevación» traducido como «rigging»; claves de varilla distintas; falta 5" en DN_NOM; «revisada en StructCalc» (StructCalc no revisa secciones) | 7787, 5804, 7297 | — | — | Mínimo |

### 3.12 Estructural (`estr`, externo · StructCalc v0.1.2)

Sano: `estr` no está en MOTOR_VER, ENTRADAS ni MOTORES_CAPTURA. Los tres botones están apagados con nota. No hay cálculo de viento, vigas, cimentación ni cubierta en la suite. StructCalc existe en disco (`Desktop\Nueva carpeta (3)\EMP-StructCalc-v0.1.2\`) y su banco da 76/76. Sus afirmaciones (solver 3D, P-Delta, modal, pandeo, generador, sin AISC 360, sin despiece) se verificaron contra su código, salvo una (H-241).

| ID | Sev. | Hallazgo | Evidencia | Norma | Corrección propuesta | ¿Mueve números? |
|---|---|---|---|---|---|---|
| H-239 | A | La sección A se llama «Obra civil y **estructura**» con estado INCLUIDO / INCLUDED, sin ninguna partida estructural ni exclusión. El Excel ofrece «Análisis estructural (módulo externo StructCalc)» como entregable | 5947, 6601-6611, 5752-5757, 6627-6629, 5313 | Alcance contractual | Renombrar («Obra civil y acabados») o excluir expresamente ES/EN | No (alcance) |
| H-240 | M | La memoria integral no menciona Estructural (se filtra por «externo») | 18584, 18612-18623, 18649 | «Declarar en vez de callar» | Renglón fijo «externo, no integrado» | No |
| H-241 | M | La pantalla dice «verificado contra su código… ni cuantificación de acero», pero StructCalc sí calcula el peso de acero del marco | 17823, 17842 contra StructCalc.html:1574-1593 | — | Corregir el texto | No |
| H-242 | B | Bajos agrupados: botones sin toast al hacer clic; «Captura desde cero con el motor de abajo» sin motor; matices de la tarjeta (sin captura de sismo en la interfaz de StructCalc; ASCE 7-22 sin citar); ruta de StructCalc no distribuida; firme «armado», block «estructural» y bases de concreto sin nota «se definen por diseño» | 17610/17640/17671, 13097/13114, 20510, 6036-6037, 7078-7079 | ASCE 7-22; ACI 360R-10 | — | No |

### 3.13 Obra civil (`civil`, v3)

| ID | Sev. | Hallazgo | Evidencia | Norma | Corrección propuesta | ¿Mueve números? |
|---|---|---|---|---|---|---|
| H-243 | C | La media caña y el muro clasificado se reparten con la fracción de área de todo el edificio y se dividen entre la altura media de todas las zonas. En la regresión: 31.11 ml y 73.32 m², bajo la cota geométrica mínima de un cuarto de 120 m² (77.66 ml; 116.5 m²). Nave de 10 m + cuarto de 100 m²: −73 % | 7160, 7176-7182, 7225 | Regla del motor 7067-7071; cota isoperimétrica | Por cuarto limpio, con su área y altura | Sí (+147,229.88 MXN en la regresión) |
| H-244 | C | El «desarrollo de muro» mezcla muros exteriores de carga (envolvente) con perímetros estimados y no es monótono: capturar un muro exterior de 30 m² **baja** el muro civil (−400,446.30 MXN) | 7151-7152, 3380, 13444-13451 | — | Muros divisorios aparte | Sí |
| H-245 | A | Partidas forzadas sin captura: plafón reticular, piso y muro nuevos en toda el área no clasificada, sin opción «existente / sin trabajo» (1,890,542.29 MXN, 56.5 % de la sección A) | 7217-7219, 7073-7105 | Decisión 2.9.16 (no cubre «existente») | Opción «existente»; el dueño decide | Sí |
| H-246 | A | Las estimaciones no llegan marcadas a la propuesta: el muro 3:2 es el 57 % del muro de la regresión; los muros de ZONA_REF_120M2 salen como «capturados» | 7157, 7166, 7208-7209, 6278-6279, 20215 | «Nada por suposición» | Llevar la marca al documento | No (etiqueta) |
| H-247 | A | Tarjetas de licitación mal emparejadas: el piso ESD usa la receta de pintura de muro y el «firme pulido» la de firme de 15 cm (explosión: 110.6 m³ de concreto, 91.64 del pulido; 735 m² de malla). P.9 lo consagra | 6036-6061, 6075-6083; pruebas.mjs:4211-4217 | RLOPSRM art. 185 (sin confirmar) | Recetas propias o «sin explosión» | Sí (tarjetas y compras) |
| H-248 | M | Área clasificada sin tope (cuarto de 300 m² en zonas de 100 m²: +820,000 MXN sin aviso); cuarto con área y sin altura cotizado como no clasificado sin avisar; posible doble conteo firme + pulido y plafón MgO sobre el 100 % aunque los FFU ocupan 15–75 %; citas sin edición; sin factor de altura | 7176, 7216, 7222, 7144, 7247-7255, 7204/7223, 8610 | ISO 14644-4:2022; GMP Anexo 1 §4.5-4.8 | Topes, avisos, decisión del dueño | Sí |
| H-249 | B | Bajos agrupados: cantidad × P.U. ≠ importe (hasta 4.86 MXN; en EN 12 de 13); alturas por omisión distintas (2.8 / 3 / 0); claves inexistentes sustituidas en silencio; piezas fraccionarias; claves de memoria distintas de las de la propuesta | 7189, 7149/7163/16659, 7207/7211/7221 | — | — | Centavos |

### 3.14 Cotización (`quote`, v6)

Sano: la cascada recalculada a mano cuadra a 0.00 en 10 conceptos. Directo 12,335,153.65 → indirectos 18 % → utilidad 12 % en cascada → contingencia 15 % → flete local 2.5 % → fianzas 1.5 % → subtotal 18,645,818.26 → IVA → total 21,629,149.18. Coincide en pantalla, PDF y Excel, ES y EN. Budget «POR COTIZAR» con contador. La formal se bloquea sin precio de diámetro. El nombre «Flete local y maniobras en obra» aparece en todos los documentos, con «(en 0)» / «(sin capturar)».

| ID | Sev. | Hallazgo | Evidencia | Norma / regla | Corrección propuesta | ¿Mueve números? |
|---|---|---|---|---|---|---|
| H-250 | C | USD convertido con tipo de cambio **sin fecha**: la propuesta, el libro, la memoria y la pantalla usan `num(S.quote.fx, 18.5)` / `q.fx` y no `fxVigente()`. El PDF EN dice «EXCHANGE RATE NOT CAPTURED» y aun así da US$ 1,168,325.21 | 6532, 5104, 8464 contra 4691-4694 | Regla c (22-sep) | Convertir sólo con `fxVigente()`; sin fecha, no emitir el espejo USD | Sí |
| H-251 | C | «California» con falsos positivos: `/california\|\bCA\b/i` acepta «Tijuana, Baja California», «La Paz, Baja California Sur», «Toronto, ON, CA»; rechaza «San Diego» y «Carlsbad». Una referencia «Tienda IUSA · Tijuana, Baja California» entra al Budget (423.97 MXN/m), sobrevive a `sanearEstado` y el CSV la importa | 4702 | Reglas a y b | Campos país/estado (US/CA) o exclusión explícita, con pruebas | Sí |
| H-252 | C | Secciones A–G con precios semilla sin fuente ni fecha (PRICE_SEED, QUOTE_SEED, PU_CIVIL, PU_SOP, COMPRESORES): el **99.93 % del directo** de la regresión. Equipo por ley de potencia con exponente semilla 0.85 y extrapolación 10:1 (chiller de 10 TR desde base de 100 TR). BASES_PRECIO imprime «Precios propios de obra ejecutada» | 4662-4760, 7108, 7363, 6760, 4608-4611 | PLAN.md §1 «todos los componentes», «nunca estimar» (§4.2 reconoce que falta) | Extender el modelo de referencia a cada renglón o «Por cotizar»; el dueño decide | Sí, masivamente |
| H-253 | C | La formal sale con precios que sólo valen para el Budget: la licitación imprime «precio de referencia de mercado» sin etiqueta, con mano de obra e importación pendientes; `buildCotizacionPdf` sale aun sin ningún precio de tubería | 6394, 17581 | Regla e; PLAN §1 | Bloquear la formal con referencias, MO, H pendientes o USD sin fecha | Sí (bloquea) |
| H-254 | C (plaza ≠ Tijuana) | El factor de plaza se aplica a importes capturados: la importación de 18,500 sale 19,980 en Mexicali; la referencia 238.65 → 257.74 sin decirlo en la etiqueta | 6287, 8459 | Regla d «tal cual» | Excluir H y referencias del factor | Sí |
| H-255 | A | Los porcentajes se calculan también sobre la sección H: una importación de 100,000 suma +175,345.60 (flete local +2,500 = doble cobro; contingencia +15,000) | 8459-8463 | Nota del flete local 8217 | El dueño decide; al menos quitar flete local y contingencia | Sí |
| H-256 | A | La bitácora interna de precios llega a documentos del cliente: «referencia retirada (Tienda IUSA, menudeo, México…)» y «referencia 238.65 → proveedor local 250» en el PDF ES y EN; MOTOR_CAMBIOS con «IUSA» en memoria y pantalla | 6618-6620, 1289, 17491, 18722 | Regla b; confidencialidad | Sacar la bitácora de entregables | No |
| H-257 | A | El PDF no tiene renglón de financiamiento: con 2 % los renglones suman 18,645,818.26 y el SUBTOTAL impreso es 18,892,521.33 (Δ 246,703.07). El Excel sí lo tiene | 6563-6573 contra 5230 | Cuadre | Agregar el renglón | No (cuadre) |
| H-258 | A (plaza ≠ Tijuana) | La memoria de cotización no cuadra: renglones sin factor de plaza y directo con factor (Mexicali: Σ 12,335,154 contra 13,321,966) | 1567, 1572, 1575 | Cuadre | Usar `catalogoConceptos()` | No |
| H-259 | M | Fechas no validadas (acepta 2099-12-31, 2026-13-45; la importación acepta «pendiente»); `sanearEstado` convierte EUR a MXN sin avisar. Etiqueta: un CSV sin fecha recibe la de hoy; referencia sin fuente aceptada; «con impuestos» en USD se divide entre 1.16 (IVA mexicano aplicado a fuente de EE. UU.); impuestos «no especificado» tratados como antes de impuestos. Columna «origen» vacía → «Proveedor local» (habilita la formal) | 4693, 21572-21573, 8298, 18705, 8190-8202, 18699 | Reglas a y c | Validar fecha real y no futura; exigir fuente, fecha y origen; USD con impuestos → «Por cotizar» | Sí |
| H-260 | M | Indicador «por tonelada» con base distinta según documento (1,407,200 con IVA / 1,213,104 sin IVA / 1,407,231); la base de cada porcentaje no se rotula; estado de H contradictorio (Excel «NO COTIZADO… cruce no autorizado», PDF «POR COTIZAR»); el contador no cuenta la mano de obra pendiente; `indirect: ""` genera una fórmula inválida `C12*` en el Excel con rótulo «0 %» e importe al 18 % | 6575, 8474, 5241, 6565-6569, 5752-5757, 8370, 5225 | Consistencia | Una sola base; rótulos; mismo estado; normalizar con `num()` | No |
| H-261 | B | Bajos agrupados: importación USD sin detalle; motivo de «Por cotizar» impreciso; importe ≠ cantidad × P.U. impresos (hasta 12.86); «$» en montos USD y en sumas de m³/h; «$185,027.3»; vigencia 15 contra 30 días; `cotizacionTecnica()` tira precios de tubería que promete conservar | 8299-8300, 8375, 4893, 5493, 1595/6549, 21868/21961 | — | Limpieza | No |

---

## 4. Pruebas que no prueban (resumen transversal)

- **`t()`** (pruebas.mjs:39-45) cuenta como OK todo lo que no lance error ni devuelva exactamente `false`.
- **R.1** (5891-5906) es un golden autogenerado: detecta cambios, no errores. Además:
  - Hoy consagra valores físicamente imposibles (civil: 31.11 ml de media caña) o reconocidos como no válidos por la propia suite (ventilación: GB-360 con `cubre = false`).
  - El fixture declara incendio 600 m²/6 m y ventilación 400/6/30, pero calcula con lo heredado (700 m², 4.71 m, 46 personas).
- **8.x** (562-609) sólo corre con `--base`, sólo cubre 5 motores y usa un proyecto sin cuarto limpio ni HR. Por eso el cambio de la 2.9.21 pasó sin subir versión.
- **Tautológicas** (repiten la fórmula del código):
  - 22.6 (3116-3117): ESP de ductos.
  - 22.7 (3209): potencia de bomba de incendio.
  - 3083: bomba de hidro.
  - L.1 (3770): CDT.
  - 22.4 (3020-3055): corriente de motor.
  - C.2 (3549): cotización.
  - S.32 (5586): área de diseño.
- **Tragan errores:** 1564-1570 `try { … } catch { return; }` en la revisión de términos de PDF.
- **Prometen más de lo que revisan:**
  - 15.4 (1189-1207), «espejo exacto, misma rejilla»: sólo mide bytes.
  - 15.2 (1169): `.slice(0,8)` siempre da «SECCION ».
  - 6.6 (509-513) llama a la memoria HVAC para «aire».
  - 12.2.2 (859-870) sale con `return` cuando no hay planta.
  - S.23 (5352) dice «la cotización sigue vacía», pero QUOTE.tot = 13,729.56.
- **Consagran valores incorrectos:**
  - L.2 (3793): cobre a 1.8 m.
  - P.9 (4211): ESD ↔ pintura.
  - 3.2 (358): altura promedio en incendio.
  - 22.12 (3433): cita ISO 14644-4 como fuente de ACH.
  - 3201: bomba de 2,500 L/min.
  - 3084: 2.5 HP.
  - R.9 (6093): «1.2.1 exige inoxidable».
- **Mutaciones que sobreviven al banco completo** (copias en el scratchpad):

  | Motor | Sobreviven | Ejemplos |
  |---|---|---|
  | Ventilación | 7/7 | Caudales IMC a la mitad, Vbz a la mitad, `cubre` siempre verdadero |
  | Ductos | 8/9 | Sin el +2 calibres de grasa, todo el redondo a cal 26 |
  | Soportería | 14/17 | Sin peso del agua, τcr ×10, φ 0.95 |
  | Eléctrico | 6/9 | Área THW 2 AWG, tierra de 400 A, falla ×0.5 |
  | Aire | 6/12 | Potencia específica ÷2, sin purga del desecante |

- **Sin ninguna prueba:**
  - Hidro: presión mínima, agua caliente, drenaje, dotación.
  - Eléctrico: kAIC, 240-4, caída, tierras.
  - Limpios: partidas y presión negativa.
  - Otros: constantes de NFPA, submittal, coeficientes de corrección de equipo, modos rejilla, industrial y reposición de ventilación.

## 5. No verificado (qué y por qué)

- **Carga térmica, revisión exhaustiva:** el dueño detuvo el subagente. Cubrí 3 casos (oficina a mano, psicrometría, DET por sitio) y la revisión de constantes. Quedan sin auditar a fondo:
  - envolvente y vidrio (SHGC, SOLAR, materiales);
  - barrido horario;
  - ADP y BF;
  - memoria de carga (PDF) contra cálculo;
  - espejo EN de la carga.
- **ASHRAE 2021 en línea:** el endpoint de ashrae-meteo.info devolvió HTTP 500. Sólo verifiqué la coherencia psicrométrica de los valores de Tijuana.
- **Corrección de DET (H-120):** fórmulas de Carrier Tabla 20A y CLTD de ASHRAE citadas **de memoria**. El hecho (DET idéntico en los tres sitios) sí está verificado por ejecución.
- **Normas de pago o sin texto primario:**
  - SMACNA DCS 2005/2020 (tablas de calibre, colgante par, soportes, SRM).
  - NFPA 13/20/96 (texto literal).
  - ASCE 7-16 Tabla 13.6-1.
  - ACI 318-19 Tabla 17.6.5.2.5.
  - ISO 14644-4:2022 y Tabla B.2 de la edición 2001.
  - ASTM D2846 (alcance).
  - NTC-PA (edición).
  - Tablas de fabricante de secadores, FFU, 30RB y 40VMA.

  Todo lo que depende de ellas va marcado «de memoria» o «secundaria».
- **Precios de mercado:** no hay fuente contra qué comparar semillas, exponentes ni precios unitarios.
- **Render y Excel reales:** todo se revisó en jsdom y en el XML del XLSX (store sin compresión). No se abrió en navegador ni en Excel.
- **Vigencia 2026 de NOM-001-SEDE-2012:** sólo se encontró el PROY-2018 en el DOF, sin definitiva posterior. La búsqueda no fue exhaustiva.
- **Intención del dueño** en puntos marcados «decisión del dueño»: partidas «existente», porcentajes sobre H, modo de reposición, qué norma de soportería rige.

## 6. Evidencia reproducible

Todo en el scratchpad de la sesión: `C:\Users\ASUS\AppData\Local\Temp\claude\C--Users-ASUS-Desktop-Emp-Suite\038b9a41-4e95-4d20-b48d-8ceed77f82e4\scratchpad\`.

- `arnes.mjs`: arnés jsdom de sólo lectura.
- `transversal\`:
  - `sellos.mjs`, `memoria-sin-calcular.mjs`, `integral-desact.mjs`, `sello-2920-en-head.mjs`: sellos.
  - `historia-motores.mjs`: los 18 commits.
  - `aguas-abajo.mjs`, `ver-sin-subir.mjs`: comparación entre revisiones.
  - `carga-mano.mjs`, `carga-muros-sitio.mjs`, `sitios.mjs`: carga térmica.
  - `excel-en-estado.mjs`, `excel-en-montos.mjs`: espejo EN.
  - `pruebas-sin-asercion.mjs`: barrido del banco.
- Una carpeta por motor (`clean`, `equip`, `vent`, `duct`, `elec`, `hidro`, `fuego`, `aire`, `soporte`, `estructural`, `civil`, `cotizacion`), con sus scripts, textos extraídos de PDF y Excel, y mutantes con resultados.
