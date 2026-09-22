# Bitácora · SuiteEmp rev 2.9.16

**Fecha:** 21-sep-2026 · **Base:** rev 2.9.15 · **Regla:** cualquier número que se mueva lleva norma, antes/después y prueba. Pruebas en verde antes de entregar.

Esta revisión aplica las decisiones del dueño del 21-sep-2026. **Sí mueve números**, a propósito y solo donde las decisiones lo piden. Cada movimiento lleva abajo su norma (o por qué no la tiene), su antes/después y la prueba que lo fija. La revisión de textos de los grupos G1, G2, G4 y G5 corre aparte, después de las 10:50 (límite de uso).

## 1. Conductor y canalización

**Decisión:** el tubo se dimensiona con el conductor que dice la memoria, nunca con otro. Por omisión va THW-LS/THHW-LS con sus áreas de NOM-001-SEDE, Capítulo 10, Tabla 5. Hay un selector de tipo para que memoria y canalización usen siempre el mismo.

- **Norma:** NOM-001-SEDE, Capítulo 10, Tabla 5 (áreas de conductor con aislamiento), renglón THW/THHW/THW-LS/THHW-LS. Los valores se transcribieron del renglón THW/THHW de la Tabla 5 del capítulo 9 del NEC, que la NOM reproduce: 14 AWG 8.968 · 12 11.68 · 10 15.68 · 8 28.19 · 6 46.84 · 4 62.77 · 3 73.16 · 2 86.00 · 1 122.6 · 1/0 143.4 · 2/0 169.3 · 3/0 201.1 · 4/0 239.9 · 250 296.5 · 300 340.7 · 350 384.4 · 400 427.0 · 500 509.7 · 600 627.7 · 750 751.7 mm². **Pendiente:** cotejarlos renglón por renglón contra la tabla impresa de la NOM.
- **Qué cambió:**
  - `selConductor` recibe `aislamiento` y usa las áreas de ese tipo.
  - `S.elec.aislamiento` vale `"thw-ls"` por omisión; un proyecto viejo sin el campo abre con THW-LS, que es lo que su memoria ya declaraba.
  - La memoria de pantalla y el PDF dicen el tipo.
  - Hay selector en Eléctrico: THW-LS/THHW-LS o THHN/THWN-2.
- **Antes / después** (cobre, 75 °C, 40 °C ambiente; el tubo es EMT, NOM Tabla 4):

| Caso | Calibre / tierra | Antes: tubo (área THHN) | Después: tubo (área THW-LS) |
|---|---|---|---|
| 16 A, 1 F, 127 V | 10 / 12 | 1/2" (35.8 mm²) | **1/2"** (43.04 mm²) |
| 24 A, 3 F, 220 V | 10 / 10 | 1/2" (68.05 mm²) | **1/2"** (78.4 mm²) |
| 40 A, 3 F, 220 V | 6 / 10 | 1" (144.45 mm²) | **1"** (203.04 mm²) |
| 65 A, 3 F, 220 V | 3 / 8 | 1 1/4" (274.17 mm²) | **1 1/4"** (320.83 mm²) |
| 100 A, 3 F, 220 V | 1/0 / 6 | 1 1/2" (511.51 mm²) | **2"** (620.44 mm²) ← cambia |
| 150 A, 3 F, 220 V | 4/0 / 6 | 2 1/2" (867.91 mm²) | **2 1/2"** (1006.44 mm²) |
| 200 A, 3 F, 480 V | 300 / 4 | 2 1/2" (1251.96 mm²) | **2 1/2"** (1425.57 mm²) |
| 280 A, 3 F, 220 V | 600 / 3 | 3 1/2" (2343.44 mm²) | **3 1/2"** (2583.96 mm²) |
| 400 A, 3 F, 220 V | 300 / 2 | 2 1/2" (1273.51 mm²) | **2 1/2"** (1448.8 mm²) |
| 600 A, 3 F, 480 V | 750 / 1/0 | 3 1/2" (2806.1 mm²) | **4"** (3150.2 mm²) ← cambia |


- **Pruebas:** S.29 (casos de 100 A y 600 A, áreas exactas, memoria, PDF, selector, proyecto viejo y tipo desconocido).

