#!/usr/bin/env node
/* parches/casos-a-mano/aire.calc.mjs · Fase 1 · motor AIRE COMPRIMIDO (SuiteEmp rev 2.9.24)
   Cálculo INDEPENDIENTE de los casos a mano: NO carga index.html ni cifrasMotor ni el esperado de regresión.
   Reimplementa la cadena física (gas ideal, Darcy-Weisbach con Haaland) y los criterios de la casa que el motor
   declara (cada uno citado con su renglón de index.html), y produce los esperados de la hoja aire.csv.
   Uso:  node parches/casos-a-mano/aire.calc.mjs          → imprime los esperados por caso
         node parches/casos-a-mano/aire.calc.mjs --csv    → escribe parches/casos-a-mano/aire.csv

   FUENTES
   · ISO 1217:2009 §3.4.1 caudal volumétrico real referido a la succión; §3.4.3 caudal normalizado; Anexo C (FAD de catálogo
     a 7 bar). Texto: parches/normas-texto/ISO-1217-2009_muestra-oficial.txt (primaria).
   · ISO 7183:2007 Tabla 1 (referencia 20 °C, 100 kPa) y Tabla 2 opción A1: entrada 35 °C, 700 kPa(e), 100 % del caudal
     nominal → en A1 el factor del secador es 1.0 por definición; fuera de A1 la norma NO da factores (son del fabricante).
     Texto: parches/normas-texto/ISO-7183-2007_muestra-oficial.txt (primaria). → H-215.
   · ISO 8573-1:2010 clases [partícula.agua.aceite]; texto en parches/normas-texto/ISO-8573-1-2010_muestra-oficial.txt.
   · ASTM B88 tubo de cobre tipo L: DI = DE − 2·pared; DE = nominal + 1/8"; pared tipo L (in): ½ 0.040, ¾ 0.045, 1 0.050,
     1¼ 0.055, 1½ 0.060, 2 0.070, 2½ 0.080, 3 0.090, 4 0.110 (dimensiones públicas de la norma; index.html:9765 TUB_AGUA.cobre
     trae los mismos DI). → H-218.
   · Receptor: V = 0.25·qc·p1/(fmax·(pU−pL)) [V L, qc L/s, p1 bar(a), fmax ciclos/s]; Atlas Copco, «Appropriate compressed air
     distribution», https://www.atlascopco.com/en-us/compressors/wiki/compressed-air-articles/compressed-air-distribution
     (guía de fabricante: SECUNDARIA). Con 15 arranques/h → fmax = 15/3600 s⁻¹ → V = qc·240·p1/(4·Δp), que es la forma de
     index.html:6927. → H-216 (tope silencioso de 5,000 L, index.html:6929).
   · Física de memoria (libro de texto): ρ = p/(R·T), R = 287.05 J/(kg·K); Darcy-Weisbach Δp/L = f·ρ·V²/(2·D); f de Haaland
     (1983) explícito, Colebrook iterado sólo de referencia; presión atmosférica por altitud (ASHRAE Fundamentals 2021 cap. 1
     ec. 3): p = 101.325·(1 − 2.25577e-5·z)^5.2559, Tijuana z = 149 m.
   · CRITERIOS DE LA CASA (sin norma; se citan por renglón de index.html y se vigilan sin darlos por norma):
     curva de simultaneidad por número de puntos (6875-6876; H-217, decisión 3 del dueño: se declara, no se mueve);
     fugas 10 % y reserva 20 % por omisión (6826-6827); caída objetivo de red 0.30 bar (6896); caída de secador 0.20/0.35 bar
     y de filtros 0.25 (aceite > 1) / 0.35 (aceite ≤ 1) + 0.15 con carbón (6816-6819, 6895); FAD corregido −5 %/bar sobre
     7 bar (6903); catálogo de compresores de la casa con FAD a 7 bar (6797-6812); exento de aceite sólo en clase 1.2.1 (6904);
     15 arranques/h y banda de 1.0 bar (6922-6923); lista comercial de tanques (6928); purga del desecante 15 % del caudal
     tratado (6819, 6890); factores del secador fT/fP (6936-6937; H-215); DI de cédula 40 para todo material (6792-6793;
     H-218); longitud equivalente 1.4 (6955); velocidad máxima 8 m/s troncal y 15 m/s ramal, cada tramo con la mitad de la
     caída objetivo (6981-6982); ramal = 40 % del FAD (6982; H-222); potencia específica 7.0 kW/(m³/min) fija y 6.2 con VSD,
     +7 %/bar (6992-6993); secador 0.11 / 0.05 kW por m³/min (6816-6818); costo de fugas proporcional al FAD (6995; H-219b). */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/* ---------- física ---------- */
