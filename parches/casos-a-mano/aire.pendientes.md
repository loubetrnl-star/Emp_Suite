# aire · pendientes de la Fase 1 (rev 2.9.24)

Motor AIRE COMPRIMIDO (`aire`, v2). Hoja: `parches/casos-a-mano/aire.csv` (148 filas: 129 vigentes, 19 fase2) generada por
`parches/casos-a-mano/aire.calc.mjs` (cálculo independiente, no carga index.html). Módulo: `pruebas-motores/aire.mjs`
(8 casos). Compuerta: `parches/mutantes/aire.json` (36 mutantes; 4 en estado fase2).

## 1. Pruebas que protegen valores incorrectos (se marcan; se corrigen en la Fase 2 con su hallazgo)
| Prueba | pruebas.mjs | Qué protege | Hallazgo |
|---|---|---|---|
| R.9 | 6211 | Exige el aviso de error «clase 1.2.1 exige tubería de acero inoxidable». El aire medicinal pide cobre ASTM B819 (NFPA 99); el aviso es un criterio de la casa disfrazado de norma | H-220 |

## 2. Pruebas que no prueban el motor (se marcan, no se arreglan)
| Prueba | pruebas.mjs | Por qué no prueba |
|---|---|---|
| 6.6 | 511 | Llama `buildMemoriaPdf` (memoria HVAC) y su mensaje dice «la memoria de aire»; no toca `buildAirePdf` ni un número del motor |
| R.11 | 6242 | Arma un consumo a 7.7 bar con `presionUso` 6.0; el `bar` de cada consumo se lee y no se usa (H-219), así que la presión del caso no ejerce nada. Prueba traducciones de partidas, no números |
| R.12 | 6281 | Mismo caso que R.11; sólo busca «Tanque pulmón» en el PDF en español |

## 3. Filas fase2 (valor correcto por norma que hoy la suite NO da; se exigen sólo con `CM_FASE2=1`)
| Fila | Hallazgo | Esperado | Suite hoy | Fuente |
|---|---|---|---|---|
| CM.aire.1.m, 4.m | H-215 | secador 2,019.6 L/min (factor 1.0) | 2,459.6 (fT 0.92 × fP 0.8925) | ISO 7183:2007 Tabla 2 opción A1 (texto en normas-texto) |
| CM.aire.2.m | H-215 | 669.24 | 731.4 (fP 0.915) | ídem; a 30 °C / 7.5 bar la norma no da factor (fabricante: pendiente) |
| CM.aire.3.m | H-215 | 3,494.1 | 4,199.0 | ídem |
| CM.aire.5.m / 6.m / 7.m / 8.m | H-215 | 11,880 / 3,300 / 9,317.6 / 26,400 | 14,468 / 4,019 / 11,197 / 32,152 | ídem |
| CM.aire.3.l, 5.l, 7.l, 8.l | H-216 | tanque instalado ≥ teórico (indicador 1) con teóricos 5,829 / 13,103 / 8,793 / 13,103 L | 0 (se trunca a 5,000 L sin aviso y la memoria dice «se sube al comercial inmediato superior») | Fórmula del receptor, Atlas Copco (URL en la hoja; secundaria) |
| CM.aire.1.s | H-217 | simultaneidad 0.85 con 6 puntos (fila informativa) | 0.85 (ya pasa) | Decisión 3 del dueño: criterio de la casa declarado en pantalla y memoria, sin mover números; pasa a vigente al declararse |
| CM.aire.4.o | H-218 | troncal cobre 55 m → 1¼" con DI 32.13 mm | 1" con DI 26.6 (cédula 40) | ASTM B88 tipo L (DI = DE − 2·pared); mismos DI en `TUB_AGUA.cobre` |
| CM.aire.1.y | H-219b | 5.30 kW sobre consumo medio + 10 % fugas | 14.16 kW sobre el FAD de diseño | AUDITORIA §3.10 H-219 |
| CM.aire.1.z | H-219b | fugas 4,802 MXN/año | 10,701 | ídem |
| CM.aire.8.h / 8.i / 8.k | **H-nuevo** (sin número; lo asigna el integrador) | cp-75v 100 HP / 13,162.5 L/min / tanque teórico 13,103 L | cpo-55 **exento** 75 HP / 9,011 / 8,970 | index.html:6905-6907: el pool lubricado no se filtra por tipo y «el mayor de la lista» es el último EXENTO; para una planta 2.4.2 de 26,400 L/min propone 3 exentos (3 × 2,340,000) en vez de 3 lubricados (3 × 1,935,000) |