## 2. Cotización hidrosanitaria

**Decisión:** precio unitario por diámetro y material, no uno solo por metro. Sale el supuesto de 50 m: sin longitudes, la partida queda «pendiente de longitud» y no se cotiza. Nunca se inventan datos.

- **Norma:** no aplica. Es un criterio de cotización.
- **Qué cambió:**
  - `QUOTE_SEED.hidroPU` nace vacío, porque la casa no tiene precio por diámetro y no se inventa. El usuario captura MXN/m instalado y probado por cada diámetro que salió del cálculo, en Cotización.
  - Cada diámetro con precio da un renglón con los metros capturados de sus tramos.
  - Un diámetro sin precio queda «pendiente de precio unitario».
  - Los tramos sin longitud, o la red sin tramos, quedan «pendiente de longitud».
  - Los pendientes se dicen en la pantalla de Cotización, en el PDF de cotización, en la cotización por disciplina y en la propuesta (es/en). No suman nada.
  - `hidroM` (780 MXN/m) salió de la lista activa y queda archivado en el §7.
- **Antes / después:**
  - Proyecto de la 2.9.13 (fixture de S.20, sin tramos de agua): costo directo 6,704,014.75 → **6,665,014.75** (−39,000 = 50 m × 780). Total 11,755,194.88 → **11,686,810.10**. La red queda «pendiente de longitud».
  - Proyectos llenos del comparador: total **−157,285.00** en cada escenario (la red con tramos medidos queda pendiente de precio por diámetro).
- **Pruebas:** 22.11 (reescrita: sin tramos, tramos en 0 m, sin precio, con precio por diámetro, PDF, propuesta en inglés y saneado) y S.20 (antes → después del fixture, registrado en la prueba).
- **Atención:** hasta que se capturen los precios por diámetro, **ningún proyecto cotiza tubería hidráulica**. Aparece como pendiente, con sus metros.

## 3. Pisos internos

**Decisión:** se quedan solo los pisos que tengan norma que los respalde, y cuando se aplican se avisa al usuario y quedan en la memoria. Los que no tengan sustento salen.

| Piso | Motor | Norma | Qué se hizo | Antes → después |
|---|---|---|---|---|
| Área mínima 1 m² | Contra incendio | ninguna | **Salió.** Sin área no hay demanda, bomba ni reserva; la memoria lo dice | Proyecto vacío: bomba 2,500 L/min, reserva 138,152 L, $1,697,446.66 → **0** |
| Área de operación mínima de la curva densidad-área (139 m² en riesgo ordinario) | Contra incendio | NFPA 13, curva densidad-área | **Se queda**, con aviso y línea «PISO DE NORMA APLICADO» en la memoria cuando el área protegida es menor | Sin cambio numérico |
| Reserva de manguera por clase de riesgo | Contra incendio | NFPA 13 | Se queda; solo aplica si hay área | Sin cambio con área |
| Área mínima 1 m² y altura mínima 2.2 m | Cuartos limpios | ninguna | **Salieron.** Cuarto sin área o sin altura: todo en cero y se dice | Cuarto vacío: 1 FFU, 99 m³/h → **0**. Altura 2.0 m: 132 → **120 m³** |
| Presurización mínima 5 Pa | Cuartos limpios | ISO 14644-4 (5–20 Pa entre clases) | **Se queda**, con línea «PISO DE NORMA APLICADO» en la memoria | 3 Pa capturados → rige 5 Pa (sin cambio numérico) |
| `c.dp \|\| 12.5`, `c.crackLen \|\| 6`, `c.oaFrac \|\| .1` (un 0 capturado se leía como ausente) | Cuartos limpios | ninguna | **Salió.** El 0 capturado se respeta | Rendija en 0 m: fuga 189 → **0 m³/h** |
| Una unidad de compresor con demanda cero | Aire comprimido | ninguna | **Salió.** Sin demanda no hay unidades | Soportería de un proyecto vacío: base de equipo $18,500 → **0** |
| Renta de elevación sin nada que montar (3 meses) | Soportería | ninguna | **Salió.** Solo entra si hay soportes, riel o bases | Proyecto vacío: $25,500 → **0** |
| 10 m supuestos por tramo de agua | Hidrosanitario | ninguna | **Salió.** Tramo sin longitud: pérdida 0, marcado `sinL` y aviso de error | Tramo sin L: L 10 → **0 m**, hf supuesta → 0 |