const R_AIRE = 287.05, MU = 1.85e-5;                                  // J/(kg·K); Pa·s (criterio de la casa, index.html:6951)
const pAtmDe = (z) => 101.325 * Math.pow(1 - 2.25577e-5 * z, 5.2559); // kPa
const P_ATM = pAtmDe(149);                                             // Tijuana, 149 m (SITES.tijuana)
const rhoDe = (barMan, tC, pAtm) => (barMan * 100 + pAtm) * 1000 / (R_AIRE * (tC + 273.15));
const haaland = (Re, rr) => { if (Re < 2300) return 64 / Math.max(Re, 1); const inv = -1.8 * Math.log10(Math.pow(rr / 3.7, 1.11) + 6.9 / Re); return 1 / (inv * inv); };
const colebrook = (Re, rr) => { let f = 0.02; for (let i = 0; i < 80; i++) { const inv = -2 * Math.log10(rr / 3.7 + 2.51 / (Re * Math.sqrt(f))); f = 1 / (inv * inv); } return f; };
/* Un tramo: caudal de aire libre (L/min a 101.325 kPa) llevado a la presión de línea, velocidad, Re, f, Pa/m y Δp en bar. */
function tramo(QfadLmin, dMm, L, pManBar, tC, epsMm, Leq) {
  const pAbs = pManBar * 100 + P_ATM;                                  // kPa
  const rho = rhoDe(pManBar, tC, P_ATM);
  const Q = QfadLmin / 60000 * (101.325 / pAbs);                        // m³/s en línea (misma T: sólo corrección por presión)
  const D = dMm / 1000, A = Math.PI * D * D / 4, V = Q / A;
  const Re = rho * V * D / MU, rr = epsMm / 1000 / D;
  const f = haaland(Re, rr), fC = colebrook(Re, rr);
  const Pam = f * rho * V * V / (2 * D), PamC = fC * rho * V * V / (2 * D);
  return { rho, Q, V, Re, f, fC, Pam, PamC, dPbar: Pam * L * Leq / 1e5 };
}
/* Primer diámetro de la lista que cumple velocidad y su parte de la caída (index.html:6969-6976). */
function dimensionar(QfadLmin, L, pMan, tC, eps, diams, vMax, dPmax, Leq) {
  for (const [d, nom] of diams) { const r = tramo(QfadLmin, d, L, pMan, tC, eps, Leq); if (r.V <= vMax && r.dPbar <= dPmax) return { d, nom, ...r }; }
  const [d, nom] = diams[diams.length - 1]; return { d, nom, tope: true, ...tramo(QfadLmin, d, L, pMan, tC, eps, Leq) };
}

/* ---------- datos de la casa (citados) ---------- */
const CLASES = {                                                       // ISO 8573-1:2010 [partícula.agua.aceite]; secador/carbón: casa (index.html:6741-6752)
  "1.2.1": { aceite: 1, carbon: true, secador: "desecante" },
  "1.4.1": { aceite: 1, carbon: true, secador: "refrigerativo" },
  "2.4.2": { aceite: 2, carbon: false, secador: "refrigerativo" },
};
const SECADOR = { refrigerativo: { dP: 0.2, perdida: 0, kWm3: 0.11 }, desecante: { dP: 0.35, perdida: 0.15, kWm3: 0.05 } }; // index.html:6816-6819
const COMPRESORES = [                                                  // catálogo de la casa, FAD a 7 bar (index.html:6797-6812)
  ["cp-7.5", 10, 1150, false, false], ["cp-11", 15, 1750, false, false], ["cp-15", 20, 2400, false, false], ["cp-18v", 25, 3050, true, false],
  ["cp-22v", 30, 3650, true, false], ["cp-30v", 40, 5100, true, false], ["cp-37v", 50, 6300, true, false], ["cp-45v", 60, 7700, true, false],
  ["cp-55v", 75, 9500, true, false], ["cp-75v", 100, 13000, true, false],
  ["cpo-22", 30, 3400, true, true], ["cpo-37", 50, 5900, true, true], ["cpo-55", 75, 8900, true, true],
].map(([id, hp, fad7, vsd, exento]) => ({ id, hp, fad7, vsd, exento }));
const TANQUES = [200, 300, 500, 750, 1000, 1500, 2000, 3000, 4000, 5000];   // index.html:6928
const DIAM_SCH40 = [[10.9, '3/8"'], [15.8, '1/2"'], [21.0, '3/4"'], [26.6, '1"'], [35.1, '1 1/4"'], [40.9, '1 1/2"'], [52.5, '2"'], [62.7, '2 1/2"'], [77.9, '3"'], [102.3, '4"'], [128.2, '5"'], [154.1, '6"']]; // index.html:6792-6793 (cédula 40 para todo material)
/* ASTM B88 tipo L: DI = (nominal + 1/8 − 2·pared)·25.4 */
const B88_L = [["1/2", 0.040], ["3/4", 0.045], ["1", 0.050], ["1 1/4", 0.055], ["1 1/2", 0.060], ["2", 0.070], ["2 1/2", 0.080], ["3", 0.090], ["4", 0.110]]
  .map(([nom, pared]) => { const n = nom.split(" ").reduce((a, x) => a + (x.includes("/") ? x.split("/")[0] / x.split("/")[1] : +x), 0); return [+((n + 0.125 - 2 * pared) * 25.4).toFixed(3), nom + '"']; });
const EPS = { aluminio: 0.0015, inox_304: 0.0015, cobre: 0.0015, acero_gal: 0.15, acero_neg: 0.045 }; // mm, index.html:6779-6788
const simulCasa = (n) => n <= 1 ? 1 : n <= 3 ? 0.95 : n <= 6 ? 0.85 : n <= 10 ? 0.75 : n <= 20 ? 0.65 : n <= 40 ? 0.55 : 0.50; // index.html:6875-6876 (H-217)
const CASA = { fugas: 0.10, reserva: 0.20, dPred: 0.30, corrPorBar: 0.05, arranquesH: 15, dPt: 1.0, Leq: 1.4, vMaxTroncal: 8, vMaxRamal: 15, ramalFrac: 0.4, kWesp: 7.0, kWespVsd: 6.2, kWporBar: 0.07, horas: 3500, tarifa: 2.85 };
/* H-215 (cerrado 25-sep-2026, aire v3): los factores de memoria fT (0.92/0.83/0.72) y fP (0.9 + 0.03/bar) salieron de la suite.
   El secador va a la capacidad nominal de ISO 7183:2007 Tabla 2 opción A1 (35 °C, 7 bar(e)), factor 1.0, sobre TODO el caudal del
   compresor; fuera de A1 la corrección es del fabricante (pendiente, con aviso). */

