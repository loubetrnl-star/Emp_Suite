# load · pendientes de la Fase 1 (rev 2.9.24, 23-sep-2026)

Motor de carga térmica (`load`, v3). Hoja: `load.csv` (108 filas: 91 vigentes, 17 fase2) · cálculo independiente:
`load.calc.mjs` (no carga index.html; `node parches/casos-a-mano/load.calc.mjs --csv` regenera la hoja) · módulo:
`pruebas-motores/load.mjs` (12 pruebas CM.load.0–11) · compuerta: `parches/mutantes/load.json` (84 mutantes: 78 de lógica
vigente, 6 de lógica `fase2:H-nnn`).

Fuentes de los esperados: psicrometría ASHRAE Handbook—Fundamentals 2017 cap. 1 (ec. 3, 5-6, 20, 22, 33) vía PsychroLib
(https://raw.githubusercontent.com/psychrometrics/psychrolib/master/src/js/psychrolib.js, **secundaria**; el texto de ASHRAE
no está en `parches/normas-texto/`); ASHRAE 62.1-2016 Tabla 6.2.2.1 (Addendum s, **primaria**); corrección CLTD de ASHRAE
1997 cap. 28 vía curso CED (**secundaria**); todo lo demás es **criterio de la casa** transcrito de index.html con su línea
(la aritmética es propia: regula falsi para el ADP, Newton para el punto de rocío, barrido y dos casos reimplementados).
El caso 9 (proyecto fijo de regresión) reproduce desde cero las cuatro zonas: 54,057.486 W, 15.37034 TR, 16,040.627 CFM,
1,560 m³/h (tolerancia 0.01 %), igual que la suite, sin leer el esperado de regresión.

## Pruebas que hoy protegen valores incorrectos (se marcan, no se arreglan)
| Prueba | Dónde | Qué consagra | Hallazgo |
|---|---|---|---|
| R.1 golden por motor | pruebas.mjs:5898; `parches/regresion-motores/regresion-motores.esperado.json` (`motores.load`) | 54,057.49 W / 15.3703 TR / 16,040.63 CFM y las 4 zonas, con particiones y piso no capturados (Limpio y Laboratorio sin cubierta llevan también piso), ΔW 0.5 g/kg en el caso de enfriamiento y DET sin corrección por sitio (+0.31 K en Tijuana) | H-121, H-123, H-120 |
| S.20 | pruebas.mjs:5039 (MOVIDOS_2916 en 5062) | tons 12.904762 y cfm 5,790.236072 exactos del proyecto de formato 1 (Tijuana; particiones H-121, ΔW 0.5 H-123, DET sin corrección H-120). Además el respaldo declara los muros poniente con la llave «O» (30 y 10 m²) y la suite los tira al abrirlo: el número consagrado es el de una nave sin muro poniente | H-121, H-123, H-120, N-load-1 |
| 8.1 (sólo con `--base`) | pruebas.mjs:568 | misma carga que la base 2.9.21 para el proyecto de prueba (zonas sin cubierta → particiones + piso; Tijuana → ΔW 0.5) | H-121, H-123, H-120 |
| CM.load.1.e/.k/.m/.s, 2.g, 5.a/.c/.e/.g, 6.d, 7.b/.d, 9.* | esta hoja, estado `vigente` | fijan HOY el valor que el hallazgo corrige (cada una tiene su fila fase2 gemela o, en el caso 9, se recalcula con `load.calc.mjs` y las opciones de fase 2) | H-121, H-123, H-141, H-157, H-120 |

Fuera de R.1, S.20 y 8.1 ninguna prueba del banco afirmaba un número de carga térmica: 16.6/16.7 son relaciones, S.37 usa
rangos (latente 900–960 W) y Q.6 (pruebas.mjs:4387) promete revisar la cubierta pero arma `roof` 0 y esa comprobación se
salta en silencio (AUDITORIA §4).

## Filas fase2 (valor correcto que hoy la suite NO da; se exigen sólo con `CM_FASE2=1`)
Cada grupo se validó aplicando a una COPIA de index.html la corrección propuesta (`tmp-fase1/valida-fase2.mjs`, no se
commitea): con la corrección, las filas fase2 de ese hallazgo pasan y las vigentes gemelas caen.

