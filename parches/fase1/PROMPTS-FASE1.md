# Fase 1 · prompts de lanzamiento de los subagentes por motor (rev 2.9.24)

Cada motor se lanza como subagente `general-purpose` con `isolation: worktree` (rama nueva desde `master`), en
paralelo; ventilación y soportería primero. Si un subagente cae (p. ej. límite de la API) se relanza desde cero en un
worktree nuevo; las ramas a medias se borran (`git worktree remove --force`, `git branch -D`) y no se integran.

## Preámbulo común (va al inicio de cada prompt, con `<MOTOR>`, `<id>` y `<§>` sustituidos)

FASE 1 · motor <MOTOR> (`<id>`) · SuiteEmp rev 2.9.24. Trabajas en un git worktree propio (rama nueva) del repo
C:\Users\ASUS\Desktop\Emp_Suite; tu cwd es ese worktree. Idioma: español. Lee primero CLAUDE.md, pruebas-motores/LEEME.md,
parches/mutantes/LEEME.md y la sección <§> y §4 de AUDITORIA.md. Decisiones del dueño para la Fase 2: PLAN-CRITICOS.md §4.

OBJETIVO: vigilar el motor por números antes de tocar su lógica (Fase 2). Entregas, sólo archivos nuevos (no toques
index.html, pruebas.mjs ni archivos de otros motores): `parches/casos-a-mano/<id>.calc.mjs` (cálculo INDEPENDIENTE, sin
cargar index.html, imprime los esperados), `parches/casos-a-mano/<id>.csv` (columnas obligatorias del LEEME; `esperado`
nunca sale de la suite, de cifrasMotor ni del esperado de regresión), `pruebas-motores/<id>.mjs` (contrato del LEEME;
compara números con tolerancia; restaura S en finally; filas `fase2:H-nnn` = valor correcto por norma que hoy la suite NO
da, exigidas sólo con CM_FASE2=1; bloque inicial «PRUEBAS QUE PROTEGEN VALORES INCORRECTOS» con pruebas.mjs:línea y
H-nnn, sin arreglarlas), `parches/mutantes/<id>.json` (mutaciones de lógica; `buscar` único en index.html; COMPUERTA:
`node parches/mutantes/mutantes.mjs <id>` con 0 mutantes de lógica vigentes vivos; los que sólo se matan afirmando un
valor incorrecto van `estado: "fase2:H-nnn"` con fila fase2 en la hoja), `parches/casos-a-mano/<id>.pendientes.md`.

