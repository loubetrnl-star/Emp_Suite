# hidro · pendientes de la Fase 1 y cierre de la Fase 2 (rev 2.9.24, 22/24-sep-2026)

Motor hidrosanitario (`hidro`, v8). Entregas: `hidro.calc.mjs` (cálculo independiente, imprime y escribe la hoja),
`hidro.csv` (105 filas: 88 vigentes, 17 `fase2:H-nnn`), `pruebas-motores/hidro.mjs` (25 pruebas `CM.hidro.*`),
`parches/mutantes/hidro.json` (62 mutantes; ver §3). Banco al cierre de H-196: 462/462 sin base, 468/468 con base. Con
`CM_FASE2=1` las filas fase2 fallan hoy, ninguna pasa por casualidad (arnés `tmp-fase1/fase2-filas.mjs`, no commiteado).

## 0. Hallazgos cerrados en la Fase 2

| Hallazgo | Estado | Qué cambió |
|---|---|---|
| H-194 (presión mínima por mueble sin fuente; CDT con residual fijo de 15 m) | **Cerrado** (hidro v4 → v5, 24-sep-2026) | `MUEBLES` guarda la presión en psi de la Tabla 604.3 del IPC 2015 (texto literal en `parches/normas-texto/IPC-2015_Tabla-604.3_y_424.3_upcodes.txt`) y la convierte con 0.703070 m/psi: WC con fluxómetro 35 psi = 24.607 m (antes 10.5), mingitorio 25 (antes 10.5), WC de tanque 20 (antes 5.6), regadera 20 por §424.3 (antes 8.4), lavabo/fregadero/lavadero/bebedero 8 (5.6246, antes 5.6), toma de manguera 8 (antes 10.5); tarja de laboratorio asimilada a sink, service 8 psi (criterio de la casa, declarado); lavaojos 21 m sin cambio (H-195). Sin muebles: 8 psi, el menor renglón (criterio de la casa). La CDT lleva máx(residual capturado, mínima de norma del mueble más exigente); memoria, PDF, Excel (URS) y pantalla dicen cuál rige y de dónde sale. Filas 1.z–1.ac de fase2 a vigente; nuevas 12.a–j, 13.a, 14.a–b; retiradas 1.m–1.o (consagraban el residual fijo); 10.a recalculada. Pruebas 22.5, L.1, S.20 (antes → después) y S.36 (v5) actualizadas. Aguas abajo: quote v6 regenerado (partida de cisterna y bomba 29,000 → 36,250 MXN, precio semilla de H-196). |

| H-195 (lavaojos/regadera de emergencia como 6 UM de Hunter) | **Cerrado con fuente secundaria** (hidro v5 → v6, 25-sep-2026); **ratificar con Z358.1-2014** | Fuente: cartas de OSHA del 18-abr-2002 (Z358.1 §4.1: regadera ≥ 75.7 L/min = 20 gpm, volumen para 15 min) y del 22-nov-1993 (Z358.1-1990: lavaojos fijo ≥ 1.5 L/min = 0.4 gal/min), párrafos en `parches/normas-texto/OSHA-cartas-Z358.1_regadera-y-lavaojos.txt`. `lavaojos` pasa a «Regadera de emergencia (con o sin lavaojos)» con `emergGpm` 20; mueble nuevo `lavaojos_solo` (0.4 gpm). Ninguno entra a Hunter (0 UM; antes 6); su gasto se suma fijo al del sistema (todos a la vez, criterio de la casa) y cada tramo declara el que conduce (`qEmergLmin`, L/min; aviso si ninguno lo lleva, 0.5 % de tolerancia de redondeo). Volumen para 15 min (`volEmerg`) con aviso si la cisterna no lo guarda. Presión 21 m (30 psi) y UD (4 y 1) declarados criterio de la casa: las cartas no dan presión y 709.1 no lista el equipo (UD a H-203). Temperatura: no se calcula (Z358.1 la fija; OSHA la deja al patrón). Filas 5.a de fase2 a vigente; nuevas 5.b–c, 15.a–d, 16.a–b; prueba S.53. Proyecto fijo sin cambio de cifras. |

