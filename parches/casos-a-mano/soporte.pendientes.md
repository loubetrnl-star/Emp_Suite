# soporte · pendientes de la Fase 1 (rev 2.9.24)

Motor de soportería (`soporte`, v4). Hoja: `soporte.csv` (93 filas, 17 `fase2`), cálculo independiente `soporte.calc.mjs`,
módulo `pruebas-motores/soporte.mjs` (12 pruebas), compuerta `parches/mutantes/soporte.json` (47 mutantes, 7 `fase2`).

## 00. Cierres de la Fase 2

| Hallazgo | Estado | Qué cambió |
|---|---|---|
| H-232 (0 meses → 1; omisión = 3 meses) | **Cerrado** (soporte v2 → v3, 25-sep-2026) | `mesesPendiente` (sin captura) y `meses = max(0, capturado)`; sin partida de renta con 0 o sin captura; aviso en el motor y pendiente en la cotización; `defaultSoporte().mesesElevacion` null. Prueba S.71; fila 11c.a de fase2 a vigente; mutante m08 reapuntado (piso de 1 mes): MUERTO. |
| H-225 (colgado = altura de trabajo sin captura) | **Cerrado** (soporte v4 → v5, quote v12 → v13 por dependencia, 25-sep-2026) | Campo «Altura de colgado (m)» en pantalla (con la altura de trabajo como sugerencia); sin captura `colgadoPendiente`: sin partida de varilla, aviso, pendiente en la cotización. Prueba S.73; Q.3 reescrita (capturada manda; sin captura 0 ML); fila 15.g de fase2 a vigente y 11.j sin varilla (soporte.csv regenerado). Mutante m45 reapuntado (vuelve a la altura de trabajo): MUERTO. Proyecto fijo: 385,760 → 344,576 MXN. |
| H-231 (bases 3 → 2 al aceptar la instantánea) | **Cerrado** (soporte v3 → v4, 25-sep-2026) | En modo gobernado `nEquipos = snap.nEquip` (el sustituto QUOTE lleva `deSnap`). Prueba S.72; fila 11d.a de fase2 a vigente; mutante m47 reapuntado (deSnap falso): MUERTO. |

## 0. Cambios de entrada por otros motores

- **H-198 (hidro v8, 25-sep-2026):** hidro retiró el CPVC de 2½" «SIN VERIFICAR» (63 mm). En el caso 7 la general llega con el
  tope de 2" CTS (43.59 mm) marcada fuera de catálogo; se recalcularon 7.a–7.i con `soporte.calc.mjs` (peso y carga del tramo 1
  con nominal 40 en vez de 65; soportes sin cambio). **Dependencia abierta para soporte:** un tramo fuera de catálogo o de
  PEAD sin SDR no debería contarse con un diámetro que no existe: «pendiente de diámetro verificado».

## 1. Pruebas de `pruebas.mjs` que protegen valores incorrectos (no se tocan en la Fase 1)

| Prueba | Línea | Qué consagra | Hallazgo |
|---|---|---|---|
| L.2 | 3793 | cobre ½"–¾" a 1.8 m y «la misma cifra que el motor» para ½"–1¼"; MSS SP-58-2018 (PHD) da 5 ft = 1.52 m; el mínimo MSS/IPC (decisión 4) es 1.52 m | H-229 |
| ~~Q.3~~ | reescrita en H-225 (25-sep-2026): capturada manda; sin captura 0 ML y sugerencia | H-225 |
| R.1 | 5898 | golden de 385,760 MXN: contiene el colgado = trabajo, el anclaje M10 con SDS 1.0 supuesto, una varilla por soporte de ducto rectangular y las 3 bases en vivo | H-225, H-226, H-227, H-231 |
| 22.8 | 3232 | no protege un error de soportería, pero fija los diámetros de hidro (52.5/35.05 acero, 63/43.59 CPVC) que aquí son ENTRADA; si hidro los mueve en su Fase 2, truena 22.8 y CM.soporte.7/15 (precondición) | dependencia hidro |

