# Bitácora · SuiteEmp rev 2.9.21 y 2.9.22

**Fecha:** 21-sep-2026 · **Base:** rev 2.9.20 · **Regla:** todo número que se mueve lleva norma, antes/después y prueba; pruebas en verde antes de entregar. Desde esta revisión el proyecto vive en un repositorio git (`Emp_Suite/.git`) con **un commit por cambio** y el hallazgo en el mensaje; los respaldos y el instalador quedan fuera del repositorio.

## Commits (git log)
1. `7d7c2d0` Base rev 2.9.20.
2. `d3da45c` **Humedad (c)** · rev 2.9.21.
3. `24bc374` **Datos climáticos** · rev 2.9.22.
4. `a5f2ef9` **Tubería hidráulica** (PP-R, CSV, validación) · rev 2.9.22.
5. `9bc43c3` **Pruebas de regresión por motor** y «abrir nunca recalcula solo».
6. `c39b9f1` **Arranque en vacío** (instalación limpia).
7. `93bf2ec` **CHANGELOG por motor**.

## 1. Humedad (c) · rev 2.9.21
Cuarto ISO 7 de referencia (120 m² × 3 m, 45 cambios/h, 2 personas, Tijuana):
- Infiltración 0 en presión positiva (selector «Presión del cuarto»); crédito sensible del aire exterior topado en 0 en deshumidificación.
- **Unidad de aire exterior** 216 m³/h: humedad de suministro requerida 8.93 g/kg (rocío 12.1 °C); **ADP requerido 10.4 °C**, **ADP de selección 8.4 °C** (margen capturable, 2 °C); alerta si el requerido cae bajo 7 °C. Carga: 1.49 kW en enfriamiento, **1.96 kW en deshumidificación** (0.88 sensible + 1.08 latente; sale 10.6 °C / 8.06 g/kg).
- **Serpentín seco de recirculación** 15,984 m³/h (45 cambios/h × 360 m³ − aire exterior): 6.44 kW (enfriamiento) / 6.33 kW (deshumidificación); superficie 22.6 °C sobre el rocío del cuarto 12.9 °C: trabaja en seco (aviso si condensa).
- Dos equipos por separado, cada uno con el mayor de sus casos; total combinado 8.40 kW (2.39 TR) sólo como referencia para planta y cotización. Recalentamiento 0 (modo «todo el suministro por el serpentín» conservado: ahí sí hay recalentamiento).
- Condición resultante del cuarto: 8.60 g/kg ≈ 44.7 % HR contra la banda especificada 40–60 %; aviso si queda fuera.
- Cambios por hora obligatorios (en blanco al arrancar; la zona no se calcula ni deja Calcular sin ellos); caudal en m³/h, m³/min y CFM. Calor del ventilador: Q·ΔP/η con presión estática y eficiencia capturables, o módulos FFU × W.
- **Antes → después:** 22.12 (ahorros Kaizen por cambios de aire, TR): ISO 5 1.0291 → 1.1041 · ISO 6 0.4995 → 0.5744 · ISO 7 0.3481 → 0.4231 · ISO 8 alto 0.3103 → 0.3852. Proyecto lleno del comparador: 53.44 → 53.31 TR (el cuarto limpio ya no lleva infiltración y el serpentín seco se dimensiona por sí solo); los totales de cotización no cambian.
- Pruebas: 22.12 y S.37 actualizadas en el mismo commit.

## 2. Datos climáticos · rev 2.9.22
- PDF de carga: párrafo en rojo «DESHUMIDIFICACIÓN NO EVALUADA: FALTA DATO CLIMÁTICO» por zona con control de humedad en un sitio sin punto de rocío.
- Captura manual del punto de rocío (DP, razón de humedad, BS coincidente) con **fuente obligatoria**; sin fuente no se usa y se marca pendiente. El PDF imprime la fuente cuando el dato es manual.
- Estaciones ASHRAE 2021 de **referencia** (ashrae-meteo.info, 21-sep-2026), marcadas como referencia y no como dato, con botón para adoptarlas (queda la fuente declarada). **El dueño decide:**
  - Tecate → Brown Field 722904 (≈ 33 km O, 157 m; DP 0.4 % 20.0 °C / 15.0 g/kg / 24.0 °C) o Tijuana 760013 (19.2 / 14.2 / 22.8). Tecate está a 540 m y es más cálido y seco: sirven para la humedad, no para el bulbo seco.
  - Ensenada → Imperial Beach NOLF 722909 (costa, 20.5 / 15.2 / 24.3), San Diego Intl 722900 (20.5 / 15.2 / 24.0) o Tijuana.
  - Mexicali (fila propia sin fuente) → Mexicali Intl 760053 (estación propia: 44.0/24.8 °C, DP 26.2 / 21.7 / 37.0). Se propone adoptarla completa.
- Prueba S.38. Sin cambio de números.

