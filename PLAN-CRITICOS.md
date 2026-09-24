# PLAN-CRITICOS · corrección de los 44 críticos de AUDITORIA.md

Base: `af5894f` (AUDITORIA.md commiteada sobre c83ecba, tag rev-2.9.23-candidata-4). Banco 351/351 y 356/356 con base.
Estado: **borrador para aprobación del dueño**. No se ha tocado código.

## 0. Lo que leí y lo que falta
- Leídos: AUDITORIA.md, PLAN.md, CHANGELOG-motores.md, Bitácoras 2.9.18 → 2.9.23, PROMPT-MAESTRO-EMP-B12.md.
- **CLAUDE.md no existe** (ni en el repo ni en `~/.claude`). Propongo crearlo en la Fase 0 con las reglas de esta sesión (prueba primero, un commit por hallazgo, MOTOR_VER si mueve números, banco en verde, nada de memoria), para que los subagentes las hereden.
- Identidad git: el repo no tenía `user.name/email`; fijé la misma de los 18 commits anteriores (`EMP Suite <suite@emdelpacifico.local>`), sólo local.

## 1. Reglas de la sesión (las tuyas, operativas)
1. **Prueba primero.** Cada hallazgo empieza con una prueba que falla en `af5894f`; se corrige; pasa. La prueba lleva el ID en el nombre.
2. **Un commit por hallazgo:** `H-nnn · motor · qué · norma (edición) · antes → después`.
3. **Si mueve números, sube `MOTOR_VER` del motor** y su hallazgo entra a `MOTOR_CAMBIOS`, `CHANGELOG-motores.md` y al esperado de regresión (regenerado en el mismo commit).
4. **Banco completo en verde después de cada commit** (`node pruebas.mjs index.html` y con `--base`). Con rojo no se avanza.
5. **Nada de memoria.** Si la norma no está en texto: prueba + corrección propuesta, estado `BLOQUEADO: requiere texto de norma`, y sigue.
6. **Falsos positivos:** se retiran con evidencia (renglón y página) y quedan en la bitácora, no se «corrigen».
7. **Textos disponibles** (en el scratchpad de la auditoría, se copian a `parches/normas-texto/` como evidencia):
   - NOM-001-SEDE-2012 completa (DOF), con paginación.
   - ISO 7183:2007, ISO 8573-1:2010, ISO 1217:2009 (muestras oficiales: tablas de referencia).
   - EU GMP Anexo 1 (2022) completo. ISO 14644-4:2022 sólo prólogo e índice.
   - ASHRAE 62.1-2016 Tabla 6.2.2.1 (Addendum s) y 62.1-2022 Addendum b.
   - IPC 2015/2024 por up.codes (en línea, público): E103.3, 604.3, 704.1, 709.1, 710.1, 906.2.
   - NTC-PA (dotaciones). Carrier 50TC Product Data. Coeficientes de accesorios ASHRAE.
   - ASHRAE Fundamentals 1997 cap. 28, fórmula de corrección CLTD (reproducción secundaria, curso CED).
   - MSS SP-58 y IPC 308.5 (reproducciones de fabricante PHD y MCP: secundarias, tablas completas).
   - **No en texto:** SMACNA, NFPA 13/20/96, ASCE 7, ACI 318, ANSI Z358.1 (sólo carta OSHA), Carrier Tabla 20A.

## 2. Orden de ataque

