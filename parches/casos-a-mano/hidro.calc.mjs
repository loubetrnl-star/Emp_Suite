#!/usr/bin/env node
/* parches/casos-a-mano/hidro.calc.mjs · Fase 1 (rev 2.9.24) · motor hidrosanitario (`hidro`, v4; v5 con H-194; v6 con H-195; v7 con H-197)

   Cálculo INDEPENDIENTE de la suite: no carga index.html, no usa cifrasMotor ni el esperado de regresión. Transcribe
   las tablas de norma que el motor necesita, resuelve cada caso a mano e imprime los esperados. Con `--csv` escribe la
   hoja parches/casos-a-mano/hidro.csv (misma carpeta) con esas mismas cifras, para que la hoja y el cálculo no diverjan.

     node parches/casos-a-mano/hidro.calc.mjs          → imprime los esperados por fila
     node parches/casos-a-mano/hidro.calc.mjs --csv    → además escribe hidro.csv

   FUENTES (carácter según CLAUDE.md §4):
   · IPC 2015 (International Plumbing Code), texto público en up.codes — PRIMARIA EN LÍNEA, verificada el 22-sep-2026:
       Apéndice E, Table E103.3(2) «Load values assigned to fixtures» y Table E103.3(3) «Table for estimating demand»:
         https://up.codes/viewer/connecticut/ipc-2015/chapter/E/sizing-of-water-piping-system
       Table 604.3 «Water distribution system design criteria required capacity at fixture supply pipe outlets» (releída
       renglón por renglón el 24-sep-2026 para H-194; copia en parches/normas-texto/IPC-2015_Tabla-604.3_y_424.3_upcodes.txt):
         https://up.codes/viewer/connecticut/ipc-2015/chapter/6/water-supply-and-distribution#604.3
       §424.3 «Individual shower valves» (toda regadera individual lleva válvula balanceada/termostática; fija el renglón de
       regadera en 604.3): https://up.codes/viewer/connecticut/ipc-2015/chapter/4/fixtures-faucets-and-fixture-fittings#424.3
       Table 709.1 (unidades de descarga), 704.1 (pendientes), Tables 710.1(1) y 710.1(2) (drenaje):
         https://up.codes/viewer/connecticut/ipc-2015/chapter/7/sanitary-drainage
       IPC 2024 publica los mismos valores en estas tablas (la suite lo declara así desde la rev 2.9.18).
   · NTC para el Proyecto Arquitectónico, Tabla 3.1 «Dotación mínima» — PRIMARIA (texto en
       parches/normas-texto/NTC-Proyecto-Arquitectonico_dotaciones.txt, renglones 1061-1141).
   · ASTM B88 tipo L (diámetro exterior y pared) — SECUNDARIA: Copper Development Association, Copper Tube Handbook,
       tabla de dimensiones (https://www.copper.org/publications/pub_list/pdf/copper_tube_handbook.pdf); no hay texto de
       ASTM B88 en parches/normas-texto.
   · ANSI Z358.1 (regadera de emergencia 20 gpm = 75.7 L/min con volumen para 15 min; lavaojos fijo 0.4 gal/min) — SECUNDARIA:
       cartas de OSHA del 18-abr-2002 y 22-nov-1993, que citan la edición 1990, releídas en osha.gov el 25-sep-2026 (párrafos en
       parches/normas-texto/OSHA-cartas-Z358.1_regadera-y-lavaojos.txt). H-195 se corrige con ellas; ratificar con Z358.1-2014.
   · Hazen-Williams en SI: hf/L = 10.67 · Q^1.852 / (C^1.852 · D^4.87) (Q en m³/s, D en m) — fórmula clásica; C = 140
       para cobre tipo L es el valor de la suite (criterio de la casa, index.html:9765, sin cita).
   · Criterios de la casa (index.html): velocidad máxima 2.4 m/s fría y 1.5 m/s caliente (9784), 30 % de longitud
       equivalente por accesorios (9887), presión residual 15 m (9853) como piso, eficiencia del conjunto 0.6 y redondeo a
       0.5 HP (9968-9969), CDT = altura del edificio + Σhf + máx(residual, mínima de 604.3 del mueble que más pide) (9950;
       H-194, antes sólo el residual), presión disponible = toma − Σ(hf + alt) (9927),
       ventilación primaria = mitad de la bajada redondeada a 5 mm y ≥ 32 mm (9936; IPC 906.2 dice la mitad y ≥ 1¼"),
       máximo dos WC en ramal/bajada de 75 mm (9801-9811; la Tabla 710.1(2) del IPC 2015 en up.codes NO trae esa nota). */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/* ------------------------------------------------------------------ constantes físicas y de unidades */
const GAL_L = 3.785411784;                 // 1 galón US = 3.785411784 L (definición exacta)
const GPM_LS = GAL_L / 60;                 // 0.0630902 L/s por gpm
const PSI_M = 6894.757293168 / 9806.65;    // 1 psi en metros de columna de agua = 0.703070 m
const IN_MM = 25.4;
const G = 9.81, CP = 4.186;                // m/s² · kJ/(kg·K) (ρ = 1000 kg/m³)

/* ------------------------------------------------------------------ IPC 2015 Table E103.3(3) · Table for estimating demand
   Columnas: load (WSFU) → demand (gpm). Transcrita completa; verificada renglón por renglón en up.codes el 22-sep-2026. */
const E103_3_3 = {
  tanque: [[1, 3.0], [2, 5.0], [3, 6.5], [4, 8.0], [5, 9.4], [6, 10.7], [7, 11.8], [8, 12.8], [9, 13.7], [10, 14.6], [11, 15.4], [12, 16.0],
    [13, 16.5], [14, 17.0], [15, 17.5], [16, 18.0], [17, 18.4], [18, 18.8], [19, 19.2], [20, 19.6], [25, 21.5], [30, 23.3], [35, 24.9],
    [40, 26.3], [45, 27.7], [50, 29.1], [60, 32.0], [70, 35.0], [80, 38.0], [90, 41.0], [100, 43.5], [120, 48.0], [140, 52.5], [160, 57.0],
    [180, 61.0], [200, 65.0], [225, 70.0], [250, 75.0], [275, 80.0], [300, 85.0], [400, 105], [500, 124], [750, 170], [1000, 208],
    [1250, 239], [1500, 269], [1750, 297], [2000, 325], [2500, 380], [3000, 433], [4000, 525], [5000, 593]],
  fluxometro: [[5, 15.0], [6, 17.4], [7, 19.8], [8, 22.2], [9, 24.6], [10, 27.0], [11, 27.8], [12, 28.6], [13, 29.4], [14, 30.2], [15, 31.0],
    [16, 31.8], [17, 32.6], [18, 33.4], [19, 34.2], [20, 35.0], [25, 38.0], [30, 42.0], [35, 44.0], [40, 46.0], [45, 48.0], [50, 50.0],
    [60, 54.0], [70, 58.0], [80, 61.2], [90, 64.3], [100, 67.5], [120, 73.0], [140, 77.0], [160, 81.0], [180, 85.5], [200, 90.0],
    [225, 95.5], [250, 101.0], [275, 104.5], [300, 108.0], [400, 127], [500, 143], [750, 177], [1000, 208], [1250, 239], [1500, 269],
    [1750, 297], [2000, 325], [2500, 380], [3000, 433], [4000, 525], [5000, 593]],
};
/* Interpolación lineal entre renglones (la norma publica renglones discretos; interpolar es práctica común y es lo que hace la
   suite). Debajo del primer renglón no se calcula: el método pierde sentido (aquí no se usa). */
function hunterGpm(wsfu, tipo) {
  const t = E103_3_3[tipo];
  if (wsfu < t[0][0] || wsfu > t[t.length - 1][0]) throw new Error(`hunterGpm: ${wsfu} WSFU fuera de la tabla ${tipo}`);
  for (let i = 0; i < t.length; i++) {
    if (wsfu === t[i][0]) return t[i][1];
    if (wsfu < t[i][0]) { const [x0, y0] = t[i - 1], [x1, y1] = t[i]; return y0 + (y1 - y0) * (wsfu - x0) / (x1 - x0); }
  }
}
const hunterLs = (wsfu, tipo) => hunterGpm(wsfu, tipo) * GPM_LS;

/* ------------------------------------------------------------------ IPC 2015 Table E103.3(2) · Load values assigned to fixtures
   Uso público (occupancy «public»/«general»), en WSFU: hot / cold / total. Las claves son los id de MUEBLES de la suite. */
