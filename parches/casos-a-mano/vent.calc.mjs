#!/usr/bin/env node
/* Casos calculados a mano · motor VENTILACIÓN (Fase 1, rev 2.9.24).
   Cálculo INDEPENDIENTE: no carga index.html ni pruebas.mjs. Imprime los esperados y, con --csv, escribe vent.csv.
   Uso: node parches/casos-a-mano/vent.calc.mjs [--csv]

   Fuentes:
   · ASHRAE 62.1-2016 Tabla 6.2.2.1 (Addendum s, texto en parches/normas-texto/ASHRAE-62.1-2016_Addendum-s_Tabla-6.2.2.1.txt):
     Office space Rp 2.5 L/s·pers, Ra 0.3 L/s·m²; Classrooms (age 9 plus) 5 / 0.6; General manufacturing 5 / 0.9;
     Warehouses 5 / 0.3; Dwelling unit 2.5 / 0.3; Computer (not printing) 2.5 / 0.3.  Ec. 6.2.2.1: Vbz = Rp·Pz + Ra·Az.
   · IMC 2021 Tabla 507.5.2 (CFM por pie lineal de campana no listada), reproducida en la guía CKV Design Guide 1
     (parches/normas-texto/CKV-Design-Guide-1_campanas.txt, Tabla 1; SECUNDARIA): muro 200/300/400/550, isla sencilla
     400/500/600/700, visera 250/250/no permitida/no permitida. El texto primario (up.codes / ICC) no fue alcanzable el
     22-sep-2026 (HTTP 404/403): la fila queda «secundaria».
   · Criterios de la casa (index.html, rev 2.9.24): Tab.45 30 m³/h·pers y 1.8 m³/h·m² (P.OA_PERS/P.OA_M2, línea 2986);
     tabla HOOD por área de campana (línea 8534) y «rige el mayor» (H-14); reposición 80 % (8583); SP = ductos + filtros
     + 0.25 in.w.g. (8604); margen 10 % de selección (8619); cobertura del modelo cfmMin ≤ objetivo ≤ cfmMax (H-156, el
     código de hoy tolera ×0.9); velocidad de rejilla sobre área libre (8600); aviso de aire exterior > cambios/h ×1.02 (3877).
   · Catálogo Greenheck en index.html:872 (sin Product Data, H-163): rangos cfmMin–cfmMax por modelo.
   Conversiones exactas: 1 ft = 0.3048 m; 1 CFM = 0.3048³·60 m³/h = 1.699011 m³/h; 1 L/s = 3.6 m³/h. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const FT = 0.3048;                       // m por pie
const M3H_CFM = FT ** 3 * 60;            // m³/h por CFM = 1.699011
const cfm = (m3h) => m3h / M3H_CFM;      // m³/h → CFM
const ls = (l) => l * 3.6;               // L/s → m³/h
const ft = (m) => m / FT;                // m → ft
const r = (x, d = 2) => Number(x.toFixed(d));

/* ASHRAE 62.1-2016 Tabla 6.2.2.1 (L/s·pers, L/s·m²) */
const T621 = {
  office:     { Rp: 2.5, Ra: 0.3, fila: "Office space" },
  classroom:  { Rp: 5,   Ra: 0.6, fila: "Classrooms (age 9 plus)" },
  production: { Rp: 5,   Ra: 0.9, fila: "General manufacturing" },
  warehouse:  { Rp: 5,   Ra: 0.3, fila: "Warehouses" },
};
/* Lo que la suite tiene hoy (index.html:2997-3013), sólo para documentar la diferencia (H-157) */
const SUITE_HOY = { warehouse: { Rp: 2.5, Ra: 0.3 } };
/* Criterio de la casa: Tab.45 (index.html:2986) */
const TAB45 = { pers: 30, m2: 1.8 };     // m³/h por persona y por m²
/* IMC 2021 Tabla 507.5.2 vía CKV Tabla 1 (CFM por pie lineal) */
const IMC_LIN = { wall: { light: 200, medium: 300, heavy: 400, extra: 550 }, island: { light: 400, medium: 500, heavy: 600, extra: 700 }, eyebrow: { light: 250, medium: 250, heavy: null, extra: null } };
/* Criterio de la casa: CFM por pie cuadrado de campana (index.html:8534) */
const CASA_AREA = { wall: { light: 50, medium: 75, heavy: 100, extra: 140 }, island: { light: 75, medium: 100, heavy: 125, extra: 165 }, eyebrow: { light: 40, medium: 60, heavy: 80, extra: 110 } };
/* Catálogo Greenheck (index.html:872): [modelo, familia técnica, cfmMin, cfmMax]. Sólo los que intervienen en los casos. */
const CAT = [
  ["G-080", "roof_exhauster", 150, 700], ["G-099", "roof_exhauster", 300, 1200], ["G-131-A", "roof_exhauster", 500, 1800], ["G-140-B3122XQD", "roof_exhauster", 1233, 2115],
  ["G-180", "roof_exhauster", 1800, 3500], ["GB-200", "roof_exhauster", 1500, 4000], ["GB-300-3140XQD-DR1", "roof_exhauster", 2630, 5993], ["GB-360", "roof_exhauster", 4000, 9000],
  ["SQ-70", "inline", 100, 450], ["SQ-90", "inline", 188, 738], ["SQ-100", "inline", 300, 1200], ["SQ-120", "inline", 500, 2000], ["SQ-140", "inline", 800, 3000], ["SQ-160", "inline", 1200, 4500], ["SQ-200", "inline", 2000, 7000],
  ["CSW-10", "centrifugal", 400, 1500], ["CSW-12", "centrifugal", 800, 2500], ["CSW-15", "centrifugal", 1500, 4000], ["CSW-18", "centrifugal", 2500, 6000], ["CSW-22", "centrifugal", 4000, 10000], ["CSW-30", "centrifugal", 7000, 18000],
  ["AE-12-433-B6X-QD", "axial", 144, 1014], ["AE-18", "axial", 500, 3000], ["AE-24", "axial", 1500, 6000], ["AE-36", "axial", 4000, 15000], ["AE-48", "axial", 8000, 30000], ["AE-60", "axial", 15000, 50000],
  ["CUBE-099", "kitchen_hood", 400, 1500], ["CUBE-140", "kitchen_hood", 851, 3124], ["CUBE-180HP-10130GQD-DR1", "kitchen_hood", 1661, 4500], ["CUBE-200", "kitchen_hood", 2500, 6000], ["CUBE-240", "kitchen_hood", 3500, 8500], ["CUBE-300", "kitchen_hood", 5000, 12000],
  ["MSX-15", "make_up_air", 1000, 2500], ["MSX-25", "make_up_air", 2000, 4500], ["MSX-40", "make_up_air", 3500, 8000], ["MSX-60", "make_up_air", 6000, 12000], ["MSX-100", "make_up_air", 10000, 20000],
  ["ESD-403", "louver", 300, 900], ["ESD-635", "louver", 600, 2000], ["ESD-635D", "louver", 1000, 4000], ["ESD-725", "louver", 2000, 7000], ["ESD-435", "louver", 4000, 12000],
  ["MiniCore-500", "erv", 250, 600], ["MiniCore-1000", "erv", 500, 1200], ["MiniCore-2000", "erv", 1000, 2500], ["MiniCore-4000", "erv", 2000, 5000], ["MiniCore-6000", "erv", 3500, 7500],
].map(([model, tech, min, max]) => ({ model, tech, min, max, nominal: Math.round((min + max) / 2) }));
const POOL = { general: ["roof_exhauster", "inline", "centrifugal", "erv"], kitchen: ["kitchen_hood", "make_up_air", "centrifugal"], industrial: ["centrifugal", "axial", "inline"], louver: ["louver"], mua: ["make_up_air", "erv"] };
const MARGEN = 1.1;                      // criterio de la casa (index.html:8619)
/* Cobertura REAL (H-156): el objetivo cae dentro del rango del modelo. */
const cubreReal = (m, objetivo) => m.min <= objetivo && objetivo <= m.max;
/* Modelos del pool que cubren de verdad el objetivo, por familia preferida y luego por caudal nominal ascendente. */
const cubren = (modo, objetivo) => CAT.filter((m) => POOL[modo].includes(m.tech) && cubreReal(m, objetivo))
  .sort((a, b) => POOL[modo].indexOf(a.tech) - POOL[modo].indexOf(b.tech) || a.nominal - b.nominal);