/* ---------- cadena de cálculo ---------- */
function calcular(c) {
  const cls = CLASES[c.clase], sec = SECADOR[cls.secador], tC = c.temp ?? 35, pUso = c.presionUso ?? 6;
  const lista = c.consumos.map((x) => ({ ...x, pico: x.cant * x.lmin, medio: x.cant * x.lmin * x.uso }));
  const nPuntos = lista.reduce((a, x) => a + x.cant, 0), pico = lista.reduce((a, x) => a + x.pico, 0), medio = lista.reduce((a, x) => a + x.medio, 0);
  const simul = simulCasa(nPuntos), demanda = Math.max(medio, pico * simul);
  const fugas = demanda * CASA.fugas, conFugas = demanda + fugas, reserva = conFugas * CASA.reserva, fadSinPurga = conFugas + reserva;
  const purga = fadSinPurga * sec.perdida / (1 - sec.perdida), fad = fadSinPurga + purga;
  const dPfiltros = (cls.aceite <= 1 ? 0.35 : 0.25) + (cls.carbon ? 0.15 : 0);
  const pDescarga = pUso + CASA.dPred + sec.dP + dPfiltros;
  const corrP = 1 - (pDescarga - 7) * CASA.corrPorBar;
  const exento = cls.aceite <= 1 && c.clase === "1.2.1";
  const pool = COMPRESORES.filter((k) => k.exento === exento).map((k) => ({ ...k, fadReal: k.fad7 * corrP }));
  const principal = pool.find((k) => k.fadReal >= fad) || pool[pool.length - 1];
  const cubre = principal.fadReal >= fad;
  const nUnidades = cubre ? 1 : Math.ceil(fad / principal.fadReal), totalUnidades = nUnidades + (c.redundancia === "n1" ? 1 : 0);
  const tCiclo = 3600 / CASA.arranquesH, qc = principal.fadReal / 60;
  const vTeorico = 0.25 * qc * (P_ATM / 100) / ((1 / tCiclo) * CASA.dPt);        // Atlas Copco: V = 0.25·qc·p1/(fmax·Δp)
  const tanqueUnit = TANQUES.find((t) => t >= vTeorico) || 5000;                  // el mayor de la lista comercial de la casa
  const nTanques = Math.max(1, Math.ceil(vTeorico / tanqueUnit));                 // H-216 (cerrado 25-sep-2026): varios en paralelo, nunca menor que el teórico
  const tanqueHoy = tanqueUnit * nTanques;                                        // capacidad instalada
  const capSecadorA1 = principal.fadReal * nUnidades;                             // ISO 7183 Tabla 2 A1: factor 1.0 sobre el caudal del compresor (H-215)
  const enA1 = tC === 35 && Math.abs(pDescarga - 7) < 1e-9;
  const eps = EPS[c.material], diams = c.material === "cobre" ? { hoy: DIAM_SCH40, b88: B88_L } : { hoy: DIAM_SCH40 };
  const troncal = dimensionar(fad, c.Lp, pDescarga, tC, eps, diams.hoy, CASA.vMaxTroncal, CASA.dPred / 2, CASA.Leq);
  const ramal = dimensionar(fad * CASA.ramalFrac, c.Lr, pDescarga, tC, eps, diams.hoy, CASA.vMaxRamal, CASA.dPred / 2, CASA.Leq);
  const troncalB88 = diams.b88 ? dimensionar(fad, c.Lp, pDescarga, tC, eps, diams.b88, CASA.vMaxTroncal, CASA.dPred / 2, CASA.Leq) : null;
  const rho = rhoDe(pDescarga, tC, P_ATM);
  const kWesp = principal.vsd ? CASA.kWespVsd : CASA.kWesp, fCorr = 1 + (pDescarga - 7) * CASA.kWporBar;
  const kWoper = fad / 1000 * kWesp * fCorr + capSecadorA1 / 1000 * sec.kWm3;
  const mxnAno = kWoper * CASA.horas * CASA.tarifa, mxnFugas = fugas / fad * mxnAno;
  /* H-219b: la energía y las fugas se pagan sobre lo que se consume (medio + fugas), no sobre el FAD de diseño con reserva. */
  const kWmedio = (medio * (1 + CASA.fugas)) / 1000 * kWesp * fCorr, mxnAnoMedio = kWmedio * CASA.horas * CASA.tarifa, mxnFugasMedio = (medio * CASA.fugas) / (medio * (1 + CASA.fugas)) * mxnAnoMedio;
  return { cls, sec, tC, pUso, lista, nPuntos, pico, medio, simul, demanda, fugas, conFugas, reserva, fadSinPurga, purga, fad, dPfiltros, pDescarga, corrP, exento, principal, cubre,
    nUnidades, totalUnidades, tCiclo, qc, vTeorico, tanqueUnit, nTanques, tanqueHoy, capSecadorA1, enA1, rho, troncal, ramal, troncalB88, kWesp, fCorr, kWoper, mxnAno, mxnFugas, kWmedio, mxnAnoMedio, mxnFugasMedio };
}

