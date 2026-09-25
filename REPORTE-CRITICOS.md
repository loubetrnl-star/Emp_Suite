# REPORTE-CRITICOS · rev 2.9.24 · cierre de PLAN-CRITICOS.md

Base de la auditoría: `af5894f` (AUDITORIA.md, 155 hallazgos, 44 críticos). Estado al commit `579c11e` (25-sep-2026).
Reglas: CLAUDE.md (prueba primero con el ID, un commit por hallazgo, MOTOR_VER + esperado si mueven números, nada de
memoria, nada se estima, espejo ES/EN). Bancos al cierre: `node pruebas.mjs index.html` y con `--base`, los dos en verde.

## Resumen
- **46 renglones del plan**: los 44 críticos de la auditoría (42 marcados «C», más H-227 «C si SMACNA se confirma» y
  H-254 «C con plaza ≠ Tijuana») y 2 que el plan agregó (H-107 versionado de carga, H-183 tierra a 400 A a petición del dueño).
- **Cerrados: 43.** H-224 sólo en su parte no bloqueada. **Bloqueados por texto de norma: 2** (H-168 y H-227, SMACNA),
  más el claro de CPVC de incendio de H-224 (NFPA 13). Ninguno se cerró «de memoria».
- Versiones de motor al cierre: `load: "5", clean: "3", equip: "1", duct: "4", vent: "3", quote: "24", valor: "1", kaizen: "1", elec: "8", hidro: "8", fuego: "3", aire: "5", civil: "5", soporte: "11"`.
- Detalle numérico de cada cambio: CHANGELOG-motores.md (una fila por versión) y el cuerpo de cada commit (norma con
  edición, antes → después, prueba, banco).

