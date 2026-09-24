# elec · pendientes de la Fase 1 (rev 2.9.24)

Motor eléctrico (`elec`, v4). Hoja: `elec.csv` (85 filas: 65 vigentes, 20 fase2). Cálculo independiente: `elec.calc.mjs`.
Módulo: `pruebas-motores/elec.mjs` (13 pruebas CM.elec.1–13). Compuerta: `parches/mutantes/elec.json` (28 mutantes).
Norma: NOM-001-SEDE-2012, texto del DOF en `parches/normas-texto/NOM-001-SEDE-2012_DOF_texto.txt` (página en cada fila).

## 1. Pruebas de `pruebas.mjs` que protegen valores incorrectos o no prueban (NO se arreglan en la Fase 1)

| pruebas.mjs | prueba | qué protege | hallazgo |
|---|---|---|---|
| 3026 | 22.4 | Tautológica: `Iref` repite la fórmula del código (kW/fp, sin Tabla 430-250, sin eficiencia) y fija el principal en 175 A «porque domina el alimentador» (mayor de dos valores) | H-178, H-188 |
| 3698 | J.1 | Consagra `principal = max(alim.ocpd, ocpd del motor mayor)`; 430-63 (p. 426) pide la **suma** de la otra carga más la protección del motor | H-188 |
| 3712 | J.2 | Sin motores `principal = alim.ocpd`: repite la regla del código, no la norma | H-188 |
| 5502 | S.29 | ~~Fija tierra 6 AWG para 100/125 A con la tabla del NEC y la protección al 250 % sin 440-22~~ **Retirada (rev 2.9.24, Fase 2):** sus tierras (100 → 8, 125 → 6 AWG) son iguales en NOM y NEC y nunca pasa `motor:true`; las sondas de H-183 y H-177 la dejan verde. No protege valores incorrectos. | — |
| 777 | 11.6 | «Las hojas se alimentan de los resultados reales»: sólo busca el texto del principal en el libro; no comprueba cálculo alguno | — (no prueba) |

## 2. Filas fase2 de la hoja (valor correcto por norma que hoy la suite NO da; se exigen sólo con `CM_FASE2=1`)

| fila | H | esperado (norma, página) | suite hoy |
|---|---|---|---|
| CM.elec.1.m/n/o/p | H-178 | motor 15 kW ↔ 20 hp: I 54 A (Tabla 430-250 p. 443), Idis 67.5, protección 150 A (Tabla 430-52 p. 422), caída 1.233 % | 46.31 A, 57.89, 125 A, 1.058 % |
| CM.elec.2.i | H-182 | tierra 6 AWG cuando la fase sube de 2 a 1 AWG por caída (250-122(b) p. 150) | 8 AWG |
| CM.elec.2.j | H-190 | caída 2.740 % con la columna de tubo de acero de la Tabla 9 (p. 1011: R 0.52, XL 0.187) | 2.603 % (columna PVC, X fijo 0.19) |
| CM.elec.3.p | H-188 | principal 175 A = 125 A del ramal del motor + 26.24 A de alumbrado (430-63 p. 426) | 125 A (el mayor de dos) |
| CM.elec.4.b | H-183 | tierraDe(400) = 2 AWG (Tabla 250-122 p. 151) | **cerrado** (vigente desde H-183, elec v5) |
| CM.elec.4.e | H-183 | tierraDe(2500) = 350 kcmil (p. 151) | **cerrado** (vigente desde H-183, elec v5) |
| CM.elec.5.a/b | H-177 | 40VMA-240: protección ≤ MOP 90 A; 40MBC-24: ≤ 15 A (440-22(a) p. 449) | 150 A y 25 A (250 % general) |
| CM.elec.7.c | H-186 | aluminio 15 A → mínimo 6 AWG (Tabla 310-106(a) p. 216; sin renglón < 6 AWG en Tabla 310-15(b)(16) p. 190) | 12 AWG |
| CM.elec.8.c | H-184 | 660 A a 440 V: protección ≤ ampacidad (240-4(c) p. 102); hay que subir el conductor | 1000 A sobre 2 × 750 = 836 A |
| CM.elec.8.d | H-185 | 1900 A: protección 2500 A (240-6(a) p. 104) | 2000 A (lista cortada; queda por debajo de Idis 2375) |
| CM.elec.11.e | H-190 | 65 °C → 0.47 (Tabla 310-15(b)(2)(a) p. 186) | 0.33 (salta la banda 61-65) |
| CM.elec.11.f | H-193 | 20 °C → 1.11 (p. 186) | 1.00 (no aplica factores > 1) |
| CM.elec.12.a | H-191 | 1F3H-220, 75 kVA Z 2 %: Icc = S/(V·Z) = 17 045 A (memoria: bus infinito monofásico) | 9 841 A (divide entre √3) |
| CM.elec.12.c | H-185 | kAIC ≥ 114.1 kA (110-9 p. 29) | 100 kA (tope de la lista) |
| CM.elec.13.d/e | H-191 | 3F3H-440, motor 22 kW: 3 fases + tierra = 112.76 mm² → EMT ¾" (Cap. 10 Tabla 1 nota (3) p. 1001, Tablas 4/5) | 140.95 mm² con neutro → 1" |

