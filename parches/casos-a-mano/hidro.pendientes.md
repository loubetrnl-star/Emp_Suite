# hidro · pendientes de la Fase 1 (rev 2.9.24, 22-sep-2026)

Motor hidrosanitario (`hidro`, v4). Entregas de la Fase 1: `hidro.calc.mjs` (cálculo independiente, imprime y escribe la
hoja), `hidro.csv` (81 filas: 55 vigentes, 26 `fase2:H-nnn`), `pruebas-motores/hidro.mjs` (17 pruebas `CM.hidro.*`),
`parches/mutantes/hidro.json` (37 mutantes; compuerta cerrada con 0 vivos en lógica vigente). Banco: 368/368 sin base, 374/374 con base. Con `CM_FASE2=1` las 26 filas
fase2 fallan hoy, ninguna pasa por casualidad (arnés `tmp-fase1/fase2-filas.mjs`, no commiteado).

## 1. Pruebas que hoy protegen valores incorrectos (se marcan; se corrigen en la Fase 2 con su hallazgo)

| pruebas.mjs | Prueba | Qué protege | Hallazgo |
|---|---|---|---|
| 3082 | 22.5 | `cerca(H.cdt, 6 + friccion + 15)`: repite la fórmula del código (tautológica) y fija el residual de 15 m | H-194 (máx(residual, 604.3 = 24.6 m)) |
| 3083 | 22.5 | `cerca(H.cdt, 25.9548)`: consagra la CDT con residual 15 m; con IPC 604.3 sería 6 + 4.9548 + 24.6075 = 35.56 m | H-194 |
| 3085 | 22.5 | `cerca(H.kWbomba, 9.81·Q·cdt/1000/.6)`: tautológica; η 0.6 sin fuente | H-203 |
| 3086 | 22.5 | `eq(H.hpBomba, 2.5)`: 2.5 HP no es potencia comercial | H-203 |
| 3770 | L.1 | `cerca(H.cdt, 8 + Σhf + 15)`: tautológica; residual 15 m en vez de la mínima de 604.3 | H-194 |
| 3404 | 22.11 | `cerca(Σqty, 43)` da por buena la cotización con la bomba de 2 HP sobre una CDT sin presión mínima de norma y con precios semilla de cisterna/bomba (los 25 + 18 m sí son los capturados) | H-194, H-196 |
| 3945 | N.2 | arma la cisterna con «industria 100 L» y 1 día por omisión y sólo exige `cisterna > 0`; no ve la dotación de oficina (70 contra 50) ni el piso de 0.5 día | H-202, H-197 |
| 5632 | S.34 | comprueba Hunter sólo en renglones que la suite sí trae; faltan 51 renglones de E103.3(3) (interpolación hasta −8 %) | H-203 |

Ninguna se tocó. El módulo `pruebas-motores/hidro.mjs` las lista en su bloque inicial.

## 2. Filas fase2 (valor correcto por norma que hoy la suite NO da; se exigen sólo con `CM_FASE2=1`)

| Fila | H | Esperado (fuente) | Suite hoy |
|---|---|---|---|
| CM.hidro.1.z | H-194 | presMinReq 24.607 m (IPC 2015 Tabla 604.3: WC fluxómetro sifónico 35 psi) | 10.5 |
| CM.hidro.1.aa | H-194 | CDT 29.563 m = 0 + 2.3989 + 2.5571 + máx(15, 24.607) | 19.955 |
| CM.hidro.1.ab | H-194 | 1.7883 kW al eje | 1.2070 |
| CM.hidro.1.ac | H-194 | 2.5 HP (con el redondeo a 0.5 HP de la casa; H-203 pide potencia comercial) | 2 |
| CM.hidro.5.a | H-195 | Qtotal 1.2618 L/s (75.7 L/min, Z358.1 vía OSHA, **secundaria**, BLOQUEADO) con sólo 1 lavaojos/regadera | 0.6587 (6 UM en Hunter) |
| CM.hidro.1.ad | H-196 | importe «Cisterna … y equipo de bombeo» 0 (Por cotizar) | 29,000 MXN (9,500 × 0 m³ + 14,500 × 2 HP) |
| CM.hidro.3.d | H-197 | cisterna 0 L con 0 días capturados (respetar captura) | 3,000 L (piso 0.5 día) |
| CM.hidro.7.a | H-197 | ΔT 0 K con 40/40 °C (calentador pendiente) | 5 K (piso) |
| CM.hidro.7.b | H-197 | pendiente 1.0417 % (IPC 704.1, ⅛ in/ft para 3"–6") con 0.2 % capturado y colector de 100 mm | 0.5 % (piso sin norma) |
| CM.hidro.6.a | H-198 | 0 renglones CPVC arriba de 2" CTS (retirar «SIN VERIFICAR») | 3 renglones (63/75/100 mm) |
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

## 3. Compuerta de mutantes (`node parches/mutantes/mutantes.mjs hidro`, 22/23-sep-2026)

Resultado: **37 mutantes · 0 vivos en lógica vigente · código de salida 0** (compuerta cerrada). 26 muertos (25 de
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
| hidro.m31 | CPVC 2 1/2" «SIN VERIFICAR» 63 → 55 mm | fase2:H-198 | MUERTO | 22.8 (soportería lee el DI) · fila CM.hidro.6.a |
| hidro.m32 | lavaojos 6 → 60 UM | fase2:H-195 | VIVO | fila CM.hidro.5.a (BLOQUEADO, secundaria) |
| hidro.m33 | presión disponible con la mitad de la pérdida | vigente | MUERTO | 22.5, CM.hidro.1 |
| hidro.m34 | precio semilla bomba 14,500 → 0 (`logica: false`) | fase2:H-196 | MUERTO | S.18, S.35 · fila CM.hidro.1.ad |
| hidro.m35 | CDT sin la altura del edificio | vigente | MUERTO | 22.5, L.1, CM.hidro.10 |
| hidro.m36 | presión requerida = mínimo de los muebles | vigente | MUERTO | **sólo CM.hidro.11** |
| hidro.m37 | calTot sin la cantidad | fase2:H-199 | VIVO | fila CM.hidro.1.u |

En negritas: los 9 mutantes de lógica vigente que antes de la Fase 1 sobrevivían al banco y hoy sólo matan las pruebas
CM.hidro (drenaje, ventilación, agua caliente, dotación, tipoUM por tramo, presión requerida). Los fase2 vivos no
bloquean: se matan al cerrar su hallazgo, cuando la fila fase2 pase a «vigente».

## 4. No cubierto (con motivo)

- **Precios semilla de cisterna/bomba (H-196)**: sólo la fila fase2 1.ad; no hay prueba vigente porque afirmar 29,000 MXN
  sería consagrar un precio sin fuente.
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
