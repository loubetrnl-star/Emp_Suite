"""Verificación independiente, una fórmula por motor no congelado (decisión del dueño, 9-oct-2026).

Python es el verificador: recalcula desde la norma o la geometría con otra implementación (Pint para unidades,
fluids para fricción) y compara contra los valores que la suite dio en el arnés de Node. Python NO corre el banco:
lee un JSON con los valores de la suite (generado por un script de Node con continuacion/arnes.mjs).

Uso:  .venv-verificacion/Scripts/python.exe -X utf8 scripts/verificacion_independiente.py <valores-suite.json>
Entorno: requirements-verificacion.txt (Pint 0.26.1, fluids 1.3.1). Unidades y supuestos se imprimen por caso.
Una diferencia NO se corrige aquí: se reporta; ningún número de la suite se mueve sin aprobación del dueño.
"""
import json
import math
import sys

import pint
from fluids.friction import Colebrook

u = pint.UnitRegistry()
Q_ = u.Quantity
suite = json.load(open(sys.argv[1], encoding="utf8"))
filas = []


def fila(motor, formula, norma, v_suite, v_ind, unidad, nota=""):
    dif = (v_suite - v_ind) / v_ind * 100 if v_ind else (0.0 if v_suite == v_ind else float("inf"))
    filas.append((motor, formula, norma, v_suite, v_ind, unidad, dif, nota))


print("Supuestos generales: g = 9.80665 m/s² y ρ agua = 1000 kg/m³ (convencionales, para columna de agua); "
      "1 cfm = 1 ft³/min exacto (Pint); diferencias = (suite − independiente)/independiente.\n")

# 1 · load · corrección CLTD por sitio (ASHRAE Fundamentals 1997 vía curso CED, fuente secundaria):
#     CLTDcorr = CLTD + (78 − TR) + (TM − 85), TM = Tmax − DR/2, todo en °F.
L = suite["load"]
TR = Q_(L["TR"], u.degC).to(u.degF).magnitude
TM = Q_(L["db"], u.degC).to(u.degF).magnitude - Q_(L["range"], u.delta_degC).to(u.delta_degF).magnitude / 2
corr = Q_((78 - TR) + (TM - 85), u.delta_degF).to(u.delta_degC).magnitude
print(f"[load] TR={L['TR']} °C, Tmax={L['db']} °C, DR={L['range']} K → TR={TR:.3f} °F, TM={TM:.3f} °F; corrección en °F convertida a K")
fila("load", "ΔCLTD = (78−TR) + (TM−85) °F; TM = Tmax − DR/2",
     "ASHRAE Fund. 1997 vía CED (secundaria): parches/normas-texto/ASHRAE-1997_CLTD-correccion_extracto-curso-CED.txt:8,15,27",
     L["corr"], corr, "K")
print(f"[load] caso límite TR = 78 °F y TM = 85 °F: suite {L['limite']:.2e} K (esperado 0)")

# 2 · clean · caudal del módulo FFU: W × H × v_cara (v = 0.445 m/s, criterio de la casa dentro de la guía 0.36–0.54 m/s)
C = suite["clean"]
q = (Q_(C["W"], u.m) * Q_(C["H"], u.m) * Q_(0.445, u.m / u.s)).to(u.ft**3 / u.min).magnitude
q_lo = (Q_(C["W"], u.m) * Q_(C["H"], u.m) * Q_(0.36, u.m / u.s)).to(u.ft**3 / u.min).magnitude
q_hi = (Q_(C["W"], u.m) * Q_(C["H"], u.m) * Q_(0.54, u.m / u.s)).to(u.ft**3 / u.min).magnitude
print(f"[clean] FFU {C['W']}×{C['H']} m a 0.445 m/s; límites de la guía EU GMP 0.36–0.54 m/s → {q_lo:.1f}–{q_hi:.1f} cfm")
fila("clean", "Q_FFU = W·H·v_cara", "EU GMP Anexo 1 (2022) §4.30, 0.36–0.54 m/s (guía en el puesto de trabajo): parches/normas-texto/EU-GMP-Anexo1-2022.txt:692-693",
     C["cfm"], q, "cfm", "v_cara 0.445 m/s es criterio de la casa; el 629 es literal en el código")