## 2. Filas `fase2` (valor correcto que hoy la suite no da; se exigen con `CM_FASE2=1`)

| Fila | H-nnn | Esperado | Suite hoy | Fuente |
|---|---|---|---|---|
| CM.soporte.3.b / 3.c | H-229 | cobre ¾" 1.524 m → 15 soportes en 20 m | 1.8 m → 13 | mín(MSS SP-58-2018 vía PHD, IPC 2009 T308.5 vía MCP) |
| CM.soporte.4.a / 4.b | H-229 | cobre ½" y ¾" 1.524 m | 1.8 | ídem |
| CM.soporte.4.c | H-229 | cobre 2½" 2.743 m | 3.0 | ídem |
| CM.soporte.4.d | H-229 | cobre 4" 3.048 m (IPC tubing ≥ 1½" 10 ft gobierna sobre MSS 12 ft) | 3.7 | consecuencia de la decisión 4 no listada en H-229: ratificar |
| CM.soporte.4.m / 4.n | H-233 | acero 4" y 6" de plomería 3.658 m (IPC 12 ft gobierna sobre MSS 14/17 ft) | 4.3 / 5.2 | decisión 4 (mínimo de ambas); H-233 es severidad A, no está en el plan de críticos: el integrador decide si entra |
| CM.soporte.4.r / 4.s | H-228 | CPVC 4" y 6" 1.219 m | 1.8 | IPC 2009 T308.5 (CPVC ≥ 1¼": 4 ft) |
| CM.soporte.5.e | H-227 | ducto rectangular 2 varillas por soporte | 1 | SMACNA DCS Tabla 5-1 «pair» · **BLOQUEADO: requiere texto** |
| CM.soporte.7.h / 7.i | H-228 | termoplástico: 38 anclas y 304 tuercas/rondanas (una ancla y 4+4 por soporte, mismo criterio del despiece) | 0 / 0 | H-228; la cantidad exacta depende de cómo la Fase 2 sume el camino propio al despiece (ajustar la fila si se decide otro conteo) |
| ~~CM.soporte.15.g~~ | H-225 | **vigente desde el 25-sep-2026** | = esperado | «Nada se estima» (regla 6). La expresión supone que la Fase 2 deja la partida sin importe o la retira; si opta por otra señal, ajustar la expresión |
| CM.soporte.15.h | H-226 | sin SDS/estructura/f'c con fuente: 0 partidas de anclaje con importe (Por cotizar) | 1 | ídem |
| ~~CM.soporte.11c.a~~ | H-232 | **vigente desde el 25-sep-2026** | = esperado | política de pisos 2.9.16 |
| ~~CM.soporte.11d.a~~ | H-231 | **vigente desde el 25-sep-2026** | = esperado | H-231 |

## 3. Mutantes con estado `fase2` (sólo se matan afirmando un valor incorrecto)

| id | H-nnn | Por qué no se mata hoy con una prueba legítima |
|---|---|---|
| soporte.m05 | H-229 | pone los claros MSS reales en cobre ½"–1¼"; sólo L.2 lo mata, afirmando 1.8 m |
| soporte.m06 | H-228 | termoplástico > 3" a 3.0 m; sólo se mataría afirmando el 1.8 m actual (el correcto es 1.22) |
| soporte.m08 | H-232 | reapuntado al cierre: vuelve a poner el piso de 1 mes; MUERTO (S.71, 11c.a) |
| soporte.m16 | H-227 | par de varillas en ducto rectangular; lo matan R.1/S.20 afirmando 1 varilla (SMACNA bloqueado) |
| soporte.m45 | H-225 | reapuntado al cierre: sin captura vuelve a la altura de trabajo; MUERTO (S.73, Q.3, 15.g, R.1) |
| soporte.m46 | H-226 | SDS por omisión 0.5 en vez de 1.0 (valor por omisión, `logica: false`); sólo se mata afirmando el supuesto |
| soporte.m47 | H-231 | reapuntado al cierre: `deSnap` falso vuelve al conteo en vivo; MUERTO (S.72, 11d.a) |

## 4. Lo que NO quedó cubierto y por qué

- **H-224 (red contra incendio en CPVC/cobre soportada como acero):** no hay fila numérica. La tabla NFPA 13
  17.4.2.1(a) no está en texto (BLOQUEADO) y «pendiente de tabla» no es un número comparable. Cuando llegue el texto,
  la fila es `SOPORTE.porTuberia.find(g => g.etiqueta === "Contra incendio").det[0].e` con S.fuego.material = "cpvc".
- **H-230 (modo «valores propios» inventa diámetros 50/100/32 mm y 400×300):** sin fila. El valor correcto es
  «pendiente de diámetro», no un número; la Fase 2 define la señal (p. ej. nSoportes = 0 con aviso) y entonces se agrega.
- **H-235 (riostras NFPA 13 aplicadas a ductos, hidráulica y aire):** las filas 1.m/1.n/11.b/11.c vigilan la
  aritmética actual (cap. 18, de memoria) sobre TODAS las líneas; no afirman que sea correcto aplicarla fuera de
  rociadores. Severidad A, fuera del plan de críticos.
- **H-236 (varilla mínima por diámetro en hidráulica; aluminio/inoxidable como acero):** sólo se vigila la varilla
  mínima de NFPA 13 en incendio (6.c). La tabla MSS SP-58 §7.2.1 completa no está en texto.
- **H-234 (anclas con carga de servicio, sin 1.4D; τcr 4.8 declarado):** las filas 1.i–1.l y 9.a–9.c vigilan la
  aritmética ACI de la suite tal como está (de memoria). Observación de la Fase 1: con τcr = 4.8 MPa y sin borde, la
  adherencia gobierna en los cuatro anclajes del catálogo (M10 699.7, M12 1019.5, M16 1679.2, M20 2598.7 kgf), así
  que `kc_post` y `phi_conc_tension` sobre Ncb no mueven ningún número del estado; el mutante m15 se mata sólo con
  τcr = 20 MPa (9.a). ACI 318-19 cap. 17 no está en texto.
- **PP-R ≤ 1" a 0.81 m (IPC 32 in):** `espSoporte(d, fam)` no distingue PP-R de CPVC (ambos «plastico»); la fila
  requiere la firma que defina la Fase 2 de H-228.
- **Precios PU_SOP_* (referencia interna sin fuente ni fecha):** entran como ENTRADA en 11.j (385,760); la regla 6
  («Por cotizar») es de la Fase 4 (quote), no de este motor.
- **Fuentes:** MSS SP-58-2018 (PHD) e IPC 2009 T308.5 (MCP) son secundarias (URL en `soporte.calc.mjs`); ASCE 7-16
  §13.3.1, ACI 318-19 cap. 17, NFPA 13 y SMACNA DCS son de memoria: las filas con ese carácter vigilan que la
  aritmética no se mueva, no certifican la norma.

## 5. Compuerta de mutantes (resultado de `node parches/mutantes/mutantes.mjs soporte`)

Corrida del 22-sep-2026 sobre index.html rev 2.9.23 (banco 365/365): **47 mutantes · vivos en lógica vigente: 0**.

| id | Estado | Lo mata |
|---|---|---|
| m01 ESF 62.05→31 | MUERTO | Q.4, R.1, CM.soporte.1/6/11/12 |
| m02 φ 0.65→0.95 | MUERTO | CM.soporte.1 (φNn 699.7), CM.soporte.9 |
| m03 τcr ×10 | MUERTO | CM.soporte.1 (φNn) |
| m04 Rp 9→90 | MUERTO | CM.soporte.1 (Fp 8.37) |
| m05 cobre a MSS | MUERTO (fase2:H-229) | sólo L.2 y CM.soporte.4 vigentes (1¼" 2.1 ≠ 1.83) — por la razón equivocada |
| m06 termoplástico 3.0 m | VIVO (fase2:H-228) | nadie hoy; con CM_FASE2=1 lo mata CM.soporte.4.r/4.s |
| m07 tope NFPA ×10 | MUERTO | CM.soporte.6 (8 soportes) |
| m08 sin mes mínimo | VIVO (fase2:H-232) | nadie hoy; con CM_FASE2=1 lo mata CM.soporte.11c.a |
| m09 carga termoplástico ×10 | MUERTO | CM.soporte.7 (6.581 kgf) |
| m10 momento /40 | MUERTO | CM.soporte.8 |
| m11 L/24 | MUERTO | CM.soporte.8 |
| m12 1.10→1.0 | MUERTO | CM.soporte.1/2/15 (peso) |
| m13 SIN PESO DEL AGUA | MUERTO | CM.soporte.1/2/15 (peso) |
| m14 Fp /10 | MUERTO | CM.soporte.1, CM.soporte.10 |
| m15 kc 7→70 | MUERTO | CM.soporte.9 (τcr 20: desprendimiento 1345.5) |
| m16 par de varillas ducto | MUERTO (fase2:H-227) | S.20, R.1, CM.soporte.11 — afirmando 1 varilla |
| m17 cortante 0 | MUERTO | CM.soporte.1 (cortante 8.37) |
| m18 acero 2" 4.0 m | MUERTO | 22.8, CM.soporte.1/4/15 |
| m19 cobre 2" 3.4 m | MUERTO | 22.8, R.1, CM.soporte.4/11 |
| m20 ducto 3.0 m | MUERTO | S.20, R.1, CM.soporte.5/11 |
| m21 riostra long. ×2 | MUERTO | R.1, CM.soporte.1/11 |
| m22 riostra transv. ×2 | MUERTO | S.20, R.1, CM.soporte.1/11 |
| m23 7.85→7.0 | MUERTO | CM.soporte.5 |
| m24 cal. 20 0.900 | MUERTO | CM.soporte.5 |
| m25 refuerzo 1.20→1.0 | MUERTO | CM.soporte.5 |
| m26 ρ acero 7000 | MUERTO | CM.soporte.1/15 |
| m27 ρ cobre 8000 | MUERTO | CM.soporte.2 |
| m28 área 3/8" ×2 | MUERTO | CM.soporte.1 (adm 276.5) |
| m29 sin +1 | MUERTO | 22.8, S.20, R.1, CM.soporte.1/2/5 |
| m30 plástico pesa como acero | MUERTO | CM.soporte.7 |
| m31 AISLA 1.10→1.0 | MUERTO | CM.soporte.7 |
| m32 piso Fp 0.03 | MUERTO | CM.soporte.10 |
| m33 techo Fp 16 | MUERTO | CM.soporte.10 |
| m34 (1+z/h) | MUERTO | Q.2, CM.soporte.1/10 |
| m35 hef^1.0 | MUERTO | CM.soporte.1/9 |
| m36 Vsa 1.0 | MUERTO | CM.soporte.9 |
| m37 interacción 0.02 | MUERTO | CM.soporte.9 |
| m38 Fb 0.9 Fy | MUERTO | CM.soporte.8 |
| m39 selección carga/4 | MUERTO | Q.4, CM.soporte.12 |
| m40 carga sin claro | MUERTO | O.2, Q.4, CM.soporte.1/5 |
| m41 varilla mín. NFPA ½" | MUERTO | R.1, CM.soporte.11 |
| m42 tijera hasta 5 m | MUERTO | S.20, R.1, CM.soporte.11 |
| m43 hTrab +5.2 | MUERTO | S.20, R.1, CM.soporte.11 |
| m44 FS 1.0 | MUERTO | Q.1 |
| m45 colgado 0.5 m | MUERTO (fase2:H-225) | Q.3, S.20, R.1, CM.soporte.11 — afirmando colgado = trabajo |
| m46 SDS 0.5 por omisión | VIVO (fase2:H-226, no es lógica) | nadie hoy; con CM_FASE2=1 lo mata CM.soporte.15.h |
| m47 gobernado unidades 5 | VIVO (fase2:H-231) | nadie hoy; con CM_FASE2=1 lo mata CM.soporte.11d.a |