const maxPool = (modo) => Math.max(...CAT.filter((m) => POOL[modo].includes(m.tech)).map((m) => m.max));

/* ---- aire exterior general (62.1 + Tab.45, criterio de la casa: rige el mayor) ---- */
function oaGeneral(tipo, area, occ, tabla = T621) {
  const t = tabla[tipo];
  const vbz = cfm(ls(t.Rp * occ + t.Ra * area));
  const byP = cfm(occ * TAB45.pers), byA = cfm(area * TAB45.m2);
  return { vbz, byP, byA, oa: Math.max(vbz, byP, byA), rige: vbz >= byP && vbz >= byA ? "62.1 Vbz" : byP >= byA ? "Tab.45 personas" : "Tab.45 área" };
}
const achCfm = (area, h, ach) => cfm(area * h * ach);
const sp = (ductos, filtros) => ductos + filtros + 0.25;

const filas = [];
const fila = (id, descripcion, entradas, formula, fuente, caracter, expresion, esperado, tolerancia, estado) =>
  filas.push({ id, descripcion, entradas, formula, fuente, caracter, expresion, esperado, tolerancia, estado, calculado_por: "parches/casos-a-mano/vent.calc.mjs" });
const F621 = "ASHRAE 62.1-2016 Tabla 6.2.2.1 (Addendum s) y Ec. 6.2.2.1";
const FCASA = (l, que) => `criterio de la casa (index.html:${l}, ${que})`;
const FIMC = "IMC 2021 Tabla 507.5.2 vía CKV Design Guide 1 Tabla 1 (parches/normas-texto)";
const FCAT = "catálogo Greenheck index.html:872 (sin Product Data, H-163) + " + FCASA("8619-8635", "margen 10 % y cobertura");
const VBZ_EXPR = "Number((VENT.lines.find((l) => l[0] === 'Aire exterior ASHRAE 62.1') || [])[1].match(/Vbz (\\d+)/)[1])";
const CHECKS = (lvl) => lvl ? `ENGINES.vent.checks(VENT).filter((x) => x.lvl === '${lvl}').length` : "ENGINES.vent.checks(VENT).length";