### Fase 0 · no mueven números (secuencial, yo)
| # | ID | Motor | Qué | Norma / regla | Texto | Prueba |
|---|---|---|---|---|---|---|
| 0.1 | H-107 | load | `MOTOR_VER.load` 2 → 3 con hallazgo «rev 2.9.21: aire exterior dedicado + serpentín seco, infiltración 0». Esperado de load regenerado | Regla 2.9.20 | n/a | R.3 nueva: con `--base`, `cifrasMotor` de cada motor debe ser igual a la base **salvo** motores cuya versión subió; truena si cambian cifras con la misma versión (hoy R.1 sólo compara contra el esperado, que se regenera a mano) |
| 0.2 | H-250 | quote | Nada en USD sin `fxVigente()`: propuesta PDF/XLSX, memoria de cotización, cotización por disciplina, licitación, pantalla. Sin fecha: el documento USD no se emite (aviso) y la pantalla muestra MXN con «tipo de cambio sin fecha» | Regla c (22-sep) | n/a | Sin fecha: `buildPropuestaPdf({mon:"USD"})` lanza / `emitirPropuestaPdfEspejo` sólo entrega ES-MXN; ningún texto «US$» en documento alguno; con fecha: idénticos a hoy |
| 0.3 | H-251 | quote | California = estado. Campo normalizado `estado` en el renglón de referencia y en el CSV; se acepta sólo `California`/`CA` como estado de EE. UU.; se rechaza `Baja California`, `Baja California Sur`, `BC`, `BCS`, `México`; `sanearEstado` retira lo que no cumpla con log | Reglas a y b | n/a | «Tijuana, Baja California» → Por cotizar y retirada; «Carlsbad, California» y «San Diego, CA» → aceptadas; CSV igual |
| 0.4 | — | repo | CLAUDE.md con las reglas; `parches/normas-texto/` con los textos usados | — | — | — |

### Fase 1 · pruebas que vigilan números, por disciplina (paralelo, un subagente por motor, antes de tocar lógica)
- `parches/casos-a-mano/<motor>.csv`: hoja de cálculo en el repo, legible en Excel. Columnas: caso, entradas, fórmula, fuente (norma, edición, tabla o «criterio de la casa»), valor esperado, tolerancia, quién lo calculó. Los valores se calculan **fuera** de la suite (script propio o a mano); ningún valor sale de `cifrasMotor`.
- `pruebas.mjs`: bloque `/* ===== CM.<motor> ===== */` por motor (marcadores fijos para que las ramas no choquen) que carga el CSV y compara con tolerancia.
- `parches/mutantes/mutantes.mjs`: lista de mutaciones por motor (las de la auditoría) aplicadas a copias en temporal; **compuerta:** cada mutante debe hacer fallar el banco. Se corre antes de cerrar cada disciplina.
- Cobertura mínima por motor: los casos de la auditoría más un caso por cada crítico de la Fase 2 (el que va a fallar).

### Fase 2 · críticos que mueven números · MEP (paralelo por disciplina, en worktrees; yo integro en serie con banco tras cada commit)
Orden de integración: elec → hidro → fuego → aire → duct → vent → clean → equip → load → soporte. Después civil. Cotización al final (sus reglas dependen de las decisiones de precios).

#### Carga térmica (`load`, v3 tras H-107 → v4)
| ID | Qué mueve | Norma | Texto | Tratamiento |
|---|---|---|---|---|
| H-120 | Carga por muros y cubierta en sitios ≠ 35/24 °C (Mexicali +54 % muro N; Tijuana +0.3 K) | ASHRAE Fundamentals 1997 cap. 28: CLTDc = CLTD + (25.5 − tr) + (tm − 29.4), tm = to − DR/2. Carrier Parte 1 Tabla 20A: equivalente | Fórmula ASHRAE en reproducción secundaria; Tabla 20A **de memoria** | Corregir el DET con la fórmula ASHRAE (declarada en memoria). Queda abierta la ratificación contra Tabla 20A: **te pido el Manual Carrier** |

#### Cuartos limpios (`clean`, v2 → v3)
| ID | Qué mueve | Norma | Texto | Tratamiento |
|---|---|---|---|---|
| H-126 | Aire exterior de la zona equivocada → carga y equipo | Integridad | n/a | Vínculo por id cuarto ↔ zona (selector); ambiguo = no traspasa. Acción de captura: no sube versión |
| H-127 | Fuga y reposición con el signo capturado; en negativa entra aire y no se presuriza | GMP Anexo 1 (2022) §4.14; piso 5 Pa como recomendación (14644-4:2001 A.5.3, secundaria) | Anexo 1: sí | Respetar el signo; piso sobre |ΔP|; aviso en PDF y Excel (arrastra H-132) |
| H-128 | Carga de la zona creada desde el cuarto | «Nada se estima» | n/a | `lights` 0, `ach` 0; el semáforo los pide. Acción: no sube versión |