### Advertencias sobre las filas fase2
- **H-178, lectura de la decisión 2.** El prompt de la Fase 1 toma 15 kW ↔ 20 hp (renglón «14.9 kW · 20 hp» de la Tabla
  430-250, que es la equivalencia comercial IEC/NEMA). La lectura estricta de la decisión 2 («hp normalizado inmediato
  superior, nunca el más cercano») da 15/0.746 = 20.1 hp → **25 hp → 68 A → Idis 85 → 3 AWG → 175 A**. Las filas
  CM.elec.1.m-p llevan 20 hp; `elec.calc.mjs` imprime la alternativa de 25 hp como «(info)». **Requiere que el dueño diga
  cuál de las dos aplica antes de cerrar H-178** (¿tolerancia de la equivalencia kW/hp de la propia tabla?).
- **H-188 depende de H-178.** CM.elec.3.p (175 A) se calcula con el ramal de hoy (125 A). Si H-178 sube el ramal del motor a
  150 A, 430-63 da 150 + 26.24 = 176.2 → **200 A**. Al cerrar ambos hay que actualizar la fila.
- **Erratas del DOF** detectadas al transcribir (no afectan valores usados): Tabla 5 (p. 1006) trae «55.68» para 10 AWG
  THW (diámetro 4.470 mm → 15.69 mm²; la suite usa 15.68, correcto); Tabla 430-250 (p. 443) trae «44» en 10 hp / 575 V.

## 3. No cubierto en la Fase 1, con motivo

| hallazgo | motivo |
|---|---|
| H-179 (valores por omisión impresos como captura: Ltablero 30 m, trafo 150 kVA/Z 4 %, distancias automáticas) | El valor correcto es «pendiente», no un número: la hoja sólo compara números. Queda para la Fase 2 con prueba de texto. |
| H-180 (kWe estimados con `estimado:false`, fp por tipo sin fuente) | Igual: es trazabilidad/etiquetas, no un número comprobable contra la norma. |
| H-181 (cotización eléctrica no sigue al cálculo: juegos × metros, tablero por capacidad) | Es del motor `quote` (partidas); fuera del alcance de `elec`. Dependencia para el integrador. |
| H-187 (bomba contra incendio como motor general, art. 695) | El texto del art. 695 (p. 827-831) está en la NOM, pero la corrección es una rama propia (no un número del cuadro actual): sin caso numérico posible hasta que exista la rama. |
| H-189 (L = 0 imprime caída 0.00 % sin aviso) | El valor correcto es «pendiente de longitud»; no es número. |
| H-192 (equivalencia THW-LS ↔ THW no declarada; sin columna de cantidad) | No mueve números; texto de memoria. Se anota en la fila CM.elec.1.k como equivalencia usada. |
| H-193 (tubo 3½" designación 89 vs 91; «factor de demanda 1.16»; resistencia Al 8 AWG) | Cosméticos; sólo el factor < 25 °C tiene fila (CM.elec.11.f). La designación 91 mm se evita en la hoja usando `tubo.area`. |
| Neutro contado en el circuito del motor de 3F4H-220 (CM.elec.1.k/l) | Se deja **vigente** como criterio de la casa declarado (index.html:9368): la NOM no dice que un motor trifásico lleve neutro, pero tampoco lo prohíbe en un sistema de 4 hilos; H-191 sólo se exige para 3F3H (CM.elec.13.d/e). Decisión pendiente del dueño. |
| 125 % compuesto con los factores de corrección | La suite exige `base·ft·fg ≥ 1.25·I`; 210-19(a)(1) y 215-2(a)(1) (p. 52, 61) piden el 125 % «antes de la aplicación de cualquier factor de ajuste o de corrección» y aparte la ampacidad corregida ≥ carga. La regla de la casa es más conservadora (nunca subdimensiona); se declara, no se corrige. |
| Corriente de falla (bus infinito) | Fórmula de memoria, no de la NOM: las filas CM.elec.3.n y CM.elec.12.a/b van con `caracter = memoria`. |
| Valores normalizados 16, 32 y 63 A de 240-6(a) | La suite no los lista (criterio de la casa, valores IEC del DOF). Sin fila: ningún caso vigente cae en ellos. |
| Cargas automáticas (tomarHVAC, cédula, ventilación, aire, hidro, fuego, FFU) | No se cubren: dependen de otros motores; los casos usan sólo cargas capturadas (`tomarHVAC:false`), como 22.4 y J.1. |

## 4. Compuerta de mutantes
`node parches/mutantes/mutantes.mjs elec` → ver la tabla en el commit. H-183 (elec v5): `elec.m02` se reapuntó al valor
correcto (tierra 400 A 2 → 3, lo mata CM.elec.4.b) y pasó a vigente; nuevos `elec.m29`–`m32` (columna de aluminio, respaldo de
cobre hasta 100 A, renglón de 5000 A).
