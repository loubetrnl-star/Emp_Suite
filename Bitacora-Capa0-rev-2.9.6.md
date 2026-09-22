# Bitácora · Capa 0 · SuiteEmp rev 2.9.5 → 2.9.6

14-sep-2026. Respaldo previo: `respaldo-rev-2.9.5/index-2.9.5-antes-de-capa0-20260914-110607.html` (sha256 60e17679…) y su `pruebas.mjs`.
Parches y casos numéricos de cada corrección: `respaldo-rev-2.9.5/capa0-parches/` (cada caso se corre con `node <caso>.mjs <archivo.html>`).
Banco inicial: 206 de 206. Banco final: **222 de 222** (16 comprobaciones nuevas, sección 22; ninguna existente modificada).

## 1. Correcciones

Una a la vez, en el orden indicado. En cada una: foto previa, caso numérico antes/después, banco completo; reversión si algo que pasaba dejaba de pasar.

| # | Defecto | Antes | Después | Dónde | Banco |
|---|---|---|---|---|---|
| 1.1 | Licitación con 0 % de indirectos y utilidad | $1,000,000 → $1,022,105; PDF con 0 y 0 | $1,350,813.97; PDF con 18 y 12; campos «Indirectos %» y «Utilidad %» editables | QUOTE_SEED (indirectPct 18, profitPct 12), estructuraSobrecosto, tarjeta de licitación | 207/207 ✔ |
| 1.2 | Dos precios por concepto en licitación | Tarjeta imprime «precio unitario integrado» distinto del importe | **Parcial:** el contraste se rotula a costo directo y dice que el importe se integra con el precio del catálogo; los conceptos sin tarjeta llevan P.U. integrado. Sigue habiendo dos números hasta que elijas cuál se oferta | buildLicitacionPdf | 208/208 ✔ |
| 1.3 | Excel sin financiamiento | Libro − pantalla = −263,502.71 | Renglón de financiamiento; libro = cascada (diferencia 0); residual de 270.68 contra pantalla por redondeo del P.U. | buildPropuestaXlsx (resumen) | 209/209 ✔ |
| 2.1 | Alimentador con 125 % dos veces | Idis 195.86 A, 3/0, principal 200 A | **Parcial:** se calcula la corriente de diseño correcta (163.25 A, daría 2/0) pero **no se conecta** al conductor: con el principal en 200 A quedaría desprotegido (240-4). Conductor y principal cambian juntos cuando decidas el criterio | computeElec (ELEC.IdisAlim), selConductor acepta Idis | 210/210 ✔ |
| 2.2 | Carga dinámica con altura doble | 32.14 m · 3 HP · partida $100,500 | 26.14 m · 2.5 HP · $93,250 | computeHidro (cdt = altura edificio + fricción + residual) | 211/211 ✔ |
| 2.3 | Presión de ductos suma paralelos | 106.1 Pa rotulado como recorrido crítico | **Alcance limitado:** los tramos no traen conexión; la cifra no cambia (106.1 Pa) y ahora se declara «suma de tramos, cota superior del recorrido crítico de los tramos capturados». En el caso, el recorrido real sería 48.5 Pa (+118.6 %) | textos de vista, memoria, selección y validación | 212/212 ✔ |
| 2.4 | Bomba contra incendio topada en silencio | Extra 1: 5,162 → 5,000 L/min, 0 avisos | **Parcial:** aviso crítico en motor, memoria, PDF, pantalla y semáforo; con red municipal el texto ya no habla de partida ni de «0 HP». La capacidad sigue en 5,000 hasta que decidas | computeFuego | 213/213 y 221/221 ✔ |
| 2.5 | Cobre soportado como acero | Cobre/CPVC/PEAD: esp. 3.0/2.7 m, 18 soportes | Cobre: 2.4/2.4 m, 21 soportes (+$2,937.79 en el caso); termoplásticos con su tabla; la tarjeta de soportería desactualizada nombra el material | computeSoporte, snapshotSoporte, resumenSnapSoporte | 214/214 y 222/222 ✔ |
| 3.1 | Hoja URS con veredictos fijos | Siempre «ISO 8»; cascada, renovaciones y NFPA 13 con «SI» | Clase real (ISO 5, ISO 7…) con su rango; cascada, clasificación y NFPA 13 dicen **NO EVALUADO** (ES y EN) con nota al pie | buildPropuestaXlsx, hoja CUMPLIMIENTO_URS | 215/215 y 220/220 ✔ |
| 3.2 | Memoria HVAC con 35/24 °C | Mexicali y personalizado: 35/24 | Mexicali 46/23; personalizado 42/26 (memoria suelta e integral) | buildMemoriaPdf | 216/216 ✔ |
| 3.3 | 50 m hidráulicos «de los tramos calculados» | «(50 m de los tramos calculados)» | «(50 m supuestos: sin longitudes capturadas en los tramos; ratificar con levantamiento)»; cantidad sin cambio | computeQuote | 217/217 ✔ |
| 3.4 | Kaizen con 15 renovaciones en cuarto limpio | ISO 5/6/7 proponen 15 y citan ISO 8 | ISO 5 → 240, ISO 6 → 90, ISO 7 → 30 (mínimo de su clase); **ISO 8 sigue en 15** hasta que decidas | computeKaizen | 218/218 ✔ |
| 4.1 | Respaldo viejo pierde cuarto limpio | Cuarto capturado de 120 m² abre con 60 m² por omisión | Abre con 120 m², ISO 6, «Sala de llenado» | sanearEstado (migra antes de sanear) | 219/219 ✔ |
| 4.2 | Equipos de archivos sin destino | 2 equipos «aplicados» que nadie lee | **Revertido:** la corrección (mostrarlos solo como referencia) funcionó, pero hace fallar la comprobación existente 17.28, que exige que «UMA-01» salga marcada como equipo | cxPropuestasPara/cxAplicar | revertido, 219/219 |