#### Selección (`equip`, v1 → v2)
| ID | Qué mueve | Norma | Texto | Tratamiento |
|---|---|---|---|---|
| H-141 | Planta objetivo con `bldDiv` < 1 (0.8: ×0.713 → ×0.891) | Carrier/HAP: la diversidad del edificio se aplica una vez | De memoria (principio) | **Decisión:** aplicarla sólo en el bloque (quitar `userDiv` de la planta) y alinear el panel por familia. Propongo esa opción |
| H-142 | Valores del submittal (peso, refrigerante, rev, CFM/ESP de chiller, AHRI) | Form 50TC-7-16-03PD (datos físicos) | 50TC sí; otras líneas no | Sólo lo que tenga documento; lo demás «no declarado». Documento: no sube versión |

#### Ventilación (`vent`, v1 → v2)
| ID | Qué mueve | Norma | Texto | Tratamiento |
|---|---|---|---|---|
| H-154 | Modelo elegido (GB-360 → CSW-30) y su carga eléctrica | Lógica | n/a | Filtrar por cobertura real (arrastra H-156: margen 10 % sin tolerancia 0.9); sin modelo si nadie cubre |
| H-155 | Partidas de cocina sin medidas y rejilla sin área libre | Política 2.9.16 | n/a | Demanda 0 si falta una medida; área libre y velocidad obligatorias |

#### Ductos (`duct`, v1 → v2)
| ID | Qué mueve | Norma | Texto | Tratamiento |
|---|---|---|---|---|
| H-165 | Calibre, junta y kg del ducto de grasa | NFPA 96 (0.054 in acero / 0.043 in inox, soldadura continua hermética); UMC 2018 §510.5.1 dice 0.060 / 0.048 | **NFPA 96 no** (resumen Aerovent); UMC en línea | **BLOQUEADO**: prueba y corrección propuesta (16 MSG acero / 18 inox, soldado, sin «galvanizado»). Si aceptas UMC 2018 como texto, se cierra con UMC |
| H-166 | Cédula, kg e importe de tramos sin candidato, bloqueados o sin caudal | — | n/a | Error visible; sección vacía; fuera de kg y cotización |
| H-167 | kg, Pa e importe de la generación desde carga (20/10/15 m, codos) | Tu regla: sin longitud, «pendiente de longitud» | n/a | Longitud 0 = pendiente; sin accesorios supuestos |
| H-168 | kg del redondo (×1.23–1.87) | SMACNA redondo espiral | **SMACNA no** (Pacific Duct) | **BLOQUEADO**: prueba y tabla propuesta |

#### Eléctrico (`elec`, v4 → v5)
| ID | Qué mueve | Norma | Texto | Tratamiento |
|---|---|---|---|---|
| H-177 | Protección de equipos con motocompresor (150 → 90 A; 25 → 15 A) | NOM 440-22(a), 440-32 (p. 449) | Sí | Art. 440 con MCA/MOP de placa; tope MOP |
| H-178 | Corriente, conductor y protección de motores (11 kW: 8 → 6 AWG) | NOM 430-6(a)(1), Tabla 430-250 (p. 405, 442) | Sí | **Decisión:** el kW capturado del motor se toma como potencia en el eje → hp normalizado a la tabla. Si el dueño prefiere campo `hp`, se agrega |
| H-179 | Caída, kAIC e importe con 30 m / 150 kVA / 4 % / offsets no capturados | Arranque en ceros | n/a | Vacíos y pendientes; memoria imprime L por carga |
| H-180 | Trazabilidad de kWe y fp (estimados como dato) | Trazabilidad | n/a | Marca «estimado» en memoria; campo fp editable |
| H-181 | Importe del alimentador y tablero (juegos × conductores × m por calibre; tablero por capacidad) | Regla de precios | n/a | Cantidades correctas ya; precio por calibre/capacidad **«Por cotizar»** hasta fuente (ver H-252) |
| H-183 (alta, pedido tuyo) | Tierra a 400 A | NOM Tabla 250-122 (p. 151): 300 A → 4 AWG; **400 A → 33.60 mm² (2 AWG)**; 500 A → 2 AWG; 2500 → 350; 3000 → 400; 4000 → 500; 5000 → 700. Columna de aluminio presente | Sí | **No es falso positivo**: la NOM difiere del NEC en 400 A. Corregir el renglón, agregar 2500–5000 A y la columna de aluminio |