| Fila | H | Esperado | Suite hoy | Carácter |
|---|---|---|---|---|
| CM.load.1.f | H-123 | ΔW usado 0 g/kg (exterior 3.04 g/kg más seco) | 0.5 | criterio (política de pisos 2.9.16) |
| CM.load.1.t | H-123 | latente de aire exterior 0 W | 122.32 W | ídem |
| CM.load.7.c | H-123 | latente de infiltración 0 W | 61.16 W | ídem |
| CM.load.1.l | H-121 | particiones 0 W | 55.44 W | «nada se estima» |
| CM.load.1.n | H-121 | piso sobre no acondicionado 0 W | 17.60 W | ídem |
| CM.load.1.z | H-121 | gran total 3,297.20 W | 3,378.18 W | ídem |
| CM.load.2.h / .i / .j | H-120 | Tijuana (+0.311 K): muro N 688.71, muro W 1,642.31, cubierta 937.93 W | 662.22 / 1,615.82 / 920.77 | secundaria (ASHRAE 1997 vía CED), tolerancia 1 % |
| CM.load.3.e / .g / .i | H-120 | Mexicali (+9.011 K): muro N 1,427.34, muro W 2,380.94, cubierta 1,416.43 W | 662.22 / 1,615.82 / 920.77 (idénticos a Tijuana) | ídem |
| CM.load.5.b / .d / .f / .h | H-141 | con bldDiv 0.8, la zona al pico: ocupantes 567, luz 712.5, equipo 405, gran total 3,378.18 W | 453.6 / 570 / 324 / 2,919.58 | decisión del dueño §4.1 («criterio Carrier, ratificar con texto») |
| CM.load.6.e | H-157 | almacén 200 m² / 12 pers: 432 m³/h (Rp 5 L/s·pers, Warehouses) | 360 (Rp 2.5 → rige Tab.45) | primaria (62.1-2016 Tabla 6.2.2.1) |

H-120 queda **BLOQUEADO parcial**: la fórmula es ASHRAE 1997 en reproducción secundaria y supone la condición base de la
tabla CLTD de ASHRAE (78 °F interior, 85 °F media); la tabla DET de la suite se declara «Carrier» sin edición, y la Tabla 20A
de Carrier no está en texto. Las filas fase2 se evalúan sólo a las 16 h: cómo convive la corrección con el piso de sombra
horario (`shadeAt`) es decisión de la Fase 2. Conversión usada: 78 °F = 25.556 °C y 85 °F = 29.444 °C (el prompt redondea
25.5/29.4; la diferencia es 0.011 K).

Al cerrar cada hallazgo: la fila pasa a `vigente`, su gemela vigente se retira, el mutante `fase2:H-nnn` pasa a `vigente`
y, si mueve el proyecto fijo, las filas CM.load.9.* se regeneran con `load.calc.mjs` pasando la opción correspondiente a
`zona()`/`barrido()`/`dosCasos()` (`pisoDW:false`, `particiones:false`, `cltd:true`, `bdZona:false`, `rp621:true`).

## Compuerta de mutantes (corrida del 23-sep-2026 contra index.html rev 2.9.24, banco 412/412)
`node parches/mutantes/mutantes.mjs load`: **84 mutantes · 84 muertos · 0 vivos en lógica vigente** (código de salida 0).
Los 6 `fase2:H-nnn` son la corrección propuesta de cada hallazgo aplicada al código: mueren porque las filas vigentes
gemelas fijan hoy el valor que el hallazgo corrige; al cerrar el hallazgo pasan a `vigente` en sentido contrario.
La columna «banco completo» es la corrida oficial (comprobaciones correctas de 412; la lista de pruebas que caen incluye
R.1, S.20, 22.12, S.37 y, en m05/m18/m25, CM.vent/CM.aire). La última columna sale de correr SÓLO `pruebas-motores/load.mjs`
contra cada copia mutada: todos los mutantes mueren por los casos a mano sin depender de R.1 ni de S.20.

