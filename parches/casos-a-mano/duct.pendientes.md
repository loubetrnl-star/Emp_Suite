# duct · pendientes de la Fase 1 (rev 2.9.24, 25-sep-2026)

Motor de ductos (`duct`, v1). Hoja: `duct.csv` (70 filas, todas vigentes) · cálculo independiente:
`duct.calc.mjs` (no carga index.html) · módulo: `pruebas-motores/duct.mjs` (10 pruebas CM.duct.0–9) · compuerta:
`parches/mutantes/duct.json` (30 mutantes de lógica, todos vigentes y MUERTOS).

## 0. Cierres de la Fase 2

| Hallazgo | Estado | Qué cambió |
|---|---|---|
| H-166 (medidas inventadas: 400×200 sin candidato o sin caudal, 400×200 / Ø250 bloqueados) | **Cerrado** (duct v1 → v2; soporte v9 → v10 y quote v20 → v21 por dependencia; 25-sep-2026) | `calcSegment` devuelve `tramoSinMedida` (sin sección, kilos, juntas, soportes ni caída; `error`/`errorEn` como primer aviso) sin caudal, con medida bloqueada sin capturar o fuera de la serie, o sin candidato (`sizeRect` devuelve null). «sin medida» en tabla, hoja del tramo, panel de cadena, cédula, memoria y Excel (EN «no size»). Soportería: el tramo queda en `manualPendientes`, fuera de `mDucto`; cotización: la lámina queda pendiente (ES/EN). Prueba S.83; filas 7.a–7.g de fase2 a vigentes; m03/m06 reapuntados a la guarda nueva y m25–m27 nuevos: MUERTOS. Proyecto fijo: sin cambio de cifras. |
| H-167 (generar desde carga ponía 20/10/15 m y tee/salida/entrada) | **Cerrado** (duct v2 → v3; quote v21 → v22 por dependencia; 25-sep-2026) | `chainToDuct` trae sólo caudales: longitud 0 y sin accesorios (también sin los 2 codos de `defaultSegment` en el principal). Tramo sin longitud: aviso «Pendiente de longitud» y 0 juntas, esquineros y soportes (antes 1 y 1 mínimos); la cotización lo deja pendiente de longitud (ES/EN). Texto de la propuesta load>duct lo dice. Prueba S.84; filas 8.b–8.e de fase2 a vigentes; m07/m09 reapuntados, m16 al renglón nuevo, m28–m30 nuevos: MUERTOS. Proyecto fijo: sin cambio de cifras. |

## Casos
| Caso | Qué fija | Fuente |
|---|---|---|
| CM.duct.1–3 | Tramos del proyecto fijo (genera.mjs:33): TR-1 6,000 L/s 18 m → 1200×700, De 992.95, 0.5120 Pa/m, codos 17.14, 26.36 Pa, cal 20, 604.88 kg, 15 juntas, 60 esquineros, 10 soportes; TR-2 3,400 L/s 12 m → 900×600, 19.52 Pa, 318.36 kg; RT-1 5,000 L/s 15 m → 900×750, 27.45 Pa, 437.75 kg | Huebscher (ASHRAE Fundamentals 2017 cap. 21, de memoria); Darcy-Weisbach/Haaland (Colebrook +1.2 % de referencia, H-176); criterio de la casa en medida, calibre, kilos, juntas y soportes |
| CM.duct.4 | Sistema: circuito del equipo 73.32 Pa, extracción 0, 1,360.99 kg, 172.37 m², 58 hojas de 4 × 8 | ídem |
| CM.duct.5 | Redondo bloqueado Ø500 1,000 L/s 12 m: 0.5333 Pa/m, 15.11 Pa, cal 20, 166.69 kg; espiro 3 enteros + 2.856 m, 3 coples | ídem; ROUND_G sin tabla SMACNA (H-168 BLOQUEADO) |
| CM.duct.6 | Grasa 500 L/s clase ½": 350 de ancho, cal 22 (tabla + 2), aviso < 7.6 m/s | criterio de la casa; H-165 BLOQUEADO (NFPA 96 sin texto), H-162 (cita derogada) |
| CM.duct.9 | 1,500 L/s → 600×450 (con peso ×50 a la fricción saldría 650×400); extracción 1,000 L/s fuera del circuito del equipo (16.49 Pa equipo, 13.14 Pa extracción) | criterio de la casa (sizeRect; H-25) |
| CM.duct.7 | H-166 (vigente desde el 25-sep-2026): sin medida posible, bloqueada sin capturar y sin caudal → 0 kg, error visible, sin partida | «nada se estima» |
| CM.duct.8 | 4 tramos generados; H-167 (vigente desde el 25-sep-2026): 0 m, 0 accesorios, 0 kg, sin partida | «arranque en ceros» |