#### Hidrosanitario (`hidro`, v4 → v5)
| ID | Qué mueve | Norma | Texto | Tratamiento |
|---|---|---|---|---|
| H-194 | CDT y bomba (19.95 → 29.56 m) | IPC 2015/2024 Tabla 604.3 | up.codes | Presión mínima por mueble de la tabla; CDT con máx(residual, mínima) |
| H-195 | Demanda: regadera 75.7 L/min × 15 min fuera de Hunter; lavaojos 1.5 L/min; agua tibia | ANSI/ISEA Z358.1-2014 | **Secundaria** (carta OSHA 2002 + resumen) | Corregir como ordenaste, valores marcados «Z358.1 vía OSHA»; te pido ratificar con el texto |
| H-196 | Importe de cisterna y bomba; bomba sólo si hace falta | Regla de precios | n/a | «Por cotizar»; bomba sólo con `presOk` falso; nunca «cisterna de 0 m³» |
| H-197 | Cisterna, calentador, pendiente (0 días = 3 m³) | IPC 704.1 (¼"/ft ≤ 2½", ⅛"/ft ≥ 3") | up.codes | Respetar captura; pendiente mínima de norma con aviso; ΔT 0 = pendiente |
| H-198 | Diámetros CPVC 2½–4" «sin verificar» y PEAD sin SDR | ASTM D2846 (CTS hasta 2") | De memoria | Retirar renglones no verificados → error y «Por cotizar»; PEAD «pendiente de SDR/fuente». No requiere norma: se retira lo no verificado |

#### Contra incendio (`fuego`, v2 → v3)
| ID | Qué mueve | Norma | Texto | Tratamiento |
|---|---|---|---|---|
| H-205 | CDT y bomba (+1.29 m regresión; hasta +9.1 m) | Tu regla: rociador más alto y área más remota | n/a (geometría) | Heredar altura máxima de zonas; campo «elevación del rociador más alto»; aviso rack con la máxima |
| H-206 | Importe de la bomba (fijo 385,000) | Regla de precios | n/a | «Por cotizar» con capacidad y potencia declaradas (ver H-252) |

#### Aire comprimido (`aire`, v2 → v3)
| ID | Qué mueve | Norma | Texto | Tratamiento |
|---|---|---|---|---|
| H-215 | Secador (2.46 → 2.02 m³/min) e importe E103 | ISO 7183:2007 Tabla 2 opción A1 | Sí (muestra) | Factor 1.0 en A1; fuera de A1 «pendiente de tabla del fabricante»; dimensionar con el caudal del compresor |
| H-216 | Tanque (13,103 → 5,000 L sin aviso) | Fórmula del receptor (guía de fabricante) | Secundaria | Varios tanques o mayor; aviso; memoria veraz |
| H-217 | Compresor, tanque e importe (1,530 contra 700 L/min) | Curva de simultaneidad sin fuente | No | **Decisión:** (a) declararla «criterio de la casa» en memoria y pantalla sin mover números, o (b) sustituirla por Σ consumo × uso con simultaneidad capturable. Propongo (a) ahora y (b) si lo autorizas |
| H-218 | Diámetro y ΔP en cobre (1" → 1¼") | ASTM B88 tipo L (DI públicos) | Sí | DI por material (reusar `TUB_AGUA.cobre`); aluminio/inox «pendiente de DI del fabricante» |