/* ---------- casos ---------- */
const FIXTURE = [{ nombre: "Sopleteo", tipo: "generico", cant: 2, lmin: 400, bar: 6, uso: 0.5 }, { nombre: "Actuadores", tipo: "generico", cant: 4, lmin: 250, bar: 6, uso: 0.3 }];
const CASOS = {
  1: { titulo: "fixture de regresión: 2×400 L/min uso 0.5 + 4×250 uso 0.3, 6 bar, clase 2.4.2, aluminio 60 m troncal / 0 m ramal, 35 °C, Tijuana", clase: "2.4.2", presionUso: 6, temp: 35, material: "aluminio", Lp: 60, Lr: 0, consumos: FIXTURE },
  2: { titulo: "clase 1.4.1: 12 instrumentos ×20 L/min uso 0.8 + 3 pistolas ×180 uso 0.1, 6.5 bar, aluminio 100/40 m, 30 °C", clase: "1.4.1", presionUso: 6.5, temp: 30, material: "aluminio", Lp: 100, Lr: 40, consumos: [{ nombre: "Instrumentos", tipo: "instrum", cant: 12, lmin: 20, bar: 5.5, uso: 0.8 }, { nombre: "Pistolas", tipo: "pistola", cant: 3, lmin: 180, bar: 6, uso: 0.1 }] },
  3: { titulo: "clase 1.2.1 grado médico: 10×300 L/min uso 0.5, 6 bar, inox 304L 50/30 m, 35 °C (desecante con purga, exento de aceite)", clase: "1.2.1", presionUso: 6, temp: 35, material: "inox_304", Lp: 50, Lr: 30, consumos: [{ nombre: "Proceso", tipo: "generico", cant: 10, lmin: 300, bar: 6, uso: 0.5 }] },
  4: { titulo: "cobre tipo L 55 m troncal con los consumos del fixture (DI real de ASTM B88 contra cédula 40)", clase: "2.4.2", presionUso: 6, temp: 35, material: "cobre", Lp: 55, Lr: 0, consumos: FIXTURE },
  5: { titulo: "una línea de 9,000 L/min uso 1.0, 6 bar, aluminio 80 m (tanque teórico arriba del tope de 5,000 L)", clase: "2.4.2", presionUso: 6, temp: 35, material: "aluminio", Lp: 80, Lr: 0, consumos: [{ nombre: "Linea grande", tipo: "generico", cant: 1, lmin: 9000, bar: 6, uso: 1 }] },
  6: { titulo: "50 puntos ×100 L/min uso 0.25, 6 bar, aluminio 30 m (tramo > 40 puntos de la curva; compresor VSD)", clase: "2.4.2", presionUso: 6, temp: 35, material: "aluminio", Lp: 30, Lr: 0, consumos: [{ nombre: "Puntos", tipo: "generico", cant: 50, lmin: 100, bar: 6, uso: 0.25 }] },
  7: { titulo: "clase 1.2.1, una línea de 6,000 L/min uso 1.0 con redundancia N+1 (dos unidades exentas en paralelo + relevo)", clase: "1.2.1", presionUso: 6, temp: 35, material: "inox_304", Lp: 30, Lr: 0, consumos: [{ nombre: "Linea", tipo: "generico", cant: 1, lmin: 6000, bar: 6, uso: 1 }], redundancia: "n1" },
  /* HALLAZGO NUEVO (no está en AUDITORIA §3.10; el integrador le asigna número): cuando ningún compresor lubricado cubre, la suite
     toma el último de TODA la lista (index.html:6905-6907: pool = exento ? sólo exentos : todos), que es el cpo-55 EXENTO de
     75 HP y 8,900 L/min, y no el cp-75v lubricado de 100 HP y 13,000 L/min: para una planta 2.4.2 propone 3 exentos (3×2,340,000)
     en vez de 3 lubricados (3×1,935,000) y el tanque teórico baja de 13,103 a 8,970 L. Filas h, i, k en estado fase2:H-nuevo. */
  8: { titulo: "clase 2.4.2, una línea de 20,000 L/min uso 1.0 con redundancia N+1: el pool lubricado no se filtra y el «mayor de la lista» es un exento", clase: "2.4.2", presionUso: 6, temp: 35, material: "aluminio", Lp: 30, Lr: 0, consumos: [{ nombre: "Linea", tipo: "generico", cant: 1, lmin: 20000, bar: 6, uso: 1 }], redundancia: "n1", poolSinFiltrar: true },
};
const r = (x, d) => Number(Number(x).toFixed(d));
const entradasDe = (c) => `clase ${c.clase}; presionUso ${c.presionUso} bar; tempEntrada ${c.temp} °C; material ${c.material}; Lprincipal ${c.Lp} m; Lramales ${c.Lr} m; fugas 10 % y reserva 20 % (defaultAire); arranquesHora 15; dPtanque 1.0 bar; horas 3500; tarifa 2.85; redundancia ${c.redundancia || "ninguna"}; sitio Tijuana (149 m, pAtm ${P_ATM.toFixed(3)} kPa); consumos: ${c.consumos.map((x) => `${x.nombre} ${x.cant}×${x.lmin} L/min a ${x.bar} bar uso ${x.uso}`).join(" + ")}`;

