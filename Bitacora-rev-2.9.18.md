# Bitácora · SuiteEmp rev 2.9.18

**Fecha:** 21-sep-2026 · **Base:** rev 2.9.17 · **Regla:** todo número que se mueve lleva norma, antes/después y prueba.

## 1. Verificación de fuentes

Cuatro datos se contrastaron contra fuentes publicadas. Un agente investigó cada uno y un segundo agente revisó sus fuentes; no se encontraron valores inventados.

| Dato | Resultado | Decisión del dueño |
|---|---|---|
| Áreas THW-LS (NOM-001-SEDE-2012 Cap. 10 Tabla 5 = NEC Cap. 9 Tabla 5) | Coinciden en los 20 calibres. La tabla no trae un renglón llamado «THW-LS»; se usa el de THW, que es la práctica común | — |
| Áreas THHN/THWN-2 | 7 de 20 no coincidían (0.2–1.9 %; tres del lado inseguro) | **Corregir a la NOM** |
| Curva de Hunter | Quedaba abajo del IPC apéndice E, Table E103.3(3): tanque de 18 a 46 % abajo (10 UM: 0.50 contra 0.92 L/s) y fluxómetro hasta 26 % abajo | **Reemplazar por el IPC** |
| Edición NOM-001 | La vigente es la NOM-001-SEDE-2012 (DOF 29-nov-2012). No hay edición posterior publicada y la numeración citada coincide | Citar el año (texto) |
| Tijuana | La fila protegida decía 35/24 °C, 0 m, 11 K. ASHRAE 2021 (WMO 760013, 0.4 %) da 32.8/17.5 °C, 149 m, 9.2 K | **Pasar a ASHRAE 2021** |

**Fuentes:**
- Tabla 5: NEC Chapter 9 Table 5 (extracto NECA/IBEW, y buildmyowncabin en in²) y reproducción de la NOM-001-SEDE-2012 Tabla 5 (EME Virtual).
- Hunter: IPC 2015 y 2024 en UpCodes, Table E103.3(3).
- NOM-001: plataforma de normalización de la Secretaría de Economía y DOF.
- Tijuana: ashrae-meteo.info, ASHRAE 2021, JSON oficial de la estación 760013.

## 2. Cambios, con antes y después

- **THHN** (`AREA_COND_THHN`, mm²): 3 AWG 62.64→62.77 · 250 255.5→256.1 · 300 299.7→297.3 · 350 342.9→338.2 · 400 384.4→378.3 · 600 570.2→559.7 · 750 671.6→677.2. Solo aplica si el usuario elige THHN; el conductor por omisión es THW-LS y no cambia.
- **Hunter** (`HUNTER_GPM`, en gpm tal como lo publica la norma; se convierte con 0.0630902 L/s por gpm):
  - Tanque: 1 3.0 · 5 9.4 · 10 14.6 · 20 19.6 · 30 23.3 · 40 26.3 · 50 29.1 · 70 35.0 · 80 38.0 · 100 43.5 · 140 52.5 · 160 57.0 · 200 65.0 · 300 85.0 · 400 105 · 500 124 · 750 170 · 1000 208 · 1250 239 · 1500 269 · 2000 325.
  - Fluxómetro: 5 15.0 · 10 27.0 · 20 35.0 · 30 42.0 · 40 46.0 · 50 50.0 · 70 58.0 · 80 61.2 · 100 67.5 · 140 77.0 · 160 81.0 · 200 90.0 · 300 108 · 400 127 · 500 143 · 750 177 · 1000 208 · 1250 239 · 1500 269 · 2000 325.
  - Ejemplos: 10 UM con tanque 0.50→0.92 L/s; gasto del proyecto de la 2.9.13: 3.924→4.060 L/s. El aviso «curva no contrastada» se sustituyó por la cita de la tabla en la memoria.
- **Tijuana**: 35/24 °C, 0 m, 11 K → **32.8/17.5 °C, 149 m, 9.2 K**. Rosarito, su sustituta, cambia igual, y «Personalizado» parte de estos valores. En el proyecto de la 2.9.13, que está en Tijuana:
  - carga 18.58→**12.90 TR**, porque el bulbo húmedo de 24 a 17.5 °C recorta el latente;
  - caudal 5,115→**5,790 CFM**, porque pesa más el sensible;
  - planta 20.44→14.20 TR;
  - total de la cotización 11,755,194.88→**11,710,832.45**.
- **Texto:** NORMAS cita «NOM-001-SEDE-2012 (DOF 29-nov-2012)» y «IPC apéndice E, Table E103.3(3)».

## 3. Verificación

