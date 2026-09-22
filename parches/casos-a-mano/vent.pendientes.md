# vent · pendientes de la Fase 1 (rev 2.9.24, 22-sep-2026)

Motor de ventilación (`vent`, v1). Hoja: `vent.csv` (58 filas: 46 vigentes, 12 fase2) · cálculo independiente:
`vent.calc.mjs` · módulo: `pruebas-motores/vent.mjs` (16 pruebas CM.vent.0–15) · compuerta: `parches/mutantes/vent.json`
(34 mutantes: 27 de lógica vigente, 6 de lógica fase2:H-nnn, 1 valor por omisión fase2:H-160).

## Pruebas que hoy protegen valores incorrectos (se marcan, no se arreglan)
| Prueba | Dónde | Qué consagra | Hallazgo |
|---|---|---|---|
| R.1 golden por motor | pruebas.mjs:5898; esperado en parches/regresion-motores/regresion-motores.esperado.json (`motores.vent.cifras.primary = "GB-360"`) | Para 11,643 CFM elige GB-360 (4,000–9,000) con `cubre = false`, aunque el CSW-30 (7,000–18,000) del mismo pool cubre 12,808 CFM | H-154 |
| S.23 | pruebas.mjs:5358 | «el modo cocina sin medidas … y la cotización sigue vacía»: sólo mide `capturaReal`; la demanda da 30 CFM (piso 0.1 ft) y QUOTE.aux lleva 2 partidas de ventilación | H-155 |
| genera.mjs (fixture) | parches/regresion-motores/genera.mjs | Declara ventilación 400 m² / 6 m / 30 personas y calcula con lo heredado (700 / 4.71 / 46) | AUDITORIA.md §4 |

Fuera de R.1 ninguna prueba del banco afirmaba un número del motor: por eso sobrevivían los 7 mutantes de la auditoría.

## Filas fase2 (valor correcto por norma que hoy la suite NO da; se exigen sólo con `CM_FASE2=1`)
| Fila | H | Esperado | Suite hoy |
|---|---|---|---|
| CM.vent.2.f/2.g/2.h | H-154 | 11,643 CFM (objetivo 12,808): cubre = 1, cfmMax 18,000 (CSW-30), 0 errores | cubre 0, GB-360 (9,000), 1 error «ningún modelo cubre» |
| CM.vent.14.d | H-154 (+H-156) | 9,041 CFM (objetivo 9,945): cubre = 1 con cfmMax ≥ objetivo (CSW-22 4,000–10,000) | GB-360 con cubre = 1 y objetivo > 9,000 |
| CM.vent.5.e | H-156 | campana 2,953 CFM (objetivo 3,248): no se acepta «cubre» con objetivo > máximo (CUBE-140 3,124) | cubre = 1 por la tolerancia ×0.9 |
| CM.vent.14.c | H-156 | 9,945 > 9,000 → cubre ∧ objetivo > máximo = 0 | 1 |
| CM.vent.3.a/3.b | H-157 | almacén 200 m² / 12 pers: Rp 5 L/s·pers → 254.27 CFM | Rp 2.5 → Vbz 190.7 y rige Tab.45 211.89 |
| CM.vent.7.b | H-159 | visera con carga pesada: no permitida → 0 CFM | 300 CFM/ft inventados → 1,968.5 CFM |
| CM.vent.9.d | H-155 | rejilla sin área libre capturada → 0 CFM | piso 5 % × 400 fpm = 258.3 CFM |
| CM.vent.10.a/10.b | H-155 | cocina sin medidas → 0 CFM y 0 partidas | 30 CFM y 2 partidas (extracción y reposición) |

Al cerrar cada hallazgo en la Fase 2 la fila pasa a `vigente` y el mutante correspondiente (m20, m21, m22, m23, m31, m32)
cambia a `estado: "vigente"` (debe morir con la fila ya exigida).

## Compuerta de mutantes (corrida del 22-sep-2026 contra index.html rev 2.9.24, banco 369/369)
`node parches/mutantes/mutantes.mjs vent`: 34 mutantes · **0 vivos en lógica vigente** · 28 muertos · 6 vivos, todos
`fase2:H-nnn` o valor por omisión (se reportan, no bloquean). m01–m29 en una corrida completa; m30–m34 con `--solo`
(la corrida completa cayó por el límite de la API tras m29).