const WSFU_PUB = {
  wc_flux:   { hot: 0,   cold: 10,  tot: 10,  ipc: "Water closet, flush valve, public, 1\" supply" },
  wc_tanque: { hot: 0,   cold: 5,   tot: 5,   ipc: "Water closet, flush tank, public, 3/8\" supply" },
  ming_flux: { hot: 0,   cold: 5,   tot: 5,   ipc: "Urinal, 3/4\" flush valve, public" },
  lavabo:    { hot: 1.5, cold: 1.5, tot: 2,   ipc: "Lavatory, public, 1/2\" supply" },
  fregadero: { hot: 3,   cold: 3,   tot: 4,   ipc: "Kitchen sink, hotel/restaurant, 3/4\" supply" },
  regadera:  { hot: 3,   cold: 3,   tot: 4,   ipc: "Shower head, public, 1/2\" supply" },
};
/* Toma de manguera: NO aparece en la Table E103.3(2) (verificado en up.codes). La suite le asigna 5 UM de suministro
   (index.html:9702) sin fuente: es criterio de la casa (H-199). Se usa aquí sólo para reproducir el caso del fixture. */
const UM_CASA = { manguera: 5 };

/* ------------------------------------------------------------------ IPC 2015 Table 709.1 · Drainage fixture units (DFU) */
const DFU = {
  wc_flux: 4,    // Water closet, public, 1.6 gpf → 4 (flushometer tank public/private también 4)
  wc_tanque: 4,  // Water closet, public, 1.6 gpf → 4
  ming_flux: 4,  // Urinal → 4 (1 gpf o menos: 2; sin agua: 0.5)
  lavabo: 1,     // Lavatory → 1
  fregadero: 2,  // Kitchen sink, domestic → 2
  manguera: 0,   // una toma de manguera no descarga al drenaje
};

/* ------------------------------------------------------------------ IPC 2015 Table 604.3 · presión mínima en la salida del mueble (flow pressure, psi)
   Leída en up.codes el 24-sep-2026 (H-194). Renglones: Water closet, siphonic, flushometer valve 35 (blow out 45: no se usa);
   Water closet, tank, close coupled / one piece 20; Urinal, valve 25; Lavatory, public 8; Shower 8 y Shower, balanced-pressure,
   thermostatic or combination mixing valve 20; Sink, residential / Sink, service 8; Laundry tray 8; Drinking fountain 8;
   Sillcock, hose bibb 8. Regadera: §424.3 exige válvula balanceada/termostática en toda regadera individual → rige 20 psi.
   Tarja de laboratorio: no está en la tabla y 604.3 remite al fabricante; la suite la asimila a Sink, service (8 psi): criterio
   de la casa. Lavaojos/regadera de emergencia: no está en 604.3 (ANSI Z358.1, H-195 BLOQUEADO): sin fila. */
const PSI_604_3 = { wc_flux: 35, wc_tanque: 20, ming_flux: 25, lavabo: 8, regadera: 20, fregadero: 8, lavadero: 8, bebedero: 8, manguera: 8 };
const NOM_604_3 = { wc_flux: "Water closet, siphonic, flushometer valve", wc_tanque: "Water closet, tank, close coupled / one piece", ming_flux: "Urinal, valve",
  lavabo: "Lavatory, public", regadera: "Shower, balanced-pressure, thermostatic or combination mixing valve (la válvula que exige §424.3)",
  fregadero: "Sink, residential / Sink, service", lavadero: "Laundry tray", bebedero: "Drinking fountain", manguera: "Sillcock, hose bibb" };
const PSI_CASA = { tarja_lab: 8 };            // asimilada a Sink, service (criterio de la casa)

/* ------------------------------------------------------------------ IPC 2015 · drenaje: 710.1(1) colector, 710.1(2) ramal y bajada, 704.1 pendiente */
/* Table 710.1(1) Building drains and sewers: DFU máximas por pendiente (in/ft). Nota a: un colector con WC no baja de 3". */
const T710_1_1 = [
  { mm: 50,  in: 2, s16: null, s8: null, s4: 21,   s2: 26 },
  { mm: 75,  in: 3, s16: null, s8: 36,   s4: 42,   s2: 50 },
  { mm: 100, in: 4, s16: null, s8: 180,  s4: 216,  s2: 250 },
  { mm: 150, in: 6, s16: null, s8: 700,  s4: 840,  s2: 1000 },
  { mm: 200, in: 8, s16: 1400, s8: 1600, s4: 1920, s2: 2300 },
];
/* Table 710.1(2) Horizontal fixture branches and stacks: ramal horizontal · un intervalo · bajada ≤ 3 intervalos · bajada > 3. */
const T710_1_2 = [
  { mm: 50,  in: 2, ramal: 6,   intervalo: 6,   bajada3: 10,  bajadaMas: 24 },
  { mm: 75,  in: 3, ramal: 20,  intervalo: 20,  bajada3: 48,  bajadaMas: 72 },
  { mm: 100, in: 4, ramal: 160, intervalo: 90,  bajada3: 240, bajadaMas: 500 },
  { mm: 150, in: 6, ramal: 620, intervalo: 350, bajada3: 960, bajadaMas: 1900 },
];
/* 704.1: pendiente mínima ¼ in/ft hasta 2½", ⅛ in/ft de 3" a 6", 1/16 in/ft de 8" en adelante (en %: 2.083, 1.042, 0.521). */
const PEND_MIN_704_1 = (mm) => (mm <= 65 ? 0.25 / 12 : mm <= 150 ? 0.125 / 12 : 0.0625 / 12) * 100;
/* Criterio de la casa (index.html:9801-9811): un ramal o bajada de 75 mm no lleva más de dos WC (el IPC 2015 en up.codes no
   trae esa nota; es regla propia de la suite). Se reproduce sólo para las filas marcadas «criterio de la casa». */
const WC_MAX_CASA = { 50: 0, 75: 2 };
function colectorIPC(ud, pendPct, conWC) {
  const col = pendPct >= 0.25 / 12 * 100 ? "s4" : pendPct >= 0.125 / 12 * 100 ? "s8" : "s16";
  for (const r of T710_1_1) { if (conWC && r.mm < 75) continue; if (r[col] != null && r[col] >= ud) return r.mm; }
  throw new Error("colectorIPC: fuera de tabla");
}
function ramalIPC(ud, wc, conReglaCasa) {
  for (const r of T710_1_2) { if (conReglaCasa && wc > (WC_MAX_CASA[r.mm] ?? 999)) continue; if (r.ramal >= ud) return r.mm; }
  throw new Error("ramalIPC: fuera de tabla");
}
function bajadaIPC(ud, wc, conReglaCasa, masDeTres = false) {
  const k = masDeTres ? "bajadaMas" : "bajada3";
  for (const r of T710_1_2) { if (conReglaCasa && wc > (WC_MAX_CASA[r.mm] ?? 999)) continue; if (r[k] >= ud) return r.mm; }
  throw new Error("bajadaIPC: fuera de tabla");
}
/* IPC 906.2: la ventilación no es menor a la mitad del diámetro del drenaje que ventila ni a 1¼" (32 mm). La suite redondea a 5 mm. */
const ventilacion = (bajadaMm) => Math.max(32, Math.ceil(bajadaMm / 2 / 5) * 5);

/* ------------------------------------------------------------------ NTC-PA Tabla 3.1 · dotación mínima (L/día) */
const NTC_PA_3_1 = { oficina: 50 /* Oficinas de cualquier tipo: 50 L/persona/día */, industria: 100 /* Todo tipo de industria: 100 L/trabajador/día */ };

/* ------------------------------------------------------------------ ASTM B88 tipo L (vía CDA Copper Tube Handbook): OD = nominal + 1/8"; pared tipo L */
const B88_L = { '1/2"': [0.625, 0.040], '3/4"': [0.875, 0.045], '1"': [1.125, 0.050], '1 1/4"': [1.375, 0.055], '1 1/2"': [1.625, 0.060],
  '2"': [2.125, 0.070], '2 1/2"': [2.625, 0.080], '3"': [3.125, 0.090], '4"': [4.125, 0.110] };
const DI = (nom) => (B88_L[nom][0] - 2 * B88_L[nom][1]) * IN_MM;
const COBRE = Object.keys(B88_L).map((nom) => ({ nom, d: DI(nom) }));