## Hallazgo por hallazgo
| ID | Sev. | Motor | Estado y qué cambió (antes → después, del encabezado del commit) | Commit(s) | Prueba(s) |
|---|---|---|---|---|---|
| H-107 | A | load | Cerrado: MOTOR_VER.load 2 → 3: la rev 2.9.21 cambió la lógica de carga térmica sin subir la versión | `3096e7a` | S.36 |
| H-120 | C | load | Cerrado: DET de muros y cubierta corregido por sitio (corrección CLTD); MOTOR_VER.load 3 → 4 | `20cb307` | S.20, S.36 |
| H-126 | C | clean | Cerrado: el traspaso de la reposición va por vínculo cuarto ↔ zona (id en un selector), nunca por la primera palabra del nombre; sin vínculo no | `784d503` | S.67 |
| H-127 | C | clean | Cerrado: se respeta el signo de la presión diferencial capturada (contención en negativa); piso de 5 Pa y fuga sobre /ΔP/; signo en memoria, PD | `963759e` | S.66 |
| H-128 | C | clean | Cerrado: «Crear zona de carga con este cuarto» no inventa 12 W/m² de iluminación ni 0.05 renovaciones/h: nacen en 0, pendientes de captura | `f163c3b` | S.68 |
| H-141 | C | load | Cerrado: la diversidad del edificio se aplica una sola vez, en el objetivo de planta; las ganancias internas de cada zona van al pico; MOTOR_VER | `8ff831b` | S.69 (ajustes: S.36) |
| H-142 | C | equip | Cerrado: el submittal no inventa datos del equipo: peso, dimensiones, carga de refrigerante y revisión «No declarado» salvo lo documentado (50T | `bcf248a` | S.70 |
| H-154 | C | vent | Cerrado: la cobertura real manda en la selección Greenheck; la familia sólo ordena entre los que cubren; sin modelo si nadie cubre; MOT | `eefef1e` | S.64 |
| H-155 | C | vent | Cerrado: sin medidas no hay caudal: campana sin largo o fondo y rejilla sin ancho, alto, área libre o velocidad dan demanda 0 con aviso; MOTOR_V | `b28700a` | S.65 |
| H-165 | C | duct | Cerrado: ducto de grasa por UMC 2018 §510.5: acero al carbón 16 MSG (0.060 in) o inoxidable 18 MSG (0.048 in), soldado, nunca galvanizado; sus k | `60efeec` | S.85 (ajustes: S.36) |
| H-166 | C | duct | Cerrado: un tramo sin caudal, con medida bloqueada sin capturar o sin candidato no lleva sección, kilos ni importe; MOTOR_VER.duct 1 → 2, soport | `1c00541` | S.83 (ajustes: S.36) |
| H-167 | C | duct | Cerrado: «Generar desde carga» trae sólo caudales: sin longitudes ni accesorios supuestos; tramo sin longitud = pendiente, sin kilos, juntas ni  | `24562bd` | S.84 (ajustes: S.36) |
| H-168 | C (fuente secundaria) | duct | **BLOQUEADO**: requiere SMACNA (redondo espiral). La tabla ROUND_G sigue siendo criterio de la casa, declarado; la reproducción de Pacific Duct es secundaria y sin edición | — | — |
| H-177 | C | elec | Cerrado: equipo con motocompresor por el art. 440 (conductor por la MCA, protección hasta el MOP); MOTOR_VER.elec 5 → 6 | `8b3d1e4` | S.42 (ajustes: S.41, S.36) |
| H-178 | C | elec | Cerrado: pendientes: encabezado al día (elec v8, 127 filas, 15 pruebas, 139 mutantes) — pendientes: resultado de la compuerta completa de mutantes al cierre de la Fase 2 — pruebas: cobertura del 2 AWG en canalización y del 4 AWG por ampacidad (compuerta de mutantes) — corriente de motor por la Tabla 430-250/430-248 (hp de placa o renglón inmediato superior al kW); MOTOR_VER.elec 7 → 8 | `db26c03` `03d8654` `e48d07e` `dba1b56` | S.46, S.50, S.51 (ajustes: S.36) |
| H-179 | C | elec | Cerrado: nada se supone: distancia al tablero, transformador y longitudes pendientes con aviso; MOTOR_VER.elec 6 → 7 | `feb7c5f` | S.44, S.47, S.48, S.49, S.42, S.45, S.46 (ajustes: S.41, S.36) |
| H-180 | C | elec | Cerrado: procedencia de kW y fp: estimados y de catálogo marcados, fp por carga y del alimentador capturables e impresos | `f67149c` | S.52 |
| H-181 | C | quote | Cerrado: la cotización eléctrica sigue al cálculo: alimentador por calibre (juegos × hilos × m, tierra por canalización, tubo por juego) y tabl | `803414b` | S.86 (ajustes: S.20) |
| H-183 | A | elec | Cerrado: tierra de equipos con la Tabla 250-122 de la NOM (Cu y Al, hasta 6000 A); MOTOR_VER.elec 4 → 5 | `418a962` | S.29 (ajustes: S.36) |
| H-194 | C | hidro | Cerrado: presión mínima por mueble con la Tabla 604.3 del IPC 2015 y CDT con máx(residual, mínima); MOTOR_VER.hidro 4 → 5 | `01eb454` | S.20, S.36 |
| H-195 | C | hidro | Cerrado: regadera de emergencia y lavaojos fuera de Hunter con gasto fijo (Z358.1-1990 vía OSHA); MOTOR_VER.hidro 5 → 6 | `aecd672` | S.53 (ajustes: S.36) |
| H-196 | C | quote | Cerrado: cisterna y equipo de bombeo «Por cotizar» sin precio semilla; bomba sólo si la presión no alcanza; cisterna en 0 pendiente de volumen; | `1970fdf` | S.57, S.55 (ajustes: S.20, S.18, S.35, S.39, S.41) |
| H-197 | C | hidro | Cerrado: sin pisos sin norma: días de reserva, ΔT y pendiente (mínima de IPC 2015 §704.1); MOTOR_VER.hidro 6 → 7 | `6c4aedc` | S.54 (ajustes: S.36) |
| H-198 | C | hidro | Cerrado: CPVC sólo hasta 2" CTS (renglones «SIN VERIFICAR» retirados), tramo fuera de catálogo y PEAD sin SDR como error y «Por cotizar»; MOTOR | `6fb9014` | S.55 |
| H-205 | C | fuego | Cerrado: la altura heredada es la MÁXIMA de las zonas (rociador más alto), no la media ponderada; MOTOR_VER.fuego 2 → 3 | `21e14fb` | S.58 |
| H-206 | C | quote | Cerrado: bomba contra incendio y reserva «Por cotizar» con capacidad, presión, potencia y volumen declarados (antes 385,000 MXN fijos + 9,500 M | `353608f` | S.59 (ajustes: S.20) |
| H-215 | C | aire | Cerrado: secador por ISO 7183:2007 Tabla 2 opción A1: todo el caudal del compresor a la capacidad nominal, factor 1.0; fuera de A1 la corrección | `0166709` | S.60 (ajustes: S.20) |
| H-216 | C | aire | Cerrado: el tanque pulmón no se trunca a 5,000 L en silencio: varios en paralelo, capacidad instalada ≥ teórica, aviso y memoria veraz; MOTOR_VE | `56d2a89` | S.61 |
| H-217 | C | aire | Cerrado: la curva de simultaneidad se declara «criterio de la casa sin fuente normativa» en memoria, pantalla y PDF (decisión 3 del dueño, opció | `d5a743b` | S.62 |
| H-218 | C | aire | Cerrado: diámetro interior por material: cobre con los DI de ASTM B88 (TUB_AGUA.cobre), acero con cédula 40, aluminio e inoxidable con DI del fa | `29b02a6` | S.63 |
| H-224 | C | soporte | **Cerrado en parte**: material por red; el claro de CPVC de incendio sigue BLOQUEADO (NFPA 13 T17.4.2.1(a)): la red contra incendio se soporta con su material: cobre por MSS SP-58, CPVC «pendiente de NFPA 13» (nunca como acero); parte no blo | `579c11e` | S.87 |
| H-225 | C | soporte | Cerrado: la altura de colgado se captura en pantalla; sin captura la varilla roscada queda pendiente, no se toma la altura de trabajo; MOTOR_ | `28b9af9` | S.73 (ajustes: S.20) |
| H-226 | C | soporte | Cerrado: SDS con fuente, tipo de estructura y f'c se capturan; sin ellos el anclaje se predimensiona con referencia declarada y va «Por cotiz | `5058b05` | S.74 (ajustes: S.20) |
| H-227 | C (si SMACNA se confirma) | soporte | **BLOQUEADO**: requiere SMACNA HVAC DCS Tabla 5-1 (colgantes de ducto rectangular). Propuesta: par de colgantes por soporte cuando la tabla lo pida | — | — |
| H-228 | C | soporte | Cerrado: claros del termoplástico por subtipo (IPC 2009 T308.5, secundaria) y anclas y tornillería del camino propio; PEAD sin renglón queda  | `eabc870` | S.77 |
| H-229 | C | soporte | Cerrado: claros de cobre al mínimo de MSS SP-58-2018 (PHD) e IPC 2009 T308.5 (MCP), secundarias declaradas (decisión 4); MOTOR_VER.soporte 7  | `424b51a` | S.76 |
| H-230 | C | soporte | Cerrado: el modo «valores propios» pide medidas del ducto, diámetro y material de cada tubería; sin ellos la línea queda pendiente (no se inv | `4182fb7` | S.75 |
| H-231 | C | soporte | Cerrado: con la instantánea motores>soporte aceptada las bases de equipo salen de snap.nEquip (3), no del conteo en vivo que perdía el compre | `e7e956b` | S.72 |
| H-232 | C | soporte | Cerrado: 0 meses de renta de elevación se respetan y sin captura la renta queda pendiente (no se suponen 3 meses ni el piso de 1); MOTOR_VER. | `86dfb6c` | S.71 |
| H-243 | C | civil | Cerrado: muro clasificado y media caña por cuarto limpio con su área y su altura (perímetro capturado o 3:2 declarado «estimado»); MOTOR_VER.ci | `855e53e` | S.78 (ajustes: S.20) |
| H-244 | C | civil | Cerrado: la tabiquería es un perímetro capturable por zona (sin captura, 3:2 marcado «estimado»); los muros de carga térmica ya no entran; MOTO | `745fad4` | S.79 (ajustes: S.20) |
| H-250 | C | quote | Cerrado: nada en USD sin tipo de cambio fechado, en ningún documento | `bc1a591` | S.43 |
| H-251 | C | quote | Cerrado: California es el estado: «Baja California» se rechaza como origen de una referencia | `67f39dd` | S.44 (ajustes: S.39, S.41) |
| H-252 | C | quote | Cerrado: cada precio semilla sin fuente sale en el Budget con «SEMILLA · SIN FUENTE» y bloquea la formal (opción a); MOTOR_VER.quote 19 → 20 | `fb86c51` | S.82 |
| H-253 | C | quote | Cerrado: la cotización formal no sale con referencias de mercado, mano de obra por capturar, importación sin capturar o USD sin fecha; cada blo | `e032c3b` | S.81 (ajustes: S.35) |
| H-254 | C (plaza ≠ Tijuana) | quote | Cerrado: el factor de plaza no toca la sección H ni los precios con origen declarado (tal cual); MOTOR_VER.quote 17 → 18 | `a6868e0` | S.80 |

## Comparador de 15 motores contra la base de la auditoría (`af5894f`)
Corrida: `node parches/comparador-15-motores/comparar15.mjs <index de af5894f> <index de HEAD> --sin-pdf` (56 escenarios ×
modos nativo y guardado, igualdad exacta, 63 s). Informe: `parches/comparador-15-motores/informe-2.9.24-vs-af5894f.txt`;
detalle completo: `resultado-2.9.24-vs-af5894f.json`. Sin los PDF (`--sin-pdf`): sus números salen de los mismos motores.

- **Motores que subieron de versión** (load, clean, duct, vent, quote, elec, hidro, fuego, aire, civil, soporte): difieren en
  los 56 escenarios, como corresponde (5,252 grupos de diferencias; los primeros 60 están en el informe).
- **Motores sin cambio de versión** (equip v1, valor v1, kaizen v1): difieren sólo en escenarios con datos y por lo que
  reciben de otros motores. Ejemplo: `SYS.peaks[*].profile[*].kW` de selección es idéntico al `LOADS[*].profile[*].kW`
  nuevo de carga (22.781 → 22.890 kW; H-120/H-141). La regla «un motor sólo cambia si sube su versión o la de un motor
  del que se alimenta» la hace cumplir R.3 en el banco con `--base`, sobre el proyecto fijo.
- **Ida y vuelta** (mismo archivo nuevo: escenario construido contra el proyecto guardado por la base y reabierto): el
  proyecto viejo conserva los 30 m, 150 kVA y 4 % que la base guardaba como dato, marcados «sin confirmar» (decisión de
  H-179), así que `ELEC.Lalim`, `IccTrafo` y los pendientes de la cotización difieren entre los dos modos. Es lo esperado.
- **No se hizo** la atribución renglón por renglón de los 5,252 grupos a un H-nnn: la trazabilidad por motor está en
  CHANGELOG-motores.md, en R.1 (esperado por versión) y en R.3 (contra la base).

## Pendientes que no son del plan
- **H-233** (tabla «MSS SP-58 / IMC 305.4» de acero, alto): no está en el plan; decide el dueño.
- **Textos que el dueño pasa cuando los consiga** (PLAN-CRITICOS.md §4 decisión 8): SMACNA DCS (Tablas 2-x, 5-1, redondo
  espiral) → H-168, H-227; NFPA 13 T17.4.2.1(a) → CPVC de H-224; NFPA 96 → ratificar H-165 (hoy por UMC 2018 §510.5, que
  lo extrae); Carrier Parte 1 Tabla 20A → ratificar H-120 y H-141; ANSI Z358.1 → ratificar H-195.
- **Dependencias registradas** (en parches/casos-a-mano/*.pendientes.md): Kaizen estima el cobre extra del alimentador con
  `alimM` = 1,350 MXN/m sin fuente y 30 m sin distancia capturada (H-181/H-179); eléctrico sigue listando «Bomba de agua»
  como carga aunque la presión alcance (H-196).
- **Corrección en curso fuera de este hilo**: la pantalla de Ventilación no se dibuja cuando ningún ventilador cubre el
  caudal (`viewVent` usa `R.demand` sin definir; regresión de H-154). Se abrió como tarea aparte.