- **Efecto conjunto:** un proyecto vacío con todos los cruces autorizados cotizaba **$3,162,176.69** sin captura. Ahora cotiza **$0**.
- **Consecuencia destapada y corregida (obra civil):** al quitar el cuarto fantasma de 1 m², se abría una rama que nunca había corrido: sin área limpia, el plafón y el piso **de cuarto limpio** («en área clasificada») se cotizaban sobre toda la planta, y el total subía en lugar de bajar. Ahora, sin área clasificada no hay partidas de área clasificada y toda el área va como no clasificada, que es lo que el usuario veía antes menos el metro fantasma.
  - Escenario `parcial-zona-sola`: sin la corrección subía +$212,371.12. Con ella, $4,437,598.74 → **$4,256,494.33**.
- **Pruebas:** S.32 (proyecto vacío = $0 y cada piso con su antes/después), S.18 y S.23 (semáforo), y P.13 y Q.10, que ahora arman su caso con captura real.
- **No se tocaron, porque no generan cotización sin captura:** la selección de ventilador con caudal cero (solo se muestra) y la corriente mínima de 0.1 A del alimentador (solo se muestra).

## 4. Precios sin uso

Salieron de la lista activa y quedan archivados en el §7, con su valor y su renglón en la 2.9.15:
- `PU_SOP` (7 claves);
- `SOP_ACERO` y `SOP_COBRE`;
- `PU_CIVIL.castillo` y `pinturaVinil`;
- las recetas `pinturaVinil`, `castillo`, `ducto` y `tuberia`;
- `EQ_CAT.soldadora`, `CUADRILLAS.ducto`, `MO_CAT.ductero` y `MO_CAT.cabo`;
- `QUOTE_SEED.hidroM`.

Nada de eso se leía, salvo `cabo` y `ductero`, que se imprimían en la tabla de FASAR del PDF de licitación y ya no salen.