/* ------------------------------------------------------------------ hidráulica */
const hazen = (Q_ls, D_mm, C) => 10.67 * Math.pow(Q_ls / 1000, 1.852) / (Math.pow(C, 1.852) * Math.pow(D_mm / 1000, 4.87));   // m/m
const vel = (Q_ls, D_mm) => (Q_ls / 1000) / (Math.PI * Math.pow(D_mm / 1000, 2) / 4);                                          // m/s
function seleccionCobre(Q_ls, vmax) { for (const c of COBRE) if (vel(Q_ls, c.d) <= vmax) return c; throw new Error("fuera de catálogo"); }
const C_COBRE = 140, V_MAX_FRIA = 2.4, V_MAX_CAL = 1.5, F_LEQ = 1.3, RESIDUAL_CASA = 15, ETA_CASA = 0.6;
const kWbomba = (Q_ls, cdt) => G * Q_ls * cdt / 1000 / ETA_CASA;           // ρ·g·Q·H/η con ρ = 1000 → 9.81·Q(L/s)·H/1000/η
const hpBomba = (kW) => Math.ceil(kW / 0.746 * 2) / 2;                       // redondeo a 0.5 HP (criterio de la casa)

/* ------------------------------------------------------------------ utilería de filas */
const filas = [];
const r6 = (x) => Number(Number(x).toPrecision(7));
function fila(id, descripcion, entradas, formula, fuente, caracter, expresion, esperado, tolerancia, estado = "vigente") {
  filas.push({ id, descripcion, entradas, formula, fuente, caracter, expresion, esperado: r6(esperado), tolerancia, estado, calculado_por: "parches/casos-a-mano/hidro.calc.mjs" });
}
const IPC_E = "IPC 2015 Apéndice E (up.codes)";
const PRIM = "primaria (texto público en up.codes, verificado 22-sep-2026)";
const CASA = (linea) => `criterio de la casa (index.html:${linea})`;
const NCASA = "criterio de la casa";

/* =========================================================================================================== CASO 1 · fixture
   Cobre tipo L; AF-GENERAL 72 UM, 25 m, +3 m; AF-RAMAL BAÑOS 20 UM, 18 m, 0 m; muebles wc_flux×4, ming_flux×2, lavabo×4,
   fregadero×1, manguera×2; presRed 0; alturaEdificio 0; presResidual 15; industria, 0 habitantes, 1 día; hidro>quote autorizado. */
const FIX = [["wc_flux", 4], ["ming_flux", 2], ["lavabo", 4], ["fregadero", 1], ["manguera", 2]];
const umFix = FIX.reduce((a, [id, c]) => a + (WSFU_PUB[id] ? WSFU_PUB[id].tot : UM_CASA[id]) * c, 0);         // 72
const umCalIPC = FIX.reduce((a, [id, c]) => a + (WSFU_PUB[id] ? WSFU_PUB[id].hot : 0) * c, 0);                // 9 (lavabo 1.5×4 + fregadero 3)
const udIPC = FIX.reduce((a, [id, c]) => a + DFU[id] * c, 0);                                                  // 30
const wcFix = 4;
const q72 = hunterLs(72, "fluxometro"), q20 = hunterLs(20, "fluxometro");
const s1 = seleccionCobre(q72, V_MAX_FRIA), s2 = seleccionCobre(q20, V_MAX_FRIA);
const J1 = hazen(q72, s1.d, C_COBRE), J2 = hazen(q20, s2.d, C_COBRE);
const hf1 = J1 * 25 * F_LEQ, hf2 = J2 * 18 * F_LEQ;
const hfTotal = (hf1 + 3) + (hf2 + 0);
const presDisp = 0 - hfTotal;
const cdtCasa = 0 + hf1 + hf2 + RESIDUAL_CASA;
const kW1 = kWbomba(q72, cdtCasa);
const presMinIPC = PSI_604_3.wc_flux * PSI_M;                       // 35 psi → 24.6075 m
const cdtIPC = 0 + hf1 + hf2 + Math.max(RESIDUAL_CASA, presMinIPC);
const kWipc = kWbomba(q72, cdtIPC);
const qCalIPC = hunterLs(umCalIPC, "tanque");
const kWcalIPC = qCalIPC * CP * (45 - 18);
const E1 = `cobre; AF-GENERAL 72 UM 25 m +3 m; AF-RAMAL BAÑOS 20 UM 18 m; wc_flux×4 ming_flux×2 lavabo×4 fregadero×1 manguera×2; presRed 0; alturaEdificio 0; residual 15; industria 0 hab 1 día`;

fila("CM.hidro.1.a", "unidades mueble totales (uso público)", E1,
  "4×10 + 2×5 + 4×2 + 1×4 + 2×5 (manguera 5 UM criterio de la casa) = 72", `${IPC_E} Table E103.3(2); manguera: ${CASA(9702)} sin fuente (H-199)`, PRIM,
  "HIDRO.umTotal", umFix, 0.001);
fila("CM.hidro.1.b", "gasto probable del sistema (curva de fluxómetro)", E1,
  "72 WSFU entre renglones 70 (58.0 gpm) y 80 (61.2 gpm): 58.64 gpm × 0.0630902 = 3.69961 L/s", `${IPC_E} Table E103.3(3), columna flush valves`, PRIM,
  "HIDRO.Qtotal", q72, "0.05%");
fila("CM.hidro.1.c", "gasto del ramal de baños", E1,
  "20 WSFU = 35.0 gpm × 0.0630902 = 2.208157 L/s", `${IPC_E} Table E103.3(3), columna flush valves`, PRIM,
  "HIDRO.tramos[1].Q", q20, "0.05%");
fila("CM.hidro.1.d", "diámetro interior de la general: 2\" tipo L (1 1/2\" da 3.22 m/s)", E1,
  "OD 2.125\" − 2×0.070\" = 1.985\" = 50.419 mm; V(1 1/2\") = 3.223 > 2.4 m/s; V(2\") = 1.853 ≤ 2.4", `ASTM B88 tipo L vía CDA Copper Tube Handbook; V máx ${CASA(9784)}`, "secundaria",
  "HIDRO.tramos[0].d", s1.d, 0.01);
fila("CM.hidro.1.e", "velocidad en la general", E1,
  "Q/(π·D²/4) = 0.00369961/(π·0.05042²/4) = 1.8529 m/s", "continuidad; DI ASTM B88 tipo L (CDA)", "secundaria",
  "HIDRO.tramos[0].V", vel(q72, s1.d), "0.05%");
fila("CM.hidro.1.f", "pérdida por fricción de la general (Hazen-Williams, 25 m × 1.3)", E1,
  `J = 10.67·Q^1.852/(140^1.852·D^4.87) = ${J1.toFixed(6)} m/m; hf = J × 25 × 1.3 = ${hf1.toFixed(5)} m`, `Hazen-Williams SI; C 140 y 30 % de accesorios ${CASA("9765, 9887")}`, NCASA,
  "HIDRO.tramos[0].hf", hf1, 0.001);
fila("CM.hidro.1.g", "diámetro interior del ramal de baños: 1 1/2\" tipo L (1 1/4\" da 2.72 m/s)", E1,
  "OD 1.625\" − 2×0.060\" = 1.505\" = 38.227 mm; V(1 1/4\") = 2.724 > 2.4; V(1 1/2\") = 1.924 ≤ 2.4", `ASTM B88 tipo L vía CDA; V máx ${CASA(9784)}`, "secundaria",
  "HIDRO.tramos[1].d", s2.d, 0.01);
fila("CM.hidro.1.h", "velocidad en el ramal de baños", E1,
  "0.002208157/(π·0.03823²/4) = 1.9240 m/s", "continuidad; DI ASTM B88 tipo L (CDA)", "secundaria",
  "HIDRO.tramos[1].V", vel(q20, s2.d), "0.05%");
fila("CM.hidro.1.i", "pérdida por fricción del ramal (18 m × 1.3)", E1,
  `J = ${J2.toFixed(6)} m/m; hf = J × 18 × 1.3 = ${hf2.toFixed(5)} m`, `Hazen-Williams SI; ${CASA("9765, 9887")}`, NCASA,
  "HIDRO.tramos[1].hf", hf2, 0.001);
fila("CM.hidro.1.j", "pérdida acumulada de todos los tramos (fricción + altura estática)", E1,
  `(${hf1.toFixed(5)} + 3) + (${hf2.toFixed(5)} + 0) = ${hfTotal.toFixed(5)} m`, CASA(9926), NCASA,
  "HIDRO.hfTotal", hfTotal, 0.002);
fila("CM.hidro.1.k", "presión disponible en el mueble más desfavorable (toma 0 m)", E1,
  `0 − ${hfTotal.toFixed(5)} = ${presDisp.toFixed(5)} m (negativa: no alcanza)`, CASA(9927), NCASA,
  "HIDRO.presDisp", presDisp, 0.002);
fila("CM.hidro.1.l", "la presión no alcanza (presOk falso → 0)", E1,
  `${presDisp.toFixed(2)} m < 24.6 m (IPC 604.3, WC con fluxómetro): falso`, CASA(9928), NCASA,
  "HIDRO.presOk ? 1 : 0", 0, 0);