## 2. Defectos no corregidos o corregidos solo en parte

- **4.2 · revertido.** Motivo: la comprobación 17.28 fija la promesa que se retira. Si autorizas reescribirla (UMA-01 como información, sin marcar ni aplicar), el parche `4.2.patch` se reaplica tal cual.
- **2.3 · alcance limitado.** El recorrido crítico exige topología de red (padre por tramo). Pasa a la capa de motores. Mientras tanto la cifra es una suma y se declara así; en el caso se desvía +118.6 %.
- **1.2, 2.1, 2.4, 3.4 · parciales.** Se aplicó solo lo que no exige criterio; el resto espera las decisiones de abajo.

## 3. Decisiones de criterio que necesito

1. **1.2 · Qué P.U. se oferta en licitación** para conceptos con tarjeta: (A) el del catálogo, con la tarjeta cuadrada por un renglón de ajuste; (B) el de la tarjeta, solo en el PDF de licitación (importe 7,791,250.21); (C) el de la tarjeta en todo el sistema; (D) catálogo, con aviso de «no presentable» si la tarjeta difiere más de X %.
2. **1.1 · Proyectos cuya cotización privada ya no está en 18/12.** Hoy la licitación arranca en 18/12 fijos (opción A, lectura literal). Alternativas: (C) copiar una vez los % de la privada al abrir; (B) seguir a la privada hasta que se capture.
3. **2.1 · Interruptor principal de tablero con motores:** (A) mínimo 215-3 = protección del alimentador (175 A en el caso; 100 A en el escenario del banco, por debajo del ramal del motor mayor de 110 A); (B) máximo 430-62 (225 A); (C) el mayor entre la protección del alimentador y la del ramal del motor mayor, sin pasar el tope de B (175 A en el caso). Con la respuesta se conectan conductor y principal a la vez.
4. **2.2 · Qué altura estática manda** cuando la altura del edificio no coincide con la suma de alturas de los tramos: (a) la mayor de las dos; (b) la del edificio, con aviso si difieren más de 0.5 m; (c) la de los tramos.
5. **2.4 · Capacidad de bomba sobre 5,000 L/min:** (A) dejar 5,000 con aviso; (B) tamaños nominales NFPA 20 (siguiente ≥ demanda; extra 1 → 1,500 gpm = 5,678 L/min); (C) bombas en paralelo; (D) demanda redondeada «fuera de lista». Y si con red municipal el aviso debe ser crítico o advertencia.
6. **2.5 · Tablas de espaciamiento de cobre y termoplástico.** La revisión encontró que en diámetros chicos dan más distancia que MSS SP-58 tabla 3 / IPC 308.5 (cobre ¾" 1.5 m, 1¼" 2.1 m; CPVC ≤1" 0.9 m). Son constantes de norma: ¿las ajusto? Y los proyectos guardados con la soportería aceptada conservan el cálculo de acero hasta pulsar «Actualizar»: ¿los marco como pendientes de revisión al abrir?
7. **3.1 · Hoja URS:** NFPA 13 → (a) SI/REVISAR según el semáforo de incendio, (b) siempre NO EVALUADO (hoy), (c) REVISAR o NO EVALUADO, nunca SI. Renovaciones → (a) mínimo de la clase (Sala fuera de rango = REVISAR), (b) si hay cambios de aire fijados por URS, manda el URS, (c) capturar un mínimo URS aparte.
8. **3.4 · Piso de Kaizen en ISO 8:** 15 1/h (mínimo URS típico, hoy) o 10 1/h (tabla de la clase).
9. **4.2 · Autorizar reescribir la comprobación 17.28** para retirar la promesa de los equipos leídos de archivos.

## 4. Confirmación de que nada más cambió

- Comparación de **137 estados** (96 aleatorios con semilla fija + 41 bordes: todos los sitios, modos de ventilación, riesgos, materiales, respaldos viejos, lotes con equipos) entre la 2.9.5 original y la 2.9.6, recorriendo todas las salidas de los 15 motores globales: **181 rutas distintas, todas atribuibles a una corrección de la lista; 0 inesperadas.**
- Sin ningún cambio: **carga térmica, ventilación, ductos, selección de equipo y aire comprimido.**
- Tras los tres ajustes finales se repitió la comparación contra el resultado previo: solo cambian textos de aviso de contra incendio con red municipal y lo que de ahí citan validación, Kaizen e ingeniería de valor; ningún número.
- selfCheck idéntico a la original; 0 errores de ventana en ambas versiones.
- No se corrigieron ni se tocaron los defectos «reportados sin reproducir» del anexo de la auditoría.