#### Soportería (`soporte`, v2 → v3)
| ID | Qué mueve | Norma | Texto | Tratamiento |
|---|---|---|---|---|
| H-224 | Soportes de la red de incendio en CPVC/cobre | NFPA 13 Tabla 17.4.2.1(a) | **No** (NYC 1 RCNY §29-09 reproduce CPVC) | Pasar el material (sin norma); cobre por MSS; **CPVC de incendio BLOQUEADO** → «pendiente de tabla NFPA 13», nunca como acero |
| H-225 | ML de varilla e importe (633.6 → según captura) | Nada se estima | n/a | Campo «altura de colgado» visible; sin captura → pendiente |
| H-226 | Anclaje (M10 ↔ M12/M16) | ASCE 7-16 §13.3.1; ACI 318-19 cap. 17 | **No** | Sólo captura y declaración: SDS/estructura/f'c con fuente; sin captura → anclaje «Por cotizar»; Fp/ap/Rp impresos. No cambia fórmulas (no requiere texto) |
| H-227 | Varillas/anclas del ducto rectangular | SMACNA DCS Tabla 5-1 | **No** | **BLOQUEADO**: prueba y propuesta (par de colgantes) |
| H-228 | Anclas y tuercas del termoplástico; claros CPVC ≥ 1¼" (1.22 m) y PP ≤ 1" (0.81 m) | IPC 2009 Tabla 308.5 | Secundaria completa (MCP) | Corregir |
| H-229 | Claros de cobre ½–¾" (1.5 m) y 2½" (2.7 m) | ANSI/MSS SP-58 (Tabla PHD 2018) | Secundaria completa | Corregir y reescribir L.2. **Decisión** (H-239): qué norma rige la soportería de plomería: MSS SP-58, IPC 308.5 o el mínimo de ambas. Propongo el mínimo |
| H-230 | Diámetros del modo «valores propios» | Nada se estima | n/a | Pedir diámetro y material; sin ellos, pendiente |
| H-231 | Bases de equipo al aceptar la instantánea (3 → 2) | — | n/a | Usar `snap.nEquip` |
| H-232 | Renta de elevación (0 → 1 mes; 3 por omisión) | Política de pisos | n/a | Respetar 0; omisión = pendiente |

### Fase 3 · civil (`civil`, v3 → v4)
| ID | Qué mueve | Norma | Texto | Tratamiento |
|---|---|---|---|---|
| H-243 | Media caña y muro clasificado (+147,229.88 MXN en la regresión) | Regla del motor (media caña doble por metro de muro); cota isoperimétrica | n/a | Por cuarto limpio con su área y altura (3:2 declarado o perímetro capturado) |
| H-244 | Muro civil no monótono (−400,446 MXN al capturar un muro exterior) | — | n/a | **Decisión:** perímetro de tabiquería capturable por zona; sin captura, 3:2 declarado «estimado» en la partida. Propongo esa regla |

### Fase 4 · cotización (`quote`, v6 → v7)
| ID | Qué mueve | Norma | Texto | Tratamiento |
|---|---|---|---|---|
| H-252 | El 99.93 % del directo (precios semilla A–G sin fuente) | PLAN.md §1 «nunca estimar» | n/a | **Decisión (la más grande):** (a) interino: cada precio semilla se etiqueta «SEMILLA · SIN FUENTE» en Budget y bloquea la formal; (b) todo «Por cotizar» hasta cargar Craftsman (el Budget queda vacío). Propongo (a) ahora; (b) al cargar Craftsman |
| H-253 | Bloqueo de la formal con referencias, MO pendiente, H pendiente o USD sin fecha | Regla e | n/a | Corregir |
| H-254 | Factor de plaza sobre H e importes capturados/referencias | Regla d «tal cual» | n/a | Excluir H y referencias del factor |

## 3. Bloqueados desde ya (prueba + propuesta, sin cerrar)
H-165 (NFPA 96), H-168 (SMACNA), H-224 parcial (NFPA 13 CPVC), H-227 (SMACNA). Parciales pendientes de ratificación: H-120 (Carrier Tabla 20A), H-195 (texto Z358.1).