/* Las filas 1.m, 1.n y 1.o (CDT, kW y HP con el residual fijo de 15 m, sin fuente) se retiraron al cerrar H-194: las sustituyen
   1.aa, 1.ab y 1.ac con la presión mínima de la Tabla 604.3. El residual de la casa sigue vigilado en el caso 14. */
fila("CM.hidro.1.p", "el sistema es de fluxómetro (1) porque hay WC/mingitorio con fluxómetro", E1,
  "hay muebles con válvula de fluxómetro → columna «predominantly flush valves»", `${IPC_E} E103.3`, PRIM,
  "HIDRO.tipoSistema === \"fluxometro\" ? 1 : 0", 1, 0);
fila("CM.hidro.1.q", "ramal horizontal de drenaje: 100 mm", E1,
  "con 52 UD (suite) o 30 UD (709.1): 3\" admite 20 UD → 4\" (160 UD); además 4 WC > 2 en 75 mm (regla de la casa)", "IPC 2015 Table 710.1(2), columna horizontal branch (up.codes)", PRIM,
  "HIDRO.ramal.d", ramalIPC(udIPC, wcFix, true), 0);
fila("CM.hidro.1.r", "bajada: 100 mm", E1,
  "52 UD (suite) supera 48 (3\", ≤ 3 intervalos); con 30 UD la regla de la casa de 2 WC en 75 mm también la sube a 100", "IPC 2015 Table 710.1(2) (up.codes); WC en 75 mm: " + CASA(9803), PRIM,
  "HIDRO.bajada.d", bajadaIPC(udIPC, wcFix, true), 0);
fila("CM.hidro.1.s", "ventilación primaria: mitad de la bajada, no menor a 32 mm", E1,
  "100 / 2 = 50 mm (≥ 32 mm)", "IPC 2015 §906.2 (up.codes; la suite cita «916», H-204); redondeo a 5 mm " + CASA(9936), PRIM,
  "HIDRO.ventD", ventilacion(100), 0);
fila("CM.hidro.1.t", "potencia térmica por litro por segundo de agua caliente (ΔT 27 K)", E1,
  "kWcal / Qcal = ρ·cp·ΔT = 4.186 × (45 − 18) = 113.022 kW por L/s (no depende de las unidades mueble)", "calor sensible del agua, cp 4.186 kJ/(kg·K)", "primaria (constante física)",
  "HIDRO.kWcal / HIDRO.Qcal", CP * 27, "0.05%");
/* fase 2 · H-199 agua caliente con la columna «hot» de E103.3(2) */
fila("CM.hidro.1.u", "unidades mueble de agua caliente por la columna «hot» de E103.3(2) (hoy la suite da 7.2 con fracciones 0.6 sin fuente)", E1,
  "lavabo público 1.5 × 4 + fregadero hotel/restaurante 3 × 1 = 9 WSFU", `${IPC_E} Table E103.3(2), columna hot`, PRIM,
  "HIDRO.umCal", umCalIPC, 0.001, "fase2:H-199");
fila("CM.hidro.1.v", "gasto de agua caliente por la curva de tanque con 9 WSFU (hoy 0.7374 L/s)", E1,
  "9 WSFU = 13.7 gpm × 0.0630902 = 0.864336 L/s", `${IPC_E} Table E103.3(3), columna flush tanks`, PRIM,
  "HIDRO.Qcal", qCalIPC, "0.05%", "fase2:H-199");
fila("CM.hidro.1.w", "potencia del calentador con 9 WSFU (hoy 83.3 kW)", E1,
  "0.864336 × 4.186 × 27 = 97.69 kW", `${IPC_E} + calor sensible`, PRIM,
  "HIDRO.kWcal", kWcalIPC, "0.05%", "fase2:H-199");
/* fase 2 · H-203 unidades de descarga de 709.1 */
fila("CM.hidro.1.x", "unidades de descarga por IPC 709.1 (hoy la suite da 52: WC con fluxómetro 8, mingitorio 4, manguera 3)", E1,
  "WC público 1.6 gpf 4 × 4 + mingitorio 4 × 2 + lavabo 1 × 4 + fregadero doméstico 2 × 1 + manguera 0 = 30 DFU", "IPC 2015 Table 709.1 (up.codes)", PRIM,
  "HIDRO.udTotal", udIPC, 0.001, "fase2:H-203");
/* fase 2 · H-201 colector con la tabla 710.1(1) (requiere también H-203 para las 30 UD) */
fila("CM.hidro.1.y", "colector con 30 UD al 2 %: 75 mm (hoy 100 mm porque la suite trae 20/27 UD para 75 mm y 52 UD)", E1,
  "al 2 % rige la columna 1/8 in/ft (1/4 in/ft = 2.083 %): 3\" admite 36 ≥ 30 UD; mínimo 3\" con WC (nota a). Requiere H-203 (30 UD) y H-201 (tabla)", "IPC 2015 Table 710.1(1) (up.codes)", PRIM,
  "HIDRO.colector.d", colectorIPC(udIPC, 2, true), 0, "fase2:H-201");
/* H-194 (cerrado en la rev 2.9.24, hidro v5): presión mínima de la Tabla 604.3; antes 10.5 m sin fuente y CDT con residual fijo. */
fila("CM.hidro.1.z", "presión mínima requerida: WC con fluxómetro sifónico 35 psi (antes 10.5 m sin fuente)", E1,
  "35 psi × 0.703070 m/psi = 24.6075 m", "IPC 2015 Table 604.3 (up.codes)", PRIM,
  "HIDRO.presMinReq", presMinIPC, 0.01);
fila("CM.hidro.1.aa", "CDT con máx(residual 15, mínima 604.3) (antes 19.95 m con el residual fijo)", E1,
  `0 + ${hf1.toFixed(5)} + ${hf2.toFixed(5)} + máx(15, 24.6075) = ${cdtIPC.toFixed(4)} m`, "IPC 2015 Table 604.3; CDT " + CASA(9950), PRIM,
  "HIDRO.cdt", cdtIPC, 0.01);
fila("CM.hidro.1.ab", "potencia al eje con la CDT de 604.3 (antes 1.207 kW)", E1,
  `9.81 × 3.69961 × ${cdtIPC.toFixed(4)} / 1000 / 0.6 = ${kWipc.toFixed(5)} kW`, "IPC 2015 Table 604.3; η 0.6 " + CASA(9968), PRIM,
  "HIDRO.kWbomba", kWipc, "0.1%");
fila("CM.hidro.1.ac", "HP nominales con la CDT de 604.3 (antes 2 HP)", E1,
  `ceil(${kWipc.toFixed(5)} / 0.746 × 2) / 2 = 2.5 HP (2.5 HP no es comercial: H-203)`, "IPC 2015 Table 604.3; redondeo " + CASA(9969), PRIM,
  "HIDRO.hpBomba", hpBomba(kWipc), 0);
/* fase 2 · H-196 cisterna y bomba con precio semilla */
fila("CM.hidro.1.ad", "importe de «Cisterna de 0 m³ y equipo de bombeo de 2 HP» en la cotización (hoy 29,000 MXN = 9,500×0 + 14,500×2 sin fuente)", E1 + "; hidro>quote autorizado",
  "regla de precios 22-sep: sin fuente y fecha → «Por cotizar» (importe 0 en aux); bomba sólo con presOk falso", "PLAN-CRITICOS.md §2 Fase 2 H-196 (decisión del dueño)", "decisión del dueño",
  "QUOTE.aux.filter((a) => a.mot === \"hidro\" && /^Cisterna/.test(a.desc)).reduce((s, a) => s + a.total, 0)", 0, 0, "fase2:H-196");

/* =========================================================================================================== CASO 2 · agua caliente por tramo
   Fixture + AC-1 caliente 20 UM 10 m tipoUM «tanque» (explícito) + AC-2 caliente 20 UM 10 m tipoUM «auto». */
const qAC = hunterLs(20, "tanque");
const sAC = seleccionCobre(qAC, V_MAX_CAL);
const hfAC = hazen(qAC, sAC.d, C_COBRE) * 10 * F_LEQ;
const E2 = "fixture + AC-1 caliente 20 UM 10 m tipoUM tanque + AC-2 caliente 20 UM 10 m tipoUM auto";
fila("CM.hidro.2.a", "tramo de agua caliente con curva de tanque explícita: gasto", E2,
  "20 WSFU = 19.6 gpm × 0.0630902 = 1.236568 L/s", `${IPC_E} Table E103.3(3), columna flush tanks`, PRIM,
  "HIDRO.tramos[2].Q", qAC, "0.05%");