# 3 · vent · Vbz = Rp·Pz + Ra·Az (ASHRAE 62.1-2016 Ec. 6.2.2.1), General manufacturing: Rp 5 L/s·p, Ra 0.9 L/s·m²
V = suite["vent"]
vbz = (Q_(5, u.L / u.s) * 10 + Q_(0.9, u.L / u.s / u.m**2) * Q_(100, u.m**2)).to(u.ft**3 / u.min).magnitude
vbz_ip = 10 * 10 + 0.18 * Q_(100, u.m**2).to(u.ft**2).magnitude
print(f"[vent] 10 personas, 100 m²; columna SI convertida = {vbz:.3f} cfm; columna I-P de la tabla (10 cfm/p, 0.18 cfm/ft²) = {vbz_ip:.3f} cfm; límite 0 personas y 0 m²: suite {V['limite']}")
fila("vent", "Vbz = Rp·Pz + Ra·Az", "ASHRAE 62.1-2016 Addendum s, Ec. 6.2.2.1 y Tabla 6.2.2.1: parches/normas-texto/ASHRAE-62.1-2016_Addendum-s_Tabla-6.2.2.1.txt:1545, 787-797",
     V["oaCfm"], vbz, "cfm", f"contra la columna I-P ({vbz_ip:.2f} cfm): {(V['oaCfm'] - vbz_ip) / vbz_ip * 100:+.2f} %")

# 4 · equip · caudal nominal 50TC-A14 (12.5 TR): Carrier rotula 3600/4200/4800/5400/6000 cfm; la central es 4800
E = suite["equip"][0]
fila("equip", "cfmNom = TR × 400 cfm/TR", "Carrier 50TC Product Data, tablas de capacidad 12.5 TONS (columna central 4800 cfm): parches/normas-texto/Carrier-50TC-7-16-03PD_Product-Data.txt:9441-9742; mín–máx 3600–6000 (608-665)",
     E["cfmNom"], 4800.0, "cfm", "A14: 384 cfm/TR en la tabla del fabricante; dentro de mín–máx")

# 5 · duct · masa por m² de lámina galvanizada calibre 20 (Nom. 0.0396 in; 8.08 kg/m² nominal)
D = suite["duct"]
kg_m2_acero = (Q_(0.0396, u.inch) * Q_(7850, u.kg / u.m**3)).to(u.kg / u.m**2).magnitude
kg_m2_smacna = Q_(1.656, u.lb / u.ft**2).to(u.kg / u.m**2).magnitude
print(f"[duct] calibre {D['gauge']}: 0.0396 in × 7850 kg/m³ = {kg_m2_acero:.4f} kg/m²; SMACNA nominal 1.656 lb/sf = {kg_m2_smacna:.3f} kg/m² (tabla: 8.08)")
print(f"[duct] balance: kg = lámina × kg/m² → {D['sheet']} m² × {D['kg_m2']:.6f} = {D['sheet'] * D['kg_m2']:.4f} kg (suite {D['kg']:.4f}); límite L = 0 → {D['kgL0']} kg")
fila("duct", "kg/m² = espesor nominal × 7850 kg/m³", "SMACNA HVAC-DCS 1995, Galvanized Sheet Thickness Tolerances (pág. A.2; transcripción HTML sin cotejo con el escaneo): normas/smacna.duct.1995.html:16027-16402",
     D["kg_m2"], kg_m2_smacna, "kg/m²", "la tabla nominal incluye el recubrimiento de zinc; el código usa acero desnudo")

# 6 · elec · caída de tensión trifásica con Ze = R·FP + XL·sen(acos FP), 8 AWG Cu en conduit de acero
El = suite["elec"]
fp, R, XL = 0.85, 2.56, 0.213
ze = R * fp + XL * math.sqrt(1 - fp * fp)
dv = (math.sqrt(3) * Q_(30, u.A) * Q_(50, u.m) * Q_(ze, u.ohm / u.km) / Q_(220, u.V)).to(u.dimensionless).magnitude * 100
dv_tabla = (math.sqrt(3) * 30 * 0.05 * 2.30 / 220) * 100
print(f"[elec] 30 A, 220 V, 3F, 50 m, FP 0.85, 8 AWG Cu (la suite eligió {El['awg']}); Tabla 9 acero: R {R}, XL {XL} Ω/km → Ze {ze:.4f} Ω/km (columna Ze de la tabla: 2.30 → ΔV {dv_tabla:.4f} %); suite X = {El['X_KM']} Ω/km; límite L = 0 → suite dv {El['limite']}")
fila("elec", "ΔV% = √3·I·L·(R·FP + XL·sen φ)/V·100", "NOM-001-SEDE-2012 Cap. 10 Tabla 9 y nota 2 (DOF): parches/normas-texto/NOM-001-SEDE-2012_DOF_texto.txt:71035, 71085-71100, 71427-71430",
     El["dv"], dv, "%", "la suite usa XL 0.19 fijo; la Tabla 9 da 0.213 para 8 AWG en acero (0.171 en PVC)")