| id | Qué | Estado | Banco completo | Lo matan los casos a mano (corrida sólo CM.load) |
|---|---|---|---|---|
| m01 | coeficiente sensible de aire 0.34 → 0.30 W/(m³/h·K) | vigente | MUERTO (401/412) | CM.load.1, 2, 3, 4, 7, 8, 9, 11 |
| m02 | coeficiente latente de aire 0.83 → 0.70 W/(m³/h·g/kg) | vigente | MUERTO (401/412) | CM.load.1, 2, 3, 4, 7, 8, 9 |
| m03 | sensible por persona 70 → 60 W | vigente | MUERTO (405/412) | CM.load.1, 5, 8, 9, 11 |
| m04 | latente por persona 45 → 40 W | vigente | MUERTO (406/412) | CM.load.1, 5, 8, 9 |
| m05 | Tab.45 por persona 30 → 20 m³/h | vigente | MUERTO (404/412) | CM.load.1, 8, 9 |
| m06 | Tab.45 por área 1.8 → 1.0 m³/h·m² | vigente | MUERTO (404/412) | CM.load.2, 3, 4, 6, 9 |
| m07 | calor de ventilador 2.6 % → 0 | vigente | MUERTO (403/412) | CM.load.1, 2, 4, 8, 9, 11 |
| m08 | ganancia en conductos 3 % → 0 | vigente | MUERTO (403/412) | CM.load.1, 2, 4, 8, 9, 11 |
| m09 | margen de error 5 % → 0 | vigente | MUERTO (402/412) | CM.load.1, 2, 4, 7, 8, 9, 11 |
| m10 | factor de bypass 0.15 → 0.30 | vigente | MUERTO (406/412) | CM.load.1, 8, 9 |
| m11 | almacenamiento de personas a 16 h 0.9 → 1.0 | vigente | MUERTO (405/412) | CM.load.1, 5, 8, 9, 11 |
| m12 | almacenamiento de equipo a 16 h 0.9 → 1.0 | vigente | MUERTO (406/412) | CM.load.1, 5, 9, 11 |
| m13 | almacenamiento de luces 16 h clase ligera 0.75 → 0.70 | vigente | MUERTO (406/412) | CM.load.1, 5, 9, 10, 11 |
| m14 | almacenamiento solar 16 h clase media 0.66 → 0.60 | vigente | MUERTO (410/412) | CM.load.2, 11 |
| m15 | diversidad de personas de oficina 0.9 → 1.0 | vigente | MUERTO (405/412) | CM.load.1, 5, 8, 9, 11 |
| m16 | ASHRAE 62.1 Ec. 6.2.2.1 con 3.0 en vez de 3.6 m³/h por L/s | vigente | MUERTO (411/412) | CM.load.6 |
| m17 | W por tonelada 3517 → 3000 | vigente | MUERTO (407/412) | CM.load.1, 9 |
| m18 | exponente de la presión barométrica 5.2559 → 5.0 (ASHRAE Fund. cap. 1 ec. 3) | vigente | MUERTO (394/412) | CM.load.1, 2, 3, 4, 7, 8, 9, 11 |
| m19 | DRANGE_H a las 16 h 0.00 → 0.10 (el exterior de diseño deja de ser el máximo) | vigente | MUERTO (405/412) | CM.load.1, 2, 3, 4, 7, 8, 11 |
| m20 | DRANGE_H a las 8 h 0.71 → 0.50 | vigente | MUERTO (411/412) | CM.load.4 |
| m21 | presión de saturación Hyland-Wexler: C8 −5800.2206 → −5810.2206 (ASHRAE Fund. cap. 1 ec. 6) | vigente | MUERTO (404/412) | CM.load.1, 3, 8, 9 |
| m22 | W desde bulbo húmedo: 1.006 → 1.206 en el término sensible (ec. 33) | vigente | MUERTO (408/412) | CM.load.1, 3, 8 |
| m23 | W desde HR: 0.621945 → 0.60 (ec. 20) | vigente | MUERTO (404/412) | CM.load.1, 3, 8, 9 |
| m24 | W de saturación (ADP y rocío): 0.621945 → 0.60 | vigente | MUERTO (406/412) | CM.load.1, 8, 9 |
| m25 | presión barométrica: 2.25577e-5 → 2.0e-5 | vigente | MUERTO (393/412) | CM.load.1, 2, 3, 4, 7, 8, 9, 11 |
| m26 | pendiente de la recta ESHF: cp 1.006 → 1.3 | vigente | MUERTO (407/412) | CM.load.1, 8, 9 |
| m27 | pendiente de la recta ESHF: hfg 2450 → 2000 | vigente | MUERTO (407/412) | CM.load.1, 8, 9 |
| m28 | salida del serpentín = ADP (sin bypass) | vigente | MUERTO (407/412) | CM.load.1, 8, 9 |
| m29 | ΔT mínimo de suministro 6 → 12 K | vigente | MUERTO (408/412) | CM.load.1, 9 |
| m30 | piso práctico del ADP 4.4 → 3.0 °C | vigente | MUERTO (411/412) | CM.load.8 |
| m31 | piso termodinámico del ADP 1.7 → 3.0 °C | vigente | MUERTO (411/412) | CM.load.8 |
| m32 | CFM = m³/h ÷ 1.8 en vez de 1.699 | vigente | MUERTO (407/412) | CM.load.1, 8, 9 |
| m33 | DET de sombra 7.8 → 8.8 K | vigente | MUERTO (406/412) | CM.load.2, 3, 4, 9 |
| m34 | DET de cubierta soleada 23.9 → 20 K | vigente | MUERTO (407/412) | CM.load.2, 3, 9 |
| m35 | corrección de color 0.78 → 1.0 | vigente | MUERTO (406/412) | CM.load.2, 3, 4, 9 |
| m36 | DET_SUN poniente 22.2 → 20 K | vigente | MUERTO (408/412) | CM.load.2, 3, 9 |
| m37 | SOLAR poniente 680 → 600 W/m² | vigente | MUERTO (410/412) | CM.load.2, 11 |
| m38 | SHGC del doble vidrio claro 0.70 → 0.60 | vigente | MUERTO (407/412) | CM.load.2, 4, 9, 11 |
| m39 | SUN_H oriente a las 8 h 1.00 → 0.80 | vigente | MUERTO (409/412) | CM.load.4 |
| m40 | DET_PEAK oriente 18.5 → 15 K | vigente | MUERTO (409/412) | CM.load.4 |
| m41 | ROOF_H a las 16 h 0.64 → 0.50 | vigente | MUERTO (410/412) | CM.load.2, 3 |
| m42 | atraso del muro 0.6/0.4 → 0.4/0.6 | vigente | MUERTO (408/412) | CM.load.4, 9 |
| m43 | atraso de cubierta 0.55/0.45 → 0.8/0.2 | vigente | MUERTO (407/412) | CM.load.2, 3, 9 |
| m44 | piso de sombra constante (no sigue la temperatura de la hora, H-10) | vigente | MUERTO (408/412) | CM.load.4, 9 |
| m45 | umbral de masa ligera 150 → 250 kg/m² | vigente | MUERTO (410/412) | CM.load.2, 11 |
| m46 | peso del vidrio en la masa 25 → 250 kg/m² | vigente | MUERTO (411/412) | CM.load.2 |
| m47 | estratificación en local ≥ 5 m 0.75 → 0.90 | vigente | MUERTO (409/412) | CM.load.9 |
| m48 | estratificación en local de 4–5 m 0.85 → 0.95 | vigente | MUERTO (411/412) | CM.load.10 |
| m49 | balastro fluorescente 1.2 → 1.0 | vigente | MUERTO (410/412) | CM.load.10 |
| m50 | infiltración a la mitad | vigente | MUERTO (408/412) | CM.load.7, 9 |
| m51 | cuarto limpio a presión positiva vuelve a infiltrar | vigente | MUERTO (408/412) | CM.load.9 |
| m52 | calor del ventilador de recirculación sin la eficiencia (Q·ΔP) | vigente | MUERTO (409/412) | CM.load.9 |
| m53 | sin tope del crédito sensible de aire exterior en deshumidificación | vigente | MUERTO (409/412) | CM.load.9 |
| m54 | barrido: empate dentro del 10 % en vez del 0.2 % | vigente | MUERTO (408/412) | CM.load.4, 9 |
| m55 | barrido: con empate gana la hora más cercana a las 17 h en vez de las 15 h | vigente | MUERTO (409/412) | CM.load.9 |
| m56 | caso de deshumidificación con W exterior ×0.9 | vigente | MUERTO (408/412) | CM.load.9 |
| m57 | modo «todo»: capacidad de deshumidificación ×0.9 | vigente | MUERTO (410/412) | CM.load.9 |
| m58 | modo «oa»: ADP requerido sin el bypass (Wadp = Wsup) | vigente | MUERTO (408/412) | CM.load.9 |
| m59 | modo «oa»: ADP de selección sin margen | vigente | MUERTO (408/412) | CM.load.9 |
| m60 | modo «oa»: la unidad de aire exterior se selecciona con el MENOR de sus casos | vigente | MUERTO (408/412) | CM.load.9 |
| m61 | modo «oa»: el serpentín seco se selecciona con el MENOR de sus casos | vigente | MUERTO (408/412) | CM.load.9 |
| m62 | modo «oa»: recirculación = todo el suministro (sin restar el aire exterior) | vigente | MUERTO (410/412) | CM.load.9 |
| m63 | control de humedad nunca pide dos casos | vigente | MUERTO (409/412) | CM.load.9 |
| m64 | cuarto limpio por omisión en «todo» en vez de aire exterior dedicado | vigente | MUERTO (408/412) | CM.load.9 |
| m65 | Tijuana BS de diseño 32.8 → 35 °C (ASHRAE 2021 WMO 760013) | vigente | MUERTO (399/412) | CM.load.1, 2, 4, 7, 9, 11 |
| m66 | Tijuana rango diario 9.2 → 11 K | vigente | MUERTO (406/412) | CM.load.4, 9 |
| m67 | Mexicali BH coincidente 24.8 → 23 °C (ASHRAE 2021 WMO 760053) | vigente | MUERTO (408/412) | CM.load.3, 8 |
| m68 | HR interior de diseño 50 → 45 % | vigente | MUERTO (404/412) | CM.load.1, 3, 8, 9 |
| m69 | aire exterior sin la regla por persona (máx(62.1, área)) | vigente | MUERTO (407/412) | CM.load.1, 8, 9 |
| m70 | 0.34/0.83 sin corrección por altitud | vigente | MUERTO (401/412) | CM.load.1, 2, 3, 4, 7, 8, 9, 11 |
| m71 | transmisión del vidrio con el ΔT de diseño a toda hora | vigente | MUERTO (409/412) | CM.load.4, 9 |
| m72 | insolación sin factor de almacenamiento | vigente | MUERTO (406/412) | CM.load.2, 4, 9, 11 |
| m79 | aire exterior impuesto (cascada de limpios) ignorado | vigente | MUERTO (410/412) | CM.load.11 |
| m80 | suministro estimado para la fracción de aire exterior con ΔT 8 K en vez de 11 K | vigente | MUERTO (411/412) | CM.load.11 |
| m81 | oscilación de temperatura: factor de masa media 0.03 → 0.01 | vigente | MUERTO (411/412) | CM.load.11 |
| m82 | estratificación con pleno 0.70 → 0.80 | vigente | MUERTO (411/412) | CM.load.10 |
| m83 | almacenamiento de luces 12 h clase ligera 0.55 → 0.60 | vigente | MUERTO (411/412) | CM.load.10 |
| m84 | almacenamiento de equipo 12 h 0.85 → 1.0 | vigente | MUERTO (411/412) | CM.load.10 |
| m73 | H-123 · ΔW sin el piso de 0.5 g/kg (la corrección propuesta) | fase2:H-123 | MUERTO (404/412) | CM.load.1, 2, 4, 7, 9 |
| m74 | H-121 · particiones adyacentes 12 % → 0 (la corrección propuesta) | fase2:H-121 | MUERTO (404/412) | CM.load.1, 2, 4, 8, 9, 11 |
| m75 | H-121 · piso sobre no acondicionado 10 % → 0 (la corrección propuesta) | fase2:H-121 | MUERTO (406/412) | CM.load.1, 4, 8, 9, 11 |
| m76 | H-141 · sin diversidad del edificio en la zona (la corrección propuesta) | fase2:H-141 | MUERTO (411/412) | CM.load.5 |
| m77 | H-157 · almacén con Rp 5 L/s·pers de 62.1 (la corrección propuesta) | fase2:H-157 | MUERTO (411/412) | CM.load.6 |
| m78 | H-120 · DET corregido por sitio con ASHRAE 1997 CLTD (la corrección propuesta) | fase2:H-120 | MUERTO (406/412) | CM.load.2, 3, 4, 9 |