fila("CM.hidro.2.b", "agua caliente se limita a 1.5 m/s: 1 1/4\" da 1.525 → 1 1/2\" (38.23 mm)", E2,
  "V(1 1/4\", 32.13 mm) = 1.5254 > 1.5; V(1 1/2\", 38.23 mm) = 1.0773 ≤ 1.5", `V máx caliente ${CASA(9784)}; DI ASTM B88 tipo L (CDA)`, NCASA,
  "HIDRO.tramos[2].d", sAC.d, 0.01);
fila("CM.hidro.2.c", "velocidad del tramo de agua caliente", E2,
  "0.001236568/(π·0.03823²/4) = 1.0773 m/s", "continuidad", "secundaria",
  "HIDRO.tramos[2].V", vel(qAC, sAC.d), "0.05%");
fila("CM.hidro.2.d", "pérdida del tramo de agua caliente (10 m × 1.3)", E2,
  `J = ${hazen(qAC, sAC.d, C_COBRE).toFixed(6)} m/m × 13 m = ${hfAC.toFixed(5)} m`, `Hazen-Williams SI; ${CASA("9765, 9887")}`, NCASA,
  "HIDRO.tramos[2].hf", hfAC, 0.001);
fila("CM.hidro.2.e", "tramo de agua caliente con tipoUM «auto» debe usar la curva de tanque (hoy usa la de fluxómetro del sistema: 2.208 L/s)", E2,
  "20 WSFU tanque = 19.6 gpm = 1.236568 L/s (hoy 35.0 gpm = 2.208157)", `${IPC_E} Table E103.3(3); AUDITORIA H-199 «curva de tanque para agua caliente»`, PRIM,
  "HIDRO.tramos[3].Q", qAC, "0.05%", "fase2:H-199");
fila("CM.hidro.2.f", "diámetro del tramo «auto» con la curva de tanque (hoy 2\" 50.42 mm)", E2,
  "1.236568 L/s a ≤ 1.5 m/s → 1 1/2\" (38.23 mm)", `${IPC_E}; V máx caliente ${CASA(9784)}`, PRIM,
  "HIDRO.tramos[3].d", sAC.d, 0.01, "fase2:H-199");

/* =========================================================================================================== CASO 3 · cisterna por dotación */
const E3 = "fixture; dot y habitantes y diasReserva según la fila";
fila("CM.hidro.3.a", "industria, 60 trabajadores, 1 día de reserva", E3 + " (industria 60 hab 1 día)",
  "100 L/trabajador/día × 60 × 1 = 6,000 L", "NTC-PA Tabla 3.1 «Todo tipo de industria 100 L/trabajador/día» (parches/normas-texto, renglón 1134)", "primaria",
  "HIDRO.cisterna", NTC_PA_3_1.industria * 60 * 1, 0.5);
fila("CM.hidro.3.b", "industria, 60 trabajadores, 2 días de reserva", E3 + " (industria 60 hab 2 días)",
  "100 × 60 × 2 = 12,000 L", "NTC-PA Tabla 3.1 (renglón 1134); días de reserva: captura", "primaria",
  "HIDRO.cisterna", NTC_PA_3_1.industria * 60 * 2, 0.5);
fila("CM.hidro.3.c", "oficinas, 100 personas, 1 día (hoy 7,000 L con 70 L «NTC / reglamentos de BC» no trazable)", E3 + " (oficina 100 hab 1 día)",
  "50 L/persona/día × 100 × 1 = 5,000 L", "NTC-PA Tabla 3.1 «Oficinas de cualquier tipo 50 L/persona/día» (parches/normas-texto, renglones 1079-1083)", "primaria",
  "HIDRO.cisterna", NTC_PA_3_1.oficina * 100 * 1, 0.5, "fase2:H-202");
fila("CM.hidro.3.d", "0 días de reserva capturados: se respeta la captura (antes piso 0.5 día → 3,000 L)", E3 + " (industria 60 hab 0 días)",
  "100 × 60 × 0 = 0 L; la partida queda pendiente, no se estima", "PLAN-CRITICOS.md §2 Fase 2 H-197 «respetar captura»; CLAUDE.md regla 6 (nada se estima)", "decisión del dueño",
  "HIDRO.cisterna", 0, 0);
fila("CM.hidro.3.e", "días de reserva negativos capturados: cisterna 0, no se invierte el signo (H-197)", E3 + " (industria 60 hab −1 día)",
  "100 × 60 × máx(0, −1) = 0 L; la partida queda pendiente", "CLAUDE.md regla 6 (nada se estima); captura inválida no se corrige sola", "decisión del dueño",
  "HIDRO.cisterna", 0, 0);

/* =========================================================================================================== CASO 4 · sistema de tanque: 4 WC con tanque, sin otro mueble */
const um4 = WSFU_PUB.wc_tanque.tot * 4, ud4 = DFU.wc_tanque * 4;
const E4 = "sólo wc_tanque×4; sin tramos; presRed 0";
fila("CM.hidro.4.a", "unidades mueble de 4 WC con tanque (público)", E4,
  "5 × 4 = 20 WSFU", `${IPC_E} Table E103.3(2) «Water closet, flush tank, public»`, PRIM,
  "HIDRO.umTotal", um4, 0.001);
fila("CM.hidro.4.b", "sin fluxómetros el sistema es de tanque (0)", E4,
  "ningún mueble con válvula de fluxómetro → columna «predominantly flush tanks»", `${IPC_E} E103.3`, PRIM,
  "HIDRO.tipoSistema === \"fluxometro\" ? 1 : 0", 0, 0);
fila("CM.hidro.4.c", "gasto probable con la curva de tanque", E4,
  "20 WSFU = 19.6 gpm × 0.0630902 = 1.236568 L/s", `${IPC_E} Table E103.3(3), columna flush tanks`, PRIM,
  "HIDRO.Qtotal", hunterLs(um4, "tanque"), "0.05%");
fila("CM.hidro.4.d", "unidades de descarga de 4 WC con tanque", E4,
  "4 DFU × 4 = 16 (WC público 1.6 gpf)", "IPC 2015 Table 709.1 (up.codes)", PRIM,
  "HIDRO.udTotal", ud4, 0.001);
fila("CM.hidro.4.e", "ramal con 16 UD y 4 WC: 100 mm por la regla de la casa de dos WC en 75 mm (el IPC 2015 admitiría 3\": 20 UD)", E4,
  "3\" admite 20 ≥ 16 UD, pero wcMax(75 mm) = 2 < 4 → 100 mm", CASA("9801-9811") + "; la Table 710.1(2) del IPC 2015 en up.codes no trae la nota de dos WC", NCASA,
  "HIDRO.ramal.d", ramalIPC(ud4, 4, true), 0);
fila("CM.hidro.4.f", "colector con 16 UD al 2 %: 75 mm (mínimo 3\" con WC)", E4,
  "columna 1/8 in/ft (2 % < 2.083 %): 3\" admite 36 ≥ 16 UD; nota a: mínimo 3\" con WC", "IPC 2015 Table 710.1(1) (up.codes)", PRIM,
  "HIDRO.colector.d", colectorIPC(ud4, 2, true), 0);
fila("CM.hidro.4.g", "ventilación primaria con bajada de 100 mm", E4,
  "100/2 = 50 mm", "IPC 2015 §906.2 (up.codes)", PRIM,
  "HIDRO.ventD", ventilacion(bajadaIPC(ud4, 4, true)), 0);

/* =========================================================================================================== CASO 5 · regadera de emergencia (H-195)
   Fuente SECUNDARIA, leída el 24-sep-2026: cartas de interpretación de OSHA que citan ANSI Z358.1 (edición 1990):
     · 18-abr-2002 (§4.1 de Z358.1): regadera de emergencia ≥ 75.7 L/min (20 gpm), volumen para ≥ 15 min.
       https://www.osha.gov/laws-regs/standardinterpretations/2002-04-18-1
     · 22-nov-1993 (Z358.1-1990): lavaojos fijo ≥ 1.5 L/min (0.4 gal/min).
       https://www.osha.gov/laws-regs/standardinterpretations/1993-11-22
   Ninguna carta da presión ni temperatura (la de 2002 deja la temperatura a la evaluación del patrón). Z358.1-2014 no está
   en texto: se ratifica con él. Los equipos de emergencia salen de Hunter (E103.3(2) no los lista) y su gasto se suma fijo. */
const Q_REG_EMERG = 20 * GPM_LS, Q_LAVAOJOS = 0.4 * GPM_LS;              // L/s
const E5 = "sólo lavaojos×1 (regadera de emergencia con lavaojos); sin tramos";
fila("CM.hidro.5.a", "regadera de emergencia: demanda fija de 20 gpm fuera de Hunter (antes 6 UM → curva de tanque 10.44 gpm = 0.659 L/s)", E5,
  "20 gpm × 3.785411784 / 60 = 1.261804 L/s", "ANSI Z358.1-1990 §4.1 vía carta OSHA 18-abr-2002 (SECUNDARIA; ratificar con Z358.1-2014)", "secundaria",
  "HIDRO.Qtotal", Q_REG_EMERG, "0.05%");