MECÁNICA: (a) el worktree no trae node_modules: desde su raíz `cmd //c "mklink /J node_modules
C:\Users\ASUS\Desktop\Emp_Suite\node_modules"` y verifica `ls node_modules/jsdom`. (b) Banco: `node pruebas.mjs index.html`
y `node pruebas.mjs index.html --base C:/Users/ASUS/Desktop/Emp_Suite/respaldo-rev-2.9.8/index-2.9.21-inicio-20260921-221100.html`,
los dos en verde antes de commitear. (c) Mutantes ~1 min cada uno; `--solo id` al iterar. (d) Temporales en `tmp-fase1/`,
sin commitear. (e) No ejecutes genera.mjs. (f) UN commit en tu rama: `Fase 1 · <id> · casos a mano, módulo de pruebas y
compuerta de mutantes` + cuerpo (casos, filas fase2, mutantes, banco) + `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
No hagas merge ni toques master.

INFORME FINAL: ruta del worktree (`git rev-parse --show-toplevel`), rama, hash, banco sin/con base, tabla de mutantes
(id, MUERTO/VIVO, qué lo mata), filas fase2 (id, H-nnn, esperado vs suite hoy), pruebas que protegen valores incorrectos,
lo no cubierto con motivo. Sin evidencia no digas «cubierto».

Informes de la auditoría (sólo lectura, reutilizar su aritmética):
C:\Users\ASUS\AppData\Local\Temp\claude\C--Users-ASUS-Desktop-Emp-Suite\038b9a41-4e95-4d20-b48d-8ceed77f82e4\scratchpad\<carpeta>\
(vent, soporte, clean, equip, duct, elec, hidro, fuego, aire, civil, cotizacion; load → transversal\carga-mano.mjs y
carga-muros-sitio.mjs). Si esa carpeta ya no existe, los casos están descritos en AUDITORIA.md §3.

## Específicos por motor

### vent (§3.5) · primero
Casos: oficina 100 m²/3 m/10 pers (Vbz 62.1 = 116.5 CFM; demanda 6 1/h = 1,059.4 CFM); fixture 700 m²/4.71 m/46 pers
(11,643.3 CFM; Vbz 688.6); almacén 200 m²/12 pers (fase2:H-157 Rp 5 → 254.3 CFM; hoy 211.9); campana muro 3.0×1.2 m
media (2,952.8 CFM; reposición 80 %); visera pesada (fase2:H-159 no permitido); rejilla 1.2×1.0 m 50 % 500 fpm (3,229.2
CFM); selección: 11,643 CFM cubre con CSW-30 (fase2:H-154), 9,041 CFM no cubre GB-360 con margen real (fase2:H-156);
cocina sin medidas → 0 (fase2:H-155). Mutantes: los 7 vivos de la auditoría (IMC a la mitad, OA 0.5·Vbz, sin margen 10 %,
reposición 20 %, rejilla ×0.5, `cubre` siempre verdadero, Vbz a la mitad) + conversiones, 62.1, IMC por tipo, área libre,
cobertura. Fuentes: ASHRAE 62.1-2016 Tabla 6.2.2.1 y guía CKV (parches/normas-texto), IMC 2021 §507.5 (up.codes).

### soporte (§3.11, §3.12) · primero
Casos: A acero ced. 40 2" agua 30 m (8.367 kg/m con ×1.10 criterio de la casa index.html:7514; 11 soportes; 25.1 kgf;
3/8" FU 0.136; Fp 8.4 kgf; φNn 699.7 kgf); B cobre 1" 20 m (1.657 kg/m; 13 soportes) y B′ cobre ¾" 20 m (fase2:H-229
MSS 1.52 m → 15; hoy 13); C ducto TR-1 1200×700 cal 20 18 m (36.0 kg/m ×1.20; 9 soportes; 87.9 kgf; 1 varilla; par de
varillas fase2:H-227 BLOQUEADO SMACNA); CPVC 3"/4" 1.8 m hoy → IPC 1.22 m (fase2:H-228); anclas termoplástico 0 hoy →
≥1 (fase2:H-228); renta 0 → 1 mes hoy (fase2:H-232 = 0); gobernado bases 3 vs 2 (fase2:H-231); regresión 88 soportes y
$385,760 (vigente). Mutantes: las 17 de la auditoría (14 vivas: φ 0.65→0.95, τcr ×10, Rp 9→90, termoplástico 3.0 m, tope
NFPA ×10, sin mínimo de mes, carga termoplástico ×10, momento trapecio /10, deflexión L/24, 1.10→1.0, SIN PESO DEL AGUA,
Fp /10, kc 7→70, cortante 0). Pruebas que protegen errores: L.2 (cobre 1.8 m, H-229), Q.3 (colgado = trabajo, H-225).
Fuentes: MSS SP-58 (PHD) e IPC 308.5 (MCP), secundarias; ASCE 7-16 / ACI 318-19: memoria.

### load (§3.2) · sin auditoría exhaustiva: revisa además envolvente, vidrio (SHGC, SOLAR, DET_SUN), barrido, ADP/BF
Casos: oficina 100 m²/3 m/10/1000 W/500 W Tijuana sin envolvente, sin infiltración, peakScan false: roomS 1,948.8 W,
roomL 425.3, OA 300 m³/h, oaS 881.9, oaL 122.3, grand 3,378.2 W = 0.9605 TR; particiones 55.44 W y piso 17.60 W
(vigente; fase2:H-121 = 0); oaL con ΔW real −3.04 g/kg → 0 (fase2:H-123); psicrometría Wo 6.423, Wi 9.467, pAtm 99.548;
DET 16 h muro N 7.8, W 19.0, cubierta 16.7 (vigente, tabla Carrier) y fase2:H-120 Mexicali (44 °C, DR 14.2): muro N 100 m²
K 0.85 → 1,428 W (+9.0 K; ASHRAE 1997 CLTDc = CLTD + (25.5 − tr) + (tm − 29.4), tm = to − DR/2), cubierta 1,414 W; dos casos
ASHRAE del laboratorio HR del fixture (des W 14.2, BS 22.8); totales del fixture (grand 54,057.49 W, tons 15.3703, cfm
16,040.63; tolerancia 0.01 %). Mutantes: QS 0.34→0.30, QL 0.83→0.70, OCC_S 70→60, OA_PERS 30→20, HAP.fan→0, PEOPLE_ST 16 h
0.9→1.0, div office 0.9→1.0, W_TON 3517→3000, exponente 5.2559→5.0, DRANGE_H 16 h, piso ΔW 0.5 (fase2:H-123), partFrac
0.12→0 (fase2:H-121).

### clean (§3.3)
Casos: ISO 7 fixture 120 m²×3 m nivel medio 45/h 2 pers: 16,200 m³/h, FFU 27, fuga 189.468, reposición 1,620, calor 3.24 kW;
ISO 5 12 m²×2.7 m 360/h: 11,664, FFU 14, cobertura 77.8 %, reposición 1,166.4, velocidad 0.347 m/s (fase2:H-129 0.45 →
15,125 m³/h); ISO 7 60 m²×3 m dp 3 → piso 5, fuga 119.83, reposición 810, FFU 14; presión negativa −10 Pa: hoy dP 5
(vigente) y fase2:H-127 |ΔP| 10 → fuga 169.46 de entrada, sin presurización; zona creada desde cuarto lights = área×12
hoy (fase2:H-128 = 0); ACH por clase «criterio de la casa» (H-130 en pendientes); FFU limpios vs carga 27 contra 36 con 60/h
(fase2:H-134); difusores B105 con caudal limpio incluido (fase2:H-135). Mutantes: 1.699→1.5, 0.827→0.5, rendija
0.003→0.001, ×1.25→1.0, oaFrac .1→.2, cobertura 0.6669→0.5, ACH nivel medio ISO 7 45→30, piso 5 Pa (fase2:H-127),
30 m³/h/persona→20, FFU 120 W→60, levelFromAch. Pruebas que protegen errores: 22.12 (H-130), S.32 (H-132), 13.4.
Fuentes: EU GMP Anexo 1 (2022) en parches/normas-texto; ISO 14644-1:2015 Cn: memoria.

### equip (§3.4)
Casos: factor de sitio (CAP_CORR criterio de la casa): VRF 0.992591, paquete 0.988355, chiller aire 0.998680; bloque del
fixture 15.320234 TR a las 14 h, objetivo 16.852258, 1×40VMA-240 19.852 TR, penalización 0.1780; terminales Producción
10.0607 TR → 5×40MBC-24 9.926 (regla 98 %), 50TC-A12; ESP 73.3197×1.15/249.089 = 0.33850; bldDiv 0.8: hoy 12.0185 TR y
fase2:H-141 = 13.657×1.1 = 15.023 (decisión 1: sólo bloque); 50TC contra Product Data (parches/normas-texto): factor
0.952 (fase2:H-143) → 50TC-A14; caudal Limpio ISO 7 14.7–16.8 % (H-145 en pendientes); catálogo 132/21/9 sin duplicados.
Mutantes: MARGIN 0.1→0.2, coef BH 0.015→0.03, altitud 0.010→0.02, 0.98→0.9, penalizaciones, 249.089→200,
`blockTons * userDiv`→`blockTons` (fase2:H-141), 400 CFM/TR→300, recorte [0.55,1.15]. Pruebas que no prueban: 12.2.2,
22.6, R.1 (sólo 3 cifras).

### duct (§3.6) · caudal en L/s
Casos: TR-1 6,000 L/s 18 m 1200×700: De 992.95, Haaland 0.5120 Pa/m (Colebrook 0.5180 de referencia), codos 17.14, total
26.36, 604.88 kg, cal 20; TR-2 3,400 L/s 12 m 900×600: 799.22, 0.5162, 19.51, 318.36; RT-1 5,000 L/s 15 m 900×750: 897.20,
0.6006, 27.45, 437.75; sistema 73.32 Pa; redondo 1,000 L/s Ø500 12 m: 0.533 Pa/m, 166.7 kg cal 20 (fase2:H-168 91.34 kg
cal 26, memoria/secundaria); grasa 500 L/s clase ½": hoy cal 22 galvanizado (fase2:H-165: decisión 7 del dueño, UMC 2018
§510.5.1 cita textual de up.codes; NFPA 96 16/18 MSG; el más exigente); respaldo 400×200 (fase2:H-166 sin partida); generación
desde carga 20/10/15 m (fase2:H-167 = 0/pendiente); fricción 0.8 objetivo vs 0.512 (fase2:H-169). Mutantes: los 9 de la
auditoría + Huebscher 0.625→0.5, ε 0.09→0.9, ρ 1.2→1.0, C 0.28→0.1, 7850→7000, 1.12→1.0, 1.219. Pruebas que no prueban:
22.6, S.27, Q.8, 5.6. Fuentes: ASHRAE 2017 cap. 21 (en línea), coeficientes ASHRAE y cuadro SMACNA 1995 (parches/normas-texto).

### elec (§3.7) · NOM completa en parches/normas-texto (cita página)
Casos: motor 15 kW 220 V 3F fp .85 L 30: I 46.31, Idis 57.89, 4 AWG, 125 A, tierra 6, 1¼" (297.9 mm²), caída 1.06 %
(vigente) y fase2:H-178 Tabla 430-250 p. 442 (20 hp/230 V 54 A → ≥ 67.5 A = 4 AWG; protección 135 → 150 A; decisión 2: hp
inmediato superior); alumbrado 9.5 kW 127 V 1F .95 L 40: 78.74 A, 1 AWG 2.60 %, 100 A, tierra 8 (vigente) y fase2:H-182
tierra 6 (250-122(b) p. 150); alimentador fixture 32.059 kVA, 84.13 A, 2 AWG, 100 A, principal 125, falla 19.68 kA → 22 kA
(vigente) y fase2:H-188 principal 175 A (430-63 p. 426); Tabla 250-122 p. 151: 400 A → 2 AWG (fase2:H-183; hoy 3), 300 A →
4 (vigente); VRF 40VMA-240 MOP 90: hoy 150 A, fase2:H-177 ≤ 90 (440-22(a) p. 449); THW-LS 620.44 mm² → 2" y THHN 511.51 →
1½" (vigente, Tabla 5 p. 1006-1007); aluminio 12 AWG con 15 A hoy → fase2:H-186 mínimo 6 AWG (310-106(a) p. 216); 240-4(c)
2×750 kcmil 836 A con 1000 A (fase2:H-184). Mutantes: los 9 de la auditoría (THW 2 AWG 86→80, tierra 400 A 3→2 fase2:H-183,
220-44, falla ×0.5, 12 AWG 20→25, agrupamiento .80→.85, 250 %→300 %, k=1, R 1 AWG) + 4 AWG 85→70, 40 °C 0.88→1.0, relleno
40→60 %, √3→2. Pruebas que protegen errores/tautológicas: 22.4, S.29, J.1/J.2, 11.6.

### hidro (§3.8)
Casos (fixture cobre; AF-GENERAL 72 UM 25 m +3; AF-RAMAL 20 UM 18 m; muebles wc_flux×4, ming_flux×2, lavabo×4, fregadero×1,
manguera×2): gasto 3.69961 L/s y 2.208157; 2" 50.42 mm V 1.8529; hf 2.39865 (L×1.3, C 140) y 1½" 2.55615; CDT 19.9548;
1.20704 kW → 2 HP (η 0.6 criterio de la casa) y fase2:H-194 con IPC 604.3 (WC fluxómetro 35 psi = 24.6 mca → CDT 29.56 m,
2.5 HP); agua caliente 4 lavabos + fregadero: hoy 7.2 UM/83.3 kW y fase2:H-199 (E103.3(2) ¾ → 9 WSFU, 13.7 gpm, 97.7 kW);
drenaje 30 DFU (709.1; fase2:H-203; hoy 52) y colector 3" (fase2:H-201); cisterna oficina 100 pers 1 día: 7,000 L hoy y
fase2:H-202 5,000 (NTC-PA Tabla 3.1); 0 días → 3 m³ hoy y fase2:H-197 pendiente; lavaojos/regadera 6 UM hoy y fase2:H-195
75.7 L/min (Z358.1 vía OSHA, secundaria); cisterna+bomba 29,000 hoy y fase2:H-196 Por cotizar; CPVC 2½" hoy y fase2:H-198
pendiente. Mutantes: Hunter renglón 70→50, GPM_LS, 4.87→4.0, C 140→100, V_MAX 2.4→3.0, 1.3→1.0, η .6→.9, residual 15→10,
DI 2" 50.42→45, UM wc_flux 10→5, dotación oficina 70→50 (fase2:H-202), presMin (fase2:H-194), piso días (fase2:H-197).
Pruebas que protegen errores: 3083, 3084, L.1 3770, 3404, N.2. Fuentes: IPC 2015/2024 (up.codes), NTC-PA (parches/normas-texto), ASTM B88.

### fuego (§3.9) · el fixture calcula con 700 m² y 4.71 m heredados
Casos: R (ordinario 2, 700 m², 4.71 m, 30+12 m, K80, C 120, cisterna): 12 en diseño, 98.01 L/min a 1.501 bar, 2,302.5 L/min,
58 rociadores, pérdidas 13.08/3.72 m, H 37.815 m, reserva 138.15 m³, bomba 2,500 L/min, 35 HP (vigente; unidades US dan
2,304.6/37.71/138.3: tolerancia 0.5 % o aritmética SI declarada); fase2:H-205 con la zona más alta (6 m): +1.29 m; zona
de 13 m: hoy 37.0/35 HP y fase2:H-205 46.1/40 HP; A ligero 300 m²/3.5 m/20+6 m/municipal 35 mca: 7, 85.7 a 1.147, 1,069.8,
15, H 38.2 (vigente), fase2:H-211 bomba y cisterna Por cotizar, fase2:H-208 bomba NFPA 20 300 gpm; B extra 1 1,000 m²/8 m:
25, 5,162.0, 108, 40.2 m, 464.6 m³ (vigente), fase2:H-207 90 min 619.4 m³, fase2:H-208 1,500 gpm; fixture 90 min 207.2 m³
(fase2:H-207); fase2:H-209 40 HP; bomba fija 385,000 (fase2:H-206 Por cotizar); área y longitudes 0 → 16.3 m/15 HP
(fase2:H-210). Mutantes: densidad ord. 2 8.1→6.1, área 139→100, cobertura 12.1→20, K80→K115, 1.15→1.0, manguera 950→0,
C 120→150, 4.87→4.0, +1 m→+0, η .65→.9, redondeo 5 HP→1, duración 60→30, lista de bombas, altura promedio (fase2:H-205).
Pruebas que protegen errores: 3.2 (358), 3201, 22.7 (3209), S.32 (5586), 3207. NFPA 13/20: memoria; NFPA 20 §4.9 en up.codes.

### aire (§3.10) · ISO 7183/8573-1/1217 en parches/normas-texto
Casos: fixture (Sopleteo 2×400 uso .5; Actuadores 4×250 uso .3; 6 bar; 2.4.2; aluminio; 60 m; 35 °C): FAD 2,019.6, 6.75 bar,
20 HP (2,430), tanque 2,419.0 → 3,000, V 4.5507 m/s en 1¼", 49.231 Pa/m, ΔP 0.04135 bar, ramal ½" 8.98 m/s, 14.16 kW
(vigente) y fase2:H-215 secador 2.02 m³/min (hoy 2.46; ISO 7183 A1 factor 1), fase2:H-217 «decisión 3: criterio de la
casa, sin mover números» (fila informativa), fase2:H-219b energía 5.30 kW; caso 2 (1.4.1; 12×20 .8 + 3×180 .1; 6.5 bar;
30 °C; 100/40 m): FAD 669.24, 7.5 bar, 10 HP, tanque 1,116.2 → 1,500, secador 731.4, ρ 9.7628, ¾" 3.8409 m/s 74.276 Pa/m
0.10399 bar, ramal ½" 2.714, 4.929 kW; caso 3 (1.2.1; 10×300 .5; inox; 50/30 m): FAD 3,494.1, 7.15 bar, 50 HP, tanque
5,829 → hoy 5,000 (fase2:H-216); cobre 55 m: hoy 1" y fase2:H-218 1¼" (DI B88 26.04); 9,000 L/min: 13,103 L → 5,000
(fase2:H-216). Mutantes: los 12 de la auditoría + fugas .10→.05, reserva .20→0, corrP .05→.10, fT 0.92→1.0
(fase2:H-215), `|| 5000` (fase2:H-216), curva .85→.5 (fase2:H-217). Pruebas que no prueban: 6.6, R.9, R.11/R.12.

### civil (§3.13)
Casos: fixture: área 700, altura media 4.714, muro 427.71 m², fracción 0.1714, muro limpio 73.32, no limpio 354.39, media
caña 31.11 ml, 13 partidas, total 3,348,872.39 (vigente) y fase2:H-243 por cuarto 3:2: 89.44 ml, 134.16 m², +147,229.88
MXN; sin cuarto limpio (oficinas 150 m²/3 m muros 48; almacén 250 m²/8 m; 2 puertas; azulejo 30; epóxico 50): muro
564.40, total 2,140,907.88, 0 clasificadas; captura a mano (300 m², 3.5 m, muro 250; cuarto 80 m²×3 m; 1 puerta limpia,
2 visores, 1 pass box): 1,809,856.64, media caña 38.10 hoy y fase2:H-243 73.03 (3:2); E3 monotonía: 134.16 m² sin muros
capturados y 30 m² con un muro de 30 (fase2:H-244 = no menor; decisión 5); E1 cuarto 300 m² en zonas de 100 (fase2:H-254
tope); E2 cuarto sin altura → no clasificado (vigente). Mutantes: 1.5→1.0, media caña ×2→×1, tope de fracción, precio
firme, puertas limpias, `demoler`, altura por omisión 2.8, `/ alturaProm`→`/ 3` (fase2:H-243), Σ partidas. Pruebas que
protegen errores: P.9 (H-253), S.18, 15.4, 15.2, golden formato 1.

### quote (§3.14) · H-250 y H-251 ya cerrados en master (S.43, S.44)
Casos: fixture: equipo 2×30RB-040 974,650.91; auxTotal 11,360,502.74; directo 12,335,153.65; indirectos 2,220,327.66;
utilidad 1,746,657.76; contingencia 1,850,273.05; flete local 308,378.84; fianzas 185,027.30; subtotal 18,645,818.26; IVA
2,983,330.92; total 21,629,149.18; USD 18.5 fechado 1,169,143.20; licitación 18,525,722.81; financiamiento 2 %: subtotal
18,892,521.33; referencia 3.1 USD/m → 57.35 MXN/m; proveedor 1,830/6.1 con IVA → 258.64; plaza Mexicali sobre importación
18,500 → hoy 19,980 (fase2:H-254 = 18,500); porcentajes sobre H (fase2:H-255 «decisión»); formal con referencias/MO/H
pendientes hoy sale (fase2:H-253); precios semilla 99.93 % del directo (fase2:H-252, decisión 6). Mutantes: 0.85→0.7,
utilidad sobre directo, IVA sobre directo, flete sobre subtotal, porTramo ignorado, 1+IVA_MX→1, plaza ×2, fxUSD.fx×2,
licitación sin un renglón, contingencia sobre subtotal. Pruebas que no prueban: 15.4, 15.2, 15.5, C.2, Q.10.