## Pruebas que hoy protegen valores incorrectos (se marcan, no se arreglan)
| Prueba | Dónde | Qué consagra | Hallazgo |
|---|---|---|---|
| R.1 golden | regresion-motores.esperado.json | 73.32 Pa del proyecto fijo, 48.9 Pa de ellos son los 2 codos C 0.28 que `defaultSegment` pone sin captura | H-172 (no crítico) |
| ~~13.8 y 22.6~~ | pruebas.mjs:1473, 3652 | usan `chainToDuct` con 20/10/15 m y tee/salida/entrada supuestos; sólo miran textos | H-167 |
| ~~S.27~~ | pruebas.mjs:5946 | «1 tramo(s) sin caudal» en el semáforo mientras el tramo sigue con 400×200 y kilos | H-166 |
| ~~Q.8~~ | pruebas.mjs:4891 | vigila el respaldo 400×200 de soportería, no el del motor de ductos | H-166 |

## Filas fase2 (valor correcto que hoy la suite NO da; se exigen sólo con `CM_FASE2=1`)
| Fila | H | Esperado | Suite hoy |
|---|---|---|---|
| ~~CM.duct.7.a / 7.b~~ (vigente) | H-166 | 6,000 L/s con alto máximo 200: 0 kg y error | 400×200 a 75 m/s, 162.07 kg |
| ~~CM.duct.7.c~~ (vigente) | H-166 | bloqueados sin medida: 0 kg | 400×200 y Ø250 |
| ~~CM.duct.7.d / 7.e / 7.f~~ (vigente) | H-166 | sin caudal 25 m: 0 kg, sin partida, error | 400×200, 225 kg, partida |
| ~~CM.duct.7.g~~ (vigente) | H-166 | TR-1 + tramo sin caudal: 604.88 kg | 604.88 + 225 |
| ~~CM.duct.8.b–8.e~~ (vigente) | H-167 | red generada: 0 m, 0 accesorios, 0 kg, sin partida | 55 m, tee/salida/entrada, kilos y partida |

## Mutantes
| id | Estado | Lo mata |
|---|---|---|
| m01 ROUND_G ligera, m05 Haaland, m10 Huebscher, m11 ε, m12 ρ, m13 7,000 kg/m³, m14 sin traslapes, m17 espesor cal 20, m18 ρV², m20 tolerancia 1.2, m21 RECT_G | MUERTOS | CM.duct.1–5 (y R.1/S.20) |
| m02 grasa sin +2 | MUERTO | CM.duct.6 |
| m04 esquineros ×8, m15 juntas 1.5 m, m16 soportes 3.0 m | MUERTOS | CM.duct.1–3 |
| m08 codo C 0.10 | MUERTO | CM.duct.1–5 |
| m19 peso ×50, m24 circuito con extracción | MUERTOS | CM.duct.9 |
| m22 enteros redondeados, m23 hojas truncadas | MUERTOS | CM.duct.5 / CM.duct.4 |
| m03 sin candidato → 400×200, m06 bloqueada sin medida supuesta, m25 sin caudal, m26 soportería, m27 cotización | MUERTOS (H-166) | S.83, CM.duct.7 |
| m07 principal 20 m, m09 tee/salida por ramal, m28 junta mínima, m29 aviso de longitud, m30 cotización | MUERTOS (H-167) | S.84, CM.duct.8 |

## No cubierto (con motivo)
- H-165 (grasa: 16 MSG acero / 18 inox, soldado) y H-168 (tabla SMACNA de espiral): **BLOQUEADOS**, sin texto de norma.
- H-169 (fricción constante contra el redondo ya redondeado), H-171 (clase de presión contra la presión calculada), H-172
  (2 codos por omisión), H-173–H-176: no críticos, fuera del plan de la Fase 2.
- Método por velocidad en rectangular y redondo por velocidad: sin caso (ninguna fila del plan lo pide).