| id | Qué | Estado | Veredicto | Lo mata |
|---|---|---|---|---|
| m01 | IMC muro a la mitad | vigente | MUERTO | CM.vent.5 |
| m02 | OA = 0.5·Vbz | vigente | MUERTO | CM.vent.1, 2, 4 |
| m03 | sin margen 10 % | vigente | MUERTO | CM.vent.1, 2, 5, 14 |
| m04 | reposición 20 % | vigente | MUERTO | CM.vent.5 |
| m05 | rejilla ×0.5 | vigente | MUERTO | CM.vent.9 |
| m06 | `cubre` siempre verdadero | vigente | MUERTO | CM.vent.12 |
| m07 | Vbz a la mitad | vigente | MUERTO | CM.vent.1, 2, 4 |
| m08 | cambios/h → CFM ÷66 (general) | vigente | MUERTO | CM.vent.1, 2, 12, 13 (y S.20, R.1) |
| m09 | CFM → m³/h ×1.6 | vigente | MUERTO | CM.vent.1, 4, 5, 9 (y S.20, R.1) |
| m10 | m → ft campana ×3.0 | vigente | MUERTO | CM.vent.5, 6, 7, 8 |
| m11 | m → ft rejilla ×3.0 | vigente | MUERTO | CM.vent.9 |
| m12 | 62.1 aula Rp 2.5 | vigente | MUERTO | CM.vent.4 |
| m13 | 62.1 producción Ra 0.3 | vigente | MUERTO | CM.vent.2 |
| m14 | IMC isla media 300 | vigente | MUERTO | CM.vent.6 |
| m15 | IMC visera ligera 150 | vigente | MUERTO | CM.vent.7 |
| m16 | HOOD por área muro pesada 50 | vigente | MUERTO | CM.vent.8 |
| m17 | campana sin «rige el mayor» | vigente | MUERTO | CM.vent.8 |
| m18 | rejilla piso de velocidad 600 fpm | vigente | MUERTO | CM.vent.9 |
| m19 | cobertura tolerancia ×0.5 | vigente | MUERTO | CM.vent.12 |
| m20 | cobertura tolerancia ×0.8 | fase2:H-156 | VIVO | sólo lo mata la cobertura real (fila 5.e / 14.c con CM_FASE2=1) |
| m21 | familia preferida no manda (tier×0) | fase2:H-154 | MUERTO | **sólo R.1** (el golden que consagra GB-360): muere afirmando el valor incorrecto; por eso queda fase2 |
| m22 | piso 0.1 ft → 0.2 ft en campana | fase2:H-155 | VIVO | sólo lo mata demanda 0 sin medidas (fila 10.a con CM_FASE2=1) |
| m23 | piso área libre 5 % → 10 % | fase2:H-155 | VIVO | sólo lo mata demanda 0 sin área libre (fila 9.d con CM_FASE2=1) |
| m24 | omisión 6 → 3 cambios/h | fase2:H-160 · no es lógica | VIVO | decisión del dueño (H-160); los casos capturan `ach` a mano |
| m25 | SP + 0.35 | vigente | MUERTO | CM.vent.1, 15 (y R.1) |
| m26 | industrial sin dilución | vigente | MUERTO | CM.vent.11 |
| m27 | reposición a la mitad (modo mua) | vigente | MUERTO | CM.vent.13 |
| m28 | aviso OA > cambios/h ×10 | vigente | MUERTO | CM.vent.4 |
| m29 | cambios/h → CFM ÷66 (industrial) | vigente | MUERTO | CM.vent.11 |
| m30 | Tab.45 20 m³/h·pers | vigente | MUERTO | CM.vent.1, 2 (y S.20, R.1) |
| m31 | visera pesada 600 CFM/ft | fase2:H-159 | VIVO | sólo lo mata «no permitida → 0» (fila 7.b con CM_FASE2=1) |
| m32 | 62.1 almacén Rp 1 | fase2:H-157 | VIVO | Tab.45 tapa el Vbz mientras Rp sea 2.5 o menos; lo mata la fila 3.a con CM_FASE2=1 |
| m33 | rank: cobertura ±5 % deja de ir primero | vigente | MUERTO | CM.vent.1, 9, 13 |
| m34 | general sin aire exterior | vigente | MUERTO | CM.vent.4 |