## Hallazgos nuevos (envolvente, vidrio, barrido, ADP/BF) · sin número H; los numera el integrador
| # | Sev. | Qué | Evidencia (index.html) | Fuente / estado |
|---|---|---|---|---|
| N-load-1 | M | Al abrir un respaldo, `sanearEstado` reconstruye muros y vidrio SÓLO con las 8 llaves de ORI y descarta cualquier otra sin aviso. El respaldo de formato 1 del banco trae el poniente como «O» (Oeste): 30 m² en Producción y 10 m² en Oficinas desaparecen; el comentario dice «ni un número del proyecto viejo cambia» | 21471-21483; ejecutado: `importarRespaldo(proyecto-formato-1…)` → `walls.W = 0` y no hay línea «Muro W» | Integridad de datos. Corrección propuesta: mapear O→W (y avisar) o rechazar llaves desconocidas con aviso; S.20 cambia de número (decisión del dueño) |
| N-load-2 | B | La línea «Vidrio transmisión» imprime el ΔT sin redondear en pantalla y en la memoria PDF: «ΔT 8.799999999999997 °C» | 3395; `buildCargaPdf()` contiene «delta T 8.799999999999997 °C» | Texto de entregable (CLAUDE.md regla 8). No mueve números |
| N-load-3 | A | En el caso de deshumidificación (BS 22.8 °C < 24 °C interior) `shadeAt` devuelve el DET de sombra completo (7.8 K): muros y cubierta conservan el DET de las 16 h de enfriamiento (muro N 7.8, W 19.0, cubierta 16.7 K) mientras el vidrio transmite −1.2 K y las particiones +3 K | 3301-3305 (`if (dTdis <= 0) return DET_SHADE`); ejecutado con `SITE = sitioDeshum(...)` | Mismo origen que H-120 (DET sin corrección por la condición exterior). Afecta zonas con control de humedad y envolvente (las del proyecto fijo no tienen). BLOQUEADO con H-120 |
| N-load-4 | A | SOLAR y DET_SUN se declaran «de Carrier» sin edición ni tabla. SOLAR se usa como irradiancia × SHGC absoluto × almacenamiento. Si SOLAR es la ganancia solar de Carrier a través de vidrio ordinario, multiplicarla por el SHGC absoluto (y no por un factor de sombra relativo a ese vidrio) cuenta dos veces la transmisión del vidrio; si es irradiancia incidente, no es de Carrier. No afirmo cuál: hace falta el texto | 876-878, 3280-3289 (leyenda), 3392 | **BLOQUEADO: requiere Carrier Parte 1 (tabla de ganancia solar y factores de sombra)**. Mueve números si se confirma |
| N-load-5 | M | ROOF_H (perfil horario de cubierta) y los pesos de atraso 0.6/0.4 (muro) y 0.55/0.45 (cubierta) no aparecen en la leyenda FUENTE_HORARIA ni en H-122, que sólo declara SUN_H y DET_PEAK como estimación propia | 3253, 3273, 3330; leyenda 3289 | Sin fuente. Extender H-122 y la leyenda impresa |
| N-load-6 | M | DRANGE_H se atribuye a «ASHRAE Fundamentals cap. 14» sin edición ni tabla, y el propio comentario dice que el cero se fijó a las 16 h para reproducir la tabla DET: es un perfil ajustado por la casa. La memoria imprime «(ASHRAE Fundamentals cap. 14)» | 3255-3262, 3372 | **BLOQUEADO: requiere ASHRAE Fundamentals cap. 14 (tabla de fracción del rango diario)** |
| N-load-7 | A | Modelo ADP/BF internamente incoherente: el ESHF usa el sensible efectivo RSH + BF·OASH (supone que el serpentín recibe la mezcla con aire exterior), pero la salida del serpentín se calcula con el cuarto como entrada (`latT = ADP + BF·(ti − ADP)`) y el caudal con RSH, no con el efectivo. La EAT de mezcla se calcula y sólo se imprime | 3478, 3491, 3501, 3512 | **BLOQUEADO: requiere Carrier Parte 1 cap. 8 (aire deshumidificado)** para decidir la fórmula; no se afirma de memoria. Mueve el caudal (CFM) |
| N-load-8 | M | Criterios sin fuente ni declaración, fuera de la lista de H-124: ESHF acotado a [0.35, 0.999] antes de buscar el ADP; ΔT mínimo de suministro 6 K; búsqueda del ADP acotada a −6 °C; 70/45 W por persona; COLOR_B 0.78 para todo muro; DET_SHADE 7.8 y DET_ROOF_SUN 23.9 K; balastro fluorescente ×1.2; factores de oscilación 0.02/0.03/0.04 × 2.5 con tope 0.75; el vidrio pesa 25 kg/m² en la masa aunque el catálogo trae su peso (`gm.w`, p. ej. policarbonato 3, triple low-e 40); un solo factor de almacenamiento solar por horario y masa aplicado a la ganancia instantánea (la memoria dice «Tab. 7–12» sin edición); fracción de aire exterior sobre un suministro estimado con ΔT fijo de 11 K | 3079, 3500, 3086, 2985, 2987, 2992, 3357, 3355, 3352, 2994/3356/3374, 3459 | Declarar como criterio de la casa (texto) o citar Carrier con edición y tabla. El peso del vidrio es incoherencia de datos (mueve la clase de masa en fachadas con mucho vidrio) |
| N-load-9 | M | Valores que reviven con `null` (patrón de H-119): altura nula → 3 m (`num(z.height, 3)`); infiltración nula → 0.35 1/h (`P.ACH`) aunque la zona nueva nace con 0.4 | 3340, 3441, 3577 | «Nada se estima» (CLAUDE.md regla 6) |
| N-load-10 | B | Particiones y piso ≤ 5 W entran al sensible sin línea visible en la memoria (zona de 5 m²: 3.65 W sin renglón) | 3400-3401 contra 3445 | Trazabilidad; se resuelve con H-121 |
| N-load-11 | B | La línea de infiltración dice «qs = 0,34·qv·ΔT · ql = 0,83·qv·ΔW» pero calcula con los coeficientes corregidos por altitud (0.334/0.815 en Tijuana) | 3443 contra 3171 | Texto de entregable |
| N-load-12 | obs. | Barrido sólo de 8 a 18 h solares (SUN_H sólo tiene esas horas): una fachada poniente masiva puede picar después; con empate dentro del 0.2 % se reporta la hora más cercana a las 15 h aunque no sea el máximo (hasta −0.2 %), regla que la memoria no declara. `totals()` suma picos por zona no coincidentes: la planta hereda la suma de picos | 3242, 3546-3548, 3551, 10770 | Criterio de la casa sin declarar; la suma de picos toca a equip (H-141) |