fila("CM.hidro.5.b", "la regadera de emergencia no suma unidades mueble (E103.3(2) no la lista; antes 6 UM)", E5,
  "0 WSFU", "IPC 2015 Table E103.3(2) (up.codes): sin renglón de equipo de emergencia", PRIM,
  "HIDRO.umTotal", 0, 0);
fila("CM.hidro.5.c", "volumen de agua para 15 min de la regadera de emergencia", E5,
  "20 gpm × 15 min × 3.785411784 L/gal = 1,135.62 L", "ANSI Z358.1-1990 §4.1 vía carta OSHA 18-abr-2002 (SECUNDARIA)", "secundaria",
  "HIDRO.volEmerg", 20 * 15 * GAL_L, 0.01);

/* =========================================================================================================== CASO 6 · CPVC arriba de 2" */
fila("CM.hidro.6.a", "renglones CPVC de 2 1/2\", 3\" y 4\" marcados «SIN VERIFICAR» retirados del catálogo (hoy 3 renglones; con 3.7 L/s la suite elige 2 1/2\" = 63 mm)", "material cpvc (fixture)",
  "TUB_AGUA.cpvc.d sin renglones con DI > 43.59 mm (2\" CTS SDR-11) → 0", "PLAN-CRITICOS.md §2 Fase 2 H-198 «retirar renglones no verificados → error y Por cotizar»; ASTM D2846 (memoria): CTS hasta 2\"", "decisión del dueño",
  "TUB_AGUA.cpvc.d.filter((x) => x[0] > 43.59).length", 0, 0, "fase2:H-198");

/* =========================================================================================================== CASO 7 · pisos sin norma (H-197): ΔT y pendiente */
fila("CM.hidro.7.a", "tempEntrada = tempSalida = 40 °C: ΔT 0 y calentador pendiente (antes piso ΔT 5 K)", "fixture; tempEntrada 40; tempSalida 40",
  "45 − 18 no aplica: 40 − 40 = 0 K", "PLAN-CRITICOS.md §2 Fase 2 H-197 «ΔT 0 = pendiente»", "decisión del dueño",
  "HIDRO.dT", 0, 0);
fila("CM.hidro.7.c", "con ΔT 0 la potencia del calentador es 0 (pendiente), no la de 5 K supuestos", "fixture; tempEntrada 40; tempSalida 40",
  "Qcal × 4.186 × 0 = 0 kW", "PLAN-CRITICOS.md §2 Fase 2 H-197; calor sensible del agua", "decisión del dueño",
  "HIDRO.kWcal", 0, 0);
fila("CM.hidro.7.b", "pendiente capturada 0.2 % con colector de 100 mm: mínima de norma 1/8 in/ft = 1.042 % con aviso (antes piso 0.5 % sin norma)", "fixture; pendiente 0.2",
  "704.1: 3\" a 6\" → 1/8 in/ft = 0.125/12 = 1.0417 %", "IPC 2015 §704.1 (up.codes); PLAN-CRITICOS Fase 2 H-197 «pendiente mínima de norma con aviso»", PRIM,
  "HIDRO.pend", PEND_MIN_704_1(100), 0.001);
fila("CM.hidro.7.d", "pendiente capturada 3 % (mayor que la mínima de 704.1): se respeta", "fixture; pendiente 3",
  "máx(3, 1.0417) = 3 %", "IPC 2015 §704.1 (up.codes, releído 25-sep-2026)", PRIM,
  "HIDRO.pend", 3, 0.001);
fila("CM.hidro.7.e", "pendiente capturada 0 (vacía o cero) con colector de 100 mm: mínima de 704.1, 1/8 in/ft", "fixture; pendiente 0",
  "máx(0, 0.125/12 × 100) = 1.0417 %", "IPC 2015 §704.1 (up.codes)", PRIM,
  "HIDRO.pend", PEND_MIN_704_1(100), 0.001);

/* =========================================================================================================== CASO 8 · tramo sin longitud (decisión del dueño rev 2.9.16) */
fila("CM.hidro.8.a", "tramo sin longitud: pérdida 0 (no se supone longitud) y marcado sinL", "fixture; AF-GENERAL L 0",
  "L = 0 → Leq = 0 → hf = 0", "decisión del dueño rev 2.9.16 (index.html:9880-9884); H-200 pide además bomba pendiente", "decisión del dueño",
  "HIDRO.tramos[0].hf", 0, 0);
fila("CM.hidro.8.b", "tramo sin longitud queda marcado (sinL → 1)", "fixture; AF-GENERAL L 0",
  "sinL = !(L > 0)", "decisión del dueño rev 2.9.16 (index.html:9884)", "decisión del dueño",
  "HIDRO.tramos[0].sinL ? 1 : 0", 1, 0);

/* =========================================================================================================== CASO 9 · funciones y tablas del motor (sin estado) */
const E9 = "sin estado: se evalúa la función o la tabla directamente";
fila("CM.hidro.9.a", "Hunter: interpolación 75 WSFU tanque entre 70 (35.0) y 80 (38.0)", E9,
  "36.5 gpm × 0.0630902 = 2.302792 L/s", `${IPC_E} Table E103.3(3)`, PRIM,
  "hunterQ(75, \"tanque\")", hunterLs(75, "tanque"), "0.05%");
fila("CM.hidro.9.b", "Hunter: primer renglón de fluxómetro, 5 WSFU", E9,
  "15.0 gpm × 0.0630902 = 0.946353 L/s", `${IPC_E} Table E103.3(3)`, PRIM,
  "hunterQ(5, \"fluxometro\")", hunterLs(5, "fluxometro"), "0.05%");
fila("CM.hidro.9.c", "Hunter: 50 WSFU fluxómetro", E9,
  "50.0 gpm × 0.0630902 = 3.154510 L/s", `${IPC_E} Table E103.3(3)`, PRIM,
  "hunterQ(50, \"fluxometro\")", hunterLs(50, "fluxometro"), "0.05%");
fila("CM.hidro.9.d", "Hunter: 1000 WSFU tanque (desde 1000 las dos columnas coinciden)", E9,
  "208 gpm × 0.0630902 = 13.12276 L/s", `${IPC_E} Table E103.3(3)`, PRIM,
  "hunterQ(1000, \"tanque\")", hunterLs(1000, "tanque"), "0.05%");
fila("CM.hidro.9.e", "Hunter: último renglón, 5000 WSFU fluxómetro", E9,
  "593 gpm × 0.0630902 = 37.41249 L/s", `${IPC_E} Table E103.3(3)`, PRIM,
  "hunterQ(5000, \"fluxometro\")", hunterLs(5000, "fluxometro"), "0.05%");
/* fase 2 · H-203: renglones que la suite no trae (interpola hasta −8 %) */
fila("CM.hidro.9.f", "Hunter: 2 WSFU tanque (renglón publicado; hoy la suite interpola 1–5 y da 4.6 gpm, −8 %)", E9,
  "5.0 gpm × 0.0630902 = 0.315451 L/s", `${IPC_E} Table E103.3(3)`, PRIM,
  "hunterQ(2, \"tanque\")", hunterLs(2, "tanque"), "0.05%", "fase2:H-203");
fila("CM.hidro.9.g", "Hunter: 9 WSFU tanque (renglón publicado; hoy interpola 5–10: 13.56 gpm)", E9,
  "13.7 gpm × 0.0630902 = 0.864336 L/s", `${IPC_E} Table E103.3(3)`, PRIM,
  "hunterQ(9, \"tanque\")", hunterLs(9, "tanque"), "0.05%", "fase2:H-203");
fila("CM.hidro.9.h", "Hunter: 15 WSFU tanque (renglón publicado; hoy interpola 10–20: 17.1 gpm, −2.3 %)", E9,
  "17.5 gpm × 0.0630902 = 1.104079 L/s", `${IPC_E} Table E103.3(3)`, PRIM,
  "hunterQ(15, \"tanque\")", hunterLs(15, "tanque"), "0.05%", "fase2:H-203");
fila("CM.hidro.9.i", "Hunter: 25 WSFU fluxómetro (renglón publicado; hoy interpola 20–30: 38.5 gpm, +1.3 %)", E9,
  "38.0 gpm × 0.0630902 = 2.397428 L/s", `${IPC_E} Table E103.3(3)`, PRIM,
  "hunterQ(25, \"fluxometro\")", hunterLs(25, "fluxometro"), "0.05%", "fase2:H-203");