/* Filas de la hoja: [id, descripcion, formula, fuente, caracter, expresion, esperado, tolerancia, estado] */
function filasDe(n, c, A) {
  const F = [];
  const fila = (id, descripcion, formula, fuente, caracter, expresion, esperado, tolerancia, estado = "vigente") => F.push({ id: `CM.aire.${n}.${id}`, descripcion, entradas: entradasDe(c), formula, fuente, caracter, expresion, esperado, tolerancia, estado });
  const CASA_SRC = (l, que) => `criterio de la casa (index.html:${l}) · ${que}`;
  const T = A.troncal, Rm = A.ramal, L = A.lista.map((x) => `${x.cant}×${x.lmin}×${x.uso}`).join(" + ");
  if (n === 1) {
    fila("a", "puntos de consumo", `Σ cant = ${A.lista.map((x) => x.cant).join(" + ")} = ${A.nPuntos}`, "captura", "primaria", "AIRE.nPuntos", A.nPuntos, 0);
    fila("b", "pico sin simultaneidad (L/min)", `Σ cant·lmin = ${A.lista.map((x) => `${x.cant}×${x.lmin}`).join(" + ")} = ${A.pico}`, "captura", "primaria", "AIRE.pico", A.pico, 0.01);
    fila("c", "consumo medio con factor de uso (L/min)", `Σ cant·lmin·uso = ${L} = ${A.medio}`, "captura", "primaria", "AIRE.medio", A.medio, 0.01);
    fila("s", "simultaneidad automática con 6 puntos · decisión 3 del dueño (PLAN-CRITICOS §4): la curva queda como criterio de la casa declarado en pantalla, memoria y PDF SIN mover números (H-217, cerrado 25-sep-2026)", `curva de la casa: ≤1→1.00, ≤3→0.95, ≤6→0.85, ≤10→0.75, ≤20→0.65, ≤40→0.55, >40→0.50; n = ${A.nPuntos} → ${A.simul}`, CASA_SRC("6875-6876", "curva de simultaneidad sin fuente, declarada (H-217)"), "memoria", "AIRE.simul", A.simul, 1e-6);
  }
  fila("d", "demanda de proceso (L/min)", `máx(medio, pico·simul) = máx(${A.medio}, ${A.pico}×${A.simul} = ${r(A.pico * A.simul, 3)}) = ${r(A.demanda, 3)}`, CASA_SRC("6881", "mayor entre medio y pico con simultaneidad de la casa"), "memoria", "AIRE.demandaProceso", r(A.demanda, 3), 0.01);
  fila("e", "FAD requerido (L/min de aire libre)", `demanda ${r(A.demanda, 3)} × (1 + fugas 0.10) = ${r(A.conFugas, 3)}; × (1 + reserva 0.20) = ${r(A.fadSinPurga, 3)}${A.sec.perdida ? `; + purga ${r(A.fadSinPurga, 3)}×0.15/0.85 = ${r(A.purga, 3)}` : ""} → ${r(A.fad, 3)}`, CASA_SRC("6882-6891", "fugas 10 %, reserva 20 % y purga 15 % del desecante; ISO 1217:2009 §3.4.3 define el caudal referido a la succión"), "memoria", "AIRE.fadRequerido", r(A.fad, 3), 0.05);
  if (A.sec.perdida) fila("e2", "purga de regeneración del desecante (L/min)", `${r(A.fadSinPurga, 3)} × 0.15 / (1 − 0.15) = ${r(A.purga, 3)}`, CASA_SRC("6819 y 6890", "15 % del caudal tratado"), "memoria", "AIRE.purgaLmin", r(A.purga, 3), 0.1);
  fila("f", "presión de descarga (bar man.)", `pUso ${A.pUso} + red 0.30 + secador ${A.sec.dP} + filtros ${A.dPfiltros} (${A.cls.aceite <= 1 ? "0.35 aceite ≤ 1" : "0.25 aceite > 1"}${A.cls.carbon ? " + 0.15 carbón" : ""}) = ${r(A.pDescarga, 3)}`, CASA_SRC("6895-6897", "caídas objetivo de red, secador y filtración"), "memoria", "AIRE.pDescarga", r(A.pDescarga, 3), 1e-3);
  fila("g", "corrección del FAD de catálogo por presión", `1 − (${r(A.pDescarga, 3)} − 7) × 0.05 = ${r(A.corrP, 5)}`, CASA_SRC("6903", "−5 % por bar sobre los 7 bar de catálogo (ISO 1217 Anexo C)"), "memoria", "AIRE.corrP", r(A.corrP, 5), 1e-4);
  const POOL = c.poolSinFiltrar ? "fase2:H-nuevo" : "vigente";
  const poolNota = c.poolSinFiltrar ? " · HOY la suite da cpo-55 EXENTO 75 HP (8,900×corrP = 9,011 L/min): el pool lubricado no se filtra por tipo y «el mayor de la lista» es el último exento (index.html:6905-6907); hallazgo nuevo sin número" : "";
  fila("h", `compresor seleccionado (HP)${A.exento ? " · pool exento de aceite (clase 1.2.1)" : ""}${poolNota}`, `primero del catálogo${A.exento ? " exento" : " lubricado"} con fad7×corrP ≥ ${r(A.fad, 1)}: ${A.principal.id} ${A.principal.fad7}×${r(A.corrP, 5)} = ${r(A.principal.fadReal, 3)} → ${A.principal.hp} HP${A.cubre ? "" : " (el mayor de su pool; no cubre)"}`, CASA_SRC("6797-6812 y 6904-6907", "catálogo de compresores de la casa y regla de selección"), "memoria", "AIRE.principal.hp", A.principal.hp, 0, POOL);
  fila("i", `FAD real del compresor a la presión de descarga (L/min)${poolNota}`, `${A.principal.fad7} × ${r(A.corrP, 5)} = ${r(A.principal.fadReal, 3)}`, CASA_SRC("6905", "fad7·corrP"), "memoria", "AIRE.principal.fadReal", r(A.principal.fadReal, 3), 0.05, POOL);
  fila("j", `unidades en servicio${c.poolSinFiltrar ? " (con el cpo-55 de hoy también salen 3: ceil(26400/9011) = 3)" : ""}`, A.cubre ? "una unidad cubre la demanda → 1" : `ceil(${r(A.fad, 1)} / ${r(A.principal.fadReal, 1)}) = ${A.nUnidades}`, CASA_SRC("6912", "ceil(FAD/fadReal) cuando no cubre"), "memoria", "AIRE.nUnidades", A.nUnidades, 0);
  if (c.redundancia === "n1") fila("j2", "unidades totales con redundancia N+1", `${A.nUnidades} + 1 = ${A.totalUnidades}`, CASA_SRC("6913-6914", "N+1 agrega una unidad"), "memoria", "AIRE.totalUnidades", A.totalUnidades, 0);
  if (A.exento) fila("j3", "clase 1.2.1 obliga a compresor exento de aceite (1 = sí)", "aceite ≤ 1 y clase 1.2.1 → exento", CASA_SRC("6904", "criterio de la casa; ISO 8573-1:2010 sólo define la clase de aceite (H-220)"), "memoria", "AIRE.exento ? 1 : 0", 1, 0);
  fila("k", `volumen teórico del tanque pulmón (L)${poolNota ? " · hoy con el cpo-55: 8,970 L" : ""}`, `V = 0.25·qc·p1/(fmax·Δp) con qc ${r(A.qc, 4)} L/s (${r(A.principal.fadReal, 1)}/60), p1 ${r(P_ATM / 100, 5)} bar(a), fmax 15/3600 s⁻¹, Δp 1.0 bar → 0.25×${r(A.qc, 4)}×${r(P_ATM / 100, 5)}/(${r(1 / A.tCiclo, 7)}×1.0) = ${r(A.vTeorico, 2)}`, "Atlas Copco, «Appropriate compressed air distribution», https://www.atlascopco.com/en-us/compressors/wiki/compressed-air-articles/compressed-air-distribution (fórmula del receptor; 15 arranques/h y banda 1.0 bar son criterio de la casa index.html:6922-6923)", "secundaria", "AIRE.vTeorico", r(A.vTeorico, 2), 0.5, POOL);
  if (A.vTeorico <= 5000) fila("l", "tanque comercial inmediato superior (L)", `primero de [200, 300, 500, 750, 1000, 1500, 2000, 3000, 4000, 5000] ≥ ${r(A.vTeorico, 1)} → ${A.tanqueHoy}`, CASA_SRC("6928-6929", "lista comercial de la casa"), "memoria", "AIRE.tanque", A.tanqueHoy, 0);
  else {
    fila("l", `capacidad de tanque instalada (L): el teórico rebasa el mayor de la lista comercial (5,000 L) → ${A.nTanques} tanques de 5,000 L en paralelo, nunca menor que el teórico (H-216, cerrado 25-sep-2026; antes se truncaba a 5,000 en silencio)`, `ceil(${r(A.vTeorico, 1)} / 5000) = ${A.nTanques} × 5000 = ${A.tanqueHoy}`, "fórmula del receptor Atlas Copco (URL en fila k); lista comercial de la casa (index.html:6928)", "secundaria", "AIRE.tanque", A.tanqueHoy, 0, POOL);
    fila("l2", "número de tanques en paralelo", `ceil(${r(A.vTeorico, 1)} / 5000)`, "H-216 (varios en paralelo)", "secundaria", "AIRE.nTanques", A.nTanques, 0, POOL);
    fila("l3", "capacidad instalada no menor al teórico (1 = cumple)", `${A.tanqueHoy} ≥ ${r(A.vTeorico, 1)} → 1`, "H-216", "secundaria", "AIRE.tanque >= AIRE.vTeorico ? 1 : 0", 1, 0, POOL);
  }
  fila("m", `capacidad del secador (L/min): todo el caudal del compresor (${A.nUnidades} × ${r(A.principal.fadReal, 3)}) a la capacidad nominal de ISO 7183:2007 Tabla 2 opción A1 (35 °C, 7 bar(e), 100 % del caudal): factor 1.0${A.enA1 ? "" : "; fuera del punto A1 la norma no da factores: corrección del fabricante pendiente, con aviso"} (H-215; antes FAD requerido / (fT × fP) de memoria)`, `${A.nUnidades} × ${r(A.principal.fadReal, 3)} × 1.0 = ${r(A.capSecadorA1, 3)}`, "ISO 7183:2007 Tabla 2 opción A1 (parches/normas-texto/ISO-7183-2007_muestra-oficial.txt); PLAN-CRITICOS H-215 (caudal del compresor)", "primaria", "AIRE.capSecador", r(A.capSecadorA1, 3), 1, POOL);
  fila("m2", `el motor declara si el punto de operación es A1 (1) o si la corrección del fabricante queda pendiente (0)${A.enA1 ? "" : " · aquí pendiente"}`, `${A.tC} °C ${A.enA1 ? "=" : "≠"} 35 o ${r(A.pDescarga, 3)} bar ${A.enA1 ? "=" : "≠"} 7`, "ISO 7183:2007 Tabla 2 opción A1", "primaria", "AIRE.enA1 ? 1 : 0", A.enA1 ? 1 : 0, 0);
  fila("n", "densidad del aire en línea (kg/m³)", `ρ = p/(R·T) = (${r(A.pDescarga, 3)}×100 + ${r(P_ATM, 3)})×1000 / (287.05 × ${r(A.tC + 273.15, 2)}) = ${r(A.rho, 4)}`, "gas ideal, R = 287.05 J/(kg·K); pAtm por altitud ASHRAE Fundamentals 2021 cap. 1 ec. 3 (memoria)", "memoria", "AIRE.rho", r(A.rho, 4), 1e-3);
  if (c.material !== "cobre") {
    fila("o", `troncal: diámetro interior elegido (mm) = ${T.nom} de cédula 40 (${c.material}: H-218 pide DI del fabricante; se vigila el valor de hoy)`, `primer DI de DIAM_AIRE con V ≤ 8 m/s y Δp ≤ 0.15 bar en ${c.Lp} m → ${T.nom} (${T.d} mm)`, CASA_SRC("6792-6793 y 6969-6981", "DI de cédula 40 para todo material; V ≤ 8 m/s; mitad de la caída objetivo"), "memoria", "AIRE.tramos[0].d", T.d, 0.01);
    fila("p", `troncal ${T.nom}: velocidad (m/s)`, `Q = ${r(A.fad, 2)}/60000 × 101.325/${r(A.pDescarga * 100 + P_ATM, 3)} = ${r(T.Q, 6)} m³/s; A = π·${T.d}²/4 mm² → V = ${r(T.V, 4)}`, "continuidad; caudal de aire libre a 101.325 kPa llevado a la presión de línea (referencia no declarada en la suite: H-219)", "memoria", "AIRE.tramos[0].V", r(T.V, 4), 1e-3);
    fila("q", `troncal ${T.nom}: gradiente de presión (Pa/m)`, `Re = ρVD/μ = ${Math.round(T.Re)}; ε/D = ${r(EPS[c.material] / T.d, 6)}; f Haaland = ${r(T.f, 5)} (Colebrook ${r(T.fC, 5)} → ${r(T.PamC, 3)} Pa/m de referencia); Δp/L = f·ρ·V²/(2D) = ${r(T.Pam, 3)}`, "Darcy-Weisbach con f de Haaland (1983); μ = 1.85e-5 Pa·s criterio de la casa (index.html:6951)", "memoria", "AIRE.tramos[0].Pam", r(T.Pam, 3), 0.05);
    fila("r", `troncal ${T.nom}: caída en ${c.Lp} m con 40 % de longitud equivalente (bar)`, `${r(T.Pam, 3)} × ${c.Lp} × 1.4 / 1e5 = ${r(T.dPbar, 5)}`, CASA_SRC("6955", "Leq 1.4 declarado"), "memoria", "AIRE.tramos[0].dPbar", r(T.dPbar, 5), 1e-4);
    fila("t", `ramal (40 % del FAD = ${r(A.fad * 0.4, 2)} L/min): diámetro interior elegido (mm) = ${Rm.nom}`, `primer DI con V ≤ 15 m/s y Δp ≤ 0.15 bar en ${c.Lr} m → ${Rm.nom} (${Rm.d} mm)`, CASA_SRC("6982", "ramal = 40 % del FAD sin fuente (H-222); V ≤ 15 m/s"), "memoria", "AIRE.tramos[1].d", Rm.d, 0.01);
    fila("u", `ramal ${Rm.nom}: velocidad (m/s)`, `Q = ${r(A.fad * 0.4, 2)}/60000 × 101.325/${r(A.pDescarga * 100 + P_ATM, 3)} = ${r(Rm.Q, 6)} m³/s; V = Q/A = ${r(Rm.V, 4)}`, "continuidad (misma referencia que la troncal)", "memoria", "AIRE.tramos[1].V", r(Rm.V, 4), 1e-3);
  } else {
    fila("o", `troncal en cobre tipo L ${c.Lp} m: DI real de ASTM B88 (mm) · hoy la suite usa cédula 40 (${T.nom} = ${T.d} mm, V ${r(T.V, 3)} m/s) y con el DI real de B88 el 1" da V ${r(tramo(A.fad, B88_L[2][0], c.Lp, A.pDescarga, A.tC, EPS.cobre, CASA.Leq).V, 3)} m/s > 8 → ${A.troncalB88.nom}`, `B88 tipo L 1¼": DE 1.375" − 2×0.055" = 1.265" = ${A.troncalB88.d} mm; V = ${r(A.troncalB88.V, 4)} m/s ≤ 8; Δp = ${r(A.troncalB88.dPbar, 5)} bar ≤ 0.15`, "ASTM B88 tubo de cobre tipo L (DE nominal + 1/8\", pared 0.055\" en 1¼\"); mismos DI en index.html:9765 TUB_AGUA.cobre", "primaria", "AIRE.tramos[0].d", A.troncalB88.d, 0.01, "fase2:H-218");
  }
  if (n === 1 || n === 2 || n === 6) {
    fila("v", `potencia de operación (kW) con potencia específica ${A.kWesp} kW/(m³/min)${A.principal.vsd ? " (VSD)" : ""} corregida ${r((A.pDescarga - 7) * 7, 2)} % por presión, más secador ${A.sec.kWm3} kW/(m³/min) sobre la capacidad del secador (ISO 7183 A1, H-215)`, `${r(A.fad / 1000, 5)} × ${A.kWesp} × ${r(A.fCorr, 5)} + ${r(A.capSecadorA1 / 1000, 5)} × ${A.sec.kWm3} = ${r(A.kWoper, 4)}`, CASA_SRC("6992-6993", "potencia específica y +7 %/bar sin fuente; se calcula sobre el FAD de diseño (H-219b)"), "memoria", "AIRE.kWoper", r(A.kWoper, 4), 0.01);
  }
  if (n === 1) {
    fila("w", "costo anual de energía (MXN) = kW × 3500 h × 2.85 MXN/kWh", `${r(A.kWoper, 4)} × 3500 × 2.85 = ${r(A.mxnAno, 1)}`, CASA_SRC("6994", "horas y tarifa capturadas (defaultAire)"), "memoria", "AIRE.mxnAno", r(A.mxnAno, 1), 5);
    fila("x", "costo anual de las fugas (MXN) = proporción de las fugas en el FAD × costo anual", `${r(A.fugas, 2)} / ${r(A.fad, 2)} × ${r(A.mxnAno, 1)} = ${r(A.mxnFugas, 1)}`, CASA_SRC("6995", "proporcional al FAD de diseño (H-219b)"), "memoria", "AIRE.mxnFugas", r(A.mxnFugas, 1), 5);
    fila("y", "potencia de operación sobre lo que se consume (medio + 10 % de fugas), sin reserva de crecimiento ni purga (kW) · hoy la suite la calcula sobre el FAD de diseño", `(${A.medio} × 1.10)/1000 × ${A.kWesp} × ${r(A.fCorr, 5)} = ${r(A.kWmedio, 4)}`, "H-219 (AUDITORIA §3.10): la energía y el costo de fugas se pagan sobre el consumo, no sobre el FAD de diseño; potencia específica de la casa", "memoria", "AIRE.kWoper", r(A.kWmedio, 2), 0.02, "fase2:H-219b");
    fila("z", "costo anual de las fugas sobre el consumo real (MXN)", `fugas ${r(A.medio * 0.1, 1)} / (${A.medio} × 1.10) × (${r(A.kWmedio, 4)} × 3500 × 2.85 = ${r(A.mxnAnoMedio, 1)}) = ${r(A.mxnFugasMedio, 1)}`, "H-219 (AUDITORIA §3.10); ≈ 52,800 MXN/año de energía contra 141,250 de hoy", "memoria", "AIRE.mxnFugas", r(A.mxnFugasMedio, 0), 10, "fase2:H-219b");
  }
  return F;
}