- **Banco sin `--base`:** 341/341. Prueba nueva S.34 (valores de norma de las tres decisiones). Se actualizaron 22.5, 22.10, Q.11 y S.20 con su antes/después.
- **Banco con `--base`:** 344/346. Las dos que no pasan, 8.1 y 8.5, comparan contra la 2.9.17 y registran justo los números que movieron las decisiones: carga del caso de prueba 35,698.81→24,877.57 W (Tijuana) e importe hidrosanitario y de cotización 495,943.44→517,581.99 (Hunter).
- **Comparador contra la 2.9.17** (56 escenarios × 2 modos): todas las diferencias vienen del clima de Tijuana, de Hunter o de THHN.
  - Los proyectos llenos usan sitio propio, así que no cambian de toneladas; su total sube de 0.0 a 0.9 % por los diámetros hidráulicos.
  - La ida y vuelta muestra 166 diferencias, todas del escenario `propuestas-aceptadas`: la 2.9.17 guardó propuestas aceptadas con sus números y, al abrirlas, la 2.9.18 las conserva y las marca «Desactualizada: el origen cambió desde que se aceptó» (ductos y eléctrico), como pide la regla 3. Nada se mueve solo.

**Toneladas y total por escenario:**

```
vacio                          TR =                total =
prueba                         TR 13.72→10.71      total 8269512→8293534 (0.3 %)
lleno                          TR =                total 44960423→45021180 (0.1 %)
lleno-sin-cruces               TR =                total 9145557→9193602 (0.5 %)
lleno-cruces-parciales         TR =                total 9736209→9796966 (0.6 %)
zonas-oaFixed-fluorescent      TR =                total 44972434→45045202 (0.2 %)
sys-chiller                    TR =                total 44960423→45021180 (0.1 %)
sys-vrf                        TR =                total 44975152→45043274 (0.2 %)
sys-rooftop                    TR =                total 44967787→45043274 (0.2 %)
sys-split                      TR =                total 44967787→45035909 (0.2 %)
tech-VRF                       TR =                total 44960423→45021180 (0.1 %)
tech-DX_split                  TR =                total 44960423→45021180 (0.1 %)
tech-paquete                   TR =                total 44960423→45021180 (0.1 %)
tech-chiller_fancoil           TR =                total 44960423→45021180 (0.1 %)
tech-AHU                       TR =                total 44960423→45021180 (0.1 %)
tech-PTAC                      TR =                total 44960423→45021180 (0.1 %)
zonas-materiales               TR =                total 44948412→45009169 (0.1 %)
barra-calcular-todos           TR =                total 44960423→45021180 (0.1 %)
barra-calcular-vacio           TR =                total =
peakScan-false                 TR =                total 44936400→44997158 (0.1 %)
bldDiv-08                      TR =                total 44840311→44913079 (0.2 %)
cotiz-USD                      TR =                total 44960423→45021180 (0.1 %)
cotiz-sin-items                TR =                total 38457332→38518089 (0.2 %)
plaza-mexicali                 TR =                total 48712921→48726651 (0.0 %)
plaza-otra-factor              TR =                total 49006861→49073086 (0.1 %)
sitio-custom                   TR 60.22→60.28      total 45092546→45105258 (0.0 %)
cotiz-licitacion               TR =                total 40800938→40855574 (0.1 %)
ductos-accesorios              TR =                total 45212260→45273017 (0.1 %)
soporte-sismico-viga           TR =                total 44622335→44683093 (0.1 %)
soporte-sin-sismico-manual     TR =                total 44487042→44547799 (0.1 %)
soporte-losa-fc                TR =                total 44960423→45021180 (0.1 %)
civil-demolicion               TR =                total 52762889→52823646 (0.1 %)
civil-manual                   TR =                total 41670177→41730934 (0.1 %)
vent-kitchen                   TR =                total 41428112→41488869 (0.1 %)
vent-industrial                TR =                total 46352956→46413713 (0.1 %)
vent-louver                    TR =                total 38991369→39052126 (0.2 %)
vent-mua                       TR =                total 63664915→63725672 (0.1 %)
cuartos-limpios                TR =                total 57467503→57540271 (0.1 %)
instalaciones-variantes        TR =                total 58962050→59010094 (0.1 %)
propuestas-aceptadas           TR =                total 8194413→8268236 (0.9 %)
propuestas-propio              TR =                total 9145557→9193602 (0.5 %)
herencia-propio                TR =                total 39222483→39283241 (0.2 %)
valor-decisiones               TR =                total 44960423→45021180 (0.1 %)
kaizen-items                   TR =                total 44960423→45021180 (0.1 %)
unidades-IP                    TR =                total 44960423→45021180 (0.1 %)
sin-zonas-con-datos            TR =                total 36922713→36935426 (0.0 %)
parcial-fuego                  TR =                total =
parcial-civil-directas         TR =                total =
parcial-soporte-riel           TR =                total =
parcial-vent-cocina-sin-medidas TR =                total =
parcial-vent-cocina            TR =                total =
parcial-ductos-sin-caudal      TR =                total =
parcial-ductos-con-caudal      TR =                total =
parcial-limpio                 TR =                total =
parcial-equipo-manual          TR =                total =
parcial-zona-sola              TR 0.86→0.38        total =
```

## 4. Pendiente

1. Capturar los precios de tubería hidráulica por diámetro.
2. Agregar 700 kcmil a las tablas de conductor si se necesita (THW 710.3 y THHN 637.9 mm²).
