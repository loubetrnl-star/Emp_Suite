# Contra incendio (`fuego`, v3) · pendientes de la Fase 1 (rev 2.9.24)

## 0. Cierres de la Fase 2

| Hallazgo | Estado | Qué cambió |
|---|---|---|
| H-205 (altura heredada = promedio ponderado; escondía el rack) | **Cerrado** (fuego v2 → v3, 25-sep-2026) | `geoProyectoDe` entrega también `alturaMax`; `HEREDA["fuego.altura"]` toma la máxima (ventilación sigue con la media, que es la que renueva volumen). Estática y presión requerida al rociador más alto; aviso de rack con la altura real; campo, guía, PDF y memoria dicen «al rociador más alto». La captura propia se respeta. Prueba S.58; 3.2 corregida (6 m); CM.fuego.1 y 2 con la máxima (6 y 13 m), filas .F1–.F4 de fase2 a vigentes; mutante m14 reapuntado (máxima → promedio) y MUERTO. Proyecto fijo: 37.815 → 39.105 m, 35 HP sin cambio. |

Hoja: `fuego.csv` (190 filas: 179 vigentes, 11 fase2) · cálculo: `fuego.calc.mjs` · módulo: `pruebas-motores/fuego.mjs` ·
mutantes: `parches/mutantes/fuego.json`. Numeración de líneas: `master` en `2185dcd`.

## Pruebas que hoy protegen valores incorrectos (se marcan; se corrigen en la Fase 2 con su hallazgo)

| Prueba (pruebas.mjs) | Qué protege | Hallazgo |
|---|---|---|
| ~~`3.2`~~ | **corregida en H-205 (25-sep-2026)**: contra incendio hereda 6 m (máxima); ventilación sigue con 5.4 (media) | H-205 |
| `22.7` línea 3203 (auditoría 3201) | `eq(F.qBomba, 2500)`: consagra una bomba de 2,500 L/min (661 gpm) que no es capacidad nominal de NFPA 20 Tabla 4.9 (la de norma es 750 gpm = 2,839 L/min) | H-208 |
| `22.7` línea 3209 (auditoría 3207) | `cerca(F.qTotal, 5161.98, 0.01)`: dorado sacado de la suite; consagra el 1.15 de sobredescarga y la manguera sumada sin declararlos (5,157.6 L/min en unidades de norma) | H-213 |
| `22.7` línea 3211 (auditoría 3209) | `eq(F.hpBomba, Math.ceil(9.81 * (5000/60/1000) * F.presBomba / .65 / .746 / 5) * 5)`: tautológica, repite la fórmula del código (η 0.65 sin fuente; 35/70 HP no son tamaños NEMA) | H-209 |
| `S.32` línea 5592 (auditoría 5586) | `eq(F.areaDis, F.r.areaMin)`: compara la suite consigo misma; consagra 139 m² de operación sobre 50 m² protegidos (12 rociadores «en diseño» contra 5 instalados) | H-213 |

Filas vigentes de la hoja que documentan a propósito el valor de hoy (para que el cambio de la Fase 2 sea deliberado y
visible; su `descripcion` dice «hoy; cambia con H-nnn»): `CM.fuego.*.m/.n` (estática promedio, H-205), `.q/.r/.s`
(lista de bombas y HP, H-208/H-209), `.t` (duración baja, H-207), `CM.fuego.1.v` (bomba a 385,000 fijos, H-206),
`CM.fuego.6.n/.s` (16.3 m y 15 HP con altura y trayectoria en 0, H-210).

## Filas fase2 (valor correcto por norma que hoy la suite NO da; se exigen sólo con `CM_FASE2=1`)