# 7 · hidro · presión mínima del WC con fluxómetro: 35 psi → m de columna de agua
H = suite["hidro"]
mca = lambda psi: (Q_(psi, u.psi) / (Q_(1000, u.kg / u.m**3) * Q_(9.80665, u.m / u.s**2))).to(u.m).magnitude
print(f"[hidro] 35 psi → {mca(35):.6f} mca; límite (lavabo 8 psi) → {mca(8):.6f} mca, suite {H['lavabo']:.6f}")
fila("hidro", "h = p/(ρ·g)", "IPC 2015 Tabla 604.3 (texto de up.codes, sin cotejo con ICC): parches/normas-texto/IPC-2015_Tabla-604.3_y_424.3_upcodes.txt:39",
     H["wc_flux"], mca(35), "mca")

# 8 · fuego · presión en el rociador: q = densidad × área; P = (q/K)² (sin texto de norma: NFPA 13 no está en el repo)
F = suite["fuego"]
qroc = (Q_(F["dens"], u.mm / u.min) * Q_(F["cobertura"], u.m**2)).to(u.L / u.min).magnitude
p = (qroc / F["K"]) ** 2
p_lim = max(F["pMin"], (qroc / 160) ** 2)
print(f"[fuego] ord2: {F['dens']} mm/min × {F['cobertura']} m² = {qroc:.4f} L/min; K {F['K']} L/min/√bar → P {p:.6f} bar; límite K160: P = (q/K)² = {(qroc / 160) ** 2:.4f} < pMin {F['pMin']} → rige {p_lim} bar")
fila("fuego", "P = (d·A/K)²", "SIN TEXTO DE NORMA en el repo (NFPA 13 bloqueado; parches/normas-texto/README.md:32-34)",
     F["pRoc"], p, "bar")

# 9 · aire · factor de fricción de Haaland contra Colebrook (fluids 1.3.1)
A = suite["aire"]
f_c = Colebrook(1e5, 3e-5)
print(f"[aire] Re 1e5, ε/D 3e-5: Colebrook (fluids) {f_c:.6f}; Re 1e6, ε/D 1e-4: Colebrook {Colebrook(1e6, 1e-4):.6f} vs suite {A['f_1e6']:.6f}; límite laminar Re 1000: 64/Re = 0.064, suite {A['f_1e3']}")
fila("aire", "Haaland: 1/√f = −1.8·log10[(ε/D/3.7)^1.11 + 6.9/Re]", "SIN TEXTO DE NORMA en el repo (referencia: Colebrook-White, fluids 1.3.1)",
     A["f_1e5"], f_c, "—", "Haaland es aproximación explícita de Colebrook")

# 10 · civil · perímetro estimado de un rectángulo 3:2 con área a: lados b y 1.5b, 1.5b² = a
Ci = suite["civil"]
b = math.sqrt(120 / 1.5)
print(f"[civil] área 120 m², proporción 3:2 → lados {1.5 * b:.4f} × {b:.4f} m")
fila("civil", "per = 2·(1.5b + b), 1.5b² = a", "SIN TEXTO DE NORMA (criterio de la casa, geometría)", Ci["per"], 2 * (1.5 * b + b), "m")

# 11 · soporte · número de soportes en ducto rectangular: máx. 8 ft (SMACNA 1995 §4.2.8); n = máx(2, ⌈L/e⌉ + 1)
So = suite["soporte"]
e_norma = Q_(8, u.ft).to(u.m).magnitude
n = lambda L, e: max(2, math.ceil(L / e) + 1)
print(f"[soporte] 8 ft = {e_norma:.4f} m (suite {So['rect10']['e']} m); 12 ft = {Q_(12, u.ft).to(u.m).magnitude:.4f} m (suite {So['red20']['e']} m)")
print(f"[soporte] L 10 m: suite {So['rect10']['n']}, norma {n(10, e_norma)}; L 9.76 m: suite {So['rect976']['n']}, norma {n(9.76, e_norma)}; L 1 m (límite): suite {So['rect1']['n']}, norma {n(1, e_norma)}; redondo 20 m: suite {So['red20']['n']}, norma {n(20, Q_(12, u.ft).to(u.m).magnitude)}")
fila("soporte", "n = máx(2, ⌈L/e⌉ + 1), e ≤ 8 ft", "SMACNA HVAC-DCS 1995 §4.2.8: normas/smacna.duct.1995.html:13146",
     So["rect976"]["n"], n(9.76, e_norma), "soportes", "caso borde L = 9.76 m: 2.44 m excede 8 ft (2.4384 m) por 1.6 mm")

print("\n| Motor | Fórmula | Norma | Suite | Independiente | Unidad | Diferencia | Nota |")
print("|---|---|---|---|---|---|---|---|")
for m, f_, nrm, vs, vi, un, d, nt in filas:
    print(f"| {m} | {f_} | {nrm} | {vs:.6g} | {vi:.6g} | {un} | {d:+.3f} % | {nt} |")