| H-197 (pisos sin norma: 0.5 día, ΔT 5 K, pendiente 0.5 %) | **Cerrado** (hidro v6 → v7, 25-sep-2026) | Días capturados se respetan (0 o negativos = cisterna 0, pendiente con aviso); ΔT ≤ 0 = calentador pendiente con aviso (kW 0); pendiente capturada se respeta y sólo sube a la mínima de IPC 2015 §704.1 para el diámetro del colector (releído en up.codes el 25-sep-2026), con aviso, y la memoria y el PDF dicen cuál rige. Filas 3.d, 7.a, 7.b de fase2 a vigente; nuevas 3.e, 7.c, 7.d, 7.e; prueba S.54. Proyecto fijo sin cambio de cifras. |

| H-198 (CPVC 2½–4" «SIN VERIFICAR» elegidos y cotizados; PEAD sin SDR) | **Cerrado** (hidro v7 → v8, quote v6 → v7, 25-sep-2026) | Se retiran los tres renglones de CPVC arriba de 2" CTS (Spears/Lubrizol: CTS SDR-11 no se fabrica arriba de 2"; la familia IPS queda pendiente de fuente). `sizeAgua` marca `fueraCatalogo` cuando ningún diámetro lleva el gasto a la velocidad máxima: error visible en hidro y la cotización lo manda «Por cotizar» con sus metros, sin pedir precio del tope. PEAD (`sinFuente`: diámetros genéricos sin SDR ni fuente) da error visible y toda su tubería va «Por cotizar». Fila 6.a de fase2 a vigente; nuevas 6.b–c; prueba S.55; 22.8 y CM.soporte.7 recalculadas (la general en CPVC llega a soportería con 43.59 mm en vez de 63). |

| H-196 (cisterna y bomba con precio semilla sin fuente, cotizadas siempre y aun con «Cisterna de 0 m³») | **Cerrado** (quote v7 → v8, 25-sep-2026; hidro sin cambio de cifras) | `QUOTE_SEED.bombaHP` retirado; `cisternaM3` queda sólo para la reserva contra incendio. La cisterna con volumen va «Por cotizar» (M3, con consumo diario × días); en 0 queda «pendiente de volumen». La bomba va «Por cotizar» (LOTE, con HP, gasto y CDT) sólo si `presOk` es falso; si la red alcanza, la memoria y el PDF dicen que se dimensiona como referencia y no se cotiza. Matriz de alcance del Excel: pendientes y Por cotizar también en secciones sin importe. Prueba S.57; filas 1.ad (vigente), 1.ae, 1.af; S.18/S.20/S.35/S.39/S.41/S.55/22.11 ajustadas. |

**Dependencia para elec (H-196):** la lista de cargas eléctricas sigue trayendo «Bomba de agua · X HP» (fila auto `hidro-1`, index.html ≈ 9729) aunque `presOk` sea verdadero y la bomba no haga falta. Debería omitirse o marcarse «no requerida». No se tocó (motor ajeno).

**Dependencia para soporte (H-198):** la soportería sigue contando un tramo fuera de catálogo con el diámetro tope (43.59 mm en CPVC) y un tramo de PEAD con su DI genérico. Debería dejarlos «pendiente de diámetro verificado». No se tocó la lógica de soportería (regla del motor ajeno); sólo se recalculó su caso 7 con la nueva entrada.

Defecto latente registrado (fuera del alcance de H-195, sin prueba todavía): `muebleDe(id)` devuelve el WC con fluxómetro para un
id desconocido (`|| MUEBLES[0]`), así que un mueble que no existe en la tabla se calcula como WC con fluxómetro (10 UM, 35 psi) en
vez de rechazarse. Lo mostró la prueba 16.a antes de agregar `lavaojos_solo`.

## 1. Pruebas que hoy protegen valores incorrectos (se marcan; se corrigen en la Fase 2 con su hallazgo)

| Prueba | Qué protege | Hallazgo |
|---|---|---|
| 22.5 | `cerca(H.kWbomba, 2.1511)` y `eq(H.hpBomba, 3)`: η 0.6 y redondeo a 0.5 HP sin fuente (los valores de CDT y presión mínima ya son los de la Tabla 604.3 desde H-194) | H-203 |
| 22.11 | `cerca(Σqty, 43)` da por buena la cotización con precios semilla de cisterna/bomba (los 25 + 18 m sí son los capturados) | H-196 |
| N.2 | arma la cisterna con «industria 100 L» y 1 día por omisión y sólo exige `cisterna > 0`; no ve la dotación de oficina (70 contra 50) ni el piso de 0.5 día | H-202, H-197 |
| S.34 | comprueba Hunter sólo en renglones que la suite sí trae; faltan 51 renglones de E103.3(3) (interpolación hasta −8 %) | H-203 |

Resueltas por H-194 (24-sep-2026): 22.5 `cerca(H.cdt, 6 + friccion + 15)` y `cerca(H.cdt, 25.9548)` → ahora exige presMinReq
24.6074, CDT 35.5622, 2.1511 kW y 3 HP con cifras calculadas fuera de la suite; L.1 `cerca(H.cdt, 8 + Σhf + 15)` → exige además
presMinReq 5.6246 (sin muebles rige el residual de la casa). El módulo `pruebas-motores/hidro.mjs` lista las que quedan.

## 2. Filas fase2 (valor correcto por norma que hoy la suite NO da; se exigen sólo con `CM_FASE2=1`)

| Fila | H | Esperado (fuente) | Suite hoy |
|---|---|---|---|
| ~~CM.hidro.1.z–1.ac~~ | H-194 | **vigentes desde el 24-sep-2026** (presMinReq 24.607 m, CDT 29.563 m, 1.7883 kW, 2.5 HP) | = esperado |
| ~~CM.hidro.5.a~~ | H-195 | **vigente desde el 25-sep-2026** (Qtotal 1.2618 L/s = 20 gpm fuera de Hunter; Z358.1-1990 vía OSHA, secundaria) | = esperado |
| ~~CM.hidro.1.ad~~ | H-196 | **vigente desde el 25-sep-2026** (0 partidas LOTE de hidro con importe; nuevas 1.ae bomba Por cotizar, 1.af cisterna pendiente) | = esperado |
| ~~CM.hidro.3.d, 7.a, 7.b~~ | H-197 | **vigentes desde el 25-sep-2026** (0 L con 0 días; ΔT 0; pendiente 1.0417 % de 704.1) | = esperado |
| ~~CM.hidro.6.a~~ | H-198 | **vigente desde el 25-sep-2026** (0 renglones CPVC arriba de 2" CTS) | = esperado |
| CM.hidro.1.u | H-199 | umCal 9 WSFU (E103.3(2) columna hot: lavabo público 1.5 × 4 + fregadero 3) | 7.2 (fracciones 0.6 sin fuente) |
| CM.hidro.1.v | H-199 | Qcal 0.86434 L/s (13.7 gpm, curva de tanque) | 0.73740 |
| CM.hidro.1.w | H-199 | kWcal 97.69 kW | 83.34 |
| CM.hidro.2.e | H-199 | tramo caliente con tipoUM «auto» 1.23657 L/s (curva de tanque) | 2.20816 (curva de fluxómetro del sistema) |
| CM.hidro.2.f | H-199 | ese tramo en 1 1/2" (38.23 mm) | 2" (50.42) |
| CM.hidro.1.y | H-201 (+H-203) | colector 75 mm con 30 UD al 2 % (710.1(1): 3" 36 UD a ⅛ in/ft) | 100 mm |
| CM.hidro.9.x | H-201 | `sizeDrenaje(30, 0, "colector", 2).d` = 75 | 100 (la suite trae 27 UD para 75 mm) |
| CM.hidro.9.y | H-201 | `sizeDrenaje(30, 0, "colector", 1.05).d` = 75 | 100 (la suite trae 20; IPC 36) |
| CM.hidro.9.z | H-201 | `sizeDrenaje(60, 0, "bajada", 0).d` = 100 (columna ≤ 3 intervalos: 3" = 48) | 75 (la suite trae 70 y usa la columna > 3) |
| CM.hidro.3.c | H-202 | cisterna 5,000 L (NTC-PA Tabla 3.1: oficinas 50 L/persona/día) | 7,000 (70 L sin fuente) |
| CM.hidro.1.x | H-203 | udTotal 30 DFU (IPC 709.1: WC público 1.6 gpf 4, mingitorio 4, lavabo 1, fregadero 2, manguera 0) | 52 |
| CM.hidro.9.f–j | H-203 | renglones de E103.3(3) que la suite no trae: 2, 9, 15 WSFU tanque; 25, 120 fluxómetro | interpola (−8 % a +1.3 %) |

Notas de interpretación (para el integrador; no son decisiones tomadas aquí):
- H-197: «respetar la captura» se leyó como cisterna = consumo × 0 días = 0 L (la partida queda pendiente) y ΔT = 0
  (calentador pendiente). La pendiente mínima con aviso se tomó de 704.1 para el diámetro del colector calculado (100 mm
  → ⅛ in/ft). Si el dueño prefiere «pendiente» en vez del mínimo de norma, la fila 7.b cambia.
- H-195: 75.7 L/min es la regadera (20 gpm). Z358.1 pide que en unidades combinadas regadera y lavaojos operen a la vez
  (+1.5 L/min → 77.2); la fila usa 75.7 con 1 % de tolerancia, como lo pidió el prompt. Fuente secundaria: osha.gov
  respondió 403 el 22-sep-2026; sigue BLOQUEADO hasta el texto.
- H-201/H-197: la suite usa la columna ¼ in/ft desde 2 % capturado, pero ¼ in/ft = 2.083 %; al 2 % exacto rige ⅛
  in/ft. En los casos de la hoja el resultado no cambia (se anota en cada fila).

## 3. Compuerta de mutantes (`node parches/mutantes/mutantes.mjs hidro`, 22/23-sep-2026; repetida al cierre de H-194, 24-sep-2026)

**Al cierre de H-194 (24-sep-2026): 45 mutantes · 0 vivos en lógica vigente · código de salida 0.** Vivos sólo los fase2
previstos: m12 (H-202), m14/m29/m30 (H-197), m24/m37 (H-199), m28 (H-203), m32 (H-195). m13 pasa a vigente (35 → 15 psi) y
MUERE (22.5, S.20, R.1, CM.hidro.1/.10/.12); m09 y m35 reapuntados a las líneas nuevas de la CDT, MUERTOS; nuevos m38–m45
(CDT sin mínima de norma, CDT sin residual, psi → m, mingitorio, WC de tanque, regadera, manguera, sin muebles): todos MUERTOS,
m41–m44 sólo por CM.hidro.12, m39 sólo por L.1 y CM.hidro.14, m45 sólo por L.1 y CM.hidro.13. La tabla de abajo es la corrida
de la Fase 1 (37 mutantes).

**Al cierre de H-195 (25-sep-2026), corrida de los 7 mutantes tocados (`--solo`): todos MUERTOS.** m32 reapuntado (regadera 20 →
10 gpm; ya no «6 → 60 UM») y pasa a vigente: S.53, CM.hidro.5/15. Nuevos: m46 (lavaojos 0.4 → 0.2 gpm: S.53, CM.hidro.16), m47
(el gasto de emergencia no se suma al sistema: S.53, CM.hidro.5/15/16), m48 (el tramo ignora el gasto capturado: S.53,
CM.hidro.15), m49 (15 → 10 min: S.53, CM.hidro.5/16), m50 (la regadera vuelve a Hunter con 6 UM: S.53, CM.hidro.5/15), m51 (sin
el aviso de tramo: sólo S.53). Total 51 mutantes; fase2 vivos previstos: m12, m14, m24, m28, m29, m30, m37.

**Al cierre de H-197 (25-sep-2026), corrida de los 7 mutantes tocados (`--solo`): todos MUERTOS.** m14, m29 y m30 pasan de fase2
a vigente, reapuntados a las líneas nuevas (piso de 0.5 día, de ΔT 5 K y de pendiente 0.5 % reintroducidos): S.54 y CM.hidro.3.d/.3.e,
7.a/c, 7.b/e. Nuevos: m52 (704.1 de 3" a 6" con 1/16 in/ft: S.54, CM.hidro.7.b), m53 (la pendiente capturada se ignora: S.54,
CM.hidro.7.d), m54 y m55 (sin avisos de cisterna y calentador pendientes: sólo S.54). Total 55; fase2 vivos previstos: m12 (H-202),
m24 y m37 (H-199), m28 (H-203).

**Al cierre de H-198 (25-sep-2026), corrida de los 7 mutantes tocados (`--solo`): todos MUERTOS.** m31 pasa de fase2 a vigente,
reapuntado al DI de 2" CTS (43.59 → 50 mm; el renglón de 2 1/2" ya no existe): 22.8, CM.hidro.6.b/c, CM.soporte.7. Nuevos: m56 (el
tope del catálogo no marca `fueraCatalogo`: S.55), m57 (quote cotiza el tramo fuera de catálogo con el precio del tope: S.55), m58
(quote cotiza PEAD por diámetro aunque haya precio capturado: S.55), m59 (se pide precio del tope para el tramo fuera de catálogo:
S.55), m60 y m61 (sin el error visible de fuera de catálogo / PEAD sin SDR: S.55). m58 y m59 salieron VIVOS en la primera corrida
(S.55 capturaba precio sólo para CPVC 2" y probaba `hidroDiametrosSinPrecio` con el ramal cotizable); se reforzó S.55 (PEAD con precio
en todos sus diámetros; sólo la general sin precios) y los dos murieron. Total 61; fase2 vivos previstos: m12 (H-202), m24 y m37
(H-199), m28 (H-203).

**Al cierre de H-196 (25-sep-2026), corrida de los 2 mutantes tocados (`--solo`): ambos MUERTOS.** m34 pasa de fase2 (precio semilla,
`logica: false`) a lógica vigente: la bomba se cotiza aunque la presión alcance (S.57). Nuevo m62: cisterna en 0 mandada «Por cotizar»
como «0 m³» en vez de pendiente (S.57; el primer `buscar` de dos líneas no casaba con el CRLF de index.html y salió VIVO por no
aplicarse: se reapuntó a una línea). Total 62; fase2 vivos previstos: m12 (H-202), m24 y m37 (H-199), m28 (H-203).

Resultado de la Fase 1: **37 mutantes · 0 vivos en lógica vigente · código de salida 0** (compuerta cerrada). 26 muertos (25 de
lógica vigente + m34, que no es lógica); 11 en estado fase2, de los que 9 siguen vivos (previsto) y 2 mueren igual.

| id | Qué | Estado | Resultado | Lo matan |
|---|---|---|---|---|
| hidro.m01 | Hunter 70 WSFU fluxómetro 58.0 → 50.0 gpm | vigente | MUERTO | 22.5, 22.8, R.1, CM.hidro.1, CM.hidro.10 |
| hidro.m02 | GPM_LS 0.0630902 → 0.06 | vigente | MUERTO | 22.5, 22.8, S.20, S.34, S.35, R.1 |
| hidro.m03 | Hazen-Williams D^4.87 → D^4.0 | vigente | MUERTO | 22.5, R.1, CM.hidro.1, .2, .9, .10 |
| hidro.m04 | Hazen-Williams Q^1.852 → Q^1.8 | vigente | MUERTO | 22.5, R.1, CM.hidro.1, .2, .9, .10 |
| hidro.m05 | C cobre 140 → 100 | vigente | MUERTO | 22.5, R.1, CM.hidro.1, .2, .10 |
| hidro.m06 | V máx fría 2.4 → 3.0 m/s | vigente | MUERTO | 22.5, 22.8, R.1, CM.hidro.1, .10 |
| hidro.m07 | longitud equivalente 1.3 → 1.0 | vigente | MUERTO | 22.5, R.1, CM.hidro.1, .2, .10 |
| hidro.m08 | η 0.6 → 0.9 | vigente | MUERTO | 22.5, S.20, R.1, CM.hidro.1 |
| hidro.m09 | residual en la CDT topado a 10 m | vigente | MUERTO | 22.5, L.1, S.20, R.1, CM.hidro.1, .10 |
| hidro.m10 | DI cobre 2" 50.42 → 45 mm | vigente | MUERTO | 22.5, 22.8, R.1, CM.hidro.1, .9, .10 |
| hidro.m11 | UM WC fluxómetro 10 → 5 | vigente | MUERTO | 22.5, S.20, R.1, CM.hidro.1 |
| hidro.m12 | dotación oficinas 70 → 50 (el mutante es el valor de NTC-PA) | fase2:H-202 | VIVO | sólo lo mataría afirmar 70 · fila CM.hidro.3.c |
| hidro.m13 | presMin WC fluxómetro 10.5 → 24.6 (el mutante es el valor de 604.3) | fase2:H-194 | VIVO | sólo lo mataría afirmar 10.5 · fila CM.hidro.1.z |
| hidro.m14 | sin piso de 0.5 día de reserva | fase2:H-197 | VIVO | fila CM.hidro.3.d |
| hidro.m15 | Hunter sin interpolación (escalón) | vigente | MUERTO | 22.5, 22.8, S.20, S.34, S.35, R.1 |
| hidro.m16 | velocidad sin el /4 del área | vigente | MUERTO | 22.5, 22.8, R.1, S.41, S.44, CM.hidro.1 |
| hidro.m17 | selección con el doble del límite de velocidad | vigente | MUERTO | 22.5, 22.8, R.1, S.44, CM.hidro.1, .2 |
| hidro.m18 | drenaje: tabla contra UD/4 | vigente | MUERTO | **sólo CM.hidro.9** |
| hidro.m19 | drenaje sin límite de WC por diámetro | vigente | MUERTO | **sólo CM.hidro.1, .4, .9** |
| hidro.m20 | ventilación ¼ de la bajada (906.2 pide ½) | vigente | MUERTO | **sólo CM.hidro.1, .4** |
| hidro.m21 | HP redondeados al más cercano | vigente | MUERTO | 22.5, R.1, CM.hidro.1 |
| hidro.m22 | cp del agua 4.186 → 4.0 | vigente | MUERTO | **sólo CM.hidro.1** |
| hidro.m23 | dotación industria 100 → 50 | vigente | MUERTO | **sólo CM.hidro.3.a, .3.b** |
| hidro.m24 | Qcal con la curva del sistema | fase2:H-199 | VIVO | sólo lo mataría afirmar 7.2 UM sin fuente · fila CM.hidro.1.v |
| hidro.m25 | tramo ignora el tipoUM capturado | vigente | MUERTO | **sólo CM.hidro.2** |
| hidro.m26 | 710.1(2): ramal de 100 mm 160 → 16 UD | vigente | MUERTO | **sólo CM.hidro.1, .9** |
| hidro.m27 | UM sin multiplicar por la cantidad | vigente | MUERTO | 22.5, S.20, R.1, CM.hidro.1, .4 |
| hidro.m28 | UD WC fluxómetro 8 → 4 (el mutante es el valor de 709.1) | fase2:H-203 | VIVO | sólo lo mataría afirmar 52 UD · fila CM.hidro.1.x |
| hidro.m29 | sin piso de ΔT 5 K | fase2:H-197 | VIVO | fila CM.hidro.7.a |
| hidro.m30 | sin piso de pendiente 0.5 % | fase2:H-197 | VIVO | fila CM.hidro.7.b |
| hidro.m31 | DI de CPVC 2" CTS 43.59 → 50 mm (reapuntado en H-198; antes 2 1/2" 63 → 55) | vigente | MUERTO | 22.8 (soportería lee el DI) · fila CM.hidro.6.a |
| hidro.m32 | lavaojos 6 → 60 UM | fase2:H-195 | VIVO | fila CM.hidro.5.a (BLOQUEADO, secundaria) |
| hidro.m33 | presión disponible con la mitad de la pérdida | vigente | MUERTO | 22.5, CM.hidro.1 |
| hidro.m34 | la bomba se cotiza aunque la presión alcance (reapuntado en H-196; antes precio semilla 14,500 → 0, `logica: false`) | vigente | MUERTO | S.57 |
| hidro.m35 | CDT sin la altura del edificio | vigente | MUERTO | 22.5, L.1, CM.hidro.10 |
| hidro.m36 | presión requerida = mínimo de los muebles | vigente | MUERTO | **sólo CM.hidro.11** |
| hidro.m37 | calTot sin la cantidad | fase2:H-199 | VIVO | fila CM.hidro.1.u |

En negritas: los 9 mutantes de lógica vigente que antes de la Fase 1 sobrevivían al banco y hoy sólo matan las pruebas
CM.hidro (drenaje, ventilación, agua caliente, dotación, tipoUM por tramo, presión requerida). Los fase2 vivos no
bloquean: se matan al cerrar su hallazgo, cuando la fila fase2 pase a «vigente».

## 4. No cubierto (con motivo)

- **Bomba con CDT incompleto / formal sin longitudes (H-200)**: la hoja fija hf = 0 y sinL con L = 0 (8.a, 8.b), pero no
  exige «bomba pendiente» ni el bloqueo de la formal: es decisión del dueño pendiente en PLAN-CRITICOS (no hay valor
  numérico que exigir).
- **Renglones completos de E103.3(3)**: la hoja cubre 5 renglones ausentes (9.f–j) y 5 presentes; los otros 46 ausentes
  siguen sin fila (mismo hallazgo H-203; se completan al transcribir la tabla en la Fase 2).
- **Uso privado (`umPriv`)**: sin fila. La columna privada de E103.3(2) difiere de la suite en varios muebles (H-199) y
  ningún caso de la casa lo usa; queda para la Fase 2 con la transcripción completa.
- **Extrapolación arriba de 5,000 UM y gasto abajo del primer renglón (H-204)**: sin fila; no hay renglón de norma que
  los respalde y el aviso es de texto.
- **Bajada con más de 3 intervalos de ramal**: la suite no captura intervalos; la fila 9.z exige la columna ≤ 3 (la
  conservadora) según H-201.
- **Regla de la casa de dos WC en 75 mm** (index.html:9801-9811): las filas 4.e y 9.w la fijan como *criterio de la casa*
  porque la Tabla 710.1(2) del IPC 2015 en up.codes no trae esa nota (el IPC la pone en 710.1(1) sólo como «mínimo 3"
  con WC»). No es hallazgo nuevo; se anota para que el dueño decida si se conserva.
- **Memoria/PDF/Excel del motor**: no se comparan textos (regla de la Fase 1: sólo números).
- **Colector con pendiente capturada entre 1.042 y 2 %**: la suite la trata como ⅛ in/ft (col1) — correcto — y desde
  2.0 % como ¼ in/ft aunque ¼ in/ft es 2.083 %; sin fila porque en los casos de la casa no cambia el diámetro.
- **Referencias fijas en pruebas.mjs (mutantes que matan R.1)**: varios mutantes vigentes mueren también por R.1 (golden
  de regresión); las pruebas CM.hidro los matan por su cuenta con una razón numérica declarada.

## 5. Fuentes usadas

- IPC 2015 en up.codes (primaria en línea, verificado el 22-sep-2026): E103.3(2), E103.3(3) —renglón por renglón—,
  604.3, 704.1, 709.1, 710.1(1), 710.1(2) y sus notas, 906.2.
  - https://up.codes/viewer/connecticut/ipc-2015/chapter/E/sizing-of-water-piping-system
  - https://up.codes/viewer/connecticut/ipc-2015/chapter/6/water-supply-and-distribution#604.3
  - https://up.codes/viewer/connecticut/ipc-2015/chapter/7/sanitary-drainage
- NTC para el Proyecto Arquitectónico, Tabla 3.1 (parches/normas-texto/NTC-Proyecto-Arquitectonico_dotaciones.txt,
  renglones 1061-1141): oficinas 50, industria 100 L/día.
- ASTM B88 tipo L vía CDA Copper Tube Handbook (secundaria): OD nominal + ⅛"; pared L ½" 0.040, ¾" 0.045, 1" 0.050,
  1¼" 0.055, 1½" 0.060, 2" 0.070, 2½" 0.080, 3" 0.090, 4" 0.110.
- ANSI/ISEA Z358.1-2014 vía carta OSHA 2002 (secundaria; BLOQUEADO).
- Criterios de la casa declarados en index.html: C 140 (9765), V máx 2.4/1.5 (9784), 30 % accesorios (9887), residual
  15 m (9853), η 0.6 y 0.5 HP (9968-9969), CDT (9950), presión disponible (9927), ventilación redondeada a 5 mm (9936),
  dos WC en 75 mm (9801-9811), manguera 5 UM (9702).