`espSoporte` lee ahora la tabla viva (`C_SOP.ESPAC_*`) para acero y cobre. La prueba L.2 dejó de proteger la tabla muerta (observación L-1 de la 2.9.14: cobre de 1¼" a 1.8 m, no 2.1 m). `verificacion-precios-sin-uso.mjs` acepta las tablas archivadas.

## 5. Interfaz

- **Controles anidados, aplanados a un solo nivel:** 5 tarjetas (candidatos de carga, Selección, ventiladores y dos vistas de Catálogo). Su PDF y su «Seleccionar» son ahora `<button>` hermanos. La zona de carga de archivos pasa a ser un grupo con nombre, sin acción propia; sus dos botones actúan y el arrastre sigue igual. Pruebas S.31 (ninguna pantalla tiene un control dentro de otro) y S.A11Y.1 a 4, reescritas.
- **«Desactualizado» en el menú:** es un distintivo en el nodo de la disciplina afectada. Un módulo (HVAC) junta sus motores. «Sin sello» no se marca. Prueba S.30.
- **Kaizen e Ingeniería de valor:** no llevan semáforo y no cuentan en la completitud. Conservan su renglón y su texto. La completitud cuenta 12 disciplinas de cálculo (15 menos Kaizen, Valor y el estructural externo). Pruebas 12.9 (reescrita), 2.3 y S.18.

## 6. Paleta idéntica al isométrico del sitio publicado

**Fuente:**
- El corte isométrico de la portada de emdelpacifico.netlify.app, en la descarga del 19-sep-2026: SVG y 99 reglas CSS `.iso*`, con sus `var()` resueltas.
- La portada de hoy (21-sep-2026, ETag `"98481d54…"`) ya no trae el isométrico; lo reemplazó con fotografías. Su página 404 conserva los estilos del isométrico con los mismos valores (0 diferencias en las variables que usa).

**Paleta:** 41 tonos. Grises acero, azules (`#1F4FD8`, `#5B85FF`, `#6FA7E6`, `#7B9BFF`, `#7CC8F7`, `#AFC0DC`, `#DCE5F5`), el naranja `#F0561D` y los colores de capa.

**Método:**
- Cada color de la suite va al tono del isométrico más cercano por ΔE2000, sin cruzar grises con colores.
- La arcilla (`--marca`), identidad de PDF y Excel, pasa al azul de marca del sitio `#1F4FD8`.
- Cinco grises del PDF y Excel se fijaron a mano para que se lean sobre papel blanco: texto secundario a `#4B5563` (7.5:1), líneas a `#7A8088` y reglas a `#A8B0BA`.
- El paso 8 de la rampa de pantalla fue a `#DCE5F5` para no repetir el 7.
- La señal y los colores de capa ya eran del sitio y no cambiaron.

**Prueba:** S.33 (ningún hex, rgba ni ARGB fuera del isométrico, y ningún operador de color del PDF fuera de él). S.9 actualizada: la marca es `#1F4FD8`.

| Superficie | Antes | Ahora (tono del isométrico) | Veces |
|---|---|---|---|
| Excel (ARGB) | `FFE1DACB` | `FFF4F6F9` | 4 |
| Excel (ARGB) | `FF3A3529` | `FF333333` | 3 |
| Excel (ARGB) | `FFC8643F` | `FF1F4FD8` | 2 |
| Excel (ARGB) | `FF6E6754` | `FF4B5563` | 1 |
| Excel (ARGB) | `FFEFEAE0` | `FFF4F6F9` | 1 |
| Excel (ARGB) | `FFFBFAF6` | `FFF4F6F9` | 1 |
| pantalla/SVG (hex) | `#EEF0F3` | `#F4F6F9` | 4 |
| pantalla/SVG (hex) | `#0D0F12` | `#0B0D10` | 3 |
| pantalla/SVG (hex) | `#86AEEF` | `#6FA7E6` | 3 |
| pantalla/SVG (hex) | `#23272D` | `#1D242E` | 2 |
| pantalla/SVG (hex) | `#A5ADB8` | `#A8B0BA` | 2 |
| pantalla/SVG (hex) | `#C8643F` | `#1F4FD8` | 2 |
| pantalla/SVG (hex) | `#FF8A5C` | `#F0561D` | 2 |
| pantalla/SVG (hex) | `#13161A` | `#111417` | 1 |
| pantalla/SVG (hex) | `#1A1D22` | `#161B23` | 1 |
| pantalla/SVG (hex) | `#313740` | `#2A3038` | 1 |
| pantalla/SVG (hex) | `#5A626D` | `#4B5563` | 1 |
| pantalla/SVG (hex) | `#C2C8D0` | `#A8B0BA` | 1 |
| pantalla/SVG (hex) | `#A4502F` | `#1F4FD8` | 1 |
| pantalla/SVG (hex) | `#F2DDCE` | `#DCE5F5` | 1 |
| pantalla/SVG (hex) | `#93A2B5` | `#9AA4B0` | 1 |
| pantalla/SVG (hex) | `#1B1E23` | `#161B23` | 1 |
| pantalla/SVG (hex) | `#312E65` | `#1F4FD8` | 1 |
| pantalla/SVG (hex) | `#F7F5EF` | `#F4F6F9` | 1 |
| pantalla/SVG (hex) | `#3A3529` | `#333333` | 1 |
| pantalla/SVG (hex) | `#B4CCF4` | `#AFC0DC` | 1 |
| pantalla/SVG (hex) | `#5F86C9` | `#5B85FF` | 1 |
| pantalla/SVG (hex) | `#456CAA` | `#1F4FD8` | 1 |
| pantalla/SVG (hex) | `#6F97DA` | `#7B9BFF` | 1 |
| pantalla/SVG (hex) | `#B9C0CA` | `#A8B0BA` | 1 |
| pantalla/SVG (hex) | `#8D96A3` | `#9AA4B0` | 1 |
| pantalla/SVG (hex) | `#D3D8DF` | `#DCE5F5` | 1 |
| PDF (rgb 0–1) | `[.23, .21, .16]` | `[0.2, 0.2, 0.2]` | 5 |
| PDF (rgb 0–1) | `[.43, .40, .33]` | `[0.294, 0.333, 0.388]` | 5 |
| PDF (rgb 0–1) | `[.49, .46, .38]` | `[0.294, 0.333, 0.388]` | 5 |
| PDF (rgb 0–1) | `[.55, .2, .1]` | `[0.941, 0.337, 0.114]` | 3 |
| PDF (rgb 0–1) | `[.969, .961, .937]` | `[0.957, 0.965, 0.976]` | 2 |
| PDF (rgb 0–1) | `[.29, .27, .21]` | `[0.2, 0.2, 0.2]` | 2 |
| PDF (rgb 0–1) | `[.56, .53, .45]` | `[0.478, 0.502, 0.533]` | 2 |
| PDF (rgb 0–1) | `[.784, .392, .247]` | `[0.122, 0.31, 0.847]` | 1 |
| PDF (rgb 0–1) | `[.84, .81, .75]` | `[0.659, 0.69, 0.729]` | 1 |
| PDF (rgb 0–1) | `[.98, .91, .86]` | `[0.957, 0.965, 0.976]` | 1 |
| PDF (rgb 0–1) | `[.33, .30, .24]` | `[0.2, 0.2, 0.2]` | 1 |
| pantalla (rgba) | `rgba(13,15,18,.72)` | `rgba(11,13,16,.72)` | 1 |
| pantalla (rgba) | `rgba(26,29,34,.96)` | `rgba(22,27,35,.96)` | 1 |
| pantalla (rgba) | `rgba(6,7,9,.62)` | `rgba(11,13,16,.62)` | 1 |
| pantalla (rgba) | `rgba(24,27,32,.86)` | `rgba(22,27,35,.86)` | 1 |
| pantalla (rgba) | `rgba(24,27,32,.94)` | `rgba(22,27,35,.94)` | 1 |
| pantalla (rgba) | `rgba(30,34,40,.92)` | `rgba(26,32,41,.92)` | 1 |
| pantalla (hex) | `--gr-8 #C2C8D0` | `#DCE5F5` (ajuste: la rampa no puede repetir el paso 7) | 1 |
| PDF (operador) | `0.49 0.46 0.38 rg` (pie de página) | `#4B5563` | 1 |


## 7. Archivo · precios y tablas retirados de la lista activa (rev 2.9.15, líneas de esa versión)

```js
7227:  ductoRect: 1450,     // soporte de ducto rectangular con varilla, ángulo y aislante, pieza
7228:  ductoRedondo: 980,   // abrazadera de espiroducto con varilla
7229:  tubChica: 620,       // soporte de tubería hasta 2"
7230:  tubMedia: 1180,      // soporte de tubería de 2½" a 4"
7231:  tubGrande: 2340,     // soporte de tubería de 6" en adelante, con silleta
7232:  sismicoLong: 4850,   // arriostramiento longitudinal
7233:  sismicoTrans: 3900,  // arriostramiento transversal
7137:const SOP_ACERO = [[15, 2.1], [20, 2.1], [25, 2.1], [32, 2.7], [40, 2.7], [50, 3.0],
7138-  [65, 3.4], [80, 3.7], [100, 4.3], [150, 5.2], [200, 5.8], [999, 6.4]];
--
7153:const SOP_COBRE = [[15, 1.8], [20, 1.8], [25, 1.8], [32, 2.1], [40, 2.4], [50, 2.4],
7154-  [65, 2.7], [80, 3.0], [100, 3.0], [999, 3.0]];
4627:  hidroM: 780,            // MXN por metro de red hidráulica instalada y probada
6969:  castillo: 2373.28,       // castillo/dala de confinamiento, ml
6972:  pinturaVinil: 319.28,    // pintura vinílica satinada, m²
5936:  pinturaVinil:{ k: ["vinilica", "vinílica"], un: "M2", cua: "pintura", rend: 45, prelim: true,
5937-    mat: [["Pintura vinilica satinada", "L", 0.28, 268], ["Sellador y resane", "LOTE", 1, 18]], eq: [["andamio", 0.5]] },
5938:  castillo:    { k: ["castillo", "dala"], un: "ML", cua: "albanil2", rend: 14, prelim: true,
5939-    mat: [["Concreto f'c=200 kg/cm2", "M3", 0.032, 3150], ["Acero de refuerzo 4 var. 3/8 + estribos", "KG", 9.8, 32],
5940-          ["Cimbra de madera, 3 usos", "M2", 0.8, 145]], eq: [] },
5941:  ducto:       { k: ["ducto de lámina", "ducto de lamina", "ducto rectangular"], no: ["kg", "kilogramo"], un: "M2", cua: "ducto", rend: 12, prelim: true,
5942-    mat: [["Lamina galvanizada calibre segun SMACNA", "M2", 1.10, 185], ["Junta TDC, esquineros y tornilleria", "LOTE", 1, 96],
5943-          ["Sellador de juntas y refuerzos", "LOTE", 1, 54]], eq: [["plataforma", 1]] },
5944:  tuberia:     { k: ["tuberia", "tubería", "tubo"], un: "ML", cua: "tuberia", rend: 26, prelim: true,
5945-    mat: [["Tuberia y conexiones segun especificacion", "ML", 1.03, 246], ["Consumible de soldadura o cementante", "LOTE", 1, 38],
5946-          ["Soporteria menor de linea", "LOTE", 1, 44]], eq: [["soldadora", 1], ["plataforma", 0.5]] },
5879:  cabo:     { label: "Cabo de oficios",              nom: 780 },
5881:  ductero:  { label: "Oficial ductero / lamina",     nom: 680 },
5889:  ducto:    { label: "1 oficial ductero + 1 ayudante",   comp: [["ductero", 1], ["ayud", 1]] },
5900:  soldadora:  { label: "Soldadora electrica 300 A",            jornada: 540 },
```


El análisis completo de cada precio (partida a la que correspondía y efecto si se conectara) sigue en el §6 de `Bitacora-rev-2.9.14.md`.

## 8. Verificación

- **Banco:** 345/345 con `--base` (inicio de la 2.9.16) y 340/340 sin él. Pruebas nuevas o reescritas: S.29 a S.33, 22.11, S.20, S.A11Y.1 a 4, 12.9, 2.3, S.18, L.2, P.13, Q.10 y S.9.
- **Comparador contra el inicio de la 2.9.16** (56 escenarios × 2 modos, motores + Excel + PDF): 64,142 diferencias numéricas o estructurales y 11,282 de texto. **Todas atribuidas a las decisiones de esta revisión:** áreas de tubo del conductor THW-LS (eléctrico), partidas pendientes de la red hidráulica, pisos retirados (contra incendio, cuartos limpios, aire, soportería, hidrosanitario, obra civil), campos nuevos (`aislamiento`, `Lcap`, `sinL`, `vacio`, `pisoDP`), los precios de Excel y PDF que siguen de ellas, y en los motores no tocados solo `cotizacion.directo` y `cotizacion.pct` (el costo directo del proyecto que cada motor reporta como referencia). **Ningún escenario sube de precio.** Ida y vuelta (guardar y abrir): **0**. Informe completo en `parches/comparador-15-motores/informe-2.9.16-vs-2.9.15.txt`.
- **Total de la cotización por escenario, antes → después:**

```
vacio                           sin cambio
prueba                              8570958.65 ->     8269511.82  Δ -301446.83
lleno                              45117707.74 ->    44960422.74  Δ -157285.00
lleno-sin-cruces                sin cambio
lleno-cruces-parciales              9893494.12 ->     9736209.12  Δ -157285.00
zonas-oaFixed-fluorescent          45129718.91 ->    44972433.91  Δ -157285.00
sys-chiller                        45117707.74 ->    44960422.74  Δ -157285.00
sys-vrf                            45132436.77 ->    44975151.77  Δ -157285.00
sys-rooftop                        45125072.25 ->    44967787.25  Δ -157285.00
sys-split                          45125072.25 ->    44967787.25  Δ -157285.00
tech-VRF                           45117707.74 ->    44960422.74  Δ -157285.00
tech-DX_split                      45117707.74 ->    44960422.74  Δ -157285.00
tech-paquete                       45117707.74 ->    44960422.74  Δ -157285.00
tech-chiller_fancoil               45117707.74 ->    44960422.74  Δ -157285.00
tech-AHU                           45117707.74 ->    44960422.74  Δ -157285.00
tech-PTAC                          45117707.74 ->    44960422.74  Δ -157285.00
zonas-materiales                   45105696.56 ->    44948411.56  Δ -157285.00
barra-calcular-todos               45117707.74 ->    44960422.74  Δ -157285.00
barra-calcular-vacio            sin cambio
peakScan-false                     45093685.39 ->    44936400.39  Δ -157285.00
bldDiv-08                          44997596.00 ->    44840311.00  Δ -157285.00
cotiz-USD                          45117707.74 ->    44960422.74  Δ -157285.00
cotiz-sin-items                    38614616.92 ->    38457331.92  Δ -157285.00
plaza-mexicali                     48882789.17 ->    48712921.36  Δ -169867.80
plaza-otra-factor                  49178301.43 ->    49006860.78  Δ -171440.65
sitio-custom                       45249830.65 ->    45092545.64  Δ -157285.00
cotiz-licitacion                   40942377.13 ->    40800938.17  Δ -141438.96
ductos-accesorios                  45369545.02 ->    45212260.02  Δ -157285.00
soporte-sismico-viga               44779620.38 ->    44622335.38  Δ -157285.00
soporte-sin-sismico-manual         44644327.22 ->    44487042.22  Δ -157285.00
soporte-losa-fc                    45117707.74 ->    44960422.74  Δ -157285.00
civil-demolicion                   52920174.12 ->    52762889.12  Δ -157285.00
civil-manual                       41827462.04 ->    41670177.03  Δ -157285.00
vent-kitchen                       41585396.93 ->    41428111.92  Δ -157285.00
vent-industrial                    46510241.12 ->    46352956.12  Δ -157285.00
vent-louver                        39148654.19 ->    38991369.19  Δ -157285.00
vent-mua                           63822199.88 ->    63664914.88  Δ -157285.00
cuartos-limpios                    57624787.68 ->    57467502.67  Δ -157285.00
instalaciones-variantes            59119334.79 ->    58962049.78  Δ -157285.00
propuestas-aceptadas            sin cambio
propuestas-propio               sin cambio
herencia-propio                    39379768.46 ->    39222483.46  Δ -157285.00
valor-decisiones                   45117707.74 ->    44960422.74  Δ -157285.00
kaizen-items                       45117707.74 ->    44960422.74  Δ -157285.00
unidades-IP                        45117707.74 ->    44960422.74  Δ -157285.00
sin-zonas-con-datos                37079998.23 ->    36922713.22  Δ -157285.00
parcial-fuego                       3282113.08 ->     3101331.77  Δ -180781.31
parcial-civil-directas              3707902.31 ->      545725.62  Δ -3162176.69
parcial-soporte-riel                3202681.53 ->       85217.96  Δ -3117463.57
parcial-vent-cocina-sin-medidas     3175906.25 ->       13729.56  Δ -3162176.69
parcial-vent-cocina                 4288509.16 ->     1126332.46  Δ -3162176.69
parcial-ductos-sin-caudal           3162176.69 ->           0.00  Δ -3162176.69
parcial-ductos-con-caudal           3162176.69 ->           0.00  Δ -3162176.69
parcial-limpio                      4817614.50 ->     1759067.06  Δ -3058547.44
parcial-equipo-manual               4634885.73 ->     1517422.17  Δ -3117463.57
parcial-zona-sola                   4437598.74 ->     4256494.33  Δ -181104.41
```

## 9. Pendiente

1. Revisión de textos de G1 (carga, comparativo, cuartos limpios, selección), G2 (ductos, ventilación), G4 (contra incendio, aire, civil, soportería, estructural) y G5 (cotización, tablero, proyecto, catálogo; Kaizen y Valor como textos de revisión, no como disciplinas de cálculo). Corre después de las 10:50.
2. Capturar los precios de tubería hidráulica por material y diámetro. Hasta entonces esa tubería no se cotiza en ningún proyecto.
3. Cotejar las áreas THW-LS contra la tabla impresa de NOM-001-SEDE, Cap. 10, Tabla 5.