/* ===== 1 · Oficina 100 m² / 3 m / 10 personas / 6 cambios/h / ductos 0.5 + filtros 0.25 ===== */
{
  const A = 100, H = 3, P = 10, ACH = 6, ent = "mode general, spaceType office, area 100, height 3, occ 10, ach 6, ductLoss 0.5, filterLoss 0.25";
  const a = achCfm(A, H, ACH), o = oaGeneral("office", A, P), dem = Math.max(a, o.oa), obj = dem * MARGEN, s = sp(0.5, 0.25);
  const c = cubren("general", obj);
  fila("CM.vent.1.a", "cambios de aire → caudal", ent, `300 m³ × 6 1/h = 1,800 m³/h ÷ 1.699011 = ${r(a)} CFM`, FCASA("8559", "conversión m³/h→CFM"), "primaria", "VENT.achCfm", r(a), 0.5, "vigente");
  fila("CM.vent.1.b", "Vbz de ASHRAE 62.1 (impreso en la línea de aire exterior)", ent, `(2.5×10 + 0.3×100) L/s = 55 L/s = 198 m³/h = ${r(o.vbz)} CFM (la suite lo imprime redondeado)`, F621, "primaria", VBZ_EXPR, r(o.vbz), 0.51, "vigente");
  fila("CM.vent.1.c", "aire exterior de diseño = máx(Vbz, Tab.45 pers, Tab.45 área)", ent, `máx(${r(o.vbz)}, 10×30/1.699011 = ${r(o.byP)}, 100×1.8/1.699011 = ${r(o.byA)}) = ${r(o.oa)} CFM (rige ${o.rige})`, FCASA("2986 y 8566-8567", "Tab.45 30 m³/h·pers, 1.8 m³/h·m²"), "criterio de la casa", "VENT.oaCfm", r(o.oa), 0.5, "vigente");
  fila("CM.vent.1.d", "demanda = máx(cambios/h, aire exterior)", ent, `máx(${r(a)}, ${r(o.oa)}) = ${r(dem)} CFM`, FCASA("8569", "rige el mayor"), "criterio de la casa", "VENT.demand", r(dem), 0.5, "vigente");
  fila("CM.vent.1.e", "caudal en m³/h", ent, `${r(dem)} CFM × 1.699011 = ${r(dem * M3H_CFM, 1)} m³/h`, "conversión exacta 0.3048³×60", "primaria", "VENT.m3h", r(dem * M3H_CFM, 1), 1, "vigente");
  fila("CM.vent.1.f", "presión estática estimada", ent, `0.5 + 0.25 + 0.25 = ${r(s)} in.w.g.`, FCASA("8604", "0.25 entrada/salida"), "criterio de la casa", "VENT.sp", r(s), 0.005, "vigente");
  fila("CM.vent.1.g", "objetivo de selección = demanda + 10 %", ent, `${r(dem)} × 1.1 = ${r(obj)} CFM`, FCASA("8619", "margen 10 %"), "criterio de la casa", "VENT.eq.target", r(obj), 0.5, "vigente");
  fila("CM.vent.1.h", "el modelo elegido cubre el objetivo (1 = sí)", ent, `techo que cubren ${r(obj, 0)} CFM: ${c.map((m) => `${m.model} ${m.min}–${m.max}`).join(", ")} → cubre`, FCAT, "criterio de la casa", "Number(VENT.eq.cubre)", 1, 0, "vigente");
  fila("CM.vent.1.i", "máximo del modelo elegido (familia del modo, cobertura, menor caudal nominal)", ent, `${c[0].model} (${c[0].min}–${c[0].max}) es el de menor caudal nominal entre los que cubren → cfmMax ${c[0].max}`, FCAT, "criterio de la casa", "VENT.eq.primary.cfmMax", c[0].max, 0, "vigente");
  fila("CM.vent.1.j", "sin avisos: SP 1.00 < 2.5, aire exterior < cambios/h, modelo cubre", ent, "0 avisos", FCASA("3874-3880", "matriz de validación"), "criterio de la casa", CHECKS(), 0, 0, "vigente");
}
/* ===== 2 · Geometría del fixture: 700 m² / 4.71 m / 46 personas / 6 1/h, oficina; variante producción ===== */
{
  const A = 700, H = 4.71, P = 46, ACH = 6, ent = "mode general, spaceType office, area 700, height 4.71, occ 46, ach 6, ductLoss 0.5, filterLoss 0.25 (capturado a mano, misma geometría que el fixture de regresión)";
  const a = achCfm(A, H, ACH), o = oaGeneral("office", A, P), dem = Math.max(a, o.oa), obj = dem * MARGEN;
  const c = cubren("general", obj);
  fila("CM.vent.2.a", "cambios de aire → caudal", ent, `3,297 m³ × 6 = 19,782 m³/h ÷ 1.699011 = ${r(a)} CFM`, FCASA("8559", "conversión"), "primaria", "VENT.achCfm", r(a), 0.5, "vigente");
  fila("CM.vent.2.b", "Vbz de ASHRAE 62.1 (impreso)", ent, `(2.5×46 + 0.3×700) = 325 L/s = 1,170 m³/h = ${r(o.vbz)} CFM`, F621, "primaria", VBZ_EXPR, r(o.vbz), 0.51, "vigente");
  fila("CM.vent.2.c", "aire exterior de diseño", ent, `máx(${r(o.vbz)}, 46×30/1.699011 = ${r(o.byP)}, 700×1.8/1.699011 = ${r(o.byA)}) = ${r(o.oa)} (rige ${o.rige})`, FCASA("2986 y 8566-8567", "Tab.45"), "criterio de la casa", "VENT.oaCfm", r(o.oa), 0.5, "vigente");
  fila("CM.vent.2.d", "demanda", ent, `máx(${r(a)}, ${r(o.oa)}) = ${r(dem)} CFM`, FCASA("8569", "rige el mayor"), "criterio de la casa", "VENT.demand", r(dem), 0.5, "vigente");
  fila("CM.vent.2.e", "objetivo de selección", ent, `${r(dem)} × 1.1 = ${r(obj)} CFM`, FCASA("8619", "margen 10 %"), "criterio de la casa", "VENT.eq.target", r(obj), 0.5, "vigente");
  fila("CM.vent.2.f", "H-154: algún modelo del pool general cubre el objetivo (CSW-30 7,000–18,000)", ent, `cubren ${r(obj, 0)} CFM: ${c.map((m) => `${m.model} ${m.min}–${m.max}`).join(", ")} → cubre = 1 (hoy 0: la familia preferida GB-360 4,000–9,000 se impone)`, FCAT, "criterio de la casa", "Number(VENT.eq.cubre)", 1, 0, "fase2:H-154");
  fila("CM.vent.2.g", "H-154: máximo del modelo elegido = 18,000 (CSW-30)", ent, `${c[0].model} ${c[0].min}–${c[0].max} → cfmMax ${c[0].max} (hoy 9,000)`, FCAT, "criterio de la casa", "VENT.eq.primary.cfmMax", c[0].max, 0, "fase2:H-154");
  fila("CM.vent.2.h", "H-154: sin aviso de «ningún modelo cubre»", ent, "0 errores (hoy 1)", FCASA("3874-3880", "matriz de validación"), "criterio de la casa", CHECKS("err"), 0, 0, "fase2:H-154");
  const op = oaGeneral("production", A, P);
  fila("CM.vent.2.i", "variante producción (General manufacturing Rp 5, Ra 0.9): rige Vbz", "mode general, spaceType production, area 700, height 4.71, occ 46, ach 6", `(5×46 + 0.9×700) = 860 L/s = 3,096 m³/h = ${r(op.vbz)} CFM > Tab.45 (${r(op.byP)}, ${r(op.byA)}) → oa ${r(op.oa)}`, F621, "primaria", "VENT.oaCfm", r(op.oa), 0.5, "vigente");
}
/* ===== 3 · Almacén 200 m² / 6 m / 12 personas / 0 cambios/h (H-157) ===== */
{
  const A = 200, H = 6, P = 12, ent = "mode general, spaceType warehouse, area 200, height 6, occ 12, ach 0";
  const norma = oaGeneral("warehouse", A, P), hoy = oaGeneral("warehouse", A, P, { warehouse: SUITE_HOY.warehouse });
  fila("CM.vent.3.a", "H-157: aire exterior con Rp 5 L/s·pers (Warehouses)", ent, `(5×12 + 0.3×200) = 120 L/s = 432 m³/h = ${r(norma.vbz)} CFM > Tab.45 (${r(norma.byP)}, ${r(norma.byA)}) → ${r(norma.oa)} (hoy Rp 2.5: Vbz ${r(hoy.vbz)} y rige Tab.45 ${r(hoy.oa)})`, F621, "primaria", "VENT.oaCfm", r(norma.oa), 0.5, "fase2:H-157");
  fila("CM.vent.3.b", "H-157: demanda con 0 cambios/h = aire exterior", ent, `máx(0, ${r(norma.oa)}) = ${r(norma.oa)} CFM`, F621, "primaria", "VENT.demand", r(norma.oa), 0.5, "fase2:H-157");
  fila("CM.vent.3.c", "cambios/h capturados en 0 → 0 CFM por dilución", ent, "1,200 m³ × 0 = 0", FCASA("8559", "conversión"), "primaria", "VENT.achCfm", 0, 0, "vigente");
}
/* ===== 4 · Aula 100 m² / 3 m / 10 personas (Classrooms age 9+ Rp 5, Ra 0.6): rige Vbz; aviso con 0.5 1/h ===== */
{
  const A = 100, H = 3, P = 10, ent = "mode general, spaceType classroom, area 100, height 3, occ 10, ach 0";
  const o = oaGeneral("classroom", A, P);
  fila("CM.vent.4.a", "aire exterior: rige Vbz de 62.1", ent, `(5×10 + 0.6×100) = 110 L/s = 396 m³/h = ${r(o.vbz)} CFM > Tab.45 (${r(o.byP)}, ${r(o.byA)})`, F621, "primaria", "VENT.oaCfm", r(o.oa), 0.5, "vigente");
  fila("CM.vent.4.b", "demanda con 0 cambios/h", ent, `= ${r(o.oa)} CFM`, F621, "primaria", "VENT.demand", r(o.oa), 0.5, "vigente");
  fila("CM.vent.4.c", "caudal en m³/h", ent, `${r(o.oa)} × 1.699011 = ${r(o.oa * M3H_CFM, 1)} m³/h (= 396.0 exacto)`, "conversión exacta", "primaria", "VENT.m3h", r(o.oa * M3H_CFM, 1), 1, "vigente");
  const a05 = achCfm(A, H, 0.5);
  fila("CM.vent.4.d", "con 0.5 1/h el aire exterior rebasa los cambios/h ×1.02 → 1 aviso", "mode general, spaceType classroom, area 100, height 3, occ 10, ach 0.5, ductLoss 0.5, filterLoss 0.25", `cambios 300×0.5 = 150 m³/h = ${r(a05)} CFM; ${r(o.oa)} > ${r(a05 * 1.02)} → aviso; SP 1.00 < 2.5 y G-080 150–700 cubre ${r(o.oa * MARGEN, 0)} → sólo ese aviso`, FCASA("3877", "aviso aire exterior > cambios/h ×1.02"), "criterio de la casa", CHECKS("warn"), 1, 0, "vigente");
  fila("CM.vent.4.e", "con 0.5 1/h la demanda sigue siendo el aire exterior", "ídem 4.d", `máx(${r(a05)}, ${r(o.oa)}) = ${r(o.oa)}`, F621, "primaria", "VENT.demand", r(o.oa), 0.5, "vigente");
}
/* ===== 5 · Campana de muro 3.0 × 1.2 m, carga media ===== */
{
  const L = 3.0, W = 1.2, ent = "mode kitchen, hoodType wall, duty medium, hoodL 3.0, hoodW 1.2, ductLoss 0.5, filterLoss 0.25";
  const Lft = ft(L), Wft = ft(W), ft2 = Lft * Wft, porLin = Lft * IMC_LIN.wall.medium, porArea = ft2 * CASA_AREA.wall.medium, dem = Math.max(porArea, porLin), mua = dem * 0.8, obj = dem * MARGEN;
  fila("CM.vent.5.a", "extracción: rige el mínimo IMC por pie lineal", ent, `${r(Lft, 4)} ft × 300 CFM/ft = ${r(porLin)} CFM > por área ${r(ft2, 3)} ft² × 75 = ${r(porArea)}`, FIMC, "secundaria", "VENT.demand", r(dem), 0.5, "vigente");
  fila("CM.vent.5.b", "reposición 80 %", ent, `${r(dem)} × 0.8 = ${r(mua)} CFM`, FCASA("8583", "reposición 80 %"), "criterio de la casa", "VENT.mua", r(mua), 0.5, "vigente");
  fila("CM.vent.5.c", "caudal en m³/h", ent, `${r(dem)} × 1.699011 = ${r(dem * M3H_CFM, 1)}`, "conversión exacta", "primaria", "VENT.m3h", r(dem * M3H_CFM, 1), 1, "vigente");
  fila("CM.vent.5.d", "objetivo de selección", ent, `${r(dem)} × 1.1 = ${r(obj)} CFM`, FCASA("8619", "margen 10 %"), "criterio de la casa", "VENT.eq.target", r(obj), 0.5, "vigente");
  fila("CM.vent.5.e", "H-156: un modelo con objetivo por encima de su máximo no se declara «cubre» (CUBE-140 851–3,124 contra 3,248)", ent, `${r(obj, 0)} > 3,124 → cubre ∧ objetivo>cfmMax debe ser 0 (hoy 1: tolerancia ×0.9 acepta 3,124 ≥ ${r(obj * 0.9, 0)})`, FCASA("8635", "cobertura real, H-156"), "criterio de la casa", "Number(VENT.eq.cubre && VENT.eq.target > VENT.eq.primary.cfmMax)", 0, 0, "fase2:H-156");
}
/* ===== 6 · Campana de isla sencilla 2.4 × 1.5 m, carga media ===== */
{
  const L = 2.4, W = 1.5, ent = "mode kitchen, hoodType island, duty medium, hoodL 2.4, hoodW 1.5";
  const Lft = ft(L), ft2 = Lft * ft(W), porLin = Lft * IMC_LIN.island.medium, porArea = ft2 * CASA_AREA.island.medium, dem = Math.max(porArea, porLin);
  fila("CM.vent.6.a", "isla sencilla: rige IMC 500 CFM/ft", ent, `${r(Lft, 4)} ft × 500 = ${r(porLin)} CFM > por área ${r(ft2, 3)} × 100 = ${r(porArea)}`, FIMC, "secundaria", "VENT.demand", r(dem), 0.5, "vigente");
}
/* ===== 7 · Visera 2.0 × 0.6 m ligera; visera pesada 2.0 × 1.0 m (H-159) ===== */
{
  const Lft = ft(2.0), ft2 = Lft * ft(0.6), porLin = Lft * IMC_LIN.eyebrow.light, porArea = ft2 * CASA_AREA.eyebrow.light, dem = Math.max(porArea, porLin);
  fila("CM.vent.7.a", "visera ligera: rige IMC 250 CFM/ft", "mode kitchen, hoodType eyebrow, duty light, hoodL 2.0, hoodW 0.6", `${r(Lft, 4)} ft × 250 = ${r(porLin)} CFM > por área ${r(ft2, 3)} × 40 = ${r(porArea)}`, FIMC, "secundaria", "VENT.demand", r(dem), 0.5, "vigente");
  fila("CM.vent.7.b", "H-159: visera con carga pesada no está permitida → demanda 0 (hoy 300 CFM/ft inventados)", "mode kitchen, hoodType eyebrow, duty heavy, hoodL 2.0, hoodW 1.0", `IMC Tabla 507.5.2: eyebrow / heavy = «not allowed» → 0 CFM (hoy ${r(Lft * 300)} CFM)`, FIMC, "secundaria", "VENT.demand", 0, 0, "fase2:H-159");
}
/* ===== 8 · Campana de muro 3.0 × 1.5 m pesada: rige el método por área (criterio de la casa) ===== */
{
  const Lft = ft(3.0), ft2 = Lft * ft(1.5), porLin = Lft * IMC_LIN.wall.heavy, porArea = ft2 * CASA_AREA.wall.heavy, dem = Math.max(porArea, porLin);
  fila("CM.vent.8.a", "muro pesada con fondo 1.5 m: por área > IMC lineal, rige el mayor", "mode kitchen, hoodType wall, duty heavy, hoodL 3.0, hoodW 1.5", `área ${r(ft2, 3)} ft² × 100 = ${r(porArea)} > lineal ${r(Lft, 4)} × 400 = ${r(porLin)} → ${r(dem)}`, FCASA("8534 y 8583", "tabla HOOD por área y «rige el mayor» (H-14)"), "criterio de la casa", "VENT.demand", r(dem), 0.5, "vigente");
  fila("CM.vent.8.b", "el mínimo IMC de esa campana (por si el criterio por área se retira)", "ídem 8.a", `${r(Lft, 4)} × 400 = ${r(porLin)} CFM ≤ demanda`, FIMC, "secundaria", "Number(VENT.demand >= " + r(porLin) + " - 0.5)", 1, 0, "vigente");
}
/* ===== 9 · Rejilla 1.2 × 1.0 m, 50 % libre, 500 fpm; rejilla sin área libre (H-155) ===== */
{
  const face = ft(1.2) * ft(1.0), free = face * 0.5, dem = free * 500, obj = dem * MARGEN, c = cubren("louver", obj);
  const ent = "mode louver, louverW 1.2, louverH 1.0, freeArea 50, faceVel 500";
  fila("CM.vent.9.a", "caudal = área libre × velocidad", ent, `cara ${r(face, 4)} ft² × 50 % = ${r(free, 4)} ft² × 500 fpm = ${r(dem)} CFM`, FCASA("8598-8601", "velocidad sobre área libre"), "criterio de la casa", "VENT.demand", r(dem), 0.5, "vigente");
  fila("CM.vent.9.b", "caudal en m³/h", ent, `${r(dem)} × 1.699011 = ${r(dem * M3H_CFM, 1)}`, "conversión exacta", "primaria", "VENT.m3h", r(dem * M3H_CFM, 1), 1, "vigente");
  fila("CM.vent.9.c", "una rejilla del catálogo cubre el objetivo", ent, `objetivo ${r(obj)}; cubren: ${c.map((m) => `${m.model} ${m.min}–${m.max}`).join(", ")} → 1`, FCAT, "criterio de la casa", "Number(VENT.eq.cubre)", 1, 0, "vigente");
  fila("CM.vent.9.d", "H-155: rejilla sin área libre capturada → demanda 0 (hoy piso 5 % × 400 fpm = 258 CFM)", "mode louver, louverW 1.2, louverH 1.0, freeArea 0, faceVel 400", `sin dato de área libre no hay caudal: 0 (hoy ${r(face * 0.05 * 400)} CFM)`, "política 2.9.16 «nada se estima» (CLAUDE.md regla 6)", "primaria", "VENT.demand", 0, 0, "fase2:H-155");
}
/* ===== 10 · Cocina sin medidas (H-155) ===== */
{
  const ent = "mode kitchen, hoodType wall, duty medium, hoodL 0, hoodW 0; permisos de todos los cruces concedidos";
  fila("CM.vent.10.a", "H-155: campana sin medidas → demanda 0 (hoy piso 0.1 ft × 300 = 30 CFM)", ent, "sin largo ni fondo no hay caudal: 0 (hoy 30 CFM)", "política 2.9.16 «nada se estima» (CLAUDE.md regla 6)", "primaria", "VENT.demand", 0, 0, "fase2:H-155");
  fila("CM.vent.10.b", "H-155: sin caudal no hay partidas de ventilación en la cotización", ent, "0 partidas con mot = vent (hoy 2: extracción 30 CFM y reposición 24 CFM)", "política 2.9.16 (CLAUDE.md regla 6)", "primaria", "QUOTE.aux.filter((a) => a.mot === 'vent').length", 0, 0, "fase2:H-155");
}
/* ===== 11 · Industrial 500 m² × 8 m, 10 1/h, proceso 20,000 CFM; variante proceso 30,000 ===== */
{
  const a = achCfm(500, 8, 10);
  fila("CM.vent.11.a", "industrial: rige la dilución por cambios/h", "mode industrial, area 500, height 8, ach 10, processCFM 20000", `4,000 m³ × 10 = 40,000 m³/h ÷ 1.699011 = ${r(a)} CFM > 20,000`, FCASA("8593-8594", "máx(proceso, dilución)"), "criterio de la casa", "VENT.demand", r(a), 0.5, "vigente");
  const obj = 30000 * MARGEN, c = cubren("industrial", obj);
  fila("CM.vent.11.b", "industrial: rige el caudal de proceso", "mode industrial, area 500, height 8, ach 10, processCFM 30000", `máx(30,000, ${r(a)}) = 30,000`, FCASA("8593-8594", "máx(proceso, dilución)"), "criterio de la casa", "VENT.demand", 30000, 0.5, "vigente");
  fila("CM.vent.11.c", "un modelo del pool industrial cubre 33,000 CFM", "ídem 11.b", `objetivo ${r(obj)}; cubren: ${c.map((m) => `${m.model} ${m.min}–${m.max}`).join(", ")} → 1`, FCAT, "criterio de la casa", "Number(VENT.eq.cubre)", 1, 0, "vigente");
}
/* ===== 12 · General 1,000 m² × 6 m × 6 1/h: nadie del pool general llega ===== */
{
  const a = achCfm(1000, 6, 6), obj = a * MARGEN, mx = maxPool("general");
  const ent = "mode general, spaceType office, area 1000, height 6, occ 0, ach 6";
  fila("CM.vent.12.a", "demanda por cambios/h", ent, `6,000 × 6 = 36,000 m³/h ÷ 1.699011 = ${r(a)} CFM`, FCASA("8559", "conversión"), "primaria", "VENT.demand", r(a), 0.5, "vigente");
  fila("CM.vent.12.b", "ningún modelo del pool general cubre (máximo del pool 18,000 < objetivo)", ent, `objetivo ${r(obj)} > ${mx} (CSW-30) → cubre 0; ni con la tolerancia de hoy: 18,000 < ${r(obj * 0.9)}`, FCAT, "criterio de la casa", "Number(VENT.eq.cubre)", 0, 0, "vigente");
  fila("CM.vent.12.c", "y la matriz lo declara como error", ent, "1 error «ningún modelo cubre»", FCASA("3875-3876", "matriz de validación"), "criterio de la casa", CHECKS("err"), 1, 0, "vigente");
}
/* ===== 13 · Reposición (mua) 200 m² × 4 m, 10 personas, 2 1/h, oficina ===== */
{
  const a = achCfm(200, 4, 2), o = oaGeneral("office", 200, 10), dem = Math.max(a, o.oa), obj = dem * MARGEN, c = cubren("mua", obj);
  const ent = "mode mua, spaceType office, area 200, height 4, occ 10, ach 2";
  fila("CM.vent.13.a", "demanda = máx(cambios/h, aire exterior)", ent, `800 × 2 = 1,600 m³/h = ${r(a)} CFM > oa máx(${r(o.vbz)}, ${r(o.byP)}, ${r(o.byA)}) = ${r(o.oa)}`, FCASA("8569", "rige el mayor"), "criterio de la casa", "VENT.demand", r(dem), 0.5, "vigente");
  fila("CM.vent.13.b", "modo reposición: aire de reposición = extracción", ent, `mua = ${r(dem)} CFM`, FCASA("8575", "reposición ≈ extracción"), "criterio de la casa", "VENT.mua", r(dem), 0.5, "vigente");
  fila("CM.vent.13.c", "una unidad de reposición cubre el objetivo", ent, `objetivo ${r(obj)}; cubren: ${c.map((m) => `${m.model} ${m.min}–${m.max}`).join(", ")} → 1`, FCAT, "criterio de la casa", "Number(VENT.eq.cubre)", 1, 0, "vigente");
}
/* ===== 14 · General 400 m² × 6 m, 30 personas, 6.4 1/h: 9,041 CFM (H-156 y H-154) ===== */
{
  const a = achCfm(400, 6, 6.4), o = oaGeneral("office", 400, 30), dem = Math.max(a, o.oa), obj = dem * MARGEN, c = cubren("general", obj);
  const ent = "mode general, spaceType office, area 400, height 6, occ 30, ach 6.4";
  fila("CM.vent.14.a", "demanda por cambios/h", ent, `2,400 × 6.4 = 15,360 m³/h ÷ 1.699011 = ${r(a)} CFM (> oa ${r(o.oa)})`, FCASA("8559", "conversión"), "primaria", "VENT.demand", r(dem), 0.5, "vigente");
  fila("CM.vent.14.b", "objetivo de selección", ent, `${r(dem)} × 1.1 = ${r(obj)} CFM`, FCASA("8619", "margen 10 %"), "criterio de la casa", "VENT.eq.target", r(obj), 0.5, "vigente");
  fila("CM.vent.14.c", "H-156: GB-360 (4,000–9,000) no cubre 9,945 con margen real; no se acepta «cubre» con objetivo > máximo", ent, `${r(obj, 0)} > 9,000 → 0 (hoy 1: 9,000 ≥ ${r(obj * 0.9, 0)} por la tolerancia ×0.9)`, FCASA("8635", "cobertura real, H-156"), "criterio de la casa", "Number(VENT.eq.cubre && VENT.eq.target > VENT.eq.primary.cfmMax)", 0, 0, "fase2:H-156");
  fila("CM.vent.14.d", "H-154 (+H-156): con cobertura real primero, sí hay modelo (CSW-22 4,000–10,000)", ent, `cubren ${r(obj, 0)}: ${c.map((m) => `${m.model} ${m.min}–${m.max}`).join(", ")} → cubre 1 y cfmMax ≥ objetivo`, FCAT, "criterio de la casa", "Number(VENT.eq.cubre && VENT.eq.primary.cfmMax >= VENT.eq.target)", 1, 0, "fase2:H-154");
}
/* ===== 15 · SP alta: ductos 2.0 + filtros 0.5 → 2.75 in.w.g. (aviso) ===== */
{
  const s = sp(2.0, 0.5), ent = "mode general, spaceType office, area 100, height 3, occ 10, ach 6, ductLoss 2.0, filterLoss 0.5";
  fila("CM.vent.15.a", "presión estática", ent, `2.0 + 0.5 + 0.25 = ${r(s)} in.w.g.`, FCASA("8604", "0.25 entrada/salida"), "criterio de la casa", "VENT.sp", r(s), 0.005, "vigente");
  fila("CM.vent.15.b", "SP > 2.5 dispara un aviso (y sólo ese: oa < cambios/h, G-099 cubre)", ent, "1 aviso", FCASA("3874", "aviso SP > 2.5"), "criterio de la casa", CHECKS("warn"), 1, 0, "vigente");
}

/* ---- salida ---- */
const csvCell = (v) => { const s = String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const cols = ["id", "descripcion", "entradas", "formula", "fuente", "caracter", "expresion", "esperado", "tolerancia", "estado", "calculado_por"];
const csv = [cols.join(","), ...filas.map((f) => cols.map((k) => csvCell(f[k])).join(","))].join("\n") + "\n";
if (process.argv.includes("--csv")) {
  const out = path.join(path.dirname(fileURLToPath(import.meta.url)), "vent.csv");
  fs.writeFileSync(out, csv, "utf8");
  console.log(`escrito ${out} (${filas.length} filas)`);
} else {
  for (const f of filas) console.log(`${f.id.padEnd(14)} ${String(f.esperado).padStart(10)} ±${String(f.tolerancia).padEnd(5)} ${f.estado.padEnd(12)} ${f.descripcion}`);
  console.log(`\n${filas.length} filas · vigentes ${filas.filter((f) => f.estado === "vigente").length} · fase2 ${filas.filter((f) => f.estado !== "vigente").length}`);
}