| Fila | H | Esperado | Suite hoy | Fuente / edición | Carácter |
|---|---|---|---|---|---|
| ~~CM.fuego.1.F1 / .F2~~ | H-205 | **vigentes desde el 25-sep-2026** (estática 7 m; H 39.105 m) | = esperado | PLAN-CRITICOS.md §4 (regla del dueño) | memoria |
| ~~CM.fuego.2.F1–.F4~~ | H-205 | **vigentes desde el 25-sep-2026** (estática 14 m; H 46.0 m; 40 HP; aviso de rack) | = esperado | ídem | memoria |
| CM.fuego.1.F5 | H-206 | bomba «Por cotizar» (pendiente en la cotización) | partida fija 385,000 + 9,500/m³ | PLAN-CRITICOS.md §4 H-206 y decisión 6 | — |
| CM.fuego.1.F6 | H-207 | reserva 207.4 m³ (90 min) | 138.2 m³ (60 min) | NFPA 13-2016 §11.2.3.1.3 / Tabla 11.2.3.1.2 | memoria |
| CM.fuego.5.F6 | H-207 | 618.9 m³ (120 min) | 464.6 m³ (90 min) | ídem | memoria |
| CM.fuego.1.F7 | H-208 | 750 gpm = 2,839 L/min | 2,500 L/min | NFPA 20-2016 Tabla 4.9 (up.codes) | primaria |
| CM.fuego.3.F7 | H-208 | 300 gpm = 1,135.6 L/min | 1,500 L/min | ídem | primaria |
| CM.fuego.5.F7 | H-208 | 1,500 gpm = 5,678 L/min | 5,000 L/min (tope de lista, no cubre) | ídem | primaria |
| CM.fuego.1.F8 | H-209 | 40 HP (NEMA; 750 gpm × 124 ft / 3960 / 0.65 = 36.1 bhp) | 35 HP | NFPA 20-2019 §4.7.6; NEMA MG-1 | memoria |
| CM.fuego.3.F9 | H-211 | bomba y cisterna «Por cotizar» (pendiente de fuego) | nada: ni partida ni pendiente | AUDITORIA H-211; CLAUDE.md regla 6 | — |
| CM.fuego.6.F10–.F12 | H-210 | sin HP (0), aviso err y semáforo «incompleta» | 15 HP, sin aviso, semáforo «datos» | AUDITORIA H-210; CLAUDE.md regla 6 | — |

## Mutante que sólo muere afirmando el valor incorrecto

`fuego.m14` quedó `fase2:H-205` en la Fase 1 (promedio → máxima; lo mataban `3.2` y `CM.fuego.1.m/.n`, `2.m/.n` afirmando el
promedio). **Al cerrar H-205 (25-sep-2026) se invirtió** (máxima → promedio, sobre `HEREDA["fuego.altura"]`) y es lógica vigente:
MUERTO (S.58, 3.2, CM.fuego.1/2, R.1).

## Lo que NO cubre esta fase (y por qué)

- **H-212** (precios de rociador 2,850 y cisterna 9,500/m³ sin fuente; cabezal, montante y válvulas sin partida): no hay
  norma ni número esperado; sólo se documenta el importe de hoy (`CM.fuego.1.u/.v`). Se resuelve con la regla de precios
  (decisión 6, H-252).
- **H-213** (edición declarada «vigente», mín(área/cobertura, total), gabinetes de manguera preguntados, supuestos 1.15 /
  30 % / +1 m / 6.1 m/s sin fuente): son textos y decisiones de alcance, no números de norma; los supuestos quedan
  declarados en la hoja como «criterio de la casa» con línea. La densidad-área de NFPA 13 se calculó de memoria
  (2016: cap. 19; 2019+: cap. 19/Tabla 19.3.3.1.1); el texto no está en `parches/normas-texto/`.
- **H-214** (bajos de texto y numeración): no se comparan textos.
- **Puente al eléctrico** (H-209: «35 HP» con 23.78 kW a `elec`): motor de otra disciplina; se registra como dependencia
  para el integrador (elec ↔ fuego por la bomba, PLAN-CRITICOS.md §5).
- **Memoria, PDF y partidas en texto**: fuera del contrato (números con tolerancia).
- **Presión mínima de 40 psi de bomba (H-208)** y **potencia máxima de curva (H-209, 150 % del caudal)**: no hay número
  de norma en texto para fijarlos; la fila `.F8` usa el punto nominal con la bomba de NFPA 20 (36.1 bhp → 40 HP NEMA)
  y se ratifica al tener NFPA 20 §4.7.6 en texto.
- **DI de cobre y CPVC**: la suite usa los DI de acero cédula 40 para cualquier material (`DIAM_FUEGO`, index.html:10049);
  el caso `CM.fuego.9` (cobre) lo documenta tal cual. No está en la auditoría como hallazgo; se anota para el integrador.
- **Duración con supervisión (valor bajo con casilla, H-207)**: la casilla no existe todavía; la fila F6 exige el valor
  alto por omisión.
- Unidades: NFPA 13 y NFPA 20 trabajan en gpm/ft²/psi; las filas vigentes que difieren de la aritmética US en más de
  0.5 % (K80 ≠ K5.6 = 80.7; 4.1 mm/min ≠ 0.10 gpm/ft² = 4.07; 10.2 mca/bar) usan la aritmética SI declarada de la suite
  con tolerancia 0.1 % y lo dicen en `formula`.