## 3. Tubería hidráulica · rev 2.9.22
- PP-R PN20 (SDR 7.4) en el catálogo, diámetros interiores DIN 8077 de 20 a 110 mm, C 150.
- `plantilla-precios-tuberia-hidraulica.csv`: material, clave, diametro, precio_por_metro, moneda, fuente; 45 filas. Traen precio (USD, con fuente) 12 renglones de la cotización QMX Rev I: CPVC CTS 1/2"–1 1/4" (E-005…E-008), PP-R 20–40 mm (precios previos a VE-02), acero galvanizado ced. 40 1"–2" (F-016…F-019, red contra incendio, referencia). **Cobre tipo L sin precio en esa cotización: queda en blanco.**
- Cotización › Tubería hidráulica: importar CSV (USD → MXN con el tipo de cambio del proyecto; filas inválidas se rechazan y se listan) y descargar plantilla.
- Validación: con diámetros calculados sin precio, la cotización de la disciplina y la unificada quedan bloqueadas con la lista de diámetros que faltan.
- Prueba S.39.

## 4. Pruebas de regresión por motor
- `parches/regresion-motores/genera.mjs` construye el proyecto fijo, guarda el fixture y el esperado `{ ver, cifras }` por motor; sólo regenera un motor cuando subió su versión (o a propósito, por argumento).
- R.1: truena con mensaje distinto si la versión subió sin regenerar, o si las cifras cambiaron con la misma versión. R.2: abrir un proyecto viejo deja los sellos como venían, marca Desactualizado donde toca y no guarda nada; sólo Calcular vuelve a sellar.

## 5. Instalación limpia
- S.40 abre una ventana nueva sin nada guardado y verifica que todo arranca en cero; los fixtures viven en `parches/` y nunca se cargan al abrir.

## 6. Verificación
- Banco: 349/349 sin `--base`; 354/354 con `--base` (inicio de la 2.9.21).
- Comparador contra el inicio de la 2.9.21 (56 escenarios × 2 modos): ningún total de cotización cambia; las toneladas bajan 0.1–0.7 TR sólo en escenarios con cuarto limpio (infiltración 0 y dos equipos). Ida y vuelta: 8 diferencias, todas en campos nuevos (`serpentin`, `adpMargen`, `presion`, `fanPa`, `fanEta`, `rhMin`, `rhMax`) que un proyecto guardado por la 2.9.20 no traía.

```
lleno                          TR 53.44→53.31      total =
lleno-sin-cruces               TR 53.44→53.31      total =
lleno-cruces-parciales         TR 53.44→53.31      total =
zonas-oaFixed-fluorescent      TR 56.77→57.30      total =
sys-chiller                    TR 53.44→53.31      total =
sys-vrf                        TR 53.44→53.31      total =
sys-rooftop                    TR 53.44→53.31      total =
sys-split                      TR 53.44→53.31      total =
tech-VRF                       TR 53.44→53.31      total =
tech-DX_split                  TR 53.44→53.31      total =
tech-paquete                   TR 53.44→53.31      total =
tech-chiller_fancoil           TR 53.44→53.31      total =
tech-AHU                       TR 53.44→53.31      total =
tech-PTAC                      TR 53.44→53.31      total =
zonas-materiales               TR 52.28→52.16      total =
barra-calcular-todos           TR 53.44→53.31      total =
peakScan-false                 TR 52.19→52.08      total =
bldDiv-08                      TR 46.03→45.90      total =
cotiz-USD                      TR 53.44→53.31      total =
cotiz-sin-items                TR 53.44→53.31      total =
plaza-mexicali                 TR 64.96→64.49      total =
plaza-otra-factor              TR 53.44→53.31      total =
sitio-custom                   TR 60.71→59.96      total =
cotiz-licitacion               TR 53.44→53.31      total =
ductos-accesorios              TR 53.44→53.31      total =
soporte-sismico-viga           TR 53.44→53.31      total =
soporte-sin-sismico-manual     TR 53.44→53.31      total =
soporte-losa-fc                TR 53.44→53.31      total =
civil-demolicion               TR 53.44→53.31      total =
civil-manual                   TR 53.44→53.31      total =
vent-kitchen                   TR 53.44→53.31      total =
vent-industrial                TR 53.44→53.31      total =
vent-louver                    TR 53.44→53.31      total =
vent-mua                       TR 53.44→53.31      total =
cuartos-limpios                TR 57.25→57.13      total =
instalaciones-variantes        TR 53.44→53.31      total =
propuestas-aceptadas           TR 53.44→53.31      total =
propuestas-propio              TR 53.44→53.31      total =
herencia-propio                TR 53.44→53.31      total =
valor-decisiones               TR 53.44→53.31      total =
kaizen-items                   TR 53.44→53.31      total =
unidades-IP                    TR 53.44→53.31      total =
```

## 7. Pendiente
1. Elegir estación de referencia (o dar el dato) para Tecate, Ensenada y Mexicali.
2. Precio de cobre tipo L por diámetro (no está en la cotización QMX Rev I).