Notas para la Fase 2:
- **H-215**: la fila asevera FAD requerido × 1.0 (2.02 m³/min, como pide el prompt de la Fase 1). PLAN-CRITICOS §2 también dice
  «dimensionar con el caudal del compresor»: si la Fase 2 toma esa opción el esperado pasa a `principal.fadReal` × 1.0
  (2,430 L/min en el fixture) y hay que actualizar las filas `.m` y el script. Fuera del punto A1 (35 °C, 7 bar(e)) la norma no
  da factores: «pendiente de tabla del fabricante», nunca 0.92/0.9 de memoria.
- **H-216**: la expresión es un indicador (`AIRE.tanque >= AIRE.vTeorico`). Si la Fase 2 reestructura a varios tanques, hay que
  apuntarla al volumen total instalado.
- **H-217**: mutante `aire.m17` (0.85 → 0.5) queda fase2 aunque hoy lo mata el FAD del fixture: el FAD asevera un número que
  sale de la curva sin fuente. Con la decisión 3 la curva se declara y no se mueve; la fila 1.s pasa a vigente entonces.
- **H-219b**: las filas `.y/.z` cambian `AIRE.kWoper` y `AIRE.mxnFugas`; las vigentes `1.v/1.w/1.x` (14.16 kW, 141,250 y 10,701 MXN)
  quedan obsoletas al cerrar el hallazgo y se retiran en ese commit.

## 4. Mutantes en estado fase2 (se reportan; no cierran la compuerta)
| id | Qué | Estado | Por qué |
|---|---|---|---|
| aire.m12 | tope del tanque 5,000 → 200 L | fase2:H-216 | sólo se mata aseverando el tope de 5,000 L (el error) |
| aire.m16 | fT a 35 °C 0.92 → 1.0 | fase2:H-215 | el mutante ES la corrección de H-215; hoy sólo lo mata la energía (1.v), que arrastra la capacidad de hoy |
| aire.m31 | fP → 1 | fase2:H-215 | ídem (la norma no da factor de presión) |
| aire.m17 | curva 0.85 → 0.5 | fase2:H-217 | sólo se mata por números que salen de la curva sin fuente |

## 5. No cubierto en la Fase 1 (y por qué)
- **H-219 (resto)**: referencia del aire libre no declarada (ISO 1217 §3.4.3: 100 kPa / 20 °C contra los 101.325 kPa que usa la
  red; la corrección por sitio 2,132.6 contra 2,019.6 no tiene fila porque la referencia la decide el dueño); `bar` de cada consumo
  leído y no usado (máx(bar) contra `presionUso`); caída de red supuesta 0.30 aunque la calculada es 0.041. Sin fila: no hay
  valor «correcto» único hasta que se declare la referencia.
- **H-220, H-222, H-223**: textos (normas citadas, trazabilidad, NOM-020-STPS-2011, «Secador secador», unidades EN). No son números.
- **H-221**: precios de red por metro sin diámetro y tanque a 195 MXN/L: es del motor de cotización (quote); no se asevera aquí.
- **Factores del secador fuera de A1 y DI de aluminio/inox**: «pendiente de tabla del fabricante»; las filas de troncal en aluminio e
  inox aseveran el DI de cédula 40 que la suite usa hoy (35.1, 62.7, 77.9, 102.3 mm) sólo para vigilar cambios, no como norma.
- **Catálogo CONSUMIDORES** (L/min y uso por tipo): los casos capturan `lmin`/`uso` explícitos; los valores por omisión del
  catálogo (pistola 180 L/min uso 0.10, etc.) no tienen fila porque son de lista de fabricante sin fuente en el repo.
- **Piso `Math.max(.4, fT·fP)`**, aviso de succión > 40 °C, avisos y memoria en texto, PDF/Excel del motor, `cifrasMotor`: no son
  números del cálculo o ya los cubre el banco (Q.5, M.2, M.4, S.32, R.1).
- **Colebrook contra Haaland**: la hoja registra el Pa/m de Colebrook como referencia (49.803 contra 49.231 en el fixture, +1.2 %);
  no se exige porque la suite usa Haaland a propósito y el error es menor que la incertidumbre de ε.