## 4. Decisiones del dueño (22-sep-2026, 04:40 Tijuana) · rigen la Fase 2
1. **H-141** · opción (a): la diversidad del edificio sólo al bloque de planta; zonas y terminales al pico sin diversidad. Marcar «criterio Carrier, ratificar con texto» hasta recibir la Parte 1.
2. **H-178** · (ratificado 23-sep-2026: lectura literal, 15 kW → 25 hp; el kW se compara con la columna kW de la propia Tabla 430-250) campo `hp` de placa por carga, y manda si se captura (revisión adversarial, 23-sep-2026: el hp de catálogo de la casa o el que estima otro motor no es de placa; criterio de la casa, como la MCA estimada de H-177: sólo puede subir el renglón que da el kW, nunca bajarlo). Si sólo hay kW, se toma como potencia en el eje y se redondea al hp normalizado inmediato **superior** (nunca al más cercano); la memoria dice «hp inferido de kW». La corriente siempre sale de la Tabla 430-250.
3. **H-217** · opción (a): la curva de simultaneidad queda como «criterio de la casa», declarada en pantalla y memoria, sin mover números.
4. **H-229/H-239** · el mínimo de MSS SP-58 e IPC 308.5 por material y diámetro; se usa y declara la edición más reciente disponible en texto (MSS SP-58-2018 vía PHD, IPC 2009 vía MCP: secundarias); se ratifica con el texto.
5. **H-244** · opción (a): lo capturado manda; sin captura, 3:2 marcado «estimado» en la partida. Los muros de carga térmica no son tabiquería.
6. **H-252** · opción (a): «SEMILLA · SIN FUENTE» en el Budget y la formal bloqueada. Los precios capturados de proveedor por el dueño son válidos con su etiqueta. Al cargar Craftsman pasa a (b) automático.
7. **H-165** · opción (b) con UMC: cita textual de la sección y los espesores tal como vienen en up.codes. Referencia del dueño para NFPA 96: acero No. 16 MSG (~0.054 in) o inoxidable No. 18 MSG (~0.043 in) con soldadura continua hermética; si el UMC dice otra cosa, se usa el más exigente y se documentan ambos. Queda anotado «ratificar con NFPA 96».
8. **Textos pendientes** (los pasa el dueño conforme los consiga): SMACNA DCS (Tablas 2-x, 5-1, redondo espiral) → H-168, H-227; NFPA 13 (Tabla 17.4.2.1(a), cap. 18) → H-224; NFPA 96 → ratificar H-165; Carrier Parte 1 Tabla 20A → ratificar H-120 y H-141; ANSI Z358.1 → ratificar H-195. Mientras, esos hallazgos siguen BLOQUEADOS.

## 4b. Reglas de la Fase 1 (dueño, 22-sep-2026)
- Casos a mano independientes por motor, con su hoja en el repo; la prueba compara números con tolerancia, no textos.
- Compuerta de mutantes por motor: ninguna disciplina se da por cubierta con mutantes vivos en lógica de cálculo. Ventilación y soportería primero.
- Las pruebas que hoy protegen valores equivocados se marcan; no se «arreglan» (eso es Fase 2 con su hallazgo).
- `--amend` sólo en commits locales sin tag; nunca en algo con tag.
- Estado 22-sep 04:45: infraestructura commiteada (`3ec7cc7`); los 12 subagentes cayeron por límite de la API antes de escribir nada (se restablece 06:50 Tijuana). Al reanudar se relanzan TODOS desde cero en worktrees nuevos (prompts en `parches/fase1/PROMPTS-FASE1.md`); no se integran ramas a medias.

## 5. Mecánica de trabajo
- Fase 0 y CLAUDE.md: yo, en `master`.
- Fases 1–2: un subagente por motor en `git worktree` (rama `crit/<motor>`), sólo su bloque `CM.<motor>` de pruebas, su región del motor y su CSV. Yo integro en serie por `rebase`, corro el banco y el comparador tras cada commit, y rechazo lo que no cumpla la regla 1–4.
- Si dos motores chocan (por ejemplo elec ↔ fuego por la bomba, o load ↔ equip), esa disciplina se saca del paralelo y se cierra sola, en serie, como pediste.
- Cierre: comparador de 15 motores contra `af5894f` (toda diferencia numérica debe corresponder a un H-nnn con versión subida), tag `rev-2.9.24-candidata` (los anteriores no se mueven), instalador `SuiteEmp-2.9.24-instalador.zip`, `REPORTE-CRITICOS.md` con los 44 (estado, commit, prueba, antes/después) y bitácora.

## 6. Versiones esperadas al cierre
load 4 · clean 3 · equip 2 · vent 2 · duct 2 · elec 5 · hidro 5 · fuego 3 · aire 3 · soporte 3 · civil 4 · quote 7 · kaizen 1 · valor 1.