## Hallazgos del motor sin fila fase2 (requieren decisión del dueño o texto de norma)
- **H-158** (rótulo «Aire exterior ASHRAE 62.1» sobre un valor que casi siempre sale de Tab.45): sólo rótulo. Las filas
  CM.vent.1.c y 2.c documentan que rige Tab.45 (criterio de la casa); CM.vent.1.b/2.b leen el Vbz impreso en esa línea:
  si la Fase 2 cambia el texto de la línea, hay que ajustar la expresión de esas dos filas.
- **H-160** (6 cambios/h por omisión sin fuente): decisión del dueño (0 o criterio declarado). Mutante m24 (`ach: 6 → 3`,
  valor por omisión, `logica: false`) sobrevive y se reporta como fase2:H-160. Todos los casos capturan `ach` a mano.
- **H-161** (modo reposición cotiza doble: partida «de extracción» con el modelo de la unidad de reposición + partida de
  reposición): decisión del dueño sobre «una partida por equipo real». CM.vent.13 sólo vigila mua = extracción.
- **H-162** (citas: «IMC 507.2» es 507.5; NFPA 96 no tabula CFM/ft; 500 fpm en ducto de grasa): sólo avisos/textos.
- **H-163** (herencia del proyecto completo incluido el cuarto limpio; `chainToVent` con pisos; Ez; `sp` sin definir en
  `pickVent`; «CAPS» sin Product Data): sin caso a mano. Los casos capturan área/altura/ocupantes a mano (`marcarPropio`)
  para no depender de la herencia.
- **H-164** (altura impresa 4.7 vs 4.71; faltan campanas de doble isla y backshelf): sin caso; la Tabla 507.5.2 (vía CKV)
  da doble isla 250/300/400/550 y backshelf 250/300/400 para cuando se agreguen.
- **H-35 / combustible sólido (`extra`)**: no se puede elegir en pantalla; sin caso.

## Fuentes: qué es primario y qué no
- ASHRAE 62.1-2016 Tabla 6.2.2.1 (Addendum s, `parches/normas-texto/ASHRAE-62.1-2016_Addendum-s_Tabla-6.2.2.1.txt`):
  **primaria**. Filas usadas: Office space 2.5/0.3; Classrooms (age 9 plus) 5/0.6; General manufacturing 5/0.9;
  Warehouses 5/0.3 (H-157). La misma tabla da Dwelling unit 2.5/0.3 (suite: residential Ra 0.15) y Computer (not printing)
  2.5/0.3 (suite: server Rp 0): sin fila porque no hay caso del dueño con esos tipos; quedan anotados para H-157.
- IMC 2021 Tabla 507.5.2: el texto primario (up.codes, codes.iccsafe.org) **no fue alcanzable** el 22-sep-2026 (HTTP 404 /
  403). Las filas de campana usan la reproducción de la guía CKV Design Guide 1, Tabla 1 (`parches/normas-texto/
  CKV-Design-Guide-1_campanas.txt`): **secundaria**. Al recibir el texto IMC, las filas 5.a, 6.a, 7.a, 7.b y 8.b pasan a
  primaria sin cambiar números si coinciden (muro 200/300/400/550; isla 400/500/600/700; visera 250/250/no permitida).
- Tab.45 (30 m³/h·pers, 1.8 m³/h·m²), tabla HOOD por área, «rige el mayor», reposición 80 %, SP + 0.25, margen 10 %,
  cobertura ±5 % y orden de selección: **criterio de la casa** (index.html:2986, 8534, 8569, 8583, 8604, 8619-8635). Las
  filas lo declaran así; ninguna de ellas afirma que sea norma.
- Catálogo Greenheck (index.html:872): rangos cfmMin–cfmMax sin Product Data (H-163). Las filas de selección afirman
  cobertura (0/1) y cfmMax del modelo elegido; si se sustituye el catálogo por uno con fuente, se recalculan con
  `vent.calc.mjs` (tabla CAT).

## No cubierto y por qué
- Memoria PDF / propuesta / Excel del motor (textos y cifras impresas): la Fase 1 compara números del motor, no documentos.
- `chainToVent` (cadena carga → ventilación con pisos 0.5 1/h y 0.1 m, H-163): depende de decisión del dueño sobre la
  herencia por zona.
- Ez (efectividad de distribución, 62.1 §6.2.2.1.6): el motor no lo modela; sin decisión no hay esperado.
- Carga eléctrica del extractor (H-154 «y su carga eléctrica»): es del motor `elec`; se registra como dependencia para el
  integrador (al cambiar el modelo cambia la carga automática).
- Mutante m24 (6 1/h por omisión) es valor por omisión, no lógica: se reporta, no bloquea.