## Lo que NO queda cubierto (y por qué)
- **Celdas intercardinales** (NE, SE, SW, NW) de SUN_H, DET_PEAK, DET_SUN y SOLAR, y las filas S/N de SUN_H fuera de las
  14 h: sólo las vigilan las relaciones 16.6/16.7 y, en parte, el proyecto fijo; no hay fila CM por celda ni mutante. Son
  estimación propia (H-122) o «Carrier» sin texto (N-load-4): fijarlas por celda sería consagrar tablas sin fuente.
- **ADP crítico** (`adpRaw < 1.7`): el caso 8 ejercita la rama de riesgo (2.59 °C → 4.4); la rama crítica no tiene fila.
- **Cuarto limpio sin Pa/η** (calor por conteo de módulos FFU): `load.calc.mjs` lo rechaza a propósito; el conteo difiere
  entre limpios y carga (H-134, motor clean).
- **Cuarto limpio a presión negativa** (infiltración) y `bldDiv` < 0.5 (tope): sin caso.
- **Sitios** Tecate, Ensenada, Hermosillo, San Luis, Rosarito y personalizado: sólo Tijuana y Mexicali. Tecate/Ensenada
  calculan el enfriamiento con datos sin fuente (H-125): no hay fila fase2 porque el valor correcto lo decide el dueño.
- **Selección de equipo** (`pickEquipment`), memoria PDF/Excel contra el cálculo y espejo EN de la carga: fuera del motor
  de cálculo (equip / entregables); sólo se detectó el defecto de texto N-load-2.
- **H-122** (SUN_H/DET_PEAK/ROOF_H publicados): sin tabla ASHRAE/Carrier en texto no hay valor correcto; las filas del
  caso 4 son vigentes «criterio de la casa» y se tendrán que recalcular cuando se sustituyan las tablas.