fila("CM.hidro.9.j", "Hunter: 120 WSFU fluxómetro (renglón publicado; hoy interpola 100–140: 72.25 gpm, −1.0 %)", E9,
  "73.0 gpm × 0.0630902 = 4.605585 L/s", `${IPC_E} Table E103.3(3)`, PRIM,
  "hunterQ(120, \"fluxometro\")", hunterLs(120, "fluxometro"), "0.05%", "fase2:H-203");
/* Hazen-Williams y velocidad como funciones */
fila("CM.hidro.9.k", "Hazen-Williams: J para 3.69961 L/s en 50.42 mm con C 140", E9,
  `10.67 × 0.00369961^1.852 / (140^1.852 × 0.05042^4.87) = ${J1.toFixed(6)} m/m`, "Hazen-Williams SI (fórmula clásica)", "primaria (fórmula)",
  "hazen(3.69961, 50.42, 140)", J1, "0.05%");
fila("CM.hidro.9.l", "velocidad para 3.69961 L/s en 50.42 mm", E9,
  "0.00369961 / (π × 0.05042² / 4) = 1.8529 m/s", "continuidad", "primaria (fórmula)",
  "velAgua(3.69961, 50.42)", vel(3.69961, 50.42), "0.05%");
/* ASTM B88 tipo L: diámetros interiores del catálogo de cobre */
[["1/2\"", 0], ["1 1/2\"", 4], ["2\"", 5], ["4\"", 8]].forEach(([nom, i], k) => {
  const [od, e] = B88_L[nom];
  fila(`CM.hidro.9.${["m", "n", "o", "p"][k]}`, `DI de cobre tipo L ${nom} en el catálogo`, E9,
    `(${od} − 2 × ${e}) in × 25.4 = ${DI(nom).toFixed(3)} mm`, "ASTM B88 tipo L vía CDA Copper Tube Handbook (tabla de dimensiones)", "secundaria",
    `TUB_AGUA.cobre.d[${i}][0]`, DI(nom), 0.01);
});
/* Drenaje como función (IPC 2015 710.1) */
fila("CM.hidro.9.q", "ramal con 40 UD sin WC: 100 mm", E9,
  "3\" admite 20 < 40; 4\" admite 160 ≥ 40", "IPC 2015 Table 710.1(2) columna horizontal branch (up.codes)", PRIM,
  "sizeDrenaje(40, 0, \"ramal\", 0).d", ramalIPC(40, 0, true), 0);
fila("CM.hidro.9.r", "ramal con 5 UD: 50 mm", E9,
  "2\" admite 6 ≥ 5", "IPC 2015 Table 710.1(2) (up.codes)", PRIM,
  "sizeDrenaje(5, 0, \"ramal\", 0).d", ramalIPC(5, 0, true), 0);
fila("CM.hidro.9.s", "bajada con 40 UD sin WC: 75 mm", E9,
  "3\": 48 (≤ 3 intervalos) y 72 (> 3) ≥ 40 en ambas columnas", "IPC 2015 Table 710.1(2) columnas stack (up.codes)", PRIM,
  "sizeDrenaje(40, 0, \"bajada\", 0).d", bajadaIPC(40, 0, true), 0);
fila("CM.hidro.9.t", "colector con 150 UD al 1.05 % (≥ 1/8 in/ft = 1.042 %): 100 mm", E9,
  "columna 1/8 in/ft: 3\" 36 < 150; 4\" 180 ≥ 150", "IPC 2015 Table 710.1(1) (up.codes)", PRIM,
  "sizeDrenaje(150, 0, \"colector\", 1.05).d", colectorIPC(150, 1.05, false), 0);
fila("CM.hidro.9.u", "colector con 150 UD al 2 %: 100 mm", E9,
  "2 % queda entre 1/8 (1.042 %) y 1/4 in/ft (2.083 %): rige la columna 1/8: 3\" 36 < 150; 4\" 180 ≥ 150 (la suite usa la columna 1/4 desde 2 %: 216; mismo resultado)", "IPC 2015 Table 710.1(1) (up.codes)", PRIM,
  "sizeDrenaje(150, 0, \"colector\", 2).d", colectorIPC(150, 2, false), 0);
fila("CM.hidro.9.v", "colector con 700 UD al 1.05 %: 150 mm", E9,
  "columna 1/8 in/ft: 4\" 180 < 700; 6\" 700 ≥ 700", "IPC 2015 Table 710.1(1) (up.codes)", PRIM,
  "sizeDrenaje(700, 0, \"colector\", 1.05).d", colectorIPC(700, 1.05, false), 0);
fila("CM.hidro.9.w", "ramal con 12 UD y 3 WC: 100 mm por la regla de la casa (dos WC en 75 mm)", E9,
  "3\" admite 20 ≥ 12 UD, pero wcMax(75) = 2 < 3 → 100 mm", CASA("9801-9811") + " (el IPC 2015 no trae la nota)", NCASA,
  "sizeDrenaje(12, 3, \"ramal\", 0).d", ramalIPC(12, 3, true), 0);
/* fase 2 · H-201 filas mal transcritas de 710.1 */
fila("CM.hidro.9.x", "colector con 30 UD al 2 %: 75 mm (hoy 100: la suite trae 27 UD para 75 mm; IPC 42)", E9,
  "columna 1/8 in/ft (2 % < 2.083 %): 3\" 36 ≥ 30 (la suite usa 1/4 desde 2 %: 42; mismo resultado)", "IPC 2015 Table 710.1(1) (up.codes)", PRIM,
  "sizeDrenaje(30, 0, \"colector\", 2).d", colectorIPC(30, 2, false), 0, "fase2:H-201");
fila("CM.hidro.9.y", "colector con 30 UD al 1.05 %: 75 mm (hoy 100: la suite trae 20 UD para 75 mm; IPC 36)", E9,
  "columna 1/8 in/ft: 3\" 36 ≥ 30", "IPC 2015 Table 710.1(1) (up.codes)", PRIM,
  "sizeDrenaje(30, 0, \"colector\", 1.05).d", colectorIPC(30, 1.05, false), 0, "fase2:H-201");
fila("CM.hidro.9.z", "bajada con 60 UD sin WC con la columna «≤ 3 intervalos»: 100 mm (hoy 75: la suite trae 70 UD para 75 mm y usa la columna > 3)", E9,
  "3\" ≤ 3 intervalos admite 48 < 60 → 4\" (240)", "IPC 2015 Table 710.1(2) (up.codes); AUDITORIA H-201 «columna ≤ 3 intervalos»", PRIM,
  "sizeDrenaje(60, 0, \"bajada\", 0).d", bajadaIPC(60, 0, false, false), 0, "fase2:H-201");

/* =========================================================================================================== CASO 10 · CDT con altura del edificio */
fila("CM.hidro.10.a", "CDT con altura del edificio 6 m (la altura estática que manda es la del edificio, no la suma de tramos)", "fixture; alturaEdificio 6",
  `6 + ${hf1.toFixed(5)} + ${hf2.toFixed(5)} + máx(15, 24.6075) = ${(6 + hf1 + hf2 + Math.max(RESIDUAL_CASA, presMinIPC)).toFixed(4)} m (antes de H-194: + 15 = ${(6 + hf1 + hf2 + 15).toFixed(4)})`,
  `decisión del dueño 15-sep-2026 (index.html:9950-9960); mínima IPC 2015 Table 604.3 (H-194); residual 15 ${CASA(9853)}`, "decisión del dueño",
  "HIDRO.cdt", 6 + hf1 + hf2 + Math.max(RESIDUAL_CASA, presMinIPC), 0.002);

/* =========================================================================================================== CASO 11 · presión disponible contra el mueble que gobierna */
fila("CM.hidro.11.a", "toma de 8 m con un lavabo (5.6 m) y un WC con fluxómetro: gobierna el WC y no alcanza (presOk 0)", "presRed 8; wc_flux×1 lavabo×1; sin tramos",
  "requerida = máx(muebles): WC fluxómetro 35 psi = 24.6 m > 8 m disponibles → no alcanza", "IPC 2015 Table 604.3 (up.codes); regla del máximo " + CASA(9868), PRIM,
  "HIDRO.presOk ? 1 : 0", 0, 0);