/* ---------- salida ---------- */
const AQUI = path.dirname(fileURLToPath(import.meta.url));
const todas = [];
for (const [n, c] of Object.entries(CASOS)) {
  const A = calcular(c);
  const F = filasDe(+n, c, A);
  todas.push(...F);
  console.log(`\n=== CM.aire.${n} · ${c.titulo}`);
  console.log(`  n ${A.nPuntos} · pico ${A.pico} · medio ${A.medio} · simul ${A.simul} · demanda ${r(A.demanda, 2)} · FAD ${r(A.fad, 2)} L/min${A.purga ? ` (purga ${r(A.purga, 2)})` : ""}`);
  console.log(`  pDescarga ${r(A.pDescarga, 3)} bar · corrP ${r(A.corrP, 5)} · ${A.principal.id} ${A.principal.hp} HP fadReal ${r(A.principal.fadReal, 2)} · unidades ${A.nUnidades}/${A.totalUnidades}`);
  console.log(`  tanque teórico ${r(A.vTeorico, 1)} L → hoy ${A.tanqueHoy} · secador A1 ${r(A.capSecadorA1 / 1000, 3)} m³/min${A.enA1 ? "" : " (corrección del fabricante pendiente)"}`);
  console.log(`  ρ ${r(A.rho, 4)} kg/m³ · troncal ${A.troncal.nom} ${A.troncal.d} mm V ${r(A.troncal.V, 4)} m/s ${r(A.troncal.Pam, 3)} Pa/m (Colebrook ${r(A.troncal.PamC, 3)}) Δp ${r(A.troncal.dPbar, 5)} bar · ramal ${A.ramal.nom} V ${r(A.ramal.V, 4)} m/s Δp ${r(A.ramal.dPbar, 5)}${A.troncalB88 ? ` · B88: ${A.troncalB88.nom} ${A.troncalB88.d} mm V ${r(A.troncalB88.V, 4)}` : ""}`);
  console.log(`  kWoper ${r(A.kWoper, 3)} · MXN/año ${r(A.mxnAno, 0)} · fugas ${r(A.mxnFugas, 0)} · sobre consumo: ${r(A.kWmedio, 3)} kW, ${r(A.mxnAnoMedio, 0)} MXN, fugas ${r(A.mxnFugasMedio, 0)}`);
  F.forEach((f) => console.log(`    ${f.estado === "vigente" ? " " : "²"} ${f.id.padEnd(14)} ${String(f.esperado).padStart(12)} ± ${String(f.tolerancia).padEnd(6)} ${f.expresion}`));
}
console.log(`\npAtm Tijuana ${r(P_ATM, 4)} kPa · B88 tipo L DI: ${B88_L.map((x) => `${x[1]} ${x[0]}`).join(", ")}`);
if (process.argv.includes("--csv")) {
  const cols = ["id", "descripcion", "entradas", "formula", "fuente", "caracter", "expresion", "esperado", "tolerancia", "estado", "calculado_por"];
  const q = (s) => `"${String(s).replace(/"/g, '""')}"`;
  const lineas = [cols.join(","), ...todas.map((f) => cols.map((k) => q(k === "calculado_por" ? "parches/casos-a-mano/aire.calc.mjs" : f[k])).join(","))];
  const out = path.join(AQUI, "aire.csv");
  fs.writeFileSync(out, lineas.join("\n") + "\n", "utf8");
  console.log(`\n${todas.length} filas → ${out}`);
}
