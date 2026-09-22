# Bitácora · SuiteEmp rev 2.9.20

**Fecha:** 21-sep-2026 · **Base:** rev 2.9.19 · **Regla:** todo número que se mueve lleva norma, antes/después y prueba.

## 1. Sello con versión por motor

**Decisión:** la versión del motor entra en la huella, pero por motor, no la rev de la suite. Solo sube cuando cambia la lógica de cálculo. Al abrir un proyecto afectado: aviso con qué motor cambió (vX → vY) y qué hallazgo lo movió. Nada se recalcula solo; al recalcular, la memoria muestra antes y después.

- `MOTOR_VER`: load 2 · clean 2 · equip 1 · duct 1 · vent 1 · quote 3 · valor 1 · kaizen 1 · elec 4 · hidro 4 · fuego 2 · aire 2 · civil 3 · soporte 2. La v1 es la lógica de la rev 2.9.15; cada incremento está en `MOTOR_CAMBIOS` con su rev y su hallazgo (THW-LS, THHN, compresor sin demanda, Hunter, pisos, etc.).
- El sello guarda `ver` y un `resumen` de cifras clave. `selloDe`: si la versión del sello no es la actual → «Desactualizado · el motor cambió (v1 → v4: …)». Sellos anteriores sin versión se toman como v1.
- Al abrir (proyecto guardado o respaldo) sale un aviso con la lista de motores cambiados; sustituye al aviso genérico de revisión de la suite cuando aplica. El menú marca solo las disciplinas afectadas.
- Calcular con un motor que cambió: el sello nuevo trae `previo` (versión, fecha y cifras de antes) y la memoria en PDF abre con «CAMBIO DE MOTOR vX -> vY … ANTES … DESPUÉS …».
- El saneado acepta `ver`, `resumen` y `previo` bien formados y descarta el resto.
- **Prueba:** S.36.

## 2. Control de humedad: dos casos de diseño

**Decisión:** cuartos limpios y cualquier zona con HR especificada se diseñan con enfriamiento (BS 0.4 % con BH coincidente) y deshumidificación (punto de rocío 0.4 % con su BS coincidente). La serpentín se dimensiona con el que rija en carga total y en latente; la memoria muestra ambos y cuál gobierna. Confort sin control de humedad: como hoy, con el aviso. Datos de ASHRAE Fundamentals con estación y año; sin dato → faltante, no se estima.

- **Datos** (ashrae-meteo.info, ASHRAE 2021, SI, JSON oficial, consultado 21-sep-2026): Tijuana WMO 760013 DP 0.4 % **19.2 °C / 14.2 g/kg / BS coincidente 22.8 °C**; Hermosillo 761600 25.2 / 20.9 / 29.7; Mexicali 760053 (sustituto de San Luis Río Colorado) 26.2 / 21.7 / 37.0. Rosarito toma Tijuana. **Faltantes** (sin estación ASHRAE propia): Tecate, Mexicali (fila propia con datos no ASHRAE) y Ensenada → se avisa y se pide el dato. «Personalizado» captura los tres.
- **Cómo:** `requiereHR(z)` = cuarto limpio o `hrControl = "si"` (selector nuevo en la zona). `loadOf` corre el barrido normal y otra vez con `sitioDeshum` (BS coincidente fija, razón de humedad de ASHRAE). `combinarCasos`: rige el caso de mayor carga total; si el otro da más latente, la latente sube a ese valor y el total, toneladas y SHF se recomponen. `r.casos` guarda ambos casos, cuál rige y si hubo ajuste latente; la memoria de la zona, la pantalla y el PDF lo muestran.
- **Antes → después** (Tijuana):
  - Cuarto limpio ISO 7 de 120 m² (caso de la prueba 22.12): rige deshumidificación; 6.410 → **6.417 TR**. Ahorros Kaizen por cambios de aire: ISO 5 1.021 → 1.0291 TR · ISO 6 0.492 → 0.4995 · ISO 7 0.34 → 0.3481 · ISO 8 alto 0.303 → 0.3103.
  - Proyecto lleno del comparador (con un cuarto limpio): 53.41 → **53.44 TR**; el total de la cotización no cambia (redondeo).
  - Zonas de confort: sin cambio.
- **Pruebas:** S.37 (dos casos, razón de humedad de ASHRAE, latente mayor en deshumidificación, total cubre ambos, PDF, faltante en Tecate, personalizado) y 22.12 actualizada con antes/después.

## 3. Verificación
- **Banco:** 344/344 sin `--base`; 349/349 con `--base` (inicio de la 2.9.20). Golden de S.20 sin cambio (proyecto de oficinas).
- **Comparador contra la 2.9.19** (56 escenarios × 2 modos): ningún total de cotización cambia; las toneladas suben 0.02–0.13 TR solo en escenarios con cuarto limpio; el resto de diferencias son los campos nuevos (`casos`, `deshum`, `Wfijo`, `hrControl`, `ver`/`resumen` del sello) y las líneas de memoria nuevas.

```
lleno                          TR 53.41→53.44      total =
lleno-sin-cruces               TR 53.41→53.44      total =
lleno-cruces-parciales         TR 53.41→53.44      total =
zonas-oaFixed-fluorescent      TR 56.64→56.77      total =
sys-chiller                    TR 53.41→53.44      total =
sys-vrf                        TR 53.41→53.44      total =
sys-rooftop                    TR 53.41→53.44      total =
sys-split                      TR 53.41→53.44      total =
tech-VRF                       TR 53.41→53.44      total =
tech-DX_split                  TR 53.41→53.44      total =
tech-paquete                   TR 53.41→53.44      total =
tech-chiller_fancoil           TR 53.41→53.44      total =
tech-AHU                       TR 53.41→53.44      total =
tech-PTAC                      TR 53.41→53.44      total =
zonas-materiales               TR 52.25→52.28      total =
barra-calcular-todos           TR 53.41→53.44      total =
peakScan-false                 TR 52.19→52.19      total =
bldDiv-08                      TR 46.00→46.03      total =
cotiz-USD                      TR 53.41→53.44      total =
cotiz-sin-items                TR 53.41→53.44      total =
plaza-otra-factor              TR 53.41→53.44      total =
sitio-custom                   TR 60.28→60.71      total =
cotiz-licitacion               TR 53.41→53.44      total =
ductos-accesorios              TR 53.41→53.44      total =
soporte-sismico-viga           TR 53.41→53.44      total =
soporte-sin-sismico-manual     TR 53.41→53.44      total =
soporte-losa-fc                TR 53.41→53.44      total =
civil-demolicion               TR 53.41→53.44      total =
civil-manual                   TR 53.41→53.44      total =
vent-kitchen                   TR 53.41→53.44      total =
vent-industrial                TR 53.41→53.44      total =
vent-louver                    TR 53.41→53.44      total =
vent-mua                       TR 53.41→53.44      total =
cuartos-limpios                TR 57.23→57.25      total =
instalaciones-variantes        TR 53.41→53.44      total =
propuestas-aceptadas           TR 53.41→53.44      total =
propuestas-propio              TR 53.41→53.44      total =
herencia-propio                TR 53.41→53.44      total =
valor-decisiones               TR 53.41→53.44      total =
kaizen-items                   TR 53.41→53.44      total =
unidades-IP                    TR 53.41→53.44      total =
```

## 4. Pendiente
1. Punto de rocío 0.4 % para Tecate, Ensenada y la fila propia de Mexicali (sin estación ASHRAE): pedir el dato.
2. Precios de tubería hidráulica por diámetro.