/* =========================================================================================================== CASO 12 · presión mínima por mueble (H-194, IPC 2015 Table 604.3) */
const E12 = "sin estado: se lee la tabla MUEBLES directamente (muebleDe(id).presMin)";
Object.entries(PSI_604_3).forEach(([id, psi], k) => {
  fila(`CM.hidro.12.${"abcdefghi"[k]}`, `presión mínima en la salida del mueble «${id}» (${NOM_604_3[id]}): ${psi} psi`, E12,
    `${psi} psi × 0.703070 m/psi = ${(psi * PSI_M).toFixed(4)} m`, `IPC 2015 Table 604.3 (up.codes, releída 24-sep-2026)${id === "regadera" ? "; §424.3 (válvula obligatoria)" : ""}`, PRIM,
    `muebleDe(${JSON.stringify(id)}).presMin`, psi * PSI_M, 0.001);
});
fila("CM.hidro.12.j", "presión mínima de la tarja de laboratorio: no está en la Table 604.3, se asimila a Sink, service (8 psi)", E12,
  "8 psi × 0.703070 m/psi = 5.6246 m", "criterio de la casa (604.3 remite al fabricante para muebles no listados)", NCASA,
  "muebleDe(\"tarja_lab\").presMin", PSI_CASA.tarja_lab * PSI_M, 0.001);

/* =========================================================================================================== CASO 13 · sin muebles capturados (H-194) */
fila("CM.hidro.13.a", "sin muebles capturados la presión requerida es el menor renglón de la Table 604.3 (8 psi; antes 5.6 m sin fuente)", "fixture sin muebles",
  "8 psi × 0.703070 m/psi = 5.6246 m", "criterio de la casa sobre la IPC 2015 Table 604.3 (el menor renglón de la tabla)", NCASA,
  "HIDRO.presMinReq", 8 * PSI_M, 0.001);

/* =========================================================================================================== CASO 14 · CDT cuando rige el residual de la casa (H-194)
   Fixture con sólo lavabo×2: sin fluxómetros el sistema es de tanque, así que los tramos (72 y 20 UM) van por la columna de tanque. */
const q72t = hunterLs(72, "tanque"), q20t = hunterLs(20, "tanque");
const s1t = seleccionCobre(q72t, V_MAX_FRIA), s2t = seleccionCobre(q20t, V_MAX_FRIA);
const hf1t = hazen(q72t, s1t.d, C_COBRE) * 25 * F_LEQ, hf2t = hazen(q20t, s2t.d, C_COBRE) * 18 * F_LEQ;
const presMinLav = PSI_604_3.lavabo * PSI_M;
const cdt14 = 0 + hf1t + hf2t + Math.max(RESIDUAL_CASA, presMinLav);
const E14 = "fixture con muebles lavabo×2 (sistema de tanque; tramos 72 y 20 UM por la columna de tanque)";
fila("CM.hidro.14.a", "presión requerida con sólo lavabos: Lavatory, public 8 psi", E14,
  "8 psi × 0.703070 m/psi = 5.6246 m", "IPC 2015 Table 604.3 (up.codes)", PRIM,
  "HIDRO.presMinReq", presMinLav, 0.001);
fila("CM.hidro.14.b", "con sólo lavabos (5.62 m < 15 m) la CDT lleva el residual de la casa, no la mínima de norma", E14,
  `0 + ${hf1t.toFixed(5)} (72 WSFU tanque ${(q72t).toFixed(5)} L/s en ${s1t.nom}) + ${hf2t.toFixed(5)} (20 WSFU tanque ${(q20t).toFixed(5)} L/s en ${s2t.nom}) + máx(15, 5.6246) = ${cdt14.toFixed(4)} m`,
  `IPC 2015 Table 604.3; residual 15 ${CASA(9853)}; CDT ${CASA(9950)}`, NCASA,
  "HIDRO.cdt", cdt14, 0.01);   // ±0.01: el ramal de 20 UM va en 1" y el DI independiente (26.035 mm, B88 vía CDA) difiere 0.005 mm del de la suite (26.04): 0.007 m en hf; la fila vigila el +15 contra +5.62/+24.6

/* =========================================================================================================== CASO 15 · fixture + regadera de emergencia (H-195)
   El gasto de emergencia se suma al de Hunter del sistema; el tramo que lo lleva lo declara capturado (L/min). */
const E15 = "fixture + lavaojos×1; AF-GENERAL con 75.7 L/min de emergencia capturados";
const q15 = q72 + 75.7 / 60;                                              // gasto del tramo: Hunter + lo capturado
const s15 = seleccionCobre(q15, V_MAX_FRIA);
fila("CM.hidro.15.a", "gasto del sistema: Hunter de los muebles (72 WSFU fluxómetro) más la regadera de emergencia fija", E15,
  `${q72.toFixed(6)} + 20 gpm × 0.0630902 = ${(q72 + Q_REG_EMERG).toFixed(6)} L/s`, `${IPC_E} Table E103.3(3); Z358.1-1990 §4.1 vía OSHA (secundaria)`, "secundaria",
  "HIDRO.Qtotal", q72 + Q_REG_EMERG, "0.05%");
fila("CM.hidro.15.b", "las unidades mueble no cambian con la regadera de emergencia (72, no 78)", E15,
  "4×10 + 2×5 + 4×2 + 1×4 + 2×5 = 72", `${IPC_E} Table E103.3(2)`, PRIM,
  "HIDRO.umTotal", umFix, 0.001);
fila("CM.hidro.15.c", "gasto del tramo que lleva la emergencia: Hunter del tramo + 75.7 L/min capturados", E15,
  `${q72.toFixed(6)} + 75.7 / 60 = ${q15.toFixed(6)} L/s`, `${IPC_E} Table E103.3(3); gasto de emergencia capturado en el tramo`, PRIM,
  "HIDRO.tramos[0].Q", q15, "0.05%");
fila("CM.hidro.15.d", "diámetro de ese tramo con la emergencia: 2 1/2\" tipo L (2\" da más de 2.4 m/s)", E15,
  `V(2") = ${vel(q15, DI('2"')).toFixed(3)} > 2.4 m/s → ${s15.nom} (${s15.d.toFixed(3)} mm)`, `ASTM B88 tipo L vía CDA; V máx ${CASA(9784)}`, "secundaria",
  "HIDRO.tramos[0].d", s15.d, 0.01);

/* =========================================================================================================== CASO 16 · lavaojos sin regadera (H-195) */
const E16 = "sólo lavaojos_solo×2 (lavaojos fijo sin regadera); sin tramos";
fila("CM.hidro.16.a", "dos lavaojos fijos: 2 × 0.4 gal/min fuera de Hunter", E16,
  "2 × 0.4 gpm × 0.0630902 = 0.050472 L/s", "ANSI Z358.1-1990 vía carta OSHA 22-nov-1993 (SECUNDARIA; ratificar con Z358.1-2014)", "secundaria",
  "HIDRO.Qtotal", 2 * Q_LAVAOJOS, "0.05%");
fila("CM.hidro.16.b", "volumen para 15 min de los dos lavaojos", E16,
  "2 × 0.4 gpm × 15 min × 3.785411784 = 45.42 L", "ANSI Z358.1 vía OSHA (secundaria): 15 min, el mismo periodo que la regadera (criterio de la casa para el lavaojos fijo)", "secundaria",
  "HIDRO.volEmerg", 2 * 0.4 * 15 * GAL_L, 0.01);

/* ------------------------------------------------------------------ salida */
const ids = new Set();
for (const f of filas) { if (ids.has(f.id)) throw new Error(`id repetido ${f.id}`); ids.add(f.id); }
console.log(`hidro.calc.mjs · ${filas.length} filas (${filas.filter((f) => f.estado === "vigente").length} vigentes, ${filas.filter((f) => /^fase2/.test(f.estado)).length} fase2)\n`);
for (const f of filas) console.log(`${f.id.padEnd(15)} ${String(f.esperado).padStart(12)}  ±${String(f.tolerancia).padEnd(6)} ${f.estado.padEnd(12)} ${f.expresion}`);
console.log("\nIntermedios del fixture:", JSON.stringify({ q72, q20, d2: s1.d, d15: s2.d, J1, J2, hf1, hf2, hfTotal, cdtCasa, kW1, presMinIPC, cdtIPC, kWipc, umCalIPC, qCalIPC, kWcalIPC, udIPC, q72t, q20t, hf1t, hf2t, cdt14 }, null, 1));

if (process.argv.includes("--csv")) {
  const cab = ["id", "descripcion", "entradas", "formula", "fuente", "caracter", "expresion", "esperado", "tolerancia", "estado", "calculado_por"];
  const esc = (v) => { const s = String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const csv = [cab.join(","), ...filas.map((f) => cab.map((k) => esc(f[k])).join(","))].join("\n") + "\n";
  const out = path.join(path.dirname(fileURLToPath(import.meta.url)), "hidro.csv");
  fs.writeFileSync(out, csv, "utf8");
  console.log(`\nescrito ${out}`);
}
